import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.component.html',
  imports: [CommonModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-is-selectable-item]': 'true'
  }
})
export class FolderComponent {
  item = input.required<FileSystemNode>();
  iconUrl = input<string | null>(null);
  hasFailedToLoadImage = input<boolean>(false);
  isSelected = input<boolean>(false);
  isDragOver = signal(false);

  itemContextMenu = output<{ event: MouseEvent; item: FileSystemNode }>();
  itemDrop = output<{ files: FileList; item: FileSystemNode }>();
  imageError = output<string>();

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.itemContextMenu.emit({ event, item: this.item() });
  }

  onImageError(): void {
    this.imageError.emit(this.item().name);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.itemDrop.emit({ files, item: this.item() });
    }
  }
}
