import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'neon' | 'dim' | 'xmas';
export type Outline = "outlines" | "no-outlines";
export type Color = "standard" | "soft" | "color-wip";
export type Material = "solid" | "glass";

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  themeKey = "theme";
  outlineKey = "outline";
  colorKey = "color";
  materialKey = "material";
  currentThemeSubject = new BehaviorSubject<Theme>('light');
  currentOutlineSubject = new BehaviorSubject<Outline>("no-outlines");
  currentColorSubject = new BehaviorSubject<Color>("standard");
  currentMaterialSubject = new BehaviorSubject<Material>("solid");
  currentTheme$ = this.currentThemeSubject.asObservable();
  currentOutline$ = this.currentOutlineSubject.asObservable();
  currentColor$ = this.currentColorSubject.asObservable();
  currentMaterial$ = this.currentMaterialSubject.asObservable();

  constructor() {
    const savedTheme = localStorage.getItem(this.themeKey) as Theme;
    if (savedTheme) {
      this.setTheme('xmas', false); //change back when to "savedTheme" when xmas is over
    } else {
      this.setTheme('xmas', false); //change back when to "light" when xmas is over
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
    const savedMaterial = localStorage.getItem(this.materialKey) as Material;
    if(savedMaterial) {
      this.setMaterial(savedMaterial, false);
    } else {
      this.setMaterial("solid", false);
    }
  }

  setTheme(theme: Theme, save = true) {
    document.body.classList.remove('light', 'neon', 'dim', 'xmas');
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

  setMaterial(material: Material, save = true) {
    document.body.classList.remove("solid", "glass");
    document.body.classList.add(material);

    this.currentMaterialSubject.next(material);

    if(save) {
      localStorage.setItem(this.materialKey, material);
    }
  }

  getMaterial(): Material {
    return this.currentMaterialSubject.value;
  }
}