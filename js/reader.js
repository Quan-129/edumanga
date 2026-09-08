/* ==========================================================================
   EDUMANGA HUB - MANGA READER ENGINE
   Webtoon Scroll, Page Flip, Double Page, Gestures & Keyboard Navigation
   ========================================================================== */

let currentSeries = null;
let currentChapter = null;
let currentPageIndex = 0; // 0-based
let totalPages = 0;
let readerMode = 'webtoon'; // 'webtoon' | 'single'
let isMenuVisible = true;
let isFullscreen = false;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const seriesId = urlParams.get('series') || 'tieng-nhat-n2';
  const chapId = urlParams.get('chap') || 'chap-01';
  const initialPage = parseInt(urlParams.get('page') || '1', 10) - 1;

  // 1. Load ALL saved preferences FIRST before any DOM rendering
  const savedMode = localStorage.getItem('edumanga_reader_mode') || 'webtoon';
  readerMode = (savedMode === 'double') ? 'single' : savedMode;
  const theme = localStorage.getItem('edumanga_reader_theme') || 'oled';
  setReaderTheme(theme);

  const savedPagePref = localStorage.getItem('edumanga_show_page_numbers');
  isPageNumberVisible = savedPagePref === null ? true : savedPagePref === 'true';

  if (typeof loadStudyPreferences === 'function') {
    loadStudyPreferences();
  }

  // 2. Load chapter data & render DOM with verified preferences
  await loadChapterData(seriesId, chapId, initialPage);

  // 3. Bind UI controls and synchronize active states
  initReaderControls();
  initTouchZones();
  initKeyboardNav();
  initStudyMode();
});

async function loadChapterData(seriesId, chapId, initialPage = 0) {
  try {
    const response = await fetch('data/manga.json');
    const catalog = await response.json();
    currentSeries = catalog.find(m => m.id === seriesId);

    if (!currentSeries) {
      alert('Không tìm thấy bộ truyện!');
      window.location.href = 'index.html';
      return;
    }

    currentChapter = currentSeries.chapters.find(c => c.id === chapId) || currentSeries.chapters[0];
    if (!currentChapter) {
      alert('Không tìm thấy chương truyện!');
      window.location.href = `detail.html?id=${seriesId}`;
      return;
    }

    totalPages = currentChapter.pages.length;
    currentPageIndex = Math.max(0, Math.min(initialPage, totalPages - 1));

    updateReaderHeader();
    populateChapterDropdown();
    renderPages();
    updateProgressUI();
    saveReadingHistory();

    if (typeof loadChapterNotebook === 'function') {
      loadChapterNotebook(seriesId, chapId);
    }

    document.title = `${currentChapter.title} - ${currentSeries.title}`;
  } catch (err) {
    console.error('Error loading chapter:', err);
  }
}

function updateReaderHeader() {
  const seriesNameEl = document.getElementById('readerSeriesName');
  const chapNameEl = document.getElementById('readerChapName');
  if (seriesNameEl) seriesNameEl.textContent = currentSeries.title;
  if (chapNameEl) chapNameEl.textContent = currentChapter.title;

  const backLink = document.getElementById('btnBackDetail');
  if (backLink) backLink.href = `detail.html?id=${currentSeries.id}`;
}

function populateChapterDropdown() {
  const select = document.getElementById('chapterSelect');
  if (!select) return;

  select.innerHTML = currentSeries.chapters.map(c => `
    <option value="${c.id}" ${c.id === currentChapter.id ? 'selected' : ''}>
      ${c.title}
    </option>
  `).join('');

  select.onchange = (e) => {
    switchChapter(e.target.value);
  };
}

let isPageNumberVisible = true; // Auto page numbering state

function createPageBadgeElement(pageNum, total) {
  const badge = document.createElement('div');
  badge.className = 'page-number-pill';
  badge.innerHTML = `<i class="fas fa-file-alt" style="font-size: 0.68rem; color: var(--accent-primary);"></i> <span>Trang ${pageNum} / ${total}</span>`;
  if (!isPageNumberVisible) badge.style.display = 'none';
  return badge;
}

function createPageDividerElement(pageNum, total) {
  const divider = document.createElement('div');
  divider.className = 'webtoon-page-divider';
  const chapTitle = currentChapter ? currentChapter.title : '';
  divider.innerHTML = `
    <div class="divider-line"></div>
    <div class="divider-badge">
      <i class="fas fa-layer-group" style="color: var(--accent-secondary); font-size: 0.72rem;"></i> 
      <span>Trang ${pageNum} / ${total} • ${chapTitle}</span>
    </div>
    <div class="divider-line"></div>
  `;
  if (!isPageNumberVisible) divider.style.display = 'none';
  return divider;
}

