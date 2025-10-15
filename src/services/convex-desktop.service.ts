import { Injectable, signal, effect } from '@angular/core';
import { FileSystemNode, SearchResultNode } from '../models/file-system.model.js';
import { FileSystemProvider, ItemReference } from './file-system-provider.js';

const CONVEX_FS_STORAGE_KEY = 'file-explorer-convex-fs';

@Injectable({
  providedIn: 'root',
})
export class ConvexDesktopService implements FileSystemProvider {
  private rootNode = signal<FileSystemNode>({
    name: 'Local',
    type: 'folder',
    children: [],
    modified: new Date().toISOString()
  });

  constructor() {
    this.loadTreeFromStorage();
    // This effect will automatically save the tree to localStorage whenever it changes.
    effect(() => {
      this.saveTreeToStorage();
    });
  }

  private loadTreeFromStorage(): void {
    try {
      const storedTree = localStorage.getItem(CONVEX_FS_STORAGE_KEY);
      if (storedTree) {
        const parsedTree: FileSystemNode = JSON.parse(storedTree);
        // Basic validation
        if (parsedTree && parsedTree.name && parsedTree.type === 'folder') {
          this.rootNode.set(parsedTree);
        }
      }
    } catch (e) {
      console.error('Failed to load local file system from storage.', e);
      // If loading fails, it will just use the default initial state.
    }
  }

  private saveTreeToStorage(): void {
    try {
      localStorage.setItem(CONVEX_FS_STORAGE_KEY, JSON.stringify(this.rootNode()));
    } catch (e) {
      console.error('Failed to save local file system to storage.', e);
    }
  }

  private findNodeInTree(root: FileSystemNode, path: string[]): FileSystemNode | null {
    let currentNode: FileSystemNode | null = root;
    for (const segment of path) {
      const nextNode = currentNode?.children?.find(c => c.name === segment);
      if (!nextNode) return null;
      currentNode = nextNode;
    }
    return currentNode;
  }

  async getFolderTree(): Promise<FileSystemNode> {
    return JSON.parse(JSON.stringify(this.rootNode())) as FileSystemNode;
  }

  async getContents(path: string[]): Promise<FileSystemNode[]> {
    const node = this.findNodeInTree(this.rootNode(), path);
    if (node && node.type === 'folder') {
      return [...(node.children ?? [])];
    }
    return [];
  }

  async getFileContent(path: string[], name: string): Promise<string> {
    const parentNode = this.findNodeInTree(this.rootNode(), path);
    const fileNode = parentNode?.children?.find(c => c.name === name && c.type === 'file');
    if (fileNode) {
      return fileNode.content ?? '';
    }
    throw new Error('File not found in Local file system.');
  }

  async search(query: string): Promise<SearchResultNode[]> {
    const results: SearchResultNode[] = [];
    const lowerCaseQuery = query.toLowerCase();

    function find(node: FileSystemNode, path: string[]) {
      if (node.children) {
        for (const child of node.children) {
          if (child.name.toLowerCase().includes(lowerCaseQuery)) {
            results.push({ ...(JSON.parse(JSON.stringify(child)) as FileSystemNode), path: path });
          }
          if (child.type === 'folder') {
            find(child, [...path, child.name]);
          }
        }
      }
    }

    find(this.rootNode(), []);
    return results;
  }

  async createDirectory(path: string[], name: string): Promise<void> {
    this.rootNode.update(root => {
      const newRoot: FileSystemNode = JSON.parse(JSON.stringify(root));
      const parentNode = this.findNodeInTree(newRoot, path);
      if (parentNode?.type === 'folder') {
        if (!parentNode.children) parentNode.children = [];
        if (parentNode.children.some(c => c.name === name)) {
          throw new Error(`Directory '${name}' already exists.`);
        }
        parentNode.children.push({ name, type: 'folder', children: [], modified: new Date().toISOString() });
        parentNode.modified = new Date().toISOString();
      } else {
        throw new Error('Parent path not found or is not a folder.');
      }
      return newRoot;
    });
  }

  async createFile(path: string[], name: string): Promise<void> {
    this.rootNode.update(root => {
      const newRoot: FileSystemNode = JSON.parse(JSON.stringify(root));
      const parentNode = this.findNodeInTree(newRoot, path);
      if (parentNode?.type === 'folder') {
        if (!parentNode.children) parentNode.children = [];
        if (parentNode.children.some(c => c.name === name)) {
          throw new Error(`File '${name}' already exists.`);
        }
        parentNode.children.push({ name, type: 'file', content: '', modified: new Date().toISOString() });
        parentNode.modified = new Date().toISOString();
      } else {
        throw new Error('Path not found.');
      }
      return newRoot;
    });
  }

