import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export class ModelLoader {
  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.objLoader = new OBJLoader();
    this.fbxLoader = new FBXLoader();
    this.textureLoader = new THREE.TextureLoader();
    
    this.models = {};
    this.textures = {};
    
    this.loadingManager = new THREE.LoadingManager();
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = itemsLoaded / itemsTotal * 100;
      const progressBar = document.getElementById('loading-progress');
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
    };
    
    this.gltfLoader.manager = this.loadingManager;
    this.objLoader.manager = this.loadingManager;
    this.fbxLoader.manager = this.loadingManager;
    this.textureLoader.manager = this.loadingManager;
  }
  
  async loadModels() {
    const modelConfigs = [
      // Player weapon models
      { name: 'weapon_rifle', url: 'models/weapons/rifle.glb', type: 'gltf', scale: 0.01 },
      { name: 'weapon_pistol', url: 'models/weapons/pistol.glb', type: 'gltf', scale: 0.01 },
      
      // Enemy models
      { name: 'enemy_grunt', url: 'models/enemies/grunt.glb', type: 'gltf', scale: 0.01 },
      { name: 'enemy_sniper', url: 'models/enemies/sniper.glb', type: 'gltf', scale: 0.01 },
      { name: 'enemy_tank', url: 'models/enemies/tank.glb', type: 'gltf', scale: 0.01 },
      { name: 'enemy_scout', url: 'models/enemies/scout.glb', type: 'gltf', scale: 0.01 },
      { name: 'enemy_boss', url: 'models/enemies/boss.glb', type: 'gltf', scale: 0.01 },
      
      // Environment models
      { name: 'env_crate', url: 'models/environment/crate.glb', type: 'gltf', scale: 0.01 },
      { name: 'env_barrel', url: 'models/environment/barrel.glb', type: 'gltf', scale: 0.01 },
      { name: 'env_column', url: 'models/environment/column.glb', type: 'gltf', scale: 0.01 }
    ];
    
    const textureConfigs = [
      // Environment textures
      { name: 'floor', url: 'textures/floor.jpg' },
      { name: 'wall', url: 'textures/wall.jpg' },
      { name: 'ceiling', url: 'textures/ceiling.jpg' },
      
      // Material textures
      { name: 'metal', url: 'textures/metal.jpg' },
      { name: 'rust', url: 'textures/rust.jpg' },
      { name: 'concrete', url: 'textures/concrete.jpg' },
      
      // Special effect textures
      { name: 'explosion', url: 'textures/explosion.png' },
      { name: 'muzzle_flash', url: 'textures/muzzle_flash.png' },
      { name: 'smoke', url: 'textures/smoke.png' }
    ];
    
    // For development, create placeholder models and textures
    await this.createPlaceholderAssets();
    
    // In a real implementation, we would load actual models and textures
    // const modelPromises = modelConfigs.map(config => this.loadModel(config));
    // const texturePromises = textureConfigs.map(config => this.loadTexture(config));
    // await Promise.all([...modelPromises, ...texturePromises]);
    
    console.log('Models and textures loaded');
  }
  
  async createPlaceholderAssets() {
    // Create placeholder models
    
    // Weapon models
    this.models['weapon_rifle'] = this.createPlaceholderWeapon(0.1, 0.1, 0.5, 0x333333);
    this.models['weapon_pistol'] = this.createPlaceholderWeapon(0.08, 0.12, 0.25, 0x222222);
    
    // Enemy models
    this.models['enemy_grunt'] = this.createPlaceholderEnemy(1, 2, 1, 0xff0000);
    this.models['enemy_sniper'] = this.createPlaceholderEnemy(0.8, 2.2, 0.8, 0x00ff00);
    this.models['enemy_tank'] = this.createPlaceholderEnemy(1.5, 2.5, 1.5, 0x0000ff);
    this.models['enemy_scout'] = this.createPlaceholderEnemy(0.7, 1.8, 0.7, 0xffff00);
    this.models['enemy_boss'] = this.createPlaceholderEnemy(2, 3, 2, 0xff00ff);
    
    // Environment models
    this.models['env_crate'] = this.createPlaceholderCube(1, 1, 1, 0x8B4513);
    this.models['env_barrel'] = this.createPlaceholderCylinder(0.5, 0.5, 1, 0x444444);
    this.models['env_column'] = this.createPlaceholderCylinder(0.3, 0.3, 3, 0xCCCCCC);
    
    // Create placeholder textures
    this.textures['floor'] = this.createPlaceholderTexture(0x8B4513);
    this.textures['wall'] = this.createPlaceholderTexture(0x808080);
    this.textures['ceiling'] = this.createPlaceholderTexture(0x505050);
    this.textures['metal'] = this.createPlaceholderTexture(0x888888);
    this.textures['rust'] = this.createPlaceholderTexture(0x8B4513);
    this.textures['concrete'] = this.createPlaceholderTexture(0xAAAAAA);
    this.textures['explosion'] = this.createPlaceholderTexture(0xFF5500);
    this.textures['muzzle_flash'] = this.createPlaceholderTexture(0xFFFF00);
    this.textures['smoke'] = this.createPlaceholderTexture(0xCCCCCC);
  }
  
  createPlaceholderWeapon(width, height, length, color) {
    const group = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(width, height, length);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(width/4, width/4, length * 0.7, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = length / 2 + length * 0.35;
    group.add(barrel);
    
    // Sight
    const sightGeometry = new THREE.BoxGeometry(width/4, height/2, width/4);
    const sightMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const sight = new THREE.Mesh(sightGeometry, sightMaterial);
    sight.position.y = height / 2 + height / 4;
    sight.position.z = length / 4;
    group.add(sight);
    
    return group;
  }
  
  createPlaceholderEnemy(width, height, depth, color) {
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(width, height * 0.6, depth);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = height * 0.3;
    group.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(width * 0.4, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({ color });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = height * 0.6 + width * 0.4;
    group.add(head);
    
    // Arms
    const armGeometry = new THREE.BoxGeometry(width * 0.25, height * 0.4, width * 0.25);
    const armMaterial = new THREE.MeshStandardMaterial({ color });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.x = -width / 2 - width * 0.125;
    leftArm.position.y = height * 0.4;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.x = width / 2 + width * 0.125;
    rightArm.position.y = height * 0.4;
    group.add(rightArm);
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(width * 0.25, height * 0.4, width * 0.25);
    const legMaterial = new THREE.MeshStandardMaterial({ color });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.x = -width / 4;
    leftLeg.position.y = height * 0.2 - height * 0.2;
    group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.x = width / 4;
    rightLeg.position.y = height * 0.2 - height * 0.2;
    group.add(rightLeg);
    
    return group;
  }
  
  createPlaceholderCube(width, height, depth, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }
  
  createPlaceholderCylinder(radiusTop, radiusBottom, height, color) {
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16);
    const material = new THREE.MeshStandardMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }
  
  createPlaceholderTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Fill with base color
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.fillRect(0, 0, 256, 256);
    
    // Add some noise for texture
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const brightness = Math.random() * 50 - 25;
      
      context.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.5)`;
      context.fillRect(x, y, 2, 2);
    }
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    return texture;
  }
  
  async loadModel({ name, url, type, scale = 1.0 }) {
    try {
      let model;
      
      switch (type) {
        case 'gltf':
          model = await this.loadGLTF(url);
          break;
        case 'obj':
          model = await this.loadOBJ(url);
          break;
        case 'fbx':
          model = await this.loadFBX(url);
          break;
        default:
          throw new Error(`Unsupported model type: ${type}`);
      }
      
      // Apply scale
      model.scale.set(scale, scale, scale);
      
      // Store model
      this.models[name] = model;
      
      return model;
    } catch (error) {
      console.error(`Error loading model ${name}:`, error);
      
      // Create a placeholder model
      const placeholder = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true })
      );
      
      this.models[name] = placeholder;
      return placeholder;
    }
  }
  
  async loadGLTF(url) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          resolve(gltf.scene);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }
  
  async loadOBJ(url) {
    return new Promise((resolve, reject) => {
      this.objLoader.load(
        url,
        (obj) => {
          resolve(obj);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }
  
  async loadFBX(url) {
    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        url,
        (fbx) => {
          resolve(fbx);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }
  
  async loadTexture({ name, url }) {
    try {
      const texture = await new Promise((resolve, reject) => {
        this.textureLoader.load(
          url,
          (texture) => {
            resolve(texture);
          },
          undefined,
          (error) => {
            reject(error);
          }
        );
      });
      
      // Configure texture
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      
      // Store texture
      this.textures[name] = texture;
      
      return texture;
    } catch (error) {
      console.error(`Error loading texture ${name}:`, error);
      
      // Create a placeholder texture
      const placeholder = this.createPlaceholderTexture(0xff00ff);
      this.textures[name] = placeholder;
      
      return placeholder;
    }
  }
  
  getModel(name) {
    if (!this.models[name]) {
      console.warn(`Model not found: ${name}`);
      return this.createPlaceholderCube(1, 1, 1, 0xff00ff);
    }
    
    // Return a clone of the model
    return this.models[name].clone();
  }
  
  getTexture(name) {
    if (!this.textures[name]) {
      console.warn(`Texture not found: ${name}`);
      return this.createPlaceholderTexture(0xff00ff);
    }
    
    return this.textures[name];
  }
}