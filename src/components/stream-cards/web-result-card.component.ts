import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleSearchResult } from '../../models/google-search-result.model.js';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-web-result-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './web-result-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebResultCardComponent {
  result = input.required<GoogleSearchResult>();
  saveBookmark = output<NewBookmark>();

  onSave(): void {
    const result = this.result();
    this.saveBookmark.emit({
      type: 'web',
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      source: result.source,
    });
  }
}
