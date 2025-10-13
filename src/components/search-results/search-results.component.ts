import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchResultNode, FileSystemNode } from '../../models/file-system.model.js';
import { ImageService } from '../../services/image.service.js';

@Component({
  selector: 'app-search-results',
  template: `
<div class="h-full w-full overflow-auto text-sm text-[rgb(var(--color-text-base))]">
  @if (results().length > 0) {
    <table class="min-w-full divide-y divide-[rgb(var(--color-border-base))]">
      <thead class="bg-[rgb(var(--color-surface-muted))] sticky top-0">
        <tr>
          <th scope="col" class="w-12 px-4 py-2 text-left text-xs font-medium text-[rgb(var(--color-text-muted))] uppercase tracking-wider"></th>
          <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-[rgb(var(--color-text-muted))] uppercase tracking-wider">Name</th>
          <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-[rgb(var(--color-text-muted))] uppercase tracking-wider">Path</th>
          <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-[rgb(var(--color-text-muted))] uppercase tracking-wider">Date Modified</th>
        </tr>
      </thead>
      <tbody class="bg-[rgb(var(--color-surface))] divide-y divide-[rgb(var(--color-border-base))]">
        @for (item of results(); track $index) {
          <tr class="hover:bg-[rgb(var(--color-surface-hover-subtle))]">
            <td class="px-4 py-1.5 whitespace-nowrap">
              @let iconUrl = getIconUrl(item);
              @if (iconUrl) {
                <img [src]="iconUrl" [alt]="item.type" class="h-5 w-5 object-contain">
              }
            </td>
            <td class="px-4 py-1.5 whitespace-nowrap font-medium">{{ item.name }}</td>
            <td class="px-4 py-1.5 whitespace-nowrap text-[rgb(var(--color-text-subtle))]">{{ item.path.join('/') || '/' }}</td>
            <td class="px-4 py-1.5 whitespace-nowrap text-[rgb(var(--color-text-subtle))]">{{ item.modified }}</td>
          </tr>
        }
      </tbody>
    </table>
  } @else {
    <div class="h-full flex flex-col items-center justify-center text-center text-[rgb(var(--color-text-subtle))] p-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <p class="mt-2 font-semibold">No results found</p>
      <p>Try adjusting your search.</p>
    </div>
  }
</div>
  `,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsComponent {
  results = input.required<SearchResultNode[]>();
  imageService = input.required<ImageService>();

  getIconUrl(item: FileSystemNode): string | null {
    return this.imageService().getIconUrl(item);
  }
}