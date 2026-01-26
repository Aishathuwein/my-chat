// ============================================
// FIREBASE CONFIGURATION
// ============================================

// 🔥 REPLACE WITH YOUR FIREBASE CONFIG!
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
    
    // Update connection status
    updateConnectionStatus('connected');
    
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    updateConnectionStatus('error');
    alert("Firebase failed to initialize. Check console for details.");
}

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence
db.enablePersistence()
    .then(() => {
        console.log("📦 Offline persistence enabled");
        logDebug("Offline mode enabled", "info");
    })
    .catch((err) => {
        console.log("📦 Persistence error:", err);
        if (err.code === 'failed-precondition') {
            logDebug("Multiple tabs open, persistence can only be enabled in one tab", "warning");
        } else if (err.code === 'unimplemented') {
            logDebug("Browser doesn't support persistence", "warning");
        }
    });

// Connection monitoring
let isOnline = navigator.onLine;
const connectionRef = db.collection('connections').doc('status');

// Monitor online/offline status
window.addEventListener('online', () => {
    isOnline = true;
    updateConnectionStatus('connected');
    logDebug("Online", "info");
});

window.addEventListener('offline', () => {
    isOnline = false;
    updateConnectionStatus('disconnected');
    logDebug("Offline", "warning");
});

// Monitor Firebase connection
db.enableNetwork()
    .then(() => {
        console.log("🌐 Firebase network enabled");
        updateConnectionStatus('connected');
    })
    .catch((err) => {
        console.error("🌐 Firebase network error:", err);
        updateConnectionStatus('error');
    });

// Helper functions
function updateConnectionStatus(status) {
    const dot = document.getElementById('connection-dot');
    const text = document.getElementById('connection-text');
    
    switch(status) {
        case 'connected':
            dot.className = 'connected';
            text.textContent = 'Connected';
            dot.style.animation = 'none';
            break;
        case 'connecting':
            dot.className = '';
            text.textContent = 'Connecting...';
            dot.style.animation = 'pulse 2s infinite';
            break;
        case 'disconnected':
            dot.className = '';
            text.textContent = 'Disconnected';
            dot.style.animation = 'pulse 1s infinite';
            break;
        case 'error':
            dot.className = '';
            text.textContent = 'Connection Error';
            dot.style.animation = 'pulse 0.5s infinite';
            break;
    }
}

function logDebug(message, type = 'info') {
    const debugContent = document.getElementById('debug-content');
    if (debugContent) {
        const item = document.createElement('div');
        item.className = `debug-item ${type}`;
        item.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        debugContent.appendChild(item);
        debugContent.scrollTop = debugContent.scrollHeight;
    }
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Export for use in app.js
window.auth = auth;
window.db = db;
window.storage = storage;
window.firebase = firebase;
window.logDebug = logDebug;
window.updateConnectionStatus = updateConnectionStatus;

console.log("✅ Firebase services ready");