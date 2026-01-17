// ========================
// CONFIGURATION
// ========================
const CONFIG = {
    SUPABASE_URL: 'YOUR_SUPABASE_URL', // Replace with your Supabase URL
    SUPABASE_KEY: 'YOUR_SUPABASE_ANON_KEY', // Replace with your Supabase anon key
    UPLOADTHING_TOKEN: 'YOUR_UPLOADTHING_TOKEN', // Optional for file uploads
    OPENAI_API_KEY: 'YOUR_OPENAI_API_KEY' // Optional for AI features
};

// ========================
// INITIALIZATION
// ========================
let supabase;
let currentUser = null;
let currentChat = null;
let currentChatType = null; // 'dm' or 'group'
let typingTimeout = null;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let emojiPicker = null;

// DOM Elements
const elements = {
    app: document.getElementById('app'),
    loadingScreen: document.getElementById('loading-screen'),
    messageInput: document.getElementById('message-input'),
    messagesContainer: document.getElementById('messages-container'),
    conversationsContainer: document.getElementById('conversations-container'),
    sendBtn: document.getElementById('send-btn'),
    attachBtn: document.getElementById('attach-btn'),
    emojiBtn: document.getElementById('emoji-btn'),
    voiceBtn: document.getElementById('voice-btn'),
    fileInput: document.getElementById('file-input'),
    imageInput: document.getElementById('image-input'),
    uploadPreview: document.getElementById('upload-preview'),
    typingIndicator: document.getElementById('typing-indicator'),
    themeToggle: document.getElementById('theme-toggle'),
    loginModal: document.getElementById('login-modal'),
    newChatModal: document.getElementById('new-chat-modal'),
    newGroupModal: document.getElementById('new-group-modal')
};

// ========================
// SUPABASE SETUP
// ========================
async function initializeSupabase() {
    try {
        supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY, {
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            }
        });

        // Check auth state
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            currentUser = session.user;
            await setupUserProfile();
            await initializeEncryption();
            await loadChats();
            setupRealtime();
            hideLoading();
        } else {
            showLoginModal();
            hideLoading();
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                await setupUserProfile();
                await initializeEncryption();
                await loadChats();
                setupRealtime();
                hideLoginModal();
                hideLoading();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                showLoginModal();
            }
        });

    } catch (error) {
        console.error('Supabase init error:', error);
        showError('Failed to initialize chat system');
    }
}

// ========================
// USER PROFILE
// ========================
async function setupUserProfile() {
    if (!currentUser) return;

    // Check if user exists in users table
    const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (!existingUser) {
        // Create user profile
        const username = currentUser.email.split('@')[0];
        const avatarUrl = currentUser.user_metadata?.avatar_url || 
                         `https://ui-avatars.com/api/?name=${username}&background=007aff&color=fff`;
        
        const { error } = await supabase
            .from('users')
            .insert({
                id: currentUser.id,
                username: username,
                avatar_url: avatarUrl,
                online: true,
                last_seen: new Date().toISOString()
            });

        if (error) console.error('Error creating user:', error);
    } else {
        // Update online status
        await supabase
            .from('users')
            .update({ online: true, last_seen: new Date().toISOString() })
            .eq('id', currentUser.id);
    }

    // Update UI
    updateUserUI();
}

function updateUserUI() {
    const username = currentUser.user_metadata?.full_name || 
                    currentUser.email.split('@')[0];
    const avatar = currentUser.user_metadata?.avatar_url || 
                  `https://ui-avatars.com/api/?name=${username}&background=007aff&color=fff`;

    document.getElementById('username').textContent = username;
    document.getElementById('user-email').textContent = currentUser.email;
    document.getElementById('user-avatar').src = avatar;
}

// ========================
// ENCRYPTION
// ========================
async function initializeEncryption() {
    if (!currentUser) return;
    
    const success = await chatEncryption.initialize(currentUser.id);
    if (!success) {
        console.warn('Encryption initialization failed');
    }
}

