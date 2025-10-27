import { Component, ChangeDetectionStrategy, inject, signal, input, effect, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YoutubeSearchService } from '../../services/youtube-search.service.js';
import { YouTubeSearchResult } from '../../models/youtube-search-result.model.js';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-youtube-search-results',
  imports: [CommonModule],
  templateUrl: './youtube-search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full'
  }
})
export class YoutubeSearchResultsComponent {
  private youtubeSearchService = inject(YoutubeSearchService);

  initialQuery = input<string | null>(null);
  save = output<NewBookmark>();

  query = signal('');
  isLoading = signal(false);
  results = signal<YouTubeSearchResult[] | null>(null);
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
      const searchResults = await this.youtubeSearchService.search(this.query());
      this.results.set(searchResults);
    } catch (e) {
      console.error('YouTube search failed', e);
      this.searchError.set((e as Error).message);
      this.results.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  onSave(result: YouTubeSearchResult): void {
    this.save.emit({
      type: 'youtube',
      title: result.title,
      link: `https://www.youtube.com/watch?v=${result.id}`,
      snippet: result.description,
      thumbnailUrl: result.thumbnailUrl,
      source: 'YouTube Search',
    });
  }
}
