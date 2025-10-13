import { Component, ChangeDetectionStrategy, signal, computed, inject, effect, Renderer2, ElementRef, OnDestroy, Injector } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FileExplorerComponent, SearchResultNode } from './components/file-explorer/file-explorer.component.js';
import { SidebarComponent } from './components/sidebar/sidebar.component.js';
import { FileSystemNode } from './models/file-system.model.js';
import { FileSystemProvider } from './services/file-system-provider.js';
import { ServerProfilesDialogComponent } from './components/server-profiles-dialog/server-profiles-dialog.component.js';
import { ElectronFileSystemService } from './services/electron-file-system.service.js';
import { ServerProfileService } from './services/server-profile.service.js';
import { SearchDialogComponent } from './components/search-dialog/search-dialog.component.js';
import { DetailPaneComponent } from './components/detail-pane/detail-pane.component.js';
import { ConvexDesktopService } from './services/convex-desktop.service.js';
import { ServerProfile } from './models/server-profile.model.js';
import { RemoteFileSystemService } from './services/remote-file-system.service.js';
import { FsService } from './services/fs.service.js';
import { ImageService } from './services/image.service.js';
import { ImageClientService } from './services/image-client.service.js';

interface PanePath {
  id: number;
  path: string[];
}
type Theme = 'theme-light' | 'theme-steel' | 'theme-dark';
const THEME_STORAGE_KEY = 'file-explorer-theme';

const LOCAL_FS_ROOT_NAME = 'Local Filesystem';
const CONVEX_ROOT_NAME = 'Convex Pins';

