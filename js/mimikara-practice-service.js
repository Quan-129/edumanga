/* ==========================================================================
   EDUMANGA HUB - MIMIKARA N2 VOCABULARY PRACTICE ENGINE (1.160 TỪ)
   3-Step Micro-Learning Funnel:
     Bước 1: Flashcard lướt 5 từ
     Bước 2: Ghép cặp 5 mặt trước - 5 mặt sau (Matching Game)
     Bước 3: Gõ phản xạ 2 chiều (10 lượt)
   ========================================================================== */

class MimikaraPracticeService {
  constructor() {
    this.dataset = null;
    this.progress = this.loadProgress();
    this.currentUnitId = null;
    this.currentChunkIndex = 0;
    this.currentChunkWords = [];
    
    // Practice State
    this.currentStep = 1; // 1: Flashcard, 2: Matching, 3: Typing
    
    // Step 1 State
    this.flashcardIndex = 0;
    this.isCardFlipped = false;
    
    // Step 2 State
    this.matchingCards = [];
    this.selectedLeftCard = null;
    this.selectedRightCard = null;
    this.matchedPairsCount = 0;
    
    // Step 3 State
    this.typingQuestions = [];
    this.typingIndex = 0;
    this.typingState = 'input'; // 'input' | 'correct' | 'incorrect'
  }

  // Load progress from localStorage
  loadProgress() {
    try {
      const raw = localStorage.getItem('edumanga_mimikara_progress');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      completedChunks: {}, // { "unit_1_chunk_0": true }
      masteredWordIds: []  // [1, 2, 3]
    };
  }

  saveProgress() {
    try {
      localStorage.setItem('edumanga_mimikara_progress', JSON.stringify(this.progress));
    } catch (e) {
      console.error("Failed to save Mimikara progress:", e);
    }
  }

  // Fetch 14 Units dataset
  async loadDataset() {
    if (this.dataset) return this.dataset;
    try {
      const resp = await fetch('data/mimikara_n2_units.json');
      if (resp.ok) {
        this.dataset = await resp.json();
        return this.dataset;
      }
    } catch (err) {
      console.error("Could not load data/mimikara_n2_units.json:", err);
    }
    return null;
  }

