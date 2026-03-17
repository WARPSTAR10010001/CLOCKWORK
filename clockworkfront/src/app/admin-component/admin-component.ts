import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { AdminService } from '../admin-service';
import { OverlayService } from '../overlay-service';
import { Department } from '../departments-service';

@Component({
  selector: 'app-admin-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-component.html',
  styleUrl: './admin-component.css'
})
export class AdminComponent implements OnInit {
  form: FormGroup;
  submitting = false;
  departments: any[] = [];

  searchTerm = '';
  searchResults: Department[] = [];

  constructor(
    private fb: FormBuilder,
    private admin: AdminService,
    private overlay: OverlayService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      userUsername: [''],
      modUsername: ['']
    });
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.admin.listDepartments().subscribe({
      next: (deps) => {
        this.departments = deps || [];
        this.searchResults = [...this.departments];
      },
      error: () =>
        this.overlay.showOverlay('error', 'Fachbereiche konnten nicht geladen werden.')
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.overlay.showOverlay('error', 'Bitte einen gültigen Fachbereichsnamen eingeben.');
      this.form.markAllAsTouched();
      return;
    }

    const { name, userUsername, modUsername } = this.form.value;
    this.submitting = true;

    this.admin
      .createDepartment({
        name: name!.trim(),
        usernames: {
          user: (userUsername || '').trim() || undefined,
          mod: (modUsername || '').trim() || undefined
        }
      })
      .subscribe({
        next: (res) => {
          this.overlay.showOverlay(
            'success',
            `Fachbereich "${res.department.name}" wurde angelegt.`
          );
          this.submitting = false;
          this.form.reset();
          this.reload();
        },
        error: (err) => {
          const msg = err?.error?.error || 'Erstellen fehlgeschlagen.';
          this.overlay.showOverlay('error', msg);
          this.submitting = false;
        }
      });
  }

  deleteDepartment(dep: any): void {
    const ok = window.confirm(
      `Fachbereich "${dep.name}" wirklich löschen?\n\n` +
      'Hinweis: Das Löschen ist nur möglich, wenn noch keine Mitarbeitenden und keine Dienstpläne für diesen Fachbereich existieren.'
    );
    if (!ok) return;

    this.admin.deleteDepartment(dep.id).subscribe({
      next: (res) => {
        this.overlay.showOverlay(
          'success',
          `Fachbereich "${res.department.name}" wurde gelöscht.`
        );
        this.reload();
      },
      error: (err) => {
        const msg =
          err?.error?.error ||
          'Der Fachbereich konnte nicht gelöscht werden. Bitte prüfen, ob noch Mitarbeitende oder Pläne existieren.';
        this.overlay.showOverlay('error', msg);
      }
    });
  }

  formatDateShort(raw: string | null | undefined): string {
    if (!raw) return '-';
    const str = String(raw);

    if (str.length >= 10 && str[4] === '-' && str[7] === '-' && !str.includes('T')) {
      const ymd = str.slice(0, 10);
      const parts = ymd.split('-');
      if (parts.length !== 3) return ymd;
      const [y, m, d] = parts;
      return `${d}.${m}.${y.slice(2)}`;
    }

    const d = new Date(str);
    if (isNaN(d.getTime())) {
      const ymd = str.slice(0, 10);
      const parts = ymd.split('-');
      if (parts.length !== 3) return ymd;
      const [y, m, day] = parts;
      return `${day}.${m}.${y.slice(2)}`;
    }

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(2);
    return `${dd}.${mm}.${yy}`;
  }

  formatDateTimeShort(raw: string | null | undefined): string {
    if (!raw) return '-';

    const str = String(raw);

    if (str.length >= 10 && str[4] === '-' && str[7] === '-' && !str.includes('T') && !str.includes(':')) {
      return this.formatDateShort(str);
    }

    const d = new Date(str);
    if (isNaN(d.getTime())) {
      return this.formatDateShort(str);
    }

    const datePart = this.formatDateShort(d.toISOString());
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    return `${datePart}, ${hh}:${mm}`;
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm = target?.value ?? '';
    this.runSearch();
  }

  private runSearch(): void {
    const q = this.searchTerm.trim().toLowerCase();

    if (!q) {
      this.searchResults = [...this.departments];
      return;
    }

    this.searchResults = this.departments.filter((dep: Department) =>
      dep.name?.toLowerCase().includes(q)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.reload();
  }
}