import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'neon' | 'dim';
export type Outline = "outlines" | "no-outlines";
export type Color = "standard" | "soft" | "color-wip";
export type Glass = "solid" | "glass";

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  themeKey = "theme";
  outlineKey = "outline";
  colorKey = "color";
  glassKey = "glass";
  currentThemeSubject = new BehaviorSubject<Theme>('light');
  currentOutlineSubject = new BehaviorSubject<Outline>("no-outlines");
  currentColorSubject = new BehaviorSubject<Color>("standard");
  currentGlassSubject = new BehaviorSubject<Glass>("solid");
  currentTheme$ = this.currentThemeSubject.asObservable();
  currentOutline$ = this.currentOutlineSubject.asObservable();
  currentColor$ = this.currentColorSubject.asObservable();
  currentGlass$ = this.currentGlassSubject.asObservable();

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
    const savedGlass = localStorage.getItem(this.glassKey) as Glass;
    if(savedGlass) {
      this.setGlass(savedGlass, false);
    } else {
      this.setGlass("solid", false);
    }
  }

  setTheme(theme: Theme, save = true) {
    document.body.classList.remove('light', 'neon', 'dim');
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
    document.body.classList.remove("standard", "soft", "color-wip");
    document.body.classList.add(color);

    this.currentColorSubject.next(color);

    if (save) {
      localStorage.setItem(this.colorKey, color);
    }
  }

  getColor(): Color {
    return this.currentColorSubject.value;
  }

  setGlass(glass: Glass, save = true) {
    document.body.classList.remove("solid", "glass");
    document.body.classList.add(glass);

    this.currentGlassSubject.next(glass);

    if(save) {
      localStorage.setItem(this.glassKey, glass);
    }
  }

  getGlass(): Glass {
    return this.currentGlassSubject.value;
  }
}