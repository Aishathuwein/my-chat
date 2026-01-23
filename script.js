async function testChatSystem() {
    console.log('=== Testing Chat System ===');
    
    // Test 1: Check Firebase connection
    const connected = await testFirebase();
    if (!connected) {
        console.error('❌ Test 1 FAILED: Firebase not connected');
        return;
    }
    console.log('✅ Test 1 PASSED: Firebase connected');
    
    // Test 2: Check user authentication
    if (!currentUser) {
        console.error('❌ Test 2 FAILED: User not authenticated');
        return;
    }
    console.log('✅ Test 2 PASSED: User authenticated');
    
    // Test 3: Send test message
    const testMessage = {
        text: 'Test message ' + Date.now(),
        senderId: currentUser.uid,
        senderName: 'Test User',
        type: 'global',
        chatId: 'global',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('messages').add(testMessage);
        console.log('✅ Test 3 PASSED: Message sent successfully');
    } catch (error) {
        console.error('❌ Test 3 FAILED: Could not send message', error);
    }
    
    console.log('=== Tests Complete ===');
}

// Run tests after login
auth.onAuthStateChanged(async (user) => {
    if (user) {
        setTimeout(testChatSystem, 2000); // Run tests 2 seconds after login
    }
});
async function uploadFile(file) {
    const storageRef = firebase.storage().ref();
    const fileRef = storageRef.child(`files/${Date.now()}_${file.name}`);
    
    await fileRef.put(file);
    const url = await fileRef.getDownloadURL();
    
    await sendMessage({
        text: `File: ${file.name}`,
        fileUrl: url,
        fileName: file.name,
        fileType: file.type
    });
}
async function markAsRead(messageId) {
    await db.collection('messages').doc(messageId).update({
        read: true,
        readAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}
let typingTimeout;
function showTypingIndicator() {
    clearTimeout(typingTimeout);
    
    db.collection('typing').doc(currentChatId).set({
        userId: currentUser.uid,
        userName: currentUser.displayName,
        typing: true,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    typingTimeout = setTimeout(() => {
        db.collection('typing').doc(currentChatId).update({
            typing: false
        });
    }, 1000);
}
async function addReaction(messageId, emoji) {
    await db.collection('messages').doc(messageId).update({
        [`reactions.${emoji}`]: firebase.firestore.FieldValue.increment(1)
    });
}
// Debug functions
function toggleDebug() {
    const panel = document.getElementById('debug-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function updateDebugInfo() {
    const debugInfo = document.getElementById('debug-info');
    if (!debugInfo) return;
    
    debugInfo.innerHTML = `
        <div>User: ${currentUser ? currentUser.uid : 'Not logged in'}</div>
        <div>Chat Type: ${currentChatType}</div>
        <div>Chat ID: ${currentChatId}</div>
        <div>Recipient: ${currentRecipientId || 'None'}</div>
        <div>Online Users: ${Object.keys(onlineUsers).length}</div>
    `;
}

// Update debug info periodically
setInterval(updateDebugInfo, 2000);

// Show debug panel by default during development
document.getElementById('debug-panel').style.display = 'block';
// =================== MESSAGE FUNCTIONS ===================

// Fix: Generate chat ID for private messages
function generateChatId(user1, user2) {
    return [user1, user2].sort().join('_');
}

// Fix: Improved sendMessage function
async function sendMessage() {
    const messageText = messageInput.value.trim();
    if (!messageText || !currentUser) {
        console.log('No message text or user not logged in');
        return;
    }

    console.log('Sending message:', messageText);
    console.log('Current chat type:', currentChatType);
    console.log('Current chat ID:', currentChatId);
    console.log('Current recipient ID:', currentRecipientId);

    try {
        const messageData = {
            text: messageText,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || currentUser.email.split('@')[0],
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        };

        // Determine message type and set appropriate fields
        if (currentChatType === 'group') {
            if (currentChatId === 'global') {
                messageData.type = 'global';
                messageData.chatId = 'global';
                console.log('Sending global message');
            } else {
                messageData.type = 'group';
                messageData.chatId = currentChatId;
                messageData.groupId = currentChatId;
                console.log('Sending group message to:', currentChatId);
            }
        } else if (currentChatType === 'private' && currentRecipientId) {
            messageData.type = 'private';
            messageData.chatId = generateChatId(currentUser.uid, currentRecipientId);
            messageData.senderUid = currentUser.uid;
            messageData.receiverUid = currentRecipientId;
            console.log('Sending private message to:', currentRecipientId);
        } else {
            console.error('Invalid chat state');
            return;
        }

        // Add message to database
        const docRef = await db.collection('messages').add(messageData);
        console.log('✅ Message sent successfully with ID:', docRef.id);
        
        // Clear input
        messageInput.value = '';
        
        // Auto-scroll to bottom
        setTimeout(scrollToBottom, 100);
        
    } catch (error) {
        console.error('❌ Error sending message:', error);
        alert('Failed to send message: ' + error.message);
    }
}

// Fix: Listen to messages based on chat type
function setupMessageListener() {
    // Remove previous listener if exists
    if (window.messageListener) {
        window.messageListener();
    }

    console.log('Setting up message listener for:', currentChatType, currentChatId);

    let query;
    
    if (currentChatType === 'group') {
        if (currentChatId === 'global') {
            query = db.collection('messages')
                .where('type', '==', 'global')
                .orderBy('timestamp', 'asc');
        } else {
            query = db.collection('messages')
                .where('type', '==', 'group')
                .where('chatId', '==', currentChatId)
                .orderBy('timestamp', 'asc');
        }
    } else if (currentChatType === 'private' && currentRecipientId) {
        const chatId = generateChatId(currentUser.uid, currentRecipientId);
        query = db.collection('messages')
            .where('type', '==', 'private')
            .where('chatId', '==', chatId)
            .orderBy('timestamp', 'asc');
    } else {
        console.error('Cannot setup listener: invalid chat state');
        return;
    }

    // Set up real-time listener
    window.messageListener = query.onSnapshot(
        (snapshot) => {
            console.log('📨 New messages received:', snapshot.docs.length);
            
            // Clear messages only on first load
            if (!messagesDiv.dataset.initialized) {
                messagesDiv.innerHTML = '';
                messagesDiv.dataset.initialized = 'true';
            }
            
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const message = change.doc.data();
                    displayMessage(message);
                }
            });
            
            scrollToBottom();
        },
        (error) => {
            console.error('❌ Error listening to messages:', error);
        }
    );
}

// Fix: Display message with better formatting
function displayMessage(message) {
    if (!message.senderName || !message.text) {
        console.warn('Invalid message data:', message);
        return;
    }

    const messageDiv = document.createElement('div');
    const isCurrentUser = message.senderId === currentUser.uid;
    
    messageDiv.className = `message ${isCurrentUser ? 'message-sent' : 'message-received'}`;
    
    const time = message.timestamp ? 
        new Date(message.timestamp.toDate()).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        }) : 
        'Just now';

    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-sender">
                ${isCurrentUser ? 'You' : message.senderName}
            </div>
            <div class="message-text">${message.text}</div>
            <div class="message-info">
                <span class="message-time">${time}</span>
                ${isCurrentUser ? '<span class="message-status">✓✓</span>' : ''}
            </div>
        </div>
    `;

    messagesDiv.appendChild(messageDiv);
    
    // Add animation
    messageDiv.style.animation = 'fadeIn 0.3s';
}

// Fix: Scroll to bottom function
function scrollToBottom() {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Fix: Switch chat function
function switchToChat(chatId, title) {
    console.log('Switching to chat:', chatId, title);
    
    currentChatId = chatId;
    chatTitle.textContent = title;
    
    // Reset message div
    messagesDiv.innerHTML = '';
    delete messagesDiv.dataset.initialized;
    
    // Set chat info
    if (currentChatType === 'group') {
        chatInfo.textContent = chatId === 'global' ? 'Public Group' : 'Private Group';
    } else {
        chatInfo.textContent = 'Direct Message';
    }
    
    // Set up message listener
    setupMessageListener();
    
    // Highlight active chat
    highlightActiveChat();
}

// Fix: Start private chat
function startPrivateChat(recipientId, recipientName) {
    console.log('Starting private chat with:', recipientId, recipientName);
    
    currentChatType = 'private';
    currentRecipientId = recipientId;
    
    // Update UI
    document.getElementById('btn-group').classList.remove('active');
    document.getElementById('btn-private').classList.add('active');
    
    // Generate chat ID
    const chatId = generateChatId(currentUser.uid, recipientId);
    
    // Switch to chat
    switchToChat(chatId, `Chat with ${recipientName}`);
}

// Fix: Switch to group
function switchToGroup(groupId, groupName) {
    console.log('Switching to group:', groupId, groupName);
    
    currentChatType = 'group';
    currentChatId = groupId;
    currentRecipientId = null;
    
    // Update UI
    document.getElementById('btn-group').classList.add('active');
    document.getElementById('btn-private').classList.remove('active');
    
    // Switch to chat
    switchToChat(groupId, groupName);
}

// Fix: Highlight active chat
function highlightActiveChat() {
    // Remove active class from all
    document.querySelectorAll('.user-item, .group-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current chat
    if (currentChatType === 'private' && currentRecipientId) {
        const userItem = Array.from(document.querySelectorAll('.user-item')).find(item => 
            item.textContent.includes(onlineUsers[currentRecipientId]?.displayName)
        );
        if (userItem) userItem.classList.add('active');
    } else if (currentChatType === 'group') {
        const groupItem = Array.from(document.querySelectorAll('.group-item')).find(item => 
            item.dataset.groupId === currentChatId || 
            (currentChatId === 'global' && item.textContent.includes('Global'))
        );
        if (groupItem) groupItem.classList.add('active');
    }
}