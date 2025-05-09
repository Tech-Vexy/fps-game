import * as THREE from 'three';
import { Level } from './Level';

export class LevelManager {
  constructor(assetManager) {
    this.assetManager = assetManager;
    this.levels = {};
    this.currentLevel = null;
  }
  
  loadLevel(levelName) {
    // Check if level is already loaded
    if (this.levels[levelName]) {
      this.currentLevel = this.levels[levelName];
      return this.currentLevel;
    }
    
    // Create a new level
    const level = this.createLevel(levelName);
    
    // Store the level
    this.levels[levelName] = level;
    this.currentLevel = level;
    
    return level;
  }
  
  createLevel(levelName) {
    // In a full implementation, we would load level data from a file
    // For now, we'll create a simple procedural level
    
    let level;
    
    switch (levelName) {
      case 'level1':
        level = this.createLevel1();
        break;
      default:
        level = this.createDefaultLevel();
        break;
    }
    
    return level;
  }
  
  createLevel1() {
    const level = new Level('level1');
    
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = this.assetManager.getMaterial('ground') || 
                          new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    
    // Create walls
    const wallMaterial = this.assetManager.getMaterial('wall') || 
                        new THREE.MeshStandardMaterial({ color: 0x808080 });
    
    // Create outer walls
    const wallGeometry = new THREE.BoxGeometry(100, 5, 1);
    
    const northWall = new THREE.Mesh(wallGeometry, wallMaterial);
    northWall.position.set(0, 2.5, -50);
    northWall.castShadow = true;
    
    const southWall = new THREE.Mesh(wallGeometry, wallMaterial);
    southWall.position.set(0, 2.5, 50);
    southWall.castShadow = true;
    
    const eastWall = new THREE.Mesh(wallGeometry, wallMaterial);
    eastWall.position.set(50, 2.5, 0);
    eastWall.rotation.y = Math.PI / 2;
    eastWall.castShadow = true;
    
    const westWall = new THREE.Mesh(wallGeometry, wallMaterial);
    westWall.position.set(-50, 2.5, 0);
    westWall.rotation.y = Math.PI / 2;
    westWall.castShadow = true;
    
    // Create some obstacles
    const obstacles = this.createObstacles(wallMaterial);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    
    // Create level group
    const levelGroup = new THREE.Group();
    levelGroup.add(ground);
    levelGroup.add(northWall);
    levelGroup.add(southWall);
    levelGroup.add(eastWall);
    levelGroup.add(westWall);
    
    // Add obstacles
    obstacles.forEach(obstacle => levelGroup.add(obstacle));
    
    // Add lights
    levelGroup.add(ambientLight);
    levelGroup.add(directionalLight);
    
    // Set level mesh
    level.mesh = levelGroup;
    
    // Set spawn points
    level.playerSpawnPoint = new THREE.Vector3(0, 1, 0);
    
    return level;
  }
  
  createObstacles(material) {
    const obstacles = [];
    
    // Create some boxes
    const boxGeometry = new THREE.BoxGeometry(3, 3, 3);
    
    // Create a grid of obstacles
    for (let i = -3; i <= 3; i += 2) {
      for (let j = -3; j <= 3; j += 2) {
        // Skip the center
        if (i === 0 && j === 0) continue;
        
        const box = new THREE.Mesh(boxGeometry, material);
        box.position.set(i * 10, 1.5, j * 10);
        box.castShadow = true;
        box.receiveShadow = true;
        
        obstacles.push(box);
      }
    }
    
    // Create some platforms
    const platformGeometry = new THREE.BoxGeometry(5, 1, 5);
    
    for (let i = -2; i <= 2; i += 2) {
      for (let j = -2; j <= 2; j += 2) {
        // Skip some positions for variety
        if ((i === 0 && j === 0) || Math.random() < 0.3) continue;
        
        const platform = new THREE.Mesh(platformGeometry, material);
        platform.position.set(i * 15, 0.5, j * 15);
        platform.castShadow = true;
        platform.receiveShadow = true;
        
        obstacles.push(platform);
      }
    }
    
    return obstacles;
  }
  
  createDefaultLevel() {
    const level = new Level('default');
    
    // Create a simple flat ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    
    // Create level group
    const levelGroup = new THREE.Group();
    levelGroup.add(ground);
    levelGroup.add(ambientLight);
    levelGroup.add(directionalLight);
    
    // Set level mesh
    level.mesh = levelGroup;
    
    // Set spawn points
    level.playerSpawnPoint = new THREE.Vector3(0, 1, 0);
    
    return level;
  }
  
  getCurrentLevel() {
    return this.currentLevel;
  }
}