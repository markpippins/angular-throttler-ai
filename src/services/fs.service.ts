import { Injectable, inject } from '@angular/core';
import { BrokerService } from './broker.service';
import { FileSystemNode } from '../models/file-system.model';

const SERVICE_NAME = 'restFsService';

@Injectable({
  providedIn: 'root'
})
export class FsService {
  private brokerService = inject(BrokerService);

  listFiles(alias: string, path: string[]): Promise<FileSystemNode[]> {
    return this.brokerService.submitRequest<FileSystemNode[]>(SERVICE_NAME, 'listFiles', { alias, path });
  }

  changeDirectory(alias: string, path: string[]): Promise<any> {
    return this.brokerService.submitRequest(SERVICE_NAME, 'changeDirectory', { alias, path });
  }

  createDirectory(alias: string, path: string[]): Promise<any> {
    return this.brokerService.submitRequest(SERVICE_NAME, 'createDirectory', { alias, path });
  }

  removeDirectory(alias: string, path: string[]): Promise<any> {
    return this.brokerService.submitRequest(SERVICE_NAME, 'removeDirectory', { alias, path });
  }

  createFile(alias: string, path: string[], filename: string): Promise<any> {
    return this.brokerService.submitRequest(SERVICE_NAME, 'createFile', { alias, path, filename });
  }

  deleteFile(alias: string, path: string[], filename: string): Promise<any> {
    return this.brokerService.submitRequest(SERVICE_NAME, 'deleteFile', { alias, path, filename });
  }

  rename(alias: string, path: string[], newName: string): Promise<any> {
    return this.brokerService.submitRequest(SERVICE_NAME, 'rename', { alias, path, newName });
  }
}