use wasm_bindgen::prelude::*;
use std::collections::HashMap;

// AI behavior tree node types
#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
pub enum NodeType {
    Sequence,
    Selector,
    Inverter,
    Succeeder,
    Repeater,
    Action,
    Condition,
    Parallel,
}

// AI behavior tree node status
#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum NodeStatus {
    Success,
    Failure,
    Running,
}

// Context for behavior tree execution
#[wasm_bindgen]
pub struct BehaviorContext {
    // We'll use a simple key-value store for the context
    values: HashMap<String, f64>,
    target_x: f64,
    target_y: f64,
    target_z: f64,
    entity_x: f64,
    entity_y: f64,
    entity_z: f64,
    entity_health: f64,
    entity_max_health: f64,
    entity_type: u32,
}

#[wasm_bindgen]
impl BehaviorContext {
    #[wasm_bindgen(constructor)]
    pub fn new() -> BehaviorContext {
        BehaviorContext {
            values: HashMap::new(),
            target_x: 0.0,
            target_y: 0.0,
            target_z: 0.0,
            entity_x: 0.0,
            entity_y: 0.0,
            entity_z: 0.0,
            entity_health: 100.0,
            entity_max_health: 100.0,
            entity_type: 0,
        }
    }

    pub fn set_value(&mut self, key: &str, value: f64) {
        self.values.insert(key.to_string(), value);
    }

    pub fn get_value(&self, key: &str) -> f64 {
        *self.values.get(key).unwrap_or(&0.0)
    }

    pub fn set_target_position(&mut self, x: f64, y: f64, z: f64) {
        self.target_x = x;
        self.target_y = y;
        self.target_z = z;
    }

    pub fn set_entity_position(&mut self, x: f64, y: f64, z: f64) {
        self.entity_x = x;
        self.entity_y = y;
        self.entity_z = z;
    }

    pub fn set_entity_health(&mut self, health: f64, max_health: f64) {
        self.entity_health = health;
        self.entity_max_health = max_health;
    }

    pub fn set_entity_type(&mut self, entity_type: u32) {
        self.entity_type = entity_type;
    }

    pub fn get_distance_to_target(&self) -> f64 {
        let dx = self.target_x - self.entity_x;
        let dy = self.target_y - self.entity_y;
        let dz = self.target_z - self.entity_z;
        (dx * dx + dy * dy + dz * dz).sqrt()
    }

    pub fn get_health_percentage(&self) -> f64 {
        if self.entity_max_health <= 0.0 {
            return 0.0;
        }
        self.entity_health / self.entity_max_health
    }
}

// AI behavior tree for enemy decision making
#[wasm_bindgen]
pub struct BehaviorTree {
    root_id: usize,
    nodes: HashMap<usize, Node>,
    next_id: usize,
}

struct Node {
    node_type: NodeType,
    children: Vec<usize>,
    condition_type: u32,
    action_type: u32,
    parameter: f64,
    success_threshold: usize,
    repeat_times: usize,
}

#[wasm_bindgen]
impl BehaviorTree {
    #[wasm_bindgen(constructor)]
    pub fn new() -> BehaviorTree {
        BehaviorTree {
            root_id: 0,
            nodes: HashMap::new(),
            next_id: 0,
        }
    }

    pub fn create_sequence_node(&mut self) -> usize {
        let id = self.next_id;
        self.next_id += 1;

        self.nodes.insert(
            id,
            Node {
                node_type: NodeType::Sequence,
                children: Vec::new(),
                condition_type: 0,
                action_type: 0,
                parameter: 0.0,
                success_threshold: 0,
                repeat_times: 0,
            },
        );

        id
    }

    pub fn create_selector_node(&mut self) -> usize {
        let id = self.next_id;
        self.next_id += 1;

        self.nodes.insert(
            id,
            Node {
                node_type: NodeType::Selector,
                children: Vec::new(),
                condition_type: 0,
                action_type: 0,
                parameter: 0.0,
                success_threshold: 0,
                repeat_times: 0,
            },
        );

        id
    }

    pub fn create_inverter_node(&mut self) -> usize {
        let id = self.next_id;
        self.next_id += 1;

        self.nodes.insert(
            id,
            Node {
                node_type: NodeType::Inverter,
                children: Vec::new(),
                condition_type: 0,
                action_type: 0,
                parameter: 0.0,
                success_threshold: 0,
                repeat_times: 0,
            },
        );

        id
    }

    pub fn create_succeeder_node(&mut self) -> usize {
        let id = self.next_id;
        self.next_id += 1;

        self.nodes.insert(
            id,
            Node {
                node_type: NodeType::Succeeder,
                children: Vec::new(),
                condition_type: 0,
                action_type: 0,
                parameter: 0.0,
                success_threshold: 0,
                repeat_times: 0,
            },
        );

        id
    }

