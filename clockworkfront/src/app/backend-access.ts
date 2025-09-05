import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class BackendAccess {
  constructor(private http: HttpClient) {}

  url: string = "http://localhost:3000/api/plans";

  getPlan(year: number, month: number): Observable<any> {
    return this.http.get<any>(`${this.url}/${year}/${month}`, { withCredentials: true });
  }

  getYears(): Observable<any> {
    return this.http.get<{ years: number[] }>(`${this.url}/years`, { withCredentials: true });
  }

  newPlan(year: number, users: string[], lastYearCarryOver: { [username: string]: number }, totalVacation: { [username: string]: number }): Observable<any> {
    return this.http.post(`${this.url}/new`, { year, users, lastYearCarryOver, totalVacation }, { withCredentials: true });
  }

  deleteEntry(year: number, month: number, employee: string, date: string): Observable<any> {
    return this.http.post(`${this.url}/${year}/${month}/entry/delete`, { employee, date }, { withCredentials: true });
  }


  newEntry(year: number, month: number, employee: string, date: string, type: string): Observable<any> {
    return this.http.post(`${this.url}/${year}/${month}/entry`, { employee, date, type }, { withCredentials: true });
  }

  newEntries(year: number, month: number, employee: string, startDate: string, endDate: string, type: string): Observable<any> {
    return this.http.post(`${this.url}/${year}/${month}/entries`, { employee, startDate, endDate, type }, { withCredentials: true });
  }

  deleteEntries(year: number, month: number, employee: string, startDate: string, endDate: string): Observable<any> {
  return this.http.post(`${this.url}/${year}/${month}/entries/delete`, { employee, startDate, endDate }, { withCredentials: true });
  };
}