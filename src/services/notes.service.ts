import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service.js';
import { Note } from '../models/note.model.js';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private dbService = inject(DbService);

  private getNoteId(source: string, key: string): string {
    return `${source}::${key}`;
  }

  getNote(source: string, key: string): Promise<Note | undefined> {
    const id = this.getNoteId(source, key);
    return this.dbService.getNote(id);
  }

  saveNote(source: string, key: string, content: string): Promise<void> {
    const id = this.getNoteId(source, key);
    const note: Note = { id, source, key, content };
    return this.dbService.saveNote(note);
  }

  deleteNote(source: string, key: string): Promise<void> {
    const id = this.getNoteId(source, key);
    return this.dbService.deleteNote(id);
  }

  getAllNotes(): Promise<Note[]> {
    return this.dbService.getAllNotes();
  }

  private getNoteFullPath(note: Note): string {
    if (note.source === 'Home' && note.key === '__HOME_NOTE__') {
      return ''; // Root path
    }
    // Reconstruct the full path string used by FolderPropertiesService
    return [note.source, note.key].filter(Boolean).join('/');
  }

  async renameNotesForPrefix(oldPathPrefix: string, newPathPrefix: string): Promise<void> {
    if (oldPathPrefix === newPathPrefix) return;
    
    const allNotes = await this.getAllNotes();
    const updates: Promise<any>[] = [];

    for (const note of allNotes) {
      const notePath = this.getNoteFullPath(note);

      if (notePath === oldPathPrefix) {
        const [newSource, ...newKeyParts] = newPathPrefix.split('/');
        const newKey = newKeyParts.join('/');
        updates.push(this.dbService.deleteNote(note.id));
        updates.push(this.saveNote(newSource || 'Home', newKey, note.content));
      } else if (notePath.startsWith(oldPathPrefix + '/')) {
        const subPath = notePath.substring(oldPathPrefix.length); // e.g., /subfolder
        const newFullPath = newPathPrefix + subPath;
        const [newSource, ...newKeyParts] = newFullPath.split('/');
        const newKey = newKeyParts.join('/');
        updates.push(this.dbService.deleteNote(note.id));
        updates.push(this.saveNote(newSource || 'Home', newKey, note.content));
      }
    }
    await Promise.all(updates);
  }

  async deleteNotesForPrefix(pathPrefix: string): Promise<void> {
    const allNotes = await this.getAllNotes();
    const deletes: Promise<any>[] = [];
    for (const note of allNotes) {
      const notePath = this.getNoteFullPath(note);
      if (notePath === pathPrefix || notePath.startsWith(pathPrefix + '/')) {
        deletes.push(this.dbService.deleteNote(note.id));
      }
    }
    await Promise.all(deletes);
  }
}
