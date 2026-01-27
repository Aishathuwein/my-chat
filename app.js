// ============================================
// UNIVERSITY CHAT APPLICATION
// ============================================

console.log("🎓 University Chat - Starting application...");

// Global variables
let currentUser = null;
let currentChat = {
    id: 'global',
    type: 'group',
    name: 'Global Chat',
    participants: []
};
let onlineUsers = new Map();
let contacts = new Map();
let groups = new Map();
let selectedUsers = new Set();
let messageListeners = new Map();
let audioRecorder = null;
let mediaRecorder = null;
let recordingTimer = null;
let recordingStartTime = null;
let selectedFile = null;
let typingTimeout = null;
let isTyping = false;

// DOM Elements
const elements = {
    // Screens
    splashScreen: document.getElementById('splash-screen'),
    authScreen: document.getElementById('auth-screen'),
    chatScreen: document.getElementById('chat-screen'),
    
    // Auth
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    signupName: document.getElementById('signup-name'),
    signupEmail: document.getElementById('signup-email'),
    signupRole: document.getElementById('signup-role'),
    signupPassword: document.getElementById('signup-password'),
    signupConfirmPassword: document.getElementById('signup-confirm-password'),
    loginBtn: document.getElementById('login-btn'),
    signupBtn: document.getElementById('signup-btn'),
    googleLoginBtn: document.getElementById('google-login-btn'),
    
    // Chat UI
    sidebar: document.getElementById('sidebar'),
    messages: document.getElementById('messages'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    attachmentToggle: document.getElementById('attachment-toggle'),
    attachmentMenu: document.getElementById('attachment-menu'),
    audioRecorderElement: document.getElementById('audio-recorder'),
    recordBtn: document.getElementById('record-btn'),
    emojiBtn: document.getElementById('emoji-btn'),
    emojiPicker: document.getElementById('emoji-picker'),
    
    // User info
    userName: document.getElementById('user-name'),
    userAvatar: document.getElementById('user-avatar'),
    userStatusText: document.getElementById('user-status-text'),
    statusDot: document.getElementById('status-dot'),
    userRole: document.getElementById('user-role'),
    
    // Chat info
    chatTitle: document.getElementById('chat-title'),
    chatInfo: document.getElementById('chat-info'),
    mobileChatTitle: document.getElementById('mobile-chat-title'),
    mobileChatInfo: document.getElementById('mobile-chat-info'),
    onlineCount: document.getElementById('online-count'),
    typingIndicator: document.getElementById('typing-indicator'),
    
    // Lists
    chatsList: document.getElementById('chats-list'),
    contactsList: document.getElementById('contacts-list'),
    groupsList: document.getElementById('groups-list'),
    mediaGrid: document.getElementById('media-grid'),
    
    // Modals
    newChatModal: document.getElementById('new-chat-modal'),
    createGroupModal: document.getElementById('create-group-modal'),
    groupInfoModal: document.getElementById('group-info-modal'),
    imagePreviewModal: document.getElementById('image-preview-modal'),
    messageActionsModal: document.getElementById('message-actions-modal'),
    
    // Buttons
    logoutBtn: document.getElementById('logout-btn'),
    menuToggle: document.getElementById('menu-toggle'),
    closeSidebar: document.getElementById('close-sidebar'),
    userMenuToggle: document.getElementById('user-menu-toggle'),
    closeMenu: document.getElementById('close-menu'),
    newChatBtn: document.getElementById('new-chat-btn'),
    newGroupBtn: document.getElementById('new-group-btn'),
    createGroupModalBtn: document.getElementById('create-group-modal-btn'),
    
    // Other
    overlay: document.getElementById('overlay'),
    userMenu: document.getElementById('user-menu'),
    uploadProgress: document.getElementById('upload-progress'),
    progressFill: document.getElementById('progress-fill'),
    uploadPercent: document.getElementById('upload-percent'),
    uploadFilename: document.getElementById('upload-filename'),
    uploadSpeed: document.getElementById('upload-speed'),
    cancelUpload: document.getElementById('cancel-upload'),
    notificationsContainer: document.getElementById('notifications-container')
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, initializing app...");
    
    // Hide splash screen after 2 seconds
    setTimeout(() => {
        elements.splashScreen.style.display = 'none';
        checkAuthState();
    }, 2000);
    
    // Setup event listeners
    setupEventListeners();
    
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').checked = true;
    }
    
    console.log("✅ App initialization complete");
});

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    console.log("🔗 Setting up event listeners...");
    
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchAuthTab(tabName);
        });
    });
    
    // Show password buttons
    document.querySelectorAll('.show-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
    
    // Auth buttons
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.signupBtn.addEventListener('click', handleSignup);
    elements.googleLoginBtn.addEventListener('click', handleGoogleLogin);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Enter key for auth
    [elements.loginEmail, elements.loginPassword].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    });
    
    [elements.signupName, elements.signupEmail, elements.signupPassword, elements.signupConfirmPassword].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSignup();
        });
    });
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            switchSidebarSection(section);
        });
    });
    
    // Mobile menu
    elements.menuToggle.addEventListener('click', toggleSidebar);
    elements.closeSidebar.addEventListener('click', toggleSidebar);
    elements.userMenuToggle.addEventListener('click', toggleUserMenu);
    elements.closeMenu.addEventListener('click', toggleUserMenu);
    elements.overlay.addEventListener('click', closeAllMenus);
    
    // Message input
    elements.messageInput.addEventListener('input', handleMessageInput);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.attachmentToggle.addEventListener('click', toggleAttachmentMenu);
    elements.recordBtn.addEventListener('click', toggleAudioRecording);
    
    // Attachment buttons
    document.querySelectorAll('.attachment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            handleAttachment(type);
        });
    });
    
    // Audio recorder
    document.getElementById('cancel-recording').addEventListener('click', cancelRecording);
    document.getElementById('send-recording').addEventListener('click', stopAndSendRecording);
    
    // Emoji picker
    elements.emojiBtn.addEventListener('click', toggleEmojiPicker);
    document.getElementById('close-emoji').addEventListener('click', closeEmojiPicker);
    setupEmojiPicker();
    
    // Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
            elements.overlay.classList.remove('active');
        });
    });
    
    elements.overlay.addEventListener('click', function() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        elements.overlay.classList.remove('active');
    });
    
    // New chat
    elements.newChatBtn.addEventListener('click', openNewChatModal);
    
    // Create group
    elements.newGroupBtn.addEventListener('click', openCreateGroupModal);
    elements.createGroupModalBtn.addEventListener('click', createGroup);
    
    // Search
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    
    searchInput.addEventListener('input', function() {
        const hasText = this.value.trim().length > 0;
        searchClear.classList.toggle('active', hasText);
        searchContacts(this.value);
    });
    
    searchClear.addEventListener('click', function() {
        searchInput.value = '';
        this.classList.remove('active');
        searchContacts('');
    });
    
    // User menu actions
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const action = this.dataset.action;
            handleUserMenuAction(action);
        });
    });
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('change', function() {
        document.body.classList.toggle('dark-mode', this.checked);
        localStorage.setItem('theme', this.checked ? 'dark' : 'light');
        showNotification('Theme Changed', 'success', 
            `Switched to ${this.checked ? 'dark' : 'light'} mode`);
    });
    
    // Scroll to bottom button
    document.getElementById('scroll-bottom-btn').addEventListener('click', scrollToBottom);
    
    console.log("✅ Event listeners setup complete");
}

