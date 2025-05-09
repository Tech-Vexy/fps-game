import { HUD } from './HUD';

/**
 * Manages all UI elements in the game
 */
export class UIManager {
  constructor() {
    this.gameEngine = null;
    this.hud = null;
    this.menus = {
      main: null,
      pause: null,
      gameOver: null,
      settings: null
    };
    this.currentMenu = null;
    this.isGamePaused = false;
    
    // Create ammo display element
    this.ammoDisplay = null;
    this.hitMarker = null;
    this.reloadIndicator = null;
  }
  
  /**
   * Set the game engine reference
   * @param {GameEngine} gameEngine - The game engine
   */
  setGameEngine(gameEngine) {
    this.gameEngine = gameEngine;
    
    // Create HUD once we have a player
    if (gameEngine.getPlayer) {
      const player = gameEngine.getPlayer();
      if (player) {
        this.hud = new HUD(player);
      }
    }
    
    // Create menus
    this._createMenus();
    
    // Create in-game UI elements
    this._createGameplayUI();
    
    // Show main menu initially
    this.showMainMenu();
    
    // Add event listeners
    this._addEventListeners();
  }
  
  /**
   * Create gameplay UI elements like ammo counter, hit markers, etc.
   * @private
   */
  _createGameplayUI() {
    // Create container for gameplay UI
    this.gameplayUI = document.createElement('div');
    this.gameplayUI.className = 'gameplay-ui';
    document.body.appendChild(this.gameplayUI);
    
    // Apply styles
    const style = document.createElement('style');
    style.textContent = `
      .gameplay-ui {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 100;
        pointer-events: none;
        user-select: none;
        opacity: 0.8;
        transition: opacity 0.3s ease;
      }
      
      .gameplay-ui.focus-mode {
        opacity: 0.5;
      }
      
      .gameplay-ui.hidden {
        opacity: 0;
      }
      
      .ammo-display {
        background-color: rgba(0, 0, 0, 0.3);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-family: 'Arial', sans-serif;
        font-size: 20px;
        text-align: right;
        margin-bottom: 8px;
        border: 1px solid rgba(255, 51, 51, 0.5);
        text-shadow: 0 0 3px rgba(255, 51, 51, 0.5);
      }
      
      .minimal .ammo-display {
        background-color: transparent;
        border: none;
        font-size: 18px;
      }
      
      .hit-marker {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        opacity: 0;
        transition: opacity 0.15s ease;
      }
      
      .hit-marker:before, .hit-marker:after {
        content: '';
        position: absolute;
        background-color: rgba(255, 255, 255, 0.8);
      }
      
      .hit-marker:before {
        width: 2px;
        height: 16px;
        left: 7px;
        top: 0;
      }
      
      .hit-marker:after {
        width: 16px;
        height: 2px;
        left: 0;
        top: 7px;
      }
      
      .minimal .hit-marker:before, .minimal .hit-marker:after {
        background-color: rgba(255, 255, 255, 0.5);
      }
      
      .reload-indicator {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.3);
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        font-family: 'Arial', sans-serif;
        font-size: 14px;
        text-align: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .minimal .reload-indicator {
        background-color: transparent;
        font-size: 12px;
      }
      
      .reload-progress {
        width: 100%;
        height: 3px;
        background-color: rgba(51, 51, 51, 0.5);
        margin-top: 4px;
        border-radius: 2px;
        overflow: hidden;
      }
      
      .reload-bar {
        height: 100%;
        width: 0%;
        background-color: rgba(255, 51, 51, 0.7);
        transition: width linear;
      }
      
      .empty-magazine {
        position: fixed;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(255, 0, 0, 0.2);
        color: white;
        padding: 4px 10px;
        border-radius: 4px;
        font-family: 'Arial', sans-serif;
        font-size: 14px;
        text-align: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .minimal .empty-magazine {
        background-color: transparent;
        font-size: 12px;
      }
      
      .health-bar {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 200px;
        height: 6px;
        background-color: rgba(0, 0, 0, 0.3);
        border-radius: 3px;
        overflow: hidden;
      }
      
      .health-fill {
        height: 100%;
        width: 100%;
        background-color: rgba(0, 255, 0, 0.7);
        transition: width 0.3s ease, background-color 0.3s ease;
      }
      
      .health-low .health-fill {
        background-color: rgba(255, 0, 0, 0.7);
      }
      
      .crosshair {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.7);
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
      }
      
      .crosshair:before, .crosshair:after {
        content: '';
        position: absolute;
        background-color: rgba(255, 255, 255, 0.7);
      }
      
      .crosshair:before {
        width: 10px;
        height: 2px;
        left: -13px;
        top: 1px;
      }
      
      .crosshair:after {
        width: 10px;
        height: 2px;
        right: -13px;
        top: 1px;
      }
      
      .minimal .crosshair {
        width: 2px;
        height: 2px;
      }
      
      .minimal .crosshair:before, .minimal .crosshair:after {
        width: 6px;
        height: 1px;
        left: -8px;
      }
      
      .minimal .crosshair:after {
        right: -8px;
        left: auto;
      }
      
      /* Fade out UI when inactive */
      .fade-when-inactive {
        transition: opacity 1s ease;
      }
      
      .fade-when-inactive.faded {
        opacity: 0.2;
      }
    `;
    document.head.appendChild(style);
    
    // Create ammo display
    this.ammoDisplay = document.createElement('div');
    this.ammoDisplay.className = 'ammo-display';
    this.ammoDisplay.textContent = '30 / 90';
    this.gameplayUI.appendChild(this.ammoDisplay);
    
    // Create health bar
    this.healthBarContainer = document.createElement('div');
    this.healthBarContainer.className = 'health-bar';
    this.healthFill = document.createElement('div');
    this.healthFill.className = 'health-fill';
    this.healthBarContainer.appendChild(this.healthFill);
    document.body.appendChild(this.healthBarContainer);
    
    // Create crosshair
    this.crosshair = document.createElement('div');
    this.crosshair.className = 'crosshair';
    document.body.appendChild(this.crosshair);
    
    // Create hit marker
    this.hitMarker = document.createElement('div');
    this.hitMarker.className = 'hit-marker';
    document.body.appendChild(this.hitMarker);
    
    // Create reload indicator
    this.reloadIndicator = document.createElement('div');
    this.reloadIndicator.className = 'reload-indicator';
    this.reloadIndicator.innerHTML = 'RELOADING<div class="reload-progress"><div class="reload-bar"></div></div>';
    document.body.appendChild(this.reloadIndicator);
    
    // Create empty magazine indicator
    this.emptyMagazine = document.createElement('div');
    this.emptyMagazine.className = 'empty-magazine';
    this.emptyMagazine.textContent = 'MAGAZINE EMPTY';
    document.body.appendChild(this.emptyMagazine);
    
    // Hide gameplay UI initially
    this.hideGameplayUI();
    
    // Set up auto-hide for UI elements
    this.setupAutoHide();
    
    // Initialize UI mode (normal, minimal, etc.)
    this.uiMode = 'normal';
  }
  
