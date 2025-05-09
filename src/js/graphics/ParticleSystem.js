import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particleSystems = [];
    this.maxParticleSystems = 20; // Limit to prevent performance issues
    
    // Object pools for better performance
    this.geometryPool = [];
    this.materialPool = [];
    this.vectorPool = [];
    
    // Pre-allocate common geometries
    this.preAllocateGeometries();
    
    // Performance settings
    this.qualityLevel = 'high'; // 'low', 'medium', 'high'
  }
  
  preAllocateGeometries() {
    // Create a pool of reusable geometries
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(50 * 3); // For 50 particles
      const colors = new Float32Array(50 * 3);
      const sizes = new Float32Array(50);
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      this.geometryPool.push({
        geometry: geometry,
        inUse: false
      });
    }
  }
  
  getGeometryFromPool(count) {
    // First try to find an available geometry in the pool
    for (let i = 0; i < this.geometryPool.length; i++) {
      const item = this.geometryPool[i];
      if (!item.inUse && 
          item.geometry.attributes.position.array.length >= count * 3) {
        item.inUse = true;
        return item.geometry;
      }
    }
    
    // If no suitable geometry found, create a new one
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Add to pool
    this.geometryPool.push({
      geometry: geometry,
      inUse: true
    });
    
    return geometry;
  }
  
  returnGeometryToPool(geometry) {
    // Mark the geometry as available in the pool
    for (let i = 0; i < this.geometryPool.length; i++) {
      if (this.geometryPool[i].geometry === geometry) {
        this.geometryPool[i].inUse = false;
        break;
      }
    }
  }
  
  setQualityLevel(level) {
    this.qualityLevel = level;
    
    // Adjust particle counts based on quality level
    switch (level) {
      case 'low':
        this.maxParticleSystems = 5;
        break;
      case 'medium':
        this.maxParticleSystems = 10;
        break;
      case 'high':
        this.maxParticleSystems = 20;
        break;
    }
  }
  
  getParticleCount(baseCount) {
    // Adjust particle count based on quality level
    switch (this.qualityLevel) {
      case 'low':
        return Math.floor(baseCount * 0.3);
      case 'medium':
        return Math.floor(baseCount * 0.6);
      case 'high':
        return baseCount;
      default:
        return baseCount;
    }
  }
  
  createExplosion(position, color = 0xff5500, count = 50, size = 0.2, duration = 1.0) {
    // Adjust particle count based on quality level
    const adjustedCount = this.getParticleCount(count);
    
    // Skip if we've reached the particle system limit
    if (this.particleSystems.length >= this.maxParticleSystems) {
      // Remove oldest non-essential particle system
      for (let i = 0; i < this.particleSystems.length; i++) {
        if (!this.particleSystems[i].isEssential) {
          this.scene.remove(this.particleSystems[i].mesh);
          this.particleSystems.splice(i, 1);
          break;
        }
      }
      
      // If still at limit, just return without creating new particles
      if (this.particleSystems.length >= this.maxParticleSystems) {
        return null;
      }
    }
    
    // Get geometry from pool
    const particles = this.getGeometryFromPool(adjustedCount);
    
    // Get attribute arrays
    const positions = particles.attributes.position.array;
    const colors = particles.attributes.color.array;
    const sizes = particles.attributes.size.array;
    
    // Create velocities
    const velocities = new Float32Array(adjustedCount * 3);
    
    // Convert hex color to RGB
    const colorObj = new THREE.Color(color);
    
    // Initialize particles
    for (let i = 0; i < adjustedCount; i++) {
      // Random position within a small sphere
      const radius = Math.random() * 0.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = position.y + radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = position.z + radius * Math.cos(phi);
      
      // Random velocity in all directions
      const speed = 2 + Math.random() * 3;
      velocities[i * 3] = (Math.random() - 0.5) * speed;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * speed;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * speed;
      
      // Color with slight variation
      colors[i * 3] = colorObj.r * (0.9 + Math.random() * 0.2);
      colors[i * 3 + 1] = colorObj.g * (0.9 + Math.random() * 0.2);
      colors[i * 3 + 2] = colorObj.b * (0.9 + Math.random() * 0.2);
      
      // Random size
      sizes[i] = size * (0.5 + Math.random() * 0.5);
    }
    
    // Update geometry attributes
    particles.attributes.position.needsUpdate = true;
    particles.attributes.color.needsUpdate = true;
    particles.attributes.size.needsUpdate = true;
    
    // Set draw range to only use the particles we need
    particles.setDrawRange(0, adjustedCount);
    
    // Create or reuse material
    let material;
    if (this.materialPool.length > 0) {
      material = this.materialPool.pop();
      material.size = size;
      material.opacity = 1.0;
    } else {
      material = new THREE.PointsMaterial({
        size: size,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });
    }
    
    // Create particle system
    const particleSystem = new THREE.Points(particles, material);
    
    // Add to scene
    this.scene.add(particleSystem);
    
    // Add to list with metadata
    this.particleSystems.push({
      mesh: particleSystem,
      velocities: velocities,
      startTime: performance.now(),
      duration: duration * 1000, // Convert to milliseconds
      gravity: 9.8,
      drag: 0.95,
      isEssential: false, // Mark as non-essential for cleanup
      geometry: particles // Reference to return to pool later
    });
    
    return particleSystem;
  }
  
  createMuzzleFlash(position, direction, color = 0xffff00, size = 0.5, duration = 0.1) {
    // Create a plane geometry for the muzzle flash
    const geometry = new THREE.PlaneGeometry(size, size);
    
    // Create material with additive blending
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    
    // Create mesh
    const flash = new THREE.Mesh(geometry, material);
    
    // Position and orient the flash
    flash.position.copy(position);
    flash.lookAt(position.clone().add(direction));
    
    // Add to scene
    this.scene.add(flash);
    
    // Add to list with metadata
    this.particleSystems.push({
      mesh: flash,
      startTime: performance.now(),
      duration: duration * 1000, // Convert to milliseconds
      isMuzzleFlash: true
    });
    
    return flash;
  }
  
  createBloodSplatter(position, direction, count = 30, size = 0.1, duration = 0.8) {
    // Create particle geometry
    const particles = new THREE.BufferGeometry();
    
    // Create positions and velocities
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    // Blood color with variation
    const baseColor = new THREE.Color(0x8B0000); // Dark red
    
    // Initialize particles
    for (let i = 0; i < count; i++) {
      // Start at impact position
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      
      // Velocity in a cone in the direction of impact
      const speed = 1 + Math.random() * 3;
      const spread = 0.3;
      
      velocities[i * 3] = direction.x * speed + (Math.random() - 0.5) * spread;
      velocities[i * 3 + 1] = direction.y * speed + (Math.random() - 0.5) * spread;
      velocities[i * 3 + 2] = direction.z * speed + (Math.random() - 0.5) * spread;
      
      // Color with slight variation
      colors[i * 3] = baseColor.r * (0.8 + Math.random() * 0.4);
      colors[i * 3 + 1] = baseColor.g * (0.8 + Math.random() * 0.2);
      colors[i * 3 + 2] = baseColor.b * (0.8 + Math.random() * 0.2);
      
      // Random size
      sizes[i] = size * (0.5 + Math.random() * 0.5);
    }
    
    // Add attributes to geometry
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material
    const material = new THREE.PointsMaterial({
      size: size,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    
    // Create particle system
    const particleSystem = new THREE.Points(particles, material);
    
    // Add to scene
    this.scene.add(particleSystem);
    
    // Add to list with metadata
    this.particleSystems.push({
      mesh: particleSystem,
      velocities: velocities,
      startTime: performance.now(),
      duration: duration * 1000, // Convert to milliseconds
      gravity: 9.8,
      drag: 0.98
    });
    
    return particleSystem;
  }
  
  createTrail(position, color = 0x00ffff, count = 20, size = 0.1, duration = 0.5) {
    // Create particle geometry
    const particles = new THREE.BufferGeometry();
    
    // Create positions
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    // Convert hex color to RGB
    const colorObj = new THREE.Color(color);
    
    // Initialize particles
    for (let i = 0; i < count; i++) {
      // Random position within a small sphere
      const radius = Math.random() * 0.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = position.y + radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = position.z + radius * Math.cos(phi);
      
      // Color with slight variation and fade out
      const fade = 1.0 - (i / count);
      colors[i * 3] = colorObj.r * fade;
      colors[i * 3 + 1] = colorObj.g * fade;
      colors[i * 3 + 2] = colorObj.b * fade;
      
      // Size decreases with fade
      sizes[i] = size * fade;
    }
    
    // Add attributes to geometry
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material
    const material = new THREE.PointsMaterial({
      size: size,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    
    // Create particle system
    const particleSystem = new THREE.Points(particles, material);
    
    // Add to scene
    this.scene.add(particleSystem);
    
    // Add to list with metadata
    this.particleSystems.push({
      mesh: particleSystem,
      startTime: performance.now(),
      duration: duration * 1000, // Convert to milliseconds
      isTrail: true
    });
    
    return particleSystem;
  }
  
  update(deltaTime) {
    const now = performance.now();
    
    // Skip updates if too many particle systems (performance optimization)
    const updateFrequency = this.particleSystems.length > 15 ? 2 : 1;
    
    // Only update on certain frames if we have many particles
    if (this.updateCounter === undefined) this.updateCounter = 0;
    this.updateCounter = (this.updateCounter + 1) % updateFrequency;
    
    if (this.updateCounter !== 0 && updateFrequency > 1) {
      return; // Skip this frame's update
    }
    
    // Update and remove expired particle systems
    for (let i = this.particleSystems.length - 1; i >= 0; i--) {
      const system = this.particleSystems[i];
      const age = now - system.startTime;
      
      // Remove if expired
      if (age > system.duration) {
        this.scene.remove(system.mesh);
        
        // Return geometry to pool
        if (system.geometry) {
          this.returnGeometryToPool(system.geometry);
        }
        
        // Return material to pool
        if (system.mesh.material) {
          this.materialPool.push(system.mesh.material);
        }
        
        this.particleSystems.splice(i, 1);
        continue;
      }
      
      // Calculate progress (0 to 1)
      const progress = age / system.duration;
      
      // Handle different types of particle systems
      if (system.isMuzzleFlash) {
        // Fade out muzzle flash
        system.mesh.material.opacity = 1.0 - progress;
        
        // Scale up slightly
        const scale = 1.0 + progress * 0.5;
        system.mesh.scale.set(scale, scale, scale);
      } else if (system.isTrail) {
        // Fade out trail
        system.mesh.material.opacity = 0.8 * (1.0 - progress);
      } else if (system.velocities) {
        // Update particle positions based on velocities
        const positions = system.mesh.geometry.attributes.position.array;
        const drawRange = system.mesh.geometry.drawRange.count;
        
        // Only update visible particles
        for (let j = 0; j < drawRange; j++) {
          // Apply velocity
          positions[j * 3] += system.velocities[j * 3] * deltaTime;
          positions[j * 3 + 1] += system.velocities[j * 3 + 1] * deltaTime;
          positions[j * 3 + 2] += system.velocities[j * 3 + 2] * deltaTime;
          
          // Apply gravity
          system.velocities[j * 3 + 1] -= system.gravity * deltaTime;
          
          // Apply drag
          system.velocities[j * 3] *= system.drag;
          system.velocities[j * 3 + 1] *= system.drag;
          system.velocities[j * 3 + 2] *= system.drag;
        }
        
        system.mesh.geometry.attributes.position.needsUpdate = true;
        
        // Fade out particles
        system.mesh.material.opacity = 1.0 - progress;
      }
    }
  }
  
  clear() {
    // Remove all particle systems
    for (const system of this.particleSystems) {
      this.scene.remove(system.mesh);
      
      // Return geometry to pool
      if (system.geometry) {
        this.returnGeometryToPool(system.geometry);
      }
      
      // Return material to pool
      if (system.mesh.material) {
        this.materialPool.push(system.mesh.material);
      }
    }
    
    this.particleSystems = [];
  }
}