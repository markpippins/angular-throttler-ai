
import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewBookmark } from '../../models/bookmark.model.js';

interface GeminiResult {
  query: string;
  text: string;
}

@Component({
  selector: 'app-gemini-result-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gemini-result-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeminiResultCardComponent {
  result = input.required<GeminiResult>();
  saveBookmark = output<NewBookmark>();

  truncatedText = computed(() => {
    const text = this.result().text;
    if (text.length > 140) {
        return text.slice(0, 140) + '...';
    }
    return text;
  });

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
