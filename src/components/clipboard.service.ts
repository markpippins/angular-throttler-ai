import { Injectable, signal } from '@angular/core';
import { FileSystemNode } from '../models/file-system.model.js';
import { FileSystemProvider } from './file-system-provider.js';
import { DragDropPayload } from './drag-drop.service.js';

export interface ClipboardPayload {
  operation: 'cut' | 'copy';
  sourceProvider: FileSystemProvider;
  sourcePath: string[];
  items: FileSystemNode[];
}

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  clipboard = signal<DragDropPayload | null>(null);

  set(payload: DragDropPayload): void {
    if (payload.type !== 'filesystem') return;
    this.clipboard.set(payload);
  }

  get(): DragDropPayload | null {
    return this.clipboard();
  }

  clear(): void {
    this.clipboard.set(null);
  }
}
