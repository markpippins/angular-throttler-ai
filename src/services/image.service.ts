
import { FileSystemNode } from '../models/file-system.model.js';
import { ImageClientService } from './image-client.service.js';
import { ServerProfile } from '../models/server-profile.model.js';
import { PreferencesService } from './preferences.service.js';
import { HealthCheckService } from './health-check.service.js';
import { LocalConfigService } from './local-config.service.js';

export class ImageService {
  constructor(
    private profile: ServerProfile,
    private imageClientService: ImageClientService,
    private preferencesService: PreferencesService,
    private healthCheckService: HealthCheckService,
    private localConfigService: LocalConfigService
  ) {}

  getIconUrl(item: FileSystemNode, customImageName?: string | null): string | null {
    if (item.type !== 'folder') {
      return null;
    }

    const baseUrl = this.profile.imageUrl || this.localConfigService.defaultImageUrl();

    if (!baseUrl) {
      return null;
    }
    
    // Check service health before making a request
    const status = this.healthCheckService.getServiceStatus(baseUrl);
    if (status === 'DOWN') {
      // If down, don't attempt to fetch an image to avoid broken image icons.
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
