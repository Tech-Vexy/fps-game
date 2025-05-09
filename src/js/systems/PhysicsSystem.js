import * as THREE from 'three';
import { initWasm } from '../wasm/wasm-loader';

export class PhysicsSystem {
  constructor() {
    this.gravity = 9.8;
    this.wasmInterface = null;
    this.entities = [];
    this.staticObjects = [];
    this.collisionGroups = {
      PLAYER: 1,
      ENEMY: 2,
      PROJECTILE: 4,
      STATIC: 8,
      PICKUP: 16
    };
    
    // Pre-allocated reusable objects for better performance
    this._direction = new THREE.Vector3();
    this._contactPoint = new THREE.Vector3();
    this._contactNormal = new THREE.Vector3();
    
    // Initialize WebAssembly
    this.initWasm();
  }
  
  async initWasm() {
    try {
      this.wasmInterface = await initWasm();
      console.log('Physics system initialized with WebAssembly');
    } catch (error) {
      console.error('Failed to initialize WebAssembly for physics:', error);
      console.warn('Using JavaScript physics implementation');
    }
  }
  
  setGameEngine(gameEngine) {
    this.gameEngine = gameEngine;
  }
  
  update(deltaTime) {
    if (!this.gameEngine) return;
    
    // Get all entities with physics
    const entities = this.gameEngine.entities.filter(entity => entity.mesh && entity.velocity);
    
    // Process in batches for better performance
    const batchSize = 10;
    const batches = Math.ceil(entities.length / batchSize);
    
    for (let b = 0; b < batches; b++) {
      const startIdx = b * batchSize;
      const endIdx = Math.min((b + 1) * batchSize, entities.length);
      const batchEntities = entities.slice(startIdx, endIdx);
      
      // Process physics for this batch
      this._processPhysicsBatch(batchEntities, deltaTime);
    }
  }
  
  _processPhysicsBatch(entities, deltaTime) {
    // Process gravity and movement
    for (const entity of entities) {
      if (this.wasmInterface && this.wasmInterface.isLoaded) {
        // Use WebAssembly for gravity and collision
        this.wasmInterface.applyGravity(entity.mesh.position, entity.velocity, deltaTime);
      } else {
        // JavaScript fallback
        entity.velocity.y -= this.gravity * deltaTime;
        entity.mesh.position.y += entity.velocity.y * deltaTime;
        
        // Basic ground collision
        if (entity.mesh.position.y < 0) {
          entity.mesh.position.y = 0;
          entity.velocity.y = 0;
          entity.onGround = true;
        } else {
          entity.onGround = false;
        }
      }
      
      // Check for collisions with static geometry
      this._handleStaticCollisions(entity, deltaTime);
    }
    
    // Check collisions between dynamic entities
    this._handleDynamicCollisions(entities);
  }
  
  _handleStaticCollisions(entity, deltaTime) {
    // Get static objects from the game engine
    const staticObjects = this.gameEngine ? 
      this.gameEngine.entities.filter(e => e.isStatic && e.mesh && e !== entity) : 
      this.staticObjects;
    
    // Simple distance check to only process nearby objects
    const nearbyObjects = staticObjects.filter(obj => {
      if (!obj.mesh || !obj.mesh.position) return false;
      const distance = entity.mesh.position.distanceTo(obj.mesh.position);
      return distance < 5; // Check objects within 5 units
    });
    
    for (const obj of nearbyObjects) {
      if (this._checkCollision(entity.mesh, obj.mesh)) {
        const mtv = this._calculateMinimumTranslationVector(entity.mesh, obj.mesh);
        if (mtv) {
          // Resolve collision
          entity.mesh.position.add(mtv);
          
          // Reflect velocity for bouncy objects
          if (entity.bouncy) {
            const normalizedMtv = mtv.clone().normalize();
            const dot = entity.velocity.dot(normalizedMtv);
            entity.velocity.sub(normalizedMtv.multiplyScalar(2 * dot));
            entity.velocity.multiplyScalar(entity.restitution || 0.3); // Energy loss
          } else {
            // Just stop movement in the collision direction
            this._removeVelocityComponent(entity.velocity, mtv.clone().normalize());
          }
        }
      }
    }
  }
  
