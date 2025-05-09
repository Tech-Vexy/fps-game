use wasm_bindgen::prelude::*;

mod math;
mod physics;
mod ai;

// Re-export modules
pub use math::Vector3;
pub use physics::PhysicsSystem;
pub use ai::{BehaviorTree, BehaviorContext, NodeType, NodeStatus, EnemyType, EnemyFactory};

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Log a message to the console
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Macro for logging to the console
macro_rules! console_log {
    ($($t:tt)*) => (log(&format!($($t)*)))
}

// Initialize the WebAssembly module
#[wasm_bindgen(start)]
pub fn start() {
    console_log!("WebAssembly module initialized with advanced AI");
}