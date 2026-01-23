// ============================================
// MAIN CHAT APPLICATION
// ============================================

console.log("Chat app starting...");

// Global variables
let currentUser = null;
let currentChatType = 'group'; // 'group' or 'private'
let currentChatId = 'global'; // Current chat ID
let currentRecipientId = null;
let onlineUsers = {};
let groups = [];

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');
const messageInput = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const onlineUsersList = document.getElementById('online-users-list');
const groupsList = document.getElementById('groups-list');
const chatTitle = document.getElementById('chat-title');
const chatInfo = document.getElementById('chat-info');

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, setting up app...");
    
    // Setup all event listeners
    setupEventListeners();
    
    // Check auth state
    checkAuthState();
    
    console.log("App setup complete!");
});

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Auth buttons
    document.getElementById('signup-btn').addEventListener('click', signUp);
    document.getElementById('signin-btn').addEventListener('click', signIn);
    document.getElementById('google-btn').addEventListener('click', signInWithGoogle);
    document.getElementById('logout-btn').addEventListener('click', signOut);
    
    // Chat type buttons
    document.getElementById('group-chat-btn').addEventListener('click', showGroupChat);
    document.getElementById('private-chat-btn').addEventListener('click', showPrivateChat);
    
    // Message input
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Group buttons
    document.getElementById('create-group-btn').addEventListener('click', showCreateGroupModal);
    document.getElementById('create-group-submit').addEventListener('click', createGroup);
    document.querySelector('.close-modal').addEventListener('click', closeCreateGroupModal);
    
    // Close modal when clicking outside
    document.getElementById('create-group-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCreateGroupModal();
        }
    });
    
    console.log("✅ Event listeners setup complete");
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function checkAuthState() {
    auth.onAuthStateChanged(function(user) {
        console.log("Auth state changed:", user ? user.email : "No user");
        
        if (user) {
            // User is signed in
            currentUser = user;
            showChatScreen();
            updateUserProfile(user);
            setupUserPresence(user);
            loadInitialData();
        } else {
            // No user is signed in
            showAuthScreen();
        }
    });
}

async function signUp() {
    console.log("Sign Up clicked");
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }
    
    try {
        console.log("Creating user:", email);
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update profile
        await userCredential.user.updateProfile({
            displayName: email.split('@')[0]
        });
        
        console.log("✅ User created:", userCredential.user.uid);
        alert("Account created successfully!");
        
    } catch (error) {
        console.error("❌ Sign up error:", error);
        alert("Error: " + error.message);
    }
}

async function signIn() {
    console.log("Sign In clicked");
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }
    
    try {
        console.log("Signing in:", email);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log("✅ Signed in:", userCredential.user.email);
        
    } catch (error) {
        console.error("❌ Sign in error:", error);
        alert("Error: " + error.message);
    }
}

async function signInWithGoogle() {
    console.log("Google Sign In clicked");
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        const result = await auth.signInWithPopup(provider);
        console.log("✅ Google sign in successful:", result.user.email);
    } catch (error) {
        console.error("❌ Google sign in error:", error);
        alert("Error: " + error.message);
    }
}

