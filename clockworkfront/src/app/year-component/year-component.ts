import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OverlayService } from '../overlay-service';
// NEU: Importiere den richtigen Service und das Plan-Interface
import { BackendAccess, Plan } from '../backend-access';

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

  // NEU: Injiziere den PlanService statt dem alten BackendAccess
  constructor(
    private backendAccess: BackendAccess,
    private overlayService: OverlayService
  ) {}

  ngOnInit() {
    // NEU: Rufe die neue, saubere Methode im PlanService auf
    this.backendAccess.getAllPlansForDepartment().subscribe({
      next: (plans: Plan[]) => {
        // Die Logik ist jetzt einfacher: Wir mappen direkt über die Plan-Objekte
        this.years = plans.map((plan: Plan) => ({
          value: plan.year,
          colorClass: this.randomClass()
        })).sort((a, b) => b.value - a.value); // Sortiere absteigend, neustes Jahr zuerst

        if (this.years.length === 0) {
          // Die Nachricht ist jetzt hilfreicher für den Nutzer
          this.overlayService.showOverlay("info", "Es wurden noch keine Jahrespläne für Ihre Abteilung erstellt.");
        }
      },
      error: () => {
        this.overlayService.showOverlay("error", "Fehler beim Laden der verfügbaren Jahre.");
      }
    });
  }

  private randomClass(): string {
    return `gradient-${Math.floor(Math.random() * 6) + 1}`;
  }
}