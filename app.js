// ============================================
// ZANZIBAR UNIVERSITY CHAT - WORKING VERSION
// ============================================

console.log("🚀 ZU Chat starting...");

// Global State
const state = {
    currentUser: null,
    currentChat: null,
    onlineUsers: new Map(),
    contacts: new Map(),
    groups: new Map(),
    selectedUsers: new Set(),
    messageListener: null,
    mediaRecorder: null,
    recordingTimer: null,
    selectedFile: null,
    uploadTask: null,
    emojiList: {
        smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
        people: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎'],
        nature: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒'],
        objects: ['📚', '✏️', '📝', '📖', '🎓', '🏫', '📎', '📌', '✂️', '📍', '📁', '📂', '📅', '📆', '📊', '📈', '📉', '📋', '📇', '📓'],
        symbols: ['❤️', '✅', '⭐', '🌟', '✨', '🎉', '🎊', '🎁', '🏆', '🥇', '🥈', '🥉', '📢', '🔔', '📣', '🔍', '🔎', '📌', '📍', '🛡️']
    }
};

// DOM Elements
const elements = {
    // Screens
    loadingScreen: document.getElementById('loading-screen'),
    authScreen: document.getElementById('auth-screen'),
    chatScreen: document.getElementById('chat-screen'),
    
    // Auth
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    loginBtn: document.getElementById('login-btn'),
    signupBtn: document.getElementById('signup-btn'),
    googleBtn: document.getElementById('google-btn'),
    
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    userEmail: document.getElementById('user-email'),
    profileMenuBtn: document.getElementById('profile-menu-btn'),
    profileMenu: document.getElementById('profile-menu'),
    navBtns: document.querySelectorAll('.nav-btn'),
    newChatBtn: document.getElementById('new-chat-btn'),
    newGroupBtn: document.getElementById('new-group-btn'),
    chatsList: document.getElementById('chats-list'),
    groupsList: document.getElementById('groups-list'),
    contactsList: document.getElementById('contacts-list'),
    
    // Main Chat
    backBtn: document.getElementById('back-btn'),
    chatTitle: document.getElementById('chat-title'),
    chatSubtitle: document.getElementById('chat-subtitle'),
    messagesContainer: document.getElementById('messages-container'),
    messages: document.getElementById('messages'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    attachToggle: document.getElementById('attach-toggle'),
    attachmentMenu: document.getElementById('attachment-menu'),
    voiceToggle: document.getElementById('voice-toggle'),
    emojiToggle: document.getElementById('emoji-toggle'),
    emojiPicker: document.getElementById('emoji-picker'),
    emojiGrid: document.getElementById('emoji-grid'),
    audioRecorder: document.getElementById('audio-recorder'),
    recordingTime: document.getElementById('recording-time'),
    cancelRecording: document.getElementById('cancel-recording'),
    sendRecording: document.getElementById('send-recording'),
    
    // Modals
    newChatModal: document.getElementById('new-chat-modal'),
    newGroupModal: document.getElementById('new-group-modal'),
    filePreviewModal: document.getElementById('file-preview-modal'),
    
    // Upload
    uploadProgress: document.getElementById('upload-progress'),
    uploadPercentage: document.getElementById('upload-percentage'),
    progressFill: document.getElementById('progress-fill'),
    uploadFileName: document.getElementById('upload-file-name'),
    uploadFileSize: document.getElementById('upload-file-size'),
    cancelUpload: document.getElementById('cancel-upload'),
    
    // Notifications
    notificationsContainer: document.getElementById('notifications-container')
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("📚 DOM ready");
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup auth listener
    auth.onAuthStateChanged(handleAuthStateChange);
    
    // Load emojis
    loadEmojis('smileys');
    
    // Hide loading screen after 1.5 seconds
    setTimeout(() => {
        elements.loadingScreen.style.display = 'none';
    }, 1500);
});