// ============================================
// AUTHENTICATION
// ============================================

function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        console.log("🔐 Auth state changed:", user ? user.email : "No user");
        
        if (user) {
            currentUser = user;
            await initializeUser(user);
            showScreen('chat-screen');
            startUserPresence();
            loadInitialData();
        } else {
            currentUser = null;
            showScreen('auth-screen');
        }
    });
}

function switchAuthTab(tabName) {
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.toggle('active', form.id === `${tabName}-form`);
    });
}

async function handleLogin() {
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;
    
    if (!validateEmail(email)) {
        showNotification('Invalid Email', 'error', 'Please enter a valid university email');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Invalid Password', 'error', 'Password must be at least 6 characters');
        return;
    }
    
    try {
        showNotification('Logging in...', 'info');
        await auth.signInWithEmailAndPassword(email, password);
        console.log("✅ Logged in:", email);
        
    } catch (error) {
        console.error("❌ Login error:", error);
        showNotification('Login Failed', 'error', error.message);
    }
}

async function handleSignup() {
    const name = elements.signupName.value.trim();
    const email = elements.signupEmail.value.trim();
    const role = elements.signupRole.value;
    const password = elements.signupPassword.value;
    const confirmPassword = elements.signupConfirmPassword.value;
    
    if (!name) {
        showNotification('Name Required', 'error', 'Please enter your full name');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Invalid Email', 'error', 'Please enter a valid university email');
        return;
    }
    
    if (!role) {
        showNotification('Role Required', 'error', 'Please select your role');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Weak Password', 'error', 'Password must be at least 6 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Password Mismatch', 'error', 'Passwords do not match');
        return;
    }
    
    try {
        showNotification('Creating Account...', 'info');
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update profile
        await userCredential.user.updateProfile({
            displayName: name,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a237e&color=fff`
        });
        
        // Create user document
        await db.collection('users').doc(userCredential.user.uid).set({
            uid: userCredential.user.uid,
            email: email,
            displayName: name,
            role: role,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a237e&color=fff`,
            status: 'online',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            university: 'Zanzibar University'
        });
        
        console.log("✅ Account created:", userCredential.user.uid);
        showNotification('Account Created', 'success', 'Welcome to University Chat!');
        
    } catch (error) {
        console.error("❌ Signup error:", error);
        showNotification('Signup Failed', 'error', error.message);
    }
}

async function handleGoogleLogin() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        showNotification('Signing in with Google...', 'info');
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Create/update user document
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'student',
            status: 'online',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            university: 'Zanzibar University'
        }, { merge: true });
        
        console.log("✅ Google login successful:", user.email);
        showNotification('Welcome!', 'success', 'Signed in with Google');
        
    } catch (error) {
        console.error("❌ Google login error:", error);
        showNotification('Google Login Failed', 'error', error.message);
    }
}

