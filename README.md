# WebAssembly FPS Game

A web-based first-person 3D shooter game that uses WebAssembly for performance and AI-driven features for dynamic gameplay.

## Features

- First-person controls (WASD + mouse)
- Basic shooting mechanics
- AI enemies that adapt to player tactics
- Dynamic environment that responds to gameplay
- Player personalization that adjusts difficulty
- Simple UI (health, score, crosshair)

## Tech Stack

### Frontend Framework
- Three.js for 3D rendering
- Vanilla JavaScript (ES6+) for game loop and UI

### Performance Layer
- WebAssembly (compiled from Rust) for:
  - Physics and collision detection
  - Enemy AI pathfinding and decision trees
  - Performance-critical calculations

### Build Tools
- wasm-pack for Rust → WebAssembly compilation
- Webpack for bundling JavaScript
- npm for dependency management

### AI Implementation
- Behavior trees in Rust/WebAssembly for enemy decision-making
- Simple rule-based system in JavaScript for dynamic environment
- Player metrics tracking in JavaScript with WebAssembly processing

## Getting Started

### Prerequisites

- Node.js and npm
- Rust and wasm-pack (for WebAssembly compilation)

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/fps-game.git
cd fps-game
```

2. Install dependencies
```
npm install
```

3. Build the WebAssembly modules
```
npm run build:wasm
```

4. Start the development server
```
npm start
```

5. Open your browser and navigate to `http://localhost:9000`

### Building for Production

```
npm run build
```

The production build will be in the `dist` directory.

## WebAssembly Integration

The game uses WebAssembly for performance-critical operations:

1. **Physics System**
   - Collision detection
   - Gravity and physics calculations
   - Projectile trajectory

2. **AI System**
   - Behavior trees for enemy decision making
   - Pathfinding algorithms
   - Line-of-sight calculations

3. **Math Operations**
   - Vector calculations
   - Matrix transformations
   - Spatial queries

The WebAssembly modules are compiled from Rust code using wasm-pack. If WebAssembly is not supported or fails to load, the game will automatically fall back to JavaScript implementations.

## Controls

- **W/A/S/D**: Move
- **Mouse**: Look around
- **Left Click**: Shoot
- **Space**: Jump
- **R**: Reload

## Performance

The game is designed to run at 60 FPS on mid-range hardware and be under 10MB total size.

## License

This project is licensed under the ISC License.