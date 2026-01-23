// Paste your Firebase config here
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
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