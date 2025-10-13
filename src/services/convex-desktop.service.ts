import { Injectable, inject } from '@angular/core';
import { FileSystemNode, SearchResultNode } from '../models/file-system.model';
import { FileSystemProvider, ItemReference } from './file-system-provider';
import { ConvexService } from './convex.service';
import { Magnet } from '../models/magnet.model';

@Injectable({
  providedIn: 'root',
})
export class ConvexDesktopService implements FileSystemProvider {
  private convexService = inject(ConvexService);
  private virtualTree: FileSystemNode | null = null;

  private async buildAndCacheVirtualTree(): Promise<FileSystemNode> {
    if (this.virtualTree) {
      return this.virtualTree;
    }

    const magnets = await this.convexService.searchMagnets(''); // Get all magnets
    const tagsMap = new Map<string, FileSystemNode[]>();

    for (const magnet of magnets) {
      const tags = magnet.tags.split(',').map(t => t.trim()).filter(Boolean);
      const magnetNode: FileSystemNode = {
        name: `${magnet.displayName}.magnet`,
        type: 'file',
        modified: new Date(magnet._creationTime).toISOString(),
        content: JSON.stringify(magnet, null, 2)
      };

      if (tags.length === 0) {
        tags.push('Uncategorized');
      }

      for (const tag of tags) {
        if (!tagsMap.has(tag)) {
          tagsMap.set(tag, []);
        }
        tagsMap.get(tag)!.push(magnetNode);
      }
    }
    
    const tagFolders: FileSystemNode[] = [];
    for (const [tagName, children] of tagsMap.entries()) {
      tagFolders.push({
        name: tagName,
        type: 'folder',
        children: children,
        modified: new Date().toISOString()
      });
    }
    
    this.virtualTree = {
      name: 'Convex Pins',
      type: 'folder',
      children: tagFolders,
      modified: new Date().toISOString()
    };
    
    return this.virtualTree;
  }

  async getFolderTree(): Promise<FileSystemNode> {
    // Invalidate cache for subsequent loads, in case data changed in Convex.
    this.virtualTree = null; 
    return this.buildAndCacheVirtualTree();
  }

  async getContents(path: string[]): Promise<FileSystemNode[]> {
    const tree = await this.buildAndCacheVirtualTree();
    
    if (path.length === 0) {
      return tree.children ?? [];
    }

    let currentNode = tree;
    for (const segment of path) {
      const nextNode = currentNode.children?.find(c => c.name === segment);
      if (nextNode && nextNode.type === 'folder') {
        currentNode = nextNode;
      } else {
        return []; // Path not found or is a file
      }
    }
    
    return currentNode.children ?? [];
  }

  async search(query: string): Promise<SearchResultNode[]> {
    const magnets = await this.convexService.searchMagnets(query);
    const results: SearchResultNode[] = [];

    for (const magnet of magnets) {
      const tags = magnet.tags.split(',').map(t => t.trim()).filter(Boolean);
      // For simplicity, show the path as the first tag.
      const path = tags.length > 0 ? [tags[0]] : ['Uncategorized'];

      results.push({
        name: `${magnet.displayName}.magnet`,
        type: 'file',
        modified: new Date(magnet._creationTime).toISOString(),
        content: JSON.stringify(magnet, null, 2),
        path: path
      });
    }

    return results;
  }

  // --- Read-only operations ---
  createDirectory(path: string[], name: string): Promise<void> { return Promise.reject(new Error('This operation is not supported in Convex mode.')); }
  removeDirectory(path: string[], name: string): Promise<void> { return Promise.reject(new Error('This operation is not supported in Convex mode.')); }
  createFile(path: string[], name: string): Promise<void> { return Promise.reject(new Error('This operation is not supported in Convex mode.')); }
  deleteFile(path: string[], name: string): Promise<void> { return Promise.reject(new Error('This operation is not supported in Convex mode.')); }
  rename(path: string[], oldName: string, newName: string): Promise<void> { return Promise.reject(new Error('This operation is not supported in Convex mode.')); }
  uploadFile(path: string[], file: File): Promise<void> { return Promise.reject(new Error('This operation is not supported in Convex mode.')); }
  move(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> { return Promise.reject(new Error('This operation is not supported in Convex mode.')); }
  copy(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> { return Promise.reject(new Error('This operation is not supported in Convex mode.')); }
}