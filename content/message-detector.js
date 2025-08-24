// Message Detector for Chatsy Extension
// Monitors messaging platforms for new messages and typing activity

import { EventEmitter } from '../utils/event-emitter.js';

class MessageDetector extends EventEmitter {
  constructor(platformDetector) {
    super();
    this.platformDetector = platformDetector;
    this.platformAdapter = null;
    this.isMonitoring = false;
    this.observer = null;
    this.lastMessageTime = 0;
    this.messageQueue = [];
    this.typingTimeout = null;
    
    this.init();
  }
  
  async init() {
    try {
      // Get platform adapter
      this.platformAdapter = this.platformDetector.getPlatformAdapter();
      
      if (!this.platformAdapter) {
        throw new Error('No platform adapter available');
      }
      
      console.log('Message detector initialized for platform:', this.platformDetector.currentPlatform);
    } catch (error) {
      console.error('Message detector initialization error:', error);
    }
  }
  
  startMonitoring() {
    if (this.isMonitoring) return;
    
    try {
      this.isMonitoring = true;
      
      // Start DOM observation
      this.startDOMObservation();
      
      // Start platform-specific monitoring
      if (this.platformAdapter && this.platformAdapter.startMonitoring) {
        this.platformAdapter.startMonitoring();
      }
      
      console.log('Message monitoring started');
    } catch (error) {
      console.error('Error starting message monitoring:', error);
      this.isMonitoring = false;
    }
  }
  
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    try {
      this.isMonitoring = false;
      
      // Stop DOM observation
      this.stopDOMObservation();
      
      // Stop platform-specific monitoring
      if (this.platformAdapter && this.platformAdapter.stopMonitoring) {
        this.platformAdapter.stopMonitoring();
      }
      
      // Clear typing timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = null;
      }
      