function setupEventListeners() {
    console.log("🔗 Setting up event listeners...");
    
    // Auth
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.signupBtn.addEventListener('click', handleSignup);
    elements.googleBtn.addEventListener('click', handleGoogleLogin);
    
    // Message input
    elements.messageInput.addEventListener('input', handleMessageInput);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    elements.sendBtn.addEventListener('click', sendMessage);
    
    // Attachments
    elements.attachToggle.addEventListener('click', toggleAttachmentMenu);
    document.querySelectorAll('.attach-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            handleAttachment(type);
        });
    });
    
    // Audio recording
    elements.voiceToggle.addEventListener('click', toggleVoiceRecording);
    elements.cancelRecording.addEventListener('click', cancelRecording);
    elements.sendRecording.addEventListener('click', stopRecording);
    
    // Emojis
    elements.emojiToggle.addEventListener('click', toggleEmojiPicker);
    document.querySelectorAll('.emoji-cat').forEach(cat => {
        cat.addEventListener('click', function() {
            const category = this.dataset.category;
            loadEmojis(category);
            document.querySelectorAll('.emoji-cat').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // New chat/group
    elements.newChatBtn.addEventListener('click', openNewChatModal);
    elements.newGroupBtn.addEventListener('click', openNewGroupModal);
    
    // Navigation
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchSidebarView(view);
        });
    });
    
    // Profile menu
    elements.profileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.profileMenu.classList.toggle('active');
    });
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.dataset.action;
            handleProfileAction(action);
        });
    });
    
    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });
    
    // Create group
    document.getElementById('create-group-btn').addEventListener('click', createGroup);
    
    // Cancel upload
    elements.cancelUpload.addEventListener('click', cancelUpload);
    
    // Mobile menu
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
        elements.sidebar.classList.toggle('active');
    });
    
    // Back button
    elements.backBtn.addEventListener('click', () => {
        elements.sidebar.classList.add('active');
    });
    
    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.attachmentMenu.contains(e.target) && !elements.attachToggle.contains(e.target)) {
            elements.attachmentMenu.classList.remove('active');
        }
        if (!elements.emojiPicker.contains(e.target) && !elements.emojiToggle.contains(e.target)) {
            elements.emojiPicker.classList.remove('active');
        }
        if (!elements.profileMenu.contains(e.target) && !elements.profileMenuBtn.contains(e.target)) {
            elements.profileMenu.classList.remove('active');
        }
    });
    
    console.log("✅ Event listeners setup complete");
}

// ============================================
// AUTHENTICATION
// ============================================

async function handleAuthStateChange(user) {
    console.log("🔐 Auth state changed:", user ? user.email : "No user");
    
    if (user) {
        // User signed in
        await handleUserLogin(user);
    } else {
        // User signed out
        handleUserLogout();
    }
}

async function handleLogin() {
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    
    if (!email || !password) {
        showNotification('Please enter email and password', 'error');
        return;
    }
    
    try {
        showNotification('Logging in...', 'info');
        await auth.signInWithEmailAndPassword(email, password);
        showNotification('Login successful!', 'success');
    } catch (error) {
        console.error("Login error:", error);
        showNotification(error.message, 'error');
    }
}

async function handleSignup() {
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    
    if (!email || !password) {
        showNotification('Please enter email and password', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        showNotification('Creating account...', 'info');
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Get name from email
        const name = email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Update profile
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // Create user document
        await createUserDocument(userCredential.user);
        
        showNotification('Account created successfully!', 'success');
        
    } catch (error) {
        console.error("Signup error:", error);
        showNotification(error.message, 'error');
    }
}

async function handleGoogleLogin() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        showNotification('Signing in with Google...', 'info');
        const result = await auth.signInWithPopup(provider);
        
        // Create/update user document
        await createUserDocument(result.user);
        
        showNotification('Google login successful!', 'success');
        
    } catch (error) {
        console.error("Google login error:", error);
        showNotification(error.message, 'error');
        
        // Try redirect method if popup fails
        if (error.code === 'auth/popup-blocked') {
            try {
                await auth.signInWithRedirect(provider);
            } catch (redirectError) {
                console.error("Redirect error:", redirectError);
            }
        }
    }
}

