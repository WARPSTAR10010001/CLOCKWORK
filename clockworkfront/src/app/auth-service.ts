import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

interface AuthStatus {
  loggedIn: boolean;
  isAdmin: boolean;
  user?: { id: number; username: string; isAdmin: boolean } | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedInSubject = new BehaviorSubject<boolean>(false);
  public loggedIn$ = this.loggedInSubject.asObservable();

  private adminSubject = new BehaviorSubject<boolean>(false);
  public admin$ = this.adminSubject.asObservable();

  private url = "http://localhost:3000/api/auth";

  constructor(private http: HttpClient) {
    this.checkStatus().subscribe();
  }

  checkStatus(): Observable<AuthStatus> {
    return this.http.get<AuthStatus>(`${this.url}/status`, { withCredentials: true })
      .pipe(tap(res => {
        this.loggedInSubject.next(res.loggedIn);
        this.adminSubject.next(!!res.isAdmin);
      }));
  }

  login(username: string, password: string): Observable<AuthStatus> {
    return this.http.post<AuthStatus>(`${this.url}/login`, { username, password }, { withCredentials: true })
      .pipe(tap(() => {
        this.checkStatus().subscribe();
      }));
  }

  logout(): Observable<any> {
    return this.http.post(`${this.url}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => {
        this.loggedInSubject.next(false);
        this.adminSubject.next(false);
      }));
  }

  isLogged(): boolean {
    return this.loggedInSubject.value;
  }

  isAdmin(): boolean {
    return this.adminSubject.value;
  }
}