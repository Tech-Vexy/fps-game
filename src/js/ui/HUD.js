/**
 * HUD - Heads-up display for showing player status and mission information
 */
export class HUD {
  constructor(player) {
    this.player = player;
    this.container = null;
    this.healthBar = null;
    this.armorBar = null;
    this.ammoDisplay = null;
    this.scoreDisplay = null;
    this.missionTracker = null;
    this.objectiveMarker = null;
    this.compass = null;
    
    // Initialize HUD
    this.initialize();
  }
  
  /**
   * Initialize the HUD
   */
  initialize() {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'hud-container';
    document.body.appendChild(this.container);
    
    // Create styles
    this.createStyles();
    
    // Create HUD elements
    this.createHealthBar();
    this.createArmorBar();
    this.createAmmoDisplay();
    this.createScoreDisplay();
    this.createMissionTracker();
    this.createObjectiveMarker();
    this.createCompass();
    
    // Hide initially
    this.hide();
  }
  
  /**
   * Create CSS styles for HUD
   */
  createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .hud-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        user-select: none;
        z-index: 100;
      }
      
      .health-bar-container {
        position: absolute;
        bottom: 20px;
        left: 20px;
        width: 200px;
        height: 10px;
        background-color: rgba(0, 0, 0, 0.5);
        border: 1px solid #444;
        border-radius: 5px;
        overflow: hidden;
      }
      
      .health-bar {
        height: 100%;
        width: 100%;
        background-color: #00cc00;
        transition: width 0.3s ease, background-color 0.3s ease;
      }
      
      .health-bar.low {
        background-color: #cc0000;
      }
      
      .armor-bar-container {
        position: absolute;
        bottom: 35px;
        left: 20px;
        width: 200px;
        height: 5px;
        background-color: rgba(0, 0, 0, 0.5);
        border: 1px solid #444;
        border-radius: 3px;
        overflow: hidden;
      }
      
      .armor-bar {
        height: 100%;
        width: 0%;
        background-color: #0088ff;
        transition: width 0.3s ease;
      }
      
      .ammo-display {
        position: absolute;
        bottom: 20px;
        right: 20px;
        color: white;
        font-family: 'Arial', sans-serif;
        font-size: 24px;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      }
      
      .score-display {
        position: absolute;
        top: 20px;
        right: 20px;
        color: white;
        font-family: 'Arial', sans-serif;
        font-size: 18px;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      }
      
      .mission-tracker {
        position: absolute;
        top: 20px;
        left: 20px;
        color: white;
        font-family: 'Arial', sans-serif;
        font-size: 16px;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        max-width: 300px;
      }
      
      .mission-tracker-title {
        font-weight: bold;
        margin-bottom: 5px;
        color: #ffcc00;
      }
      
      .mission-tracker-objective {
        margin-bottom: 3px;
      }
      
      .mission-tracker-progress {
        height: 3px;
        background-color: rgba(255, 255, 255, 0.3);
        margin-top: 2px;
        margin-bottom: 8px;
        border-radius: 1px;
        overflow: hidden;
      }
      
      .mission-tracker-progress-bar {
        height: 100%;
        background-color: #ffcc00;
        width: 0%;
      }
      
      .objective-marker {
        position: absolute;
        width: 20px;
        height: 20px;
        background-color: rgba(255, 204, 0, 0.8);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 10px rgba(255, 204, 0, 0.5);
        display: none;
      }
      
      .objective-marker::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 10px;
        height: 10px;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        transform: translate(-50%, -50%);
      }
      
      .compass {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        height: 20px;
        background-color: rgba(0, 0, 0, 0.5);
        border: 1px solid #444;
        border-radius: 10px;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .compass-inner {
        position: relative;
        width: 800px;
        height: 100%;
        white-space: nowrap;
        text-align: center;
      }
      
      .compass-direction {
        position: absolute;
        top: 0;
        color: white;
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      }
      
      .compass-marker {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 8px solid white;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Create health bar
   */
  createHealthBar() {
    const container = document.createElement('div');
    container.className = 'health-bar-container';
    
    this.healthBar = document.createElement('div');
    this.healthBar.className = 'health-bar';
    
    container.appendChild(this.healthBar);
    this.container.appendChild(container);
  }
  
  /**
   * Create armor bar
   */
  createArmorBar() {
    const container = document.createElement('div');
    container.className = 'armor-bar-container';
    
    this.armorBar = document.createElement('div');
    this.armorBar.className = 'armor-bar';
    
    container.appendChild(this.armorBar);
    this.container.appendChild(container);
  }
  
  /**
   * Create ammo display
   */
  createAmmoDisplay() {
    this.ammoDisplay = document.createElement('div');
    this.ammoDisplay.className = 'ammo-display';
    this.ammoDisplay.textContent = '30 / 90';
    
    this.container.appendChild(this.ammoDisplay);
  }
  
  /**
   * Create score display
   */
  createScoreDisplay() {
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'score-display';
    this.scoreDisplay.textContent = 'Score: 0';
    
    this.container.appendChild(this.scoreDisplay);
  }
  
  /**
   * Create mission tracker
   */
  createMissionTracker() {
    this.missionTracker = document.createElement('div');
    this.missionTracker.className = 'mission-tracker';
    
    const title = document.createElement('div');
    title.className = 'mission-tracker-title';
    title.textContent = 'Current Mission';
    
    this.missionTracker.appendChild(title);
    this.container.appendChild(this.missionTracker);
  }
  
  /**
   * Create objective marker
   */
  createObjectiveMarker() {
    this.objectiveMarker = document.createElement('div');
    this.objectiveMarker.className = 'objective-marker';
    
    this.container.appendChild(this.objectiveMarker);
  }
  
  /**
   * Create compass
   */
  createCompass() {
    const compass = document.createElement('div');
    compass.className = 'compass';
    
    const inner = document.createElement('div');
    inner.className = 'compass-inner';
    
    // Add cardinal directions
    const directions = [
      { text: 'N', angle: 0 },
      { text: 'NE', angle: 45 },
      { text: 'E', angle: 90 },
      { text: 'SE', angle: 135 },
      { text: 'S', angle: 180 },
      { text: 'SW', angle: 225 },
      { text: 'W', angle: 270 },
      { text: 'NW', angle: 315 }
    ];
    
    directions.forEach(dir => {
      const direction = document.createElement('div');
      direction.className = 'compass-direction';
      direction.textContent = dir.text;
      direction.style.left = `${400 + dir.angle * (800 / 360)}px`;
      inner.appendChild(direction);
    });
    
    // Add marker
    const marker = document.createElement('div');
    marker.className = 'compass-marker';
    compass.appendChild(marker);
    
    compass.appendChild(inner);
    this.compass = { element: compass, inner: inner };
    this.container.appendChild(compass);
  }
  
  /**
   * Update HUD
   */
  update() {
    if (!this.player) return;
    
    // Update health bar
    if (this.healthBar) {
      const healthPercent = Math.max(0, this.player.health) / 100;
      this.healthBar.style.width = `${healthPercent * 100}%`;
      
      // Change color when low health
      if (healthPercent < 0.3) {
        this.healthBar.classList.add('low');
      } else {
        this.healthBar.classList.remove('low');
      }
    }
    
    // Update armor bar
    if (this.armorBar) {
      const armorPercent = Math.max(0, this.player.armor) / 100;
      this.armorBar.style.width = `${armorPercent * 100}%`;
    }
    
    // Update ammo display
    if (this.ammoDisplay) {
      this.ammoDisplay.textContent = `${this.player.ammo} / ${this.player.totalAmmo}`;
    }
    
    // Update score display
    if (this.scoreDisplay && this.player.gameEngine && this.player.gameEngine.missionSystem) {
      const score = this.player.gameEngine.missionSystem.getPlayerScore();
      this.scoreDisplay.textContent = `Score: ${score}`;
    }
    
    // Update compass
    if (this.compass && this.player.mesh) {
      // Get player rotation
      const rotation = this.player.mesh.rotation.y * (180 / Math.PI);
      
      // Update compass position
      this.compass.inner.style.transform = `translateX(${-rotation * (800 / 360)}px)`;
    }
  }
  
  /**
   * Update mission tracker
   * @param {object} mission - Active mission
   */
  updateMissionTracker(mission) {
    if (!this.missionTracker || !mission) return;
    
    // Clear previous content
    while (this.missionTracker.childNodes.length > 1) {
      this.missionTracker.removeChild(this.missionTracker.lastChild);
    }
    
    // Update title
    const title = this.missionTracker.querySelector('.mission-tracker-title');
    if (title) {
      title.textContent = mission.title;
    }
    
    // Add objective
    const objective = document.createElement('div');
    objective.className = 'mission-tracker-objective';
    objective.textContent = mission.description;
    this.missionTracker.appendChild(objective);
    
    // Add progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'mission-tracker-progress';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'mission-tracker-progress-bar';
    progressBar.style.width = `${(mission.progress / mission.target) * 100}%`;
    
    progressContainer.appendChild(progressBar);
    this.missionTracker.appendChild(progressContainer);
    
    // Add progress text
    const progressText = document.createElement('div');
    progressText.className = 'mission-tracker-progress-text';
    progressText.textContent = `Progress: ${mission.progress}/${mission.target}`;
    this.missionTracker.appendChild(progressText);
  }
  
  /**
   * Show objective marker
   * @param {THREE.Vector3} position - World position
   * @param {THREE.Camera} camera - Camera
   */
  showObjectiveMarker(position, camera) {
    if (!this.objectiveMarker || !position || !camera) return;
    
    // Convert 3D position to screen coordinates
    const screenPosition = position.clone().project(camera);
    
    // Check if position is in front of camera
    if (screenPosition.z > 1) {
      this.objectiveMarker.style.display = 'none';
      return;
    }
    
    // Convert to screen coordinates
    const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
    const y = (1 - (screenPosition.y * 0.5 + 0.5)) * window.innerHeight;
    
    // Check if position is within screen bounds
    if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
      this.objectiveMarker.style.display = 'none';
      return;
    }
    
    // Update marker position
    this.objectiveMarker.style.left = `${x}px`;
    this.objectiveMarker.style.top = `${y}px`;
    this.objectiveMarker.style.display = 'block';
  }
  
  /**
   * Hide objective marker
   */
  hideObjectiveMarker() {
    if (this.objectiveMarker) {
      this.objectiveMarker.style.display = 'none';
    }
  }
  
  /**
   * Show HUD
   */
  show() {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }
  
  /**
   * Hide HUD
   */
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }
  
  /**
   * Dispose HUD
   */
  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}