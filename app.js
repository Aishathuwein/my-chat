// ============================
// SECURECHAT APP - SIMPLIFIED VERSION
// ============================

// Global variables
let currentUser = null;
let currentChat = null;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing app...");
    initializeApp();
});

// Initialize the entire application
function initializeApp() {
    console.log("Initializing Firebase...");
    
    try {
        // Check if Firebase config exists
        if (!window.firebaseConfig) {
            throw new Error("Firebase config not found! Check index.html");
        }
        
        console.log("Firebase Config:", firebaseConfig);
        
        // Initialize Firebase
        const app = firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase initialized successfully!");
        
        // Get Firebase services
        const auth = firebase.auth();
        const db = firebase.firestore();
        
        console.log("Firebase services ready:", { auth, db });
        
        // Setup authentication state listener
        auth.onAuthStateChanged(function(user) {
            console.log("Auth state changed:", user ? "User logged in" : "No user");
            handleAuthStateChange(user);
        });
        
        // Setup event listeners
        setupEventListeners();
        
        // Test Firebase connection
        testFirebaseConnection();
        
    } catch (error) {
        console.error("❌ Firebase initialization failed:", error);
        showError("Firebase Error: " + error.message);
    }
}

// Test Firebase connection
function testFirebaseConnection() {
    console.log("Testing Firebase connection...");
    const auth = firebase.auth();
    
    // Try a simple operation
    auth.onAuthStateChanged(function(user) {
        console.log("✅ Firebase connection test passed");
    }, function(error) {
        console.error("❌ Firebase connection test failed:", error);
    });
}

// Handle authentication state changes
function handleAuthStateChange(user) {
    console.log("handleAuthStateChange called with:", user?.email);
    
    if (user) {
        // User is signed in
        currentUser = user;
        showAppScreen();
        updateUserUI(user);
    } else {
        // User is signed out
        currentUser = null;
        showAuthScreen();
    }
}

// Show authentication screen
function showAuthScreen() {
    console.log("Showing auth screen");
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');
    
    if (authScreen && appScreen) {
        authScreen.style.display = 'flex';
        appScreen.style.display = 'none';
    }
}

// Show main app screen
function showAppScreen() {
    console.log("Showing app screen");
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');
    
    if (authScreen && appScreen) {
        authScreen.style.display = 'none';
        appScreen.style.display = 'flex';
    }
}

// Update user UI
function updateUserUI(user) {
    console.log("Updating UI for user:", user.email);
    
    // Update user name
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = user.displayName || user.email || "User";
    }
    
    // Update user email
    const userEmailElement = document.getElementById('user-email');
    if (userEmailElement) {
        userEmailElement.textContent = user.email;
    }
    
    // Update auth button
    const authButton = document.getElementById('auth-btn');
    if (authButton) {
        authButton.textContent = "Logout";
        authButton.onclick = logout;
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Login form
    const loginButton = document.getElementById('login-form')?.querySelector('button');
    if (loginButton) {
        loginButton.onclick = login;
    }
    
    // Register form
    const registerButton = document.getElementById('register-form')?.querySelector('button');
    if (registerButton) {
        registerButton.onclick = register;
    }
    
    // Google login button
    const googleButton = document.querySelector('.btn-google');
    if (googleButton) {
        googleButton.onclick = loginWithGoogle;
    }
    
    // Auth toggle links
    const showRegisterLink = document.querySelector('.auth-link[onclick*="showRegister"]');
    const showLoginLink = document.querySelector('.auth-link[onclick*="showLogin"]');
    
    if (showRegisterLink) {
        showRegisterLink.onclick = showRegisterForm;
    }
    if (showLoginLink) {
        showLoginLink.onclick = showLoginForm;
    }
    
    // Send message button
    const sendButton = document.getElementById('send-btn');
    if (sendButton) {
        sendButton.onclick = sendMessage;
    }
    
    console.log("Event listeners setup complete");
}

// ============================
// AUTHENTICATION FUNCTIONS
// ============================

async function login() {
    console.log("Login function called");
    
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    
    if (!email || !password) {
        showError("Please enter email and password");
        return;
    }
    
    try {
        showLoading("Logging in...");
        
        const auth = firebase.auth();
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        console.log("✅ Login successful:", userCredential.user.email);
        showSuccess("Login successful!");
        
    } catch (error) {
        console.error("❌ Login failed:", error);
        showError("Login failed: " + error.message);
    }
}

