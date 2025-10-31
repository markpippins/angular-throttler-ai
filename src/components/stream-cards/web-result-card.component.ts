import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleSearchResult } from '../../models/google-search-result.model.js';

@Component({
  selector: 'app-web-result-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './web-result-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebResultCardComponent {
  result = input.required<GoogleSearchResult>();
  isBookmarked = input(false);
  bookmarkToggled = output<GoogleSearchResult>();

  onToggleBookmark(): void {
    this.bookmarkToggled.emit(this.result());
  }
}
