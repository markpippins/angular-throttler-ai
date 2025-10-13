import { inject } from '@angular/core';
import { FileSystemProvider, ItemReference } from './file-system-provider.js';
import { FileSystemNode, SearchResultNode } from '../models/file-system.model.js';
import { FsService } from './fs.service.js';
import { ServerProfile } from '../models/server-profile.model.js';

export class RemoteFileSystemService implements FileSystemProvider {
  private fsService: FsService;
  public profile: ServerProfile;
  private readonly alias = 'C:';

  constructor(profile: ServerProfile, fsService: FsService) {
    this.profile = profile;
    this.fsService = fsService;
  }

  async getContents(path: string[]): Promise<FileSystemNode[]> {
    const response: any = await this.fsService.listFiles(this.profile.brokerUrl, this.alias, path);

    let rawItems: any[] = [];

    // First, unwrap the array from the response object
    if (Array.isArray(response)) {
      rawItems = response;
    } else if (response && typeof response === 'object') {
      if (Array.isArray(response.files)) {
        rawItems = response.files;
      } else if (Array.isArray(response.items)) {
        rawItems = response.items;
      }
    }

    if (!rawItems.length && response) {
      if (!Array.isArray(response) && !response.files && !response.items) {
        console.error('Unexpected response structure from file system API:', response);
      }
    }

    return rawItems.map((item: any): FileSystemNode => {
      const itemType = (item.type || '').toLowerCase();
      const isFolder = itemType === 'folder' || itemType === 'directory';

      return {
        name: item.name,
        type: isFolder ? 'folder' : 'file',
        modified: item.modified,
        content: item.content,
      };
    });
  }

  getFolderTree(): Promise<FileSystemNode> {
    console.warn('getFolderTree not implemented in live mode. It should be.');
    const rootName = this.profile.name;
    return Promise.resolve({ name: rootName, type: 'folder', children: [] });
  }

  createDirectory(path: string[], name: string): Promise<void> {
    return this.fsService.createDirectory(this.profile.brokerUrl, this.alias, [...path, name]);
  }

  removeDirectory(path: string[], name: string): Promise<void> {
    return this.fsService.removeDirectory(this.profile.brokerUrl, this.alias, [...path, name]);
  }

  createFile(path: string[], name: string): Promise<void> {
    return this.fsService.createFile(this.profile.brokerUrl, this.alias, path, name);
  }

  deleteFile(path: string[], name: string): Promise<void> {
    return this.fsService.deleteFile(this.profile.brokerUrl, this.alias, path, name);
  }

  rename(path: string[], oldName: string, newName: string): Promise<void> {
    return this.fsService.rename(this.profile.brokerUrl, this.alias, [...path, oldName], newName);
  }

  uploadFile(path: string[], file: File): Promise<void> {
    console.warn(`File upload not implemented in live mode. File: ${file.name}, Path: ${path.join('/')}`);
    return this.fsService.copy(this.profile.brokerUrl, this.alias, [], [], []); // No-op for now
  }

  move(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    return this.fsService.move(this.profile.brokerUrl, this.alias, sourcePath, destPath, items);
  }

  copy(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    return this.fsService.copy(this.profile.brokerUrl, this.alias, sourcePath, destPath, items);
  }

  async search(query: string): Promise<SearchResultNode[]> {
    console.warn(`Search not implemented in live mode for query: ${query}`);
    return Promise.resolve([]);
  }
}