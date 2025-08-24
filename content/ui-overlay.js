// UI Overlay for Chatsy Extension
// Displays AI suggestions in a floating interface

import { EventEmitter } from '../utils/event-emitter.js';

class UIOverlay extends EventEmitter {
  constructor(platformDetector) {
    super();
    this.platformDetector = platformDetector;
    this.overlayElement = null;
    this.suggestionsContainer = null;
    this.isVisible = false;
    this.currentSuggestions = [];
    this.currentContact = null;
    this.position = { x: 0, y: 0 };
    this.settings = {
      maxSuggestions: 3,
      autoHideDelay: 10000,
      position: 'auto'
    };
    
    this.init();
  }
  
  async init() {
    try {
      // Create overlay element
      this.createOverlay();
      
      // Load settings
      await this.loadSettings();
      
      // Set up event listeners
      this.setupEventListeners();
      
      console.log('UI Overlay initialized');
    } catch (error) {
      console.error('UI Overlay initialization error:', error);
    }
  }
  
  createOverlay() {
    try {
      // Create main overlay container
      this.overlayElement = document.createElement('div');
      this.overlayElement.id = 'chatsy-overlay';
      this.overlayElement.className = 'chatsy-overlay';
      
      // Create suggestions container
      this.suggestionsContainer = document.createElement('div');
      this.suggestionsContainer.className = 'chatsy-suggestions';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'chatsy-header';
      header.innerHTML = `
        <span class="chatsy-title">💬 Chatsy AI</span>
        <button class="chatsy-close" title="Close">×</button>
      `;
      
      // Create suggestions list
      const suggestionsList = document.createElement('div');
      suggestionsList.className = 'chatsy-suggestions-list';
      
      // Assemble overlay
      this.suggestionsContainer.appendChild(header);
      this.suggestionsContainer.appendChild(suggestionsList);
      this.overlayElement.appendChild(this.suggestionsContainer);
      
      // Add to page
      document.body.appendChild(this.overlayElement);
      
      // Initially hidden
      this.hide();
      
    } catch (error) {
      console.error('Error creating overlay:', error);
    }
  }
  
