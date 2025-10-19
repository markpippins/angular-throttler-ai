import { Component, ChangeDetectionStrategy, input, output, signal, viewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDialogComponent implements OnInit, AfterViewInit {
  title = input.required<string>();
  message = input.required<string>();
  initialValue = input('');

  submitValue = output<string>();
  close = output<void>();

  inputValue = signal('');

  // FIX: Replaced the @viewChild decorator with the modern `viewChild` signal-based query function.
  inputField = viewChild<ElementRef<HTMLInputElement>>('inputField');

  ngOnInit() {
    this.inputValue.set(this.initialValue());
  }

  ngAfterViewInit(): void {
    // Automatically focus the input field and select its content for a better UX.
    // A small timeout is necessary to ensure the element is visible.
    setTimeout(() => {
        // FIX: Access the view child result, which is a signal, by calling it as a function.
        const inputEl = this.inputField();
        if (inputEl) {
            inputEl.nativeElement.focus();
            inputEl.nativeElement.select();
        }
    }, 50);
  }

  onInputChange(event: Event): void {
    this.inputValue.set((event.target as HTMLInputElement).value);
  }

  onSubmit(): void {
    if (this.inputValue().trim()) {
      this.submitValue.emit(this.inputValue().trim());
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}
