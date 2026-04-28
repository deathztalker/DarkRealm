/**
 * Particle System — Premium visual effects for combat
 * Mejoras: Object Pooling, nuevos efectos, refactor limpio
 */

// ─── Constantes ────────────────────────────────────────────────────────────────
const TAU = Math.PI * 2;
const POOL_SIZE = 2000;

// ─── Hit Type Config ───────────────────────────────────────────────────────────
const HIT_CONFIGS = {
    fire: { color: '#ff6000', count: 12, speed: 2.5 },
    cold: { color: '#80d0ff', count: 10, speed: 2.0 },
    lightning: { color: '#ffff40', count: 8, speed: 3.5 },
    poison: { color: '#40c040', count: 10, speed: 1.5 },
    shadow: { color: '#8040c0', count: 12, speed: 2.0 },
    holy: { color: '#ffe880', count: 15, speed: 2.5 },
    earth: { color: '#8a7a60', count: 8, speed: 1.8 },
    physical: { color: '#cccccc', count: 6, speed: 1.5 },
    magic: { color: '#ff80ff', count: 10, speed: 2.2 },
};

// ─── Skill Effect Config ───────────────────────────────────────────────────────
const SKILL_EFFECTS = [
    { keys: ['fireball', 'meteor', 'fire_nova'], srcColor: '#ff4400', hitColor: '#ff6600', srcCount: 15, hitCount: 30, srcSpeed: 2.5, hitSpeed: 3.5 },
    { keys: ['blizzard', 'frozen', 'cold'], srcColor: '#44eeff', hitColor: '#88ffff', srcCount: 15, hitCount: 25, srcSpeed: 2.5, hitSpeed: 3.0 },
    { keys: ['lightning', 'thunder', 'holy_shock'], srcColor: '#ffff00', hitColor: '#ffffaa', srcCount: 12, hitCount: 20, srcSpeed: 3.0, hitSpeed: 4.0 },
];

// ─── Object Pool ───────────────────────────────────────────────────────────────
class ParticlePool {
    constructor(size) {
        this._pool = [];
        this._active = [];
        for (let i = 0; i < size; i++) this._pool.push(new Particle());
    }

    acquire() {
        return this._pool.length > 0 ? this._pool.pop() : new Particle();
    }

    release(p) {
        this._pool.push(p);
    }

    get active() { return this._active; }

    add(p) { this._active.push(p); }

    update(dt) {
        for (let i = this._active.length - 1; i >= 0; i--) {
            if (!this._active[i].update(dt)) {
                this.release(this._active[i]);
                this._active.splice(i, 1);
            }
        }
    }

    render(ctx) {
        for (const p of this._active) p.render(ctx);
    }

    renderWithCamera(ctx, camera) {
        for (const p of this._active) {
            const screen = camera.toScreen(p.x, p.y);
            const prevX = p.x, prevY = p.y;
            p.x = screen.x; p.y = screen.y;
            p.render(ctx);
            p.x = prevX; p.y = prevY;
        }
    }
}

// ─── Particle ──────────────────────────────────────────────────────────────────
export class Particle {
    constructor() { this.reset(); }

    reset(x = 0, y = 0, vx = 0, vy = 0, life = 500, color = '#fff', size = 2) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.life = life; this.maxLife = life;
        this.color = color; this.size = size;
        this.alpha = 1; this.gravity = 0;
        this.rotation = 0; this.rotationSpeed = 0;
        this.shape = 'circle'; this.length = 0;
        return this;
    }

    update(dt) {
        const t = dt / 16;
        this.x += this.vx * t;
        this.y += this.vy * t;
        this.vy += this.gravity * t;
        this.rotation += this.rotationSpeed * t;
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        return this.life > 0;
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;

        switch (this.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, TAU);
                ctx.fill();
                break;

            case 'glow': {
                const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                grad.addColorStop(0, this.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, TAU);
                ctx.fill();
                break;
            }

            case 'spark': {
                const angle = Math.atan2(this.vy, this.vx);
                ctx.lineWidth = this.size * 0.6;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - Math.cos(angle) * 5, this.y - Math.sin(angle) * 5);
                ctx.stroke();
                break;
            }

            case 'snowflake':
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                for (let i = 0; i < 6; i++) {
                    ctx.rotate(Math.PI / 3);
                    ctx.fillRect(-0.5, 0, 1, this.size);
                }
                break;

            case 'line':
                ctx.lineWidth = this.size;
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.beginPath();
                ctx.moveTo(-this.length / 2, 0);
                ctx.lineTo(this.length / 2, 0);
                ctx.stroke();
                break;

            case 'star': {
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const outerAngle = (i * TAU) / 5 - Math.PI / 2;
                    const innerAngle = outerAngle + Math.PI / 5;
                    const outer = this.size;
                    const inner = this.size * 0.4;
                    if (i === 0) ctx.moveTo(Math.cos(outerAngle) * outer, Math.sin(outerAngle) * outer);
                    else ctx.lineTo(Math.cos(outerAngle) * outer, Math.sin(outerAngle) * outer);
                    ctx.lineTo(Math.cos(innerAngle) * inner, Math.sin(innerAngle) * inner);
                }
                ctx.closePath();
                ctx.fill();
                break;
            }

            case 'ring': {
                ctx.lineWidth = this.size * 0.3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, TAU);
                ctx.stroke();
                break;
            }
        }
        ctx.restore();
    }
}

