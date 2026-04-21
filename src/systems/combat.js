/**
 * Combat System
 * Damage formula, resistances, crits, DoTs, life steal — D2-inspired.
 */
import { bus } from '../engine/EventBus.js';
import { fx } from '../engine/ParticleSystem.js';
import { evaluateSynergies } from './synergyEngine.js';

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

// ─────────────────────────────────────────────────────────────
//  CORE DAMAGE CALCULATION
// ─────────────────────────────────────────────────────────────

/**
 * Core damage calculation.
 * @param {object} attacker - player or enemy stat snapshot
 * @param {number} baseDmg  - skill/weapon base damage
 * @param {string} type     - DMG_TYPE
 * @param {object} defender - target entity
 * @returns {{ dealt:number, isCrit:bool, type:string }}
 */
export function calcDamage(attacker, baseDmg, type, defender) {
    if (!attacker || !defender) return { dealt: 0, isCrit: false, type };

    if (isBlinded(attacker) && Math.random() < 0.5) {
        return { dealt: 0, isCrit: false, type, missed: true };
    }

    let dmg = Number(baseDmg) || 0;

    // Attacker bonuses
    const pct = (attacker[`pct${cap(type)}Dmg`] || 0) + (attacker.pctDmg || 0);
    dmg *= 1 + pct / 100;

    // Critical hit (standard)
    const critChance = attacker.critChance || 0;
    const isCrit = Math.random() * 100 < critChance;
    if (isCrit) dmg *= 1 + (attacker.critMulti || 150) / 100;

    // Deadly Strike (D2 classic: double physical damage)
    let isDeadlyStrike = false;
    if (type === DMG_TYPE.PHYSICAL && attacker.deadlyStrike > 0) {
        if (Math.random() * 100 < attacker.deadlyStrike) {
            dmg *= 2;
            isDeadlyStrike = true;
        }
    }

    // Flat min damage bonus
    dmg += attacker.flatMinDmg || 0;

    // Crushing Blow (D2 classic)
    if (attacker.crushingBlow > 0 && Math.random() * 100 < attacker.crushingBlow) {
        const reductionPct = defender.type === 'boss' ? 0.10 : 0.25;
        dmg += Math.round(defender.hp * reductionPct);
        bus.emit('combat:log', {
            text: `CRUSHING BLOW! (-${Math.round(reductionPct * 100)}% HP)`,
            cls: 'log-crit',
        });
        if (fx) fx.emitHolyBurst(defender.x, defender.y);
    }

    // Open Wounds (D2 classic: bleed DoT)
    if (attacker.openWounds > 0 && Math.random() * 100 < attacker.openWounds) {
        const bleedDmg = Math.round(10 + (attacker.level || 1) * 2);
        applyDot(defender, bleedDmg, DMG_TYPE.PHYSICAL, 8, 'open_wounds');
        bus.emit('combat:log', { text: 'OPEN WOUNDS!', cls: 'log-dmg' });
    }

    // Open Wounds (D2 classic: bleed DoT)
    if (attacker.openWounds > 0 && Math.random() * 100 < attacker.openWounds) {
        const bleedDmg = Math.round(10 + (attacker.level || 1) * 2);
        applyDot(defender, bleedDmg, DMG_TYPE.PHYSICAL, 8, 'open_wounds');
        bus.emit('combat:log', { text: 'OPEN WOUNDS!', cls: 'log-dmg' });
    }

    // Defender resistance (magic & holy bypass)
    if (defender[`${type}Immune`]) {
        dmg = 0;
    } else if (type !== DMG_TYPE.MAGIC && type !== DMG_TYPE.HOLY) {
        let res = (defender[`${type}Res`] || 0) - (defender.resDebuff || 0);
        res = Math.min(75, Math.max(-100, res));
        dmg *= 1 - res / 100;
    }

    // Armor reduction (physical only)
    if (type === DMG_TYPE.PHYSICAL) {
        const armor = Math.max(0, (defender.armor || 0) - (defender.armorDebuff || 0));
        const atkLevel = Math.max(1, attacker.level || 1);
        const divisor = armor + 5 * atkLevel * 10;
        const reduction = divisor > 0 ? armor / divisor : 0;
        dmg *= 1 - Math.min(0.75, reduction);
    }

    // Percentage damage reduction
    if (defender.pctDmgReduce) dmg *= 1 - Math.min(50, defender.pctDmgReduce) / 100;

    // Flat damage reduction
    if (type === DMG_TYPE.MAGIC && defender.magicDmgReduce) {
        dmg -= defender.magicDmgReduce;
    } else if (defender.flatDmgReduce) {
        dmg -= defender.flatDmgReduce;
    }

    // Damage Taken Multiplier (Mark for Death / Amplify Damage)
    if (defender.dmgTakenMult) dmg *= defender.dmgTakenMult;

    dmg = Math.max(defender[`${type}Immune`] ? 0 : 1, Math.round(dmg));
    if (isNaN(dmg)) dmg = 1;

    return { dealt: dmg, isCrit, type };
}

