// ============================================
// FIREBASE CONFIGURATION FOR ZANZIBAR UNIVERSITY CHAT
// ============================================

// IMPORTANT: Replace with your actual Firebase config from console
const firebaseConfig = {
  apiKey: "AIzaSyA2z6IOIj5N-cDk76CxKNypzLtj5MOiMSo",
  authDomain: "zanzibar-university-chat.firebaseapp.com",
  projectId: "zanzibar-university-chat",
  storageBucket: "zanzibar-university-chat.firebasestorage.app",
  messagingSenderId: "343255573992",
  appId: "1:343255573992:web:098a49d6865ea1c5e8705d",
  measurementId: "G-Q16F2X404E"

};
const vapidKey = 'BA0cY9mtUzbVxQuBS70IcqSkqk-PKILTLUMQuz5II9vzzvcO3XYIsouaM-KH0uX6X9T_pxiofCUPyRl2CaKvb-Q';

console.log("🎓 Initializing Firebase for Zanzibar University Chat...");

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    if (error.code === 'app/duplicate-app') {
        console.log("Firebase already initialized");
    } else {
        showAppNotification("Firebase connection failed", "error");
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
            console.log("Multiple tabs open, persistence can only be enabled in one tab at a time.");
        } else if (err.code === 'unimplemented') {
            console.log("Browser doesn't support persistence");
        }
    });

// Helper function for notifications
function showNotification(title, type = "info", message = "") {
    if (typeof window.showAppNotification === 'function') {
        window.showAppNotification(title, type, message);
    } else {
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        // Fallback alert for critical errors
        if (type === 'error') {
            alert(`${title}: ${message}`);
        }
    }
}

// Export for use in other files
window.auth = auth;
window.db = db;
window.storage = storage;
window.firebase = firebase;
window.showFirebaseNotification = showNotification;

console.log("✅ Firebase services ready");