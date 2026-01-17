// ============================
// SIMPLE ENCRYPTION SYSTEM
// ============================

console.log("Loading encryption system...");

const encryption = {
    // Simple encryption for demo
    encryptMessage: function(message, chatId) {
        console.log("Encrypting message for chat:", chatId);
        try {
            // Simple base64 encoding (for demo only)
            // In production, use proper encryption like CryptoJS.AES
            return btoa(unescape(encodeURIComponent(message)));
        } catch (error) {
            console.error("Encryption error:", error);
            return message; // Fallback to plain text
        }
    },
    
    decryptMessage: function(encryptedMessage, chatId) {
        console.log("Decrypting message for chat:", chatId);
        try {
            // Simple base64 decoding (for demo only)
            return decodeURIComponent(escape(atob(encryptedMessage)));
        } catch (error) {
            console.error("Decryption error:", error);
            return encryptedMessage; // Return as-is
        }
    },
    
    // Generate encryption key
    generateChatKey: function(chatId) {
        console.log("Generating key for chat:", chatId);
        const key = 'chat_key_' + chatId + '_' + Date.now();
        sessionStorage.setItem('chatKey_' + chatId, key);
        return key;
    },
    
    // Get chat key
    getChatKey: function(chatId) {
        let key = sessionStorage.getItem('chatKey_' + chatId);
        if (!key) {
            key = this.generateChatKey(chatId);
        }
        return key;
    },
    
    // Export keys (demo)
    exportKeys: function() {
        console.log("Exporting encryption keys");
        alert("Encryption keys exported (demo mode)");
        return { status: "demo" };
    },
    
    // Clear keys
    clearKeys: function() {
        console.log("Clearing encryption keys");
        // Clear session storage keys
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.startsWith('chatKey_')) {
                sessionStorage.removeItem(key);
            }
        }
    }
};

// Make available globally
window.encryption = encryption;
console.log("✅ Encryption system ready");
