/* ==========================================================================
   EDUMANGA HUB - SERIES DETAIL CONTROLLER
   Character Roster, Chapter List, PDF Downloads, Bookmarks
   ========================================================================== */

let currentSeries = null;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const seriesId = urlParams.get('id') || 'tu-tuong-hcm';
  await loadSeriesDetail(seriesId);
});

async function loadSeriesDetail(seriesId) {
  try {
    const response = await fetch('data/manga.json');
    const catalog = await response.json();
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
        <img src="${s.cover}" alt="${s.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/covers/n2_cover.jpg'">
      </div>
      <div class="series-info-main" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
            <span class="card-badge" style="position: static;">${s.badge || 'Manga'}</span>
            <span class="card-category" style="position: static;">${s.category}</span>
            <span style="background: rgba(16, 185, 129, 0.2); color: var(--accent-success); font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: var(--radius-sm); border: 1px solid rgba(16, 185, 129, 0.3);">
              ${s.status}
            </span>
          </div>
          <h1 style="font-size: 2.2rem; font-weight: 800; margin-bottom: 0.75rem; color: var(--text-highlight);">${s.title}</h1>
          <div style="display: flex; align-items: center; gap: 1.5rem; color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.25rem;">
            <span><i class="fas fa-user-edit" style="color: var(--accent-primary);"></i> Tác giả: <strong>${s.author}</strong></span>
            <span><i class="fas fa-star" style="color: var(--accent-warning);"></i> <strong>${s.rating}</strong> / 5.0</span>
            <span><i class="fas fa-eye"></i> ${s.views} lượt xem</span>
            <span><i class="fas fa-heart" style="color: var(--accent-secondary);"></i> ${s.likes} yêu thích</span>
          </div>
          <p style="color: var(--text-secondary); line-height: 1.7; font-size: 1rem; margin-bottom: 1.5rem;">${s.description}</p>
        </div>

        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          <a href="reader.html?series=${s.id}&chap=${s.chapters[0]?.id || 'chap-01'}" class="btn-primary" style="padding: 0.9rem 2rem; font-size: 1.05rem;">
            <i class="fas fa-book-open"></i> Bắt Đầu Đọc (Chương 1)
          </a>
          <button id="btnBookmark" class="btn-secondary" onclick="toggleBookmark('${s.id}')">
            <i class="far fa-bookmark"></i> Lưu Vào Tủ Sách
          </button>
          <button class="btn-secondary" onclick="shareSeries('${s.title}')">
            <i class="fas fa-share-alt"></i> Chia Sẻ
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderCharacterRoster(characters) {
  const section = document.getElementById('characterSection');
  const grid = document.getElementById('characterGrid');
  if (!section || !grid) return;

  if (characters.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  grid.innerHTML = characters.map(c => `
    <div class="character-card" onclick="showCharacterModal('${encodeURIComponent(JSON.stringify(c))}')">
      <div class="char-avatar-wrapper">
        <img class="char-avatar" src="${c.avatar}" alt="${c.name}" onerror="this.src='assets/characters/ai_bachkhoa.jpg'">
      </div>
      <div class="char-name">${c.name}</div>
      <div class="char-role">${c.role}</div>
    </div>
  `).join('');
}

function renderChapterList(chapters) {
  const list = document.getElementById('chapterList');
  if (!list) return;

  if (chapters.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
        Chưa có chương nào được xuất bản.
      </div>
    `;
    return;
  }

  list.innerHTML = chapters.map((ch, idx) => `
    <div class="chapter-item">
      <div class="chapter-left">
        <div class="chapter-title">${ch.title}</div>
        <div class="chapter-subtitle">
          <span>${ch.subtitle || ''}</span> • 
          <span><i class="far fa-clock"></i> ${ch.releaseDate}</span> • 
          <span><i class="far fa-file-image"></i> ${ch.pagesCount || ch.pages?.length || 0} trang</span>
        </div>
      </div>
      <div class="chapter-actions">
        ${ch.pdfUrl ? `
          <a href="${ch.pdfUrl}" target="_blank" class="btn-pdf" title="Tải/Xem bản PDF">
            <i class="fas fa-file-pdf"></i> Tải PDF
          </a>
        ` : ''}
        <a href="reader.html?series=${currentSeries.id}&chap=${ch.id}" class="btn-read">
          <i class="fas fa-play"></i> Đọc Ngay
        </a>
      </div>
    </div>
  `).join('');
}

function showCharacterModal(charJsonEncoded) {
  const c = JSON.parse(decodeURIComponent(charJsonEncoded));
  const modal = document.getElementById('charModal');
  const modalContent = document.getElementById('charModalContent');
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem;">
      <div style="width: 100px; height: 100px; border-radius: var(--radius-full); overflow: hidden; border: 3px solid var(--accent-primary); flex-shrink: 0;">
        <img src="${c.avatar}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div>
        <h3 style="font-size: 1.3rem; margin-bottom: 0.3rem;">${c.name}</h3>
        <p style="color: var(--accent-tertiary); font-size: 0.85rem; font-weight: 600;">${c.role}</p>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 0.75rem; color: var(--text-secondary); font-size: 0.95rem;">
      ${c.appearance ? `<div><strong><i class="fas fa-tshirt"></i> Ngoại hình:</strong> ${c.appearance}</div>` : ''}
      ${c.clothing ? `<div><strong><i class="fas fa-user-tag"></i> Trang phục:</strong> ${c.clothing}</div>` : ''}
    </div>
  `;
  modal.classList.add('active');
}

function closeCharModal() {
  const modal = document.getElementById('charModal');
  if (modal) modal.classList.remove('active');
}

function toggleBookmark(seriesId) {
  const bookmarks = JSON.parse(localStorage.getItem('edumanga_bookmarks') || '[]');
  const index = bookmarks.indexOf(seriesId);
  const btn = document.getElementById('btnBookmark');

  if (index > -1) {
    bookmarks.splice(index, 1);
    if (btn) btn.innerHTML = '<i class="far fa-bookmark"></i> Lưu Vào Tủ Sách';
  } else {
    bookmarks.push(seriesId);
    if (btn) btn.innerHTML = '<i class="fas fa-bookmark" style="color: var(--accent-primary);"></i> Đã Lưu Tủ Sách';
  }
  localStorage.setItem('edumanga_bookmarks', JSON.stringify(bookmarks));
}

function shareSeries(title) {
  if (navigator.share) {
    navigator.share({
      title: title,
      text: `Đọc truyện tranh ${title} trên EduManga Hub!`,
      url: window.location.href
    }).catch(console.error);
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Đã sao chép liên kết vào bộ nhớ tạm!');
  }
}
