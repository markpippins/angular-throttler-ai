import { Component, ChangeDetectionStrategy, inject, signal, input, effect, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnsplashService } from '../../services/unsplash.service.js';
import { ImageSearchResult } from '../../models/image-search-result.model.js';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-image-search-results',
  imports: [CommonModule],
  templateUrl: './image-search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageSearchResultsComponent {
  private unsplashService = inject(UnsplashService);

  initialQuery = input<string | null>(null);
  save = output<NewBookmark>();

  query = signal('');
  isLoading = signal(false);
  results = signal<ImageSearchResult[] | null>(null);

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
    try {
      const searchResults = await this.unsplashService.search(this.query());
      this.results.set(searchResults);
    } catch (e) {
      console.error('Image search failed', e);
      this.results.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  onSave(result: ImageSearchResult): void {
    this.save.emit({
      type: 'image',
      title: result.description || result.alt_description || 'Untitled Image',
      link: result.urls.regular,
      snippet: `Photo by ${result.user.name}`,
      thumbnailUrl: result.urls.thumb,
      source: 'Image Search',
    });
  }
}
