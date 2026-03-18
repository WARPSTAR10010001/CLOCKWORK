import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './auth-service';
import { OverlayComponent } from './overlay-component/overlay-component';
import { OverlayService } from './overlay-service';
import { VersionService } from './version-service';
import { ThemeService } from './theme-service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, OverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(
    public authService: AuthService,
    private overlayService: OverlayService,
    public versionService: VersionService,
    public theme: ThemeService
  ) { }

  logout() {
    this.overlayService.showOverlay('success', 'Erfolgreich abgemeldet.');
    this.authService.logout();
  }

  openStyleOverlay() {
    this.overlayService.showOverlay('style');
  }

  openFeedbackOverlay() {
    this.overlayService.showOverlay("feedback");
  }

  openFeedbackOverlayInfo() {
    this.overlayService.showOverlay("info", "Um Feedback versenden zu können müssen Sie eingeloggt sein.");
  }

  openDebugOverlay() {
    this.overlayService.showOverlay("debug");
  }

  @HostListener("document:keydown.shift.q", ["$event"])
  onShiftQHandler(event: Event) {
    this.openStyleOverlay();
  }

  @HostListener('document:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
    if (event.altKey && event.code === 'Period') {
      event.preventDefault();
      this.openDebugOverlay();
    }
  }
}