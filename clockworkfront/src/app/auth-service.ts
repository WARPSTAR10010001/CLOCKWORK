import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, tap, of } from 'rxjs';
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
      }),
      catchError(() => {
        this.authStatusSubject.next({ loggedIn: false, user: null });
        return of({ loggedIn: false, user: null });
      })
    );
  }

  /**
   * AKTUALISIERT: Diese Methode leitet den Benutzer nach einem
   * erfolgreichen Login zur Jahresübersicht weiter.
   */
  login(username: string, password: string): Observable<AuthStatus> {
    return this.http.post<AuthStatus>(`${this.url}/login`, { username, password }, { withCredentials: true }).pipe(
      tap(status => {
        // Zuerst den neuen Status im gesamten System bekannt geben
        this.authStatusSubject.next(status);

        // DANN prüfen, ob der Login erfolgreich war
        if (status.loggedIn) {
          // Zeige eine Erfolgsmeldung
          this.overlayService.showOverlay("success", `Willkommen, ${status.user?.username}!`);
          // Leite den Benutzer zur Jahresübersicht weiter
          this.router.navigate(['/years']);
        }
      })
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