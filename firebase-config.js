// ============================================
// FIREBASE CONFIGURATION - UNIVERSITY CHAT
// ============================================

// 🔥 REPLACE THESE VALUES WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyB-2B87cK9ukzv9HUbWX7yYZFpSpolw1e4",
  authDomain: "my-chat-app-e1a85.firebaseapp.com",
  databaseURL: "https://my-chat-app-e1a85-default-rtdb.firebaseio.com",
  projectId: "my-chat-app-e1a85",
  storageBucket: "my-chat-app-e1a85.firebasestorage.app",
  messagingSenderId: "1018726193704",
  appId: "1:1018726193704:web:58ff7905d107248e86331d"

};

console.log("🚀 Initializing Firebase...");

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    alert("Firebase failed to initialize. Please check your internet connection.");
}

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence
db.enablePersistence()
    .then(() => {
        console.log("📦 Offline persistence enabled");
    })
    .catch((err) => {
        console.log("📦 Persistence failed:", err);
        if (err.code === 'failed-precondition') {
            console.log("Multiple tabs open, persistence can only be enabled in one tab at a time.");
        } else if (err.code === 'unimplemented') {
            console.log("The current browser doesn't support persistence.");
        }
    });

// Export for global access
window.auth = auth;
window.db = db;
window.storage = storage;
window.firebase = firebase;

console.log("✅ Firebase services ready");