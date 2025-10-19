import { Injectable, signal, effect } from '@angular/core';
import { FileSystemNode, SearchResultNode } from '../models/file-system.model.js';
import { FileSystemProvider, ItemReference } from './file-system-provider.js';

const IN_MEMORY_FS_STORAGE_KEY = 'file-explorer-in-memory-fs';

/**
 * A safe, recursive function to deep-clone a FileSystemNode. This avoids potential
 * issues with JSON.stringify (like converting Date objects to strings) and only
 * copies properties defined in the model.
 */
function cloneNode(node: FileSystemNode): FileSystemNode {
  const newNode: FileSystemNode = {
    name: node.name,
    type: node.type,
    modified: node.modified,
    childrenLoaded: node.childrenLoaded
  };
  if (node.content !== undefined) {
    newNode.content = node.content;
  }
  if (node.children) {
    newNode.children = node.children.map(cloneNode);
  }
  return newNode;
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
    const newRoot = cloneNode(this.rootNode());
    const sourceParent = this.findNodeInTree(newRoot, sourcePath);
    if (!sourceParent?.children) throw new Error('Source path not found.');
    
    const destParent = this.findNodeInTree(newRoot, destPath);
    if (!destParent || destParent.type !== 'folder') throw new Error('Destination path not found.');
    
    const itemsToMove: FileSystemNode[] = [];
    const remainingChildren = sourceParent.children.filter(child => {
        const shouldMove = items.some(itemRef => itemRef.name === child.name && itemRef.type === child.type);
        if (shouldMove) itemsToMove.push(child);
        return !shouldMove;
    });
    
    for (const item of itemsToMove) {
        if ((destParent.children ?? []).some(c => c.name === item.name)) {
            throw new Error(`An item named '${item.name}' already exists in the destination.`);
        }
    }
    
    sourceParent.children = remainingChildren;
    sourceParent.modified = new Date().toISOString();
    
    destParent.children = [...(destParent.children ?? []), ...itemsToMove];
    destParent.modified = new Date().toISOString();

    this.rootNode.set(newRoot);
  }
  
  async copy(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    const newRoot = cloneNode(this.rootNode());
    const sourceParent = this.findNodeInTree(newRoot, sourcePath);
    if (!sourceParent?.children) throw new Error('Source path not found.');

    const destParent = this.findNodeInTree(newRoot, destPath);
    if (!destParent || destParent.type !== 'folder') throw new Error('Destination path not found.');
    
    const itemsToCopy = sourceParent.children
      .filter(child => items.some(itemRef => itemRef.name === child.name && itemRef.type === child.type))
      .map(item => cloneNode(item)); // Deep clone items to copy

    const newChildrenForDest = [...(destParent.children ?? [])];
    
    for (const item of itemsToCopy) {
        let finalName = item.name;
        if (newChildrenForDest.some(c => c.name === finalName)) {
            let copyIndex = 1;
            let newName = '';
            do {
                const extension = finalName.includes('.') ? finalName.substring(finalName.lastIndexOf('.')) : '';
                const baseName = extension ? finalName.substring(0, finalName.lastIndexOf('.')) : finalName;
                newName = `${baseName} - Copy${copyIndex > 1 ? ` (${copyIndex})` : ''}${extension}`;
                copyIndex++;
            } while (newChildrenForDest.some(c => c.name === newName));
            finalName = newName;
        }
        item.name = finalName;
        item.modified = new Date().toISOString();
        newChildrenForDest.push(item);
    }
    
    destParent.children = newChildrenForDest;
    destParent.modified = new Date().toISOString();
    
    this.rootNode.set(newRoot);
  }

  // Not supported for this in-memory provider.
  uploadFile(path: string[], file: File): Promise<void> {
    return this.createFile(path, file.name);
  }
}