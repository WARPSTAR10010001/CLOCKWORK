import { Component, OnInit, Renderer2, HostListener, inject } from '@angular/core';
import { OverlayService, OverlayState } from '../overlay-service';
import { ThemeService, Theme, Outline, Color, Material } from '../theme-service';
import { AuthService } from '../auth-service';
import { take } from 'rxjs/operators';
import { FeedbackService, FeedbackCategory } from '../feedback-service';
import { VersionService } from '../version-service';
import { PlanService } from '../plan-service';
import { LogService } from '../log-service';

@Component({
  selector: 'app-overlay-component',
  templateUrl: './overlay-component.html',
  styleUrl: './overlay-component.css',
})
export class OverlayComponent implements OnInit {
  constructor(
    private overlay: OverlayService,
    private theme: ThemeService,
    private renderer: Renderer2,
    private feedback: FeedbackService,
    private version: VersionService,
    private plan: PlanService,
    private log: LogService,
    public auth: AuthService
  ) {}

  overlayState: OverlayState = { show: false, type: 'info' };
  selectedTheme: Theme = 'light';
  selectedOutline: Outline = 'no-outlines';
  selectedColor: Color = 'standard';
  selectedMaterial: Material = 'solid';

  selectedShowWeekends: boolean = false;

  pw1 = '';
  pw2 = '';
  submitting = false;
  passwordResetRequired = false;

  feedbackCategory: FeedbackCategory | '' = '';
  feedbackContent = '';
  sendingFeedback = false;
  readonly FEEDBACK_MAX = 750;
  appVersion: string = "";

  noteText = "";

  private banned = new Set([
    '12345', '01234', 'passwort', 'kennwort', 'organist',
    'badehose', 'november11', 'reset', 'organist01', 'autohaus',
    'abcde', '47495', 'rheinberg', 'rheinberg47495', 'rheinberg',
    'admin', '123456', '11111', 'borth', 'wallach',
    'ossenberg', 'qwertz', '1qay2wsx', 'autohaus01', 'kirchplatz'
  ]);

  ngOnInit() {
    this.appVersion = this.version.getVersion();

    this.selectedTheme = this.theme.getTheme();
    this.selectedOutline = this.theme.getOutline();
    this.selectedColor = this.theme.getColor();
    this.selectedMaterial = this.theme.getMaterial();
    this.theme.currentTheme$.subscribe(v => this.selectedTheme = v);
    this.theme.currentOutline$.subscribe(v => this.selectedOutline = v);
    this.theme.currentColor$.subscribe(v => this.selectedColor = v);
    this.theme.currentMaterial$.subscribe(v => this.selectedMaterial = v);

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

    this.overlay.overlay$.subscribe(state => {
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
    this.overlay.openPlanNoteEdit(
      this.noteText,
      this.overlayState.payload
    );
  }

  saveNote() {
    const payload = this.overlayState.payload;
    const entryId = payload?.entryId;
    const planId = payload?.planId;
    const departmentId = payload?.departmentId;
    const employeeId = payload?.employeeId;
    const date = payload?.date as string | undefined;
    const statusCode = (payload?.statusCode ?? null) as string | null;

    if (!entryId || !planId || !departmentId || !employeeId || !date) {
      this.overlay.openPlanNote(this.noteText, payload);
      return;
    }

    const oldNote = (this.overlayState.note ?? '').trim();
    const newNote = (this.noteText ?? '').trim();

    if (oldNote === newNote) {
      this.overlay.openPlanNote(this.noteText, payload);
      return;
    }

    let actionType: 'NOTE_SET' | 'NOTE_UPDATE' | 'NOTE_DELETE';

    if (!oldNote && newNote) {
      actionType = 'NOTE_SET';
    } else if (oldNote && !newNote) {
      actionType = 'NOTE_DELETE';
    } else {
      actionType = 'NOTE_UPDATE';
    }

    this.plan.updateEntry(entryId, { notes: newNote || null })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.log.createPlanLog({
            planId,
            departmentId,
            employeeId,
            actionType,
            statusCode,
            dateFrom: date,
            dateTo: date,
            dayCount: 1,
            dates: [date],
            noteBefore: oldNote || null,
            noteAfter: newNote || null
          }).pipe(take(1)).subscribe({
            next: () => {
              this.overlay.emitNoteChanged();

              this.overlay.openPlanNote(this.noteText, payload);
            },
            error: (err) => {
              console.error('Log konnte nicht geschrieben werden:', err);
              this.overlay.showOverlay('error', 'Die Änderung wurde gespeichert, aber der Log-Eintrag konnte nicht geschrieben werden.');
              this.overlay.emitNoteChanged();
              this.overlay.openPlanNote(this.noteText, payload);
            }
          });
        },
        error: (err) => {
          const msg = err?.error?.error || 'Die Beschreibung konnte nicht gespeichert werden.';
          this.overlay.showOverlay('error', msg);
        }
      });
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
          if (!this.passwordResetRequired) this.overlay.hideOverlay();
        });
      },
      error: (err) => {
        this.submitting = false;
        this.overlay.showOverlay('error', err?.error?.error || 'Passwort konnte nicht geändert werden.');
      }
    });
  }

  close() {
    if (this.passwordResetRequired || this.overlayState.type === 'passwordReset') return;
    this.overlay.hideOverlay();
  }

  openShortcuts() {
    this.overlay.showOverlay("planShortcuts");
  }

  openOptions() {
    this.overlay.showOverlay("planOptions");
  }

  @HostListener('document:keydown.escape')
  onEscHandler() {
    if (this.overlayState.show && this.overlayState.type !== 'passwordReset') {
      this.close();
    }
  }

  changeTheme(theme: Theme) { this.theme.setTheme(theme); }
  changeOutline(outline: Outline) { this.theme.setOutline(outline); }
  changeColor(color: Color) { this.theme.setColor(color); }
  changeMaterial(material: Material) { this.theme.setMaterial(material); }

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

    this.feedback.send(category, content, version).pipe(take(1)).subscribe({
      next: () => {
        this.resetFeedbackFields();
        this.overlay.showOverlay('success', 'Danke! Dein Feedback wurde gesendet.');
        if (this.overlayState.type === 'feedback') this.overlay.hideOverlay();
      },
      error: (err) => {
        this.sendingFeedback = false;
        const msg = err?.status === 401
          ? 'Sitzung abgelaufen. Bitte erneut anmelden.'
          : (err?.error?.error || 'Feedback konnte nicht gesendet werden.');
        this.overlay.showOverlay('error', msg);
        if (err?.status === 401) {
          this.auth.logout();
        }
      }
    });
  }
}