/* ==========================================================================
   EDUMANGA HUB - STUDY NOTEBOOK ENGINE (SPLIT-SCREEN WORKSPACE)
   Handwriting Canvas, Stylus Tablet Support, Rich Notes & Chapter Persistence
   ========================================================================== */

let notebookState = {
  isOpen: false,
  side: 'right', // 'right' | 'left'
  layoutMode: 'split-right', // 'split-right' | 'split-left' | 'focus-manga' | 'focus-notebook'
  mode: 'draw', // 'draw' | 'text' | 'cards'
  tool: 'pen', // 'pen' | 'highlighter' | 'eraser'
  color: '#ffffff',
  size: 3,
  pattern: 'grid', // 'grid' | 'lines' | 'blank'
  isDrawing: false,
  undoStack: [],
  redoStack: [],
  maxUndo: 25,
  hasUnsavedDraw: false
};

let notebookCanvas = null;
let notebookCtx = null;
let notebookTextarea = null;
let lastPointerPos = { x: 0, y: 0 };
let notebookStorageKey = '';

let currentNotebookWidth = 480;

document.addEventListener('DOMContentLoaded', () => {
  // Clear any existing split-view classes since notebook is temporarily disabled
  document.body.classList.remove('split-notebook-active', 'layout-focus-notebook', 'notebook-side-left');
  initNotebookEngine();
});

function initNotebookEngine() {
  // Feature temporarily disabled for upgrade
  document.body.classList.remove('split-notebook-active', 'layout-focus-notebook');
  notebookCanvas = document.getElementById('notebookCanvas');
  notebookTextarea = document.getElementById('notebookTextarea');

  if (!notebookCanvas) return;

  notebookCtx = notebookCanvas.getContext('2d', { willReadFrequently: true });

  // 1. Load saved Handedness Side (Left / Right) & Setup Splitter Resizer
  const savedSide = localStorage.getItem('edumanga_notebook_side') || 'right';
  swapNotebookSide(savedSide, false);

  initNotebookResizer();

  // 2. Setup Canvas Resolution & Resize Observer
  setupCanvasDimensions();
  window.addEventListener('resize', handleCanvasResizeDebounced);

  // 3. Setup Pointer / Touch / Stylus Drawing Listeners
  initDrawingEvents();

  // 4. Setup Textarea Auto-save
  if (notebookTextarea) {
    notebookTextarea.addEventListener('input', () => {
      saveNotebookTextDebounced();
      updateNotebookStatus('Đang lưu...');
    });
  }

  // 5. Setup Color and Stroke Size Click Handlers
  initPaletteAndStrokeHandlers();

  // 6. Load saved notes when chapter loads
  const urlParams = new URLSearchParams(window.location.search);
  const seriesId = urlParams.get('series') || 'tieng-nhat-n2';
  const chapId = urlParams.get('chap') || 'chap-01';
  loadChapterNotebook(seriesId, chapId);
}

let resizeReadingAnchor = null;

function captureReadingAnchor() {
  const viewportY = window.innerHeight / 2;
  const pageWrappers = Array.from(document.querySelectorAll('.reader-page-wrapper'));
  
  for (let i = 0; i < pageWrappers.length; i++) {
    const el = pageWrappers[i];
    const rect = el.getBoundingClientRect();
    if (rect.top <= viewportY && rect.bottom >= viewportY) {
      const height = Math.max(1, rect.height);
      const ratioInEl = Math.max(0, Math.min(1, (viewportY - rect.top) / height));
      return {
        el,
        ratioInEl,
        anchorViewportY: viewportY
      };
    }
  }

  if (pageWrappers.length > 0) {
    for (let i = 0; i < pageWrappers.length; i++) {
      const el = pageWrappers[i];
      const rect = el.getBoundingClientRect();
      if (rect.bottom > 60 && rect.top < window.innerHeight) {
        return {
          el,
          ratioInEl: 0,
          anchorViewportY: Math.max(60, rect.top)
        };
      }
    }
    return {
      el: pageWrappers[0],
      ratioInEl: 0,
      anchorViewportY: 60
    };
  }
  return null;
}

function syncReadingAnchor(anchor) {
  if (!anchor || !anchor.el) return;
  const rect = anchor.el.getBoundingClientRect();
  const currentTargetY = rect.top + (anchor.ratioInEl * rect.height);
  const diffY = currentTargetY - anchor.anchorViewportY;
  if (Math.abs(diffY) > 0.25) {
    window.scrollBy({ top: diffY, behavior: 'instant' });
  }
}

