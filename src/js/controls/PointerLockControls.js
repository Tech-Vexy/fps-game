import * as THREE from 'three';

export class PointerLockControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement || document.body;
    
    this.isLocked = false;
    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians
    
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.PI_2 = Math.PI / 2;
    
    this.vec = new THREE.Vector3();
    
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onPointerlockChange = this.onPointerlockChange.bind(this);
    this.onPointerlockError = this.onPointerlockError.bind(this);
    
    this.connect();
  }
  
  connect() {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerlockChange);
    document.addEventListener('pointerlockerror', this.onPointerlockError);
  }
  
  disconnect() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerlockChange);
    document.removeEventListener('pointerlockerror', this.onPointerlockError);
  }
  
  dispose() {
    this.disconnect();
  }
  
  getObject() {
    return this.camera;
  }
  
  getDirection() {
    const direction = new THREE.Vector3(0, 0, -1);
    return function(v) {
      return v.copy(direction).applyQuaternion(this.camera.quaternion);
    };
  }
  
  lock() {
    this.domElement.requestPointerLock();
  }
  
  unlock() {
    document.exitPointerLock();
  }
  
  onMouseMove(event) {
    if (!this.isLocked) return;
    
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    
    this.euler.setFromQuaternion(this.camera.quaternion);
    
    this.euler.y -= movementX * 0.002;
    this.euler.x -= movementY * 0.002;
    
    this.euler.x = Math.max(this.PI_2 - this.maxPolarAngle, Math.min(this.PI_2 - this.minPolarAngle, this.euler.x));
    
    this.camera.quaternion.setFromEuler(this.euler);
  }
  
  onPointerlockChange() {
    this.isLocked = document.pointerLockElement === this.domElement;
  }
  
  onPointerlockError() {
    console.error('PointerLockControls: Unable to use Pointer Lock API');
  }
}