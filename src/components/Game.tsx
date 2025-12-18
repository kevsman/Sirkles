import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions, GestureResponderEvent, StatusBar } from 'react-native';
import { GameCanvas } from './GameCanvas';
import { ScoreDisplay } from './ScoreDisplay';
import { GameOver } from './GameOver';
import { PowerupIndicator } from './PowerupIndicator';
import { ComboPopup } from './ComboPopup';
import { ThemeUnlock } from './ThemeUnlock';
import { Message } from './Message';
import { GameState } from '../core/GameState';
import { Ring, createRing } from '../entities/Ring';
import { Powerup } from '../entities/Powerup';
import { ParticleSystem } from '../systems/ParticleSystem';
import { sound } from '../systems/SoundSystem';
import { haptic } from '../systems/HapticSystem';
import { GAME_CONFIG } from '../config/constants';
import { THEMES } from '../config/themes';
import { POWERUP_TYPES } from '../config/powerups';

interface GameProps {}

export const Game: React.FC<GameProps> = () => {
    // Screen dimensions
    const { width, height } = Dimensions.get('window');
    const centerX = width / 2;
    const centerY = height / 2;

    // Game state refs (for animation loop)
    const gameStateRef = useRef(new GameState());
    const particlesRef = useRef(new ParticleSystem());
    const animationRef = useRef<number | null>(null);
    const lastTimeRef = useRef(0);
    const screenShakeRef = useRef(0);
    const cameraZoomRef = useRef(1);

    // React state for UI updates
    const [, forceUpdate] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const [comboPopup, setComboPopup] = useState({ visible: false, title: '', subtitle: null as string | null });
    const [themeUnlock, setThemeUnlock] = useState({ visible: false, name: '' });
    const [nextUnlock, setNextUnlock] = useState<{ name: string; pointsAway: number } | null>(null);

    // Initialize game
    useEffect(() => {
        const init = async () => {
            await gameStateRef.current.loadSavedData();
            await sound.init();
            forceUpdate((n) => n + 1);
        };
        init();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Get screen size for spawning
    const getScreenSize = useCallback(() => {
        return Math.sqrt(width ** 2 + height ** 2) / 2;
    }, [width, height]);

    // Get current theme colors
    const getColors = useCallback(() => {
        const state = gameStateRef.current;
        return THEMES[state.currentTheme] || THEMES.default;
    }, []);

    // Show combo popup
    const showComboPopup = useCallback((title: string, subtitle: string | null = null) => {
        setComboPopup({ visible: true, title, subtitle });
        setTimeout(() => setComboPopup({ visible: false, title: '', subtitle: null }), 1200);
    }, []);

    // Show theme unlock
    const showThemeUnlock = useCallback((name: string) => {
        setThemeUnlock({ visible: true, name });
        setTimeout(() => setThemeUnlock({ visible: false, name: '' }), 2000);
    }, []);

    // Spawn ring
    const spawnRing = useCallback(() => {
        const state = gameStateRef.current;
        const colors = getColors();
        const ring = createRing(getScreenSize(), state.difficulty, state.patternMode, colors.ring);
        state.rings.push(ring);
    }, [getScreenSize, getColors]);

    // Spawn powerup from progress
    const spawnPowerupFromProgress = useCallback(() => {
        const state = gameStateRef.current;
        const powerup = new Powerup(getScreenSize(), state.nextPowerupType);
        state.powerups.push(powerup);
        state.consumePowerupProgress();

        sound.play('combo');
        haptic.medium();
        const powerupInfo = POWERUP_TYPES[powerup.type];
        showComboPopup(powerupInfo.icon + ' ' + powerupInfo.name + ' INCOMING!');

        particlesRef.current.burst(width - 60, 80, '#ffd700', 15, {
            minSpeed: 2,
            maxSpeed: 6,
            minSize: 3,
            maxSize: 7,
        });
    }, [getScreenSize, showComboPopup, width]);

    // On ring passed
    const onRingPassed = useCallback(
        (isPerfect: boolean) => {
            const state = gameStateRef.current;
            if (state.score > 3) {
                state.addPowerupProgress();
                if (state.isPowerupReady()) {
                    spawnPowerupFromProgress();
                }
            }
        },
        [spawnPowerupFromProgress]
    );

    // Clear stackable powerups
    const clearStackablePowerups = useCallback(() => {
        const state = gameStateRef.current;
        const stackablePowerupStates = [
            { key: 'doublePoints', state: 'doublePointsActive' },
            { key: 'triplePoints', state: 'triplePointsActive' },
            { key: 'perfectStreak', state: 'perfectStreakActive' },
            { key: 'comboKeeper', state: 'comboKeeperActive' },
            { key: 'magnetize', state: 'magnetizeActive' },
            { key: 'wideGap', state: 'wideGapActive' },
        ];

        for (const powerup of stackablePowerupStates) {
            if (POWERUP_TYPES[powerup.key]?.stackable && state.activePowerups[powerup.key] === Infinity) {
                (state as any)[powerup.state] = false;
                delete state.activePowerups[powerup.key];
            }
        }
    }, []);

    // Get next theme unlock
    const getNextThemeUnlock = useCallback(() => {
        const state = gameStateRef.current;
        for (const [themeId, theme] of Object.entries(THEMES)) {
            if (!state.unlockedThemes.includes(themeId) && theme.unlockScore > state.score) {
                return {
                    name: theme.name,
                    score: theme.unlockScore,
                    pointsAway: theme.unlockScore - state.score,
                };
            }
        }
        return null;
    }, []);

    // Game over
    const handleGameOver = useCallback(async () => {
        const state = gameStateRef.current;
        state.isPlaying = false;
        screenShakeRef.current = 20;
        state.triggerHitStop();

        clearStackablePowerups();

        sound.play('death');
        sound.stopMusic();
        haptic.death();

        const isNew = await state.saveHighScore();
        setIsNewHighScore(isNew);

        const colors = getColors();
        particlesRef.current.burst(centerX, centerY, colors.ringFail, 40, {
            minSpeed: 3,
            maxSpeed: 9,
            minSize: 3,
            maxSize: 9,
        });

        const unlock = getNextThemeUnlock();
        setNextUnlock(unlock);

        setTimeout(() => {
            if (!gameStateRef.current.isPlaying) {
                setGameOver(true);
            }
        }, 500);
    }, [getColors, centerX, centerY, clearStackablePowerups, getNextThemeUnlock]);

    // Activate powerup
    const activatePowerup = useCallback(
        (type: string) => {
            const state = gameStateRef.current;
            const powerupInfo = POWERUP_TYPES[type];

            sound.play('powerup');
            haptic.success();

            // Activation messages
            const activationMessages: Record<string, string[]> = {
                slowTime: ['⏱️ TIME SLOWED!', '⏱️ MATRIX MODE!', '⏱️ SLOW-MO!'],
                shield: ['🛡️ PROTECTED!', '🛡️ SHIELD UP!', '🛡️ ARMOR ON!'],
                ghost: ['👻 GHOST MODE!', '👻 PHASING!', '👻 UNTOUCHABLE!'],
                freeze: ['❄️ FROZEN!', '❄️ TIME STOP!', '❄️ ICE AGE!'],
                invincible: ['⚡ INVINCIBLE!', '⚡ GODMODE!', '⚡ UNSTOPPABLE!'],
                tinyMode: ['🔬 TINY MODE!', '🔬 SHRINK RAY!', '🔬 MINI ME!'],
                giantMode: ['🦖 GIANT MODE!', '🦖 MEGA SIZE!', '🦖 HULK SMASH!'],
                pulse: ['💓 AUTO PULSE!', '💓 HEARTBEAT!', '💓 PERFECT FIT!'],
                elastic: ['🎈 ELASTIC!', '🎈 STRETCHY!', '🎈 BENDY!'],
                doublePoints: ['⭐ 2X POINTS!', '⭐ DOUBLE UP!', '⭐ BONUS MODE!'],
                triplePoints: ['💎 3X POINTS!', '💎 TRIPLE THREAT!', '💎 MEGA BONUS!'],
                perfectStreak: ['✨ PERFECTION!', '✨ FLAWLESS!', '✨ GOLDEN TOUCH!'],
                comboKeeper: ['🔒 COMBO LOCKED!', '🔒 UNBREAKABLE!', '🔒 SECURED!'],
                comboBoost: ['🚀 COMBO BOOST!', '🚀 +10 COMBO!', '🚀 ROCKET!'],
                jackpot: ['🎰 JACKPOT!', '🎰 LUCKY!', '🎰 BIG WIN!'],
                magnetize: ['🧲 MAGNETIZED!', '🧲 ATTRACTION!', '🧲 PULL POWER!'],
                wideGap: ['🚪 WIDE OPEN!', '🚪 EASY MODE!', '🚪 BIG GAPS!'],
                slowRings: ['🐢 SLOW RINGS!', '🐢 EASY PACE!', '🐢 CHILL MODE!'],
                noDoubles: ['1️⃣ NO DOUBLES!', '1️⃣ SINGLES ONLY!', '1️⃣ SIMPLE!'],
                autoPass: ['🤖 AUTO PASS!', '🤖 ROBOT MODE!', '🤖 AUTOPILOT!'],
                xray: ['👁️ X-RAY!', '👁️ VISION!', '👁️ SEE ALL!'],
                clearRings: ['💥 BOOM!', '💥 CLEARED!', '💥 OBLITERATED!'],
                reverseRings: ['🔄 REVERSED!', '🔄 REWIND!', '🔄 FLIP IT!'],
                shrinkRings: ['📉 SHRINK RINGS!', '📉 SMALLER!', '📉 COMPACT!'],
                expandRings: ['📈 EXPAND RINGS!', '📈 BIGGER!', '📈 GROW!'],
                convertRings: ['💚 CONVERTED!', '💚 ALL CLEAR!', '💚 FREE PASS!'],
                extraLife: ['❤️ LIFE BANKED!', '❤️ EXTRA LIFE!', '❤️ SAVED!'],
                rainbow: ['🌈 RAINBOW!', '🌈 DISCO TIME!', '🌈 PARTY MODE!'],
                gravity: ['🌀 GRAVITY!', '🌀 SPIRAL!', '🌀 VORTEX!'],
                mirror: ['🪞 MIRROR!', '🪞 REVERSED!', '🪞 FLIP CONTROLS!'],
            };

            const messages = activationMessages[type] || [powerupInfo.icon + ' ' + powerupInfo.name];
            const message = messages[Math.floor(Math.random() * messages.length)];
            showComboPopup(message, powerupInfo.description);

            state.triggerPulse(2);

            // Apply powerup effect
            switch (type) {
                case 'slowTime':
                    state.slowTimeActive = true;
                    state.activePowerups.slowTime = Date.now() + powerupInfo.duration;
                    break;
                case 'shield':
                    state.hasShield = true;
                    sound.play('shield');
                    break;
                case 'ghost':
                    state.ghostActive = true;
                    state.activePowerups.ghost = Date.now() + powerupInfo.duration;
                    break;
                case 'freeze':
                    state.freezeActive = true;
                    state.activePowerups.freeze = Date.now() + powerupInfo.duration;
                    break;
                case 'tinyMode':
                    state.tinyModeActive = true;
                    state.giantModeActive = false;
                    state.activePowerups.tinyMode = Date.now() + powerupInfo.duration;
                    delete state.activePowerups.giantMode;
                    break;
                case 'giantMode':
                    state.giantModeActive = true;
                    state.tinyModeActive = false;
                    state.activePowerups.giantMode = Date.now() + powerupInfo.duration;
                    delete state.activePowerups.tinyMode;
                    break;
                case 'doublePoints':
                    state.doublePointsActive = true;
                    state.activePowerups.doublePoints = powerupInfo.stackable ? Infinity : Date.now() + powerupInfo.duration;
                    break;
                case 'triplePoints':
                    state.triplePointsActive = true;
                    if (!POWERUP_TYPES.doublePoints.stackable) {
                        state.doublePointsActive = false;
                        delete state.activePowerups.doublePoints;
                    }
                    state.activePowerups.triplePoints = powerupInfo.stackable ? Infinity : Date.now() + powerupInfo.duration;
                    break;
                case 'perfectStreak':
                    state.perfectStreakActive = true;
                    state.activePowerups.perfectStreak = POWERUP_TYPES.perfectStreak.stackable ? Infinity : Date.now() + powerupInfo.duration;
                    break;
                case 'comboKeeper':
                    state.comboKeeperActive = true;
                    state.activePowerups.comboKeeper = POWERUP_TYPES.comboKeeper.stackable ? Infinity : Date.now() + powerupInfo.duration;
                    break;
                case 'comboBoost':
                    state.combo += 10;
                    state.updateMultiplier();
                    break;
                case 'jackpot':
                    const bonusPoints = Math.floor(Math.random() * 91) + 10;
                    state.addScore(bonusPoints);
                    showComboPopup(`🎰 +${bonusPoints} POINTS!`);
                    break;
                case 'magnetize':
                    state.magnetizeActive = true;
                    state.activePowerups.magnetize = POWERUP_TYPES.magnetize.stackable ? Infinity : Date.now() + powerupInfo.duration;
                    break;
                case 'wideGap':
                    state.wideGapActive = true;
                    state.activePowerups.wideGap = POWERUP_TYPES.wideGap.stackable ? Infinity : Date.now() + powerupInfo.duration;
                    break;
                case 'slowRings':
                    state.slowRingsActive = true;
                    state.activePowerups.slowRings = Date.now() + powerupInfo.duration;
                    break;
                case 'noDoubles':
                    state.noDoublesActive = true;
                    state.activePowerups.noDoubles = Date.now() + powerupInfo.duration;
                    break;
                case 'autoPass':
                    state.autoPassActive = true;
                    state.activePowerups.autoPass = Date.now() + powerupInfo.duration;
                    break;
                case 'xray':
                    state.xrayActive = true;
                    state.activePowerups.xray = Date.now() + powerupInfo.duration;
                    break;
                case 'clearRings':
                    screenShakeRef.current = 15;
                    const colors = getColors();
                    for (const ring of state.rings) {
                        if (!ring.passed) {
                            ring.markPassed('#ff4444');
                            particlesRef.current.ring(centerX, centerY, ring.radius, '#ff4444', 8);
                        }
                    }
                    state.rings = [];
                    break;
                case 'reverseRings':
                    state.reverseRingsActive = true;
                    state.activePowerups.reverseRings = Date.now() + powerupInfo.duration;
                    break;
                case 'shrinkRings':
                    for (const ring of state.rings) {
                        ring.outerRadius *= 0.7;
                        ring.innerRadius *= 0.7;
                        ring.requiredSize *= 0.7;
                    }
                    break;
                case 'expandRings':
                    for (const ring of state.rings) {
                        ring.outerRadius *= 1.3;
                        ring.innerRadius *= 1.3;
                        ring.requiredSize *= 1.3;
                    }
                    break;
                case 'convertRings':
                    for (const ring of state.rings) {
                        if (!ring.passed) {
                            ring.markPassed('#66ff66');
                            state.addScore(1);
                            particlesRef.current.ring(centerX, centerY, ring.radius, '#66ff66', 6);
                        }
                    }
                    state.rings = state.rings.filter((r) => r.passed);
                    break;
                case 'extraLife':
                    if (state.hasShield) {
                        state.extraLifeStored = true;
                    } else {
                        state.hasShield = true;
                    }
                    break;
                case 'rainbow':
                    state.rainbowActive = true;
                    state.activePowerups.rainbow = Date.now() + powerupInfo.duration;
                    break;
                case 'gravity':
                    state.gravityActive = true;
                    state.activePowerups.gravity = Date.now() + powerupInfo.duration;
                    break;
                case 'mirror':
                    state.mirrorActive = true;
                    state.activePowerups.mirror = Date.now() + powerupInfo.duration;
                    break;
                case 'invincible':
                    state.invincibleActive = true;
                    state.activePowerups.invincible = Date.now() + powerupInfo.duration;
                    break;
                case 'pulse':
                    state.pulseActive = true;
                    state.activePowerups.pulse = Date.now() + powerupInfo.duration;
                    break;
                case 'elastic':
                    state.elasticActive = true;
                    state.activePowerups.elastic = Date.now() + powerupInfo.duration;
                    break;
            }

            // Celebration particles
            particlesRef.current.burst(centerX, centerY, powerupInfo.color, 35, {
                minSpeed: 3,
                maxSpeed: 8,
                minSize: 4,
                maxSize: 10,
            });
            particlesRef.current.burst(centerX, centerY, '#ffffff', 15, {
                minSpeed: 4,
                maxSpeed: 10,
                minSize: 2,
                maxSize: 5,
            });
        },
        [centerX, centerY, getColors, showComboPopup]
    );

    // Update powerups
    const updatePowerups = useCallback(() => {
        const state = gameStateRef.current;
        const now = Date.now();

        const timedPowerups = [
            { key: 'slowTime', state: 'slowTimeActive' },
            { key: 'freeze', state: 'freezeActive' },
            { key: 'ghost', state: 'ghostActive' },
            { key: 'invincible', state: 'invincibleActive' },
            { key: 'tinyMode', state: 'tinyModeActive' },
            { key: 'giantMode', state: 'giantModeActive' },
            { key: 'pulse', state: 'pulseActive' },
            { key: 'elastic', state: 'elasticActive' },
            { key: 'doublePoints', state: 'doublePointsActive' },
            { key: 'triplePoints', state: 'triplePointsActive' },
            { key: 'perfectStreak', state: 'perfectStreakActive' },
            { key: 'comboKeeper', state: 'comboKeeperActive' },
            { key: 'magnetize', state: 'magnetizeActive' },
            { key: 'wideGap', state: 'wideGapActive' },
            { key: 'slowRings', state: 'slowRingsActive' },
            { key: 'noDoubles', state: 'noDoublesActive' },
            { key: 'autoPass', state: 'autoPassActive' },
            { key: 'xray', state: 'xrayActive' },
            { key: 'reverseRings', state: 'reverseRingsActive' },
            { key: 'rainbow', state: 'rainbowActive' },
            { key: 'gravity', state: 'gravityActive' },
            { key: 'mirror', state: 'mirrorActive' },
        ];

        for (const powerup of timedPowerups) {
            if (state.activePowerups[powerup.key] && now > state.activePowerups[powerup.key]) {
                (state as any)[powerup.state] = false;
                delete state.activePowerups[powerup.key];
            }
        }

        if (state.extraLifeStored && !state.hasShield) {
            state.extraLifeStored = false;
            state.hasShield = true;
            showComboPopup('❤️ EXTRA LIFE ACTIVATED!');
        }
    }, [showComboPopup]);

    // Check theme unlocks
    const checkThemeUnlocks = useCallback(async () => {
        const state = gameStateRef.current;
        for (const [themeId, theme] of Object.entries(THEMES)) {
            if (state.unlockedThemes.includes(themeId)) continue;
            if (state.score < theme.unlockScore) continue;

            const unlocked = await state.unlockTheme(themeId);
            if (unlocked) {
                sound.play('unlock');
                haptic.heavy();
                showThemeUnlock(theme.name);
                await state.setTheme(themeId);
                break;
            }
        }
    }, [showThemeUnlock]);

    // Start game
    const startGame = useCallback(() => {
        const state = gameStateRef.current;
        const previousScore = state.score;
        state.reset();
        state.isPlaying = true;
        state.lastRingSpawn = Date.now() - state.ringSpawnInterval;
        state.waveStartTime = Date.now();
        particlesRef.current.clear();

        state.applyEndowedProgress(previousScore);

        setGameOver(false);
        sound.startMusic();
        spawnRing();
        forceUpdate((n) => n + 1);
    }, [spawnRing]);

    // Handle touch
    const handleTouchStart = useCallback(
        (e: GestureResponderEvent) => {
            sound.init();
            haptic.light();
            gameStateRef.current.isHolding = true;
            if (!gameStateRef.current.isPlaying) {
                startGame();
            }
        },
        [startGame]
    );

    const handleTouchEnd = useCallback(() => {
        gameStateRef.current.isHolding = false;
    }, []);

    // Game loop update
    const update = useCallback(
        (deltaTime: number) => {
            const state = gameStateRef.current;
            const colors = getColors();

            // Update screen shake
            if (screenShakeRef.current > 0) {
                screenShakeRef.current *= 0.9;
                if (screenShakeRef.current < 0.5) screenShakeRef.current = 0;
            }

            // Update camera zoom
            let targetZoom = 1.0;
            if (state.tinyModeActive) targetZoom = 1.15;
            else if (state.giantModeActive) targetZoom = 0.9;
            cameraZoomRef.current += (targetZoom - cameraZoomRef.current) * 0.05;

            // Visual effects
            state.pulseEffect += 0.05;
            state.backgroundPulse = Math.sin(state.pulseEffect) * 0.5 + 0.5;

            // Particles
            particlesRef.current.update();

            // Powerup progress animation
            state.updatePowerupProgress();

            // Satisfaction pulse
            state.updatePulse();

            // Smooth score display
            if (state.displayScore < state.score) {
                state.displayScore += Math.ceil((state.score - state.displayScore) * 0.2);
                if (state.displayScore > state.score) state.displayScore = state.score;
            }

            if (!state.isPlaying) return;

            // Hit stop check
            if (state.isInHitStop()) return;

            updatePowerups();
            sound.updateMusic(state.combo);

            // Calculate effective speed
            let effectiveSpeed = state.ringSpeed;
            if (state.slowTimeActive) effectiveSpeed *= 0.4;
            if (state.freezeActive) effectiveSpeed = 0;
            if (state.reverseRingsActive) effectiveSpeed *= -0.5;

            // Apply pushback
            const pushback = state.applyClearancePushback();
            if (pushback > 0) {
                for (const ring of state.rings) {
                    if (!ring.passed) ring.radius += pushback;
                }
                for (const powerup of state.powerups) {
                    if (!powerup.collected) powerup.radius += pushback;
                }
            }

            // Player size control
            if (state.tinyModeActive) {
                state.targetSize = GAME_CONFIG.MIN_PLAYER_SIZE;
            } else if (state.giantModeActive) {
                state.targetSize = GAME_CONFIG.MAX_PLAYER_SIZE;
            } else if (state.isHolding) {
                state.targetSize = Math.min(GAME_CONFIG.MAX_PLAYER_SIZE, state.targetSize + GAME_CONFIG.PLAYER_GROW_SPEED);
            } else {
                state.targetSize = Math.max(GAME_CONFIG.MIN_PLAYER_SIZE, state.targetSize - GAME_CONFIG.PLAYER_SHRINK_SPEED);
            }

            state.playerSize += (state.targetSize - state.playerSize) * 0.15;

            // Ring spawning
            const now = Date.now();
            const spawnInterval = state.slowTimeActive ? state.ringSpawnInterval * 1.5 : state.ringSpawnInterval;
            if (now - state.lastRingSpawn > spawnInterval) {
                spawnRing();
                state.lastRingSpawn = now;
                sound.play('whoosh');
            }

            // Update powerups
            for (const powerup of state.powerups) {
                powerup.update(effectiveSpeed);
                if (powerup.checkCollection(state.playerSize)) {
                    activatePowerup(powerup.type);
                }
            }
            state.powerups = state.powerups.filter((p) => !p.shouldRemove());

            // Update rings
            for (const ring of state.rings) {
                ring.update(effectiveSpeed);

                if (state.wideGapActive && !ring.gapWidened) {
                    ring.innerRadius -= 10;
                    ring.outerRadius += 10;
                    ring.gapWidened = true;
                }

                if (ring.isAtPlayer(state.playerSize)) {
                    let fitsGap = state.ghostActive || ring.playerFitsGap(state.playerSize);
                    let isNearMiss = false;

                    if (!fitsGap && !state.ghostActive) {
                        const fitsWithForgiveness = ring.playerFitsGapWithForgiveness(state.playerSize, GAME_CONFIG.PHANTOM_HITBOX_FORGIVENESS);
                        if (fitsWithForgiveness) {
                            fitsGap = true;
                            isNearMiss = true;
                        }
                    }

                    if (state.magnetizeActive && !fitsGap) {
                        const sizeDiff = Math.abs(state.playerSize - ring.requiredSize);
                        if (sizeDiff < 25) fitsGap = true;
                    }

                    if (fitsGap) {
                        if (isNearMiss) {
                            state.recordNearMiss();
                            sound.play('nearMiss');
                            showComboPopup('😱 CLOSE CALL!');
                            screenShakeRef.current = 5;
                            particlesRef.current.burst(
                                centerX + (Math.random() - 0.5) * state.playerSize,
                                centerY + (Math.random() - 0.5) * state.playerSize,
                                '#ffa500',
                                8,
                                { minSpeed: 2, maxSpeed: 5, minSize: 2, maxSize: 4 }
                            );
                        }

                        let isPerfect = ring.isPerfectPass(state.playerSize);
                        if (state.perfectStreakActive) isPerfect = true;
                        if (isNearMiss) isPerfect = false;

                        ring.markPassed(colors.ringPassed);

                        if (isPerfect) {
                            state.incrementCombo();
                            sound.play('perfect', state.getPitchScale());
                        } else {
                            if (!state.comboKeeperActive) state.resetCombo();
                            sound.play('pass');
                        }

                        let points = 1;
                        if (state.triplePointsActive) points *= 3;
                        else if (state.doublePointsActive) points *= 2;

                        state.addScore(points);

                        if (state.combo > 0 && state.combo % 5 === 0) {
                            showComboPopup(`🔥 ${state.combo} COMBO!`);
                            sound.play('combo');
                            haptic.medium();
                            state.triggerPulse(2);
                        } else if (isPerfect) {
                            state.triggerPulse(1);
                            haptic.light();
                        } else {
                            state.triggerPulse(0);
                            haptic.light();
                        }

                        state.triggerClearanceReward(isPerfect);
                        state.updateDifficulty();
                        checkThemeUnlocks();
                        onRingPassed(isPerfect);

                        particlesRef.current.ring(centerX, centerY, state.playerSize, isPerfect ? '#ffff00' : colors.playerGlow, isPerfect ? 25 : 12);
                    } else {
                        if (state.hasShield) {
                            state.hasShield = false;
                            ring.markPassed('#ffd700');
                            sound.play('shield');
                            haptic.medium();
                            showComboPopup('🛡️ SHIELD USED!');
                            clearStackablePowerups();
                            state.resetCombo();
                        } else {
                            ring.color = colors.ringFail;
                            handleGameOver();
                            return;
                        }
                    }
                }

                if (ring.hasPassed()) {
                    if (state.hasShield) {
                        state.hasShield = false;
                        ring.passed = true;
                    } else {
                        ring.color = colors.ringFail;
                        handleGameOver();
                        return;
                    }
                }
            }

            state.rings = state.rings.filter((r) => !r.shouldRemove());
        },
        [
            getColors,
            spawnRing,
            activatePowerup,
            updatePowerups,
            checkThemeUnlocks,
            onRingPassed,
            showComboPopup,
            clearStackablePowerups,
            handleGameOver,
            centerX,
            centerY,
        ]
    );

    // Animation loop
    useEffect(() => {
        const gameLoop = (timestamp: number) => {
            const deltaTime = Math.min(timestamp - lastTimeRef.current, 100);
            lastTimeRef.current = timestamp;

            update(deltaTime);
            forceUpdate((n) => n + 1);

            animationRef.current = requestAnimationFrame(gameLoop);
        };

        animationRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [update]);

    const state = gameStateRef.current;
    const colors = getColors();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <StatusBar hidden />

            <GameCanvas
                width={width}
                height={height}
                centerX={centerX}
                centerY={centerY}
                playerSize={state.playerSize}
                rings={state.rings}
                powerups={state.powerups}
                particles={particlesRef.current.getParticles()}
                theme={colors}
                hasShield={state.hasShield}
                ghostActive={state.ghostActive}
                tinyModeActive={state.tinyModeActive}
                giantModeActive={state.giantModeActive}
                magnetizeActive={state.magnetizeActive}
                freezeActive={state.freezeActive}
                rainbowActive={state.rainbowActive}
                slowTimeActive={state.slowTimeActive}
                isHolding={state.isHolding}
                isPlaying={state.isPlaying}
                pulseScale={state.getPulseScale()}
                backgroundPulse={state.backgroundPulse}
                powerupProgressPercent={state.getPowerupProgressPercent()}
                nextPowerupType={state.nextPowerupType}
                powerupIconAngle={state.powerupIconAngle}
                isPowerupReady={state.isPowerupReady()}
                screenShake={screenShakeRef.current}
                cameraZoom={cameraZoomRef.current}
            />

            <ScoreDisplay
                score={state.displayScore}
                highScore={state.highScore}
                multiplier={state.multiplier}
                multiplierActive={state.multiplier > 1}
            />

            <PowerupIndicator activePowerups={state.activePowerups} hasShield={state.hasShield} />

            <ComboPopup visible={comboPopup.visible} title={comboPopup.title} subtitle={comboPopup.subtitle} />

            <ThemeUnlock visible={themeUnlock.visible} themeName={themeUnlock.name} />

            <Message visible={!state.isPlaying && !gameOver} />

            <GameOver visible={gameOver} score={state.score} highScore={state.highScore} isNewHighScore={isNewHighScore} nextUnlock={nextUnlock} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
