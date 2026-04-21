import { Component, HostListener } from '@angular/core';
import { AuthService } from '../auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OverlayService } from '../overlay-service';
import { ThemeService } from '../theme-service';
import { LandingPageService } from '../landing-page-service';

@Component({
  selector: 'app-auth-component',
  imports: [FormsModule, CommonModule],
  templateUrl: './auth-component.html',
  styleUrl: './auth-component.css',
})
export class AuthComponent {
  username: string = '';
  password: string = '';
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private overlayService: OverlayService,
    private router: Router,
    private landingPage: LandingPageService,
    public theme: ThemeService
  ) {}

  login() {
    if (this.username.length === 0 || this.password.length === 0) {
      this.overlayService.showOverlay('error', 'Bitte füllen Sie beide Anmeldefelder aus.');
      return;
    }

    this.isSubmitting = true;

    this.authService.login(this.username.toLowerCase(), this.password).subscribe({
      next: () => {
        if (this.authService.isAdmin()) {
          this.router.navigate(['/admin']);
          this.isSubmitting = false;
        } else if (this.authService.isAreaManager()) {
          this.router.navigate(['/mod']);
          this.isSubmitting = false;
        } else {
          this.router.navigate([`/${this.landingPage.getComponentPage()}`]);
          this.isSubmitting = false;
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        const message = err.error?.error || 'Login fehlgeschlagen. Bitte prüfen Sie Ihre Eingaben.';
        this.overlayService.showOverlay('error', message);
      }
    });
  }

  unlockAccess() {
    this.overlayService.showOverlay('info', 'Um den Zugang zu CLOCKWORK freizuschalten muss die IT unter der Durchwahl 180 kontaktiert werden. Falls Sie Ihre Zugangsdaten vergessen haben, melden Sie sich entweder bei der IT oder beim Moderator Ihres Fachbereiches.');
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnterHandler(event: Event) {
    this.login();
  }
}
