// This file handles the interface between JavaScript and WebAssembly

// Import the WebAssembly module dynamically to avoid import errors

export class WasmInterface {
  constructor() {
    this.isLoaded = false;
    this.physicsSystem = null;
    this.behaviorTree = null;
    this.pathfinder = null;
    this.wasmModule = null;
    this.enemyFactory = null;
    
    // Direct WebAssembly instances
    this._wasmPhysicsSystem = null;
    this._wasmPhysicsSystemPool = null;
  }
  
  async init() {
    try {
      // Improved WebAssembly loading with caching
      const { loadWasmModule } = await import('./wasm-loader-generated.js');
      this.wasmModule = await loadWasmModule({
        // Add caching strategy
        cacheBusting: false,
        preloadedModules: ['PhysicsSystem', 'Vector3']
      });
      
      if (!this.wasmModule) {
        throw new Error('WebAssembly module failed to load');
      }
      
      // Initialize direct WebAssembly instances with pooling
      if (this.wasmModule.PhysicsSystem) {
        try {
          // Create a pool of physics systems for better performance
          this._wasmPhysicsSystemPool = [];
          for (let i = 0; i < 5; i++) {
            this._wasmPhysicsSystemPool.push(new this.wasmModule.PhysicsSystem());
          }
          this._wasmPhysicsSystem = this._wasmPhysicsSystemPool[0];
          console.log('WebAssembly PhysicsSystem pool created successfully');
        } catch (err) {
          console.warn('Failed to create WebAssembly PhysicsSystem pool:', err);
        }
      }
    } catch (error) {
      console.error('Failed to initialize WebAssembly:', error);
    }
  }
  
  async initFallback() {
    console.log('Initializing JavaScript fallbacks for WebAssembly');
    
    // Create mock implementations
    this.physicsSystem = this.createMockPhysicsSystem();
    this.enemyFactory = this.createMockEnemyFactory();
    this.pathfinder = this.createMockPathfinder();
    
    this.isLoaded = true;
    console.log('JavaScript fallbacks initialized');
    
    return true;
  }
  
  // Physics System Interface
  
  applyGravity(position, velocity, deltaTime) {
    if (this.physicsSystem) {
      if (this.wasmModule && this.wasmModule.Vector3 && this.wasmModule.PhysicsSystem) {
        try {
          // Check if we need to create a new physics system instance
          if (!this._wasmPhysicsSystem) {
            this._wasmPhysicsSystem = new this.wasmModule.PhysicsSystem();
          }
          
          // Convert to WebAssembly Vector3
          const wasmPosition = new this.wasmModule.Vector3(position.x, position.y, position.z);
          const wasmVelocity = new this.wasmModule.Vector3(velocity.x, velocity.y, velocity.z);
          
          // Call WebAssembly function
          this._wasmPhysicsSystem.apply_gravity(wasmPosition, wasmVelocity, deltaTime);
          
          // Update JavaScript objects
          position.x = wasmPosition.x;
          position.y = wasmPosition.y;
          position.z = wasmPosition.z;
          
          velocity.x = wasmVelocity.x;
          velocity.y = wasmVelocity.y;
          velocity.z = wasmVelocity.z;
          return;
        } catch (e) {
          console.warn('Error using WebAssembly Vector3, falling back to JS implementation:', e);
        }
      }
      
      // Use JavaScript fallback
      this.physicsSystem.applyGravity(position, velocity, deltaTime);
    }
  }
  
  checkSphereCollision(position1, radius1, position2, radius2) {
    if (this.physicsSystem) {
      if (this.wasmModule && this.wasmModule.Vector3 && this.wasmModule.PhysicsSystem) {
        try {
          // Check if we need to create a new physics system instance
          if (!this._wasmPhysicsSystem) {
            this._wasmPhysicsSystem = new this.wasmModule.PhysicsSystem();
          }
          
          // Convert to WebAssembly Vector3
          const wasmPosition1 = new this.wasmModule.Vector3(position1.x, position1.y, position1.z);
          const wasmPosition2 = new this.wasmModule.Vector3(position2.x, position2.y, position2.z);
          
          // Call WebAssembly function
          return this._wasmPhysicsSystem.check_sphere_collision(wasmPosition1, radius1, wasmPosition2, radius2);
        } catch (e) {
          console.warn('Error using WebAssembly Vector3, falling back to JS implementation:', e);
        }
      }
      
      // Use JavaScript fallback
      return this.physicsSystem.checkSphereCollision(position1, radius1, position2, radius2);
    }
    return false;
  }
  
