import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerProfile } from '../../models/server-profile.model.js';

@Component({
  selector: 'app-reconnection-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reconnection-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown.escape)': 'onCancel()',
  },
})
export class ReconnectionDialogComponent {
  profile = input.required<ServerProfile>();
  status = input<'connecting' | 'failed' | 'idle'>('idle');

  reconnect = output<{ username: string, password: string }>();
  cancel = output<void>();

  username = signal('');
  password = signal('');

  onUsernameChange(event: Event): void {
    this.username.set((event.target as HTMLInputElement).value);
  }

  onPasswordChange(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value);
  }

  onSubmit(): void {
    if (this.username().trim() && this.password().trim()) {
      this.reconnect.emit({ username: this.username(), password: this.password() });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
