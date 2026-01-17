// ============================
// FIREBASE INITIALIZATION CHECK
// ============================

console.log("🔥 App.js loading...");

// Wait for DOM AND Firebase to be ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log("✅ DOM loaded");
    
    // Check if Firebase is initialized
    if (!firebase.apps.length) {
        console.error("❌ Firebase not initialized! Initializing now...");
        try {
            // Firebase should already be initialized from index.html
            // If not, initialize it here
            const app = firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase initialized in app.js");
        } catch (error) {
            console.error("❌ Failed to initialize Firebase:", error);
            alert("Firebase initialization failed. Please check console.");
            return;
        }
    }
    
    // Now continue with the rest of your code...
    // [ALL YOUR EXISTING CODE GOES HERE]
    
    // Move everything from your current app.js INSIDE this function
    // Keep all your existing code, just make sure it's inside this DOMContentLoaded event
    
});// ============================
// MAIN APPLICATION
// ============================

// Global variables (accessible everywhere)
let currentUser = null;
let currentChat = null;
let contacts = [];
let groups = [];
let selectedContacts = [];
let selectedFile = null;

// DOM Elements (will be set when page loads)
let authScreen, appScreen, userEmailElement, authButton;

// Wait for DOM to load completely
document.addEventListener('DOMContentLoaded', async function() {
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    const realtimeDb = firebase.database();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check auth state
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await initializeUser(user);
        }
    });
    
    console.log("App initialized successfully!");
});

// ============================
// INITIALIZE DOM ELEMENTS
// ============================

function initializeDOMElements() {
    console.log("Initializing DOM elements...");
    
    // Get all required elements
    authScreen = document.getElementById('auth-screen');
    appScreen = document.getElementById('app-screen');
    
    // Auth elements
    userEmailElement = document.getElementById('user-email');
    authButton = document.getElementById('auth-btn');
    
    // Check if elements exist
    if (!authScreen) console.error("❌ auth-screen element not found!");
    if (!appScreen) console.error("❌ app-screen element not found!");
    if (!userEmailElement) console.error("❌ user-email element not found!");
    if (!authButton) console.error("❌ auth-btn element not found!");
}

// ============================
// SETUP EVENT LISTENERS
// ============================

function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Auth button
    if (authButton) {
        authButton.addEventListener('click', toggleAuth);
    } else {
        console.error("❌ auth-btn not found for event listener");
    }
    
    // Tab buttons
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showTab(tabName);
        });
    });
    
    // Message input
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            adjustTextareaHeight(this);
        });
        
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Send button
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Modals
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeAllModals);
    }
    
    console.log("Event listeners setup complete!");
}

// ============================
// AUTHENTICATION FUNCTIONS
// ============================

async function toggleAuth() {
    if (currentUser) {
        // Logout
        await logout();
    } else {
        // Login with Google
        await loginWithGoogle();
    }
}

async function login() {
    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    
    if (!email || !password) {
        alert("Login form elements not found!");
        return;
    }
    
    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email.value, password.value);
        await initializeUser(userCredential.user);
    } catch (error) {
        alert('Login failed: ' + error.message);
        console.error("Login error:", error);
    }
}

async function register() {
    const name = document.getElementById('register-name');
    const email = document.getElementById('register-email');
    const password = document.getElementById('register-password');
    
    if (!name || !email || !password) {
        alert("Register form elements not found!");
        return;
    }
    
    if (password.value.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email.value, password.value);
        
        // Create user profile
        await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
            name: name.value,
            email: email.value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            isOnline: true
        });
        
        await initializeUser(userCredential.user);
    } catch (error) {
        alert('Registration failed: ' + error.message);
        console.error("Registration error:", error);
    }
}

async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const userCredential = await firebase.auth().signInWithPopup(provider);
        await initializeUser(userCredential.user);
    } catch (error) {
        alert('Google login failed: ' + error.message);
        console.error("Google login error:", error);
    }
}

