// ============================================
// UNIVERSITY CHAT APPLICATION - COMPLETE WORKING SYSTEM
// ============================================

console.log("🚀 University Chat starting...");

// Global variables
let currentUser = null;
let currentChat = {
    id: 'global',
    type: 'group',
    name: 'Global Chat',
    isGroup: true,
    participants: []
};
let onlineUsers = new Map();
let contacts = new Map();
let groups = new Map();
let chats = new Map();
let unreadCounts = new Map();
let selectedGroupMembers = new Set();
let messageListeners = new Map();
let mediaRecorder = null;
let recordingTimer = null;
let recordingStartTime = null;
let deferredInstallPrompt = null;

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
    signupPassword: document.getElementById('signup-password'),
    signupConfirm: document.getElementById('signup-confirm'),
    
    // User Info
    userName: document.getElementById('user-name'),
    userAvatar: document.getElementById('user-avatar'),
    userStatus: document.getElementById('user-status'),
    
    // Chat UI
    chatTitle: document.getElementById('chat-title'),
    chatStatus: document.getElementById('chat-status'),
    mobileChatTitle: document.getElementById('mobile-chat-title'),
    mobileChatStatus: document.getElementById('mobile-chat-status'),
    chatAvatar: document.getElementById('chat-avatar'),
    
    // Lists
    chatsContainer: document.getElementById('chats-container'),
    contactsContainer: document.getElementById('contacts-container'),
    groupsContainer: document.getElementById('groups-container'),
    usersList: document.getElementById('users-list'),
    groupMembersList: document.getElementById('group-members-list'),
    
    // Messages
    messagesContainer: document.getElementById('messages-container'),
    messages: document.getElementById('messages'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    
    // Modals & Menus
    sidebar: document.getElementById('sidebar'),
    userMenu: document.getElementById('user-menu'),
    overlay: document.getElementById('overlay'),
    newChatModal: document.getElementById('new-chat-modal'),
    createGroupModal: document.getElementById('create-group-modal'),
    chatInfoModal: document.getElementById('chat-info-modal'),
    
    // Media
    audioRecorder: document.getElementById('audio-recorder'),
    recordingTimer: document.getElementById('recording-timer'),
    attachmentMenu: document.getElementById('attachment-menu'),
    emojiPicker: document.getElementById('emoji-picker'),
    
    // Notifications
    notifications: document.getElementById('notifications'),
    onlineCount: document.getElementById('online-count'),
    
    // Install prompt
    installPrompt: document.getElementById('install-prompt')
};

// ============================================
// INITIALIZATION
// ============================================

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, starting app...");
    
    // Hide splash screen after 1.5 seconds
    setTimeout(() => {
        elements.splashScreen.style.display = 'none';
        checkAuthState();
    }, 1500);
    
    // Initialize emoji picker
    initEmojiPicker();
    
    // Setup event listeners
    setupEventListeners();
});

// Check authentication state
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        console.log("🔐 Auth state changed:", user ? user.email : "No user");
        
        if (user) {
            currentUser = user;
            await initializeUser(user);
            showScreen('chat-screen');
            loadInitialData();
            startUserPresence();
        } else {
            currentUser = null;
            showScreen('auth-screen');
        }
    });
}

// Initialize user
async function initializeUser(user) {
    console.log("👤 Initializing user:", user.uid);
    
    // Update UI
    elements.userName.textContent = user.displayName || user.email.split('@')[0];
    elements.userAvatar.textContent = (user.displayName || user.email).charAt(0).toUpperCase();
    
    // Update user document
    await db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '',
        status: 'online',
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

// ============================================
// UI FUNCTIONS
// ============================================

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenName).classList.add('active');
}

function switchAuthTab(tabName) {
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('active', tab.textContent.includes(tabName === 'login' ? 'Login' : 'Sign Up'));
    });
    
    // Update forms
    elements.loginForm.classList.toggle('active', tabName === 'login');
    elements.signupForm.classList.toggle('active', tabName === 'signup');
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function toggleSidebar() {
    elements.sidebar.classList.toggle('active');
    elements.overlay.classList.toggle('active');
}

