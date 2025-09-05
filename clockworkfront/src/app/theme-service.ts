import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark' | 'dim';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeKey = 'theme';
  private currentThemeSubject = new BehaviorSubject<Theme>('light');
  currentTheme$ = this.currentThemeSubject.asObservable();

  private themeCycle: Theme[] = ['light', 'dark', 'dim'];

  constructor() {
    const savedTheme = localStorage.getItem(this.themeKey) as Theme;
    if (savedTheme) {
      this.setTheme(savedTheme, false);
    } else {
      this.setTheme('light', false);
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

  toggleDark() {
    const newTheme = this.getTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  cycleTheme() {
    const current = this.getTheme();
    const index = this.themeCycle.indexOf(current);
    const nextIndex = (index + 1) % this.themeCycle.length;
    const nextTheme = this.themeCycle[nextIndex];
    this.setTheme(nextTheme);
  }
}