async function initializeUser(user) {
    console.log("Initializing user:", user.email);
    currentUser = user;
    
    try {
        // Generate encryption keys
        await encryption.generateUserKeyPair();
        
        // Update online status
        await updateOnlineStatus(true);
        
        // Load user data
        await loadUserData();
        
        // Switch to app screen
        if (authScreen && appScreen) {
            authScreen.style.display = 'none';
            appScreen.style.display = 'flex';
        } else {
            console.error("❌ Screen elements not found!");
        }
        
        // Load chats and contacts
        await loadContacts();
        await loadChats();
        await loadGroups();
        
        console.log("✅ User initialized successfully!");
        
    } catch (error) {
        console.error("Error initializing user:", error);
    }
}

async function updateOnlineStatus(isOnline) {
    if (!currentUser) return;
    
    try {
        await firebase.firestore().collection('users').doc(currentUser.uid).update({
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            isOnline: isOnline
        });
        
        await firebase.database().ref('status/' + currentUser.uid).set({
            isOnline: isOnline,
            lastChanged: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (error) {
        console.error("Error updating online status:", error);
    }
}

async function loadUserData() {
    if (!currentUser) return;
    
    try {
        const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();
        
        // Update UI elements - check if they exist first
        const userNameElement = document.getElementById('user-name');
        const userEmailElement = document.getElementById('user-email');
        const userStatusElement = document.getElementById('user-status');
        
        if (userNameElement) userNameElement.textContent = userData?.name || currentUser.email;
        if (userEmailElement) userEmailElement.textContent = currentUser.email;
        if (userStatusElement) {
            userStatusElement.textContent = 'Online';
            userStatusElement.className = 'status online';
        }
        
        // Update auth button
        if (authButton) {
            authButton.textContent = 'Logout';
            authButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        }
        
    } catch (error) {
        console.error("Error loading user data:", error);
    }
}

function showRegister() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm && registerForm) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

function showLogin() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm && registerForm) {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    }
}

