// src/app/plan-component/plan-component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../overlay-service';
import { BackendAccess } from '../backend-access';
import { PlanEntry, PlanEntryStatus } from '../types';
import { Employee, EmployeeService } from '../employee-service';
import { switchMap, map, catchError, take } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../auth-service';
import { ImpersonationService } from '../impersonation-service';
import { HolidayService } from '../holiday-service';
import { HostListener } from '@angular/core';

interface SelectedCell {
  employeeId: number;
  day: Date;
}

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './plan-component.html',
  styleUrl: './plan-component.css'
})
export class PlanComponent implements OnInit {
  private holidaySet = new Set<number>();

  year!: number;
  month!: number;

  planId: number | null = null;
  departmentId: number | null = null;

  employees: Employee[] = [];
  monthEntries: PlanEntry[] = [];
  daysForMonth: Date[] = [];   // nur Mo–Fr

  private entryMap = new Map<string, PlanEntry>();

  selectedCells: SelectedCell[] = [];
  anchorCell: SelectedCell | null = null;

  weekdays: string[] = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  constructor(
    private backend: BackendAccess,
    private employeeService: EmployeeService,
    private auth: AuthService,
    private imp: ImpersonationService,
    private activatedRoute: ActivatedRoute,
    private overlay: OverlayService,
    private router: Router,
    private holidays: HolidayService
  ) { }

  ngOnInit(): void {
    // Route-Parameter beobachten (year, month)
    this.activatedRoute.paramMap.subscribe(params => {
      this.year = Number(params.get('year'));
      this.month = Number(params.get('month'));

      this.daysForMonth = this.generateWeekdaysForMonth(this.year, this.month);
      this.deselect();

      // 1) Feiertage laden (eigene HTTP-Request)
      this.loadHolidays(this.year);

      // 2) Plandaten laden
      this.loadPlan();
    });
  }

  private getSelectionSummary(): {
    employeeId: number;
    dateFrom: string;
    dateTo: string;
    dayCount: number;
    dates: string[];
  } | null {
    if (this.selectedCells.length === 0) return null;

    // durch selectCell-Logik garantiert: nur ein Mitarbeiter
    const employeeId = this.selectedCells[0].employeeId;

    const uniqueIso = Array.from(
      new Set(this.selectedCells.map(c => this.toIso(c.day)))
    ).sort();

    if (uniqueIso.length === 0) return null;

    return {
      employeeId,
      dateFrom: uniqueIso[0],
      dateTo: uniqueIso[uniqueIso.length - 1],
      dayCount: uniqueIso.length,
      dates: uniqueIso
    };
  }

  // ----- Feiertage -----
  private loadHolidays(year: number): void {
    this.holidays.getForYear(year).pipe(take(1)).subscribe({
      next: set => {
        this.holidaySet = set;
      },
      error: err => {
        console.error('Feiertage laden fehlgeschlagen:', err);
        this.holidaySet = new Set();
      }
    });
  }

  isHoliday(day: Date): boolean {
    return this.holidaySet.has(this.dayKeyFromDate(day));
  }

  // ----- Plandaten -----
  private loadPlan(): void {
    this.auth.authStatus$.pipe(
      take(1),
      map(status => {
        const impDep = this.imp.getEffectiveDepartmentId();
        const fromJwt = status?.user?.departmentId ?? null;
        const depId = this.auth.isAdmin() ? (impDep ?? null) : fromJwt ?? null;
        this.departmentId = depId;
        return depId;
      }),
      switchMap(depId => {
        if (!depId) {
          if (this.auth.isAdmin()) {
            this.overlay.showOverlay('info', 'Bitte zuerst einen Fachbereich im Modpanel auswählen.');
            this.router.navigate(['/mod']);
            return of(null);
          }
          this.overlay.showOverlay('error', 'Kein Fachbereich im Login gefunden.');
          this.router.navigate(['/auth']);
          return of(null);
        }

        return this.backend.getPlansForDepartment(depId).pipe(
          map(res => ({ depId, plans: res.plans }))
        );
      }),
      switchMap(data => {
        if (!data) return of(null);
        const { depId, plans } = data;
        const plan = plans.find(p => p.year === this.year) || null;
        if (!plan) {
          this.overlay.showOverlay('error', `Für ${this.year} existiert noch kein Plan.`);
          this.router.navigate(['/mod']);
          return of(null);
        }
        this.planId = plan.id;
        const monthStr = this.monthKey(this.year, this.month);

        return forkJoin({
          employees: this.employeeService.getEmployeesForDepartment(depId),
          entries: this.backend.getPlanEntriesForMonth(plan.id, monthStr),
          planDetails: this.backend.getPlanDetails(plan.id),
          holidays: this.holidays.getForYear(this.year)
        }).pipe(
          map(({ employees, entries, planDetails, holidays }) => ({
            employees,
            entries,
            planDetails,
            holidays
          }))
        );
      }),

      catchError(err => {
        console.error('Fehler beim Laden der Plandaten:', err);
        this.overlay.showOverlay('error', 'Fehler beim Laden der Plandaten.');
        return of(null);
      })
    ).subscribe(bundle => {
      if (!bundle) return;

      this.holidaySet = bundle.holidays || new Set<number>();

      this.monthEntries = (bundle.entries.entries || []).map((e: any) => {
        const entry_date = String(e.entry_date).slice(0, 10);
        const status = e.status ?? e.entry_type ?? null;
        return { ...e, entry_date, status };
      });
      this.buildEntryMap();

      const monthKey = this.monthKey(this.year, this.month); // 'YYYY-MM'
      const activeIds = new Set<number>(
        bundle.planDetails.employees
          .filter((pe: any) => {
            const start = (pe.startMonth ?? `${this.year}-01-01`).slice(0, 7);
            const end = pe.endMonth ? pe.endMonth.slice(0, 7) : null;
            return (monthKey >= start) && (end ? monthKey <= end : true);
          })
          .map((pe: any) => pe.employeeId)
      );

      this.employees = (bundle.employees || []).filter(e => activeIds.has(e.id));
    });
  }

