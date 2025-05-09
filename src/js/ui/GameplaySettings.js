/**
 * GameplaySettings - Manages gameplay settings and preferences
 * This class controls visual effects, UI elements, and other settings
 * that can be adjusted to minimize distractions during gameplay
 */
export class GameplaySettings {
  constructor() {
    // Default settings
    this.settings = {
      // Visual settings
      hudOpacity: 0.8,
      showDamageIndicators: true,
      showHitMarkers: true,
      showKillConfirmations: true,
      showAmmoCounter: true,
      showHealthBar: true,
      showMinimap: true,
      showObjectiveMarkers: true,
      
      // Notification settings
      showNotifications: true,
      notificationDuration: 3000, // ms
      notificationPosition: 'top-right', // 'top-right', 'bottom-center', etc.
      
      // Effect settings
      screenShakeIntensity: 1.0, // 0.0 to 1.0
      bloodEffectsIntensity: 1.0, // 0.0 to 1.0
      motionBlurIntensity: 0.5, // 0.0 to 1.0
      
      // Focus mode settings
      focusMode: false,
      autoHideHUD: false,
      autoHideDelay: 3000, // ms
      
      // Accessibility settings
      reducedVisualEffects: false,
      highContrastMode: false
    };
    
    // Load saved settings if available
    this.loadSettings();
  }
  
  /**
   * Load settings from local storage
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('gameplaySettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        this.settings = { ...this.settings, ...parsedSettings };
      }
    } catch (error) {
      console.warn('Failed to load gameplay settings:', error);
    }
  }
  
  /**
   * Save settings to local storage
   */
  saveSettings() {
    try {
      localStorage.setItem('gameplaySettings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save gameplay settings:', error);
    }
  }
  
  /**
   * Update a specific setting
   * @param {string} key - Setting key
   * @param {any} value - Setting value
   */
  updateSetting(key, value) {
    if (key in this.settings) {
      this.settings[key] = value;
      this.saveSettings();
      
      // Dispatch event for UI components to update
      const event = new CustomEvent('settingsChanged', {
        detail: { key, value }
      });
      document.dispatchEvent(event);
    }
  }
  
  /**
   * Enable focus mode to minimize distractions
   */
  enableFocusMode() {
    // Store previous settings to restore later
    this._previousSettings = {
      hudOpacity: this.settings.hudOpacity,
      showNotifications: this.settings.showNotifications,
      showMinimap: this.settings.showMinimap,
      showObjectiveMarkers: this.settings.showObjectiveMarkers
    };
    
    // Apply focus mode settings
    this.settings.focusMode = true;
    this.settings.hudOpacity = 0.5;
    this.settings.showNotifications = false;
    this.settings.showMinimap = false;
    this.settings.autoHideHUD = true;
    
    // Keep essential elements
    this.settings.showHealthBar = true;
    this.settings.showAmmoCounter = true;
    
    this.saveSettings();
    
    // Dispatch event for UI components to update
    const event = new CustomEvent('focusModeChanged', {
      detail: { enabled: true }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Disable focus mode and restore previous settings
   */
  disableFocusMode() {
    if (this._previousSettings) {
      // Restore previous settings
      Object.entries(this._previousSettings).forEach(([key, value]) => {
        this.settings[key] = value;
      });
    }
    
    this.settings.focusMode = false;
    this.settings.autoHideHUD = false;
    
    this.saveSettings();
    
    // Dispatch event for UI components to update
    const event = new CustomEvent('focusModeChanged', {
      detail: { enabled: false }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Toggle focus mode
   * @returns {boolean} New focus mode state
   */
  toggleFocusMode() {
    if (this.settings.focusMode) {
      this.disableFocusMode();
    } else {
      this.enableFocusMode();
    }
    return this.settings.focusMode;
  }
  
  /**
   * Apply settings to the UI manager
   * @param {UIManager} uiManager - The UI manager instance
   */
  applyToUI(uiManager) {
    if (!uiManager) return;
    
    // Apply HUD opacity
    uiManager.setHUDOpacity(this.settings.hudOpacity);
    
    // Show/hide UI elements
    uiManager.toggleElement('healthBar', this.settings.showHealthBar);
    uiManager.toggleElement('ammoCounter', this.settings.showAmmoCounter);
    uiManager.toggleElement('minimap', this.settings.showMinimap);
    uiManager.toggleElement('objectiveMarkers', this.settings.showObjectiveMarkers);
    
    // Configure notifications
    uiManager.setNotificationSettings({
      enabled: this.settings.showNotifications,
      duration: this.settings.notificationDuration,
      position: this.settings.notificationPosition
    });
    
    // Configure auto-hide behavior
    if (this.settings.autoHideHUD) {
      uiManager.enableAutoHide(this.settings.autoHideDelay);
    } else {
      uiManager.disableAutoHide();
    }
  }
  
  /**
   * Apply settings to the post-processing manager
   * @param {PostProcessingManager} postProcessing - The post-processing manager
   */
  applyToPostProcessing(postProcessing) {
    if (!postProcessing) return;
    
    // Apply effect intensity settings
    postProcessing.setMotionBlurIntensity(this.settings.motionBlurIntensity);
    
    // Apply accessibility settings
    if (this.settings.reducedVisualEffects) {
      postProcessing.enableReducedEffects();
    } else {
      postProcessing.disableReducedEffects();
    }
  }
  
  /**
   * Apply settings to the game engine
   * @param {GameEngine} gameEngine - The game engine
   */
  applyToGameEngine(gameEngine) {
    if (!gameEngine) return;
    
    // Apply screen shake settings
    gameEngine.setScreenShakeIntensity(this.settings.screenShakeIntensity);
    
    // Apply blood effects settings
    gameEngine.setBloodEffectsIntensity(this.settings.bloodEffectsIntensity);
  }
}