function createPageSkeletonElement(pageNum) {
  const skeleton = document.createElement('div');
  skeleton.className = 'page-skeleton-placeholder';
  skeleton.innerHTML = `
    <div class="skeleton-shimmer"></div>
    <div class="skeleton-content">
      <div class="skeleton-spinner"></div>
      <span><i class="fas fa-layer-group" style="color: var(--accent-secondary); margin-right: 4px;"></i> Đang tải Trang ${pageNum}...</span>
    </div>
  `;
  return skeleton;
}

function setupPageImageSkeleton(img, pageWrapper, skeletonEl) {
  const markLoaded = () => {
    pageWrapper.classList.add('is-loaded');
    if (skeletonEl) {
      skeletonEl.classList.add('fade-out');
      setTimeout(() => {
        if (skeletonEl && skeletonEl.parentNode) {
          skeletonEl.remove();
        }
      }, 320);
    }
  };

  if (img.complete && img.naturalWidth > 0) {
    markLoaded();
  } else {
    img.addEventListener('load', markLoaded, { once: true });
    img.addEventListener('error', () => {
      pageWrapper.classList.add('is-loaded');
      if (skeletonEl) {
        skeletonEl.innerHTML = `
          <div class="skeleton-error">
            <i class="fas fa-exclamation-triangle" style="color: #f59e0b; font-size: 1.3rem;"></i>
            <span>Không thể tải ảnh trang</span>
          </div>
        `;
      }
    }, { once: true });
  }
}

function renderPages() {
  const viewport = document.getElementById('readerViewport');
  if (!viewport) return;

  viewport.className = `reader-viewport mode-${readerMode}`;
  viewport.innerHTML = '';

  const canvasLayer = document.createElement('div');
  canvasLayer.id = 'mangaCanvasLayer';
  canvasLayer.className = 'manga-canvas-layer';
  viewport.appendChild(canvasLayer);

  if (readerMode === 'webtoon') {
    // Render all pages in a vertical stack
    currentChapter.pages.forEach((page, idx) => {
      // Add stylish between-page divider for page 2 onwards
      if (idx > 0) {
        canvasLayer.appendChild(createPageDividerElement(idx + 1, totalPages));
      }

      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'reader-page-wrapper';
      pageWrapper.id = `page-${idx + 1}`;
      pageWrapper.dataset.pageIndex = idx;

      const skeleton = createPageSkeletonElement(idx + 1);
      pageWrapper.appendChild(skeleton);

      const img = document.createElement('img');
      img.className = 'reader-page-img';
      img.src = page.imageUrl;
      img.alt = `Trang ${page.pageNumber}`;
      img.loading = idx < 3 ? 'eager' : 'lazy';

      pageWrapper.appendChild(img);
      pageWrapper.appendChild(createPageBadgeElement(idx + 1, totalPages));
      renderPageBubbles(page, pageWrapper);

      setupPageImageSkeleton(img, pageWrapper, skeleton);
      canvasLayer.appendChild(pageWrapper);
    });

    // Scroll to initial page if specified
    if (currentPageIndex > 0) {
      setTimeout(() => {
        const targetPage = document.getElementById(`page-${currentPageIndex + 1}`);
        if (targetPage) targetPage.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }

    initWebtoonScrollObserver();

  } else if (readerMode === 'single') {
    // Render only current page (Webtoon-like full natural width layout)
    const page = currentChapter.pages[currentPageIndex];
    if (!page) return;

    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'reader-page-wrapper';
    pageWrapper.id = `page-${currentPageIndex + 1}`;

    const skeleton = createPageSkeletonElement(currentPageIndex + 1);
    pageWrapper.appendChild(skeleton);

    const img = document.createElement('img');
    img.className = 'reader-page-img';
    img.src = page.imageUrl;
    img.alt = `Trang ${page.pageNumber}`;

    pageWrapper.appendChild(img);
    pageWrapper.appendChild(createPageBadgeElement(currentPageIndex + 1, totalPages));
    renderPageBubbles(page, pageWrapper);

    setupPageImageSkeleton(img, pageWrapper, skeleton);
    canvasLayer.appendChild(pageWrapper);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

// Intersection Observer for Webtoon Mode scroll tracking
function initWebtoonScrollObserver() {
  const pages = document.querySelectorAll('.reader-page-wrapper');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = parseInt(entry.target.dataset.pageIndex, 10);
        currentPageIndex = idx;
        updateProgressUI();
        saveReadingHistory();
      }
    });
  }, {
    rootMargin: '-30% 0px -30% 0px',
    threshold: 0.1
  });

  pages.forEach(p => observer.observe(p));
}

