// Chatsy Popup JavaScript
// Handles popup interface functionality and user interactions

class ChatsyPopup {
  constructor() {
    this.settings = {};
    this.apiKeys = {};
    this.stats = {};
    this.currentTab = null;
    
    this.init();
  }
  
  async init() {
    try {
      // Get current tab
      await this.getCurrentTab();
      
      // Load settings and data
      await this.loadData();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Update UI
      this.updateUI();
      
      console.log('Chatsy popup initialized');
    } catch (error) {
      console.error('Popup initialization error:', error);
    }
  }
  
  // Get current active tab
  async getCurrentTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tabs[0];
    } catch (error) {
      console.error('Error getting current tab:', error);
    }
  }
  
  // Load settings and data from storage
  async loadData() {
    try {
      // Load settings
      const settingsResult = await chrome.storage.local.get(['settings']);
      this.settings = settingsResult.settings || {
        enabled: true,
        privacyLevel: 'high',
        aiProvider: 'huggingface',
        maxSuggestions: 3,
        responseDelay: 1000
      };
      
      // Load API keys
      const apiKeysResult = await chrome.storage.local.get(['apiKeys']);
      this.apiKeys = apiKeysResult.apiKeys || {};
      
      // Load statistics
      await this.loadStats();
      
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }
  
  // Load statistics from storage
  async loadStats() {
    try {
      const result = await chrome.storage.local.get(['conversationStats', 'contactData']);
      
      this.stats = {
        totalContacts: 0,
        totalMessages: 0,
        acceptedSuggestions: 0,
        rejectedSuggestions: 0
      };
      
      if (result.contactData) {
        this.stats.totalContacts = Object.keys(result.contactData).length;
        
        // Calculate total messages and suggestion metrics
        Object.values(result.contactData).forEach(contact => {
          this.stats.totalMessages += contact.metadata?.messageCount || 0;
          this.stats.acceptedSuggestions += contact.successMetrics?.acceptedCount || 0;
          this.stats.rejectedSuggestions += contact.successMetrics?.rejectedCount || 0;
        });
      }
      
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
  
  // Set up event listeners
  setupEventListeners() {
    try {
      // Toggle button
      const toggleBtn = document.getElementById('toggleBtn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggleSuggestions());
      }
      
      // Refresh button
      const refreshBtn = document.getElementById('refreshBtn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => this.refreshData());
      }
      
      // Settings changes
      const aiProviderSelect = document.getElementById('aiProviderSelect');
      if (aiProviderSelect) {
        aiProviderSelect.addEventListener('change', (e) => this.updateSetting('aiProvider', e.target.value));
      }
      
      const maxSuggestionsSelect = document.getElementById('maxSuggestionsSelect');
      if (maxSuggestionsSelect) {
        maxSuggestionsSelect.addEventListener('change', (e) => this.updateSetting('maxSuggestions', parseInt(e.target.value)));
      }
      
      const responseDelaySelect = document.getElementById('responseDelaySelect');
      if (responseDelaySelect) {
        responseDelaySelect.addEventListener('change', (e) => this.updateSetting('responseDelay', parseInt(e.target.value)));
      }
      
      // API key saves
      const saveHfBtn = document.getElementById('saveHfBtn');
      if (saveHfBtn) {
        saveHfBtn.addEventListener('click', () => this.saveApiKey('huggingface'));
      }
      
      const saveGeminiBtn = document.getElementById('saveGeminiBtn');
      if (saveGeminiBtn) {
        saveGeminiBtn.addEventListener('click', () => this.saveApiKey('gemini');
      }
      
      // Privacy actions
      const exportDataBtn = document.getElementById('exportDataBtn');
      if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => this.exportData());
      }
      
      const clearDataBtn = document.getElementById('clearDataBtn');
      if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => this.showClearDataModal());
      }
      
      // Footer links
      const helpLink = document.getElementById('helpLink');
      if (helpLink) {
        helpLink.addEventListener('click', (e) => {
          e.preventDefault();
          this.showHelp();
        });
      }
      
      const feedbackLink = document.getElementById('feedbackLink');
      if (feedbackLink) {
        feedbackLink.addEventListener('click', (e) => {
          e.preventDefault();
          this.showFeedback();
        });
      }
      
      // Modal events
      const modalClose = document.getElementById('modalClose');
      if (modalClose) {
        modalClose.addEventListener('click', () => this.hideModal());
      }
      
      const modalCancel = document.getElementById('modalCancel');
      if (modalCancel) {
        modalCancel.addEventListener('click', () => this.hideModal());
      }
      
      const modalConfirm = document.getElementById('modalConfirm');
      if (modalConfirm) {
        modalConfirm.addEventListener('click', () => this.confirmModalAction());
      }
      
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }
  
  // Update UI with current data
  updateUI() {
    try {
      // Update status
      this.updateStatus();
      
      // Update platform info
      this.updatePlatformInfo();
      
      // Update statistics
      this.updateStatistics();
      
      // Update settings
      this.updateSettingsUI();
      
      // Update API key inputs
      this.updateApiKeyInputs();
      
    } catch (error) {
      console.error('Error updating UI:', error);
    }
  }
  
  // Update status indicator
  updateStatus() {
    try {
      const statusDot = document.getElementById('statusDot');
      const statusText = document.getElementById('statusText');
      const toggleBtn = document.getElementById('toggleBtn');
      
      if (this.settings.enabled) {
        if (statusDot) statusDot.classList.remove('inactive');
        if (statusText) statusText.textContent = 'Active';
        if (toggleBtn) {
          toggleBtn.querySelector('.btn-icon').textContent = '🔇';
          toggleBtn.querySelector('.btn-text').textContent = 'Disable Suggestions';
        }
      } else {
        if (statusDot) statusDot.classList.add('inactive');
        if (statusText) statusText.textContent = 'Disabled';
        if (toggleBtn) {
          toggleBtn.querySelector('.btn-icon').textContent = '🔊';
          toggleBtn.querySelector('.btn-text').textContent = 'Enable Suggestions';
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }
  
  // Update platform information
  updatePlatformInfo() {
    try {
      const platformInfo = document.getElementById('platformInfo');
      if (!platformInfo) return;
      
      if (this.currentTab && this.isSupportedPlatform(this.currentTab.url)) {
        const platform = this.detectPlatform(this.currentTab.url);
        const platformIcon = platformInfo.querySelector('.platform-icon');
        const platformName = platformInfo.querySelector('.platform-name');
        const platformStatus = platformInfo.querySelector('.platform-status');
        
        if (platformIcon) platformIcon.textContent = this.getPlatformIcon(platform);
        if (platformName) platformName.textContent = this.getPlatformName(platform);
        if (platformStatus) platformStatus.textContent = 'Platform detected';
      } else {
        const platformIcon = platformInfo.querySelector('.platform-icon');
        const platformName = platformInfo.querySelector('.platform-name');
        const platformStatus = platformInfo.querySelector('.platform-status');
        
        if (platformIcon) platformIcon.textContent = '🌐';
        if (platformName) platformName.textContent = 'Not detected';
        if (platformStatus) platformStatus.textContent = 'Please visit a supported messaging platform';
      }
    } catch (error) {
      console.error('Error updating platform info:', error);
    }
  }
  
  // Update statistics display
  updateStatistics() {
    try {
      const totalContacts = document.getElementById('totalContacts');
      const totalMessages = document.getElementById('totalMessages');
      const acceptedSuggestions = document.getElementById('acceptedSuggestions');
      const rejectedSuggestions = document.getElementById('rejectedSuggestions');
      
      if (totalContacts) totalContacts.textContent = this.stats.totalContacts;
      if (totalMessages) totalMessages.textContent = this.stats.totalMessages;
      if (acceptedSuggestions) acceptedSuggestions.textContent = this.stats.acceptedSuggestions;
      if (rejectedSuggestions) rejectedSuggestions.textContent = this.stats.rejectedSuggestions;
    } catch (error) {
      console.error('Error updating statistics:', error);
    }
  }
  
  // Update settings UI
  updateSettingsUI() {
    try {
      const aiProviderSelect = document.getElementById('aiProviderSelect');
      const maxSuggestionsSelect = document.getElementById('maxSuggestionsSelect');
      const responseDelaySelect = document.getElementById('responseDelaySelect');
      
      if (aiProviderSelect) aiProviderSelect.value = this.settings.aiProvider;
      if (maxSuggestionsSelect) maxSuggestionsSelect.value = this.settings.maxSuggestions;
      if (responseDelaySelect) responseDelaySelect.value = this.settings.responseDelay;
    } catch (error) {
      console.error('Error updating settings UI:', error);
    }
  }
  
  // Update API key input fields
  updateApiKeyInputs() {
    try {
      const hfApiKey = document.getElementById('hfApiKey');
      const geminiApiKey = document.getElementById('geminiApiKey');
      
      if (hfApiKey) hfApiKey.value = this.apiKeys.huggingface || '';
      if (geminiApiKey) geminiApiKey.value = this.apiKeys.gemini || '';
    } catch (error) {
      console.error('Error updating API key inputs:', error);
    }
  }
  
  // Toggle suggestions on/off
  async toggleSuggestions() {
    try {
      this.settings.enabled = !this.settings.enabled;
      
      // Save settings
      await chrome.storage.local.set({ settings: this.settings });
      
      // Send message to content script
      if (this.currentTab) {
        chrome.tabs.sendMessage(this.currentTab.id, {
          type: 'UPDATE_SETTINGS',
          data: { enabled: this.settings.enabled }
        }).catch(() => {
          // Content script not available
        });
      }
      
      // Update UI
      this.updateStatus();
      
      console.log('Suggestions toggled:', this.settings.enabled);
    } catch (error) {
      console.error('Error toggling suggestions:', error);
    }
  }
  
  // Refresh data
  async refreshData() {
    try {
      this.showLoading(true);
      
      // Reload data
      await this.loadData();
      
      // Update UI
      this.updateUI();
      
      // Hide loading
      setTimeout(() => this.showLoading(false), 500);
      
      console.log('Data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
      this.showLoading(false);
    }
  }
  
  // Update a setting
  async updateSetting(key, value) {
    try {
      this.settings[key] = value;
      
      // Save settings
      await chrome.storage.local.set({ settings: this.settings });
      
      // Send message to content script
      if (this.currentTab) {
        chrome.tabs.sendMessage(this.currentTab.id, {
          type: 'UPDATE_SETTINGS',
          data: { [key]: value }
        }).catch(() => {
          // Content script not available
        });
      }
      
      console.log('Setting updated:', key, value);
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  }
  
  // Save API key
  async saveApiKey(provider) {
    try {
      const inputId = provider === 'huggingface' ? 'hfApiKey' : 'geminiApiKey';
      const input = document.getElementById(inputId);
      
      if (!input) return;
      
      const apiKey = input.value.trim();
      
      if (!apiKey) {
        this.showNotification('Please enter an API key', 'error');
        return;
      }
      
      // Save API key
      this.apiKeys[provider] = apiKey;
      await chrome.storage.local.set({ apiKeys: this.apiKeys });
      
      // Send message to background script
      chrome.runtime.sendMessage({
        type: 'UPDATE_API_KEYS',
        data: { [provider]: apiKey }
      });
      
      this.showNotification(`${provider} API key saved`, 'success');
      
      console.log('API key saved for:', provider);
    } catch (error) {
      console.error('Error saving API key:', error);
      this.showNotification('Failed to save API key', 'error');
    }
  }
  
  // Export data
  async exportData() {
    try {
      const result = await chrome.storage.local.get(null);
      
      // Create download
      const dataStr = JSON.stringify(result, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chatsy-data-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      this.showNotification('Data exported successfully', 'success');
      
      console.log('Data exported');
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showNotification('Failed to export data', 'error');
    }
  }
  
  // Show clear data confirmation modal
  showClearDataModal() {
    try {
      const modal = document.getElementById('modalOverlay');
      const modalTitle = document.getElementById('modalTitle');
      const modalMessage = document.getElementById('modalMessage');
      
      if (modal && modalTitle && modalMessage) {
        modalTitle.textContent = 'Clear All Data';
        modalMessage.textContent = 'This will permanently delete all your Chatsy data including contacts, conversation history, and settings. This action cannot be undone.';
        
        modal.classList.add('show');
        
        // Store action for confirmation
        this.pendingAction = 'clearData';
      }
    } catch (error) {
      console.error('Error showing clear data modal:', error);
    }
  }
  
  // Hide modal
  hideModal() {
    try {
      const modal = document.getElementById('modalOverlay');
      if (modal) {
        modal.classList.remove('show');
        this.pendingAction = null;
      }
    } catch (error) {
      console.error('Error hiding modal:', error);
    }
  }
  
  // Confirm modal action
  async confirmModalAction() {
    try {
      if (this.pendingAction === 'clearData') {
        await this.clearAllData();
      }
      
      this.hideModal();
    } catch (error) {
      console.error('Error confirming modal action:', error);
    }
  }
  
  // Clear all data
  async clearAllData() {
    try {
      this.showLoading(true);
      
      // Clear storage
      await chrome.storage.local.clear();
      
      // Reset local data
      this.settings = {
        enabled: true,
        privacyLevel: 'high',
        aiProvider: 'huggingface',
        maxSuggestions: 3,
        responseDelay: 1000
      };
      
      this.apiKeys = {};
      this.stats = {
        totalContacts: 0,
        totalMessages: 0,
        acceptedSuggestions: 0,
        rejectedSuggestions: 0
      };
      
      // Save default settings
      await chrome.storage.local.set({ settings: this.settings });
      
      // Update UI
      this.updateUI();
      
      this.showLoading(false);
      this.showNotification('All data cleared', 'success');
      
      console.log('All data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
      this.showLoading(false);
      this.showNotification('Failed to clear data', 'error');
    }
  }
  
  // Show help
  showHelp() {
    try {
      const helpUrl = 'https://github.com/chatsy/extension/wiki';
      chrome.tabs.create({ url: helpUrl });
    } catch (error) {
      console.error('Error showing help:', error);
    }
  }
  
  // Show feedback
  showFeedback() {
    try {
      const feedbackUrl = 'https://github.com/chatsy/extension/issues';
      chrome.tabs.create({ url: feedbackUrl });
    } catch (error) {
      console.error('Error showing feedback:', error);
    }
  }
  
  // Show loading overlay
  showLoading(show) {
    try {
      const loadingOverlay = document.getElementById('loadingOverlay');
      if (loadingOverlay) {
        if (show) {
          loadingOverlay.classList.add('show');
        } else {
          loadingOverlay.classList.remove('show');
        }
      }
    } catch (error) {
      console.error('Error showing loading:', error);
    }
  }
  
  // Show notification
  showNotification(message, type = 'info') {
    try {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;
      
      // Add to page
      document.body.appendChild(notification);
      
      // Show notification
      setTimeout(() => notification.classList.add('show'), 100);
      
      // Remove after delay
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
      
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
  
  // Check if URL is a supported platform
  isSupportedPlatform(url) {
    if (!url) return false;
    
    const supportedPlatforms = [
      'web.whatsapp.com',
      'www.instagram.com',
      'web.telegram.org'
    ];
    
    return supportedPlatforms.some(platform => url.includes(platform));
  }
  
  // Detect platform from URL
  detectPlatform(url) {
    if (url.includes('web.whatsapp.com')) return 'whatsapp';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('telegram.org')) return 'telegram';
    return 'unknown';
  }
  
  // Get platform icon
  getPlatformIcon(platform) {
    const icons = {
      whatsapp: '📱',
      instagram: '📷',
      telegram: '✈️',
      unknown: '🌐'
    };
    
    return icons[platform] || icons.unknown;
  }
  
  // Get platform name
  getPlatformName(platform) {
    const names = {
      whatsapp: 'WhatsApp Web',
      instagram: 'Instagram Direct',
      telegram: 'Telegram Web',
      unknown: 'Unknown Platform'
    };
    
    return names[platform] || names.unknown;
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChatsyPopup();
});

// Add notification styles
const style = document.createElement('style');
style.textContent = `
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  .notification.show {
    transform: translateX(0);
  }
  
  .notification-info {
    background: #3b82f6;
  }
  
  .notification-success {
    background: #10b981;
  }
  
  .notification-error {
    background: #ef4444;
  }
  
  .notification-warning {
    background: #f59e0b;
  }
`;
document.head.appendChild(style);
