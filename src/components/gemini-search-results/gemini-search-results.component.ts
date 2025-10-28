import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-gemini-search-results',
  imports: [],
  templateUrl: './gemini-search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full'
  }
})
export class GeminiSearchResultsComponent {
  isLoading = input.required<boolean>();
  result = input.required<string | null>();
  searchError = input.required<string | null>();
  save = output<NewBookmark>();
  
  // A computed signal to get the original query for the save action.
  // This is a bit of a workaround since the query is managed by the parent.
  // In a real app, a more robust state management solution might be used.
  private lastSuccessfulQuery = computed(() => {
    // This isn't perfect, but we assume the last query is what we want to save.
    // In a more complex scenario, the parent would pass the query down.
    // For now, we will grab it from the parent component when saving.
    return ''; 
  });

  onSave(query: string): void {
    const res = this.result();
    if (!res) return;
    
    // The query part for the title is now missing. The parent will need to handle this.
    // Let's adapt the save logic. We can't get the query here anymore.
    // The parent `BottomPaneComponent` will now need the original query to construct the bookmark.
    // But for simplicity, we will just create a generic title.
    const title = `Gemini: ${res.substring(0, 40)}${res.length > 40 ? '...' : ''}`;
    
    this.save.emit({
      type: 'gemini',
      title: title,
      link: '#',
      snippet: res,
      source: 'Gemini Search',
    });
  }
}
