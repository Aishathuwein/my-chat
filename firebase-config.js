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
vapidKey: 'BA0cY9mtUzbVxQuBS70IcqSkqk-PKILTLUMQuz5II9vzzvcO3XYIsouaM-KH0uX6X9T_pxiofCUPyRl2CaKvb-Q' 

console.log("🎓 Initializing Zanzibar University Chat...");

// Initialize Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase initialized successfully");
    } else {
        firebase.app();
        console.log("✅ Firebase already initialized");
    }
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    showNotification("Firebase connection failed", "error");
}

// Initialize services
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
        console.log("📦 Persistence error:", err.code);
        if (err.code === 'failed-precondition') {
            console.log("Multiple tabs open");
        } else if (err.code === 'unimplemented') {
            console.log("Browser doesn't support persistence");
        }
    });

// Set Firestore settings for better performance
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Request notification permission
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log("This browser doesn't support notifications");
        return;
    }
    
    if (Notification.permission === 'granted') {
        console.log("Notification permission already granted");
        return;
    }
    
    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log("Notification permission granted");
                getFCMToken();
            }
        });
    }
}

// Get FCM token for notifications
async function getFCMToken() {
    try {
        const token = await messaging.getToken({
            vapidKey: 'YOUR_VAPID_KEY_HERE' // Optional: Get from Firebase Console > Cloud Messaging
        });
        if (token) {
            console.log("FCM Token:", token);
            // Save token to user's document in Firestore
            if (auth.currentUser) {
                await db.collection('users').doc(auth.currentUser.uid).update({
                    fcmToken: token,
                    notificationEnabled: true
                });
            }
        }
    } catch (error) {
        console.error("Error getting FCM token:", error);
    }
}

// Handle incoming messages
messaging.onMessage((payload) => {
    console.log("Message received:", payload);
    
    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new message',
        icon: 'https://via.placeholder.com/64/0a3d62/ffffff?text=ZU',
        badge: 'https://via.placeholder.com/64/0a3d62/ffffff?text=ZU',
        tag: 'chat-notification',
        renotify: true,
        requireInteraction: true,
        data: payload.data || {}
    };
    
    // Show notification
    if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(notificationTitle, notificationOptions);
        });
    }
    
    // Also show in-app notification
    if (window.showAppNotification) {
        showAppNotification(notificationTitle, 'info', payload.notification?.body);
    }
});

// Helper function to show notifications
function showNotification(title, type = "info", message = "") {
    if (typeof window.showAppNotification === 'function') {
        window.showAppNotification(title, type, message);
    } else {
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    }
}

// Export for use in other files
window.auth = auth;
window.db = db;
window.storage = storage;
window.messaging = messaging;
window.firebase = firebase;
window.showFirebaseNotification = showNotification;

// Request notification permission on load
setTimeout(requestNotificationPermission, 3000);

console.log("✅ Firebase services ready for Zanzibar University Chat");