  /**
   * Set up auto-hide functionality for UI elements
   */
  setupAutoHide() {
    // Add fade-when-inactive class to elements that should fade
    this.ammoDisplay.classList.add('fade-when-inactive');
    this.healthBarContainer.classList.add('fade-when-inactive');
    
    // Variables to track mouse/keyboard activity
    this.lastActivityTime = Date.now();
    this.autoHideEnabled = false;
    this.autoHideDelay = 3000; // ms
    
    // Listen for mouse movement and keyboard input
    document.addEventListener('mousemove', () => this.resetActivityTimer());
    document.addEventListener('keydown', () => this.resetActivityTimer());
    document.addEventListener('mousedown', () => this.resetActivityTimer());
    
    // Start the auto-hide check interval
    setInterval(() => this.checkAutoHide(), 1000);
  }
  
  /**
   * Reset the activity timer when user interacts
   */
  resetActivityTimer() {
    this.lastActivityTime = Date.now();
    
    // Show UI elements immediately
    if (this.autoHideEnabled) {
      document.querySelectorAll('.fade-when-inactive').forEach(element => {
        element.classList.remove('faded');
      });
    }
  }
  
  /**
   * Check if UI elements should be hidden due to inactivity
   */
  checkAutoHide() {
    if (!this.autoHideEnabled) return;
    
    const currentTime = Date.now();
    const timeSinceActivity = currentTime - this.lastActivityTime;
    
    if (timeSinceActivity > this.autoHideDelay) {
      // Fade out non-essential UI elements
      document.querySelectorAll('.fade-when-inactive').forEach(element => {
        element.classList.add('faded');
      });
    }
  }
  
