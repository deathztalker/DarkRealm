/**
 * Particle System — Optimized visual effects for combat
 */

export class Particle {
    constructor() {
        this.reset(0, 0, 0, 0, 0, '#fff');
    }

    reset(x, y, vx, vy, life, color, size = 2) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.life = life; this.maxLife = life;
        this.color = color; this.size = size;
        this.alpha = 1; this.gravity = 0;
        this.rotation = 0; this.rotationSpeed = 0;
        this.shape = 'circle';
        this.length = 0;
        this.active = true;
        return this;
    }

    update(dt) {
        if (!this.active) return false;
        this.x += this.vx * (dt / 16);
        this.y += this.vy * (dt / 16);
        this.vy += this.gravity * (dt / 16);
        this.rotation += this.rotationSpeed * (dt / 16);
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        if (this.life <= 0) this.active = false;
        return this.active;
    }

    render(ctx, ox = 0, oy = 0) {
        const drawX = this.x + ox;
        const drawY = this.y + oy;

        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;

        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'spark') {
            ctx.lineWidth = this.size * 0.6;
            ctx.beginPath();
            const angle = Math.atan2(this.vy, this.vx);
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(drawX - Math.cos(angle) * 5, drawY - Math.sin(angle) * 5);
            ctx.stroke();
        } else if (this.shape === 'snowflake') {
            ctx.save();
            ctx.translate(drawX, drawY);
            ctx.rotate(this.rotation);
            for (let i = 0; i < 6; i++) {
                ctx.rotate(Math.PI / 3);
                ctx.fillRect(-0.5, 0, 1, this.size);
            }
            ctx.restore();
        } else if (this.shape === 'line') {
            ctx.save();
            ctx.lineWidth = this.size;
            ctx.translate(drawX, drawY);
            ctx.rotate(this.rotation);
            ctx.beginPath();
            ctx.moveTo(-this.length / 2, 0);
            ctx.lineTo(this.length / 2, 0);
            ctx.stroke();
            ctx.restore();
        }
    }
}

export class FloatingText {
    constructor(x, y, text, color, isCrit = false) {
        this.init(x, y, text, color, isCrit);
    }

    init(x, y, text, color, isCrit = false) {
        this.x = x + (Math.random() - 0.5) * 15;
        this.y = y - 10;
        this.text = text;
        this.color = color;
        this.isCrit = isCrit;
        this.life = 1000;
        this.maxLife = 1000;
        this.vy = -0.5 - Math.random() * 0.5;
        this.alpha = 1;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return false;
        this.y += this.vy * (dt / 16);
        this.vy *= 0.98;
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        if (this.life <= 0) this.active = false;
        return this.active;
    }

    render(ctx, camera = null) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';

        let dx = this.x;
        let dy = this.y;
        if (camera) {
            const screen = camera.toScreen(this.x, this.y);
            dx = screen.x;
            dy = screen.y;
        }

