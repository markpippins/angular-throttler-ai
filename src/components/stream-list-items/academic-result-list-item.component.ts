import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcademicSearchResult } from '../../models/academic-search-result.model.js';

@Component({
  selector: 'app-academic-result-list-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './academic-result-list-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademicResultListItemComponent {
  result = input.required<AcademicSearchResult>();
  isBookmarked = input(false);
  bookmarkToggled = output<AcademicSearchResult>();

  onToggleBookmark(): void {
    this.bookmarkToggled.emit(this.result());
  }
}
