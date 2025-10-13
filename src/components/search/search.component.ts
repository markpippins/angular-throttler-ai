import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

interface SearchResult {
  title: string;
  snippet: string;
}

@Component({
  selector: 'app-search',
  template: `
<div class="p-4 space-y-4 h-full flex flex-col text-sm">
  <div class="flex flex-col space-y-2">
    <textarea 
      [value]="query()" 
      (input)="onQueryChange($event)"
      rows="3" 
      placeholder="Search all files (mock)..."
      class="w-full text-sm p-2 rounded-md border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] focus:ring-2 focus:ring-[rgb(var(--color-accent-ring))] focus:border-[rgb(var(--color-accent-ring))] transition-colors"
    ></textarea>
    <button 
      (click)="search()" 
      [disabled]="!query().trim() || isLoading()"
      class="w-full px-4 py-2 bg-[rgb(var(--color-accent-solid-bg))] text-[rgb(var(--color-text-inverted))] rounded-md hover:bg-[rgb(var(--color-accent-solid-bg-hover))] disabled:bg-[rgb(var(--color-disabled-bg))] disabled:cursor-not-allowed transition-colors font-semibold text-sm"
    >
      @if (isLoading()) {
        <div class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Searching...</span>
        </div>
      } @else {
        <span>Search</span>
      }
    </button>
  </div>

  <div class="flex-1 overflow-y-auto pt-4 mt-2 border-t border-[rgb(var(--color-border-base))]">
    @if (isLoading()) {
      <div class="text-center py-4 text-[rgb(var(--color-text-subtle))]">
        <p>Searching for results...</p>
      </div>
    } @else if (error(); as err) {
      <div class="p-3 bg-red-100 text-red-800 rounded-lg text-center">
        <p class="font-semibold">Search Failed</p>
        <p class="text-xs mt-1">{{ err }}</p>
      </div>
    } @else if (results(); as res) {
      @if (res.length > 0) {
        <div class="space-y-3">
          @for (result of res; track result.title) {
            <div class="p-3 bg-[rgb(var(--color-surface))] rounded-lg shadow-sm border border-[rgb(var(--color-border-base))]">
              <h3 class="font-semibold text-[rgb(var(--color-accent-text))]">{{ result.title }}</h3>
              <p class="text-[rgb(var(--color-text-muted))] mt-1 text-xs">{{ result.snippet }}</p>
            </div>
          }
        </div>
      } @else {
        <div class="text-center py-4 text-[rgb(var(--color-text-subtle))]">
          <p>No results found.</p>
        </div>
      }
    } @else {
      <div class="text-center py-4 text-[rgb(var(--color-text-subtle))]">
        <p>Enter a query and click Search to begin.</p>
      </div>
    }
  </div>
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent {
  query = signal('');
  isLoading = signal(false);
  results = signal<SearchResult[] | null>(null);
  error = signal<string | null>(null);

  onQueryChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.query.set(value);
  }

  search(): void {
    if (!this.query().trim()) {
      return;
    }

    this.isLoading.set(true);
    this.results.set(null);
    this.error.set(null);

    // Simulate an API call
    setTimeout(() => {
      this.results.set([
        {
          title: 'Annual Report 2023.docx',
          snippet: '...contains the quarterly financial results and projections...'
        },
        {
          title: 'Project Phoenix - Kickoff.pptx',
          snippet: '...outlining project goals, timeline, and key stakeholders...'
        },
        {
          title: 'Q3 Marketing Budget.xlsx',
          snippet: '...detailed breakdown of marketing spend for the third quarter...'
        },
      ]);
      this.isLoading.set(false);
    }, 1200);
  }
}
