import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Page = 'dashboard' | 'years' | 'current';

@Injectable({
  providedIn: 'root',
})
export class LandingPageService {
  pageKey = "page";

  currentPageSubject = new BehaviorSubject<Page>('dashboard');

  currentPage$ = this.currentPageSubject.asObservable();

  now = new Date();

  month = this.now.getMonth() + 1;
  year = this.now.getFullYear();

  constructor() {
    const savedPageRaw = localStorage.getItem(this.pageKey);
    const page = this.sanitizePage(savedPageRaw);
    this.setPage(page, false);
  }

  sanitizePage(raw: string | null): Page {
    if (raw === "dashboard" || raw === "years" || raw === "current") return raw;
    if (raw) localStorage.setItem(this.pageKey, 'dashboard');
    return 'dashboard';
  }

  setPage(page: Page, save = true) {
    document.body.classList.remove('dashboard', 'current', 'years');
    document.body.classList.add(page);

    this.currentPageSubject.next(page);

    if (save) {
      localStorage.setItem(this.pageKey, page);
    }
  }

  getPage(): Page {
      return this.currentPageSubject.value;
  }

  getComponentPage() {
    if (this.currentPageSubject.value === "current") {
      return `/plan/${this.year}/${this.month}`;
    } else {
      return this.currentPageSubject.value;
    }
  }
}