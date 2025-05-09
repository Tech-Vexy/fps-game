use wasm_bindgen::prelude::*;
use super::behavior_tree::BehaviorTree;

// Enemy types
#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum EnemyType {
    Grunt = 0,
    Sniper = 1,
    Tank = 2,
    Scout = 3,
    Boss = 4,
}

// Factory for creating behavior trees for different enemy types
#[wasm_bindgen]
pub struct EnemyFactory {
}

#[wasm_bindgen]
impl EnemyFactory {
    #[wasm_bindgen(constructor)]
    pub fn new() -> EnemyFactory {
        EnemyFactory {}
    }
    
    // Create a behavior tree for a specific enemy type
    pub fn create_behavior_tree(&self, enemy_type: EnemyType) -> BehaviorTree {
        match enemy_type {
            EnemyType::Grunt => self.create_grunt_behavior_tree(),
            EnemyType::Sniper => self.create_sniper_behavior_tree(),
            EnemyType::Tank => self.create_tank_behavior_tree(),
            EnemyType::Scout => self.create_scout_behavior_tree(),
            EnemyType::Boss => self.create_boss_behavior_tree(),
        }
    }
    
    // Create a behavior tree for a Grunt enemy
    // Grunts are basic enemies that chase the player and attack when in range
    fn create_grunt_behavior_tree(&self) -> BehaviorTree {
        let mut tree = BehaviorTree::new();
        
        // Create the root selector node
        let root = tree.create_selector_node();
        
        // Create a sequence for when health is low (flee)
        let low_health_sequence = tree.create_sequence_node();
        let is_low_health = tree.create_condition_node(1, 0.3); // Health below 30%
        let flee_action = tree.create_action_node(2, 10.0); // Flee with speed 10
        
        tree.add_child(low_health_sequence, is_low_health);
        tree.add_child(low_health_sequence, flee_action);
        
        // Create a sequence for attacking
        let attack_sequence = tree.create_sequence_node();
        let is_in_attack_range = tree.create_condition_node(0, 2.0); // Target within 2 units
        let attack_action = tree.create_action_node(1, 10.0); // Attack with 10 damage
        
        tree.add_child(attack_sequence, is_in_attack_range);
        tree.add_child(attack_sequence, attack_action);
        
        // Create a chase action
        let chase_action = tree.create_action_node(0, 5.0); // Move with speed 5
        
        // Add all to root
        tree.add_child(root, low_health_sequence);
        tree.add_child(root, attack_sequence);
        tree.add_child(root, chase_action);
        
        tree.set_root(root);
        tree
    }
    
    // Create a behavior tree for a Sniper enemy
    // Snipers keep their distance and attack from afar
    fn create_sniper_behavior_tree(&self) -> BehaviorTree {
        let mut tree = BehaviorTree::new();
        
        // Create the root selector node
        let root = tree.create_selector_node();
        
        // Create a sequence for when health is low (flee)
        let low_health_sequence = tree.create_sequence_node();
        let is_low_health = tree.create_condition_node(1, 0.4); // Health below 40%
        let flee_action = tree.create_action_node(2, 8.0); // Flee with speed 8
        
        tree.add_child(low_health_sequence, is_low_health);
        tree.add_child(low_health_sequence, flee_action);
        
        // Create a sequence for when target is too close (back away)
        let too_close_sequence = tree.create_sequence_node();
        let is_too_close = tree.create_condition_node(0, 10.0); // Target within 10 units
        let back_away_action = tree.create_action_node(2, 6.0); // Flee with speed 6
        
        tree.add_child(too_close_sequence, is_too_close);
        tree.add_child(too_close_sequence, back_away_action);
        
        // Create a sequence for attacking
        let attack_sequence = tree.create_sequence_node();
        let is_in_attack_range = tree.create_condition_node(0, 30.0); // Target within 30 units
        let is_cooldown_ready = tree.create_condition_node(4, 1.0); // Cooldown 1 is ready
        let attack_action = tree.create_action_node(1, 25.0); // Attack with 25 damage
        let set_cooldown = tree.create_action_node(5, 3.0); // Set cooldown 1 to 3 seconds
        
        tree.add_child(attack_sequence, is_in_attack_range);
        tree.add_child(attack_sequence, is_cooldown_ready);
        tree.add_child(attack_sequence, attack_action);
        tree.add_child(attack_sequence, set_cooldown);
        
        // Create a find position action
        let find_position_action = tree.create_action_node(0, 3.0); // Move with speed 3
        
        // Add all to root
        tree.add_child(root, low_health_sequence);
        tree.add_child(root, too_close_sequence);
        tree.add_child(root, attack_sequence);
        tree.add_child(root, find_position_action);
        
        tree.set_root(root);
        tree
    }
    
