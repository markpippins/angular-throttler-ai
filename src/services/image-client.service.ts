
import { Injectable, inject } from '@angular/core';
import { ServerProfileService } from './server-profile.service';

@Injectable({
  providedIn: 'root'
})
export class ImageClientService {
  getImageUrlByExtension(imageUrl: string, extension: string): string {
    return `${imageUrl}/ext/${encodeURIComponent(extension)}`;
  }

  getImageUrlByName(imageUrl: string, name: string, type: 'folder' | 'file'): string {
    return `${imageUrl}/name/${encodeURIComponent(name)}?type=${type}`;
  }

  getImageUrlByPath(imageUrl: string, folder: string, file: string): string {
    return `${imageUrl}/path/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
  }
}
