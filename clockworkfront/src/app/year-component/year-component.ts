import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OverlayService } from '../overlay-service';
import { PlanService } from '../plan-service';
import { AuthService } from '../auth-service';
import { ImpersonationService } from '../impersonation-service';
import { map, switchMap, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface PlanListItem {
  id: number;
  departmentId: number;
  year: number;
  createdAt: string;
}

interface YearCard {
  value: number;
  colorClass: string;
}

@Component({
  selector: 'app-year-component',
  imports: [CommonModule, RouterLink],
  templateUrl: './year-component.html',
  styleUrls: ['./year-component.css']
})
export class YearComponent implements OnInit {
  years: YearCard[] = [];
  showDeptHint = false;

  constructor(
    private plan: PlanService,
    public auth: AuthService,
    private overlay: OverlayService,
    private imp: ImpersonationService
  ) {}

  ngOnInit(): void {
    this.auth.authStatus$
      .pipe(
        take(1),
        map(status => {
          const impDepId = this.imp.getEffectiveDepartmentId();
          if (this.auth.isAdmin() && impDepId) return impDepId;

          return status?.user?.departmentId ?? null;
        }),
        switchMap(depId => {
          if (this.auth.isAdmin() && depId === null) {
            this.showDeptHint = true;
            return of<{ plans: PlanListItem[] }>({ plans: [] });
          }

          if (depId === null) {
            this.overlay.showOverlay('error', 'Kein Fachbereich im Kontext gefunden.');
            return of<{ plans: PlanListItem[] }>({ plans: [] });
          }

          return this.plan.getPlansForDepartment(depId);
        }),
        catchError(() => {
          this.overlay.showOverlay('error', 'Fehler beim Laden der verfügbaren Jahre.');
          return of<{ plans: PlanListItem[] }>({ plans: [] });
        })
      )
      .subscribe(({ plans }) => {
        const cards = (plans || [])
          .map(p => ({ value: p.year, colorClass: this.randomClass() }))
          .reduce<YearCard[]>((acc, cur) => {
            if (!acc.some(x => x.value === cur.value)) acc.push(cur);
            return acc;
          }, [])
          .sort((a, b) => b.value - a.value);

        this.years = cards;

        if (this.years.length === 0 && !this.auth.isAdmin()) {
          this.overlay.showOverlay('info', 'Es wurden noch keine Jahrespläne für Ihren Fachbereich erstellt.');
        }
      });
  }

  private randomClass(): string {
    return `gradient-${Math.floor(Math.random() * 6) + 1}`;
  }
}