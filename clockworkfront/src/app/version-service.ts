import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VersionService {
  private version: string = "1.6.0";

  getVersion(): string {
    return this.version;
  }
}