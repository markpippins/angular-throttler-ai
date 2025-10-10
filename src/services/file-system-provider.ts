import { InjectionToken } from '@angular/core';
import { FileSystemNode } from '../models/file-system.model';

export abstract class FileSystemProvider {
  abstract getContents(path: string[]): Promise<FileSystemNode[]>;
  abstract createDirectory(path: string[], name: string): Promise<void>;
  abstract removeDirectory(path: string[], name: string): Promise<void>;
  abstract createFile(path: string[], name: string): Promise<void>;
  abstract deleteFile(path: string[], name: string): Promise<void>;
  abstract rename(path: string[], oldName: string, newName: string): Promise<void>;
}

export const FILE_SYSTEM_PROVIDER = new InjectionToken<FileSystemProvider>('FileSystemProvider');
