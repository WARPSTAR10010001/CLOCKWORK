import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// Wichtig: NgClass wird für die [ngClass]-Direktive im Template benötigt
import { CommonModule, NgClass } from '@angular/common'; 
import { OverlayService } from '../overlay-service';
import { BackendAccess, Plan, PlanEntry } from '../backend-access';
import { Employee, EmployeeService } from '../employee-service';
import { switchMap, tap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

// Definiert die Struktur für eine Zelle im Plan
interface SelectedCell {
  employeeId: number;
  day: Date;
}

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule, NgClass], // NgClass hier importieren
  templateUrl: './plan-component.html',
  styleUrl: './plan-component.css'
})
export class PlanComponent implements OnInit {
  year!: number;
  month!: number;

  currentPlan: Plan | null = null;
  employees: Employee[] = [];
  allEntriesForYear: PlanEntry[] = [];
  daysForMonth: Date[] = [];

  private entryMap = new Map<string, PlanEntry>();

  selectedCells: SelectedCell[] = [];
  anchorCell: SelectedCell | null = null;

  // KORRIGIERT: Das 'weekdays'-Array ist jetzt eine Eigenschaft der Klasse
  // Die Reihenfolge passt zu Date.getDay(), wobei Sonntag der Index 0 ist.
  weekdays: string[] = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  constructor(
    private backendAccess: BackendAccess,
    private employeeService: EmployeeService,
    private activatedRoute: ActivatedRoute,
    private overlayService: OverlayService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap.pipe(
      tap(params => {
        this.year = Number(params.get("year"));
        this.month = Number(params.get("month"));
        this.daysForMonth = this.generateDaysForMonth(this.year, this.month);
        this.deselect();
      }),
      switchMap(() => 
        forkJoin({
          plans: this.backendAccess.getPlans(this.year),
          employees: this.employeeService.getEmployeesForDepartment()
        })
      ),
      switchMap(({ plans, employees }) => {
        this.currentPlan = plans.find(p => p.year === this.year) || null;
        this.employees = employees;
        if (!this.currentPlan) {
          this.overlayService.showOverlay("error", `Für ${this.year} existiert noch kein Plan.`);
          this.router.navigate(['/mod']);
          return of([]);
        }
        return this.backendAccess.getPlanEntries(this.currentPlan.id);
      })
    ).subscribe({
      next: (entries) => {
        this.allEntriesForYear = entries;
        this.buildEntryMap();
      },
      error: (err) => this.overlayService.showOverlay("error", "Ein Fehler ist beim Laden des Plans aufgetreten.")
    });
  }

  private buildEntryMap(): void {
    this.entryMap.clear();
    this.allEntriesForYear.forEach(entry => {
      const key = `${entry.employee_id}-${entry.entry_date}`;
      this.entryMap.set(key, entry);
    });
  }

  generateDaysForMonth(year: number, month: number): Date[] {
    const days: Date[] = [];
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }

  toIso(d: Date): string { return d.toISOString().split('T')[0]; }
  isWeekend(day: Date): boolean { const d = day.getDay(); return d === 0 || d === 6; }
  getCellType(employeeId: number, day: Date): string | null {
    const key = `${employeeId}-${this.toIso(day)}`;
    return this.entryMap.get(key)?.entry_type || null;
  }

  // --- AUSWAHL-LOGIK (bleibt unverändert) ---
  selectCell(employeeId: number, day: Date, event: MouseEvent): void {
    event.preventDefault();
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

  getCellsInRange(start: SelectedCell, end: SelectedCell): SelectedCell[] {
    if (start.employeeId !== end.employeeId) return [end];
    const employeeId = start.employeeId;
    const allDaysInView = this.daysForMonth;
    const startIndex = allDaysInView.findIndex(d => d.getTime() === start.day.getTime());
    const endIndex = allDaysInView.findIndex(d => d.getTime() === end.day.getTime());
    if (startIndex === -1 || endIndex === -1) return [];
    const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
    return allDaysInView.slice(min, max + 1)
      .filter(day => !this.isWeekend(day))
      .map(day => ({ employeeId, day }));
  }

  isSelected(employeeId: number, day: Date): boolean {
    return this.selectedCells.some(c => this.isSameCell(c, { employeeId, day }));
  }
  
  private isSameCell(cellA: SelectedCell, cellB: SelectedCell): boolean {
    return cellA.employeeId === cellB.employeeId && cellA.day.getTime() === cellB.day.getTime();
  }

  deselect(): void {
    this.selectedCells = [];
    this.anchorCell = null;
  }

  // --- AKTIONEN (bleiben unverändert) ---
  setEntry(type: string): void {
    if (!this.currentPlan || this.selectedCells.length === 0) return;
    const groupedByEmployee = new Map<number, string[]>();
    this.selectedCells.forEach(cell => {
      if (!this.isWeekend(cell.day)) {
        const dates = groupedByEmployee.get(cell.employeeId) || [];
        dates.push(this.toIso(cell.day));
        groupedByEmployee.set(cell.employeeId, dates);
      }
    });
    const apiCalls: any[] = [];
    const planId = this.currentPlan.id;
    groupedByEmployee.forEach((dates, employeeId) => {
      const call = type === ""
        ? this.backendAccess.deleteEntries(planId, employeeId, dates)
        : this.backendAccess.createEntries(planId, employeeId, type, dates);
      apiCalls.push(call);
    });
    if (apiCalls.length === 0) { this.deselect(); return; }
    forkJoin(apiCalls).pipe(
      switchMap(() => this.backendAccess.getPlanEntries(planId))
    ).subscribe({
      next: (updatedEntries) => {
        this.allEntriesForYear = updatedEntries;
        this.buildEntryMap();
        this.deselect();
      },
      error: (err) => {
        this.overlayService.showOverlay("error", err.error?.error || "Aktion konnte nicht ausgeführt werden.");
        this.deselect();
      }
    });
  }

  /**
   * NEU: Diese Funktion fehlte. Sie erstellt ein Objekt für [ngClass],
   * um das HTML-Template sauber und lesbar zu halten.
   */
  getCellClasses(employeeId: number, day: Date): any {
    const type = this.getCellType(employeeId, day);
    const classes: { [key: string]: boolean } = {
      'cell': true,
      'weekend': this.isWeekend(day),
      'selected': this.isSelected(employeeId, day)
    };
    if (type) {
      classes[`${type.toLowerCase()}-cell`] = true; // z.B. 'u-cell', 'k-cell'
    }
    return classes;
  }
}