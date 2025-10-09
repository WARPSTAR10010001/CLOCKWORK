import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, switchMap, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthService } from './auth-service';

export interface Employee {
  id: number;
  name: string;                 // client-friendly alias für display_name
  department_id: number;
  start_month?: string | null;
  end_month?: string | null;
  annual_leave_days?: number;
  carryover_days?: number;
  is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private base = 'http://localhost:4000/api';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  /**
   * Holt die Mitarbeiter eines Fachbereichs.
   * - Aufruf mit Parameter: deptId wird verwendet.
   * - Aufruf ohne Parameter: deptId wird aus dem AuthService (JWT) gelesen.
   */
  getEmployeesForDepartment(departmentId?: number): Observable<Employee[]> {
    if (typeof departmentId === 'number') {
      return this.http
        .get<{ employees: any[] }>(`${this.base}/employees`, { params: { departmentId } as any })
        .pipe(map(res => res.employees.map(this.serverToEmployee)));
    }

    // ohne Parameter: Dept-ID aus dem Auth-Status ziehen
    return this.auth.authStatus$.pipe(
      take(1),
      switchMap(status => {
        const depId = status?.user?.departmentId;
        if (depId == null) throw new Error('No department in auth context');
        return this.http.get<{ employees: any[] }>(`${this.base}/employees`, { params: { departmentId: depId } as any });
      }),
      map(res => res.employees.map(this.serverToEmployee))
    );
  }

  /**
   * Legt einen neuen Mitarbeiter im aktuellen Department an
   * (wird in der Plan-Erstellung genutzt).
   */
  createEmployee(payload: {
    departmentId: number;
    displayName: string;   // <— wichtig
    startMonth: string;    // 'YYYY-MM-01'
    endMonth?: string | null;
    annualLeaveDays?: number;
    carryoverDays?: number;
  }) {
    return this.http.post<any>(`${this.base}/employees`, payload)
      .pipe(map(this.serverToEmployee));
  }


  // --- Mapper server -> client ---
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