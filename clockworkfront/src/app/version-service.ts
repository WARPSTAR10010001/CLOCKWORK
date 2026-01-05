import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VersionService {
  private version: string = "1.3.1";

  getVersion(): string {
    return this.version;
  }
}