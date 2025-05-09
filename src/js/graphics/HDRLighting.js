import * as THREE from 'three';

/**
 * HDRLighting - Provides high-dynamic-range lighting for realistic illumination
 * This class creates advanced lighting setups with physically correct properties,
 * shadows, and atmospheric effects.
 */
export class HDRLighting {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.lights = [];
    this.shadowMapSize = 2048; // High-resolution shadow maps
    this.shadowBias = -0.0005;
    
    // Configure renderer for HDR lighting
    this.configureRenderer();
  }
  
  /**
   * Configure renderer for HDR lighting
   */
  configureRenderer() {
    if (!this.renderer) return;
    
    // Enable physically correct lighting
    this.renderer.physicallyCorrectLights = true;
    
    // Configure shadow maps
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Configure tone mapping
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // Configure output encoding
    this.renderer.outputEncoding = THREE.sRGBEncoding;
  }
  
  /**
   * Create a main directional light with high-quality shadows
   * @param {object} options - Light options
   * @returns {THREE.DirectionalLight} The created light
   */
  createMainLight(options = {}) {
    const color = options.color || 0xffffff;
    const intensity = options.intensity || 1.0;
    const position = options.position || new THREE.Vector3(10, 20, 10);
    
    // Create directional light
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.copy(position);
    
    // Configure shadows
    light.castShadow = true;
    light.shadow.mapSize.width = this.shadowMapSize;
    light.shadow.mapSize.height = this.shadowMapSize;
    
    // Optimize shadow camera
    const shadowCameraSize = options.shadowCameraSize || 20;
    light.shadow.camera.left = -shadowCameraSize;
    light.shadow.camera.right = shadowCameraSize;
    light.shadow.camera.top = shadowCameraSize;
    light.shadow.camera.bottom = -shadowCameraSize;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 100;
    
    // Improve shadow quality
    light.shadow.bias = this.shadowBias;
    light.shadow.normalBias = 0.05;
    light.shadow.radius = 2;
    
    // Add light to scene
    this.scene.add(light);
    this.lights.push(light);
    
    return light;
  }
  
  /**
   * Create an ambient light for fill lighting
   * @param {object} options - Light options
   * @returns {THREE.AmbientLight} The created light
   */
  createAmbientLight(options = {}) {
    const color = options.color || 0x404040;
    const intensity = options.intensity || 0.5;
    
    // Create ambient light
    const light = new THREE.AmbientLight(color, intensity);
    
    // Add light to scene
    this.scene.add(light);
    this.lights.push(light);
    
    return light;
  }
  
  /**
   * Create a hemisphere light for natural outdoor lighting
   * @param {object} options - Light options
   * @returns {THREE.HemisphereLight} The created light
   */
  createHemisphereLight(options = {}) {
    const skyColor = options.skyColor || 0x0077ff;
    const groundColor = options.groundColor || 0x775533;
    const intensity = options.intensity || 0.7;
    
    // Create hemisphere light
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    
    // Add light to scene
    this.scene.add(light);
    this.lights.push(light);
    
    return light;
  }
  
  /**
   * Create a point light with shadows
   * @param {object} options - Light options
   * @returns {THREE.PointLight} The created light
   */
  createPointLight(options = {}) {
    const color = options.color || 0xffffff;
    const intensity = options.intensity || 1.0;
    const position = options.position || new THREE.Vector3(0, 5, 0);
    const distance = options.distance || 20;
    const decay = options.decay || 2; // Physically correct decay
    
    // Create point light
    const light = new THREE.PointLight(color, intensity, distance, decay);
    light.position.copy(position);
    
    // Configure shadows
    if (options.castShadow !== false) {
      light.castShadow = true;
      light.shadow.mapSize.width = this.shadowMapSize / 2; // Smaller for performance
      light.shadow.mapSize.height = this.shadowMapSize / 2;
      light.shadow.bias = this.shadowBias;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = distance;
    }
    
    // Add light to scene
    this.scene.add(light);
    this.lights.push(light);
    
    return light;
  }
  
  /**
   * Create a spotlight with shadows
   * @param {object} options - Light options
   * @returns {THREE.SpotLight} The created light
   */
  createSpotLight(options = {}) {
    const color = options.color || 0xffffff;
    const intensity = options.intensity || 1.0;
    const position = options.position || new THREE.Vector3(0, 10, 0);
    const target = options.target || new THREE.Vector3(0, 0, 0);
    const angle = options.angle || Math.PI / 6;
    const penumbra = options.penumbra || 0.5;
    const distance = options.distance || 30;
    const decay = options.decay || 2; // Physically correct decay
    
    // Create spotlight
    const light = new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
    light.position.copy(position);
    
    // Set target
    light.target.position.copy(target);
    this.scene.add(light.target);
    
    // Configure shadows
    if (options.castShadow !== false) {
      light.castShadow = true;
      light.shadow.mapSize.width = this.shadowMapSize / 2; // Smaller for performance
      light.shadow.mapSize.height = this.shadowMapSize / 2;
      light.shadow.bias = this.shadowBias;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = distance;
    }
    
    // Add light to scene
    this.scene.add(light);
    this.lights.push(light);
    
    return light;
  }
  
  /**
   * Create a rect area light for soft area lighting
   * @param {object} options - Light options
   * @returns {THREE.RectAreaLight} The created light
   */
  createRectAreaLight(options = {}) {
    const color = options.color || 0xffffff;
    const intensity = options.intensity || 5.0;
    const width = options.width || 5;
    const height = options.height || 5;
    const position = options.position || new THREE.Vector3(0, 5, 0);
    const lookAt = options.lookAt || new THREE.Vector3(0, 0, 0);
    
    // Create rect area light
    const light = new THREE.RectAreaLight(color, intensity, width, height);
    light.position.copy(position);
    light.lookAt(lookAt);
    
    // Add light to scene
    this.scene.add(light);
    this.lights.push(light);
    
    return light;
  }
  
  /**
   * Create volumetric light rays (god rays)
   * @param {object} options - Light options
   * @returns {object} The created light effect
   */
  createVolumetricLight(options = {}) {
    const position = options.position || new THREE.Vector3(0, 10, 0);
    const color = options.color || 0xffffff;
    const intensity = options.intensity || 1.0;
    const radius = options.radius || 5;
    
    // Create light source
    const light = this.createSpotLight({
      color: color,
      intensity: intensity * 2,
      position: position,
      angle: Math.PI / 6,
      penumbra: 0.5,
      distance: 30,
      castShadow: true
    });
    
    // Create volumetric effect using particles
    const particleCount = 100;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      
      positions[i3] = position.x + Math.cos(angle) * r;
      positions[i3 + 1] = position.y - Math.random() * 10;
      positions[i3 + 2] = position.z + Math.sin(angle) * r;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: color,
      size: 0.2,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    this.scene.add(particleSystem);
    
    return {
      light: light,
      particles: particleSystem,
      update: (time) => {
        // Animate particles
        const positions = particles.attributes.position.array;
        
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          positions[i3 + 1] -= 0.02;
          
          // Reset particle if it goes too low
          if (positions[i3 + 1] < position.y - 10) {
            positions[i3 + 1] = position.y;
          }
        }
        
        particles.attributes.position.needsUpdate = true;
        
        // Animate light intensity
        light.intensity = intensity * 2 * (0.8 + Math.sin(time * 2) * 0.2);
      }
    };
  }
  
  /**
   * Create a complete lighting setup for a scene
   * @param {string} preset - Lighting preset ('day', 'night', 'indoor', 'dramatic')
   * @returns {object} The created lights
   */
  createLightingSetup(preset = 'day') {
    const lights = {};
    
    switch (preset) {
      case 'day':
        // Bright directional sunlight with soft shadows
        lights.main = this.createMainLight({
          color: 0xffffeb,
          intensity: 1.0,
          position: new THREE.Vector3(10, 20, 10),
          shadowCameraSize: 30
        });
        
        lights.ambient = this.createHemisphereLight({
          skyColor: 0x80b0ff,
          groundColor: 0x80b080,
          intensity: 0.7
        });
        
        // Add some fill light
        lights.fill = this.createDirectionalLight({
          color: 0xffffeb,
          intensity: 0.3,
          position: new THREE.Vector3(-10, 10, -10),
          castShadow: false
        });
        break;
        
      case 'night':
        // Moonlight with deep shadows
        lights.moon = this.createMainLight({
          color: 0x8080ff,
          intensity: 0.3,
          position: new THREE.Vector3(10, 20, 10),
          shadowCameraSize: 30
        });
        
        lights.ambient = this.createAmbientLight({
          color: 0x101020,
          intensity: 0.2
        });
        
        // Add some point lights for interest
        lights.point1 = this.createPointLight({
          color: 0xff8800,
          intensity: 1.0,
          position: new THREE.Vector3(5, 2, 5),
          distance: 15
        });
        
        lights.point2 = this.createPointLight({
          color: 0x0088ff,
          intensity: 0.7,
          position: new THREE.Vector3(-5, 2, -5),
          distance: 10
        });
        break;
        
      case 'indoor':
        // Soft indoor lighting
        lights.ambient = this.createAmbientLight({
          color: 0xffffff,
          intensity: 0.4
        });
        
        lights.main = this.createRectAreaLight({
          color: 0xffffff,
          intensity: 3.0,
          width: 10,
          height: 5,
          position: new THREE.Vector3(0, 5, 0),
          lookAt: new THREE.Vector3(0, 0, 0)
        });
        
        // Add some accent lights
        lights.accent1 = this.createPointLight({
          color: 0xffcc88,
          intensity: 0.8,
          position: new THREE.Vector3(5, 2, 5),
          distance: 8
        });
        
        lights.accent2 = this.createPointLight({
          color: 0x8888ff,
          intensity: 0.5,
          position: new THREE.Vector3(-5, 2, -5),
          distance: 8
        });
        break;
        
      case 'dramatic':
        // High-contrast dramatic lighting
        lights.key = this.createSpotLight({
          color: 0xffffff,
          intensity: 1.5,
          position: new THREE.Vector3(10, 15, 10),
          target: new THREE.Vector3(0, 0, 0),
          angle: Math.PI / 8,
          penumbra: 0.2,
          distance: 30
        });
        
        lights.fill = this.createDirectionalLight({
          color: 0x8080ff,
          intensity: 0.2,
          position: new THREE.Vector3(-10, 5, -10),
          castShadow: false
        });
        
        lights.ambient = this.createAmbientLight({
          color: 0x101010,
          intensity: 0.1
        });
        
        // Add volumetric light
        lights.volumetric = this.createVolumetricLight({
          position: new THREE.Vector3(5, 10, 5),
          color: 0xffffcc,
          intensity: 1.0,
          radius: 3
        });
        break;
        
      default:
        console.warn(`Unknown lighting preset: ${preset}, using 'day' instead`);
        return this.createLightingSetup('day');
    }
    
    return lights;
  }
  
  /**
   * Update time-based lighting effects
   * @param {number} time - Current time
   */
  update(time) {
    // Update volumetric lights
    this.lights.forEach(light => {
      if (light.update) {
        light.update(time);
      }
    });
  }
  
  /**
   * Dispose of all lights
   */
  dispose() {
    this.lights.forEach(light => {
      if (light.dispose) {
        light.dispose();
      }
      if (light.parent) {
        light.parent.remove(light);
      }
    });
    
    this.lights = [];
  }
}