function initNotebookResizer() {
  const resizer = document.getElementById('notebookResizer');
  
  // Load saved width from localStorage
  const savedWidth = parseInt(localStorage.getItem('edumanga_notebook_width'), 10);
  if (!isNaN(savedWidth) && savedWidth >= 320 && savedWidth <= window.innerWidth - 280) {
    currentNotebookWidth = savedWidth;
  } else {
    currentNotebookWidth = 480;
  }
  document.documentElement.style.setProperty('--notebook-width', `${currentNotebookWidth}px`);

  if (!resizer) return;

  let isDragging = false;
  let startX = 0;
  let startWidth = 0;

  resizer.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    isDragging = true;
    resizer.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startWidth = currentNotebookWidth;
    document.body.classList.add('is-resizing-notebook');
    
    // Lock reading anchor coordinate before layout resize begins
    resizeReadingAnchor = captureReadingAnchor();
  });

  resizer.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const minWidth = 320;
    const maxWidth = Math.max(minWidth, Math.floor(window.innerWidth - 280));
    
    // Adapt drag direction based on whether notebook is on Left or Right
    const isLeft = (notebookState.side === 'left');
    const deltaX = isLeft ? (e.clientX - startX) : (startX - e.clientX);
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
    currentNotebookWidth = newWidth;

    document.documentElement.style.setProperty('--notebook-width', `${newWidth}px`);

    // Synchronously cancel out vertical page height shifts (Zero Scroll Drift)
    if (resizeReadingAnchor) {
      syncReadingAnchor(resizeReadingAnchor);
    }

    // Dynamically adjust left manga zoom fit percentage indicator
    if (typeof onNotebookResized === 'function') {
      onNotebookResized(newWidth);
    }
  });

  const stopDragging = (e) => {
    if (isDragging) {
      isDragging = false;
      document.body.classList.remove('is-resizing-notebook');
      if (resizeReadingAnchor) {
        syncReadingAnchor(resizeReadingAnchor);
        resizeReadingAnchor = null;
      }
      localStorage.setItem('edumanga_notebook_width', currentNotebookWidth);
      setupCanvasDimensions();
    }
  };

  resizer.addEventListener('pointerup', stopDragging);
  resizer.addEventListener('pointercancel', stopDragging);

  // Double Click on resizer: Reset to default 480px with anchor lock
  resizer.addEventListener('dblclick', () => {
    const anchor = captureReadingAnchor();
    const defaultWidth = 480;
    currentNotebookWidth = defaultWidth;
    document.documentElement.style.setProperty('--notebook-width', `${defaultWidth}px`);
    if (anchor) {
      syncReadingAnchor(anchor);
    }
    localStorage.setItem('edumanga_notebook_width', defaultWidth);
    if (typeof onNotebookResized === 'function') {
      onNotebookResized(defaultWidth);
    }
    setupCanvasDimensions();
    showToast('📐 Đã đặt lại độ rộng Vở Ghi Chép mặc định (480px)');
  });
}

// Swap Sides Hook: Left-Handed vs Right-Handed Mode
function swapNotebookSide(targetSide = null, notify = true) {
  const anchor = captureReadingAnchor();
  
  if (targetSide) {
    notebookState.side = targetSide;
  } else {
    notebookState.side = (notebookState.side === 'left') ? 'right' : 'left';
  }

  const isLeft = (notebookState.side === 'left');
  document.body.classList.toggle('notebook-side-left', isLeft);
  localStorage.setItem('edumanga_notebook_side', notebookState.side);

  // Sync button icons and tooltips
  const btnSwap = document.getElementById('btnSwapNotebookSide');
  if (btnSwap) {
    btnSwap.classList.toggle('active', isLeft);
    btnSwap.title = isLeft 
      ? 'Đang ở chế độ Vở TRÁI (Thuận tay trái) - Nhấp để chuyển Vở sang PHẢI (Alt+S)' 
      : 'Đang ở chế độ Vở PHẢI (Chuẩn) - Nhấp để chuyển Vở sang TRÁI cho người thuận tay trái (Alt+S)';
  }

  // Update layout cards in settings modal
  updateLayoutModeUI();

  // Keep reading anchor locked across the side transition
  if (anchor) {
    let frameCount = 0;
    const animateAnchor = () => {
      syncReadingAnchor(anchor);
      frameCount++;
      if (frameCount < 20) {
        requestAnimationFrame(animateAnchor);
      }
    };
    requestAnimationFrame(animateAnchor);
  }

  if (notify) {
    showToast(isLeft 
      ? '👈 Đã chuyển Vở sang TRÁI (Chế độ Thuận tay trái)' 
      : '👉 Đã chuyển Vở sang PHẢI (Chế độ Chuẩn)'
    );
  }
}

// 4 Layout Modes Switcher
function setLayoutMode(mode) {
  notebookState.layoutMode = mode;
  localStorage.setItem('edumanga_layout_mode', mode);

  if (mode === 'split-right') {
    document.body.classList.remove('layout-focus-notebook');
    swapNotebookSide('right', false);
    if (!notebookState.isOpen) {
      toggleNotebookSplitView();
    }
    showToast('📖|📝 Manga Trái • Vở Phải (Thuận tay phải)');
  } else if (mode === 'split-left') {
    document.body.classList.remove('layout-focus-notebook');
    swapNotebookSide('left', false);
    if (!notebookState.isOpen) {
      toggleNotebookSplitView();
    }
    showToast('📝|📖 Vở Trái • Manga Phải (Thuận tay trái)');
  } else if (mode === 'focus-manga') {
    document.body.classList.remove('layout-focus-notebook');
    if (notebookState.isOpen) {
      toggleNotebookSplitView();
    }
    showToast('📖 Chế độ Chỉ Manga (Toàn màn hình)');
  } else if (mode === 'focus-notebook') {
    if (!notebookState.isOpen) {
      toggleNotebookSplitView();
    }
    document.body.classList.add('layout-focus-notebook');
    setupCanvasDimensions();
    showToast('📝 Chế độ Chỉ Vở Ghi Chép (Toàn màn hình Workspace)');
  }

  updateLayoutModeUI();

  // Close Settings modal if open
  const modal = document.getElementById('readerSettingsModal');
  if (modal) modal.classList.remove('active');
}

