// src/app/mod-plan-component/mod-plan-component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OverlayService } from '../overlay-service';
import { BackendAccess } from '../backend-access';
import { EmployeeService, Employee } from '../employee-service';
import { AuthService } from '../auth-service';
import { of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { ImpersonationService } from '../impersonation-service';

interface RowForPlan {
  employeeId: number;
  carryover: number;
  annual: number;
}

@Component({
  selector: 'app-moderator-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mod-plan-component.html',
  styleUrls: ['./mod-plan-component.css']
})
export class ModPlanComponent implements OnInit {
  planForm: FormGroup;
  submitting = false;

  activeEmployees: Employee[] = [];

  private currentDepartmentId: number | null = null;

  constructor(
    private overlay: OverlayService,
    private fb: FormBuilder,
    private backend: BackendAccess,
    private employeeService: EmployeeService,
    private imp: ImpersonationService,
    public auth: AuthService,
    private router: Router
  ) {
    this.planForm = this.fb.group({
      year: [
        new Date().getFullYear(),
        [Validators.required, Validators.min(2000), Validators.max(2100)]
      ],
      employees: this.fb.array([], Validators.required)
    });
  }

  ngOnInit(): void {
    const depId = this.effectiveDepartmentId;
    if (!depId) {
      // Admin hat noch keinen FB gewählt
      this.overlay.showOverlay('info', 'Bitte im Modpanel einen Fachbereich auswählen.');
      this.router.navigate(['/mod']);
      return;
    }

    this.currentDepartmentId = depId;
    this.loadActiveEmployees(depId);

    // Wenn sich das Jahr ändert, Mitarbeiterliste neu filtern
    this.planForm.get('year')!.valueChanges.subscribe((year: number) => {
      if (!this.currentDepartmentId) return;
      this.loadActiveEmployees(this.currentDepartmentId, year);
    });
  }

  /** Getter, damit vorhandener Code weiter `effectiveDepartmentId` nutzen kann */
  get effectiveDepartmentId(): number | null {
    return this.currentDepartmentId;
  }

  /** FormArray Accessor */
  get employees(): FormArray {
    return this.planForm.get('employees') as FormArray;
  }

  /** Mitarbeiter laden (nur aktive) + FormArray füllen */
  /** Mitarbeiter laden (nur aktive) + nach Planjahr filtern */
  private loadActiveEmployees(departmentId: number, yearOverride?: number): void {
    const formYear = this.planForm.get('year')!.value as number;
    const year = yearOverride ?? formYear;

    this.employeeService.getEmployeesForDepartment(departmentId).pipe(take(1))
      .subscribe({
        next: (emps) => {
          const list = (emps || []);

          const filtered = list.filter(e => {
            if (e.is_active === false) return false;

            // 'YYYY-MM-DD' → Jahreszahl
            const startYear = e.start_month ? parseInt(e.start_month.slice(0, 4), 10) : year;
            const endYear = e.end_month ? parseInt(e.end_month.slice(0, 4), 10) : year;

            // Beschäftigungszeitraum überschneidet sich mit dem Planjahr?
            return startYear <= year && endYear >= year;
          });

          this.activeEmployees = filtered;

          this.employees.clear();
          for (const e of this.activeEmployees) {
            this.employees.push(this.rowFromEmployee(e));
          }
        },
        error: () => this.overlay.showOverlay('error', 'Mitarbeiter konnten nicht geladen werden.')
      });
  }

  /** Eine Formularzeile pro aktivem Employee */
  private rowFromEmployee(e: Employee): FormGroup {
    return this.fb.group({
      id: [e.id, Validators.required],
      name: [{ value: e.name ?? '', disabled: true }],
      vacation_days_carryover: [e.carryover_days ?? 0, [Validators.required, Validators.min(0)]],
      vacation_days_total: [e.annual_leave_days ?? 30, [Validators.required, Validators.min(0)]],
    });
  }

  /** sichere YYYY-MM-01 für Start/Ende */
  private yearMonthStart(year: number, month = 1): string {
    const mm = String(month).padStart(2, '0');
    return `${year}-${mm}-01`;
  }

  submit(): void {
    const depId = this.effectiveDepartmentId;

    if (this.planForm.invalid || !depId) {
      this.overlay.showOverlay('error', 'Bitte alle Felder korrekt ausfüllen.');
      this.planForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const { year } = this.planForm.value as { year: number };

    const rows: RowForPlan[] = (this.employees.getRawValue() as any[]).map(g => ({
      employeeId: g.id,
      carryover: Number(g.vacation_days_carryover) || 0,
      annual: Number(g.vacation_days_total) || 0,
    }));

    const employeesPayload = rows.map(r => ({
      employeeId: r.employeeId,
      startMonth: this.yearMonthStart(year, 1),
      endMonth: null,
      initialBalance: r.carryover
    }));

    const payload = {
      departmentId: depId,
      year,
      employees: employeesPayload
    };

    this.backend.createPlan(payload).pipe(
      catchError(err => {
        this.submitting = false;
        this.overlay.showOverlay('error', err?.error?.error || 'Fehler beim Erstellen des Jahresplans.');
        return of(null);
      })
    ).subscribe(res => {
      if (!res) return;
      this.submitting = false;
      this.overlay.showOverlay('success', `Jahresplan für ${year} wurde erfolgreich erstellt.`);
      this.router.navigate(['/years']);
    });
  }
}