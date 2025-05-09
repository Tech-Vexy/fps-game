import * as THREE from 'three';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  SMAAEffect,
  SMAAPreset,
  EdgeDetectionMode,
  ToneMappingEffect,
  VignetteEffect,
  ChromaticAberrationEffect,
  NoiseEffect,
  DepthOfFieldEffect,
  BlendFunction,
  KernelSize
} from 'postprocessing';

export class PostProcessingManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    
    // Initialize effects and passes objects
    this.effects = {};
    this.passes = {};
    
    // Performance monitoring
    this.lastFrameTime = performance.now();
    this.frameTimeHistory = [];
    this.frameTimeHistorySize = 30; // Track last 30 frames
    this.performanceMode = 'auto'; // 'low', 'medium', 'high', 'auto'
    
    this.effectSettings = {
      bloom: {
        enabled: true,
        strength: 0.8,
        threshold: 0.85,
        radius: 0.4
      },
      dof: {
        enabled: true,
        focusDistance: 5.0,
        focalLength: 70,
        bokehScale: 4.0,
        height: 480
      },
      tonemap: {
        enabled: true,
        exposure: 1.2,
        method: 'ACES' // ACES filmic tonemapping
      },
      ssao: {
        enabled: true,
        radius: 0.5,
        intensity: 0.5,
        bias: 0.025
      },
      motionBlur: {
        enabled: true,
        intensity: 0.1
      },
      chromaticAberration: {
        enabled: true,
        offset: 0.002
      }
    };
    
    // Settings - initialize before initEffects
    this.settings = {
      bloom: true,
      toneMappingExposure: 1.0,
      vignette: true,
      chromaticAberration: true,
      noise: true
    };
    
    // Create effect composer with HD settings
    this.composer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType, // Better color precision for HDR effects
      multisampling: 4 // Enable multisampling for better quality
    });
    
    // Add render pass
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);
    
    // Set up dynamic effects
    this.dynamicEffects = {
      damageEffect: null,
      healEffect: null
    };
    
    // Initialize effects
    this.initEffects();
    
    // Set initial quality based on device capabilities
    this.detectHardwareCapabilities();
  }
  
  detectHardwareCapabilities() {
    // Check if running on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check GPU capabilities (basic detection)
    const gl = this.renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    
    console.log('GPU detected:', renderer);
    
    // Set initial quality based on device
    if (isMobile) {
      this.setPerformanceMode('low');
      console.log('Mobile device detected, setting low quality post-processing');
    } else if (renderer.includes('Intel')) {
      this.setPerformanceMode('medium');
      console.log('Intel GPU detected, setting medium quality post-processing');
    } else {
      this.setPerformanceMode('high');
      console.log('Dedicated GPU detected, setting high quality post-processing');
    }
  }
  
  setPerformanceMode(mode) {
    this.performanceMode = mode;
    
    // Apply settings based on performance mode
    switch (mode) {
      case 'low':
        this.settings.bloom = false;
        this.settings.chromaticAberration = false;
        this.settings.noise = false;
        break;
      case 'medium':
        this.settings.bloom = true;
        this.settings.chromaticAberration = false;
        this.settings.noise = false;
        break;
      case 'high':
        this.settings.bloom = true;
        this.settings.chromaticAberration = true;
        this.settings.noise = true;
        break;
      case 'auto':
        // Will be adjusted dynamically based on frame rate
        break;
    }
    
    // Apply the new settings
    this.updateSettings(this.settings);
  }
  
  initEffects() {
    try {
      // We already initialized the composer in the constructor, no need to recreate it
      
      // Add render pass (if not already added in constructor)
      if (!this.renderPass) {
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
      }
      
      // Create bloom effect
      const bloomEffect = new BloomEffect({
        intensity: 1.0,
        luminanceThreshold: 0.85,
        luminanceSmoothing: 0.3,
        kernelSize: KernelSize.LARGE
      });
      this.effects.bloom = bloomEffect;
      
      // Create chromatic aberration effect
      const chromaticAberrationEffect = new ChromaticAberrationEffect({
        offset: new THREE.Vector2(0.001, 0.001)
      });
      this.effects.chromaticAberration = chromaticAberrationEffect;
      
      // Create noise effect
      const noiseEffect = new NoiseEffect({
        blendFunction: BlendFunction.OVERLAY,
        premultiply: true
      });
      this.effects.noise = noiseEffect;
      
      // Create vignette effect
      const vignetteEffect = new VignetteEffect({
        offset: 0.35,
        darkness: 0.5
      });
      this.effects.vignette = vignetteEffect;
      
      // Create tone mapping effect
      const toneMappingEffect = new ToneMappingEffect({
        mode: 1, // ACES Filmic
        exposure: 1.0
      });
      this.effects.toneMapping = toneMappingEffect;
      
      // Create SMAA effect for anti-aliasing
      const smaaEffect = new SMAAEffect({
        preset: SMAAPreset.HIGH,
        edgeDetectionMode: EdgeDetectionMode.COLOR
      });
      
      // Create effect passes
      this.effects.basePass = new EffectPass(this.camera, smaaEffect, toneMappingEffect, vignetteEffect);
      this.effects.bloomPass = new EffectPass(this.camera, bloomEffect);
      this.effects.chromaticAberrationPass = new EffectPass(this.camera, chromaticAberrationEffect);
      this.effects.noisePass = new EffectPass(this.camera, noiseEffect);
      
      // Add passes to composer
      this.composer.addPass(this.effects.basePass);
      this.composer.addPass(this.effects.bloomPass);
      this.composer.addPass(this.effects.chromaticAberrationPass);
      this.composer.addPass(this.effects.noisePass);
      
      // Apply initial settings - use a safe version that checks for null/undefined
      this.safeUpdateSettings(this.settings);
    } catch (error) {
      console.error('Error initializing post-processing effects:', error);
      // Create a minimal setup to avoid breaking the game
      this.createMinimalEffects();
    }
  }
  
  // Fallback method to create minimal effects if the full setup fails
  createMinimalEffects() {
    console.log('Creating minimal post-processing setup');
    // Clear any partial setup
    this.composer = new EffectComposer(this.renderer);
    
    // Just add a render pass to keep the game running
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Set minimal effects
    this.effects = {
      bloom: { enabled: false },
      chromaticAberration: { enabled: false },
      noise: { enabled: false },
      vignette: { enabled: false },
      toneMapping: { exposure: 1.0 }
    };
  }
  
  // A safer version of updateSettings that won't crash if objects are undefined
  safeUpdateSettings(settings) {
    if (!settings) return;
    
    // Make sure this.settings exists
    if (!this.settings) {
      this.settings = {
        bloom: false,
        toneMappingExposure: 1.0,
        vignette: false,
        chromaticAberration: false,
        noise: false
      };
    }
    
    // Update settings
    Object.assign(this.settings, settings);
    
    // Safely apply settings if effects exist
    if (this.effects) {
      if (this.effects.bloom) this.effects.bloom.enabled = !!this.settings.bloom;
      if (this.effects.toneMapping) this.effects.toneMapping.exposure = this.settings.toneMappingExposure || 1.0;
      if (this.effects.vignette) this.effects.vignette.enabled = !!this.settings.vignette;
      if (this.effects.chromaticAberration) this.effects.chromaticAberration.enabled = !!this.settings.chromaticAberration;
      if (this.effects.noise) this.effects.noise.enabled = !!this.settings.noise;
    }
  }
  
  resize(width, height) {
    this.composer.setSize(width, height);
  }
  
  render(deltaTime) {
    // Track frame time for performance monitoring
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // Add to history and remove oldest if needed
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.frameTimeHistorySize) {
      this.frameTimeHistory.shift();
    }
    
    // Every 60 frames, check if we need to adjust quality in auto mode
    if (this.performanceMode === 'auto' && this.frameTimeHistory.length >= this.frameTimeHistorySize) {
      this.adjustQualityBasedOnPerformance();
    }
    
    // Update dynamic effects
    this.updateDynamicEffects(deltaTime);
    
    // Render the scene with post-processing
    this.composer.render(deltaTime);
  }
  
  adjustQualityBasedOnPerformance() {
    // Calculate average frame time
    const avgFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length;
    const estimatedFPS = 1000 / avgFrameTime;
    
    // Adjust quality based on frame rate
    if (estimatedFPS < 30) {
      // Poor performance, reduce quality
      if (this.settings.noise) {
        this.settings.noise = false;
        this.updateSettings(this.settings);
        console.log('Performance optimization: Disabled noise effect');
        return;
      }
      
      if (this.settings.chromaticAberration) {
        this.settings.chromaticAberration = false;
        this.updateSettings(this.settings);
        console.log('Performance optimization: Disabled chromatic aberration');
        return;
      }
      
      if (this.settings.bloom) {
        this.settings.bloom = false;
        this.updateSettings(this.settings);
        console.log('Performance optimization: Disabled bloom effect');
        return;
      }
    } 
    else if (estimatedFPS > 55) {
      // Good performance, we can increase quality
      if (!this.settings.bloom) {
        this.settings.bloom = true;
        this.updateSettings(this.settings);
        console.log('Performance good: Enabled bloom effect');
        return;
      }
      
      if (!this.settings.chromaticAberration && estimatedFPS > 75) {
        this.settings.chromaticAberration = true;
        this.updateSettings(this.settings);
        console.log('Performance excellent: Enabled chromatic aberration');
        return;
      }
      
      if (!this.settings.noise && estimatedFPS > 90) {
        this.settings.noise = true;
        this.updateSettings(this.settings);
        console.log('Performance outstanding: Enabled noise effect');
        return;
      }
    }
  }
  
  updateDynamicEffects(deltaTime) {
    // Update damage effect
    if (this.dynamicEffects.damageEffect) {
      this.dynamicEffects.damageEffect.time -= deltaTime;
      
      if (this.dynamicEffects.damageEffect.time <= 0) {
        this.effects.vignette.offset = 0.35;
        this.effects.vignette.darkness = 0.5;
        this.effects.chromaticAberration.offset.set(0.001, 0.001);
        this.dynamicEffects.damageEffect = null;
      } else {
        const intensity = this.dynamicEffects.damageEffect.intensity * 
                         (this.dynamicEffects.damageEffect.time / this.dynamicEffects.damageEffect.duration);
        
        this.effects.vignette.offset = 0.35 - intensity * 0.2;
        this.effects.vignette.darkness = 0.5 + intensity * 0.3;
        this.effects.chromaticAberration.offset.set(
          0.001 + intensity * 0.005,
          0.001 + intensity * 0.005
        );
      }
    }
    
    // Update heal effect
    if (this.dynamicEffects.healEffect) {
      this.dynamicEffects.healEffect.time -= deltaTime;
      
      if (this.dynamicEffects.healEffect.time <= 0) {
        this.effects.bloom.intensity = 0.5;
        this.dynamicEffects.healEffect = null;
      } else {
        const intensity = this.dynamicEffects.healEffect.intensity * 
                         (this.dynamicEffects.healEffect.time / this.dynamicEffects.healEffect.duration);
        
        this.effects.bloom.intensity = 0.5 + intensity * 0.5;
      }
    }
  }
  
  showDamageEffect(intensity = 1.0, duration = 0.5) {
    this.dynamicEffects.damageEffect = {
      intensity,
      duration,
      time: duration
    };
  }
  
  showHealEffect(intensity = 1.0, duration = 0.5) {
    this.dynamicEffects.healEffect = {
      intensity,
      duration,
      time: duration
    };
  }
  
  updateSettings(settings) {
    try {
      // Make sure this.settings is initialized
      if (!this.settings) {
        this.settings = {
          bloom: true,
          toneMappingExposure: 1.0,
          vignette: true,
          chromaticAberration: true,
          noise: true
        };
      }
      
      // Update settings
      if (settings) {
        Object.assign(this.settings, settings);
      }
      
      // Make sure effects are initialized
      if (!this.effects) {
        console.warn('Effects not initialized yet, skipping settings update');
        return;
      }
      
      // Apply settings
      if (this.effects.bloom) this.effects.bloom.enabled = !!this.settings.bloom;
      if (this.effects.toneMapping) this.effects.toneMapping.exposure = this.settings.toneMappingExposure || 1.0;
      if (this.effects.vignette) this.effects.vignette.enabled = !!this.settings.vignette;
      if (this.effects.chromaticAberration) this.effects.chromaticAberration.enabled = !!this.settings.chromaticAberration;
      if (this.effects.noise) this.effects.noise.enabled = !!this.settings.noise;
      
      // Update effect passes if they exist
      try {
        if (this.effects.basePass) this.effects.basePass.recompile();
        if (this.effects.bloomPass) this.effects.bloomPass.recompile();
        if (this.effects.chromaticAberrationPass) this.effects.chromaticAberrationPass.recompile();
        if (this.effects.noisePass) this.effects.noisePass.recompile();
      } catch (passError) {
        console.warn('Error recompiling effect passes:', passError);
      }
    } catch (error) {
      console.error('Error updating post-processing settings:', error);
    }
  }
}