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
  styleUrl: './mod-plan-component.css'
})
export class ModPlanComponent implements OnInit {
  planForm: FormGroup;
  submitting = false;

  activeEmployees: Employee[] = [];

  /** Effektiver Fachbereich (JWT oder Impersonation) */
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
    // 1) Fachbereich EINMALIG auflösen
    this.auth.authStatus$.pipe(take(1)).subscribe(status => {
      const fromJwt = status?.user?.departmentId ?? null;
      const impDep = this.imp.getEffectiveDepartmentId?.() ?? null;

      // Admin: nimmt Impersonation, Mod/User: nimmt JWT
      const depId = this.auth.isAdmin() ? impDep : fromJwt;

      if (this.auth.isAdmin() && !depId) {
        this.overlay.showOverlay('info', 'Bitte im Modpanel einen Fachbereich auswählen.');
        this.router.navigate(['/mod']);
        return;
      }

      if (!depId) {
        this.overlay.showOverlay('error', 'Kein Fachbereich im Login gefunden.');
        this.router.navigate(['/auth']);
        return;
      }

      // Ab hier haben wir einen gültigen Fachbereich
      this.currentDepartmentId = depId;

      // Mitarbeiter für das initiale Jahr laden
      this.loadActiveEmployees(depId);

      // Wenn sich das Jahr ändert, neu filtern
      this.planForm.get('year')!.valueChanges.subscribe((year: number) => {
        if (!this.currentDepartmentId) return;
        this.loadActiveEmployees(this.currentDepartmentId, year);
      });
    });
  }

  /** Getter für bestehenden Code – nutzt jetzt die aufgelöste ID */
  get effectiveDepartmentId(): number | null {
    return this.currentDepartmentId;
  }

  /** FormArray Accessor */
  get employees(): FormArray {
    return this.planForm.get('employees') as FormArray;
  }

  /** Prüft, ob Mitarbeiter irgendeinen Overlap mit dem Planjahr hat */
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

  /** Mitarbeiter laden + auf Planjahr filtern */
  private loadActiveEmployees(departmentId: number, yearOverride?: number): void {
    const formYear = this.planForm.get('year')!.value as number;
    const year = yearOverride ?? formYear;

    this.employeeService.getEmployeesForDepartment(departmentId).pipe(take(1))
      .subscribe({
        next: (emps) => {
          const list = (emps || []).filter(e => e.is_active !== false);

          // Nur Mitarbeiter, die im Planjahr wirklich aktiv sind
          const filtered = list.filter(e => this.employeeOverlapsYear(e, year));

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

  // src/app/mod-plan-component/mod-plan-component.ts
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

    // Hilfsfunktionen für saubere Strings
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    function clampDateToYear(dateStr: string | null | undefined): string | null {
      if (!dateStr) return null;
      const d = dateStr.slice(0, 10); // 'YYYY-MM-DD'
      if (d < yearStart) return yearStart;
      if (d > yearEnd) return yearEnd;
      return d;
    }

    const employeesPayload = rows.map(r => {
      const emp = this.activeEmployees.find(e => e.id === r.employeeId);

      // Start: wenn Mitarbeiter vor dem Planjahr startet -> 01.01.YYYY
      //        wenn im Planjahr startet -> tatsächliches Startdatum
      //        wenn gar kein Start gesetzt -> 01.01.YYYY
      let startMonth = yearStart;
      if (emp?.start_month) {
        const clamped = clampDateToYear(emp.start_month);
        startMonth = clamped ?? yearStart;
      }

      // Ende: wenn Mitarbeiter im Planjahr endet -> tatsächliches Enddatum
      //       wenn danach endet oder gar kein Enddatum -> null (für "läuft weiter")
      let endMonth: string | null = null;
      if (emp?.end_month) {
        const clampedEnd = clampDateToYear(emp.end_month);
        // wenn Enddatum vor dem Planjahr liegt, würde er ohnehin nicht im Payload landen,
        // weil er dann gar nicht in activeEmployees war
        endMonth = clampedEnd;
      }

      return {
        employeeId: r.employeeId,
        startMonth,
        endMonth,
        initialBalance: r.carryover
      };
    });

    const payload = {
      departmentId: depId,
      year,
      employees: employeesPayload
    };

    this.backend.createPlan(payload).pipe(
      catchError(err => {
        this.submitting = false;
        this.overlay.showOverlay('error', err?.error?.error || 'Fehler beim Erstellen des Dienstplans.');
        return of(null);
      })
    ).subscribe(res => {
      if (!res) return;
      this.submitting = false;
      this.overlay.showOverlay('success', `Dienstplan für ${year} wurde erfolgreich erstellt.`);
      this.router.navigate(['/years']);
    });
  }
}