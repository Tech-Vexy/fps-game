import * as THREE from 'three';

export class AssetManager {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.modelLoader = new THREE.ObjectLoader();
    
    this.textures = {};
    this.models = {};
    this.materials = {};
    
    this.loadingManager = new THREE.LoadingManager();
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = itemsLoaded / itemsTotal * 100;
      const progressBar = document.getElementById('loading-progress');
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
    };
    
    this.textureLoader.manager = this.loadingManager;
    this.modelLoader.manager = this.loadingManager;
  }
  
  async loadAssets() {
    // Define assets to load
    const texturesToLoad = [
      { name: 'ground', url: 'textures/ground.jpg' },
      { name: 'wall', url: 'textures/wall.jpg' },
      { name: 'enemy', url: 'textures/enemy.jpg' }
    ];
    
    // Create placeholder textures and materials for development
    await this.createPlaceholderAssets();
    
    // In a real implementation, we would load actual assets
    // return Promise.all([
    //   ...texturesToLoad.map(texture => this.loadTexture(texture.name, texture.url)),
    //   ...modelsToLoad.map(model => this.loadModel(model.name, model.url))
    // ]);
    
    // For now, return a resolved promise
    return Promise.resolve();
  }
  
  async createPlaceholderAssets() {
    // Create basic color textures
    const groundTexture = this.createColorTexture(0x8B4513); // Brown
    const wallTexture = this.createColorTexture(0x808080);   // Gray
    const enemyTexture = this.createColorTexture(0xFF0000);  // Red
    
    // Store textures
    this.textures['ground'] = groundTexture;
    this.textures['wall'] = wallTexture;
    this.textures['enemy'] = enemyTexture;
    
    // Create basic materials
    this.materials['ground'] = new THREE.MeshStandardMaterial({ 
      map: groundTexture,
      roughness: 0.8,
      metalness: 0.2
    });
    
    this.materials['wall'] = new THREE.MeshStandardMaterial({ 
      map: wallTexture,
      roughness: 0.7,
      metalness: 0.1
    });
    
    this.materials['enemy'] = new THREE.MeshStandardMaterial({ 
      map: enemyTexture,
      roughness: 0.5,
      metalness: 0.3
    });
    
    // Create weapon model (simple box)
    const weaponGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    const weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const weaponMesh = new THREE.Mesh(weaponGeometry, weaponMaterial);
    this.models['weapon'] = weaponMesh;
  }
  
  createColorTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.fillRect(0, 0, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    return texture;
  }
  
  loadTexture(name, url) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          this.textures[name] = texture;
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error(`Error loading texture ${name}:`, error);
          reject(error);
        }
      );
    });
  }
  
  loadModel(name, url) {
    return new Promise((resolve, reject) => {
      this.modelLoader.load(
        url,
        (model) => {
          this.models[name] = model;
          resolve(model);
        },
        undefined,
        (error) => {
          console.error(`Error loading model ${name}:`, error);
          reject(error);
        }
      );
    });
  }
  
  getTexture(name) {
    return this.textures[name];
  }
  
  getModel(name) {
    return this.models[name];
  }
  
  getMaterial(name) {
    return this.materials[name];
  }
}