const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if Rust is installed
console.log('Checking Rust installation...');
try {
  const rustVersion = execSync('rustc --version').toString().trim();
  console.log(rustVersion);
} catch (error) {
  console.error('Rust is not installed. Please install Rust from https://rustup.rs/');
  process.exit(1);
}

// Check if wasm-pack is installed
console.log('Checking wasm-pack installation...');
try {
  const wasmPackVersion = execSync('wasm-pack --version').toString().trim();
  console.log(wasmPackVersion);
} catch (error) {
  console.error('wasm-pack is not installed. Please install it with: cargo install wasm-pack');
  process.exit(1);
}

// Build the WebAssembly module
console.log('Building WebAssembly module...');
try {
  execSync('cd src/rust && wasm-pack build --target web');
  console.log('WebAssembly module built successfully!');
} catch (error) {
  console.error('Failed to build WebAssembly module:', error);
  process.exit(1);
}

// Generate the wasm-loader-generated.js file
const loaderContent = `// This is a generated file that loads the WebAssembly module
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
}`;

const loaderPath = path.join(__dirname, 'src', 'js', 'wasm', 'wasm-loader-generated.js');
fs.writeFileSync(loaderPath, loaderContent);
console.log(`WebAssembly loader module generated at ${loaderPath}`);

console.log('WebAssembly build completed successfully!');