async function handleLogout() {
    try {
        if (currentUser) {
            // Update status
            await db.collection('users').doc(currentUser.uid).update({
                status: 'offline',
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Clear listeners
        messageListeners.forEach(unsubscribe => unsubscribe());
        messageListeners.clear();
        
        // Clear data
        currentUser = null;
        currentChat = { id: 'global', type: 'group', name: 'Global Chat', participants: [] };
        onlineUsers.clear();
        contacts.clear();
        groups.clear();
        selectedUsers.clear();
        
        // Sign out
        await auth.signOut();
        
        showNotification('Logged Out', 'success', 'You have been logged out');
        
    } catch (error) {
        console.error("❌ Logout error:", error);
        showNotification('Logout Failed', 'error', error.message);
    }
}

// ============================================
// USER MANAGEMENT
// ============================================

async function initializeUser(user) {
    console.log("👤 Initializing user:", user.uid);
    
    // Update UI
    elements.userName.textContent = user.displayName || user.email.split('@')[0];
    
    // Set avatar
    const avatar = elements.userAvatar;
    if (user.photoURL) {
        avatar.style.backgroundImage = `url(${user.photoURL})`;
        avatar.style.backgroundSize = 'cover';
        avatar.innerHTML = '';
    } else {
        const initial = (user.displayName || user.email).charAt(0).toUpperCase();
        avatar.innerHTML = initial;
    }
    
    // Get user role from Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
        const userData = userDoc.data();
        elements.userRole.textContent = userData.role || 'Student';
    }
    
    // Update user document
    await db.collection('users').doc(user.uid).update({
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'online'
    });
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
            console.error("Error updating offline status:", error);
        }
    };
    
    window.addEventListener('beforeunload', handleDisconnect);
    
    // Handle visibility change
    document.addEventListener('visibilitychange', async () => {
        if (document.hidden) {
            await userRef.update({
                status: 'away',
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await userRef.update({
                status: 'online',
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    });
}

// ============================================
// CHAT MANAGEMENT
// ============================================

function loadInitialData() {
    loadOnlineUsers();
    loadContacts();
    loadGroups();
    loadChats();
    switchToChat(currentChat);
}

function loadOnlineUsers() {
    db.collection('users')
        .where('status', 'in', ['online', 'away'])
        .onSnapshot(snapshot => {
            onlineUsers.clear();
            snapshot.forEach(doc => {
                const user = doc.data();
                if (user.uid !== currentUser.uid) {
                    onlineUsers.set(user.uid, user);
                }
            });
            updateOnlineCount();
        }, error => {
            console.error("Error loading online users:", error);
        });
}

function loadContacts() {
    db.collection('users')
        .where('uid', '!=', currentUser.uid)
        .onSnapshot(snapshot => {
            contacts.clear();
            snapshot.forEach(doc => {
                const user = doc.data();
                contacts.set(user.uid, user);
            });
            updateContactsList();
        }, error => {
            console.error("Error loading contacts:", error);
        });
}

function loadGroups() {
    db.collection('groups')
        .where('members', 'array-contains', currentUser.uid)
        .onSnapshot(snapshot => {
            groups.clear();
            snapshot.forEach(doc => {
                const group = { id: doc.id, ...doc.data() };
                groups.set(group.id, group);
            });
            updateGroupsList();
        }, error => {
            console.error("Error loading groups:", error);
        });
}

function loadChats() {
    // Load chats where user is a participant
    db.collection('chats')
        .where('participants', 'array-contains', currentUser.uid)
        .orderBy('lastActivity', 'desc')
        .onSnapshot(snapshot => {
            updateChatsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, error => {
            console.error("Error loading chats:", error);
        });
}

function switchToChat(chat) {
    // Stop previous listener
    if (messageListeners.has(currentChat.id)) {
        messageListeners.get(currentChat.id)();
    }
    
    // Update current chat
    currentChat = chat;
    
    // Update UI
    elements.chatTitle.textContent = chat.name;
    elements.mobileChatTitle.textContent = chat.name;
    
    // Update partner avatar
    const partnerAvatar = document.getElementById('partner-avatar');
    if (chat.type === 'group') {
        partnerAvatar.innerHTML = '<i class="fas fa-users"></i>';
        partnerAvatar.style.background = 'linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%)';
    } else {
        partnerAvatar.innerHTML = '<i class="fas fa-user"></i>';
        partnerAvatar.style.background = 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)';
    }
    
    // Clear messages
    elements.messages.innerHTML = '';
    
    // Load messages
    loadChatMessages(chat);
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        elements.sidebar.classList.remove('active');
    }
}

function loadChatMessages(chat) {
    let query;
    
    if (chat.type === 'private') {
        const chatId = generateChatId(currentUser.uid, chat.id);
        query = db.collection('messages')
            .where('chatId', '==', chatId)
            .orderBy('timestamp', 'asc');
    } else {
        query = db.collection('messages')
            .where('chatId', '==', chat.id)
            .orderBy('timestamp', 'asc');
    }
    
    const unsubscribe = query.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const message = change.doc.data();
                displayMessage(message);
            }
        });
        
        // Scroll to bottom
        setTimeout(scrollToBottom, 100);
        
    }, error => {
        console.error("Error loading messages:", error);
        showNotification('Connection Error', 'error', 'Failed to load messages');
    });
    
    messageListeners.set(chat.id, unsubscribe);
}

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
    
    const isCurrentUser = message.senderId === currentUser.uid;
    const timestamp = formatTime(message.timestamp);
    
    let content = '';
    
    switch (message.type) {
        case 'text':
            content = createTextMessage(message, isCurrentUser, timestamp);
            break;
            
        case 'image':
            content = createImageMessage(message, isCurrentUser, timestamp);
            break;
            
        case 'audio':
            content = createAudioMessage(message, isCurrentUser, timestamp);
            break;
            
        case 'file':
            content = createFileMessage(message, isCurrentUser, timestamp);
            break;
            
        case 'system':
            content = createSystemMessage(message);
            break;
            
        default:
            content = createTextMessage(message, isCurrentUser, timestamp);
    }
    
    messageDiv.innerHTML = content;
    elements.messages.appendChild(messageDiv);
    
    // Add event listeners for media
    if (message.type === 'audio') {
        setupAudioPlayer(messageDiv.querySelector('.audio-player'));
    }
}

