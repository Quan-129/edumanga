/* ==========================================================================
   EDUMANGA HUB - REAL-TIME COMMENT & DISCUSSION SERVICE
   Cloud Firestore Realtime Comments, Likes, Timestamps & Local Fallback
   ========================================================================== */

let currentCommentChapterKey = '';
let currentSeriesId = '';
let currentChapId = '';
let activeCommentsList = [];
let commentUnsubscribe = null;

function getFirestoreDb() {
  if (typeof window !== 'undefined' && (window.firestoreDb || window.firebaseFirestore)) {
    return window.firestoreDb || window.firebaseFirestore;
  }
  if (typeof firestoreDb !== 'undefined') return firestoreDb;
  if (typeof firebase !== 'undefined' && firebase.firestore && typeof firebase.firestore === 'function') {
    try { return firebase.firestore(); } catch (e) { return null; }
  }
  return null;
}

const commentService = {
  // Initialize and load comments for chapter
  initChapterComments(seriesId, chapId) {
    currentSeriesId = seriesId;
    currentChapId = chapId;
    currentCommentChapterKey = `${seriesId}_${chapId}`;

    if (commentUnsubscribe) {
      commentUnsubscribe();
      commentUnsubscribe = null;
    }

    const db = getFirestoreDb();
    const isConfigured = typeof checkIsFirebaseConfigured === 'function' ? checkIsFirebaseConfigured() : false;

    if (db && isConfigured) {
      try {
        commentUnsubscribe = db.collection('comments')
          .where('chapterKey', '==', currentCommentChapterKey)
          .onSnapshot((snapshot) => {
            const comments = [];
            snapshot.forEach(doc => {
              const data = doc.data();
              comments.push({
                id: doc.id,
                ...data,
                createdTime: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().getTime() : data.createdAt) : Date.now()
              });
            });

            // Sort newest first
            comments.sort((a, b) => b.createdTime - a.createdTime);
            activeCommentsList = comments;
            renderCommentsUI(comments);
            updateCommentBadges(comments.length);
          }, (err) => {
            console.warn("Firestore comments error, falling back to local:", err);
            loadLocalComments();
          });
      } catch (err) {
        console.warn("Error attaching comment listener:", err);
        loadLocalComments();
      }
    } else {
      loadLocalComments();
    }
  },

  // Post a new comment
  async postComment(text) {
    if (!text || !text.trim()) return { success: false, error: 'Empty text' };

    const user = (typeof authService !== 'undefined') ? authService.getUser() : null;
    if (!user || !user.uid) {
      if (typeof showAuthGate === 'function') {
        showAuthGate();
      }
      showToast("🔒 Vui lòng đăng nhập để gửi bình luận!");
      return { success: false, error: 'Not authenticated' };
    }

    const trimmed = text.trim();
    const newCommentData = {
      chapterKey: currentCommentChapterKey,
      seriesId: currentSeriesId,
      chapterId: currentChapId,
      userId: user.uid,
      userName: user.displayName || user.email.split('@')[0] || 'Học viên',
      userPhoto: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      content: trimmed,
      createdAt: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : Date.now(),
      likesCount: 0,
      likedUsers: []
    };

    const db = getFirestoreDb();
    const isConfigured = typeof checkIsFirebaseConfigured === 'function' ? checkIsFirebaseConfigured() : false;

    if (db && isConfigured) {
      try {
        showCommentLoading(true);
        await db.collection('comments').add(newCommentData);
        showToast("💬 Đã đăng bình luận!");
        clearCommentInput();
        return { success: true };
      } catch (err) {
        console.error("Error posting comment to Firebase:", err);
        showToast("⚠️ Lỗi kết nối Firestore, đang lưu tạm...");
        saveLocalComment(newCommentData);
        clearCommentInput();
        return { success: true };
      } finally {
        showCommentLoading(false);
      }
    } else {
      saveLocalComment(newCommentData);
      showToast("💬 Đã lưu bình luận!");
      clearCommentInput();
      return { success: true };
    }
  },

  // Toggle Like on comment
  async toggleLike(commentId) {
    const user = (typeof authService !== 'undefined') ? authService.getUser() : null;
    if (!user || !user.uid) {
      showToast("🔒 Vui lòng đăng nhập để thả tim bình luận!");
      return;
    }

    const comment = activeCommentsList.find(c => c.id === commentId);
    if (!comment) return;

    const likedUsers = Array.isArray(comment.likedUsers) ? [...comment.likedUsers] : [];
    const userIndex = likedUsers.indexOf(user.uid);
    let newLikesCount = comment.likesCount || 0;

    if (userIndex > -1) {
      likedUsers.splice(userIndex, 1);
      newLikesCount = Math.max(0, newLikesCount - 1);
    } else {
      likedUsers.push(user.uid);
      newLikesCount += 1;
    }

    // Optimistic UI update
    comment.likedUsers = likedUsers;
    comment.likesCount = newLikesCount;
    renderCommentsUI(activeCommentsList);

    const db = getFirestoreDb();
    const isConfigured = typeof checkIsFirebaseConfigured === 'function' ? checkIsFirebaseConfigured() : false;

    if (db && isConfigured) {
      try {
        await db.collection('comments').doc(commentId).update({
          likesCount: newLikesCount,
          likedUsers: likedUsers
        });
      } catch (err) {
        console.warn("Error updating like on Firestore:", err);
      }
    } else {
      saveLocalCommentsList(activeCommentsList);
    }
  },

  // Delete own comment
  async deleteComment(commentId) {
    const user = (typeof authService !== 'undefined') ? authService.getUser() : null;
    if (!user || !user.uid) return;

    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này không?")) return;

    const db = getFirestoreDb();
    const isConfigured = typeof checkIsFirebaseConfigured === 'function' ? checkIsFirebaseConfigured() : false;

    if (db && isConfigured) {
      try {
        await db.collection('comments').doc(commentId).delete();
        showToast("🗑️ Đã xóa bình luận.");
      } catch (err) {
        console.error("Error deleting comment:", err);
      }
    } else {
      activeCommentsList = activeCommentsList.filter(c => c.id !== commentId);
      saveLocalCommentsList(activeCommentsList);
      renderCommentsUI(activeCommentsList);
      updateCommentBadges(activeCommentsList.length);
      showToast("🗑️ Đã xóa bình luận.");
    }
  }
};

