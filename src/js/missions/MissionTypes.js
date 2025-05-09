/**
 * MissionTypes - Defines different types of missions available in the game
 */
export const MissionTypes = {
  // Kill missions
  KILL_ENEMIES: {
    type: 'kill',
    id: 'kill_enemies',
    titleTemplate: 'Eliminate {count} enemies',
    descriptionTemplate: 'Eliminate {count} enemies to complete this mission.',
    baseTargetCount: 10,
    baseReward: 100,
    difficulty: 1,
    minRank: 1
  },
  
  KILL_GRUNTS: {
    type: 'kill',
    id: 'kill_grunts',
    titleTemplate: 'Eliminate {count} Grunts',
    descriptionTemplate: 'Eliminate {count} Grunt enemies to complete this mission.',
    baseTargetCount: 8,
    baseReward: 80,
    difficulty: 1,
    minRank: 1,
    specificEnemyType: 'GRUNT'
  },
  
  KILL_SNIPERS: {
    type: 'kill',
    id: 'kill_snipers',
    titleTemplate: 'Eliminate {count} Snipers',
    descriptionTemplate: 'Eliminate {count} Sniper enemies to complete this mission.',
    baseTargetCount: 5,
    baseReward: 150,
    difficulty: 2,
    minRank: 2,
    specificEnemyType: 'SNIPER'
  },
  
  KILL_TANKS: {
    type: 'kill',
    id: 'kill_tanks',
    titleTemplate: 'Eliminate {count} Tanks',
    descriptionTemplate: 'Eliminate {count} Tank enemies to complete this mission.',
    baseTargetCount: 3,
    baseReward: 200,
    difficulty: 3,
    minRank: 3,
    specificEnemyType: 'TANK'
  },
  
  KILL_SCOUTS: {
    type: 'kill',
    id: 'kill_scouts',
    titleTemplate: 'Eliminate {count} Scouts',
    descriptionTemplate: 'Eliminate {count} Scout enemies to complete this mission.',
    baseTargetCount: 4,
    baseReward: 180,
    difficulty: 2,
    minRank: 2,
    specificEnemyType: 'SCOUT'
  },
  
  // Collection missions
  COLLECT_AMMO: {
    type: 'collect',
    id: 'collect_ammo',
    titleTemplate: 'Collect {count} ammo packs',
    descriptionTemplate: 'Find and collect {count} ammo packs scattered throughout the level.',
    baseTargetCount: 5,
    baseReward: 50,
    difficulty: 1,
    minRank: 1,
    specificItemType: 'ammo'
  },
  
  COLLECT_HEALTH: {
    type: 'collect',
    id: 'collect_health',
    titleTemplate: 'Collect {count} health packs',
    descriptionTemplate: 'Find and collect {count} health packs scattered throughout the level.',
    baseTargetCount: 3,
    baseReward: 75,
    difficulty: 1,
    minRank: 1,
    specificItemType: 'health'
  },
  
  COLLECT_ARMOR: {
    type: 'collect',
    id: 'collect_armor',
    titleTemplate: 'Collect {count} armor pieces',
    descriptionTemplate: 'Find and collect {count} armor pieces scattered throughout the level.',
    baseTargetCount: 2,
    baseReward: 100,
    difficulty: 2,
    minRank: 2,
    specificItemType: 'armor'
  },
  
  COLLECT_WEAPONS: {
    type: 'collect',
    id: 'collect_weapons',
    titleTemplate: 'Find {count} weapon upgrades',
    descriptionTemplate: 'Locate and collect {count} weapon upgrades hidden in the level.',
    baseTargetCount: 1,
    baseReward: 200,
    difficulty: 3,
    minRank: 3,
    specificItemType: 'weapon'
  },
  
  // Reach area missions
  REACH_CHECKPOINT: {
    type: 'reach',
    id: 'reach_checkpoint',
    titleTemplate: 'Reach the checkpoint',
    descriptionTemplate: 'Navigate to the checkpoint area{timeLimit ? ` within ${timeLimit} seconds` : ""}.',
    baseReward: 100,
    difficulty: 1,
    minRank: 1,
    specificArea: 'checkpoint'
  },
  
  REACH_EXTRACTION: {
    type: 'reach',
    id: 'reach_extraction',
    titleTemplate: 'Reach the extraction point',
    descriptionTemplate: 'Navigate to the extraction point{timeLimit ? ` within ${timeLimit} seconds` : ""}.',
    baseReward: 150,
    difficulty: 2,
    minRank: 1,
    specificArea: 'extraction',
    timeLimit: 180
  },
  
  REACH_INTEL: {
    type: 'reach',
    id: 'reach_intel',
    titleTemplate: 'Secure the intel',
    descriptionTemplate: 'Locate and secure the intel{timeLimit ? ` within ${timeLimit} seconds` : ""}.',
    baseReward: 200,
    difficulty: 2,
    minRank: 2,
    specificArea: 'intel'
  },
  
  // Boss missions
  DEFEAT_BOSS: {
    type: 'boss',
    id: 'defeat_boss',
    titleTemplate: 'Defeat the boss',
    descriptionTemplate: 'Defeat the boss enemy to complete this mission.',
    baseReward: 500,
    difficulty: 4,
    minRank: 4,
    specificBossType: 'any'
  },
  
  // Survival missions
  SURVIVE_TIME: {
    type: 'survive',
    id: 'survive_time',
    titleTemplate: 'Survive for {time} seconds',
    descriptionTemplate: 'Stay alive for {time} seconds to complete this mission.',
    baseTime: 60,
    baseReward: 150,
    difficulty: 2,
    minRank: 2
  },
  
  SURVIVE_AREA: {
    type: 'survive',
    id: 'survive_area',
    titleTemplate: 'Hold position for {time} seconds',
    descriptionTemplate: 'Stay alive in the designated area for {time} seconds.',
    baseTime: 45,
    baseReward: 200,
    difficulty: 3,
    minRank: 3,
    specificArea: 'holdout'
  },
  
  // No damage missions
  NO_DAMAGE_KILLS: {
    type: 'noDamage',
    id: 'no_damage_kills',
    titleTemplate: 'Get {kills} kills without taking damage',
    descriptionTemplate: 'Eliminate {kills} enemies without taking any damage.',
    baseTargetCount: 5,
    baseReward: 250,
    difficulty: 3,
    minRank: 3
  },
  
  // Weapon specific missions
  PISTOL_KILLS: {
    type: 'useWeapon',
    id: 'pistol_kills',
    titleTemplate: 'Get {count} pistol kills',
    descriptionTemplate: 'Eliminate {count} enemies using the pistol.',
    baseTargetCount: 5,
    baseReward: 150,
    difficulty: 2,
    minRank: 2,
    specificWeaponType: 'pistol'
  },
  
  RIFLE_KILLS: {
    type: 'useWeapon',
    id: 'rifle_kills',
    titleTemplate: 'Get {count} rifle kills',
    descriptionTemplate: 'Eliminate {count} enemies using the rifle.',
    baseTargetCount: 8,
    baseReward: 120,
    difficulty: 1,
    minRank: 1,
    specificWeaponType: 'rifle'
  },
  
  SHOTGUN_KILLS: {
    type: 'useWeapon',
    id: 'shotgun_kills',
    titleTemplate: 'Get {count} shotgun kills',
    descriptionTemplate: 'Eliminate {count} enemies using the shotgun.',
    baseTargetCount: 6,
    baseReward: 180,
    difficulty: 2,
    minRank: 2,
    specificWeaponType: 'shotgun'
  }
};