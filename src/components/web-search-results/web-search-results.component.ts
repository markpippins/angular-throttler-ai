import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleSearchService } from '../../services/google-search.service.js';
import { GoogleSearchResult } from '../../models/google-search-result.model.js';

@Component({
  selector: 'app-web-search-results',
  imports: [CommonModule],
  templateUrl: './web-search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebSearchResultsComponent {
  private googleSearchService = inject(GoogleSearchService);

  query = signal('');
  isLoading = signal(false);
  results = signal<GoogleSearchResult[] | null>(null);

  onQueryChange(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  async performSearch() {
    if (!this.query().trim()) return;

    this.isLoading.set(true);
    this.results.set(null);
    try {
      const searchResults = await this.googleSearchService.search(this.query());
      this.results.set(searchResults);
    } catch (e) {
      console.error('Web search failed', e);
      this.results.set([]); // Show empty state on error
    } finally {
      this.isLoading.set(false);
    }
  }
}
