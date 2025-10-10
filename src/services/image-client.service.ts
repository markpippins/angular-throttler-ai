import { Injectable, inject } from '@angular/core';
import { AppConfig, APP_CONFIG } from './app-config';

@Injectable({
  providedIn: 'root'
})
export class ImageClientService {
  private config = inject<AppConfig>(APP_CONFIG);
   
  getImageUrlByExtension(extension: string): string {
    return `${this.config.imageUrl}/ext/${encodeURIComponent(extension)}`;
  }

  getImageUrlByName(name: string): string {
    return `${this.config.imageUrl}/name/${encodeURIComponent(name)}`;
  }

  getImageUrlByPath(folder: string, file: string): string {
    return `${this.config.imageUrl}/path/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
  }
}