const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (settings) => ipcRenderer.invoke('set-settings', settings),
  
  // API Keys
  getApiKeys: () => ipcRenderer.invoke('get-api-keys'),
  setApiKeys: (apiKeys) => ipcRenderer.invoke('set-api-keys', apiKeys),
  
  // Privacy Settings
  getPrivacySettings: () => ipcRenderer.invoke('get-privacy-settings'),
  setPrivacySettings: (privacy) => ipcRenderer.invoke('set-privacy-settings', privacy),
  
  // File Dialogs
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // Events
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Expose process information
contextBridge.exposeInMainWorld('processInfo', {
  platform: process.platform,
  arch: process.arch,
  version: process.version,
  isDev: !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
});
