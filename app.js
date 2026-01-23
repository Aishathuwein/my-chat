// ============================================
// MAIN CHAT APPLICATION - COMPLETE FIXED VERSION
// ============================================

console.log("🚀 Chat app starting...");

// Global variables
let currentUser = null;
let currentChatType = 'group';
let currentChatId = 'global';
let currentRecipientId = null;
let onlineUsers = {};
let groups = [];
let selectedUsersForGroup = new Set();
let messageListener = null;

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
const createGroupModal = document.getElementById('create-group-modal');
const availableUsersList = document.getElementById('available-users-list');

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, setting up app...");
    
    // Setup all event listeners
    setupEventListeners();
    
    // Check auth state
    checkAuthState();
    
    // Add debug panel
    addDebugPanel();
    
    console.log("✅ App setup complete!");
});

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
    console.log("🔗 Setting up event listeners...");
    
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
    createGroupModal.addEventListener('click', function(e) {
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
    console.log("🔐 Checking auth state...");
    
    auth.onAuthStateChanged(function(user) {
        console.log("🔄 Auth state changed:", user ? user.email : "No user");
        
        if (user) {
            // User is signed in
            currentUser = user;
            showChatScreen();
            updateUserProfile(user);
            setupUserPresence(user);
            loadInitialData();
            updateDebugInfo();
        } else {
            // No user is signed in
            showAuthScreen();
            updateDebugInfo();
        }
    });
}

async function signUp() {
    console.log("📝 Sign Up clicked");
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }
    
    try {
        console.log("Creating user:", email);
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update profile with display name
        await userCredential.user.updateProfile({
            displayName: email.split('@')[0]
        });
        
        console.log("✅ User created:", userCredential.user.uid);
        alert("Account created successfully!");
        
        // Update user document in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            uid: userCredential.user.uid,
            email: email,
            displayName: email.split('@')[0],
            isOnline: true,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
    } catch (error) {
        console.error("❌ Sign up error:", error);
        alert("Error: " + error.message);
    }
}

async function signIn() {
    console.log("🔑 Sign In clicked");
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }
    
    try {
        console.log("Signing in:", email);
        await auth.signInWithEmailAndPassword(email, password);
        console.log("✅ Signed in successfully");
        
    } catch (error) {
        console.error("❌ Sign in error:", error);
        alert("Error: " + error.message);
    }
}

