// WhatsApp Platform Adapter for Chatsy Extension
// Handles WhatsApp Web-specific functionality

class WhatsAppAdapter {
  constructor() {
    this.platform = 'whatsapp';
    this.messageSelectors = [
      '[data-testid="msg-meta"]',
      '.message-in',
      '.message-out',
      '[data-testid="conversation-turn-"]'
    ];
    this.inputSelectors = [
      '[contenteditable="true"][data-testid="conversation-compose-box-input"]',
      '[contenteditable="true"]',
      'div[contenteditable="true"]'
    ];
    this.typingSelectors = [
      '[data-testid="conversation-typing"]',
      '.typing-indicator',
      '[data-testid="typing"]'
    ];
    this.contactSelectors = [
      '[data-testid="conversation-title"]',
      '.conversation-title',
      '[data-testid="chat-subtitle"]'
    ];
    
    this.init();
  }
  
  init() {
    try {
      console.log('WhatsApp adapter initialized');
    } catch (error) {
      console.error('WhatsApp adapter initialization error:', error);
    }
  }
  
  // Start platform-specific monitoring
  startMonitoring() {
    try {
      // WhatsApp-specific monitoring can be added here
      console.log('WhatsApp monitoring started');
    } catch (error) {
      console.error('Error starting WhatsApp monitoring:', error);
    }
  }
  
  // Stop platform-specific monitoring
  stopMonitoring() {
    try {
      console.log('WhatsApp monitoring stopped');
    } catch (error) {
      console.error('Error stopping WhatsApp monitoring:', error);
    }
  }
  