    // Create a behavior tree for a Tank enemy
    // Tanks are slow but have high health and damage
    fn create_tank_behavior_tree(&self) -> BehaviorTree {
        let mut tree = BehaviorTree::new();
        
        // Create the root selector node
        let root = tree.create_selector_node();
        
        // Create a sequence for special ability (charge)
        let special_sequence = tree.create_sequence_node();
        let is_cooldown_ready = tree.create_condition_node(4, 2.0); // Cooldown 2 is ready
        let is_in_charge_range = tree.create_condition_node(0, 15.0); // Target within 15 units
        let charge_action = tree.create_action_node(4, 1.0); // Special ability 1 (charge)
        let set_cooldown = tree.create_action_node(5, 10.0); // Set cooldown 2 to 10 seconds
        
        tree.add_child(special_sequence, is_cooldown_ready);
        tree.add_child(special_sequence, is_in_charge_range);
        tree.add_child(special_sequence, charge_action);
        tree.add_child(special_sequence, set_cooldown);
        
        // Create a sequence for attacking
        let attack_sequence = tree.create_sequence_node();
        let is_in_attack_range = tree.create_condition_node(0, 3.0); // Target within 3 units
        let attack_action = tree.create_action_node(1, 20.0); // Attack with 20 damage
        
        tree.add_child(attack_sequence, is_in_attack_range);
        tree.add_child(attack_sequence, attack_action);
        
        // Create a chase action
        let chase_action = tree.create_action_node(0, 3.0); // Move with speed 3
        
        // Add all to root
        tree.add_child(root, special_sequence);
        tree.add_child(root, attack_sequence);
        tree.add_child(root, chase_action);
        
        tree.set_root(root);
        tree
    }
    
    // Create a behavior tree for a Scout enemy
    // Scouts are fast and evasive
    fn create_scout_behavior_tree(&self) -> BehaviorTree {
        let mut tree = BehaviorTree::new();
        
        // Create the root selector node
        let root = tree.create_selector_node();
        
        // Create a sequence for hit and run
        let hit_run_sequence = tree.create_sequence_node();
        let is_in_attack_range = tree.create_condition_node(0, 5.0); // Target within 5 units
        let is_cooldown_ready = tree.create_condition_node(4, 3.0); // Cooldown 3 is ready
        let attack_action = tree.create_action_node(1, 8.0); // Attack with 8 damage
        let set_cooldown = tree.create_action_node(5, 2.0); // Set cooldown 3 to 2 seconds
        let flee_action = tree.create_action_node(2, 12.0); // Flee with speed 12
        
        tree.add_child(hit_run_sequence, is_in_attack_range);
        tree.add_child(hit_run_sequence, is_cooldown_ready);
        tree.add_child(hit_run_sequence, attack_action);
        tree.add_child(hit_run_sequence, set_cooldown);
        tree.add_child(hit_run_sequence, flee_action);
        
        // Create a sequence for circling the player
        let circle_sequence = tree.create_sequence_node();
        let is_in_circle_range = tree.create_condition_node(0, 10.0); // Target within 10 units
        let circle_action = tree.create_action_node(4, 2.0); // Special ability 2 (circle)
        
        tree.add_child(circle_sequence, is_in_circle_range);
        tree.add_child(circle_sequence, circle_action);
        
        // Create an approach action
        let approach_action = tree.create_action_node(0, 8.0); // Move with speed 8
        
        // Add all to root
        tree.add_child(root, hit_run_sequence);
        tree.add_child(root, circle_sequence);
        tree.add_child(root, approach_action);
        
        tree.set_root(root);
        tree
    }
    
