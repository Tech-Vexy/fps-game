import * as THREE from 'three';
import { HDTextureLoader } from './HDTextureLoader';
import { PMREMGenerator } from 'three';

/**
 * Creates and manages high-quality environment maps and lighting
 */
export class HDEnvironment {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.textureLoader = new HDTextureLoader();
    
    // Create PMREM Generator for high-quality environment maps
    this.pmremGenerator = new PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();
    
    // Store environment maps
    this.environmentMaps = {};
  }
  
  /**
   * Load an HDR environment map and apply it to the scene
   * @param {string} path - Path to the HDR environment map
   * @returns {Promise<THREE.Texture>} - The processed environment map
   */
  async loadHDREnvironment(path) {
    try {
      // Use RGBELoader for HDR images
      const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js');
      const loader = new RGBELoader();
      
      return new Promise((resolve, reject) => {
        loader.load(path, (texture) => {
          const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
          this.scene.environment = envMap;
          this.scene.background = envMap;
          
          // Store for later use
          this.environmentMaps.hdr = envMap;
          
          // Clean up
          texture.dispose();
          this.pmremGenerator.dispose();
          
          resolve(envMap);
        }, undefined, reject);
      });
    } catch (error) {
      console.error('Failed to load HDR environment:', error);
      return this.loadCubemapEnvironment([
        'textures/environment/px.jpg',
        'textures/environment/nx.jpg',
        'textures/environment/py.jpg',
        'textures/environment/ny.jpg',
        'textures/environment/pz.jpg',
        'textures/environment/nz.jpg'
      ]);
    }
  }
  
  /**
   * Load a cubemap environment and apply it to the scene
   * @param {Array<string>} paths - Array of 6 paths for cube faces
   * @returns {Promise<THREE.CubeTexture>} - The processed environment map
   */
  async loadCubemapEnvironment(paths) {
    try {
      const cubeTexture = await this.textureLoader.loadCubeMap(paths);
      
      // Process for PBR rendering
      const envMap = this.pmremGenerator.fromCubemap(cubeTexture).texture;
      this.scene.environment = envMap;
      this.scene.background = cubeTexture;
      
      // Store for later use
      this.environmentMaps.cubemap = envMap;
      
      return envMap;
    } catch (error) {
      console.error('Failed to load cubemap environment:', error);
      return null;
    }
  }
  
  /**
   * Create ambient light that matches the environment
   * @param {number} intensity - Light intensity
   * @returns {THREE.HemisphereLight} - The created light
   */
  createMatchingAmbientLight(intensity = 1.0) {
    // Create hemisphere light with colors that complement the environment
    const skyColor = 0x88bbff; // Blueish sky color
    const groundColor = 0x443333; // Brownish ground color
    
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    this.scene.add(light);
    
    return light;
  }
  
  /**
   * Apply environment map to all materials in the scene
   * @param {number} intensity - Environment map intensity
   */
  applyToAllMaterials(intensity = 1.0) {
    if (!this.scene.environment) return;
    
    this.scene.traverse((object) => {
      if (object.isMesh && object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
              material.envMap = this.scene.environment;
              material.envMapIntensity = intensity;
              material.needsUpdate = true;
            }
          });
        } else if (object.material.isMeshStandardMaterial || object.material.isMeshPhysicalMaterial) {
          object.material.envMap = this.scene.environment;
          object.material.envMapIntensity = intensity;
          object.material.needsUpdate = true;
        }
      }
    });
  }
  
  /**
   * Dispose of resources
   */
  dispose() {
    Object.values(this.environmentMaps).forEach(map => {
      if (map && map.dispose) map.dispose();
    });
    
    if (this.pmremGenerator && this.pmremGenerator.dispose) {
      this.pmremGenerator.dispose();
    }
  }
}