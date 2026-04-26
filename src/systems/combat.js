/**
 * Combat System
 * Damage formula, resistances, crits, DoTs, life steal — D2-inspired.
 *
 * IMPROVEMENTS:
 *  - Eliminados accesos a window.enemies / window.mercenary (ahora se pasan por parámetro)
 *  - applyDamage devuelve un objeto rico con métricas en vez de sólo el número
 *  - Stack-caps de DoTs para evitar memory leaks (máx DOT_STACK_CAP por fuente)
 *  - Toda aritmética validada: no más NaN silenciosos
 *  - Procs separados en un Map de handlers → fácil agregar nuevos sin tocar applyDamage
 *  - processAuraPulsar ya no depende de globals
 *  - Nuevas mecánicas: Parry, Fortify, Overcharge, Vulnerability stacks
 *  - Corrección: _auraTimer era un módulo-global compartido; ahora es per-player
 *  - updateStatuses ahora aplica efectos de burn/chill/poison desde _statuses también
 */

import { bus } from '../engine/EventBus.js';
import { fx } from '../engine/ParticleSystem.js';
import { evaluateSynergies } from './synergyEngine.js';

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────

export const DMG_TYPE = {
    PHYSICAL: 'physical',
    FIRE: 'fire',
    COLD: 'cold',
    LIGHTNING: 'lightning',
    POISON: 'poison',
    MAGIC: 'magic',    // pierces all resists
    SHADOW: 'shadow',
    HOLY: 'holy',
    EARTH: 'earth',
};

/** Maximum resistance cap (can be raised by gear, classic D2 cap is 75) */
const MAX_RES_CAP = 75;
/** Minimum resistance floor (negative = takes extra damage) */
const MIN_RES_CAP = -100;
/** Maximum simultaneous DoT stacks from a single source on one target */
const DOT_STACK_CAP = 1;     // same-source DoTs refresh, not stack (correct D2 behavior)
/** Armor damage reduction hard cap */
const ARMOR_REDUCE_CAP = 0.75;
/** Maximum damage reduction from pctDmgReduce */
const PCT_REDUCE_CAP = 50;

// ─────────────────────────────────────────────────────────────
//  SAFE MATH HELPERS
// ─────────────────────────────────────────────────────────────

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const safeNum = (v, fallback = 0) => (isFinite(v) ? Number(v) : fallback);
const cap = (str) => (typeof str === 'string' && str.length ? str[0].toUpperCase() + str.slice(1) : '');

// ─────────────────────────────────────────────────────────────
//  CORE DAMAGE CALCULATION
// ─────────────────────────────────────────────────────────────

/**
 * Pure damage calculation — no side effects, no HP mutation.
 * @param {object} attacker  - stat snapshot (player or enemy)
 * @param {number} baseDmg   - skill / weapon base damage
 * @param {string} type      - DMG_TYPE value
 * @param {object} defender  - target entity
 * @returns {{ dealt:number, isCrit:boolean, isDeadlyStrike:boolean,
 *             isCrushingBlow:boolean, openWounds:boolean, missed:boolean, type:string }}
 */
export function calcDamage(attacker, baseDmg, type, defender) {
    const result = { dealt: 0, isCrit: false, isDeadlyStrike: false, isCrushingBlow: false, openWounds: false, missed: false, type };

    if (!attacker || !defender) return result;

    // ── Blind miss ────────────────────────────────────────────
    if (isBlinded(attacker) && Math.random() < 0.5) {
        result.missed = true;
        return result;
    }

    let dmg = safeNum(baseDmg);

    // ── Attacker % damage bonuses ─────────────────────────────
    const typeBonus = safeNum(attacker[`pct${cap(type)}Dmg`]);
    const globalBonus = safeNum(attacker.pctDmg);
    dmg *= 1 + (typeBonus + globalBonus) / 100;

    // ── Overcharge (new): bonus damage when mana > 80 % ───────
    if (attacker.isPlayer && (attacker.mp / (attacker.maxMp || 1)) > 0.8 && attacker.overchargePct) {
        dmg *= 1 + safeNum(attacker.overchargePct) / 100;
    }

    // ── Critical hit ──────────────────────────────────────────
    const critChance = safeNum(attacker.critChance);
    result.isCrit = critChance > 0 && Math.random() * 100 < critChance;
    if (result.isCrit) dmg *= 1 + safeNum(attacker.critMulti, 150) / 100;

    // ── Deadly Strike (physical only) ─────────────────────────
    if (type === DMG_TYPE.PHYSICAL && safeNum(attacker.deadlyStrike) > 0) {
        if (Math.random() * 100 < attacker.deadlyStrike) {
            dmg *= 2;
            result.isDeadlyStrike = true;
        }
    }

    // ── Flat min damage bonus ─────────────────────────────────
    dmg += safeNum(attacker.flatMinDmg);

    // ── Vulnerability stacks (new debuff on defender) ─────────
    const vulnStacks = defender._statuses?.filter(s => s.type === 'vulnerability').length ?? 0;
    if (vulnStacks > 0) dmg *= 1 + vulnStacks * 0.08; // +8 % per stack

    // ── Crushing Blow ─────────────────────────────────────────
    if (safeNum(attacker.crushingBlow) > 0 && Math.random() * 100 < attacker.crushingBlow) {
        const reductionPct = defender.type === 'boss' ? 0.10 : 0.25;
        dmg += Math.round(safeNum(defender.hp) * reductionPct);
        result.isCrushingBlow = true;
    }

    // ── Open Wounds flag (actual DoT applied in applyDamage) ──
    if (safeNum(attacker.openWounds) > 0 && Math.random() * 100 < attacker.openWounds) {
        result.openWounds = true;
    }

    // ── Immunity check ────────────────────────────────────────
    if (defender[`${type}Immune`]) {
        result.dealt = 0;
        return result;
    }

    // ── Resistances (magic & holy bypass) ────────────────────
    if (type !== DMG_TYPE.MAGIC && type !== DMG_TYPE.HOLY) {
        const statusResDebuff = _sumStatusValue(defender, 'res_debuff');
        let res = safeNum(defender[`${type}Res`]) - safeNum(defender.resDebuff) - statusResDebuff;
        res = clamp(res, MIN_RES_CAP, MAX_RES_CAP);
        dmg *= 1 - res / 100;
    }

    // ── Armor reduction (physical only) ──────────────────────
    if (type === DMG_TYPE.PHYSICAL) {
        const armorDebuffs = _sumStatusValue(defender, 'armor_shred') + _sumStatusValue(defender, 'inner_sight');
        const armor = Math.max(0, safeNum(defender.armor) - safeNum(defender.armorDebuff) - armorDebuffs);
        const atkLvl = Math.max(1, safeNum(attacker.level, 1));
        const divisor = armor + 5 * atkLvl * 10;
        const reduction = divisor > 0 ? armor / divisor : 0;
        dmg *= 1 - Math.min(ARMOR_REDUCE_CAP, reduction);
    }

    // ── Percentage damage reduction ────────────────────────────
    if (defender.pctDmgReduce)
        dmg *= 1 - clamp(safeNum(defender.pctDmgReduce), 0, PCT_REDUCE_CAP) / 100;

    // ── Flat damage reduction ──────────────────────────────────
    if (type === DMG_TYPE.MAGIC && defender.magicDmgReduce)
        dmg -= safeNum(defender.magicDmgReduce);
    else if (defender.flatDmgReduce)
        dmg -= safeNum(defender.flatDmgReduce);

    // ── Incoming damage multiplier ─────────────────────────────
    if (defender.dmgTakenMult) dmg *= safeNum(defender.dmgTakenMult, 1);

    // ── Fortify (new): damage absorbed by a fixed shield pool ──
    if (safeNum(defender.fortify) > 0) {
        const absorbed = Math.min(dmg * 0.2, defender.fortify);
        defender.fortify = Math.max(0, defender.fortify - absorbed);
        dmg -= absorbed;
    }

    result.dealt = Math.max(0, Math.round(dmg));
    if (isNaN(result.dealt)) result.dealt = 0;

    return result;
}