function createTextMessage(message, isCurrentUser, timestamp) {
    return `
        <div class="message-content-wrapper">
            ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
            <div class="message-content">
                <div class="message-text">${message.text}</div>
                <div class="message-meta">
                    <span class="message-time">${timestamp}</span>
                    ${isCurrentUser ? '<span class="message-status">✓✓</span>' : ''}
                </div>
            </div>
        </div>
    `;
}

function createImageMessage(message, isCurrentUser, timestamp) {
    return `
        <div class="message-content-wrapper">
            ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
            <div class="message-content">
                <div class="message-media">
                    <img src="${message.fileUrl}" alt="Shared image" loading="lazy">
                </div>
                ${message.caption ? `<div class="message-text">${message.caption}</div>` : ''}
                <div class="message-meta">
                    <span class="message-time">${timestamp}</span>
                    ${isCurrentUser ? '<span class="message-status">✓✓</span>' : ''}
                </div>
            </div>
        </div>
    `;
}

function createAudioMessage(message, isCurrentUser, timestamp) {
    return `
        <div class="message-content-wrapper">
            ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
            <div class="message-content">
                <div class="message-audio">
                    <div class="audio-player" data-audio-url="${message.fileUrl}">
                        <button class="play-pause-btn">
                            <i class="fas fa-play"></i>
                        </button>
                        <div class="audio-progress">
                            <div class="progress-fill"></div>
                        </div>
                        <div class="audio-time">0:00 / ${formatDuration(message.duration || 0)}</div>
                    </div>
                </div>
                <div class="message-meta">
                    <span class="message-time">${timestamp}</span>
                    ${isCurrentUser ? '<span class="message-status">✓✓</span>' : ''}
                </div>
            </div>
        </div>
    `;
}

function createFileMessage(message, isCurrentUser, timestamp) {
    const fileSize = formatFileSize(message.fileSize || 0);
    return `
        <div class="message-content-wrapper">
            ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
            <div class="message-content">
                <a href="${message.fileUrl}" target="_blank" class="message-file" download="${message.fileName}">
                    <div class="file-icon">
                        <i class="fas fa-file"></i>
                    </div>
                    <div class="file-info">
                        <div class="file-name">${message.fileName}</div>
                        <div class="file-size">${fileSize}</div>
                    </div>
                    <button class="download-btn">
                        <i class="fas fa-download"></i>
                    </button>
                </a>
                <div class="message-meta">
                    <span class="message-time">${timestamp}</span>
                    ${isCurrentUser ? '<span class="message-status">✓✓</span>' : ''}
                </div>
            </div>
        </div>
    `;
}

function createSystemMessage(message) {
    return `
        <div class="message system">
            <div class="message-content">
                <div class="message-text">${message.text}</div>
                <div class="message-time">${formatTime(message.timestamp)}</div>
            </div>
        </div>
    `;
}

// ============================================
// MESSAGING
// ============================================

async function sendMessage() {
    const text = elements.messageInput.value.trim();
    
    if (!text && !selectedFile) {
        showNotification('Empty Message', 'error', 'Please enter a message or attach a file');
        return;
    }
    
    try {
        let messageData = {
            senderId: currentUser.uid,
            senderName: currentUser.displayName || currentUser.email.split('@')[0],
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            chatId: currentChat.id,
            type: 'text',
            text: text
        };
        
        // Handle file upload
        if (selectedFile) {
            const fileUrl = await uploadFile(selectedFile.file, selectedFile.type);
            messageData = {
                ...messageData,
                type: selectedFile.type,
                fileUrl: fileUrl,
                fileName: selectedFile.file.name,
                fileSize: selectedFile.file.size,
                caption: text || '',
                duration: selectedFile.duration || 0
            };
            selectedFile = null;
            hideAttachmentMenu();
        }
        
        // Save message
        const messageRef = await db.collection('messages').add(messageData);
        
        // Update chat last activity
        await updateChatActivity(messageData);
        
        // Clear input
        elements.messageInput.value = '';
        elements.messageInput.style.height = 'auto';
        elements.sendBtn.classList.remove('active');
        elements.recordBtn.classList.add('active');
        
        console.log("✅ Message sent:", messageRef.id);
        
    } catch (error) {
        console.error("❌ Error sending message:", error);
        showNotification('Send Failed', 'error', error.message);
    }
}

