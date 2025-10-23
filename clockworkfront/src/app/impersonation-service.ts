import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth-service';

const KEY = 'impersonation_department_id';

@Injectable({ providedIn: 'root' })
export class ImpersonationService {
  private deptIdSubject = new BehaviorSubject<number | null>(this.load());
  public deptId$ = this.deptIdSubject.asObservable();

  constructor(private auth: AuthService) {}

  /** Admin: setzt aktiven Fachbereich; Nicht-Admin: ignorieren */
  setDepartmentId(id: number | null) {
    if (id && Number.isFinite(id)) {
      sessionStorage.setItem(KEY, String(id));
      this.deptIdSubject.next(id);
    } else {
      sessionStorage.removeItem(KEY);
      this.deptIdSubject.next(null);
    }
  }

  /** Effektive Department-ID: Impersonation (falls gesetzt) sonst aus JWT */
  getEffectiveDepartmentId(): number | null {
    const imp = this.deptIdSubject.value;
    if (imp != null) return imp;
    return this.auth.isLoggedIn() ? (this.auth['authStatusSubject'].value.user?.departmentId ?? null) : null;
  }

  /** Wird z.B. nach Logout aufgerufen */
  clear() {
    sessionStorage.removeItem(KEY);
    this.deptIdSubject.next(null);
  }

  private load(): number | null {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
}