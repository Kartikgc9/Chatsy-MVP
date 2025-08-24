#!/usr/bin/env node

/**
 * Chatsy Extension Configuration Setup Script
 * 
 * This script helps you set up your configuration file with API keys and other settings.
 * Run this script to create your config.env file from the template.
 * 
 * Usage:
 *   node setup-config.js
 *   node setup-config.js --interactive
 *   node setup-config.js --help
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class ConfigSetup {
  constructor() {
    this.templateFile = 'config.env.example';
    this.outputFile = 'config.env';
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async run() {
    try {
      console.log('🚀 Chatsy Extension Configuration Setup\n');
      
      // Check command line arguments
      const args = process.argv.slice(2);
      if (args.includes('--help') || args.includes('-h')) {
        this.showHelp();
        return;
      }

      const isInteractive = args.includes('--interactive') || args.includes('-i');
      
      if (isInteractive) {
        await this.interactiveSetup();
      } else {
        await this.quickSetup();
      }
      
      console.log('\n✅ Configuration setup completed successfully!');
      console.log('📝 Review your config.env file and make any necessary adjustments.');
      console.log('🔒 Remember: Never commit config.env files to version control!');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async quickSetup() {
    console.log('📋 Creating configuration file from template...');
    
    if (!fs.existsSync(this.templateFile)) {
      throw new Error(`Template file ${this.templateFile} not found`);
    }

    // Copy template to config.env
    const template = fs.readFileSync(this.templateFile, 'utf8');
    fs.writeFileSync(this.outputFile, template);
    
    console.log(`✅ Created ${this.outputFile} from template`);
    console.log('📝 Please edit the file and add your API keys');
  }

  async interactiveSetup() {
    console.log('🔧 Interactive configuration setup\n');
    
    // Check if template exists
    if (!fs.existsSync(this.templateFile)) {
      throw new Error(`Template file ${this.templateFile} not found`);
    }

    // Read template
    let config = fs.readFileSync(this.templateFile, 'utf8');
    
    // Get API keys
    const hfApiKey = await this.question('Enter your HuggingFace API key (or press Enter to skip): ');
    const geminiApiKey = await this.question('Enter your Google Gemini API key (or press Enter to skip): ');
    
    // Update configuration
    if (hfApiKey) {
      config = config.replace('your_huggingface_api_key_here', hfApiKey);
    }
    
    if (geminiApiKey) {
      config = config.replace('your_gemini_api_key_here', geminiApiKey);
    }
    
    // Get other settings
    const maxSuggestions = await this.question('Max suggestions (2-5, default: 3): ', '3');
    const responseDelay = await this.question('Response delay in milliseconds (default: 1000): ', '1000');
    const privacyLevel = await this.question('Privacy level (low/medium/high, default: high): ', 'high');
    
    // Update other settings
    config = config.replace('MAX_SUGGESTIONS=3', `MAX_SUGGESTIONS=${maxSuggestions}`);
    config = config.replace('RESPONSE_DELAY_MS=1000', `RESPONSE_DELAY_MS=${responseDelay}`);
    config = config.replace('PRIVACY_LEVEL=high', `PRIVACY_LEVEL=${privacyLevel}`);
    
    // Write configuration file
    fs.writeFileSync(this.outputFile, config);
    
    console.log(`\n✅ Configuration saved to ${this.outputFile}`);
    
    // Show summary
    console.log('\n📊 Configuration Summary:');
    console.log(`   AI Provider: ${hfApiKey ? 'HuggingFace' : 'None'} ${geminiApiKey ? '+ Gemini' : ''}`);
    console.log(`   Max Suggestions: ${maxSuggestions}`);
    console.log(`   Response Delay: ${responseDelay}ms`);
    console.log(`   Privacy Level: ${privacyLevel}`);
  }

  async question(prompt, defaultValue = '') {
    return new Promise((resolve) => {
      const fullPrompt = defaultValue ? `${prompt} [${defaultValue}]: ` : `${prompt} `;
      this.rl.question(fullPrompt, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  showHelp() {
    console.log(`
Chatsy Extension Configuration Setup

Usage:
  node setup-config.js           # Quick setup (copy template)
  node setup-config.js -i        # Interactive setup
  node setup-config.js --help    # Show this help

Options:
  -i, --interactive    Run interactive setup to configure API keys
  -h, --help          Show this help message

Examples:
  # Quick setup - copy template and edit manually
  node setup-config.js
  
  # Interactive setup - guided configuration
  node setup-config.js --interactive

What this script does:
  1. Creates a config.env file from config.env.example
  2. Optionally prompts for API keys and settings
  3. Ensures proper configuration for the extension

Next steps after setup:
  1. Review the generated config.env file
  2. Add your actual API keys
  3. Customize other settings as needed
  4. Load the extension in Chrome
  5. Test on supported platforms

Security notes:
  - Never commit config.env files to version control
  - Keep your API keys secure
  - Rotate API keys regularly
  - Use different keys for development and production

For more information, see the README.md file.
    `);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new ConfigSetup();
  setup.run().catch(console.error);
}

module.exports = ConfigSetup;
