import { Component, OnInit, Renderer2 } from '@angular/core';
import { OverlayService, OverlayState } from '../overlay-service';
import { ThemeService, Theme, Outline } from '../theme-service';

@Component({
  selector: 'app-overlay-component',
  templateUrl: './overlay-component.html',
  styleUrls: ['./overlay-component.css']
})
export class OverlayComponent implements OnInit {
  overlayState: OverlayState = { show: false, type: 'info' };
  selectedTheme: Theme = 'light';
  selectedOutline: Outline = 'no-outlines';

  constructor(
    private overlayService: OverlayService,
    private themeService: ThemeService,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.overlayService.overlay$.subscribe(state => {
      this.overlayState = state;
      if (state.show) {
        this.renderer.setStyle(document.body, 'overflow', 'hidden');
      } else {
        this.renderer.setStyle(document.body, 'overflow', '');
      }
    });

    this.selectedTheme = this.themeService.getTheme();
    this.selectedOutline = this.themeService.getOutline();
    this.themeService.currentTheme$.subscribe(theme => this.selectedTheme = theme);
    this.themeService.currentOutline$.subscribe(outline => this.selectedOutline = outline);
  }

  changeTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  changeOutline(outline: Outline) {
    this.themeService.setOutline(outline);
  }

  close() {
    this.overlayService.hideOverlay();
  }
}