// Navigation Functions
function nextPage() {
  if (readerMode === 'webtoon') {
    if (currentPageIndex < totalPages - 1) {
      const target = document.getElementById(`page-${currentPageIndex + 2}`);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    } else {
      promptNextChapter();
    }
  } else {
    if (currentPageIndex < totalPages - 1) {
      currentPageIndex += 1;
      renderPages();
      updateProgressUI();
      saveReadingHistory();
    } else {
      promptNextChapter();
    }
  }
}

function prevPage() {
  if (readerMode === 'webtoon') {
    if (currentPageIndex > 0) {
      const target = document.getElementById(`page-${currentPageIndex}`);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    } else {
      promptPrevChapter();
    }
  } else {
    if (currentPageIndex > 0) {
      currentPageIndex -= 1;
      renderPages();
      updateProgressUI();
      saveReadingHistory();
    } else {
      promptPrevChapter();
    }
  }
}

function jumpToPage(pageIndex) {
  currentPageIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));
  if (readerMode === 'webtoon') {
    const target = document.getElementById(`page-${currentPageIndex + 1}`);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  } else {
    renderPages();
  }
  updateProgressUI();
  saveReadingHistory();
}

function updateProgressUI() {
  const slider = document.getElementById('pageSlider');
  const counter = document.getElementById('pageCounter');

  if (slider) {
    slider.max = totalPages;
    slider.value = currentPageIndex + 1;
  }

  if (counter) {
    counter.textContent = `${currentPageIndex + 1} / ${totalPages}`;
  }
}

function switchChapter(chapId) {
  window.location.href = `reader.html?series=${currentSeries.id}&chap=${chapId}`;
}

function promptNextChapter() {
  const currentIndex = currentSeries.chapters.findIndex(c => c.id === currentChapter.id);
  if (currentIndex < currentSeries.chapters.length - 1) {
    const nextChap = currentSeries.chapters[currentIndex + 1];
    if (confirm(`Bạn đã đọc hết chương này! Chuyển sang "${nextChap.title}"?`)) {
      switchChapter(nextChap.id);
    }
  } else {
    showToast('Bạn đã đọc đến chương mới nhất!');
  }
}

function promptPrevChapter() {
  const currentIndex = currentSeries.chapters.findIndex(c => c.id === currentChapter.id);
  if (currentIndex > 0) {
    const prevChap = currentSeries.chapters[currentIndex - 1];
    if (confirm(`Quay lại "${prevChap.title}"?`)) {
      switchChapter(prevChap.id);
    }
  }
}

// UI Controls & Settings
function initReaderControls() {
  // Page Slider input
  const slider = document.getElementById('pageSlider');
  if (slider) {
    slider.addEventListener('input', (e) => {
      jumpToPage(parseInt(e.target.value, 10) - 1);
    });
  }

  // Next/Prev Chapter buttons
  const btnPrevChap = document.getElementById('btnPrevChap');
  const btnNextChap = document.getElementById('btnNextChap');
  if (btnPrevChap) btnPrevChap.onclick = promptPrevChapter;
  if (btnNextChap) btnNextChap.onclick = promptNextChapter;

  // Settings modal trigger
  const btnSettings = document.getElementById('btnSettings');
  const modalSettings = document.getElementById('readerSettingsModal');
  if (btnSettings && modalSettings) {
    btnSettings.onclick = () => modalSettings.classList.add('active');
  }

  // Close Settings modal
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  if (btnCloseSettings && modalSettings) {
    btnCloseSettings.onclick = () => modalSettings.classList.remove('active');
  }

  // Reader Mode buttons in settings: synchronize active state with readerMode
  const modeButtons = document.querySelectorAll('.btn-mode-toggle');
  modeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === readerMode);
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setReaderMode(btn.dataset.mode);
    });
  });

  // Auto Page Numbering Toggle
  const pageNumToggle = document.getElementById('pageNumberVisibleToggle');
  if (pageNumToggle) {
    pageNumToggle.checked = isPageNumberVisible;
    pageNumToggle.addEventListener('change', (e) => {
      setPageNumberVisibility(e.target.checked);
    });
  }

  // Ensure already-rendered DOM page elements strictly match saved setting
  applyPageNumberStyles();

  // Fullscreen button
  const btnFullscreen = document.getElementById('btnFullscreen');
  if (btnFullscreen) {
    btnFullscreen.onclick = toggleFullscreen;
  }
}

