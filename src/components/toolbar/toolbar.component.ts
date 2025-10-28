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
  templateUrl: './toolbar.component.html',
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
  isCopyToOpen = signal(false);
  isMoveToOpen = signal(false);
  isHamburgerMenuOpen = signal(false);

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
  currentPath = input<string[]>([]);
  displayMode = input<'grid' | 'list'>('grid');
  filterQuery = input('');
  isSplitViewActive = input(false);
  isDetailPaneActive = input(false);

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
  displayModeChange = output<'grid' | 'list'>();
  filterChange = output<string>();
  splitViewClick = output<void>();
  detailPaneClick = output<void>();
  themeMenuClick = output<MouseEvent>();

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  toggleNewDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isNewDropdownOpen.update(v => !v);
  }

  toggleSortDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isSortDropdownOpen.update(v => !v);
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
  
  toggleHamburgerMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isHamburgerMenuOpen.update(v => !v);
  }
  
  onThemeMenuItemClick(event: MouseEvent): void {
    this.themeMenuClick.emit(event);
    this.isHamburgerMenuOpen.set(false);
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
      if (this.isCopyToOpen()) this.isCopyToOpen.set(false);
      if (this.isMoveToOpen()) this.isMoveToOpen.set(false);
      if (this.isHamburgerMenuOpen()) this.isHamburgerMenuOpen.set(false);
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

  onFilterInputChange(event: Event): void {
    this.filterChange.emit((event.target as HTMLInputElement).value);
  }
}
