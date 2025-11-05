import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

// Declare the globals from the CDN scripts
declare var marked: { parse(markdown: string): string; };
declare var DOMPurify: { sanitize(dirty: string): string; };

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesComponent {
  noteContent = signal<string>('# My Notes\n\n- Start typing here...\n- Use **Markdown** for formatting.');
  mode = signal<'edit' | 'preview'>('edit');

  renderedHtml = computed(() => {
    if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
        const rawHtml = marked.parse(this.noteContent());
        return DOMPurify.sanitize(rawHtml);
    }
    // Provide a graceful fallback if the libraries fail to load
    return '<p>Error: Markdown parsing libraries not loaded.</p>';
  });

  onInput(event: Event): void {
    this.noteContent.set((event.target as HTMLTextAreaElement).value);
  }
}