// Toggle Fullscreen Notebook Workspace
function toggleFocusNotebookMode() {
  const isFocus = document.body.classList.contains('layout-focus-notebook');
  const btn = document.getElementById('btnFocusNotebook');

  if (isFocus) {
    document.body.classList.remove('layout-focus-notebook');
    if (btn) {
      btn.innerHTML = `<i class="fas fa-expand-alt"></i>`;
      btn.title = 'Toàn màn hình Vở ghi chép (Phím Alt+F)';
    }
    setupCanvasDimensions();
    showToast('Đã quay lại chế độ Chia đôi màn hình');
  } else {
    if (!notebookState.isOpen) {
      toggleNotebookSplitView();
    }
    document.body.classList.add('layout-focus-notebook');
    if (btn) {
      btn.innerHTML = `<i class="fas fa-compress-alt"></i>`;
      btn.title = 'Thu nhỏ về chế độ Chia đôi (Phím Alt+F)';
    }
    setupCanvasDimensions();
    showToast('📝 Toàn màn hình Vở Ghi Chép');
  }

  updateLayoutModeUI();
}

function updateLayoutModeUI() {
  const isLeft = (notebookState.side === 'left');
  const isOpen = notebookState.isOpen;
  const isFocusNotebook = document.body.classList.contains('layout-focus-notebook');

  let currentMode = 'split-right';
  if (isFocusNotebook) {
    currentMode = 'focus-notebook';
  } else if (!isOpen) {
    currentMode = 'focus-manga';
  } else if (isLeft) {
    currentMode = 'split-left';
  } else {
    currentMode = 'split-right';
  }

  document.querySelectorAll('.layout-mode-card').forEach(btn => btn.classList.remove('active'));
  const activeCard = document.getElementById(
    currentMode === 'split-right' ? 'btnLayoutSplitRight' :
    currentMode === 'split-left' ? 'btnLayoutSplitLeft' :
    currentMode === 'focus-manga' ? 'btnLayoutFocusManga' : 'btnLayoutFocusNotebook'
  );
  if (activeCard) activeCard.classList.add('active');

  const btnFocus = document.getElementById('btnFocusNotebook');
  if (btnFocus) {
    btnFocus.innerHTML = isFocusNotebook ? `<i class="fas fa-compress-alt"></i>` : `<i class="fas fa-expand-alt"></i>`;
    btnFocus.title = isFocusNotebook ? 'Thu nhỏ về chế độ Chia đôi (Phím Alt+F)' : 'Toàn màn hình Vở ghi chép (Phím Alt+F)';
    btnFocus.classList.toggle('active', isFocusNotebook);
  }

  const btnSwap = document.getElementById('btnSwapNotebookSide');
  if (btnSwap) {
    btnSwap.classList.toggle('active', isLeft);
  }
}

function setupCanvasDimensions() {
  if (!notebookCanvas) return;
  const container = document.getElementById('notebookCanvasContainer');
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(300, Math.floor(rect.width));
  const height = Math.max(400, Math.floor(rect.height || (window.innerHeight - 190)));

  // Save existing drawing before resizing
  let tempCanvas = null;
  if (notebookCanvas.width > 0 && notebookCanvas.height > 0) {
    tempCanvas = document.createElement('canvas');
    tempCanvas.width = notebookCanvas.width;
    tempCanvas.height = notebookCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(notebookCanvas, 0, 0);
  }

  notebookCanvas.width = width * dpr;
  notebookCanvas.height = height * dpr;
  notebookCanvas.style.width = `${width}px`;
  notebookCanvas.style.height = `${height}px`;

  notebookCtx.scale(dpr, dpr);
  notebookCtx.lineCap = 'round';
  notebookCtx.lineJoin = 'round';

  // Restore drawing after resize
  if (tempCanvas) {
    notebookCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width / dpr, tempCanvas.height / dpr, 0, 0, width, height);
  }
}

let resizeTimeout = null;
function handleCanvasResizeDebounced() {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (notebookState.isOpen) {
      setupCanvasDimensions();
    }
  }, 150);
}

function initDrawingEvents() {
  if (!notebookCanvas) return;

  notebookCanvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    notebookCanvas.setPointerCapture(e.pointerId);
    notebookState.isDrawing = true;

    // Save state for undo
    pushUndoState();

    const pos = getCanvasPointerPos(e);
    lastPointerPos = pos;

    // Start stroke
    drawPoint(pos.x, pos.y, e.pressure || 0.5);
  });

  notebookCanvas.addEventListener('pointermove', (e) => {
    if (!notebookState.isDrawing) return;
    e.preventDefault();
    const pos = getCanvasPointerPos(e);
    drawLine(lastPointerPos.x, lastPointerPos.y, pos.x, pos.y, e.pressure || 0.5);
    lastPointerPos = pos;
  });

  const stopDrawing = (e) => {
    if (notebookState.isDrawing) {
      notebookState.isDrawing = false;
      saveNotebookDrawDebounced();
      updateNotebookStatus('Đã tự động lưu');
    }
  };

  notebookCanvas.addEventListener('pointerup', stopDrawing);
  notebookCanvas.addEventListener('pointercancel', stopDrawing);
}

