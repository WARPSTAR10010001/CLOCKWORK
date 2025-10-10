import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OverlayService } from '../overlay-service';
import { BackendAccess } from '../backend-access';
import { EmployeeService, Employee } from '../employee-service';
import { AuthService } from '../auth-service';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DepartmentsService, Department } from '../departments-service';

interface RowForPlan {
  employeeId: number;
  start_date: string | null;  // optional
  end_date: string | null;    // optional
  carryover: number;
  annual: number;
}

@Component({
  selector: 'app-moderator-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './moderator-component.html',
  styleUrls: ['./moderator-component.css']
})
export class ModeratorComponent implements OnInit {
  planForm: FormGroup;
  submitting = false;

  departments: Department[] = [];
  availableEmployees: Employee[] = [];

  // aus JWT (für Nicht-Admins) – Admins wählen explizit
  jwtDepartmentId: number | null = null;

  constructor(
    private overlay: OverlayService,
    private fb: FormBuilder,
    private backend: BackendAccess,
    private employeeService: EmployeeService,
    private departmentsService: DepartmentsService,
    public auth: AuthService,
    private router: Router
  ) {
    this.planForm = this.fb.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
      departmentId: [''], // nur erforderlich, wenn Admin (siehe getter unten)
      employees: this.fb.array([], Validators.required)
    });
  }

  ngOnInit(): void {
    // eigene DepId aus JWT merken
    this.auth.authStatus$.subscribe(s => this.jwtDepartmentId = s.user?.departmentId ?? null);

    // Admins: FB-Liste laden; Nicht-Admins: nichts laden
    if (this.auth.isAdmin()) {
      this.departmentsService.getAllDepartments().subscribe(deps => {
        this.departments = deps || [];
      });
    }

    // initial Mitarbeiterliste basierend auf "effectiveDepartmentId"
    this.reloadEmployees();

    // mit einer Zeile starten
    this.addEmployee();
  }

  get employees(): FormArray {
    return this.planForm.get('employees') as FormArray;
  }

  /** Die effektive DepartmentId (Admin = Auswahl, User/Mod = JWT) */
  get effectiveDepartmentId(): number | null {
    if (this.auth.isAdmin()) {
      const v = this.planForm.value as { departmentId?: number | string };
      const id = Number(v.departmentId);
      return Number.isFinite(id) && id > 0 ? id : null;
    }
    return this.jwtDepartmentId;
  }

  onDepartmentChange(): void {
    this.reloadEmployees(); // Vorschlagsliste nach Auswahl neu laden
  }

  private reloadEmployees(): void {
    const depId = this.effectiveDepartmentId;
    if (!depId) { this.availableEmployees = []; return; }
    this.employeeService.getEmployeesForDepartment(depId).subscribe(emps => {
      this.availableEmployees = emps || [];
    });
  }

  private pad2(n: number) { return String(n).padStart(2, '0'); }

  /** Normalisiert Eingaben:
   *  - leer/null  => null zurück (heißt: später Default anwenden)
   *  - sonst auf 'YYYY-MM-01' (Monatsanfang) */
  private toMonthStartOrNull(dateStr: string | null | undefined, fallbackYear: number): string | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return `${fallbackYear}-01-01`; // sehr defensiv: notfalls Jan des Planjahres
    return `${d.getFullYear()}-${this.pad2(d.getMonth() + 1)}-01`;
  }

  // Formularzeile
  createEmployeeGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      start_date: [null], // optional
      end_date: [null],   // optional
      vacation_days_carryover: [0, [Validators.required, Validators.min(0)]],
      vacation_days_total: [30, [Validators.required, Validators.min(0)]]
    });
  }

  addEmployee(): void { this.employees.push(this.createEmployeeGroup()); }
  removeEmployee(index: number): void { this.employees.removeAt(index); }

  submit(): void {
    const depId = this.effectiveDepartmentId;
    if (this.planForm.invalid || !depId) {
      this.overlay.showOverlay('error', 'Bitte alle Felder korrekt ausfüllen.');
      this.planForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const { year } = this.planForm.value as { year: number };

    // 1) Für jede Zeile: existierenden Employee finden ODER erstellen
    const employeeIdCalls: Observable<RowForPlan>[] = this.employees.controls.map(ctrl => {
      const v = ctrl.value as {
        name: string;
        start_date: string | null;
        end_date: string | null;
        vacation_days_carryover: number;
        vacation_days_total: number;
      };

      const existing = this.availableEmployees.find(e =>
        (e.name ?? '').trim().toLowerCase() === (v.name ?? '').trim().toLowerCase()
      );

      if (existing) {
        return of<RowForPlan>({
          employeeId: existing.id,
          start_date: v.start_date,
          end_date: v.end_date,
          carryover: v.vacation_days_carryover,
          annual: v.vacation_days_total
        });
      } else {
        // Neuer Mitarbeiter im gewählten Department
        return this.employeeService.createEmployee({
          departmentId: depId,
          displayName: v.name, // Backend erwartet displayName
          startMonth: this.toMonthStartOrNull(v.start_date, year) ?? `${year}-01-01`,
          endMonth: this.toMonthStartOrNull(v.end_date, year), // darf null sein
          annualLeaveDays: v.vacation_days_total,
          carryoverDays: v.vacation_days_carryover
        }).pipe(
          switchMap(created => of<RowForPlan>({
            employeeId: created.id,
            start_date: v.start_date,
            end_date: v.end_date,
            carryover: v.vacation_days_carryover,
            annual: v.vacation_days_total
          }))
        );
      }
    });

    // 2) Plan erstellen (für gewählten/effektiven Fachbereich)
    forkJoin(employeeIdCalls).pipe(
      switchMap((rows: RowForPlan[]) => {
        const employeesPayload = rows.map(r => ({
          employeeId: r.employeeId,
          // Wenn Start leer → Standard 01.01.des Planjahres
          startMonth: this.toMonthStartOrNull(r.start_date, year) ?? `${year}-01-01`,
          endMonth: this.toMonthStartOrNull(r.end_date, year), // null erlaubt
          initialBalance: r.carryover
        }));

        const payload = {
          departmentId: depId,
          year,
          employees: employeesPayload
        };

        return this.backend.createPlan(payload);
      }),
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