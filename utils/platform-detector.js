// Platform Detector for Chatsy Extension
// Identifies messaging platforms and provides appropriate adapters

import { WhatsAppAdapter } from '../content/platform-adapters/whatsapp.js';
import { InstagramAdapter } from '../content/platform-adapters/instagram.js';
import { TelegramAdapter } from '../content/platform-adapters/telegram.js';

class PlatformDetector {
  constructor() {
    this.currentPlatform = null;
    this.platformAdapter = null;
    this.supportedPlatforms = ['whatsapp', 'instagram', 'telegram'];
    
    this.init();
  }
  
  async init() {
    try {
      // Detect platform on initialization
      await this.detectPlatform();
      
      console.log('Platform detector initialized');
    } catch (error) {
      console.error('Platform detector initialization error:', error);
    }
  }
  
  async detectPlatform() {
    try {
      const hostname = window.location.hostname;
      const pathname = window.location.pathname;
      
      // WhatsApp Web detection
      if (hostname.includes('web.whatsapp.com') || hostname.includes('whatsapp.com')) {
        this.currentPlatform = 'whatsapp';
        this.platformAdapter = new WhatsAppAdapter();
        console.log('WhatsApp platform detected');
        return;
      }
      
      // Instagram detection
      if (hostname.includes('instagram.com') || hostname.includes('www.instagram.com')) {
        if (pathname.includes('/direct/') || pathname.includes('/messages/')) {
          this.currentPlatform = 'instagram';
          this.platformAdapter = new InstagramAdapter();
          console.log('Instagram platform detected');
          return;
        }
      }
      
      // Telegram Web detection
      if (hostname.includes('web.telegram.org') || hostname.includes('telegram.org')) {
        this.currentPlatform = 'telegram';
        this.platformAdapter = new TelegramAdapter();
        console.log('Telegram platform detected');
        return;
      }
      
      // Fallback: try to detect from page content
      const detectedPlatform = this.detectFromContent();
      if (detectedPlatform) {
        this.currentPlatform = detectedPlatform;
        this.platformAdapter = this.createAdapter(detectedPlatform);
        console.log(`${detectedPlatform} platform detected from content`);
        return;
      }
      
      // Default to unknown
      this.currentPlatform = 'unknown';
      this.platformAdapter = null;
      console.log('No supported platform detected');
      
    } catch (error) {
      console.error('Error detecting platform:', error);
      this.currentPlatform = 'unknown';
      this.platformAdapter = null;
    }
  }
  
  detectFromContent() {
    try {
      // Check for WhatsApp indicators
      if (this.hasWhatsAppIndicators()) {
        return 'whatsapp';
      }
      
      // Check for Instagram indicators
      if (this.hasInstagramIndicators()) {
        return 'instagram';
      }
      
      // Check for Telegram indicators
      if (this.hasTelegramIndicators()) {
        return 'telegram';
      }
      
      return null;
    } catch (error) {
      console.error('Error detecting platform from content:', error);
      return null;
    }
  }
  
  hasWhatsAppIndicators() {
    try {
      // Check for WhatsApp-specific elements
      const indicators = [
        '[data-testid="chat-list"]',
        '[data-testid="conversation-title"]',
        '.chat-list',
        '.conversation-list',
        'div[data-testid*="chat"]'
      ];
      
      return indicators.some(selector => document.querySelector(selector));
    } catch (error) {
      return false;
    }
  }
  
  hasInstagramIndicators() {
    try {
      // Check for Instagram-specific elements
      const indicators = [
        '[data-testid="direct-message"]',
        '.direct-message',
        '.ig-dm',
        'div[data-testid*="dm"]',
        'div[data-testid*="message"]'
      ];
      
      return indicators.some(selector => document.querySelector(selector));
    } catch (error) {
      return false;
    }
  }
  
  hasTelegramIndicators() {
    try {
      // Check for Telegram-specific elements
      const indicators = [
        '.chat-list',
        '.message-list',
        '.chat-item',
        '.message',
        'div[data-peer-id]'
      ];
      
      return indicators.some(selector => document.querySelector(selector));
    } catch (error) {
      return false;
    }
  }
  
  createAdapter(platform) {
    try {
      switch (platform) {
        case 'whatsapp':
          return new WhatsAppAdapter();
        case 'instagram':
          return new InstagramAdapter();
        case 'telegram':
          return new TelegramAdapter();
        default:
          return null;
      }
    } catch (error) {
      console.error('Error creating platform adapter:', error);
      return null;
    }
  }
  
  getPlatformAdapter() {
    return this.platformAdapter;
  }
  
  getCurrentPlatform() {
    return this.currentPlatform;
  }
  
  isSupportedPlatform() {
    return this.supportedPlatforms.includes(this.currentPlatform);
  }
  
  // Get platform-specific configuration
  getPlatformConfig() {
    if (!this.currentPlatform) return null;
    
    const configs = {
      whatsapp: {
        messageSelectors: [
          '[data-testid="msg-meta"]',
          '.message-in',
          '.message-out'
        ],
        inputSelectors: [
          '[contenteditable="true"][data-testid="conversation-compose-box-input"]',
          '[contenteditable="true"]'
        ],
        typingSelectors: [
          '[data-testid="conversation-typing"]',
          '.typing-indicator'
        ]
      },
      instagram: {
        messageSelectors: [
          '[data-testid="direct-message"]',
          '.direct-message'
        ],
        inputSelectors: [
          'textarea[placeholder*="Message"]',
          'textarea[aria-label*="Message"]'
        ],
        typingSelectors: [
          '.typing-indicator',
          '[data-testid="typing"]'
        ]
      },
      telegram: {
        messageSelectors: [
          '.message',
          '.message-text'
        ],
        inputSelectors: [
          '.input-message-input',
          '[contenteditable="true"]'
        ],
        typingSelectors: [
          '.typing-indicator',
          '.typing'
        ]
      }
    };
    
    return configs[this.currentPlatform] || null;
  }
  
  // Check if platform is ready for interaction
  isPlatformReady() {
    try {
      if (!this.currentPlatform || !this.platformAdapter) {
        return false;
      }
      
      // Check if platform-specific elements are loaded
      const config = this.getPlatformConfig();
      if (!config) return false;
      
      // Check for input field
      const hasInput = config.inputSelectors.some(selector => 
        document.querySelector(selector)
      );
      
      // Check for message container
      const hasMessages = config.messageSelectors.some(selector => 
        document.querySelector(selector)
      );
      
      return hasInput && hasMessages;
    } catch (error) {
      console.error('Error checking platform readiness:', error);
      return false;
    }
  }
  
  // Wait for platform to be ready
  async waitForPlatformReady(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkReady = () => {
        if (this.isPlatformReady()) {
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error('Platform ready timeout'));
          return;
        }
        
        setTimeout(checkReady, 100);
      };
      
      checkReady();
    });
  }
  
  // Get platform metadata
  getPlatformMetadata() {
    if (!this.currentPlatform) return null;
    
    return {
      platform: this.currentPlatform,
      url: window.location.href,
      title: document.title,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };
  }
  
  // Force platform redetection
  async redetectPlatform() {
    try {
      this.currentPlatform = null;
      this.platformAdapter = null;
      
      await this.detectPlatform();
      
      console.log('Platform redetection completed:', this.currentPlatform);
      return this.currentPlatform;
    } catch (error) {
      console.error('Error during platform redetection:', error);
      return null;
    }
  }
}

// Export for use in content script
export { PlatformDetector };
