import { Component, ChangeDetectionStrategy, input, output, signal, computed, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabControlComponent } from '../tabs/tab-control.component.js';
import { TabComponent } from '../tabs/tab.component.js';
import { WebSearchResultsComponent } from '../web-search-results/web-search-results.component.js';
import { ImageSearchResultsComponent } from '../image-search-results/image-search-results.component.js';
import { GeminiSearchResultsComponent } from '../gemini-search-results/gemini-search-results.component.js';
import { YoutubeSearchResultsComponent } from '../youtube-search-results/youtube-search-results.component.js';
import { AcademicSearchResultsComponent } from '../academic-search-results/academic-search-results.component.js';
import { SearchResultsComponent } from '../search-results/search-results.component.js';
import { SearchResultNode } from '../../models/file-system.model.js';
import { ImageService } from '../../services/image.service.js';
import { NewBookmark } from '../../models/bookmark.model.js';
import { FileSystemProvider } from '../../services/file-system-provider.js';

@Component({
  selector: 'app-bottom-pane',
  imports: [
    CommonModule,
    TabControlComponent,
    TabComponent,
    WebSearchResultsComponent,
    ImageSearchResultsComponent,
    GeminiSearchResultsComponent,
    YoutubeSearchResultsComponent,
    AcademicSearchResultsComponent,
    SearchResultsComponent,
  ],
  templateUrl: './bottom-pane.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomPaneComponent {
  // Inputs for externally triggered searches
  webSearchQuery = input<string | null>(null);
  imageSearchQuery = input<string | null>(null);
  geminiSearchQuery = input<string | null>(null);
  youtubeSearchQuery = input<string | null>(null);
  academicSearchQuery = input<string | null>(null);
  fileSearchResults = input<SearchResultNode[] | null>(null);
  initialTabRequest = input<{ tab: string | undefined; timestamp: number } | undefined>();
  
  // Inputs for services/context
  imageService = input.required<ImageService>();
  activeProvider = input<FileSystemProvider>();

  saveBookmark = output<NewBookmark>();

  // Internal state for self-initiated file search
  fileSearchQuery = signal('');
  isFileSearchLoading = signal(false);
  internalFileSearchResults = signal<SearchResultNode[] | null>(null);
  fileSearchError = signal<string | null>(null);
  
  // Displayed results are either from external trigger or internal search
  displayFileSearchResults = computed(() => this.fileSearchResults() ?? this.internalFileSearchResults());

  private tabControl = viewChild.required(TabControlComponent);

  constructor() {
    console.log('BottomPaneComponent constructor: Initializing.');
    effect(() => {
      const request = this.initialTabRequest();
      // Reading the signal here establishes a dependency. When the viewChild is resolved,
      // the effect will re-run.
      const tabControl = this.tabControl();
      if (request) {
        let tabIndex = 0;
        switch (request.tab) {
          case 'web': tabIndex = 1; break;
          case 'image': tabIndex = 2; break;
          case 'gemini': tabIndex = 3; break;
          case 'youtube': tabIndex = 4; break;
          case 'academic': tabIndex = 5; break;
        }
        tabControl.setActiveTab(tabIndex);
      }
    });
  }

  onFileQueryChange(event: Event) {
    this.fileSearchQuery.set((event.target as HTMLInputElement).value);
  }

  async performFileSearch() {
    const provider = this.activeProvider();
    if (!this.fileSearchQuery().trim() || !provider) return;

    this.isFileSearchLoading.set(true);
    this.internalFileSearchResults.set(null);
    this.fileSearchError.set(null);
    try {
      const searchResults = await provider.search(this.fileSearchQuery());
      this.internalFileSearchResults.set(searchResults);
    } catch (e) {
      this.fileSearchError.set((e as Error).message);
    } finally {
      this.isFileSearchLoading.set(false);
    }
  }
}
