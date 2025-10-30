

import { Component, ChangeDetectionStrategy, signal, computed, effect, inject, ViewChildren, QueryList, ElementRef, Renderer2, OnDestroy, ViewChild, input, output, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model.js';
import { FileSystemProvider, ItemReference } from '../../services/file-system-provider.js';
import { ImageService } from '../../services/image.service.js';
import { SortCriteria, SortKey } from '../toolbar/toolbar.component.js';
import { FolderComponent } from '../folder/folder.component.js';
import { ClipboardService } from '../../services/clipboard.service.js';
import { PropertiesDialogComponent } from '../properties-dialog/properties-dialog.component.js';
import { DestinationNodeComponent } from '../destination-node/destination-node.component.js';
import { InputDialogComponent } from '../input-dialog/input-dialog.component.js';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component.js';
import { AutoFocusSelectDirective } from '../../directives/auto-focus-select.directive.js';
import { DragDropService, DragDropPayload } from '../../services/drag-drop.service.js';
import { NewBookmark } from '../../models/bookmark.model.js';
import { GoogleSearchService } from '../../services/google-search.service.js';
import { UnsplashService } from '../../services/unsplash.service.js';
import { GeminiService } from '../../services/gemini.service.js';
import { YoutubeSearchService } from '../../services/youtube-search.service.js';
import { AcademicSearchService } from '../../services/academic-search.service.js';
import { GoogleSearchResult } from '../../models/google-search-result.model.js';
import { ImageSearchResult } from '../../models/image-search-result.model.js';
import { YoutubeSearchResult } from '../../models/youtube-search-result.model.js';
import { AcademicSearchResult } from '../../models/academic-search-result.model.js';
import { WebResultCardComponent } from '../stream-cards/web-result-card.component.js';
import { ImageResultCardComponent } from '../stream-cards/image-result-card.component.js';
import { GeminiResultCardComponent } from '../stream-cards/gemini-result-card.component.js';
import { YoutubeResultCardComponent } from '../stream-cards/youtube-result-card.component.js';
import { AcademicResultCardComponent } from '../stream-cards/academic-result-card.component.js';
import { WebResultListItemComponent } from '../stream-list-items/web-result-list-item.component.js';
import { ImageResultListItemComponent } from '../stream-list-items/image-result-list-item.component.js';
import { GeminiResultListItemComponent } from '../stream-list-items/gemini-result-list-item.component.js';
import { YoutubeResultListItemComponent } from '../stream-list-items/youtube-result-list-item.component.js';
import { AcademicResultListItemComponent } from '../stream-list-items/academic-result-list-item.component.js';

interface FileSystemState {
  status: 'loading' | 'success' | 'error';
  items: FileSystemNode[];
  error?: string;
}

interface Thumbnail {
  url: string | null;
  isLoading: boolean;
}

// Type definitions for items in the unified stream
type GeminiResult = { query: string; text: string };

type StreamItem = 
  | (GoogleSearchResult & { type: 'web' })
  | (ImageSearchResult & { type: 'image' })
  | (YoutubeSearchResult & { type: 'youtube' })
  | (AcademicSearchResult & { type: 'academic' })
  | (GeminiResult & { type: 'gemini' });

@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
  imports: [CommonModule, DatePipe, FolderComponent, PropertiesDialogComponent, DestinationNodeComponent, InputDialogComponent, ConfirmDialogComponent, AutoFocusSelectDirective, WebResultCardComponent, ImageResultCardComponent, GeminiResultCardComponent, YoutubeResultCardComponent, AcademicResultCardComponent, WebResultListItemComponent, ImageResultListItemComponent, GeminiResultListItemComponent, YoutubeResultListItemComponent, AcademicResultListItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileExplorerComponent implements OnDestroy, OnInit {
  private renderer = inject(Renderer2);
  private clipboardService = inject(ClipboardService);
  private dragDropService = inject(DragDropService);
  private googleSearchService = inject(GoogleSearchService);
  private unsplashService = inject(UnsplashService);
  private geminiService = inject(GeminiService);
  private youtubeSearchService = inject(YoutubeSearchService);
  private academicSearchService = inject(AcademicSearchService);

  // Inputs & Outputs for multi-pane communication
  id = input.required<number>();
  path = input.required<string[]>();
  isActive = input(false);
  isSplitView = input(false);
  fileSystemProvider = input.required<FileSystemProvider>();
  imageService = input.required<ImageService>();
  folderTree = input<FileSystemNode | null>(null);
  refresh = input<number>(0);
  toolbarAction = input<{ name: string; payload?: any; id: number } | null>(null);
  sortCriteria = input<SortCriteria>({ key: 'name', direction: 'asc' });
  displayMode = input<'grid' | 'list'>('grid');
  filterQuery = input('');

  activated = output<number>();
  pathChanged = output<string[]>();
  itemSelected = output<FileSystemNode | null>();
  directoryChanged = output<void>();
  statusChanged = output<{
    selectedItemsCount: number;
    totalItemsCount: number;
    filteredItemsCount: number | null;
  }>();
  sortChange = output<SortCriteria>();
  saveBookmark = output<NewBookmark>();
  bookmarkDropped = output<{ bookmark: NewBookmark, dropOn: FileSystemNode }>();

  state = signal<FileSystemState>({ status: 'loading', items: [] });
  contextMenu = signal<{ x: number; y: number; item: FileSystemNode | null } | null>(null);
  previewItem = signal<FileSystemNode | null>(null);
  failedImageItems = signal<Set<string>>(new Set());
  isDragOverMainArea = signal(false);
  
  destinationSubMenu = signal<{ operation: 'copy' | 'move', x: number, y: number } | null>(null);
  private destinationSubMenuTimer: any;

  isPreviewLoading = signal(false);

  selectedItems = signal<Set<string>>(new Set());
  private lastSelectedItemName = signal<string | null>(null);

  isShareDialogOpen = signal(false);
  isPropertiesDialogOpen = signal(false);
  propertiesItem = signal<FileSystemNode | null>(null);
  
  editingItemName = signal<string | null>(null);

  thumbnailCache = signal<Map<string, Thumbnail>>(new Map());
  
  isInputDialogOpen = signal(false);
  private inputDialogCallback = signal<((value: string) => Promise<void>)>(() => Promise.resolve());
  inputDialogConfig = signal<{ title: string; message: string; initialValue: string }>({ title: '', message: '', initialValue: '' });

  isConfirmDialogOpen = signal(false);
  confirmDialogConfig = signal<{ title: string; message: string; confirmText: string }>({ title: '', message: '', confirmText: 'OK' });
  private confirmDialogCallback = signal<(() => Promise<void>)>(() => Promise.resolve());

  isLassoing = signal(false);
  lassoRect = signal<{ x: number; y: number; width: number; height: number } | null>(null);
  private lassoStartPoint = { x: 0, y: 0 };
  private mainContentRect: DOMRect | null = null;
  private initialSelectionOnLasso = new Set<string>();
  
  private unlistenMouseMove: (() => void) | null = null;
  private unlistenMouseUp: (() => void) | null = null;
  
  private lastActionId = -1;

  private clickTimer: any = null;
  private readonly CLICK_DELAY = 300; // ms

  dragOverListItemName = signal<string | null>(null);

  // --- Bottom Pane State ---
  bottomPaneHeight = signal(40); // Initial height as percentage
  isResizingBottomPane = signal(false);
  isBottomPaneCollapsed = signal(false);
  private unlistenBottomPaneMouseMove: (() => void) | null = null;
  private unlistenBottomPaneMouseUp: (() => void) | null = null;
  
  streamResults = signal<StreamItem[]>([]);

  @ViewChild('mainContentWrapper') mainContentWrapperEl!: ElementRef<HTMLDivElement>;
  @ViewChild('topPane') topPaneEl!: ElementRef<HTMLDivElement>;
  @ViewChildren('selectableItem', { read: ElementRef }) selectableItemElements!: QueryList<ElementRef>;

  isHighlighted = computed(() => this.isActive() && this.isSplitView());
  
  private providerPath = computed(() => {
    const p = this.path();
    return p.length > 0 ? p.slice(1) : [];
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
      } else {
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
    effect(() => {
      this.refresh();
      this.path();
      this.fileSystemProvider();
      
      this.selectedItems.set(new Set());
      this.itemSelected.emit(null);
      this._loadContents();
    });

    effect(() => {
        Promise.resolve().then(() => this.updateStatus());
    });
    
    effect(() => {
      const action = this.toolbarAction();
      if (action && this.isActive() && action.id > this.lastActionId) {
        this.lastActionId = action.id;
        this.handleToolbarAction(action);
      }
    });
    
    effect(() => {
      if (this.displayMode() === 'grid') {
        this.loadThumbnailsForVisibleItems();
      } else {
        this.thumbnailCache.set(new Map());
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.loadStreamResults();
  }

  private async loadStreamResults(): Promise<void> {
    const hardcodedQuery = 'Angular';
    const imageQuery = 'Technology';

    const [google, images, gemini, youtube, academic] = await Promise.all([
      this.googleSearchService.search(hardcodedQuery),
      this.unsplashService.search(imageQuery),
      this.geminiService.search(hardcodedQuery),
      this.youtubeSearchService.search(hardcodedQuery),
      this.academicSearchService.search(hardcodedQuery)
    ]);

    const webResults: StreamItem[] = google.map(r => ({ ...r, type: 'web' }));
    const imageResults: StreamItem[] = images.map(r => ({ ...r, type: 'image' }));
    const youtubeResults: StreamItem[] = youtube.map(r => ({ ...r, type: 'youtube' }));
    const academicResults: StreamItem[] = academic.map(r => ({ ...r, type: 'academic' }));
    const geminiResult: StreamItem = { query: hardcodedQuery, text: gemini, type: 'gemini' };

    // Interleave results for a mixed stream
    const allResults = [geminiResult, ...webResults, ...imageResults, ...youtubeResults, ...academicResults];
    const interleaved: StreamItem[] = [];
    const maxLength = Math.max(webResults.length, imageResults.length, youtubeResults.length, academicResults.length);

    // Start with Gemini as a hero item
    interleaved.push(geminiResult);
    
    for (let i = 0; i < maxLength; i++) {
        if (webResults[i]) interleaved.push(webResults[i]);
        if (imageResults[i]) interleaved.push(imageResults[i]);
        if (youtubeResults[i]) interleaved.push(youtubeResults[i]);
        if (academicResults[i]) interleaved.push(academicResults[i]);
    }
    
    this.streamResults.set(interleaved);
  }

  ngOnDestroy(): void {
    this.stopLassoing();
    this.stopBottomPaneResize();
    this.renderer.removeStyle(document.body, 'user-select');
    if (this.clickTimer) clearTimeout(this.clickTimer);
  }

  private updateStatus(): void {
    const hasFilter = this.filterQuery().trim().length > 0;
    this.statusChanged.emit({
      selectedItemsCount: this.selectedItems().size,
      totalItemsCount: this.state().items.length,
      filteredItemsCount: hasFilter ? this.filteredItems().length : null,
    });
  }
  
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
  }

  async loadThumbnailsForVisibleItems(): Promise<void> {
    const items = this.filteredItems();
    const imageItems = items.filter(item => this.isImageFile(item.name));
    
    this.thumbnailCache.update(cache => {
        const newCache = new Map(cache);
        for (const item of imageItems) {
            if (!newCache.has(item.name)) {
                newCache.set(item.name, { url: null, isLoading: true });
            }
        }
        return newCache;
    });
    
    for (const item of imageItems) {
        if (this.thumbnailCache().get(item.name)?.url) continue;
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
                newCache.set(item.name, { url: null, isLoading: false });
                return newCache;
            });
        }
    }
  }

  async openItem(item: FileSystemNode): Promise<void> {
    if (item.type === 'folder') {
      this.pathChanged.emit([...this.path(), item.name]);
      return;
    }

    this.previewItem.set(item);
    if (item.content) return;

    this.isPreviewLoading.set(true);
    try {
      const content = await this.fileSystemProvider().getFileContent(this.providerPath(), item.name);
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
    if (lastDot === -1 || lastDot === 0) return null;
    return filename.substring(lastDot + 1);
  }

  closePreview(): void {
    this.previewItem.set(null);
    this.isPreviewLoading.set(false);
  }
  
  onItemClick(event: MouseEvent, item: FileSystemNode): void {
    if (this.editingItemName()) return;

    event.stopPropagation();
    this.closeContextMenu();
    this.closeDestinationSubMenu();
    
    const isCtrlOrMeta = event.metaKey || event.ctrlKey;
    const isShift = event.shiftKey;
    const itemName = item.name;

    if (isShift || isCtrlOrMeta) {
        clearTimeout(this.clickTimer);
        this.clickTimer = null;
        if (isShift && this.lastSelectedItemName()) {
            this.handleShiftSelection(itemName);
        } else {
            this.handleCtrlMetaSelection(itemName);
        }
        this.updateSingleSelectedItem();
        return;
    }
    
    if (this.clickTimer) {
        clearTimeout(this.clickTimer);
        this.clickTimer = null;
        this.openItem(item);
        return;
    }
    
    const isRenameCandidate = this.selectedItems().size === 1 && this.selectedItems().has(itemName);
    
    this.clickTimer = setTimeout(() => {
        this.clickTimer = null;
        if (isRenameCandidate) {
            this.onRename();
        } else {
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

  onContextMenu(event: MouseEvent, item: FileSystemNode | null = null): void {
    if (this.editingItemName()) return;
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

  createFolder(): void {
    this.inputDialogConfig.set({ title: 'Create New Folder', message: 'Enter a name for the new folder:', initialValue: 'New folder' });
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
    this.inputDialogConfig.set({ title: 'Create New File', message: 'Enter a name for the new file:', initialValue: 'New file.txt' });
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
      await Promise.all(Array.from(files).map(file => this.fileSystemProvider().uploadFile(this.providerPath(), file)));
    } catch (e) {
      alert(`Error uploading files: ${(e as Error).message}`);
    } finally {
      await this.loadContents();
    }
  }
  
  onCut(): void {
    this.clipboardService.set({ operation: 'cut', sourceProvider: this.fileSystemProvider(), sourcePath: this.path(), items: this.getSelectedNodes() });
    this.closeContextMenu();
  }
  
  onCopy(): void {
    this.clipboardService.set({ operation: 'copy', sourceProvider: this.fileSystemProvider(), sourcePath: this.path(), items: this.getSelectedNodes() });
    this.closeContextMenu();
  }
  
  async onPaste(): Promise<void> {
    this.closeContextMenu();
    const clip = this.clipboardService.get();
    if (!clip) return;

    try {
      const itemRefs = clip.items.map(this.getItemReference);
      const sourceProviderPath = clip.sourcePath.length > 0 ? clip.sourcePath.slice(1) : [];
      if (clip.operation === 'cut') {
        await clip.sourceProvider.move(sourceProviderPath, this.providerPath(), itemRefs);
        this.clipboardService.clear();
      } else {
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

    if (oldName.endsWith('.magnet') && !trimmedNewName.endsWith('.magnet')) {
      trimmedNewName += '.magnet';
    }

    if (!trimmedNewName || oldName === trimmedNewName) {
      this.cancelRename();
      return;
    }

    try {
      await this.fileSystemProvider().rename(this.providerPath(), oldName, trimmedNewName);
      await this.loadContents();
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
    if (item.type !== 'folder' || item.name.endsWith('.magnet')) return;
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
        } else {
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

    this.confirmDialogConfig.set({ title: 'Confirm Deletion', message: `Are you sure you want to delete ${selectedNodes.length} item(s)? This action cannot be undone.`, confirmText: 'Delete' });
    this.confirmDialogCallback.set(this.executeDelete.bind(this));
    this.isConfirmDialogOpen.set(true);
  }
  
  private async executeDelete(): Promise<void> {
    const selectedNodes = this.getSelectedNodes();
    try {
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
      this.selectedItems.set(new Set());
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
  
  async onInputDialogSubmit(name: string): Promise<void> {
    const callback = this.inputDialogCallback();
    if (callback) await callback(name);
    this.closeInputDialog();
  }

  closeInputDialog(): void {
    this.isInputDialogOpen.set(false);
  }

  async onConfirmDialogConfirm(): Promise<void> {
    const callback = this.confirmDialogCallback();
    if (callback) await callback();
    this.closeConfirmDialog();
  }

  closeConfirmDialog(): void {
    this.isConfirmDialogOpen.set(false);
  }

  onItemDragStart(event: DragEvent, item: FileSystemNode): void {
    if (!this.selectedItems().has(item.name)) {
      this.handleSingleSelection(item.name);
      this.updateSingleSelectedItem();
    }

    const payload: DragDropPayload = {
      type: 'filesystem',
      payload: { sourceProvider: this.fileSystemProvider(), sourcePath: this.path(), items: this.getSelectedNodes() }
    };
    this.dragDropService.startDrag(payload);
    
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/json', JSON.stringify(payload));
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

  onMainAreaMouseDown(event: MouseEvent): void {
    if (this.editingItemName()) return;
    if (event.button !== 0 || (event.target as HTMLElement).closest('[data-is-selectable-item]')) return;
    
    this.closeContextMenu();
    this.closeDestinationSubMenu();
    
    if (this.displayMode() === 'list') {
      this.selectedItems.set(new Set());
      this.updateSingleSelectedItem();
    } else {
      event.preventDefault();
      this.startLassoing(event);
    }
  }

  private startLassoing(event: MouseEvent): void {
    this.isLassoing.set(true);
    this.mainContentRect = this.topPaneEl.nativeElement.getBoundingClientRect();
    this.lassoStartPoint = { x: event.clientX - this.mainContentRect.left, y: event.clientY - this.mainContentRect.top };
    
    this.renderer.setStyle(document.body, 'user-select', 'none');
    
    this.initialSelectionOnLasso = (event.metaKey || event.ctrlKey) ? new Set(this.selectedItems()) : new Set();
    if (!event.metaKey && !event.ctrlKey) {
        this.selectedItems.set(new Set());
        this.updateSingleSelectedItem();
    }

    this.unlistenMouseMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => this.onLassoMove(e));
    this.unlistenMouseUp = this.renderer.listen('document', 'mouseup', () => this.stopLassoing());
  }

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
      const intersects = !(lassoDomRect.right < itemRect.left || lassoDomRect.left > itemRect.right || lassoDomRect.bottom < itemRect.top || lassoDomRect.top > itemRect.bottom);

      if (intersects) {
        if ((event.metaKey || event.ctrlKey) && this.initialSelectionOnLasso.has(itemName)) {
          newSelection.delete(itemName);
        } else {
          newSelection.add(itemName);
        }
      }
    });

    this.selectedItems.set(newSelection);
  }

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

  onMainAreaDragOver(event: DragEvent): void {
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
      if (payload.payload.items.some(draggedItem => draggedItem.name === item.name)) return;
      const destPath = [...this.path(), item.name];
      if (payload.payload.items.some(draggedItem => destPath.join('/').startsWith([...payload.payload.sourcePath, draggedItem.name].join('/')))) return;
    }

    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = payload.type === 'filesystem' ? 'move' : 'copy';
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

  startBottomPaneResize(event: MouseEvent): void {
    this.isResizingBottomPane.set(true);
    const container = this.mainContentWrapperEl.nativeElement;
    const containerRect = container.getBoundingClientRect();

    event.preventDefault();
    this.renderer.setStyle(document.body, 'user-select', 'none');

    this.unlistenBottomPaneMouseMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
        const mouseY = e.clientY - containerRect.top;
        const totalHeight = containerRect.height;
        let newHeightPercent = ((totalHeight - mouseY) / totalHeight) * 100;

        const minHeightPercent = 15;
        const maxHeightPercent = 85;
        if (newHeightPercent < minHeightPercent) newHeightPercent = minHeightPercent;
        if (newHeightPercent > maxHeightPercent) newHeightPercent = maxHeightPercent;

        this.bottomPaneHeight.set(newHeightPercent);
    });
    
    this.unlistenBottomPaneMouseUp = this.renderer.listen('document', 'mouseup', () => {
        this.stopBottomPaneResize();
    });
  }

  private stopBottomPaneResize(): void {
      if (!this.isResizingBottomPane()) return;
      this.isResizingBottomPane.set(false);
      this.renderer.removeStyle(document.body, 'user-select');
      if (this.unlistenBottomPaneMouseMove) {
          this.unlistenBottomPaneMouseMove();
          this.unlistenBottomPaneMouseMove = null;
      }
      if (this.unlistenBottomPaneMouseUp) {
          this.unlistenBottomPaneMouseUp();
          this.unlistenBottomPaneMouseUp = null;
      }
  }

  toggleBottomPane(): void {
    this.isBottomPaneCollapsed.update(v => !v);
  }
}