async function signInWithGoogle() {
    console.log("🌐 Google Sign In clicked");
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        const result = await auth.signInWithPopup(provider);
        console.log("✅ Google sign in successful:", result.user.email);
        
        // Update user document in Firestore
        await db.collection('users').doc(result.user.uid).set({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            isOnline: true,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
    } catch (error) {
        console.error("❌ Google sign in error:", error);
        alert("Error: " + error.message);
    }
}

async function signOut() {
    console.log("🚪 Sign Out clicked");
    
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
    console.log("👤 Showing auth screen");
    authScreen.style.display = 'flex';
    chatScreen.style.display = 'none';
    currentUser = null;
    
    // Clear any existing message listener
    if (messageListener) {
        messageListener();
        messageListener = null;
    }
}

function showChatScreen() {
    console.log("💬 Showing chat screen");
    authScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
}

function updateUserProfile(user) {
    console.log("👤 Updating user profile");
    
    const displayName = user.displayName || user.email.split('@')[0];
    userName.textContent = displayName;
    userAvatar.textContent = displayName.charAt(0).toUpperCase();
    
    // Set random avatar color
    const colors = ['#667eea', '#764ba2', '#f56565', '#ed8936', '#ecc94b', '#48bb78', '#38b2ac'];
    userAvatar.style.background = colors[displayName.length % colors.length];
}

// ============================================
// PRESENCE & DATABASE FUNCTIONS
// ============================================

async function setupUserPresence(user) {
    console.log("📱 Setting up user presence:", user.uid);
    
    const userRef = db.collection('users').doc(user.uid);
    
    // Set user as online
    await userRef.set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        isOnline: true,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log("✅ User presence set to online");
    
    // Update to offline when user disconnects
    const handleBeforeUnload = async () => {
        try {
            await userRef.update({
                isOnline: false,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating offline status:", error);
        }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Also handle page visibility changes
    document.addEventListener('visibilitychange', async () => {
        if (document.hidden) {
            await userRef.update({
                isOnline: false,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await userRef.update({
                isOnline: true,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    });
}

function loadInitialData() {
    console.log("📦 Loading initial data...");
    
    // Load online users
    loadOnlineUsers();
    
    // Load groups
    loadGroups();
    
    // Load global chat messages
    loadMessages();
}

function loadOnlineUsers() {
    console.log("👥 Loading online users...");
    
    // Clear current list
    onlineUsersList.innerHTML = '<div class="loading">Loading users...</div>';
    
    // Listen for online users
    db.collection('users')
        .where('uid', '!=', currentUser.uid)
        .onSnapshot(function(snapshot) {
            onlineUsersList.innerHTML = '';
            onlineUsers = {};
            
            if (snapshot.empty) {
                onlineUsersList.innerHTML = '<div class="no-users">No other users online</div>';
                return;
            }
            
            snapshot.forEach(function(doc) {
                const user = doc.data();
                onlineUsers[user.uid] = user;
                
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                userItem.dataset.userId = user.uid;
                userItem.dataset.userName = user.displayName;
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
                    if (currentChatType === 'private') {
                        startPrivateChat(user.uid, user.displayName);
                    }
                });
                
                onlineUsersList.appendChild(userItem);
            });
            
            console.log(`✅ Loaded ${snapshot.size} users`);
        }, function(error) {
            console.error("❌ Error loading users:", error);
            onlineUsersList.innerHTML = '<div class="error-message">Error loading users</div>';
        });
}

function loadGroups() {
    console.log("👥 Loading groups...");
    
    // Listen for user's groups
    db.collection('groups')
        .where('members', 'array-contains', currentUser.uid)
        .onSnapshot(function(snapshot) {
            groupsList.innerHTML = '';
            groups = [];
            
            // Always show global chat first
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
            
            console.log(`✅ Loaded ${snapshot.size} groups`);
        }, function(error) {
            console.error("❌ Error loading groups:", error);
            groupsList.innerHTML = '<div class="error-message">Error loading groups</div>';
        });
}

// ============================================
// CHAT FUNCTIONS - FIXED VERSION
// ============================================

function showGroupChat() {
    console.log("👥 Switching to group chat");
    
    currentChatType = 'group';
    currentRecipientId = null;
    
    // Update UI
    document.getElementById('group-chat-btn').classList.add('active');
    document.getElementById('private-chat-btn').classList.remove('active');
    
    // Show/hide sections
    document.getElementById('online-users-section').style.display = 'block';
    document.getElementById('groups-section').style.display = 'block';
    
    // Switch to global chat by default
    switchToChat('global', 'Global Chat');
}

function showPrivateChat() {
    console.log("🔒 Switching to private chat");
    
    currentChatType = 'private';
    
    // Update UI
    document.getElementById('group-chat-btn').classList.remove('active');
    document.getElementById('private-chat-btn').classList.add('active');
    
    // Show/hide sections
    document.getElementById('online-users-section').style.display = 'block';
    document.getElementById('groups-section').style.display = 'none';
    
    // Load online users for private chat
    loadOnlineUsers();
    
    // Show instruction
    chatTitle.textContent = "Private Chat";
    chatInfo.textContent = "Select a user to start chatting";
    messagesDiv.innerHTML = '<div class="welcome-message"><p>Select a user from the online users list to start a private conversation.</p></div>';
}

function startPrivateChat(recipientId, recipientName) {
    console.log("💬 Starting private chat with:", recipientId, recipientName);
    
    if (!recipientId || !recipientName) {
        console.error("Invalid recipient data");
        return;
    }
    
    currentChatType = 'private';
    currentRecipientId = recipientId;
    
    // Generate unique chat ID for the pair (sorted to ensure consistency)
    const chatId = [currentUser.uid, recipientId].sort().join('_');
    
    console.log("Generated chat ID:", chatId);
    
    // Update active state in user list
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.userId === recipientId) {
            item.classList.add('active');
        }
    });
    
    // Switch to this chat
    switchToChat(chatId, `Private: ${recipientName}`);
}

function switchToChat(chatId, title) {
    console.log("🔄 Switching to chat:", chatId, title);
    
    currentChatId = chatId;
    chatTitle.textContent = title;
    
    // Clear any existing message listener
    if (messageListener) {
        messageListener();
        messageListener = null;
    }
    
    // Clear messages
    messagesDiv.innerHTML = '<div class="welcome-message"><p>Loading messages...</p></div>';
    
    // Load messages for this chat
    loadMessages();
    
    // Update debug info
    updateDebugInfo();
}

function loadMessages() {
    console.log("📨 Loading messages for:", currentChatId, "Type:", currentChatType);
    
    // Clear previous messages
    messagesDiv.innerHTML = '<div class="loading">Loading messages...</div>';
    
    // Build query based on chat type
    let query;
    
    if (currentChatType === 'group') {
        if (currentChatId === 'global') {
            // Global chat messages
            chatInfo.textContent = "Public Group • Everyone can join";
            query = db.collection('messages')
                .where('type', '==', 'global')
                .orderBy('timestamp', 'asc');
        } else {
            // Private group messages
            chatInfo.textContent = "Private Group";
            query = db.collection('messages')
                .where('type', '==', 'group')
                .where('groupId', '==', currentChatId)
                .orderBy('timestamp', 'asc');
        }
    } else {
        // Private chat messages
        chatInfo.textContent = "Direct Message";
        
        if (!currentRecipientId) {
            messagesDiv.innerHTML = '<div class="welcome-message"><p>Select a user to start chatting.</p></div>';
            return;
        }
        
        const chatId = [currentUser.uid, currentRecipientId].sort().join('_');
        query = db.collection('messages')
            .where('type', '==', 'private')
            .where('chatId', '==', chatId)
            .orderBy('timestamp', 'asc');
    }
    
    // Set up real-time listener
    messageListener = query.onSnapshot(
        function(snapshot) {
            console.log("📩 New messages received:", snapshot.size);
            
            if (snapshot.empty) {
                messagesDiv.innerHTML = '<div class="welcome-message"><p>No messages yet. Start the conversation!</p></div>';
                return;
            }
            
            // Clear messages
            messagesDiv.innerHTML = '';
            
            // Display each message
            snapshot.forEach(function(doc) {
                const message = doc.data();
                displayMessage(message);
            });
            
            // Scroll to bottom
            scrollToBottom();
        },
        function(error) {
            console.error("❌ Error loading messages:", error);
            
            // Check if it's an index error
            if (error.code === 'failed-precondition') {
                messagesDiv.innerHTML = `
                    <div class="error-message">
                        <p>Firebase index needed. Please create this index:</p>
                        <p>Collection: messages</p>
                        <p>Fields: type (Asc), ${currentChatType === 'private' ? 'chatId (Asc)' : 'groupId (Asc)'}, timestamp (Asc)</p>
                    </div>
                `;
            } else {
                messagesDiv.innerHTML = '<div class="error-message">Error loading messages: ' + error.message + '</div>';
            }
        }
    );
}

async function sendMessage() {
    console.log("📤 Sending message...");
    
    const text = messageInput.value.trim();
    if (!text) {
        alert("Please enter a message");
        return;
    }
    
    if (!currentUser) {
        alert("You must be logged in to send messages");
        return;
    }
    
    // For private chat, need a recipient
    if (currentChatType === 'private' && !currentRecipientId) {
        alert("Please select a user to chat with");
        return;
    }
    
    try {
        const messageData = {
            text: text,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || currentUser.email.split('@')[0],
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            type: currentChatType,
            read: false
        };
        
        // Add chat-specific data
        if (currentChatType === 'group') {
            if (currentChatId === 'global') {
                messageData.chatId = 'global';
                messageData.type = 'global';
            } else {
                messageData.chatId = currentChatId;
                messageData.groupId = currentChatId;
                messageData.type = 'group';
            }
        } else if (currentChatType === 'private' && currentRecipientId) {
            messageData.chatId = [currentUser.uid, currentRecipientId].sort().join('_');
            messageData.receiverId = currentRecipientId;
            messageData.type = 'private';
        }
        
        console.log("💾 Saving message:", messageData);
        
        // Save to database
        await db.collection('messages').add(messageData);
        
        // Clear input and focus
        messageInput.value = '';
        messageInput.focus();
        
        console.log("✅ Message sent successfully");
        
    } catch (error) {
        console.error("❌ Error sending message:", error);
        alert("Failed to send message: " + error.message);
    }
}

function displayMessage(message) {
    if (!message || !message.senderName || !message.text) {
        console.error("Invalid message data:", message);
        return;
    }
    
    const isCurrentUser = message.senderId === currentUser.uid;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isCurrentUser ? 'message-sent' : 'message-received'}`;
    
    // Format timestamp
    let timeString = 'Just now';
    if (message.timestamp && message.timestamp.toDate) {
        const date = message.timestamp.toDate();
        timeString = date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-sender">${isCurrentUser ? 'You' : message.senderName}</div>
            <div class="message-text">${message.text}</div>
            <div class="message-time">${timeString}</div>
        </div>
    `;
    
    messagesDiv.appendChild(messageDiv);
}

function scrollToBottom() {
    const container = document.querySelector('.messages-container');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

// ============================================
// GROUP MANAGEMENT FUNCTIONS - FIXED
// ============================================

function showCreateGroupModal() {
    console.log("📋 Showing create group modal");
    
    // Reset selected users
    selectedUsersForGroup.clear();
    
    // Load available users for group creation
    loadAvailableUsersForGroup();
    
    // Show modal
    createGroupModal.style.display = 'flex';
}

function closeCreateGroupModal() {
    console.log("❌ Closing create group modal");
    createGroupModal.style.display = 'none';
    
    // Clear form
    document.getElementById('group-name').value = '';
    document.getElementById('group-description').value = '';
    selectedUsersForGroup.clear();
}

function loadAvailableUsersForGroup() {
    console.log("👥 Loading available users for group creation");
    
    availableUsersList.innerHTML = '<div class="loading">Loading users...</div>';
    
    // Get all users except current user
    db.collection('users')
        .where('uid', '!=', currentUser.uid)
        .get()
        .then(function(snapshot) {
            availableUsersList.innerHTML = '';
            
            if (snapshot.empty) {
                availableUsersList.innerHTML = '<div class="no-users">No other users available</div>';
                return;
            }
            
            snapshot.forEach(function(doc) {
                const user = doc.data();
                
                const userItem = document.createElement('div');
                userItem.className = 'available-user-item';
                userItem.innerHTML = `
                    <input type="checkbox" class="user-checkbox" id="user-${user.uid}" value="${user.uid}">
                    <i class="fas fa-user-circle"></i>
                    <label for="user-${user.uid}">
                        <strong>${user.displayName}</strong>
                        <small style="color: ${user.isOnline ? '#48bb78' : '#a0aec0'}">
                            ${user.isOnline ? 'Online' : 'Offline'}
                        </small>
                    </label>
                `;
                
                // Add event listener to checkbox
                const checkbox = userItem.querySelector('.user-checkbox');
                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        selectedUsersForGroup.add(user.uid);
                    } else {
                        selectedUsersForGroup.delete(user.uid);
                    }
                    console.log("Selected users:", Array.from(selectedUsersForGroup));
                });
                
                availableUsersList.appendChild(userItem);
            });
            
            console.log(`✅ Loaded ${snapshot.size} available users`);
        })
        .catch(function(error) {
            console.error("❌ Error loading available users:", error);
            availableUsersList.innerHTML = '<div class="error-message">Error loading users</div>';
        });
}

async function createGroup() {
    console.log("👥 Creating group...");
    
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
    
    // Create members array (current user + selected users)
    const members = [currentUser.uid, ...Array.from(selectedUsersForGroup)];
    
    if (members.length < 2) {
        alert("Please select at least one other user for the group");
        return;
    }
    
    try {
        const groupData = {
            name: name,
            description: description,
            createdBy: currentUser.uid,
            creatorName: currentUser.displayName || currentUser.email.split('@')[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            members: members,
            memberCount: members.length
        };
        
        console.log("💾 Creating group:", groupData);
        
        // Save group to database
        const groupRef = await db.collection('groups').add(groupData);
        
        console.log("✅ Group created with ID:", groupRef.id);
        
        // Add initial "group created" message
        await db.collection('messages').add({
            text: `${currentUser.displayName || currentUser.email.split('@')[0]} created the group "${name}"`,
            senderId: 'system',
            senderName: 'System',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'group',
            groupId: groupRef.id,
            chatId: groupRef.id,
            isSystemMessage: true
        });
        
        // Close modal
        closeCreateGroupModal();
        
        // Switch to the new group
        switchToChat(groupRef.id, name);
        
        alert("✅ Group created successfully!");
        
    } catch (error) {
        console.error("❌ Error creating group:", error);
        alert("Failed to create group: " + error.message);
    }
}

// ============================================
// DEBUG & UTILITY FUNCTIONS
// ============================================

function addDebugPanel() {
    const debugDiv = document.createElement('div');
    debugDiv.className = 'debug-info';
    debugDiv.id = 'debug-info-panel';
    debugDiv.innerHTML = `
        <strong>Debug Info</strong>
        <div>User: <span id="debug-user">Not logged in</span></div>
        <div>Chat Type: <span id="debug-chat-type">-</span></div>
        <div>Chat ID: <span id="debug-chat-id">-</span></div>
        <div>Recipient: <span id="debug-recipient">-</span></div>
        <button onclick="toggleDebug()" style="margin-top: 5px; font-size: 10px;">Hide</button>
    `;
    document.body.appendChild(debugDiv);
}

function updateDebugInfo() {
    if (!document.getElementById('debug-info-panel')) return;
    
    document.getElementById('debug-user').textContent = 
        currentUser ? (currentUser.email || currentUser.uid) : 'Not logged in';
    document.getElementById('debug-chat-type').textContent = currentChatType;
    document.getElementById('debug-chat-id').textContent = currentChatId;
    document.getElementById('debug-recipient').textContent = currentRecipientId || 'None';
}

function toggleDebug() {
    const panel = document.getElementById('debug-info-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (!currentUser) return;
    
    const userRef = db.collection('users').doc(currentUser.uid);
    
    if (document.hidden) {
        // User switched tabs/windows
        userRef.update({
            isOnline: false,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(console.error);
    } else {
        // User returned
        userRef.update({
            isOnline: true,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(console.error);
    }
});

// Export functions for global access
window.signUp = signUp;
window.signIn = signIn;
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;
window.showGroupChat = showGroupChat;
window.showPrivateChat = showPrivateChat;
window.sendMessage = sendMessage;
window.showCreateGroupModal = showCreateGroupModal;
window.createGroup = createGroup;
window.closeCreateGroupModal = closeCreateGroupModal;
window.toggleDebug = toggleDebug;

console.log("🎉 App script loaded successfully!");