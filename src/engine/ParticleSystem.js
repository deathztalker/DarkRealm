/**
 * Particle System — High-performance visual effects
 */
export class Particle {
    constructor(x, y, vx, vy, life, color, size = 2) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.alpha = 1;
        this.gravity = 0;
    }

    update(dt) {
        this.x += this.vx * (dt / 16);
        this.y += this.vy * (dt / 16);
        this.vy += this.gravity * (dt / 16);
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        return this.life > 0;
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
    }

    emitBurst(x, y, color, count = 10, speed = 2) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const s = Math.random() * speed;
            const vx = Math.cos(angle) * s;
            const vy = Math.sin(angle) * s;
            const life = 300 + Math.random() * 500;
            const p = new Particle(x, y, vx, vy, life, color, 1 + Math.random() * 2);
            p.gravity = 0.05;
            this.particles.push(p);
        }
    }

    emitTrail(x, y, color) {
        const p = new Particle(x, y, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, 300, color, 1.5);
        this.particles.push(p);
    }

    shake(duration, intensity) {
        this.shakeTimer = duration;
        this.shakeIntensity = intensity;
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(dt)) {
                this.particles.splice(i, 1);
            }
        }
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
        }
    }

    render(ctx) {
        if (this.shakeTimer > 0) {
            const sx = (Math.random() - 0.5) * this.shakeIntensity;
            const sy = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.translate(sx, sy);
        }
        for (const p of this.particles) {
            p.render(ctx);
        }
    }
}

export const fx = new ParticleSystem();