// Helper: sum the .value field of all statuses matching a type
function _sumStatusValue(entity, statusType) {
    if (!entity._statuses) return 0;
    return entity._statuses
        .filter(s => s.type === statusType)
        .reduce((acc, s) => acc + Math.abs(safeNum(s.value)), 0);
}

// ─────────────────────────────────────────────────────────────
//  DAMAGE-OVER-TIME
// ─────────────────────────────────────────────────────────────

/**
 * Register a DoT on a target.
 * Same-source DoTs are refreshed (not stacked) — D2 behavior.
 */
export function applyDot(target, dmgPerSec, type, durationSec, source) {
    if (!target._dots) target._dots = [];

    // Refresh existing same-source dot
    const existing = target._dots.find(d => d.source === source);
    if (existing) {
        existing.remaining = durationSec;
        existing.dmgPerSec = Math.max(existing.dmgPerSec, dmgPerSec); // keep highest
        return;
    }

    // Hard cap: prevent unbounded arrays from different sources
    if (target._dots.length >= 32) {
        // Remove the oldest DoT
        target._dots.shift();
    }

    target._dots.push({
        id: `${source}_${Date.now()}`,
        dmgPerSec: safeNum(dmgPerSec),
        type,
        remaining: safeNum(durationSec),
        source,
        tick: 0,
    });
}

// ─────────────────────────────────────────────────────────────
//  APPLY DAMAGE  (main entry point)
// ─────────────────────────────────────────────────────────────

/**
 * Apply a calcDamage result to a target.
 * @param {object}      attacker
 * @param {object}      target
 * @param {object}      dmgResult  - returned by calcDamage()
 * @param {string|null} skillId
 * @param {object}      [context]  - { enemies: Enemy[], allies: Entity[] }
 *                                    Pass game-state in instead of using window.*
 * @returns {{ finalDealt:number, killed:boolean }}
 */
