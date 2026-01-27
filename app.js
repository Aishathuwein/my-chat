// ============================================
// ZANZIBAR UNIVERSITY CHAT APPLICATION
// COMPLETE WORKING SYSTEM WITH ALL FEATURES
// ============================================

console.log("🎓 ZU Chat Application Starting...");

// Global Variables
let currentUser = null;
let currentChat = {
    id: 'global',
    type: 'group',
    name: 'ZU Global Chat',
    avatar: 'fas fa-globe',
    members: [],
    admins: [],
    createdBy: null
};
let onlineUsers = new Map();
let allContacts = new Map();
let userGroups = new Map();
let messageListeners = new Map();
let typingTimeouts = new Map();
let selectedFiles = new Map();
let audioRecorder = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let recordingInterval = null;
let selectedUsers = new Set();
let notifications = [];
let unreadMessages = new Map();
let chatListeners = new Map();

// DOM Elements Cache
const elements = {
    // Screens
    splashScreen: document.getElementById('splash-screen'),
    authScreen: document.getElementById('auth-screen'),
    chatScreen: document.getElementById('chat-screen'),
    
    // Auth Elements
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    signupName: document.getElementById('signup-name'),
    signupRegno: document.getElementById('signup-regno'),
    signupEmail: document.getElementById('signup-email'),
    signupPassword: document.getElementById('signup-password'),
    signupConfirmPassword: document.getElementById('signup-confirm-password'),
    loginBtn: document.getElementById('login-btn'),
    signupBtn: document.getElementById('signup-btn'),
    googleLoginBtn: document.getElementById('google-login-btn'),
    authTabs: document.querySelectorAll('.auth-tab'),
    
    // Chat Elements
    sidebar: document.getElementById('sidebar'),
    messagesContainer: document.getElementById('messages-container'),
    messages: document.getElementById('messages'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    attachmentBtn: document.getElementById('attachment-btn'),
    attachmentMenu: document.getElementById('attachment-menu'),
    audioRecorderEl: document.getElementById('audio-recorder'),
    voiceBtn: document.getElementById('voice-btn'),
    emojiBtn: document.getElementById('emoji-btn'),
    scrollBottomBtn: document.getElementById('scroll-bottom-btn'),
    
    // User Interface
    userName: document.getElementById('user-name'),
    userAvatar: document.getElementById('user-avatar'),
    userAvatarImg: document.getElementById('user-avatar-img'),
    userAvatarIcon: document.getElementById('user-avatar-icon'),
    userStatusText: document.getElementById('user-status-text'),
    userRegno: document.getElementById('user-regno'),
    chatTitle: document.getElementById('chat-title'),
    chatSubtitle: document.getElementById('chat-subtitle'),
    chatOnlineCount: document.getElementById('chat-online-count'),
    mobileChatTitle: document.getElementById('mobile-chat-title'),
    mobileOnlineCount: document.getElementById('mobile-online-count'),
    onlineCount: document.getElementById('online-count'),
    typingIndicator: document.getElementById('typing-indicator'),
    
    // Lists
    chatsList: document.getElementById('chats-list'),
    contactsList: document.getElementById('contacts-list'),
    groupsList: document.getElementById('groups-list'),
    
    // Navigation
    menuToggle: document.getElementById('menu-toggle'),
    closeSidebar: document.getElementById('close-sidebar'),
    navBtns: document.querySelectorAll('.nav-btn'),
    
    // Modals
    newChatModal: document.getElementById('new-chat-modal'),
    newGroupModal: document.getElementById('new-group-modal'),
    chatInfoModal: document.getElementById('chat-info-modal'),
    membersModal: document.getElementById('members-modal'),
    filePreviewModal: document.getElementById('file-preview-modal'),
    
    // Buttons
    logoutBtn: document.getElementById('logout-btn'),
    newChatBtn: document.getElementById('new-chat-btn'),
    newGroupBtn: document.getElementById('new-group-btn'),
    createGroupBtn: document.getElementById('create-group-btn'),
    chatInfoBtn: document.getElementById('chat-info-btn'),
    chatMembersBtn: document.getElementById('chat-members-btn'),
    
    // Overlay and Notifications
    overlay: document.getElementById('overlay'),
    notificationsToggle: document.getElementById('notifications-toggle'),
    notificationsContainer: document.getElementById('notifications-container'),
    notificationsList: document.getElementById('notifications-list'),
    clearNotificationsBtn: document.getElementById('clear-notifications'),
    notificationBadge: document.getElementById('notification-badge'),
    
    // Progress
    progressContainer: document.getElementById('progress-container'),
    progressFill: document.getElementById('progress-fill'),
    progressPercent: document.getElementById('progress-percent'),
    progressFileName: document.getElementById('progress-file-name'),
    progressFileSize: document.getElementById('progress-file-size'),
    
    // Other
    searchInput: document.getElementById('search-input'),
    newChatSearch: document.getElementById('new-chat-search'),
    groupNameInput: document.getElementById('group-name-input'),
    groupDescriptionInput: document.getElementById('group-description-input'),
    selectedMembers: document.getElementById('selected-members'),
    availableUsers: document.getElementById('available-users')
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM Loaded - Initializing ZU Chat");
    
    // Hide splash screen after 2 seconds
    setTimeout(() => {
        elements.splashScreen.style.display = 'none';
        initializeApp();
    }, 2000);
});

function initializeApp() {
    console.log("🔄 Initializing application...");
    
    // Setup event listeners
    setupEventListeners();
    
    // Check authentication state
    checkAuthState();
    
    // Setup service worker for PWA
    setupServiceWorker();
    
    console.log("✅ Application initialized");
}

function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
    console.log("🔗 Setting up event listeners...");
    
    // Auth Tab Switching
    elements.authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchAuthTab(tabName);
        });
    });
    
    // Show Password Toggles
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
    
    // Auth Buttons
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.signupBtn.addEventListener('click', handleSignup);
    elements.googleLoginBtn.addEventListener('click', handleGoogleLogin);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Enter key for forms
    [elements.loginEmail, elements.loginPassword].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    });
    
    [elements.signupName, elements.signupRegno, elements.signupEmail, 
     elements.signupPassword, elements.signupConfirmPassword].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSignup();
        });
    });
    
    // Navigation
    elements.menuToggle.addEventListener('click', toggleSidebar);
    elements.closeSidebar.addEventListener('click', toggleSidebar);
    elements.overlay.addEventListener('click', closeAllModals);
    
    // Nav Buttons
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            switchSection(section);
        });
    });
    
    // Message Input
    elements.messageInput.addEventListener('input', handleMessageInput);
    elements.messageInput.addEventListener('keypress', handleMessageKeypress);
    elements.messageInput.addEventListener('focus', handleTypingStart);
    elements.messageInput.addEventListener('blur', handleTypingStop);
    
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.attachmentBtn.addEventListener('click', toggleAttachmentMenu);
    elements.voiceBtn.addEventListener('click', toggleVoiceRecording);
    elements.scrollBottomBtn.addEventListener('click', scrollToBottom);
    
    // Attachment Options
    document.querySelectorAll('.attach-option').forEach(option => {
        option.addEventListener('click', function() {
            const type = this.dataset.type;
            handleAttachment(type);
        });
    });
    
    // Audio Recorder
    document.getElementById('cancel-recording').addEventListener('click', cancelRecording);
    document.getElementById('stop-recording').addEventListener('click', stopRecording);
    
    // New Chat/Group
    elements.newChatBtn.addEventListener('click', openNewChatModal);
    elements.newGroupBtn.addEventListener('click', openNewGroupModal);
    elements.createGroupBtn.addEventListener('click', createNewGroup);
    
    // Chat Actions
    elements.chatInfoBtn.addEventListener('click', openChatInfoModal);
    elements.chatMembersBtn.addEventListener('click', openMembersModal);
    
    // Notifications
    elements.notificationsToggle.addEventListener('click', toggleNotifications);
    elements.clearNotificationsBtn.addEventListener('click', clearNotifications);
    
    // Modal Close Buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Search Input
    elements.searchInput.addEventListener('input', handleSearch);
    elements.newChatSearch.addEventListener('input', handleNewChatSearch);
    
    // Window Events
    window.addEventListener('resize', handleResize);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Click outside attachment menu
    document.addEventListener('click', (e) => {
        if (!elements.attachmentMenu.contains(e.target) && 
            !elements.attachmentBtn.contains(e.target)) {
            elements.attachmentMenu.classList.remove('active');
        }
    });
    
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
            initializeUserPresence();
            loadInitialData();
            
            // Initialize FCM for notifications
            if (window.initFCMForUser) {
                window.initFCMForUser(user.uid);
            }
        } else {
            currentUser = null;
            showScreen('auth-screen');
        }
    });
}

