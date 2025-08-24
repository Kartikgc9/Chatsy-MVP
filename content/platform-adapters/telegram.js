// Telegram Platform Adapter for Chatsy Extension
// Handles Telegram Web functionality

class TelegramAdapter {
  constructor() {
    this.platform = 'telegram';
    this.messageSelectors = [
      '.message',
      '.message-text',
      '.text',
      '[data-peer-id]'
    ];
    this.inputSelectors = [
      '.input-message-input',
      '[contenteditable="true"]',
      'textarea',
      'input[type="text"]'
    ];
    this.typingSelectors = [
      '.typing-indicator',
      '.typing',
      '[data-typing]'
    ];
    this.contactSelectors = [
      '.chat-title',
      '.peer-title',
      '.chat-name',
      '[data-peer-id]'
    ];
    
    this.init();
  }
  
  init() {
    try {
      console.log('Telegram adapter initialized');
    } catch (error) {
      console.error('Telegram adapter initialization error:', error);
    }
  }
  
  // Start platform-specific monitoring
  startMonitoring() {
    try {
      console.log('Telegram monitoring started');
    } catch (error) {
      console.error('Error starting Telegram monitoring:', error);
    }
  }
  
  // Stop platform-specific monitoring
  stopMonitoring() {
    try {
      console.log('Telegram monitoring stopped');
    } catch (error) {
      console.error('Error stopping Telegram monitoring:', error);
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
      console.error('Error detecting Telegram message:', error);
      return null;
    }
  }
  
  // Check if node is a message
  isMessageNode(node) {
    try {
      if (!node || !node.classList) return false;
      
      // Check for message-specific attributes
      const hasMessageAttr = node.hasAttribute('data-peer-id') ||
                            node.hasAttribute('data-message-id');
      
      // Check for message classes
      const hasMessageClass = node.classList.contains('message') ||
                             node.classList.contains('message-text') ||
                             node.classList.contains('text');
      
      // Check for message content
      const hasMessageContent = node.querySelector && 
        (node.querySelector('.message') ||
         node.querySelector('.message-text') ||
         node.querySelector('.text'));
      
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
      console.error('Error extracting Telegram message data:', error);
      return null;
    }
  }
  
  // Extract message text
  extractMessageText(node) {
    try {
      // Try multiple selectors for message text
      const textSelectors = [
        '.message-text',
        '.text',
        '.message-content',
        '.text-content',
        'span[dir="auto"]',
        '.text'
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
        'time',
        '.timestamp',
        '.message-time',
        '.time',
        '[data-time]'
      ];
      
      for (const selector of timestampSelectors) {
        const element = node.querySelector(selector);
        if (element) {
          const timeAttr = element.getAttribute('datetime') || element.getAttribute('data-time');
          if (timeAttr) {
            return new Date(timeAttr).getTime();
          }
          
          const timeText = element.textContent;
          if (timeText) {
            // Parse Telegram time format
            const parsed = this.parseTelegramTime(timeText);
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
  
  // Parse Telegram time format
  parseTelegramTime(timeText) {
    try {
      if (!timeText) return null;
      
      const now = new Date();
      
      // Handle relative time formats
      if (timeText.includes('now') || timeText.includes('just now')) {
        return now.getTime();
      }
      
      if (timeText.includes('min')) {
        const match = timeText.match(/(\d+)\s*min/);
        if (match) {
          const minutes = parseInt(match[1]);
          return now.getTime() - (minutes * 60 * 1000);
        }
      }
      
      if (timeText.includes('h') || timeText.includes('hour')) {
        const match = timeText.match(/(\d+)\s*h/);
        if (match) {
          const hours = parseInt(match[1]);
          return now.getTime() - (hours * 60 * 60 * 1000);
        }
      }
      
      // Handle absolute time formats
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
      console.error('Error parsing Telegram time:', error);
      return null;
    }
  }
  
  // Get message type (incoming/outgoing)
  getMessageType(node) {
    try {
      // Telegram typically shows outgoing messages on the right
      const isOutgoing = node.classList.contains('outgoing') ||
                        node.classList.contains('sent') ||
                        node.classList.contains('my-message') ||
                        node.style.textAlign === 'right' ||
                        node.style.marginLeft === 'auto';
      
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
      console.error('Error detecting Telegram typing:', error);
      return null;
    }
  }
  
  // Check if node is a typing indicator
  isTypingIndicator(node) {
    try {
      if (!node || !node.classList) return false;
      
      // Check for typing-specific attributes
      const hasTypingAttr = node.hasAttribute('data-typing') ||
                            node.hasAttribute('data-testid') && 
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
      console.error('Error getting Telegram contact ID:', error);
      return null;
    }
  }
  
  // Extract contact ID from URL
  extractContactIdFromURL() {
    try {
      const url = window.location.href;
      const match = url.match(/c\/([^/?]+)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }
  
  // Extract contact ID from page title
  extractContactIdFromTitle() {
    try {
      const title = document.title;
      if (title && title !== 'Telegram' && title !== 'Telegram Web') {
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
      } else if (inputField.tagName === 'TEXTAREA') {
        // For textarea elements
        inputField.value = text;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        // For other input types
        inputField.value = text;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      console.log('Text inserted into Telegram input:', text);
      return true;
    } catch (error) {
      console.error('Error inserting text into Telegram:', error);
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
      console.error('Error finding Telegram input field:', error);
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
export { TelegramAdapter };
