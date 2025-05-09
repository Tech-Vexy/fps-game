import * as THREE from 'three';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  SMAAEffect,
  ToneMappingEffect,
  VignetteEffect,
  ChromaticAberrationEffect,
  NoiseEffect,
  DepthOfFieldEffect,
  SSAOEffect,
  GodRaysEffect,
  OutlineEffect,
  MotionBlurEffect,
  ShockWaveEffect,
  GlitchEffect,
  BlendFunction,
  KernelSize
} from 'postprocessing';

/**
 * PostProcessingEffects - Advanced post-processing effects for enhanced visuals
 * This class provides high-quality post-processing effects like bloom, SSAO,
 * depth of field, and more for a cinematic look.
 */
export class PostProcessingEffects {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.effects = {};
    this.passes = {};
    this.effectsEnabled = true;
    
    // Initialize composer
    this.initializeComposer();
    
    // Create default effects
    this.createDefaultEffects();
  }
  
  /**
   * Initialize the effect composer
   */
  initializeComposer() {
    // Create effect composer with HDR settings
    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType, // Better color precision for HDR effects
      multisampling: 4 // Enable multisampling for better quality
    });
    
    // Add render pass
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
  }
  
  /**
   * Create default post-processing effects
   */
  createDefaultEffects() {
    // Anti-aliasing (SMAA)
    this.effects.smaa = new SMAAEffect({
      preset: 1, // High quality
      edgeDetectionMode: 1 // Color detection
    });
    
    // Tone mapping
    this.effects.tonemap = new ToneMappingEffect({
      mode: 1, // ACES Filmic
      exposure: 1.0,
      whitePoint: 1.0
    });
    
    // Bloom
    this.effects.bloom = new BloomEffect({
      intensity: 1.0,
      luminanceThreshold: 0.85,
      luminanceSmoothing: 0.3,
      kernelSize: KernelSize.LARGE
    });
    
    // Vignette
    this.effects.vignette = new VignetteEffect({
      offset: 0.35,
      darkness: 0.5
    });
    
    // Chromatic aberration
    this.effects.chromaticAberration = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.001, 0.001)
    });
    
    // Noise
    this.effects.noise = new NoiseEffect({
      blendFunction: BlendFunction.OVERLAY,
      premultiply: true,
      opacity: 0.1
    });
    
    // Create passes
    this.passes.basePass = new EffectPass(
      this.camera,
      this.effects.smaa,
      this.effects.tonemap,
      this.effects.vignette
    );
    
    this.passes.bloomPass = new EffectPass(
      this.camera,
      this.effects.bloom
    );
    
    this.passes.chromaticAberrationPass = new EffectPass(
      this.camera,
      this.effects.chromaticAberration
    );
    
    this.passes.noisePass = new EffectPass(
      this.camera,
      this.effects.noise
    );
    
    // Add passes to composer
    this.composer.addPass(this.passes.basePass);
    this.composer.addPass(this.passes.bloomPass);
    this.composer.addPass(this.passes.chromaticAberrationPass);
    this.composer.addPass(this.passes.noisePass);
  }
  
  /**
   * Create advanced effects
   */
  createAdvancedEffects() {
    // Ambient occlusion (SSAO)
    this.effects.ssao = new SSAOEffect(this.camera, null, {
      blendFunction: BlendFunction.MULTIPLY,
      samples: 16,
      rings: 7,
      distanceThreshold: 1.0,
      distanceFalloff: 0.0,
      rangeThreshold: 0.5,
      rangeFalloff: 0.1,
      luminanceInfluence: 0.9,
      radius: 20,
      scale: 0.5,
      bias: 0.5
    });
    
    // Depth of field
    this.effects.depthOfField = new DepthOfFieldEffect(this.camera, {
      focusDistance: 0.0,
      focalLength: 0.05,
      bokehScale: 2.0,
      height: 480
    });
    
    // Motion blur
    this.effects.motionBlur = new MotionBlurEffect({
      blendFunction: BlendFunction.NORMAL,
      samples: 16,
      velocityScale: 1.0,
      jitter: 0.5
    });
    
    // Create passes
    this.passes.ssaoPass = new EffectPass(
      this.camera,
      this.effects.ssao
    );
    
    this.passes.depthOfFieldPass = new EffectPass(
      this.camera,
      this.effects.depthOfField
    );
    
    this.passes.motionBlurPass = new EffectPass(
      this.camera,
      this.effects.motionBlur
    );
    
    // Add passes to composer
    this.composer.addPass(this.passes.ssaoPass);
    this.composer.addPass(this.passes.depthOfFieldPass);
    this.composer.addPass(this.passes.motionBlurPass);
    
    // Disable by default (enable as needed)
    this.passes.ssaoPass.enabled = false;
    this.passes.depthOfFieldPass.enabled = false;
    this.passes.motionBlurPass.enabled = false;
  }
  
  /**
   * Create special effects
   */
  createSpecialEffects() {
    // Outline effect for highlighting objects
    this.effects.outline = new OutlineEffect(this.scene, this.camera, {
      blendFunction: BlendFunction.SCREEN,
      edgeStrength: 3.0,
      pulseSpeed: 0.0,
      visibleEdgeColor: 0xffffff,
      hiddenEdgeColor: 0x22090a,
      width: 1,
      height: 1,
      kernelSize: KernelSize.SMALL,
      blur: false,
      xRay: true
    });
    
    // Shock wave effect for explosions
    this.effects.shockWave = new ShockWaveEffect(this.camera, new THREE.Vector3(0, 0, 0), {
      speed: 1.25,
      maxRadius: 1.0,
      waveSize: 0.2,
      amplitude: 0.05
    });
    
    // Glitch effect for damage
    this.effects.glitch = new GlitchEffect({
      chromaticAberrationOffset: new THREE.Vector2(0.01, 0.01),
      delay: new THREE.Vector2(1.5, 3.5),
      duration: new THREE.Vector2(0.1, 0.3),
      strength: new THREE.Vector2(0.3, 0.7)
    });
    
    // Create passes
    this.passes.outlinePass = new EffectPass(
      this.camera,
      this.effects.outline
    );
    
    this.passes.specialEffectsPass = new EffectPass(
      this.camera,
      this.effects.shockWave,
      this.effects.glitch
    );
    
    // Add passes to composer
    this.composer.addPass(this.passes.outlinePass);
    this.composer.addPass(this.passes.specialEffectsPass);
    
    // Disable by default (enable as needed)
    this.passes.outlinePass.enabled = false;
    this.passes.specialEffectsPass.enabled = false;
    this.effects.shockWave.enabled = false;
    this.effects.glitch.enabled = false;
  }
  
  /**
   * Render the scene with post-processing
   * @param {number} deltaTime - Time since last frame
   */
  render(deltaTime) {
    if (this.effectsEnabled && this.composer) {
      // Update time-based effects
      this.updateEffects(deltaTime);
      
      // Render with post-processing
      this.composer.render(deltaTime);
    } else {
      // Render without post-processing
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  /**
   * Update time-based effects
   * @param {number} deltaTime - Time since last frame
   */
  updateEffects(deltaTime) {
    // Update dynamic effects
    if (this.dynamicEffects) {
      // Update damage effect
      if (this.dynamicEffects.damageEffect) {
        this.dynamicEffects.damageEffect.time -= deltaTime;
        
        if (this.dynamicEffects.damageEffect.time <= 0) {
          // Reset effects
          if (this.effects.vignette) {
            this.effects.vignette.offset = 0.35;
            this.effects.vignette.darkness = 0.5;
          }
          
          if (this.effects.chromaticAberration) {
            this.effects.chromaticAberration.offset.set(0.001, 0.001);
          }
          
          if (this.effects.glitch) {
            this.effects.glitch.enabled = false;
          }
          
          this.dynamicEffects.damageEffect = null;
        } else {
          // Apply damage effect
          const intensity = this.dynamicEffects.damageEffect.intensity * 
                           (this.dynamicEffects.damageEffect.time / this.dynamicEffects.damageEffect.duration);
          
          if (this.effects.vignette) {
            this.effects.vignette.offset = 0.35 - intensity * 0.2;
            this.effects.vignette.darkness = 0.5 + intensity * 0.3;
          }
          
          if (this.effects.chromaticAberration) {
            this.effects.chromaticAberration.offset.set(
              0.001 + intensity * 0.005,
              0.001 + intensity * 0.005
            );
          }
          
          if (this.effects.glitch && intensity > 0.5) {
            this.effects.glitch.enabled = true;
          }
        }
      }
      
      // Update heal effect
      if (this.dynamicEffects.healEffect) {
        this.dynamicEffects.healEffect.time -= deltaTime;
        
        if (this.dynamicEffects.healEffect.time <= 0) {
          // Reset effects
          if (this.effects.bloom) {
            this.effects.bloom.intensity = 1.0;
          }
          
          this.dynamicEffects.healEffect = null;
        } else {
          // Apply heal effect
          const intensity = this.dynamicEffects.healEffect.intensity * 
                           (this.dynamicEffects.healEffect.time / this.dynamicEffects.healEffect.duration);
          
          if (this.effects.bloom) {
            this.effects.bloom.intensity = 1.0 + intensity * 1.0;
          }
        }
      }
    }
  }
  
  /**
   * Show damage effect
   * @param {number} intensity - Effect intensity
   * @param {number} duration - Effect duration in seconds
   */
  showDamageEffect(intensity = 1.0, duration = 0.5) {
    if (!this.dynamicEffects) {
      this.dynamicEffects = {};
    }
    
    this.dynamicEffects.damageEffect = {
      intensity,
      duration,
      time: duration
    };
    
    // Enable glitch effect for strong hits
    if (intensity > 0.7 && this.effects.glitch) {
      this.effects.glitch.enabled = true;
    }
  }
  
  /**
   * Show heal effect
   * @param {number} intensity - Effect intensity
   * @param {number} duration - Effect duration in seconds
   */
  showHealEffect(intensity = 1.0, duration = 0.5) {
    if (!this.dynamicEffects) {
      this.dynamicEffects = {};
    }
    
    this.dynamicEffects.healEffect = {
      intensity,
      duration,
      time: duration
    };
  }
  
  /**
   * Show explosion effect
   * @param {THREE.Vector3} position - Explosion position
   * @param {number} intensity - Effect intensity
   */
  showExplosionEffect(position, intensity = 1.0) {
    if (this.effects.shockWave) {
      // Set explosion position
      this.effects.shockWave.position = position;
      this.effects.shockWave.speed = 1.25 * intensity;
      this.effects.shockWave.maxRadius = 1.0 * intensity;
      this.effects.shockWave.amplitude = 0.05 * intensity;
      
      // Trigger explosion
      this.effects.shockWave.explode();
      
      // Enable shock wave effect
      this.effects.shockWave.enabled = true;
    }
  }
  
  /**
   * Highlight an object with outline effect
   * @param {THREE.Object3D} object - Object to highlight
   * @param {boolean} highlight - Whether to highlight or unhighlight
   */
  highlightObject(object, highlight = true) {
    if (this.effects.outline) {
      if (highlight) {
        this.effects.outline.selection.add(object);
      } else {
        this.effects.outline.selection.delete(object);
      }
    }
  }
  
  /**
   * Update depth of field focus
   * @param {number} focusDistance - Focus distance
   * @param {number} focalLength - Focal length
   * @param {number} bokehScale - Bokeh scale
   */
  updateDepthOfField(focusDistance, focalLength, bokehScale) {
    if (this.effects.depthOfField) {
      this.effects.depthOfField.focusDistance = focusDistance;
      this.effects.depthOfField.focalLength = focalLength;
      this.effects.depthOfField.bokehScale = bokehScale;
    }
  }
  
  /**
   * Enable or disable all post-processing effects
   * @param {boolean} enabled - Whether effects should be enabled
   */
  setEffectsEnabled(enabled) {
    this.effectsEnabled = enabled;
  }
  
  /**
   * Update effect settings
   * @param {object} settings - Effect settings
   */
  updateSettings(settings) {
    // Update bloom
    if (settings.bloom !== undefined && this.effects.bloom) {
      this.effects.bloom.enabled = settings.bloom;
      
      if (settings.bloomIntensity !== undefined) {
        this.effects.bloom.intensity = settings.bloomIntensity;
      }
    }
    
    // Update chromatic aberration
    if (settings.chromaticAberration !== undefined && this.effects.chromaticAberration) {
      this.effects.chromaticAberration.enabled = settings.chromaticAberration;
      
      if (settings.chromaticAberrationIntensity !== undefined) {
        const intensity = settings.chromaticAberrationIntensity;
        this.effects.chromaticAberration.offset.set(intensity * 0.001, intensity * 0.001);
      }
    }
    
    // Update noise
    if (settings.noise !== undefined && this.effects.noise) {
      this.effects.noise.enabled = settings.noise;
      
      if (settings.noiseIntensity !== undefined) {
        this.effects.noise.opacity = settings.noiseIntensity * 0.1;
      }
    }
    
    // Update vignette
    if (settings.vignette !== undefined && this.effects.vignette) {
      this.effects.vignette.enabled = settings.vignette;
      
      if (settings.vignetteIntensity !== undefined) {
        const intensity = settings.vignetteIntensity;
        this.effects.vignette.offset = 0.35 + (1 - intensity) * 0.15;
        this.effects.vignette.darkness = intensity * 0.5;
      }
    }
    
    // Update motion blur
    if (settings.motionBlur !== undefined && this.effects.motionBlur) {
      this.effects.motionBlur.enabled = settings.motionBlur;
      
      if (settings.motionBlurIntensity !== undefined) {
        this.effects.motionBlur.velocityScale = settings.motionBlurIntensity;
      }
    }
    
    // Update SSAO
    if (settings.ssao !== undefined && this.effects.ssao) {
      this.effects.ssao.enabled = settings.ssao;
      
      if (settings.ssaoIntensity !== undefined) {
        this.effects.ssao.intensity = settings.ssaoIntensity;
      }
    }
    
    // Update depth of field
    if (settings.depthOfField !== undefined && this.effects.depthOfField) {
      this.effects.depthOfField.enabled = settings.depthOfField;
    }
    
    // Update tone mapping
    if (settings.toneMappingExposure !== undefined && this.effects.tonemap) {
      this.effects.tonemap.exposure = settings.toneMappingExposure;
    }
    
    // Recompile passes
    Object.values(this.passes).forEach(pass => {
      if (pass && pass.recompile) {
        pass.recompile();
      }
    });
  }
  
  /**
   * Resize the composer
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }
  
  /**
   * Dispose of all effects and passes
   */
  dispose() {
    if (this.composer) {
      this.composer.dispose();
    }
    
    Object.values(this.effects).forEach(effect => {
      if (effect && effect.dispose) {
        effect.dispose();
      }
    });
    
    Object.values(this.passes).forEach(pass => {
      if (pass && pass.dispose) {
        pass.dispose();
      }
    });
  }
}