function switchAuthTab(tabName) {
    // Update active tab
    elements.authTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Show corresponding form
    elements.loginForm.classList.toggle('active', tabName === 'login');
    elements.signupForm.classList.toggle('active', tabName === 'signup');
}

async function handleLogin() {
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;
    
    if (!validateEmail(email)) {
        showNotification('Invalid email format', 'error');
        return;
    }
    
    if (!password) {
        showNotification('Please enter password', 'error');
        return;
    }
    
    try {
        showNotification('Logging in...', 'info');
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log("✅ Logged in:", userCredential.user.email);
        showNotification('Login successful!', 'success');
    } catch (error) {
        console.error("❌ Login error:", error);
        showNotification(error.message, 'error');
    }
}

async function handleSignup() {
    const name = elements.signupName.value.trim();
    const regno = elements.signupRegno.value.trim();
    const email = elements.signupEmail.value.trim();
    const password = elements.signupPassword.value;
    const confirmPassword = elements.signupConfirmPassword.value;
    
    // Validation
    if (!name) {
        showNotification('Please enter your full name', 'error');
        return;
    }
    
    if (!regno) {
        showNotification('Please enter registration number', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Invalid email format', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    try {
        showNotification('Creating account...', 'info');
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update profile
        await userCredential.user.updateProfile({
            displayName: name,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0056A4&color=fff`
        });
        
        // Create user document
        await db.collection('users').doc(userCredential.user.uid).set({
            uid: userCredential.user.uid,
            email: email,
            displayName: name,
            regNo: regno,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0056A4&color=fff`,
            status: 'online',
            role: 'student',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            fcmToken: '',
            notificationEnabled: false
        });
        
        console.log("✅ Account created:", userCredential.user.uid);
        showNotification('Account created successfully!', 'success');
        
    } catch (error) {
        console.error("❌ Signup error:", error);
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
        const user = result.user;
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            status: 'online',
            role: 'student',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            fcmToken: '',
            notificationEnabled: false
        }, { merge: true });
        
        console.log("✅ Google login successful:", user.email);
        showNotification('Signed in with Google!', 'success');
        
    } catch (error) {
        console.error("❌ Google login error:", error);
        showNotification(error.message, 'error');
    }
}

