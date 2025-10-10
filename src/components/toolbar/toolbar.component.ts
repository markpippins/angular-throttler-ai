import { Component, ChangeDetectionStrategy, output, signal, ElementRef, inject, viewChild, input } from '@angular/core';

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
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class ToolbarComponent {
  private elementRef = inject(ElementRef);
  isNewDropdownOpen = signal(false);
  isSortDropdownOpen = signal(false);

  // Inputs for button states
  canCut = input(false);
  canCopy = input(false);
  canPaste = input(false);
  canRename = input(false);
  canShare = input(false);
  canDelete = input(false);
  currentSort = input<SortCriteria>({ key: 'name', direction: 'asc' });

  // Outputs for events
  newFolderClick = output<void>();
  newFileClick = output<void>();
  filesUploaded = output<FileList>();
  cutClick = output<void>();
  copyClick = output<void>();
  pasteClick = output<void>();
  renameClick = output<void>();
  shareClick = output<void>();
  deleteClick = output<void>();
  sortChange = output<SortCriteria>();

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  toggleNewDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isNewDropdownOpen.update(v => !v);
  }

  toggleSortDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isSortDropdownOpen.update(v => !v);
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
      if (this.isNewDropdownOpen()) {
        this.isNewDropdownOpen.set(false);
      }
      if (this.isSortDropdownOpen()) {
        this.isSortDropdownOpen.set(false);
      }
    }
  }

  onUploadButtonClick(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.filesUploaded.emit(input.files);
      // Reset the input value to allow uploading the same file again
      input.value = '';
    }
  }

  onSort(key: SortKey, direction: SortDirection): void {
    this.sortChange.emit({ key, direction });
    this.isSortDropdownOpen.set(false);
  }
}