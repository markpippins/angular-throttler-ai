import { Component, ChangeDetectionStrategy, inject, signal, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcademicSearchService } from '../../services/academic-search.service.js';
import { AcademicSearchResult } from '../../models/academic-search-result.model.js';

@Component({
  selector: 'app-academic-search-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './academic-search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademicSearchResultsComponent {
  private academicSearchService = inject(AcademicSearchService);

  initialQuery = input<string | null>(null);
  query = signal('');
  isLoading = signal(false);
  results = signal<AcademicSearchResult[] | null>(null);
  searchError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const newQuery = this.initialQuery();
      if (newQuery) {
        this.query.set(newQuery);
        this.performSearch();
      }
    });
  }

  onQueryChange(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  async performSearch() {
    if (!this.query().trim()) return;

    this.isLoading.set(true);
    this.results.set(null);
    this.searchError.set(null);
    try {
      const searchResults = await this.academicSearchService.search(this.query());
      this.results.set(searchResults);
    } catch (e) {
      console.error('Academic search failed', e);
      this.searchError.set((e as Error).message);
      this.results.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