  _handleDynamicCollisions(entities) {
    // Check collisions between dynamic entities
    for (let i = 0; i < entities.length; i++) {
      const entityA = entities[i];
      
      for (let j = i + 1; j < entities.length; j++) {
        const entityB = entities[j];
        
        // Skip if either entity doesn't have a mesh
        if (!entityA.mesh || !entityB.mesh) continue;
        
        // Check collision
        if (this._checkCollision(entityA.mesh, entityB.mesh)) {
          // Handle collision response
          this._resolveDynamicCollision(entityA, entityB);
        }
      }
    }
  }
  
  _resolveDynamicCollision(entityA, entityB) {
    // Simple collision response
    if (entityA.onCollision) entityA.onCollision(entityB);
    if (entityB.onCollision) entityB.onCollision(entityA);
  }
  
  _checkCollision(meshA, meshB) {
    // Simple bounding sphere collision check
    if (!meshA.geometry || !meshB.geometry) return false;
    
    // Ensure bounding spheres are computed
    if (!meshA.geometry.boundingSphere) meshA.geometry.computeBoundingSphere();
    if (!meshB.geometry.boundingSphere) meshB.geometry.computeBoundingSphere();
    
    // Get world positions
    const posA = meshA.position;
    const posB = meshB.position;
    
    // Get combined radius
    const radiusA = meshA.geometry.boundingSphere.radius * Math.max(
      meshA.scale.x, meshA.scale.y, meshA.scale.z
    );
    const radiusB = meshB.geometry.boundingSphere.radius * Math.max(
      meshB.scale.x, meshB.scale.y, meshB.scale.z
    );
    
    // Check distance against combined radius
    const distance = posA.distanceTo(posB);
    return distance < (radiusA + radiusB);
  }
  
  _calculateMinimumTranslationVector(meshA, meshB) {
    // Simple sphere-based MTV calculation
    if (!meshA.geometry || !meshB.geometry) return null;
    
    // Ensure bounding spheres are computed
    if (!meshA.geometry.boundingSphere) meshA.geometry.computeBoundingSphere();
    if (!meshB.geometry.boundingSphere) meshB.geometry.computeBoundingSphere();
    
    // Get world positions
    const posA = meshA.position;
    const posB = meshB.position;
    
    // Get combined radius
    const radiusA = meshA.geometry.boundingSphere.radius * Math.max(
      meshA.scale.x, meshA.scale.y, meshA.scale.z
    );
    const radiusB = meshB.geometry.boundingSphere.radius * Math.max(
      meshB.scale.x, meshB.scale.y, meshB.scale.z
    );
    
    // Calculate direction and distance
    const direction = new THREE.Vector3().subVectors(posA, posB).normalize();
    const distance = posA.distanceTo(posB);
    const overlap = (radiusA + radiusB) - distance;
    
    // If there's an overlap, return the MTV
    if (overlap > 0) {
      return direction.multiplyScalar(overlap);
    }
    
    return null;
  }
  
  _removeVelocityComponent(velocity, normal) {
    // Remove velocity component in the direction of the normal
    const dot = velocity.dot(normal);
    if (dot < 0) {
      velocity.sub(normal.multiplyScalar(dot));
    }
  }
  
  rayCast(origin, direction, maxDistance = 100) {
    // Simple ray casting implementation
    const raycaster = new THREE.Raycaster(origin, direction, 0, maxDistance);
    
    // Get all meshes from the game engine
    const meshes = [];
    if (this.gameEngine) {
      this.gameEngine.entities.forEach(entity => {
        if (entity.mesh) {
          meshes.push(entity.mesh);
        }
      });
    }
    
    // Perform the raycast
    const intersects = raycaster.intersectObjects(meshes, true);
    
    // Return the first hit, if any
    if (intersects.length > 0) {
      return intersects[0];
    }
    
    return null;
  }
  
  reset() {
    // Reset any physics state
    this.entities = [];
    this.staticObjects = [];
  }
}