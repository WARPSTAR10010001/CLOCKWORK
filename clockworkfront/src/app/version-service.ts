import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VersionService {
  private version: string = "2.0.0";
  private summary: string = "CLOCKWORK hat nun eine neue zentrale Startseite! Zusätzlich dazu wurde die gesamte Infrastruktur erneuert.";
  private versionKey = 'last_logged_version';

  getVersion(): string {
    return this.version;
  }

  getUpdateSummary(): string {
    return this.summary;
  }

  shouldShowUpdateOverlay(): boolean {
    const lastVersion = localStorage.getItem(this.versionKey);
    return lastVersion !== this.version;
  }

  acknowledgeCurrentVersion(): void {
    localStorage.setItem(this.versionKey, this.version);
  }
}