async function handleLogout() {
    try {
        // Update user status to offline
        if (currentUser) {
            await db.collection('users').doc(currentUser.uid).update({
                status: 'offline',
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Clear all listeners
        messageListeners.forEach(unsubscribe => unsubscribe());
        messageListeners.clear();
        
        chatListeners.forEach(unsubscribe => unsubscribe());
        chatListeners.clear();
        
        // Clear data
        currentUser = null;
        currentChat = {
            id: 'global',
            type: 'group',
            name: 'ZU Global Chat',
            avatar: 'fas fa-globe',
            members: [],
            admins: [],
            createdBy: null
        };
        onlineUsers.clear();
        allContacts.clear();
        userGroups.clear();
        selectedFiles.clear();
        selectedUsers.clear();
        notifications = [];
        unreadMessages.clear();
        
        // Clear UI
        elements.messages.innerHTML = '';
        elements.chatsList.innerHTML = '';
        elements.contactsList.innerHTML = '';
        elements.groupsList.innerHTML = '';
        elements.notificationsList.innerHTML = '';
        elements.messageInput.value = '';
        
        // Sign out
        await auth.signOut();
        
        showNotification('Logged out successfully', 'success');
        
    } catch (error) {
        console.error("❌ Logout error:", error);
        showNotification(error.message, 'error');
    }
}

// ============================================
// USER MANAGEMENT
// ============================================

async function initializeUser(user) {
    console.log("👤 Initializing user:", user.uid);
    
    // Update UI
    elements.userName.textContent = user.displayName || user.email.split('@')[0];
    elements.userRegno.textContent = '';
    
    // Set avatar
    if (user.photoURL) {
        elements.userAvatarImg.src = user.photoURL;
        elements.userAvatarImg.style.display = 'block';
        elements.userAvatarIcon.style.display = 'none';
    } else {
        elements.userAvatarImg.style.display = 'none';
        elements.userAvatarIcon.style.display = 'block';
        elements.userAvatarIcon.className = 'fas fa-user';
    }
    
    // Update or create user document
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
        await userRef.set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=0056A4&color=fff`,
            status: 'online',
            role: 'student',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
    } else {
        await userRef.update({
            status: 'online',
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}

function initializeUserPresence() {
    if (!currentUser) return;
    
    const userRef = db.collection('users').doc(currentUser.uid);
    
    // Update status on disconnect
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
    
    // Update status on visibility change
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
    loadUserGroups();
    loadUserChats();
    loadGlobalChat();
}

function loadOnlineUsers() {
    console.log("👥 Loading online users...");
    
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
            updateContactsList();
        }, error => {
            console.error("Error loading online users:", error);
            window.showFirebaseError(error);
        });
}

async function loadContacts() {
    try {
        const snapshot = await db.collection('users')
            .where('uid', '!=', currentUser.uid)
            .get();
        
        allContacts.clear();
        snapshot.forEach(doc => {
            const user = doc.data();
            allContacts.set(user.uid, user);
        });
        
        updateContactsList();
        
    } catch (error) {
        console.error("Error loading contacts:", error);
        window.showFirebaseError(error);
    }
}

function loadUserGroups() {
    console.log("👥 Loading user groups...");
    
    const unsubscribe = db.collection('groups')
        .where('members', 'array-contains', currentUser.uid)
        .onSnapshot(snapshot => {
            userGroups.clear();
            
            snapshot.forEach(doc => {
                const group = { id: doc.id, ...doc.data() };
                userGroups.set(group.id, group);
                
                // Listen for group messages
                if (!chatListeners.has(group.id)) {
                    listenToGroupMessages(group.id);
                }
            });
            
            updateGroupsList();
            
            // Update global chat listener
            if (!chatListeners.has('global')) {
                listenToGlobalMessages();
            }
            
        }, error => {
            console.error("Error loading groups:", error);
            window.showFirebaseError(error);
        });
    
    chatListeners.set('groups', unsubscribe);
}

async function loadUserChats() {
    try {
        // Load private chats
        const privateChatsQuery = db.collection('chats')
            .where('type', '==', 'private')
            .where('participants', 'array-contains', currentUser.uid)
            .orderBy('lastMessageAt', 'desc');
        
        const unsubscribe = privateChatsQuery.onSnapshot(snapshot => {
            snapshot.forEach(doc => {
                const chat = { id: doc.id, ...doc.data() };
                
                // Listen for chat messages
                if (!chatListeners.has(chat.id)) {
                    listenToPrivateMessages(chat.id);
                }
            });
            
            updateChatsList();
            
        }, error => {
            console.error("Error loading chats:", error);
            window.showFirebaseError(error);
        });
        
        chatListeners.set('chats', unsubscribe);
        
    } catch (error) {
        console.error("Error loading user chats:", error);
        window.showFirebaseError(error);
    }
}

function loadGlobalChat() {
    // Switch to global chat by default
    switchToChat({
        id: 'global',
        type: 'group',
        name: 'ZU Global Chat',
        avatar: 'fas fa-globe',
        members: ['all'],
        admins: [],
        createdBy: 'system'
    });
}

function switchToChat(chat) {
    console.log("🔄 Switching to chat:", chat.id, chat.name);
    
    // Stop previous message listener
    if (messageListeners.has(currentChat.id)) {
        messageListeners.get(currentChat.id)();
        messageListeners.delete(currentChat.id);
    }
    
    // Update current chat
    currentChat = chat;
    
    // Update UI
    elements.chatTitle.textContent = chat.name;
    elements.mobileChatTitle.textContent = chat.name;
    
    // Update chat avatar
    const chatAvatarIcon = document.getElementById('chat-avatar-icon');
    if (chatAvatarIcon) {
        chatAvatarIcon.className = chat.avatar || 'fas fa-users';
    }
    
    // Clear messages
    elements.messages.innerHTML = '';
    
    // Load messages for this chat
    loadChatMessages(chat);
    
    // Mark as read
    markChatAsRead(chat.id);
    
    // Update unread badge
    updateUnreadBadge();
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        elements.sidebar.classList.remove('active');
        elements.overlay.classList.remove('active');
    }
    
    // Scroll to bottom
    setTimeout(scrollToBottom, 100);
}

async function loadChatMessages(chat) {
    console.log("📨 Loading messages for:", chat.id);
    
    let query;
    
    if (chat.type === 'private') {
        // Private chat messages
        query = db.collection('messages')
            .where('chatId', '==', chat.id)
            .orderBy('timestamp', 'asc');
    } else if (chat.id === 'global') {
        // Global chat messages
        query = db.collection('messages')
            .where('type', '==', 'global')
            .orderBy('timestamp', 'asc');
    } else {
        // Group chat messages
        query = db.collection('messages')
            .where('chatId', '==', chat.id)
            .orderBy('timestamp', 'asc');
    }
    
    try {
        const unsubscribe = query.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const message = change.doc.data();
                    displayMessage(message);
                }
            });
            
            // Scroll to bottom after new messages
            scrollToBottom();
            
        }, error => {
            console.error("Error loading messages:", error);
            window.showFirebaseError(error);
        });
        
        messageListeners.set(chat.id, unsubscribe);
        
    } catch (error) {
        console.error("Error setting up message listener:", error);
        window.showFirebaseError(error);
        
        // Show error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'message system';
        errorMsg.innerHTML = `
            <div class="message-content">
                <div class="message-text">Error loading messages. Please check your connection.</div>
            </div>
        `;
        elements.messages.appendChild(errorMsg);
    }
}

function listenToGlobalMessages() {
    const unsubscribe = db.collection('messages')
        .where('type', '==', 'global')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const message = change.doc.data();
                    updateChatPreview('global', message);
                }
            });
        });
    
    chatListeners.set('global', unsubscribe);
}

function listenToGroupMessages(groupId) {
    const unsubscribe = db.collection('messages')
        .where('chatId', '==', groupId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const message = change.doc.data();
                    updateChatPreview(groupId, message);
                }
            });
        });
    
    chatListeners.set(groupId, unsubscribe);
}

function listenToPrivateMessages(chatId) {
    const unsubscribe = db.collection('messages')
        .where('chatId', '==', chatId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const message = change.doc.data();
                    updateChatPreview(chatId, message);
                }
            });
        });
    
    chatListeners.set(chatId, unsubscribe);
}

// ============================================
// MESSAGING
// ============================================

async function sendMessage() {
    const text = elements.messageInput.value.trim();
    
    if (!text && selectedFiles.size === 0) {
        showNotification('Please enter a message or attach a file', 'warning');
        return;
    }
    
    if (!currentUser) {
        showNotification('You must be logged in to send messages', 'error');
        return;
    }
    
    try {
        let messageData = {
            senderId: currentUser.uid,
            senderName: currentUser.displayName || currentUser.email.split('@')[0],
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'text',
            text: text
        };
        
        // Handle attachments
        if (selectedFiles.size > 0) {
            for (const [fileId, fileData] of selectedFiles) {
                const fileUrl = await uploadFile(fileData.file, fileData.type);
                
                messageData = {
                    ...messageData,
                    type: fileData.type,
                    fileUrl: fileUrl,
                    fileName: fileData.file.name,
                    fileSize: fileData.file.size,
                    text: fileData.type === 'image' || fileData.type === 'video' ? 
                          (text || `Sent a ${fileData.type}`) : text
                };
                
                // Add media-specific data
                if (fileData.type === 'audio') {
                    messageData.duration = fileData.duration || 0;
                }
            }
            
            selectedFiles.clear();
        }
        
        // Add chat-specific data
        if (currentChat.type === 'private') {
            messageData.chatId = currentChat.id;
            messageData.type = 'private';
            messageData.receiverId = currentChat.members.find(id => id !== currentUser.uid);
        } else if (currentChat.id === 'global') {
            messageData.chatId = 'global';
            messageData.type = 'global';
        } else {
            messageData.chatId = currentChat.id;
            messageData.type = 'group';
            messageData.groupId = currentChat.id;
        }
        
        // Save message to Firestore
        const messageRef = await db.collection('messages').add(messageData);
        console.log("✅ Message sent:", messageRef.id);
        
        // Update chat last message
        await updateChatLastMessage(messageData);
        
        // Clear input and attachments
        elements.messageInput.value = '';
        elements.sendBtn.classList.remove('active');
        elements.voiceBtn.classList.add('active');
        
        // Send typing stop signal
        handleTypingStop();
        
        // Show success notification
        showNotification('Message sent', 'success');
        
    } catch (error) {
        console.error("❌ Error sending message:", error);
        showNotification('Failed to send message', 'error');
        window.showFirebaseError(error);
    }
}

async function uploadFile(file, fileType) {
    return new Promise((resolve, reject) => {
        const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const filePath = `uploads/${currentUser.uid}/${fileType}s/${fileId}_${file.name}`;
        const uploadTask = storage.ref(filePath).put(file);
        
        // Show progress
        showUploadProgress(file.name, file.size);
        
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
    try {
        let chatRef;
        
        if (currentChat.type === 'private') {
            chatRef = db.collection('chats').doc(currentChat.id);
        } else if (currentChat.id === 'global') {
            return; // Global chat doesn't need updating
        } else {
            chatRef = db.collection('groups').doc(currentChat.id);
        }
        
        const lastMessage = {
            text: message.type === 'text' ? message.text : 
                  message.type === 'image' ? '📷 Photo' :
                  message.type === 'video' ? '🎥 Video' :
                  message.type === 'audio' ? '🎤 Audio' :
                  message.type === 'file' ? '📎 File' : 'New message',
            senderId: message.senderId,
            senderName: message.senderName,
            timestamp: message.timestamp,
            type: message.type
        };
        
        await chatRef.update({
            lastMessage: lastMessage,
            lastMessageAt: message.timestamp,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
    } catch (error) {
        console.error("Error updating chat last message:", error);
    }
}

// ============================================
// MESSAGE DISPLAY
// ============================================

function displayMessage(message) {
    if (!message || !message.senderId) return;
    
    const isCurrentUser = message.senderId === currentUser.uid;
    const isSystem = message.senderId === 'system';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isCurrentUser ? 'sent' : 'received'} ${isSystem ? 'system' : ''}`;
    
    // Format time
    const time = message.timestamp?.toDate ? 
        formatTime(message.timestamp.toDate()) : 
        formatTime(new Date());
    
    let content = '';
    
    if (isSystem) {
        content = `
            <div class="message-content">
                <div class="message-text">${message.text}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    } else {
        content = `
            <div class="message-content">
                ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
                ${getMessageContent(message)}
                <div class="message-time">${time}</div>
                ${isCurrentUser ? getMessageActions(message) : ''}
            </div>
        `;
    }
    
    messageDiv.innerHTML = content;
    elements.messages.appendChild(messageDiv);
    
    // Setup media players
    if (message.type === 'audio') {
        setupAudioPlayer(messageDiv.querySelector('.message-audio'), message.fileUrl);
    }
    
    // Scroll to bottom if user is near bottom
    scrollToBottom();
}

function getMessageContent(message) {
    switch (message.type) {
        case 'text':
            return `<div class="message-text">${message.text}</div>`;
            
        case 'image':
            return `
                <div class="message-media">
                    <img src="${message.fileUrl}" alt="Shared image" onclick="previewImage('${message.fileUrl}')">
                </div>
                ${message.text ? `<div class="message-text">${message.text}</div>` : ''}
            `;
            
        case 'video':
            return `
                <div class="message-media">
                    <video controls>
                        <source src="${message.fileUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
                ${message.text ? `<div class="message-text">${message.text}</div>` : ''}
            `;
            
        case 'audio':
            return `
                <div class="message-audio" data-audio-url="${message.fileUrl}">
                    <button class="play-pause-btn">
                        <i class="fas fa-play"></i>
                    </button>
                    <div class="audio-progress">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="audio-duration">${formatDuration(message.duration || 0)}</div>
                </div>
                ${message.text ? `<div class="message-text">${message.text}</div>` : ''}
            `;
            
        case 'file':
            return `
                <a href="${message.fileUrl}" target="_blank" class="message-file" download="${message.fileName}">
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
                ${message.text ? `<div class="message-text">${message.text}</div>` : ''}
            `;
            
        default:
            return `<div class="message-text">${message.text || 'Unsupported message type'}</div>`;
    }
}

function getMessageActions(message) {
    const isAdmin = currentChat.admins?.includes(currentUser.uid) || currentChat.createdBy === currentUser.uid;
    const canEdit = isAdmin || message.senderId === currentUser.uid;
    
    return `
        <div class="message-actions">
            ${canEdit ? `<button class="message-action-btn edit-message" data-message-id="${message.id}">
                <i class="fas fa-edit"></i>
            </button>` : ''}
            ${canEdit ? `<button class="message-action-btn delete-message" data-message-id="${message.id}">
                <i class="fas fa-trash"></i>
            </button>` : ''}
        </div>
    `;
}

// ============================================
// ATTACHMENTS & MEDIA
// ============================================

function handleAttachment(type) {
    hideAttachmentMenu();
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = getAcceptType(type);
    input.multiple = false;
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showNotification('File size must be less than 10MB', 'error');
            return;
        }
        
        if (type === 'image' || type === 'video') {
            // Preview before sending
            previewMedia(file, type);
        } else if (type === 'audio') {
            // Record audio duration
            const audio = new Audio(URL.createObjectURL(file));
            audio.onloadedmetadata = () => {
                selectedFiles.set(Date.now(), {
                    file: file,
                    type: type,
                    duration: audio.duration
                });
                sendMessage();
            };
        } else {
            // Direct send for documents
            selectedFiles.set(Date.now(), {
                file: file,
                type: type
            });
            sendMessage();
        }
    };
    
    input.click();
}

function getAcceptType(type) {
    switch (type) {
        case 'image': return 'image/*';
        case 'video': return 'video/*';
        case 'audio': return 'audio/*';
        case 'document': return '.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx';
        default: return '*/*';
    }
}

function previewMedia(file, type) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const previewContent = document.getElementById('file-preview-content');
        
        if (type === 'image') {
            previewContent.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 400px;">`;
        } else if (type === 'video') {
            previewContent.innerHTML = `
                <video controls style="max-width: 100%; max-height: 400px;">
                    <source src="${e.target.result}" type="${file.type}">
                    Your browser does not support the video tag.
                </video>
            `;
        }
        
        // Store file for sending
        selectedFiles.set(Date.now(), {
            file: file,
            type: type
        });
        
        // Setup send button
        const sendFileBtn = document.getElementById('send-file-btn');
        sendFileBtn.onclick = () => {
            sendMessage();
            closeModal(document.getElementById('file-preview-modal'));
        };
        
        // Setup cancel button
        const cancelFileBtn = document.getElementById('cancel-file-btn');
        cancelFileBtn.onclick = () => {
            selectedFiles.clear();
            closeModal(document.getElementById('file-preview-modal'));
        };
        
        // Show modal
        openModal('file-preview-modal');
    };
    
    reader.readAsDataURL(file);
}

// ============================================
// AUDIO RECORDING
// ============================================

async function toggleVoiceRecording() {
    if (elements.voiceBtn.classList.contains('recording')) {
        stopRecording();
    } else {
        await startRecording();
    }
}

async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('Audio recording not supported in this browser', 'error');
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });
        
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const duration = (Date.now() - recordingStartTime) / 1000;
            
            // Create audio file
            const audioFile = new File([audioBlob], `recording_${Date.now()}.webm`, {
                type: 'audio/webm'
            });
            
            // Add to selected files
            selectedFiles.set(Date.now(), {
                file: audioFile,
                type: 'audio',
                duration: duration
            });
            
            // Send message
            await sendMessage();
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };
        
        // Start recording
        mediaRecorder.start();
        recordingStartTime = Date.now();
        startRecordingTimer();
        
        // Update UI
        elements.voiceBtn.classList.add('recording');
        elements.audioRecorderEl.classList.add('active');
        elements.messageInput.disabled = true;
        
    } catch (error) {
        console.error("Error starting recording:", error);
        showNotification('Microphone access denied', 'error');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        stopRecordingTimer();
        
        // Update UI
        elements.voiceBtn.classList.remove('recording');
        elements.audioRecorderEl.classList.remove('active');
        elements.messageInput.disabled = false;
    }
}

function cancelRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        stopRecordingTimer();
        
        // Update UI
        elements.voiceBtn.classList.remove('recording');
        elements.audioRecorderEl.classList.remove('active');
        elements.messageInput.disabled = false;
        
        showNotification('Recording cancelled', 'info');
    }
}

function startRecordingTimer() {
    const timerElement = document.getElementById('recording-timer');
    recordingStartTime = Date.now();
    
    recordingInterval = setInterval(() => {
        const elapsed = Date.now() - recordingStartTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopRecordingTimer() {
    if (recordingInterval) {
        clearInterval(recordingInterval);
        recordingInterval = null;
    }
}

// ============================================
// GROUP MANAGEMENT
// ============================================

async function createNewGroup() {
    const name = elements.groupNameInput.value.trim();
    const description = elements.groupDescriptionInput.value.trim();
    
    if (!name) {
        showNotification('Please enter group name', 'error');
        return;
    }
    
    if (selectedUsers.size === 0) {
        showNotification('Please select at least one member', 'error');
        return;
    }
    
    try {
        // Add current user to members
        const members = Array.from(selectedUsers);
        members.push(currentUser.uid);
        
        // Create group data
        const groupData = {
            name: name,
            description: description,
            createdBy: currentUser.uid,
            creatorName: currentUser.displayName,
            members: members,
            admins: [currentUser.uid],
            avatar: 'fas fa-users',
            type: 'group',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Create group document
        const groupRef = await db.collection('groups').add(groupData);
        
        // Create initial system message
        await db.collection('messages').add({
            senderId: 'system',
            senderName: 'System',
            text: `${currentUser.displayName} created the group "${name}"`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            chatId: groupRef.id,
            type: 'system'
        });
        
        showNotification(`Group "${name}" created successfully!`, 'success');
        
        // Close modal and switch to group
        closeModal(elements.newGroupModal);
        selectedUsers.clear();
        elements.selectedMembers.innerHTML = '';
        elements.groupNameInput.value = '';
        elements.groupDescriptionInput.value = '';
        
        // Switch to new group
        switchToChat({
            id: groupRef.id,
            type: 'group',
            name: name,
            avatar: 'fas fa-users',
            members: members,
            admins: [currentUser.uid],
            createdBy: currentUser.uid
        });
        
    } catch (error) {
        console.error("Error creating group:", error);
        showNotification('Failed to create group', 'error');
        window.showFirebaseError(error);
    }
}

async function deleteGroup(groupId) {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Check if user is admin
        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            showNotification('Group not found', 'error');
            return;
        }
        
        const group = groupDoc.data();
        if (!group.admins.includes(currentUser.uid) && group.createdBy !== currentUser.uid) {
            showNotification('Only admins can delete groups', 'error');
            return;
        }
        
        // Delete group document
        await db.collection('groups').doc(groupId).delete();
        
        // Delete all group messages
        const messagesQuery = await db.collection('messages')
            .where('chatId', '==', groupId)
            .get();
        
        const batch = db.batch();
        messagesQuery.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        
        showNotification('Group deleted successfully', 'success');
        
        // Switch to global chat
        loadGlobalChat();
        
    } catch (error) {
        console.error("Error deleting group:", error);
        showNotification('Failed to delete group', 'error');
        window.showFirebaseError(error);
    }
}

async function leaveGroup(groupId) {
    if (!confirm('Are you sure you want to leave this group?')) {
        return;
    }
    
    try {
        const groupRef = db.collection('groups').doc(groupId);
        const groupDoc = await groupRef.get();
        
        if (!groupDoc.exists) {
            showNotification('Group not found', 'error');
            return;
        }
        
        const group = groupDoc.data();
        
        // Remove user from members
        const updatedMembers = group.members.filter(member => member !== currentUser.uid);
        const updatedAdmins = group.admins.filter(admin => admin !== currentUser.uid);
        
        await groupRef.update({
            members: updatedMembers,
            admins: updatedAdmins,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Add system message
        await db.collection('messages').add({
            senderId: 'system',
            senderName: 'System',
            text: `${currentUser.displayName} left the group`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            chatId: groupId,
            type: 'system'
        });
        
        showNotification('You have left the group', 'success');
        
        // Switch to global chat
        loadGlobalChat();
        
    } catch (error) {
        console.error("Error leaving group:", error);
        showNotification('Failed to leave group', 'error');
        window.showFirebaseError(error);
    }
}

async function addMemberToGroup(groupId, userId) {
    try {
        const groupRef = db.collection('groups').doc(groupId);
        const groupDoc = await groupRef.get();
        
        if (!groupDoc.exists) {
            showNotification('Group not found', 'error');
            return;
        }
        
        const group = groupDoc.data();
        
        // Check if user is admin
        if (!group.admins.includes(currentUser.uid)) {
            showNotification('Only admins can add members', 'error');
            return;
        }
        
        // Check if user is already a member
        if (group.members.includes(userId)) {
            showNotification('User is already a member', 'warning');
            return;
        }
        
        // Add user to members
        await groupRef.update({
            members: [...group.members, userId],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Get user info for system message
        const userDoc = await db.collection('users').doc(userId).get();
        const userName = userDoc.exists ? userDoc.data().displayName : 'New member';
        
        // Add system message
        await db.collection('messages').add({
            senderId: 'system',
            senderName: 'System',
            text: `${userName} was added to the group by ${currentUser.displayName}`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            chatId: groupId,
            type: 'system'
        });
        
        showNotification('Member added successfully', 'success');
        
    } catch (error) {
        console.error("Error adding member:", error);
        showNotification('Failed to add member', 'error');
        window.showFirebaseError(error);
    }
}

async function removeMemberFromGroup(groupId, userId) {
    try {
        const groupRef = db.collection('groups').doc(groupId);
        const groupDoc = await groupRef.get();
        
        if (!groupDoc.exists) {
            showNotification('Group not found', 'error');
            return;
        }
        
        const group = groupDoc.data();
        
        // Check if user is admin
        if (!group.admins.includes(currentUser.uid)) {
            showNotification('Only admins can remove members', 'error');
            return;
        }
        
        // Check if trying to remove yourself
        if (userId === currentUser.uid) {
            showNotification('Use "Leave Group" to remove yourself', 'warning');
            return;
        }
        
        // Check if trying to remove creator
        if (userId === group.createdBy) {
            showNotification('Cannot remove group creator', 'error');
            return;
        }
        
        // Remove user from members and admins
        const updatedMembers = group.members.filter(member => member !== userId);
        const updatedAdmins = group.admins.filter(admin => admin !== userId);
        
        await groupRef.update({
            members: updatedMembers,
            admins: updatedAdmins,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Get user info for system message
        const userDoc = await db.collection('users').doc(userId).get();
        const userName = userDoc.exists ? userDoc.data().displayName : 'Member';
        
        // Add system message
        await db.collection('messages').add({
            senderId: 'system',
            senderName: 'System',
            text: `${userName} was removed from the group by ${currentUser.displayName}`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            chatId: groupId,
            type: 'system'
        });
        
        showNotification('Member removed successfully', 'success');
        
    } catch (error) {
        console.error("Error removing member:", error);
        showNotification('Failed to remove member', 'error');
        window.showFirebaseError(error);
    }
}

// ============================================
// MESSAGE MANAGEMENT
// ============================================

async function editMessage(messageId, newText) {
    if (!newText || newText.trim() === '') {
        showNotification('Message cannot be empty', 'error');
        return;
    }
    
    try {
        const messageRef = db.collection('messages').doc(messageId);
        const messageDoc = await messageRef.get();
        
        if (!messageDoc.exists) {
            showNotification('Message not found', 'error');
            return;
        }
        
        const message = messageDoc.data();
        
        // Check permissions
        const isAdmin = currentChat.admins?.includes(currentUser.uid) || currentChat.createdBy === currentUser.uid;
        if (message.senderId !== currentUser.uid && !isAdmin) {
            showNotification('You can only edit your own messages', 'error');
            return;
        }
        
        // Update message
        await messageRef.update({
            text: newText,
            edited: true,
            editedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Message edited', 'success');
        
    } catch (error) {
        console.error("Error editing message:", error);
        showNotification('Failed to edit message', 'error');
        window.showFirebaseError(error);
    }
}

async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }
    
    try {
        const messageRef = db.collection('messages').doc(messageId);
        const messageDoc = await messageRef.get();
        
        if (!messageDoc.exists) {
            showNotification('Message not found', 'error');
            return;
        }
        
        const message = messageDoc.data();
        
        // Check permissions
        const isAdmin = currentChat.admins?.includes(currentUser.uid) || currentChat.createdBy === currentUser.uid;
        if (message.senderId !== currentUser.uid && !isAdmin) {
            showNotification('You can only delete your own messages', 'error');
            return;
        }
        
        // Delete message
        await messageRef.delete();
        
        showNotification('Message deleted', 'success');
        
    } catch (error) {
        console.error("Error deleting message:", error);
        showNotification('Failed to delete message', 'error');
        window.showFirebaseError(error);
    }
}

// ============================================
// UI UPDATES
// ============================================

function updateOnlineCount() {
    const count = onlineUsers.size;
    elements.onlineCount.textContent = `${count} online`;
    elements.mobileOnlineCount.textContent = `${count} online`;
    elements.chatOnlineCount.textContent = `${count} online`;
}

function updateContactsList() {
    if (!elements.contactsList) return;
    
    elements.contactsList.innerHTML = '';
    
    onlineUsers.forEach(user => {
        const contactItem = createContactItem(user);
        elements.contactsList.appendChild(contactItem);
    });
}

function updateGroupsList() {
    if (!elements.groupsList) return;
    
    elements.groupsList.innerHTML = '';
    
    // Add global chat
    const globalItem = createGroupItem({
        id: 'global',
        name: 'ZU Global Chat',
        avatar: 'fas fa-globe',
        lastMessage: { text: 'University-wide chat' }
    });
    elements.groupsList.appendChild(globalItem);
    
    // Add user groups
    userGroups.forEach(group => {
        const groupItem = createGroupItem(group);
        elements.groupsList.appendChild(groupItem);
    });
}

function updateChatsList() {
    if (!elements.chatsList) return;
    
    elements.chatsList.innerHTML = '';
    
    // Add global chat
    const globalItem = createChatItem({
        id: 'global',
        name: 'ZU Global Chat',
        avatar: 'fas fa-globe',
        type: 'group',
        lastMessage: { text: 'University-wide chat' }
    });
    elements.chatsList.appendChild(globalItem);
    
    // Add user groups
    userGroups.forEach(group => {
        const chatItem = createChatItem({
            id: group.id,
            name: group.name,
            avatar: group.avatar,
            type: 'group',
            lastMessage: group.lastMessage
        });
        elements.chatsList.appendChild(chatItem);
    });
}

function updateChatPreview(chatId, message) {
    // Update the chat list item with new message preview
    const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (chatItem) {
        const preview = chatItem.querySelector('.item-preview');
        if (preview) {
            preview.textContent = message.senderName + ': ' + 
                (message.type === 'text' ? message.text : 
                 message.type === 'image' ? '📷 Photo' :
                 message.type === 'video' ? '🎥 Video' :
                 message.type === 'audio' ? '🎤 Audio' :
                 message.type === 'file' ? '📎 File' : 'New message');
        }
        
        const time = chatItem.querySelector('.item-time');
        if (time && message.timestamp) {
            time.textContent = formatTime(message.timestamp.toDate());
        }
        
        // Add unread badge if not current chat
        if (chatId !== currentChat.id) {
            const unreadCount = unreadMessages.get(chatId) || 0;
            unreadMessages.set(chatId, unreadCount + 1);
            
            let badge = chatItem.querySelector('.item-unread');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'item-unread';
                chatItem.appendChild(badge);
            }
        }
    }
    
    updateUnreadBadge();
}

function createContactItem(user) {
    const div = document.createElement('div');
    div.className = 'contact-item';
    div.dataset.userId = user.uid;
    div.innerHTML = `
        <div class="item-avatar" style="${user.photoURL ? `background-image: url(${user.photoURL})` : ''}">
            ${!user.photoURL ? '<i class="fas fa-user"></i>' : ''}
        </div>
        <div class="item-info">
            <div class="item-name">${user.displayName}</div>
            <div class="item-status">${user.status === 'online' ? '🟢 Online' : '🟡 Away'}</div>
        </div>
    `;
    
    div.addEventListener('click', () => {
        startPrivateChat(user.uid, user.displayName);
    });
    
    return div;
}

function createGroupItem(group) {
    const div = document.createElement('div');
    div.className = `group-item ${currentChat.id === group.id ? 'active' : ''}`;
    div.dataset.chatId = group.id;
    div.innerHTML = `
        <div class="item-avatar">
            <i class="${group.avatar || 'fas fa-users'}"></i>
        </div>
        <div class="item-info">
            <div class="item-name">${group.name}</div>
            <div class="item-preview">${group.lastMessage?.text || 'No messages yet'}</div>
        </div>
        <div class="item-time">${group.lastMessage?.timestamp ? formatTime(group.lastMessage.timestamp.toDate()) : ''}</div>
        ${unreadMessages.get(group.id) ? '<div class="item-unread"></div>' : ''}
    `;
    
    div.addEventListener('click', () => {
        switchToChat({
            id: group.id,
            type: 'group',
            name: group.name,
            avatar: group.avatar,
            members: group.members,
            admins: group.admins,
            createdBy: group.createdBy
        });
    });
    
    return div;
}

function createChatItem(chat) {
    const div = document.createElement('div');
    div.className = `chat-item ${currentChat.id === chat.id ? 'active' : ''}`;
    div.dataset.chatId = chat.id;
    div.innerHTML = `
        <div class="item-avatar">
            <i class="${chat.avatar || 'fas fa-users'}"></i>
        </div>
        <div class="item-info">
            <div class="item-name">${chat.name}</div>
            <div class="item-preview">${chat.lastMessage?.text || 'No messages yet'}</div>
        </div>
        <div class="item-time">${chat.lastMessage?.timestamp ? formatTime(chat.lastMessage.timestamp.toDate()) : ''}</div>
        ${unreadMessages.get(chat.id) ? '<div class="item-unread"></div>' : ''}
    `;
    
    div.addEventListener('click', () => {
        if (chat.type === 'group') {
            if (chat.id === 'global') {
                switchToChat({
                    id: 'global',
                    type: 'group',
                    name: 'ZU Global Chat',
                    avatar: 'fas fa-globe',
                    members: ['all'],
                    admins: [],
                    createdBy: 'system'
                });
            } else {
                const group = userGroups.get(chat.id);
                if (group) {
                    switchToChat({
                        id: group.id,
                        type: 'group',
                        name: group.name,
                        avatar: group.avatar,
                        members: group.members,
                        admins: group.admins,
                        createdBy: group.createdBy
                    });
                }
            }
        }
    });
    
    return div;
}

function markChatAsRead(chatId) {
    unreadMessages.delete(chatId);
    
    // Remove unread badge
    const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (chatItem) {
        const badge = chatItem.querySelector('.item-unread');
        if (badge) {
            badge.remove();
        }
    }
    
    updateUnreadBadge();
}

function updateUnreadBadge() {
    const totalUnread = Array.from(unreadMessages.values()).reduce((a, b) => a + b, 0);
    elements.notificationBadge.textContent = totalUnread > 0 ? totalUnread : '';
    elements.notificationBadge.style.display = totalUnread > 0 ? 'flex' : 'none';
    
    // Update browser title
    document.title = totalUnread > 0 ? 
        `(${totalUnread}) ZU Chat` : 
        'ZU Chat';
}

// ============================================
// MODAL MANAGEMENT
// ============================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        elements.overlay.classList.add('active');
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        elements.overlay.classList.remove('active');
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
    elements.overlay.classList.remove('active');
    elements.notificationsContainer.classList.remove('active');
    elements.sidebar.classList.remove('active');
}

function openNewChatModal() {
    // Load available users
    elements.availableUsers.innerHTML = '';
    
    allContacts.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'available-user-item';
        userItem.innerHTML = `
            <input type="checkbox" id="user-${user.uid}" value="${user.uid}" class="user-checkbox">
            <div class="item-avatar" style="${user.photoURL ? `background-image: url(${user.photoURL})` : ''}">
                ${!user.photoURL ? '<i class="fas fa-user"></i>' : ''}
            </div>
            <div class="item-info">
                <div class="item-name">${user.displayName}</div>
                <div class="item-status">${user.regNo || ''}</div>
            </div>
        `;
        
        const checkbox = userItem.querySelector('.user-checkbox');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedUsers.add(user.uid);
                addSelectedMember(user);
            } else {
                selectedUsers.delete(user.uid);
                removeSelectedMember(user.uid);
            }
        });
        
        elements.availableUsers.appendChild(userItem);
    });
    
    openModal('new-chat-modal');
}

function openNewGroupModal() {
    // Load available users for group
    elements.availableUsers.innerHTML = '';
    selectedUsers.clear();
    elements.selectedMembers.innerHTML = '';
    
    allContacts.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'available-user-item';
        userItem.innerHTML = `
            <input type="checkbox" id="group-user-${user.uid}" value="${user.uid}" class="user-checkbox">
            <div class="item-avatar" style="${user.photoURL ? `background-image: url(${user.photoURL})` : ''}">
                ${!user.photoURL ? '<i class="fas fa-user"></i>' : ''}
            </div>
            <div class="item-info">
                <div class="item-name">${user.displayName}</div>
                <div class="item-status">${user.regNo || ''}</div>
            </div>
        `;
        
        const checkbox = userItem.querySelector('.user-checkbox');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedUsers.add(user.uid);
                addSelectedMember(user);
            } else {
                selectedUsers.delete(user.uid);
                removeSelectedMember(user.uid);
            }
        });
        
        elements.availableUsers.appendChild(userItem);
    });
    
    openModal('new-group-modal');
}

