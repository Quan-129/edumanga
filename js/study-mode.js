/* ==========================================================================
   EDUMANGA HUB - MANGA SPEECH BUBBLES & INTERACTIVE STUDY ENGINE
   Default Visible Comic Dialogues, Flashcard Quiz Mode, Script Inspector
   ========================================================================== */

let isSpeechBubblesVisible = true; // DEFAULT: Always show dialogue speech bubbles!
let isQuizMode = false;            // Flashcard quiz mode (blur text to test memory)
let isKnowledgeBadgeVisible = false;

function loadStudyPreferences() {
  const savedBubbles = localStorage.getItem('edumanga_show_bubbles');
  isSpeechBubblesVisible = savedBubbles === null ? true : savedBubbles === 'true';
  isQuizMode = localStorage.getItem('edumanga_quiz_mode') === 'true';
  isKnowledgeBadgeVisible = localStorage.getItem('edumanga_show_badges') === 'true';
}

// Auto-load preferences on script execution
loadStudyPreferences();

function initStudyMode() {
  loadStudyPreferences();

  const toggleBubbles = document.getElementById('bubblesVisibleToggle');
  const quizToggle = document.getElementById('quizModeToggle');
  const badgeToggle = document.getElementById('knowledgeBadgeToggle');

  if (toggleBubbles) {
    toggleBubbles.checked = isSpeechBubblesVisible;
    toggleBubbles.addEventListener('change', (e) => {
      setBubblesVisibility(e.target.checked);
    });
  }

  if (quizToggle) {
    quizToggle.checked = isQuizMode;
    quizToggle.addEventListener('change', (e) => {
      setQuizMode(e.target.checked);
    });
  }

  if (badgeToggle) {
    badgeToggle.checked = isKnowledgeBadgeVisible;
    badgeToggle.addEventListener('change', (e) => {
      setKnowledgeBadges(e.target.checked);
    });
  }

  // Ensure all already-rendered elements strictly match current settings
  applyStudyModeToDom();

  // Global click listener to toggle interactive vocabulary popover (Mobile / Tablet / Desktop)
  document.addEventListener('click', (e) => {
    // If click is inside the popover itself (e.g. clicking + Card, selecting text), keep it open
    if (e.target.closest('.vocab-popover')) {
      return;
    }

    const vocabEl = e.target.closest('.vocab-interactive');
    if (vocabEl) {
      e.stopPropagation();
      const wasActive = vocabEl.classList.contains('active');
      document.querySelectorAll('.vocab-interactive.active').forEach(el => el.classList.remove('active'));
      if (!wasActive) {
        vocabEl.classList.add('active');
      }
    } else {
      document.querySelectorAll('.vocab-interactive.active').forEach(el => el.classList.remove('active'));
    }
  });
}

function applyStudyModeToDom() {
  const overlays = document.querySelectorAll('.bubble-overlay');
  overlays.forEach(el => {
    el.style.display = isSpeechBubblesVisible ? '' : 'none';
    if (isQuizMode) {
      el.classList.add('study-hidden');
      el.classList.remove('revealed');
    } else {
      el.classList.remove('study-hidden');
    }
  });

  const badges = document.querySelectorAll('.bubble-badge');
  badges.forEach(b => {
    b.style.display = isKnowledgeBadgeVisible ? 'inline-block' : 'none';
  });
}

function setBubblesVisibility(visible) {
  isSpeechBubblesVisible = visible;
  localStorage.setItem('edumanga_show_bubbles', visible);
  
  const overlays = document.querySelectorAll('.bubble-overlay');
  overlays.forEach(el => {
    el.style.display = visible ? '' : 'none';
  });

  showToast(visible ? 'Đã hiển thị lời thoại nhân vật' : 'Đã ẩn lời thoại (Xem tranh thuần)');
}

function setQuizMode(enabled) {
  isQuizMode = enabled;
  localStorage.setItem('edumanga_quiz_mode', enabled);
  
  const overlays = document.querySelectorAll('.bubble-overlay');
  overlays.forEach(el => {
    if (enabled) {
      el.classList.add('study-hidden');
      el.classList.remove('revealed');
    } else {
      el.classList.remove('study-hidden');
    }
  });

  showToast(enabled ? 'Đã bật chế độ Đố Vui (Chạm vào bóng thoại để giải mã)' : 'Đã hiện lời thoại đầy đủ');
}

