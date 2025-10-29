import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcademicSearchResult } from '../../models/academic-search-result.model.js';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-academic-result-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './academic-result-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademicResultCardComponent {
  result = input.required<AcademicSearchResult>();
  saveBookmark = output<NewBookmark>();

  onSave(): void {
    const result = this.result();
    this.saveBookmark.emit({
      type: 'academic',
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      source: result.publication,
    });
  }
}
