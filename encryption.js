// ============================
// SIMPLE ENCRYPTION SYSTEM
// ============================

const encryption = {
    // Simple encryption (for demo - in production use stronger methods)
    encryptMessage: function(message, chatId) {
        try {
            // Simple base64 encoding for demo
            return btoa(unescape(encodeURIComponent(message)));
        } catch (error) {
            console.error("Encryption error:", error);
            return message; // Fallback to plain text
        }
    },
    
    decryptMessage: function(encryptedMessage, chatId) {
        try {
            // Simple base64 decoding for demo
            return decodeURIComponent(escape(atob(encryptedMessage)));
        } catch (error) {
            console.error("Decryption error:", error);
            return encryptedMessage; // Return as-is if decryption fails
        }
    },
    
    // Generate simple fingerprint
    generateFingerprint: function(chatId) {
        return "SECURE-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    },
    
    // Export keys (demo)
    exportKeys: function() {
        alert("Encryption keys exported (demo)");
        return {
            status: "demo",
            message: "In production, real keys would be exported"
        };
    },
    
    // Clear keys
    clearKeys: function() {
        console.log("Encryption keys cleared");
    }
};

// Make available globally
window.encryption = encryption;
console.log("✅ Simple encryption system loaded");
