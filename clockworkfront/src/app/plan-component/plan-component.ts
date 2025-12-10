import { Component, OnInit, HostListener } from '@angular/core';
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
  daysForMonth: Date[] = [];

  private entryMap = new Map<string, PlanEntry>();

  selectedCells: SelectedCell[] = [];
  anchorCell: SelectedCell | null = null;

  weekdays: string[] = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  canGoPrev = false;
  canGoNext = false;
  availablePlanYears: number[] = [];

  showWeekends = false;

  private readonly WEEKENDS_COOKIE = 'clockwork_show_weekends';

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
    this.showWeekends = this.loadWeekendPreference();

    this.activatedRoute.paramMap.subscribe(params => {
      this.year = Number(params.get('year'));
      this.month = Number(params.get('month'));

      this.daysForMonth = this.generateDaysForMonth(this.year, this.month, this.showWeekends);
      this.deselect();

      this.loadHolidays(this.year);

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

  private isEmployeeActiveInMonth(emp: Employee, monthStart: Date, monthEnd: Date): boolean {
    const parseYmd = (s?: string | null) => {
      if (!s) return null;
      const y = parseInt(s.slice(0, 4), 10);
      const m = parseInt(s.slice(5, 7), 10) - 1;
      const d = parseInt(s.slice(8, 10), 10);
      return new Date(y, m, d);
    };

    const start = parseYmd(emp.start_month) || monthStart;
    const end = parseYmd(emp.end_month) || monthEnd;

    return start <= monthEnd && end >= monthStart;
  }

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

        this.availablePlanYears = (plans || []).map(p => p.year);

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

      const monthStart = new Date(this.year, this.month - 1, 1);
      const monthEnd = new Date(this.year, this.month, 0);

      const employeeById = new Map<number, Employee>(
        (bundle.employees || []).map(e => [e.id, e])
      );

      const activeIds = new Set<number>();

      for (const pe of bundle.planDetails.employees || []) {
        const emp = employeeById.get(pe.employeeId);
        if (!emp) continue;

        if (this.isEmployeeActiveInMonth(emp, monthStart, monthEnd)) {
          activeIds.add(emp.id);
        }
      }

      this.employees = (bundle.employees || []).filter(e => activeIds.has(e.id));

      this.updateNavAvailability();
    });
  }

  private updateNavAvailability(): void {
    if (!this.availablePlanYears || this.availablePlanYears.length === 0) {
      this.canGoPrev = false;
      this.canGoNext = false;
      return;
    }

    const years = this.availablePlanYears;
    const prevYearExists = years.includes(this.year - 1);
    const nextYearExists = years.includes(this.year + 1);

    this.canGoPrev = this.month > 1 || (this.month === 1 && prevYearExists);
    this.canGoNext = this.month < 12 || (this.month === 12 && nextYearExists);
  }

  private pad2(n: number): string { return String(n).padStart(2, '0'); }
  private monthKey(year: number, month: number): string { return `${year}-${this.pad2(month)}`; }

  private buildEntryMap(): void {
    this.entryMap.clear();
    this.monthEntries.forEach((entry: any) => {
      const key = `${entry.employee_id}-${entry.entry_date}`;
      this.entryMap.set(key, entry);
    });
  }

  private generateDaysForMonth(year: number, month: number, includeWeekends: boolean): Date[] {
    const days: Date[] = [];
    const d = new Date(year, month - 1, 1);
    while (d.getMonth() === month - 1) {
      const dow = d.getDay();
      if (includeWeekends || (dow !== 0 && dow !== 6)) {
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

  isWeekend(day: Date): boolean {
    const dow = day.getDay();
    return dow === 0 || dow === 6;
  }

  getHeaderClasses(day: Date): any {
    return {
      'holiday': this.isHoliday(day),
      'weekend-header': this.isWeekend(day)
    };
  }

  getCellClasses(employeeId: number, day: Date): any {
    const type = this.getCellType(employeeId, day);
    const classes: { [key: string]: boolean } = {
      'cell': true,
      'selected': this.isSelected(employeeId, day),
      'weekend-col': this.isWeekend(day)
    };
    if (type) {
      classes[`${type.toLowerCase()}-cell`] = true;
    }
    return classes;
  }

  getCellType(employeeId: number, day: Date): string | null {
    const key = `${employeeId}-${this.toIso(day)}`;
    return this.entryMap.get(key)?.status || null;
  }

  selectCell(employeeId: number, day: Date, event: MouseEvent): void {
    event.preventDefault();
    if (this.isWeekend(day)) return;

    const newSelection: SelectedCell = { employeeId, day };

    if (this.selectedCells.length > 0 && this.selectedCells[0].employeeId !== employeeId) {
      this.anchorCell = newSelection;
      this.selectedCells = [newSelection];
      return;
    }

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
    const allDaysInView = this.daysForMonth; // kann jetzt auch WE enthalten
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

  @HostListener('document:keydown.delete', ['$event'])
  onDelHandler(event: Event) {
    this.setEntry('');
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscHandler(event: Event) {
    this.deselect();
  }

  loadNextPlan(): void {
    const currentYear = Number(this.activatedRoute.snapshot.paramMap.get('year'));
    const currentMonth = Number(this.activatedRoute.snapshot.paramMap.get('month'));
    let nextYear = currentYear;
    let nextMonth = currentMonth;

    if (currentMonth === 12) {
      nextMonth = 1;
      nextYear++;
    } else {
      nextMonth++;
    }

    this.router.navigate(['/plan', nextYear, nextMonth]);
  }

  loadPrevPlan(): void {
    const currentYear = Number(this.activatedRoute.snapshot.paramMap.get('year'));
    const currentMonth = Number(this.activatedRoute.snapshot.paramMap.get('month'));
    let nextYear = currentYear;
    let nextMonth = currentMonth;

    if (currentMonth === 1) {
      nextMonth = 12;
      nextYear--;
    } else {
      nextMonth--;
    }

    this.router.navigate(['/plan', nextYear, nextMonth]);
  }

  toggleWeekends(): void {
    const newValue = !this.showWeekends;
    this.showWeekends = newValue;
    this.saveWeekendPreference();

    this.daysForMonth = this.generateDaysForMonth(this.year, this.month, this.showWeekends);
    this.deselect();

    if (newValue) {
      this.overlay.showOverlay(
        'info',
        'Das Anzeigen der Wochenendtage dient nur zur erleichterten visuellen Orientierung, daher können keine Einträge an diesen Tagen vorgenommen werden.'
      );
    }
  }

  private loadWeekendPreference(): boolean {
    if (typeof document === 'undefined') return false;
    const match = document.cookie.match(/(?:^|;\s*)clockwork_show_weekends=([^;]+)/);
    if (!match) return false;
    return match[1] === '1';
  }

  private saveWeekendPreference(): void {
    if (typeof document === 'undefined') return;
    const value = this.showWeekends ? '1' : '0';
    const maxAge = 60 * 60 * 24 * 365; // 1 Jahr
    document.cookie = `${this.WEEKENDS_COOKIE}=${value}; Max-Age=${maxAge}; Path=/`;
  }
}