  setupEventListeners() {
    try {
      // Close button
      const closeBtn = this.overlayElement.querySelector('.chatsy-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hide());
      }
      
      // Click outside to close
      document.addEventListener('click', (event) => {
        if (!this.overlayElement.contains(event.target) && this.isVisible) {
          this.hide();
        }
      });
      
      // Keyboard shortcuts
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.isVisible) {
          this.hide();
        }
      });
      
      // Auto-hide timer
      this.autoHideTimer = null;
      
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }
  
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['settings']);
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  showSuggestions(suggestions, contact) {
    try {
      if (!suggestions || suggestions.length === 0) {
        console.warn('No suggestions to show');
        return;
      }
      
      this.currentSuggestions = suggestions;
      this.currentContact = contact;
      
      // Update suggestions list
      this.updateSuggestionsList();
      
      // Position overlay
      this.positionOverlay();
      
      // Show overlay
      this.show();
      
      // Start auto-hide timer
      this.startAutoHideTimer();
      
      console.log('Showing suggestions:', suggestions);
    } catch (error) {
      console.error('Error showing suggestions:', error);
    }
  }
  
  updateSuggestionsList() {
    try {
      const suggestionsList = this.overlayElement.querySelector('.chatsy-suggestions-list');
      if (!suggestionsList) return;
      
      // Clear existing suggestions
      suggestionsList.innerHTML = '';
      
      // Add each suggestion
      this.currentSuggestions.forEach((suggestion, index) => {
        const suggestionElement = this.createSuggestionElement(suggestion, index);
        suggestionsList.appendChild(suggestionElement);
      });
      
    } catch (error) {
      console.error('Error updating suggestions list:', error);
    }
  }
  
  createSuggestionElement(suggestion, index) {
    try {
      const element = document.createElement('div');
      element.className = 'chatsy-suggestion';
      element.dataset.suggestionId = suggestion.id;
      
      // Create suggestion content
      element.innerHTML = `
        <div class="chatsy-suggestion-text">${this.escapeHtml(suggestion.text)}</div>
        <div class="chatsy-suggestion-description">${suggestion.description}</div>
        <div class="chatsy-suggestion-actions">
          <button class="chatsy-use-btn" title="Use this suggestion">Use</button>
          <button class="chatsy-reject-btn" title="Reject">×</button>
        </div>
      `;
      
      // Add event listeners
      const useBtn = element.querySelector('.chatsy-use-btn');
      const rejectBtn = element.querySelector('.chatsy-reject-btn');
      
      if (useBtn) {
        useBtn.addEventListener('click', () => {
          this.handleSuggestionSelected(suggestion);
        });
      }
      
      if (rejectBtn) {
        rejectBtn.addEventListener('click', () => {
          this.handleSuggestionRejected(suggestion);
        });
      }
      
      // Add keyboard navigation
      element.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.handleSuggestionSelected(suggestion);
        }
      });
      
      // Make focusable
      element.tabIndex = 0;
      
      return element;
    } catch (error) {
      console.error('Error creating suggestion element:', error);
      return document.createElement('div');
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  positionOverlay() {
    try {
      if (!this.overlayElement) return;
      
      // Get input field position
      const inputField = this.findInputField();
      if (!inputField) {
        // Fallback positioning
        this.positionFallback();
        return;
      }
      
      const rect = inputField.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      // Calculate optimal position
      let x = rect.left;
      let y = rect.top - 10; // Above input field
      
      // Check if overlay fits above
      if (y < 100) {
        y = rect.bottom + 10; // Below input field
      }
      
      // Check horizontal bounds
      if (x + 300 > viewport.width) {
        x = viewport.width - 320;
      }
      if (x < 20) {
        x = 20;
      }
      
      // Apply position
      this.overlayElement.style.left = `${x}px`;
      this.overlayElement.style.top = `${y}px`;
      
      this.position = { x, y };
      
    } catch (error) {
      console.error('Error positioning overlay:', error);
      this.positionFallback();
    }
  }
  
  findInputField() {
    try {
      // Platform-specific input field detection
      const platform = this.platformDetector.currentPlatform;
      
      let selectors = [];
      switch (platform) {
        case 'whatsapp':
          selectors = [
            '[contenteditable="true"][data-testid="conversation-compose-box-input"]',
            '[contenteditable="true"]',
            'div[contenteditable="true"]'
          ];
          break;
        case 'instagram':
          selectors = [
            'textarea[placeholder*="Message"]',
            'textarea[aria-label*="Message"]',
            'textarea'
          ];
          break;
        case 'telegram':
          selectors = [
            '.input-message-input',
            '[contenteditable="true"]',
            'textarea'
          ];
          break;
        default:
          selectors = [
            '[contenteditable="true"]',
            'textarea',
            'input[type="text"]'
          ];
      }
      
      // Try each selector
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.offsetParent !== null) {
          return element;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding input field:', error);
      return null;
    }
  }
  
  positionFallback() {
    try {
      // Center in viewport as fallback
      const x = (window.innerWidth - 300) / 2;
      const y = (window.innerHeight - 200) / 2;
      
      this.overlayElement.style.left = `${x}px`;
      this.overlayElement.style.top = `${y}px`;
      
      this.position = { x, y };
    } catch (error) {
      console.error('Error in fallback positioning:', error);
    }
  }
  
  show() {
    try {
      if (this.isVisible) return;
      
      this.overlayElement.style.display = 'block';
      this.overlayElement.style.opacity = '0';
      
      // Animate in
      requestAnimationFrame(() => {
        this.overlayElement.style.transition = 'opacity 0.2s ease-in-out';
        this.overlayElement.style.opacity = '1';
      });
      
      this.isVisible = true;
      
      // Focus first suggestion for keyboard navigation
      const firstSuggestion = this.overlayElement.querySelector('.chatsy-suggestion');
      if (firstSuggestion) {
        firstSuggestion.focus();
      }
      
      console.log('Overlay shown');
    } catch (error) {
      console.error('Error showing overlay:', error);
    }
  }
  
  hide() {
    try {
      if (!this.isVisible) return;
      
      // Animate out
      this.overlayElement.style.transition = 'opacity 0.2s ease-in-out';
      this.overlayElement.style.opacity = '0';
      
      setTimeout(() => {
        this.overlayElement.style.display = 'none';
        this.isVisible = false;
        this.currentSuggestions = [];
        this.currentContact = null;
      }, 200);
      
      // Clear auto-hide timer
      this.clearAutoHideTimer();
      
      console.log('Overlay hidden');
    } catch (error) {
      console.error('Error hiding overlay:', error);
    }
  }
  
  startAutoHideTimer() {
    try {
      this.clearAutoHideTimer();
      
      this.autoHideTimer = setTimeout(() => {
        this.hide();
      }, this.settings.autoHideDelay);
      
    } catch (error) {
      console.error('Error starting auto-hide timer:', error);
    }
  }
  
  clearAutoHideTimer() {
    try {
      if (this.autoHideTimer) {
        clearTimeout(this.autoHideTimer);
        this.autoHideTimer = null;
      }
    } catch (error) {
      console.error('Error clearing auto-hide timer:', error);
    }
  }
  
  handleSuggestionSelected(suggestion) {
    try {
      // Emit event
      this.emit('suggestionSelected', {
        suggestion,
        contactId: this.currentContact?.contactId
      });
      
      // Hide overlay
      this.hide();
      
    } catch (error) {
      console.error('Error handling suggestion selection:', error);
    }
  }
  
  handleSuggestionRejected(suggestion) {
    try {
      // Emit event
      this.emit('suggestionRejected', {
        suggestion,
        contactId: this.currentContact?.contactId
      });
      
      // Hide overlay
      this.hide();
      
    } catch (error) {
      console.error('Error handling suggestion rejection:', error);
    }
  }
  
  updateSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      
      // Apply setting changes
      if (this.settings.maxSuggestions !== this.currentSuggestions.length) {
        this.updateSuggestionsList();
      }
      
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }
  
  // Get overlay state
  getState() {
    return {
      isVisible: this.isVisible,
      currentSuggestions: this.currentSuggestions.length,
      position: this.position,
      settings: this.settings
    };
  }
  
  // Cleanup method
  destroy() {
    try {
      this.hide();
      this.clearAutoHideTimer();
      
      if (this.overlayElement && this.overlayElement.parentNode) {
        this.overlayElement.parentNode.removeChild(this.overlayElement);
      }
      
      this.overlayElement = null;
      this.suggestionsContainer = null;
      
      console.log('UI Overlay destroyed');
    } catch (error) {
      console.error('Error destroying overlay:', error);
    }
  }
}

// Export for use in content script
export { UIOverlay };
