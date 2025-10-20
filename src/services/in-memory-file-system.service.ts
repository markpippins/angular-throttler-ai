import { Injectable, signal, effect } from '@angular/core';
import { FileSystemNode, SearchResultNode } from '../models/file-system.model.js';
import { FileSystemProvider, ItemReference } from './file-system-provider.js';

const IN_MEMORY_FS_STORAGE_KEY = 'file-explorer-in-memory-fs';

/**
 * A safe, recursive function to deep-clone a FileSystemNode using JSON serialization.
 * This is robust for the data structures used in this application and ensures
 * all object references are broken.
 */
function cloneNode(node: FileSystemNode): FileSystemNode {
  return JSON.parse(JSON.stringify(node));
}

@Injectable({
  providedIn: 'root',
})
export class InMemoryFileSystemService implements FileSystemProvider {
  private rootNode = signal<FileSystemNode>({
    name: 'Local Files',
    type: 'folder',
    children: [
        { name: 'Documents', type: 'folder', children: [], modified: new Date().toISOString() },
        { name: 'Pictures', type: 'folder', children: [], modified: new Date().toISOString() },
        { name: 'README.txt', type: 'file', content: 'This is a virtual file system stored in your browser\'s local storage.', modified: new Date().toISOString() }
    ],
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
      const storedTree = localStorage.getItem(IN_MEMORY_FS_STORAGE_KEY);
      if (storedTree) {
        const parsedTree: FileSystemNode = JSON.parse(storedTree);
        // Basic validation
        if (parsedTree && parsedTree.name && parsedTree.type === 'folder') {
          this.rootNode.set(parsedTree);
          return;
        }
      }
      // If nothing in storage, save the default tree
      this.saveTreeToStorage();

    } catch (e) {
      console.error('Failed to load local file system from storage.', e);
    }
  }

  private saveTreeToStorage(): void {
    try {
      localStorage.setItem(IN_MEMORY_FS_STORAGE_KEY, JSON.stringify(this.rootNode()));
    } catch (e) {
      console.error('Failed to save local file system to storage.', e);
    }
  }

  /**
   * Recursively traverses the tree to find a node at a given path.
   * NOTE: This should be used on a specific tree instance (like a clone), not on the signal directly.
   */
  private findNodeInTree(root: FileSystemNode, path: string[]): FileSystemNode | null {
    let currentNode: FileSystemNode | null = root;
    for (const segment of path) {
      const nextNode: FileSystemNode | undefined = currentNode?.children?.find(c => c.name === segment);
      if (!nextNode || nextNode.type !== 'folder') return null; // Only traverse folders
      currentNode = nextNode;
    }
    return currentNode;
  }

  async getFolderTree(): Promise<FileSystemNode> {
    return cloneNode(this.rootNode());
  }

  async getContents(path: string[]): Promise<FileSystemNode[]> {
    const node = this.findNodeInTree(this.rootNode(), path);
    if (node && node.type === 'folder') {
      return (node.children ?? []).map(cloneNode);
    }
    throw new Error('Path not found or is not a folder.');
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
            results.push({ ...cloneNode(child), path: path });
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
    const newRoot = cloneNode(this.rootNode());
    const parentNode = this.findNodeInTree(newRoot, path);

    if (!parentNode || parentNode.type !== 'folder') {
      throw new Error('Path not found or is not a folder.');
    }

    const currentChildren = parentNode.children ?? [];
    if (currentChildren.some(c => c.name === name)) {
      throw new Error(`An item named '${name}' already exists.`);
    }

    const newFolder: FileSystemNode = { name, type: 'folder', children: [], modified: new Date().toISOString() };
    parentNode.children = [...currentChildren, newFolder];
    parentNode.modified = new Date().toISOString();
    
    this.rootNode.set(newRoot);
  }

  async createFile(path: string[], name: string): Promise<void> {
    const newRoot = cloneNode(this.rootNode());
    const parentNode = this.findNodeInTree(newRoot, path);

    if (!parentNode || parentNode.type !== 'folder') {
      throw new Error('Path not found or is not a folder.');
    }
    
    const currentChildren = parentNode.children ?? [];
    if (currentChildren.some(c => c.name === name)) {
      throw new Error(`An item named '${name}' already exists.`);
    }

    const newFile: FileSystemNode = { name, type: 'file', content: '', modified: new Date().toISOString() };
    parentNode.children = [...currentChildren, newFile];
    parentNode.modified = new Date().toISOString();
    
    this.rootNode.set(newRoot);
  }

  async removeDirectory(path: string[], name: string): Promise<void> {
    const newRoot = cloneNode(this.rootNode());
    const parentNode = this.findNodeInTree(newRoot, path);
    if (!parentNode?.children) throw new Error('Path not found.');

    const childExists = parentNode.children.some(c => c.name === name && c.type === 'folder');
    if (!childExists) throw new Error(`Directory '${name}' not found.`);
    
    parentNode.children = parentNode.children.filter(c => c.name !== name);
    parentNode.modified = new Date().toISOString();
    
    this.rootNode.set(newRoot);
  }

