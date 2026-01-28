// ============================================
// ZANZIBAR UNIVERSITY CHAT - COMPLETE WORKING VERSION
// ============================================

console.log("🎓 Zanzibar University Chat starting...");

// Global Application State
const AppState = {
    currentUser: null,
    currentChat: null,
    onlineUsers: new Map(),
    contacts: new Map(),
    groups: new Map(),
    chats: new Map(),
    messageListeners: new Map(),
    typingListeners: new Map(),
    selectedUsers: new Set(),
    mediaRecorder: null,
    recordingTimer: null,
    recordingStartTime: null,
    selectedFile: null,
    uploadTask: null
};

// DOM Elements Cache
const UI = {
    // Screens
    loadingScreen: document.getElementById('loading-screen'),
    authScreen: document.getElementById('auth-screen'),
    chatScreen: document.getElementById('chat-screen'),
    
    // Auth Elements
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    loginBtn: document.getElementById('login-btn'),
    signupBtn: document.getElementById('signup-btn'),
    googleBtn: document.getElementById('google-btn'),
    showPasswordBtn: document.querySelector('.show-password'),
    
    // Sidebar Elements
    sidebar: document.getElementById('sidebar'),
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    userEmail: document.getElementById('user-email'),
    profileMenuBtn: document.getElementById('profile-menu-btn'),
    profileMenu: document.getElementById('profile-menu'),
    searchInput: document.getElementById('search-input'),
    navBtns: document.querySelectorAll('.nav-btn'),
    newChatBtn: document.getElementById('new-chat-btn'),
    newGroupBtn: document.getElementById('new-group-btn'),
    chatsList: document.getElementById('chats-list'),
    groupsList: document.getElementById('groups-list'),
    contactsList: document.getElementById('contacts-list'),
    contactsFilter: document.getElementById('contacts-filter'),
    
    // Main Chat Elements
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
    
    // Upload Progress
    uploadProgress: document.getElementById('upload-progress'),
    uploadPercentage: document.getElementById('upload-percentage'),
    progressFill: document.getElementById('progress-fill'),
    uploadFileName: document.getElementById('upload-file-name'),
    uploadFileSize: document.getElementById('upload-file-size'),
    cancelUpload: document.getElementById('cancel-upload')
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("📚 DOM ready, initializing ZU Chat...");
    
    // Setup all event listeners
    setupEventListeners();
    
    // Check auth state
    checkAuthState();
    
    // Hide loading screen
    setTimeout(() => {
        UI.loadingScreen.style.display = 'none';
    }, 1000);
    
    console.log("✅ Zanzibar University Chat initialized");
});

function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await handleUserLogin(user);
        } else {
            handleUserLogout();
        }
    });
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
    console.log("🔗 Setting up event listeners...");
    
    // Auth events
    UI.loginBtn.addEventListener('click', handleLogin);
    UI.signupBtn.addEventListener('click', handleSignup);
    UI.googleBtn.addEventListener('click', handleGoogleLogin);
    
    // Enter key for login
    UI.emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    UI.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Show password toggle
    if (UI.showPasswordBtn) {
        UI.showPasswordBtn.addEventListener('click', () => {
            const type = UI.passwordInput.type === 'password' ? 'text' : 'password';
            UI.passwordInput.type = type;
            UI.showPasswordBtn.innerHTML = type === 'password' ? 
                '<i class="fas fa-eye"></i>' : 
                '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Navigation
    UI.navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchSidebarView(view);
        });
    });
    
    // New chat/group
    UI.newChatBtn.addEventListener('click', openNewChatModal);
    UI.newGroupBtn.addEventListener('click', openNewGroupModal);
    
    // Message input
    UI.messageInput.addEventListener('input', handleMessageInput);
    UI.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    UI.sendBtn.addEventListener('click', sendMessage);
    
    // Attachment handling
    UI.attachToggle.addEventListener('click', toggleAttachmentMenu);
    document.querySelectorAll('.attach-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            handleAttachment(type);
        });
    });
    
    // Voice recording
    if (UI.voiceToggle) {
        UI.voiceToggle.addEventListener('click', toggleVoiceRecording);
    }
    if (UI.cancelRecording) {
        UI.cancelRecording.addEventListener('click', cancelRecording);
    }
    if (UI.sendRecording) {
        UI.sendRecording.addEventListener('click', stopRecording);
    }
    
    // Emoji picker
    if (UI.emojiToggle) {
        UI.emojiToggle.addEventListener('click', toggleEmojiPicker);
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        // Close attachment menu
        if (UI.attachmentMenu && !UI.attachmentMenu.contains(e.target) && !UI.attachToggle.contains(e.target)) {
            UI.attachmentMenu.classList.remove('active');
        }
        
        // Close emoji picker
        if (UI.emojiPicker && !UI.emojiPicker.contains(e.target) && !UI.emojiToggle.contains(e.target)) {
            UI.emojiPicker.classList.remove('active');
        }
    });
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });
    
    // Create group button
    const createGroupBtn = document.getElementById('create-group-btn');
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', createGroup);
    }
    
    // Search functionality
    if (UI.searchInput) {
        UI.searchInput.addEventListener('input', handleSearch);
    }
    
    // Cancel upload
    if (UI.cancelUpload) {
        UI.cancelUpload.addEventListener('click', cancelUpload);
    }
    
    // Mobile menu toggle
    if (UI.backBtn) {
        UI.backBtn.addEventListener('click', () => {
            UI.sidebar.classList.add('active');
        });
    }
    
    // Profile menu
    if (UI.profileMenuBtn) {
        UI.profileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            UI.profileMenu.classList.toggle('active');
        });
    }
    
    // Profile menu actions
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.dataset.action;
            handleProfileMenuAction(action);
        });
    });
    
    // Load emojis
    loadEmojis('smileys');
    
    console.log("✅ All event listeners setup complete");
}

