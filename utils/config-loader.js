// Configuration Loader for Chatsy Extension
// Handles loading configuration from environment files and variables

class ConfigLoader {
  constructor() {
    this.config = {};
    this.envFile = null;
    this.init();
  }
  
  async init() {
    try {
      // Load default configuration
      this.loadDefaultConfig();
      
      // Try to load environment file
      await this.loadEnvFile();
      
      // Load environment variables
      this.loadEnvironmentVariables();
      
      // Validate configuration
      this.validateConfig();
      
      console.log('Configuration loaded successfully');
    } catch (error) {
      console.error('Configuration loading error:', error);
      // Use default configuration if loading fails
      this.useDefaultConfig();
    }
  }
  
  // Load default configuration
  loadDefaultConfig() {
    this.config = {
      // AI API Configuration
      ai: {
        provider: 'huggingface',
        huggingface: {
          apiKey: '',
          apiUrl: 'https://api-inference.huggingface.co/models',
          modelName: 'microsoft/DialoGPT-medium',
          maxLength: 100,
          temperature: 0.7
        },
        gemini: {
          apiKey: '',
          apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
          modelName: 'gemini-pro',
          maxTokens: 150,
          temperature: 0.8
        },
        confidenceThreshold: 0.7,
        fallbackEnabled: true,
        cacheEnabled: true,
        cacheTtlMinutes: 30
      },
      
      // Extension Configuration
      extension: {
        name: 'Chatsy AI Assistant',
        version: '1.0.0',
        description: 'AI-powered privacy-first texting assistant',
        author: 'Chatsy Team'
      },
      
      // Privacy & Security
      privacy: {
        encryptionAlgorithm: 'AES-256-GCM',
        encryptionKeyLength: 32,
        privacyLevel: 'high',
        dataRetentionDays: 30,
        maxCacheSizeMB: 50,
        enableDataEncryption: true,
        enableContactAnonymization: true,
        enableMessageSanitization: true,
        enableConsentManagement: true
      },
      
      // AI Settings
      settings: {
        maxSuggestions: 3,
        responseDelayMs: 1000,
        contextWindowSize: 5,
        maxMessageLength: 500,
        autoHideSuggestionsMs: 10000,
        suggestionPositioning: 'auto',
        enableKeyboardShortcuts: true,
        enableVoiceInput: false
      },
      
      // Rate Limiting
      rateLimit: {
        maxRequestsPerMinute: 60,
        maxRequestsPerHour: 1000,
        rateLimitWindowMs: 60000
      },
      
      // Platform Configuration
      platforms: {
        whatsapp: {
          enabled: true,
          domain: 'web.whatsapp.com',
          messageSelectors: ['[data-testid="msg-meta"]', '.message-in', '.message-out'],
          inputSelectors: ['[contenteditable="true"][data-testid="conversation-compose-box-input"]']
        },
        instagram: {
          enabled: true,
          domain: 'www.instagram.com',
          messageSelectors: ['[data-testid="direct-message"]', '.direct-message', '.ig-dm'],
          inputSelectors: ['textarea[placeholder*="Message"]', 'textarea[aria-label*="Message"]']
        },
        telegram: {
          enabled: true,
          domain: 'web.telegram.org',
          messageSelectors: ['.message', '.message-text', '.text', '[data-peer-id]'],
          inputSelectors: ['.input-message-input', '[contenteditable="true"]']
        }
      },
      
      // Development & Debugging
      development: {
        nodeEnv: 'development',
        debugMode: false,
        logLevel: 'info',
        enableConsoleLogs: true,
        enablePerformanceMonitoring: false,
        enableMockAiResponses: false,
        mockResponseDelayMs: 500
      },
      
      // Performance & Optimization
      performance: {
        maxMemoryUsageMB: 100,
        garbageCollectionIntervalMs: 300000,
        cacheCleanupIntervalMs: 600000,
        requestTimeoutMs: 10000,
        retryAttempts: 3,
        retryDelayMs: 1000,
        enableRequestCaching: true,
        enableLazyLoading: true,
        maxDomObservers: 5,
        debounceDelayMs: 300
      },
      
      // Security & Compliance
      security: {
        cspDefaultSrc: "'self'",
        cspScriptSrc: "'self' 'unsafe-inline'",
        cspStyleSrc: "'self' 'unsafe-inline'",
        cspConnectSrc: "'self' https://api-inference.huggingface.co https://generativelanguage.googleapis.com",
        gdprCompliant: true,
        ccpaCompliant: true,
        coppaCompliant: true,
        enableDataExport: true,
        enableDataDeletion: true
      },
      
      // External Services
      services: {
        cdnUrl: 'https://cdn.chatsy.ai',
        assetsVersion: 'v1.0.0',
        updateCheckUrl: 'https://updates.chatsy.ai',
        updateCheckIntervalHours: 24,
        supportEmail: 'support@chatsy.ai',
        documentationUrl: 'https://docs.chatsy.ai',
        githubRepo: 'https://github.com/chatsy/extension',
        issuesUrl: 'https://github.com/chatsy/extension/issues'
      }
    };
  }
  
