import { Component, ChangeDetectionStrategy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model';
import { FILE_SYSTEM_PROVIDER, FileSystemProvider } from '../../services/file-system-provider';
import { ImageService } from '../../services/image.service';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FolderComponent } from '../folder/folder.component';

interface FileSystemState {
  status: 'loading' | 'success' | 'error';
  items: FileSystemNode[];
  error?: string;
}

@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
  imports: [CommonModule, NgOptimizedImage, ToolbarComponent, SidebarComponent, FolderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileExplorerComponent {
  private fileSystemProvider = inject<FileSystemProvider>(FILE_SYSTEM_PROVIDER);
  private imageService = inject(ImageService);

  currentPath = signal<string[]>([]);
  
  state = signal<FileSystemState>({ status: 'loading', items: [] });
  
  contextMenu = signal<{ x: number; y: number; item: FileSystemNode | null } | null>(null);
  
  previewItem = signal<FileSystemNode | null>(null);

  failedImageItems = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      this.loadContents(this.currentPath());
    });
  }

  async loadContents(path: string[]): Promise<void> {
    this.state.update(s => ({ ...s, status: 'loading' }));
    this.failedImageItems.set(new Set()); // Reset failed images on navigation
    try {
      const items = await this.fileSystemProvider.getContents(path);
      this.state.set({ status: 'success', items });
    } catch (e) {
      this.state.set({ status: 'error', items: [], error: (e as Error).message });
    }
  }

  currentPathString = computed(() => {
    return ['C:', ...this.currentPath()].join('\\');
  });

  canGoUp = computed(() => this.currentPath().length > 0);

  getIconUrl(item: FileSystemNode): string | null {
    return this.imageService.getIconUrl(item);
  }

  isImageFile(filename: string): boolean {
    const extension = this.getFileExtension(filename);
    if (!extension) return false;
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension.toLowerCase());
  }

  private getFileExtension(filename: string): string | null {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) {
      return null;
    }
    return filename.substring(lastDot + 1);
  }

  openItem(item: FileSystemNode): void {
    if (item.type === 'folder') {
      this.currentPath.update(path => [...path, item.name]);
    } else {
      this.previewItem.set(item);
    }
  }

  closePreview(): void {
    this.previewItem.set(null);
  }

  goUp(): void {
    if (this.canGoUp()) {
      this.currentPath.update(path => path.slice(0, -1));
    }
  }

  navigateToPath(index: number): void {
    this.currentPath.update(path => path.slice(0, index + 1));
  }
  
  onContextMenu(event: MouseEvent, item: FileSystemNode | null = null): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.set({ x: event.clientX, y: event.clientY, item });
  }

  closeContextMenu(): void {
    this.contextMenu.set(null);
  }

  onImageError(itemName: string): void {
    this.failedImageItems.update(currentSet => {
      const newSet = new Set(currentSet);
      newSet.add(itemName);
      return newSet;
    });
  }

  async createFolder(): Promise<void> {
    const name = prompt('Enter folder name:');
    if (name) {
      try {
        await this.fileSystemProvider.createDirectory(this.currentPath(), name);
        this.loadContents(this.currentPath());
      } catch (e) {
        alert(`Error: ${(e as Error).message}`);
      }
    }
    this.closeContextMenu();
  }

  async createFile(): Promise<void> {
    const name = prompt('Enter file name:');
    if (name) {
      try {
        await this.fileSystemProvider.createFile(this.currentPath(), name);
        this.loadContents(this.currentPath());
      } catch (e) {
        alert(`Error: ${(e as Error).message}`);
      }
    }
    this.closeContextMenu();
  }

  async renameItem(): Promise<void> {
    const item = this.contextMenu()?.item;
    if (!item) return;

    const newName = prompt('Enter new name:', item.name);
    if (newName && newName !== item.name) {
      try {
        await this.fileSystemProvider.rename(this.currentPath(), item.name, newName);
        this.loadContents(this.currentPath());
      } catch (e) {
        alert(`Error: ${(e as Error).message}`);
      }
    }
    this.closeContextMenu();
  }

  async deleteItem(): Promise<void> {
    const item = this.contextMenu()?.item;
    if (!item) return;

    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        if (item.type === 'folder') {
          await this.fileSystemProvider.removeDirectory(this.currentPath(), item.name);
        } else {
          await this.fileSystemProvider.deleteFile(this.currentPath(), item.name);
        }
        this.loadContents(this.currentPath());
      } catch (e) {
        alert(`Error: ${(e as Error).message}`);
      }
    }
    this.closeContextMenu();
  }
}