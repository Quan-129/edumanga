/* ==========================================================================
   EDUMANGA HUB - CHAPTER VOCABULARY & FLASHCARD SERVICE (V3 - TYPE-TO-CHECK)
   - Vocabulary Cards: Type-to-Check (Active Recall Typing & Auto-Validation)
   - Grammar Cards: Interactive 3D Flip Card Scene (Structure & Rules)
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

// Typing Mode State for current card: 'input' | 'correct' | 'incorrect' | 'revealed'
let currentTypingState = 'input';
let lastUserTypedInput = '';

const flashcardService = {
  // Initialize and extract vocabulary for the active chapter
  async initChapterFlashcards(seriesId, chapId, pagesData) {
    currentFlashcardSeriesId = seriesId;
    currentFlashcardChapId = chapId;
    currentFlashcardChapterKey = `${seriesId}_${chapId}`;

    // Extract chapter number from chapId (e.g. 'chap-01', 'chuong-02' -> 1, 2)
    let chapterNum = 1;
    const chapMatch = (chapId || '').match(/\d+/);
    if (chapMatch) {
      chapterNum = parseInt(chapMatch[0], 10);
    }

    // 1. Load saved cards from LocalStorage
    let savedCards = [];
    try {
      const raw = localStorage.getItem(`edumanga_flashcards_${currentFlashcardChapterKey}`);
      if (raw) savedCards = JSON.parse(raw);
    } catch (e) {
      savedCards = [];
    }

    // 2. Load Master Database from data/vocab_n2_db.json if available
    let dbVocab = [];
    let dbGrammar = [];
    try {
      if (!window.masterVocabDb) {
        const res = await fetch('data/vocab_n2_db.json');
        if (res.ok) window.masterVocabDb = await res.json();
      }
      if (window.masterVocabDb) {
        dbVocab = (window.masterVocabDb.vocab_list || []).filter(v => v.chapter === chapterNum);
        dbGrammar = (window.masterVocabDb.grammar_list || []).filter(g => g.chapter === chapterNum);
      }
    } catch (e) {
      console.warn("Could not fetch vocab_n2_db.json in flashcardService:", e);
    }

    // 3. Extract vocabulary from chapter pages & speech bubbles for context matching
    const extractedVocab = extractVocabFromPages(pagesData || []);
    const extractedMap = new Map();
    extractedVocab.forEach(item => {
      extractedMap.set(item.term.trim().toLowerCase(), item);
      extractedMap.set(item.term.replace('〜', '').replace('~', '').trim().toLowerCase(), item);
    });

    // 4. Merge master db items into card list with full 13 attributes
    const cardMap = new Map();

    // Add Master Vocab
    dbVocab.forEach(v => {
      const key = v.term.trim().toLowerCase();
      const ext = extractedMap.get(key);
      cardMap.set(key, {
        id: `vocab_${v.stt}`,
        stt: v.stt,
        chapter: v.chapter,
        term: v.term,
        reading: v.reading,
        romaji: v.romaji,
        hanViet: v.han_viet,
        meaning: v.meaning,
        type: 'vocab',
        pos: v.type || 'Danh từ',
        examJa: v.exam_ja,
        examVi: v.exam_vi,
        kanjiBreakdown: v.kanji_breakdown,
        pitchHtml: v.pitch_html,
        pitchLabel: v.pitch_label,
        pitchShort: v.pitch_short,
        synonymsAntonyms: v.synonyms_antonyms,
        context: ext ? ext.context : '',
        pageIndex: ext ? ext.pageIndex : 1,
        mastered: false,
        source: 'db',
        createdAt: Date.now()
      });
    });

    // Add Master Grammar
    dbGrammar.forEach(g => {
      const key = g.pattern.trim().toLowerCase();
      const ext = extractedMap.get(key) || extractedMap.get(g.pattern.replace('〜', '').replace('~', '').trim().toLowerCase());
      cardMap.set(key, {
        id: `grammar_${g.stt}`,
        stt: g.stt,
        chapter: g.chapter,
        term: g.pattern,
        pattern: g.pattern,
        reading: g.reading,
        meaning: g.meaning,
        type: 'grammar',
        connection: g.connection,
        usageNotes: g.usage_notes,
        level: g.level || 'N2',
        examJa1: g.exam_ja_1,
        examVi1: g.exam_vi_1,
        examJa2: g.exam_ja_2,
        examVi2: g.exam_vi_2,
        similarPatterns: g.similar_patterns,
        context: ext ? ext.context : '',
        pageIndex: ext ? ext.pageIndex : 1,
        mastered: false,
        source: 'db',
        createdAt: Date.now()
      });
    });

    // Fallback: If master db not available, add extracted directly
    if (cardMap.size === 0) {
      extractedVocab.forEach(item => {
        const key = item.term.trim().toLowerCase();
        cardMap.set(key, {
          id: `extracted_${key}_${item.pageIndex || 0}`,
          term: item.term.trim(),
          reading: (item.furigana || '').trim(),
          hanViet: (item.hanViet || '').trim(),
          meaning: (item.meaning || '').trim(),
          context: (item.context || '').trim(),
          pageIndex: item.pageIndex || 1,
          type: item.type || (isGrammarTerm(item.term) ? 'grammar' : 'vocab'),
          mastered: false,
          source: 'dialogue',
          createdAt: Date.now()
        });
      });
    }

    // Merge saved cards (retaining user's mastered status)
    savedCards.forEach(saved => {
      if (!saved || !saved.term) return;
      const key = saved.term.trim().toLowerCase();
      if (cardMap.has(key)) {
        const existing = cardMap.get(key);
        existing.mastered = !!saved.mastered;
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

  // Modal Controls
  openModal() {
    const modal = document.getElementById('flashcardModal');
    if (!modal) return;
    modal.classList.add('active');
    isPracticeModeActive = false;
    renderFlashcardModalContent();
  },

  closeModal() {
    const modal = document.getElementById('flashcardModal');
    if (!modal) return;
    modal.classList.remove('active');
    isPracticeModeActive = false;
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
      if (cardData.type) existing.type = cardData.type;
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
      type: cardData.type || (isGrammarTerm(cleanTerm) ? 'grammar' : 'vocab'),
      mastered: false,
      source: 'custom',
      createdAt: Date.now()
    };

    currentChapterVocabList.unshift(newCard);
    saveCurrentFlashcardsToStorage();
    updateFlashcardBadges();
    renderFlashcardModalContent();
    showToast(`🎴 Đã thêm thẻ "${cleanTerm}" thành công!`);
  },

  // Delete card
  deleteCard(cardId, event) {
    if (event) event.stopPropagation();
    const card = currentChapterVocabList.find(c => c.id === cardId);
    if (!card) return;

    if (!confirm(`Bạn có chắc muốn xóa thẻ "${card.term}"?`)) return;

    currentChapterVocabList = currentChapterVocabList.filter(c => c.id !== cardId);
    saveCurrentFlashcardsToStorage();
    updateFlashcardBadges();
    renderFlashcardModalContent();
    showToast(`🗑️ Đã xóa thẻ "${card.term}"`);
  },

  // ------------------------------------------------------------------------
  // PRACTICE SESSION ACTIONS
  // ------------------------------------------------------------------------
  startPractice() {
    if (currentChapterVocabList.length === 0) {
      showToast("⚠️ Chương này chưa có từ vựng để ôn tập!");
      return;
    }

    practiceSessionCards = [...currentChapterVocabList];
    practiceCurrentIndex = 0;
    isPracticeFlipped = false;
    currentTypingState = 'input';
    lastUserTypedInput = '';
    isPracticeModeActive = true;
    renderFlashcardModalContent();
  },

  restartUnmastered() {
    const unmastered = currentChapterVocabList.filter(c => !c.mastered);
    if (unmastered.length === 0) {
      this.startPractice();
      return;
    }
    practiceSessionCards = [...unmastered];
    practiceCurrentIndex = 0;
    isPracticeFlipped = false;
    currentTypingState = 'input';
    lastUserTypedInput = '';
    isPracticeModeActive = true;
    renderFlashcardModalContent();
  },

  switchToList() {
    isPracticeModeActive = false;
    renderFlashcardModalContent();
  },

  // Grammar Flip Action
  toggleFlip() {
    isPracticeFlipped = !isPracticeFlipped;
    const cardEl = document.getElementById('flashcard3dBox');
    if (cardEl) {
      cardEl.classList.toggle('is-flipped', isPracticeFlipped);
    }
  },

  ratePracticeCard(mastered) {
    if (practiceCurrentIndex >= practiceSessionCards.length) return;
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
    currentTypingState = 'input';
    lastUserTypedInput = '';
    renderFlashcardModalContent();
  },

  // ------------------------------------------------------------------------
  // TYPE-TO-CHECK VOCABULARY ENGINE
  // ------------------------------------------------------------------------
  checkTypingAnswer() {
    const inputEl = document.getElementById('practiceTypingInput');
    if (!inputEl) return;

    const userInput = inputEl.value.trim();
    if (!userInput) {
      showToast("✍️ Vui lòng gõ cách đọc hoặc nghĩa để kiểm tra!");
      inputEl.focus();
      return;
    }

    const card = practiceSessionCards[practiceCurrentIndex];
    if (!card) return;

    lastUserTypedInput = userInput;
    const isCorrect = evaluateAnswer(userInput, card);

    const mainCard = currentChapterVocabList.find(c => c.id === card.id);
    if (isCorrect) {
      currentTypingState = 'correct';
      if (mainCard) mainCard.mastered = true;
      card.mastered = true;
      saveCurrentFlashcardsToStorage();
      updateFlashcardBadges();
      this.speak(card.term);
    } else {
      currentTypingState = 'incorrect';
      if (mainCard) mainCard.mastered = false;
      card.mastered = false;
      saveCurrentFlashcardsToStorage();
      updateFlashcardBadges();
    }

    renderFlashcardModalContent();
  },

  revealAnswer() {
    const card = practiceSessionCards[practiceCurrentIndex];
    if (!card) return;

    currentTypingState = 'revealed';
    const mainCard = currentChapterVocabList.find(c => c.id === card.id);
    if (mainCard) mainCard.mastered = false;
    card.mastered = false;
    saveCurrentFlashcardsToStorage();
    updateFlashcardBadges();
    this.speak(card.term);

    renderFlashcardModalContent();
  },

  retryTyping() {
    currentTypingState = 'input';
    lastUserTypedInput = '';
    renderFlashcardModalContent();
  },

  nextPracticeCard() {
    practiceCurrentIndex++;
    isPracticeFlipped = false;
    currentTypingState = 'input';
    lastUserTypedInput = '';
    renderFlashcardModalContent();
  },

  speakCurrentPractice(e) {
    if (e) e.stopPropagation();
    if (practiceCurrentIndex < practiceSessionCards.length) {
      const card = practiceSessionCards[practiceCurrentIndex];
      if (card) {
        this.speak(card.term, e);
      }
    }
  },

  handleFilterChange(query) {
    flashcardFilterQuery = query || '';
    renderFlashcardModalContent();
  },

  promptAddCustom() {
    const term = prompt("Nhập từ vựng hoặc cấu trúc ngữ pháp:");
    if (!term || !term.trim()) return;

    const furigana = prompt("Cách đọc Furigana / Hiragana (nếu có):") || "";
    const hanViet = prompt("Âm Hán-Việt (nếu có):") || "";
    const meaning = prompt("Ý nghĩa / Định nghĩa tiếng Việt:") || "";

    const isGrammar = isGrammarTerm(term) || confirm("Đây có phải là thẻ cấu trúc Ngữ Pháp không? (Bấm OK để dùng cơ chế Lật Thẻ, Cancel để dùng cơ chế Gõ Check)");

    this.addManualCard({
      term: term.trim(),
      furigana: furigana.trim(),
      hanViet: hanViet.trim(),
      meaning: meaning.trim(),
      type: isGrammar ? 'grammar' : 'vocab'
    });
  },

  speak(term, event) {
    if (event) event.stopPropagation();
    if (!term || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(term);
    utter.lang = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(term) ? 'ja-JP' : 'vi-VN';
    utter.rate = 0.88;
    window.speechSynthesis.speak(utter);
  }
};

// --------------------------------------------------------------------------
// SMART ANSWER EVALUATION (TYPE-TO-CHECK LOGIC)
// --------------------------------------------------------------------------
function evaluateAnswer(userInput, card) {
  if (!userInput || !card) return false;

  const cleanUser = userInput.toLowerCase().trim();
  const userNoAccent = removeVietnameseAccents(cleanUser);
  const userAsHiragana = romajiToHiragana(cleanUser);

  // 1. Match Furigana (Hiragana or Romaji conversion)
  if (card.furigana) {
    const cleanFurigana = card.furigana.toLowerCase().trim();
    if (cleanUser === cleanFurigana || userAsHiragana === cleanFurigana) {
      return true;
    }
  }

  // 2. Match Exact Term (Kanji or Word)
  if (card.term) {
    const cleanTerm = card.term.toLowerCase().trim();
    if (cleanUser === cleanTerm || userAsHiragana === cleanTerm) {
      return true;
    }
  }

  // 3. Match Vietnamese Meaning (Full or Substring or Accent-Insensitive)
  if (card.meaning) {
    const cleanMeaning = card.meaning.toLowerCase().trim();
    const meaningNoAccent = removeVietnameseAccents(cleanMeaning);

    if (cleanUser === cleanMeaning || userNoAccent === meaningNoAccent) {
      return true;
    }

    // Check individual keywords if meaning has multiple phrases (e.g. "tất yếu, bắt buộc")
    const meaningTokens = cleanMeaning.split(/[,;\-\/]/).map(t => t.trim()).filter(Boolean);
    for (const tok of meaningTokens) {
      const tokNoAccent = removeVietnameseAccents(tok);
      if (cleanUser === tok || userNoAccent === tokNoAccent) {
        return true;
      }
    }
  }

  // 4. Match Sino-Vietnamese (Hán-Việt)
  if (card.hanViet) {
    const cleanHanViet = card.hanViet.toLowerCase().trim();
    const hanVietNoAccent = removeVietnameseAccents(cleanHanViet);
    if (cleanUser === cleanHanViet || userNoAccent === hanVietNoAccent) {
      return true;
    }
  }

  return false;
}

function isGrammarTerm(term) {
  if (!term) return false;
  return term.includes('〜') || term.includes('~') || term.includes('cấu trúc') || term.includes('mẫu câu') || term.length > 18;
}

function removeVietnameseAccents(str) {
  if (!str) return '';
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().trim();
}

function romajiToHiragana(romaji) {
  if (!romaji) return '';
  let str = romaji.toLowerCase().trim();
  const map = {
    'kya':'きゃ','kyu':'きゅ','kyo':'きょ','sha':'しゃ','shu':'しゅ','sho':'しょ','cha':'ちゃ','chu':'ちゅ','cho':'ちょ',
    'nya':'にゃ','nyu':'にゅ','nyo':'にょ','hya':'ひゃ','hyu':'ひゅ','hyo':'ひょ','mya':'みゃ','myu':'みゅ','myo':'みょ',
    'rya':'りゃ','ryu':'りゅ','ryo':'りょ','gya':'ぎゃ','gyu':'ぎゅ','gyo':'ぎょ','ja':'じゃ','ju':'じゅ','jo':'じょ',
    'bya':'びゃ','byu':'びゅ','byo':'びょ','pya':'ぴゃ','pyu':'ぴゅ','pyo':'ぴょ',
    'tsu':'つ','chi':'ち','shi':'し','fu':'ふ',
    'ka':'か','ki':'き','ku':'く','ke':'け','ko':'こ',
    'sa':'さ','si':'し','su':'す','se':'せ','so':'そ',
    'ta':'た','ti':'ち','tu':'つ','te':'て','to':'と',
    'na':'な','ni':'に','nu':'ぬ','ne':'ね','no':'の',
    'ha':'は','hi':'ひ','hu':'ふ','he':'へ','ho':'ほ',
    'ma':'ま','mi':'み','mu':'む','me':'め','mo':'も',
    'ya':'や','yu':'ゆ','yo':'よ',
    'ra':'ら','ri':'り','ru':'る','re':'れ','ro':'ろ',
    'wa':'わ','wo':'を','nn':'ん','n':'ん',
    'ga':'が','gi':'ぎ','gu':'ぐ','ge':'げ','go':'ご',
    'za':'ざ','ji':'じ','zi':'じ','zu':'ず','ze':'ぜ','zo':'ぞ',
    'da':'だ','di':'ぢ','du':'づ','de':'で','do':'ど',
    'ba':'ば','bi':'び','bu':'ぶ','be':'べ','bo':'ぼ',
    'pa':'ぱ','pi':'ぴ','pu':'ぷ','pe':'ぺ','po':'ぽ',
    'a':'あ','i':'い','u':'う','e':'え','o':'お'
  };

  str = str.replace(/([ksthmyrwnzdbp])\1/g, 'っ$1');
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    str = str.split(k).join(map[k]);
  }
  return str;
}

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
          type: isGrammarTerm(term) ? 'grammar' : 'vocab',
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
// MODAL RENDERING (SHOW FULL LIST FIRST -> PRACTICE SESSION)
// --------------------------------------------------------------------------

function renderFlashcardModalContent() {
  const bodyEl = document.getElementById('flashcardModalBody');
  if (!bodyEl) return;

  if (isPracticeModeActive) {
    renderPracticeModeView(bodyEl);
  } else {
    renderOverviewListView(bodyEl);
  }
}

// VIEW 1: SHOW FULL LIST OVERVIEW
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
          <button class="btn-secondary" onclick="flashcardService.promptAddCustom()" style="margin-top: 10px; font-size: 0.9rem;">
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
      const isGrammar = c.type === 'grammar';

      if (isGrammar) {
        return `
          <div class="vocab-overview-item rich-card ${isMastered ? 'is-mastered' : ''}" id="vcard_${c.id}">
            <div class="vocab-item-left">
              <span class="vocab-item-idx">#${c.stt || (idx + 1)}</span>
              <div class="vocab-item-main">
                <div class="vocab-item-term-row">
                  <span class="vocab-item-term">${escapeHtml(c.pattern || c.term)}</span>
                  <span class="tag-type-grammar"><i class="fas fa-shapes"></i> Ngữ pháp ${escapeHtml(c.level || 'N2')}</span>
                  <button type="button" class="btn-vocab-speaker" onclick="flashcardService.speak('${escapeHtml(c.pattern || c.term)}', event)" title="Nghe phát âm">
                    <i class="fas fa-volume-high"></i>
                  </button>
                </div>
                
                <div class="vocab-card-details">
                  <div class="detail-row"><span class="detail-label">📖 Ý nghĩa:</span> <span class="detail-val font-bold text-accent">${escapeHtml(c.meaning || '')}</span></div>
                  ${c.connection ? `<div class="detail-row"><span class="detail-label">🔗 Công thức nối:</span> <span class="detail-val font-mono code-box">${escapeHtml(c.connection)}</span></div>` : ''}
                  ${c.usageNotes ? `<div class="detail-row"><span class="detail-label">💡 Sắc thái dùng:</span> <span class="detail-val text-muted">${escapeHtml(c.usageNotes)}</span></div>` : ''}
                  
                  ${c.examJa1 ? `
                    <div class="detail-exam-box">
                      <div class="exam-ja-row">
                        <span>📝 ${escapeHtml(c.examJa1)}</span>
                        <button type="button" class="btn-mini-speaker" onclick="flashcardService.speak('${escapeHtml(c.examJa1)}', event)"><i class="fas fa-volume-high"></i></button>
                      </div>
                      ${c.examVi1 ? `<div class="exam-vi-row">➔ ${escapeHtml(c.examVi1)}</div>` : ''}
                    </div>` : ''}

                  ${c.similarPatterns ? `<div class="detail-row text-xs text-muted"><span class="detail-label">🔗 Mở rộng:</span> <span class="detail-val">${escapeHtml(c.similarPatterns)}</span></div>` : ''}
                  
                  ${c.context ? `
                    <div class="detail-context-row">
                      <i class="fas fa-comment-dots"></i> <span>Manga: "${escapeHtml(c.context)}"</span>
                      ${c.pageIndex ? `<button type="button" class="btn-jump-page" onclick="jumpToPageAndCloseModal(${c.pageIndex - 1})" title="Xem tại trang ${c.pageIndex}"><i class="fas fa-search"></i> Trang ${c.pageIndex}</button>` : ''}
                    </div>` : ''}
                </div>
              </div>
            </div>

            <div class="vocab-item-actions">
              <button type="button" class="btn-toggle-mastered ${isMastered ? 'active' : ''}" 
                      onclick="flashcardService.toggleMastered('${c.id}', event)" 
                      title="${isMastered ? 'Đã thuộc (Nhấp để ôn lại)' : 'Đánh dấu đã thuộc'}">
                <i class="fas ${isMastered ? 'fa-check-circle' : 'fa-circle'}"></i>
                <span>${isMastered ? 'Đã thuộc' : 'Chưa nhớ'}</span>
              </button>
              <button type="button" class="btn-vocab-del" onclick="flashcardService.deleteCard('${c.id}', event)" title="Xóa thẻ">
                <i class="fas fa-trash-can"></i>
              </button>
            </div>
          </div>
        `;
      }

      // Vocabulary Rich Card
      return `
        <div class="vocab-overview-item rich-card ${isMastered ? 'is-mastered' : ''}" id="vcard_${c.id}">
          <div class="vocab-item-left">
            <span class="vocab-item-idx">#${c.stt || (idx + 1)}</span>
            <div class="vocab-item-main">
              <div class="vocab-item-term-row">
                <span class="vocab-item-term">${escapeHtml(c.term)}</span>
                ${c.pos ? `<span class="tag-pos">${escapeHtml(c.pos)}</span>` : ''}
                
                ${c.pitchHtml ? `
                  <div class="pitch-accent-box">
                    <span class="pitch-mora-line">${c.pitchHtml}</span>
                    <span class="pitch-badge-tag">${escapeHtml(c.pitchLabel || c.pitchShort || '')}</span>
                  </div>
                ` : (c.reading ? `<span class="vocab-item-furigana">【 ${escapeHtml(c.reading)} 】</span>` : '')}

                <button type="button" class="btn-vocab-speaker" onclick="flashcardService.speak('${escapeHtml(c.term)}', event)" title="Nghe phát âm">
                  <i class="fas fa-volume-high"></i>
                </button>
              </div>

              <div class="vocab-card-details">
                <div class="detail-row">
                  ${c.hanViet ? `<span class="tag-hanviet-badge">HV: ${escapeHtml(c.hanViet)}</span>` : ''}
                  <span class="detail-meaning-text font-bold text-accent">${escapeHtml(c.meaning || 'Chưa có định nghĩa')}</span>
                </div>

                ${c.kanjiBreakdown ? `<div class="detail-row text-xs text-muted"><span class="detail-label">🧩 Chiết tự:</span> <span class="detail-val">${escapeHtml(c.kanjiBreakdown)}</span></div>` : ''}
                
                ${c.examJa ? `
                  <div class="detail-exam-box">
                    <div class="exam-ja-row">
                      <span>📝 ${escapeHtml(c.examJa)}</span>
                      <button type="button" class="btn-mini-speaker" onclick="flashcardService.speak('${escapeHtml(c.examJa)}', event)"><i class="fas fa-volume-high"></i></button>
                    </div>
                    ${c.examVi ? `<div class="exam-vi-row">➔ ${escapeHtml(c.examVi)}</div>` : ''}
                  </div>` : ''}

                ${c.synonymsAntonyms ? `<div class="detail-row text-xs text-muted"><span class="detail-label">🔗 Mở rộng:</span> <span class="detail-val">${escapeHtml(c.synonymsAntonyms)}</span></div>` : ''}
                
                ${c.context ? `
                  <div class="detail-context-row">
                    <i class="fas fa-comment-dots"></i> <span>Manga: "${escapeHtml(c.context)}"</span>
                    ${c.pageIndex ? `<button type="button" class="btn-jump-page" onclick="jumpToPageAndCloseModal(${c.pageIndex - 1})" title="Xem tại trang ${c.pageIndex}"><i class="fas fa-search"></i> Trang ${c.pageIndex}</button>` : ''}
                  </div>` : ''}
              </div>
            </div>
          </div>

          <div class="vocab-item-actions">
            <button type="button" class="btn-toggle-mastered ${isMastered ? 'active' : ''}" 
                    onclick="flashcardService.toggleMastered('${c.id}', event)" 
                    title="${isMastered ? 'Đã thuộc (Nhấp để ôn lại)' : 'Đánh dấu đã thuộc'}">
              <i class="fas ${isMastered ? 'fa-check-circle' : 'fa-circle'}"></i>
              <span>${isMastered ? 'Đã thuộc' : 'Chưa nhớ'}</span>
            </button>
            <button type="button" class="btn-vocab-del" onclick="flashcardService.deleteCard('${c.id}', event)" title="Xóa thẻ">
              <i class="fas fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  container.innerHTML = `
    <!-- Top Action Banner: Start Practice -->
    <div class="flashcard-cta-banner">
      <div class="cta-banner-info">
        <div class="cta-banner-title">
          <i class="fas fa-keyboard"></i>
          <span>Luyện tập từ vựng & ngữ pháp chương này</span>
        </div>
        <div class="cta-banner-progress">
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${percent}%;"></div>
          </div>
          <span class="progress-text">${mastered}/${total} đã thuộc (${percent}%)</span>
        </div>
      </div>
      <button type="button" class="btn-start-practice" onclick="flashcardService.startPractice()" ${total === 0 ? 'disabled' : ''}>
        <i class="fas fa-play"></i>
        <span>Bắt Đầu Luyện Tập</span>
      </button>
    </div>

    <!-- Filter & Add Bar -->
    <div class="vocab-toolbar-row">
      <div class="vocab-search-box">
        <i class="fas fa-search"></i>
        <input type="text" id="vocabFilterInput" placeholder="Tìm kiếm từ vựng, Hán-Việt, ý nghĩa..." value="${escapeHtml(flashcardFilterQuery)}" oninput="flashcardService.handleFilterChange(this.value)">
        ${flashcardFilterQuery ? `<button type="button" class="btn-clear-search" onclick="flashcardService.handleFilterChange('')"><i class="fas fa-times"></i></button>` : ''}
      </div>
      <button type="button" class="btn-add-custom-card" onclick="flashcardService.promptAddCustom()" title="Thêm từ vựng hoặc ngữ pháp">
        <i class="fas fa-plus"></i> <span>Thêm thẻ</span>
      </button>
    </div>

    <!-- Full Vocabulary List -->
    <div class="vocab-list-scrollable">
      ${cardsHtml}
    </div>
  `;
}

// VIEW 2: PRACTICE SESSION (TYPE-TO-CHECK FOR VOCAB, 3D FLIP FOR GRAMMAR)
function renderPracticeModeView(container) {
  if (practiceSessionCards.length === 0) {
    flashcardService.switchToList();
    return;
  }

  // Completed all cards in session
  if (practiceCurrentIndex >= practiceSessionCards.length) {
    const total = practiceSessionCards.length;
    const mastered = practiceSessionCards.filter(c => c.mastered).length;
    const percent = Math.round((mastered / total) * 100);

    container.innerHTML = `
      <div class="practice-completed-screen">
        <div class="congrats-trophy"><i class="fas fa-award"></i></div>
        <h3 class="congrats-title">🎉 Xuất Sắc! Hoàn Thành Phiên Ôn Tập</h3>
        <p class="congrats-sub">Bạn đã hoàn thành phiên luyện tập ${total} thẻ trong chương này.</p>
        
        <div class="practice-score-card">
          <div class="score-circle">
            <span class="score-number">${percent}%</span>
            <span class="score-label">Độ chính xác</span>
          </div>
          <div class="score-details">
            <div class="score-row text-success"><i class="fas fa-check-circle"></i> Đã nhớ: <b>${mastered} từ</b></div>
            <div class="score-row text-warning"><i class="fas fa-rotate-left"></i> Cần ôn lại: <b>${total - mastered} từ</b></div>
          </div>
        </div>

        <div class="practice-finish-actions">
          ${(total - mastered > 0) ? `
            <button type="button" class="btn-primary" onclick="flashcardService.restartUnmastered()">
              <i class="fas fa-rotate-left"></i> Ôn lại ${total - mastered} từ chưa nhớ
            </button>
          ` : ''}
          <button type="button" class="btn-secondary" onclick="flashcardService.startPractice()">
            <i class="fas fa-redo"></i> Luyện lại từ đầu
          </button>
          <button type="button" class="btn-secondary" onclick="flashcardService.switchToList()">
            <i class="fas fa-list-ul"></i> Quay lại danh sách tổng quan
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
  const isGrammar = card.type === 'grammar';

  // Branch A: GRAMMAR CARD -> 3D FLIP CARD
  if (isGrammar) {
    container.innerHTML = `
      <div class="practice-mode-wrapper">
        <!-- Subheader -->
        <div class="practice-subheader">
          <button type="button" class="btn-back-to-list" onclick="flashcardService.switchToList()" title="Quay lại danh sách">
            <i class="fas fa-arrow-left"></i> <span>Danh sách</span>
          </button>
          <div class="practice-progress-pill">
            <span>Ngữ pháp: ${currentNum} / ${total}</span>
            <div class="practice-mini-bar"><div class="practice-mini-fill" style="width: ${percent}%;"></div></div>
          </div>
          <button type="button" class="btn-icon" onclick="flashcardService.closeModal()"><i class="fas fa-times"></i></button>
        </div>

        <!-- 3D Flip Card Scene -->
        <div class="practice-card-scene" onclick="flashcardService.toggleFlip()">
          <div id="flashcard3dBox" class="practice-3d-card ${isPracticeFlipped ? 'is-flipped' : ''}">
            
            <!-- Front Face -->
            <div class="card-face card-face-front">
              <div class="card-face-hint">
                <span class="tag-type-grammar"><i class="fas fa-shapes"></i> Ngữ pháp</span>
                <span><i class="fas fa-hand-pointer"></i> Chạm để lật cấu trúc & ví dụ (Space)</span>
              </div>
              
              <div class="card-front-content">
                <div class="card-term-display">${escapeHtml(card.term)}</div>
                ${card.furigana ? `<div class="card-reading-display">【 ${escapeHtml(card.furigana)} 】</div>` : ''}
              </div>

              <div class="card-face-footer">
                <button type="button" class="btn-card-audio-play" onclick="flashcardService.speakCurrentPractice(event)">
                  <i class="fas fa-volume-high"></i> <span>Phát âm</span>
                </button>
              </div>
            </div>

            <!-- Back Face -->
            <div class="card-face card-face-back">
              <div class="card-face-hint"><i class="fas fa-check-circle"></i> Cấu trúc & Cách dùng</div>
              
              <div class="card-back-content">
                <div class="card-back-term">${escapeHtml(card.term)}</div>
                ${card.hanViet ? `<div class="card-back-hanviet">Âm Hán-Việt: <b>${escapeHtml(card.hanViet)}</b></div>` : ''}
                <div class="card-back-meaning">${escapeHtml(card.meaning || 'Chưa có giải nghĩa')}</div>
                ${card.context ? `<div class="card-back-context"><b>Ví dụ:</b> <i>"${escapeHtml(card.context)}"</i></div>` : ''}
              </div>

              <div class="card-face-footer">
                <button type="button" class="btn-card-audio-play" onclick="flashcardService.speakCurrentPractice(event)">
                  <i class="fas fa-volume-high"></i> <span>Nghe lại</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Footer Rating Controls -->
        <div class="practice-controls-row">
          <button type="button" class="btn-rate-answer btn-rate-forgot" onclick="flashcardService.ratePracticeCard(false)">
            <i class="fas fa-rotate-left"></i>
            <span>Chưa nhớ</span>
            <span class="kbd-hint">Phím ←</span>
          </button>

          <button type="button" class="btn-rate-flip" onclick="flashcardService.toggleFlip()">
            <i class="fas fa-repeat"></i>
            <span>Lật thẻ</span>
            <span class="kbd-hint">Phím Space</span>
          </button>

          <button type="button" class="btn-rate-answer btn-rate-remembered" onclick="flashcardService.ratePracticeCard(true)">
            <i class="fas fa-check"></i>
            <span>Đã thuộc</span>
            <span class="kbd-hint">Phím →</span>
          </button>
        </div>

      </div>
    `;
    return;
  }

  // Branch B: VOCABULARY CARD -> TYPE-TO-CHECK MODE (GÕ ĐỂ CHECK)
  let stateContainerHtml = '';

  if (currentTypingState === 'input') {
    stateContainerHtml = `
      <div class="typing-card-body">
        <div class="typing-term-display">${escapeHtml(card.term)}</div>
        <button type="button" class="btn-vocab-speaker-large" onclick="flashcardService.speakCurrentPractice(event)" title="Nghe phát âm">
          <i class="fas fa-volume-high"></i>
        </button>

        <form class="typing-input-box" onsubmit="event.preventDefault(); flashcardService.checkTypingAnswer();">
          <div class="typing-input-wrapper">
            <input type="text" 
                   id="practiceTypingInput" 
                   class="practice-typing-input" 
                   placeholder="✍️ Gõ cách đọc (Hiragana / Romaji) hoặc nghĩa tiếng Việt..." 
                   autofocus 
                   autocomplete="off" 
                   spellcheck="false">
            <button type="submit" class="btn-typing-submit">
              <i class="fas fa-paper-plane"></i> <span>Kiểm tra (Enter)</span>
            </button>
          </div>
        </form>

        <div class="typing-hints-row">
          <button type="button" class="btn-typing-hint" onclick="flashcardService.revealAnswer()">
            <i class="fas fa-lightbulb"></i> <span>Xem gợi ý / Đáp án (Tab)</span>
          </button>
        </div>
      </div>
    `;
  } else if (currentTypingState === 'correct') {
    stateContainerHtml = `
      <div class="typing-card-body state-correct">
        <div class="typing-badge-result correct">
          <i class="fas fa-circle-check"></i> <span>CHÍNH XÁC TUYỆT ĐỐI!</span>
        </div>

        <div class="typing-term-display">${escapeHtml(card.term)}</div>
        ${card.furigana ? `<div class="typing-reading-display">【 ${escapeHtml(card.furigana)} 】</div>` : ''}

        <div class="typing-details-card">
          ${card.hanViet ? `<div class="detail-row"><span class="detail-label">Âm Hán-Việt:</span> <b>${escapeHtml(card.hanViet)}</b></div>` : ''}
          <div class="detail-row"><span class="detail-label">Nghĩa tiếng Việt:</span> <span class="detail-meaning">${escapeHtml(card.meaning || 'Chưa có định nghĩa')}</span></div>
          ${card.context ? `<div class="detail-context"><i>"${escapeHtml(card.context)}"</i></div>` : ''}
        </div>

        <div class="typing-next-controls">
          <button type="button" id="btnNextPracticeCard" class="btn-typing-next correct" onclick="flashcardService.nextPracticeCard()" autofocus>
            <span>Tiếp tục từ kế tiếp</span> <i class="fas fa-arrow-right"></i>
            <span class="kbd-hint">(Phím Enter)</span>
          </button>
        </div>
      </div>
    `;
  } else if (currentTypingState === 'incorrect') {
    stateContainerHtml = `
      <div class="typing-card-body state-incorrect">
        <div class="typing-badge-result incorrect">
          <i class="fas fa-circle-xmark"></i> <span>CHƯA CHÍNH XÁC</span>
        </div>

        <div class="typing-term-display">${escapeHtml(card.term)}</div>
        <div class="typing-user-feedback">
          <div class="feedback-wrong">Bạn đã nhập: <s>"${escapeHtml(lastUserTypedInput)}"</s></div>
          <div class="feedback-correct">
            <span>Đáp án đúng:</span>
            <b>${card.furigana ? `【 ${escapeHtml(card.furigana)} 】` : ''} ${escapeHtml(card.meaning || '')} ${card.hanViet ? `[${escapeHtml(card.hanViet)}]` : ''}</b>
          </div>
        </div>

        ${card.context ? `<div class="detail-context"><i>"${escapeHtml(card.context)}"</i></div>` : ''}

        <div class="typing-retry-controls">
          <button type="button" class="btn-typing-retry" onclick="flashcardService.retryTyping()">
            <i class="fas fa-rotate-left"></i> <span>Gõ lại</span>
          </button>
          <button type="button" id="btnNextPracticeCard" class="btn-typing-next" onclick="flashcardService.nextPracticeCard()" autofocus>
            <span>Đã hiểu, sang từ tiếp</span> <i class="fas fa-arrow-right"></i>
            <span class="kbd-hint">(Phím Enter)</span>
          </button>
        </div>
      </div>
    `;
  } else if (currentTypingState === 'revealed') {
    stateContainerHtml = `
      <div class="typing-card-body state-revealed">
        <div class="typing-badge-result revealed">
          <i class="fas fa-lightbulb"></i> <span>ĐÁP ÁN TỪ VỰNG</span>
        </div>

        <div class="typing-term-display">${escapeHtml(card.term)}</div>
        ${card.furigana ? `<div class="typing-reading-display">【 ${escapeHtml(card.furigana)} 】</div>` : ''}

        <div class="typing-details-card">
          ${card.hanViet ? `<div class="detail-row"><span class="detail-label">Âm Hán-Việt:</span> <b>${escapeHtml(card.hanViet)}</b></div>` : ''}
          <div class="detail-row"><span class="detail-label">Nghĩa tiếng Việt:</span> <span class="detail-meaning">${escapeHtml(card.meaning || 'Chưa có định nghĩa')}</span></div>
          ${card.context ? `<div class="detail-context"><i>"${escapeHtml(card.context)}"</i></div>` : ''}
        </div>

        <div class="typing-retry-controls">
          <button type="button" class="btn-typing-retry" onclick="flashcardService.retryTyping()">
            <i class="fas fa-keyboard"></i> <span>Thử gõ lại</span>
          </button>
          <button type="button" id="btnNextPracticeCard" class="btn-typing-next" onclick="flashcardService.nextPracticeCard()" autofocus>
            <span>Tiếp tục</span> <i class="fas fa-arrow-right"></i>
            <span class="kbd-hint">(Phím Enter)</span>
          </button>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="practice-mode-wrapper">
      <!-- Subheader -->
      <div class="practice-subheader">
        <button type="button" class="btn-back-to-list" onclick="flashcardService.switchToList()" title="Quay lại danh sách">
          <i class="fas fa-arrow-left"></i> <span>Quay lại Danh sách</span>
        </button>
        <div class="practice-progress-pill">
          <span>Gõ Check: ${currentNum} / ${total}</span>
          <div class="practice-mini-bar"><div class="practice-mini-fill" style="width: ${percent}%;"></div></div>
        </div>
        <button type="button" class="btn-icon" onclick="flashcardService.closeModal()"><i class="fas fa-times"></i></button>
      </div>

      <!-- Main Typing Card -->
      <div class="typing-card-scene">
        ${stateContainerHtml}
      </div>
    </div>
  `;

  // Auto-focus input or next button
  setTimeout(() => {
    const inputEl = document.getElementById('practiceTypingInput');
    const nextBtn = document.getElementById('btnNextPracticeCard');
    if (inputEl) inputEl.focus();
    else if (nextBtn) nextBtn.focus();
  }, 100);
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

function jumpToPageAndCloseModal(pageIdx) {
  if (typeof jumpToPage === 'function') {
    jumpToPage(pageIdx);
  }
  flashcardService.closeModal();
}

window.jumpToPageAndCloseModal = jumpToPageAndCloseModal;

// Global Export
window.flashcardService = flashcardService;
window.openFlashcardModal = () => flashcardService.openModal();
window.closeFlashcardModal = () => flashcardService.closeModal();
window.startFlashcardPractice = () => flashcardService.startPractice();
window.restartPracticeUnmasteredOnly = () => flashcardService.restartUnmastered();
window.switchToListView = () => flashcardService.switchToList();
window.toggleFlipPracticeCard = () => flashcardService.toggleFlip();
window.speakCurrentPracticeCard = (e) => flashcardService.speakCurrentPractice(e);
window.rateCurrentPracticeCard = (mastered) => flashcardService.ratePracticeCard(mastered);
window.handleVocabFilterChange = (q) => flashcardService.handleFilterChange(q);
window.promptAddCustomFlashcard = () => flashcardService.promptAddCustom();
window.speakVocabTerm = (term, e) => flashcardService.speak(term, e);
