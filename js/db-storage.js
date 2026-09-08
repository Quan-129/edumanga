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
  },

  // Retrieve all chapters stored in IndexedDB
  async getAllStoredChapters() {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('chapters', 'readonly');
        const store = tx.objectStore('chapters');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  },

  // Helper: Trigger browser file download for JSON object
  triggerDownloadJson(data, filename) {
    try {
      const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `edumanga_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error("Failed to trigger JSON download:", err);
      return false;
    }
  },

  // 1. Export Single Chapter JSON
  async exportSingleChapter(seriesId, chapId, chapMeta) {
    try {
      let pages = await this.getChapterPages(seriesId, chapId);
      
      // Fallback: If not in IndexedDB, check chapMeta.pages
      if (!pages && chapMeta && Array.isArray(chapMeta.pages) && chapMeta.pages.length > 0) {
        pages = chapMeta.pages;
      }

      // Fallback 2: Try fetching from static data folder
      if (!pages || pages.length === 0) {
        try {
          const resp = await fetch(`data/${seriesId}/${chapId}.json`);
          if (resp.ok) {
            const staticData = await resp.json();
            pages = staticData.pages || (Array.isArray(staticData) ? staticData : []);
          }
        } catch (e) {}
      }

      const chapterExport = {
        id: chapId,
        title: chapMeta ? chapMeta.title : chapId,
        chapterNumber: chapMeta ? (chapMeta.chapterNumber || 1) : 1,
        subtitle: chapMeta ? (chapMeta.subtitle || '') : '',
        pdfUrl: chapMeta ? (chapMeta.pdfUrl || '') : '',
        releaseDate: chapMeta ? (chapMeta.releaseDate || new Date().toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10),
        seriesId: seriesId,
        pagesCount: pages ? pages.length : 0,
        exportedAt: new Date().toISOString(),
        pages: pages || []
      };

      const safeSeries = (seriesId || 'manga').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeChap = (chapId || 'chap').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `edumanga_${safeSeries}_${safeChap}.json`;

      this.triggerDownloadJson(chapterExport, filename);
      return { success: true, filename: filename, pagesCount: (pages || []).length };
    } catch (err) {
      console.error("Export chapter error:", err);
      return { success: false, error: err.message };
    }
  },

  // 2. Export Entire Series Backup (Metadata + All Chapters with Pages)
  async exportSeriesFullBackup(series) {
    if (!series) return { success: false, error: "Missing series data" };

    try {
      const enrichedChapters = [];
      const chaptersList = series.chapters || [];

      for (const chap of chaptersList) {
        let pages = await this.getChapterPages(series.id, chap.id);
        if (!pages && chap.pages) pages = chap.pages;
        if (!pages) {
          try {
            const resp = await fetch(`data/${series.id}/${chap.id}.json`);
            if (resp.ok) {
              const staticData = await resp.json();
              pages = staticData.pages || (Array.isArray(staticData) ? staticData : []);
            }
          } catch (e) {}
        }

        enrichedChapters.push({
          ...chap,
          pagesCount: (pages || []).length,
          pages: pages || []
        });
      }

      const backupData = {
        exportType: "series_backup",
        version: "1.0",
        app: "EduManga Hub",
        exportedAt: new Date().toISOString(),
        series: {
          ...series,
          chapters: enrichedChapters
        }
      };

      const dateStr = new Date().toISOString().slice(0, 10);
      const safeSeriesId = (series.id || 'series').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `edumanga_series_${safeSeriesId}_backup_${dateStr}.json`;

      this.triggerDownloadJson(backupData, filename);
      return { success: true, filename: filename, chaptersCount: enrichedChapters.length };
    } catch (err) {
      console.error("Export series backup error:", err);
      return { success: false, error: err.message };
    }
  },

  // 3. Export Master System Backup (Full Catalog + All Stored Chapters)
  async exportMasterBackup(fullCatalog) {
    if (!fullCatalog || !Array.isArray(fullCatalog)) {
      return { success: false, error: "Invalid catalog list" };
    }

    try {
      const enrichedCatalog = [];
      let totalChaps = 0;

      for (const series of fullCatalog) {
        const enrichedChapters = [];
        for (const chap of (series.chapters || [])) {
          let pages = await this.getChapterPages(series.id, chap.id);
          if (!pages && chap.pages) pages = chap.pages;
          enrichedChapters.push({
            ...chap,
            pagesCount: (pages || []).length,
            pages: pages || []
          });
          totalChaps++;
        }

        enrichedCatalog.push({
          ...series,
          chapters: enrichedChapters
        });
      }

      const masterBackup = {
        exportType: "master_backup",
        version: "1.0",
        app: "EduManga Hub",
        exportedAt: new Date().toISOString(),
        totalSeries: enrichedCatalog.length,
        totalChapters: totalChaps,
        catalog: enrichedCatalog
      };

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `edumanga_master_backup_${dateStr}.json`;

      this.triggerDownloadJson(masterBackup, filename);
      return { success: true, filename: filename, totalSeries: enrichedCatalog.length, totalChapters: totalChaps };
    } catch (err) {
      console.error("Export master backup error:", err);
      return { success: false, error: err.message };
    }
  },

  // 4. Restore / Import JSON Backup File Smartly
  async restoreBackupData(rawData) {
    try {
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      if (!parsed) throw new Error("File JSON rỗng hoặc không hợp lệ");

      let customCatalog = [];
      try {
        const raw = localStorage.getItem('edumanga_custom_catalog');
        if (raw) customCatalog = JSON.parse(raw);
      } catch (e) {
        customCatalog = [];
      }

      // Case 1: Master Backup
      if (parsed.exportType === 'master_backup' || Array.isArray(parsed.catalog)) {
        const catalogList = parsed.catalog || [];
        let importedSeries = 0;
        let importedChapters = 0;

        let deletedSeriesIds = JSON.parse(localStorage.getItem('edumanga_deleted_series_ids') || '[]');
        let deletedChapterKeys = JSON.parse(localStorage.getItem('edumanga_deleted_chapter_keys') || '[]');

        for (const s of catalogList) {
          if (!s.id) continue;
          
          // Un-blacklist this series if it was deleted
          deletedSeriesIds = deletedSeriesIds.filter(x => x !== s.id);

          // Separate clean chapters metadata from heavy pages
          const cleanChapters = [];
          for (const chap of (s.chapters || [])) {
            if (!chap.id) continue;
            deletedChapterKeys = deletedChapterKeys.filter(x => x !== `${s.id}_${chap.id}`);
            if (chap.pages && Array.isArray(chap.pages) && chap.pages.length > 0) {
              await this.saveChapterPages(s.id, chap.id, chap.pages);
              importedChapters++;
            }
            const { pages, ...cleanChap } = chap;
            cleanChapters.push({ ...cleanChap, pagesCount: (pages || []).length || cleanChap.pagesCount || 0 });
          }

          const seriesToStore = {
            ...s,
            chapters: cleanChapters
          };

          const existIdx = customCatalog.findIndex(m => m.id === s.id);
          if (existIdx >= 0) {
            customCatalog[existIdx] = { ...customCatalog[existIdx], ...seriesToStore };
          } else {
            customCatalog.push(seriesToStore);
          }
          importedSeries++;
        }

        localStorage.setItem('edumanga_deleted_series_ids', JSON.stringify(deletedSeriesIds));
        localStorage.setItem('edumanga_deleted_chapter_keys', JSON.stringify(deletedChapterKeys));
        localStorage.setItem('edumanga_custom_catalog', JSON.stringify(customCatalog));
        return {
          success: true,
          type: 'master',
          message: `Khôi phục thành công Master Backup: ${importedSeries} bộ truyện và ${importedChapters} chương!`,
          seriesCount: importedSeries,
          chaptersCount: importedChapters
        };
      }

      // Case 2: Series Backup
      if (parsed.exportType === 'series_backup' || parsed.series || (parsed.id && parsed.title && parsed.chapters)) {
        const s = parsed.series || parsed;
        if (!s.id) throw new Error("Không tìm thấy thông tin định danh ID bộ truyện");

        let deletedSeriesIds = JSON.parse(localStorage.getItem('edumanga_deleted_series_ids') || '[]');
        deletedSeriesIds = deletedSeriesIds.filter(x => x !== s.id);
        localStorage.setItem('edumanga_deleted_series_ids', JSON.stringify(deletedSeriesIds));

        let deletedChapterKeys = JSON.parse(localStorage.getItem('edumanga_deleted_chapter_keys') || '[]');

        let importedChapters = 0;
        const cleanChapters = [];
        for (const chap of (s.chapters || [])) {
          if (!chap.id) continue;
          deletedChapterKeys = deletedChapterKeys.filter(x => x !== `${s.id}_${chap.id}`);
          if (chap.pages && Array.isArray(chap.pages) && chap.pages.length > 0) {
            await this.saveChapterPages(s.id, chap.id, chap.pages);
            importedChapters++;
          }
          const { pages, ...cleanChap } = chap;
          cleanChapters.push({ ...cleanChap, pagesCount: (pages || []).length || cleanChap.pagesCount || 0 });
        }

        localStorage.setItem('edumanga_deleted_chapter_keys', JSON.stringify(deletedChapterKeys));

        const seriesToStore = {
          ...s,
          chapters: cleanChapters
        };

        const existIdx = customCatalog.findIndex(m => m.id === s.id);
        if (existIdx >= 0) {
          customCatalog[existIdx] = { ...customCatalog[existIdx], ...seriesToStore };
        } else {
          customCatalog.push(seriesToStore);
        }

        localStorage.setItem('edumanga_custom_catalog', JSON.stringify(customCatalog));
        return {
          success: true,
          type: 'series',
          message: `Khôi phục thành công bộ truyện "${s.title}" với ${importedChapters} chương!`,
          seriesTitle: s.title,
          chaptersCount: importedChapters
        };
      }

      // Case 3: Single Chapter JSON
      if (parsed.pages || Array.isArray(parsed) || parsed.chapterNumber || parsed.id) {
        let pagesArray = [];
        if (Array.isArray(parsed)) pagesArray = parsed;
        else if (Array.isArray(parsed.pages)) pagesArray = parsed.pages;

        if (pagesArray.length === 0) {
          throw new Error("File JSON không chứa dữ liệu trang truyện (pages)");
        }

        const targetSeriesId = parsed.seriesId || (window.currentSeries ? window.currentSeries.id : null);
        const targetChapId = parsed.id || `chap-${parsed.chapterNumber || '01'}`;

        if (!targetSeriesId) {
          return {
            success: false,
            needsSeriesSelection: true,
            pages: pagesArray,
            parsedData: parsed,
            error: "Vui lòng mở trang chi tiết của bộ truyện muốn nạp chương này vào."
          };
        }

        // Un-blacklist this chapter
        let deletedChapterKeys = JSON.parse(localStorage.getItem('edumanga_deleted_chapter_keys') || '[]');
        deletedChapterKeys = deletedChapterKeys.filter(x => x !== `${targetSeriesId}_${targetChapId}`);
        localStorage.setItem('edumanga_deleted_chapter_keys', JSON.stringify(deletedChapterKeys));

        await this.saveChapterPages(targetSeriesId, targetChapId, pagesArray);

        // Update catalog chapter metadata if series found
        const seriesObj = customCatalog.find(m => m.id === targetSeriesId);
        if (seriesObj) {
          const chaps = seriesObj.chapters || [];
          const chapIdx = chaps.findIndex(c => c.id === targetChapId);
          const chapInfo = {
            id: targetChapId,
            title: parsed.title || `Chương ${parsed.chapterNumber || chaps.length + 1}`,
            chapterNumber: parsed.chapterNumber || (chaps.length + 1),
            subtitle: parsed.subtitle || '',
            pagesCount: pagesArray.length,
            releaseDate: parsed.releaseDate || new Date().toISOString().slice(0, 10)
          };

          if (chapIdx >= 0) {
            chaps[chapIdx] = { ...chaps[chapIdx], ...chapInfo };
          } else {
            chaps.push(chapInfo);
          }
          seriesObj.chapters = chaps;
          localStorage.setItem('edumanga_custom_catalog', JSON.stringify(customCatalog));
        }

        return {
          success: true,
          type: 'chapter',
          message: `Đã nạp thành công chương "${parsed.title || targetChapId}" (${pagesArray.length} trang)!`,
          chapTitle: parsed.title || targetChapId,
          pagesCount: pagesArray.length
        };
      }

      throw new Error("Định dạng file JSON không khớp với chuẩn EduManga Hub.");
    } catch (err) {
      console.error("Restore backup error:", err);
      return { success: false, error: err.message };
    }
  },

  // Get full merged manga catalog with deletion blacklist filtering
  async getFullMangaCatalog() {
    let baseCatalog = [];
    try {
      const response = await fetch('data/manga.json');
      if (response.ok) {
        baseCatalog = await response.json();
      }
    } catch (err) {
      console.warn("Could not fetch data/manga.json, fallback to empty list:", err);
    }

    let deletedSeriesIds = [];
    try {
      const raw = localStorage.getItem('edumanga_deleted_series_ids');
      if (raw) deletedSeriesIds = JSON.parse(raw);
    } catch (e) {
      deletedSeriesIds = [];
    }

    let deletedChapterKeys = [];
    try {
      const raw = localStorage.getItem('edumanga_deleted_chapter_keys');
      if (raw) deletedChapterKeys = JSON.parse(raw);
    } catch (e) {
      deletedChapterKeys = [];
    }

    let customCatalog = [];
    try {
      const raw = localStorage.getItem('edumanga_custom_catalog');
      if (raw) customCatalog = JSON.parse(raw);
    } catch (e) {
      customCatalog = [];
    }

    const mergedMap = new Map();

    // 1. Populate base catalog without deleted series & deleted chapters
    baseCatalog.forEach(m => {
      if (!deletedSeriesIds.includes(m.id)) {
        const cleanChaps = (m.chapters || []).filter(c => !deletedChapterKeys.includes(`${m.id}_${c.id}`));
        mergedMap.set(m.id, { ...m, chapters: cleanChaps });
      }
    });

    // 2. Merge custom additions/overrides
    customCatalog.forEach(custom => {
      if (deletedSeriesIds.includes(custom.id)) return;

      const customChaps = (custom.chapters || []).filter(c => !deletedChapterKeys.includes(`${custom.id}_${c.id}`));

      if (mergedMap.has(custom.id)) {
        const existing = mergedMap.get(custom.id);
        mergedMap.set(custom.id, {
          ...existing,
          ...custom,
          chapters: customChaps
        });
      } else {
        mergedMap.set(custom.id, {
          ...custom,
          chapters: customChaps
        });
      }
    });

    return Array.from(mergedMap.values());
  },

  // 5. Auto-Backup Settings Management
  getBackupSettings() {
    const defaultSettings = {
      enabled: true,
      targetDir: 'G:\\My Drive\\hk261\\Dự án manga\\backup',
      frequencyDays: 2,
      preferredHour: 20,
      lastBackupTimestamp: 0,
      lastBackupFolder: '',
      lastBackupStatus: 'Chưa có bản sao lưu nào'
    };

    try {
      const raw = localStorage.getItem('edumanga_backup_settings');
      if (raw) {
        return { ...defaultSettings, ...JSON.parse(raw) };
      }
    } catch (e) {}
    return defaultSettings;
  },

  saveBackupSettings(settings) {
    try {
      localStorage.setItem('edumanga_backup_settings', JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save backup settings:", e);
    }
  },

  // 6. Perform Backup to Folder (Auto or Manual Trigger)
  async performAutoBackupToFolder(customTargetDir = null, isAuto = false) {
    const settings = this.getBackupSettings();
    const targetDir = customTargetDir || settings.targetDir || 'backup';

    // Format folder date DD-MM-YYYY (e.g. 08-09-2026)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateFolder = `${day}-${month}-${year}`;

    try {
      const fullCatalog = await this.getFullMangaCatalog();
      const enrichedCatalog = [];
      const allChaptersList = [];

      for (const series of fullCatalog) {
        const enrichedChaps = [];
        for (const chap of (series.chapters || [])) {
          let pages = await this.getChapterPages(series.id, chap.id);
          if (!pages && chap.pages) pages = chap.pages;
          if (!pages) {
            try {
              const resp = await fetch(`data/${series.id}/${chap.id}.json`);
              if (resp.ok) {
                const staticData = await resp.json();
                pages = staticData.pages || (Array.isArray(staticData) ? staticData : []);
              }
            } catch (e) {}
          }

          const fullChapData = {
            ...chap,
            seriesId: series.id,
            pagesCount: (pages || []).length,
            pages: pages || []
          };
          enrichedChaps.push(fullChapData);
          allChaptersList.push(fullChapData);
        }

        enrichedCatalog.push({
          ...series,
          chapters: enrichedChaps
        });
      }

      const masterBackup = {
        exportType: "master_backup",
        version: "1.0",
        app: "EduManga Hub",
        exportedAt: now.toISOString(),
        totalSeries: enrichedCatalog.length,
        totalChapters: allChaptersList.length,
        catalog: enrichedCatalog
      };

      const payload = {
        targetDir: targetDir,
        dateFolder: dateFolder,
        masterBackup: masterBackup,
        catalog: fullCatalog,
        chapters: allChaptersList
      };

      // Try multiple endpoints in case app is served on VS Code Live Server or python dev server
      const isHttps = window.location.protocol === 'https:';
      const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

      const candidateEndpoints = ['/api/backup/save'];
      if (!isHttps || isLocal) {
        candidateEndpoints.push('http://localhost:8080/api/backup/save', 'http://127.0.0.1:8080/api/backup/save');
      }

      let lastErr = null;
      let result = null;

      for (const endpoint of candidateEndpoints) {
        try {
          const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (resp.ok) {
            result = await resp.json();
            if (result && result.success) {
              break;
            }
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (result && result.success) {
        settings.lastBackupTimestamp = Date.now();
        settings.lastBackupFolder = result.targetFolder;
        settings.lastBackupStatus = `Thành công (${result.totalFiles} files lúc ${new Date().toLocaleTimeString('vi-VN')})`;
        this.saveBackupSettings(settings);

        console.log(`[Auto-Backup] ✅ Sao lưu thành công vào: ${result.targetFolder}`);
        return {
          success: true,
          folder: result.targetFolder,
          dateFolder: dateFolder,
          totalFiles: result.totalFiles,
          isAuto: isAuto
        };
      }

      throw new Error(lastErr ? lastErr.message : "Không thể kết nối Python Dev Server (hãy chạy 'python scripts/dev_server.py')");

    } catch (err) {
      console.warn("[Auto-Backup] Local server API not available:", err);
      settings.lastBackupStatus = `Chưa kết nối Python Server (Lỗi: ${err.message})`;
      this.saveBackupSettings(settings);
      return { success: false, error: err.message };
    }
  },

  // 7. Smart Catch-Up Check on Boot
  async checkAndRunSmartCatchUpBackup() {
    // Only run if user is admin
    if (!window.authService || typeof window.authService.isAdmin !== 'function' || !window.authService.isAdmin()) {
      return;
    }

    const settings = this.getBackupSettings();
    if (settings.enabled === false) {
      return;
    }

    const frequencyMs = (settings.frequencyDays || 2) * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - (settings.lastBackupTimestamp || 0);

    // If never backed up or elapsed >= interval, trigger catch-up backup
    if (!settings.lastBackupTimestamp || elapsed >= frequencyMs) {
      console.log(`[Auto-Backup] ⏰ Kích hoạt sao lưu bù thông minh (Lần sao lưu cuối cách đây ${Math.round(elapsed / (24*3600*1000))} ngày)...`);
      const res = await this.performAutoBackupToFolder(null, true);
      if (res.success && typeof showToast === 'function') {
        showToast(`⏰ Tự động sao lưu bù vào thư mục "${res.dateFolder}" thành công!`);
      }
    }
  },

  // 7. Dynamic Series Cover Resolver (Fallback to First Page of Chapter 1)
  getSeriesCover(series) {
    if (!series) return 'assets/covers/default_cover.jpg';
    if (series.cover && typeof series.cover === 'string' && series.cover.trim() !== '') {
      return series.cover.trim();
    }

    const chaps = series.chapters || [];
    if (chaps.length > 0) {
      const firstChap = chaps[0];
      if (firstChap) {
        if (firstChap.pages && Array.isArray(firstChap.pages) && firstChap.pages.length > 0 && firstChap.pages[0].imageUrl) {
          return firstChap.pages[0].imageUrl;
        }
        if (series.id && firstChap.id) {
          return `assets/chapters/${series.id}/${firstChap.id}/page_01.jpg`;
        }
      }
    }

    return 'assets/covers/default_cover.jpg';
  },

  async getSeriesCoverAsync(series) {
    if (!series) return 'assets/covers/default_cover.jpg';
    if (series.cover && typeof series.cover === 'string' && series.cover.trim() !== '') {
      return series.cover.trim();
    }

    const chaps = series.chapters || [];
    if (chaps.length > 0) {
      const firstChap = chaps[0];
      if (firstChap) {
        if (firstChap.pages && Array.isArray(firstChap.pages) && firstChap.pages.length > 0 && firstChap.pages[0].imageUrl) {
          return firstChap.pages[0].imageUrl;
        }
        try {
          const storedPages = await this.getChapterPages(series.id, firstChap.id);
          if (storedPages && storedPages.length > 0 && storedPages[0].imageUrl) {
            return storedPages[0].imageUrl;
          }
        } catch (e) {}

        if (series.id && firstChap.id) {
          return `assets/chapters/${series.id}/${firstChap.id}/page_01.jpg`;
        }
      }
    }

    return 'assets/covers/default_cover.jpg';
  }
};

// Global Export
window.dbStorage = dbStorage;
window.getFullMangaCatalog = () => dbStorage.getFullMangaCatalog();
window.getSeriesCover = (series) => dbStorage.getSeriesCover(series);
window.getSeriesCoverAsync = (series) => dbStorage.getSeriesCoverAsync(series);



