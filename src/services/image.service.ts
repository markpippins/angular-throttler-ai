
import { FileSystemNode } from '../models/file-system.model.js';
import { ImageClientService } from './image-client.service.js';
import { ServerProfile } from '../models/server-profile.model.js';
import { PreferencesService } from './preferences.service.js';

export class ImageService {
  // The constructor signature is maintained for compatibility with existing service instantiations in AppComponent,
  // though its parameters are no longer used by the simplified getIconUrl method.
  constructor(
    profile: ServerProfile,
    imageClientService: ImageClientService,
    preferencesService: PreferencesService
  ) {}

  getIconUrl(item: FileSystemNode): string | null {
    if (item.type !== 'folder') {
      return null; // This rule is only for folders.
    }

    // Determine the base name for the icon lookup by stripping the '.magnet' suffix if it exists.
    let iconBaseName = item.name;
    if (item.name.endsWith('.magnet')) {
      iconBaseName = item.name.slice(0, -7);
    }

    // Convert to lowercase to match the filenames (e.g., 'documents.png') in the assets folder.
    const iconName = iconBaseName.toLowerCase();

    // Construct the path to the potential icon. The browser will attempt to load this.
    // If it fails (404), the (error) handler on the <img> tag will prevent a broken image icon
    // from showing, and the default yellow folder icon (which is the background) will be visible.
    return `assets/images/ui/neon/${iconName}.png`;
  }
}
