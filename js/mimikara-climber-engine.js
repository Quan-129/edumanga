/**
 * ==========================================================================
 * EDUMANGA HUB - MINIGAME ENGINE: NINJA LEO THÁP PHẢN XẠ (KEYBOARD JUMP)
 * ==========================================================================
 * 
 * Lấy cảm hứng từ game "Keyboard Jump" (gameplay.mp4):
 * - 15 Cành Cây Marathon Shuffle (5 Kanji + 5 Nghĩa tiếng Việt + 5 Audio phát âm)
 * - Gõ Romaji tương ứng để kích hoạt cú nhảy
 * - Vi chuyển động (Micro-interactions):
 *   + Gõ đúng: Ô xanh lá tịnh tiến, nhân vật nhích bước rướn người, mặt cười híp ^ ^
 *   + Gõ sai: Ô đỏ đô cảnh báo, nhân vật khựng lại giật nhẹ, mặt ngơ ngác • _ •
 *   + Nhảy parabol vút lên cành trên, tiếp đất phì khói trắng (dust particles)
 *   + Âm thanh tương tác Web Audio API tổng hợp siêu mượt, không cần tải file ngoài
 * - Hết mạng (0 tim): Lựa chọn "Leo lại tháp" hoặc "Về bước 1 ôn lại"
 * - Chạm đỉnh cành 15: Cắm cờ chiến thắng & hoàn thành phiên học!
 */

class MimikaraClimberGame {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.options = {
      mode: options.mode || 'session', // 'session' (15 branches) hoặc 'endless'
      words: options.words || [],
      onVictory: options.onVictory || (() => {}),
      onRestartStep1: options.onRestartStep1 || (() => {}),
      onExit: options.onExit || (() => {}),
      ...options
    };

    this.canvas = null;
    this.ctx = null;
    this.animationFrameId = null;

    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.lives = 5;
    this.maxLives = 5;
    this.score = 0;
    this.combo = 1;
    this.mistakesOnCurrentBranch = 0;

    // Branches & Progression
    this.branches = [];
    this.currentBranchIndex = 0; // 0 = start branch
    this.totalBranches = 15;

    // Input state
    this.targetRomaji = '';
    this.inputIndex = 0;
    this.lastInputState = 'normal'; // 'normal', 'correct', 'error'
    this.lastInputTime = 0;

    // Camera & Viewport
    this.cameraY = 0;
    this.targetCameraY = 0;
    this.width = 820;
    this.height = 540;

