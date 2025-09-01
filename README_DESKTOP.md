# Chatsy Desktop - AI Texting Assistant

A Windows desktop application that provides AI-powered texting assistance for WhatsApp, Instagram, and Telegram. This application runs in the background and provides intelligent suggestions for your conversations.

## 🚀 Features

### Core Capabilities
- **Multi-Platform Support**: WhatsApp Web, Instagram Direct Messages, Telegram Web
- **Background Monitoring**: Runs silently in the system tray
- **AI-Powered Suggestions**: Multi-API orchestration (HuggingFace, Gemini, OpenAI)
- **Privacy-First Design**: Local data storage with encryption
- **Real-Time Intelligence**: Context-aware conversation analysis
- **System Integration**: Native Windows application with auto-start capability

### Desktop Features
- **System Tray Integration**: Minimize to tray with quick access
- **Auto-Start**: Launch with Windows startup
- **Native Notifications**: Windows system notifications
- **Settings Management**: Easy configuration through GUI
- **Data Export/Import**: Backup and restore functionality
- **Analytics Dashboard**: Usage statistics and insights

## 🏗️ Architecture

### Technology Stack
- **Electron**: Cross-platform desktop framework
- **Node.js**: Backend runtime
- **HTML/CSS/JavaScript**: Frontend interface
- **Electron Store**: Secure local data storage
- **Electron Updater**: Automatic updates

### Project Structure
```
chatsy-desktop/
├── src/
│   ├── main.js (Electron main process)
│   ├── preload.js (Secure IPC bridge)
│   └── renderer/
│       ├── index.html (Main UI)
│       ├── styles/
│       │   └── main.css (Application styling)
│       └── js/
│           ├── app.js (Main application logic)
│           ├── dashboard.js (Dashboard functionality)
│           ├── conversations.js (Conversation management)
│           ├── analytics.js (Analytics and charts)
│           ├── settings.js (Settings management)
│           └── utils.js (Utility functions)
├── assets/
│   └── icon.ico (Application icon)
├── package.json (Dependencies and scripts)
└── README_DESKTOP.md (This file)
```

## 🔧 Installation & Setup

