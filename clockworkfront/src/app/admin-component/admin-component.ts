import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { AdminService } from '../admin-service';
import { OverlayService } from '../overlay-service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-component.html',
  styleUrl: './admin-component.css'
})
export class AdminComponent implements OnInit {
  form: FormGroup;
  submitting = false;
  departments: any[] = [];

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
      next: (deps) => (this.departments = deps || []),
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
            `Fachbereich "${res.department.name}" angelegt. Nutzer: ${res.users
              .map((u) => u.username)
              .join(', ')} (PW: init)`
          );
          this.form.reset({ name: '', userUsername: '', modUsername: '' });
          this.submitting = false;
          this.reload();
        },
        error: (err) => {
          const msg = err?.error?.error || 'Erstellen fehlgeschlagen.';
          this.overlay.showOverlay('error', msg);
          this.submitting = false;
        }
      });
  }
}