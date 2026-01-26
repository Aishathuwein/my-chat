// ============================================
// COMPLETE CHAT APPLICATION - WORKING VERSION
// ============================================

console.log("🚀 Starting Chat App...");
logDebug("Application starting", "info");

// Global variables
let currentUser = null;
let currentChat = {
    id: 'global',
    type: 'group',
    name: 'Global Chat',
    avatar: '<i class="fas fa-globe"></i>'
};
let onlineUsers = new Map();
let allUsers = new Map();
let groups = new Map();
let messageListener = null;
let audioRecorder = null;
let recordingInterval = null;
let recordingStartTime = null;
let selectedUsers = new Set();
let unsubscribers = [];

// DOM Elements
const elements = {
    // Screens
    authScreen: document.getElementById('auth-screen'),
    chatScreen: document.getElementById('chat-screen'),
    
    // Auth
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    signupName: document.getElementById('signup-name'),
    signupEmail: document.getElementById('signup-email'),
    signupPassword: document.getElementById('signup-password'),
    loginBtn: document.getElementById('login-btn'),
    signupBtn: document.getElementById('signup-btn'),
    googleLoginBtn: document.getElementById('google-login-btn'),
    
    // Chat UI
    userName: document.getElementById('user-name'),
    userAvatar: document.getElementById('user-avatar'),
    userStatus: document.getElementById('user-status'),
    chatTitle: document.getElementById('chat-title'),
    chatAvatar: document.getElementById('chat-avatar'),
    onlineCount: document.getElementById('online-count'),
    typingIndicator: document.getElementById('typing-indicator'),
    
    // Lists
    onlineUsersList: document.getElementById('online-users-list'),
    groupsList: document.getElementById('groups-list'),
    
    // Messages
    messagesContainer: document.getElementById('messages-container'),
    messages: document.getElementById('messages'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    
    // Groups
    createGroupBtn: document.getElementById('create-group-btn'),
    createGroupSection: document.getElementById('create-group-section'),
    newGroupName: document.getElementById('new-group-name'),
    selectedList: document.getElementById('selected-list'),
    selectedCount: document.getElementById('selected-count'),
    createGroupSubmit: document.getElementById('create-group-submit'),
    cancelGroupBtn: document.getElementById('cancel-group-btn'),
    
    // Chat type buttons
    globalChatBtn: document.getElementById('global-chat-btn'),
    privateChatBtn: document.getElementById('private-chat-btn'),
    groupChatBtn: document.getElementById('group-chat-btn'),
    
    // Media
    attachBtn: document.getElementById('attach-btn'),
    audioBtn: document.getElementById('audio-btn'),
    attachmentMenu: document.getElementById('attachment-menu'),
    audioRecorderElement: document.getElementById('audio-recorder'),
    fileInput: document.getElementById('file-input'),
    
    // Other
    logoutBtn: document.getElementById('logout-btn'),
    newMessagesIndicator: document.getElementById('new-messages-indicator'),
    debugToggle: document.getElementById('toggle-debug'),
    debugConsole: document.getElementById('debug-console')
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded");
    logDebug("DOM loaded", "info");
    
    // Setup event listeners
    setupEventListeners();
    
    // Check auth state
    checkAuthState();
    
    // Setup debug console toggle
    elements.debugToggle.addEventListener('click', toggleDebugConsole);
    
    logDebug("Initialization complete", "info");
});

