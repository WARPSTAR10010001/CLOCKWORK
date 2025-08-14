import { Component } from '@angular/core';
import { AuthService } from '../auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

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
  returnUrl: string = '/plan';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // returnUrl aus den queryParams holen
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });
  }

  login() {
    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        console.log('Login erfolgreich', res);
        // Nach Login zurück zur ursprünglichen Seite
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        console.error('Login fehlgeschlagen', err);
        this.errorMessage = 'Login fehlgeschlagen';
      }
    });
  }
}