// ========================
// CHAT MANAGEMENT
// ========================
async function loadChats() {
    if (!currentUser) return;

    try {
        // Load direct conversations
        const { data: conversations } = await supabase
            .from('user_conversations')
            .select(`
                conversation_id,
                other_user_id,
                conversations (
                    id,
                    updated_at
                )
            `)
            .eq('user_id', currentUser.id);

        // Load groups
        const { data: groups } = await supabase
            .from('group_members')
            .select(`
                group_id,
                groups (
                    id,
                    name,
                    avatar_url,
                    updated_at
                )
            `)
            .eq('user_id', currentUser.id);

        renderChatList(conversations || [], groups || []);

    } catch (error) {
        console.error('Error loading chats:', error);
    }
}

function renderChatList(conversations, groups) {
    const container = elements.conversationsContainer;
    container.innerHTML = '';

    // Add conversations
    conversations.forEach(conv => {
        const chatElement = createChatElement(conv, 'dm');
        container.appendChild(chatElement);
    });

    // Add groups
    groups.forEach(group => {
        const groupElement = createChatElement(group, 'group');
        container.appendChild(groupElement);
    });
}

function createChatElement(data, type) {
    const div = document.createElement('div');
    div.className = 'chat-item';
    div.dataset.id = type === 'dm' ? data.conversation_id : data.group_id;
    div.dataset.type = type;

    if (type === 'dm') {
        // For direct messages, we need to load the other user's info
        div.innerHTML = `
            <div class="chat-avatar">
                <img src="https://ui-avatars.com/api/?name=User&background=007aff&color=fff" alt="User">
                <span class="online-dot"></span>
            </div>
            <div class="chat-info">
                <h4>Loading...</h4>
                <p class="last-message">Tap to start chatting</p>
                <span class="chat-time">Just now</span>
            </div>
            <div class="unread-count">0</div>
        `;

        // Load user info
        loadUserInfo(data.other_user_id, div);
    } else {
        // Group chat
        div.innerHTML = `
            <div class="chat-avatar">
                <img src="${data.groups.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.groups.name)}&background=764ba2&color=fff`}" alt="${data.groups.name}">
                <span class="online-dot group-dot"></span>
            </div>
            <div class="chat-info">
                <h4>${data.groups.name}</h4>
                <p class="last-message">Group chat</p>
                <span class="chat-time">Just now</span>
            </div>
            <div class="unread-count">0</div>
        `;
    }

    div.addEventListener('click', () => selectChat(data, type));
    return div;
}

async function loadUserInfo(userId, element) {
    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (user) {
        const avatar = element.querySelector('.chat-avatar img');
        const name = element.querySelector('.chat-info h4');
        const onlineDot = element.querySelector('.online-dot');

        avatar.src = user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=007aff&color=fff`;
        avatar.alt = user.username;
        name.textContent = user.username;
        onlineDot.style.background = user.online ? '#34c759' : '#999';
    }
}

// ========================
// MESSAGE HANDLING
// ========================
async function sendMessage() {
    const message = elements.messageInput.value.trim();
    const files = Array.from(elements.fileInput.files);
    
    if (!message && files.length === 0) return;

    if (!currentChat) {
        showError('Please select a chat first');
        return;
    }

    try {
        let messageData = {
            sender_id: currentUser.id,
            content: '',
            message_type: 'text',
            created_at: new Date().toISOString()
        };

        // Set conversation/group ID
        if (currentChatType === 'dm') {
            messageData.conversation_id = currentChat.conversation_id || currentChat.id;
        } else {
            messageData.group_id = currentChat.group_id || currentChat.id;
        }

        // Handle text message
        if (message) {
            // Encrypt message
            const encrypted = await chatEncryption.encryptMessage(message);
            
            messageData.content = message;
            messageData.encrypted_content = encrypted?.encrypted || message;
            messageData.message_type = 'text';
        }

        // Handle file uploads
        if (files.length > 0) {
            for (const file of files) {
                const uploadedFile = await uploadFile(file);
                if (uploadedFile) {
                    // Send file as separate message
                    const fileMessage = {
                        ...messageData,
                        content: file.name,
                        message_type: getFileType(file.type),
                        file_url: uploadedFile.url,
                        file_name: file.name,
                        file_size: file.size
                    };
                    
                    await saveMessage(fileMessage);
                }
            }
        } else {
            // Save text message
            await saveMessage(messageData);
        }

        // Clear input
        elements.messageInput.value = '';
        elements.fileInput.value = '';
        elements.uploadPreview.innerHTML = '';
        elements.uploadPreview.classList.remove('visible');
        
        // Play send sound
        playSound('send');

    } catch (error) {
        console.error('Error sending message:', error);
        showError('Failed to send message');
    }
}

