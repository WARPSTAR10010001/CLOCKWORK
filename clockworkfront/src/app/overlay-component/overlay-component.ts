import { Component, OnInit, Renderer2, HostListener, inject } from '@angular/core';
import { OverlayService, OverlayState } from '../overlay-service';
import { ThemeService, Theme, Outline, Color, Material } from '../theme-service';
import { AuthService } from '../auth-service';
import { take } from 'rxjs/operators';
import { FeedbackService, FeedbackCategory } from '../feedback-service';
import { VersionService } from '../version-service';

@Component({
  selector: 'app-overlay-component',
  templateUrl: './overlay-component.html',
  styleUrls: ['./overlay-component.css'],
})
export class OverlayComponent implements OnInit {
  private overlayService = inject(OverlayService);
  private themeService = inject(ThemeService);
  private renderer = inject(Renderer2);
  public auth = inject(AuthService);
  private feedbackService = inject(FeedbackService);
  private versionService = inject(VersionService);

  overlayState: OverlayState = { show: false, type: 'info' };
  selectedTheme: Theme = 'light';
  selectedOutline: Outline = 'no-outlines';
  selectedColor: Color = 'standard';
  selectedMaterial: Material = 'solid';

  pw1 = '';
  pw2 = '';
  submitting = false;
  passwordResetRequired = false;

  feedbackCategory: FeedbackCategory | '' = '';
  feedbackContent = '';
  sendingFeedback = false;
  readonly FEEDBACK_MAX = 750;
  appVersion = this.versionService.getVersion();

  noteText = "";

  private banned = new Set([
    '12345', '01234', 'passwort', 'kennwort', 'organist',
    'badehose', 'november11', 'reset', 'organist01', 'autohaus',
    'abcde', '47495', 'rheinberg', 'rheinberg47495', 'rheinberg',
    'admin', '123456', '11111', 'borth', 'wallach',
    'ossenberg', 'qwertz', '1qay2wsx', 'autohaus01', 'kirchplatz'
  ]);

  ngOnInit() {
    this.selectedTheme = this.themeService.getTheme();
    this.selectedOutline = this.themeService.getOutline();
    this.selectedColor = this.themeService.getColor();
    this.selectedMaterial = this.themeService.getMaterial();
    this.themeService.currentTheme$.subscribe(v => this.selectedTheme = v);
    this.themeService.currentOutline$.subscribe(v => this.selectedOutline = v);
    this.themeService.currentColor$.subscribe(v => this.selectedColor = v);
    this.themeService.currentMaterial$.subscribe(v => this.selectedMaterial = v);

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

    this.overlayService.overlay$.subscribe(state => {
      if (this.passwordResetRequired) {
        this.overlayState = { show: true, type: 'passwordReset' };
      } else {
        this.overlayState = state;
        this.renderer.setStyle(document.body, 'overflow', state.show ? 'hidden' : '');

        if (state.type === 'planNote' || state.type === 'planNoteEdit') {
          this.noteText = state.note ?? '';
        }

        if (!state.show || state.type !== 'feedback') {
          this.resetFeedbackFields(false);
        }
      }
    });

    this.auth.refreshStatus().pipe(take(1)).subscribe();
  }

  onNoteInput(ev: Event) {
    const val = (ev.target as HTMLInputElement)?.value ?? '';
    this.noteText = val;
  }

  openNoteEdit() {
    this.overlayService.openPlanNoteEdit(this.noteText);
  }

  backToNoteView() {
    this.overlayService.openPlanNote(this.noteText);
  }

  get pwMinLenOk(): boolean { return this.pw1.trim().length >= 5; }
  get pwNotBanned(): boolean { return !this.banned.has(this.pw1.trim().toLowerCase()); }
  get pwMatch(): boolean { return this.pw1 === this.pw2 && this.pw2.length > 0; }
  get canSubmit(): boolean { return this.pwMinLenOk && this.pwNotBanned && this.pwMatch && !this.submitting; }

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
  changeMaterial(material: Material) { this.themeService.setMaterial(material); }

  get remainingFeedbackChars(): number {
    return this.FEEDBACK_MAX - this.feedbackContent.length;
  }

  get canSendFeedback(): boolean {
    return !!this.feedbackCategory &&
      this.feedbackContent.trim().length > 0 &&
      this.feedbackContent.length <= this.FEEDBACK_MAX &&
      !this.passwordResetRequired &&
      !this.sendingFeedback;
  }

  onFeedbackCategoryChange(ev: Event) {
    const val = (ev.target as HTMLSelectElement)?.value ?? '';
    this.feedbackCategory = (val as FeedbackCategory) || '';
  }

  onFeedbackContentInput(ev: Event) {
    const val = (ev.target as HTMLTextAreaElement)?.value ?? '';
    this.feedbackContent = val.length > this.FEEDBACK_MAX ? val.slice(0, this.FEEDBACK_MAX) : val;
  }

  private resetFeedbackFields(resetCategory = true) {
    if (resetCategory) this.feedbackCategory = '';
    this.feedbackContent = '';
    this.sendingFeedback = false;
  }

  sendFeedback() {
    if (!this.canSendFeedback) return;

    this.sendingFeedback = true;
    const category = this.feedbackCategory as FeedbackCategory;
    const content = this.feedbackContent.trim();
    const version = this.appVersion || undefined;

    this.feedbackService.send(category, content, version).pipe(take(1)).subscribe({
      next: () => {
        this.resetFeedbackFields();
        this.overlayService.showOverlay('success', 'Danke! Dein Feedback wurde gesendet.');
        if (this.overlayState.type === 'feedback') this.overlayService.hideOverlay();
      },
      error: (err) => {
        this.sendingFeedback = false;
        const msg = err?.status === 401
          ? 'Sitzung abgelaufen. Bitte erneut anmelden.'
          : (err?.error?.error || 'Feedback konnte nicht gesendet werden.');
        this.overlayService.showOverlay('error', msg);
        if (err?.status === 401) {
          this.auth.logout();
        }
      }
    });
  }
}