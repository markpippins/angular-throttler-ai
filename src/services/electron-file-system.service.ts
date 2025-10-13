import { Injectable, inject } from '@angular/core';
import { FileSystemNode, SearchResultNode } from '../models/file-system.model.js';
import { FileSystemProvider, ItemReference } from './file-system-provider.js';
import { DESKTOP_SERVICE } from './desktop.service.js';

@Injectable({
  providedIn: 'root',
})
export class ElectronFileSystemService implements FileSystemProvider {
  private desktopService = inject(DESKTOP_SERVICE);

  async getContents(path: string[]): Promise<FileSystemNode[]> {
    return this.desktopService.getContents(path);
  }

  async getFolderTree(): Promise<FileSystemNode> {
    return this.desktopService.getFolderTree();
  }

  // FIX: Added missing methods to correctly implement FileSystemProvider.
  async createDirectory(path: string[], name: string): Promise<void> {
    return this.desktopService.createDirectory(path, name);
  }

  async removeDirectory(path: string[], name: string): Promise<void> {
    return this.desktopService.removeDirectory(path, name);
  }

  async createFile(path: string[], name: string): Promise<void> {
    return this.desktopService.createFile(path, name);
  }

  async deleteFile(path: string[], name: string): Promise<void> {
    return this.desktopService.deleteFile(path, name);
  }

  async rename(path: string[], oldName: string, newName: string): Promise<void> {
    return this.desktopService.rename(path, oldName, newName);
  }

  async uploadFile(path: string[], file: File): Promise<void> {
    // The File object from an <input> in Electron has a `path` property.
    const electronFile = file as any;
    if (!electronFile.path) {
      throw new Error('File path is not available for upload in this context.');
    }
    return this.desktopService.uploadFile(path, { name: file.name, path: electronFile.path });
  }

  async move(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    return this.desktopService.move(sourcePath, destPath, items);
  }

  async copy(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    return this.desktopService.copy(sourcePath, destPath, items);
  }

  async search(query: string): Promise<SearchResultNode[]> {
    return this.desktopService.search(query);
  }
}