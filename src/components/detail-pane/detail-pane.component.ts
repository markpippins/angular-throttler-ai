import { Component, ChangeDetectionStrategy, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-detail-pane',
  templateUrl: './detail-pane.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPaneComponent {
  item = input<FileSystemNode | null>(null);
  close = output<void>();

  private imageService = inject(ImageService);

  getIconUrl(item: FileSystemNode): string | null {
    return this.imageService.getIconUrl(item);
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
