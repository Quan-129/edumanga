/* ==========================================================================
   EDUMANGA HUB - FIREBASE CONFIGURATION & INITIALIZATION ENGINE
   Google Firebase Authentication & Cloud Firestore Multi-Tenant Setup
   ========================================================================== */

// 1. Firebase Project Configuration
// Thay thế các giá trị dưới đây bằng thông tin từ Firebase Console của bạn
// (Xem hướng dẫn chi tiết tại docs/HUONG_DAN_FIREBASE_DEPLOY.md)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDgokRYhM9kaCBNluYAWXgPLUum_qITXNY",
  authDomain: "edumanga-hub.firebaseapp.com",
  projectId: "edumanga-hub",
  storageBucket: "edumanga-hub.firebasestorage.app",
  messagingSenderId: "583168035764",
  appId: "1:583168035764:web:c008d52ff94501bb9900e1",
  measurementId: "G-LQRTQK6P85"
};

// 2. Global State & Service References
let firebaseApp = null;
let firebaseAuth = null;
let firestoreDb = null;
let googleAuthProvider = null;
let isFirebaseInitialized = false;

// Check if Firebase configuration has been filled by user
function checkIsFirebaseConfigured() {
  return FIREBASE_CONFIG.apiKey && 
         FIREBASE_CONFIG.apiKey !== "YOUR_FIREBASE_API_KEY" && 
         FIREBASE_CONFIG.projectId !== "YOUR_PROJECT_ID";
}

// 3. Initialize Firebase Services
function initFirebaseApp() {
  if (typeof firebase === 'undefined') {
    console.warn("⚠️ Firebase SDK not loaded from CDN. Running in offline/guest mode.");
    return false;
  }

  try {
    if (!firebase.apps.length) {
      // Use config if provided, otherwise initialize demo/fallback instance
      if (checkIsFirebaseConfigured()) {
        firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
        console.log("🔥 Google Firebase initialized successfully with production config!");
      } else {
        console.info("ℹ️ Firebase API keys not yet configured. App is running in Local-First Guest Mode.");
        return false;
      }
    } else {
      firebaseApp = firebase.app();
    }

    // Initialize Auth & Firestore
    firebaseAuth = firebase.auth();
    firestoreDb = firebase.firestore();
    
    // Enable offline persistence in Firestore (Local-first cache)
    firestoreDb.enablePersistence({ synchronizeTabs: true }).catch(err => {
      if (err.code === 'failed-precondition') {
        console.warn("Firestore persistence: Multiple tabs open, persistence enabled in first tab only.");
      } else if (err.code === 'unimplemented') {
        console.warn("Firestore persistence: Browser does not support IndexedDB persistence.");
      }
    });

    // Google Auth Provider Setup
    googleAuthProvider = new firebase.auth.GoogleAuthProvider();
    googleAuthProvider.addScope('profile');
    googleAuthProvider.addScope('email');

    isFirebaseInitialized = true;
    return true;
  } catch (error) {
    console.warn("⚠️ Firebase initialization warning:", error.message);
    return false;
  }
}

// Auto-run initialization when script loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initFirebaseApp();
  });
}
