import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ImageSearchResult } from '../../models/image-search-result.model.js';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-image-search-results',
  imports: [],
  templateUrl: './image-search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full'
  }
})
export class ImageSearchResultsComponent {
  isLoading = input.required<boolean>();
  results = input.required<ImageSearchResult[] | null>();
  save = output<NewBookmark>();

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
