import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PlanService } from '../plan-service';
import { EmployeeService, Employee } from '../employee-service';
import { ImpersonationService } from '../impersonation-service';
import { OverlayService } from '../overlay-service';
import { AuthService } from '../auth-service';
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
  inPlanIds = new Set<number>();

  edits: Record<number, { annual: number; carry: number }> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private plan: PlanService,
    private empService: EmployeeService,
    private imp: ImpersonationService,
    private overlay: OverlayService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    this.year = Number(this.route.snapshot.paramMap.get('year'));
    this.init();
  }

  private clampDateToYear(dateStr: string | null | undefined, year: number): string | null {
    if (!dateStr) return null;
    const d = dateStr.slice(0, 10);
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    if (d < yearStart) return yearStart;
    if (d > yearEnd) return yearEnd;
    return d;
  }

  private init(): void {
    this.loading = true;

    this.auth.authStatus$.pipe(
      take(1),
      map(status => {
        const impDep = this.imp.getEffectiveDepartmentId();
        const fromJwt = status?.user?.departmentId ?? null;

        const depId = this.auth.isAdmin()
          ? (impDep ?? null)
          : (fromJwt ?? null);

        if (!depId) {
          if (this.auth.isAdmin()) {
            this.overlay.showOverlay('info', 'Bitte im Modpanel einen Fachbereich auswählen.');
            this.router.navigate(['/mod']);
          } else {
            this.overlay.showOverlay('error', 'Kein Fachbereich im Login gefunden.');
            this.router.navigate(['/auth']);
          }
          return null;
        }

        this.depId = depId;
        return depId;
      }),
      switchMap(depId => {
        if (!depId) return of(null);

        return this.plan.getPlansForDepartment(depId).pipe(
          take(1),
          map(res => res.plans.find(p => p.year === this.year) || null),
          switchMap(plan => {
            if (!plan) {
              this.overlay.showOverlay('error', `Für ${this.year} existiert noch kein Plan.`);
              return of(null);
            }
            this.planId = plan.id;

            return forkJoin({
              employees: this.empService.getEmployeesForDepartment(this.depId).pipe(take(1)),
              links: this.plan.getPlanEmployeeLinks(this.planId).pipe(take(1))
            });
          })
        );
      })
    ).subscribe({
      next: bundle => {
        this.loading = false;
        if (!bundle) return;

        const active = (bundle.employees || []).filter(e => e.is_active !== false);

        this.employees = active.filter(e => this.employeeOverlapsYear(e, this.year));

        this.inPlanIds = new Set((bundle.links.items || []).map(x => x.employee_id));

        this.employees.forEach(e => {
          this.edits[e.id] = {
            annual: e.annual_leave_days ?? 30,
            carry: e.carryover_days ?? 0
          };
        });
      },
      error: () => {
        this.loading = false;
        this.overlay.showOverlay('error', 'Plan-Daten konnten nicht geladen werden.');
      }
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

    this.plan.addEmployeeToPlan(this.planId, e.id, start, end).pipe(take(1)).subscribe({
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
    this.plan.syncPlanEmployees(this.planId).pipe(take(1)).subscribe({
      next: (res) => {
        this.overlay.showOverlay('success', `${res.added} Mitarbeitende ergänzt.`);
        this.init();
      },
      error: () => this.overlay.showOverlay('error', 'Mitarbeiter-Sync fehlgeschlagen.')
    });
  }

  syncDates(): void {
    this.plan.syncPlanEmployeeDates(this.planId).pipe(take(1)).subscribe({
      next: (res) => {
        this.overlay.showOverlay('success', `${res.updated} Mitarbeitende aktualisiert.`);
        this.init();
      },
      error: () => this.overlay.showOverlay('error', 'Datum-Sync fehlgeschlagen.')
    });
  }
}