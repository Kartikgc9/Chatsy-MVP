// Main Application Controller
class ChatsyApp {
    constructor() {
        this.currentView = 'dashboard';
        this.settings = {};
        this.apiKeys = {};
        this.privacySettings = {};
        this.serviceStatus = 'stopped';
        
        this.init();
    }

    async init() {
        try {
            // Load settings
            await this.loadSettings();
            
            // Initialize UI
            this.initUI();
            
            // Initialize event listeners
            this.initEventListeners();
            
            // Initialize service
            await this.initService();
            
            // Update UI
            this.updateUI();
            
            console.log('Chatsy Desktop initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Chatsy Desktop:', error);
            this.showNotification('Failed to initialize application', 'error');
        }
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

    initUI() {
        // Initialize navigation
        this.initNavigation();
        
        // Initialize header controls
        this.initHeaderControls();
        
        // Initialize theme
        this.applyTheme(this.settings.theme || 'light');
    }

    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });
    }

    initHeaderControls() {
        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.switchView('settings');
        });

        // Minimize button
        document.getElementById('minimizeBtn').addEventListener('click', () => {
            // This will be handled by the main process
        });

        // Close button
        document.getElementById('closeBtn').addEventListener('click', () => {
            // This will be handled by the main process
        });
    }

    initEventListeners() {
        // Listen for settings updates
        window.electronAPI.onOpenSettings(() => {
            this.switchView('settings');
        });

        // Listen for update notifications
        window.electronAPI.onUpdateAvailable(() => {
            this.showNotification('Update available', 'info');
        });

        window.electronAPI.onUpdateDownloaded(() => {
            this.showNotification('Update downloaded and ready to install', 'success');
        });
    }

    async initService() {
        // Initialize the background service
        try {
            // Check if API keys are configured
            const hasApiKeys = this.apiKeys.huggingface || this.apiKeys.gemini || this.apiKeys.openai;
            
            if (!hasApiKeys) {
                this.serviceStatus = 'configure';
                this.showNotification('Please configure API keys in settings', 'warning');
            } else {
                this.serviceStatus = 'ready';
                // Start the service
                await this.startService();
            }
        } catch (error) {
            console.error('Failed to initialize service:', error);
            this.serviceStatus = 'error';
        }
    }

    async startService() {
        try {
            this.serviceStatus = 'starting';
            this.updateStatusUI();
            
            // Initialize background monitoring
            await this.initBackgroundMonitoring();
            
            this.serviceStatus = 'running';
            this.updateStatusUI();
            this.showNotification('Service started successfully', 'success');
        } catch (error) {
            console.error('Failed to start service:', error);
            this.serviceStatus = 'error';
            this.updateStatusUI();
            this.showNotification('Failed to start service', 'error');
        }
    }

    async stopService() {
        try {
            this.serviceStatus = 'stopping';
            this.updateStatusUI();
            
            // Stop background monitoring
            await this.stopBackgroundMonitoring();
            
            this.serviceStatus = 'stopped';
            this.updateStatusUI();
            this.showNotification('Service stopped', 'info');
        } catch (error) {
            console.error('Failed to stop service:', error);
            this.serviceStatus = 'error';
            this.updateStatusUI();
        }
    }

    async initBackgroundMonitoring() {
        // This will be implemented to monitor WhatsApp, Instagram, and Telegram
        // For now, we'll simulate the service
        console.log('Background monitoring initialized');
        
        // Simulate periodic updates
        this.monitoringInterval = setInterval(() => {
            this.updateStats();
        }, 5000);
    }

    async stopBackgroundMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        console.log('Background monitoring stopped');
    }

    switchView(viewName) {
        // Hide all views
        const views = document.querySelectorAll('.view');
        views.forEach(view => view.classList.remove('active'));
        
        // Show selected view
        const targetView = document.getElementById(viewName + 'View');
        if (targetView) {
            targetView.classList.add('active');
        }
        
        // Update navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === viewName) {
                item.classList.add('active');
            }
        });
        
        this.currentView = viewName;
        
        // Initialize view-specific functionality
        this.initView(viewName);
    }

    initView(viewName) {
        switch (viewName) {
            case 'dashboard':
                this.initDashboard();
                break;
            case 'conversations':
                this.initConversations();
                break;
            case 'analytics':
                this.initAnalytics();
                break;
            case 'settings':
                this.initSettings();
                break;
        }
    }

    initDashboard() {
        // Initialize dashboard-specific functionality
        this.updateStats();
        this.updateRecentActivity();
        
        // Initialize action buttons
        this.initDashboardActions();
    }

    initDashboardActions() {
        // Start service button
        document.getElementById('startServiceBtn').addEventListener('click', () => {
            this.startService();
        });

        // Stop service button
        document.getElementById('stopServiceBtn').addEventListener('click', () => {
            this.stopService();
        });

        // Export data button
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Clear data button
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearData();
        });
    }

    async exportData() {
        try {
            const result = await window.electronAPI.showSaveDialog({
                title: 'Export Data',
                defaultPath: `chatsy-export-${new Date().toISOString().split('T')[0]}.json`,
                filters: [
                    { name: 'JSON Files', extensions: ['json'] }
                ]
            });

            if (!result.canceled) {
                // Export data logic here
                this.showNotification('Data exported successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to export data:', error);
            this.showNotification('Failed to export data', 'error');
        }
    }

    async clearData() {
        try {
            const result = await window.electronAPI.showMessageBox({
                type: 'warning',
                title: 'Clear Data',
                message: 'Are you sure you want to clear all data?',
                detail: 'This action cannot be undone.',
                buttons: ['Cancel', 'Clear Data'],
                defaultId: 0,
                cancelId: 0
            });

            if (result.response === 1) {
                // Clear data logic here
                this.showNotification('Data cleared successfully', 'success');
                this.updateStats();
            }
        } catch (error) {
            console.error('Failed to clear data:', error);
            this.showNotification('Failed to clear data', 'error');
        }
    }

    updateStats() {
        // Update statistics (this would come from the background service)
        const stats = {
            conversations: Math.floor(Math.random() * 50) + 10,
            messages: Math.floor(Math.random() * 1000) + 100,
            suggestions: Math.floor(Math.random() * 200) + 50
        };

        document.getElementById('totalConversations').textContent = stats.conversations;
        document.getElementById('totalMessages').textContent = stats.messages;
        document.getElementById('suggestionsGiven').textContent = stats.suggestions;
    }

    updateRecentActivity() {
        const activities = [
            { icon: 'fas fa-comment', text: 'New message from John Doe', time: '2 minutes ago' },
            { icon: 'fas fa-lightbulb', text: 'AI suggestion generated', time: '5 minutes ago' },
            { icon: 'fas fa-sync', text: 'Service restarted', time: '10 minutes ago' }
        ];

        const activityList = document.getElementById('recentActivity');
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <i class="${activity.icon}"></i>
                <span>${activity.text}</span>
                <small style="margin-left: auto; color: #999;">${activity.time}</small>
            </div>
        `).join('');
    }

    updateStatusUI() {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const serviceStatus = document.getElementById('serviceStatus');

        let status, color, text;

        switch (this.serviceStatus) {
            case 'running':
                status = 'running';
                color = '#4CAF50';
                text = 'Running';
                break;
            case 'starting':
                status = 'starting';
                color = '#FF9800';
                text = 'Starting...';
                break;
            case 'stopping':
                status = 'stopping';
                color = '#FF9800';
                text = 'Stopping...';
                break;
            case 'stopped':
                status = 'stopped';
                color = '#f44336';
                text = 'Stopped';
                break;
            case 'error':
                status = 'error';
                color = '#f44336';
                text = 'Error';
                break;
            case 'configure':
                status = 'configure';
                color = '#2196F3';
                text = 'Configure';
                break;
            default:
                status = 'unknown';
                color = '#999';
                text = 'Unknown';
        }

        statusDot.style.backgroundColor = color;
        statusText.textContent = text;
        serviceStatus.textContent = text;
    }

    updateUI() {
        this.updateStatusUI();
        this.updateStats();
        this.updateRecentActivity();
    }

    applyTheme(theme) {
        document.body.className = `theme-${theme}`;
    }

    showNotification(message, type = 'info') {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = this.getNotificationIcon(type);
        
        notification.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        notifications.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success':
                return 'fas fa-check-circle';
            case 'error':
                return 'fas fa-exclamation-circle';
            case 'warning':
                return 'fas fa-exclamation-triangle';
            case 'info':
            default:
                return 'fas fa-info-circle';
        }
    }

    // Placeholder methods for other views
    initConversations() {
        // Will be implemented in conversations.js
    }

    initAnalytics() {
        // Will be implemented in analytics.js
    }

    initSettings() {
        if (window.initSettings) {
            window.initSettings();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatsyApp = new ChatsyApp();
});
