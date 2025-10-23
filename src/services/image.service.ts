import { Injectable, inject } from '@angular/core';
import { FileSystemNode } from '../models/file-system.model.js';
import { ImageClientService } from './image-client.service.js';
import { ServerProfile } from '../models/server-profile.model.js';
import { PreferencesService } from './preferences.service.js';

export class ImageService {
  private imageClientService: ImageClientService;
  private profile: ServerProfile;
  private preferencesService: PreferencesService;
  private UI_NAMES = ['Home', 'Users', 'Desktop', 'Documents'];

  constructor(profile: ServerProfile, imageClientService: ImageClientService, preferencesService: PreferencesService) {
    this.profile = profile;
    this.imageClientService = imageClientService;
    this.preferencesService = preferencesService;
  }

  private getFileExtension(filename: string): string | null {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) {
      return null;
    }
    return filename.substring(lastDot + 1).toLowerCase();
  }

  getIconUrl(item: FileSystemNode): string | null {
    const activeTheme = this.preferencesService.iconTheme();

    // Priority 1: Local theme icons for any folder.
    if (activeTheme && item.type === 'folder') {
      // Convert folder name to a suitable filename format (e.g., lowercase).
      const iconName = item.name.toLowerCase();
      return `assets/images/ui/${activeTheme}/${iconName}.svg`;
    }

    // Priority 2: Fallback to existing logic for remote icons (e.g., .magnet folders)
    const imageUrl = this.profile.imageUrl;
    if (!imageUrl) return null;

    if (item.type === 'folder' && item.name.endsWith('.magnet')) {
      const folderNameWithoutMagnet = item.name.slice(0, -7); // '.magnet' is 7 chars long
      return this.imageClientService.getImageUrlByName(imageUrl, folderNameWithoutMagnet, 'folder');
    }

    // Default: no specific icon for files, allowing the component to use its own fallback SVG.
    return null;
  }
}