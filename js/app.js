/* ==========================================================================
   EDUMANGA HUB - HOMEPAGE CONTROLLER
   Search, Category Filtering, Continue Reading, Catalog Rendering
   ========================================================================== */

let allMangaData = [];
let activeCategory = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  await loadMangaCatalog();
  initSearch();
  initCategoryFilters();
  renderContinueReading();
  initHeaderScroll();
});

// Load Manga Data from JSON
async function loadMangaCatalog() {
  try {
    const response = await fetch('data/manga.json');
    if (!response.ok) throw new Error('Cannot load manga.json');
    allMangaData = await response.json();
    renderMangaGrid(allMangaData);
    renderHeroFeatured(allMangaData[1] || allMangaData[0]); // Default to TTHCM or N2
  } catch (err) {
    console.error('Error fetching manga catalog:', err);
  }
}

// Render Hero Banner
function renderHeroFeatured(featured) {
  if (!featured) return;
  const heroSection = document.getElementById('heroBanner');
  if (!heroSection) return;

  heroSection.innerHTML = `
    <div class="hero-banner">
      <div class="hero-content">
        <span class="hero-tag"><i class="fas fa-fire"></i> Bộ Truyện Nổi Bật</span>
        <h1 class="hero-title">${featured.title}</h1>
        <p class="hero-desc">${featured.description}</p>
        <div class="hero-actions">
          <a href="detail.html?id=${featured.id}" class="btn-primary">
            <i class="fas fa-book-open"></i> Xem Chi Tiết
          </a>
          <a href="reader.html?series=${featured.id}&chap=${featured.chapters[0]?.id || 'chap-01'}" class="btn-secondary">
            <i class="fas fa-play"></i> Đọc Chương 1
          </a>
        </div>
      </div>
      <div class="hero-preview">
        <a href="detail.html?id=${featured.id}" class="hero-cover-stack">
          <img src="${featured.cover}" alt="${featured.title}" onerror="this.src='assets/covers/n2_cover.jpg'">
        </a>
      </div>
    </div>
  `;
}

// Render Grid
function renderMangaGrid(mangaList) {
  const grid = document.getElementById('mangaGrid');
  if (!grid) return;

  if (mangaList.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
        <i class="fas fa-search" style="font-size: 2.5rem; margin-bottom: 1rem; display: block;"></i>
        <p>Không tìm thấy bộ truyện nào phù hợp.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = mangaList.map(m => `
    <div class="manga-card" data-id="${m.id}">
      <a href="detail.html?id=${m.id}" class="card-cover-wrapper">
        <span class="card-badge">${m.badge || 'Mới'}</span>
        <span class="card-category">${m.category}</span>
        <img class="card-cover" src="${m.cover}" alt="${m.title}" loading="lazy" onerror="this.src='assets/covers/n2_cover.jpg'">
      </a>
      <div class="card-content">
        <a href="detail.html?id=${m.id}">
          <h3 class="card-title" title="${m.title}">${m.title}</h3>
        </a>
        <div class="card-meta">
          <span class="card-meta-item">
            <i class="fas fa-layer-group" style="color: var(--accent-tertiary)"></i> ${m.chapters?.length || 0} chương
          </span>
          <span class="card-meta-item">
            <i class="fas fa-star"></i> ${m.rating}
          </span>
          <span class="card-meta-item">
            <i class="fas fa-eye" style="color: var(--text-muted)"></i> ${m.views}
          </span>
        </div>
      </div>
    </div>
  `).join('');
}

// Category Filtering
function initCategoryFilters() {
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.dataset.category;

      if (activeCategory === 'all') {
        renderMangaGrid(allMangaData);
      } else {
        const filtered = allMangaData.filter(m => m.categoryKey === activeCategory);
        renderMangaGrid(filtered);
      }
    });
  });
}

// Live Search with Dropdown
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchDropdown = document.getElementById('searchDropdown');
  if (!searchInput || !searchDropdown) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      searchDropdown.classList.remove('active');
      return;
    }

    const matches = allMangaData.filter(m => 
      m.title.toLowerCase().includes(query) || 
      m.category.toLowerCase().includes(query) ||
      m.author.toLowerCase().includes(query)
    );

    if (matches.length > 0) {
      searchDropdown.innerHTML = matches.map(m => `
        <a href="detail.html?id=${m.id}" class="search-result-item">
          <img src="${m.cover}" class="search-thumb" alt="${m.title}" onerror="this.src='assets/covers/n2_cover.jpg'">
          <div class="search-item-info">
            <div class="search-item-title">${m.title}</div>
            <div class="search-item-cat">${m.category} • ${m.chapters.length} chương</div>
          </div>
        </a>
      `).join('');
      searchDropdown.classList.add('active');
    } else {
      searchDropdown.innerHTML = `
        <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          Không tìm thấy kết quả nào cho "${e.target.value}"
        </div>
      `;
      searchDropdown.classList.add('active');
    }
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.classList.remove('active');
    }
  });
}

