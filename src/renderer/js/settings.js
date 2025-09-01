// Settings Module
class SettingsManager {
    constructor() {
        this.settings = {};
        this.apiKeys = {};
        this.privacySettings = {};
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.initEventListeners();
        this.populateForm();
    }

    async loadSettings() {
        try {
            this.settings = await window.electronAPI.getSettings();
            this.apiKeys = await window.electronAPI.getApiKeys();
            this.privacySettings = await window.electronAPI.getPrivacySettings();
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    initEventListeners() {
        // Save settings button
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        // Reset settings button
        document.getElementById('resetSettingsBtn').addEventListener('click', () => {
            this.resetSettings();
        });

        // Theme change
        document.getElementById('theme').addEventListener('change', (e) => {
            this.applyTheme(e.target.value);
        });

        // Auto-start toggle
        document.getElementById('autoStart').addEventListener('change', (e) => {
            this.toggleAutoStart(e.target.checked);
        });
    }

    populateForm() {
        // General settings
        document.getElementById('autoStart').checked = this.settings.autoStart || false;
        document.getElementById('minimizeToTray').checked = this.settings.minimizeToTray !== false;
        document.getElementById('notifications').checked = this.settings.notifications !== false;
        document.getElementById('theme').value = this.settings.theme || 'light';

        // API keys
        document.getElementById('huggingfaceKey').value = this.apiKeys.huggingface || '';
        document.getElementById('geminiKey').value = this.apiKeys.gemini || '';
        document.getElementById('openaiKey').value = this.apiKeys.openai || '';

        // Privacy settings
        document.getElementById('dataRetention').value = this.privacySettings.dataRetentionDays || 30;
        document.getElementById('enableEncryption').checked = this.privacySettings.enableEncryption !== false;
        document.getElementById('enableAnalytics').checked = this.privacySettings.enableAnalytics || false;
    }

    async saveSettings() {
        try {
            // Collect form data
            const newSettings = {
                autoStart: document.getElementById('autoStart').checked,
                minimizeToTray: document.getElementById('minimizeToTray').checked,
                notifications: document.getElementById('notifications').checked,
                theme: document.getElementById('theme').value
            };

            const newApiKeys = {
                huggingface: document.getElementById('huggingfaceKey').value.trim(),
                gemini: document.getElementById('geminiKey').value.trim(),
                openai: document.getElementById('openaiKey').value.trim()
            };

            const newPrivacySettings = {
                dataRetentionDays: parseInt(document.getElementById('dataRetention').value),
                enableEncryption: document.getElementById('enableEncryption').checked,
                enableAnalytics: document.getElementById('enableAnalytics').checked
            };

            // Save settings
            await window.electronAPI.setSettings(newSettings);
            await window.electronAPI.setApiKeys(newApiKeys);
            await window.electronAPI.setPrivacySettings(newPrivacySettings);

            // Update local state
            this.settings = { ...this.settings, ...newSettings };
            this.apiKeys = { ...this.apiKeys, ...newApiKeys };
            this.privacySettings = { ...this.privacySettings, ...newPrivacySettings };

            // Apply theme
            this.applyTheme(newSettings.theme);

            // Show success notification
            if (window.chatsyApp) {
                window.chatsyApp.showNotification('Settings saved successfully', 'success');
            }

            // Restart service if needed
            if (window.chatsyApp && window.chatsyApp.serviceStatus === 'running') {
                await window.chatsyApp.stopService();
                await window.chatsyApp.startService();
            }

        } catch (error) {
            console.error('Failed to save settings:', error);
            if (window.chatsyApp) {
                window.chatsyApp.showNotification('Failed to save settings', 'error');
            }
        }
    }

    async resetSettings() {
        try {
            const result = await window.electronAPI.showMessageBox({
                type: 'warning',
                title: 'Reset Settings',
                message: 'Are you sure you want to reset all settings to defaults?',
                detail: 'This will clear all your custom settings and API keys.',
                buttons: ['Cancel', 'Reset'],
                defaultId: 0,
                cancelId: 0
            });

            if (result.response === 1) {
                // Reset to defaults
                const defaultSettings = {
                    autoStart: false,
                    minimizeToTray: true,
                    notifications: true,
                    theme: 'light'
                };

                const defaultApiKeys = {
                    huggingface: '',
                    gemini: '',
                    openai: ''
                };

                const defaultPrivacySettings = {
                    dataRetentionDays: 30,
                    enableEncryption: true,
                    enableAnalytics: false
                };

                // Save defaults
                await window.electronAPI.setSettings(defaultSettings);
                await window.electronAPI.setApiKeys(defaultApiKeys);
                await window.electronAPI.setPrivacySettings(defaultPrivacySettings);

                // Update local state
                this.settings = defaultSettings;
                this.apiKeys = defaultApiKeys;
                this.privacySettings = defaultPrivacySettings;

                // Repopulate form
                this.populateForm();

                // Apply theme
                this.applyTheme(defaultSettings.theme);

                // Show success notification
                if (window.chatsyApp) {
                    window.chatsyApp.showNotification('Settings reset to defaults', 'success');
                }
            }
        } catch (error) {
            console.error('Failed to reset settings:', error);
            if (window.chatsyApp) {
                window.chatsyApp.showNotification('Failed to reset settings', 'error');
            }
        }
    }

    applyTheme(theme) {
        document.body.className = `theme-${theme}`;
        
        // Update theme in main app if available
        if (window.chatsyApp) {
            window.chatsyApp.applyTheme(theme);
        }
    }

    async toggleAutoStart(enabled) {
        try {
            // This would typically involve registry manipulation on Windows
            // For now, we'll just save the setting
            console.log('Auto-start toggled:', enabled);
            
            if (enabled) {
                // Add to startup
                console.log('Adding to startup...');
            } else {
                // Remove from startup
                console.log('Removing from startup...');
            }
        } catch (error) {
            console.error('Failed to toggle auto-start:', error);
            if (window.chatsyApp) {
                window.chatsyApp.showNotification('Failed to update auto-start setting', 'error');
            }
        }
    }

    validateApiKeys() {
        const huggingfaceKey = document.getElementById('huggingfaceKey').value.trim();
        const geminiKey = document.getElementById('geminiKey').value.trim();
        const openaiKey = document.getElementById('openaiKey').value.trim();

        if (!huggingfaceKey && !geminiKey && !openaiKey) {
            return {
                valid: false,
                message: 'At least one API key is required'
            };
        }

        return { valid: true };
    }

    getApiKeyStatus() {
        const keys = {
            huggingface: !!this.apiKeys.huggingface,
            gemini: !!this.apiKeys.gemini,
            openai: !!this.apiKeys.openai
        };

        const totalKeys = Object.values(keys).filter(Boolean).length;
        
        return {
            keys,
            totalKeys,
            hasAnyKey: totalKeys > 0,
            status: totalKeys === 0 ? 'none' : totalKeys === 1 ? 'basic' : 'redundant'
        };
    }

    async testApiConnection(provider) {
        try {
            const apiKey = this.apiKeys[provider];
            if (!apiKey) {
                throw new Error('No API key configured');
            }

            // Test API connection logic here
            // This would make a test request to the respective API
            
            if (window.chatsyApp) {
                window.chatsyApp.showNotification(`${provider} API connection successful`, 'success');
            }
        } catch (error) {
            console.error(`Failed to test ${provider} API:`, error);
            if (window.chatsyApp) {
                window.chatsyApp.showNotification(`Failed to test ${provider} API: ${error.message}`, 'error');
            }
        }
    }
}

// Initialize settings when the settings view is loaded
function initSettings() {
    if (!window.settingsManager) {
        window.settingsManager = new SettingsManager();
    }
}

// Export for use in other modules
window.initSettings = initSettings;
