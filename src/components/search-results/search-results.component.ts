import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchResultNode, FileSystemNode } from '../../models/file-system.model.js';
import { ImageService } from '../../services/image.service.js';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full'
  }
})
export class SearchResultsComponent {
  results = input.required<SearchResultNode[]>();
  imageService = input.required<ImageService>();

  getIconUrl(item: FileSystemNode): string | null {
    return this.imageService().getIconUrl(item);
  }
}