// ============================================
// AUTHENTICATION FUNCTIONS - FIXED
// ============================================

async function handleLogin() {
    const email = UI.emailInput.value.trim();
    const password = UI.passwordInput.value;
    
    if (!email || !password) {
        showNotification('Please enter email and password', 'error');
        return;
    }
    
    try {
        showNotification('Logging in...', 'info');
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        console.error("Login error:", error);
        showNotification(error.message, 'error');
    }
}

async function handleSignup() {
    const email = UI.emailInput.value.trim();
    const password = UI.passwordInput.value;
    
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
        
        // Extract name from email
        const name = email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Update profile
        await userCredential.user.updateProfile({
            displayName: name
        });
        
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
        
        // Set custom parameters
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        showNotification('Signing in with Google...', 'info');
        const result = await auth.signInWithPopup(provider);
        
        // Update user profile in Firestore
        const user = result.user;
        await updateUserProfile(user);
        
        showNotification('Signed in with Google!', 'success');
        
    } catch (error) {
        console.error("Google login error:", error);
        
        // Handle specific Google auth errors
        if (error.code === 'auth/popup-blocked') {
            showNotification('Popup blocked by browser. Please allow popups for this site.', 'error');
        } else if (error.code === 'auth/popup-closed-by-user') {
            showNotification('Sign in cancelled', 'info');
        } else {
            showNotification(error.message, 'error');
        }
    }
}

// ============================================
// USER MANAGEMENT
// ============================================

async function handleUserLogin(user) {
    console.log("👤 User logged in:", user.email);
    
    AppState.currentUser = user;
    
    // Update user profile in Firestore
    await updateUserProfile(user);
    
    // Update UI
    updateUserUI(user);
    
    // Show chat screen
    showScreen('chat-screen');
    
    // Load initial data
    await loadInitialData();
    
    showNotification(`Welcome ${user.displayName || user.email}!`, 'success');
}

function handleUserLogout() {
    console.log("👤 User logged out");
    
    // Clear all data
    AppState.currentUser = null;
    AppState.currentChat = null;
    AppState.onlineUsers.clear();
    AppState.contacts.clear();
    AppState.groups.clear();
    AppState.chats.clear();
    
    // Clear listeners
    AppState.messageListeners.forEach(unsub => unsub());
    AppState.messageListeners.clear();
    AppState.typingListeners.forEach(unsub => unsub());
    AppState.typingListeners.clear();
    
    // Clear UI
    UI.messages.innerHTML = '';
    UI.chatsList.innerHTML = '';
    UI.groupsList.innerHTML = '';
    UI.contactsList.innerHTML = '';
    
    // Show auth screen
    showScreen('auth-screen');
}

