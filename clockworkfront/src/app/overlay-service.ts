import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export type OverlayType =
  | 'style'
  | 'passwordReset'
  | 'feedback'
  | 'error'
  | 'success'
  | 'confirm'
  | 'info'
  | 'planNote'
  | 'planNoteEdit'
  | 'planOptions'
  | 'planShortcuts';

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

  private noteChangedSubject = new Subject<void>();
  public noteChanged$ = this.noteChangedSubject.asObservable();

  private hardLock: OverlayType | null = null;

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

  openPlanNote(note: string | null, payload?: any) {
    if (this.hardLock === 'passwordReset') return;
    this.stateSubject.next({
      show: true,
      type: 'planNote',
      note: note ?? '',
      payload
    });
  }

  openPlanNoteEdit(note: string | null, payload?: any) {
    if (this.hardLock === 'passwordReset') return;
    this.stateSubject.next({
      show: true,
      type: 'planNoteEdit',
      note: note ?? '',
      payload
    });
  }

  emitNoteChanged() {
    this.noteChangedSubject.next();
  }
}