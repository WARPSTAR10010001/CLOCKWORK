import { Component, OnInit, Renderer2, HostListener, inject } from '@angular/core';
import { OverlayService, OverlayState } from '../overlay-service';
import { ThemeService, Theme, Outline, Color } from '../theme-service';
import { AuthService } from '../auth-service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-overlay-component',
  templateUrl: './overlay-component.html',
  styleUrls: ['./overlay-component.css']
})
export class OverlayComponent implements OnInit {
  private overlayService = inject(OverlayService);
  private themeService = inject(ThemeService);
  private renderer = inject(Renderer2);
  public auth = inject(AuthService);

  overlayState: OverlayState = { show: false, type: 'info' };
  selectedTheme: Theme = 'light';
  selectedOutline: Outline = 'no-outlines';
  selectedColor: Color = 'standard';

  // password reset ui state
  pw1 = '';
  pw2 = '';
  submitting = false;
  passwordResetRequired = false;

  private banned = new Set(['12345', 'passwort', 'kennwort', 'organist', 'badehose', 'november11', ]);

  ngOnInit() {
    // Theme streams
    this.selectedTheme = this.themeService.getTheme();
    this.selectedOutline = this.themeService.getOutline();
    this.selectedColor = this.themeService.getColor();
    this.themeService.currentTheme$.subscribe(v => this.selectedTheme = v);
    this.themeService.currentOutline$.subscribe(v => this.selectedOutline = v);
    this.themeService.currentColor$.subscribe(v => this.selectedColor = v);

    // Auth → Reset hat Vorrang
    this.auth.authStatus$.subscribe(status => {
      const mustReset = !!status?.user?.passwordReset;
      this.passwordResetRequired = mustReset;
      this.renderer.setStyle(document.body, 'overflow', mustReset ? 'hidden' : '');

      if (mustReset) {
        this.overlayState = { show: true, type: 'passwordReset' };
      } else if (this.overlayState.type === 'passwordReset') {
        this.overlayState = { show: false, type: 'info' };
      }
    });

    // Normale Overlays nur berücksichtigen, wenn kein Reset erzwungen wird
    this.overlayService.overlay$.subscribe(state => {
      if (this.passwordResetRequired) {
        this.overlayState = { show: true, type: 'passwordReset' };
      } else {
        this.overlayState = state;
        this.renderer.setStyle(document.body, 'overflow', state.show ? 'hidden' : '');
      }
    });

    // Server-Status beim Start ziehen (stellt passwordReset-Flag sicher)
    this.auth.refreshStatus().pipe(take(1)).subscribe();
  }

  // ----- Password-Validierung -----
  get pwMinLenOk(): boolean { return this.pw1.trim().length >= 5; }
  get pwNotBanned(): boolean { return !this.banned.has(this.pw1.trim().toLowerCase()); }
  get pwMatch(): boolean { return this.pw1 === this.pw2 && this.pw2.length > 0; }
  get canSubmit(): boolean { return this.pwMinLenOk && this.pwNotBanned && this.pwMatch && !this.submitting; }

  // robustes Input-Handler (vermeidet Template-Casts)
  onPwInput(which: 1 | 2, ev: Event) {
    const val = (ev.target as HTMLInputElement)?.value ?? '';
    if (which === 1) this.pw1 = val; else this.pw2 = val;
  }

  saveNewPassword() {
    if (!this.canSubmit) return;
    this.submitting = true;

    this.auth.changePasswordSelf(this.pw1).subscribe({
      next: () => {
        this.auth.refreshStatus().pipe(take(1)).subscribe(() => {
          this.pw1 = this.pw2 = '';
          this.submitting = false;
          if (!this.passwordResetRequired) this.overlayService.hideOverlay();
        });
      },
      error: (err) => {
        this.submitting = false;
        this.overlayService.showOverlay('error', err?.error?.error || 'Passwort konnte nicht geändert werden.');
      }
    });
  }

  // ----- andere Overlays -----
  close() {
    if (this.passwordResetRequired || this.overlayState.type === 'passwordReset') return;
    this.overlayService.hideOverlay();
  }

  @HostListener('document:keydown.escape')
  onEscHandler() {
    if (this.overlayState.show && this.overlayState.type !== 'passwordReset') {
      this.close();
    }
  }

  changeTheme(theme: Theme) { this.themeService.setTheme(theme); }
  changeOutline(outline: Outline) { this.themeService.setOutline(outline); }
  changeColor(color: Color) { this.themeService.setColor(color); }
}