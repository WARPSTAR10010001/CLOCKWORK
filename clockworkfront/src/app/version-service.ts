import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VersionService {
  private version: string = "0.5.3";

  getVersion(): string {
    return this.version;
  }
}