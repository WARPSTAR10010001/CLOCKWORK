import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth-service';
import { OverlayService } from '../overlay-service';

@Component({
  selector: 'app-dashboard-component',
  imports: [RouterLink],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css',
})
export class DashboardComponent {
  constructor (
    public auth: AuthService,
    public overlay: OverlayService
  ) {}
  now = new Date();

  month = this.now.getMonth() + 1;
  year = this.now.getFullYear();
}