  async removeDirectory(path: string[], name: string): Promise<void> {
    this.rootNode.update(root => {
      const newRoot: FileSystemNode = JSON.parse(JSON.stringify(root));
      const parentNode = this.findNodeInTree(newRoot, path);
      if (parentNode?.children) {
        const index = parentNode.children.findIndex(c => c.name === name && c.type === 'folder');
        if (index > -1) {
          parentNode.children.splice(index, 1);
          parentNode.modified = new Date().toISOString();
        } else {
          throw new Error(`Directory '${name}' not found.`);
        }
      } else {
        throw new Error('Path not found.');
      }
      return newRoot;
    });
  }

  async deleteFile(path: string[], name: string): Promise<void> {
    this.rootNode.update(root => {
      const newRoot: FileSystemNode = JSON.parse(JSON.stringify(root));
      const parentNode = this.findNodeInTree(newRoot, path);
      if (parentNode?.children) {
        const index = parentNode.children.findIndex(c => c.name === name && c.type === 'file');
        if (index > -1) {
          parentNode.children.splice(index, 1);
          parentNode.modified = new Date().toISOString();
        } else {
          throw new Error(`File '${name}' not found.`);
        }
      } else {
        throw new Error('Path not found.');
      }
      return newRoot;
    });
  }

  async rename(path: string[], oldName: string, newName: string): Promise<void> {
    this.rootNode.update(root => {
      const newRoot: FileSystemNode = JSON.parse(JSON.stringify(root));
      const parentNode = this.findNodeInTree(newRoot, path);
      if (parentNode?.children) {
        if (oldName !== newName && parentNode.children.some(c => c.name === newName)) {
          throw new Error(`An item named '${newName}' already exists.`);
        }
        const childNode = parentNode.children.find(c => c.name === oldName);
        if (childNode) {
          childNode.name = newName;
          childNode.modified = new Date().toISOString();
          parentNode.modified = new Date().toISOString();
        } else {
          throw new Error(`Item '${oldName}' not found.`);
        }
      } else {
        throw new Error('Path not found.');
      }
      return newRoot;
    });
  }

  async move(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    this.rootNode.update(root => {
      const newRoot: FileSystemNode = JSON.parse(JSON.stringify(root));
      const sourceParent = this.findNodeInTree(newRoot, sourcePath);
      const destParent = this.findNodeInTree(newRoot, destPath);

      if (!sourceParent || !destParent || destParent.type !== 'folder') {
        throw new Error('Source or destination path not found.');
      }
      if (!sourceParent.children) sourceParent.children = [];
      if (!destParent.children) destParent.children = [];

      const sourceIsDest = sourcePath.join('/') === destPath.join('/');
      if (sourceIsDest) return newRoot;

      const itemsToMove: FileSystemNode[] = [];

      for (const itemRef of items) {
        const itemIndex = sourceParent.children.findIndex(c => c.name === itemRef.name);
        if (itemIndex > -1) {
          if (destParent.children.some(c => c.name === itemRef.name)) {
            throw new Error(`An item named '${itemRef.name}' already exists in the destination.`);
          }
          const [item] = sourceParent.children.splice(itemIndex, 1);
          itemsToMove.push(item);
        }
      }

      destParent.children.push(...itemsToMove);
      destParent.modified = new Date().toISOString();
      sourceParent.modified = new Date().toISOString();

      return newRoot;
    });
  }

  async copy(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    this.rootNode.update(root => {
        const newRoot: FileSystemNode = JSON.parse(JSON.stringify(root));
        const sourceParent = this.findNodeInTree(newRoot, sourcePath);

        if (!sourceParent?.children) {
            throw new Error('Source path not found during copy.');
        }

        const itemsToCopy: FileSystemNode[] = [];
        for (const itemRef of items) {
            const item = sourceParent.children.find(c => c.name === itemRef.name);
            if (item) {
                itemsToCopy.push(JSON.parse(JSON.stringify(item)) as FileSystemNode); 
            }
        }

        const destParent = this.findNodeInTree(newRoot, destPath);
        if (!destParent || destParent.type !== 'folder') {
            throw new Error('Destination path not found during copy.');
        }
        if (!destParent.children) destParent.children = [];

        for (const item of itemsToCopy) {
            if (destParent.children.some(c => c.name === item.name)) {
                // Create a unique name for the copy
                let copyIndex = 1;
                let newName = '';
                do {
                    const extension = item.name.includes('.') ? item.name.substring(item.name.lastIndexOf('.')) : '';
                    const baseName = extension ? item.name.substring(0, item.name.lastIndexOf('.')) : item.name;
                    newName = `${baseName} - Copy${copyIndex > 1 ? ` (${copyIndex})` : ''}${extension}`;
                    copyIndex++;
                } while (destParent.children.some(c => c.name === newName));
                item.name = newName;
            }
            item.modified = new Date().toISOString();
            destParent.children.push(item);
        }
        destParent.modified = new Date().toISOString();
        return newRoot;
    });
  }

  uploadFile(path: string[], file: File): Promise<void> {
    // Mock implementation for in-memory FS
    return this.createFile(path, file.name);
  }
}
