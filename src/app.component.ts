import { Component, ChangeDetectionStrategy, signal, computed, inject, effect, Renderer2, ElementRef, OnDestroy, Injector, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FileExplorerComponent } from './components/file-explorer/file-explorer.component.js';
import { SidebarComponent } from './components/sidebar/sidebar.component.js';
import { FileSystemNode } from './models/file-system.model.js';
import { FileSystemProvider, ItemReference } from './services/file-system-provider.js';
import { ServerProfilesDialogComponent } from './components/server-profiles-dialog/server-profiles-dialog.component.js';
import { ServerProfileService } from './services/server-profile.service.js';
import { DetailPaneComponent } from './components/detail-pane/detail-pane.component.js';
import { SessionService } from './services/in-memory-file-system.service.js';
import { ServerProfile } from './models/server-profile.model.js';
import { RemoteFileSystemService } from './services/remote-file-system.service.js';
import { FsService } from './services/fs.service.js';
import { ImageService } from './services/image.service.js';
import { ImageClientService } from './services/image-client.service.js';
import { LoginService } from './services/login.service.js';
import { User } from './models/user.model.js';
import { PreferencesService } from './services/preferences.service.js';
import { DragDropPayload } from './services/drag-drop.service.js';
import { ToolbarComponent, SortCriteria } from './components/toolbar/toolbar.component.js';
import { ClipboardService } from './services/clipboard.service.js';
import { BookmarkService } from './services/bookmark.service.js';
import { NewBookmark, Bookmark } from './models/bookmark.model.js';
import { ToastsComponent } from './components/toasts/toasts.component.js';
import { ToastService } from './services/toast.service.js';
import { WebviewDialogComponent } from './components/webview-dialog/webview-dialog.component.js';
import { WebviewService } from './services/webview.service.js';
import { LocalConfigDialogComponent } from './components/local-config-dialog/local-config-dialog.component.js';
import { LocalConfig, LocalConfigService } from './services/local-config.service.js';
import { LoginDialogComponent } from './components/login-dialog/login-dialog.component.js';
import { Theme, UiPreferences, UiPreferencesService } from './services/ui-preferences.service.js';
import { RssFeedsDialogComponent } from './components/rss-feeds-dialog/rss-feeds-dialog.component.js';
import { ImportDialogComponent } from './components/import-dialog/import-dialog.component.js';
import { ExportDialogComponent } from './components/export-dialog/export-dialog.component.js';
import { FolderPropertiesService } from './services/folder-properties.service.js';
import { TextEditorService } from './services/note-dialog.service.js';
import { TextEditorDialogComponent } from './components/note-view-dialog/note-view-dialog.component.js';
import { DbService } from './services/db.service.js';
import { GoogleSearchService, GoogleSearchParams } from './services/google-search.service.js';
import { UnsplashService } from './services/unsplash.service.js';
import { GeminiService, GeminiSearchParams } from './services/gemini.service.js';
import { YoutubeSearchService } from './services/youtube-search.service.js';
import { AcademicSearchService } from './services/academic-search.service.js';
import { GoogleSearchResult } from './models/google-search-result.model.js';
import { ImageSearchResult } from './models/image-search-result.model.js';
import { YoutubeSearchResult } from './models/youtube-search-result.model.js';
import { AcademicSearchResult } from './models/academic-search-result.model.js';
import { WebResultCardComponent } from './components/stream-cards/web-result-card.component.js';
import { ImageResultCardComponent } from './components/stream-cards/image-result-card.component.js';
import { GeminiResultCardComponent } from './components/stream-cards/gemini-result-card.component.js';
import { YoutubeResultCardComponent } from './components/stream-cards/youtube-result-card.component.js';
import { AcademicResultCardComponent } from './components/stream-cards/academic-result-card.component.js';
import { WebResultListItemComponent } from './components/stream-list-items/web-result-list-item.component.js';
import { ImageResultListItemComponent } from './components/stream-list-items/image-result-list-item.component.js';
import { GeminiResultListItemComponent } from './components/stream-list-items/gemini-result-list-item.component.js';
import { YoutubeResultListItemComponent } from './components/stream-list-items/youtube-result-list-item.component.js';
import { AcademicResultListItemComponent } from './components/stream-list-items/academic-result-list-item.component.js';
import { PreferencesDialogComponent } from './components/preferences-dialog/preferences-dialog.component.js';
import { TerminalComponent } from './components/terminal/terminal.component.js';
import { NotesService } from './services/notes.service.js';
import { ComplexSearchDialogComponent } from './components/complex-search-dialog/complex-search-dialog.component.js';
import { ComplexSearchParams } from './components/complex-search/complex-search.component.js';
import { HealthCheckService } from './services/health-check.service.js';
import { GeminiSearchDialogComponent } from './components/gemini-search-dialog/gemini-search-dialog.component.js';

interface PanePath {
  id: number;
  path: string[];
}
interface PaneStatus {
  selectedItemsCount: number;
  totalItemsCount: number;
  filteredItemsCount: number | null;
}
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

// Type definitions for items in the unified stream
type GeminiResult = { query: string; text: string; publishedAt: string; };

type StreamItem = 
  | (GoogleSearchResult & { type: 'web' })
  | (ImageSearchResult & { type: 'image' })
  | (YoutubeSearchResult & { type: 'youtube' })
  | (AcademicSearchResult & { type: 'academic' })
  | (GeminiResult & { type: 'gemini' });

type StreamItemType = 'web' | 'image' | 'youtube' | 'academic' | 'gemini';
type StreamSortKey = 'relevance' | 'title' | 'source' | 'date';
interface StreamSortCriteria {
  key: StreamSortKey;
  direction: 'asc' | 'desc';
}

const readOnlyProviderOps = {
  createDirectory: () => Promise.reject(new Error('Operation not supported.')),
  removeDirectory: () => Promise.reject(new Error('Operation not supported.')),
  createFile: () => Promise.reject(new Error('Operation not supported.')),
  deleteFile: () => Promise.reject(new Error('Operation not supported.')),
  rename: () => Promise.reject(new Error('Operation not supported.')),
  uploadFile: () => Promise.reject(new Error('Operation not supported.')),
  move: () => Promise.reject(new Error('Operation not supported.')),
  copy: () => Promise.reject(new Error('Operation not supported.')),
  importTree: () => Promise.reject(new Error('Operation not supported.')),
  getFileContent: () => Promise.reject(new Error('Operation not supported.')),
  saveFileContent: () => Promise.reject(new Error('Operation not supported.')),
  hasFile: (path: string[], filename: string) => Promise.resolve(false),
  hasFolder: () => Promise.resolve(false),
};

