/* ==========================================================================
   EDUMANGA HUB - SERIES DETAIL CONTROLLER
   Character Roster, Chapter List, PDF Downloads, Bookmarks & Admin Chapter Creator
   Supports IndexedDB for Heavy 50MB+ Chapter JSONs & Base64 Images
   ========================================================================== */

let currentSeries = null;
let currentSeriesId = '';
let parsedChapterPagesData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentSeriesId = urlParams.get('id') || 'tu-tuong-ho-chi-minh';
  await loadSeriesDetail(currentSeriesId);

  // Re-render admin buttons when auth state changes
  if (window.authService && typeof window.authService.onAuthStateChange === 'function') {
    window.authService.onAuthStateChange(() => {
      if (currentSeries) {
        renderChapterList(currentSeries.chapters || []);
        renderSeriesInfo(currentSeries);
      }
    });
  }

  window.addEventListener('edumanga:auth_changed', () => {
    if (currentSeries) {
      renderChapterList(currentSeries.chapters || []);
      renderSeriesInfo(currentSeries);
    }
  });
});

// Helper: Get merged manga catalog (Data JSON + Custom Additions from LocalStorage)
async function getFullMangaCatalog() {
  let baseCatalog = [];
  try {
    const response = await fetch('data/manga.json');
    if (response.ok) {
      baseCatalog = await response.json();
    }
  } catch (err) {
    console.warn("Could not fetch data/manga.json:", err);
  }

  let customCatalog = [];
  try {
    const raw = localStorage.getItem('edumanga_custom_catalog');
    if (raw) customCatalog = JSON.parse(raw);
  } catch (e) {
    customCatalog = [];
  }

  const mergedMap = new Map();
  baseCatalog.forEach(m => mergedMap.set(m.id, { ...m }));

  customCatalog.forEach(custom => {
    if (mergedMap.has(custom.id)) {
      const existing = mergedMap.get(custom.id);
      const existingChaps = existing.chapters || [];
      const customChaps = custom.chapters || [];
      const chapMap = new Map();
      existingChaps.forEach(c => chapMap.set(c.id, c));
      customChaps.forEach(c => chapMap.set(c.id, c));

      mergedMap.set(custom.id, {
        ...existing,
        ...custom,
        chapters: Array.from(chapMap.values())
      });
    } else {
      mergedMap.set(custom.id, custom);
    }
  });

  return Array.from(mergedMap.values());
}

function saveCustomCatalogToStorage(catalog) {
  try {
    // Strip heavy base64 pages from metadata before saving to localStorage to prevent QuotaExceededError
    const lightCatalog = catalog.map(series => ({
      ...series,
      chapters: (series.chapters || []).map(ch => ({
        id: ch.id,
        title: ch.title,
        subtitle: ch.subtitle || '',
        releaseDate: ch.releaseDate || '',
        pagesCount: (ch.pages || []).length || ch.pagesCount || 0,
        pdfUrl: ch.pdfUrl || ''
      }))
    }));
    localStorage.setItem('edumanga_custom_catalog', JSON.stringify(lightCatalog));
  } catch (e) {
    console.error("Error saving custom catalog to localStorage:", e);
  }
}

async function loadSeriesDetail(seriesId) {
  try {
    const catalog = await getFullMangaCatalog();
    currentSeries = catalog.find(m => m.id === seriesId) || catalog[0];

    if (!currentSeries) {
      document.getElementById('detailContent').innerHTML = `
        <div style="text-align: center; padding: 4rem;">
          <h2>Không tìm thấy bộ truyện</h2>
          <a href="index.html" class="btn-primary" style="margin-top: 1rem;">Quay Lại Trang Chủ</a>
        </div>
      `;
      return;
    }

    renderSeriesInfo(currentSeries);
    renderCharacterRoster(currentSeries.characters || []);
    renderChapterList(currentSeries.chapters || []);
    document.title = `${currentSeries.title} - EduManga Hub`;
  } catch (err) {
    console.error('Error loading series detail:', err);
  }
}

