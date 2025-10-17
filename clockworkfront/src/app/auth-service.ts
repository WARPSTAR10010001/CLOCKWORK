import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { OverlayService } from './overlay-service';

type Role = 'admin' | 'mod' | 'user';

interface User {
  id: number;
  username?: string;
  role: Role;
  departmentId?: number | null;
  passwordReset?: boolean; // 👈 optional, falls du es im State brauchst
}

interface AuthStatus {
  loggedIn: boolean;
  user: User | null;
  exp?: number | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authStatusSubject = new BehaviorSubject<AuthStatus>({ loggedIn: false, user: null, exp: null });
  public authStatus$ = this.authStatusSubject.asObservable();

  // 👇 Route-Fix: zusammengeführtes Backend nutzt /api/login
  private baseUrl = 'http://localhost:4000/api';
  private tokenKey = 'clockwork_token';

  constructor(
    private http: HttpClient,
    private router: Router,
    private overlay: OverlayService
  ) {
    this.restoreSession();
  }

  private decodeJwt(token: string): any | null {
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
      return null;
    }
  }

  private toRole(apiRole: string | undefined): Role | null {
    if (!apiRole) return null;
    const r = apiRole.toUpperCase();
    if (r === 'ADMIN') return 'admin';
    if (r === 'MOD') return 'mod';
    if (r === 'USER') return 'user';
    return null;
  }

  private setSession(token: string, usernameFromForm?: string) {
    localStorage.setItem(this.tokenKey, token);
    const decoded = this.decodeJwt(token);
    if (!decoded) {
      this.clearSession();
      return;
    }
    const role = this.toRole(decoded.role);
    const user: User | null = role ? {
      id: Number(decoded.sub),
      username: usernameFromForm,
      role,
      departmentId: decoded.departmentId ?? null
    } : null;

    const exp = typeof decoded.exp === 'number' ? decoded.exp : null;
    const loggedIn = !!(user && (!exp || Date.now() / 1000 < exp));

    this.authStatusSubject.next({ loggedIn, user, exp });
  }

  private clearSession() {
    localStorage.removeItem(this.tokenKey);
    this.authStatusSubject.next({ loggedIn: false, user: null, exp: null });
  }

  private restoreSession() {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return this.clearSession();
    const decoded = this.decodeJwt(token);
    if (!decoded) return this.clearSession();
    const exp = typeof decoded.exp === 'number' ? decoded.exp : null;
    if (exp && Date.now() / 1000 >= exp) return this.clearSession();

    const role = this.toRole(decoded.role);
    const user: User | null = role ? {
      id: Number(decoded.sub),
      role,
      departmentId: decoded.departmentId ?? null,
    } : null;

    this.authStatusSubject.next({ loggedIn: !!user, user, exp });
  }

  checkStatus(): Observable<AuthStatus> {
    return of(this.authStatusSubject.value);
  }

  login(username: string, password: string): Observable<AuthStatus> {
    return this.http.post<{
      token: string;
      user?: { passwordReset?: boolean };
    }>(
      `${this.baseUrl}/auth/login`,
      { username, password },
      { withCredentials: true }
    ).pipe(
      tap((res) => {
        this.setSession(res.token, username);
        const status = this.authStatusSubject.value;

        if (status.loggedIn) {
          if (res.user?.passwordReset === true) {
            this.overlay.showOverlay('passwordReset', username);
          } else {
            this.overlay.showOverlay('success', `Willkommen, ${username}!`);
            this.router.navigate(['/years']);
          }
        }
      }),
      catchError((err) => {
        this.overlay.showOverlay('error', 'Login fehlgeschlagen.');
        this.clearSession();
        return of({ loggedIn: false, user: null, exp: null });
      }),
      tap(() => { }),
    ) as unknown as Observable<AuthStatus>;
  }

  logout(): void {
    this.clearSession();
    this.overlay.showOverlay('success', 'Erfolgreich abgemeldet.');
    this.router.navigate(['/auth']);
  }

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get currentUserRole(): Role | null {
    return this.authStatusSubject.value.user?.role ?? null;
  }

  isAdmin(): boolean {
    return this.currentUserRole === 'admin';
  }

  isMod(): boolean {
    return this.currentUserRole === 'mod';
  }

  isLoggedIn(): boolean {
    return !!this.authStatusSubject.value.loggedIn;
  }
}