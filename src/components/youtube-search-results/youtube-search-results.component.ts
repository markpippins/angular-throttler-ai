import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { YouTubeSearchResult } from '../../models/youtube-search-result.model.js';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-youtube-search-results',
  imports: [],
  templateUrl: './youtube-search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full'
  }
})
export class YoutubeSearchResultsComponent {
  isLoading = input.required<boolean>();
  results = input.required<YouTubeSearchResult[] | null>();
  searchError = input.required<string | null>();
  save = output<NewBookmark>();

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
