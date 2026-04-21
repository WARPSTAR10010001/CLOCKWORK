import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, map, switchMap } from 'rxjs';
import { environment } from '../environments/environment';

export interface PlanListItem {
  id: number;
  departmentId: number;
  year: number;
  createdAt: string;
}

export interface PlanDetails {
  id: number;
  departmentId: number;
  year: number;
  createdAt: string;
  employees: Array<{
    planEmployeeId: number;
    employeeId: number;
    name: string;
    startMonth: string | null;
    endMonth: string | null;
    annualLeaveDays: number;
    carryoverDays: number;
    initialBalance: number;
    usedVacationDays: number;
    availableVacationDays: number;
    remainingVacationDays: number;
  }>;
}

export type PlanEntryStatus =
  | 'PRESENCE' | 'HOME' | 'FLEXTIME'
  | 'TRAINING' | 'VACATION' | 'SICK' | 'OTHER' | 'APPOINTMENT';

export interface PlanEntry {
  id: number;
  employee_id: number;
  entry_date: string;
  status: PlanEntryStatus;
  notes: string | null;
  created_at: string;
  display_name?: string;
}

export interface CreateEntryBody {
  planId: number;
  departmentId: number;
  employeeId: number;
  date: string;
  status: PlanEntryStatus;
  notes?: string | null;
}

export interface CreatePlanBody {
  departmentId: number;
  year: number;
  employees: Array<{
    employeeId: number;
    startMonth: string;
    endMonth?: string | null;
    annualLeaveDays: number;
    carryoverDays: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  private base = environment.apiBase;

  constructor(private http: HttpClient) { }

  getPlanEmployeeLinks(planId: number) {
    return this.http.get<{ items: Array<{ employee_id: number; start_month: string; end_month: string | null; annual_leave_days: number; carryover_days: number }> }>(
      `${this.base}/plans/${planId}/plan-employees`
    );
  }

  addEmployeeToPlan(
    planId: number,
    employeeId: number,
    startMonth: string,
    endMonth: string | null = null,
    annualLeaveDays?: number,
    carryoverDays?: number
  ) {
    return this.http.post<{ added: boolean }>(
      `${this.base}/plans/${planId}/plan-employees`,
      { employeeId, startMonth, endMonth, annualLeaveDays, carryoverDays }
    );
  }

  updatePlanEmployeeValues(planId: number, employeeId: number, annualLeaveDays: number, carryoverDays: number) {
    return this.http.post<{ plan_id: number; employee_id: number; annual_leave_days: number; carryover_days: number }>(
      `${this.base}/plans/${planId}/plan-employees/${employeeId}`,
      { annualLeaveDays, carryoverDays }
    );
  }

  syncPlanEmployees(planId: number) {
    return this.http.post<{ added: number }>(`${this.base}/plans/${planId}/sync-employees`, {});
  }

  syncPlanEmployeeDates(planId: number) {
    return this.http.post<{ updated: number }>(`${this.base}/plans/${planId}/sync-employee-dates`, {});
  }

  getPlansForDepartment(departmentId: number): Observable<{ plans: PlanListItem[] }> {
    return this.http.get<{ plans: PlanListItem[] }>(`${this.base}/plans?departmentId=${departmentId}`);
  }

  getPlanDetails(planId: number): Observable<PlanDetails> {
    return this.http.get<PlanDetails>(`${this.base}/plans/${planId}`);
  }

  createPlan(body: CreatePlanBody): Observable<{ id: number; departmentId: number; year: number; createdAt: string }> {
    return this.http.post<{ id: number; departmentId: number; year: number; createdAt: string }>(
      `${this.base}/plans`,
      body
    );
  }

  getPlanEntriesForMonth(planId: number, monthYYYYMM: string): Observable<{ entries: PlanEntry[]; departmentId: number }> {
    return this.http.get<{ entries: PlanEntry[]; departmentId: number }>(
      `${this.base}/plan-entries`,
      { params: { planId, month: monthYYYYMM } as any }
    );
  }

  createEntry(body: CreateEntryBody): Observable<PlanEntry> {
    return this.http.post<PlanEntry>(`${this.base}/plan-entries`, body);
  }

  createEntriesBatch(
    base: Omit<CreateEntryBody, 'date'>,
    dates: string[],
    status?: PlanEntryStatus
  ): Observable<PlanEntry[]> {
    const calls = dates.map(date =>
      this.createEntry({
        ...base,
        date,
        status: status ?? base.status
      })
    );
    return forkJoin(calls);
  }

  updateEntry(
    entryId: number,
    patch: Partial<Pick<PlanEntry, 'status' | 'notes'>>
  ): Observable<{ id: number; status: PlanEntryStatus; notes: string | null }> {
    return this.http.patch<{ id: number; status: PlanEntryStatus; notes: string | null }>(
      `${this.base}/plan-entries/${entryId}`,
      patch
    );
  }

  deleteEntry(entryId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/plan-entries/${entryId}`);
  }

  deleteEntriesByDates(planId: number, employeeId: number, dates: string[]): Observable<void[]> {
    if (dates.length === 0) return of([]);
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
}
