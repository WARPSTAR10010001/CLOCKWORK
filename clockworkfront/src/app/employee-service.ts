import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth-service';
import { ImpersonationService } from './impersonation-service';
import { environment } from '../environments/environment';

export interface Employee {
  id: number;
  name: string;
  department_id: number;
  start_month?: string | null;
  end_month?: string | null;
  annual_leave_days?: number;
  carryover_days?: number;
  is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private base = environment.apiBase;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private imp: ImpersonationService
  ) { }

  getEmployeesForDepartment(departmentId?: number): Observable<Employee[]> {
    const dep = departmentId ?? this.imp.getEffectiveDepartmentId();
    if (dep == null) return of([]);

    return this.http
      .get<{ employees: any[] }>(`${this.base}/employees`, { params: { departmentId: dep } as any })
      .pipe(map(res => (res.employees || []).map(this.serverToEmployee)));
  }

  createEmployee(payload: {
    departmentId: number;
    displayName: string;
    startMonth: string;
    endMonth?: string | null;
    annualLeaveDays?: number;
    carryoverDays?: number;
  }) {
    return this.http.post<any>(`${this.base}/employees`, payload)
      .pipe(map(this.serverToEmployee));
  }

  updateEmployee(id: number, payload: {
    displayName?: string;
    startMonth?: string | null;
    endMonth?: string | null;
    annualLeaveDays?: number;
    carryoverDays?: number;
  }) {
    return this.http.patch<any>(`${this.base}/employees/${id}`, payload)
      .pipe(map(this.serverToEmployee));
  }

  deleteEmployee(id: number) {
    return this.http.delete<void>(`${this.base}/employees/${id}`);
  }

  private serverToEmployee = (row: any): Employee => ({
    id: row.id,
    name: row.display_name ?? row.name ?? '',
    department_id: row.department_id,
    start_month: row.start_month ?? null,
    end_month: row.end_month ?? null,
    annual_leave_days: row.annual_leave_days,
    carryover_days: row.carryover_days,
    is_active: row.is_active
  });
}