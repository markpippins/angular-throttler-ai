import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ServerProfile } from '../models/server-profile.model.js';

const DB_NAME = 'file-explorer-db';
const DB_VERSION = 1;
const PROFILES_STORE = 'server-profiles';

interface FileExplorerDB extends DBSchema {
  [PROFILES_STORE]: {
    key: string;
    value: ServerProfile;
  };
}

@Injectable({
  providedIn: 'root',
})
export class DbService {
  private dbPromise: Promise<IDBPDatabase<FileExplorerDB>>;

  constructor() {
    this.dbPromise = openDB<FileExplorerDB>(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase<FileExplorerDB>) {
        if (!db.objectStoreNames.contains(PROFILES_STORE)) {
          db.createObjectStore(PROFILES_STORE, { keyPath: 'id' });
        }
      },
    });
  }

  // --- Server Profile Methods ---

  async getAllProfiles(): Promise<ServerProfile[]> {
    const db = await this.dbPromise;
    return db.getAll(PROFILES_STORE);
  }

  async addProfile(profile: ServerProfile): Promise<void> {
    const db = await this.dbPromise;
    await db.add(PROFILES_STORE, profile);
  }
  
  async updateProfile(profile: ServerProfile): Promise<void> {
    const db = await this.dbPromise;
    await db.put(PROFILES_STORE, profile);
  }

  async deleteProfile(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(PROFILES_STORE, id);
  }
}