async function saveMessage(messageData) {
    const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

    if (error) {
        console.error('Error saving message:', error);
        throw error;
    }

    return data;
}

async function loadMessages(chatId, type) {
    if (!chatId) return;

    const messagesContainer = elements.messagesContainer;
    messagesContainer.innerHTML = '<div class="welcome-message"><p>Loading messages...</p></div>';

    let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

    if (type === 'dm') {
        query = query.eq('conversation_id', chatId);
    } else {
        query = query.eq('group_id', chatId);
    }

    const { data: messages, error } = await query;

    if (error) {
        console.error('Error loading messages:', error);
        showError('Failed to load messages');
        return;
    }

    renderMessages(messages);
}

function renderMessages(messages) {
    const container = elements.messagesContainer;
    container.innerHTML = '';

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="welcome-message">
                <h2>No messages yet</h2>
                <p>Start the conversation by sending a message!</p>
            </div>
        `;
        return;
    }

    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        container.appendChild(messageElement);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function createMessageElement(message) {
    const isSent = message.sender_id === currentUser.id;
    const div = document.createElement('div');
    div.className = `message ${isSent ? 'sent' : 'received'}`;
    
    let content = '';
    const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    switch (message.message_type) {
        case 'text':
            content = `
                <div class="message-content">
                    <div class="message-text">${escapeHtml(message.content)}</div>
                    <span class="message-time">${time}</span>
                    ${isSent ? '<div class="message-status"><i class="fas fa-check"></i> Delivered</div>' : ''}
                </div>
            `;
            break;
            
        case 'image':
            content = `
                <div class="message-content">
                    <div class="image-message">
                        <img src="${message.file_url}" alt="Image" onclick="viewImage('${message.file_url}')">
                    </div>
                    <span class="message-time">${time}</span>
                </div>
            `;
            break;
            
        case 'file':
            content = `
                <div class="message-content">
                    <div class="file-message">
                        <div class="file-info">
                            <div class="file-icon">
                                <i class="fas fa-file"></i>
                            </div>
                            <div class="file-details">
                                <div class="file-name">${escapeHtml(message.file_name)}</div>
                                <div class="file-size">${formatFileSize(message.file_size)}</div>
                            </div>
                            <a href="${message.file_url}" download class="file-download">
                                <i class="fas fa-download"></i>
                            </a>
                        </div>
                    </div>
                    <span class="message-time">${time}</span>
                </div>
            `;
            break;
            
        case 'voice':
            content = `
                <div class="message-content">
                    <div class="voice-message">
                        <button class="voice-play-btn" onclick="playVoiceMessage('${message.file_url}')">
                            <i class="fas fa-play"></i>
                        </button>
                        <div class="voice-waveform"></div>
                        <span class="voice-duration">0:30</span>
                    </div>
                    <span class="message-time">${time}</span>
                </div>
            `;
            break;
            
        default:
            content = `
                <div class="message-content">
                    <div class="message-text">${escapeHtml(message.content)}</div>
                    <span class="message-time">${time}</span>
                </div>
            `;
    }
    
    div.innerHTML = content;
    return div;
}

// ========================
// FILE HANDLING
// ========================
async function uploadFile(file) {
    if (!CONFIG.UPLOADTHING_TOKEN) {
        // Fallback to base64 for demo
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve({
                    url: reader.result,
                    name: file.name,
                    size: file.size
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // Using Uploadthing service
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('https://uploadthing.com/api/uploadFile', {
            method: 'POST',
            headers: {
                'X-Uploadthing-Token': CONFIG.UPLOADTHING_TOKEN
            },
            body: formData
        });

        const data = await response.json();
        return {
            url: data.url,
            name: file.name,
            size: file.size
        };
    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
}

function handleFileUpload(event) {
    const files = event.target.files;
    const preview = elements.uploadPreview;
    
    preview.innerHTML = '';
    preview.classList.add('visible');
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            if (file.type.startsWith('image/')) {
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-preview" onclick="removePreview(this)">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            } else {
                previewItem.innerHTML = `
                    <div style="background:#007aff;color:white;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                        <i class="fas fa-file" style="font-size:24px;"></i>
                        <span style="font-size:10px;margin-top:5px;">${file.name}</span>
                    </div>
                    <button class="remove-preview" onclick="removePreview(this)">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
            
            preview.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
}

