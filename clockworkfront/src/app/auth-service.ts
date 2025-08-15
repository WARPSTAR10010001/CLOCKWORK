import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

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

  checkStatus(): Observable<{ loggedIn: boolean; admin: boolean }> {
    return this.http.get<{ loggedIn: boolean; admin: boolean }>(`${this.url}/status`, { withCredentials: true })
      .pipe(tap(res => {
        this.loggedInSubject.next(res.loggedIn);
        this.adminSubject.next(res.admin);
      }));
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.url}/login`, { username, password }, { withCredentials: true })
      .pipe(tap(() => {
        this.loggedInSubject.next(true);
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