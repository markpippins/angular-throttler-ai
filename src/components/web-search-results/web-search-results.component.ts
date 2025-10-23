import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleSearchService, SearchNotConfiguredError } from '../../services/google-search.service.js';
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
  searchError = signal<{ isConfigError: boolean, message: string } | null>(null);

  onQueryChange(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  async performSearch() {
    if (!this.query().trim()) return;

    this.isLoading.set(true);
    this.results.set(null);
    this.searchError.set(null); // Reset error on new search
    try {
      const searchResults = await this.googleSearchService.search(this.query());
      this.results.set(searchResults);
    } catch (e) {
      console.error('Web search failed', e);
      if (e instanceof SearchNotConfiguredError) {
        this.searchError.set({ isConfigError: true, message: 'The web search service is not configured.' });
      } else {
        this.searchError.set({ isConfigError: false, message: (e as Error).message });
      }
      this.results.set([]); // Set to empty array to clear previous results.
    } finally {
      this.isLoading.set(false);
    }
  }
}