// ─────────────────────────────────────────────────────────────
//  DAMAGE-OVER-TIME
// ─────────────────────────────────────────────────────────────

/**
 * Register a DoT (damage over time) on a target.
 */
export function applyDot(target, dmgPerSec, type, durationSec, source) {
    if (!target._dots) target._dots = [];
    // Remove existing same-source dot (refresh)
    target._dots = target._dots.filter(d => d.source !== source);
    target._dots.push({
        id: `dot_${Date.now()}_${Math.random()}`,
        dmgPerSec, type, remaining: durationSec, source, tick: 0,
    });
}

// ─────────────────────────────────────────────────────────────
//  PROC HANDLERS  (one function per proc effect)
// ─────────────────────────────────────────────────────────────

function handleSoulStack(attacker, target, proc, synFX, finalProcMult) {
    if (!attacker._shadowmourneStacks) attacker._shadowmourneStacks = 0;
    attacker._shadowmourneStacks++;

    // Armor shred stacking
    if (proc.armorShred && target._statuses) {
        const shreds = target._statuses.filter(s => s.type === 'armor_shred').length;
        const shredCap = synFX.includes('armor_shred_stack') ? 999 : 3;
        if (shreds < shredCap) {
            const shredAmt = proc.armorShredAmt || 80;
            target._statuses.push({ type: 'armor_shred', duration: 12, value: -shredAmt });
            target.armorDebuff = (target.armorDebuff || 0) + shredAmt;
        }
    }

    const stackMax = synFX.includes('faster_stacks') ? 6 : (proc.maxStacks || 10);
    if (attacker._shadowmourneStacks >= stackMax) {
        attacker._shadowmourneStacks = 0;
        const explodeDmg = Math.round((proc.explodeDmg || 500) * finalProcMult);

        window.enemies?.forEach(e => {
            if (e.hp > 0 && Math.hypot(e.x - target.x, e.y - target.y) < 200) {
                e.hp = Math.max(0, e.hp - explodeDmg);
                if (synFX.includes('soul_drain_aoe'))
                    attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.round(explodeDmg * 0.2));
            }
        });

        if (fx) { fx.emitBurst(target.x, target.y, '#8800cc', 80, 6); fx.shake(600, 12); }
        if (synFX.includes('spawn_revenant'))
            bus.emit('proc:army_of_dead', { x: attacker.x, y: attacker.y, count: 2, duration: 15 });
        bus.emit('combat:log', { text: '★ SOUL REND!', cls: 'log-crit' });
    } else if (fx) {
        fx.emitBurst(target.x, target.y, '#660088', 6, 2);
    }
}

