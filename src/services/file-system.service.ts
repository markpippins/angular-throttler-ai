import { Injectable } from '@angular/core';
import { FileSystemNode } from '../models/file-system.model';
import { FileSystemProvider, ItemReference } from './file-system-provider';

@Injectable({
  providedIn: 'root',
})
export class FileSystemService implements FileSystemProvider {
  private readonly root: FileSystemNode = {
    name: 'C:',
    type: 'folder',
    children: [
      {
        name: 'Program Files',
        type: 'folder',
        modified: '2023-10-26',
        children: [
          { name: 'Angular', type: 'folder', modified: '2023-10-25', children: [] },
          { name: 'Node.js', type: 'folder', modified: '2023-09-11', children: [] },
        ],
      },
      {
        name: 'Users',
        type: 'folder',
        modified: '2023-10-27',
        children: [
          {
            name: 'Public',
            type: 'folder',
            modified: '2023-05-12',
            children: [
                { name: 'shared-document.txt', type: 'file', content: 'Public content', modified: '2023-05-12'},
            ],
          },
          {
            name: 'DefaultUser',
            type: 'folder',
            modified: '2023-10-27',
            children: [
              { name: 'Documents', type: 'folder', modified: '2023-10-27', children: [
                { name: 'project-notes.txt', type: 'file', content: 'Notes about the project.', modified: '2023-10-26' },
                { name: 'report.docx', type: 'file', content: 'Final report.', modified: '2023-10-25' },
              ]},
              { name: 'Downloads', type: 'folder', modified: '2023-10-26', children: [] },
              { name: 'Pictures', type: 'folder', modified: '2023-10-24', children: [
                { name: 'vacation.jpg', type: 'file', content: 'https://picsum.photos/seed/vacation/800/600', modified: '2023-10-22' },
                { name: 'family.png', type: 'file', content: 'https://picsum.photos/seed/family/800/600', modified: '2023-10-21' },
              ]},
            ],
          },
        ],
      },
      {
        name: 'Windows',
        type: 'folder',
        modified: '2023-08-01',
        children: [
          { name: 'System32', type: 'folder', modified: '2023-09-15', children: [] },
        ],
      },
      { name: 'boot.ini', type: 'file', content: 'Boot configuration', modified: '2023-07-19' },
      { name: 'pagefile.sys', type: 'file', content: 'System page file', modified: '2023-10-27' },
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

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  getContents(path: string[]): Promise<FileSystemNode[]> {
    const node = this.getNode(path);
    if (node && node.type === 'folder' && node.children) {
      return Promise.resolve([...node.children]);
    }
    return Promise.resolve([]);
  }

  getFolderTree(): Promise<FileSystemNode> {
    const cloneNode = (node: FileSystemNode): FileSystemNode | null => {
      if (node.type !== 'folder') {
        return null;
      }
      
      const newNode: FileSystemNode = {
        name: node.name,
        type: 'folder',
        modified: node.modified,
        children: []
      };

      if (node.children) {
        newNode.children = node.children
          .map(child => cloneNode(child))
          .filter((child): child is FileSystemNode => child !== null);
      }
      
      return newNode;
    };
    
    const folderTree = cloneNode(this.root);
    return Promise.resolve(folderTree!);
  }
  
  createDirectory(path: string[], name: string): Promise<void> {
    const parent = this.getNode(path);
    if (parent && parent.type === 'folder' && parent.children) {
      if (parent.children.some(c => c.name === name)) {
        return Promise.reject(new Error('Directory already exists.'));
      }
      parent.children.push({ name, type: 'folder', children: [], modified: new Date().toISOString().split('T')[0] });
    }
    return Promise.resolve();
  }

  removeDirectory(path: string[], name: string): Promise<void> {
    const parent = this.getNode(path);
    if (parent && parent.type === 'folder' && parent.children) {
      parent.children = parent.children.filter(c => c.name !== name);
    }
    return Promise.resolve();
  }

  createFile(path: string[], name: string): Promise<void> {
    const parent = this.getNode(path);
    if (parent && parent.type === 'folder' && parent.children) {
      if (parent.children.some(c => c.name === name)) {
        return Promise.reject(new Error('File already exists.'));
      }
      parent.children.push({ name, type: 'file', content: '', modified: new Date().toISOString().split('T')[0] });
    }
    return Promise.resolve();
  }

  deleteFile(path: string[], name: string): Promise<void> {
    const parent = this.getNode(path);
    if (parent && parent.type === 'folder' && parent.children) {
      parent.children = parent.children.filter(c => c.name !== name);
    }
    return Promise.resolve();
  }

  rename(path: string[], oldName: string, newName: string): Promise<void> {
    const parent = this.getNode(path);
    if (parent && parent.type === 'folder' && parent.children) {
      const item = parent.children.find(c => c.name === oldName);
      if (item) {
        if (parent.children.some(c => c.name === newName)) {
           return Promise.reject(new Error('An item with that name already exists.'));
        }
        item.name = newName;
      }
    }
    return Promise.resolve();
  }

  uploadFile(path: string[], file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const parent = this.getNode(path);
      if (!parent || parent.type !== 'folder' || !parent.children) {
        return reject(new Error('Target directory not found.'));
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        // Check if file already exists and remove it to simulate overwrite
        const existingIndex = parent.children!.findIndex(c => c.name === file.name);
        if (existingIndex !== -1) {
          parent.children!.splice(existingIndex, 1);
        }

        const newNode: FileSystemNode = {
          name: file.name,
          type: 'file',
          content: e.target?.result as string,
          modified: new Date().toISOString().split('T')[0]
        };
        parent.children!.push(newNode);
        resolve();
      };

      reader.onerror = (error) => reject(error);

      // Read images as data URLs for preview, otherwise read as text
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  }

  async move(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    const sourceNode = this.getNode(sourcePath);
    const destNode = this.getNode(destPath);
    
    if (!sourceNode || !destNode || !sourceNode.children || !destNode.children) {
        return Promise.reject(new Error("Invalid source or destination path."));
    }
    
    for (const item of items) {
        if (sourcePath.join('/') === destPath.join('/') && sourceNode.children.find(child => child.name === item.name)) {
          continue; // moving to the same directory is a no-op
        }

        if (destNode.children.some(child => child.name === item.name)) {
            return Promise.reject(new Error(`Item "${item.name}" already exists in the destination.`));
        }
        
        const itemIndex = sourceNode.children.findIndex(child => child.name === item.name);
        if (itemIndex > -1) {
            const [itemToMove] = sourceNode.children.splice(itemIndex, 1);
            destNode.children.push(itemToMove);
        }
    }
    
    return Promise.resolve();
  }

  async copy(sourcePath: string[], destPath: string[], items: ItemReference[]): Promise<void> {
    const sourceNode = this.getNode(sourcePath);
    const destNode = this.getNode(destPath);
    
    if (!sourceNode || !destNode || !sourceNode.children || !destNode.children) {
        return Promise.reject(new Error("Invalid source or destination path."));
    }
    
    for (const item of items) {
        if (destNode.children.some(child => child.name === item.name)) {
            return Promise.reject(new Error(`Item "${item.name}" already exists in the destination.`));
        }
        
        const itemToCopy = sourceNode.children.find(child => child.name === item.name);
        if (itemToCopy) {
            const newItem = this.deepClone(itemToCopy);
            destNode.children.push(newItem);
        }
    }
    
    return Promise.resolve();
  }
}