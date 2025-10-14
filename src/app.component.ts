import { Component, ChangeDetectionStrategy, signal, computed, inject, effect, Renderer2, ElementRef, OnDestroy, Injector, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FileExplorerComponent, SearchResultNode } from './components/file-explorer/file-explorer.component.js';
import { SidebarComponent } from './components/sidebar/sidebar.component.js';
import { FileSystemNode } from './models/file-system.model.js';
import { FileSystemProvider, ItemReference } from './services/file-system-provider.js';
import { ServerProfilesDialogComponent } from './components/server-profiles-dialog/server-profiles-dialog.component.js';
import { ServerProfileService } from './services/server-profile.service.js';
import { SearchDialogComponent } from './components/search-dialog/search-dialog.component.js';
import { DetailPaneComponent } from './components/detail-pane/detail-pane.component.js';
import { ConvexDesktopService } from './services/convex-desktop.service.js';
import { ServerProfile } from './models/server-profile.model.js';
import { RemoteFileSystemService } from './services/remote-file-system.service.js';
import { FsService } from './services/fs.service.js';
import { ImageService } from './services/image.service.js';
import { ImageClientService } from './services/image-client.service.js';
import { LoginService } from './services/login.service.js';
import { User } from './models/user.model.js';

interface PanePath {
  id: number;
  path: string[];
}
type Theme = 'theme-light' | 'theme-steel' | 'theme-dark';
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

const THEME_STORAGE_KEY = 'file-explorer-theme';
const CONVEX_ROOT_NAME = 'Convex Pins';

