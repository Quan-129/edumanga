/* ==========================================================================
   EDUMANGA HUB - HOMEPAGE CONTROLLER
   Search, Category Filtering, Continue Reading, Catalog & Admin Creation
   ========================================================================== */

let allMangaData = [];
let activeCategory = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  await loadMangaCatalog();
  initSearch();
  initCategoryFilters();
  renderContinueReading();
  initHeaderScroll();

  // Re-render when auth state changes (to show/hide Admin Add Manga card)
  if (window.authService && typeof window.authService.onAuthStateChange === 'function') {
    window.authService.onAuthStateChange(() => {
      renderMangaGrid(getFilteredMangaList());
    });
  }

  window.addEventListener('edumanga:auth_changed', () => {
    renderMangaGrid(getFilteredMangaList());
  });
});

// Helper: Get merged manga catalog (Data JSON + Custom Additions from LocalStorage with Deletion Blacklist)
async function getFullMangaCatalog() {
  if (window.dbStorage && typeof window.dbStorage.getFullMangaCatalog === 'function') {
    return await window.dbStorage.getFullMangaCatalog();
  }
  return [];
}

function saveCustomCatalogToStorage(catalog) {
  try {
    localStorage.setItem('edumanga_custom_catalog', JSON.stringify(catalog));
  } catch (e) {
    console.error("Error saving custom catalog to localStorage:", e);
  }
}

// Load Manga Data from JSON & LocalStorage
async function loadMangaCatalog() {
  try {
    allMangaData = await getFullMangaCatalog();
    renderMangaGrid(allMangaData);
    renderHeroFeatured(allMangaData[1] || allMangaData[0]);
  } catch (err) {
    console.error('Error loading manga catalog:', err);
  }
}

function getFilteredMangaList() {
  if (activeCategory === 'all') return allMangaData;
  return allMangaData.filter(m => {
    const key = (m.categoryKey || m.category || '').toLowerCase();
    return key === activeCategory || (activeCategory === 'pldc' && (key.includes('phap-luat') || key.includes('pháp luật')));
  });
}

// Render Hero Banner
function renderHeroFeatured(featured) {
  if (!featured) return;
  const heroSection = document.getElementById('heroBanner');
  if (!heroSection) return;

  const firstChapId = (featured.chapters && featured.chapters[0]) ? featured.chapters[0].id : 'chap-01';

  heroSection.innerHTML = `
    <div class="hero-banner">
      <div class="hero-content">
        <span class="hero-tag"><i class="fas fa-fire"></i> Bộ Truyện Nổi Bật</span>
        <h1 class="hero-title">${escapeHtml(featured.title)}</h1>
        <p class="hero-desc">${escapeHtml(featured.description || '')}</p>
        <div class="hero-actions">
          <a href="detail.html?id=${featured.id}" class="btn-primary">
            <i class="fas fa-book-open"></i> Xem Chi Tiết
          </a>
          <a href="reader.html?series=${featured.id}&chap=${firstChapId}" class="btn-secondary">
            <i class="fas fa-play"></i> Đọc Chương 1
          </a>
        </div>
      </div>
      <div class="hero-preview">
        <a href="detail.html?id=${featured.id}" class="hero-cover-stack">
          <img src="${window.getSeriesCover ? window.getSeriesCover(featured) : (featured.cover || 'assets/covers/n2_cover.jpg')}" alt="${featured.title}" onerror="this.src='assets/covers/n2_cover.jpg'">
        </a>
      </div>
    </div>
  `;
}