async function logout() {
    try {
        await updateOnlineStatus(false);
        await firebase.auth().signOut();
        encryption.clearKeys();
        
        // Switch to auth screen
        if (authScreen && appScreen) {
            appScreen.style.display = 'none';
            authScreen.style.display = 'flex';
        }
        
        // Reset UI
        const authButton = document.getElementById('auth-btn');
        if (authButton) {
            authButton.textContent = 'Login';
            authButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
        
        // Clear all data
        currentUser = null;
        currentChat = null;
        contacts = [];
        groups = [];
        selectedContacts = [];
        
        console.log("✅ User logged out successfully!");
        
    } catch (error) {
        console.error("Logout error:", error);
        alert('Logout failed: ' + error.message);
    }
}

// ============================
// CONTACTS & CHATS
// ============================

async function loadContacts() {
    if (!currentUser) return;
    
    try {
        const contactsSnapshot = await firebase.firestore().collection('users')
            .where('email', '!=', currentUser.email)
            .limit(50)
            .get();
        
        contacts = [];
        contactsSnapshot.forEach(doc => {
            contacts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderContacts();
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

async function loadChats() {
    if (!currentUser) return;
    
    try {
        const chatsSnapshot = await firebase.firestore().collection('chats')
            .where('participants', 'array-contains', currentUser.uid)
            .where('isGroup', '==', false)
            .orderBy('lastMessageTime', 'desc')
            .limit(20)
            .get();
        
        const chatsContainer = document.getElementById('chats-tab');
        if (!chatsContainer) {
            console.error("❌ chats-tab element not found!");
            return;
        }
        
        chatsContainer.innerHTML = '';
        
        if (chatsSnapshot.empty) {
            chatsContainer.innerHTML = '<div class="loading">No chats yet</div>';
            return;
        }
        
        chatsSnapshot.forEach(doc => {
            const chat = { id: doc.id, ...doc.data() };
            renderChatItem(chat, chatsContainer);
        });
        
    } catch (error) {
        console.error('Error loading chats:', error);
    }
}

async function loadGroups() {
    if (!currentUser) return;
    
    try {
        const groupsSnapshot = await firebase.firestore().collection('chats')
            .where('participants', 'array-contains', currentUser.uid)
            .where('isGroup', '==', true)
            .orderBy('lastMessageTime', 'desc')
            .limit(20)
            .get();
        
        groups = [];
        const groupsContainer = document.getElementById('groups-tab');
        
        if (!groupsContainer) {
            console.error("❌ groups-tab element not found!");
            return;
        }
        
        // Clear existing content except the create group button
        const existingGroups = groupsContainer.querySelectorAll('.chat-item:not(.btn-create-group)');
        existingGroups.forEach(el => el.remove());
        
        groupsSnapshot.forEach(doc => {
            const group = { id: doc.id, ...doc.data() };
            groups.push(group);
            renderGroupItem(group, groupsContainer);
        });
        
        if (groupsSnapshot.empty) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading';
            loadingDiv.textContent = 'No groups yet';
            groupsContainer.appendChild(loadingDiv);
        }
        
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

function renderContacts() {
    const contactsContainer = document.getElementById('contacts-tab');
    if (!contactsContainer) {
        console.error("❌ contacts-tab element not found!");
        return;
    }
    
    contactsContainer.innerHTML = '';
    
    contacts.forEach(contact => {
        const contactElement = document.createElement('div');
        contactElement.className = 'chat-item';
        contactElement.onclick = () => startChat(contact.id);
        
        contactElement.innerHTML = `
            <div class="avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="chat-content">
                <h4>${contact.name || 'Unknown'}</h4>
                <p>${contact.email}</p>
            </div>
            <div class="status ${contact.isOnline ? 'online' : 'offline'}">
                <span class="status-dot"></span>
            </div>
        `;
        
        contactsContainer.appendChild(contactElement);
    });
}

function renderChatItem(chat, container) {
    const chatElement = document.createElement('div');
    chatElement.className = 'chat-item';
    chatElement.onclick = () => openChat(chat.id);
    
    const otherUserId = chat.participants.find(id => id !== currentUser.uid);
    const otherUser = contacts.find(c => c.id === otherUserId) || {};
    
    chatElement.innerHTML = `
        <div class="avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="chat-content">
            <h4>${otherUser.name || 'Unknown User'}</h4>
            <p>${chat.lastMessage || 'No messages yet'}</p>
        </div>
        <div class="chat-time">${formatTime(chat.lastMessageTime)}</div>
        ${chat.unreadCount > 0 ? `<div class="unread-badge">${chat.unreadCount}</div>` : ''}
    `;
    
    container.appendChild(chatElement);
}

function renderGroupItem(group, container) {
    const groupElement = document.createElement('div');
    groupElement.className = 'chat-item';
    groupElement.onclick = () => openChat(group.id);
    
    groupElement.innerHTML = `
        <div class="avatar">
            <i class="fas fa-user-group"></i>
        </div>
        <div class="chat-content">
            <h4>${group.name}</h4>
            <p>${group.participants?.length || 0} members</p>
        </div>
        <div class="chat-time">${formatTime(group.lastMessageTime)}</div>
    `;
    
    container.appendChild(groupElement);
}

function showTab(tabName) {
    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show correct content
    document.getElementById('chats-tab').style.display = tabName === 'chats' ? 'block' : 'none';
    document.getElementById('contacts-tab').style.display = tabName === 'contacts' ? 'block' : 'none';
    document.getElementById('groups-tab').style.display = tabName === 'groups' ? 'block' : 'none';
}

// ============================
// MESSAGING FUNCTIONS
// ============================

async function startChat(contactId) {
    try {
        // Check if chat already exists
        const existingChat = await firebase.firestore().collection('chats')
            .where('participants', 'array-contains', currentUser.uid)
            .where('participants', 'array-contains', contactId)
            .where('isGroup', '==', false)
            .limit(1)
            .get();
        
        if (!existingChat.empty) {
            // Open existing chat
            const chatId = existingChat.docs[0].id;
            await openChat(chatId);
            return;
        }
        
        // Create new chat
        const chatRef = await firebase.firestore().collection('chats').add({
            participants: [currentUser.uid, contactId],
            isGroup: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessage: 'Chat started'
        });
        
        await openChat(chatRef.id);
        
    } catch (error) {
        console.error("Error starting chat:", error);
        alert('Failed to start chat: ' + error.message);
    }
}

async function openChat(chatId) {
    currentChat = chatId;
    
    // Hide "no chat" message
    const noChat = document.getElementById('no-chat');
    const activeChat = document.getElementById('active-chat');
    
    if (noChat) noChat.style.display = 'none';
    if (activeChat) activeChat.style.display = 'flex';
    
    // Load chat info
    await loadChatInfo(chatId);
    
    // Load messages
    await loadMessages(chatId);
    
    // Mark as active in sidebar
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Find and activate this chat item
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
        if (item.onclick && item.onclick.toString().includes(chatId)) {
            item.classList.add('active');
        }
    });
}

async function loadChatInfo(chatId) {
    try {
        const chatDoc = await firebase.firestore().collection('chats').doc(chatId).get();
        const chatData = chatDoc.data();
        
        const chatTitle = document.getElementById('chat-title');
        const chatSubtitle = document.getElementById('chat-subtitle');
        const chatAvatarIcon = document.getElementById('chat-avatar-icon');
        
        if (!chatTitle || !chatSubtitle || !chatAvatarIcon) {
            console.error("❌ Chat info elements not found!");
            return;
        }
        
        if (chatData.isGroup) {
            chatTitle.textContent = chatData.name || 'Group Chat';
            chatSubtitle.textContent = `${chatData.participants?.length || 0} members`;
            chatAvatarIcon.className = 'fas fa-user-group';
        } else {
            const otherUserId = chatData.participants.find(id => id !== currentUser.uid);
            const otherUser = contacts.find(c => c.id === otherUserId) || {};
            
            chatTitle.textContent = otherUser.name || 'Unknown User';
            chatSubtitle.textContent = otherUser.isOnline ? 'Online' : 'Last seen recently';
            chatAvatarIcon.className = 'fas fa-user';
        }
        
    } catch (error) {
        console.error("Error loading chat info:", error);
    }
}

async function loadMessages(chatId) {
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) {
        console.error("❌ messages-container not found!");
        return;
    }
    
    messagesContainer.innerHTML = '<div class="message-day"><span>Today</span></div>';
    
    try {
        const messagesSnapshot = await firebase.firestore().collection('chats')
            .doc(chatId)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        const messages = [];
        messagesSnapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        
        // Reverse to show oldest first
        messages.reverse().forEach(message => {
            renderMessage(message);
        });
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function sendMessage() {
    if (!currentChat || !currentUser) {
        alert("No chat selected or user not logged in!");
        return;
    }
    
    const input = document.getElementById('message-input');
    if (!input) {
        console.error("❌ message-input not found!");
        return;
    }
    
    const messageText = input.value.trim();
    
    if (!messageText && !selectedFile) {
        alert("Please type a message or attach a file!");
        return;
    }
    
    try {
        // Get chat key
        const chatKey = encryption.getChatKey(currentChat);
        
        let messageData = {
            senderId: currentUser.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            isEncrypted: true
        };
        
        // Encrypt message text
        if (messageText) {
            const encrypted = encryption.encryptMessage(messageText, currentChat);
            messageData.text = encrypted.encrypted;
            messageData.encryptionInfo = {
                algorithm: encrypted.algorithm,
                fingerprint: encryption.generateFingerprint(currentChat)
            };
        }
        
        // Handle file attachment
        if (selectedFile) {
            try {
                const encryptedFile = await encryption.encryptFile(selectedFile, currentChat);
                
                const storageRef = firebase.storage().ref();
                const fileRef = storageRef.child(`chats/${currentChat}/${Date.now()}_${selectedFile.name}`);
                
                const encryptedBlob = new Blob([encryptedFile.encrypted], { type: 'text/plain' });
                
                await fileRef.put(encryptedBlob);
                const downloadURL = await fileRef.getDownloadURL();
                
                messageData.file = {
                    url: downloadURL,
                    name: encryptedFile.originalName,
                    type: encryptedFile.type,
                    size: encryptedFile.size,
                    isEncrypted: true
                };
                
                clearAttachment();
                
            } catch (error) {
                console.error('Error uploading file:', error);
                alert('Failed to upload file');
                return;
            }
        }
        
        // Add message to Firestore
        const messageRef = await firebase.firestore().collection('chats')
            .doc(currentChat)
            .collection('messages')
            .add(messageData);
        
        // Update chat last message
        await firebase.firestore().collection('chats').doc(currentChat).update({
            lastMessage: messageText || '📎 File',
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
            lastSenderId: currentUser.uid
        });
        
        // Clear input
        input.value = '';
        adjustTextareaHeight(input);
        
        // Render message locally
        renderMessage({
            ...messageData,
            id: messageRef.id
        });
        
        // Scroll to bottom
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        console.log("✅ Message sent successfully!");
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message: ' + error.message);
    }
}

function renderMessage(message) {
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) return;
    
    const isSent = message.senderId === currentUser.uid;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    
    let content = '';
    
    if (message.text) {
        try {
            const decrypted = encryption.decryptMessage(message.text, currentChat);
            content = decrypted.text;
        } catch (error) {
            content = '[Encrypted message]';
        }
    }
    
    if (message.file) {
        content = '📎 ' + (message.file.name || 'File');
    }
    
    const time = message.timestamp ? 
        new Date(message.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
        'Just now';
    
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-text">${content}</div>
            <div class="message-time">
                ${time}
                ${isSent ? '<span class="message-status"><i class="fas fa-check-double"></i></span>' : ''}
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
}

// ============================
// GROUP FUNCTIONS
// ============================

function showCreateGroupModal() {
    // Load available contacts
    const contactsContainer = document.getElementById('available-contacts');
    if (!contactsContainer) {
        console.error("❌ available-contacts element not found!");
        return;
    }
    
    contactsContainer.innerHTML = '';
    
    contacts.forEach(contact => {
        const contactElement = document.createElement('label');
        contactElement.className = 'contact-checkbox';
        
        contactElement.innerHTML = `
            <input type="checkbox" value="${contact.id}" onchange="toggleContactSelection('${contact.id}')">
            <div class="avatar small">
                <i class="fas fa-user"></i>
            </div>
            <span>${contact.name || contact.email}</span>
        `;
        
        contactsContainer.appendChild(contactElement);
    });
    
    // Show modal
    showModal('create-group-modal');
}

function toggleContactSelection(contactId) {
    const index = selectedContacts.indexOf(contactId);
    if (index > -1) {
        selectedContacts.splice(index, 1);
    } else {
        selectedContacts.push(contactId);
    }
}

async function createGroup() {
    const groupNameInput = document.getElementById('group-name');
    const descriptionInput = document.getElementById('group-description');
    
    if (!groupNameInput || !descriptionInput) {
        alert("Group form elements not found!");
        return;
    }
    
    const groupName = groupNameInput.value.trim();
    const description = descriptionInput.value.trim();
    
    if (!groupName) {
        alert('Please enter a group name');
        return;
    }
    
    if (selectedContacts.length === 0) {
        alert('Please select at least one member');
        return;
    }
    
    // Include current user
    const allParticipants = [currentUser.uid, ...selectedContacts];
    
    try {
        // Generate group encryption key
        const groupKey = encryption.generateSymmetricKey('temp_group_key');
        
        // Create group in Firestore
        const groupRef = await firebase.firestore().collection('chats').add({
            name: groupName,
            description: description,
            participants: allParticipants,
            adminId: currentUser.uid,
            isGroup: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
            encryptionKey: groupKey
        });
        
        // Close modal
        closeModal('create-group-modal');
        
        // Clear selection
        selectedContacts = [];
        groupNameInput.value = '';
        descriptionInput.value = '';
        
        // Refresh groups list
        await loadGroups();
        
        // Open the new group
        await openChat(groupRef.id);
        
        // Send welcome message
        setTimeout(async () => {
            const input = document.getElementById('message-input');
            if (input) {
                input.value = `Welcome to "${groupName}"! This group is end-to-end encrypted.`;
                await sendMessage();
            }
        }, 1000);
        
        console.log("✅ Group created successfully!");
        
    } catch (error) {
        console.error('Error creating group:', error);
        alert('Failed to create group: ' + error.message);
    }
}

// ============================
// FILE ATTACHMENTS
// ============================

function toggleAttachment() {
    const menu = document.getElementById('attachment-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

function attachFile(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : 
                   type === 'audio' ? 'audio/*' : '*/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            showFilePreview(file);
        }
    };
    
    input.click();
    
    // Hide menu
    const menu = document.getElementById('attachment-menu');
    if (menu) menu.style.display = 'none';
}

function showFilePreview(file) {
    const preview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    
    if (preview && fileName) {
        fileName.textContent = file.name;
        preview.style.display = 'block';
    }
}

function clearAttachment() {
    selectedFile = null;
    const preview = document.getElementById('file-preview');
    if (preview) preview.style.display = 'none';
}

// ============================
// UI HELPER FUNCTIONS
// ============================

function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
}

function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function showSettings() {
    showModal('settings-modal');
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    const overlay = document.getElementById('modal-overlay');
    
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    if (overlay) overlay.style.display = 'none';
}

function exportEncryptionKeys() {
    encryption.exportKeys();
    alert('Encryption keys exported. Keep them safe!');
}

async function deleteAllMessages() {
    if (confirm('Are you sure? This will delete all your messages permanently.')) {
        alert('Feature coming soon');
    }
}

// ============================
// DEBUGGING FUNCTIONS
// ============================

function checkAllElements() {
    console.log("=== CHECKING ALL ELEMENTS ===");
    
    // Auth elements
    checkElement('auth-screen');
    checkElement('app-screen');
    checkElement('login-email');
    checkElement('login-password');
    checkElement('register-name');
    checkElement('register-email');
    checkElement('register-password');
    checkElement('auth-btn');
    
    // App elements
    checkElement('user-name');
    checkElement('user-email');
    checkElement('user-status');
    checkElement('chats-tab');
    checkElement('contacts-tab');
    checkElement('groups-tab');
    checkElement('no-chat');
    checkElement('active-chat');
    checkElement('message-input');
    checkElement('send-btn');
    checkElement('messages-container');
    
    console.log("=== ELEMENT CHECK COMPLETE ===");
}

function checkElement(id) {
    const element = document.getElementById(id);
    if (element) {
        console.log(`✅ ${id}: FOUND`);
    } else {
        console.log(`❌ ${id}: NOT FOUND`);
    }
}

// Make functions globally available for onclick handlers
window.login = login;
window.register = register;
window.loginWithGoogle = loginWithGoogle;
window.showRegister = showRegister;
window.showLogin = showLogin;
window.logout = logout;
window.showTab = showTab;
window.sendMessage = sendMessage;
window.showCreateGroupModal = showCreateGroupModal;
window.toggleContactSelection = toggleContactSelection;
window.createGroup = createGroup;
window.toggleAttachment = toggleAttachment;
window.attachFile = attachFile;
window.clearAttachment = clearAttachment;
window.showSettings = showSettings;
window.closeModal = closeModal;
window.exportEncryptionKeys = exportEncryptionKeys;
window.deleteAllMessages = deleteAllMessages;
window.suggestQuestion = function(q) {
    const input = document.getElementById('message-input');
    if (input) {
        input.value = q;
        adjustTextareaHeight(input);
        input.focus();
    }
};
window.clearChat = function() {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        messagesContainer.innerHTML = '<div class="message-day"><span>Today</span></div>';
    }
};

// Debug on load
setTimeout(() => {
    console.log("App loaded. Type 'checkAllElements()' in console to check elements.");

}, 1000);
