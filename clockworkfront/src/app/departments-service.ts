// src/app/departments-service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Department { id: number; name: string; }

@Injectable({ providedIn: 'root' })
export class DepartmentsService {
  private base = 'http://localhost:4000/api';
  constructor(private http: HttpClient) {}
  getAllDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.base}/departments`, { withCredentials: true });
  }
}