// Render Grid (Includes Admin Add Card if user is Admin)
function renderMangaGrid(mangaList) {
  const grid = document.getElementById('mangaGrid');
  if (!grid) return;

  const isAdmin = window.authService && typeof window.authService.isAdmin === 'function' && window.authService.isAdmin();

  let adminAddCardHtml = '';
  if (isAdmin) {
    adminAddCardHtml = `
      <div class="manga-card admin-add-card" onclick="openAdminAddSeriesModal()" title="Thêm bộ truyện tranh mới vào hệ thống">
        <div class="admin-add-card-inner">
          <div class="admin-add-icon-box">
            <i class="fas fa-plus"></i>
          </div>
          <h3 class="admin-add-title">Thêm Bộ Truyện Mới</h3>
          <p class="admin-add-desc">Đặt tên, chọn danh mục, ảnh bìa & nạp kịch bản JSON</p>
          <span class="admin-badge"><i class="fas fa-crown"></i> Quản Trị Viên</span>
        </div>
      </div>
    `;
  }

  if (mangaList.length === 0 && !isAdmin) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
        <i class="fas fa-search" style="font-size: 2.5rem; margin-bottom: 1rem; display: block;"></i>
        <p>Không tìm thấy bộ truyện nào phù hợp.</p>
      </div>
    `;
    return;
  }

  const cardsHtml = mangaList.map(m => {
    const chapCount = (m.chapters || []).length;
    const adminActionsHtml = isAdmin ? `
      <div class="admin-card-actions">
        <button type="button" class="btn-admin-card-action btn-admin-edit" onclick="openAdminEditSeriesModal('${m.id}', event)" title="Chỉnh sửa thông tin bộ truyện">
          <i class="fas fa-pen"></i>
        </button>
        <button type="button" class="btn-admin-card-action btn-admin-del" onclick="adminDeleteSeries('${m.id}', event)" title="Xóa bộ truyện này">
          <i class="fas fa-trash-can"></i>
        </button>
      </div>
    ` : '';

    return `
      <div class="manga-card" data-id="${m.id}">
        <a href="detail.html?id=${m.id}" class="card-cover-wrapper">
          <span class="card-badge">${escapeHtml(m.badge || 'Mới')}</span>
          <span class="card-category">${escapeHtml(m.category)}</span>
          <img class="card-cover" src="${window.getSeriesCover ? window.getSeriesCover(m) : (m.cover || 'assets/covers/n2_cover.jpg')}" alt="${escapeHtml(m.title)}" loading="lazy" onerror="this.src='assets/covers/n2_cover.jpg'">
          ${adminActionsHtml}
        </a>
        <div class="card-info">
          <a href="detail.html?id=${m.id}" class="card-title" title="${escapeHtml(m.title)}">${escapeHtml(m.title)}</a>
          <div class="card-meta">
            <span><i class="fas fa-layer-group"></i> ${chapCount} chương</span>
            <span><i class="fas fa-star" style="color: #facc15;"></i> ${m.rating || '5.0'}</span>
            <span><i class="fas fa-eye"></i> ${m.views || '1K'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.innerHTML = adminAddCardHtml + cardsHtml;
}

// Category Filters
function initCategoryFilters() {
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-category');
      renderMangaGrid(getFilteredMangaList());
    });
  });
}

// Realtime Search with Dropdown
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchDropdown = document.getElementById('searchDropdown');
  if (!searchInput || !searchDropdown) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      searchDropdown.style.display = 'none';
      renderMangaGrid(getFilteredMangaList());
      return;
    }

    const matches = allMangaData.filter(m => 
      m.title.toLowerCase().includes(query) || 
      m.category.toLowerCase().includes(query) ||
      (m.description || '').toLowerCase().includes(query)
    );

    renderSearchDropdown(matches, query);
    renderMangaGrid(matches);
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.style.display = 'none';
    }
  });
}

function renderSearchDropdown(matches, query) {
  const searchDropdown = document.getElementById('searchDropdown');
  if (!searchDropdown) return;

  if (matches.length === 0) {
    searchDropdown.innerHTML = `<div class="search-drop-item" style="color: var(--text-muted);">Không tìm thấy kết quả cho "${escapeHtml(query)}"</div>`;
    searchDropdown.style.display = 'block';
    return;
  }

  searchDropdown.innerHTML = matches.slice(0, 5).map(m => `
    <a href="detail.html?id=${m.id}" class="search-drop-item">
      <img src="${window.getSeriesCover ? window.getSeriesCover(m) : (m.cover || 'assets/covers/n2_cover.jpg')}" alt="${escapeHtml(m.title)}" onerror="this.src='assets/covers/n2_cover.jpg'">
      <div>
        <div style="font-weight: 700; color: #fff;">${escapeHtml(m.title)}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(m.category)} • ${(m.chapters || []).length} chương</div>
      </div>
    </a>
  `).join('');
  searchDropdown.style.display = 'block';
}