function addSelectedMember(user) {
    const memberTag = document.createElement('div');
    memberTag.className = 'member-tag';
    memberTag.innerHTML = `
        <span>${user.displayName}</span>
        <button type="button" data-uid="${user.uid}">&times;</button>
    `;
    
    memberTag.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = e.target.dataset.uid;
        selectedUsers.delete(uid);
        document.querySelector(`#user-${uid}, #group-user-${uid}`).checked = false;
        memberTag.remove();
    });
    
    elements.selectedMembers.appendChild(memberTag);
}

function removeSelectedMember(uid) {
    const tag = document.querySelector(`.member-tag button[data-uid="${uid}"]`)?.parentElement;
    if (tag) tag.remove();
}

function openChatInfoModal() {
    const content = document.getElementById('chat-info-content');
    const actions = document.getElementById('chat-actions-buttons');
    
    if (!content || !actions) return;
    
    if (currentChat.id === 'global') {
        content.innerHTML = `
            <h4>ZU Global Chat</h4>
            <p>University-wide communication platform for all Zanzibar University students and staff.</p>
            <p><strong>Members:</strong> All users</p>
            <p><strong>Created:</strong> System</p>
        `;
        
        actions.innerHTML = `
            <button class="btn btn-secondary" onclick="closeModal(document.getElementById('chat-info-modal'))">
                Close
            </button>
        `;
    } else if (currentChat.type === 'group') {
        const group = userGroups.get(currentChat.id);
        if (group) {
            const isAdmin = group.admins.includes(currentUser.uid);
            const isCreator = group.createdBy === currentUser.uid;
            
            content.innerHTML = `
                <h4>${group.name}</h4>
                ${group.description ? `<p>${group.description}</p>` : ''}
                <p><strong>Members:</strong> ${group.members.length}</p>
                <p><strong>Admins:</strong> ${group.admins.length}</p>
                <p><strong>Created by:</strong> ${group.creatorName}</p>
                <p><strong>Created:</strong> ${formatTime(group.createdAt?.toDate())}</p>
            `;
            
            actions.innerHTML = `
                ${isAdmin || isCreator ? `
                    <button class="btn btn-danger" onclick="deleteGroup('${currentChat.id}')">
                        <i class="fas fa-trash"></i> Delete Group
                    </button>
                ` : ''}
                <button class="btn btn-warning" onclick="leaveGroup('${currentChat.id}')">
                    <i class="fas fa-sign-out-alt"></i> Leave Group
                </button>
                <button class="btn btn-secondary" onclick="closeModal(document.getElementById('chat-info-modal'))">
                    Close
                </button>
            `;
        }
    }
    
    openModal('chat-info-modal');
}