async function uploadFile(file, type) {
    return new Promise((resolve, reject) => {
        const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const fileExt = file.name.split('.').pop();
        const fileName = `${type}_${fileId}.${fileExt}`;
        const filePath = `chats/${currentChat.id}/${currentUser.uid}/${type}s/${fileName}`;
        
        const uploadTask = storage.ref(filePath).put(file);
        let uploadStartTime = Date.now();
        
        // Show progress
        showUploadProgress(file.name, file.size);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                const elapsed = (Date.now() - uploadStartTime) / 1000;
                const speed = snapshot.bytesTransferred / elapsed;
                
                updateUploadProgress(progress, formatFileSize(speed) + '/s');
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
        
        // Cancel upload
        elements.cancelUpload.addEventListener('click', () => {
            uploadTask.cancel();
            hideUploadProgress();
            reject(new Error('Upload cancelled'));
        }, { once: true });
    });
}

async function sendAudioMessage(audioBlob, duration) {
    try {
        const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
            type: 'audio/webm'
        });
        
        const fileUrl = await uploadFile(audioFile, 'audio');
        
        const messageData = {
            senderId: currentUser.uid,
            senderName: currentUser.displayName || currentUser.email.split('@')[0],
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            chatId: currentChat.id,
            type: 'audio',
            fileUrl: fileUrl,
            fileName: audioFile.name,
            fileSize: audioFile.size,
            duration: duration,
            caption: ''
        };
        
        await db.collection('messages').add(messageData);
        await updateChatActivity(messageData);
        
    } catch (error) {
        console.error("Error sending audio:", error);
        showNotification('Audio Send Failed', 'error', error.message);
    }
}

async function updateChatActivity(message) {
    const chatRef = db.collection('chats').doc(currentChat.id);
    
    const updateData = {
        lastMessage: {
            text: message.type === 'text' ? message.text : `Sent a ${message.type}`,
            senderId: message.senderId,
            senderName: message.senderName,
            type: message.type
        },
        lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await chatRef.set(updateData, { merge: true });
    } catch (error) {
        console.error("Error updating chat activity:", error);
    }
}

// ============================================
// ATTACHMENTS & MEDIA
// ============================================

function handleAttachment(type) {
    hideAttachmentMenu();
    
    switch (type) {
        case 'image':
            openFilePicker('image/*', 'image');
            break;
        case 'video':
            openFilePicker('video/*', 'video');
            break;
        case 'audio':
            startAudioRecording();
            break;
        case 'document':
            openFilePicker('*', 'file');
            break;
        case 'camera':
            openCamera();
            break;
        case 'location':
            shareLocation();
            break;
    }
}

function openFilePicker(accept, type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = false;
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (type === 'image') {
            // Preview image
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('preview-image').src = e.target.result;
                elements.imagePreviewModal.classList.add('active');
                elements.overlay.classList.add('active');
                selectedFile = { file, type: 'image' };
            };
            reader.readAsDataURL(file);
        } else {
            selectedFile = { file, type };
            sendMessage();
        }
    };
    
    input.click();
}

function startAudioRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('Audio Unavailable', 'error', 'Microphone access not supported');
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
                const duration = (Date.now() - recordingStartTime) / 1000;
                await sendAudioMessage(audioBlob, duration);
                
                stream.getTracks().forEach(track => track.stop());
            };
            
            // Start recording
            audioRecorder.start();
            recordingStartTime = Date.now();
            startRecordingTimer();
            
            // Show UI
            elements.audioRecorderElement.classList.add('active');
            elements.recordBtn.classList.remove('active');
            elements.sendBtn.classList.remove('active');
            
        })
        .catch(error => {
            console.error("Microphone error:", error);
            showNotification('Microphone Error', 'error', 'Please allow microphone access');
        });
}

function cancelRecording() {
    if (audioRecorder && audioRecorder.state !== 'inactive') {
        audioRecorder.stop();
        stopRecordingTimer();
        elements.audioRecorderElement.classList.remove('active');
        elements.recordBtn.classList.add('active');
        showNotification('Recording Cancelled', 'info');
    }
}

function stopAndSendRecording() {
    if (audioRecorder && audioRecorder.state !== 'inactive') {
        audioRecorder.stop();
        stopRecordingTimer();
        elements.audioRecorderElement.classList.remove('active');
        elements.recordBtn.classList.add('active');
    }
}

function startRecordingTimer() {
    recordingStartTime = Date.now();
    recordingTimer = setInterval(() => {
        const elapsed = Date.now() - recordingStartTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const displaySeconds = seconds % 60;
        document.getElementById('recording-time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopRecordingTimer() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
}

// ============================================
// UI HELPERS
// ============================================

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById(screenName).style.display = 'flex';
}

function toggleSidebar() {
    elements.sidebar.classList.toggle('active');
    elements.overlay.classList.toggle('active');
}

function toggleUserMenu() {
    elements.userMenu.classList.toggle('active');
    elements.overlay.classList.toggle('active');
}

function closeAllMenus() {
    elements.sidebar.classList.remove('active');
    elements.userMenu.classList.remove('active');
    elements.overlay.classList.remove('active');
    hideAttachmentMenu();
    closeEmojiPicker();
}

function switchSidebarSection(section) {
    // Update buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === section);
    });
    
    // Show section
    document.querySelectorAll('.sidebar-section').forEach(sec => {
        sec.classList.toggle('active', sec.id === `${section}-section`);
    });
}

