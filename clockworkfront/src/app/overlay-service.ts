import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type OverlayType =
  | 'style'
  | 'passwordReset'
  | 'quickAction'
  | 'feedback'
  | 'error'
  | 'success'
  | 'confirm'
  | 'info'
  | 'planNote'
  | 'planNoteEdit';

export interface OverlayState {
  show: boolean;
  type: OverlayType;
  message?: string;
  note?: string | null;
  payload?: any;
}

@Injectable({ providedIn: 'root' })
export class OverlayService {
  private stateSubject = new BehaviorSubject<OverlayState>({ show: false, type: 'info' });
  public overlay$ = this.stateSubject.asObservable();

  private hardLock: OverlayType | null = null;

  /**
   * Allgemeines Overlay anzeigen.
   * - type: Art des Overlays
   * - message: optionale Nachricht
   * - payload: beliebige Zusatzdaten
   * - extra: weitere optionale Felder aus OverlayState (z.B. note)
   */
  showOverlay(
    type: OverlayType,
    message?: string,
    payload?: any,
    extra?: Partial<OverlayState>
  ) {
    if (this.hardLock === 'passwordReset' && type !== 'passwordReset') return;

    this.stateSubject.next({
      show: true,
      type,
      message,
      payload,
      ...(extra || {})
    });
  }

  hideOverlay() {
    if (this.hardLock === 'passwordReset') return;
    const cur = this.stateSubject.value;
    this.stateSubject.next({ ...cur, show: false });
  }

  lockToPasswordReset(message?: string) {
    this.hardLock = 'passwordReset';
    this.stateSubject.next({ show: true, type: 'passwordReset', message });
  }

  unlockPasswordReset() {
    if (this.hardLock === 'passwordReset') {
      this.hardLock = null;
      const cur = this.stateSubject.value;
      this.stateSubject.next({ ...cur, show: false });
    }
  }

  get current(): OverlayState {
    return this.stateSubject.value;
  }

  get isLocked(): boolean {
    return this.hardLock !== null;
  }

  /** Spezieller Helper: Nur Anzeige der Plan-Notiz */
  openPlanNote(note: string | null, payload?: any) {
    if (this.hardLock === 'passwordReset') return;
    this.stateSubject.next({
      show: true,
      type: 'planNote',
      note: note ?? '',
      payload
    });
  }

  /** Spezieller Helper: Notiz im Edit-Mode */
  openPlanNoteEdit(note: string | null, payload?: any) {
    if (this.hardLock === 'passwordReset') return;
    this.stateSubject.next({
      show: true,
      type: 'planNoteEdit',
      note: note ?? '',
      payload
    });
  }
}