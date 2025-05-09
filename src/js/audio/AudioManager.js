import * as THREE from 'three';

/**
 * Manages all audio in the game with spatial audio support
 */
export class AudioManager {
  constructor(camera) {
    // Create audio listener attached to camera
    this.listener = new THREE.AudioListener();
    if (camera) {
      camera.add(this.listener);
    }
    
    // Sound collections
    this.sounds = {};
    this.music = {};
    this.ambientSounds = {};
    
    // Audio settings
    this.settings = {
      masterVolume: 1.0,
      sfxVolume: 1.0,
      musicVolume: 0.7,
      ambientVolume: 0.5,
      spatialAudio: true
    };
    
    // Audio context
    this.context = this.listener.context;
    
    // Create audio groups for volume control
    this.masterGain = this.context.createGain();
    this.sfxGain = this.context.createGain();
    this.musicGain = this.context.createGain();
    this.ambientGain = this.context.createGain();
    
    // Connect gain nodes
    this.sfxGain.connect(this.masterGain);
    this.musicGain.connect(this.masterGain);
    this.ambientGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
    
    // Apply initial volume settings
    this.updateVolumes();
    
    // Sound pools for frequently used sounds
    this.soundPools = {};
    
    // Load sounds
    this.loadSounds();
  }
  
  /**
   * Load all game sounds
   */
  async loadSounds() {
    try {
      // Weapon sounds
      await this.loadSound('pistol_fire', 'audio/weapons/pistol_fire.mp3', { pool: 5 });
      await this.loadSound('rifle_fire', 'audio/weapons/rifle_fire.mp3', { pool: 10 });
      await this.loadSound('shotgun_fire', 'audio/weapons/shotgun_fire.mp3', { pool: 3 });
      await this.loadSound('reload', 'audio/weapons/reload.mp3');
      await this.loadSound('empty', 'audio/weapons/empty.mp3');
      
      // Player sounds
      await this.loadSound('jump', 'audio/player/jump.mp3');
      await this.loadSound('land', 'audio/player/land.mp3');
      await this.loadSound('footstep1', 'audio/player/footstep1.mp3', { pool: 4 });
      await this.loadSound('footstep2', 'audio/player/footstep2.mp3', { pool: 4 });
      await this.loadSound('hurt', 'audio/player/hurt.mp3');
      await this.loadSound('death', 'audio/player/death.mp3');
      
      // Impact sounds
      await this.loadSound('bullet_impact_metal', 'audio/impacts/metal.mp3', { pool: 5 });
      await this.loadSound('bullet_impact_concrete', 'audio/impacts/concrete.mp3', { pool: 5 });
      await this.loadSound('bullet_impact_wood', 'audio/impacts/wood.mp3', { pool: 5 });
      await this.loadSound('explosion', 'audio/impacts/explosion.mp3');
      
      // UI sounds
      await this.loadSound('button_click', 'audio/ui/click.mp3');
      await this.loadSound('menu_open', 'audio/ui/open.mp3');
      await this.loadSound('menu_close', 'audio/ui/close.mp3');
      
      // Ambient sounds
      await this.loadAmbientSound('ambient_wind', 'audio/ambient/wind.mp3');
      await this.loadAmbientSound('ambient_room', 'audio/ambient/room_tone.mp3');
      
      // Music
      await this.loadMusic('menu_music', 'audio/music/menu.mp3');
      await this.loadMusic('gameplay_music', 'audio/music/gameplay.mp3');
      await this.loadMusic('combat_music', 'audio/music/combat.mp3');
      
      console.log('All audio loaded successfully');
    } catch (error) {
      console.warn('Failed to load some audio files:', error);
      // Create silent fallbacks for missing sounds
      this._createSilentFallbacks();
    }
  }
  
  /**
   * Create silent fallbacks for missing sounds
   * @private
   */
  _createSilentFallbacks() {
    // Create a silent buffer
    const buffer = this.context.createBuffer(1, 1024, this.context.sampleRate);
    
    // Essential sound types that need fallbacks
    const essentialSounds = [
      'pistol_fire', 'rifle_fire', 'shotgun_fire', 'reload',
      'jump', 'land', 'footstep1', 'footstep2',
      'bullet_impact_metal', 'explosion'
    ];
    
    // Create fallbacks for any missing essential sounds
    essentialSounds.forEach(id => {
      if (!this.sounds[id]) {
        this.sounds[id] = {
          buffer,
          settings: { volume: 0, pool: 1 }
        };
        console.warn(`Created silent fallback for missing sound: ${id}`);
      }
    });
  }
  
