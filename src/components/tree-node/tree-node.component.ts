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
    if (this.isSelected()) {
      // If the node is already selected, clicking it again ONLY toggles expansion.
      if (this.hasChildren()) {
        this.isExpanded.update(v => !v);
      }
    } else {
      // If the node is not selected, navigate to it AND expand it.
      this.pathChange.emit(this.path());
      if (this.hasChildren() && !this.isExpanded()) {
        this.isExpanded.set(true);
      }
    }
  }

  onChildPathChange(path: string[]): void {
    this.pathChange.emit(path);
  }

  getChildPath(childNode: FileSystemNode): string[] {
    return [...this.path(), childNode.name];
  }
}