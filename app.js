// ============================================
// MODERN CHAT APPLICATION - FIXED VERSION
// ============================================

console.log("🚀 Modern Chat App starting...");

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
let mediaCache = new Map();
let messageListeners = new Map();
let audioRecorder = null;
let recordingTimer = null;
let recordingStartTime = null;
let selectedMediaFile = null;
let selectedUsersForGroup = new Set();

// DOM Elements
const elements = {
    splashScreen: document.getElementById('splash-screen'),
    authScreen: document.getElementById('auth-screen'),
    chatScreen: document.getElementById('chat-screen'),
    
    // Auth elements
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    signupName: document.getElementById('signup-name'),
    signupEmail: document.getElementById('signup-email'),
    signupPassword: document.getElementById('signup-password'),
    signupConfirmPassword: document.getElementById('signup-confirm-password'),
    loginBtn: document.getElementById('login-btn'),
    signupBtn: document.getElementById('signup-btn'),
    googleLoginBtn: document.getElementById('google-login-btn'),
    
    // Chat elements
    sidebar: document.getElementById('sidebar'),
    messagesContainer: document.getElementById('messages-container'),
    messages: document.getElementById('messages'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    attachmentToggle: document.getElementById('attachment-toggle'),
    attachmentMenu: document.getElementById('attachment-menu'),
    audioRecorderElement: document.getElementById('audio-recorder'),
    voiceToggle: document.getElementById('voice-toggle'),
    
    // User interface
    userName: document.getElementById('user-name'),
    userAvatar: document.getElementById('user-avatar'),
    chatTitle: document.getElementById('chat-title'),
    chatInfo: document.getElementById('chat-info'),
    mobileChatTitle: document.getElementById('mobile-chat-title'),
    mobileChatInfo: document.getElementById('mobile-chat-info'),
    onlineCount: document.getElementById('online-count'),
    
    // Lists
    chatsList: document.getElementById('chats-list'),
    contactsList: document.getElementById('contacts-list'),
    groupsList: document.getElementById('groups-list'),
    
    // Modals
    createGroupModal: document.getElementById('create-group-modal'),
    
    // Buttons
    logoutBtn: document.getElementById('logout-btn'),
    menuToggle: document.getElementById('menu-toggle'),
    closeSidebar: document.getElementById('close-sidebar'),
    newChatBtn: document.getElementById('new-chat-btn'),
    createGroupSidebarBtn: document.getElementById('create-group-sidebar-btn'),
    createGroupSubmit: document.getElementById('create-group-submit'),
    
    // Other
    overlay: document.getElementById('overlay')
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
    
    // Setup all event listeners
    setupEventListeners();
    
    console.log("✅ App initialization complete");
});

function setupEventListeners() {
    console.log("🔗 Setting up event listeners...");
    
    // Auth form toggles
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
    
    // Enter key for auth forms
    [elements.loginEmail, elements.loginPassword].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    });
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const view = this.dataset.view;
            switchSidebarView(view);
        });
    });
    
    // Mobile menu
    elements.menuToggle.addEventListener('click', toggleSidebar);
    elements.closeSidebar.addEventListener('click', toggleSidebar);
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
    elements.voiceToggle.addEventListener('click', toggleVoiceRecording);
    
    // Audio recorder
    document.getElementById('cancel-recording')?.addEventListener('click', cancelRecording);
    document.getElementById('stop-recording')?.addEventListener('click', stopRecording);
    
    // Modal controls
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
            elements.overlay.classList.remove('active');
        });
    });
    
    // New chat
    elements.newChatBtn.addEventListener('click', () => {
        openNewChatModal();
    });
    
    // Create group
    elements.createGroupSidebarBtn.addEventListener('click', () => {
        openCreateGroupModal();
    });
    
    elements.createGroupSubmit.addEventListener('click', createGroup);
    
    // Close modals on overlay click
    elements.overlay.addEventListener('click', () => {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        elements.overlay.classList.remove('active');
    });
    
    console.log("✅ Event listeners setup complete");
}

// ============================================
// AUTHENTICATION - FIXED
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
        showNotification('Invalid email', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        showNotification('Logging in...', 'info');
        await auth.signInWithEmailAndPassword(email, password);
        console.log("✅ Logged in:", email);
        showNotification('Login successful!', 'success');
    } catch (error) {
        console.error("❌ Login error:", error);
        showNotification(error.message, 'error');
    }
}