// Resume Reading Banner
function renderContinueReading() {
  const container = document.getElementById('resumeContainer');
  if (!container) return;

  const historyRaw = localStorage.getItem('edumanga_reading_history');
  if (!historyRaw) return;

  try {
    const history = JSON.parse(historyRaw);
    if (!history.seriesId || !history.chapterId) return;

    const series = allMangaData.find(m => m.id === history.seriesId);
    if (!series) return;

    const chapter = (series.chapters || []).find(c => c.id === history.chapterId);
    const chapTitle = chapter ? chapter.title : history.chapterId;
    const pageNum = (history.pageIndex || 0) + 1;

    container.innerHTML = `
      <div class="resume-card">
        <div class="resume-info">
          <i class="fas fa-bookmark" style="color: #38bdf8; font-size: 1.4rem;"></i>
          <div>
            <div style="font-size: 0.82rem; color: #94a3b8; font-weight: 600;">TIẾP TỤC ĐỌC DỞ:</div>
            <div style="font-weight: 800; color: #fff; font-size: 1.05rem;">${escapeHtml(series.title)} • <span style="color: #38bdf8;">${escapeHtml(chapTitle)}</span> (Trang ${pageNum})</div>
          </div>
        </div>
        <a href="reader.html?series=${series.id}&chap=${history.chapterId}&page=${pageNum}" class="btn-primary" style="padding: 10px 20px; font-size: 0.92rem;">
          <i class="fas fa-play"></i> Đọc Tiếp
        </a>
      </div>
    `;
  } catch (e) {
    console.warn("Could not render resume banner:", e);
  }
}

function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });
}

// --------------------------------------------------------------------------
// ADMIN ACTIONS & MODAL CONTROLLERS
// --------------------------------------------------------------------------

function openAdminAddSeriesModal() {
  const modal = document.getElementById('adminAddSeriesModal');
  if (!modal) return;
  modal.classList.add('active');
  const titleInput = document.getElementById('adminSeriesTitle');
  if (titleInput) titleInput.focus();
}

function closeAdminAddSeriesModal() {
  const modal = document.getElementById('adminAddSeriesModal');
  if (modal) modal.classList.remove('active');
}

// Auto-generate slug ID from title
function handleAdminSeriesTitleInput(value) {
  const slugInput = document.getElementById('adminSeriesId');
  if (slugInput && !slugInput.dataset.manualEdited) {
    slugInput.value = slugifyText(value);
  }
}

function handleAdminSeriesSlugManualEdit() {
  const slugInput = document.getElementById('adminSeriesId');
  if (slugInput) slugInput.dataset.manualEdited = 'true';
}

function slugifyText(text) {
  if (!text) return '';
  let str = text.toLowerCase().trim();
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  str = str.replace(/[đĐ]/g, 'd');
  str = str.replace(/[^a-z0-9]+/g, '-');
  return str.replace(/^-+|-+$/g, '');
}

// Handle Image Cover Upload (Preview as Data URL)
function handleAdminSeriesCoverUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const previewImg = document.getElementById('adminCoverPreview');
    const previewBox = document.getElementById('adminCoverPreviewBox');
    const urlInput = document.getElementById('adminSeriesCoverUrl');
    if (previewImg) previewImg.src = e.target.result;
    if (previewBox) previewBox.style.display = 'inline-block';
    if (urlInput) urlInput.value = e.target.result; // Store base64 data URL
  };
  reader.readAsDataURL(file);
}

// Remove / Clear Cover
function adminRemoveCover(type = 'create') {
  const isCreate = (type === 'create');
  const fileInput = document.getElementById(isCreate ? 'adminSeriesCoverFile' : 'adminEditSeriesCoverFile');
  const urlInput = document.getElementById(isCreate ? 'adminSeriesCoverUrl' : 'adminEditSeriesCoverUrl');
  const previewBox = document.getElementById(isCreate ? 'adminCoverPreviewBox' : 'adminEditCoverPreviewBox');
  const previewImg = document.getElementById(isCreate ? 'adminCoverPreview' : 'adminEditCoverPreview');

  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
  if (previewImg) previewImg.src = '';
  if (previewBox) previewBox.style.display = 'none';
}

