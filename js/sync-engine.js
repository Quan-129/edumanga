/* ==========================================================================
   EDUMANGA HUB - CLOUD SYNC & DATA ISOLATION ENGINE
   Cloud Firestore Synchronization, Local-First Caching & Auto-Merge
   ========================================================================== */

let syncDebounceTimers = {};
let isSyncing = false;

const syncEngine = {
  // Check if active user and Firestore are available
  canSyncToCloud() {
    return isFirebaseInitialized && 
           firestoreDb !== null && 
           currentUserState !== null && 
           currentUserState.uid;
  },

  // Get current user Firestore base document reference
  getUserRef() {
    if (!this.canSyncToCloud()) return null;
    return firestoreDb.collection('users').doc(currentUserState.uid);
  },

  // Update Cloud Sync Status Indicator on UI
  setSyncStatus(status) {
    const badge = document.getElementById('headerSyncStatus');
    if (!badge) return;

    if (status === 'syncing') {
      badge.innerHTML = '<i class="fas fa-arrows-rotate fa-spin" style="color: #38bdf8;"></i>';
      badge.title = 'Đang đồng bộ dữ liệu lên đám mây...';
    } else if (status === 'synced') {
      badge.innerHTML = '<i class="fas fa-cloud-check" style="color: #4ade80;"></i>';
      badge.title = 'Đã đồng bộ an toàn trên đám mây';
    } else if (status === 'offline') {
      badge.innerHTML = '<i class="fas fa-hard-drive" style="color: #94a3b8;"></i>';
      badge.title = 'Lưu trữ cục bộ trên máy này';
    } else if (status === 'error') {
      badge.innerHTML = '<i class="fas fa-triangle-exclamation" style="color: #f43f5e;"></i>';
      badge.title = 'Đồng bộ tạm gián đoạn. Đang lưu tạm trên máy.';
    }
  },

  // ------------------------------------------------------------------------
  // 1. NOTEBOOK & CANVAS DRAWINGS SYNC
  // ------------------------------------------------------------------------
  async saveNotebook(chapterKey, data) {
    if (!chapterKey) return;
    
    // 1. Save to local first (0ms latency)
    try {
      localStorage.setItem(`edumanga_notebook_${chapterKey}`, JSON.stringify({
        textNotes: data.textNotes || '',
        canvasData: data.canvasData || '',
        updatedAt: Date.now()
      }));
    } catch (e) {
      console.warn("Local storage write error:", e);
    }

    // 2. Debounced Cloud Firestore Push
    if (!this.canSyncToCloud()) return;

    const timerKey = `notebook_${chapterKey}`;
    if (syncDebounceTimers[timerKey]) clearTimeout(syncDebounceTimers[timerKey]);

    this.setSyncStatus('syncing');

    syncDebounceTimers[timerKey] = setTimeout(async () => {
      try {
        const userRef = this.getUserRef();
        if (!userRef) return;

        await userRef.collection('notebooks').doc(chapterKey).set({
          chapterKey: chapterKey,
          textNotes: data.textNotes || '',
          canvasData: data.canvasData || '',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        this.setSyncStatus('synced');
      } catch (err) {
        console.warn("Cloud notebook sync error:", err);
        this.setSyncStatus('error');
      }
    }, 1500);
  },

  async loadNotebook(chapterKey) {
    if (!chapterKey) return null;

    // Try cloud first if logged in
    if (this.canSyncToCloud()) {
      try {
        const userRef = this.getUserRef();
        const doc = await userRef.collection('notebooks').doc(chapterKey).get();
        if (doc.exists) {
          const cloudData = doc.data();
          // Update local cache
          localStorage.setItem(`edumanga_notebook_${chapterKey}`, JSON.stringify(cloudData));
          return cloudData;
        }
      } catch (err) {
        console.warn("Cloud load notebook error, using local fallback:", err);
      }
    }

    // Local fallback
    try {
      const localStr = localStorage.getItem(`edumanga_notebook_${chapterKey}`);
      return localStr ? JSON.parse(localStr) : null;
    } catch (e) {
      return null;
    }
  },

  // ------------------------------------------------------------------------
  // 2. FLASHCARDS 3D & SRS PROGRESS SYNC
  // ------------------------------------------------------------------------
  async saveFlashcards(cardsArray) {
    if (!Array.isArray(cardsArray)) return;

    // Local Cache
    try {
      localStorage.setItem('edumanga_flashcards', JSON.stringify(cardsArray));
    } catch (e) {}

    if (!this.canSyncToCloud()) return;

    const timerKey = 'flashcards_sync';
    if (syncDebounceTimers[timerKey]) clearTimeout(syncDebounceTimers[timerKey]);

    this.setSyncStatus('syncing');

    syncDebounceTimers[timerKey] = setTimeout(async () => {
      try {
        const userRef = this.getUserRef();
        if (!userRef) return;

        await userRef.collection('study_data').doc('flashcards_deck').set({
          cards: cardsArray,
          totalCount: cardsArray.length,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        this.setSyncStatus('synced');
      } catch (err) {
        console.warn("Cloud flashcards sync error:", err);
        this.setSyncStatus('error');
      }
    }, 1200);
  },

  async loadFlashcards() {
    // Try Cloud Firestore
    if (this.canSyncToCloud()) {
      try {
        const userRef = this.getUserRef();
        const doc = await userRef.collection('study_data').doc('flashcards_deck').get();
        if (doc.exists && doc.data().cards) {
          const cards = doc.data().cards;
          localStorage.setItem('edumanga_flashcards', JSON.stringify(cards));
          return cards;
        }
      } catch (err) {
        console.warn("Cloud load flashcards error, using local:", err);
      }
    }

    // Local Cache Fallback
    try {
      const localStr = localStorage.getItem('edumanga_flashcards');
      return localStr ? JSON.parse(localStr) : null;
    } catch (e) {
      return null;
    }
  },

  // ------------------------------------------------------------------------
  // 3. READING PROGRESS & BOOKMARKS SYNC
  // ------------------------------------------------------------------------
  async saveReadingProgress(seriesId, chapterId, pageNum) {
    if (!seriesId || !chapterId) return;

    // Save local
    try {
      localStorage.setItem(`manga_last_read_${seriesId}`, JSON.stringify({
        chapterId: chapterId,
        page: pageNum || 1,
        timestamp: Date.now()
      }));
    } catch (e) {}

    if (!this.canSyncToCloud()) return;

    const timerKey = `progress_${seriesId}`;
    if (syncDebounceTimers[timerKey]) clearTimeout(syncDebounceTimers[timerKey]);

    syncDebounceTimers[timerKey] = setTimeout(async () => {
      try {
        const userRef = this.getUserRef();
        if (!userRef) return;

        await userRef.collection('reading_progress').doc(seriesId).set({
          seriesId: seriesId,
          chapterId: chapterId,
          page: pageNum || 1,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn("Cloud reading progress sync error:", err);
      }
    }, 2000);
  },

  async loadReadingProgress(seriesId) {
    if (!seriesId) return null;

    if (this.canSyncToCloud()) {
      try {
        const userRef = this.getUserRef();
        const doc = await userRef.collection('reading_progress').doc(seriesId).get();
        if (doc.exists) {
          const progress = doc.data();
          localStorage.setItem(`manga_last_read_${seriesId}`, JSON.stringify(progress));
          return progress;
        }
      } catch (err) {
        console.warn("Cloud load progress error, using local:", err);
      }
    }

    try {
      const localStr = localStorage.getItem(`manga_last_read_${seriesId}`);
      return localStr ? JSON.parse(localStr) : null;
    } catch (e) {
      return null;
    }
  },

  // ------------------------------------------------------------------------
  // 4. KANJI MASTERY & PRACTICE PROGRESS SYNC
  // ------------------------------------------------------------------------
  async saveKanjiScore(kanjiChar, score) {
    if (!kanjiChar) return;

    if (!this.canSyncToCloud()) return;

    try {
      const userRef = this.getUserRef();
      if (!userRef) return;

      await userRef.collection('kanji_mastery').doc(kanjiChar).set({
        kanji: kanjiChar,
        highestScore: score,
        practiceCount: firebase.firestore.FieldValue.increment(1),
        lastPracticed: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Cloud kanji progress error:", err);
    }
  },

  // ------------------------------------------------------------------------
  // 5. USER PREFERENCES (UI THEMES, LAYOUT, SIDES)
  // ------------------------------------------------------------------------
  async saveUserPreferences(prefs) {
    if (!this.canSyncToCloud()) return;

    try {
      const userRef = this.getUserRef();
      if (!userRef) return;

      await userRef.collection('preferences').doc('ui_settings').set({
        ...prefs,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Cloud preferences sync error:", err);
    }
  },

  async loadUserPreferences() {
    if (!this.canSyncToCloud()) return null;

    try {
      const userRef = this.getUserRef();
      const doc = await userRef.collection('preferences').doc('ui_settings').get();
      if (doc.exists) {
        return doc.data();
      }
    } catch (err) {
      console.warn("Cloud load preferences error:", err);
    }
    return null;
  },

  // ------------------------------------------------------------------------
  // 6. ON USER LOGIN: MIGRATION & BIDIRECTIONAL AUTO-MERGE
  // ------------------------------------------------------------------------
  async onUserLoggedIn(user) {
    if (!user || !user.uid) return;
    this.setSyncStatus('syncing');

    try {
      const userRef = firestoreDb.collection('users').doc(user.uid);

      // Save user profile metadata
      await userRef.set({
        email: user.email || '',
        displayName: user.displayName || user.email.split('@')[0] || 'Học viên',
        photoURL: user.photoURL || '',
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Merge Flashcards: Local ➔ Cloud
      let localCards = [];
      try {
        const raw = localStorage.getItem('edumanga_flashcards');
        if (raw) localCards = JSON.parse(raw);
      } catch (e) {}

      const cloudFlashDoc = await userRef.collection('study_data').doc('flashcards_deck').get();
      if (cloudFlashDoc.exists && cloudFlashDoc.data().cards) {
        const cloudCards = cloudFlashDoc.data().cards;
        // Merge without duplicates based on term
        const cardMap = new Map();
        cloudCards.forEach(c => cardMap.set(c.term, c));
        localCards.forEach(c => {
          if (!cardMap.has(c.term)) {
            cardMap.set(c.term, c);
          }
        });
        const mergedCards = Array.from(cardMap.values());
        localStorage.setItem('edumanga_flashcards', JSON.stringify(mergedCards));
        await userRef.collection('study_data').doc('flashcards_deck').set({
          cards: mergedCards,
          totalCount: mergedCards.length,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } else if (localCards.length > 0) {
        // Push local cards to cloud for the first time
        await userRef.collection('study_data').doc('flashcards_deck').set({
          cards: localCards,
          totalCount: localCards.length,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      // Notify UI components to refresh data
      if (typeof window.renderFlashcardsList === 'function') {
        window.renderFlashcardsList();
      }

      this.setSyncStatus('synced');
      showToast(`☁️ Đã đồng bộ dữ liệu tài khoản [${user.displayName || user.email}]!`);
    } catch (err) {
      console.error("User login sync error:", err);
      this.setSyncStatus('error');
    }
  },

  // Force Manual Sync Trigger
  async forceSyncAll() {
    if (!this.canSyncToCloud()) {
      showToast("ℹ️ Bạn đang ở chế độ Khách. Dữ liệu được lưu an toàn trên máy này!");
      return;
    }

    this.setSyncStatus('syncing');
    showToast("🔄 Đang đồng bộ toàn bộ dữ liệu...");

    try {
      // Reload flashcards
      await this.loadFlashcards();
      if (typeof window.renderFlashcardsList === 'function') {
        window.renderFlashcardsList();
      }

      this.setSyncStatus('synced');
      showToast("✨ Toàn bộ dữ liệu đã được đồng bộ với Cloud!");
    } catch (err) {
      this.setSyncStatus('error');
      showToast("⚠️ Đồng bộ gián đoạn. Dữ liệu vẫn được lưu trên máy.");
    }
  }
};

// Expose globally
window.syncEngine = syncEngine;
