import { Component, OnInit } from '@angular/core';
import { BackendAccess } from '../backend-access';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface PlanDay { date: string; weekday: number }

export interface Plan {
  year: number;
  month: number;
  users: string[];
  days: PlanDay[];
  entries: { [username: string]: { [isoDate: string]: { type: string } } };
  remainingVacation: { [username: string]: number };
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
  selectedUser: string | null = null;
  selectedDay: Date | null = null;

  constructor(private backendAccess: BackendAccess, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.month = Number(this.activatedRoute.snapshot.paramMap.get("month"));
    this.year = Number(this.activatedRoute.snapshot.paramMap.get("year"));
    this.loadPlan(this.year, this.month);
  }

  loadPlan(year: number, month: number): void {
    this.backendAccess.getPlan(year, month).subscribe({
      next: (data) => {
        this.plan = data;
        this.days = this.generateDays(year, month);
      },
      error: (err) => {
        console.error('Fehler beim Laden des Plans:', err);
      }
    });
  }

  generateDays(year: number, month: number): Date[] {
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

  addEntry(employee: string, date: Date, type: string): void {
    if (!this.plan) return;
    const year = this.plan.year;
    const month = this.plan.month;
    const isoDate = this.toIso(date);

    this.backendAccess.newEntry(year, month, employee, isoDate, type).subscribe({
      next: () => this.loadPlan(year, month),
      error: (err) => console.error('Fehler beim Hinzufügen: ', err)
    });
  }

  deleteEntry(employee: string, date: Date): void {
    if (!this.plan) return;
    const year = this.plan.year;
    const month = this.plan.month;
    const isoDate = this.toIso(date);

    this.backendAccess.deleteEntry(year, month, employee, isoDate).subscribe({
      next: () => this.loadPlan(year, month),
      error: (err) => console.error('Fehler beim Löschen: ', err)
    });
  }

  addEntries(employee: string, start: Date, end: Date, type: string): void {
    if (!this.plan) return;
    const year = this.plan.year;
    const month = this.plan.month;

    const isoStart = this.toIso(start);
    const isoEnd = this.toIso(end);

    this.backendAccess.newEntries(year, month, employee, isoStart, isoEnd, type).subscribe({
      next: () => this.loadPlan(year, month),
      error: (err) => console.error('Fehler beim Hinzufügen mehrerer Einträge: ', err)
    });
  }

  getToday(): Date {
    return new Date();
  }

  toIso(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  getCellType(user: string, day: Date): string | null {
    if (!this.plan) return null;
    const key = this.toIso(day);
    return this.plan.entries?.[user]?.[key]?.type ?? null;
  }

  selectCell(user: string, day: Date): void {
    this.selectedUser = user;
    this.selectedDay = day;
  }

  isSelected(user: string, day: Date): boolean {
    return this.selectedUser === user && this.selectedDay?.getTime() === day.getTime();
  }

  setEntry(type: string): void {
    if (this.selectedUser && this.selectedDay && type !== "") {
      this.addEntry(this.selectedUser, this.selectedDay, type);
    } else if (this.selectedUser && this.selectedDay && type === "") {
      this.deleteEntry(this.selectedUser, this.selectedDay);
    }
  }
}