import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { AcademicSearchResult } from '../../models/academic-search-result.model.js';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-academic-search-results',
  imports: [],
  templateUrl: './academic-search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full'
  }
})
export class AcademicSearchResultsComponent {
  isLoading = input.required<boolean>();
  results = input.required<AcademicSearchResult[] | null>();
  searchError = input.required<string | null>();
  save = output<NewBookmark>();

  onSave(result: AcademicSearchResult): void {
    this.save.emit({
      type: 'academic',
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      source: 'Academic Search',
    });
  }
}