const disconnectedProvider: FileSystemProvider = {
  getContents: () => Promise.resolve([]),
  getFolderTree: () => Promise.reject(new Error('Server is disconnected.')),
  ...readOnlyProviderOps,
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FileExplorerComponent, SidebarComponent, ServerProfilesDialogComponent, DetailPaneComponent, ToolbarComponent, ToastsComponent, WebviewDialogComponent, LocalConfigDialogComponent, LoginDialogComponent, RssFeedsDialogComponent, ImportDialogComponent, ExportDialogComponent, TextEditorDialogComponent, WebResultCardComponent, ImageResultCardComponent, GeminiResultCardComponent, YoutubeResultCardComponent, AcademicResultCardComponent, WebResultListItemComponent, ImageResultListItemComponent, GeminiResultListItemComponent, YoutubeResultListItemComponent, AcademicResultListItemComponent, PreferencesDialogComponent, TerminalComponent, ComplexSearchDialogComponent, GeminiSearchDialogComponent],
  host: {
    '(document:keydown)': 'onKeyDown($event)',
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class AppComponent implements OnInit, OnDestroy {
  private sessionFs = inject(SessionService);
  private profileService = inject(ServerProfileService);
  private localConfigService = inject(LocalConfigService);
  private fsService = inject(FsService);
  private imageClientService = inject(ImageClientService);
  private loginService = inject(LoginService);
  private preferencesService = inject(PreferencesService);
  private clipboardService = inject(ClipboardService);
  private bookmarkService = inject(BookmarkService);
  private toastService = inject(ToastService);
  private webviewService = inject(WebviewService);
  private textEditorService = inject(TextEditorService);
  private folderPropertiesService = inject(FolderPropertiesService);
  private injector = inject(Injector);
  private document: Document = inject(DOCUMENT);
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);
  private dbService = inject(DbService);
  private uiPreferencesService = inject(UiPreferencesService);
  private homeProvider: FileSystemProvider;
  private googleSearchService = inject(GoogleSearchService);
  private unsplashService = inject(UnsplashService);
  private geminiService = inject(GeminiService);
  private youtubeSearchService = inject(YoutubeSearchService);
  private academicSearchService = inject(AcademicSearchService);
  private notesService = inject(NotesService);
  private healthCheckService = inject(HealthCheckService);

  private initialAutoConnectAttempted = false;

  // --- State Management ---
  isSplitView = signal(false);
  activePaneId = signal(1);
  folderTree = signal<FileSystemNode | null>(null);
  isServerProfilesDialogOpen = signal(false);
  isLocalConfigDialogOpen = signal(false);
  isRssFeedsDialogOpen = signal(false);
  isImportDialogOpen = signal(false);
  isExportDialogOpen = signal(false);
  isPreferencesDialogOpen = signal(false);
  isComplexSearchDialogOpen = signal(false);
  isGeminiSearchDialogOpen = signal(false);
  selectedDetailItem = signal<FileSystemNode | null>(null);
  connectionStatus = signal<ConnectionStatus>('disconnected');
  refreshPanes = signal(0);
  
  // --- Pane Visibility State (from service) ---
  isSidebarVisible = this.uiPreferencesService.isSidebarVisible;
  isTreeVisible = this.uiPreferencesService.isTreeVisible;
  isChatVisible = this.uiPreferencesService.isChatVisible;
  isNotesVisible = this.uiPreferencesService.isNotesVisible;
  isDetailPaneOpen = this.uiPreferencesService.isDetailPaneOpen;
  isSavedItemsVisible = this.uiPreferencesService.isSavedItemsVisible;
  isRssFeedVisible = this.uiPreferencesService.isRssFeedVisible;
  isStreamVisible = this.uiPreferencesService.isStreamVisible;
  isConsoleCollapsed = this.uiPreferencesService.isConsoleCollapsed;
  isStreamPaneCollapsed = this.uiPreferencesService.isStreamPaneCollapsed;
  
  // Keep track of each pane's path
  panePaths = signal<PanePath[]>([{ id: 1, path: [] }]);

  // --- Dialog Control State ---
  profileForLogin = signal<ServerProfile | null>(null);
  profileForEdit = signal<ServerProfile | null>(null);

  // --- Mounted Profile State ---
  mountedProfiles = signal<ServerProfile[]>([]);
  mountedProfileUsers = signal<Map<string, User>>(new Map());
  mountedProfileTokens = signal<Map<string, string>>(new Map());
  mountedProfileIds = computed(() => this.mountedProfiles().map(p => p.id));
  private remoteProviders = signal<Map<string, RemoteFileSystemService>>(new Map());
  private remoteImageServices = signal<Map<string, ImageService>>(new Map());
  
  // --- Status Bar State ---
  pane1Status = signal<PaneStatus>({ selectedItemsCount: 0, totalItemsCount: 0, filteredItemsCount: null });
  pane2Status = signal<PaneStatus>({ selectedItemsCount: 0, totalItemsCount: 0, filteredItemsCount: null });
  
  activePaneStatus = computed<PaneStatus>(() => {
    const activeId = this.activePaneId();
    if (activeId === 1) {
      return this.pane1Status();
    }
    return this.pane2Status();
  });
  
  statusBarSelectionInfo = computed(() => {
    const item = this.selectedDetailItem();
    if (!item) {
        return 'Ready';
    }

    if (item.isServerRoot) {
        const profile = this.profileService.profiles().find(p => p.name === item.name);
        if (profile) {
            return `Server Profile: ${profile.name} | Broker: ${profile.brokerUrl}`;
        }
    }
    
    const itemType = item.type.charAt(0).toUpperCase() + item.type.slice(1);
    return `${itemType}: ${item.name} | Modified: ${item.modified ? new Date(item.modified).toLocaleString() : 'N/A'}`;
  });

  statusBarItemCounts = computed(() => {
    const status = this.activePaneStatus();
    let message = `${status.totalItemsCount} items`;

    if (status.filteredItemsCount !== null) {
        message = `${status.filteredItemsCount} of ${status.totalItemsCount} items`;
    }

    if (status.selectedItemsCount > 0) {
      message += ` | ${status.selectedItemsCount} selected`;
    }
    return message;
  });

  // --- Pane Path & Provider Management ---
  pane1Path = computed(() => this.panePaths().find(p => p.id === 1)?.path ?? []);
  pane2Path = computed(() => this.panePaths().find(p => p.id === 2)?.path ?? []);
  activePanePath = computed(() => this.activePaneId() === 1 ? this.pane1Path() : this.pane2Path());
  activeRootName = computed(() => this.activePanePath()[0] ?? this.localConfigService.sessionName());

  // Derive display path (without server/session name) for address bar
  activeDisplayPath = computed(() => {
    const path = this.activePanePath();
    return path.length > 1 ? path.slice(1) : [];
  });
  
  canGoUpActivePane = computed(() => this.activePanePath().length > 0);

  pane1Provider = computed<FileSystemProvider>(() => this.getProvider(this.pane1Path()));
  pane2Provider = computed<FileSystemProvider>(() => this.getProvider(this.pane2Path()));
  pane1ImageService = computed<ImageService>(() => this.getImageService(this.pane1Path()));
  pane2ImageService = computed<ImageService>(() => this.getImageService(this.pane2Path()));

  // --- Toolbar State Management ---
  toolbarAction = signal<{ name: string; payload?: any; id: number } | null>(null);
  
  pane1SortCriteria = signal<SortCriteria>({ key: 'name', direction: 'asc' });
  pane2SortCriteria = signal<SortCriteria>({ key: 'name', direction: 'asc' });
  activeSortCriteria = computed(() => this.activePaneId() === 1 ? this.pane1SortCriteria() : this.pane2SortCriteria());

  pane1DisplayMode = signal<'grid' | 'list'>('grid');
  pane2DisplayMode = signal<'grid' | 'list'>('grid');
  activeDisplayMode = computed(() => this.activePaneId() === 1 ? this.pane1DisplayMode() : this.pane2DisplayMode());

  pane1FilterQuery = signal('');
  pane2FilterQuery = signal('');
  activeFilterQuery = computed(() => this.activePaneId() === 1 ? this.pane1FilterQuery() : this.pane2FilterQuery());
  
  // States computed from active pane status for toolbar
  canCutCopyShareDelete = computed(() => this.activePaneStatus().selectedItemsCount > 0);
  canRename = computed(() => this.activePaneStatus().selectedItemsCount === 1);
  canPaste = computed(() => !!this.clipboardService.clipboard());

  // --- Split View Resizing ---
  pane1Width = signal(this.uiPreferencesService.splitViewPaneWidth() ?? 50); // percentage
  private isResizingPane = false;
  private unlistenPaneResizeMove: (() => void) | null = null;
  private unlistenPaneResizeUp: (() => void) | null = null;
  
  @ViewChild('paneContainer') paneContainerEl!: ElementRef<HTMLDivElement>;

  // --- Stream Pane Resizing ---
  streamPaneHeight = signal(this.uiPreferencesService.explorerStreamHeight() ?? 25); // percentage
  private isResizingStream = false;
  private unlistenStreamResizeMove: (() => void) | null = null;
  private unlistenStreamResizeUp: (() => void) | null = null;

  @ViewChild('mainContentWrapper') mainContentWrapperEl!: ElementRef<HTMLDivElement>;
  
  // --- Console Pane Resizing ---
  consolePaneHeight = signal(this.uiPreferencesService.explorerConsoleHeight() ?? 20); // percentage
  private isResizingConsole = false;
  private unlistenConsoleResizeMove: (() => void) | null = null;
  private unlistenConsoleResizeUp: (() => void) | null = null;

  // --- Webview and Text Editor State ---
  webviewContent = this.webviewService.viewRequest;
  textEditorContent = this.textEditorService.viewRequest;

  // --- Bookmarks ---
  bookmarkedLinks = this.bookmarkService.bookmarkedLinks;

  // --- Theme Dropdown ---
  isThemeDropdownOpen = signal(false);
  themeMenuPosition = signal({ top: '0px', right: '0px' });
  themes: { id: Theme; name: string }[] = [
    { id: 'theme-light', name: 'Light' },
    { id: 'theme-steel', name: 'Steel' },
    { id: 'theme-dark', name: 'Dark' },
  ];
  currentTheme = this.uiPreferencesService.theme;

  // --- Idea Stream State ---
  streamResultsForPane1 = signal<StreamItem[]>([]);
  streamResultsForPane2 = signal<StreamItem[]>([]);
  streamDisplayMode = signal<'grid' | 'list'>('grid');
  streamSourceToggle = signal<'all' | 'active' | 'left' | 'right'>('active');
  streamSearchQuery = signal('');
  
  readonly streamFilterTypes: { type: StreamItemType; label: string; iconPath: string }[] = [
    { type: 'web', label: 'Web', iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zM4.75 5.177a3.502 3.502 0 014.22.613l.31.39a.75.75 0 001.442 0l.31-.39a3.502 3.502 0 014.22-.613A4.502 4.502 0 0119 8.5v.081a4.5 4.5 0 01-5.138 4.417l-.27-1.353a.75.75 0 00-1.44-.288l-1.045 1.62a.75.75 0 00.288 1.441l1.354.27a4.5 4.5 0 01-4.416 5.137H8.5a4.502 4.502 0 01-3.323-1.413 3.502 3.502 0 01-.613-4.22l.39-.31a.75.75 0 000-1.442l-.39-.31a3.502 3.502 0 01-.613-4.22A4.502 4.502 0 014.75 5.177z' },
    { type: 'image', label: 'Images', iconPath: 'M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10zM6 8a1 1 0 100-2 1 1 0 000 2zm2 4l-2 3h8l-3-4-2 2.5L8 12z' },
    { type: 'youtube', label: 'Videos', iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z' },
    { type: 'academic', label: 'Academic', iconPath: 'M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 16c1.255 0 2.443-.29 3.5-.804V4.804zM14.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 0114.5 16c1.255 0 2.443-.29 3.5-.804v-10A7.968 7.968 0 0014.5 4z' },
    { type: 'gemini', label: 'AI', iconPath: 'M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z' }
  ];
  activeStreamFilters = signal<Set<StreamItemType>>(new Set(this.streamFilterTypes.map(f => f.type)));
  
  isStreamSortDropdownOpen = signal(false);
  streamSortCriteria = signal<StreamSortCriteria>({ key: 'relevance', direction: 'asc' });

  // Filtered and sorted stream results for rendering
  visibleStreamResults = computed(() => {
    const source = this.streamSourceToggle();
    let combinedResults: StreamItem[] = [];

    if (source === 'all') {
      combinedResults = [...this.streamResultsForPane1(), ...this.streamResultsForPane2()];
    } else if (source === 'left') {
      combinedResults = this.streamResultsForPane1();
    } else if (source === 'right') {
      combinedResults = this.streamResultsForPane2();
    } else { // 'active'
      combinedResults = this.activePaneId() === 1 ? this.streamResultsForPane1() : this.streamResultsForPane2();
    }
    return combinedResults;
  });
  
  processedStreamResults = computed(() => {
    let items = this.visibleStreamResults();
    const query = this.streamSearchQuery().toLowerCase();
    const filters = this.activeStreamFilters();
    const sort = this.streamSortCriteria();

    // 1. Filter by query
    if (query) {
      items = items.filter(item => {
        if ('title' in item && item.title.toLowerCase().includes(query)) return true;
        if ('snippet' in item && item.snippet?.toLowerCase().includes(query)) return true;
        if ('description' in item && item.description?.toLowerCase().includes(query)) return true;
        if ('text' in item && item.text.toLowerCase().includes(query)) return true;
        return false;
      });
    }

    // 2. Filter by type
    items = items.filter(item => filters.has(item.type));
    
    // 3. Sort
    items.sort((a, b) => {
      if (sort.key === 'relevance') {
        return 0; // Maintain original order which is assumed to be relevance
      }
      
      let valA: string = '';
      let valB: string = '';

      const getSource = (item: StreamItem): string => {
        switch (item.type) {
          case 'web':
            return item.source ?? '';
          case 'image':
            return item.source ?? '';
          case 'youtube':
            return item.channelTitle ?? '';
          case 'academic':
            return item.publication ?? '';
          case 'gemini':
            return 'Gemini';
        }
      };

      switch(sort.key) {
        case 'title':
          valA = ('title' in a ? a.title : ('description' in a ? a.description : a.query)) ?? '';
          valB = ('title' in b ? b.title : ('description' in b ? b.description : b.query)) ?? '';
          break;
        case 'source':
          valA = getSource(a);
          valB = getSource(b);
          break;
        case 'date':
          valA = a.publishedAt ?? '0';
          valB = b.publishedAt ?? '0';
          // For dates, we want newest first by default, so we reverse the comparison
          return new Date(valB).getTime() - new Date(valA).getTime();
      }
      return valA.localeCompare(valB, undefined, { sensitivity: 'base' });
    });

    return items;
  });

  // --- Pane Context Signals for Stream ---
  pane1Context = computed(() => {
    const path = this.pane1Path();
    const rootName = path.length > 0 ? path[0] : 'Home';
    const profile = this.profileService.profiles().find(p => p.name === rootName);
    const token = profile ? this.mountedProfileTokens().get(profile.id) : null;
    return { path, profile, token };
  });

  pane2Context = computed(() => {
    const path = this.pane2Path();
    const rootName = path.length > 0 ? path[0] : 'Home';
    const profile = this.profileService.profiles().find(p => p.name === rootName);
    const token = profile ? this.mountedProfileTokens().get(profile.id) : null;
    return { path, profile, token };
  });


  constructor() {
    this.homeProvider = {
      getContents: async (path: string[]) => {
        if (path.length > 0) throw new Error('Home provider does not support subdirectories.');
        const sessionNode = await this.sessionFs.getFolderTree();
        const allProfiles = this.profileService.profiles();
        const mountedIds = this.mountedProfileIds();

        const serverProfileNodes = allProfiles.map(p => {
            const isConnected = mountedIds.includes(p.id);
            return {
                name: p.name,
                type: 'folder' as const,
                isServerRoot: true,
                profileId: p.id,
                connected: isConnected,
                modified: isConnected ? new Date().toISOString() : undefined,
            };
        });

        return [sessionNode, ...serverProfileNodes];
      },
      getFolderTree: () => this.buildCombinedFolderTree(),
      ...readOnlyProviderOps,
    };

    // --- Effects ---
    // Update theme class on body when theme changes
    effect(() => {
      const theme = this.currentTheme();
      this.renderer.removeClass(this.document.body, 'theme-light');
      this.renderer.removeClass(this.document.body, 'theme-steel');
      this.renderer.removeClass(this.document.body, 'theme-dark');
      this.renderer.addClass(this.document.body, theme);
    });

    // Monitor health of server profiles
    effect(() => {
      const profiles = this.profileService.profiles();
      profiles.forEach(p => {
        if (p.imageUrl) {
          this.healthCheckService.monitorService({
            imageUrl: p.imageUrl,
            healthCheckDelayMinutes: p.healthCheckDelayMinutes
          });
        }
      });
    });

    // Reactive Folder Tree and Auto-Connect
    effect(() => {
      // Rebuilds the master folder tree whenever the list of server profiles changes,
      // or when the connection status (mounted profiles) of any profile changes. This ensures
      // the tree view is always in sync with the application's connection state.
      this.profileService.profiles(); // Dependency
      this.mountedProfiles(); // Dependency
      this.loadFolderTree();

      // Handles auto-connecting on startup, once profiles are loaded.
      if (!this.initialAutoConnectAttempted) {
        const profiles = this.profileService.profiles();
        if (profiles.length > 0) {
          this.initialAutoConnectAttempted = true;
          for (const profile of profiles) {
            if (profile.autoConnect) {
              // Attempt to auto-connect without credentials. This is a placeholder for a
              // more robust session/token management system. For now, we assume this is
              // only for profiles that don't need interactive login.
              this.onLoginAndMount({ profile, username: 'auto-user', password: 'auto-password' });
            }
          }
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Initialization is now handled reactively by effects in the constructor.
    // This method is kept to satisfy the OnInit interface, but can be left empty.
  }

  ngOnDestroy(): void {
    this.stopPaneResize();
    this.stopStreamResize();
    this.stopConsoleResize();
  }

  getProvider = (path: string[]): FileSystemProvider => {
    if (path.length === 0) return this.homeProvider;
    const rootName = path[0];

    // Check if the root of the path corresponds to a known server profile.
    const isServerProfile = this.profileService.profiles().some(p => p.name === rootName);

    if (isServerProfile) {
      const remoteProvider = this.remoteProviders().get(rootName);
      if (remoteProvider) {
        // The server is mounted, return its specific provider.
        return remoteProvider;
      } else {
        // The server is known but not mounted, return the disconnected provider.
        return disconnectedProvider;
      }
    }
    
    // If the path does not point to a server, it must be the local session.
    return this.sessionFs;
  }

  getImageService = (path: string[]): ImageService => {
    const rootName = path.length > 0 ? path[0] : this.localConfigService.sessionName();
    const remote = this.remoteImageServices().get(rootName);
    if (remote) return remote;
    
    // Fallback for local session or if no remote service is found
    const localProfile: ServerProfile = {
      id: 'local-session',
      name: this.localConfigService.sessionName(),
      brokerUrl: '', // not used for images
      imageUrl: this.localConfigService.defaultImageUrl(),
    };
    return new ImageService(localProfile, this.imageClientService, this.preferencesService, this.healthCheckService);
  }

  async buildCombinedFolderTree(): Promise<FileSystemNode> {
    const sessionTree = await this.sessionFs.getFolderTree();
    const allProfiles = this.profileService.profiles();
    const mountedIds = this.mountedProfileIds();
    const remoteRoots: FileSystemNode[] = [];

    for (const profile of allProfiles) {
      const isConnected = mountedIds.includes(profile.id);

      if (isConnected) {
        const provider = this.remoteProviders().get(profile.name);
        if (provider) {
          try {
            const remoteTree = await provider.getFolderTree();
            remoteRoots.push({
              ...remoteTree,
              name: profile.name, // Ensure the root name is the profile name
              isServerRoot: true,
              profileId: profile.id,
              connected: true,
            });
          } catch (e) {
            console.error(`Failed to get folder tree for ${profile.name}`, e);
            // Fallback to a disconnected-style node on error
            remoteRoots.push({
              name: profile.name,
              type: 'folder',
              isServerRoot: true,
              profileId: profile.id,
              connected: false,
              children: [],
            });
          }
        } else {
          // This case indicates an inconsistency (mounted but no provider). Show as disconnected.
          remoteRoots.push({
            name: profile.name,
            type: 'folder',
            isServerRoot: true,
            profileId: profile.id,
            connected: false,
            children: [],
          });
        }
      } else {
        // Profile is not connected
        remoteRoots.push({
          name: profile.name,
          type: 'folder',
          isServerRoot: true,
          profileId: profile.id,
          connected: false,
          children: [],
        });
      }
    }

    return {
      name: 'Home',
      type: 'folder',
      children: [sessionTree, ...remoteRoots],
      childrenLoaded: true,
    };
  }
  
  localSessionNode = computed(() => {
    const tree = this.folderTree();
    if (!tree?.children) return null;
    return tree.children.find(c => !c.isServerRoot) ?? null;
  });

  async loadFolderTree(): Promise<void> {
    this.folderTree.set(await this.buildCombinedFolderTree());
  }

  onLoadChildren = async (path: string[]) => {
    const provider = this.getProvider(path);
    if (provider === this.homeProvider || provider === this.sessionFs) {
      // SessionFS is fully loaded, no need to lazy load.
      return;
    }

    try {
      // Provider path doesn't include the root name
      const children = await provider.getContents(path.slice(1));
      
      this.folderTree.update(currentTree => {
        if (!currentTree) return null;

        // Recursive function to perform an immutable update on the tree
        const updateNodeRecursive = (node: FileSystemNode, currentPathSegments: string[]): FileSystemNode => {
          // If we've reached the target node...
          if (currentPathSegments.length === 0) {
            return {
              ...node,
              childrenLoaded: true,
              children: children.map(child => ({
                ...child,
                children: child.type === 'folder' ? [] : undefined,
                childrenLoaded: child.type !== 'folder',
              })),
            };
          }

          // If we're still traversing, find the next child in the path
          const nextSegment = currentPathSegments[0];
          const remainingSegments = currentPathSegments.slice(1);

          return {
            ...node,
            children: (node.children ?? []).map(child => {
              if (child.name === nextSegment) {
                // This is the child we need to recurse into
                return updateNodeRecursive(child, remainingSegments);
              }
              // This is not the child we're looking for, return it as is
              return child;
            }),
          };
        };
        
        // Start the recursive update from the root node.
        return updateNodeRecursive(currentTree, path);
      });

    } catch (e) {
      this.toastService.show(`Error loading contents for ${path.join('/')}: ${(e as Error).message}`, 'error');
    }
  }

  // --- Pane Management ---
  setActivePane(id: number): void {
    this.activePaneId.set(id);
  }

  toggleSplitView(): void {
    this.isSplitView.update(v => !v);
    const currentPaths = this.panePaths();
    if (this.isSplitView() && !currentPaths.find(p => p.id === 2)) {
      // When opening split view, mirror the active pane's path
      const activePath = this.activePanePath();
      this.panePaths.update(paths => [...paths, { id: 2, path: activePath }]);
    } else if (!this.isSplitView()) {
      // When closing, keep only the active pane's path
      const activeId = this.activePaneId();
      this.panePaths.update(paths => paths.filter(p => p.id === activeId));
      if (activeId === 2) {
        this.panePaths.update(paths => [{ id: 1, path: paths[0]?.path ?? [] }]);
        this.activePaneId.set(1);
      }
    }
  }
  
  onPane1PathChanged(path: string[]): void {
    this.panePaths.update(paths => {
      const newPaths = paths.filter(p => p.id !== 1);
      return [...newPaths, { id: 1, path }];
    });
  }

  onPane2PathChanged(path: string[]): void {
    this.panePaths.update(paths => {
      const newPaths = paths.filter(p => p.id !== 2);
      return [...newPaths, { id: 2, path }];
    });
  }

  goUpActivePane(): void {
    if (!this.canGoUpActivePane()) return;
    const activeId = this.activePaneId();
    this.panePaths.update(paths => {
      const pane = paths.find(p => p.id === activeId);
      if (pane) {
        const newPath = pane.path.slice(0, -1);
        const otherPanes = paths.filter(p => p.id !== activeId);
        return [...otherPanes, { id: activeId, path: newPath }];
      }
      return paths;
    });
  }

  navigatePathActivePane(index: number): void {
    const activeId = this.activePaneId();
    const currentPath = this.activePanePath();
    const newPath = currentPath.slice(0, index + 1);

    this.panePaths.update(paths => {
      const otherPanes = paths.filter(p => p.id !== activeId);
      return [...otherPanes, { id: activeId, path: newPath }];
    });
  }

  onItemSelectedInPane(item: FileSystemNode | null): void {
    this.selectedDetailItem.set(item);
  }
  
  onPane1StatusChanged(status: PaneStatus): void {
    this.pane1Status.set(status);
  }
  
  onPane2StatusChanged(status: PaneStatus): void {
    this.pane2Status.set(status);
  }
  
  // --- UI Toggles ---
  toggleDetailPane(): void {
    this.uiPreferencesService.toggleDetailPane();
  }

  toggleSidebar(): void {
    this.uiPreferencesService.toggleSidebar();
  }
  
  toggleTree(): void {
    this.uiPreferencesService.toggleTree();
  }
  
  toggleChat(): void {
    this.uiPreferencesService.toggleChat();
  }

  toggleNotes(): void {
    this.uiPreferencesService.toggleNotes();
  }

  toggleSavedItems(): void {
    this.uiPreferencesService.toggleSavedItems();
  }
  
  toggleRssFeed(): void {
    this.uiPreferencesService.toggleRssFeed();
  }
  
  toggleStream(): void {
    this.uiPreferencesService.toggleStream();
  }
  
  toggleConsole(): void {
    this.uiPreferencesService.toggleConsole();
  }
  
  toggleStreamPaneCollapse(): void {
    this.uiPreferencesService.toggleStreamPaneCollapse();
  }

  triggerRefresh(): void {
    this.refreshPanes.update(v => v + 1);
  }

  // --- Toolbar Action Handling ---
  onToolbarAction(name: string, payload?: any): void {
    this.toolbarAction.set({ name, payload, id: Date.now() });
  }

  onSortChange(criteria: SortCriteria): void {
    if (this.activePaneId() === 1) {
      this.pane1SortCriteria.set(criteria);
    } else {
      this.pane2SortCriteria.set(criteria);
    }
  }
  
  onDisplayModeChange(mode: 'grid' | 'list'): void {
    if (this.activePaneId() === 1) {
      this.pane1DisplayMode.set(mode);
    } else {
      this.pane2DisplayMode.set(mode);
    }
  }

  onFilterChange(query: string): void {
    if (this.activePaneId() === 1) {
      this.pane1FilterQuery.set(query);
    } else {
      this.pane2FilterQuery.set(query);
    }
  }

  // --- Sidebar Navigation ---
  onSidebarNavigation(path: string[]): void {
    const activeId = this.activePaneId();
    this.panePaths.update(paths => {
      const otherPanes = paths.filter(p => p.id !== activeId);
      return [...otherPanes, { id: activeId, path }];
    });
  }

  // --- Server Profile Dialog ---
  openServerProfilesDialog(): void {
    this.profileForEdit.set(null);
    this.isServerProfilesDialogOpen.set(true);
  }
  
  closeServerProfilesDialog(): void {
    this.isServerProfilesDialogOpen.set(false);
  }

  // --- Local Config Dialog ---
  openLocalConfigDialog(): void {
    this.isLocalConfigDialogOpen.set(true);
  }

  closeLocalConfigDialog(): void {
    this.isLocalConfigDialogOpen.set(false);
  }

  onLocalConfigSaved(config: LocalConfig): void {
    this.localConfigService.updateConfig(config);
    this.closeLocalConfigDialog();
    this.loadFolderTree(); // Reload tree to reflect new session name
    this.toastService.show('Local configuration saved.');
  }
  
  // --- RSS Feeds Dialog ---
  openRssFeedsDialog(): void {
    this.isRssFeedsDialogOpen.set(true);
  }

  closeRssFeedsDialog(): void {
    this.isRssFeedsDialogOpen.set(false);
  }
  
  // --- Import / Export ---
  async handleImport(event: { destPath: string[], data: FileSystemNode }): Promise<void> {
    try {
      await this.sessionFs.importTree(event.destPath.slice(1), event.data);
      this.isImportDialogOpen.set(false);
      this.loadFolderTree();
      this.toastService.show('Folder structure imported successfully.');
    } catch (e) {
      this.toastService.show(`Import failed: ${(e as Error).message}`, 'error');
    }
  }

  async handleExport(event: { node: FileSystemNode, path: string[] }): Promise<void> {
    try {
      const json = JSON.stringify(event.node, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.node.name || 'export'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.isExportDialogOpen.set(false);
    } catch (e) {
      this.toastService.show(`Export failed: ${(e as Error).message}`, 'error');
    }
  }

  // --- Login and Connection Management ---
  async onLoginAndMount({ profile, username, password }: { profile: ServerProfile, username: string, password: string }): Promise<void> {
    try {
      const { user, token } = await this.loginService.login(profile, username, password);
      
      const provider = new RemoteFileSystemService(profile, this.fsService, token);
      const imageService = new ImageService(profile, this.imageClientService, this.preferencesService, this.healthCheckService);

      this.mountedProfiles.update(p => [...p, profile]);
      this.mountedProfileUsers.update(m => new Map(m).set(profile.id, user));
      this.mountedProfileTokens.update(m => new Map(m).set(profile.id, token));
      this.remoteProviders.update(m => new Map(m).set(profile.name, provider));
      this.remoteImageServices.update(m => new Map(m).set(profile.name, imageService));
      this.notesService.setToken(profile.id, token);

      await this.loadFolderTree();

      this.toastService.show(`Successfully connected to ${profile.name}.`);

    } catch (e) {
      const profileName = profile ? profile.name : 'the server';
      this.toastService.show(`Login to ${profileName} failed: ${(e as Error).message}`, 'error');
    }
  }

  onUnmountProfile(profile: ServerProfile): void {
    this.mountedProfiles.update(p => p.filter(item => item.id !== profile.id));
    
    this.mountedProfileUsers.update(m => {
      const newMap = new Map(m);
      newMap.delete(profile.id);
      return newMap;
    });

    this.mountedProfileTokens.update(m => {
      const newMap = new Map(m);
      newMap.delete(profile.id);
      return newMap;
    });
    
    this.remoteProviders.update(m => {
      const newMap = new Map(m);
      newMap.delete(profile.name);
      return newMap;
    });

    this.remoteImageServices.update(m => {
      const newMap = new Map(m);
      newMap.delete(profile.name);
      return newMap;
    });

    this.notesService.removeToken(profile.id);

    // If any pane was inside the unmounted profile, navigate it to root
    this.panePaths.update(paths => {
        return paths.map(p => {
            if (p.path[0] === profile.name) {
                return { ...p, path: [] };
            }
            return p;
        });
    });

    this.loadFolderTree();
    this.toastService.show(`Disconnected from ${profile.name}.`);
  }
  
  onConnectToServer(profileId: string): void {
    const profile = this.profileService.profiles().find(p => p.id === profileId);
    if (profile) {
      this.profileForLogin.set(profile);
    }
  }
  
  onDisconnectFromServer(profileId: string): void {
    const profile = this.mountedProfiles().find(p => p.id === profileId);
    if (profile) {
      this.onUnmountProfile(profile);
    }
  }

  onEditServerProfile(profileId: string): void {
    const profile = this.profileService.profiles().find(p => p.id === profileId);
    if (profile) {
      this.profileForEdit.set(profile);
      this.isServerProfilesDialogOpen.set(true);
    }
  }

  onServerProfileRenamed(event: { oldName: string, newName: string, profile: ServerProfile }): void {
    const { oldName, newName, profile } = event;

    // 1. Update remoteProviders and remoteImageServices keys if the profile is mounted
    if (this.remoteProviders().has(oldName)) {
        const provider = this.remoteProviders().get(oldName)!;
        this.remoteProviders.update(m => {
            const newMap = new Map(m);
            newMap.delete(oldName);
            newMap.set(newName, provider);
            return newMap;
        });
        
        const imageService = this.remoteImageServices().get(oldName)!;
        this.remoteImageServices.update(m => {
            const newMap = new Map(m);
            newMap.delete(oldName);
            newMap.set(newName, imageService);
            return newMap;
        });
    }

    // 2. Update paths in any open panes
    this.panePaths.update(paths => {
        return paths.map(panePath => {
            if (panePath.path[0] === oldName) {
                return { ...panePath, path: [newName, ...panePath.path.slice(1)] };
            }
            return panePath;
        });
    });

    // 3. Reload the folder tree to reflect the name change
    this.loadFolderTree();
  }
  
  onLoginSubmittedFromSidebar({ username, password }: { username: string, password: string }): void {
    const profile = this.profileForLogin();
    if (profile) {
      this.onLoginAndMount({ profile, username, password });
      this.profileForLogin.set(null);
    } else {
      console.error("Login submitted but no profile was selected for login.");
      this.toastService.show('Login failed: No profile selected.', 'error');
    }
  }

  // --- Drag & Drop for Bookmarks ---
  onBookmarkDroppedOnPane(event: { bookmark: NewBookmark, dropOn: FileSystemNode }): void {
    const destPath = [...this.activePanePath(), event.dropOn.name];
    this.bookmarkService.addBookmark(destPath, event.bookmark);
    this.toastService.show(`Bookmark saved to ${event.dropOn.name}.`);
  }

  onBookmarkDroppedOnSidebar(event: { bookmark: NewBookmark, destPath:string[] }): void {
    this.bookmarkService.addBookmark(event.destPath, event.bookmark);
    this.toastService.show(`Bookmark saved.`);
  }

  // --- File/Folder Item Manipulation (from panes or sidebar) ---
  onPaneItemRenamed(event: { oldName: string, newName: string }, path: string[]): void {
    const oldFullPath = [...path, event.oldName];
    const newFullPath = [...path, event.newName];
    this.folderPropertiesService.handleRename(oldFullPath, newFullPath);
    this.loadFolderTree();
  }
  
  onSidebarRenameItem(event: { path: string[], newName: string }): void {
    const oldName = event.path[event.path.length - 1];
    const parentPath = event.path.slice(0, -1);
    const provider = this.getProvider(parentPath);
    const providerPath = parentPath.length > 0 ? parentPath.slice(1) : [];

    provider.rename(providerPath, oldName, event.newName)
      .then(() => {
        this.folderPropertiesService.handleRename(event.path, [...parentPath, event.newName]);
        this.loadFolderTree();
        this.toastService.show('Item renamed.');
      })
      .catch(e => this.toastService.show(`Rename failed: ${(e as Error).message}`, 'error'));
  }
  
  onItemsDeleted(paths: string[][]): void {
    for (const path of paths) {
      this.folderPropertiesService.handleDelete(path);
    }
    this.loadFolderTree();
  }

  onSidebarDeleteItem(path: string[]): void {
    const name = path[path.length - 1];
    const parentPath = path.slice(0, -1);
    const provider = this.getProvider(path);
    const providerPath = parentPath.length > 0 ? parentPath.slice(1) : [];
    
    // We need to know if it's a file or folder
    provider.getContents(providerPath).then(contents => {
      const item = contents.find(c => c.name === name);
      if (!item) {
        throw new Error("Item not found for deletion.");
      }
      const promise = item.type === 'folder'
        ? provider.removeDirectory(providerPath, name)
        : provider.deleteFile(providerPath, name);
      
      promise.then(() => {
        this.folderPropertiesService.handleDelete(path);
        this.loadFolderTree();
        this.toastService.show('Item deleted.');
      }).catch(e => this.toastService.show(`Delete failed: ${(e as Error).message}`, 'error'));
    }).catch(e => this.toastService.show(`Delete failed: ${(e as Error).message}`, 'error'));
  }

  onItemsMoved(event: { sourcePath: string[], destPath: string[], items: ItemReference[] }): void {
    for (const item of event.items) {
      if (item.type === 'folder') {
        const oldFullPath = [...event.sourcePath, item.name];
        const newFullPath = [...event.destPath, item.name];
        this.folderPropertiesService.handleRename(oldFullPath, newFullPath);
      }
    }
    this.loadFolderTree();
  }

  onSidebarItemsMoved(event: { destPath: string[]; payload: DragDropPayload }): void {
    if (event.payload.type !== 'filesystem') return;
    
    const { sourceProvider, sourcePath, items } = event.payload.payload;
    const destProvider = this.getProvider(event.destPath);
    
    // Moving between providers is not supported yet.
    if (sourceProvider !== destProvider) {
      this.toastService.show('Moving items between different file systems is not supported yet.', 'error');
      return;
    }

    const sourceProviderPath = sourcePath.length > 0 ? sourcePath.slice(1) : [];
    const destProviderPath = event.destPath.length > 0 ? event.destPath.slice(1) : [];

    sourceProvider.move(sourceProviderPath, destProviderPath, items.map(i => ({ name: i.name, type: i.type })))
      .then(() => {
        // Update properties and notes for each moved folder
        for (const item of items) {
          if (item.type === 'folder') {
            const oldFullPath = [...sourcePath, item.name];
            const newFullPath = [...event.destPath, item.name];
            this.folderPropertiesService.handleRename(oldFullPath, newFullPath);
          }
        }
        this.loadFolderTree();
        this.triggerRefresh();
        this.toastService.show('Items moved successfully.');
      })
      .catch(e => this.toastService.show(`Move failed: ${(e as Error).message}`, 'error'));
  }

  onSidebarNewFolder(event: { path: string[]; name: string }): void {
    const provider = this.getProvider(event.path);
    const providerPath = event.path.length > 0 ? event.path.slice(1) : [];
    provider.createDirectory(providerPath, event.name)
      .then(() => {
        this.loadFolderTree();
        this.toastService.show('Folder created.');
      })
      .catch(e => this.toastService.show(`Failed to create folder: ${(e as Error).message}`, 'error'));
  }
  
  onSidebarNewFile(event: { path: string[]; name: string }): void {
    const provider = this.getProvider(event.path);
    const providerPath = event.path.length > 0 ? event.path.slice(1) : [];
    provider.createFile(providerPath, event.name)
      .then(() => {
        this.loadFolderTree();
        this.toastService.show('File created.');
      })
      .catch(e => this.toastService.show(`Failed to create file: ${(e as Error).message}`, 'error'));
  }

  // --- Keyboard Shortcuts ---
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === '`') {
      event.preventDefault();
      this.toggleConsole();
    }
  }

  // --- Global Click for closing menus ---
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Close theme dropdown
    if (this.isThemeDropdownOpen() && !target.closest('.theme-menu')) {
      this.isThemeDropdownOpen.set(false);
    }
    // Close stream sort dropdown
    if (this.isStreamSortDropdownOpen() && !target.closest('.stream-sort-menu')) {
      this.isStreamSortDropdownOpen.set(false);
    }
  }

  // --- Resizing logic ---
  startPaneResize(event: MouseEvent): void {
    if (!this.isSplitView()) return;
    this.isResizingPane = true;
    event.preventDefault();
    const container = this.paneContainerEl.nativeElement;
    const startX = event.clientX;
    const startWidth = container.children[0].getBoundingClientRect().width;
    const totalWidth = container.getBoundingClientRect().width;

    this.unlistenPaneResizeMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
      const dx = e.clientX - startX;
      let newWidth = startWidth + dx;
      
      const minWidth = 150; // min width in pixels
      if (newWidth < minWidth) newWidth = minWidth;
      if (newWidth > totalWidth - minWidth) newWidth = totalWidth - minWidth;
      
      this.pane1Width.set((newWidth / totalWidth) * 100);
    });

    this.unlistenPaneResizeUp = this.renderer.listen('document', 'mouseup', () => this.stopPaneResize());
  }

  private stopPaneResize(): void {
    if (!this.isResizingPane) return;
    this.isResizingPane = false;
    this.unlistenPaneResizeMove?.();
    this.unlistenPaneResizeUp?.();
    this.uiPreferencesService.setSplitViewPaneWidth(this.pane1Width());
  }
  
  startStreamResize(event: MouseEvent): void {
    this.isResizingStream = true;
    event.preventDefault();
    const container = this.mainContentWrapperEl.nativeElement;
    const startY = event.clientY;
    const containerRect = container.getBoundingClientRect();
    const initialStreamHeight = container.children[2].getBoundingClientRect().height;
    
    this.unlistenStreamResizeMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
      const dy = startY - e.clientY;
      let newStreamHeight = initialStreamHeight + dy;
      
      const minHeight = 100;
      const consoleHeight = this.isConsoleCollapsed() ? 28 : (this.consolePaneHeight()/100 * containerRect.height);
      const maxHeight = containerRect.height - 100 - consoleHeight; // Leave 100px for file explorer

      if (newStreamHeight < minHeight) newStreamHeight = minHeight;
      if (newStreamHeight > maxHeight) newStreamHeight = maxHeight;
      
      this.streamPaneHeight.set((newStreamHeight / containerRect.height) * 100);
    });

    this.unlistenStreamResizeUp = this.renderer.listen('document', 'mouseup', () => this.stopStreamResize());
  }

  private stopStreamResize(): void {
    if (!this.isResizingStream) return;
    this.isResizingStream = false;
    this.unlistenStreamResizeMove?.();
    this.unlistenStreamResizeUp?.();
    this.uiPreferencesService.setExplorerStreamHeight(this.streamPaneHeight());
  }
  
  startConsolePaneResize(event: MouseEvent): void {
    this.isResizingConsole = true;
    event.preventDefault();
    const container = this.mainContentWrapperEl.nativeElement;
    const startY = event.clientY;
    const containerRect = container.getBoundingClientRect();
    const initialConsoleHeight = container.children[this.isStreamVisible() ? 4 : 2].getBoundingClientRect().height;

    this.unlistenConsoleResizeMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
        const dy = startY - e.clientY;
        let newConsoleHeight = initialConsoleHeight + dy;

        const minHeight = 100; // Minimum height in pixels for the console when expanded
        const streamHeight = this.isStreamVisible() ? (this.isStreamPaneCollapsed() ? 28 : (this.streamPaneHeight() / 100 * containerRect.height)) : 0;
        const maxHeight = containerRect.height - 100 - streamHeight; // Leave 100px for file explorer

        if (newConsoleHeight < minHeight) newConsoleHeight = minHeight;
        if (newConsoleHeight > maxHeight) newConsoleHeight = maxHeight;
        
        this.consolePaneHeight.set((newConsoleHeight / containerRect.height) * 100);
    });

    this.unlistenConsoleResizeUp = this.renderer.listen('document', 'mouseup', () => this.stopConsoleResize());
  }

  private stopConsoleResize(): void {
    if (!this.isResizingConsole) return;
    this.isResizingConsole = false;
    this.unlistenConsoleResizeMove?.();
    this.unlistenConsoleResizeUp?.();
    this.uiPreferencesService.setExplorerConsoleHeight(this.consolePaneHeight());
  }

  // --- Theme Menu ---
  openThemeMenu(target: HTMLElement): void {
    const rect = target.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    this.themeMenuPosition.set({ 
      top: `${rect.bottom + 8}px`, 
      right: `${viewportWidth - rect.right}px` 
    });
    this.isThemeDropdownOpen.set(true);
  }

  setTheme(theme: Theme): void {
    this.uiPreferencesService.setTheme(theme);
    this.isThemeDropdownOpen.set(false);
  }
  
  // --- Preferences Dialog ---
  openPreferencesDialog(): void {
    this.isPreferencesDialogOpen.set(true);
  }

  closePreferencesDialog(): void {
    this.isPreferencesDialogOpen.set(false);
  }

  onPreferencesSaved(prefs: Partial<UiPreferences>): void {
    this.uiPreferencesService.saveAllPreferences(prefs);
    this.closePreferencesDialog();
    this.toastService.show('Preferences saved.');
  }

  // --- Complex Search ---
  openComplexSearchDialog(): void {
    this.isComplexSearchDialogOpen.set(true);
  }
  
  closeComplexSearchDialog(): void {
    this.isComplexSearchDialogOpen.set(false);
  }

  onComplexSearch(params: ComplexSearchParams): void {
    this.toastService.show(`Complex search initiated for: "${params.query}"`);
    console.log("Complex Search Params:", params);
    // In a real app, you would now use these params to call a search service.
  }

  // --- Gemini Search ---
  openGeminiSearchDialog(): void {
    this.isGeminiSearchDialogOpen.set(true);
  }

  closeGeminiSearchDialog(): void {
    this.isGeminiSearchDialogOpen.set(false);
  }

  onGeminiSearch(params: GeminiSearchParams): void {
    this.toastService.show(`Gemini search initiated for: "${params.query}"`);
    console.log("Gemini Search Params:", params);
    // Here we could call the gemini service and update the stream results.
    // For now, just logging as requested.
  }

  // --- Stream ---

  private loadStreamResultsForPanes = effect(async () => {
    // This effect reacts to changes in pane contexts, ensuring it runs on every navigation.
    const contexts: ({ id: number; } & ReturnType<typeof this.pane1Context>)[] = [];
    
    if (this.isSplitView()) {
      contexts.push({ id: 1, ...this.pane1Context() });
      contexts.push({ id: 2, ...this.pane2Context() });
    } else {
      const activeId = this.activePaneId();
      contexts.push({ id: activeId, ...(activeId === 1 ? this.pane1Context() : this.pane2Context()) });
    }

    for (const context of contexts) {
        const { id, path, profile, token } = context;

        let isMagnetFolder = false;
        if (path.length > 0) {
            const provider = this.getProvider(path);
            // The provider's internal path does not include the root name (e.g., 'Local Session')
            const providerPath = path.slice(1);
            isMagnetFolder = await provider.hasFile(providerPath, '.magnet');
        }

        // If the current folder is not a magnet folder, clear its stream results and do nothing else.
        if (!isMagnetFolder) {
            if (id === 1) {
                this.streamResultsForPane1.set([]);
            } else {
                this.streamResultsForPane2.set([]);
            }
            continue; // Move to the next pane context
        }

        // --- If it IS a magnet folder, proceed with the existing search logic ---
        const rootName = path[0];
        const relativePath = path.slice(1);

        const query = relativePath.length > 0 ? relativePath[relativePath.length - 1] : rootName;
        const simpleSearchQuery = relativePath.join(', ');

        const promises: Promise<StreamItem[]>[] = [];

        // Google Search (Simple) - only for server paths
        if (profile && token) {
            const searchParams: GoogleSearchParams = {
                brokerUrl: profile.brokerUrl,
                token: token,
                query: simpleSearchQuery
            };
            promises.push(
                this.googleSearchService.search(searchParams)
                    .then(results => results.map(r => ({ ...r, type: 'web' as const, paneId: id })))
            );
        }

        // Unsplash Image Search
        promises.push(
            this.unsplashService.search(query)
                .then(results => results.map(r => ({ ...r, type: 'image' as const, paneId: id })))
        );

        // YouTube Search
        promises.push(
            this.youtubeSearchService.search(query)
                .then(results => results.map(r => ({ ...r, type: 'youtube' as const, paneId: id })))
        );
        
        // Academic Search
        promises.push(
            this.academicSearchService.search(query)
                .then(results => results.map(r => ({ ...r, type: 'academic' as const, paneId: id })))
        );

        // Gemini Search
        promises.push(
            this.geminiService.search(query)
                .then(text => [{ query, text, publishedAt: new Date().toISOString(), type: 'gemini' as const, paneId: id }])
        );

        try {
            const results = await Promise.all(promises);
            const flattenedResults = results.flat();
            
            if (id === 1) {
                this.streamResultsForPane1.set(flattenedResults);
            } else {
                this.streamResultsForPane2.set(flattenedResults);
            }

        } catch (error) {
            console.error(`Failed to load stream results for pane ${id}`, error);
            if (id === 1) {
                this.streamResultsForPane1.set([]);
            } else {
                this.streamResultsForPane2.set([]);
            }
        }
    }
  }, { allowSignalWrites: true });

  onStreamSearchChange(event: Event): void {
    this.streamSearchQuery.set((event.target as HTMLInputElement).value);
  }

  toggleStreamFilter(type: StreamItemType): void {
    this.activeStreamFilters.update(current => {
      const newSet = new Set(current);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  }

  toggleAllStreamFilters(): void {
    if (this.activeStreamFilters().size === this.streamFilterTypes.length) {
      this.activeStreamFilters.set(new Set());
    } else {
      this.activeStreamFilters.set(new Set(this.streamFilterTypes.map(f => f.type)));
    }
  }

  toggleStreamSortDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isStreamSortDropdownOpen.update(v => !v);
  }
  
  onStreamSortChange(key: StreamSortKey): void {
    this.streamSortCriteria.set({ key, direction: 'asc' }); // Direction is handled in computed for now
    this.isStreamSortDropdownOpen.set(false);
  }

  getStreamItemLink(item: StreamItem): string {
    switch (item.type) {
        case 'web':
        case 'academic':
            return item.link;
        case 'image':
            return item.url;
        case 'youtube':
            return `https://www.youtube.com/watch?v=${item.videoId}`;
        case 'gemini':
            // Gemini results don't have a unique link, so we create one from content
            return `gemini:${item.query}:${item.publishedAt}`;
    }
  }
  
  onBookmarkToggled(item: StreamItem): void {
    const link = this.getStreamItemLink(item);
    const existing = this.bookmarkService.findBookmarkByLink(link);

    if (existing) {
        this.bookmarkService.deleteBookmark(existing._id);
        this.toastService.show('Bookmark removed.');
    } else {
        let newBookmark: NewBookmark;
        switch(item.type) {
            case 'web':
                newBookmark = { type: 'web', title: item.title, link: item.link, snippet: item.snippet, source: item.source };
                break;
            case 'image':
                newBookmark = { type: 'image', title: item.description, link: item.url, thumbnailUrl: item.thumbnailUrl, snippet: `by ${item.photographer}`, source: item.source };
                break;
            case 'youtube':
                newBookmark = { type: 'youtube', title: item.title, link: `https://www.youtube.com/watch?v=${item.videoId}`, thumbnailUrl: item.thumbnailUrl, snippet: item.description, source: item.channelTitle };
                break;
            case 'academic':
                newBookmark = { type: 'academic', title: item.title, link: item.link, snippet: item.snippet, source: item.publication };
                break;
            case 'gemini':
                newBookmark = { type: 'gemini', title: `Gemini: ${item.query}`, link: this.getStreamItemLink(item), snippet: item.text, source: 'Gemini' };
                break;
        }
        this.bookmarkService.addBookmark(this.activePanePath(), newBookmark);
        this.toastService.show('Bookmark saved to current folder.');
    }
  }
}