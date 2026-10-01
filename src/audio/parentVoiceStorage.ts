/**
 * src/audio/parentVoiceStorage.ts
 * 
 * Persistent IndexedDB storage for parent audio recordings.
 * Allows parents to record their own voice for any word,
 * safely stored offline with zero size limits.
 */

const DB_NAME = 'ToddlerParentVoiceDB';
const DB_VERSION = 1;
const STORE_NAME = 'voices';

class ParentVoiceStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private urlCache: Map<string, string> = new Map();
  private isLoaded = false;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Preloads all saved audio into memory object URLs for instant 0ms latency playback.
   */
  public async initCache(): Promise<string[]> {
    if (this.isLoaded) {
      return Array.from(this.urlCache.keys());
    }

    try {
      const db = await this.openDB();
      const voiceIds = await new Promise<string[]>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result as { id: string; blob: Blob }[];
          const ids: string[] = [];

          results.forEach((item) => {
            if (item.id && item.blob) {
              const prevUrl = this.urlCache.get(item.id);
              if (prevUrl) URL.revokeObjectURL(prevUrl);
              const url = URL.createObjectURL(item.blob);
              this.urlCache.set(item.id, url);
              ids.push(item.id);
            }
          });

          resolve(ids);
        };

        request.onerror = () => reject(request.error);
      });

      this.isLoaded = true;
      return voiceIds;
    } catch (err) {
      console.warn('Failed to initialize parent voice cache:', err);
      return [];
    }
  }

  /**
   * Check if custom voice exists for a given word ID
   */
  public hasVoice(id: string): boolean {
    return this.urlCache.has(id);
  }

  /**
   * Get audio URL for playback
   */
  public getVoiceUrl(id: string): string | null {
    return this.urlCache.get(id) || null;
  }

  /**
   * Save a recorded voice Blob for a word ID
   */
  public async saveVoice(id: string, blob: Blob): Promise<void> {
    const db = await this.openDB();

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id, blob, updatedAt: Date.now() });

      request.onsuccess = () => {
        // Revoke existing URL and create new one
        const prevUrl = this.urlCache.get(id);
        if (prevUrl) URL.revokeObjectURL(prevUrl);

        const newUrl = URL.createObjectURL(blob);
        this.urlCache.set(id, newUrl);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete custom voice for a word ID
   */
  public async deleteVoice(id: string): Promise<void> {
    const db = await this.openDB();

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        const prevUrl = this.urlCache.get(id);
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
          this.urlCache.delete(id);
        }
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all registered voice IDs
   */
  public getLoadedVoiceIds(): string[] {
    return Array.from(this.urlCache.keys());
  }
}

export const parentVoiceStorage = new ParentVoiceStorage();
