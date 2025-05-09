/**
 * MissionUI - Handles the UI for displaying missions, progress, and rewards
 */
export class MissionUI {
  constructor(missionSystem) {
    this.missionSystem = missionSystem;
    this.container = null;
    this.missionList = null;
    this.activeMissionsList = null;
    this.scoreDisplay = null;
    this.rankDisplay = null;
    this.notificationContainer = null;
    
    // Initialize UI
    this.initialize();
    
    // Register event listeners
    this.registerEventListeners();
  }
  
  /**
   * Initialize the mission UI
   */
  initialize() {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'mission-ui';
    document.body.appendChild(this.container);
    
    // Create styles
    this.createStyles();
    
    // Create UI components
    this.createHeader();
    this.createMissionList();
    this.createActiveMissionsList();
    this.createNotificationArea();
    
    // Hide initially
    this.hide();
  }
  
  /**
   * Create CSS styles for mission UI
   */
  createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .mission-ui {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        background-color: rgba(0, 0, 0, 0.7);
        border: 1px solid #444;
        border-radius: 5px;
        color: white;
        font-family: 'Arial', sans-serif;
        z-index: 1000;
        transition: opacity 0.3s ease;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
      }
      
      .mission-header {
        padding: 10px;
        background-color: rgba(0, 0, 0, 0.5);
        border-bottom: 1px solid #444;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .mission-header h2 {
        margin: 0;
        font-size: 18px;
        color: #ff3333;
      }
      
