

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
import { NewBookmark } from './models/bookmark.model.js';

interface PanePath {
  id: number;
  path: string[];
}
interface PaneStatus {
  selectedItemsCount: number;
  totalItemsCount: number;
  filteredItemsCount: number | null;
}
type Theme = 'theme-light' | 'theme-steel' | 'theme-dark';
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

const THEME_STORAGE_KEY = 'file-explorer-theme';
const LOCAL_ROOT_NAME = 'Session';

const readOnlyProviderOps = {
  createDirectory: () => Promise.reject(new Error('Operation not supported.')),
  removeDirectory: () => Promise.reject(new Error('Operation not supported.')),
  createFile: () => Promise.reject(new Error('Operation not supported.')),
  deleteFile: () => Promise.reject(new Error('Operation not supported.')),
  rename: () => Promise.reject(new Error('Operation not supported.')),
  uploadFile: () => Promise.reject(new Error('Operation not supported.')),
  move: () => Promise.reject(new Error('Operation not supported.')),
  copy: () => Promise.reject(new Error('Operation not supported.')),
  // FIX: Added missing `getFileContent` to satisfy the FileSystemProvider interface.
  // The home provider is a virtual directory and has no files to get content from.
  getFileContent: () => Promise.reject(new Error('Operation not supported.')),
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FileExplorerComponent, SidebarComponent, ServerProfilesDialogComponent, DetailPaneComponent, ToolbarComponent],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class AppComponent implements OnInit, OnDestroy {
  private sessionFs = inject(SessionService);
  private profileService = inject(ServerProfileService);
  private fsService = inject(FsService);
  private imageClientService = inject(ImageClientService);
  private loginService = inject(LoginService);
  private preferencesService = inject(PreferencesService);
  private clipboardService = inject(ClipboardService);
  private bookmarkService = inject(BookmarkService);
  private injector = inject(Injector);
  private document: Document = inject(DOCUMENT);
  private renderer = inject(Renderer2);
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
  refreshPanes = signal(0);
  
  // Keep track of each pane's path
  private panePaths = signal<PanePath[]>([{ id: 1, path: [LOCAL_ROOT_NAME] }]);

  // --- Mounted Profile State ---
  mountedProfiles = signal<ServerProfile[]>([]);
  mountedProfileUsers = signal<Map<string, User>>(new Map());
  mountedProfileIds = computed(() => this.mountedProfiles().map(p => p.id));
  private remoteProviders = signal<Map<string, RemoteFileSystemService>>(new Map());
  private remoteImageServices = signal<Map<string, ImageService>>(new Map());

  defaultImageService = computed(() => {
    const activeProfile = this.profileService.activeProfile();
    const profile = activeProfile ?? { id: 'temp', name: 'Temp', brokerUrl: '', imageUrl: '' };
    return new ImageService(profile, this.imageClientService, this.preferencesService);
  });
  
  // --- Status Bar State ---
  private pane1Status = signal<PaneStatus>({ selectedItemsCount: 0, totalItemsCount: 0, filteredItemsCount: null });
  private pane2Status = signal<PaneStatus>({ selectedItemsCount: 0, totalItemsCount: 0, filteredItemsCount: null });
  
  activePaneStatus = computed<PaneStatus>(() => {
    const activeId = this.activePaneId();
    if (activeId === 1) {
      return this.pane1Status();
    }
    return this.pane2Status();
  });
  
  // --- Theme Management ---
  currentTheme = signal<Theme>('theme-light');
  themeMenuPosition = signal({ x: 0, y: 0 });
  themes: {id: Theme, name: string}[] = [
    { id: 'theme-light', name: 'Light' },
    { id: 'theme-steel', name: 'Steel' },
    { id: 'theme-dark', name: 'Dark' },
  ];

  activePanePath = computed(() => {
    const activeId = this.activePaneId();
    const activePane = this.panePaths().find(p => p.id === activeId);
    return activePane ? activePane.path : [];
  });
  
  pane1Path = computed(() => this.panePaths().find(p => p.id === 1)?.path ?? []);
  pane2Path = computed(() => this.panePaths().find(p => p.id === 2)?.path ?? []);

  // --- Pane Resizing State ---
  pane1Width = signal(50); // Initial width as percentage
  isResizingPanes = signal(false);
  private unlistenPaneMouseMove: (() => void) | null = null;
  private unlistenPaneMouseUp: (() => void) | null = null;
  
  @ViewChild('paneContainer') paneContainerEl!: ElementRef<HTMLDivElement>;

  // --- Computed Per-Pane Services ---
  public getProviderForPath(path: string[]): FileSystemProvider {
    if (path.length === 0) return this.homeProvider;
    const root = path[0];
    if (root === LOCAL_ROOT_NAME) return this.sessionFs;
    const remoteProvider = this.remoteProviders().get(root);
    if (remoteProvider) return remoteProvider;
    throw new Error(`No provider found for path: ${path.join('/')}`);
  }
  public getProvider: (path: string[]) => FileSystemProvider;
  
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
  
  activeProvider = computed(() => {
    const path = this.activePanePath();
    return this.getProviderForPath(path);
  });

  activeProviderPath = computed(() => {
    const path = this.activePanePath();
    return path.length > 0 ? path.slice(1) : [];
  });

  // --- Global Toolbar State ---
  toolbarAction = signal<{ name: string, payload?: any, id: number } | null>(null);
  
  pane1SortCriteria = signal<SortCriteria>({ key: 'name', direction: 'asc' });
  pane2SortCriteria = signal<SortCriteria>({ key: 'name', direction: 'asc' });
  activeSortCriteria = computed(() => this.activePaneId() === 1 ? this.pane1SortCriteria() : this.pane2SortCriteria());

  pane1DisplayMode = signal<'grid' | 'list'>('grid');
  pane2DisplayMode = signal<'grid' | 'list'>('grid');
  activeDisplayMode = computed(() => this.activePaneId() === 1 ? this.pane1DisplayMode() : this.pane2DisplayMode());
  
  pane1FilterQuery = signal('');
  pane2FilterQuery = signal('');
  activeFilterQuery = computed(() => this.activePaneId() === 1 ? this.pane1FilterQuery() : this.pane2FilterQuery());

  canCutCopyShareDelete = computed(() => this.activePaneStatus().selectedItemsCount > 0);
  canRename = computed(() => this.activePaneStatus().selectedItemsCount === 1);
  canPaste = computed(() => !!this.clipboardService.clipboard());

  constructor() {
    this.loadTheme();
    this.getProvider = this.getProviderForPath.bind(this);

    this.homeProvider = {
      getContents: async (path: string[]) => {
        if (path.length > 0) return [];
        const localRoot = await this.sessionFs.getFolderTree();
        const remoteRoots = await Promise.all(
          Array.from(this.remoteProviders().values()).map((p: FileSystemProvider) => p.getFolderTree())
        );
        return [localRoot, ...remoteRoots];
      },
      getFolderTree: async () => {
        const localRoot = await this.sessionFs.getFolderTree();
        const remoteRoots = await Promise.all(
          Array.from(this.remoteProviders().values()).map((p: FileSystemProvider) => p.getFolderTree())
        );
        return { name: 'Home', type: 'folder', children: [localRoot, ...remoteRoots] };
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
    this.stopPaneResize();
  }

  loadTheme(): void {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
      if (storedTheme && this.themes.some(t => t.id === storedTheme)) {
        this.currentTheme.set(storedTheme);
      } else {
        this.currentTheme.set('theme-light');
      }
    } catch (e) {
      console.error('Failed to load theme from localStorage', e);
      this.currentTheme.set('theme-light');
    }
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    this.isThemeDropdownOpen.set(false);
  }

  openThemeMenu(event: MouseEvent): void {
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.themeMenuPosition.set({ x: rect.left, y: rect.bottom + 5 });
    this.isThemeDropdownOpen.update(v => !v);
  }
  
  onDocumentClick(event: Event): void {
    if (this.isThemeDropdownOpen()) {
      this.isThemeDropdownOpen.set(false);
    }
  }

  async loadFolderTree(): Promise<void> {
    this.folderTree.set(null);
    
    try {
      const homeRoot = await this.homeProvider.getFolderTree();
      this.folderTree.set(homeRoot);
    } catch (e) {
      console.error('Failed to load a complete folder tree', e);
    }
  }
  
  private async autoMountProfiles(): Promise<void> {
    const profilesToMount = this.profileService.profiles().filter(p => p.autoConnect);
    if (profilesToMount.length === 0) return;

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
      const imageService = new ImageService(profile, this.imageClientService, this.preferencesService);
      await provider.getFolderTree();

      this.remoteProviders.update(map => new Map(map).set(profile.name, provider));
      this.remoteImageServices.update(map => new Map(map).set(profile.name, imageService));
      this.mountedProfiles.update(profiles => [...profiles, profile]);
      this.profileService.setActiveProfile(profile.id);
    } catch (e) {
      console.error(`Failed to mount profile "${profile.name}":`, e);
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
  
  onPane1StatusChanged(status: PaneStatus): void {
    this.pane1Status.set(status);
  }

  onPane2StatusChanged(status: PaneStatus): void {
    this.pane2Status.set(status);
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
  
  async onLoadChildren(path: string[]): Promise<void> {
    const provider = this.getProviderForPath(path);
    const providerPath = path.slice(1);

    try {
      const children = await provider.getContents(providerPath);
      this.folderTree.update(root => {
        if (!root) return null;
        
        const findAndUpdate = (node: FileSystemNode, currentPath: string[]): FileSystemNode => {
          const newChildren = node.children?.map(child => {
            const childPath = [...currentPath, child.name];
            if (childPath.join('/') === path.join('/')) {
              return { ...child, childrenLoaded: true, children: children.map(grandchild => grandchild.type === 'folder' ? { ...grandchild, children: [], childrenLoaded: false } : grandchild) };
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

  async onSidebarItemsMoved({ destPath, payload }: { destPath: string[]; payload: DragDropPayload }): Promise<void> {
    if (payload.type !== 'filesystem') return;
    const { sourceProvider, sourcePath, items } = payload.payload;
    const itemRefs = items.map(i => ({ name: i.name, type: i.type }));
    
    const sourceProviderPath = sourcePath.length > 0 ? sourcePath.slice(1) : [];
    const destProviderPath = destPath.length > 0 ? destPath.slice(1) : [];

    try {
      await sourceProvider.move(sourceProviderPath, destProviderPath, itemRefs);
    } catch (e) {
      alert(`Move failed: ${(e as Error).message}`);
    } finally {
      await this.loadFolderTree();
      this.refreshPanes.update(v => v + 1);
    }
  }

  startPaneResize(event: MouseEvent): void {
    if (!this.isSplitView()) return;
    
    this.isResizingPanes.set(true);
    const container = this.paneContainerEl.nativeElement;
    const containerRect = container.getBoundingClientRect();

    event.preventDefault();
    this.renderer.setStyle(this.document.body, 'user-select', 'none');

    this.unlistenPaneMouseMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
        const mouseX = e.clientX - containerRect.left;
        let newWidthPercent = (mouseX / containerRect.width) * 100;

        const minWidthPercent = 20;
        const maxWidthPercent = 80;
        if (newWidthPercent < minWidthPercent) newWidthPercent = minWidthPercent;
        if (newWidthPercent > maxWidthPercent) newWidthPercent = maxWidthPercent;

        this.pane1Width.set(newWidthPercent);
    });
    
    this.unlistenPaneMouseUp = this.renderer.listen('document', 'mouseup', () => {
        this.stopPaneResize();
    });
  }

  private stopPaneResize(): void {
    if (!this.isResizingPanes()) return;
    this.isResizingPanes.set(false);
    this.renderer.removeStyle(this.document.body, 'user-select');
    if (this.unlistenPaneMouseMove) {
        this.unlistenPaneMouseMove();
        this.unlistenPaneMouseMove = null;
    }
    if (this.unlistenPaneMouseUp) {
        this.unlistenPaneMouseUp();
        this.unlistenPaneMouseUp = null;
    }
  }
  
  onToolbarAction(name: string, payload?: any) {
    this.toolbarAction.set({ name, payload, id: Date.now() });
  }

  onSortChange(criteria: SortCriteria) {
    if (this.activePaneId() === 1) {
      this.pane1SortCriteria.set(criteria);
    } else {
      this.pane2SortCriteria.set(criteria);
    }
  }

  onDisplayModeChange(mode: 'grid' | 'list') {
    if (this.activePaneId() === 1) {
      this.pane1DisplayMode.set(mode);
    } else {
      this.pane2DisplayMode.set(mode);
    }
  }
  
  onFilterChange(query: string) {
    if (this.activePaneId() === 1) {
      this.pane1FilterQuery.set(query);
    } else {
      this.pane2FilterQuery.set(query);
    }
  }
  
  onSaveBookmark(bookmark: NewBookmark): void {
    const path = this.activePanePath();
    this.bookmarkService.addBookmark(path, bookmark);
  }

  onBookmarkDroppedOnPane(event: { bookmark: NewBookmark, dropOn: FileSystemNode }): void {
    const path = this.activePaneId() === 1 ? this.pane1Path() : this.pane2Path();
    const destPath = [...path, event.dropOn.name];
    this.bookmarkService.addBookmark(destPath, event.bookmark);
  }

  onBookmarkDroppedOnSidebar(event: { bookmark: NewBookmark, destPath: string[] }): void {
    this.bookmarkService.addBookmark(event.destPath, event.bookmark);
  }
  
  // --- Sidebar Context Menu Actions ---
  private async performTreeAction(path: string[], action: (provider: FileSystemProvider, providerPath: string[]) => Promise<any>) {
    try {
      const provider = this.getProviderForPath(path);
      const providerPath = path.slice(1);
      await action(provider, providerPath);
    } catch(e) {
      alert(`Operation failed: ${(e as Error).message}`);
    } finally {
      await this.loadFolderTree();
      this.refreshPanes.update(v => v + 1);
    }
  }

  async onSidebarRenameItem({ path, newName }: { path: string[]; newName: string }): Promise<void> {
    const oldName = path[path.length - 1];
    const parentPath = path.slice(0, -1);
    await this.performTreeAction(parentPath, (provider, providerPath) => 
      provider.rename(providerPath, oldName, newName)
    );
  }

  async onSidebarDeleteItem(path: string[]): Promise<void> {
    const name = path[path.length - 1];
    const parentPath = path.slice(0, -1);
    await this.performTreeAction(parentPath, (provider, providerPath) => 
      provider.removeDirectory(providerPath, name) // Tree only has directories
    );
  }

  async onSidebarNewFolder({ path, name }: { path: string[]; name: string }): Promise<void> {
    await this.performTreeAction(path, (provider, providerPath) => 
      provider.createDirectory(providerPath, name)
    );
  }

  async onSidebarNewFile({ path, name }: { path: string[]; name: string }): Promise<void> {
     await this.performTreeAction(path, (provider, providerPath) => 
      provider.createFile(providerPath, name)
    );
  }
}