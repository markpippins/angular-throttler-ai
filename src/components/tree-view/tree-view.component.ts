import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model.js';
import { TreeNodeComponent } from '../tree-node/tree-node.component.js';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
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
