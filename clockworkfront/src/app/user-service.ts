import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = environment.apiBase;

  constructor(private http: HttpClient) {}

  resetDeptUserPassword(deptId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/departments/${deptId}/reset-user-password`, {});
  }

  resetDeptModPassword(deptId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/departments/${deptId}/reset-mod-password`, {});
  }
}
