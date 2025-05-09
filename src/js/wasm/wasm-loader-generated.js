// This is a generated file that loads the WebAssembly module
// It's created by the build-wasm.js script

export async function loadWasmModule() {
  try {
    // Dynamic import of the WebAssembly module
    const wasmModule = await import('../../rust/pkg/fps_game_wasm.js');
    
    // Initialize the module
    try {
      await wasmModule.default();
      console.log('WebAssembly module initialized successfully');
    } catch (initError) {
      console.warn('WebAssembly module initialization failed:', initError);
      // Continue anyway, as some functions might still work
    }
    
    // Log available exports for debugging
    console.log('WebAssembly module exports:', Object.keys(wasmModule));
    
    return wasmModule;
  } catch (error) {
    console.error('Failed to load WebAssembly module:', error);
    return null;
  }
}