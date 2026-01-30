import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService, FeedbackItem, FeedbackStatus } from '../feedback-service';
import { OverlayService } from '../overlay-service';
import { AuthService } from '../auth-service';

@Component({
  selector: 'app-admin-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback-component.html',
  styleUrls: ['./feedback-component.css']
})
export class FeedbackComponent implements OnInit {
  items: FeedbackItem[] = [];
  filter: '' | FeedbackStatus = '';
  loading = false;

  constructor(
    private feedback: FeedbackService,
    private overlay: OverlayService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    if (!this.auth.isAdmin()) {
      this.overlay.showOverlay('error', 'Nur Admins dürfen Feedback einsehen.');
      return;
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.feedback.list(this.filter || undefined).subscribe({
      next: (res) => {
        this.items = res.feedback || [];
        this.loading = false;
      },
      error: () => {
        this.overlay.showOverlay('error', 'Feedback konnte nicht geladen werden.');
        this.loading = false;
      }
    });
  }

  changeStatus(item: FeedbackItem, status: FeedbackStatus) {
    this.feedback.setStatus(item.id, status).subscribe({
      next: () => {
        item.status = status;
        this.overlay.showOverlay('success', 'Status aktualisiert.');
      },
      error: () => this.overlay.showOverlay('error', 'Status konnte nicht geändert werden.')
    });
  }

  remove(item: FeedbackItem) {
    if (!confirm('Dieses Feedback wirklich löschen?')) return;
    this.feedback.delete(item.id).subscribe({
      next: () => {
        this.items = this.items.filter(i => i.id !== item.id);
        this.overlay.showOverlay('success', 'Feedback gelöscht.');
      },
      error: () => this.overlay.showOverlay('error', 'Löschen fehlgeschlagen.')
    });
  }

  formatDateShort(raw: string | null | undefined): string {
    if (!raw) return '-';
    const str = String(raw);

    if (str.length >= 10 && str[4] === '-' && str[7] === '-' && !str.includes('T')) {
      const ymd = str.slice(0, 10);
      const parts = ymd.split('-');
      if (parts.length !== 3) return ymd;
      const [y, m, d] = parts;
      return `${d}.${m}.${y.slice(2)}`;
    }

    const d = new Date(str);
    if (isNaN(d.getTime())) {
      const ymd = str.slice(0, 10);
      const parts = ymd.split('-');
      if (parts.length !== 3) return ymd;
      const [y, m, day] = parts;
      return `${day}.${m}.${y.slice(2)}`;
    }

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(2);
    return `${dd}.${mm}.${yy}`;
  }

  formatDateTimeShort(raw: string | null | undefined): string {
    if (!raw) return '-';

    const str = String(raw);

    if (str.length >= 10 && str[4] === '-' && str[7] === '-' && !str.includes('T') && !str.includes(':')) {
      return this.formatDateShort(str);
    }

    const d = new Date(str);
    if (isNaN(d.getTime())) {
      return this.formatDateShort(str);
    }

    const datePart = this.formatDateShort(d.toISOString());
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    return `${datePart}, ${hh}:${mm}`;
  }
}