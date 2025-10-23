import { Component, ChangeDetectionStrategy, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model.js';
import { ImageService } from '../../services/image.service.js';

@Component({
  selector: 'app-properties-dialog',
  templateUrl: './properties-dialog.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesDialogComponent {
  item = input.required<FileSystemNode>();
  imageService = input.required<ImageService>();
  close = output<void>();

  displayName = computed(() => {
    const name = this.item().name;
    if (name.endsWith('.magnet')) {
      return name.slice(0, -7);
    }
    return name;
  });

  getIconUrl(item: FileSystemNode): string | null {
    return this.imageService().getIconUrl(item);
  }
}