  resolveSphereCollision(position1, velocity1, mass1, position2, velocity2, mass2) {
    if (this.physicsSystem) {
      if (this.wasmModule && this.wasmModule.Vector3 && this.wasmModule.PhysicsSystem) {
        try {
          // Check if we need to create a new physics system instance
          if (!this._wasmPhysicsSystem) {
            this._wasmPhysicsSystem = new this.wasmModule.PhysicsSystem();
          }
          
          // Convert to WebAssembly Vector3
          const wasmPosition1 = new this.wasmModule.Vector3(position1.x, position1.y, position1.z);
          const wasmVelocity1 = new this.wasmModule.Vector3(velocity1.x, velocity1.y, velocity1.z);
          
          const wasmPosition2 = new this.wasmModule.Vector3(position2.x, position2.y, position2.z);
          const wasmVelocity2 = new this.wasmModule.Vector3(velocity2.x, velocity2.y, velocity2.z);
          
          // Call WebAssembly function
          this._wasmPhysicsSystem.resolve_sphere_collision(
            wasmPosition1, wasmVelocity1, mass1,
            wasmPosition2, wasmVelocity2, mass2
          );
          
          // Update JavaScript objects
          position1.x = wasmPosition1.x;
          position1.y = wasmPosition1.y;
          position1.z = wasmPosition1.z;
          
          velocity1.x = wasmVelocity1.x;
          velocity1.y = wasmVelocity1.y;
          velocity1.z = wasmVelocity1.z;
          
          position2.x = wasmPosition2.x;
          position2.y = wasmPosition2.y;
          position2.z = wasmPosition2.z;
          
          return;
        } catch (e) {
          console.warn('Error using WebAssembly Vector3, falling back to JS implementation:', e);
        }
      }
      
      // Use JavaScript fallback
      this.physicsSystem.resolveSphereCollision(position1, velocity1, mass1, position2, velocity2, mass2);
    }
  }
  
  // Behavior Tree Interface
  
  createBehaviorTree(enemyType) {
    if (this.wasmModule && this.enemyFactory && typeof this.enemyFactory.create_behavior_tree === 'function') {
      try {
        return this.enemyFactory.create_behavior_tree(enemyType);
      } catch (e) {
        console.warn('Error creating behavior tree, using fallback:', e);
      }
    }
    return this.createMockBehaviorTree();
  }
  
  evaluateBehaviorTree(tree, context) {
    if (this.wasmModule && tree && typeof tree.evaluate === 'function') {
      try {
        return tree.evaluate(context);
      } catch (e) {
        console.warn('Error evaluating behavior tree, using fallback:', e);
        return 0; // Failure
      }
    } else if (tree && typeof tree.evaluate === 'function') {
      return tree.evaluate();
    } else {
      console.warn('Invalid behavior tree provided');
      return 0; // Failure
    }
  }
  
  // Pathfinding Interface
  
  findPath(startX, startY, endX, endY) {
    if (this.pathfinder) {
      if (this.wasmModule && this.pathfinder && typeof this.pathfinder.find_path === 'function') {
        try {
          return this.pathfinder.find_path(startX, startY, endX, endY);
        } catch (e) {
          console.warn('Error finding path, using fallback:', e);
        }
      }
      
      if (typeof this.pathfinder.findPath === 'function') {
        return this.pathfinder.findPath(startX, startY, endX, endY);
      }
    }
    
    // Ultimate fallback - just return a direct path
    console.warn('No pathfinding implementation available');
    return true;
  }
  
  // JavaScript fallback implementations
  
