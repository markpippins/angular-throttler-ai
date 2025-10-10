import { Injectable, inject } from '@angular/core';
import { FileSystemNode } from '../models/file-system.model';
import { ImageClientService } from './image-client.service';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private imageClientService = inject(ImageClientService);

  private getFileExtension(filename: string): string | null {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) {
      return null;
    }
    return filename.substring(lastDot + 1);
  }

  getIconUrl(item: FileSystemNode): string | null {
    if (item.type === 'folder') {
      return this.imageClientService.getImageUrlByName('folder');
    }

    // For files, try to get an icon for the specific extension
    const extension = this.getFileExtension(item.name);
    if (extension) {
      return this.imageClientService.getImageUrlByExtension(extension);
    }

    // Fallback for files with no extension
    return this.imageClientService.getImageUrlByName('file');
  }
}