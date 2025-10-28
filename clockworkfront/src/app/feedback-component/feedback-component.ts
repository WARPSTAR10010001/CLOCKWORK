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
  ) {}

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
}