### Prerequisites
- Windows 10/11
- Node.js 16+ 
- npm or yarn

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/chatsy-desktop.git
   cd chatsy-desktop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development mode**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build:win
   ```

### Production Installation

1. **Download the installer**
   - Download the latest release from GitHub
   - Run the `.exe` installer

2. **Configure API Keys**
   - Open the application
   - Go to Settings → AI Configuration
   - Add your API keys for HuggingFace, Gemini, or OpenAI

3. **Start the service**
   - Click "Start Service" in the dashboard
   - The application will run in the background

## 🛡️ Privacy & Security

### Data Protection
- **Local-First Processing**: All data processing happens locally
- **Encrypted Storage**: AES-256 encryption for sensitive data
- **No Cloud Storage**: All data remains on your device
- **Anonymized API Calls**: Only necessary context sent to AI APIs
- **Automatic Cleanup**: Data expiration and secure deletion

### Privacy Features
- **Contact Isolation**: Each contact's data is encrypted separately
- **Pattern Anonymization**: Communication patterns stored without raw content
- **Consent Management**: Granular control over data processing levels
- **Audit Logging**: Transparent logging of all privacy operations

## 📊 Usage

### Basic Usage
1. **Launch Application**
   - Start Chatsy Desktop from the Start Menu or Desktop shortcut
   - The application will appear in the system tray

2. **Configure Settings**
   - Add your AI API keys in Settings
   - Configure privacy and notification preferences
   - Set auto-start if desired

3. **Start Service**
   - Click "Start Service" in the dashboard
   - The application will begin monitoring your messaging platforms

4. **Receive Suggestions**
   - AI-powered suggestions will appear when appropriate
   - Click to use suggestions or dismiss them
   - The application learns from your preferences

### Advanced Features

#### Dashboard
- **Service Status**: Monitor the background service
- **Quick Stats**: View conversation and suggestion statistics
- **Recent Activity**: See latest interactions and events
- **Quick Actions**: Start/stop service, export data, clear data

#### Conversations
- **View All Conversations**: Browse all monitored conversations
- **Platform Filtering**: Filter by WhatsApp, Instagram, or Telegram
- **Search**: Find specific conversations or messages
- **Export**: Export conversation data

#### Analytics
- **Message Volume**: Track message activity over time
- **Platform Usage**: See which platforms you use most
- **Response Time**: Monitor AI suggestion response times
- **Suggestion Accuracy**: Track how often suggestions are used

#### Settings
- **General Settings**: Auto-start, notifications, theme
- **AI Configuration**: API keys and provider settings
- **Privacy Settings**: Data retention and encryption options
- **Export/Import**: Backup and restore settings

## 🔍 Troubleshooting

### Common Issues

#### Service Won't Start
- Check that API keys are configured in Settings
- Ensure you have an active internet connection
- Check Windows Firewall settings

#### No Suggestions Appearing
- Verify that the service is running (green status in dashboard)
- Check that you're using supported platforms (WhatsApp Web, Instagram, Telegram)
- Ensure API keys are valid and have sufficient quota

#### Application Won't Launch
- Check Windows Event Viewer for error messages
- Try running as administrator
- Reinstall the application if necessary

#### High CPU/Memory Usage
- Restart the application
- Check for multiple instances running
- Reduce the number of monitored platforms

### Logs and Debugging
- Application logs are stored in: `%APPDATA%/chatsy-desktop/logs/`
- Enable debug mode by running: `npm run dev`
- Check the console for detailed error messages

## 🧪 Development

### Building from Source

1. **Clone and install**
   ```bash
   git clone https://github.com/your-username/chatsy-desktop.git
   cd chatsy-desktop
   npm install
   ```

2. **Development mode**
   ```bash
   npm run dev
   ```

3. **Build for distribution**
   ```bash
   npm run build:win
   ```

### Project Structure

#### Main Process (`src/main.js`)
- Application lifecycle management
- System tray integration
- IPC handlers for renderer communication
- Auto-updater configuration

#### Renderer Process (`src/renderer/`)
- User interface components
- Settings management
- Data visualization
- Real-time updates

#### Preload Script (`src/preload.js`)
- Secure API bridge between main and renderer
- Exposes safe methods for renderer access
- Prevents direct access to Node.js APIs

### Adding New Features

1. **Backend Logic**: Add to main process or create new modules
2. **UI Components**: Add to renderer process
3. **IPC Communication**: Define new handlers in preload script
4. **Settings**: Add to settings manager and UI
5. **Testing**: Test thoroughly before release

## 📈 Roadmap

### Planned Features
- **Voice Message Analysis**: AI-powered voice message transcription
- **Image Recognition**: Context-aware image analysis
- **Group Chat Support**: Enhanced group conversation features
- **Advanced Analytics**: Detailed conversation insights
- **Custom AI Models**: User-trainable AI models
- **Mobile Companion**: Mobile app for remote monitoring

### Performance Improvements
- **WebAssembly Integration**: Native performance for analysis
- **Background Workers**: Improved background processing
- **Caching System**: Intelligent data caching
- **Memory Optimization**: Reduced memory footprint

## 🤝 Contributing

### Development Guidelines
1. **Privacy-First**: All contributions must respect user privacy
2. **Performance**: Maintain low resource usage
3. **Security**: Follow security best practices
4. **Testing**: Test thoroughly on Windows
5. **Documentation**: Update documentation for new features

### Code Style
- Use ES6+ JavaScript features
- Follow Electron security guidelines
- Implement proper error handling
- Add comprehensive logging
- Write clear, documented code

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Reference](docs/API.md)
- [Configuration Guide](docs/CONFIGURATION.md)
- [Privacy Policy](docs/PRIVACY.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

### Community
- [GitHub Issues](https://github.com/your-username/chatsy-desktop/issues)
- [Discussions](https://github.com/your-username/chatsy-desktop/discussions)
- [Wiki](https://github.com/your-username/chatsy-desktop/wiki)

### Contact
- **Email**: support@chatsy.ai
- **Discord**: [Chatsy Community](https://discord.gg/chatsy)
- **Twitter**: [@ChatsyAI](https://twitter.com/ChatsyAI)

---

**Chatsy Desktop** - Making conversations smarter, one message at a time. 💬✨
