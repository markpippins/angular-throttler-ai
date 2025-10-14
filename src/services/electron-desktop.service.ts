import { Injectable } from '@angular/core';
import { DesktopApi } from './desktop.service';
import { FileSystemNode, SearchResultNode } from '../models/file-system.model';
import { ItemReference } from './file-system-provider';

// Expose the API on the window object via preload.js
declare global {
  interface Window {
    // FIX: Made desktopApi optional to align with other global declarations and resolve conflict.
    desktopApi?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class ElectronDesktopService implements DesktopApi {
  private invoke<T>(channel: string, ...args: any[]): Promise<T> {
    if (!window.desktopApi || !window.desktopApi.invoke) {
      // This should not happen in an Electron environment with a proper preload script.
      return Promise.reject(new Error('Desktop API is not available.'));
    }
    return window.desktopApi.invoke(channel, ...args);
  }

  getContents(path: string[]): Promise<FileSystemNode[]> {
    return this.invoke('fs:get-contents', path);
  }

  getFileContent(path: string[], name: string): Promise<string> {
    return this.invoke('fs:get-file-content', path, name);
  }

  getFolderTree(): Promise<FileSystemNode> {
    return this.invoke('fs:get-folder-tree');
  }

  createDirectory(path: string[], name: string): Promise<void> {
    return this.invoke('fs:create-directory', path, name);
  }

  removeDirectory(path: string[], name: string): Promise<void> {
    return this.invoke('fs:remove-directory', path, name);
  }

  createFile(path: string[], name: string): Promise<void> {
    return this.invoke('fs:create-file', path, name);
  }

  deleteFile(path: string[], name: string): Promise<void> {
    return this.invoke('fs:delete-file', path, name);
  }

  rename(path: string[], oldName: string, newName: string): Promise<void> {
    return this.invoke('fs:rename', path, oldName, newName);
  }

  uploadFile(destPath: string[], file: { name: string, path: string }): Promise<void> {
    return this.invoke('fs:upload-file', destPath, file);
  }

  move(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    return this.invoke('fs:move', sourcePath, destPath, items);
  }

  copy(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    return this.invoke('fs:copy', sourcePath, destPath, items);
  }
  
  search(query: string): Promise<SearchResultNode[]> {
    return this.invoke('fs:search', query);
  }
}
