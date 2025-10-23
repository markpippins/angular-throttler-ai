import { Injectable, inject } from '@angular/core';
import { BrokerService } from './broker.service.js';
import { FileSystemNode } from '../models/file-system.model.js';
import { ItemReference } from './file-system-provider.js';

const SERVICE_NAME = 'restFsService';

@Injectable({
  providedIn: 'root'
})
export class FsService {
  private brokerService = inject(BrokerService);

  listFiles(brokerUrl: string, alias: string, path: string[]): Promise<FileSystemNode[]> {
    return this.brokerService.submitRequest<FileSystemNode[]>(brokerUrl, SERVICE_NAME, 'listFiles', { alias, path });
  }

  async getFileContent(brokerUrl: string, alias: string, path: string[], filename: string): Promise<string> {
    const response = await this.brokerService.submitRequest<{ content: string }>(brokerUrl, SERVICE_NAME, 'getFileContent', { alias, path, filename });
    return response.content;
  }

  changeDirectory(brokerUrl: string, alias: string, path: string[]): Promise<any> {
    return this.brokerService.submitRequest(brokerUrl, SERVICE_NAME, 'changeDirectory', { alias, path });
  }

  createDirectory(brokerUrl: string, alias: string, path: string[]): Promise<any> {
    return this.brokerService.submitRequest(brokerUrl, SERVICE_NAME, 'createDirectory', { alias, path });
  }

  removeDirectory(brokerUrl: string, alias: string, path: string[]): Promise<any> {
    return this.brokerService.submitRequest(brokerUrl, SERVICE_NAME, 'removeDirectory', { alias, path });
  }

  createFile(brokerUrl: string, alias: string, path: string[], filename: string): Promise<any> {
    return this.brokerService.submitRequest(brokerUrl, SERVICE_NAME, 'createFile', { alias, path, filename });
  }

  deleteFile(brokerUrl: string, alias: string, path: string[], filename: string): Promise<any> {
    return this.brokerService.submitRequest(brokerUrl, SERVICE_NAME, 'deleteFile', { alias, path, filename });
  }

  rename(brokerUrl: string, alias: string, fromPath: string[], toPath: string[]): Promise<any> {
    return this.brokerService.submitRequest(brokerUrl, SERVICE_NAME, 'rename', { alias, fromPath, toPath });
  }

  move(brokerUrl: string, alias: string, sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    return this.brokerService.submitRequest(brokerUrl, SERVICE_NAME, 'move', { alias, sourcePath, destPath, items });
  }

  copy(brokerUrl: string, fromAlias: string, fromPath: string[], toAlias: string, toPath: string[]): Promise<void> {
    return this.brokerService.submitRequest(brokerUrl, SERVICE_NAME, 'copy', { fromAlias, fromPath, toAlias, toPath });
  }
}