  /**
   * Enable auto-hiding of UI elements
   * @param {number} delay - Delay in milliseconds before hiding
   */
  enableAutoHide(delay = 3000) {
    this.autoHideEnabled = true;
    this.autoHideDelay = delay;
  }
  
  /**
   * Disable auto-hiding of UI elements
   */
  disableAutoHide() {
    this.autoHideEnabled = false;
    
    // Make sure all elements are visible
    document.querySelectorAll('.fade-when-inactive').forEach(element => {
      element.classList.remove('faded');
    });
  }
  
  /**
   * Set the UI mode (normal, minimal, focus)
   * @param {string} mode - UI mode ('normal', 'minimal', 'focus')
   */
  setUIMode(mode) {
    // Remove previous mode classes
    this.gameplayUI.classList.remove('minimal', 'focus-mode');
    document.body.classList.remove('minimal', 'focus-mode');
    
    // Apply new mode
    this.uiMode = mode;
    
    switch (mode) {
      case 'minimal':
        this.gameplayUI.classList.add('minimal');
        document.body.classList.add('minimal');
        break;
      case 'focus':
        this.gameplayUI.classList.add('focus-mode');
        document.body.classList.add('focus-mode');
        this.enableAutoHide(2000); // Shorter delay for focus mode
        break;
      default: // 'normal'
        this.disableAutoHide();
        break;
    }
  }
  
  /**
   * Set the opacity of the HUD elements
   * @param {number} opacity - Opacity value (0.0 to 1.0)
   */
  setHUDOpacity(opacity) {
    if (this.gameplayUI) {
      this.gameplayUI.style.opacity = opacity;
    }
  }
  
  /**
   * Toggle visibility of a specific UI element
   * @param {string} elementName - Name of the element to toggle
   * @param {boolean} visible - Whether the element should be visible
   */
  toggleElement(elementName, visible) {
    const elementMap = {
      'healthBar': this.healthBarContainer,
      'ammoCounter': this.ammoDisplay,
      'crosshair': this.crosshair
    };
    
    const element = elementMap[elementName];
    if (element) {
      element.style.display = visible ? 'block' : 'none';
    }
  }
  
  /**
   * Show gameplay UI elements
   */
  showGameplayUI() {
    if (this.gameplayUI) {
      this.gameplayUI.style.display = 'block';
    }
  }
  
  /**
   * Hide gameplay UI elements
   */
  hideGameplayUI() {
    if (this.gameplayUI) {
      this.gameplayUI.style.display = 'none';
    }
  }
  
  /**
   * Update ammo display
   * @param {number} currentAmmo - Current ammo in magazine
   * @param {number} totalAmmo - Total remaining ammo
   */
  updateAmmoDisplay(currentAmmo, totalAmmo) {
    if (this.ammoDisplay) {
      this.ammoDisplay.textContent = `${currentAmmo} / ${totalAmmo}`;
      
      // Change color based on ammo amount
      if (currentAmmo === 0) {
        this.ammoDisplay.style.color = '#ff3333'; // Red for empty
      } else if (currentAmmo <= 5) {
        this.ammoDisplay.style.color = '#ffff00'; // Yellow for low
      } else {
        this.ammoDisplay.style.color = '#ffffff'; // White for normal
      }
    }
  }
  
