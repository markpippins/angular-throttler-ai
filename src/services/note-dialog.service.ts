import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NoteDialogService {
  viewRequest = signal<{ html: string; title: string } | null>(null);

  open(html: string, title: string = 'Note Preview'): void {
    this.viewRequest.set({ html, title });
  }

  close(): void {
    this.viewRequest.set(null);
  }
}