// Live URL Input for Cover
function handleAdminCoverUrlInput(type, val) {
  const trimmed = (val || '').trim();
  const boxId = (type === 'create') ? 'adminCoverPreviewBox' : 'adminEditCoverPreviewBox';
  const imgId = (type === 'create') ? 'adminCoverPreview' : 'adminEditCoverPreview';
  const previewBox = document.getElementById(boxId);
  const previewImg = document.getElementById(imgId);
  if (!previewBox || !previewImg) return;

  if (trimmed) {
    previewImg.src = trimmed;
    previewBox.style.display = 'inline-block';
  } else {
    previewImg.src = '';
    previewBox.style.display = 'none';
  }
}

// Create New Series
async function handleAdminCreateSeries(e) {
  e.preventDefault();
  const title = document.getElementById('adminSeriesTitle').value.trim();
  const id = (document.getElementById('adminSeriesId').value.trim()) || slugifyText(title);
  const categorySelect = document.getElementById('adminSeriesCategory');
  const category = categorySelect.options[categorySelect.selectedIndex].text;
  const categoryKey = categorySelect.value;
  const badge = document.getElementById('adminSeriesBadge').value.trim() || 'Mới';
  const author = document.getElementById('adminSeriesAuthor').value.trim() || 'TBMQ / Admin';
  const desc = document.getElementById('adminSeriesDesc').value.trim() || 'Bộ truyện tranh kiến thức mới được khởi tạo.';
  const coverUrl = document.getElementById('adminSeriesCoverUrl').value.trim();

  if (!title || !id) {
    showToast("⚠️ Vui lòng nhập đầy đủ tên bộ truyện!");
    return;
  }

  // Check if exists
  const existing = allMangaData.find(m => m.id === id);
  if (existing) {
    if (!confirm(`Bộ truyện ID "${id}" đã tồn tại. Bạn có muốn ghi đè cập nhật thông tin không?`)) {
      return;
    }
  }

  const newSeries = {
    id: id,
    title: title,
    folder: title,
    category: category,
    categoryKey: categoryKey,
    badge: badge,
    status: 'Đang phát hành',
    author: author,
    rating: 5.0,
    views: '1',
    likes: '1',
    description: desc,
    cover: coverUrl,
    characters: [],
    chapters: []
  };

  // Load custom catalog and save
  let customCatalog = [];
  try {
    const raw = localStorage.getItem('edumanga_custom_catalog');
    if (raw) customCatalog = JSON.parse(raw);
  } catch (err) {
    customCatalog = [];
  }

  // Un-blacklist this series if previously deleted
  try {
    let deletedSeriesIds = JSON.parse(localStorage.getItem('edumanga_deleted_series_ids') || '[]');
    deletedSeriesIds = deletedSeriesIds.filter(x => x !== id);
    localStorage.setItem('edumanga_deleted_series_ids', JSON.stringify(deletedSeriesIds));
  } catch (e) {}

  // Remove existing if any, then prepend
  customCatalog = customCatalog.filter(m => m.id !== id);
  customCatalog.unshift(newSeries);
  saveCustomCatalogToStorage(customCatalog);

  // Reload and refresh
  await loadMangaCatalog();
  closeAdminAddSeriesModal();
  showToast(`🎉 Đã tạo bộ truyện "${title}" thành công!`);

  // Redirect to detail page so admin can immediately add Chapter 1
  setTimeout(() => {
    window.location.href = `detail.html?id=${id}`;
  }, 600);
}

