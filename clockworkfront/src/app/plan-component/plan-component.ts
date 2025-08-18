import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-plan-component',
  imports: [],
  templateUrl: './plan-component.html',
  styleUrl: './plan-component.css'
})
export class PlanComponent implements OnInit {
  year!: number;
  month: string | null = null;

  constructor(private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.year = Number(this.activatedRoute.snapshot.paramMap.get("year"));
    const monthNum = Number(this.activatedRoute.snapshot.paramMap.get("month"));
    this.month = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
  }
}