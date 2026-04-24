/**
 * Particle System — Premium visual effects for combat
 */

export class Particle {
    constructor(x, y, vx, vy, life, color, size = 2) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.life = life; this.maxLife = life;
        this.color = color; this.size = size;
        this.alpha = 1; this.gravity = 0;
        this.rotation = 0; this.rotationSpeed = 0;
        this.shape = 'circle';
        this.length = 0;
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
            const angle = Math.atan2(this.vy, this.vx);
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - Math.cos(angle) * 5, this.y - Math.sin(angle) * 5);
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
    }

    update(dt) {
        this.y += this.vy * (dt / 16);
        this.vy *= 0.98;
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        return this.life > 0;
    }

    render(ctx, camera = null) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';

        // Choose draw position: Screen space if camera is provided, else World space
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
        ctx.restore();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
    }

    triggerSkillEffect(skillId, x, y, tx, ty) {
        if (!skillId) return;
        
        // Match skill colors and effects (simple version)
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

    /** Generic trail for common projectiles */
    emitTrail(x, y, color) {
        const p = new Particle(x, y, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, 300, color, 1.5);
        this.particles.push(p);
    }

    emitText(x, y, text, color, isCrit = false) {
        this.floatingTexts.push(new FloatingText(x, y, text, color, isCrit));
    }

    emitFireTrail(x, y) {
        const colors = ['#ff6000', '#ff8020', '#ffaa00', '#ff4000'];
        const p = new Particle(x, y, (Math.random() - 0.5) * 1, -(0.5 + Math.random() * 1), 300, colors[Math.floor(Math.random() * colors.length)], 2);
        p.gravity = -0.02;
        this.particles.push(p);
    }

    emitIceTrail(x, y) {
        const p = new Particle(x + (Math.random() - 0.5) * 4, y + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, 400, '#80d0ff', 1 + Math.random());
        p.shape = 'snowflake';
        p.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.particles.push(p);
    }

    emitLightning(x1, y1, x2, y2, segments = 6) {
        let cx = x1, cy = y1;
        const dx = (x2 - x1) / segments, dy = (y2 - y1) / segments;
        for (let i = 0; i < segments; i++) {
            const nx = x1 + dx * (i + 1) + (Math.random() - 0.5) * 12;
            const ny = y1 + dy * (i + 1) + (Math.random() - 0.5) * 12;
            const p = new Particle(cx, cy, 0, 0, 150, '#ffff40', 1.5);
            p.shape = 'line';
            p.rotation = Math.atan2(ny - cy, nx - cx);
            p.length = Math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2);
            this.particles.push(p);
            cx = nx; cy = ny;
        }
        this.emitBurst(x2, y2, '#ffff80', 4, 1.5);
    }

    emitBlood(x, y, angle = 0) {
        for (let i = 0; i < 4; i++) {
            const spread = (Math.random() - 0.5) * 1.2;
            const p = new Particle(x, y, Math.cos(angle + spread) * 2, Math.sin(angle + spread) * 2, 300, '#a00000', 1.5);
            p.gravity = 0.1;
            this.particles.push(p);
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
        
        // Add a secondary spark burst for crit-like feel on some hits
        if (Math.random() < 0.2) {
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const p = new Particle(x, y, Math.cos(angle) * 3, Math.sin(angle) * 3, 400, '#fff', 1.5);
                p.shape = 'spark';
                this.particles.push(p);
            }
        }
    }

    emitSlash(x, y, angle, color = '#cccccc', radius = 20) {
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        const p = new Particle(px, py, 0, 0, 200, color, 2);
        p.shape = 'spark';
        this.particles.push(p);
    }

    emitShockwave(x, y, radius = 40, color = '#b0a080') {
        this.emitBurst(x, y, color, 12, 3);
    }

    emitHolyBurst(x, y) {
        this.emitBurst(x, y, '#ffe880', 10, 2);
    }

    emitHeal(x, y) {
        for (let i = 0; i < 5; i++) {
            const p = new Particle(x + (Math.random() - 0.5) * 10, y, 0, -1, 500, '#40ff40', 2);
            this.particles.push(p);
        }
    }

    emitManaSteal(x, y) {
        for (let i = 0; i < 4; i++) {
            const p = new Particle(x + (Math.random() - 0.5) * 10, y, 0, -1, 500, '#4080ff', 1.5);
            this.particles.push(p);
        }
    }

    emitPoisonCloud(x, y, radius = 30) {
        for (let i = 0; i < 4; i++) {
            const p = new Particle(x + (Math.random() - 0.5) * radius, y + (Math.random() - 0.5) * radius, 0, -0.2, 800, '#40c040', 4);
            p.gravity = -0.01;
            this.particles.push(p);
        }
    }

    emitShadow(x, y) {
        for (let i = 0; i < 4; i++) {
            const p = new Particle(x + (Math.random() - 0.5) * 15, y + (Math.random() - 0.5) * 15, 0, 0, 400, '#6020a0', 3);
            this.particles.push(p);
        }
    }

    emitBossAura(x, y, color = '#f0f') {
        const p = new Particle(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 10, 0, -0.5, 1000, color, 4);
        p.gravity = -0.02;
        this.particles.push(p);
    }

    emitLootBeam(x, y, color = '#ffd700') {
        // Core beam particles (vertical)
        for (let i = 0; i < 2; i++) {
            const p = new Particle(x + (Math.random() - 0.5) * 10, y, 0, -(0.4 + Math.random() * 0.8), 800 + Math.random() * 400, color, 1.5 + Math.random() * 1.5);
            p.gravity = -0.01;
            this.particles.push(p);
        }
    }

    emitLevelUp(x, y) {
        // Golden Nova
        for (let i = 0; i < 60; i++) {
            const angle = (i / 60) * Math.PI * 2;
            const speed = 2.5 + Math.random() * 1.5;
            const p = new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 1200, '#ffd700', 3 + Math.random() * 2);
            p.gravity = 0;
            p.shape = 'circle';
            this.particles.push(p);
        }
        // Expanding shockwave circles
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.emitShockwave(x, y, 60 + i * 20, '#ffffff');
            }, i * 200);
        }
        // Sparks
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const p = new Particle(x, y, Math.cos(angle) * 4, Math.sin(angle) * 4, 800, '#ffffff', 2);
            p.shape = 'spark';
            this.particles.push(p);
        }
    }

    shake(duration, intensity) {
        this.shakeTimer = duration;
        this.shakeIntensity = intensity;
    }

    emitRain(width, height) {
        for (let i = 0; i < 3; i++) {
            const px = Math.random() * width;
            const py = -20;
            const p = new Particle(px, py, 1, 15 + Math.random() * 5, 1200, 'rgba(100, 150, 255, 0.4)', 1);
            p.shape = 'line';
            p.length = 15;
            p.rotation = Math.PI / 2;
            this.particles.push(p);
        }
    }

    emitSnow(width, height) {
        if (Math.random() < 0.3) {
            const px = Math.random() * width;
            const py = -20;
            const p = new Particle(px, py, (Math.random() - 0.5) * 1, 1 + Math.random() * 2, 8000, '#fff', 1 + Math.random() * 2);
            p.shape = 'snowflake';
            p.rotationSpeed = (Math.random() - 0.5) * 0.05;
            this.particles.push(p);
        }
    }

    emitBlizzard(width, height) {
        // High density snow with horizontal wind
        for (let i = 0; i < 4; i++) {
            const px = Math.random() * (width + 200) - 100;
            const py = -20;
            const p = new Particle(px, py, 3 + Math.random() * 5, 2 + Math.random() * 3, 6000, '#fff', 1 + Math.random() * 2);
            p.shape = 'snowflake';
            p.rotationSpeed = (Math.random() - 0.5) * 0.1;
            this.particles.push(p);
        }
        // Swirling frost mist
        if (Math.random() < 0.2) {
            const mx = Math.random() * width;
            const my = Math.random() * height;
            const mist = new Particle(mx, my, 2 + Math.random() * 2, (Math.random() - 0.5) * 0.5, 4000, 'rgba(230, 245, 255, 0.1)', 30 + Math.random() * 40);
            this.particles.push(mist);
        }
    }

    emitSand(width, height) {
        for (let i = 0; i < 2; i++) {
            const px = -20;
            const py = Math.random() * height;
            const p = new Particle(px, py, 4 + Math.random() * 4, (Math.random() - 0.5) * 0.5, 4000, 'rgba(212, 160, 23, 0.2)', 1 + Math.random() * 2);
            this.particles.push(p);
        }
    }

    emitEmbers(width, height) {
        if (Math.random() < 0.2) {
            const px = Math.random() * width;
            const py = height + 20;
            const p = new Particle(px, py, (Math.random() - 0.5) * 1, -(1 + Math.random() * 1.5), 3000, '#ff4500', 1.5);
            p.gravity = -0.01;
            this.particles.push(p);
        }
    }

    emitDebris(x, y, color = '#8a7a60', count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const s = 1 + Math.random() * 3;
            const p = new Particle(x, y, Math.cos(angle) * s, Math.sin(angle) * s, 600, color, 1 + Math.random() * 2);
            p.gravity = 0.15;
            p.rotationSpeed = (Math.random() - 0.5) * 0.2;
            p.shape = 'spark'; // Use spark as splinter
            this.particles.push(p);
        }
    }

    emitMist(width, height) {
        if (Math.random() < 0.1) {
            const px = Math.random() * width;
            const py = Math.random() * height;
            const p = new Particle(px, py, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, 5000, 'rgba(200, 200, 200, 0.05)', 40 + Math.random() * 40);
            this.particles.push(p);
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(dt)) this.particles.splice(i, 1);
        }
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            if (!this.floatingTexts[i].update(dt)) this.floatingTexts.splice(i, 1);
        }
        if (this.shakeTimer > 0) this.shakeTimer -= dt;
    }

    render(ctx) {
        ctx.save();
        if (this.shakeTimer > 0) {
            ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
        }
        for (const p of this.particles) p.render(ctx);
        for (const t of this.floatingTexts) t.render(ctx);
        ctx.restore();
    }

    /** New method to handle screen-space projection (used in main.js for mobile sync) */
    renderScreen(ctx, camera) {
        ctx.save();
        if (this.shakeTimer > 0) {
            ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
        }
        // Particles still rendered in current ctx state
        // (If ctx was already reset to 1,0,0,1, we need to toScreen these too)
        for (const p of this.particles) {
            const screen = camera.toScreen(p.x, p.y);
            // Patch particle to use screen coords temporary for drawing
            const prevX = p.x, prevY = p.y;
            p.x = screen.x; p.y = screen.y;
            p.render(ctx);
            p.x = prevX; p.y = prevY;
        }
        for (const t of this.floatingTexts) t.render(ctx, camera);
        ctx.restore();
    }
}

export const fx = new ParticleSystem();
