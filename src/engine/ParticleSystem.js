/**
 * Particle System — Premium visual effects for combat
 * Supports: trails, bursts, lightning arcs, slash marks, ground impacts, elemental FX
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
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.shape = 'circle'; // circle, line, spark, snowflake
        this.length = 0; // for line/spark shapes
    }

    update(dt) {
        this.x += this.vx * (dt / 16);
        this.y += this.vy * (dt / 16);
        this.vy += this.gravity * (dt / 16);
        this.rotation += this.rotationSpeed * (dt / 16);
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        return this.life > 0;
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;

        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'spark') {
            ctx.lineWidth = this.size * 0.6;
            ctx.beginPath();
            const len = this.length || this.size * 3;
            const angle = Math.atan2(this.vy, this.vx);
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - Math.cos(angle) * len, this.y - Math.sin(angle) * len);
            ctx.stroke();
        } else if (this.shape === 'snowflake') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            for (let i = 0; i < 6; i++) {
                ctx.rotate(Math.PI / 3);
                ctx.fillRect(-0.5, 0, 1, this.size);
            }
        } else if (this.shape === 'line') {
            ctx.lineWidth = this.size;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.beginPath();
            ctx.moveTo(-this.length / 2, 0);
            ctx.lineTo(this.length / 2, 0);
            ctx.stroke();
        }

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

    // ═══ Premium VFX Methods ═══

    /** Fire trail — orange/red sparks rising */
    emitFireTrail(x, y) {
        for (let i = 0; i < 3; i++) {
            const colors = ['#ff6000', '#ff8020', '#ffaa00', '#ff4000'];
            const p = new Particle(x + (Math.random() - 0.5) * 6, y + (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 1.5, -(0.5 + Math.random() * 1.5), 200 + Math.random() * 300,
                colors[Math.floor(Math.random() * colors.length)], 1 + Math.random() * 2);
            p.gravity = -0.02;
            this.particles.push(p);
        }
    }

    /** Ice trail — blue crystals floating */
    emitIceTrail(x, y) {
        for (let i = 0; i < 2; i++) {
            const p = new Particle(x + (Math.random() - 0.5) * 4, y + (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, 400,
                Math.random() > 0.5 ? '#80d0ff' : '#b0e8ff', 1 + Math.random());
            p.shape = 'snowflake';
            p.rotationSpeed = (Math.random() - 0.5) * 0.1;
            this.particles.push(p);
        }
    }

    /** Lightning bolt between two points */
    emitLightning(x1, y1, x2, y2, segments = 6) {
        let cx = x1, cy = y1;
        const dx = (x2 - x1) / segments, dy = (y2 - y1) / segments;
        for (let i = 0; i < segments; i++) {
            const nx = x1 + dx * (i + 1) + (Math.random() - 0.5) * 12;
            const ny = y1 + dy * (i + 1) + (Math.random() - 0.5) * 12;
            const p = new Particle(cx, cy, 0, 0, 120 + Math.random() * 80,
                Math.random() > 0.3 ? '#ffff40' : '#ffffff', 1.5);
            p.shape = 'line';
            p.rotation = Math.atan2(ny - cy, nx - cx);
            p.length = Math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2);
            this.particles.push(p);
            cx = nx; cy = ny;
        }
        // Bright flash at impact
        this.emitBurst(x2, y2, '#ffff80', 4, 1.5);
    }

    /** Sword slash arc */
    emitSlash(x, y, angle, color = '#cccccc', radius = 20) {
        for (let i = 0; i < 8; i++) {
            const a = angle - 0.6 + (i / 7) * 1.2;
            const px = x + Math.cos(a) * radius;
            const py = y + Math.sin(a) * radius;
            const p = new Particle(px, py, Math.cos(a) * 1, Math.sin(a) * 1, 150 + Math.random() * 100,
                color, 1.5);
            p.shape = 'spark';
            p.length = 5;
            this.particles.push(p);
        }
    }

    /** Ground slam shockwave */
    emitShockwave(x, y, radius = 40, color = '#b0a080') {
        for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            const p = new Particle(x, y, Math.cos(a) * 3, Math.sin(a) * 3,
                300 + Math.random() * 200, color, 2 + Math.random());
            p.gravity = 0.08;
            this.particles.push(p);
        }
        // Dust cloud
        for (let i = 0; i < 10; i++) {
            const p = new Particle(x + (Math.random() - 0.5) * radius, y + (Math.random() - 0.5) * radius * 0.5,
                (Math.random() - 0.5) * 1, -Math.random() * 1, 400 + Math.random() * 300,
                '#8a7a60', 2 + Math.random() * 3);
            p.gravity = 0.02;
            this.particles.push(p);
        }
    }

    /** Poison cloud */
    emitPoisonCloud(x, y, radius = 30) {
        for (let i = 0; i < 6; i++) {
            const px = x + (Math.random() - 0.5) * radius;
            const py = y + (Math.random() - 0.5) * radius;
            const p = new Particle(px, py, (Math.random() - 0.5) * 0.5, -Math.random() * 0.5,
                600 + Math.random() * 400,
                Math.random() > 0.5 ? '#40c040' : '#60e060', 3 + Math.random() * 4);
            p.gravity = -0.01;
            this.particles.push(p);
        }
    }

    /** Holy/radiant burst */
    emitHolyBurst(x, y) {
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const p = new Particle(x, y, Math.cos(a) * 2, Math.sin(a) * 2, 400,
                Math.random() > 0.3 ? '#ffe880' : '#ffffff', 2);
            this.particles.push(p);
        }
    }

    /** Healing effect — green sparkles rising */
    emitHeal(x, y) {
        for (let i = 0; i < 10; i++) {
            const p = new Particle(x + (Math.random() - 0.5) * 15, y + (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 1, -(1 + Math.random() * 2), 600,
                '#40ff40', 1.5 + Math.random());
            p.gravity = -0.05;
            this.particles.push(p);
        }
    }

    /** Mana steal effect — blue sparkles rising */
    emitManaSteal(x, y) {
        for (let i = 0; i < 8; i++) {
            const p = new Particle(x + (Math.random() - 0.5) * 15, y + (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 1, -(1 + Math.random() * 2), 500,
                '#4080ff', 1.5 + Math.random());
            p.gravity = -0.05;
            this.particles.push(p);
        }
    }

    /** Shadow/dark magic effect */
    emitShadow(x, y) {
        for (let i = 0; i < 8; i++) {
            const p = new Particle(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 0.8, -Math.random() * 0.8, 400 + Math.random() * 300,
                Math.random() > 0.5 ? '#6020a0' : '#4010b0', 2 + Math.random() * 2);
            this.particles.push(p);
        }
    }

    /** Blood splatter (melee hit) */
    emitBlood(x, y, angle = 0) {
        for (let i = 0; i < 6; i++) {
            const spread = (Math.random() - 0.5) * 1.2;
            const p = new Particle(x, y, Math.cos(angle + spread) * (1 + Math.random() * 2),
                Math.sin(angle + spread) * (1 + Math.random() * 2), 200 + Math.random() * 200,
                Math.random() > 0.4 ? '#a00000' : '#800000', 1 + Math.random());
            p.gravity = 0.1;
            this.particles.push(p);
        }
    }

    /** Enemy projectile hit on player */
    emitHitImpact(x, y, type = 'physical') {
        const colors = {
            physical: ['#ff4444', '#ff8888', '#ffcccc'],
            fire: ['#ff6000', '#ff8020', '#ffcc00'],
            cold: ['#00ccff', '#80e0ff', '#ffffff'],
            lightning: ['#ffff00', '#ffff80', '#ffffff'],
            poison: ['#00ff00', '#40ff40', '#80ff80'],
            shadow: ['#8000ff', '#a040ff', '#c080ff'],
            holy: ['#ffe800', '#fff4aa', '#ffffff'],
            magic: ['#ff00ff', '#ff80ff', '#ffaaff'],
        };
        const c = colors[type] || colors.physical;
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            const p = new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
                200 + Math.random() * 200, c[Math.floor(Math.random() * c.length)],
                1.5 + Math.random());
            p.shape = 'spark';
            p.length = 4;
            this.particles.push(p);
        }
    }

    shake(duration, intensity) {
        this.shakeTimer = duration;
        this.shakeIntensity = intensity;
    }

    update(dt) {
        // Cap particles for performance
        if (this.particles.length > 500) {
            this.particles.splice(0, this.particles.length - 400);
        }
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