  /**
   * Show hit marker when enemy is hit
   */
  showHitMarker() {
    if (this.hitMarker) {
      // Show hit marker
      this.hitMarker.style.opacity = '1';
      
      // Hide after a short delay
      setTimeout(() => {
        this.hitMarker.style.opacity = '0';
      }, 150);
    }
  }
  
  /**
   * Show reload indicator with progress bar
   * @param {number} duration - Reload duration in milliseconds
   */
  showReloadIndicator(duration) {
    if (this.reloadIndicator) {
      // Show indicator
      this.reloadIndicator.style.opacity = '1';
      
      // Get progress bar
      const reloadBar = this.reloadIndicator.querySelector('.reload-bar');
      if (reloadBar) {
        // Reset progress
        reloadBar.style.width = '0%';
        reloadBar.style.transition = `width ${duration}ms linear`;
        
        // Start progress animation
        setTimeout(() => {
          reloadBar.style.width = '100%';
        }, 10);
        
        // Hide after completion
        setTimeout(() => {
          this.reloadIndicator.style.opacity = '0';
        }, duration);
      }
    }
  }
  
  /**
   * Show empty magazine indicator
   */
  showEmptyMagazine() {
    if (this.emptyMagazine) {
      // Show indicator
      this.emptyMagazine.style.opacity = '1';
      
      // Hide after a delay
      setTimeout(() => {
        this.emptyMagazine.style.opacity = '0';
      }, 1500);
    }
  }
  
  /**
   * Show ammo count when checking magazine
   * @param {number} currentAmmo - Current ammo in magazine
   * @param {number} maxAmmo - Maximum ammo capacity
   * @param {number} totalAmmo - Total remaining ammo
   */
  showAmmoCount(currentAmmo, maxAmmo, totalAmmo) {
    // Update ammo display with more detailed info
    if (this.ammoDisplay) {
      this.ammoDisplay.textContent = `${currentAmmo}/${maxAmmo} (${totalAmmo})`;
      this.ammoDisplay.style.fontSize = '28px';
      this.ammoDisplay.style.color = '#ffff00';
      
      // Reset after a delay
      setTimeout(() => {
        this.updateAmmoDisplay(currentAmmo, totalAmmo);
        this.ammoDisplay.style.fontSize = '24px';
      }, 1000);
    }
  }
  
  /**
   * Create all game menus
   * @private
   */
  _createMenus() {
    // Create menu container
    this.menuContainer = document.createElement('div');
    this.menuContainer.className = 'game-menu-container';
    document.body.appendChild(this.menuContainer);
    
    // Apply base styles
    const style = document.createElement('style');
    style.textContent = `
      .game-menu-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 1000;
      }
      
      .game-menu {
        background-color: rgba(0, 0, 0, 0.8);
        border: 2px solid #444;
        border-radius: 10px;
        padding: 30px;
        width: 400px;
        max-width: 90%;
        color: white;
        font-family: 'Arial', sans-serif;
        text-align: center;
      }
      
      .game-menu h1 {
        font-size: 36px;
        margin-bottom: 20px;
        color: #ff3333;
        text-transform: uppercase;
        text-shadow: 0 0 10px rgba(255, 51, 51, 0.5);
      }
      
      .game-menu h2 {
        font-size: 24px;
        margin-bottom: 15px;
        color: #ffffff;
      }
      
      .game-menu p {
        margin-bottom: 20px;
      }
      
      .menu-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .menu-button {
        background-color: #ff3333;
        color: white;
        border: none;
        border-radius: 5px;
        padding: 12px 20px;
        font-size: 18px;
        cursor: pointer;
        transition: background-color 0.2s ease, transform 0.1s ease;
        text-transform: uppercase;
        font-weight: bold;
      }
      
      .menu-button:hover {
        background-color: #ff5555;
        transform: translateY(-2px);
      }
      
      .menu-button:active {
        transform: translateY(1px);
      }
      
      .menu-button.secondary {
        background-color: #444;
      }
      
      .menu-button.secondary:hover {
        background-color: #666;
      }
    `;
    document.head.appendChild(style);
    
    // Create main menu
    this.menus.main = this._createMainMenu();
    
    // Create pause menu
    this.menus.pause = this._createPauseMenu();
    
    // Create game over menu
    this.menus.gameOver = this._createGameOverMenu();
    
    // Create settings menu
    this.menus.settings = this._createSettingsMenu();
    
    // Hide all menus initially
    Object.values(this.menus).forEach(menu => {
      if (menu) {
        menu.style.display = 'none';
      }
    });
  }
  
