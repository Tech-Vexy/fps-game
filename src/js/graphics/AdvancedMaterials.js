import * as THREE from 'three';

/**
 * AdvancedMaterials - Provides high-quality PBR materials for game entities
 * This class creates physically-based rendering materials with advanced features
 * like subsurface scattering, normal mapping, and environment reflections.
 */
export class AdvancedMaterials {
  constructor(renderer, textureLoader) {
    this.renderer = renderer;
    this.textureLoader = textureLoader;
    this.materialCache = new Map();
    this.defaultEnvMap = null;
    
    // Initialize material library
    this.initializeMaterialLibrary();
  }
  
  /**
   * Initialize the material library with common textures and environment maps
   */
  async initializeMaterialLibrary() {
    // Create a default environment map for reflections
    this.defaultEnvMap = await this.createDefaultEnvironmentMap();
    
    // Load common textures
    this.commonTextures = {
      noise: await this.loadTexture('textures/noise.png'),
      scratches: await this.loadTexture('textures/scratches.png'),
      dirt: await this.loadTexture('textures/dirt.png')
    };
  }
  
  /**
   * Create a default environment map for reflections
   * @returns {THREE.Texture} The environment map
   */
  async createDefaultEnvironmentMap() {
    // Create a simple procedural environment map
    const size = 256;
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(size, {
      format: THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter
    });
    
    const scene = new THREE.Scene();
    const camera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    
    // Create a simple gradient sky
    const colors = [
      new THREE.Color(0x0077ff), // Top
      new THREE.Color(0xffffff)  // Bottom
    ];
    
    const skyGeometry = new THREE.SphereGeometry(100, 32, 32);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: colors[0] },
        bottomColor: { value: colors[1] },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    
    // Add some simple clouds
    const cloudGeometry = new THREE.PlaneGeometry(200, 200, 1, 1);
    const cloudMaterial = new THREE.MeshBasicMaterial({
      map: await this.loadTexture('textures/clouds.png'),
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    clouds.rotation.x = Math.PI / 2;
    clouds.position.y = 50;
    scene.add(clouds);
    
    // Render the environment map
    camera.update(this.renderer, scene);
    
    return cubeRenderTarget.texture;
  }
  
  /**
   * Load a texture with optimized settings
   * @param {string} path - Path to the texture
   * @returns {Promise<THREE.Texture>} The loaded texture
   */
  async loadTexture(path) {
    return new Promise((resolve) => {
      try {
        this.textureLoader.load(
          path,
          (texture) => {
            // Optimize texture settings
            texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.encoding = THREE.sRGBEncoding;
            texture.generateMipmaps = true;
            resolve(texture);
          },
          undefined,
          () => {
            console.warn(`Failed to load texture: ${path}`);
            resolve(null);
          }
        );
      } catch (error) {
        console.warn(`Error loading texture: ${path}`, error);
        resolve(null);
      }
    });
  }
  
  /**
   * Create a PBR material for an enemy
   * @param {string} type - Enemy type
   * @param {object} options - Material options
   * @returns {THREE.Material} The created material
   */
  createEnemyMaterial(type, options = {}) {
    const cacheKey = `enemy_${type}_${JSON.stringify(options)}`;
    
    // Return cached material if available
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey).clone();
    }
    
    // Base material properties
    const baseColor = options.color || 0xff0000;
    const roughness = options.roughness !== undefined ? options.roughness : 0.7;
    const metalness = options.metalness !== undefined ? options.metalness : 0.3;
    
    // Create material based on enemy type
    let material;
    
    switch (type) {
      case 'GRUNT':
        material = this.createGruntMaterial(baseColor, roughness, metalness);
        break;
      case 'SNIPER':
        material = this.createSniperMaterial(baseColor, roughness, metalness);
        break;
      case 'TANK':
        material = this.createTankMaterial(baseColor, roughness, metalness);
        break;
      case 'SCOUT':
        material = this.createScoutMaterial(baseColor, roughness, metalness);
        break;
      case 'BOSS':
        material = this.createBossMaterial(baseColor, roughness, metalness);
        break;
      default:
        material = this.createStandardMaterial(baseColor, roughness, metalness);
    }
    
    // Cache the material
    this.materialCache.set(cacheKey, material);
    
