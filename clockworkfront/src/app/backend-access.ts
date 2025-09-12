import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// --- Interfaces für Typsicherheit, die wir bereits definiert haben ---

export interface Plan {
  id: number;
  year: number;
  department_id: number;
}

export interface PlanEntry {
  id: number;
  plan_id: number;
  employee_id: number;
  entry_date: string; // ISO-String YYYY-MM-DD
  entry_type: string;
}

export interface NewPlanPayload {
  year: number;
  employees: {
    employee_id: number;
    vacation_days_carryover: number;
    vacation_days_total: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class BackendAccess { // Dein originaler Klassenname wird beibehalten
  private apiUrl = "http://localhost:3000/api/plans";

  constructor(private http: HttpClient) {}

  /**
   * NEU & ERFORDERLICH: Holt alle Pläne, die für die Abteilung des eingeloggten Benutzers existieren.
   * Wird von der Jahresübersicht (YearComponent) benötigt.
   */
  getAllPlansForDepartment(): Observable<Plan[]> {
    return this.http.get<Plan[]>(this.apiUrl, { withCredentials: true });
  }

  // Holt Pläne für ein spezifisches Jahr (wird z.B. im PlanViewer verwendet)
  getPlans(year: number): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.apiUrl}?year=${year}`, { withCredentials: true });
  }

  // Holt alle Einträge für eine spezifische Plan-ID
  getPlanEntries(planId: number): Observable<PlanEntry[]> {
    return this.http.get<PlanEntry[]>(`${this.apiUrl}/${planId}/entries`, { withCredentials: true });
  }

  // Erstellt einen komplett neuen Jahresplan
  createPlan(payload: NewPlanPayload): Observable<Plan> {
    return this.http.post<Plan>(this.apiUrl, payload, { withCredentials: true });
  }

  // Erstellt mehrere Einträge für einen Mitarbeiter in einem spezifischen Plan.
  createEntries(planId: number, employeeId: number, entryType: string, dates: string[]): Observable<any> {
    const url = `${this.apiUrl}/${planId}/entries`;
    const payload = {
      employee_id: employeeId,
      entry_type: entryType,
      dates: dates
    };
    return this.http.post(url, payload, { withCredentials: true });
  }

  // Löscht mehrere Einträge für einen Mitarbeiter aus einem spezifischen Plan.
  deleteEntries(planId: number, employeeId: number, dates: string[]): Observable<any> {
    const url = `${this.apiUrl}/${planId}/entries`;
    const options = {
      withCredentials: true,
      body: {
        employee_id: employeeId,
        dates: dates
      }
    };
    return this.http.delete(url, options);
  }
}