// ============================================
// FIREBASE CONFIGURATION FOR ZANZIBAR UNIVERSITY CHAT
// ============================================

// IMPORTANT: Replace with your actual Firebase config from console
const firebaseConfig = {
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
  apiKey: "AIzaSyCRP1WfiwHSrjtjudC6D9OGgNgrXQkiI5Q",
  authDomain: "zanzibar-university-chat.firebaseapp.com",
  projectId: "zanzibar-university-chat",
  storageBucket: "zanzibar-university-chat.firebasestorage.app",
  messagingSenderId: "343255573992",
  appId: "1:343255573992:web:098a49d6865ea1c5e8705d",
  measurementId: "G-Q16F2X404E"


};

console.log("🎓 Initializing Zanzibar University Chat...");

// Initialize Firebase
try {
    if (!firebase.apps.length) {
        const app = firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase initialized successfully:", app.name);
    }
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    if (typeof showNotification === 'function') {
        showNotification("Firebase connection failed", "error");
    }
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
        console.log("📦 Persistence error:", err.code);
        if (err.code === 'failed-precondition') {
            console.log("Multiple tabs open");
        } else if (err.code === 'unimplemented') {
            console.log("Browser doesn't support persistence");
        }
    });

// Set Firestore settings for better performance
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    ignoreUndefinedProperties: true
});

// Export for use in other files
window.auth = auth;
window.db = db;
window.storage = storage;
window.firebase = firebase;

console.log("✅ Firebase services ready");