// ============================
// MAIN APPLICATION
// ============================

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const realtimeDb = firebase.database();

// Global variables
let currentUser = null;
let currentChat = null;
let contacts = [];
let groups = [];
let selectedContacts = [];

// ============================
// AUTHENTICATION
// ============================

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        await initializeUser(userCredential.user);
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Create user profile
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await initializeUser(userCredential.user);
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const userCredential = await auth.signInWithPopup(provider);
        await initializeUser(userCredential.user);
    } catch (error) {
        alert('Google login failed: ' + error.message);
    }
}

async function initializeUser(user) {
    currentUser = user;
    
    // Generate encryption keys
    await encryption.generateUserKeyPair();
    
    // Update online status
    await updateOnlineStatus(true);
    
    // Load user data
    await loadUserData();
    
    // Switch to app screen
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    
    // Load chats and contacts
    await loadContacts();
    await loadChats();
    await loadGroups();
    
    // Set up realtime listeners
    setupRealtimeListeners();
}

async function updateOnlineStatus(isOnline) {
    if (!currentUser) return;
    
    // Update Firestore
    await db.collection('users').doc(currentUser.uid).update({
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        isOnline: isOnline
    });
    
    // Update Realtime Database for realtime status
    await realtimeDb.ref('status/' + currentUser.uid).set({
        isOnline: isOnline,
        lastChanged: firebase.database.ServerValue.TIMESTAMP
    });
}

async function loadUserData() {
    if (!currentUser) return;
    
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();
    
    document.getElementById('user-name').textContent = userData?.name || currentUser.email;
    document.getElementById('user-email').textContent = currentUser.email;
    
    // Update avatar
    const avatarIcon = document.getElementById('user-avatar').querySelector('i');
    if (userData?.photoURL) {
        avatarIcon.className = 'fas fa-user';
        // In real app, you would set background image
    }
}

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function showLogin() {
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
}

async function logout() {
    await updateOnlineStatus(false);
    await auth.signOut();
    encryption.clearKeys();
    
    // Switch to auth screen
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
    
    // Clear all data
    currentUser = null;
    currentChat = null;
    contacts = [];
    groups = [];
}

// ============================
// CONTACTS & CHATS
// ============================

async function loadContacts() {
    if (!currentUser) return;
    
    try {
        const contactsSnapshot = await db.collection('users')
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
        // Load one-on-one chats
        const chatsSnapshot = await db.collection('chats')
            .where('participants', 'array-contains', currentUser.uid)
            .where('isGroup', '==', false)
            .orderBy('lastMessageTime', 'desc')
            .limit(20)
            .get();
        
        const chatsContainer = document.getElementById('chats-tab');
        chatsContainer.innerHTML = '';
        
        chatsSnapshot.forEach(doc => {
            const chat = { id: doc.id, ...doc.data() };
            renderChatItem(chat, chatsContainer);
        });
        
        if (chatsSnapshot.empty) {
            chatsContainer.innerHTML = '<div class="loading">No chats yet</div>';
        }
    } catch (error) {
        console.error('Error loading chats:', error);
    }
}

