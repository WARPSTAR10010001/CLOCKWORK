import { Component } from '@angular/core';
import { AuthService } from '../auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'
import { OverlayService } from '../overlay-service';

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
    private router: Router
    ) {}

  login() {
    if (this.username.length === 0 || this.password.length === 0) {
      this.overlayService.showOverlay("error", "Bitte füllen Sie beide Anmeldefelder aus.");
      return;
    }

    this.isSubmitting = true;

    // Der entscheidende Aufruf. Wir MÜSSEN subscriben, um ihn zu starten.
    this.authService.login(this.username.toLowerCase(), this.password).subscribe({
      // Der `next`-Block ist jetzt LEER.
      // Die Erfolgslogik (Weiterleitung, Erfolgsmeldung) wird
      // komplett vom `tap`-Operator im AuthService übernommen.
      next: () => {
        if (this.authService.isAdmin()) {
          this.router.navigate(["/admin"]);
          this.isSubmitting = false;
        } else {
          this.router.navigate(["/years"]);
          this.isSubmitting = false;
        }
      },
      // Der `error`-Block ist weiterhin wichtig, um auf fehlgeschlagene Logins zu reagieren.
      error: (err) => {
        this.isSubmitting = false;
        const message = err.error?.error || "Login fehlgeschlagen. Bitte prüfen Sie Ihre Eingaben.";
        this.overlayService.showOverlay("error", message);
        // Das Passwort-Feld leeren ist gute Praxis
        this.password = "";
      }
    });
  }

  unlockAccess() {
    this.overlayService.showOverlay("info", "Um Zugang zu CLOCKWORK zu erhalten muss die IT unter der Durchwahl 180 kontaktiert werden.");
  }
}