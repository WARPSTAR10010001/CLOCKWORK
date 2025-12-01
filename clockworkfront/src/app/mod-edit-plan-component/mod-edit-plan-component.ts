import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BackendAccess } from '../backend-access';
import { EmployeeService, Employee } from '../employee-service';
import { ImpersonationService } from '../impersonation-service';
import { OverlayService } from '../overlay-service';
import { take, map, switchMap, of, forkJoin } from 'rxjs';

@Component({
  selector: 'app-plan-edit',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mod-edit-plan-component.html',
  styleUrl: './mod-edit-plan-component.css'
})
export class ModEditPlanComponent implements OnInit {
  year!: number;
  planId!: number;
  depId!: number;

  loading = false;

  employees: Employee[] = [];
  inPlanIds = new Set<number>(); // wer ist im Plan?

  // Edit-Puffer: Urlaubswerte
  edits: Record<number, { annual: number; carry: number }> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private backend: BackendAccess,
    private empService: EmployeeService,
    private imp: ImpersonationService,
    private overlay: OverlayService
  ) { }

  ngOnInit(): void {
    this.year = Number(this.route.snapshot.paramMap.get('year'));
    this.init();
  }

  private clampDateToYear(dateStr: string | null | undefined, year: number): string | null {
    if (!dateStr) return null;
    const d = dateStr.slice(0, 10); // 'YYYY-MM-DD'
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    if (d < yearStart) return yearStart;
    if (d > yearEnd) return yearEnd;
    return d;
  }

  private init(): void {
    this.loading = true;

    // depId bestimmen
    const dep = this.imp.getEffectiveDepartmentId();
    if (!dep) {
      this.overlay.showOverlay('error', 'Kein Fachbereich gewählt.');
      this.router.navigate(['/mod']);
      return;
    }
    this.depId = dep;

    // PlanId für das Jahr auflösen
    this.backend.getPlansForDepartment(dep).pipe(
      take(1),
      map(res => res.plans.find(p => p.year === this.year) || null),
      switchMap(plan => {
        if (!plan) {
          this.overlay.showOverlay('error', `Für ${this.year} existiert noch kein Plan.`);
          return of(null);
        }
        this.planId = plan.id;
        return forkJoin({
          employees: this.empService.getEmployeesForDepartment(dep).pipe(take(1)),
          links: this.backend.getPlanEmployeeLinks(this.planId).pipe(take(1))
        });
      })
    ).subscribe(bundle => {
      this.loading = false;
      if (!bundle) return;

      // 1) Nur aktive Mitarbeiter
      const active = (bundle.employees || []).filter(e => e.is_active !== false);

      // 2) Nur Mitarbeiter, deren Zeitraum das Planjahr schneidet
      this.employees = active.filter(e => this.employeeOverlapsYear(e, this.year));

      // 3) Set für "ist im Plan?"
      this.inPlanIds = new Set((bundle.links.items || []).map(x => x.employee_id));

      // 4) Edit-Puffer initialisieren
      this.employees.forEach(e => {
        this.edits[e.id] = {
          annual: e.annual_leave_days ?? 30,
          carry: e.carryover_days ?? 0
        };
      });
    });
  }

  private employeeOverlapsYear(e: Employee, year: number): boolean {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    const parse = (s?: string | null) => {
      if (!s) return null;
      const y = parseInt(s.slice(0, 4), 10);
      const m = parseInt(s.slice(5, 7), 10) - 1;
      const d = parseInt(s.slice(8, 10), 10);
      return new Date(y, m, d);
    };

    const start = parse(e.start_month) || yearStart;
    const end = parse(e.end_month) || yearEnd;

    return start <= yearEnd && end >= yearStart;
  }

  isInPlan(e: Employee): boolean {
    return this.inPlanIds.has(e.id);
  }

  addToPlan(e: Employee): void {
    const yearStart = `${this.year}-01-01`;

    let start = yearStart;
    if (e.start_month) {
      const clamped = this.clampDateToYear(e.start_month, this.year);
      start = clamped ?? yearStart;
    }

    let end: string | null = null;
    if (e.end_month) {
      const clampedEnd = this.clampDateToYear(e.end_month, this.year);
      end = clampedEnd;
    }

    this.backend.addEmployeeToPlan(this.planId, e.id, start, end).pipe(take(1)).subscribe({
      next: () => {
        this.inPlanIds.add(e.id);
        this.overlay.showOverlay('success', `${e.name} in den Plan aufgenommen.`);
      },
      error: () => this.overlay.showOverlay('error', 'Hinzufügen fehlgeschlagen.')
    });
  }

  saveEmployee(e: Employee): void {
    const payload = {
      annualLeaveDays: Number(this.edits[e.id].annual),
      carryoverDays: Number(this.edits[e.id].carry)
    };
    this.empService.updateEmployee(e.id, payload).pipe(take(1)).subscribe({
      next: (updated) => {
        e.annual_leave_days = updated.annual_leave_days;
        e.carryover_days = updated.carryover_days;
        this.overlay.showOverlay('success', 'Gespeichert.');
      },
      error: () => this.overlay.showOverlay('error', 'Speichern fehlgeschlagen.')
    });
  }

  syncMissing(): void {
    this.backend.syncPlanEmployees(this.planId).pipe(take(1)).subscribe({
      next: (res) => {
        this.overlay.showOverlay('success', `${res.added} Mitarbeitende ergänzt.`);
        this.init();
      },
      error: () => this.overlay.showOverlay('error', 'Sync fehlgeschlagen.')
    });
  }

  /**
   * Holt aktualisierte Start-/Enddaten aus den Stammdaten (employees)
   * und schreibt sie in plan_employees für dieses Jahr.
   */
  syncDates(): void {
    this.backend.syncPlanEmployeeDates(this.planId).pipe(take(1)).subscribe({
      next: (res) => {
        this.overlay.showOverlay('success', `${res.updated} Mitarbeitende aktualisiert.`);
        this.init();
      },
      error: () => this.overlay.showOverlay('error', 'Datum-Sync fehlgeschlagen.')
    });
  }
}
