import * as THREE from 'three';
import { InputManager } from './InputManager';

/**
 * Controls player movement and actions
 */
export class PlayerController {
  constructor(player, camera) {
    this.player = player;
    this.camera = camera;
    this.inputManager = new InputManager();
    
    // Movement settings
    this.moveSpeed = 5.0;
    this.sprintMultiplier = 1.6;
    this.jumpForce = 7.0;
    this.gravity = 20.0;
    
    // Look settings
    this.lookSensitivity = 0.2;
    this.lookSensitivityGamepad = 2.0;
    this.maxLookAngle = 85; // Maximum look up/down angle in degrees
    
    // Physics state
    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.isCrouching = false;
    this.isSprinting = false;
    
    // Camera state
    this.cameraRotation = { x: 0, y: 0 }; // x is horizontal, y is vertical
    this.cameraHeight = 1.7; // Eye height when standing
    this.crouchHeight = 0.9; // Eye height when crouching
    this.currentHeight = this.cameraHeight;
    this.bobAmount = 0.05;
    this.bobSpeed = 10;
    this.bobTime = 0;
    
    // Weapon state
    this.isFiring = false;
    this.isReloading = false;
    this.lastFireTime = 0;
    this.fireRate = 0.1; // Time between shots in seconds
    
    // Game state
    this.isAlive = true;
    this.health = 100;
    this.armor = 0;
    this.ammo = 30;
    this.maxAmmo = 30;
    this.totalAmmo = 90;
    
    // Movement physics parameters
    this.movementParams = {
      walkSpeed: 5.0,
      runSpeed: 8.0,
      crouchSpeed: 2.5,
      jumpForce: 8.0,
      gravity: 20.0,
      groundFriction: 10.0,
      airFriction: 0.2,
      maxStepHeight: 0.5,
      footstepDistance: 2.0, // Distance between footstep sounds
      distanceTraveled: 0,
      isRunning: false,
      isCrouching: false,
      inAir: false,
      lastFootstep: 0
    };
    
    // Initialize
    this._setupPointerLock();
  }
  
  /**
   * Set up pointer lock for mouse control
   * @private
   */
  _setupPointerLock() {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    // Request pointer lock when canvas is clicked
    canvas.addEventListener('click', () => {
      if (!this.inputManager.isPointerLocked) {
        this.inputManager.requestPointerLock(canvas);
      }
    });
  }
  
  /**
   * Update player controller
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    if (!this.isAlive) return;
    
    // Initialize velocity if it doesn't exist
    if (!this.player.velocity) {
      this.player.velocity = new THREE.Vector3();
    }
    
    this._handleMovement(deltaTime);
    this._handleLooking(deltaTime);
    this._handleActions(deltaTime);
    this._updateCamera(deltaTime);
    
    // Update input manager last
    this.inputManager.update();
  }
  
  /**
   * Handle player movement
   * @param {number} deltaTime - Time since last frame in seconds
   * @private
   */
  _handleMovement(deltaTime) {
    // Get movement input
    const moveForward = this.inputManager.isKeyPressed('KeyW') || this.inputManager.isKeyPressed('ArrowUp');
    const moveBackward = this.inputManager.isKeyPressed('KeyS') || this.inputManager.isKeyPressed('ArrowDown');
    const moveLeft = this.inputManager.isKeyPressed('KeyA') || this.inputManager.isKeyPressed('ArrowLeft');
    const moveRight = this.inputManager.isKeyPressed('KeyD') || this.inputManager.isKeyPressed('ArrowRight');
    
    // Get run/crouch states
    this.movementParams.isRunning = this.inputManager.isKeyPressed('ShiftLeft');
    this.movementParams.isCrouching = this.inputManager.isKeyPressed('ControlLeft');
    
    // Calculate movement speed based on state
    let speed = this.movementParams.walkSpeed;
    if (this.movementParams.isRunning) speed = this.movementParams.runSpeed;
    if (this.movementParams.isCrouching) speed = this.movementParams.crouchSpeed;
    
    // Calculate movement direction
    const moveDirection = new THREE.Vector3(0, 0, 0);
    if (moveForward) moveDirection.z = -1;
    if (moveBackward) moveDirection.z = 1;
    if (moveLeft) moveDirection.x = -1;
    if (moveRight) moveDirection.x = 1;
    
    // Normalize for consistent speed in diagonals
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
    }
    
    // Apply movement to velocity with smooth acceleration
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    
    const cameraRight = new THREE.Vector3(cameraDirection.z, 0, -cameraDirection.x);
    
    // Calculate movement in world space
    const moveX = moveDirection.x * cameraRight.x + moveDirection.z * cameraDirection.x;
    const moveZ = moveDirection.x * cameraRight.z + moveDirection.z * cameraDirection.z;
    
    // Apply friction
    const friction = this.movementParams.inAir ? 
      this.movementParams.airFriction : this.movementParams.groundFriction;
    
    this.player.velocity.x -= this.player.velocity.x * friction * deltaTime;
    this.player.velocity.z -= this.player.velocity.z * friction * deltaTime;
    
