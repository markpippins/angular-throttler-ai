import { Injectable, signal, effect, inject } from '@angular/core';
import { FileSystemNode } from '../models/file-system.model.js';
import { FileSystemProvider, ItemReference } from './file-system-provider.js';
import { LocalConfigService } from './local-config.service.js';

const SESSION_FS_STORAGE_KEY = 'file-explorer-session-fs';

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
export class SessionService implements FileSystemProvider {
  private localConfigService = inject(LocalConfigService);
  private rootNode = signal<FileSystemNode>({
    name: '', // Name will be set from config service
    type: 'folder',
    children: [
      {
        name: 'Documents',
        type: 'folder',
        children: [
          { name: 'project-brief.docx', type: 'file', content: 'Project brief content.', modified: '2023-10-26T10:00:00Z' },
          { name: 'quarterly-results.xlsx', type: 'file', content: 'Spreadsheet data.', modified: '2023-10-25T14:30:00Z' },
        ],
        modified: '2023-10-26T10:00:00Z'
      },
      {
        name: 'Pictures',
        type: 'folder',
        children: [
          { name: 'logo.png', type: 'file', content: 'image data', modified: '2023-09-15T11:00:00Z' },
          { name: 'team-photo.jpg', type: 'file', content: 'image data', modified: '2023-09-10T18:00:00Z' },
        ],
        modified: '2023-09-15T11:00:00Z'
      },
      {
        name: 'Work',
        type: 'folder',
        children: [
          {
            name: 'Dev',
            type: 'folder',
            children: [
              {
                name: 'Projects',
                type: 'folder',
                children: [
                  { name: 'Throttler.magnet', type: 'folder', children: [], modified: '2023-10-20T09:00:00Z' },
                  { name: 'Atomix.magnet', type: 'folder', children: [], modified: '2023-10-18T16:20:00Z' },
                ],
                modified: '2023-10-20T09:00:00Z'
              },
              {
                name: 'Users',
                type: 'folder',
                children: [
                  { name: 'j.doe', type: 'folder', children: [], modified: '2023-08-01T12:00:00Z' },
                  { name: 's.smith', type: 'folder', children: [], modified: '2023-08-02T15:00:00Z' },
                ],
                modified: '2023-08-02T15:00:00Z'
              }
            ],
            modified: '2023-10-20T09:00:00Z'
          },
          {
            name: 'Devops',
            type: 'folder',
            children: [
              { name: 'ci-pipeline.yml', type: 'file', content: 'YAML content', modified: '2023-10-24T11:45:00Z' },
              { name: 'deploy-script.sh', type: 'file', content: 'Shell script', modified: '2023-10-23T09:30:00Z' },
            ],
            modified: '2023-10-24T11:45:00Z'
          },
          {
            name: 'Resources',
            type: 'folder',
            children: [
              { name: 'brand-assets.zip', type: 'file', content: 'zip data', modified: '2023-07-30T10:00:00Z' },
              { name: 'font-license.txt', type: 'file', content: 'License info', modified: '2023-07-29T10:00:00Z' },
            ],
            modified: '2023-07-30T10:00:00Z'
          },
        ],
        modified: '2023-10-26T11:00:00Z'
      },
      {
        name: 'Desktop',
        type: 'folder',
        children: [
          { name: 'screenshot.png', type: 'file', content: 'image data', modified: '2023-10-27T13:00:00Z' },
        ],
        modified: '2023-10-27T13:00:00Z'
      },
      {
        name: 'Home',
        type: 'folder',
        children: [],
        modified: '2023-08-01T09:00:00Z'
      },
      { 
        name: 'README.txt', 
        type: 'file', 
        content: 'This is a virtual file system stored in your browser\'s local storage.', 
        modified: '2023-08-01T09:00:00Z' 
      }
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
      const storedTree = localStorage.getItem(SESSION_FS_STORAGE_KEY);
      const sessionName = this.localConfigService.sessionName();
      if (storedTree) {
        const parsedTree: FileSystemNode = JSON.parse(storedTree);
        // Basic validation and overwrite name with config
        if (parsedTree && parsedTree.type === 'folder') {
          parsedTree.name = sessionName;
          this.rootNode.set(parsedTree);
          return;
        }
      }
      // If nothing in storage, save the default tree with the correct name
      this.rootNode.update(root => ({ ...root, name: sessionName }));
      this.saveTreeToStorage();

    } catch (e) {
      console.error('Failed to load session file system from storage.', e);
    }
  }

  private saveTreeToStorage(): void {
    try {
      localStorage.setItem(SESSION_FS_STORAGE_KEY, JSON.stringify(this.rootNode()));
    } catch (e) {
      console.error('Failed to save session file system to storage.', e);
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
    const tree = cloneNode(this.rootNode());
    // Ensure the tree name is always up-to-date with the latest config
    tree.name = this.localConfigService.sessionName();
    return tree;
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
    throw new Error('File not found in Session file system.');
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
    this.rootNode.update(root => {
        // Start with a fresh clone of the entire state for this operation.
        const newRoot = cloneNode(root);

        const sourceParent = this.findNodeInTree(newRoot, sourcePath);
        if (!sourceParent?.children) {
            throw new Error('Copy failed: Source path not found.');
        }

        const destParent = this.findNodeInTree(newRoot, destPath);
        if (!destParent || destParent.type !== 'folder') {
            throw new Error('Copy failed: Destination path is not a valid folder.');
        }

        const nodesToCopy = sourceParent.children.filter(child => 
            items.some(itemRef => itemRef.name === child.name && itemRef.type === child.type)
        );

        if (nodesToCopy.length === 0) {
            return root; // No change needed, return original state.
        }

        const existingDestChildren = [...(destParent.children || [])];
        const newClonesToAdd: FileSystemNode[] = [];

        // Phase 1: Calculate all new nodes and their names first.
        // This avoids reading from the destination array while we are conceptually adding to it.
        for (const item of nodesToCopy) {
            const itemCopy = cloneNode(item);
            
            // Check for name clashes against both the original destination children AND
            // any new clones we've already prepared in this same operation.
            const combinedChildrenCheck = [...existingDestChildren, ...newClonesToAdd];
            itemCopy.name = this.getUniqueCopyName(item.name, combinedChildrenCheck);
            itemCopy.modified = new Date().toISOString();
            newClonesToAdd.push(itemCopy);
        }
        
        // Phase 2: Mutate the state once with the prepared nodes.
        if (!destParent.children) {
            destParent.children = [];
        }
        destParent.children.push(...newClonesToAdd);
        destParent.modified = new Date().toISOString();

        return newRoot;
    });
  }

  // Not supported for this in-memory provider.
  uploadFile(path: string[], file: File): Promise<void> {
    return this.createFile(path, file.name);
  }
}