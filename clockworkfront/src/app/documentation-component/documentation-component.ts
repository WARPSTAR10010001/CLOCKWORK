import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DOC_SECTIONS, DocSection, DocPage, DocArticle } from './docs-config';

type ViewMode = 'overview' | 'section' | 'page';

interface SearchResult {
  section: DocSection;
  page: DocPage;
  article: DocArticle;
}

@Component({
  selector: 'app-documentation',
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './documentation-component.html',
  styleUrl: './documentation-component.css'
})
export class DocumentationComponent implements OnInit {
  sections = DOC_SECTIONS;

  viewMode: ViewMode = 'overview';
  currentSection: DocSection | null = null;
  currentPage: DocPage | null = null;

  searchTerm = '';
  searchResults: SearchResult[] = [];

  private allArticles: SearchResult[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildSearchIndex();

    this.route.paramMap.subscribe(params => {
      const sectionId = params.get('sectionId');
      const pageId = params.get('pageId');

      if (!sectionId) {
        this.viewMode = 'overview';
        this.currentSection = null;
        this.currentPage = null;
        return;
      }

      const section = this.sections.find(s => s.id === sectionId) || null;
      if (!section) {
        this.router.navigate(['/docs']);
        return;
      }
      this.currentSection = section;

      if (!pageId) {
        this.viewMode = 'section';
        this.currentPage = null;
        return;
      }

      const page = section.pages.find(p => p.id === pageId) || null;
      if (!page) {
        this.router.navigate(['/docs', section.id]);
        return;
      }

      this.viewMode = 'page';
      this.currentPage = page;
    });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm = target?.value ?? '';
    this.runSearch();
  }

  private buildSearchIndex(): void {
    this.allArticles = [];
    for (const section of this.sections) {
      for (const page of section.pages) {
        for (const article of page.articles) {
          this.allArticles.push({ section, page, article });
        }
      }
    }
  }

  private runSearch(): void {
    const q = this.searchTerm.trim().toLowerCase();
    if (q.length < 2) {
      this.searchResults = [];
      return;
    }

    this.searchResults = this.allArticles.filter(({ section, page, article }) => {
      const haystack = [
        section.title,
        ...(section.tags || []),
        page.title,
        ...(page.tags || []),
        article.title
      ].join(' ').toLowerCase();

      return haystack.includes(q);
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
  }

  onResultClick(): void {
    this.clearSearch();
  }

  get isSearching(): boolean {
    return this.searchTerm.trim().length >= 2;
  }
}