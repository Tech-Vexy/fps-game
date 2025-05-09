import * as THREE from 'three';
import { initWasm } from '../wasm/wasm-loader';

export class AISystem {
  constructor() {
    this.gameEngine = null;
    this.pathfindingGrid = null;
    this.wasmInterface = null;
    this.behaviorTrees = new Map();
    this.behaviorContexts = new Map();
    
    // Initialize WebAssembly
    this.initWasm();
  }
  
  async initWasm() {
    try {
      this.wasmInterface = await initWasm();
      console.log('AI system initialized with WebAssembly');
    } catch (error) {
      console.error('Failed to initialize WebAssembly for AI:', error);
      console.warn('Using JavaScript AI implementation');
    }
  }
  
  setGameEngine(gameEngine) {
    this.gameEngine = gameEngine;
  }
  
  update(deltaTime) {
    // Update cooldowns in behavior contexts
    for (const [entityId, context] of this.behaviorContexts.entries()) {
      // Update cooldown timers
      for (let i = 1; i <= 10; i++) {
        const cooldownKey = `cooldown_${i}`;
        const cooldownValue = context.get_value(cooldownKey);
        if (cooldownValue > 0) {
          context.set_value(cooldownKey, cooldownValue - deltaTime);
        }
      }
    }
  }
  
  // Create a behavior tree for an entity
  createBehaviorTree(entityId, enemyType) {
    if (this.wasmInterface && this.wasmInterface.isLoaded) {
      // Create behavior context
      const context = new this.wasmInterface.wasmModule.BehaviorContext();
      this.behaviorContexts.set(entityId, context);
      
      // Create behavior tree
      const tree = this.wasmInterface.createBehaviorTree(enemyType.id);
      this.behaviorTrees.set(entityId, tree);
      
      return { tree, context };
    }
    return null;
  }
  
  // Evaluate a behavior tree
  evaluateBehaviorTree(entityId, position, targetPosition, health, maxHealth) {
    if (this.wasmInterface && this.wasmInterface.isLoaded) {
      const tree = this.behaviorTrees.get(entityId);
      const context = this.behaviorContexts.get(entityId);
      
      if (tree && context) {
        // Update context with current state
        context.set_entity_position(position.x, position.y, position.z);
        
        if (targetPosition) {
          context.set_target_position(targetPosition.x, targetPosition.y, targetPosition.z);
        }
        
        context.set_entity_health(health, maxHealth);
        
        // Check if target is visible
        let targetVisible = false;
        if (targetPosition && this.gameEngine) {
          targetVisible = this.hasLineOfSight(position, targetPosition);
        }
        context.set_value('target_visible', targetVisible ? 1.0 : 0.0);
        
        // Evaluate behavior tree
        const result = this.wasmInterface.evaluateBehaviorTree(tree, context);
        
        // Return action from context
        return {
          result,
          action: context.get_value('action'),
          parameter: context.get_value('action_parameter')
        };
      }
    }
    
    // Fallback to simple AI
    return { result: 1, action: 0, parameter: 5 }; // Default to chase action
  }
  
  // Simple line-of-sight check between two points
  hasLineOfSight(fromPosition, toPosition) {
    if (!this.gameEngine) return false;
    
    const direction = new THREE.Vector3();
    direction.subVectors(toPosition, fromPosition);
    
    const distance = direction.length();
    direction.normalize();
    
    const raycaster = new THREE.Raycaster(fromPosition, direction, 0, distance);
    
    // Check for intersections with the level geometry
    const intersects = raycaster.intersectObject(this.gameEngine.level.mesh);
    
    // If there are no intersections, we have line of sight
    return intersects.length === 0;
  }
  
  // Find a path from start to end
  findPath(startPosition, endPosition) {
    if (this.wasmInterface && this.wasmInterface.isLoaded) {
      // Convert to grid coordinates
      const gridSize = 1; // Size of each grid cell in world units
      const startX = Math.floor(startPosition.x / gridSize) + 50; // Offset to make coordinates positive
      const startY = Math.floor(startPosition.z / gridSize) + 50;
      const endX = Math.floor(endPosition.x / gridSize) + 50;
      const endY = Math.floor(endPosition.z / gridSize) + 50;
      
      // Use WebAssembly pathfinding
      const pathExists = this.wasmInterface.findPath(startX, startY, endX, endY);
      
      if (pathExists) {
        // In a real implementation, we would get the actual path
        // For now, just return a direct path if it exists
        return [endPosition];
      }
    }
    
    // Fallback to simple pathfinding
    if (this.hasLineOfSight(startPosition, endPosition)) {
      return [endPosition];
    }
    
    // Otherwise, return a simple waypoint halfway between
    const midpoint = new THREE.Vector3();
    midpoint.addVectors(startPosition, endPosition);
    midpoint.multiplyScalar(0.5);
    
    // Adjust midpoint to avoid obstacles
    midpoint.y = 1; // Keep on ground level
    
    return [midpoint, endPosition];
  }
  
  // Determine the best action for an AI entity
  getBestAction(entity, target) {
    const distanceToTarget = entity.mesh.position.distanceTo(target.mesh.position);
    
    if (distanceToTarget <= entity.attackRange) {
      return 'attack';
    } else if (this.hasLineOfSight(entity.mesh.position, target.mesh.position)) {
      return 'chase';
    } else {
      return 'pathfind';
    }
  }
  
  reset() {
    // Reset any AI state
    this.behaviorTrees.clear();
    this.behaviorContexts.clear();
  }
}