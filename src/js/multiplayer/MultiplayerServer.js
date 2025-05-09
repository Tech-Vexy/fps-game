const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

class MultiplayerServer {
  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    
    // Game state
    this.players = new Map(); // Map of player ID to player object
    this.enemies = new Map(); // Map of enemy ID to enemy object
    this.projectiles = new Map(); // Map of projectile ID to projectile object
    
    // Game settings
    this.tickRate = 20; // Server ticks per second
    this.tickInterval = 1000 / this.tickRate;
    this.lastTickTime = 0;
    this.enemyIdCounter = 0;
    this.projectileIdCounter = 0;
    
    // Set up routes
    this.setupRoutes();
    
    // Set up socket handlers
    this.setupSocketHandlers();
  }
  
  setupRoutes() {
    // Serve static files from the dist directory
    this.app.use(express.static(path.join(__dirname, '../../../dist')));
    
    // Serve the main HTML file for all routes
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../../dist/index.html'));
    });
  }
  
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Player connected: ${socket.id}`);
      
      // Handle player join
      socket.on('player_join', (player) => {
        this.handlePlayerJoin(socket, player);
      });
      
      // Handle player update
      socket.on('player_update', (update) => {
        this.handlePlayerUpdate(socket, update);
      });
      
      // Handle player shot
      socket.on('player_shot', (shot) => {
        this.handlePlayerShot(socket, shot);
      });
      
      // Handle enemy damage
      socket.on('enemy_damage', (damage) => {
        this.handleEnemyDamage(socket, damage);
      });
      
      // Handle player damage
      socket.on('player_damage', (damage) => {
        this.handlePlayerDamage(socket, damage);
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        this.handlePlayerDisconnect(socket);
      });
    });
  }
  
  start() {
    // Start the server
    this.server.listen(this.port, () => {
      console.log(`Multiplayer server running on port ${this.port}`);
    });
    
    // Start the game loop
    this.gameLoop();
  }
  
  gameLoop() {
    const now = Date.now();
    const deltaTime = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;
    
    // Update game state
    this.update(deltaTime);
    
    // Schedule next tick
    setTimeout(() => this.gameLoop(), this.tickInterval);
  }
  
  update(deltaTime) {
    // Update enemies
    this.updateEnemies(deltaTime);
    
    // Update projectiles
    this.updateProjectiles(deltaTime);
    
    // Spawn enemies
    this.spawnEnemies(deltaTime);
  }
  
  updateEnemies(deltaTime) {
    // Update each enemy
    for (const [enemyId, enemy] of this.enemies.entries()) {
      // Find nearest player
      let nearestPlayer = null;
      let nearestDistance = Infinity;
      
      for (const [playerId, player] of this.players.entries()) {
        const distance = this.calculateDistance(
          enemy.position,
          player.position
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestPlayer = player;
        }
      }
      
      // Update enemy based on nearest player
      if (nearestPlayer) {
        // Move towards player
        if (nearestDistance > enemy.attackRange) {
          const direction = this.calculateDirection(
            enemy.position,
            nearestPlayer.position
          );
          
          enemy.position.x += direction.x * enemy.speed * deltaTime;
          enemy.position.y = 1; // Keep on ground
          enemy.position.z += direction.z * enemy.speed * deltaTime;
          
          enemy.state = 'chase';
        }
        // Attack player
        else {
          enemy.state = 'attack';
          
          // Attack every attackRate seconds
          enemy.attackTimer -= deltaTime;
          if (enemy.attackTimer <= 0) {
            // Reset timer
            enemy.attackTimer = enemy.attackRate;
            
            // Deal damage to player
            this.damagePlayer(nearestPlayer.id, enemy.damage);
          }
        }
      }
      
      // Broadcast enemy update
      this.io.emit('enemy_update', {
        id: enemyId,
        position: enemy.position,
        health: enemy.health,
        state: enemy.state
      });
    }
  }
  
  updateProjectiles(deltaTime) {
    // Update each projectile
    for (const [projectileId, projectile] of this.projectiles.entries()) {
      // Update position
      projectile.position.x += projectile.direction.x * projectile.speed * deltaTime;
      projectile.position.y += projectile.direction.y * projectile.speed * deltaTime;
      projectile.position.z += projectile.direction.z * projectile.speed * deltaTime;
      
      // Check lifetime
      projectile.lifetime -= deltaTime;
      if (projectile.lifetime <= 0) {
        // Remove projectile
        this.projectiles.delete(projectileId);
        continue;
      }
      
      // Check collisions with players
      for (const [playerId, player] of this.players.entries()) {
        // Skip owner
        if (playerId === projectile.ownerId) continue;
        
        // Check collision
        const distance = this.calculateDistance(
          projectile.position,
          player.position
        );
        
        if (distance < 1) { // Player radius
          // Deal damage to player
          this.damagePlayer(playerId, projectile.damage);
          
          // Remove projectile
          this.projectiles.delete(projectileId);
          break;
        }
      }
      
      // Check collisions with enemies
      for (const [enemyId, enemy] of this.enemies.entries()) {
        // Check collision
        const distance = this.calculateDistance(
          projectile.position,
          enemy.position
        );
        
        if (distance < 1) { // Enemy radius
          // Deal damage to enemy
          this.damageEnemy(enemyId, projectile.damage);
          
          // Remove projectile
          this.projectiles.delete(projectileId);
          break;
        }
      }
    }
  }
  
  spawnEnemies(deltaTime) {
    // Spawn enemies based on number of players
    if (this.players.size === 0) return;
    
    // Limit number of enemies
    const maxEnemies = 5 * this.players.size;
    if (this.enemies.size >= maxEnemies) return;
    
    // Spawn rate based on number of players
    const spawnRate = 5 / this.players.size; // Enemies per second
    const spawnChance = spawnRate * deltaTime;
    
    // Random chance to spawn
    if (Math.random() > spawnChance) return;
    
    // Choose random spawn position
    const spawnRadius = 30;
    const angle = Math.random() * Math.PI * 2;
    const spawnPosition = {
      x: Math.cos(angle) * spawnRadius,
      y: 1,
      z: Math.sin(angle) * spawnRadius
    };
    
    // Choose random enemy type (0-3)
    const enemyType = Math.floor(Math.random() * 4);
    
    // Create enemy
    const enemyId = `enemy_${this.enemyIdCounter++}`;
    const enemy = {
      id: enemyId,
      type: enemyType,
      position: spawnPosition,
      health: 100 + enemyType * 25,
      maxHealth: 100 + enemyType * 25,
      damage: 10 + enemyType * 5,
      speed: 5 - enemyType * 0.5,
      attackRange: 2 + enemyType * 0.5,
      attackRate: 1 + enemyType * 0.2,
      attackTimer: 1 + enemyType * 0.2,
      state: 'chase'
    };
    
    // Add to enemies map
    this.enemies.set(enemyId, enemy);
    
    // Broadcast enemy spawn
    this.io.emit('enemy_spawn', {
      id: enemyId,
      type: enemyType,
      position: spawnPosition
    });
  }
  
  handlePlayerJoin(socket, player) {
    // Add player to players map
    this.players.set(socket.id, {
      id: socket.id,
      position: player.position,
      rotation: player.rotation,
      health: 100,
      maxHealth: 100
    });
    
    // Broadcast new player to all clients
    socket.broadcast.emit('player_joined', {
      id: socket.id,
      position: player.position,
      rotation: player.rotation
    });
    
    // Send list of existing players to new player
    const playersList = [];
    for (const [playerId, playerData] of this.players.entries()) {
      if (playerId !== socket.id) {
        playersList.push({
          id: playerId,
          position: playerData.position,
          rotation: playerData.rotation
        });
      }
    }
    socket.emit('players_list', playersList);
    
    // Send list of existing enemies to new player
    for (const [enemyId, enemy] of this.enemies.entries()) {
      socket.emit('enemy_spawn', {
        id: enemyId,
        type: enemy.type,
        position: enemy.position
      });
    }
  }
  
  handlePlayerUpdate(socket, update) {
    // Get player
    const player = this.players.get(socket.id);
    if (!player) return;
    
    // Update player position and rotation
    player.position = update.position;
    player.rotation = update.rotation;
    player.velocity = update.velocity;
    player.sequenceNumber = update.sequenceNumber;
    
    // Broadcast player update to all other clients
    socket.broadcast.emit('player_update', {
      id: socket.id,
      position: update.position,
      rotation: update.rotation,
      timestamp: Date.now()
    });
    
    // Send server correction to player
    socket.emit('server_correction', {
      position: update.position,
      rotation: update.rotation,
      sequenceNumber: update.sequenceNumber
    });
  }
  
  handlePlayerShot(socket, shot) {
    // Get player
    const player = this.players.get(socket.id);
    if (!player) return;
    
    // Create projectile
    const projectileId = `projectile_${this.projectileIdCounter++}`;
    const projectile = {
      id: projectileId,
      ownerId: socket.id,
      position: shot.position,
      direction: shot.direction,
      speed: 50, // Units per second
      damage: shot.damage,
      lifetime: 2 // Seconds
    };
    
    // Add to projectiles map
    this.projectiles.set(projectileId, projectile);
    
    // Broadcast projectile to all clients
    this.io.emit('projectile_spawn', {
      id: projectileId,
      ownerId: socket.id,
      position: shot.position,
      direction: shot.direction,
      speed: 50,
      damage: shot.damage
    });
  }
  
  handleEnemyDamage(socket, damage) {
    // Get enemy
    const enemy = this.enemies.get(damage.enemyId);
    if (!enemy) return;
    
    // Apply damage
    this.damageEnemy(damage.enemyId, damage.damage);
  }
  
  handlePlayerDamage(socket, damage) {
    // Get target player
    const targetPlayer = this.players.get(damage.targetPlayerId);
    if (!targetPlayer) return;
    
    // Apply damage
    this.damagePlayer(damage.targetPlayerId, damage.damage);
  }
  
  handlePlayerDisconnect(socket) {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Remove player from players map
    this.players.delete(socket.id);
    
    // Broadcast player left to all clients
    this.io.emit('player_left', socket.id);
  }
  
  damageEnemy(enemyId, damage) {
    // Get enemy
    const enemy = this.enemies.get(enemyId);
    if (!enemy) return;
    
    // Apply damage
    enemy.health -= damage;
    
    // Check if dead
    if (enemy.health <= 0) {
      // Remove enemy
      this.enemies.delete(enemyId);
      
      // Broadcast enemy removal
      this.io.emit('enemy_remove', enemyId);
    } else {
      // Broadcast enemy update
      this.io.emit('enemy_update', {
        id: enemyId,
        position: enemy.position,
        health: enemy.health,
        state: enemy.state
      });
    }
  }
  
  damagePlayer(playerId, damage) {
    // Get player
    const player = this.players.get(playerId);
    if (!player) return;
    
    // Apply damage
    player.health -= damage;
    
    // Check if dead
    if (player.health <= 0) {
      // Reset health
      player.health = player.maxHealth;
      
      // Reset position
      player.position = {
        x: 0,
        y: 1,
        z: 0
      };
      
      // Broadcast player death
      this.io.to(playerId).emit('player_death');
    }
    
    // Send damage event to player
    this.io.to(playerId).emit('player_damaged', {
      damage,
      health: player.health,
      maxHealth: player.maxHealth
    });
  }
  
  calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  calculateDirection(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (length === 0) {
      return { x: 0, y: 0, z: 0 };
    }
    
    return {
      x: dx / length,
      y: dy / length,
      z: dz / length
    };
  }
}

// Create and start server if this file is run directly
if (require.main === module) {
  const server = new MultiplayerServer();
  server.start();
}

module.exports = MultiplayerServer;