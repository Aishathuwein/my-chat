// ============================================
// FIREBASE CONFIGURATION - University Chat
// ============================================

// IMPORTANT: Replace with your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-2B87cK9ukzv9HUbWX7yYZFpSpolw1e4",
  authDomain: "my-chat-app-e1a85.firebaseapp.com",
  databaseURL: "https://my-chat-app-e1a85-default-rtdb.firebaseio.com",
  projectId: "my-chat-app-e1a85",
  storageBucket: "my-chat-app-e1a85.firebasestorage.app",
  messagingSenderId: "1018726193704",
  appId: "1:1018726193704:web:58ff7905d107248e86331d",
  measurementId: "G-MEASUREMENT_ID" // Optional
};

console.log("🎓 University Chat - Initializing Firebase...");

// Initialize Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase initialized successfully");
        
        // Show notification
        showNotification("Firebase Connected", "success", "Welcome to University Chat!");
    } else {
        console.log("ℹ️ Firebase already initialized");
    }
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    showNotification("Connection Error", "error", "Failed to connect to Firebase");
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
        showNotification("Offline Mode", "info", "You can now use chat offline");
    })
    .catch((err) => {
        console.log("📦 Persistence warning:", err);
        if (err.code === 'failed-precondition') {
            console.log("Multiple tabs open - persistence enabled in first tab only");
        } else if (err.code === 'unimplemented') {
            console.log("Browser doesn't support persistence");
        }
    });

// Firebase performance monitoring (optional)
if (firebase.performance) {
    const perf = firebase.performance();
    console.log("📊 Performance monitoring enabled");
}

// Firebase analytics (optional)
if (firebase.analytics) {
    const analytics = firebase.analytics();
    analytics.logEvent('app_initialized');
    console.log("📈 Analytics enabled");
}

// Request notification permission
function requestNotificationPermission() {
    console.log("🔔 Requesting notification permission...");
    
    if (!("Notification" in window)) {
        console.log("This browser does not support notifications");
        return;
    }
    
    if (Notification.permission === "granted") {
        console.log("Notification permission already granted");
        setupFCM();
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Notification permission granted");
                setupFCM();
            }
        });
    }
}

// Setup Firebase Cloud Messaging
function setupFCM() {
    if (!messaging) return;
    
    // Get FCM token
    messaging.getToken({ vapidKey: "YOUR_VAPID_KEY_HERE" })
        .then((currentToken) => {
            if (currentToken) {
                console.log("FCM Token:", currentToken);
                // Send token to your server or save in Firestore
                if (auth.currentUser) {
                    db.collection('users').doc(auth.currentUser.uid).update({
                        fcmToken: currentToken,
                        notificationEnabled: true
                    });
                }
            } else {
                console.log('No registration token available.');
            }
        })
        .catch((err) => {
            console.log('An error occurred while retrieving token:', err);
        });
    
    // Handle incoming messages
    messaging.onMessage((payload) => {
        console.log('Message received:', payload);
        
        // Show notification
        if (Notification.permission === "granted") {
            const title = payload.notification?.title || "New Message";
            const options = {
                body: payload.notification?.body || "You have a new message",
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: 'chat-message',
                renotify: true,
                data: payload.data || {}
            };
            
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, options);
            });
        }
    });
}

// Initialize notifications when user is logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        setTimeout(requestNotificationPermission, 2000);
    }
});

// Helper function for notifications
function showNotification(title, type = "info", message = "") {
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                            type === 'error' ? 'exclamation-circle' : 
                            type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    const container = document.getElementById('notifications-container');
    if (container) {
        container.appendChild(notification);
        
        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
}

// Database initialization function
async function initializeDatabase() {
    console.log("🗄️ Initializing database structure...");
    
    try {
        // Create default collections if needed
        const collections = ['users', 'messages', 'chats', 'groups'];
        
        for (const collectionName of collections) {
            // Just try to read to see if collection exists
            const snapshot = await db.collection(collectionName).limit(1).get();
            console.log(`✅ Collection "${collectionName}" exists`);
        }
        
        // Create global chat if it doesn't exist
        const globalChatRef = db.collection('chats').doc('global');
        const globalChat = await globalChatRef.get();
        
        if (!globalChat.exists) {
            await globalChatRef.set({
                id: 'global',
                type: 'group',
                name: 'Global Chat',
                description: 'University-wide chat room',
                createdBy: 'system',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                participants: ['all'],
                isPublic: true,
                settings: {
                    allowMedia: true,
                    allowAudio: true,
                    allowFiles: true,
                    maxFileSize: 10485760 // 10MB
                }
            });
            console.log("✅ Created global chat");
        }
        
        // Create welcome message
        const welcomeMessage = await db.collection('messages')
            .where('chatId', '==', 'global')
            .where('type', '==', 'system')
            .limit(1)
            .get();
        
        if (welcomeMessage.empty) {
            await db.collection('messages').add({
                chatId: 'global',
                type: 'system',
                text: 'Welcome to University Global Chat! Start connecting with students and faculty.',
                senderId: 'system',
                senderName: 'System',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("✅ Added welcome message");
        }
        
    } catch (error) {
        console.error("❌ Database initialization error:", error);
    }
}

// Call database initialization
initializeDatabase();

// Utility functions
function generateChatId(user1, user2) {
    return [user1, user2].sort().join('_');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(date) {
    if (!date) return 'Just now';
    
    const now = new Date();
    const msgDate = date.toDate ? date.toDate() : new Date(date);
    const diff = now - msgDate;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return msgDate.toLocaleDateString([], { weekday: 'short' });
    
    return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Export for use in other files
window.auth = auth;
window.db = db;
window.storage = storage;
window.messaging = messaging;
window.firebase = firebase;
window.showNotification = showNotification;
window.generateChatId = generateChatId;
window.formatFileSize = formatFileSize;
window.formatTime = formatTime;

console.log("✅ Firebase configuration complete");