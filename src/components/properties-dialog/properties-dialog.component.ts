import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model.js';
import { ImageService } from '../../services/image.service.js';

@Component({
  selector: 'app-properties-dialog',
  template: `
<div class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" (click)="close.emit()">
  <div class="bg-[rgb(var(--color-surface-dialog))] rounded-lg shadow-xl w-full max-w-md flex flex-col" (click)="$event.stopPropagation()">
    
    <!-- Header -->
    <div class="p-4 border-b border-[rgb(var(--color-border-base))] flex items-center space-x-3">
      @if (getIconUrl(item()); as iconUrl) {
        <img [src]="iconUrl" [alt]="item().type" class="h-8 w-8 object-contain">
      }
      <h3 class="text-lg font-semibold text-[rgb(var(--color-text-base))] truncate">{{ item().name }} Properties</h3>
    </div>
    
    <!-- Body -->
    <div class="p-6 space-y-4 text-sm">
        <div class="flex">
            <span class="w-1/3 text-[rgb(var(--color-text-subtle))]">Type:</span>
            <span class="w-2/3 text-[rgb(var(--color-text-base))] capitalize">{{ item().type === 'folder' ? 'File folder' : 'File' }}</span>
        </div>
        <div class="flex">
            <span class="w-1/3 text-[rgb(var(--color-text-subtle))]">Name:</span>
            <span class="w-2/3 text-[rgb(var(--color-text-base))] break-all">{{ item().name }}</span>
        </div>
         <div class="flex">
            <span class="w-1/3 text-[rgb(var(--color-text-subtle))]">Location:</span>
            <span class="w-2/3 text-[rgb(var(--color-text-base))]">N/A (mocked)</span>
        </div>
        <div class="flex">
            <span class="w-1/3 text-[rgb(var(--color-text-subtle))]">Size:</span>
            <span class="w-2/3 text-[rgb(var(--color-text-base))]">N/A (mocked)</span>
        </div>
        <div class="my-2 h-px bg-[rgb(var(--color-border-base))]"></div>
        <div class="flex">
            <span class="w-1/3 text-[rgb(var(--color-text-subtle))]">Modified:</span>
            <span class="w-2/3 text-[rgb(var(--color-text-base))]">{{ item().modified || 'Unknown' }}</span>
        </div>

    </div>

    <!-- Footer -->
    <div class="px-4 py-3 bg-[rgb(var(--color-surface-muted))] flex justify-end rounded-b-lg">
      <button (click)="close.emit()" class="px-4 py-2 bg-[rgb(var(--color-accent-solid-bg))] text-[rgb(var(--color-text-inverted))] rounded-md hover:bg-[rgb(var(--color-accent-solid-bg-hover))] transition-colors font-semibold text-sm">
        Close
      </button>
    </div>

  </div>
</div>
  `,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesDialogComponent {
  item = input.required<FileSystemNode>();
  imageService = input.required<ImageService>();
  close = output<void>();

  getIconUrl(item: FileSystemNode): string | null {
    return this.imageService().getIconUrl(item);
  }
}