  /**
   * Load a sound effect
   * @param {string} id - Sound identifier
   * @param {string} url - Sound file URL
   * @param {Object} options - Sound options
   * @returns {Promise} - Promise that resolves when the sound is loaded
   */
  async loadSound(id, url, options = {}) {
    try {
      // Default options
      const settings = {
        volume: options.volume || 1.0,
        pool: options.pool || 1,
        loop: options.loop || false,
        spatial: options.spatial !== undefined ? options.spatial : true
      };
      
      // Load audio buffer
      const buffer = await this._loadAudioBuffer(url);
      
      // Store sound
      this.sounds[id] = {
        buffer,
        settings
      };
      
      // Create sound pool if needed
      if (settings.pool > 1) {
        this.soundPools[id] = [];
      }
      
      return buffer;
    } catch (error) {
      console.warn(`Failed to load sound ${id} from ${url}:`, error);
      return null;
    }
  }
  
  /**
   * Load ambient sound
   * @param {string} id - Sound identifier
   * @param {string} url - Sound file URL
   * @param {Object} options - Sound options
   * @returns {Promise} - Promise that resolves when the sound is loaded
   */
  async loadAmbientSound(id, url, options = {}) {
    try {
      // Default options for ambient sounds
      const settings = {
        volume: options.volume || 1.0,
        loop: true,
        spatial: options.spatial !== undefined ? options.spatial : false
      };
      
      // Load audio buffer
      const buffer = await this._loadAudioBuffer(url);
      
      // Store ambient sound
      this.ambientSounds[id] = {
        buffer,
        settings,
        playing: false,
        audio: null
      };
      
      return buffer;
    } catch (error) {
      console.warn(`Failed to load ambient sound ${id} from ${url}:`, error);
      return null;
    }
  }
  
  /**
   * Load music track
   * @param {string} id - Music identifier
   * @param {string} url - Music file URL
   * @param {Object} options - Music options
   * @returns {Promise} - Promise that resolves when the music is loaded
   */
  async loadMusic(id, url, options = {}) {
    try {
      // Default options for music
      const settings = {
        volume: options.volume || 1.0,
        loop: true,
        fadeIn: options.fadeIn || 2.0,
        fadeOut: options.fadeOut || 2.0
      };
      
      // Load audio buffer
      const buffer = await this._loadAudioBuffer(url);
      
      // Store music
      this.music[id] = {
        buffer,
        settings,
        playing: false,
        audio: null
      };
      
      return buffer;
    } catch (error) {
      console.warn(`Failed to load music ${id} from ${url}:`, error);
      return null;
    }
  }
  
