/**
 * KeyBindings - Manages keyboard shortcuts and key bindings
 * This class handles keyboard shortcuts for toggling UI elements,
 * changing game settings, and other functions to minimize distractions
 */
export class KeyBindings {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.bindings = {
      // UI toggles
      'KeyH': { action: 'toggleHUD', description: 'Toggle HUD visibility' },
      'KeyM': { action: 'toggleMinimap', description: 'Toggle minimap' },
      'KeyF': { action: 'toggleFocusMode', description: 'Toggle focus mode' },
      'KeyX': { action: 'toggleCrosshair', description: 'Toggle crosshair' },
      
      // View modes
      'KeyV': { action: 'cycleViewMode', description: 'Cycle view modes (normal, minimal, focus)' },
      
      // Game controls
      'F11': { action: 'toggleFullscreen', description: 'Toggle fullscreen' },
      'Backquote': { action: 'toggleConsole', description: 'Toggle developer console' },
      'F5': { action: 'quickSave', description: 'Quick save' },
      'F9': { action: 'quickLoad', description: 'Quick load' },
      
      // Screenshot
      'F12': { action: 'takeScreenshot', description: 'Take screenshot' }
    };
    
    // Initialize
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for key presses
   */
  setupEventListeners() {
    document.addEventListener('keydown', (event) => {
      // Ignore key presses when typing in input fields
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Check if this key has a binding
      const binding = this.bindings[event.code];
      if (binding) {
        this.executeAction(binding.action, event);
        
        // Prevent default browser behavior for these keys
        event.preventDefault();
      }
    });
  }
  
  /**
   * Execute the action associated with a key binding
   * @param {string} action - The action to execute
   * @param {KeyboardEvent} event - The keyboard event
   */
  executeAction(action, event) {
    // Skip if game engine is not available
    if (!this.gameEngine) return;
    
    switch (action) {
      case 'toggleHUD':
        this.toggleHUD();
        break;
        
      case 'toggleMinimap':
        this.toggleMinimap();
        break;
        
      case 'toggleFocusMode':
        this.toggleFocusMode();
        break;
        
      case 'toggleCrosshair':
        this.toggleCrosshair();
        break;
        
      case 'cycleViewMode':
        this.cycleViewMode();
        break;
        
      case 'toggleFullscreen':
        this.toggleFullscreen();
        break;
        
      case 'toggleConsole':
        this.toggleConsole();
        break;
        
      case 'quickSave':
        this.quickSave();
        break;
        
      case 'quickLoad':
        this.quickLoad();
        break;
        
      case 'takeScreenshot':
        this.takeScreenshot();
        break;
    }
  }
  
  /**
   * Toggle HUD visibility
   */
  toggleHUD() {
    if (this.gameEngine.uiManager) {
      const isVisible = this.gameEngine.uiManager.gameplayUI.style.display !== 'none';
      
      if (isVisible) {
        this.gameEngine.uiManager.hideGameplayUI();
      } else {
        this.gameEngine.uiManager.showGameplayUI();
      }
      
      // Show temporary notification
      this.showNotification(`HUD ${isVisible ? 'hidden' : 'visible'}`);
    }
  }
  
  /**
   * Toggle minimap visibility
   */
  toggleMinimap() {
    if (this.gameEngine.uiManager) {
      const minimap = document.querySelector('.minimap');
      if (minimap) {
        const isVisible = minimap.style.display !== 'none';
        minimap.style.display = isVisible ? 'none' : 'block';
        
        // Show temporary notification
        this.showNotification(`Minimap ${isVisible ? 'hidden' : 'visible'}`);
      }
    }
  }
  