async function createUserDocument(user) {
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=0a3d62&color=fff`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'online'
    };
    
    await db.collection('users').doc(user.uid).set(userData, { merge: true });
    return userData;
}

async function handleUserLogin(user) {
    state.currentUser = user;
    
    // Update UI
    updateUserUI(user);
    
    // Show chat screen
    showScreen('chat-screen');
    
    // Update user status
    await updateUserStatus('online');
    
    // Load initial data
    await loadInitialData();
    
    showNotification(`Welcome ${user.displayName || user.email}!`, 'success');
}

function handleUserLogout() {
    state.currentUser = null;
    state.currentChat = null;
    
    // Clear UI
    elements.messages.innerHTML = '';
    elements.chatsList.innerHTML = '';
    elements.groupsList.innerHTML = '';
    elements.contactsList.innerHTML = '';
    
    // Stop listeners
    if (state.messageListener) {
        state.messageListener();
        state.messageListener = null;
    }
    
    // Show auth screen
    showScreen('auth-screen');
}

async function updateUserStatus(status) {
    if (!state.currentUser) return;
    
    await db.collection('users').doc(state.currentUser.uid).update({
        status: status,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// ============================================
// UI MANAGEMENT
// ============================================

function showScreen(screenName) {
    elements.loadingScreen.style.display = 'none';
    
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    
    const screenElement = document.getElementById(screenName);
    if (screenElement) {
        screenElement.style.display = 'flex';
    }
}

function updateUserUI(user) {
    elements.userName.textContent = user.displayName || user.email.split('@')[0];
    elements.userEmail.textContent = user.email;
    
    // Set avatar
    const avatar = elements.userAvatar;
    if (user.photoURL) {
        avatar.style.backgroundImage = `url(${user.photoURL})`;
        avatar.style.backgroundSize = 'cover';
        avatar.innerHTML = '';
    } else {
        const initial = (user.displayName || user.email).charAt(0).toUpperCase();
        avatar.innerHTML = initial;
        avatar.style.background = 'linear-gradient(135deg, #0a3d62 0%, #3c6382 100%)';
    }
}

function switchSidebarView(view) {
    elements.navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    document.querySelectorAll('.sidebar-content').forEach(content => {
        content.classList.toggle('active', content.id === `${view}-content`);
    });
}

// ============================================
// DATA LOADING
// ============================================

async function loadInitialData() {
    console.log("📦 Loading initial data...");
    
    await Promise.all([
        loadOnlineUsers(),
        loadAllUsers(),
        loadUserGroups(),
        loadRecentChats()
    ]);
    
    // Setup presence
    setupPresence();
}

function loadOnlineUsers() {
    return new Promise((resolve) => {
        db.collection('users')
            .where('status', '==', 'online')
            .onSnapshot(snapshot => {
                state.onlineUsers.clear();
                snapshot.forEach(doc => {
                    const user = doc.data();
                    if (user.uid !== state.currentUser.uid) {
                        state.onlineUsers.set(user.uid, user);
                    }
                });
                updateContactsList();
                resolve();
            });
    });
}

function loadAllUsers() {
    return new Promise((resolve) => {
        db.collection('users')
            .orderBy('displayName')
            .onSnapshot(snapshot => {
                state.contacts.clear();
                snapshot.forEach(doc => {
                    const user = doc.data();
                    if (user.uid !== state.currentUser.uid) {
                        state.contacts.set(user.uid, user);
                    }
                });
                updateContactsList();
                resolve();
            });
    });
}

function loadUserGroups() {
    if (!state.currentUser) return Promise.resolve();
    
    return new Promise((resolve) => {
        db.collection('groups')
            .where('members', 'array-contains', state.currentUser.uid)
            .onSnapshot(snapshot => {
                state.groups.clear();
                snapshot.forEach(doc => {
                    const group = { id: doc.id, ...doc.data() };
                    state.groups.set(group.id, group);
                });
                updateGroupsList();
                resolve();
            });
    });
}

function loadRecentChats() {
    if (!state.currentUser) return Promise.resolve();
    
    return new Promise((resolve) => {
        // Load private chats
        db.collection('chats')
            .where('participants', 'array-contains', state.currentUser.uid)
            .where('type', '==', 'private')
            .onSnapshot(snapshot => {
                const chats = [];
                snapshot.forEach(doc => {
                    chats.push({ id: doc.id, ...doc.data() });
                });
                updateChatsList(chats);
                resolve();
            });
    });
}

function setupPresence() {
    if (!state.currentUser) return;
    
    const userRef = db.collection('users').doc(state.currentUser.uid);
    
    // Set online
    userRef.update({
        status: 'online',
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Handle disconnect
    const handleDisconnect = () => {
        userRef.update({
            status: 'offline',
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
    };
    
    window.addEventListener('beforeunload', handleDisconnect);
}

// ============================================
// CHAT MANAGEMENT
// ============================================

function openNewChatModal() {
    elements.newChatModal.classList.add('active');
    loadUsersForNewChat();
}

function loadUsersForNewChat() {
    const usersList = document.getElementById('new-chat-users');
    if (!usersList) return;
    
    usersList.innerHTML = '';
    
    state.contacts.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'contact-item';
        userItem.innerHTML = `
            <div class="item-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="item-info">
                <div class="item-name">${user.displayName}</div>
                <div class="item-status">${user.status || 'offline'}</div>
            </div>
        `;
        
        userItem.addEventListener('click', async () => {
            await startPrivateChat(user.uid);
            elements.newChatModal.classList.remove('active');
        });
        
        usersList.appendChild(userItem);
    });
}

async function startPrivateChat(userId) {
    if (!state.currentUser) return;
    
    try {
        // Generate chat ID
        const chatId = [state.currentUser.uid, userId].sort().join('_');
        
        // Get user info
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            showNotification('User not found', 'error');
            return;
        }
        
        const user = userDoc.data();
        
        // Check if chat exists
        const chatDoc = await db.collection('chats').doc(chatId).get();
        
        if (!chatDoc.exists) {
            // Create new chat
            await db.collection('chats').doc(chatId).set({
                id: chatId,
                type: 'private',
                participants: [state.currentUser.uid, userId],
                participantNames: {
                    [state.currentUser.uid]: state.currentUser.displayName,
                    [userId]: user.displayName
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
                name: user.displayName
            });
        }
        
        // Switch to chat
        switchToChat(chatId, 'private', user.displayName);
        
    } catch (error) {
        console.error("Error starting private chat:", error);
        showNotification('Failed to start chat', 'error');
    }
}

function openNewGroupModal() {
    elements.newGroupModal.classList.add('active');
    loadUsersForNewGroup();
}

function loadUsersForNewGroup() {
    const membersList = document.getElementById('available-members');
    if (!membersList) return;
    
    membersList.innerHTML = '';
    state.selectedUsers.clear();
    document.getElementById('selected-members').innerHTML = '';
    
    state.contacts.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'contact-item';
        userItem.innerHTML = `
            <input type="checkbox" class="user-checkbox" id="user-${user.uid}" value="${user.uid}">
            <div class="item-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="item-info">
                <div class="item-name">${user.displayName}</div>
                <div class="item-status">${user.role || 'student'}</div>
            </div>
        `;
        
        const checkbox = userItem.querySelector('.user-checkbox');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                state.selectedUsers.add(user.uid);
                addSelectedMember(user);
            } else {
                state.selectedUsers.delete(user.uid);
                removeSelectedMember(user.uid);
            }
        });
        
        membersList.appendChild(userItem);
    });
}

function addSelectedMember(user) {
    const selectedDiv = document.getElementById('selected-members');
    if (!selectedDiv) return;
    
    const memberTag = document.createElement('div');
    memberTag.className = 'member-tag';
    memberTag.innerHTML = `
        <span>${user.displayName}</span>
        <button type="button" data-uid="${user.uid}">&times;</button>
    `;
    
    memberTag.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = e.target.dataset.uid;
        state.selectedUsers.delete(uid);
        const checkbox = document.getElementById(`user-${uid}`);
        if (checkbox) checkbox.checked = false;
        memberTag.remove();
    });
    
    selectedDiv.appendChild(memberTag);
}

function removeSelectedMember(uid) {
    const tag = document.querySelector(`.member-tag button[data-uid="${uid}"]`)?.parentElement;
    if (tag) tag.remove();
}

async function createGroup() {
    const nameInput = document.getElementById('group-name-input');
    const descriptionInput = document.getElementById('group-description-input');
    
    if (!nameInput || !descriptionInput) {
        showNotification('Form elements not found', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim();
    
    if (!name) {
        showNotification('Please enter group name', 'error');
        return;
    }
    
    if (state.selectedUsers.size === 0) {
        showNotification('Please select at least one member', 'error');
        return;
    }
    
    try {
        showNotification('Creating group...', 'info');
        
        // Add current user to members
        const members = Array.from(state.selectedUsers);
        members.push(state.currentUser.uid);
        
        // Create group data
        const groupData = {
            name: name,
            description: description,
            createdBy: state.currentUser.uid,
            creatorName: state.currentUser.displayName,
            members: members,
            admins: [state.currentUser.uid],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'group'
        };
        
        // Create group document
        const groupRef = await db.collection('groups').add(groupData);
        const groupId = groupRef.id;
        
        // Create chat document for the group
        await db.collection('chats').doc(groupId).set({
            id: groupId,
            type: 'group',
            name: name,
            participants: members,
            groupId: groupId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Add welcome message
        await db.collection('messages').add({
            chatId: groupId,
            type: 'system',
            text: `${state.currentUser.displayName} created the group "${name}"`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            senderId: 'system',
            senderName: 'System'
        });
        
        showNotification(`Group "${name}" created successfully!`, 'success');
        
        // Close modal
        elements.newGroupModal.classList.remove('active');
        
        // Clear form
        nameInput.value = '';
        descriptionInput.value = '';
        state.selectedUsers.clear();
        document.getElementById('selected-members').innerHTML = '';
        
        // Switch to new group
        switchToChat(groupId, 'group', name);
        
    } catch (error) {
        console.error("Error creating group:", error);
        showNotification('Failed to create group: ' + error.message, 'error');
    }
}

function switchToChat(chatId, type, name = '') {
    // Stop previous listener
    if (state.messageListener) {
        state.messageListener();
        state.messageListener = null;
    }
    
    // Update state
    state.currentChat = { id: chatId, type: type };
    
    // Clear messages
    elements.messages.innerHTML = '';
    
    // Update UI
    if (name) {
        elements.chatTitle.textContent = name;
        elements.chatSubtitle.textContent = type === 'private' ? 'Private chat' : 'Group chat';
    }
    
    // Load messages
    loadChatMessages(chatId);
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        elements.sidebar.classList.remove('active');
    }
    
    // Focus message input
    elements.messageInput.focus();
}

function loadChatMessages(chatId) {
    if (!chatId) return;
    
    // Set up real-time listener
    state.messageListener = db.collection('messages')
        .where('chatId', '==', chatId)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            elements.messages.innerHTML = '';
            
            snapshot.forEach(doc => {
                const message = doc.data();
                displayMessage(message);
            });
            
            // Scroll to bottom
            setTimeout(() => {
                elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
            }, 100);
            
        }, error => {
            console.error("Error loading messages:", error);
            
            // Check for index error
            if (error.code === 'failed-precondition') {
                showNotification('Database index needed. Please create index for messages collection.', 'error');
            }
        });
}

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-wrapper ${message.senderId === state.currentUser.uid ? 'sent' : 'received'}`;
    
    const isCurrentUser = message.senderId === state.currentUser.uid;
    const isSystem = message.type === 'system';
    const timestamp = message.timestamp?.toDate ? 
        formatTime(message.timestamp.toDate()) : 
        formatTime(new Date());
    
    let content = '';
    
    if (isSystem) {
        content = `
            <div class="message-bubble" style="max-width: 100%; justify-content: center;">
                <div class="message-content" style="background: rgba(10, 61, 98, 0.1); color: #0a3d62;">
                    <div class="message-text" style="text-align: center; font-style: italic;">${message.text}</div>
                </div>
            </div>
        `;
    } else if (message.type === 'image') {
        content = `
            <div class="message-bubble">
                <div class="message-content">
                    ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
                    <div class="message-media">
                        <img src="${message.fileUrl}" alt="Image" style="max-width: 300px; border-radius: 8px;">
                    </div>
                    ${message.caption ? `<div class="message-text">${message.caption}</div>` : ''}
                    <div class="message-time">${timestamp}</div>
                </div>
            </div>
        `;
    } else if (message.type === 'audio') {
        content = `
            <div class="message-bubble">
                <div class="message-content">
                    ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
                    <div class="audio-message">
                        <button class="play-btn">
                            <i class="fas fa-play"></i>
                        </button>
                        <div class="audio-controls">
                            <div class="audio-progress">
                                <div class="progress-bar" style="width: 0%"></div>
                            </div>
                            <div class="audio-duration">${formatDuration(message.duration || 0)}</div>
                        </div>
                    </div>
                    <div class="message-time">${timestamp}</div>
                </div>
            </div>
        `;
    } else if (message.type === 'file') {
        content = `
            <div class="message-bubble">
                <div class="message-content">
                    ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
                    <a href="${message.fileUrl}" class="message-file" target="_blank" download="${message.fileName}">
                        <div class="file-icon">
                            <i class="fas fa-file"></i>
                        </div>
                        <div class="file-info">
                            <div class="file-name">${message.fileName}</div>
                            <div class="file-size">${formatFileSize(message.fileSize)}</div>
                        </div>
                        <button class="download-btn">
                            <i class="fas fa-download"></i>
                        </button>
                    </a>
                    <div class="message-time">${timestamp}</div>
                </div>
            </div>
        `;
    } else {
        // Text message
        content = `
            <div class="message-bubble">
                <div class="message-content">
                    ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
                    <div class="message-text">${message.text}</div>
                    <div class="message-time">${timestamp}</div>
                </div>
            </div>
        `;
    }
    
    messageDiv.innerHTML = content;
    elements.messages.appendChild(messageDiv);
    
    // Setup audio player if audio message
    if (message.type === 'audio') {
        setupAudioPlayer(messageDiv.querySelector('.audio-message'), message.fileUrl);
    }
}