function getCanvasPointerPos(e) {
  const rect = notebookCanvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function drawPoint(x, y, pressure = 0.5) {
  if (!notebookCtx) return;
  setupContextStyle(pressure);
  notebookCtx.beginPath();
  notebookCtx.arc(x, y, (notebookState.size * (pressure > 0 ? pressure * 1.4 : 1)) / 2, 0, Math.PI * 2);
  notebookCtx.fill();
}

function drawLine(x1, y1, x2, y2, pressure = 0.5) {
  if (!notebookCtx) return;
  setupContextStyle(pressure);
  notebookCtx.beginPath();
  notebookCtx.moveTo(x1, y1);
  notebookCtx.lineTo(x2, y2);
  notebookCtx.stroke();
}

function setupContextStyle(pressure = 0.5) {
  const sizeMultiplier = pressure > 0 ? Math.max(0.6, pressure * 1.4) : 1.0;
  const currentSize = notebookState.size * sizeMultiplier;

  if (notebookState.tool === 'eraser') {
    notebookCtx.globalCompositeOperation = 'destination-out';
    notebookCtx.lineWidth = notebookState.size * 3.5;
    notebookCtx.strokeStyle = 'rgba(0,0,0,1)';
    notebookCtx.fillStyle = 'rgba(0,0,0,1)';
  } else if (notebookState.tool === 'highlighter') {
    notebookCtx.globalCompositeOperation = 'source-over';
    notebookCtx.lineWidth = Math.max(14, notebookState.size * 3.5);
    notebookCtx.strokeStyle = hexToRgba(notebookState.color, 0.35);
    notebookCtx.fillStyle = hexToRgba(notebookState.color, 0.35);
  } else {
    // Normal Pen
    notebookCtx.globalCompositeOperation = 'source-over';
    notebookCtx.lineWidth = currentSize;
    notebookCtx.strokeStyle = notebookState.color;
    notebookCtx.fillStyle = notebookState.color;
  }
}

function hexToRgba(hex, alpha = 1.0) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function initPaletteAndStrokeHandlers() {
  // Color palette buttons
  document.querySelectorAll('.color-dot').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-dot').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setNotebookColor(btn.dataset.color);
    });
  });

  // Stroke size buttons
  document.querySelectorAll('.stroke-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stroke-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setNotebookSize(parseInt(btn.dataset.size, 10));
    });
  });
}

// ==========================================================================
// TOGGLE & MODE SWITCHING
// ==========================================================================
function toggleNotebookSplitView() {
  if (typeof showToast === 'function') {
    showToast('ℹ️ Tính năng Vở ghi chép đang được bảo trì để cải tiến!');
  }
  document.body.classList.remove('split-notebook-active', 'layout-focus-notebook');
  return false;
}

function _legacyToggleNotebookSplitView() {
  const anchor = captureReadingAnchor();
  notebookState.isOpen = !notebookState.isOpen;
  document.body.classList.toggle('split-notebook-active', notebookState.isOpen);

  const btnToggle = document.getElementById('btnNotebookToggle');
  if (btnToggle) {
    btnToggle.classList.toggle('active', notebookState.isOpen);
  }

  // Notify reader.js to lock or unlock zoom and scale left manga viewport
  if (typeof onNotebookSplitViewToggled === 'function') {
    onNotebookSplitViewToggled(notebookState.isOpen, currentNotebookWidth);
  }

  // Keep reading anchor locked across the CSS transition duration
  if (anchor) {
    let frameCount = 0;
    const animateAnchor = () => {
      syncReadingAnchor(anchor);
      frameCount++;
      if (frameCount < 20) { // ~320ms duration matching 0.3s CSS cubic-bezier transition
        requestAnimationFrame(animateAnchor);
      }
    };
    requestAnimationFrame(animateAnchor);
  }

  updateLayoutModeUI();

  if (notebookState.isOpen) {
    setTimeout(() => {
      setupCanvasDimensions();
      const savedData = localStorage.getItem(`${notebookStorageKey}_draw`);
      if (savedData) restoreCanvasImage(savedData);
    }, 180);
    showToast('📖 Đã mở Vở Ghi Chép (Đã khóa zoom)');
  } else {
    showToast('Đã thu gọn Vở Ghi Chép (Đã mở khóa zoom)');
  }
}

function setNotebookMode(mode) {
  notebookState.mode = mode;

  const btnDraw = document.getElementById('tabNotebookDraw');
  const btnText = document.getElementById('tabNotebookText');
  const btnCards = document.getElementById('tabNotebookCards');
  const btnKanji = document.getElementById('tabNotebookKanji');
  const drawToolbar = document.getElementById('notebookDrawToolbar');
  const textToolbar = document.getElementById('notebookTextToolbar');
  const drawContainer = document.getElementById('notebookCanvasContainer');
  const textContainer = document.getElementById('notebookTextContainer');
  const cardsContainer = document.getElementById('notebookCardsContainer');
  const kanjiContainer = document.getElementById('notebookKanjiContainer');

  if (btnDraw) btnDraw.classList.toggle('active', mode === 'draw');
  if (btnText) btnText.classList.toggle('active', mode === 'text');
  if (btnCards) btnCards.classList.toggle('active', mode === 'cards');
  if (btnKanji) btnKanji.classList.toggle('active', mode === 'kanji');

  if (mode === 'draw') {
    if (drawToolbar) drawToolbar.style.display = 'flex';
    if (textToolbar) textToolbar.style.display = 'none';
    if (drawContainer) drawContainer.style.display = 'block';
    if (textContainer) textContainer.style.display = 'none';
    if (cardsContainer) cardsContainer.style.display = 'none';
    if (kanjiContainer) kanjiContainer.style.display = 'none';
    setTimeout(() => setupCanvasDimensions(), 50);
  } else if (mode === 'text') {
    if (drawToolbar) drawToolbar.style.display = 'none';
    if (textToolbar) textToolbar.style.display = 'flex';
    if (drawContainer) drawContainer.style.display = 'none';
    if (textContainer) textContainer.style.display = 'flex';
    if (cardsContainer) cardsContainer.style.display = 'none';
    if (kanjiContainer) kanjiContainer.style.display = 'none';
    if (notebookTextarea) notebookTextarea.focus();
  } else if (mode === 'cards') {
    if (drawToolbar) drawToolbar.style.display = 'none';
    if (textToolbar) textToolbar.style.display = 'none';
    if (drawContainer) drawContainer.style.display = 'none';
    if (textContainer) textContainer.style.display = 'none';
    if (cardsContainer) cardsContainer.style.display = 'flex';
    if (kanjiContainer) kanjiContainer.style.display = 'none';
    renderFlashcardsList();
  } else if (mode === 'kanji') {
    if (drawToolbar) drawToolbar.style.display = 'none';
    if (textToolbar) textToolbar.style.display = 'none';
    if (drawContainer) drawContainer.style.display = 'none';
    if (textContainer) textContainer.style.display = 'none';
    if (cardsContainer) cardsContainer.style.display = 'none';
    if (kanjiContainer) kanjiContainer.style.display = 'flex';
    if (typeof initKanjiStudio === 'function') {
      initKanjiStudio();
    }
  }
}

