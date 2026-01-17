// End-to-End Encryption Module
class ChatEncryption {
    constructor() {
        this.secretKey = null;
        this.algorithm = 'AES';
    }

    // Generate or load encryption key
    async initialize(userId) {
        try {
            // Try to load existing key from localStorage
            const storedKey = localStorage.getItem(`chat_key_${userId}`);
            
            if (storedKey) {
                this.secretKey = storedKey;
            } else {
                // Generate new key
                this.secretKey = this.generateKey();
                localStorage.setItem(`chat_key_${userId}`, this.secretKey);
                
                // In production, you'd share this key securely with other users
                // This is a simplified version
            }
            
            return true;
        } catch (error) {
            console.error('Encryption init error:', error);
            return false;
        }
    }

    // Generate a random key
    generateKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Encrypt message
    async encryptMessage(message, recipientPublicKey = null) {
        try {
            if (!this.secretKey) {
                throw new Error('Encryption not initialized');
            }

            // Simplified encryption (in production, use Web Crypto API properly)
            const encrypted = this.simpleEncrypt(message, this.secretKey);
            
            return {
                encrypted: encrypted,
                algorithm: this.algorithm,
                keyId: 'default',
                iv: this.generateIV()
            };
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    }

    // Decrypt message
    async decryptMessage(encryptedData) {
        try {
            if (!this.secretKey) {
                throw new Error('Encryption not initialized');
            }

            // Simplified decryption
            const decrypted = this.simpleDecrypt(encryptedData.encrypted, this.secretKey);
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            return '[Encrypted message - unable to decrypt]';
        }
    }

    // Simple encryption (for demo - in production use Web Crypto API)
    simpleEncrypt(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return btoa(result);
    }

    // Simple decryption
    simpleDecrypt(encryptedText, key) {
        try {
            const decoded = atob(encryptedText);
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                result += String.fromCharCode(charCode);
            }
            return result;
        } catch {
            return '[Unable to decrypt]';
        }
    }

    // Generate initialization vector
    generateIV() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Export public key for sharing
    async exportPublicKey() {
        // In production, implement proper key exchange
        return this.secretKey.substring(0, 16); // Simplified
    }

    // Import public key from another user
    async importPublicKey(publicKey, userId) {
        // Store other user's public key
        localStorage.setItem(`public_key_${userId}`, publicKey);
    }

    // Generate key pair for asymmetric encryption
    async generateKeyPair() {
        try {
            const keyPair = await crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256",
                },
                true,
                ["encrypt", "decrypt"]
            );
            
            return keyPair;
        } catch (error) {
            console.error('Key pair generation error:', error);
            return null;
        }
    }
}

// Create global encryption instance
const chatEncryption = new ChatEncryption();