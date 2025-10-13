import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model';

@Component({
  selector: 'app-destination-node',
  imports: [CommonModule, DestinationNodeComponent], // Recursive import
  template: `
<div 
  class="relative flex items-center justify-between text-sm px-3 py-1.5 hover:bg-[rgb(var(--color-surface-hover))] cursor-pointer text-[rgb(var(--color-text-muted))]"
  (click)="selectDestination()"
  (mouseenter)="isSubmenuOpen.set(true)"
  (mouseleave)="isSubmenuOpen.set(false)">
  
  <span class="truncate">{{ node().name }}</span>

  @if(hasFolderChildren()) {
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 text-[rgb(var(--color-text-subtle))]" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
    </svg>
  }

  @if (isSubmenuOpen() && hasFolderChildren()) {
    <div class="absolute left-full top-0 -mt-1 w-48 bg-[rgb(var(--color-surface-dialog))] border border-[rgb(var(--color-border-base))] rounded-md shadow-lg py-1 z-10">
      @for (child of folderChildren(); track child.name) {
        <app-destination-node
          [node]="child"
          [path]="getChildPath(child)"
          (destinationSelected)="onChildSelected($event)">
        </app-destination-node>
      }
    </div>
  }
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DestinationNodeComponent {
  node = input.required<FileSystemNode>();
  path = input.required<string[]>();
  destinationSelected = output<string[]>();

  isSubmenuOpen = signal(false);

  // Computed properties to simplify the template
  folderChildren = computed(() => {
    const children = this.node().children;
    return children ? children.filter(c => c.type === 'folder') : [];
  });

  hasFolderChildren = computed(() => {
    return this.folderChildren().length > 0;
  });

  selectDestination(): void {
    if (this.node().type === 'folder') {
      this.destinationSelected.emit(this.path());
    }
  }

  onChildSelected(path: string[]): void {
    this.destinationSelected.emit(path);
  }

  getChildPath(childNode: FileSystemNode): string[] {
    return [...this.path(), childNode.name];
  }
}