// ============================================
// MESSAGING
// ============================================

async function sendMessage() {
    if (!AppState.currentChat || !AppState.currentUser) {
        showNotification('Select a chat first', 'error');
        return;
    }
    
    const text = UI.messageInput.value.trim();
    if (!text && !AppState.selectedFile) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    try {
        let messageData = {
            chatId: AppState.currentChat.id,
            senderId: AppState.currentUser.uid,
            senderName: AppState.currentUser.displayName || AppState.currentUser.email.split('@')[0],
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'text',
            text: text,
            status: 'sent'
        };
        
        // Handle file upload if present
        if (AppState.selectedFile) {
            console.log("Uploading file:", AppState.selectedFile);
            
            // Upload file to Firebase Storage
            const fileUrl = await uploadFile(AppState.selectedFile);
            
            // Build message data based on file type
            messageData.type = AppState.selectedFile.type;
            messageData.fileUrl = fileUrl;
            messageData.fileName = AppState.selectedFile.name || `file_${Date.now()}`;
            messageData.fileSize = AppState.selectedFile.size || 0;
            
            if (AppState.selectedFile.caption) {
                messageData.caption = AppState.selectedFile.caption;
            }
            
            if (text && text.trim() && !AppState.selectedFile.caption) {
                messageData.caption = text;
            }
            
            if (AppState.selectedFile.type === 'audio' && AppState.selectedFile.duration) {
                messageData.duration = AppState.selectedFile.duration;
            }
            
            // Clear selected file
            AppState.selectedFile = null;
        }
        
        console.log("Saving message data:", messageData);
        
        // Validate all required fields
        if (!messageData.chatId) {
            throw new Error('Chat ID is required');
        }
        
        if (!messageData.senderId) {
            throw new Error('Sender ID is required');
        }
        
        if (!messageData.type) {
            throw new Error('Message type is required');
        }
        
        // For text messages, ensure text field exists
        if (messageData.type === 'text' && !messageData.text) {
            messageData.text = " "; // Empty text placeholder
        }
        
        // For file messages, ensure fileUrl exists
        if (['image', 'audio', 'file'].includes(messageData.type) && !messageData.fileUrl) {
            throw new Error('File URL is required for file messages');
        }
        
        // Save message to Firestore
        const messageRef = await db.collection('messages').add(messageData);
        console.log("✅ Message sent with ID:", messageRef.id);
        
        // Update chat's last message
        await updateChatLastMessage(messageData);
        
        // Clear input
        UI.messageInput.value = '';
        UI.messageInput.focus();
        UI.sendBtn.classList.remove('active');
        
        // Hide attachment menu
        UI.attachmentMenu.classList.remove('active');
        
    } catch (error) {
        console.error("❌ Error sending message:", error);
        showNotification('Failed to send message: ' + error.message, 'error');
    }
}

