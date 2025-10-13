import { Component, ChangeDetectionStrategy, output, signal, ElementRef, inject, viewChild, input } from '@angular/core';
import { DestinationNodeComponent } from '../destination-node/destination-node.component.js';
import { FileSystemNode } from '../../models/file-system.model.js';

export type SortKey = 'name' | 'modified';
export type SortDirection = 'asc' | 'desc';
export interface SortCriteria {
  key: SortKey;
  direction: SortDirection;
}

@Component({
  selector: 'app-toolbar',
  template: `
<div class="flex items-center px-4 h-12 border-b border-[rgb(var(--color-border-base))] bg-[rgb(var(--color-surface-muted))]">
  @if (!isSearchView()) {
    <!-- Default View -->
    <div class="flex items-center space-x-2">
      <!-- New Item Dropdown -->
      <div class="relative inline-block text-left">
        <button (click)="toggleNewDropdown($event)" type="button" title="New" class="p-2 rounded-md hover:bg-[rgb(var(--color-surface-hover))]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[rgb(var(--color-text-muted))]" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
        </button>
        
        @if(isNewDropdownOpen()) {
          <div class="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-[rgb(var(--color-surface-dialog))] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu">
            <div class="py-1" role="none">
              <div (click)="onNewFolderItemClick()" class="text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-hover))] flex items-center px-4 py-2 text-sm cursor-pointer" role="menuitem">
                <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <span>New folder</span>
              </div>
              <div (click)="onNewFileItemClick()" class="text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-hover))] flex items-center px-4 py-2 text-sm cursor-pointer" role="menuitem">
                 <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 text-[rgb(var(--color-text-subtle))]" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 1h8a1 1 0 011 1v10a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                <span>New file</span>
              </div>
            </div>
          </div>
        }
      </div>
      
      <!-- Divider -->
      <div class="h-6 w-px bg-[rgb(var(--color-border-muted))]"></div>

      <!-- Action Buttons -->
      <button (click)="cutClick.emit()" [disabled]="!canCut()" title="Cut" class="p-2 rounded-md hover:bg-[rgb(var(--color-surface-hover))] disabled:opacity-50 disabled:cursor-not-allowed">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[rgb(var(--color-text-muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h4M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7h8m-5 5h2m-5 3h6" />
        </svg>
      </button>
      <button (click)="copyClick.emit()" [disabled]="!canCopy()" title="Copy" class="p-2 rounded-md hover:bg-[rgb(var(--color-surface-hover))] disabled:opacity-50 disabled:cursor-not-allowed">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[rgb(var(--color-text-muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      <button (click)="pasteClick.emit()" [disabled]="!canPaste()" title="Paste" class="p-2 rounded-md hover:bg-[rgb(var(--color-surface-hover))] disabled:opacity-50 disabled:cursor-not-allowed">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[rgb(var(--color-text-muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </button>
      <button (click)="renameClick.emit()" [disabled]="!canRename()" title="Rename" class="p-2 rounded-md hover:bg-[rgb(var(--color-surface-hover))] disabled:opacity-50 disabled:cursor-not-allowed">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[rgb(var(--color-text-muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button (click)="shareClick.emit()" [disabled]="!canShare()" title="Share" class="p-2 rounded-md hover:bg-[rgb(var(--color-surface-hover))] disabled:opacity-50 disabled:cursor-not-allowed">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[rgb(var(--color-text-muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      </button>
      <button (click)="deleteClick.emit()" [disabled]="!canDelete()" title="Delete" class="p-2 rounded-md hover:bg-[rgb(var(--color-danger-bg-hover))] disabled:opacity-50 disabled:cursor-not-allowed">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[rgb(var(--color-danger-text))]/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      <div class="h-6 w-px bg-[rgb(var(--color-border-muted))]"></div>

      <!-- Copy to / Move to -->
      <div class="relative inline-block text-left">
        <button (click)="toggleCopyToDropdown($event)" [disabled]="!canCopyToMoveTo()" type="button" title="Copy to..." class="px-3 py-1.5 text-sm rounded-md hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-muted))] disabled:opacity-50 disabled:cursor-not-allowed">Copy to</button>
        @if(isCopyToOpen()) {
          <div class="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-[rgb(var(--color-surface-dialog))] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div class="py-1">
              @if (folderTree(); as tree) {
                @for (child of tree.children; track child.name) {
                  @if (child.type === 'folder') {
                    <app-destination-node [node]="child" [path]="[child.name]" (destinationSelected)="onDestinationSelectedForCopy($event)"></app-destination-node>
                  }
                }
              }
            </div>
          </div>
        }
      </div>
      <div class="relative inline-block text-left">
        <button (click)="toggleMoveToDropdown($event)" [disabled]="!canCopyToMoveTo()" type="button" title="Move to..." class="px-3 py-1.5 text-sm rounded-md hover:bg-[rgb(var(--color-surface-hover))] text-[rgb(var(--color-text-muted))] disabled:opacity-50 disabled:cursor-not-allowed">Move to</button>
         @if(isMoveToOpen()) {
          <div class="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-[rgb(var(--color-surface-dialog))] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div class="py-1">
              @if (folderTree(); as tree) {
                @for (child of tree.children; track child.name) {
                  @if (child.type === 'folder') {
                    <app-destination-node [node]="child" [path]="[child.name]" (destinationSelected)="onDestinationSelectedForMove($event)"></app-destination-node>
                  }
                }
              }
            </div>
          </div>
        }
      </div>

      <div class="h-6 w-px bg-[rgb(var(--color-border-muted))]"></div>
      <button (click)="searchClick.emit()" title="Search" class="p-2 rounded-md hover:bg-[rgb(var(--color-surface-hover))]">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[rgb(var(--color-text-muted))]" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  } @else {
    <!-- Search View -->
    <div class="flex items-center space-x-2">
       <div class="h-6 w-px bg-[rgb(var(--color-border-muted))]"></div>
       <div class="relative inline-block text-left">
        <button (click)="toggleSearchOptionsDropdown($event)" type="button" title="Search Options" class="p-2 rounded-md hover:bg-[rgb(var(--color-surface-hover))]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[rgb(var(--color-text-muted))]" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0L7.86 5.89c-.53.22-1.02.51-1.45.87l-2.47-.94c-1.49-.57-3.02.46-2.73 2.01l.74 3.96c.07.36.07.75 0 1.11l-.74 3.96c-.29 1.55 1.24 2.58 2.73 2.01l2.47-.94c.43.36.92.65 1.45.87l.65 2.72c.38 1.56 2.6 1.56 2.98 0l.65-2.72c.53-.22 1.02-.51 1.45-.87l2.47.94c1.49.57 3.02-.46 2.73-2.01l-.74-3.96c-.07-.36-.07-.75 0-1.11l.74-3.96c.29-1.55-1.24-2.58-2.73-2.01l-2.47.94c-.43-.36-.92-.65-1.45-.87l-.65-2.72zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
            </svg>
        </button>
        @if(isSearchOptionsDropdownOpen()) {
            <div class="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-[rgb(var(--color-surface-dialog))] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div class="py-1">
                    <div class="px-4 py-2 text-sm text-[rgb(var(--color-text-subtle))]">Options not available.</div>
                </div>
            </div>
        }
       </div>
       <button (click)="closeSearchClick.emit()" title="Close Search" class="p-2 rounded-md hover:bg-[rgb(var(--color-surface-hover))]">
         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[rgb(var(--color-text-muted))]" viewBox="0 0 20 20" fill="currentColor">
           <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
         </svg>
       </button>
    </div>
  }

  <!-- Spacer -->
  <div class="flex-grow"></div>

  <!-- Right Side Group -->
  <div class="flex items-center space-x-2">
    <!-- Sort Dropdown -->
    <div class="relative inline-block text-left">
      <button (click)="toggleSortDropdown($event)" type="button" title="Sort" class="p-2 rounded-md hover:bg-[rgb(var(--color-surface-hover))]">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[rgb(var(--color-text-muted))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h13M3 8h9M3 12h9m-9 4h9m5-4v.01M18 8v.01M18 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      @if(isSortDropdownOpen()) {
        <div class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-[rgb(var(--color-surface-dialog))] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu">
          <div class="py-1" role="none">
            @let current = currentSort();
            <div (click)="onSort('name', 'asc')" class="text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-hover))] flex items-center px-4 py-2 text-sm cursor-pointer" role="menuitem">
              <span class="w-5">
                @if(current.key === 'name' && current.direction === 'asc') { <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg> }
              </span>
              <span>Name (A-Z)</span>
            </div>
            <div (click)="onSort('name', 'desc')" class="text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-hover))] flex items-center px-4 py-2 text-sm cursor-pointer" role="menuitem">
              <span class="w-5">
                @if(current.key === 'name' && current.direction === 'desc') { <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg> }
              </span>
              <span>Name (Z-A)</span>
            </div>
            <div (click)="onSort('modified', 'asc')" class="text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-hover))] flex items-center px-4 py-2 text-sm cursor-pointer" role="menuitem">
              <span class="w-5">
                @if(current.key === 'modified' && current.direction === 'asc') { <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg> }
              </span>
              <span>Date (Newest)</span>
            </div>
            <div (click)="onSort('modified', 'desc')" class="text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-hover))] flex items-center px-4 py-2 text-sm cursor-pointer" role="menuitem">
              <span class="w-5">
                @if(current.key === 'modified' && current.direction === 'desc') { <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg> }
              </span>
              <span>Date (Oldest)</span>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Upload Button -->
    @if (!isSearchView()) {
      <button (click)="onUploadButtonClick()" type="button" title="Upload" class="p-2 rounded-md hover:bg-[rgb(var(--color-surface-hover))]">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[rgb(var(--color-text-muted))]" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L9 9.414V13H5.5z" />
          <path d="M9 13h2v5a1 1 0 11-2 0v-5z" />
        </svg>
      </button>
      <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)" multiple />
    }
  </div>
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DestinationNodeComponent],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class ToolbarComponent {
  private elementRef = inject(ElementRef);
  isNewDropdownOpen = signal(false);
  isSortDropdownOpen = signal(false);
  isSearchOptionsDropdownOpen = signal(false);
  isCopyToOpen = signal(false);
  isMoveToOpen = signal(false);

  // Inputs for button states
  canCut = input(false);
  canCopy = input(false);
  canCopyToMoveTo = input(false);
  canPaste = input(false);
  canRename = input(false);
  canShare = input(false);
  canDelete = input(false);
  currentSort = input<SortCriteria>({ key: 'name', direction: 'asc' });
  folderTree = input<FileSystemNode | null>(null);
  isSearchView = input(false);

  // Outputs for events
  newFolderClick = output<void>();
  newFileClick = output<void>();
  filesUploaded = output<FileList>();
  cutClick = output<void>();
  copyClick = output<void>();
  copyItemsTo = output<string[]>();
  moveItemsTo = output<string[]>();
  pasteClick = output<void>();
  renameClick = output<void>();
  shareClick = output<void>();
  deleteClick = output<void>();
  sortChange = output<SortCriteria>();
  searchClick = output<void>();
  closeSearchClick = output<void>();

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  toggleNewDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isNewDropdownOpen.update(v => !v);
  }

  toggleSortDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isSortDropdownOpen.update(v => !v);
  }
  
  toggleSearchOptionsDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isSearchOptionsDropdownOpen.update(v => !v);
  }
  
  toggleCopyToDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isMoveToOpen.set(false);
    this.isCopyToOpen.update(v => !v);
  }

  toggleMoveToDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isCopyToOpen.set(false);
    this.isMoveToOpen.update(v => !v);
  }

  onNewFolderItemClick(): void {
    this.newFolderClick.emit();
    this.isNewDropdownOpen.set(false);
  }
  
  onNewFileItemClick(): void {
    this.newFileClick.emit();
    this.isNewDropdownOpen.set(false);
  }

  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isNewDropdownOpen()) this.isNewDropdownOpen.set(false);
      if (this.isSortDropdownOpen()) this.isSortDropdownOpen.set(false);
      if (this.isSearchOptionsDropdownOpen()) this.isSearchOptionsDropdownOpen.set(false);
      if (this.isCopyToOpen()) this.isCopyToOpen.set(false);
      if (this.isMoveToOpen()) this.isMoveToOpen.set(false);
    }
  }

  onUploadButtonClick(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.filesUploaded.emit(input.files);
      input.value = '';
    }
  }

  onSort(key: SortKey, direction: SortDirection): void {
    this.sortChange.emit({ key, direction });
    this.isSortDropdownOpen.set(false);
  }
  
  onDestinationSelectedForCopy(path: string[]): void {
    this.copyItemsTo.emit(path);
    this.isCopyToOpen.set(false);
  }
  
  onDestinationSelectedForMove(path: string[]): void {
    this.moveItemsTo.emit(path);
    this.isMoveToOpen.set(false);
  }
}