async function handleSignup() {
    const name = elements.signupName.value.trim();
    const email = elements.signupEmail.value.trim();
    const password = elements.signupPassword.value;
    const confirmPassword = elements.signupConfirmPassword.value;
    
    if (!name) {
        showNotification('Please enter your name', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Invalid email', 'error');
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
        
        // Update profile with name
        await userCredential.user.updateProfile({
            displayName: name,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff`
        });
        
        // Create user document in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            uid: userCredential.user.uid,
            email: email,
            displayName: name,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'online'
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
        
        showNotification('Signing in with Google...', 'info');
        const result = await auth.signInWithPopup(provider);
        
        // Create/update user document
        const user = result.user;
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'online'
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
        currentChat = { id: 'global', type: 'group', name: 'Global Chat', participants: [] };
        onlineUsers.clear();
        contacts.clear();
        groups.clear();
        mediaCache.clear();
        selectedUsersForGroup.clear();
        
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
    
    // Set avatar
    const avatar = elements.userAvatar;
    if (user.photoURL) {
        avatar.style.backgroundImage = `url(${user.photoURL})`;
        avatar.style.backgroundSize = 'cover';
        avatar.innerHTML = '';
    } else {
        avatar.innerHTML = `<i class="fas fa-user"></i>`;
        avatar.style.background = 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)';
    }
    
    // Update user document
    await db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=667eea&color=fff`,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'online',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

function startUserPresence() {
    if (!currentUser) return;
    
    const userRef = db.collection('users').doc(currentUser.uid);
    
    // Set online status
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
    
    // Event listeners for presence
    window.addEventListener('beforeunload', handleDisconnect);
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

function loadInitialData() {
    loadOnlineUsers();
    loadContacts();
    loadGroups();
    loadRecentChats();
    switchToGlobalChat();
}

async function loadOnlineUsers() {
    try {
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
            });
    } catch (error) {
        console.error("Error loading online users:", error);
    }
}

async function loadContacts() {
    try {
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
    } catch (error) {
        console.error("Error loading contacts:", error);
    }
}

async function loadGroups() {
    try {
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
    } catch (error) {
        console.error("Error loading groups:", error);
    }
}

async function loadRecentChats() {
    // This is a simplified version - you can expand it later
    updateChatsList([]);
}

function switchToGlobalChat() {
    switchToChat({
        id: 'global',
        type: 'group',
        name: 'Global Chat',
        participants: ['all']
    });
}

function switchToChat(chat) {
    console.log("🔄 Switching to chat:", chat);
    
    // Stop previous listener
    if (messageListeners.has(currentChat.id)) {
        messageListeners.get(currentChat.id)();
    }
    
    // Update current chat
    currentChat = chat;
    
    // Update UI
    elements.chatTitle.textContent = chat.name;
    elements.mobileChatTitle.textContent = chat.name;
    
    // Clear messages
    elements.messages.innerHTML = '';
    
    // Load messages for this chat
    loadChatMessages(chat);
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        elements.sidebar.classList.remove('active');
    }
}

// FIXED: Message loading with proper chat ID generation
async function loadChatMessages(chat) {
    let query;
    
    console.log("📨 Loading messages for chat:", chat);
    
    if (chat.type === 'private') {
        // FIXED: Generate consistent chat ID for private chats
        const chatId = generateChatId(currentUser.uid, chat.id);
        console.log("Private chat ID generated:", chatId);
        
        query = db.collection('messages')
            .where('chatId', '==', chatId)
            .orderBy('timestamp', 'asc');
    } else {
        // For group chats
        query = db.collection('messages')
            .where('chatId', '==', chat.id)
            .orderBy('timestamp', 'asc');
    }
    
    try {
        const unsubscribe = query.onSnapshot(
            snapshot => {
                console.log("📩 New messages received:", snapshot.size);
                
                // Process each message
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const message = change.doc.data();
                        console.log("Message added:", message);
                        displayMessage(message);
                    }
                });
                
                // Scroll to bottom
                setTimeout(() => {
                    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
                }, 100);
            },
            error => {
                console.error("❌ Error loading messages:", error);
                showNotification('Error loading messages', 'error');
            }
        );
        
        messageListeners.set(chat.id, unsubscribe);
        
    } catch (error) {
        console.error("❌ Error setting up message listener:", error);
    }
}