// --------------------------------------------------------------------------
// LOCAL FALLBACK STORAGE
// --------------------------------------------------------------------------

function loadLocalComments() {
  try {
    const raw = localStorage.getItem(`edumanga_comments_${currentCommentChapterKey}`);
    const comments = raw ? JSON.parse(raw) : [];
    activeCommentsList = comments;
    renderCommentsUI(comments);
    updateCommentBadges(comments.length);
  } catch (e) {
    activeCommentsList = [];
    renderCommentsUI([]);
    updateCommentBadges(0);
  }
}

function saveLocalComment(commentData) {
  const localObj = {
    ...commentData,
    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdTime: Date.now()
  };
  activeCommentsList.unshift(localObj);
  saveLocalCommentsList(activeCommentsList);
  renderCommentsUI(activeCommentsList);
  updateCommentBadges(activeCommentsList.length);
}

function saveLocalCommentsList(list) {
  try {
    localStorage.setItem(`edumanga_comments_${currentCommentChapterKey}`, JSON.stringify(list));
  } catch (e) {}
}

// --------------------------------------------------------------------------
// UI RENDERING & EVENT HANDLERS
// --------------------------------------------------------------------------

function renderCommentsUI(comments) {
  const container = document.getElementById('commentModalList');
  if (!container) return;

  const currentUid = (typeof authService !== 'undefined' && authService.getUser()) ? authService.getUser().uid : null;

  if (!comments || comments.length === 0) {
    container.innerHTML = `
      <div class="comment-empty-state">
        <div class="empty-icon"><i class="fas fa-comments"></i></div>
        <p class="empty-title">Chưa có bình luận nào</p>
        <p class="empty-desc">Hãy là người đầu tiên chia sẻ cảm nghĩ, giải đáp thắc mắc hoặc ghi chú bài học của chương này!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = comments.map(c => {
    const isLiked = currentUid && Array.isArray(c.likedUsers) && c.likedUsers.includes(currentUid);
    const isAuthor = currentUid && c.userId === currentUid;
    const timeAgoStr = formatTimeAgo(c.createdTime || c.createdAt);

    return `
      <div class="comment-item-card ${isAuthor ? 'is-self' : ''}" id="comment_${c.id}">
        <img src="${c.userPhoto || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + (c.userId || 'guest')}" 
             alt="${c.userName}" 
             class="comment-user-avatar"
             onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=user'">
        
        <div class="comment-content-box">
          <div class="comment-header-row">
            <span class="comment-user-name">${escapeHtml(c.userName || 'Học viên')}</span>
            ${isAuthor ? '<span class="comment-author-badge">Tác giả</span>' : ''}
            <span class="comment-time-badge">${timeAgoStr}</span>
          </div>

          <div class="comment-text-body">${escapeHtml(c.content)}</div>

          <div class="comment-actions-row">
            <button class="btn-like-comment ${isLiked ? 'liked' : ''}" onclick="commentService.toggleLike('${c.id}')" title="Thả tim bình luận">
              <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
              <span class="like-count">${c.likesCount || 0}</span>
            </button>

            ${isAuthor ? `
              <button class="btn-delete-comment" onclick="commentService.deleteComment('${c.id}')" title="Xóa bình luận của bạn">
                <i class="fas fa-trash-can"></i> <span>Xóa</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateCommentBadges(count) {
  const badge = document.getElementById('headerCommentBadge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  const modalTitleBadge = document.getElementById('modalCommentCountText');
  if (modalTitleBadge) {
    modalTitleBadge.textContent = `(${count})`;
  }
}

function openCommentModal() {
  let modal = document.getElementById('commentModal');
  if (modal) {
    modal.classList.add('active');
    syncCurrentUserAvatarToInput();
    const input = document.getElementById('commentInputTextarea');
    if (input) {
      setTimeout(() => input.focus(), 150);
    }
  }
}

function closeCommentModal() {
  const modal = document.getElementById('commentModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function syncCurrentUserAvatarToInput() {
  const user = (typeof authService !== 'undefined') ? authService.getUser() : null;
  const avatarEl = document.getElementById('commentCurrentAvatar');
  const nameEl = document.getElementById('commentCurrentName');
  if (user && user.uid) {
    if (avatarEl) avatarEl.src = user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`;
    if (nameEl) nameEl.textContent = user.displayName || user.email;
  } else {
    if (avatarEl) avatarEl.src = `https://api.dicebear.com/7.x/bottts/svg?seed=guest`;
    if (nameEl) nameEl.textContent = 'Khách vãng lai';
  }
}

function insertQuickSticker(text) {
  const input = document.getElementById('commentInputTextarea');
  if (!input) return;
  const currentVal = input.value;
  input.value = currentVal ? `${currentVal} ${text}` : text;
  input.focus();
}

function handleCommentSubmit(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('commentInputTextarea');
  if (!input) return;
  const text = input.value;
  commentService.postComment(text);
}

function clearCommentInput() {
  const input = document.getElementById('commentInputTextarea');
  if (input) input.value = '';
}

function showCommentLoading(isLoading) {
  const btn = document.getElementById('btnSubmitComment');
  if (btn) {
    btn.disabled = isLoading;
    btn.innerHTML = isLoading ? '<i class="fas fa-circle-notch fa-spin"></i> <span>Đang gửi...</span>' : '<i class="fas fa-paper-plane"></i> <span>Gửi Bình Luận</span>';
  }
}

function formatTimeAgo(timeVal) {
  if (!timeVal) return 'Vừa xong';
  const timestamp = typeof timeVal === 'number' ? timeVal : (timeVal.getTime ? timeVal.getTime() : Date.now());
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 30) return 'Vừa xong';
  if (diffSec < 60) return `${diffSec} giây trước`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;

  const d = new Date(timestamp);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// Global Export
window.commentService = commentService;
window.openCommentModal = openCommentModal;
window.closeCommentModal = closeCommentModal;
window.insertQuickSticker = insertQuickSticker;
window.handleCommentSubmit = handleCommentSubmit;
