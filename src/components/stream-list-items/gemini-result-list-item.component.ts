import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewBookmark } from '../../models/bookmark.model.js';

interface GeminiResult {
  query: string;
  text: string;
}

@Component({
  selector: 'app-gemini-result-list-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gemini-result-list-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeminiResultListItemComponent {
  result = input.required<GeminiResult>();
  saveBookmark = output<NewBookmark>();

  onSave(): void {
    const result = this.result();
    this.saveBookmark.emit({
      type: 'gemini',
      title: `Gemini response for: ${result.query}`,
      link: '#',
      snippet: result.text,
      source: 'Gemini Search',
    });
  }
}
