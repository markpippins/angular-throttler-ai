import { Component, ChangeDetectionStrategy, input, output, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model.js';
import { ImageService } from '../../services/image.service.js';
import { FileSystemProvider } from '../../services/file-system-provider.js';

@Component({
  selector: 'app-detail-pane',
  templateUrl: './detail-pane.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPaneComponent {
  item = input<FileSystemNode | null>(null);
  imageService = input.required<ImageService>();
  fileSystemProvider = input.required<FileSystemProvider>();
  providerPath = input.required<string[]>();
  close = output<void>();

  // This signal holds the item, potentially enriched with lazily-loaded content
  itemWithContent = signal<FileSystemNode | null>(null);
  isPreviewLoading = signal(false);

  constructor() {
    effect(() => {
      const currentItem = this.item();
      // Immediately set the item, so non-image data appears instantly.
      // The content will be filled in asynchronously if needed.
      this.itemWithContent.set(currentItem); 

      if (this.isImageFile() && currentItem && !currentItem.content) {
        this.loadPreviewContent(currentItem);
      }
    });
  }
  
  private async loadPreviewContent(item: FileSystemNode): Promise<void> {
    this.isPreviewLoading.set(true);
    try {
      const content = await this.fileSystemProvider().getFileContent(this.providerPath(), item.name);
      this.itemWithContent.update(currentItem => currentItem ? { ...currentItem, content } : null);
    } catch (e) {
      console.error('Failed to load preview content', e);
      // If loading fails, content will remain undefined, and the template will show a message.
      this.itemWithContent.update(currentItem => currentItem ? { ...currentItem, content: undefined } : null);
    } finally {
      this.isPreviewLoading.set(false);
    }
  }

  getIconUrl(item: FileSystemNode): string | null {
    return this.imageService().getIconUrl(item);
  }
  
  private getFileExtension(filename: string): string | null {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) {
      return null;
    }
    return filename.substring(lastDot + 1);
  }

  isImageFile = computed(() => {
    const currentItem = this.item();
    if (!currentItem || currentItem.type !== 'file') return false;
    const extension = this.getFileExtension(currentItem.name);
    if (!extension) return false;
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension.toLowerCase());
  });
}