    pub fn create_repeater_node(&mut self, times: usize) -> usize {
        let id = self.next_id;
        self.next_id += 1;

        self.nodes.insert(
            id,
            Node {
                node_type: NodeType::Repeater,
                children: Vec::new(),
                condition_type: 0,
                action_type: 0,
                parameter: 0.0,
                success_threshold: 0,
                repeat_times: times,
            },
        );

        id
    }

    pub fn create_parallel_node(&mut self, success_threshold: usize) -> usize {
        let id = self.next_id;
        self.next_id += 1;

        self.nodes.insert(
            id,
            Node {
                node_type: NodeType::Parallel,
                children: Vec::new(),
                condition_type: 0,
                action_type: 0,
                parameter: 0.0,
                success_threshold,
                repeat_times: 0,
            },
        );

        id
    }

    pub fn create_condition_node(&mut self, condition_type: u32, parameter: f64) -> usize {
        let id = self.next_id;
        self.next_id += 1;

        self.nodes.insert(
            id,
            Node {
                node_type: NodeType::Condition,
                children: Vec::new(),
                condition_type,
                action_type: 0,
                parameter,
                success_threshold: 0,
                repeat_times: 0,
            },
        );

        id
    }

    pub fn create_action_node(&mut self, action_type: u32, parameter: f64) -> usize {
        let id = self.next_id;
        self.next_id += 1;

        self.nodes.insert(
            id,
            Node {
                node_type: NodeType::Action,
                children: Vec::new(),
                condition_type: 0,
                action_type,
                parameter,
                success_threshold: 0,
                repeat_times: 0,
            },
        );

        id
    }

    pub fn add_child(&mut self, parent_id: usize, child_id: usize) {
        if let Some(parent) = self.nodes.get_mut(&parent_id) {
            parent.children.push(child_id);
        }
    }

    pub fn set_root(&mut self, node_id: usize) {
        self.root_id = node_id;
    }

    pub fn evaluate(&self, context: &mut BehaviorContext) -> i32 {
        match self.evaluate_node(self.root_id, context) {
            NodeStatus::Success => 1,
            NodeStatus::Failure => 0,
            NodeStatus::Running => 2,
        }
    }

    fn evaluate_node(&self, node_id: usize, context: &mut BehaviorContext) -> NodeStatus {
        if let Some(node) = self.nodes.get(&node_id) {
            let result = match node.node_type {
                NodeType::Sequence => self.evaluate_sequence(node, context),
                NodeType::Selector => self.evaluate_selector(node, context),
                NodeType::Inverter => self.evaluate_inverter(node, context),
                NodeType::Succeeder => self.evaluate_succeeder(node, context),
                NodeType::Repeater => self.evaluate_repeater(node, context, node_id),
                NodeType::Parallel => self.evaluate_parallel(node, context),
                NodeType::Condition => self.evaluate_condition(node, context),
                NodeType::Action => self.evaluate_action(node, context),
            };
            
            // Store the result in the context for composite nodes
            context.set_value(&format!("node_{}", node_id), match result {
                NodeStatus::Success => 1.0,
                NodeStatus::Failure => 0.0,
                NodeStatus::Running => 2.0,
            });
            
            result
        } else {
            NodeStatus::Failure
        }
    }

    fn evaluate_sequence(&self, node: &Node, context: &mut BehaviorContext) -> NodeStatus {
        for &child_id in &node.children {
            match self.evaluate_node(child_id, context) {
                NodeStatus::Failure => return NodeStatus::Failure,
                NodeStatus::Running => return NodeStatus::Running,
                NodeStatus::Success => continue,
            }
        }
        NodeStatus::Success
    }

    fn evaluate_selector(&self, node: &Node, context: &mut BehaviorContext) -> NodeStatus {
        for &child_id in &node.children {
            match self.evaluate_node(child_id, context) {
                NodeStatus::Success => return NodeStatus::Success,
                NodeStatus::Running => return NodeStatus::Running,
                NodeStatus::Failure => continue,
            }
        }
        NodeStatus::Failure
    }

    fn evaluate_inverter(&self, node: &Node, context: &mut BehaviorContext) -> NodeStatus {
        if node.children.is_empty() {
            return NodeStatus::Failure;
        }
        
        match self.evaluate_node(node.children[0], context) {
            NodeStatus::Success => NodeStatus::Failure,
            NodeStatus::Failure => NodeStatus::Success,
            NodeStatus::Running => NodeStatus::Running,
        }
    }

    fn evaluate_succeeder(&self, node: &Node, context: &mut BehaviorContext) -> NodeStatus {
        if node.children.is_empty() {
            return NodeStatus::Success;
        }
        
        match self.evaluate_node(node.children[0], context) {
            NodeStatus::Running => NodeStatus::Running,
            _ => NodeStatus::Success,
        }
    }

