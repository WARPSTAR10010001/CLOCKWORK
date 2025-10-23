import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth-service';
import { ImpersonationService } from '../impersonation-service';
import { DepartmentsService, Department } from '../departments-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mod-overview-component',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './mod-overview-component.html',
  styleUrl: './mod-overview-component.css'
})
export class ModOverviewComponent implements OnInit {
  departments: Department[] = [];
  selectedDeptId: number | null = null;

  constructor(
    public authService: AuthService,
    private imp: ImpersonationService,
    private deps: DepartmentsService
  ) {}

  ngOnInit(): void {
    // Admin: Liste laden + Auswahl aus Session übernehmen
    if (this.authService.isAdmin()) {
      this.deps.getAllDepartments().subscribe({
        next: (d) => this.departments = d || [],
        error: () => {}
      });
      this.selectedDeptId = this.imp.getEffectiveDepartmentId();
    } else {
      // Nicht-Admin: effektives Dept = eigenes Dept
      this.selectedDeptId = this.imp.getEffectiveDepartmentId();
    }
  }

  onSelectDept(id: number | null) {
    this.selectedDeptId = id;
    this.imp.setDepartmentId(id);
  }

  get canNavigate(): boolean {
    // Admin: nur mit gesetztem Department; Nicht-Admin: immer
    return this.authService.isAdmin() ? this.selectedDeptId != null : true;
  }
}