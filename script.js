// Global variables
let currentUser = null;
let currentChatType = 'group'; // 'group' or 'private'
let currentChatId = 'global'; // Default group
let currentRecipientId = null;
let onlineUsers = {};
let groups = [];

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');
const userName = document.getElementById('user-name');
const userAvatar = document.getElementById('user-avatar');
const usersList = document.getElementById('users-list');
const groupsList = document.getElementById('groups-list');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const chatTitle = document.getElementById('chat-title');
const chatInfo = document.getElementById('chat-info');
const createGroupModal = document.getElementById('create-group-modal');

// Initialize when page loads
window.onload = function() {
    // Set up auth state listener
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            setupUser(user);
            showChatScreen();
            loadInitialData();
        } else {
            showAuthScreen();
        }
    });
};

// Setup user info
function setupUser(user) {
    userName.textContent = user.displayName || user.email.split('@')[0];
    userAvatar.textContent = (user.displayName || user.email[0]).toUpperCase();
    userAvatar.style.backgroundColor = getRandomColor();
}

// Authentication Functions
async function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        // Update profile
        await userCredential.user.updateProfile({
            displayName: email.split('@')[0]
        });
        alert('Account created successfully!');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

function signOut() {
    if (currentUser) {
        // Update user status to offline
        db.collection('users').doc(currentUser.uid).update({
            isOnline: false,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
    auth.signOut();
}

// Screen Management
function showAuthScreen() {
    authScreen.style.display = 'flex';
    chatScreen.style.display = 'none';
    currentUser = null;
}

function showChatScreen() {
    authScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
}

// Chat Type Switching
function showGroupChat() {
    currentChatType = 'group';
    document.getElementById('btn-group').classList.add('active');
    document.getElementById('btn-private').classList.remove('active');
    document.getElementById('online-users').style.display = 'block';
    document.getElementById('create-group-section').style.display = 'block';
    loadGroups();
    switchToChat('global', 'Global Group Chat');
}

function showPrivateChat() {
    currentChatType = 'private';
    document.getElementById('btn-group').classList.remove('active');
    document.getElementById('btn-private').classList.add('active');
    document.getElementById('online-users').style.display = 'block';
    document.getElementById('create-group-section').style.display = 'none';
    loadOnlineUsers();
}

// Database Functions
async function loadInitialData() {
    if (!currentUser) return;
    
    // Create/Update user document
    await db.collection('users').doc(currentUser.uid).set({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email.split('@')[0],
        isOnline: true,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Set up presence tracking
    setupPresenceTracking();
    
    // Load data based on chat type
    if (currentChatType === 'group') {
        loadGroups();
    } else {
        loadOnlineUsers();
    }
    
    // Load global chat by default
    switchToChat('global', 'Global Group Chat');
}

function setupPresenceTracking() {
    // Update user status when online/offline
    const userStatusRef = db.collection('users').doc(currentUser.uid);
    
    // Update to online
    userStatusRef.update({
        isOnline: true,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Update to offline when user disconnects
    window.addEventListener('beforeunload', () => {
        userStatusRef.update({
            isOnline: false,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
    });
}

async function loadOnlineUsers() {
    usersList.innerHTML = '<div class="loading">Loading users...</div>';
    
    // Listen for real-time updates
    db.collection('users')
        .where('uid', '!=', currentUser.uid)
        .onSnapshot(snapshot => {
            usersList.innerHTML = '';
            onlineUsers = {};
            
            snapshot.forEach(doc => {
                const user = doc.data();
                onlineUsers[user.uid] = user;
                
                const userElement = document.createElement('div');
                userElement.className = 'user-item';
                userElement.innerHTML = `
                    <div class="user-status" style="background: ${user.isOnline ? '#48bb78' : '#718096'}"></div>
                    <span>${user.displayName}</span>
                    <small>${user.isOnline ? 'Online' : 'Offline'}</small>
                `;
                
                userElement.onclick = () => startPrivateChat(user.uid, user.displayName);
                usersList.appendChild(userElement);
            });
            
            if (snapshot.empty) {
                usersList.innerHTML = '<div class="no-users">No other users online</div>';
            }
        });
}

async function loadGroups() {
    groupsList.innerHTML = '<div class="loading">Loading groups...</div>';
    
    // Load all groups
    db.collection('groups')
        .where('members', 'array-contains', currentUser.uid)
        .onSnapshot(snapshot => {
            groupsList.innerHTML = '';
            groups = [];
            
            snapshot.forEach(doc => {
                const group = { id: doc.id, ...doc.data() };
                groups.push(group);
                
                const groupElement = document.createElement('div');
                groupElement.className = 'group-item';
                if (group.id === currentChatId) {
                    groupElement.classList.add('active');
                }
                
                groupElement.innerHTML = `
                    <i class="fas fa-users"></i>
                    <div>
                        <strong>${group.name}</strong>
                        <small>${group.members.length} members</small>
                    </div>
                `;
                
                groupElement.onclick = () => switchToGroup(group.id, group.name);
                groupsList.appendChild(groupElement);
            });
            
            // Add global group
            const globalGroupElement = document.createElement('div');
            globalGroupElement.className = `group-item ${currentChatId === 'global' ? 'active' : ''}`;
            globalGroupElement.innerHTML = `
                <i class="fas fa-globe"></i>
                <div>
                    <strong>Global Chat</strong>
                    <small>Everyone</small>
                </div>
            `;
            globalGroupElement.onclick = () => switchToChat('global', 'Global Group Chat');
            groupsList.prepend(globalGroupElement);
        });
}

function switchToChat(chatId, title) {
    currentChatId = chatId;
    currentRecipientId = null;
    chatTitle.textContent = title;
    chatInfo.textContent = currentChatType === 'group' ? 'Group Chat' : 'Direct Message';
    
    // Clear previous listener
    if (window.chatListener) {
        window.chatListener();
    }
    
    // Clear messages
    messagesDiv.innerHTML = '';
    
    // Set up new listener based on chat type
    if (currentChatType === 'group') {
        if (chatId === 'global') {
            listenToGlobalChat();
        } else {
            listenToGroupChat(chatId);
        }
    } else {
        listenToPrivateChat(chatId);
    }
}

function startPrivateChat(recipientId, recipientName) {
    currentChatType = 'private';
    currentRecipientId = recipientId;
    
    // Generate unique chat ID for the pair
    const chatId = [currentUser.uid, recipientId].sort().join('_');
    chatTitle.textContent = `Chat with ${recipientName}`;
    chatInfo.textContent = 'Direct Message';
    
    switchToChat(chatId, `Chat with ${recipientName}`);
}

// Chat Listening Functions
function listenToGlobalChat() {
    window.chatListener = db.collection('messages')
        .where('type', '==', 'global')
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            messagesDiv.innerHTML = '';
            snapshot.forEach(doc => {
                displayMessage(doc.data());
            });
            scrollToBottom();
        });
}

function listenToGroupChat(groupId) {
    window.chatListener = db.collection('messages')
        .where('type', '==', 'group')
        .where('groupId', '==', groupId)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            messagesDiv.innerHTML = '';
            snapshot.forEach(doc => {
                displayMessage(doc.data());
            });
            scrollToBottom();
        });
}

function listenToPrivateChat(chatId) {
    window.chatListener = db.collection('messages')
        .where('type', '==', 'private')
        .where('chatId', '==', chatId)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            messagesDiv.innerHTML = '';
            snapshot.forEach(doc => {
                displayMessage(doc.data());
            });
            scrollToBottom();
        });
}

// Message Functions
async function sendMessage() {
    const messageText = messageInput.value.trim();
    if (!messageText || !currentUser) return;
    
    const messageData = {
        text: messageText,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email.split('@')[0],
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (currentChatType === 'group') {
        if (currentChatId === 'global') {
            messageData.type = 'global';
        } else {
            messageData.type = 'group';
            messageData.groupId = currentChatId;
        }
    } else {
        messageData.type = 'private';
        messageData.chatId = currentChatId; // This is the unique chat ID for the pair
        messageData.recipientId = currentRecipientId;
    }
    
    try {
        await db.collection('messages').add(messageData);
        messageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
    }
}

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === currentUser.uid ? 'message-sent' : 'message-received'}`;
    
    const time = message.timestamp ? 
        new Date(message.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
        'Just now';
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-sender">${message.senderName}</div>
            <div class="message-text">${message.text}</div>
            <div class="message-info">
                <span>${time}</span>
            </div>
        </div>
    `;
    
    messagesDiv.appendChild(messageDiv);
}

function scrollToBottom() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Group Management
function showCreateGroupModal() {
    createGroupModal.style.display = 'flex';
}

function closeModal() {
    createGroupModal.style.display = 'none';
}

async function createGroup() {
    const groupName = document.getElementById('group-name').value.trim();
    const description = document.getElementById('group-description').value.trim();
    
    if (!groupName) {
        alert('Please enter a group name');
        return;
    }
    
    try {
        const groupData = {
            name: groupName,
            description: description,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            members: [currentUser.uid]
        };
        
        const docRef = await db.collection('groups').add(groupData);
        
        // Add creator as admin
        await db.collection('groupMembers').add({
            groupId: docRef.id,
            userId: currentUser.uid,
            role: 'admin',
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Group created successfully!');
        closeModal();
        document.getElementById('group-name').value = '';
        document.getElementById('group-description').value = '';
        
        // Switch to the new group
        switchToGroup(docRef.id, groupName);
    } catch (error) {
        console.error('Error creating group:', error);
        alert('Failed to create group');
    }
}

function switchToGroup(groupId, groupName) {
    currentChatType = 'group';
    currentChatId = groupId;
    switchToChat(groupId, groupName);
}

// Utility Functions
function getRandomColor() {
    const colors = ['#667eea', '#764ba2', '#f56565', '#ed8936', '#ecc94b', '#48bb78', '#38b2ac'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Event Listeners
window.onclick = function(event) {
    if (event.target === createGroupModal) {
        closeModal();
    }
};

// Initialize
initializeDatabase();