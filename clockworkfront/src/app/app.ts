import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from './auth-service';
import { OverlayComponent } from './overlay-component/overlay-component';
import { OverlayService } from './overlay-service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, OverlayComponent, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(public authService: AuthService, private router: Router, private overlayService: OverlayService) {}

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

  openStyleOverlay() {
    this.overlayService.showOverlay('style');
  }
}