export class PlayerMetrics {
  constructor() {
    this.reset();
  }
  
  reset() {
    // Accuracy metrics
    this.shotsFired = 0;
    this.shotsHit = 0;
    
    // Combat metrics
    this.enemiesKilled = 0;
    this.damageDealt = 0;
    this.damageTaken = 0;
    
    // Movement metrics
    this.distanceTraveled = 0;
    this.jumpCount = 0;
    
    // Time metrics
    this.playTime = 0;
    this.timeInCombat = 0;
    
    // Difficulty adjustment factor (0-1)
    this.difficultyFactor = 0.5;
  }
  
  recordShot(hit) {
    this.shotsFired++;
    if (hit) {
      this.shotsHit++;
    }
    this.updateDifficultyFactor();
  }
  
  recordEnemyKilled() {
    this.enemiesKilled++;
    this.updateDifficultyFactor();
  }
  
  recordDamageDealt(amount) {
    this.damageDealt += amount;
  }
  
  recordDamageTaken(amount) {
    this.damageTaken += amount;
    this.updateDifficultyFactor();
  }
  
  recordMovement(distance) {
    this.distanceTraveled += distance;
  }
  
  recordJump() {
    this.jumpCount++;
  }
  
  updatePlayTime(deltaTime) {
    this.playTime += deltaTime;
  }
  
  updateCombatTime(deltaTime, inCombat) {
    if (inCombat) {
      this.timeInCombat += deltaTime;
    }
  }
  
  // Calculate accuracy (0-1)
  getAccuracy() {
    if (this.shotsFired === 0) return 0;
    return this.shotsHit / this.shotsFired;
  }
  
  // Calculate kill efficiency (kills per minute)
  getKillEfficiency() {
    if (this.playTime < 60) return this.enemiesKilled;
    return this.enemiesKilled / (this.playTime / 60);
  }
  
  // Calculate damage efficiency (damage dealt vs taken ratio)
  getDamageEfficiency() {
    if (this.damageTaken === 0) return this.damageDealt > 0 ? 2 : 1;
    return this.damageDealt / this.damageTaken;
  }
  
  // Update difficulty factor based on player performance
  updateDifficultyFactor() {
    const accuracy = this.getAccuracy();
    const killEfficiency = Math.min(this.getKillEfficiency(), 10) / 10;
    const damageEfficiency = Math.min(this.getDamageEfficiency(), 3) / 3;
    
    // Weight the factors based on importance
    const weightedScore = 
      accuracy * 0.4 + 
      killEfficiency * 0.4 + 
      damageEfficiency * 0.2;
    
    // Gradually adjust difficulty factor (smoothing)
    this.difficultyFactor = this.difficultyFactor * 0.7 + weightedScore * 0.3;
    
    // Clamp between 0.2 and 0.8 to avoid extremes
    this.difficultyFactor = Math.max(0.2, Math.min(0.8, this.difficultyFactor));
  }
  
  // Get enemy spawn rate multiplier based on difficulty
  getEnemySpawnRateMultiplier() {
    return 0.5 + this.difficultyFactor;
  }
  
  // Get enemy health multiplier based on difficulty
  getEnemyHealthMultiplier() {
    return 0.7 + this.difficultyFactor * 0.6;
  }
  
  // Get enemy damage multiplier based on difficulty
  getEnemyDamageMultiplier() {
    return 0.7 + this.difficultyFactor * 0.6;
  }
  
  // Get enemy speed multiplier based on difficulty
  getEnemySpeedMultiplier() {
    return 0.8 + this.difficultyFactor * 0.4;
  }
}