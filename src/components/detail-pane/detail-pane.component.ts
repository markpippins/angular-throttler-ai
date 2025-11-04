import { Component, ChangeDetectionStrategy, input, output, computed, signal, inject, Renderer2, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookmarkService } from '../../services/bookmark.service.js';
import { Bookmark } from '../../models/bookmark.model.js';
import { RssFeedComponent } from '../rss-feed/rss-feed.component.js';
import { WebviewService } from '../../services/webview.service.js';

@Component({
  selector: 'app-detail-pane',
  templateUrl: './detail-pane.component.html',
  imports: [CommonModule, RssFeedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPaneComponent implements OnDestroy {
  path = input.required<string[]>();
  isSavedItemsVisible = input(true);
  isRssFeedVisible = input(true);
  close = output<void>();

  private bookmarkService = inject(BookmarkService);
  private webviewService = inject(WebviewService);
  private renderer = inject(Renderer2);

  // --- Resizing State & Logic for pane width ---
  width = signal(320); // Default w-80 is 20rem = 320px
  isResizing = signal(false);
  private unlistenMouseMove: (() => void) | null = null;
  private unlistenMouseUp: (() => void) | null = null;
  
  // --- Vertical Resizing State for internal panes ---
  savedPaneHeight = signal(300); // Start with a reasonable pixel height
  isResizingVertical = signal(false);
  private unlistenVerticalMouseMove: (() => void) | null = null;
  private unlistenVerticalMouseUp: (() => void) | null = null;

  @ViewChild('contentContainer') contentContainerEl!: ElementRef<HTMLDivElement>;

  // --- Filtering State ---
  filterQuery = signal('');

  bookmarks = computed(() => {
    const currentPathString = this.path().join('/');
    const query = this.filterQuery().toLowerCase();
    
    // Show bookmarks from the current folder and all sub-folders.
    const allRelevantBookmarks = this.bookmarkService.allBookmarks().filter(b => 
        b.path.startsWith(currentPathString)
    );

    if (!query) {
        return allRelevantBookmarks;
    }

    return allRelevantBookmarks.filter(b => 
        b.title.toLowerCase().includes(query) || 
        (b.snippet && b.snippet.toLowerCase().includes(query))
    );
  });
  
  deleteBookmark(bookmarkId: string): void {
    this.bookmarkService.deleteBookmark(bookmarkId);
  }

  openBookmark(bookmark: Bookmark): void {
    this.webviewService.open(bookmark.link, bookmark.title);
  }

  onFilterChange(event: Event): void {
    this.filterQuery.set((event.target as HTMLInputElement).value);
  }

  ngOnDestroy(): void {
    this.stopResize();
    this.stopVerticalResize();
  }

  startResize(event: MouseEvent): void {
    this.isResizing.set(true);
    const startX = event.clientX;
    const startWidth = this.width();

    // Prevent text selection while dragging
    event.preventDefault();

    this.unlistenMouseMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
      const dx = e.clientX - startX;
      // Since we are dragging the left handle, moving left (negative dx) increases width
      let newWidth = startWidth - dx;
      
      // Add constraints for min/max width
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 600) newWidth = 600;
      
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

  // --- Vertical resize methods ---
  startVerticalResize(event: MouseEvent): void {
    this.isResizingVertical.set(true);
    const container = this.contentContainerEl.nativeElement;
    const containerRect = container.getBoundingClientRect();
    const startY = event.clientY;
    const startHeight = this.savedPaneHeight();

    event.preventDefault();

    this.unlistenVerticalMouseMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
      const dy = e.clientY - startY;
      let newHeight = startHeight + dy;
      
      const minHeight = 100;
      const maxHeight = containerRect.height - 100; // Leave 100px for the bottom pane
      if (newHeight < minHeight) newHeight = minHeight;
      if (newHeight > maxHeight) newHeight = maxHeight;
      
      this.savedPaneHeight.set(newHeight);
    });

    this.unlistenVerticalMouseUp = this.renderer.listen('document', 'mouseup', () => {
      this.stopVerticalResize();
    });
  }

  private stopVerticalResize(): void {
    if (!this.isResizingVertical()) return;
    this.isResizingVertical.set(false);
    if (this.unlistenVerticalMouseMove) {
      this.unlistenVerticalMouseMove();
      this.unlistenVerticalMouseMove = null;
    }
    if (this.unlistenVerticalMouseUp) {
      this.unlistenVerticalMouseUp();
      this.unlistenVerticalMouseUp = null;
    }
  }
}