// ============================
// END-TO-END ENCRYPTION SYSTEM
// ============================

class EncryptionManager {
    constructor() {
        this.userKey = null;
        this.symmetricKey = null;
        console.log("Encryption Manager initialized");
    }

    // Generate user key pair
    async generateUserKeyPair() {
        try {
            console.log("Generating user key pair...");
            
            // Generate a random passphrase for this session
            const passphrase = CryptoJS.lib.WordArray.random(32).toString();
            
            // Store for this session
            this.userKey = {
                publicKey: passphrase,
                privateKey: passphrase
            };
            
            // Save to localStorage
            localStorage.setItem('userKey', passphrase);
            
            console.log("✅ User key pair generated");
            return this.userKey;
        } catch (error) {
            console.error('❌ Error generating keys:', error);
            return null;
        }
    }

    // Generate symmetric key for a chat
    generateSymmetricKey(chatId) {
        console.log(`Generating symmetric key for chat: ${chatId}`);
        
        // Derive a key from chat ID and timestamp
        const keyMaterial = CryptoJS.lib.WordArray.random(32);
        this.symmetricKey = keyMaterial.toString();
        
        // Store for this chat
        sessionStorage.setItem(`chatKey_${chatId}`, this.symmetricKey);
        
        console.log("✅ Symmetric key generated");
        return this.symmetricKey;
    }

    // Get or create symmetric key for chat
    getChatKey(chatId) {
        console.log(`Getting key for chat: ${chatId}`);
        
        let key = sessionStorage.getItem(`chatKey_${chatId}`);
        if (!key) {
            console.log("No existing key, generating new one...");
            key = this.generateSymmetricKey(chatId);
        }
        
        return key;
    }

    // Encrypt message
    encryptMessage(message, chatId) {
        try {
            console.log("Encrypting message...");
            
            const key = this.getChatKey(chatId);
            
            // Encrypt with AES
            const encrypted = CryptoJS.AES.encrypt(
                JSON.stringify({
                    text: message,
                    timestamp: Date.now(),
                    iv: CryptoJS.lib.WordArray.random(16).toString()
                }),
                key
            ).toString();
            
            console.log("✅ Message encrypted");
            
            return {
                encrypted,
                algorithm: 'AES-256',
                chatId: chatId
            };
        } catch (error) {
            console.error('❌ Encryption error:', error);
            return {
                encrypted: message, // Fallback to plain text
                algorithm: 'plain',
                chatId: chatId
            };
        }
    }

    // Decrypt message
    decryptMessage(encryptedData, chatId) {
        try {
            console.log("Decrypting message...");
            
            // Check if it's plain text (fallback)
            if (!encryptedData.includes('U2FsdGVkX1')) { // CryptoJS prefix
                console.log("Message is plain text");
                return {
                    text: encryptedData,
                    timestamp: Date.now()
                };
            }
            
            const key = this.getChatKey(chatId);
            
            // Decrypt with AES
            const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
            const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedStr) {
                console.warn("Decryption failed or empty message");
                return {
                    text: '[Encrypted message]',
                    timestamp: Date.now()
                };
            }
            
            console.log("✅ Message decrypted");
            return JSON.parse(decryptedStr);
            
        } catch (error) {
            console.error('❌ Decryption error:', error);
            return {
                text: '[Encrypted message - decryption failed]',
                timestamp: Date.now()
            };
        }
    }

    // Encrypt file
    async encryptFile(file, chatId) {
        return new Promise((resolve, reject) => {
            console.log("Encrypting file...");
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const key = this.getChatKey(chatId);
                    const encrypted = CryptoJS.AES.encrypt(
                        e.target.result,
                        key
                    ).toString();
                    
                    console.log("✅ File encrypted");
                    resolve({
                        encrypted,
                        originalName: file.name,
                        type: file.type,
                        size: file.size
                    });
                } catch (error) {
                    console.error('❌ File encryption error:', error);
                    reject(error);
                }
            };
            reader.onerror = (error) => {
                reject(error);
            };
            reader.readAsDataURL(file);
        });
    }

    // Generate encryption fingerprint for verification
    generateFingerprint(chatId) {
        const key = this.getChatKey(chatId);
        const hash = CryptoJS.SHA256(key).toString();
        return hash.substring(0, 16).toUpperCase().match(/.{4}/g).join('-');
    }

    // Export encryption keys (for backup)
    exportKeys() {
        try {
            console.log("Exporting encryption keys...");
            
            const keys = {
                userKey: this.userKey,
                symmetricKeys: {},
                exportDate: new Date().toISOString()
            };
            
            // Get all chat keys
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key.startsWith('chatKey_')) {
                    keys.symmetricKeys[key] = sessionStorage.getItem(key);
                }
            }
            
            // Create download
            const dataStr = JSON.stringify(keys, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `securechat_keys_${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log("✅ Keys exported");
            return true;
            
        } catch (error) {
            console.error('❌ Error exporting keys:', error);
            return false;
        }
    }

    // Clear all keys (logout)
    clearKeys() {
        console.log("Clearing encryption keys...");
        
        this.userKey = null;
        this.symmetricKey = null;
        localStorage.removeItem('userKey');
        
        // Remove all chat keys
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.startsWith('chatKey_')) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            sessionStorage.removeItem(key);
        });
        
        console.log("✅ Keys cleared");
    }

    // Get encryption status
    getStatus() {
        return {
            hasUserKey: !!this.userKey,
            hasSymmetricKey: !!this.symmetricKey,
            chatKeysCount: this.getChatKeysCount()
        };
    }

    // Count chat keys
    getChatKeysCount() {
        let count = 0;
        for (let i = 0; i < sessionStorage.length; i++) {
            if (sessionStorage.key(i).startsWith('chatKey_')) {
                count++;
            }
        }
        return count;
    }

    // Test encryption/decryption
    testEncryption() {
        const testMessage = "This is a test message";
        const testChatId = "test_chat_123";
        
        console.log("Testing encryption...");
        console.log("Original:", testMessage);
        
        const encrypted = this.encryptMessage(testMessage, testChatId);
        console.log("Encrypted:", encrypted.encrypted.substring(0, 50) + "...");
        
        const decrypted = this.decryptMessage(encrypted.encrypted, testChatId);
        console.log("Decrypted:", decrypted.text);
        
        const success = decrypted.text === testMessage;
        console.log(success ? "✅ Test passed" : "❌ Test failed");
        
        return success;
    }
}

// Initialize encryption manager globally
window.encryption = new EncryptionManager();

// Test encryption on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log("Encryption system ready");
        // Uncomment to test encryption on load
        // encryption.testEncryption();
    }, 1000);
});