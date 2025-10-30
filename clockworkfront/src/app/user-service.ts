import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) {}

  resetDeptUserPassword(deptId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/departments/${deptId}/reset-user-password`, {});
  }

  resetDeptModPassword(deptId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/departments/${deptId}/reset-mod-password`, {});
  }
}