// ─── Floating Text ─────────────────────────────────────────────────────────────
export class FloatingText {
    constructor(x, y, text, color, isCrit = false) {
        this.x = x + (Math.random() - 0.5) * 15;
        this.y = y - 10;
        this.text = text;
        this.color = color;
        this.isCrit = isCrit;
        this.life = 1000;
        this.maxLife = 1000;
        this.vy = -0.5 - Math.random() * 0.5;
        this.alpha = 1;
        // Scale-in effect for crits
        this.scale = isCrit ? 0.3 : 1;
        this.targetScale = 1;
    }

    update(dt) {
        this.y += this.vy * (dt / 16);
        this.vy *= 0.98;
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        if (this.scale < this.targetScale) this.scale = Math.min(this.targetScale, this.scale + dt / 80);
        return this.life > 0;
    }

    render(ctx, camera = null) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';

        let dx = this.x, dy = this.y;
        if (camera) {
            const s = camera.toScreen(this.x, this.y);
            dx = s.x; dy = s.y;
        }

        ctx.translate(dx, dy);
        ctx.scale(this.scale, this.scale);
        ctx.font = this.isCrit ? 'bold 16px "Cinzel", serif' : '12px "Inter", sans-serif';

        if (this.isCrit) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(this.text, 0, 0);
        }
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}

// ─── Particle System ───────────────────────────────────────────────────────────
export class ParticleSystem {
    constructor() {
        this._pool = new ParticlePool(POOL_SIZE);
        this.floatingTexts = [];
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
    }

    // ── Internal helpers ────────────────────────────────────────────────────────

    _spawn(x, y, vx, vy, life, color, size, overrides = {}) {
        const p = this._pool.acquire().reset(x, y, vx, vy, life, color, size);
        Object.assign(p, overrides);
        this._pool.add(p);
        return p;
    }

    _rand(min, max) { return min + Math.random() * (max - min); }

    // ── Core emitters ───────────────────────────────────────────────────────────

