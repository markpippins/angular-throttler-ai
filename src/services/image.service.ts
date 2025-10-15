import { Injectable, inject } from '@angular/core';
import { FileSystemNode } from '../models/file-system.model.js';
import { ImageClientService } from './image-client.service.js';
import { ServerProfile } from '../models/server-profile.model.js';

export class ImageService {
  private imageClientService: ImageClientService;
  private profile: ServerProfile;
  private UI_NAMES = ['Home', 'Users', 'Desktop', 'Documents'];

  constructor(profile: ServerProfile, imageClientService: ImageClientService) {
    this.profile = profile;
    this.imageClientService = imageClientService;
  }

  private getFileExtension(filename: string): string | null {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) {
      return null;
    }
    return filename.substring(lastDot + 1).toLowerCase();
  }

  getIconUrl(item: FileSystemNode): string | null {
    const imageUrl = this.profile.imageUrl;
    if (!imageUrl) return null;

    // Per user request, only request custom icons for "magnetized" folders.
    if (item.type === 'folder' && item.name.endsWith('.magnet')) {
      const folderNameWithoutMagnet = item.name.slice(0, -7); // '.magnet' is 7 chars long
      return this.imageClientService.getImageUrlByName(imageUrl, folderNameWithoutMagnet, 'folder');
    }

    // For all other files and folders, do not request a custom icon.
    // The UI will use its built-in fallback SVG icons.
    return null;
  }
}
