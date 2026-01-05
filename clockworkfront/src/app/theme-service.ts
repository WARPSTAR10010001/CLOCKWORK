import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'neon' | 'dim';
export type Outline = "outlines" | "no-outlines";
export type Color = "standard" | "soft";
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
    const savedThemeRaw = localStorage.getItem(this.themeKey);
    const theme = this.sanitizeTheme(savedThemeRaw);
    this.setTheme(theme, false);

    const savedOutlineRaw = localStorage.getItem(this.outlineKey);
    const outline = this.sanitizeOutline(savedOutlineRaw);
    this.setOutline(outline, false);

    const savedColorRaw = localStorage.getItem(this.colorKey);
    const color = this.sanitizeColor(savedColorRaw);
    this.setColor(color, false);

    const savedMaterialRaw = localStorage.getItem(this.materialKey);
    const material = this.sanitizeMaterial(savedMaterialRaw);
    this.setMaterial(material, false);
  }

  private sanitizeTheme(raw: string | null): Theme {
    if (raw === 'light' || raw === 'neon' || raw === 'dim') return raw;
    if (raw) localStorage.setItem(this.themeKey, 'light');
    return 'light';
  }

  private sanitizeOutline(raw: string | null): Outline {
    if (raw === 'outlines' || raw === 'no-outlines') return raw;
    if (raw) localStorage.setItem(this.outlineKey, 'no-outlines');
    return 'no-outlines';
  }

  private sanitizeColor(raw: string | null): Color {
    if (raw === 'standard' || raw === 'soft') return raw;
    if (raw) localStorage.setItem(this.colorKey, 'standard');
    return 'standard';
  }

  private sanitizeMaterial(raw: string | null): Material {
    if (raw === 'solid' || raw === 'glass') return raw;
    if (raw) localStorage.setItem(this.materialKey, 'solid');
    return 'solid';
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
    document.body.classList.remove("standard", "soft");
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

    if (save) {
      localStorage.setItem(this.materialKey, material);
    }
  }

  getMaterial(): Material {
    return this.currentMaterialSubject.value;
  }
}