function handleChainLightning(attacker, target, proc, synFX, finalProcMult) {
    bus.emit('combat:log', { text: '⚡ Chain Lightning proc!', cls: 'log-crit' });
    let lastPos = { x: target.x, y: target.y };
    const maxBounces = (proc.targets || 3) + (synFX.includes('extra_bounce') ? 2 : 0);
    const chainDmg = Math.round((proc.damage || 80) * finalProcMult);
    const hitSet = new Set([target]);
    let bounced = 0;

    if (window.enemies) {
        const sorted = window.enemies
            .filter(e => e.hp > 0 && !hitSet.has(e))
            .sort((a, b) =>
                Math.hypot(a.x - lastPos.x, a.y - lastPos.y) -
                Math.hypot(b.x - lastPos.x, b.y - lastPos.y)
            );

        for (const e of sorted) {
            if (bounced >= maxBounces) break;
            if (Math.hypot(e.x - lastPos.x, e.y - lastPos.y) < 280) {
                e.hp = Math.max(0, e.hp - chainDmg);
                if (fx?.emitLightning) fx.emitLightning(lastPos.x, lastPos.y, e.x, e.y, 3);
                lastPos = { x: e.x, y: e.y };
                hitSet.add(e);
                bounced++;
                if (synFX.includes('paralysis') || synFX.includes('chain_overload'))
                    e._statuses?.push({ type: 'stun', duration: 0.5, value: 0 });
            }
        }
    }
}

function handleMeteorDrop(target, proc, synFX, finalProcMult) {
    bus.emit('combat:log', { text: '🔥 Meteor proc!', cls: 'log-crit' });
    const meteorDmg = Math.round((proc.damage || 350) * finalProcMult);
    const meteorRadius = (proc.radius || 120) * (synFX.includes('aoe_expand') ? 1.5 : 1);

    if (fx) { fx.emitBurst(target.x, target.y, '#ff4400', 60, 5); fx.shake(800, 15); }

    window.enemies?.forEach(e => {
        if (e.hp > 0 && Math.hypot(e.x - target.x, e.y - target.y) < meteorRadius) {
            e.hp = Math.max(0, e.hp - meteorDmg);
            if (synFX.includes('burn_dot'))
                e._statuses?.push({ type: 'burn', duration: 5, value: 150 });
        }
    });
}

function handleDivineShield(attacker, proc, synFX, finalProcMult) {
    bus.emit('combat:log', { text: '💛 Divine Shield proc!', cls: 'log-crit' });
    const dsDur = proc.duration || 8;
    attacker.divineShield = (attacker.divineShield || 0) + Math.round((proc.shieldHp || 800) * finalProcMult);
    attacker._divineShieldTimer = dsDur;

    if (attacker._buffs) {
        const ext = attacker._buffs.find(b => b.id === 'divine_shield_proc');
        if (ext) ext.duration = dsDur;
        else attacker._buffs.push({ id: 'divine_shield_proc', type: 'divine_shield_proc', duration: dsDur, name: 'Divine Shield' });
    }

    if (synFX.includes('reflect_dmg')) attacker._divineShieldReflect = 0.3;
    if (synFX.includes('heal_party')) bus.emit('proc:heal_party', { x: attacker.x, y: attacker.y, amount: 200, radius: 150 });
    if (fx) fx.emitHolyBurst?.(attacker.x, attacker.y);
}

function handleArcaneBurst(attacker, target, proc, synFX, finalProcMult) {
    bus.emit('combat:log', { text: '✨ Arcane Burst!', cls: 'log-crit' });
    const arcDmg = Math.round((proc.damage || 200) * finalProcMult);
    const arcRad = (proc.radius || 80) * (synFX.includes('aoe_expand') ? 1.5 : 1);

    if (fx) fx.emitBurst(target.x, target.y, '#aa44ff', 40, 4);

    window.enemies?.forEach(e => {
        if (e.hp > 0 && Math.hypot(e.x - target.x, e.y - target.y) < arcRad) {
            e.hp = Math.max(0, e.hp - arcDmg);
            if (proc.manaShred && e.mp !== undefined)
                e.mp = Math.max(0, (e.mp || 0) - (proc.manaShredAmt || 120));
        }
    });

    if (synFX.includes('mana_storm'))
        attacker.mp = Math.min(attacker.maxMp, (attacker.mp || 0) + Math.round(attacker.maxMp * 0.15));
}

