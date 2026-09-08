/* ==========================================================================
   EDUMANGA HUB - CHAPTER VOCABULARY & FLASHCARD SERVICE (V3.5 - 2-WAY RECALL)
   - 2-Way Spaced Repetition Practice:
     * Direction 1: Nhìn Kanji/Từ gốc ➔ Gõ Cách đọc (Hiragana/Romaji) hoặc Nghĩa
     * Direction 2: Nhìn Nghĩa tiếng Việt ➔ Gõ Từ tiếng Nhật (Kanji/Hiragana/Romaji)
   - Vocabulary Cards: Type-to-Check (Active Recall Typing & Smart Auto-Validation)
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

// Practice Mode Selection:
// Cố định 1 chế độ duy nhất: 'two_way' (Mỗi từ học 2 chiều: Nhìn Kanji -> Gõ Đọc/Nghĩa & Nhìn Nghĩa -> Gõ Tiếng Nhật)
let practiceModeDirection = 'two_way';

// Typing Mode State for current card: 'input' | 'correct' | 'incorrect' | 'revealed'
let currentTypingState = 'input';
let lastUserTypedInput = '';

// Session result tracker for 2-way mastery: { [cardId]: { k2r: bool|null, m2k: bool|null } }
let sessionWordResults = {};

// Mastery Loop & Points System (Khi đạt 100% tiến độ -> Nhận 1 điểm tích lũy & Reset về 0)
function getMasteryPoints() {
  if (!currentFlashcardChapterKey) return 0;
  try {
    const pts = localStorage.getItem(`edumanga_vocab_loops_${currentFlashcardChapterKey}`);
    return pts ? parseInt(pts, 10) : 0;
  } catch (e) {
    return 0;
  }
}

function checkAndAwardMasteryLoop() {
  const total = currentChapterVocabList.length;
  if (total === 0) return false;
  const masteredCount = currentChapterVocabList.filter(c => c.mastered).length;

  // When 100% full progress is reached -> Award 1 point & Reset to 0 for next spaced repetition loop
  if (masteredCount >= total) {
    const newLoops = getMasteryPoints() + 1;
    try {
      localStorage.setItem(`edumanga_vocab_loops_${currentFlashcardChapterKey}`, newLoops);
      const totalPoints = (parseInt(localStorage.getItem('edumanga_total_mastery_points') || '0', 10)) + 1;
      localStorage.setItem('edumanga_total_mastery_points', totalPoints);
    } catch (e) {}

    // Reset all cards in this chapter to unmastered (0%) for the next loop
    currentChapterVocabList.forEach(c => c.mastered = false);
    saveCurrentFlashcardsToStorage();
    updateFlashcardBadges();

    showToast(`🏆 HOÀN THÀNH 100%! +1 Điểm tích lũy (Tổng: ${newLoops} ⭐). Tiến độ đã reset để bạn tiếp tục ôn luyện vòng mới!`);
    return true;
  }
  return false;
}

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
      extractedMap.set(item.term.replace(/～|~/g, '').trim().toLowerCase(), item);
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
        reading: v.reading || '',
        furigana: v.reading || '',
        romaji: v.romaji || '',
        hanViet: v.han_viet || '',
        meaning: v.meaning || '',
        type: 'vocab',
        pos: v.type || 'Danh từ',
        examJa: v.exam_ja || '',
        examVi: v.exam_vi || '',
        kanjiBreakdown: v.kanji_breakdown || '',
        pitchHtml: v.pitch_html || '',
        pitchLabel: v.pitch_label || '',
        pitchShort: v.pitch_short || '',
        synonymsAntonyms: v.synonyms_antonyms || '',
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
      const ext = extractedMap.get(key) || extractedMap.get(g.pattern.replace(/～|~/g, '').trim().toLowerCase());
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
          furigana: (item.furigana || '').trim(),
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
    
    // Check if progress reached 100% -> award point & reset
    const awarded = checkAndAwardMasteryLoop();

    updateFlashcardBadges();
    renderFlashcardModalContent();

    if (!awarded) {
      if (card.mastered) {
        showToast(`✨ Đã đánh dấu thuộc từ "${card.term}"!`);
      } else {
        showToast(`📝 Chuyển từ "${card.term}" sang cần ôn tập`);
      }
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
      showToast(`🔄 Đã cập nhật thẻ "${cleanTerm}"!`);
      return;
    }

    const newCard = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      term: cleanTerm,
      furigana: (cardData.furigana || '').trim(),
      reading: (cardData.furigana || '').trim(),
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
    showToast(`🎉 Đã thêm thẻ "${cleanTerm}" thành công!`);
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
  // PRACTICE SESSION ACTIONS (2-WAY RECALL SYSTEM)
  // ------------------------------------------------------------------------
  setPracticeModeDirection(dir) {
    practiceModeDirection = 'two_way'; // Always 2-way recall
    if (isPracticeModeActive) {
      this.startPractice();
    } else {
      renderFlashcardModalContent();
    }
  },

  // Build 2-way question items from word list
  generatePracticeQuestions(wordList) {
    sessionWordResults = {};
    const questions = [];

    wordList.forEach(c => {
      sessionWordResults[c.id] = { k2r: null, m2k: null };

      if (c.type === 'grammar') {
        questions.push({
          ...c,
          _direction: 'grammar_flip',
          _questionId: `${c.id}_grammar`,
          _originalId: c.id
        });
        return;
      }

      if (practiceModeDirection === 'two_way') {
        // Generate 2 questions for this vocabulary card
        // Question A: Nhìn Kanji -> Gõ Đọc / Nghĩa
        const qA = {
          ...c,
          _direction: 'kanji_to_reading',
          _questionId: `${c.id}_k2r`,
          _originalId: c.id,
          _directionLabel: 'Nhìn Kanji ➔ Gõ Cách đọc / Nghĩa'
        };
        // Question B: Nhìn Nghĩa -> Gõ Tiếng Nhật (Kanji / Hiragana / Romaji)
        const qB = {
          ...c,
          _direction: 'meaning_to_kanji',
          _questionId: `${c.id}_m2k`,
          _originalId: c.id,
          _directionLabel: 'Nhìn Nghĩa ➔ Gõ Từ tiếng Nhật'
        };
        questions.push(qA);
        questions.push(qB);
      } else if (practiceModeDirection === 'meaning_only') {
        questions.push({
          ...c,
          _direction: 'meaning_to_kanji',
          _questionId: `${c.id}_m2k`,
          _originalId: c.id,
          _directionLabel: 'Nhìn Nghĩa ➔ Gõ Từ tiếng Nhật'
        });
      } else {
        // Default: kanji_only
        questions.push({
          ...c,
          _direction: 'kanji_to_reading',
          _questionId: `${c.id}_k2r`,
          _originalId: c.id,
          _directionLabel: 'Nhìn Kanji ➔ Gõ Cách đọc / Nghĩa'
        });
      }
    });

    // Intelligent Shuffle: For 2-way mode, separate Question A and Question B of the same card
    if (practiceModeDirection === 'two_way' && questions.length > 2) {
      const qAList = questions.filter(q => q._direction === 'kanji_to_reading' || q._direction === 'grammar_flip');
      const qBList = questions.filter(q => q._direction === 'meaning_to_kanji');
      
      // Shuffle both halves separately
      shuffleArray(qAList);
      shuffleArray(qBList);

      // Concatenate Round 1 (Kanji recall) followed by Round 2 (Active Japanese recall)
      return [...qAList, ...qBList];
    }

    shuffleArray(questions);
    return questions;
  },

  startPractice() {
    if (currentChapterVocabList.length === 0) {
      showToast("⚠️ Chương này chưa có từ vựng để ôn tập!");
      return;
    }

    practiceSessionCards = this.generatePracticeQuestions(currentChapterVocabList);
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

    practiceSessionCards = this.generatePracticeQuestions(unmastered);
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
      const originalId = card._originalId || card.id;
      const mainCard = currentChapterVocabList.find(c => c.id === originalId);
      if (mainCard) {
        mainCard.mastered = mastered;
        saveCurrentFlashcardsToStorage();
        checkAndAwardMasteryLoop();
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
  // TYPE-TO-CHECK VOCABULARY ENGINE (2-WAY SMART VALIDATION)
  // ------------------------------------------------------------------------
  checkTypingAnswer() {
    const inputEl = document.getElementById('practiceTypingInput');
    if (!inputEl) return;

    const userInput = inputEl.value.trim();
    if (!userInput) {
      showToast("✍️ Vui lòng gõ đáp án để kiểm tra!");
      inputEl.focus();
      return;
    }

    const card = practiceSessionCards[practiceCurrentIndex];
    if (!card) return;

    const originalId = card._originalId || card.id;
    const direction = card._direction || 'kanji_to_reading';
    lastUserTypedInput = userInput;

    const isCorrect = evaluateAnswer(userInput, card, direction);
    const mainCard = currentChapterVocabList.find(c => c.id === originalId);

    // Update session tracker
    if (!sessionWordResults[originalId]) {
      sessionWordResults[originalId] = { k2r: null, m2k: null };
    }
    if (direction === 'kanji_to_reading') {
      sessionWordResults[originalId].k2r = isCorrect;
    } else if (direction === 'meaning_to_kanji') {
      sessionWordResults[originalId].m2k = isCorrect;
    }

    if (isCorrect) {
      currentTypingState = 'correct';
      
      // Check overall mastery in 2-way mode: both directions correct = mastered!
      const res = sessionWordResults[originalId];
      if (res.k2r === true && res.m2k === true) {
        if (mainCard) mainCard.mastered = true;
        card.mastered = true;
      }

      saveCurrentFlashcardsToStorage();
      checkAndAwardMasteryLoop();
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

    const originalId = card._originalId || card.id;
    const direction = card._direction || 'kanji_to_reading';

    currentTypingState = 'revealed';
    if (!sessionWordResults[originalId]) {
      sessionWordResults[originalId] = { k2r: null, m2k: null };
    }
    if (direction === 'kanji_to_reading') {
      sessionWordResults[originalId].k2r = false;
    } else if (direction === 'meaning_to_kanji') {
      sessionWordResults[originalId].m2k = false;
    }

    const mainCard = currentChapterVocabList.find(c => c.id === originalId);
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
    const term = prompt("Nhập từ vựng hoặc mẫu ngữ pháp:");
    if (!term || !term.trim()) return;

    const furigana = prompt("Cách đọc Furigana / Hiragana (nếu có):") || "";
    const hanViet = prompt("Âm Hán-Việt (nếu có):") || "";
    const meaning = prompt("Ý nghĩa / Định nghĩa tiếng Việt:") || "";

    const isGrammar = isGrammarTerm(term) || confirm("Đây có phải là thẻ mẫu Ngữ Pháp không? (Bấm OK để dùng thẻ Lật 3D, Cancel để dùng thẻ Gõ chữ)");

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
    utter.lang = 'ja-JP';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }
};

// --------------------------------------------------------------------------
// SMART ANSWER EVALUATION (2-WAY RECALL LOGIC)
// --------------------------------------------------------------------------
function cleanStr(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[\s\-_~～・\.\,\:\;\!\?\(\)\[\]「」『』\/\\+]+/g, '');
}

function katakanaToHiragana(src) {
  if (!src) return '';
  return src.replace(/[\u30a1-\u30f6]/g, match => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

function evaluateAnswer(userInput, card, direction = 'kanji_to_reading') {
  if (!userInput || !card) return false;

  const rawUser = String(userInput).trim();
  const cleanUser = cleanStr(rawUser);
  const userNoAccent = cleanStr(removeVietnameseAccents(rawUser));
  const userAsHiragana = cleanStr(romajiToHiragana(rawUser));
  const userFromKana = cleanStr(katakanaToHiragana(rawUser));

  const targetReading = cleanStr(card.reading || card.furigana);
  const targetRomaji = cleanStr(card.romaji);
  const targetTerm = cleanStr(card.term);
  const targetHanViet = cleanStr(removeVietnameseAccents(card.hanViet || card.han_viet || ''));
  const targetMeaning = cleanStr(removeVietnameseAccents(card.meaning || ''));

  // =========================================================================
  // DIRECTION 1: KANJI -> READING / MEANING (Nhìn Kanji ➔ Gõ Đọc / Nghĩa)
  // =========================================================================
  if (direction === 'kanji_to_reading') {
    // 1. Match Hiragana / Furigana
    if (targetReading) {
      if (cleanUser === targetReading || 
          userAsHiragana === targetReading || 
          userFromKana === targetReading) {
        return true;
      }
    }

    // 2. Match Romaji directly
    if (targetRomaji) {
      if (cleanUser === targetRomaji || 
          cleanStr(romajiToHiragana(cleanUser)) === cleanStr(romajiToHiragana(targetRomaji))) {
        return true;
      }
    }

    // 3. Match Exact Kanji / Term (nếu gõ luôn Kanji)
    if (targetTerm) {
      if (cleanUser === targetTerm || userAsHiragana === targetTerm) {
        return true;
      }
    }

    // 4. Match Vietnamese Meaning (Full or keyword tokens)
    if (targetMeaning) {
      if (userNoAccent === targetMeaning) {
        return true;
      }
      const tokens = (card.meaning || '')
        .split(/[,;\-\-\(\)]/)
        .map(t => cleanStr(removeVietnameseAccents(t)))
        .filter(t => t.length >= 2);

      for (const tok of tokens) {
        if (userNoAccent === tok || (tok.length >= 4 && userNoAccent.includes(tok)) || (userNoAccent.length >= 4 && tok.includes(userNoAccent))) {
          return true;
        }
      }
    }

    // 5. Match Sino-Vietnamese (Hán-Việt)
    if (targetHanViet) {
      if (userNoAccent === targetHanViet && targetHanViet.length >= 2) {
        return true;
      }
    }

    return false;
  }

  // =========================================================================
  // DIRECTION 2: MEANING -> KANJI / READING (Nhìn Nghĩa ➔ Gõ Kanji / Đọc)
  // =========================================================================
  if (direction === 'meaning_to_kanji') {
    // 1. Match Exact Kanji / Japanese Word
    if (targetTerm) {
      if (cleanUser === targetTerm || userAsHiragana === targetTerm || userFromKana === targetTerm) {
        return true;
      }
    }

    // 2. Match Hiragana / Furigana
    if (targetReading) {
      if (cleanUser === targetReading || 
          userAsHiragana === targetReading || 
          userFromKana === targetReading) {
        return true;
      }
    }

    // 3. Match Romaji
    if (targetRomaji) {
      if (cleanUser === targetRomaji || 
          cleanStr(romajiToHiragana(cleanUser)) === cleanStr(romajiToHiragana(targetRomaji))) {
        return true;
      }
    }

    // 4. Match Sino-Vietnamese (Hán-Việt) as fallback
    if (targetHanViet) {
      if (userNoAccent === targetHanViet && targetHanViet.length >= 2) {
        return true;
      }
    }

    return false;
  }

  return false;
}

function isGrammarTerm(term) {
  if (!term) return false;
  return term.includes('～') || term.includes('~') || term.includes('cấu trúc') || term.includes('mẫu câu') || term.length > 20;
}

function removeVietnameseAccents(str) {
  if (!str) return '';
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().trim();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Full & Accurate Romaji to Hiragana Converter
function romajiToHiragana(romaji) {
  if (!romaji) return '';
  let str = romaji.toLowerCase().trim();

  // Double consonants for sokuon (っ)
  str = str.replace(/([ksthmyrwnzdbpgc])\1/g, 'っ$1');
  str = str.replace(/tch/g, 'っち');

  const map = {
    // 3 letters
    'kya':'きゃ','kyu':'きゅ','kyo':'きょ',
    'sha':'しゃ','shu':'しゅ','sho':'しょ','she':'しぇ',
    'cha':'ちゃ','chu':'ちゅ','cho':'ちょ','che':'ちぇ',
    'nya':'にゃ','nyu':'にゅ','nyo':'にょ',
    'hya':'ひゃ','hyu':'ひゅ','hyo':'ひょ',
    'mya':'みゃ','myu':'みゅ','myo':'みょ',
    'rya':'りゃ','ryu':'りゅ','ryo':'りょ',
    'gya':'ぎゃ','gyu':'ぎゅ','gyo':'ぎょ',
    'jya':'じゃ','jyu':'じゅ','jyo':'じょ',
    'zya':'じゃ','zyu':'じゅ','zyo':'じょ',
    'bya':'びゃ','byu':'びゅ','byo':'びょ',
    'pya':'ぴゃ','pyu':'ぴゅ','pyo':'ぴょ',
    'tsu':'つ','chi':'ち','shi':'し','fu':'ふ','hu':'ふ',
    'dzu':'づ','dji':'ぢ',
    'ja':'じゃ','ju':'じゅ','jo':'じょ','je':'じぇ',
    // 2 letters
    'ka':'か','ki':'き','ku':'く','ke':'け','ko':'こ',
    'sa':'さ','si':'し','su':'す','se':'せ','so':'そ',
    'ta':'た','ti':'ち','tu':'つ','te':'て','to':'と',
    'na':'な','ni':'に','nu':'ぬ','ne':'ね','no':'の',
    'ha':'は','hi':'ひ','hu':'ふ','he':'へ','ho':'ほ',
    'ma':'ま','mi':'み','mu':'む','me':'め','mo':'も',
    'ya':'や','yu':'ゆ','yo':'よ',
    'ra':'ら','ri':'り','ru':'る','re':'れ','ro':'ろ',
    'wa':'わ','wo':'を',
    'ga':'が','gi':'ぎ','gu':'ぐ','ge':'げ','go':'ご',
    'za':'ざ','ji':'じ','zi':'じ','zu':'ず','ze':'ぜ','zo':'ぞ',
    'da':'だ','di':'ぢ','du':'づ','de':'de','do':'ど',
    'ba':'ば','bi':'び','bu':'ぶ','be':'べ','bo':'ぼ',
    'pa':'ぱ','pi':'ぴ','pu':'ぷ','pe':'ぺ','po':'ぽ',
    'nn':'ん',"n'":'ん','n ':'ん',
    // 1 letter
    'a':'あ','i':'い','u':'う','e':'え','o':'お',
    'n':'ん'
  };

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
  const pattern = /([a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u00C0-\u1EF9~～\.\-]+)\s*[\(（]([^\)）]+)[\)）]/g;

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
        const hasSeparator = /[-–—:：]/.test(noteContent);
        if (!hasJapanese && !hasSeparator) continue;

        const parts = noteContent.split(/\s*[-–—:：]\s*/).filter(p => p.length > 0);
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
          reading: furigana,
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
  const masteryPoints = getMasteryPoints();

  const countPill = document.getElementById('modalFlashcardCountText');
  if (countPill) {
    countPill.textContent = `(${mastered}/${total} từ đã thuộc${masteryPoints > 0 ? ` • ⭐ ${masteryPoints} điểm` : ''})`;
  }

  const btnBadge = document.getElementById('btnFlashcardsBadge');
  if (btnBadge) {
    btnBadge.textContent = total;
    btnBadge.style.display = total > 0 ? 'inline-block' : 'none';
  }
}

