import { Component, OnInit, Renderer2, HostListener } from '@angular/core';
import { OverlayService, OverlayState } from '../overlay-service';
import { ThemeService, Theme, Outline, Color } from '../theme-service';

@Component({
  selector: 'app-overlay-component',
  templateUrl: './overlay-component.html',
  styleUrls: ['./overlay-component.css']
})
export class OverlayComponent implements OnInit {
  overlayState: OverlayState = { show: false, type: 'info' };
  selectedTheme: Theme = 'light';
  selectedOutline: Outline = 'no-outlines';
  selectedColor: Color = "standard";

  constructor(
    private overlayService: OverlayService,
    private themeService: ThemeService,
    private renderer: Renderer2
  ) { }

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
    this.selectedColor = this.themeService.getColor();
    this.themeService.currentTheme$.subscribe(theme => this.selectedTheme = theme);
    this.themeService.currentOutline$.subscribe(outline => this.selectedOutline = outline);
    this.themeService.currentColor$.subscribe(color => this.selectedColor = color);
  }

  changeTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  changeOutline(outline: Outline) {
    this.themeService.setOutline(outline);
  }

  changeColor(color: Color) {
    this.themeService.setColor(color);
  }

  close() {
    this.overlayService.hideOverlay();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscHandler(event: Event) {
    if (this.overlayState.show) {
      if (this.overlayState.type !== 'passwordReset') {
        this.close();
      }
    }
  }
}