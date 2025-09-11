import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { OverlayService } from './overlay-service';

interface AuthStatus {
  loggedIn: boolean;
  role?: 'admin' | 'moderator' | 'default';
  user?: { id: number; username: string; role: 'admin' | 'moderator' | 'default', department?: string } | null;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedInSubject = new BehaviorSubject<boolean>(false);
  public loggedIn$ = this.loggedInSubject.asObservable();

  private adminSubject = new BehaviorSubject<boolean>(false);
  public admin$ = this.adminSubject.asObservable();

  private modSubject = new BehaviorSubject<boolean>(false);
  public mod$ = this.modSubject.asObservable();

  url: string = "http://localhost:3000/api/auth";

  constructor(private http: HttpClient, private router: Router, private overlayService: OverlayService) {}

  login(username: string, password: string): Observable<AuthStatus> {
    return this.http.post<AuthStatus>(`${this.url}/login`, { username, password }, { withCredentials: true })
      .pipe(tap(res => {
        this.loggedInSubject.next(res.loggedIn);

        const role = res.user?.role;
        this.adminSubject.next(role === 'admin');
        this.modSubject.next(role === 'moderator');
      }));
  }

  logout(): Observable<any> {
    return this.http.post(`${this.url}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => {
        this.loggedInSubject.next(false);
        this.adminSubject.next(false);
        this.modSubject.next(false);
        this.overlayService.showOverlay("success", "Erfolgreich abgemeldet.");
        this.router.navigate(['/auth']);
      }));
  }

  isLogged(): boolean {
    return this.loggedInSubject.value;
  }

  isAdmin(): boolean {
    return this.adminSubject.value;
  }

  isMod(): boolean {
    return this.modSubject.value;
  }
}