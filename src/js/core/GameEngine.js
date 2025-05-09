import * as THREE from 'three';
import { PlayerMetrics } from './PlayerMetrics';
import { PostProcessingManager } from '../graphics/PostProcessingManager';
import { ParticleSystem } from '../graphics/ParticleSystem';
import { ModelLoader } from '../graphics/ModelLoader';
import { MultiplayerManager } from '../multiplayer/MultiplayerManager';
import { PerformanceMonitor } from './PerformanceMonitor';
import { HDTextureLoader } from '../graphics/HDTextureLoader';
import { HDEnvironment } from '../graphics/HDEnvironment';
import { HDMaterialManager } from '../graphics/HDMaterialManager';
import { LightingManager } from '../graphics/LightingManager';
import { HDSkybox } from '../graphics/HDSkybox';
import { Player } from '../entities/Player';
import { UIManager } from '../ui/UIManager';
import { EventEmitter } from './EventEmitter';
import { MissionSystem } from '../missions/MissionSystem';
import { MissionUI } from '../ui/MissionUI';

export class GameEngine {
  constructor() {
    // Create the scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.02);
    
    // Create the camera with reduced far plane for better performance
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    
    // Create the renderer with HD settings
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance",
      precision: "highp", // Use high precision for better visual quality
      stencil: false, // Disable stencil buffer if not needed
      depth: true,
      logarithmicDepthBuffer: true // Better depth precision for large scenes
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio); // Use full device pixel ratio for HD
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Better quality shadows
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2; // Slightly brighter for better visibility
    
    // Settings for visual effects and distractions
    this.visualSettings = {
      screenShakeIntensity: 1.0,
      bloodEffectsIntensity: 1.0,
      motionBlurIntensity: 0.5,
      chromaticAberrationIntensity: 0.5,
      vignetteIntensity: 0.5
    };
    
    document.body.appendChild(this.renderer.domElement);
    
    // Game state
    this.isRunning = false;
    this.lastTime = 0;
    this.systems = [];
    this.entities = [];
    this.level = null;
    this.enemyManager = null;
    
    // Create event system
    this.events = new EventEmitter();
    
    // Create UI manager
    this.uiManager = new UIManager();
    this.uiManager.setGameEngine(this);
    
    // Create mission system
    this.missionSystem = new MissionSystem(this);
    
    // Create mission UI
    this.missionUI = new MissionUI(this.missionSystem);
    
    // Player metrics for adaptive difficulty
    this.playerMetrics = new PlayerMetrics();
    
    // Performance monitoring and optimization
    this.performanceMonitor = new PerformanceMonitor(this);
    
    // HD Graphics enhancements
    this.postProcessing = new PostProcessingManager(this.renderer, this.scene, this.camera);
    this.particleSystem = new ParticleSystem(this.scene);
    this.hdTextureLoader = new HDTextureLoader();
    this.hdEnvironment = new HDEnvironment(this.renderer, this.scene);
    this.hdMaterialManager = new HDMaterialManager();
    this.lightingManager = new LightingManager(this.scene);
    this.hdSkybox = new HDSkybox(this.renderer);
    this.modelLoader = new ModelLoader();
    