// FIXED: Message display with immediate feedback
function displayMessage(message) {
    const messageDiv = document.createElement('div');
    const isCurrentUser = message.senderId === currentUser.uid;
    messageDiv.className = `message ${isCurrentUser ? 'sent' : 'received'}`;
    
    const timestamp = message.timestamp?.toDate ? 
        formatTime(message.timestamp.toDate()) : 
        'Just now';
    
    let contentHtml = '';
    
    switch (message.type) {
        case 'text':
            contentHtml = `
                <div class="message-content">
                    ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
                    <div class="message-text">${message.text}</div>
                    <div class="message-time">${timestamp}</div>
                </div>
            `;
            break;
            
        case 'image':
            contentHtml = `
                <div class="message-content">
                    ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
                    <div class="message-media">
                        <img src="${message.fileUrl}" alt="Shared image" loading="lazy">
                    </div>
                    ${message.caption ? `<div class="message-text">${message.caption}</div>` : ''}
                    <div class="message-time">${timestamp}</div>
                </div>
            `;
            break;
            
        case 'audio':
            contentHtml = `
                <div class="message-content">
                    ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
                    <div class="message-audio">
                        <audio controls>
                            <source src="${message.fileUrl}" type="audio/webm">
                            Your browser does not support audio element.
                        </audio>
                    </div>
                    <div class="message-time">${timestamp}</div>
                </div>
            `;
            break;
            
        case 'file':
            contentHtml = `
                <div class="message-content">
                    ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
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
                    <div class="message-time">${timestamp}</div>
                </div>
            `;
            break;
            
        default:
            contentHtml = `
                <div class="message-content">
                    ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
                    <div class="message-text">${message.text || 'Unsupported message type'}</div>
                    <div class="message-time">${timestamp}</div>
                </div>
            `;
    }
    
    messageDiv.innerHTML = contentHtml;
    elements.messages.appendChild(messageDiv);
    
    // Add animation
    messageDiv.style.animation = 'slideIn 0.3s ease';
}

// ============================================
// MESSAGING - FIXED
// ============================================

async function sendMessage() {
    const text = elements.messageInput.value.trim();
    if (!text && !selectedMediaFile) {
        showNotification('Please enter a message', 'error');
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
        
        // Determine chat ID based on chat type
        if (currentChat.type === 'private') {
            // FIXED: Use consistent chat ID for private chats
            messageData.chatId = generateChatId(currentUser.uid, currentChat.id);
            messageData.receiverId = currentChat.id;
        } else {
            messageData.chatId = currentChat.id;
        }
        
        messageData.chatType = currentChat.type;
        
        // Handle media upload if present
        if (selectedMediaFile) {
            const fileUrl = await uploadFile(selectedMediaFile.file, selectedMediaFile.type);
            messageData = {
                ...messageData,
                type: selectedMediaFile.type,
                fileUrl: fileUrl,
                fileName: selectedMediaFile.file.name,
                fileSize: selectedMediaFile.file.size,
                caption: text || ''
            };
            selectedMediaFile = null;
        }
        
        console.log("💾 Saving message:", messageData);
        
        // Save message to Firestore
        const docRef = await db.collection('messages').add(messageData);
        console.log("✅ Message saved with ID:", docRef.id);
        
        // Immediately display the message for sender
        displayMessage(messageData);
        
        // Clear input
        elements.messageInput.value = '';
        elements.messageInput.focus();
        elements.sendBtn.classList.remove('active');
        
        // Scroll to bottom
        setTimeout(() => {
            elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
        }, 100);
        
    } catch (error) {
        console.error("❌ Error sending message:", error);
        showNotification('Failed to send message: ' + error.message, 'error');
    }
}

async function uploadFile(file, type) {
    return new Promise((resolve, reject) => {
        const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const filePath = `uploads/${currentUser.uid}/${type}s/${fileId}_${file.name}`;
        const uploadTask = storage.ref(filePath).put(file);
        
        uploadTask.on('state_changed',
            null,
            (error) => {
                reject(error);
            },
            async () => {
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                resolve(downloadURL);
            }
        );
    });
}

// FIXED: Generate consistent chat ID for private messages
function generateChatId(userId1, userId2) {
    // Sort IDs to ensure consistency
    const sortedIds = [userId1, userId2].sort();
    return `private_${sortedIds[0]}_${sortedIds[1]}`;
}