function toggleUserMenu() {
    elements.userMenu.classList.toggle('active');
    elements.overlay.classList.toggle('active');
}

function closeAllModals() {
    // Close all modals and menus
    elements.sidebar.classList.remove('active');
    elements.userMenu.classList.remove('active');
    elements.overlay.classList.remove('active');
    
    // Close all active modals
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
}

function switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.querySelector('span').textContent.toLowerCase() === tabName);
    });
    
    // Show corresponding section
    document.querySelectorAll('.chats-list, .contacts-list, .groups-list').forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById(`${tabName}-section`).style.display = 'block';
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

async function login() {
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;
    
    if (!email || !password) {
        showNotification('Please enter email and password', 'error');
        return;
    }
    
    try {
        showNotification('Logging in...', 'info');
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log("✅ Logged in:", userCredential.user.email);
        showNotification('Welcome back!', 'success');
    } catch (error) {
        console.error("❌ Login error:", error);
        showNotification(error.message, 'error');
    }
}

async function signup() {
    const name = elements.signupName.value.trim();
    const email = elements.signupEmail.value.trim();
    const password = elements.signupPassword.value;
    const confirmPassword = elements.signupConfirm.value;
    
    if (!name || !email || !password) {
        showNotification('Please fill all fields', 'error');
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
            displayName: name
        });
        
        console.log("✅ Account created:", userCredential.user.uid);
        showNotification('Account created successfully!', 'success');
        
    } catch (error) {
        console.error("❌ Signup error:", error);
        showNotification(error.message, 'error');
    }
}

async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        console.log("✅ Google login successful:", result.user.email);
        showNotification('Signed in with Google!', 'success');
    } catch (error) {
        console.error("❌ Google login error:", error);
        showNotification(error.message, 'error');
    }
}

