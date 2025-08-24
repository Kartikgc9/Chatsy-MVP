// Service Worker for Chatsy Extension
// Handles background tasks, API management, and extension lifecycle

importScripts('api-manager.js', 'privacy-manager.js');

// Extension installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Chatsy extension installed');
    // Initialize default settings
    chrome.storage.local.set({
      settings: {
        enabled: true,
        privacyLevel: 'high',
        aiProvider: 'huggingface',
        maxSuggestions: 3,
        responseDelay: 1000
      }
    });
  } else if (details.reason === 'update') {
    console.log('Chatsy extension updated');
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Chatsy extension started');
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'GET_AI_RESPONSE':
      handleAIRequest(request.data, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'UPDATE_SETTINGS':
      handleSettingsUpdate(request.data, sendResponse);
      break;
      
    case 'GET_STATS':
      handleStatsRequest(sendResponse);
      break;
      
    case 'CLEAR_DATA':
      handleDataClear(sendResponse);
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Handle AI API requests
async function handleAIRequest(data, sendResponse) {
  try {
    const { message, context, contactId, platform } = data;
    
    // Privacy check - ensure no PII is sent
    const sanitizedData = await privacyManager.sanitizeData(data);
    
    // Get AI response
    const response = await apiManager.generateResponse(sanitizedData);
    
    // Store conversation data locally
    await storeConversationData(contactId, platform, message, response);
    
    sendResponse({ success: true, response });
  } catch (error) {
    console.error('AI request error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle settings updates
function handleSettingsUpdate(settings, sendResponse) {
  chrome.storage.local.set({ settings }, () => {
    sendResponse({ success: true });
  });
}

// Handle statistics requests
function handleStatsRequest(sendResponse) {
  chrome.storage.local.get(['conversationStats', 'contactData'], (result) => {
    sendResponse({ success: true, data: result });
  });
}

// Handle data clearing
function handleDataClear(sendResponse) {
  chrome.storage.local.clear(() => {
    sendResponse({ success: true });
  });
}

// Store conversation data locally
async function storeConversationData(contactId, platform, message, response) {
  const timestamp = Date.now();
  const conversationData = {
    contactId,
    platform,
    message,
    response,
    timestamp,
    success: true
  };
  
  chrome.storage.local.get(['conversationData'], (result) => {
    const conversations = result.conversationData || [];
    conversations.push(conversationData);
    
    // Keep only last 1000 conversations for memory management
    if (conversations.length > 1000) {
      conversations.splice(0, conversations.length - 1000);
    }
    
    chrome.storage.local.set({ conversationData: conversations });
  });
}

// Handle tab updates for content script injection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    
    // Check if this is a supported messaging platform
    if (isSupportedPlatform(url.hostname)) {
      // Inject content script if not already injected
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/content-script.js']
      }).catch(() => {
        // Script already injected or injection failed
      });
    }
  }
});

// Check if URL is a supported messaging platform
function isSupportedPlatform(hostname) {
  const supportedPlatforms = [
    'web.whatsapp.com',
    'www.instagram.com',
    'web.telegram.org'
  ];
  
  return supportedPlatforms.some(platform => hostname.includes(platform));
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (isSupportedPlatform(new URL(tab.url).hostname)) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SUGGESTIONS' });
  }
});

// Periodic cleanup and maintenance
setInterval(() => {
  cleanupOldData();
}, 24 * 60 * 60 * 1000); // Run daily

// Clean up old conversation data
function cleanupOldData() {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  chrome.storage.local.get(['conversationData'], (result) => {
    if (result.conversationData) {
      const filteredData = result.conversationData.filter(
        conv => conv.timestamp > thirtyDaysAgo
      );
      
      chrome.storage.local.set({ conversationData: filteredData });
    }
  });
}
