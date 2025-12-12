// src/app/mod-overview-component/mod-overview-component.ts
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth-service';
import { ImpersonationService } from '../impersonation-service';
import { DepartmentsService, Department } from '../departments-service';
import { FormsModule } from '@angular/forms';
import { UserService } from '../user-service';
import { OverlayService } from '../overlay-service';

@Component({
  selector: 'app-mod-overview-component',
  imports: [RouterLink, FormsModule],
  templateUrl: './mod-overview-component.html',
  styleUrl: './mod-overview-component.css'
})
export class ModOverviewComponent implements OnInit {
  departments: Department[] = [];
  selectedDeptId: number | null = null;
  busy = false;

  constructor(
    public authService: AuthService,
    private imp: ImpersonationService,
    private deps: DepartmentsService,
    private user: UserService,
    private overlay: OverlayService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.deps.getAllDepartments().subscribe({
        next: (d) => (this.departments = d || []),
        error: () => {}
      });
      this.selectedDeptId = this.imp.getEffectiveDepartmentId();
    } else {
      this.selectedDeptId = this.imp.getEffectiveDepartmentId();
    }
  }

  onSelectDept(id: number | null) {
    this.selectedDeptId = id;
    this.imp.setDepartmentId(id);
  }

  get canNavigate(): boolean {
    return this.authService.isAdmin() ? this.selectedDeptId != null : true;
  }

  private requireDept(): number | null {
    if (this.authService.isAdmin()) return this.selectedDeptId ?? null;
    return this.selectedDeptId ?? null;
  }

  resetUserPassword() {
    const deptId = this.requireDept();
    if (!deptId) {
      this.overlay.showOverlay('error', 'Bitte zuerst einen Fachbereich auswählen.');
      return;
    }

    const confirmReset = confirm(
      'Möchten Sie wirklich alle Nutzerpasswörter in diesem Fachbereich zurücksetzen?'
    );
    if (!confirmReset) return;

    if (this.busy) return;
    this.busy = true;

    this.user.resetDeptUserPassword(deptId).subscribe({
      next: () => {
        this.busy = false;
        this.overlay.showOverlay('success', 'Nutzerpasswörter wurden auf "reset" gesetzt.');
      },
      error: (err) => {
        this.busy = false;
        this.overlay.showOverlay('error', err?.error?.error || 'Zurücksetzen fehlgeschlagen.');
      }
    });
  }

  resetModPassword() {
    if (!this.authService.isAdmin()) return;
    const deptId = this.requireDept();
    if (!deptId) {
      this.overlay.showOverlay('error', 'Bitte zuerst einen Fachbereich auswählen.');
      return;
    }

    const confirmReset = confirm(
      'Möchten Sie wirklich das Moderatorpasswort dieses Fachbereichs zurücksetzen?'
    );
    if (!confirmReset) return;

    if (this.busy) return;
    this.busy = true;

    this.user.resetDeptModPassword(deptId).subscribe({
      next: () => {
        this.busy = false;
        this.overlay.showOverlay('success', 'Moderatorpasswort wurde auf "reset" gesetzt.');
      },
      error: (err) => {
        this.busy = false;
        this.overlay.showOverlay('error', err?.error?.error || 'Zurücksetzen fehlgeschlagen.');
      }
    });
  }
}