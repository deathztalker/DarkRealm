import { calcDamage, applyDamage, applyStatus, applyDot } from '../systems/combat.js';
import { fx } from '../engine/ParticleSystem.js';

export class Projectile {
    constructor(x, y, targetX, targetY, speed, sprite, damage, type, owner, piercing = false, radius = 10, aoeRadius = 0, bounces = 0) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.speed = speed;
        this.sprite = sprite; // color or image string
        this.damage = damage;
        this.type = type; // e.g. 'fire', 'cold'
        this.owner = owner;
        this.piercing = piercing;
        this.radius = radius; // collision hit radius
        this.aoeRadius = aoeRadius; // explosion radius on hit
        this.bounces = bounces;
        this.initialBounces = bounces;
        this.active = true;
        this.hitTargets = new Set();

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

    update(dt, enemies, player, dungeon, addAoE) {
        if (!this.active) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Emit trail
        const color = this.type === 'fire' ? '#ff6000' : this.type === 'cold' ? '#00ccff' : this.type === 'lightning' ? '#ffff00' : '#ffffff';
        fx.emitTrail(this.x, this.y, color);

        // Wall collision
        if (dungeon && !dungeon.isWalkable(this.x, this.y)) {
            this._explode(addAoE);
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

            // Hitbox check
            if (distSq < (this.radius + 15) * (this.radius + 15)) {
                this.hitTargets.add(t);

                const result = calcDamage(this.owner, this.damage, this.type, t);
                applyDamage(this.owner, t, result, 'spell');

                // Apply elemental states
                this._applyHitEffects(t);

                if (this.bounces > 0) {
                    this.bounces--;
                    // Find new target for bounce
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
                        const ndx = nextT.x - this.x;
                        const ndy = nextT.y - this.y;
                        const ndist = Math.sqrt(ndx * ndx + ndy * ndy) || 1;
                        this.vx = (ndx / ndist) * this.speed;
                        this.vy = (ndy / ndist) * this.speed;
                        this.angle = Math.atan2(ndy, ndx);
                        return; // Continue flying towards new target
                    }
                }

                if (!this.piercing) {
                    this._explode(addAoE);
                    this.active = false;
                    return;
                }
            }
        }

        // Range limit max distance ~400px
        const traveledSq = (this.x - this.startX) ** 2 + (this.y - this.startY) ** 2;
        if (traveledSq > 160000) {
            this._explode(addAoE);
            this.active = false;
        }
    }

    _applyHitEffects(target) {
        if (this.type === 'cold') {
            applyStatus(target, 'chill', 2, 40); // 40% slow for 2s
        } else if (this.type === 'fire') {
            applyDot(target, this.damage * 0.2, 'fire', 3, this.owner); // 20% dmg/s for 3s
        } else if (this.type === 'lightning') {
            if (Math.random() < 0.15) applyStatus(target, 'stun', 0.5); // 15% stun chance
        }
    }

    _explode(addAoE) {
        if (this.aoeRadius > 0 && addAoE) {
            addAoE(new AoEZone(this.x, this.y, this.aoeRadius, 0.1, this.damage, this.type, this.owner, 1));
        }
    }

    render(renderer, time) {
        if (!this.active) return;
        const ctx = renderer.ctx;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 2);
        const color = this.type === 'fire' ? '#ff6000' : this.type === 'cold' ? '#00ccff' : this.type === 'lightning' ? '#ffff00' : '#ffffff';
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class AoEZone {
    constructor(x, y, radius, duration, damage, type, owner, tickRate = 0.5) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.duration = duration;
        this.damage = damage;
        this.type = type;
        this.owner = owner;
        this.tickRate = tickRate;

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
            // Apply damage in radius
            const targets = this.owner.isPlayer ? enemies : [player];
            for (const t of targets) {
                if (t.hp <= 0 || t.state === 'dead') continue;
                const distSq = (t.x - this.x) ** 2 + (t.y - this.y) ** 2;
                if (distSq <= this.radius * this.radius) {
                    const result = calcDamage(this.owner, this.damage, this.type, t);
                    applyDamage(this.owner, t, result, 'aoe');
                }
            }
        }
    }

    render(renderer, time) {
        if (!this.active) return;
        const ctx = renderer.ctx;
        ctx.save();

        // Simple pulsing circle logic
        const pulse = Math.sin(time / 100) * 0.1 + 0.9;
        ctx.globalAlpha = 0.3 * (1 - this.age / this.duration); // Fade out

        ctx.fillStyle = this.type === 'fire' ? '#ff4000' : this.type === 'cold' ? '#4080ff' : '#a020f0';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
