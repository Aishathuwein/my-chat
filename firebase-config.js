// ============================================
// FIREBASE CONFIGURATION
// REPLACE THESE VALUES WITH YOUR OWN FROM FIREBASE
// ============================================

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-2B87cK9ukzv9HUbWX7yYZFpSpolw1e4",
  authDomain: "my-chat-app-e1a85.firebaseapp.com",
  databaseURL: "https://my-chat-app-e1a85-default-rtdb.firebaseio.com",
  projectId: "my-chat-app-e1a85",
  storageBucket: "my-chat-app-e1a85.firebasestorage.app",
  messagingSenderId: "1018726193704",
  appId: "1:1018726193704:web:58ff7905d107248e86331d"

};

console.log("Initializing Firebase...");

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    alert("Firebase failed to initialize. Please check your configuration.");
}

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence().catch((err) => {
    console.log("Persistence failed:", err);
});

console.log("✅ Firebase services initialized");

// Export for use in other files
window.auth = auth;
window.db = db;
window.firebase = firebase;