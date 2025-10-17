import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type OverlayType = 'style' | 'error' | 'success' | 'info' | 'passwordReset' | 'quickAction' | 'feedback';

export interface OverlayState {
  show: boolean;
  type: OverlayType;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OverlayService {
  private overlaySubject = new BehaviorSubject<OverlayState>({ show: false, type: 'info' });
  overlay$ = this.overlaySubject.asObservable();

  showOverlay(type: OverlayType, message?: string) {
    this.overlaySubject.next({ show: true, type, message });
  }

  hideOverlay() {
    const current = this.overlaySubject.value;
    this.overlaySubject.next({ ...current, show: false });
  }
}