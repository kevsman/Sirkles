import AsyncStorage from '@react-native-async-storage/async-storage';
import { GAME_CONFIG, STORAGE_KEYS } from '../config/constants';
import { Ring } from '../entities/Ring';
import { Powerup } from '../entities/Powerup';

// Game State Management
export class GameState {
    // Core game state
    isPlaying: boolean = false;
    isHolding: boolean = false;
    score: number = 0;
    displayScore: number = 0;

    // Player state
    playerSize: number = 40;
    targetSize: number = 40;

    // Game objects
    rings: Ring[] = [];
    powerups: Powerup[] = [];

    // Timing
    lastRingSpawn: number = 0;
    ringSpeed: number = GAME_CONFIG.BASE_RING_SPEED;
    ringSpawnInterval: number = GAME_CONFIG.RING_SPAWN_INTERVAL_BASE;

    // Difficulty
    difficulty: number = 1;
    patternMode: 'normal' | 'double' | 'moving' = 'normal';
    nextPatternChange: number = 25;

    // Combo system
    combo: number = 0;
    perfectStreak: number = 0;
    maxCombo: number = 0;
    multiplier: number = 1;

    // Powerup states
    activePowerups: Record<string, number> = {};
    hasShield: boolean = false;
    extraLifeStored: boolean = false;

    // Defensive
    slowTimeActive: boolean = false;
    freezeActive: boolean = false;
    ghostActive: boolean = false;
    invincibleActive: boolean = false;

    // Size
    tinyModeActive: boolean = false;
    giantModeActive: boolean = false;
    pulseActive: boolean = false;
    elasticActive: boolean = false;

    // Scoring
    doublePointsActive: boolean = false;
    triplePointsActive: boolean = false;
    perfectStreakActive: boolean = false;
    comboKeeperActive: boolean = false;

    // Assist
    magnetizeActive: boolean = false;
    wideGapActive: boolean = false;
    slowRingsActive: boolean = false;
    noDoublesActive: boolean = false;
    autoPassActive: boolean = false;
    xrayActive: boolean = false;

    // Ring manipulation
    reverseRingsActive: boolean = false;

    // Special
    rainbowActive: boolean = false;
    gravityActive: boolean = false;
    mirrorActive: boolean = false;

    // Visual effects
    screenShake: number = 0;
    pulseEffect: number = 0;
    backgroundPulse: number = 0;

    // Satisfaction pulse (when clearing rings)
    satisfactionPulse: number = 0;
    satisfactionPulseType: number = 0;

    // Clearance reward (brief slowdown + pushback)
    clearanceSlowdown: number = 0;
    clearancePushback: number = 0;

    // Powerup progress system
    powerupProgress: number = 0;
    nextPowerupType: string = '';
    powerupIconAngle: number = 0;
    powerupReady: boolean = false;

    // Psychological Hooks
    consecutivePerfects: number = 0;
    nearMissCount: number = 0;
    lastNearMiss: number = 0;
    waveStartTime: number = 0;
    inRecoveryPhase: boolean = false;
    recoveryStartTime: number = 0;
    lastHighScore: number = 0;
    hitStopUntil: number = 0;

    // Saved data
    highScore: number = 0;
    unlockedThemes: string[] = ['default'];
    currentTheme: string = 'default';

    constructor() {
        this.nextPowerupType = this.pickNextPowerup();
    }

    reset() {
        // Core game state
        this.isPlaying = false;
        this.isHolding = false;
        this.score = 0;
        this.displayScore = 0;

        // Player state
        this.playerSize = 40;
        this.targetSize = 40;

        // Game objects
        this.rings = [];
        this.powerups = [];

        // Timing
        this.lastRingSpawn = 0;
        this.ringSpeed = GAME_CONFIG.BASE_RING_SPEED;
        this.ringSpawnInterval = GAME_CONFIG.RING_SPAWN_INTERVAL_BASE;

        // Difficulty
        this.difficulty = 1;
        this.patternMode = 'normal';
        this.nextPatternChange = 25;

        // Combo system
        this.combo = 0;
        this.perfectStreak = 0;
        this.maxCombo = 0;
        this.multiplier = 1;

        // Powerup states
        this.activePowerups = {};
        this.hasShield = false;
        this.extraLifeStored = false;

        // Defensive
        this.slowTimeActive = false;
        this.freezeActive = false;
        this.ghostActive = false;
        this.invincibleActive = false;

        // Size
        this.tinyModeActive = false;
        this.giantModeActive = false;
        this.pulseActive = false;
        this.elasticActive = false;

        // Scoring
        this.doublePointsActive = false;
        this.triplePointsActive = false;
        this.perfectStreakActive = false;
        this.comboKeeperActive = false;

        // Assist
        this.magnetizeActive = false;
        this.wideGapActive = false;
        this.slowRingsActive = false;
        this.noDoublesActive = false;
        this.autoPassActive = false;
        this.xrayActive = false;

        // Ring manipulation
        this.reverseRingsActive = false;

        // Special
        this.rainbowActive = false;
        this.gravityActive = false;
        this.mirrorActive = false;

        // Visual effects
        this.screenShake = 0;
        this.pulseEffect = 0;
        this.backgroundPulse = 0;

        // Satisfaction pulse
        this.satisfactionPulse = 0;
        this.satisfactionPulseType = 0;

        // Clearance reward
        this.clearanceSlowdown = 0;
        this.clearancePushback = 0;

        // Powerup progress system
        this.powerupProgress = 0;
        this.nextPowerupType = this.pickNextPowerup();
        this.powerupIconAngle = 0;
        this.powerupReady = false;

        // Psychological Hooks
        this.consecutivePerfects = 0;
        this.nearMissCount = 0;
        this.lastNearMiss = 0;
        this.waveStartTime = 0;
        this.inRecoveryPhase = false;
        this.hitStopUntil = 0;
    }

