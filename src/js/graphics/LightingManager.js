import * as THREE from 'three';

/**
 * Manages modern lighting setup for the game
 * Compatible with Three.js r155+ lighting system
 */
export class LightingManager {
  constructor(scene) {
    this.scene = scene;
    this.lights = [];
    
    // Store light settings for dynamic adjustments
    this.settings = {
      ambientIntensity: 0.5,
      directionalIntensity: 1.0,
      shadowResolution: 2048,
      shadowSoftness: 1.5
    };
  }
  
  /**
   * Initialize the main lighting setup
   */
  initMainLighting() {
    // Clear any existing lights
    this.clearLights();
    
    // Enhanced ambient light with subtle color
    const ambientLight = new THREE.AmbientLight(0x404050, this.settings.ambientIntensity);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);
    
    // Add hemisphere light for more natural outdoor lighting
    const hemisphereLight = new THREE.HemisphereLight(0x88bbff, 0x443333, 0.5);
    this.scene.add(hemisphereLight);
    this.lights.push(hemisphereLight);
    
    // Directional light (sun) - HD shadow settings
    const directionalLight = new THREE.DirectionalLight(0xffffeb, this.settings.directionalIntensity);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    
    // Configure shadow properties with HD settings
    directionalLight.shadow.mapSize.width = this.settings.shadowResolution;
    directionalLight.shadow.mapSize.height = this.settings.shadowResolution;
    directionalLight.shadow.camera.near = 10;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.bias = -0.0005; // Reduce shadow acne
    directionalLight.shadow.normalBias = 0.02; // Improve shadow quality on thin objects
    directionalLight.shadow.radius = this.settings.shadowSoftness; // Add slight blur to shadows for softer edges
    
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);
    
    return this;
  }
  
  /**
   * Add atmospheric point lights
   * @param {number} count - Number of point lights to add
   */
  addAtmosphericLights(count = 3) {
    const colors = [
      { color: 0xff5500, intensity: 0.8, distance: 25, decay: 2 }, // Warm orange
      { color: 0x4488ff, intensity: 0.7, distance: 20, decay: 2 }, // Cool blue
      { color: 0x22ff88, intensity: 0.6, distance: 15, decay: 2 }  // Teal green
    ];
    
    for (let i = 0; i < Math.min(count, colors.length); i++) {
      const pointLight = new THREE.PointLight(
        colors[i].color, 
        colors[i].intensity, 
        colors[i].distance,
        colors[i].decay
      );
      
      pointLight.position.set(
        Math.random() * 40 - 20,
        Math.random() * 5 + 2,
        Math.random() * 40 - 20
      );
      
      // Enable shadows on the first point light only (for performance)
      if (i === 0) {
        pointLight.castShadow = true;
        pointLight.shadow.mapSize.width = 1024;
        pointLight.shadow.mapSize.height = 1024;
        pointLight.shadow.bias = -0.001;
        pointLight.shadow.radius = 2;
      }
      
      this.scene.add(pointLight);
      this.lights.push(pointLight);
    }
    
    return this;
  }
  
  /**
   * Add a spotlight at a specific position
   * @param {THREE.Vector3} position - Position of the spotlight
   * @param {THREE.Vector3} target - Target position for the spotlight to point at
   * @param {Object} options - Spotlight options
   */
  addSpotlight(position, target, options = {}) {
    const color = options.color || 0xffffff;
    const intensity = options.intensity || 1.0;
    const distance = options.distance || 30;
    const angle = options.angle || Math.PI / 6;
    const penumbra = options.penumbra || 0.2;
    const decay = options.decay || 2;
    
    const spotlight = new THREE.SpotLight(
      color, intensity, distance, angle, penumbra, decay
    );
    
    spotlight.position.copy(position);
    
    if (target) {
      const targetObject = new THREE.Object3D();
      targetObject.position.copy(target);
      this.scene.add(targetObject);
      spotlight.target = targetObject;
    }
    
    if (options.castShadow) {
      spotlight.castShadow = true;
      spotlight.shadow.mapSize.width = 1024;
      spotlight.shadow.mapSize.height = 1024;
      spotlight.shadow.camera.near = 0.5;
      spotlight.shadow.camera.far = distance + 10;
      spotlight.shadow.bias = -0.0005;
    }
    
    this.scene.add(spotlight);
    this.lights.push(spotlight);
    
    return spotlight;
  }
  
  /**
   * Update lighting settings
   * @param {Object} settings - New lighting settings
   */
  updateSettings(settings = {}) {
    // Update settings
    Object.assign(this.settings, settings);
    
    // Apply settings to existing lights
    this.lights.forEach(light => {
      if (light.isAmbientLight) {
        light.intensity = this.settings.ambientIntensity;
      } else if (light.isDirectionalLight) {
        light.intensity = this.settings.directionalIntensity;
        
        if (light.shadow) {
          light.shadow.mapSize.width = this.settings.shadowResolution;
          light.shadow.mapSize.height = this.settings.shadowResolution;
          light.shadow.radius = this.settings.shadowSoftness;
        }
      }
    });
    
    return this;
  }
  
  /**
   * Clear all lights from the scene
   */
  clearLights() {
    this.lights.forEach(light => {
      this.scene.remove(light);
      if (light.target && light.target.parent) {
        this.scene.remove(light.target);
      }
    });
    
    this.lights = [];
    return this;
  }
  
  /**
   * Adjust lighting for different times of day
   * @param {string} timeOfDay - 'dawn', 'day', 'dusk', or 'night'
   */
  setTimeOfDay(timeOfDay) {
    // Clear existing lights
    this.clearLights();
    
    // Set up new lighting based on time of day
    switch (timeOfDay) {
      case 'dawn':
        // Soft morning light with orange/pink tint
        this.settings.ambientIntensity = 0.3;
        this.settings.directionalIntensity = 0.7;
        this.initMainLighting();
        this.lights[0].color.set(0x7a6a7a); // Ambient
        this.lights[1].groundColor.set(0x3a2a1a); // Hemisphere ground
        this.lights[1].skyColor.set(0xffb0a0); // Hemisphere sky
        this.lights[2].color.set(0xffc0a0); // Directional (sun)
        this.addAtmosphericLights(2);
        break;
        
      case 'day':
        // Bright daylight
        this.settings.ambientIntensity = 0.6;
        this.settings.directionalIntensity = 1.2;
        this.initMainLighting();
        this.lights[0].color.set(0x404050); // Ambient
        this.lights[1].groundColor.set(0x443333); // Hemisphere ground
        this.lights[1].skyColor.set(0x88bbff); // Hemisphere sky
        this.lights[2].color.set(0xffffeb); // Directional (sun)
        this.addAtmosphericLights(1);
        break;
        
      case 'dusk':
        // Warm evening light
        this.settings.ambientIntensity = 0.4;
        this.settings.directionalIntensity = 0.8;
        this.initMainLighting();
        this.lights[0].color.set(0x503030); // Ambient
        this.lights[1].groundColor.set(0x442211); // Hemisphere ground
        this.lights[1].skyColor.set(0xff9955); // Hemisphere sky
        this.lights[2].color.set(0xff7700); // Directional (sun)
        this.addAtmosphericLights(3);
        break;
        
      case 'night':
        // Dark blue night with moonlight
        this.settings.ambientIntensity = 0.2;
        this.settings.directionalIntensity = 0.3;
        this.initMainLighting();
        this.lights[0].color.set(0x101025); // Ambient
        this.lights[1].groundColor.set(0x111122); // Hemisphere ground
        this.lights[1].skyColor.set(0x3344bb); // Hemisphere sky
        this.lights[2].color.set(0xaabbff); // Directional (moon)
        this.addAtmosphericLights(3);
        break;
        
      default:
        this.initMainLighting();
        this.addAtmosphericLights(3);
    }
    
    return this;
  }
}