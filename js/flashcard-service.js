/* ==========================================================================
   EDUMANGA HUB - CHAPTER VOCABULARY & FLASHCARD SERVICE
   Overview List First -> 3D Interactive Flip Card Practice Mode
   ========================================================================== */

let currentFlashcardChapterKey = '';
let currentFlashcardSeriesId = '';
let currentFlashcardChapId = '';
let currentChapterVocabList = [];
let flashcardFilterQuery = '';

// Practice Session State
let practiceSessionCards = [];
let practiceCurrentIndex = 0;
let isPracticeFlipped = false;
let isPracticeModeActive = false;

const flashcardService = {
  // Initialize and extract vocabulary for the active chapter
  initChapterFlashcards(seriesId, chapId, pagesData) {
    currentFlashcardSeriesId = seriesId;
    currentFlashcardChapId = chapId;
    currentFlashcardChapterKey = `${seriesId}_${chapId}`;

    // 1. Load saved cards from LocalStorage
    let savedCards = [];
    try {
      const raw = localStorage.getItem(`edumanga_flashcards_${currentFlashcardChapterKey}`);
      if (raw) savedCards = JSON.parse(raw);
    } catch (e) {
      savedCards = [];
    }

    // 2. Extract vocabulary from chapter pages & speech bubbles
    const extractedVocab = extractVocabFromPages(pagesData || []);

    // 3. Merge extracted and saved cards (retaining user's mastered status)
    const cardMap = new Map();

    // Add extracted first
    extractedVocab.forEach(item => {
      const key = item.term.trim().toLowerCase();
      cardMap.set(key, {
        id: `extracted_${key}_${item.pageIndex || 0}`,
        term: item.term.trim(),
        furigana: (item.furigana || '').trim(),
        hanViet: (item.hanViet || '').trim(),
        meaning: (item.meaning || '').trim(),
        context: (item.context || '').trim(),
        mastered: false,
        source: 'dialogue',
        createdAt: Date.now()
      });
    });

    // Merge saved cards (custom cards or updated mastered status)
    savedCards.forEach(saved => {
      if (!saved || !saved.term) return;
      const key = saved.term.trim().toLowerCase();
      if (cardMap.has(key)) {
        const existing = cardMap.get(key);
        existing.mastered = !!saved.mastered;
        if (saved.meaning) existing.meaning = saved.meaning;
        if (saved.furigana) existing.furigana = saved.furigana;
        if (saved.hanViet) existing.hanViet = saved.hanViet;
        if (saved.context) existing.context = saved.context;
      } else {
        cardMap.set(key, {
          ...saved,
          source: saved.source || 'custom'
        });
      }
    });

    currentChapterVocabList = Array.from(cardMap.values());
    saveCurrentFlashcardsToStorage();
    updateFlashcardBadges();
    renderFlashcardModalContent();
  },

  // Get current card list
  getCards() {
    return currentChapterVocabList;
  },

  // Toggle mastered status
  toggleMastered(cardId, event) {
    if (event) event.stopPropagation();
    const card = currentChapterVocabList.find(c => c.id === cardId);
    if (!card) return;

    card.mastered = !card.mastered;
    saveCurrentFlashcardsToStorage();
    updateFlashcardBadges();
    renderFlashcardModalContent();

    if (card.mastered) {
      showToast(`✨ Đã thuộc từ "${card.term}"!`);
    } else {
      showToast(`⏳ Chuyển từ "${card.term}" sang cần ôn tập`);
    }
  },

  // Add manual card
  addManualCard(cardData) {
    if (!cardData || !cardData.term) return;
    const cleanTerm = cardData.term.trim();
    const key = cleanTerm.toLowerCase();

    const existing = currentChapterVocabList.find(c => c.term.trim().toLowerCase() === key);
    if (existing) {
      if (cardData.furigana) existing.furigana = cardData.furigana.trim();
      if (cardData.hanViet) existing.hanViet = cardData.hanViet.trim();
      if (cardData.meaning) existing.meaning = cardData.meaning.trim();
      saveCurrentFlashcardsToStorage();
      updateFlashcardBadges();
      renderFlashcardModalContent();
      showToast(`ℹ️ Đã cập nhật thẻ "${cleanTerm}"!`);
      return;
    }

    const newCard = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      term: cleanTerm,
      furigana: (cardData.furigana || '').trim(),
      hanViet: (cardData.hanViet || '').trim(),
      meaning: (cardData.meaning || '').trim(),
      context: (cardData.context || '').trim(),
      mastered: false,
      source: 'custom',
      createdAt: Date.now()
    };

    currentChapterVocabList.unshift(newCard);
    saveCurrentFlashcardsToStorage();
    updateFlashcardBadges();
    renderFlashcardModalContent();
    showToast(`🎴 Đã thêm thẻ từ "${cleanTerm}" thành công!`);
  },

  // Delete card
  deleteCard(cardId, event) {
    if (event) event.stopPropagation();
    const card = currentChapterVocabList.find(c => c.id === cardId);
    if (!card) return;

    if (!confirm(`Bạn có chắc muốn xóa thẻ từ "${card.term}"?`)) return;

    currentChapterVocabList = currentChapterVocabList.filter(c => c.id !== cardId);
    saveCurrentFlashcardsToStorage();
    updateFlashcardBadges();
    renderFlashcardModalContent();
    showToast(`🗑️ Đã xóa thẻ "${card.term}"`);
  }
};

