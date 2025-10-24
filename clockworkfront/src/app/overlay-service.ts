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
  | 'info';

export interface OverlayState {
  show: boolean;
  type: OverlayType;
  message?: string;
  payload?: any;
}

@Injectable({ providedIn: 'root' })
export class OverlayService {
  private stateSubject = new BehaviorSubject<OverlayState>({ show: false, type: 'info' });
  public overlay$ = this.stateSubject.asObservable();

  /** Wenn gesetzt, blockiert dieser Lock alle anderen Overlays. */
  private hardLock: OverlayType | null = null;

  /** Standard: Overlay anzeigen (respektiert Lock). */
  showOverlay(type: OverlayType, message?: string, payload?: any) {
    // Wenn Password-Reset aktiv ist, ALLES außer passwordReset ignorieren
    if (this.hardLock === 'passwordReset' && type !== 'passwordReset') return;

    this.stateSubject.next({ show: true, type, message, payload });
  }

  /** Standard: Overlay schließen (respektiert Lock). */
  hideOverlay() {
    if (this.hardLock === 'passwordReset') return; // Hard-Lock: nicht schließbar
    const cur = this.stateSubject.value;
    this.stateSubject.next({ ...cur, show: false });
  }

  /** Password-Reset hart aktivieren. */
  lockToPasswordReset(message?: string) {
    this.hardLock = 'passwordReset';
    this.stateSubject.next({ show: true, type: 'passwordReset', message });
  }

  /** Password-Reset wieder freigeben (z. B. nach erfolgreichem Reset). */
  unlockPasswordReset() {
    if (this.hardLock === 'passwordReset') {
      this.hardLock = null;
      // nach Freigabe keine forcierte Anzeige – Komponente kann selbst schließen:
      const cur = this.stateSubject.value;
      this.stateSubject.next({ ...cur, show: false });
    }
  }

  /** Für Debug / externe Prüfer: */
  get current(): OverlayState {
    return this.stateSubject.value;
  }

  /** Ob aktuell ein harter Lock aktiv ist. */
  get isLocked(): boolean {
    return this.hardLock !== null;
  }
}