    return material.clone();
  }
  
  /**
   * Create a standard PBR material
   * @param {number} color - Base color
   * @param {number} roughness - Surface roughness
   * @param {number} metalness - Surface metalness
   * @returns {THREE.MeshStandardMaterial} The created material
   */
  createStandardMaterial(color, roughness, metalness) {
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness,
      envMap: this.defaultEnvMap,
      envMapIntensity: 1.0,
      flatShading: false
    });
    
    // Add some subtle noise to the roughness
    if (this.commonTextures.noise) {
      material.roughnessMap = this.commonTextures.noise;
    }
    
    return material;
  }
  
  /**
   * Create a material for Grunt enemies
   * @param {number} color - Base color
   * @param {number} roughness - Surface roughness
   * @param {number} metalness - Surface metalness
   * @returns {THREE.MeshStandardMaterial} The created material
   */
  createGruntMaterial(color, roughness, metalness) {
    const material = this.createStandardMaterial(color, roughness, metalness);
    
    // Add organic-looking properties
    material.roughness = 0.8;
    material.metalness = 0.2;
    
    // Add subtle emissive glow
    material.emissive = new THREE.Color(color).multiplyScalar(0.2);
    material.emissiveIntensity = 0.3;
    
    return material;
  }
  
  /**
   * Create a material for Sniper enemies
   * @param {number} color - Base color
   * @param {number} roughness - Surface roughness
   * @param {number} metalness - Surface metalness
   * @returns {THREE.MeshStandardMaterial} The created material
   */
  createSniperMaterial(color, roughness, metalness) {
    const material = this.createStandardMaterial(color, roughness, metalness);
    
    // More reflective, sleek appearance
    material.roughness = 0.4;
    material.metalness = 0.6;
    
    // Add subtle scratches
    if (this.commonTextures.scratches) {
      material.roughnessMap = this.commonTextures.scratches;
    }
    
    return material;
  }
  
  /**
   * Create a material for Tank enemies
   * @param {number} color - Base color
   * @param {number} roughness - Surface roughness
   * @param {number} metalness - Surface metalness
   * @returns {THREE.MeshStandardMaterial} The created material
   */
  createTankMaterial(color, roughness, metalness) {
    const material = this.createStandardMaterial(color, roughness, metalness);
    
    // Heavy, armored appearance
    material.roughness = 0.6;
    material.metalness = 0.8;
    
    // Add wear and tear
    if (this.commonTextures.dirt) {
      material.roughnessMap = this.commonTextures.dirt;
    }
    
    return material;
  }
  
  /**
   * Create a material for Scout enemies
   * @param {number} color - Base color
   * @param {number} roughness - Surface roughness
   * @param {number} metalness - Surface metalness
   * @returns {THREE.MeshPhysicalMaterial} The created material
   */
  createScoutMaterial(color, roughness, metalness) {
    // Use MeshPhysicalMaterial for more advanced properties
    const material = new THREE.MeshPhysicalMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.7,
      envMap: this.defaultEnvMap,
      envMapIntensity: 1.5,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      transmission: 0.2, // Slight transparency
      thickness: 0.5
    });
    
    return material;
  }
  
  /**
   * Create a material for Boss enemies
   * @param {number} color - Base color
   * @param {number} roughness - Surface roughness
   * @param {number} metalness - Surface metalness
   * @returns {THREE.MeshPhysicalMaterial} The created material
   */
  createBossMaterial(color, roughness, metalness) {
    // Use MeshPhysicalMaterial for more advanced properties
    const material = new THREE.MeshPhysicalMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.9,
      envMap: this.defaultEnvMap,
      envMapIntensity: 2.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: new THREE.Color(color).multiplyScalar(0.5),
      emissiveIntensity: 0.5
    });
    
    return material;
  }
  
  /**
   * Create a glowing material for effects
   * @param {number} color - Glow color
   * @param {number} intensity - Glow intensity
   * @returns {THREE.MeshBasicMaterial} The created material
   */
  createGlowMaterial(color, intensity = 1.0) {
    return new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8 * intensity,
      side: THREE.FrontSide
    });
  }
  
  /**
   * Create a holographic material
   * @param {number} color - Base color
   * @returns {THREE.ShaderMaterial} The created material
   */
  createHolographicMaterial(color) {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(color) },
        opacity: { value: 0.7 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vDisplacement;
        uniform float time;
        
        void main() {
          vUv = uv;
          
          // Simple displacement effect
          vDisplacement = sin(position.y * 10.0 + time) * 0.05;
          
          // Apply displacement to position
          vec3 newPosition = position + normal * vDisplacement;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        uniform float time;
        varying vec2 vUv;
        varying float vDisplacement;
        
        void main() {
          // Scanline effect
          float scanline = sin(vUv.y * 100.0 + time * 5.0) * 0.05 + 0.95;
          
          // Edge effect
          float edge = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
          
          // Combine effects
          vec3 finalColor = color * scanline;
          float finalOpacity = opacity * edge * (0.8 + vDisplacement);
          
          gl_FragColor = vec4(finalColor, finalOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }
  
  /**
   * Update time-based materials
   * @param {number} time - Current time
   */
  update(time) {
    // Update holographic materials
    this.materialCache.forEach((material) => {
      if (material.type === 'ShaderMaterial' && material.uniforms && material.uniforms.time) {
        material.uniforms.time.value = time;
      }
    });
  }
  
  /**
   * Dispose of all materials and textures
   */
  dispose() {
    this.materialCache.forEach((material) => {
      material.dispose();
    });
    
    this.materialCache.clear();
    
    // Dispose textures
    Object.values(this.commonTextures).forEach((texture) => {
      if (texture) texture.dispose();
    });
    
    if (this.defaultEnvMap) this.defaultEnvMap.dispose();
  }
}