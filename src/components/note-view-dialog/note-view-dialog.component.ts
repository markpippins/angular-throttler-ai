import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-note-view-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './note-view-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteViewDialogComponent {
  htmlContent = input.required<string>();
  title = input.required<string>();
  close = output<void>();
}
