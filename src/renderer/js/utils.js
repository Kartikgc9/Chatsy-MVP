// Utilities Module
class Utils {
    static formatDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toLocaleDateString();
    }

    static formatTime(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toLocaleTimeString();
    }

    static formatDateTime(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toLocaleString();
    }

    static formatRelativeTime(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
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
        } else if (diff < 604800000) { // Less than 1 week
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substr(0, maxLength) + '...';
    }

    static capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve();
        }
    }

    static downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static showModal(title, content, buttons = []) {
        return new Promise((resolve) => {
            const modal = document.getElementById('modalOverlay');
            const modalTitle = document.getElementById('modalTitle');
            const modalContent = document.getElementById('modalContent');
            const modalClose = document.getElementById('modalClose');

            modalTitle.textContent = title;
            modalContent.innerHTML = content;

            // Add buttons if provided
            if (buttons.length > 0) {
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'modal-buttons';
                buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;';

                buttons.forEach((button, index) => {
                    const btn = document.createElement('button');
                    btn.textContent = button.text;
                    btn.className = `btn ${button.primary ? 'btn-primary' : 'btn-secondary'}`;
                    btn.onclick = () => {
                        modal.classList.add('hidden');
                        resolve(index);
                    };
                    buttonContainer.appendChild(btn);
                });

                modalContent.appendChild(buttonContainer);
            }

            modal.classList.remove('hidden');

            const closeModal = () => {
                modal.classList.add('hidden');
                resolve(-1);
            };

            modalClose.onclick = closeModal;
            modal.onclick = (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            };
        });
    }

    static async confirm(message, title = 'Confirm') {
        const result = await Utils.showModal(title, `
            <p>${message}</p>
        `, [
            { text: 'Cancel', primary: false },
            { text: 'Confirm', primary: true }
        ]);
        return result === 1;
    }

    static async alert(message, title = 'Alert') {
        await Utils.showModal(title, `
            <p>${message}</p>
        `, [
            { text: 'OK', primary: true }
        ]);
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static retry(fn, maxAttempts = 3, delay = 1000) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            
            const attempt = async () => {
                try {
                    attempts++;
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    if (attempts >= maxAttempts) {
                        reject(error);
                    } else {
                        setTimeout(attempt, delay);
                    }
                }
            };
            
            attempt();
        });
    }

    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => Utils.deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = Utils.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    }

    static mergeObjects(target, ...sources) {
        sources.forEach(source => {
            for (const key in source) {
                if (source.hasOwnProperty(key)) {
                    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                        target[key] = target[key] || {};
                        Utils.mergeObjects(target[key], source[key]);
                    } else {
                        target[key] = source[key];
                    }
                }
            }
        });
        return target;
    }

    static getPlatformIcon(platform) {
        const icons = {
            whatsapp: 'fab fa-whatsapp',
            instagram: 'fab fa-instagram',
            telegram: 'fab fa-telegram',
            facebook: 'fab fa-facebook',
            twitter: 'fab fa-twitter',
            linkedin: 'fab fa-linkedin',
            email: 'fas fa-envelope',
            sms: 'fas fa-sms'
        };
        return icons[platform.toLowerCase()] || 'fas fa-comment';
    }

    static getPlatformColor(platform) {
        const colors = {
            whatsapp: '#25D366',
            instagram: '#E4405F',
            telegram: '#0088cc',
            facebook: '#1877F2',
            twitter: '#1DA1F2',
            linkedin: '#0A66C2',
            email: '#EA4335',
            sms: '#34A853'
        };
        return colors[platform.toLowerCase()] || '#666';
    }
}

// Export utilities globally
window.Utils = Utils;
