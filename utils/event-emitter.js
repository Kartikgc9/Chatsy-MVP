// Event Emitter Utility for Chatsy Extension
// Provides event-driven communication between components

class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  // Add event listener
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }
  
  // Remove event listener
  off(event, callback) {
    if (!this.events[event]) return;
    
    const index = this.events[event].indexOf(callback);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }
    
    // Clean up empty event arrays
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }
  
  // Emit event
  emit(event, ...args) {
    if (!this.events[event]) return;
    
    // Create a copy of the callbacks array to avoid issues during iteration
    const callbacks = [...this.events[event]];
    
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
  
  // Emit event once
  once(event, callback) {
    const onceCallback = (...args) => {
      callback(...args);
      this.off(event, onceCallback);
    };
    
    this.on(event, onceCallback);
  }
  
  // Remove all listeners for an event
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
  
  // Get listener count for an event
  listenerCount(event) {
    if (!this.events[event]) return 0;
    return this.events[event].length;
  }
  
  // Get all event names
  eventNames() {
    return Object.keys(this.events);
  }
  
  // Check if event has listeners
  hasListeners(event) {
    return this.listenerCount(event) > 0;
  }
  
  // Emit event asynchronously
  emitAsync(event, ...args) {
    if (!this.events[event]) return Promise.resolve();
    
    const callbacks = [...this.events[event]];
    const promises = callbacks.map(callback => {
      return new Promise((resolve, reject) => {
        try {
          const result = callback(...args);
          if (result && typeof result.then === 'function') {
            result.then(resolve).catch(reject);
          } else {
            resolve(result);
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    return Promise.all(promises);
  }
  
  // Emit event with error handling
  emitSafe(event, ...args) {
    if (!this.events[event]) return;
    
    const callbacks = [...this.events[event]];
    const errors = [];
    
    callbacks.forEach((callback, index) => {
      try {
        callback(...args);
      } catch (error) {
        errors.push({
          index,
          error,
          callback: callback.toString()
        });
        console.error(`Error in event listener ${index} for ${event}:`, error);
      }
    });
    
    return errors;
  }
  
  // Chain multiple events
  chain(...events) {
    let currentIndex = 0;
    
    const next = (data) => {
      if (currentIndex < events.length) {
        const event = events[currentIndex];
        currentIndex++;
        this.emit(event, data, next);
      }
    };
    
    return next;
  }
  
  // Wait for an event
  waitFor(event, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Event ${event} timeout`));
      }, timeout);
      
      this.once(event, (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }
  
  // Wait for multiple events
  waitForAll(events, timeout = 5000) {
    const promises = events.map(event => this.waitFor(event, timeout));
    return Promise.all(promises);
  }
  
  // Wait for any of multiple events
  waitForAny(events, timeout = 5000) {
    return Promise.race(
      events.map(event => this.waitFor(event, timeout))
    );
  }
  
  // Create a namespaced event emitter
  namespace(prefix) {
    const namespaced = new EventEmitter();
    
    // Override emit to add namespace
    const originalEmit = namespaced.emit.bind(namespaced);
    namespaced.emit = (event, ...args) => {
      originalEmit(`${prefix}:${event}`, ...args);
      originalEmit(event, ...args); // Also emit without namespace
    };
    
    return namespaced;
  }
  
  // Destroy the event emitter
  destroy() {
    this.removeAllListeners();
    this.events = null;
  }
}

// Export for use in other modules
export { EventEmitter };
