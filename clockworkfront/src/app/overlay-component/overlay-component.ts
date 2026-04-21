import { Component, OnInit, Renderer2, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OverlayService, OverlayState } from '../overlay-service';
import { ThemeService, Theme, Outline, Color, Material } from '../theme-service';
import { AuthService } from '../auth-service';
import { take } from 'rxjs/operators';
import { FeedbackService, FeedbackCategory } from '../feedback-service';
import { VersionService } from '../version-service';
import { PlanService } from '../plan-service';
import { LogService } from '../log-service';
import { PlanOptionsService, ShowWeekend, VacationTable, CompressedRows, ShowLetters } from '../plan-options-service';
import { Page, LandingPageService } from '../landing-page-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-overlay-component',
  templateUrl: './overlay-component.html',
  imports: [FormsModule],
  styleUrl: './overlay-component.css',
})
export class OverlayComponent implements OnInit {
  constructor(
    private overlay: OverlayService,
    private theme: ThemeService,
    private renderer: Renderer2,
    private feedback: FeedbackService,
    public version: VersionService,
    private plan: PlanService,
    private log: LogService,
    private planOptions: PlanOptionsService,
    public auth: AuthService,
    private landingPage: LandingPageService,
    private router: Router
  ) { }

  overlayState: OverlayState = { show: false, type: 'info' };

  selectedTheme: Theme = 'light';
  selectedOutline: Outline = 'no-outlines';
  selectedColor: Color = 'standard';
  selectedMaterial: Material = 'solid';

  selectedShowWeekend: ShowWeekend = "hide-weekend";
  selectedVacationTable: VacationTable = "show-vacationTable";
  selectedCompressedRows: CompressedRows = "standard-rows";
  selectedShowLetters: ShowLetters = "show-letters";

  selectedLandingPage: Page = 'dashboard';

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

    this.selectedShowWeekend = this.planOptions.getShowWeekend();
    this.selectedVacationTable = this.planOptions.getVacationTable();
    this.selectedCompressedRows = this.planOptions.getCompressedRows();
    this.selectedShowLetters = this.planOptions.getShowLetters();

    this.planOptions.currentShowWeekend$.subscribe(v => this.selectedShowWeekend = v);
    this.planOptions.currentVacationTable$.subscribe(v => this.selectedVacationTable = v);
    this.planOptions.currentCompressedRows$.subscribe(v => this.selectedCompressedRows = v);
    this.planOptions.currentShowLetters$.subscribe(v => this.selectedShowLetters = v);

    this.selectedLandingPage = this.landingPage.getPage();

    this.landingPage.currentPage$.subscribe(v => this.selectedLandingPage = v);

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
        this.pw1 = this.pw2 = '';
        this.submitting = false;

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

  closeUpdate() {
    this.close();
    this.version.acknowledgeCurrentVersion();
  }

  openShortcuts() {
    this.overlay.showOverlay("planShortcuts");
  }

  openOptions() {
    this.overlay.showOverlay("planOptions2");
  }

  @HostListener('document:keydown.escape')
  onEscHandler() {
    if (this.overlayState.show && this.overlayState.type !== 'passwordReset' && this.overlayState.type !== 'update') {
      this.close();
    } else if (this.overlayState.type === "update") {
      this.closeUpdate();
    }
  }

  changeTheme(theme: Theme) { this.theme.setTheme(theme); }
  changeOutline(outline: Outline) { this.theme.setOutline(outline); }
  changeColor(color: Color) { this.theme.setColor(color); }
  changeMaterial(material: Material) { this.theme.setMaterial(material); }

  changeShowWeekend(showWeekend: ShowWeekend) { this.planOptions.setShowWeekend(showWeekend); }
  changeVacationTable(vacationTable: VacationTable) { this.planOptions.setVacationTable(vacationTable); }
  changeCompressedRows(compressedRows: CompressedRows) { this.planOptions.setCompressedRows(compressedRows); }
  changeShowLetters(showLetters: ShowLetters) { this.planOptions.setShowLetters(showLetters); }

  onLandingPageChange(newPage: Page) {
    this.landingPage.setPage(newPage);
  }

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

  navigateChangelog() {
    this.closeUpdate();
    this.router.navigate(["changelog"]);
  }

  clearData() {
    if (confirm("Sollen alle Daten gelöscht werden? Bitte diese Aktion nur durchführen wenn Sie durch einen Systemadmin dazu aufgefordert wurden!")) {
      this.theme.setTheme("light", false);
      this.theme.setOutline("no-outlines", false);
      this.theme.setColor("standard", false);
      this.theme.setMaterial("solid", false);

      this.planOptions.setCompressedRows("standard-rows", false);
      this.planOptions.setShowLetters("show-letters", false);
      this.planOptions.setShowWeekend("hide-weekend", false);
      this.planOptions.setVacationTable("show-vacationTable", false);

      this.landingPage.setPage("dashboard", false);

      localStorage.clear();

      this.auth.logout();

      this.close();

      if (this.auth.isLoggedIn()) {
        this.overlay.showOverlay("info", "Alle Browserdaten wurden erfolgreich gelöscht und Sie wurden abgemeldet.");
      } else {
        this.overlay.showOverlay("info", "Alle Browserdaten wurden erfolgreich gelöscht.");
      }
    }
  }

  getDebugInfo() {
    const ua = navigator.userAgent;

    const os = this.detectOS(ua);
    const browser = this.detectBrowser(ua);

    return {
      os,
      browser: browser.name,
      version: browser.version,
      userAgent: ua
    };
  }

  private detectOS(ua: string): string {
    if (ua.includes('Windows NT 10.0')) return 'Windows 10/11';
    if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (ua.includes('Windows NT 6.2')) return 'Windows 8';
    if (ua.includes('Windows NT 6.1')) return 'Windows 7';

    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS / iPadOS';
    if (ua.includes('Linux')) return 'Linux';

    return 'Unknown OS';
  }

  private detectBrowser(ua: string): { name: string; version: string } {
    let match;

    if ((match = ua.match(/Edg\/([\d.]+)/))) {
      return { name: 'Edge', version: match[1] };
    }

    if ((match = ua.match(/Chrome\/([\d.]+)/))) {
      return { name: 'Chrome', version: match[1] };
    }

    if ((match = ua.match(/Firefox\/([\d.]+)/))) {
      return { name: 'Firefox', version: match[1] };
    }

    if ((match = ua.match(/Version\/([\d.]+).*Safari/))) {
      return { name: 'Safari', version: match[1] };
    }

    return { name: 'Unknown', version: '0' };
  }
}