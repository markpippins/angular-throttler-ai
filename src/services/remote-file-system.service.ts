import { Injectable, inject } from '@angular/core';
import { FileSystemProvider, ItemReference } from './file-system-provider';
import { FileSystemNode } from '../models/file-system.model';
import { FsService } from './fs.service';

@Injectable({
  providedIn: 'root',
})
export class RemoteFileSystemService implements FileSystemProvider {
  private fsService = inject(FsService);
  private alias = 'C:';

  async getContents(path: string[]): Promise<FileSystemNode[]> {
    const response: any = await this.fsService.listFiles(this.alias, path);

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

    // Second, map the raw items to the FileSystemNode model.
    // This adapts the backend data structure (e.g., type: 'DIRECTORY') 
    // to the frontend's expected model (e.g., type: 'folder').
    return rawItems.map((item: any): FileSystemNode => {
      const itemType = (item.type || '').toLowerCase();
      const isFolder = itemType === 'folder' || itemType === 'directory';

      return {
        name: item.name,
        type: isFolder ? 'folder' : 'file',
        modified: item.modified, // Pass along if it exists
        content: item.content,   // Pass along if it exists
      };
    });
  }

  getFolderTree(): Promise<FileSystemNode> {
    // In a real implementation, this would call a new backend endpoint
    // that returns the entire folder hierarchy.
    console.warn('getFolderTree not implemented in live mode.');
    // For now, return a minimal tree to prevent errors.
    return Promise.resolve({ name: this.alias, type: 'folder', children: [] });
  }

  createDirectory(path: string[], name: string): Promise<void> {
    return this.fsService.createDirectory(this.alias, [...path, name]);
  }

  removeDirectory(path: string[], name: string): Promise<void> {
    return this.fsService.removeDirectory(this.alias, [...path, name]);
  }

  createFile(path: string[], name: string): Promise<void> {
    return this.fsService.createFile(this.alias, path, name);
  }

  deleteFile(path: string[], name: string): Promise<void> {
    return this.fsService.deleteFile(this.alias, path, name);
  }

  rename(path: string[], oldName: string, newName: string): Promise<void> {
    return this.fsService.rename(this.alias, [...path, oldName], newName);
  }

  uploadFile(path: string[], file: File): Promise<void> {
    // This would be implemented to upload to a remote server
    console.warn(`File upload not implemented in live mode. File: ${file.name}, Path: ${path.join('/')}`);
    return Promise.resolve();
  }

  move(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    console.warn('Move not implemented in live mode.');
    // In a real implementation, you might call a backend service like this:
    // return this.fsService.move(this.alias, sourcePath, destPath, items);
    return Promise.resolve();
  }

  copy(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    console.warn('Copy not implemented in live mode.');
    // In a real implementation, you might call a backend service like this:
    // return this.fsService.copy(this.alias, sourcePath, destPath, items);
    return Promise.resolve();
  }
}