// ============================================
// GROUP MANAGEMENT - FIXED
// ============================================

function openCreateGroupModal() {
    // Load available users
    const membersList = document.getElementById('available-members');
    membersList.innerHTML = '';
    
    selectedUsersForGroup.clear();
    document.getElementById('selected-members').innerHTML = '';
    
    contacts.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'contact-item';
        userItem.innerHTML = `
            <input type="checkbox" id="user-${user.uid}" value="${user.uid}" class="user-checkbox">
            <div class="item-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="item-info">
                <div class="item-name">${user.displayName}</div>
                <div class="item-status">${user.status || 'offline'}</div>
            </div>
        `;
        
        const checkbox = userItem.querySelector('.user-checkbox');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedUsersForGroup.add(user.uid);
                addSelectedMember(user);
            } else {
                selectedUsersForGroup.delete(user.uid);
                removeSelectedMember(user.uid);
            }
        });
        
        membersList.appendChild(userItem);
    });
    
    elements.createGroupModal.classList.add('active');
    elements.overlay.classList.add('active');
}

function addSelectedMember(user) {
    const selectedDiv = document.getElementById('selected-members');
    const memberTag = document.createElement('div');
    memberTag.className = 'member-tag';
    memberTag.innerHTML = `
        <span>${user.displayName}</span>
        <button type="button" data-uid="${user.uid}">&times;</button>
    `;
    
    memberTag.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = e.target.dataset.uid;
        selectedUsersForGroup.delete(uid);
        document.getElementById(`user-${uid}`).checked = false;
        memberTag.remove();
    });
    
    selectedDiv.appendChild(memberTag);
}

function removeSelectedMember(uid) {
    const tag = document.querySelector(`.member-tag button[data-uid="${uid}"]`)?.parentElement;
    if (tag) tag.remove();
}

// FIXED: Group creation function
async function createGroup() {
    const name = document.getElementById('group-name').value.trim();
    const description = document.getElementById('group-description').value.trim();
    
    if (!name) {
        showNotification('Please enter a group name', 'error');
        return;
    }
    
    if (selectedUsersForGroup.size === 0) {
        showNotification('Please select at least one member', 'error');
        return;
    }
    
    try {
        // Add current user to members
        const members = Array.from(selectedUsersForGroup);
        members.push(currentUser.uid);
        
        // Create group document
        const groupData = {
            name: name,
            description: description || '',
            createdBy: currentUser.uid,
            creatorName: currentUser.displayName || currentUser.email.split('@')[0],
            members: members,
            memberCount: members.length,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'group',
            chatId: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        console.log("💾 Creating group:", groupData);
        
        // Save group to Firestore
        const groupRef = await db.collection('groups').add(groupData);
        const groupId = groupRef.id;
        console.log("✅ Group created with ID:", groupId);
        
        // Update group data with its ID as chatId
        await groupRef.update({
            chatId: groupId
        });
        
        // Add initial welcome message
        const welcomeMessage = {
            senderId: 'system',
            senderName: 'System',
            text: `${currentUser.displayName || currentUser.email.split('@')[0]} created the group "${name}"`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            chatId: groupId,
            chatType: 'group',
            type: 'system'
        };
        
        await db.collection('messages').add(welcomeMessage);
        
        showNotification(`Group "${name}" created successfully!`, 'success');
        
        // Close modal
        elements.createGroupModal.classList.remove('active');
        elements.overlay.classList.remove('active');
        
        // Clear form
        document.getElementById('group-name').value = '';
        document.getElementById('group-description').value = '';
        selectedUsersForGroup.clear();
        document.getElementById('selected-members').innerHTML = '';
        
        // Switch to the new group
        switchToChat({
            id: groupId,
            type: 'group',
            name: name,
            participants: members
        });
        
    } catch (error) {
        console.error("❌ Error creating group:", error);
        showNotification('Failed to create group: ' + error.message, 'error');
    }
}

// ============================================
// PRIVATE CHATS - FIXED
// ============================================

function openNewChatModal() {
    // This is a simplified version - you can expand it
    showNotification('New chat feature coming soon', 'info');
}

function startPrivateChat(userId, userName) {
    // Create chat object for private conversation
    const chat = {
        id: userId, // The other user's ID
        type: 'private',
        name: userName,
        participants: [currentUser.uid, userId]
    };
    
    switchToChat(chat);
}

// ============================================
// ATTACHMENTS & MEDIA
// ============================================

function toggleAttachmentMenu() {
    elements.attachmentMenu.classList.toggle('active');
}

function toggleVoiceRecording() {
    if (elements.voiceToggle.classList.contains('active')) {
        stopRecording();
    } else {
        startAudioRecording();
    }
}

function handleMessageInput() {
    const hasText = elements.messageInput.value.trim().length > 0;
    elements.sendBtn.classList.toggle('active', hasText);
}

function startAudioRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('Audio recording not supported', 'error');
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
                
                // Create a file from blob
                const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
                    type: 'audio/webm'
                });
                
                selectedMediaFile = { file: audioFile, type: 'audio' };
                await sendMessage();
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            // Start recording
            audioRecorder.start();
            recordingStartTime = Date.now();
            startRecordingTimer();
            
            // Show recorder UI
            elements.audioRecorderElement.classList.add('active');
            elements.voiceToggle.classList.add('active');
            
        })
        .catch(error => {
            console.error("Error accessing microphone:", error);
            showNotification('Microphone access denied', 'error');
        });
}