function setupEventListeners() {
    logDebug("Setting up event listeners", "info");
    
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchAuthTab(tabName);
        });
    });
    
    // Auth buttons
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.signupBtn.addEventListener('click', handleSignup);
    elements.googleLoginBtn.addEventListener('click', handleGoogleLogin);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Enter key in forms
    elements.loginEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    elements.loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Message input
    elements.messageInput.addEventListener('input', handleMessageInput);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    elements.sendBtn.addEventListener('click', sendMessage);
    
    // Chat type buttons
    elements.globalChatBtn.addEventListener('click', () => switchToGlobalChat());
    elements.privateChatBtn.addEventListener('click', () => switchToPrivateChat());
    elements.groupChatBtn.addEventListener('click', () => switchToGroupChat());
    
    // Group creation
    elements.createGroupBtn.addEventListener('click', showCreateGroup);
    elements.createGroupSubmit.addEventListener('click', createNewGroup);
    elements.cancelGroupBtn.addEventListener('click', cancelGroupCreation);
    
    // Media buttons
    elements.attachBtn.addEventListener('click', toggleAttachmentMenu);
    elements.audioBtn.addEventListener('click', toggleAudioRecorder);
    
    // Attachment options
    document.querySelectorAll('.attachment-option').forEach(option => {
        option.addEventListener('click', () => {
            const type = option.dataset.type;
            handleAttachment(type);
        });
    });
    
    // Audio recorder
    document.getElementById('cancel-recording').addEventListener('click', cancelRecording);
    document.getElementById('stop-recording').addEventListener('click', stopRecording);
    
    // File input
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // New messages indicator
    elements.newMessagesIndicator.addEventListener('click', scrollToBottom);
    
    logDebug("Event listeners setup complete", "info");
}

function toggleDebugConsole() {
    const console = elements.debugConsole;
    const icon = elements.debugToggle.querySelector('i');
    const content = console.querySelector('.debug-content');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.className = 'fas fa-chevron-down';
    } else {
        content.style.display = 'none';
        icon.className = 'fas fa-chevron-up';
    }
}

// ============================================
// AUTHENTICATION
// ============================================

function switchAuthTab(tabName) {
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update forms
    elements.loginForm.classList.toggle('active', tabName === 'login');
    elements.signupForm.classList.toggle('active', tabName === 'signup');
}

function checkAuthState() {
    logDebug("Checking auth state", "info");
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            logDebug(`User logged in: ${user.email}`, "info");
            currentUser = user;
            await initializeUser(user);
            showChatScreen();
            startUserPresence();
            loadInitialData();
        } else {
            logDebug("No user logged in", "info");
            currentUser = null;
            showAuthScreen();
        }
    });
}

async function handleLogin() {
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;
    
    if (!email || !password) {
        logDebug("Login failed: Email and password required", "error");
        alert("Please enter email and password");
        return;
    }
    
    try {
        logDebug(`Attempting login: ${email}`, "info");
        updateConnectionStatus('connecting');
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        logDebug(`Login successful: ${userCredential.user.email}`, "info");
        
    } catch (error) {
        logDebug(`Login error: ${error.message}`, "error");
        alert(`Login failed: ${error.message}`);
        updateConnectionStatus('error');
    }
}

