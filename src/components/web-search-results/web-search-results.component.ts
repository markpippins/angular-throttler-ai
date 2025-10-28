import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { GoogleSearchResult } from '../../models/google-search-result.model.js';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-web-search-results',
  imports: [],
  templateUrl: './web-search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full'
  }
})
export class WebSearchResultsComponent {
  isLoading = input.required<boolean>();
  results = input.required<GoogleSearchResult[] | null>();
  searchError = input.required<{ isConfigError: boolean, message: string } | null>();
  save = output<NewBookmark>();
  
  onSave(result: GoogleSearchResult): void {
    this.save.emit({
      type: 'web',
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      source: 'Web Search',
    });
  }
}