function stopRecording() {
    if (audioRecorder && audioRecorder.state !== 'inactive') {
        audioRecorder.stop();
        stopRecordingTimer();
        elements.audioRecorderElement.classList.remove('active');
        elements.voiceToggle.classList.remove('active');
    }
}

function cancelRecording() {
    if (audioRecorder && audioRecorder.state !== 'inactive') {
        audioRecorder.stop();
        stopRecordingTimer();
        elements.audioRecorderElement.classList.remove('active');
        elements.voiceToggle.classList.remove('active');
        showNotification('Recording cancelled', 'info');
    }
}

function startRecordingTimer() {
    recordingStartTime = Date.now();
    recordingTimer = setInterval(() => {
        const elapsed = Date.now() - recordingStartTime;
        document.getElementById('recording-timer').textContent = 
            formatDuration(elapsed / 1000);
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

function closeAllMenus() {
    elements.sidebar.classList.remove('active');
    elements.overlay.classList.remove('active');
}

function switchSidebarView(view) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });
    
    // Show corresponding section
    document.querySelectorAll('.sidebar-section').forEach(section => {
        section.classList.toggle('active', section.id === `${view}-section`);
    });
}

function showNotification(title, type = 'info', message = '') {
    // Create simple notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            ${message ? `<div class="notification-message">${message}</div>` : ''}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Export for Firebase config
window.showAppNotification = showNotification;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
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

function updateOnlineCount() {
    const count = onlineUsers.size;
    elements.onlineCount.textContent = `${count} online`;
    elements.mobileChatInfo.textContent = `${count} online`;
}

function updateContactsList() {
    if (!elements.contactsList) return;
    
    elements.contactsList.innerHTML = '';
    contacts.forEach(user => {
        const contactItem = createContactItem(user);
        elements.contactsList.appendChild(contactItem);
    });
}

function updateGroupsList() {
    if (!elements.groupsList) return;
    
    elements.groupsList.innerHTML = '';
    groups.forEach(group => {
        const groupItem = createGroupItem(group);
        elements.groupsList.appendChild(groupItem);
    });
}

function updateChatsList(chats) {
    if (!elements.chatsList) return;
    
    elements.chatsList.innerHTML = '';
    
    // Always show global chat
    const globalChat = {
        id: 'global',
        type: 'group',
        name: 'Global Chat'
    };
    const globalItem = createChatItem(globalChat);
    elements.chatsList.appendChild(globalItem);
    
    // Show other chats
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
            <div class="item-status">${user.status || 'offline'}</div>
        </div>
    `;
    
    div.addEventListener('click', () => {
        startPrivateChat(user.uid, user.displayName);
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
            <div class="item-last-message">${group.memberCount || group.members?.length || 0} members</div>
        </div>
    `;
    
    div.addEventListener('click', () => {
        switchToChat({
            id: group.id,
            type: 'group',
            name: group.name,
            participants: group.members
        });
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
            <div class="item-last-message">${chat.type === 'group' ? 'Group chat' : 'Private chat'}</div>
        </div>
    `;
    
    div.addEventListener('click', () => {
        switchToChat(chat);
    });
    
    return div;
}

// Initialize app
console.log("🎉 Modern Chat App ready!");