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
import { ToastsComponent } from './components/toasts/toasts.component.js';
import { ToastService } from './services/toast.service.js';
import { WebviewDialogComponent } from './components/webview-dialog/webview-dialog.component.js';
import { WebviewService } from './services/webview.service.js';
import { LocalConfigDialogComponent } from './components/local-config-dialog/local-config-dialog.component.js';
import { LocalConfig, LocalConfigService } from './services/local-config.service.js';
import { LoginDialogComponent } from './components/login-dialog/login-dialog.component.js';
import { Theme, UiPreferencesService } from './services/ui-preferences.service.js';
import { RssFeedsDialogComponent } from './components/rss-feeds-dialog/rss-feeds-dialog.component.js';
import { ImportDialogComponent } from './components/import-dialog/import-dialog.component.js';
import { ExportDialogComponent } from './components/export-dialog/export-dialog.component.js';
import { FolderPropertiesService } from './services/folder-properties.service.js';
import { NoteDialogService } from './services/note-dialog.service.js';
import { NoteViewDialogComponent } from './components/note-view-dialog/note-view-dialog.component.js';

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
  // FIX: Added missing `getFileContent` to satisfy the FileSystemProvider interface.
  // The home provider is a virtual directory and has no files to get content from.
  getFileContent: () => Promise.reject(new Error('Operation not supported.')),
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FileExplorerComponent, SidebarComponent, ServerProfilesDialogComponent, DetailPaneComponent, ToolbarComponent, ToastsComponent, WebviewDialogComponent, LocalConfigDialogComponent, LoginDialogComponent, RssFeedsDialogComponent, ImportDialogComponent, ExportDialogComponent, NoteViewDialogComponent],
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
  private noteDialogService = inject(NoteDialogService);
  private folderPropertiesService = inject(FolderPropertiesService);
  private injector = inject(Injector);
  private document: Document = inject(DOCUMENT);
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);
  private uiPreferencesService = inject(UiPreferencesService);
  private homeProvider: FileSystemProvider;

  // --- State Management ---
  isSplitView = signal(false);
  activePaneId = signal(1);
  folderTree = signal<FileSystemNode | null>(null);
  isServerProfilesDialogOpen = signal(false);
  isLocalConfigDialogOpen = signal(false);
  isRssFeedsDialogOpen = signal(false);
  isImportDialogOpen = signal(false);
  isExportDialogOpen = signal(false);
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
  
  // Keep track of each pane's path
  private panePaths = signal<PanePath[]>([{ id: 1, path: [] }]);

  // --- Dialog Control State ---
  profileForLogin = signal<ServerProfile | null>(null);
  profileForEdit = signal<ServerProfile | null>(null);

  // --- Mounted Profile State ---
  mountedProfiles = signal<ServerProfile[]>([]);
  mountedProfileUsers = signal<Map<string, User>>(new Map());
  mountedProfileIds = computed(() => this.mountedProfiles().map(p => p.id));
  private remoteProviders = signal<Map<string, RemoteFileSystemService>>(new Map());
  private remoteImageServices = signal<Map<string, ImageService>>(new Map());
  
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
  currentTheme = this.uiPreferencesService.theme;
  themes: {id: Theme, name: string}[] = [
    { id: 'theme-light', name: 'Light' },
    { id: 'theme-steel', name: 'Steel' },
    { id: 'theme-dark', name: 'Dark' },
  ];
  isThemeDropdownOpen = signal(false);
  themeMenuPosition = signal({ top: '0px', left: '0px' });

  activePanePath = computed(() => {
    const activeId = this.activePaneId();
    const activePane = this.panePaths().find(p => p.id === activeId);
    return activePane ? activePane.path : [];
  });

  // --- Address Bar State ---
  activeRootName = signal('...');
  activeDisplayPath = computed(() => {
    const p = this.activePanePath();
    const providerPath = p.length > 0 ? p.slice(1) : [];
    return providerPath.map(segment => 
      segment.endsWith('.magnet') ? segment.slice(0, -7) : segment
    );
  });
  canGoUpActivePane = computed(() => this.activePanePath().length > 1);
  
  pane1Path = computed(() => this.panePaths().find(p => p.id === 1)?.path ?? []);
  pane2Path = computed(() => this.panePaths().find(p => p.id === 2)?.path ?? []);

  // --- Pane Resizing State ---
  pane1Width = signal(this.uiPreferencesService.splitViewPaneWidth() ?? 50);
  isResizingPanes = signal(false);
  private unlistenPaneMouseMove: (() => void) | null = null;
  private unlistenPaneMouseUp: (() => void) | null = null;
  
  @ViewChild('paneContainer') paneContainerEl!: ElementRef<HTMLDivElement>;

  // --- Computed Per-Pane Services ---
  public getProviderForPath(path: string[]): FileSystemProvider {
    if (path.length === 0) return this.homeProvider;
    const root = path[0];
    if (root === this.localConfigService.sessionName()) return this.sessionFs;
    const remoteProvider = this.remoteProviders().get(root);
    if (remoteProvider) return remoteProvider;
    // For unmounted providers, we can return a dummy read-only one.
    // This allows operations like getting the name to succeed without being connected.
    if (this.profileService.profiles().some(p => p.name === root)) {
      return {
        ...readOnlyProviderOps,
        getFolderTree: () => Promise.resolve({ name: root, type: 'folder' }),
        getContents: () => Promise.resolve([])
      };
    }
    throw new Error(`No provider found for path: ${path.join('/')}`);
  }
  public getProvider: (path: string[]) => FileSystemProvider;
  
  public getImageServiceForPath(path: string[]): ImageService {
    if (path.length === 0) {
      const homeProfileStub = {
          id: 'home-view',
          name: 'Home',
          brokerUrl: '',
          imageUrl: this.localConfigService.defaultImageUrl()
      };
      return new ImageService(homeProfileStub, this.imageClientService, this.preferencesService);
    }
    const root = path[0];
    const remoteService = this.remoteImageServices().get(root);
    if (remoteService) return remoteService;
    
    // For local session
    if (root === this.localConfigService.sessionName()) {
      const localProfileStub = {
          id: 'local-session',
          name: this.localConfigService.sessionName(),
          brokerUrl: '',
          imageUrl: this.localConfigService.defaultImageUrl()
      };
      return new ImageService(localProfileStub, this.imageClientService, this.preferencesService);
    }

    // For unmounted remote profiles, create a temporary image service with fallback.
    const profile = this.profileService.profiles().find(p => p.name === root);
    if (profile) {
        const imageUrl = profile.imageUrl || this.localConfigService.defaultImageUrl();
        const tempProfileWithImage = { ...profile, imageUrl };
        return new ImageService(tempProfileWithImage, this.imageClientService, this.preferencesService);
    }
    return this.defaultImageService;
  }
  public getImageService: (path: string[]) => ImageService;

  private defaultImageService = new ImageService({ id: 'temp', name: 'Temp', brokerUrl: '', imageUrl: '' }, this.imageClientService, this.preferencesService);

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

  // --- Webview Dialog State ---
  webviewContent = this.webviewService.viewRequest;

  // --- Note View Dialog State ---
  noteDialogContent = this.noteDialogService.viewRequest;

  // --- Specific node for import/export dialogs ---
  localSessionNode = computed(() => {
    const sessionName = this.localConfigService.sessionName();
    return this.folderTree()?.children?.find(c => c.name === sessionName) ?? null;
  });

  constructor() {
    this.getProvider = this.getProviderForPath.bind(this);
    this.getImageService = this.getImageServiceForPath.bind(this);

    this.homeProvider = {
      getContents: async (path: string[]) => {
        if (path.length > 0) return [];

        const localRoot = await this.sessionFs.getFolderTree();
        const serverProfileNodes: FileSystemNode[] = this.profileService.profiles().map(p => ({
            name: p.name,
            type: 'folder',
            children: [],
            childrenLoaded: false,
            isServerRoot: true,
            profileId: p.id,
            connected: this.mountedProfileIds().includes(p.id)
        }));
        
        return [localRoot, ...serverProfileNodes];
      },
      getFolderTree: async () => {
        const children = await this.homeProvider.getContents([]);
        return { name: 'Home', type: 'folder', children };
      },
      ...readOnlyProviderOps
    };
    
    effect(() => {
      const provider = this.activeProvider();
      if (provider) {
        provider.getFolderTree()
          .then(root => this.activeRootName.set(root.name))
          .catch(err => {
            console.error('Failed to get root name for active pane', err);
            this.activeRootName.set('Error');
          });
      }
    }, { allowSignalWrites: true });

    effect(() => {
      this.document.body.className = this.currentTheme();
    });
    
    // When profiles change, or local config name changes, reload the tree
    effect(() => {
        this.profileService.profiles();
        this.localConfigService.sessionName();
        this.mountedProfileIds();
        this.loadFolderTree();
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

  setTheme(theme: Theme): void {
    this.uiPreferencesService.setTheme(theme);
    this.isThemeDropdownOpen.set(false);
  }

  openThemeMenu(event: MouseEvent): void {
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.themeMenuPosition.set({
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
    });
    this.isThemeDropdownOpen.set(true);
  }
  
  onDocumentClick(event: Event): void {
    if (this.isThemeDropdownOpen()) {
        const themeMenu = this.elementRef.nativeElement.querySelector('.theme-menu');
        if (themeMenu && !themeMenu.contains(event.target)) {
            this.isThemeDropdownOpen.set(false);
        }
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
    } else {
      this.connectionStatus.set('disconnected');
    }
  }
  
  private async mountProfile(profile: ServerProfile, user: User | null = null): Promise<void> {
    if (this.mountedProfiles().some(p => p.id === profile.id)) return;

    try {
      const provider = new RemoteFileSystemService(profile, this.fsService, user);
      const imageUrl = profile.imageUrl || this.localConfigService.defaultImageUrl();
      const profileForImageService = { ...profile, imageUrl };
      const imageService = new ImageService(profileForImageService, this.imageClientService, this.preferencesService);

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
      const user = await this.loginService.login(profile, username, password);
      await this.mountProfile(profile, user);
      this.mountedProfileUsers.update(map => new Map(map).set(profile.id, user));
      this.connectionStatus.set('connected');
    } catch (e) {
      const errorMessage = `Login failed for "${profile.name}": ${(e as Error).message}`;
      this.toastService.show(errorMessage, 'error', 8000);
      if (this.mountedProfiles().length === 0) {
        this.connectionStatus.set('disconnected');
      } else {
        this.connectionStatus.set('connected');
      }
    }
  }

  onLoginSubmittedFromSidebar({ username, password }: { username: string, password: string }): void {
    const profile = this.profileForLogin();
    if (profile) {
      this.onLoginAndMount({ profile, username, password });
    }
    this.profileForLogin.set(null); // Close dialog on submit
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
  
  // --- Pane Visibility Toggles ---
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

  toggleDetailPane(): void {
    this.uiPreferencesService.toggleDetailPane();
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
  
  goUpActivePane(): void {
    if (this.canGoUpActivePane()) {
      const newPath = this.activePanePath().slice(0, -1);
      this.updatePanePath(this.activePaneId(), newPath);
    }
  }

  navigatePathActivePane(displayIndex: number): void {
    // For root, index is -1. `slice(0, 1)` gives the first segment.
    // For first segment, index is 0. `slice(0, 2)` gives first two segments.
    const newPath = this.activePanePath().slice(0, displayIndex + 2);
    this.updatePanePath(this.activePaneId(), newPath);
  }

  triggerRefresh(): void {
    this.refreshPanes.update(v => v + 1);
  }
  
  onSidebarNavigation(path: string[]): void {
    this.updatePanePath(this.activePaneId(), path);
  }

  openServerProfilesDialog(): void {
    this.isServerProfilesDialogOpen.set(true);
  }

  closeServerProfilesDialog(): void {
    this.isServerProfilesDialogOpen.set(false);
    this.profileForEdit.set(null); // Reset after closing
  }
  
  openLocalConfigDialog(): void {
    this.isLocalConfigDialogOpen.set(true);
  }

  closeLocalConfigDialog(): void {
    this.isLocalConfigDialogOpen.set(false);
  }
  
  openRssFeedsDialog(): void {
    this.isRssFeedsDialogOpen.set(true);
  }

  closeRssFeedsDialog(): void {
    this.isRssFeedsDialogOpen.set(false);
  }
  
  onLocalConfigSaved(config: LocalConfig): void {
    this.localConfigService.updateConfig(config);
    this.toastService.show('Local configuration saved.');
    this.closeLocalConfigDialog();
  }

  async onLoadChildren(path: string[]): Promise<void> {
    const rootNode = this.folderTree();
    if (!rootNode) return;

    // Find the node that was expanded in the tree
    let targetNode: FileSystemNode | undefined = rootNode;
    for (const segment of path) {
        targetNode = targetNode?.children?.find(c => c.name === segment);
    }

    if (targetNode?.isServerRoot && !targetNode.connected) {
      this.toastService.show(`"${targetNode.name}" is not connected.`, 'info');
      return;
    }

    const provider = this.getProviderForPath(path);
    const providerPath = path.slice(1);

    try {
      const children = await provider.getContents(providerPath);
      this.folderTree.update(currentRoot => {
        if (!currentRoot) return null;
        
        const findAndUpdate = (node: FileSystemNode, currentPath: string[]): FileSystemNode => {
          if (currentPath.join('/') === path.join('/')) {
             return { ...node, childrenLoaded: true, children: children.map(grandchild => grandchild.type === 'folder' ? { ...grandchild, children: [], childrenLoaded: false } : grandchild) };
          }
          if (!node.children) {
            return node;
          }
          const newChildren = node.children.map(child => {
            const childPath = [...currentPath, child.name];
            if (path.join('/').startsWith(childPath.join('/'))) {
              return findAndUpdate(child, childPath);
            }
            return child;
          });
          return { ...node, children: newChildren };
        };
        
        return findAndUpdate(currentRoot, []);
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
    this.uiPreferencesService.setSplitViewPaneWidth(this.pane1Width());
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
    if (!this.isDetailPaneOpen()) {
      const truncatedTitle = bookmark.title.length > 30 ? `${bookmark.title.substring(0, 27)}...` : bookmark.title;
      this.toastService.show(`Saved "${truncatedTitle}"`);
    }
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
      this.refreshPanes.update(v => v + 1);
    }
  }

  private updatePathsAfterRename(oldPath: string[], newPath: string[]): void {
    const oldPathString = oldPath.join('/');
    this.panePaths.update(paths => {
        return paths.map(panePath => {
            const currentPathString = panePath.path.join('/');
            if (currentPathString === oldPathString) {
                // This pane was viewing the renamed folder directly
                return { ...panePath, path: newPath };
            }
            if (currentPathString.startsWith(oldPathString + '/')) {
                // This pane was viewing a subfolder of the renamed folder
                const subPath = panePath.path.slice(oldPath.length);
                return { ...panePath, path: [...newPath, ...subPath] };
            }
            return panePath;
        });
    });
  }

  async onPaneItemRenamed({ oldName, newName }: { oldName: string, newName: string }, parentPath: string[]): Promise<void> {
    const oldFullPath = [...parentPath, oldName];
    const newFullPath = [...parentPath, newName];
    await this.folderPropertiesService.handleRename(oldFullPath, newFullPath);
    this.updatePathsAfterRename(oldFullPath, newFullPath);
    // Refresh the tree to reflect the change.
    this.loadFolderTree();
  }

  async onSidebarRenameItem({ path, newName }: { path: string[]; newName: string }): Promise<void> {
    const oldName = path[path.length - 1];
    const parentPath = path.slice(0, -1);
    try {
      const provider = this.getProviderForPath(parentPath);
      const providerPath = parentPath.slice(1);
      await provider.rename(providerPath, oldName, newName);

      const newFullPath = [...parentPath, newName];
      await this.folderPropertiesService.handleRename(path, newFullPath);
      this.updatePathsAfterRename(path, newFullPath);
    } catch(e) {
      alert(`Operation failed: ${(e as Error).message}`);
    } finally {
      // The panes will update reactively because their `path` input changes.
    }
  }

  async onSidebarDeleteItem(path: string[]): Promise<void> {
    const name = path[path.length - 1];
    const parentPath = path.slice(0, -1);
    await this.performTreeAction(parentPath, async (provider, providerPath) => {
      await provider.removeDirectory(providerPath, name); // Tree only has directories
      await this.folderPropertiesService.handleDelete(path);
    });
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
  
  onConnectToServer(profileId: string): void {
    const profile = this.profileService.profiles().find(p => p.id === profileId);
    if (profile) {
      this.profileForLogin.set(profile);
    }
  }

  onDisconnectFromServer(profileId: string): void {
    const profile = this.profileService.profiles().find(p => p.id === profileId);
    if (profile) {
      this.onUnmountProfile(profile);
    }
  }

  onEditServerProfile(profileId: string): void {
    const profile = this.profileService.profiles().find(p => p.id === profileId);
    if (profile) {
      this.profileForEdit.set(profile);
      this.openServerProfilesDialog();
    }
  }

  async onServerProfileRenamed({ oldName, newName, profile }: { oldName: string, newName: string, profile: ServerProfile }): Promise<void> {
    const oldPath = [oldName];
    const newPath = [newName];
    await this.folderPropertiesService.handleRename(oldPath, newPath);
    
    // 1. Update pane paths that were pointing to the old profile name.
    this.panePaths.update(paths => {
      return paths.map(panePath => {
        if (panePath.path.length > 0 && panePath.path[0] === oldName) {
          const newPath = [newName, ...panePath.path.slice(1)];
          return { ...panePath, path: newPath };
        }
        return panePath;
      });
    });

    // 2. If the profile was mounted, update the provider maps and the mountedProfiles array.
    if (this.mountedProfileIds().includes(profile.id)) {
      if (this.remoteProviders().has(oldName)) {
        // Recreate the provider with the updated profile.
        // We must fetch the user associated with this mounted profile.
        const user = this.mountedProfileUsers().get(profile.id) ?? null;
        const newProvider = new RemoteFileSystemService(profile, this.fsService, user);

        // Re-key the map with the new provider instance.
        this.remoteProviders.update(map => {
          const newMap = new Map(map);
          newMap.set(newName, newProvider);
          newMap.delete(oldName);
          return newMap;
        });
      }

      // Image service must be recreated as its profile is private.
      if (this.remoteImageServices().has(oldName)) {
        const imageUrl = profile.imageUrl || this.localConfigService.defaultImageUrl();
        const profileForImageService = { ...profile, imageUrl };
        const newImageService = new ImageService(profileForImageService, this.imageClientService, this.preferencesService);
        this.remoteImageServices.update(map => {
            const newMap = new Map(map);
            newMap.set(newName, newImageService);
            newMap.delete(oldName);
            return newMap;
        });
      }
      
      // Also update the mountedProfiles signal to ensure its data is not stale.
      this.mountedProfiles.update(profiles => 
        profiles.map(p => p.id === profile.id ? profile : p)
      );
    }
  }

  // --- Import/Export ---
  handleExport({ node, path }: { node: FileSystemNode; path: string[] }): void {
    const jsonString = JSON.stringify(node, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = path.length > 0 ? path.join('_') + '.json' : 'local_session_export.json';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.isExportDialogOpen.set(false);
    this.toastService.show(`Exported ${filename}`);
  }

  async handleImport({ destPath, data }: { destPath: string[]; data: FileSystemNode }): Promise<void> {
    try {
      await this.sessionFs.importTree(destPath, data);
      this.isImportDialogOpen.set(false);
      // FIX: Replace `Array.prototype.at()` with `array[array.length - 1]` for compatibility with older TypeScript targets.
      this.toastService.show(`Successfully imported into "${destPath.length > 0 ? destPath[destPath.length - 1] : await this.sessionFs.getFolderTree().then(t => t.name)}".`);
      await this.loadFolderTree();
      this.refreshPanes.update(v => v + 1);
    } catch (e) {
      this.toastService.show(`Import failed: ${(e as Error).message}`, 'error');
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Handle F-key pane toggles first, as they should work anywhere.
    switch(event.key) {
      case 'F7':
        event.preventDefault();
        this.toggleTree();
        return;
      case 'F8':
        event.preventDefault();
        this.toggleChat();
        return;
      case 'F9':
        event.preventDefault();
        this.toggleNotes();
        return;
      case 'F10':
        event.preventDefault();
        this.toggleStream();
        return;
      case 'F11':
        event.preventDefault();
        this.toggleSavedItems();
        return;
      case 'F12':
        event.preventDefault();
        this.toggleRssFeed();
        return;
    }
    
    // Handle high-priority Escape key presses for modals.
    if (event.key === 'Escape') {
      if (this.isThemeDropdownOpen()) {
        event.preventDefault();
        this.isThemeDropdownOpen.set(false);
        return;
      }
      if (this.isExportDialogOpen()) {
        event.preventDefault();
        this.isExportDialogOpen.set(false);
        return;
      }
      if (this.isImportDialogOpen()) {
        event.preventDefault();
        this.isImportDialogOpen.set(false);
        return;
      }
      if (this.profileForLogin()) {
        event.preventDefault();
        this.profileForLogin.set(null);
        return;
      }
       if (this.isRssFeedsDialogOpen()) {
        event.preventDefault();
        this.closeRssFeedsDialog();
        return;
      }
      if (this.webviewContent()) {
        event.preventDefault();
        this.webviewService.close();
        return;
      }
      if (this.noteDialogContent()) {
        event.preventDefault();
        this.noteDialogService.close();
        return;
      }
      if (this.isLocalConfigDialogOpen()) {
        event.preventDefault();
        this.closeLocalConfigDialog();
        return;
      }
      if (this.isServerProfilesDialogOpen()) {
        event.preventDefault(); // prevent any other default browser behavior
        this.closeServerProfilesDialog();
        return; // Action handled, stop further processing
      }
    }

    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isRenameInput = target.classList.contains('rename-input');

    if (isRenameInput) {
      return; // Let rename input handle its own keys.
    }

    // Handle keys that should be blocked if an input is focused.
    if (event.key === 'F2') {
      if (isInput) return; // Don't trigger rename if any other input is focused.
      if (this.canRename()) {
        event.preventDefault();
        this.onToolbarAction('rename');
      }
      return;
    }
    
    if (event.altKey && event.key === 'Enter') {
        if (isInput) return;
        if (this.canRename()) { // canRename implies one item selected
            event.preventDefault();
            this.onToolbarAction('properties');
        }
        return;
    }

    // New File: Ctrl+Alt+N - should work anywhere
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        this.onToolbarAction('newFile');
        return;
    }
    
    // Toggle Split View: Ctrl+\ - should work anywhere
    if (event.ctrlKey && event.key === '\\') {
        event.preventDefault();
        this.toggleSplitView();
        return;
    }

    // Toggle Details Pane: Ctrl+Shift+D - should work anywhere
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        this.toggleDetailPane();
        return;
    }

    if (isInput) {
      if (event.key === 'F5') { // Allow refresh from inputs.
        event.preventDefault();
        this.triggerRefresh();
      }
      if (event.key === 'F6') { // Allow pane switching from inputs
        if (this.isSplitView()) {
            event.preventDefault();
            this.activePaneId.update(id => (id === 1 ? 2 : 1));
        }
      }
      return; // Ignore other hotkeys in inputs.
    }

    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      this.onToolbarAction('newFolder');
      return;
    }

    if (event.ctrlKey) {
      switch (event.key.toLowerCase()) {
        case 'c':
          if (this.canCutCopyShareDelete()) {
            event.preventDefault();
            this.onToolbarAction('copy');
          }
          break;
        case 'x':
          if (this.canCutCopyShareDelete()) {
            event.preventDefault();
            this.onToolbarAction('cut');
          }
          break;
        case 'v':
          if (this.canPaste()) {
            event.preventDefault();
            this.onToolbarAction('paste');
          }
          break;
        case 'a':
          event.preventDefault();
          this.onToolbarAction('selectAll');
          break;
        case 'f':
          event.preventDefault();
          const filterInput = this.document.getElementById('toolbar-filter-input');
          filterInput?.focus();
          (filterInput as HTMLInputElement)?.select();
          break;
      }
      return;
    }

    switch (event.key) {
      case 'Delete':
        if (this.canCutCopyShareDelete()) {
          event.preventDefault();
          this.onToolbarAction('delete');
        }
        break;
      case 'F5':
        event.preventDefault();
        this.triggerRefresh();
        break;
      case 'F6':
        if (this.isSplitView()) {
            event.preventDefault();
            this.activePaneId.update(id => (id === 1 ? 2 : 1));
        }
        break;
      case 'Backspace':
        if (this.canGoUpActivePane()) {
          event.preventDefault();
          this.goUpActivePane();
        }
        break;
      case 'Escape':
        this.onToolbarAction('clearSelection');
        break;
    }
  }
}
