/**
 * Simple event emitter for game events
 */
export class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener callback
   */
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(listener);
    
    return () => this.off(event, listener);
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener to remove
   */
  off(event, listener) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(l => l !== listener);
  }
  
  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  emit(event, data) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
  
  /**
   * Register a one-time event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener callback
   */
  once(event, listener) {
    const remove = this.on(event, data => {
      remove();
      listener(data);
    });
    
    return remove;
  }
  
  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (event) {
      this.events[event] = [];
    } else {
      this.events = {};
    }
  }
}