    // Apply movement force
    const acceleration = this.movementParams.inAir ? 1.0 : 5.0;
    this.player.velocity.x += moveX * speed * acceleration * deltaTime;
    this.player.velocity.z += moveZ * speed * acceleration * deltaTime;
    
    // Apply movement
    this.player.mesh.position.x += this.player.velocity.x * deltaTime;
    this.player.mesh.position.z += this.player.velocity.z * deltaTime;
    
    // Track distance for footsteps
    if (moveDirection.length() > 0 && !this.movementParams.inAir) {
      const distanceMoved = Math.sqrt(
        this.player.velocity.x * this.player.velocity.x + 
        this.player.velocity.z * this.player.velocity.z
      ) * deltaTime;
      
      this.movementParams.distanceTraveled += distanceMoved;
      
      // Play footstep sounds
      if (this.movementParams.distanceTraveled >= this.movementParams.footstepDistance) {
        this.movementParams.distanceTraveled = 0;
        
        // Call footstep sound with error handling
        try {
          if (typeof this._playFootstepSound === 'function') {
            this._playFootstepSound();
          }
        } catch (error) {
          console.warn('Error playing footstep sound:', error);
        }
      }
    }
  }
  
  _playFootstepSound() {
    const material = this._detectGroundMaterial();
    const runMultiplier = this.movementParams.isRunning ? 1.2 : 1.0;
    const crouchMultiplier = this.movementParams.isCrouching ? 0.5 : 1.0;
    const volume = 0.3 * runMultiplier * crouchMultiplier;
    
    // Play appropriate footstep sound based on ground material
    const soundId = `footstep_${material}`;
    
    // Check if all required objects exist before playing sound
    if (this.player && 
        this.player.gameEngine && 
        this.player.gameEngine.audioManager && 
        typeof this.player.gameEngine.audioManager.playSound === 'function') {
      this.player.gameEngine.audioManager.playSound(soundId, volume);
    }
  }
  
  _detectGroundMaterial() {
    // Cast ray down to detect ground material
    // For simplicity, default to 'concrete' if not implemented
    return 'concrete';
  }
  
  /**
   * Handle player looking
   * @param {number} deltaTime - Time since last frame in seconds
   * @private
   */
  _handleLooking(deltaTime) {
    // Get mouse delta
    const mouseDelta = this.inputManager.getMouseDelta();
    
    // Get gamepad right stick input
    const gamepadLookX = this.inputManager.getGamepadAxis(0, 2);
    const gamepadLookY = this.inputManager.getGamepadAxis(0, 3);
    
    // Apply mouse movement
    if (this.inputManager.isPointerLocked) {
      this.cameraRotation.x -= mouseDelta.x * this.lookSensitivity * 0.001;
      this.cameraRotation.y -= mouseDelta.y * this.lookSensitivity * 0.001;
    }
    
    // Apply gamepad movement
    this.cameraRotation.x += gamepadLookX * this.lookSensitivityGamepad * deltaTime;
    this.cameraRotation.y += gamepadLookY * this.lookSensitivityGamepad * deltaTime;
    
    // Clamp vertical rotation to prevent flipping
    const maxAngle = this.maxLookAngle * Math.PI / 180;
    this.cameraRotation.y = Math.max(-maxAngle, Math.min(maxAngle, this.cameraRotation.y));
    
    // Wrap horizontal rotation
    if (this.cameraRotation.x > Math.PI * 2) {
      this.cameraRotation.x -= Math.PI * 2;
    } else if (this.cameraRotation.x < 0) {
      this.cameraRotation.x += Math.PI * 2;
    }
  }
  
  /**
   * Handle player actions (shooting, reloading, etc.)
   * @param {number} deltaTime - Time since last frame in seconds
   * @private
   */
  _handleActions(deltaTime) {
    // Check for fire input
    const firePressed = this.inputManager.isMouseButtonPressed('left') || 
                        this.inputManager.isGamepadButtonPressed(0, 7) || // Right trigger
                        this.inputManager.isVirtualButtonPressed('fire');
    
    // Check for reload input
    const reloadPressed = this.inputManager.isKeyJustPressed('KeyR') || 
                          this.inputManager.isGamepadButtonJustPressed(0, 2) || // X button
                          this.inputManager.isVirtualButtonPressed('action');
    
    // Check for magazine check input (hold R)
    const magazineCheckPressed = this.inputManager.isKeyPressed('KeyR') && 
                               this.inputManager.getKeyHoldTime('KeyR') > 0.5;
    
    // Get current weapon data
    const currentWeapon = this.player.weapons[this.player.currentWeapon];
    const isAutomatic = currentWeapon ? currentWeapon.automatic : false;
    
    // Handle firing
    const currentTime = performance.now() * 0.001; // Convert to seconds
    if (firePressed && !this.isReloading && this.ammo > 0 && currentTime - this.lastFireTime > this.fireRate) {
      // For automatic weapons, just need to hold the button
      // For semi-auto, need to press each time
      if (isAutomatic || this.inputManager.isMouseButtonJustPressed('left') || 
          this.inputManager.isGamepadButtonJustPressed(0, 7)) {
        this._fire();
        this.lastFireTime = currentTime;
      }
    } else if (firePressed && !this.isReloading && this.ammo <= 0) {
      // Click when empty - play empty sound
      if (this.inputManager.isMouseButtonJustPressed('left') || 
          this.inputManager.isGamepadButtonJustPressed(0, 7)) {
        // Play empty click sound
        if (this.player.gameEngine && this.player.gameEngine.audioManager) {
          this.player.gameEngine.audioManager.playSound('empty_click', 0.5);
        }
        
        // Auto-reload when empty if we have ammo
        if (this.totalAmmo > 0) {
          this._reload();
        }
      }
    }
    
    // Handle reloading
    if (reloadPressed && !this.isReloading && this.ammo < this.maxAmmo && this.totalAmmo > 0) {
      this._reload();
    }
    
    // Handle magazine check
    if (magazineCheckPressed && !this.isReloading && !this.isCheckingMagazine) {
      this._checkMagazine();
    }
    
    // Handle weapon switching with number keys
    for (let i = 1; i <= 9; i++) {
      if (this.inputManager.isKeyJustPressed(`Digit${i}`)) {
        const weaponKeys = Object.keys(this.player.weapons);
        if (i <= weaponKeys.length) {
          // Cancel reload if in progress
          if (this.isReloading) {
            this.cancelReload();
          }
          
          this.player.switchWeapon(weaponKeys[i-1]);
        }
      }
    }
    
    // Update reload animation
    if (this.isReloading) {
      this._updateReloadAnimation(deltaTime);
    }
  }
  
  /**
   * Check the current magazine
   * @private
   */
  _checkMagazine() {
    if (this.isReloading) return;
    
    this.isCheckingMagazine = true;
    
    // Start magazine check animation
    this._startMagazineCheckAnimation();
    
    // Play sound
    if (this.player.gameEngine && this.player.gameEngine.audioManager) {
      if (typeof this.player.gameEngine.audioManager.playSound === 'function') {
        this.player.gameEngine.audioManager.playSound('magazine_check', 0.5);
      }
    }
    
    // Show ammo count UI
    if (this.player.gameEngine && this.player.gameEngine.uiManager) {
      if (typeof this.player.gameEngine.uiManager.showAmmoCount === 'function') {
        this.player.gameEngine.uiManager.showAmmoCount(this.ammo, this.maxAmmo, this.totalAmmo);
      } else {
        // Fallback: log ammo info to console
        console.log(`Magazine check: ${this.ammo}/${this.maxAmmo} (${this.totalAmmo})`);
      }
    }
    
    // End check after a delay
    setTimeout(() => {
      this._endMagazineCheckAnimation();
      this.isCheckingMagazine = false;
    }, 1000);
  }
  
  /**
   * Start magazine check animation
   * @private
   */
  _startMagazineCheckAnimation() {
    if (!this.player.weaponContainer) return;
    
    const weapon = this.player.weapons[this.player.currentWeapon];
    if (!weapon || !weapon.mesh) return;
    
    // Store original position for restoration
    this._originalWeaponPosition = weapon.mesh.position.clone();
    this._originalWeaponRotation = weapon.mesh.rotation.clone();
    
    // Animate weapon tilting to check magazine
    weapon.mesh.rotation.z += 0.3;
    weapon.mesh.rotation.y += 0.1;
    weapon.mesh.position.y += 0.05;
  }
  
  /**
   * End magazine check animation
   * @private
   */
  _endMagazineCheckAnimation() {
    if (!this.player.weaponContainer) return;
    
    const weapon = this.player.weapons[this.player.currentWeapon];
    if (!weapon || !weapon.mesh) return;
    
    // Reset weapon position
    if (this._originalWeaponPosition) {
      weapon.mesh.position.copy(this._originalWeaponPosition);
    }
    
    if (this._originalWeaponRotation) {
      weapon.mesh.rotation.copy(this._originalWeaponRotation);
    }
  }
  
  /**
   * Update reload animation
   * @param {number} deltaTime - Time since last frame in seconds
   * @private
   */
  _updateReloadAnimation(deltaTime) {
    // This is called every frame during reload
    // You can add additional animation logic here
  }
  
  /**
   * Update camera position and rotation
   * @param {number} deltaTime - Time since last frame in seconds
   * @private
   */
  _updateCamera(deltaTime) {
    if (!this.camera || !this.player.mesh) return;
    
    // Position camera at player's eye level
    this.camera.position.x = this.player.mesh.position.x;
    this.camera.position.z = this.player.mesh.position.z;
    
    // Apply head bobbing when moving
    let bobOffset = 0;
    if (this.isGrounded && (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1)) {
      // Increase bob time based on movement speed
      const speed = new THREE.Vector2(this.velocity.x, this.velocity.z).length();
      this.bobTime += deltaTime * this.bobSpeed * (speed / this.moveSpeed);
      
      // Calculate bob offset
      bobOffset = Math.sin(this.bobTime) * this.bobAmount * (this.isCrouching ? 0.5 : 1.0);
    } else {
      // Reset bob time when not moving
      this.bobTime = 0;
    }
    
    // Set camera height with bob
    this.camera.position.y = this.player.mesh.position.y + this.currentHeight + bobOffset;
    
    // Apply camera rotation
    this.camera.rotation.order = 'YXZ'; // This order prevents gimbal lock
    this.camera.rotation.x = this.cameraRotation.y; // Vertical rotation (pitch)
    this.camera.rotation.y = this.cameraRotation.x; // Horizontal rotation (yaw)
    
    // Update player mesh rotation to match camera
    this.player.mesh.rotation.y = this.cameraRotation.x;
  }
  
  /**
   * Fire the player's weapon
   * @private
   */
  _fire() {
    if (this.ammo <= 0) return;
    
    // Get current weapon data
    const currentWeapon = this.player.weapons[this.player.currentWeapon];
    
    // Decrease ammo
    this.ammo--;
    
    // Update UI
    if (this.player.gameEngine && this.player.gameEngine.uiManager) {
      // Check if updateAmmoDisplay exists before calling it
      if (typeof this.player.gameEngine.uiManager.updateAmmoDisplay === 'function') {
        this.player.gameEngine.uiManager.updateAmmoDisplay(this.ammo, this.totalAmmo);
      } else {
        // Fallback: log ammo info to console
        console.log(`Ammo: ${this.ammo} / ${this.totalAmmo}`);
      }
    }
    
    // Get the direction the camera is facing
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    
    // Apply weapon spread
    if (currentWeapon && currentWeapon.spread) {
      const spread = currentWeapon.spread;
      direction.x += (Math.random() - 0.5) * spread;
      direction.y += (Math.random() - 0.5) * spread;
      direction.z += (Math.random() - 0.5) * spread * 0.1;
      direction.normalize();
    }
    
    // Handle shotgun pellets
    const pellets = currentWeapon && currentWeapon.pellets ? currentWeapon.pellets : 1;
    
    for (let i = 0; i < pellets; i++) {
      // For shotguns, create multiple projectiles with spread
      let pelletDirection = direction.clone();
      
      if (pellets > 1) {
        const pelletSpread = currentWeapon.spread * 2;
        pelletDirection.x += (Math.random() - 0.5) * pelletSpread;
        pelletDirection.y += (Math.random() - 0.5) * pelletSpread;
        pelletDirection.z += (Math.random() - 0.5) * pelletSpread * 0.1;
        pelletDirection.normalize();
      }
      
      // Create a ray from the camera
      const raycaster = new THREE.Raycaster(this.camera.position, pelletDirection);
      
      // Check for hits
      if (this.player.gameEngine && this.player.gameEngine.physicsSystem) {
        const hit = this.player.gameEngine.physicsSystem.rayCast(
          this.camera.position,
          pelletDirection,
          100 // Max distance
        );
        
        if (hit) {
          // Create impact effect
          if (this.player.gameEngine.particleSystem) {
            // Different impact effects based on surface
            let impactColor = 0xffff00;
            let impactSize = 20;
            
            // Check hit material type
            if (hit.object.material) {
              if (hit.object.material.name.includes('metal')) {
                impactColor = 0xffcc00;
                impactSize = 15;
                // Play metal impact sound
                if (this.player.gameEngine.audioManager) {
                  this.player.gameEngine.audioManager.playSound('impact_metal', 0.4);
                }
              } else if (hit.object.material.name.includes('wood')) {
                impactColor = 0x996633;
                impactSize = 25;
                // Play wood impact sound
                if (this.player.gameEngine.audioManager) {
                  this.player.gameEngine.audioManager.playSound('impact_wood', 0.4);
                }
              } else if (hit.object.material.name.includes('concrete')) {
                impactColor = 0xcccccc;
                impactSize = 30;
                // Play concrete impact sound
                if (this.player.gameEngine.audioManager) {
                  this.player.gameEngine.audioManager.playSound('impact_concrete', 0.4);
                }
              }
            }
            
            this.player.gameEngine.particleSystem.createExplosion(
              hit.point,
              impactColor,
              impactSize,
              0.1,
              0.5
            );
          }
          
          // Apply damage if hit an enemy
          if (hit.object.parent && hit.object.parent.entity && hit.object.parent.entity.takeDamage) {
            // Get damage from weapon config
            const baseDamage = currentWeapon ? currentWeapon.damage : 25;
            
            // Calculate damage falloff based on distance
            const distance = hit.distance;
            const maxRange = 100;
            const damageMultiplier = Math.max(0.2, 1 - (distance / maxRange));
            
            // Apply damage
            const damage = baseDamage * damageMultiplier;
            hit.object.parent.entity.takeDamage(damage, this.camera.position);
            
            // Play hit marker sound for player feedback
            if (this.player.gameEngine.audioManager) {
              this.player.gameEngine.audioManager.playSound('hit_marker', 0.3);
            }
            
            // Show hit marker in UI
            if (this.player.gameEngine.uiManager) {
              // Check if showHitMarker exists before calling it
              if (typeof this.player.gameEngine.uiManager.showHitMarker === 'function') {
                this.player.gameEngine.uiManager.showHitMarker();
              }
            }
          }
        }
      }
    }
    
    // Create muzzle flash
    if (this.player.gameEngine && this.player.gameEngine.particleSystem) {
      // Calculate muzzle position based on current weapon
      const muzzleOffset = new THREE.Vector3(0.3, -0.2, -0.5);
      
      // Adjust based on weapon type
      if (currentWeapon) {
        if (this.player.currentWeapon === 'pistol') {
          muzzleOffset.set(0.25, -0.15, -0.4);
        } else if (this.player.currentWeapon === 'shotgun') {
          muzzleOffset.set(0.3, -0.2, -0.6);
        }
      }
      
      muzzleOffset.applyQuaternion(this.camera.quaternion);
      const muzzlePosition = this.camera.position.clone().add(muzzleOffset);
      
      // Get muzzle flash size from weapon
      const muzzleSize = currentWeapon && currentWeapon.muzzleFlash ? 
        (currentWeapon.muzzleFlash === 'large' ? 1.5 : 
         currentWeapon.muzzleFlash === 'medium' ? 1.0 : 0.7) : 1.0;
      
      this.player.gameEngine.createMuzzleFlash(muzzlePosition, direction, muzzleSize);
    }
    
    // Eject shell casing
    if (currentWeapon && currentWeapon.ejectedShell && typeof this._ejectShellCasing === 'function') {
      try {
        this._ejectShellCasing();
      } catch (error) {
        console.warn('Error ejecting shell casing:', error);
      }
    }
    
    // Play sound
    if (this.player.gameEngine && this.player.gameEngine.audioManager) {
      const soundId = currentWeapon ? currentWeapon.sound : 'gunshot';
      this.player.gameEngine.audioManager.playSound(soundId, 0.7);
    }
    
    // Apply recoil
    if (currentWeapon && currentWeapon.recoil) {
      // Get recoil values from weapon config
      const verticalRecoil = currentWeapon.recoil.vertical || 0.01;
      const horizontalRecoil = currentWeapon.recoil.horizontal || 0.005;
      
      // Apply recoil
      this.cameraRotation.y += verticalRecoil; // Vertical recoil
      this.cameraRotation.x += (Math.random() - 0.5) * horizontalRecoil * 2; // Horizontal recoil
      
      // Apply weapon kick animation
      this._applyWeaponKick();
    } else {
      // Default recoil - adjusted by screen shake intensity setting
      const screenShakeMultiplier = this.player.gameEngine && this.player.gameEngine.visualSettings ? 
        this.player.gameEngine.visualSettings.screenShakeIntensity : 1.0;
      
      this.cameraRotation.y += 0.01 * screenShakeMultiplier; // Vertical recoil
      this.cameraRotation.x += (Math.random() - 0.5) * 0.005 * screenShakeMultiplier; // Horizontal recoil
    }
    
    // Check if magazine is empty
    if (this.ammo === 0) {
      // Play empty magazine sound
      if (this.player.gameEngine && this.player.gameEngine.audioManager) {
        this.player.gameEngine.audioManager.playSound('magazine_empty', 0.5);
      }
      
      // Show empty magazine indicator
      if (this.player.gameEngine && this.player.gameEngine.uiManager) {
        // Check if showEmptyMagazine exists before calling it
        if (typeof this.player.gameEngine.uiManager.showEmptyMagazine === 'function') {
          this.player.gameEngine.uiManager.showEmptyMagazine();
        } else {
          // Fallback: log to console
          console.log('Magazine empty!');
        }
      }
      
      // Lock slide back on pistol
      if (this.player.currentWeapon === 'pistol' && this.player.weapons.pistol.mesh) {
        this._lockSlideBack();
      }
    }
  }
  
  /**
   * Apply weapon kick animation when firing
   * @private
   */
  _applyWeaponKick() {
    if (!this.player.weaponContainer) return;
    
    const weapon = this.player.weapons[this.player.currentWeapon];
    if (!weapon || !weapon.mesh) return;
    
    // Store original position if not already stored
    if (!this._originalWeaponPosition) {
      this._originalWeaponPosition = weapon.mesh.position.clone();
    }
    
    if (!this._originalWeaponRotation) {
      this._originalWeaponRotation = weapon.mesh.rotation.clone();
    }
    
    // Apply kick
    weapon.mesh.position.z += 0.05;
    weapon.mesh.rotation.x -= 0.05;
    
    // Return to original position
    setTimeout(() => {
      if (weapon.mesh) {
        // Smooth return
        const returnToPosition = () => {
          weapon.mesh.position.z -= 0.01;
          weapon.mesh.rotation.x += 0.01;
          
          if (weapon.mesh.position.z <= this._originalWeaponPosition.z) {
            weapon.mesh.position.copy(this._originalWeaponPosition);
            weapon.mesh.rotation.copy(this._originalWeaponRotation);
          } else {
            requestAnimationFrame(returnToPosition);
          }
        };
        
        returnToPosition();
      }
    }, 50);
  }
  
  /**
   * Eject a shell casing
   * @private
   */
  _ejectShellCasing() {
    // Safety check for required objects
    if (!this.player || !this.player.gameEngine || !this.player.gameEngine.scene || !this.camera) return;
    
    // Create shell casing mesh
    const shellGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.06, 8);
    const shellMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xccaa00,
      metalness: 0.8,
      roughness: 0.2
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    
    // Position at weapon ejection port - with safety checks
    let weaponPos;
    
    // Check if weapon and mesh exist
    if (this.player.weapons && 
        this.player.currentWeapon && 
        this.player.weapons[this.player.currentWeapon] && 
        this.player.weapons[this.player.currentWeapon].mesh) {
      // Get world position from weapon mesh
      weaponPos = this.player.weapons[this.player.currentWeapon].mesh.getWorldPosition(new THREE.Vector3());
    } else {
      // Fallback: use camera position with offset
      weaponPos = new THREE.Vector3();
      this.camera.getWorldPosition(weaponPos);
      
      // Add offset to position shell at approximate weapon location
      const offset = new THREE.Vector3(0.3, -0.2, -0.5);
      offset.applyQuaternion(this.camera.quaternion);
      weaponPos.add(offset);
    }
    
    shell.position.copy(weaponPos);
    
    // Adjust based on weapon type
    if (this.player.currentWeapon === 'pistol') {
      shell.position.y += 0.05;
      shell.position.x += 0.05;
    } else if (this.player.currentWeapon === 'shotgun') {
      shell.position.y += 0.05;
      shell.scale.set(1.5, 1.5, 1.5); // Larger shell
      shellMaterial.color.setHex(0xff0000); // Red shotgun shell
    }
    
    // Add to scene
    this.player.gameEngine.scene.add(shell);
    
    // Add physics - eject to the right and slightly up
    const rightVector = new THREE.Vector3(1, 0, 0);
    rightVector.applyQuaternion(this.camera.quaternion);
    
    const velocity = new THREE.Vector3(
      rightVector.x * 3 + (Math.random() - 0.5),
      1 + Math.random(),
      rightVector.z * 3 + (Math.random() - 0.5)
    );
    
    const rotation = new THREE.Vector3(
      Math.random() * 20,
      Math.random() * 20,
      Math.random() * 20
    );
    
    // Play shell ejection sound
    if (this.player.gameEngine.audioManager) {
      const soundId = this.player.currentWeapon === 'shotgun' ? 
        'shell_eject_shotgun' : 'shell_eject';
      this.player.gameEngine.audioManager.playSound(soundId, 0.2);
    }
    
    // Animate falling shell
    const animateShell = () => {
      // Apply gravity
      velocity.y -= 9.8 * 0.016; // gravity * deltaTime
      
      // Move shell
      shell.position.x += velocity.x * 0.016;
      shell.position.y += velocity.y * 0.016;
      shell.position.z += velocity.z * 0.016;
      
      // Rotate shell
      shell.rotation.x += rotation.x * 0.016;
      shell.rotation.y += rotation.y * 0.016;
      shell.rotation.z += rotation.z * 0.016;
      
      // Check if shell hit the ground
      if (shell.position.y < 0) {
        shell.position.y = 0;
        velocity.y = -velocity.y * 0.3; // Bounce
        velocity.x *= 0.8; // Friction
        velocity.z *= 0.8; // Friction
        
        // Play shell hit sound
        if (this.player.gameEngine.audioManager) {
          const soundId = this.player.currentWeapon === 'shotgun' ? 
            'shell_hit_shotgun' : 'shell_hit';
          this.player.gameEngine.audioManager.playSound(soundId, 0.1);
        }
        
        // Stop if velocity is very low
        if (Math.abs(velocity.y) < 0.5) {
          velocity.set(0, 0, 0);
          rotation.set(0, 0, 0);
          
          // Remove shell after a delay
          setTimeout(() => {
            this.player.gameEngine.scene.remove(shell);
          }, 5000);
          
          return;
        }
      }
      
      // Continue animation
      requestAnimationFrame(animateShell);
    };
    
    // Start animation
    animateShell();
  }
  
  /**
   * Lock slide back on pistol when empty
   * @private
   */
  _lockSlideBack() {
    if (this.player.currentWeapon !== 'pistol') return;
    
    const pistol = this.player.weapons.pistol;
    if (!pistol || !pistol.mesh) return;
    
    // Store original position if not already stored
    if (!this._originalPistolPosition) {
      this._originalPistolPosition = pistol.mesh.position.clone();
    }
    
    // Move slide back
    pistol.mesh.position.z += 0.03;
    
    // Reset slide when reloading
    this._slideLockedBack = true;
  }
  
  /**
   * Reload the player's weapon
   * @private
   */
  _reload() {
    if (this.ammo >= this.maxAmmo || this.totalAmmo <= 0) return;
    
    this.isReloading = true;
    
    // Get current weapon data
    const currentWeapon = this.player.weapons[this.player.currentWeapon];
    const reloadTime = currentWeapon ? currentWeapon.reloadTime * 1000 : 2000;
    
    // Store the current magazine for tactical reloads
    const currentMagazine = this.ammo;
    
    // Start reload animation
    this._startReloadAnimation();
    
    // Play reload sound
    if (this.player.gameEngine && this.player.gameEngine.audioManager) {
      if (typeof this.player.gameEngine.audioManager.playSound === 'function') {
        const soundId = `reload_${this.player.currentWeapon}`;
        this.player.gameEngine.audioManager.playSound(soundId, 0.7);
      }
    }
    
    // Show reload UI
    if (this.player.gameEngine && this.player.gameEngine.uiManager) {
      if (typeof this.player.gameEngine.uiManager.showReloadIndicator === 'function') {
        this.player.gameEngine.uiManager.showReloadIndicator(reloadTime);
      }
    }
    
    // Simulate reload time
    this.reloadTimeout = setTimeout(() => {
      // Determine reload type based on current ammo
      const isTacticalReload = currentMagazine > 0;
      
      if (isTacticalReload) {
        // Tactical reload - keep the round in the chamber
        const ammoNeeded = this.maxAmmo - this.ammo;
        const ammoToAdd = Math.min(ammoNeeded, this.totalAmmo);
        
        // Add ammo and subtract from total
        this.ammo += ammoToAdd;
        this.totalAmmo -= ammoToAdd;
      } else {
        // Full reload - replace entire magazine
        const magazineSize = this.maxAmmo;
        const ammoToAdd = Math.min(magazineSize, this.totalAmmo);
        
        // Replace magazine
        this.ammo = ammoToAdd;
        this.totalAmmo -= ammoToAdd;
      }
      
      // Play magazine insertion sound
      if (this.player.gameEngine && this.player.gameEngine.audioManager) {
        if (typeof this.player.gameEngine.audioManager.playSound === 'function') {
          const soundId = `reload_finish_${this.player.currentWeapon}`;
          this.player.gameEngine.audioManager.playSound(soundId, 0.8);
        }
      }
      
      // End reload animation
      this._endReloadAnimation();
      
      this.isReloading = false;
      
      // Update weapon display
      if (this.player.gameEngine && this.player.gameEngine.uiManager) {
        if (typeof this.player.gameEngine.uiManager.updateAmmoDisplay === 'function') {
          this.player.gameEngine.uiManager.updateAmmoDisplay(this.ammo, this.totalAmmo);
        } else {
          // Fallback: log ammo info to console
          console.log(`Reload complete: ${this.ammo} / ${this.totalAmmo}`);
        }
      }
    }, reloadTime);
  }
  
  /**
   * Start the reload animation
   * @private
   */
  _startReloadAnimation() {
    if (!this.player.weaponContainer) return;
    
    const weapon = this.player.weapons[this.player.currentWeapon];
    if (!weapon || !weapon.mesh) return;
    
    // Store original position for restoration
    this._originalWeaponPosition = weapon.mesh.position.clone();
    this._originalWeaponRotation = weapon.mesh.rotation.clone();
    
    // Animate weapon down and to the side
    this._reloadAnimationStep = 0;
    this._animateReload();
  }
  
  /**
   * Animate the weapon during reload
   * @private
   */
  _animateReload() {
    if (!this.isReloading) return;
    
    const weapon = this.player.weapons[this.player.currentWeapon];
    if (!weapon || !weapon.mesh) return;
    
    // Animation steps
    // 0: Move weapon down and to the side
    // 1: Hold for magazine removal
    // 2: Move slightly for magazine insertion
    // 3: Return to original position
    
    const animationDuration = 300; // ms per step
    const stepDuration = animationDuration / 60; // 60fps
    
    switch (this._reloadAnimationStep) {
      case 0: // Move weapon down and to the side
        weapon.mesh.position.y -= 0.005;
        weapon.mesh.position.x += 0.003;
        weapon.mesh.rotation.z -= 0.01;
        
        if (weapon.mesh.position.y <= this._originalWeaponPosition.y - 0.15) {
          this._reloadAnimationStep = 1;
          
          // Play magazine eject sound
          if (this.player.gameEngine && this.player.gameEngine.audioManager) {
            const soundId = `magazine_eject_${this.player.currentWeapon}`;
            this.player.gameEngine.audioManager.playSound(soundId, 0.6);
          }
          
          // Create ejected magazine
          this._createEjectedMagazine();
          
          // Wait for magazine removal
          setTimeout(() => {
            this._reloadAnimationStep = 2;
          }, animationDuration);
        }
        break;
        
      case 1: // Hold for magazine removal
        // Just wait for the timeout
        break;
        
      case 2: // Move slightly for magazine insertion
        weapon.mesh.position.y += 0.002;
        weapon.mesh.rotation.z += 0.005;
        
        if (weapon.mesh.rotation.z >= 0) {
          this._reloadAnimationStep = 3;
        }
        break;
        
      case 3: // Return to original position
        weapon.mesh.position.y += 0.008;
        weapon.mesh.position.x -= 0.005;
        weapon.mesh.rotation.z += 0.015;
        
        // Check if we're back to original position
        if (weapon.mesh.position.y >= this._originalWeaponPosition.y) {
          weapon.mesh.position.copy(this._originalWeaponPosition);
          weapon.mesh.rotation.copy(this._originalWeaponRotation);
          return; // End animation
        }
        break;
    }
    
    // Continue animation
    requestAnimationFrame(() => this._animateReload());
  }
  
  /**
   * Create an ejected magazine effect
   * @private
   */
  _createEjectedMagazine() {
    if (!this.player.gameEngine || !this.player.gameEngine.scene || !this.camera) return;
    
    // Create magazine mesh
    const magazineGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.03);
    const magazineMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial);
    
    // Position at weapon
    const weaponPos = this.player.weapons[this.player.currentWeapon].mesh.getWorldPosition(new THREE.Vector3());
    magazine.position.copy(weaponPos);
    magazine.position.y -= 0.1;
    
    // Add to scene
    this.player.gameEngine.scene.add(magazine);
    
    // Add physics
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      -2,
      (Math.random() - 0.5) * 2
    );
    
    const rotation = new THREE.Vector3(
      Math.random() * 10,
      Math.random() * 10,
      Math.random() * 10
    );
    
    // Animate falling magazine
    const animateMagazine = () => {
      // Apply gravity
      velocity.y -= 9.8 * 0.016; // gravity * deltaTime
      
      // Move magazine
      magazine.position.x += velocity.x * 0.016;
      magazine.position.y += velocity.y * 0.016;
      magazine.position.z += velocity.z * 0.016;
      
      // Rotate magazine
      magazine.rotation.x += rotation.x * 0.016;
      magazine.rotation.y += rotation.y * 0.016;
      magazine.rotation.z += rotation.z * 0.016;
      
      // Check if magazine hit the ground
      if (magazine.position.y < 0) {
        magazine.position.y = 0;
        velocity.y = -velocity.y * 0.3; // Bounce
        velocity.x *= 0.7; // Friction
        velocity.z *= 0.7; // Friction
        
        // Play magazine hit sound
        if (this.player.gameEngine && this.player.gameEngine.audioManager) {
          const soundId = 'magazine_hit';
          this.player.gameEngine.audioManager.playSound(soundId, 0.3);
        }
        
        // Stop if velocity is very low
        if (Math.abs(velocity.y) < 0.5) {
          velocity.set(0, 0, 0);
          rotation.set(0, 0, 0);
          
          // Remove magazine after a delay
          setTimeout(() => {
            this.player.gameEngine.scene.remove(magazine);
          }, 5000);
          
          return;
        }
      }
      
      // Continue animation
      requestAnimationFrame(animateMagazine);
    };
    
    // Start animation
    animateMagazine();
  }
  
  /**
   * End the reload animation
   * @private
   */
  _endReloadAnimation() {
    if (!this.player.weaponContainer) return;
    
    const weapon = this.player.weapons[this.player.currentWeapon];
    if (!weapon || !weapon.mesh) return;
    
    // Reset weapon position
    if (this._originalWeaponPosition) {
      weapon.mesh.position.copy(this._originalWeaponPosition);
    }
    
    if (this._originalWeaponRotation) {
      weapon.mesh.rotation.copy(this._originalWeaponRotation);
    }
  }
  
  /**
   * Cancel reload if in progress
   * @private
   */
  cancelReload() {
    if (!this.isReloading) return;
    
    // Clear timeout
    if (this.reloadTimeout) {
      clearTimeout(this.reloadTimeout);
      this.reloadTimeout = null;
    }
    
    // End animation
    this._endReloadAnimation();
    
    this.isReloading = false;
  }
  
  /**
   * Apply damage to the player
   * @param {number} amount - Amount of damage to apply
   * @param {THREE.Vector3} direction - Direction the damage came from
   */
  takeDamage(amount, direction) {
    // Apply armor reduction if available
    let damageToHealth = amount;
    if (this.armor > 0) {
      const armorAbsorption = Math.min(this.armor, amount * 0.6);
      this.armor -= armorAbsorption;
      damageToHealth -= armorAbsorption;
    }
    
    // Apply damage to health
    this.health -= damageToHealth;
    
    // Show damage effect
    if (this.player.gameEngine && this.player.gameEngine.showDamageEffect) {
      this.player.gameEngine.showDamageEffect(amount / 100);
    }
    
    // Check if player is dead
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }
  
  /**
   * Kill the player
   */
  die() {
    this.isAlive = false;
    this.velocity.set(0, 0, 0);
    
    // Trigger game over
    if (this.player.gameEngine && this.player.gameEngine.gameOver) {
      this.player.gameEngine.gameOver();
    }
  }
  
  /**
   * Reset the player controller
   */
  reset() {
    this.velocity.set(0, 0, 0);
    this.isGrounded = true;
    this.isCrouching = false;
    this.isSprinting = false;
    this.isAlive = true;
    this.health = 100;
    this.armor = 0;
    this.ammo = this.maxAmmo;
    this.totalAmmo = 90;
    this.isReloading = false;
    this.cameraRotation.x = 0;
    this.cameraRotation.y = 0;
    this.currentHeight = this.cameraHeight;
    
    // Reset input
    this.inputManager.reset();
  }
}