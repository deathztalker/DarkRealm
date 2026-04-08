/**
 * Mercenary Entity — Companions that follow and fight for the player.
 * Supports equipment (Helm, Armor, Weapon) and persists between sessions.
 */
import { bus } from '../engine/EventBus.js';
import { calcDamage, applyDamage, DMG_TYPE } from '../systems/combat.js';
import { Projectile } from './projectile.js';
import { fx } from '../engine/ParticleSystem.js';

export class Mercenary {
    constructor(data) {
        this.name = data.name || 'Mercenary';
        this.className = data.className || 'Rogue';
        this.level = data.level || 1;
        this.icon = data.icon || 'class_rogue';
        
        this.x = data.x || 0;
        this.y = data.y || 0;
        
        this.maxHp = data.maxHp || (60 + this.level * 15);
        this.hp = data.hp || this.maxHp;
        this.dmg = data.dmg || (5 + this.level * 2);
        
        this.isMercenary = true;
        this.isPlayer = true; // For faction targeting
        
        this.equipment = data.equipment || {
            head: null,
            chest: null,
            mainhand: null
        };
        
        this._atkCd = 0;
        this.atkSpeed = 1.2;
        
        this.resists = { fire: 0, cold: 0, light: 0, pois: 0 };
        this._buffs = [];
        this._recalcStats();
    }

    serialize() {
        return {
            name: this.name,
            className: this.className,
            level: this.level,
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
            flatHP: 0, flatArmor: 0, pctArmor: 0
        };

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
                    if (s[mod.stat] !== undefined) s[mod.stat] += mod.value;
                    else if (mod.stat === 'allRes') s.allRes += mod.value;
                }
            }

            // Sockets
            if (item.socketed) {
                const itemClass = (item.slot === 'mainhand' || item.slot === 'offhand') ? item.slot : 'armor';
                for (const gem of item.socketed) {
                    if (gem && gem.socketEffect && gem.socketEffect[itemClass]) {
                        const eff = gem.socketEffect[itemClass];
                        if (s[eff.stat] !== undefined) s[eff.stat] += eff.value;
                        else if (eff.stat === 'allRes') s.allRes += eff.value;
                    }
                }
            }
        }

        // Final totals
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
        if (this.hp <= 0) return;

        // Auto-level with player (if lower level)
        if (player && player.level > this.level) {
            this.level = player.level;
            this._recalcStats();
            this.hp = this.maxHp;
            fx.emitBurst(this.x, this.y, '#ffd700', 20, 2);
            bus.emit('combat:log', { text: `${this.name} has leveled up to ${this.level}!`, type: 'log-level' });
        }

        const mx = player.x - this.x, my = player.y - this.y;
        const md = Math.sqrt(mx * mx + my * my);
        if (md > 60) {
            const speed = 85;
            const moveX = (mx / md) * speed * dt;
            const moveY = (my / md) * speed * dt;
            if (dungeon.isWalkable(this.x + moveX, this.y + moveY)) {
                this.x += moveX;
                this.y += moveY;
            }
        }

        // Combat AI
        let closestEnemy = null, closestDist = 250;
        for (const e of enemies) {
            if (e.hp <= 0) continue;
            const ed = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
            if (ed < closestDist) { closestDist = ed; closestEnemy = e; }
        }

        if (closestEnemy) {
            this._atkCd -= dt;
            if (this._atkCd <= 0) {
                this.attack(closestEnemy);
                this._atkCd = 1.2;
            }
        }

        // Passive regen
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.005 * dt);
    }

    attack(target) {
        const dmg = this.baseDmg + Math.floor(Math.random() * 5);
        let pType = 'physical', sprite = 'ra-arrow', pDmg = dmg;
        const roll = Math.random();
        if (roll < 0.15) { pType = 'fire'; pDmg *= 1.3; }
        else if (roll < 0.30) { pType = 'cold'; pDmg *= 1.2; }

        const proj = new Projectile(
            this.x, this.y,
            target.x, target.y,
            300, sprite, pDmg, pType, this, false, 8, 0, 0, 'arrow'
        );
        bus.emit('combat:spawnProjectile', { proj });
    }
}