@Component({
  selector: 'app-root',
  template: `
<div class="flex flex-col h-screen font-sans antialiased text-[rgb(var(--color-text-base))] bg-[rgb(var(--color-background))]">
  <!-- Main Header -->
  <header class="flex-shrink-0 h-10 bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border-base))] flex items-center justify-end px-4 space-x-2">
    <!-- Connection Status -->
    <div class="flex-grow flex items-center">
        <!-- This space is intentionally left blank after removal of status indicator -->
    </div>

    <button (click)="openServerProfilesDialog()" class="flex items-center space-x-2 px-3 py-1 bg-[rgb(var(--color-surface))] hover:bg-[rgb(var(--color-surface-hover))] rounded-md shadow-sm border border-[rgb(var(--color-border-muted))] text-sm font-medium text-[rgb(var(--color-text-muted))] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-accent-ring))]">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" clip-rule="evenodd" />
      </svg>
      <span>Servers</span>
    </button>
    <div class="h-6 w-px bg-[rgb(var(--color-border-muted))]"></div>
    <div class="relative inline-block text-left">
      <button (click)="toggleThemeDropdown($event)" class="flex items-center space-x-2 px-3 py-1 bg-[rgb(var(--color-surface))] hover:bg-[rgb(var(--color-surface-hover))] rounded-md shadow-sm border border-[rgb(var(--color-border-muted))] text-sm font-medium text-[rgb(var(--color-text-muted))] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-accent-ring))]">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 4a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H5zm0 2h10v6H5V6z" />
        </svg>
        <span>Theme</span>
      </button>

      @if(isThemeDropdownOpen()) {
        <div class="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-[rgb(var(--color-surface-dialog))] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu">
          <div class="py-1" role="none">
            @for(theme of themes; track theme.id) {
              <div (click)="setTheme(theme.id)" class="text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-hover))] flex items-center px-4 py-2 text-sm cursor-pointer" role="menuitem">
                <span class="w-5">
                  @if (currentTheme() === theme.id) {
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[rgb(var(--color-accent-text))]" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                  }
                </span>
                <span>{{ theme.name }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
    <div class="h-6 w-px bg-[rgb(var(--color-border-muted))]"></div>
    <button (click)="toggleSplitView()" class="flex items-center space-x-2 px-3 py-1 bg-[rgb(var(--color-surface))] hover:bg-[rgb(var(--color-surface-hover))] rounded-md shadow-sm border border-[rgb(var(--color-border-muted))] text-sm font-medium text-[rgb(var(--color-text-muted))] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-accent-ring))]">
      @if (isSplitView()) {
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4H6a1 1 0 000 2h8a1 1 0 000-2z" />
        </svg>
        <span>Merge</span>
      } @else {
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm2 4a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V8a1 1 0 00-1-1H7zm6 0a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V8a1 1 0 00-1-1h-2z" />
        </svg>
        <span>Split</span>
      }
    </button>
    <div class="h-6 w-px bg-[rgb(var(--color-border-muted))]"></div>
    <button 
      (click)="toggleDetailPane()" 
      class="flex items-center space-x-2 px-3 py-1 bg-[rgb(var(--color-surface))] hover:bg-[rgb(var(--color-surface-hover))] rounded-md shadow-sm border border-[rgb(var(--color-border-muted))] text-sm font-medium text-[rgb(var(--color-text-muted))] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-accent-ring))]"
      [class.bg-[rgb(var(--color-accent-bg))]]="isDetailPaneOpen()"
      [class.text-[rgb(var(--color-accent-text))]]="isDetailPaneOpen()">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
      </svg>
      <span>Details</span>
    </button>
  </header>

  <!-- Main Content -->
  <main class="flex-1 flex flex-row overflow-hidden">
    <app-sidebar 
      [folderTree]="folderTree()"
      [currentPath]="activePanePath()"
      (pathChange)="onSidebarNavigation($event)">
    </app-sidebar>

    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 flex bg-[rgb(var(--color-background))] p-1 gap-1">
        <div class="flex-1">
          <app-file-explorer 
            [id]="1"
            [path]="pane1Path()"
            [isActive]="activePaneId() === 1"
            [isSplitView]="isSplitView()"
            [fileSystemProvider]="pane1Provider()"
            [imageService]="pane1ImageService()"
            [folderTree]="folderTree()"
            [searchResults]="searchResultForPane()"
            (activated)="setActivePane($event)"
            (pathChanged)="onPane1PathChanged($event)"
            (searchInitiated)="openSearchDialog(1)"
            (searchCompleted)="onSearchCompleted()"
            (quickSearch)="executeQuickSearch(1, $event)"
            (itemSelected)="onItemSelectedInPane($event)">
          </app-file-explorer>
        </div>

        @if (isSplitView()) {
          <div class="flex-1">
            <app-file-explorer 
              [id]="2"
              [path]="pane2Path()"
              [isActive]="activePaneId() === 2"
              [isSplitView]="isSplitView()"
              [fileSystemProvider]="pane2Provider()"
              [imageService]="pane2ImageService()"
              [folderTree]="folderTree()"
              [searchResults]="searchResultForPane()"
              (activated)="setActivePane($event)"
              (pathChanged)="onPane2PathChanged($event)"
              (searchInitiated)="openSearchDialog(2)"
              (searchCompleted)="onSearchCompleted()"
              (quickSearch)="executeQuickSearch(2, $event)"
              (itemSelected)="onItemSelectedInPane($event)">
            </app-file-explorer>
          </div>
        }
      </div>
      
      @if (isDetailPaneOpen()) {
        <app-detail-pane
          [item]="selectedDetailItem()"
          [imageService]="activeImageService()"
          (close)="toggleDetailPane()">
        </app-detail-pane>
      }
    </div>
  </main>

  @if(isServerProfilesDialogOpen()) {
    <app-server-profiles-dialog 
      [mountedProfileIds]="mountedProfileIds()"
      (close)="closeServerProfilesDialog()"
      (mountProfile)="mountProfile($event)"
      (unmountProfile)="unmountProfile($event)">
    </app-server-profiles-dialog>
  }

  @if(isSearchDialogOpen()) {
    <app-search-dialog
      (close)="closeSearchDialog()"
      (search)="executeSearch($event)">
    </app-search-dialog>
  }
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FileExplorerComponent, SidebarComponent, ServerProfilesDialogComponent, SearchDialogComponent, DetailPaneComponent],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class AppComponent implements OnDestroy {
  private electronFs = inject(ElectronFileSystemService);
  private convexFs = inject(ConvexDesktopService);
  private profileService = inject(ServerProfileService);
  private fsService = inject(FsService);
  private imageClientService = inject(ImageClientService);
  private injector = inject(Injector);
  private document = inject(DOCUMENT);
  private elementRef = inject(ElementRef);

  // --- State Management ---
  isSplitView = signal(false);
  activePaneId = signal(1);
  folderTree = signal<FileSystemNode | null>(null);
  isServerProfilesDialogOpen = signal(false);
  isThemeDropdownOpen = signal(false);
  isDetailPaneOpen = signal(false);
  selectedDetailItem = signal<FileSystemNode | null>(null);
  
  // Keep track of each pane's path
  private panePaths = signal<PanePath[]>([{ id: 1, path: [] }]);

  // --- Mounted Profile State ---
  mountedProfiles = signal<ServerProfile[]>([]);
  mountedProfileIds = computed(() => this.mountedProfiles().map(p => p.id));
  private remoteProviders = signal<Map<string, RemoteFileSystemService>>(new Map());
  private remoteImageServices = signal<Map<string, ImageService>>(new Map());
  private defaultImageService = new ImageService(this.profileService.activeProfile()!, this.imageClientService);
  
  // --- Search State ---
  isSearchDialogOpen = signal(false);
  private searchInitiatorPaneId = signal<number | null>(null);
  searchResultForPane = signal<{ id: number; results: SearchResultNode[] } | null>(null);

  // --- Theme Management ---
  currentTheme = signal<Theme>('theme-steel');
  themes: {id: Theme, name: string}[] = [
    { id: 'theme-light', name: 'Light' },
    { id: 'theme-steel', name: 'Steel' },
    { id: 'theme-dark', name: 'Dark' },
  ];

  // The sidebar's currentPath is always bound to the path of the active pane
  activePanePath = computed(() => {
    const activeId = this.activePaneId();
    const activePane = this.panePaths().find(p => p.id === activeId);
    return activePane ? activePane.path : [];
  });
  
  // Computed paths for each pane to pass as inputs
  pane1Path = computed(() => this.panePaths().find(p => p.id === 1)?.path ?? []);
  pane2Path = computed(() => this.panePaths().find(p => p.id === 2)?.path ?? []);

  // --- Computed Per-Pane Services ---
  private getProviderForPath(path: string[]): FileSystemProvider {
    if (path.length === 0) return this.electronFs;
    const root = path[0];
    if (root === CONVEX_ROOT_NAME) return this.convexFs;
    const remoteProvider = this.remoteProviders().get(root);
    if (remoteProvider) return remoteProvider;
    return this.electronFs;
  }
  
  private getImageServiceForPath(path: string[]): ImageService {
    if (path.length === 0) return this.defaultImageService;
    const root = path[0];
    const remoteService = this.remoteImageServices().get(root);
    if (remoteService) return remoteService;
    return this.defaultImageService;
  }

  pane1Provider = computed(() => this.getProviderForPath(this.pane1Path()));
  pane2Provider = computed(() => this.getProviderForPath(this.pane2Path()));
  pane1ImageService = computed(() => this.getImageServiceForPath(this.pane1Path()));
  pane2ImageService = computed(() => this.getImageServiceForPath(this.pane2Path()));
  
  // FIX: Add a computed signal to get the image service for the active pane.
  // This is needed to pass the correct service to the detail pane, which was
  // previously trying to inject a non-injectable service.
  activeImageService = computed(() => {
    return this.activePaneId() === 1 ? this.pane1ImageService() : this.pane2ImageService();
  });

  constructor() {
    this.loadTheme();
    
    effect(() => {
      const theme = this.currentTheme();
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      this.document.body.className = theme;
    });

    this.loadFolderTree();
  }

  ngOnDestroy(): void {
    this.document.body.className = '';
  }

  loadTheme(): void {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
      if (storedTheme && this.themes.some(t => t.id === storedTheme)) {
        this.currentTheme.set(storedTheme);
      } else {
        this.currentTheme.set('theme-steel');
      }
    } catch (e) {
      console.error('Failed to load theme from localStorage', e);
      this.currentTheme.set('theme-steel');
    }
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    this.isThemeDropdownOpen.set(false);
  }

  toggleThemeDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isThemeDropdownOpen.update(v => !v);
  }
  
  onDocumentClick(event: Event): void {
    const dropdownElement = this.elementRef.nativeElement.querySelector('.relative.inline-block');
    if (dropdownElement && !dropdownElement.contains(event.target)) {
        if (this.isThemeDropdownOpen()) {
            this.isThemeDropdownOpen.set(false);
        }
    }
  }

  async loadFolderTree(): Promise<void> {
    this.folderTree.set(null); // Clear old tree immediately
    
    // Reset paths only if necessary, maybe on full reload, not mount/unmount
    // this.panePaths.set([{ id: 1, path: [] }]);
    // if (this.isSplitView()) {
    //     this.panePaths.update(p => [...p, { id: 2, path: [] }]);
    // }

    try {
      let localFSRoot: FileSystemNode;
      try {
        localFSRoot = await this.electronFs.getFolderTree();
        localFSRoot.name = LOCAL_FS_ROOT_NAME;
      } catch (e) {
        console.error('Failed to load local filesystem tree:', e);
        localFSRoot = { 
          name: LOCAL_FS_ROOT_NAME, 
          type: 'folder', 
          children: [], 
          content: `Error: ${(e as Error).message}. This is expected in browser mode.` 
        };
      }
      
      const convexRoot = await this.convexFs.getFolderTree();
      
      const remoteRoots = await Promise.all(
        Array.from(this.remoteProviders().values()).map(provider => provider.getFolderTree())
      );

      const metaRoot: FileSystemNode = {
        name: 'Home',
        type: 'folder',
        children: [localFSRoot, convexRoot, ...remoteRoots]
      };

      this.folderTree.set(metaRoot);
    } catch (e) {
      console.error('Failed to load a complete folder tree', e);
    }
  }
  
  // --- Profile Mounting ---
  mountProfile(profile: ServerProfile): void {
    if (this.mountedProfiles().some(p => p.id === profile.id)) return;

    const provider = new RemoteFileSystemService(profile, this.fsService);
    const imageService = new ImageService(profile, this.imageClientService);

    this.remoteProviders.update(map => new Map(map).set(profile.name, provider));
    this.remoteImageServices.update(map => new Map(map).set(profile.name, imageService));
    this.mountedProfiles.update(profiles => [...profiles, profile]);
    this.profileService.setActiveProfile(profile.id);
    this.loadFolderTree();
  }

  unmountProfile(profile: ServerProfile): void {
    this.remoteProviders.update(map => {
      const newMap = new Map(map);
      newMap.delete(profile.name);
      return newMap;
    });
    this.remoteImageServices.update(map => {
        const newMap = new Map(map);
        newMap.delete(profile.name);
        return newMap;
    });
    this.mountedProfiles.update(profiles => profiles.filter(p => p.id !== profile.id));
    this.loadFolderTree();
  }
  
  // --- UI & Pane Management ---
  toggleSplitView(): void {
    this.isSplitView.update(isSplit => {
      if (isSplit) {
        this.panePaths.update(paths => paths.slice(0, 1));
        this.activePaneId.set(1);
        return false;
      } else {
        const currentPath = this.panePaths()[0]?.path ?? [];
        this.panePaths.update(paths => [...paths, { id: 2, path: currentPath }]);
        this.activePaneId.set(2);
        return true;
      }
    });
  }

  toggleDetailPane(): void {
    this.isDetailPaneOpen.update(v => !v);
  }

  onItemSelectedInPane(item: FileSystemNode | null): void {
    this.selectedDetailItem.set(item);
  }

  setActivePane(id: number): void {
    this.activePaneId.set(id);
  }
  
  onPane1PathChanged(path: string[]): void {
    this.updatePanePath(1, path);
  }

  onPane2PathChanged(path: string[]): void {
    this.updatePanePath(2, path);
  }

  private updatePanePath(id: number, path: string[]): void {
    this.panePaths.update(paths => {
      const index = paths.findIndex(p => p.id === id);
      if (index > -1) {
        const newPaths = [...paths];
        newPaths[index] = { ...newPaths[index], path: path };
        return newPaths;
      }
      return paths;
    });
  }
  
  onSidebarNavigation(path: string[]): void {
    this.updatePanePath(this.activePaneId(), path);
  }

  openServerProfilesDialog(): void {
    this.isServerProfilesDialogOpen.set(true);
  }

  closeServerProfilesDialog(): void {
    this.isServerProfilesDialogOpen.set(false);
  }

  // --- Search Handling ---
  openSearchDialog(paneId: number): void {
    this.searchInitiatorPaneId.set(paneId);
    this.isSearchDialogOpen.set(true);
  }

  closeSearchDialog(): void {
    this.isSearchDialogOpen.set(false);
    this.searchInitiatorPaneId.set(null);
  }

  executeQuickSearch(paneId: number, query: string): void {
    this.searchInitiatorPaneId.set(paneId);
    this.executeSearch(query);
  }

  async executeSearch(query: string): Promise<void> {
    const paneId = this.searchInitiatorPaneId();
    if (!query || !paneId) {
      this.closeSearchDialog();
      return;
    }

    const path = paneId === 1 ? this.pane1Path() : this.pane2Path();
    const provider = this.getProviderForPath(path);
    const rootPathSegment = path.length > 0 ? path[0] : LOCAL_FS_ROOT_NAME;

    try {
      const results = await provider.search(query);
      
      const processedResults = results.map(r => ({
        ...r,
        path: [rootPathSegment, ...r.path]
      }));

      this.searchResultForPane.set({ id: paneId, results: processedResults });
    } catch (e) {
      console.error('Search failed', e);
      alert(`Search failed: ${(e as Error).message}`);
    } finally {
      this.closeSearchDialog();
    }
  }

  onSearchCompleted(): void {
    this.searchResultForPane.set(null);
  }
}