// Continue Reading from LocalStorage
function renderContinueReading() {
  const resumeContainer = document.getElementById('resumeContainer');
  if (!resumeContainer) return;

  const lastRead = JSON.parse(localStorage.getItem('edumanga_last_read') || 'null');
  if (!lastRead) {
    resumeContainer.style.display = 'none';
    return;
  }

  resumeContainer.innerHTML = `
    <div class="resume-banner">
      <div class="resume-info">
        <div class="resume-icon">
          <i class="fas fa-history"></i>
        </div>
        <div>
          <div class="resume-title">Tiếp tục đọc: ${lastRead.seriesTitle}</div>
          <div class="resume-sub">${lastRead.chapterTitle} • Trang ${lastRead.pageNumber}</div>
        </div>
      </div>
      <a href="reader.html?series=${lastRead.seriesId}&chap=${lastRead.chapterId}&page=${lastRead.pageNumber}" class="btn-primary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">
        <i class="fas fa-arrow-right"></i> Đọc Tiếp
      </a>
    </div>
  `;
  resumeContainer.style.display = 'block';
}

// Header Scroll Glass Effect
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Bookmarks / Tủ Sách Modal Controller
function openBookmarkModal() {
  const modal = document.getElementById('bookmarkModal');
  const container = document.getElementById('bookmarkListContent');
  if (!modal || !container) return;

  const bookmarkIds = JSON.parse(localStorage.getItem('edumanga_bookmarks') || '[]');
  const bookmarkedSeries = allMangaData.filter(m => bookmarkIds.includes(m.id));

  if (bookmarkedSeries.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
        <i class="far fa-bookmark" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--accent-primary); display: block;"></i>
        <p style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.3rem;">Tủ sách đang trống</p>
        <p style="font-size: 0.85rem;">Bạn có thể nhấn "Lưu Vào Tủ Sách" ở trang chi tiết truyện để lưu lại.</p>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 60vh; overflow-y: auto;">
        ${bookmarkedSeries.map(m => `
          <div style="display: flex; gap: 1rem; align-items: center; background: var(--bg-tertiary); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <img src="${m.cover}" style="width: 50px; height: 65px; object-fit: cover; border-radius: var(--radius-sm);" onerror="this.src='assets/covers/n2_cover.jpg'">
            <div style="flex: 1; min-width: 0;">
              <a href="detail.html?id=${m.id}" style="font-weight: 700; color: var(--text-highlight); font-size: 0.95rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${m.title}
              </a>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                ${m.category} • ${m.chapters?.length || 0} chương
              </div>
            </div>
            <a href="reader.html?series=${m.id}&chap=${m.chapters[0]?.id || 'chap-01'}" class="btn-read" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
              <i class="fas fa-play"></i> Đọc
            </a>
            <button class="btn-icon" onclick="removeBookmark('${m.id}')" title="Bỏ lưu" style="width: 32px; height: 32px; color: var(--accent-secondary);">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  modal.classList.add('active');
}

function closeBookmarkModal() {
  const modal = document.getElementById('bookmarkModal');
  if (modal) modal.classList.remove('active');
}

function openHelpModal() {
  const modal = document.getElementById('helpModal');
  if (modal) modal.classList.add('active');
}

function closeHelpModal() {
  const modal = document.getElementById('helpModal');
  if (modal) modal.classList.remove('active');
}

function removeBookmark(seriesId) {
  let bookmarkIds = JSON.parse(localStorage.getItem('edumanga_bookmarks') || '[]');
  bookmarkIds = bookmarkIds.filter(id => id !== seriesId);
  localStorage.setItem('edumanga_bookmarks', JSON.stringify(bookmarkIds));
  openBookmarkModal(); // re-render
}

// Manual / Triggered Auto Sync
async function triggerManualSync() {
  const syncBtn = document.getElementById('btnSyncManga');
  const icon = syncBtn?.querySelector('i');
  if (icon) icon.classList.add('fa-spin');

  try {
    const res = await fetch('/api/sync');
    if (res.ok) {
      const data = await res.json();
      await loadMangaCatalog();
      showToast(`⚡ Đã đồng bộ ${data.seriesCount} môn học & ${data.chaptersCount} chương (${data.elapsed}s)!`);
    } else {
      await loadMangaCatalog();
      showToast('Đã làm mới danh mục truyện!');
    }
  } catch (err) {
    await loadMangaCatalog();
    showToast('Đã làm mới dữ liệu từ bộ nhớ!');
  } finally {
    if (icon) {
      setTimeout(() => icon.classList.remove('fa-spin'), 600);
    }
  }
}

// Global Keyboard Shortcuts (Ctrl + Shift + S for Quick Sync)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
    e.preventDefault();
    triggerManualSync();
  }
});

function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fas fa-bolt" style="color: var(--accent-warning);"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