const readOnlyProviderOps = {
  createDirectory: () => Promise.reject(new Error('Operation not supported.')),
  removeDirectory: () => Promise.reject(new Error('Operation not supported.')),
  createFile: () => Promise.reject(new Error('Operation not supported.')),
  deleteFile: () => Promise.reject(new Error('Operation not supported.')),
  rename: () => Promise.reject(new Error('Operation not supported.')),
  uploadFile: () => Promise.reject(new Error('Operation not supported.')),
  move: () => Promise.reject(new Error('Operation not supported.')),
  copy: () => Promise.reject(new Error('Operation not supported.')),
  search: () => Promise.resolve([] as SearchResultNode[]),
  // FIX: Added missing `getFileContent` to satisfy the FileSystemProvider interface.
  // The home provider is a virtual directory and has no files to get content from.
  getFileContent: () => Promise.reject(new Error('Operation not supported.')),
};

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
  private convexFs = inject(ConvexDesktopService);
  private profileService = inject(ServerProfileService);
  private fsService = inject(FsService);
  private imageClientService = inject(ImageClientService);
  private loginService = inject(LoginService);
  private injector = inject(Injector);
  private document = inject(DOCUMENT);
  private elementRef = inject(ElementRef);
  private homeProvider: FileSystemProvider;

  // --- State Management ---
  isSplitView = signal(false);
  activePaneId = signal(1);
  folderTree = signal<FileSystemNode | null>(null);
  isServerProfilesDialogOpen = signal(false);
  isThemeDropdownOpen = signal(false);
  isDetailPaneOpen = signal(false);
  selectedDetailItem = signal<FileSystemNode | null>(null);
  connectionStatus = signal<ConnectionStatus>('disconnected');
  
  // Keep track of each pane's path
  private panePaths = signal<PanePath[]>([{ id: 1, path: [] }]);

  // --- Mounted Profile State ---
  mountedProfiles = signal<ServerProfile[]>([]);
  mountedProfileUsers = signal<Map<string, User>>(new Map());
  mountedProfileIds = computed(() => this.mountedProfiles().map(p => p.id));
  private remoteProviders = signal<Map<string, RemoteFileSystemService>>(new Map());
  private remoteImageServices = signal<Map<string, ImageService>>(new Map());

  // FIX: Converted defaultImageService to a computed signal to prevent a startup crash.
  // This avoids a race condition by ensuring the ImageService is created only after
  // the active profile has been loaded from storage.
  defaultImageService = computed(() => {
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
    if (path.length === 0) return this.homeProvider;
    const root = path[0];
    if (root === CONVEX_ROOT_NAME) return this.convexFs;
    const remoteProvider = this.remoteProviders().get(root);
    if (remoteProvider) return remoteProvider;
    throw new Error(`No provider found for path: ${path.join('/')}`);
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
  
  activeProvider = computed(() => {
    const path = this.activePanePath();
    return this.getProviderForPath(path);
  });

  activeProviderPath = computed(() => {
    const path = this.activePanePath();
    // The path for the provider needs to be relative (without the root server name)
    return path.length > 0 ? path.slice(1) : [];
  });

  constructor() {
    this.loadTheme();

    this.homeProvider = {
      getContents: async (path: string[]) => {
        if (path.length > 0) return []; // Home has no subdirectories
        const convexRoot = await this.convexFs.getFolderTree();
        const remoteRoots = await Promise.all(
          Array.from(this.remoteProviders().values()).map((p: FileSystemProvider) => p.getFolderTree())
        );
        return [convexRoot, ...remoteRoots];
      },
      getFolderTree: async () => {
        const convexRoot = await this.convexFs.getFolderTree();
        const remoteRoots = await Promise.all(
          Array.from(this.remoteProviders().values()).map((p: FileSystemProvider) => p.getFolderTree())
        );
        return { name: 'Home', type: 'folder', children: [convexRoot, ...remoteRoots] };
      },
      ...readOnlyProviderOps
    };
    
    effect(() => {
      const theme = this.currentTheme();
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      this.document.body.className = theme;
    });
  }
  
  ngOnInit(): void {
    this.loadFolderTree();
    this.autoMountProfiles();
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
    
    try {
      const homeRoot = await this.homeProvider.getFolderTree();
      this.folderTree.set(homeRoot);
    } catch (e) {
      console.error('Failed to load a complete folder tree', e);
    }
  }
  
  // --- Profile Mounting ---
  private async autoMountProfiles(): Promise<void> {
    const profilesToMount = this.profileService.profiles().filter(p => p.autoConnect);
    if (profilesToMount.length === 0) {
      return;
    }

    this.connectionStatus.set('connecting');
    const mountPromises = profilesToMount.map(p => this.mountProfile(p));
    const results = await Promise.allSettled(mountPromises);

    const hasSuccessfulMount = results.some(r => r.status === 'fulfilled');

    if (hasSuccessfulMount) {
      this.connectionStatus.set('connected');
      await this.loadFolderTree();
    } else {
      this.connectionStatus.set('disconnected');
    }
  }
  
  private async mountProfile(profile: ServerProfile, user: User | null = null): Promise<void> {
    if (this.mountedProfiles().some(p => p.id === profile.id)) return;

    try {
      const provider = new RemoteFileSystemService(profile, this.fsService, user);
      const imageService = new ImageService(profile, this.imageClientService);

      // Test connection by fetching the root. If this fails, it throws.
      await provider.getFolderTree();

      this.remoteProviders.update(map => new Map(map).set(profile.name, provider));
      this.remoteImageServices.update(map => new Map(map).set(profile.name, imageService));
      this.mountedProfiles.update(profiles => [...profiles, profile]);
      this.profileService.setActiveProfile(profile.id);
    } catch (e) {
      console.error(`Failed to mount profile "${profile.name}":`, e);
      // Re-throw so the caller can handle the failure.
      throw e;
    }
  }
  
  async onLoginAndMount({ profile, username, password }: { profile: ServerProfile, username: string, password: string }): Promise<void> {
    this.connectionStatus.set('connecting');
    try {
      const user = await this.loginService.login(profile.brokerUrl, username, password);
      await this.mountProfile(profile, user);
      this.mountedProfileUsers.update(map => new Map(map).set(profile.id, user));
      this.connectionStatus.set('connected');
      await this.loadFolderTree();
    } catch (e) {
      alert(`Failed to connect to server "${profile.name}". Please check credentials and profile settings. Error: ${(e as Error).message}`);
      if (this.mountedProfiles().length === 0) {
        this.connectionStatus.set('disconnected');
      } else {
        this.connectionStatus.set('connected');
      }
    }
  }

  onUnmountProfile(profile: ServerProfile): void {
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
    this.mountedProfiles.update(profiles => {
      const remainingProfiles = profiles.filter(p => p.id !== profile.id);
      if (remainingProfiles.length === 0) {
        this.connectionStatus.set('disconnected');
      }
      return remainingProfiles;
    });
    this.mountedProfileUsers.update(map => {
      const newMap = new Map(map);
      newMap.delete(profile.id);
      return newMap;
    });
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
    const rootPathSegment = path.length > 0 ? path[0] : CONVEX_ROOT_NAME;

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
  
  async onLoadChildren(path: string[]): Promise<void> {
    const provider = this.getProviderForPath(path);
    // The path from the tree includes the root name (e.g., server name),
    // which the provider doesn't need in its own path context.
    const providerPath = path.slice(1);

    try {
      const children = await provider.getContents(providerPath);

      this.folderTree.update(root => {
        if (!root) return null;
        
        // Use a recursive function to find and update the node in a deep copy
        const findAndUpdate = (node: FileSystemNode, currentPath: string[]): FileSystemNode => {
          const newChildren = node.children?.map(child => {
            const childPath = [...currentPath, child.name];
            if (childPath.join('/') === path.join('/')) {
              return {
                ...child,
                childrenLoaded: true,
                children: children.map(grandchild =>
                  grandchild.type === 'folder'
                    ? { ...grandchild, children: [], childrenLoaded: false }
                    : grandchild
                ),
              };
            }
            if (path.join('/').startsWith(childPath.join('/'))) {
              return findAndUpdate(child, childPath);
            }
            return child;
          });
          return { ...node, children: newChildren };
        };
        
        return findAndUpdate(root, []);
      });

    } catch (e) {
      console.error(`Failed to load children for path ${path.join('/')}`, e);
    }
  }
}
