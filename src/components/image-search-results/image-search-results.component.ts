import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnsplashService } from '../../services/unsplash.service.js';
import { ImageSearchResult } from '../../models/image-search-result.model.js';

@Component({
  selector: 'app-image-search-results',
  imports: [CommonModule],
  templateUrl: './image-search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageSearchResultsComponent {
  private unsplashService = inject(UnsplashService);

  query = signal('');
  isLoading = signal(false);
  results = signal<ImageSearchResult[] | null>(null);

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
}