function setKnowledgeBadges(enabled) {
  isKnowledgeBadgeVisible = enabled;
  localStorage.setItem('edumanga_show_badges', enabled);
  
  const badges = document.querySelectorAll('.bubble-badge');
  badges.forEach(b => {
    b.style.display = enabled ? 'inline-block' : 'none';
  });
}

/**
// Load master vocabulary & grammar database from data/vocab_n2_db.json
let masterVocabDb = null;
async function loadMasterVocabDatabase() {
  if (masterVocabDb) return masterVocabDb;
  try {
    const res = await fetch('data/vocab_n2_db.json');
    if (res.ok) {
      masterVocabDb = await res.json();
      window.masterVocabDb = masterVocabDb;
    }
  } catch (e) {
    console.warn("Could not load vocab_n2_db.json:", e);
  }
  return masterVocabDb;
}

// Auto-load master db
loadMasterVocabDatabase();

/**
 * Parses raw dialogue text containing vocabulary annotations like:
 * "人生 (じんせい - Nhân Sinh - Đời người, cuộc đời)"
 * and replaces them with an interactive HTML element showing only the root term by default,
 * revealing Pitch Accent, Furigana, Hán-Việt & Vietnamese meaning on hover or click.
 */
function formatInteractiveDialogue(text) {
  if (!text) return '';

  const pattern = /([a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u00C0-\u1EF9~／/\.\-]+)\s*[\(（]([^\)）]+)[\)）]/g;

  return text.replace(pattern, (match, term, noteContent) => {
    const trimmed = noteContent.trim();

    // Skip pure 4-digit years or non-vocab notes
    const isYear = /^\d{4}$/.test(trimmed);
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(trimmed);
    const hasSeparator = /[-–—•:]/.test(trimmed);

    if (isYear || (!hasJapanese && !hasSeparator)) {
      return match;
    }

    const parts = trimmed.split(/\s*[-–—•:]\s*/).filter(p => p.length > 0);
    
    let furigana = '';
    let hanViet = '';
    let meaning = '';

    if (parts.length >= 3) {
      furigana = parts[0];
      hanViet = parts[1];
      meaning = parts.slice(2).join(' - ');
    } else if (parts.length === 2) {
      if (/[\u3040-\u309F\u30A0-\u30FF]/.test(parts[0])) {
        furigana = parts[0];
        meaning = parts[1];
      } else {
        hanViet = parts[0];
        meaning = parts[1];
      }
    } else if (parts.length === 1) {
      if (/[\u3040-\u309F\u30A0-\u30FF]/.test(parts[0])) {
        furigana = parts[0];
      } else {
        meaning = parts[0];
      }
    }

    // Direct mapping from master database if available
    let dbItem = null;
    let pitchHtml = '';
    let pitchBadge = '';
    let connection = '';
    let isGrammar = isGrammarTerm(term);

    if (window.masterVocabDb && window.masterVocabDb.lookup_map) {
      dbItem = window.masterVocabDb.lookup_map[term.trim()] || 
               window.masterVocabDb.lookup_map[term.replace('〜', '').replace('~', '').trim()];
      if (dbItem) {
        if (dbItem.card_type === 'grammar') {
          isGrammar = true;
          if (dbItem.meaning) meaning = dbItem.meaning;
          if (dbItem.connection) connection = dbItem.connection;
        } else {
          if (dbItem.reading) furigana = dbItem.reading;
          if (dbItem.han_viet) hanViet = dbItem.han_viet;
          if (dbItem.meaning) meaning = dbItem.meaning;
          if (dbItem.pitch_html) pitchHtml = dbItem.pitch_html;
          if (dbItem.pitch_short) pitchBadge = dbItem.pitch_short;
        }
      }
    }

    // Render Clean & Compact Popover
    let rowsHtml = '';
    if (isGrammar) {
      if (meaning) {
        rowsHtml += `
          <div class="popover-row">
            <span class="popover-tag tag-def">Nghĩa</span>
            <span class="popover-val">${escapeHtml(meaning)}</span>
          </div>`;
      }
      if (connection) {
        rowsHtml += `
          <div class="popover-row">
            <span class="popover-tag tag-hv">Nối</span>
            <span class="popover-val" style="font-size: 0.78rem; font-family: monospace;">${escapeHtml(connection)}</span>
          </div>`;
      }
    } else {
      if (hanViet) {
        rowsHtml += `
          <div class="popover-row">
            <span class="popover-tag tag-hv">Hán-Việt</span>
            <span class="popover-val">${escapeHtml(hanViet)}</span>
          </div>`;
      }
      if (meaning) {
        rowsHtml += `
          <div class="popover-row">
            <span class="popover-tag tag-def">Nghĩa</span>
            <span class="popover-val">${escapeHtml(meaning)}</span>
          </div>`;
      }
    }

    const pitchDisplay = pitchHtml 
      ? `<span class="popover-pitch-inline">${pitchHtml} <span class="pitch-badge">${escapeHtml(pitchBadge)}</span></span>`
      : (furigana ? `<span class="popover-reading">${escapeHtml(furigana)}</span>` : '');

    const grammarBadge = isGrammar ? `<span class="tag-type-grammar" style="font-size: 0.68rem; padding: 2px 6px;"><i class="fas fa-shapes"></i> Ngữ pháp</span>` : '';

    const speakerBtn = `<button type="button" class="btn-popover-speaker" onclick="flashcardService.speak('${escapeHtml(term)}', event)" title="Nghe phát âm chuẩn">` +
      `<i class="fas fa-volume-high"></i>` +
    `</button>`;

    const addCardBtn = `<button type="button" class="btn-popover-add-card" onclick="addVocabToCards('${escapeHtml(term)}', '${escapeHtml(furigana)}', '${escapeHtml(hanViet)}', '${escapeHtml(meaning)}', event)" title="Thêm vào bộ thẻ ghi nhớ">` +
      `<i class="fas fa-plus"></i> <span>Thẻ</span>` +
    `</button>`;

    return `<span class="vocab-interactive" tabindex="0" data-vocab="${escapeHtml(term)}">` +
      `<span class="vocab-term">${escapeHtml(term)}</span>` +
      `<span class="vocab-popover" role="tooltip">` +
        `<span class="popover-header">` +
          `<div class="popover-header-left">` +
            `<span class="popover-term">${escapeHtml(term)}</span>` +
            `${grammarBadge}` +
            `${pitchDisplay}` +
          `</div>` +
          `<div class="popover-header-actions-group">` +
            `${speakerBtn}` +
            `${addCardBtn}` +
          `</div>` +
        `</span>` +
        (rowsHtml ? `<span class="popover-body">${rowsHtml}</span>` : '') +
      `</span>` +
    `</span>`;
  });
}