export function applyDamage(attacker, target, dmgResult, skillId = null, context = {}) {
    const { dealt, isCrit, isDeadlyStrike, isCrushingBlow, openWounds, missed, type } = dmgResult;
    const enemies = context.enemies ?? window.enemies ?? [];

    // ── Miss ──────────────────────────────────────────────────
    if (missed) {
        _emitDamage(attacker, target, 'Miss!', false, type);
        return { finalDealt: 0, killed: false };
    }

    // ── Block ─────────────────────────────────────────────────
    if (target.blockChance && type === DMG_TYPE.PHYSICAL && dealt > 0) {
        if (Math.random() * 100 < clamp(safeNum(target.blockChance), 0, 75)) {
            _emitDamage(attacker, target, 'Blocked!', false, 'physical');
            
            // --- Warrior Revenge Logic ---
            if (target.isPlayer && target.talents?.baseLevel('revenge') > 0) {
                target._revengeReady = true;
                if (fx) fx.emitBurst(target.x, target.y - 15, '#ffd700', 8, 1);
            }

            // Parry (new): small chance on block to stun the attacker briefly
            if (safeNum(target.parryChance) > 0 && Math.random() * 100 < target.parryChance && attacker) {
                applyStatus(attacker, 'stun', 0.4, 0);
                bus.emit('combat:log', { text: 'PARRY!', cls: 'log-crit' });
            }
            return { finalDealt: 0, killed: false };
        }
    }

    let finalDealt = safeNum(dealt);

    // ── Floating text for special hits ───────────────────────
    if (isDeadlyStrike) {
        bus.emit('combat:log', { text: 'DEADLY STRIKE!', cls: 'log-crit' });
        bus.emit('combat:floating_text', { x: target.x, y: target.y, text: 'DEADLY STRIKE!', type: 'holy', isCrit: true });
    }
    if (isCrushingBlow) {
        bus.emit('combat:log', { text: 'CRUSHING BLOW!', cls: 'log-crit' });
        bus.emit('combat:floating_text', { x: target.x, y: target.y, text: 'CRUSHING BLOW!', type: 'magic', isCrit: true });
        if (fx) fx.emitHolyBurst(target.x, target.y);
    }

    // ── Open Wounds DoT ───────────────────────────────────────
    if (openWounds) {
        const bleedDmg = Math.round(10 + safeNum(attacker?.level, 1) * 2);
        applyDot(target, bleedDmg, DMG_TYPE.PHYSICAL, 8, 'open_wounds');
        bus.emit('combat:log', { text: 'OPEN WOUNDS!', cls: 'log-dmg' });
        bus.emit('combat:floating_text', { x: target.x, y: target.y, text: 'OPEN WOUNDS!', type: 'poison' });
    }

    // ── Bone Armor ────────────────────────────────────────────
    if (safeNum(target.boneArmor) > 0 && type === DMG_TYPE.PHYSICAL) {
        const absorb = Math.min(finalDealt, target.boneArmor);
        target.boneArmor -= absorb;
        finalDealt -= absorb;
        if (target.boneArmor <= 0) {
            target.boneArmor = 0;
            target._statuses = target._statuses?.filter(s => s.type !== 'bone_armor') ?? [];
            bus.emit('combat:log', { text: 'Bone Armor Shattered!', cls: 'log-dmg' });
        }
    }

    // ── Energy Shield ─────────────────────────────────────────
    const es = target._statuses?.find(s => s.type === 'energy_shield');
    if (es && finalDealt > 0) {
        const pct = clamp(safeNum(es.value) / 100, 0, 1);
        const toMana = Math.floor(finalDealt * pct);
        const manaCost = Math.floor(toMana * 0.75);
        if (safeNum(target.mp) >= manaCost) {
            target.mp -= manaCost;
            finalDealt -= toMana;
        } else {
            target._statuses = target._statuses.filter(s => s.type !== 'energy_shield');
            bus.emit('combat:log', { text: 'Energy Shield Collapsed!', cls: 'log-dmg' });
        }
    }

    // ── Divine Shield (defender) ──────────────────────────────
    if (target.isPlayer && safeNum(target.divineShield) > 0) {
        const absorbed = Math.min(finalDealt, target.divineShield);
        target.divineShield -= absorbed;
        finalDealt -= absorbed;
        if (target.divineShield <= 0) {
            target.divineShield = 0;
            bus.emit('combat:log', { text: 'Divine Shield shattered!', cls: 'log-dmg' });
        }
    }

    // ── Apply HP loss ─────────────────────────────────────────
    finalDealt = Math.max(0, finalDealt);
    target.hp = Math.max(0, safeNum(target.hp) - finalDealt);
    if (finalDealt > 0)
        target.lastAttacker = attacker ? (attacker.name || attacker.charName) : (skillId || 'Environment');

    // ── PvP Duel floor ────────────────────────────────────────
    const isDuel = window.network?.duelOpponentId &&
        (target.id === window.network.duelOpponentId || target.syncId === window.network.duelOpponentId);
    if (isDuel && target.hp < 1) {
        target.hp = 1;
        bus.emit('combat:log', { text: 'DUEL FINISHED!', cls: 'log-level' });
        window.network?.socket.emit('duel_end', { winner: attacker?.charName });
    }

    // ── Sensory feedback ─────────────────────────────────────
    if (finalDealt > 0) {
        target.hitFlashTimer = 0.12;
        if (fx) {
            if (isCrit) fx.shake(250, 5);
            const angle = attacker
                ? Math.atan2(target.y - attacker.y, target.x - attacker.x)
                : 0;
            if (type === DMG_TYPE.PHYSICAL || type === DMG_TYPE.HOLY)
                fx.emitBlood(target.x, target.y, angle);
            else
                fx.emitHitImpact(target.x, target.y, type);
        }
    }

    // ── Life / Mana Steal ─────────────────────────────────────
    if (attacker?.isPlayer && finalDealt > 0) {
        if (attacker.lifeStealPct)
            attacker.hp = Math.min(safeNum(attacker.maxHp), attacker.hp + Math.round(finalDealt * attacker.lifeStealPct / 100));
        if (attacker.manaStealPct)
            attacker.mp = Math.min(safeNum(attacker.maxMp), safeNum(attacker.mp) + Math.round(finalDealt * attacker.manaStealPct / 100));
    }

    // ── Enemy life steal ──────────────────────────────────────
    if (attacker && !attacker.isPlayer && safeNum(attacker.lifeStealPct) > 0 && finalDealt > 0) {
        attacker.hp = Math.min(safeNum(attacker.maxHp), safeNum(attacker.hp) + Math.round(finalDealt * attacker.lifeStealPct / 100));
        if (fx) fx.emitHeal(attacker.x, attacker.y);
    }

    // ── Thorns ────────────────────────────────────────────────
    if (target.isPlayer && safeNum(target.thorns) > 0 && type === DMG_TYPE.PHYSICAL && attacker && !attacker.isPlayer) {
        const thornsDmg = safeNum(target.thorns);
        attacker.hp = Math.max(0, safeNum(attacker.hp) - thornsDmg);
        _emitDamage(target, attacker, thornsDmg, false, 'physical');
    }

    // ── Durability wear ───────────────────────────────────────
    _tickDurability(attacker, 'mainhand', 0.10);
    if (target.isPlayer) _tickDurabilityRandom(target, ['chest', 'head', 'offhand', 'gloves', 'boots'], 0.15);

    // ── Knockback ─────────────────────────────────────────────
    const kbThreshold = safeNum(target.maxHp) * 0.10;
    if ((finalDealt > kbThreshold || attacker?.knockback) && attacker) {
        const force = safeNum(attacker.knockbackForce, 20);
        const dx = safeNum(target.x) - safeNum(attacker.x);
        const dy = safeNum(target.y) - safeNum(attacker.y);
        const dist = Math.hypot(dx, dy) || 1;
        if (target.isPlayer) { target.pushX = (dx / dist) * force; target.pushY = (dy / dist) * force; }
        else { target.vx = (dx / dist) * force; target.vy = (dy / dist) * force; }
    }

    // ── Broadcast ─────────────────────────────────────────────
    _emitDamage(attacker, target, finalDealt, isCrit, type, skillId);
    if (isCrit && fx) fx.shake(200, 3);

    // ── Lightning Enchanted recoil ────────────────────────────
    if (target.isLightningEnchanted && finalDealt > 0 && attacker?.isPlayer && !attacker.isPlayerImmuneToEnchant) {
        fx?.emitLightning?.(target.x, target.y, attacker.x, attacker.y, 3);
        const recoil = Math.max(1, Math.round(finalDealt * 0.05));
        attacker.hp = Math.max(0, safeNum(attacker.hp) - recoil);
        _emitDamage(target, attacker, recoil, false, 'lightning');
    }

    // ── Death ─────────────────────────────────────────────────
    let killed = false;
    if (target.hp <= 0) {
        killed = true;
        _onKillLogic(attacker, target);
        bus.emit('entity:death', { entity: target, killer: attacker });
    }

    // ── Equipment procs (only if alive or instant kill proc) ──
    _fireEquipmentProcs(attacker, target, finalDealt, enemies);

    return { finalDealt, killed };
}