  /**
   * Create the main menu
   * @returns {HTMLElement} - The main menu element
   * @private
   */
  _createMainMenu() {
    const menu = document.createElement('div');
    menu.className = 'game-menu';
    
    const title = document.createElement('h1');
    title.textContent = 'FPS GAME';
    menu.appendChild(title);
    
    const subtitle = document.createElement('h2');
    subtitle.textContent = 'High-Definition Edition';
    menu.appendChild(subtitle);
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'menu-buttons';
    
    // Start game button
    const startButton = document.createElement('button');
    startButton.className = 'menu-button';
    startButton.textContent = 'Start Game';
    startButton.addEventListener('click', () => this.startGame());
    buttonsContainer.appendChild(startButton);
    
    // Settings button
    const settingsButton = document.createElement('button');
    settingsButton.className = 'menu-button secondary';
    settingsButton.textContent = 'Settings';
    settingsButton.addEventListener('click', () => this.showSettingsMenu());
    buttonsContainer.appendChild(settingsButton);
    
    menu.appendChild(buttonsContainer);
    this.menuContainer.appendChild(menu);
    
    return menu;
  }
  
  /**
   * Create the pause menu
   * @returns {HTMLElement} - The pause menu element
   * @private
   */
  _createPauseMenu() {
    const menu = document.createElement('div');
    menu.className = 'game-menu';
    
    const title = document.createElement('h1');
    title.textContent = 'PAUSED';
    menu.appendChild(title);
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'menu-buttons';
    
    // Resume game button
    const resumeButton = document.createElement('button');
    resumeButton.className = 'menu-button';
    resumeButton.textContent = 'Resume Game';
    resumeButton.addEventListener('click', () => this.resumeGame());
    buttonsContainer.appendChild(resumeButton);
    
    // Settings button
    const settingsButton = document.createElement('button');
    settingsButton.className = 'menu-button secondary';
    settingsButton.textContent = 'Settings';
    settingsButton.addEventListener('click', () => this.showSettingsMenu());
    buttonsContainer.appendChild(settingsButton);
    
    // Main menu button
    const mainMenuButton = document.createElement('button');
    mainMenuButton.className = 'menu-button secondary';
    mainMenuButton.textContent = 'Main Menu';
    mainMenuButton.addEventListener('click', () => this.showMainMenu());
    buttonsContainer.appendChild(mainMenuButton);
    
    menu.appendChild(buttonsContainer);
    this.menuContainer.appendChild(menu);
    
    return menu;
  }
  
  /**
   * Create the game over menu
   * @returns {HTMLElement} - The game over menu element
   * @private
   */
  _createGameOverMenu() {
    const menu = document.createElement('div');
    menu.className = 'game-menu';
    
    const title = document.createElement('h1');
    title.textContent = 'GAME OVER';
    menu.appendChild(title);
    
    const message = document.createElement('p');
    message.textContent = 'You have been defeated!';
    menu.appendChild(message);
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'menu-buttons';
    
    // Restart game button
    const restartButton = document.createElement('button');
    restartButton.className = 'menu-button';
    restartButton.textContent = 'Try Again';
    restartButton.addEventListener('click', () => this.restartGame());
    buttonsContainer.appendChild(restartButton);
    
    // Main menu button
    const mainMenuButton = document.createElement('button');
    mainMenuButton.className = 'menu-button secondary';
    mainMenuButton.textContent = 'Main Menu';
    mainMenuButton.addEventListener('click', () => this.showMainMenu());
    buttonsContainer.appendChild(mainMenuButton);
    
    menu.appendChild(buttonsContainer);
    this.menuContainer.appendChild(menu);
    
    return menu;
  }
  