      console.log('Message monitoring stopped');
    } catch (error) {
      console.error('Error stopping message monitoring:', error);
    }
  }
  
  startDOMObservation() {
    try {
      // Create mutation observer for DOM changes
      this.observer = new MutationObserver((mutations) => {
        this.handleDOMChanges(mutations);
      });
      
      // Start observing
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-testid', 'aria-label']
      });
      
      console.log('DOM observation started');
    } catch (error) {
      console.error('Error starting DOM observation:', error);
    }
  }
  
  stopDOMObservation() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      console.log('DOM observation stopped');
    }
  }
  
  handleDOMChanges(mutations) {
    if (!this.isMonitoring) return;
    
    try {
      mutations.forEach((mutation) => {
        // Check for new messages
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.checkForNewMessages(node);
              this.checkForTypingIndicators(node);
            }
          });
        }
        
        // Check for typing indicators
        if (mutation.type === 'attributes') {
          this.checkForTypingIndicators(mutation.target);
        }
      });
    } catch (error) {
      console.error('Error handling DOM changes:', error);
    }
  }
  
  checkForNewMessages(node) {
    try {
      // Use platform-specific message detection
      if (this.platformAdapter && this.platformAdapter.detectNewMessage) {
        const messageData = this.platformAdapter.detectNewMessage(node);
        if (messageData) {
          this.handleNewMessage(messageData);
        }
      }
      
      // Also check child nodes recursively
      if (node.children) {
        Array.from(node.children).forEach(child => {
          this.checkForNewMessages(child);
        });
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  }
  
  checkForTypingIndicators(node) {
    try {
      // Use platform-specific typing detection
      if (this.platformAdapter && this.platformAdapter.detectTyping) {
        const typingData = this.platformAdapter.detectTyping(node);
        if (typingData) {
          this.handleTypingDetected(typingData);
        }
      }
      
      // Check if this node itself is a typing indicator
      if (this.isTypingIndicator(node)) {
        this.handleTypingDetected({
          contactId: this.getCurrentContactId(),
          platform: this.platformDetector.currentPlatform,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error checking for typing indicators:', error);
    }
  }
  
  isTypingIndicator(node) {
    if (!node || !node.classList) return false;
    
    // Common typing indicator classes
    const typingClasses = [
      'typing',
      'typing-indicator',
      'is-typing',
      'typing-dots',
      'typing-animation'
    ];
    
    return typingClasses.some(className => 
      node.classList.contains(className) || 
      node.textContent?.includes('typing') ||
      node.getAttribute('aria-label')?.includes('typing')
    );
  }
  
  getCurrentContactId() {
    try {
      if (this.platformAdapter && this.platformAdapter.getCurrentContactId) {
        return this.platformAdapter.getCurrentContactId();
      }
      
      // Fallback: try to extract from URL or page content
      return this.extractContactIdFromPage();
    } catch (error) {
      console.error('Error getting current contact ID:', error);
      return null;
    }
  }
  
  extractContactIdFromPage() {
    try {
      const url = window.location.href;
      
      // Extract contact ID from URL patterns
      const urlPatterns = {
        whatsapp: /chat\/([^/?]+)/,
        instagram: /direct\/t\/([^/?]+)/,
        telegram: /c\/([^/?]+)/
      };
      
      const platform = this.platformDetector.currentPlatform;
      const pattern = urlPatterns[platform];
      
      if (pattern) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      // Fallback: try to get from page title or content
      const title = document.title;
      if (title && title !== 'WhatsApp' && title !== 'Instagram' && title !== 'Telegram') {
        return this.hashString(title);
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting contact ID from page:', error);
      return null;
    }
  }
  
  hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(16);
  }
  
  handleNewMessage(messageData) {
    try {
      const { message, contactId, platform, timestamp } = messageData;
      
      // Validate message data
      if (!message || !contactId || !platform) {
        console.warn('Invalid message data received:', messageData);
        return;
      }
      
      // Check if this is a duplicate message
      if (this.isDuplicateMessage(messageData)) {
        return;
      }
      
      // Add to message queue
      this.messageQueue.push(messageData);
      
      // Process message queue
      this.processMessageQueue();
      
      // Emit event
      this.emit('messageReceived', messageData);
      
      console.log('New message detected:', messageData);
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  }
  
  handleTypingDetected(typingData) {
    try {
      const { contactId, platform, timestamp } = typingData;
      
      // Validate typing data
      if (!contactId || !platform) {
        console.warn('Invalid typing data received:', typingData);
        return;
      }
      
      // Clear existing typing timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }
      
      // Set new typing timeout
      this.typingTimeout = setTimeout(() => {
        this.emit('typingDetected', typingData);
        console.log('Typing detected for contact:', contactId);
      }, 1000); // Wait 1 second to confirm typing
      
    } catch (error) {
      console.error('Error handling typing detection:', error);
    }
  }
  
  isDuplicateMessage(messageData) {
    const { message, contactId, timestamp } = messageData;
    
    // Check if we've seen this message recently
    const recentMessages = this.messageQueue.filter(msg => 
      msg.contactId === contactId && 
      msg.message === message &&
      Math.abs(msg.timestamp - timestamp) < 5000 // Within 5 seconds
    );
    
    return recentMessages.length > 1;
  }
  
  processMessageQueue() {
    try {
      // Process messages in order
      while (this.messageQueue.length > 0) {
        const messageData = this.messageQueue.shift();
        
        // Update last message time
        this.lastMessageTime = messageData.timestamp;
        
        // Check for contact change
        this.checkForContactChange(messageData);
      }
    } catch (error) {
      console.error('Error processing message queue:', error);
    }
  }
  
  checkForContactChange(messageData) {
    try {
      const currentContactId = this.getCurrentContactId();
      
      if (currentContactId && currentContactId !== this.lastContactId) {
        this.lastContactId = currentContactId;
        
        // Emit contact change event
        this.emit('contactChanged', {
          contactId: currentContactId,
          platform: this.platformDetector.currentPlatform,
          timestamp: Date.now()
        });
        
        console.log('Contact changed to:', currentContactId);
      }
    } catch (error) {
      console.error('Error checking for contact change:', error);
    }
  }
  
  // Get message statistics
  getMessageStats() {
    return {
      totalMessages: this.messageQueue.length,
      lastMessageTime: this.lastMessageTime,
      isMonitoring: this.isMonitoring,
      platform: this.platformDetector.currentPlatform
    };
  }
  
  // Force check for new messages
  forceCheck() {
    if (!this.isMonitoring) return;
    
    try {
      // Check the entire document
      this.checkForNewMessages(document.body);
      
      // Check for typing indicators
      this.checkForTypingIndicators(document.body);
      
      console.log('Forced message check completed');
    } catch (error) {
      console.error('Error during forced message check:', error);
    }
  }
}

// Export for use in content script
export { MessageDetector };
