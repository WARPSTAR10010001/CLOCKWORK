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
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mod-plan-component.html',
  styleUrls: ['./mod-plan-component.css']
})
export class ModPlanComponent implements OnInit {
  planForm: FormGroup;
  submitting = false;

  // aktive Mitarbeitende (vereinheitlicht)
  activeEmployees: Employee[] = [];

  /** aktuell verwendete Fachbereichs-ID (für Laden + Erstellen) */
  private currentDeptId: number | null = null;

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
    // Department aus Login/Impersonation ermitteln
    this.auth.authStatus$.pipe(take(1)).subscribe(status => {
      const fromJwt = status?.user?.departmentId ?? null;
      const fromImp = this.imp.getEffectiveDepartmentId();

      // Admin → Impersonation, Mod → eigenes Dept
      this.currentDeptId = this.auth.isAdmin() ? (fromImp ?? null) : fromJwt;

      if (!this.currentDeptId) {
        this.overlay.showOverlay('info', 'Bitte im Modpanel einen Fachbereich auswählen.');
        this.router.navigate(['/mod']);
        return;
      }

      this.loadActiveEmployees(this.currentDeptId);
    });
  }

  /** Getter, damit vorhandener Code weiter `effectiveDepartmentId` nutzen kann */
  get effectiveDepartmentId(): number | null {
    return this.currentDeptId;
  }

  /** FormArray Accessor */
  get employees(): FormArray {
    return this.planForm.get('employees') as FormArray;
  }

  /** Mitarbeiter laden (nur aktive) + FormArray füllen */
  private loadActiveEmployees(departmentId: number): void {
    this.employeeService.getEmployeesForDepartment(departmentId).pipe(take(1)).subscribe({
      next: (emps) => {
        this.activeEmployees = (emps || []).filter(e => e.is_active !== false);
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