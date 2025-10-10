import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

interface SearchResult {
  title: string;
  snippet: string;
  link: string;
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

  onQueryChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.query.set(value);
  }

  search(): void {
    if (!this.query().trim()) {
      return;
    }

    this.isLoading.set(true);
    this.results.set(null); // Clear previous results

    // Simulate network delay
    setTimeout(() => {
      this.results.set([
        {
          title: 'Angular Best Practices',
          snippet: 'A comprehensive guide to writing better Angular applications.',
          link: '#',
        },
        {
          title: 'Tailwind CSS for Modern UI',
          snippet: 'Learn how to build beautiful, responsive layouts with Tailwind.',
          link: '#',
        },
        {
          title: 'Signal-based State Management',
          snippet: 'Exploring the new paradigm for state management in web frameworks.',
          link: '#',
        },
      ]);
      this.isLoading.set(false);
    }, 1000);
  }
}
