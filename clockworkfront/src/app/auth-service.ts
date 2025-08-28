import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router'; // <-- Router importieren

interface AuthStatus {
  loggedIn: boolean;
  isAdmin: boolean;
  user?: { id: number; username: string; isAdmin: boolean } | null;
  exp?: number; // <-- exp hinzufügen
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedInSubject = new BehaviorSubject<boolean>(false);
  public loggedIn$ = this.loggedInSubject.asObservable();

  private adminSubject = new BehaviorSubject<boolean>(false);
  public admin$ = this.adminSubject.asObservable();

  url: string = "http://localhost:3000/api/auth";

  constructor(private http: HttpClient, private router: Router) { // <-- Router injizieren
    this.checkStatus().subscribe();
  }

  checkStatus(): Observable<AuthStatus> {
    return this.http.get<AuthStatus>(`${this.url}/status`, { withCredentials: true })
      .pipe(tap(res => {
        // Token abgelaufen prüfen
        if (res.loggedIn && res.exp && res.exp * 1000 < Date.now()) {
          this.logout().subscribe();
          return;
        }

        this.loggedInSubject.next(res.loggedIn);
        this.adminSubject.next(!!res.isAdmin);

        if (!res.loggedIn) {
          this.router.navigate(['/auth']); // redirect falls nicht mehr eingeloggt
        }
      }));
  }

  login(username: string, password: string): Observable<AuthStatus> {
    return this.http.post<AuthStatus>(`${this.url}/login`, { username, password }, { withCredentials: true })
      .pipe(tap(res => {
        this.loggedInSubject.next(res.loggedIn);
        this.adminSubject.next(!!res.isAdmin);
      }));
  }

  logout(): Observable<any> {
    return this.http.post(`${this.url}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => {
        this.loggedInSubject.next(false);
        this.adminSubject.next(false);
        this.router.navigate(['/auth']); // <-- redirect nach logout
      }));
  }

  isLogged(): boolean {
    return this.loggedInSubject.value;
  }

  isAdmin(): boolean {
    return this.adminSubject.value;
  }
}