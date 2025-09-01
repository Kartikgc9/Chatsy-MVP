// Dashboard Module
class DashboardManager {
    constructor() {
        this.stats = {
            conversations: 0,
            messages: 0,
            suggestions: 0
        };
        this.activities = [];
    }

    init() {
        console.log('Dashboard initialized');
        this.loadStats();
        this.loadRecentActivity();
    }

    async loadStats() {
        // Load statistics from storage
        // This would typically come from the background service
        console.log('Loading dashboard stats...');
    }

    async loadRecentActivity() {
        // Load recent activity from storage
        console.log('Loading recent activity...');
    }

    updateStats(newStats) {
        this.stats = { ...this.stats, ...newStats };
        this.renderStats();
    }

    addActivity(activity) {
        this.activities.unshift(activity);
        if (this.activities.length > 10) {
            this.activities.pop();
        }
        this.renderActivities();
    }

    renderStats() {
        // Update stats display
        const elements = {
            conversations: document.getElementById('totalConversations'),
            messages: document.getElementById('totalMessages'),
            suggestions: document.getElementById('suggestionsGiven')
        };

        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                elements[key].textContent = this.stats[key] || 0;
            }
        });
    }

    renderActivities() {
        const activityList = document.getElementById('recentActivity');
        if (!activityList) return;

        if (this.activities.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <i class="fas fa-info-circle"></i>
                    <span>No recent activity</span>
                </div>
            `;
            return;
        }

        activityList.innerHTML = this.activities.map(activity => `
            <div class="activity-item">
                <i class="${activity.icon}"></i>
                <span>${activity.text}</span>
                <small style="margin-left: auto; color: #999;">${activity.time}</small>
            </div>
        `).join('');
    }
}

// Initialize dashboard when needed
function initDashboard() {
    if (!window.dashboardManager) {
        window.dashboardManager = new DashboardManager();
    }
    window.dashboardManager.init();
}

// Export for use in other modules
window.initDashboard = initDashboard;
