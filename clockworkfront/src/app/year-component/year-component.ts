import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackendAccess } from '../backend-access';

@Component({
  selector: 'app-year-component',
  imports: [CommonModule],
  templateUrl: './year-component.html',
  styleUrl: './year-component.css'
})
export class YearComponent implements OnInit {
  years: number[] = [];
  errorMessage: string | null = null;

  constructor(private backendAccess: BackendAccess) {}

  ngOnInit(): void {
    this.backendAccess.getYears().subscribe({
      next: (res) => {
        this.years = res.years;
      },
      error: (err) => {
        console.error('Fehler beim Laden der Jahre:', err);
        this.errorMessage = 'Jahre konnten nicht geladen werden.';
      }
    });
  }
}