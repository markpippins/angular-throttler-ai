import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model.js';
import { ImageService } from '../../services/image.service.js';
import { DragDropService, DragDropPayload } from '../../services/drag-drop.service.js';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-tree-node',
  templateUrl: './tree-node.component.html',
  imports: [CommonModule, TreeNodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeNodeComponent implements OnInit {
  private dragDropService = inject(DragDropService);

  node = input.required<FileSystemNode>();
  path = input.required<string[]>();
  currentPath = input.required<string[]>();
  level = input(0);
  expansionCommand = input<{ command: 'expand' | 'collapse', id: number } | null>();
  imageService = input<ImageService | null>(null);

  pathChange = output<string[]>();
  loadChildren = output<string[]>();
  itemsDropped = output<{ destPath: string[]; payload: DragDropPayload }>();
  bookmarkDropped = output<{ bookmark: NewBookmark, destPath: string[] }>();

  isExpanded = signal(false);
  imageHasError = signal(false);
  imageIsLoaded = signal(false);
  isDragOver = signal(false);
  
  iconUrl = computed(() => {
    const service = this.imageService();
    if (!service) return null;
    return service.getIconUrl(this.node());
  });

  isSelected = computed(() => {
    const p1 = this.path().join('/');
    const p2 = this.currentPath().join('/');
    return p1 === p2;
  });

  isExpandable = computed(() => {
    return this.node().type === 'folder';
  });

  displayName = computed(() => {
    const name = this.node().name;
    if (name.endsWith('.magnet')) {
      return name.slice(0, -7);
    }
    return name;
  });

  folderChildren = computed(() => {
    const children = this.node().children;
    return children ? children.filter(c => c.type === 'folder') : [];
  });

  constructor() {
    // Effect for auto-expanding. It does NOT emit or load children.
    effect(() => {
      const currentStr = this.currentPath().join('/');
      const myPathStr = this.path().join('/');
      if (currentStr.startsWith(myPathStr) && currentStr !== myPathStr) {
        this.expandProgrammatically();
      }
    });

    // Effect for handling commands. It does NOT emit or load children.
    effect(() => {
      const command = this.expansionCommand();
      if (!command) return;

      if (command.command === 'expand') {
        this.expandProgrammatically();
      } else if (command.command === 'collapse') {
        if (this.level() > 0) {
          this.collapse();
        }
      }
    });

    effect(() => {
      // When the iconUrl changes, we need to reset the loading indicators.
      this.iconUrl(); // Establish dependency on the computed signal
      this.imageIsLoaded.set(false);
      this.imageHasError.set(false);
    });
  }

  ngOnInit(): void {
    // Expand the root node by default after initialization.
    if (this.level() === 0) {
      this.isExpanded.set(true);
    }
  }

  // This method only changes local state. SAFE to be called from effects.
  private expandProgrammatically(): void {
    if (this.isExpandable() && !this.isExpanded()) {
      this.isExpanded.set(true);
    }
  }

  private collapse(): void {
    if (this.isExpandable() && this.isExpanded()) {
      this.isExpanded.set(false);
    }
  }

  // This method has a side-effect (emit) but is only called by a user action. SAFE.
  toggleExpand(event: MouseEvent): void {
    event.stopPropagation();
    const willBeExpanded = !this.isExpanded();
    
    if (willBeExpanded && !this.node().childrenLoaded) {
      this.loadChildren.emit(this.path());
    }
    
    this.isExpanded.set(willBeExpanded);
  }

  selectNode(): void {
    if (this.isSelected()) {
      // If already selected, a click should toggle expansion and load children if needed.
      const willBeExpanded = !this.isExpanded();
      if (willBeExpanded && !this.node().childrenLoaded) {
          this.loadChildren.emit(this.path());
      }
      this.isExpanded.set(willBeExpanded);
    } else {
      // If not selected, just navigate. The auto-expand effect will handle opening the node.
      this.pathChange.emit(this.path());
    }
  }

  onChildPathChange(path: string[]): void {
    this.pathChange.emit(path);
  }

  onLoadChildren(path: string[]): void {
    this.loadChildren.emit(path);
  }

  onImageLoad(): void {
    this.imageIsLoaded.set(true);
  }
  
  onImageError(): void {
    this.imageHasError.set(true);
  }

  getChildPath(childNode: FileSystemNode): string[] {
    return [...this.path(), childNode.name];
  }

  // --- Drag and Drop Handlers ---
  private isDropValid(payload: DragDropPayload): boolean {
    if (this.node().type !== 'folder') {
      return false; // Can only drop on folders.
    }

    if (payload.type === 'bookmark') {
      return true; // Always allow dropping bookmarks.
    }
    
    // Filesystem drop logic
    const { sourcePath, items } = payload.payload;
    const destPath = this.path();

    // Prevent dropping into the same folder.
    if (destPath.join('/') === sourcePath.join('/')) {
      return false;
    }

    // Prevent dropping a folder into itself or one of its descendants.
    const isDroppingOnSelfOrChild = items.some(item => 
      item.type === 'folder' && destPath.join('/').startsWith([...sourcePath, item.name].join('/'))
    );
    if (isDroppingOnSelfOrChild) {
      return false;
    }
    
    return true;
  }
  
  onDragOver(event: DragEvent): void {
    const payload = this.dragDropService.getPayload();
    if (!payload || !this.isDropValid(payload)) {
      return; // Not a valid drop target, do nothing.
    }
    
    event.preventDefault(); // This is crucial to allow a drop.
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = payload.type === 'filesystem' ? 'move' : 'copy';
    }
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    
    const payload = this.dragDropService.getPayload();
    if (!payload || !this.isDropValid(payload)) {
      return;
    }

    if (payload.type === 'filesystem') {
        this.itemsDropped.emit({ destPath: this.path(), payload });
    } else if (payload.type === 'bookmark') {
        this.bookmarkDropped.emit({ bookmark: payload.payload.data, destPath: this.path() });
    }
  }
}