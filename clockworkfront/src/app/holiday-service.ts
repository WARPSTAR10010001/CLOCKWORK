import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface Holiday {
  id: number;
  state_code: 'NW';
  date: string;   // 'YYYY-MM-DD'
  name: string;
  year: number;
}

@Injectable({ providedIn: 'root' })
export class HolidayService {
  private baseUrl = 'http://localhost:4000/api';
  constructor(private http: HttpClient) {}

  getNW(year: number): Observable<Set<string>> {
    return this.http
      .get<{ holidays: Holiday[] }>(`${this.baseUrl}/holidays?year=${year}&stateCode=NW`)
      .pipe(map(res => new Set((res.holidays ?? []).map(h => h.date))));
  }
}