    pickNextPowerup(): string {
        const types = [
            // Defensive (5)
            'slowTime',
            'shield',
            'ghost',
            'freeze',
            'invincible',
            // Size (4)
            'tinyMode',
            'giantMode',
            'pulse',
            'elastic',
            // Scoring (6)
            'doublePoints',
            'triplePoints',
            'perfectStreak',
            'comboKeeper',
            'comboBoost',
            'jackpot',
            // Assist (6)
            'magnetize',
            'wideGap',
            'slowRings',
            'noDoubles',
            'autoPass',
            'xray',
            // Ring manipulation (5)
            'clearRings',
            'reverseRings',
            'shrinkRings',
            'expandRings',
            'convertRings',
            // Special (4)
            'extraLife',
            'rainbow',
            'gravity',
            'mirror',
        ];
        return types[Math.floor(Math.random() * types.length)];
    }

    async loadSavedData() {
        try {
            const highScore = await AsyncStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
            const unlockedThemes = await AsyncStorage.getItem(STORAGE_KEYS.UNLOCKED_THEMES);
            const currentTheme = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_THEME);

            this.highScore = highScore ? parseInt(highScore) : 0;
            this.unlockedThemes = unlockedThemes ? JSON.parse(unlockedThemes) : ['default'];
            this.currentTheme = currentTheme || 'default';

            // Validate current theme is unlocked
            if (!this.unlockedThemes.includes(this.currentTheme)) {
                this.currentTheme = 'default';
            }
        } catch (e) {
            console.log('Error loading saved data:', e);
            this.highScore = 0;
            this.unlockedThemes = ['default'];
            this.currentTheme = 'default';
        }
    }

    async saveHighScore(): Promise<boolean> {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            try {
                await AsyncStorage.setItem(STORAGE_KEYS.HIGH_SCORE, this.highScore.toString());
            } catch (e) {
                console.log('Error saving high score:', e);
            }
            return true;
        }
        return false;
    }

    async unlockTheme(themeId: string): Promise<boolean> {
        if (!this.unlockedThemes.includes(themeId)) {
            this.unlockedThemes.push(themeId);
            try {
                await AsyncStorage.setItem(STORAGE_KEYS.UNLOCKED_THEMES, JSON.stringify(this.unlockedThemes));
            } catch (e) {
                console.log('Error saving unlocked themes:', e);
            }
            return true;
        }
        return false;
    }

    async setTheme(themeId: string) {
        if (this.unlockedThemes.includes(themeId)) {
            this.currentTheme = themeId;
            try {
                await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_THEME, themeId);
            } catch (e) {
                console.log('Error saving current theme:', e);
            }
        }
    }

    cycleTheme(): string {
        const currentIndex = this.unlockedThemes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.unlockedThemes.length;
        this.setTheme(this.unlockedThemes[nextIndex]);
        return this.currentTheme;
    }

    updateDifficulty() {
        // More gradual difficulty scaling
        const scoreForDifficulty = Math.max(0, this.score - 5);

        this.difficulty = 1 + scoreForDifficulty * 0.08;
        let baseSpeed = GAME_CONFIG.BASE_RING_SPEED + scoreForDifficulty * 0.04;

        // Sawtooth Difficulty Curve - Tension & Release
        const now = Date.now();
        const waveTime = now - this.waveStartTime;

        if (waveTime > GAME_CONFIG.DIFFICULTY_WAVE_DURATION) {
            // Start recovery phase
            if (!this.inRecoveryPhase) {
                this.inRecoveryPhase = true;
                this.recoveryStartTime = now;
            }
        }

        if (this.inRecoveryPhase) {
            const recoveryTime = now - this.recoveryStartTime;
            if (recoveryTime < GAME_CONFIG.DIFFICULTY_RECOVERY_DURATION) {
                // During recovery: reduce speed
                baseSpeed *= 1 - GAME_CONFIG.DIFFICULTY_RECOVERY_PERCENT;
            } else {
                // Recovery over, start new wave
                this.inRecoveryPhase = false;
                this.waveStartTime = now;
            }
        }

        this.ringSpeed = baseSpeed;
        this.ringSpawnInterval = Math.max(800, GAME_CONFIG.RING_SPAWN_INTERVAL_BASE - scoreForDifficulty * 20);

        // Pattern mode changes - delayed and more gradual
        if (this.score >= this.nextPatternChange) {
            if (this.patternMode === 'normal') {
                this.patternMode = 'double';
                this.nextPatternChange = this.score + 20;
            } else if (this.patternMode === 'double') {
                this.patternMode = 'moving';
                this.nextPatternChange = this.score + 25;
            } else {
                this.patternMode = 'normal';
                this.nextPatternChange = this.score + 15;
            }
        }
    }

    addScore(points: number) {
        this.score += Math.floor(points * this.multiplier);
    }

    updateMultiplier() {
        this.multiplier = 1 + Math.floor(this.combo / 3) * 0.5;
        if (this.doublePointsActive) {
            this.multiplier *= 2;
        }
    }

    incrementCombo() {
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        this.perfectStreak++;
        this.consecutivePerfects++;
        this.updateMultiplier();
    }

    resetCombo() {
        this.combo = 0;
        this.perfectStreak = 0;
        this.consecutivePerfects = 0;
        this.multiplier = this.doublePointsActive ? 2 : 1;
    }

    // Get pitch scale for audio based on consecutive perfects
    getPitchScale(): number {
        const semitones = Math.min(this.consecutivePerfects, 12);
        return Math.min(Math.pow(GAME_CONFIG.PITCH_RAMP_SEMITONE, semitones), GAME_CONFIG.MAX_PITCH_MULTIPLIER);
    }

    // Track near miss
    recordNearMiss() {
        this.nearMissCount++;
        this.lastNearMiss = Date.now();
    }

    // Hit stop - freeze game briefly
    triggerHitStop() {
        this.hitStopUntil = Date.now() + GAME_CONFIG.HIT_STOP_DURATION;
    }

    isInHitStop(): boolean {
        return Date.now() < this.hitStopUntil;
    }

    // Endowed progress - carry over some progress after a good run
    applyEndowedProgress(previousScore: number) {
        if (previousScore >= 20) {
            this.powerupProgress = Math.floor(GAME_CONFIG.RINGS_FOR_POWERUP * GAME_CONFIG.ENDOWED_PROGRESS_PERCENT);
        }
    }

    // Satisfaction pulse system
    triggerPulse(type: number = 0) {
        this.satisfactionPulse = 1;
        this.satisfactionPulseType = type;
    }

    updatePulse() {
        if (this.satisfactionPulse > 0) {
            this.satisfactionPulse *= 0.85;
            if (this.satisfactionPulse < 0.01) {
                this.satisfactionPulse = 0;
            }
        }
    }

    getPulseScale(): number {
        if (this.satisfactionPulse <= 0) return 1;

        const intensity = this.satisfactionPulseType === 2 ? 0.25 : this.satisfactionPulseType === 1 ? 0.15 : 0.08;
        const eased = Math.sin(this.satisfactionPulse * Math.PI);
        return 1 + eased * intensity;
    }

    // Clearance reward system
    triggerClearanceReward(isPerfect: boolean) {
        this.clearancePushback = isPerfect ? 10 : 6;
    }

    applyClearancePushback(): number {
        const pushback = this.clearancePushback;
        this.clearancePushback = 0;
        return pushback;
    }

    // Powerup progress system
    addPowerupProgress() {
        this.powerupProgress++;
        if (this.powerupProgress >= GAME_CONFIG.RINGS_FOR_POWERUP) {
            this.powerupReady = true;
        }
    }

    updatePowerupProgress() {
        this.powerupIconAngle += this.powerupReady ? 0.08 : 0.03;
    }

    isPowerupReady(): boolean {
        return this.powerupProgress >= GAME_CONFIG.RINGS_FOR_POWERUP;
    }

    consumePowerupProgress() {
        this.powerupProgress = 0;
        this.powerupReady = false;
        this.nextPowerupType = this.pickNextPowerup();
    }

    getPowerupProgressPercent(): number {
        return Math.min(1, this.powerupProgress / GAME_CONFIG.RINGS_FOR_POWERUP);
    }
}
