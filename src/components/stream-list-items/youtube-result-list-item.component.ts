import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YoutubeSearchResult } from '../../models/youtube-search-result.model.js';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-youtube-result-list-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './youtube-result-list-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YoutubeResultListItemComponent {
  result = input.required<YoutubeSearchResult>();
  saveBookmark = output<NewBookmark>();

  onSave(): void {
    const result = this.result();
    this.saveBookmark.emit({
      type: 'youtube',
      title: result.title,
      link: `https://www.youtube.com/watch?v=${result.videoId}`,
      snippet: result.description,
      thumbnailUrl: result.thumbnailUrl,
      source: result.channelTitle,
    });
  }
}
