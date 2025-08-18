import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface MonthCard {
  value: number;
  name: string;
  colorClass: string;
}

@Component({
  selector: 'app-month-component',
  imports: [CommonModule, RouterLink],
  templateUrl: './month-component.html',
  styleUrl: './month-component.css'
})

export class MonthComponent implements OnInit {
  year!: number;
  errorMessage: string | null = null;
  months: MonthCard[] = [];

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.year = Number(this.activatedRoute.snapshot.paramMap.get("year"));
    const monthNames = [
      "Januar", "Februar", "März", "April", "Mai", "Juni",
      "Juli", "August", "September", "Oktober", "November", "Dezember"
    ];
    this.months = monthNames.map((name, idx) => ({
      value: idx + 1,
      name,
      colorClass: this.randomClass()
    }));
  }

  private randomClass(): string {
    return `gradient-${Math.floor(Math.random() * 6) + 1}`;
  }
}