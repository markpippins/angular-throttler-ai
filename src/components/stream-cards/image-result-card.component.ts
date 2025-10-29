import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageSearchResult } from '../../models/image-search-result.model.js';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-image-result-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-result-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageResultCardComponent {
  result = input.required<ImageSearchResult>();
  saveBookmark = output<NewBookmark>();

  onSave(): void {
    const result = this.result();
    this.saveBookmark.emit({
      type: 'image',
      title: result.description,
      link: result.url,
      snippet: `Photo by ${result.photographer}`,
      thumbnailUrl: result.thumbnailUrl,
      source: result.source,
    });
  }
}
