import * as THREE from 'three';

/**
 * Simple level for testing
 */
export class SimpleLevel {
  constructor() {
    // Create level mesh
    this.mesh = new THREE.Group();
    
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x666666,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.mesh.add(floor);
    
    // Create walls
    this._createWalls();
    
    // Create obstacles
    this._createObstacles();
    
    // Create lights
    this._createLights();
    
    // Level properties
    this.gameEngine = null;
  }
  
  /**
   * Create walls around the level
   * @private
   */
  _createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.7,
      metalness: 0.2
    });
    
    // North wall
    const northWallGeometry = new THREE.BoxGeometry(100, 5, 1);
    const northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
    northWall.position.set(0, 2.5, -50);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    this.mesh.add(northWall);
    
    // South wall
    const southWallGeometry = new THREE.BoxGeometry(100, 5, 1);
    const southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
    southWall.position.set(0, 2.5, 50);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    this.mesh.add(southWall);
    
    // East wall
    const eastWallGeometry = new THREE.BoxGeometry(1, 5, 100);
    const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    eastWall.position.set(50, 2.5, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    this.mesh.add(eastWall);
    
    // West wall
    const westWallGeometry = new THREE.BoxGeometry(1, 5, 100);
    const westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
    westWall.position.set(-50, 2.5, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    this.mesh.add(westWall);
  }
  
  /**
   * Create obstacles in the level
   * @private
   */
  _createObstacles() {
    // Create some boxes
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0.1
    });
    
    // Create boxes in various positions
    const boxPositions = [
      { x: -10, y: 1, z: -10, size: 2 },
      { x: 15, y: 1, z: -5, size: 2 },
      { x: 5, y: 1, z: 20, size: 2 },
      { x: -20, y: 1, z: 15, size: 2 },
      { x: 0, y: 1, z: -25, size: 2 }
    ];
    
    boxPositions.forEach(pos => {
      const boxGeometry = new THREE.BoxGeometry(pos.size, pos.size, pos.size);
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(pos.x, pos.y, pos.z);
      box.castShadow = true;
      box.receiveShadow = true;
      this.mesh.add(box);
    });
    
    // Create some platforms
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.9,
      metalness: 0.1
    });
    
    // Create platforms in various positions
    const platformPositions = [
      { x: -15, y: 0.5, z: 0, width: 8, height: 1, depth: 8 },
      { x: 20, y: 1, z: 10, width: 10, height: 2, depth: 10 },
      { x: 0, y: 1.5, z: 30, width: 12, height: 3, depth: 6 }
    ];
    
    platformPositions.forEach(pos => {
      const platformGeometry = new THREE.BoxGeometry(pos.width, pos.height, pos.depth);
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(pos.x, pos.y, pos.z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      this.mesh.add(platform);
    });
    
    // Create some ramps
    const rampMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777,
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Create a ramp
    const rampGeometry = new THREE.BoxGeometry(10, 1, 5);
    const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.position.set(10, 0.5, -15);
    ramp.rotation.x = Math.PI / 12; // Slight incline
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    this.mesh.add(ramp);
  }
  
  /**
   * Create lights specific to this level
   * @private
   */
  _createLights() {
    // Add some point lights around the level
    const lightPositions = [
      { x: 20, y: 4, z: -20, color: 0xff0000, intensity: 1, distance: 20 },
      { x: -20, y: 4, z: 20, color: 0x0000ff, intensity: 1, distance: 20 },
      { x: -20, y: 4, z: -20, color: 0x00ff00, intensity: 1, distance: 20 },
      { x: 20, y: 4, z: 20, color: 0xffff00, intensity: 1, distance: 20 }
    ];
    
    lightPositions.forEach(pos => {
      const light = new THREE.PointLight(pos.color, pos.intensity, pos.distance);
      light.position.set(pos.x, pos.y, pos.z);
      light.castShadow = true;
      
      // Optimize shadow settings
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = pos.distance;
      
      this.mesh.add(light);
    });
  }
  
  /**
   * Set the game engine reference
   * @param {GameEngine} gameEngine - The game engine
   */
  setGameEngine(gameEngine) {
    this.gameEngine = gameEngine;
  }
  
  /**
   * Update the level
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    // Update level elements if needed
  }
}