import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PlanComponent } from './plan-component/plan-component';

export type ShowWeekend = "show-weekend" | "hide-weekend";
export type VacationTable = "show-vacationTable" | "hide-vacationTable";
export type CompressedRows = "compressed-rows" | "standard-rows";

@Injectable({ providedIn: 'root' })
export class PlanOptionsService {
  showWeekendKey = "showWeekend";
  vacationTableKey = "vacationTable";
  compressedRowsKey = "compressedRows";

  currentShowWeekendSubject = new BehaviorSubject<ShowWeekend>("hide-weekend");
  currentVacationTableSubject = new BehaviorSubject<VacationTable>("show-vacationTable");
  currentCompressedRowsSubject = new BehaviorSubject<CompressedRows>("standard-rows");

  currentShowWeekend$ = this.currentShowWeekendSubject.asObservable();
  currentVacationTable$ = this.currentVacationTableSubject.asObservable();
  currentCompressedRows$ = this.currentCompressedRowsSubject.asObservable();

  constructor(
    private plan: PlanComponent
  ) {
    const savedShowWeekendRaw = localStorage.getItem(this.showWeekendKey);
    const showWeekend = this.sanitizeShowWeekend(savedShowWeekendRaw);
    this.setShowWeekend(showWeekend, false);

    const savedVacationTableRaw = localStorage.getItem(this.vacationTableKey);
    const vacationTable = this.sanitizeVacationTable(savedVacationTableRaw);
    this.setVacationTable(vacationTable, false);

    const savedCompressedRowsRaw = localStorage.getItem(this.compressedRowsKey);
    const compressedRows = this.sanitizeCompressedRows(savedCompressedRowsRaw);
    this.setCompressedRows(compressedRows, false);
  }

  private sanitizeShowWeekend(raw: string | null): ShowWeekend {
    if (raw === "show-weekend" || raw === "hide-weekend") return raw;
    if (raw) localStorage.setItem(this.showWeekendKey, "hide-weekend");
    return "hide-weekend";
  }

  private sanitizeVacationTable(raw: string | null): VacationTable {
    if (raw === "show-vacationTable" || raw === "hide-vacationTable") return raw;
    if (raw) localStorage.setItem(this.vacationTableKey, "show-vacationTable");
    return "show-vacationTable";
  }

  private sanitizeCompressedRows(raw: string | null): CompressedRows {
    if (raw === "compressed-rows" || raw === "standard-rows") return raw;
    if (raw) localStorage.setItem(this.compressedRowsKey, "standard-rows");
    return "standard-rows";
  }

  setShowWeekend(showWeekend: ShowWeekend, save = true) {
    this.currentShowWeekendSubject.next(showWeekend);

    if (save) {
      localStorage.setItem(this.showWeekendKey, showWeekend);
    }

    this.plan.toggleWeekends();
  }

  getShowWeekend(): ShowWeekend {
    return this.currentShowWeekendSubject.value;
  }

  setVacationTable(vacationTable: VacationTable, save = true) {
    this.currentVacationTableSubject.next(vacationTable);

    if (save) {
      localStorage.setItem(this.vacationTableKey, vacationTable);
    }

    this.plan.reloadCurrentMonth();
  }

  getVacationTable(): VacationTable {
    return this.currentVacationTableSubject.value;
  }

  setCompressedRows(compressedRows: CompressedRows, save = true) {
    this.currentCompressedRowsSubject.next(compressedRows);

    if (save) {
      localStorage.setItem(this.compressedRowsKey, compressedRows);
    }

    this.plan.reloadCurrentMonth();
  }

  getCompressedRows(): CompressedRows {
    return this.currentCompressedRowsSubject.value;
  }
}