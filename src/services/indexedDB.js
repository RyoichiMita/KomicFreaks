/**
 * IndexedDB Storage — blob persistence layer for Komic Freaks Studio
 * 
 * Stores media file blobs (videos, audio, images) that can't be serialized
 * to localStorage. Enables full project resume with media re-hydration.
 * 
 * Database: komic-freaks-db
 * Object Store: media-blobs (key: clipId, value: { blob, name, type })
 */

const DB_NAME = 'komic-freaks-db';
const DB_VERSION = 1;
const MEDIA_STORE = 'media-blobs';

let dbInstance = null;

/**
 * Open or create the IndexedDB database.
 */
function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
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
 * Store a media blob in IndexedDB.
 * @param {string} clipId - Unique clip identifier
 * @param {Blob} blob - The media file blob
 * @param {string} fileName - Original file name
 * @param {string} mimeType - MIME type (e.g. 'video/mp4')
 */
export async function storeMediaBlob(clipId, blob, fileName, mimeType) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, 'readwrite');
      const store = tx.objectStore(MEDIA_STORE);

      store.put({
        id: clipId,
        blob,
        name: fileName,
        type: mimeType,
        storedAt: Date.now(),
      });

      tx.oncomplete = () => resolve(true);
      tx.onerror = (event) => {
        console.error('Failed to store blob:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (err) {
    console.error('storeMediaBlob error:', err);
    return false;
  }
}

/**
 * Retrieve a media blob from IndexedDB.
 * @param {string} clipId - Clip identifier
 * @returns {{ blob: Blob, name: string, type: string } | null}
 */
export async function getMediaBlob(clipId) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(MEDIA_STORE, 'readonly');
      const store = tx.objectStore(MEDIA_STORE);
      const request = store.get(clipId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Retrieve all stored media blobs.
 * @returns {Array<{ id: string, blob: Blob, name: string, type: string }>}
 */
export async function getAllMediaBlobs() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(MEDIA_STORE, 'readonly');
      const store = tx.objectStore(MEDIA_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}

/**
 * Delete a specific media blob.
 */
export async function deleteMediaBlob(clipId) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(MEDIA_STORE, 'readwrite');
      const store = tx.objectStore(MEDIA_STORE);
      store.delete(clipId);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Clear all stored media blobs (used when starting a new project).
 */
export async function clearAllMediaBlobs() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(MEDIA_STORE, 'readwrite');
      const store = tx.objectStore(MEDIA_STORE);
      store.clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Get storage usage estimate.
 * @returns {{ used: number, quota: number } | null}
 */
export async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return null;
}
