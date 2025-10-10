import { Injectable } from '@angular/core';
import { FileSystemNode } from '../models/file-system.model';
import * as imageClient from '../lib/image-client';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private getFileExtension(filename: string): string | null {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) {
      return null;
    }
    return filename.substring(lastDot + 1);
  }

  getIconUrl(item: FileSystemNode): string | null {
    if (item.type === 'folder') {
      return imageClient.getImageUrlByName('folder');
    }

    // For files, try to get an icon for the specific extension
    const extension = this.getFileExtension(item.name);
    if (extension) {
      return imageClient.getImageUrlByExtension(extension);
    }

    // Fallback for files with no extension
    return imageClient.getImageUrlByName('file');
  }
}