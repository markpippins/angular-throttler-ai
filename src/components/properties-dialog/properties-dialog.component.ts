import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model';
import { ImageService } from '../../services/image.service';

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

  getIconUrl(item: FileSystemNode): string | null {
    return this.imageService().getIconUrl(item);
  }
}