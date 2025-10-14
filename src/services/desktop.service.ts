import { InjectionToken } from '@angular/core';
import { FileSystemNode, SearchResultNode } from '../models/file-system.model';
import { ItemReference } from './file-system-provider';

export interface DesktopApi {
  getContents(path: string[]): Promise<FileSystemNode[]>;
  getFileContent(path: string[], name: string): Promise<string>;
  getFolderTree(): Promise<FileSystemNode>;
  createDirectory(path: string[], name: string): Promise<void>;
  removeDirectory(path: string[], name: string): Promise<void>;
  createFile(path: string[], name: string): Promise<void>;
  deleteFile(path: string[], name: string): Promise<void>;
  rename(path: string[], oldName: string, newName: string): Promise<void>;
  uploadFile(path: string[], file: { name: string, path: string }): Promise<void>;
  move(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void>;
  copy(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void>;
  search(query: string): Promise<SearchResultNode[]>;
}

export const DESKTOP_SERVICE = new InjectionToken<DesktopApi>('DESKTOP_SERVICE');