  // Detect new messages
  detectNewMessage(node) {
    try {
      // Check if this node contains a message
      if (this.isMessageNode(node)) {
        return this.extractMessageData(node);
      }
      
      // Check child nodes
      if (node.children) {
        for (const child of node.children) {
          if (this.isMessageNode(child)) {
            return this.extractMessageData(child);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error detecting WhatsApp message:', error);
      return null;
    }
  }
  
  // Check if node is a message
  isMessageNode(node) {
    try {
      if (!node || !node.classList) return false;
      
      // Check for message-specific attributes
      const hasMessageAttr = node.hasAttribute('data-testid') && 
        node.getAttribute('data-testid').includes('conversation-turn-');
      
      // Check for message classes
      const hasMessageClass = node.classList.contains('message-in') || 
                             node.classList.contains('message-out');
      
      // Check for message content
      const hasMessageContent = node.querySelector && 
        node.querySelector('[data-testid="msg-meta"]');
      
      return hasMessageAttr || hasMessageClass || hasMessageContent;
    } catch (error) {
      return false;
    }
  }
  
  // Extract message data from node
  extractMessageData(node) {
    try {
      // Find the actual message text
      const messageText = this.extractMessageText(node);
      if (!messageText) return null;
      
      // Get contact ID
      const contactId = this.getCurrentContactId();
      if (!contactId) return null;
      
      // Get timestamp
      const timestamp = this.extractMessageTimestamp(node) || Date.now();
      
      return {
        message: messageText,
        contactId,
        platform: this.platform,
        timestamp,
        type: this.getMessageType(node)
      };
    } catch (error) {
      console.error('Error extracting WhatsApp message data:', error);
      return null;
    }
  }
  
  // Extract message text
  extractMessageText(node) {
    try {
      // Try multiple selectors for message text
      const textSelectors = [
        '[data-testid="msg-meta"]',
        '.message-text',
        '.selectable-text',
        '[data-testid="conversation-turn-"] span',
        '.copyable-text'
      ];
      
      for (const selector of textSelectors) {
        const element = node.querySelector(selector);
        if (element && element.textContent) {
          const text = element.textContent.trim();
          if (text && text.length > 0) {
            return text;
          }
        }
      }
      
      // Fallback: check if node itself has text
      if (node.textContent) {
        const text = node.textContent.trim();
        if (text && text.length > 0 && !text.includes(':')) {
          return text;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting message text:', error);
      return null;
    }
  }
  
  // Extract message timestamp
  extractMessageTimestamp(node) {
    try {
      // Look for timestamp elements
      const timestampSelectors = [
        '[data-testid="msg-meta"] time',
        '.message-time',
        '.timestamp',
        'time'
      ];
      
      for (const selector of timestampSelectors) {
        const element = node.querySelector(selector);
        if (element) {
          const timeAttr = element.getAttribute('datetime');
          if (timeAttr) {
            return new Date(timeAttr).getTime();
          }
          
          const timeText = element.textContent;
          if (timeText) {
            // Parse WhatsApp time format (e.g., "12:34 PM")
            const parsed = this.parseWhatsAppTime(timeText);
            if (parsed) return parsed;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting message timestamp:', error);
      return null;
    }
  }
  
  // Parse WhatsApp time format
  parseWhatsAppTime(timeText) {
    try {
      if (!timeText) return null;
      
      const now = new Date();
      const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3]?.toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        // Create date object for today with this time
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        
        // If the time is in the future, assume it's from yesterday
        if (date > now) {
          date.setDate(date.getDate() - 1);
        }
        
        return date.getTime();
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing WhatsApp time:', error);
      return null;
    }
  }
  
  // Get message type (incoming/outgoing)
  getMessageType(node) {
    try {
      if (node.classList.contains('message-out')) {
        return 'outgoing';
      } else if (node.classList.contains('message-in')) {
        return 'incoming';
      }
      
      // Check for other indicators
      const isOutgoing = node.querySelector('[data-testid*="outgoing"]') ||
                        node.querySelector('.message-out') ||
                        node.getAttribute('data-testid')?.includes('outgoing');
      
      return isOutgoing ? 'outgoing' : 'incoming';
    } catch (error) {
      return 'unknown';
    }
  }
  
  // Detect typing indicators
  detectTyping(node) {
    try {
      // Check if node is a typing indicator
      if (this.isTypingIndicator(node)) {
        return {
          contactId: this.getCurrentContactId(),
          platform: this.platform,
          timestamp: Date.now()
        };
      }
      
      // Check child nodes
      if (node.children) {
        for (const child of node.children) {
          if (this.isTypingIndicator(child)) {
            return {
              contactId: this.getCurrentContactId(),
              platform: this.platform,
              timestamp: Date.now()
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error detecting WhatsApp typing:', error);
      return null;
    }
  }
  
  // Check if node is a typing indicator
  isTypingIndicator(node) {
    try {
      if (!node || !node.classList) return false;
      
      // Check for typing-specific attributes
      const hasTypingAttr = node.hasAttribute('data-testid') && 
        node.getAttribute('data-testid').includes('typing');
      
      // Check for typing classes
      const hasTypingClass = node.classList.contains('typing-indicator') ||
                            node.classList.contains('typing');
      
      // Check for typing text
      const hasTypingText = node.textContent && 
        node.textContent.toLowerCase().includes('typing');
      
      return hasTypingAttr || hasTypingClass || hasTypingText;
    } catch (error) {
      return false;
    }
  }
  
  // Get current contact ID
  getCurrentContactId() {
    try {
      // Try to get from URL first
      const urlContactId = this.extractContactIdFromURL();
      if (urlContactId) return urlContactId;
      
      // Try to get from page title
      const titleContactId = this.extractContactIdFromTitle();
      if (titleContactId) return titleContactId;
      
      // Try to get from contact elements
      const elementContactId = this.extractContactIdFromElements();
      if (elementContactId) return elementContactId;
      
      return null;
    } catch (error) {
      console.error('Error getting WhatsApp contact ID:', error);
      return null;
    }
  }
  
  // Extract contact ID from URL
  extractContactIdFromURL() {
    try {
      const url = window.location.href;
      const match = url.match(/chat\/([^/?]+)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }
  
  // Extract contact ID from page title
  extractContactIdFromTitle() {
    try {
      const title = document.title;
      if (title && title !== 'WhatsApp' && title !== 'WhatsApp Web') {
        return this.hashString(title);
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  
  // Extract contact ID from page elements
  extractContactIdFromElements() {
    try {
      for (const selector of this.contactSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          const text = element.textContent.trim();
          if (text && text.length > 0) {
            return this.hashString(text);
          }
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  
  // Hash string for privacy
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
  
  // Insert text into input field
  async insertText(text) {
    try {
      const inputField = this.findInputField();
      if (!inputField) {
        throw new Error('Input field not found');
      }
      
      // Focus the input field
      inputField.focus();
      
      // For contenteditable elements
      if (inputField.contentEditable === 'true') {
        // Clear existing content
        inputField.innerHTML = '';
        
        // Insert new text
        inputField.textContent = text;
        
        // Trigger input event
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        // For regular input elements
        inputField.value = text;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      console.log('Text inserted into WhatsApp input:', text);
      return true;
    } catch (error) {
      console.error('Error inserting text into WhatsApp:', error);
      return false;
    }
  }
  
  // Find input field
  findInputField() {
    try {
      for (const selector of this.inputSelectors) {
        const element = document.querySelector(selector);
        if (element && element.offsetParent !== null) {
          return element;
        }
      }
      return null;
    } catch (error) {
      console.error('Error finding WhatsApp input field:', error);
      return null;
    }
  }
  
  // Get platform-specific information
  getPlatformInfo() {
    return {
      platform: this.platform,
      version: 'Web',
      features: ['messages', 'typing', 'contacts', 'input'],
      selectors: {
        messages: this.messageSelectors,
        input: this.inputSelectors,
        typing: this.typingSelectors,
        contacts: this.contactSelectors
      }
    };
  }
}

// Export for use in platform detector
export { WhatsAppAdapter };
