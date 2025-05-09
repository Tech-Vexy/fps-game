import * as THREE from 'three';
import { PlayerController } from '../controls/PlayerController';

/**
 * Player entity class
 */
export class Player {
  constructor() {
    // Create player mesh
    this.mesh = new THREE.Group();
    
    // Add a simple body for collision detection
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.0, 4, 8);
    const bodyMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x0000ff,
      wireframe: true,
      visible: false // Hide the player mesh
    });
    
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.75; // Center the capsule
    this.mesh.add(this.body);
    
    // Add weapon model
    this.weaponMesh = null;
    
    // Player properties
    this.isPlayer = true;
    this.collidable = true;
    this.gameEngine = null;
    this.controller = null;
    
    // Initialize velocity vector for physics
    this.velocity = new THREE.Vector3();
    
    // Player state
    this.health = 100;
    this.armor = 0;
    this.ammo = 30;
    this.maxAmmo = 30;
    this.totalAmmo = 90;
    this.isAlive = true;
    
    // Weapon state
    this.currentWeapon = 'rifle';
    this.weapons = {
      pistol: {
        name: "9mm Pistol",
        damage: 25,
        fireRate: 0.25,
        ammo: 12,
        maxAmmo: 12,
        totalAmmo: 48,
        reloadTime: 1.5,
        automatic: false,
        spread: 0.01,
        recoil: {
          vertical: 0.005,
          horizontal: 0.001,
          recovery: 0.01
        },
        sound: 'pistol_shot',
        muzzleFlash: 'small',
        ejectedShell: true,
        type: 'pistol'
      },
      rifle: {
        name: "Assault Rifle",
        damage: 20,
        fireRate: 0.09,
        ammo: 30,
        maxAmmo: 30,
        totalAmmo: 90,
        reloadTime: 2.0,
        automatic: true,
        spread: 0.02,
        recoil: {
          vertical: 0.01,
          horizontal: 0.003,
          recovery: 0.005
        },
        sound: 'rifle_shot',
        muzzleFlash: 'medium',
        ejectedShell: true,
        type: 'rifle'
      },
      shotgun: {
        name: "Tactical Shotgun",
        damage: 12, // Per pellet
        pellets: 8,
        fireRate: 0.8,
        ammo: 8,
        maxAmmo: 8,
        totalAmmo: 24,
        reloadTime: 2.5,
        automatic: false,
        spread: 0.06,
        recoil: {
          vertical: 0.025,
          horizontal: 0.005,
          recovery: 0.008
        },
        sound: 'shotgun_shot',
        muzzleFlash: 'large',
        ejectedShell: true,
        type: 'shotgun'
      }
    };
    
    // Mission tracking
    this.itemsCollected = {
      ammo: 0,
      health: 0,
      armor: 0,
      weapon: 0
    };
    this.areasReached = new Set();
    this.enemiesKilled = {
      total: 0,
      byType: {
        GRUNT: 0,
        SNIPER: 0,
        TANK: 0,
        SCOUT: 0,
        BOSS: 0
      },
      byWeapon: {
        pistol: 0,
        rifle: 0,
        shotgun: 0
      }
    };
    this.damageTaken = 0;
    this.damageDealt = 0;
    this.killStreak = 0;
    this.lastDamageTime = 0;
  }
  
  /**
   * Set the game engine reference
   * @param {GameEngine} gameEngine - The game engine
   */
  setGameEngine(gameEngine) {
    this.gameEngine = gameEngine;
    
    // Create controller once we have the game engine and camera
    if (gameEngine.camera) {
      this.controller = new PlayerController(this, gameEngine.camera);
    }
  }
  
  /**
   * Load weapon models
   * @returns {Promise} - Promise that resolves when weapons are loaded
   */
  async loadWeapons() {
    if (!this.gameEngine || !this.gameEngine.modelLoader) return;
    
    try {
      // Load weapon models
      // In a real implementation, you would load actual models
      // For now, we'll create simple placeholder meshes
      
      // Create weapon container that will be attached to the camera
      this.weaponContainer = new THREE.Group();
      
      // Create rifle
      const rifleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
      const rifleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      this.weapons.rifle.mesh = new THREE.Mesh(rifleGeometry, rifleMaterial);
      this.weapons.rifle.mesh.position.set(0.3, -0.2, -0.5);
      
      // Create pistol
      const pistolGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.25);
      const pistolMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
      this.weapons.pistol.mesh = new THREE.Mesh(pistolGeometry, pistolMaterial);
      this.weapons.pistol.mesh.position.set(0.25, -0.2, -0.4);
      
      // Create shotgun
      const shotgunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.6);
      const shotgunMaterial = new THREE.MeshStandardMaterial({ color: 0x663300 });
      this.weapons.shotgun.mesh = new THREE.Mesh(shotgunGeometry, shotgunMaterial);
      this.weapons.shotgun.mesh.position.set(0.3, -0.2, -0.5);
      
      // Add all weapons to container but hide them
      Object.values(this.weapons).forEach(weapon => {
        if (weapon.mesh) {
          weapon.mesh.visible = false;
          this.weaponContainer.add(weapon.mesh);
        }
      });
      
      // Show current weapon
      this.switchWeapon(this.currentWeapon);
      
      // Add weapon container to camera
      if (this.gameEngine.camera) {
        this.gameEngine.camera.add(this.weaponContainer);
      }
    } catch (error) {
      console.error('Failed to load weapon models:', error);
    }
  }
  
  /**
   * Switch to a different weapon
   * @param {string} weaponName - The weapon to switch to
   */
  switchWeapon(weaponName) {
    if (!this.weapons[weaponName]) return;
    
    // Hide all weapons
    Object.values(this.weapons).forEach(weapon => {
      if (weapon.mesh) weapon.mesh.visible = false;
    });
    
    // Show the selected weapon
    this.currentWeapon = weaponName;
    const weapon = this.weapons[weaponName];
    if (weapon.mesh) {
      weapon.mesh.visible = true;
    }
    
    // Update controller with weapon properties
    if (this.controller) {
      this.controller.fireRate = weapon.fireRate;
      this.controller.ammo = weapon.ammo;
      this.controller.maxAmmo = weapon.maxAmmo;
      this.controller.totalAmmo = weapon.totalAmmo;
    }
    
    // Emit weapon switched event
    if (this.gameEngine && this.gameEngine.events) {
      this.gameEngine.emitEvent('weaponSwitched', {
        player: this,
        weapon: weapon,
        weaponType: weaponName
      });
    }
  }
  
  /**
   * Update the player
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    // Update controller
    if (this.controller) {
      this.controller.update(deltaTime);
      
      // Sync health and ammo from controller
      this.health = this.controller.health;
      this.armor = this.controller.armor;
      this.ammo = this.controller.ammo;
      this.totalAmmo = this.controller.totalAmmo;
      this.isAlive = this.controller.isAlive;
    }
    
    // Handle weapon switching
    if (this.controller && this.controller.inputManager) {
      const input = this.controller.inputManager;
      
      // Number keys 1-3 for weapons
      if (input.isKeyJustPressed('Digit1')) {
        this.switchWeapon('pistol');
      } else if (input.isKeyJustPressed('Digit2')) {
        this.switchWeapon('rifle');
      } else if (input.isKeyJustPressed('Digit3')) {
        this.switchWeapon('shotgun');
      }
      
      // Mouse wheel for weapon switching
      const wheelDelta = input.getMouseWheelDelta();
      if (wheelDelta !== 0) {
        const weapons = Object.keys(this.weapons);
        const currentIndex = weapons.indexOf(this.currentWeapon);
        let newIndex = currentIndex + wheelDelta;
        
        // Wrap around
        if (newIndex < 0) newIndex = weapons.length - 1;
        if (newIndex >= weapons.length) newIndex = 0;
        
        this.switchWeapon(weapons[newIndex]);
      }
    }
    
    // Update kill streak timer
    if (this.killStreak > 0 && Date.now() - this.lastKillTime > 5000) {
      // Reset kill streak after 5 seconds of no kills
      this.killStreak = 0;
    }
  }
  
  /**
   * Apply damage to the player
   * @param {number} amount - Amount of damage to apply
   * @param {THREE.Vector3} direction - Direction the damage came from
   */
  takeDamage(amount, direction) {
    // Track damage taken for missions
    this.damageTaken += amount;
    this.lastDamageTime = Date.now();
    
    // Emit player damaged event
    if (this.gameEngine && this.gameEngine.events) {
      this.gameEngine.emitEvent('playerDamaged', {
        player: this,
        amount: amount,
        direction: direction,
        health: this.health,
        armor: this.armor
      });
    }
    
    if (this.controller) {
      this.controller.takeDamage(amount, direction);
    }
  }
  
  /**
   * Record an enemy kill
   * @param {Enemy} enemy - The enemy that was killed
   * @param {object} weapon - The weapon used
   */
  recordEnemyKill(enemy, weapon) {
    // Increment total kills
    this.enemiesKilled.total++;
    
    // Increment kills by enemy type
    if (enemy && enemy.type) {
      this.enemiesKilled.byType[enemy.type] = (this.enemiesKilled.byType[enemy.type] || 0) + 1;
    }
    
    // Increment kills by weapon type
    if (weapon && weapon.type) {
      this.enemiesKilled.byWeapon[weapon.type] = (this.enemiesKilled.byWeapon[weapon.type] || 0) + 1;
    }
    
    // Update kill streak
    this.killStreak++;
    this.lastKillTime = Date.now();
    
    // Emit kill streak event if milestone reached
    if (this.killStreak === 3 || this.killStreak === 5 || this.killStreak === 10) {
      if (this.gameEngine && this.gameEngine.events) {
        this.gameEngine.emitEvent('killStreak', {
          player: this,
          streak: this.killStreak
        });
      }
    }
  }
  
  /**
   * Record an item collection
   * @param {object} item - The item that was collected
   */
  recordItemCollection(item) {
    if (!item || !item.type) return;
    
    // Increment item collection count
    this.itemsCollected[item.type] = (this.itemsCollected[item.type] || 0) + 1;
    
    // Emit item collected event
    if (this.gameEngine && this.gameEngine.events) {
      this.gameEngine.emitEvent('itemCollected', {
        player: this,
        item: item
      });
    }
  }
  
  /**
   * Record reaching an area
   * @param {string} area - The area that was reached
   */
  recordAreaReached(area) {
    if (!area) return;
    
    // Add to set of reached areas
    this.areasReached.add(area);
    
    // Emit area reached event
    if (this.gameEngine && this.gameEngine.events) {
      this.gameEngine.emitEvent('areaReached', {
        player: this,
        area: area
      });
    }
  }
  
  /**
   * Reset the player
   */
  reset() {
    // Reset position
    if (this.mesh) {
      this.mesh.position.set(0, 0, 0);
      this.mesh.rotation.set(0, 0, 0);
    }
    
    // Reset controller
    if (this.controller) {
      this.controller.reset();
    }
    
    // Reset weapon state
    this.switchWeapon('rifle');
    
    // Reset player state
    this.health = 100;
    this.armor = 0;
    this.isAlive = true;
    
    // Reset mission tracking
    this.itemsCollected = {
      ammo: 0,
      health: 0,
      armor: 0,
      weapon: 0
    };
    this.areasReached = new Set();
    this.enemiesKilled = {
      total: 0,
      byType: {
        GRUNT: 0,
        SNIPER: 0,
        TANK: 0,
        SCOUT: 0,
        BOSS: 0
      },
      byWeapon: {
        pistol: 0,
        rifle: 0,
        shotgun: 0
      }
    };
    this.damageTaken = 0;
    this.damageDealt = 0;
    this.killStreak = 0;
    this.lastDamageTime = 0;
    this.lastKillTime = 0;
  }
}