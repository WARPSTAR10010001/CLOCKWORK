import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export type FeedbackStatus = 'neu'|'gelesen'|'bearbeitet';
export type FeedbackCategory =
  | 'Verbesserungsvorschlag'
  | 'Featureanfrage'
  | 'Visuelle- und/oder Logikfehler'
  | 'Lob'
  | 'Anderes';

export interface FeedbackItem {
  id: number;
  author_id: number | null;
  author_username: string;
  category: FeedbackCategory;
  content: string;
  app_version?: string | null;
  status: FeedbackStatus;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private baseUrl = environment.apiBase;

  constructor(private http: HttpClient) {}

  send(category: FeedbackCategory, content: string, appVersion?: string) {
    return this.http.post<{ id: number; status: FeedbackStatus; createdAt: string }>(
      `${this.baseUrl}/feedback`,
      { category, content, appVersion }
    );
  }

  list(status?: FeedbackStatus): Observable<{ feedback: FeedbackItem[] }> {
    const url = status ? `${this.baseUrl}/feedback?status=${encodeURIComponent(status)}` : `${this.baseUrl}/feedback`;
    return this.http.get<{ feedback: FeedbackItem[] }>(url);
  }

  setStatus(id: number, status: FeedbackStatus) {
    return this.http.patch<{ id: number; status: FeedbackStatus }>(`${this.baseUrl}/feedback/${id}/status`, { status });
  }

  delete(id: number) {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/feedback/${id}`);
  }
}