async function uploadFile(fileData) {
    return new Promise((resolve, reject) => {
        console.log("Starting file upload:", fileData);
        
        if (!fileData || !fileData.file) {
            reject(new Error('No file provided'));
            return;
        }
        
        const file = fileData.file;
        
        // Show upload progress
        showUploadProgress(file.name, file.size);
        
        // Generate unique file name
        const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const fileExt = file.name.split('.').pop() || 'file';
        const fileName = `${fileId}.${fileExt}`;
        const filePath = `uploads/${AppState.currentUser.uid}/${AppState.currentChat.id}/${fileName}`;
        
        console.log("Uploading to path:", filePath);
        
        // Upload to Firebase Storage
        const uploadTask = storage.ref(filePath).put(file);
        
        AppState.uploadTask = uploadTask;
        
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                updateUploadProgress(progress);
                console.log(`Upload progress: ${progress}%`);
            },
            (error) => {
                console.error("Upload error:", error);
                hideUploadProgress();
                reject(new Error('Upload failed: ' + error.message));
            },
            async () => {
                try {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    console.log("Upload successful, URL:", downloadURL);
                    hideUploadProgress();
                    resolve(downloadURL);
                } catch (error) {
                    console.error("Error getting download URL:", error);
                    hideUploadProgress();
                    reject(new Error('Failed to get download URL'));
                }
            }
        );
    });
}
async function updateChatLastMessage(message) {
    if (!AppState.currentChat) return;
    
    try {
        const chatRef = db.collection('chats').doc(AppState.currentChat.id);
        
        // Prepare last message data
        let lastMessageText = '';
        if (message.type === 'text') {
            lastMessageText = message.text;
        } else if (message.type === 'image') {
            lastMessageText = '📷 Image';
        } else if (message.type === 'audio') {
            lastMessageText = '🎤 Audio message';
        } else if (message.type === 'file') {
            lastMessageText = '📎 File';
        } else {
            lastMessageText = 'New message';
        }
        
        const lastMessage = {
            text: lastMessageText,
            senderId: message.senderId,
            senderName: message.senderName,
            timestamp: message.timestamp || firebase.firestore.FieldValue.serverTimestamp(),
            type: message.type
        };
        
        await chatRef.update({
            lastMessage: lastMessage,
            lastMessageAt: message.timestamp || firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log("✅ Chat last message updated");
        
    } catch (error) {
        console.error("Error updating chat last message:", error);
    }
}
// ============================================
// ATTACHMENTS & AUDIO
// ============================================

function handleAttachment(type) {
    elements.attachmentMenu.classList.remove('active');
    
    if (type === 'image' || type === 'document') {
        openFilePicker(type);
    } else if (type === 'audio') {
        startAudioRecording();
    } else if (type === 'camera') {
        openCamera();
    }
}

function openFilePicker(accept) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept === 'image' ? 'image/*' : '*/*';
    input.multiple = false;
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (accept === 'image') {
            // Preview image
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewContent = document.getElementById('preview-content');
                previewContent.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" style="max-width: 100%; border-radius: 8px;">
                    <div class="preview-caption" style="margin-top: 15px;">
                        <input type="text" id="image-caption" placeholder="Add a caption (optional)" 
                               style="width: 100%; padding: 10px; border: 1px solid var(--zu-border); border-radius: 4px;">
                    </div>
                `;
                
                UI.filePreviewModal.classList.add('active');
                
                // Handle send button
                document.getElementById('send-file-btn').onclick = () => {
                    const caption = document.getElementById('image-caption').value;
                    AppState.selectedFile = {
                        file: file,
                        type: 'image',
                        name: file.name,
                        size: file.size,
                        caption: caption
                    };
                    UI.filePreviewModal.classList.remove('active');
                    sendMessage();
                };
            };
            reader.readAsDataURL(file);
        } else {
            // For documents
            AppState.selectedFile = {
                file: file,
                type: 'file',
                name: file.name,
                size: file.size
            };
            sendMessage();
        }
    };
    
    input.click();
}

function startAudioRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('Audio recording not supported', 'error');
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            AppState.mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];
            
            AppState.mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            
            AppState.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const duration = (Date.now() - AppState.recordingStartTime) / 1000;
                
                const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
                    type: 'audio/webm'
                });
                
                AppState.selectedFile = {
                    file: audioFile,
                    type: 'audio',
                    name: audioFile.name,
                    size: audioFile.size,
                    duration: duration
                };
                
                await sendMessage();
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            // Start recording
            AppState.mediaRecorder.start();
            AppState.recordingStartTime = Date.now();
            startRecordingTimer();
            
            // Show recorder UI
            UI.audioRecorder.classList.add('active');
            
        })
        .catch(error => {
            console.error("Error accessing microphone:", error);
            showNotification('Microphone access denied', 'error');
        });
}

function startAudioRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('Audio recording not supported', 'error');
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            state.mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];
            
            state.mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            
            state.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const duration = (Date.now() - state.recordingStartTime) / 1000;
                
                state.selectedFile = {
                    file: new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' }),
                    type: 'audio',
                    duration: duration
                };
                
                await sendMessage();
                
                // Stop tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            // Start recording
            state.mediaRecorder.start();
            state.recordingStartTime = Date.now();
            startRecordingTimer();
            
            // Show UI
            elements.audioRecorder.classList.add('active');
            
        })
        .catch(error => {
            console.error("Microphone error:", error);
            showNotification('Microphone access denied', 'error');
        });
}

function stopRecording() {
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
        stopRecordingTimer();
        elements.audioRecorder.classList.remove('active');
    }
}

function cancelRecording() {
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
        stopRecordingTimer();
        elements.audioRecorder.classList.remove('active');
        showNotification('Recording cancelled', 'info');
    }
}

function startRecordingTimer() {
    state.recordingStartTime = Date.now();
    state.recordingTimer = setInterval(() => {
        const elapsed = Date.now() - state.recordingStartTime;
        elements.recordingTime.textContent = formatDuration(elapsed / 1000);
    }, 1000);
}

function stopRecordingTimer() {
    if (state.recordingTimer) {
        clearInterval(state.recordingTimer);
        state.recordingTimer = null;
    }
}

// ============================================
// UI UPDATES
// ============================================

function updateChatsList(chats) {
    elements.chatsList.innerHTML = '';
    
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${state.currentChat?.id === chat.id ? 'active' : ''}`;
        
        chatItem.innerHTML = `
            <div class="item-avatar ${chat.type === 'group' ? 'group' : ''}">
                <i class="fas fa-${chat.type === 'group' ? 'users' : 'user'}"></i>
            </div>
            <div class="item-info">
                <div class="item-name">${chat.name || 'Chat'}</div>
                <div class="item-last-message">${chat.lastMessage?.text || 'No messages yet'}</div>
            </div>
            <div class="item-time">${chat.lastMessage ? formatTime(chat.lastMessage.timestamp?.toDate()) : ''}</div>
        `;
        
        chatItem.addEventListener('click', () => {
            switchToChat(chat.id, chat.type, chat.name);
        });
        
        elements.chatsList.appendChild(chatItem);
    });
}

