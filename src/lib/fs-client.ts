import { submitRequest } from './broker-client';
import { FileSystemNode } from '../models/file-system.model';

const SERVICE_NAME = 'restFsService';

export function listFiles(alias: string, path: string[]): Promise<FileSystemNode[]> {
    return submitRequest<FileSystemNode[]>(SERVICE_NAME, 'listFiles', { alias, path });
}

export function changeDirectory(alias: string, path: string[]): Promise<any> {
    return submitRequest(SERVICE_NAME, 'changeDirectory', { alias, path });
}

export function createDirectory(alias: string, path: string[]): Promise<any> {
    return submitRequest(SERVICE_NAME, 'createDirectory', { alias, path });
}

export function removeDirectory(alias: string, path: string[]): Promise<any> {
    return submitRequest(SERVICE_NAME, 'removeDirectory', { alias, path });
}

export function createFile(alias: string, path: string[], filename: string): Promise<any> {
    return submitRequest(SERVICE_NAME, 'createFile', { alias, path, filename });
}

export function deleteFile(alias: string, path: string[], filename: string): Promise<any> {
    return submitRequest(SERVICE_NAME, 'deleteFile', { alias, path, filename });
}

export function rename(alias: string, path: string[], newName: string): Promise<any> {
    return submitRequest(SERVICE_NAME, 'rename', { alias, path, newName });
}