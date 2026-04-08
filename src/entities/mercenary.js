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
            equipment: this.equipment
        };
    }

    static deserialize(data) {
        if (!data) return null;
        return new Mercenary(data);
    }

    _recalcStats() {
        // Base stats from level
        this.maxHp = 60 + this.level * 15;
        this.baseDmg = 5 + this.level * 2;
        this.resists = { fire: this.level * 2, cold: this.level * 2, light: this.level * 2, pois: this.level * 2 };
        
        // Add gear stats
        for (const item of Object.values(this.equipment)) {
            if (!item) continue;
            if (item.armor) this.maxHp += item.armor * 0.5; // Armor gives minor HP to mercs
            if (item.minDmg) this.baseDmg += (item.minDmg + item.maxDmg) / 2;
            
            if (item.mods) {
                for (const mod of item.mods) {
                    if (mod.stat === 'fireRes') this.resists.fire += mod.value;
                    if (mod.stat === 'coldRes') this.resists.cold += mod.value;
                    if (mod.stat === 'lightRes') this.resists.light += mod.value;
                    if (mod.stat === 'poisRes') this.resists.pois += mod.value;
                    if (mod.stat === 'allRes') {
                        this.resists.fire += mod.value;
                        this.resists.cold += mod.value;
                        this.resists.light += mod.value;
                        this.resists.pois += mod.value;
                    }
                }
            }
        }
        
        this.hp = Math.min(this.hp, this.maxHp);
    }

    update(dt, player, enemies, dungeon) {
        if (this.hp <= 0) return;

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
