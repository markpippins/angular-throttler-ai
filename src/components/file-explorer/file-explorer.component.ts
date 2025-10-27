import { Component, ChangeDetectionStrategy, signal, computed, effect, inject, ViewChildren, QueryList, ElementRef, Renderer2, OnDestroy, ViewChild, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FileSystemNode, SearchResultNode } from '../../models/file-system.model.js';
import { FileSystemProvider, ItemReference } from '../../services/file-system-provider.js';
import { ImageService } from '../../services/image.service.js';
import { SortCriteria, SortKey } from '../toolbar/toolbar.component.js';
import { FolderComponent } from '../folder/folder.component.js';
import { ClipboardService } from '../../services/clipboard.service.js';
import { SearchResultsComponent } from '../search-results/search-results.component.js';
import { PropertiesDialogComponent } from '../properties-dialog/properties-dialog.component.js';
import { DestinationNodeComponent } from '../destination-node/destination-node.component.js';
import { BottomPaneComponent } from '../bottom-pane/bottom-pane.component.js';
import { InputDialogComponent } from '../input-dialog/input-dialog.component.js';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component.js';
import { AutoFocusSelectDirective } from '../../directives/auto-focus-select.directive.js';
// FIX: Import `DragDropPayload` to resolve type error.
import { DragDropService, DragDropPayload } from '../../services/drag-drop.service.js';
import { SearchEngines } from '../search-dialog/search-dialog.component.js';
import { NewBookmark } from '../../models/bookmark.model.js';

export { SearchResultNode };

interface FileSystemState {
  status: 'loading' | 'success' | 'error';
  items: FileSystemNode[];
  error?: string;
}

interface Thumbnail {
  url: string | null;
  isLoading: boolean;
}