function toggleAttachmentMenu() {
    elements.attachmentMenu.classList.toggle('active');
    closeEmojiPicker();
}

function hideAttachmentMenu() {
    elements.attachmentMenu.classList.remove('active');
}

function toggleAudioRecording() {
    if (elements.audioRecorderElement.classList.contains('active')) {
        cancelRecording();
    } else {
        startAudioRecording();
    }
}

function handleMessageInput() {
    const hasText = elements.messageInput.value.trim().length > 0;
    elements.sendBtn.classList.toggle('active', hasText);
    elements.recordBtn.classList.toggle('active', !hasText);
    
    // Auto-resize textarea
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    
    // Typing indicator
    if (hasText && !isTyping) {
        isTyping = true;
        updateTypingStatus(true);
    }
    
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        if (isTyping) {
            isTyping = false;
            updateTypingStatus(false);
        }
    }, 1000);
}

function updateTypingStatus(typing) {
    if (currentChat.type === 'private' && currentChat.id !== 'global') {
        // Update typing status in Firestore
        const chatId = generateChatId(currentUser.uid, currentChat.id);
        db.collection('chats').doc(chatId).update({
            [`typing.${currentUser.uid}`]: typing ? firebase.firestore.FieldValue.serverTimestamp() : null
        });
    }
}

function toggleEmojiPicker() {
    elements.emojiPicker.classList.toggle('active');
    hideAttachmentMenu();
}

function closeEmojiPicker() {
    elements.emojiPicker.classList.remove('active');
}