    emitBurst(x, y, color, count = 10, speed = 2, overrides = {}) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * TAU;
            const s = Math.random() * speed;
            this._spawn(
                x, y,
                Math.cos(angle) * s, Math.sin(angle) * s,
                this._rand(300, 800),
                color,
                this._rand(1, 3),
                { gravity: 0.05, ...overrides }
            );
        }
    }

    emitTrail(x, y, color) {
        this._spawn(
            x, y,
            this._rand(-0.25, 0.25), this._rand(-0.25, 0.25),
            300, color, 1.5
        );
    }

    emitText(x, y, text, color, isCrit = false) {
        this.floatingTexts.push(new FloatingText(x, y, text, color, isCrit));
    }

    shake(duration, intensity) {
        this.shakeTimer = duration;
        this.shakeIntensity = intensity;
    }

    // ── Skill Effects ───────────────────────────────────────────────────────────

    triggerSkillEffect(skillId, x, y, tx, ty) {
        if (!skillId) return;

        for (const cfg of SKILL_EFFECTS) {
            if (cfg.keys.some(k => skillId.includes(k))) {
                this.emitBurst(x, y, cfg.srcColor, cfg.srcCount, cfg.srcSpeed);
                if (tx != null) this.emitBurst(tx, ty, cfg.hitColor, cfg.hitCount, cfg.hitSpeed);
                return;
            }
        }

        if (['poison', 'venom', 'pandemic'].some(k => skillId.includes(k))) {
            this.emitPoisonCloud(x, y, 20);
            if (tx != null) this.emitPoisonCloud(tx, ty, 35);
        } else if (['shadow', 'void', 'dark'].some(k => skillId.includes(k))) {
            this.emitShadow(x, y);
            if (tx != null) this.emitShadow(tx, ty);
        } else if (['holy', 'divine', 'consecration'].some(k => skillId.includes(k))) {
            this.emitHolyBurst(x, y);
            if (tx != null) this.emitHolyBurst(tx, ty);
        } else if (['whirlwind', 'bladestorm', 'zeal'].some(k => skillId.includes(k))) {
            for (let a = 0; a < TAU; a += Math.PI / 4) this.emitSlash(x, y, a, '#ccc', 25);
        } else {
            this.emitBurst(x, y, '#ffffff', 10, 2.0);
        }
    }

    // ── Combat Effects ──────────────────────────────────────────────────────────

    emitHitImpact(x, y, type = 'physical') {
        const cfg = HIT_CONFIGS[type] || HIT_CONFIGS.physical;
        this.emitBurst(x, y, cfg.color, cfg.count, cfg.speed);

        if (Math.random() < 0.2) {
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * TAU;
                this._spawn(x, y, Math.cos(angle) * 3, Math.sin(angle) * 3, 400, '#fff', 1.5, { shape: 'spark' });
            }
        }
    }

    emitBlood(x, y, angle = 0) {
        for (let i = 0; i < 4; i++) {
            const spread = this._rand(-0.6, 0.6);
            this._spawn(
                x, y,
                Math.cos(angle + spread) * 2, Math.sin(angle + spread) * 2,
                300, '#a00000', 1.5,
                { gravity: 0.1 }
            );
        }
    }

    emitSlash(x, y, angle, color = '#cccccc', radius = 20) {
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        this._spawn(px, py, 0, 0, 200, color, 2, { shape: 'spark' });
    }

    emitDebris(x, y, color = '#8a7a60', count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * TAU;
            const s = this._rand(1, 4);
            this._spawn(x, y, Math.cos(angle) * s, Math.sin(angle) * s, 600, color, this._rand(1, 3), {
                gravity: 0.15,
                rotationSpeed: this._rand(-0.1, 0.1),
                shape: 'spark',
            });
        }
    }

    emitShockwave(x, y, radius = 40, color = '#b0a080') {
        this.emitBurst(x, y, color, 12, 3);
        // Expanding ring
        this._spawn(x, y, 0, 0, 300, color, radius, { shape: 'ring', gravity: 0 });
    }

    // ── Elemental Trails ────────────────────────────────────────────────────────

    emitFireTrail(x, y) {
        const colors = ['#ff6000', '#ff8020', '#ffaa00', '#ff4000'];
        this._spawn(
            x, y,
            this._rand(-0.5, 0.5), this._rand(-1.5, -0.5),
            300, colors[Math.floor(Math.random() * colors.length)], 2,
            { gravity: -0.02 }
        );
    }

    emitIceTrail(x, y) {
        this._spawn(
            x + this._rand(-2, 2), y + this._rand(-2, 2),
            this._rand(-0.4, 0.4), this._rand(-0.4, 0.4),
            400, '#80d0ff', this._rand(1, 2),
            { shape: 'snowflake', rotationSpeed: this._rand(-0.05, 0.05) }
        );
    }

    // ── Special FX ─────────────────────────────────────────────────────────────

    emitLightning(x1, y1, x2, y2, segments = 6) {
        let cx = x1, cy = y1;
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;
        for (let i = 0; i < segments; i++) {
            const nx = x1 + dx * (i + 1) + this._rand(-6, 6);
            const ny = y1 + dy * (i + 1) + this._rand(-6, 6);
            const len = Math.hypot(nx - cx, ny - cy);
            this._spawn(cx, cy, 0, 0, 150, '#ffff40', 1.5, {
                shape: 'line',
                rotation: Math.atan2(ny - cy, nx - cx),
                length: len,
            });
            cx = nx; cy = ny;
        }
        this.emitBurst(x2, y2, '#ffff80', 4, 1.5);
    }

    emitHeal(x, y) {
        for (let i = 0; i < 5; i++) {
            this._spawn(x + this._rand(-5, 5), y, 0, -1, 500, '#40ff40', 2);
        }
        // Cross symbol sparks
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * TAU;
            this._spawn(x, y, Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 400, '#80ff80', 1.5, { gravity: -0.02 });
        }
    }

    emitManaSteal(x, y) {
        for (let i = 0; i < 4; i++) {
            this._spawn(x + this._rand(-5, 5), y, 0, -1, 500, '#4080ff', 1.5, { shape: 'glow' });
        }
    }

    emitPoisonCloud(x, y, radius = 30) {
        for (let i = 0; i < 6; i++) {
            this._spawn(
                x + this._rand(-radius, radius), y + this._rand(-radius / 2, radius / 2),
                this._rand(-0.2, 0.2), -0.2,
                800, '#40c040', this._rand(3, 6),
                { gravity: -0.01, shape: 'glow' }
            );
        }
    }

    emitShadow(x, y) {
        for (let i = 0; i < 6; i++) {
            this._spawn(
                x + this._rand(-15, 15), y + this._rand(-15, 15),
                this._rand(-0.5, 0.5), this._rand(-0.5, 0.5),
                400, '#6020a0', this._rand(2, 5),
                { shape: 'glow' }
            );
        }
    }

    emitHolyBurst(x, y) {
        this.emitBurst(x, y, '#ffe880', 10, 2, { shape: 'star' });
        // Expanding halo ring
        this._spawn(x, y, 0, 0, 400, '#ffffc0', 30, { shape: 'ring', gravity: 0 });
    }

    emitHolyNova(x, y, radius = 80) {
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * TAU;
            this._spawn(x, y, Math.cos(angle) * 3, Math.sin(angle) * 3, 600, '#ffe880', 2, { shape: 'star', gravity: 0 });
        }
        for (let r = 1; r <= 3; r++) {
            this._spawn(x, y, 0, 0, 200 * r, '#ffffff', radius * (r / 3), { shape: 'ring', gravity: 0 });
        }
    }

    emitBossAura(x, y, color = '#f0f') {
        this._spawn(
            x + this._rand(-15, 15), y + this._rand(-5, 5),
            0, -0.5,
            1000, color, 4,
            { gravity: -0.02, shape: 'glow' }
        );
    }

    emitLootBeam(x, y, color = '#ffd700') {
        for (let i = 0; i < 2; i++) {
            this._spawn(
                x + this._rand(-5, 5), y,
                0, this._rand(-1.2, -0.4),
                this._rand(800, 1200), color, this._rand(1.5, 3),
                { gravity: -0.01 }
            );
        }
    }

    emitLevelUp(x, y) {
        // Golden nova ring
        for (let i = 0; i < 60; i++) {
            const angle = (i / 60) * TAU;
            const speed = this._rand(2.5, 4);
            this._spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 1200, '#ffd700', this._rand(3, 5), { gravity: 0 });
        }
        // Stars
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * TAU;
            const speed = this._rand(2, 5);
            this._spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 1000, '#ffffc0', this._rand(3, 6), { shape: 'star', gravity: -0.02, rotationSpeed: this._rand(-0.1, 0.1) });
        }
        // White sparks
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * TAU;
            this._spawn(x, y, Math.cos(angle) * 4, Math.sin(angle) * 4, 800, '#ffffff', 2, { shape: 'spark' });
        }
        // Expanding rings
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.emitShockwave(x, y, 60 + i * 20, '#ffffff'), i * 200);
        }
    }

    // ── Portal Effect (NEW) ─────────────────────────────────────────────────────
    emitPortal(x, y, color = '#8040ff') {
        const secondColor = '#ff40ff';
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * TAU;
            const radius = this._rand(10, 30);
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            this._spawn(px, py, Math.cos(angle + Math.PI / 2) * 1.5, Math.sin(angle + Math.PI / 2) * 1.5,
                600, i % 2 === 0 ? color : secondColor, this._rand(2, 5), { shape: 'glow', gravity: 0 });
        }
        // Center swirl
        this._spawn(x, y, 0, 0, 400, color, 20, { shape: 'ring', gravity: 0 });
    }

    // ── Buff / Debuff Effects (NEW) ─────────────────────────────────────────────
    emitBuff(x, y, color = '#00ff88') {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * TAU;
            const radius = 20;
            this._spawn(
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius,
                Math.cos(angle) * 0.5, -1.5,
                700, color, this._rand(2, 4),
                { shape: 'star', gravity: -0.03, rotationSpeed: this._rand(-0.05, 0.05) }
            );
        }
    }

    emitDebuff(x, y, color = '#ff4444') {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * TAU;
            const radius = 20;
            this._spawn(
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius,
                Math.cos(angle) * 0.5, 0.8,
                700, color, this._rand(2, 4),
                { shape: 'spark', gravity: 0.05 }
            );
        }
    }

    // ── Explosion (NEW, más épico) ──────────────────────────────────────────────
    emitExplosion(x, y, color = '#ff6600', radius = 60) {
        // Core flash
        this._spawn(x, y, 0, 0, 150, '#ffffff', radius * 0.6, { shape: 'glow', gravity: 0 });
        // Fireball burst
        this.emitBurst(x, y, color, 40, 5, { gravity: 0.08 });
        this.emitBurst(x, y, '#ffcc00', 20, 3, { gravity: 0.05 });
        // Debris
        this.emitDebris(x, y, '#555', 16);
        // Shockwave rings
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.emitShockwave(x, y, radius * (i + 1) * 0.4, '#ff8800'), i * 80);
        }
        // Screen shake
        this.shake(300, 6);
    }

    // ── Weather ─────────────────────────────────────────────────────────────────

    emitRain(width, height) {
        for (let i = 0; i < 3; i++) {
            this._spawn(
                Math.random() * width, -20,
                1, this._rand(15, 20),
                1200, 'rgba(100, 150, 255, 0.4)', 1,
                { shape: 'line', length: 15, rotation: Math.PI / 2 }
            );
        }
    }

    emitSnow(width, height) {
        if (Math.random() < 0.3) {
            this._spawn(
                Math.random() * width, -20,
                this._rand(-0.5, 0.5), this._rand(1, 3),
                8000, '#fff', this._rand(1, 3),
                { shape: 'snowflake', rotationSpeed: this._rand(-0.025, 0.025) }
            );
        }
    }

    emitBlizzard(width, height) {
        for (let i = 0; i < 4; i++) {
            this._spawn(
                Math.random() * (width + 200) - 100, -20,
                this._rand(3, 8), this._rand(2, 5),
                6000, '#fff', this._rand(1, 3),
                { shape: 'snowflake', rotationSpeed: this._rand(-0.05, 0.05) }
            );
        }
        if (Math.random() < 0.2) {
            this._spawn(
                Math.random() * width, Math.random() * height,
                this._rand(2, 4), this._rand(-0.25, 0.25),
                4000, 'rgba(230, 245, 255, 0.1)', this._rand(30, 70),
                { shape: 'glow' }
            );
        }
    }

    emitSand(width, height) {
        for (let i = 0; i < 2; i++) {
            this._spawn(
                -20, Math.random() * height,
                this._rand(4, 8), this._rand(-0.25, 0.25),
                4000, 'rgba(212, 160, 23, 0.2)', this._rand(1, 3)
            );
        }
    }

    emitEmbers(width, height) {
        if (Math.random() < 0.2) {
            this._spawn(
                Math.random() * width, height + 20,
                this._rand(-0.5, 0.5), this._rand(-2.5, -1),
                3000, '#ff4500', 1.5,
                { gravity: -0.01, shape: 'glow' }
            );
        }
    }

    emitMist(width, height) {
        if (Math.random() < 0.1) {
            this._spawn(
                Math.random() * width, Math.random() * height,
                this._rand(-0.1, 0.1), this._rand(-0.1, 0.1),
                5000, 'rgba(200, 200, 200, 0.05)', this._rand(40, 80),
                { shape: 'glow' }
            );
        }
    }

    // ── Update / Render ─────────────────────────────────────────────────────────

    update(dt) {
        this._pool.update(dt);
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            if (!this.floatingTexts[i].update(dt)) this.floatingTexts.splice(i, 1);
        }
        if (this.shakeTimer > 0) this.shakeTimer -= dt;
    }

    render(ctx) {
        ctx.save();
        if (this.shakeTimer > 0) {
            ctx.translate(
                this._rand(-this.shakeIntensity, this.shakeIntensity),
                this._rand(-this.shakeIntensity, this.shakeIntensity)
            );
        }
        this._pool.render(ctx);
        for (const t of this.floatingTexts) t.render(ctx);
        ctx.restore();
    }

    renderScreen(ctx, camera) {
        ctx.save();
        if (this.shakeTimer > 0) {
            ctx.translate(
                this._rand(-this.shakeIntensity, this.shakeIntensity),
                this._rand(-this.shakeIntensity, this.shakeIntensity)
            );
        }
        this._pool.renderWithCamera(ctx, camera);
        for (const t of this.floatingTexts) t.render(ctx, camera);
        ctx.restore();
    }
}

export const fx = new ParticleSystem();