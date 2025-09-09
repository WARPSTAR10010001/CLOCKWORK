import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark' | 'dim';
export type Outline = "outlines" | "no-outlines";
export type Color = "standard" | "soft" | "bw";

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  themeKey = 'theme';
  outlineKey = "outline";
  colorKey = "color";
  currentThemeSubject = new BehaviorSubject<Theme>('light');
  currentOutlineSubject = new BehaviorSubject<Outline>("no-outlines");
  currentColorSubject = new BehaviorSubject<Color>("standard");
  currentTheme$ = this.currentThemeSubject.asObservable();
  currentOutline$ = this.currentOutlineSubject.asObservable();
  currentColor$ = this.currentColorSubject.asObservable();

  constructor() {
    const savedTheme = localStorage.getItem(this.themeKey) as Theme;
    if (savedTheme) {
      this.setTheme(savedTheme, false);
    } else {
      this.setTheme('light', false);
    }
    const savedOutline = localStorage.getItem(this.outlineKey) as Outline;
    if (savedOutline) {
      this.setOutline(savedOutline, false);
    } else {
      this.setOutline("no-outlines", false);
    }
    const savedColor = localStorage.getItem(this.colorKey) as Color;
    if (savedColor) {
      this.setColor(savedColor, false);
    } else {
      this.setColor("standard", false);
    }
  }

  setTheme(theme: Theme, save = true) {
    document.body.classList.remove('light', 'dark', 'dim');
    document.body.classList.add(theme);

    this.currentThemeSubject.next(theme);

    if (save) {
      localStorage.setItem(this.themeKey, theme);
    }
  }

  getTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  setOutline(outline: Outline, save = true) {
    document.body.classList.remove('outlines', 'no-outlines');
    document.body.classList.add(outline);

    this.currentOutlineSubject.next(outline);

    if (save) {
      localStorage.setItem(this.outlineKey, outline);
    }
  }

  getOutline(): Outline {
    return this.currentOutlineSubject.value;
  }

  setColor(color: Color, save = true) {
    document.body.classList.remove("standard", "soft", "bw");
    document.body.classList.add(color);

    this.currentColorSubject.next(color);

    if (save) {
      localStorage.setItem(this.colorKey, color);
    }
  }

  getColor(): Color {
    return this.currentColorSubject.value;
  }
}