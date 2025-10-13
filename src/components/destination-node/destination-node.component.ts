import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSystemNode } from '../../models/file-system.model';

@Component({
  selector: 'app-destination-node',
  imports: [CommonModule, DestinationNodeComponent], // Recursive import
  templateUrl: './destination-node.component.html',
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
