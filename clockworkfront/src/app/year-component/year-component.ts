import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OverlayService } from '../overlay-service';
import { BackendAccess } from '../backend-access';
import { AuthService } from '../auth-service';
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
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './year-component.html',
  styleUrls: ['./year-component.css']
})
export class YearComponent implements OnInit {
  years: YearCard[] = [];

  constructor(
    private backend: BackendAccess,
    public auth: AuthService,
    private overlay: OverlayService
  ) {}

  ngOnInit(): void {
    this.auth.authStatus$
      .pipe(
        take(1),
        map(status => status?.user?.departmentId ?? null),
        switchMap(depId => {
          if (depId == null) {
            this.overlay.showOverlay('error', 'Kein Fachbereich im Login gefunden.');
            return of<{ plans: PlanListItem[] }>({ plans: [] });
          }
          return this.backend.getPlansForDepartment(depId);
        }),
        catchError(() => {
          this.overlay.showOverlay('error', 'Fehler beim Laden der verfügbaren Jahre.');
          return of<{ plans: PlanListItem[] }>({ plans: [] });
        })
      )
      .subscribe(({ plans }) => {
        // Ein Plan je Jahr (Unique-Constraint vorhanden) – wir mappen direkt
        const cards = plans
          .map(p => ({ value: p.year, colorClass: this.randomClass() }))
          .sort((a, b) => b.value - a.value);

        this.years = cards;

        if(this.auth.isAdmin()) {
          this.overlay.showOverlay('info', 'nice!! du hast ein easter egg gefunden! jetzt meld dich mit einem it konto an du troll :p');
        }
        if (this.years.length === 0 && !this.auth.isAdmin()) {
          this.overlay.showOverlay('info', 'Es wurden noch keine Jahrespläne für Ihre Abteilung erstellt.');
        }
      });
  }

  private randomClass(): string {
    return `gradient-${Math.floor(Math.random() * 6) + 1}`;
  }
}