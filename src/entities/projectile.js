import { calcDamage, applyDamage, applyStatus, applyDot } from '../systems/combat.js';
import { fx } from '../engine/ParticleSystem.js';

/**
 * Projectile — Ranged spell/attack that travels toward a target.
 * Visual rendering varies by element type.
 */
export class Projectile {
    constructor(x, y, targetX, targetY, speed, sprite, damage, type, owner, piercing = false, radius = 8, aoeRadius = 0, bounces = 0, skillId = '') {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.speed = speed;
        this.sprite = sprite;
        this.damage = damage;
        this.type = type; // fire, cold, lightning, poison, shadow, holy, physical, magic, earth
        this.owner = owner;
        this.piercing = piercing;
        this.radius = radius; // visual size
        this.hitRadius = this._calcHitRadius(radius, type, skillId); // actual collision radius
        this.aoeRadius = aoeRadius;
        this.bounces = bounces;
        this.initialBounces = bounces;
        this.active = true;
        this.hitTargets = new Set();
        this.skillId = skillId;
        this.maxRange = this._calcMaxRange(type, skillId);
        this.age = 0;

        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && speed > 0) {
            this.vx = (dx / dist) * speed;
            this.vy = (dy / dist) * speed;
            this.angle = Math.atan2(dy, dx);
        } else {
            this.vx = 0;
            this.vy = 0;
            this.angle = 0;
        }
    }

    /** Calculate appropriate hit radius based on spell type */
    _calcHitRadius(baseRadius, type, skillId) {
        // Big splashy spells get larger hitboxes
        if (skillId === 'fireball' || skillId === 'chaos_bolt') return 18;
        if (skillId === 'frozen_orb') return 20;
        if (skillId === 'bone_spear' || skillId === 'bone_spirit') return 10;
        if (type === 'lightning') return 14; // Lightning is precise
        if (type === 'fire') return 16;
        if (type === 'cold') return 15;
        if (type === 'poison') return 18; // Poison clouds are wide
        if (type === 'shadow') return 14;
        if (type === 'holy') return 16;
        // Default arrows/physical
        return 12;
    }

    /** Calculate max travel range based on spell type */
    _calcMaxRange(type, skillId) {
        // Arrows and long-range projectiles
        if (skillId.includes('arrow') || skillId.includes('shot') || skillId.includes('strafe')) return 500;
        if (skillId === 'frozen_orb') return 350;
        if (skillId === 'bone_spear') return 450;
        if (type === 'lightning') return 400;
        if (type === 'fire') return 380;
        if (type === 'cold') return 350;
        if (type === 'poison') return 300;
        if (type === 'shadow') return 350;
        if (type === 'holy') return 400;
        return 400; // Default
    }

    update(dt, enemies, player, dungeon, addAoE) {
        if (!this.active) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.age += dt;

        // Emit element-specific trail
        this._emitTrail();

        // Wall collision
        if (dungeon && !dungeon.isWalkable(this.x, this.y)) {
            this._explode(addAoE);
            this._emitImpactVFX(this.x, this.y);
            this.active = false;
            return;
        }

        // Entity collision
        const targets = this.owner.isPlayer ? enemies : [player];
        for (const t of targets) {
            if (t.hp <= 0 || this.hitTargets.has(t) || t.state === 'dead') continue;

            const dx = t.x - this.x;
            const dy = t.y - this.y;
            const distSq = dx * dx + dy * dy;

            // Hitbox check — use calculated hit radius + target size
            const targetRadius = t.isPlayer ? 10 : (t.type === 'boss' ? 18 : t.type === 'elite' ? 12 : 8);
            const combinedRadius = this.hitRadius + targetRadius;

            if (distSq < combinedRadius * combinedRadius) {
                this.hitTargets.add(t);

                const result = calcDamage(this.owner, this.damage, this.type, t);
                applyDamage(this.owner, t, result, this.skillId || 'spell');

                // Visual hit impact at target position
                this._emitImpactVFX(t.x, t.y);

                // Apply elemental states
                this._applyHitEffects(t);

                if (this.bounces > 0) {
                    this.bounces--;
                    let nextT = null, nextDist = Infinity;
                    const bounceTargets = this.owner.isPlayer ? enemies : [player];
                    for (const nt of bounceTargets) {
                        if (nt.hp <= 0 || nt.state === 'dead' || this.hitTargets.has(nt)) continue;
                        const ndSq = (nt.x - t.x) ** 2 + (nt.y - t.y) ** 2;
                        if (ndSq < 200 * 200 && ndSq < nextDist) {
                            nextT = nt; nextDist = ndSq;
                        }
                    }
                    if (nextT) {
                        // Lightning visual between bounce targets
                        if (this.type === 'lightning') {
                            fx.emitLightning(t.x, t.y, nextT.x, nextT.y);
                        }
                        const ndx = nextT.x - this.x;
                        const ndy = nextT.y - this.y;
                        const ndist = Math.sqrt(ndx * ndx + ndy * ndy) || 1;
                        this.vx = (ndx / ndist) * this.speed;
                        this.vy = (ndy / ndist) * this.speed;
                        this.angle = Math.atan2(ndy, ndx);
                        return;
                    }
                }

                if (!this.piercing) {
                    this._explode(addAoE);
                    this.active = false;
                    return;
                }
            }
        }

        // Range limit
        const traveledSq = (this.x - this.startX) ** 2 + (this.y - this.startY) ** 2;
        if (traveledSq > this.maxRange * this.maxRange) {
            this._explode(addAoE);
            this.active = false;
        }
    }

    _emitTrail() {
        switch (this.type) {
            case 'fire':
                fx.emitFireTrail(this.x, this.y);
                break;
            case 'cold':
                fx.emitIceTrail(this.x, this.y);
                break;
            case 'lightning':
                if (Math.random() < 0.3) {
                    fx.emitTrail(this.x + (Math.random() - 0.5) * 6, this.y + (Math.random() - 0.5) * 6, '#ffff40');
                }
                break;
            case 'poison':
                if (Math.random() < 0.5) fx.emitTrail(this.x, this.y, '#40ff40');
                break;
            case 'shadow':
                if (Math.random() < 0.5) fx.emitTrail(this.x, this.y, '#8040c0');
                break;
            case 'holy':
                fx.emitTrail(this.x, this.y, '#ffe880');
                break;
            case 'earth':
                if (Math.random() < 0.3) fx.emitTrail(this.x, this.y, '#8a7a60');
                break;
            default:
                fx.emitTrail(this.x, this.y, '#cccccc');
        }
    }

    _emitImpactVFX(x, y) {
        fx.emitHitImpact(x, y, this.type);
        if (this.aoeRadius > 0) {
            fx.shake(150, 3);
        }
    }

    _applyHitEffects(target) {
        if (this.type === 'cold') {
            applyStatus(target, 'chill', 2, 40);
        } else if (this.type === 'fire') {
            applyDot(target, this.damage * 0.2, 'fire', 3, this.owner);
        } else if (this.type === 'lightning') {
            if (Math.random() < 0.15) applyStatus(target, 'stun', 0.5);
        } else if (this.type === 'poison') {
            applyDot(target, this.damage * 0.15, 'poison', 5, this.owner);
        }
    }

    _explode(addAoE) {
        if (this.aoeRadius > 0 && addAoE) {
            addAoE(new AoEZone(this.x, this.y, this.aoeRadius, 0.3, this.damage, this.type, this.owner, 1, this.skillId));
        }
    }

    render(renderer, time) {
        if (!this.active) return;
        const ctx = renderer.ctx;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        switch (this.type) {
            case 'fire':
                this._renderFire(ctx);
                break;
            case 'cold':
                this._renderCold(ctx);
                break;
            case 'lightning':
                this._renderLightning(ctx, time);
                break;
            case 'poison':
                this._renderPoison(ctx);
                break;
            case 'shadow':
                this._renderShadow(ctx);
                break;
            case 'holy':
                this._renderHoly(ctx);
                break;
            case 'earth':
                this._renderEarth(ctx);
                break;
            default:
                this._renderPhysical(ctx);
        }

        ctx.restore();
    }

    _renderFire(ctx) {
        // Fireball: elongated flame shape
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 3);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.2, '#ffcc00');
        g.addColorStop(0.5, '#ff6000');
        g.addColorStop(0.8, '#cc3000');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 2.5, this.radius * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(2, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderCold(ctx) {
        // Ice bolt: crystalline blue
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 2.5);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.3, '#b0e8ff');
        g.addColorStop(0.6, '#40a0ff');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 2, this.radius * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Crystal sparkles
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 3; i++) {
            const sx = (Math.random() - 0.5) * this.radius * 2;
            const sy = (Math.random() - 0.5) * this.radius;
            ctx.fillRect(sx - 0.5, sy - 0.5, 1, 1);
        }
    }

    _renderLightning(ctx, time) {
        // Lightning bolt: jagged bright line
        ctx.strokeStyle = '#ffff40';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(-this.radius * 2, 0);
        for (let i = 0; i < 4; i++) {
            const px = -this.radius * 2 + (i + 1) * (this.radius);
            const py = (Math.random() - 0.5) * 6;
            ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        // Bright core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderPoison(ctx) {
        // Poison glob: green bubbly
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 2);
        g.addColorStop(0, '#80ff80');
        g.addColorStop(0.4, '#40c040');
        g.addColorStop(0.8, '#208020');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        // Bubbles
        ctx.fillStyle = '#a0ffa0';
        ctx.beginPath();
        ctx.arc(-2, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderShadow(ctx) {
        // Dark magic: purple swirl
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 2.5);
        g.addColorStop(0, '#c080ff');
        g.addColorStop(0.3, '#8040c0');
        g.addColorStop(0.7, '#401080');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderHoly(ctx) {
        // Holy bolt: golden radiance
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 2.5);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.2, '#ffe880');
        g.addColorStop(0.5, '#ffd040');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        // Cross shape in center
        ctx.fillStyle = '#fff';
        ctx.fillRect(-0.5, -4, 1, 8);
        ctx.fillRect(-4, -0.5, 8, 1);
    }

    _renderEarth(ctx) {
        // Earth/rock projectile: brown chunky
        ctx.fillStyle = '#8a6a40';
        ctx.beginPath();
        ctx.moveTo(-this.radius, 0);
        ctx.lineTo(-this.radius * 0.5, -this.radius * 0.8);
        ctx.lineTo(this.radius * 0.5, -this.radius * 0.6);
        ctx.lineTo(this.radius, 0);
        ctx.lineTo(this.radius * 0.5, this.radius * 0.7);
        ctx.lineTo(-this.radius * 0.3, this.radius * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#6a4a20';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    _renderPhysical(ctx) {
        // Arrow/physical: sleek white streak
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-this.radius * 2, 0);
        ctx.lineTo(this.radius, 0);
        ctx.stroke();
        // Arrowhead
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(this.radius + 3, 0);
        ctx.lineTo(this.radius - 2, -2);
        ctx.lineTo(this.radius - 2, 2);
        ctx.closePath();
        ctx.fill();
    }
}

