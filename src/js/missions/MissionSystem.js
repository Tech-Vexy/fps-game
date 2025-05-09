import { EventEmitter } from '../core/EventEmitter';
import { MissionTypes } from './MissionTypes';

/**
 * MissionSystem - Manages game missions, objectives, and rewards
 * This class handles mission creation, tracking, completion, and rewards
 */
export class MissionSystem {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.missions = [];
    this.activeMissions = [];
    this.completedMissions = [];
    this.events = new EventEmitter();
    this.playerScore = 0;
    this.playerRank = 'Rookie';
    
    // Mission settings
    this.maxActiveMissions = 3;
    this.missionRefreshTime = 300; // 5 minutes in seconds
    this.missionRefreshTimer = 0;
    
    // Initialize mission types
    this.missionTypes = MissionTypes;
  }
  
  /**
   * Initialize the mission system
   */
  initialize() {
    // Register event listeners
    this.registerEventListeners();
    
    // Generate initial missions
    this.generateMissions();
    
    console.log('Mission system initialized');
  }
  
  /**
   * Register event listeners for mission tracking
   */
  registerEventListeners() {
    // Listen for enemy kills
    if (this.gameEngine.events) {
      this.gameEngine.events.on('enemyKilled', (data) => this.onEnemyKilled(data));
      this.gameEngine.events.on('itemCollected', (data) => this.onItemCollected(data));
      this.gameEngine.events.on('areaReached', (data) => this.onAreaReached(data));
      this.gameEngine.events.on('bossDefeated', (data) => this.onBossDefeated(data));
      this.gameEngine.events.on('playerDamaged', (data) => this.onPlayerDamaged(data));
      this.gameEngine.events.on('weaponUsed', (data) => this.onWeaponUsed(data));
    }
  }
  
  /**
   * Generate available missions
   */
  generateMissions() {
    // Clear existing missions
    this.missions = [];
    
    // Generate missions based on player progress and available types
    const availableMissionTypes = Object.values(this.missionTypes);
    
    // Filter mission types based on player rank/progress
    const playerRank = this.getPlayerRank();
    const filteredMissionTypes = availableMissionTypes.filter(
      missionType => missionType.minRank <= playerRank.level
    );
    
    // Generate random missions
    const missionCount = 5 + Math.floor(playerRank.level / 2);
    
    for (let i = 0; i < missionCount; i++) {
      const randomIndex = Math.floor(Math.random() * filteredMissionTypes.length);
      const missionType = filteredMissionTypes[randomIndex];
      
      // Create mission with random parameters
      const mission = this.createMission(missionType);
      
      // Add to available missions
      this.missions.push(mission);
    }
    
    // Sort missions by difficulty
    this.missions.sort((a, b) => a.difficulty - b.difficulty);
    
    // Emit mission generation event
    this.events.emit('missionsGenerated', { missions: this.missions });
  }
  
  /**
   * Create a mission based on mission type
   * @param {object} missionType - Mission type definition
   * @returns {object} - Created mission
   */
  createMission(missionType) {
    // Generate a unique ID for the mission
    const missionId = `mission_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Get player rank to scale difficulty
    const playerRank = this.getPlayerRank();
    
    // Calculate difficulty scaling based on player rank
    const difficultyScale = 1 + (playerRank.level * 0.2);
    
    // Calculate base reward based on mission type and player rank
    const baseReward = missionType.baseReward * (1 + (playerRank.level * 0.1));
    
    // Generate mission parameters based on type
    let parameters = {};
    let targetCount = 0;
    
    switch (missionType.type) {
      case 'kill':
        // Scale target count based on difficulty
        targetCount = Math.floor(missionType.baseTargetCount * difficultyScale);
        
        // Determine enemy type (or 'any')
        const enemyTypes = ['GRUNT', 'SNIPER', 'TANK', 'SCOUT', 'any'];
        const enemyType = missionType.specificEnemyType || 
                         enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        parameters = {
          enemyType: enemyType,
          count: targetCount
        };
        break;
        
      case 'collect':
        // Scale target count based on difficulty
        targetCount = Math.floor(missionType.baseTargetCount * difficultyScale);
        
        // Determine item type
        const itemTypes = ['ammo', 'health', 'armor', 'weapon', 'any'];
        const itemType = missionType.specificItemType || 
                        itemTypes[Math.floor(Math.random() * itemTypes.length)];
        
        parameters = {
          itemType: itemType,
          count: targetCount
        };
        break;
        
      case 'reach':
        // Determine area
        const areas = ['checkpoint', 'extraction', 'intel', 'supply'];
        const area = missionType.specificArea || 
                    areas[Math.floor(Math.random() * areas.length)];
        
        parameters = {
          area: area,
          timeLimit: missionType.timeLimit || 0
        };
        break;
        
      case 'boss':
        // Boss missions don't need scaling
        parameters = {
          bossType: missionType.specificBossType || 'any'
        };
        break;
        
      case 'survive':
        // Scale time based on difficulty
        const surviveTime = Math.floor(missionType.baseTime * difficultyScale);
        
        parameters = {
          time: surviveTime,
          area: missionType.specificArea || 'any'
        };
        break;
        
      case 'noDamage':
        // Scale kill count based on difficulty
        const noHitKills = Math.floor(missionType.baseTargetCount * difficultyScale);
        
        parameters = {
          kills: noHitKills
        };
        break;
        
      case 'useWeapon':
        // Scale target count based on difficulty
        targetCount = Math.floor(missionType.baseTargetCount * difficultyScale);
        
        // Determine weapon type
        const weaponTypes = ['pistol', 'rifle', 'shotgun', 'any'];
        const weaponType = missionType.specificWeaponType || 
                          weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
        
        parameters = {
          weaponType: weaponType,
          count: targetCount
        };
        break;
    }
    
    // Calculate final reward based on parameters
    const reward = Math.floor(baseReward * (targetCount ? targetCount / missionType.baseTargetCount : 1));
    
    // Create mission object
    const mission = {
      id: missionId,
      title: this.generateMissionTitle(missionType, parameters),
      description: this.generateMissionDescription(missionType, parameters),
      type: missionType.type,
      parameters: parameters,
      progress: 0,
      target: parameters.count || 1,
      reward: reward,
      difficulty: missionType.difficulty * difficultyScale,
      completed: false,
      failed: false,
      timeLimit: parameters.timeLimit || 0,
      timeRemaining: parameters.timeLimit || 0,
      createdAt: Date.now()
    };
    
    return mission;
  }
  
  /**
   * Generate a mission title based on type and parameters
   * @param {object} missionType - Mission type definition
   * @param {object} parameters - Mission parameters
   * @returns {string} - Generated title
   */
  generateMissionTitle(missionType, parameters) {
    // Use title template from mission type if available
    if (missionType.titleTemplate) {
      let title = missionType.titleTemplate;
      
      // Replace placeholders with parameter values
      Object.entries(parameters).forEach(([key, value]) => {
        title = title.replace(`{${key}}`, value);
      });
      
      return title;
    }
    
    // Generate default title based on mission type
    switch (missionType.type) {
      case 'kill':
        return `Eliminate ${parameters.count} ${parameters.enemyType === 'any' ? 'enemies' : parameters.enemyType + 's'}`;
      case 'collect':
        return `Collect ${parameters.count} ${parameters.itemType === 'any' ? 'items' : parameters.itemType + 's'}`;
      case 'reach':
        return `Reach the ${parameters.area} area`;
      case 'boss':
        return `Defeat the ${parameters.bossType === 'any' ? 'boss' : parameters.bossType}`;
      case 'survive':
        return `Survive for ${parameters.time} seconds`;
      case 'noDamage':
        return `Get ${parameters.kills} kills without taking damage`;
      case 'useWeapon':
        return `Get ${parameters.count} kills with ${parameters.weaponType === 'any' ? 'any weapon' : 'the ' + parameters.weaponType}`;
      default:
        return 'Unknown mission';
    }
  }
  
  /**
   * Generate a mission description based on type and parameters
   * @param {object} missionType - Mission type definition
   * @param {object} parameters - Mission parameters
   * @returns {string} - Generated description
   */
  generateMissionDescription(missionType, parameters) {
    // Use description template from mission type if available
    if (missionType.descriptionTemplate) {
      let description = missionType.descriptionTemplate;
      
      // Replace placeholders with parameter values
      Object.entries(parameters).forEach(([key, value]) => {
        description = description.replace(`{${key}}`, value);
      });
      
      return description;
    }
    
    // Generate default description based on mission type
    switch (missionType.type) {
      case 'kill':
        return `Eliminate ${parameters.count} ${parameters.enemyType === 'any' ? 'enemies' : parameters.enemyType + 's'} to complete this mission.`;
      case 'collect':
        return `Find and collect ${parameters.count} ${parameters.itemType === 'any' ? 'items' : parameters.itemType + 's'} scattered throughout the level.`;
      case 'reach':
        return `Navigate to the ${parameters.area} area${parameters.timeLimit ? ` within ${parameters.timeLimit} seconds` : ''}.`;
      case 'boss':
        return `Defeat the ${parameters.bossType === 'any' ? 'boss' : parameters.bossType} to complete this mission.`;
      case 'survive':
        return `Stay alive for ${parameters.time} seconds${parameters.area !== 'any' ? ` in the ${parameters.area} area` : ''}.`;
      case 'noDamage':
        return `Eliminate ${parameters.kills} enemies without taking any damage.`;
      case 'useWeapon':
        return `Eliminate ${parameters.count} enemies using ${parameters.weaponType === 'any' ? 'any weapon' : 'the ' + parameters.weaponType}.`;
      default:
        return 'Complete the mission objectives.';
    }
  }
  
  /**
   * Accept a mission and add it to active missions
   * @param {string} missionId - ID of the mission to accept
   * @returns {boolean} - Whether the mission was successfully accepted
   */
  acceptMission(missionId) {
    // Check if we can accept more missions
    if (this.activeMissions.length >= this.maxActiveMissions) {
      this.events.emit('missionError', { 
        error: 'maxActiveMissions',
        message: `Cannot accept more than ${this.maxActiveMissions} missions at once`
      });
      return false;
    }
    
    // Find the mission
    const missionIndex = this.missions.findIndex(m => m.id === missionId);
    if (missionIndex === -1) {
      this.events.emit('missionError', { 
        error: 'missionNotFound',
        message: `Mission with ID ${missionId} not found`
      });
      return false;
    }
    
    // Remove from available missions and add to active missions
    const mission = this.missions.splice(missionIndex, 1)[0];
    this.activeMissions.push(mission);
    
    // Emit mission accepted event
    this.events.emit('missionAccepted', { mission });
    
    return true;
  }
  
  /**
   * Update mission progress
   * @param {string} missionId - ID of the mission to update
   * @param {number} progress - New progress value
   */
  updateMissionProgress(missionId, progress) {
    // Find the mission
    const mission = this.activeMissions.find(m => m.id === missionId);
    if (!mission) return;
    
    // Update progress
    mission.progress = Math.min(progress, mission.target);
    
    // Check if mission is completed
    if (mission.progress >= mission.target) {
      this.completeMission(missionId);
    } else {
      // Emit mission progress event
      this.events.emit('missionProgress', { 
        mission,
        progress: mission.progress,
        target: mission.target
      });
    }
  }
  
  /**
   * Complete a mission
   * @param {string} missionId - ID of the mission to complete
   */
  completeMission(missionId) {
    // Find the mission
    const missionIndex = this.activeMissions.findIndex(m => m.id === missionId);
    if (missionIndex === -1) return;
    
    // Remove from active missions
    const mission = this.activeMissions.splice(missionIndex, 1)[0];
    
    // Mark as completed
    mission.completed = true;
    mission.completedAt = Date.now();
    
    // Add to completed missions
    this.completedMissions.push(mission);
    
    // Award points
    this.awardPoints(mission.reward);
    
    // Emit mission completed event
    this.events.emit('missionCompleted', { mission });
    
    // Check for rank up
    this.checkRankUp();
  }
  
  /**
   * Fail a mission
   * @param {string} missionId - ID of the mission to fail
   */
  failMission(missionId) {
    // Find the mission
    const missionIndex = this.activeMissions.findIndex(m => m.id === missionId);
    if (missionIndex === -1) return;
    
    // Remove from active missions
    const mission = this.activeMissions.splice(missionIndex, 1)[0];
    
    // Mark as failed
    mission.failed = true;
    mission.failedAt = Date.now();
    
    // Add to completed missions (for history)
    this.completedMissions.push(mission);
    
    // Emit mission failed event
    this.events.emit('missionFailed', { mission });
  }
  
  /**
   * Award points to the player
   * @param {number} points - Points to award
   */
  awardPoints(points) {
    this.playerScore += points;
    
    // Emit points awarded event
    this.events.emit('pointsAwarded', { 
      points,
      totalScore: this.playerScore
    });
  }
  
  /**
   * Check if player should rank up
   */
  checkRankUp() {
    const currentRank = this.getPlayerRank();
    const nextRank = this.getNextRank();
    
    if (nextRank && this.playerScore >= nextRank.minScore) {
      // Rank up!
      this.playerRank = nextRank.name;
      
      // Emit rank up event
      this.events.emit('playerRankUp', { 
        previousRank: currentRank,
        newRank: nextRank
      });
    }
  }
  
  /**
   * Get player's current rank
   * @returns {object} - Player rank info
   */
  getPlayerRank() {
    const ranks = [
      { name: 'Rookie', level: 1, minScore: 0 },
      { name: 'Private', level: 2, minScore: 1000 },
      { name: 'Corporal', level: 3, minScore: 3000 },
      { name: 'Sergeant', level: 4, minScore: 6000 },
      { name: 'Lieutenant', level: 5, minScore: 10000 },
      { name: 'Captain', level: 6, minScore: 15000 },
      { name: 'Major', level: 7, minScore: 25000 },
      { name: 'Colonel', level: 8, minScore: 40000 },
      { name: 'General', level: 9, minScore: 60000 },
      { name: 'Commander', level: 10, minScore: 100000 }
    ];
    
    // Find current rank
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (this.playerScore >= ranks[i].minScore) {
        return ranks[i];
      }
    }
    
    return ranks[0]; // Default to lowest rank
  }
  
  /**
   * Get next player rank
   * @returns {object|null} - Next rank info or null if at max rank
   */
  getNextRank() {
    const currentRank = this.getPlayerRank();
    const ranks = [
      { name: 'Rookie', level: 1, minScore: 0 },
      { name: 'Private', level: 2, minScore: 1000 },
      { name: 'Corporal', level: 3, minScore: 3000 },
      { name: 'Sergeant', level: 4, minScore: 6000 },
      { name: 'Lieutenant', level: 5, minScore: 10000 },
      { name: 'Captain', level: 6, minScore: 15000 },
      { name: 'Major', level: 7, minScore: 25000 },
      { name: 'Colonel', level: 8, minScore: 40000 },
      { name: 'General', level: 9, minScore: 60000 },
      { name: 'Commander', level: 10, minScore: 100000 }
    ];
    
    // Find next rank
    for (let i = 0; i < ranks.length; i++) {
      if (ranks[i].level > currentRank.level) {
        return ranks[i];
      }
    }
    
    return null; // No next rank (at max rank)
  }
  
  /**
   * Update mission system
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Update mission refresh timer
    this.missionRefreshTimer += deltaTime;
    
    // Check if missions should be refreshed
    if (this.missionRefreshTimer >= this.missionRefreshTime) {
      this.generateMissions();
      this.missionRefreshTimer = 0;
    }
    
    // Update time-limited missions
    this.activeMissions.forEach(mission => {
      if (mission.timeLimit > 0) {
        mission.timeRemaining -= deltaTime;
        
        // Check if mission has timed out
        if (mission.timeRemaining <= 0) {
          this.failMission(mission.id);
        }
      }
    });
  }
  
  /**
   * Handle enemy killed event
   * @param {object} data - Event data
   */
  onEnemyKilled(data) {
    const { enemy, weapon } = data;
    
    // Update kill missions
    this.activeMissions.forEach(mission => {
      if (mission.type === 'kill') {
        const enemyType = enemy.type || 'unknown';
        
        // Check if this enemy type matches the mission
        if (mission.parameters.enemyType === 'any' || 
            mission.parameters.enemyType === enemyType) {
          this.updateMissionProgress(mission.id, mission.progress + 1);
        }
      }
      
      // Update weapon use missions
      if (mission.type === 'useWeapon' && weapon) {
        const weaponType = weapon.type || 'unknown';
        
        // Check if this weapon type matches the mission
        if (mission.parameters.weaponType === 'any' || 
            mission.parameters.weaponType === weaponType) {
          this.updateMissionProgress(mission.id, mission.progress + 1);
        }
      }
      
      // Update no damage missions
      if (mission.type === 'noDamage') {
        // Progress is tracked separately through onPlayerDamaged
        this.updateMissionProgress(mission.id, mission.progress + 1);
      }
    });
  }
  
  /**
   * Handle item collected event
   * @param {object} data - Event data
   */
  onItemCollected(data) {
    const { item } = data;
    
    // Update collect missions
    this.activeMissions.forEach(mission => {
      if (mission.type === 'collect') {
        const itemType = item.type || 'unknown';
        
        // Check if this item type matches the mission
        if (mission.parameters.itemType === 'any' || 
            mission.parameters.itemType === itemType) {
          this.updateMissionProgress(mission.id, mission.progress + 1);
        }
      }
    });
  }
  
  /**
   * Handle area reached event
   * @param {object} data - Event data
   */
  onAreaReached(data) {
    const { area } = data;
    
    // Update reach missions
    this.activeMissions.forEach(mission => {
      if (mission.type === 'reach') {
        // Check if this area matches the mission
        if (mission.parameters.area === area) {
          this.updateMissionProgress(mission.id, 1); // Reach missions are binary (0 or 1)
        }
      }
    });
  }
  
  /**
   * Handle boss defeated event
   * @param {object} data - Event data
   */
  onBossDefeated(data) {
    const { boss } = data;
    
    // Update boss missions
    this.activeMissions.forEach(mission => {
      if (mission.type === 'boss') {
        const bossType = boss.type || 'unknown';
        
        // Check if this boss type matches the mission
        if (mission.parameters.bossType === 'any' || 
            mission.parameters.bossType === bossType) {
          this.updateMissionProgress(mission.id, 1); // Boss missions are binary (0 or 1)
        }
      }
    });
  }
  
  /**
   * Handle player damaged event
   * @param {object} data - Event data
   */
  onPlayerDamaged(data) {
    // Fail no damage missions
    this.activeMissions.forEach(mission => {
      if (mission.type === 'noDamage' && !mission.completed) {
        this.failMission(mission.id);
      }
    });
  }
  
  /**
   * Handle weapon used event
   * @param {object} data - Event data
   */
  onWeaponUsed(data) {
    // This is handled in onEnemyKilled for weapon kill missions
  }
  
  /**
   * Get active missions
   * @returns {Array} - Active missions
   */
  getActiveMissions() {
    return this.activeMissions;
  }
  
  /**
   * Get available missions
   * @returns {Array} - Available missions
   */
  getAvailableMissions() {
    return this.missions;
  }
  
  /**
   * Get completed missions
   * @returns {Array} - Completed missions
   */
  getCompletedMissions() {
    return this.completedMissions;
  }
  
  /**
   * Get player score
   * @returns {number} - Player score
   */
  getPlayerScore() {
    return this.playerScore;
  }
  
  /**
   * Reset mission system
   */
  reset() {
    this.missions = [];
    this.activeMissions = [];
    this.completedMissions = [];
    this.playerScore = 0;
    this.playerRank = 'Rookie';
    this.missionRefreshTimer = 0;
    
    // Generate new missions
    this.generateMissions();
  }
}