// ============================
// SECURECHAT APP - WORKING VERSION
// ============================

// Global variables
let currentUser = null;
let auth = null;
let db = null;

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded. Initializing app...");
    initializeApp();
});

function initializeApp() {
    console.log("Step 1: Checking Firebase config...");
    
    // Check if firebaseConfig exists
    if (!window.firebaseConfig) {
        showError("Firebase config not found in window.firebaseConfig");
        document.getElementById('firebase-status').textContent = "❌ Config missing!";
        return;
    }
    
    console.log("✅ Config found:", window.firebaseConfig);
    document.getElementById('firebase-status').textContent = "✅ Config found";
    
    try {
        console.log("Step 2: Initializing Firebase...");
        
        // Initialize Firebase (only if not already initialized)
        let app;
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase initialized:", app.name);
        } else {
            app = firebase.apps[0];
            console.log("✅ Firebase already initialized:", app.name);
        }
        
        // Get Firebase services
        auth = firebase.auth();
        db = firebase.firestore();
        
        console.log("✅ Firebase services ready");
        
        // Setup authentication listener
        setupAuthListener();
        
        // Setup event listeners
        setupEventListeners();
        
        // Show success
        showToast("Firebase connected successfully!", "success");
        
    } catch (error) {
        console.error("❌ Firebase initialization failed:", error);
        showError("Firebase Error: " + error.message);
    }
}

function setupAuthListener() {
    console.log("Setting up auth listener...");
    
    auth.onAuthStateChanged(function(user) {
        console.log("Auth state changed:", user ? user.email : "No user");
        
        if (user) {
            // User is signed in
            currentUser = user;
            showAppScreen();
            updateUserInfo(user);
            showToast("Welcome back, " + (user.displayName || user.email) + "!", "success");
        } else {
            // User is signed out
            currentUser = null;
            showAuthScreen();
        }
    });
}

function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Auth buttons
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const googleBtn = document.getElementById('google-login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (registerBtn) registerBtn.addEventListener('click', handleRegister);
    if (googleBtn) googleBtn.addEventListener('click', handleGoogleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Show register/login links
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    
    if (showRegisterLink) showRegisterLink.addEventListener('click', showRegisterForm);
    if (showLoginLink) showLoginLink.addEventListener('click', showLoginForm);
    
    // Send message
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    console.log("✅ Event listeners setup complete");
}

// ============================
// AUTHENTICATION FUNCTIONS
// ============================

async function handleLogin() {
    console.log("Login button clicked");
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showError("Please enter email and password");
        return;
    }
    
    try {
        showLoading(true, "Logging in...");
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log("✅ Login successful:", userCredential.user.email);
        
    } catch (error) {
        console.error("❌ Login failed:", error);
        showError("Login failed: " + error.message);
    } finally {
        showLoading(false);
    }
}

async function handleRegister() {
    console.log("Register button clicked");
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (!name || !email || !password) {
        showError("Please fill all fields");
        return;
    }
    
    if (password.length < 6) {
        showError("Password must be at least 6 characters");
        return;
    }
    
    try {
        showLoading(true, "Creating account...");
        
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
        showToast("Account created successfully!", "success");
        
    } catch (error) {
        console.error("❌ Registration failed:", error);
        showError("Registration failed: " + error.message);
    } finally {
        showLoading(false);
    }
}

async function handleGoogleLogin() {
    console.log("Google login clicked");
    
    try {
        showLoading(true, "Connecting with Google...");
        
        const provider = new firebase.auth.GoogleAuthProvider();
        const userCredential = await auth.signInWithPopup(provider);
        const user = userCredential.user;
        
        console.log("✅ Google login successful:", user.email);
        
    } catch (error) {
        console.error("❌ Google login failed:", error);
        showError("Google login failed: " + error.message);
    } finally {
        showLoading(false);
    }
}

async function handleLogout() {
    console.log("Logout clicked");
    
    try {
        showLoading(true, "Logging out...");
        await auth.signOut();
        console.log("✅ Logout successful");
        showToast("Logged out successfully", "success");
    } catch (error) {
        console.error("❌ Logout failed:", error);
        showError("Logout failed: " + error.message);
    } finally {
        showLoading(false);
    }
}

// ============================
// UI FUNCTIONS
// ============================

function showAuthScreen() {
    console.log("Showing auth screen");
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
}

function showAppScreen() {
    console.log("Showing app screen");
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
}

function updateUserInfo(user) {
    console.log("Updating user info for:", user.email);
    
    const userNameEl = document.getElementById('user-name');
    const userStatusEl = document.getElementById('status-text');
    
    if (userNameEl) {
        userNameEl.textContent = user.displayName || user.email || 'User';
    }
    
    if (userStatusEl) {
        userStatusEl.textContent = 'Online';
        userStatusEl.parentElement.classList.add('online');
    }
}

function showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function showLoginForm() {
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
}

function switchTab(tabName) {
    console.log("Switching to tab:", tabName);
    
    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    
    // Show active content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function sendMessage() {
    if (!currentUser) {
        showError("Please login first");
        return;
    }
    
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) {
        showError("Please enter a message");
        return;
    }
    
    console.log("Sending message:", message);
    
    // For now, just clear input
    input.value = '';
    
    // Show demo message
    showToast("Message sent (demo)", "success");
}

// ============================
// HELPER FUNCTIONS
// ============================

function showLoading(show, message = "") {
    if (show) {
        console.log("Loading:", message);
        // You can add a loading spinner here
    } else {
        // Hide loading spinner
    }
}

function showToast(message, type = "info") {
    console.log("Toast:", message);
    
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = type;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function showError(message) {
    console.error("Error:", message);
    showToast("❌ " + message, "error");
}

// ============================
// DEBUG FUNCTIONS
// ============================

window.debugApp = function() {
    console.log("=== APP DEBUG INFO ===");
    console.log("1. Firebase config:", window.firebaseConfig ? "✅ Found" : "❌ Missing");
    console.log("2. Firebase SDK:", typeof firebase !== 'undefined' ? "✅ Loaded" : "❌ Missing");
    console.log("3. Firebase apps:", firebase.apps?.length || 0);
    console.log("4. Current user:", currentUser ? currentUser.email : "❌ Not logged in");
    console.log("5. Auth service:", auth ? "✅ Ready" : "❌ Not ready");
    console.log("6. Firestore service:", db ? "✅ Ready" : "❌ Not ready");
    console.log("=== DEBUG COMPLETE ===");
    
    showToast("Debug info logged to console", "info");
};

// Make functions globally available
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleGoogleLogin = handleGoogleLogin;
window.handleLogout = handleLogout;
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.sendMessage = sendMessage;
