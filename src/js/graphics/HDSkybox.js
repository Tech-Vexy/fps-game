import * as THREE from 'three';

/**
 * Creates high-quality skyboxes for the game
 */
export class HDSkybox {
  constructor(renderer) {
    this.renderer = renderer;
    this.cubeRenderTarget = null;
    this.pmremGenerator = null;
    
    if (renderer) {
      this.pmremGenerator = new THREE.PMREMGenerator(renderer);
      this.pmremGenerator.compileEquirectangularShader();
    }
  }
  
  /**
   * Create a skybox from an HDR environment map
   * @param {string} path - Path to the HDR environment map
   * @returns {Promise<THREE.Texture>} - The processed environment map
   */
  async createFromHDR(path) {
    try {
      // Use RGBELoader for HDR images
      const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js');
      const loader = new RGBELoader();
      
      return new Promise((resolve, reject) => {
        loader.load(path, (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          
          // Process for PBR rendering if we have a pmremGenerator
          let envMap = texture;
          if (this.pmremGenerator) {
            envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
            texture.dispose();
            this.pmremGenerator.dispose();
          }
          
          resolve(envMap);
        }, undefined, reject);
      });
    } catch (error) {
      console.error('Failed to load HDR skybox:', error);
      return this.createFromCubemap([
        'textures/skybox/px.jpg',
        'textures/skybox/nx.jpg',
        'textures/skybox/py.jpg',
        'textures/skybox/ny.jpg',
        'textures/skybox/pz.jpg',
        'textures/skybox/nz.jpg'
      ]);
    }
  }
  
  /**
   * Create a skybox from a cubemap
   * @param {Array<string>} paths - Array of 6 paths for cube faces
   * @returns {Promise<THREE.CubeTexture>} - The processed cubemap
   */
  createFromCubemap(paths) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.CubeTextureLoader();
      loader.load(paths, (cubeTexture) => {
        cubeTexture.encoding = THREE.sRGBEncoding;
        resolve(cubeTexture);
      }, undefined, reject);
    });
  }
  
  /**
   * Create a procedural sky
   * @param {Object} options - Sky options
   * @returns {THREE.Mesh} - The sky mesh
   */
  createProceduralSky(options = {}) {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(1000, 32, 32),
      new THREE.ShaderMaterial({
        uniforms: {
          topColor: { value: new THREE.Color(options.topColor || 0x0077ff) },
          bottomColor: { value: new THREE.Color(options.bottomColor || 0xffffff) },
          offset: { value: options.offset || 33 },
          exponent: { value: options.exponent || 0.6 }
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
        side: THREE.BackSide,
        fog: false
      })
    );
    
    return sky;
  }
  
  /**
   * Apply skybox to scene
   * @param {THREE.Scene} scene - The scene to apply the skybox to
   * @param {THREE.Texture} skybox - The skybox texture
   */
  applySkybox(scene, skybox) {
    if (!scene) return;
    
    scene.background = skybox;
    
    // If it's an environment map, also set it as the scene's environment
    if (skybox.isTexture && !skybox.isCubeTexture) {
      scene.environment = skybox;
    }
  }
  
  /**
   * Dispose of resources
   */
  dispose() {
    if (this.cubeRenderTarget) {
      this.cubeRenderTarget.dispose();
    }
    
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
    }
  }
}