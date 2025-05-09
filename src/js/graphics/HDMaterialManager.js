import * as THREE from 'three';

/**
 * Manages high-quality PBR materials for the game
 */
export class HDMaterialManager {
  constructor() {
    // Material cache to avoid duplicates
    this.materials = new Map();
    
    // Default material settings
    this.defaultSettings = {
      roughness: 0.5,
      metalness: 0.0,
      envMapIntensity: 1.0,
      clearcoat: 0.0,
      clearcoatRoughness: 0.1,
      normalScale: new THREE.Vector2(1, 1),
      flatShading: false
    };
  }
  
  /**
   * Create a standard PBR material
   * @param {Object} options - Material options
   * @returns {THREE.MeshStandardMaterial} - The created material
   */
  createStandardMaterial(options = {}) {
    const id = this._generateMaterialId('standard', options);
    
    if (this.materials.has(id)) {
      return this.materials.get(id);
    }
    
    const settings = { ...this.defaultSettings, ...options };
    
    const material = new THREE.MeshStandardMaterial({
      color: settings.color || 0xffffff,
      roughness: settings.roughness,
      metalness: settings.metalness,
      envMapIntensity: settings.envMapIntensity,
      normalScale: settings.normalScale,
      flatShading: settings.flatShading,
      map: settings.map || null,
      normalMap: settings.normalMap || null,
      roughnessMap: settings.roughnessMap || null,
      metalnessMap: settings.metalnessMap || null,
      aoMap: settings.aoMap || null,
      emissive: settings.emissive || 0x000000,
      emissiveMap: settings.emissiveMap || null,
      emissiveIntensity: settings.emissiveIntensity || 1.0
    });
    
    this.materials.set(id, material);
    return material;
  }
  
  /**
   * Create a physical material with advanced properties
   * @param {Object} options - Material options
   * @returns {THREE.MeshPhysicalMaterial} - The created material
   */
  createPhysicalMaterial(options = {}) {
    const id = this._generateMaterialId('physical', options);
    
    if (this.materials.has(id)) {
      return this.materials.get(id);
    }
    
    const settings = { ...this.defaultSettings, ...options };
    
    const material = new THREE.MeshPhysicalMaterial({
      color: settings.color || 0xffffff,
      roughness: settings.roughness,
      metalness: settings.metalness,
      envMapIntensity: settings.envMapIntensity,
      clearcoat: settings.clearcoat,
      clearcoatRoughness: settings.clearcoatRoughness,
      normalScale: settings.normalScale,
      flatShading: settings.flatShading,
      map: settings.map || null,
      normalMap: settings.normalMap || null,
      roughnessMap: settings.roughnessMap || null,
      metalnessMap: settings.metalnessMap || null,
      aoMap: settings.aoMap || null,
      emissive: settings.emissive || 0x000000,
      emissiveMap: settings.emissiveMap || null,
      emissiveIntensity: settings.emissiveIntensity || 1.0,
      transmission: settings.transmission || 0.0,
      thickness: settings.thickness || 0.0,
      ior: settings.ior || 1.5
    });
    
    this.materials.set(id, material);
    return material;
  }
  
  /**
   * Create a glowing material for effects
   * @param {Object} options - Material options
   * @returns {THREE.MeshStandardMaterial} - The created material
   */
  createGlowMaterial(options = {}) {
    const id = this._generateMaterialId('glow', options);
    
    if (this.materials.has(id)) {
      return this.materials.get(id);
    }
    
    const color = options.color || 0x00ffff;
    const intensity = options.intensity || 2.0;
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.2,
      metalness: 0.0
    });
    
    this.materials.set(id, material);
    return material;
  }
  
  /**
   * Create a material for weapons with realistic metal properties
   * @param {Object} options - Material options
   * @returns {THREE.MeshPhysicalMaterial} - The created material
   */
  createWeaponMaterial(options = {}) {
    return this.createPhysicalMaterial({
      color: options.color || 0x333333,
      roughness: options.roughness || 0.2,
      metalness: options.metalness || 0.8,
      clearcoat: options.clearcoat || 0.5,
      clearcoatRoughness: options.clearcoatRoughness || 0.2,
      envMapIntensity: options.envMapIntensity || 1.5,
      ...options
    });
  }
  
  /**
   * Generate a unique ID for material caching
   * @private
   */
  _generateMaterialId(type, options) {
    // Create a simple hash from the material properties
    const props = JSON.stringify({
      type,
      color: options.color || 0xffffff,
      roughness: options.roughness,
      metalness: options.metalness,
      map: options.map ? options.map.uuid : null,
      normalMap: options.normalMap ? options.normalMap.uuid : null
    });
    
    return props;
  }
  
  /**
   * Dispose of all materials
   */
  dispose() {
    this.materials.forEach(material => {
      material.dispose();
    });
    
    this.materials.clear();
  }
}