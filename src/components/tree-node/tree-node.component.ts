import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model.js';
import { ImageService } from '../../services/image.service.js';

@Component({
  selector: 'app-tree-node',
  templateUrl: './tree-node.component.html',
  imports: [CommonModule, TreeNodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeNodeComponent implements OnInit {
  node = input.required<FileSystemNode>();
  path = input.required<string[]>();
  currentPath = input.required<string[]>();
  level = input(0);
  expansionCommand = input<{ command: 'expand' | 'collapse', id: number } | null>();
  imageService = input<ImageService | null>(null);

  pathChange = output<string[]>();
  loadChildren = output<string[]>();

  isExpanded = signal(false);
  imageHasError = signal(false);
  imageIsLoaded = signal(false);
  
  isSelected = computed(() => {
    const p1 = this.path().join('/');
    const p2 = this.currentPath().join('/');
    return p1 === p2;
  });

  isExpandable = computed(() => {
    return this.node().type === 'folder';
  });

  folderChildren = computed(() => {
    const children = this.node().children;
    return children ? children.filter(c => c.type === 'folder') : [];
  });

  constructor() {
    // Effect for auto-expanding based on navigation in the main pane
    effect(() => {
      const currentStr = this.currentPath().join('/');
      const myPathStr = this.path().join('/');
      
      // Auto-expand if the current path is a descendant of this node,
      // but not the node itself.
      if (currentStr.startsWith(myPathStr) && currentStr !== myPathStr) {
        if (!this.node().childrenLoaded) {
          this.loadChildren.emit(this.path());
        }
        this.isExpanded.set(true);
      }
    });

    // Effect for handling commands from the sidebar toolbar
    effect(() => {
      const command = this.expansionCommand();
      if (!command) return;

      if (command.command === 'expand') {
          if (this.isExpandable()) {
              if (!this.node().childrenLoaded) {
                this.loadChildren.emit(this.path());
              }
              this.isExpanded.set(true);
          }
      } else if (command.command === 'collapse') {
          // Do not collapse the root "Home" node itself
          if (this.level() > 0) {
              this.isExpanded.set(false);
          }
      }
    });

    effect(() => {
      // Reset image loading state whenever the node changes.
      this.node();
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

  toggleExpand(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.isExpandable()) return;

    const node = this.node();
    const isCurrentlyExpanded = this.isExpanded();

    if (!isCurrentlyExpanded && !node.childrenLoaded) {
      this.loadChildren.emit(this.path());
    }
    
    this.isExpanded.update(v => !v);
  }

  selectNode(): void {
    if (this.isSelected()) {
      if (this.isExpandable()) {
        this.toggleExpand(new MouseEvent('click'));
      }
    } else {
      this.pathChange.emit(this.path());
      if (this.isExpandable() && !this.isExpanded()) {
        if (!this.node().childrenLoaded) {
          this.loadChildren.emit(this.path());
        }
        this.isExpanded.set(true);
      }
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
}
