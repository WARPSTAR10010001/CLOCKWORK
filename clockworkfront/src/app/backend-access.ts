import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Plan {
  id: number;
  year: number;
  department_id: number;
}

export interface PlanEntry {
  id: number;
  plan_id: number;
  employee_id: number;
  entry_date: string;
  entry_type: string;
}

export interface NewPlanPayload {
  year: number;
  employees: {
    employee_id: number;
    vacation_days_total: number;
    vacation_days_carryover: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class BackendAccess {
  private apiUrl = "http://localhost:3000/api/plans";

  constructor(private http: HttpClient) {}

  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(this.apiUrl, { withCredentials: true });
  }

  getPlanEntries(planId: number): Observable<PlanEntry[]> {
    return this.http.get<PlanEntry[]>(`${this.apiUrl}/${planId}/entries`, { withCredentials: true });
  }

  createPlan(payload: NewPlanPayload): Observable<Plan> {
    return this.http.post<Plan>(this.apiUrl, payload, { withCredentials: true });
  }

  createEntries(planId: number, employeeId: number, dates: string[], entryType: string): Observable<any> {
    const payload = { employee_id: employeeId, dates, entry_type: entryType };
    return this.http.post(`${this.apiUrl}/${planId}/entries/bulk-create`, payload, { withCredentials: true });
  }

  deleteEntries(employeeId: number, dates: string[]): Observable<any> {
    const payload = { employee_id: employeeId, dates };
    return this.http.post(`${this.apiUrl}/entries/bulk-delete`, payload, { withCredentials: true });
  }
}
