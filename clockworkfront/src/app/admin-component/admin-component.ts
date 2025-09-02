import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { BackendAccess } from '../backend-access';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-component.html',
  styleUrls: ['./admin-component.css']
})
export class AdminComponent {
  planForm: FormGroup;
  submitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private backend: BackendAccess, private router: Router) {
    this.planForm = this.fb.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
      users: this.fb.array([])
    });
    this.addUser();
  }

  get users(): FormArray {
    return this.planForm.get('users') as FormArray;
  }

  addUser() {
    this.users.push(this.fb.group({
      name: ['', Validators.required],
      lastYearCarryOver: [0, [Validators.required, Validators.min(0)]],
      totalVacation: [30, [Validators.required, Validators.min(0)]]
    }));
  }

  removeUser(index: number) {
    this.users.removeAt(index);
  }

  submit() {
    if (this.planForm.invalid) {
      this.errorMessage = "Bitte alle Felder korrekt ausfüllen.";
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    const formValue = this.planForm.value;
    const payload: any = {
      year: formValue.year,
      users: formValue.users.map((u: any) => u.name),
      lastYearCarryOver: {},
      totalVacation: {}
    };

    formValue.users.forEach((u: any) => {
      payload.lastYearCarryOver[u.name] = u.lastYearCarryOver;
      payload.totalVacation[u.name] = u.totalVacation;
    });

    this.backend.newPlan(payload.year, payload.users, payload.lastYearCarryOver, payload.totalVacation)
      .subscribe({
        next: (res) => {
          this.submitting = false;
          this.router.navigate(['/plan']);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = "Fehler beim Erstellen des Jahresplans.";
          this.submitting = false;
        }
      });
  }
}