import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth-service';

@Component({
  selector: 'app-mod-overview-component',
  imports: [RouterLink],
  templateUrl: './mod-overview-component.html',
  styleUrl: './mod-overview-component.css'
})
export class ModOverviewComponent {
  constructor (public authService: AuthService) {}

}
