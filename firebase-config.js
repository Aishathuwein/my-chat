// ============================================
// FIREBASE CONFIGURATION - COMPLETE & FIXED
// ============================================

// IMPORTANT: REPLACE THESE VALUES WITH YOUR OWN FROM FIREBASE CONSOLE
const firebaseConfig = {
      apiKey: "AIzaSyB-2B87cK9ukzv9HUbWX7yYZFpSpolw1e4",
  authDomain: "my-chat-app-e1a85.firebaseapp.com",
  databaseURL: "https://my-chat-app-e1a85-default-rtdb.firebaseio.com",
  projectId: "my-chat-app-e1a85",
  storageBucket: "my-chat-app-e1a85.firebasestorage.app",
  messagingSenderId: "1018726193704",
  appId: "1:1018726193704:web:58ff7905d107248e86331d"

};

console.log("🔥 Initializing Firebase...");

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized successfully");
    
    // Show notification if app is loaded
    if (typeof showNotification === 'function') {
        showNotification("Firebase Connected", "success");
    }
    
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    
    // Show error notification
    if (typeof showNotification === 'function') {
        showNotification("Firebase connection failed", "error", error.message);
    } else {
        alert("Firebase failed to initialize. Please check your configuration.\nError: " + error.message);
    }
}

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage(); // Added for file/audio sharing

console.log("✅ Firebase services initialized");

// Enable offline persistence for better user experience
db.enablePersistence()
    .then(() => {
        console.log("📦 Offline persistence enabled");
        if (typeof showNotification === 'function') {
            showNotification("Offline mode enabled", "info");
        }
    })
    .catch((err) => {
        console.log("📦 Persistence failed:", err);
        if (err.code === 'failed-precondition') {
            console.log("Multiple tabs open, persistence can only be enabled in one tab at a time.");
        } else if (err.code === 'unimplemented') {
            console.log("The current browser doesn't support persistence.");
        }
    });

// Set Firestore settings for better performance
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Helper function to check if user is online
function checkNetworkStatus() {
    const status = navigator.onLine ? 'online' : 'offline';
    console.log("🌐 Network status:", status);
    return navigator.onLine;
}

// Network status monitoring
window.addEventListener('online', () => {
    console.log("🌐 App is back online");
    if (typeof showNotification === 'function') {
        showNotification("Back online", "success");
    }
});

window.addEventListener('offline', () => {
    console.log("🌐 App is offline");
    if (typeof showNotification === 'function') {
        showNotification("You are offline", "warning", "Messages will be sent when you reconnect");
    }
});

// Initialize network status
checkNetworkStatus();

// Export for use in other files
window.auth = auth;
window.db = db;
window.storage = storage;
window.firebase = firebase;
window.checkNetworkStatus = checkNetworkStatus;

// Simple notification function (in case app.js hasn't loaded yet)
window.showFirebaseNotification = function(title, type = "info", message = "") {
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    
    // Try to use app's notification system if available
    if (typeof showNotification === 'function') {
        showNotification(title, type, message);
    } else {
        // Fallback to console and alert for critical errors
        if (type === 'error') {
            alert(`${title}: ${message}`);
        }
    }
};

// Test Firebase connection
async function testFirebaseConnection() {
    console.log("🔍 Testing Firebase connection...");
    
    try {
        // Test Firestore connection
        const testRef = db.collection('test_connection').doc('ping');
        await testRef.set({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            test: "Firebase is working"
        });
        
        console.log("✅ Firestore connection test passed");
        
        // Test Storage connection
        const storageRef = storage.ref('test/test.txt');
        const testBlob = new Blob(['Firebase Storage Test'], { type: 'text/plain' });
        
        console.log("✅ Firebase services are ready");
        return true;
        
    } catch (error) {
        console.error("❌ Firebase connection test failed:", error);
        window.showFirebaseNotification("Firebase Error", "error", error.message);
        return false;
    }
}

// Run connection test after a short delay
setTimeout(() => {
    if (window.location.href.includes('chat-screen') || document.getElementById('chat-screen')) {
        testFirebaseConnection();
    }
}, 3000);

// Helper function to get current user's UID safely
window.getCurrentUserId = function() {
    if (auth.currentUser) {
        return auth.currentUser.uid;
    }
    return null;
};

// Helper function to check if user is authenticated
window.isUserAuthenticated = function() {
    return auth.currentUser !== null;
};

// Firebase error handler
window.handleFirebaseError = function(error, context = "") {
    console.error(`❌ Firebase Error [${context}]:`, error);
    
    let userMessage = "An error occurred";
    
    // Common Firebase error codes
    switch (error.code) {
        case 'permission-denied':
            userMessage = "You don't have permission to perform this action";
            break;
        case 'unavailable':
            userMessage = "Service is temporarily unavailable. Please check your internet connection";
            break;
        case 'failed-precondition':
            userMessage = "Operation failed. Please refresh the page";
            break;
        case 'already-exists':
            userMessage = "This item already exists";
            break;
        case 'not-found':
            userMessage = "Requested item was not found";
            break;
        default:
            userMessage = error.message || "An unexpected error occurred";
    }
    
    if (typeof showNotification === 'function') {
        showNotification("Error", "error", userMessage);
    }
    
    return userMessage;
};

// Initialize Firebase Auth state listener (basic version)
auth.onAuthStateChanged((user) => {
    console.log("👤 Auth state changed:", user ? `User ${user.email} logged in` : "No user");
    
    // Update UI if elements exist
    if (user) {
        // User is signed in
        if (document.getElementById('user-name')) {
            document.getElementById('user-name').textContent = user.displayName || user.email.split('@')[0];
        }
        
        // Set user avatar if element exists
        const avatar = document.getElementById('user-avatar');
        if (avatar) {
            if (user.photoURL) {
                avatar.style.backgroundImage = `url(${user.photoURL})`;
                avatar.style.backgroundSize = 'cover';
                avatar.innerHTML = '';
            } else {
                const initial = (user.displayName || user.email).charAt(0).toUpperCase();
                avatar.innerHTML = `<i class="fas fa-user"></i>`;
                avatar.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }
        }
    } else {
        // User is signed out
        if (document.getElementById('auth-screen')) {
            document.getElementById('auth-screen').style.display = 'flex';
        }
        if (document.getElementById('chat-screen')) {
            document.getElementById('chat-screen').style.display = 'none';
        }
    }
});

// Firebase performance monitoring (optional)
if (typeof firebase.performance !== 'undefined') {
    const perf = firebase.performance();
    console.log("📊 Firebase Performance Monitoring enabled");
}


console.log("🚀 Firebase configuration complete and ready!");
