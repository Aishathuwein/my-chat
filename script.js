// ============================
// INITIALIZE EVERYTHING
// ============================

// 1. Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// 2. Global Variables
let currentUser = null;

// ============================
// AUTHENTICATION FUNCTIONS
// ============================

async function toggleAuth() {
    if (currentUser) {
        // Logout
        await auth.signOut();
        showMessage('ai', 'You have been logged out. Messages are now temporary.');
    } else {
        // Login with Google
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await auth.signInWithPopup(provider);
            showMessage('ai', 'Welcome! Your messages will now be saved to your account.');
        } catch (error) {
            console.error('Login error:', error);
            showMessage('ai', 'Login failed. Please try again.');
        }
    }
}

// ============================
// MESSAGE FUNCTIONS
// ============================

async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Clear input
    input.value = '';
    adjustTextareaHeight(input);
    
    // Show user message
    showMessage('user', message);
    
    // Show typing indicator
    showTyping(true);
    
    try {
        // Get AI response
        const aiResponse = await getAIResponse(message);
        
        // Hide typing indicator
        showTyping(false);
        
        // Show AI response
        showMessage('ai', aiResponse);
        
        // Save to database if logged in
        if (currentUser) {
            await saveMessageToDB(message, aiResponse);
        }
    } catch (error) {
        console.error('Error:', error);
        showTyping(false);
        showMessage('ai', 'Sorry, I encountered an error. Please try again.');
    }
}

async function getAIResponse(userMessage) {
    // Replace with your OpenAI API key from Step 0.1
    const OPENAI_API_KEY = "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";
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful AI assistant. Keep responses concise and friendly."
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            max_tokens: 500
        })
    });
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

async function saveMessageToDB(userMsg, aiMsg) {
    try {
        await db.collection('chats').add({
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userMessage: userMsg,
            aiResponse: aiMsg,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('Message saved to database');
    } catch (error) {
        console.error('Error saving to DB:', error);
    }
}

// ============================
// UI FUNCTIONS
// ============================

function showMessage(sender, text) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageDiv.innerHTML = `
        <p>${formatMessage(text)}</p>
        <span class="message-time">${time}</span>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showTyping(show) {
    const typingDiv = document.getElementById('typing');
    typingDiv.style.display = show ? 'block' : 'none';
    if (show) {
        document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    }
}

function formatMessage(text) {
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
}

function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function suggestQuestion(question) {
    const input = document.getElementById('message-input');
    input.value = question;
    adjustTextareaHeight(input);
    input.focus();
}

function clearChat() {
    const messagesDiv = document.getElementById('messages');
    
    // Keep only the welcome message
    const welcomeMessage = messagesDiv.querySelector('.message.welcome');
    messagesDiv.innerHTML = '';
    
    if (welcomeMessage) {
        messagesDiv.appendChild(welcomeMessage);
    } else {
        // Add welcome message if not present
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'message welcome';
        welcomeDiv.innerHTML = '<p>👋 Chat cleared! How can I help you today?</p>';
        messagesDiv.appendChild(welcomeDiv);
    }
}

// ============================
// EVENT LISTENERS
// ============================

document.addEventListener('DOMContentLoaded', function() {
    // Setup event listeners
    document.getElementById('auth-btn').addEventListener('click', toggleAuth);
    
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        adjustTextareaHeight(this);
    });
    
    // Send on Enter (but allow Shift+Enter for new line)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Send button click
    sendBtn.addEventListener('click', sendMessage);
    
    // Auto-focus input
    setTimeout(() => {
        messageInput.focus();
    }, 500);
    
    // Firebase auth state listener
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        const authBtn = document.getElementById('auth-btn');
        const userEmailSpan = document.getElementById('user-email');
        
        if (user) {
            // User is signed in
            authBtn.textContent = 'Logout';
            userEmailSpan.textContent = user.email;
            userEmailSpan.style.color = '#4CAF50';
            
            // Load previous messages (optional)
            // loadPreviousMessages();
        } else {
            // User is signed out
            authBtn.textContent = 'Login with Google';
            userEmailSpan.textContent = 'Not logged in';
            userEmailSpan.style.color = '#666';
        }
    });
});