async function loadGroups() {
    if (!currentUser) return;
    
    try {
        const groupsSnapshot = await db.collection('chats')
            .where('participants', 'array-contains', currentUser.uid)
            .where('isGroup', '==', true)
            .orderBy('lastMessageTime', 'desc')
            .limit(20)
            .get();
        
        groups = [];
        const groupsContainer = document.getElementById('groups-tab');
        
        groupsSnapshot.forEach(doc => {
            const group = { id: doc.id, ...doc.data() };
            groups.push(group);
            renderGroupItem(group, groupsContainer);
        });
        
        if (groupsSnapshot.empty) {
            groupsContainer.innerHTML += '<div class="loading">No groups yet</div>';
        }
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

function renderContacts() {
    const contactsContainer = document.getElementById('contacts-tab');
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
                <h4>${contact.name}</h4>
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
    
    // Get other participant info
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
    event.target.classList.add('active');
    
    // Show correct content
    document.getElementById('chats-tab').style.display = tabName === 'chats' ? 'block' : 'none';
    document.getElementById('contacts-tab').style.display = tabName === 'contacts' ? 'block' : 'none';
    document.getElementById('groups-tab').style.display = tabName === 'groups' ? 'block' : 'none';
}

// ============================
// MESSAGING
// ============================

async function openChat(chatId) {
    currentChat = chatId;
    
    // Hide "no chat" message
    document.getElementById('no-chat').style.display = 'none';
    document.getElementById('active-chat').style.display = 'flex';
    
    // Load chat info
    await loadChatInfo(chatId);
    
    // Load messages
    await loadMessages(chatId);
    
    // Mark messages as read
    await markMessagesAsRead(chatId);
    
    // Update active chat in sidebar
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.chat-item').classList.add('active');
}

async function loadChatInfo(chatId) {
    const chatDoc = await db.collection('chats').doc(chatId).get();
    const chatData = chatDoc.data();
    
    if (chatData.isGroup) {
        // Group chat
        document.getElementById('chat-title').textContent = chatData.name;
        document.getElementById('chat-subtitle').textContent = `${chatData.participants.length} members`;
        document.getElementById('chat-avatar-icon').className = 'fas fa-user-group';
    } else {
        // One-on-one chat
        const otherUserId = chatData.participants.find(id => id !== currentUser.uid);
        const otherUser = contacts.find(c => c.id === otherUserId) || {};
        
        document.getElementById('chat-title').textContent = otherUser.name || 'Unknown User';
        document.getElementById('chat-subtitle').textContent = otherUser.isOnline ? 'Online' : 'Last seen recently';
        document.getElementById('chat-avatar-icon').className = 'fas fa-user';
    }
}

async function loadMessages(chatId) {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.innerHTML = '<div class="message-day"><span>Today</span></div>';
    
    try {
        const messagesSnapshot = await db.collection('chats')
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
    if (!currentChat || !currentUser) return;
    
    const input = document.getElementById('message-input');
    const messageText = input.value.trim();
    
    if (!messageText && !selectedFile) return;
    
    // Get chat key (will generate if doesn't exist)
    const chatKey = encryption.getChatKey(currentChat);
    
    let messageData = {
        senderId: currentUser.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        isEncrypted: true
    };
    
    // Encrypt message
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
            // Encrypt file
            const encryptedFile = await encryption.encryptFile(selectedFile, currentChat);
            
            // Upload to Firebase Storage
            const storageRef = storage.ref();
            const fileRef = storageRef.child(`chats/${currentChat}/${Date.now()}_${selectedFile.name}`);
            
            // Convert encrypted data to blob
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
            
            // Clear file preview
            clearAttachment();
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
            return;
        }
    }
    
    try {
        // Add message to Firestore
        const messageRef = await db.collection('chats')
            .doc(currentChat)
            .collection('messages')
            .add(messageData);
        
        // Update chat last message
        await db.collection('chats').doc(currentChat).update({
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
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
    }
}

function renderMessage(message) {
    const messagesContainer = document.getElementById('messages-container');
    const isSent = message.senderId === currentUser.uid;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    
    let content = '';
    
    if (message.text) {
        // Decrypt message
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

async function markMessagesAsRead(chatId) {
    // Mark all unread messages as read
    // Implementation depends on your message structure
}

// ============================
// GROUPS
// ============================

function showCreateGroupModal() {
    // Load available contacts
    const contactsContainer = document.getElementById('available-contacts');
    contactsContainer.innerHTML = '';
    
    contacts.forEach(contact => {
        const contactElement = document.createElement('label');
        contactElement.className = 'contact-checkbox';
        
        contactElement.innerHTML = `
            <input type="checkbox" value="${contact.id}" onchange="toggleContactSelection('${contact.id}')">
            <div class="avatar small">
                <i class="fas fa-user"></i>
            </div>
            <span>${contact.name}</span>
        `;
        
        contactsContainer.appendChild(contactElement);
    });
    
    // Show modal
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('create-group-modal').style.display = 'block';
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
    const groupName = document.getElementById('group-name').value;
    const description = document.getElementById('group-description').value;
    
    if (!groupName.trim()) {
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
        const groupRef = await db.collection('chats').add({
            name: groupName,
            description: description,
            participants: allParticipants,
            adminId: currentUser.uid,
            isGroup: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
            encryptionKey: groupKey // In real app, encrypt this with each user's public key
        });
        
        // Close modal
        closeModal('create-group-modal');
        
        // Clear selection
        selectedContacts = [];
        document.getElementById('group-name').value = '';
        document.getElementById('group-description').value = '';
        
        // Open the new group
        await openChat(groupRef.id);
        
        // Send welcome message
        setTimeout(async () => {
            const input = document.getElementById('message-input');
            input.value = `Welcome to "${groupName}"! This group is end-to-end encrypted.`;
            await sendMessage();
        }, 1000);
        
        // Refresh groups list
        await loadGroups();
        
    } catch (error) {
        console.error('Error creating group:', error);
        alert('Failed to create group');
    }
}

// ============================
// FILE ATTACHMENTS
// ============================

let selectedFile = null;

function toggleAttachment() {
    const menu = document.getElementById('attachment-menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
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
    document.getElementById('attachment-menu').style.display = 'none';
}

function showFilePreview(file) {
    const preview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    
    fileName.textContent = file.name;
    preview.style.display = 'block';
}

function clearAttachment() {
    selectedFile = null;
    document.getElementById('file-preview').style.display = 'none';
}

// ============================
// UI HELPERS
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

function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function showSettings() {
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('settings-modal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById(modalId).style.display = 'none';
}

function exportEncryptionKeys() {
    encryption.exportKeys();
    alert('Encryption keys exported. Keep them safe!');
}

async function deleteAllMessages() {
    if (confirm('Are you sure? This will delete all your messages permanently.')) {
        // Implementation depends on your data structure
        alert('Feature coming soon');
    }
}

// ============================
// REALTIME LISTENERS
// ============================

function setupRealtimeListeners() {
    if (!currentUser) return;
    
    // Listen for new messages in current chat
    if (currentChat) {
        db.collection('chats')
            .doc(currentChat)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const message = change.doc.data();
                        if (message.senderId !== currentUser.uid) {
                            renderMessage(message);
                        }
                    }
                });
            });
    }
    
    // Listen for online status changes
    realtimeDb.ref('status').on('value', (snapshot) => {
        // Update online status in UI
    });
}

// ============================
// INITIALIZATION
// ============================

// Check auth state on load
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await initializeUser(user);
    }
});

// Initialize textarea auto-resize
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('message-input');
    if (textarea) {
        textarea.addEventListener('input', function() {
            adjustTextareaHeight(this);
        });
    }
    
    // Close modals when clicking overlay
    document.getElementById('modal-overlay').onclick = () => {
        closeModal('create-group-modal');
        closeModal('settings-modal');
    };
});