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

    // --- Crushing Blow (D2 classic) ---
    if (attacker.crushingBlow > 0 && Math.random() * 100 < attacker.crushingBlow) {
        const reductionPct = defender.type === 'boss' ? 0.10 : 0.25;
        const cbDmg = Math.round(defender.hp * reductionPct);
        dmg += cbDmg;
        bus.emit('combat:log', { text: `CRUSHING BLOW! (-${Math.round(reductionPct * 100)}% HP)`, cls: 'log-crit' });
        if (fx) fx.emitHolyBurst(defender.x, defender.y);
    }

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

    // --- Damage Taken Multiplier (Mark for Death / Amplify Damage) ---
    if (defender.dmgTakenMult) {
        dmg *= defender.dmgTakenMult;
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

    // --- Block logic ---
    if (target.blockChance && type === DMG_TYPE.PHYSICAL && dealt > 0) {
        const blockCap = 75;
        if (Math.random() * 100 < Math.min(blockCap, target.blockChance)) {
            bus.emit('combat:damage', { attacker, target, dealt: 'Blocked!', isCrit: false, type: 'physical', worldX: target.x, worldY: target.y });
            return; // No damage taken
        }
    }

    if (dmgResult.missed) {
        bus.emit('combat:damage', { attacker, target, dealt: 'Miss!', isCrit: false, type, worldX: target.x, worldY: target.y });
        return;
    }

    let finalDealt = dealt;

    // --- Bone Armor (Necro) ---
    if (target.boneArmor > 0 && type === DMG_TYPE.PHYSICAL) {
        const absorb = Math.min(finalDealt, target.boneArmor);
        target.boneArmor -= absorb;
        finalDealt -= absorb;
        bus.emit('combat:log', { text: `Absorbed! (${target.boneArmor} left)`, cls: 'log-info' });
        if (target.boneArmor <= 0) {
            target._statuses = target._statuses?.filter(s => s.type !== 'bone_armor');
            bus.emit('combat:log', { text: "Bone Armor Shattered!", cls: 'log-dmg' });
        }
    }

    // --- Energy Shield (Sorc) ---
    const es = target._statuses?.find(s => s.type === 'energy_shield');
    if (es && finalDealt > 0) {
        const pct = es.value / 100;
        const toMana = Math.floor(finalDealt * pct);
        const manaCost = Math.floor(toMana * 0.75); // ES efficiency
        if (target.mp >= manaCost) {
            target.mp -= manaCost;
            finalDealt -= toMana;
            bus.emit('combat:log', { text: "Mana Transferred!", cls: 'log-mp' });
        } else {
            // Mana empty, shield breaks
            target._statuses = target._statuses.filter(s => s.type !== 'energy_shield');
            bus.emit('combat:log', { text: "Energy Shield Collapsed!", cls: 'log-dmg' });
        }
    }

    target.hp = Math.max(0, target.hp - finalDealt);
    
    // --- PvP Friendly Duel Protection ---
    const isDuel = window.network?.duelOpponentId && (target.id === window.network.duelOpponentId || target.syncId === window.network.duelOpponentId);
    if (isDuel && target.hp < 1) {
        target.hp = 1;
        bus.emit('combat:log', { text: "DUEL FINISHED!", cls: 'log-level' });
        if (window.network) window.network.socket.emit('duel_end', { winner: attacker.charName });
    }

    if (finalDealt > 0) {
        target.lastAttacker = attacker.name || attacker.charName || 'Unknown';
    }
    
    // Phase 21: Sensory Feedback
    if (dealt > 0) {
        target.hitFlashTimer = 0.12; // Trigger flash
        if (fx) {
            if (isCrit) fx.shake(250, 5); // Intense shake for crits
            
            const dx = target.x - attacker.x;
            const dy = target.y - attacker.y;
            const angle = Math.atan2(dy, dx);
            
            if (type === DMG_TYPE.PHYSICAL || type === DMG_TYPE.HOLY) {
                fx.emitBlood(target.x, target.y, angle);
            } else {
                fx.emitHitImpact(target.x, target.y, type);
            }
        }
    }

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
    // --- Durability loss ---
    if (attacker.isPlayer && attacker.equipment?.mainhand) {
        const item = attacker.equipment.mainhand;
        const isIndestructible = item.mods && item.mods.some(m => m.stat === 'indestructible');
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

    // --- Knockback logic ---
    const threshold = target.maxHp * 0.1;
    if (finalDealt > threshold || attacker.knockback) {
        const force = attacker.knockbackForce || 20;
        const dx = target.x - attacker.x;
        const dy = target.y - attacker.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const kbX = (dx / dist) * force;
        const kbY = (dy / dist) * force;
        // Player uses pushX/pushY, enemies use vx/vy
        if (target.isPlayer) {
            target.pushX = kbX;
            target.pushY = kbY;
        } else {
            target.vx = kbX;
            target.vy = kbY;
        }
    }

    bus.emit('combat:damage', {
        attacker, target, dealt, isCrit, type, skillId,
        worldX: target.x, worldY: target.y,
    });

    if (isCrit && fx) {
        fx.shake(200, 3); // Light shake for crits
    }

    // --- Phase 18: Elite Affixes: Electrified & Vampiric ---
    if (target.isLightningEnchanted && dealt > 0 && !attacker.isPlayerImmuneToEnchant) {
        if (fx && fx.emitLightning) {
            // Revenge sparks towards the attacker
            fx.emitLightning(target.x, target.y, attacker.x, attacker.y, 3);
        }
        // Small recoil damage to player if they are nearby
        if (attacker.isPlayer) {
            const recoil = Math.max(1, Math.round(dealt * 0.05));
             attacker.hp = Math.max(0, attacker.hp - recoil);
             bus.emit('combat:damage', { attacker: target, target: attacker, dealt: recoil, isCrit: false, type: 'lightning', worldX: attacker.x, worldY: attacker.y });
        }
    }

    if (!target.isPlayer && target.lifeStealPct && dealt > 0 && attacker.isPlayer) {
        // This is weirdly handled, usually life steal is for the ATTACKER.
        // If the ENEMY has life steal and hits the player, that's in its own attack logic or here.
    }

    // Correct handle: If the ENEMY is the attacker and has lifeStealPct
    if (!attacker.isPlayer && attacker.lifeStealPct && dealt > 0) {
        const heal = Math.round(dealt * attacker.lifeStealPct / 100);
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
        if (fx) fx.emitHeal(attacker.x, attacker.y);
    }

    if (target.hp <= 0) {
        onKillLogic(attacker, target);
        bus.emit('entity:death', { entity: target, killer: attacker });
    }


    // ═══════════════════════════════════════════════════
    // ★ WoW LEGENDARY PROC ENGINE ★
    // Fires onHit effects from equipped weapons/offhand
    // ═══════════════════════════════════════════════════
    if (attacker.isPlayer && finalDealt > 0 && attacker.equipment) {
        const weapon = attacker.equipment.mainhand;
        if (weapon && weapon.onHit) {
            const proc = weapon.onHit;

            // ── SYNERGY ENGINE: boost proc based on talents & charms ──────────
            const { mult: synMult, chanceBonus: synChance, bonusEffects: synFX, labels: synLabels }
                = evaluateSynergies(attacker, proc, weapon.id || '');

            // If any synergies are active, announce the first one (once per 30s)
            if (synLabels.length > 0) {
                const now = Date.now();
                if (!attacker._lastSynLog || now - attacker._lastSynLog > 30000) {
                    attacker._lastSynLog = now;
                    bus.emit('combat:log', {
                        text: `✦ Synergy: ${synLabels[0].label} (+${Math.round((synMult - 1) * 100)}% proc power)`,
                        cls: 'log-level'
                    });
                }
            }

            // Effective proc chance = base + synergy bonus
            const effectiveProcChance = (proc.chance || 0) + synChance;

            // ----- SOUL STACK (Shadowmourne / Bonereaver's Edge) -----
            if (proc.effect === 'soul_stack') {
                // Faster Stacks synergy reduces max stacks needed
                const stackMax = synFX.includes('faster_stacks')
                    ? Math.max(4, Math.floor((proc.maxStacks || 10) * 0.7))
                    : (proc.maxStacks || 10);
                if (!attacker._shadowmourneStacks) attacker._shadowmourneStacks = 0;
                attacker._shadowmourneStacks++;

                // Armor shred (Bonereaver's Edge synergy)
                if (proc.armorShred && target._statuses) {
                    const stackCount = synFX.includes('armor_shred_stack')
                        ? 999 : 3;
                    const shreds = target._statuses.filter(s => s.type === 'armor_shred').length;
                    if (shreds < stackCount) {
                        target._statuses.push({ type: 'armor_shred', duration: 12, value: proc.armorShredAmt || -80 });
                        target.armorDebuff = (target.armorDebuff || 0) + Math.abs(proc.armorShredAmt || 80);
                    }
                }

                if (attacker._shadowmourneStacks >= stackMax) {
                    attacker._shadowmourneStacks = 0;
                    const explodeDmg = Math.round((proc.explodeDmg || 500) * synMult);
                    // AoE explosion
                    if (window.enemies) {
                        window.enemies.forEach(e => {
                            if (e.hp > 0 && Math.hypot(e.x - target.x, e.y - target.y) < 200) {
                                e.hp = Math.max(0, e.hp - explodeDmg);
                                // Soul drain AoE heals player (Warlock synergy)
                                if (synFX.includes('soul_drain_aoe')) {
                                    attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.round(explodeDmg * 0.20));
                                }
                            }
                        });
                    }
                    if (fx) { fx.emitBurst(target.x, target.y, '#8800cc', 80, 6); fx.shake(600, 12); }
                    // Spawn Bone Revenant (Necromancer synergy)
                    if (synFX.includes('spawn_revenant')) {
                        bus.emit('proc:army_of_dead', { x: attacker.x, y: attacker.y, count: 2, duration: 15 });
                    }
                    bus.emit('combat:log', { text: '★ SHADOWMOURNE / BONEREAVER: Soul Rend!', cls: 'log-crit' });
                } else {
                    if (fx) fx.emitBurst(target.x, target.y, '#660088', 6, 2);
                }

            } else if (Math.random() < effectiveProcChance) {

                // ----- CHAIN LIGHTNING (Thunderfury / Doomhammer) -----
                if (proc.effect === 'chain_lightning') {
                    bus.emit('combat:log', { text: '⚡ Chain Lightning proc!', cls: 'log-crit' });
                    let lastPos = { x: target.x, y: target.y };
                    let bounced = 0;
                    // Extra bounce synergy (Storm Caller / Doomhammer)
                    const maxBounces = (proc.targets || 3) + (synFX.includes('extra_bounce') ? 2 : 0);
                    const hitTargets = new Set([target]);
                    const chainDmg = Math.round((proc.damage || 80) * synMult);
                    if (window.enemies) {
                        const sorted = window.enemies
                            .filter(e => e.hp > 0 && !hitTargets.has(e))
                            .sort((a, b) => Math.hypot(a.x - lastPos.x, a.y - lastPos.y) - Math.hypot(b.x - lastPos.x, b.y - lastPos.y));
                        for (const e of sorted) {
                            if (bounced >= maxBounces) break;
                            const dist = Math.hypot(e.x - lastPos.x, e.y - lastPos.y);
                            if (dist < 280) {
                                e.hp = Math.max(0, e.hp - chainDmg);
                                if (fx) fx.emitLightning?.(lastPos.x, lastPos.y, e.x, e.y, 3);
                                lastPos = { x: e.x, y: e.y };
                                hitTargets.add(e);
                                bounced++;
                                // Paralysis stun (Lightning Mastery synergy)
                                if (synFX.includes('paralysis') && e._statuses) {
                                    e._statuses.push({ type: 'stun', duration: 1.0, value: 0 });
                                }
                                // Chain overload stun (Thunder Talisman)
                                if (synFX.includes('chain_overload') && e._statuses) {
                                    e._statuses.push({ type: 'stun', duration: 0.5, value: 0 });
                                }
                            }
                        }
                    }
                    // Attack speed slow
                    if (target._statuses) {
                        const existing = target._statuses.find(s => s.type === 'attackSlowed');
                        if (!existing) target._statuses.push({ type: 'attackSlowed', duration: 6, value: 0.25 });
                    }

                // ----- METEOR DROP (Sulfuras / Draconic Edge / Dragonbreath Cannon) -----
                } else if (proc.effect === 'meteor_drop') {
                    bus.emit('combat:log', { text: '🔥 Meteor Strike proc!', cls: 'log-crit' });
                    const mx = target.x, my = target.y;
                    if (fx) { fx.emitBurst(mx, my, '#ff4400', 60, 5); fx.shake(800, 15); }
                    const meteorDmg = Math.round((proc.damage || 350) * synMult);
                    const meteorRadius = (proc.radius || 120) * (synFX.includes('aoe_expand') ? 1.5 : 1);
                    if (window.enemies) {
                        window.enemies.forEach(e => {
                            if (e.hp > 0 && Math.hypot(e.x - mx, e.y - my) < meteorRadius) {
                                e.hp = Math.max(0, e.hp - meteorDmg);
                                // Burn DoT (Fire Mastery synergy / base)
                                const burnDps = synFX.includes('burn_dot') ? 150 : 30;
                                const burnDur = synFX.includes('burn_dot') ? 5  : 4;
                                if (e._statuses) e._statuses.push({ type: 'burn', duration: burnDur, value: burnDps });
                            }
                        });
                    }
                    // Split meteor (Cinders Heart)
                    if (synFX.includes('split_meteor') && window.enemies) {
                        const offset = 80;
                        [{ ox: offset, oy: 0 }, { ox: -offset, oy: 0 }].forEach(o => {
                            window.enemies.forEach(e => {
                                if (e.hp > 0 && Math.hypot(e.x - (mx + o.ox), e.y - (my + o.oy)) < 60) {
                                    e.hp = Math.max(0, e.hp - Math.round(meteorDmg * 0.5));
                                }
                            });
                        });
                    }

                // ----- DIVINE SHIELD (Val'anyr / Quel'Serrar) -----
                } else if (proc.effect === 'divine_shield') {
                    bus.emit('combat:log', { text: "💛 Divine Shield proc!", cls: 'log-crit' });
                    const shieldBase = Math.round((proc.shieldHp || 800) * synMult);
                    attacker.divineShield = (attacker.divineShield || 0) + shieldBase;
                    attacker._divineShieldTimer = proc.duration || 8;
                    // Reflect damage synergy (Paladin — Divine Shield talent)
                    if (synFX.includes('reflect_dmg')) {
                        attacker._divineShieldReflect = 0.30;
                    }
                    // Heal party (Holy Light synergy)
                    if (synFX.includes('heal_party')) {
                        bus.emit('proc:heal_party', { x: attacker.x, y: attacker.y, amount: 200, radius: 150 });
                    }
                    if (fx) fx.emitHolyBurst?.(attacker.x, attacker.y);

                // ----- ARCANE BURST (Atiesh / Voidreaper) -----
                } else if (proc.effect === 'arcane_burst') {
                    bus.emit('combat:log', { text: '✨ Arcane Burst proc!', cls: 'log-crit' });
                    if (fx) fx.emitBurst(target.x, target.y, '#aa44ff', 40, 4);
                    const arcDmg  = Math.round((proc.damage  || 200) * synMult);
                    const arcRad  = (proc.radius || 80) * (synFX.includes('aoe_expand') ? 1.5 : 1);
                    const burstColor = proc.type === 'shadow' ? '#7711cc' : '#aa44ff';
                    if (window.enemies) {
                        window.enemies.forEach(e => {
                            if (e.hp > 0 && Math.hypot(e.x - target.x, e.y - target.y) < arcRad) {
                                e.hp = Math.max(0, e.hp - arcDmg);
                                // Mana shred (Voidreaper)
                                if (proc.manaShred && e.mp !== undefined) {
                                    e.mp = Math.max(0, (e.mp || 0) - (proc.manaShredAmt || 120));
                                }
                            }
                        });
                    }
                    // Mana restore on proc (Atiesh + lightning mastery)
                    if (synFX.includes('mana_storm')) {
                        attacker.mp = Math.min(attacker.maxMp, (attacker.mp || 0) + Math.round(attacker.maxMp * 0.15));
                    }
                    // Double burst (Arcane Focus charm)
                    if (synFX.includes('double_burst')) {
                        setTimeout(() => {
                            if (fx) fx.emitBurst(target.x, target.y, burstColor, 20, 2);
                            if (window.enemies) window.enemies.forEach(e => {
                                if (e.hp > 0 && Math.hypot(e.x - target.x, e.y - target.y) < arcRad * 0.6) {
                                    e.hp = Math.max(0, e.hp - Math.round(arcDmg * 0.5));
                                }
                            });
                        }, 300);
                    }

                // ----- SOUL RIP (Frostmourne / Staff of Eternal Winter) -----
                } else if (proc.effect === 'soul_rip') {
                    bus.emit('combat:log', { text: '❄️ Soul Rip proc!', cls: 'log-crit' });
                    const ripDmg = Math.round((proc.damage || 150) * synMult);
                    // AoE version (Staff of Eternal Winter)
                    if (proc.aoe && window.enemies) {
                        window.enemies.forEach(e => {
                            if (e.hp > 0 && Math.hypot(e.x - target.x, e.y - target.y) < (proc.aoeRadius || 100)) {
                                e.hp = Math.max(0, e.hp - Math.round(ripDmg * 0.6));
                            }
                        });
                    }
                    target.hp = Math.max(0, target.hp - ripDmg);
                    attacker.hp = Math.min(attacker.maxHp, attacker.hp + ripDmg * 0.5);
                    const freezeDur = (proc.freezeDuration || 3) + (synFX.includes('deep_freeze') ? 3 : 0);
                    if (proc.freeze && target._statuses) {
                        target._statuses.push({ type: 'frozen', duration: freezeDur, value: 0 });
                    }
                    // Mana drain (Frost Rune charm)
                    if (synFX.includes('mana_drain') && target.mp !== undefined) {
                        target.mp = Math.max(0, (target.mp || 0) - 150);
                    }
                    // Shatter on kill (Cold Mastery synergy) — mark for main loop
                    if (synFX.includes('shatter')) {
                        target._willShatter = ripDmg * 2;
                    }
                    if (fx) { fx.emitBurst(target.x, target.y, '#44eeff', 30, 3); }

                // ----- BLADE DANCE (Warglaive / Dirge) -----
                } else if (proc.effect === 'blade_dance') {
                    bus.emit('combat:log', { text: '🌀 Blade Dance proc!', cls: 'log-crit' });
                    const extraHit = synFX.includes('extra_hit') ? 1 : 0;
                    const hits = (proc.hits || 3) + extraHit;
                    const hitDmg = Math.round((proc.damage || 60) * synMult);
                    for (let i = 0; i < hits; i++) {
                        setTimeout(() => {
                            if (target.hp > 0) {
                                target.hp = Math.max(0, target.hp - hitDmg);
                                if (fx) fx.emitSlash?.(target.x, target.y, Math.random() * Math.PI * 2, '#00ff88', 30);
                                // Poison on hit (Dirge)
                                if (proc.poisonOnHit && target._statuses) {
                                    target._statuses.push({
                                        type: 'poison', duration: proc.poisonDuration || 6,
                                        value: Math.round((proc.poisonDps || 50) * synMult)
                                    });
                                }
                                // Death Mark reset vanish CD on kill (Shadow Dance)
                                if (synFX.includes('stealth_reset') && target.hp <= 0 && attacker.cooldowns) {
                                    const vIdx = attacker.cooldowns.findIndex?.((_, idx) => idx === 2);
                                    if (vIdx >= 0) attacker.cooldowns[vIdx] = 0;
                                }
                            }
                        }, i * 80);
                    }

                // ----- STELLAR ARROW (Thori'dal) -----
                } else if (proc.effect === 'stellar_arrow') {
                    bus.emit('combat:log', { text: "⭐ Thori'dal: Stellar Arrow!", cls: 'log-crit' });
                    if (fx) fx.emitBurst(target.x, target.y, '#ffffaa', 20, 3);
                    // Piercing — hit ALL enemies in a line
                    if (window.enemies) {
                        const dx = target.x - attacker.x, dy = target.y - attacker.y;
                        const len = Math.hypot(dx, dy) || 1;
                        const nx = dx / len, ny = dy / len;
                        window.enemies.forEach(e => {
                            if (e.hp <= 0) return;
                            const ex = e.x - attacker.x, ey = e.y - attacker.y;
                            const dot = ex * nx + ey * ny;
                            if (dot > 0) {
                                const cross = Math.abs(ex * ny - ey * nx);
                                if (cross < 40) e.hp = Math.max(0, e.hp - (proc.damage || 120));
                            }
                        });
                    }

                // ----- CONSECRATION (Ashbringer / Hammer of the Naaru) -----
                } else if (proc.effect === 'consecration') {
                    bus.emit('combat:log', { text: '✝️ Consecration proc!', cls: 'log-crit' });
                    const conseDmg = Math.round((proc.damage || 100) * synMult);
                    const conseRad = (proc.radius || 90) * (synFX.includes('aoe_expand') ? 1.5 : 1);
                    if (window.enemies) {
                        window.enemies.forEach(e => {
                            if (e.hp > 0 && Math.hypot(e.x - attacker.x, e.y - attacker.y) < conseRad) {
                                e.hp = Math.max(0, e.hp - conseDmg);
                                // Holy Fire (Consecration + Fire Mastery)
                                if (synFX.includes('holy_fire') && e._statuses) {
                                    e._statuses.push({ type: 'burn', duration: 6, value: Math.round(conseDmg * 0.4) });
                                }
                                // Judgment mark (amplifies holy dmg taken)
                                if (synFX.includes('judgment_mark') && e._statuses) {
                                    e._statuses.push({ type: 'judgment', duration: 10, value: 0.25 });
                                }
                            }
                        });
                    }
                    attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.round((proc.healPlayer || 50) * synMult));
                    if (fx) { fx.emitHolyBurst?.(attacker.x, attacker.y); }

                // ----- ARMY OF THE DEAD (Glaive of the Fallen Prince) -----
                } else if (proc.effect === 'army_of_the_dead') {
                    bus.emit('combat:log', { text: '💀 Army of the Dead rises!', cls: 'log-crit' });
                    // Spawn temporary shadow minions via event
                    bus.emit('proc:army_of_dead', {
                        x: attacker.x, y: attacker.y,
                        count: proc.count || 3,
                        duration: proc.duration || 12
                    });
                    if (fx) { fx.emitBurst(attacker.x, attacker.y, '#334466', 50, 5); }
                }
            }
        }
    }

    // ----- Divine Shield damage absorption -----
    if (target.isPlayer && target.divineShield > 0) {
        const absorbed = Math.min(finalDealt, target.divineShield);
        target.divineShield -= absorbed;
        if (target.divineShield <= 0) {
            target.divineShield = 0;
            bus.emit('combat:log', { text: 'Divine Shield shattered!', cls: 'log-dmg' });
        }
    }

    return dealt;

}

