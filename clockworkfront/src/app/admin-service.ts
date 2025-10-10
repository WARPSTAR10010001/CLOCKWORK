import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface CreateDeptPayload {
  name: string;
  usernames?: { user?: string; mod?: string };
}

export interface CreatedDepartment {
  department: { id: number; name: string };
  users: { id: number; username: string; role: 'USER'|'MOD'; department_id: number }[];
  initialPassword: string; // "init"
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = 'http://localhost:4000/api';

  constructor(private http: HttpClient) {}

  createDepartment(payload: CreateDeptPayload): Observable<CreatedDepartment> {
    return this.http.post<CreatedDepartment>(`${this.base}/admin/departments`, payload, { withCredentials: true });
  }

  listDepartments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/departments`, { withCredentials: true });
  }
}