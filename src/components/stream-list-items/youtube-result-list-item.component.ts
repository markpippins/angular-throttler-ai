import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YoutubeSearchResult } from '../../models/youtube-search-result.model.js';

@Component({
  selector: 'app-youtube-result-list-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './youtube-result-list-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YoutubeResultListItemComponent {
  result = input.required<YoutubeSearchResult>();
  isBookmarked = input(false);
  bookmarkToggled = output<YoutubeSearchResult>();

  onToggleBookmark(): void {
    this.bookmarkToggled.emit(this.result());
  }
}
