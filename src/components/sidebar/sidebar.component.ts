import { Component, ChangeDetectionStrategy, signal, inject, Renderer2, OnDestroy, input, output } from '@angular/core';
import { TabControlComponent } from '../tabs/tab-control.component.js';
import { TabComponent } from '../tabs/tab.component.js';
import { NewsfeedComponent } from '../newsfeed/newsfeed.component.js';
import { VerticalToolbarComponent } from '../vertical-toolbar/vertical-toolbar.component.js';
import { SearchComponent } from '../search/search.component.js';
import { FileSystemNode } from '../../models/file-system.model.js';
import { TreeViewComponent } from '../tree-view/tree-view.component.js';

@Component({
  selector: 'app-sidebar',
  template: `
<aside 
  class="relative h-full flex flex-col bg-[rgb(var(--color-surface-sidebar))] border-r border-[rgb(var(--color-border-base))] ease-in-out"
  [class.transition-all]="!isResizing()"
  [class.duration-300]="!isResizing()"
  [style.width.px]="isCollapsed() ? 64 : width()">

  @if (!isCollapsed()) {
    <!-- EXPANDED VIEW -->
    <div class="flex-1 overflow-hidden">
      <app-tab-control (collapseClick)="toggleCollapse()">
        <app-tab title="Explorer">
          @if(folderTree(); as tree) {
            <app-tree-view 
              [rootNode]="tree"
              [currentPath]="currentPath()"
              (pathChange)="onTreeViewPathChange($event)">
            </app-tree-view>
          } @else {
            <div class="p-4 text-center text-[rgb(var(--color-text-subtle))] text-sm">Loading tree...</div>
          }
        </app-tab>
        <app-tab title="News">
          <app-newsfeed></app-newsfeed>
        </app-tab>
        <app-tab title="Search">
          <app-search></app-search>
        </app-tab>
      </app-tab-control>
    </div>
    
    <!-- Resizer Handle -->
    <div 
      class="absolute top-0 right-0 h-full w-1.5 cursor-col-resize group z-10"
      (mousedown)="startResize($event)">
        <div class="w-0.5 h-full mx-auto bg-transparent group-hover:bg-[rgb(var(--color-accent-ring))]/50 transition-colors duration-200"></div>
    </div>
  } @else {
    <!-- COLLAPSED VIEW -->
    <app-vertical-toolbar (expandClick)="toggleCollapse()"></app-vertical-toolbar>
  }
</aside>
  `,
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