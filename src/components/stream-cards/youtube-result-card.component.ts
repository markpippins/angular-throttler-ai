import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YoutubeSearchResult } from '../../models/youtube-search-result.model.js';

@Component({
  selector: 'app-youtube-result-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './youtube-result-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YoutubeResultCardComponent {
  result = input.required<YoutubeSearchResult>();
  isBookmarked = input(false);
  bookmarkToggled = output<YoutubeSearchResult>();

  onToggleBookmark(): void {
    this.bookmarkToggled.emit(this.result());
  }
}