  createMockPhysicsSystem() {
    return {
      applyGravity: (position, velocity, deltaTime) => {
        velocity.y -= 9.8 * deltaTime;
        position.y += velocity.y * deltaTime;
        
        if (position.y < 0) {
          position.y = 0;
          velocity.y = 0;
        }
      },
      
      checkSphereCollision: (position1, radius1, position2, radius2) => {
        const dx = position1.x - position2.x;
        const dy = position1.y - position2.y;
        const dz = position1.z - position2.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        return distance < (radius1 + radius2);
      },
      
      resolveSphereCollision: (position1, velocity1, mass1, position2, velocity2, mass2) => {
        // Calculate direction vector
        const dx = position1.x - position2.x;
        const dy = position1.y - position2.y;
        const dz = position1.z - position2.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance === 0) return;
        
        const nx = dx / distance;
        const ny = dy / distance;
        const nz = dz / distance;
        
        // Calculate relative velocity
        const rvx = velocity1.x - velocity2.x;
        const rvy = velocity1.y - velocity2.y;
        const rvz = velocity1.z - velocity2.z;
        
        // Calculate velocity along the normal
        const velAlongNormal = rvx * nx + rvy * ny + rvz * nz;
        
        // Do not resolve if velocities are separating
        if (velAlongNormal > 0) return;
        
        // Calculate restitution (bounciness)
        const restitution = 0.2;
        
        // Calculate impulse scalar
        let impulseScalar = -(1 + restitution) * velAlongNormal;
        impulseScalar /= (1 / mass1 + 1 / mass2);
        
        // Apply impulse
        velocity1.x += impulseScalar * nx / mass1;
        velocity1.y += impulseScalar * ny / mass1;
        velocity1.z += impulseScalar * nz / mass1;
        
        velocity2.x -= impulseScalar * nx / mass2;
        velocity2.y -= impulseScalar * ny / mass2;
        velocity2.z -= impulseScalar * nz / mass2;
      }
    };
  }
  
  createMockEnemyFactory() {
    return {
      create_behavior_tree: (enemyType) => {
        return this.createMockBehaviorTree();
      }
    };
  }
  
  createMockBehaviorTree() {
    const self = this;
    return {
      nodes: new Map(),
      nextId: 0,
      rootId: 0,
      
      createSequenceNode: function() {
        const id = this.nextId++;
        this.nodes.set(id, {
          type: 'sequence',
          children: []
        });
        return id;
      },
      
      createSelectorNode: function() {
        const id = this.nextId++;
        this.nodes.set(id, {
          type: 'selector',
          children: []
        });
        return id;
      },
      
      addChild: function(parentId, childId) {
        const parent = this.nodes.get(parentId);
        if (parent) {
          parent.children.push(childId);
        }
      },
      
      setRoot: function(nodeId) {
        this.rootId = nodeId;
      },
      
      evaluate: function(context) {
        // In a real implementation, we would evaluate the behavior tree
        // For now, just return a random result
        const results = [0, 1, 2]; // Failure, Success, Running
        
        // Set a random action in the context
        if (context) {
          context.set_value('action', Math.floor(Math.random() * 3));
          context.set_value('action_parameter', Math.random() * 10);
        }
        
        return results[Math.floor(Math.random() * results.length)];
      }
    };
  }
  
  createMockPathfinder() {
    return {
      gridSize: 100,
      grid: Array(100 * 100).fill(true),
      
      setObstacle: (x, y) => {
        const index = y * this.pathfinder.gridSize + x;
        if (index < this.pathfinder.grid.length) {
          this.pathfinder.grid[index] = false;
        }
      },
      
      isWalkable: (x, y) => {
        if (x >= this.pathfinder.gridSize || y >= this.pathfinder.gridSize) {
          return false;
        }
        return this.pathfinder.grid[y * this.pathfinder.gridSize + x];
      },
      
      findPath: (startX, startY, endX, endY) => {
        // In a real implementation, we would use A* pathfinding
        // For now, just check if start and end are valid
        if (startX >= this.pathfinder.gridSize || startY >= this.pathfinder.gridSize ||
            endX >= this.pathfinder.gridSize || endY >= this.pathfinder.gridSize) {
          return false;
        }
        
        return true;
      }
    };
  }
}