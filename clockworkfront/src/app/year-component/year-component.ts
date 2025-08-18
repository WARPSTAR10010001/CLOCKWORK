import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BackendAccess } from '../backend-access';

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

  constructor(private backendAccess: BackendAccess) {}

  ngOnInit(): void {
    this.backendAccess.getYears().subscribe({
      next: (res) => {
        const list = res.years ?? res;
        this.years = list.map((year: number) => ({
          value: year,
          colorClass: this.randomClass()
        }));
      },
      error: (err) => {
        console.error('Fehler beim Laden der Jahre:', err);
        this.errorMessage = 'Jahre konnten nicht geladen werden.';
      }
    });
  }

  private randomClass(): string {
    return `gradient-${Math.floor(Math.random() * 6) + 1}`;
  }
}