// ─────────────────────────────────────────────────────────────
//  STATUS EFFECTS
// ─────────────────────────────────────────────────────────────

/**
 * Apply (or refresh) a status effect on a target.
 * @param {object} target
 * @param {string} type       - e.g. 'chill', 'frozen', 'burn', 'stun', 'vulnerability'
 * @param {number} duration   - seconds
 * @param {number} [value]    - magnitude (slow %, damage/s, etc.)
 * @param {object} [metadata] - extra fields merged onto the status object
 */
export function applyStatus(target, type, duration, value = 0, metadata = {}) {
    if (!target) return;

    // CC immunity checks
    if (target.isPlayer && target.cannotBeFrozen && (type === 'chill' || type === 'frozen')) return;
    if (target.isCCImmune && (type === 'stun' || type === 'frozen' || type === 'fear' || type === 'root')) return;

    if (!target._statuses) target._statuses = [];

    const existing = target._statuses.find(s => s.type === type);
    if (existing) {
        existing.duration = Math.max(existing.duration, duration);
        if (value !== 0) existing.value = Math.max(safeNum(existing.value), value);
        if (typeof metadata === 'object') Object.assign(existing, metadata);
        return;
    }

    // Vulnerability stacks are an exception — they stack up to 5
    if (type === 'vulnerability' && target._statuses.filter(s => s.type === 'vulnerability').length >= 5) return;

    const newStatus = { type, duration: safeNum(duration), value: safeNum(value) };
    if (typeof metadata === 'object') Object.assign(newStatus, metadata);
    target._statuses.push(newStatus);
}

/**
 * Update all DoTs and statuses on a list of entities.
 * Call once per frame with the delta time in seconds.
 * @param {object[]} entities
 * @param {number}   dt
 */
