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
        firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase initialized successfully");
    } else {
        firebase.app(); // if already initialized, use that one
    }
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    showNotification("Firebase connection failed", "error");
}

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const messaging = firebase.messaging?.isSupported() ? firebase.messaging() : null;

// Enable offline persistence
db.enablePersistence()
    .then(() => {
        console.log("📦 Offline persistence enabled");
    })
    .catch((err) => {
        console.log("📦 Persistence error:", err);
    });

// Set Firestore settings
db.settings({
    ignoreUndefinedProperties: true
});

// Global notification function
function showNotification(title, type = "info", message = "") {
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    if (typeof window.showAppNotification === 'function') {
        window.showAppNotification(title, type, message);
    } else {
        // Create basic notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db'};
            color: white;
            border-radius: 5px;
            z-index: 9999;
            animation: fadeIn 0.3s;
        `;
        notification.innerHTML = `<strong>${title}</strong><br>${message}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Export for use in other files
window.auth = auth;
window.db = db;
window.storage = storage;
window.firebase = firebase;
window.showFirebaseNotification = showNotification;

console.log("✅ Firebase services ready");