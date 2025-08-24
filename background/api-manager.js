// API Manager for Chatsy Extension
// Handles AI API calls to HuggingFace and Google Gemini with intelligent fallbacks

class APIManager {
  constructor() {
    this.hfApiUrl = 'https://api-inference.huggingface.co/models';
    this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    this.rateLimitQueue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.maxRequestsPerMinute = 60;
    
    // Initialize API keys from storage
    this.initializeAPIKeys();
  }
  
  async initializeAPIKeys() {
    const result = await chrome.storage.local.get(['apiKeys']);
    this.apiKeys = result.apiKeys || {};
  }
  
  // Main method to generate AI response
  async generateResponse(data) {
    try {
      // Try HuggingFace first (free tier)
      const hfResponse = await this.tryHuggingFace(data);
      if (hfResponse) {
        return hfResponse;
      }
      
      // Fallback to Google Gemini
      const geminiResponse = await this.tryGoogleGemini(data);
      if (geminiResponse) {
        return geminiResponse;
      }
      
      // Final fallback to local pattern matching
      return this.generateLocalResponse(data);
      
    } catch (error) {
      console.error('API generation error:', error);
      return this.generateLocalResponse(data);
    }
  }
  
  // Try HuggingFace API first
  async tryHuggingFace(data) {
    if (!this.apiKeys.huggingface) {
      return null;
    }
    
    try {
      const prompt = this.buildHFPrompt(data);
      
      const response = await fetch(`${this.hfApiUrl}/microsoft/DialoGPT-medium`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKeys.huggingface}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 100,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return this.processHFResponse(result, data);
      }
      
      return null;
    } catch (error) {
      console.error('HuggingFace API error:', error);
      return null;
    }
  }
  
  // Try Google Gemini API as fallback
  async tryGoogleGemini(data) {
    if (!this.apiKeys.gemini) {
      return null;
    }
    
    try {
      const prompt = this.buildGeminiPrompt(data);
      
      const response = await fetch(`${this.geminiApiUrl}?key=${this.apiKeys.gemini}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 100
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return this.processGeminiResponse(result, data);
      }
      
      return null;
    } catch (error) {
      console.error('Google Gemini API error:', error);
      return null;
    }
  }
  
  // Build prompt for HuggingFace
  buildHFPrompt(data) {
    const { message, context, contactStyle } = data;
    
    let prompt = `Context: ${context || 'General conversation'}\n`;
    
    if (contactStyle) {
      prompt += `Contact style: ${contactStyle.formalityLevel > 0.7 ? 'Formal' : 'Casual'}, `;
      prompt += `Emoji usage: ${contactStyle.emojiUsage > 0.5 ? 'High' : 'Low'}\n`;
    }
    
    prompt += `Message: ${message}\nResponse:`;
    
    return prompt;
  }
  
  // Build prompt for Google Gemini
  buildGeminiPrompt(data) {
    const { message, context, contactStyle } = data;
    
    let prompt = `You are a helpful AI texting assistant. Generate a natural, contextual response to this message:\n\n`;
    
    if (context) {
      prompt += `Conversation context: ${context}\n\n`;
    }
    
    if (contactStyle) {
      prompt += `Match this style: `;
      prompt += `Formality level: ${contactStyle.formalityLevel > 0.7 ? 'formal' : 'casual'}, `;
      prompt += `Emoji usage: ${contactStyle.emojiUsage > 0.5 ? 'include emojis' : 'minimal emojis'}\n\n`;
    }
    
    prompt += `Message: "${message}"\n\nResponse:`;
    
    return prompt;
  }
  
  // Process HuggingFace response
  processHFResponse(result, data) {
    if (result && result[0] && result[0].generated_text) {
      let response = result[0].generated_text;
      
      // Clean up the response
      response = response.replace(/^Response:\s*/i, '');
      response = response.trim();
      
      // Ensure response is not too long
      if (response.length > 100) {
        response = response.substring(0, 100) + '...';
      }
      
      return response;
    }
    
    return null;
  }
  
  // Process Google Gemini response
  processGeminiResponse(result, data) {
    if (result && result.candidates && result.candidates[0] && result.candidates[0].content) {
      let response = result.candidates[0].content.parts[0].text;
      
      // Clean up the response
      response = response.trim();
      
      // Ensure response is not too long
      if (response.length > 100) {
        response = response.substring(0, 100) + '...';
      }
      
      return response;
    }
    
    return null;
  }
  
  // Generate local response using pattern matching
  generateLocalResponse(data) {
    const { message, context, contactStyle } = data;
    const lowerMessage = message.toLowerCase();
    
    // Simple pattern matching for common scenarios
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return this.getRandomResponse([
        'Hey there! 👋',
        'Hi! How are you?',
        'Hello! Nice to hear from you'
      ]);
    }
    
    if (lowerMessage.includes('how are you')) {
      return this.getRandomResponse([
        'I\'m doing great, thanks for asking! 😊',
        'All good here! How about you?',
        'Pretty good! Hope you\'re well too'
      ]);
    }
    
    if (lowerMessage.includes('thank')) {
      return this.getRandomResponse([
        'You\'re welcome! 😊',
        'Anytime!',
        'Glad I could help!'
      ]);
    }
    
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return this.getRandomResponse([
        'See you later! 👋',
        'Take care!',
        'Talk to you soon!'
      ]);
    }
    
    // Generic responses based on message length
    if (message.length < 20) {
      return this.getRandomResponse([
        'Got it! 👍',
        'I see!',
        'Interesting!',
        'Tell me more!'
      ]);
    }
    
    // Default response
    return this.getRandomResponse([
      'That sounds good!',
      'I understand what you mean',
      'Thanks for sharing that',
      'I appreciate you telling me'
    ]);
  }
  
  // Get random response from array
  getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Rate limiting for API calls
  async checkRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - (60 * 1000);
    
    // Remove old requests from count
    this.requestCount = this.requestCount.filter(time => time > oneMinuteAgo).length;
    
    if (this.requestCount >= this.maxRequestsPerMinute) {
      const oldestRequest = Math.min(...this.requestCount);
      const waitTime = (60 * 1000) - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requestCount.push(now);
  }
  
  // Update API keys
  async updateAPIKeys(keys) {
    this.apiKeys = { ...this.apiKeys, ...keys };
    await chrome.storage.local.set({ apiKeys: this.apiKeys });
  }
  
  // Get API status
  getAPIStatus() {
    return {
      huggingface: !!this.apiKeys.huggingface,
      gemini: !!this.apiKeys.gemini,
      requestCount: this.requestCount.length
    };
  }
}

// Export for use in service worker
self.apiManager = new APIManager();
