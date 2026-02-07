// DOM Elements
let currentUser = null;
let authStateChecked = false;

// Check authentication state
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in
            currentUser = user;
            
            // Check if user exists in Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                // Create user profile if doesn't exist
                await createUserProfile(user);
            } else {
                // Update last seen
                await db.collection('users').doc(user.uid).update({
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                    isOnline: true
                });
            }
            
            // Load chat interface
            showChatInterface();
            loadUserData();
            loadChats();
            loadContacts();
            loadGroups();
            
            // Set up real-time listeners
            setupRealtimeListeners();
            
            // Request notification permission
            requestNotificationPermission();
            
            // Set up presence
            setupPresence();
            
        } else {
            // User is signed out
            currentUser = null;
            showAuthScreen();
        }
        authStateChecked = true;
    });
}

// Show authentication screen
function showAuthScreen() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('chat-container').classList.add('hidden');
}

// Show chat interface
function showChatInterface() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('chat-container').classList.remove('hidden');
    document.getElementById('loading-screen').style.display = 'none';
}

// Show tab in auth screen
function showTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.add('hidden');
    });
    
    // Add active class to clicked tab
    document.querySelector(`.auth-tab[onclick*="${tabName}"]`).classList.add('active');
    
    // Show corresponding form
    document.getElementById(`${tabName}-form`).classList.remove('hidden');
}

// Login function
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    if (!email || !password) {
        showError(errorElement, 'Please fill in all fields');
        return;
    }
    
    try {
        showLoading(true);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('User logged in:', userCredential.user.uid);
        
        // Clear form
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        showError(errorElement, '');
        
    } catch (error) {
        console.error('Login error:', error);
        showError(errorElement, getErrorMessage(error.code));
    } finally {
        showLoading(false);
    }
}

// Register function
async function register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    const errorElement = document.getElementById('register-error');
    
    if (!name || !email || !password) {
        showError(errorElement, 'Please fill in all fields');
        return;
    }
    
    if (!email.includes('@zanzibaruniversity.ac.tz')) {
        showError(errorElement, 'Please use your university email');
        return;
    }
    
    try {
        showLoading(true);
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Create user profile in Firestore
        await createUserProfile(userCredential.user, name, role);
        
        // Clear form
        document.getElementById('register-name').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        showError(errorElement, '');
        
    } catch (error) {
        console.error('Registration error:', error);
        showError(errorElement, getErrorMessage(error.code));
    } finally {
        showLoading(false);
    }
}

// Guest login function
async function loginAsGuest() {
    const name = document.getElementById('guest-name').value || 'Guest User';
    const errorElement = document.getElementById('guest-error');
    
    try {
        showLoading(true);
        const userCredential = await auth.signInAnonymously();
        
        // Create guest profile
        await createUserProfile(userCredential.user, name, 'guest');
        
        // Clear form
        document.getElementById('guest-name').value = '';
        showError(errorElement, '');
        
    } catch (error) {
        console.error('Guest login error:', error);
        showError(errorElement, getErrorMessage(error.code));
    } finally {
        showLoading(false);
    }
}

// Create user profile in Firestore
async function createUserProfile(user, displayName = null, role = 'student') {
    try {
        const userData = {
            uid: user.uid,
            email: user.email || null,
            displayName: displayName || user.displayName || 'User',
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            isOnline: true,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=003366&color=fff`,
            isGuest: user.isAnonymous || false
        };
        
        await db.collection('users').doc(user.uid).set(userData);
        console.log('User profile created:', user.uid);
        
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
}

// Load user data
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Update UI
            document.getElementById('user-name').textContent = userData.displayName;
            document.getElementById('user-avatar').src = userData.photoURL;
            
            // Update header
            document.getElementById('current-chat-name').textContent = `Welcome, ${userData.displayName}`;
        }
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Logout function
async function logout() {
    try {
        // Update user status to offline
        if (currentUser) {
            await db.collection('users').doc(currentUser.uid).update({
                isOnline: false,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Sign out
        await auth.signOut();
        currentUser = null;
        
        // Clear all listeners and data
        clearAllListeners();
        
        // Show auth screen
        showAuthScreen();
        
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
    }
}

// Set up presence system
function setupPresence() {
    if (!currentUser) return;
    
    // User is online
    const userStatusRef = db.collection('users').doc(currentUser.uid);
    
    // Update online status
    userStatusRef.update({
        isOnline: true,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Set up disconnect handler
    const isOfflineForFirestore = {
        isOnline: false,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
    };
    
    db.collection('users').doc(currentUser.uid).onDisconnect().update(isOfflineForFirestore);
}

// Show error message
function showError(element, message) {
    element.textContent = message;
    element.style.display = message ? 'block' : 'none';
}

// Show loading state
function showLoading(isLoading) {
    const button = event?.target || document.querySelector('.auth-button');
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    } else {
        button.disabled = false;
        // Reset button text based on which button it was
        if (button.classList.contains('guest-button')) {
            button.innerHTML = '<i class="fas fa-user-secret"></i> Enter as Guest';
        } else if (button.textContent.includes('Login')) {
            button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        } else {
            button.innerHTML = '<i class="fas fa-user-plus"></i> Register';
        }
    }
}

// Get user-friendly error messages
function getErrorMessage(errorCode) {
    const errors = {
        'auth/invalid-email': 'Invalid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'Email already in use',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/operation-not-allowed': 'Operation not allowed',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/too-many-requests': 'Too many attempts. Please try again later',
        'auth/requires-recent-login': 'Please login again',
        'auth/anonymous-upgrade-conflict': 'Cannot upgrade anonymous account'
    };
    
    return errors[errorCode] || 'An error occurred. Please try again.';
}

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// Show user profile modal
function showUserProfile() {
    // This will be implemented in chat.js
    showProfileModal();
}

// Clear all listeners
function clearAllListeners() {
    // Clear Firestore listeners
    if (window.chatListeners) {
        chatListeners.forEach(unsubscribe => unsubscribe());
        window.chatListeners = [];
    }
    
    if (window.messageListeners) {
        messageListeners.forEach(unsubscribe => unsubscribe());
        window.messageListeners = [];
    }
    
    if (window.groupListeners) {
        groupListeners.forEach(unsubscribe => unsubscribe());
        window.groupListeners = [];
    }
    
    if (window.contactListeners) {
        contactListeners.forEach(unsubscribe => unsubscribe());
        window.contactListeners = [];
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
});

// Make functions globally available
window.login = login;
window.register = register;
window.loginAsGuest = loginAsGuest;
window.showTab = showTab;
window.logout = logout;
window.toggleSidebar = toggleSidebar;
window.showUserProfile = showUserProfile;