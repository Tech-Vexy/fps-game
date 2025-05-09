import * as THREE from 'three';

/**
 * Enhanced texture loader for HD textures with proper settings
 */
export class HDTextureLoader {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.cubeTextureLoader = new THREE.CubeTextureLoader();
    
    // Set default texture settings for HD quality
    this.defaultSettings = {
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      minFilter: THREE.LinearMipmapLinearFilter, // Trilinear filtering
      magFilter: THREE.LinearFilter,
      anisotropy: 16, // High anisotropic filtering for sharp textures at angles
      encoding: THREE.sRGBEncoding,
      flipY: false // Better compatibility with most models
    };
  }
  
  /**
   * Load a texture with HD settings
   * @param {string} path - Path to the texture
   * @param {Object} settings - Optional settings to override defaults
   * @returns {Promise<THREE.Texture>} - The loaded texture
   */
  async load(path, settings = {}) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          // Apply default settings
          const finalSettings = { ...this.defaultSettings, ...settings };
          
          // Apply settings to texture
          texture.wrapS = finalSettings.wrapS;
          texture.wrapT = finalSettings.wrapT;
          texture.minFilter = finalSettings.minFilter;
          texture.magFilter = finalSettings.magFilter;
          // Get max anisotropy from renderer if available, otherwise use a reasonable default
          const maxAnisotropy = 16;
          texture.anisotropy = Math.min(finalSettings.anisotropy, maxAnisotropy);
          texture.encoding = finalSettings.encoding;
          texture.flipY = finalSettings.flipY;
          
          // Generate mipmaps for better quality at different distances
          texture.generateMipmaps = true;
          
          // Resolve with the configured texture
          resolve(texture);
        },
        undefined, // Progress callback not used
        (error) => {
          console.error(`Failed to load texture: ${path}`, error);
          reject(error);
        }
      );
    });
  }
  
  /**
   * Load a normal map with proper settings
   * @param {string} path - Path to the normal map
   * @returns {Promise<THREE.Texture>} - The loaded normal map
   */
  async loadNormalMap(path) {
    return this.load(path, {
      encoding: THREE.LinearEncoding, // Normal maps should use linear encoding
    });
  }
  
  /**
   * Load a cube map (environment map) with HD settings
   * @param {Array<string>} paths - Array of 6 paths for cube faces
   * @returns {Promise<THREE.CubeTexture>} - The loaded cube texture
   */
  async loadCubeMap(paths) {
    return new Promise((resolve, reject) => {
      this.cubeTextureLoader.load(
        paths,
        (cubeTexture) => {
          cubeTexture.encoding = THREE.sRGBEncoding;
          resolve(cubeTexture);
        },
        undefined,
        (error) => {
          console.error('Failed to load cube texture', error);
          reject(error);
        }
      );
    });
  }
  
  /**
   * Create a material with PBR (Physically Based Rendering) properties
   * @param {Object} options - Material options
   * @returns {THREE.MeshStandardMaterial} - The configured material
   */
  createPBRMaterial(options = {}) {
    const material = new THREE.MeshStandardMaterial({
      color: options.color || 0xffffff,
      metalness: options.metalness !== undefined ? options.metalness : 0.0,
      roughness: options.roughness !== undefined ? options.roughness : 0.5,
      envMapIntensity: options.envMapIntensity || 1.0,
      ...options
    });
    
    return material;
  }
}