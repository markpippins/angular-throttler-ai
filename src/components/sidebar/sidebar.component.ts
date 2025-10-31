import { Component, ChangeDetectionStrategy, signal, inject, Renderer2, OnDestroy, input, output, HostListener, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabControlComponent } from '../tabs/tab-control.component.js';
import { TabComponent } from '../tabs/tab.component.js';
import { ChatComponent } from '../chat/chat.component.js';
import { VerticalToolbarComponent } from '../vertical-toolbar/vertical-toolbar.component.js';
import { FileSystemNode } from '../../models/file-system.model.js';
import { TreeViewComponent } from '../tree-view/tree-view.component.js';
import { ImageService } from '../../services/image.service.js';
import { DragDropPayload } from '../../services/drag-drop.service.js';
import { NewBookmark } from '../../models/bookmark.model.js';
import { InputDialogComponent } from '../input-dialog/input-dialog.component.js';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component.js';
import { FileSystemProvider } from '../../services/file-system-provider.js';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  imports: [CommonModule, TabControlComponent, TabComponent, ChatComponent, VerticalToolbarComponent, TreeViewComponent, InputDialogComponent, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnDestroy {
  folderTree = input<FileSystemNode | null>(null);
  currentPath = input<string[]>([]);
  imageService = input<ImageService | null>(null);
  getProvider = input<(path: string[]) => FileSystemProvider>();
  
  pathChange = output<string[]>();
  refreshTree = output<void>();
  loadChildren = output<string[]>();
  itemsMoved = output<{ destPath: string[]; payload: DragDropPayload }>();
  bookmarkDropped = output<{ bookmark: NewBookmark, destPath: string[] }>();
  serversMenuClick = output<void>();
  renameItemInTree = output<{ path: string[], newName: string }>();
  deleteItemInTree = output<string[]>();
  createFolderInTree = output<{ path: string[], name: string }>();
  createFileInTree = output<{ path: string[], name: string }>();

  isCollapsed = signal(false);
  width = signal(288); // Default width is 288px (w-72)
  isResizing = signal(false);
  treeExpansionCommand = signal<{ command: 'expand' | 'collapse', id: number } | null>(null);
  isHamburgerMenuOpen = signal(false);

  // --- Context Menu State ---
  contextMenu = signal<{ x: number; y: number; path: string[]; node: FileSystemNode } | null>(null);
  isNewAllowedInContextMenu = computed(() => (this.contextMenu()?.path.length ?? 0) > 0);
  
  // --- Dialog State ---
  isInputDialogOpen = signal(false);
  private inputDialogCallback = signal<((value: string) => void) | null>(null);
  inputDialogConfig = signal<{ title: string; message: string; initialValue: string }>({ title: '', message: '', initialValue: '' });
  
  isConfirmDialogOpen = signal(false);
  private confirmDialogCallback = signal<(() => void) | null>(null);
  confirmDialogConfig = signal<{ title: string; message: string; confirmText: string }>({ title: '', message: '', confirmText: 'OK' });

  private preCollapseWidth = 288;
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);
  
  private unlistenMouseMove: (() => void) | null = null;
  private unlistenMouseUp: (() => void) | null = null;
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
        if (this.isHamburgerMenuOpen()) this.isHamburgerMenuOpen.set(false);
    }
    // Always close context menu on any document click
    if (this.contextMenu()) this.contextMenu.set(null);
  }

  toggleCollapse(): void {
    const collapsing = !this.isCollapsed();
    if (collapsing) {
      this.preCollapseWidth = this.width();
    }
    this.isCollapsed.set(collapsing);
    if (!collapsing) { // on expand
      this.width.set(this.preCollapseWidth);
    }
  }
  
  startResize(event: MouseEvent): void {
    if (this.isCollapsed()) return;

    this.isResizing.set(true);
    const startX = event.clientX;
    const startWidth = this.width();

    event.preventDefault();

    this.unlistenMouseMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
      const dx = e.clientX - startX;
      let newWidth = startWidth + dx;
      
      if (newWidth < 150) newWidth = 150;
      if (newWidth > 500) newWidth = 500;
      
      this.width.set(newWidth);
    });

    this.unlistenMouseUp = this.renderer.listen('document', 'mouseup', () => {
      this.stopResize();
    });
  }

  private stopResize(): void {
    if (!this.isResizing()) return;
    this.isResizing.set(false);
    if (this.unlistenMouseMove) {
      this.unlistenMouseMove();
      this.unlistenMouseMove = null;
    }
    if (this.unlistenMouseUp) {
      this.unlistenMouseUp();
      this.unlistenMouseUp = null;
    }
  }

  onTreeViewPathChange(path: string[]): void {
    this.pathChange.emit(path);
  }

  onRefreshTree(): void {
    this.refreshTree.emit();
  }

  onExpandAll(): void {
    this.treeExpansionCommand.set({ command: 'expand', id: Date.now() });
  }

  onCollapseAll(): void {
    this.treeExpansionCommand.set({ command: 'collapse', id: Date.now() });
  }

  onLoadChildren(path: string[]): void {
    this.loadChildren.emit(path);
  }

  onItemsDropped(event: { destPath: string[]; payload: DragDropPayload }): void {
    this.itemsMoved.emit(event);
  }

  onBookmarkDropped(event: { bookmark: NewBookmark, destPath: string[] }): void {
    this.bookmarkDropped.emit(event);
  }
  
  toggleHamburgerMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isHamburgerMenuOpen.update(v => !v);
  }

  onServersMenuClick(): void {
    this.serversMenuClick.emit();
    this.isHamburgerMenuOpen.set(false);
  }
  
  onTreeContextMenu(event: { event: MouseEvent; path: string[]; node: FileSystemNode; }): void {
    event.event.preventDefault();
    event.event.stopPropagation();
    this.contextMenu.set({ x: event.event.clientX, y: event.event.clientY, path: event.path, node: event.node });
  }

  private findNodeByPath(root: FileSystemNode | null, path: string[]): FileSystemNode | null {
    if (!root) return null;

    if (path.length === 0) {
      // An empty path corresponds to the root of the tree itself ('Home')
      return root;
    }

    let currentNode: FileSystemNode | undefined = root;
    for (const segment of path) {
      currentNode = currentNode?.children?.find(c => c.name === segment);
      if (!currentNode) return null;
    }
    
    return currentNode ?? null;
  }
  
  onSidebarAreaContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.contextMenu.set(null); // Close any existing menu

    const path = this.currentPath();
    const root = this.folderTree();
    const nodeForPath = this.findNodeByPath(root, path);

    if (nodeForPath) {
      // Set the context to the currently active path, allowing actions like "New Folder"
      // to apply to the folder currently being viewed in the main pane.
      this.contextMenu.set({ x: event.clientX, y: event.clientY, path: path, node: nodeForPath });
    }
  }

  // --- Context Menu Action Handlers ---

  handleRename(): void {
    const ctx = this.contextMenu();
    if (!ctx) return;
    this.contextMenu.set(null);
    this.inputDialogConfig.set({ title: 'Rename', message: 'Enter a new name:', initialValue: ctx.node.name });
    this.inputDialogCallback.set((newName: string) => {
      this.renameItemInTree.emit({ path: ctx.path, newName });
    });
    this.isInputDialogOpen.set(true);
  }

  handleDelete(): void {
    const ctx = this.contextMenu();
    if (!ctx) return;
    this.contextMenu.set(null);
    this.confirmDialogConfig.set({ title: 'Confirm Deletion', message: `Are you sure you want to delete "${ctx.node.name}"?`, confirmText: 'Delete' });
    this.confirmDialogCallback.set(() => {
        this.deleteItemInTree.emit(ctx.path);
    });
    this.isConfirmDialogOpen.set(true);
  }

  handleNewFolder(): void {
    const ctx = this.contextMenu();
    if (!ctx) return;
    this.contextMenu.set(null);
    this.inputDialogConfig.set({ title: 'New Folder', message: `Enter a name for the new folder inside "${ctx.node.name}":`, initialValue: 'New folder' });
    this.inputDialogCallback.set((name: string) => {
      this.createFolderInTree.emit({ path: ctx.path, name });
    });
    this.isInputDialogOpen.set(true);
  }

  handleNewFile(): void {
    const ctx = this.contextMenu();
    if (!ctx) return;
    this.contextMenu.set(null);
    this.inputDialogConfig.set({ title: 'New File', message: `Enter a name for the new file inside "${ctx.node.name}":`, initialValue: 'New file.txt' });
    this.inputDialogCallback.set((name: string) => {
      this.createFileInTree.emit({ path: ctx.path, name });
    });
    this.isInputDialogOpen.set(true);
  }
  
  // --- Dialog Submit/Cancel Handlers ---

  onInputDialogSubmit(value: string): void {
    this.inputDialogCallback()?.(value);
    this.isInputDialogOpen.set(false);
  }
  
  onConfirmDialogConfirm(): void {
    this.confirmDialogCallback()?.();
    this.isConfirmDialogOpen.set(false);
  }

  ngOnDestroy(): void {
    this.stopResize();
  }
}