/**
 * Handles logic that triggers when an entity is killed.
 */
function onKillLogic(killer, victim) {
    if (!killer || !victim) return;

    // Rogue Death Mark CD Reset
    if (victim._statuses?.some(s => s.type === 'death_mark')) {
        if (killer.isPlayer && killer.cooldowns) {
            for (let i = 0; i < killer.cooldowns.length; i++) {
                killer.cooldowns[i] = 0;
            }
            bus.emit('combat:log', { text: "DEATH MARK RESET!", cls: 'log-crit' });
        }
    }

    // Universal Mana/Life after kill (handled in main.js listener, but could be here)
}

/**
 * Apply a status effect to a target.
 * Types: 'chill' (slows), 'frozen' (stops), 'burn' (DoT), 'stun' (stops), 'weaken' (less dmg).
 */
export function applyStatus(target, type, duration, value = 0, source = null) {
    // --- Cannot be Frozen check ---
    if (target.isPlayer && target.cannotBeFrozen && (type === 'chill' || type === 'frozen')) {
        return;
    }

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
            ent.vx = (ent.vx || 0) * 0.85;
            ent.vy = (ent.vy || 0) * 0.85;
            if (Math.abs(ent.vx) < 0.5) ent.vx = 0;
            if (Math.abs(ent.vy) < 0.5) ent.vy = 0;
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

/** Helper to check if entity is blinded */
export function isBlinded(ent) {
    if (!ent._statuses) return false;
    return ent._statuses.some(s => s.type === 'blind');
}

/** Helper to check if entity is feared */
export function isFeared(ent) {
    if (!ent._statuses) return false;
    return ent._statuses.some(s => s.type === 'fear');
}

/** Helper to check if entity is rooted */
export function isRooted(ent) {
    if (!ent._statuses) return false;
    return ent._statuses.some(s => s.type === 'root');
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
