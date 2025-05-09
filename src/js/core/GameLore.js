/**
 * Game lore and setting information
 */
export class GameLore {
  constructor() {
    // Core game setting
    this.title = "NEXUS BREACH";
    this.tagline = "Defend humanity's last stronghold";
    
    // Game universe details
    this.setting = {
      year: 2187,
      location: "Nexus City, Earth's Last Megacity",
      conflict: "The Quantum Incursion",
      factions: {
        player: {
          name: "Sentinel Corps",
          description: "Elite defense force created to protect Nexus City from dimensional threats",
          symbol: "sentinel-shield"
        },
        enemies: {
          name: "The Convergence",
          description: "Otherworldly entities leaking into our dimension through quantum breaches",
          symbol: "convergence-vortex"
        }
      }
    };
    
    // Core narrative
    this.story = `In the year 2187, the Quantum Resonance experiment went catastrophically wrong, 
    tearing holes in the fabric of reality. Now, entities from parallel dimensions 
    pour into our world through quantum breaches. As an elite Sentinel operative, 
    your mission is to seal these breaches and eliminate the Convergence threat 
    before they overrun humanity's last stronghold - Nexus City.`;
    
    // Level themes
    this.levelThemes = [
      {
        id: "nexus-labs",
        name: "Nexus Research Labs",
        description: "The epicenter of the catastrophe where the first breach occurred",
        environmentType: "indoor-industrial",
        lightingStyle: "emergency-red",
        hazards: ["unstable-quantum-fields", "collapsing-structures"]
      },
      {
        id: "undercity",
        name: "The Undercity",
        description: "Abandoned maintenance tunnels beneath Nexus City, now infested with dimensional anomalies",
        environmentType: "underground-tunnels",
        lightingStyle: "dark-ambient",
        hazards: ["toxic-waste", "unstable-power-conduits"]
      },
      {
        id: "city-streets",
        name: "Containment Zone",
        description: "Quarantined sectors of Nexus City where breaches have corrupted the urban landscape",
        environmentType: "urban-ruins",
        lightingStyle: "twilight-haze",
        hazards: ["gravitational-anomalies", "dimensional-rifts"]
      },
      {
        id: "nexus-core",
        name: "The Convergence Core",
        description: "The central quantum breach where the primary Convergence forces are gathering",
        environmentType: "abstract-dimensional",
        lightingStyle: "otherworldly-glow",
        hazards: ["reality-fluctuations", "time-distortions"]
      }
    ];
    
    // Player character background
    this.playerBackground = {
      title: "Sentinel Breach Hunter",
      specialization: "Quantum Disruption Specialist",
      abilities: [
        "Reality Anchor: Stabilize quantum fluctuations temporarily",
        "Dimensional Sight: Detect entities hidden in dimensional pockets",
        "Quantum Shield: Brief protection against otherworldly energy"
      ],
      motivation: "You lost your family when the first breach opened. Now you fight to prevent others from suffering the same fate."
    };
  }
  
  /**
   * Get enemy type lore
   * @param {string} enemyType - Enemy type identifier
   * @returns {object} - Lore information
   */
  getEnemyLore(enemyType) {
    const loreDatabase = {
      "GRUNT": {
        name: "Quantum Leech",
        origin: "Low-level dimensional parasites that feed on reality itself",
        behavior: "Hunt in packs, overwhelming targets with sheer numbers",
        weakness: "Unstable physical form, vulnerable to concentrated fire"
      },
      "SNIPER": {
        name: "Void Stalker",
        origin: "Evolved hunters from a dimension where light behaves differently",
        behavior: "Prefer to attack from distance using focused energy projections",
        weakness: "Require time to charge powerful attacks, vulnerable when preparing"
      },
      "TANK": {
        name: "Breach Guardian",
        origin: "Sentinels that protect the dimensional passages",
        behavior: "Defensive and territorial, extremely resilient to damage",
        weakness: "Slow movement speed and predictable attack patterns"
      },
      "SCOUT": {
        name: "Phase Shifter",
        origin: "Entities capable of partially existing between dimensions",
        behavior: "Fast, erratic movement and sudden attacks from unexpected angles",
        weakness: "Physical form becomes fully solid when attacking, momentarily vulnerable"
      },
      "BOSS": {
        name: "Convergence Avatar",
        origin: "Manifestation of the collective Convergence consciousness",
        behavior: "Tactically commanding lesser entities while unleashing devastating dimensional powers",
        weakness: "Quantum core becomes exposed after major attacks, briefly vulnerable"
      }
    };
    
    return loreDatabase[enemyType] || {
      name: "Unknown Entity",
      origin: "Origin unknown",
      behavior: "Behavior unpredictable",
      weakness: "No known weaknesses"
    };
  }
}