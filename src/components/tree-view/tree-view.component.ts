import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model.js';
import { TreeNodeComponent } from '../tree-node/tree-node.component.js';
import { ImageService } from '../../services/image.service.js';
import { DragDropPayload } from '../../services/drag-drop.service.js';
import { NewBookmark } from '../../models/bookmark.model.js';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  imports: [CommonModule, TreeNodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeViewComponent {
  rootNode = input.required<FileSystemNode>();
  currentPath = input.required<string[]>();
  expansionCommand = input<{ command: 'expand' | 'collapse', id: number } | null>();
  imageService = input<ImageService | null>(null);
  
  pathChange = output<string[]>();
  loadChildren = output<string[]>();
  itemsDropped = output<{ destPath: string[]; payload: DragDropPayload }>();
  bookmarkDropped = output<{ bookmark: NewBookmark, destPath: string[] }>();

  onPathChange(path: string[]): void {
    this.pathChange.emit(path);
  }

  onLoadChildren(path: string[]): void {
    this.loadChildren.emit(path);
  }

  onItemsDropped(event: { destPath: string[]; payload: DragDropPayload }): void {
    this.itemsDropped.emit(event);
  }

  onBookmarkDropped(event: { bookmark: NewBookmark, destPath: string[] }): void {
    this.bookmarkDropped.emit(event);
  }
}
