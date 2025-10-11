import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model';

@Component({
  selector: 'app-tree-node',
  templateUrl: './tree-node.component.html',
  imports: [CommonModule, TreeNodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeNodeComponent {
  node = input.required<FileSystemNode>();
  path = input.required<string[]>();
  currentPath = input.required<string[]>();
  level = input(0);

  pathChange = output<string[]>();

  isExpanded = signal(false);
  
  isSelected = computed(() => {
    const p1 = this.path().join('/');
    const p2 = this.currentPath().join('/');
    return p1 === p2;
  });

  hasChildren = computed(() => {
    return this.node().children && this.node().children!.length > 0;
  });

  constructor() {
    // Expand the root node by default.
    if (this.level() === 0) {
      this.isExpanded.set(true);
    }

    effect(() => {
      const currentStr = this.currentPath().join('/');
      const myPathStr = this.path().join('/');
      
      // Auto-expand if the current path is a descendant of this node,
      // but not the node itself.
      if (currentStr.startsWith(myPathStr) && currentStr !== myPathStr) {
        this.isExpanded.set(true);
      }
    });
  }

  toggleExpand(event: MouseEvent): void {
    event.stopPropagation();
    if (this.hasChildren()) {
      this.isExpanded.update(v => !v);
    }
  }

  selectNode(): void {
    // If the clicked node is the root node (path: []) and it's already selected
    // (meaning the explorer is already at the root), just toggle its expansion.
    if (this.path().length === 0 && this.isSelected()) {
      if (this.hasChildren()) {
        this.isExpanded.update(v => !v);
      }
      return;
    }
    // Otherwise, emit a navigation event for this path.
    // This allows clicking the root node to navigate home if you're in a sub-folder.
    this.pathChange.emit(this.path());
  }

  onChildPathChange(path: string[]): void {
    this.pathChange.emit(path);
  }

  getChildPath(childNode: FileSystemNode): string[] {
    return [...this.path(), childNode.name];
  }
}