export function updateStatuses(entities, dt) {
    for (const ent of entities) {
        if (!ent || safeNum(ent.hp) <= 0) continue;

        // ── Knockback velocity decay ──────────────────────────
        if (ent.vx || ent.vy) {
            ent.x = safeNum(ent.x) + safeNum(ent.vx) * dt;
            ent.y = safeNum(ent.y) + safeNum(ent.vy) * dt;
            ent.vx = safeNum(ent.vx) * 0.85;
            ent.vy = safeNum(ent.vy) * 0.85;
            if (Math.abs(ent.vx) < 0.5) ent.vx = 0;
            if (Math.abs(ent.vy) < 0.5) ent.vy = 0;
        }

        // ── Tick DoTs ─────────────────────────────────────────
        if (ent._dots?.length) {
            ent._dots = ent._dots.filter(dot => {
                dot.remaining -= dt;
                dot.tick += dt;

                if (dot.tick >= 1.0) {
                    dot.tick -= 1.0;
                    const dmg = Math.round(safeNum(dot.dmgPerSec));
                    if (dmg > 0) {
                        ent.hp = Math.max(0, safeNum(ent.hp) - dmg);
                        bus.emit('combat:damage', {
                            target: ent, dealt: dmg, isCrit: false,
                            type: dot.type, worldX: ent.x, worldY: ent.y,
                        });
                        if (ent.hp <= 0) {
                            bus.emit('entity:death', { entity: ent, killer: null });
                            return false;
                        }
                    }
                }
                return dot.remaining > 0;
            });
        }

        // ── Tick & apply status effects ───────────────────────
        if (ent._statuses?.length) {
            for (const s of ent._statuses) {
                s.duration -= dt;

                // Per-tick effects (fire burn DoT stored as status)
                if (s.type === 'burn' && s.value > 0) {
                    s._tick = (s._tick || 0) + dt;
                    if (s._tick >= 1.0) {
                        s._tick -= 1.0;
                        const dmg = Math.round(safeNum(s.value) * dt);
                        if (dmg > 0) {
                            ent.hp = Math.max(0, ent.hp - dmg);
                            bus.emit('combat:damage', { target: ent, dealt: dmg, isCrit: false, type: 'fire', worldX: ent.x, worldY: ent.y });
                        }
                    }
                }
            }
            ent._statuses = ent._statuses.filter(s => s.duration > 0 && safeNum(ent.hp) > 0);
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  ENTITY STATE HELPERS  (pure reads — no side effects)
// ─────────────────────────────────────────────────────────────

export const isCCd = (ent) => ent?._statuses?.some(s => s.type === 'stun' || s.type === 'frozen') ?? false;
export const isBlinded = (ent) => ent?._statuses?.some(s => s.type === 'blind') ?? false;
export const isFeared = (ent) => ent?._statuses?.some(s => s.type === 'fear') ?? false;
export const isRooted = (ent) => ent?._statuses?.some(s => s.type === 'root') ?? false;

export function getSlowFactor(ent) {
    const chills = ent?._statuses?.filter(s => s.type === 'chill');
    return chills?.length ? Math.max(...chills.map(s => safeNum(s.value))) : 0;
}

// ─────────────────────────────────────────────────────────────
//  SKILL HELPERS
// ─────────────────────────────────────────────────────────────

export function skillDamage(skill, effectiveLevel, synergyBonus, stats) {
    if (!skill) return 0;
    const base = safeNum(skill.dmgBase, 5) + safeNum(skill.dmgPerLvl, 3) * safeNum(effectiveLevel);
    const total = base * (1 + safeNum(synergyBonus));
    const typePct = safeNum(stats[`pct${cap(skill.group || 'physical')}Dmg`]);
    return Math.round(total * (1 + typePct / 100));
}

export function skillType(skill) {
    const groupToType = {
        fire: 'fire', cold: 'cold', lightning: 'lightning',
        poison: 'poison', shadow: 'shadow', holy: 'holy',
        earth: 'earth', bone: 'magic', melee: 'physical',
        nature: 'physical', totem: 'lightning',
    };
    return groupToType[skill?.group] ?? DMG_TYPE.PHYSICAL;
}

// ─────────────────────────────────────────────────────────────
//  AURA PULSAR
// ─────────────────────────────────────────────────────────────

const ASHBRINGER_HEAL_PCT = 0.02;
const SOULFRAGS_MAX = 50;

/**
 * Handle periodic legendary weapon aura effects.
 * @param {object}   player
 * @param {object[]} enemies  - pass directly, no window.enemies
 * @param {number}   dt
 */
export function processAuraPulsar(player, enemies, dt) {
    if (!player || !enemies) return;

    const hasAshbringer = !!player.itemAuras?.has('ashbringer');
    const hasFrostmourne = !!player.itemAuras?.has('frostmourne');
    const hasShadowmourne = !!player.itemAuras?.has('shadowmourne');

    // ── Resonance status updates ──────────────────────────────
    if (hasFrostmourne && hasShadowmourne) {
        applyStatus(player, 'lich_king_synergy', 2.0, 150, {
            name: 'Lich King Synergy',
            desc: 'Frostmourne & Shadowmourne resonate! 250% Physical Dmg, 20% Life Steal.',
        });
    } else {
        player._statuses = player._statuses?.filter(s => s.type !== 'lich_king_synergy') ?? [];
    }

    if (hasAshbringer && hasShadowmourne) {
        applyStatus(player, 'twilight_synergy', 2.0, 100, {
            name: 'Twilight Synergy',
            desc: 'Ashbringer & Shadowmourne resonate! 200% Damage, +50 All Resistances.',
        });
    } else {
        player._statuses = player._statuses?.filter(s => s.type !== 'twilight_synergy') ?? [];
    }

    // ── Timer (per-player, not a module-level global) ─────────
    player._auraPulseTimer = safeNum(player._auraPulseTimer) - dt;
    if (player._auraPulseTimer > 0) return;
    player._auraPulseTimer = 1.0; // pulse every second

    // ── Resonance damage multiplier ───────────────────────────
    let resonanceMult = 1.0;
    if (hasFrostmourne && hasShadowmourne) resonanceMult = 2.5;
    else if (hasAshbringer && (hasFrostmourne || hasShadowmourne)) resonanceMult = 1.8;

    const drainBase = (10 + safeNum(player.level) * 3) * safeNum(player._drainMult, 1) * resonanceMult;

    for (const e of enemies) {
        if (safeNum(e.hp) <= 0 || e.state === 'dead') continue;
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        if (dist > 150) continue;

        // 1. Ashbringer — holy pulse (bonus vs undead/demons)
        if (hasAshbringer) {
            const isWeakTarget = e.type === 'undead' || e.type === 'demon' || e.isBoss;
            const holyDmg = drainBase * (isWeakTarget ? 2 : 1);
            const result = calcDamage(player, holyDmg, DMG_TYPE.HOLY, e);
            applyDamage(player, e, result, 'aura_ashbringer', { enemies });

            const heal = safeNum(player.maxHp) * ASHBRINGER_HEAL_PCT;
            player.hp = Math.min(safeNum(player.maxHp), safeNum(player.hp) + heal);
            if (fx) fx.emitHeal(player.x, player.y);
        }

        // 2. Drain Aura (Frostmourne / Shadowmourne)
        if (player._hasDrainAura) {
            const drainType = player._drainType === 'shadow' ? DMG_TYPE.SHADOW : DMG_TYPE.COLD;
            const result = calcDamage(player, drainBase, drainType, e);
            applyDamage(player, e, result, 'aura_drain', { enemies });

            const color = drainType === DMG_TYPE.SHADOW ? '#a040ff' : '#6aaeff';
            if (fx) fx.emitBurst(e.x, e.y, color, 4, 1.2);

            if (hasShadowmourne) {
                player._soulFragments = Math.min(SOULFRAGS_MAX, safeNum(player._soulFragments) + 1);
            }
            if (hasFrostmourne) {
                player.boneArmor = Math.min(safeNum(player.maxHp), safeNum(player.boneArmor) + drainBase * 0.2);
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  PROC HANDLERS  (registered in PROC_MAP)
// ─────────────────────────────────────────────────────────────

const PROC_MAP = {
    soul_stack: _handleSoulStack,
    chain_lightning: _handleChainLightning,
    meteor_drop: _handleMeteorDrop,
    divine_shield: _handleDivineShield,
    arcane_burst: _handleArcaneBurst,
    soul_rip: _handleSoulRip,
    blade_dance: _handleBladeDance,
    stellar_arrow: _handleStellarArrow,
    consecration: _handleConsecration,
    army_of_dead: _handleArmyOfTheDead,
    // New procs:
    void_storm: _handleVoidStorm,
    infernal_brand: _handleInfernalBrand,
};

function _handleSoulStack(attacker, target, proc, synFX, mult, enemies) {
    attacker._shadowmourneStacks = safeNum(attacker._shadowmourneStacks) + 1;

    if (proc.armorShred && target._statuses) {
        const shredCap = synFX.includes('armor_shred_stack') ? 999 : 3;
        const existing = target._statuses.filter(s => s.type === 'armor_shred').length;
        if (existing < shredCap) {
            const amt = safeNum(proc.armorShredAmt, 80);
            target._statuses.push({ type: 'armor_shred', duration: 12, value: -amt });
            target.armorDebuff = safeNum(target.armorDebuff) + amt;
        }
    }

    const stackMax = synFX.includes('faster_stacks') ? 6 : safeNum(proc.maxStacks, 10);
    if (attacker._shadowmourneStacks >= stackMax) {
        attacker._shadowmourneStacks = 0;
        const explodeDmg = Math.round(safeNum(proc.explodeDmg, 500) * mult);

        for (const e of enemies) {
            if (safeNum(e.hp) > 0 && Math.hypot(e.x - target.x, e.y - target.y) < 200) {
                e.hp = Math.max(0, safeNum(e.hp) - explodeDmg);
                if (synFX.includes('soul_drain_aoe'))
                    attacker.hp = Math.min(safeNum(attacker.maxHp), safeNum(attacker.hp) + Math.round(explodeDmg * 0.2));
            }
        }

        if (fx) { fx.emitBurst(target.x, target.y, '#8800cc', 80, 6); fx.shake(600, 12); }
        if (synFX.includes('spawn_revenant'))
            bus.emit('proc:army_of_dead', { x: attacker.x, y: attacker.y, count: 2, duration: 15 });
        bus.emit('combat:log', { text: '★ SOUL REND!', cls: 'log-crit' });
    } else if (fx) {
        fx.emitBurst(target.x, target.y, '#660088', 6, 2);
    }
}

function _handleChainLightning(attacker, target, proc, synFX, mult, enemies) {
    const maxBounces = safeNum(proc.targets, 3) + (synFX.includes('extra_bounce') ? 2 : 0);
    const chainDmg = Math.round(safeNum(proc.damage, 80) * mult);
    let lastPos = { x: target.x, y: target.y };
    const hitSet = new Set([target]);
    let bounced = 0;

    const sorted = enemies
        .filter(e => safeNum(e.hp) > 0 && !hitSet.has(e))
        .sort((a, b) =>
            Math.hypot(a.x - lastPos.x, a.y - lastPos.y) -
            Math.hypot(b.x - lastPos.x, b.y - lastPos.y)
        );

    for (const e of sorted) {
        if (bounced >= maxBounces) break;
        if (Math.hypot(e.x - lastPos.x, e.y - lastPos.y) < 280) {
            e.hp = Math.max(0, safeNum(e.hp) - chainDmg);
            fx?.emitLightning?.(lastPos.x, lastPos.y, e.x, e.y, 3);
            lastPos = { x: e.x, y: e.y };
            hitSet.add(e);
            bounced++;
            if (synFX.includes('paralysis') || synFX.includes('chain_overload'))
                applyStatus(e, 'stun', 0.5, 0);
        }
    }
    bus.emit('combat:log', { text: '⚡ Chain Lightning!', cls: 'log-crit' });
}

function _handleMeteorDrop(attacker, target, proc, synFX, mult, enemies) {
    const meteorDmg = Math.round(safeNum(proc.damage, 350) * mult);
    const meteorRadius = safeNum(proc.radius, 120) * (synFX.includes('aoe_expand') ? 1.5 : 1);

    if (fx) { fx.emitBurst(target.x, target.y, '#ff4400', 60, 5); fx.shake(800, 15); }

    for (const e of (enemies || [])) {
        if (safeNum(e.hp) > 0 && Math.hypot(e.x - target.x, e.y - target.y) < meteorRadius) {
            e.hp = Math.max(0, safeNum(e.hp) - meteorDmg);
            if (synFX.includes('burn_dot')) applyStatus(e, 'burn', 5, 150);
        }
    }
    bus.emit('combat:log', { text: '🔥 Meteor!', cls: 'log-crit' });
}

function _handleDivineShield(attacker, target, proc, synFX, mult, enemies) {
    const dur = safeNum(proc.duration, 8);
    attacker.divineShield = safeNum(attacker.divineShield) + Math.round(safeNum(proc.shieldHp, 800) * mult);
    attacker._divineShieldTimer = dur;

    if (!attacker._buffs) attacker._buffs = [];
    const ext = attacker._buffs.find(b => b.id === 'divine_shield_proc');
    if (ext) ext.duration = dur;
    else attacker._buffs.push({ id: 'divine_shield_proc', type: 'divine_shield_proc', duration: dur, name: 'Divine Shield' });

    if (synFX.includes('reflect_dmg')) attacker._divineShieldReflect = 0.3;
    if (synFX.includes('heal_party')) bus.emit('proc:heal_party', { x: attacker.x, y: attacker.y, amount: 200, radius: 150 });
    if (fx) fx.emitHolyBurst?.(attacker.x, attacker.y);
    bus.emit('combat:log', { text: '💛 Divine Shield!', cls: 'log-crit' });
}

function _handleArcaneBurst(attacker, target, proc, synFX, mult, enemies) {
    const arcDmg = Math.round(safeNum(proc.damage, 200) * mult);
    const arcRad = safeNum(proc.radius, 80) * (synFX.includes('aoe_expand') ? 1.5 : 1);

    if (fx) fx.emitBurst(target.x, target.y, '#aa44ff', 40, 4);

    for (const e of enemies) {
        if (safeNum(e.hp) > 0 && Math.hypot(e.x - target.x, e.y - target.y) < arcRad) {
            e.hp = Math.max(0, safeNum(e.hp) - arcDmg);
            if (proc.manaShred && e.mp !== undefined)
                e.mp = Math.max(0, safeNum(e.mp) - safeNum(proc.manaShredAmt, 120));
        }
    }

    if (synFX.includes('mana_storm'))
        attacker.mp = Math.min(safeNum(attacker.maxMp), safeNum(attacker.mp) + Math.round(safeNum(attacker.maxMp) * 0.15));
    bus.emit('combat:log', { text: '✨ Arcane Burst!', cls: 'log-crit' });
}

function _handleSoulRip(attacker, target, proc, synFX, mult, enemies) {
    const ripDmg = Math.round(safeNum(proc.damage, 150) * mult);

    if (proc.aoe) {
        for (const e of enemies) {
            if (safeNum(e.hp) > 0 && Math.hypot(e.x - target.x, e.y - target.y) < safeNum(proc.aoeRadius, 100))
                e.hp = Math.max(0, safeNum(e.hp) - Math.round(ripDmg * 0.6));
        }
    }

    target.hp = Math.max(0, safeNum(target.hp) - ripDmg);
    attacker.hp = Math.min(safeNum(attacker.maxHp), safeNum(attacker.hp) + ripDmg * 0.5);

    if (proc.freeze)
        applyStatus(target, 'frozen', safeNum(proc.freezeDuration, 3) + (synFX.includes('deep_freeze') ? 3 : 0), 0);

    if (fx) fx.emitBurst(target.x, target.y, '#44eeff', 30, 3);
    bus.emit('combat:log', { text: '❄️ Soul Rip!', cls: 'log-crit' });
}

function _handleBladeDance(attacker, target, proc, synFX, mult, enemies) {
    const hits = safeNum(proc.hits, 3) + (synFX.includes('extra_hit') ? 1 : 0);
    const hitDmg = Math.round(safeNum(proc.damage, 60) * mult);

    for (let i = 0; i < hits; i++) {
        setTimeout(() => {
            if (safeNum(target.hp) <= 0) return;
            target.hp = Math.max(0, safeNum(target.hp) - hitDmg);
            if (fx) fx.emitSlash?.(target.x, target.y, Math.random() * Math.PI * 2, '#00ff88', 30);
            if (proc.poisonOnHit)
                applyDot(target, Math.round(50 * mult), DMG_TYPE.POISON, 6, `blade_dance_poison_${i}`);
        }, i * 80);
    }
    bus.emit('combat:log', { text: '🌀 Blade Dance!', cls: 'log-crit' });
}

function _handleStellarArrow(attacker, target, proc, synFX, mult, enemies) {
    if (fx) fx.emitBurst(target.x, target.y, '#ffffaa', 20, 3);

    const dx = target.x - attacker.x, dy = target.y - attacker.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len, ny = dy / len;

    for (const e of enemies) {
        if (safeNum(e.hp) <= 0) continue;
        const ex = e.x - attacker.x, ey = e.y - attacker.y;
        const dot = ex * nx + ey * ny;
        if (dot > 0 && Math.abs(ex * ny - ey * nx) < 40)
            e.hp = Math.max(0, safeNum(e.hp) - Math.round(safeNum(proc.damage, 120) * mult));
    }
    bus.emit('combat:log', { text: '⭐ Stellar Arrow!', cls: 'log-crit' });
}

function _handleConsecration(attacker, target, proc, synFX, mult, enemies) {
    const cDmg = Math.round(safeNum(proc.damage, 100) * mult);
    const cRad = safeNum(proc.radius, 90) * (synFX.includes('aoe_expand') ? 1.5 : 1);

    for (const e of enemies) {
        if (safeNum(e.hp) > 0 && Math.hypot(e.x - attacker.x, e.y - attacker.y) < cRad) {
            e.hp = Math.max(0, safeNum(e.hp) - cDmg);
            if (synFX.includes('holy_fire')) applyStatus(e, 'burn', 6, Math.round(cDmg * 0.4));
        }
    }

    attacker.hp = Math.min(safeNum(attacker.maxHp), safeNum(attacker.hp) + Math.round(safeNum(proc.healPlayer, 50) * mult));
    if (fx) fx.emitHolyBurst?.(attacker.x, attacker.y);
    bus.emit('combat:log', { text: '✝️ Consecration!', cls: 'log-crit' });
}

function _handleArmyOfTheDead(attacker, target, proc, synFX, mult, enemies) {
    bus.emit('proc:army_of_dead', { x: attacker.x, y: attacker.y, count: safeNum(proc.count, 3), duration: safeNum(proc.duration, 12) });
    if (fx) fx.emitBurst(attacker.x, attacker.y, '#334466', 50, 5);
    bus.emit('combat:log', { text: '💀 Army of the Dead!', cls: 'log-crit' });
}

// ── New proc: Void Storm — chaos AoE that leaves lingering DoT zones ──────
function _handleVoidStorm(attacker, target, proc, synFX, mult, enemies) {
    const dmg = Math.round(safeNum(proc.damage, 180) * mult);
    const rad = safeNum(proc.radius, 110) * (synFX.includes('aoe_expand') ? 1.5 : 1);
    const dur = safeNum(proc.dotDuration, 4);

    if (fx) fx.emitBurst(target.x, target.y, '#330066', 50, 5);

    for (const e of enemies) {
        if (safeNum(e.hp) > 0 && Math.hypot(e.x - target.x, e.y - target.y) < rad) {
            e.hp = Math.max(0, safeNum(e.hp) - dmg);
            applyDot(e, Math.round(dmg * 0.3), DMG_TYPE.SHADOW, dur, 'void_storm');
            applyStatus(e, 'vulnerability', 6, 1); // +1 vuln stack
        }
    }
    bus.emit('combat:log', { text: '🌀 Void Storm!', cls: 'log-crit' });
}

// ── New proc: Infernal Brand — marks target; next hit detonates for 500 % dmg ─
function _handleInfernalBrand(attacker, target, proc, synFX, mult, enemies) {
    if (target._infernalBrand) {
        // Detonate
        const detonateDmg = Math.round(target._infernalBrandDmg * 5.0 * mult);
        target.hp = Math.max(0, safeNum(target.hp) - detonateDmg);
        target._infernalBrand = false;
        target._infernalBrandDmg = 0;
        if (fx) { fx.emitBurst(target.x, target.y, '#ff6600', 70, 6); fx.shake(500, 10); }
        bus.emit('combat:log', { text: '💥 INFERNAL BRAND DETONATES!', cls: 'log-crit' });
    } else {
        target._infernalBrand = true;
        target._infernalBrandDmg = safeNum(proc.brandDmg, 100) * mult;
        if (fx) fx.emitBurst(target.x, target.y, '#cc4400', 20, 2);
        bus.emit('combat:log', { text: '🔥 Infernal Brand applied!', cls: 'log-dmg' });
    }
}

// ─────────────────────────────────────────────────────────────
//  EXTRA EFFECT DISPATCHER  (on-hit item secondary effects)
// ─────────────────────────────────────────────────────────────

function _handleExtraEffect(attacker, target, proc, mult, dealt) {
    switch (proc.extraEffect) {
        case 'lightning_overload':
            if (Math.random() < 0.3) {
                fx?.emitLightning?.(target.x, target.y, target.x, target.y - 100, 2);
                target.hp = Math.max(0, safeNum(target.hp) - Math.round(dealt * 0.5));
            }
            break;
        case 'dragon_breath':
            if (fx) fx.emitBurst(target.x, target.y, '#ff8800', 20, 4);
            applyStatus(target, 'burn', 3, Math.round(100 * mult));
            break;
        case 'blizzard_veil':
            applyStatus(attacker, 'shielded', 4, 200);
            if (attacker._buffs) {
                const ext = attacker._buffs.find(b => b.id === 'blizzard_veil_proc');
                if (ext) ext.duration = 4;
                else attacker._buffs.push({ id: 'blizzard_veil_proc', type: 'blizzard_veil_proc', duration: 4, name: 'Blizzard Veil' });
            }
            break;
        case 'void_wound':
            applyDot(target, Math.round(150 * mult), DMG_TYPE.SHADOW, 5, 'void_reaper');
            break;
        case 'bone_shatter':
            target.armorDebuff = safeNum(target.armorDebuff) + 50;
            break;
    }
}

// ─────────────────────────────────────────────────────────────
//  EQUIPMENT PROC DISPATCHER
// ─────────────────────────────────────────────────────────────

function _fireEquipmentProcs(attacker, target, dealt, enemies) {
    if (!attacker || dealt <= 0 || !attacker.equipment) return;

    const isHero = attacker.isPlayer || attacker.isMercenary || attacker.type === 'mercenary';
    if (!isHero) return;

    for (const item of Object.values(attacker.equipment)) {
        if (!item?.onHit) continue;
        const proc = item.onHit;

        let synMult = 1.0, synChance = 0, synFX = [];
        if (attacker.isPlayer) {
            const syn = evaluateSynergies(attacker, proc, item.id || '');
            synMult = syn.mult;
            synChance = syn.chanceBonus;
            synFX = syn.bonusEffects;
        }

        const effectiveChance = safeNum(proc.chance) + synChance;
        if (Math.random() >= effectiveChance) continue;

        // Stat scaling by proc type
        const scaleStat = (['chain_lightning', 'arcane_burst', 'soul_rip', 'meteor_drop', 'void_storm'].includes(proc.effect))
            ? 'int'
            : (['blade_dance', 'stellar_arrow'].includes(proc.effect)) ? 'dex' : 'str';

        const statVal = safeNum(attacker[scaleStat], 10);
        const finalMult = synMult * (1 + statVal / 100);

        const handler = PROC_MAP[proc.effect];
        if (handler) {
            handler(attacker, target, proc, synFX, finalMult, enemies);
        } else {
            // Unrecognised proc — skip silently (don't throw)
            if (process?.env?.NODE_ENV !== 'production')
                console.warn(`[CombatSystem] Unknown proc effect: "${proc.effect}"`);
        }

        if (proc.extraEffect) _handleExtraEffect(attacker, target, proc, finalMult, dealt);
    }
}

// ─────────────────────────────────────────────────────────────
//  KILL LOGIC
// ─────────────────────────────────────────────────────────────

function _onKillLogic(killer, victim) {
    if (!killer || !victim) return;

    // Death Mark CD reset
    if (victim._statuses?.some(s => s.type === 'death_mark') && killer.isPlayer && killer.cooldowns) {
        killer.cooldowns.fill(0);
        bus.emit('combat:log', { text: 'DEATH MARK RESET!', cls: 'log-crit' });
    }

    // Momentum (new): killing blow gives attacker +10 % dmg for 5 s
    if (killer.isPlayer) {
        applyStatus(killer, 'momentum', 5, 10, { name: 'Momentum', desc: '+10% damage after kill' });
    }
}

// ─────────────────────────────────────────────────────────────
//  DURABILITY HELPERS  (private)
// ─────────────────────────────────────────────────────────────

function _tickDurability(entity, slot, chance) {
    if (!entity?.equipment) return;
    const item = entity.equipment[slot];
    if (!item || safeNum(item.maxDurability) <= 0 || safeNum(item.durability) <= 0) return;
    if (item.mods?.some(m => m.stat === 'indestructible')) return;
    if (Math.random() < chance) {
        item.durability--;
        if (item.durability <= 0) bus.emit('item:broken', { item, slot });
    }
}

function _tickDurabilityRandom(entity, slots, chance) {
    if (!entity?.equipment) return;
    const slot = slots[Math.floor(Math.random() * slots.length)];
    _tickDurability(entity, slot, chance);
}

// ─────────────────────────────────────────────────────────────
//  EVENT EMIT HELPER  (private)
// ─────────────────────────────────────────────────────────────

function _emitDamage(attacker, target, dealt, isCrit, type, skillId = null) {
    bus.emit('combat:damage', {
        attacker, target, dealt, isCrit, type, skillId,
        worldX: target?.x, worldY: target?.y,
    });
}