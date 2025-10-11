import { Injectable } from '@angular/core';
import { FileSystemNode } from '../models/file-system.model';
import { FileSystemProvider, ItemReference } from './file-system-provider';

// This is a placeholder service that will eventually use Electron's Node.js APIs
// to interact with the local file system.

@Injectable({
  providedIn: 'root',
})
export class ElectronFileSystemService implements FileSystemProvider {
  private readonly root: FileSystemNode = {
    name: 'My Computer',
    type: 'folder',
    children: [
      {
        name: 'Documents',
        type: 'folder',
        modified: '2024-01-15',
        children: [
            { name: 'resume.pdf', type: 'file', content: 'My resume content.', modified: '2024-01-10' },
            { name: 'project-plan.docx', type: 'file', content: 'Project plan details.', modified: '2024-01-12' },
            {
              name: 'Work',
              type: 'folder',
              modified: '2024-02-01',
              children: [
                { name: 'report.docx', type: 'file', content: 'Work report.' }
              ]
            }
        ],
      },
      {
        name: 'Pictures',
        type: 'folder',
        modified: '2024-01-20',
        children: [
            { name: 'holiday.jpg', type: 'file', content: 'https://picsum.photos/seed/holiday/800/600', modified: '2024-01-18' },
        ],
      },
      { name: 'setup.exe', type: 'file', content: 'Executable file content.', modified: '2023-12-25' },
    ],
  };

  private getNode(path: string[]): FileSystemNode | null {
    if (path.length === 0) {
      return this.root;
    }
    
    let currentNode: FileSystemNode | undefined = this.root;
    for (const segment of path) {
        if (currentNode?.type === 'folder' && currentNode.children) {
            currentNode = currentNode.children.find(child => child.name === segment);
        } else {
            return null;
        }
    }
    return currentNode || null;
  }
  
  async getContents(path: string[]): Promise<FileSystemNode[]> {
    console.log(`[ElectronFS] Getting contents for: ${path.join('/')}`);
    const node = this.getNode(path);
    if (node && node.type === 'folder' && node.children) {
      return Promise.resolve([...node.children]);
    }
    return Promise.resolve([]);
  }

  async getFolderTree(): Promise<FileSystemNode> {
    console.log('[ElectronFS] Getting folder tree.');
    // Recursively clone the folder structure to create a tree suitable for the sidebar.
    // This implementation intentionally filters out files to only show directories.
    const cloneNode = (node: FileSystemNode): FileSystemNode | null => {
        if (node.type !== 'folder') return null;
        const newNode: FileSystemNode = { name: node.name, type: 'folder', children: [] };
        if (node.children) {
            newNode.children = node.children
                .map(child => cloneNode(child))
                .filter((child): child is FileSystemNode => child !== null);
        }
        return newNode;
    };
    return Promise.resolve(cloneNode(this.root)!);
  }

  async createDirectory(path: string[], name: string): Promise<void> {
    const parent = this.getNode(path);
    if (!parent || parent.type !== 'folder') {
      throw new Error('Parent directory not found.');
    }
    if (parent.children?.some(c => c.name === name)) {
      throw new Error('A directory with that name already exists.');
    }
    const newDir: FileSystemNode = { name, type: 'folder', children: [], modified: new Date().toISOString() };
    parent.children = [...(parent.children ?? []), newDir];
  }

  async removeDirectory(path: string[], name: string): Promise<void> {
    const parent = this.getNode(path);
    if (!parent || parent.type !== 'folder' || !parent.children) {
      throw new Error('Parent directory not found.');
    }
    const index = parent.children.findIndex(c => c.name === name && c.type === 'folder');
    if (index === -1) {
      throw new Error('Directory not found.');
    }
    parent.children.splice(index, 1);
  }

  async createFile(path: string[], name: string): Promise<void> {
    const parent = this.getNode(path);
    if (!parent || parent.type !== 'folder') {
      throw new Error('Parent directory not found.');
    }
    if (parent.children?.some(c => c.name === name)) {
      throw new Error('A file with that name already exists.');
    }
    const newFile: FileSystemNode = { name, type: 'file', content: '', modified: new Date().toISOString() };
    parent.children = [...(parent.children ?? []), newFile];
  }

  async deleteFile(path: string[], name: string): Promise<void> {
    const parent = this.getNode(path);
    if (!parent || parent.type !== 'folder' || !parent.children) {
      throw new Error('Parent directory not found.');
    }
    const index = parent.children.findIndex(c => c.name === name && c.type === 'file');
    if (index === -1) {
      throw new Error('File not found.');
    }
    parent.children.splice(index, 1);
  }

  async rename(path: string[], oldName: string, newName: string): Promise<void> {
    const parent = this.getNode(path);
    if (!parent || parent.type !== 'folder' || !parent.children) {
      throw new Error('Parent directory not found.');
    }
    if (parent.children.some(c => c.name === newName)) {
      throw new Error(`An item named "${newName}" already exists.`);
    }
    const item = parent.children.find(c => c.name === oldName);
    if (!item) {
      throw new Error(`Item "${oldName}" not found.`);
    }
    item.name = newName;
    item.modified = new Date().toISOString();
  }

  async uploadFile(path: string[], file: File): Promise<void> {
    const parent = this.getNode(path);
    if (!parent || parent.type !== 'folder') {
      throw new Error('Directory not found.');
    }
    if (parent.children?.some(c => c.name === file.name)) {
      throw new Error(`A file named "${file.name}" already exists.`);
    }

    const newFile: FileSystemNode = {
        name: file.name,
        type: 'file',
        content: `(Mock content for ${file.name})`,
        modified: new Date().toISOString()
    };
    parent.children = [...(parent.children ?? []), newFile];
  }

  async move(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    // A move is a copy then a delete from the source.
    await this.copy(sourcePath, destPath, items);

    const sourceParent = this.getNode(sourcePath);
    if (!sourceParent || !sourceParent.children) {
        throw new Error('Source path not found for deletion step.');
    }
    
    for (const itemRef of items) {
      const index = sourceParent.children.findIndex(c => c.name === itemRef.name);
      if (index > -1) {
        sourceParent.children.splice(index, 1);
      }
    }
  }

  async copy(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    const sourceParent = this.getNode(sourcePath);
    const destParent = this.getNode(destPath);

    if (!sourceParent || !destParent || destParent.type !== 'folder') {
      throw new Error('Source or destination path not found.');
    }

    if (!sourceParent.children) return;

    for (const itemRef of items) {
      const sourceItem = sourceParent.children.find(c => c.name === itemRef.name);
      if (!sourceItem) continue;

      // Handle name conflicts in destination by appending " - Copy"
      let newName = sourceItem.name;
      let counter = 1;
      while (destParent.children?.some(c => c.name === newName)) {
        const dotIndex = sourceItem.name.lastIndexOf('.');
        if (sourceItem.type === 'file' && dotIndex > -1) {
            newName = `${sourceItem.name.substring(0, dotIndex)} - Copy (${counter})${sourceItem.name.substring(dotIndex)}`;
        } else {
            newName = `${sourceItem.name} - Copy (${counter})`;
        }
        counter++;
      }

      // Deep clone the item to avoid reference issues, and update its name
      const clonedItem = JSON.parse(JSON.stringify(sourceItem));
      clonedItem.name = newName;
      clonedItem.modified = new Date().toISOString();
      
      destParent.children = [...(destParent.children ?? []), clonedItem];
    }
  }
}