function updateGroupsList() {
    elements.groupsList.innerHTML = '';
    
    state.groups.forEach(group => {
        const groupItem = document.createElement('div');
        groupItem.className = `group-item ${state.currentChat?.id === group.id ? 'active' : ''}`;
        
        groupItem.innerHTML = `
            <div class="item-avatar group">
                <i class="fas fa-users"></i>
            </div>
            <div class="item-info">
                <div class="item-name">${group.name}</div>
                <div class="item-last-message">${group.members?.length || 0} members</div>
            </div>
        `;
        
        groupItem.addEventListener('click', () => {
            switchToChat(group.id, 'group', group.name);
        });
        
        elements.groupsList.appendChild(groupItem);
    });
}

function updateContactsList() {
    elements.contactsList.innerHTML = '';
    
    state.contacts.forEach(user => {
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        
        const isOnline = state.onlineUsers.has(user.uid);
        
        contactItem.innerHTML = `
            <div class="item-avatar">
                <i class="fas fa-user"></i>
                ${isOnline ? '<div class="status-dot online"></div>' : ''}
            </div>
            <div class="item-info">
                <div class="item-name">${user.displayName}</div>
                <div class="item-status">${isOnline ? 'Online' : 'Offline'}</div>
            </div>
        `;
        
        contactItem.addEventListener('click', async () => {
            await startPrivateChat(user.uid);
        });
        
        elements.contactsList.appendChild(contactItem);
    });
}

