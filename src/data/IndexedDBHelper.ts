import type { Track, Playlist } from '../domain/entities';

const DB_NAME = 'MusicAppDB';
const DB_VERSION = 1;

export class IndexedDBHelper {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Tracks store
        if (!db.objectStoreNames.contains('tracks')) {
          db.createObjectStore('tracks', { keyPath: 'id' });
        }

        // Playlists store
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // --- TRACKS ---

  async saveTrack(track: Track): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create a copy without url objects if they are ephemeral blob URLs
      const trackToStore = { ...track };
      // Omit coverUrl if it is a temporary blob URL (it should be regenerated or loaded from file)
      if (trackToStore.coverUrl && trackToStore.coverUrl.startsWith('blob:')) {
        // Keep it if we store it, or clear it. Actually, we store coverUrl if it's base64 or if it's extracted.
      }

      const store = this.getStore('tracks', 'readwrite');
      const request = store.put(trackToStore);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveTracks(tracks: Track[]): Promise<void> {
    if (tracks.length === 0) return;
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error('Database not initialized'));
      }
      const transaction = this.db.transaction('tracks', 'readwrite');
      const store = transaction.objectStore('tracks');

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      tracks.forEach((track) => {
        store.put(track);
      });
    });
  }

  async getAllTracks(): Promise<Track[]> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('tracks', 'readonly');
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result as Track[]);
        };
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async getTrack(id: string): Promise<Track | null> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('tracks', 'readonly');
        const request = store.get(id);

        request.onsuccess = () => {
          resolve((request.result as Track) || null);
        };
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async deleteTrack(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('tracks', 'readwrite');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async clearAllTracks(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('tracks', 'readwrite');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- PLAYLISTS ---

  async savePlaylist(playlist: Playlist): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('playlists', 'readwrite');
        const request = store.put(playlist);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('playlists', 'readonly');
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result as Playlist[]);
        };
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async getPlaylist(id: string): Promise<Playlist | null> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('playlists', 'readonly');
        const request = store.get(id);

        request.onsuccess = () => {
          resolve((request.result as Playlist) || null);
        };
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async deletePlaylist(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('playlists', 'readwrite');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- SETTINGS ---

  async setSetting(key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('settings', 'readwrite');
        const request = store.put({ key, value });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async getSetting<T>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('settings', 'readonly');
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result ? (request.result.value as T) : null);
        };
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const dbHelper = new IndexedDBHelper();
