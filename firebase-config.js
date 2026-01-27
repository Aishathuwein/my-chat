// ============================================
// FIREBASE CONFIGURATION FOR ZU CHAT
// ============================================

// Replace with your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyCxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "zu-chat-app.firebaseapp.com",
    projectId: "zu-chat-app",
    storageBucket: "zu-chat-app.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};

console.log("🚀 Initializing Firebase for ZU Chat...");

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    alert("Firebase connection failed. Please refresh the page.");
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const messaging = firebase.messaging();

// Enable offline persistence
db.enablePersistence()
    .then(() => {
        console.log("📦 Offline persistence enabled");
    })
    .catch((err) => {
        console.log("📦 Persistence failed:", err.code);
        if (err.code === 'failed-precondition') {
            console.log("Multiple tabs open. Persistence enabled only in one tab.");
        } else if (err.code === 'unimplemented') {
            console.log("Browser doesn't support persistence.");
        }
    });

// Request notification permission
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
    }
    
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('Notification permission granted');
            // Get FCM token
            messaging.getToken().then((token) => {
                console.log('FCM Token:', token);
                // Save token to user's document
                if (window.currentUser) {
                    db.collection('users').doc(window.currentUser.uid).update({
                        fcmToken: token,
                        notificationEnabled: true
                    });
                }
            });
        }
    });
}

// Handle incoming messages
messaging.onMessage((payload) => {
    console.log('Message received:', payload);
    
    // Show notification
    if (Notification.permission === 'granted') {
        const notification = new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: 'https://via.placeholder.com/64/0056A4/ffffff?text=ZU',
            badge: 'https://via.placeholder.com/64/0056A4/ffffff?text=ZU'
        });
        
        notification.onclick = function(event) {
            event.preventDefault();
            window.focus();
            notification.close();
        };
    }
});

// Firebase Cloud Messaging setup
function setupFCM() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then((registration) => {
                messaging.useServiceWorker(registration);
                console.log('Service Worker registered for FCM');
            })
            .catch((err) => {
                console.log('Service Worker registration failed:', err);
            });
    }
}

// Initialize FCM after user login
function initFCMForUser(userId) {
    if (userId && 'Notification' in window) {
        requestNotificationPermission();
        setupFCM();
    }
}

// Export services for global access
window.auth = auth;
window.db = db;
window.storage = storage;
window.messaging = messaging;
window.firebase = firebase;
window.initFCMForUser = initFCMForUser;
window.requestNotificationPermission = requestNotificationPermission;

// Helper function to show Firebase errors
window.showFirebaseError = function(error) {
    console.error('Firebase Error:', error);
    
    let message = 'An error occurred';
    if (error.code) {
        switch (error.code) {
            case 'permission-denied':
                message = 'Permission denied. Please check your security rules.';
                break;
            case 'unavailable':
                message = 'Service unavailable. Please check your internet connection.';
                break;
            case 'not-found':
                message = 'Document not found. It may have been deleted.';
                break;
            default:
                message = error.message || 'Unknown error occurred';
        }
    }
    
    if (window.showNotification) {
        window.showNotification('Error', 'error', message);
    } else {
        alert(message);
    }
};

console.log("✅ Firebase services ready");