// Open Admin Edit Series Modal
function openAdminEditSeriesModal(seriesId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const series = allMangaData.find(m => m.id === seriesId);
  if (!series) {
    showToast("⚠️ Không tìm thấy thông tin bộ truyện!");
    return;
  }

  document.getElementById('adminEditSeriesOriginalId').value = series.id;
  document.getElementById('adminEditSeriesTitle').value = series.title || '';
  document.getElementById('adminEditSeriesId').value = series.id;

  // Set category dropdown
  const catSelect = document.getElementById('adminEditSeriesCategory');
  if (catSelect) {
    let key = (series.categoryKey || '').toLowerCase();
    if (!key) {
      const catStr = (series.category || '').toLowerCase();
      if (catStr.includes('chính trị') || catStr.includes('tư tưởng')) key = 'tthcm';
      else if (catStr.includes('ngoại ngữ') || catStr.includes('jlpt') || catStr.includes('tiếng nhật')) key = 'n2';
      else if (catStr.includes('pháp luật') || catStr.includes('luật')) key = 'pldc';
      else if (catStr.includes('công nghệ') || catStr.includes('ai')) key = 'ai';
      else key = 'general';
    }
    catSelect.value = key;
  }

  document.getElementById('adminEditSeriesBadge').value = series.badge || '';
  document.getElementById('adminEditSeriesAuthor').value = series.author || 'TBMQ';

  const statusSelect = document.getElementById('adminEditSeriesStatus');
  if (statusSelect) {
    statusSelect.value = series.status || 'Đang phát hành';
  }

  document.getElementById('adminEditSeriesDesc').value = series.description || '';

  const coverUrlInput = document.getElementById('adminEditSeriesCoverUrl');
  if (coverUrlInput) {
    coverUrlInput.value = series.cover || '';
  }

  const previewBox = document.getElementById('adminEditCoverPreviewBox');
  const previewImg = document.getElementById('adminEditCoverPreview');
  if (previewImg && previewBox) {
    if (series.cover && series.cover.trim() !== '') {
      previewImg.src = series.cover;
      previewBox.style.display = 'inline-block';
    } else {
      previewImg.src = '';
      previewBox.style.display = 'none';
    }
  }

  const modal = document.getElementById('adminEditSeriesModal');
  if (modal) modal.classList.add('active');
}

function closeAdminEditSeriesModal() {
  const modal = document.getElementById('adminEditSeriesModal');
  if (modal) modal.classList.remove('active');
}

function handleAdminEditCoverUpload(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      const urlInput = document.getElementById('adminEditSeriesCoverUrl');
      if (urlInput) urlInput.value = dataUrl;
      const previewBox = document.getElementById('adminEditCoverPreviewBox');
      const previewImg = document.getElementById('adminEditCoverPreview');
      if (previewImg && previewBox) {
        previewImg.src = dataUrl;
        previewBox.style.display = 'inline-block';
      }
    };
    reader.readAsDataURL(file);
  }
}

async function handleAdminSaveEditedSeries(event) {
  if (event) event.preventDefault();

  const originalId = document.getElementById('adminEditSeriesOriginalId').value;
  const title = document.getElementById('adminEditSeriesTitle').value.trim();
  const categoryKey = document.getElementById('adminEditSeriesCategory').value;
  const catMap = {
    'ai': 'Công nghệ & AI',
    'tthcm': 'Lý luận chính trị',
    'n2': 'Ngoại ngữ & JLPT',
    'pldc': 'Pháp luật & Xã hội',
    'general': 'Kiến thức chuyên đề'
  };
  const category = catMap[categoryKey] || 'Kiến thức chuyên đề';
  const badge = document.getElementById('adminEditSeriesBadge').value.trim() || 'Mới';
  const author = document.getElementById('adminEditSeriesAuthor').value.trim() || 'TBMQ';
  const status = document.getElementById('adminEditSeriesStatus').value || 'Đang phát hành';
  const desc = document.getElementById('adminEditSeriesDesc').value.trim();
  const coverUrl = document.getElementById('adminEditSeriesCoverUrl').value.trim();

  if (!title || !originalId) {
    showToast("⚠️ Vui lòng nhập đầy đủ tên bộ truyện!");
    return;
  }

  let customCatalog = [];
  try {
    const raw = localStorage.getItem('edumanga_custom_catalog');
    if (raw) customCatalog = JSON.parse(raw);
  } catch (err) {
    customCatalog = [];
  }

  const existingCustomIndex = customCatalog.findIndex(m => m.id === originalId);
  const currentInMemory = allMangaData.find(m => m.id === originalId) || {};

  const updatedSeries = {
    ...currentInMemory,
    id: originalId,
    title: title,
    folder: title,
    category: category,
    categoryKey: categoryKey,
    badge: badge,
    status: status,
    author: author,
    description: desc,
    cover: coverUrl,
    characters: currentInMemory.characters || [],
    chapters: currentInMemory.chapters || []
  };

  if (existingCustomIndex >= 0) {
    customCatalog[existingCustomIndex] = {
      ...customCatalog[existingCustomIndex],
      ...updatedSeries
    };
  } else {
    customCatalog.push(updatedSeries);
  }

  saveCustomCatalogToStorage(customCatalog);

  // Reload catalog and refresh UI
  await loadMangaCatalog();
  closeAdminEditSeriesModal();
  showToast(`🎉 Đã cập nhật bộ truyện "${title}" thành công!`);
}