  // Text-To-Speech Pronunciation
  speak(text) {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/\[\d+\]/g, '').replace(/[\(\)]/g, '').trim();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = 'ja-JP';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    } catch (e) {}
  }

  // Open Modal
  async openModal(unitId = null) {
    await this.loadDataset();
    if (!this.dataset) {
      alert("Không thể nạp dữ liệu từ vựng Mimikara N2. Vui lòng thử lại sau!");
      return;
    }

    this.ensureModalDOM();
    const modal = document.getElementById('mimikaraMasterModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    if (unitId) {
      this.renderUnitChunks(unitId);
    } else {
      this.renderUnitsOverview();
    }
  }

  // Close Modal
  closeModal() {
    const modal = document.getElementById('mimikaraMasterModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Ensure Modal DOM exists in document
  ensureModalDOM() {
    if (document.getElementById('mimikaraMasterModal')) return;

    const modalHtml = `
      <div id="mimikaraMasterModal" class="mimikara-modal" onclick="if(event.target===this) window.mimikaraService.closeModal()">
        <div class="mimikara-modal-container">
          <!-- Header -->
          <div class="mimikara-modal-header">
            <div class="mimikara-header-left">
              <div class="mimikara-header-icon">
                <i class="fas fa-graduation-cap"></i>
              </div>
              <div class="mimikara-header-titles">
                <h2>14 Unit Mimikara N2 <span style="font-size: 0.75rem; background: rgba(168,85,247,0.2); color: #c084fc; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(168,85,247,0.3);">1.160 TỪ CHUẨN</span></h2>
                <p id="mimikaraHeaderSubtitle">Học từ vựng 3 bước: Flashcard ➔ Ghép cặp 5x5 ➔ Gõ phản xạ 2 chiều</p>
              </div>
            </div>
            <button type="button" class="mimikara-btn-close" onclick="window.mimikaraService.closeModal()" title="Đóng cửa sổ">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Body -->
          <div id="mimikaraModalBody" class="mimikara-modal-body">
            <!-- Dynamic Content Injected Here -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  // --------------------------------------------------------------------------
  // VIEW 1: 14 UNITS OVERVIEW
  // --------------------------------------------------------------------------
  renderUnitsOverview() {
    const body = document.getElementById('mimikaraModalBody');
    if (!body || !this.dataset) return;

    const totalWords = this.dataset.totalWords || 1160;
    const masteredCount = (this.progress.masteredWordIds || []).length;
    const percent = Math.min(100, Math.round((masteredCount / totalWords) * 100));

    let unitsGridHtml = '';
    this.dataset.units.forEach(u => {
      const chunksTotal = Math.ceil(u.words.length / 5);
      let chunksDone = 0;
      for (let i = 0; i < chunksTotal; i++) {
        if (this.progress.completedChunks[`unit_${u.id}_chunk_${i}`]) {
          chunksDone++;
        }
      }
      const unitPercent = Math.round((chunksDone / chunksTotal) * 100);

      unitsGridHtml += `
        <div class="mimikara-unit-card" onclick="window.mimikaraService.renderUnitChunks(${u.id})">
          <div>
            <div class="mimikara-unit-header">
              <span class="mimikara-unit-tag">${u.range}</span>
              ${unitPercent === 100 ? `<span class="mimikara-unit-badge-done"><i class="fas fa-check-circle"></i> Đã xong</span>` : `<span style="font-size: 0.75rem; color: #94a3b8;">${chunksDone}/${chunksTotal} phiên</span>`}
            </div>
            <h4 class="mimikara-unit-title">${escapeHtml(u.title)}</h4>
            <p class="mimikara-unit-desc">${escapeHtml(u.subtitle)}</p>
          </div>

          <div>
            <div class="mimikara-progress-bar-bg" style="margin-bottom: 0.5rem;">
              <div class="mimikara-progress-bar-fill" style="width: ${unitPercent}%;"></div>
            </div>
            <div class="mimikara-unit-footer">
              <span class="mimikara-unit-count"><i class="fas fa-clone"></i> ${u.wordsCount} từ vựng</span>
              <span style="font-weight: 700; color: #c084fc;">Học Unit ➔</span>
            </div>
          </div>
        </div>
      `;
    });

    body.innerHTML = `
      <div class="mimikara-stats-banner">
        <div class="mimikara-stat-info">
          <h3><i class="fas fa-fire" style="color: #f59e0b;"></i> Tiến Độ Chinh Phục Mimikara N2</h3>
          <p>Mỗi phiên 5 từ: tiếp thu nhẹ nhàng, khắc sâu phản xạ 2 chiều không quên.</p>
        </div>
        <div class="mimikara-overall-progress">
          <div class="mimikara-progress-bar-bg">
            <div class="mimikara-progress-bar-fill" style="width: ${percent}%;"></div>
          </div>
          <div class="mimikara-progress-labels">
            <span>Đã thành thạo: <b>${masteredCount}</b> / ${totalWords} từ</span>
            <span style="color: #38bdf8; font-weight: 700;">${percent}%</span>
          </div>
        </div>
      </div>

      <div class="mimikara-units-grid">
        ${unitsGridHtml}
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // VIEW 2: UNIT CHUNKS LIST (MỖI PHIÊN 5 TỪ)
  // --------------------------------------------------------------------------
  renderUnitChunks(unitId) {
    this.currentUnitId = unitId;
    const body = document.getElementById('mimikaraModalBody');
    if (!body || !this.dataset) return;

    const unit = this.dataset.units.find(u => u.id === unitId);
    if (!unit) return;

    const chunksCount = Math.ceil(unit.words.length / 5);
    let chunksHtml = '';

    for (let i = 0; i < chunksCount; i++) {
      const startIdx = i * 5;
      const endIdx = Math.min(startIdx + 5, unit.words.length);
      const chunkWords = unit.words.slice(startIdx, endIdx);
      const isCompleted = !!this.progress.completedChunks[`unit_${unitId}_chunk_${i}`];

      const startStt = chunkWords[0].stt;
      const endStt = chunkWords[chunkWords.length - 1].stt;

      const miniWordsPills = chunkWords.map(w => `
        <span class="mimikara-mini-word-pill" title="${escapeHtml(w.meaning)}">
          ${escapeHtml(w.term)}
        </span>
      `).join('');

      chunksHtml += `
        <div class="mimikara-chunk-card ${isCompleted ? 'completed' : ''}">
          <div>
            <div class="mimikara-chunk-header">
              <span class="mimikara-chunk-title">Phiên ${i + 1}: STT ${startStt} - ${endStt}</span>
              ${isCompleted 
                ? `<span class="mimikara-chunk-badge done"><i class="fas fa-check-circle"></i> Đã thuộc</span>`
                : `<span class="mimikara-chunk-badge pending">Chưa học</span>`
              }
            </div>
            <div class="mimikara-chunk-words-preview">
              ${miniWordsPills}
            </div>
          </div>
          <button type="button" class="mimikara-btn-start-chunk" onclick="window.mimikaraService.startChunkPractice(${unitId}, ${i})">
            <i class="fas fa-play"></i> ${isCompleted ? 'Ôn tập lại phiên này' : 'Bắt đầu học 5 từ'}
          </button>
        </div>
      `;
    }

    body.innerHTML = `
      <div class="mimikara-nav-bar">
        <button type="button" class="mimikara-btn-back" onclick="window.mimikaraService.renderUnitsOverview()">
          <i class="fas fa-arrow-left"></i> Quay lại 14 Unit
        </button>
        <div style="text-align: right;">
          <h3 style="margin: 0; font-size: 1.1rem; color: #fff; font-weight: 700;">${escapeHtml(unit.title)}</h3>
          <span style="font-size: 0.8rem; color: #94a3b8;">${escapeHtml(unit.subtitle)} • ${unit.words.length} từ (${chunksCount} phiên)</span>
        </div>
      </div>

      <div class="mimikara-chunks-grid">
        ${chunksHtml}
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // VIEW 3: PRACTICE WORKFLOW (3 BƯỚC CHO 5 TỪ)
  // --------------------------------------------------------------------------
  startChunkPractice(unitId, chunkIndex) {
    this.currentUnitId = unitId;
    this.currentChunkIndex = chunkIndex;
    const unit = this.dataset.units.find(u => u.id === unitId);
    if (!unit) return;

    const startIdx = chunkIndex * 5;
    const endIdx = Math.min(startIdx + 5, unit.words.length);
    this.currentChunkWords = unit.words.slice(startIdx, endIdx);

    // Start Step 1: Flashcard
    this.currentStep = 1;
    this.flashcardIndex = 0;
    this.isCardFlipped = false;
    this.renderStep1Flashcard();
  }

  renderStepperHeader() {
    const unit = this.dataset.units.find(u => u.id === this.currentUnitId);
    const startStt = this.currentChunkWords[0].stt;
    const endStt = this.currentChunkWords[this.currentChunkWords.length - 1].stt;

    return `
      <div class="mimikara-stepper-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <button type="button" class="mimikara-btn-back" onclick="window.mimikaraService.renderUnitChunks(${this.currentUnitId})" style="padding: 5px 12px; font-size: 0.78rem;">
            <i class="fas fa-arrow-left"></i> Dừng phiên
          </button>
          <span style="color: #cbd5e1; font-size: 0.85rem; font-weight: 700;">
            ${escapeHtml(unit.title)} • Phiên ${this.currentChunkIndex + 1} (STT ${startStt}-${endStt})
          </span>
        </div>

        <div class="mimikara-stepper-pills">
          <div class="mimikara-step-pill ${this.currentStep === 1 ? 'active' : (this.currentStep > 1 ? 'completed' : '')}">
            <i class="fas ${this.currentStep > 1 ? 'fa-check' : 'fa-clone'}"></i> Bước 1: Flashcard (5 từ)
          </div>
          <div class="mimikara-step-pill ${this.currentStep === 2 ? 'active' : (this.currentStep > 2 ? 'completed' : '')}">
            <i class="fas ${this.currentStep > 2 ? 'fa-check' : 'fa-puzzle-piece'}"></i> Bước 2: Ghép Cặp 5x5
          </div>
          <div class="mimikara-step-pill ${this.currentStep === 3 ? 'active' : ''}">
            <i class="fas fa-keyboard"></i> Bước 3: Gõ 2 Chiều
          </div>
        </div>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // BƯỚC 1: FLASHCARD 5 TỪ
  // --------------------------------------------------------------------------
  renderStep1Flashcard() {
    const body = document.getElementById('mimikaraModalBody');
    if (!body) return;

    const w = this.currentChunkWords[this.flashcardIndex];
    if (!w) return;

    // Auto pronounce
    this.speak(w.term);

    const isLastCard = this.flashcardIndex === this.currentChunkWords.length - 1;

    body.innerHTML = `
      ${this.renderStepperHeader()}

      <div class="mimikara-flashcard-box">
        <div class="mimikara-card-flip" onclick="window.mimikaraService.toggleCardFlip()">
          <!-- Top Card Meta -->
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; font-weight: 700; color: #a855f7;">
              THẺ ${this.flashcardIndex + 1} / ${this.currentChunkWords.length} (STT #${w.stt})
            </span>
            <button type="button" class="btn-icon-xs" onclick="event.stopPropagation(); window.mimikaraService.speak('${escapeJs(w.term)}')" title="Nghe phát âm" style="background: rgba(168,85,247,0.2); color: #c084fc; width: 34px; height: 34px; border-radius: 8px;">
              <i class="fas fa-volume-high"></i>
            </button>
          </div>

          <!-- Card Content (Front or Back) -->
          ${!this.isCardFlipped ? `
            <!-- FRONT -->
            <div class="mimikara-card-main-word">
              <div class="mimikara-kanji-huge">${escapeHtml(w.term)}</div>
              <div class="mimikara-reading-mid">${escapeHtml(w.reading)} ${w.pitch_accent ? `<span style="font-size: 0.85rem; color: #94a3b8;">${escapeHtml(w.pitch_accent)}</span>` : ''}</div>
              ${w.han_viet ? `<span class="mimikara-hanviet-tag">[ ${escapeHtml(w.han_viet)} ]</span>` : ''}
              <div style="margin-top: 1.5rem; font-size: 0.82rem; color: var(--text-muted); display: flex; align-items: center; justify-content: center; gap: 6px;">
                <i class="fas fa-rotate"></i> Chạm vào thẻ để xem nghĩa & ví dụ
              </div>
            </div>
          ` : `
            <!-- BACK -->
            <div class="mimikara-card-back-details">
              <div class="mimikara-meaning-highlight">${escapeHtml(w.meaning)}</div>
              ${w.type ? `<div style="text-align: center; margin-bottom: 0.75rem;"><span style="font-size: 0.75rem; background: rgba(56,189,248,0.15); color: #38bdf8; padding: 2px 8px; border-radius: 4px;">${escapeHtml(w.type)}</span></div>` : ''}
              
              ${w.exam_ja ? `
                <div class="mimikara-example-block">
                  <div class="mimikara-example-ja">${escapeHtml(w.exam_ja)}</div>
                  <div class="mimikara-example-vi">${escapeHtml(w.exam_vi || '')}</div>
                </div>
              ` : ''}

              ${w.kanji_breakdown ? `
                <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 0.5rem; background: rgba(255,255,255,0.04); padding: 6px 10px; border-radius: 6px;">
                  <b>Chiết tự Kanji:</b> ${escapeHtml(w.kanji_breakdown)}
                </div>
              ` : ''}

              ${w.synonyms_antonyms ? `
                <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 0.35rem;">
                  ${escapeHtml(w.synonyms_antonyms)}
                </div>
              ` : ''}
            </div>
          `}

          <!-- Bottom Footer -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.06); font-size: 0.75rem; color: #94a3b8;">
            <span>Chạm để lật mặt thẻ</span>
            <span style="color: #38bdf8;">${this.isCardFlipped ? 'Mặt sau (Nghĩa)' : 'Mặt trước (Kanji)'}</span>
          </div>
        </div>

        <!-- Controls Below Card -->
        <div class="mimikara-card-controls">
          <button type="button" class="mimikara-btn-back" onclick="window.mimikaraService.prevFlashcard()" ${this.flashcardIndex === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
            <i class="fas fa-chevron-left"></i> Từ trước
          </button>

          ${isLastCard ? `
            <button type="button" class="btn-primary" onclick="window.mimikaraService.startStep2Matching()" style="background: linear-gradient(135deg, #a855f7, #6366f1); padding: 10px 22px; font-weight: 700; border-radius: 10px;">
              <span>Sẵn Sàng Sang Bước 2: Ghép Cặp ➔</span>
            </button>
          ` : `
            <button type="button" class="btn-primary" onclick="window.mimikaraService.nextFlashcard()" style="background: linear-gradient(135deg, #0284c7, #6366f1); padding: 10px 22px; font-weight: 700; border-radius: 10px;">
              <span>Từ tiếp theo ➔</span>
            </button>
          `}
        </div>
      </div>
    `;
  }

  toggleCardFlip() {
    this.isCardFlipped = !this.isCardFlipped;
    this.renderStep1Flashcard();
  }

  nextFlashcard() {
    if (this.flashcardIndex < this.currentChunkWords.length - 1) {
      this.flashcardIndex++;
      this.isCardFlipped = false;
      this.renderStep1Flashcard();
    }
  }

  prevFlashcard() {
    if (this.flashcardIndex > 0) {
      this.flashcardIndex--;
      this.isCardFlipped = false;
      this.renderStep1Flashcard();
    }
  }

  // --------------------------------------------------------------------------
  // BƯỚC 2: GHÉP CẶP 5 MẶT TRƯỚC - 5 MẶT SAU (MATCHING GAME 5x5)
  // --------------------------------------------------------------------------
  startStep2Matching() {
    this.currentStep = 2;
    this.matchedPairsCount = 0;
    this.selectedLeftCard = null;
    this.selectedRightCard = null;

    // Chuẩn bị 5 thẻ mặt trước (Kanji + Reading) và 5 thẻ mặt sau (Nghĩa)
    const leftCards = this.currentChunkWords.map(w => ({
      id: `left_${w.stt}`,
      stt: w.stt,
      term: w.term,
      reading: w.reading,
      type: 'left',
      matched: false
    }));

    const rightCards = this.currentChunkWords.map(w => ({
      id: `right_${w.stt}`,
      stt: w.stt,
      meaning: w.meaning,
      han_viet: w.han_viet,
      type: 'right',
      matched: false
    }));

    // Xáo trộn độc lập 2 bên
    this.leftMatchCards = this.shuffleArray([...leftCards]);
    this.rightMatchCards = this.shuffleArray([...rightCards]);

    this.renderStep2Matching();
  }

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  renderStep2Matching() {
    const body = document.getElementById('mimikaraModalBody');
    if (!body) return;

    const leftCardsHtml = this.leftMatchCards.map(c => `
      <div id="${c.id}" class="mimikara-match-card ${c.matched ? 'matched' : ''} ${this.selectedLeftCard && this.selectedLeftCard.id === c.id ? 'selected' : ''}" onclick="window.mimikaraService.selectMatchCard('${c.id}', 'left')">
        <div class="mimikara-match-term">${escapeHtml(c.term)}</div>
        <div style="font-size: 0.82rem; color: #38bdf8;">${escapeHtml(c.reading)}</div>
      </div>
    `).join('');

    const rightCardsHtml = this.rightMatchCards.map(c => `
      <div id="${c.id}" class="mimikara-match-card ${c.matched ? 'matched' : ''} ${this.selectedRightCard && this.selectedRightCard.id === c.id ? 'selected' : ''}" onclick="window.mimikaraService.selectMatchCard('${c.id}', 'right')">
        <div class="mimikara-match-meaning">${escapeHtml(c.meaning)}</div>
        ${c.han_viet ? `<div style="font-size: 0.78rem; color: #fbbf24; margin-top: 3px;">[ ${escapeHtml(c.han_viet)} ]</div>` : ''}
      </div>
    `).join('');

    const allDone = this.matchedPairsCount === this.currentChunkWords.length;

    body.innerHTML = `
      ${this.renderStepperHeader()}

      <div class="mimikara-matching-board">
        <div class="mimikara-matching-desc">
          🎮 <b>Thử thách ghép cặp phản xạ:</b> Hãy chọn 1 ô Kanji ở cột trái và 1 ô Nghĩa tương ứng ở cột phải.
          <div style="margin-top: 0.5rem; font-weight: 700; color: #34d399;">
            Đã ghép chính xác: ${this.matchedPairsCount} / ${this.currentChunkWords.length} cặp
          </div>
        </div>

        <div class="mimikara-match-grid">
          <div class="mimikara-match-col">
            ${leftCardsHtml}
          </div>
          <div class="mimikara-match-col">
            ${rightCardsHtml}
          </div>
        </div>

        ${allDone ? `
          <div style="text-align: center; margin-top: 2rem;">
            <button type="button" class="btn-primary" onclick="window.mimikaraService.startStep3Typing()" style="background: linear-gradient(135deg, #a855f7, #6366f1); padding: 12px 30px; font-weight: 800; font-size: 1rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(168,85,247,0.5);">
              <span>🎉 Xuất Sắc! Sang Bước 3: Gõ Phản Xạ 2 Chiều ➔</span>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  selectMatchCard(id, side) {
    if (side === 'left') {
      const card = this.leftMatchCards.find(c => c.id === id);
      if (!card || card.matched) return;
      this.selectedLeftCard = (this.selectedLeftCard && this.selectedLeftCard.id === id) ? null : card;
      if (this.selectedLeftCard) this.speak(card.term);
    } else {
      const card = this.rightMatchCards.find(c => c.id === id);
      if (!card || card.matched) return;
      this.selectedRightCard = (this.selectedRightCard && this.selectedRightCard.id === id) ? null : card;
    }

    this.renderStep2Matching();

    // Nếu đã chọn cả 2 bên -> Kiểm tra cặp
    if (this.selectedLeftCard && this.selectedRightCard) {
      this.checkMatchingPair();
    }
  }

  checkMatchingPair() {
    const left = this.selectedLeftCard;
    const right = this.selectedRightCard;
    if (!left || !right) return;

    if (left.stt === right.stt) {
      // Đúng cặp!
      left.matched = true;
      right.matched = true;
      this.matchedPairsCount++;
      this.speak(left.term);
      this.selectedLeftCard = null;
      this.selectedRightCard = null;

      setTimeout(() => {
        this.renderStep2Matching();
      }, 200);
    } else {
      // Sai cặp -> Rung đỏ rồi bỏ chọn
      const leftEl = document.getElementById(left.id);
      const rightEl = document.getElementById(right.id);
      if (leftEl) leftEl.classList.add('wrong');
      if (rightEl) rightEl.classList.add('wrong');

      setTimeout(() => {
        if (leftEl) leftEl.classList.remove('wrong');
        if (rightEl) rightEl.classList.remove('wrong');
        this.selectedLeftCard = null;
        this.selectedRightCard = null;
        this.renderStep2Matching();
      }, 500);
    }
  }

  // --------------------------------------------------------------------------
  // BƯỚC 3: GÕ PHẢN XẠ 2 CHIỀU (10 LƯỢT: 5 TỪ x 2 CHIỀU)
  // --------------------------------------------------------------------------
  startStep3Typing() {
    this.currentStep = 3;
    this.typingIndex = 0;
    this.typingState = 'input';

    // Tạo 10 câu hỏi: 5 chiều nhìn Kanji gõ Nghĩa/Đọc + 5 chiều nhìn Nghĩa gõ Kanji
    const qList = [];
    this.currentChunkWords.forEach(w => {
      // Chiều 1: Nhìn Kanji -> Gõ cách đọc Hiragana hoặc Nghĩa
      qList.push({
        word: w,
        direction: 'kanji_to_reading',
        promptType: 'CHIỀU 1: NHÌN KANJI ➔ GÕ CÁCH ĐỌC / NGHĨA',
        promptText: w.term,
        hint: `Hán Việt: ${w.han_viet || '...'} • Gõ cách đọc (Hiragana) hoặc nghĩa tiếng Việt`
      });

      // Chiều 2: Nhìn Nghĩa -> Gõ lại Kanji/Tiếng Nhật
      qList.push({
        word: w,
        direction: 'meaning_to_kanji',
        promptType: 'CHIỀU 2: NHÌN NGHĨA ➔ GÕ KANJI / TIẾNG NHẬT',
        promptText: w.meaning,
        hint: `Hán Việt: ${w.han_viet || '...'} • Gõ chữ Kanji (${w.term}) hoặc cách đọc (${w.reading})`
      });
    });

    // Xáo trộn 10 câu hỏi để phản xạ ngẫu nhiên
    this.typingQuestions = this.shuffleArray(qList);
    this.renderStep3Typing();
  }

  renderStep3Typing() {
    const body = document.getElementById('mimikaraModalBody');
    if (!body) return;

    if (this.typingIndex >= this.typingQuestions.length) {
      this.renderVictoryScreen();
      return;
    }

    const q = this.typingQuestions[this.typingIndex];
    if (q.direction === 'kanji_to_reading') {
      this.speak(q.word.term);
    }

    body.innerHTML = `
      ${this.renderStepperHeader()}

      <div class="mimikara-typing-container">
        <div class="mimikara-typing-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <span style="font-size: 0.8rem; font-weight: 700; color: #a855f7;">LƯỢT ${this.typingIndex + 1} / ${this.typingQuestions.length}</span>
            <button type="button" class="btn-icon-xs" onclick="window.mimikaraService.speak('${escapeJs(q.word.term)}')" title="Nghe phát âm" style="background: rgba(168,85,247,0.2); color: #c084fc; width: 30px; height: 30px; border-radius: 6px;">
              <i class="fas fa-volume-high"></i>
            </button>
          </div>

          <div class="mimikara-typing-prompt-type">${q.promptType}</div>
          <div class="mimikara-typing-prompt-text">${escapeHtml(q.promptText)}</div>
          <div class="mimikara-typing-hint">${escapeHtml(q.hint)}</div>

          <form onsubmit="window.mimikaraService.checkTypingAnswer(event)" class="mimikara-input-group">
            <input type="text" id="mimikaraTypingInput" class="mimikara-typing-input ${this.typingState}" placeholder="Gõ đáp án của bạn và nhấn Enter..." autocomplete="off" autofocus>
            <button type="submit" class="btn-primary" style="background: linear-gradient(135deg, #a855f7, #6366f1); padding: 0 24px; font-weight: 700; border-radius: 12px;">
              Kiểm Tra
            </button>
          </form>

          <div id="mimikaraTypingFeedback" class="mimikara-typing-feedback">
            ${this.renderTypingFeedbackHTML(q)}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <button type="button" class="btn-secondary" onclick="window.mimikaraService.revealAnswer()" style="font-size: 0.85rem; padding: 8px 16px;">
            <i class="fas fa-eye"></i> Xem đáp án gợi ý
          </button>
          <span style="font-size: 0.8rem; color: #94a3b8;">Nhấn <b>Enter</b> để kiểm tra / chuyển câu</span>
        </div>
      </div>
    `;

    setTimeout(() => {
      const input = document.getElementById('mimikaraTypingInput');
      if (input) input.focus();
    }, 50);
  }

  renderTypingFeedbackHTML(q) {
    if (this.typingState === 'correct') {
      return `<div style="color: #34d399;"><i class="fas fa-check-circle"></i> <b>Chính xác!</b> Đang chuyển lượt tiếp theo...</div>`;
    }
    if (this.typingState === 'incorrect') {
      return `
        <div style="color: #f87171; text-align: center;">
          <div><i class="fas fa-times-circle"></i> Chưa chính xác!</div>
          <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px;">
            Đáp án chuẩn: <b>${escapeHtml(q.word.term)}</b> (${escapeHtml(q.word.reading)}) = <i>${escapeHtml(q.word.meaning)}</i>
          </div>
        </div>
      `;
    }
    return '';
  }

  checkTypingAnswer(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('mimikaraTypingInput');
    if (!input) return;

    const val = input.value.trim();
    if (!val) return;

    const q = this.typingQuestions[this.typingIndex];
    const isCorrect = this.evaluateAnswer(val, q.word, q.direction);

    if (isCorrect) {
      this.typingState = 'correct';
      this.speak(q.word.term);
      input.classList.add('correct');

      setTimeout(() => {
        this.typingIndex++;
        this.typingState = 'input';
        this.renderStep3Typing();
      }, 700);
    } else {
      this.typingState = 'incorrect';
      input.classList.add('incorrect');
      this.renderStep3Typing();
    }
  }

  revealAnswer() {
    const q = this.typingQuestions[this.typingIndex];
    const feedback = document.getElementById('mimikaraTypingFeedback');
    if (feedback) {
      feedback.innerHTML = `
        <div style="color: #fbbf24;">
          💡 <b>Gợi ý đáp án:</b> Từ: <b>${escapeHtml(q.word.term)}</b> (${escapeHtml(q.word.reading)}) | Nghĩa: <i>${escapeHtml(q.word.meaning)}</i>
        </div>
      `;
    }
    const input = document.getElementById('mimikaraTypingInput');
    if (input) {
      input.value = (q.direction === 'kanji_to_reading') ? q.word.reading : q.word.term;
      input.focus();
    }
  }

  evaluateAnswer(userInput, word, direction) {
    const clean = s => (s || '').toLowerCase().trim().normalize('NFC')
      .replace(/[\.\,\;\:\-\_\(\)\[\]\/\\]/g, ' ')
      .replace(/\s+/g, ' ');

    const u = clean(userInput);
    if (!u) return false;

    if (direction === 'kanji_to_reading') {
      // Chấp nhận: reading, romaji, hoặc từ khóa trong meaning
      const reading = clean(word.reading);
      const romaji = clean(word.romaji);
      const meaning = clean(word.meaning);
      const hanViet = clean(word.han_viet);

      if (u === reading || u === romaji || u === hanViet) return true;
      if (meaning.includes(u) && u.length >= 2) return true;

      // So khớp từng từ nghĩa phân cách bằng dấu gạch ngang hoặc phẩy
      const parts = meaning.split(/[-–,;/]/).map(p => clean(p)).filter(Boolean);
      if (parts.some(p => p === u || (p.length >= 2 && u.includes(p)))) return true;
      return false;
    } else {
      // meaning_to_kanji: Chấp nhận term (Kanji) hoặc reading
      const term = clean(word.term);
      const reading = clean(word.reading);
      const romaji = clean(word.romaji);
      return (u === term || u === reading || u === romaji);
    }
  }

  // --------------------------------------------------------------------------
  // VICTORY SCREEN
  // --------------------------------------------------------------------------
  renderVictoryScreen() {
    const body = document.getElementById('mimikaraModalBody');
    if (!body) return;

    // Đánh dấu hoàn thành chunk này
    const chunkKey = `unit_${this.currentUnitId}_chunk_${this.currentChunkIndex}`;
    this.progress.completedChunks[chunkKey] = true;

    // Đánh dấu 5 từ này đã thuộc
    this.currentChunkWords.forEach(w => {
      const stt = parseInt(w.stt, 10);
      if (!this.progress.masteredWordIds.includes(stt)) {
        this.progress.masteredWordIds.push(stt);
      }
    });

    this.saveProgress();

    const unit = this.dataset.units.find(u => u.id === this.currentUnitId);
    const chunksTotal = Math.ceil(unit.words.length / 5);
    const hasNextChunk = this.currentChunkIndex < chunksTotal - 1;

    body.innerHTML = `
      <div class="mimikara-victory-box">
        <div class="mimikara-victory-icon">🏆</div>
        <h2 class="mimikara-victory-title">XUẤT SẮC! HOÀN THÀNH PHIÊN ${this.currentChunkIndex + 1}!</h2>
        <p class="mimikara-victory-desc">
          Bạn đã hoàn thành trọn vẹn cả 3 bước: <b>Flashcard</b> ➔ <b>Ghép Cặp 5x5</b> ➔ <b>Gõ Phản Xạ 2 Chiều</b> cho 5 từ vựng vừa rồi!
          <br>
          <span style="color: #34d399; font-weight: 700; font-size: 1.1rem; display: inline-block; margin-top: 0.5rem;">
            +5 Từ Đã Thuộc Lòng Vào Kho Kiến Thức N2!
          </span>
        </p>

        <div class="mimikara-victory-actions">
          ${hasNextChunk ? `
            <button type="button" class="btn-primary" onclick="window.mimikaraService.startChunkPractice(${this.currentUnitId}, ${this.currentChunkIndex + 1})" style="background: linear-gradient(135deg, #10b981, #0284c7); padding: 12px 26px; font-weight: 800; font-size: 0.95rem; border-radius: 12px; box-shadow: 0 4px 18px rgba(16,185,129,0.4);">
              <i class="fas fa-forward"></i> Học Phiên Tiếp Theo (Phiên ${this.currentChunkIndex + 2}) ➔
            </button>
          ` : `
            <button type="button" class="btn-primary" onclick="window.mimikaraService.renderUnitsOverview()" style="background: linear-gradient(135deg, #a855f7, #6366f1); padding: 12px 26px; font-weight: 800; font-size: 0.95rem; border-radius: 12px;">
              <i class="fas fa-trophy"></i> Bạn Đã Hoàn Thành Toàn Bộ Unit Này!
            </button>
          `}

          <button type="button" class="btn-secondary" onclick="window.mimikaraService.renderUnitChunks(${this.currentUnitId})" style="padding: 12px 22px; font-weight: 700; border-radius: 12px;">
            <i class="fas fa-list"></i> Danh Sách Phiên
          </button>
        </div>
      </div>
    `;
  }
}

// Helpers
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJs(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Global Export & Auto Init
window.mimikaraService = new MimikaraPracticeService();
window.openMimikaraMasterModal = (unitId) => window.mimikaraService.openModal(unitId);
window.closeMimikaraMasterModal = () => window.mimikaraService.closeModal();
