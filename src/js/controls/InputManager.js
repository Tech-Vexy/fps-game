/**
 * Manages all input for the game (keyboard, mouse, gamepad)
 */
export class InputManager {
  constructor() {
    // Key states
    this.keys = {};
    this.previousKeys = {};
    
    // Mouse states
    this.mousePosition = { x: 0, y: 0 };
    this.mouseDelta = { x: 0, y: 0 };
    this.mouseButtons = { left: false, middle: false, right: false };
    this.previousMouseButtons = { left: false, middle: false, right: false };
    this.mouseWheelDelta = 0;
    this.isPointerLocked = false;
    
    // Gamepad states
    this.gamepads = {};
    this.gamepadAxes = {};
    this.previousGamepadButtons = {};
    
    // Touch states for mobile
    this.touches = {};
    this.virtualJoystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
    this.virtualButtons = {};
    
    // Bind event handlers
    this._bindEvents();
    
    // Start gamepad polling
    this._startGamepadPolling();
  }
  
  /**
   * Bind all event listeners
   * @private
   */
  _bindEvents() {
    // Keyboard events
    window.addEventListener('keydown', this._handleKeyDown.bind(this));
    window.addEventListener('keyup', this._handleKeyUp.bind(this));
    
    // Mouse events
    window.addEventListener('mousemove', this._handleMouseMove.bind(this));
    window.addEventListener('mousedown', this._handleMouseDown.bind(this));
    window.addEventListener('mouseup', this._handleMouseUp.bind(this));
    window.addEventListener('wheel', this._handleMouseWheel.bind(this));
    
    // Pointer lock events
    document.addEventListener('pointerlockchange', this._handlePointerLockChange.bind(this));
    document.addEventListener('pointerlockerror', this._handlePointerLockError.bind(this));
    
    // Gamepad events
    window.addEventListener('gamepadconnected', this._handleGamepadConnected.bind(this));
    window.addEventListener('gamepaddisconnected', this._handleGamepadDisconnected.bind(this));
    
    // Touch events for mobile
    window.addEventListener('touchstart', this._handleTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this._handleTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this._handleTouchEnd.bind(this), { passive: false });
    
    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    
    // Handle visibility change to reset input state when tab is changed
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.reset();
      }
    });
  }
  
  /**
   * Start polling for gamepad input
   * @private
   */
  _startGamepadPolling() {
    const pollGamepads = () => {
      this._updateGamepadState();
      requestAnimationFrame(pollGamepads);
    };
    
    requestAnimationFrame(pollGamepads);
  }
  
  /**
   * Handle key down events
   * @param {KeyboardEvent} event - The keyboard event
   * @private
   */
  _handleKeyDown(event) {
    this.keys[event.code] = true;
  }
  
  /**
   * Handle key up events
   * @param {KeyboardEvent} event - The keyboard event
   * @private
   */
  _handleKeyUp(event) {
    this.keys[event.code] = false;
  }
  
  /**
   * Handle mouse move events
   * @param {MouseEvent} event - The mouse event
   * @private
   */
  _handleMouseMove(event) {
    if (this.isPointerLocked) {
      // Use movementX/Y for pointer lock (more accurate)
      this.mouseDelta.x = event.movementX || 0;
      this.mouseDelta.y = event.movementY || 0;
    } else {
      // Calculate delta from previous position
      const prevX = this.mousePosition.x;
      const prevY = this.mousePosition.y;
      
      this.mousePosition.x = event.clientX;
      this.mousePosition.y = event.clientY;
      
      this.mouseDelta.x = this.mousePosition.x - prevX;
      this.mouseDelta.y = this.mousePosition.y - prevY;
    }
  }
  
  /**
   * Handle mouse down events
   * @param {MouseEvent} event - The mouse event
   * @private
   */
  _handleMouseDown(event) {
    switch (event.button) {
      case 0: this.mouseButtons.left = true; break;
      case 1: this.mouseButtons.middle = true; break;
      case 2: this.mouseButtons.right = true; break;
    }
  }
  
  /**
   * Handle mouse up events
   * @param {MouseEvent} event - The mouse event
   * @private
   */
  _handleMouseUp(event) {
    switch (event.button) {
      case 0: this.mouseButtons.left = false; break;
      case 1: this.mouseButtons.middle = false; break;
      case 2: this.mouseButtons.right = false; break;
    }
  }
  
  /**
   * Handle mouse wheel events
   * @param {WheelEvent} event - The wheel event
   * @private
   */
  _handleMouseWheel(event) {
    this.mouseWheelDelta = Math.sign(event.deltaY);
  }
  
  /**
   * Handle pointer lock change
   * @private
   */
  _handlePointerLockChange() {
    this.isPointerLocked = document.pointerLockElement !== null;
  }
  
  /**
   * Handle pointer lock error
   * @private
   */
  _handlePointerLockError() {
    console.error('Pointer lock error');
    this.isPointerLocked = false;
  }
  
  /**
   * Handle gamepad connected
   * @param {GamepadEvent} event - The gamepad event
   * @private
   */
  _handleGamepadConnected(event) {
    console.log(`Gamepad connected: ${event.gamepad.id}`);
    this.gamepads[event.gamepad.index] = event.gamepad;
    this.previousGamepadButtons[event.gamepad.index] = Array(event.gamepad.buttons.length).fill(false);
    this.gamepadAxes[event.gamepad.index] = Array(event.gamepad.axes.length).fill(0);
  }
  
  /**
   * Handle gamepad disconnected
   * @param {GamepadEvent} event - The gamepad event
   * @private
   */
  _handleGamepadDisconnected(event) {
    console.log(`Gamepad disconnected: ${event.gamepad.id}`);
    delete this.gamepads[event.gamepad.index];
    delete this.previousGamepadButtons[event.gamepad.index];
    delete this.gamepadAxes[event.gamepad.index];
  }
  
  /**
   * Update gamepad state
   * @private
   */
  _updateGamepadState() {
    // Get the latest gamepad state
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      
      if (!gamepad) continue;
      
      // Store the gamepad
      this.gamepads[gamepad.index] = gamepad;
      
      // Initialize button state array if needed
      if (!this.previousGamepadButtons[gamepad.index]) {
        this.previousGamepadButtons[gamepad.index] = Array(gamepad.buttons.length).fill(false);
      }
      
      // Store axes values with deadzone
      if (!this.gamepadAxes[gamepad.index]) {
        this.gamepadAxes[gamepad.index] = Array(gamepad.axes.length).fill(0);
      }
      
      // Update axes with deadzone
      for (let j = 0; j < gamepad.axes.length; j++) {
        const value = gamepad.axes[j];
        // Apply deadzone of 0.1
        this.gamepadAxes[gamepad.index][j] = Math.abs(value) < 0.1 ? 0 : value;
      }
    }
  }
  
  /**
   * Handle touch start events
   * @param {TouchEvent} event - The touch event
   * @private
   */
  _handleTouchStart(event) {
    event.preventDefault();
    
    // Store all active touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.touches[touch.identifier] = {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY
      };
      
      // Check if this is a virtual joystick touch (left side of screen)
      if (touch.clientX < window.innerWidth / 2) {
        this.virtualJoystick = {
          active: true,
          id: touch.identifier,
          startX: touch.clientX,
          startY: touch.clientY,
          currentX: touch.clientX,
          currentY: touch.clientY
        };
      } else {
        // Right side touches are action buttons
        const buttonY = touch.clientY / window.innerHeight;
        
        if (buttonY < 0.33) {
          this.virtualButtons.jump = true;
        } else if (buttonY < 0.66) {
          this.virtualButtons.action = true;
        } else {
          this.virtualButtons.fire = true;
        }
      }
    }
  }
  
  /**
   * Handle touch move events
   * @param {TouchEvent} event - The touch event
   * @private
   */
  _handleTouchMove(event) {
    event.preventDefault();
    
    // Update all active touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      
      if (this.touches[touch.identifier]) {
        this.touches[touch.identifier].currentX = touch.clientX;
        this.touches[touch.identifier].currentY = touch.clientY;
        
        // Update virtual joystick if this is the joystick touch
        if (this.virtualJoystick.active && this.virtualJoystick.id === touch.identifier) {
          this.virtualJoystick.currentX = touch.clientX;
          this.virtualJoystick.currentY = touch.clientY;
        }
      }
    }
  }
  
  /**
   * Handle touch end events
   * @param {TouchEvent} event - The touch event
   * @private
   */
  _handleTouchEnd(event) {
    event.preventDefault();
    
    // Remove ended touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      
      // Reset virtual joystick if this was the joystick touch
      if (this.virtualJoystick.active && this.virtualJoystick.id === touch.identifier) {
        this.virtualJoystick.active = false;
      }
      
      // Reset virtual buttons if this was on the right side
      if (this.touches[touch.identifier] && this.touches[touch.identifier].startX > window.innerWidth / 2) {
        this.virtualButtons = {};
      }
      
      // Remove the touch
      delete this.touches[touch.identifier];
    }
  }
  
  /**
   * Request pointer lock on the document
   * @param {HTMLElement} element - The element to lock the pointer to
   */
  requestPointerLock(element) {
    if (element.requestPointerLock) {
      element.requestPointerLock();
    }
  }
  
  /**
   * Exit pointer lock
   */
  exitPointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }
  
  /**
   * Check if a key is currently pressed
   * @param {string} code - The key code to check
   * @returns {boolean} - True if the key is pressed
   */
  isKeyPressed(code) {
    return this.keys[code] === true;
  }
  
  /**
   * Check if a key was just pressed this frame
   * @param {string} code - The key code to check
   * @returns {boolean} - True if the key was just pressed
   */
  isKeyJustPressed(code) {
    return this.keys[code] === true && this.previousKeys[code] !== true;
  }
  
  /**
   * Check if a key was just released this frame
   * @param {string} code - The key code to check
   * @returns {boolean} - True if the key was just released
   */
  isKeyJustReleased(code) {
    return this.keys[code] !== true && this.previousKeys[code] === true;
  }
  
  /**
   * Check if a mouse button is currently pressed
   * @param {string} button - The button to check ('left', 'middle', 'right')
   * @returns {boolean} - True if the button is pressed
   */
  isMouseButtonPressed(button) {
    return this.mouseButtons[button] === true;
  }
  
  /**
   * Check if a mouse button was just pressed this frame
   * @param {string} button - The button to check ('left', 'middle', 'right')
   * @returns {boolean} - True if the button was just pressed
   */
  isMouseButtonJustPressed(button) {
    return this.mouseButtons[button] === true && this.previousMouseButtons[button] !== true;
  }
  
  /**
   * Check if a mouse button was just released this frame
   * @param {string} button - The button to check ('left', 'middle', 'right')
   * @returns {boolean} - True if the button was just released
   */
  isMouseButtonJustReleased(button) {
    return this.mouseButtons[button] !== true && this.previousMouseButtons[button] === true;
  }
  
  /**
   * Get the mouse position
   * @returns {Object} - The mouse position {x, y}
   */
  getMousePosition() {
    return { ...this.mousePosition };
  }
  
  /**
   * Get the mouse delta (movement since last frame)
   * @returns {Object} - The mouse delta {x, y}
   */
  getMouseDelta() {
    return { ...this.mouseDelta };
  }
  
  /**
   * Get the mouse wheel delta
   * @returns {number} - The mouse wheel delta
   */
  getMouseWheelDelta() {
    return this.mouseWheelDelta;
  }
  
  /**
   * Get a gamepad axis value
   * @param {number} gamepadIndex - The gamepad index
   * @param {number} axisIndex - The axis index
   * @returns {number} - The axis value (-1 to 1)
   */
  getGamepadAxis(gamepadIndex = 0, axisIndex) {
    if (this.gamepadAxes[gamepadIndex] && this.gamepadAxes[gamepadIndex][axisIndex] !== undefined) {
      return this.gamepadAxes[gamepadIndex][axisIndex];
    }
    return 0;
  }
  
  /**
   * Check if a gamepad button is pressed
   * @param {number} gamepadIndex - The gamepad index
   * @param {number} buttonIndex - The button index
   * @returns {boolean} - True if the button is pressed
   */
  isGamepadButtonPressed(gamepadIndex = 0, buttonIndex) {
    const gamepad = this.gamepads[gamepadIndex];
    if (gamepad && gamepad.buttons[buttonIndex]) {
      return gamepad.buttons[buttonIndex].pressed;
    }
    return false;
  }
  
  /**
   * Check if a gamepad button was just pressed this frame
   * @param {number} gamepadIndex - The gamepad index
   * @param {number} buttonIndex - The button index
   * @returns {boolean} - True if the button was just pressed
   */
  isGamepadButtonJustPressed(gamepadIndex = 0, buttonIndex) {
    const gamepad = this.gamepads[gamepadIndex];
    if (gamepad && gamepad.buttons[buttonIndex]) {
      const isPressed = gamepad.buttons[buttonIndex].pressed;
      const wasPressed = this.previousGamepadButtons[gamepadIndex][buttonIndex];
      return isPressed && !wasPressed;
    }
    return false;
  }
  
  /**
   * Get the virtual joystick values for mobile
   * @returns {Object} - The joystick values {x, y} from -1 to 1
   */
  getVirtualJoystick() {
    if (!this.virtualJoystick.active) {
      return { x: 0, y: 0 };
    }
    
    // Calculate direction vector
    const dx = this.virtualJoystick.currentX - this.virtualJoystick.startX;
    const dy = this.virtualJoystick.currentY - this.virtualJoystick.startY;
    
    // Normalize to -1 to 1 with a maximum radius
    const maxRadius = 50; // Maximum joystick radius in pixels
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    
    if (magnitude === 0) {
      return { x: 0, y: 0 };
    }
    
    const normalizedMagnitude = Math.min(magnitude, maxRadius) / maxRadius;
    const normalizedX = (dx / magnitude) * normalizedMagnitude;
    const normalizedY = (dy / magnitude) * normalizedMagnitude;
    
    return { x: normalizedX, y: normalizedY };
  }
  
  /**
   * Check if a virtual button is pressed
   * @param {string} button - The button name ('jump', 'action', 'fire')
   * @returns {boolean} - True if the button is pressed
   */
  isVirtualButtonPressed(button) {
    return this.virtualButtons[button] === true;
  }
  
  /**
   * Update input state (call this at the end of each frame)
   */
  update() {
    // Store previous key states
    this.previousKeys = { ...this.keys };
    
    // Store previous mouse button states
    this.previousMouseButtons = { ...this.mouseButtons };
    
    // Reset mouse delta and wheel delta
    this.mouseDelta = { x: 0, y: 0 };
    this.mouseWheelDelta = 0;
    
    // Store previous gamepad button states
    for (const gamepadIndex in this.gamepads) {
      const gamepad = this.gamepads[gamepadIndex];
      if (gamepad && gamepad.buttons) {
        for (let i = 0; i < gamepad.buttons.length; i++) {
          if (!this.previousGamepadButtons[gamepadIndex]) {
            this.previousGamepadButtons[gamepadIndex] = [];
          }
          this.previousGamepadButtons[gamepadIndex][i] = gamepad.buttons[i].pressed;
        }
      }
    }
  }
  
  /**
   * Reset all input states
   */
  reset() {
    this.keys = {};
    this.previousKeys = {};
    this.mouseButtons = { left: false, middle: false, right: false };
    this.previousMouseButtons = { left: false, middle: false, right: false };
    this.mouseDelta = { x: 0, y: 0 };
    this.mouseWheelDelta = 0;
    this.virtualJoystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
    this.virtualButtons = {};
    this.touches = {};
  }
}