// --------------------------------------------------------------------------
// VOCABULARY EXTRACTION FROM SPEECH BUBBLES
// --------------------------------------------------------------------------
function extractVocabFromPages(pages) {
  const list = [];
  const pattern = /([a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u00C0-\u1EF9~／/\.\-]+)\s*[\(（]([^\)）]+)[\)）]/g;

  pages.forEach((page, pageIdx) => {
    const bubbles = page.bubbles || [];
    bubbles.forEach(b => {
      const text = b.text || '';
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const term = match[1].trim();
        const noteContent = match[2].trim();

        // Skip 4-digit years
        if (/^\d{4}$/.test(noteContent)) continue;
        const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(noteContent);
        const hasSeparator = /[-–—•:]/.test(noteContent);
        if (!hasJapanese && !hasSeparator) continue;

        const parts = noteContent.split(/\s*[-–—•:]\s*/).filter(p => p.length > 0);
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

        list.push({
          term,
          furigana,
          hanViet,
          meaning,
          pageIndex: pageIdx + 1,
          context: text.replace(/[\(（][^\)）]+[\)）]/g, '')
        });
      }
    });
  });

  return list;
}

function saveCurrentFlashcardsToStorage() {
  if (!currentFlashcardChapterKey) return;
  try {
    localStorage.setItem(`edumanga_flashcards_${currentFlashcardChapterKey}`, JSON.stringify(currentChapterVocabList));
  } catch (e) {
    console.warn("Could not save flashcards to localStorage:", e);
  }

  // Sync to Cloud Firestore if syncEngine is available
  if (window.syncEngine && typeof window.syncEngine.saveFlashcards === 'function') {
    window.syncEngine.saveFlashcards(currentChapterVocabList);
  }
}

function updateFlashcardBadges() {
  const total = currentChapterVocabList.length;
  const mastered = currentChapterVocabList.filter(c => c.mastered).length;

  const headerBadge = document.getElementById('headerFlashcardBadge');
  if (headerBadge) {
    if (total > 0) {
      headerBadge.textContent = total;
      headerBadge.style.display = 'inline-flex';
    } else {
      headerBadge.style.display = 'none';
    }
  }

  const dockBadge = document.getElementById('dockFlashcardBadge');
  if (dockBadge) {
    if (total > 0) {
      dockBadge.textContent = total;
      dockBadge.style.display = 'inline-flex';
    } else {
      dockBadge.style.display = 'none';
    }
  }

  const modalTitleCount = document.getElementById('modalFlashcardCountText');
  if (modalTitleCount) {
    modalTitleCount.textContent = `(${total} từ • ${mastered} đã nhớ)`;
  }
}

