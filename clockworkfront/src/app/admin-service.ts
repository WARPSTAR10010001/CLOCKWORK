import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

interface CreateDeptPayload {
  name: string;
  usernames?: { user?: string; mod?: string };
}

export interface CreatedDepartment {
  department: { id: number; name: string };
  users: {
    id: number;
    username: string;
    role: 'USER' | 'MOD';
    department_id: number;
    last_login_at: string | null;
  }[];
  initialPassword: string;
}

export interface DeleteDepartmentResponse {
  success: boolean;
  department: { id: number; name: string };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = environment.apiBase;

  constructor(private http: HttpClient) {}

  createDepartment(payload: CreateDeptPayload): Observable<CreatedDepartment> {
    return this.http.post<CreatedDepartment>(`${this.base}/admin/departments`, payload, {
      withCredentials: true
    });
  }

  listDepartments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/departments`, {
      withCredentials: true
    });
  }

  deleteDepartment(id: number): Observable<DeleteDepartmentResponse> {
    return this.http.delete<DeleteDepartmentResponse>(
      `${this.base}/admin/departments/${id}`,
      { withCredentials: true }
    );
  }
}