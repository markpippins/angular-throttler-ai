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

  private constructBrokerUrl(baseUrl: string): string {
    let fullUrl = baseUrl.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = `http://${fullUrl}`;
    }
    if (fullUrl.endsWith('/')) {
        fullUrl = fullUrl.slice(0, -1);
    }
    fullUrl += '/api/broker/submitRequest';
    return fullUrl;
  }

  listFiles(brokerUrl: string, alias: string, path: string[]): Promise<FileSystemNode[]> {
    return this.brokerService.submitRequest<FileSystemNode[]>(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'listFiles', { alias, path });
  }

  async getFileContent(brokerUrl: string, alias: string, path: string[], filename: string): Promise<string> {
    const response = await this.brokerService.submitRequest<{ content: string }>(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'readFile', { alias, path, filename });
    return response.content;
  }

  saveFileContent(brokerUrl: string, alias: string, path: string[], filename: string, content: string): Promise<void> {
    return this.brokerService.submitRequest(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'saveFile', { alias, path, filename, content });
  }

  changeDirectory(brokerUrl: string, alias: string, path: string[]): Promise<any> {
    return this.brokerService.submitRequest(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'changeDirectory', { alias, path });
  }

  createDirectory(brokerUrl: string, alias: string, path: string[]): Promise<any> {
    return this.brokerService.submitRequest(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'createDirectory', { alias, path });
  }

  removeDirectory(brokerUrl: string, alias: string, path: string[]): Promise<any> {
    return this.brokerService.submitRequest(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'removeDirectory', { alias, path });
  }

  createFile(brokerUrl: string, alias: string, path: string[], filename: string): Promise<any> {
    return this.brokerService.submitRequest(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'createFile', { alias, path, filename });
  }

  deleteFile(brokerUrl: string, alias: string, path: string[], filename: string): Promise<any> {
    return this.brokerService.submitRequest(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'deleteFile', { alias, path, filename });
  }

  rename(brokerUrl: string, alias: string, fromPath: string[], toPath: string[]): Promise<any> {
    return this.brokerService.submitRequest(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'rename', { alias, fromPath, toPath });
  }

  hasFile(brokerUrl: string, alias: string, path: string[], fileName: string): Promise<boolean> {
    return this.brokerService.submitRequest<boolean>(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'hasFile', { alias, path, fileName });
  }

  hasFolder(brokerUrl: string, alias: string, path: string[], folderName: string): Promise<boolean> {
    return this.brokerService.submitRequest<boolean>(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'hasFolder', { alias, path, folderName });
  }

  move(brokerUrl: string, alias: string, sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    return this.brokerService.submitRequest(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'moveItems', { alias, sourcePath, destPath, items });
  }

  copy(brokerUrl: string, fromAlias: string, fromPath: string[], toAlias: string, toPath: string[]): Promise<void> {
    return this.brokerService.submitRequest(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'copy', { fromAlias, fromPath, toAlias, toPath });
  }

  async getNote(brokerUrl: string, alias: string, path: string[]): Promise<{ content: string }> {
    return this.brokerService.submitRequest<{ content: string }>(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'getNote', { alias, path });
  }

  saveNote(brokerUrl: string, alias: string, path: string[], content: string): Promise<void> {
    return this.brokerService.submitRequest(this.constructBrokerUrl(brokerUrl), SERVICE_NAME, 'saveNote', { alias, path, content });
  }
}
