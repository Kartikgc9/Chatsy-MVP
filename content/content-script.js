// Main Content Script for Chatsy Extension
// Orchestrates message detection, AI integration, and UI overlay

import { MessageDetector } from './message-detector.js';
import { UIOverlay } from './ui-overlay.js';
import { PlatformDetector } from '../utils/platform-detector.js';
import { ContactManager } from '../storage/contact-manager.js';
import { ConversationAnalyzer } from '../storage/conversation-analyzer.js';

class ChatsyContentScript {
  constructor() {
    this.messageDetector = null;
    this.uiOverlay = null;
    this.platformDetector = null;
    this.contactManager = null;
    this.conversationAnalyzer = null;
    this.isEnabled = true;
    this.currentContact = null;
    this.conversationContext = [];
    
    this.init();
  }
  
  async init() {
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    } catch (error) {
      console.error('Chatsy initialization error:', error);
    }
  }
  
  async setup() {
    try {
      // Initialize components
      this.platformDetector = new PlatformDetector();
      this.contactManager = new ContactManager();
      this.conversationAnalyzer = new ConversationAnalyzer();
      
      // Wait for platform detection
      await this.platformDetector.detectPlatform();
      
      // Initialize message detector
      this.messageDetector = new MessageDetector(this.platformDetector);
      
      // Initialize UI overlay
      this.uiOverlay = new UIOverlay(this.platformDetector);
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start monitoring
      this.startMonitoring();
      
      console.log('Chatsy content script initialized successfully');
    } catch (error) {
      console.error('Chatsy setup error:', error);
    }
  }
  
  setupEventListeners() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.type) {
        case 'TOGGLE_SUGGESTIONS':
          this.toggleSuggestions();
          break;
        case 'UPDATE_SETTINGS':
          this.updateSettings(request.data);
          break;
      }
    });
    
    // Listen for platform-specific events
    this.messageDetector.on('messageReceived', (data) => {
      this.handleMessageReceived(data);
    });
    
    this.messageDetector.on('typingDetected', (data) => {
      this.handleTypingDetected(data);
    });
    
    this.messageDetector.on('contactChanged', (data) => {
      this.handleContactChanged(data);
    });
    
    // Listen for UI overlay events
    this.uiOverlay.on('suggestionSelected', (data) => {
      this.handleSuggestionSelected(data);
    });
    
    this.uiOverlay.on('suggestionRejected', (data) => {
      this.handleSuggestionRejected(data);
    });
  }
  
  startMonitoring() {
    if (this.messageDetector) {
      this.messageDetector.startMonitoring();
    }
  }
  
  async handleMessageReceived(data) {
    try {
      const { message, contactId, platform, timestamp } = data;
      
      // Update current contact
      this.currentContact = await this.contactManager.getOrCreateContact(contactId, platform);
      
      // Add message to conversation context
      this.conversationContext.push({
        type: 'received',
        message,
        timestamp,
        contactId
      });
      
      // Keep only last 10 messages for context
      if (this.conversationContext.length > 10) {
        this.conversationContext.splice(0, this.conversationContext.length - 10);
      }
      
      // Analyze conversation style
      await this.conversationAnalyzer.analyzeMessage(message, this.currentContact);
      
      // Update contact data
      await this.contactManager.updateContact(this.currentContact);
      
      console.log('Message received and processed:', data);
    } catch (error) {
      console.error('Error handling received message:', error);
    }
  }
  
  async handleTypingDetected(data) {
    try {
      if (!this.isEnabled || !this.currentContact) return;
      
      const { contactId, platform } = data;
      
      // Check if this is the current contact
      if (contactId === this.currentContact.contactId) {
        // Generate AI suggestions
        await this.generateSuggestions();
      }
    } catch (error) {
      console.error('Error handling typing detection:', error);
    }
  }
  
  async handleContactChanged(data) {
    try {
      const { contactId, platform } = data;
      
      // Update current contact
      this.currentContact = await this.contactManager.getOrCreateContact(contactId, platform);
      
      // Clear conversation context for new contact
      this.conversationContext = [];
      
      console.log('Contact changed:', this.currentContact);
    } catch (error) {
      console.error('Error handling contact change:', error);
    }
  }
  
  async generateSuggestions() {
    try {
      if (!this.currentContact || this.conversationContext.length === 0) return;
      
      // Get the last received message
      const lastMessage = this.conversationContext
        .filter(ctx => ctx.type === 'received')
        .pop();
      
      if (!lastMessage) return;
      
      // Build conversation context
      const context = this.buildConversationContext();
      
      // Request AI response from background script
      chrome.runtime.sendMessage({
        type: 'GET_AI_RESPONSE',
        data: {
          message: lastMessage.message,
          context,
          contactId: this.currentContact.contactId,
          platform: this.currentContact.platform,
          contactStyle: this.currentContact.conversationStyle
        }
      }, (response) => {
        if (response && response.success) {
          this.showSuggestions(response.response, lastMessage.message);
        } else {
          console.error('Failed to get AI response:', response?.error);
        }
      });
      
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  }
  
  buildConversationContext() {
    if (this.conversationContext.length === 0) return '';
    
    // Build context from recent messages
    const recentMessages = this.conversationContext
      .slice(-5) // Last 5 messages
      .map(ctx => `${ctx.type === 'received' ? 'Them' : 'You'}: ${ctx.message}`)
      .join('\n');
    
    return recentMessages;
  }
  
  showSuggestions(aiResponse, originalMessage) {
    try {
      if (!this.uiOverlay) return;
      
      // Generate multiple suggestion options
      const suggestions = this.generateSuggestionOptions(aiResponse, originalMessage);
      
      // Show overlay with suggestions
      this.uiOverlay.showSuggestions(suggestions, this.currentContact);
      
    } catch (error) {
      console.error('Error showing suggestions:', error);
    }
  }
  
  generateSuggestionOptions(aiResponse, originalMessage) {
    const suggestions = [];
    
    // Direct response
    suggestions.push({
      id: 'direct',
      text: aiResponse,
      type: 'direct',
      description: 'Use as is'
    });
    
    // Polite delay response
    const politeDelay = this.addPoliteDelay(aiResponse);
    suggestions.push({
      id: 'polite',
      text: politeDelay,
      type: 'polite',
      description: 'Add polite delay'
    });
    
    // Engaging response
    const engaging = this.makeEngaging(aiResponse);
    suggestions.push({
      id: 'engaging',
      text: engaging,
      type: 'engaging',
      description: 'Make more engaging'
    });
    
    return suggestions;
  }
  
  addPoliteDelay(response) {
    const delayPhrases = [
      'Thanks for that! ',
      'I appreciate you sharing that. ',
      'That\'s interesting! ',
      'I see what you mean. '
    ];
    
    const randomDelay = delayPhrases[Math.floor(Math.random() * delayPhrases.length)];
    return randomDelay + response;
  }
  
  makeEngaging(response) {
    // Add engaging elements
    let engaging = response;
    
    // Add question if not present
    if (!response.includes('?') && !response.includes('!')) {
      engaging += ' What do you think?';
    }
    
    // Add emoji if appropriate
    if (this.currentContact?.conversationStyle?.emojiUsage > 0.5) {
      engaging += ' 😊';
    }
    
    return engaging;
  }
  
  async handleSuggestionSelected(data) {
    try {
      const { suggestion, contactId } = data;
      
      // Insert suggestion into input field
      await this.insertSuggestion(suggestion.text);
      
      // Track success
      await this.contactManager.recordSuggestionSuccess(contactId, suggestion, true);
      
      // Hide overlay
      this.uiOverlay.hide();
      
    } catch (error) {
      console.error('Error handling suggestion selection:', error);
    }
  }
  
  async handleSuggestionRejected(data) {
    try {
      const { suggestion, contactId } = data;
      
      // Track rejection
      await this.contactManager.recordSuggestionSuccess(contactId, suggestion, false);
      
      // Hide overlay
      this.uiOverlay.hide();
      
    } catch (error) {
      console.error('Error handling suggestion rejection:', error);
    }
  }
  
  async insertSuggestion(text) {
    try {
      // Use platform-specific adapter to insert text
      const platformAdapter = this.platformDetector.getPlatformAdapter();
      if (platformAdapter && platformAdapter.insertText) {
        await platformAdapter.insertText(text);
      }
    } catch (error) {
      console.error('Error inserting suggestion:', error);
    }
  }
  
  toggleSuggestions() {
    this.isEnabled = !this.isEnabled;
    
    if (this.isEnabled) {
      this.startMonitoring();
      console.log('Chatsy suggestions enabled');
    } else {
      this.uiOverlay?.hide();
      console.log('Chatsy suggestions disabled');
    }
  }
  
  updateSettings(settings) {
    // Update local settings
    Object.assign(this, settings);
    
    // Update UI overlay settings
    if (this.uiOverlay) {
      this.uiOverlay.updateSettings(settings);
    }
  }
  
  // Cleanup method
  destroy() {
    if (this.messageDetector) {
      this.messageDetector.stopMonitoring();
    }
    
    if (this.uiOverlay) {
      this.uiOverlay.destroy();
    }
    
    // Clear event listeners
    chrome.runtime.onMessage.removeListener(this.messageListener);
  }
}

// Initialize Chatsy when content script loads
const chatsy = new ChatsyContentScript();

// Export for potential external use
window.Chatsy = chatsy;
