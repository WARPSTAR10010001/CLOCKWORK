import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { AdminService, AreaManager } from '../admin-service';
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
  managerForm: FormGroup;
  submitting = false;
  managerSubmitting = false;
  departments: any[] = [];
  areaManagers: AreaManager[] = [];
  managerSelections: Record<number, number[]> = {};
  savingManagerId: number | null = null;

  searchTerm = '';
  searchResults: Department[] = [];
  managerSearchTerm = '';
  managerSearchResults: AreaManager[] = [];

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

    this.managerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]]
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
        this.loadAreaManagers();
      },
      error: () =>
        this.overlay.showOverlay('error', 'Fachbereiche konnten nicht geladen werden.')
    });
  }

  loadAreaManagers(): void {
    this.admin.listAreaManagers().subscribe({
      next: (response) => {
        this.areaManagers = response.managers || [];
        this.managerSearchResults = [...this.areaManagers];
        this.managerSelections = {};
        for (const manager of this.areaManagers) {
          this.managerSelections[manager.id] = [...(manager.departmentIds || [])];
        }
      },
      error: () => {
        this.overlay.showOverlay('error', 'Fachbereichsleiter konnten nicht geladen werden.');
      }
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

  createAreaManager(): void {
    const username = String(this.managerForm.value.username || '').trim().toLowerCase();
    const departmentIds = this.getSelectedCreateManagerDepartmentIds();

    if (this.managerForm.invalid || !username) {
      this.overlay.showOverlay('error', 'Bitte einen gültigen Benutzernamen für den Fachbereichsleiter eingeben.');
      this.managerForm.markAllAsTouched();
      return;
    }

    if (departmentIds.length === 0) {
      this.overlay.showOverlay('error', 'Bitte mindestens einen Fachbereich auswählen.');
      return;
    }

    this.managerSubmitting = true;
    this.admin.createAreaManager({ username, departmentIds }).subscribe({
      next: () => {
        this.managerSubmitting = false;
        this.managerForm.reset();
        this.resetCreateManagerDepartmentSelection();
        this.overlay.showOverlay('success', 'Fachbereichsleiter wurde angelegt. Initiales Passwort: init');
        this.loadAreaManagers();
      },
      error: (err) => {
        this.managerSubmitting = false;
        this.overlay.showOverlay('error', err?.error?.error || 'Fachbereichsleiter konnte nicht angelegt werden.');
      }
    });
  }

  onManagerDepartmentToggle(managerId: number, departmentId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;
    const current = new Set(this.managerSelections[managerId] || []);

    if (checked) {
      current.add(departmentId);
    } else {
      current.delete(departmentId);
    }

    this.managerSelections[managerId] = Array.from(current.values());
  }

  onCreateManagerDepartmentToggle(departmentId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;
    const current = new Set(this.managerSelections[0] || []);

    if (checked) {
      current.add(departmentId);
    } else {
      current.delete(departmentId);
    }

    this.managerSelections[0] = Array.from(current.values());
  }

  saveAreaManagerDepartments(manager: AreaManager): void {
    const departmentIds = this.managerSelections[manager.id] || [];

    if (departmentIds.length === 0) {
      this.overlay.showOverlay('error', 'Mindestens ein Fachbereich muss zugewiesen bleiben.');
      return;
    }

    this.savingManagerId = manager.id;
    this.admin.updateAreaManagerDepartments(manager.id, departmentIds).subscribe({
      next: () => {
        this.savingManagerId = null;
        this.overlay.showOverlay('success', `Zuweisungen für ${manager.username} wurden gespeichert.`);
        this.loadAreaManagers();
      },
      error: (err) => {
        this.savingManagerId = null;
        this.overlay.showOverlay('error', err?.error?.error || 'Zuweisung konnte nicht gespeichert werden.');
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

  isDepartmentSelectedForManager(managerId: number, departmentId: number): boolean {
    return (this.managerSelections[managerId] || []).includes(departmentId);
  }

  isDepartmentSelectedForCreate(departmentId: number): boolean {
    return (this.managerSelections[0] || []).includes(departmentId);
  }

  getSelectedCreateManagerDepartmentIds(): number[] {
    return this.managerSelections[0] || [];
  }

  resetCreateManagerDepartmentSelection(): void {
    this.managerSelections[0] = [];
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

  onManagerSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.managerSearchTerm = target?.value ?? '';
    this.runManagerSearch();
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

  clearManagerSearch(): void {
    this.managerSearchTerm = '';
    this.managerSearchResults = [...this.areaManagers];
  }

  private runManagerSearch(): void {
    const q = this.managerSearchTerm.trim().toLowerCase();

    if (!q) {
      this.managerSearchResults = [...this.areaManagers];
      return;
    }

    this.managerSearchResults = this.areaManagers.filter((manager) => {
      const username = manager.username?.toLowerCase() || '';
      const departments = (manager.departments || []).some((department) =>
        department.name?.toLowerCase().includes(q)
      );

      return username.includes(q) || departments;
    });
  }
}
