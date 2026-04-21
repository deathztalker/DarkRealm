import { bus } from '../engine/EventBus.js';
import { calcDamage, applyDamage, DMG_TYPE } from '../systems/combat.js';
import { Projectile } from './projectile.js';
import { fx } from '../engine/ParticleSystem.js';
import { Pathfinder } from '../world/pathfinding.js';

const pathfinder = new Pathfinder();

/**
 * Mercenary Entity — Companions that follow and fight for the player.
 * Supports equipment (Helm, Armor, Weapon) and persists between sessions.
 */
export class Mercenary {
    constructor(data) {
        this.name = data.name || 'Mercenary';
        this.className = data.className || 'Rogue'; // Rogue, Desert Warrior, Iron Wolf
        this.level = data.level || 1;
        this.icon = (this.className === 'Rogue') ? 'class_ranger' : (data.icon || 'class_rogue');
        
        this.x = data.x || 0;
        this.y = data.y || 0;
        
        this.xp = data.xp || 0;
        this.xpToNextLevel = this._calcXpReq(this.level);
        
        this.maxHp = 100; // Base, will be recalced
        this.hp = data.hp || 100;
        this.dmg = 10;
        
        this.animState = 'idle';
        this.facingDir = 'south';
        this.path = [];
        this.target = null;
        
        this.isMercenary = true;
        this.isPlayer = true; // For faction targeting
        this.equipment = data.equipment || {
            head: null,
            chest: null,
            mainhand: null,
            offhand: null
        };
        
        this._atkCd = 0;
        this._auraTimer = 0;
        this.atkSpeed = 1.2;
        
        this.resists = { fire: 0, cold: 0, light: 0, pois: 0 };
        this._buffs = [];
        this._recalcStats();
    }