// --------------------------------------------------------------------------
// MODAL CONTROLS & RENDERING (SHOW FULL LIST FIRST -> 3D PRACTICE MODE)
// --------------------------------------------------------------------------

function openFlashcardModal() {
  const modal = document.getElementById('flashcardModal');
  if (!modal) return;

  modal.classList.add('active');
  isPracticeModeActive = false;
  renderFlashcardModalContent();
}

function closeFlashcardModal() {
  const modal = document.getElementById('flashcardModal');
  if (!modal) return;
  modal.classList.remove('active');
  isPracticeModeActive = false;
}

function renderFlashcardModalContent() {
  const bodyEl = document.getElementById('flashcardModalBody');
  if (!bodyEl) return;

  if (isPracticeModeActive) {
    renderPracticeModeView(bodyEl);
  } else {
    renderOverviewListView(bodyEl);
  }
}

// VIEW 1: SHOW FULL LIST OVERVIEW (DANH SÁCH TỔNG HỢP TRƯỚC)
function renderOverviewListView(container) {
  const total = currentChapterVocabList.length;
  const mastered = currentChapterVocabList.filter(c => c.mastered).length;
  const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;

  // Filter list
  const filtered = currentChapterVocabList.filter(c => {
    if (!flashcardFilterQuery) return true;
    const q = flashcardFilterQuery.toLowerCase();
    return c.term.toLowerCase().includes(q) ||
           (c.furigana && c.furigana.toLowerCase().includes(q)) ||
           (c.hanViet && c.hanViet.toLowerCase().includes(q)) ||
           (c.meaning && c.meaning.toLowerCase().includes(q));
  });

  let cardsHtml = '';
  if (filtered.length === 0) {
    if (total === 0) {
      cardsHtml = `
        <div class="flashcard-empty-state">
          <div class="empty-icon"><i class="fas fa-layer-group"></i></div>
          <p class="empty-title">Chương này chưa có thẻ từ vựng</p>
          <p class="empty-desc">Bạn có thể thêm từ mới thủ công hoặc đọc tiếp chương khác!</p>
          <button class="btn-secondary" onclick="promptAddCustomFlashcard()" style="margin-top: 10px; font-size: 0.82rem;">
            <i class="fas fa-plus"></i> Thêm từ vựng mới
          </button>
        </div>
      `;
    } else {
      cardsHtml = `
        <div class="flashcard-empty-state">
          <div class="empty-icon"><i class="fas fa-search"></i></div>
          <p class="empty-title">Không tìm thấy từ vựng phù hợp</p>
          <p class="empty-desc">Thử tìm kiếm với từ khóa khác</p>
        </div>
      `;
    }
  } else {
    cardsHtml = filtered.map((c, idx) => {
      const isMastered = !!c.mastered;
      return `
        <div class="vocab-overview-item ${isMastered ? 'is-mastered' : ''}" id="vcard_${c.id}">
          <div class="vocab-item-left">
            <span class="vocab-item-idx">#${idx + 1}</span>
            <div class="vocab-item-main">
              <div class="vocab-item-term-row">
                <span class="vocab-item-term">${escapeHtml(c.term)}</span>
                ${c.furigana ? `<span class="vocab-item-furigana">${escapeHtml(c.furigana)}</span>` : ''}
                <button class="btn-vocab-speaker" onclick="speakVocabTerm('${escapeHtml(c.term)}', event)" title="Nghe phát âm">
                  <i class="fas fa-volume-high"></i>
                </button>
              </div>
              <div class="vocab-item-meanings-row">
                ${c.hanViet ? `<span class="tag-hanviet">HV: ${escapeHtml(c.hanViet)}</span>` : ''}
                <span class="vocab-item-meaning">${escapeHtml(c.meaning || 'Chưa có định nghĩa')}</span>
              </div>
            </div>
          </div>

          <div class="vocab-item-actions">
            <button class="btn-toggle-mastered ${isMastered ? 'active' : ''}" 
                    onclick="flashcardService.toggleMastered('${c.id}', event)" 
                    title="${isMastered ? 'Đã thuộc (Nhấp để ôn lại)' : 'Đánh dấu đã thuộc'}">
              <i class="fas ${isMastered ? 'fa-check-circle' : 'fa-circle'}"></i>
              <span>${isMastered ? 'Đã thuộc' : 'Chưa nhớ'}</span>
            </button>
            <button class="btn-vocab-del" onclick="flashcardService.deleteCard('${c.id}', event)" title="Xóa thẻ">
              <i class="fas fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  container.innerHTML = `
    <!-- Top Action Banner: Start 3D Flashcard Practice -->
    <div class="flashcard-cta-banner">
      <div class="cta-banner-info">
        <div class="cta-banner-title">
          <i class="fas fa-graduation-cap"></i>
          <span>Ôn tập từ vựng chương này</span>
        </div>
        <div class="cta-banner-progress">
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${percent}%;"></div>
          </div>
          <span class="progress-text">${mastered}/${total} đã thuộc (${percent}%)</span>
        </div>
      </div>
      <button class="btn-start-practice" onclick="startFlashcardPractice()" ${total === 0 ? 'disabled' : ''}>
        <i class="fas fa-play"></i>
        <span>Luyện Flashcard (3D)</span>
      </button>
    </div>

    <!-- Filter & Add Bar -->
    <div class="vocab-toolbar-row">
      <div class="vocab-search-box">
        <i class="fas fa-search"></i>
        <input type="text" id="vocabFilterInput" placeholder="Tìm kiếm từ vựng, Hán-Việt, ý nghĩa..." value="${escapeHtml(flashcardFilterQuery)}" oninput="handleVocabFilterChange(this.value)">
        ${flashcardFilterQuery ? `<button class="btn-clear-search" onclick="handleVocabFilterChange('')"><i class="fas fa-times"></i></button>` : ''}
      </div>
      <button class="btn-add-custom-card" onclick="promptAddCustomFlashcard()" title="Thêm từ vựng mới">
        <i class="fas fa-plus"></i> <span>Thêm từ</span>
      </button>
    </div>

    <!-- Full Vocabulary List -->
    <div class="vocab-list-scrollable">
      ${cardsHtml}
    </div>
  `;
}

// VIEW 2: 3D INTERACTIVE FLASHCARD PRACTICE MODE (CHẾ ĐỘ LẬT THẺ 3D)
function renderPracticeModeView(container) {
  if (practiceSessionCards.length === 0) {
    switchToListView();
    return;
  }

  // If completed all cards
  if (practiceCurrentIndex >= practiceSessionCards.length) {
    const total = practiceSessionCards.length;
    const mastered = practiceSessionCards.filter(c => c.mastered).length;
    const percent = Math.round((mastered / total) * 100);

    container.innerHTML = `
      <div class="practice-completed-screen">
        <div class="congrats-trophy"><i class="fas fa-award"></i></div>
        <h3 class="congrats-title">🎉 Xuất Sắc! Hoàn Thành Phiên Ôn Tập</h3>
        <p class="congrats-sub">Bạn đã ôn luyện toàn bộ ${total} từ vựng trong chương này.</p>
        
        <div class="practice-score-card">
          <div class="score-circle">
            <span class="score-number">${percent}%</span>
            <span class="score-label">Độ thuộc</span>
          </div>
          <div class="score-details">
            <div class="score-row text-success"><i class="fas fa-check-circle"></i> Đã nhớ: <b>${mastered} từ</b></div>
            <div class="score-row text-warning"><i class="fas fa-rotate-left"></i> Cần ôn lại: <b>${total - mastered} từ</b></div>
          </div>
        </div>

        <div class="practice-finish-actions">
          ${(total - mastered > 0) ? `
            <button class="btn-primary" onclick="restartPracticeUnmasteredOnly()">
              <i class="fas fa-rotate-left"></i> Ôn lại ${total - mastered} từ chưa nhớ
            </button>
          ` : ''}
          <button class="btn-secondary" onclick="startFlashcardPractice()">
            <i class="fas fa-redo"></i> Luyện lại từ đầu
          </button>
          <button class="btn-secondary" onclick="switchToListView()">
            <i class="fas fa-list-ul"></i> Xem lại danh sách đầy đủ
          </button>
        </div>
      </div>
    `;
    return;
  }

  const card = practiceSessionCards[practiceCurrentIndex];
  const total = practiceSessionCards.length;
  const currentNum = practiceCurrentIndex + 1;
  const percent = Math.round(((currentNum - 1) / total) * 100);

  container.innerHTML = `
    <div class="practice-mode-wrapper">
      
      <!-- Practice Subheader -->
      <div class="practice-subheader">
        <button class="btn-back-to-list" onclick="switchToListView()" title="Quay lại danh sách tổng quan">
          <i class="fas fa-arrow-left"></i> <span>Danh sách</span>
        </button>
        <div class="practice-progress-pill">
          <span>Thẻ ${currentNum} / ${total}</span>
          <div class="practice-mini-bar"><div class="practice-mini-fill" style="width: ${percent}%;"></div></div>
        </div>
        <button class="btn-icon" onclick="closeFlashcardModal()"><i class="fas fa-times"></i></button>
      </div>

      <!-- 3D Flip Card Scene -->
      <div class="practice-card-scene" onclick="toggleFlipPracticeCard()">
        <div id="flashcard3dBox" class="practice-3d-card ${isPracticeFlipped ? 'is-flipped' : ''}">
          
          <!-- FRONT FACE -->
          <div class="card-face card-face-front">
            <div class="card-face-hint"><i class="fas fa-hand-pointer"></i> Chạm để lật giải nghĩa (Phím Space)</div>
            
            <div class="card-front-content">
              <div class="card-term-display">${escapeHtml(card.term)}</div>
              ${card.furigana ? `<div class="card-reading-display">【 ${escapeHtml(card.furigana)} 】</div>` : ''}
            </div>

            <div class="card-face-footer">
              <button class="btn-card-audio-play" onclick="speakCurrentPracticeCard(event)" title="Nghe phát âm">
                <i class="fas fa-volume-high"></i> <span>Phát âm</span>
              </button>
            </div>
          </div>

          <!-- BACK FACE -->
          <div class="card-face card-face-back">
            <div class="card-face-hint"><i class="fas fa-check-circle"></i> Giải nghĩa & Ngữ cảnh</div>
            
            <div class="card-back-content">
              <div class="card-back-term">${escapeHtml(card.term)} ${card.furigana ? `<span class="card-back-furigana">(${escapeHtml(card.furigana)})</span>` : ''}</div>
              ${card.hanViet ? `<div class="card-back-hanviet">Âm Hán-Việt: <b>${escapeHtml(card.hanViet)}</b></div>` : ''}
              <div class="card-back-meaning">${escapeHtml(card.meaning || 'Chưa có giải nghĩa')}</div>
              ${card.context ? `<div class="card-back-context"><i>"${escapeHtml(card.context)}"</i></div>` : ''}
            </div>

            <div class="card-face-footer">
              <button class="btn-card-audio-play" onclick="speakCurrentPracticeCard(event)" title="Nghe phát âm">
                <i class="fas fa-volume-high"></i> <span>Phát âm lại</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Footer Rating Controls -->
      <div class="practice-controls-row">
        <button class="btn-rate-answer btn-rate-forgot" onclick="rateCurrentPracticeCard(false)" title="Chưa nhớ từ này (Phím ← hoặc 1)">
          <i class="fas fa-rotate-left"></i>
          <span>Chưa nhớ</span>
          <span class="kbd-hint">←</span>
        </button>

        <button class="btn-rate-flip" onclick="toggleFlipPracticeCard()" title="Lật mặt thẻ (Phím Space)">
          <i class="fas fa-repeat"></i>
          <span>Lật thẻ</span>
          <span class="kbd-hint">Space</span>
        </button>

        <button class="btn-rate-answer btn-rate-remembered" onclick="rateCurrentPracticeCard(true)" title="Đã nhớ từ này (Phím → hoặc 2)">
          <i class="fas fa-check"></i>
          <span>Đã nhớ</span>
          <span class="kbd-hint">→</span>
        </button>
      </div>

    </div>
  `;
}

// --------------------------------------------------------------------------
// PRACTICE SESSION ACTIONS
// --------------------------------------------------------------------------

function startFlashcardPractice() {
  if (currentChapterVocabList.length === 0) {
    showToast("⚠️ Chương này chưa có từ vựng để ôn tập!");
    return;
  }

  practiceSessionCards = [...currentChapterVocabList];
  practiceCurrentIndex = 0;
  isPracticeFlipped = false;
  isPracticeModeActive = true;
  renderFlashcardModalContent();
}

function restartPracticeUnmasteredOnly() {
  const unmastered = currentChapterVocabList.filter(c => !c.mastered);
  if (unmastered.length === 0) {
    startFlashcardPractice();
    return;
  }
  practiceSessionCards = [...unmastered];
  practiceCurrentIndex = 0;
  isPracticeFlipped = false;
  isPracticeModeActive = true;
  renderFlashcardModalContent();
}

function switchToListView() {
  isPracticeModeActive = false;
  renderFlashcardModalContent();
}

function toggleFlipPracticeCard() {
  isPracticeFlipped = !isPracticeFlipped;
  const cardEl = document.getElementById('flashcard3dBox');
  if (cardEl) {
    cardEl.classList.toggle('is-flipped', isPracticeFlipped);
  }
}

function speakCurrentPracticeCard(e) {
  if (e) e.stopPropagation();
  const card = practiceSessionCards[practiceCurrentIndex];
  if (card) {
    speakVocabTerm(card.term, e);
  }
}

function rateCurrentPracticeCard(mastered) {
  const card = practiceSessionCards[practiceCurrentIndex];
  if (card) {
    const mainCard = currentChapterVocabList.find(c => c.id === card.id);
    if (mainCard) {
      mainCard.mastered = mastered;
      saveCurrentFlashcardsToStorage();
      updateFlashcardBadges();
    }
  }

  practiceCurrentIndex++;
  isPracticeFlipped = false;
  renderFlashcardModalContent();
}

function handleVocabFilterChange(query) {
  flashcardFilterQuery = query || '';
  renderFlashcardModalContent();
}

function promptAddCustomFlashcard() {
  const term = prompt("Nhập từ vựng / Kanji chính:");
  if (!term || !term.trim()) return;

  const furigana = prompt("Cách đọc Furigana / Hiragana (nếu có):") || "";
  const hanViet = prompt("Âm Hán-Việt (nếu có):") || "";
  const meaning = prompt("Ý nghĩa / Định nghĩa tiếng Việt:") || "";

  flashcardService.addManualCard({
    term: term.trim(),
    furigana: furigana.trim(),
    hanViet: hanViet.trim(),
    meaning: meaning.trim()
  });
}

function speakVocabTerm(term, event) {
  if (event) event.stopPropagation();
  if (!term || !('speechSynthesis' in window)) {
    showToast('Trình duyệt không hỗ trợ giọng đọc');
    return;
  }

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(term);
  utter.lang = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(term) ? 'ja-JP' : 'vi-VN';
  utter.rate = 0.88;
  window.speechSynthesis.speak(utter);
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

// Global Export
window.flashcardService = flashcardService;
window.openFlashcardModal = openFlashcardModal;
window.closeFlashcardModal = closeFlashcardModal;
window.startFlashcardPractice = startFlashcardPractice;
window.restartPracticeUnmasteredOnly = restartPracticeUnmasteredOnly;
window.switchToListView = switchToListView;
window.toggleFlipPracticeCard = toggleFlipPracticeCard;
window.speakCurrentPracticeCard = speakCurrentPracticeCard;
window.rateCurrentPracticeCard = rateCurrentPracticeCard;
window.handleVocabFilterChange = handleVocabFilterChange;
window.promptAddCustomFlashcard = promptAddCustomFlashcard;
window.speakVocabTerm = speakVocabTerm;
