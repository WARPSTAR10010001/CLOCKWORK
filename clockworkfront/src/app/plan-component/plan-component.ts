import { Component, OnInit } from '@angular/core';
import { BackendAccess } from '../backend-access';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface Entry {
  employee: string;
  date: string;
  type: string;
}

export interface Plan {
  year: number;
  month: number;
  users: string[];
  entries: Entry[];
  counters: { [username: string]: number };
}

@Component({
  selector: 'app-plan',
  imports: [CommonModule],
  templateUrl: './plan-component.html',
  styleUrl: './plan-component.css'
})

export class PlanComponent implements OnInit {
  month!: number;
  year!: number;
  plan: Plan | null = null;
  days: Date[] = [];
  weekdays: string[] = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
  loading = false;

  constructor(private backendAccess: BackendAccess, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.month = Number(this.activatedRoute.snapshot.paramMap.get("month"));
    this.year = Number(this.activatedRoute.snapshot.paramMap.get("year"));
    this.loadPlan(this.year, this.month);
  }

  loadPlan(year: number, month: number): void {
    this.loading = true;
    this.backendAccess.getPlan(year, month).subscribe({
      next: (data) => {
        this.plan = data;
        this.days = this.generateDays(year, month);
        this.loading = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden des Plans:', err);
        this.loading = false;
      }
    });
  }

  private generateDays(year: number, month: number): Date[] {
    const days: Date[] = [];
    const date = new Date(year, month - 1, 1);

    while (date.getMonth() === month - 1) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) {
        days.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }

    return days;
  }

  getEntry(employee: string, day: Date): Entry[] {
    if (!this.plan) return [];
    const dayStr = day.toISOString().split('T')[0];
    return this.plan.entries.filter(e => e.employee === employee && e.date === dayStr);
  }

  addEntry(employee: string, date: Date, type: string): void {
    if (!this.plan) return;
    const year = this.plan.year;
    const month = this.plan.month;
    const isoDate = date.toISOString().split('T')[0];

    this.backendAccess.newEntry(year, month, employee, isoDate, type).subscribe({
      next: () => this.loadPlan(year, month),
      error: (err) => console.error('Fehler beim Hinzufügen:', err)
    });
  }

  deleteEntry(employee: string, date: Date): void {
    if (!this.plan) return;
    const year = this.plan.year;
    const month = this.plan.month;
    const isoDate = date.toISOString().split('T')[0];

    this.backendAccess.deleteEntry(year, month, employee, isoDate).subscribe({
      next: () => this.loadPlan(year, month),
      error: (err) => console.error('Fehler beim Löschen:', err)
    });
  }

  addEntries(employee: string, start: Date, end: Date, type: string): void {
    if (!this.plan) return;
    const year = this.plan.year;
    const month = this.plan.month;

    const isoStart = start.toISOString().split('T')[0];
    const isoEnd = end.toISOString().split('T')[0];

    this.backendAccess.newEntries(year, month, employee, isoStart, isoEnd, type).subscribe({
      next: () => this.loadPlan(year, month),
      error: (err) => console.error('Fehler beim Hinzufügen mehrerer Einträge:', err)
    });
  }

  getToday(): Date {
    return new Date();
  }

  public getEntriesForUser(user: string): any[] {
    if (!this.plan || !this.plan.entries) return [];
    return this.plan.entries.filter((entry: any) => entry.user === user);
  }
}