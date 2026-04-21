import { bus } from '../engine/EventBus.js';
import { calcDamage, applyDamage, DMG_TYPE, applyStatus } from '../systems/combat.js';
import { Projectile } from './projectile.js';
import { fx } from '../engine/ParticleSystem.js';
import { Pathfinder } from '../world/pathfinding.js';

const pathfinder = new Pathfinder();

/**
 * Mercenary Entity — Intelligent companions with skill trees, autonomous AI and cloud persistence.
 */
export class Mercenary {
    constructor(data) {
        this.name = data.name || 'Mercenary';
        this.className = data.className || 'Rogue'; // Rogue, Desert Warrior, Iron Wolf, Barbarian
        this.level = data.level || 1;
        
        const iconMap = {
            'Rogue': 'class_ranger',
            'Desert Warrior': 'class_paladin',
            'Iron Wolf': 'class_sorceress',
            'Barbarian': 'class_warrior'
        };
        this.icon = iconMap[this.className] || 'class_rogue';
        
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.xp = data.xp || 0;
        this.xpToNextLevel = this._calcXpReq(this.level);
        
        this.maxHp = 100;
        this.hp = data.hp || 100;
        this.baseDmg = 10;
        
        this.animState = 'idle';
        this.facingDir = 'south';
        this.path = [];
        this.target = null;
        
        this.isMercenary = true;
        this.isPlayer = true; // Friendly faction
        
        this.equipment = data.equipment || { head: null, chest: null, mainhand: null, offhand: null };
        this.points = data.points || {};
        this.unspentPoints = data.unspentPoints || 0;
        
        this._atkCd = 0;
        this._buffCd = 0;
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
            if (this.level % 2 === 0) this.unspentPoints++;
            this._recalcStats();
            this.hp = this.maxHp;
            fx.emitBurst(this.x, this.y, '#ffd700', 30, 3);
            bus.emit('combat:log', { text: `${this.name} reached level ${this.level}!`, type: 'log-level' });
        }
    }

    _recalcStats() {
        const hpGrowth = (this.className === 'Barbarian') ? 30 : (this.className === 'Desert Warrior' ? 22 : 18);
        this.maxHp = 120 + this.level * hpGrowth;
        this.baseDmg = 12 + this.level * (this.className === 'Barbarian' ? 5 : 3.5);
        this.armor = this.level * 6;
        
        const s = {
            allRes: this.level * 1.8,
            pctDmg: 0, pctIAS: 0, flatHP: 0, flatArmor: 0, pctArmor: 0, allSkills: 0,
            crushingBlow: 0, deadlyStrike: 0, openWounds: 0
        };

        for (const item of Object.values(this.equipment)) {
            if (!item) continue;
            if (item.armor) s.flatArmor += item.armor;
            if (item.minDmg) this.baseDmg += (item.minDmg + item.maxDmg) / 2;
            if (item.mods) {
                for (const mod of item.mods) {
                    if (mod.stat === 'allSkills' || mod.stat === '+allSkills') s.allSkills += mod.value;
                    else if (s[mod.stat] !== undefined) s[mod.stat] += mod.value;
                    else if (mod.stat === 'allRes') s.allRes += mod.value;
                }
            }
        }

        this.allSkillBonus = s.allSkills;
        this.totalDmg = Math.round(this.baseDmg * (1 + s.pctDmg / 100));
        this.atkSpeed = 1.2 * (1 + s.pctIAS / 100);
        this.effectiveSkillLevel = Math.floor(this.level / 2) + this.allSkillBonus;

        // Apply Passives from Tree
        if (this.className === 'Barbarian') {
            s.flatArmor += (this.points.iron_skin || 0) * 30;
            s.allRes += (this.points.natural_resistance || 0) * 4;
        }

        this.maxHp = Math.round((this.maxHp + s.flatHP) * (1 + (s.pctHP || 0) / 100));
        this.armor = Math.round((this.armor + s.flatArmor) * (1 + (s.pctArmor || 0) / 100));
        this.resists = {
            fire: Math.min(75, s.allRes + (s.fireRes || 0)),
            cold: Math.min(75, s.allRes + (s.coldRes || 0)),
            light: Math.min(75, s.allRes + (s.lightRes || 0)),
            pois: Math.min(75, s.allRes + (s.poisRes || 0))
        };
        
        this.hp = Math.min(this.hp, this.maxHp);
    }

    update(dt, player, enemies, dungeon) {
        if (this.hp <= 0) { this.animState = 'dead'; return; }

        this._auraTimer -= dt;
        if (this._auraTimer <= 0) {
            this._auraTimer = 2.0;
            this._applyAutonomousSkills(player, enemies);
        }

        const dToP = Math.hypot(player.x - this.x, player.y - this.y);
        if (dToP > 800) { this.x = player.x; this.y = player.y; this.path = []; return; }

        // LoS Targeting
        let closest = null, cDist = 450;
        for (const e of enemies) {
            if (e.hp > 0 && dungeon.hasLineOfSight(this.x, this.y, e.x, e.y)) {
                const d = Math.hypot(e.x - this.x, e.y - this.y);
                if (d < cDist) { cDist = d; closest = e; }
            }
        }
        this.target = closest;

        // Navigation
        let moved = false;
        const goal = this.target || player;
        const goalDist = Math.hypot(goal.x - this.x, goal.y - this.y);
        const stopDist = this.target ? (this.className === 'Barbarian' || this.className === 'Desert Warrior' ? 35 : 280) : 65;

        if (goalDist > stopDist) {
            if (this.path.length === 0 || Math.random() < 0.04) {
                this.path = pathfinder.find(dungeon.grid, this.x, this.y, goal.x, goal.y, dungeon.tileSize);
            }
            if (this.path.length > 0) {
                const next = this.path[0];
                const dx = next.x - this.x, dy = next.y - this.y;
                const d = Math.hypot(dx, dy);
                if (d < 5) { this.path.shift(); }
                else {
                    const speed = dToP > 250 ? 160 : 100;
                    this.x += (dx / d) * speed * dt;
                    this.y += (dy / d) * speed * dt;
                    this.facingDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
                    this.animState = 'walk'; moved = true;
                }
            }
        } else {
            this.path = [];
            this.animState = 'idle';
            if (this.target) {
                const dx = this.target.x - this.x, dy = this.target.y - this.y;
                this.facingDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
            }
        }

        // Combat
        if (this.target && goalDist <= stopDist + 20) {
            this._atkCd -= dt;
            if (this._atkCd <= 0) {
                this.attack(this.target);
                this._atkCd = 1 / this.atkSpeed;
                this.animState = 'attack';
            }
        }

        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.012 * dt);
    }

    _applyAutonomousSkills(player, enemies) {
        const slvl = (id) => (this.points[id] || 0) + (this.allSkillBonus || 0);
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

        // Auras (Always Active if points > 0)
        if (distToPlayer < 350) {
            if (slvl('might_aura')) applyStatus(player, 'might', 2.5, 1 + slvl('might_aura') * 0.06);
            if (slvl('defiance_aura')) applyStatus(player, 'defiance', 2.5, 1 + slvl('defiance_aura') * 0.12);
            if (slvl('holy_freeze')) applyStatus(player, 'holy_freeze_aura', 2.5, slvl('holy_freeze'));
        }

        // Warcries & Utility (Cast when needed)
        this._buffCd -= 2.0; // Checked every 2s
        if (this._buffCd <= 0 && distToPlayer < 300) {
            if (slvl('shout_aura')) {
                applyStatus(player, 'shout', 15, 1 + slvl('shout_aura') * 0.20);
                fx.emitShockwave(this.x, this.y, 120, 'rgba(200,200,200,0.3)');
                bus.emit('combat:log', { text: `${this.name} uses SHOUT!`, type: 'log-info' });
                this._buffCd = 20;
            }
            if (slvl('battle_orders') && player.hp < player.maxHp * 0.8) {
                if (!player._buffs?.some(b => b.id === 'merc_bo')) {
                    player._buffs = player._buffs || [];
                    const val = 25 + slvl('battle_orders') * 4;
                    player._buffs.push({ id: 'merc_bo', name: 'Battle Orders', duration: 15, type: 'hp_boost', value: val });
                    fx.emitBurst(this.x, this.y, '#ffd700', 40, 3);
                    bus.emit('combat:log', { text: `${this.name} uses BATTLE ORDERS!`, type: 'log-crit' });
                    this._buffCd = 30;
                }
            }
        }
    }

    attack(target) {
        const slvl = (id) => (this.points[id] || 0) + (this.allSkillBonus || 0);
        const dmg = this.totalDmg;

        if (this.className === 'Barbarian') {
            const bLvl = slvl('bash');
            if (bLvl > 0 && Math.random() < 0.4) {
                applyDamage(this, target, { dealt: dmg * (1.6 + bLvl * 0.12), isCrit: true, type: 'physical' });
                const dx = target.x - this.x, dy = target.y - this.y;
                const d = Math.hypot(dx, dy) || 1;
                target.vx = (dx / d) * 18; target.vy = (dy / d) * 18; 
                fx.emitBurst(target.x, target.y, '#fff', 25, 2);
                bus.emit('combat:log', { text: `${this.name} BASHED the enemy!`, type: 'log-info' });
            } else {
                applyDamage(this, target, { dealt: dmg, isCrit: Math.random() < 0.1, type: 'physical' });
            }
        } 
        else if (this.className === 'Desert Warrior') {
            const jLvl = slvl('jab') || 1;
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (target && target.hp > 0) {
                        applyDamage(this, target, { dealt: dmg * (0.75 + jLvl * 0.06), isCrit: false, type: 'physical' });
                        fx.emitSlash(this.x, this.y, Math.atan2(target.y - this.y, target.x - this.x), '#ccc', 25);
                    }
                }, i * 110);
            }
        }
        else if (this.className === 'Iron Wolf') {
            const fL = slvl('fire_bolt'), cL = slvl('glacial_spike'), lL = slvl('charged_bolt');
            const type = fL >= cL && fL >= lL ? 'fire' : (cL >= lL ? 'cold' : 'lightning');
            const boltLvl = Math.max(fL, cL, lL, 1);
            const color = type === 'fire' ? '#f40' : (type === 'cold' ? '#0af' : '#ff0');
            const proj = new Projectile(this.x, this.y, target.x, target.y, 340, 'ra-circle', dmg * (1 + boltLvl * 0.25), type, this);
            bus.emit('combat:spawnProjectile', { proj });
            fx.emitBurst(this.x, this.y, color, 15, 1.5);
        }
        else { // Rogue
            const fA = slvl('fire_arrow'), cA = slvl('cold_arrow');
            const type = fA > cA ? 'fire' : (cA > 0 ? 'cold' : 'physical');
            const proj = new Projectile(this.x, this.y, target.x, target.y, 450, 'ra-arrow', dmg * (1 + Math.max(fA, cA) * 0.18), type, this);
            bus.emit('combat:spawnProjectile', { proj });

            if (slvl('inner_sight') > 0 && Math.random() < 0.3) {
                applyStatus(target, 'inner_sight', 10, slvl('inner_sight') * 18);
                fx.emitBurst(target.x, target.y, '#ffffff', 20, 2.5);
                bus.emit('combat:log', { text: `${this.name} uses Inner Sight!`, type: 'log-info' });
            }
        }
    }

    render(renderer, time) {
        if (this.hp <= 0) return;
        renderer.drawShadow(this.x, this.y + 4, 8, 0.3);
        renderer.drawAnim(this.icon, this.x, this.y - 4, 18, this.animState || 'idle', this.facingDir || 'south', time, null, this.equipment);
        
        const bw = 18;
        renderer.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        renderer.ctx.fillRect(this.x - bw / 2, this.y - 20, bw, 2);
        renderer.ctx.fillStyle = '#4caf50';
        renderer.ctx.fillRect(this.x - bw / 2, this.y - 20, bw * (this.hp / this.maxHp), 2);
        
        renderer.ctx.font = '5px Cinzel, serif';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillStyle = '#4caf50';
        renderer.ctx.fillText(this.name, this.x, this.y - 23);
    }

    serialize() {
        return {
            name: this.name, className: this.className, level: this.level, xp: this.xp,
            hp: this.hp, icon: this.icon, equipment: this.equipment,
            points: this.points, unspentPoints: this.unspentPoints
        };
    }

    static deserialize(data) {
        if (!data) return null;
        const m = new Mercenary(data);
        m.points = data.points || {};
        m.unspentPoints = data.unspentPoints || 0;
        m._recalcStats();
        return m;
    }
}
