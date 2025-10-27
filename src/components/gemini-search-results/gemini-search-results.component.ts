import { Component, ChangeDetectionStrategy, inject, signal, input, effect, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service.js';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-gemini-search-results',
  imports: [CommonModule],
  templateUrl: './gemini-search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeminiSearchResultsComponent {
  private geminiService = inject(GeminiService);

  initialQuery = input<string | null>(null);
  save = output<NewBookmark>();

  query = signal('');
  isLoading = signal(false);
  result = signal<string | null>(null);
  searchError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const newQuery = this.initialQuery();
      if (newQuery) {
        this.query.set(newQuery);
        this.performSearch();
      }
    });
  }

  onQueryChange(event: Event) {
    this.query.set((event.target as HTMLTextAreaElement).value);
  }

  async performSearch() {
    if (!this.query().trim()) return;

    this.isLoading.set(true);
    this.result.set(null);
    this.searchError.set(null);

    try {
      const searchResult = await this.geminiService.generateContent(this.query());
      this.result.set(searchResult);
    } catch (e) {
      this.searchError.set((e as Error).message);
    } finally {
      this.isLoading.set(false);
    }
  }

  onSave(): void {
    const res = this.result();
    const q = this.query();
    if (!res || !q) return;
    
    this.save.emit({
      type: 'gemini',
      title: `Gemini: ${q.substring(0, 40)}${q.length > 40 ? '...' : ''}`,
      link: '#',
      snippet: res,
      source: 'Gemini Search',
    });
  }
}
