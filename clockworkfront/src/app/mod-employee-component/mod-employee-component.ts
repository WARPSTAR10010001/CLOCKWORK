import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { EmployeeService, Employee } from '../employee-service';
import { OverlayService } from '../overlay-service';
import { AuthService } from '../auth-service';
import { take } from 'rxjs/operators';
import { ImpersonationService } from '../impersonation-service';

type RowForm = {
  id: FormControl<number>;
  name: FormControl<string>;
  start_date: FormControl<string | null>; // 'YYYY-MM-DD' oder null
  end_date: FormControl<string | null>;   // 'YYYY-MM-DD' oder null
};

type NewForm = {
  name: FormControl<string>;
  start_date: FormControl<string | null>;
  end_date: FormControl<string | null>;
};

@Component({
  selector: 'app-mod-employee-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mod-employee-component.html',
  styleUrl: './mod-employee-component.css',
})
export class ModEmployeeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeesApi = inject(EmployeeService);
  private overlay = inject(OverlayService);
  private auth = inject(AuthService);
  private imp = inject(ImpersonationService);

  private deptId: number | null = null;
  loading = false;

  activeEmployees: Employee[] = [];
  inactiveEmployees: Employee[] = [];

  activeFa = this.fb.array<FormGroup<RowForm>>([]);
  inactiveFa = this.fb.array<FormGroup<RowForm>>([]);

  // Neuer Mitarbeiter (oben)
  newEmployeeForm = this.fb.group<NewForm>({
    name: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(2)] }),
    start_date: this.fb.control<string | null>(null),
    end_date: this.fb.control<string | null>(null),
  });

  ngOnInit(): void {
    // Dept ermitteln: Admin → Impersonation, sonst JWT
    this.resolveDepartmentOnceAndLoad();
  }

  private resolveDepartmentOnceAndLoad(): void {
    this.auth.authStatus$.pipe(take(1)).subscribe(status => {
      const fromJwt = status?.user?.departmentId ?? null;
      const impDep = this.imp.getEffectiveDepartmentId?.() ?? null;

      this.deptId = this.auth.isAdmin() ? impDep : fromJwt;

      if (this.auth.isAdmin() && !this.deptId) {
        this.overlay.showOverlay('info', 'Bitte zuerst einen Fachbereich im Modpanel auswählen.');
        this.loading = false;
        return; // blockt bis Impersonation gesetzt wurde
      }

      if (!this.deptId) {
        this.overlay.showOverlay('error', 'Kein Fachbereich im Login gefunden.');
        return;
      }

      this.loadAll();
    });
  }

  // ---------- Laden & Split ----------
  private loadAll(): void {
    if (!this.deptId) return;
    this.loading = true;
    this.employeesApi.getEmployeesForDepartment(this.deptId).subscribe({
      next: (list) => {
        const { actives, inactives } = this.splitEmployees(list || []);
        this.activeEmployees = actives;
        this.inactiveEmployees = inactives;

        this.activeFa.clear();
        this.inactiveFa.clear();

        for (const e of this.activeEmployees) this.activeFa.push(this.rowToForm(e));
        for (const e of this.inactiveEmployees) this.inactiveFa.push(this.rowToForm(e));

        this.loading = false;
      },
      error: () => {
        this.overlay.showOverlay('error', 'Mitarbeiter konnten nicht geladen werden.');
        this.loading = false;
      },
    });
  }

  private splitEmployees(list: Employee[]) {
    // Monatsanfang ohne TZ-Drift
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const actives: Employee[] = [];
    const inactives: Employee[] = [];

    for (const e of list) {
      const end = e.end_month ? new Date(e.end_month) : null;
      const isActiveFlag = e.is_active !== false;
      const notEnded = !end || end >= monthStart;
      (isActiveFlag && notEnded ? actives : inactives).push(e);
    }
    actives.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    inactives.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return { actives, inactives };
  }

  // ---------- String-only Date Utils ----------
  private monthToInputDate(s?: string | null): string | null {
    if (!s) return null;
    return s.slice(0, 10);
  }

  /** Input 'YYYY-MM-DD' → 'YYYY-MM-01' (Monatsanfang), ohne Date() */
  private inputToMonthStart(s?: string | null): string | null {
    if (!s) return null;
    const y = s.slice(0, 4);
    const m = s.slice(5, 7);
    if (!/^\d{4}$/.test(y) || !/^\d{2}$/.test(m)) return null;
    return `${y}-${m}-01`;
  }

  // ---------- Form-Factories ----------
  private rowToForm(e: Employee): FormGroup<RowForm> {
    return this.fb.group<RowForm>({
      id: this.fb.nonNullable.control(e.id),
      name: this.fb.nonNullable.control(e.name ?? '', {
        validators: [Validators.required, Validators.minLength(2)],
      }),
      start_date: this.fb.control(this.monthToInputDate(e.start_month)),
      end_date: this.fb.control(this.monthToInputDate(e.end_month)),
    });
  }

  // ---------- Aktionen: Update / Delete ----------
  saveRow(index: number, which: 'active' | 'inactive'): void {
    const fa = which === 'active' ? this.activeFa : this.inactiveFa;
    const group = fa.at(index);
    if (!group) return;

    if (group.invalid) {
      group.markAllAsTouched();
      this.overlay.showOverlay('error', 'Bitte gültige Werte eintragen.');
      return;
    }

    const v = group.getRawValue();
    const payload = {
      displayName: v.name.trim(),
      startMonth: this.inputToMonthStart(v.start_date),
      endMonth: this.inputToMonthStart(v.end_date),
    };

    this.employeesApi.updateEmployee(v.id, payload).subscribe({
      next: () => {
        this.overlay.showOverlay('success', 'Gespeichert.');
        this.loadAll();
      },
      error: (err) => {
        this.overlay.showOverlay('error', err?.error?.error || 'Speichern fehlgeschlagen.');
      },
    });
  }

  deleteRow(index: number, which: 'active' | 'inactive'): void {
    const fa = which === 'active' ? this.activeFa : this.inactiveFa;
    const group = fa.at(index);
    if (!group) return;

    const { id, name } = group.getRawValue();
    if (!confirm(`Mitarbeiter "${name}" wirklich löschen?`)) return;

    this.employeesApi.deleteEmployee(id).subscribe({
      next: () => {
        this.overlay.showOverlay('success', 'Mitarbeiter gelöscht.');
        this.loadAll();
      },
      error: (err) => {
        this.overlay.showOverlay('error', err?.error?.error || 'Löschen fehlgeschlagen.');
      },
    });
  }

  // ---------- Neuer Mitarbeiter ----------
  createEmployee(): void {
    if (this.newEmployeeForm.invalid) {
      this.newEmployeeForm.markAllAsTouched();
      this.overlay.showOverlay('error', 'Bitte Name angeben (mind. 2 Zeichen).');
      return;
    }
    if (!this.deptId) {
      this.overlay.showOverlay('error', 'Kein Fachbereich ausgewählt.');
      return;
    }

    const v = this.newEmployeeForm.getRawValue();

    this.employeesApi.createEmployee({
      departmentId: this.deptId,
      displayName: v.name.trim(),
      startMonth: this.inputToMonthStart(v.start_date) ?? this.todayMonthStart(),
      endMonth: this.inputToMonthStart(v.end_date) ?? null
    }).subscribe({
      next: () => {
        this.overlay.showOverlay('success', 'Mitarbeiter angelegt.');
        this.newEmployeeForm.reset({ name: '', start_date: null, end_date: null });
        this.loadAll();
      },
      error: (err) => this.overlay.showOverlay('error', err?.error?.error || 'Anlegen fehlgeschlagen.')
    });
  }

  private todayMonthStart(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  }

  // Getter fürs Template
  get activeRows(): FormArray<FormGroup<RowForm>> { return this.activeFa; }
  get inactiveRows(): FormArray<FormGroup<RowForm>> { return this.inactiveFa; }
}