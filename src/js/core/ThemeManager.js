import * as THREE from 'three';
import { GameLore } from './GameLore.js';

/**
 * Manages game theming and visual consistency
 */
export class ThemeManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.currentTheme = "nexus-labs"; // Default starting theme
    this.lore = new GameLore();
    
    // Color palettes for different environments
    this.colorPalettes = {
      "nexus-labs": {
        primary: 0x1a6ed8,      // Blue tech
        secondary: 0xd81a1a,    // Warning red
        accent: 0x1ad892,       // Highlight teal
        ambient: 0x0a1a2f,      // Dark blue ambient
        emissive: 0x29b6f6      // Glowing blue
      },
      "undercity": {
        primary: 0x2e4045,      // Industrial gray
        secondary: 0x4a6c70,    // Dark teal
        accent: 0xffcc00,       // Warning yellow
        ambient: 0x0d1518,      // Very dark ambient
        emissive: 0x39ff14      // Toxic green glow
      },
      "city-streets": {
        primary: 0x607d8b,      // Urban blue-gray
        secondary: 0x455a64,    // Darker blue-gray
        accent: 0xff5722,       // Emergency orange
        ambient: 0x1c2833,      // Dark blue night
        emissive: 0xef5350      // Warning red lights
      },
      "nexus-core": {
        primary: 0x6a1b9a,      // Deep purple
        secondary: 0x4a148c,    // Darker purple
        accent: 0x00b0ff,       // Bright blue
        ambient: 0x120431,      // Very dark purple
        emissive: 0xe040fb      // Bright magenta
      }
    };
    
    // Materials for each theme
    this.themeMaterials = {};
    
    // Fog settings for each theme
    this.fogSettings = {
      "nexus-labs": {
        color: 0x0a1a2f,
        density: 0.015,
        near: 10,
        far: 50
      },
      "undercity": {
        color: 0x0d1518,
        density: 0.03,
        near: 5,
        far: 30
      },
      "city-streets": {
        color: 0x1c2833,
        density: 0.01,
        near: 15,
        far: 80
      },
      "nexus-core": {
        color: 0x120431,
        density: 0.02,
        near: 10,
        far: 60
      }
    };
    
    // Initialize theme materials
    this.initThemeMaterials();
  }
  
  /**
   * Initialize materials for all themes
   */
  initThemeMaterials() {
    // Create theme materials for each theme
    for (const [themeId, palette] of Object.entries(this.colorPalettes)) {
      this.themeMaterials[themeId] = {
        wall: new THREE.MeshStandardMaterial({
          color: palette.primary,
          roughness: 0.7,
          metalness: 0.2,
          map: this.gameEngine?.textureLoader?.load(`assets/textures/${themeId}/wall.jpg`)
        }),
        floor: new THREE.MeshStandardMaterial({
          color: palette.secondary,
          roughness: 0.8,
          metalness: 0.1,
          map: this.gameEngine?.textureLoader?.load(`assets/textures/${themeId}/floor.jpg`)
        }),
        accent: new THREE.MeshStandardMaterial({
          color: palette.accent,
          roughness: 0.6,
          metalness: 0.3,
          map: this.gameEngine?.textureLoader?.load(`assets/textures/${themeId}/accent.jpg`)
        }),
        emissive: new THREE.MeshStandardMaterial({
          color: palette.emissive,
          emissive: palette.emissive,
          emissiveIntensity: 1.0,
          roughness: 0.4,
          metalness: 0.6
        })
      };
    }
  }
  
  /**
   * Set the current game theme
   * @param {string} themeId - The theme identifier to set
   */
  setTheme(themeId) {
    if (!this.colorPalettes[themeId]) {
      console.warn(`Theme ${themeId} not found, using default`);
      themeId = "nexus-labs";
    }
    
    this.currentTheme = themeId;
    this.applyTheme();
  }
  
  /**
   * Apply the current theme to the game world
   */
  applyTheme() {
    if (!this.gameEngine || !this.gameEngine.scene) return;
    
    const scene = this.gameEngine.scene;
    const palette = this.colorPalettes[this.currentTheme];
    const fogSettings = this.fogSettings[this.currentTheme];
    const materials = this.themeMaterials[this.currentTheme];
    
    // Set ambient lighting
    if (this.gameEngine.ambientLight) {
      this.gameEngine.ambientLight.color.setHex(palette.ambient);
      this.gameEngine.ambientLight.intensity = 0.6;
    }
    
    // Set fog
    if (fogSettings) {
      scene.fog = new THREE.FogExp2(fogSettings.color, fogSettings.density);
    }
    
    // Apply theme to level objects
    scene.traverse(object => {
      if (object.isMesh && object.userData.themeElement) {
        const elementType = object.userData.themeElement;
        if (materials[elementType]) {
          object.material = materials[elementType];
        }
      }
    });
    
    // Update skybox if present
    this.updateSkybox();
    
    // Set post-processing based on theme
    this.updatePostProcessing();
    
    // Dispatch event for UI updates
    const themeChangedEvent = new CustomEvent('themeChanged', { detail: { theme: this.currentTheme } });
    window.dispatchEvent(themeChangedEvent);
  }
  
  /**
   * Update skybox based on current theme
   */
  updateSkybox() {
    if (!this.gameEngine || !this.gameEngine.scene) return;
    
    // Remove existing skybox if present
    const existingSkybox = this.gameEngine.scene.getObjectByName('skybox');
    if (existingSkybox) {
      this.gameEngine.scene.remove(existingSkybox);
    }
    
    // Create new skybox based on theme
    const skyboxLoader = new THREE.CubeTextureLoader();
    skyboxLoader.setPath(`assets/skybox/${this.currentTheme}/`);
    
    const skybox = skyboxLoader.load([
      'px.jpg', 'nx.jpg',
      'py.jpg', 'ny.jpg',
      'pz.jpg', 'nz.jpg'
    ]);
    
    this.gameEngine.scene.background = skybox;
  }
  
  /**
   * Update post-processing effects based on theme
   */
  updatePostProcessing() {
    if (!this.gameEngine || !this.gameEngine.postProcessing) return;
    
    const pp = this.gameEngine.postProcessing;
    
    // Adjust bloom based on theme
    if (pp.bloomPass) {
      switch (this.currentTheme) {
        case "nexus-labs":
          pp.bloomPass.threshold = 0.85;
          pp.bloomPass.strength = 0.8;
          pp.bloomPass.radius = 0.4;
          break;
        case "undercity":
          pp.bloomPass.threshold = 0.7;
          pp.bloomPass.strength = 1.2;
          pp.bloomPass.radius = 0.6;
          break;
        case "city-streets":
          pp.bloomPass.threshold = 0.8;
          pp.bloomPass.strength = 0.6;
          pp.bloomPass.radius = 0.3;
          break;
        case "nexus-core":
          pp.bloomPass.threshold = 0.6;
          pp.bloomPass.strength = 1.5;
          pp.bloomPass.radius = 0.8;
          break;
      }
    }
    
    // Adjust other effects based on theme
    if (pp.colorGrading) {
      switch (this.currentTheme) {
        case "nexus-labs":
          pp.colorGrading.setValues({ 
            brightness: 1.05, contrast: 1.1, 
            saturation: 0.9, tint: new THREE.Color(0xcceeff) 
          });
          break;
        case "undercity":
          pp.colorGrading.setValues({ 
            brightness: 0.9, contrast: 1.2, 
            saturation: 0.7, tint: new THREE.Color(0x99bb99) 
          });
          break;
        case "city-streets":
          pp.colorGrading.setValues({ 
            brightness: 1.0, contrast: 1.15, 
            saturation: 0.8, tint: new THREE.Color(0xaabbcc) 
          });
          break;
        case "nexus-core":
          pp.colorGrading.setValues({ 
            brightness: 1.1, contrast: 1.3, 
            saturation: 1.2, tint: new THREE.Color(0xccaaee) 
          });
          break;
      }
    }
  }
  
  /**
   * Get a material for the current theme
   * @param {string} elementType - Type of element (wall, floor, accent, etc.)
   * @returns {THREE.Material} - Themed material
   */
  getMaterial(elementType) {
    return this.themeMaterials[this.currentTheme]?.[elementType] || 
           new THREE.MeshStandardMaterial({ color: 0x888888 });
  }
  
  /**
   * Get theme color from current palette
   * @param {string} colorType - Color type (primary, secondary, accent, etc.)
   * @returns {number} - Color as hex value
   */
  getColor(colorType) {
    return this.colorPalettes[this.currentTheme]?.[colorType] || 0x888888;
  }
}