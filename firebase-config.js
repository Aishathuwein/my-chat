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


console.log("🎓 Initializing Firebase...");

// Initialize Firebase
try {
    // Check if already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase initialized successfully");
    } else {
        console.log("✅ Firebase already initialized");
    }
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    alert("Firebase failed to initialize. Please check your configuration.");
}

// Initialize services with error handling
let auth, db, storage;
try {
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    console.log("✅ Firebase services initialized");
} catch (error) {
    console.error("❌ Failed to initialize services:", error);
    alert("Failed to initialize Firebase services");
}

// Set Firestore settings for better performance
if (db) {
    db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        ignoreUndefinedProperties: true
    });

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
}

// Helper function for notifications
function showNotification(title, type = "info", message = "") {
    if (typeof window.showAppNotification === 'function') {
        window.showAppNotification(title, type, message);
    } else {
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        // Simple alert for critical errors during setup
        if (type === 'error' && message.includes('Firebase')) {
            setTimeout(() => alert(`${title}: ${message}`), 1000);
        }
    }
}

// Export for use in other files
window.auth = auth;
window.db = db;
window.storage = storage;
window.firebase = firebase;
window.showFirebaseNotification = showNotification;

console.log("✅ Firebase setup complete");