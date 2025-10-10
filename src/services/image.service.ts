import { inject, Injectable } from '@angular/core';
import { IS_DEBUG_MODE } from './app-config';
import { FileSystemNode } from '../models/file-system.model';
import * as imageClient from '../../lib/image-client';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private isDebugMode = inject(IS_DEBUG_MODE);

  private getFileExtension(filename: string): string | null {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) {
      return null;
    }
    return filename.substring(lastDot + 1);
  }

  getIconUrl(item: FileSystemNode): string | null {
    if (this.isDebugMode) {
      return null; // In debug mode, we'll use the default SVGs in the component.
    }

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
