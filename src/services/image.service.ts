import { FileSystemNode } from '../models/file-system.model.js';
import { ImageClientService } from './image-client.service.js';
import { ServerProfile } from '../models/server-profile.model.js';
import { PreferencesService } from './preferences.service.js';

export class ImageService {
  constructor(
    private profile: ServerProfile,
    private imageClientService: ImageClientService,
    private preferencesService: PreferencesService
  ) {}

  getIconUrl(item: FileSystemNode): string | null {
    if (item.type !== 'folder') {
      return null;
    }

    if (!this.profile.imageUrl) {
      return null;
    }

    let folderName = item.name;
    if (folderName.endsWith('.magnet')) {
      folderName = folderName.slice(0, -7);
    }
    
    // Remove any "." characters from the folder name.
    folderName = folderName.replace(/\./g, '');
    
    const folderNameWithDashes = folderName.replace(/ /g, '-');
    const lowerCaseFolderName = folderNameWithDashes.toLowerCase();
    
    return `${this.profile.imageUrl}/${encodeURIComponent(lowerCaseFolderName)}`;
  }
}
