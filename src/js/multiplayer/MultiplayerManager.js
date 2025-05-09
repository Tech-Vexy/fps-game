import { io } from 'socket.io-client';
import * as THREE from 'three';

export class MultiplayerManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.socket = null;
    this.players = new Map(); // Map of player ID to player object
    this.playerId = null;
    this.serverUrl = 'http://localhost:3000'; // Change this to your server URL
    this.isConnected = false;
    this.lastUpdateTime = 0;
    this.updateRate = 1000 / 20; // 20 updates per second
    
    // Client-side prediction
    this.inputSequence = 0;
    this.pendingInputs = [];
    this.serverPositions = [];
    
    // Interpolation
    this.positionBuffer = new Map(); // Map of player ID to position buffer
    this.interpolationDelay = 100; // ms
  }
  
  connect() {
    if (this.isConnected) return;
    
    try {
      this.socket = io(this.serverUrl);
      
      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.isConnected = true;
        this.playerId = this.socket.id;
        
        // Send player info to server
        this.socket.emit('player_join', {
          id: this.playerId,
          position: this.getPlayerPosition(),
          rotation: this.getPlayerRotation()
        });
      });
      
      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.isConnected = false;
        this.players.clear();
      });
      
      this.socket.on('player_joined', (player) => {
        console.log(`Player joined: ${player.id}`);
        this.addRemotePlayer(player);
      });
      
      this.socket.on('player_left', (playerId) => {
        console.log(`Player left: ${playerId}`);
        this.removeRemotePlayer(playerId);
      });
      
      this.socket.on('players_list', (players) => {
        console.log(`Received players list: ${players.length} players`);
        
        // Clear existing players
        this.players.forEach((player, id) => {
          if (id !== this.playerId) {
            this.removeRemotePlayer(id);
          }
        });
        
        // Add all players
        players.forEach(player => {
          if (player.id !== this.playerId) {
            this.addRemotePlayer(player);
          }
        });
      });
      
      this.socket.on('player_update', (update) => {
        this.handlePlayerUpdate(update);
      });
      
      this.socket.on('server_correction', (correction) => {
        this.handleServerCorrection(correction);
      });
      
      this.socket.on('enemy_spawn', (enemy) => {
        this.spawnEnemy(enemy);
      });
      
      this.socket.on('enemy_update', (update) => {
        this.updateEnemy(update);
      });
      
      this.socket.on('enemy_remove', (enemyId) => {
        this.removeEnemy(enemyId);
      });
      
      this.socket.on('projectile_spawn', (projectile) => {
        this.spawnProjectile(projectile);
      });
      
    } catch (error) {
      console.error('Failed to connect to server:', error);
    }
  }
  
  disconnect() {
    if (!this.isConnected || !this.socket) return;
    
    this.socket.disconnect();
    this.isConnected = false;
    this.players.clear();
  }
  
  update(deltaTime) {
    if (!this.isConnected) return;
    
    const now = performance.now();
    
    // Send player updates at a fixed rate
    if (now - this.lastUpdateTime > this.updateRate) {
      this.sendPlayerUpdate();
      this.lastUpdateTime = now;
    }
    
    // Interpolate remote players
    this.interpolateRemotePlayers(deltaTime);
  }
  
  sendPlayerUpdate() {
    if (!this.isConnected || !this.socket || !this.gameEngine.getPlayer()) return;
    
    const player = this.gameEngine.getPlayer();
    const position = this.getPlayerPosition();
    const rotation = this.getPlayerRotation();
    const velocity = player.velocity ? {
      x: player.velocity.x,
      y: player.velocity.y,
      z: player.velocity.z
    } : { x: 0, y: 0, z: 0 };
    
    // Create input
    const input = {
      sequenceNumber: this.inputSequence++,
      position,
      rotation,
      velocity,
      timestamp: performance.now()
    };
    
    // Save input for client-side prediction
    this.pendingInputs.push(input);
    
    // Send to server
    this.socket.emit('player_update', input);
  }
  
  handlePlayerUpdate(update) {
    const { id, position, rotation, timestamp } = update;
    
    // Ignore updates for local player
    if (id === this.playerId) return;
    
    // Get or create position buffer for this player
    if (!this.positionBuffer.has(id)) {
      this.positionBuffer.set(id, []);
    }
    
    const buffer = this.positionBuffer.get(id);
    
    // Add update to buffer
    buffer.push({
      position,
      rotation,
      timestamp
    });
    
    // Keep buffer sorted by timestamp
    buffer.sort((a, b) => a.timestamp - b.timestamp);
    
    // Limit buffer size
    if (buffer.length > 60) { // 3 seconds at 20 updates per second
      buffer.shift();
    }
  }
  
  handleServerCorrection(correction) {
    const { position, rotation, sequenceNumber } = correction;
    
    // Remove pending inputs that have been processed by the server
    this.pendingInputs = this.pendingInputs.filter(input => {
      return input.sequenceNumber > sequenceNumber;
    });
    
    // Apply server correction
    const player = this.gameEngine.getPlayer();
    if (!player) return;
    
    // Set position and rotation
    player.mesh.position.set(position.x, position.y, position.z);
    
    // Re-apply pending inputs
    for (const input of this.pendingInputs) {
      // Apply input (simplified - in a real game, you'd apply the actual movement logic)
      player.mesh.position.x += input.velocity.x * 0.016; // Assuming 60 FPS
      player.mesh.position.y += input.velocity.y * 0.016;
      player.mesh.position.z += input.velocity.z * 0.016;
    }
    
    // Save server position for debugging
    this.serverPositions.push({
      position: new THREE.Vector3(position.x, position.y, position.z),
      timestamp: performance.now()
    });
    
    // Limit server positions array
    if (this.serverPositions.length > 10) {
      this.serverPositions.shift();
    }
  }
  
  interpolateRemotePlayers(deltaTime) {
    const now = performance.now();
    const renderTimestamp = now - this.interpolationDelay;
    
    // Interpolate each remote player
    this.positionBuffer.forEach((buffer, playerId) => {
      // Find the player
      const player = this.players.get(playerId);
      if (!player) return;
      
      // Find the two updates that surround the render timestamp
      let beforeIndex = -1;
      let afterIndex = -1;
      
      for (let i = 0; i < buffer.length; i++) {
        if (buffer[i].timestamp <= renderTimestamp) {
          beforeIndex = i;
        } else {
          afterIndex = i;
          break;
        }
      }
      
      // If we have both before and after, interpolate
      if (beforeIndex !== -1 && afterIndex !== -1) {
        const before = buffer[beforeIndex];
        const after = buffer[afterIndex];
        
        // Calculate interpolation factor
        const timeDiff = after.timestamp - before.timestamp;
        const factor = timeDiff === 0 ? 0 : (renderTimestamp - before.timestamp) / timeDiff;
        
        // Interpolate position
        player.mesh.position.x = before.position.x + (after.position.x - before.position.x) * factor;
        player.mesh.position.y = before.position.y + (after.position.y - before.position.y) * factor;
        player.mesh.position.z = before.position.z + (after.position.z - before.position.z) * factor;
        
        // Interpolate rotation
        player.mesh.rotation.y = before.rotation.y + (after.rotation.y - before.rotation.y) * factor;
      }
      // If we only have before, use that
      else if (beforeIndex !== -1) {
        const before = buffer[beforeIndex];
        player.mesh.position.x = before.position.x;
        player.mesh.position.y = before.position.y;
        player.mesh.position.z = before.position.z;
        player.mesh.rotation.y = before.rotation.y;
      }
      // If we only have after, use that
      else if (afterIndex !== -1) {
        const after = buffer[afterIndex];
        player.mesh.position.x = after.position.x;
        player.mesh.position.y = after.position.y;
        player.mesh.position.z = after.position.z;
        player.mesh.rotation.y = after.rotation.y;
      }
      
      // Clean up old updates
      while (buffer.length > 0 && buffer[0].timestamp < renderTimestamp - 1000) {
        buffer.shift();
      }
    });
  }
  
  addRemotePlayer(player) {
    // Check if player already exists
    if (this.players.has(player.id)) return;
    
    // Create player mesh
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Set position and rotation
    mesh.position.set(
      player.position.x,
      player.position.y,
      player.position.z
    );
    
    mesh.rotation.y = player.rotation.y || 0;
    
    // Add to scene
    this.gameEngine.scene.add(mesh);
    
    // Add to players map
    this.players.set(player.id, {
      id: player.id,
      mesh,
      lastUpdate: performance.now()
    });
    
    // Create position buffer
    this.positionBuffer.set(player.id, []);
  }
  
  removeRemotePlayer(playerId) {
    // Check if player exists
    if (!this.players.has(playerId)) return;
    
    // Get player
    const player = this.players.get(playerId);
    
    // Remove from scene
    this.gameEngine.scene.remove(player.mesh);
    
    // Remove from players map
    this.players.delete(playerId);
    
    // Remove position buffer
    this.positionBuffer.delete(playerId);
  }
  
  getPlayerPosition() {
    const player = this.gameEngine.getPlayer();
    if (!player || !player.mesh) return { x: 0, y: 0, z: 0 };
    
    return {
      x: player.mesh.position.x,
      y: player.mesh.position.y,
      z: player.mesh.position.z
    };
  }
  
  getPlayerRotation() {
    const player = this.gameEngine.getPlayer();
    if (!player || !player.mesh) return { y: 0 };
    
    return {
      y: player.mesh.rotation.y
    };
  }
  
  spawnEnemy(enemy) {
    if (!this.gameEngine.enemyManager) return;
    
    // Create enemy at the specified position
    const position = new THREE.Vector3(
      enemy.position.x,
      enemy.position.y,
      enemy.position.z
    );
    
    // Spawn enemy with the specified type and ID
    this.gameEngine.enemyManager.spawnNetworkedEnemy(
      position,
      enemy.type,
      enemy.id
    );
  }
  
  updateEnemy(update) {
    if (!this.gameEngine.enemyManager) return;
    
    // Find enemy by ID
    const enemy = this.gameEngine.enemyManager.getEnemyById(update.id);
    if (!enemy) return;
    
    // Update enemy position and state
    enemy.mesh.position.set(
      update.position.x,
      update.position.y,
      update.position.z
    );
    
    enemy.health = update.health;
    enemy.state = update.state;
    
    // Update health bar
    const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
    enemy.healthFill.scale.x = healthPercent;
    enemy.healthFill.position.x = (healthPercent - 1) / 2;
  }
  
  removeEnemy(enemyId) {
    if (!this.gameEngine.enemyManager) return;
    
    // Find enemy by ID
    const enemy = this.gameEngine.enemyManager.getEnemyById(enemyId);
    if (!enemy) return;
    
    // Remove enemy
    this.gameEngine.enemyManager.removeEnemy(enemy);
  }
  
  spawnProjectile(projectile) {
    if (!this.gameEngine.weaponSystem) return;
    
    // Create projectile
    const position = new THREE.Vector3(
      projectile.position.x,
      projectile.position.y,
      projectile.position.z
    );
    
    const direction = new THREE.Vector3(
      projectile.direction.x,
      projectile.direction.y,
      projectile.direction.z
    );
    
    // Spawn projectile
    this.gameEngine.weaponSystem.createNetworkedProjectile(
      position,
      direction,
      projectile.speed,
      projectile.damage,
      projectile.ownerId,
      projectile.id
    );
  }
  
  sendShot(position, direction, damage) {
    if (!this.isConnected || !this.socket) return;
    
    this.socket.emit('player_shot', {
      position,
      direction,
      damage,
      timestamp: performance.now()
    });
  }
  
  sendEnemyDamage(enemyId, damage) {
    if (!this.isConnected || !this.socket) return;
    
    this.socket.emit('enemy_damage', {
      enemyId,
      damage,
      timestamp: performance.now()
    });
  }
  
  sendPlayerDamage(targetPlayerId, damage) {
    if (!this.isConnected || !this.socket) return;
    
    this.socket.emit('player_damage', {
      targetPlayerId,
      damage,
      timestamp: performance.now()
    });
  }
}