  async deleteFile(path: string[], name: string): Promise<void> {
    const newRoot = cloneNode(this.rootNode());
    const parentNode = this.findNodeInTree(newRoot, path);
    if (!parentNode?.children) throw new Error('Path not found.');

    const childExists = parentNode.children.some(c => c.name === name && c.type === 'file');
    if (!childExists) throw new Error(`File '${name}' not found.`);
    
    parentNode.children = parentNode.children.filter(c => c.name !== name);
    parentNode.modified = new Date().toISOString();
    
    this.rootNode.set(newRoot);
  }

  async rename(path: string[], oldName: string, newName: string): Promise<void> {
    const newRoot = cloneNode(this.rootNode());
    const parentNode = this.findNodeInTree(newRoot, path);
    if (!parentNode?.children) throw new Error('Path not found.');

    if (oldName !== newName && parentNode.children.some(c => c.name === newName)) {
      throw new Error(`An item named '${newName}' already exists.`);
    }
    
    const childToRename = parentNode.children.find(c => c.name === oldName);
    if (!childToRename) throw new Error(`Item '${oldName}' not found.`);

    parentNode.children = parentNode.children.map(c => 
      c.name === oldName 
        ? { ...c, name: newName, modified: new Date().toISOString() } 
        : c
    );
    parentNode.modified = new Date().toISOString();

    this.rootNode.set(newRoot);
  }

  async move(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    this.rootNode.update(currentRoot => {
      const newRoot = cloneNode(currentRoot);
      const sourceParent = this.findNodeInTree(newRoot, sourcePath);
      if (!sourceParent?.children) {
        throw new Error('Source path not found.');
      }

      const destParent = this.findNodeInTree(newRoot, destPath);
      if (!destParent || destParent.type !== 'folder') {
        throw new Error('Destination path not found.');
      }

      const itemsToMove: FileSystemNode[] = [];
      const newSourceChildren: FileSystemNode[] = [];

      for (const child of sourceParent.children) {
        const shouldMove = items.some(itemRef => itemRef.name === child.name && itemRef.type === child.type);
        if (shouldMove) {
          itemsToMove.push(child);
        } else {
          newSourceChildren.push(child);
        }
      }

      if (itemsToMove.length === 0) {
        return currentRoot; // No change
      }
      
      if (!destParent.children) {
        destParent.children = [];
      }

      for (const item of itemsToMove) {
        if (destParent.children.some(c => c.name === item.name)) {
          throw new Error(`An item named '${item.name}' already exists in the destination.`);
        }
      }

      sourceParent.children = newSourceChildren;
      sourceParent.modified = new Date().toISOString();

      destParent.children.push(...itemsToMove);
      destParent.modified = new Date().toISOString();

      return newRoot;
    });
  }

  private getUniqueCopyName(originalName: string, existingChildren: FileSystemNode[]): string {
    let finalName = originalName;
    if (!existingChildren.some(c => c.name === finalName)) {
      return finalName;
    }

    let copyIndex = 1;
    const extension = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '';
    const baseName = extension ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;

    do {
      const suffix = ` - Copy${copyIndex > 1 ? ` (${copyIndex})` : ''}`;
      finalName = `${baseName}${suffix}${extension}`;
      copyIndex++;
    } while (existingChildren.some(c => c.name === finalName));
    
    return finalName;
  }
  
  async copy(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    // Phase 1: Read and prepare all data outside of the state update.
    const currentRoot = this.rootNode();
    const sourceParent = this.findNodeInTree(currentRoot, sourcePath);
    if (!sourceParent?.children) {
      throw new Error('Source path not found.');
    }

    // Create deep clones of the items to be copied. These are now completely
    // detached from the original state tree.
    const itemsToCopy = sourceParent.children
      .filter(child => items.some(itemRef => itemRef.name === child.name && itemRef.type === child.type))
      .map(node => cloneNode(node));

    if (itemsToCopy.length === 0) {
      return; // Nothing to do, no state change needed.
    }

    // Phase 2: Perform a single, atomic state update.
    this.rootNode.update(root => {
      // Start with a fresh clone of the entire state for mutation.
      const newRoot = cloneNode(root);
      const destParent = this.findNodeInTree(newRoot, destPath);
      
      if (!destParent || destParent.type !== 'folder') {
        throw new Error('Destination path not found.');
      }
      
      if (!destParent.children) {
        destParent.children = [];
      }
      
      // Add the pre-cloned items to the destination.
      for (const item of itemsToCopy) {
        // 'item' is already a clone. We can safely modify its properties before adding it.
        item.name = this.getUniqueCopyName(item.name, destParent.children);
        item.modified = new Date().toISOString();
        destParent.children.push(item);
      }
      
      destParent.modified = new Date().toISOString();
      
      return newRoot;
    });
  }

  // Not supported for this in-memory provider.
  uploadFile(path: string[], file: File): Promise<void> {
    return this.createFile(path, file.name);
  }
}
