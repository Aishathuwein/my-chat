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

}

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const messaging = firebase.messaging();

// Enable offline persistence
db.enablePersistence().catch((err) => {
    console.log("Persistence error: ", err.code);
});

// Export for use in other files
window.firebase = firebase;
window.auth = auth;
window.db = db;
window.storage = storage;
window.messaging = messaging;