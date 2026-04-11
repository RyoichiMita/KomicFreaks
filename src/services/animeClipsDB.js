/**
 * Anime Clips Library — IndexedDB storage for imported anime audio clips.
 *
 * Users import their own audio clips (ripped from anime episodes) and tag them
 * with character, series, arc, and episode info. Clips are stored as blobs
 * in IndexedDB for persistence across sessions.
 *
 * Database: komic-freaks-db (shared with main project DB)
 * Object Store: anime-clips
 */

const DB_NAME = 'komic-freaks-db';
const DB_VERSION = 2; // Bumped from 1 to add the new store
const CLIPS_STORE = 'anime-clips';
const MEDIA_STORE = 'media-blobs';

let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CLIPS_STORE)) {
        const store = db.createObjectStore(CLIPS_STORE, { keyPath: 'id' });
        store.createIndex('character', 'character', { unique: false });
        store.createIndex('series', 'series', { unique: false });
        store.createIndex('arc', 'arc', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Store an anime audio clip with metadata.
 */
export async function storeAnimeClip(clip) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CLIPS_STORE, 'readwrite');
    const store = tx.objectStore(CLIPS_STORE);
    store.put(clip);
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Get all anime clips.
 */
export async function getAllAnimeClips() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(CLIPS_STORE, 'readonly');
    const store = tx.objectStore(CLIPS_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
}

/**
 * Delete an anime clip by ID.
 */
export async function deleteAnimeClip(id) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(CLIPS_STORE, 'readwrite');
    const store = tx.objectStore(CLIPS_STORE);
    store.delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
  });
}

/**
 * Clear all anime clips.
 */
export async function clearAllAnimeClips() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(CLIPS_STORE, 'readwrite');
    const store = tx.objectStore(CLIPS_STORE);
    store.clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
  });
}