async function handleSignup() {
    const name = elements.signupName.value.trim();
    const email = elements.signupEmail.value.trim();
    const password = elements.signupPassword.value;
    
    if (!name || !email || !password) {
        alert("Please fill all fields");
        return;
    }
    
    if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }
    
    try {
        logDebug(`Creating account: ${email}`, "info");
        updateConnectionStatus('connecting');
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update profile
        await userCredential.user.updateProfile({
            displayName: name,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff`
        });
        
        // Create user document
        await createUserDocument(userCredential.user, name);
        
        logDebug(`Account created: ${email}`, "info");
        
    } catch (error) {
        logDebug(`Signup error: ${error.message}`, "error");
        alert(`Signup failed: ${error.message}`);
        updateConnectionStatus('error');
    }
}

async function handleGoogleLogin() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        logDebug("Starting Google login", "info");
        updateConnectionStatus('connecting');
        
        const result = await auth.signInWithPopup(provider);
        
        // Create/update user document
        await createUserDocument(result.user, result.user.displayName);
        
        logDebug(`Google login successful: ${result.user.email}`, "info");
        
    } catch (error) {
        logDebug(`Google login error: ${error.message}`, "error");
        alert(`Google login failed: ${error.message}`);
        updateConnectionStatus('error');
    }
}

async function handleLogout() {
    try {
        logDebug("Logging out", "info");
        
        // Update user status
        if (currentUser) {
            await db.collection('users').doc(currentUser.uid).update({
                status: 'offline',
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Clear all listeners
        unsubscribers.forEach(unsub => unsub());
        unsubscribers = [];
        
        // Clear data
        currentUser = null;
        onlineUsers.clear();
        allUsers.clear();
        groups.clear();
        selectedUsers.clear();
        
        // Clear UI
        elements.messages.innerHTML = '';
        elements.onlineUsersList.innerHTML = '';
        elements.groupsList.innerHTML = '';
        
        // Sign out
        await auth.signOut();
        
        logDebug("Logged out successfully", "info");
        
    } catch (error) {
        logDebug(`Logout error: ${error.message}`, "error");
        alert("Logout failed: " + error.message);
    }
}

// ============================================
// USER MANAGEMENT
// ============================================

async function createUserDocument(user, displayName) {
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || user.email)}&background=667eea&color=fff`,
        status: 'online',
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(user.uid).set(userData, { merge: true });
    return userData;
}

async function initializeUser(user) {
    logDebug(`Initializing user: ${user.uid}`, "info");
    
    // Update UI
    elements.userName.textContent = user.displayName || user.email.split('@')[0];
    elements.userAvatar.textContent = (user.displayName || user.email).charAt(0).toUpperCase();
    
    // Update user document
    await createUserDocument(user, user.displayName);
}

function startUserPresence() {
    if (!currentUser) return;
    
    const userRef = db.collection('users').doc(currentUser.uid);
    
    // Set online
    userRef.update({
        status: 'online',
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Handle disconnect
    const handleDisconnect = async () => {
        try {
            await userRef.update({
                status: 'offline',
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            logDebug(`Presence update error: ${error.message}`, "error");
        }
    };
    
    window.addEventListener('beforeunload', handleDisconnect);
    
    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            userRef.update({
                status: 'away',
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            userRef.update({
                status: 'online',
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    });
}

// ============================================
// SCREEN MANAGEMENT
// ============================================

function showAuthScreen() {
    elements.authScreen.style.display = 'flex';
    elements.chatScreen.style.display = 'none';
    logDebug("Showing auth screen", "info");
}

function showChatScreen() {
    elements.authScreen.style.display = 'none';
    elements.chatScreen.style.display = 'flex';
    logDebug("Showing chat screen", "info");
}

// ============================================
// DATA LOADING
// ============================================

function loadInitialData() {
    logDebug("Loading initial data", "info");
    
    loadOnlineUsers();
    loadAllUsers();
    loadUserGroups();
    loadGlobalChat();
}

function loadOnlineUsers() {
    logDebug("Loading online users", "info");
    
    const unsubscribe = db.collection('users')
        .where('status', 'in', ['online', 'away'])
        .onSnapshot(snapshot => {
            onlineUsers.clear();
            elements.onlineUsersList.innerHTML = '';
            
            snapshot.forEach(doc => {
                const user = doc.data();
                if (user.uid !== currentUser.uid) {
                    onlineUsers.set(user.uid, user);
                    
                    // Add to UI
                    const userItem = createUserItem(user);
                    elements.onlineUsersList.appendChild(userItem);
                }
            });
            
            // Update online count
            elements.onlineCount.textContent = `${onlineUsers.size} online`;
            
            logDebug(`Loaded ${onlineUsers.size} online users`, "info");
        }, error => {
            logDebug(`Error loading online users: ${error.message}`, "error");
        });
    
    unsubscribers.push(unsubscribe);
}

function loadAllUsers() {
    logDebug("Loading all users", "info");
    
    const unsubscribe = db.collection('users')
        .where('uid', '!=', currentUser.uid)
        .onSnapshot(snapshot => {
            allUsers.clear();
            
            snapshot.forEach(doc => {
                const user = doc.data();
                allUsers.set(user.uid, user);
            });
            
            logDebug(`Loaded ${allUsers.size} total users`, "info");
        });
    
    unsubscribers.push(unsubscribe);
}

function loadUserGroups() {
    logDebug("Loading user groups", "info");
    
    const unsubscribe = db.collection('groups')
        .where('members', 'array-contains', currentUser.uid)
        .onSnapshot(snapshot => {
            groups.clear();
            elements.groupsList.innerHTML = '';
            
            // Add global chat first
            const globalItem = createGroupItem({
                id: 'global',
                name: 'Global Chat',
                type: 'global',
                avatar: '<i class="fas fa-globe"></i>'
            });
            elements.groupsList.appendChild(globalItem);
            
            // Add other groups
            snapshot.forEach(doc => {
                const group = { id: doc.id, ...doc.data() };
                groups.set(group.id, group);
                
                const groupItem = createGroupItem(group);
                elements.groupsList.appendChild(groupItem);
            });
            
            logDebug(`Loaded ${groups.size} groups`, "info");
        });
    
    unsubscribers.push(unsubscribe);
}

// ============================================
// CHAT MANAGEMENT
// ============================================

function switchToGlobalChat() {
    logDebug("Switching to global chat", "info");
    
    currentChat = {
        id: 'global',
        type: 'group',
        name: 'Global Chat',
        avatar: '<i class="fas fa-globe"></i>'
    };
    
    updateChatUI();
    loadMessages();
    updateActiveButtons('global');
}

function switchToPrivateChat() {
    logDebug("Switching to private chat view", "info");
    
    // Just show online users for selection
    updateActiveButtons('private');
    
    // Clear messages area
    elements.messages.innerHTML = '<div class="loading">Select a user to start private chat</div>';
    elements.chatTitle.textContent = 'Private Chat';
    elements.chatAvatar.innerHTML = '<i class="fas fa-user"></i>';
}

function switchToGroupChat() {
    logDebug("Switching to group chat view", "info");
    
    updateActiveButtons('group');
    
    // Show groups list
    elements.messages.innerHTML = '<div class="loading">Select a group or create new one</div>';
    elements.chatTitle.textContent = 'Groups';
    elements.chatAvatar.innerHTML = '<i class="fas fa-users"></i>';
}

function startPrivateChat(userId) {
    const user = onlineUsers.get(userId) || allUsers.get(userId);
    if (!user) return;
    
    logDebug(`Starting private chat with ${user.displayName}`, "info");
    
    // Create chat ID (sorted to ensure consistency)
    const chatId = [currentUser.uid, userId].sort().join('_');
    
    currentChat = {
        id: chatId,
        type: 'private',
        name: user.displayName,
        avatar: `<i class="fas fa-user"></i>`,
        recipientId: userId
    };
    
    updateChatUI();
    loadMessages();
    updateActiveButtons('private');
}

function joinGroupChat(groupId) {
    const group = groups.get(groupId);
    if (!group && groupId !== 'global') return;
    
    logDebug(`Joining group chat: ${group?.name || 'Global'}`, "info");
    
    currentChat = groupId === 'global' ? {
        id: 'global',
        type: 'group',
        name: 'Global Chat',
        avatar: '<i class="fas fa-globe"></i>'
    } : {
        id: groupId,
        type: 'group',
        name: group.name,
        avatar: '<i class="fas fa-users"></i>',
        members: group.members
    };
    
    updateChatUI();
    loadMessages();
    updateActiveButtons('group');
}

function updateChatUI() {
    elements.chatTitle.textContent = currentChat.name;
    elements.chatAvatar.innerHTML = currentChat.avatar;
    
    // Update active state in lists
    document.querySelectorAll('.user-item, .group-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Mark active chat
    if (currentChat.type === 'private' && currentChat.recipientId) {
        const userItem = document.querySelector(`.user-item[data-user-id="${currentChat.recipientId}"]`);
        if (userItem) userItem.classList.add('active');
    } else {
        const groupItem = document.querySelector(`.group-item[data-group-id="${currentChat.id}"]`);
        if (groupItem) groupItem.classList.add('active');
    }
}

function updateActiveButtons(type) {
    elements.globalChatBtn.classList.toggle('active', type === 'global');
    elements.privateChatBtn.classList.toggle('active', type === 'private');
    elements.groupChatBtn.classList.toggle('active', type === 'group');
}

// ============================================
// MESSAGE HANDLING - FIXED FOR INSTANT UPDATES
// ============================================

function loadMessages() {
    logDebug(`Loading messages for chat: ${currentChat.id}`, "info");
    
    // Clear previous listener
    if (messageListener) {
        messageListener();
    }
    
    // Clear messages
    elements.messages.innerHTML = '<div class="loading">Loading messages...</div>';
    
    let query;
    
    if (currentChat.id === 'global') {
        query = db.collection('messages')
            .where('type', '==', 'global')
            .orderBy('timestamp', 'asc');
    } else if (currentChat.type === 'private') {
        query = db.collection('messages')
            .where('chatId', '==', currentChat.id)
            .orderBy('timestamp', 'asc');
    } else {
        query = db.collection('messages')
            .where('groupId', '==', currentChat.id)
            .orderBy('timestamp', 'asc');
    }
    
    messageListener = query.onSnapshot(snapshot => {
        elements.messages.innerHTML = '';
        
        if (snapshot.empty) {
            elements.messages.innerHTML = '<div class="loading">No messages yet. Start the conversation!</div>';
            return;
        }
        
        snapshot.forEach(doc => {
            const message = doc.data();
            displayMessage(message);
        });
        
        scrollToBottom();
        logDebug(`Loaded ${snapshot.size} messages`, "info");
        
    }, error => {
        logDebug(`Error loading messages: ${error.message}`, "error");
        elements.messages.innerHTML = '<div class="loading error">Error loading messages</div>';
        
        // Check if index needs to be created
        if (error.code === 'failed-precondition') {
            logDebug("Index error: Create Firestore index for this query", "error");
        }
    });
}

async function sendMessage() {
    const text = elements.messageInput.value.trim();
    if (!text) {
        logDebug("Cannot send empty message", "warning");
        return;
    }
    
    if (!currentUser) {
        logDebug("Cannot send: No user logged in", "error");
        return;
    }
    
    try {
        logDebug(`Sending message: ${text.substring(0, 50)}...`, "info");
        
        // Create message object
        const messageData = {
            text: text,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || currentUser.email.split('@')[0],
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            type: currentChat.type,
            read: false
        };
        
        // Add chat-specific data
        if (currentChat.id === 'global') {
            messageData.chatId = 'global';
            messageData.type = 'global';
        } else if (currentChat.type === 'private') {
            messageData.chatId = currentChat.id;
            messageData.receiverId = currentChat.recipientId;
        } else {
            messageData.groupId = currentChat.id;
            messageData.chatId = currentChat.id;
        }
        
        // Add message to Firestore
        const docRef = await db.collection('messages').add(messageData);
        
        logDebug(`Message sent with ID: ${docRef.id}`, "info");
        
        // Clear input
        elements.messageInput.value = '';
        elements.messageInput.focus();
        
        // Show message immediately (optimistic update)
        displayMessage({
            ...messageData,
            id: 'temp-' + Date.now(),
            timestamp: new Date()
        });
        
        scrollToBottom();
        
    } catch (error) {
        logDebug(`Error sending message: ${error.message}`, "error");
        alert("Failed to send message: " + error.message);
    }
}

function displayMessage(message) {
    const isCurrentUser = message.senderId === currentUser.uid;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isCurrentUser ? 'sent' : 'received'}`;
    
    // Format time
    let timeString = 'Just now';
    if (message.timestamp) {
        const date = message.timestamp.toDate ? message.timestamp.toDate() : new Date(message.timestamp);
        timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            ${isCurrentUser ? 
                (currentUser.displayName || currentUser.email).charAt(0).toUpperCase() : 
                message.senderName?.charAt(0).toUpperCase() || 'U'
            }
        </div>
        <div class="message-content">
            ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
            <div class="message-text">${message.text}</div>
            <div class="message-time">${timeString}</div>
        </div>
    `;
    
    // Check if message already exists
    const existingMsg = document.querySelector(`[data-message-id="${message.id}"]`);
    if (existingMsg) {
        existingMsg.replaceWith(messageDiv);
    } else {
        elements.messages.appendChild(messageDiv);
    }
    
    messageDiv.dataset.messageId = message.id || 'temp';
}

// ============================================
// GROUP MANAGEMENT - FIXED
// ============================================

function showCreateGroup() {
    logDebug("Showing create group form", "info");
    
    elements.createGroupSection.style.display = 'block';
    elements.onlineUsersList.innerHTML = '';
    selectedUsers.clear();
    updateSelectedMembers();
    
    // Add online users to list for selection
    onlineUsers.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item selectable';
        userItem.dataset.userId = user.uid;
        userItem.innerHTML = `
            <div class="avatar">${user.displayName?.charAt(0).toUpperCase() || 'U'}</div>
            <div class="user-info">
                <h4>${user.displayName}</h4>
                <div class="status online">Online</div>
            </div>
            <input type="checkbox" class="user-checkbox">
        `;
        
        userItem.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') return;
            
            const checkbox = userItem.querySelector('.user-checkbox');
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                selectedUsers.add(user.uid);
                userItem.classList.add('selected');
            } else {
                selectedUsers.delete(user.uid);
                userItem.classList.remove('selected');
            }
            
            updateSelectedMembers();
        });
        
        elements.onlineUsersList.appendChild(userItem);
    });
}

function updateSelectedMembers() {
    elements.selectedList.innerHTML = '';
    elements.selectedCount.textContent = selectedUsers.size;
    
    selectedUsers.forEach(userId => {
        const user = onlineUsers.get(userId) || allUsers.get(userId);
        if (!user) return;
        
        const memberTag = document.createElement('div');
        memberTag.className = 'selected-member';
        memberTag.innerHTML = `
            ${user.displayName}
            <button data-user-id="${userId}">&times;</button>
        `;
        
        memberTag.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation();
            selectedUsers.delete(userId);
            
            // Uncheck checkbox
            const userItem = document.querySelector(`.user-item[data-user-id="${userId}"]`);
            if (userItem) {
                userItem.querySelector('.user-checkbox').checked = false;
                userItem.classList.remove('selected');
            }
            
            updateSelectedMembers();
        });
        
        elements.selectedList.appendChild(memberTag);
    });
}

async function createNewGroup() {
    const groupName = elements.newGroupName.value.trim();
    
    if (!groupName) {
        alert("Please enter a group name");
        return;
    }
    
    if (selectedUsers.size === 0) {
        alert("Please select at least one member");
        return;
    }
    
    try {
        logDebug(`Creating group: ${groupName}`, "info");
        
        // Create members array (include current user)
        const members = Array.from(selectedUsers);
        members.push(currentUser.uid);
        
        // Create group document
        const groupData = {
            name: groupName,
            description: `Group created by ${currentUser.displayName}`,
            createdBy: currentUser.uid,
            creatorName: currentUser.displayName,
            members: members,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'group'
        };
        
        const groupRef = await db.collection('groups').add(groupData);
        
        // Add system message
        await db.collection('messages').add({
            senderId: 'system',
            senderName: 'System',
            text: `${currentUser.displayName} created the group "${groupName}"`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            groupId: groupRef.id,
            type: 'system',
            chatId: groupRef.id
        });
        
        logDebug(`Group created: ${groupRef.id}`, "info");
        
        // Reset form
        elements.newGroupName.value = '';
        selectedUsers.clear();
        elements.createGroupSection.style.display = 'none';
        
        // Switch to the new group
        joinGroupChat(groupRef.id);
        
        alert(`Group "${groupName}" created successfully!`);
        
    } catch (error) {
        logDebug(`Error creating group: ${error.message}`, "error");
        alert("Failed to create group: " + error.message);
    }
}

function cancelGroupCreation() {
    elements.createGroupSection.style.display = 'none';
    elements.onlineUsersList.innerHTML = '';
    selectedUsers.clear();
    loadOnlineUsers(); // Reload online users
}

// ============================================
// MEDIA HANDLING
// ============================================

function toggleAttachmentMenu() {
    elements.attachmentMenu.style.display = 
        elements.attachmentMenu.style.display === 'block' ? 'none' : 'block';
}

function toggleAudioRecorder() {
    if (elements.audioRecorderElement.style.display === 'block') {
        cancelRecording();
    } else {
        startRecording();
    }
}

function handleAttachment(type) {
    elements.attachmentMenu.style.display = 'none';
    
    if (type === 'audio') {
        startRecording();
    } else {
        elements.fileInput.accept = type === 'image' ? 'image/*' :
                                   type === 'file' ? '*' : '*/*';
        elements.fileInput.click();
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    logDebug(`File selected: ${file.name} (${file.type})`, "info");
    
    // For now, just send as text message with filename
    elements.messageInput.value = `[File: ${file.name}]`;
    elements.fileInput.value = '';
    
    // TODO: Implement file upload to Firebase Storage
}

function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Audio recording not supported in your browser");
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            audioRecorder = new MediaRecorder(stream);
            const audioChunks = [];
            
            audioRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            
            audioRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await sendAudioMessage(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            // Start recording
            audioRecorder.start();
            recordingStartTime = Date.now();
            startRecordingTimer();
            
            // Show recorder UI
            elements.audioRecorderElement.style.display = 'block';
            
        })
        .catch(error => {
            logDebug(`Microphone error: ${error.message}`, "error");
            alert("Could not access microphone: " + error.message);
        });
}