function handleSoulRip(attacker, target, proc, synFX, finalProcMult) {
    bus.emit('combat:log', { text: '❄️ Soul Rip!', cls: 'log-crit' });
    const ripDmg = Math.round((proc.damage || 150) * finalProcMult);

    if (proc.aoe) {
        window.enemies?.forEach(e => {
            if (e.hp > 0 && Math.hypot(e.x - target.x, e.y - target.y) < (proc.aoeRadius || 100))
                e.hp = Math.max(0, e.hp - Math.round(ripDmg * 0.6));
        });
    }

    target.hp = Math.max(0, target.hp - ripDmg);
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + ripDmg * 0.5);

    if (proc.freeze && target._statuses)
        target._statuses.push({
            type: 'frozen',
            duration: (proc.freezeDuration || 3) + (synFX.includes('deep_freeze') ? 3 : 0),
            value: 0,
        });

    if (fx) fx.emitBurst(target.x, target.y, '#44eeff', 30, 3);
}

function handleBladeDance(target, proc, synFX, finalProcMult) {
    bus.emit('combat:log', { text: '🌀 Blade Dance!', cls: 'log-crit' });
    const hits = (proc.hits || 3) + (synFX.includes('extra_hit') ? 1 : 0);
    const hitDmg = Math.round((proc.damage || 60) * finalProcMult);

    for (let i = 0; i < hits; i++) {
        setTimeout(() => {
            if (target.hp <= 0) return;
            target.hp = Math.max(0, target.hp - hitDmg);
            if (fx) fx.emitSlash?.(target.x, target.y, Math.random() * Math.PI * 2, '#00ff88', 30);
            if (proc.poisonOnHit)
                target._statuses?.push({ type: 'poison', duration: 6, value: Math.round(50 * finalProcMult) });
        }, i * 80);
    }
}

function handleStellarArrow(attacker, target, proc, finalProcMult) {
    bus.emit('combat:log', { text: '⭐ Stellar Arrow!', cls: 'log-crit' });
    if (fx) fx.emitBurst(target.x, target.y, '#ffffaa', 20, 3);

    if (window.enemies) {
        const dx = target.x - attacker.x, dy = target.y - attacker.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = dx / len, ny = dy / len;

        window.enemies.forEach(e => {
            if (e.hp <= 0) return;
            const ex = e.x - attacker.x, ey = e.y - attacker.y;
            const dot = ex * nx + ey * ny;
            if (dot > 0 && Math.abs(ex * ny - ey * nx) < 40)
                e.hp = Math.max(0, e.hp - (proc.damage || 120) * finalProcMult);
        });
    }
}

function handleConsecration(attacker, proc, synFX, finalProcMult) {
    bus.emit('combat:log', { text: '✝️ Consecration!', cls: 'log-crit' });
    const cDmg = Math.round((proc.damage || 100) * finalProcMult);
    const cRad = (proc.radius || 90) * (synFX.includes('aoe_expand') ? 1.5 : 1);

    window.enemies?.forEach(e => {
        if (e.hp > 0 && Math.hypot(e.x - attacker.x, e.y - attacker.y) < cRad) {
            e.hp = Math.max(0, e.hp - cDmg);
            if (synFX.includes('holy_fire'))
                e._statuses?.push({ type: 'burn', duration: 6, value: Math.round(cDmg * 0.4) });
        }
    });

    attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.round((proc.healPlayer || 50) * finalProcMult));
    if (fx) fx.emitHolyBurst?.(attacker.x, attacker.y);
}

