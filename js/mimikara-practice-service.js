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

    // Step 4 State (Audio Cloze & Dictation)
    this.dictationMode = localStorage.getItem('edumanga_mimikara_dictation_mode') || 'target_cloze'; // 'target_cloze' | 'full_dictation'
    this.dictationIndex = 0;
    this.dictationQuestions = [];
    this.dictationState = 'input'; // 'input' | 'correct' | 'incorrect'
    this.dictationAudioRate = 1.0;
    this.dictationLiveInput = '';

    // Step 1 Radial Mindmap Graph State (Cần gạt 2 chế độ: 'compound' | 'radical')
    this.frontGraphMode = localStorage.getItem('edumanga_mimikara_front_graph_mode') || 'compound';
    this.selectedFrontKanjiChar = null;
    this.kanjiRadicalsDb = null;

    // Step 5 State (Luyện Dịch Câu Phức N2 - Scrambled Chunk Translation)
    this.translationMode = localStorage.getItem('edumanga_mimikara_trans_mode') || 'ja_to_vi'; // 'ja_to_vi' | 'vi_to_ja'
    this.translationIndex = 0;
    this.translationQuestions = [];
    this.assembledChunks = [];
    this.availableChunks = [];
    this.translationState = 'input'; // 'input' | 'correct' | 'incorrect'
    this.n2TranslationsDb = null;

    // Dynamic Funnel Step State
    this.currentStepId = 'flashcard';
    this.currentStepNumber = 1;

    this.initKeyboardEvents();
  }

  // --------------------------------------------------------------------------
  // DYNAMIC STEPPER FUNNEL ENGINE (HỆ THỐNG ĐÔN BƯỚC & CO GIÃN THEO CẤU HÌNH)
  // --------------------------------------------------------------------------
  getActiveSteps() {
    let config = (typeof window !== 'undefined' && window.MIMIKARA_CONFIG) ? window.MIMIKARA_CONFIG : null;
    let modes = config && config.modes ? { ...config.modes } : {
      flashcard: true,
      matching: true,
      typing: true,
      dictation: true,
      translation: true
    };

    // Kiểm tra cấu hình ghi đè trong localStorage (nếu có) để lập tức phản hồi
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('edumanga_mimikara_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.modes) {
            modes = { ...modes, ...parsed.modes };
          }
        }
      }
    } catch (e) {}

    const defs = config && config.definitions ? config.definitions : [
      { id: 'flashcard', originalStep: 1, name: 'Flashcard', shortName: 'Flashcard', icon: 'fa-clone', desc: 'Lướt từ & Chiết tự Mindmap' },
      { id: 'matching', originalStep: 2, name: 'Ghép Cặp', shortName: 'Ghép Cặp', icon: 'fa-puzzle-piece', desc: 'Ghép cặp 5x5' },
      { id: 'typing', originalStep: 3, name: 'Gõ Từ', shortName: 'Gõ Từ', icon: 'fa-keyboard', desc: 'Gõ từ 2 chiều' },
      { id: 'dictation', originalStep: 4, name: 'Nghe Điền', shortName: 'Nghe Điền', icon: 'fa-headphones', desc: 'Nghe điền câu Audio' },
      { id: 'translation', originalStep: 5, name: 'Luyện Dịch', shortName: 'Luyện Dịch', icon: 'fa-language', desc: 'Dịch câu phức N2' },
      { id: 'climbing', originalStep: 6, name: 'Leo Tháp', shortName: 'Leo Tháp', icon: 'fa-mountain', desc: 'Leo tháp phản xạ 15 cành Marathon' }
    ];

    const activeList = defs.filter(d => modes[d.id] !== false);
    if (activeList.length === 0) {
      activeList.push(defs[0]); // Bắt buộc giữ lại ít nhất 1 bước
    }

    // Tự động đôn và đánh số thứ tự liên tục 1..N
    return activeList.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }));
  }

  startFirstActiveStep() {
    const activeSteps = this.getActiveSteps();
    const firstStep = activeSteps[0];
    this.goToStepById(firstStep.id);
  }

  goToStepById(stepId) {
    this.currentStepId = stepId;
    const activeSteps = this.getActiveSteps();
    const cur = activeSteps.find(s => s.id === stepId);
    this.currentStepNumber = cur ? cur.stepNumber : 1;

    // Dọn dẹp game cũ nếu đang chạy
    if (this.activeClimberGame) {
      this.activeClimberGame.destroy();
      this.activeClimberGame = null;
    }

    if (stepId === 'flashcard') {
      this.currentStep = 1;
      this.flashcardIndex = 0;
      this.isCardFlipped = false;
      this.renderStep1Flashcard();
    } else if (stepId === 'matching') {
      this.currentStep = 2;
      this.startStep2Matching();
    } else if (stepId === 'typing') {
      this.currentStep = 3;
      this.startStep3Typing();
    } else if (stepId === 'dictation') {
      this.currentStep = 4;
      this.startStep4Dictation();
    } else if (stepId === 'translation') {
      this.currentStep = 5;
      this.startStep5Translation();
    } else if (stepId === 'climbing') {
      this.currentStep = 6;
      this.startStep6Climbing();
    }
  }

  startNextActiveStep(currentStepId) {
    const activeSteps = this.getActiveSteps();
    const currentIndex = activeSteps.findIndex(s => s.id === currentStepId);
    if (currentIndex !== -1 && currentIndex < activeSteps.length - 1) {
      const nextStep = activeSteps[currentIndex + 1];
      this.goToStepById(nextStep.id);
    } else {
      // Đã hoàn thành bước bật cuối cùng
      this.renderVictoryScreen();
    }
  }

  getNextActiveStepInfo(currentStepId) {
    const activeSteps = this.getActiveSteps();
    const currentIndex = activeSteps.findIndex(s => s.id === currentStepId);
    if (currentIndex !== -1 && currentIndex < activeSteps.length - 1) {
      return activeSteps[currentIndex + 1];
    }
    return null;
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
    if (typeof window !== 'undefined' && window.MIMIKARA_N2_UNITS) {
      this.dataset = window.MIMIKARA_N2_UNITS;
      return this.dataset;
    }
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

  // Fetch Kanji Radicals Database for Mindmap Graph
  async loadKanjiRadicalsDb() {
    if (this.kanjiRadicalsDb) return this.kanjiRadicalsDb;
    if (typeof window !== 'undefined' && window.MIMIKARA_KANJI_RADICALS) {
      this.kanjiRadicalsDb = window.MIMIKARA_KANJI_RADICALS;
      return this.kanjiRadicalsDb;
    }
    try {
      const resp = await fetch('data/kanji_radicals_n2.json');
      if (resp.ok) {
        this.kanjiRadicalsDb = await resp.json();
        return this.kanjiRadicalsDb;
      }
    } catch (err) {
      console.warn("Could not load data/kanji_radicals_n2.json, using heuristic breakdown:", err);
    }
    return null;
  }

  // Fetch N2 Complex Sentences Database for Translation Practice
  async loadTranslationsDb() {
    if (this.n2TranslationsDb) return this.n2TranslationsDb;
    if (typeof window !== 'undefined' && window.MIMIKARA_N2_TRANSLATIONS) {
      this.n2TranslationsDb = window.MIMIKARA_N2_TRANSLATIONS;
      return this.n2TranslationsDb;
    }
    try {
      const resp = await fetch('data/mimikara_n2_translations.json');
      if (resp.ok) {
        this.n2TranslationsDb = await resp.json();
        return this.n2TranslationsDb;
      }
    } catch (err) {
      console.warn("Could not load data/mimikara_n2_translations.json:", err);
    }
    return null;
  }

  // Text-To-Speech Pronunciation
  speak(text, rate = 0.9) {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/\[\d+\]/g, '').replace(/[\(\)]/g, '').trim();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = 'ja-JP';
      utter.rate = rate || 0.9;
      window.speechSynthesis.speak(utter);
    } catch (e) {}
  }

  // Keyboard Shortcuts Handler
  initKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      const modal = document.getElementById('mimikaraMasterModal');
      if (!modal || !modal.classList.contains('active')) return;

      // Hỗ trợ phím Tab xem gợi ý ngay cả khi đang trong ô nhập liệu ở Bước 4
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        if (this.currentStep === 4 && e.code === 'Tab') {
          e.preventDefault();
          this.revealDictationAnswer();
        }
        return;
      }

      if (this.currentStep === 1) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          this.toggleCardFlip();
        } else if (e.code === 'ArrowRight' || e.code === 'KeyN') {
          e.preventDefault();
          this.nextFlashcard();
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyP') {
          e.preventDefault();
          this.prevFlashcard();
        } else if (e.code === 'KeyR') {
          e.preventDefault();
          const w = this.currentChunkWords && this.currentChunkWords[this.flashcardIndex];
          if (w) this.speak(w.term);
        }
      } else if (this.currentStep === 4) {
        if (e.code === 'Space' || e.code === 'KeyR') {
          e.preventDefault();
          this.replayDictationAudio();
        }
      } else if (this.currentStep === 5) {
        if (e.code === 'Space' || e.code === 'KeyR') {
          e.preventDefault();
          const q = this.translationQuestions && this.translationQuestions[this.translationIndex];
          if (q) this.speak(q.n2_sentence_ja, 0.9);
        } else if (e.code === 'Enter') {
          e.preventDefault();
          if (this.translationState === 'correct') {
            this.nextTranslationQuestion();
          } else {
            this.checkTranslationAnswer();
          }
        } else if (e.code === 'Backspace') {
          e.preventDefault();
          if (this.assembledChunks.length > 0) {
            this.unselectChunk(this.assembledChunks.length - 1);
          }
        } else if (e.code === 'Escape') {
          e.preventDefault();
          this.resetTranslationChunks();
        } else if (e.key >= '1' && e.key <= '9') {
          const num = parseInt(e.key, 10) - 1;
          if (num >= 0 && num < this.availableChunks.length) {
            e.preventDefault();
            const targetChunk = this.availableChunks[num];
            if (targetChunk && !this.assembledChunks.includes(targetChunk.id)) {
              this.selectChunk(targetChunk.id);
            }
          }
        }
      }
    });
  }

  // Open Modal
  async openModal(unitId = null) {
    await this.loadDataset();
    this.loadKanjiRadicalsDb(); // Nạp ngầm cơ sở dữ liệu chiết tự bộ thủ
    this.loadTranslationsDb(); // Nạp ngầm cơ sở dữ liệu câu dịch N2
    if (!this.dataset) {
      alert("Không thể nạp dữ liệu từ vựng Mimikara N2. Vui lòng thử lại sau!");
      return;
    }

    this.ensureModalDOM();
    this.updateHeaderSubtitle();
    const modal = document.getElementById('mimikaraMasterModal');
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('mimikara-active');
      document.body.style.overflow = 'hidden';
    }

    if (unitId) {
      this.renderUnitChunks(unitId);
    } else {
      this.renderUnitsOverview();
    }
  }

  // Cập nhật phụ đề tiêu đề modal theo số bước đang active
  updateHeaderSubtitle() {
    const subEl = document.getElementById('mimikaraHeaderSubtitle');
    if (subEl) {
      const activeSteps = this.getActiveSteps();
      const stepNames = activeSteps.map(s => s.name).join(' ➔ ');
      subEl.textContent = `Học từ vựng ${activeSteps.length} bước: ${stepNames}`;
    }
  }

  // Close Modal
  closeModal() {
    if (this.activeClimberGame) {
      this.activeClimberGame.destroy();
      this.activeClimberGame = null;
    }
    const modal = document.getElementById('mimikaraMasterModal');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.remove('is-fullscreen');
      document.body.classList.remove('mimikara-active');
      document.body.style.overflow = '';
      this.updateFullscreenButtonIcon(false);
    }
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Chuyển đổi chế độ toàn màn hình cho modal & hỗ trợ HTML5 Fullscreen API
  toggleFullscreen(forceState = null) {
    const modal = document.getElementById('mimikaraMasterModal');
    if (!modal) return;

    const isCurrentlyFullscreen = modal.classList.contains('is-fullscreen');
    const shouldFullscreen = (forceState !== null) ? forceState : !isCurrentlyFullscreen;

    if (shouldFullscreen) {
      modal.classList.add('is-fullscreen');
      this.updateFullscreenButtonIcon(true);
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (e) {}
    } else {
      modal.classList.remove('is-fullscreen');
      this.updateFullscreenButtonIcon(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (e) {}
    }
  }

  updateFullscreenButtonIcon(isFullscreen) {
    const btn = document.getElementById('mimikaraBtnFullscreen');
    if (btn) {
      btn.innerHTML = isFullscreen ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
      btn.title = isFullscreen ? 'Thu nhỏ giao diện (Esc)' : 'Toàn màn hình';
    }
  }

  // Ensure Modal DOM exists in document
  ensureModalDOM() {
    if (document.getElementById('mimikaraMasterModal')) {
      this.updateHeaderSubtitle();
      return;
    }

    const activeSteps = this.getActiveSteps();
    const stepNames = activeSteps.map(s => s.name).join(' ➔ ');
    const dynamicSubtitle = `Học từ vựng ${activeSteps.length} bước: ${stepNames}`;

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
                <p id="mimikaraHeaderSubtitle">${dynamicSubtitle}</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button type="button" id="mimikaraBtnFullscreen" class="mimikara-btn-fullscreen" onclick="window.mimikaraService.toggleFullscreen()" title="Toàn màn hình / Thu nhỏ">
                <i class="fas fa-expand"></i>
              </button>
              <button type="button" class="mimikara-btn-close" onclick="window.mimikaraService.closeModal()" title="Đóng cửa sổ">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div id="mimikaraModalBody" class="mimikara-modal-body">
            <!-- Dynamic Content Injected Here -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Lắng nghe sự kiện fullscreenchange của trình duyệt
    document.addEventListener('fullscreenchange', () => {
      const modal = document.getElementById('mimikaraMasterModal');
      if (!modal) return;
      if (!document.fullscreenElement && !modal.classList.contains('is-fullscreen')) {
        this.updateFullscreenButtonIcon(false);
      }
    });
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
    // Khi thoát phiên về danh sách chunk của Unit, hoàn lại chế độ cửa sổ bình thường
    this.toggleFullscreen(false);
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

      <!-- Đấu Trường Leo Tháp Vô Tận (Endless Climber) Banner -->
      <div style="background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(6,182,212,0.15)); border: 1px solid rgba(168,85,247,0.3); border-radius: 14px; padding: 14px 20px; margin-bottom: 1.2rem; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
        <div>
          <h4 style="margin: 0 0 4px 0; color: #f8fafc; font-size: 0.98rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-mountain" style="color: #38bdf8;"></i> Đấu Trường Leo Tháp Vô Tận (Endless Climber)
          </h4>
          <p style="margin: 0; color: #94a3b8; font-size: 0.8rem;">
            Thử thách phản xạ gõ phím Romaji liên tục với toàn bộ ${unit.words.length} từ của ${escapeHtml(unit.title)}!
          </p>
        </div>
        <button type="button" class="btn-primary" onclick="window.mimikaraService.startEndlessClimbing(${unitId})" style="background: linear-gradient(135deg, #0284c7, #a855f7); padding: 9px 20px; font-weight: 800; font-size: 0.86rem; border-radius: 10px; box-shadow: 0 4px 14px rgba(2,132,199,0.4); display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <i class="fas fa-play"></i> Bắt đầu Leo Tháp ➔
        </button>
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

    // Tự động bật chế độ toàn màn hình cho phiên học để dễ nhìn và tập trung tối đa
    this.toggleFullscreen(true);

    // Khởi động từ bước đầu tiên đang BẬT trong file cấu hình
    this.startFirstActiveStep();
  }

  renderStepperHeader() {
    const unit = this.dataset.units.find(u => u.id === this.currentUnitId);
    const startStt = this.currentChunkWords[0].stt;
    const endStt = this.currentChunkWords[this.currentChunkWords.length - 1].stt;

    const activeSteps = this.getActiveSteps();
    const currentActive = activeSteps.find(s => s.id === this.currentStepId) || activeSteps.find(s => s.originalStep === this.currentStep) || activeSteps[0];
    const currentStepNum = currentActive ? currentActive.stepNumber : 1;

    const pillsHtml = activeSteps.map(s => {
      let stateClass = '';
      let icon = s.icon;
      if (s.stepNumber === currentStepNum) {
        stateClass = 'active';
      } else if (s.stepNumber < currentStepNum) {
        stateClass = 'completed';
        icon = 'fa-check';
      }
      return `
        <div class="mimikara-step-pill ${stateClass}" title="${escapeHtml(s.desc)}">
          <i class="fas ${icon}"></i> Bước ${s.stepNumber}: ${escapeHtml(s.name)}
        </div>
      `;
    }).join('');

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
          ${pillsHtml}
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

    // Auto pronounce khi sang thẻ mới
    this.speak(w.term);

    const isLastCard = this.flashcardIndex === this.currentChunkWords.length - 1;

    body.innerHTML = `
      ${this.renderStepperHeader()}

      <div class="mimikara-flashcard-box">
        <div id="mimikaraCard3d" class="mimikara-card-3d ${this.isCardFlipped ? 'flipped' : ''}" onclick="window.mimikaraService.toggleCardFlip(event)">
          <div class="mimikara-card-3d-inner">
            <!-- MẶT TRƯỚC (FRONT) -->
            <div class="mimikara-card-face mimikara-card-front">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 1.15rem; font-weight: 800; color: #c084fc; letter-spacing: 0.05em;">
                  THẺ ${this.flashcardIndex + 1} / ${this.currentChunkWords.length} (STT #${w.stt})
                </span>
                <button type="button" class="btn-icon-xs" onclick="event.stopPropagation(); window.mimikaraService.speak('${escapeJs(w.term)}')" title="Nghe phát âm từ vựng (Phím R)" style="background: rgba(168,85,247,0.25); color: #e9d5ff; width: 46px; height: 46px; border-radius: 12px; font-size: 1.35rem; border: 1.5px solid rgba(168,85,247,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                  <i class="fas fa-volume-high"></i>
                </button>
              </div>

              <div class="mimikara-card-main-word">
                <div class="mimikara-kanji-huge">${escapeHtml(w.term)}</div>
                <div class="mimikara-reading-mid">
                  <span>${escapeHtml(w.reading)}</span>
                  ${w.pitch_accent ? `<span class="mimikara-pitch-chip" title="Trọng âm Pitch Accent">${escapeHtml(w.pitch_accent)}</span>` : ''}
                </div>
                ${w.han_viet ? `<span class="mimikara-hanviet-tag">[ ${escapeHtml(w.han_viet)} ]</span>` : ''}
                ${this.renderFrontMindmap(w)}
                <div style="margin-top: 0.85rem; font-size: 0.95rem; color: #cbd5e1; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600;">
                  <i class="fas fa-rotate" style="color: #c084fc;"></i> Chạm vào thẻ hoặc nhấn <b>Phím Cách</b> để xem nghĩa & ví dụ
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1.1rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 1rem; color: #cbd5e1; font-weight: 600;">
                <span><i class="fas fa-hand-pointer" style="color: #c084fc;"></i> Chạm để lật mặt thẻ</span>
                <span style="color: #38bdf8; font-weight: 800; font-size: 1.05rem;">Mặt trước (Kanji)</span>
              </div>
            </div>

            <!-- MẶT SAU (BACK) -->
            <div class="mimikara-card-face mimikara-card-back">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 1.15rem; font-weight: 800; color: #38bdf8; letter-spacing: 0.05em;">
                  THẺ ${this.flashcardIndex + 1} / ${this.currentChunkWords.length} (STT #${w.stt})
                </span>
                <button type="button" class="btn-icon-xs" onclick="event.stopPropagation(); window.mimikaraService.speak('${escapeJs(w.term)}')" title="Nghe phát âm từ vựng (Phím R)" style="background: rgba(56,189,248,0.25); color: #bae6fd; width: 46px; height: 46px; border-radius: 12px; font-size: 1.35rem; border: 1.5px solid rgba(56,189,248,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                  <i class="fas fa-volume-high"></i>
                </button>
              </div>

              <div class="mimikara-card-back-details">
                <div class="mimikara-meaning-highlight">${escapeHtml(w.meaning)}</div>
                ${w.type ? `<div style="text-align: center; margin-bottom: 1.25rem;"><span class="mimikara-type-badge">${escapeHtml(w.type)}</span></div>` : ''}
                
                ${w.exam_ja ? `
                  <div class="mimikara-example-block">
                    <div class="mimikara-example-ja">
                      <span>${escapeHtml(w.exam_ja)}</span>
                      <button type="button" onclick="event.stopPropagation(); window.mimikaraService.speak('${escapeJs(w.exam_ja)}')" title="Nghe câu ví dụ" style="background: rgba(168,85,247,0.3); color: #e9d5ff; width: 40px; height: 40px; border-radius: 10px; font-size: 1.15rem; border: 1px solid rgba(168,85,247,0.5); cursor: pointer; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                        <i class="fas fa-volume-high"></i>
                      </button>
                    </div>
                    <div class="mimikara-example-vi">${escapeHtml(w.exam_vi || '')}</div>
                  </div>
                ` : ''}

                ${w.kanji_breakdown ? `
                  <div class="mimikara-breakdown-block">
                    <b style="color: #c084fc;"><i class="fas fa-puzzle-piece" style="color: #38bdf8;"></i> Chiết tự Kanji:</b> ${escapeHtml(w.kanji_breakdown)}
                  </div>
                ` : ''}

                ${w.synonyms_antonyms ? `
                  <div class="mimikara-related-block">
                    <b style="color: #fbbf24;"><i class="fas fa-link"></i> Từ liên quan / Chú thích:</b> ${escapeHtml(w.synonyms_antonyms)}
                  </div>
                ` : ''}
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1.1rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 1rem; color: #cbd5e1; font-weight: 600;">
                <span><i class="fas fa-hand-pointer" style="color: #38bdf8;"></i> Chạm để lật mặt thẻ</span>
                <span style="color: #34d399; font-weight: 800; font-size: 1.05rem;">Mặt sau (Nghĩa)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Controls Below Card -->
        <div class="mimikara-card-controls">
          <button type="button" class="mimikara-btn-back" onclick="window.mimikaraService.prevFlashcard()" ${this.flashcardIndex === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} style="padding: 14px 28px; font-size: 1.05rem; font-weight: 700; border-radius: 12px;">
            <i class="fas fa-chevron-left"></i> Từ trước (←)
          </button>

          ${isLastCard ? `
            <button type="button" class="btn-primary" onclick="window.mimikaraService.startNextActiveStep('flashcard')" style="background: linear-gradient(135deg, #a855f7, #6366f1); padding: 14px 34px; font-weight: 800; font-size: 1.1rem; border-radius: 14px; box-shadow: 0 6px 25px rgba(168,85,247,0.5);">
              <span>${this.getNextActiveStepInfo('flashcard') ? `Sẵn Sàng Sang Bước ${this.getNextActiveStepInfo('flashcard').stepNumber}: ${this.getNextActiveStepInfo('flashcard').name} ➔` : `Hoàn Thành Phiên Học ➔`}</span>
            </button>
          ` : `
            <button type="button" class="btn-primary" onclick="window.mimikaraService.nextFlashcard()" style="background: linear-gradient(135deg, #0284c7, #6366f1); padding: 14px 34px; font-weight: 800; font-size: 1.1rem; border-radius: 14px; box-shadow: 0 6px 25px rgba(2,132,199,0.5);">
              <span>Từ tiếp theo (→) ➔</span>
            </button>
          `}
        </div>

        <!-- Shortcuts guide -->
        <div class="mimikara-shortcuts-guide">
          <span><span class="mimikara-kbd">Space</span> Lật mặt</span>
          <span><span class="mimikara-kbd">←</span> / <span class="mimikara-kbd">→</span> Đổi từ</span>
          <span><span class="mimikara-kbd">R</span> Nghe phát âm</span>
        </div>
      </div>
    `;
  }

  toggleCardFlip(event) {
    if (event && event.target && event.target.closest('button')) return;
    this.isCardFlipped = !this.isCardFlipped;
    const card3d = document.getElementById('mimikaraCard3d');
    if (card3d) {
      card3d.classList.toggle('flipped', this.isCardFlipped);
    }
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
  // SƠ ĐỒ RADIAL MINDMAP CHIẾT TỰ & CẦN GẠT 2 CHẾ ĐỘ CHO MẶT TRƯỚC FLASHCARD
  // --------------------------------------------------------------------------
  setFrontGraphMode(mode) {
    this.frontGraphMode = mode;
    try {
      localStorage.setItem('edumanga_mimikara_front_graph_mode', mode);
    } catch (e) {}
    const container = document.getElementById('mimikaraFrontMindmapContainer');
    if (container && this.currentChunkWords && this.currentChunkWords[this.flashcardIndex]) {
      container.innerHTML = this.renderFrontMindmapContent(this.currentChunkWords[this.flashcardIndex]);
    }
  }

  selectFrontKanjiChar(char) {
    this.selectedFrontKanjiChar = char;
    const container = document.getElementById('mimikaraFrontMindmapContainer');
    if (container && this.currentChunkWords && this.currentChunkWords[this.flashcardIndex]) {
      container.innerHTML = this.renderFrontMindmapContent(this.currentChunkWords[this.flashcardIndex]);
    }
  }

  showNodeDetail(char, name, meaning) {
    const el = document.getElementById('mimikaraGraphNodeDetail');
    if (el) {
      el.innerHTML = `<span class="detail-node-pill">${escapeHtml(char)}</span> <b>${escapeHtml(name)}</b>: ${escapeHtml(meaning)}`;
    }
  }

  generateRadialSvg({ centerText, centerSub = '', satellites = [], satelliteColor = '#ea580c' }) {
    const width = 360;
    const height = 145;
    const cx = 180;
    const cy = 72;
    const centerR = 24;
    const orbitR = 62;
    const satR = 17;

    const count = Math.min(satellites.length, 4);
    if (count === 0) {
      return `
        <svg viewBox="0 0 ${width} ${height}" class="mimikara-svg-radial" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${cx}" cy="${cy}" r="${centerR}" fill="#0284c7" stroke="#38bdf8" stroke-width="2.5"/>
          <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-weight="900" font-size="16">${escapeHtml(centerText)}</text>
        </svg>
      `;
    }

    let angles = [];
    if (count === 1) {
      angles = [-90];
    } else if (count === 2) {
      angles = [180, 0];
    } else if (count === 3) {
      // Đúng chuẩn Hình 2: Đỉnh trên (-90°), Dưới phải (30°), Dưới trái (150°)
      angles = [-90, 30, 150];
    } else if (count === 4) {
      angles = [-135, -45, 45, 135];
    }

    let linesSvg = '';
    let dotsSvg = '';
    let satellitesSvg = '';

    for (let i = 0; i < count; i++) {
      const sat = satellites[i];
      const rad = (angles[i] * Math.PI) / 180;
      const sx = cx + orbitR * Math.cos(rad);
      const sy = cy + orbitR * Math.sin(rad);

      // Vector từ node vệ tinh hướng vào tâm
      const dx = cx - sx;
      const dy = cy - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const nx = dx / dist;
      const ny = dy / dist;

      // Điểm bắt đầu từ viền vệ tinh, điểm kết thúc tại viền tâm (chừa 5px cho mũi tên)
      const x1 = sx + satR * nx;
      const y1 = sy + satR * ny;
      const x2 = cx - (centerR + 5) * nx;
      const y2 = cy - (centerR + 5) * ny;

      // 2 chấm hạt trắng tinh tế trên đường nối (chuẩn xác theo Hình 2)
      const xd1 = x1 + (x2 - x1) * 0.35;
      const yd1 = y1 + (y2 - y1) * 0.35;
      const xd2 = x1 + (x2 - x1) * 0.70;
      const yd2 = y1 + (y2 - y1) * 0.70;

      dotsSvg += `
        <circle cx="${xd1.toFixed(1)}" cy="${yd1.toFixed(1)}" r="2" fill="#ffffff" opacity="0.9"/>
        <circle cx="${xd2.toFixed(1)}" cy="${yd2.toFixed(1)}" r="2" fill="#ffffff" opacity="0.9"/>
      `;

      linesSvg += `
        <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#cbd5e1" stroke-width="1.5" marker-end="url(#arrowIn)" />
      `;

      const satChar = sat.char || '';
      const satName = sat.name || '';
      const satMeaning = sat.meaning || '';
      const charFontSize = satChar.length > 2 ? 11 : (satChar.length === 2 ? 13 : 15);

      satellitesSvg += `
        <g class="svg-sat-group" onclick="event.stopPropagation(); window.mimikaraService.showNodeDetail('${escapeJs(satChar)}', '${escapeJs(satName)}', '${escapeJs(satMeaning)}')" onmouseenter="window.mimikaraService.showNodeDetail('${escapeJs(satChar)}', '${escapeJs(satName)}', '${escapeJs(satMeaning)}')">
          <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${satR}" fill="${satelliteColor}" stroke="#fdba74" stroke-width="2" filter="url(#glowSat)"/>
          <text x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-weight="900" font-size="${charFontSize}" font-family="'Hiragino Kaku Gothic Pro', 'BIZ UDPGothic', 'Meiryo', sans-serif" style="pointer-events: none;">${escapeHtml(satChar)}</text>
        </g>
      `;
    }

    const centerFontSize = centerText.length > 3 ? 12 : (centerText.length >= 2 ? 14 : 19);

    return `
      <svg viewBox="0 0 ${width} ${height}" class="mimikara-svg-radial" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrowIn" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#cbd5e1" />
          </marker>
          <filter id="glowCenter" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" flood-color="#38bdf8" flood-opacity="0.8"/>
          </filter>
          <filter id="glowSat" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#f97316" flood-opacity="0.75"/>
          </filter>
        </defs>
        ${linesSvg}
        ${dotsSvg}
        <!-- Tâm Node xanh Cyan -->
        <g class="svg-center-group">
          <circle cx="${cx}" cy="${cy}" r="${centerR}" fill="#0284c7" stroke="#38bdf8" stroke-width="2.5" filter="url(#glowCenter)"/>
          <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-weight="900" font-size="${centerFontSize}" font-family="'Hiragino Kaku Gothic Pro', 'BIZ UDPGothic', 'Meiryo', sans-serif">${escapeHtml(centerText)}</text>
        </g>
        <!-- Vệ tinh màu cam hướng vào tâm -->
        ${satellitesSvg}
      </svg>
    `;
  }

  renderFrontMindmap(w) {
    return `
      <div id="mimikaraFrontMindmapContainer" class="mimikara-front-mindmap-box" onclick="event.stopPropagation()">
        ${this.renderFrontMindmapContent(w)}
      </div>
    `;
  }

  renderFrontMindmapContent(w) {
    const term = w.term || '';
    const kanjiList = [...term].filter(ch => ch >= '\u4e00' && ch <= '\u9faf');
    const isCompound = this.frontGraphMode === 'compound';

    let toolbarHtml = '';
    let svgHtml = '';
    let initialDetailHtml = '';
    let storyHtml = '';

    // Cần gạt 2 chế độ & Bộ chọn chữ Kanji khi ở chế độ Chiết tự bộ thủ
    let kanjiPickerHtml = '';
    if (!isCompound && kanjiList.length > 1) {
      if (!this.selectedFrontKanjiChar || !kanjiList.includes(this.selectedFrontKanjiChar)) {
        this.selectedFrontKanjiChar = kanjiList[0];
      }
      kanjiPickerHtml = `
        <div class="graph-kanji-selector" onclick="event.stopPropagation()">
          <span class="selector-label">Chọn chữ:</span>
          ${kanjiList.map(k => `
            <button type="button" class="btn-kanji-pick ${k === this.selectedFrontKanjiChar ? 'active' : ''}" onclick="window.mimikaraService.selectFrontKanjiChar('${k}')">
              ${k}
            </button>
          `).join('')}
        </div>
      `;
    }

    toolbarHtml = `
      <div class="mimikara-graph-toolbar" onclick="event.stopPropagation()">
        <div class="graph-mode-toggle">
          <button type="button" class="btn-graph-pill ${isCompound ? 'active' : ''}" onclick="window.mimikaraService.setFrontGraphMode('compound')" title="Sơ đồ ghép từ vựng từ các chữ Hán cấu thành">
            <i class="fas fa-cubes"></i> Ghép Từ
          </button>
          <button type="button" class="btn-graph-pill ${!isCompound ? 'active' : ''}" onclick="window.mimikaraService.setFrontGraphMode('radical')" title="Chiết tự bộ thủ từng chữ Hán theo sơ đồ mạng (Mindmap)">
            <i class="fas fa-sitemap"></i> Chiết Tự Bộ Thủ
          </button>
        </div>
        ${kanjiPickerHtml}
      </div>
    `;

    if (isCompound) {
      // ----------------------------------------------------------------------
      // CHẾ ĐỘ 1: GHÉP TỪ VỰNG (COMPOUND WORD GRAPH)
      // ----------------------------------------------------------------------
      const breakdownText = w.kanji_breakdown || '';
      const parts = breakdownText.split('+').map(p => p.trim()).filter(Boolean);
      const satellites = [];

      parts.forEach(part => {
        const m = part.match(/^([^\(（]+)[\(（]([^:\：\)]+)[:\：]?([^\)）]*)[\)）]/);
        if (m) {
          satellites.push({
            char: m[1].trim(),
            name: m[2].trim(),
            meaning: m[3] ? m[3].trim() : m[2].trim()
          });
        } else {
          satellites.push({
            char: part,
            name: part,
            meaning: 'Thành phần chữ Hán'
          });
        }
      });

      // Dự phòng nếu không có breakdown text nhưng có chữ Hán trong từ
      if (satellites.length === 0 && kanjiList.length > 0) {
        kanjiList.forEach(k => {
          satellites.push({
            char: k,
            name: `Chữ ${k}`,
            meaning: 'Chữ Hán cấu thành'
          });
        });
      }

      svgHtml = this.generateRadialSvg({
        centerText: term,
        centerSub: w.han_viet || '',
        satellites: satellites,
        satelliteColor: '#ea580c'
      });

      const primaryMeaning = (w.meaning || '').split(/[-–,;/]/)[0].trim();
      if (satellites.length >= 2) {
        const charHooks = satellites.map(s => `<b>${escapeHtml(s.char)}</b> (${escapeHtml(s.meaning)})`).join(' + ');
        storyHtml = `Ghép từ ${charHooks} ➔ Liên tưởng: <i>"${escapeHtml(primaryMeaning)}"</i>`;
      } else if (satellites.length === 1) {
        storyHtml = `Chữ <b>${escapeHtml(satellites[0].char)}</b> (${escapeHtml(satellites[0].meaning)}) ➔ Gợi nhớ: <i>"${escapeHtml(primaryMeaning)}"</i>`;
      } else {
        storyHtml = `Từ vựng <b>${escapeHtml(term)}</b>: <i>"${escapeHtml(primaryMeaning)}"</i>`;
      }

      if (satellites.length > 0) {
        initialDetailHtml = `<span class="detail-node-pill">${escapeHtml(satellites[0].char)}</span> <b>${escapeHtml(satellites[0].name)}</b>: ${escapeHtml(satellites[0].meaning)}`;
      } else {
        initialDetailHtml = `<span>Chạm hoặc rê chuột vào các node vệ tinh để xem chi tiết</span>`;
      }

    } else {
      // ----------------------------------------------------------------------
      // CHẾ ĐỘ 2: CHIẾT TỰ BỘ THỦ (RADICAL MINDMAP - CHUẨN HÌNH 2)
      // ----------------------------------------------------------------------
      if (kanjiList.length === 0) {
        return `
          ${toolbarHtml}
          <div style="padding: 1rem; text-align: center; color: #94a3b8; font-size: 0.9rem;">
            <i class="fas fa-info-circle" style="color: #38bdf8; margin-right: 6px;"></i>
            Từ vựng này là chữ Kana / ngoại lai, không có chữ Hán để chiết tự bộ thủ.
          </div>
        `;
      }

      if (!this.selectedFrontKanjiChar || !kanjiList.includes(this.selectedFrontKanjiChar)) {
        this.selectedFrontKanjiChar = kanjiList[0];
      }
      const targetKanji = this.selectedFrontKanjiChar;

      // Tra cứu trong cơ sở dữ liệu chiết tự bộ thủ kanjiRadicalsDb
      let entry = this.kanjiRadicalsDb ? this.kanjiRadicalsDb[targetKanji] : null;

      // Fallback heuristics nếu chưa nạp xong file json
      if (!entry) {
        entry = {
          char: targetKanji,
          hanviet: '',
          meaning: '',
          components: [
            { char: targetKanji, name: `Chữ ${targetKanji}`, meaning: 'Thành phần chữ Hán' }
          ],
          story: `Chiết tự chữ <b>${targetKanji}</b>`
        };
      }

      svgHtml = this.generateRadialSvg({
        centerText: targetKanji,
        centerSub: entry.hanviet || '',
        satellites: entry.components || [],
        satelliteColor: '#f97316'
      });

      storyHtml = entry.story || `Chữ <b>${targetKanji}</b> gồm các bộ phận hướng vào tâm!`;

      if (entry.components && entry.components.length > 0) {
        const c0 = entry.components[0];
        initialDetailHtml = `<span class="detail-node-pill">${escapeHtml(c0.char)}</span> <b>${escapeHtml(c0.name)}</b>: ${escapeHtml(c0.meaning)}`;
      } else {
        initialDetailHtml = `<span>Chạm hoặc rê chuột vào các node vệ tinh để xem chi tiết bộ thủ</span>`;
      }
    }

    return `
      ${toolbarHtml}
      <div class="mimikara-svg-radial-wrap">
        ${svgHtml}
      </div>
      <div id="mimikaraGraphNodeDetail" class="graph-node-detail">
        ${initialDetailHtml}
      </div>
      <div class="graph-story-hook">
        <i class="fas fa-wand-magic-sparkles" style="color: #fde047; margin-right: 6px;"></i>
        <span>${storyHtml}</span>
      </div>
    `;
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
        <div class="mimikara-match-reading">${escapeHtml(c.reading)}</div>
      </div>
    `).join('');

    const rightCardsHtml = this.rightMatchCards.map(c => `
      <div id="${c.id}" class="mimikara-match-card ${c.matched ? 'matched' : ''} ${this.selectedRightCard && this.selectedRightCard.id === c.id ? 'selected' : ''}" onclick="window.mimikaraService.selectMatchCard('${c.id}', 'right')">
        <div class="mimikara-match-meaning">${escapeHtml(c.meaning)}</div>
        ${c.han_viet ? `<div class="mimikara-match-hanviet">[ ${escapeHtml(c.han_viet)} ]</div>` : ''}
      </div>
    `).join('');

    const allDone = this.matchedPairsCount === this.currentChunkWords.length;

    body.innerHTML = `
      ${this.renderStepperHeader()}

      <div class="mimikara-matching-board">
        <div class="mimikara-matching-desc">
          🎮 <b>Thử thách ghép cặp phản xạ:</b> Hãy chọn 1 ô Kanji ở cột trái và 1 ô Nghĩa tương ứng ở cột phải.
          <div id="mimikaraMatchScore" style="margin-top: 0.5rem; font-weight: 700; color: #34d399;">
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

        <div id="mimikaraMatchNextBtnBox" style="text-align: center; margin-top: 2rem; display: ${allDone ? 'block' : 'none'};">
          <button type="button" class="btn-primary" onclick="window.mimikaraService.startNextActiveStep('matching')" style="background: linear-gradient(135deg, #a855f7, #6366f1); padding: 12px 30px; font-weight: 800; font-size: 1rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(168,85,247,0.5);">
            <span>${this.getNextActiveStepInfo('matching') ? `🎉 Xuất Sắc! Sang Bước ${this.getNextActiveStepInfo('matching').stepNumber}: ${this.getNextActiveStepInfo('matching').name} ➔` : `🎉 Hoàn Thành Phiên Học ➔`}</span>
          </button>
        </div>
      </div>
    `;
  }

  selectMatchCard(id, side) {
    if (side === 'left') {
      const card = this.leftMatchCards.find(c => c.id === id);
      if (!card || card.matched) return;

      const prevEl = this.selectedLeftCard ? document.getElementById(this.selectedLeftCard.id) : null;
      if (prevEl) prevEl.classList.remove('selected');

      if (this.selectedLeftCard && this.selectedLeftCard.id === id) {
        this.selectedLeftCard = null;
      } else {
        this.selectedLeftCard = card;
        const curEl = document.getElementById(id);
        if (curEl) curEl.classList.add('selected');
        this.speak(card.term);
      }
    } else {
      const card = this.rightMatchCards.find(c => c.id === id);
      if (!card || card.matched) return;

      const prevEl = this.selectedRightCard ? document.getElementById(this.selectedRightCard.id) : null;
      if (prevEl) prevEl.classList.remove('selected');

      if (this.selectedRightCard && this.selectedRightCard.id === id) {
        this.selectedRightCard = null;
      } else {
        this.selectedRightCard = card;
        const curEl = document.getElementById(id);
        if (curEl) curEl.classList.add('selected');
      }
    }

    // Nếu đã chọn cả 2 bên -> Kiểm tra cặp trực tiếp trên DOM
    if (this.selectedLeftCard && this.selectedRightCard) {
      this.checkMatchingPair();
    }
  }

  checkMatchingPair() {
    const left = this.selectedLeftCard;
    const right = this.selectedRightCard;
    if (!left || !right) return;

    const leftEl = document.getElementById(left.id);
    const rightEl = document.getElementById(right.id);

    if (left.stt === right.stt) {
      // Đúng cặp!
      left.matched = true;
      right.matched = true;
      this.matchedPairsCount++;
      this.speak(left.term);

      if (leftEl) {
        leftEl.classList.remove('selected');
        leftEl.classList.add('matched');
      }
      if (rightEl) {
        rightEl.classList.remove('selected');
        rightEl.classList.add('matched');
      }

      this.selectedLeftCard = null;
      this.selectedRightCard = null;

      // Cập nhật điểm số trên DOM
      const scoreEl = document.getElementById('mimikaraMatchScore');
      if (scoreEl) {
        scoreEl.textContent = `Đã ghép chính xác: ${this.matchedPairsCount} / ${this.currentChunkWords.length} cặp`;
      }

      // Khi hoàn thành 5 cặp -> hiện nút chuyển bước
      if (this.matchedPairsCount === this.currentChunkWords.length) {
        const nextBox = document.getElementById('mimikaraMatchNextBtnBox');
        if (nextBox) {
          nextBox.style.display = 'block';
          nextBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    } else {
      // Sai cặp -> Rung đỏ rồi tự gỡ
      if (leftEl) leftEl.classList.add('wrong');
      if (rightEl) rightEl.classList.add('wrong');

      setTimeout(() => {
        if (leftEl) leftEl.classList.remove('wrong', 'selected');
        if (rightEl) rightEl.classList.remove('wrong', 'selected');
        this.selectedLeftCard = null;
        this.selectedRightCard = null;
      }, 400);
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
      this.startNextActiveStep('typing');
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
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span style="font-size: 1.15rem; font-weight: 800; color: #c084fc; letter-spacing: 0.05em;">LƯỢT ${this.typingIndex + 1} / ${this.typingQuestions.length}</span>
            <button type="button" class="btn-icon-xs" onclick="window.mimikaraService.speak('${escapeJs(q.word.term)}')" title="Nghe phát âm" style="background: rgba(168,85,247,0.25); color: #e9d5ff; width: 44px; height: 44px; border-radius: 12px; font-size: 1.25rem; border: 1.5px solid rgba(168,85,247,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center;">
              <i class="fas fa-volume-high"></i>
            </button>
          </div>

          <div class="mimikara-typing-prompt-type">${q.promptType}</div>
          <div class="mimikara-typing-prompt-text">${escapeHtml(q.promptText)}</div>
          <div class="mimikara-typing-hint">${escapeHtml(q.hint)}</div>

          <form onsubmit="window.mimikaraService.checkTypingAnswer(event)" class="mimikara-input-group">
            <input type="text" id="mimikaraTypingInput" class="mimikara-typing-input ${this.typingState}" placeholder="Gõ đáp án của bạn và nhấn Enter..." autocomplete="off">
            <button type="submit" class="btn-primary" style="background: linear-gradient(135deg, #a855f7, #6366f1); padding: 0 32px; font-weight: 800; font-size: 1.15rem; border-radius: 16px; cursor: pointer; box-shadow: 0 4px 20px rgba(168,85,247,0.4);">
              Kiểm Tra
            </button>
          </form>

          <div id="mimikaraTypingFeedback" class="mimikara-typing-feedback">
            ${this.renderTypingFeedbackHTML(q)}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <button type="button" class="btn-secondary" onclick="window.mimikaraService.revealAnswer()" style="font-size: 1.05rem; font-weight: 700; padding: 12px 22px; border-radius: 12px;">
            <i class="fas fa-eye"></i> Xem đáp án gợi ý
          </button>
          <span style="font-size: 1rem; color: #cbd5e1; font-weight: 600;">Nhấn <b>Enter</b> để kiểm tra / chuyển câu</span>
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
      return `<div style="color: #34d399; font-size: 1.25rem;"><i class="fas fa-check-circle"></i> <b>Chính xác!</b> Tuyệt vời!</div>`;
    }
    if (this.typingState === 'incorrect') {
      return `
        <div style="color: #f87171; text-align: center; font-size: 1.15rem;">
          <div><i class="fas fa-times-circle"></i> Chưa chính xác, hãy thử lại hoặc xem gợi ý!</div>
          <div style="font-size: 1.15rem; color: #cbd5e1; margin-top: 6px;">
            Đáp án chuẩn: <b style="color: #38bdf8;">${escapeHtml(q.word.term)}</b> (<span style="color: #fde047;">${escapeHtml(q.word.reading)}</span>) = <i>${escapeHtml(q.word.meaning)}</i>
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

    const feedback = document.getElementById('mimikaraTypingFeedback');

    if (isCorrect) {
      this.typingState = 'correct';
      this.speak(q.word.term);
      input.classList.remove('incorrect');
      input.classList.add('correct');
      if (feedback) feedback.innerHTML = this.renderTypingFeedbackHTML(q);

      setTimeout(() => {
        this.typingIndex++;
        this.typingState = 'input';
        this.renderStep3Typing();
      }, 650);
    } else {
      this.typingState = 'incorrect';
      input.classList.remove('correct');
      input.classList.add('incorrect');
      if (feedback) feedback.innerHTML = this.renderTypingFeedbackHTML(q);
      input.focus();
    }
  }

  revealAnswer() {
    const q = this.typingQuestions[this.typingIndex];
    const feedback = document.getElementById('mimikaraTypingFeedback');
    if (feedback) {
      feedback.innerHTML = `
        <div style="color: #fbbf24; font-size: 1.15rem; line-height: 1.6;">
          💡 <b>Gợi ý đáp án:</b> Từ: <b style="color: #38bdf8;">${escapeHtml(q.word.term)}</b> (<span style="color: #fde047;">${escapeHtml(q.word.reading)}</span>) | Nghĩa: <i style="color: #34d399;">${escapeHtml(q.word.meaning)}</i>
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
  // BƯỚC 4: LUYỆN NGHE & GÕ ĐIỀN KHUYẾT CÂU (AUDIO CLOZE & DICTATION)
  // --------------------------------------------------------------------------
  startStep4Dictation() {
    this.currentStep = 4;
    this.dictationIndex = 0;
    this.dictationState = 'input';
    this.dictationLiveInput = '';
    this.dictationQuestions = this.currentChunkWords.map(w => ({ ...w }));
    this.renderStep4Dictation();
  }

  setDictationMode(mode) {
    this.dictationMode = mode;
    try {
      localStorage.setItem('edumanga_mimikara_dictation_mode', mode);
    } catch (e) {}
    this.dictationState = 'input';
    this.dictationLiveInput = '';
    this.renderStep4Dictation();
  }

  toggleDictationAudioSpeed() {
    this.dictationAudioRate = this.dictationAudioRate === 1.0 ? 0.8 : 1.0;
    const btn = document.getElementById('btnDictationSpeed');
    if (btn) {
      btn.innerHTML = this.dictationAudioRate === 0.8 
        ? `<i class="fas fa-turtle"></i> 0.8x (Chậm)` 
        : `<i class="fas fa-bolt"></i> 1.0x (Chuẩn)`;
      btn.classList.toggle('active', this.dictationAudioRate === 0.8);
    }
    this.replayDictationAudio();
  }

  replayDictationAudio() {
    const q = this.dictationQuestions[this.dictationIndex];
    if (q && q.exam_ja) {
      this.speak(q.exam_ja, this.dictationAudioRate);
    }
  }

  // Tách cụm tiếng Nhật thông minh bằng Intl.Segmenter kết hợp gom trợ từ (Bunsetsu)
  segmentJapaneseSentence(sentence, targetWord) {
    if (!sentence) return [];
    const cleanSentence = sentence.trim();

    let tokens = [];
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
      tokens = Array.from(segmenter.segment(cleanSentence)).map(s => s.segment);
    } else {
      tokens = cleanSentence.split(/([、。！？\s]+)/).filter(Boolean);
    }

    const attachToPrev = new Set([
      'な', 'を', 'に', 'で', 'は', 'が', 'と', 'へ', 'から', 'まで', 'より', 
      'も', 'の', 'ね', 'よ', 'か', 'だ', 'です', 'ます', 'た', 'て', 'てる', 
      'ている', 'ない', 'ば', 'たら', 'なら', 'である', 'れる', 'られる', 'せる'
    ]);

    const targetTerm = (targetWord && targetWord.term) ? targetWord.term.trim() : '';

    const chunks = [];
    let currentChunk = '';

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (!token) continue;

      if (/^[。、！？\.\,\!\?\s]+$/.test(token)) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
        chunks.push(token);
        continue;
      }

      if (targetTerm && token === targetTerm) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
        chunks.push(token);
        continue;
      }

      if (attachToPrev.has(token) && currentChunk) {
        currentChunk += token;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = token;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.filter(c => c.trim().length > 0);
  }

  renderStep4Dictation() {
    const body = document.getElementById('mimikaraModalBody');
    if (!body) return;

    if (this.dictationIndex >= this.dictationQuestions.length) {
      this.startStep5Translation();
      return;
    }

    const q = this.dictationQuestions[this.dictationIndex];
    const sentence = q.exam_ja || `${q.term}の勉強をする。`;
    const targetTerm = q.term;
    const targetReading = q.reading || '';

    // Tự động phát âm toàn câu khi vừa vào câu mới
    this.speak(sentence, this.dictationAudioRate);

    let sentenceDisplayHtml = '';
    const isLevel1 = this.dictationMode === 'target_cloze';

    if (isLevel1) {
      // CẤP ĐỘ 1: Điền từ mục tiêu [ • • • • ]
      const parts = sentence.split(targetTerm);
      const before = parts[0] || '';
      const after = parts.slice(1).join(targetTerm) || '';
      const dotCount = Math.max(1, targetReading ? targetReading.length : targetTerm.length);

      if (this.dictationState === 'correct') {
        sentenceDisplayHtml = `
          <div class="mimikara-cloze-sentence">
            <span class="cloze-prefix">${escapeHtml(before)}</span>
            <span class="cloze-target-correct">
              <span class="cloze-target-term">${escapeHtml(targetTerm)}</span>
              <span class="cloze-target-furigana">【${escapeHtml(targetReading)}】</span>
            </span>
            <span class="cloze-suffix">${escapeHtml(after)}</span>
          </div>
        `;
      } else {
        const typedHiragana = romajiToHiragana(this.dictationLiveInput || '');
        let slots = '';
        for (let i = 0; i < dotCount; i++) {
          const char = typedHiragana[i] || '';
          if (char) {
            slots += `<span class="cloze-slot-char filled">${escapeHtml(char)}</span>`;
          } else {
            slots += `<span class="cloze-slot-char empty">•</span>`;
          }
        }

        sentenceDisplayHtml = `
          <div class="mimikara-cloze-sentence">
            <span class="cloze-prefix">${escapeHtml(before)}</span>
            <span id="mimikaraTargetSlotGroup" class="cloze-slot-group" title="Cần gõ ${dotCount} âm tiết">${slots}</span>
            <span class="cloze-suffix">${escapeHtml(after)}</span>
          </div>
        `;
      }
    } else {
      // CẤP ĐỘ 2: Chép chính tả toàn câu [ • • • • • ] [ • • • • ] [ • • • ]
      if (this.dictationState === 'correct') {
        sentenceDisplayHtml = `
          <div class="mimikara-cloze-sentence">
            <span class="cloze-full-correct"><i class="fas fa-check-circle" style="color: #34d399; margin-right: 8px;"></i>${escapeHtml(sentence)}</span>
          </div>
        `;
      } else {
        const chunks = this.segmentJapaneseSentence(sentence, q);
        const typedHiragana = romajiToHiragana(this.dictationLiveInput || '');
        let cursor = 0;
        let chunksHtml = '';

        chunks.forEach((chunk, chunkIdx) => {
          if (/^[。、！？\.\,\!\?\s]+$/.test(chunk)) {
            chunksHtml += `<span class="cloze-punct">${escapeHtml(chunk)}</span>`;
            return;
          }

          const isTarget = chunk === targetTerm;
          const dotCount = (isTarget && targetReading) ? targetReading.length : chunk.length;

          let slots = '';
          for (let i = 0; i < dotCount; i++) {
            const char = typedHiragana[cursor] || '';
            if (char) {
              slots += `<span class="cloze-slot-char filled">${escapeHtml(char)}</span>`;
            } else {
              slots += `<span class="cloze-slot-char empty">•</span>`;
            }
            cursor++;
          }

          chunksHtml += `
            <div class="cloze-chunk-wrapper ${isTarget ? 'target-chunk' : ''}" title="${isTarget ? 'Từ bài học: ' + targetTerm : 'Cụm ' + (chunkIdx + 1)}">
              <span class="cloze-slot-group">${slots}</span>
              <span class="cloze-chunk-label">${escapeHtml(chunk)}</span>
            </div>
          `;
        });

        sentenceDisplayHtml = `
          <div class="mimikara-cloze-sentence full-mode" id="mimikaraFullModeSentence">
            ${chunksHtml}
          </div>
        `;
      }
    }

    const placeholderText = isLevel1
      ? `✍️ Nghe và gõ từ bị khuyết (Ví dụ: ${escapeHtml(q.romaji || q.reading)})...`
      : `✍️ Nghe và gõ toàn bộ câu bằng Romaji hoặc Hiragana...`;

    body.innerHTML = `
      ${this.renderStepperHeader()}

      <div class="mimikara-dictation-container">
        <div class="mimikara-dictation-card">
          <!-- Top Row: Counter & Audio Controls & Mode Switch -->
          <div class="mimikara-dictation-toolbar">
            <div class="dictation-toolbar-left">
              <span class="dictation-step-badge">
                <i class="fas fa-headphones"></i> CÂU ${this.dictationIndex + 1} / ${this.dictationQuestions.length} (STT #${q.stt})
              </span>
              
              <!-- Mode Switcher Pill (Level 1 vs Level 2) -->
              <div class="dictation-mode-toggle">
                <button type="button" class="btn-mode-pill ${isLevel1 ? 'active' : ''}" onclick="window.mimikaraService.setDictationMode('target_cloze')" title="Chỉ gõ từ mục tiêu của bài học">
                  <i class="fas fa-bullseye"></i> Cấp 1: Điền Từ
                </button>
                <button type="button" class="btn-mode-pill ${!isLevel1 ? 'active' : ''}" onclick="window.mimikaraService.setDictationMode('full_dictation')" title="Thử thách chép chính tả trọn vẹn cả câu">
                  <i class="fas fa-layer-group"></i> Cấp 2: Toàn Câu
                </button>
              </div>
            </div>

            <!-- Audio Actions -->
            <div class="dictation-toolbar-right">
              <button type="button" id="btnDictationSpeed" class="btn-speed-toggle ${this.dictationAudioRate === 0.8 ? 'active' : ''}" onclick="window.mimikaraService.toggleDictationAudioSpeed()" title="Chuyển đổi tốc độ nghe chuẩn 1.0x / chậm 0.8x">
                <i class="fas ${this.dictationAudioRate === 0.8 ? 'fa-turtle' : 'fa-bolt'}"></i> ${this.dictationAudioRate === 0.8 ? '0.8x (Chậm)' : '1.0x (Chuẩn)'}
              </button>

              <button type="button" class="btn-dictation-speaker" onclick="window.mimikaraService.replayDictationAudio()" title="Nghe lại câu ví dụ (Phím Space hoặc R)">
                <i class="fas fa-volume-high"></i> <span>Nghe Lại</span>
              </button>
            </div>
          </div>

          <!-- Sentence Display Area with Slots [ • • • • ] -->
          <div class="mimikara-cloze-box">
            ${sentenceDisplayHtml}
          </div>

          <!-- Vietnamese Meaning Hint -->
          <div class="mimikara-cloze-meaning">
            <i class="fas fa-language" style="color: #c084fc; margin-right: 6px;"></i> "${escapeHtml(q.exam_vi || q.meaning)}"
          </div>

          <!-- Input Box -->
          <form onsubmit="window.mimikaraService.checkDictationAnswer(event)" class="mimikara-input-group">
            <input type="text" 
                   id="mimikaraDictationInput" 
                   class="mimikara-typing-input ${this.dictationState}" 
                   placeholder="${placeholderText}" 
                   value="${escapeHtml(this.dictationLiveInput || '')}"
                   oninput="window.mimikaraService.handleDictationInput(event)"
                   autocomplete="off" 
                   spellcheck="false">
            <button type="submit" class="btn-primary" style="background: linear-gradient(135deg, #a855f7, #6366f1); padding: 0 32px; font-weight: 800; font-size: 1.15rem; border-radius: 16px; cursor: pointer; box-shadow: 0 4px 20px rgba(168,85,247,0.4);">
              Kiểm Tra
            </button>
          </form>

          <!-- Feedback & Hints -->
          <div id="mimikaraDictationFeedback" class="mimikara-typing-feedback">
            ${this.renderDictationFeedbackHTML(q)}
          </div>
        </div>

        <!-- Footer Shortcuts & Hints -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <button type="button" class="btn-secondary" onclick="window.mimikaraService.revealDictationAnswer()" style="font-size: 1.05rem; font-weight: 700; padding: 12px 22px; border-radius: 12px;">
            <i class="fas fa-eye"></i> Xem đáp án gợi ý (Tab)
          </button>
          <span style="font-size: 0.95rem; color: #cbd5e1; font-weight: 600;">
            Phím <b>Space / R</b>: Nghe lại • <b>Enter</b>: Kiểm tra • <b>Tab</b>: Gợi ý
          </span>
        </div>
      </div>
    `;

    setTimeout(() => {
      const input = document.getElementById('mimikaraDictationInput');
      if (input) {
        input.focus();
        if (this.dictationLiveInput) {
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
    }, 50);
  }

  handleDictationInput(e) {
    const val = e.target.value;
    this.dictationLiveInput = val;

    if (this.dictationMode === 'target_cloze') {
      const q = this.dictationQuestions[this.dictationIndex];
      const targetReading = q.reading || '';
      const targetTerm = q.term || '';
      const dotCount = Math.max(1, targetReading ? targetReading.length : targetTerm.length);
      const typedHiragana = romajiToHiragana(val);

      const slotGroup = document.getElementById('mimikaraTargetSlotGroup');
      if (slotGroup) {
        let slots = '';
        for (let i = 0; i < dotCount; i++) {
          const char = typedHiragana[i] || '';
          if (char) {
            slots += `<span class="cloze-slot-char filled">${escapeHtml(char)}</span>`;
          } else {
            slots += `<span class="cloze-slot-char empty">•</span>`;
          }
        }
        slotGroup.innerHTML = slots;
      }
    } else {
      // Cập nhật live cho Cấp độ 2 (Toàn câu)
      const q = this.dictationQuestions[this.dictationIndex];
      const sentence = q.exam_ja || `${q.term}の勉強をする。`;
      const chunks = this.segmentJapaneseSentence(sentence, q);
      const typedHiragana = romajiToHiragana(val);
      let cursor = 0;

      const container = document.getElementById('mimikaraFullModeSentence');
      if (container) {
        let chunksHtml = '';
        chunks.forEach((chunk, chunkIdx) => {
          if (/^[。、！？\.\,\!\?\s]+$/.test(chunk)) {
            chunksHtml += `<span class="cloze-punct">${escapeHtml(chunk)}</span>`;
            return;
          }

          const isTarget = chunk === q.term;
          const dotCount = (isTarget && q.reading) ? q.reading.length : chunk.length;

          let slots = '';
          for (let i = 0; i < dotCount; i++) {
            const char = typedHiragana[cursor] || '';
            if (char) {
              slots += `<span class="cloze-slot-char filled">${escapeHtml(char)}</span>`;
            } else {
              slots += `<span class="cloze-slot-char empty">•</span>`;
            }
            cursor++;
          }

          chunksHtml += `
            <div class="cloze-chunk-wrapper ${isTarget ? 'target-chunk' : ''}" title="${isTarget ? 'Từ bài học: ' + q.term : 'Cụm ' + (chunkIdx + 1)}">
              <span class="cloze-slot-group">${slots}</span>
              <span class="cloze-chunk-label">${escapeHtml(chunk)}</span>
            </div>
          `;
        });
        container.innerHTML = chunksHtml;
      }
    }
  }

  renderDictationFeedbackHTML(q) {
    if (this.dictationState === 'correct') {
      return `
        <div style="color: #34d399; font-size: 1.25rem; animation: popSuccess 0.3s ease;">
          <i class="fas fa-check-circle"></i> <b>Chính xác tuyệt đối!</b> Đã nghe và ghi nhận từ vựng xuất sắc!
        </div>
      `;
    }
    if (this.dictationState === 'incorrect') {
      const isLevel1 = this.dictationMode === 'target_cloze';
      return `
        <div style="color: #f87171; text-align: center; font-size: 1.15rem;">
          <div><i class="fas fa-times-circle"></i> Chưa chính xác, hãy nghe lại hoặc nhấn "Xem đáp án"!</div>
          <div style="font-size: 1.1rem; color: #cbd5e1; margin-top: 6px;">
            ${isLevel1 
              ? `Từ cần điền: <b style="color: #38bdf8;">${escapeHtml(q.term)}</b> (<span style="color: #fde047;">${escapeHtml(q.reading)}</span>)`
              : `Câu chuẩn: <b style="color: #38bdf8;">${escapeHtml(q.exam_ja)}</b>`
            }
          </div>
        </div>
      `;
    }
    return '';
  }

  checkDictationAnswer(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('mimikaraDictationInput');
    if (!input) return;

    const val = input.value.trim();
    if (!val) return;

    const q = this.dictationQuestions[this.dictationIndex];
    const isLevel1 = this.dictationMode === 'target_cloze';
    const clean = s => (s || '').toLowerCase().trim().normalize('NFC')
      .replace(/[\.\,\;\:\-\_\(\)\[\]\/\!\\？\。、！\s]/g, '');

    const cleanInput = clean(val);
    const inputHiragana = clean(romajiToHiragana(val));
    let isCorrect = false;

    if (isLevel1) {
      const targetReading = clean(q.reading);
      const targetTerm = clean(q.term);
      const targetRomaji = clean(q.romaji);

      if (inputHiragana === targetReading || cleanInput === targetTerm || cleanInput === targetRomaji) {
        isCorrect = true;
      }
    } else {
      const targetSentence = clean(q.exam_ja);
      const targetTerm = clean(q.term);
      const targetReading = clean(q.reading);

      if (cleanInput === targetSentence || inputHiragana === clean(romajiToHiragana(q.exam_ja))) {
        isCorrect = true;
      } else if (cleanInput.includes(targetTerm) || inputHiragana.includes(targetReading)) {
        isCorrect = true;
      }
    }

    const feedback = document.getElementById('mimikaraDictationFeedback');

    if (isCorrect) {
      this.dictationState = 'correct';
      this.speak(q.exam_ja, this.dictationAudioRate);
      input.classList.remove('incorrect');
      input.classList.add('correct');
      
      this.renderStep4Dictation();

      setTimeout(() => {
        this.dictationIndex++;
        this.dictationState = 'input';
        this.dictationLiveInput = '';
        if (this.dictationIndex >= this.dictationQuestions.length) {
          this.startNextActiveStep('dictation');
        } else {
          this.renderStep4Dictation();
        }
      }, 950);
    } else {
      this.dictationState = 'incorrect';
      input.classList.remove('correct');
      input.classList.add('incorrect');
      if (feedback) feedback.innerHTML = this.renderDictationFeedbackHTML(q);
      input.focus();
    }
  }

  revealDictationAnswer() {
    const q = this.dictationQuestions[this.dictationIndex];
    const isLevel1 = this.dictationMode === 'target_cloze';
    const feedback = document.getElementById('mimikaraDictationFeedback');

    if (feedback) {
      feedback.innerHTML = `
        <div style="color: #fbbf24; font-size: 1.15rem; line-height: 1.6;">
          💡 <b>Đáp án:</b> <b style="color: #38bdf8;">${escapeHtml(isLevel1 ? q.term + ' (' + q.reading + ')' : q.exam_ja)}</b>
          <span style="color: #34d399; margin-left: 8px;">= ${escapeHtml(q.exam_vi || q.meaning)}</span>
        </div>
      `;
    }

    const input = document.getElementById('mimikaraDictationInput');
    if (input) {
      input.value = isLevel1 ? q.reading : q.exam_ja;
      this.handleDictationInput({ target: input });
      input.focus();
    }
  }

  // Smart Sentence Chunk Splitter (Phân đoạn câu thành các khối ngữ nghĩa logic)
  splitSentenceIntoChunks(sentence, lang = 'ja') {
    if (!sentence) return [];
    const clean = String(sentence).trim();
    if (lang === 'ja') {
      let parts = clean.split(/(?<=[、。！？])/g).map(s => s.trim()).filter(Boolean);
      let chunks = [];
      parts.forEach(p => {
        if (p.length > 9) {
          const sub = p.split(/(?<=(?:ためには|にあたって|をめぐって|において|にもかかわらず|ながら|ことこそが|ことこそ|である|ですが|けれど|ので|から|ため|なら|たら|ば|ても|でも|て、|で、|て|で|を|に|が|は|と))/g).map(s => s.trim()).filter(Boolean);
          if (sub.length > 1) {
            chunks.push(...sub);
          } else {
            chunks.push(p);
          }
        } else {
          chunks.push(p);
        }
      });
      if (chunks.length <= 1 && clean.length > 6) {
        const mid = Math.floor(clean.length / 2);
        chunks = [clean.slice(0, mid), clean.slice(mid)];
      }
      return chunks.length > 0 ? chunks : [clean];
    } else {
      let parts = clean.split(/(?<=[,.;!?])/g).map(s => s.trim()).filter(Boolean);
      let chunks = [];
      parts.forEach(p => {
        const words = p.split(/\s+/).filter(Boolean);
        if (words.length > 4) {
          for (let i = 0; i < words.length; i += 3) {
            chunks.push(words.slice(i, i + 3).join(' '));
          }
        } else if (words.length > 0) {
          chunks.push(words.join(' '));
        }
      });
      if (chunks.length <= 1) {
        const words = clean.split(/\s+/).filter(Boolean);
        if (words.length >= 4) {
          const mid = Math.ceil(words.length / 2);
          chunks = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
        }
      }
      return chunks.length > 0 ? chunks : [clean];
    }
  }

  // --------------------------------------------------------------------------
  // BƯỚC 5: LUYỆN DỊCH CÂU PHỨC N2 (SCRAMBLED CHUNK TRANSLATION PUZZLE)
  // --------------------------------------------------------------------------
  async startStep5Translation() {
    this.currentStep = 5;
    this.translationIndex = 0;
    this.translationState = 'input';
    await this.loadTranslationsDb();

    this.translationQuestions = this.currentChunkWords.map(w => {
      const stt = String(w.stt);
      let custom = this.n2TranslationsDb ? (this.n2TranslationsDb[stt] || this.n2TranslationsDb[parseInt(stt, 10)]) : null;
      if (!custom && this.n2TranslationsDb) {
        custom = Object.values(this.n2TranslationsDb).find(item => item && (item.term === w.term || String(item.stt) === stt));
      }

      if (custom && Array.isArray(custom.chunks_ja) && custom.chunks_ja.length >= 2 && Array.isArray(custom.chunks_vi) && custom.chunks_vi.length >= 2) {
        return {
          ...w,
          ...custom
        };
      }

      // Thông minh: Phân rã câu thành nhiều khối nếu dùng fallback
      const senJa = (custom && custom.n2_sentence_ja) || w.exam_ja || `${w.term}を深く理解し、日々の生活に活かすことが極めて重要である。`;
      const senVi = (custom && custom.n2_sentence_vi) || w.exam_vi || `Việc thấu hiểu sâu sắc về ${w.meaning} và vận dụng vào cuộc sống thường ngày là điều vô cùng quan trọng.`;
      const chunksJa = (custom && custom.chunks_ja && custom.chunks_ja.length >= 2) ? custom.chunks_ja : this.splitSentenceIntoChunks(senJa, 'ja');
      const chunksVi = (custom && custom.chunks_vi && custom.chunks_vi.length >= 2) ? custom.chunks_vi : this.splitSentenceIntoChunks(senVi, 'vi');

      return {
        ...w,
        n2_sentence_ja: senJa,
        n2_sentence_vi: senVi,
        chunks_ja: chunksJa,
        chunks_vi: chunksVi,
        grammar: (custom && custom.grammar) || 'Cấu trúc câu phức chuẩn N2',
        collocation: (custom && custom.collocation) || `${w.term} (${w.meaning})`
      };
    });

    this.initCurrentTranslationQuestion();
    this.renderStep5Translation();
  }

  initCurrentTranslationQuestion() {
    this.assembledChunks = [];
    this.translationState = 'input';

    const q = this.translationQuestions[this.translationIndex];
    if (!q) return;

    const isJaToVi = this.translationMode === 'ja_to_vi';
    const targetList = isJaToVi ? (q.chunks_vi || []) : (q.chunks_ja || []);

    // Tạo các khối kèm id duy nhất và thứ tự đúng ban đầu
    this.availableChunks = targetList.map((text, idx) => ({
      id: idx,
      text: text.trim(),
      correctIndex: idx
    }));

    // Xáo trộn ngẫu nhiên (Fisher-Yates Shuffle)
    for (let i = this.availableChunks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.availableChunks[i], this.availableChunks[j]] = [this.availableChunks[j], this.availableChunks[i]];
    }
  }

  renderStep5Translation() {
    const body = document.getElementById('mimikaraModalBody');
    if (!body) return;

    if (this.translationIndex >= this.translationQuestions.length) {
      this.renderVictoryScreen();
      return;
    }

    const q = this.translationQuestions[this.translationIndex];
    const isJaToVi = this.translationMode === 'ja_to_vi';

    // Tự động phát âm câu tiếng Nhật khi sang câu mới ở chế độ Dịch Xuôi
    if (isJaToVi) {
      this.speak(q.n2_sentence_ja, 0.9);
    }

    // Highlight từ vựng bài học trong câu nguồn tiếng Nhật
    let sourceTextHtml = '';
    if (isJaToVi) {
      const escapedJa = escapeHtml(q.n2_sentence_ja);
      const escapedTerm = escapeHtml(q.term);
      if (escapedJa.includes(escapedTerm)) {
        sourceTextHtml = escapedJa.replace(
          new RegExp(escapedTerm, 'g'),
          `<span class="trans-target-term" title="Từ vựng bài học">${escapedTerm}</span>`
        );
      } else {
        sourceTextHtml = escapedJa;
      }
    } else {
      sourceTextHtml = escapeHtml(q.n2_sentence_vi);
    }

    // Các khối đã ráp vào khay
    let assembledHtml = '';
    if (this.assembledChunks.length === 0) {
      assembledHtml = `
        <div class="trans-assembly-placeholder">
          <i class="fas fa-hand-pointer" style="color: #c084fc;"></i>
          Chạm vào các khối ngữ nghĩa bên dưới hoặc bấm phím số (1, 2, 3...) để xếp câu dịch...
        </div>
      `;
    } else {
      this.assembledChunks.forEach((chunkId, pos) => {
        const chunk = this.availableChunks.find(c => c.id === chunkId);
        if (!chunk) return;
        assembledHtml += `
          <div class="assembled-chunk-chip" onclick="window.mimikaraService.unselectChunk(${pos})" title="Chạm để gỡ khối này ra">
            <span class="chunk-order-badge">${pos + 1}</span>
            <span class="chunk-text">${escapeHtml(chunk.text)}</span>
            <i class="fas fa-xmark chunk-remove-icon"></i>
          </div>
        `;
      });
    }

    // Các khối trong kho lựa chọn (Chunk Bank)
    let bankHtml = '';
    this.availableChunks.forEach((chunk, idx) => {
      const isPicked = this.assembledChunks.includes(chunk.id);
      bankHtml += `
        <button type="button" 
                class="btn-chunk-item ${isPicked ? 'picked' : ''}" 
                onclick="window.mimikaraService.selectChunk(${chunk.id})" 
                ${isPicked ? 'disabled' : ''}
                title="Bấm phím ${idx + 1} để chọn nhanh">
          <span class="chunk-item-key">${idx + 1}</span>
          <span class="chunk-item-text">${escapeHtml(chunk.text)}</span>
        </button>
      `;
    });

    const isDoneCorrect = this.translationState === 'correct';

    // Khối giải thích ngữ pháp & Collocation khi hoàn thành chính xác
    let breakdownHtml = '';
    if (isDoneCorrect) {
      breakdownHtml = `
        <div class="translation-breakdown-card">
          <div class="breakdown-header">
            <i class="fas fa-circle-check"></i>
            <span>Chính xác tuyệt đối! Câu dịch chuẩn N2 hoàn chỉnh:</span>
          </div>
          <div class="breakdown-full-text">
            ${escapeHtml(isJaToVi ? q.n2_sentence_vi : q.n2_sentence_ja)}
          </div>
          <div class="breakdown-details-grid">
            <div class="breakdown-detail-col">
              <span class="detail-label"><i class="fas fa-graduation-cap" style="color: #c084fc;"></i> Điểm ngữ pháp N2 trọng tâm:</span>
              <span class="detail-val">${escapeHtml(q.grammar || 'Cấu trúc câu phức N2')}</span>
            </div>
            <div class="breakdown-detail-col">
              <span class="detail-label"><i class="fas fa-link" style="color: #38bdf8;"></i> Cụm từ đi kèm (Collocation):</span>
              <span class="detail-val">${escapeHtml(q.collocation || q.term)}</span>
            </div>
          </div>
        </div>
      `;
    }

    body.innerHTML = `
      ${this.renderStepperHeader()}

      <div class="mimikara-translation-container">
        <div class="mimikara-translation-card">
          <!-- Hàng trên: Bộ đếm, Cần gạt 2 chế độ, Nút nghe phát âm -->
          <div class="mimikara-dictation-toolbar">
            <div class="dictation-toolbar-left">
              <span class="dictation-step-badge">
                <i class="fas fa-language"></i> CÂU ${this.translationIndex + 1} / ${this.translationQuestions.length} (STT #${q.stt})
              </span>

              <!-- Cần gạt 2 chế độ: Dịch Xuôi vs Dịch Ngược -->
              <div class="dictation-mode-toggle">
                <button type="button" class="btn-mode-pill ${isJaToVi ? 'active' : ''}" onclick="window.mimikaraService.toggleTranslationMode('ja_to_vi')" title="Đọc hiểu câu tiếng Nhật ➔ Xếp các khối tiếng Việt">
                  <i class="fas fa-book-open"></i> 🇯🇵 ➔ 🇻🇳 Dịch Xuôi
                </button>
                <button type="button" class="btn-mode-pill ${!isJaToVi ? 'active' : ''}" onclick="window.mimikaraService.toggleTranslationMode('vi_to_ja')" title="Nhìn tiếng Việt ➔ Xếp các khối cụm tiếng Nhật">
                  <i class="fas fa-pen-nib"></i> 🇻🇳 ➔ 🇯🇵 Dịch Ngược
                </button>
              </div>
            </div>

            <!-- Nút nghe phát âm câu -->
            <div class="dictation-toolbar-right">
              <button type="button" class="btn-dictation-speaker" onclick="window.mimikaraService.speak('${escapeJs(q.n2_sentence_ja)}', 0.9)" title="Nghe câu phát âm chuẩn (Phím Space hoặc R)">
                <i class="fas fa-volume-high"></i> <span>Nghe Câu</span>
              </button>
            </div>
          </div>

          <!-- Khối câu nguồn N2 -->
          <div class="trans-source-sentence-box">
            <div class="trans-source-text ${!isJaToVi ? 'vi-mode' : ''}">
              ${sourceTextHtml}
            </div>
            <span class="trans-hint-badge">
              <i class="fas fa-key"></i> Từ vựng bài học: <b>${escapeHtml(q.term)}</b> [ ${escapeHtml(q.han_viet || '')} ] - ${escapeHtml(q.meaning || '')}
            </span>
          </div>

          <!-- Khay ráp câu dịch (Assembly Drop Zone) -->
          <div class="trans-assembly-box">
            <div class="assembly-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-layer-group" style="color: #c084fc;"></i>
                <span>Khay ráp câu dịch:</span>
              </div>
              <span class="assembly-counter">(${this.assembledChunks.length} / ${this.availableChunks.length} khối)</span>
            </div>
            <div id="transAssemblyArea" class="trans-assembly-area ${this.translationState}">
              ${assembledHtml}
            </div>
          </div>

          <!-- Khối phân tích ngữ pháp & Collocation khi đúng -->
          ${breakdownHtml}

          <!-- Kho lựa chọn khối ngữ nghĩa (Chunk Bank) -->
          <div class="trans-bank-box">
            <div class="bank-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-cubes" style="color: #38bdf8;"></i>
                <span>Các khối ngữ nghĩa (Chạm chọn theo thứ tự dịch):</span>
              </div>
            </div>
            <div class="trans-bank-grid">
              ${bankHtml}
            </div>
          </div>

          <!-- Thanh nút thao tác -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08);">
            <div style="display: flex; gap: 10px; align-items: center;">
              <button type="button" class="btn-secondary" onclick="window.mimikaraService.resetTranslationChunks()" style="font-size: 0.95rem; font-weight: 700; padding: 10px 18px; border-radius: 12px;">
                <i class="fas fa-rotate-left"></i> Đặt Lại (Esc)
              </button>
              <button type="button" class="btn-secondary" onclick="window.mimikaraService.revealTranslationHint()" style="font-size: 0.95rem; font-weight: 700; padding: 10px 18px; border-radius: 12px; color: #fde047;">
                <i class="fas fa-lightbulb"></i> Gợi Ý
              </button>
            </div>

            <div>
              ${isDoneCorrect ? `
                <button type="button" class="btn-primary" onclick="window.mimikaraService.nextTranslationQuestion()" style="background: linear-gradient(135deg, #10b981, #059669); padding: 12px 34px; font-size: 1.1rem; font-weight: 800; border-radius: 14px; cursor: pointer; box-shadow: 0 4px 20px rgba(16,185,129,0.5);">
                  Câu Tiếp Theo ➔ (Enter)
                </button>
              ` : `
                <button type="button" class="btn-primary" onclick="window.mimikaraService.checkTranslationAnswer()" style="background: linear-gradient(135deg, #a855f7, #6366f1); padding: 12px 34px; font-size: 1.1rem; font-weight: 800; border-radius: 14px; cursor: pointer; box-shadow: 0 4px 20px rgba(168,85,247,0.4);">
                  Kiểm Tra (Enter)
                </button>
              `}
            </div>
          </div>
        </div>

        <!-- Bảng hướng dẫn phím tắt -->
        <div class="mimikara-shortcuts-guide" style="margin-top: 1rem;">
          <span><span class="mimikara-kbd">Phím 1-9</span> Chọn khối nhanh</span>
          <span><span class="mimikara-kbd">Backspace</span> Gỡ khối cuối</span>
          <span><span class="mimikara-kbd">Enter</span> Kiểm tra / Tiếp tục</span>
          <span><span class="mimikara-kbd">Space / R</span> Nghe câu</span>
        </div>
      </div>
    `;
  }

  selectChunk(chunkId) {
    if (this.translationState === 'correct') return;
    if (this.assembledChunks.includes(chunkId)) return;
    this.assembledChunks.push(chunkId);
    this.translationState = 'input';
    this.renderStep5Translation();
  }

  unselectChunk(pos) {
    if (this.translationState === 'correct') return;
    if (pos >= 0 && pos < this.assembledChunks.length) {
      this.assembledChunks.splice(pos, 1);
      this.translationState = 'input';
      this.renderStep5Translation();
    }
  }

  resetTranslationChunks() {
    if (this.translationState === 'correct') return;
    this.assembledChunks = [];
    this.translationState = 'input';
    this.renderStep5Translation();
  }

  checkTranslationAnswer() {
    if (this.translationState === 'correct') {
      this.nextTranslationQuestion();
      return;
    }

    if (this.assembledChunks.length < this.availableChunks.length) {
      const area = document.getElementById('transAssemblyArea');
      if (area) {
        area.classList.remove('incorrect');
        void area.offsetWidth;
        area.classList.add('incorrect');
      }
      alert("Vui lòng xếp đầy đủ tất cả các khối ngữ nghĩa trước khi kiểm tra!");
      return;
    }

    // Kiểm tra từng vị trí xem có khớp đúng correctIndex
    const isCorrect = this.assembledChunks.every((chunkId, pos) => {
      const chunk = this.availableChunks.find(c => c.id === chunkId);
      return chunk && chunk.correctIndex === pos;
    });

    if (isCorrect) {
      this.translationState = 'correct';
      const q = this.translationQuestions[this.translationIndex];
      this.speak(q.n2_sentence_ja, 0.9);
      this.renderStep5Translation();
    } else {
      this.translationState = 'incorrect';
      const area = document.getElementById('transAssemblyArea');
      if (area) {
        area.classList.remove('incorrect');
        void area.offsetWidth;
        area.classList.add('incorrect');
      }
      this.renderStep5Translation();
    }
  }

  revealTranslationHint() {
    if (this.translationState === 'correct') return;
    const nextCorrectPos = this.assembledChunks.length;
    if (nextCorrectPos < this.availableChunks.length) {
      const nextChunk = this.availableChunks.find(c => c.correctIndex === nextCorrectPos);
      if (nextChunk && !this.assembledChunks.includes(nextChunk.id)) {
        this.assembledChunks.push(nextChunk.id);
        this.renderStep5Translation();
      }
    }
  }

  nextTranslationQuestion() {
    this.translationIndex++;
    if (this.translationIndex >= this.translationQuestions.length) {
      this.startNextActiveStep('translation');
    } else {
      this.initCurrentTranslationQuestion();
      this.renderStep5Translation();
    }
  }

  toggleTranslationMode(mode) {
    this.translationMode = mode;
    try {
      localStorage.setItem('edumanga_mimikara_trans_mode', mode);
    } catch (e) {}
    this.initCurrentTranslationQuestion();
    this.renderStep5Translation();
  }

  // --------------------------------------------------------------------------
  // BƯỚC 6: NINJA LEO THÁP PHẢN XẠ 15 CÀNH (MARATHON SHUFFLE)
  // --------------------------------------------------------------------------
  startStep6Climbing() {
    const body = document.getElementById('mimikaraModalBody');
    if (!body) return;

    if (this.activeClimberGame) {
      this.activeClimberGame.destroy();
      this.activeClimberGame = null;
    }

    body.innerHTML = `
      ${this.renderStepperHeader()}
      <div id="mimikaraClimberContainer" style="width: 100%; display: flex; justify-content: center; padding: 10px 0;"></div>
    `;

    const container = document.getElementById('mimikaraClimberContainer');
    if (container && typeof window.MimikaraClimberGame !== 'undefined') {
      this.activeClimberGame = new window.MimikaraClimberGame(container, {
        mode: 'session',
        words: this.currentChunkWords,
        onVictory: (stats) => {
          this.startNextActiveStep('climbing');
        },
        onRestartStep1: () => {
          this.startFirstActiveStep();
        },
        onExit: () => {
          this.renderUnitChunks(this.currentUnitId);
        }
      });
    }
  }

  // Khởi động chế độ Leo Tháp Vô Tận (Endless Climber) cho toàn Unit
  startEndlessClimbing(unitId) {
    this.currentUnitId = unitId;
    const unit = this.dataset.units.find(u => u.id === unitId);
    if (!unit) return;

    // Tự động bật chế độ toàn màn hình cho leo tháp vô tận
    this.toggleFullscreen(true);

    const body = document.getElementById('mimikaraModalBody');
    if (!body) return;

    if (this.activeClimberGame) {
      this.activeClimberGame.destroy();
      this.activeClimberGame = null;
    }

    body.innerHTML = `
      <div class="mimikara-nav-bar" style="margin-bottom: 12px;">
        <button type="button" class="mimikara-btn-back" onclick="window.mimikaraService.renderUnitChunks(${unitId})">
          <i class="fas fa-arrow-left"></i> Quay lại Unit ${unitId}
        </button>
        <span style="color: #38bdf8; font-weight: 800; font-size: 1rem;">
          🏆 LEO THÁP VÔ TẬN: ${escapeHtml(unit.title)} (${unit.words.length} TỪ)
        </span>
      </div>
      <div id="mimikaraClimberContainer" style="width: 100%; display: flex; justify-content: center;"></div>
    `;

    const container = document.getElementById('mimikaraClimberContainer');
    if (container && typeof window.MimikaraClimberGame !== 'undefined') {
      this.activeClimberGame = new window.MimikaraClimberGame(container, {
        mode: 'endless',
        words: unit.words,
        onVictory: (stats) => {
          alert(`🎉 Chúc mừng! Bạn đã đạt ${stats.score.toLocaleString()} điểm và leo được ${stats.branchesClimbed} cành cây!`);
          this.renderUnitChunks(unitId);
        },
        onRestartStep1: () => {
          this.startEndlessClimbing(unitId);
        },
        onExit: () => {
          this.renderUnitChunks(unitId);
        }
      });
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

    const activeSteps = this.getActiveSteps();
    const activeNames = activeSteps.map(s => `<b>${escapeHtml(s.name)}</b>`).join(' ➔ ');

    body.innerHTML = `
      <div class="mimikara-victory-box">
        <div class="mimikara-victory-icon">🏆</div>
        <h2 class="mimikara-victory-title">XUẤT SẮC! HOÀN THÀNH PHIÊN ${this.currentChunkIndex + 1}!</h2>
        <p class="mimikara-victory-desc">
          Bạn đã hoàn thành trọn vẹn cả ${activeSteps.length} bước: ${activeNames} cho 5 từ vựng vừa rồi!
          <br>
          <span style="color: #34d399; font-weight: 700; font-size: 1.1rem; display: inline-block; margin-top: 0.5rem;">
            +5 Từ Đã Thuộc Lòng & Làm Chủ Ngữ Cảnh N2!
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

// Full & Accurate Romaji to Hiragana Converter Helper
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
    'da':'だ','di':'ぢ','du':'づ','de':'で','do':'ど',
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
