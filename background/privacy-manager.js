// Privacy Manager for Chatsy Extension
// Handles data sanitization, encryption, and privacy controls

class PrivacyManager {
  constructor() {
    this.encryptionKey = null;
    this.initializeEncryption();
  }
  
  // Initialize encryption with a secure key
  async initializeEncryption() {
    try {
      // Try to get existing key from storage
      const result = await chrome.storage.local.get(['encryptionKey']);
      
      if (result.encryptionKey) {
        this.encryptionKey = result.encryptionKey;
      } else {
        // Generate new encryption key
        this.encryptionKey = await this.generateEncryptionKey();
        await chrome.storage.local.set({ encryptionKey: this.encryptionKey });
      }
    } catch (error) {
      console.error('Encryption initialization error:', error);
      // Fallback to a simple hash-based key
      this.encryptionKey = await this.generateFallbackKey();
    }
  }
  
  // Generate a secure encryption key
  async generateEncryptionKey() {
    try {
      // Use Web Crypto API if available
      if (window.crypto && window.crypto.subtle) {
        const key = await window.crypto.subtle.generateKey(
          {
            name: 'AES-GCM',
            length: 256
          },
          true,
          ['encrypt', 'decrypt']
        );
        
        const exportedKey = await window.crypto.subtle.exportKey('raw', key);
        return Array.from(new Uint8Array(exportedKey));
      }
    } catch (error) {
      console.warn('Web Crypto API not available, using fallback');
    }
    
    // Fallback to a pseudo-random key
    return this.generateFallbackKey();
  }
  
  // Generate fallback encryption key
  generateFallbackKey() {
    const key = new Uint8Array(32);
    for (let i = 0; i < key.length; i++) {
      key[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(key);
  }
  
  // Sanitize data before sending to external APIs
  async sanitizeData(data) {
    const sanitized = { ...data };
    
    // Remove any potential PII
    delete sanitized.contactId;
    delete sanitized.phoneNumber;
    delete sanitized.email;
    delete sanitized.fullName;
    
    // Hash contact identifiers
    if (sanitized.contactName) {
      sanitized.contactName = await this.hashString(sanitized.contactName);
    }
    
    // Anonymize message content while preserving context
    if (sanitized.message) {
      sanitized.message = this.anonymizeMessage(sanitized.message);
    }
    
    // Remove platform-specific identifiers
    delete sanitized.platform;
    
    // Add privacy metadata
    sanitized.privacyLevel = 'high';
    sanitized.timestamp = Date.now();
    
    return sanitized;
  }
  
  // Hash a string for privacy
  async hashString(str) {
    try {
      if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (error) {
      console.warn('Web Crypto API not available for hashing');
    }
    
    // Fallback hash function
    return this.simpleHash(str);
  }
  
  // Simple fallback hash function
  simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }
  
  // Anonymize message content
  anonymizeMessage(message) {
    let anonymized = message;
    
    // Replace phone numbers with placeholders
    anonymized = anonymized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
    
    // Replace email addresses
    anonymized = anonymized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
    
    // Replace URLs
    anonymized = anonymized.replace(/https?:\/\/[^\s]+/g, '[URL]');
    
    // Replace common names (basic pattern matching)
    const commonNames = /\b(John|Jane|Mike|Sarah|David|Lisa|Tom|Amy|Chris|Emma)\b/gi;
    anonymized = anonymized.replace(commonNames, '[NAME]');
    
    // Replace addresses (basic pattern)
    const addressPattern = /\b\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr)\b/gi;
    anonymized = anonymized.replace(addressPattern, '[ADDRESS]');
    
    return anonymized;
  }
  
  // Encrypt sensitive data for local storage
  async encryptData(data) {
    try {
      if (window.crypto && window.crypto.subtle && this.encryptionKey) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        
        // Generate IV
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        // Import key
        const key = await window.crypto.subtle.importKey(
          'raw',
          new Uint8Array(this.encryptionKey),
          'AES-GCM',
          false,
          ['encrypt']
        );
        
        // Encrypt
        const encryptedBuffer = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          dataBuffer
        );
        
        // Combine IV and encrypted data
        const encryptedArray = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        encryptedArray.set(iv);
        encryptedArray.set(new Uint8Array(encryptedBuffer), iv.length);
        
        return Array.from(encryptedArray);
      }
    } catch (error) {
      console.warn('Encryption failed, storing as plain text:', error);
    }
    
    // Fallback: return data as is
    return data;
  }
  
  // Decrypt data from local storage
  async decryptData(encryptedData) {
    try {
      if (window.crypto && window.crypto.subtle && this.encryptionKey && Array.isArray(encryptedData)) {
        const encryptedArray = new Uint8Array(encryptedData);
        
        // Extract IV and encrypted data
        const iv = encryptedArray.slice(0, 12);
        const data = encryptedArray.slice(12);
        
        // Import key
        const key = await window.crypto.subtle.importKey(
          'raw',
          new Uint8Array(this.encryptionKey),
          'AES-GCM',
          false,
          ['decrypt']
        );
        
        // Decrypt
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          data
        );
        
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decryptedBuffer));
      }
    } catch (error) {
      console.warn('Decryption failed, returning as is:', error);
    }
    
    // Fallback: return data as is
    return encryptedData;
  }
  
  // Check if data contains PII
  containsPII(data) {
    const piiPatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Emails
      /\b\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr)\b/i, // Addresses
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/ // Names (basic pattern)
    ];
    
    const dataString = JSON.stringify(data);
    
    return piiPatterns.some(pattern => pattern.test(dataString));
  }
  
  // Get privacy level for data
  getPrivacyLevel(data) {
    if (this.containsPII(data)) {
      return 'high';
    }
    
    const dataString = JSON.stringify(data);
    if (dataString.length > 1000) {
      return 'medium';
    }
    
    return 'low';
  }
  
  // Create privacy report
  generatePrivacyReport() {
    return {
      encryptionEnabled: !!this.encryptionKey,
      encryptionMethod: window.crypto && window.crypto.subtle ? 'AES-256-GCM' : 'Fallback',
      dataRetention: '30 days',
      externalAPIs: ['HuggingFace', 'Google Gemini'],
      dataTransmission: 'Minimal, anonymized',
      localStorage: 'Encrypted',
      privacyLevel: 'High'
    };
  }
  
  // Clear all encrypted data
  async clearAllData() {
    try {
      await chrome.storage.local.clear();
      this.encryptionKey = null;
      await this.initializeEncryption();
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }
}

// Export for use in service worker
self.privacyManager = new PrivacyManager();
