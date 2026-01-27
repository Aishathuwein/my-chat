// ============================================
// FIREBASE CONFIGURATION - UNIVERSITY CHAT
// ============================================

// 🔥 REPLACE THESE VALUES WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
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