@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
  imports: [CommonModule, DatePipe, FolderComponent, SearchResultsComponent, PropertiesDialogComponent, DestinationNodeComponent, BottomPaneComponent, InputDialogComponent, ConfirmDialogComponent, AutoFocusSelectDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileExplorerComponent implements OnDestroy {
  private renderer = inject(Renderer2);
  private clipboardService = inject(ClipboardService);
  private dragDropService = inject(DragDropService);

  // Inputs & Outputs for multi-pane communication
  id = input.required<number>();
  path = input.required<string[]>();
  isActive = input(false);
  isSplitView = input(false);
  fileSystemProvider = input.required<FileSystemProvider>();
  imageService = input.required<ImageService>();
  folderTree = input<FileSystemNode | null>(null);
  searchResults = input<{ id: number; results: SearchResultNode[] } | null>(null);
  externalSearchRequest = input<{ query: string; engines: Partial<SearchEngines>, timestamp: number } | null>(null);
  refresh = input<number>(0);
  toolbarAction = input<{ name: string; payload?: any; id: number } | null>(null);
  sortCriteria = input<SortCriteria>({ key: 'name', direction: 'asc' });
  displayMode = input<'grid' | 'list'>('grid');
  filterQuery = input('');
  isBottomPaneVisible = input(false);

  activated = output<number>();
  pathChanged = output<string[]>();
  quickSearch = output<string>();
  itemSelected = output<FileSystemNode | null>();
  directoryChanged = output<void>();
  statusChanged = output<{
    selectedItemsCount: number;
    totalItemsCount: number;
    isSearch: boolean;
    searchResultsCount: number;
    filteredItemsCount: number | null;
  }>();
  sortChange = output<SortCriteria>();
  saveBookmark = output<NewBookmark>();
  bookmarkDropped = output<{ bookmark: NewBookmark, dropOn: FileSystemNode }>();

  rootName = signal('...');
  state = signal<FileSystemState>({ status: 'loading', items: [] });
  contextMenu = signal<{ x: number; y: number; item: FileSystemNode | null } | null>(null);
  previewItem = signal<FileSystemNode | null>(null);
  failedImageItems = signal<Set<string>>(new Set());
  isDragOverMainArea = signal(false);
  
  quickSearchQuery = signal('');

  // Destination Submenu State
  destinationSubMenu = signal<{ operation: 'copy' | 'move', x: number, y: number } | null>(null);
  private destinationSubMenuTimer: any;

  // View state
  viewMode = signal<'explorer' | 'search'>('explorer');
  currentSearchResults = signal<SearchResultNode[]>([]);
  isPreviewLoading = signal(false);

  // Bottom pane resizing & search state
  bottomPaneHeight = signal(320);
  isResizingBottomPane = signal(false);
  fileSearchResults = signal<SearchResultNode[] | null>(null);
  webSearchQuery = signal<string | null>(null);
  imageSearchQuery = signal<string | null>(null);
  geminiSearchQuery = signal<string | null>(null);
  youtubeSearchQuery = signal<string | null>(null);
  academicSearchQuery = signal<string | null>(null);
  private unlistenBottomPaneMouseMove: (() => void) | null = null;
  private unlistenBottomPaneMouseUp: (() => void) | null = null;
  
  // Selection
  selectedItems = signal<Set<string>>(new Set());
  private lastSelectedItemName = signal<string | null>(null);

  // UI State
  isShareDialogOpen = signal(false);
  isPropertiesDialogOpen = signal(false);
  propertiesItem = signal<FileSystemNode | null>(null);
  
  // Inline Renaming State
  editingItemName = signal<string | null>(null);

  // Thumbnail Cache
  thumbnailCache = signal<Map<string, Thumbnail>>(new Map());
  
  // Input Dialog State
  isInputDialogOpen = signal(false);
  private inputDialogCallback = signal<((value: string) => Promise<void>)>(() => Promise.resolve());
  inputDialogConfig = signal<{ title: string; message: string; initialValue: string }>({ title: '', message: '', initialValue: '' });

  // Confirm Dialog State
  isConfirmDialogOpen = signal(false);
  confirmDialogConfig = signal<{ title: string; message: string; confirmText: string }>({ title: '', message: '', confirmText: 'OK' });
  private confirmDialogCallback = signal<(() => Promise<void>)>(() => Promise.resolve());

  // Lasso selection state
  isLassoing = signal(false);
  lassoRect = signal<{ x: number; y: number; width: number; height: number } | null>(null);
  private lassoStartPoint = { x: 0, y: 0 };
  private mainContentRect: DOMRect | null = null;
  private initialSelectionOnLasso = new Set<string>();
  
  private unlistenMouseMove: (() => void) | null = null;
  private unlistenMouseUp: (() => void) | null = null;
  
  private lastActionId = -1;

  // Click handling for single/double/rename clicks
  private clickTimer: any = null;
  private readonly CLICK_DELAY = 300; // ms to wait for a double click

  // Drag and drop state for list view
  dragOverListItemName = signal<string | null>(null);

  @ViewChild('mainContent') mainContentEl!: ElementRef<HTMLDivElement>;
  @ViewChildren('selectableItem', { read: ElementRef }) selectableItemElements!: QueryList<ElementRef>;

  // Computed properties for UI binding
  isHighlighted = computed(() => this.isActive() && this.isSplitView());
  canGoUp = computed(() => this.path().length > 0);
  isAtHomeRoot = computed(() => this.path().length === 0);
  
  // The path passed to the provider, which excludes the root segment (server name)
  private providerPath = computed(() => {
    const p = this.path();
    return p.length > 0 ? p.slice(1) : [];
  });
  
  displayPath = computed(() => {
    // The display path is the provider path with ".magnet" extensions removed for display.
    return this.providerPath().map(segment => 
      segment.endsWith('.magnet') ? segment.slice(0, -7) : segment
    );
  });

  sortedItems = computed(() => {
    const items = [...this.state().items];
    const { key, direction } = this.sortCriteria();
    const directionMultiplier = direction === 'asc' ? 1 : -1;

    items.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;

      let valA: string | number, valB: string | number;

      if (key === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else { // modified
        valA = a.modified ? new Date(a.modified).getTime() : 0;
        valB = b.modified ? new Date(b.modified).getTime() : 0;
      }

      if (valA < valB) return -1 * directionMultiplier;
      if (valA > valB) return 1 * directionMultiplier;
      return 0;
    });

    return items;
  });

  filteredItems = computed(() => {
    const items = this.sortedItems();
    const query = this.filterQuery().trim().toLowerCase();

    if (!query) {
      return items;
    }
    return items.filter(item => item.name.toLowerCase().includes(query));
  });

  constructor() {
    console.log('FileExplorerComponent constructor: Initializing component.');
    effect(() => {
      // This effect runs when path, provider, or refresh changes.
      this.refresh(); // dependency
      this.path(); // dependency
      this.fileSystemProvider(); // dependency

      this._loadContents().finally(() => {
        // After loading is complete (success or fail), schedule a status update in the next microtask.
        // This avoids the NG0103 error.
        Promise.resolve().then(() => this.updateStatus());
      });
    });
    
    effect(() => {
      const action = this.toolbarAction();
      if (action && this.isActive() && action.id > this.lastActionId) {
        this.lastActionId = action.id;
        this.handleToolbarAction(action);
      }
    });

    effect(() => {
      const provider = this.fileSystemProvider();
      provider.getFolderTree()
        .then(root => {
          this.rootName.set(root.name);
        })
        .catch(err => {
          console.error('Failed to get root name', err);
          this.rootName.set('Error');
        });
    }, { allowSignalWrites: true });

    effect(() => {
      this.updateForSearchResults(this.searchResults());
      // Defer the status update to the next microtask to avoid NG0103.
      Promise.resolve().then(() => this.updateStatus());
    });
    
    effect(() => {
      const request = this.externalSearchRequest();
      // Only react if this pane is the active one that initiated the search
      if (request && this.isActive()) {
        const { query, engines } = request;
        if (engines.web) this.webSearchQuery.set(query);
        if (engines.image) this.imageSearchQuery.set(query);
        if (engines.gemini) this.geminiSearchQuery.set(query);
        if (engines.youtube) this.youtubeSearchQuery.set(query);
        if (engines.academic) this.academicSearchQuery.set(query);
      }
    });

    // This effect handles loading thumbnails whenever the list of visible items changes.
    effect(() => {
      // Only run this logic for grid view.
      if (this.displayMode() === 'grid') {
        this.loadThumbnailsForVisibleItems();
      } else {
        // When switching away from grid view, clear the cache to free up memory.
        this.thumbnailCache.set(new Map());
      }
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    this.stopLassoing();
    this.stopBottomPaneResize();
    // Re-enable text selection when component is destroyed
    this.renderer.removeStyle(document.body, 'user-select');
    // Clear any pending timers
    if (this.clickTimer) clearTimeout(this.clickTimer);
  }

  private updateStatus(): void {
    const hasFilter = this.filterQuery().trim().length > 0;
    this.statusChanged.emit({
      selectedItemsCount: this.selectedItems().size,
      totalItemsCount: this.state().items.length,
      isSearch: this.viewMode() === 'search',
      searchResultsCount: this.currentSearchResults().length,
      filteredItemsCount: hasFilter ? this.filteredItems().length : null,
    });
  }
  
  // --- Data Loading ---
  private async _loadContents(): Promise<void> {
    this.state.set({ status: 'loading', items: [] });
    try {
      const items = await this.fileSystemProvider().getContents(this.providerPath());
      this.state.set({ status: 'success', items: items });
    } catch (e: unknown) {
      this.state.set({ status: 'error', items: [], error: (e as Error).message });
    }
  }

  async loadContents(): Promise<void> {
    await this._loadContents();
    this.updateStatus();
  }

  async loadThumbnailsForVisibleItems(): Promise<void> {
    const items = this.filteredItems();
    const imageItems = items.filter(item => this.isImageFile(item.name));
    
    // Set initial loading state for all images not yet in cache
    this.thumbnailCache.update(cache => {
        const newCache = new Map(cache);
        for (const item of imageItems) {
            if (!newCache.has(item.name)) {
                newCache.set(item.name, { url: null, isLoading: true });
            }
        }
        return newCache;
    });
    
    // Fetch them
    for (const item of imageItems) {
        // Skip if we already have the URL
        if (this.thumbnailCache().get(item.name)?.url) {
            continue;
        }
        try {
            const content = await this.fileSystemProvider().getFileContent(this.providerPath(), item.name);
            this.thumbnailCache.update(cache => {
                const newCache = new Map(cache);
                newCache.set(item.name, { url: content, isLoading: false });
                return newCache;
            });
        } catch (e) {
            console.error(`Failed to load thumbnail for ${item.name}`, e);
            this.thumbnailCache.update(cache => {
                const newCache = new Map(cache);
                newCache.set(item.name, { url: null, isLoading: false }); // Mark as failed
                return newCache;
            });
        }
    }
  }

  updateForSearchResults(search: { id: number; results: SearchResultNode[] } | null): void {
    if (search && search.id === this.id()) {
      // Keep main view in explorer mode.
      this.viewMode.set('explorer');
      this.currentSearchResults.set([]);
      
      // Pass the results to the bottom pane.
      this.fileSearchResults.set(search.results);
    } else {
      // This case handles clearing the search, e.g., when switching panes.
      this.viewMode.set('explorer');
      this.currentSearchResults.set([]);
      this.fileSearchResults.set(null);
    }
  }

  // --- Navigation ---
  goUp(): void {
    if (this.canGoUp()) {
      this.pathChanged.emit(this.path().slice(0, -1));
    }
  }

  navigateToPath(displayIndex: number): void {
    // We navigate within the full path. The displayIndex is relative to the displayPath.
    // displayIndex: -1 for the root, 0 for the first segment, etc.
    // The new path length will be displayIndex + 2 (e.g., -1 -> 1, 0 -> 2)
    const newPath = this.path().slice(0, displayIndex + 2);
    this.pathChanged.emit(newPath);
  }

  async openItem(item: FileSystemNode): Promise<void> {
    if (item.type === 'folder') {
      this.pathChanged.emit([...this.path(), item.name]);
      return;
    }

    // Show preview modal immediately
    this.previewItem.set(item);

    // If content is already present (e.g., from Convex service), no need to fetch.
    if (item.content) {
      return;
    }

    this.isPreviewLoading.set(true);
    try {
      const content = await this.fileSystemProvider().getFileContent(this.providerPath(), item.name);
      // Update the item in the previewItem signal with the fetched content
      this.previewItem.update(currentItem => currentItem ? { ...currentItem, content } : null);
    } catch (e) {
      console.error('Failed to get file content', e);
      const errorMessage = `Error loading file content: ${(e as Error).message}`;
      this.previewItem.update(currentItem => currentItem ? { ...currentItem, content: errorMessage } : null);
    } finally {
      this.isPreviewLoading.set(false);
    }
  }

  isImageFile(filename: string): boolean {
    const extension = this.getFileExtension(filename);
    if (!extension) return false;
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension.toLowerCase());
  }

  private getFileExtension(filename: string): string | null {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) {
      return null;
    }
    return filename.substring(lastDot + 1);
  }

  closePreview(): void {
    this.previewItem.set(null);
    this.isPreviewLoading.set(false);
  }
  
  // --- Selection Logic ---
  onItemClick(event: MouseEvent, item: FileSystemNode): void {
    // If we're clicking an item to rename it, don't process the click further.
    if (this.editingItemName()) {
        return;
    }

    event.stopPropagation();
    this.closeContextMenu();
    this.closeDestinationSubMenu();
    
    const isCtrlOrMeta = event.metaKey || event.ctrlKey;
    const isShift = event.shiftKey;
    const itemName = item.name;

    // Multi-selection logic is simple, handle it and exit.
    if (isShift || isCtrlOrMeta) {
        clearTimeout(this.clickTimer);
        this.clickTimer = null;
        if (isShift && this.lastSelectedItemName()) {
            this.handleShiftSelection(itemName);
        } else { // isCtrlOrMeta
            this.handleCtrlMetaSelection(itemName);
        }
        this.updateSingleSelectedItem();
        return;
    }
    
    // --- Single-click, Double-click, and Slow-click-to-rename Logic ---
    
    // If a timer is already running, this is a double-click.
    if (this.clickTimer) {
        clearTimeout(this.clickTimer);
        this.clickTimer = null;
        this.openItem(item); // Double-click action
        return;
    }
    
    // If no timer, this is the first click. Start a timer.
    const isRenameCandidate = this.selectedItems().size === 1 && this.selectedItems().has(itemName);
    
    this.clickTimer = setTimeout(() => {
        this.clickTimer = null;
        if (isRenameCandidate) {
            // A single click on an already selected item -> rename
            this.onRename();
        } else {
            // A single click on an unselected item -> select
            this.handleSingleSelection(itemName);
            this.updateSingleSelectedItem();
        }
    }, this.CLICK_DELAY);
  }

  private handleSingleSelection(itemName: string): void {
    this.selectedItems.set(new Set([itemName]));
    this.lastSelectedItemName.set(itemName);
  }

  private handleCtrlMetaSelection(itemName: string): void {
    this.selectedItems.update(currentSelection => {
      const newSelection = new Set(currentSelection);
      if (newSelection.has(itemName)) {
        newSelection.delete(itemName);
      } else {
        newSelection.add(itemName);
      }
      return newSelection;
    });
    if (this.selectedItems().has(itemName)) {
      this.lastSelectedItemName.set(itemName);
    } else {
      this.lastSelectedItemName.set(null);
    }
  }

  private handleShiftSelection(itemName: string): void {
    const items = this.sortedItems();
    const lastSelectedIdx = items.findIndex(i => i.name === this.lastSelectedItemName());
    const currentIdx = items.findIndex(i => i.name === itemName);

    if (lastSelectedIdx === -1 || currentIdx === -1) {
        this.handleSingleSelection(itemName);
        return;
    }

    const start = Math.min(lastSelectedIdx, currentIdx);
    const end = Math.max(lastSelectedIdx, currentIdx);
    const itemsToSelect = items.slice(start, end + 1).map(i => i.name);

    this.selectedItems.update(currentSelection => {
        const newSelection = new Set(currentSelection);
        itemsToSelect.forEach(name => newSelection.add(name));
        return newSelection;
    });
  }
  
  private updateSingleSelectedItem(): void {
    const selection = this.selectedItems();
    if (selection.size === 1) {
      const itemName = selection.values().next().value;
      const item = this.state().items.find(i => i.name === itemName);
      this.itemSelected.emit(item ?? null);
    } else {
      this.itemSelected.emit(null);
    }
    this.updateStatus();
  }

  private getSelectedNodes(): FileSystemNode[] {
    const selection = this.selectedItems();
    return this.state().items.filter(i => selection.has(i.name));
  }
  
  private getItemReference(node: FileSystemNode): ItemReference {
    return { name: node.name, type: node.type };
  }
  
  private getSelectedItemReferences(): ItemReference[] {
    return this.getSelectedNodes().map(this.getItemReference);
  }

  // --- Context Menu ---
  onContextMenu(event: MouseEvent, item: FileSystemNode | null = null): void {
    // Don't show context menu if an item is being renamed
    if (this.editingItemName()) {
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.closeDestinationSubMenu();

    if (item && !this.selectedItems().has(item.name)) {
      this.handleSingleSelection(item.name);
      this.updateSingleSelectedItem();
    }
    
    this.contextMenu.set({ x: event.clientX, y: event.clientY, item });
  }

  closeContextMenu(): void {
    if (this.contextMenu()) {
      this.contextMenu.set(null);
    }
  }

  openDestinationSubMenu(operation: 'copy' | 'move', event: MouseEvent): void {
    clearTimeout(this.destinationSubMenuTimer);
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.destinationSubMenu.set({
      operation,
      x: rect.right,
      y: rect.top
    });
  }

  onDestinationSubMenuEnter(): void {
    clearTimeout(this.destinationSubMenuTimer);
  }

  onDestinationSubMenuLeave(): void {
    this.destinationSubMenuTimer = setTimeout(() => {
        this.closeDestinationSubMenu();
    }, 150);
  }

  closeDestinationSubMenu(): void {
    clearTimeout(this.destinationSubMenuTimer);
    if (this.destinationSubMenu()) {
      this.destinationSubMenu.set(null);
    }
  }
  
  private handleToolbarAction(action: { name: string; payload?: any }): void {
    switch (action.name) {
      case 'newFolder': this.createFolder(); break;
      case 'newFile': this.createFile(); break;
      case 'upload': this.onFilesUploaded(action.payload); break;
      case 'cut': this.onCut(); break;
      case 'copy': this.onCopy(); break;
      case 'paste': this.onPaste(); break;
      case 'rename': this.onRename(); break;
      case 'share': this.onShare(); break;
      case 'delete': this.onDelete(); break;
      case 'copyTo': this.onItemsCopiedTo(action.payload); break;
      case 'moveTo': this.onItemsMovedTo(action.payload); break;
    }
  }

  // --- File Operations ---
  createFolder(): void {
    this.inputDialogConfig.set({
      title: 'Create New Folder',
      message: 'Enter a name for the new folder:',
      initialValue: 'New folder'
    });
    this.inputDialogCallback.set(this.executeCreateFolder.bind(this));
    this.isInputDialogOpen.set(true);
  }

  private async executeCreateFolder(name: string): Promise<void> {
    if (name) {
      try {
        await this.fileSystemProvider().createDirectory(this.providerPath(), name);
        await this.loadContents();
        this.directoryChanged.emit();
      } catch (e) {
        alert(`Error creating folder: ${(e as Error).message}`);
      }
    }
  }

  createFile(): void {
    this.inputDialogConfig.set({
      title: 'Create New File',
      message: 'Enter a name for the new file:',
      initialValue: 'New file.txt'
    });
    this.inputDialogCallback.set(this.executeCreateFile.bind(this));
    this.isInputDialogOpen.set(true);
  }

  private async executeCreateFile(name: string): Promise<void> {
    if (name) {
      try {
        await this.fileSystemProvider().createFile(this.providerPath(), name);
        await this.loadContents();
        this.directoryChanged.emit();
      } catch (e) {
        alert(`Error creating file: ${(e as Error).message}`);
      }
    }
  }

  async onFilesUploaded(files: FileList): Promise<void> {
    this.state.update(s => ({ ...s, status: 'loading' }));
    try {
      await Promise.all(
        Array.from(files).map(file => this.fileSystemProvider().uploadFile(this.providerPath(), file))
      );
    } catch (e) {
      alert(`Error uploading files: ${(e as Error).message}`);
    } finally {
      await this.loadContents();
    }
  }
  
  // FIX: Corrected payload for clipboard service to match `ClipboardPayload` interface.
  onCut(): void {
    this.clipboardService.set({
      operation: 'cut',
      sourceProvider: this.fileSystemProvider(),
      sourcePath: this.path(),
      items: this.getSelectedNodes()
    });
    this.closeContextMenu();
  }
  
  // FIX: Corrected payload for clipboard service to match `ClipboardPayload` interface.
  onCopy(): void {
    this.clipboardService.set({
      operation: 'copy',
      sourceProvider: this.fileSystemProvider(),
      sourcePath: this.path(),
      items: this.getSelectedNodes()
    });
    this.closeContextMenu();
  }
  
  // FIX: Correctly handle `ClipboardPayload` from the service, which does not have `type` or nested `payload` properties.
  async onPaste(): Promise<void> {
    this.closeContextMenu();
    const clip = this.clipboardService.get();
    if (!clip) return;
    
    // Provider compatibility check should happen here if needed.
    // For now, we assume it's handled or allowed.

    try {
      const itemRefs = clip.items.map(this.getItemReference);
      const sourceProviderPath = clip.sourcePath.length > 0 ? clip.sourcePath.slice(1) : [];
      if (clip.operation === 'cut') {
        await clip.sourceProvider.move(sourceProviderPath, this.providerPath(), itemRefs);
        this.clipboardService.clear();
      } else { // copy
        await clip.sourceProvider.copy(sourceProviderPath, this.providerPath(), itemRefs);
      }
    } catch (e) {
      alert(`Paste failed: ${(e as Error).message}`);
    } finally {
      await this.loadContents();
      this.directoryChanged.emit();
    }
  }

  onRename(): void {
    const selectedNodes = this.getSelectedNodes();
    if (selectedNodes.length !== 1) return;
    this.closeContextMenu();
    this.editingItemName.set(selectedNodes[0].name);
  }

  async commitRename(newName: string): Promise<void> {
    const oldName = this.editingItemName();
    let trimmedNewName = newName.trim();
    
    if (!oldName) {
      this.cancelRename();
      return;
    }

    // If old name was a magnet folder, preserve the extension
    if (oldName.endsWith('.magnet') && !trimmedNewName.endsWith('.magnet')) {
      trimmedNewName += '.magnet';
    }

    // If no change or empty new name, just cancel without an alert.
    if (!trimmedNewName || oldName === trimmedNewName) {
      this.cancelRename();
      return;
    }

    try {
      await this.fileSystemProvider().rename(this.providerPath(), oldName, trimmedNewName);
      await this.loadContents();
      // Select the newly renamed item
      this.handleSingleSelection(trimmedNewName);
      this.updateSingleSelectedItem();
      this.directoryChanged.emit();
    } catch (e) {
      alert(`Rename failed: ${(e as Error).message}`);
    } finally {
      this.cancelRename();
    }
  }

  cancelRename(): void {
    this.editingItemName.set(null);
  }

  async onMagnetize(item: FileSystemNode): Promise<void> {
    if (item.type !== 'folder' || item.name.endsWith('.magnet')) {
      return;
    }
    const oldName = item.name;
    const newName = `${oldName}.magnet`;
    try {
      await this.fileSystemProvider().rename(this.providerPath(), oldName, newName);
      await this.loadContents();
      this.directoryChanged.emit();
    } catch (e) {
      alert(`Failed to magnetize folder: ${(e as Error).message}`);
    }
  }

  async executeCopyToMoveTo(operation: 'copy' | 'move', destPath: string[]): Promise<void> {
    const items = this.getSelectedItemReferences();
    if (items.length === 0) return;
    
    try {
        const destProviderPath = destPath.length > 0 ? destPath.slice(1) : [];
        if (operation === 'copy') {
            await this.fileSystemProvider().copy(this.providerPath(), destProviderPath, items);
        } else { // move
            await this.fileSystemProvider().move(this.providerPath(), destProviderPath, items);
        }
    } catch (e) {
        alert(`${operation} failed: ${(e as Error).message}`);
    } finally {
        await this.loadContents();
        this.closeDestinationSubMenu();
        this.directoryChanged.emit();
    }
  }
  
  onItemsCopiedTo(destPath: string[]): void {
    this.executeCopyToMoveTo('copy', destPath);
  }
  
  onItemsMovedTo(destPath: string[]): void {
    this.executeCopyToMoveTo('move', destPath);
  }

  onShare(): void {
    this.isShareDialogOpen.set(true);
  }
  
  closeShareDialog(): void {
    this.isShareDialogOpen.set(false);
  }

  onDelete(): void {
    this.closeContextMenu();
    const selectedNodes = this.getSelectedNodes();
    if (selectedNodes.length === 0) return;

    this.confirmDialogConfig.set({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete ${selectedNodes.length} item(s)? This action cannot be undone.`,
      confirmText: 'Delete'
    });
    this.confirmDialogCallback.set(this.executeDelete.bind(this));
    this.isConfirmDialogOpen.set(true);
  }
  
  private async executeDelete(): Promise<void> {
    const selectedNodes = this.getSelectedNodes();
    try {
      // Use a sequential loop to avoid race conditions when using the in-memory provider
      for (const node of selectedNodes) {
        if (node.type === 'folder') {
          await this.fileSystemProvider().removeDirectory(this.providerPath(), node.name);
        } else {
          await this.fileSystemProvider().deleteFile(this.providerPath(), node.name);
        }
      }
    } catch (e) {
      alert(`Delete failed: ${(e as Error).message}`);
    } finally {
      this.selectedItems.set(new Set()); // Clear selection after deletion
      this.updateSingleSelectedItem();
      await this.loadContents();
      this.directoryChanged.emit();
    }
  }
  
  onMagnetizeFromContextMenu(): void {
    const item = this.contextMenu()?.item;
    if (item?.type === 'folder' && !item.name.endsWith('.magnet')) {
      this.onMagnetize(item);
    }
    this.closeContextMenu();
  }
  
  onPropertiesFromContextMenu(): void {
    const selected = this.getSelectedNodes();
    if (selected.length === 1) {
        this.propertiesItem.set(selected[0]);
        this.isPropertiesDialogOpen.set(true);
    }
    this.closeContextMenu();
  }

  closePropertiesDialog(): void {
    this.isPropertiesDialogOpen.set(false);
    this.propertiesItem.set(null);
  }
  
  // --- UI Handlers ---
  getDisplayName(item: FileSystemNode): string {
    if (item.name.endsWith('.magnet')) {
      return item.name.slice(0, -7);
    }
    return item.name;
  }

  onColumnHeaderClick(key: SortKey): void {
    const current = this.sortCriteria();
    let newCriteria: SortCriteria;
    if (current.key === key) {
      newCriteria = { ...current, direction: current.direction === 'asc' ? 'desc' : 'asc' };
    } else {
      newCriteria = { key, direction: 'asc' };
    }
    this.sortChange.emit(newCriteria);
  }

  getIconUrl(item: FileSystemNode): string | null {
    return this.imageService().getIconUrl(item);
  }

  onImageError(name: string): void {
    this.failedImageItems.update(set => new Set(set).add(name));
  }
  
  onQuickSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.quickSearchQuery.set(query);
  }

  onQuickSearchSubmit(): void {
    this.quickSearch.emit(this.quickSearchQuery());
  }
  
  // --- Input Dialog Handlers ---
  async onInputDialogSubmit(name: string): Promise<void> {
    const callback = this.inputDialogCallback();
    if (callback) {
      await callback(name);
    }
    this.closeInputDialog();
  }

  closeInputDialog(): void {
    this.isInputDialogOpen.set(false);
  }

  // --- Confirm Dialog Handlers ---
  async onConfirmDialogConfirm(): Promise<void> {
    const callback = this.confirmDialogCallback();
    if (callback) {
      await callback();
    }
    this.closeConfirmDialog();
  }

  closeConfirmDialog(): void {
    this.isConfirmDialogOpen.set(false);
  }

  // --- Drag & Drop ---
  onItemDragStart(event: DragEvent, item: FileSystemNode): void {
    if (!this.selectedItems().has(item.name)) {
      this.handleSingleSelection(item.name);
      this.updateSingleSelectedItem();
    }

    const payload: DragDropPayload = {
      type: 'filesystem',
      payload: {
        sourceProvider: this.fileSystemProvider(),
        sourcePath: this.path(),
        items: this.getSelectedNodes()
      }
    };
    this.dragDropService.startDrag(payload);
    
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/json', JSON.stringify(payload)); // Keep for compatibility
    }
  }

  onDragEnd(event: DragEvent): void {
    this.dragDropService.endDrag();
  }
  
  async onInternalDropOnFolder(event: { dropOn: FileSystemNode }): Promise<void> {
    const payload = this.dragDropService.getPayload();
    if (!payload || payload.type !== 'filesystem') return;
    const { sourcePath, items } = payload.payload;

    const destPath = [...this.path(), event.dropOn.name];
    
    // Prevent dropping a folder into itself or into its current location
    if (sourcePath.join('/') === destPath.join('/')) return;
    if (items.some(item => destPath.join('/').startsWith([...sourcePath, item.name].join('/')))) {
      alert("Cannot move a folder into itself.");
      return;
    }

    const itemRefs = items.map(this.getItemReference);
    const sourceProviderPath = sourcePath.length > 0 ? sourcePath.slice(1) : [];

    try {
        await payload.payload.sourceProvider.move(sourceProviderPath, destPath.slice(1), itemRefs);
    } catch (e) {
        alert(`Move failed: ${(e as Error).message}`);
    } finally {
        await this.loadContents();
        this.directoryChanged.emit();
    }
  }

  onBookmarkDropOnFolder(event: { bookmark: NewBookmark, dropOn: FileSystemNode }): void {
    this.bookmarkDropped.emit(event);
  }
  
  // Handlers for drops from the OS onto a folder. Currently a mock.
  onFolderDrop(event: { files: FileList, item: FileSystemNode }): void {
    console.log(`Dropped ${event.files.length} files onto ${event.item.name}`);
    alert(`Dropped ${event.files.length} files onto ${event.item.name}. Uploading to specific folders is not implemented yet.`);
  }

  onF2Pressed(event: KeyboardEvent): void {
    if (event.key === 'F2') {
      const selectedCount = this.selectedItems().size;
      if (selectedCount === 1) {
        event.preventDefault();
        this.onRename();
      }
    }
  }

  // --- Lasso Selection ---
  onMainAreaMouseDown(event: MouseEvent): void {
    // If we're renaming, don't allow lasso or selection clearing.
    if (this.editingItemName()) {
        return;
    }
    // Only handle primary button clicks on the background
    if (event.button !== 0 || (event.target as HTMLElement).closest('[data-is-selectable-item]')) {
      return;
    }
    
    // A background click should always close menus.
    this.closeContextMenu();
    this.closeDestinationSubMenu();
    
    if (this.displayMode() === 'list') {
      // In list view, just clear selection. No lasso.
      this.selectedItems.set(new Set());
      this.updateSingleSelectedItem();
    } else {
      // In grid view, prevent default text selection and start the lasso.
      event.preventDefault();
      this.startLassoing(event);
    }
  }

  private startLassoing(event: MouseEvent): void {
    this.isLassoing.set(true);
    this.mainContentRect = this.mainContentEl.nativeElement.getBoundingClientRect();
    this.lassoStartPoint = { 
      x: event.clientX - this.mainContentRect.left, 
      y: event.clientY - this.mainContentRect.top 
    };
    
    // Disable text selection on the body while lassoing
    this.renderer.setStyle(document.body, 'user-select', 'none');
    
    // Store initial selection if user is holding ctrl/meta
    this.initialSelectionOnLasso = (event.metaKey || event.ctrlKey) ? new Set(this.selectedItems()) : new Set();
    if (!event.metaKey && !event.ctrlKey) {
        this.selectedItems.set(new Set());
        this.updateSingleSelectedItem();
    }

    this.unlistenMouseMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => this.onLassoMove(e));
    this.unlistenMouseUp = this.renderer.listen('document', 'mouseup', () => this.stopLassoing());
  }

  // FIX: Added missing lasso move logic.
  private onLassoMove(event: MouseEvent): void {
    if (!this.isLassoing() || !this.mainContentRect) return;

    const currentX = event.clientX - this.mainContentRect.left;
    const currentY = event.clientY - this.mainContentRect.top;

    const x = Math.min(this.lassoStartPoint.x, currentX);
    const y = Math.min(this.lassoStartPoint.y, currentY);
    const width = Math.abs(currentX - this.lassoStartPoint.x);
    const height = Math.abs(currentY - this.lassoStartPoint.y);

    this.lassoRect.set({ x, y, width, height });

    const lassoDomRect = new DOMRect(x + this.mainContentRect.left, y + this.mainContentRect.top, width, height);
    const newSelection = new Set(this.initialSelectionOnLasso);

    this.selectableItemElements.forEach(elRef => {
      const itemEl = elRef.nativeElement;
      const itemName = itemEl.getAttribute('data-item-name');
      if (!itemName) return;

      const itemRect = itemEl.getBoundingClientRect();
      const intersects = !(
        lassoDomRect.right < itemRect.left ||
        lassoDomRect.left > itemRect.right ||
        lassoDomRect.bottom < itemRect.top ||
        lassoDomRect.top > itemRect.bottom
      );

      if (intersects) {
        if ((event.metaKey || event.ctrlKey) && this.initialSelectionOnLasso.has(itemName)) {
          newSelection.delete(itemName);
        } else {
          newSelection.add(itemName);
        }
      }
    });

    this.selectedItems.set(newSelection);
    this.updateSingleSelectedItem();
  }

  // FIX: Added missing stopLassoing method to fix error on destroy.
  private stopLassoing(): void {
    if (!this.isLassoing()) return;
    this.isLassoing.set(false);
    this.lassoRect.set(null);
    if (this.unlistenMouseMove) {
      this.unlistenMouseMove();
      this.unlistenMouseMove = null;
    }
    if (this.unlistenMouseUp) {
      this.unlistenMouseUp();
      this.unlistenMouseUp = null;
    }
    this.renderer.removeStyle(document.body, 'user-select');
  }

  // --- Bottom Pane Resizing ---
  startBottomPaneResize(event: MouseEvent): void {
    this.isResizingBottomPane.set(true);
    const startY = event.clientY;
    const startHeight = this.bottomPaneHeight();

    event.preventDefault();

    this.unlistenBottomPaneMouseMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
      const dy = startY - e.clientY;
      let newHeight = startHeight + dy;

      if (newHeight < 100) newHeight = 100;
      if (newHeight > window.innerHeight - 200) newHeight = window.innerHeight - 200;

      this.bottomPaneHeight.set(newHeight);
    });

    this.unlistenBottomPaneMouseUp = this.renderer.listen('document', 'mouseup', () => {
      this.stopBottomPaneResize();
    });
  }

  // FIX: Added missing stopBottomPaneResize method to fix error on destroy.
  private stopBottomPaneResize(): void {
    if (!this.isResizingBottomPane()) return;
    this.isResizingBottomPane.set(false);
    if (this.unlistenBottomPaneMouseMove) {
      this.unlistenBottomPaneMouseMove();
      this.unlistenBottomPaneMouseMove = null;
    }
    if (this.unlistenBottomPaneMouseUp) {
      this.unlistenBottomPaneMouseUp();
      this.unlistenBottomPaneMouseUp = null;
    }
  }

  // --- Drag & Drop Handlers for Main Area and List View ---

  onMainAreaDragOver(event: DragEvent): void {
    // Only allow drop if files are being dragged from the OS.
    if (event.dataTransfer?.types.includes('Files')) {
      event.preventDefault();
      this.isDragOverMainArea.set(true);
    }
  }

  async onMainAreaDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragOverMainArea.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await this.onFilesUploaded(files);
    }
  }

  onListItemDragOver(event: DragEvent, item: FileSystemNode): void {
    const payload = this.dragDropService.getPayload();
    if (!payload || item.type !== 'folder') return;

    if (payload.type === 'filesystem') {
      // Prevent dropping an item on itself.
      if (payload.payload.items.some(draggedItem => draggedItem.name === item.name)) {
          return;
      }
      // Prevent dropping a folder into one of its own children (recursive drop).
      const destPath = [...this.path(), item.name];
      if (payload.payload.items.some(draggedItem => destPath.join('/').startsWith([...payload.payload.sourcePath, draggedItem.name].join('/')))) {
          return;
      }
    }

    event.preventDefault(); // Allow drop
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = payload.type === 'filesystem' ? 'move' : 'copy';
    }
    this.dragOverListItemName.set(item.name);
  }

  onListItemDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOverListItemName.set(null);
  }

  onListItemDrop(event: DragEvent, item: FileSystemNode): void {
    event.preventDefault();
    this.dragOverListItemName.set(null);
    
    const payload = this.dragDropService.getPayload();
    if (!payload || item.type !== 'folder') return;
    
    if (payload.type === 'filesystem') {
      this.onInternalDropOnFolder({ dropOn: item });
    } else if (payload.type === 'bookmark') {
      this.onBookmarkDropOnFolder({ bookmark: payload.payload.data, dropOn: item });
    }
  }
}
