import { Component, ChangeDetectionStrategy, signal, computed, effect, inject, ViewChildren, QueryList, ElementRef, Renderer2, OnDestroy, ViewChild, input, output } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FileSystemNode, SearchResultNode } from '../../models/file-system.model';
import { FileSystemProvider, ItemReference } from '../../services/file-system-provider';
import { ImageService } from '../../services/image.service';
import { ToolbarComponent, SortCriteria } from '../toolbar/toolbar.component';
import { FolderComponent } from '../folder/folder.component';
import { ClipboardService } from '../../services/clipboard.service';
import { SearchResultsComponent } from '../search-results/search-results.component';
import { PropertiesDialogComponent } from '../properties-dialog/properties-dialog.component';
import { DestinationNodeComponent } from '../destination-node/destination-node.component';

export { SearchResultNode };

interface FileSystemState {
  status: 'loading' | 'success' | 'error';
  items: FileSystemNode[];
  error?: string;
}

@Component({
  selector: 'app-file-explorer',
  template: `
<div 
  class="flex flex-col h-full font-sans antialiased bg-[rgb(var(--color-surface))] overflow-hidden rounded-md ring-2 ring-inset"
  [class.ring-[rgb(var(--color-accent-ring))]]="isHighlighted()"
  [class.ring-transparent]="!isHighlighted()"
  (click)="closeContextMenu(); closeDestinationSubMenu()"
  (mousedown)="activated.emit(id())">

  <!-- Header / Toolbar -->
  <div class="h-12 px-4 border-b border-[rgb(var(--color-border-base))] flex items-center space-x-2 flex-shrink-0">
    <button (click)="goUp()" [disabled]="!canGoUp()" title="Up" class="p-2 rounded-md hover:bg-[rgb(var(--color-surface-hover-subtle))] disabled:opacity-50 disabled:cursor-not-allowed">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[rgb(var(--color-text-muted))]" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
    </button>
    <!-- Address Bar -->
    <div class="flex-grow flex items-center bg-[rgb(var(--color-background))] rounded-md border border-[rgb(var(--color-border-muted))] px-2 py-1 text-sm">
      <button (click)="navigateToPath(-1)" class="text-[rgb(var(--color-accent-text))] hover:underline cursor-pointer">{{ rootName() }}</button>
      @if (path().length > 0) {
        <span class="mx-1 text-[rgb(var(--color-text-subtle))]">\\</span>
      }
      @for (segment of path(); track segment; let i = $index) {
        <button (click)="navigateToPath(i)" class="text-[rgb(var(--color-accent-text))] hover:underline cursor-pointer">{{ segment }}</button>
        @if (!$last) {
          <span class="mx-1 text-[rgb(var(--color-text-subtle))]">\\</span>
        }
      }
    </div>
    <!-- Quick Search Input -->
    <div class="relative">
      <input 
          type="search" 
          placeholder="Quick search..."
          class="w-48 pl-8 pr-2 py-1 text-sm rounded-md border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-background))] focus:ring-1 focus:ring-[rgb(var(--color-accent-ring))] focus:outline-none"
          [value]="quickSearchQuery()"
          (input)="onQuickSearchInput($event)"
          (keydown.enter)="onQuickSearchSubmit()">
      <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[rgb(var(--color-text-subtle))]" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
          </svg>
      </div>
    </div>
  </div>

  <app-toolbar 
    (newFolderClick)="createFolder()" 
    (newFileClick)="createFile()"
    (filesUploaded)="onFilesUploaded($event)"
    (cutClick)="onCut()"
    (copyClick)="onCopy()"
    (copyItemsTo)="onItemsCopiedTo($event)"
    (moveItemsTo)="onItemsMovedTo($event)"
    (pasteClick)="onPaste()"
    (renameClick)="onRename()"
    (shareClick)="onShare()"
    (deleteClick)="onDelete()"
    (sortChange)="onSortChange($event)"
    (searchClick)="onSearchClick()"
    (closeSearchClick)="onCloseSearchClick()"
    [canCut]="canCutCopyShareDelete()"
    [canCopy]="canCutCopyShareDelete()"
    [canCopyToMoveTo]="canCopyToMoveTo()"
    [canPaste]="canPaste()"
    [canRename]="canRename()"
    [canShare]="canCutCopyShareDelete()"
    [canDelete]="canCutCopyShareDelete()"
    [currentSort]="sortCriteria()"
    [folderTree]="folderTree()"
    [isSearchView]="viewMode() === 'search'">
  </app-toolbar>

  <!-- Main Content Area -->
  <div #mainContent
    class="flex-1 overflow-y-auto relative transition-colors duration-200"
    [class.select-none]="viewMode() === 'explorer'"
    (contextmenu)="onContextMenu($event)"
    (dragover)="onMainAreaDragOver($event)"
    (dragleave)="onMainAreaDragLeave($event)"
    (drop)="onMainAreaDrop($event)"
    (mousedown)="onMainAreaMouseDown($event)">
    
    @if(viewMode() === 'explorer') {
      <div class="p-4"
        [class.bg-blue-50]="isDragOverMainArea()"
        [class.dark:bg-blue-900/10]="isDragOverMainArea()"
        [class.ring-2]="isDragOverMainArea()"
        [class.ring-inset]="isDragOverMainArea()"
        [class.ring-blue-500/50]="isDragOverMainArea()">
        @switch (state().status) {
          @case ('loading') {
            <div class="absolute inset-0 flex items-center justify-center bg-[rgb(var(--color-surface))]/50 z-30">
              <svg class="animate-spin h-10 w-10 text-[rgb(var(--color-accent-text))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          }
          @case ('error') {
            <div class="col-span-full text-center py-12 text-[rgb(var(--color-danger-text))]">
              <p>Error loading files: {{ state().error }}</p>
            </div>
          }
          @case ('success') {
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              @for (item of sortedItems(); track item.name) {
                @if (item.type === 'folder') {
                  <app-folder #selectableItem
                    [item]="item"
                    [iconUrl]="getIconUrl(item)"
                    [hasFailedToLoadImage]="failedImageItems().has(item.name)"
                    [isImageLoaded]="loadedImageItems().has(item.name)"
                    [isSelected]="selectedItems().has(item.name)"
                    (click)="onItemClick($event, item)"
                    (dblclick)="openItem(item)"
                    (itemContextMenu)="onContextMenu($event.event, $event.item)"
                    (itemDrop)="onFolderDrop($event)"
                    (imageError)="onImageError($event)"
                    (imageLoad)="onImageLoad($event)">
                  </app-folder>
                } @else {
                  <div #selectableItem
                    data-is-selectable-item
                    (click)="onItemClick($event, item)" 
                    (dblclick)="openItem(item)" 
                    (contextmenu)="onContextMenu($event, item)" 
                    class="flex flex-col items-center p-2 rounded-md hover:bg-[rgb(var(--color-accent-bg))] cursor-pointer transition-colors duration-150 group"
                    [class.bg-[rgb(var(--color-accent-bg-selected))]]="selectedItems().has(item.name)">
                    @let iconUrl = getIconUrl(item);
                    @if(iconUrl && loadedImageItems().has(item.name)) {
                      <img [ngSrc]="iconUrl" [alt]="item.type" width="64" height="64" class="h-16 w-16 object-contain pointer-events-none" />
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-[rgb(var(--color-text-subtle))] pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 1h8a1 1 0 011 1v10a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1z" clip-rule="evenodd" />
                      </svg>
                      @if(iconUrl && !failedImageItems().has(item.name)) {
                        <img [ngSrc]="iconUrl" [alt]="item.type" width="1" height="1" class="hidden" (load)="onImageLoad(item.name)" (error)="onImageError(item.name)" />
                      }
                    }
                    <span class="mt-2 text-center text-xs break-all truncate w-full text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-accent-text))] pointer-events-none">{{ item.name }}</span>
                  </div>
                }
              } @empty {
                <div class="col-span-full text-center py-12 text-[rgb(var(--color-text-subtle))]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <p class="mt-2">This folder is empty.</p>
                </div>
              }
            </div>
          }
        }
        @if (isLassoing() && lassoRect(); as rect) {
          <div class="absolute border border-[rgb(var(--color-accent-ring))] bg-[rgb(var(--color-accent-ring))]/20 z-20 pointer-events-none"
              [style.left.px]="rect.x"
              [style.top.px]="rect.y"
              [style.width.px]="rect.width"
              [style.height.px]="rect.height">
          </div>
        }
      </div>
    } @else {
      <app-search-results 
        [results]="currentSearchResults()"
        [imageService]="imageService()">
      </app-search-results>
    }

  </div>
  <!-- Status Bar -->
  <div class="p-1 border-t border-[rgb(var(--color-border-base))] text-xs text-[rgb(var(--color-text-muted))] flex-shrink-0">
    @if (viewMode() === 'explorer') {
      @if (selectedItems().size > 0) {
        <span class="mr-4">{{ selectedItems().size }} item(s) selected</span>
      }
      <span>{{ state().items.length }} items</span>
    } @else {
      <span>{{ currentSearchResults().length }} item(s) found</span>
    }
  </div>

  <!-- Context Menu -->
  @if (contextMenu(); as cm) {
    <div class="fixed bg-[rgb(var(--color-surface-dialog))] border border-[rgb(var(--color-border-base))] rounded-md shadow-lg py-1 text-sm text-[rgb(var(--color-text-muted))] z-50"
         [style.left.px]="cm.x"
         [style.top.px]="cm.y"
         (click)="$event.stopPropagation()">
      @if (cm.item) {
        <div class="px-4 py-2 hover:bg-[rgb(var(--color-surface-hover))] cursor-pointer" (click)="handleRenameFromContextMenu()">Rename</div>
        <div class="px-4 py-2 hover:bg-[rgb(var(--color-danger-bg-hover))] cursor-pointer text-[rgb(var(--color-danger-text))] hover:text-[rgb(var(--color-danger-text-hover))]" (click)="handleDeleteFromContextMenu()">Delete</div>
        <div class="my-1 h-px bg-[rgb(var(--color-border-base))]"></div>
        <div class="relative px-4 py-2 hover:bg-[rgb(var(--color-surface-hover))] cursor-pointer flex items-center justify-between"
             (mouseenter)="openDestinationSubMenu('copy', $event)"
             (mouseleave)="onDestinationSubMenuLeave()">
             <span>Copy to</span>
             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 text-[rgb(var(--color-text-subtle))]" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
        </div>
        <div class="relative px-4 py-2 hover:bg-[rgb(var(--color-surface-hover))] cursor-pointer flex items-center justify-between"
             (mouseenter)="openDestinationSubMenu('move', $event)"
             (mouseleave)="onDestinationSubMenuLeave()">
             <span>Move to</span>
             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 text-[rgb(var(--color-text-subtle))]" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
        </div>
        <div class="my-1 h-px bg-[rgb(var(--color-border-base))]"></div>
        <div class="px-4 py-2 hover:bg-[rgb(var(--color-surface-hover))] cursor-pointer" (click)="handlePropertiesFromContextMenu()">Properties</div>
      } @else {
        <div class="px-4 py-2 hover:bg-[rgb(var(--color-surface-hover))] cursor-pointer" (click)="createFolder()">New folder</div>
        <div class="px-4 py-2 hover:bg-[rgb(var(--color-surface-hover))] cursor-pointer" (click)="createFile()">New file</div>
      }
    </div>
  }
  
  <!-- Destination Submenu -->
  @if (destinationSubMenu(); as dsm) {
    <div class="fixed w-48 bg-[rgb(var(--color-surface-dialog))] border border-[rgb(var(--color-border-base))] rounded-md shadow-lg py-1 z-[60]"
         [style.left.px]="dsm.x"
         [style.top.px]="dsm.y"
         (mouseenter)="onDestinationSubMenuEnter()"
         (mouseleave)="onDestinationSubMenuLeave()">
      @if(folderTree(); as tree) {
        @for (child of tree.children; track child.name) {
          @if (child.type === 'folder') {
            <app-destination-node 
              [node]="child" 
              [path]="[child.name]"
              (destinationSelected)="executeCopyToMoveTo(dsm.operation, $event)">
            </app-destination-node>
          }
        }
      }
    </div>
  }

  <!-- File Preview Modal -->
  @if (previewItem(); as item) {
    <div class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" (click)="closePreview()">
      <div class="bg-[rgb(var(--color-surface-dialog))] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
        
        <div class="p-3 border-b border-[rgb(var(--color-border-base))] flex justify-between items-center flex-shrink-0">
          <h3 class="text-lg font-semibold text-[rgb(var(--color-text-base))] truncate pr-4">{{ item.name }}</h3>
          <button (click)="closePreview()" class="p-1 rounded-full hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-muted))]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-4 flex-1 overflow-auto">
          @if (isImageFile(item.name) && item.content) {
            <div class="flex items-center justify-center h-full">
              <img [src]="item.content" [alt]="item.name" class="max-w-full max-h-full object-contain rounded">
            </div>
          } @else {
            <pre class="text-sm text-[rgb(var(--color-text-base))] whitespace-pre-wrap font-mono">{{ item.content || 'File is empty.' }}</pre>
          }
        </div>

      </div>
    </div>
  }

  <!-- Share Dialog -->
  @if (isShareDialogOpen()) {
    <div class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" (click)="closeShareDialog()">
      <div class="bg-[rgb(var(--color-surface-dialog))] rounded-lg shadow-xl w-full max-w-md" (click)="$event.stopPropagation()">
        <div class="p-4 border-b border-[rgb(var(--color-border-base))]">
          <h3 class="text-lg font-semibold text-[rgb(var(--color-text-base))]">Share Item(s)</h3>
        </div>
        <div class="p-6 text-[rgb(var(--color-text-muted))]">
          @if (getSelectedNodes(); as nodes) {
            <p>Sharing is not implemented yet. This is a mock dialog.</p>
            <p class="mt-2 font-medium">
              @if (nodes.length === 1) {
                You are "sharing": {{ nodes[0].name }}
              } @else {
                You are "sharing" {{ nodes.length }} items.
              }
            </p>
          }
        </div>
        <div class="px-4 py-3 bg-[rgb(var(--color-surface-muted))] flex justify-end rounded-b-lg">
          <button (click)="closeShareDialog()" class="px-4 py-2 bg-[rgb(var(--color-accent-solid-bg))] text-[rgb(var(--color-text-inverted))] rounded-md hover:bg-[rgb(var(--color-accent-solid-bg-hover))] transition-colors font-semibold text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  }

  <!-- Properties Dialog -->
  @if (isPropertiesDialogOpen() && propertiesItem(); as item) {
    <app-properties-dialog
      [item]="item"
      [imageService]="imageService()"
      (close)="closePropertiesDialog()">
    </app-properties-dialog>
  }
</div>
  `,
  imports: [CommonModule, NgOptimizedImage, ToolbarComponent, FolderComponent, SearchResultsComponent, PropertiesDialogComponent, DestinationNodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileExplorerComponent implements OnDestroy {
  private renderer = inject(Renderer2);
  private clipboardService = inject(ClipboardService);

  // Inputs & Outputs for multi-pane communication
  id = input.required<number>();
  path = input.required<string[]>();
  isActive = input(false);
  isSplitView = input(false);
  fileSystemProvider = input.required<FileSystemProvider>();
  imageService = input.required<ImageService>();
  folderTree = input<FileSystemNode | null>(null);
  searchResults = input<{ id: number; results: SearchResultNode[] } | null>(null);

  activated = output<number>();
  pathChanged = output<string[]>();
  searchInitiated = output<void>();
  searchCompleted = output<void>();
  quickSearch = output<string>();
  itemSelected = output<FileSystemNode | null>();

  rootName = signal('...');
  state = signal<FileSystemState>({ status: 'loading', items: [] });
  contextMenu = signal<{ x: number; y: number; item: FileSystemNode | null } | null>(null);
  previewItem = signal<FileSystemNode | null>(null);
  loadedImageItems = signal<Set<string>>(new Set());
  failedImageItems = signal<Set<string>>(new Set());
  isDragOverMainArea = signal(false);
  
  quickSearchQuery = signal('');

  // Destination Submenu State
  destinationSubMenu = signal<{ operation: 'copy' | 'move', x: number, y: number } | null>(null);
  private destinationSubMenuTimer: any;

  // View state
  viewMode = signal<'explorer' | 'search'>('explorer');
  currentSearchResults = signal<SearchResultNode[]>([]);

  // Selection
  selectedItems = signal<Set<string>>(new Set());
  private lastSelectedItemName = signal<string | null>(null);

  // UI State
  isShareDialogOpen = signal(false);
  isPropertiesDialogOpen = signal(false);
  propertiesItem = signal<FileSystemNode | null>(null);
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
  canCopyToMoveTo = computed(() => this.selectedItems().size > 0);
  canPaste = computed(() => {
    const clip = this.clipboardService.clipboard();
    if (!clip) return false;
    const currentProvider = this.fileSystemProvider();
    return clip.sourceProvider.constructor.name === currentProvider.constructor.name;
  });
  canRename = computed(() => this.selectedItems().size === 1);
  canGoUp = computed(() => this.path().length > 0);
  
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

  constructor() {
    effect(() => {
      const provider = this.fileSystemProvider();
      // When provider or path changes, load contents
      this.loadContents(this.path());
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
    });
  }

  ngOnDestroy(): void {
    this.stopLassoing();
    // Re-enable text selection when component is destroyed
    this.renderer.removeStyle(document.body, 'user-select');
  }
  
  // --- Data Loading ---
  async loadContents(path: string[]): Promise<void> {
    this.state.set({ status: 'loading', items: [] });
    try {
      const providerPath = path.length > 0 ? path.slice(1) : path;
      const items = await this.fileSystemProvider().getContents(providerPath);
      this.state.set({ status: 'success', items: items });
    } catch (e: unknown) {
      this.state.set({ status: 'error', items: [], error: (e as Error).message });
    }
  }

  updateForSearchResults(search: { id: number; results: SearchResultNode[] } | null): void {
    if (search && search.id === this.id()) {
      this.viewMode.set('search');
      this.currentSearchResults.set(search.results);
    } else {
      this.viewMode.set('explorer');
      this.currentSearchResults.set([]);
    }
  }

  // --- Navigation ---
  goUp(): void {
    if (this.canGoUp()) {
      this.pathChanged.emit(this.path().slice(0, -1));
    }
  }

  navigateToPath(index: number): void {
    const newPath = this.path().slice(0, index + 1);
    this.pathChanged.emit(newPath);
  }

  openItem(item: FileSystemNode): void {
    if (item.type === 'folder') {
      this.pathChanged.emit([...this.path(), item.name]);
    } else {
      // Preview file content
      this.previewItem.set(item);
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
  }
  
  // --- Selection Logic ---
  onItemClick(event: MouseEvent, item: FileSystemNode): void {
    event.stopPropagation();
    this.closeContextMenu();
    this.closeDestinationSubMenu();
    
    const isCtrlOrMeta = event.metaKey || event.ctrlKey;
    const isShift = event.shiftKey;
    const itemName = item.name;

    if (isShift && this.lastSelectedItemName()) {
      this.handleShiftSelection(itemName);
    } else if (isCtrlOrMeta) {
      this.handleCtrlMetaSelection(itemName);
    } else {
      this.handleSingleSelection(itemName);
    }

    this.updateSingleSelectedItem();
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

  // --- Context Menu ---
  onContextMenu(event: MouseEvent, item: FileSystemNode | null = null): void {
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

  // --- File Operations ---
  async createFolder(): Promise<void> {
    const name = prompt('Enter folder name:', 'New folder');
    if (name) {
      try {
        await this.fileSystemProvider().createDirectory(this.path(), name);
        this.loadContents(this.path());
      } catch (e) {
        alert(`Error creating folder: ${(e as Error).message}`);
      }
    }
  }

  async createFile(): Promise<void> {
    const name = prompt('Enter file name:', 'New file.txt');
    if (name) {
      try {
        await this.fileSystemProvider().createFile(this.path(), name);
        this.loadContents(this.path());
      } catch (e) {
        alert(`Error creating file: ${(e as Error).message}`);
      }
    }
  }

  async onFilesUploaded(files: FileList): Promise<void> {
    this.state.update(s => ({ ...s, status: 'loading' }));
    try {
      await Promise.all(
        Array.from(files).map(file => this.fileSystemProvider().uploadFile(this.path(), file))
      );
    } catch (e) {
      alert(`Error uploading files: ${(e as Error).message}`);
    } finally {
      this.loadContents(this.path());
    }
  }
  
  onCut(): void {
    this.clipboardService.set({
      operation: 'cut',
      sourceProvider: this.fileSystemProvider(),
      sourcePath: this.path(),
      items: this.getSelectedNodes()
    });
  }
  
  onCopy(): void {
    this.clipboardService.set({
      operation: 'copy',
      sourceProvider: this.fileSystemProvider(),
      sourcePath: this.path(),
      items: this.getSelectedNodes()
    });
  }
  
  async onPaste(): Promise<void> {
    const clip = this.clipboardService.get();
    if (!clip || !this.canPaste()) return;

    try {
      const itemRefs = clip.items.map(this.getItemReference);
      if (clip.operation === 'cut') {
        await clip.sourceProvider.move(clip.sourcePath, this.path(), itemRefs);
        this.clipboardService.clear();
      } else { // copy
        await clip.sourceProvider.copy(clip.sourcePath, this.path(), itemRefs);
      }
    } catch (e) {
      alert(`Paste failed: ${(e as Error).message}`);
    } finally {
      this.loadContents(this.path());
    }
  }

  async onRename(): Promise<void> {
    const selectedNodes = this.getSelectedNodes();
    if (selectedNodes.length !== 1) return;

    const oldName = selectedNodes[0].name;
    const newName = prompt('Enter new name:', oldName);
    
    if (newName && newName !== oldName) {
      try {
        await this.fileSystemProvider().rename(this.path(), oldName, newName);
        this.loadContents(this.path());
      } catch (e) {
        alert(`Rename failed: ${(e as Error).message}`);
      }
    }
  }

  async executeCopyToMoveTo(operation: 'copy' | 'move', destPath: string[]): Promise<void> {
    const items = this.getSelectedItemReferences();
    if (items.length === 0) return;
    
    try {
        if (operation === 'copy') {
            await this.fileSystemProvider().copy(this.path(), destPath, items);
        } else { // move
            await this.fileSystemProvider().move(this.path(), destPath, items);
        }
    } catch (e) {
        alert(`${operation} failed: ${(e as Error).message}`);
    } finally {
        this.loadContents(this.path());
        this.closeDestinationSubMenu();
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

  async onDelete(): Promise<void> {
    const selectedNodes = this.getSelectedNodes();
    if (selectedNodes.length === 0) return;

    if (confirm(`Are you sure you want to delete ${selectedNodes.length} item(s)?`)) {
      try {
        await Promise.all(selectedNodes.map(node => {
          if (node.type === 'folder') {
            return this.fileSystemProvider().removeDirectory(this.path(), node.name);
          } else {
            return this.fileSystemProvider().deleteFile(this.path(), node.name);
          }
        }));
      } catch (e) {
        alert(`Delete failed: ${(e as Error).message}`);
      } finally {
        this.loadContents(this.path());
      }
    }
  }
  
  handleRenameFromContextMenu(): void {
    this.onRename();
    this.closeContextMenu();
  }

  handleDeleteFromContextMenu(): void {
    this.onDelete();
    this.closeContextMenu();
  }
  
  handlePropertiesFromContextMenu(): void {
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
  onSortChange(criteria: SortCriteria): void {
    this.sortCriteria.set(criteria);
  }

  getIconUrl(item: FileSystemNode): string | null {
    return this.imageService().getIconUrl(item);
  }
  
  onImageLoad(name: string): void {
    this.loadedImageItems.update(set => new Set(set).add(name));
  }

  onImageError(name: string): void {
    this.failedImageItems.update(set => new Set(set).add(name));
  }

  onSearchClick(): void {
    this.searchInitiated.emit();
  }

  onCloseSearchClick(): void {
    this.viewMode.set('explorer');
    this.searchCompleted.emit();
  }
  
  onQuickSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.quickSearchQuery.set(query);
  }

  onQuickSearchSubmit(): void {
    this.quickSearch.emit(this.quickSearchQuery());
  }

  // --- Drag & Drop ---
  onMainAreaDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
    }
    this.isDragOverMainArea.set(true);
  }

  onMainAreaDragLeave(event: DragEvent): void {
    // Check if the relatedTarget is outside the main content area
    if (!this.mainContentEl.nativeElement.contains(event.relatedTarget as Node)) {
        this.isDragOverMainArea.set(false);
    }
  }

  onMainAreaDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOverMainArea.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
        this.onFilesUploaded(files);
    }
  }

  onFolderDrop(event: { files: FileList, item: FileSystemNode }): void {
    // This is a mock implementation. A real one would require path manipulation.
    console.log(`Dropped ${event.files.length} files onto ${event.item.name}`);
    alert(`Dropped ${event.files.length} files onto ${event.item.name}. Uploading to specific folders is not implemented yet.`);
  }

  // --- Lasso Selection ---
  onMainAreaMouseDown(event: MouseEvent): void {
    // Only start lasso if it's a primary button click on the background
    if (event.button !== 0 || (event.target as HTMLElement).closest('[data-is-selectable-item]')) {
      return;
    }
    event.preventDefault();
    this.closeContextMenu();
    this.closeDestinationSubMenu();
    this.startLassoing(event);
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
    }

    this.lassoRect.set({ ...this.lassoStartPoint, width: 0, height: 0 });

    this.unlistenMouseMove = this.renderer.listen('document', 'mousemove', this.onLassoMove.bind(this));
    this.unlistenMouseUp = this.renderer.listen('document', 'mouseup', this.stopLassoing.bind(this));
  }
  
  private onLassoMove(event: MouseEvent): void {
    if (!this.isLassoing() || !this.mainContentRect) return;

    const currentX = event.clientX - this.mainContentRect.left;
    const currentY = event.clientY - this.mainContentRect.top;

    const x = Math.min(this.lassoStartPoint.x, currentX);
    const y = Math.min(this.lassoStartPoint.y, currentY);
    const width = Math.abs(currentX - this.lassoStartPoint.x);
    const height = Math.abs(currentY - this.lassoStartPoint.y);

    const newRect = { x, y, width, height };
    this.lassoRect.set(newRect);

    this.updateSelectionFromLasso(newRect);
  }
  
  private updateSelectionFromLasso(lasso: { x: number; y: number; width: number; height: number }): void {
    const lassoWithScroll = {
        ...lasso,
        x: lasso.x + this.mainContentEl.nativeElement.scrollLeft,
        y: lasso.y + this.mainContentEl.nativeElement.scrollTop
    };
    const newSelection = new Set(this.initialSelectionOnLasso);
    
    this.selectableItemElements.forEach(elRef => {
        const itemEl = elRef.nativeElement;
        const itemName = this.getItemNameFromElement(itemEl);
        if (!itemName) return;
        
        const itemRect = {
            left: itemEl.offsetLeft,
            top: itemEl.offsetTop,
            right: itemEl.offsetLeft + itemEl.offsetWidth,
            bottom: itemEl.offsetTop + itemEl.offsetHeight
        };
        
        const isIntersecting = 
            itemRect.left < lassoWithScroll.x + lassoWithScroll.width &&
            itemRect.right > lassoWithScroll.x &&
            itemRect.top < lassoWithScroll.y + lassoWithScroll.height &&
            itemRect.bottom > lassoWithScroll.y;

        if (isIntersecting) {
            newSelection.add(itemName);
        } else {
            // Only remove if it wasn't part of the initial selection on ctrl/meta drag
            if (!this.initialSelectionOnLasso.has(itemName)) {
                newSelection.delete(itemName);
            }
        }
    });

    this.selectedItems.set(newSelection);
  }

  private getItemNameFromElement(element: HTMLElement): string | null {
      // Logic to find the item name from the DOM element.
      // This is brittle. A better way would be a data attribute.
      const span = element.querySelector('span');
      return span ? span.textContent : null;
  }

  private stopLassoing(): void {
    if (!this.isLassoing()) return;
    
    this.isLassoing.set(false);
    this.lassoRect.set(null);
    this.updateSingleSelectedItem();

    if (this.unlistenMouseMove) {
      this.unlistenMouseMove();
      this.unlistenMouseMove = null;
    }
    if (this.unlistenMouseUp) {
      this.unlistenMouseUp();
      this.unlistenMouseUp = null;
    }

    // Re-enable text selection
    this.renderer.removeStyle(document.body, 'user-select');
  }
}
