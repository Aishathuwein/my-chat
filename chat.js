// Global variables
let currentChat = null;
let currentChatType = null; // 'private' or 'group'
let selectedMessageId = null;
let chatListeners = [];
let messageListeners = [];
let groupListeners = [];
let contactListeners = [];
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];

// Initialize chat system
function initializeChat() {
    if (!currentUser) return;
    
    // Set up event listeners
    setupEventListeners();
    
    // Request notification permission
    requestNotificationPermission();
}

// Set up event listeners
function setupEventListeners() {
    // Search chats
    document.getElementById('search-chats').addEventListener('input', function(e) {
        searchChats(e.target.value);
    });
    
    // Search users in new chat modal
    document.getElementById('search-users').addEventListener('input', function(e) {
        searchUsers(e.target.value);
    });
    
    // Message input keypress
    document.getElementById('message-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
        }
    });
    
    // Close dropdowns when clicking outside
    window.addEventListener('click', function(e) {
        if (!e.target.closest('.attach-btn')) {
            document.getElementById('attachments-menu').classList.add('hidden');
        }
        if (!e.target.closest('.emoji-btn')) {
            document.getElementById('emoji-picker').classList.add('hidden');
        }
    });
}

// Load user's chats
async function loadChats() {
    if (!currentUser) return;
    
    const chatsList = document.getElementById('chats-tab');
    chatsList.innerHTML = '<div class="loading-item">Loading chats...</div>';
    
    try {
        // Listen for private chats where user is a participant
        const privateChatsQuery = db.collection('chats')
            .where('participants', 'array-contains', currentUser.uid)
            .where('type', '==', 'private')
            .orderBy('lastMessageTime', 'desc');
        
        const unsubscribe = privateChatsQuery.onSnapshot(async (snapshot) => {
            const chats = [];
            
            for (const doc of snapshot.docs) {
                const chatData = doc.data();
                
                // Get other participant's info
                const otherParticipantId = chatData.participants.find(id => id !== currentUser.uid);
                if (otherParticipantId) {
                    const userDoc = await db.collection('users').doc(otherParticipantId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        chats.push({
                            id: doc.id,
                            ...chatData,
                            otherParticipant: userData,
                            displayName: userData.displayName,
                            photoURL: userData.photoURL
                        });
                    }
                }
            }
            
            // Also load group chats
            const groupChatsQuery = db.collection('chats')
                .where('participants', 'array-contains', currentUser.uid)
                .where('type', '==', 'group');
            
            groupChatsQuery.get().then((groupSnapshot) => {
                groupSnapshot.forEach(doc => {
                    const groupData = doc.data();
                    chats.push({
                        id: doc.id,
                        ...groupData,
                        isGroup: true,
                        displayName: groupData.name,
                        photoURL: groupData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupData.name)}&background=00509E&color=fff`
                    });
                });
                
                displayChats(chats);
            });
            
        }, (error) => {
            console.error('Error loading chats:', error);
            chatsList.innerHTML = '<div class="error-item">Error loading chats</div>';
        });
        
        chatListeners.push(unsubscribe);
        
    } catch (error) {
        console.error('Error setting up chats listener:', error);
        chatsList.innerHTML = '<div class="error-item">Error loading chats</div>';
    }
}

// Display chats in sidebar
function displayChats(chats) {
    const chatsList = document.getElementById('chats-tab');
    
    if (chats.length === 0) {
        chatsList.innerHTML = '<div class="empty-state">No conversations yet</div>';
        return;
    }
    
    chatsList.innerHTML = '';
    
    chats.forEach(chat => {
        const chatElement = document.createElement('div');
        chatElement.className = 'chat-item';
        chatElement.dataset.chatId = chat.id;
        chatElement.dataset.chatType = chat.isGroup ? 'group' : 'private';
        
        const lastMessage = chat.lastMessage || 'No messages yet';
        const lastMessageTime = chat.lastMessageTime ? formatTime(chat.lastMessageTime.toDate()) : '';
        const unreadCount = chat.unreadCount && chat.unreadCount[currentUser.uid] || 0;
        
        chatElement.innerHTML = `
            <img src="${chat.photoURL}" alt="${chat.displayName}" class="chat-avatar">
            <div class="chat-info">
                <div class="chat-name">${chat.displayName}</div>
                <div class="chat-last-message">${lastMessage}</div>
            </div>
            <div class="chat-meta">
                <div class="chat-time">${lastMessageTime}</div>
                ${unreadCount > 0 ? `<div class="unread-count">${unreadCount}</div>` : ''}
            </div>
        `;
        
        chatElement.addEventListener('click', () => openChat(chat.id, chat.isGroup ? 'group' : 'private'));
        chatsList.appendChild(chatElement);
    });
}

// Open a chat
async function openChat(chatId, type = 'private') {
    try {
        // Close current chat listeners
        closeCurrentChat();
        
        // Update current chat
        currentChat = chatId;
        currentChatType = type;
        
        // Get chat data
        const chatDoc = await db.collection('chats').doc(chatId).get();
        
        if (!chatDoc.exists) {
            console.error('Chat not found');
            return;
        }
        
        const chatData = chatDoc.data();
        
        // Update UI
        if (type === 'private') {
            const otherParticipantId = chatData.participants.find(id => id !== currentUser.uid);
            if (otherParticipantId) {
                const userDoc = await db.collection('users').doc(otherParticipantId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    document.getElementById('current-chat-name').textContent = userData.displayName;
                    document.getElementById('online-status').className = 
                        `online-dot ${userData.isOnline ? 'online' : 'offline'}`;
                }
            }
        } else {
            document.getElementById('current-chat-name').textContent = chatData.name;
            document.getElementById('online-status').className = 'online-dot group';
        }
        
        // Show chat area
        document.getElementById('empty-chat').classList.add('hidden');
        document.getElementById('active-chat').classList.remove('hidden');
        
        // Mark messages as read
        await markMessagesAsRead(chatId);
        
        // Load messages
        loadMessages(chatId);
        
        // Set up real-time message listener
        const unsubscribe = db.collection('messages')
            .where('chatId', '==', chatId)
            .orderBy('timestamp', 'asc')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        displayMessage(change.doc.data(), change.doc.id);
                        
                        // Mark as read if it's a new message from others
                        const messageData = change.doc.data();
                        if (messageData.senderId !== currentUser.uid) {
                            markMessageAsRead(chatId, change.doc.id);
                        }
                        
                        // Show notification if not in this chat
                        if (document.hidden || !isChatActive(chatId)) {
                            showNotification(messageData);
                        }
                    } else if (change.type === 'modified') {
                        updateMessage(change.doc.id, change.doc.data());
                    } else if (change.type === 'removed') {
                        removeMessage(change.doc.id);
                    }
                });
            });
        
        messageListeners.push(unsubscribe);
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('active');
        }
        
    } catch (error) {
        console.error('Error opening chat:', error);
        alert('Error opening chat: ' + error.message);
    }
}

// Load messages for a chat
async function loadMessages(chatId) {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.innerHTML = '<div class="loading-messages">Loading messages...</div>';
    
    try {
        const messagesQuery = await db.collection('messages')
            .where('chatId', '==', chatId)
            .orderBy('timestamp', 'asc')
            .limit(50)
            .get();
        
        messagesContainer.innerHTML = '';
        
        if (messagesQuery.empty) {
            messagesContainer.innerHTML = '<div class="empty-messages">No messages yet. Start the conversation!</div>';
            return;
        }
        
        messagesQuery.forEach(doc => {
            displayMessage(doc.data(), doc.id);
        });
        
        // Scroll to bottom
        scrollToBottom();
        
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = '<div class="error-messages">Error loading messages</div>';
    }
}

// Display a message
function displayMessage(messageData, messageId) {
    const messagesContainer = document.getElementById('messages-container');
    const isSent = messageData.senderId === currentUser.uid;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    messageElement.dataset.messageId = messageId;
    
    // Format message content
    let messageContent = messageData.content;
    if (messageData.attachment) {
        if (messageData.attachment.type === 'image') {
            messageContent += `<div class="attachment"><img src="${messageData.attachment.url}" alt="Attachment" onclick="viewImage('${messageData.attachment.url}')"></div>`;
        } else if (messageData.attachment.type === 'document') {
            messageContent += `<div class="attachment"><a href="${messageData.attachment.url}" target="_blank"><i class="fas fa-file"></i> ${messageData.attachment.name}</a></div>`;
        } else if (messageData.attachment.type === 'audio') {
            messageContent += `<div class="audio-message"><audio controls src="${messageData.attachment.url}"></audio></div>`;
        }
    }
    
    // Format timestamp
    const timestamp = messageData.timestamp?.toDate ? 
        formatTime(messageData.timestamp.toDate()) : 
        'Just now';
    
    // Check if user can edit/delete
    const canEdit = isSent || (currentChatType === 'group' && messageData.senderId === currentUser.uid);
    const canDelete = isSent || (currentChatType === 'group' && 
        (messageData.senderId === currentUser.uid || isGroupAdmin()));
    
    messageElement.innerHTML = `
        <div class="message-content">${messageContent}</div>
        <div class="message-time">${timestamp}</div>
        <div class="message-actions">
            ${canEdit ? `<button class="message-action-btn" onclick="showMessageActions('${messageId}')"><i class="fas fa-ellipsis-v"></i></button>` : ''}
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

// Send a message
async function sendMessage() {
    if (!currentUser || !currentChat) {
        alert('Please select a chat first');
        return;
    }
    
    const messageInput = document.getElementById('message-input');
    const content = messageInput.value.trim();
    
    if (!content && !window.currentAttachment) {
        return;
    }
    
    try {
        // Show sending indicator
        const tempId = 'temp_' + Date.now();
        const messageData = {
            chatId: currentChat,
            senderId: currentUser.uid,
            content: content,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'sending',
            readBy: [currentUser.uid]
        };
        
        // Add attachment if exists
        if (window.currentAttachment) {
            messageData.attachment = window.currentAttachment;
        }
        
        // Add to Firestore
        await db.collection('messages').add(messageData);
        
        // Update chat's last message
        await db.collection('chats').doc(currentChat).update({
            lastMessage: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
            [`unreadCount.${currentUser.uid}`]: 0
        });
        
        // Increment unread count for other participants
        const chatDoc = await db.collection('chats').doc(currentChat).get();
        const chatData = chatDoc.data();
        
        chatData.participants.forEach(async (participantId) => {
            if (participantId !== currentUser.uid) {
                await db.collection('chats').doc(currentChat).update({
                    [`unreadCount.${participantId}`]: firebase.firestore.FieldValue.increment(1)
                });
            }
        });
        
        // Clear input and attachment
        messageInput.value = '';
        window.currentAttachment = null;
        
        // Scroll to bottom
        scrollToBottom();
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Error sending message: ' + error.message);
    }
}

// Load groups
async function loadGroups() {
    if (!currentUser) return;
    
    const groupsList = document.getElementById('groups-tab');
    groupsList.innerHTML = '<div class="loading-item">Loading groups...</div>';
    
    try {
        const groupsQuery = db.collection('chats')
            .where('participants', 'array-contains', currentUser.uid)
            .where('type', '==', 'group')
            .orderBy('lastMessageTime', 'desc');
        
        const unsubscribe = groupsQuery.onSnapshot((snapshot) => {
            const groups = [];
            snapshot.forEach(doc => {
                groups.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            displayGroups(groups);
        }, (error) => {
            console.error('Error loading groups:', error);
            groupsList.innerHTML = '<div class="error-item">Error loading groups</div>';
        });
        
        groupListeners.push(unsubscribe);
        
    } catch (error) {
        console.error('Error setting up groups listener:', error);
        groupsList.innerHTML = '<div class="error-item">Error loading groups</div>';
    }
}

// Display groups
function displayGroups(groups) {
    const groupsList = document.getElementById('groups-tab');
    
    if (groups.length === 0) {
        groupsList.innerHTML = '<div class="empty-state">No groups yet. Create one!</div>';
        return;
    }
    
    groupsList.innerHTML = '';
    
    groups.forEach(group => {
        const groupElement = document.createElement('div');
        groupElement.className = 'group-item';
        groupElement.dataset.groupId = group.id;
        
        const lastMessage = group.lastMessage || 'No messages yet';
        const lastMessageTime = group.lastMessageTime ? formatTime(group.lastMessageTime.toDate()) : '';
        const memberCount = group.participants ? group.participants.length : 1;
        const unreadCount = group.unreadCount && group.unreadCount[currentUser.uid] || 0;
        
        groupElement.innerHTML = `
            <img src="${group.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=00509E&color=fff`}" 
                 alt="${group.name}" class="group-avatar">
            <div class="group-info">
                <div class="group-name">${group.name}</div>
                <div class="group-last-message">${lastMessage}</div>
            </div>
            <div class="group-meta">
                <div class="group-time">${lastMessageTime}</div>
                <div class="group-members">${memberCount} <i class="fas fa-users"></i></div>
                ${unreadCount > 0 ? `<div class="unread-count">${unreadCount}</div>` : ''}
            </div>
        `;
        
        groupElement.addEventListener('click', () => openChat(group.id, 'group'));
        groupsList.appendChild(groupElement);
    });
}

// Load contacts
async function loadContacts() {
    if (!currentUser) return;
    
    const contactsList = document.getElementById('contacts-tab');
    contactsList.innerHTML = '<div class="loading-item">Loading contacts...</div>';
    
    try {
        // Get all users except current user
        const usersQuery = db.collection('users')
            .where('isGuest', '==', false)
            .orderBy('displayName');
        
        const unsubscribe = usersQuery.onSnapshot((snapshot) => {
            const contacts = [];
            snapshot.forEach(doc => {
                if (doc.id !== currentUser.uid) {
                    contacts.push({
                        id: doc.id,
                        ...doc.data()
                    });
                }
            });
            
            displayContacts(contacts);
        }, (error) => {
            console.error('Error loading contacts:', error);
            contactsList.innerHTML = '<div class="error-item">Error loading contacts</div>';
        });
        
        contactListeners.push(unsubscribe);
        
    } catch (error) {
        console.error('Error setting up contacts listener:', error);
        contactsList.innerHTML = '<div class="error-item">Error loading contacts</div>';
    }
}

// Display contacts
function displayContacts(contacts) {
    const contactsList = document.getElementById('contacts-tab');
    
    if (contacts.length === 0) {
        contactsList.innerHTML = '<div class="empty-state">No contacts found</div>';
        return;
    }
    
    contactsList.innerHTML = '';
    
    contacts.forEach(contact => {
        const contactElement = document.createElement('div');
        contactElement.className = 'contact-item';
        contactElement.dataset.contactId = contact.id;
        
        contactElement.innerHTML = `
            <img src="${contact.photoURL}" alt="${contact.displayName}" class="contact-avatar">
            <div class="contact-info">
                <div class="contact-name">${contact.displayName}</div>
                <div class="contact-role">${contact.role}</div>
            </div>
            <div class="contact-status">
                <span class="status-dot ${contact.isOnline ? 'online' : 'offline'}"></span>
            </div>
        `;
        
        contactElement.addEventListener('click', () => startPrivateChat(contact.id));
        contactsList.appendChild(contactElement);
    });
}

// Start a private chat
async function startPrivateChat(otherUserId) {
    try {
        // Check if chat already exists
        const existingChatQuery = await db.collection('chats')
            .where('participants', 'array-contains', currentUser.uid)
            .where('type', '==', 'private')
            .get();
        
        let existingChat = null;
        
        existingChatQuery.forEach(doc => {
            const chatData = doc.data();
            if (chatData.participants.includes(otherUserId)) {
                existingChat = doc.id;
            }
        });
        
        if (existingChat) {
            // Open existing chat
            openChat(existingChat, 'private');
        } else {
            // Create new chat
            const chatData = {
                participants: [currentUser.uid, otherUserId],
                type: 'private',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: null,
                lastMessageTime: null,
                unreadCount: {
                    [currentUser.uid]: 0,
                    [otherUserId]: 0
                }
            };
            
            const chatRef = await db.collection('chats').add(chatData);
            
            // Open the new chat
            openChat(chatRef.id, 'private');
        }
        
        // Close modal
        closeModal('new-chat-modal');
        
    } catch (error) {
        console.error('Error starting private chat:', error);
        alert('Error starting chat: ' + error.message);
    }
}

// Create a new group
async function createGroup() {
    const groupName = document.getElementById('group-name').value.trim();
    const selectedMembers = Array.from(document.querySelectorAll('.selected-member')).map(el => el.dataset.userId);
    
    if (!groupName) {
        alert('Please enter a group name');
        return;
    }
    
    if (selectedMembers.length === 0) {
        alert('Please add at least one member');
        return;
    }
    
    try {
        // Add current user to participants
        const participants = [currentUser.uid, ...selectedMembers];
        
        const groupData = {
            name: groupName,
            participants: participants,
            type: 'group',
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            admins: [currentUser.uid],
            lastMessage: null,
            lastMessageTime: null,
            unreadCount: {}
        };
        
        // Initialize unread counts
        participants.forEach(participantId => {
            groupData.unreadCount[participantId] = 0;
        });
        
        const groupRef = await db.collection('chats').add(groupData);
        
        // Open the new group
        openChat(groupRef.id, 'group');
        
        // Close modal
        closeModal('new-group-modal');
        
        // Reset form
        document.getElementById('group-name').value = '';
        document.getElementById('selected-members').innerHTML = '';
        
        // Show success message
        showNotification({ content: `Group "${groupName}" created successfully` });
        
    } catch (error) {
        console.error('Error creating group:', error);
        alert('Error creating group: ' + error.message);
    }
}

// Switch between sidebar tabs
function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to clicked tab
    document.querySelector(`.sidebar-tab[onclick*="${tabName}"]`).classList.add('active');
    
    // Hide all lists
    document.querySelectorAll('.chats-list, .groups-list, .contacts-list').forEach(list => {
        list.classList.add('hidden');
    });
    
    // Show selected list
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
}

// Show new chat modal
function showNewChatModal() {
    loadUsersForNewChat();
    document.getElementById('new-chat-modal').classList.remove('hidden');
}

// Load users for new chat
async function loadUsersForNewChat() {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '<div class="loading-item">Loading users...</div>';
    
    try {
        const usersQuery = await db.collection('users')
            .where('isGuest', '==', false)
            .orderBy('displayName')
            .limit(50)
            .get();
        
        usersList.innerHTML = '';
        
        if (usersQuery.empty) {
            usersList.innerHTML = '<div class="empty-state">No users found</div>';
            return;
        }
        
        usersQuery.forEach(doc => {
            if (doc.id !== currentUser.uid) {
                const userData = doc.data();
                
                const userElement = document.createElement('div');
                userElement.className = 'user-item';
                userElement.dataset.userId = doc.id;
                
                userElement.innerHTML = `
                    <img src="${userData.photoURL}" alt="${userData.displayName}" class="user-avatar">
                    <div class="user-info">
                        <div class="user-name">${userData.displayName}</div>
                        <div class="user-role">${userData.role}</div>
                    </div>
                `;
                
                userElement.addEventListener('click', () => startPrivateChat(doc.id));
                usersList.appendChild(userElement);
            }
        });
        
    } catch (error) {
        console.error('Error loading users:', error);
        usersList.innerHTML = '<div class="error-item">Error loading users</div>';
    }
}

// Search chats
function searchChats(query) {
    const chatItems = document.querySelectorAll('.chat-item');
    
    chatItems.forEach(item => {
        const chatName = item.querySelector('.chat-name').textContent.toLowerCase();
        const lastMessage = item.querySelector('.chat-last-message').textContent.toLowerCase();
        const searchTerm = query.toLowerCase();
        
        if (chatName.includes(searchTerm) || lastMessage.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Search users
function searchUsers(query) {
    const userItems = document.querySelectorAll('.user-item');
    
    userItems.forEach(item => {
        const userName = item.querySelector('.user-name').textContent.toLowerCase();
        const userRole = item.querySelector('.user-role').textContent.toLowerCase();
        const searchTerm = query.toLowerCase();
        
        if (userName.includes(searchTerm) || userRole.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Show profile modal
async function showProfileModal() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            const profileContent = document.getElementById('profile-content');
            profileContent.innerHTML = `
                <div class="profile-header">
                    <img src="${userData.photoURL}" alt="Profile" class="profile-avatar">
                    <h3>${userData.displayName}</h3>
                    <p>${userData.role}</p>
                </div>
                <div class="profile-details">
                    <div class="detail-item">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${userData.email || 'Not provided'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value ${userData.isOnline ? 'online' : 'offline'}">
                            ${userData.isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Member Since:</span>
                        <span class="detail-value">${userData.createdAt ? formatDate(userData.createdAt.toDate()) : 'Unknown'}</span>
                    </div>
                </div>
                <div class="profile-actions">
                    <button class="profile-action-btn" onclick="updateProfile()">
                        <i class="fas fa-edit"></i> Edit Profile
                    </button>
                    <button class="profile-action-btn" onclick="changePassword()">
                        <i class="fas fa-key"></i> Change Password
                    </button>
                </div>
            `;
        }
        
        document.getElementById('profile-modal').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Error loading profile: ' + error.message);
    }
}

// Toggle attachments menu
function toggleAttachments() {
    const menu = document.getElementById('attachments-menu');
    menu.classList.toggle('hidden');
}

// Attach file
function attachFile(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.txt';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            // Show uploading indicator
            showNotification({ content: 'Uploading file...' });
            
            // Upload to Firebase Storage
            const storageRef = storage.ref();
            const fileRef = storageRef.child(`attachments/${currentUser.uid}/${Date.now()}_${file.name}`);
            const uploadTask = await fileRef.put(file);
            const downloadURL = await uploadTask.ref.getDownloadURL();
            
            // Set current attachment
            window.currentAttachment = {
                type: type,
                url: downloadURL,
                name: file.name,
                size: file.size
            };
            
            // Hide attachments menu
            document.getElementById('attachments-menu').classList.add('hidden');
            
            // Show success notification
            showNotification({ content: 'File attached successfully' });
            
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file: ' + error.message);
        }
    };
    
    input.click();
}

// Start audio recording
async function startAudioRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Upload audio
            const storageRef = storage.ref();
            const audioRef = storageRef.child(`audio/${currentUser.uid}/${Date.now()}.webm`);
            await audioRef.put(audioBlob);
            const downloadURL = await audioRef.getDownloadURL();
            
            // Set as attachment
            window.currentAttachment = {
                type: 'audio',
                url: downloadURL,
                duration: Math.floor(audioChunks.length / 1000) // Approximate duration
            };
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
            
            // Show notification
            showNotification({ content: 'Audio recorded and attached' });
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        // Show recording controls
        document.getElementById('recording-controls').classList.remove('hidden');
        document.getElementById('message-input').style.display = 'none';
        
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Error accessing microphone: ' + error.message);
    }
}

// Stop audio recording
function stopAudioRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        // Hide recording controls
        document.getElementById('recording-controls').classList.add('hidden');
        document.getElementById('message-input').style.display = 'block';
    }
}

// Show message actions
function showMessageActions(messageId) {
    selectedMessageId = messageId;
    document.getElementById('message-actions-modal').classList.remove('hidden');
}

// Edit message
async function editMessage() {
    if (!selectedMessageId) return;
    
    try {
        const messageDoc = await db.collection('messages').doc(selectedMessageId).get();
        const messageData = messageDoc.data();
        
        if (messageData.senderId !== currentUser.uid) {
            alert('You can only edit your own messages');
            return;
        }
        
        const newContent = prompt('Edit your message:', messageData.content);
        
        if (newContent && newContent !== messageData.content) {
            await db.collection('messages').doc(selectedMessageId).update({
                content: newContent,
                edited: true,
                editedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        closeModal('message-actions-modal');
        selectedMessageId = null;
        
    } catch (error) {
        console.error('Error editing message:', error);
        alert('Error editing message: ' + error.message);
    }
}

// Delete message
async function deleteMessage() {
    if (!selectedMessageId) return;
    
    if (!confirm('Are you sure you want to delete this message?')) {
        closeModal('message-actions-modal');
        selectedMessageId = null;
        return;
    }
    
    try {
        const messageDoc = await db.collection('messages').doc(selectedMessageId).get();
        const messageData = messageDoc.data();
        
        // Check permissions
        const canDelete = messageData.senderId === currentUser.uid || 
                         (currentChatType === 'group' && isGroupAdmin());
        
        if (!canDelete) {
            alert('You do not have permission to delete this message');
            return;
        }
        
        // Soft delete (mark as deleted)
        await db.collection('messages').doc(selectedMessageId).update({
            deleted: true,
            deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
            deletedBy: currentUser.uid
        });
        
        closeModal('message-actions-modal');
        selectedMessageId = null;
        
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message: ' + error.message);
    }
}

// Copy message
function copyMessage() {
    // Implementation for copying message text
    // You would need to get the message content first
    alert('Copy functionality to be implemented');
    closeModal('message-actions-modal');
    selectedMessageId = null;
}

// Mark messages as read
async function markMessagesAsRead(chatId) {
    try {
        // Update chat's unread count for current user
        await db.collection('chats').doc(chatId).update({
            [`unreadCount.${currentUser.uid}`]: 0
        });
        
        // Mark individual messages as read
        const unreadMessages = await db.collection('messages')
            .where('chatId', '==', chatId)
            .where('senderId', '!=', currentUser.uid)
            .where('readBy', 'not-array-contains', currentUser.uid)
            .get();
        
        const batch = db.batch();
        
        unreadMessages.forEach(doc => {
            const messageRef = db.collection('messages').doc(doc.id);
            batch.update(messageRef, {
                readBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
            });
        });
        
        if (!unreadMessages.empty) {
            await batch.commit();
        }
        
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// Mark single message as read
async function markMessageAsRead(chatId, messageId) {
    try {
        await db.collection('messages').doc(messageId).update({
            readBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
        });
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

// Check if user is group admin
function isGroupAdmin() {
    // This would check if current user is admin in current group
    // Implementation depends on your group structure
    return false;
}

// Check if chat is active
function isChatActive(chatId) {
    return currentChat === chatId;
}

// Close current chat listeners
function closeCurrentChat() {
    messageListeners.forEach(unsubscribe => unsubscribe());
    messageListeners = [];
}

// Scroll to bottom of messages
function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Format time
function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Less than 1 minute
        return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    } else if (diff < 604800000) { // Less than 1 week
        const days = Math.floor(diff / 86400000);
        return `${days}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Format date
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Show notification
function showNotification(messageData) {
    const notificationContainer = document.getElementById('notification-container');
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-comment-alt"></i>
        <div>
            <strong>New Message</strong>
            <p>${messageData.content?.substring(0, 50) || 'New message'}</p>
        </div>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    // Update notification count
    updateNotificationCount();
}

// Update notification count
function updateNotificationCount() {
    // This would count unread messages across all chats
    // Implementation depends on your data structure
}

// Request notification permission
async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        try {
            await Notification.requestPermission();
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }
}

// Handle key press in message input
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Toggle emoji picker
function toggleEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    picker.classList.toggle('hidden');
    
    if (!picker.classList.contains('hidden')) {
        // Load emojis
        // This would require an emoji library or API
    }
}

// View image in full screen
function viewImage(url) {
    const modal = document.createElement('div');
    modal.className = 'image-modal modal';
    modal.innerHTML = `
        <div class="image-modal-content">
            <button class="close-image-modal" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
            <img src="${url}" alt="Full size">
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Initialize when Firebase is ready
if (typeof firebase !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        if (user && authStateChecked) {
            initializeChat();
        }
    });
}

// Make functions globally available
window.openChat = openChat;
window.sendMessage = sendMessage;
window.showNewChatModal = showNewChatModal;
window.createGroup = createGroup;
window.switchTab = switchTab;
window.toggleAttachments = toggleAttachments;
window.attachFile = attachFile;
window.startAudioRecording = startAudioRecording;
window.stopAudioRecording = stopAudioRecording;
window.showMessageActions = showMessageActions;
window.editMessage = editMessage;
window.deleteMessage = deleteMessage;
window.copyMessage = copyMessage;
window.closeModal = closeModal;
window.viewImage = viewImage;
window.toggleEmojiPicker = toggleEmojiPicker;
window.handleKeyPress = handleKeyPress;