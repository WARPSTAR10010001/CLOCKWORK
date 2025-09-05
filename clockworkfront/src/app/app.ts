import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from './auth-service';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme } from './theme-service';
import { FormsModule } from '@angular/forms';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(public authService: AuthService, private router: Router, public themeService: ThemeService) {
    this.selectedTheme = this.themeService.getTheme();
    this.outlineMode = localStorage.getItem('outline') as 'on' | 'off' || 'on';
    this.setOutline(this.outlineMode, false);
  }

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
  overlayVisible = false;
  selectedTheme: Theme = 'light';
  outlineMode: 'on' | 'off' = 'on';

  showOverlay(boo: boolean) {
    if (boo === true) {
      document.getElementById("main-content")?.classList.add("blur");
      document.getElementById("style-overlay")!.style.display = "block";
    } else {
      document.getElementById("main-content")?.classList.remove("blur");
      document.getElementById("style-overlay")!.style.display = "none";
    }
  }

  applySettings() {
    this.themeService.setTheme(this.selectedTheme);

    this.setOutline(this.outlineMode);
    this.showOverlay(false);
  }

  private setOutline(mode: 'on' | 'off', save = true) {
    document.body.classList.remove('outlines', 'no-outlines');
    document.body.classList.add(mode === 'on' ? 'outlines' : 'no-outlines');

    if (save) {
      localStorage.setItem('outline', mode);
    }
  }
}