function openMembersModal() {
    if (currentChat.id === 'global') {
        showNotification('Global chat includes all users', 'info');
        return;
    }
    
    const membersList = document.getElementById('members-list');
    const membersActions = document.getElementById('members-actions');
    
    if (!membersList || !membersActions) return;
    
    membersList.innerHTML = '';
    
    // Get group info
    const group = userGroups.get(currentChat.id);
    if (!group) return;
    
    const isAdmin = group.admins.includes(currentUser.uid);
    const isCreator = group.createdBy === currentUser.uid;
    
    // Load members
    const memberPromises = group.members.map(async (memberId) => {
        const userDoc = await db.collection('users').doc(memberId).get();
        if (userDoc.exists) {
            const user = userDoc.data();
            
            const memberItem = document.createElement('div');
            memberItem.className = 'available-user-item';
            memberItem.innerHTML = `
                <div class="item-avatar" style="${user.photoURL ? `background-image: url(${user.photoURL})` : ''}">
                    ${!user.photoURL ? '<i class="fas fa-user"></i>' : ''}
                </div>
                <div class="item-info">
                    <div class="item-name">
                        ${user.displayName}
                        ${group.admins.includes(user.uid) ? ' 👑' : ''}
                        ${group.createdBy === user.uid ? ' ⭐' : ''}
                    </div>
                    <div class="item-status">${user.regNo || ''}</div>
                </div>
                ${isAdmin && memberId !== currentUser.uid && memberId !== group.createdBy ? `
                    <button class="btn btn-sm btn-danger remove-member-btn" data-user-id="${memberId}">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            `;
            
            // Add remove button functionality
            const removeBtn = memberItem.querySelector('.remove-member-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    removeMemberFromGroup(currentChat.id, memberId);
                });
            }
            
            return memberItem;
        }
        return null;
    });
    
    Promise.all(memberPromises).then(items => {
        items.filter(item => item !== null).forEach(item => {
            membersList.appendChild(item);
        });
    });
    
    membersActions.innerHTML = `
        ${isAdmin || isCreator ? `
            <button class="btn btn-primary" onclick="openAddMemberModal('${currentChat.id}')">
                <i class="fas fa-user-plus"></i> Add Member
            </button>
        ` : ''}
        <button class="btn btn-secondary" onclick="closeModal(document.getElementById('members-modal'))">
            Close
        </button>
    `;
    
    openModal('members-modal');
}

function openAddMemberModal(groupId) {
    // This would open another modal to search and add members
    showNotification('Add member feature - implement search and select users', 'info');
}

// ============================================
// NOTIFICATIONS
// ============================================

function toggleNotifications() {
    elements.notificationsContainer.classList.toggle('active');
    
    if (elements.notificationsContainer.classList.contains('active')) {
        loadNotifications();
    }
}

async function loadNotifications() {
    try {
        const snapshot = await db.collection('notifications')
            .where('userId', '==', currentUser.uid)
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        elements.notificationsList.innerHTML = '';
        
        if (snapshot.empty) {
            elements.notificationsList.innerHTML = `
                <div class="notification-item">
                    <div class="notification-message">No notifications yet</div>
                </div>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const notification = doc.data();
            const notificationItem = createNotificationItem(notification);
            elements.notificationsList.appendChild(notificationItem);
        });
        
    } catch (error) {
        console.error("Error loading notifications:", error);
    }
}

