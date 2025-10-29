
import { FileSystemNode } from '../models/file-system.model.js';
import { ImageClientService } from './image-client.service.js';
import { ServerProfile } from '../models/server-profile.model.js';
import { PreferencesService } from './preferences.service.js';

export class ImageService {
  constructor(
    profile: ServerProfile,
    imageClientService: ImageClientService,
    preferencesService: PreferencesService
  ) {}

  getIconUrl(item: FileSystemNode): string | null {
    if (item.type !== 'folder') {
      return null; // This rule is only for folders.
    }
    
    // A predefined list of special folders that are expected to have custom icons.
    // This prevents the application from making a network request for an icon for every single folder,
    // which would result in many unnecessary 404 errors for user-created folders.
    const specialIconFolders = [
        'documents', 
        'pictures', 
        'work', 
        'dev', 
        'projects', 
        'users', 
        'devops', 
        'resources', 
        'desktop', 
        'home', 
        'throttler', 
        'atomix'
    ];

    // Determine the base name for the icon lookup by stripping the '.magnet' suffix if it exists.
    let iconBaseName = item.name;
    if (item.name.endsWith('.magnet')) {
      iconBaseName = item.name.slice(0, -7);
    }

    // Convert to lowercase to match the filenames (e.g., 'documents.png').
    const iconName = iconBaseName.toLowerCase();

    // Only proceed if the folder is in our list of special folders.
    if (specialIconFolders.includes(iconName)) {
      // Per user instruction, the PNG files are located in 'src/assets/images/ui/neon'.
      // The build process makes this path available at the root '/assets/images/ui/neon'.
      return `/assets/images/ui/neon/${iconName}.png`;
    }

    // For any other folder, return null. The UI will use the default folder icon.
    return null;
  }
}