    _calcXpReq(lvl) {
        return Math.floor(100 * Math.pow(lvl, 1.8));
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNextLevel) {
            this.level++;
            this.xp -= this.xpToNextLevel;
            this.xpToNextLevel = this._calcXpReq(this.level);
            this._recalcStats();
            this.hp = this.maxHp;
            fx.emitBurst(this.x, this.y, '#ffd700', 30, 3);
            bus.emit('combat:log', { text: `${this.name} has reached level ${this.level}!`, type: 'log-level' });
        }
    }

    serialize() {
        return {
            name: this.name,
            className: this.className,
            level: this.level,
            xp: this.xp,
            icon: this.icon,
            maxHp: this.maxHp,
            hp: this.hp,
            dmg: this.dmg,
            equipment: this.equipment,
            buffs: this._buffs
        };
    }

    static deserialize(data) {
        if (!data) return null;
        const m = new Mercenary(data);
        if (data.buffs) m._buffs = data.buffs;
        return m;
    }

    _recalcStats() {
        // Base stats from level
        this.maxHp = 100 + this.level * 20;
        this.baseDmg = 10 + this.level * 3;
        this.armor = this.level * 5;
        
        const s = {
            allRes: this.level * 1.5,
            fireRes: 0, coldRes: 0, lightRes: 0, poisRes: 0, shadowRes: 0,
            pctIAS: 0, pctDmg: 0, lifeStealPct: 0, manaStealPct: 0,
            flatHP: 0, flatArmor: 0, pctArmor: 0,
            allSkills: 0, classSkills: 0
        };

        // Skill Mapping per Mercenary type
        const skillRegistry = {
            'Rogue': { id: 'inner_sight', name: 'Inner Sight', group: 'shadow' },
            'Desert Warrior': { id: 'jab', name: 'Jab', group: 'melee' },
            'Iron Wolf': { id: 'elemental_bolt', name: 'Elemental Bolt', group: 'magic' }
        };
        this.mainSkill = skillRegistry[this.className] || { id: 'attack', name: 'Attack', group: 'melee' };

        // Buffs
        for (const b of this._buffs) {
            if (b.id === 'shrine_armor') s.pctArmor += b.value;
            if (b.id === 'shrine_damage') s.pctDmg += b.value;
            if (b.id === 'shrine_resist') s.allRes += b.value;
            if (b.id === 'shrine_speed') s.pctMoveSpeed = (s.pctMoveSpeed||0) + b.value;
        }
        
        // Add gear stats
        for (const item of Object.values(this.equipment)) {
            if (!item) continue;
            
            // Base item stats
            if (item.armor) s.flatArmor += item.armor;
            if (item.minDmg) this.baseDmg += (item.minDmg + item.maxDmg) / 2;
            
            // Mods
            if (item.mods) {
                for (const mod of item.mods) {
                    if (mod.stat === 'allSkills' || mod.stat === '+allSkills') s.allSkills += mod.value;
                    else if (mod.stat === 'classSkills') s.classSkills += mod.value;
                    else if (s[mod.stat] !== undefined) s[mod.stat] += mod.value;
                    else if (mod.stat === 'allRes') s.allRes += mod.value;
                }
            }

            // Sockets
            if (item.socketed) {
                const itemClass = (item.slot === 'mainhand' || item.slot === 'offhand') ? item.slot : 'armor';
                for (const gem of item.socketed) {
                    if (gem && gem.socketEffect && gem.socketEffect[itemClass]) {
                        const eff = gem.socketEffect[itemClass];
                        if (eff.stat === 'allSkills' || eff.stat === '+allSkills') s.allSkills += eff.value;
                        else if (s[eff.stat] !== undefined) s[eff.stat] += eff.value;
                        else if (eff.stat === 'allRes') s.allRes += eff.value;
                    }
                }
            }
        }

        // Final totals
        this.allSkillBonus = s.allSkills + s.classSkills;
        this.effectiveSkillLevel = Math.floor(this.level / 2) + this.allSkillBonus;

        this.maxHp = Math.round((this.maxHp + s.flatHP) * (1 + (s.pctHP || 0) / 100));
        this.armor = Math.round((this.armor + s.flatArmor) * (1 + (s.pctArmor || 0) / 100));
        this.baseDmg = Math.round(this.baseDmg * (1 + s.pctDmg / 100));
        this.atkSpeed = 1.2 * (1 + s.pctIAS / 100);
        
        this.resists = {
            fire: Math.min(75, s.allRes + s.fireRes),
            cold: Math.min(75, s.allRes + s.coldRes),
            light: Math.min(75, s.allRes + s.lightRes),
            pois: Math.min(75, s.allRes + s.poisRes)
        };
        
        this.lifeStealPct = s.lifeStealPct;
        this.hp = Math.min(this.hp, this.maxHp);
    }

    update(dt, player, enemies, dungeon) {
        if (this.hp <= 0) {
            this.animState = 'dead';
            return;
        }

        // --- Wave 3 Mastery: Mercenary Auras ---
        this._auraTimer = (this._auraTimer || 0) - dt;
        if (this._auraTimer <= 0) {
            this._auraTimer = 3.0; // Pulse every 3s
            this._applyAura(player);
        }

        // Auto-level with player
        if (player && player.level > this.level) {
            this.level = player.level;
            this._recalcStats();
            this.hp = this.maxHp;
            fx.emitBurst(this.x, this.y, '#ffd700', 20, 2);
            bus.emit('combat:log', { text: `${this.name} has leveled up to ${this.level}!`, type: 'log-level' });
        }

        const mx = player.x - this.x, my = player.y - this.y;
        const md = Math.hypot(mx, my);
        
        // --- LEASHING & FOLLOW LOGIC ---
        if (md > 800) {
            this.x = player.x + (Math.random() - 0.5) * 40;
            this.y = player.y + (Math.random() - 0.5) * 40;
            this.path = [];
            fx.emitBurst(this.x, this.y, '#ffffff', 15, 2);
            return;
        }

        // 1. Target Selection with Line of Sight
        let closestEnemy = null, closestDist = (this.className === 'Rogue') ? 350 : (this.className === 'Iron Wolf' ? 300 : 100);
        if (md < 400) { // Only fight if near player
            for (const e of enemies) {
                if (e.hp <= 0) continue;
                const ed = Math.hypot(e.x - this.x, e.y - this.y);
                if (ed < closestDist) {
                    if (dungeon.hasLineOfSight(this.x, this.y, e.x, e.y)) {
                        closestDist = ed; closestEnemy = e;
                    }
                }
            }
        }
        this.target = closestEnemy;

        // 2. Movement Logic (A* Pathfinding if far or blocked)
        let moved = false;
        const targetX = this.target ? this.target.x : player.x;
        const targetY = this.target ? this.target.y : player.y;
        const tDist = Math.hypot(targetX - this.x, targetY - this.y);
        const stopDist = this.target ? (this.className === 'Desert Warrior' ? 30 : 200) : 60;

        if (tDist > stopDist) {
            // Repath if path empty or randomly to handle dynamic targets
            if (this.path.length === 0 || Math.random() < 0.02) {
                this.path = pathfinder.find(dungeon.grid, this.x, this.y, targetX, targetY, dungeon.tileSize);
            }

            if (this.path.length > 0) {
                const next = this.path[0];
                const adx = next.x - this.x, ady = next.y - this.y;
                const adist = Math.hypot(adx, ady);
                if (adist < 5) {
                    this.path.shift();
                } else {
                    const speed = md > 250 ? 150 : 100;
                    this.x += (adx / adist) * speed * dt;
                    this.y += (ady / adist) * speed * dt;
                    this.facingDir = Math.abs(adx) > Math.abs(ady) ? (adx > 0 ? 'right' : 'left') : (ady > 0 ? 'down' : 'up');
                    moved = true;
                }
            }
        } else {
            this.path = [];
            if (this.target) {
                const ex = this.target.x - this.x, ey = this.target.y - this.y;
                this.facingDir = Math.abs(ex) > Math.abs(ey) ? (ex > 0 ? 'right' : 'left') : (ey > 0 ? 'down' : 'up');
            }
        }

        // 3. Attack Logic
        if (this.target && tDist < (closestDist + 20)) {
            this._atkCd -= dt;
            if (this._atkCd <= 0) {
                this.attack(this.target);
                this._atkCd = 1 / this.atkSpeed;
                this.animState = 'attack';
            } else if (this._atkCd < (1 / this.atkSpeed) * 0.7) {
                this.animState = moved ? 'walk' : 'idle';
            }
        } else {
            this.animState = moved ? 'walk' : 'idle';
        }

        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.008 * dt);
    }

    _applyAura(player) {
        if (this.className !== 'Desert Warrior') return;

        fx.emitShockwave(this.x, this.y, 120, 'rgba(255, 215, 0, 0.3)');
        const dist = Math.sqrt((player.x - this.x)**2 + (player.y - this.y)**2);
        if (dist < 200) {
            // Might Aura: +25% Dmg for 4s
            import('../systems/combat.js').then(c => {
                c.applyStatus(player, 'might', 4, 1.25);
            });
        }
    }

    render(renderer, time) {
        if (this.hp <= 0) return;

        // Shadow circle
        renderer.drawShadow(this.x, this.y + 4, 8, 0.3);

        // Render the 7x16 PixelLab spritesheet with correct animation state
        renderer.drawAnim(this.icon, this.x, this.y - 4, 18, this.animState || 'idle', this.facingDir || 'south', time, null, this.equipment);
        
        // HP bar above head
        const bw = 18;
        renderer.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        renderer.ctx.fillRect(this.x - bw / 2, this.y - 20, bw, 2);
        renderer.ctx.fillStyle = '#4caf50';
        renderer.ctx.fillRect(this.x - bw / 2, this.y - 20, bw * (this.hp / this.maxHp), 2);
        
        // Name tag
        renderer.ctx.font = '5px Cinzel, serif';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillStyle = '#4caf50';
        renderer.ctx.fillText(this.name, this.x, this.y - 23);
    }

    attack(target) {
        const slvl = this.effectiveSkillLevel || 1;
        const dmg = this.baseDmg;
        
        if (this.className === 'Iron Wolf') {
            // Elemental Bolt - High scaling with level
            const spells = [
                { type: 'fire', color: '#ff4000', speed: 250 },
                { type: 'cold', color: '#4080ff', speed: 220 },
                { type: 'lightning', color: '#ffff40', speed: 400 }
            ];
            const s = spells[Math.floor(Math.random() * spells.length)];
            const finalDmg = dmg * (1 + slvl * 0.15);
            const proj = new Projectile(this.x, this.y, target.x, target.y, s.speed, 'ra-circle', finalDmg, s.type, this, false, 15, 0, 0, 'bolt');
            bus.emit('combat:spawnProjectile', { proj });
            fx.emitBurst(this.x, this.y, s.color, 15, 1.5);
            bus.emit('combat:log', { text: `${this.name} casts Elemental Bolt (Lvl ${slvl})`, type: 'log-info' });
        } else if (this.className === 'Desert Warrior') {
            // Jab - Triple strike logic
            bus.emit('combat:log', { text: `${this.name} uses Jab (Lvl ${slvl})`, type: 'log-info' });
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (target && target.hp > 0) {
                        import('../systems/combat.js').then(c => {
                            c.applyDamage(this, target, { dealt: dmg * (0.8 + slvl * 0.05), isCrit: Math.random() < 0.1, type: 'physical' });
                        });
                        fx.emitSlash(this.x, this.y, Math.atan2(target.y - this.y, target.x - this.x), '#cccccc', 30);
                    }
                }, i * 150);
            }
        } else {
            // Rogue Archer - Inner Sight + Guided-style Arrow
            const finalDmg = dmg * (1 + slvl * 0.1);
            const proj = new Projectile(this.x, this.y, target.x, target.y, 400, 'ra-arrow', finalDmg, 'physical', this, false, 8, 0, 0, 'arrow');
            bus.emit('combat:spawnProjectile', { proj });
            if (Math.random() < 0.2) {
                bus.emit('combat:log', { text: `${this.name} uses Inner Sight (Lvl ${slvl})`, type: 'log-info' });
                fx.emitBurst(target.x, target.y, '#ffffff', 20, 2);
                import('../systems/combat.js').then(c => { c.applyStatus(target, 'inner_sight', 10, slvl * 5); });
            }
        }
    }

    serialize() {
        return {
            name: this.name,
            className: this.className,
            level: this.level,
            xp: this.xp,
            hp: this.hp,
            icon: this.icon,
            equipment: this.equipment
        };
    }
}
