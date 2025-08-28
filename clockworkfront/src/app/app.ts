import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from './auth-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(public authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout erfolgreich');
        this.router.navigate(['/auth']);
      },
      error: (err) => {
        console.error('Logout fehlgeschlagen', err);
      }
    });
  }
}