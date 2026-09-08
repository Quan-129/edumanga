/* ==========================================================================
   EDUMANGA HUB - AUTHENTICATION SERVICE & USER PROFILE MANAGER
   Google OAuth, Email/Password Auth & Multi-Device Session State
   ========================================================================== */

let currentUserState = null;
const authStateListeners = [];

const authService = {
  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    if (typeof callback === 'function') {
      authStateListeners.push(callback);
      // Immediately notify if state already resolved
      if (currentUserState !== null) {
        callback(currentUserState);
      }
    }
  },

  // Notify all listeners
  _notifyListeners(user) {
    currentUserState = user;
    renderHeaderAuthUI(user);
    authStateListeners.forEach(cb => {
      try {
        cb(user);
      } catch (err) {
        console.error("Auth state listener error:", err);
      }
    });
  },

  // Get current user object
  getUser() {
    return currentUserState;
  },

  // Check if logged in
  isLoggedIn() {
    return currentUserState !== null && currentUserState.uid;
  },

  // 1. Google One-Tap / Popup Sign-In
  async loginWithGoogle() {
    if (!checkIsFirebaseConfigured()) {
      showConfigGuideToast();
      return { success: false, error: 'Firebase config missing' };
    }

    try {
      showAuthLoading(true);
      const result = await firebaseAuth.signInWithPopup(googleAuthProvider);
      const user = result.user;
      
      showToast(`👋 Chào mừng bạn, ${user.displayName || 'Học viên'}!`);
      closeAuthModal();

      // Trigger sync migration
      if (window.syncEngine && typeof window.syncEngine.onUserLoggedIn === 'function') {
        window.syncEngine.onUserLoggedIn(user);
      }

      return { success: true, user };
    } catch (error) {
      console.error("Google sign in error:", error);
      let errMsg = "Đăng nhập Google thất bại. Vui lòng thử lại!";
      if (error.code === 'auth/popup-closed-by-user') {
        errMsg = "Cửa sổ đăng nhập đã bị đóng.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errMsg = "Tên miền hiện tại chưa được cấp quyền trong Firebase Console.";
      }
      showToast(`⚠️ ${errMsg}`);
      return { success: false, error: errMsg };
    } finally {
      showAuthLoading(false);
    }
  },

  // 2. Email & Password Sign-In
  async loginWithEmail(email, password) {
    if (!checkIsFirebaseConfigured()) {
      showConfigGuideToast();
      return { success: false, error: 'Firebase config missing' };
    }

    try {
      showAuthLoading(true);
      const result = await firebaseAuth.signInWithEmailAndPassword(email.trim(), password);
      const user = result.user;

      showToast(`👋 Chào mừng trở lại, ${user.displayName || user.email}!`);
      closeAuthModal();

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
        errMsg = "Địa chỉ email không hợp lệ.";
      }
      showToast(`⚠️ ${errMsg}`);
      return { success: false, error: errMsg };
    } finally {
      showAuthLoading(false);
    }
  },

  // 3. Email & Password Sign-Up
  async registerWithEmail(displayName, email, password) {
    if (!checkIsFirebaseConfigured()) {
      showConfigGuideToast();
      return { success: false, error: 'Firebase config missing' };
    }

    try {
      showAuthLoading(true);
      const result = await firebaseAuth.createUserWithEmailAndPassword(email.trim(), password);
      const user = result.user;

      // Update Profile Name
      if (displayName && displayName.trim()) {
        await user.updateProfile({
          displayName: displayName.trim()
        });
      }

      showToast(`🎉 Tạo tài khoản thành công! Chào mừng ${displayName || email}!`);
      closeAuthModal();

      if (window.syncEngine && typeof window.syncEngine.onUserLoggedIn === 'function') {
        window.syncEngine.onUserLoggedIn(user);
      }

      return { success: true, user };
    } catch (error) {
      console.error("Sign up error:", error);
      let errMsg = "Đăng ký thất bại. Vui lòng thử lại!";
      if (error.code === 'auth/email-already-in-use') {
        errMsg = "Email này đã được đăng ký tài khoản trước đó.";
      } else if (error.code === 'auth/weak-password') {
        errMsg = "Mật khẩu quá ngắn (Cần ít nhất 6 ký tự).";
      } else if (error.code === 'auth/invalid-email') {
        errMsg = "Địa chỉ email không hợp lệ.";
      }
      showToast(`⚠️ ${errMsg}`);
      return { success: false, error: errMsg };
    } finally {
      showAuthLoading(false);
    }
  },

  // 4. Sign-Out
  async logout() {
    if (firebaseAuth) {
      try {
        await firebaseAuth.signOut();
      } catch (e) {
        console.warn("Sign out error:", e);
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
    // Guest Mode default
    authService._notifyListeners(null);
  }
}

// --------------------------------------------------------------------------
// UI HELPERS & MODAL MANAGEMENT
// --------------------------------------------------------------------------

function renderHeaderAuthUI(user) {
  const container = document.getElementById('headerUserContainer');
  if (!container) return;

  if (user && user.uid) {
    container.innerHTML = `
      <div class="user-profile-pill" id="userProfileDropdownBtn" onclick="toggleUserDropdown(event)" title="Tài khoản: ${user.displayName}">
        <img src="${user.photoURL}" alt="Avatar" class="user-avatar-mini" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}'">
        <span class="user-name-text">${user.displayName}</span>
        <span class="sync-cloud-badge" id="headerSyncStatus" title="Dữ liệu đã được đồng bộ đám mây"><i class="fas fa-cloud-check"></i></span>
        <i class="fas fa-chevron-down pill-arrow"></i>

        <!-- User Dropdown Menu -->
        <div id="userDropdownMenu" class="user-dropdown-menu">
          <div class="dropdown-header">
            <strong>${user.displayName}</strong>
            <span class="dropdown-email">${user.email || 'Học viên'}</span>
          </div>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" onclick="triggerManualCloudSync(event)">
            <i class="fas fa-sync-alt" style="color: #38bdf8;"></i> <span>Đồng bộ dữ liệu ngay</span>
          </button>
          <button class="dropdown-item" onclick="openHelpModal(event)">
            <i class="fas fa-circle-question" style="color: #a78bfa;"></i> <span>Hướng dẫn & Phím tắt</span>
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item item-logout" onclick="authService.logout()">
            <i class="fas fa-right-from-bracket" style="color: #f43f5e;"></i> <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn-auth-login" onclick="openAuthModal('login')" title="Đăng nhập để đồng bộ ghi chú & thẻ từ đa thiết bị">
        <i class="fas fa-user-circle"></i> <span>Đăng Nhập</span>
      </button>
    `;
  }
}

function toggleUserDropdown(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('userDropdownMenu');
  if (menu) {
    menu.classList.toggle('active');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('userDropdownMenu');
  if (dropdown && dropdown.classList.contains('active') && !e.target.closest('#userProfileDropdownBtn')) {
    dropdown.classList.remove('active');
  }
});

function openAuthModal(tab = 'login') {
  let modal = document.getElementById('authModal');
  if (!modal) {
    injectAuthModalDOM();
    modal = document.getElementById('authModal');
  }
  
  if (modal) {
    switchAuthTab(tab);
    modal.classList.add('active');
    
    // Check config warning
    const warningEl = document.getElementById('authConfigWarning');
    if (warningEl) {
      warningEl.style.display = checkIsFirebaseConfigured() ? 'none' : 'block';
    }
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function switchAuthTab(tab) {
  const tabLogin = document.getElementById('tabAuthLogin');
  const tabRegister = document.getElementById('tabAuthRegister');
  const formLogin = document.getElementById('formAuthLogin');
  const formRegister = document.getElementById('formAuthRegister');

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

function showAuthLoading(isLoading) {
  const overlay = document.getElementById('authLoadingOverlay');
  if (overlay) {
    overlay.style.display = isLoading ? 'flex' : 'none';
  }
}

function showConfigGuideToast() {
  showToast("⚙️ Bạn cần dán Firebase API Key vào js/firebase-config.js để kích hoạt Cloud Sync!");
}

function triggerManualCloudSync(e) {
  if (e) e.stopPropagation();
  if (window.syncEngine && typeof window.syncEngine.forceSyncAll === 'function') {
    window.syncEngine.forceSyncAll();
  } else {
    showToast("☁️ Dữ liệu đang được đồng bộ...");
  }
}

// Inject Auth Modal DOM dynamically if not in HTML
function injectAuthModalDOM() {
  if (document.getElementById('authModal')) return;

  const modalHtml = `
    <div id="authModal" class="custom-modal auth-modal-backdrop">
      <div class="modal-overlay" onclick="closeAuthModal()"></div>
      <div class="auth-modal-card">
        <!-- Close Button -->
        <button class="modal-close" onclick="closeAuthModal()"><i class="fas fa-times"></i></button>

        <!-- Header -->
        <div class="auth-modal-header">
          <div class="auth-brand-badge"><i class="fas fa-book-open"></i> EDUMANGA HUB</div>
          <h2 class="auth-modal-title">Tài Khoản Học Tập Cá Nhân</h2>
          <p class="auth-modal-desc">Độc lập dữ liệu ghi chép, flashcard 3D và tiến độ luyện chữ Hán trên mọi thiết bị.</p>
        </div>

        <!-- Firebase Config Missing Alert (Notice) -->
        <div id="authConfigWarning" class="auth-config-notice" style="display: none;">
          <div class="notice-icon"><i class="fas fa-info-circle"></i></div>
          <div class="notice-text">
            <strong>Chưa cấu hình Firebase API Key:</strong> Dữ liệu đang được lưu tạm trên máy này. Để đồng bộ lên đám mây đa thiết bị, hãy dán API Key vào file <code>js/firebase-config.js</code>.
          </div>
        </div>

        <!-- Google OAuth 1-Click Button -->
        <button class="btn-google-auth" onclick="authService.loginWithGoogle()">
          <svg class="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Tiếp tục với Google</span>
        </button>

        <div class="auth-divider">
          <span>hoặc dùng Email & Mật khẩu</span>
        </div>

        <!-- Tab Selector -->
        <div class="auth-tabs-row">
          <button id="tabAuthLogin" class="auth-tab-btn active" onclick="switchAuthTab('login')">
            <i class="fas fa-sign-in-alt"></i> Đăng Nhập
          </button>
          <button id="tabAuthRegister" class="auth-tab-btn" onclick="switchAuthTab('register')">
            <i class="fas fa-user-plus"></i> Tạo Tài Khoản
          </button>
        </div>

        <!-- Form 1: Login -->
        <form id="formAuthLogin" class="auth-form-content" onsubmit="handleFormLogin(event)">
          <div class="form-group">
            <label><i class="fas fa-envelope"></i> Email</label>
            <input type="email" id="loginEmail" class="auth-input" placeholder="name@example.com" required autocomplete="email">
          </div>
          <div class="form-group">
            <label><i class="fas fa-lock"></i> Mật khẩu</label>
            <div class="password-input-box">
              <input type="password" id="loginPassword" class="auth-input" placeholder="Nhập mật khẩu..." required autocomplete="current-password">
              <button type="button" class="btn-toggle-pw" onclick="togglePasswordVisibility('loginPassword', this)"><i class="fas fa-eye"></i></button>
            </div>
          </div>
          <button type="submit" class="btn-submit-auth">
            <i class="fas fa-arrow-right-to-bracket"></i> <span>Đăng Nhập</span>
          </button>
        </form>

        <!-- Form 2: Register -->
        <form id="formAuthRegister" class="auth-form-content" style="display: none;" onsubmit="handleFormRegister(event)">
          <div class="form-group">
            <label><i class="fas fa-user"></i> Họ & Tên / Biệt Danh</label>
            <input type="text" id="registerName" class="auth-input" placeholder="Ví dụ: Nguyễn Văn A" required autocomplete="name">
          </div>
          <div class="form-group">
            <label><i class="fas fa-envelope"></i> Email</label>
            <input type="email" id="registerEmail" class="auth-input" placeholder="name@example.com" required autocomplete="email">
          </div>
          <div class="form-group">
            <label><i class="fas fa-lock"></i> Mật khẩu (Tối thiểu 6 ký tự)</label>
            <div class="password-input-box">
              <input type="password" id="registerPassword" class="auth-input" minlength="6" placeholder="Tạo mật khẩu an toàn..." required autocomplete="new-password">
              <button type="button" class="btn-toggle-pw" onclick="togglePasswordVisibility('registerPassword', this)"><i class="fas fa-eye"></i></button>
            </div>
          </div>
          <button type="submit" class="btn-submit-auth btn-submit-reg">
            <i class="fas fa-user-check"></i> <span>Tạo Tài Khoản Mới</span>
          </button>
        </form>

        <!-- Loading Overlay -->
        <div id="authLoadingOverlay" class="auth-loading-spinner" style="display: none;">
          <i class="fas fa-circle-notch fa-spin"></i>
          <span>Đang xử lý kết nối...</span>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function handleFormLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPassword').value;
  authService.loginWithEmail(email, pass);
}

function handleFormRegister(e) {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const pass = document.getElementById('registerPassword').value;
  authService.registerWithEmail(name, email, pass);
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  injectAuthModalDOM();
  setTimeout(() => {
    setupAuthObserver();
  }, 100);
});
