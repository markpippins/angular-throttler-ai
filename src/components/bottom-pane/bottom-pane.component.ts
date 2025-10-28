import { Component, ChangeDetectionStrategy, input, output, signal, computed, viewChild, effect, inject } from '@angular/core';
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
import { GoogleSearchService, SearchNotConfiguredError } from '../../services/google-search.service.js';
import { UnsplashService } from '../../services/unsplash.service.js';
import { GeminiService } from '../../services/gemini.service.js';
import { YoutubeSearchService } from '../../services/youtube-search.service.js';
import { AcademicSearchService } from '../../services/academic-search.service.js';
import { GoogleSearchResult } from '../../models/google-search-result.model.js';
import { ImageSearchResult } from '../../models/image-search-result.model.js';
import { YouTubeSearchResult } from '../../models/youtube-search-result.model.js';
import { AcademicSearchResult } from '../../models/academic-search-result.model.js';

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
  
  // --- Injected Services ---
  private googleSearchService = inject(GoogleSearchService);
  private unsplashService = inject(UnsplashService);
  private geminiService = inject(GeminiService);
  private youtubeSearchService = inject(YoutubeSearchService);
  private academicSearchService = inject(AcademicSearchService);

  // --- Web Search State ---
  webQuery = signal('');
  webIsLoading = signal(false);
  webResults = signal<GoogleSearchResult[] | null>(null);
  webSearchError = signal<{ isConfigError: boolean, message: string } | null>(null);
  
  // --- Image Search State ---
  imageQuery = signal('');
  imageIsLoading = signal(false);
  imageResults = signal<ImageSearchResult[] | null>(null);
  imageSearchError = signal<string | null>(null);

  // --- Gemini Search State ---
  geminiQuery = signal('');
  geminiIsLoading = signal(false);
  geminiResult = signal<string | null>(null);
  geminiSearchError = signal<string | null>(null);

  // --- YouTube Search State ---
  youtubeQuery = signal('');
  youtubeIsLoading = signal(false);
  youtubeResults = signal<YouTubeSearchResult[] | null>(null);
  youtubeSearchError = signal<string | null>(null);

  // --- Academic Search State ---
  academicQuery = signal('');
  academicIsLoading = signal(false);
  academicResults = signal<AcademicSearchResult[] | null>(null);
  academicSearchError = signal<string | null>(null);
  
  // --- File Search State ---
  fileSearchQuery = signal('');
  isFileSearchLoading = signal(false);
  internalFileSearchResults = signal<SearchResultNode[] | null>(null);
  fileSearchError = signal<string | null>(null);
  
  displayFileSearchResults = computed(() => this.fileSearchResults() ?? this.internalFileSearchResults());

  private tabControl = viewChild.required(TabControlComponent);

  constructor() {
    // Effect to handle initial tab selection from main search dialog
    effect(() => {
      const request = this.initialTabRequest();
      const tabControl = this.tabControl();
      if (request) {
        let tabIndex = 0;
        switch (request.tab) {
          case 'file': tabIndex = 0; break;
          case 'web': tabIndex = 1; break;
          case 'image': tabIndex = 2; break;
          case 'gemini': tabIndex = 3; break;
          case 'youtube': tabIndex = 4; break;
          case 'academic': tabIndex = 5; break;
        }
        tabControl.setActiveTab(tabIndex);
      }
    });

    // Effects to handle initial queries from main search dialog
    effect(() => {
      const newQuery = this.webSearchQuery();
      if (newQuery) {
        this.webQuery.set(newQuery);
        this.performWebSearch();
      }
    });
    effect(() => {
      const newQuery = this.imageSearchQuery();
      if (newQuery) {
        this.imageQuery.set(newQuery);
        this.performImageSearch();
      }
    });
    effect(() => {
      const newQuery = this.geminiSearchQuery();
      if (newQuery) {
        this.geminiQuery.set(newQuery);
        this.performGeminiSearch();
      }
    });
    effect(() => {
      const newQuery = this.youtubeSearchQuery();
      if (newQuery) {
        this.youtubeQuery.set(newQuery);
        this.performYoutubeSearch();
      }
    });
    effect(() => {
      const newQuery = this.academicSearchQuery();
      if (newQuery) {
        this.academicQuery.set(newQuery);
        this.performAcademicSearch();
      }
    });
  }

  // --- File Search Logic ---
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

  // --- Web Search Logic ---
  onWebQueryChange(event: Event) { this.webQuery.set((event.target as HTMLInputElement).value); }
  async performWebSearch() {
    if (!this.webQuery().trim()) return;
    this.webIsLoading.set(true);
    this.webResults.set(null);
    this.webSearchError.set(null);
    try {
      this.webResults.set(await this.googleSearchService.search(this.webQuery()));
    } catch (e) {
      if (e instanceof SearchNotConfiguredError) {
        this.webSearchError.set({ isConfigError: true, message: 'The web search service is not configured.' });
      } else {
        this.webSearchError.set({ isConfigError: false, message: (e as Error).message });
      }
      this.webResults.set([]);
    } finally {
      this.webIsLoading.set(false);
    }
  }

  // --- Image Search Logic ---
  onImageQueryChange(event: Event) { this.imageQuery.set((event.target as HTMLInputElement).value); }
  async performImageSearch() {
    if (!this.imageQuery().trim()) return;
    this.imageIsLoading.set(true);
    this.imageResults.set(null);
    this.imageSearchError.set(null);
    try {
      this.imageResults.set(await this.unsplashService.search(this.imageQuery()));
    } catch (e) {
      this.imageSearchError.set((e as Error).message);
      this.imageResults.set([]);
    } finally {
      this.imageIsLoading.set(false);
    }
  }

  // --- Gemini Search Logic ---
  onGeminiQueryChange(event: Event) { this.geminiQuery.set((event.target as HTMLTextAreaElement).value); }
  async performGeminiSearch() {
    if (!this.geminiQuery().trim()) return;
    this.geminiIsLoading.set(true);
    this.geminiResult.set(null);
    this.geminiSearchError.set(null);
    try {
      this.geminiResult.set(await this.geminiService.generateContent(this.geminiQuery()));
    } catch (e) {
      this.geminiSearchError.set((e as Error).message);
    } finally {
      this.geminiIsLoading.set(false);
    }
  }

  // --- YouTube Search Logic ---
  onYoutubeQueryChange(event: Event) { this.youtubeQuery.set((event.target as HTMLInputElement).value); }
  async performYoutubeSearch() {
    if (!this.youtubeQuery().trim()) return;
    this.youtubeIsLoading.set(true);
    this.youtubeResults.set(null);
    this.youtubeSearchError.set(null);
    try {
      this.youtubeResults.set(await this.youtubeSearchService.search(this.youtubeQuery()));
    } catch (e) {
      this.youtubeSearchError.set((e as Error).message);
      this.youtubeResults.set([]);
    } finally {
      this.youtubeIsLoading.set(false);
    }
  }

  // --- Academic Search Logic ---
  onAcademicQueryChange(event: Event) { this.academicQuery.set((event.target as HTMLInputElement).value); }
  async performAcademicSearch() {
    if (!this.academicQuery().trim()) return;
    this.academicIsLoading.set(true);
    this.academicResults.set(null);
    this.academicSearchError.set(null);
    try {
      this.academicResults.set(await this.academicSearchService.search(this.academicQuery()));
    } catch (e) {
      this.academicSearchError.set((e as Error).message);
      this.academicResults.set([]);
    } finally {
      this.academicIsLoading.set(false);
    }
  }
}