function removePreview(button) {
    const previewItem = button.closest('.preview-item');
    previewItem.remove();
    
    if (elements.uploadPreview.children.length === 0) {
        elements.uploadPreview.classList.remove('visible');
    }
}

// ========================
// VOICE MESSAGES
// ========================
async function startVoiceRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Convert to base64 for storage
            const reader = new FileReader();
            reader.onloadend = async () => {
                if (currentChat) {
                    const messageData = {
                        sender_id: currentUser.id,
                        content: 'Voice message',
                        message_type: 'voice',
                        file_url: reader.result,
                        file_name: 'voice-message.webm',
                        file_size: audioBlob.size,
                        created_at: new Date().toISOString()
                    };
                    
                    if (currentChatType === 'dm') {
                        messageData.conversation_id = currentChat.conversation_id || currentChat.id;
                    } else {
                        messageData.group_id = currentChat.group_id || currentChat.id;
                    }
                    
                    await saveMessage(messageData);
                }
            };
            reader.readAsDataURL(audioBlob);
            
            // Cleanup
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        document.getElementById('voice-recorder').classList.add('recording');
        
    } catch (error) {
        console.error('Recording error:', error);
        showError('Microphone access denied');
    }
}

function stopVoiceRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('voice-recorder').classList.remove('recording');
    }
}

// ========================
// REALTIME UPDATES
// ========================
function setupRealtime() {
    if (!supabase || !currentUser) return;

    // Listen for new messages
    const messagesChannel = supabase
        .channel('messages')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
        }, async (payload) => {
            // Check if this message is for current chat
            if (currentChat) {
                const message = payload.new;
                
                if (
                    (currentChatType === 'dm' && message.conversation_id === currentChat.id) ||
                    (currentChatType === 'group' && message.group_id === currentChat.id)
                ) {
                    // Add message to UI
                    const messageElement = createMessageElement(message);
                    elements.messagesContainer.appendChild(messageElement);
                    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
                    
                    // Play notification sound if not from current user
                    if (message.sender_id !== currentUser.id) {
                        playSound('message');
                    }
                }
            }
            
            // Update chat list
            loadChats();
        })
        .subscribe();

    // Listen for user status changes
    const usersChannel = supabase
        .channel('users')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'users'
        }, (payload) => {
            // Update online status in UI
            updateOnlineStatus(payload.new);
        })
        .subscribe();

    // Listen for typing indicators
    const typingChannel = supabase
        .channel('typing')
        .on('broadcast', { event: 'typing' }, (payload) => {
            if (currentChat && payload.payload.userId !== currentUser.id) {
                if (
                    (currentChatType === 'dm' && payload.payload.chatId === currentChat.id) ||
                    (currentChatType === 'group' && payload.payload.chatId === currentChat.id)
                ) {
                    showTypingIndicator(payload.payload.username);
                }
            }
        })
        .subscribe();
}

function sendTypingIndicator() {
    if (!currentChat || !supabase || !currentUser) return;

    clearTimeout(typingTimeout);
    
    supabase.channel('typing').send({
        type: 'broadcast',
        event: 'typing',
        payload: {
            userId: currentUser.id,
            username: currentUser.user_metadata?.full_name || currentUser.email,
            chatId: currentChat.id,
            type: currentChatType
        }
    });

    typingTimeout = setTimeout(() => {
        // Typing stopped
    }, 1000);
}

