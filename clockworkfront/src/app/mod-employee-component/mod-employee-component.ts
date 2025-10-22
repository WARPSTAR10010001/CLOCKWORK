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

type RowForm = {
  id: FormControl<number>;
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

  loading = false;

  activeEmployees: Employee[] = [];
  inactiveEmployees: Employee[] = [];

  activeFa = this.fb.array<FormGroup<RowForm>>([]);
  inactiveFa = this.fb.array<FormGroup<RowForm>>([]);

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading = true;
    this.employeesApi.getEmployeesForDepartment().subscribe({
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
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
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

  private monthToInputDate(s?: string | null): string | null {
    if (!s) return null;
    return s.slice(0, 10); // 'YYYY-MM-DD'
  }
  private inputToMonthStart(s?: string | null): string | null {
    if (!s) return null;
    return `${s.slice(0, 7)}-01`;
  }

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

  saveRow(index: number, which: 'active' | 'inactive'): void {
    const fa = which === 'active' ? this.activeFa : this.inactiveFa;
    const group = fa.at(index);
    if (!group) return;

    if (group.invalid) {
      group.markAllAsTouched();
      this.overlay.showOverlay('error', 'Bitte gültige Werte eintragen.');
      return;
    }

    const v = group.getRawValue(); // v: { id, name, start_date, end_date }
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

  // Getter fürs Template
  get activeRows(): FormArray<FormGroup<RowForm>> {
    return this.activeFa;
  }
  get inactiveRows(): FormArray<FormGroup<RowForm>> {
    return this.inactiveFa;
  }
}