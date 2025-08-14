import { Component } from '@angular/core';
import { AuthService } from '../auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-component',
  imports: [FormsModule, CommonModule],
  templateUrl: './auth-component.html',
  styleUrl: './auth-component.css',
})
export class AuthComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) { }

  login() {
    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        console.log('Login erfolgreich', res);
        this.router.navigate(['/plan']);
      },
      error: (err) => {
        console.error('Login fehlgeschlagen', err);
        this.errorMessage = 'Login fehlgeschlagen';
      }
    });
  }
}