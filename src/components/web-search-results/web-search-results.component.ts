import { Component, ChangeDetectionStrategy, inject, signal, input, effect, output } from '@angular/core';
import { GoogleSearchService, SearchNotConfiguredError } from '../../services/google-search.service.js';
import { GoogleSearchResult } from '../../models/google-search-result.model.js';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-web-search-results',
  imports: [],
  templateUrl: './web-search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full'
  }
})
export class WebSearchResultsComponent {
  private googleSearchService = inject(GoogleSearchService);

  initialQuery = input<string | null>(null);
  save = output<NewBookmark>();

  query = signal('');
  isLoading = signal(false);
  results = signal<GoogleSearchResult[] | null>(null);
  searchError = signal<{ isConfigError: boolean, message: string } | null>(null);

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
  
  onSave(result: GoogleSearchResult): void {
    this.save.emit({
      type: 'web',
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      source: 'Web Search',
    });
  }
}
