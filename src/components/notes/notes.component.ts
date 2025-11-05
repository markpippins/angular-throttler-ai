import { Component, ChangeDetectionStrategy, signal, computed, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteDialogService } from '../../services/note-dialog.service.js';

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
  private noteDialogService = inject(NoteDialogService);
  
  noteContent = signal<string>('# My Notes\n\n- Start typing here...\n- Use **Markdown** for formatting.');
  mode = signal<'edit' | 'preview'>('edit');

  @ViewChild('editor') editorTextarea: ElementRef<HTMLTextAreaElement> | undefined;

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

  openInDialog(): void {
    const firstLine = this.noteContent().split('\n')[0].replace(/^#+\s*/, '').trim();
    const title = firstLine || 'Note';
    this.noteDialogService.open(this.noteContent, title);
  }

  applyMarkdown(prefix: string, suffix: string = prefix, placeholder: string = 'text'): void {
    const textarea = this.editorTextarea?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end);

    let replacement = '';
    let selectionStartOffset = prefix.length;
    let selectionEndOffset = prefix.length;

    if (selectedText) {
      replacement = prefix + selectedText + suffix;
      selectionEndOffset += selectedText.length;
    } else {
      replacement = prefix + placeholder + suffix;
      selectionEndOffset += placeholder.length;
    }

    const newText = currentText.substring(0, start) + replacement + currentText.substring(end);
    this.noteContent.set(newText);
    
    // After render, focus and select the text
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + selectionStartOffset, start + selectionEndOffset);
    }, 0);
  }

  addLink(): void {
    const url = prompt('Enter URL:');
    if (url) {
      this.applyMarkdown('[', `](${url})`, 'link text');
    }
  }

  applyCode(): void {
    const textarea = this.editorTextarea?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (selectedText.includes('\n')) {
      // Block code
      this.applyMarkdown('```\n', '\n```', 'code');
    } else {
      // Inline code
      this.applyMarkdown('`', '`', 'code');
    }
  }
}
