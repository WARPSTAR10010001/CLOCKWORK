// src/app/holiday-service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface HolidayDTO {
  id: number;
  date: string; // "YYYY-MM-DD" oder "YYYY-MM-DDTHH:mm:ss.sssZ"
  name: string;
  year: number;
}

// WICHTIG: nicht mehr einfach slice(0,10),
// sondern als Date parsen und lokale Y/M/D verwenden.
function dayKeyLocalFromDateString(s: string): number {
  const d = new Date(s);

  if (isNaN(d.getTime())) {
    // Fallback, falls doch mal "YYYY-MM-DD" ohne Zeitkram kommt
    const ymd = s.slice(0, 10);
    const [y, m, day] = ymd.split('-').map(n => parseInt(n, 10));
    const local = new Date(y, m - 1, day);
    return Math.floor(local.getTime() / 86400000);
  }

  // lokale Darstellung des Datums verwenden
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(local.getTime() / 86400000);
}

@Injectable({ providedIn: 'root' })
export class HolidayService {
  private baseUrl = environment.apiBase;
  constructor(private http: HttpClient) {}

  getForYear(year: number): Observable<Set<number>> {
    return this.http
      .get<{ holidays: HolidayDTO[] }>(`${this.baseUrl}/holidays/${year}`)
      .pipe(
        map(res => {
          const set = new Set<number>();
          for (const h of res.holidays ?? []) {
            const key = dayKeyLocalFromDateString(h.date);
            set.add(key);
          }
          return set;
        })
      );
  }
}