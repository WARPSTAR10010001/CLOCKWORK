import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { OverlayService } from './overlay-service';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'mod' | 'user';
  departmentId?: number;
}

interface AuthStatus {
  loggedIn: boolean;
  user: User | null;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authStatusSubject = new BehaviorSubject<AuthStatus | null>(null);
  public authStatus$ = this.authStatusSubject.asObservable();

  private url = "http://localhost:3000/api/auth";

  constructor(
    private http: HttpClient,
    private router: Router,
    private overlayService: OverlayService
  ) {
    this.checkStatus().subscribe();
  }

  checkStatus(): Observable<AuthStatus> {
    return this.http.get<AuthStatus>(`${this.url}/status`, { withCredentials: true }).pipe(
      tap(status => {
        if (status && status.loggedIn) {
          this.authStatusSubject.next(status);
        } else {
          this.authStatusSubject.next({ loggedIn: false, user: null });
        }
      })
    );
  }

  login(username: string, password: string): Observable<AuthStatus> {
    return this.http.post<AuthStatus>(`${this.url}/login`, { username, password }, { withCredentials: true }).pipe(
      tap(status => this.authStatusSubject.next(status))
    );
  }

  logout(): void {
    this.http.post(`${this.url}/logout`, {}, { withCredentials: true }).subscribe(() => {
      this.authStatusSubject.next({ loggedIn: false, user: null });
      this.overlayService.showOverlay("success", "Erfolgreich abgemeldet.");
      this.router.navigate(['/auth']);
    });
  }

  public get currentUserRole(): 'admin' | 'mod' | 'user' | null {
    return this.authStatusSubject.value?.user?.role || null;
  }

  public isAdmin(): boolean {
    return this.currentUserRole === 'admin';
  }

  public isMod(): boolean {
    return this.currentUserRole === 'mod';
  }

  public isLoggedIn(): boolean {
    return this.authStatusSubject.value?.loggedIn || false;
  }
}