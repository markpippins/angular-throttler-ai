import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageSearchResult } from '../../models/image-search-result.model.js';

@Component({
  selector: 'app-image-result-list-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-result-list-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageResultListItemComponent {
  result = input.required<ImageSearchResult>();
  isBookmarked = input(false);
  bookmarkToggled = output<ImageSearchResult>();

  onToggleBookmark(): void {
    this.bookmarkToggled.emit(this.result());
  }

  openLink(event: MouseEvent): void {
    event.preventDefault();
    window.open(this.result().url, '_blank', 'noopener,noreferrer');
  }
}
