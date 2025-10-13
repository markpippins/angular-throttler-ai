import { Component, ChangeDetectionStrategy, signal, computed, inject, effect, Renderer2, ElementRef, OnDestroy, Injector, OnInit } from '@angular/core';
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
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FileExplorerComponent, SidebarComponent, ServerProfilesDialogComponent, SearchDialogComponent, DetailPaneComponent],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class AppComponent implements OnInit, OnDestroy {
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

  // FIX: Converted defaultImageService to a computed signal to prevent a startup crash.
  // This avoids a race condition by ensuring the ImageService is created only after
  // the active profile has been loaded from storage.
  private defaultImageService = computed(() => {
    const activeProfile = this.profileService.activeProfile();
    // If there's no active profile, create a temporary, non-functional one to prevent errors.
    const profile = activeProfile ?? { id: 'temp', name: 'Temp', brokerUrl: '', imageUrl: '' };
    return new ImageService(profile, this.imageClientService);
  });
  
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
    if (path.length === 0) return this.defaultImageService();
    const root = path[0];
    const remoteService = this.remoteImageServices().get(root);
    if (remoteService) return remoteService;
    return this.defaultImageService();
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
  }
  
  ngOnInit(): void {
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
      
      // FIX: Explicitly typing `provider` as `FileSystemProvider` resolves a type inference issue.
      const remoteRoots = await Promise.all(
        Array.from(this.remoteProviders().values()).map((provider: FileSystemProvider) => provider.getFolderTree())
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