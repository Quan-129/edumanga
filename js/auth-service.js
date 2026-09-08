/* ==========================================================================
   EDUMANGA HUB - AUTHENTICATION SERVICE & MANDATORY ACCESS GATE
   Google OAuth, Email/Password Auth, Admin Role & Isolated Multi-Tenant Cloud Storage
   ========================================================================== */

const ADMIN_EMAIL = 'minhquan12092005@gmail.com';

let currentUserState = null;
const authStateListeners = [];
let isAuthResolved = false;

const authService = {
  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    if (typeof callback === 'function') {
      authStateListeners.push(callback);
      // Immediately notify if state already resolved
      if (isAuthResolved) {
        callback(currentUserState);
      }
    }
  },

  // Check if current logged in user has Admin Privileges
  isAdmin() {
    if (!currentUserState) return false;
    const email = (currentUserState.email || '').toLowerCase().trim();
    return email === ADMIN_EMAIL.toLowerCase();
  },

  // Notify all listeners
  _notifyListeners(user) {
    currentUserState = user;
    isAuthResolved = true;
    showGateLoading(false);
    renderHeaderAuthUI(user);
    
    if (user && user.uid) {
      hideAuthGate();
    } else {
      showAuthGate();
    }

    const isAdminUser = this.isAdmin();

    authStateListeners.forEach(cb => {
      try {
        cb(user);
      } catch (err) {
        console.error("Auth state listener error:", err);
      }
    });

    // Dispatch global CustomEvent for UI reactivity
    try {
      window.dispatchEvent(new CustomEvent('edumanga:auth_changed', {
        detail: { user, isAdmin: isAdminUser }
      }));
    } catch (e) {}
  },

  // Get current user object
  getUser() {
    return currentUserState;
  },

  // Check if logged in
  isLoggedIn() {
    return currentUserState !== null && Boolean(currentUserState.uid);
  },

  // 1. Google One-Tap / Popup Sign-In
  async loginWithGoogle() {
    if (!checkIsFirebaseConfigured()) {
      showGateError("⚠️ Firebase chưa được cấu hình. Vui lòng kiểm tra js/firebase-config.js!");
      return { success: false, error: 'Firebase config missing' };
    }

    try {
      showGateLoading(true, "Đang kết nối tài khoản Google...");
      hideGateError();
      const result = await firebaseAuth.signInWithPopup(googleAuthProvider);
      const user = result.user;
      
      const roleText = (user.email || '').toLowerCase() === ADMIN_EMAIL ? ' (Quản trị viên)' : '';
      showToast(`👋 Chào mừng bạn, ${user.displayName || 'Học viên'}${roleText}!`);

      // Trigger sync migration
      if (window.syncEngine && typeof window.syncEngine.onUserLoggedIn === 'function') {
        window.syncEngine.onUserLoggedIn(user);
      }

      return { success: true, user };
    } catch (error) {
      console.error("Google sign in error:", error);
      let errMsg = "Đăng nhập Google thất bại. Vui lòng thử lại!";
      if (error.code === 'auth/popup-closed-by-user') {
        errMsg = "Cửa sổ đăng nhập đã bị đóng trước khi hoàn tất.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errMsg = "Tên miền hiện tại chưa được cấp phép trong Firebase Console.";
      }
      showGateError(errMsg);
      showToast(`⚠️ ${errMsg}`);
      return { success: false, error: errMsg };
    } finally {
      showGateLoading(false);
    }
  },

  // 2. Email & Password Sign-In
  async loginWithEmail(email, password) {
    if (!checkIsFirebaseConfigured()) {
      showGateError("⚠️ Firebase chưa được cấu hình. Vui lòng kiểm tra js/firebase-config.js!");
      return { success: false, error: 'Firebase config missing' };
    }

    try {
      showGateLoading(true, "Đang xác thực thông tin đăng nhập...");
      hideGateError();
      const result = await firebaseAuth.signInWithEmailAndPassword(email.trim(), password);
      const user = result.user;

      const roleText = (user.email || '').toLowerCase() === ADMIN_EMAIL ? ' (Quản trị viên)' : '';
      showToast(`👋 Chào mừng trở lại, ${user.displayName || user.email}${roleText}!`);

      if (window.syncEngine && typeof window.syncEngine.onUserLoggedIn === 'function') {
        window.syncEngine.onUserLoggedIn(user);
      }

      return { success: true, user };
    } catch (error) {
      console.error("Email sign in error:", error);
      let errMsg = "Đăng nhập thất bại. Kiểm tra email & mật khẩu!";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errMsg = "Email hoặc mật khẩu không chính xác.";
      } else if (error.code === 'auth/invalid-email') {
        errMsg = "Địa chỉ email không đúng định dạng.";
      } else if (error.code === 'auth/too-many-requests') {
        errMsg = "Quá nhiều lần thử sai. Vui lòng thử lại sau vài phút.";
      }
      showGateError(errMsg);
      showToast(`⚠️ ${errMsg}`);
      return { success: false, error: errMsg };
    } finally {
      showGateLoading(false);
    }
  },

  // 3. Email & Password Sign-Up
  async registerWithEmail(displayName, email, password) {
    if (!checkIsFirebaseConfigured()) {
      showGateError("⚠️ Firebase chưa được cấu hình. Vui lòng kiểm tra js/firebase-config.js!");
      return { success: false, error: 'Firebase config missing' };
    }

    try {
      showGateLoading(true, "Đang khởi tạo tài khoản mới...");
      hideGateError();
      const result = await firebaseAuth.createUserWithEmailAndPassword(email.trim(), password);
      const user = result.user;

      // Update Profile Name
      if (displayName && displayName.trim()) {
        await user.updateProfile({
          displayName: displayName.trim()
        });
      }

      showToast(`🎉 Tạo tài khoản thành công! Chào mừng ${displayName || email}!`);

      if (window.syncEngine && typeof window.syncEngine.onUserLoggedIn === 'function') {
        window.syncEngine.onUserLoggedIn(user);
      }

      return { success: true, user };
    } catch (error) {
      console.error("Sign up error:", error);
      let errMsg = "Đăng ký thất bại. Vui lòng thử lại!";
      if (error.code === 'auth/email-already-in-use') {
        errMsg = "Email này đã được đăng ký tài khoản trước đó.";
      } else if (error.code === 'auth/invalid-email') {
        errMsg = "Địa chỉ email không hợp lệ.";
      } else if (error.code === 'auth/weak-password') {
        errMsg = "Mật khẩu quá yếu. Vui lòng đặt tối thiểu 6 ký tự.";
      }
      showGateError(errMsg);
      showToast(`⚠️ ${errMsg}`);
      return { success: false, error: errMsg };
    } finally {
      showGateLoading(false);
    }
  },

  // 4. Sign Out
  async logout() {
    if (firebaseAuth) {
      try {
        await firebaseAuth.signOut();
      } catch (err) {
        console.warn("Sign out error:", err);
      }
    }
    
    // Clear Local State
    currentUserState = null;
    this._notifyListeners(null);
    showToast("🚪 Đã đăng xuất khỏi tài khoản.");
  }
};