function createNotificationItem(notification) {
    const div = document.createElement('div');
    div.className = `notification-item ${notification.read ? '' : 'unread'}`;
    div.innerHTML = `
        <div class="notification-title">${notification.title}</div>
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${formatTime(notification.timestamp?.toDate())}</div>
    `;
    
    div.addEventListener('click', () => {
        markNotificationAsRead(notification.id);
        
        // Handle notification click action
        if (notification.chatId) {
            // Switch to the chat
            if (notification.chatId === 'global') {
                loadGlobalChat();
            } else {
                // Find and switch to the chat
                const group = userGroups.get(notification.chatId);
                if (group) {
                    switchToChat({
                        id: group.id,
                        type: 'group',
                        name: group.name,
                        avatar: group.avatar,
                        members: group.members,
                        admins: group.admins,
                        createdBy: group.createdBy
                    });
                }
            }
            
            closeAllModals();
        }
    });
    
    return div;
}

async function markNotificationAsRead(notificationId) {
    try {
        await db.collection('notifications').doc(notificationId).update({
            read: true,
            readAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
}

function clearNotifications() {
    // In a real app, you would delete notifications from Firebase
    // For now, just clear the UI
    elements.notificationsList.innerHTML = `
        <div class="notification-item">
            <div class="notification-message">No notifications</div>
        </div>
    `;
    
    // Clear badge
    elements.notificationBadge.textContent = '';
    elements.notificationBadge.style.display = 'none';
}

function showNotification(title, type = 'info', message = '') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
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
    
    // Add to container
    const container = document.createElement('div');
    container.className = 'notification-container';
    container.appendChild(notification);
    document.body.appendChild(container);
    
    // Add close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        container.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (container.parentNode) {
            container.remove();
        }
    }, 5000);
    
    // Also log to console
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
}

