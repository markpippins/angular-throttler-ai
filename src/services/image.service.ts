import { FileSystemNode } from '../models/file-system.model.js';
import { LocalConfigService } from './local-config.service.js';

export class ImageService {
  constructor(
    private localConfigService: LocalConfigService
  ) {}

  getIconUrl(item: FileSystemNode, customImageName?: string | null): string | null {
    if (item.type !== 'folder') {
      return null;
    }

    const baseUrl = this.localConfigService.defaultImageUrl() || null;

    if (!baseUrl) {
      return null;
    }
    
    let folderName: string;

    if (customImageName) {
      folderName = customImageName;
    } else if (item.isMagnet && item.magnetFile) {
      folderName = item.magnetFile.slice(0, -7);
    } else {
      folderName = item.name;
    }
    
    // If the folder name resembles a JavaScript library (e.g., ends with .js),
    // remove all dots to make it interchangeable with the version without dots.
    // For other folder names, dots are preserved.
    if (folderName.toLowerCase().endsWith('.js')) {
      folderName = folderName.replace(/\./g, '');
    }
    
    const folderNameWithDashes = folderName.replace(/ /g, '-');
    const lowerCaseFolderName = folderNameWithDashes.toLowerCase();
    
    return `${baseUrl}/${encodeURIComponent(lowerCaseFolderName)}`;
  }
}
