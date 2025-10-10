import { Injectable, inject } from '@angular/core';
import { ServerProfileService } from './server-profile.service';

@Injectable({
  providedIn: 'root'
})
export class ImageClientService {
  private profileService = inject(ServerProfileService);
   
  getImageUrlByExtension(extension: string): string {
    return `${this.profileService.activeConfig().imageUrl}/ext/${encodeURIComponent(extension)}`;
  }

  getImageUrlByName(name: string): string {
    return `${this.profileService.activeConfig().imageUrl}/name/${encodeURIComponent(name)}`;
  }

  getImageUrlByPath(folder: string, file: string): string {
    return `${this.profileService.activeConfig().imageUrl}/path/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
  }
}