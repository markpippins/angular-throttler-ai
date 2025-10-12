import { Component, ChangeDetectionStrategy, signal, computed, effect, inject, ViewChildren, QueryList, ElementRef, Renderer2, OnDestroy, ViewChild, input, output } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model';
import { FileSystemProvider, ItemReference } from '../../services/file-system-provider';
import { ImageService } from '../../services/image.service';
import { ToolbarComponent, SortCriteria } from '../toolbar/toolbar.component';
import { FolderComponent } from '../folder/folder.component';
import { ClipboardService } from '../../services/clipboard.service';

interface FileSystemState {
  status: 'loading' | 'success' | 'error';
  items: FileSystemNode[];
  error?: string;
}

@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
  imports: [CommonModule, NgOptimizedImage, ToolbarComponent, FolderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileExplorerComponent implements OnDestroy {
  private imageService = inject(ImageService);
  private renderer = inject(Renderer2);
  private clipboardService = inject(ClipboardService);

  // Inputs & Outputs for multi-pane communication
  id = input.required<number>();
  path = input.required<string[]>();
  isActive = input(false);
  isSplitView = input(false);
  fileSystemProvider = input.required<FileSystemProvider>();

  activated = output<number>();
  pathChanged = output<string[]>();

  rootName = computed(() => this.fileSystemProvider().getFolderTree().then(tree => tree.name));
  state = signal<FileSystemState>({ status: 'loading', items: [] });
  contextMenu = signal<{ x: number; y: number; item: FileSystemNode | null } | null>(null);
  previewItem = signal<FileSystemNode | null>(null);
  loadedImageItems = signal<Set<string>>(new Set());
  failedImageItems = signal<Set<string>>(new Set());
  isDragOverMainArea = signal(false);

  // Selection
  selectedItems = signal<Set<string>>(new Set());
  private lastSelectedItemName = signal<string | null>(null);

  // UI State
  isShareDialogOpen = signal(false);
  sortCriteria = signal<SortCriteria>({ key: 'name', direction: 'asc' });

  // Lasso selection state
  isLassoing = signal(false);
  lassoRect = signal<{ x: number; y: number; width: number; height: number } | null>(null);
  private lassoStartPoint = { x: 0, y: 0 };
  private mainContentRect: DOMRect | null = null;
  private initialSelectionOnLasso = new Set<string>();
  
  private unlistenMouseMove: (() => void) | null = null;
  private unlistenMouseUp: (() => void) | null = null;

  @ViewChild('mainContent') mainContentEl!: ElementRef<HTMLDivElement>;
  @ViewChildren('selectableItem', { read: ElementRef }) selectableItemElements!: QueryList<ElementRef>;

  // Computed properties for UI binding
  isHighlighted = computed(() => this.isActive() && this.isSplitView());
  canCutCopyShareDelete = computed(() => this.selectedItems().size > 0);
  canPaste = computed(() => {
    const clip = this.clipboardService.clipboard();
    if (!clip) return false;
    // For now, only allow pasting within the same filesystem type.
    // This is a simplification; a real implementation might handle transfers across providers.
    const currentProvider = this.fileSystemProvider();
    // A simple check by constructor name. A more robust check might involve a provider ID.
    return clip.sourceProvider.constructor.name === currentProvider.constructor.name;
  });
  canRename = computed(() => this.selectedItems().size === 1);
  canGoUp = computed(() => this.path().length > 0);
  
  sortedItems = computed(() => {
    const items = [...this.state().items];
    const { key, direction } = this.sortCriteria();
    const directionMultiplier = direction === 'asc' ? 1 : -1;

    items.sort((a, b) => {
      // Primary sort: folders first
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;

      // Secondary sort: by selected key
      let valA: string | number, valB: string | number;

      if (key === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else { // 'modified'
        // For dates, descending should be newest first, so we reverse the values before multiplying
        valA = b.modified ? new Date(b.modified).getTime() : 0;
        valB = a.modified ? new Date(a.modified).getTime() : 0;
      }

      if (valA < valB) {
        return -1 * directionMultiplier;
      }
      if (valA > valB) {
        return 1 * directionMultiplier;
      }
      return 0;
    });

    return items;
  });

  constructor() {
    // Load content when path or provider changes
    effect(() => {
      this.loadContents(this.path());
    });
  }

  ngOnDestroy(): void {
    this.stopLasso();
  }

  async loadContents(path: string[]): Promise<void> {
    console.log(`[Pane ${this.id()}] Loading contents for:`, path.join('/'));
    this.state.update(s => ({ ...s, status: 'loading' }));
    this.loadedImageItems.set(new Set());
    this.failedImageItems.set(new Set());
    
    try {
      const items = await this.fileSystemProvider().getContents(path);
      this.state.set({ status: 'success', items });
    } catch (e) {
      this.state.set({ status: 'error', items: [], error: (e as Error).message });
    }
  }

  private getSelectedNodes(): FileSystemNode[] {
    const selectedNames = this.selectedItems();
    if (selectedNames.size === 0) return [];
    return this.state().items.filter(item => selectedNames.has(item.name));
  }

  // Toolbar Actions
  onCut(): void {
    const selectedNodes = this.getSelectedNodes();
    if (selectedNodes.length > 0) {
      this.clipboardService.set({
        operation: 'cut',
        sourceProvider: this.fileSystemProvider(),
        sourcePath: this.path(),
        items: selectedNodes
      });
    }
  }

  onCopy(): void {
    const selectedNodes = this.getSelectedNodes();
    if (selectedNodes.length > 0) {
      this.clipboardService.set({
        operation: 'copy',
        sourceProvider: this.fileSystemProvider(),
        sourcePath: this.path(),
        items: selectedNodes
      });
    }
  }

  async onPaste(): Promise<void> {
    const clip = this.clipboardService.clipboard();
    if (!this.canPaste() || !clip) return;

    this.state.update(s => ({ ...s, status: 'loading' }));
    try {
      const itemsToPaste: ItemReference[] = clip.items.map(i => ({ name: i.name, type: i.type }));
      const provider = this.fileSystemProvider();

      if (clip.operation === 'copy') {
        await provider.copy(clip.sourcePath, this.path(), itemsToPaste);
      } else {
        await provider.move(clip.sourcePath, this.path(), itemsToPaste);
        // Clear clipboard only on cut-paste
        this.clipboardService.clear();
      }
      this.loadContents(this.path());
    } catch (e) {
      alert(`Paste failed: ${(e as Error).message}`);
      this.state.update(s => ({...s, status: 'success'})); // Revert loading state on error
    }
  }

  onRename(): void {
    if (!this.canRename()) return;
    const selectedNode = this.getSelectedNodes()[0];
    if (selectedNode) {
      this.promptAndRename(selectedNode);
    }
  }

  onShare(): void {
    if (this.selectedItems().size > 0) {
      this.isShareDialogOpen.set(true);
    }
  }

  closeShareDialog(): void {
    this.isShareDialogOpen.set(false);
  }

  onDelete(): void {
    this.deleteItems(this.getSelectedNodes());
  }

  onSortChange(criteria: SortCriteria): void {
    this.sortCriteria.set(criteria);
  }

  // Context Menu Handlers
  handleRenameFromContextMenu(): void {
    const item = this.contextMenu()?.item;
    if (item) this.promptAndRename(item);
    this.closeContextMenu();
  }

  handleDeleteFromContextMenu(): void {
    const item = this.contextMenu()?.item;
    if (item) this.deleteItems([item]);
    this.closeContextMenu();
  }
  
  // Refactored Core Actions
  async promptAndRename(item: FileSystemNode): Promise<void> {
    const newName = prompt('Enter new name:', item.name);
    if (newName && newName !== item.name) {
      try {
        this.state.update(s => ({...s, status: 'loading' }));
        await this.fileSystemProvider().rename(this.path(), item.name, newName);
        this.loadContents(this.path());
      } catch (e) {
        alert(`Error: ${(e as Error).message}`);
        this.state.update(s => ({...s, status: 'success' }));
      }
    }
  }

  async deleteItems(items: FileSystemNode[]): Promise<void> {
    if (items.length === 0) return;
    
    const message = items.length === 1 
      ? `Are you sure you want to delete "${items[0].name}"?`
      : `Are you sure you want to delete ${items.length} items?`;

    if (confirm(message)) {
      try {
        this.state.update(s => ({...s, status: 'loading' }));
        const deletePromises = items.map(item => 
          item.type === 'folder'
            ? this.fileSystemProvider().removeDirectory(this.path(), item.name)
            : this.fileSystemProvider().deleteFile(this.path(), item.name)
        );
        await Promise.all(deletePromises);
        this.loadContents(this.path());
      } catch (e) {
        alert(`Error: ${(e as Error).message}`);
        this.state.update(s => ({...s, status: 'success' }));
      }
    }
  }

  getIconUrl(item: FileSystemNode): string | null {
    return this.imageService.getIconUrl(item);
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

  openItem(item: FileSystemNode): void {
    if (item.type === 'folder') {
      this.selectedItems.set(new Set());
      this.lastSelectedItemName.set(null);
      this.pathChanged.emit([...this.path(), item.name]);
    } else {
      this.previewItem.set(item);
    }
  }

  closePreview(): void {
    this.previewItem.set(null);
  }

  goUp(): void {
    if (this.canGoUp()) {
      this.pathChanged.emit(this.path().slice(0, -1));
    }
  }

  navigateToPath(index: number): void {
    const newPath = index === -1 ? [] : this.path().slice(0, index + 1);
    this.pathChanged.emit(newPath);
  }
  
  onContextMenu(event: MouseEvent, item: FileSystemNode | null = null): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.set({ x: event.clientX, y: event.clientY, item });
  }

  closeContextMenu(): void {
    this.contextMenu.set(null);
  }

  onImageLoad(itemName: string): void {
    this.loadedImageItems.update(currentSet => {
      const newSet = new Set(currentSet);
      newSet.add(itemName);
      return newSet;
    });
  }

  onImageError(itemName: string): void {
    this.failedImageItems.update(currentSet => {
      const newSet = new Set(currentSet);
      newSet.add(itemName);
      return newSet;
    });
  }

  async createFolder(): Promise<void> {
    const name = prompt('Enter folder name:');
    if (name) {
      try {
        await this.fileSystemProvider().createDirectory(this.path(), name);
        this.loadContents(this.path());
      } catch (e) {
        alert(`Error: ${(e as Error).message}`);
      }
    }
    this.closeContextMenu();
  }

  async createFile(): Promise<void> {
    const name = prompt('Enter file name:');
    if (name) {
      try {
        await this.fileSystemProvider().createFile(this.path(), name);
        this.loadContents(this.path());
      } catch (e) {
        alert(`Error: ${(e as Error).message}`);
      }
    }
    this.closeContextMenu();
  }

  onFilesUploaded(files: FileList): void {
    this.uploadFiles(files, this.path());
  }

  onFolderDrop(event: { files: FileList; item: FileSystemNode }): void {
    const destinationPath = [...this.path(), event.item.name];
    this.uploadFiles(event.files, destinationPath);
  }

  private async uploadFiles(files: FileList, path: string[]): Promise<void> {
    if (!files || files.length === 0) {
      return;
    }
    this.state.update(s => ({ ...s, status: 'loading' }));
    try {
      const uploadPromises = Array.from(files).map(file =>
        this.fileSystemProvider().uploadFile(path, file)
      );
      await Promise.all(uploadPromises);
      this.loadContents(this.path());
    } catch (e) {
      alert(`Upload failed: ${(e as Error).message}`);
      this.state.update(s => ({...s, status: 'success'}));
    }
  }

  onMainAreaDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOverMainArea.set(true);
  }

  onMainAreaDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOverMainArea.set(false);
  }

  onMainAreaDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOverMainArea.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFiles(files, this.path());
    }
  }

  onItemClick(event: MouseEvent, item: FileSystemNode): void {
    const itemName = item.name;
    const currentSelection = new Set(this.selectedItems());
    const items = this.sortedItems();

    if (event.shiftKey && this.lastSelectedItemName()) {
      const lastIndex = items.findIndex(i => i.name === this.lastSelectedItemName());
      const currentIndex = items.findIndex(i => i.name === itemName);

      if (lastIndex > -1 && currentIndex > -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        
        if (!event.ctrlKey && !event.metaKey) {
            currentSelection.clear();
        }

        for (let i = start; i <= end; i++) {
          currentSelection.add(items[i].name);
        }
        this.selectedItems.set(currentSelection);
      }
    } else if (event.ctrlKey || event.metaKey) {
      if (currentSelection.has(itemName)) {
        currentSelection.delete(itemName);
      } else {
        currentSelection.add(itemName);
      }
      this.selectedItems.set(currentSelection);
      this.lastSelectedItemName.set(itemName);
    } else {
      this.selectedItems.set(new Set([itemName]));
      this.lastSelectedItemName.set(itemName);
    }
  }

  onMainAreaMouseDown(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('[data-is-selectable-item]')) {
      return;
    }
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      this.initialSelectionOnLasso = new Set(this.selectedItems());
    } else {
      this.initialSelectionOnLasso.clear();
      this.selectedItems.set(new Set());
    }
    
    this.mainContentRect = this.mainContentEl.nativeElement.getBoundingClientRect();
    this.lassoStartPoint = { x: event.clientX, y: event.clientY };
    this.isLassoing.set(true);
    
    this.unlistenMouseMove = this.renderer.listen('document', 'mousemove', (e) => this.onDocumentMouseMove(e));
    this.unlistenMouseUp = this.renderer.listen('document', 'mouseup', () => this.stopLasso());
  }

  private onDocumentMouseMove(event: MouseEvent): void {
    if (!this.isLassoing() || !this.mainContentRect) return;
    event.preventDefault();

    const { clientX: currentX, clientY: currentY } = event;
    const { x: startX, y: startY } = this.lassoStartPoint;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    this.lassoRect.set({
      x: left - this.mainContentRect.left,
      y: top - this.mainContentRect.top,
      width,
      height
    });

    this.updateSelectionFromLasso();
  }

  private stopLasso(): void {
    if (!this.isLassoing()) return;
    this.isLassoing.set(false);
    this.lassoRect.set(null);
    if (this.unlistenMouseMove) this.unlistenMouseMove();
    if (this.unlistenMouseUp) this.unlistenMouseUp();
    this.unlistenMouseMove = null;
    this.unlistenMouseUp = null;
  }
  
  private updateSelectionFromLasso(): void {
    if (!this.lassoRect() || !this.mainContentRect) return;

    const lassoAbsoluteRect = {
      left: this.lassoRect()!.x + this.mainContentRect.left,
      top: this.lassoRect()!.y + this.mainContentRect.top,
      right: this.lassoRect()!.x + this.mainContentRect.left + this.lassoRect()!.width,
      bottom: this.lassoRect()!.y + this.mainContentRect.top + this.lassoRect()!.height
    };

    const items = this.sortedItems();
    const newSelection = new Set<string>(this.initialSelectionOnLasso);

    this.selectableItemElements.forEach((elRef, index) => {
      const itemRect = elRef.nativeElement.getBoundingClientRect();
      const intersects = !(itemRect.right < lassoAbsoluteRect.left || 
                           itemRect.left > lassoAbsoluteRect.right || 
                           itemRect.bottom < lassoAbsoluteRect.top || 
                           itemRect.top > lassoAbsoluteRect.bottom);

      if (intersects) {
        newSelection.add(items[index].name);
      }
    });

    this.selectedItems.set(newSelection);
  }
}