function setNotebookTool(tool) {
  notebookState.tool = tool;

  const btnPen = document.getElementById('btnToolPen');
  const btnHighlighter = document.getElementById('btnToolHighlighter');
  const btnEraser = document.getElementById('btnToolEraser');

  if (btnPen) btnPen.classList.toggle('active', tool === 'pen');
  if (btnHighlighter) btnHighlighter.classList.toggle('active', tool === 'highlighter');
  if (btnEraser) btnEraser.classList.toggle('active', tool === 'eraser');
}

function setNotebookColor(color) {
  notebookState.color = color;
  if (notebookState.tool === 'eraser') {
    setNotebookTool('pen');
  }
}

function setNotebookSize(size) {
  notebookState.size = size;
}

function setNotebookPattern(pattern) {
  notebookState.pattern = pattern;
  const container = document.getElementById('notebookCanvasContainer');
  if (container) {
    container.className = `notebook-canvas-container pattern-${pattern}`;
  }

  const btnGrid = document.getElementById('btnPaperGrid');
  const btnLines = document.getElementById('btnPaperLines');
  const btnBlank = document.getElementById('btnPaperBlank');

  if (btnGrid) btnGrid.classList.toggle('active', pattern === 'grid');
  if (btnLines) btnLines.classList.toggle('active', pattern === 'lines');
  if (btnBlank) btnBlank.classList.toggle('active', pattern === 'blank');

  localStorage.setItem('edumanga_notebook_pattern', pattern);
}

// ==========================================================================
// UNDO, REDO & CLEAR
// ==========================================================================
function pushUndoState() {
  if (!notebookCanvas) return;
  if (notebookState.undoStack.length >= notebookState.maxUndo) {
    notebookState.undoStack.shift();
  }
  notebookState.undoStack.push(notebookCanvas.toDataURL());
  notebookState.redoStack = []; // Clear redo on new action
}

function undoNotebookDraw() {
  if (notebookState.undoStack.length === 0) {
    showToast('Không còn nét vẽ nào để hoàn tác');
    return;
  }
  notebookState.redoStack.push(notebookCanvas.toDataURL());
  const prevData = notebookState.undoStack.pop();
  restoreCanvasImage(prevData);
  saveNotebookDrawDebounced();
}

function redoNotebookDraw() {
  if (notebookState.redoStack.length === 0) {
    showToast('Không còn thao tác nào để làm lại');
    return;
  }
  notebookState.undoStack.push(notebookCanvas.toDataURL());
  const nextData = notebookState.redoStack.pop();
  restoreCanvasImage(nextData);
  saveNotebookDrawDebounced();
}

function restoreCanvasImage(dataUrl) {
  if (!notebookCtx || !notebookCanvas) return;
  const img = new Image();
  img.onload = () => {
    const dpr = window.devicePixelRatio || 1;
    const width = notebookCanvas.width / dpr;
    const height = notebookCanvas.height / dpr;
    notebookCtx.clearRect(0, 0, width, height);
    notebookCtx.drawImage(img, 0, 0, width, height);
  };
  img.src = dataUrl;
}

function clearNotebookCanvas() {
  if (!confirm('Bạn có chắc muốn xóa sạch toàn bộ nét vẽ của trang này?')) return;
  pushUndoState();
  const dpr = window.devicePixelRatio || 1;
  notebookCtx.clearRect(0, 0, notebookCanvas.width / dpr, notebookCanvas.height / dpr);
  saveNotebookDrawDebounced();
  showToast('Đã xóa sạch trang vẽ');
}

function clearNotebookAll() {
  if (!confirm('Xóa cả nét vẽ và ghi chú văn bản của chương này?')) return;
  const dpr = window.devicePixelRatio || 1;
  notebookCtx.clearRect(0, 0, notebookCanvas.width / dpr, notebookCanvas.height / dpr);
  if (notebookTextarea) notebookTextarea.value = '';
  localStorage.removeItem(`${notebookStorageKey}_draw`);
  localStorage.removeItem(`${notebookStorageKey}_text`);
  notebookState.undoStack = [];
  notebookState.redoStack = [];
  updateNotebookStatus('Đã làm trống ghi chép');
  showToast('Đã làm trống toàn bộ ghi chép chương này');
}

