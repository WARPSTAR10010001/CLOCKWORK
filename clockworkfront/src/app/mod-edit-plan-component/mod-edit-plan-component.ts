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

      this.employees = (bundle.employees || []).filter(e => e.is_active !== false);
      this.inPlanIds = new Set((bundle.links.items || []).map(x => x.employee_id));

      // Edit-Puffer initialisieren
      this.employees.forEach(e => {
        this.edits[e.id] = {
          annual: e.annual_leave_days ?? 30,
          carry: e.carryover_days ?? 0
        };
      });
    });
  }

  isInPlan(e: Employee): boolean {
    return this.inPlanIds.has(e.id);
  }

  addToPlan(e: Employee): void {
    const start = `${this.year}-01-01`;
    this.backend.addEmployeeToPlan(this.planId, e.id, start, null).pipe(take(1)).subscribe({
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
}
