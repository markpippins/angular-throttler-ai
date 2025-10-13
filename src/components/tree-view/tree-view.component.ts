import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model.js';
import { TreeNodeComponent } from '../tree-node/tree-node.component.js';

@Component({
  selector: 'app-tree-view',
  template: `
<div class="p-2 h-full overflow-y-auto">
  @if (rootNode(); as root) {
    <app-tree-node
      [node]="root"
      [path]="[]"
      [currentPath]="currentPath()"
      (pathChange)="onPathChange($event)">
    </app-tree-node>
  }
</div>
  `,
  imports: [CommonModule, TreeNodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeViewComponent {
  rootNode = input.required<FileSystemNode>();
  currentPath = input.required<string[]>();
  pathChange = output<string[]>();

  onPathChange(path: string[]): void {
    this.pathChange.emit(path);
  }
}