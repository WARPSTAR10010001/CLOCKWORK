import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})

export class ModGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): boolean {
    if (this.authService.isMod() || this.authService.isAdmin()) {
      return true;
    } else {
      this.router.navigate(['/auth']);
      return false;
    }
  }
}