function handleArmyOfTheDead(attacker, proc) {
    bus.emit('combat:log', { text: '💀 Army of the Dead!', cls: 'log-crit' });
    bus.emit('proc:army_of_dead', { x: attacker.x, y: attacker.y, count: proc.count || 3, duration: proc.duration || 12 });
    if (fx) fx.emitBurst(attacker.x, attacker.y, '#334466', 50, 5);
}

/** Handle secondary/extra effects on a proc entry. */
function handleExtraEffect(attacker, target, proc, finalProcMult, dealt) {
    switch (proc.extraEffect) {
        case 'lightning_overload':
            if (Math.random() < 0.3) {
                fx?.emitLightning?.(target.x, target.y, target.x, target.y - 100, 2);
                target.hp = Math.max(0, target.hp - Math.round(dealt * 0.5));
            }
            break;
        case 'dragon_breath':
            if (fx) fx.emitBurst(target.x, target.y, '#ff8800', 20, 4);
            target._statuses?.push({ type: 'burn', duration: 3, value: Math.round(100 * finalProcMult) });
            break;
        case 'blizzard_veil':
            attacker._statuses?.push({ type: 'shielded', duration: 4, value: 200 });
            if (attacker._buffs) {
                const ext = attacker._buffs.find(b => b.id === 'blizzard_veil_proc');
                if (ext) ext.duration = 4;
                else attacker._buffs.push({ id: 'blizzard_veil_proc', type: 'blizzard_veil_proc', duration: 4, name: 'Blizzard Veil' });
            }
            break;
        case 'void_wound':
            applyDot(target, Math.round(150 * finalProcMult), 'shadow', 5, 'void_reaper');
            break;
        case 'bone_shatter':
            target.armorDebuff = (target.armorDebuff || 0) + 50;
            break;
    }
}

/**
 * Fire all on-hit legendary proc effects from attacker's equipment.
 * Called internally by applyDamage.
 */
function fireEquipmentProcs(attacker, target, dealt) {
    const isHero = attacker.isPlayer
        || attacker.type === 'mercenary'
        || attacker.id === 'mercenary'
        || attacker.name === window.mercenary?.name;

    if (!isHero || dealt <= 0 || !attacker.equipment) return;

    for (const weapon of Object.values(attacker.equipment)) {
        if (!weapon?.onHit) continue;

        const proc = weapon.onHit;

        const { mult: synMult, chanceBonus: synChance, bonusEffects: synFX }
            = evaluateSynergies(attacker, proc, weapon.id || '');

        const effectiveProcChance = (proc.chance || 0) + synChance;

        // Stat-based scaling
        let procScaleStat = 'str';
        if (['chain_lightning', 'arcane_burst', 'soul_rip', 'consecration'].includes(proc.effect)) procScaleStat = 'int';
        else if (['blade_dance', 'stellar_arrow'].includes(proc.effect)) procScaleStat = 'dex';
        else if (proc.type === 'shadow' || proc.type === 'fire') procScaleStat = 'int';

        const procStatValue = attacker[procScaleStat] || 10;
        const finalProcMult = synMult * (1 + procStatValue / 100);

        // ── Soul Stack (special: tracks per-weapon, fires at threshold) ────
        if (proc.effect === 'soul_stack') {
            handleSoulStack(attacker, target, proc, synFX, finalProcMult);
            handleExtraEffect(attacker, target, proc, finalProcMult, dealt);
            continue; // soul_stack has its own proc-chance gate inside the handler
        }

        // ── Standard proc chance gate ──────────────────────────────────────
        if (Math.random() >= effectiveProcChance) continue;

        bus.emit('combat:log', {
            text: `✨ Legendary Effect: ${proc.effect.replace(/_/g, ' ').toUpperCase()}!`,
            cls: 'log-crit',
        });

        switch (proc.effect) {
            case 'chain_lightning': handleChainLightning(attacker, target, proc, synFX, finalProcMult); break;
            case 'meteor_drop': handleMeteorDrop(target, proc, synFX, finalProcMult); break;
            case 'divine_shield': handleDivineShield(attacker, proc, synFX, finalProcMult); break;
            case 'arcane_burst': handleArcaneBurst(attacker, target, proc, synFX, finalProcMult); break;
            case 'soul_rip': handleSoulRip(attacker, target, proc, synFX, finalProcMult); break;
            case 'blade_dance': handleBladeDance(target, proc, synFX, finalProcMult); break;
            case 'stellar_arrow': handleStellarArrow(attacker, target, proc, finalProcMult); break;
            case 'consecration': handleConsecration(attacker, proc, synFX, finalProcMult); break;
            case 'army_of_the_dead': handleArmyOfTheDead(attacker, proc); break;
        }

        handleExtraEffect(attacker, target, proc, finalProcMult, dealt);
    }
}

