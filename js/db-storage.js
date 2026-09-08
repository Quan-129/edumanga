/* ==========================================================================
   EDUMANGA HUB - INDEXEDDB STORAGE ENGINE
   Handles heavy chapter JSONs, large Base64 images & multi-MB manga pages
   Bypasses the strict 5MB localStorage quota seamlessly.
   ========================================================================== */

const DB_NAME = 'EduMangaDB';
const DB_VERSION = 2;

const dbStorage = {
  dbPromise: null,

  async getDB() {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('chapters')) {
          db.createObjectStore('chapters', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('catalog')) {
          db.createObjectStore('catalog', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error("IndexedDB open error:", request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  },

  // Save heavy chapter pages array (handles 50MB+ base64 images easily)
  async saveChapterPages(seriesId, chapId, pages) {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('chapters', 'readwrite');
        const store = tx.objectStore('chapters');
        const item = {
          key: `${seriesId}_${chapId}`,
          seriesId: seriesId,
          chapId: chapId,
          pages: pages || [],
          updatedAt: Date.now()
        };
        store.put(item);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => {
          console.error("IndexedDB put chapter error:", tx.error);
          reject(tx.error);
        };
      });
    } catch (e) {
      console.error("Failed to save chapter to IndexedDB:", e);
      return false;
    }
  },

  // Retrieve chapter pages array
  async getChapterPages(seriesId, chapId) {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('chapters', 'readonly');
        const store = tx.objectStore('chapters');
        const request = store.get(`${seriesId}_${chapId}`);
        request.onsuccess = () => {
          if (request.result && request.result.pages) {
            resolve(request.result.pages);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch (e) {
      console.warn("Could not get chapter pages from IndexedDB:", e);
      return null;
    }
  },

  // Delete chapter
  async deleteChapterPages(seriesId, chapId) {
    try {
      const db = await this.getDB();
      const tx = db.transaction('chapters', 'readwrite');
      tx.objectStore('chapters').delete(`${seriesId}_${chapId}`);
    } catch (e) {}
  }
};

// Global Export
window.dbStorage = dbStorage;
