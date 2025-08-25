import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

interface AuthStatus {
  loggedIn: boolean;
  isAdmin: boolean;
  user?: { id: number; username: string; isAdmin: boolean } | null;
  token?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private url = "http://localhost:3000/api/auth";

  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public loggedIn$ = this.loggedInSubject.asObservable();

  private adminSubject = new BehaviorSubject<boolean>(false);
  public admin$ = this.adminSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkStatus().subscribe();
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('cw_token');
  }

  getToken(): string | null {
    return localStorage.getItem('cw_token');
  }

  setToken(token: string) {
    localStorage.setItem('cw_token', token);
    this.loggedInSubject.next(true);
  }

  clearToken() {
    localStorage.removeItem('cw_token');
    this.loggedInSubject.next(false);
    this.adminSubject.next(false);
  }

  checkStatus(): Observable<AuthStatus> {
    return this.http.get<AuthStatus>(`${this.url}/status`)
      .pipe(tap(res => {
        this.loggedInSubject.next(res.loggedIn);
        this.adminSubject.next(!!res.isAdmin);
      }));
  }

  login(username: string, password: string): Observable<AuthStatus> {
    return this.http.post<AuthStatus>(`${this.url}/login`, { username, password })
      .pipe(tap(res => {
        if (res.token) {
          this.setToken(res.token);
        }
        this.loggedInSubject.next(!!res.loggedIn);
        this.adminSubject.next(!!res.isAdmin);
      }));
  }

  logout(): Observable<any> {
    return this.http.post(`${this.url}/logout`, {})
      .pipe(tap(() => {
        this.clearToken();
      }));
  }

  isLogged(): boolean {
    return this.loggedInSubject.value;
  }

  isAdmin(): boolean {
    return this.adminSubject.value;
  }
}