// ─────────────────────────────────────────────────────────────
//  APPLY DAMAGE  (main entry point)
// ─────────────────────────────────────────────────────────────

/**
 * Apply a calcDamage result to a target entity.
 * Handles shields, life steal, knockback, procs, and death.
 */
export function applyDamage(attacker, target, dmgResult, skillId = null) {
    const { dealt, isCrit, type } = dmgResult;

    // ── Block ──────────────────────────────────────────────────────────────
    if (target.blockChance && type === DMG_TYPE.PHYSICAL && dealt > 0) {
        if (Math.random() * 100 < Math.min(75, target.blockChance)) {
            bus.emit('combat:damage', { attacker, target, dealt: 'Blocked!', isCrit: false, type: 'physical', worldX: target.x, worldY: target.y });
            return;
        }
    }

    if (dmgResult.missed) {
        bus.emit('combat:damage', { attacker, target, dealt: 'Miss!', isCrit: false, type, worldX: target.x, worldY: target.y });
        return;
    }

    let finalDealt = dealt;

    // ── Bone Armor (Necro) ─────────────────────────────────────────────────
    if (target.boneArmor > 0 && type === DMG_TYPE.PHYSICAL) {
        const absorb = Math.min(finalDealt, target.boneArmor);
        target.boneArmor -= absorb;
        finalDealt -= absorb;
        bus.emit('combat:log', { text: `Absorbed! (${target.boneArmor} left)`, cls: 'log-info' });
        if (target.boneArmor <= 0) {
            target._statuses = target._statuses?.filter(s => s.type !== 'bone_armor');
            bus.emit('combat:log', { text: 'Bone Armor Shattered!', cls: 'log-dmg' });
        }
    }

    // ── Energy Shield (Sorc) ───────────────────────────────────────────────
    const es = target._statuses?.find(s => s.type === 'energy_shield');
    if (es && finalDealt > 0) {
        const pct = es.value / 100;
        const toMana = Math.floor(finalDealt * pct);
        const manaCost = Math.floor(toMana * 0.75);
        if (target.mp >= manaCost) {
            target.mp -= manaCost;
            finalDealt -= toMana;
            bus.emit('combat:log', { text: 'Mana Transferred!', cls: 'log-mp' });
        } else {
            target._statuses = target._statuses.filter(s => s.type !== 'energy_shield');
            bus.emit('combat:log', { text: 'Energy Shield Collapsed!', cls: 'log-dmg' });
        }
    }

    // ── Divine Shield (defender) ───────────────────────────────────────────
    if (target.isPlayer && target.divineShield > 0) {
        const absorbed = Math.min(finalDealt, target.divineShield);
        target.divineShield -= absorbed;
        finalDealt -= absorbed;
        if (target.divineShield <= 0) {
            target.divineShield = 0;
            bus.emit('combat:log', { text: 'Divine Shield shattered!', cls: 'log-dmg' });
        }
    }

    // ── Apply HP loss ──────────────────────────────────────────────────────
    target.hp = Math.max(0, target.hp - finalDealt);

    // ── PvP Duel Protection ────────────────────────────────────────────────
    const isDuel = window.network?.duelOpponentId &&
        (target.id === window.network.duelOpponentId || target.syncId === window.network.duelOpponentId);
    if (isDuel && target.hp < 1) {
        target.hp = 1;
        bus.emit('combat:log', { text: 'DUEL FINISHED!', cls: 'log-level' });
        if (attacker) window.network?.socket.emit('duel_end', { winner: attacker.charName });
    }

    if (finalDealt > 0) target.lastAttacker = attacker ? (attacker.name || attacker.charName) : (skillId || 'Environment');

    // ── Sensory Feedback ───────────────────────────────────────────────────
    if (dealt > 0) {
        target.hitFlashTimer = 0.12;
        if (fx) {
            if (isCrit) fx.shake(250, 5);
            if (attacker) {
                const angle = Math.atan2(target.y - attacker.y, target.x - attacker.x);
                if (type === DMG_TYPE.PHYSICAL || type === DMG_TYPE.HOLY) fx.emitBlood(target.x, target.y, angle);
                else fx.emitHitImpact(target.x, target.y, type);
            } else {
                fx.emitHitImpact(target.x, target.y, type);
            }
        }
    }

    // ── Life / Mana Steal (player) ─────────────────────────────────────────
    if (attacker && attacker.isPlayer) {
        if (attacker.lifeStealPct)
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.round(dealt * attacker.lifeStealPct / 100));
        if (attacker.manaStealPct)
            attacker.mp = Math.min(attacker.maxMp, (attacker.mp || 0) + Math.round(dealt * attacker.manaStealPct / 100));
    }

    // ── Thorns ─────────────────────────────────────────────────────────────
    if (target.isPlayer && target.thorns && type === DMG_TYPE.PHYSICAL && !attacker.isPlayer) {
        attacker.hp = Math.max(0, attacker.hp - target.thorns);
        bus.emit('combat:damage', { attacker: target, target: attacker, dealt: target.thorns, isCrit: false, type: 'physical', worldX: attacker.x, worldY: attacker.y });
    }

    // ── Durability Loss ────────────────────────────────────────────────────
    if (attacker.isPlayer && attacker.equipment?.mainhand) {
        const item = attacker.equipment.mainhand;
        const isIndestructible = item.mods?.some(m => m.stat === 'indestructible');
        if (!isIndestructible && item.maxDurability > 0 && item.durability > 0 && Math.random() < 0.1) {
            item.durability--;
            if (item.durability === 0) bus.emit('item:broken', { item, slot: 'mainhand' });
        }
    }

    if (target.isPlayer && target.equipment) {
        const slots = ['chest', 'head', 'offhand', 'gloves', 'boots'];
        const slot = slots[Math.floor(Math.random() * slots.length)];
        const item = target.equipment[slot];
        if (item && item.maxDurability > 0 && item.durability > 0 && Math.random() < 0.15) {
            item.durability--;
            if (item.durability === 0) bus.emit('item:broken', { item, slot });
        }
    }

    // ── Knockback ──────────────────────────────────────────────────────────
    const kbThreshold = target.maxHp * 0.1;
    if (finalDealt > kbThreshold || attacker.knockback) {
        const force = attacker.knockbackForce || 20;
        const dx = target.x - attacker.x;
        const dy = target.y - attacker.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (target.isPlayer) { target.pushX = (dx / dist) * force; target.pushY = (dy / dist) * force; }
        else { target.vx = (dx / dist) * force; target.vy = (dy / dist) * force; }
    }

    // ── Broadcast damage event ─────────────────────────────────────────────
    bus.emit('combat:damage', { attacker, target, dealt, isCrit, type, skillId, worldX: target.x, worldY: target.y });
    if (isCrit && fx) fx.shake(200, 3);

    // ── Lightning Enchanted Elite recoil ───────────────────────────────────
    if (target.isLightningEnchanted && dealt > 0 && !attacker.isPlayerImmuneToEnchant) {
        fx?.emitLightning?.(target.x, target.y, attacker.x, attacker.y, 3);
        if (attacker.isPlayer) {
            const recoil = Math.max(1, Math.round(dealt * 0.05));
            attacker.hp = Math.max(0, attacker.hp - recoil);
            bus.emit('combat:damage', { attacker: target, target: attacker, dealt: recoil, isCrit: false, type: 'lightning', worldX: attacker.x, worldY: attacker.y });
        }
    }

    // ── Enemy life steal ───────────────────────────────────────────────────
    if (!attacker.isPlayer && attacker.lifeStealPct && dealt > 0) {
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.round(dealt * attacker.lifeStealPct / 100));
        if (fx) fx.emitHeal(attacker.x, attacker.y);
    }

    // ── Death check ────────────────────────────────────────────────────────
    if (target.hp <= 0) {
        onKillLogic(attacker, target);
        bus.emit('entity:death', { entity: target, killer: attacker });
    }

    // ── Legendary Equipment Procs ──────────────────────────────────────────
    fireEquipmentProcs(attacker, target, dealt);

    return dealt;
}

