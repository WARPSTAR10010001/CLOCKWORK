import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

export interface PlanLogDTO {
  id: number;
  plan_id: number;
  department_id: number;
  employee_id: number;
  employee_name: string | null;
  action_type: string;
  status_code: string | null;
  date_from: string;
  date_to: string;
  day_count: number;
  dates: string[];
  created_at: string;
  note_old?: string | null;
  note_new?: string | null;
}

@Injectable({ providedIn: 'root' })
export class LogService {
  private base = environment.apiBase;

  constructor(private http: HttpClient) { }

  createPlanLog(payload: {
    planId: number;
    departmentId: number;
    employeeId: number;
    actionType: 'SET' | 'DELETE' | 'NOTE_SET' | 'NOTE_UPDATE' | 'NOTE_DELETE';
    statusCode: string | null;
    dateFrom: string;
    dateTo: string;
    dayCount: number;
    dates: string[];
    noteBefore?: string | null;
    noteAfter?: string | null;
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
        dates: payload.dates,
        noteBefore: payload.noteBefore ?? null,
        noteAfter: payload.noteAfter ?? null
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