// ==========================================================================
// PERSISTENCE & STORAGE
// ==========================================================================
let notebookCards = [];
let cardsStorageKey = '';

function loadChapterNotebook(seriesId, chapId) {
  notebookStorageKey = `edumanga_notebook_${seriesId}_${chapId}`;
  cardsStorageKey = `edumanga_flashcards_${seriesId}_${chapId}`;

  // Update Chapter Title Badge
  const chapBadge = document.getElementById('notebookChapBadge');
  if (chapBadge) {
    chapBadge.textContent = chapId.toUpperCase();
  }

  // Load Saved Pattern
  const savedPattern = localStorage.getItem('edumanga_notebook_pattern') || 'grid';
  setNotebookPattern(savedPattern);

  // Load Saved Drawing
  const savedDraw = localStorage.getItem(`${notebookStorageKey}_draw`);
  if (savedDraw && notebookCanvas) {
    setTimeout(() => restoreCanvasImage(savedDraw), 100);
  }

  // Load Saved Text
  const savedText = localStorage.getItem(`${notebookStorageKey}_text`);
  if (savedText && notebookTextarea) {
    notebookTextarea.value = savedText;
  }

  // Load Saved Flashcards
  loadChapterFlashcards(seriesId, chapId);
}

function loadChapterFlashcards(seriesId, chapId) {
  cardsStorageKey = `edumanga_flashcards_${seriesId}_${chapId}`;
  try {
    const raw = localStorage.getItem(cardsStorageKey);
    if (raw) {
      notebookCards = JSON.parse(raw);
    } else {
      notebookCards = [];
    }
  } catch (err) {
    console.warn('Error loading flashcards:', err);
    notebookCards = [];
  }
  updateCardsBadgeCounter();
  if (notebookState.mode === 'cards') {
    renderFlashcardsList();
  }
}

function saveChapterFlashcards() {
  if (cardsStorageKey) {
    try {
      localStorage.setItem(cardsStorageKey, JSON.stringify(notebookCards));
    } catch (err) {
      console.warn('Error saving flashcards:', err);
    }
  }
  updateCardsBadgeCounter();

  // Sync to Cloud Firestore
  if (window.syncEngine && typeof window.syncEngine.saveFlashcards === 'function') {
    window.syncEngine.saveFlashcards(notebookCards);
  }
}

function updateCardsBadgeCounter() {
  const badge = document.getElementById('notebookCardsBadge');
  const countText = document.getElementById('cardsTotalCountText');
  const masteredText = document.getElementById('cardsMasteredCountText');

  const total = notebookCards.length;
  const mastered = notebookCards.filter(c => c.mastered).length;

  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'inline-flex' : 'none';
  }

  if (countText) countText.textContent = `${total} thẻ từ`;
  if (masteredText) masteredText.textContent = `${mastered} đã thuộc`;
}

function notebookAddCard({ term, furigana, hanViet, meaning }) {
  if (!term) return false;

  const cleanTerm = term.trim();
  const existing = notebookCards.find(c => c.term.trim().toLowerCase() === cleanTerm.toLowerCase());
  
  if (existing) {
    if (meaning && !existing.meaning) existing.meaning = meaning.trim();
    if (furigana && !existing.furigana) existing.furigana = furigana.trim();
    if (hanViet && !existing.hanViet) existing.hanViet = hanViet.trim();
    saveChapterFlashcards();
    if (notebookState.mode === 'cards') renderFlashcardsList();
    return false;
  }

  const newCard = {
    id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    term: cleanTerm,
    furigana: (furigana || '').trim(),
    hanViet: (hanViet || '').trim(),
    meaning: (meaning || '').trim(),
    mastered: false,
    createdAt: Date.now()
  };

  notebookCards.unshift(newCard);
  saveChapterFlashcards();
  if (notebookState.mode === 'cards') renderFlashcardsList();
  return true;
}

