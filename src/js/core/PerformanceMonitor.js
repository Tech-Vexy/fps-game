/**
 * Performance monitoring and optimization utility
 */
import * as THREE from 'three';

export class PerformanceMonitor {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    
    // Performance metrics
    this.frameTimeHistory = [];
    this.historySize = 60; // Track last 60 frames
    this.lastFrameTime = performance.now();
    this.currentFPS = 60;
    this.averageFPS = 60;
    
    // Performance thresholds
    this.lowPerformanceThreshold = 30; // FPS below this is considered low
    this.highPerformanceThreshold = 55; // FPS above this is considered high
    
    // Optimization state
    this.optimizationLevel = 0; // 0: none, 1: light, 2: medium, 3: aggressive
    this.optimizationsApplied = {
      reducedShadows: false,
      reducedParticles: false,
      reducedPostProcessing: false,
      reducedDrawDistance: false,
      disabledReflections: false,
      reducedPhysics: false
    };
    
    // Debug mode
    this.debugMode = false;
    this.debugElement = null;
    
    // Initialize debug display if needed
    if (this.debugMode) {
      this.initDebugDisplay();
    }
  }
  
  initDebugDisplay() {
    this.debugElement = document.createElement('div');
    this.debugElement.style.position = 'fixed';
    this.debugElement.style.top = '10px';
    this.debugElement.style.left = '10px';
    this.debugElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.debugElement.style.color = 'white';
    this.debugElement.style.padding = '10px';
    this.debugElement.style.fontFamily = 'monospace';
    this.debugElement.style.fontSize = '12px';
    this.debugElement.style.zIndex = '1000';
    document.body.appendChild(this.debugElement);
  }
  
  update() {
    // Calculate frame time and FPS
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // Add to history and remove oldest if needed
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.historySize) {
      this.frameTimeHistory.shift();
    }
    
    // Calculate current and average FPS
    this.currentFPS = 1000 / frameTime;
    this.averageFPS = 1000 / (this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length);
    
    // Check if we need to apply optimizations
    if (this.frameTimeHistory.length >= this.historySize) {
      this.checkPerformance();
    }
    
    // Update debug display
    if (this.debugMode && this.debugElement) {
      this.updateDebugDisplay();
    }
  }
  
  checkPerformance() {
    // If performance is low, apply optimizations
    if (this.averageFPS < this.lowPerformanceThreshold) {
      this.applyOptimizations();
    }
    // If performance is high, consider removing optimizations
    else if (this.averageFPS > this.highPerformanceThreshold && this.optimizationLevel > 0) {
      this.removeOptimizations();
    }
  }
  
  applyOptimizations() {
    // Don't apply more optimizations if we're already at max level
    if (this.optimizationLevel >= 3) return;
    
    this.optimizationLevel++;
    console.log(`Performance optimization level increased to ${this.optimizationLevel}`);
    
    // Apply optimizations based on current level
    switch (this.optimizationLevel) {
      case 1: // Light optimizations
        this.applyLightOptimizations();
        break;
      case 2: // Medium optimizations
        this.applyMediumOptimizations();
        break;
      case 3: // Aggressive optimizations
        this.applyAggressiveOptimizations();
        break;
    }
  }
  
  removeOptimizations() {
    // Don't remove optimizations if we're already at min level
    if (this.optimizationLevel <= 0) return;
    
    this.optimizationLevel--;
    console.log(`Performance optimization level decreased to ${this.optimizationLevel}`);
    
    // Remove optimizations based on new level
    switch (this.optimizationLevel) {
      case 0: // No optimizations
        this.removeAllOptimizations();
        break;
      case 1: // Light optimizations only
        this.removeMediumOptimizations();
        break;
      case 2: // Medium optimizations only
        this.removeAggressiveOptimizations();
        break;
    }
  }
  
  applyLightOptimizations() {
    // Reduce post-processing effects
    if (!this.optimizationsApplied.reducedPostProcessing) {
      if (this.gameEngine.postProcessing) {
        const settings = {
          bloom: false,
          noise: false,
          chromaticAberration: false
        };
        this.gameEngine.postProcessing.updateSettings(settings);
      }
      this.optimizationsApplied.reducedPostProcessing = true;
      console.log('Applied light optimization: Reduced post-processing effects');
    }
    
    // Reduce particle count
    if (!this.optimizationsApplied.reducedParticles) {
      if (this.gameEngine.particleSystem) {
        this.gameEngine.particleSystem.setQualityLevel('medium');
      }
      this.optimizationsApplied.reducedParticles = true;
      console.log('Applied light optimization: Reduced particle effects');
    }
  }
  
  applyMediumOptimizations() {
    // Apply light optimizations first
    this.applyLightOptimizations();
    
    // Reduce shadow quality
    if (!this.optimizationsApplied.reducedShadows) {
      if (this.gameEngine.renderer) {
        this.gameEngine.renderer.shadowMap.type = THREE.BasicShadowMap;
      }
      this.optimizationsApplied.reducedShadows = true;
      console.log('Applied medium optimization: Reduced shadow quality');
    }
    
    // Reduce draw distance
    if (!this.optimizationsApplied.reducedDrawDistance) {
      if (this.gameEngine.camera) {
        this.gameEngine.camera.far = 300; // Reduce from 500
        this.gameEngine.camera.updateProjectionMatrix();
      }
      this.optimizationsApplied.reducedDrawDistance = true;
      console.log('Applied medium optimization: Reduced draw distance');
    }
  }
  
  applyAggressiveOptimizations() {
    // Apply medium optimizations first
    this.applyMediumOptimizations();
    
    // Disable reflections
    if (!this.optimizationsApplied.disabledReflections) {
      // Disable any reflective materials in the scene
      if (this.gameEngine.scene) {
        this.gameEngine.scene.traverse(object => {
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => {
                if (mat.envMap) {
                  mat.envMap = null;
                  mat.needsUpdate = true;
                }
              });
            } else if (object.material.envMap) {
              object.material.envMap = null;
              object.material.needsUpdate = true;
            }
          }
        });
      }
      this.optimizationsApplied.disabledReflections = true;
      console.log('Applied aggressive optimization: Disabled reflections');
    }
    
    // Reduce physics updates
    if (!this.optimizationsApplied.reducedPhysics) {
      // Implement physics throttling
      if (this.gameEngine.particleSystem) {
        this.gameEngine.particleSystem.setQualityLevel('low');
      }
      this.optimizationsApplied.reducedPhysics = true;
      console.log('Applied aggressive optimization: Reduced physics and particles');
    }
  }
  
  removeAllOptimizations() {
    // Restore post-processing
    if (this.optimizationsApplied.reducedPostProcessing) {
      if (this.gameEngine.postProcessing) {
        const settings = {
          bloom: true,
          noise: true,
          chromaticAberration: true
        };
        this.gameEngine.postProcessing.updateSettings(settings);
      }
      this.optimizationsApplied.reducedPostProcessing = false;
    }
    
    // Restore particles
    if (this.optimizationsApplied.reducedParticles) {
      if (this.gameEngine.particleSystem) {
        this.gameEngine.particleSystem.setQualityLevel('high');
      }
      this.optimizationsApplied.reducedParticles = false;
    }
    
    // Restore shadows
    if (this.optimizationsApplied.reducedShadows) {
      if (this.gameEngine.renderer) {
        this.gameEngine.renderer.shadowMap.type = THREE.PCFShadowMap;
      }
      this.optimizationsApplied.reducedShadows = false;
    }
    
    // Restore draw distance
    if (this.optimizationsApplied.reducedDrawDistance) {
      if (this.gameEngine.camera) {
        this.gameEngine.camera.far = 500;
        this.gameEngine.camera.updateProjectionMatrix();
      }
      this.optimizationsApplied.reducedDrawDistance = false;
    }
    
    // Restore reflections
    this.optimizationsApplied.disabledReflections = false;
    
    // Restore physics
    this.optimizationsApplied.reducedPhysics = false;
    
    console.log('Removed all performance optimizations');
  }
  
  removeMediumOptimizations() {
    // Restore shadows
    if (this.optimizationsApplied.reducedShadows) {
      if (this.gameEngine.renderer) {
        this.gameEngine.renderer.shadowMap.type = THREE.PCFShadowMap;
      }
      this.optimizationsApplied.reducedShadows = false;
    }
    
    // Restore draw distance
    if (this.optimizationsApplied.reducedDrawDistance) {
      if (this.gameEngine.camera) {
        this.gameEngine.camera.far = 500;
        this.gameEngine.camera.updateProjectionMatrix();
      }
      this.optimizationsApplied.reducedDrawDistance = false;
    }
    
    // Keep light optimizations
    console.log('Removed medium performance optimizations');
  }
  
  removeAggressiveOptimizations() {
    // Restore reflections
    this.optimizationsApplied.disabledReflections = false;
    
    // Restore physics
    if (this.optimizationsApplied.reducedPhysics) {
      if (this.gameEngine.particleSystem) {
        this.gameEngine.particleSystem.setQualityLevel('medium');
      }
      this.optimizationsApplied.reducedPhysics = false;
    }
    
    // Keep medium optimizations
    console.log('Removed aggressive performance optimizations');
  }
  
  updateDebugDisplay() {
    if (!this.debugElement) return;
    
    this.debugElement.innerHTML = `
      <div>FPS: ${Math.round(this.currentFPS)}</div>
      <div>Avg FPS: ${Math.round(this.averageFPS)}</div>
      <div>Optimization Level: ${this.optimizationLevel}/3</div>
      <div>Optimizations:</div>
      <div>- Reduced Post-Processing: ${this.optimizationsApplied.reducedPostProcessing ? 'Yes' : 'No'}</div>
      <div>- Reduced Particles: ${this.optimizationsApplied.reducedParticles ? 'Yes' : 'No'}</div>
      <div>- Reduced Shadows: ${this.optimizationsApplied.reducedShadows ? 'Yes' : 'No'}</div>
      <div>- Reduced Draw Distance: ${this.optimizationsApplied.reducedDrawDistance ? 'Yes' : 'No'}</div>
      <div>- Disabled Reflections: ${this.optimizationsApplied.disabledReflections ? 'Yes' : 'No'}</div>
      <div>- Reduced Physics: ${this.optimizationsApplied.reducedPhysics ? 'Yes' : 'No'}</div>
    `;
  }
  
  toggleDebugDisplay() {
    this.debugMode = !this.debugMode;
    
    if (this.debugMode && !this.debugElement) {
      this.initDebugDisplay();
    } else if (!this.debugMode && this.debugElement) {
      document.body.removeChild(this.debugElement);
      this.debugElement = null;
    }
  }
}