    fn evaluate_repeater(&self, node: &Node, context: &mut BehaviorContext, node_id: usize) -> NodeStatus {
        if node.children.is_empty() {
            return NodeStatus::Failure;
        }
        
        let count_key = format!("repeater_{}_count", node_id);
        let mut count = context.get_value(&count_key) as usize;
        
        if count >= node.repeat_times {
            context.set_value(&count_key, 0.0);
            return NodeStatus::Success;
        }
        
        match self.evaluate_node(node.children[0], context) {
            NodeStatus::Failure => {
                context.set_value(&count_key, 0.0);
                NodeStatus::Failure
            },
            NodeStatus::Success => {
                count += 1;
                context.set_value(&count_key, count as f64);
                if count >= node.repeat_times {
                    context.set_value(&count_key, 0.0);
                    NodeStatus::Success
                } else {
                    NodeStatus::Running
                }
            },
            NodeStatus::Running => NodeStatus::Running,
        }
    }

    fn evaluate_parallel(&self, node: &Node, context: &mut BehaviorContext) -> NodeStatus {
        let mut success_count = 0;
        let mut failure_count = 0;
        let mut running_count = 0;
        
        for &child_id in &node.children {
            match self.evaluate_node(child_id, context) {
                NodeStatus::Success => success_count += 1,
                NodeStatus::Failure => failure_count += 1,
                NodeStatus::Running => running_count += 1,
            }
        }
        
        if success_count >= node.success_threshold {
            NodeStatus::Success
        } else if failure_count > node.children.len() - node.success_threshold {
            NodeStatus::Failure
        } else {
            NodeStatus::Running
        }
    }

    fn evaluate_condition(&self, node: &Node, context: &mut BehaviorContext) -> NodeStatus {
        match node.condition_type {
            // Is target in range?
            0 => {
                let distance = context.get_distance_to_target();
                if distance <= node.parameter {
                    NodeStatus::Success
                } else {
                    NodeStatus::Failure
                }
            },
            // Is health below threshold?
            1 => {
                let health_percentage = context.get_health_percentage();
                if health_percentage <= node.parameter {
                    NodeStatus::Success
                } else {
                    NodeStatus::Failure
                }
            },
            // Is entity type match?
            2 => {
                if context.entity_type == node.parameter as u32 {
                    NodeStatus::Success
                } else {
                    NodeStatus::Failure
                }
            },
            // Is target visible?
            3 => {
                // In a real implementation, we would check line of sight
                // For now, just use a value from the context
                if context.get_value("target_visible") > 0.5 {
                    NodeStatus::Success
                } else {
                    NodeStatus::Failure
                }
            },
            // Has cooldown expired?
            4 => {
                let cooldown_key = format!("cooldown_{}", node.parameter as u32);
                if context.get_value(&cooldown_key) <= 0.0 {
                    NodeStatus::Success
                } else {
                    NodeStatus::Failure
                }
            },
            // Default
            _ => NodeStatus::Failure,
        }
    }

    fn evaluate_action(&self, node: &Node, context: &mut BehaviorContext) -> NodeStatus {
        match node.action_type {
            // Move towards target
            0 => {
                // In a real implementation, we would actually move the entity
                // For now, just return success
                context.set_value("action", 0.0); // Move action
                context.set_value("action_parameter", node.parameter);
                NodeStatus::Success
            },
            // Attack target
            1 => {
                // In a real implementation, we would actually attack
                // For now, just return success if in range
                let distance = context.get_distance_to_target();
                if distance <= node.parameter {
                    context.set_value("action", 1.0); // Attack action
                    context.set_value("action_parameter", node.parameter);
                    NodeStatus::Success
                } else {
                    NodeStatus::Failure
                }
            },
            // Flee from target
            2 => {
                // In a real implementation, we would actually flee
                // For now, just return success
                context.set_value("action", 2.0); // Flee action
                context.set_value("action_parameter", node.parameter);
                NodeStatus::Success
            },
            // Wait for a duration
            3 => {
                // In a real implementation, we would actually wait
                // For now, just return success
                context.set_value("action", 3.0); // Wait action
                context.set_value("action_parameter", node.parameter);
                NodeStatus::Success
            },
            // Special ability
            4 => {
                // In a real implementation, we would use a special ability
                // For now, just return success
                context.set_value("action", 4.0); // Special ability action
                context.set_value("action_parameter", node.parameter);
                NodeStatus::Success
            },
            // Set cooldown
            5 => {
                let cooldown_key = format!("cooldown_{}", node.parameter as u32);
                context.set_value(&cooldown_key, node.parameter);
                NodeStatus::Success
            },
            // Default
            _ => NodeStatus::Failure,
        }
    }
}