    // Character state
    this.character = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      vx: 0,
      vy: 0,
      isJumping: false,
      jumpProgress: 0,
      jumpStartX: 0,
      jumpStartY: 0,
      facing: 1, // 1: right, -1: left
      leanOffset: 0, // nhích bước khi gõ đúng
      shakeOffset: 0, // giật nhẹ khi gõ sai
      emotion: 'idle', // 'idle', 'happy', 'shocked', 'jumping', 'land'
      emotionTimer: 0,
      landTimer: 0
    };

    // Particles & Floating texts
    this.particles = [];
    this.floatingTexts = [];

    // Web Audio Sound Synthesizer
    this.audioCtx = null;
    this.isMuted = false;

    this.initDOM();
    this.initAudio();
    this.setupBranches();
    this.initEvents();
    this.start();
  }

  // --------------------------------------------------------------------------
  // 1. KHỞI TẠO DOM & CANVAS
  // --------------------------------------------------------------------------
  initDOM() {
    this.container.innerHTML = `
      <div class="mimikara-climber-wrapper" style="position: relative; width: 100%; max-width: 860px; margin: 0 auto; background: #090d16; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.08); font-family: 'Outfit', -apple-system, sans-serif;">
        
        <!-- HUD Header -->
        <div class="climber-hud-top" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(255,255,255,0.08); z-index: 10; position: relative;">
          
          <!-- Left: Lives & Altitude -->
          <div style="display: flex; align-items: center; gap: 16px;">
            <div id="climberLivesBox" style="display: flex; align-items: center; gap: 4px; font-size: 1.15rem; color: #ef4444; filter: drop-shadow(0 0 8px rgba(239,68,68,0.5));">
              ${this.renderHeartsHTML()}
            </div>

            <div style="height: 18px; width: 1px; background: rgba(255,255,255,0.15);"></div>

            <div style="display: flex; align-items: center; gap: 8px; color: #38bdf8; font-weight: 700; font-size: 0.9rem;">
              <i class="fas fa-mountain"></i>
              <span id="climberAltitudeText">Cành 0 / ${this.options.mode === 'session' ? '15' : '∞'}</span>
            </div>
          </div>

          <!-- Center: Target Word Hint Banner -->
          <div id="climberCurrentHint" style="background: rgba(30, 41, 59, 0.9); padding: 5px 18px; border-radius: 20px; border: 1px solid rgba(168,85,247,0.3); color: #f8fafc; font-size: 0.88rem; font-weight: 700; display: flex; align-items: center; gap: 8px; box-shadow: 0 0 15px rgba(168,85,247,0.2);">
            <span>Đang chuẩn bị...</span>
          </div>

          <!-- Right: Score & Audio controls -->
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="font-size: 0.95rem; color: #fbbf24; font-weight: 800; letter-spacing: 0.5px;">
              Score: <span id="climberScoreText">0</span>
            </div>

            <button type="button" id="climberBtnAudio" class="climber-icon-btn" title="Nghe lại phát âm (Phím Space)" style="background: rgba(6,182,212,0.2); border: 1px solid rgba(6,182,212,0.4); color: #22d3ee; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
              <i class="fas fa-volume-up"></i>
            </button>

            <button type="button" id="climberBtnExit" class="climber-icon-btn" title="Dừng minigame" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Canvas Game Arena -->
        <div class="mimikara-climber-arena" style="position: relative; width: 100%; height: 520px; background: linear-gradient(to bottom, #0f172a 0%, #1e1b4b 60%, #0f172a 100%); display: flex; align-items: center; justify-content: center; overflow: hidden;">
          <canvas id="climberCanvas" width="${this.width}" height="${this.height}" style="width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: contain; aspect-ratio: 820 / 540; display: block;"></canvas>
          
          <!-- Virtual Keyboard / Mobile Tip -->
          <div style="position: absolute; bottom: 8px; right: 14px; color: rgba(255,255,255,0.4); font-size: 0.72rem; pointer-events: none;">
            ⌨️ Gõ Romaji trực tiếp • Phím [Space] nghe lại âm
          </div>

          <!-- Hidden Input for mobile touch devices -->
          <input type="text" id="climberHiddenInput" style="position: absolute; opacity: 0; pointer-events: none; left: -9999px;" autocomplete="off" autocapitalize="off" spellcheck="false" />
        </div>

        <!-- Game Over Modal Overlay -->
        <div id="climberGameOverModal" style="display: none; position: absolute; inset: 0; background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(10px); z-index: 100; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px;">
          <div style="font-size: 3.5rem; margin-bottom: 8px; filter: drop-shadow(0 0 20px rgba(239,68,68,0.6));">💔</div>
          <h2 style="color: #f87171; font-size: 1.6rem; font-weight: 800; margin: 0 0 8px 0;">BẠN ĐÃ HẾT MẠNG!</h2>
          <p id="climberGameOverDesc" style="color: #cbd5e1; font-size: 0.95rem; max-width: 440px; margin: 0 0 22px 0; line-height: 1.5;">
            Đừng nản chí! Bạn đã leo được đến cành thứ <b id="climberFailBranchNum" style="color: #38bdf8;">0</b>. Hãy thử lại để hoàn thiện phản xạ!
          </p>

          <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
            <button type="button" id="climberBtnRetry" style="background: linear-gradient(135deg, #10b981, #0284c7); color: #fff; border: none; padding: 12px 26px; border-radius: 12px; font-weight: 800; font-size: 0.92rem; cursor: pointer; box-shadow: 0 4px 16px rgba(16,185,129,0.4); display: flex; align-items: center; gap: 8px; transition: transform 0.15s;">
              <i class="fas fa-redo"></i> Leo Lại Tháp (Hồi 5 Tim)
            </button>

            <button type="button" id="climberBtnBackStep1" style="background: rgba(51, 65, 85, 0.8); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); padding: 12px 22px; border-radius: 12px; font-weight: 700; font-size: 0.92rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s;">
              <i class="fas fa-undo"></i> Về Bước 1 Ôn Lại
            </button>
          </div>
        </div>

      </div>
    `;

    this.canvas = document.getElementById('climberCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.hiddenInput = document.getElementById('climberHiddenInput');

    // Nút audio replay
    document.getElementById('climberBtnAudio').addEventListener('click', () => this.replayCurrentAudio());
    // Nút thoát
    document.getElementById('climberBtnExit').addEventListener('click', () => this.options.onExit());
    // Nút retry
    document.getElementById('climberBtnRetry').addEventListener('click', () => this.restartGame());
    // Nút về bước 1
    document.getElementById('climberBtnBackStep1').addEventListener('click', () => this.options.onRestartStep1());
  }

  renderHeartsHTML() {
    let html = '';
    for (let i = 0; i < this.maxLives; i++) {
      if (i < this.lives) {
        html += '<i class="fas fa-heart"></i>';
      } else {
        html += '<i class="far fa-heart" style="color: rgba(255,255,255,0.2);"></i>';
      }
    }
    return html;
  }

  updateHUD() {
    const livesBox = document.getElementById('climberLivesBox');
    if (livesBox) livesBox.innerHTML = this.renderHeartsHTML();

    const altText = document.getElementById('climberAltitudeText');
    if (altText) {
      altText.textContent = `Cành ${this.currentBranchIndex} / ${this.options.mode === 'session' ? '15' : '∞'}`;
    }

    const scoreText = document.getElementById('climberScoreText');
    if (scoreText) scoreText.textContent = this.score.toLocaleString();

    const hintBox = document.getElementById('climberCurrentHint');
    if (hintBox) {
      const nextBranch = this.branches[this.currentBranchIndex + 1];
      if (nextBranch) {
        if (nextBranch.type === 'kanji') {
          hintBox.innerHTML = `Mục tiêu: <span style="color: #c084fc;">⛩️ Kanji:</span> <span style="color: #fff; font-weight: 800; font-size: 1.15rem; margin-left: 4px;">${nextBranch.display}</span>`;
        } else if (nextBranch.type === 'meaning') {
          hintBox.innerHTML = `Mục tiêu: <span style="color: #f59e0b;">💡 Nghĩa:</span> <span style="color: #fff; font-weight: 800; margin-left: 4px;">${nextBranch.display}</span>`;
        } else {
          // Audio: TUYỆT ĐỐI KHÔNG HIỆN CHỮ KANJI HAY ĐÁP ÁN!
          hintBox.innerHTML = `Mục tiêu: <span style="color: #06b6d4;">🔊 Nghe âm thanh</span> <span style="color: #94a3b8; font-size: 0.8rem; margin-left: 6px;">[Phím Space nghe lại]</span>`;
        }
      } else if (this.currentBranchIndex >= this.totalBranches) {
        hintBox.innerHTML = `<span style="color: #34d399; font-weight: 800;">🏆 ĐÃ CHẠM ĐỈNH THÁP!</span>`;
      }
    }
  }

  // --------------------------------------------------------------------------
  // 2. KHỞI TẠO ÂM THANH BẰNG WEB AUDIO API (OFFLINE, ZERO LAG)
  // --------------------------------------------------------------------------
  initAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  playBeep(freq = 440, type = 'sine', duration = 0.08, gain = 0.15) {
    if (this.isMuted || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gainNode.gain.setValueAtTime(gain, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {}
  }

  playKeyCorrectSound() {
    this.playBeep(650 + (this.inputIndex * 40), 'sine', 0.05, 0.12);
  }

  playKeyWrongSound() {
    this.playBeep(180, 'sawtooth', 0.12, 0.18);
  }

  playJumpSound() {
    if (this.isMuted || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(620, this.audioCtx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);
      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.25);
    } catch (e) {}
  }

  playLandSound() {
    this.playBeep(120, 'triangle', 0.1, 0.2);
  }

  playVictoryFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playBeep(freq, 'sine', 0.25, 0.2);
      }, idx * 100);
    });
  }

  speakJapanese(text) {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }

  replayCurrentAudio() {
    const nextBranch = this.branches[this.currentBranchIndex + 1];
    if (nextBranch) {
      this.speakJapanese(nextBranch.word.reading || nextBranch.word.term);
      this.addFloatingText(this.character.x, this.character.y - 45, '🔊 Đang phát...', '#38bdf8');
    }
  }

  // --------------------------------------------------------------------------
  // 3. THIẾT LẬP 15 CÀNH CÂY MARATHON SHUFFLE
  // --------------------------------------------------------------------------
  setupBranches() {
    this.branches = [];
    const words = this.options.words && this.options.words.length > 0 ? this.options.words : [
      { stt: 1, term: '人生', reading: 'じんせい', romaji: 'jinsei', meaning: 'cuộc đời, nhân sinh' },
      { stt: 2, term: '人間', reading: 'にんげん', romaji: 'ningen', meaning: 'con người, loài người' },
      { stt: 3, term: '人', reading: 'ひと', romaji: 'hito', meaning: 'người' },
      { stt: 4, term: '祖先', reading: 'そせん', romaji: 'sosen', meaning: 'tổ tiên' },
      { stt: 5, term: '親戚', reading: 'しんせき', romaji: 'shinseki', meaning: 'họ hàng' }
    ];

    // Cành 0: Vạch xuất phát
    const startBranch = {
      index: 0,
      x: this.width / 2,
      y: this.height - 90,
      width: 220,
      type: 'start',
      display: 'XUẤT PHÁT',
      targetRomaji: '',
      word: null,
      isCompleted: true
    };
    this.branches.push(startBranch);

    // Tạo danh sách 15 thử thách: mỗi từ có 3 dạng (Kanji, Nghĩa, Audio)
    let challenges = [];
    words.forEach(w => {
      const cleanRomaji = (w.romaji || '').toLowerCase().replace(/[^a-z]/g, '');
      challenges.push({ word: w, type: 'kanji', display: w.term, targetRomaji: cleanRomaji, label: 'Chữ Hán' });
      challenges.push({ word: w, type: 'meaning', display: this.shortenMeaning(w.meaning), targetRomaji: cleanRomaji, label: 'Ý Nghĩa' });
      // Với Audio: chỉ để icon Loa 🔊, tuyệt đối không đính kèm w.term để giữ tính bất ngờ thử thách!
      challenges.push({ word: w, type: 'audio', display: '🔊', targetRomaji: cleanRomaji, label: 'Nghe Âm' });
    });

    // Thuật toán xáo trộn thông minh (Smart Shuffle): không có 2 từ liên tiếp trùng nhau
    challenges = this.smartShuffleChallenges(challenges);

    // Tọa độ cành cây xen kẽ zigzag
    // Vị trí X chia thành 3 cột: Trái (220), Giữa (410), Phải (600)
    const xPositions = [210, 590, 390, 230, 580, 400, 220, 600, 380, 210, 590, 410, 220, 580, 410];
    const verticalGap = 120; // khoảng cách giữa các cành

    for (let i = 0; i < challenges.length; i++) {
      const c = challenges[i];
      const branchIndex = i + 1;
      const x = xPositions[i % xPositions.length] + (Math.random() * 30 - 15);
      const y = startBranch.y - (branchIndex * verticalGap);

      this.branches.push({
        index: branchIndex,
        x: x,
        y: y,
        width: Math.max(180, c.targetRomaji.length * 18 + 70),
        type: c.type,
        display: c.display,
        targetRomaji: c.targetRomaji,
        word: c.word,
        isCompleted: false
      });
    }

    this.totalBranches = challenges.length; // 15
    this.currentBranchIndex = 0;
    this.setNextTarget();

    // Vị trí nhân vật khởi đầu đứng trên cành 0
    this.character.x = startBranch.x;
    this.character.y = startBranch.y - 30;
    this.character.targetX = this.character.x;
    this.character.targetY = this.character.y;
    this.cameraY = 0;
    this.targetCameraY = 0;
  }

  shortenMeaning(str) {
    if (!str) return '';
    const first = str.split(/[,;\/]/)[0].trim();
    return first.length > 15 ? first.slice(0, 14) + '…' : first;
  }

  smartShuffleChallenges(list) {
    let arr = [...list];
    // Fisher-Yates
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    // Đảm bảo không trùng từ liền kề
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i].word.stt === arr[i + 1].word.stt) {
        for (let j = i + 2; j < arr.length; j++) {
          if (arr[j].word.stt !== arr[i].word.stt && (j === arr.length - 1 || arr[j].word.stt !== arr[j + 1].word.stt)) {
            [arr[i + 1], arr[j]] = [arr[j], arr[i + 1]];
            break;
          }
        }
      }
    }
    return arr;
  }

  setNextTarget() {
    const nextBranch = this.branches[this.currentBranchIndex + 1];
    if (nextBranch) {
      this.targetRomaji = nextBranch.targetRomaji;
      this.inputIndex = 0;
      this.mistakesOnCurrentBranch = 0;
      this.lastInputState = 'normal';

      // Nếu là cành Audio, tự động phát giọng đọc ngay khi đến lượt!
      if (nextBranch.type === 'audio') {
        setTimeout(() => {
          this.speakJapanese(nextBranch.word.reading || nextBranch.word.term);
        }, 350);
      }
    } else {
      this.targetRomaji = '';
    }
    this.updateHUD();
  }

  // --------------------------------------------------------------------------
  // 4. BẮT SỰ KIỆN BÀN PHÍM & XỬ LÝ GÕ
  // --------------------------------------------------------------------------
  initEvents() {
    this.boundKeyDown = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.boundKeyDown);

    // Kích hoạt hidden input khi click vào canvas
    this.canvas.addEventListener('click', () => {
      if (this.hiddenInput) this.hiddenInput.focus();
    });

    if (this.hiddenInput) {
      this.hiddenInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val) {
          const char = val[val.length - 1].toLowerCase();
          this.processCharInput(char);
          e.target.value = '';
        }
      });
    }
  }

  handleKeyDown(e) {
    if (!this.isRunning || this.isPaused || this.character.isJumping) return;

    // Phím nghe lại Audio: Chỉ dùng 'Space' (loại bỏ phím R để tránh xung đột với chữ cái Romaji 'r')
    if (e.code === 'Space' && this.targetRomaji) {
      e.preventDefault();
      this.replayCurrentAudio();
      return;
    }

    // Chỉ nhận ký tự chữ cái a-z
    if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) {
      e.preventDefault();
      this.processCharInput(e.key.toLowerCase());
    }
  }

  processCharInput(char) {
    if (!this.targetRomaji || this.character.isJumping) return;

    const expectedChar = this.targetRomaji[this.inputIndex];

    if (char === expectedChar) {
      // GÕ ĐÚNG:
      this.inputIndex++;
      this.lastInputState = 'correct';
      this.lastWrongChar = null;
      this.playKeyCorrectSound();

      // Vi chuyển động: Nhích một bước về phía cành cây + mặt cười híp ^ ^
      const nextBranch = this.branches[this.currentBranchIndex + 1];
      const dir = (nextBranch && nextBranch.x > this.character.x) ? 1 : -1;
      this.character.facing = dir;
      this.character.leanOffset = dir * 9;
      this.character.emotion = 'happy';
      this.character.emotionTimer = 18; // duy trì biểu cảm cười 18 frames

      // Kiểm tra đã gõ xong toàn bộ từ chưa
      if (this.inputIndex >= this.targetRomaji.length) {
        this.triggerJumpToNextBranch();
      }
    } else {
      // GÕ SAI:
      this.lastInputState = 'error';
      this.lastWrongChar = char;
      this.playKeyWrongSound();

      // Vi chuyển động: Khựng lại giật nhẹ + mặt hoảng hốt • _ •
      this.character.shakeOffset = (Math.random() > 0.5 ? 1 : -1) * 8;
      this.character.leanOffset = 0;
      this.character.emotion = 'shocked';
      this.character.emotionTimer = 24;

      this.mistakesOnCurrentBranch++;
      this.combo = 1; // reset combo khi gõ sai

      // Gõ sai 3 lần trên 1 cành thì trừ 1 tim!
      if (this.mistakesOnCurrentBranch % 3 === 0) {
        this.lives = Math.max(0, this.lives - 1);
        this.updateHUD();
        this.addFloatingText(this.character.x, this.character.y - 50, '-1 ❤️', '#ef4444');

        if (this.lives <= 0) {
          this.triggerGameOver();
        }
      }
    }
  }

  triggerJumpToNextBranch() {
    const nextBranch = this.branches[this.currentBranchIndex + 1];
    if (!nextBranch) return;

    this.character.isJumping = true;
    this.character.jumpProgress = 0;
    this.character.jumpStartX = this.character.x;
    this.character.jumpStartY = this.character.y;
    this.character.targetX = nextBranch.x;
    this.character.targetY = nextBranch.y - 30;
    this.character.emotion = 'jumping';

    this.playJumpSound();

    // Tính điểm thưởng combo
    const baseScore = 312;
    const bonus = baseScore * Math.min(5, this.combo + 1);
    this.score += bonus;
    this.combo = Math.min(5, this.combo + 1);

    this.addFloatingText(nextBranch.x, nextBranch.y - 60, `+${bonus}`, '#fbbf24');
  }

  onLandBranch() {
    this.character.isJumping = false;
    this.currentBranchIndex++;
    const curBranch = this.branches[this.currentBranchIndex];
    if (curBranch) curBranch.isCompleted = true;

    this.playLandSound();

    // Tạo 10 hạt khói mây trắng phì ra hai bên (Dust Clouds)
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 0.8) + (Math.random() * Math.PI * 0.4);
      const speed = 1.2 + Math.random() * 2.8;
      this.particles.push({
        x: this.character.x + (Math.random() * 20 - 10),
        y: this.character.y + 26,
        vx: Math.cos(angle) * speed * (i % 2 === 0 ? 1 : -1),
        vy: -Math.abs(Math.sin(angle) * speed) * 0.7,
        size: 8 + Math.random() * 12,
        alpha: 0.85,
        life: 28
      });
    }

    // Biểu cảm tiếp đất nhẹ nhõm
    this.character.emotion = 'happy';
    this.character.emotionTimer = 16;
    this.character.landTimer = 8; // squash effect

    // Kiểm tra chiến thắng (chạm cành 15)
    if (this.currentBranchIndex >= this.totalBranches) {
      this.triggerVictory();
    } else {
      this.setNextTarget();
    }
  }

  // --------------------------------------------------------------------------
  // 5. CHIẾN THẮNG & GAME OVER
  // --------------------------------------------------------------------------
  triggerVictory() {
    this.isRunning = false;
    this.playVictoryFanfare();

    // Bắn pháo hoa giấy Confetti rực rỡ
    for (let i = 0; i < 60; i++) {
      const colors = ['#f43f5e', '#3b82f6', '#10b981', '#fbbf24', '#a855f7', '#06b6d4'];
      this.particles.push({
        x: this.character.x,
        y: this.character.y,
        vx: (Math.random() - 0.5) * 9,
        vy: -4 - Math.random() * 7,
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 80,
        isConfetti: true
      });
    }

    setTimeout(() => {
      this.options.onVictory({
        score: this.score,
        branchesClimbed: this.currentBranchIndex
      });
    }, 1200);
  }

  triggerGameOver() {
    this.isRunning = false;
    const modal = document.getElementById('climberGameOverModal');
    const failNum = document.getElementById('climberFailBranchNum');
    if (failNum) failNum.textContent = this.currentBranchIndex;
    if (modal) modal.style.display = 'flex';
  }

  restartGame() {
    const modal = document.getElementById('climberGameOverModal');
    if (modal) modal.style.display = 'none';

    this.lives = this.maxLives;
    this.score = 0;
    this.combo = 1;
    this.setupBranches();
    this.isRunning = true;
    this.updateHUD();
  }

  // --------------------------------------------------------------------------
  // 6. MAIN GAME LOOP (60 FPS CANVAS RENDERER)
  // --------------------------------------------------------------------------
  start() {
    this.isRunning = true;
    const loop = () => {
      if (this.isRunning) {
        this.update();
        this.render();
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  destroy() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.boundKeyDown) {
      window.removeEventListener('keydown', this.boundKeyDown);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  update() {
    // 1. Camera Smooth Lerp Follow
    // Luôn giữ nhân vật ở khoảng 65% chiều cao khung nhìn
    this.targetCameraY = -this.character.y + (this.height * 0.65);
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.08;

    // 2. Cập nhật nhảy Parabol của nhân vật
    if (this.character.isJumping) {
      this.character.jumpProgress += 0.045; // tốc độ nhảy
      if (this.character.jumpProgress >= 1) {
        this.character.jumpProgress = 1;
        this.character.x = this.character.targetX;
        this.character.y = this.character.targetY;
        this.onLandBranch();
      } else {
        const t = this.character.jumpProgress;
        // Quỹ đạo X tuyến tính
        this.character.x = this.character.jumpStartX + (this.character.targetX - this.character.jumpStartX) * t;
        // Quỹ đạo Y parabol uốn cong lên
        const straightY = this.character.jumpStartY + (this.character.targetY - this.character.jumpStartY) * t;
        const arcHeight = 70; // độ vồng của cú nhảy
        const arcOffset = 4 * arcHeight * t * (1 - t);
        this.character.y = straightY - arcOffset;
      }
    } else {
      // Hồi vị trí rướn / giật
      this.character.leanOffset *= 0.85;
      this.character.shakeOffset *= 0.8;
    }

    // 3. Biểu cảm nhân vật
    if (this.character.emotionTimer > 0) {
      this.character.emotionTimer--;
      if (this.character.emotionTimer === 0 && !this.character.isJumping) {
        this.character.emotion = 'idle';
      }
    }
    if (this.character.landTimer > 0) {
      this.character.landTimer--;
    }

    // 4. Hạt mây khói & Confetti
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.alpha = p.life / 28;
      if (p.isConfetti) {
        p.vy += 0.18; // trọng lực confetti
        p.alpha = p.life / 80;
      } else {
        p.size *= 1.02; // khói nở ra
      }
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 5. Chữ số bay nổi
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      ft.alpha = ft.life / 40;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  addFloatingText(x, y, text, color = '#fbbf24') {
    this.floatingTexts.push({
      x: x,
      y: y,
      vy: -1.2,
      text: text,
      color: color,
      alpha: 1,
      life: 40
    });
  }

  // --------------------------------------------------------------------------
  // 7. RENDER ĐỒ HỌA (CANVAS 2D)
  // --------------------------------------------------------------------------
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Lưu trạng thái trước khi cuộn camera
    ctx.save();
    ctx.translate(0, this.cameraY);

    // 1. Vẽ các cành cây
    this.renderBranches(ctx);

    // 2. Vẽ các hạt mây khói & Confetti
    this.renderParticles(ctx);

    // 3. Vẽ nhân vật Chibi
    this.renderCharacter(ctx);

    // 4. Vẽ các chữ số bay nổi
    this.renderFloatingTexts(ctx);

    ctx.restore();
  }

  renderBranches(ctx) {
    this.branches.forEach(b => {
      const isTarget = b.index === this.currentBranchIndex + 1;
      const isPast = b.index <= this.currentBranchIndex;

      // 1. Thân cành cây gỗ thông
      ctx.save();
      const branchColor = isPast ? '#475569' : '#854d0e';
      const barkColor = isPast ? '#334155' : '#713f12';

      // Cành gỗ chính
      ctx.fillStyle = branchColor;
      this.roundRect(ctx, b.x - b.width / 2, b.y, b.width, 16, 8);
      ctx.fill();

      // Vệt vân vỏ cây
      ctx.fillStyle = barkColor;
      ctx.fillRect(b.x - b.width / 2 + 15, b.y + 4, b.width - 30, 4);

      // Mảng tuyết / lá thông trên cành
      ctx.fillStyle = '#e2e8f0';
      this.roundRect(ctx, b.x - b.width / 2 + 8, b.y - 3, b.width * 0.4, 5, 2);
      ctx.fill();

      // Nhánh lá thông kim xanh rủ xuống
      ctx.fillStyle = '#15803d';
      for (let j = -2; j <= 2; j++) {
        ctx.beginPath();
        ctx.moveTo(b.x + j * 35, b.y + 16);
        ctx.lineTo(b.x + j * 35 - 8, b.y + 26);
        ctx.lineTo(b.x + j * 35 + 8, b.y + 26);
        ctx.closePath();
        ctx.fill();
      }

      // 2. Thẻ hiển thị từ vựng & Romaji trên cành
      if (b.type !== 'start') {
        const cardY = b.y - 48;
        const cardH = 38;
        const cardW = b.width - 20;

        // Viền phát sáng cho cành mục tiêu tiếp theo
        if (isTarget) {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 16;
        }

        // Nền thẻ theo loại thử thách
        let cardBg = 'rgba(30, 41, 59, 0.9)';
        let badgeText = '';
        let badgeColor = '#94a3b8';

        if (b.type === 'kanji') {
          badgeText = '⛩️ KANJI';
          badgeColor = '#c084fc';
        } else if (b.type === 'meaning') {
          badgeText = '💡 NGHĨA';
          badgeColor = '#fbbf24';
        } else if (b.type === 'audio') {
          badgeText = '🔊 NGHE';
          badgeColor = '#22d3ee';
        }

        ctx.fillStyle = cardBg;
        this.roundRect(ctx, b.x - cardW / 2, cardY, cardW, cardH, 8);
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow

        // Viền thẻ
        ctx.strokeStyle = isTarget ? '#38bdf8' : 'rgba(255,255,255,0.12)';
        ctx.lineWidth = isTarget ? 2 : 1;
        ctx.stroke();

        // Huy hiệu loại thử thách nhỏ ở góc
        ctx.fillStyle = badgeColor;
        ctx.font = '700 9px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(badgeText, b.x - cardW / 2 + 8, cardY + 12);

        // Nội dung câu hỏi (Kanji / Nghĩa / Audio)
        if (b.type === 'audio') {
          // Với Audio: CHỈ HIỆN ICON LOA, TUYỆT ĐỐI KHÔNG HIỆN CHỮ KANJI HAY TỪ
          ctx.fillStyle = '#22d3ee';
          ctx.font = '700 22px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🔊', b.x, cardY + 25);
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.font = b.type === 'kanji' ? '800 16px Outfit, sans-serif' : '700 13px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(b.display, b.x, cardY + 24);
        }

        // 3. Hiển thị dãy Romaji với ô Xanh / Đỏ chạy theo từng chữ cái
        if (isTarget) {
          this.renderTargetRomajiBoxes(ctx, b, cardY - 26);
        } else if (!isPast) {
          // Gợi ý độ dài bằng các gạch dưới: _ _ _ _ _
          const underlineHint = Array(b.targetRomaji.length).fill('_').join(' ');
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.font = '800 13px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(underlineHint, b.x, cardY - 6);
        }
      } else {
        // Cành xuất phát
        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏁 VẠCH XUẤT PHÁT', b.x, b.y - 12);
      }

      ctx.restore();
    });
  }

  // Vẽ các ô ký tự Romaji: CHỈ HIỆN KÝ TỰ ĐÃ GÕ ĐÚNG, CÁC Ô CHƯA GÕ CHỈ HIỆN GẠCH DƯỚI _
  renderTargetRomajiBoxes(ctx, branch, y) {
    const romaji = branch.targetRomaji;
    const boxSize = 22;
    const spacing = 4;
    const totalW = romaji.length * (boxSize + spacing) - spacing;
    const startX = branch.x - totalW / 2;

    for (let i = 0; i < romaji.length; i++) {
      const char = romaji[i];
      const bx = startX + i * (boxSize + spacing);

      let boxBg = 'rgba(15, 23, 42, 0.7)';
      let textColor = 'rgba(255, 255, 255, 0.35)';
      let borderColor = 'rgba(255,255,255,0.15)';
      let textToRender = '_'; // Mặc định chỉ hiển thị gạch dưới để biết số ký tự

      if (i < this.inputIndex) {
        // ĐÃ GÕ ĐÚNG: Hiện ô màu xanh lá cây rực rỡ + CHỮ CÁI ĐÃ GÕ
        boxBg = '#16a34a';
        textColor = '#ffffff';
        borderColor = '#22c55e';
        textToRender = char;
      } else if (i === this.inputIndex) {
        // KÝ TỰ ĐANG CHỜ GÕ:
        if (this.lastInputState === 'error') {
          // Gõ sai: Khối hộp màu ĐỎ ĐÔ cảnh báo + hiển thị ký tự vừa gõ sai
          boxBg = '#b91c1c';
          textColor = '#ffffff';
          borderColor = '#ef4444';
          textToRender = this.lastWrongChar ? this.lastWrongChar.toUpperCase() : '✗';
        } else {
          // Con trỏ đang chờ: Viền xanh dương nhấp nháy, hiện gạch dưới _
          boxBg = 'rgba(2, 132, 199, 0.35)';
          textColor = '#38bdf8';
          borderColor = '#38bdf8';
          textToRender = '_';
        }
      } else {
        // CHƯA GÕ: Chỉ là ô mờ với dấu gạch dưới _
        textToRender = '_';
      }

      // Vẽ ô vuông
      ctx.fillStyle = boxBg;
      this.roundRect(ctx, bx, y, boxSize, boxSize, 4);
      ctx.fill();

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = (i === this.inputIndex) ? 2 : 1;
      ctx.stroke();

      // Vẽ chữ cái hoặc dấu gạch dưới
      ctx.fillStyle = textColor;
      ctx.font = '800 13px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(textToRender, bx + boxSize / 2, y + boxSize / 2 + 1);
    }
  }

  // --------------------------------------------------------------------------
  // 8. VẼ NHÂN VẬT ROBOT / CHIBI VỚI BIỂU CẢM
  // --------------------------------------------------------------------------
  renderCharacter(ctx) {
    const c = this.character;
    const px = c.x + c.leanOffset + c.shakeOffset;
    let py = c.y;

    // Hiệu ứng nhún khi tiếp đất
    let scaleY = 1;
    let scaleX = 1;
    if (c.landTimer > 0) {
      scaleY = 0.82;
      scaleX = 1.18;
      py += 4;
    }

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(scaleX * c.facing, scaleY);

    // 1. Chân & Bàn chân
    ctx.fillStyle = '#1e3a8a';
    if (c.isJumping) {
      // Chân co lên khi nhảy
      ctx.fillRect(-8, 12, 5, 8);
      ctx.fillRect(3, 14, 5, 6);
    } else {
      // Chân đứng / nhích bước
      const stepShift = (c.leanOffset !== 0) ? 3 : 0;
      ctx.fillRect(-7 - stepShift, 12, 5, 10);
      ctx.fillRect(2 + stepShift, 12, 5, 10);
    }

    // 2. Thân mình (Body)
    ctx.fillStyle = '#2563eb';
    this.roundRect(ctx, -12, -4, 24, 20, 6);
    ctx.fill();

    // Hai tay (Arms)
    ctx.fillStyle = '#1d4ed8';
    if (c.isJumping) {
      // Tay giang ra khi bay
      ctx.fillRect(-17, -2, 6, 12);
      ctx.fillRect(11, -2, 6, 12);
    } else {
      ctx.fillRect(-15, 0, 4, 12);
      ctx.fillRect(11, 0, 4, 12);
    }

    // 3. Đầu Monitor / TV Screen
    ctx.fillStyle = '#60a5fa';
    this.roundRect(ctx, -18, -26, 36, 24, 8);
    ctx.fill();

    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Màn hình hiển thị gương mặt
    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, -14, -23, 28, 18, 5);
    ctx.fill();

    // 4. Biểu cảm gương mặt (Emotions)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';

    if (c.emotion === 'happy') {
      // MẮT HÍP CƯỜI TÍT ^ ^ (khi gõ đúng hoặc tiếp đất)
      // Mắt trái ^
      ctx.beginPath();
      ctx.moveTo(-9, -13);
      ctx.lineTo(-6, -16);
      ctx.lineTo(-3, -13);
      ctx.stroke();

      // Mắt phải ^
      ctx.beginPath();
      ctx.moveTo(3, -13);
      ctx.lineTo(6, -16);
      ctx.lineTo(9, -13);
      ctx.stroke();

      // Miệng cười
      ctx.beginPath();
      ctx.arc(0, -11, 3, 0, Math.PI);
      ctx.stroke();

    } else if (c.emotion === 'shocked') {
      // MẮT TRÒN XOE HOẢNG HỐT • _ • (khi gõ sai phím)
      ctx.beginPath();
      ctx.arc(-6, -14, 2.8, 0, Math.PI * 2);
      ctx.arc(6, -14, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Miệng ngang đờ
      ctx.beginPath();
      ctx.moveTo(-3, -9);
      ctx.lineTo(3, -9);
      ctx.stroke();

      // Giọt mồ hôi lo lắng 💧
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(14, -22, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (c.emotion === 'jumping') {
      // MẶT TẬP TRUNG CAO ĐỘ (khi đang bay)
      ctx.beginPath();
      ctx.arc(-6, -14, 2.2, 0, Math.PI * 2);
      ctx.arc(6, -14, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, -9, 2.5, 0, Math.PI * 2);
      ctx.stroke();

    } else {
      // BÌNH THƯỜNG (Idle)
      ctx.beginPath();
      ctx.arc(-6, -14, 2.2, 0, Math.PI * 2);
      ctx.arc(6, -14, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, -10, 2, 0, Math.PI);
      ctx.stroke();
    }

    // 5. Mầm cây nhỏ nhú trên đầu
    ctx.fillStyle = '#b45309'; // chậu đất nhỏ
    ctx.fillRect(-5, -29, 10, 4);

    ctx.fillStyle = '#22c55e'; // mầm lá xanh
    ctx.beginPath();
    ctx.ellipse(0, -33, 4, 7, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderParticles(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color || '#f1f5f9';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  renderFloatingTexts(ctx) {
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = '800 16px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// Gán vào window toàn cục để truy cập dễ dàng
if (typeof window !== 'undefined') {
  window.MimikaraClimberGame = MimikaraClimberGame;
}
