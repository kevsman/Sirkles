import { GAME_CONFIG } from '../config/constants';

// Ring Entity
export class Ring {
    radius: number;
    innerRadius: number;
    outerRadius: number;
    gap: number;
    requiredSize: number;
    passed: boolean = false;
    color: string;
    isDouble: boolean = false;
    movingGap: boolean = false;
    gapAngle: number = 0;
    gapSpeed: number = 0;
    gapWidened: boolean = false;

    constructor(screenSize: number, innerRadius: number, outerRadius: number, color: string) {
        // Spawn ring just outside the visible screen
        this.radius = screenSize + 50;
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.gap = outerRadius - innerRadius;
        this.requiredSize = innerRadius + this.gap / 2;
        this.color = color;
    }

    update(speed: number) {
        this.radius -= speed;

        if (this.movingGap) {
            this.gapAngle += this.gapSpeed;
        }
    }

    isAtPlayer(playerSize: number): boolean {
        // Detection window: check when ring radius is close to player size
        // We only check the upper bound (ring is close to or inside player)
        // This prevents "tunneling" where fast rings/player growth might skip the detection window entirely
        return !this.passed && this.radius <= playerSize + GAME_CONFIG.RING_THICKNESS;
    }

    playerFitsGap(playerSize: number): boolean {
        return playerSize >= this.innerRadius && playerSize <= this.outerRadius;
    }

    // Phantom hitbox - uses forgiveness buffer for near misses
    // Shrinks effective player size to give a little leeway when too big
    // Also expands the gap slightly to give leeway when too small
    playerFitsGapWithForgiveness(playerSize: number, forgiveness: number): boolean {
        // Apply forgiveness: shrink player if too big, or expand valid gap range if too small
        const forgivenPlayerSize = playerSize * (1 - forgiveness);
        const expandedInner = this.innerRadius * (1 - forgiveness);
        
        // Pass if shrunken player fits OR if player fits expanded inner boundary
        return (forgivenPlayerSize >= this.innerRadius && forgivenPlayerSize <= this.outerRadius) ||
               (playerSize >= expandedInner && playerSize <= this.outerRadius);
    }

    // Check if player is in the "near miss" zone
    isNearMiss(playerSize: number, forgiveness: number): boolean {
        const visualFits = this.playerFitsGap(playerSize);
        const forgivenFits = this.playerFitsGapWithForgiveness(playerSize, forgiveness);
        return !visualFits && forgivenFits;
    }

    isPerfectPass(playerSize: number): boolean {
        const perfectThreshold = this.gap * 0.25;
        const distFromCenter = Math.abs(playerSize - this.requiredSize);
        return distFromCenter < perfectThreshold;
    }

    markPassed(passedColor: string) {
        this.passed = true;
        this.color = passedColor;
    }

    shouldRemove(): boolean {
        return this.radius < -50;
    }

    hasPassed(): boolean {
        return !this.passed && this.radius < -GAME_CONFIG.RING_THICKNESS;
    }
}

// Ring Factory
export function createRing(
    screenSize: number, 
    difficulty: number, 
    patternMode: 'normal' | 'double' | 'moving', 
    ringColor: string,
    options?: {
        gap?: number;
        doubleChance?: number;
        movingGapChance?: number;
    }
): Ring {
    // Use provided gap or calculate from difficulty (fallback for backward compatibility)
    let gap: number;
    if (options?.gap !== undefined) {
        gap = options.gap;
    } else {
        const difficultyFactor = Math.min(difficulty / 40, 1);
        gap = GAME_CONFIG.GAP_BASE - (GAME_CONFIG.GAP_BASE - GAME_CONFIG.GAP_MIN) * difficultyFactor;
    }

    const minInner = GAME_CONFIG.MIN_PLAYER_SIZE + 5;
    const maxInner = GAME_CONFIG.MAX_PLAYER_SIZE - gap - 10;
    const innerRadius = minInner + Math.random() * (maxInner - minInner);
    const outerRadius = innerRadius + gap;

    const ring = new Ring(screenSize, innerRadius, outerRadius, ringColor);

    // Pattern variations - use provided chances or defaults
    const doubleChance = options?.doubleChance ?? 0.4;
    const movingGapChance = options?.movingGapChance ?? 0.3;
    
    if (patternMode === 'double' && Math.random() < doubleChance) {
        ring.isDouble = true;
    }

    if (patternMode === 'moving' && Math.random() < movingGapChance) {
        ring.movingGap = true;
        ring.gapAngle = Math.random() * Math.PI * 2;
        // Slower gap movement at lower difficulties
        const baseGapSpeed = 0.03 + (difficulty / 100) * 0.02;
        ring.gapSpeed = (Math.random() - 0.5) * baseGapSpeed;
    }

    return ring;
}
