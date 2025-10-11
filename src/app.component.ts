import { Component, ChangeDetectionStrategy, signal, computed, inject, effect, Renderer2, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FileExplorerComponent } from './components/file-explorer/file-explorer.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FileSystemNode } from './models/file-system.model';
import { FileSystemProvider } from './services/file-system-provider';
import { ServerProfilesDialogComponent } from './components/server-profiles-dialog/server-profiles-dialog.component';
import { ElectronFileSystemService } from './services/electron-file-system.service';
import { RemoteFileSystemService } from './services/remote-file-system.service';
import { ServerProfileService } from './services/server-profile.service';

interface PanePath {
  id: number;
  path: string[];
}
type Theme = 'theme-light' | 'theme-steel' | 'theme-dark';
const THEME_STORAGE_KEY = 'file-explorer-theme';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FileExplorerComponent, SidebarComponent, ServerProfilesDialogComponent],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class AppComponent implements OnDestroy {
  private electronFs = inject(ElectronFileSystemService);
  private remoteFs = inject(RemoteFileSystemService);
  private profileService = inject(ServerProfileService);
  private document = inject(DOCUMENT);
  private elementRef = inject(ElementRef);

  // --- State Management ---
  connectionState = signal<'local' | 'remote'>('local');
  isSplitView = signal(false);
  activePaneId = signal(1);
  folderTree = signal<FileSystemNode | null>(null);
  isServerProfilesDialogOpen = signal(false);
  isThemeDropdownOpen = signal(false);

  // An event-like signal to trigger navigation in the active pane from the sidebar
  sidebarNavigationEvent = signal<{ path: string[], timestamp: number } | null>(null);
  
  // Keep track of each pane's path
  private panePaths = signal<PanePath[]>([{ id: 1, path: [] }]);

  // --- Theme Management ---
  currentTheme = signal<Theme>('theme-steel');
  themes: {id: Theme, name: string}[] = [
    { id: 'theme-light', name: 'Light' },
    { id: 'theme-steel', name: 'Steel' },
    { id: 'theme-dark', name: 'Dark' },
  ];

  // --- Computed Properties ---
  fileSystemProvider = computed<FileSystemProvider>(() => 
    this.connectionState() === 'local' ? this.electronFs : this.remoteFs
  );
  
  connectionStatusText = computed(() => {
    if (this.connectionState() === 'local') {
      return 'Local File System';
    }
    return this.profileService.activeProfile()?.name ?? 'Remote Connection';
  });

  // The sidebar's currentPath is always bound to the path of the active pane
  activePanePath = computed(() => {
    const activeId = this.activePaneId();
    const activePane = this.panePaths().find(p => p.id === activeId);
    return activePane ? activePane.path : [];
  });

  constructor() {
    this.loadTheme();
    
    // Persist theme changes and update body class
    effect(() => {
      const theme = this.currentTheme();
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      this.document.body.className = theme;
    });

    // Reload the entire folder tree whenever the connection state changes.
    effect(() => {
      this.loadFolderTree(this.fileSystemProvider());
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    // Clean up body class if component is destroyed
    this.document.body.className = '';
  }

  loadTheme(): void {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
      if (storedTheme && this.themes.some(t => t.id === storedTheme)) {
        this.currentTheme.set(storedTheme);
      } else {
        this.currentTheme.set('theme-steel');
      }
    } catch (e) {
      console.error('Failed to load theme from localStorage', e);
      this.currentTheme.set('theme-steel');
    }
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    this.isThemeDropdownOpen.set(false);
  }

  toggleThemeDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isThemeDropdownOpen.update(v => !v);
  }
  
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isThemeDropdownOpen()) {
        this.isThemeDropdownOpen.set(false);
      }
    }
  }

  async loadFolderTree(provider: FileSystemProvider): Promise<void> {
    this.folderTree.set(null); // Clear old tree immediately
    // Reset paths when connection changes
    this.panePaths.set([{ id: 1, path: [] }]);
    if (this.isSplitView()) {
        this.panePaths.update(p => [...p, { id: 2, path: [] }]);
    }

    try {
      const tree = await provider.getFolderTree();
      this.folderTree.set(tree);
    } catch (e) {
      console.error('Failed to load folder tree', e);
      // Optionally set an error state on the folderTree signal
    }
  }
  
  // --- Connection Handling ---
  toggleConnection(): void {
    if (this.connectionState() === 'remote') {
      this.disconnect();
    } else {
      this.openServerProfilesDialog();
    }
  }

  disconnect(): void {
    this.connectionState.set('local');
  }

  switchToRemote(): void {
    this.connectionState.set('remote');
    this.closeServerProfilesDialog();
  }

  // --- UI & Pane Management ---
  toggleSplitView(): void {
    this.isSplitView.update(isSplit => {
      if (isSplit) {
        // From split to single view
        this.panePaths.update(paths => paths.slice(0, 1));
        this.activePaneId.set(1);
        return false;
      } else {
        // From single to split view
        const currentPath = this.panePaths()[0]?.path ?? [];
        this.panePaths.update(paths => [...paths, { id: 2, path: currentPath }]);
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

  openServerProfilesDialog(): void {
    this.isServerProfilesDialogOpen.set(true);
  }

  closeServerProfilesDialog(): void {
    this.isServerProfilesDialogOpen.set(false);
  }
}