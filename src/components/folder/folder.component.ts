import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model';

@Component({
  selector: 'app-folder',
  template: `
<div 
  data-is-selectable-item="true"
  (contextmenu)="onContextMenu($event)"
  (dragover)="onDragOver($event)"
  (dragleave)="onDragLeave($event)"
  (drop)="onDrop($event)"
  class="flex flex-col items-center p-2 rounded-md hover:bg-[rgb(var(--color-accent-bg))] cursor-pointer transition-colors duration-150 group"
  [class.bg-[rgb(var(--color-accent-bg-selected))]]="isSelected() && !isDragOver()"
  [class.bg-[rgb(var(--color-accent-bg-dragover))]]="isDragOver()">
  
  @if(iconUrl() && isImageLoaded()) {
    <img [ngSrc]="iconUrl()!" [alt]="item().type" width="64" height="64" class="h-16 w-16 object-contain pointer-events-none" />
  } @else {
    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-yellow-500 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
    @if(iconUrl() && !hasFailedToLoadImage()) {
      <img [ngSrc]="iconUrl()!" [alt]="item().type" width="1" height="1" class="hidden" (load)="onImageLoad()" (error)="onImageError()" />
    }
  }
  
  <span class="mt-2 text-center text-xs break-all truncate w-full text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-accent-text))] pointer-events-none">{{ item().name }}</span>
</div>
  `,
  imports: [CommonModule, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FolderComponent {
  item = input.required<FileSystemNode>();
  iconUrl = input<string | null>(null);
  hasFailedToLoadImage = input<boolean>(false);
  isImageLoaded = input<boolean>(false);
  isSelected = input<boolean>(false);
  isDragOver = signal(false);

  itemContextMenu = output<{ event: MouseEvent; item: FileSystemNode }>();
  itemDrop = output<{ files: FileList; item: FileSystemNode }>();
  imageError = output<string>();
  imageLoad = output<string>();

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.itemContextMenu.emit({ event, item: this.item() });
  }

  onImageLoad(): void {
    this.imageLoad.emit(this.item().name);
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