    // Create a behavior tree for a Boss enemy
    // Bosses have multiple attack patterns and phases
    fn create_boss_behavior_tree(&self) -> BehaviorTree {
        let mut tree = BehaviorTree::new();
        
        // Create the root selector node
        let root = tree.create_selector_node();
        
        // Create a sequence for phase 2 (health < 50%)
        let phase2_sequence = tree.create_sequence_node();
        let is_phase2 = tree.create_condition_node(1, 0.5); // Health below 50%
        
        // Phase 2 selector
        let phase2_selector = tree.create_selector_node();
        
        // Special attack 1
        let special1_sequence = tree.create_sequence_node();
        let is_cooldown1_ready = tree.create_condition_node(4, 4.0); // Cooldown 4 is ready
        let special1_action = tree.create_action_node(4, 3.0); // Special ability 3
        let set_cooldown1 = tree.create_action_node(5, 8.0); // Set cooldown 4 to 8 seconds
        
        tree.add_child(special1_sequence, is_cooldown1_ready);
        tree.add_child(special1_sequence, special1_action);
        tree.add_child(special1_sequence, set_cooldown1);
        
        // Special attack 2
        let special2_sequence = tree.create_sequence_node();
        let is_cooldown2_ready = tree.create_condition_node(4, 5.0); // Cooldown 5 is ready
        let special2_action = tree.create_action_node(4, 4.0); // Special ability 4
        let set_cooldown2 = tree.create_action_node(5, 12.0); // Set cooldown 5 to 12 seconds
        
        tree.add_child(special2_sequence, is_cooldown2_ready);
        tree.add_child(special2_sequence, special2_action);
        tree.add_child(special2_sequence, set_cooldown2);
        
        // Normal attack
        let attack_sequence = tree.create_sequence_node();
        let is_in_attack_range = tree.create_condition_node(0, 4.0); // Target within 4 units
        let attack_action = tree.create_action_node(1, 30.0); // Attack with 30 damage
        
        tree.add_child(attack_sequence, is_in_attack_range);
        tree.add_child(attack_sequence, attack_action);
        
        // Chase action
        let chase_action = tree.create_action_node(0, 6.0); // Move with speed 6
        
        // Add all to phase 2 selector
        tree.add_child(phase2_selector, special1_sequence);
        tree.add_child(phase2_selector, special2_sequence);
        tree.add_child(phase2_selector, attack_sequence);
        tree.add_child(phase2_selector, chase_action);
        
        // Add phase 2 selector to phase 2 sequence
        tree.add_child(phase2_sequence, is_phase2);
        tree.add_child(phase2_sequence, phase2_selector);
        
        // Create a sequence for phase 1 (health >= 50%)
        let phase1_selector = tree.create_selector_node();
        
        // Special attack
        let phase1_special_sequence = tree.create_sequence_node();
        let is_phase1_cooldown_ready = tree.create_condition_node(4, 6.0); // Cooldown 6 is ready
        let phase1_special_action = tree.create_action_node(4, 5.0); // Special ability 5
        let phase1_set_cooldown = tree.create_action_node(5, 15.0); // Set cooldown 6 to 15 seconds
        
        tree.add_child(phase1_special_sequence, is_phase1_cooldown_ready);
        tree.add_child(phase1_special_sequence, phase1_special_action);
        tree.add_child(phase1_special_sequence, phase1_set_cooldown);
        
        // Normal attack
        let phase1_attack_sequence = tree.create_sequence_node();
        let phase1_is_in_attack_range = tree.create_condition_node(0, 5.0); // Target within 5 units
        let phase1_attack_action = tree.create_action_node(1, 20.0); // Attack with 20 damage
        
        tree.add_child(phase1_attack_sequence, phase1_is_in_attack_range);
        tree.add_child(phase1_attack_sequence, phase1_attack_action);
        
        // Chase action
        let phase1_chase_action = tree.create_action_node(0, 4.0); // Move with speed 4
        
        // Add all to phase 1 selector
        tree.add_child(phase1_selector, phase1_special_sequence);
        tree.add_child(phase1_selector, phase1_attack_sequence);
        tree.add_child(phase1_selector, phase1_chase_action);
        
        // Add all to root
        tree.add_child(root, phase2_sequence);
        tree.add_child(root, phase1_selector);
        
        tree.set_root(root);
        tree
    }
}