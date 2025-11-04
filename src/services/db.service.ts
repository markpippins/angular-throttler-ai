import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ServerProfile } from '../models/server-profile.model.js';
import { RssFeed } from '../models/rss-feed.model.js';
import { FolderProperties } from '../models/folder-properties.model.js';

const DB_NAME = 'file-explorer-db';
const DB_VERSION = 3;
const PROFILES_STORE = 'server-profiles';
const FEEDS_STORE = 'rss-feeds';
const FOLDER_PROPERTIES_STORE = 'folder-properties';

interface FileExplorerDB extends DBSchema {
  [PROFILES_STORE]: {
    key: string;
    value: ServerProfile;
  };
  [FEEDS_STORE]: {
    key: string;
    value: RssFeed;
  };
  [FOLDER_PROPERTIES_STORE]: {
    key: string;
    value: FolderProperties;
    indexes: { 'by-path': string };
  };
}

@Injectable({
  providedIn: 'root',
})
export class DbService {
  private dbPromise: Promise<IDBPDatabase<FileExplorerDB>>;

  constructor() {
    this.dbPromise = openDB<FileExplorerDB>(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase<FileExplorerDB>, oldVersion) {
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains(PROFILES_STORE)) {
            db.createObjectStore(PROFILES_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(FEEDS_STORE)) {
            db.createObjectStore(FEEDS_STORE, { keyPath: 'id' });
          }
        }
        if (oldVersion < 3) {
           if (!db.objectStoreNames.contains(FOLDER_PROPERTIES_STORE)) {
            db.createObjectStore(FOLDER_PROPERTIES_STORE, { keyPath: 'path' });
          }
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
    await db.put(PROFILES_STORE, profile);
  }
  
  async updateProfile(profile: ServerProfile): Promise<void> {
    const db = await this.dbPromise;
    await db.put(PROFILES_STORE, profile);
  }

  async deleteProfile(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(PROFILES_STORE, id);
  }

  // --- RSS Feed Methods ---

  async getAllFeeds(): Promise<RssFeed[]> {
    const db = await this.dbPromise;
    return db.getAll(FEEDS_STORE);
  }

  async addFeed(feed: RssFeed): Promise<void> {
    const db = await this.dbPromise;
    await db.put(FEEDS_STORE, feed);
  }
  
  async updateFeed(feed: RssFeed): Promise<void> {
    const db = await this.dbPromise;
    await db.put(FEEDS_STORE, feed);
  }

  async deleteFeed(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(FEEDS_STORE, id);
  }
  
  // --- Folder Properties Methods ---

  async getAllFolderProperties(): Promise<FolderProperties[]> {
    const db = await this.dbPromise;
    return db.getAll(FOLDER_PROPERTIES_STORE);
  }

  async updateFolderProperties(properties: FolderProperties): Promise<void> {
    const db = await this.dbPromise;
    await db.put(FOLDER_PROPERTIES_STORE, properties);
  }

  async deleteFolderProperties(path: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(FOLDER_PROPERTIES_STORE, path);
  }
}