function addVocabToCards(term, furigana, hanViet, meaning, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  if (typeof notebookAddCard === 'function') {
    const success = notebookAddCard({ term, furigana, hanViet, meaning });
    if (event && event.currentTarget) {
      const btn = event.currentTarget;
      const origHtml = btn.innerHTML;
      btn.innerHTML = `<i class="fas fa-check" style="color: #4ade80;"></i> <span style="color: #4ade80;">Đã thêm</span>`;
      btn.classList.add('added');
      setTimeout(() => {
        btn.innerHTML = origHtml;
        btn.classList.remove('added');
      }, 1400);
    }
    if (success !== false) {
      showToast(`🗂️ Đã thêm "${term}" vào bộ Thẻ từ!`);
    } else {
      showToast(`ℹ️ Từ "${term}" đã có trong bộ Thẻ từ!`);
    }
  } else {
    showToast(`🗂️ Đã lưu "${term}" vào thẻ!`);
  }
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

// Render speech bubble overlays on a page wrapper
function renderPageBubbles(pageData, wrapperElement) {
  if (!pageData.bubbles || pageData.bubbles.length === 0) return;

  pageData.bubbles.forEach((b, idx) => {
    const bubbleEl = document.createElement('div');
    const bType = (b.bubbleType || 'normal').toLowerCase();
    bubbleEl.className = `bubble-overlay bubble-${bType}`;
    if (isQuizMode) bubbleEl.classList.add('study-hidden');
    if (!isSpeechBubblesVisible) bubbleEl.style.display = 'none';

    // Position coordinates (use exact percentages from JSON without rigid clamping)
    const posX = typeof b.x === 'number' ? b.x : parseFloat(b.x || 50);
    const posY = typeof b.y === 'number' ? b.y : parseFloat(b.y || 50);
    const widthVal = b.width ? (typeof b.width === 'number' ? b.width : parseFloat(b.width)) : null;

    bubbleEl.style.left = `${posX}%`;
    bubbleEl.style.top = `${posY}%`;
    
    // Apply width percentages from JSON precisely
    if (widthVal && widthVal > 0) {
      bubbleEl.style.width = `${widthVal}%`;
      bubbleEl.style.maxWidth = `${Math.min(98, Math.max(8, widthVal))}%`;
    } else {
      bubbleEl.style.maxWidth = '40%';
    }

    // Smart tooltip positioning: flip down if near top of image
    if (posY < 26) {
      bubbleEl.setAttribute('data-flip', 'down');
    }
    
    // Proportional font scaling variables from JSON fontSize
    const baseFontSize = b.fontSize ? (typeof b.fontSize === 'number' ? b.fontSize : parseFloat(b.fontSize)) : 16;
    const fontScale = (baseFontSize / 16);
    bubbleEl.style.setProperty('--base-font-size', baseFontSize);
    bubbleEl.style.setProperty('--font-scale', fontScale.toFixed(2));

    // Format dialogue text with clean root Kanji and interactive popovers
    const formattedHtml = formatInteractiveDialogue(b.text);

    // Apply custom text alignment, weight and style from JSON
    const textAlign = b.textAlign || 'center';
    const fontWeight = b.fontWeight || (bType === 'narration' ? '600' : '700');
    const fontStyle = b.fontStyle || (bType === 'thought' || bType === 'whisper' ? 'italic' : 'normal');

    // Inner content with comic styling
    bubbleEl.innerHTML = `
      <span class="bubble-badge" style="display: ${isKnowledgeBadgeVisible ? 'inline-block' : 'none'};">THOẠI #${idx + 1}</span>
      <div class="bubble-text" style="text-align: ${textAlign}; font-weight: ${fontWeight}; font-style: ${fontStyle};">${formattedHtml}</div>
      <div class="quiz-tap-hint"><i class="fas fa-magic"></i> Chạm để giải mã</div>
    `;

    // Click behavior
    bubbleEl.addEventListener('click', (e) => {
      // Don't trigger bubble pulse/quiz reveal when tapping an interactive vocabulary word
      if (e.target.closest('.vocab-interactive')) return;

      e.stopPropagation();
      if (isQuizMode) {
        bubbleEl.classList.toggle('revealed');
      } else {
        // Subtle ripple feedback
        bubbleEl.classList.add('bubble-pulse');
        setTimeout(() => bubbleEl.classList.remove('bubble-pulse'), 400);
      }
    });

    wrapperElement.appendChild(bubbleEl);
  });
}

// Script Inspector Drawer (View full dialogue text of the active page)
function openCurrentPageScript() {
  const modal = document.getElementById('scriptModal');
  const container = document.getElementById('scriptModalContent');
  if (!modal || !container || !currentChapter) return;

  const activePage = currentChapter.pages[currentPageIndex];
  if (!activePage) return;

  const scriptText = activePage.dialogue || (activePage.bubbles && activePage.bubbles.length > 0 
    ? activePage.bubbles.map((b, i) => `Khung ${i + 1}: "${b.text}"`).join('\n\n')
    : '(Không có lời thoại nào ở trang này)');

  container.innerHTML = `
    <div style="margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
      <span style="font-weight: 700; color: var(--accent-primary);">
        <i class="fas fa-file-alt"></i> Trang ${currentPageIndex + 1} / ${totalPages}
      </span>
      <span style="font-size: 0.8rem; color: var(--text-muted);">${currentChapter.title}</span>
    </div>
    <div class="script-text-box">
      <pre style="font-family: inherit; white-space: pre-wrap; line-height: 1.65; color: var(--text-highlight); font-size: 0.92rem; margin: 0;">${scriptText}</pre>
    </div>
    <div style="margin-top: 1.25rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
      <button class="btn-secondary" onclick="navigator.clipboard.writeText('${encodeURIComponent(scriptText)}'.replace(/%0A/g, '\\n')); showToast('Đã sao chép kịch bản!');" style="font-size: 0.82rem; padding: 0.4rem 0.8rem;">
        <i class="far fa-copy"></i> Sao Chép Lời Thoại
      </button>
      <button class="btn-primary" onclick="closeScriptModal()" style="font-size: 0.82rem; padding: 0.4rem 1rem;">
        Đóng
      </button>
    </div>
  `;

  modal.classList.add('active');
}

function closeScriptModal() {
  const modal = document.getElementById('scriptModal');
  if (modal) modal.classList.remove('active');
}

function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fas fa-comment-dots" style="color: var(--accent-secondary);"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