  // === Helpers ===
  private pad2(n: number): string { return String(n).padStart(2, '0'); }
  private monthKey(year: number, month: number): string { return `${year}-${this.pad2(month)}`; }

  private buildEntryMap(): void {
    this.entryMap.clear();
    this.monthEntries.forEach((entry: any) => {
      const key = `${entry.employee_id}-${entry.entry_date}`;
      this.entryMap.set(key, entry);
    });
  }

  /** erzeugt nur Montag–Freitag */
  private generateWeekdaysForMonth(year: number, month: number): Date[] {
    const days: Date[] = [];
    const d = new Date(year, month - 1, 1);
    while (d.getMonth() === month - 1) {
      const day = d.getDay(); // 0 So, 6 Sa
      if (day !== 0 && day !== 6) {
        days.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
    return days;
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = this.pad2(d.getMonth() + 1);
    const day = this.pad2(d.getDate());
    return `${y}-${m}-${day}`;
  }

  private isWeekend(day: Date): boolean {
    const dow = day.getDay();
    return dow === 0 || dow === 6;
  }

  getCellType(employeeId: number, day: Date): string | null {
    const key = `${employeeId}-${this.toIso(day)}`;
    return this.entryMap.get(key)?.status || null;
  }

  // === Auswahl ===
  selectCell(employeeId: number, day: Date, event: MouseEvent): void {
    event.preventDefault();
    if (this.isWeekend(day)) return;

    const newSelection: SelectedCell = { employeeId, day };

    // Wenn bereits Auswahl existiert und anderer Mitarbeiter angeklickt wird:
    if (this.selectedCells.length > 0 && this.selectedCells[0].employeeId !== employeeId) {
      this.anchorCell = newSelection;
      this.selectedCells = [newSelection];
      return;
    }

    // Ab hier: entweder keine Auswahl oder gleicher Mitarbeiter
    if (event.ctrlKey || event.metaKey) {
      this.anchorCell = newSelection;
      const index = this.selectedCells.findIndex(c => this.isSameCell(c, newSelection));
      if (index > -1) {
        this.selectedCells.splice(index, 1);
      } else {
        this.selectedCells.push(newSelection);
      }
    } else if (event.shiftKey && this.anchorCell) {
      this.selectedCells = this.getCellsInRange(this.anchorCell, newSelection);
    } else {
      this.anchorCell = newSelection;
      this.selectedCells = [newSelection];
    }
  }

  private getCellsInRange(start: SelectedCell, end: SelectedCell): SelectedCell[] {
    if (start.employeeId !== end.employeeId) return [end];
    const employeeId = start.employeeId;
    const allDaysInView = this.daysForMonth; // nur Mo–Fr
    const startIndex = allDaysInView.findIndex(d => d.getTime() === start.day.getTime());
    const endIndex = allDaysInView.findIndex(d => d.getTime() === end.day.getTime());
    if (startIndex === -1 || endIndex === -1) return [];
    const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
    return allDaysInView.slice(min, max + 1).map(day => ({ employeeId, day }));
  }

  isSelected(employeeId: number, day: Date): boolean {
    return this.selectedCells.some(c => this.isSameCell(c, { employeeId, day }));
  }

  private isSameCell(a: SelectedCell, b: SelectedCell): boolean {
    return a.employeeId === b.employeeId && a.day.getTime() === b.day.getTime();
  }

  deselect(): void {
    this.selectedCells = [];
    this.anchorCell = null;
  }

  // === Aktionen ===
  private mapUiTypeToStatus(type: string): PlanEntryStatus | null {
    switch ((type || '').trim().toUpperCase()) {
      case 'U': return 'VACATION';
      case 'H': return 'HOME';
      case 'K': return 'SICK';
      case 'L': return 'TRAINING';
      case 'G': return 'FLEXTIME';
      case 'T': return 'APPOINTMENT';
      case 'O': return 'OTHER';
      case '': return null;
      default: return null;
    }
  }

  setEntry(type: string): void {
    if (!this.planId || !this.departmentId || this.selectedCells.length === 0) return;

    const status = this.mapUiTypeToStatus(type);

    // Auswahl zusammenfassen (inkl. employeeId & alle Tage)
    const summary = this.getSelectionSummary();
    if (!summary) {
      this.deselect();
      return;
    }

    const groupedByEmployee = new Map<number, string[]>();
    this.selectedCells.forEach(cell => {
      if (!this.isWeekend(cell.day)) {
        const dates = groupedByEmployee.get(cell.employeeId) || [];
        dates.push(this.toIso(cell.day));
        groupedByEmployee.set(cell.employeeId, dates);
      }
    });

    const calls: any[] = [];
    groupedByEmployee.forEach((dates, employeeId) => {
      if (!status) {
        calls.push(this.backend.deleteEntriesByDates(this.planId!, employeeId, dates));
      } else {
        calls.push(
          this.backend.createEntriesBatch(
            {
              planId: this.planId!,
              departmentId: this.departmentId!,
              employeeId,
              status
            },
            dates,
            status
          )
        );
      }
    });

    if (calls.length === 0) {
      this.deselect();
      return;
    }

    const affectedDays = summary.dayCount;

    forkJoin(calls).pipe(
      switchMap(() => {
        if (affectedDays > 0) {
          const actionText = status
            ? `Aktion "${this.statusLabel(status)}" auf ${affectedDays} Tag(e) gesetzt`
            : `${affectedDays} Tag(e) gelöscht`;
        }

        // Logging: immer wenn mindestens ein Tag betroffen ist
        const log$ = (this.planId && this.departmentId && affectedDays > 0)
          ? this.backend.createPlanLog({
            planId: this.planId!,
            departmentId: this.departmentId!,
            employeeId: summary.employeeId,
            actionType: status ? 'SET' : 'DELETE',
            statusCode: status ?? null,
            dateFrom: summary.dateFrom,
            dateTo: summary.dateTo,
            dayCount: summary.dayCount,
            dates: summary.dates
          }).pipe(
            catchError(err => {
              console.error('Plan-Log konnte nicht geschrieben werden:', err);
              return of(null);
            })
          )
          : of(null);

        return log$.pipe(
          switchMap(() =>
            this.backend.getPlanEntriesForMonth(this.planId!, this.monthKey(this.year, this.month))
          )
        );
      })
    ).subscribe({
      next: (res) => {
        this.monthEntries = res.entries;
        this.buildEntryMap();
        this.deselect();
      },
      error: (err) => {
        this.overlay.showOverlay('error', err?.error?.error || 'Aktion konnte nicht ausgeführt werden.');
        this.deselect();
      }
    });
  }

  // HIER angepasst: holiday nicht mehr auf den Zellen selbst
  getCellClasses(employeeId: number, day: Date): any {
    const type = this.getCellType(employeeId, day);
    const classes: { [key: string]: boolean } = {
      'cell': true,
      'selected': this.isSelected(employeeId, day)
      // keine 'holiday' mehr hier
    };
    if (type) classes[`${type.toLowerCase()}-cell`] = true;
    return classes;
  }

  getStatus(employeeId: number, day: Date): PlanEntryStatus | null {
    const key = `${employeeId}-${this.toIso(day)}`;
    const e: any = this.entryMap.get(key);
    return (e?.status ?? e?.entry_type ?? null) as PlanEntryStatus | null;
  }

  statusLabel(status: PlanEntryStatus | null): string {
    if (!status) return '';
    const map: Record<PlanEntryStatus, string> = {
      VACATION: 'U',
      HOME: 'H',
      SICK: 'K',
      TRAINING: 'L',
      FLEXTIME: 'G',
      APPOINTMENT: 'T',
      OTHER: 'O',
      PRESENCE: 'P'
    };
    return map[status] ?? '';
  }

  private dayKeyFromDate(d: Date): number {
    // Normiert auf lokale Mitternacht des sichtbaren Datums
    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.floor(local.getTime() / 86400000);
  }

  @HostListener('document:keydown.u', ['$event'])
  onUHandler(event: Event) {
    this.setEntry('U');
  }

  @HostListener('document:keydown.k', ['$event'])
  onKHandler(event: Event) {
    this.setEntry('K');
  }

  @HostListener('document:keydown.h', ['$event'])
  onHHandler(event: Event) {
    this.setEntry('H');
  }

  @HostListener('document:keydown.l', ['$event'])
  onLHandler(event: Event) {
    this.setEntry('L');
  }

  @HostListener('document:keydown.g', ['$event'])
  onGHandler(event: Event) {
    this.setEntry('G');
  }

  @HostListener('document:keydown.t', ['$event'])
  onTHandler(event: Event) {
    this.setEntry('T');
  }

  @HostListener('document:keydown.o', ['$event'])
  onOHandler(event: Event) {
    this.setEntry('O');
  }
}