// Listen to Firebase Auth state changes
function setupAuthObserver() {
  if (typeof firebase !== 'undefined' && firebaseAuth) {
    firebaseAuth.onAuthStateChanged(user => {
      if (user) {
        authService._notifyListeners({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`
        });
      } else {
        authService._notifyListeners(null);
      }
    });
  } else {
    // If firebase library not loaded, lock by default
    authService._notifyListeners(null);
  }
}

// --------------------------------------------------------------------------
// MANDATORY AUTH GATE MANAGEMENT
// --------------------------------------------------------------------------

function showAuthGate() {
  let gate = document.getElementById('authGateOverlay');
  if (!gate) {
    injectAuthGateDOM();
    gate = document.getElementById('authGateOverlay');
  }
  if (gate) {
    gate.classList.remove('unlocked');
  }
  document.body.classList.add('auth-locked');
}

function hideAuthGate() {
  const gate = document.getElementById('authGateOverlay');
  if (gate) {
    gate.classList.add('unlocked');
  }
  document.body.classList.remove('auth-locked');
}

function switchGateTab(tab) {
  const tabLogin = document.getElementById('tabGateLogin');
  const tabRegister = document.getElementById('tabGateRegister');
  const formLogin = document.getElementById('formGateLogin');
  const formRegister = document.getElementById('formGateRegister');
  hideGateError();

  if (tab === 'login') {
    if (tabLogin) tabLogin.classList.add('active');
    if (tabRegister) tabRegister.classList.remove('active');
    if (formLogin) formLogin.style.display = 'flex';
    if (formRegister) formRegister.style.display = 'none';
  } else {
    if (tabLogin) tabLogin.classList.remove('active');
    if (tabRegister) tabRegister.classList.add('active');
    if (formLogin) formLogin.style.display = 'none';
    if (formRegister) formRegister.style.display = 'flex';
  }
}

function showGateError(msg) {
  const errBox = document.getElementById('gateErrorMsg');
  const errText = document.getElementById('gateErrorText');
  if (errBox && errText) {
    errText.textContent = msg;
    errBox.style.display = 'flex';
  }
}

function hideGateError() {
  const errBox = document.getElementById('gateErrorMsg');
  if (errBox) {
    errBox.style.display = 'none';
  }
}

function showGateLoading(isLoading, text = "Đang xử lý kết nối...") {
  const overlay = document.getElementById('gateLoadingOverlay');
  const textEl = document.getElementById('gateLoadingText');
  if (overlay) {
    if (textEl) textEl.textContent = text;
    overlay.style.display = isLoading ? 'flex' : 'none';
  }
}

function toggleGatePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
}

function handleGateLogin(e) {
  e.preventDefault();
  const email = document.getElementById('gateLoginEmail').value;
  const pass = document.getElementById('gateLoginPassword').value;
  authService.loginWithEmail(email, pass);
}

function handleGateRegister(e) {
  e.preventDefault();
  const name = document.getElementById('gateRegName').value;
  const email = document.getElementById('gateRegEmail').value;
  const pass = document.getElementById('gateRegPassword').value;
  authService.registerWithEmail(name, email, pass);
}

// Inject Mandatory Auth Gate DOM
function injectAuthGateDOM() {
  if (document.getElementById('authGateOverlay')) return;

  const isConfigured = checkIsFirebaseConfigured();

  const gateHtml = `
    <div id="authGateOverlay" class="auth-gate-overlay">
      <div class="auth-gate-card">
        
        <!-- Header -->
        <div class="auth-gate-header">
          <div class="auth-gate-badge">
            <i class="fas fa-shield-halved"></i> CỔNG TRUY CẬP HỌC VIÊN
          </div>
          <h1 class="auth-gate-title">EDUMANGA HUB</h1>
          <p class="auth-gate-desc">Vui lòng đăng nhập để bắt đầu đọc truyện tranh kiến thức & đồng bộ dữ liệu học tập cá nhân.</p>
        </div>

        <!-- Highlights feature pills -->
        <div class="auth-gate-features">
          <div class="feature-pill">
            <i class="fas fa-cloud-bolt"></i>
            <span>Đồng bộ Cloud</span>
          </div>
          <div class="feature-pill">
            <i class="fas fa-book-open-reader"></i>
            <span>Webtoon Mượt Mà</span>
          </div>
          <div class="feature-pill">
            <i class="fas fa-layer-group"></i>
            <span>Thẻ từ & Kanji</span>
          </div>
        </div>

        <!-- Notice if Firebase Config missing -->
        ${!isConfigured ? `
          <div class="auth-config-notice" style="margin-bottom: 1rem;">
            <div class="notice-icon"><i class="fas fa-info-circle"></i></div>
            <div class="notice-text">
              <strong>Chưa nhập API Key:</strong> Vui lòng dán Firebase Config vào file <code>js/firebase-config.js</code>.
            </div>
          </div>
        ` : ''}

        <!-- Google OAuth 1-Click Button -->
        <button type="button" class="btn-gate-google" onclick="authService.loginWithGoogle()" title="Đăng nhập tức thì chỉ với 1 chạm">
          <svg class="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Tiếp tục với Google</span>
        </button>

        <div class="gate-divider">
          <span>hoặc dùng Email & Mật khẩu</span>
        </div>

        <!-- Tab Selector -->
        <div class="gate-tabs-row">
          <button id="tabGateLogin" type="button" class="gate-tab-btn active" onclick="switchGateTab('login')">
            <i class="fas fa-arrow-right-to-bracket"></i> Đăng Nhập
          </button>
          <button id="tabGateRegister" type="button" class="gate-tab-btn" onclick="switchGateTab('register')">
            <i class="fas fa-user-plus"></i> Tạo Tài Khoản
          </button>
        </div>

        <!-- Error Banner -->
        <div id="gateErrorMsg" class="gate-error-banner">
          <i class="fas fa-circle-exclamation" style="color: #f43f5e;"></i>
          <span id="gateErrorText">Đã có lỗi xảy ra</span>
        </div>

        <!-- Form 1: Login -->
        <form id="formGateLogin" class="gate-form-content" onsubmit="handleGateLogin(event)">
          <div class="gate-form-group">
            <label><i class="fas fa-envelope"></i> Địa chỉ Email</label>
            <input type="email" id="gateLoginEmail" class="gate-input" placeholder="name@example.com" required autocomplete="email">
          </div>
          <div class="gate-form-group">
            <label><i class="fas fa-lock"></i> Mật khẩu</label>
            <div class="gate-password-box">
              <input type="password" id="gateLoginPassword" class="gate-input" placeholder="Nhập mật khẩu..." required autocomplete="current-password">
              <button type="button" class="btn-gate-toggle-pw" onclick="toggleGatePasswordVisibility('gateLoginPassword', this)"><i class="fas fa-eye"></i></button>
            </div>
          </div>
          <button type="submit" class="btn-gate-submit">
            <i class="fas fa-right-to-bracket"></i> <span>Vào Hệ Thống</span>
          </button>
        </form>

        <!-- Form 2: Register -->
        <form id="formGateRegister" class="gate-form-content" style="display: none;" onsubmit="handleGateRegister(event)">
          <div class="gate-form-group">
            <label><i class="fas fa-user"></i> Họ & Tên / Biệt danh</label>
            <input type="text" id="gateRegName" class="gate-input" placeholder="Ví dụ: Nguyễn Văn A" required autocomplete="name">
          </div>
          <div class="gate-form-group">
            <label><i class="fas fa-envelope"></i> Địa chỉ Email</label>
            <input type="email" id="gateRegEmail" class="gate-input" placeholder="name@example.com" required autocomplete="email">
          </div>
          <div class="gate-form-group">
            <label><i class="fas fa-lock"></i> Mật khẩu (Tối thiểu 6 ký tự)</label>
            <div class="gate-password-box">
              <input type="password" id="gateRegPassword" class="gate-input" minlength="6" placeholder="Tạo mật khẩu an toàn..." required autocomplete="new-password">
              <button type="button" class="btn-gate-toggle-pw" onclick="toggleGatePasswordVisibility('gateRegPassword', this)"><i class="fas fa-eye"></i></button>
            </div>
          </div>
          <button type="submit" class="btn-gate-submit btn-gate-reg">
            <i class="fas fa-user-check"></i> <span>Đăng Ký Tài Khoản</span>
          </button>
        </form>

        <!-- Footer note -->
        <div class="gate-footer-note">
          <i class="fas fa-shield-check"></i> Dữ liệu ghi chú & flashcard được phân vùng bảo mật độc lập 100%.
        </div>

        <!-- Gate Loading Overlay -->
        <div id="gateLoadingOverlay" class="gate-loading-overlay" style="display: none;">
          <div class="gate-loading-spinner"></div>
          <span id="gateLoadingText">Đang xử lý kết nối...</span>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', gateHtml);
}

// Render User Button in Header
function renderHeaderAuthUI(user) {
  const container = document.getElementById('headerUserContainer');
  if (!container) return;

  if (user) {
    const isAdmin = (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const adminTag = isAdmin ? `<span class="header-admin-pill" title="Tài khoản Quản Trị Viên"><i class="fas fa-crown"></i> Admin</span>` : '';

    container.innerHTML = `
      <div class="header-user-dropdown-wrap">
        <button id="btnHeaderUser" class="header-user-btn" onclick="toggleUserMenu(event)">
          <img src="${user.photoURL}" alt="${user.displayName}" class="header-avatar" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=edumanga'">
          <div class="header-user-info-text">
            <span class="header-user-name">${user.displayName || user.email.split('@')[0]}</span>
            ${adminTag}
          </div>
          <i class="fas fa-chevron-down header-user-arrow"></i>
        </button>

        <div id="headerUserMenu" class="header-user-menu" onclick="event.stopPropagation()">
          <div class="menu-user-header">
            <div class="menu-user-name">${user.displayName || 'Học viên'}</div>
            <div class="menu-user-email">${user.email}</div>
            ${isAdmin ? `<div class="menu-admin-badge"><i class="fas fa-shield-halved"></i> Toàn quyền Quản Trị</div>` : ''}
          </div>
          <div class="menu-divider"></div>
          ${isAdmin ? `
            <div class="menu-section-label"><i class="fas fa-crown" style="color: #facc15;"></i> Quản Trị Dữ Liệu</div>
            <button type="button" class="menu-item-btn" onclick="adminExportMasterSystemBackup(); toggleUserMenu();">
              <i class="fas fa-cloud-arrow-down" style="color: #38bdf8;"></i> <span>Sao lưu toàn bộ (Master JSON)</span>
            </button>
            <button type="button" class="menu-item-btn" onclick="adminTriggerRestoreBackup(); toggleUserMenu();">
              <i class="fas fa-file-import" style="color: #a855f7;"></i> <span>Nạp / Khôi phục file Backup</span>
            </button>
            <button type="button" class="menu-item-btn" onclick="adminExportMangaJson(); toggleUserMenu();">
              <i class="fas fa-file-code" style="color: #22c55e;"></i> <span>Xuất danh mục (manga.json)</span>
            </button>
            <div class="menu-divider"></div>
          ` : ''}
          <button type="button" class="menu-item-btn" onclick="openBookmarkModal(); toggleUserMenu();">
            <i class="fas fa-bookmark"></i> <span>Tủ sách cá nhân</span>
          </button>
          <button type="button" class="menu-item-btn" onclick="openHelpModal(); toggleUserMenu();">
            <i class="fas fa-circle-question"></i> <span>Hướng dẫn & Phím tắt</span>
          </button>
          <div class="menu-divider"></div>
          <button type="button" class="menu-item-btn text-danger" onclick="authService.logout()">
            <i class="fas fa-right-from-bracket"></i> <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn-primary btn-header-login" onclick="showAuthGate()">
        <i class="fas fa-right-to-bracket"></i> <span>Đăng Nhập</span>
      </button>
    `;
  }
}

function toggleUserMenu(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('headerUserMenu');
  if (menu) {
    menu.classList.toggle('active');
  }
}

// Global Admin Backup & Restore Functions
async function adminExportMasterSystemBackup() {
  if (!window.authService || !window.authService.isAdmin()) {
    showToast("⚠️ Chỉ Quản trị viên mới có quyền sao lưu dữ liệu.");
    return;
  }

  showToast("⏳ Đang thu thập toàn bộ dữ liệu truyện tranh và kịch bản...");
  let fullCatalog = [];
  if (typeof getFullMangaCatalog === 'function') {
    fullCatalog = await getFullMangaCatalog();
  } else {
    try {
      const raw = localStorage.getItem('edumanga_custom_catalog');
      if (raw) fullCatalog = JSON.parse(raw);
    } catch (e) {}
  }

  const res = await window.dbStorage.exportMasterBackup(fullCatalog);
  if (res.success) {
    showToast(`💾 Đã xuất Master Backup: ${res.totalSeries} bộ truyện, ${res.totalChapters} chương!`);
  } else {
    showToast(`❌ Lỗi khi xuất Master Backup: ${res.error}`);
  }
}

function adminTriggerRestoreBackup() {
  if (!window.authService || !window.authService.isAdmin()) {
    showToast("⚠️ Chỉ Quản trị viên mới có quyền nạp bản sao lưu.");
    return;
  }

  let fileInput = document.getElementById('adminGlobalRestoreInput');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'adminGlobalRestoreInput';
    fileInput.accept = '.json,application/json';
    fileInput.style.display = 'none';
    fileInput.onchange = function() {
      handleAdminGlobalRestoreFile(this);
    };
    document.body.appendChild(fileInput);
  }
  fileInput.value = '';
  fileInput.click();
}

async function handleAdminGlobalRestoreFile(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];

  showToast(`⏳ Đang đọc và kiểm tra tính hợp lệ file "${file.name}"...`);

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const content = e.target.result;
      const res = await window.dbStorage.restoreBackupData(content);
      if (res.success) {
        showToast(`🎉 ${res.message}`);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        showToast(`⚠️ Không thể khôi phục: ${res.error}`);
      }
    } catch (err) {
      showToast(`❌ Lỗi phân tích file JSON: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

// Close dropdown when clicking outside
document.addEventListener('click', () => {
  const menu = document.getElementById('headerUserMenu');
  if (menu) menu.classList.remove('active');
});

// Auto initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  injectAuthGateDOM();
  setupAuthObserver();
});

// Global Export
window.authService = authService;
window.checkIsAdmin = () => authService.isAdmin();
window.adminExportMasterSystemBackup = adminExportMasterSystemBackup;
window.adminTriggerRestoreBackup = adminTriggerRestoreBackup;
window.handleAdminGlobalRestoreFile = handleAdminGlobalRestoreFile;