async function updateUserProfile(user) {
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=0a3d62&color=fff`,
        status: 'online',
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        role: user.email.includes('staff') || user.email.includes('admin') ? 'staff' : 'student'
    };
    
    try {
        await db.collection('users').doc(user.uid).set(userData, { merge: true });
    } catch (error) {
        console.error("Error updating user profile:", error);
    }
}

// ============================================
// UI MANAGEMENT
// ============================================

function showScreen(screenName) {
    // Show selected screen
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    
    const screenElement = document.getElementById(screenName);
    if (screenElement) {
        screenElement.style.display = 'flex';
    }
    
    // Mobile adjustments
    if (screenName === 'chat-screen' && window.innerWidth <= 768) {
        UI.sidebar.classList.remove('active');
    }
}

function updateUserUI(user) {
    if (UI.userName) {
        UI.userName.textContent = user.displayName || user.email.split('@')[0];
    }
    if (UI.userEmail) {
        UI.userEmail.textContent = user.email;
    }
    
    // Set avatar
    if (UI.userAvatar) {
        if (user.photoURL) {
            UI.userAvatar.style.backgroundImage = `url(${user.photoURL})`;
            UI.userAvatar.style.backgroundSize = 'cover';
            UI.userAvatar.innerHTML = '';
        } else {
            const initial = (user.displayName || user.email).charAt(0).toUpperCase();
            UI.userAvatar.innerHTML = initial;
            UI.userAvatar.style.background = 'linear-gradient(135deg, var(--zu-blue) 0%, var(--zu-light-blue) 100%)';
        }
    }
}

function switchSidebarView(view) {
    // Update active button
    UI.navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Show corresponding content
    document.querySelectorAll('.sidebar-content').forEach(content => {
        content.classList.toggle('active', content.id === `${view}-content`);
    });
}

// ============================================
// DATA LOADING
// ============================================

async function loadInitialData() {
    console.log("📦 Loading initial data...");
    
    // Load online users
    loadOnlineUsers();
    
    // Load all users (contacts)
    loadAllUsers();
    
    // Load user's groups
    loadUserGroups();
    
    // Load recent chats
    loadRecentChats();
    
    // Set up presence tracking
    setupPresenceTracking();
}

function loadOnlineUsers() {
    db.collection('users')
        .where('status', '==', 'online')
        .onSnapshot(snapshot => {
            AppState.onlineUsers.clear();
            snapshot.forEach(doc => {
                const user = doc.data();
                if (user.uid !== AppState.currentUser.uid) {
                    AppState.onlineUsers.set(user.uid, user);
                }
            });
            updateContactsList();
        }, error => {
            console.error("Error loading online users:", error);
        });
}

function loadAllUsers() {
    db.collection('users')
        .orderBy('displayName')
        .onSnapshot(snapshot => {
            AppState.contacts.clear();
            snapshot.forEach(doc => {
                const user = doc.data();
                if (user.uid !== AppState.currentUser.uid) {
                    AppState.contacts.set(user.uid, user);
                }
            });
            updateContactsList();
        }, error => {
            console.error("Error loading all users:", error);
        });
}

function loadUserGroups() {
    if (!AppState.currentUser) return;
    
    db.collection('groups')
        .where('members', 'array-contains', AppState.currentUser.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            AppState.groups.clear();
            snapshot.forEach(doc => {
                const group = { id: doc.id, ...doc.data() };
                AppState.groups.set(group.id, group);
            });
            updateGroupsList();
        }, error => {
            console.error("Error loading user groups:", error);
        });
}

function loadRecentChats() {
    if (!AppState.currentUser) return;
    
    // Load private chats
    const privateChatsQuery = db.collection('chats')
        .where('participants', 'array-contains', AppState.currentUser.uid)
        .where('type', '==', 'private')
        .orderBy('lastMessageAt', 'desc');
    
    privateChatsQuery.onSnapshot(snapshot => {
        snapshot.forEach(doc => {
            const chat = { id: doc.id, ...doc.data() };
            AppState.chats.set(chat.id, chat);
        });
        updateChatsList();
    }, error => {
        console.error("Error loading private chats:", error);
    });
}

function setupPresenceTracking() {
    if (!AppState.currentUser) return;
    
    const userRef = db.collection('users').doc(AppState.currentUser.uid);
    
    // Set online status
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
// CHAT MANAGEMENT - FIXED
// ============================================

function openNewChatModal() {
    UI.newChatModal.classList.add('active');
    loadUsersForNewChat();
}

function loadUsersForNewChat() {
    const usersList = document.getElementById('new-chat-users');
    if (!usersList) return;
    
    usersList.innerHTML = '';
    
    AppState.contacts.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'contact-item';
        userItem.innerHTML = `
            <div class="item-avatar" style="${user.photoURL ? `background-image: url(${user.photoURL})` : ''}">
                ${!user.photoURL ? '<i class="fas fa-user"></i>' : ''}
            </div>
            <div class="item-info">
                <div class="item-name">${user.displayName}</div>
                <div class="item-status">${user.role || 'student'} • ${user.status || 'offline'}</div>
            </div>
        `;
        
        userItem.addEventListener('click', async () => {
            await startPrivateChat(user.uid);
            UI.newChatModal.classList.remove('active');
        });
        
        usersList.appendChild(userItem);
    });
}

async function startPrivateChat(userId) {
    if (!AppState.currentUser) return;
    
    try {
        // Generate chat ID (sorted to ensure consistency)
        const chatId = [AppState.currentUser.uid, userId].sort().join('_');
        
        // Check if chat already exists
        const chatRef = db.collection('chats').doc(chatId);
        const chatDoc = await chatRef.get();
        
        const otherUser = AppState.contacts.get(userId);
        
        if (!chatDoc.exists) {
            // Create new chat
            await chatRef.set({
                id: chatId,
                type: 'private',
                participants: [AppState.currentUser.uid, userId],
                participantNames: {
                    [AppState.currentUser.uid]: AppState.currentUser.displayName,
                    [userId]: otherUser?.displayName || 'User'
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: {
                    text: 'Chat started',
                    senderId: AppState.currentUser.uid,
                    senderName: AppState.currentUser.displayName,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }
            });
        }
        
        // Switch to chat
        switchToChat(chatId, 'private', otherUser?.displayName || 'User');
        
    } catch (error) {
        console.error("Error starting private chat:", error);
        showNotification('Failed to start chat', 'error');
    }
}

function openNewGroupModal() {
    UI.newGroupModal.classList.add('active');
    loadUsersForNewGroup();
}

function loadUsersForNewGroup() {
    const membersList = document.getElementById('available-members');
    if (!membersList) return;
    
    membersList.innerHTML = '';
    
    AppState.selectedUsers.clear();
    const selectedMembersDiv = document.getElementById('selected-members');
    if (selectedMembersDiv) {
        selectedMembersDiv.innerHTML = '';
    }
    
    AppState.contacts.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'contact-item';
        userItem.innerHTML = `
            <input type="checkbox" class="user-checkbox" id="user-${user.uid}" value="${user.uid}">
            <div class="item-avatar" style="${user.photoURL ? `background-image: url(${user.photoURL})` : ''}">
                ${!user.photoURL ? '<i class="fas fa-user"></i>' : ''}
            </div>
            <div class="item-info">
                <div class="item-name">${user.displayName}</div>
                <div class="item-status">${user.role || 'student'}</div>
            </div>
        `;
        
        const checkbox = userItem.querySelector('.user-checkbox');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                AppState.selectedUsers.add(user.uid);
                addSelectedMember(user);
            } else {
                AppState.selectedUsers.delete(user.uid);
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
        AppState.selectedUsers.delete(uid);
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
    
    if (AppState.selectedUsers.size === 0) {
        showNotification('Please select at least one member', 'error');
        return;
    }
    
    try {
        showNotification('Creating group...', 'info');
        
        // Add current user to members
        const members = Array.from(AppState.selectedUsers);
        members.push(AppState.currentUser.uid);
        
        // Create group
        const groupData = {
            name: name,
            description: description,
            createdBy: AppState.currentUser.uid,
            creatorName: AppState.currentUser.displayName,
            members: members,
            admins: [AppState.currentUser.uid],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'group'
        };
        
        const groupRef = await db.collection('groups').add(groupData);
        const groupId = groupRef.id;
        
        // Create chat for the group
        await db.collection('chats').doc(groupId).set({
            id: groupId,
            type: 'group',
            name: name,
            participants: members,
            groupId: groupId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessage: {
                text: `Group "${name}" was created`,
                senderId: 'system',
                senderName: 'System',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }
        });
        
        // Add welcome message
        await db.collection('messages').add({
            chatId: groupId,
            type: 'system',
            text: `${AppState.currentUser.displayName} created the group "${name}"`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            senderId: 'system',
            senderName: 'System'
        });
        
        showNotification(`Group "${name}" created successfully!`, 'success');
        
        // Close modal
        UI.newGroupModal.classList.remove('active');
        
        // Clear form
        nameInput.value = '';
        descriptionInput.value = '';
        AppState.selectedUsers.clear();
        document.getElementById('selected-members').innerHTML = '';
        
        // Switch to new group
        setTimeout(() => {
            switchToChat(groupId, 'group', name);
        }, 500);
        
    } catch (error) {
        console.error("Error creating group:", error);
        showNotification(`Failed to create group: ${error.message}`, 'error');
    }
}

function switchToChat(chatId, type, name = null) {
    // Stop previous listener
    if (AppState.messageListeners.has(AppState.currentChat?.id)) {
        AppState.messageListeners.get(AppState.currentChat.id)();
    }
    
    // Stop previous typing listener
    if (AppState.typingListeners.has(AppState.currentChat?.id)) {
        AppState.typingListeners.get(AppState.currentChat.id)();
    }
    
    // Update current chat
    AppState.currentChat = { id: chatId, type: type };
    
    // Clear messages
    UI.messages.innerHTML = '';
    
    // Update UI
    updateChatUI(name);
    
    // Load messages
    loadChatMessages(chatId);
    
    // Load typing indicator
    loadTypingIndicator(chatId);
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        UI.sidebar.classList.remove('active');
    }
}

function updateChatUI(name = null) {
    if (!AppState.currentChat) {
        UI.chatTitle.textContent = 'Welcome to ZU Chat';
        UI.chatSubtitle.textContent = 'Select a chat to start messaging';
        UI.messages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-comments"></i>
                </div>
                <h2>Welcome to Zanzibar University Chat</h2>
                <p>Select a chat from the sidebar or start a new conversation</p>
            </div>
        `;
        return;
    }
    
    if (name) {
        UI.chatTitle.textContent = name;
        UI.chatSubtitle.textContent = AppState.currentChat.type === 'group' ? 'Group' : 'Private chat';
    } else {
        // Try to get name from state
        if (AppState.currentChat.type === 'group') {
            const group = AppState.groups.get(AppState.currentChat.id);
            UI.chatTitle.textContent = group?.name || 'Group';
            UI.chatSubtitle.textContent = 'Group';
        } else {
            UI.chatTitle.textContent = 'Private Chat';
            UI.chatSubtitle.textContent = 'Chatting...';
        }
    }
}

