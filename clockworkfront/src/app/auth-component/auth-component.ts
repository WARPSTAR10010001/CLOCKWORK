import { Component } from '@angular/core';
import { AuthService } from '../auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Theme, ThemeService } from '../theme-service';

@Component({
  selector: 'app-auth-component',
  imports: [FormsModule, CommonModule],
  templateUrl: './auth-component.html',
  styleUrl: './auth-component.css',
})
export class AuthComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  
  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        console.log('Login erfolgreich', res);
        this.router.navigate(['/plan']);
      },
      error: (err) => {
        console.error('Login fehlgeschlagen', err);
        this.errorMessage = 'Login fehlgeschlagen. Bitte erneut versuchen oder einen Systemadmin kontaktieren.';
      }
    });
  }
}