// ─────────────────────────────────────────────────────────────
//  KILL LOGIC
// ─────────────────────────────────────────────────────────────

function onKillLogic(killer, victim) {
    if (!killer || !victim) return;

    // Rogue Death Mark CD Reset
    if (victim._statuses?.some(s => s.type === 'death_mark') && killer.isPlayer && killer.cooldowns) {
        killer.cooldowns.fill(0);
        bus.emit('combat:log', { text: 'DEATH MARK RESET!', cls: 'log-crit' });
    }
}

// ─────────────────────────────────────────────────────────────
//  STATUS EFFECTS
// ─────────────────────────────────────────────────────────────

/**
 * Apply a status effect to a target.
 * Types: 'chill' (slows), 'frozen' (stops), 'burn' (DoT), 'stun' (stops), 'weaken' (less dmg).
 */
export function applyStatus(target, type, duration, value = 0, source = null) {
    if (target.isPlayer && target.cannotBeFrozen && (type === 'chill' || type === 'frozen')) return;

    if (!target._statuses) target._statuses = [];

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
        // Velocity decay (knockback friction)
        if (ent.vx || ent.vy) {
            ent.x += (ent.vx || 0) * dt;
            ent.y += (ent.vy || 0) * dt;
            ent.vx = (ent.vx || 0) * 0.85;
            ent.vy = (ent.vy || 0) * 0.85;
            if (Math.abs(ent.vx) < 0.5) ent.vx = 0;
            if (Math.abs(ent.vy) < 0.5) ent.vy = 0;
        }

        if (!ent._statuses?.length && !ent._dots?.length) continue;

        // Tick DoTs
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

        // Tick statuses
        if (ent._statuses) {
            ent._statuses = ent._statuses.filter(s => {
                s.duration -= dt;
                return s.duration > 0 && ent.hp > 0;
            });
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  ENTITY STATE HELPERS
// ─────────────────────────────────────────────────────────────

export function isCCd(ent) {
    return ent._statuses?.some(s => s.type === 'stun' || s.type === 'frozen') ?? false;
}

export function getSlowFactor(ent) {
    const chills = ent._statuses?.filter(s => s.type === 'chill');
    if (!chills?.length) return 0;
    return Math.max(...chills.map(s => s.value));
}

export function isBlinded(ent) {
    return ent._statuses?.some(s => s.type === 'blind') ?? false;
}

export function isFeared(ent) {
    return ent._statuses?.some(s => s.type === 'fear') ?? false;
}

export function isRooted(ent) {
    return ent._statuses?.some(s => s.type === 'root') ?? false;
}

// ─────────────────────────────────────────────────────────────
//  SKILL HELPERS
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
//  INTERNAL UTILITIES
// ─────────────────────────────────────────────────────────────

function cap(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}