function loadChatMessages(chatId) {
    if (!chatId) return;
    
    // Clear existing listener
    if (AppState.messageListeners.has(chatId)) {
        AppState.messageListeners.get(chatId)();
    }
    
    // Set up real-time listener for messages
    const unsubscribe = db.collection('messages')
        .where('chatId', '==', chatId)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const message = change.doc.data();
                    displayMessage(message);
                }
            });
            
            // Scroll to bottom
            setTimeout(() => {
                UI.messagesContainer.scrollTop = UI.messagesContainer.scrollHeight;
            }, 100);
            
        }, error => {
            console.error("Error loading messages:", error);
            showNotification('Error loading messages', 'error');
        });
    
    // Store unsubscribe function
    AppState.messageListeners.set(chatId, unsubscribe);
}

function loadTypingIndicator(chatId) {
    if (!chatId) return;
    
    // Clear existing listener
    if (AppState.typingListeners.has(chatId)) {
        AppState.typingListeners.get(chatId)();
    }
    
    // Set up typing indicator listener
    const unsubscribe = db.collection('typing').doc(chatId)
        .onSnapshot(doc => {
            const data = doc.data();
            if (data) {
                const typingUsers = Object.keys(data).filter(uid => 
                    uid !== AppState.currentUser.uid && data[uid] === true
                );
                
                if (typingUsers.length > 0) {
                    showTypingIndicator(typingUsers);
                } else {
                    hideTypingIndicator();
                }
            } else {
                hideTypingIndicator();
            }
        });
    
    AppState.typingListeners.set(chatId, unsubscribe);
}

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-wrapper ${message.senderId === AppState.currentUser.uid ? 'sent' : 'received'}`;
    
    const isCurrentUser = message.senderId === AppState.currentUser.uid;
    const timestamp = message.timestamp?.toDate ? 
        formatTime(message.timestamp.toDate()) : 
        formatTime(new Date());
    
    let content = '';
    
    switch (message.type) {
        case 'text':
            content = `
                <div class="message-bubble">
                    <div class="message-content">
                        ${!isCurrentUser && message.senderName ? 
                            `<div class="message-sender">${message.senderName}</div>` : ''}
                        <div class="message-text">${message.text}</div>
                        <div class="message-time">${timestamp}</div>
                    </div>
                </div>
            `;
            break;
            
        case 'image':
            content = `
                <div class="message-bubble">
                    <div class="message-content">
                        ${!isCurrentUser && message.senderName ? 
                            `<div class="message-sender">${message.senderName}</div>` : ''}
                        <div class="message-media">
                            <img src="${message.fileUrl}" alt="Image" onclick="viewImage('${message.fileUrl}')">
                        </div>
                        ${message.caption ? `<div class="message-text">${message.caption}</div>` : ''}
                        <div class="message-time">${timestamp}</div>
                    </div>
                </div>
            `;
            break;
            
        case 'audio':
            content = `
                <div class="message-bubble">
                    <div class="message-content">
                        ${!isCurrentUser && message.senderName ? 
                            `<div class="message-sender">${message.senderName}</div>` : ''}
                        <div class="audio-message" data-audio-url="${message.fileUrl}">
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
            break;
            
        case 'file':
            content = `
                <div class="message-bubble">
                    <div class="message-content">
                        ${!isCurrentUser && message.senderName ? 
                            `<div class="message-sender">${message.senderName}</div>` : ''}
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
            break;
            
        case 'system':
            content = `
                <div class="message-bubble" style="max-width: 100%; justify-content: center;">
                    <div class="message-content" style="background: rgba(10, 61, 98, 0.1); color: var(--zu-blue);">
                        <div class="message-text" style="text-align: center; font-style: italic;">${message.text}</div>
                        <div class="message-time">${timestamp}</div>
                    </div>
                </div>
            `;
            break;
    }
    
    messageDiv.innerHTML = content;
    UI.messages.appendChild(messageDiv);
    
    // Add audio player functionality
    if (message.type === 'audio') {
        setupAudioPlayer(messageDiv.querySelector('.audio-message'));
    }
}

// ============================================
// MESSAGING - FIXED
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
            senderName: AppState.currentUser.displayName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'text',
            text: text,
            status: 'sent'
        };
        
        // Handle file upload if present
        if (AppState.selectedFile) {
            const fileUrl = await uploadFile(AppState.selectedFile);
            messageData = {
                ...messageData,
                type: AppState.selectedFile.type,
                fileUrl: fileUrl,
                fileName: AppState.selectedFile.name,
                fileSize: AppState.selectedFile.size,
                caption: text
            };
            
            if (AppState.selectedFile.type === 'audio') {
                messageData.duration = AppState.selectedFile.duration || 0;
            }
            
            AppState.selectedFile = null;
        }
        
        // Save message to Firestore
        await db.collection('messages').add(messageData);
        
        // Update chat's last message
        await updateChatLastMessage(messageData);
        
        // Clear input
        UI.messageInput.value = '';
        UI.messageInput.focus();
        UI.sendBtn.classList.remove('active');
        
        // Clear typing indicator
        await db.collection('typing').doc(AppState.currentChat.id).update({
            [AppState.currentUser.uid]: firebase.firestore.FieldValue.delete()
        });
        
    } catch (error) {
        console.error("Error sending message:", error);
        showNotification(`Failed to send message: ${error.message}`, 'error');
    }
}

async function uploadFile(file) {
    return new Promise((resolve, reject) => {
        // Show upload progress
        showUploadProgress(file.name, file.size);
        
        // Generate unique file name
        const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const fileExt = file.name.split('.').pop();
        const fileName = `${fileId}.${fileExt}`;
        const filePath = `uploads/${AppState.currentUser.uid}/${AppState.currentChat.id}/${fileName}`;
        
        // Upload to Firebase Storage
        const uploadTask = storage.ref(filePath).put(file);
        
        AppState.uploadTask = uploadTask;
        
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                updateUploadProgress(progress);
            },
            (error) => {
                hideUploadProgress();
                reject(error);
            },
            async () => {
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                hideUploadProgress();
                resolve(downloadURL);
            }
        );
    });
}

async function updateChatLastMessage(message) {
    if (!AppState.currentChat) return;
    
    const chatRef = db.collection('chats').doc(AppState.currentChat.id);
    
    const lastMessage = {
        text: message.type === 'text' ? message.text : 
              message.type === 'image' ? '📷 Sent an image' :
              message.type === 'audio' ? '🎤 Sent an audio message' :
              message.type === 'file' ? '📎 Sent a file' : message.text,
        senderId: message.senderId,
        senderName: message.senderName,
        timestamp: message.timestamp
    };
    
    await chatRef.update({
        lastMessage: lastMessage,
        lastMessageAt: message.timestamp,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// ============================================
// ATTACHMENTS & AUDIO - FIXED
// ============================================

function handleAttachment(type) {
    UI.attachmentMenu.classList.remove('active');
    
    switch (type) {
        case 'image':
        case 'document':
            openFilePicker(type);
            break;
        case 'audio':
            startAudioRecording();
            break;
        default:
            showNotification('Feature coming soon', 'info');
            break;
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
                if (!previewContent) {
                    // If preview modal doesn't exist, send directly
                    AppState.selectedFile = {
                        file: file,
                        type: 'image'
                    };
                    sendMessage();
                    return;
                }
                
                previewContent.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" style="max-width: 100%; border-radius: 8px;">
                    <div class="preview-caption" style="margin-top: 15px;">
                        <input type="text" id="image-caption" placeholder="Add a caption (optional)" 
                               style="width: 100%; padding: 10px; border: 1px solid var(--zu-border); border-radius: 4px;">
                    </div>
                `;
                
                UI.filePreviewModal.classList.add('active');
                
                // Handle send button
                const sendBtn = document.getElementById('send-file-btn');
                if (sendBtn) {
                    sendBtn.onclick = () => {
                        const caption = document.getElementById('image-caption')?.value || '';
                        AppState.selectedFile = {
                            file: file,
                            type: 'image',
                            caption: caption
                        };
                        UI.filePreviewModal.classList.remove('active');
                        sendMessage();
                    };
                }
            };
            reader.readAsDataURL(file);
        } else {
            AppState.selectedFile = {
                file: file,
                type: 'file'
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
                
                AppState.selectedFile = {
                    file: new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' }),
                    type: 'audio',
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

function stopRecording() {
    if (AppState.mediaRecorder && AppState.mediaRecorder.state !== 'inactive') {
        AppState.mediaRecorder.stop();
        stopRecordingTimer();
        UI.audioRecorder.classList.remove('active');
    }
}

function cancelRecording() {
    if (AppState.mediaRecorder && AppState.mediaRecorder.state !== 'inactive') {
        AppState.mediaRecorder.stop();
        stopRecordingTimer();
        UI.audioRecorder.classList.remove('active');
        showNotification('Recording cancelled', 'info');
    }
}

function startRecordingTimer() {
    AppState.recordingStartTime = Date.now();
    AppState.recordingTimer = setInterval(() => {
        const elapsed = Date.now() - AppState.recordingStartTime;
        UI.recordingTime.textContent = formatDuration(elapsed / 1000);
    }, 1000);
}

function stopRecordingTimer() {
    if (AppState.recordingTimer) {
        clearInterval(AppState.recordingTimer);
        AppState.recordingTimer = null;
    }
}

// ============================================
// UI UPDATES
// ============================================

function updateChatsList() {
    UI.chatsList.innerHTML = '';
    
    AppState.chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${AppState.currentChat?.id === chat.id ? 'active' : ''}`;
        
        const isGroup = chat.type === 'group';
        
        chatItem.innerHTML = `
            <div class="item-avatar ${isGroup ? 'group' : ''}">
                <i class="fas fa-${isGroup ? 'users' : 'user'}"></i>
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
        
        UI.chatsList.appendChild(chatItem);
    });
}

function updateGroupsList() {
    UI.groupsList.innerHTML = '';
    
    AppState.groups.forEach(group => {
        const groupItem = document.createElement('div');
        groupItem.className = `group-item ${AppState.currentChat?.id === group.id ? 'active' : ''}`;
        
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
        
        UI.groupsList.appendChild(groupItem);
    });
}

function updateContactsList() {
    UI.contactsList.innerHTML = '';
    
    const filter = UI.contactsFilter?.value || 'all';
    
    AppState.contacts.forEach(user => {
        // Apply filter
        if (filter === 'online' && user.status !== 'online') return;
        if (filter === 'students' && user.role !== 'student') return;
        if (filter === 'staff' && user.role !== 'staff') return;
        
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        
        const isOnline = user.status === 'online';
        
        contactItem.innerHTML = `
            <div class="item-avatar" style="${user.photoURL ? `background-image: url(${user.photoURL})` : ''}">
                ${!user.photoURL ? '<i class="fas fa-user"></i>' : ''}
                ${isOnline ? '<div class="status-dot online"></div>' : ''}
            </div>
            <div class="item-info">
                <div class="item-name">${user.displayName}</div>
                <div class="item-status">${user.role || 'student'} • ${user.department || 'ZU'}</div>
            </div>
        `;
        
        contactItem.addEventListener('click', async () => {
            await startPrivateChat(user.uid);
        });
        
        UI.contactsList.appendChild(contactItem);
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showNotification(title, type = 'info', message = '') {
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#e74c3c' : 
                     type === 'success' ? '#2ecc71' : 
                     type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                            type === 'error' ? 'exclamation-circle' : 
                            type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"
               style="font-size: 20px;"></i>
            <div>
                <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
                ${message ? `<div style="font-size: 14px;">${message}</div>` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Export for use in other files
window.showAppNotification = showNotification;

function formatTime(date) {
    if (!(date instanceof Date)) date = new Date(date);
    
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
    
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

function handleMessageInput() {
    const hasText = UI.messageInput.value.trim().length > 0;
    UI.sendBtn.classList.toggle('active', hasText);
    
    // Send typing indicator
    if (hasText && AppState.currentChat) {
        sendTypingIndicator(true);
    }
}

async function sendTypingIndicator(isTyping) {
    if (!AppState.currentChat) return;
    
    const typingRef = db.collection('typing').doc(AppState.currentChat.id);
    
    if (isTyping) {
        await typingRef.set({
            [AppState.currentUser.uid]: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // Clear after 3 seconds
        setTimeout(async () => {
            await typingRef.update({
                [AppState.currentUser.uid]: firebase.firestore.FieldValue.delete()
            });
        }, 3000);
    } else {
        await typingRef.update({
            [AppState.currentUser.uid]: firebase.firestore.FieldValue.delete()
        });
    }
}

function showTypingIndicator(userIds) {
    const typingDiv = document.getElementById('typing-indicator');
    if (!typingDiv) return;
    
    const userNames = userIds.map(uid => {
        const user = AppState.contacts.get(uid) || AppState.onlineUsers.get(uid);
        return user?.displayName || 'Someone';
    });
    
    const typingText = document.getElementById('typing-text');
    if (typingText) {
        if (userNames.length === 1) {
            typingText.textContent = `${userNames[0]} is typing...`;
        } else if (userNames.length === 2) {
            typingText.textContent = `${userNames[0]} and ${userNames[1]} are typing...`;
        } else {
            typingText.textContent = `${userNames[0]} and others are typing...`;
        }
    }
    
    typingDiv.style.display = 'flex';
}

function hideTypingIndicator() {
    const typingDiv = document.getElementById('typing-indicator');
    if (typingDiv) {
        typingDiv.style.display = 'none';
    }
}

function setupAudioPlayer(audioElement) {
    if (!audioElement) return;
    
    const playBtn = audioElement.querySelector('.play-btn');
    const progressBar = audioElement.querySelector('.progress-bar');
    const durationElement = audioElement.querySelector('.audio-duration');
    const audioUrl = audioElement.dataset.audioUrl;
    
    let audio = new Audio(audioUrl);
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
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${progress}%`;
    });
    
    audio.addEventListener('ended', () => {
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        progressBar.style.width = '0%';
    });
}

function loadEmojis(category) {
    if (!UI.emojiGrid) return;
    
    UI.emojiGrid.innerHTML = '';
    
    const emojis = {
        smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
        people: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎'],
        objects: ['📚', '✏️', '📝', '📖', '🎓', '🏫', '📎', '📌', '✂️', '📍', '📁', '📂', '📅', '📆', '📊', '📈', '📉', '📋', '📇', '📓'],
        symbols: ['❤️', '✅', '⭐', '🌟', '✨', '🎉', '🎊', '🎁', '🏆', '🥇', '🥈', '🥉', '📢', '🔔', '📣', '🔍', '🔎', '📌', '📍', '🛡️']
    }[category] || [];
    
    emojis.forEach(emoji => {
        const button = document.createElement('button');
        button.className = 'emoji-item';
        button.textContent = emoji;
        button.addEventListener('click', () => {
            UI.messageInput.value += emoji;
            UI.messageInput.focus();
            handleMessageInput();
        });
        UI.emojiGrid.appendChild(button);
    });
}

function toggleAttachmentMenu() {
    UI.attachmentMenu.classList.toggle('active');
}

function toggleVoiceRecording() {
    if (UI.audioRecorder.classList.contains('active')) {
        stopRecording();
    } else {
        startAudioRecording();
    }
}

function toggleEmojiPicker() {
    UI.emojiPicker.classList.toggle('active');
}

function showUploadProgress(fileName, fileSize) {
    if (UI.uploadFileName) UI.uploadFileName.textContent = fileName;
    if (UI.uploadFileSize) UI.uploadFileSize.textContent = formatFileSize(fileSize);
    UI.uploadProgress.classList.add('active');
}

function updateUploadProgress(percentage) {
    if (UI.progressFill) UI.progressFill.style.width = `${percentage}%`;
    if (UI.uploadPercentage) UI.uploadPercentage.textContent = `${Math.round(percentage)}%`;
}

function hideUploadProgress() {
    setTimeout(() => {
        UI.uploadProgress.classList.remove('active');
        if (UI.progressFill) UI.progressFill.style.width = '0%';
        if (UI.uploadPercentage) UI.uploadPercentage.textContent = '0%';
    }, 500);
}

function cancelUpload() {
    if (AppState.uploadTask) {
        AppState.uploadTask.cancel();
        hideUploadProgress();
        showNotification('Upload cancelled', 'info');
    }
}

function handleSearch() {
    const query = UI.searchInput.value.toLowerCase();
    
    // Filter chats
    document.querySelectorAll('.chat-item').forEach(item => {
        const name = item.querySelector('.item-name')?.textContent.toLowerCase() || '';
        const message = item.querySelector('.item-last-message')?.textContent.toLowerCase() || '';
        item.style.display = name.includes(query) || message.includes(query) ? 'flex' : 'none';
    });
    
    // Filter contacts
    document.querySelectorAll('.contact-item').forEach(item => {
        const name = item.querySelector('.item-name')?.textContent.toLowerCase() || '';
        const status = item.querySelector('.item-status')?.textContent.toLowerCase() || '';
        item.style.display = name.includes(query) || status.includes(query) ? 'flex' : 'none';
    });
}

function handleProfileMenuAction(action) {
    switch (action) {
        case 'profile':
            showNotification('Profile', 'info', 'Profile feature coming soon');
            break;
        case 'settings':
            showNotification('Settings', 'info', 'Settings feature coming soon');
            break;
        case 'notifications':
            showNotification('Notifications', 'info', 'Notification settings updated');
            break;
        case 'logout':
            auth.signOut();
            break;
    }
    UI.profileMenu.classList.remove('active');
}

// Global functions for UI interactions
window.viewImage = function(url) {
    window.open(url, '_blank');
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .notification {
        animation: slideInRight 0.3s ease;
    }
`;
document.head.appendChild(style);

console.log("🎉 Zanzibar University Chat System Ready!");