  /**
   * Toggle focus mode
   */
  toggleFocusMode() {
    if (this.gameEngine.uiManager) {
      // Check if we have gameplay settings
      if (this.gameEngine.gameplaySettings) {
        const enabled = this.gameEngine.gameplaySettings.toggleFocusMode();
        this.showNotification(`Focus mode ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        // Fallback if no gameplay settings
        const uiManager = this.gameEngine.uiManager;
        const currentMode = uiManager.uiMode;
        
        if (currentMode === 'focus') {
          uiManager.setUIMode('normal');
          this.showNotification('Focus mode disabled');
        } else {
          uiManager.setUIMode('focus');
          this.showNotification('Focus mode enabled');
        }
      }
    }
  }
  
  /**
   * Toggle crosshair visibility
   */
  toggleCrosshair() {
    if (this.gameEngine.uiManager && this.gameEngine.uiManager.crosshair) {
      const crosshair = this.gameEngine.uiManager.crosshair;
      const isVisible = crosshair.style.display !== 'none';
      crosshair.style.display = isVisible ? 'none' : 'block';
      
      // Show temporary notification
      this.showNotification(`Crosshair ${isVisible ? 'hidden' : 'visible'}`);
    }
  }
  
  /**
   * Cycle through view modes (normal, minimal, focus)
   */
  cycleViewMode() {
    if (this.gameEngine.uiManager) {
      const uiManager = this.gameEngine.uiManager;
      const modes = ['normal', 'minimal', 'focus'];
      
      // Find current mode index
      const currentIndex = modes.indexOf(uiManager.uiMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      const nextMode = modes[nextIndex];
      
      // Set new mode
      uiManager.setUIMode(nextMode);
      
      // Show temporary notification
      this.showNotification(`View mode: ${nextMode}`);
    }
  }
  
  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      this.showNotification('Fullscreen enabled');
    } else {
      document.exitFullscreen();
      this.showNotification('Fullscreen disabled');
    }
  }
  
  /**
   * Toggle developer console
   */
  toggleConsole() {
    if (this.gameEngine.developerConsole) {
      this.gameEngine.developerConsole.toggle();
    }
  }
  
  /**
   * Quick save game state
   */
  quickSave() {
    if (this.gameEngine.saveSystem) {
      this.gameEngine.saveSystem.quickSave();
      this.showNotification('Game saved');
    }
  }
  
  /**
   * Quick load game state
   */
  quickLoad() {
    if (this.gameEngine.saveSystem) {
      this.gameEngine.saveSystem.quickLoad();
      this.showNotification('Game loaded');
    }
  }
  
  /**
   * Take a screenshot
   */
  takeScreenshot() {
    if (this.gameEngine.renderer) {
      // Temporarily hide UI for screenshot
      const uiElements = document.querySelectorAll('.gameplay-ui, .hit-marker, .crosshair');
      const originalDisplays = [];
      
      // Store original display values and hide elements
      uiElements.forEach(element => {
        originalDisplays.push(element.style.display);
        element.style.display = 'none';
      });
      
      // Render one frame without UI
      this.gameEngine.renderer.render(this.gameEngine.scene, this.gameEngine.camera);
      
      // Capture the canvas content
      const canvas = this.gameEngine.renderer.domElement;
      const screenshot = canvas.toDataURL('image/png');
      
      // Create a download link
      const link = document.createElement('a');
      link.href = screenshot;
      link.download = `screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      link.click();
      
      // Restore UI elements
      uiElements.forEach((element, index) => {
        element.style.display = originalDisplays[index];
      });
      
      // Show notification
      this.showNotification('Screenshot saved');
    }
  }
  
  /**
   * Show a temporary notification
   * @param {string} message - The notification message
   */
  showNotification(message) {
    if (this.gameEngine.uiManager && this.gameEngine.uiManager.showMessage) {
      this.gameEngine.uiManager.showMessage(message, 1500);
    } else {
      // Fallback notification if UI manager doesn't have showMessage
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.bottom = '50px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      notification.style.color = 'white';
      notification.style.padding = '8px 16px';
      notification.style.borderRadius = '4px';
      notification.style.fontFamily = 'Arial, sans-serif';
      notification.style.fontSize = '14px';
      notification.style.zIndex = '1000';
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      // Remove after delay
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 1500);
    }
  }
}