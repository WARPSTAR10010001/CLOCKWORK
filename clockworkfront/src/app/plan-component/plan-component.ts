import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../overlay-service';
import { BackendAccess } from '../backend-access';
import { PlanEntry, PlanEntryStatus } from '../types';
import { Employee, EmployeeService } from '../employee-service';
import { withLatestFrom, switchMap, tap, map, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../auth-service';

interface SelectedCell {
  employeeId: number;
  day: Date;
}

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-component.html',
  styleUrl: './plan-component.css'
})
export class PlanComponent implements OnInit {
  year!: number;
  month!: number;

  planId: number | null = null;
  departmentId: number | null = null;

  employees: Employee[] = [];
  monthEntries: PlanEntry[] = [];
  daysForMonth: Date[] = [];   // enthält NUR Mo–Fr

  private entryMap = new Map<string, PlanEntry>();

  selectedCells: SelectedCell[] = [];
  anchorCell: SelectedCell | null = null;

  // nur für Anzeige, obwohl Wochenenden nicht mehr gerendert werden
  weekdays: string[] = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  constructor(
    private backend: BackendAccess,
    private employeeService: EmployeeService,
    private auth: AuthService,
    private activatedRoute: ActivatedRoute,
    private overlay: OverlayService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.activatedRoute.paramMap.pipe(
      tap(params => {
        this.year = Number(params.get('year'));
        this.month = Number(params.get('month'));
        this.daysForMonth = this.generateWeekdaysForMonth(this.year, this.month);
        this.deselect();
      }),
      withLatestFrom(this.auth.authStatus$),
      map(([_, status]) => {
        const depId = status?.user?.departmentId ?? null;
        this.departmentId = depId;
        return depId;
      }),
      switchMap(depId => {
        if (!depId) {
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
        const { plans } = data;
        const plan = plans.find(p => p.year === this.year) || null;
        if (!plan) {
          this.overlay.showOverlay('error', `Für ${this.year} existiert noch kein Plan.`);
          this.router.navigate(['/mod']);
          return of(null);
        }
        this.planId = plan.id;
        const monthStr = this.monthKey(this.year, this.month);
        return forkJoin({
          employees: this.employeeService.getEmployeesForDepartment(),
          entries: this.backend.getPlanEntriesForMonth(plan.id, monthStr),
          planDetails: this.backend.getPlanDetails(plan.id)
        }).pipe(
          map(({ employees, entries, planDetails }) => ({
            employees,
            entries,
            planDetails
          }))
        );
      }),
      catchError(() => {
        this.overlay.showOverlay('error', 'Fehler beim Laden der Plan-Daten.');
        return of(null);
      })
    ).subscribe(bundle => {
      if (!bundle) return;

      // 1) Entries in Map
      this.monthEntries = bundle.entries.entries;
      this.buildEntryMap();

      // 2) Mitarbeitende nach plan-spezifischem Fenster filtern (Start/Ende monatsbasiert)
      const monthKey = this.monthKey(this.year, this.month); // 'YYYY-MM'
      const activeIds = new Set<number>(
        bundle.planDetails.employees
          .filter(pe => {
            const start = (pe.startMonth ?? `${this.year}-01-01`).slice(0, 7);
            const end = pe.endMonth ? pe.endMonth.slice(0, 7) : null; // null = offen
            return (monthKey >= start) && (end ? monthKey <= end : true);
          })
          .map(pe => pe.employeeId)
      );

      this.employees = (bundle.employees || []).filter(e => activeIds.has(e.id));
    });
  }

  // === Helpers ===

  private pad2(n: number): string { return String(n).padStart(2, '0'); }
  private monthKey(year: number, month: number): string { return `${year}-${this.pad2(month)}`; }

  private buildEntryMap(): void {
    this.entryMap.clear();
    this.monthEntries.forEach(entry => {
      const key = `${entry.employee_id}-${entry.entry_date}`; // exakt Serverformat
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
    // doppelte Sicherheit: keine Auswahl am Wochenende
    if (this.isWeekend(day)) return;

    const newSelection = { employeeId, day };
    if (event.ctrlKey || event.metaKey) {
      this.anchorCell = newSelection;
      const index = this.selectedCells.findIndex(c => this.isSameCell(c, newSelection));
      if (index > -1) { this.selectedCells.splice(index, 1); } else { this.selectedCells.push(newSelection); }
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
    const allDaysInView = this.daysForMonth; // enthält nur Wochentage
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
    const t = (type || '').toUpperCase();
    if (t === 'PRESENCE' || t === 'P') return 'PRESENCE';
    if (t === 'HOME' || t === 'H') return 'HOME';
    if (t === 'MEETING' || t === 'M') return 'MEETING';
    if (t === 'FLEXTIME' || t === 'F') return 'FLEXTIME';
    if (t === 'TRAINING' || t === 'T') return 'TRAINING';
    if (t === 'VACATION' || t === 'U' || t === 'V') return 'VACATION';
    if (t === 'SICK' || t === 'K') return 'SICK';
    if (t === 'OTHER' || t === 'O') return 'OTHER';
    return null;
  }

  setEntry(type: string): void {
    if (!this.planId || !this.departmentId || this.selectedCells.length === 0) return;

    const status = this.mapUiTypeToStatus(type);

    // Gruppiere strikt nur Wochentage (daysForMonth ist ohnehin Mo–Fr, aber sicher ist sicher)
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

    if (calls.length === 0) { this.deselect(); return; }

    forkJoin(calls).pipe(
      switchMap(() => this.backend.getPlanEntriesForMonth(this.planId!, this.monthKey(this.year, this.month)))
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

  getCellClasses(employeeId: number, day: Date): any {
    const type = this.getCellType(employeeId, day);
    const classes: { [key: string]: boolean } = {
      'cell': true,
      'selected': this.isSelected(employeeId, day)
    };
    if (type) classes[`${type.toLowerCase()}-cell`] = true;
    return classes;
  }

  getStatus(employeeId: number, day: Date): PlanEntryStatus | null {
    const key = `${employeeId}-${this.toIso(day)}`;
    return (this.entryMap.get(key)?.status as PlanEntryStatus) || null;
  }

  statusLabel(status: PlanEntryStatus | null): string {
    if (!status) return '';
    // kurze Kürzel fürs Grid
    const map: Record<PlanEntryStatus, string> = {
      PRESENCE: '',
      HOME: 'H',
      MEETING: 'M',
      FLEXTIME: 'G',
      TRAINING: 'L',
      VACATION: 'U',
      SICK: 'K',
      OTHER: '•'
    };
    return map[status] ?? '';
  }
}