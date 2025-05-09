import * as THREE from 'three';
import { GameEngine } from './core/GameEngine';
import { Player } from './entities/Player';
import { EnemyManager } from './entities/EnemyManager';
import { WeaponSystem } from './systems/WeaponSystem';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { UIManager } from './ui/UIManager';
import { LevelManager } from './level/LevelManager';
import { AISystem } from './systems/AISystem';
import { AssetManager } from './core/AssetManager';
import { initWasm } from './wasm/wasm-loader';

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', async () => {
  // Show loading progress
  const loadingProgress = document.getElementById('loading-progress');
  if (loadingProgress) {
    loadingProgress.style.width = '10%';
  }
  
  // Initialize WebAssembly
  try {
    await initWasm();
    console.log('WebAssembly initialized');
    
    if (loadingProgress) {
      loadingProgress.style.width = '30%';
    }
  } catch (error) {
    console.warn('WebAssembly initialization failed, using JavaScript fallbacks:', error);
    
    if (loadingProgress) {
      loadingProgress.style.width = '20%';
    }
  }
  
  // Create the main game engine
  const game = new GameEngine();
  
  // Start loading assets
  const assetManager = new AssetManager();
  await assetManager.loadAssets();
  
  if (loadingProgress) {
    loadingProgress.style.width = '60%';
  }
  
  // Initialize game systems
  const physicsSystem = new PhysicsSystem();
  const aiSystem = new AISystem();
  const weaponSystem = new WeaponSystem();
  
  if (loadingProgress) {
    loadingProgress.style.width = '70%';
  }
  
  // Create the player
  const player = new Player();
  
  // Create the level
  const levelManager = new LevelManager(assetManager);
  levelManager.loadLevel('level1');
  
  if (loadingProgress) {
    loadingProgress.style.width = '80%';
  }
  
  // Create enemy manager
  const enemyManager = new EnemyManager(aiSystem, assetManager);
  
  // Initialize UI
  const uiManager = new UIManager();
  
  if (loadingProgress) {
    loadingProgress.style.width = '90%';
  }
  
  // Add all components to the game engine
  game.addSystem(physicsSystem);
  game.addSystem(aiSystem);
  game.addSystem(weaponSystem);
  game.addEntity(player);
  game.setLevel(levelManager.getCurrentLevel());
  game.setEnemyManager(enemyManager);
  game.setUIManager(uiManager);
  
  if (loadingProgress) {
    loadingProgress.style.width = '100%';
  }
  
  // Start the game
  game.start();
  
  // Hide loading screen
  setTimeout(() => {
    document.getElementById('loading-screen').style.display = 'none';
  }, 500);
});