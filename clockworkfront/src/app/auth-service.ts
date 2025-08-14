import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private loggedIn = false;
    private admin = false;
    private url = "http://localhost:3000/api/auth";

    constructor(private http: HttpClient) { }

    checkStatus(): Observable<{ loggedIn: boolean; admin: boolean }> {
        return this.http.get<{ loggedIn: boolean; admin: boolean }>(`${this.url}/status`, { withCredentials: true })
            .pipe(tap(res => {
                this.loggedIn = res.loggedIn;
                this.admin = res.admin;
            })
        );
    }

    login(username: string, password: string): Observable<any> {
        return this.http.post(`${this.url}/login`, { username, password }, { withCredentials: true })
            .pipe(tap(() => this.loggedIn = true));
    }

    logout(): Observable<any> {
        return this.http.post(`${this.url}/logout`, {}, { withCredentials: true });
    }

    isLogged(): boolean {
        return this.loggedIn;
    }

    isAdmin(): boolean {
        return this.admin;
    }
}