import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NoteDialogService {
  viewRequest = signal<{ contentSignal: WritableSignal<string>; title: string } | null>(null);

  open(contentSignal: WritableSignal<string>, title: string = 'Note'): void {
    this.viewRequest.set({ contentSignal, title });
  }

  close(): void {
    this.viewRequest.set(null);
  }
}