      .player-stats {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      
      .score-display {
        font-size: 16px;
        font-weight: bold;
        color: #ffcc00;
      }
      
      .rank-display {
        font-size: 14px;
        color: #aaffaa;
      }
      
      .mission-list-container {
        padding: 10px;
        overflow-y: auto;
        max-height: 300px;
      }
      
      .mission-list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .mission-list-header h3 {
        margin: 0;
        font-size: 16px;
      }
      
      .mission-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .mission-item {
        background-color: rgba(0, 0, 0, 0.3);
        border: 1px solid #555;
        border-radius: 3px;
        margin-bottom: 8px;
        padding: 8px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .mission-item:hover {
        background-color: rgba(40, 40, 40, 0.5);
      }
      
      .mission-item.active {
        border-color: #ffcc00;
      }
      
      .mission-item.completed {
        border-color: #00cc00;
      }
      
      .mission-item.failed {
        border-color: #cc0000;
      }
      
      .mission-title {
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .mission-description {
        font-size: 12px;
        color: #ccc;
        margin-bottom: 5px;
      }
      
      .mission-details {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
      }
      
      .mission-reward {
        color: #ffcc00;
      }
      
      .mission-difficulty {
        color: #ff6666;
      }
      
      .mission-progress {
        height: 4px;
        background-color: #333;
        margin-top: 5px;
        border-radius: 2px;
        overflow: hidden;
      }
      
      .mission-progress-bar {
        height: 100%;
        background-color: #00cc00;
        width: 0%;
        transition: width 0.3s ease;
      }
      
      .mission-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 5px;
      }
      
      .mission-button {
        background-color: #ff3333;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 5px 10px;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .mission-button:hover {
        background-color: #ff5555;
      }
      
      .mission-button:disabled {
        background-color: #555;
        cursor: not-allowed;
      }
      
      .mission-notification {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.7);
        border: 1px solid #444;
        border-radius: 5px;
        padding: 10px 20px;
        color: white;
        font-family: 'Arial', sans-serif;
        font-size: 16px;
        z-index: 1001;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .mission-notification.show {
        opacity: 1;
      }
      
      .mission-notification.success {
        border-color: #00cc00;
      }
      
      .mission-notification.failure {
        border-color: #cc0000;
      }
      
      .mission-notification.reward {
        border-color: #ffcc00;
      }
      
      .mission-toggle {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: rgba(0, 0, 0, 0.7);
        border: 1px solid #444;
        border-radius: 5px;
        color: white;
        font-family: 'Arial', sans-serif;
        padding: 5px 10px;
        cursor: pointer;
        z-index: 999;
      }
      
      .active-missions-container {
        padding: 10px;
        border-top: 1px solid #444;
      }
      
      .active-missions-header {
        margin: 0 0 10px 0;
        font-size: 16px;
      }
      
      .active-missions-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .time-remaining {
        color: #ff9900;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Create header with player stats
   */
  createHeader() {
    const header = document.createElement('div');
    header.className = 'mission-header';
    
    const title = document.createElement('h2');
    title.textContent = 'Missions';
    header.appendChild(title);
    
    const playerStats = document.createElement('div');
    playerStats.className = 'player-stats';
    
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'score-display';
    this.scoreDisplay.textContent = 'Score: 0';
    playerStats.appendChild(this.scoreDisplay);
    
    this.rankDisplay = document.createElement('div');
    this.rankDisplay.className = 'rank-display';
    this.rankDisplay.textContent = 'Rank: Rookie';
    playerStats.appendChild(this.rankDisplay);
    
    header.appendChild(playerStats);
    this.container.appendChild(header);
    
    // Create toggle button
    const toggleButton = document.createElement('div');
    toggleButton.className = 'mission-toggle';
    toggleButton.textContent = 'Missions';
    toggleButton.addEventListener('click', () => this.toggle());
    document.body.appendChild(toggleButton);
  }
  
  /**
   * Create mission list
   */
  createMissionList() {
    const listContainer = document.createElement('div');
    listContainer.className = 'mission-list-container';
    
    const listHeader = document.createElement('div');
    listHeader.className = 'mission-list-header';
    
    const listTitle = document.createElement('h3');
    listTitle.textContent = 'Available Missions';
    listHeader.appendChild(listTitle);
    
    const refreshButton = document.createElement('button');
    refreshButton.className = 'mission-button';
    refreshButton.textContent = 'Refresh';
    refreshButton.addEventListener('click', () => this.refreshMissions());
    listHeader.appendChild(refreshButton);
    
    listContainer.appendChild(listHeader);
    
    this.missionList = document.createElement('ul');
    this.missionList.className = 'mission-list';
    listContainer.appendChild(this.missionList);
    
    this.container.appendChild(listContainer);
  }
  
  /**
   * Create active missions list
   */
  createActiveMissionsList() {
    const activeMissionsContainer = document.createElement('div');
    activeMissionsContainer.className = 'active-missions-container';
    
    const activeMissionsHeader = document.createElement('h3');
    activeMissionsHeader.className = 'active-missions-header';
    activeMissionsHeader.textContent = 'Active Missions';
    activeMissionsContainer.appendChild(activeMissionsHeader);
    
    this.activeMissionsList = document.createElement('ul');
    this.activeMissionsList.className = 'active-missions-list';
    activeMissionsContainer.appendChild(this.activeMissionsList);
    
    this.container.appendChild(activeMissionsContainer);
  }
  
  /**
   * Create notification area
   */
  createNotificationArea() {
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.className = 'mission-notification';
    document.body.appendChild(this.notificationContainer);
  }
  
  /**
   * Register event listeners
   */
  registerEventListeners() {
    if (!this.missionSystem || !this.missionSystem.events) return;
    
    // Listen for mission events
    this.missionSystem.events.on('missionsGenerated', () => this.updateMissionList());
    this.missionSystem.events.on('missionAccepted', () => this.updateMissionLists());
    this.missionSystem.events.on('missionProgress', (data) => this.updateMissionProgress(data));
    this.missionSystem.events.on('missionCompleted', (data) => this.onMissionCompleted(data));
    this.missionSystem.events.on('missionFailed', (data) => this.onMissionFailed(data));
    this.missionSystem.events.on('pointsAwarded', (data) => this.updateScore(data));
    this.missionSystem.events.on('playerRankUp', (data) => this.onPlayerRankUp(data));
    this.missionSystem.events.on('missionError', (data) => this.showNotification(data.message, 'failure'));
  }
  
  /**
   * Update mission list
   */
  updateMissionList() {
    if (!this.missionList) return;
    
    // Clear list
    this.missionList.innerHTML = '';
    
    // Get available missions
    const missions = this.missionSystem.getAvailableMissions();
    
    // Add missions to list
    missions.forEach(mission => {
      const missionItem = this.createMissionItem(mission);
      this.missionList.appendChild(missionItem);
    });
    
    // Update active missions list
    this.updateActiveMissionsList();
  }
  
  /**
   * Update active missions list
   */
  updateActiveMissionsList() {
    if (!this.activeMissionsList) return;
    
    // Clear list
    this.activeMissionsList.innerHTML = '';
    
    // Get active missions
    const activeMissions = this.missionSystem.getActiveMissions();
    
    // Add missions to list
    activeMissions.forEach(mission => {
      const missionItem = this.createActiveMissionItem(mission);
      this.activeMissionsList.appendChild(missionItem);
    });
  }
  
  /**
   * Update both mission lists
   */
  updateMissionLists() {
    this.updateMissionList();
    this.updateActiveMissionsList();
  }
  
  /**
   * Create a mission item
   * @param {object} mission - Mission data
   * @returns {HTMLElement} - Mission item element
   */
  createMissionItem(mission) {
    const item = document.createElement('li');
    item.className = 'mission-item';
    item.dataset.missionId = mission.id;
    
    const title = document.createElement('div');
    title.className = 'mission-title';
    title.textContent = mission.title;
    item.appendChild(title);
    
    const description = document.createElement('div');
    description.className = 'mission-description';
    description.textContent = mission.description;
    item.appendChild(description);
    
    const details = document.createElement('div');
    details.className = 'mission-details';
    
    const reward = document.createElement('div');
    reward.className = 'mission-reward';
    reward.textContent = `Reward: ${mission.reward} pts`;
    details.appendChild(reward);
    
    const difficulty = document.createElement('div');
    difficulty.className = 'mission-difficulty';
    difficulty.textContent = `Difficulty: ${this.getDifficultyStars(mission.difficulty)}`;
    details.appendChild(difficulty);
    
    item.appendChild(details);
    
    const actions = document.createElement('div');
    actions.className = 'mission-actions';
    
    const acceptButton = document.createElement('button');
    acceptButton.className = 'mission-button';
    acceptButton.textContent = 'Accept Mission';
    acceptButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.acceptMission(mission.id);
    });
    
    // Disable button if max active missions reached
    if (this.missionSystem.activeMissions.length >= this.missionSystem.maxActiveMissions) {
      acceptButton.disabled = true;
      acceptButton.title = `Maximum of ${this.missionSystem.maxActiveMissions} active missions allowed`;
    }
    
    actions.appendChild(acceptButton);
    item.appendChild(actions);
    
    return item;
  }
  
  /**
   * Create an active mission item
   * @param {object} mission - Mission data
   * @returns {HTMLElement} - Mission item element
   */
  createActiveMissionItem(mission) {
    const item = document.createElement('li');
    item.className = 'mission-item active';
    item.dataset.missionId = mission.id;
    
    const title = document.createElement('div');
    title.className = 'mission-title';
    title.textContent = mission.title;
    item.appendChild(title);
    
    const description = document.createElement('div');
    description.className = 'mission-description';
    description.textContent = mission.description;
    item.appendChild(description);
    
    // Add time remaining if applicable
    if (mission.timeLimit > 0) {
      const timeRemaining = document.createElement('div');
      timeRemaining.className = 'time-remaining';
      timeRemaining.textContent = `Time remaining: ${Math.ceil(mission.timeRemaining)}s`;
      item.appendChild(timeRemaining);
    }
    
    const details = document.createElement('div');
    details.className = 'mission-details';
    
    const reward = document.createElement('div');
    reward.className = 'mission-reward';
    reward.textContent = `Reward: ${mission.reward} pts`;
    details.appendChild(reward);
    
    const progress = document.createElement('div');
    progress.textContent = `Progress: ${mission.progress}/${mission.target}`;
    details.appendChild(progress);
    
    item.appendChild(details);
    
    // Add progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'mission-progress';
    
    const progressFill = document.createElement('div');
    progressFill.className = 'mission-progress-bar';
    progressFill.style.width = `${(mission.progress / mission.target) * 100}%`;
    
    progressBar.appendChild(progressFill);
    item.appendChild(progressBar);
    
    return item;
  }
  
  /**
   * Accept a mission
   * @param {string} missionId - Mission ID
   */
  acceptMission(missionId) {
    const success = this.missionSystem.acceptMission(missionId);
    
    if (success) {
      this.showNotification('Mission accepted!', 'success');
      this.updateMissionLists();
    }
  }
  
  /**
   * Update mission progress
   * @param {object} data - Progress data
   */
  updateMissionProgress(data) {
    const { mission } = data;
    
    // Find mission item
    const missionItem = this.activeMissionsList.querySelector(`[data-mission-id="${mission.id}"]`);
    if (!missionItem) return;
    
    // Update progress text
    const progressText = missionItem.querySelector('.mission-details div:nth-child(2)');
    if (progressText) {
      progressText.textContent = `Progress: ${mission.progress}/${mission.target}`;
    }
    
    // Update progress bar
    const progressBar = missionItem.querySelector('.mission-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${(mission.progress / mission.target) * 100}%`;
    }
  }
  
  /**
   * Handle mission completed event
   * @param {object} data - Event data
   */
  onMissionCompleted(data) {
    const { mission } = data;
    
    // Show notification
    this.showNotification(`Mission completed: ${mission.title}`, 'success');
    
    // Show reward notification
    this.showNotification(`Earned ${mission.reward} points!`, 'reward');
    
    // Update mission lists
    this.updateMissionLists();
  }
  
  /**
   * Handle mission failed event
   * @param {object} data - Event data
   */
  onMissionFailed(data) {
    const { mission } = data;
    
    // Show notification
    this.showNotification(`Mission failed: ${mission.title}`, 'failure');
    
    // Update mission lists
    this.updateMissionLists();
  }
  
  /**
   * Update score display
   * @param {object} data - Score data
   */
  updateScore(data) {
    const { totalScore } = data;
    
    // Update score display
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = `Score: ${totalScore}`;
    }
    
    // Update rank display
    const rank = this.missionSystem.getPlayerRank();
    if (this.rankDisplay) {
      this.rankDisplay.textContent = `Rank: ${rank.name}`;
    }
  }
  
