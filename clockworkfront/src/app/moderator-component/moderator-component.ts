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

interface RowForPlan {
  employeeId: number;
  start_date: string;                 // aus dem Formular (YYYY-MM-DD)
  end_date: string | null;            // optional
  carryover: number;                  // Resturlaub (Vorjahr)
  annual: number;                     // Jahresurlaub (Employee-Stamm; wird nicht in /plans gebraucht)
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
  availableEmployees: Employee[] = [];
  departmentId: number | null = null;

  constructor(
    private overlay: OverlayService,
    private fb: FormBuilder,
    private backend: BackendAccess,
    private employeeService: EmployeeService,
    private auth: AuthService,
    private router: Router
  ) {
    this.planForm = this.fb.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
      employees: this.fb.array([], Validators.required)
    });
  }

  ngOnInit(): void {
    // depId aus JWT
    this.auth.authStatus$.subscribe(s => this.departmentId = s.user?.departmentId ?? null);

    // vorhandene Mitarbeiter laden (Autocomplete)
    this.employeeService.getEmployeesForDepartment().subscribe(emps => {
      this.availableEmployees = emps || [];
    });

    // mit einer Zeile starten
    this.addEmployee();
  }

  get employees(): FormArray {
    return this.planForm.get('employees') as FormArray;
  }

  private pad2(n: number) { return String(n).padStart(2, '0'); }
  private toMonthStart(dateStr: string, fallbackYear: number): string {
    // akzeptiert 'YYYY-MM-DD' (Date input); normalisiert auf 'YYYY-MM-01'
    if (!dateStr) return `${fallbackYear}-01-01`;
    const d = new Date(dateStr);
    const y = isNaN(d.getTime()) ? fallbackYear : d.getFullYear();
    const m = isNaN(d.getTime()) ? 1 : (d.getMonth() + 1);
    return `${y}-${this.pad2(m)}-01`;
    // Hinweis: falls du exakt den eingegebenen Tag willst, ersetze '01' durch this.pad2(d.getDate()).
  }

  // Formularzeile
  createEmployeeGroup(): FormGroup {
    const today = new Date();
    const isoToday = `${today.getFullYear()}-${this.pad2(today.getMonth() + 1)}-${this.pad2(today.getDate())}`;
    return this.fb.group({
      name: ['', Validators.required],
      start_date: [isoToday, Validators.required],
      end_date: [null],
      vacation_days_carryover: [0, [Validators.required, Validators.min(0)]],
      vacation_days_total: [30, [Validators.required, Validators.min(0)]]
    });
  }

  addEmployee(): void { this.employees.push(this.createEmployeeGroup()); }
  removeEmployee(index: number): void { this.employees.removeAt(index); }

  submit(): void {
    if (this.planForm.invalid || !this.departmentId) {
      this.overlay.showOverlay('error', 'Bitte alle Felder korrekt ausfüllen.');
      this.planForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const { year } = this.planForm.value as { year: number };

    // 1) Für jede Formularzeile: existierenden Employee finden ODER neuen Employee anlegen,
    //    und dabei IMMER RowForPlan zurückgeben (einheitlicher Typ!)
    const employeeIdCalls: Observable<RowForPlan>[] = this.employees.controls.map(ctrl => {
      const v = ctrl.value as {
        name: string;
        start_date: string;
        end_date?: string | null;
        vacation_days_carryover: number;
        vacation_days_total: number;
      };

      const existing = this.availableEmployees.find(e =>
        (e.name ?? '').trim().toLowerCase() === (v.name ?? '').trim().toLowerCase()
      );

      if (existing) {
        // existierender Employee → direkt strukturierte Info zurückgeben
        return of<RowForPlan>({
          employeeId: existing.id,
          start_date: v.start_date,
          end_date: v.end_date ?? null,
          carryover: v.vacation_days_carryover,
          annual: v.vacation_days_total
        });
      } else {
        // neuer Employee → erst anlegen, dann strukturierte Info zurückgeben
        return this.employeeService.createEmployee({
          departmentId: this.departmentId!,
          displayName: v.name, // wichtig: displayName, nicht name
          startMonth: this.toMonthStart(v.start_date, year),
          endMonth: v.end_date ? this.toMonthStart(v.end_date, year) : null,
          annualLeaveDays: v.vacation_days_total,
          carryoverDays: v.vacation_days_carryover
        }).pipe(
          switchMap(created => of<RowForPlan>({
            employeeId: created.id,
            start_date: v.start_date,
            end_date: v.end_date ?? null,
            carryover: v.vacation_days_carryover,
            annual: v.vacation_days_total
          }))
        );
      }
    });

    forkJoin(employeeIdCalls).pipe(
      // 2) Payload für POST /api/plans bauen
      switchMap((rows: RowForPlan[]) => {
        const employeesPayload = rows.map(r => ({
          employeeId: r.employeeId,
          startMonth: this.toMonthStart(r.start_date, year),
          endMonth: r.end_date ? this.toMonthStart(r.end_date, year) : null,
          initialBalance: r.carryover
        }));

        const payload = {
          departmentId: this.departmentId!,
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