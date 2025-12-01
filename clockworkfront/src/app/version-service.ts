import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VersionService {
  private version: string = "0.5.1";

  getVersion(): string {
    return this.version;
  }
}