function renderFlashcardsList() {
  const listEl = document.getElementById('notebookCardsList');
  if (!listEl) return;

  updateCardsBadgeCounter();

  if (notebookCards.length === 0) {
    listEl.innerHTML = `
      <div class="cards-empty-state">
        <div class="empty-icon"><i class="fas fa-layer-group"></i></div>
        <div class="empty-title">Chưa có thẻ từ vựng nào</div>
        <div class="empty-desc">Rê chuột vào từ vựng trên tranh manga và bấm nút <b>+ Thẻ</b> để lưu vào đây!</div>
        <button class="btn-text-action" onclick="promptAddManualCard()" style="margin-top: 0.8rem;">
          <i class="fas fa-plus"></i> Tạo thẻ thủ công
        </button>
      </div>
    `;
    return;
  }

  let html = '';
  notebookCards.forEach((c) => {
    const readingBadge = c.furigana ? `<span class="card-reading-badge">${escapeHtml(c.furigana)}</span>` : '';
    const hanVietRow = c.hanViet ? `<div class="card-row"><span class="card-tag tag-hv">Hán-Việt</span><span class="card-val">${escapeHtml(c.hanViet)}</span></div>` : '';
    const meaningRow = c.meaning ? `<div class="card-row"><span class="card-tag tag-def">Nghĩa</span><span class="card-val">${escapeHtml(c.meaning)}</span></div>` : '';

    html += `
      <div class="vocab-card-item ${c.mastered ? 'is-mastered' : ''}" data-id="${c.id}">
        <div class="card-item-header">
          <div class="card-item-left">
            <span class="card-item-term">${escapeHtml(c.term)}</span>
            ${readingBadge}
          </div>
          <div class="card-item-actions">
            <button class="btn-card-ctrl" onclick="speakCardTerm('${escapeHtml(c.term)}', event)" title="Nghe phát âm">
              <i class="fas fa-volume-high"></i>
            </button>
            <button class="btn-card-ctrl ${c.mastered ? 'active-mastered' : ''}" onclick="toggleCardMastered('${c.id}')" title="${c.mastered ? 'Đã thuộc (Bấm để ôn lại)' : 'Đánh dấu đã thuộc'}">
              <i class="fas ${c.mastered ? 'fa-check-circle' : 'fa-circle-check'}"></i>
            </button>
            <button class="btn-card-ctrl btn-card-del" onclick="deleteFlashcard('${c.id}')" title="Xóa thẻ">
              <i class="fas fa-trash-can"></i>
            </button>
          </div>
        </div>
        <div class="card-item-body">
          ${hanVietRow}
          ${meaningRow}
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

function toggleCardMastered(id) {
  const card = notebookCards.find(c => c.id === id);
  if (!card) return;
  card.mastered = !card.mastered;
  saveChapterFlashcards();
  renderFlashcardsList();
  showToast(card.mastered ? '✅ Đã chuyển thẻ sang mục Đã thuộc' : '⏳ Đã chuyển thẻ sang mục Cần ôn tập');
}

function deleteFlashcard(id) {
  if (!confirm('Bạn có chắc muốn xóa thẻ từ này?')) return;
  notebookCards = notebookCards.filter(c => c.id !== id);
  saveChapterFlashcards();
  renderFlashcardsList();
  showToast('Đã xóa thẻ từ');
}

function speakCardTerm(term, event) {
  if (event) event.stopPropagation();
  if (!term || !('speechSynthesis' in window)) {
    showToast('Trình duyệt không hỗ trợ Text-to-Speech');
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(term);
  utter.lang = 'ja-JP'; // Default Japanese voice
  utter.rate = 0.88;
  window.speechSynthesis.speak(utter);
}

function promptAddManualCard() {
  const term = prompt('Nhập Từ vựng / Thuật ngữ chính:');
  if (!term || !term.trim()) return;

  const reading = prompt('Phiên âm / Cách đọc (Furigana / Pinyin):') || '';
  const hanViet = prompt('Âm Hán-Việt (nếu có):') || '';
  const meaning = prompt('Ý nghĩa / Định nghĩa tiếng Việt:') || '';

  notebookAddCard({
    term: term.trim(),
    furigana: reading.trim(),
    hanViet: hanViet.trim(),
    meaning: meaning.trim()
  });

  showToast(`✨ Đã tạo thẻ từ "${term.trim()}" thành công!`);
}

function exportFlashcardsAnki() {
  if (notebookCards.length === 0) {
    showToast('Chưa có thẻ từ nào để xuất file');
    return;
  }

  let tsv = '#separator:tab\n#html:true\n#tags column:5\n';
  notebookCards.forEach(c => {
    tsv += `${c.term}\t${c.furigana || ''}\t${c.hanViet || ''}\t${c.meaning || ''}\tEduManga\n`;
  });

  const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8' });
  const link = document.createElement('a');
  link.download = `EduManga_Anki_Flashcards_${Date.now()}.txt`;
  link.href = URL.createObjectURL(blob);
  link.click();
  showToast('📥 Đã xuất file thẻ Anki (.txt)!');
}

// 3D Practice Session Engine (Internal to notebook)
let practiceCards = [];
let practiceCurrentIdx = 0;
let isPracticeCardFlipped = false;

function startNotebookDeckPractice() {
  if (notebookCards.length === 0) {
    showToast('Chưa có thẻ từ nào để ôn tập! Hãy thêm từ mới từ truyện.');
    return;
  }

  practiceCards = [...notebookCards];
  practiceCurrentIdx = 0;
  isPracticeCardFlipped = false;

  const overlay = document.getElementById('flashcardPracticeOverlay');
  if (overlay) overlay.style.display = 'flex';

  renderCurrentNotebookPracticeCard();
}

function renderCurrentNotebookPracticeCard() {
  if (practiceCurrentIdx >= practiceCards.length) {
    closeNotebookDeckPractice();
    showToast('🎉 Chúc mừng bạn đã hoàn thành phiên ôn tập!');
    return;
  }

  const card = practiceCards[practiceCurrentIdx];
  const progressEl = document.getElementById('practiceProgress');
  const termEl = document.getElementById('practiceCardTerm');
  const readingEl = document.getElementById('practiceCardReading');
  const hanVietEl = document.getElementById('practiceCardHanViet');
  const meaningEl = document.getElementById('practiceCardMeaning');
  const flipCard = document.getElementById('practiceFlipCard');

  if (progressEl) progressEl.textContent = `${practiceCurrentIdx + 1} / ${practiceCards.length}`;
  if (termEl) termEl.textContent = card.term;
  if (readingEl) readingEl.textContent = card.furigana ? `【 ${card.furigana} 】` : '';
  if (hanVietEl) hanVietEl.textContent = card.hanViet ? `Hán-Việt: ${card.hanViet}` : '';
  if (meaningEl) meaningEl.textContent = card.meaning || 'Chưa có giải nghĩa';

  isPracticeCardFlipped = false;
  if (flipCard) flipCard.classList.remove('flipped');
}

function flipNotebookPracticeCard() {
  isPracticeCardFlipped = !isPracticeCardFlipped;
  const flipCard = document.getElementById('practiceFlipCard');
  if (flipCard) flipCard.classList.toggle('flipped', isPracticeCardFlipped);
}

function speakCurrentNotebookCard(e) {
  if (e) e.stopPropagation();
  const card = practiceCards[practiceCurrentIdx];
  if (card) speakCardTerm(card.term);
}

function rateNotebookPracticeCard(mastered) {
  const card = practiceCards[practiceCurrentIdx];
  if (card) {
    const mainCard = notebookCards.find(c => c.id === card.id);
    if (mainCard) mainCard.mastered = mastered;
    saveChapterFlashcards();
  }

  practiceCurrentIdx++;
  renderCurrentNotebookPracticeCard();
}

function closeNotebookDeckPractice() {
  const overlay = document.getElementById('flashcardPracticeOverlay');
  if (overlay) overlay.style.display = 'none';
  renderFlashcardsList();
}

let saveDrawTimer = null;
function saveNotebookDrawDebounced() {
  if (saveDrawTimer) clearTimeout(saveDrawTimer);
  saveDrawTimer = setTimeout(() => {
    if (notebookCanvas && notebookStorageKey) {
      try {
        const dataUrl = notebookCanvas.toDataURL('image/png', 0.85);
        localStorage.setItem(`${notebookStorageKey}_draw`, dataUrl);
        
        // Sync drawing to Cloud
        if (window.syncEngine && typeof window.syncEngine.saveNotebook === 'function') {
          window.syncEngine.saveNotebook(notebookStorageKey, {
            canvasData: dataUrl,
            textNotes: notebookTextarea ? notebookTextarea.value : ''
          });
        }
      } catch (err) {
        console.warn('Could not save notebook drawing:', err);
      }
    }
  }, 400);
}

let saveTextTimer = null;
function saveNotebookTextDebounced() {
  if (saveTextTimer) clearTimeout(saveTextTimer);
  saveTextTimer = setTimeout(() => {
    if (notebookTextarea && notebookStorageKey) {
      const textVal = notebookTextarea.value;
      localStorage.setItem(`${notebookStorageKey}_text`, textVal);
      updateNotebookStatus('Đã tự động lưu');

      // Sync text note to Cloud
      if (window.syncEngine && typeof window.syncEngine.saveNotebook === 'function') {
        const drawData = localStorage.getItem(`${notebookStorageKey}_draw`) || '';
        window.syncEngine.saveNotebook(notebookStorageKey, {
          textNotes: textVal,
          canvasData: drawData
        });
      }
    }
  }, 300);
}

function updateNotebookStatus(text) {
  const statusEl = document.getElementById('notebookSaveStatus');
  if (statusEl) {
    statusEl.textContent = text;
  }
}

// ==========================================================================
// EXPORT & TEMPLATES
// ==========================================================================
function downloadNotebook() {
  if (notebookState.mode === 'draw') {
    if (!notebookCanvas) return;
    const link = document.createElement('a');
    link.download = `EduManga_GhiChep_${Date.now()}.png`;
    link.href = notebookCanvas.toDataURL('image/png');
    link.click();
    showToast('📥 Đã tải ảnh ghi chép vẽ tay về máy!');
  } else {
    if (!notebookTextarea) return;
    const blob = new Blob([notebookTextarea.value], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `EduManga_GhiChu_${Date.now()}.md`;
    link.href = URL.createObjectURL(blob);
    link.click();
    showToast('📥 Đã tải file ghi chú Markdown về máy!');
  }
}

function insertVocabTemplate() {
  if (!notebookTextarea) return;
  setNotebookMode('text');
  const template = `\n📖 [TỪ VỰNG / THUẬT NGỮ MỚI]: 
• Cách đọc / Phiên âm: 
• Ý nghĩa / Định nghĩa: 
• Ví dụ ngữ cảnh trong manga: 
────────────────────────────────────────\n`;

  const start = notebookTextarea.selectionStart;
  const end = notebookTextarea.selectionEnd;
  const text = notebookTextarea.value;
  notebookTextarea.value = text.substring(0, start) + template + text.substring(end);
  notebookTextarea.selectionStart = notebookTextarea.selectionEnd = start + 30;
  notebookTextarea.focus();
  saveNotebookTextDebounced();
  showToast('✨ Đã chèn mẫu ghi chú từ vựng');
}

function insertGrammarTemplate() {
  if (!notebookTextarea) return;
  setNotebookMode('text');
  const template = `\n🧠 [CẤU TRÚC NGỮ PHÁP / MẪU CÂU]:
• Cấu trúc: 
• Ý nghĩa & Cách dùng: 
• Câu thoại trong manga: 
────────────────────────────────────────\n`;

  const start = notebookTextarea.selectionStart;
  const end = notebookTextarea.selectionEnd;
  const text = notebookTextarea.value;
  notebookTextarea.value = text.substring(0, start) + template + text.substring(end);
  notebookTextarea.selectionStart = notebookTextarea.selectionEnd = start + 36;
  notebookTextarea.focus();
  saveNotebookTextDebounced();
  showToast('✨ Đã chèn mẫu ghi chú ngữ pháp');
}