async function signOut() {
    console.log("Sign Out clicked");
    
    try {
        // Update user status before signing out
        if (currentUser) {
            await db.collection('users').doc(currentUser.uid).update({
                isOnline: false,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        await auth.signOut();
        console.log("✅ Signed out successfully");
    } catch (error) {
        console.error("❌ Sign out error:", error);
    }
}

// ============================================
// UI MANAGEMENT FUNCTIONS
// ============================================

function showAuthScreen() {
    console.log("Showing auth screen");
    authScreen.style.display = 'flex';
    chatScreen.style.display = 'none';
    currentUser = null;
}

function showChatScreen() {
    console.log("Showing chat screen");
    authScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
}

function updateUserProfile(user) {
    console.log("Updating user profile");
    
    const displayName = user.displayName || user.email.split('@')[0];
    userName.textContent = displayName;
    userAvatar.textContent = displayName.charAt(0).toUpperCase();
    
    // Set random avatar color
    const colors = ['#667eea', '#764ba2', '#f56565', '#ed8936', '#ecc94b', '#48bb78', '#38b2ac'];
    userAvatar.style.background = colors[displayName.length % colors.length];
}

// ============================================
// DATABASE FUNCTIONS
// ============================================

function setupUserPresence(user) {
    console.log("Setting up user presence:", user.uid);
    
    const userRef = db.collection('users').doc(user.uid);
    
    // Set user as online
    userRef.set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        isOnline: true,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Update to offline when user disconnects
    window.addEventListener('beforeunload', function() {
        userRef.update({
            isOnline: false,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
    });
}

function loadInitialData() {
    console.log("Loading initial data...");
    
    // Load online users
    loadOnlineUsers();
    
    // Load groups
    loadGroups();
    
    // Load global chat messages
    loadMessages();
}

function loadOnlineUsers() {
    console.log("Loading online users...");
    
    // Clear current list
    onlineUsersList.innerHTML = '<div class="loading">Loading users...</div>';
    
    // Listen for online users
    db.collection('users')
        .where('uid', '!=', currentUser.uid)
        .onSnapshot(function(snapshot) {
            onlineUsersList.innerHTML = '';
            onlineUsers = {};
            
            snapshot.forEach(function(doc) {
                const user = doc.data();
                onlineUsers[user.uid] = user;
                
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                userItem.dataset.userId = user.uid;
                userItem.innerHTML = `
                    <i class="fas fa-user-circle"></i>
                    <div>
                        <div>${user.displayName}</div>
                        <small style="color: ${user.isOnline ? '#48bb78' : '#a0aec0'}">
                            ${user.isOnline ? 'Online' : 'Offline'}
                        </small>
                    </div>
                `;
                
                userItem.addEventListener('click', function() {
                    startPrivateChat(user.uid, user.displayName);
                });
                
                onlineUsersList.appendChild(userItem);
            });
            
            if (snapshot.empty) {
                onlineUsersList.innerHTML = '<div class="no-users">No other users online</div>';
            }
        });
}

function loadGroups() {
    console.log("Loading groups...");
    
    // Listen for user's groups
    db.collection('groups')
        .where('members', 'array-contains', currentUser.uid)
        .onSnapshot(function(snapshot) {
            groupsList.innerHTML = '';
            groups = [];
            
            // Always show global chat
            const globalItem = document.createElement('div');
            globalItem.className = `group-item ${currentChatId === 'global' ? 'active' : ''}`;
            globalItem.dataset.groupId = 'global';
            globalItem.innerHTML = `
                <i class="fas fa-globe"></i>
                <span>Global Chat</span>
            `;
            
            globalItem.addEventListener('click', function() {
                switchToChat('global', 'Global Chat');
            });
            
            groupsList.appendChild(globalItem);
            
            // Add other groups
            snapshot.forEach(function(doc) {
                const group = {
                    id: doc.id,
                    ...doc.data()
                };
                groups.push(group);
                
                const groupItem = document.createElement('div');
                groupItem.className = `group-item ${currentChatId === group.id ? 'active' : ''}`;
                groupItem.dataset.groupId = group.id;
                groupItem.innerHTML = `
                    <i class="fas fa-users"></i>
                    <div>
                        <div>${group.name}</div>
                        <small>${group.members ? group.members.length : 0} members</small>
                    </div>
                `;
                
                groupItem.addEventListener('click', function() {
                    switchToChat(group.id, group.name);
                });
                
                groupsList.appendChild(groupItem);
            });
        });
}

// ============================================
// CHAT FUNCTIONS
// ============================================

function showGroupChat() {
    console.log("Switching to group chat");
    
    currentChatType = 'group';
    document.getElementById('group-chat-btn').classList.add('active');
    document.getElementById('private-chat-btn').classList.remove('active');
    
    // Switch to global chat by default
    switchToChat('global', 'Global Chat');
}

function showPrivateChat() {
    console.log("Switching to private chat");
    
    currentChatType = 'private';
    document.getElementById('group-chat-btn').classList.remove('active');
    document.getElementById('private-chat-btn').classList.add('active');
    
    // Show online users for private chat
    loadOnlineUsers();
}

function startPrivateChat(recipientId, recipientName) {
    console.log("Starting private chat with:", recipientId, recipientName);
    
    currentChatType = 'private';
    currentRecipientId = recipientId;
    
    // Generate unique chat ID for the pair
    const chatId = [currentUser.uid, recipientId].sort().join('_');
    
    switchToChat(chatId, `Private: ${recipientName}`);
}

function switchToChat(chatId, title) {
    console.log("Switching to chat:", chatId, title);
    
    currentChatId = chatId;
    chatTitle.textContent = title;
    
    // Update active state in lists
    document.querySelectorAll('.user-item, .group-item').forEach(function(item) {
        item.classList.remove('active');
    });
    
    // Highlight active item
    if (currentChatType === 'group') {
        const activeGroup = document.querySelector(`[data-group-id="${chatId}"]`);
        if (activeGroup) activeGroup.classList.add('active');
    }
    
    // Clear messages
    messagesDiv.innerHTML = '<div class="welcome-message"><p>Loading messages...</p></div>';
    
    // Load messages for this chat
    loadMessages();
}

function loadMessages() {
    console.log("Loading messages for chat:", currentChatId, currentChatType);
    
    // Remove previous listener
    if (window.messageListener) {
        window.messageListener();
    }
    
    let query;
    
    if (currentChatType === 'group') {
        if (currentChatId === 'global') {
            // Global chat
            query = db.collection('messages')
                .where('type', '==', 'global')
                .orderBy('timestamp', 'asc');
            chatInfo.textContent = "Public Group • Everyone can join";
        } else {
            // Group chat
            query = db.collection('messages')
                .where('type', '==', 'group')
                .where('groupId', '==', currentChatId)
                .orderBy('timestamp', 'asc');
            chatInfo.textContent = "Private Group";
        }
    } else {
        // Private chat
        const chatId = [currentUser.uid, currentRecipientId].sort().join('_');
        query = db.collection('messages')
            .where('type', '==', 'private')
            .where('chatId', '==', chatId)
            .orderBy('timestamp', 'asc');
        chatInfo.textContent = "Direct Message";
    }
    
    // Listen for messages
    window.messageListener = query.onSnapshot(function(snapshot) {
        messagesDiv.innerHTML = '';
        
        if (snapshot.empty) {
            messagesDiv.innerHTML = '<div class="welcome-message"><p>No messages yet. Start the conversation!</p></div>';
            return;
        }
        
        snapshot.forEach(function(doc) {
            const message = doc.data();
            displayMessage(message);
        });
        
        // Scroll to bottom
        scrollToBottom();
    }, function(error) {
        console.error("Error loading messages:", error);
        messagesDiv.innerHTML = '<div class="welcome-message"><p>Error loading messages.</p></div>';
    });
}

async function sendMessage() {
    console.log("Sending message...");
    
    const text = messageInput.value.trim();
    if (!text) {
        alert("Please enter a message");
        return;
    }
    
    if (!currentUser) {
        alert("You must be logged in to send messages");
        return;
    }
    
    try {
        const messageData = {
            text: text,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || currentUser.email.split('@')[0],
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            type: currentChatType
        };
        
        if (currentChatType === 'group') {
            if (currentChatId === 'global') {
                messageData.chatId = 'global';
            } else {
                messageData.chatId = currentChatId;
                messageData.groupId = currentChatId;
            }
        } else if (currentChatType === 'private' && currentRecipientId) {
            messageData.chatId = [currentUser.uid, currentRecipientId].sort().join('_');
            messageData.receiverId = currentRecipientId;
        }
        
        console.log("Saving message:", messageData);
        
        // Save to database
        await db.collection('messages').add(messageData);
        
        // Clear input
        messageInput.value = '';
        messageInput.focus();
        
        console.log("✅ Message sent successfully");
        
    } catch (error) {
        console.error("❌ Error sending message:", error);
        alert("Failed to send message: " + error.message);
    }
}

function displayMessage(message) {
    const isCurrentUser = message.senderId === currentUser.uid;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isCurrentUser ? 'message-sent' : 'message-received'}`;
    
    const time = message.timestamp ? 
        new Date(message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
        'Just now';
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-sender">${isCurrentUser ? 'You' : message.senderName}</div>
            <div class="message-text">${message.text}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    messagesDiv.appendChild(messageDiv);
}

function scrollToBottom() {
    const container = document.querySelector('.messages-container');
    container.scrollTop = container.scrollHeight;
}

// ============================================
// GROUP MANAGEMENT FUNCTIONS
// ============================================

function showCreateGroupModal() {
    console.log("Showing create group modal");
    document.getElementById('create-group-modal').style.display = 'flex';
}

function closeCreateGroupModal() {
    console.log("Closing create group modal");
    document.getElementById('create-group-modal').style.display = 'none';
    
    // Clear form
    document.getElementById('group-name').value = '';
    document.getElementById('group-description').value = '';
}

async function createGroup() {
    console.log("Creating group...");
    
    const name = document.getElementById('group-name').value.trim();
    const description = document.getElementById('group-description').value.trim();
    
    if (!name) {
        alert("Please enter a group name");
        return;
    }
    
    if (!currentUser) {
        alert("You must be logged in to create a group");
        return;
    }
    
    try {
        const groupData = {
            name: name,
            description: description,
            createdBy: currentUser.uid,
            creatorName: currentUser.displayName || currentUser.email.split('@')[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            members: [currentUser.uid]
        };
        
        console.log("Creating group:", groupData);
        
        // Save group to database
        const groupRef = await db.collection('groups').add(groupData);
        
        console.log("✅ Group created with ID:", groupRef.id);
        
        // Close modal
        closeCreateGroupModal();
        
        // Switch to the new group
        switchToChat(groupRef.id, name);
        
        alert("Group created successfully!");
        
    } catch (error) {
        console.error("❌ Error creating group:", error);
        alert("Failed to create group: " + error.message);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden && currentUser) {
        // User switched tabs/windows
        db.collection('users').doc(currentUser.uid).update({
            isOnline: false,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
    } else if (currentUser) {
        // User returned
        db.collection('users').doc(currentUser.uid).update({
            isOnline: true,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
});

// ============================================
// APP INITIALIZATION COMPLETE
// ============================================

console.log("App script loaded successfully!");