import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown.escape)': 'onCancel()',
  },
})
export class ConfirmDialogComponent {
  title = input.required<string>();
  message = input.required<string>();
  confirmButtonText = input('OK');
  
  confirm = output<void>();
  close = output<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.close.emit();
  }
}