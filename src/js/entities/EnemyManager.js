import * as THREE from 'three';
import { Enemy } from './Enemy';
import { EnemyTypes, getRandomEnemyType } from './EnemyTypes';

export class EnemyManager {
  constructor(aiSystem, assetManager) {
    this.aiSystem = aiSystem;
    this.assetManager = assetManager;
    this.enemies = [];
    this.gameEngine = null;
    
    // Spawn settings
    this.maxEnemies = 10;
    this.spawnRate = 3; // seconds between spawns
    this.lastSpawnTime = 0;
    this.spawnPoints = [];
    
    // Boss settings
    this.bossSpawned = false;
    this.bossSpawnThreshold = 20; // Number of enemies killed before boss spawns
  }
  
  setGameEngine(gameEngine) {
    this.gameEngine = gameEngine;
    
    // Generate spawn points around the level
    this.generateSpawnPoints();
  }
  
  generateSpawnPoints() {
    // Create spawn points in a circle around the center
    const radius = 20;
    const count = 8;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      this.spawnPoints.push(new THREE.Vector3(x, 0, z));
    }
  }
  
  update(deltaTime) {
    // Update all enemies
    for (const enemy of this.enemies) {
      // Check if enemy has update method before calling it
      if (enemy && typeof enemy.update === 'function') {
        enemy.update(deltaTime);
      } else {
        console.warn('Enemy missing update method:', enemy);
      }
    }
    
    // Check if we should spawn a new enemy
    const now = performance.now();
    if (this.enemies.length < this.maxEnemies && 
        now - this.lastSpawnTime > this.spawnRate * 1000) {
      this.spawnEnemy();
      this.lastSpawnTime = now;
      
      // Adjust spawn rate based on player metrics
      if (this.gameEngine && this.gameEngine.playerMetrics) {
        const metrics = this.gameEngine.playerMetrics;
        // Check if the method exists before calling it
        if (typeof metrics.getEnemySpawnRateMultiplier === 'function') {
          this.spawnRate = 3 / metrics.getEnemySpawnRateMultiplier();
          this.maxEnemies = Math.floor(10 * metrics.getEnemySpawnRateMultiplier());
        }
      }
    }
    
    // Check if we should spawn a boss
    if (!this.bossSpawned && 
        this.gameEngine && 
        this.gameEngine.playerMetrics && 
        this.gameEngine.playerMetrics.enemiesKilled >= this.bossSpawnThreshold) {
      this.spawnBoss();
    }
  }
  
  spawnEnemy() {
    if (!this.gameEngine) return;
    
    // Choose a random spawn point
    const spawnIndex = Math.floor(Math.random() * this.spawnPoints.length);
    const spawnPosition = this.spawnPoints[spawnIndex].clone();
    
    // Get a random enemy type
    const enemyType = getRandomEnemyType();
    
    // Calculate difficulty based on player metrics
    let difficulty = 1;
    if (this.gameEngine.playerMetrics) {
      const metrics = this.gameEngine.playerMetrics;
      
      // Adjust enemy stats based on player performance
      difficulty = metrics.getEnemyHealthMultiplier();
    }
    
    // Create the enemy with the correct type
    const enemy = new Enemy(enemyType.id);
    
    // Position the enemy at the spawn point
    enemy.mesh.position.copy(spawnPosition);
    
    // Set game engine reference
    if (typeof enemy.setGameEngine === 'function') {
      enemy.setGameEngine(this.gameEngine);
    } else {
      // If setGameEngine doesn't exist, set it directly
      enemy.gameEngine = this.gameEngine;
    }
    
    // Apply difficulty multiplier
    enemy.health *= difficulty;
    enemy.maxHealth *= difficulty;
    
    // Add to game
    this.enemies.push(enemy);
    this.gameEngine.scene.add(enemy.mesh);
    
    return enemy;
  }
  
  spawnEnemyOfType(position, enemyType, difficulty = 1) {
    if (!this.gameEngine) return;
    
    // Create the enemy with the correct type
    const enemy = new Enemy(enemyType);
    
    // Position the enemy
    enemy.mesh.position.copy(position);
    
    // Set game engine reference
    if (typeof enemy.setGameEngine === 'function') {
      enemy.setGameEngine(this.gameEngine);
    } else {
      // If setGameEngine doesn't exist, set it directly
      enemy.gameEngine = this.gameEngine;
    }
    
    // Apply difficulty multiplier
    enemy.health *= difficulty;
    enemy.maxHealth *= difficulty;
    
    // Add to game
    this.enemies.push(enemy);
    this.gameEngine.scene.add(enemy.mesh);
    
    return enemy;
  }
  
  spawnBoss() {
    if (!this.gameEngine || this.bossSpawned) return;
    
    // Choose a spawn point
    const spawnIndex = Math.floor(Math.random() * this.spawnPoints.length);
    const spawnPosition = this.spawnPoints[spawnIndex].clone();
    
    // Calculate difficulty based on player metrics
    let difficulty = 1;
    if (this.gameEngine.playerMetrics) {
      const metrics = this.gameEngine.playerMetrics;
      difficulty = metrics.getEnemyHealthMultiplier();
    }
    
    // Create the boss with the correct type
    const boss = new Enemy('BOSS');
    
    // Position the boss
    boss.mesh.position.copy(spawnPosition);
    
    // Set game engine reference
    if (typeof boss.setGameEngine === 'function') {
      boss.setGameEngine(this.gameEngine);
    } else {
      // If setGameEngine doesn't exist, set it directly
      boss.gameEngine = this.gameEngine;
    }
    
    // Apply difficulty multiplier
    boss.health *= difficulty;
    boss.maxHealth *= difficulty;
    
    // Add to game
    this.enemies.push(boss);
    this.gameEngine.scene.add(boss.mesh);
    
    // Mark boss as spawned
    this.bossSpawned = true;
    
    // Show message
    if (this.gameEngine.uiManager) {
      this.gameEngine.uiManager.showMessage('Boss has appeared!', 5000);
    }
    
    return boss;
  }
  
  removeEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index !== -1) {
      this.enemies.splice(index, 1);
    }
  }
  
  getEnemies() {
    return this.enemies;
  }
  
  /**
   * Alert nearby enemies when a player is spotted
   * @param {Enemy} spotter - The enemy that spotted the player
   * @param {Player} player - The player that was spotted
   */
  alertNearbyEnemies(spotter, player) {
    if (!spotter || !player) return;
    
    // Alert radius in units
    const alertRadius = 15.0;
    
    // Alert enemies within radius
    for (const enemy of this.enemies) {
      // Skip the spotter
      if (enemy === spotter) continue;
      
      // Skip if already aware
      if (enemy.isAware) continue;
      
      // Check if enemy is within alert radius
      if (enemy.mesh && spotter.mesh) {
        const distance = enemy.mesh.position.distanceTo(spotter.mesh.position);
        
        if (distance <= alertRadius) {
          // Alert this enemy
          if (typeof enemy.onPlayerHeard === 'function') {
            enemy.onPlayerHeard(player);
          }
        }
      }
    }
    
    // Play alert sound
    if (this.gameEngine && this.gameEngine.audioManager) {
      // this.gameEngine.audioManager.playSound('enemy_alert', 0.5);
    }
  }
  
  reset() {
    // Remove all enemies
    for (const enemy of this.enemies) {
      if (enemy.mesh && enemy.mesh.parent) {
        enemy.mesh.parent.remove(enemy.mesh);
      }
    }
    
    this.enemies = [];
    this.lastSpawnTime = 0;
    this.bossSpawned = false;
  }
}