  // Load environment file
  async loadEnvFile() {
    try {
      // Try to load from chrome.storage.local first
      const result = await chrome.storage.local.get(['config_env']);
      if (result.config_env) {
        this.parseEnvContent(result.config_env);
        return;
      }
      
      // Try to load from fetch if available
      try {
        const response = await fetch(chrome.runtime.getURL('config.env'));
        if (response.ok) {
          const content = await response.text();
          this.parseEnvContent(content);
          // Store in chrome.storage.local for future use
          await chrome.storage.local.set({ config_env: content });
        }
      } catch (fetchError) {
        console.log('Could not load config.env file:', fetchError.message);
      }
      
    } catch (error) {
      console.log('Environment file loading skipped:', error.message);
    }
  }
  
  // Parse environment file content
  parseEnvContent(content) {
    try {
      const lines = content.split('\n');
      
      lines.forEach(line => {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || !line.trim() || !line.includes('=')) {
          return;
        }
        
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        
        if (key && value) {
          this.setConfigValue(key.trim(), value);
        }
      });
      
      console.log('Environment file parsed successfully');
    } catch (error) {
      console.error('Error parsing environment file:', error);
    }
  }
  
  // Load environment variables
  loadEnvironmentVariables() {
    try {
      // Check for environment variables (useful for production deployments)
      const envVars = [
        'HUGGINGFACE_API_KEY',
        'GEMINI_API_KEY',
        'NODE_ENV',
        'DEBUG_MODE',
        'LOG_LEVEL'
      ];
      
      envVars.forEach(key => {
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
          this.setConfigValue(key, process.env[key]);
        }
      });
      
    } catch (error) {
      console.log('Environment variables loading skipped:', error.message);
    }
  }
  
  // Set configuration value using dot notation
  setConfigValue(key, value) {
    try {
      const keys = key.toLowerCase().split('_');
      let current = this.config;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k]) {
          current[k] = {};
        }
        current = current[k];
      }
      
      const lastKey = keys[keys.length - 1];
      
      // Convert value to appropriate type
      if (value === 'true' || value === 'false') {
        current[lastKey] = value === 'true';
      } else if (!isNaN(value) && value !== '') {
        current[lastKey] = Number(value);
      } else if (value.startsWith('[') && value.endsWith(']')) {
        try {
          current[lastKey] = JSON.parse(value);
        } catch {
          current[lastKey] = value;
        }
      } else {
        current[lastKey] = value;
      }
      
    } catch (error) {
      console.error('Error setting config value:', key, value, error);
    }
  }
  
  // Validate configuration
  validateConfig() {
    try {
      const errors = [];
      
      // Check required fields
      if (!this.config.ai.huggingface.apiKey && !this.config.ai.gemini.apiKey) {
        errors.push('At least one AI API key is required');
      }
      
      // Validate numeric values
      if (this.config.settings.maxSuggestions < 1 || this.config.settings.maxSuggestions > 10) {
        errors.push('maxSuggestions must be between 1 and 10');
      }
      
      if (this.config.settings.responseDelayMs < 0 || this.config.settings.responseDelayMs > 10000) {
        errors.push('responseDelayMs must be between 0 and 10000');
      }
      
      if (errors.length > 0) {
        console.warn('Configuration validation warnings:', errors);
      }
      
    } catch (error) {
      console.error('Configuration validation error:', error);
    }
  }
  
  // Use default configuration
  useDefaultConfig() {
    console.log('Using default configuration');
    this.loadDefaultConfig();
  }
  
  // Get configuration value
  get(key, defaultValue = null) {
    try {
      const keys = key.split('.');
      let current = this.config;
      
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          return defaultValue;
        }
      }
      
      return current;
    } catch (error) {
      console.error('Error getting config value:', key, error);
      return defaultValue;
    }
  }
  
  // Set configuration value
  set(key, value) {
    try {
      const keys = key.split('.');
      let current = this.config;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k] || typeof current[k] !== 'object') {
          current[k] = {};
        }
        current = current[k];
      }
      
      current[keys[keys.length - 1]] = value;
      
      // Save to storage
      this.saveToStorage();
      
    } catch (error) {
      console.error('Error setting config value:', key, value, error);
    }
  }
  
  // Save configuration to storage
  async saveToStorage() {
    try {
      await chrome.storage.local.set({ 
        chatsy_config: this.config,
        config_updated: Date.now()
      });
    } catch (error) {
      console.error('Error saving configuration to storage:', error);
    }
  }
  
  // Load configuration from storage
  async loadFromStorage() {
    try {
      const result = await chrome.storage.local.get(['chatsy_config']);
      if (result.chatsy_config) {
        this.config = { ...this.config, ...result.chatsy_config };
        console.log('Configuration loaded from storage');
      }
    } catch (error) {
      console.error('Error loading configuration from storage:', error);
    }
  }
  
  // Get all configuration
  getAll() {
    return { ...this.config };
  }
  
  // Reset configuration to defaults
  reset() {
    this.loadDefaultConfig();
    this.saveToStorage();
    console.log('Configuration reset to defaults');
  }
  
  // Export configuration
  export() {
    try {
      return JSON.stringify(this.config, null, 2);
    } catch (error) {
      console.error('Error exporting configuration:', error);
      return '{}';
    }
  }
  
  // Import configuration
  import(configString) {
    try {
      const newConfig = JSON.parse(configString);
      this.config = { ...this.config, ...newConfig };
      this.saveToStorage();
      console.log('Configuration imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing configuration:', error);
      return false;
    }
  }
  
  // Check if configuration is valid
  isValid() {
    try {
      return this.config && 
             this.config.ai && 
             (this.config.ai.huggingface.apiKey || this.config.ai.gemini.apiKey);
    } catch (error) {
      return false;
    }
  }
  
  // Get configuration summary
  getSummary() {
    try {
      return {
        aiProvider: this.config.ai.provider,
        maxSuggestions: this.config.settings.maxSuggestions,
        privacyLevel: this.config.privacy.privacyLevel,
        platforms: Object.keys(this.config.platforms).filter(p => this.config.platforms[p].enabled),
        hasApiKeys: !!(this.config.ai.huggingface.apiKey || this.config.ai.gemini.apiKey),
        version: this.config.extension.version
      };
    } catch (error) {
      console.error('Error getting configuration summary:', error);
      return {};
    }
  }
}

// Create global instance
const configLoader = new ConfigLoader();

// Export for use in other modules
export { ConfigLoader, configLoader };
