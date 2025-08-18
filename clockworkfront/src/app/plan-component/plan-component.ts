import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendAccess } from '../backend-access';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-month-plan',
  imports: [CommonModule],
  templateUrl: './plan-component.html',
  styleUrl: './plan-component.css'
})
export class PlanComponent implements OnInit {
  year!: number;
  month!: number;
  plan: any = { days: [], users: [], entries: {} };
  monthSummary: any = {};

  constructor(private activatedRoute: ActivatedRoute, private backend: BackendAccess) {}

  ngOnInit(): void {
    this.year = Number(this.activatedRoute.snapshot.paramMap.get("year"));
    this.month = Number(this.activatedRoute.snapshot.paramMap.get("month"));
    this.loadPlan();
  }

  loadPlan() {
    this.backend.getPlan(this.year, this.month).subscribe({
      next: (res) => {
        this.plan = res;
        this.calculateSummary();
      },
      error: (err) => console.error(err)
    });
  }

  calculateSummary() {
    this.monthSummary = {};
    this.plan.users.forEach((user: string) => {
      let vacationUsed = 0;
      let vacationLeft = this.plan.totalVacation?.[user] ?? 0;
      let homeoffice = 0;
      let other = 0;

      for (let day of this.plan.days) {
        const entry = this.plan.entries[user]?.[day.date];
        if (entry) {
          switch(entry.type) {
            case 'urlaub': vacationUsed++; vacationLeft--; break;
            case 'homeoffice': homeoffice++; break;
            default: other++; break;
          }
        }
      }
      this.monthSummary[user] = { vacationUsed, vacationLeft, homeoffice, other };
    });
  }

  convertWeekday(day: number) {
    return ['So','Mo','Di','Mi','Do','Fr','Sa'][day%7];
  }

  deleteEntry(user: string, date: string) {
    this.backend.deleteEntry(this.year, this.month, user, date).subscribe({
      next: () => this.loadPlan(),
      error: (err) => console.error(err)
    });
  }
}