import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark' | 'dim' | 'hero';
export type Outline = "outlines" | "no-outlines";

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  themeKey = 'theme';
  outlineKey = "outline";
  currentThemeSubject = new BehaviorSubject<Theme>('light');
  currentOutlineSubject = new BehaviorSubject<Outline>("no-outlines");
  currentTheme$ = this.currentThemeSubject.asObservable();
  currentOutline$ = this.currentOutlineSubject.asObservable();

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
  }

  setTheme(theme: Theme, save = true) {
    document.body.classList.remove('light', 'dark', 'dim', 'hero');
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
}