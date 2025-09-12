import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Employee {
  id: number;
  name: string;
  department_id: number;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private apiUrl = "http://localhost:3000/api/employees";

  constructor(private http: HttpClient) {}

  getEmployeesForDepartment(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl, { withCredentials: true });
  }
}