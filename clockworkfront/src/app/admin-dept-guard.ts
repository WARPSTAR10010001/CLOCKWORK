import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth-service';
import { ImpersonationService } from './impersonation-service';

@Injectable({ providedIn: 'root' })
export class AdminDeptGuard  {
  constructor(private auth: AuthService, private imp: ImpersonationService, private router: Router) {}

  canActivate(): boolean {
    if (!this.auth.isAdmin() && !this.auth.isAreaManager()) return true;
    if (this.imp.getEffectiveDepartmentId() == null) {
      this.router.navigate(['/mod']);
      return false;
    }
    return true;
  }
}
