// This file handles loading and initializing the WebAssembly module

import { WasmInterface } from './wasm-interface';

// Create a singleton instance
let wasmInstance = null;
let initializationPromise = null;

export async function initWasm() {
  // If already initialized, return the instance
  if (wasmInstance && wasmInstance.isLoaded) {
    return wasmInstance;
  }
  
  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Start initialization
  initializationPromise = _initWasm();
  return initializationPromise;
}

async function _initWasm() {
  try {
    // Create a new instance if needed
    if (!wasmInstance) {
      wasmInstance = new WasmInterface();
    }
    
    // Initialize the WebAssembly module
    await wasmInstance.init();
    
    return wasmInstance;
  } catch (error) {
    console.error('Failed to initialize WebAssembly:', error);
    
    // Fall back to JavaScript implementations
    console.warn('Falling back to JavaScript implementations');
    
    if (!wasmInstance) {
      wasmInstance = new WasmInterface();
    }
    
    await wasmInstance.initFallback();
    
    return wasmInstance;
  } finally {
    // Clear the initialization promise
    initializationPromise = null;
  }
}