// Delete Series (Admin Only)
async function adminDeleteSeries(seriesId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const series = allMangaData.find(m => m.id === seriesId);
  const title = series ? series.title : seriesId;

  if (!confirm(`⚠️ Bạn có chắc chắn muốn xóa bộ truyện "${title}" khỏi hệ thống?`)) {
    return;
  }

  // 1. Add to deleted series blacklist
  try {
    let deletedSeriesIds = JSON.parse(localStorage.getItem('edumanga_deleted_series_ids') || '[]');
    if (!deletedSeriesIds.includes(seriesId)) {
      deletedSeriesIds.push(seriesId);
      localStorage.setItem('edumanga_deleted_series_ids', JSON.stringify(deletedSeriesIds));
    }
  } catch (err) {}

  // 2. Remove from customCatalog
  let customCatalog = [];
  try {
    const raw = localStorage.getItem('edumanga_custom_catalog');
    if (raw) customCatalog = JSON.parse(raw);
  } catch (err) {}

  customCatalog = customCatalog.filter(m => m.id !== seriesId);
  saveCustomCatalogToStorage(customCatalog);

  // 3. Remove all chapter pages in IndexedDB
  if (series && series.chapters) {
    for (const chap of series.chapters) {
      if (window.dbStorage && typeof window.dbStorage.deleteChapterPages === 'function') {
        await window.dbStorage.deleteChapterPages(seriesId, chap.id);
      }
    }
  }

  // 4. Remove from local memory and refresh UI
  allMangaData = allMangaData.filter(m => m.id !== seriesId);
  renderMangaGrid(getFilteredMangaList());
  showToast(`🗑️ Đã xóa vĩnh viễn bộ truyện "${title}"`);
}

// Export Catalog as JSON file for repo integration
function adminExportMangaJson() {
  const jsonStr = JSON.stringify(allMangaData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `manga_catalog_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("📥 Đã xuất file JSON danh mục truyện thành công!");
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(msg) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'app-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// Global Exports
window.openAdminAddSeriesModal = openAdminAddSeriesModal;
window.closeAdminAddSeriesModal = closeAdminAddSeriesModal;
window.openAdminEditSeriesModal = openAdminEditSeriesModal;
window.closeAdminEditSeriesModal = closeAdminEditSeriesModal;
window.handleAdminEditCoverUpload = handleAdminEditCoverUpload;
window.handleAdminSaveEditedSeries = handleAdminSaveEditedSeries;
window.handleAdminSeriesTitleInput = handleAdminSeriesTitleInput;
window.handleAdminSeriesSlugManualEdit = handleAdminSeriesSlugManualEdit;
window.handleAdminSeriesCoverUpload = handleAdminSeriesCoverUpload;
window.handleAdminCreateSeries = handleAdminCreateSeries;
window.adminDeleteSeries = adminDeleteSeries;
window.adminExportMangaJson = adminExportMangaJson;
window.adminRemoveCover = adminRemoveCover;
window.handleAdminCoverUrlInput = handleAdminCoverUrlInput;
