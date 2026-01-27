importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || 'University Chat';
    const notificationOptions = {
        body: payload.notification?.body || 'New message received',
        icon: 'https://ui-avatars.com/api/?name=ZU&background=1a237e&color=ffd700&size=192',
        badge: 'https://ui-avatars.com/api/?name=ZU&background=1a237e&color=ffd700&size=96',
        data: payload.data || {}
    };
    
    self.registration.showNotification(notificationTitle, notificationOptions);
});