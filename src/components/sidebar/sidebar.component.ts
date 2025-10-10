import { Component, ChangeDetectionStrategy, signal, inject, Renderer2, OnDestroy, input, output } from '@angular/core';
import { TabControlComponent } from '../tabs/tab-control.component';
import { TabComponent } from '../tabs/tab.component';
import { NewsfeedComponent } from '../newsfeed/newsfeed.component';
import { VerticalToolbarComponent } from '../vertical-toolbar/vertical-toolbar.component';
import { SearchComponent } from '../search/search.component';
import { FileSystemNode } from '../../models/file-system.model';
import { TreeViewComponent } from '../tree-view/tree-view.component';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  imports: [TabControlComponent, TabComponent, NewsfeedComponent, VerticalToolbarComponent, SearchComponent, TreeViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnDestroy {
  folderTree = input<FileSystemNode | null>(null);
  currentPath = input<string[]>([]);
  pathChange = output<string[]>();

  isCollapsed = signal(false);
  width = signal(288); // Default width is 288px (w-72)
  isResizing = signal(false);

  private preCollapseWidth = 288;
  private renderer = inject(Renderer2);
  
  private unlistenMouseMove: (() => void) | null = null;
  private unlistenMouseUp: (() => void) | null = null;

  toggleCollapse(): void {
    const collapsing = !this.isCollapsed();
    if (collapsing) {
      this.preCollapseWidth = this.width();
    }
    this.isCollapsed.set(collapsing);
    if (!collapsing) { // on expand
      this.width.set(this.preCollapseWidth);
    }
  }
  
  startResize(event: MouseEvent): void {
    if (this.isCollapsed()) return;

    this.isResizing.set(true);
    const startX = event.clientX;
    const startWidth = this.width();

    // Prevent text selection while dragging
    event.preventDefault();

    this.unlistenMouseMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
      if (!this.isResizing()) {
        return;
      }
      const dx = e.clientX - startX;
      let newWidth = startWidth + dx;
      
      // Add constraints for min/max width
      if (newWidth < 150) newWidth = 150;
      if (newWidth > 500) newWidth = 500;
      
      this.width.set(newWidth);
    });

    this.unlistenMouseUp = this.renderer.listen('document', 'mouseup', () => {
      this.stopResize();
    });
  }

  private stopResize(): void {
    if (!this.isResizing()) return;
    this.isResizing.set(false);
    if (this.unlistenMouseMove) {
      this.unlistenMouseMove();
      this.unlistenMouseMove = null;
    }
    if (this.unlistenMouseUp) {
      this.unlistenMouseUp();
      this.unlistenMouseUp = null;
    }
  }

  onTreeViewPathChange(path: string[]): void {
    this.pathChange.emit(path);
  }

  ngOnDestroy(): void {
    this.stopResize();
  }
}
