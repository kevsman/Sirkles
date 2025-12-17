// Particle System - Manages visual particle effects
export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    color: string;
    sparkle: boolean;
    rotation?: number;
    rotationSpeed?: number;
}

export interface BurstOptions {
    minSpeed?: number;
    maxSpeed?: number;
    minSize?: number;
    maxSize?: number;
    spread?: number;
    startAngle?: number;
}

export class ParticleSystem {
    particles: Particle[] = [];

    /**
     * Create particles in a burst pattern with sparkles
     */
    burst(x: number, y: number, color: string, count: number = 20, options: BurstOptions = {}) {
        const { minSpeed = 2, maxSpeed = 5, minSize = 2, maxSize = 6, spread = Math.PI * 2, startAngle = 0 } = options;

        for (let i = 0; i < count; i++) {
            const angle = startAngle + (spread * i) / count + (Math.random() - 0.5) * 0.3;
            const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: minSize + Math.random() * (maxSize - minSize),
                life: 1,
                color,
                sparkle: Math.random() > 0.5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
            });
        }

        // Add some extra tiny sparkles
        for (let i = 0; i < count / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = maxSpeed + Math.random() * 3;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 2,
                life: 0.7,
                color: '#ffffff',
                sparkle: true,
            });
        }
    }

    /**
     * Create particles around a radius with trail effect
     */
    ring(centerX: number, centerY: number, radius: number, color: string, count: number = 12) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const speed = 3 + Math.random() * 5;

            this.particles.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                life: 1,
                color,
                sparkle: i % 3 === 0,
            });
        }

        // Inner sparkle ring
        for (let i = 0; i < count / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                x: centerX + Math.cos(angle) * (radius * 0.8),
                y: centerY + Math.sin(angle) * (radius * 0.8),
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                size: 2 + Math.random() * 3,
                life: 0.8,
                color: '#ffffff',
                sparkle: true,
            });
        }
    }

    /**
     * Update all particles
     */
    update() {
        this.particles = this.particles.filter((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.life -= 0.022;
            p.size *= 0.96;
            if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
                p.rotation += p.rotationSpeed;
            }
            return p.life > 0 && p.size > 0.5;
        });
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }

    /**
     * Get all particles for rendering
     */
    getParticles(): Particle[] {
        return this.particles;
    }
}