function showTypingIndicator(username) {
    const indicator = elements.typingIndicator;
    const userSpan = indicator.querySelector('#typing-user');
    
    userSpan.textContent = `${username} is typing...`;
    indicator.classList.add('visible');
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        indicator.classList.remove('visible');
    }, 3000);
}

// ========================
// UI HELPERS
// ========================
function showLoginModal() {
    elements.loginModal.classList.add('active');
}

function hideLoginModal() {
    elements.loginModal.classList.remove('active');
}

function showLoading() {
    elements.loadingScreen.style.display = 'flex';
    elements.app.style.display = 'none';
}

function hideLoading() {
    elements.loadingScreen.style.display = 'none';
    elements.app.style.display = 'flex';
}

function showError(message) {
    // Create error toast
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff3b30;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function playSound(type) {
    const sound = document.getElementById(`${type}-sound`);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Audio play failed:', e));
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'voice';
    if (mimeType.startsWith('video/')) return 'video';
    return 'file';
}

// ========================
// THEME MANAGEMENT
// ========================
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('chat-theme', newTheme);
    
    const icon = elements.themeToggle.querySelector('i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('chat-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const icon = elements.themeToggle.querySelector('i');
    icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ========================
// EMOJI PICKER
// ========================
function setupEmojiPicker() {
    emojiPicker = document.querySelector('emoji-picker');
    
    emojiPicker.addEventListener('emoji-click', event => {
        const input = elements.messageInput;
        const emoji = event.detail.unicode;
        const cursorPos = input.selectionStart;
        
        input.value = input.value.substring(0, cursorPos) + emoji + input.value.substring(cursorPos);
        input.focus();
        input.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        
        // Hide picker
        document.getElementById('emoji-picker-container').classList.remove('visible');
    });
    
    // Toggle picker
    elements.emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pickerContainer = document.getElementById('emoji-picker-container');
        pickerContainer.classList.toggle('visible');
    });
    
    // Hide picker when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.emoji-picker-container') && !e.target.closest('#emoji-btn')) {
            document.getElementById('emoji-picker-container').classList.remove('visible');
        }
    });
}

// ========================
// EVENT LISTENERS
// ========================
function setupEventListeners() {
    // Send message
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Typing indicator
    elements.messageInput.addEventListener('input', sendTypingIndicator);
    
    // File upload
    elements.attachBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileUpload);
    
    // Voice recording
    elements.voiceBtn.addEventListener('click', startVoiceRecording);
    document.getElementById('stop-recording').addEventListener('click', stopVoiceRecording);
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Social login buttons
    document.getElementById('google-login-btn').addEventListener('click', () => socialLogin('google'));
    document.getElementById('github-login-btn').addEventListener('click', () => socialLogin('github'));
    document.getElementById('email-login-btn').addEventListener('click', () => emailLogin());
    
    // New chat/group
    document.getElementById('new-chat-btn').addEventListener('click', showNewChatModal);
    document.getElementById('new-group-btn').addEventListener('click', showNewGroupModal);
}

async function socialLogin(provider) {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: window.location.origin
            }
        });
        
        if (error) throw error;
    } catch (error) {
        console.error('Login error:', error);
        showError('Login failed. Please try again.');
    }
}

async function emailLogin() {
    // Simple email login for demo
    const email = prompt('Enter your email for magic link:');
    if (email) {
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        
        if (error) {
            showError('Failed to send magic link');
        } else {
            showError('Check your email for magic link!');
        }
    }
}

// ========================
// INITIALIZATION
// ========================
async function init() {
    showLoading();
    loadTheme();
    setupEmojiPicker();
    setupEventListeners();
    await initializeSupabase();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

// Service Worker for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(console.error);
}

// Export useful functions to global scope
window.viewImage = function(url) {
    window.open(url, '_blank');
};

window.playVoiceMessage = function(url) {
    const audio = new Audio(url);
    audio.play().catch(e => console.log('Audio play failed:', e));
};

window.selectChat = function(chat, type) {
    currentChat = chat;
    currentChatType = type;
    
    // Update UI
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Load messages
    loadMessages(chat.id || chat.conversation_id, type);
    
    // Update chat header
    updateChatHeader();
};