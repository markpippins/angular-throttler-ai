import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcademicSearchResult } from '../../models/academic-search-result.model.js';

@Component({
  selector: 'app-academic-result-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './academic-result-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademicResultCardComponent {
  result = input.required<AcademicSearchResult>();
  isBookmarked = input(false);
  bookmarkToggled = output<AcademicSearchResult>();

  onToggleBookmark(): void {
    this.bookmarkToggled.emit(this.result());
  }
}
