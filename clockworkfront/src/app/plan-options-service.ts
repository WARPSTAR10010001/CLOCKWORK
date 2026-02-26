import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PlanOptionsService {
  showWeekends = false;
  showShortcuts = false;
  hideVacationTable = false;
  compressRows = false;

  private readonly WEEKENDS_COOKIE = "clockwork_show_weekends";
  private readonly SHORTCUTS_COOKIE = "clockwork_show_shortcuts";
  private readonly VACATIONTABLE_COOKIE = "clockwork_hide_vacationtable";
  private readonly COMPRESSROWS_COOKIE = "clockwork_compress_rows";

  loadWeekendPreference(): boolean {
    if (typeof document === "undefined") return false;
    const match = document.cookie.match(/(?:^|;\s*)clockwork_show_weekends=([^;]+)/);
    if (!match) return false;
    return match[1] === "1";
  }

  saveWeekendPreference(): void {
    if (typeof document === "undefined") return;
    const value = this.showWeekends ? "1" : "0";
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${this.WEEKENDS_COOKIE}=${value}; Max-Age=${maxAge}; Path=/`;
  }

  toggleShortcuts(): void {
    const newValue = !this.showShortcuts;
    this.showShortcuts = newValue;
    this.saveShortcutsPreference();
  }

  private loadShortcutsPreference(): boolean {
    if (typeof document === "undefined") return false;
    const match = document.cookie.match(/(?:^|;\s*)clockwork_show_shortcuts=([^;]+)/);
    if (!match) return false;
    return match[1] === "1";
  }

  private saveShortcutsPreference(): void {
    if (typeof document === "undefined") return;
    const value = this.showShortcuts ? "1" : "0";
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${this.SHORTCUTS_COOKIE}=${value}; Max-Age=${maxAge}; Path=/`;
  }

  toggleVacationTable(): void {
    const newValue = !this.hideVacationTable;
    this.hideVacationTable = newValue;
    this.saveVacationTablePreference();
  }

  private loadVacationTablePreference(): boolean {
    if (typeof document === "undefined") return false;
    const match = document.cookie.match(/(?:^|;\s*)clockwork_hide_vacationtable=([^;])/);
    if (!match) return false;
    return match[1] === "1";
  }

  private saveVacationTablePreference(): void {
    if (typeof document === "undefined") return;
    const value = this.hideVacationTable ? "1" : "0";
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${this.VACATIONTABLE_COOKIE}=${value}; Max-Age=${maxAge}; Path=/`;
  }

  toggleCompressedRows(): void {
    const newValue = !this.compressRows;
    this.compressRows = newValue;
    this.saveCompressedRowsPreference();
  }

  private loadCompressedRowsPreference(): boolean {
    if (typeof document === "undefined") return false;
    const match = document.cookie.match(/(?:^|;\s*)clockwork_compress_rows=([^;])/);
    if (!match) return false;
    return match[1] === "1";
  }

  private saveCompressedRowsPreference(): void {
    if (typeof document === "undefined") return;
    const value = this.compressRows ? "1" : "0";
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${this.COMPRESSROWS_COOKIE}=${value}; Max-Age=${maxAge}; Path=/`
  }
}
