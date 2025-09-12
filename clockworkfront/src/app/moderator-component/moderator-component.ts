import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OverlayService } from '../overlay-service';
import { BackendAccess, NewPlanPayload } from '../backend-access';
import { Employee, EmployeeService } from '../employee-service';

@Component({
  selector: 'app-moderator-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './moderator-component.html',
  styleUrl: './moderator-component.css'
})
export class ModeratorComponent implements OnInit {
  planForm: FormGroup;
  submitting = false;
  availableEmployees: Employee[] = [];

  constructor(
    private overlayService: OverlayService,
    private fb: FormBuilder,
    private backendAccess: BackendAccess,
    private employeeService: EmployeeService,
    private router: Router
  ) {
    this.planForm = this.fb.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
      employees: this.fb.array([], Validators.required)
    });
  }

  ngOnInit(): void {
    this.employeeService.getEmployeesForDepartment().subscribe({
      next: (employees) => {
        this.availableEmployees = employees;
        if (this.employees.length === 0) {
            this.addEmployee();
        }
      },
      error: () => this.overlayService.showOverlay("error", "Mitarbeiterliste konnte nicht geladen werden.")
    });
  }

  get employees(): FormArray {
    return this.planForm.get('employees') as FormArray;
  }

  createEmployeeGroup(): FormGroup {
    return this.fb.group({
      employee_id: [null, Validators.required],
      vacation_days_carryover: [0, [Validators.required, Validators.min(0)]],
      vacation_days_total: [30, [Validators.required, Validators.min(0)]]
    });
  }

  addEmployee() {
    this.employees.push(this.createEmployeeGroup());
  }

  removeEmployee(index: number) {
    this.employees.removeAt(index);
  }

  submit() {
    if (this.planForm.invalid) {
      this.overlayService.showOverlay("error", "Bitte alle Felder korrekt ausfüllen.");
      this.planForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const payload: NewPlanPayload = this.planForm.value;

    this.backendAccess.createPlan(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.overlayService.showOverlay("success", "Neuer Jahresplan wurde erfolgreich erstellt.");
        this.router.navigate(['/plan']);
      },
      error: (err) => {
        console.error(err);
        this.overlayService.showOverlay("error", err.error?.error || "Fehler beim Erstellen des Jahresplans.");
        this.submitting = false;
      }
    });
  }
}