  /**
   * Handle player rank up event
   * @param {object} data - Event data
   */
  onPlayerRankUp(data) {
    const { newRank } = data;
    
    // Show notification
    this.showNotification(`Promoted to ${newRank.name}!`, 'reward');
    
    // Update rank display
    if (this.rankDisplay) {
      this.rankDisplay.textContent = `Rank: ${newRank.name}`;
    }
  }
  
  /**
   * Refresh missions
   */
  refreshMissions() {
    this.missionSystem.generateMissions();
    this.showNotification('Missions refreshed!', 'success');
  }
  
  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type ('success', 'failure', 'reward')
   */
  showNotification(message, type = 'success') {
    if (!this.notificationContainer) return;
    
    // Set message
    this.notificationContainer.textContent = message;
    
    // Set type
    this.notificationContainer.className = 'mission-notification';
    this.notificationContainer.classList.add(type);
    
    // Show notification
    this.notificationContainer.classList.add('show');
    
    // Hide after delay
    setTimeout(() => {
      this.notificationContainer.classList.remove('show');
    }, 3000);
  }
  
  /**
   * Get difficulty stars
   * @param {number} difficulty - Difficulty level
   * @returns {string} - Star representation
   */
  getDifficultyStars(difficulty) {
    const stars = Math.min(Math.ceil(difficulty), 5);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }
  
  /**
   * Show mission UI
   */
  show() {
    if (this.container) {
      this.container.style.display = 'flex';
      this.updateMissionLists();
      this.updateScore({ totalScore: this.missionSystem.getPlayerScore() });
    }
  }
  
  /**
   * Hide mission UI
   */
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }
  
  /**
   * Toggle mission UI visibility
   */
  toggle() {
    if (this.container.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }
  
  /**
   * Update UI
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Update time remaining for time-limited missions
    if (this.activeMissionsList) {
      const activeMissions = this.missionSystem.getActiveMissions();
      
      activeMissions.forEach(mission => {
        if (mission.timeLimit > 0) {
          const timeElement = this.activeMissionsList.querySelector(
            `[data-mission-id="${mission.id}"] .time-remaining`
          );
          
          if (timeElement) {
            timeElement.textContent = `Time remaining: ${Math.ceil(mission.timeRemaining)}s`;
          }
        }
      });
    }
  }
}