function setupEmojiPicker() {
    const emojis = {
        smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
        people: ['👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍⚕️', '👩‍⚕️', '👨‍🔧', '👩‍🔧', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🎤', '👩‍🎤'],
        nature: ['🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🐚', '🦋', '🐦', '🐠', '🐬', '🐳', '🦁', '🐯', '🐻', '🐼', '🦊'],
        food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦'],
        activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳'],
        objects: ['📚', '📖', '📕', '📗', '📘', '📙', '📓', '📒', '📝', '✏️', '🖊️', '🖋️', '📏', '📐', '✂️', '📎', '📌', '📍', '📁', '📂'],
        symbols: ['💙', '💚', '💛', '🧡', '❤️', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️'],
        flags: ['🇹🇿', '🇰🇪', '🇺🇬', '🇷🇼', '🇧🇮', '🇨🇩', '🇸🇸', '🇪🇹', '🇪🇷', '🇩🇯', '🇸🇴', '🇸🇩', '🇪🇬', '🇱🇾', '🇹🇳', '🇩🇿', '🇲🇦', '🇲🇷', '🇸🇳', '🇬🇲']
    };
    
    // Setup categories
    document.querySelectorAll('.emoji-cat').forEach(cat => {
        cat.addEventListener('click', function() {
            const category = this.dataset.cat;
            
            // Update active
            document.querySelectorAll('.emoji-cat').forEach(c => {
                c.classList.toggle('active', c === this);
            });
            
            // Load emojis
            loadEmojis(category);
        });
    });
    
    // Load default
    loadEmojis('smileys');
}

function loadEmojis(category) {
    const emojiGrid = document.getElementById('emoji-grid');
    const emojiList = {
        smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
        people: ['👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍⚕️', '👩‍⚕️', '👨‍🔧', '👩‍🔧', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🎤', '👩‍🎤'],
        nature: ['🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🐚', '🦋', '🐦', '🐠', '🐬', '🐳', '🦁', '🐯', '🐻', '🐼', '🦊'],
        food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦'],
        activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳'],
        objects: ['📚', '📖', '📕', '📗', '📘', '📙', '📓', '📒', '📝', '✏️', '🖊️', '🖋️', '📏', '📐', '✂️', '📎', '📌', '📍', '📁', '📂'],
        symbols: ['💙', '💚', '💛', '🧡', '❤️', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️'],
        flags: ['🇹🇿', '🇰🇪', '🇺🇬', '🇷🇼', '🇧🇮', '🇨🇩', '🇸🇸', '🇪🇹', '🇪🇷', '🇩🇯', '🇸🇴', '🇸🇩', '🇪🇬', '🇱🇾', '🇹🇳', '🇩🇿', '🇲🇦', '🇲🇷', '🇸🇳', '🇬🇲']
    }[category] || [];
    
    emojiGrid.innerHTML = '';
    emojiList.forEach(emoji => {
        const button = document.createElement('button');
        button.className = 'emoji-item';
        button.textContent = emoji;
        button.addEventListener('click', () => {
            elements.messageInput.value += emoji;
            elements.messageInput.focus();
            handleMessageInput();
            closeEmojiPicker();
        });
        emojiGrid.appendChild(button);
    });
}

function showUploadProgress(filename, filesize) {
    elements.uploadFilename.textContent = filename;
    elements.uploadSpeed.textContent = 'Calculating...';
    elements.uploadProgress.classList.add('active');
}

function updateUploadProgress(percentage, speed = '') {
    elements.progressFill.style.width = `${percentage}%`;
    elements.uploadPercent.textContent = `${Math.round(percentage)}%`;
    if (speed) elements.uploadSpeed.textContent = speed;
}

function hideUploadProgress() {
    setTimeout(() => {
        elements.uploadProgress.classList.remove('active');
        elements.progressFill.style.width = '0%';
        elements.uploadPercent.textContent = '0%';
    }, 500);
}

function scrollToBottom() {
    const container = elements.messages.parentElement;
    container.scrollTop = container.scrollHeight;
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function openNewChatModal() {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';
    
    contacts.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="item-avatar" style="${user.photoURL ? `background-image: url(${user.photoURL})` : ''}">
                ${!user.photoURL ? '<i class="fas fa-user"></i>' : ''}
            </div>
            <div class="item-info">
                <div class="item-name">${user.displayName}</div>
                <div class="item-desc">${user.role || 'Student'} • ${user.status || 'offline'}</div>
            </div>
        `;
        
        userItem.addEventListener('click', () => {
            // Create private chat
            const chatId = generateChatId(currentUser.uid, user.uid);
            const chat = {
                id: user.uid,
                type: 'private',
                name: user.displayName,
                participants: [currentUser.uid, user.uid]
            };
            
            // Create chat document if it doesn't exist
            db.collection('chats').doc(chatId).set({
                id: chatId,
                type: 'private',
                participants: [currentUser.uid, user.uid],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastActivity: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            switchToChat(chat);
            elements.newChatModal.classList.remove('active');
            elements.overlay.classList.remove('active');
        });
        
        usersList.appendChild(userItem);
    });
    
    elements.newChatModal.classList.add('active');
    elements.overlay.classList.add('active');
}

function openCreateGroupModal() {
    const membersList = document.getElementById('available-members-list');
    membersList.innerHTML = '';
    
    selectedUsers.clear();
    document.getElementById('selected-members-list').innerHTML = `
        <div class="selected-member" id="current-user-member">
            <span>You (Admin)</span>
            <i class="fas fa-crown" title="Admin"></i>
        </div>
    `;
    
    contacts.forEach(user => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        memberItem.innerHTML = `
            <div class="member-checkbox" data-user-id="${user.uid}"></div>
            <div class="item-avatar" style="${user.photoURL ? `background-image: url(${user.photoURL})` : ''}">
                ${!user.photoURL ? '<i class="fas fa-user"></i>' : ''}
            </div>
            <div class="item-info">
                <div class="item-name">${user.displayName}</div>
                <div class="item-desc">${user.role || 'Student'}</div>
            </div>
        `;
        
        const checkbox = memberItem.querySelector('.member-checkbox');
        checkbox.addEventListener('click', () => {
            if (selectedUsers.has(user.uid)) {
                selectedUsers.delete(user.uid);
                checkbox.classList.remove('checked');
                checkbox.innerHTML = '';
            } else {
                selectedUsers.add(user.uid);
                checkbox.classList.add('checked');
                checkbox.innerHTML = '<i class="fas fa-check"></i>';
                
                // Add to selected list
                const selectedMember = document.createElement('div');
                selectedMember.className = 'selected-member';
                selectedMember.innerHTML = `
                    <span>${user.displayName}</span>
                    <button type="button" onclick="removeSelectedMember('${user.uid}')">&times;</button>
                `;
                document.getElementById('selected-members-list').appendChild(selectedMember);
            }
        });
        
        membersList.appendChild(memberItem);
    });
    
    elements.createGroupModal.classList.add('active');
    elements.overlay.classList.add('active');
}

function removeSelectedMember(userId) {
    selectedUsers.delete(userId);
    const checkbox = document.querySelector(`.member-checkbox[data-user-id="${userId}"]`);
    if (checkbox) {
        checkbox.classList.remove('checked');
        checkbox.innerHTML = '';
    }
    const selectedEl = document.querySelector(`.selected-member button[onclick*="${userId}"]`)?.parentElement;
    if (selectedEl) selectedEl.remove();
}

async function createGroup() {
    const name = document.getElementById('group-name-modal').value.trim();
    const description = document.getElementById('group-description-modal').value.trim();
    const privacy = document.getElementById('group-privacy').value;
    
    if (!name) {
        showNotification('Group Name Required', 'error', 'Please enter a group name');
        return;
    }
    
    if (selectedUsers.size === 0) {
        showNotification('Members Required', 'error', 'Please select at least one member');
        return;
    }
    
    try {
        // Create members array
        const members = Array.from(selectedUsers);
        members.push(currentUser.uid);
        
        // Create group
        const groupData = {
            name: name,
            description: description,
            privacy: privacy,
            createdBy: currentUser.uid,
            creatorName: currentUser.displayName,
            members: members,
            admins: [currentUser.uid],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            settings: {
                allowMedia: true,
                allowAudio: true,
                allowFiles: true,
                maxFileSize: 10485760
            }
        };
        
        const groupRef = await db.collection('groups').add(groupData);
        
        // Create chat for group
        await db.collection('chats').doc(groupRef.id).set({
            id: groupRef.id,
            type: 'group',
            name: name,
            description: description,
            participants: members,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastActivity: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Add system message
        await db.collection('messages').add({
            chatId: groupRef.id,
            type: 'system',
            text: `${currentUser.displayName} created the group "${name}"`,
            senderId: 'system',
            senderName: 'System',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Group Created', 'success', `"${name}" has been created`);
        
        // Close modal and switch to group
        elements.createGroupModal.classList.remove('active');
        elements.overlay.classList.remove('active');
        
        const group = {
            id: groupRef.id,
            type: 'group',
            name: name,
            participants: members
        };
        
        switchToChat(group);
        
    } catch (error) {
        console.error("Error creating group:", error);
        showNotification('Group Creation Failed', 'error', error.message);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function setupAudioPlayer(playerElement) {
    const playBtn = playerElement.querySelector('.play-pause-btn');
    const progress = playerElement.querySelector('.progress-fill');
    const timeDisplay = playerElement.querySelector('.audio-time');
    const audioUrl = playerElement.dataset.audioUrl;
    
    const audio = new Audio(audioUrl);
    let isPlaying = false;
    
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
        const percent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = `${percent}%`;
        
        const current = formatDuration(audio.currentTime);
        const total = formatDuration(audio.duration);
        timeDisplay.textContent = `${current} / ${total}`;
    });
    
    audio.addEventListener('ended', () => {
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        progress.style.width = '0%';
        timeDisplay.textContent = `0:00 / ${formatDuration(audio.duration)}`;
    });
}

function updateOnlineCount() {
    const count = onlineUsers.size;
    elements.onlineCount.textContent = `${count} online`;
    elements.mobileChatInfo.textContent = `${count} online`;
}

function updateContactsList() {
    if (!elements.contactsList) return;
    
    elements.contactsList.innerHTML = '';
    contacts.forEach(user => {
        const contact = createContactItem(user);
        elements.contactsList.appendChild(contact);
    });
}

function updateGroupsList() {
    if (!elements.groupsList) return;
    
    const list = elements.groupsList;
    const globalItem = list.querySelector('[data-group-id="global"]');
    list.innerHTML = '';
    if (globalItem) list.appendChild(globalItem);
    
    groups.forEach(group => {
        const groupItem = createGroupItem(group);
        list.appendChild(groupItem);
    });
}

function updateChatsList(chats) {
    if (!elements.chatsList) return;
    
    elements.chatsList.innerHTML = '';
    chats.forEach(chat => {
        const chatItem = createChatItem(chat);
        elements.chatsList.appendChild(chatItem);
    });
}

function createContactItem(user) {
    const div = document.createElement('div');
    div.className = 'contact-item';
    div.innerHTML = `
        <div class="item-avatar" style="${user.photoURL ? `background-image: url(${user.photoURL})` : ''}">
            ${!user.photoURL ? '<i class="fas fa-user"></i>' : ''}
        </div>
        <div class="item-info">
            <div class="item-name">${user.displayName}</div>
            <div class="item-desc">${user.role || 'Student'} • ${user.status || 'offline'}</div>
        </div>
    `;
    
    div.addEventListener('click', () => {
        const chatId = generateChatId(currentUser.uid, user.uid);
        const chat = {
            id: user.uid,
            type: 'private',
            name: user.displayName,
            participants: [currentUser.uid, user.uid]
        };
        switchToChat(chat);
    });
    
    return div;
}

function createGroupItem(group) {
    const div = document.createElement('div');
    div.className = 'group-item';
    div.innerHTML = `
        <div class="item-avatar">
            <i class="fas fa-users"></i>
        </div>
        <div class="item-info">
            <div class="item-name">${group.name}</div>
            <div class="item-desc">${group.members?.length || 0} members</div>
        </div>
    `;
    
    div.addEventListener('click', () => {
        const chat = {
            id: group.id,
            type: 'group',
            name: group.name,
            participants: group.members || []
        };
        switchToChat(chat);
    });
    
    return div;
}

function createChatItem(chat) {
    const div = document.createElement('div');
    div.className = 'chat-item';
    div.innerHTML = `
        <div class="item-avatar">
            <i class="fas fa-${chat.type === 'private' ? 'user' : 'users'}"></i>
        </div>
        <div class="item-info">
            <div class="item-name">${chat.name || 'Chat'}</div>
            <div class="item-last-message">${chat.lastMessage?.text || 'No messages yet'}</div>
        </div>
        <div class="item-time">${chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : ''}</div>
    `;
    
    div.addEventListener('click', () => {
        switchToChat(chat);
    });
    
    return div;
}

function searchContacts(query) {
    if (!query) {
        updateContactsList();
        return;
    }
    
    const filtered = Array.from(contacts.values()).filter(user =>
        user.displayName.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        (user.role && user.role.toLowerCase().includes(query.toLowerCase()))
    );
    
    if (elements.contactsList) {
        elements.contactsList.innerHTML = '';
        filtered.forEach(user => {
            const contact = createContactItem(user);
            elements.contactsList.appendChild(contact);
        });
    }
}

function handleUserMenuAction(action) {
    switch (action) {
        case 'profile':
            showNotification('Profile', 'info', 'Profile editing coming soon');
            break;
        case 'status':
            showNotification('Status', 'info', 'Status changing coming soon');
            break;
        case 'notifications':
            showNotification('Notifications', 'info', 'Notification settings coming soon');
            break;
        case 'privacy':
            showNotification('Privacy', 'info', 'Privacy settings coming soon');
            break;
        case 'help':
            showNotification('Help', 'info', 'Help center coming soon');
            break;
        case 'about':
            showNotification('About', 'info', 'University Chat v2.0 - Zanzibar University');
            break;
    }
    toggleUserMenu();
}

// Initialize app
console.log("🎉 University Chat Application ready!");