async function register() {
    console.log("Register function called");
    
    const name = document.getElementById('register-name')?.value;
    const email = document.getElementById('register-email')?.value;
    const password = document.getElementById('register-password')?.value;
    
    if (!name || !email || !password) {
        showError("Please fill all fields");
        return;
    }
    
    if (password.length < 6) {
        showError("Password must be at least 6 characters");
        return;
    }
    
    try {
        showLoading("Creating account...");
        
        const auth = firebase.auth();
        const db = firebase.firestore();
        
        // Create user with email/password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update profile with name
        await user.updateProfile({
            displayName: name
        });
        
        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isOnline: true,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log("✅ Registration successful:", user.email);
        showSuccess("Account created successfully!");
        
    } catch (error) {
        console.error("❌ Registration failed:", error);
        showError("Registration failed: " + error.message);
    }
}

async function loginWithGoogle() {
    console.log("Google login called");
    
    try {
        showLoading("Connecting with Google...");
        
        const auth = firebase.auth();
        const provider = new firebase.auth.GoogleAuthProvider();
        
        const userCredential = await auth.signInWithPopup(provider);
        const user = userCredential.user;
        
        // Check if user document exists
        const db = firebase.firestore();
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Create user document if doesn't exist
            await db.collection('users').doc(user.uid).set({
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isOnline: true,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        console.log("✅ Google login successful:", user.email);
        showSuccess("Google login successful!");
        
    } catch (error) {
        console.error("❌ Google login failed:", error);
        showError("Google login failed: " + error.message);
    }
}

async function logout() {
    console.log("Logout called");
    
    try {
        const auth = firebase.auth();
        await auth.signOut();
        
        console.log("✅ Logout successful");
        showSuccess("Logged out successfully");
        
    } catch (error) {
        console.error("❌ Logout failed:", error);
        showError("Logout failed: " + error.message);
    }
}

// ============================
// UI HELPER FUNCTIONS
// ============================

function showRegisterForm() {
    console.log("Showing register form");
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm && registerForm) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

function showLoginForm() {
    console.log("Showing login form");
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm && registerForm) {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    }
}

function showLoading(message) {
    console.log("Loading:", message);
    // You can add a loading spinner here
}

function showSuccess(message) {
    console.log("Success:", message);
    alert(message); // Replace with better UI notification
}

function showError(message) {
    console.error("Error:", message);
    alert("❌ " + message); // Replace with better UI notification
}

// ============================
// MESSAGING FUNCTIONS (BASIC)
// ============================

async function sendMessage() {
    if (!currentUser) {
        showError("Please login first");
        return;
    }
    
    if (!currentChat) {
        showError("Please select a chat first");
        return;
    }
    
    const messageInput = document.getElementById('message-input');
    const message = messageInput?.value?.trim();
    
    if (!message) {
        showError("Please enter a message");
        return;
    }
    
    try {
        const db = firebase.firestore();
        
        // Encrypt message (basic implementation)
        const encryptedMessage = window.encryption?.encryptMessage?.(message, currentChat) || message;
        
        // Send message to Firestore
        await db.collection('chats').doc(currentChat).collection('messages').add({
            text: encryptedMessage,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || currentUser.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            isEncrypted: !!window.encryption
        });
        
        // Update last message
        await db.collection('chats').doc(currentChat).update({
            lastMessage: message,
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
            lastSenderId: currentUser.uid
        });
        
        // Clear input
        if (messageInput) {
            messageInput.value = '';
        }
        
        console.log("✅ Message sent");
        
    } catch (error) {
        console.error("❌ Failed to send message:", error);
        showError("Failed to send message: " + error.message);
    }
}

// ============================
// DEBUG FUNCTIONS
// ============================

// Test if everything is working
function testAll() {
    console.log("=== TESTING EVERYTHING ===");
    
    // Test 1: Check Firebase config
    console.log("1. Firebase config:", window.firebaseConfig ? "✅ Found" : "❌ Missing");
    
    // Test 2: Check Firebase initialization
    try {
        const apps = firebase.apps;
        console.log("2. Firebase apps:", apps.length > 0 ? "✅ Initialized" : "❌ Not initialized");
    } catch (e) {
        console.log("2. Firebase:", "❌ Not loaded");
    }
    
    // Test 3: Check DOM elements
    const elements = ['auth-screen', 'app-screen', 'login-email', 'register-name'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        console.log(`3. ${id}:`, el ? "✅ Found" : "❌ Missing");
    });
    
    // Test 4: Check current user
    console.log("4. Current user:", currentUser ? "✅ Logged in" : "❌ Not logged in");
    
    console.log("=== TEST COMPLETE ===");
}

// Run test on load
setTimeout(() => {
    console.log("App initialized. Type 'testAll()' in console to test everything.");
}, 1000);

// ============================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================

window.login = login;
window.register = register;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.sendMessage = sendMessage;
window.testAll = testAll;
