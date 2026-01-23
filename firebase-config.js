// REPLACE WITH YOUR ACTUAL FIREBASE CONFIG
const firebaseConfig = {
 apiKey: "AIzaSyB-2B87cK9ukzv9HUbWX7yYZFpSpolw1e4",
  authDomain: "my-chat-app-e1a85.firebaseapp.com",
  databaseURL: "https://my-chat-app-e1a85-default-rtdb.firebaseio.com",
  projectId: "my-chat-app-e1a85",
  storageBucket: "my-chat-app-e1a85.firebasestorage.app",
  messagingSenderId: "1018726193704",
  appId: "1:1018726193704:web:58ff7905d107248e86331d"

};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Create main collections if they don't exist
async function initializeDatabase() {
    // We'll create collections on first use
}

// Make auth and db available globally
window.auth = auth;
window.db = db;
window.firebase = firebase;