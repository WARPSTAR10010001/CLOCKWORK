import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, map, switchMap } from 'rxjs';

import {
  PlanListItem, PlanDetails, PlanEntry, CreatePlanBody, CreateEntryBody, PlanEntryStatus
} from './types';

export interface PlanLogDTO {
  id: number;
  plan_id: number;
  department_id: number;
  employee_id: number;
  employee_name: string | null;
  action_type: string;       // 'SET' | 'DELETE'
  status_code: string | null;
  date_from: string;         // 'YYYY-MM-DD'
  date_to: string;           // 'YYYY-MM-DD'
  day_count: number;
  dates: string[];           // alle einzelnen Tage
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class BackendAccess {
  private base = 'http://localhost:4000/api';

  constructor(private http: HttpClient) { }

  // === PLANS ===

  /** Liste aller Pläne eines Fachbereichs (für /years Seite) */
  getPlansForDepartment(departmentId: number): Observable<{ plans: PlanListItem[] }> {
    return this.http.get<{ plans: PlanListItem[] }>(`${this.base}/plans?departmentId=${departmentId}`);
  }

  /** Plan-Details inkl. Mitarbeiter und Urlaubsständen */
  getPlanDetails(planId: number): Observable<PlanDetails> {
    return this.http.get<PlanDetails>(`${this.base}/plans/${planId}`);
  }

  /** Plan erstellen (nur MOD/ADMIN) */
  createPlan(body: CreatePlanBody): Observable<{ id: number; departmentId: number; year: number; createdAt: string }> {
    return this.http.post<{ id: number; departmentId: number; year: number; createdAt: string }>(
      `${this.base}/plans`,
      body
    );
  }

  // === PLAN ENTRIES ===

  /** Monatsfeed der Einträge für einen Plan */
  getPlanEntriesForMonth(planId: number, monthYYYYMM: string): Observable<{ entries: PlanEntry[]; departmentId: number }> {
    return this.http.get<{ entries: PlanEntry[]; departmentId: number }>(
      `${this.base}/plan-entries`,
      { params: { planId, month: monthYYYYMM } as any }
    );
  }

  /** Ein einzelnes Datum eintragen */
  createEntry(body: CreateEntryBody): Observable<PlanEntry> {
    return this.http.post<PlanEntry>(`${this.base}/plan-entries`, body);
  }

  /** Mehrere Daten auf einmal eintragen (Client-seitig gebatcht) */
  createEntriesBatch(
    base: Omit<CreateEntryBody, 'date'>,
    dates: string[],
    status?: PlanEntryStatus
  ): Observable<PlanEntry[]> {
    const calls = dates.map(date =>
      this.createEntry({
        ...base,
        date,
        status: status ?? 'OTHER'
      })
    );
    return forkJoin(calls);
  }

  /** Eintrag ändern */
  updateEntry(entryId: number, patch: Partial<Pick<PlanEntry, 'status' | 'description'>>): Observable<{
    id: number; status: PlanEntryStatus; description: string | null;
  }> {
    return this.http.patch<{ id: number; status: PlanEntryStatus; description: string | null }>(
      `${this.base}/plan-entries/${entryId}`,
      patch
    );
  }

  /** Eintrag löschen */
  deleteEntry(entryId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/plan-entries/${entryId}`);
  }

  /**
   * Mehrere Einträge anhand (employeeId, dates[]) löschen:
   * 1) Monat laden
   * 2) passende IDs herausfiltern
   * 3) alle DELETEs feuern
   */
  deleteEntriesByDates(planId: number, employeeId: number, dates: string[]): Observable<void[]> {
    if (dates.length === 0) return of([]);
    // Wir müssen wissen, in welchen Monaten diese Dates liegen:
    const months = Array.from(new Set(dates.map(d => d.slice(0, 7))));
    const monthCalls = months.map(m => this.getPlanEntriesForMonth(planId, m));
    return forkJoin(monthCalls).pipe(
      map(resArr => {
        const all = resArr.flatMap(r => r.entries);
        const toDelete = all.filter(e =>
          e.employee_id === employeeId && dates.includes(e.entry_date)
        );
        return toDelete.map(e => e.id);
      }),
      switchMap(ids => forkJoin(ids.map(id => this.deleteEntry(id))))
    );
  }

  // === EMPLOYEES (Minimal – für Setup Screens später praktisch) ===

  getEmployees(departmentId: number): Observable<{
    employees: Array<{
      id: number;
      display_name: string;
      start_month: string;
      end_month: string | null;
      annual_leave_days: number;
      carryover_days: number;
      is_active: boolean;
    }>
  }> {
    return this.http.get<{ employees: any[] }>(`${this.base}/employees`, { params: { departmentId } as any });
  }

  createEmployee(payload: {
    departmentId: number;
    displayName: string;
    startMonth: string;             // YYYY-MM-01
    endMonth?: string | null;
    annualLeaveDays?: number;
    carryoverDays?: number;
  }): Observable<any> {
    return this.http.post(`${this.base}/employees`, payload);
  }

  getHolidays(year: number, stateCode: 'NW' = 'NW'): Observable<{ holidays: Array<{ id: number; date: string; name: string }> }> {
    return this.http.get<{ holidays: any[] }>(`${this.base}/holidays`, { params: { year, stateCode } as any });
  }

  createPlanLog(payload: {
    planId: number;
    departmentId: number;
    employeeId: number;
    actionType: 'SET' | 'DELETE';
    statusCode: string | null;
    dateFrom: string;
    dateTo: string;
    dayCount: number;
    dates: string[];
  }) {
    return this.http.post<{ log: PlanLogDTO }>(
      `${this.base}/plans/${payload.planId}/logs`,
      {
        departmentId: payload.departmentId,
        employeeId: payload.employeeId,
        actionType: payload.actionType,
        statusCode: payload.statusCode,
        dateFrom: payload.dateFrom,
        dateTo: payload.dateTo,
        dayCount: payload.dayCount,
        dates: payload.dates
      }
    );
  }

  getPlanLogs(planId: number, year: number, month: number) {
    const m = String(month).padStart(2, '0');
    return this.http.get<{ logs: PlanLogDTO[] }>(
      `${this.base}/plans/${planId}/logs?year=${year}&month=${m}`
    );
  }
}