// --------------------------------------------------------------------------
// DYNAMIC UI RENDERING (VIEW 1: OVERVIEW LIST vs VIEW 2: PRACTICE SESSION)
// --------------------------------------------------------------------------
function renderFlashcardModalContent() {
  const container = document.getElementById('flashcardModalBody');
  if (!container) return;

  if (isPracticeModeActive) {
    renderPracticeModeView(container);
  } else {
    renderOverviewListView(container);
  }
}

// VIEW 1: VOCABULARY OVERVIEW & MANAGEMENT LIST
function renderOverviewListView(container) {
  const total = currentChapterVocabList.length;
  const mastered = currentChapterVocabList.filter(c => c.mastered).length;
  const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;

  // Filter Cards
  let filtered = currentChapterVocabList;
  if (flashcardFilterQuery) {
    const q = flashcardFilterQuery.toLowerCase().trim();
    filtered = currentChapterVocabList.filter(c => {
      return (c.term || '').toLowerCase().includes(q) ||
             (c.reading || c.furigana || '').toLowerCase().includes(q) ||
             (c.romaji || '').toLowerCase().includes(q) ||
             (c.hanViet || '').toLowerCase().includes(q) ||
             (c.meaning || '').toLowerCase().includes(q);
    });
  }

  let cardsHtml = '';
  if (filtered.length === 0) {
    if (total === 0) {
      cardsHtml = `
        <div class="flashcard-empty-state">
          <div class="empty-icon"><i class="fas fa-book-open"></i></div>
          <p class="empty-title">Chương này chưa có thẻ từ vựng nào</p>
          <p class="empty-desc">Từ vựng & ngữ pháp trong thoại manga sẽ tự động được trích xuất tại đây.</p>
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
                  <div class="detail-row"><span class="detail-label">📌 Ý nghĩa:</span> <span class="detail-val font-bold text-accent">${escapeHtml(c.meaning || '')}</span></div>
                  ${c.connection ? `<div class="detail-row"><span class="detail-label">🔗 Công thức nối:</span> <span class="detail-val font-mono code-box">${escapeHtml(c.connection)}</span></div>` : ''}
                  ${c.usageNotes ? `<div class="detail-row"><span class="detail-label">💡 Sắc thái dùng:</span> <span class="detail-val text-muted">${escapeHtml(c.usageNotes)}</span></div>` : ''}
                  
                  ${c.examJa1 ? `
                    <div class="detail-exam-box">
                      <div class="exam-ja-row">
                        <span>🇯🇵 ${escapeHtml(c.examJa1)}</span>
                        <button type="button" class="btn-mini-speaker" onclick="flashcardService.speak('${escapeHtml(c.examJa1)}', event)"><i class="fas fa-volume-high"></i></button>
                      </div>
                      ${c.examVi1 ? `<div class="exam-vi-row">🇻🇳 ${escapeHtml(c.examVi1)}</div>` : ''}
                    </div>` : ''}

                  ${c.similarPatterns ? `<div class="detail-row text-xs text-muted"><span class="detail-label">🔍 Mở rộng:</span> <span class="detail-val">${escapeHtml(c.similarPatterns)}</span></div>` : ''}
                  
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
                      <span>🇯🇵 ${escapeHtml(c.examJa)}</span>
                      <button type="button" class="btn-mini-speaker" onclick="flashcardService.speak('${escapeHtml(c.examJa)}', event)"><i class="fas fa-volume-high"></i></button>
                    </div>
                    ${c.examVi ? `<div class="exam-vi-row">🇻🇳 ${escapeHtml(c.examVi)}</div>` : ''}
                  </div>` : ''}

                ${c.synonymsAntonyms ? `<div class="detail-row text-xs text-muted"><span class="detail-label">🔍 Mở rộng:</span> <span class="detail-val">${escapeHtml(c.synonymsAntonyms)}</span></div>` : ''}
                
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

  const masteryPoints = getMasteryPoints();

  container.innerHTML = `
    <div class="vocab-overview-container">
      <!-- Top Stats & Practice CTA Row -->
      <div class="vocab-stats-cta-box">
        <div class="vocab-stats-left">
          <div class="vocab-stats-title">
            <i class="fas fa-chart-pie"></i> Tiến độ ghi nhớ
            ${masteryPoints > 0 ? `
              <span class="mastery-points-badge" title="Đã hoàn thành ${masteryPoints} vòng ôn tập 100% từ vựng">
                <i class="fas fa-award"></i> ${masteryPoints} Điểm tích lũy
              </span>` : ''}
          </div>
          <div class="vocab-progress-wrapper">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${percent}%;"></div>
            </div>
            <span class="progress-text">${mastered}/${total} đã thuộc (${percent}%)</span>
          </div>
        </div>

        <div class="vocab-cta-actions">
          <!-- Single Fixed 2-Way Mode Badge -->
          <div class="practice-mode-badge-single" title="Chế độ học phản xạ 2 chiều: Nhìn Kanji -> Gõ Đọc/Nghĩa & Nhìn Nghĩa -> Gõ Tiếng Nhật">
            <i class="fas fa-rotate"></i> <span>2 Chiều (2x)</span>
          </div>

          <button type="button" class="btn-start-practice" onclick="flashcardService.startPractice()" ${total === 0 ? 'disabled' : ''}>
            <i class="fas fa-play"></i>
            <span>Bắt Đầu Luyện Tập</span>
          </button>
        </div>
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

      <!-- Cards List -->
      <div class="vocab-cards-scrollable">
        ${cardsHtml}
      </div>
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
    const totalWords = currentChapterVocabList.length;
    const masteredWords = currentChapterVocabList.filter(c => c.mastered).length;
    const unmasteredCount = totalWords - masteredWords;
    const percent = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

    container.innerHTML = `
      <div class="practice-completed-screen">
        <div class="congrats-trophy"><i class="fas fa-award"></i></div>
        <h3 class="congrats-title">🎉 Xuất Sắc! Hoàn Thành Phiên Ôn Tập</h3>
        <p class="congrats-sub">Bạn đã hoàn thành phiên luyện tập <b>${practiceSessionCards.length} lượt kiểm tra</b> trong chương này.</p>
        
        <div class="practice-score-card">
          <div class="score-circle">
            <span class="score-number">${percent}%</span>
            <span class="score-label">Độ chính xác</span>
          </div>
          <div class="score-details">
            <div class="score-row text-success"><i class="fas fa-check-circle"></i> Đã thuộc hoàn toàn: <b>${masteredWords} / ${totalWords} từ</b></div>
            <div class="score-row text-muted"><i class="fas fa-rotate"></i> Chế độ: <b>Học 2 Chiều (Kanji ⇋ Nghĩa)</b></div>
            ${unmasteredCount > 0 ? `<div class="score-row text-warning"><i class="fas fa-clock-rotate-left"></i> Còn <b>${unmasteredCount} từ</b> cần củng cố thêm</div>` : '<div class="score-row text-success"><i class="fas fa-star"></i> Tuyệt đối 100%! Bạn đã làm chủ toàn bộ từ vựng chương!</div>'}
          </div>
        </div>

        <div class="practice-end-actions">
          ${(unmasteredCount > 0) ? `
            <button type="button" class="btn-primary" onclick="flashcardService.restartUnmastered()">
              <i class="fas fa-rotate-left"></i> Ôn lại ${unmasteredCount} từ chưa nhớ
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
  const isGrammar = card.type === 'grammar' || card._direction === 'grammar_flip';
  const direction = card._direction || 'kanji_to_reading';

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
                <div class="card-term-display">${escapeHtml(card.pattern || card.term)}</div>
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
                <div class="card-back-term">${escapeHtml(card.pattern || card.term)}</div>
                ${card.hanViet ? `<div class="card-back-hanviet">Âm Hán-Việt: <b>${escapeHtml(card.hanViet)}</b></div>` : ''}
                <div class="card-back-meaning">${escapeHtml(card.meaning || 'Chưa có giải nghĩa')}</div>
                ${card.connection ? `<div class="card-back-connection"><b>Công thức:</b> <code>${escapeHtml(card.connection)}</code></div>` : ''}
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
            <span class="kbd-hint">Phím 1</span>
          </button>

          <button type="button" class="btn-rate-flip" onclick="flashcardService.toggleFlip()">
            <i class="fas fa-repeat"></i>
            <span>Lật thẻ</span>
            <span class="kbd-hint">Phím Space</span>
          </button>

          <button type="button" class="btn-rate-answer btn-rate-remembered" onclick="flashcardService.ratePracticeCard(true)">
            <i class="fas fa-check"></i>
            <span>Đã thuộc</span>
            <span class="kbd-hint">Phím 2</span>
          </button>
        </div>

      </div>
    `;
    return;
  }

  // Branch B: VOCABULARY CARD -> TYPE-TO-CHECK MODE (2-WAY)
  let stateContainerHtml = '';
  const isMeaningToKanji = direction === 'meaning_to_kanji';

  // Question Prompt Direction Badge
  const directionBadgeHtml = isMeaningToKanji
    ? `<div class="practice-direction-badge meaning-mode"><i class="fas fa-language"></i> <span>Nhìn Nghĩa ➔ Gõ Từ tiếng Nhật (Kanji / Hiragana / Romaji)</span></div>`
    : `<div class="practice-direction-badge kanji-mode"><i class="fas fa-eye"></i> <span>Nhìn Kanji ➔ Gõ Cách đọc (Hiragana / Romaji) hoặc Nghĩa</span></div>`;

  // Main Question Display Content
  const questionCenterHtml = isMeaningToKanji
    ? `
      <div class="typing-meaning-prompt-box">
        ${card.hanViet ? `<div class="typing-hanviet-badge">Hán-Việt: ${escapeHtml(card.hanViet)}</div>` : ''}
        <div class="typing-meaning-display">${escapeHtml(card.meaning || 'Chưa có định nghĩa')}</div>
        ${card.pos ? `<span class="tag-pos" style="margin-top: 6px;">${escapeHtml(card.pos)}</span>` : ''}
      </div>
    `
    : `
      <div class="typing-term-display">${escapeHtml(card.term)}</div>
      <button type="button" class="btn-vocab-speaker-large" onclick="flashcardService.speakCurrentPractice(event)" title="Nghe phát âm">
        <i class="fas fa-volume-high"></i>
      </button>
    `;

  const inputPlaceholder = isMeaningToKanji
    ? `✍️ Gõ từ tiếng Nhật (Kanji / Hiragana / Romaji)...`
    : `✍️ Gõ cách đọc (Hiragana / Romaji) hoặc nghĩa tiếng Việt...`;

  if (currentTypingState === 'input') {
    stateContainerHtml = `
      <div class="typing-card-body">
        ${directionBadgeHtml}
        ${questionCenterHtml}

        <form class="typing-input-box" onsubmit="event.preventDefault(); flashcardService.checkTypingAnswer();">
          <div class="typing-input-wrapper">
            <input type="text" 
                   id="practiceTypingInput" 
                   class="practice-typing-input" 
                   placeholder="${inputPlaceholder}" 
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
          ${card.hanViet ? `<div class="detail-row"><span class="detail-label">Âm Hán-Việt:</span> <b class="detail-hanviet-val">${escapeHtml(card.hanViet)}</b></div>` : ''}
          <div class="detail-row"><span class="detail-label">Nghĩa tiếng Việt:</span> <span class="detail-meaning">${escapeHtml(card.meaning || 'Chưa có định nghĩa')}</span></div>
          ${card.examJa ? `
            <div class="detail-exam-box">
              <div class="exam-ja-row"><span class="exam-tag-badge">JP</span> <span>${escapeHtml(card.examJa)}</span></div>
              ${card.examVi ? `<div class="exam-vi-row"><span class="exam-tag-badge vi">VN</span> <span>${escapeHtml(card.examVi)}</span></div>` : ''}
            </div>` : ''}
          ${card.context ? `<div class="detail-context"><i>Manga: "${escapeHtml(card.context)}"</i></div>` : ''}
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

        <div class="typing-user-input-echo">
          <span>Bạn đã gõ:</span> <span class="user-typed-text">${escapeHtml(lastUserTypedInput)}</span>
        </div>

        ${questionCenterHtml}

        <div class="typing-action-buttons-row">
          <button type="button" class="btn-typing-retry" onclick="flashcardService.retryTyping()">
            <i class="fas fa-rotate-left"></i> <span>Thử lại</span>
          </button>
          <button type="button" class="btn-typing-reveal" onclick="flashcardService.revealAnswer()">
            <i class="fas fa-lightbulb"></i> <span>Xem đáp án chi tiết (Tab)</span>
          </button>
          <button type="button" id="btnNextPracticeCard" class="btn-typing-next" onclick="flashcardService.nextPracticeCard()" autofocus>
            <span>Bỏ qua</span> <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;
  } else if (currentTypingState === 'revealed') {
    stateContainerHtml = `
      <div class="typing-card-body state-revealed">
        <div class="typing-badge-result revealed">
          <i class="fas fa-lightbulb"></i> <span>ĐÁP ÁN CHI TIẾT</span>
        </div>

        <div class="typing-term-display">${escapeHtml(card.term)}</div>
        ${card.furigana ? `<div class="typing-reading-display">【 ${escapeHtml(card.furigana)} 】</div>` : ''}

        <div class="typing-details-card">
          ${card.hanViet ? `<div class="detail-row"><span class="detail-label">Âm Hán-Việt:</span> <b class="detail-hanviet-val">${escapeHtml(card.hanViet)}</b></div>` : ''}
          <div class="detail-row"><span class="detail-label">Nghĩa tiếng Việt:</span> <span class="detail-meaning">${escapeHtml(card.meaning || 'Chưa có định nghĩa')}</span></div>
          ${card.romaji ? `<div class="detail-row"><span class="detail-label">Romaji:</span> <span class="text-accent">${escapeHtml(card.romaji)}</span></div>` : ''}
          ${card.examJa ? `
            <div class="detail-exam-box">
              <div class="exam-ja-row"><span class="exam-tag-badge">JP</span> <span>${escapeHtml(card.examJa)}</span></div>
              ${card.examVi ? `<div class="exam-vi-row"><span class="exam-tag-badge vi">VN</span> <span>${escapeHtml(card.examVi)}</span></div>` : ''}
            </div>` : ''}
          ${card.context ? `<div class="detail-context"><i>Manga: "${escapeHtml(card.context)}"</i></div>` : ''}
        </div>

        <div class="typing-action-buttons-row">
          <button type="button" class="btn-typing-retry" onclick="flashcardService.retryTyping()">
            <i class="fas fa-rotate-left"></i> <span>Gõ lại để nhớ</span>
          </button>
          <button type="button" id="btnNextPracticeCard" class="btn-typing-next" onclick="flashcardService.nextPracticeCard()" autofocus>
            <span>Sang từ kế tiếp</span> <i class="fas fa-arrow-right"></i>
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
          <i class="fas fa-arrow-left"></i> <span>Danh sách</span>
        </button>
        <div class="practice-progress-pill">
          <span>Câu ${currentNum} / ${total}</span>
          <span class="practice-mode-tag">${isMeaningToKanji ? '🇻🇳 Nghĩa ➔ Kanji' : '🈸 Kanji ➔ Đọc'}</span>
          <div class="practice-mini-bar"><div class="practice-mini-fill" style="width: ${percent}%;"></div></div>
        </div>
        <button type="button" class="btn-icon" onclick="flashcardService.closeModal()"><i class="fas fa-times"></i></button>
      </div>

      <!-- Main Typing Scene -->
      <div class="practice-typing-scene">
        ${stateContainerHtml}
      </div>
    </div>
  `;

  // Auto focus on typing input if available
  setTimeout(() => {
    const inputEl = document.getElementById('practiceTypingInput');
    if (inputEl) inputEl.focus();
    const nextBtn = document.getElementById('btnNextPracticeCard');
    if (nextBtn && currentTypingState !== 'input') nextBtn.focus();
  }, 50);
}

// Simple HTML escaping helper
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Global Toast helper
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