  /**
   * Load audio buffer from URL
   * @param {string} url - Audio file URL
   * @returns {Promise<AudioBuffer>} - Promise that resolves with the audio buffer
   * @private
   */
  async _loadAudioBuffer(url) {
    return new Promise((resolve, reject) => {
      // Create a dummy buffer for development if file doesn't exist
      if (!url || url.includes('audio/') && !url.includes('http')) {
        console.warn(`Creating dummy audio buffer for ${url}`);
        const dummyBuffer = this.context.createBuffer(2, 1024, this.context.sampleRate);
        resolve(dummyBuffer);
        return;
      }
      
      // Load actual audio file
      const request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';
      
      request.onload = () => {
        this.context.decodeAudioData(
          request.response,
          buffer => resolve(buffer),
          error => reject(error)
        );
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to load audio file: ${url}`));
      };
      
      request.send();
    });
  }
  
  /**
   * Play a sound effect
   * @param {string} id - Sound identifier
   * @param {Object} options - Playback options
   * @returns {THREE.Audio|THREE.PositionalAudio} - The audio object
   */
  playSound(id, options = {}) {
    // Check if sound exists
    const sound = this.sounds[id];
    if (!sound) {
      console.warn(`Sound not found: ${id}`);
      return null;
    }
    
    // Get options with defaults
    const volume = options.volume !== undefined ? options.volume : sound.settings.volume;
    const loop = options.loop !== undefined ? options.loop : sound.settings.loop;
    const spatial = this.settings.spatialAudio && 
                   (options.spatial !== undefined ? options.spatial : sound.settings.spatial);
    
    // Check if we should use a sound pool
    if (sound.settings.pool > 1 && this.soundPools[id]) {
      // Try to find an available audio object in the pool
      for (let i = 0; i < this.soundPools[id].length; i++) {
        const pooledAudio = this.soundPools[id][i];
        if (!pooledAudio.isPlaying) {
          // Reset and reuse this audio object
          pooledAudio.stop();
          pooledAudio.setVolume(volume * this.settings.sfxVolume);
          pooledAudio.setLoop(loop);
          
          // Update position for spatial audio
          if (spatial && options.position && pooledAudio.isPositionalAudio) {
            pooledAudio.position.copy(options.position);
          }
          
          // Play the sound
          pooledAudio.play();
          return pooledAudio;
        }
      }
      
      // If no available audio object was found and we haven't reached the pool limit
      if (this.soundPools[id].length < sound.settings.pool) {
        // Create a new audio object
        const audio = this._createAudio(sound.buffer, {
          volume: volume * this.settings.sfxVolume,
          loop,
          spatial,
          position: options.position
        });
        
        // Add to pool
        this.soundPools[id].push(audio);
        
        // Play the sound
        audio.play();
        return audio;
      }
      
      // If we've reached the pool limit, use the oldest sound
      const oldestAudio = this.soundPools[id][0];
      oldestAudio.stop();
      oldestAudio.setVolume(volume * this.settings.sfxVolume);
      oldestAudio.setLoop(loop);
      
      // Update position for spatial audio
      if (spatial && options.position && oldestAudio.isPositionalAudio) {
        oldestAudio.position.copy(options.position);
      }
      
      // Play the sound
      oldestAudio.play();
      
      // Move to end of array to implement round-robin reuse
      this.soundPools[id].push(this.soundPools[id].shift());
      
      return oldestAudio;
    } else {
      // Create a new audio object
      const audio = this._createAudio(sound.buffer, {
        volume: volume * this.settings.sfxVolume,
        loop,
        spatial,
        position: options.position
      });
      
      // Play the sound
      audio.play();
      return audio;
    }
  }
  
  /**
   * Play ambient sound
   * @param {string} id - Ambient sound identifier
   * @param {Object} options - Playback options
   * @returns {THREE.Audio} - The audio object
   */
  playAmbientSound(id, options = {}) {
    // Check if ambient sound exists
    const ambient = this.ambientSounds[id];
    if (!ambient) {
      console.warn(`Ambient sound not found: ${id}`);
      return null;
    }
    
    // Stop if already playing
    if (ambient.playing && ambient.audio) {
      ambient.audio.stop();
    }
    
    // Get options with defaults
    const volume = options.volume !== undefined ? options.volume : ambient.settings.volume;
    const loop = options.loop !== undefined ? options.loop : ambient.settings.loop;
    const spatial = this.settings.spatialAudio && 
                   (options.spatial !== undefined ? options.spatial : ambient.settings.spatial);
    
    // Create audio object
    const audio = this._createAudio(ambient.buffer, {
      volume: volume * this.settings.ambientVolume,
      loop,
      spatial,
      position: options.position,
      output: this.ambientGain
    });
    
    // Store audio object
    ambient.audio = audio;
    ambient.playing = true;
    
    // Play the ambient sound
    audio.play();
    return audio;
  }
  
  /**
   * Stop ambient sound
   * @param {string} id - Ambient sound identifier
   */
  stopAmbientSound(id) {
    // Check if ambient sound exists
    const ambient = this.ambientSounds[id];
    if (!ambient || !ambient.playing || !ambient.audio) {
      return;
    }
    
    // Stop the ambient sound
    ambient.audio.stop();
    ambient.playing = false;
  }
  
  /**
   * Play music track
   * @param {string} id - Music identifier
   * @param {Object} options - Playback options
   * @returns {THREE.Audio} - The audio object
   */
  playMusic(id, options = {}) {
    // Check if music exists
    const track = this.music[id];
    if (!track) {
      console.warn(`Music track not found: ${id}`);
      return null;
    }
    
    // Stop current music if any is playing
    this.stopAllMusic();
    
    // Get options with defaults
    const volume = options.volume !== undefined ? options.volume : track.settings.volume;
    const loop = options.loop !== undefined ? options.loop : track.settings.loop;
    const fadeIn = options.fadeIn !== undefined ? options.fadeIn : track.settings.fadeIn;
    
    // Create audio object
    const audio = new THREE.Audio(this.listener);
    audio.setBuffer(track.buffer);
    audio.setLoop(loop);
    
    // Connect to music gain node
    audio.gain.disconnect();
    audio.gain.connect(this.musicGain);
    
    // Apply fade-in
    if (fadeIn > 0) {
      audio.setVolume(0);
      audio.play();
      
      // Fade in
      const startVolume = 0;
      const endVolume = volume * this.settings.musicVolume;
      const startTime = this.context.currentTime;
      const endTime = startTime + fadeIn;
      
      audio.gain.gain.setValueAtTime(startVolume, startTime);
      audio.gain.gain.linearRampToValueAtTime(endVolume, endTime);
    } else {
      audio.setVolume(volume * this.settings.musicVolume);
      audio.play();
    }
    
    // Store audio object
    track.audio = audio;
    track.playing = true;
    
    return audio;
  }
  
  /**
   * Stop music track
   * @param {string} id - Music identifier
   * @param {Object} options - Stop options
   */
  stopMusic(id, options = {}) {
    // Check if music exists
    const track = this.music[id];
    if (!track || !track.playing || !track.audio) {
      return;
    }
    
    const fadeOut = options.fadeOut !== undefined ? options.fadeOut : track.settings.fadeOut;
    
    // Apply fade-out
    if (fadeOut > 0) {
      const startVolume = track.audio.getVolume();
      const startTime = this.context.currentTime;
      const endTime = startTime + fadeOut;
      
      track.audio.gain.gain.setValueAtTime(startVolume, startTime);
      track.audio.gain.gain.linearRampToValueAtTime(0, endTime);
      
      // Stop after fade-out
      setTimeout(() => {
        if (track.audio) {
          track.audio.stop();
          track.playing = false;
        }
      }, fadeOut * 1000);
    } else {
      // Stop immediately
      track.audio.stop();
      track.playing = false;
    }
  }
  
  /**
   * Stop all music tracks
   * @param {Object} options - Stop options
   */
  stopAllMusic(options = {}) {
    Object.keys(this.music).forEach(id => {
      this.stopMusic(id, options);
    });
  }
  
  /**
   * Create an audio object
   * @param {AudioBuffer} buffer - Audio buffer
   * @param {Object} options - Audio options
   * @returns {THREE.Audio|THREE.PositionalAudio} - The audio object
   * @private
   */
  _createAudio(buffer, options = {}) {
    let audio;
    
    // Create spatial or non-spatial audio
    if (options.spatial && options.position) {
      // Create positional audio
      audio = new THREE.PositionalAudio(this.listener);
      audio.position.copy(options.position);
      
      // Set spatial audio properties
      audio.setRefDistance(5);
      audio.setMaxDistance(100);
      audio.setRolloffFactor(1);
      audio.setDirectionalCone(180, 230, 0.5);
    } else {
      // Create regular audio
      audio = new THREE.Audio(this.listener);
    }
    
    // Set buffer and properties
    audio.setBuffer(buffer);
    audio.setVolume(options.volume || 1.0);
    audio.setLoop(options.loop || false);
    
    // Connect to specified output or default to sfx gain
    if (options.output) {
      audio.gain.disconnect();
      audio.gain.connect(options.output);
    } else {
      audio.gain.disconnect();
      audio.gain.connect(this.sfxGain);
    }
    
    return audio;
  }
  
  /**
   * Update all volume settings
   */
  updateVolumes() {
    // Apply master volume
    this.masterGain.gain.value = this.settings.masterVolume;
    
    // Apply category volumes
    this.sfxGain.gain.value = this.settings.sfxVolume;
    this.musicGain.gain.value = this.settings.musicVolume;
    this.ambientGain.gain.value = this.settings.ambientVolume;
  }
  
  /**
   * Set master volume
   * @param {number} volume - Volume level (0-1)
   */
  setMasterVolume(volume) {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }
  
  /**
   * Set SFX volume
   * @param {number} volume - Volume level (0-1)
   */
  setSFXVolume(volume) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }
  
  /**
   * Set music volume
   * @param {number} volume - Volume level (0-1)
   */
  setMusicVolume(volume) {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }
  
  /**
   * Set ambient volume
   * @param {number} volume - Volume level (0-1)
   */
  setAmbientVolume(volume) {
    this.settings.ambientVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }
  
  /**
   * Toggle spatial audio
   * @param {boolean} enabled - Whether spatial audio is enabled
   */
  setSpatialAudio(enabled) {
    this.settings.spatialAudio = enabled;
  }
  
  /**
   * Play a footstep sound
   * @param {string} surface - Surface type (optional)
   * @param {THREE.Vector3} position - Position of the footstep
   */
  playFootstep(surface = 'default', position) {
    // Choose appropriate footstep sound based on surface
    let soundId;
    switch (surface) {
      case 'metal':
        soundId = Math.random() > 0.5 ? 'footstep_metal1' : 'footstep_metal2';
        break;
      case 'wood':
        soundId = Math.random() > 0.5 ? 'footstep_wood1' : 'footstep_wood2';
        break;
      case 'water':
        soundId = Math.random() > 0.5 ? 'footstep_water1' : 'footstep_water2';
        break;
      default:
        soundId = Math.random() > 0.5 ? 'footstep1' : 'footstep2';
    }
    
    // Play the footstep sound
    return this.playSound(soundId, {
      position,
      volume: 0.5 + Math.random() * 0.2 // Slight volume variation
    });
  }
  
  /**
   * Play impact sound based on material
   * @param {string} material - Material type
   * @param {THREE.Vector3} position - Impact position
   */
  playImpactSound(material = 'default', position) {
    // Choose appropriate impact sound based on material
    let soundId;
    switch (material) {
      case 'metal':
        soundId = 'bullet_impact_metal';
        break;
      case 'wood':
        soundId = 'bullet_impact_wood';
        break;
      case 'concrete':
        soundId = 'bullet_impact_concrete';
        break;
      default:
        soundId = 'bullet_impact_concrete';
    }
    
    // Play the impact sound
    return this.playSound(soundId, {
      position,
      volume: 0.8 + Math.random() * 0.4 // Volume variation
    });
  }
  
  /**
   * Play weapon fire sound
   * @param {string} weaponType - Weapon type
   * @param {THREE.Vector3} position - Weapon position
   */
  playWeaponSound(weaponType, position) {
    // Choose appropriate weapon sound
    let soundId;
    switch (weaponType) {
      case 'pistol':
        soundId = 'pistol_fire';
        break;
      case 'rifle':
        soundId = 'rifle_fire';
        break;
      case 'shotgun':
        soundId = 'shotgun_fire';
        break;
      default:
        soundId = 'rifle_fire';
    }
    
    // Play the weapon sound
    return this.playSound(soundId, { position });
  }
  
  /**
   * Update audio listener position and orientation
   * @param {THREE.Camera} camera - Camera to sync with
   */
  updateListener(camera) {
    if (!camera || !this.listener) return;
    
    // Update listener position and orientation based on camera
    this.listener.position.copy(camera.position);
    
    // Get camera's forward and up vectors
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    
    const up = new THREE.Vector3(0, 1, 0);
    up.applyQuaternion(camera.quaternion);
    
    // Set listener orientation
    this.listener.setOrientation(
      forward.x, forward.y, forward.z,
      up.x, up.y, up.z
    );
  }
  
  /**
   * Clean up audio resources
   */
  dispose() {
    // Stop all sounds
    this.stopAllMusic({ fadeOut: 0 });
    
    Object.keys(this.ambientSounds).forEach(id => {
      this.stopAmbientSound(id);
    });
    
    // Disconnect audio nodes
    this.masterGain.disconnect();
    this.sfxGain.disconnect();
    this.musicGain.disconnect();
    this.ambientGain.disconnect();
    
    // Clear sound pools
    Object.keys(this.soundPools).forEach(id => {
      this.soundPools[id].forEach(audio => {
        if (audio.isPlaying) {
          audio.stop();
        }
      });
    });
    
    // Remove listener from camera
    if (this.listener.parent) {
      this.listener.parent.remove(this.listener);
    }
  }
}