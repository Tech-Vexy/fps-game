import * as THREE from 'three';

export class WeaponSystem {
  constructor() {
    this.gameEngine = null;
    this.projectiles = [];
    this.muzzleFlashes = [];
    this.impactEffects = [];
    
    // Add object pooling for projectiles
    this.projectilePool = [];
    this.poolSize = 50;
    
    // Pre-allocate objects
    for (let i = 0; i < this.poolSize; i++) {
      this.projectilePool.push({
        mesh: null,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        damage: 0,
        owner: null,
        active: false,
        createTime: 0
      });
    }
  }
  
  setGameEngine(gameEngine) {
    this.gameEngine = gameEngine;
  }
  
  update(deltaTime) {
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      // Move projectile
      projectile.position.add(projectile.velocity.clone().multiplyScalar(deltaTime));
      
      // Check for collisions
      const raycaster = new THREE.Raycaster(
        projectile.position.clone(),
        projectile.velocity.clone().normalize(),
        0,
        projectile.velocity.length() * deltaTime
      );
      
      // Get all potential targets
      const targets = [];
      
      // Add enemies
      if (this.gameEngine.enemyManager) {
        targets.push(...this.gameEngine.enemyManager.getEnemies().map(enemy => enemy.mesh));
      }
      
      // Add level
      if (this.gameEngine.level && this.gameEngine.level.mesh) {
        targets.push(this.gameEngine.level.mesh);
      }
      
      // Check for hits
      const intersects = raycaster.intersectObjects(targets);
      
      if (intersects.length > 0) {
        // Handle hit
        this.handleProjectileHit(projectile, intersects[0]);
        
        // Remove projectile
        if (projectile.mesh && projectile.mesh.parent) {
          projectile.mesh.parent.remove(projectile.mesh);
        }
        projectile.mesh.visible = false;
        projectile.active = false;
        this.projectiles.splice(i, 1);
      }
      
      // Remove projectile if it's too old
      projectile.lifetime -= deltaTime;
      if (projectile.lifetime <= 0) {
        if (projectile.mesh && projectile.mesh.parent) {
          projectile.mesh.parent.remove(projectile.mesh);
        }
        projectile.mesh.visible = false;
        projectile.active = false;
        this.projectiles.splice(i, 1);
      }
    }
    
    // Update muzzle flashes
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const flash = this.muzzleFlashes[i];
      flash.lifetime -= deltaTime;
      
      if (flash.lifetime <= 0) {
        if (flash.mesh && flash.mesh.parent) {
          flash.mesh.parent.remove(flash.mesh);
        }
        this.muzzleFlashes.splice(i, 1);
      }
    }
    
    // Update impact effects
    for (let i = this.impactEffects.length - 1; i >= 0; i--) {
      const effect = this.impactEffects[i];
      effect.lifetime -= deltaTime;
      
      if (effect.lifetime <= 0) {
        if (effect.mesh && effect.mesh.parent) {
          effect.mesh.parent.remove(effect.mesh);
        }
        this.impactEffects.splice(i, 1);
      }
    }
  }
  
  createProjectile(position, direction, speed, damage, owner) {
    // Get projectile from pool instead of creating new
    const projectile = this.getProjectileFromPool();
    if (!projectile) return null;
    
    projectile.position.copy(position);
    projectile.velocity.copy(direction).normalize().multiplyScalar(speed);
    projectile.damage = damage;
    projectile.owner = owner;
    projectile.active = true;
    projectile.createTime = performance.now();
    
    // Create or reuse mesh
    if (!projectile.mesh) {
      const geometry = new THREE.SphereGeometry(0.05, 8, 8); // Reduced polygon count
      const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      projectile.mesh = new THREE.Mesh(geometry, material);
      this.gameEngine.scene.add(projectile.mesh);
    } else {
      projectile.mesh.visible = true;
    }
    
    projectile.mesh.position.copy(position);
    this.projectiles.push(projectile);
    
    return projectile;
  }
  
  getProjectileFromPool() {
    for (let i = 0; i < this.projectilePool.length; i++) {
      if (!this.projectilePool[i].active) {
        return this.projectilePool[i];
      }
    }
    return null;
  }
  
  createMuzzleFlash(position, direction) {
    // Create muzzle flash mesh
    const geometry = new THREE.PlaneGeometry(0.5, 0.5);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.lookAt(position.clone().add(direction));
    
    // Add to scene
    if (this.gameEngine) {
      this.gameEngine.scene.add(mesh);
    }
    
    // Create muzzle flash object
    const flash = {
      mesh: mesh,
      lifetime: 0.05 // seconds
    };
    
    this.muzzleFlashes.push(flash);
    
    return flash;
  }
  
  createImpactEffect(position, normal) {
    // Create impact effect mesh
    const geometry = new THREE.PlaneGeometry(0.3, 0.3);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xaaaaaa,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    
    // Orient to face normal
    if (normal) {
      mesh.lookAt(position.clone().add(normal));
    }
    
    // Add to scene
    if (this.gameEngine) {
      this.gameEngine.scene.add(mesh);
    }
    
    // Create impact effect object
    const effect = {
      mesh: mesh,
      lifetime: 0.2 // seconds
    };
    
    this.impactEffects.push(effect);
    
    return effect;
  }
  
  handleProjectileHit(projectile, intersection) {
    // Create impact effect
    this.createImpactEffect(intersection.point, intersection.face ? intersection.face.normal : null);
    
    // Check what was hit
    const hitObject = intersection.object;
    
    // Find the entity that was hit
    if (this.gameEngine && this.gameEngine.enemyManager) {
      const enemies = this.gameEngine.enemyManager.getEnemies();
      const hitEnemy = enemies.find(enemy => enemy.mesh === hitObject);
      
      if (hitEnemy) {
        // Deal damage to enemy
        hitEnemy.takeDamage(projectile.damage);
      }
    }
  }
  
  reset() {
    // Remove all projectiles
    for (const projectile of this.projectiles) {
      if (projectile.mesh && projectile.mesh.parent) {
        projectile.mesh.parent.remove(projectile.mesh);
      }
      projectile.mesh.visible = false;
      projectile.active = false;
    }
    this.projectiles = [];
    
    // Remove all muzzle flashes
    for (const flash of this.muzzleFlashes) {
      if (flash.mesh && flash.mesh.parent) {
        flash.mesh.parent.remove(flash.mesh);
      }
    }
    this.muzzleFlashes = [];
    
    // Remove all impact effects
    for (const effect of this.impactEffects) {
      if (effect.mesh && effect.mesh.parent) {
        effect.mesh.parent.remove(effect.mesh);
      }
    }
    this.impactEffects = [];
  }
}