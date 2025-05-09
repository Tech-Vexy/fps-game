use wasm_bindgen::prelude::*;
use crate::math::Vector3;

// Physics system for collision detection
#[wasm_bindgen]
pub struct PhysicsSystem {
    gravity: f32,
}

#[wasm_bindgen]
impl PhysicsSystem {
    #[wasm_bindgen(constructor)]
    pub fn new() -> PhysicsSystem {
        PhysicsSystem { gravity: 9.8 }
    }

    pub fn apply_gravity(&self, position: &mut Vector3, velocity: &mut Vector3, delta_time: f32) {
        velocity.y -= self.gravity * delta_time;
        position.y += velocity.y * delta_time;

        // Simple ground collision
        if position.y < 0.0 {
            position.y = 0.0;
            velocity.y = 0.0;
        }
    }

    pub fn check_sphere_collision(
        &self,
        position1: &Vector3,
        radius1: f32,
        position2: &Vector3,
        radius2: f32,
    ) -> bool {
        let dx = position1.x - position2.x;
        let dy = position1.y - position2.y;
        let dz = position1.z - position2.z;
        let distance = (dx * dx + dy * dy + dz * dz).sqrt();
        distance < (radius1 + radius2)
    }

    pub fn resolve_sphere_collision(
        &self,
        position1: &mut Vector3,
        velocity1: &mut Vector3,
        mass1: f32,
        position2: &mut Vector3,
        velocity2: &mut Vector3,
        mass2: f32,
    ) {
        // Calculate direction vector
        let mut direction = Vector3 {
            x: position1.x - position2.x,
            y: position1.y - position2.y,
            z: position1.z - position2.z,
        };
        direction.normalize();

        // Calculate relative velocity
        let relative_velocity = Vector3 {
            x: velocity1.x - velocity2.x,
            y: velocity1.y - velocity2.y,
            z: velocity1.z - velocity2.z,
        };

        // Calculate velocity along the normal
        let velocity_along_normal = relative_velocity.x * direction.x
            + relative_velocity.y * direction.y
            + relative_velocity.z * direction.z;

        // Do not resolve if velocities are separating
        if velocity_along_normal > 0.0 {
            return;
        }

        // Calculate restitution (bounciness)
        let restitution = 0.2;

        // Calculate impulse scalar
        let impulse_scalar = -(1.0 + restitution) * velocity_along_normal;
        let impulse_scalar = impulse_scalar / (1.0 / mass1 + 1.0 / mass2);

        // Apply impulse
        velocity1.x += impulse_scalar * direction.x / mass1;
        velocity1.y += impulse_scalar * direction.y / mass1;
        velocity1.z += impulse_scalar * direction.z / mass1;

        velocity2.x -= impulse_scalar * direction.x / mass2;
        velocity2.y -= impulse_scalar * direction.y / mass2;
        velocity2.z -= impulse_scalar * direction.z / mass2;
    }
}