  /**
   * Create the settings menu
   * @returns {HTMLElement} - The settings menu element
   * @private
   */
  _createSettingsMenu() {
    const menu = document.createElement('div');
    menu.className = 'game-menu';
    
    const title = document.createElement('h1');
    title.textContent = 'SETTINGS';
    menu.appendChild(title);
    
    // Back button
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'menu-buttons';
    
    const backButton = document.createElement('button');
    backButton.className = 'menu-button';
    backButton.textContent = 'Back';
    backButton.addEventListener('click', () => {
      if (this.isGamePaused) {
        this.showPauseMenu();
      } else {
        this.showMainMenu();
      }
    });
    
    buttonsContainer.appendChild(backButton);
    menu.appendChild(buttonsContainer);
    
    this.menuContainer.appendChild(menu);
    
    return menu;
  }
  
  /**
   * Add global event listeners
   * @private
   */
  _addEventListeners() {
    // Listen for escape key to toggle pause menu
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') {
        if (this.currentMenu === this.menus.pause) {
          this.resumeGame();
        } else if (!this.currentMenu || this.currentMenu === this.menus.settings && this.isGamePaused) {
          this.pauseGame();
        }
      }
    });
  }
  
  /**
   * Show the main menu
   */
  showMainMenu() {
    // Hide all menus first
    Object.values(this.menus).forEach(menu => {
      if (menu) {
        menu.style.display = 'none';
      }
    });
    
    // Show main menu
    this.menus.main.style.display = 'block';
    this.menuContainer.style.display = 'flex';
    this.currentMenu = this.menus.main;
    
    // Hide HUD
    if (this.hud) {
      this.hud.hide();
    }
    
    // Hide gameplay UI
    this.hideGameplayUI();
    
    // Stop the game
    if (this.gameEngine) {
      this.gameEngine.stop();
    }
    
    // Exit pointer lock
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }
  
  /**
   * Show the pause menu
   */
  showPauseMenu() {
    // Hide all menus first
    Object.values(this.menus).forEach(menu => {
      if (menu) {
        menu.style.display = 'none';
      }
    });
    
    // Show pause menu
    this.menus.pause.style.display = 'block';
    this.menuContainer.style.display = 'flex';
    this.currentMenu = this.menus.pause;
    
    // Pause the game
    if (this.gameEngine) {
      this.gameEngine.stop();
    }
    
    // Exit pointer lock
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
    
    this.isGamePaused = true;
  }
  
  /**
   * Show the game over menu
   */
  showGameOver() {
    // Hide all menus first
    Object.values(this.menus).forEach(menu => {
      if (menu) {
        menu.style.display = 'none';
      }
    });
    
    // Show game over menu
    this.menus.gameOver.style.display = 'block';
    this.menuContainer.style.display = 'flex';
    this.currentMenu = this.menus.gameOver;
    
    // Hide HUD
    if (this.hud) {
      this.hud.hide();
    }
    
    // Hide gameplay UI
    this.hideGameplayUI();
    
    // Stop the game
    if (this.gameEngine) {
      this.gameEngine.stop();
    }
    
    // Exit pointer lock
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }
  
  /**
   * Show the settings menu
   */
  showSettingsMenu() {
    // Hide all menus first
    Object.values(this.menus).forEach(menu => {
      if (menu) {
        menu.style.display = 'none';
      }
    });
    
    // Show settings menu
    this.menus.settings.style.display = 'block';
    this.menuContainer.style.display = 'flex';
    this.currentMenu = this.menus.settings;
  }
  
  /**
   * Start the game
   */
  startGame() {
    // Hide all menus
    this.menuContainer.style.display = 'none';
    this.currentMenu = null;
    
    // Show HUD
    if (this.hud) {
      this.hud.show();
    }
    
    // Show gameplay UI
    this.showGameplayUI();
    
    // Start the game
    if (this.gameEngine) {
      this.gameEngine.start();
    }
    
    this.isGamePaused = false;
  }
  
  /**
   * Pause the game
   */
  pauseGame() {
    this.showPauseMenu();
  }
  
  /**
   * Resume the game
   */
  resumeGame() {
    // Hide all menus
    this.menuContainer.style.display = 'none';
    this.currentMenu = null;
    
    // Show gameplay UI
    this.showGameplayUI();
    
    // Start the game
    if (this.gameEngine) {
      this.gameEngine.start();
    }
    
    this.isGamePaused = false;
  }
  
  /**
   * Restart the game
   */
  restartGame() {
    // Hide all menus
    this.menuContainer.style.display = 'none';
    this.currentMenu = null;
    
    // Show HUD
    if (this.hud) {
      this.hud.show();
    }
    
    // Show gameplay UI
    this.showGameplayUI();
    
    // Restart the game
    if (this.gameEngine) {
      this.gameEngine.restart();
    }
    
    this.isGamePaused = false;
  }
  
  /**
   * Show a message to the player
   * @param {string} text - Message text
   * @param {number} duration - Duration in milliseconds
   */
  showMessage(text, duration = 3000) {
    // Create message element if it doesn't exist
    if (!this.messageElement) {
      this.messageElement = document.createElement('div');
      this.messageElement.style.position = 'fixed';
      this.messageElement.style.top = '20%';
      this.messageElement.style.left = '50%';
      this.messageElement.style.transform = 'translateX(-50%)';
      this.messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      this.messageElement.style.color = 'white';
      this.messageElement.style.padding = '10px 20px';
      this.messageElement.style.borderRadius = '5px';
      this.messageElement.style.fontFamily = 'Arial, sans-serif';
      this.messageElement.style.fontSize = '20px';
      this.messageElement.style.textAlign = 'center';
      this.messageElement.style.zIndex = '1000';
      this.messageElement.style.opacity = '0';
      this.messageElement.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(this.messageElement);
    }
    
    // Set message text
    this.messageElement.textContent = text;
    
    // Show message
    this.messageElement.style.opacity = '1';
    
    // Hide after duration
    setTimeout(() => {
      this.messageElement.style.opacity = '0';
    }, duration);
  }
  
  /**
   * Update the UI
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    // Update HUD if game is running
    if (!this.currentMenu && this.hud) {
      this.hud.update();
    }
  }
  
  /**
   * Reset the UI
   */
  reset() {
    // Reset HUD
    if (this.hud) {
      this.hud.update();
    }
    
    // Reset ammo display
    if (this.ammoDisplay) {
      this.ammoDisplay.textContent = '30 / 90';
      this.ammoDisplay.style.color = '#ffffff';
    }
  }
  
  /**
   * Clean up the UI
   */
  dispose() {
    // Remove menu container
    if (this.menuContainer && this.menuContainer.parentNode) {
      this.menuContainer.parentNode.removeChild(this.menuContainer);
    }
    
    // Remove gameplay UI
    if (this.gameplayUI && this.gameplayUI.parentNode) {
      this.gameplayUI.parentNode.removeChild(this.gameplayUI);
    }
    
    // Remove hit marker
    if (this.hitMarker && this.hitMarker.parentNode) {
      this.hitMarker.parentNode.removeChild(this.hitMarker);
    }
    
    // Remove reload indicator
    if (this.reloadIndicator && this.reloadIndicator.parentNode) {
      this.reloadIndicator.parentNode.removeChild(this.reloadIndicator);
    }
    
    // Remove empty magazine indicator
    if (this.emptyMagazine && this.emptyMagazine.parentNode) {
      this.emptyMagazine.parentNode.removeChild(this.emptyMagazine);
    }
    
    // Dispose HUD
    if (this.hud) {
      this.hud.dispose();
    }
  }
}