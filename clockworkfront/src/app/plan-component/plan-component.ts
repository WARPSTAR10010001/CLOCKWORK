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

interface SelectedCell {
  user: string;
  day: Date;
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
  isDark: boolean = false;

  selectedCells: SelectedCell[] = [];
  anchorCell: SelectedCell | null = null;

  constructor(private backendAccess: BackendAccess, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.month = Number(this.activatedRoute.snapshot.paramMap.get("month"));
    this.year = Number(this.activatedRoute.snapshot.paramMap.get("year"));
    this.loadPlan(this.year, this.month);
    if (document.body.classList.contains('dark')) {
      this.isDark = true;
    }
  }

  loadPlan(year: number, month: number): void {
    this.backendAccess.getPlan(year, month).subscribe({
      next: (data) => {
        this.plan = data;
        this.days = this.generateDays(year, month);
      },
      error: (err) => console.error('Fehler beim Laden des Plans:', err)
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

  toIso(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  getCellType(user: string, day: Date): string | null {
    if (!this.plan) return null;
    const key = this.toIso(day);
    return this.plan.entries?.[user]?.[key]?.type ?? null;
  }


  selectCell(user: string, day: Date, event: MouseEvent): void {
    if (event.shiftKey && this.anchorCell) {
      this.selectedCells = this.getCellsInRange(this.anchorCell, { user, day });
    } else {
      this.anchorCell = { user, day };
      this.selectedCells = [{ user, day }];
    }
  }

  getCellsInRange(start: SelectedCell, end: SelectedCell): SelectedCell[] {
    if (!this.plan) return [];

    if (start.user !== end.user) {
      return [{ user: end.user, day: end.day }];
    }

    const user = start.user;
    const startIndex = this.days.findIndex(d => d.getTime() === start.day.getTime());
    const endIndex = this.days.findIndex(d => d.getTime() === end.day.getTime());

    if (startIndex === -1 || endIndex === -1) return [];

    const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];

    return this.days.slice(min, max + 1).map(day => ({ user, day }));
  }

  isSelected(user: string, day: Date): boolean {
    return this.selectedCells.some(c => c.user === user && c.day.getTime() === day.getTime());
  }

  deselect(): void {
    this.selectedCells = [];
    this.anchorCell = null;
  }

  setEntry(type: string): void {
    if (!this.plan) return;

    if (this.selectedCells.length > 1) {
      const groupedByUser: { [user: string]: Date[] } = {};
      this.selectedCells.forEach(cell => {
        if (!groupedByUser[cell.user]) groupedByUser[cell.user] = [];
        groupedByUser[cell.user].push(cell.day);
      });

      for (const user in groupedByUser) {
        const dates = groupedByUser[user].sort((a, b) => a.getTime() - b.getTime());
        const start = dates[0];
        const end = dates[dates.length - 1];

        if (type !== "") {
          this.addEntries(user, start, end, type);
        } else {
          this.deleteEntries(user, start, end);
        }
      }
    } else if (this.selectedCells.length === 1) {
      const { user, day } = this.selectedCells[0];
      if (type !== "") {
        this.addEntry(user, day, type);
      } else {
        this.deleteEntry(user, day);
      }
    }

    this.deselect();
  }

  addEntry(employee: string, date: Date, type: string): void {
    if (!this.plan) return;
    const isoDate = this.toIso(date);
    this.backendAccess.newEntry(this.plan.year, this.plan.month, employee, isoDate, type).subscribe({
      next: () => this.loadPlan(this.plan!.year, this.plan!.month),
      error: (err) => console.error('Fehler beim Hinzufügen: ', err)
    });
  }

  deleteEntry(employee: string, date: Date): void {
    if (!this.plan) return;
    const isoDate = this.toIso(date);
    this.backendAccess.deleteEntry(this.plan.year, this.plan.month, employee, isoDate).subscribe({
      next: () => this.loadPlan(this.plan!.year, this.plan!.month),
      error: (err) => console.error('Fehler beim Löschen: ', err)
    });
  }

  addEntries(employee: string, start: Date, end: Date, type: string): void {
    if (!this.plan) return;
    const isoStart = this.toIso(start);
    const isoEnd = this.toIso(end);
    this.backendAccess.newEntries(this.plan.year, this.plan.month, employee, isoStart, isoEnd, type).subscribe({
      next: () => this.loadPlan(this.plan!.year, this.plan!.month),
      error: (err) => console.error('Fehler beim Bulk-Hinzufügen: ', err)
    });
  }

  deleteEntries(employee: string, start: Date, end: Date): void {
    if (!this.plan) return;
    const year = this.plan.year;
    const month = this.plan.month;

    const isoStart = this.toIso(start);
    const isoEnd = this.toIso(end);

    this.backendAccess.deleteEntries(year, month, employee, isoStart, isoEnd)
      .subscribe({
        next: () => this.loadPlan(year, month),
        error: (err) => console.error('Fehler beim Bulk-Löschen: ', err)
      });
  }
}