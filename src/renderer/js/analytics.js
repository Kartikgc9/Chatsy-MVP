// Analytics Module
class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.currentPeriod = 30;
    }

    init() {
        console.log('Analytics initialized');
        this.initEventListeners();
        this.loadAnalytics();
    }

    initEventListeners() {
        // Period selector
        const periodSelector = document.getElementById('analyticsPeriod');
        if (periodSelector) {
            periodSelector.addEventListener('change', (e) => {
                this.currentPeriod = parseInt(e.target.value);
                this.loadAnalytics();
            });
        }
    }

    async loadAnalytics() {
        try {
            console.log('Loading analytics for period:', this.currentPeriod);
            
            // Load analytics data
            const data = await this.getAnalyticsData();
            
            // Render charts
            this.renderCharts(data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    }

    async getAnalyticsData() {
        // This would fetch data from storage/background service
        // For now, return mock data
        return {
            messageVolume: this.generateMockMessageVolume(),
            platformUsage: this.generateMockPlatformUsage(),
            responseTime: this.generateMockResponseTime(),
            suggestionAccuracy: this.generateMockSuggestionAccuracy()
        };
    }

    generateMockMessageVolume() {
        const days = this.currentPeriod;
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            data.push({
                date: date.toISOString().split('T')[0],
                messages: Math.floor(Math.random() * 50) + 10,
                suggestions: Math.floor(Math.random() * 20) + 5
            });
        }
        
        return data;
    }

    generateMockPlatformUsage() {
        return [
            { platform: 'WhatsApp', messages: 65, percentage: 65 },
            { platform: 'Instagram', messages: 20, percentage: 20 },
            { platform: 'Telegram', messages: 15, percentage: 15 }
        ];
    }

    generateMockResponseTime() {
        return {
            average: 1.2,
            min: 0.5,
            max: 3.0,
            trend: 'improving'
        };
    }

    generateMockSuggestionAccuracy() {
        return {
            accepted: 78,
            rejected: 22,
            total: 100
        };
    }

    renderCharts(data) {
        this.renderMessageVolumeChart(data.messageVolume);
        this.renderPlatformUsageChart(data.platformUsage);
    }

    renderMessageVolumeChart(data) {
        const canvas = document.getElementById('messageVolumeChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Clear previous chart
        if (this.charts.messageVolume) {
            this.charts.messageVolume.destroy();
        }

        // Create new chart (this would use Chart.js or similar)
        console.log('Rendering message volume chart:', data);
        
        // For now, just draw a simple placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Message Volume Chart', canvas.width / 2, canvas.height / 2);
        ctx.fillText(`Last ${this.currentPeriod} days`, canvas.width / 2, canvas.height / 2 + 20);
    }

    renderPlatformUsageChart(data) {
        const canvas = document.getElementById('platformUsageChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Clear previous chart
        if (this.charts.platformUsage) {
            this.charts.platformUsage.destroy();
        }

        // Create new chart (this would use Chart.js or similar)
        console.log('Rendering platform usage chart:', data);
        
        // For now, just draw a simple placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Platform Usage Chart', canvas.width / 2, canvas.height / 2);
        ctx.fillText('WhatsApp: 65%, Instagram: 20%, Telegram: 15%', canvas.width / 2, canvas.height / 2 + 20);
    }

    exportAnalytics() {
        // Export analytics data
        console.log('Exporting analytics...');
    }

    getInsights() {
        // Generate insights from analytics data
        return [
            'Most active time: 2-4 PM',
            'WhatsApp is your most used platform',
            'Response time has improved by 15% this week',
            'Suggestion acceptance rate: 78%'
        ];
    }
}

// Initialize analytics when needed
function initAnalytics() {
    if (!window.analyticsManager) {
        window.analyticsManager = new AnalyticsManager();
    }
    window.analyticsManager.init();
}

// Export for use in other modules
window.initAnalytics = initAnalytics;