function applyPageNumberStyles() {
  document.querySelectorAll('.page-number-pill').forEach(el => {
    el.style.display = isPageNumberVisible ? 'inline-flex' : 'none';
  });

  document.querySelectorAll('.webtoon-page-divider').forEach(el => {
    el.style.display = isPageNumberVisible ? 'flex' : 'none';
  });
}

function setPageNumberVisibility(visible) {
  isPageNumberVisible = visible;
  localStorage.setItem('edumanga_show_page_numbers', visible);
  applyPageNumberStyles();
  showToast(visible ? 'Đã bật đánh số trang tự động' : 'Đã ẩn số trang trên tranh');
}

function setReaderMode(mode) {
  readerMode = mode;
  localStorage.setItem('edumanga_reader_mode', mode);
  updateTouchZones();
  renderPages();
  showToast(`Chế độ đọc: ${mode.toUpperCase()}`);
}

function updateTouchZones() {
  const container = document.querySelector('.touch-zone-container');
  if (container) {
    if (readerMode === 'webtoon') {
      container.classList.remove('active-zones');
    } else {
      container.classList.add('active-zones');
    }
  }
}

function setReaderTheme(theme) {
  document.body.className = `reader-body theme-${theme}`;
  localStorage.setItem('edumanga_reader_theme', theme);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(console.error);
    isFullscreen = true;
  } else {
    document.exitFullscreen().catch(console.error);
    isFullscreen = false;
  }
}

function toggleMenuVisibility() {
  isMenuVisible = !isMenuVisible;
  const header = document.querySelector('.reader-header');
  const bottomBar = document.querySelector('.reader-bottom-bar');
  if (header) header.classList.toggle('hidden', !isMenuVisible);
  if (bottomBar) bottomBar.classList.toggle('hidden', !isMenuVisible);
}

// Touch Zone Gestures
function initTouchZones() {
  const viewport = document.getElementById('readerViewport');

  if (viewport) {
    viewport.addEventListener('click', (e) => {
      // If click was on a speech bubble or interactive vocabulary word, do nothing
      if (e.target.closest('.bubble-overlay') || e.target.closest('.vocab-interactive') || e.target.closest('.vocab-popover')) {
        return;
      }

      if (readerMode === 'webtoon') {
        toggleMenuVisibility();
      } else {
        const xRatio = e.clientX / window.innerWidth;
        if (xRatio < 0.25) {
          prevPage();
        } else if (xRatio > 0.75) {
          nextPage();
        } else {
          toggleMenuVisibility();
        }
      }
    });
  }
}

// Keyboard Navigation (Uses native browser zoom Ctrl +/- / wheel)
function initKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      nextPage();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      prevPage();
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    } else if (e.key === 's' || e.key === 'S') {
      openCurrentPageScript();
    } else if (e.key === 'b' || e.key === 'B') {
      const toggle = document.getElementById('bubblesVisibleToggle');
      if (toggle) {
        toggle.checked = !toggle.checked;
        setBubblesVisibility(toggle.checked);
      }
    } else if (e.key === 'm' || e.key === 'M') {
      toggleMenuVisibility();
    }
  });
}

// Clean up any legacy zoom localStorage on load
try {
  localStorage.removeItem('edumanga_manga_zoom');
  document.documentElement.style.removeProperty('--manga-zoom-scale');
} catch (e) {}



function saveReadingHistory() {
  if (!currentSeries || !currentChapter) return;
  const data = {
    seriesId: currentSeries.id,
    seriesTitle: currentSeries.title,
    chapterId: currentChapter.id,
    chapterTitle: currentChapter.title,
    pageNumber: currentPageIndex + 1,
    timestamp: Date.now()
  };
  localStorage.setItem('edumanga_last_read', JSON.stringify(data));

  // Sync reading progress to Cloud Firestore
  if (window.syncEngine && typeof window.syncEngine.saveReadingProgress === 'function') {
    window.syncEngine.saveReadingProgress(currentSeries.id, currentChapter.id, currentPageIndex + 1);
  }
}
