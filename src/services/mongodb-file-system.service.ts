// FIX: Stub out the service to resolve parsing errors and provide a valid implementation of FileSystemProvider.
// This service is not fully implemented and all methods will reject with an error.
import { Injectable } from '@angular/core';
import { FileSystemProvider, ItemReference } from './file-system-provider.js';
import { FileSystemNode, SearchResultNode } from '../models/file-system.model.js';

@Injectable({
  providedIn: 'root',
})
export class MongoDbFileSystemService implements FileSystemProvider {
  
  private notImplemented(): Promise<any> {
    return Promise.reject(new Error('This operation is not implemented for MongoDB file system.'));
  }

  getContents(path: string[]): Promise<FileSystemNode[]> {
    return this.notImplemented();
  }
  
  getFileContent(path: string[], name: string): Promise<string> {
    return this.notImplemented();
  }
  
  getFolderTree(): Promise<FileSystemNode> {
    return this.notImplemented();
  }
  
  createDirectory(path: string[], name: string): Promise<void> {
    return this.notImplemented();
  }
  
  removeDirectory(path: string[], name: string): Promise<void> {
    return this.notImplemented();
  }
  
  createFile(path: string[], name: string): Promise<void> {
    return this.notImplemented();
  }
  
  deleteFile(path: string[], name: string): Promise<void> {
    return this.notImplemented();
  }
  
  rename(path: string[], oldName: string, newName: string): Promise<void> {
    return this.notImplemented();
  }
  
  uploadFile(path: string[], file: File): Promise<void> {
    return this.notImplemented();
  }
  
  move(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    return this.notImplemented();
  }
  
  copy(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    return this.notImplemented();
  }
  
  search(query: string): Promise<SearchResultNode[]> {
    return this.notImplemented();
  }
}
