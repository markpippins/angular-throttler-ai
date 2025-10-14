import { inject } from '@angular/core';
import { FileSystemProvider, ItemReference } from './file-system-provider.js';
import { FileSystemNode, SearchResultNode } from '../models/file-system.model.js';
import { FsService } from './fs.service.js';
import { ServerProfile } from '../models/server-profile.model.js';

export class RemoteFileSystemService implements FileSystemProvider {
  private fsService: FsService;
  public profile: ServerProfile;

  constructor(profile: ServerProfile, fsService: FsService) {
    this.profile = profile;
    this.fsService = fsService;
  }

  async getContents(path: string[]): Promise<FileSystemNode[]> {
    const response: any = await this.fsService.listFiles(this.profile.brokerUrl, this.profile.name, path);

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

  getFileContent(path: string[], name: string): Promise<string> {
    return this.fsService.getFileContent(this.profile.brokerUrl, this.profile.name, path, name);
  }

  async getFolderTree(): Promise<FileSystemNode> {
    const topLevelItems = await this.getContents([]);
    const children = topLevelItems.map((item): FileSystemNode => {
      if (item.type === 'folder') {
        return {
          ...item,
          children: [],
          childrenLoaded: false, // Mark for lazy loading
        };
      }
      return item;
    });

    return {
      name: this.profile.name,
      type: 'folder',
      children: children,
      childrenLoaded: true, // The root's direct children are now loaded
    };
  }

  createDirectory(path: string[], name: string): Promise<void> {
    return this.fsService.createDirectory(this.profile.brokerUrl, this.profile.name, [...path, name]);
  }

  removeDirectory(path: string[], name: string): Promise<void> {
    return this.fsService.removeDirectory(this.profile.brokerUrl, this.profile.name, [...path, name]);
  }

  createFile(path: string[], name: string): Promise<void> {
    return this.fsService.createFile(this.profile.brokerUrl, this.profile.name, path, name);
  }

  deleteFile(path: string[], name: string): Promise<void> {
    return this.fsService.deleteFile(this.profile.brokerUrl, this.profile.name, path, name);
  }

  rename(path: string[], oldName: string, newName: string): Promise<void> {
    const fromPath = [...path, oldName];
    const toPath = [...path, newName];
    return this.fsService.rename(this.profile.brokerUrl, this.profile.name, fromPath, toPath);
  }

  uploadFile(path: string[], file: File): Promise<void> {
    console.warn(`File upload not implemented in live mode. File: ${file.name}, Path: ${path.join('/')}`);
    return Promise.resolve();
  }

  move(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    return this.fsService.move(this.profile.brokerUrl, this.profile.name, sourcePath, destPath, items);
  }

  async copy(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    const fromAlias = this.profile.name;
    const toAlias = this.profile.name;

    const copyPromises = items.map(item => {
        const fromPath = [...sourcePath, item.name];
        const toPath = [...destPath, item.name];
        return this.fsService.copy(this.profile.brokerUrl, fromAlias, fromPath, toAlias, toPath);
    });
    
    await Promise.all(copyPromises);
  }

  async search(query: string): Promise<SearchResultNode[]> {
    console.warn(`Search not implemented in live mode for query: ${query}`);
    return Promise.resolve([]);
  }
}