
import { Injectable, inject } from '@angular/core';
import { FileSystemNode } from '../models/file-system.model.js';
import { ImageClientService } from './image-client.service.js';
import { ServerProfile } from '../models/server-profile.model.js';

export class ImageService {
  private imageClientService: ImageClientService;
  private profile: ServerProfile;

  constructor(profile: ServerProfile, imageClientService: ImageClientService) {
    this.profile = profile;
    this.imageClientService = imageClientService;
  }

  private getFileExtension(filename: string): string | null {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) {
      return null;
    }
    return filename.substring(lastDot + 1);
  }

  getIconUrl(item: FileSystemNode): string | null {
    const imageUrl = this.profile.imageUrl;
    if (!imageUrl) return null;

    if (item.type === 'folder') {
      return this.imageClientService.getImageUrlByName(imageUrl, item.name, 'folder');
    }

    // Handle files
    const extension = this.getFileExtension(item.name);
    if (extension) {
      return this.imageClientService.getImageUrlByExtension(imageUrl, extension);
    }

    // Fallback for files without an extension: use the full name
    return this.imageClientService.getImageUrlByName(imageUrl, item.name, 'file');
  }
}
