import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common'; // Wichtig für die @if-Syntax im Template
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './auth-service';
import { OverlayComponent } from './overlay-component/overlay-component';
import { OverlayService } from './overlay-service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, OverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(public authService: AuthService, private overlayService: OverlayService) { }

  logout() {
    this.authService.logout();
  }

  openStyleOverlay() {
    this.overlayService.showOverlay('style');
  }

  openFeedbackOverlay() {
    this.overlayService.showOverlay("feedback");
  }

  @HostListener('document:keydown.shift.k', ['$event'])
  onEscHandler(event: Event) {
    if (this.authService.isLoggedIn()) {
      this.overlayService.showOverlay("quickAction");
    }
  }
}