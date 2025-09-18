import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { OverlayService } from '../overlay-service';
import { BackendAccess } from '../backend-access'; // Dein Service
import { EmployeeService, Employee } from '../employee-service'; // Dein Service

@Component({
  selector: 'app-moderator-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './moderator-component.html',
  styleUrls: ['./moderator-component.css']
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
    // Bestehende Mitarbeiter für Vorschläge laden
    this.employeeService.getEmployeesForDepartment().subscribe(employees => {
      this.availableEmployees = employees;
    });
    // Mit einer leeren Mitarbeiterzeile starten
    this.addEmployee();
  }

  get employees(): FormArray {
    return this.planForm.get('employees') as FormArray;
  }

  // Erstellt eine neue, leere Mitarbeiterzeile im Formular
  createEmployeeGroup(): FormGroup {
    const today = new Date().toISOString().split('T')[0];
    return this.fb.group({
      name: ['', Validators.required],
      start_date: [today, Validators.required],
      end_date: [null],
      vacation_days_carryover: [0, [Validators.required, Validators.min(0)]],
      vacation_days_total: [30, [Validators.required, Validators.min(0)]]
    });
  }

  addEmployee(): void {
    this.employees.push(this.createEmployeeGroup());
  }

  removeEmployee(index: number): void {
    this.employees.removeAt(index);
  }

  submit(): void {
    if (this.planForm.invalid) {
      this.overlayService.showOverlay("error", "Bitte alle erforderlichen Felder korrekt ausfüllen.");
      this.planForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const payload = this.planForm.value;

    this.backendAccess.createPlan(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.overlayService.showOverlay("success", `Jahresplan für ${payload.year} wurde erfolgreich erstellt.`);
        this.router.navigate(['/years']);
      },
      error: (err) => {
        this.submitting = false;
        const message = err.error?.error || "Fehler beim Erstellen des Jahresplans.";
        this.overlayService.showOverlay("error", message);
        console.error(err);
      }
    });
  }
}