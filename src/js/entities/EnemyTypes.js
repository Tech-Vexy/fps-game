// Define different enemy types with unique properties and behaviors

export const EnemyTypes = {
  // Basic enemy that chases the player and attacks when in range
  GRUNT: {
    id: 0,
    name: 'Grunt',
    health: 100,
    damage: 10,
    speed: 5,
    attackRange: 2,
    attackRate: 1,
    color: 0xff0000, // Red
    scale: { x: 1, y: 2, z: 1 },
    description: 'Basic enemy that chases the player and attacks when in range',
    behaviorType: 'chase',
    specialAbilities: []
  },
  
  // Keeps distance and attacks from afar
  SNIPER: {
    id: 1,
    name: 'Sniper',
    health: 70,
    damage: 25,
    speed: 4,
    attackRange: 30,
    attackRate: 3,
    color: 0x00ff00, // Green
    scale: { x: 0.8, y: 2.2, z: 0.8 },
    description: 'Keeps distance and attacks from afar',
    behaviorType: 'ranged',
    specialAbilities: ['snipe']
  },
  
  // Slow but high health and damage
  TANK: {
    id: 2,
    name: 'Tank',
    health: 200,
    damage: 20,
    speed: 3,
    attackRange: 3,
    attackRate: 2,
    color: 0x0000ff, // Blue
    scale: { x: 1.5, y: 2.5, z: 1.5 },
    description: 'Slow but high health and damage',
    behaviorType: 'tank',
    specialAbilities: ['charge']
  },
  
  // Fast and evasive
  SCOUT: {
    id: 3,
    name: 'Scout',
    health: 60,
    damage: 8,
    speed: 8,
    attackRange: 5,
    attackRate: 0.5,
    color: 0xffff00, // Yellow
    scale: { x: 0.7, y: 1.8, z: 0.7 },
    description: 'Fast and evasive',
    behaviorType: 'scout',
    specialAbilities: ['dodge', 'circle']
  },
  
  // Boss enemy with multiple attack patterns and phases
  BOSS: {
    id: 4,
    name: 'Boss',
    health: 500,
    damage: 30,
    speed: 4,
    attackRange: 5,
    attackRate: 1.5,
    color: 0xff00ff, // Purple
    scale: { x: 2, y: 3, z: 2 },
    description: 'Boss enemy with multiple attack patterns and phases',
    behaviorType: 'boss',
    specialAbilities: ['groundSlam', 'summonMinions', 'chargeAttack', 'rangedBarrage']
  }
};

// Helper function to get enemy type by ID
export function getEnemyTypeById(id) {
  return Object.values(EnemyTypes).find(type => type.id === id);
}

// Helper function to get a random enemy type (excluding boss)
export function getRandomEnemyType() {
  const types = Object.values(EnemyTypes).filter(type => type.id !== 4); // Exclude boss
  const randomIndex = Math.floor(Math.random() * types.length);
  return types[randomIndex];
}