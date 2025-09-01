const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const Store = require('electron-store');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'info';

// Initialize store
const store = new Store({
  encryptionKey: 'chatsy-desktop-encryption-key',
  defaults: {
    settings: {
      autoStart: false,
      minimizeToTray: true,
      notifications: true,
      theme: 'light',
      language: 'en'
    },
    apiKeys: {
      huggingface: '',
      gemini: '',
      openai: ''
    },
    privacy: {
      dataRetentionDays: 30,
      enableEncryption: true,
      enableAnalytics: false
    }
  }
});

let mainWindow;
let tray;
let isQuitting = false;

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (process.platform === 'win32') {
  try {
    if (require('electron-squirrel-startup')) {
      app.quit();
    }
  } catch (error) {
    // electron-squirrel-startup not available in development
    console.log('electron-squirrel-startup not available in development mode');
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    show: false,
    titleBarStyle: 'default',
    frame: true,
    resizable: true,
    maximizable: true,
    fullscreenable: true
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Check for updates
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window close event
  mainWindow.on('close', (event) => {
    if (!isQuitting && store.get('settings.minimizeToTray')) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Development tools
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
    require('electron-devtools-installer').default(require('electron-devtools-installer').REDUX_DEVTOOLS)
      .then((name) => log.info(`Added Extension: ${name}`))
      .catch((err) => log.error('An error occurred: ', err));
  }
}

function createTray() {
  const iconPath = path.join(__dirname, '../assets/icon.ico');
  const icon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Chatsy',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Settings',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('open-settings');
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Chatsy Desktop');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// IPC Handlers
ipcMain.handle('get-settings', () => {
  return store.get('settings');
});

ipcMain.handle('set-settings', (event, settings) => {
  store.set('settings', { ...store.get('settings'), ...settings });
  return true;
});

ipcMain.handle('get-api-keys', () => {
  return store.get('apiKeys');
});

ipcMain.handle('set-api-keys', (event, apiKeys) => {
  store.set('apiKeys', { ...store.get('apiKeys'), ...apiKeys });
  return true;
});

ipcMain.handle('get-privacy-settings', () => {
  return store.get('privacy');
});

ipcMain.handle('set-privacy-settings', (event, privacy) => {
  store.set('privacy', { ...store.get('privacy'), ...privacy });
  return true;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// Auto-updater events
autoUpdater.on('update-available', () => {
  log.info('Update available');
  if (mainWindow) {
    mainWindow.webContents.send('update-available');
  }
});

autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded');
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded');
  }
});

autoUpdater.on('error', (err) => {
  log.error('AutoUpdater error:', err);
});

// App events
app.whenReady().then(() => {
  createWindow();
  createTray();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle squirrel events for Windows installer
const handleSquirrelEvent = () => {
  if (process.platform !== 'win32') {
    return false;
  }

  const squirrelCommand = process.argv[1];
  switch (squirrelCommand) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and explorer context menus
      app.quit();
      return true;
    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and --squirrel-updated cases
      app.quit();
      return true;
    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
  return false;
};

if (handleSquirrelEvent()) {
  app.quit();
}
