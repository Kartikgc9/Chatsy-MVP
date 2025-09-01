// Conversations Module
class ConversationsManager {
    constructor() {
        this.conversations = [];
        this.currentFilter = 'all';
    }

    init() {
        console.log('Conversations initialized');
        this.loadConversations();
        this.initEventListeners();
    }

    initEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshConversationsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadConversations();
            });
        }
    }

    async loadConversations() {
        try {
            // Load conversations from storage
            // This would typically come from the background service
            console.log('Loading conversations...');
            
            // Simulate loading conversations
            this.conversations = [
                {
                    id: '1',
                    name: 'John Doe',
                    platform: 'whatsapp',
                    lastMessage: 'Hey, how are you?',
                    timestamp: new Date().toISOString(),
                    unreadCount: 2
                },
                {
                    id: '2',
                    name: 'Jane Smith',
                    platform: 'instagram',
                    lastMessage: 'Thanks for the help!',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    unreadCount: 0
                }
            ];

            this.renderConversations();
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }

    renderConversations() {
        const conversationsList = document.getElementById('conversationsList');
        if (!conversationsList) return;

        if (this.conversations.length === 0) {
            conversationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h3>No conversations yet</h3>
                    <p>Start chatting on WhatsApp, Instagram, or Telegram to see conversations here.</p>
                </div>
            `;
            return;
        }

        conversationsList.innerHTML = this.conversations.map(conversation => `
            <div class="conversation-item" data-id="${conversation.id}">
                <div class="conversation-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="conversation-content">
                    <div class="conversation-header">
                        <h4>${conversation.name}</h4>
                        <span class="platform-badge ${conversation.platform}">${conversation.platform}</span>
                        <span class="timestamp">${this.formatTimestamp(conversation.timestamp)}</span>
                    </div>
                    <div class="conversation-preview">
                        <p>${conversation.lastMessage}</p>
                        ${conversation.unreadCount > 0 ? `<span class="unread-badge">${conversation.unreadCount}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        const conversationItems = conversationsList.querySelectorAll('.conversation-item');
        conversationItems.forEach(item => {
            item.addEventListener('click', () => {
                this.openConversation(item.dataset.id);
            });
        });
    }

    openConversation(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (conversation) {
            console.log('Opening conversation:', conversation);
            // This would open a detailed view of the conversation
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    filterConversations(filter) {
        this.currentFilter = filter;
        // Implement filtering logic here
        this.renderConversations();
    }

    searchConversations(query) {
        // Implement search logic here
        console.log('Searching conversations:', query);
    }
}

// Initialize conversations when needed
function initConversations() {
    if (!window.conversationsManager) {
        window.conversationsManager = new ConversationsManager();
    }
    window.conversationsManager.init();
}

// Export for use in other modules
window.initConversations = initConversations;