        ctx.font = this.isCrit ? 'bold 16px "Cinzel", serif' : '12px "Inter", sans-serif';
        if (this.isCrit) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(this.text, dx, dy);
        }
        ctx.fillText(this.text, dx, dy);
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.pool = [];
        this.floatingTexts = [];
        this.textPool = [];
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.maxParticles = 500;
    }

    getParticle() {
        let p = this.pool.length > 0 ? this.pool.pop() : new Particle();
        this.particles.push(p);
        return p;
    }

    triggerSkillEffect(skillId, x, y, tx, ty) {
        if (!skillId) return;
        if (['fireball', 'meteor', 'fire_nova'].some(k => skillId.includes(k))) {
            this.emitBurst(x, y, '#ff4400', 15, 2.5);
            if (tx) this.emitBurst(tx, ty, '#ff6600', 30, 3.5);
        } else if (['blizzard', 'frozen', 'cold'].some(k => skillId.includes(k))) {
            this.emitBurst(x, y, '#44eeff', 15, 2.5);
            if (tx) this.emitBurst(tx, ty, '#88ffff', 25, 3.0);
        } else if (['lightning', 'thunder', 'holy_shock'].some(k => skillId.includes(k))) {
            this.emitBurst(x, y, '#ffff00', 12, 3.0);
            if (tx) this.emitBurst(tx, ty, '#ffffaa', 20, 4.0);
        } else if (['poison', 'venom', 'pandemic'].some(k => skillId.includes(k))) {
            this.emitPoisonCloud(x, y, 20);
            if (tx) this.emitPoisonCloud(tx, ty, 35);
        } else if (['shadow', 'void', 'dark'].some(k => skillId.includes(k))) {
            this.emitShadow(x, y);
            if (tx) this.emitShadow(tx, ty);
        } else if (['holy', 'divine', 'consecration'].some(k => skillId.includes(k))) {
            this.emitHolyBurst(x, y);
            if (tx) this.emitHolyBurst(tx, ty);
        } else if (['whirlwind', 'bladestorm', 'zeal'].some(k => skillId.includes(k))) {
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) this.emitSlash(x, y, a, '#ccc', 25);
        } else {
            this.emitBurst(x, y, '#ffffff', 10, 2.0);
        }
    }

    emitBurst(x, y, color, count = 10, speed = 2) {
        if (this.particles.length > this.maxParticles) return;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const s = Math.random() * speed;
            const vx = Math.cos(angle) * s;
            const vy = Math.sin(angle) * s;
            const life = 300 + Math.random() * 500;
            const p = this.getParticle().reset(x, y, vx, vy, life, color, 1 + Math.random() * 2);
            p.gravity = 0.05;
        }
    }

    emitTrail(x, y, color) {
        if (this.particles.length > this.maxParticles) return;
        this.getParticle().reset(x, y, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, 300, color, 1.5);
    }

    emitText(x, y, text, color, isCrit = false) {
        let t = this.textPool.length > 0 ? this.textPool.pop() : new FloatingText(x, y, text, color, isCrit);
        t.init(x, y, text, color, isCrit);
        this.floatingTexts.push(t);
    }

    emitFireTrail(x, y) {
        if (this.particles.length > this.maxParticles) return;
        const colors = ['#ff6000', '#ff8020', '#ffaa00', '#ff4000'];
        const p = this.getParticle().reset(x, y, (Math.random() - 0.5) * 1, -(0.5 + Math.random() * 1), 300, colors[Math.floor(Math.random() * colors.length)], 2);
        p.gravity = -0.02;
    }

    emitIceTrail(x, y) {
        if (this.particles.length > this.maxParticles) return;
        const p = this.getParticle().reset(x + (Math.random() - 0.5) * 4, y + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, 400, '#80d0ff', 1 + Math.random());
        p.shape = 'snowflake';
        p.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }

    emitLightning(x1, y1, x2, y2, segments = 6) {
        let cx = x1, cy = y1;
        const dx = (x2 - x1) / segments, dy = (y2 - y1) / segments;
        for (let i = 0; i < segments; i++) {
            const nx = x1 + dx * (i + 1) + (Math.random() - 0.5) * 12;
            const ny = y1 + dy * (i + 1) + (Math.random() - 0.5) * 12;
            const p = this.getParticle().reset(cx, cy, 0, 0, 150, '#ffff40', 1.5);
            p.shape = 'line';
            p.rotation = Math.atan2(ny - cy, nx - cx);
            p.length = Math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2);
            cx = nx; cy = ny;
        }
        this.emitBurst(x2, y2, '#ffff80', 4, 1.5);
    }

    emitBlood(x, y, angle = 0) {
        if (this.particles.length > this.maxParticles) return;
        for (let i = 0; i < 4; i++) {
            const spread = (Math.random() - 0.5) * 1.2;
            const p = this.getParticle().reset(x, y, Math.cos(angle + spread) * 2, Math.sin(angle + spread) * 2, 300, '#a00000', 1.5);
            p.gravity = 0.1;
        }
    }

    emitHitImpact(x, y, type = 'physical') {
        const typeMap = {
            fire: { color: '#ff6000', count: 12, speed: 2.5 },
            cold: { color: '#80d0ff', count: 10, speed: 2.0 },
            lightning: { color: '#ffff40', count: 8, speed: 3.5 },
            poison: { color: '#40c040', count: 10, speed: 1.5 },
            shadow: { color: '#8040c0', count: 12, speed: 2.0 },
            holy: { color: '#ffe880', count: 15, speed: 2.5 },
            earth: { color: '#8a7a60', count: 8, speed: 1.8 },
            physical: { color: '#cccccc', count: 6, speed: 1.5 },
            magic: { color: '#ff80ff', count: 10, speed: 2.2 }
        };
        const config = typeMap[type] || typeMap.physical;
        this.emitBurst(x, y, config.color, config.count, config.speed);
        if (Math.random() < 0.2) {
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                this.getParticle().reset(x, y, Math.cos(angle) * 3, Math.sin(angle) * 3, 400, '#fff', 1.5).shape = 'spark';
            }
        }
    }

    emitSlash(x, y, angle, color = '#cccccc', radius = 20) {
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        this.getParticle().reset(px, py, 0, 0, 200, color, 2).shape = 'spark';
    }

    emitShockwave(x, y, radius = 40, color = '#b0a080') {
        this.emitBurst(x, y, color, 12, 3);
    }

    emitHolyBurst(x, y) {
        this.emitBurst(x, y, '#ffe880', 10, 2);
    }

    emitHeal(x, y) {
        for (let i = 0; i < 5; i++) {
            this.getParticle().reset(x + (Math.random() - 0.5) * 10, y, 0, -1, 500, '#40ff40', 2);
        }
    }

    emitManaSteal(x, y) {
        for (let i = 0; i < 4; i++) {
            this.getParticle().reset(x + (Math.random() - 0.5) * 10, y, 0, -1, 500, '#4080ff', 1.5);
        }
    }

    emitPoisonCloud(x, y, radius = 30) {
        for (let i = 0; i < 4; i++) {
            const p = this.getParticle().reset(x + (Math.random() - 0.5) * radius, y + (Math.random() - 0.5) * radius, 0, -0.2, 800, '#40c040', 4);
            p.gravity = -0.01;
        }
    }

    emitShadow(x, y) {
        for (let i = 0; i < 4; i++) {
            this.getParticle().reset(x + (Math.random() - 0.5) * 15, y + (Math.random() - 0.5) * 15, 0, 0, 400, '#6020a0', 3);
        }
    }

    emitBossAura(x, y, color = '#f0f') {
        const p = this.getParticle().reset(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 10, 0, -0.5, 1000, color, 4);
        p.gravity = -0.02;
    }

    emitLootBeam(x, y, color = '#ffd700') {
        for (let i = 0; i < 2; i++) {
            const p = this.getParticle().reset(x + (Math.random() - 0.5) * 10, y, 0, -(0.4 + Math.random() * 0.8), 800 + Math.random() * 400, color, 1.5 + Math.random() * 1.5);
            p.gravity = -0.01;
        }
    }

    emitLevelUp(x, y) {
        for (let i = 0; i < 60; i++) {
            const angle = (i / 60) * Math.PI * 2;
            const speed = 2.5 + Math.random() * 1.5;
            this.getParticle().reset(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 1200, '#ffd700', 3 + Math.random() * 2);
        }
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.emitShockwave(x, y, 60 + i * 20, '#ffffff'), i * 200);
        }
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.getParticle().reset(x, y, Math.cos(angle) * 4, Math.sin(angle) * 4, 800, '#ffffff', 2).shape = 'spark';
        }
    }

    shake(duration, intensity) {
        this.shakeTimer = duration;
        this.shakeIntensity = intensity;
    }

    emitRain(width, height) {
        for (let i = 0; i < 3; i++) {
            const p = this.getParticle().reset(Math.random() * width, -20, 1, 15 + Math.random() * 5, 1200, 'rgba(100, 150, 255, 0.4)', 1);
            p.shape = 'line'; p.length = 15; p.rotation = Math.PI / 2;
        }
    }

    emitSnow(width, height) {
        if (Math.random() < 0.3) {
            const p = this.getParticle().reset(Math.random() * width, -20, (Math.random() - 0.5) * 1, 1 + Math.random() * 2, 8000, '#fff', 1 + Math.random() * 2);
            p.shape = 'snowflake'; p.rotationSpeed = (Math.random() - 0.5) * 0.05;
        }
    }

    emitBlizzard(width, height) {
        for (let i = 0; i < 4; i++) {
            const p = this.getParticle().reset(Math.random() * (width + 200) - 100, -20, 3 + Math.random() * 5, 2 + Math.random() * 3, 6000, '#fff', 1 + Math.random() * 2);
            p.shape = 'snowflake'; p.rotationSpeed = (Math.random() - 0.5) * 0.1;
        }
        if (Math.random() < 0.2) {
            this.getParticle().reset(Math.random() * width, Math.random() * height, 2 + Math.random() * 2, (Math.random() - 0.5) * 0.5, 4000, 'rgba(230, 245, 255, 0.1)', 30 + Math.random() * 40);
        }
    }

    emitSand(width, height) {
        for (let i = 0; i < 2; i++) {
            this.getParticle().reset(-20, Math.random() * height, 4 + Math.random() * 4, (Math.random() - 0.5) * 0.5, 4000, 'rgba(212, 160, 23, 0.2)', 1 + Math.random() * 2);
        }
    }

    emitEmbers(width, height) {
        if (Math.random() < 0.2) {
            const p = this.getParticle().reset(Math.random() * width, height + 20, (Math.random() - 0.5) * 1, -(1 + Math.random() * 1.5), 3000, '#ff4500', 1.5);
            p.gravity = -0.01;
        }
    }

    emitDebris(x, y, color = '#8a7a60', count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const s = 1 + Math.random() * 3;
            const p = this.getParticle().reset(x, y, Math.cos(angle) * s, Math.sin(angle) * s, 600, color, 1 + Math.random() * 2);
            p.gravity = 0.15; p.rotationSpeed = (Math.random() - 0.5) * 0.2; p.shape = 'spark';
        }
    }

    emitMist(width, height) {
        if (Math.random() < 0.1) {
            this.getParticle().reset(Math.random() * width, Math.random() * height, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, 5000, 'rgba(200, 200, 200, 0.05)', 40 + Math.random() * 40);
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(dt)) {
                this.pool.push(this.particles.splice(i, 1)[0]);
            }
        }
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            if (!this.floatingTexts[i].update(dt)) {
                this.textPool.push(this.floatingTexts.splice(i, 1)[0]);
            }
        }
        if (this.shakeTimer > 0) this.shakeTimer -= dt;
    }

    render(ctx) {
        if (this.particles.length === 0 && this.floatingTexts.length === 0 && this.shakeTimer <= 0) return;
        ctx.save();
        if (this.shakeTimer > 0) ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
        for (const p of this.particles) p.render(ctx);
        for (const t of this.floatingTexts) t.render(ctx);
        ctx.restore();
    }

    renderScreen(ctx, camera) {
        if (this.particles.length === 0 && this.floatingTexts.length === 0 && this.shakeTimer <= 0) return;
        ctx.save();
        if (this.shakeTimer > 0) ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
        const screen = { x: 0, y: 0 };
        for (const p of this.particles) {
            camera.toScreenRef(p.x, p.y, screen);
            p.render(ctx, screen.x - p.x, screen.y - p.y);
        }
        for (const t of this.floatingTexts) t.render(ctx, camera);
        ctx.restore();
    }
}

export const fx = new ParticleSystem();
