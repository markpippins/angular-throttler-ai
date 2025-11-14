import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service.js';
import { Note } from '../models/note.model.js';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private dbService = inject(DbService);

  private getNoteInfoFromPath(path: string[]): { id: string; source: string; key: string } {
    const source = path[0] ?? 'Home';
    let key: string;
    if (path.length === 0) {
      key = '__HOME_NOTE__';
    } else {
      key = path.slice(1).join('/');
    }
    const id = `${source}::${key}`;
    return { id, source, key };
  }

  async getNote(path: string[]): Promise<Note | undefined> {
    console.log('getting note...');
    const { id } = this.getNoteInfoFromPath(path);
    const note = await this.dbService.getNote(id);
    if (note)
      console.log('note found in db');
    return note;
  }

  async saveNote(path: string[], content: string): Promise<void> {
    const { id, source, key } = this.getNoteInfoFromPath(path);
    const note: Note = { id, source, key, content };
    await this.dbService.saveNote(note);
  }

  async deleteNote(path: string[]): Promise<void> {
    const { id } = this.getNoteInfoFromPath(path);
    await this.dbService.deleteNote(id);
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
        const newPath = newPathPrefix.split('/');
        // We delete from DB directly and then use the service's saveNote to repopulate.
        // `saveNote` doesn't need to be async awaited inside the loop for performance.
        updates.push(this.dbService.deleteNote(note.id));
        updates.push(this.saveNote(newPath, note.content));
      } else if (notePath.startsWith(oldPathPrefix + '/')) {
        const subPath = notePath.substring(oldPathPrefix.length); // e.g., /subfolder
        const newFullPath = newPathPrefix + subPath;
        const newPath = newFullPath.split('/');
        updates.push(this.dbService.deleteNote(note.id));
        updates.push(this.saveNote(newPath, note.content));
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
