import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, switchMap, take } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
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
  ) {}

  /**
   * Holt die Mitarbeiter eines Fachbereichs.
   * - Mit departmentId: Admin-spezifische Auswahl
   * - Ohne: nimmt Dept-ID aus dem JWT (scope im Backend enforced)
   */
  getEmployeesForDepartment(departmentId?: number): Observable<Employee[]> {
    if (typeof departmentId === 'number') {
      const params = new HttpParams().set('departmentId', String(departmentId));
      return this.http
        .get<{ employees: any[] }>(`${this.base}/employees`, { params, withCredentials: true })
        .pipe(map(res => (res.employees || []).map(this.serverToEmployee)));
    }

    // ohne Parameter: Dept-ID aus Auth-Status ziehen
    return this.auth.authStatus$.pipe(
      take(1),
      switchMap(status => {
        const depId = status?.user?.departmentId;
        if (depId == null) return throwError(() => new Error('No department in auth context'));
        const params = new HttpParams().set('departmentId', String(depId));
        return this.http.get<{ employees: any[] }>(`${this.base}/employees`, { params, withCredentials: true });
      }),
      map(res => (res.employees || []).map(this.serverToEmployee))
    );
  }

  /**
   * Legt einen neuen Mitarbeiter im angegebenen Department an.
   * Gibt mindestens { id } zurück (reicht für Moderator-Flow).
   */
  createEmployee(payload: {
    departmentId: number;
    displayName: string;     // wichtig: Backend erwartet displayName
    startMonth: string;      // 'YYYY-MM-01'
    endMonth?: string | null;
    annualLeaveDays?: number;
    carryoverDays?: number;
  }): Observable<{ id: number }> {
    return this.http
      .post<any>(`${this.base}/employees`, payload, { withCredentials: true })
      .pipe(map((res: any) => ({ id: res.id })));
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