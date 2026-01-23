// Paste your Firebase config here
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
const auth = firebase.auth();
const db = firebase.firestore();

// Authentication functions
async function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        alert('Account created!');
    } catch (error) {
        alert(error.message);
    }
}

async function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        alert(error.message);
    }
}

async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        alert(error.message);
    }
}

function signOut() {
    auth.signOut();
}

// Chat functions
async function sendMessage() {
    const user = auth.currentUser;
    if (!user) return;
    
    const message = document.getElementById('message').value;
    if (message.trim() === '') return;
    
    await db.collection('messages').add({
        text: message,
        uid: user.uid,
        displayName: user.displayName || user.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    document.getElementById('message').value = '';
}

// Listen for messages
db.collection('messages')
    .orderBy('timestamp', 'asc')
    .onSnapshot(snapshot => {
        const messagesDiv = document.getElementById('messages');
        messagesDiv.innerHTML = '';
        
        snapshot.forEach(doc => {
            const msg = doc.data();
            const msgElement = document.createElement('div');
            msgElement.className = 'message';
            msgElement.innerHTML = `<strong>${msg.displayName}:</strong> ${msg.text}`;
            messagesDiv.appendChild(msgElement);
        });
        
        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });

// Auth state listener
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('chat-screen').style.display = 'block';
    } else {
        document.getElementById('auth-screen').style.display = 'block';
        document.getElementById('chat-screen').style.display = 'none';
    }
});