function renderSeriesInfo(s) {
  const headerContainer = document.getElementById('seriesHeader');
  if (!headerContainer) return;

  const isAdmin = window.authService && typeof window.authService.isAdmin === 'function' && window.authService.isAdmin();

  headerContainer.innerHTML = `
    <div class="series-hero-card" style="
      background: var(--gradient-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: 2.5rem;
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 2.5rem;
      margin-bottom: 2.5rem;
      box-shadow: var(--shadow-lg);
    ">
      <div class="series-cover-wrapper" style="
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-neon);
        aspect-ratio: 3/4.2;
      ">
        <img src="${s.cover}" alt="${escapeHtml(s.title)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/covers/n2_cover.jpg'">
      </div>
      <div class="series-info-main" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; align-items: center;">
            <span class="card-badge" style="position: static;">${escapeHtml(s.badge || 'Manga')}</span>
            <span class="card-category" style="position: static;">${escapeHtml(s.category)}</span>
            <span style="background: rgba(16, 185, 129, 0.2); color: var(--accent-success); font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: var(--radius-sm); border: 1px solid rgba(16, 185, 129, 0.3);">
              ${escapeHtml(s.status || 'Đang phát hành')}
            </span>
            ${isAdmin ? `<span class="header-admin-pill" style="margin-left: auto;"><i class="fas fa-crown"></i> Quản Trị Viên</span>` : ''}
          </div>
          <h1 style="font-size: 2.2rem; font-weight: 900; margin-bottom: 0.75rem; color: #fff;">${escapeHtml(s.title)}</h1>
          <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
            ${escapeHtml(s.description || 'Chưa có mô tả tóm tắt.')}
          </p>
          <div style="display: flex; gap: 2rem; color: var(--text-secondary); font-size: 0.9rem;">
            <div><i class="fas fa-user-edit" style="color: var(--accent-primary);"></i> Tác giả: <strong>${escapeHtml(s.author || 'TBMQ')}</strong></div>
            <div><i class="fas fa-star" style="color: #facc15;"></i> Đánh giá: <strong>${s.rating || '5.0'} / 5</strong></div>
            <div><i class="fas fa-layer-group" style="color: #38bdf8;"></i> Số chương: <strong>${(s.chapters || []).length} chương</strong></div>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem; flex-wrap: wrap;">
          ${(s.chapters && s.chapters.length > 0) ? `
            <a href="reader.html?series=${s.id}&chap=${s.chapters[0].id}" class="btn-primary" style="padding: 12px 26px; font-size: 0.95rem;">
              <i class="fas fa-book-open"></i> Đọc Từ Chương 1
            </a>
          ` : ''}
          ${isAdmin ? `
            <button type="button" class="btn-secondary" onclick="openAdminEditSeriesModal()" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 11px 20px;">
              <i class="fas fa-pen-to-square" style="color: #38bdf8;"></i> <span>Sửa Thông Tin</span>
            </button>
            <button type="button" class="btn-primary" onclick="openAdminAddChapterModal()" style="background: linear-gradient(135deg, #0284c7, #6366f1); display: inline-flex; align-items: center; gap: 0.5rem; padding: 11px 20px;">
              <i class="fas fa-plus"></i> <span>Thêm Chương (JSON)</span>
            </button>
            <button type="button" class="btn-outline-admin" onclick="adminExportCurrentSeries()" title="Tải toàn bộ kịch bản và thông tin của bộ truyện này về máy">
              <i class="fas fa-cloud-arrow-down" style="color: #38bdf8;"></i> <span>Sao Lưu Bộ Truyện (JSON)</span>
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderCharacterRoster(characters) {
  const container = document.getElementById('characterGrid');
  const section = document.getElementById('characterSection');
  if (!container || !section) return;

  if (characters.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';

  container.innerHTML = characters.map(c => `
    <div class="character-card" onclick="openCharModal('${c.id}')" style="cursor: pointer;">
      <div class="character-avatar-wrapper">
        <img src="${c.avatar}" alt="${escapeHtml(c.name)}" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=${c.id}'">
      </div>
      <div class="character-name">${escapeHtml(c.name)}</div>
      <div class="character-role">${escapeHtml(c.role || '')}</div>
    </div>
  `).join('');
}

function renderChapterList(chapters) {
  const container = document.getElementById('chapterList');
  const sectionHeader = document.querySelector('#chapterSection .section-header');
  if (!container) return;

  const isAdmin = window.authService && typeof window.authService.isAdmin === 'function' && window.authService.isAdmin();

  if (sectionHeader) {
    sectionHeader.innerHTML = `
      <div>
        <h2 class="section-title">
          <i class="fas fa-list-ul" style="color: var(--accent-secondary);"></i> Danh Sách Các Chương
        </h2>
        <span style="color: var(--text-muted); font-size: 0.85rem;">Hỗ trợ đọc Webtoon mượt mà hoặc tải PDF</span>
      </div>
      ${isAdmin ? `
        <div style="display: flex; gap: 8px; align-items: center;">
          <button type="button" class="btn-primary" onclick="openAdminAddChapterModal()" style="padding: 8px 18px; font-size: 0.88rem; background: linear-gradient(135deg, #0284c7, #6366f1);">
            <i class="fas fa-plus"></i> <span>+ Thêm Chương (Nạp JSON)</span>
          </button>
        </div>
      ` : ''}
    `;
  }

  if (chapters.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
        <i class="fas fa-book-open" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 1rem; display: block;"></i>
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">Bộ truyện này hiện chưa có chương nào được nạp.</p>
        ${isAdmin ? `
          <button type="button" class="btn-primary" onclick="openAdminAddChapterModal()">
            <i class="fas fa-plus"></i> Nạp Chương 1 (File JSON)
          </button>
        ` : ''}
      </div>
    `;
    return;
  }

  container.innerHTML = chapters.map((chap, idx) => {
    const pagesCount = (chap.pages || []).length || chap.pagesCount || 0;
    const adminExportBtn = isAdmin ? `
      <button type="button" class="btn-icon btn-admin-export-chap" onclick="adminExportSingleChapter('${chap.id}', event)" title="Tải file JSON kịch bản chương này">
        <i class="fas fa-file-code"></i>
      </button>
    ` : '';
    const adminDeleteBtn = isAdmin ? `
      <button type="button" class="btn-icon text-danger" onclick="adminDeleteChapter('${chap.id}', event)" title="Xóa chương này" style="color: #f87171; width: 36px; height: 36px; border-radius: 50%; background: rgba(239, 68, 68, 0.15);">
        <i class="fas fa-trash-can"></i>
      </button>
    ` : '';

    return `
      <div class="chapter-item" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        padding: 1.25rem 1.75rem;
        border-radius: var(--radius-md);
        margin-bottom: 0.85rem;
        transition: all 0.2s ease;
      ">
        <div style="display: flex; align-items: center; gap: 1.5rem;">
          <div style="
            font-size: 1.25rem;
            font-weight: 800;
            color: var(--accent-primary);
            width: 36px;
          ">#${idx + 1}</div>
          <div>
            <div style="font-weight: 700; font-size: 1.05rem; color: #fff; margin-bottom: 0.25rem;">
              ${escapeHtml(chap.title)}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 1rem; flex-wrap: wrap;">
              <span><i class="fas fa-file-image"></i> ${pagesCount} trang</span>
              ${chap.releaseDate ? `<span><i class="fas fa-calendar-alt"></i> ${escapeHtml(chap.releaseDate)}</span>` : ''}
              ${chap.subtitle ? `<span><i class="fas fa-info-circle"></i> ${escapeHtml(chap.subtitle)}</span>` : ''}
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 0.6rem; align-items: center;">
          <a href="reader.html?series=${currentSeries.id}&chap=${chap.id}" class="btn-primary" style="padding: 9px 20px; font-size: 0.9rem;">
            <i class="fas fa-play"></i> Đọc Ngay
          </a>
          ${chap.pdfUrl ? `
            <a href="${chap.pdfUrl}" target="_blank" class="btn-icon" title="Tải file PDF chất lượng cao">
              <i class="fas fa-file-pdf" style="color: #f43f5e;"></i>
            </a>
          ` : ''}
          ${adminExportBtn}
          ${adminDeleteBtn}
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// ADMIN ADD CHAPTER & JSON NORMALIZATION
// --------------------------------------------------------------------------

function openAdminAddChapterModal() {
  const modal = document.getElementById('adminAddChapterModal');
  if (!modal) return;
  modal.classList.add('active');

  const existingChaps = (currentSeries && currentSeries.chapters) ? currentSeries.chapters : [];
  const nextNum = existingChaps.length + 1;

  const numInput = document.getElementById('adminChapterNumber');
  const idInput = document.getElementById('adminChapterId');
  const titleInput = document.getElementById('adminChapterTitle');

  if (numInput) numInput.value = nextNum;
  if (idInput) idInput.value = `chap-${String(nextNum).padStart(2, '0')}`;
  if (titleInput) {
    titleInput.value = `Chương ${nextNum}`;
    titleInput.focus();
  }

  // Reset file input & preview
  parsedChapterPagesData = null;
  const statusBox = document.getElementById('adminJsonStatusBox');
  if (statusBox) statusBox.style.display = 'none';
  const fileInput = document.getElementById('adminChapterJsonFile');
  if (fileInput) fileInput.value = '';
}

function closeAdminAddChapterModal() {
  const modal = document.getElementById('adminAddChapterModal');
  if (modal) modal.classList.remove('active');
}

function handleAdminChapterNumChange(val) {
  const num = parseInt(val, 10) || 1;
  const idInput = document.getElementById('adminChapterId');
  const titleInput = document.getElementById('adminChapterTitle');
  if (idInput && !idInput.dataset.manualEdited) {
    idInput.value = `chap-${String(num).padStart(2, '0')}`;
  }
  if (titleInput && !titleInput.dataset.manualEdited) {
    titleInput.value = `Chương ${num}`;
  }
}

// Normalize any JSON format (Base64, Overlays, Pages, Bubbles)
function normalizeUploadedPages(rawJson) {
  let rawPages = [];
  let detectedTitle = '';
  let detectedCharacters = [];

  if (Array.isArray(rawJson)) {
    rawPages = rawJson;
  } else if (rawJson && typeof rawJson === 'object') {
    if (rawJson.name) detectedTitle = rawJson.name;
    if (rawJson.title) detectedTitle = rawJson.title;
    if (Array.isArray(rawJson.characters)) detectedCharacters = rawJson.characters;
    if (Array.isArray(rawJson.pages)) {
      rawPages = rawJson.pages;
    } else if (Array.isArray(rawJson.chapters) && rawJson.chapters.length > 0) {
      rawPages = rawJson.chapters[0].pages || [];
      if (rawJson.chapters[0].title) detectedTitle = rawJson.chapters[0].title;
    }
  }

  // Transform each page into EduManga standard
  const pages = rawPages.map((p, idx) => {
    let img = p.imageUrl || p.image || p.url || '';
    if (!img && p.base64) {
      img = p.base64.startsWith('data:') ? p.base64 : `data:image/jpeg;base64,${p.base64}`;
    }

    const rawBubbles = p.bubbles || p.overlays || [];
    const bubbles = rawBubbles.map((b, bIdx) => ({
      id: b.id || `b_${idx + 1}_${bIdx + 1}`,
      text: b.text || b.dialogue || '',
      x: typeof b.x === 'number' ? b.x : parseFloat(b.x || 20),
      y: typeof b.y === 'number' ? b.y : parseFloat(b.y || 20),
      fontSize: b.fontSize || b.size || 14,
      width: b.width || 35,
      fontWeight: b.fontWeight || 'bold',
      fontStyle: b.fontStyle || 'normal',
      textAlign: b.textAlign || 'center',
      bubbleType: b.bubbleType || 'normal'
    }));

    return {
      pageNumber: p.pageNumber || (idx + 1),
      imageUrl: img,
      bubbles: bubbles,
      dialogue: p.dialogue || ''
    };
  });

  return {
    pages,
    title: detectedTitle,
    characters: detectedCharacters
  };
}

// Parse & Validate JSON File
function handleAdminChapterJsonUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const statusBox = document.getElementById('adminJsonStatusBox');
  const statusText = document.getElementById('adminJsonStatusText');
  const pagesCountBadge = document.getElementById('adminJsonPagesCount');
  const bubblesCountBadge = document.getElementById('adminJsonBubblesCount');
  const titleInput = document.getElementById('adminChapterTitle');

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const jsonContent = JSON.parse(e.target.result);
      const result = normalizeUploadedPages(jsonContent);

      if (!result.pages || result.pages.length === 0) {
        throw new Error("File JSON không tìm thấy danh sách trang truyện 'pages' hợp lệ!");
      }

      parsedChapterPagesData = result.pages;

      // Auto-fill title if available from JSON
      if (result.title && titleInput && !titleInput.dataset.manualEdited) {
        titleInput.value = result.title;
      }

      // Count total bubbles
      let totalBubbles = 0;
      result.pages.forEach(p => {
        totalBubbles += (p.bubbles || []).length;
      });

      if (statusBox) statusBox.style.display = 'block';
      if (statusText) statusText.innerHTML = `<b>✓ File JSON hợp lệ:</b> ${escapeHtml(file.name)} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
      if (pagesCountBadge) pagesCountBadge.textContent = `${result.pages.length} trang tranh`;
      if (bubblesCountBadge) bubblesCountBadge.textContent = `${totalBubbles} bóng thoại`;

      showToast(`✓ Đã nạp JSON thành công: ${result.pages.length} trang, ${totalBubbles} bóng thoại!`);
    } catch (err) {
      console.error("JSON parse error:", err);
      parsedChapterPagesData = null;
      if (statusBox) statusBox.style.display = 'block';
      if (statusText) statusText.innerHTML = `<span style="color: #f87171;">⚠️ Lỗi file JSON: ${escapeHtml(err.message)}</span>`;
      if (pagesCountBadge) pagesCountBadge.textContent = '0 trang';
      if (bubblesCountBadge) bubblesCountBadge.textContent = '0 bóng thoại';
      showToast(`⚠️ File JSON không hợp lệ: ${err.message}`);
    }
  };

  reader.readAsText(file, 'utf-8');
}

// Save Chapter using IndexedDB (handles large multi-MB base64 images seamlessly)
async function handleAdminSaveChapter(e) {
  e.preventDefault();
  if (!currentSeries) return;

  const chapId = document.getElementById('adminChapterId').value.trim();
  const chapTitle = document.getElementById('adminChapterTitle').value.trim();
  const chapSubtitle = document.getElementById('adminChapterSubtitle').value.trim();
  const chapPdf = document.getElementById('adminChapterPdfUrl').value.trim();

  if (!chapId || !chapTitle) {
    showToast("⚠️ Vui lòng nhập mã ID và tên chương!");
    return;
  }

  const pagesToSave = parsedChapterPagesData || [];
  if (pagesToSave.length === 0) {
    if (!confirm("Chưa có file JSON kịch bản trang tranh. Bạn có muốn tạo chương trống không?")) {
      return;
    }
  }

  showToast("⏳ Đang lưu dữ liệu chương vào IndexedDB...");

  // 1. Save heavy pages to IndexedDB
  if (window.dbStorage && typeof window.dbStorage.saveChapterPages === 'function') {
    await window.dbStorage.saveChapterPages(currentSeries.id, chapId, pagesToSave);
  }

  // 2. Save metadata to custom catalog
  const newChapter = {
    id: chapId,
    title: chapTitle,
    subtitle: chapSubtitle || `Nạp lúc ${new Date().toLocaleDateString('vi-VN')}`,
    releaseDate: new Date().toISOString().slice(0, 10),
    pagesCount: pagesToSave.length,
    pages: pagesToSave,
    pdfUrl: chapPdf || ''
  };

  let customCatalog = [];
  try {
    const raw = localStorage.getItem('edumanga_custom_catalog');
    if (raw) customCatalog = JSON.parse(raw);
  } catch (err) {}

  let seriesInCustom = customCatalog.find(m => m.id === currentSeries.id);
  if (!seriesInCustom) {
    seriesInCustom = { ...currentSeries, chapters: [...(currentSeries.chapters || [])] };
    customCatalog.push(seriesInCustom);
  }

  // Update or append chapter
  const existingChaps = seriesInCustom.chapters || [];
  const chapIdx = existingChaps.findIndex(c => c.id === chapId);
  if (chapIdx >= 0) {
    existingChaps[chapIdx] = newChapter;
  } else {
    existingChaps.push(newChapter);
  }
  seriesInCustom.chapters = existingChaps;

  saveCustomCatalogToStorage(customCatalog);

  // Update active state
  currentSeries.chapters = existingChaps;
  renderChapterList(currentSeries.chapters);
  renderSeriesInfo(currentSeries);
  closeAdminAddChapterModal();

  showToast(`🎉 Đã xuất bản "${chapTitle}" thành công!`);
}

// Delete Chapter
async function adminDeleteChapter(chapterId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!confirm(`⚠️ Bạn có chắc muốn xóa chương "${chapterId}"?`)) return;

  // Delete from IndexedDB
  if (window.dbStorage && typeof window.dbStorage.deleteChapterPages === 'function') {
    await window.dbStorage.deleteChapterPages(currentSeries.id, chapterId);
  }

  let customCatalog = [];
  try {
    const raw = localStorage.getItem('edumanga_custom_catalog');
    if (raw) customCatalog = JSON.parse(raw);
  } catch (err) {}

  let seriesInCustom = customCatalog.find(m => m.id === currentSeries.id);
  if (!seriesInCustom) {
    seriesInCustom = { ...currentSeries, chapters: [...(currentSeries.chapters || [])] };
    customCatalog.push(seriesInCustom);
  }

  seriesInCustom.chapters = (seriesInCustom.chapters || []).filter(c => c.id !== chapterId);
  saveCustomCatalogToStorage(customCatalog);

  currentSeries.chapters = seriesInCustom.chapters;
  renderChapterList(currentSeries.chapters);
  renderSeriesInfo(currentSeries);
  showToast(`🗑️ Đã xóa chương "${chapterId}"`);
}

function openCharModal(charId) {
  const char = (currentSeries.characters || []).find(c => c.id === charId);
  if (!char) return;

  const content = document.getElementById('charModalContent');
  if (!content) return;

  content.innerHTML = `
    <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem;">
      <div style="width: 80px; height: 80px; border-radius: var(--radius-full); overflow: hidden; border: 2px solid var(--accent-primary);">
        <img src="${char.avatar}" alt="${escapeHtml(char.name)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=${char.id}'">
      </div>
      <div>
        <h3 style="font-size: 1.4rem; font-weight: 800; color: #fff;">${escapeHtml(char.name)}</h3>
        <div style="color: var(--accent-primary); font-weight: 600; font-size: 0.9rem;">${escapeHtml(char.role || '')}</div>
      </div>
    </div>

    <div style="background: var(--bg-tertiary); padding: 1.25rem; border-radius: var(--radius-md); font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary);">
      <div style="margin-bottom: 0.75rem;"><strong style="color: #fff;">Ngoại hình:</strong> ${escapeHtml(char.appearance || 'Đang cập nhật')}</div>
      ${char.clothing ? `<div style="margin-bottom: 0.75rem;"><strong style="color: #fff;">Trang phục:</strong> ${escapeHtml(char.clothing)}</div>` : ''}
      <div><strong style="color: #fff;">Vai trò:</strong> ${escapeHtml(char.role || '')}</div>
    </div>
  `;

  document.getElementById('charModal')?.classList.add('active');
}

function closeCharModal() {
  document.getElementById('charModal')?.classList.remove('active');
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

// Admin Edit Series Handlers for Detail Page
function openAdminEditSeriesModal() {
  if (!currentSeries) {
    showToast("⚠️ Không tìm thấy thông tin bộ truyện!");
    return;
  }

  document.getElementById('adminEditSeriesOriginalId').value = currentSeries.id;
  document.getElementById('adminEditSeriesTitle').value = currentSeries.title || '';
  document.getElementById('adminEditSeriesId').value = currentSeries.id;

  const catSelect = document.getElementById('adminEditSeriesCategory');
  if (catSelect) {
    let key = (currentSeries.categoryKey || '').toLowerCase();
    if (!key) {
      const catStr = (currentSeries.category || '').toLowerCase();
      if (catStr.includes('chính trị') || catStr.includes('tư tưởng')) key = 'tthcm';
      else if (catStr.includes('ngoại ngữ') || catStr.includes('jlpt') || catStr.includes('tiếng nhật')) key = 'n2';
      else if (catStr.includes('pháp luật') || catStr.includes('luật')) key = 'pldc';
      else if (catStr.includes('công nghệ') || catStr.includes('ai')) key = 'ai';
      else key = 'general';
    }
    catSelect.value = key;
  }

  document.getElementById('adminEditSeriesBadge').value = currentSeries.badge || '';
  document.getElementById('adminEditSeriesAuthor').value = currentSeries.author || 'TBMQ';

  const statusSelect = document.getElementById('adminEditSeriesStatus');
  if (statusSelect) {
    statusSelect.value = currentSeries.status || 'Đang phát hành';
  }

  document.getElementById('adminEditSeriesDesc').value = currentSeries.description || '';

  const coverUrlInput = document.getElementById('adminEditSeriesCoverUrl');
  if (coverUrlInput) {
    coverUrlInput.value = currentSeries.cover || '';
  }

  const previewBox = document.getElementById('adminEditCoverPreviewBox');
  const previewImg = document.getElementById('adminEditCoverPreview');
  if (previewImg && previewBox) {
    if (currentSeries.cover) {
      previewImg.src = currentSeries.cover;
      previewBox.style.display = 'block';
    } else {
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
        previewBox.style.display = 'block';
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
  const coverUrl = document.getElementById('adminEditSeriesCoverUrl').value.trim() || 'assets/covers/n2_cover.jpg';

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

  const updatedSeries = {
    ...currentSeries,
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
    characters: currentSeries.characters || [],
    chapters: currentSeries.chapters || []
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

  currentSeries = updatedSeries;
  renderSeriesInfo(currentSeries);
  document.title = `${currentSeries.title} - EduManga Hub`;
  closeAdminEditSeriesModal();
  showToast(`🎉 Đã cập nhật bộ truyện "${title}" thành công!`);
}

// Export Single Chapter JSON
async function adminExportSingleChapter(chapId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!currentSeries) {
    showToast("⚠️ Không tìm thấy thông tin bộ truyện!");
    return;
  }

  const chap = (currentSeries.chapters || []).find(c => c.id === chapId);
  showToast(`⏳ Đang trích xuất JSON chương "${chap ? chap.title : chapId}"...`);

  const res = await window.dbStorage.exportSingleChapter(currentSeries.id, chapId, chap);
  if (res.success) {
    showToast(`📥 Đã tải file JSON chương thành công! (${res.pagesCount} trang)`);
  } else {
    showToast(`❌ Lỗi khi xuất JSON: ${res.error}`);
  }
}

// Export Current Series Full Backup
async function adminExportCurrentSeries() {
  if (!currentSeries) {
    showToast("⚠️ Không tìm thấy thông tin bộ truyện!");
    return;
  }

  showToast(`⏳ Đang đóng gói toàn bộ dữ liệu bộ truyện "${currentSeries.title}"...`);
  const res = await window.dbStorage.exportSeriesFullBackup(currentSeries);
  if (res.success) {
    showToast(`💾 Đã xuất file Backup trọn bộ truyện thành công! (${res.chaptersCount} chương)`);
  } else {
    showToast(`❌ Lỗi khi tạo backup: ${res.error}`);
  }
}

// Global Exports
window.openAdminAddChapterModal = openAdminAddChapterModal;
window.closeAdminAddChapterModal = closeAdminAddChapterModal;
window.openAdminEditSeriesModal = openAdminEditSeriesModal;
window.closeAdminEditSeriesModal = closeAdminEditSeriesModal;
window.handleAdminEditCoverUpload = handleAdminEditCoverUpload;
window.handleAdminSaveEditedSeries = handleAdminSaveEditedSeries;
window.handleAdminChapterNumChange = handleAdminChapterNumChange;
window.handleAdminChapterJsonUpload = handleAdminChapterJsonUpload;
window.handleAdminSaveChapter = handleAdminSaveChapter;
window.adminDeleteChapter = adminDeleteChapter;
window.adminExportSingleChapter = adminExportSingleChapter;
window.adminExportCurrentSeries = adminExportCurrentSeries;
window.openCharModal = openCharModal;
window.closeCharModal = closeCharModal;

