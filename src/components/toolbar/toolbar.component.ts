import { Component, ChangeDetectionStrategy, output, signal, ElementRef, inject } from '@angular/core';

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
  isDropdownOpen = signal(false);

  newFolderClick = output<void>();
  newFileClick = output<void>();

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isDropdownOpen.update(v => !v);
  }

  onNewFolderItemClick(): void {
    this.newFolderClick.emit();
    this.isDropdownOpen.set(false);
  }
  
  onNewFileItemClick(): void {
    this.newFileClick.emit();
    this.isDropdownOpen.set(false);
  }

  onDocumentClick(event: Event): void {
    if (this.isDropdownOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }
}
