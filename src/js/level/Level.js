import * as THREE from 'three';

export class Level {
  constructor(name) {
    this.name = name;
    this.mesh = null;
    this.playerSpawnPoint = new THREE.Vector3(0, 0, 0);
    this.enemySpawnPoints = [];
    this.pickupSpawnPoints = [];
    this.navMesh = null;
  }
  
  // Add a spawn point for enemies
  addEnemySpawnPoint(position) {
    this.enemySpawnPoints.push(position.clone());
  }
  
  // Add a spawn point for pickups
  addPickupSpawnPoint(position) {
    this.pickupSpawnPoints.push(position.clone());
  }
  
  // Get a random enemy spawn point
  getRandomEnemySpawnPoint() {
    if (this.enemySpawnPoints.length === 0) {
      // Default spawn points in a circle around the level
      const radius = 20;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return new THREE.Vector3(x, 0, z);
    }
    
    const index = Math.floor(Math.random() * this.enemySpawnPoints.length);
    return this.enemySpawnPoints[index].clone();
  }
  
  // Get a random pickup spawn point
  getRandomPickupSpawnPoint() {
    if (this.pickupSpawnPoints.length === 0) {
      // Default spawn points in a grid
      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      return new THREE.Vector3(x, 0, z);
    }
    
    const index = Math.floor(Math.random() * this.pickupSpawnPoints.length);
    return this.pickupSpawnPoints[index].clone();
  }
  
  // Check if a position is valid (not inside walls)
  isValidPosition(position) {
    // In a full implementation, we would check against the level geometry
    // For now, just make sure it's within the level bounds
    return (
      position.x > -50 && position.x < 50 &&
      position.z > -50 && position.z < 50
    );
  }
  
  // Find a path between two points
  findPath(start, end) {
    // In a full implementation, we would use the navigation mesh
    // For now, just return a direct path
    return [end];
  }
}