// Export for global access
window.showNotification = showNotification;

// ============================================
// PROGRESS UPDATES
// ============================================

function showUploadProgress(fileName, fileSize) {
    elements.progressFileName.textContent = fileName;
    elements.progressFileSize.textContent = formatFileSize(fileSize);
    elements.progressContainer.classList.add('active');
}

function updateUploadProgress(percentage) {
    elements.progressFill.style.width = `${percentage}%`;
    elements.progressPercent.textContent = `${Math.round(percentage)}%`;
}

function hideUploadProgress() {
    setTimeout(() => {
        elements.progressContainer.classList.remove('active');
        elements.progressFill.style.width = '0%';
        elements.progressPercent.textContent = '0%';
    }, 1000);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function formatTime(date) {
    if (!date) return '';
    
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

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

function switchSection(sectionName) {
    // Update active nav button
    elements.navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionName);
    });
    
    // Show corresponding section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.toggle('active', section.id === `${sectionName}-section`);
    });
}

function toggleAttachmentMenu() {
    elements.attachmentMenu.classList.toggle('active');
}

function hideAttachmentMenu() {
    elements.attachmentMenu.classList.remove('active');
}

function handleMessageInput() {
    const hasText = elements.messageInput.value.trim().length > 0;
    elements.sendBtn.classList.toggle('active', hasText);
    elements.voiceBtn.classList.toggle('active', !hasText);
    
    // Send typing indicator
    if (hasText && currentChat.id !== 'global') {
        sendTypingIndicator(true);
    }
}

function handleMessageKeypress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function handleTypingStart() {
    if (currentChat.id !== 'global') {
        sendTypingIndicator(true);
    }
}

function handleTypingStop() {
    if (currentChat.id !== 'global') {
        sendTypingIndicator(false);
    }
}

async function sendTypingIndicator(isTyping) {
    if (!currentUser || currentChat.id === 'global') return;
    
    // Clear previous timeout
    if (typingTimeouts.has(currentChat.id)) {
        clearTimeout(typingTimeouts.get(currentChat.id));
    }
    
    if (isTyping) {
        // Send typing indicator
        const typingRef = db.collection('typing').doc(currentChat.id);
        await typingRef.set({
            userId: currentUser.uid,
            userName: currentUser.displayName,
            isTyping: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Set timeout to stop typing indicator
        const timeout = setTimeout(async () => {
            await typingRef.update({
                isTyping: false
            });
            typingTimeouts.delete(currentChat.id);
        }, 3000);
        
        typingTimeouts.set(currentChat.id, timeout);
        
        // Listen for others typing
        listenToTyping();
        
    } else {
        // Stop typing indicator
        const typingRef = db.collection('typing').doc(currentChat.id);
        await typingRef.update({
            isTyping: false
        });
    }
}

function listenToTyping() {
    if (!currentChat.id || currentChat.id === 'global') return;
    
    const typingRef = db.collection('typing').doc(currentChat.id);
    
    typingRef.onSnapshot((doc) => {
        if (doc.exists) {
            const typingData = doc.data();
            if (typingData.isTyping && typingData.userId !== currentUser.uid) {
                elements.typingIndicator.textContent = `${typingData.userName} is typing...`;
                setTimeout(() => {
                    elements.typingIndicator.textContent = '';
                }, 3000);
            }
        }
    });
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    // Filter contacts
    const contactItems = elements.contactsList.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        const name = item.querySelector('.item-name').textContent.toLowerCase();
        item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
    });
    
    // Filter groups
    const groupItems = elements.groupsList.querySelectorAll('.group-item');
    groupItems.forEach(item => {
        const name = item.querySelector('.item-name').textContent.toLowerCase();
        item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
    });
}

function handleNewChatSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const userItems = elements.availableUsers.querySelectorAll('.available-user-item');
    
    userItems.forEach(item => {
        const name = item.querySelector('.item-name').textContent.toLowerCase();
        item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
    });
}

function handleResize() {
    // Close sidebar on mobile when switching to landscape
    if (window.innerWidth > 768) {
        elements.sidebar.classList.remove('active');
        elements.overlay.classList.remove('active');
    }
}

function handleBeforeUnload() {
    // Send typing stop signal
    handleTypingStop();
    
    // Update user status to offline
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).update({
            status: 'offline',
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(console.error);
    }
}

function scrollToBottom() {
    const messagesContainer = elements.messagesContainer;
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        elements.scrollBottomBtn.classList.remove('visible');
    }
}

// Setup scroll bottom button
elements.messagesContainer.addEventListener('scroll', () => {
    const container = elements.messagesContainer;
    const scrollBottomBtn = elements.scrollBottomBtn;
    
    if (container.scrollHeight - container.scrollTop - container.clientHeight > 100) {
        scrollBottomBtn.classList.add('visible');
    } else {
        scrollBottomBtn.classList.remove('visible');
    }
});

// Audio player setup
function setupAudioPlayer(audioElement, audioUrl) {
    if (!audioElement || !audioUrl) return;
    
    const playBtn = audioElement.querySelector('.play-pause-btn');
    const progressBar = audioElement.querySelector('.progress-fill');
    const durationElement = audioElement.querySelector('.audio-duration');
    
    const audio = new Audio(audioUrl);
    let isPlaying = false;
    
    // Update duration
    audio.onloadedmetadata = () => {
        if (durationElement) {
            durationElement.textContent = formatDuration(audio.duration);
        }
    };
    
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
        if (progressBar) {
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
    
    // Progress bar click to seek
    const progressContainer = audioElement.querySelector('.audio-progress');
    if (progressContainer) {
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audio.currentTime = percent * audio.duration;
        });
    }
}

// Image preview
function previewImage(imageUrl) {
    const previewContent = document.getElementById('file-preview-content');
    previewContent.innerHTML = `<img src="${imageUrl}" alt="Preview" style="max-width: 100%; max-height: 70vh;">`;
    openModal('file-preview-modal');
}

// Initialize the app
console.log("🎉 ZU Chat Application Ready!");