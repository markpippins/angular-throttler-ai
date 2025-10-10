import { Injectable } from '@angular/core';
import { FileSystemProvider } from './file-system-provider';
import { FileSystemNode } from '../models/file-system.model';
import * as fsClient from '../lib/fs-client';

@Injectable({
  providedIn: 'root',
})
export class RemoteFileSystemService implements FileSystemProvider {
  private alias = 'Home:';

  async getContents(path: string[]): Promise<FileSystemNode[]> {
    const response: any = await fsClient.listFiles(this.alias, path);

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

  createDirectory(path: string[], name: string): Promise<void> {
    return fsClient.createDirectory(this.alias, [...path, name]);
  }

  removeDirectory(path: string[], name: string): Promise<void> {
    return fsClient.removeDirectory(this.alias, [...path, name]);
  }

  createFile(path: string[], name: string): Promise<void> {
    return fsClient.createFile(this.alias, path, name);
  }

  deleteFile(path: string[], name: string): Promise<void> {
    return fsClient.deleteFile(this.alias, path, name);
  }

  rename(path: string[], oldName: string, newName: string): Promise<void> {
    return fsClient.rename(this.alias, [...path, oldName], newName);
  }
}