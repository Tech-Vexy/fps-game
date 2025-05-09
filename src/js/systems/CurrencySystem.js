/**
 * System for managing in-game currency
 */
export class CurrencySystem {
  constructor() {
    this.gameEngine = null;
    this.credits = 500; // Starting credits
    this.listeners = [];
  }
  
  /**
   * Set the game engine reference
   * @param {GameEngine} gameEngine - The game engine
   */
  setGameEngine(gameEngine) {
    this.gameEngine = gameEngine;
  }
  
  /**
   * Add credits to the player's balance
   * @param {number} amount - Amount of credits to add
   */
  addCredits(amount) {
    this.credits += amount;
    this._notifyListeners();
  }
  
  /**
   * Remove credits from the player's balance
   * @param {number} amount - Amount of credits to remove
   * @returns {boolean} - True if the player had enough credits, false otherwise
   */
  removeCredits(amount) {
    if (this.credits >= amount) {
      this.credits -= amount;
      this._notifyListeners();
      return true;
    }
    return false;
  }
  
  /**
   * Get the current credit balance
   * @returns {number} - Current credit balance
   */
  getCredits() {
    return this.credits;
  }
  
  /**
   * Add a listener for credit changes
   * @param {Function} listener - Function to call when credits change
   */
  addListener(listener) {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a listener
   * @param {Function} listener - Listener to remove
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Notify all listeners of a credit change
   * @private
   */
  _notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.credits);
    }
  }
  
  /**
   * Award credits for killing an enemy
   * @param {string} enemyType - Type of enemy killed
   */
  awardCreditsForKill(enemyType) {
    let amount = 0;
    
    // Award different amounts based on enemy type
    switch (enemyType) {
      case 'basic':
        amount = 50;
        break;
      case 'fast':
        amount = 75;
        break;
      case 'heavy':
        amount = 100;
        break;
      case 'boss':
        amount = 500;
        break;
      default:
        amount = 25;
    }
    
    this.addCredits(amount);
    
    // Show credit gain message if UI manager exists
    if (this.gameEngine && this.gameEngine.uiManager) {
      this.gameEngine.uiManager.showCreditGain(amount);
    }
  }
  
  /**
   * Reset the currency system
   */
  reset() {
    this.credits = 500;
    this._notifyListeners();
  }
}