import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.component.html',
  imports: [CommonModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FolderComponent {
  item = input.required<FileSystemNode>();
  iconUrl = input<string | null>(null);
  hasFailedToLoadImage = input<boolean>(false);

  itemOpen = output<FileSystemNode>();
  itemContextMenu = output<{ event: MouseEvent; item: FileSystemNode }>();
  imageError = output<string>();

  onOpen(): void {
    this.itemOpen.emit(this.item());
  }

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.itemContextMenu.emit({ event, item: this.item() });
  }

  onImageError(): void {
    this.imageError.emit(this.item().name);
  }
}