// AoEZone uses fx imported at the top of the file

/**
 * AoEZone — Area of Effect damage zone with element-specific visuals.
 */
export class AoEZone {
    constructor(x, y, radius, duration, damage, type, owner, tickRate = 0.5, skillId = '') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.duration = duration;
        this.damage = damage;
        this.type = type;
        this.owner = owner;
        this.tickRate = tickRate;
        this.skillId = skillId;

        this.age = 0;
        this.nextTick = 0;
        this.active = true;
    }

    update(dt, enemies, player) {
        if (!this.active) return;
        this.age += dt;

        if (this.age >= this.duration) {
            this.active = false;
            return;
        }

        if (this.age >= this.nextTick) {
            this.nextTick += this.tickRate;
            const targets = this.owner.isPlayer ? enemies : [player];
            for (const t of targets) {
                if (t.hp <= 0 || t.state === 'dead') continue;
                const distSq = (t.x - this.x) ** 2 + (t.y - this.y) ** 2;
                if (distSq <= this.radius * this.radius) {
                    const result = calcDamage(this.owner, this.damage, this.type, t);
                    applyDamage(this.owner, t, result, this.skillId || 'aoe');
                    // Impact VFX on hit
                    fx.emitHitImpact(t.x, t.y, this.type);
                }
            }

            // Emit ambient particles during zone lifetime
            this._emitAmbientFX();
        }
    }

    _emitAmbientFX() {
        const count = Math.min(6, Math.floor(this.radius / 15));
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * this.radius;
            const px = this.x + Math.cos(a) * r;
            const py = this.y + Math.sin(a) * r;

            switch (this.type) {
                case 'fire':
                    fx.emitFireTrail(px, py);
                    break;
                case 'cold':
                    fx.emitIceTrail(px, py);
                    break;
                case 'lightning':
                    fx.emitTrail(px, py, '#ffff40');
                    break;
                case 'poison':
                    fx.emitTrail(px, py, '#40ff40');
                    break;
                case 'physical':
                    fx.emitTrail(px, py, '#b0a080');
                    break;
                default:
                    fx.emitTrail(px, py, '#ffffff');
            }
        }
    }

    render(renderer, time) {
        if (!this.active) return;
        const ctx = renderer.ctx;
        ctx.save();

        const progress = this.age / this.duration;
        const pulse = Math.sin(time / 100) * 0.1 + 0.9;
        const fadeAlpha = 0.4 * (1 - progress);
        ctx.globalAlpha = fadeAlpha;

        switch (this.type) {
            case 'fire':
                this._renderFireZone(ctx, pulse);
                break;
            case 'cold':
                this._renderColdZone(ctx, pulse);
                break;
            case 'lightning':
                this._renderLightningZone(ctx, pulse, time);
                break;
            case 'poison':
                this._renderPoisonZone(ctx, pulse);
                break;
            case 'physical':
                this._renderPhysicalZone(ctx, pulse);
                break;
            case 'holy':
                this._renderHolyZone(ctx, pulse);
                break;
            default:
                this._renderDefaultZone(ctx, pulse);
        }

        ctx.restore();
    }

    _renderFireZone(ctx, pulse) {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * pulse);
        g.addColorStop(0, 'rgba(255,150,0,0.6)');
        g.addColorStop(0.4, 'rgba(255,80,0,0.4)');
        g.addColorStop(0.8, 'rgba(200,30,0,0.2)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderColdZone(ctx, pulse) {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * pulse);
        g.addColorStop(0, 'rgba(180,220,255,0.5)');
        g.addColorStop(0.5, 'rgba(60,140,255,0.3)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderLightningZone(ctx, pulse, time) {
        ctx.strokeStyle = 'rgba(255,255,80,0.6)';
        ctx.lineWidth = 1.5;
        // Random arcs within zone
        for (let i = 0; i < 3; i++) {
            const a1 = Math.random() * Math.PI * 2;
            const a2 = a1 + (Math.random() - 0.5) * 2;
            const r1 = Math.random() * this.radius * 0.8;
            const r2 = Math.random() * this.radius * 0.8;
            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(a1) * r1, this.y + Math.sin(a1) * r1);
            ctx.lineTo(this.x + Math.cos(a2) * r2, this.y + Math.sin(a2) * r2);
            ctx.stroke();
        }
        // Outer ring
        ctx.globalAlpha *= 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.stroke();
    }

    _renderPoisonZone(ctx, pulse) {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * pulse);
        g.addColorStop(0, 'rgba(0,200,0,0.4)');
        g.addColorStop(0.6, 'rgba(0,120,0,0.2)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderPhysicalZone(ctx, pulse) {
        // Ground slam / whirlwind: dust ring
        ctx.strokeStyle = 'rgba(180,160,120,0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.stroke();
        // Inner impact
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 0.5);
        g.addColorStop(0, 'rgba(180,160,120,0.3)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderHolyZone(ctx, pulse) {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * pulse);
        g.addColorStop(0, 'rgba(255,240,160,0.5)');
        g.addColorStop(0.5, 'rgba(255,220,60,0.3)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderDefaultZone(ctx, pulse) {
        ctx.fillStyle = 'rgba(200,160,255,0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
    }
}
