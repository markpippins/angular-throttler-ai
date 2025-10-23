import { Component, ChangeDetectionStrategy, output } from '@angular/core';

@Component({
  selector: 'app-vertical-toolbar',
  templateUrl: './vertical-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerticalToolbarComponent {
  expandClick = output<void>();

  onExpandClick(): void {
    this.expandClick.emit();
  }
}
