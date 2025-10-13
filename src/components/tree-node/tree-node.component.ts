import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model.js';

@Component({
  selector: 'app-tree-node',
  template: `
<div 
  (click)="selectNode()"
  class="flex items-center text-sm py-1 px-2 rounded-md cursor-pointer"
  [class.bg-[rgb(var(--color-accent-bg-selected))]]="isSelected()"
  [class.hover:bg-[rgb(var(--color-surface-hover))]]="!isSelected()"
  [style.padding-left.px]="level() * 16 + 8">
  
  <button 
    (click)="toggleExpand($event)"
    class="mr-1 w-5 h-5 flex-shrink-0 flex items-center justify-center text-[rgb(var(--color-text-subtle))] hover:bg-[rgb(var(--color-surface-hover-subtle))] rounded"
    [class.invisible]="!hasChildren()">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-150" [class.rotate-90]="isExpanded()" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
    </svg>
  </button>
  
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
  
  <span class="truncate select-none">{{ node().name }}</span>
</div>

@if(isExpanded() && hasChildren()) {
  <div>
    @for(child of node().children; track child.name) {
      <app-tree-node
        [node]="child"
        [path]="getChildPath(child)"
        [currentPath]="currentPath()"
        [level]="level() + 1"
        (pathChange)="onChildPathChange($event)">
      </app-tree-node>
    }
  </div>
}
  `,
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