async function logout() {
    try {
        // Update user status
        if (currentUser) {
            await db.collection('users').doc(currentUser.uid).update({
                status: 'offline',
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Clear all listeners
        messageListeners.forEach(unsubscribe => unsubscribe());
        messageListeners.clear();
        
        // Sign out
        await auth.signOut();
        
        // Clear data
        currentUser = null;
        currentChat = { id: 'global', type: 'group', name: 'Global Chat', isGroup: true, participants: [] };
        onlineUsers.clear();
        contacts.clear();
        groups.clear();
        chats.clear();
        selectedGroupMembers.clear();
        unreadCounts.clear();
        
        showNotification('Logged out successfully', 'success');
        closeAllModals();
        
    } catch (error) {
        console.error("❌ Logout error:", error);
        showNotification(error.message, 'error');
    }
}

// ============================================
// CHAT MANAGEMENT
// ============================================

function loadInitialData() {
    loadOnlineUsers();
    loadContacts();
    loadGroups();
    loadRecentChats();
    loadGlobalChat();
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
        });
}

function loadRecentChats() {
    // Load user's chats
    db.collection('chats')
        .where('participants', 'array-contains', currentUser.uid)
        .orderBy('lastMessageAt', 'desc')
        .limit(20)
        .onSnapshot(snapshot => {
            chats.clear();
            snapshot.forEach(doc => {
                const chat = { id: doc.id, ...doc.data() };
                chats.set(chat.id, chat);
            });
            updateChatsList();
        });
}

function loadGlobalChat() {
    // Switch to global chat
    switchToChat({
        id: 'global',
        type: 'group',
        name: 'Global Chat',
        isGroup: true,
        participants: ['all']
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
    elements.chatAvatar.innerHTML = chat.isGroup ? '<i class="fas fa-users"></i>' : '<i class="fas fa-user"></i>';
    elements.chatStatus.textContent = chat.isGroup ? `Group • ${chat.participants?.length || 0} members` : 'Private chat';
    
    // Clear messages
    elements.messages.innerHTML = '';
    
    // Load messages
    loadMessages(chat);
    
    // Mark as read
    markChatAsRead(chat.id);
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        elements.sidebar.classList.remove('active');
        elements.overlay.classList.remove('active');
    }
}

function loadMessages(chat) {
    let query;
    
    if (chat.id === 'global') {
        query = db.collection('messages')
            .where('chatId', '==', 'global')
            .orderBy('timestamp', 'asc');
    } else if (chat.type === 'private') {
        const chatId = generateChatId(currentUser.uid, chat.participants.find(p => p !== currentUser.uid));
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
        setTimeout(() => {
            elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
        }, 100);
    }, error => {
        console.error("Error loading messages:", error);
    });
    
    messageListeners.set(chat.id, unsubscribe);
}

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
    
    const isCurrentUser = message.senderId === currentUser.uid;
    const timestamp = message.timestamp?.toDate ? 
        formatTime(message.timestamp.toDate()) : 
        formatTime(new Date());
    
    let content = '';
    
    switch (message.type) {
        case 'text':
            content = `
                <div class="message-content">
                    ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
                    <div class="message-text">${message.text}</div>
                    <div class="message-time">${timestamp}</div>
                    ${isCurrentUser ? `<div class="message-actions">
                        <button class="message-action-btn" onclick="editMessage('${message.id}')">Edit</button>
                        <button class="message-action-btn" onclick="deleteMessage('${message.id}')">Delete</button>
                    </div>` : ''}
                </div>
            `;
            break;
            
        case 'image':
            content = `
                <div class="message-content">
                    ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
                    <div class="message-media">
                        <img src="${message.fileUrl}" alt="Image">
                    </div>
                    ${message.caption ? `<div class="message-text">${message.caption}</div>` : ''}
                    <div class="message-time">${timestamp}</div>
                    ${isCurrentUser ? `<div class="message-actions">
                        <button class="message-action-btn" onclick="deleteMessage('${message.id}')">Delete</button>
                    </div>` : ''}
                </div>
            `;
            break;
            
        case 'audio':
            content = `
                <div class="message-content">
                    ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
                    <div class="message-audio" data-url="${message.fileUrl}">
                        <button class="play-btn" onclick="playAudio(this)">
                            <i class="fas fa-play"></i>
                        </button>
                        <div class="audio-progress">
                            <div class="progress-bar"></div>
                        </div>
                        <div class="audio-duration">${formatDuration(message.duration || 0)}</div>
                    </div>
                    <div class="message-time">${timestamp}</div>
                    ${isCurrentUser ? `<div class="message-actions">
                        <button class="message-action-btn" onclick="deleteMessage('${message.id}')">Delete</button>
                    </div>` : ''}
                </div>
            `;
            break;
            
        case 'file':
            content = `
                <div class="message-content">
                    ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
                    <a href="${message.fileUrl}" download class="message-file">
                        <i class="fas fa-file-download"></i>
                        <span>${message.fileName} (${formatFileSize(message.fileSize)})</span>
                    </a>
                    <div class="message-time">${timestamp}</div>
                    ${isCurrentUser ? `<div class="message-actions">
                        <button class="message-action-btn" onclick="deleteMessage('${message.id}')">Delete</button>
                    </div>` : ''}
                </div>
            `;
            break;
    }
    
    messageDiv.innerHTML = content;
    elements.messages.appendChild(messageDiv);
}

// ============================================
// MESSAGING
// ============================================

async function sendMessage() {
    const text = elements.messageInput.value.trim();
    if (!text) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    try {
        const messageData = {
            senderId: currentUser.uid,
            senderName: currentUser.displayName || currentUser.email.split('@')[0],
            text: text,
            type: 'text',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            chatId: currentChat.id,
            status: 'sent'
        };
        
        // Generate chat ID for private chats
        if (currentChat.type === 'private' && currentChat.id !== 'global') {
            const otherUserId = currentChat.participants.find(id => id !== currentUser.uid);
            messageData.chatId = generateChatId(currentUser.uid, otherUserId);
        }
        
        // Add message to Firestore
        await db.collection('messages').add(messageData);
        
        // Update chat's last message
        await updateChatLastMessage(messageData);
        
        // Clear input
        elements.messageInput.value = '';
        elements.sendBtn.classList.remove('active');
        
    } catch (error) {
        console.error("Error sending message:", error);
        showNotification('Failed to send message', 'error');
    }
}

