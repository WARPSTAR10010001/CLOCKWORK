// src/app/log-component/log-component.ts
import { Component, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackendAccess, PlanLogDTO } from '../backend-access';
import { AuthService } from '../auth-service';
import { ImpersonationService } from '../impersonation-service';
import { OverlayService } from '../overlay-service';
import { switchMap, map, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-log-component',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './log-component.html',
  styleUrl: './log-component.css'
})
export class LogComponent implements OnInit {
  year!: number;
  month!: number;
  planId: number | null = null;

  /** alle Logs vom Server (unverändert) */
  allLogs: PlanLogDTO[] = [];
  /** gefilterte Logs, die angezeigt werden */
  logs: PlanLogDTO[] = [];

  loading = false;

  /** Filterzustände */
  actionFilter: '' | 'VACATION' | 'HOME' | 'SICK' | 'TRAINING' | 'FLEXTIME' | 'APPOINTMENT' | 'OTHER' = '';
  employeeFilter: '' | number = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private backend: BackendAccess,
    private auth: AuthService,
    private imp: ImpersonationService,
    private overlay: OverlayService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.year = Number(this.activatedRoute.snapshot.paramMap.get('year'));
    this.month = Number(this.activatedRoute.snapshot.paramMap.get('month'));
    this.loadLogs();
  }

  private loadLogs(): void {
    this.loading = true;

    this.auth.authStatus$.pipe(
      take(1),
      map(status => {
        const impDep  = this.imp.getEffectiveDepartmentId();
        const fromJwt = status?.user?.departmentId ?? null;
        const depId   = this.auth.isAdmin() ? (impDep ?? null) : fromJwt ?? null;
        return depId;
      }),
      switchMap(depId => {
        if (!depId) {
          this.overlay.showOverlay('error', 'Kein Fachbereich im Login gefunden.');
          this.router.navigate(['/auth']);
          return of(null);
        }
        return this.backend.getPlansForDepartment(depId).pipe(
          map(res => ({ depId, plans: res.plans }))
        );
      }),
      switchMap(data => {
        if (!data) return of(null);
        const plan = data.plans.find((p: any) => p.year === this.year) || null;
        if (!plan) {
          this.overlay.showOverlay('error', `Für ${this.year} existiert noch kein Plan.`);
          this.router.navigate(['/mod']);
          return of(null);
        }
        this.planId = plan.id;
        return this.backend.getPlanLogs(this.planId, this.year, this.month);
      }),
      catchError(err => {
        console.error('Fehler beim Laden der Logs:', err);
        this.overlay.showOverlay('error', 'Fehler beim Laden der Logs.');
        return of(null);
      })
    ).subscribe(res => {
      this.loading = false;
      if (!res) {
        this.allLogs = [];
        this.logs = [];
        return;
      }
      this.allLogs = res.logs || [];
      this.applyFilters();
    });
  }

  // === Filter ===

  get employeeOptions(): { id: number; name: string }[] {
    const map = new Map<number, string>();
    for (const log of this.allLogs) {
      if (!log.employee_id) continue;
      const label = log.employee_name || `Mitarbeiter #${log.employee_id}`;
      if (!map.has(log.employee_id)) {
        map.set(log.employee_id, label);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }

  onActionFilterChange() {
    this.applyFilters();
  }

  onEmployeeFilterChange() {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.allLogs];

    if (this.actionFilter) {
      filtered = filtered.filter(l => (l.status_code || '').toUpperCase() === this.actionFilter);
    }

    if (this.employeeFilter) {
      filtered = filtered.filter(l => l.employee_id === this.employeeFilter);
    }

    this.logs = filtered;
  }

  // === Anzeige-Helfer ===

  describeLog(log: PlanLogDTO): string {
    const type = log.action_type;
    const st = (log.status_code || '').toUpperCase();

    const statusLabel: Record<string, string> = {
      VACATION: 'Urlaub',
      HOME: 'Homeoffice',
      SICK: 'Krank',
      TRAINING: 'Lehrgang',
      FLEXTIME: 'Gleitzeit',
      APPOINTMENT: 'Termin',
      OTHER: 'Anderes'
    };

    if (type === 'SET' && st) {
      const label = statusLabel[st] || st;
      return `${label} eingetragen`;
    }
    if (type === 'DELETE' && st) {
      const label = statusLabel[st] || st;
      return `${label}-Einträge gelöscht`;
    }
    if (type === 'DELETE') return 'Einträge gelöscht';
    return type;
  }

  /** ISO-String -> "DD/MM/YY" */
  formatDateShort(raw: string | null | undefined): string {
    if (!raw) return '-';
    const str = String(raw);
    const ymd = str.slice(0, 10);
    const parts = ymd.split('-');
    if (parts.length !== 3) return ymd;
    const [y, m, d] = parts;
    return `${d}/${m}/${y.slice(2)}`;
  }

  formatDates(dates: string[] | null | undefined): string {
    if (!dates || dates.length === 0) return '-';
    return dates
      .map(d => this.formatDateShort(d))
      .join(', ');
  }
}