    // Multiplayer
    this.multiplayerManager = new MultiplayerManager(this);
    this.isMultiplayer = false;
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.postProcessing.resize(window.innerWidth, window.innerHeight);
    });
    
    // Initialize lighting
    this.initLighting();

    // Add Level of Detail manager
    this.lodManager = {
      distanceThresholds: [10, 30, 80, 150],
      updateFrequency: [1, 2, 4, 8], // Update every X frames based on distance
      updateCounter: 0
    };
  }
  
  initLighting() {
    // Use the new LightingManager to set up modern lighting
    this.lightingManager
      .initMainLighting()
      .addAtmosphericLights(3);
      
    // You can also set time of day for different lighting moods:
    // this.lightingManager.setTimeOfDay('day');
    // Other options: 'dawn', 'dusk', 'night'
  }
  
  async loadAssets() {
    // Show loading progress
    const loadingProgress = document.getElementById('loading-progress');
    if (loadingProgress) {
      loadingProgress.style.width = '10%';
    }
    
    // Create player
    const player = new Player();
    this.addEntity(player);
    
    // Create and add a simple level
    const { SimpleLevel } = await import('../entities/SimpleLevel');
    const level = new SimpleLevel();
    this.setLevel(level);
    
    // Initialize mission system
    this.missionSystem.initialize();
    
    // Load HD skybox
    try {
      const skybox = await this.hdSkybox.createFromHDR('textures/skybox/sky.hdr')
        .catch(() => this.hdSkybox.createFromCubemap([
          'textures/skybox/px.jpg',
          'textures/skybox/nx.jpg',
          'textures/skybox/py.jpg',
          'textures/skybox/ny.jpg',
          'textures/skybox/pz.jpg',
          'textures/skybox/nz.jpg'
        ]));
      
      // Apply skybox to scene
      this.hdSkybox.applySkybox(this.scene, skybox);
      
      if (loadingProgress) {
        loadingProgress.style.width = '30%';
      }
    } catch (error) {
      console.warn('Failed to load HD skybox, using procedural sky:', error);
      const proceduralSky = this.hdSkybox.createProceduralSky({
        topColor: 0x0077ff,
        bottomColor: 0xffffff,
        offset: 33,
        exponent: 0.6
      });
      this.scene.add(proceduralSky);
    }
    
    // Load HD environment map for reflections
    try {
      await this.hdEnvironment.loadHDREnvironment('textures/environment/hdri.hdr')
        .catch(() => this.hdEnvironment.loadCubemapEnvironment([
          'textures/environment/px.jpg',
          'textures/environment/nx.jpg',
          'textures/environment/py.jpg',
          'textures/environment/ny.jpg',
          'textures/environment/pz.jpg',
          'textures/environment/nz.jpg'
        ]));
      
      // Apply environment map to all materials
      this.hdEnvironment.applyToAllMaterials(1.2);
      
      if (loadingProgress) {
        loadingProgress.style.width = '50%';
      }
    } catch (error) {
      console.warn('Failed to load HD environment map:', error);
    }
    
    // Load models and textures with HD settings
    await this.modelLoader.loadModels();
    
    // Load player weapons
    const playerEntity = this.getPlayer();
    if (playerEntity) {
      await playerEntity.loadWeapons();
    }
    
    if (loadingProgress) {
      loadingProgress.style.width = '80%';
    }
    
    // Apply post-processing effects
    this.postProcessing.updateSettings({
      bloom: true,
      chromaticAberration: true,
      noise: true
    });
    
    if (loadingProgress) {
      loadingProgress.style.width = '100%';
    }
  }
  
  addSystem(system) {
    system.setGameEngine(this);
    this.systems.push(system);
  }
  
  addEntity(entity) {
    entity.setGameEngine(this);
    this.entities.push(entity);
    if (entity.mesh) {
      this.scene.add(entity.mesh);
    }
  }
  
  setLevel(level) {
    this.level = level;
    this.scene.add(level.mesh);
  }
  
  setEnemyManager(enemyManager) {
    this.enemyManager = enemyManager;
    enemyManager.setGameEngine(this);
  }
  
  setUIManager(uiManager) {
    this.uiManager = uiManager;
    uiManager.setGameEngine(this);
  }
  
  enableMultiplayer() {
    this.isMultiplayer = true;
    this.multiplayerManager.connect();
  }
  
  disableMultiplayer() {
    this.isMultiplayer = false;
    this.multiplayerManager.disconnect();
  }
  
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      
      // Show mission UI
      this.missionUI.show();
      
      requestAnimationFrame(this.gameLoop.bind(this));
    }
  }
  
  stop() {
    this.isRunning = false;
  }
  
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    
    // Calculate delta time with a maximum value to prevent large jumps
    const rawDeltaTime = (currentTime - this.lastTime) / 1000;
    const deltaTime = Math.min(rawDeltaTime, 0.1); // Cap at 100ms to prevent physics issues
    this.lastTime = currentTime;
    
    // Track FPS
    if (!this.fpsUpdateTime) this.fpsUpdateTime = 0;
    if (!this.frameCount) this.frameCount = 0;
    
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime > 1000) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
      
      // Adjust quality based on FPS if needed
      this.adjustQualityBasedOnPerformance();
    }
    
    // Increment LOD counter
    this.lodManager.updateCounter = (this.lodManager.updateCounter + 1) % Math.max(...this.lodManager.updateFrequency);
    
    // Update entities with proper LOD
    this.updateEntitiesWithLOD(deltaTime);
    
    // Use object pooling for performance-intensive operations
    
    // Update all systems
    for (const system of this.systems) {
      system.update(deltaTime);
    }
    
    // Update enemy manager with throttling for distant enemies
    if (this.enemyManager) {
      this.enemyManager.update(deltaTime);
    }
    
    // Update mission system
    this.missionSystem.update(deltaTime);
    
    // Update mission UI
    this.missionUI.update(deltaTime);
    
    // Update UI
    if (this.uiManager) {
      this.uiManager.update(deltaTime);
    }
    
    // Update particle system
    this.particleSystem.update(deltaTime);
    
    // Update multiplayer with network throttling
    if (this.isMultiplayer) {
      // Throttle network updates based on frame rate
      if (!this.networkUpdateCounter) this.networkUpdateCounter = 0;
      this.networkUpdateCounter++;
      
      // Update network less frequently if framerate is low
      const networkUpdateFrequency = this.currentFPS < 30 ? 3 : 1;
      
      if (this.networkUpdateCounter % networkUpdateFrequency === 0) {
        this.multiplayerManager.update(deltaTime);
      }
    }
    
    // Update performance monitor
    this.performanceMonitor.update();
    
    // Render the scene with post-processing
    this.postProcessing.render(deltaTime);
    
    // Continue the game loop with optimized binding
    // Store bound function to avoid creating a new function on each frame
    if (!this.boundGameLoop) {
      this.boundGameLoop = this.gameLoop.bind(this);
    }
    requestAnimationFrame(this.boundGameLoop);
  }
  
  updateEntitiesWithLOD(deltaTime) {
    const playerPosition = this.getPlayer()?.mesh?.position || new THREE.Vector3();
    const frustum = this.createViewFrustum();
    
    // Update entities with LOD
    for (const entity of this.entities) {
      if (!entity.mesh || !entity.update) continue;
      
      // Always update player and important entities
      if (entity.isPlayer || entity.isImportant) {
        entity.update(deltaTime);
        continue;
      }
      
      try {
        // Frustum culling
        if (frustum && entity.mesh.geometry?.boundingSphere &&
            !frustum.intersectsObject(entity.mesh)) {
          continue;
        }
        
        // Calculate distance to player for LOD
        const distance = entity.mesh.position.distanceTo(playerPosition);
        
        // Determine update frequency based on distance
        let updateFreq = 1;
        for (let i = 0; i < this.lodManager.distanceThresholds.length; i++) {
          if (distance > this.lodManager.distanceThresholds[i]) {
            updateFreq = this.lodManager.updateFrequency[i];
          }
        }
        
        // Update entity based on LOD
        if (this.lodManager.updateCounter % updateFreq === 0) {
          entity.update(deltaTime * updateFreq);
        }
      } catch (error) {
        console.warn('Error during LOD update:', error);
        entity.update(deltaTime);
      }
    }
  }
  
  createViewFrustum() {
    let frustum = null;
    try {
      // Only create frustum if camera is ready
      if (this.camera && this.camera.projectionMatrix && this.camera.matrixWorldInverse) {
        frustum = new THREE.Frustum().setFromProjectionMatrix(
          new THREE.Matrix4().multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
          )
        );
      }
    } catch (error) {
      console.warn('Failed to create view frustum:', error);
    }
    return frustum;
  }
  
  // New method to adjust quality based on performance
  adjustQualityBasedOnPerformance() {
    if (!this.currentFPS) return;
    
    // If FPS is too low, reduce quality
    if (this.currentFPS < 30) {
      // Reduce shadow quality
      if (this.renderer.shadowMap.type !== THREE.BasicShadowMap) {
        console.log('Reducing shadow quality for better performance');
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
      }
      
      // Reduce post-processing effects
      if (this.postProcessing && this.postProcessing.settings) {
        if (this.postProcessing.settings.bloom || this.postProcessing.settings.chromaticAberration) {
          console.log('Reducing post-processing effects for better performance');
          const reducedSettings = {
            bloom: false,
            chromaticAberration: false,
            noise: false
          };
          this.postProcessing.updateSettings(reducedSettings);
        }
      }
      
      // Reduce particle count
      if (this.particleSystem) {
        this.particleSystem.maxParticleSystems = 10;
      }
    } 
    // If FPS is good, we can increase quality again
    else if (this.currentFPS > 55) {
      // Restore settings if they were reduced
      if (this.renderer.shadowMap.type === THREE.BasicShadowMap) {
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
      }
      
      // Restore post-processing
      if (this.postProcessing && this.postProcessing.settings) {
        if (!this.postProcessing.settings.bloom) {
          const enhancedSettings = {
            bloom: true,
            chromaticAberration: true,
            noise: true
          };
          this.postProcessing.updateSettings(enhancedSettings);
        }
      }
      
      // Restore particle count
      if (this.particleSystem) {
        this.particleSystem.maxParticleSystems = 20;
      }
    }
  }
  
  // Helper method to find entities by type
  getEntitiesByType(type) {
    return this.entities.filter(entity => entity instanceof type);
  }
  
  // Helper method to get the player entity
  getPlayer() {
    return this.entities.find(entity => entity.isPlayer);
  }
  
  // Handle game over
  gameOver() {
    this.stop();
    this.uiManager.showGameOver();
  }
  
  // Restart the game
  restart() {
    // Reset all entities and systems
    this.entities.forEach(entity => {
      if (entity.reset) entity.reset();
    });
    
    this.systems.forEach(system => {
      if (system.reset) system.reset();
    });
    
    // Reset enemy manager
    if (this.enemyManager) {
      this.enemyManager.reset();
    }
    
    // Reset UI
    if (this.uiManager) {
      this.uiManager.reset();
    }
    
    // Reset mission system
    if (this.missionSystem) {
      this.missionSystem.reset();
    }
    
    // Reset player metrics
    this.playerMetrics.reset();
    
    // Clear particles
    this.particleSystem.clear();
    
    // Reset performance monitor
    if (this.performanceMonitor) {
      // Reset optimization level to start fresh
      this.performanceMonitor.optimizationLevel = 0;
      this.performanceMonitor.removeAllOptimizations();
    }
    
    // Start the game again
    this.start();
  }
  
  // Toggle performance debug display
  togglePerformanceDisplay() {
    if (this.performanceMonitor) {
      this.performanceMonitor.toggleDebugDisplay();
    }
  }
  
  // Create explosion effect
  createExplosion(position, color, size = 1.0) {
    // Apply screen shake intensity setting
    const intensityMultiplier = this.visualSettings ? this.visualSettings.screenShakeIntensity : 1.0;
    
    return this.particleSystem.createExplosion(
      position,
      color,
      50 * size * intensityMultiplier,
      0.2 * size * intensityMultiplier,
      1.0
    );
  }
  
  // Create muzzle flash effect
  createMuzzleFlash(position, direction) {
    return this.particleSystem.createMuzzleFlash(
      position,
      direction,
      0xffff00,
      0.5,
      0.1
    );
  }
  
  // Create blood splatter effect
  createBloodSplatter(position, direction) {
    // Apply blood effects intensity setting
    const intensityMultiplier = this.visualSettings ? this.visualSettings.bloodEffectsIntensity : 1.0;
    
    // If blood effects are disabled, don't create the effect
    if (intensityMultiplier <= 0) return;
    
    return this.particleSystem.createBloodSplatter(
      position,
      direction,
      Math.floor(30 * intensityMultiplier),
      0.1 * intensityMultiplier,
      0.8
    );
  }
  
  // Show damage effect
  showDamageEffect(intensity = 1.0) {
    // Apply screen shake intensity setting
    const intensityMultiplier = this.visualSettings ? this.visualSettings.screenShakeIntensity : 1.0;
    
    this.postProcessing.showDamageEffect(intensity * intensityMultiplier);
  }
  
  // Show heal effect
  showHealEffect(intensity = 1.0) {
    this.postProcessing.showHealEffect(intensity);
  }
  
  // Emit game event
  emitEvent(eventName, data) {
    if (this.events) {
      this.events.emit(eventName, data);
    }
  }
}