import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BackendAccess {
  private url = "http://localhost:3000/api/plans";

  constructor(private http: HttpClient) {}

  getPlan(year: number, month: number): Observable<any> {
    return this.http.get<any>(`${this.url}/${year}/${month}`);
  }

  getYears(): Observable<{ years: number[] }> {
    return this.http.get<{ years: number[] }>(`${this.url}/years`);
  }

  newPlan(year: number, users: string[], lastYearCarryOver: { [username: string]: number }, totalVacation: { [username: string]: number }): Observable<any> {
    return this.http.post(`${this.url}/new`, { year, users, lastYearCarryOver, totalVacation });
  }

  deleteEntry(year: number, month: number, employee: string, date: string): Observable<any> {
    return this.http.post(`${this.url}/${year}/${month}/entry/delete`, { employee, date });
  }

  newEntry(year: number, month: number, employee: string, date: string, type: string): Observable<any> {
    return this.http.post(`${this.url}/${year}/${month}/entry`, { employee, date, type });
  }

  newEntries(year: number, month: number, employee: string, startDate: string, endDate: string, type: string): Observable<any> {
    return this.http.post(`${this.url}/${year}/${month}/entries`, { employee, startDate, endDate, type });
  }
}