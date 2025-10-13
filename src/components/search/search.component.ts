import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

interface SearchResult {
  title: string;
  snippet: string;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
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