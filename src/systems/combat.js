/**
 * Combat System
 * Damage formula, resistances, crits, DoTs, life steal — D2-inspired.
 */
import { bus } from '../engine/EventBus.js';

// Damage types
export const DMG_TYPE = {
    PHYSICAL: 'physical',
    FIRE: 'fire',
    COLD: 'cold',
    LIGHTNING: 'lightning',
    POISON: 'poison',
    MAGIC: 'magic',   // pierces all resists
    SHADOW: 'shadow',
    HOLY: 'holy',
    EARTH: 'earth',
};

/**
 * Core damage calculation.
 * @param {object} attacker - player or enemy stat snapshot
 * @param {number} baseDmg  - skill/weapon base damage
 * @param {string} type     - DMG_TYPE
 * @param {object} defender - target entity
 * @returns {{ dealt:number, isCrit:bool, type:string }}
 */
export function calcDamage(attacker, baseDmg, type, defender) {
    let dmg = Number(baseDmg) || 0;

    // --- Attacker bonuses ---
    const armorStatName = `pct${cap(type)}Dmg`;
    const pct = (attacker[armorStatName] || 0)
        + (attacker.pctDmg || 0);
    dmg *= 1 + pct / 100;

    // --- Critical hit ---
    const critChance = attacker.critChance || 0;
    const isCrit = Math.random() * 100 < critChance;
    if (isCrit) {
        dmg *= 1 + (attacker.critMulti || 150) / 100;
    }

    // --- Flat min damage bonus ---
    dmg += attacker.flatMinDmg || 0;

    // --- Defender resistance (magic & holy bypass) ---
    if (defender[`${type}Immune`]) {
        dmg = 0;
    } else if (type !== DMG_TYPE.MAGIC && type !== DMG_TYPE.HOLY) {
        let res = (defender[`${type}Res`] || 0) - (defender.resDebuff || 0);
        res = Math.min(75, Math.max(-100, res)); // cap at 75%, floor at -100%
        dmg *= 1 - res / 100;
    }

    // --- Armor reduction (physical only) ---
    if (type === DMG_TYPE.PHYSICAL) {
        const armor = Math.max(0, (defender.armor || 0) - (defender.armorDebuff || 0));
        const attackerLevel = Math.max(1, attacker.level || 1);
        const divisor = armor + 5 * attackerLevel * 10;
        const reduction = divisor > 0 ? armor / divisor : 0;
        dmg *= 1 - Math.min(0.75, reduction);
    }

    // --- Percentage damage reduction (D2 Shaft, Doombringer, etc.) ---
    if (defender.pctDmgReduce) {
        dmg *= 1 - Math.min(50, defender.pctDmgReduce) / 100; // Cap at 50%
    }

    // --- Flat damage reduction ---
    if (type === DMG_TYPE.MAGIC && defender.magicDmgReduce) {
        dmg -= defender.magicDmgReduce;
    } else if (defender.flatDmgReduce) {
        dmg -= defender.flatDmgReduce;
    }

    dmg = Math.max(defender[`${type}Immune`] ? 0 : 1, Math.round(dmg));
    if (isNaN(dmg)) dmg = 1; // Last resort fallback
    return { dealt: dmg, isCrit, type };
}

/**
 * Register a DoT (damage over time) on a target.
 */
export function applyDot(target, dmgPerSec, type, durationSec, source) {
    const dot = {
        id: `dot_${Date.now()}_${Math.random()}`,
        dmgPerSec, type, remaining: durationSec, source,
        tick: 0,
    };
    if (!target._dots) target._dots = [];
    // Remove existing same-source dot (refresh)
    target._dots = target._dots.filter(d => d.source !== source);
    target._dots.push(dot);
}

/**
 * Apply damage to a target entity.
 * Handles life steal, floating numbers, death check.
 */
