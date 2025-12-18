// Game Constants
export const GAME_CONFIG = {
    // === PROGRESSIVE DIFFICULTY SYSTEM ===
    // Starting values (very easy to hook players)
    BASE_RING_SPEED: 2, // Slower starting speed (was 3)
    RING_SPAWN_INTERVAL_BASE: 2500, // More time between rings to start (was 2000)
    RING_SPAWN_INTERVAL_MIN: 700, // Minimum spawn interval at high difficulty
    GAP_BASE: 80, // Very forgiving starting gap (was 65)
    GAP_MIN: 22, // Challenging minimum gap at high difficulty
    
    // Difficulty scaling rates
    SPEED_INCREASE_PER_SCORE: 0.025, // How much speed increases per point (was 0.04)
    SPAWN_INTERVAL_DECREASE_PER_SCORE: 15, // Spawn interval decrease per point (was 20)
    GAP_DIFFICULTY_SCALE: 50, // Score at which gap reaches minimum (higher = slower shrink)
    
    // Grace period - first N rings are extra easy
    WARMUP_RINGS: 5, // Number of "tutorial" rings with bonus forgiveness
    WARMUP_SPEED_MULTIPLIER: 0.7, // Speed multiplier during warmup
    WARMUP_GAP_BONUS: 15, // Extra gap size during warmup
    
    // Player controls
    PLAYER_GROW_SPEED: 3,
    PLAYER_SHRINK_SPEED: 2.5,
    MIN_PLAYER_SIZE: 15,
    MAX_PLAYER_SIZE: 150,
    RING_THICKNESS: 8,
    POWERUP_SPAWN_CHANCE: 0.15,

    // Psychological Hooks
    PHANTOM_HITBOX_FORGIVENESS: 0.15, // 15% forgiveness (was 12%) - more forgiving
    HIT_STOP_DURATION: 50, // ms to freeze on death/major events
    PITCH_RAMP_SEMITONE: 1.059463, // Multiplier for one semitone up
    MAX_PITCH_MULTIPLIER: 2.0, // Cap pitch ramping
    ENDOWED_PROGRESS_PERCENT: 0.25, // Start next run with 25% powerup progress after high score

    // Sawtooth Difficulty Curve - Creates "flow" moments
    DIFFICULTY_WAVE_DURATION: 25000, // 25 seconds of increasing difficulty
    DIFFICULTY_RECOVERY_PERCENT: 0.20, // Drop speed by 20% during recovery (was 15%)
    DIFFICULTY_RECOVERY_DURATION: 6000, // 6 seconds of easier gameplay
    
    // Milestone breathers - brief easy moments after achievements
    MILESTONE_SCORES: [10, 25, 50, 100, 150, 200], // Scores that trigger breathers
    MILESTONE_BREATHER_DURATION: 3000, // 3 seconds of easier gameplay after milestone
    MILESTONE_SPEED_REDUCTION: 0.25, // 25% speed reduction during breather

    // Pattern mode thresholds (when harder patterns unlock)
    DOUBLE_RING_UNLOCK_SCORE: 35, // When double rings start appearing (was 25)
    MOVING_GAP_UNLOCK_SCORE: 60, // When moving gaps start appearing
    DOUBLE_RING_CHANCE_BASE: 0.2, // Starting chance for double rings
    DOUBLE_RING_CHANCE_MAX: 0.5, // Maximum chance for double rings
    MOVING_GAP_CHANCE_BASE: 0.15, // Starting chance for moving gaps
    MOVING_GAP_CHANCE_MAX: 0.4, // Maximum chance for moving gaps

    // Powerup progress (spiraling orbs) settings
    RINGS_FOR_POWERUP: 6, // Rings to pass before powerup spawns (was 8) - faster rewards!
    POWERUP_ORB_ORBIT_RADIUS: 70, // Starting orbit radius around icon
    POWERUP_ORB_SPEED: 0.03, // Base orbit rotation speed
    POWERUP_ORB_SIZE: 6, // Orb radius
};

// Storage Keys
export const STORAGE_KEYS = {
    HIGH_SCORE: 'pulseHighScore',
    UNLOCKED_THEMES: 'pulseUnlockedThemes',
    CURRENT_THEME: 'pulseCurrentTheme',
};
