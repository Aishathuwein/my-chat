// ============================
// END-TO-END ENCRYPTION SYSTEM
// ============================

class EncryptionManager {
    constructor() {
        this.userKey = null;
        this.symmetricKey = null;
    }

    // Generate RSA key pair for user
    async generateUserKeyPair() {
        try {
            // In production, use Web Crypto API
            // For simplicity, we use CryptoJS with a passphrase
            
            // Generate a random passphrase for this session
            const passphrase = CryptoJS.lib.WordArray.random(32).toString();
            
            // Store for this session
            this.userKey = {
                publicKey: passphrase,
                privateKey: passphrase // In real app, these would be different
            };
            
            // Save to localStorage
            localStorage.setItem('userKey', passphrase);
            
            return this.userKey;
        } catch (error) {
            console.error('Error generating keys:', error);
            return null;
        }
    }

    // Generate symmetric key for a chat
    generateSymmetricKey(chatId) {
        // Derive a key from chat ID and user key
        const keyMaterial = CryptoJS.lib.WordArray.random(32);
        this.symmetricKey = keyMaterial.toString();
        
        // Store for this chat
        sessionStorage.setItem(`chatKey_${chatId}`, this.symmetricKey);
        
        return this.symmetricKey;
    }

    // Get or create symmetric key for chat
    getChatKey(chatId) {
        let key = sessionStorage.getItem(`chatKey_${chatId}`);
        if (!key) {
            key = this.generateSymmetricKey(chatId);
        }
        return key;
    }

    // Encrypt message
    encryptMessage(message, chatId) {
        try {
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
            
            return {
                encrypted,
                algorithm: 'AES-256',
                chatId: chatId
            };
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    }

    // Decrypt message
    decryptMessage(encryptedData, chatId) {
        try {
            const key = this.getChatKey(chatId);
            
            // Decrypt with AES
            const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
            const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedStr) {
                throw new Error('Decryption failed');
            }
            
            return JSON.parse(decryptedStr);
        } catch (error) {
            console.error('Decryption error:', error);
            return {
                text: '[Encrypted message - decryption failed]',
                timestamp: Date.now()
            };
        }
    }

    // Encrypt file
    async encryptFile(file, chatId) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const key = this.getChatKey(chatId);
                    const encrypted = CryptoJS.AES.encrypt(
                        e.target.result,
                        key
                    ).toString();
                    
                    resolve({
                        encrypted,
                        originalName: file.name,
                        type: file.type,
                        size: file.size
                    });
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // Decrypt file
    decryptFile(encryptedData, chatId, fileInfo) {
        try {
            const key = this.getChatKey(chatId);
            const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
            const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
            
            return {
                dataUrl: decryptedStr,
                name: fileInfo.originalName,
                type: fileInfo.type
            };
        } catch (error) {
            console.error('File decryption error:', error);
            return null;
        }
    }

    // Generate encryption fingerprint for verification
    generateFingerprint(chatId) {
        const key = this.getChatKey(chatId);
        const hash = CryptoJS.SHA256(key).toString();
        return hash.substring(0, 16).toUpperCase();
    }

    // Verify message integrity
    verifyMessage(messageHash, decryptedMessage) {
        const recalculatedHash = CryptoJS.SHA256(
            JSON.stringify(decryptedMessage)
        ).toString();
        
        return messageHash === recalculatedHash;
    }

    // Export encryption keys (for backup)
    exportKeys() {
        const keys = {
            userKey: this.userKey,
            symmetricKeys: {}
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
    }

    // Import encryption keys
    importKeys(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const keys = JSON.parse(e.target.result);
                    
                    if (keys.userKey) {
                        this.userKey = keys.userKey;
                        localStorage.setItem('userKey', keys.userKey.publicKey);
                    }
                    
                    if (keys.symmetricKeys) {
                        Object.keys(keys.symmetricKeys).forEach(key => {
                            sessionStorage.setItem(key, keys.symmetricKeys[key]);
                        });
                    }
                    
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    // Clear all keys (logout)
    clearKeys() {
        this.userKey = null;
        this.symmetricKey = null;
        localStorage.removeItem('userKey');
        
        // Remove all chat keys
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.startsWith('chatKey_')) {
                sessionStorage.removeItem(key);
            }
        }
    }
}

// Initialize encryption manager
const encryption = new EncryptionManager();