async function updateChatLastMessage(message) {
    if (currentChat.id === 'global') return;
    
    const chatRef = db.collection('chats').doc(currentChat.id);
    
    const lastMessage = {
        text: message.type === 'text' ? message.text : `Sent a ${message.type}`,
        senderId: message.senderId,
        senderName: message.senderName,
        timestamp: message.timestamp,
        type: message.type
    };
    
    await chatRef.set({
        lastMessage: lastMessage,
        lastMessageAt: message.timestamp,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

// ============================================
// ATTACHMENTS
// ============================================

function showAttachmentMenu() {
    elements.attachmentMenu.classList.toggle('active');
}

function attachFile(type) {
    const fileInput = document.getElementById('file-input');
    const imageInput = document.getElementById('image-input');
    
    switch (type) {
        case 'image':
            imageInput.accept = 'image/*';
            imageInput.onchange = handleImageSelect;
            imageInput.click();
            break;
        case 'audio':
            startAudioRecording();
            break;
        case 'file':
            fileInput.accept = '*/*';
            fileInput.onchange = handleFileSelect;
            fileInput.click();
            break;
        case 'camera':
            imageInput.accept = 'image/*';
            imageInput.capture = 'environment';
            imageInput.onchange = handleImageSelect;
            imageInput.click();
            break;
    }
    
    elements.attachmentMenu.classList.remove('active');
}

async function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        showNotification('Uploading image...', 'info');
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            // Create a blob from the file
            const blob = new Blob([file], { type: file.type });
            
            // Upload to Firebase Storage
            const storageRef = storage.ref();
            const fileRef = storageRef.child(`images/${currentUser.uid}/${Date.now()}_${file.name}`);
            await fileRef.put(blob);
            const downloadURL = await fileRef.getDownloadURL();
            
            // Send as message
            await sendMediaMessage('image', downloadURL, file.name, file.size);
            
            showNotification('Image sent', 'success');
        };
        reader.readAsArrayBuffer(file);
        
    } catch (error) {
        console.error("Error uploading image:", error);
        showNotification('Failed to upload image', 'error');
    }
}

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        showNotification('Uploading file...', 'info');
        
        // Upload to Firebase Storage
        const storageRef = storage.ref();
        const fileRef = storage.ref(`files/${currentUser.uid}/${Date.now()}_${file.name}`);
        await fileRef.put(file);
        const downloadURL = await fileRef.getDownloadURL();
        
        // Send as message
        await sendMediaMessage('file', downloadURL, file.name, file.size);
        
        showNotification('File sent', 'success');
        
    } catch (error) {
        console.error("Error uploading file:", error);
        showNotification('Failed to upload file', 'error');
    }
}

async function sendMediaMessage(type, fileUrl, fileName, fileSize) {
    try {
        const messageData = {
            senderId: currentUser.uid,
            senderName: currentUser.displayName || currentUser.email.split('@')[0],
            type: type,
            fileUrl: fileUrl,
            fileName: fileName,
            fileSize: fileSize,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            chatId: currentChat.id,
            status: 'sent'
        };
        
        // Generate chat ID for private chats
        if (currentChat.type === 'private' && currentChat.id !== 'global') {
            const otherUserId = currentChat.participants.find(id => id !== currentUser.uid);
            messageData.chatId = generateChatId(currentUser.uid, otherUserId);
        }
        
        await db.collection('messages').add(messageData);
        await updateChatLastMessage(messageData);
        
    } catch (error) {
        console.error("Error sending media message:", error);
        throw error;
    }
}

// ============================================
// AUDIO RECORDING
// ============================================

async function startAudioRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('Audio recording not supported', 'error');
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];
        
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const duration = (Date.now() - recordingStartTime) / 1000;
            
            // Upload audio
            const storageRef = storage.ref();
            const audioRef = storageRef.child(`audio/${currentUser.uid}/${Date.now()}.webm`);
            await audioRef.put(audioBlob);
            const downloadURL = await audioRef.getDownloadURL();
            
            // Send as message
            await sendMediaMessage('audio', downloadURL, 'audio.webm', audioBlob.size, duration);
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };
        
        // Start recording
        mediaRecorder.start();
        recordingStartTime = Date.now();
        startRecordingTimer();
        
        // Show recorder UI
        elements.audioRecorder.classList.add('active');
        
    } catch (error) {
        console.error("Error starting recording:", error);
        showNotification('Microphone access denied', 'error');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        stopRecordingTimer();
        elements.audioRecorder.classList.remove('active');
    }
}

function cancelRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        stopRecordingTimer();
        elements.audioRecorder.classList.remove('active');
        showNotification('Recording cancelled', 'info');
    }
}

function startRecordingTimer() {
    recordingStartTime = Date.now();
    recordingTimer = setInterval(() => {
        const elapsed = Date.now() - recordingStartTime;
        elements.recordingTimer.textContent = formatDuration(elapsed / 1000);
    }, 1000);
}

function stopRecordingTimer() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
}

function toggleVoiceRecording() {
    if (elements.audioRecorder.classList.contains('active')) {
        stopRecording();
    } else {
        startAudioRecording();
    }
}

// ============================================
// GROUPS MANAGEMENT
// ============================================

function showCreateGroupModal() {
    // Clear previous selections
    selectedGroupMembers.clear();
    
    // Load available users
    const membersList = elements.groupMembersList;
    membersList.innerHTML = '';
    
    contacts.forEach(user => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        memberItem.innerHTML = `
            <input type="checkbox" id="member-${user.uid}" onchange="toggleGroupMember('${user.uid}')">
            <div class="contact-avatar">${user.displayName.charAt(0)}</div>
            <div class="contact-info">
                <div class="contact-name">${user.displayName}</div>
                <div class="contact-status">${user.status || 'offline'}</div>
            </div>
        `;
        membersList.appendChild(memberItem);
    });
    
    elements.createGroupModal.classList.add('active');
    elements.overlay.classList.add('active');
}

function toggleGroupMember(userId) {
    const checkbox = document.getElementById(`member-${userId}`);
    if (checkbox.checked) {
        selectedGroupMembers.add(userId);
    } else {
        selectedGroupMembers.delete(userId);
    }
}

async function createGroup() {
    const name = document.getElementById('group-name').value.trim();
    const description = document.getElementById('group-description').value.trim();
    
    if (!name) {
        showNotification('Please enter group name', 'error');
        return;
    }
    
    if (selectedGroupMembers.size === 0) {
        showNotification('Please select at least one member', 'error');
        return;
    }
    
    try {
        // Add current user to members
        const members = Array.from(selectedGroupMembers);
        members.push(currentUser.uid);
        
        // Create group
        const groupData = {
            name: name,
            description: description,
            createdBy: currentUser.uid,
            creatorName: currentUser.displayName,
            members: members,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            admins: [currentUser.uid]
        };
        
        const groupRef = await db.collection('groups').add(groupData);
        
        // Create chat for group
        await db.collection('chats').doc(groupRef.id).set({
            id: groupRef.id,
            name: name,
            type: 'group',
            isGroup: true,
            participants: members,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Add system message
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
        closeModal('create-group-modal');
        
        // Switch to the new group
        switchToChat({
            id: groupRef.id,
            type: 'group',
            name: name,
            isGroup: true,
            participants: members
        });
        
    } catch (error) {
        console.error("Error creating group:", error);
        showNotification('Failed to create group', 'error');
    }
}

// ============================================
// CHAT FUNCTIONS
// ============================================

function startNewChat() {
    // Load available users
    const usersList = elements.usersList;
    usersList.innerHTML = '';
    
    contacts.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'member-item';
        userItem.innerHTML = `
            <div class="contact-avatar">${user.displayName.charAt(0)}</div>
            <div class="contact-info">
                <div class="contact-name">${user.displayName}</div>
                <div class="contact-status">${user.status || 'offline'}</div>
            </div>
        `;
        
        userItem.addEventListener('click', () => {
            startPrivateChat(user.uid, user.displayName);
        });
        
        usersList.appendChild(userItem);
    });
    
    elements.newChatModal.classList.add('active');
    elements.overlay.classList.add('active');
}