function startRecordingTimer() {
    const timerElement = document.querySelector('.recorder-timer');
    
    recordingInterval = setInterval(() => {
        const elapsed = Date.now() - recordingStartTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopRecording() {
    if (audioRecorder && audioRecorder.state !== 'inactive') {
        audioRecorder.stop();
        clearInterval(recordingInterval);
        elements.audioRecorderElement.style.display = 'none';
    }
}

function cancelRecording() {
    if (audioRecorder && audioRecorder.state !== 'inactive') {
        audioRecorder.stop();
    }
    clearInterval(recordingInterval);
    elements.audioRecorderElement.style.display = 'none';
}

async function sendAudioMessage(audioBlob) {
    try {
        // Convert blob to file
        const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
            type: 'audio/webm'
        });
        
        // For now, just send as text message
        elements.messageInput.value = '[Audio message]';
        
        logDebug("Audio message ready to send", "info");
        
        // TODO: Implement audio upload to Firebase Storage
        
    } catch (error) {
        logDebug(`Error sending audio: ${error.message}`, "error");
    }
}

// ============================================
// UI HELPERS
// ============================================

function createUserItem(user) {
    const div = document.createElement('div');
    div.className = 'user-item';
    div.dataset.userId = user.uid;
    
    div.innerHTML = `
        <div class="avatar">${user.displayName?.charAt(0).toUpperCase() || 'U'}</div>
        <div class="user-info">
            <h4>${user.displayName}</h4>
            <div class="status ${user.status || 'offline'}">${user.status || 'Offline'}</div>
        </div>
    `;
    
    div.addEventListener('click', () => {
        if (currentChat.type === 'private' || elements.privateChatBtn.classList.contains('active')) {
            startPrivateChat(user.uid);
        }
    });
    
    return div;
}

function createGroupItem(group) {
    const div = document.createElement('div');
    div.className = 'group-item';
    div.dataset.groupId = group.id;
    
    div.innerHTML = `
        <i class="${group.id === 'global' ? 'fas fa-globe' : 'fas fa-users'}"></i>
        <span>${group.name}</span>
        ${group.members ? `<small>${group.members.length} members</small>` : ''}
    `;
    
    div.addEventListener('click', () => {
        joinGroupChat(group.id);
    });
    
    return div;
}

function handleMessageInput() {
    const hasText = elements.messageInput.value.trim().length > 0;
    elements.sendBtn.style.display = hasText ? 'flex' : 'none';
}

function scrollToBottom() {
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    elements.newMessagesIndicator.style.display = 'none';
}

// Check for new messages
elements.messagesContainer.addEventListener('scroll', () => {
    const container = elements.messagesContainer;
    const messages = elements.messages;
    
    if (container.scrollTop + container.clientHeight < messages.scrollHeight - 100) {
        elements.newMessagesIndicator.style.display = 'flex';
    } else {
        elements.newMessagesIndicator.style.display = 'none';
    }
});

// ============================================
// LOAD GLOBAL CHAT
// ============================================

function loadGlobalChat() {
    switchToGlobalChat();
}

// ============================================
// INITIALIZE APP
// ============================================

logDebug("Chat App ready", "info");
console.log("✅ App initialized successfully");