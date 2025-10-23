import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-search-dialog',
  templateUrl: './search-dialog.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDialogComponent {
  close = output<void>();
  search = output<string>();

  query = signal('');

  onQueryChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
  }

  submitSearch(): void {
    if (this.query().trim()) {
      this.search.emit(this.query().trim());
    }
  }
}