function handleMessageInput() {
    const hasText = elements.messageInput.value.trim().length > 0;
    elements.sendBtn.classList.toggle('active', hasText);
}

function toggleAttachmentMenu() {
    elements.attachmentMenu.classList.toggle('active');
}

function toggleVoiceRecording() {
    if (elements.audioRecorder.classList.contains('active')) {
        stopRecording();
    } else {
        startAudioRecording();
    }
}

function toggleEmojiPicker() {
    elements.emojiPicker.classList.toggle('active');
}

function loadEmojis(category) {
    elements.emojiGrid.innerHTML = '';
    
    const emojis = state.emojiList[category] || [];
    
    emojis.forEach(emoji => {
        const button = document.createElement('button');
        button.className = 'emoji-item';
        button.textContent = emoji;
        button.addEventListener('click', () => {
            elements.messageInput.value += emoji;
            elements.messageInput.focus();
            handleMessageInput();
        });
        elements.emojiGrid.appendChild(button);
    });
}

function setupAudioPlayer(audioElement, audioUrl) {
    if (!audioElement || !audioUrl) return;
    
    const playBtn = audioElement.querySelector('.play-btn');
    const progressBar = audioElement.querySelector('.progress-bar');
    const durationElement = audioElement.querySelector('.audio-duration');
    
    const audio = new Audio(audioUrl);
    let isPlaying = false;
    
    // Update duration
    audio.addEventListener('loadedmetadata', () => {
        if (durationElement) {
            durationElement.textContent = formatDuration(audio.duration);
        }
    });
    
    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            audio.play();
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        isPlaying = !isPlaying;
    });
    
    audio.addEventListener('timeupdate', () => {
        if (progressBar && audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = `${progress}%`;
        }
    });
    
    audio.addEventListener('ended', () => {
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showNotification(title, type = 'info', message = '') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                            type === 'error' ? 'exclamation-circle' : 
                            type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            ${message ? `<div class="notification-message">${message}</div>` : ''}
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    elements.notificationsContainer.appendChild(notification);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto remove
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    // Log to console
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
}

function formatTime(date) {
    if (!(date instanceof Date)) date = new Date(date);
    
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function showUploadProgress(fileName, fileSize) {
    elements.uploadFileName.textContent = fileName;
    elements.uploadFileSize.textContent = formatFileSize(fileSize);
    elements.uploadProgress.classList.add('active');
}

function updateUploadProgress(percentage) {
    elements.progressFill.style.width = `${percentage}%`;
    elements.uploadPercentage.textContent = `${Math.round(percentage)}%`;
}

function hideUploadProgress() {
    setTimeout(() => {
        elements.uploadProgress.classList.remove('active');
        elements.progressFill.style.width = '0%';
        elements.uploadPercentage.textContent = '0%';
    }, 500);
}

function cancelUpload() {
    if (state.uploadTask) {
        state.uploadTask.cancel();
        hideUploadProgress();
        showNotification('Upload cancelled', 'info');
        state.uploadTask = null;
    }
}

function handleProfileAction(action) {
    switch (action) {
        case 'profile':
            showNotification('Profile', 'info', 'Profile feature coming soon');
            break;
        case 'settings':
            showNotification('Settings', 'info', 'Settings feature coming soon');
            break;
        case 'notifications':
            showNotification('Notifications', 'info', 'Notification settings coming soon');
            break;
        case 'logout':
            auth.signOut();
            break;
    }
    elements.profileMenu.classList.remove('active');
}

// Global functions
window.showNotification = showNotification;
window.startPrivateChat = startPrivateChat;

console.log("🎉 ZU Chat System Ready!");