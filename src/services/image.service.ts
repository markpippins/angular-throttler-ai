

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
    // Custom icon logic has been removed as per user request.
    return null;
  }
}
