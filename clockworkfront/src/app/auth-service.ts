import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { OverlayService } from './overlay-service';
import { catchError, map, take, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { VersionService } from './version-service';

type Role = 'admin' | 'mod' | 'user' | 'areaManager';
interface User {
  id: number;
  username?: string;
  role: Role;
  departmentId?: number | null;
  departmentIds?: number[];
  assignedDepartmentIds?: number[];
  passwordReset?: boolean;
}
interface AuthStatus { loggedIn: boolean; user: User | null; exp?: number | null; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authStatusSubject = new BehaviorSubject<AuthStatus>({ loggedIn: false, user: null, exp: null });
  public authStatus$ = this.authStatusSubject.asObservable();

  private baseUrl = environment.apiBase;
  private tokenKey = 'clockwork_token';

  constructor(
    private http: HttpClient,
    private router: Router,
    private overlay: OverlayService,
    private version: VersionService
  ) {
    this.restoreSession();
    this.ensurePasswordResetGate();
  }

  private decodeJwt(token: string): any | null {
    try { const p = token.split('.')[1]; return JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/'))); }
    catch { return null; }
  }

  private normalizeDepartmentIds(input: unknown): number[] {
    if (!Array.isArray(input)) return [];
    return Array.from(
      new Set(
        input
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value))
      )
    );
  }

  private toRole(apiRole?: string): Role | null {
    switch ((apiRole || '').toUpperCase()) {
      case 'ADMIN': return 'admin';
      case 'MOD': return 'mod';
      case 'USER': return 'user';
      case 'AREA_MANAGER': return 'areaManager';
      default: return null;
    }
  }

  private setSession(token: string, usernameFromForm?: string) {
    localStorage.setItem(this.tokenKey, token);
    const dec = this.decodeJwt(token); if (!dec) return this.clearSession();
    const role = this.toRole(dec.role);
    const user: User | null = role ? {
      id: Number(dec.sub),
      username: usernameFromForm,
      role,
      departmentId: dec.departmentId ?? null,
      departmentIds: this.normalizeDepartmentIds(dec.departmentIds),
      assignedDepartmentIds: this.normalizeDepartmentIds(dec.departmentIds)
    } : null;
    const exp = typeof dec.exp === 'number' ? dec.exp : null;
    const loggedIn = !!(user && (!exp || Date.now() / 1000 < exp));
    this.authStatusSubject.next({ loggedIn, user, exp });
  }

  private clearSession() {
    localStorage.removeItem(this.tokenKey);
    this.authStatusSubject.next({ loggedIn: false, user: null, exp: null });
  }

  private restoreSession() {
    const t = localStorage.getItem(this.tokenKey); if (!t) return this.clearSession();
    const dec = this.decodeJwt(t); if (!dec) return this.clearSession();
    if (dec.exp && Date.now() / 1000 >= dec.exp) return this.clearSession();
    const role = this.toRole(dec.role);
    const user: User | null = role ? {
      id: Number(dec.sub),
      role,
      departmentId: dec.departmentId ?? null,
      departmentIds: this.normalizeDepartmentIds(dec.departmentIds),
      assignedDepartmentIds: this.normalizeDepartmentIds(dec.departmentIds)
    } : null;
    this.authStatusSubject.next({ loggedIn: !!user, user, exp: dec.exp ?? null });
  }

  private fetchServerStatus(): Observable<{ loggedIn: boolean; user: any | null }> {
    return this.http.get<{ loggedIn: boolean; user: any | null }>(`${this.baseUrl}/auth/status`)
      .pipe(catchError(() => of({ loggedIn: false, user: null })));
  }

  refreshStatus(): Observable<AuthStatus> {
    return this.fetchServerStatus().pipe(
      tap((srv) => {
        if (!srv.loggedIn || !srv.user) {
          this.authStatusSubject.next({ loggedIn: false, user: null, exp: null });
          return;
        }
        const role = this.toRole(srv.user.role);
        const curr = this.authStatusSubject.value;
        const user: User | null = role ? {
          id: Number(srv.user.id),
          username: srv.user.username,
          role,
          departmentId: srv.user.departmentId ?? srv.user.department_id ?? null,
          departmentIds: this.normalizeDepartmentIds(srv.user.departmentIds ?? srv.user.assignedDepartmentIds),
          assignedDepartmentIds: this.normalizeDepartmentIds(srv.user.assignedDepartmentIds ?? srv.user.departmentIds),
          passwordReset: !!srv.user.passwordReset
        } : null;
        this.authStatusSubject.next({ loggedIn: !!user, user, exp: curr.exp ?? null });
      }),
      map(() => this.authStatusSubject.value)
    );
  }

  ensurePasswordResetGate(): void {
    this.fetchServerStatus().pipe(take(1)).subscribe((srv) => {
      if (srv.loggedIn && srv.user?.passwordReset) {
        this.overlay.lockToPasswordReset();
        const cur = this.authStatusSubject.value;
        if (cur.user) this.authStatusSubject.next({ ...cur, user: { ...cur.user, passwordReset: true } });
      } else {
        this.overlay.unlockPasswordReset();
      }
    });
  }

  checkStatus(): Observable<AuthStatus> { return of(this.authStatusSubject.value); }

  login(username: string, password: string): Observable<AuthStatus> {
    return this.http.post<{ token: string; user?: { passwordReset?: boolean } }>(
      `${this.baseUrl}/auth/login`,
      { username, password }
    ).pipe(
      tap((res) => {
        this.setSession(res.token, username);
        this.checkVersionUpdate();
        this.refreshStatus().pipe(take(1)).subscribe((st) => {
          const mustReset = !!st.user?.passwordReset;
          if (mustReset) {
            this.overlay.lockToPasswordReset();
          } else {
            this.overlay.unlockPasswordReset();
          }
        });
      }),
      catchError(() => {
        this.overlay.showOverlay('error', 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten oder melden Sie sich bei einem Systemadmin.');
        this.clearSession();
        return of({ loggedIn: false, user: null, exp: null });
      }),
      map(() => this.authStatusSubject.value)
    );
  }

  changePasswordSelf(newPassword: string, oldPassword?: string) {
    const body: any = { newPassword };
    if (oldPassword) body.oldPassword = oldPassword;

    return this.http.patch(`${this.baseUrl}/users/password`, body).pipe(
      tap(() => {
        this.refreshStatus().pipe(take(1)).subscribe((status) => {
          if (status.user && !status.user.passwordReset) {
            this.overlay.unlockPasswordReset();
          }
        });
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth']);
  }

  private checkVersionUpdate() {
    if (this.version.shouldShowUpdateOverlay()) {
      this.overlay.showOverlay('update', this.version.getUpdateSummary());
    }
  }

  get token(): string | null { return localStorage.getItem(this.tokenKey); }
  get currentUserRole(): Role | null { return this.authStatusSubject.value.user?.role ?? null; }
  isAdmin(): boolean { return this.currentUserRole === 'admin'; }
  isMod(): boolean { return this.currentUserRole === 'mod'; }
  isAreaManager(): boolean { return this.currentUserRole === 'areaManager'; }
  isManagerLike(): boolean { return this.isAdmin() || this.isMod() || this.isAreaManager(); }
  isLoggedIn(): boolean { return !!this.authStatusSubject.value.loggedIn; }
}
