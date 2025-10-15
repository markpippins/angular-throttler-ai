import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service.js';

@Component({
  selector: 'app-gemini-search-results',
  imports: [CommonModule],
  templateUrl: './gemini-search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeminiSearchResultsComponent {
  private geminiService = inject(GeminiService);

  query = signal('');
  isLoading = signal(false);
  result = signal<string | null>(null);
  searchError = signal<string | null>(null);

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
}
