import { GAME_CONFIG } from '../config/constants';
import { POWERUP_TYPES } from '../config/powerups';

// Powerup Entity
export class Powerup {
    radius: number;
    size: number;
    type: string;
    color: string;
    collected: boolean = false;
    pulsePhase: number = 0;

    constructor(screenSize: number, type: string) {
        const powerupInfo = POWERUP_TYPES[type];

        this.radius = screenSize + 30;
        this.size = GAME_CONFIG.MIN_PLAYER_SIZE + Math.random() * (GAME_CONFIG.MAX_PLAYER_SIZE - GAME_CONFIG.MIN_PLAYER_SIZE);
        this.type = type;
        this.color = powerupInfo?.color || '#ffd700';
    }

    update(speed: number) {
        this.radius -= speed * 0.8;
        this.pulsePhase += 0.1;
    }

    checkCollection(playerSize: number): boolean {
        if (this.collected) return false;

        // Auto-collect when powerup ring reaches the player
        if (this.radius <= playerSize + 15 && this.radius >= playerSize - 30) {
            this.collected = true;
            return true;
        }
        return false;
    }

    shouldRemove(): boolean {
        return this.collected || this.radius < -50;
    }
}

// Powerup Factory
export function createRandomPowerup(screenSize: number): Powerup {
    const types = Object.keys(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    return new Powerup(screenSize, type);
}