function startPrivateChat(userId, userName) {
    // Generate chat ID
    const chatId = generateChatId(currentUser.uid, userId);
    
    // Create chat if it doesn't exist
    db.collection('chats').doc(chatId).set({
        id: chatId,
        type: 'private',
        isGroup: false,
        participants: [currentUser.uid, userId],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Switch to chat
    switchToChat({
        id: chatId,
        type: 'private',
        name: userName,
        isGroup: false,
        participants: [currentUser.uid, userId]
    });
    
    closeModal('new-chat-modal');
}

function showChatInfo() {
    const details = document.getElementById('chat-info-details');
    const actions = document.getElementById('chat-actions-list');
    
    if (currentChat.id === 'global') {
        details.innerHTML = `
            <h4>Global Chat</h4>
            <p>Public chat room for all users</p>
            <p><strong>Participants:</strong> Everyone</p>
        `;
        
        actions.innerHTML = `
            <button class="chat-action-item" onclick="clearChat()">
                <i class="fas fa-trash"></i>
                <span>Clear Chat</span>
            </button>
        `;
    } else if (currentChat.isGroup) {
        const group = groups.get(currentChat.id);
        details.innerHTML = `
            <h4>${currentChat.name}</h4>
            <p>${group?.description || 'No description'}</p>
            <p><strong>Created by:</strong> ${group?.creatorName || 'Unknown'}</p>
            <p><strong>Members:</strong> ${currentChat.participants?.length || 0}</p>
        `;
        
        actions.innerHTML = `
            <button class="chat-action-item" onclick="showGroupMembers()">
                <i class="fas fa-users"></i>
                <span>View Members</span>
            </button>
            <button class="chat-action-item" onclick="addGroupMember()">
                <i class="fas fa-user-plus"></i>
                <span>Add Member</span>
            </button>
            ${group?.admins?.includes(currentUser.uid) ? `
                <button class="chat-action-item" onclick="editGroup()">
                    <i class="fas fa-edit"></i>
                    <span>Edit Group</span>
                </button>
            ` : ''}
            <button class="chat-action-item danger" onclick="leaveGroup()">
                <i class="fas fa-sign-out-alt"></i>
                <span>Leave Group</span>
            </button>
            ${group?.createdBy === currentUser.uid ? `
                <button class="chat-action-item danger" onclick="deleteGroup()">
                    <i class="fas fa-trash"></i>
                    <span>Delete Group</span>
                </button>
            ` : ''}
        `;
    } else {
        details.innerHTML = `
            <h4>${currentChat.name}</h4>
            <p>Private conversation</p>
        `;
        
        actions.innerHTML = `
            <button class="chat-action-item danger" onclick="clearChat()">
                <i class="fas fa-trash"></i>
                <span>Clear Chat</span>
            </button>
            <button class="chat-action-item danger" onclick="deleteChat()">
                <i class="fas fa-trash-alt"></i>
                <span>Delete Chat</span>
            </button>
        `;
    }
    
    elements.chatInfoModal.classList.add('active');
    elements.overlay.classList.add('active');
}

// ============================================
// MESSAGE MANAGEMENT
// ============================================

async function editMessage(messageId) {
    const newText = prompt('Edit your message:');
    if (newText && newText.trim()) {
        try {
            await db.collection('messages').doc(messageId).update({
                text: newText.trim(),
                edited: true,
                editedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showNotification('Message updated', 'success');
        } catch (error) {
            console.error("Error editing message:", error);
            showNotification('Failed to edit message', 'error');
        }
    }
}

async function deleteMessage(messageId) {
    if (confirm('Are you sure you want to delete this message?')) {
        try {
            await db.collection('messages').doc(messageId).delete();
            showNotification('Message deleted', 'success');
        } catch (error) {
            console.error("Error deleting message:", error);
            showNotification('Failed to delete message', 'error');
        }
    }
}

async function clearChat() {
    if (confirm('Are you sure you want to clear all messages in this chat?')) {
        try {
            // Delete all messages in this chat
            const messagesSnapshot = await db.collection('messages')
                .where('chatId', '==', currentChat.id)
                .get();
            
            const batch = db.batch();
            messagesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            
            showNotification('Chat cleared', 'success');
        } catch (error) {
            console.error("Error clearing chat:", error);
            showNotification('Failed to clear chat', 'error');
        }
    }
}

async function leaveGroup() {
    if (confirm('Are you sure you want to leave this group?')) {
        try {
            const groupRef = db.collection('groups').doc(currentChat.id);
            const group = await groupRef.get();
            
            if (group.exists) {
                const members = group.data().members || [];
                const updatedMembers = members.filter(member => member !== currentUser.uid);
                
                await groupRef.update({
                    members: updatedMembers
                });
                
                // Add system message
                await db.collection('messages').add({
                    senderId: 'system',
                    senderName: 'System',
                    text: `${currentUser.displayName} left the group`,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    chatId: currentChat.id,
                    type: 'system'
                });
                
                // Switch to global chat
                loadGlobalChat();
                
                showNotification('You left the group', 'success');
            }
        } catch (error) {
            console.error("Error leaving group:", error);
            showNotification('Failed to leave group', 'error');
        }
    }
}

async function deleteGroup() {
    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
        try {
            // Delete group
            await db.collection('groups').doc(currentChat.id).delete();
            
            // Delete chat
            await db.collection('chats').doc(currentChat.id).delete();
            
            // Delete all messages
            const messagesSnapshot = await db.collection('messages')
                .where('chatId', '==', currentChat.id)
                .get();
            
            const batch = db.batch();
            messagesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            
            // Switch to global chat
            loadGlobalChat();
            
            showNotification('Group deleted', 'success');
        } catch (error) {
            console.error("Error deleting group:", error);
            showNotification('Failed to delete group', 'error');
        }
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateChatId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
}

function formatTime(date) {
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

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                            type === 'error' ? 'exclamation-circle' : 
                            type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    elements.notifications.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function updateOnlineCount() {
    elements.onlineCount.textContent = onlineUsers.size;
    elements.mobileChatStatus.textContent = `Online: ${onlineUsers.size}`;
}

function updateContactsList() {
    const container = elements.contactsContainer;
    container.innerHTML = '';
    
    contacts.forEach(user => {
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        contactItem.innerHTML = `
            <div class="contact-avatar">${user.displayName.charAt(0)}</div>
            <div class="contact-info">
                <div class="contact-name">${user.displayName}</div>
                <div class="contact-status">${user.status || 'offline'}</div>
            </div>
        `;
        
        contactItem.addEventListener('click', () => {
            startPrivateChat(user.uid, user.displayName);
        });
        
        container.appendChild(contactItem);
    });
}

function updateGroupsList() {
    const container = elements.groupsContainer;
    container.innerHTML = '';
    
    groups.forEach(group => {
        const groupItem = document.createElement('div');
        groupItem.className = 'group-item';
        groupItem.innerHTML = `
            <div class="group-avatar">
                <i class="fas fa-users"></i>
            </div>
            <div class="group-info">
                <div class="group-name">${group.name}</div>
                <div class="group-members">${group.members?.length || 0} members</div>
            </div>
        `;
        
        groupItem.addEventListener('click', () => {
            switchToChat({
                id: group.id,
                type: 'group',
                name: group.name,
                isGroup: true,
                participants: group.members || []
            });
        });
        
        container.appendChild(groupItem);
    });
}

function updateChatsList() {
    const container = elements.chatsContainer;
    container.innerHTML = '';
    
    // Add global chat
    const globalItem = document.createElement('div');
    globalItem.className = `chat-item ${currentChat.id === 'global' ? 'active' : ''}`;
    globalItem.innerHTML = `
        <div class="chat-avatar">
            <i class="fas fa-globe"></i>
        </div>
        <div class="chat-info">
            <div class="chat-name">Global Chat</div>
            <div class="last-message">Everyone can join</div>
        </div>
    `;
    
    globalItem.addEventListener('click', () => {
        loadGlobalChat();
    });
    
    container.appendChild(globalItem);
    
    // Add other chats
    chats.forEach(chat => {
        if (chat.id === 'global') return;
        
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${currentChat.id === chat.id ? 'active' : ''}`;
        chatItem.innerHTML = `
            <div class="chat-avatar">
                <i class="fas fa-${chat.isGroup ? 'users' : 'user'}"></i>
            </div>
            <div class="chat-info">
                <div class="chat-name">${chat.name || 'Chat'}</div>
                <div class="last-message">${chat.lastMessage?.text || 'No messages yet'}</div>
            </div>
            <div class="chat-time">${chat.lastMessage ? formatTime(chat.lastMessage.timestamp?.toDate()) : ''}</div>
        `;
        
        chatItem.addEventListener('click', () => {
            switchToChat(chat);
        });
        
        container.appendChild(chatItem);
    });
}

function markChatAsRead(chatId) {
    unreadCounts.delete(chatId);
    updateUnreadBadges();
}

function updateUnreadBadges() {
    const totalUnread = Array.from(unreadCounts.values()).reduce((a, b) => a + b, 0);
    document.title = totalUnread > 0 ? `(${totalUnread}) University Chat` : 'University Chat';
}

function initEmojiPicker() {
    const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];
    
    const picker = elements.emojiPicker;
    emojis.forEach(emoji => {
        const button = document.createElement('button');
        button.className = 'emoji-item';
        button.textContent = emoji;
        button.onclick = () => {
            elements.messageInput.value += emoji;
            elements.messageInput.focus();
            picker.classList.remove('active');
        };
        picker.appendChild(button);
    });
}

function toggleEmojiPicker() {
    elements.emojiPicker.classList.toggle('active');
}

function searchChats() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const chatItems = document.querySelectorAll('.chat-item, .contact-item, .group-item');
    
    chatItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
    });
}

function searchUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const userItems = document.querySelectorAll('#users-list .member-item');
    
    userItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
    });
}

function playAudio(button) {
    const audioPlayer = button.closest('.message-audio');
    const audioUrl = audioPlayer.dataset.url;
    const progressBar = audioPlayer.querySelector('.progress-bar');
    
    const audio = new Audio(audioUrl);
    
    audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${progress}%`;
    });
    
    audio.addEventListener('ended', () => {
        button.innerHTML = '<i class="fas fa-play"></i>';
        progressBar.style.width = '0%';
    });
    
    if (audio.paused) {
        audio.play();
        button.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        audio.pause();
        button.innerHTML = '<i class="fas fa-play"></i>';
    }
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
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    elements.overlay.classList.remove('active');
}

// Setup event listeners
function setupEventListeners() {
    // Message input
    elements.messageInput.addEventListener('input', function() {
        elements.sendBtn.classList.toggle('active', this.value.trim().length > 0);
    });
    
    // Close modals on overlay click
    elements.overlay.addEventListener('click', closeAllModals);
    
    // Close modals on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Handle message input enter key
    elements.messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// ============================================
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ============================================

// Export all functions that are called from HTML onclick attributes
window.switchAuthTab = switchAuthTab;
window.togglePassword = togglePassword;
window.login = login;
window.signup = signup;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.toggleSidebar = toggleSidebar;
window.toggleUserMenu = toggleUserMenu;
window.closeAllModals = closeAllModals;
window.switchTab = switchTab;
window.showAttachmentMenu = showAttachmentMenu;
window.attachFile = attachFile;
window.toggleVoiceRecording = toggleVoiceRecording;
window.stopRecording = stopRecording;
window.cancelRecording = cancelRecording;
window.sendMessage = sendMessage;
window.startNewChat = startNewChat;
window.showCreateGroupModal = showCreateGroupModal;
window.toggleGroupMember = toggleGroupMember;
window.createGroup = createGroup;
window.showChatInfo = showChatInfo;
window.editMessage = editMessage;
window.deleteMessage = deleteMessage;
window.clearChat = clearChat;
window.leaveGroup = leaveGroup;
window.deleteGroup = deleteGroup;
window.closeModal = closeModal;
window.toggleEmojiPicker = toggleEmojiPicker;
window.searchChats = searchChats;
window.searchUsers = searchUsers;
window.playAudio = playAudio;

console.log("🎉 University Chat App ready!");