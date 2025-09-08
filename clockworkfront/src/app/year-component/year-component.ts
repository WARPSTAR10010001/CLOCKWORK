import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BackendAccess } from '../backend-access';
import { OverlayService } from '../overlay-service';

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
  errorMessage: string | null = null;

  constructor(private backendAccess: BackendAccess, private overlayService: OverlayService) {}

  ngOnInit() {
    this.backendAccess.getYears().subscribe({
      next: (res) => {
        const list = res.years ?? res;
        this.years = list.map((year: number) => ({
          value: year,
          colorClass: this.randomClass()
        }));
        if (this.years.length === 0) {
          this.overlayService.showOverlay("error", "Jahre konnten nicht geladen werden. Bitte wiederholen Sie den Anmeldevorgang oder kontaktieren Sie einen Systemadmin.");
        }
      },
      error: () => {
        this.overlayService.showOverlay("error", "Fehler beim Laden der Jahre. Bitte erneut versuchen.")
      }
    });
  }

  private randomClass(): string {
    return `gradient-${Math.floor(Math.random() * 6) + 1}`;
  }
}