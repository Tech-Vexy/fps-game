import * as THREE from 'three';
import { EnemyTypes } from './EnemyTypes';
import { initWasm } from '../wasm/wasm-loader';

export class Enemy {
  constructor(type = 'GRUNT') {
    // Basic properties
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 3.0;
    this.turnSpeed = 3.0;
    this.damage = 10;
    this.attackRange = 2.0;
    this.sightRange = 20.0;
    this.hearingRange = 15.0;
    this.attackCooldown = 1.0;
    this.lastAttackTime = 0;
    this.isAlive = true;
    this.isAware = false;
    
    // AI state machine
    this.state = 'idle';
    this.stateTime = 0;
    this.target = null;
    this.lastKnownTargetPosition = new THREE.Vector3();
    this.patrolPoints = [];
    this.currentPatrolIndex = 0;
    this.searchTime = 0;
    
    // Store enemy type
    this.type = type;
    
    // Create mesh
    this.createMesh();
    
    // Configure based on enemy type
    this.configureEnemyType(type);
    
    // Advanced behavior options
    this.takeCover = false;
    this.flanking = false;
    this.callReinforcements = false;
    
    // Path finding
    this.path = [];
    this.nextWaypoint = null;
    this.pathfindingTimer = 0;
    
    // Navigation mesh
    this.navMesh = null;
    
    // Initialize velocity vector for physics
    this.velocity = new THREE.Vector3();
    
    // Mission-related properties
    this.pointValue = 0;
    this.wasKilledByPlayer = false;
  }
  
  async createMesh() {
    // Create a container for the enemy
    this.mesh = new THREE.Group();
    
    // Get advanced materials if available
    let bodyMaterial, headMaterial, eyeMaterial;
    
    if (this.gameEngine && this.gameEngine.advancedMaterials) {
      // Use advanced PBR materials
      bodyMaterial = this.gameEngine.advancedMaterials.createEnemyMaterial(this.type, {
        color: 0xff0000,
        roughness: 0.7,
        metalness: 0.3
      });
      
      headMaterial = this.gameEngine.advancedMaterials.createEnemyMaterial(this.type, {
        color: 0xff0000,
        roughness: 0.6,
        metalness: 0.4
      });
      
      eyeMaterial = this.gameEngine.advancedMaterials.createGlowMaterial(0xffff00, 1.0);
    } else {
      // Fallback to standard materials with improved settings
      bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        roughness: 0.7,
        metalness: 0.3,
        envMapIntensity: 1.0,
        flatShading: false
      });
      
      headMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        roughness: 0.6,
        metalness: 0.4,
        envMapIntensity: 1.0,
        flatShading: false
      });
      
      eyeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.5
      });
    }
    
    // Create body with improved geometry
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.0, 16, 32);
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 1.0;
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.mesh.add(this.body);
    
    // Create head with improved geometry
    const headGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 1.8;
    this.head.castShadow = true;
    this.head.receiveShadow = true;
    this.mesh.add(this.head);
    
    // Add eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    
    // Left eye
    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(0.15, 1.85, 0.25);
    this.mesh.add(this.leftEye);
    
    // Right eye
    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(-0.15, 1.85, 0.25);
    this.mesh.add(this.rightEye);
    
    // Add details based on enemy type
    await this.addTypeSpecificDetails();
    
    // Add ambient occlusion
    this.addAmbientOcclusion();
    
    // Add emissive highlights
    this.addEmissiveHighlights();
    
    // Calculate point value based on enemy type
    this.calculatePointValue();
  }
  
  /**
   * Add type-specific details to the enemy mesh
   */
  async addTypeSpecificDetails() {
    // Implementation details...
  }
  
  /**
   * Add ambient occlusion to the enemy mesh
   */
  addAmbientOcclusion() {
    // Implementation details...
  }
  
  /**
   * Add emissive highlights to the enemy mesh
   */
  addEmissiveHighlights() {
    // Implementation details...
  }
  
  configureEnemyType(type) {
    // Get enemy type configuration from EnemyTypes
    let enemyType;
    
    if (typeof type === 'string') {
      // If type is a string, look it up in EnemyTypes
      enemyType = EnemyTypes[type];
      if (!enemyType) {
        console.warn(`Unknown enemy type: ${type}, defaulting to GRUNT`);
        enemyType = EnemyTypes.GRUNT;
      }
    } else if (typeof type === 'object') {
      // If type is already an object, use it directly
      enemyType = type;
    } else {
      // Default to GRUNT
      enemyType = EnemyTypes.GRUNT;
    }
    
    // Apply enemy type properties
    this.enemyType = enemyType;
    this.health = enemyType.health;
    this.maxHealth = enemyType.health;
    this.damage = enemyType.damage;
    this.speed = enemyType.speed;
    this.attackRange = enemyType.attackRange;
    this.attackCooldown = enemyType.attackRate;
    
    // Apply visual properties if mesh exists
    if (this.body && this.head) {
      // Set color
      this.body.material.color.setHex(enemyType.color);
      this.head.material.color.setHex(enemyType.color);
      
      // Set scale
      if (enemyType.scale) {
        this.mesh.scale.set(
          enemyType.scale.x || 1,
          enemyType.scale.y || 1,
          enemyType.scale.z || 1
        );
      }
    }
    
    // Configure behavior based on type
    switch (enemyType.behaviorType) {
      case 'ranged':
        this.sightRange = 30.0;
        this.hearingRange = 20.0;
        this.takeCover = true;
        break;
      case 'tank':
        this.turnSpeed = 2.0;
        this.hearingRange = 10.0;
        break;
      case 'scout':
        this.sightRange = 25.0;
        this.hearingRange = 25.0;
        this.flanking = true;
        break;
      case 'boss':
        this.sightRange = 40.0;
        this.hearingRange = 30.0;
        this.callReinforcements = true;
        break;
    }
  }
  
  update(deltaTime) {
    // Always update animations even if dead
    this.updateAnimation(deltaTime);
    
    // Don't update AI if dead
    if (!this.isAlive) return;
    
    // Don't update AI if stunned from damage
    if (this.stunTime > 0 || this.isFallingDown) return;
    
    // Update state timer
    this.stateTime += deltaTime;
    
    // Run AI state machine
    switch (this.state) {
      case 'idle':
        this.updateIdleState(deltaTime);
        break;
      case 'patrol':
        this.updatePatrolState(deltaTime);
        break;
      case 'chase':
        this.updateChaseState(deltaTime);
        break;
      case 'attack':
        this.updateAttackState(deltaTime);
        break;
      case 'search':
        this.updateSearchState(deltaTime);
        break;
      case 'takeCover':
        this.updateTakeCoverState(deltaTime);
        break;
      case 'flank':
        this.updateFlankState(deltaTime);
        break;
      default:
        this.state = 'idle';
    }
    
    // Detect player through WebAssembly
    this.detectPlayer(deltaTime);
    
    // Update path finding
    this.updatePathfinding(deltaTime);
    
    // Apply physics if we have velocity
    if (this.velocity) {
      // Apply friction to slow down movement from hit reactions
      this.velocity.x *= 0.9;
      this.velocity.z *= 0.9;
      
      // Apply velocity to position
      if (this.mesh) {
        this.mesh.position.x += this.velocity.x * deltaTime;
        this.mesh.position.z += this.velocity.z * deltaTime;
      }
      
      // Stop very small movements
      if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
    }
  }
  
  detectPlayer(deltaTime) {
    // Implementation details...
  }
  
  onPlayerSpotted(player) {
    // Implementation details...
  }
  
  alertNearbyEnemies(player) {
    // Implementation details...
  }
  
  onPlayerHeard(player) {
    // Implementation details...
  }
  
  setGameEngine(gameEngine) {
    this.gameEngine = gameEngine;
  }
  
  updateIdleState(deltaTime) {
    // Implementation details...
  }
  
  updatePatrolState(deltaTime) {
    // Implementation details...
  }
  
  updateChaseState(deltaTime) {
    // Implementation details...
  }
  
  updateAttackState(deltaTime) {
    // Implementation details...
  }
  
  updateSearchState(deltaTime) {
    // Implementation details...
  }
  
  updateTakeCoverState(deltaTime) {
    // Implementation details...
  }
  
  updateFlankState(deltaTime) {
    // Implementation details...
  }
  
  updatePathfinding(deltaTime) {
    // Implementation details...
  }
  
  updateAnimation(deltaTime) {
    // Implementation details...
  }
  
  attack() {
    // Implementation details...
  }
  
  takeDamage(amount, source) {
    this.health -= amount;
    
    // Become aware of attacker
    if (source && !this.isAware) {
      this.isAware = true;
      this.target = source;
      this.state = 'chase';
      this.lastKnownTargetPosition.copy(source.mesh.position);
    }
    
    // Check if dead
    if (this.health <= 0) {
      this.die(source);
    }
  }
  
  die(source) {
    this.isAlive = false;
    this.state = 'dead';
    
    // Store who killed this enemy
    if (source && source.isPlayer) {
      this.wasKilledByPlayer = true;
    }
    
    // Calculate death direction based on final hit
    const deathDirection = this.getHitDirection(source);
    
    // Play death animation
    this.playDeathAnimation(deathDirection);
    
    // Play death sound
    if (this.gameEngine && this.gameEngine.audioManager && 
        typeof this.gameEngine.audioManager.playSound === 'function') {
      this.gameEngine.audioManager.playSound('enemy_death', 0.8);
    }
    
    // Create death effect - larger blood splatter
    if (this.gameEngine && this.gameEngine.particleSystem) {
      const position = this.mesh.position.clone().add(new THREE.Vector3(0, 1, 0));
      const direction = deathDirection.clone().multiplyScalar(-1);
      
      this.gameEngine.createBloodSplatter(
        position,
        direction,
        50, // More particles for death
        1.5, // Larger effect
        1.0
      );
    }
    
    // Emit enemy killed event for mission tracking
    if (this.gameEngine && this.gameEngine.events) {
      this.gameEngine.emitEvent('enemyKilled', {
        enemy: this,
        source: source,
        weapon: source && source.currentWeapon ? source.weapons[source.currentWeapon] : null,
        position: this.mesh ? this.mesh.position.clone() : null,
        type: this.type,
        points: this.getPointValue()
      });
    }
    
    // Increment kill count if player killed the enemy
    if (source && source.isPlayer && this.gameEngine && this.gameEngine.playerMetrics) {
      this.gameEngine.playerMetrics.enemiesKilled++;
    }
    
    // Remove from scene after delay
    setTimeout(() => {
      if (this.mesh && this.mesh.parent) {
        this.mesh.parent.remove(this.mesh);
      }
    }, 10000); // Leave bodies longer
  }
  
  playDeathAnimation(direction) {
    // Implementation details...
  }
  
  /**
   * Calculate the point value for this enemy
   */
  calculatePointValue() {
    // Base points by enemy type
    const basePoints = {
      'GRUNT': 50,
      'SNIPER': 100,
      'TANK': 150,
      'SCOUT': 125,
      'BOSS': 500
    };
    
    // Get base points for this enemy type
    this.pointValue = basePoints[this.type] || 50;
  }
  
  /**
   * Get point value for killing this enemy
   * @returns {number} Point value
   */
  getPointValue() {
    // Start with base point value
    let points = this.pointValue;
    
    // Add bonus points based on difficulty or special conditions
    let bonusPoints = 0;
    
    // Bonus for enemies that were aware of the player (engaged in combat)
    if (this.isAware) {
      bonusPoints += points * 0.2;
    }
    
    // Bonus for enemies at full health (quick kills)
    if (this.health > this.maxHealth * 0.9) {
      bonusPoints += points * 0.3;
    }
    
    return Math.floor(points + bonusPoints);
  }
  
  /**
   * Get hit direction
   */
  getHitDirection(source) {
    // Calculate direction from source to enemy
    const direction = new THREE.Vector3();
    
    if (source && source.mesh && this.mesh) {
      direction.subVectors(this.mesh.position, source.mesh.position).normalize();
    } else {
      // Default to backward if no source
      direction.set(0, 0, 1);
    }
    
    return direction;
  }
  
  // Helper function to interpolate between angles
  lerpAngle(current, target, t) {
    const delta = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
    return current + delta * t;
  }
}