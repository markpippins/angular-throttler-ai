import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileExplorerComponent } from './components/file-explorer/file-explorer.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FileSystemNode } from './models/file-system.model';
import { FILE_SYSTEM_PROVIDER, FileSystemProvider } from './services/file-system-provider';

interface PanePath {
  id: number;
  path: string[];
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FileExplorerComponent, SidebarComponent],
})
export class AppComponent {
  private fileSystemProvider = inject<FileSystemProvider>(FILE_SYSTEM_PROVIDER);

  isSplitView = signal(false);
  activePaneId = signal(1);
  folderTree = signal<FileSystemNode | null>(null);

  // An event-like signal to trigger navigation in the active pane from the sidebar
  sidebarNavigationEvent = signal<{ path: string[], timestamp: number } | null>(null);
  
  // Keep track of each pane's path
  private panePaths = signal<PanePath[]>([{ id: 1, path: [] }]);

  // The sidebar's currentPath is always bound to the path of the active pane
  activePanePath = computed(() => {
    const activeId = this.activePaneId();
    const activePane = this.panePaths().find(p => p.id === activeId);
    return activePane ? activePane.path : [];
  });

  constructor() {
    this.loadFolderTree();
  }

  async loadFolderTree(): Promise<void> {
    try {
      const tree = await this.fileSystemProvider.getFolderTree();
      this.folderTree.set(tree);
    } catch (e) {
      console.error('Failed to load folder tree', e);
    }
  }

  toggleSplitView(): void {
    this.isSplitView.update(isSplit => {
      if (isSplit) {
        // From split to single view
        this.panePaths.update(paths => paths.slice(0, 1));
        this.activePaneId.set(1);
        return false;
      } else {
        // From single to split view
        this.panePaths.update(paths => [...paths, { id: 2, path: [] }]);
        this.activePaneId.set(2);
        return true;
      }
    });
  }

  setActivePane(id: number): void {
    this.activePaneId.set(id);
  }

  onPanePathChanged(event: { id: number; path: string[] }): void {
    this.panePaths.update(paths => {
      const index = paths.findIndex(p => p.id === event.id);
      if (index > -1) {
        const newPaths = [...paths];
        newPaths[index] = { ...newPaths[index], path: event.path };
        return newPaths;
      }
      return paths;
    });
  }
  
  onSidebarNavigation(path: string[]): void {
    this.sidebarNavigationEvent.set({ path, timestamp: Date.now() });
  }
}
