import { Component, ChangeDetectionStrategy, output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocalConfig, LocalConfigService } from '../../services/local-config.service.js';

@Component({
  selector: 'app-local-config-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './local-config-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalConfigDialogComponent implements OnInit {
  private localConfigService = inject(LocalConfigService);
  
  close = output<void>();
  save = output<LocalConfig>();

  formState = signal<LocalConfig>({ sessionName: '', defaultImageUrl: '' });

  ngOnInit(): void {
    this.formState.set(this.localConfigService.currentConfig());
  }

  onValueChange(event: Event, field: keyof LocalConfig): void {
    const value = (event.target as HTMLInputElement).value;
    this.formState.update(state => ({ ...state, [field]: value }));
  }

  onSave(): void {
    this.save.emit(this.formState());
  }
}
