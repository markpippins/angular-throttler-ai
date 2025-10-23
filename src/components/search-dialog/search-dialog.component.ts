import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SearchEngines {
  files: boolean;
  web: boolean;
  image: boolean;
  gemini: boolean;
  youtube: boolean;
  academic: boolean;
}

@Component({
  selector: 'app-search-dialog',
  templateUrl: './search-dialog.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDialogComponent {
  close = output<void>();
  search = output<{ query: string; engines: SearchEngines }>();

  query = signal('');
  selectedEngines = signal<SearchEngines>({
    files: true,
    web: false,
    image: false,
    gemini: false,
    youtube: false,
    academic: false,
  });

  get isAnyEngineSelected(): boolean {
    const engines = this.selectedEngines();
    return Object.values(engines).some(v => v);
  }

  onQueryChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
  }

  onEngineChange(engine: keyof SearchEngines, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedEngines.update(engines => ({
      ...engines,
      [engine]: isChecked,
    }));
  }

  submitSearch(): void {
    if (this.query().trim() && this.isAnyEngineSelected) {
      this.search.emit({ query: this.query().trim(), engines: this.selectedEngines() });
    }
  }
}