export function applyDamage(attacker, target, dmgResult, skillId = null) {
    const { dealt, isCrit, type } = dmgResult;
    target.hp = Math.max(0, target.hp - dealt);

    // Life steal
    if (attacker.isPlayer && attacker.lifeStealPct) {
        const stolen = Math.round(dealt * attacker.lifeStealPct / 100);
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + stolen);
    }

    // Mana steal
    if (attacker.isPlayer && attacker.manaStealPct) {
        const stolen = Math.round(dealt * attacker.manaStealPct / 100);
        attacker.mp = Math.min(attacker.maxMp, (attacker.mp || 0) + stolen);
    }

    // Thorns (reflect damage back to melee attackers)
    if (target.isPlayer && target.thorns && type === DMG_TYPE.PHYSICAL && !attacker.isPlayer) {
        const reflected = target.thorns;
        attacker.hp = Math.max(0, attacker.hp - reflected);
        bus.emit('combat:damage', { attacker: target, target: attacker, dealt: reflected, isCrit: false, type: 'physical', worldX: attacker.x, worldY: attacker.y });
    }

    // --- Knockback logic ---
    // If damage is high enough (e.g. >10% of maxHp) or specifically has knockback
    const threshold = target.maxHp * 0.1;
    if (dealt > threshold || attacker.knockback) {
        const force = attacker.knockbackForce || 20;
        const dx = target.x - attacker.x;
        const dy = target.y - attacker.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        target.vx = (dx / dist) * force;
        target.vy = (dy / dist) * force;
    }

    bus.emit('combat:damage', {
        attacker, target, dealt, isCrit, type, skillId,
        worldX: target.x, worldY: target.y,
    });

    if (target.hp <= 0) {
        bus.emit('entity:death', { entity: target, killer: attacker });
    }

    return dealt;
}

/**
 * Apply a status effect to a target.
 * Types: 'chill' (slows), 'frozen' (stops), 'burn' (DoT), 'stun' (stops), 'weaken' (less dmg).
 */
export function applyStatus(target, type, duration, value = 0, source = null) {
    if (!target._statuses) target._statuses = [];

    // Refresh existing status of same type
    const existing = target._statuses.find(s => s.type === type);
    if (existing) {
        existing.duration = Math.max(existing.duration, duration);
        existing.value = Math.max(existing.value, value);
        return;
    }

    target._statuses.push({ type, duration, value, source });
}

/** Update all statuses and DoTs on all entities each frame. */
export function updateStatuses(entities, dt) {
    for (const ent of entities) {
        // Friction / Velocity decay for knockback
        if (ent.vx || ent.vy) {
            ent.x += (ent.vx || 0) * dt;
            ent.y += (ent.vy || 0) * dt;
            ent.vx = (ent.vx || 0) * 0.9;
            ent.vy = (ent.vy || 0) * 0.9;
            if (Math.abs(ent.vx) < 1) ent.vx = 0;
            if (Math.abs(ent.vy) < 1) ent.vy = 0;
        }

        if (!ent._statuses?.length && !ent._dots?.length) continue;

        // Update Dots
        if (ent._dots) {
            ent._dots = ent._dots.filter(dot => {
                dot.remaining -= dt;
                dot.tick += dt;
                if (dot.tick >= 1.0) {
                    dot.tick -= 1.0;
                    const dmg = Math.round(Number(dot.dmgPerSec) || 0);
                    ent.hp = Math.max(0, ent.hp - dmg);
                    bus.emit('combat:damage', { target: ent, dealt: dmg, isCrit: false, type: dot.type, worldX: ent.x, worldY: ent.y });
                    if (ent.hp <= 0) bus.emit('entity:death', { entity: ent });
                }
                return dot.remaining > 0 && ent.hp > 0 && !isNaN(ent.hp);
            });
        }

        // Update Statuses
        if (ent._statuses) {
            ent._statuses = ent._statuses.filter(s => {
                s.duration -= dt;
                return s.duration > 0 && ent.hp > 0;
            });
        }
    }
}

/** Helper to check if entity is CC'd (Crowed Controlled: Stunned or Frozen) */
export function isCCd(ent) {
    if (!ent._statuses) return false;
    return ent._statuses.some(s => s.type === 'stun' || s.type === 'frozen');
}

/** Helper to get current slow factor (0 to 1, where 0.3 means 30% slow) */
export function getSlowFactor(ent) {
    if (!ent._statuses) return 0;
    const chills = ent._statuses.filter(s => s.type === 'chill');
    if (chills.length === 0) return 0;
    return Math.max(...chills.map(s => s.value));
}

// ---- Skill execution helpers ----

export function skillDamage(skill, effectiveLevel, synergyBonus, stats) {
    if (!skill) return 0;
    const base = (skill.dmgBase || 5) + (skill.dmgPerLvl || 3) * effectiveLevel;
    const total = base * (1 + synergyBonus);
    const typePct = stats[`pct${cap(skill.group || 'physical')}Dmg`] || 0;
    return Math.round(total * (1 + typePct / 100));
}

export function skillType(skill) {
    const groupToType = {
        fire: 'fire', cold: 'cold', lightning: 'lightning',
        poison: 'poison', shadow: 'shadow', holy: 'holy',
        earth: 'earth', bone: 'magic', melee: 'physical',
        nature: 'physical', totem: 'lightning',
    };
    return groupToType[skill?.group] || DMG_TYPE.PHYSICAL;
}

function cap(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
