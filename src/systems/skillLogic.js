import { bus } from '../engine/EventBus.js';
import { applyStatus, applyDot, DMG_TYPE, applyDamage } from './combat.js';
import { fx } from '../engine/ParticleSystem.js';

/**
 * SkillLogic — Specialized logic for character skills.
 * Strictly synchronized with src/data/class_*.js
 */
export const SkillLogic = {
    /**
     * Triggered when a skill projectile or melee hit connects with a target.
     */
    onHit(attacker, target, skillId, slvl, baseDmg) {
        if (!target || target.hp <= 0) return;

        // ══════════════ WARRIOR ══════════════
        if (skillId === 'bash') {
            if (Math.random() < 0.2) applyStatus(target, 'stun', 0.8);
        }
        if (skillId === 'shield_bash') {
            applyStatus(target, 'stun', 1.5 + slvl * 0.05);
        }
        if (skillId === 'colossus_strike') {
            target.armorDebuff = Math.max(target.armorDebuff || 0, (target.armor || 0) * 0.5);
            applyStatus(target, 'sundered', 8);
        }
        if (skillId === 'mortal_strike') {
            target.healDebuff = 0.5; // Reduce healing by 50%
            applyStatus(target, 'curse', 10);
            bus.emit('combat:log', { text: "Healing Reduced!", cls: 'log-dmg' });
        }
        if (skillId === 'bloodthirst') {
            const heal = attacker.maxHp * 0.04;
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
            if (fx) fx.emitHeal(attacker.x, attacker.y);
            bus.emit('combat:log', { text: `Bloodthirst: +${Math.round(heal)} HP`, cls: 'log-heal' });
        }
        if (attacker._revengeReady) {
            const heal = baseDmg * 0.20;
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
            attacker._revengeReady = false;
            if (fx) fx.emitHeal(attacker.x, attacker.y);
            bus.emit('combat:log', { text: `Revenge Ready Exhausted! +${Math.round(heal)} HP`, cls: 'log-heal' });
        }
        if (skillId === 'shockwave') {
            applyStatus(target, 'stun', 2.0);
        }
        if (skillId === 'rend' || skillId === 'lacerate') {
            applyDot(target, 4 + slvl * 3, 'physical', 5, 'warrior_bleed');
        }
        if (skillId === 'execute') {
            if (target.hp / target.maxHp < 0.3) {
                if (fx) { fx.emitBurst(target.x, target.y, '#ff0000', 20); fx.shake(500, 8); }
            }
        }
        if (skillId === 'leap_attack' || skillId === 'slam' || skillId === 'heroic_leap') {
            applyStatus(target, 'stun', 0.5);
        }

        // ══════════════ SORCERESS ══════════════
        if (['fire_bolt', 'fireball', 'meteor', 'immolate', 'fire_storm', 'immolate_warlock'].includes(skillId)) {
            applyDot(target, baseDmg * 0.2, 'fire', 4, 'sorc_burn');
            if (['meteor', 'immolate'].includes(skillId)) {
                fx.emitBurst(target.x, target.y, '#ff4000', 15, 3);
                fx.shake(200, 4);
            }
        }
        if (['ice_bolt', 'blizzard', 'frozen_orb', 'frost_nova', 'absolute_zero', 'ice_arrow'].includes(skillId)) {
            applyStatus(target, 'chill', 2.5 + slvl * 0.1, 40);
            if (skillId === 'ice_blast' || skillId === 'ice_trap') applyStatus(target, 'frozen', 1.5);
        }

        // ══════════════ NECROMANCER ══════════════
        if (skillId === 'amplify_damage') {
            target.dmgTakenMult = Math.max(target.dmgTakenMult || 1, 2.0);
            applyStatus(target, 'curse', 10 + slvl);
        }
        if (skillId === 'weaken') {
            target.damageDebuff = Math.max(target.damageDebuff || 0, 33);
            applyStatus(target, 'curse', 10 + slvl);
        }
        if (skillId === 'decrepify') {
            applyStatus(target, 'chill', 10, 50); 
            target.damageDebuff = Math.max(target.damageDebuff || 0, 50);
            target.resDebuff = Math.max(target.resDebuff || 0, 50);
            applyStatus(target, 'curse', 10 + slvl * 0.5);
        }
        if (skillId === 'lower_resist') {
            target.resDebuff = Math.max(target.resDebuff || 0, 30 + slvl);
            applyStatus(target, 'curse', 10 + slvl);
        }
        if (skillId === 'life_tap_curse') {
            target.lifeTap = true;
            applyStatus(target, 'curse', 10 + slvl);
        }
        if (skillId === 'terror') {
            applyStatus(target, 'fleeing', 4 + slvl);
        }
        if (skillId === 'confuse') {
            applyStatus(target, 'confused', 10);
        }
        if (skillId === 'bone_prison') {
            applyStatus(target, 'rooted', 6 + slvl * 0.5);
            bus.emit('combat:log', { text: "Bone Prison!", cls: 'log-info' });
        }
        if (skillId === 'poison_nova') {
            applyDot(target, 5 + slvl * 3, 'poison', 5, 'necro_pois');
        }
        if (skillId === 'poison_dagger') {
            applyDot(target, 20 + slvl * 10, 'poison', 8, 'necro_stab');
        }

        // ══════════════ ROGUE ══════════════
        if (skillId === 'claw_strike' || skillId === 'shiv') {
            attacker.comboPoints = Math.min(attacker.maxComboPoints || 5, (attacker.comboPoints || 0) + 1);
            bus.emit('combat:log', { text: `Combo Points: ${attacker.comboPoints}`, cls: 'log-info' });
        }
        if (skillId === 'shadow_step') {
            attacker._shadowStepBuff = true; // +50% dmg on next hit
            if (fx) fx.emitShadow(attacker.x, attacker.y);
            bus.emit('combat:log', { text: "Shadow Step: Next attack +50% DMG!", cls: 'log-info' });
        }
        if (skillId === 'ambush') {
            attacker.comboPoints = Math.min(attacker.maxComboPoints || 5, (attacker.comboPoints || 0) + 3);
            bus.emit('combat:log', { text: `Combo Points: ${attacker.comboPoints}`, cls: 'log-info' });
        }
        if (skillId === 'eviscerate' || skillId === 'blade_dance' || skillId === 'rupture') {
            const cp = attacker.comboPoints || 0;
            attacker.comboPoints = 0;
            if (skillId === 'rupture') {
                applyDot(target, baseDmg * (1 + cp), 'physical', 8, 'rogue_rupture');
            }
            bus.emit('combat:log', { text: `Finisher! (${cp} CP)`, cls: 'log-crit' });
        }
        if (skillId === 'death_mark') {
            target.dmgTakenMult = Math.max(target.dmgTakenMult || 1, 2.0);
            applyStatus(target, 'death_mark', 10);
        }

        // ══════════════ SHAMAN ══════════════
        if (skillId === 'flame_shock') {
            applyDot(target, 5 + slvl * 3, 'fire', 10, 'shaman_flame_shock');
        }
        if (skillId === 'frost_shock') {
            applyStatus(target, 'chill', 6, 50);
        }
        if (skillId === 'lava_burst') {
            if (fx) fx.emitBurst(target.x, target.y, '#ff4000', 15, 3);
        }
        if (attacker.talents?.baseLevel('storm_caller') > 0 && ['lightning_bolt', 'chain_lightning'].includes(skillId)) {
            if (Math.random() < 0.15) {
                const clIdx = attacker.hotbar.indexOf('chain_lightning');
                if (clIdx !== -1) {
                    attacker.cooldowns[clIdx] = 0;
                    bus.emit('combat:log', { text: "Storm Caller: Chain Lightning Reset!", cls: 'log-crit' });
                    if (fx) fx.emitLightning(attacker.x, attacker.y - 40, attacker.x, attacker.y, 2);
                }
            }
        }

        // ══════════════ DRUID ══════════════
        if (skillId === 'maul' || skillId === 'bear_slam') {
            applyStatus(target, 'stun', skillId === 'bear_slam' ? 1.5 : 1.0);
        }
        if (skillId === 'rabies') {
            applyDot(target, 10 + slvl * 5, 'poison', 10, 'druid_rabies');
            target.rabiesSpread = true;
        }
        if (skillId === 'shred') {
            const isBleeding = target._dots && target._dots.some(d => d.type === 'physical');
            if (isBleeding) {
                applyDamage(attacker, target, { dealt: baseDmg * 0.3, isCrit: false, type: 'physical' }, 'shred_bonus');
            }
        }
        if (skillId === 'solar_beam') {
            applyStatus(target, 'silence', 3.0);
        }

        // ══════════════ PALADIN ══════════════
        if (skillId === 'holy_wrath') {
            if (target.type === 'undead' || target.type === 'demon' || target.id.includes('skeleton') || target.id.includes('zombie')) {
                applyStatus(target, 'stun', 3.0);
                if (fx) fx.emitHolyBurst(target.x, target.y);
            }
        }
        if (skillId === 'vengeance') {
            applyDamage(attacker, target, { dealt: baseDmg * 0.2, isCrit: false, type: 'fire' }, 'vengeance_fire');
            applyDamage(attacker, target, { dealt: baseDmg * 0.2, isCrit: false, type: 'cold' }, 'vengeance_cold');
            applyDamage(attacker, target, { dealt: baseDmg * 0.2, isCrit: false, type: 'lightning' }, 'vengeance_light');
        }

        // ══════════════ WARLOCK ══════════════
        if (skillId === 'shadowburn') {
            if (target.hp / target.maxHp < 0.2) {
                applyDamage(attacker, target, { dealt: baseDmg * 2, isCrit: true, type: 'shadow' }, 'shadowburn_exec');
            }
        }
    },

    /**
     * Triggered on skill cast (cooldown start).
     */
    onCast(attacker, skillId, slvl, targetX, targetY, allEnemies) {
        if (skillId === 'bone_armor' || skillId === 'cyclone_armor') {
            const absorb = 20 + slvl * 15;
            attacker.boneArmor = (attacker.boneArmor || 0) + absorb;
            applyStatus(attacker, 'shielded', 3600);
            bus.emit('combat:log', { text: `Absorb Shield (${absorb})`, cls: 'log-info' });
        }
        
        if (skillId === 'ignore_pain') {
            const absorb = (attacker.maxHp || 100) * 0.5;
            attacker.boneArmor = (attacker.boneArmor || 0) + absorb;
            applyStatus(attacker, 'shielded', 10 + slvl);
            bus.emit('combat:log', { text: `Ignore Pain: ${Math.round(absorb)} Shield!`, cls: 'log-info' });
        }

        if (skillId === 'bladestorm' || skillId === 'whirlwind') {
            applyStatus(attacker, 'cc_immune', 5 + slvl * 0.5);
            bus.emit('combat:log', { text: "Unstoppable!", cls: 'log-crit' });
        }

        if (skillId === 'cloak_of_shadows') {
            attacker._dots = []; // clear all dots
            attacker.magicImmune = true;
            applyStatus(attacker, 'shielded', 3 + slvl * 0.1);
            setTimeout(() => { attacker.magicImmune = false; }, (3 + slvl * 0.1) * 1000);
            bus.emit('combat:log', { text: "Cloak of Shadows!", cls: 'log-info' });
        }

        if (skillId === 'arcane_power') {
            applyStatus(attacker, 'arcane_power', 15);
            bus.emit('combat:log', { text: "Arcane Power!", cls: 'log-crit' });
        }

        if (skillId === 'bloodlust') {
            applyStatus(attacker, 'bloodlust', 15);
            if (fx) fx.shake(600, 10);
            bus.emit('combat:log', { text: "BLOODLUST!", cls: 'log-crit' });
        }

        if (skillId === 'earthquake') {
            if (fx) fx.shake(1500, 15);
            bus.emit('combat:log', { text: "THE EARTH TREMBLES!", cls: 'log-crit' });
        }

        if (skillId === 'lay_on_hands') {
            attacker.hp = attacker.maxHp;
            attacker.mp = Math.min(attacker.maxMp, attacker.mp + 10 + slvl * 2);
            if (fx) fx.emitHeal(attacker.x, attacker.y);
            bus.emit('combat:log', { text: "Lay on Hands!", cls: 'log-crit' });
        }

        if (skillId === 'preparation') {
            if (attacker.cooldowns) {
                for (let i = 0; i < attacker.cooldowns.length; i++) {
                    attacker.cooldowns[i] = 0;
                }
            }
            bus.emit('combat:log', { text: "Preparation: Cooldowns Reset!", cls: 'log-info' });
        }

        if (skillId === 'battle_orders') {
            const pct = 5 + slvl * 1.5;
            attacker._buffs = attacker._buffs || [];
            // Remove old BO to prevent HP stacking exploit
            attacker._buffs = attacker._buffs.filter(b => b.id !== 'bo');
            attacker._buffs.push({ id: 'bo', type: 'bo', name: 'Battle Orders', duration: 60 + slvl * 3, value: pct });
            
            attacker.maxHp *= (1 + pct / 100);
            attacker.maxMp *= (1 + pct / 100);
            bus.emit('combat:log', { text: `Battle Orders: +${Math.round(pct)}% Life & Mana!`, cls: 'log-crit' });
            if (fx) {
                fx.emitBurst(attacker.x, attacker.y, '#ffd700', 30, 2.5);
                fx.shake(200, 5);
            }
        }

        if (skillId === 'battle_command') {
            attacker._buffs = attacker._buffs || [];
            // Refresh duration if exists
            attacker._buffs = attacker._buffs.filter(b => b.id !== 'bc');
            attacker._buffs.push({ id: 'bc', type: 'bc', name: 'Battle Command', duration: 120 + slvl * 10, value: 1 });
            
            attacker.allSkillBonus = (attacker.allSkillBonus || 0) + 1;
            bus.emit('combat:log', { text: "Battle Command: +1 All Skills!", cls: 'log-crit' });
            if (fx) fx.emitBurst(attacker.x, attacker.y, '#30ccff', 30, 2.5);
        }

        if (skillId === 'teleport') {
            attacker.x = targetX;
            attacker.y = targetY;
            if (fx) fx.emitBurst(attacker.x, attacker.y, '#30ccff', 20, 2);
            bus.emit('combat:log', { text: "Teleport!", cls: 'log-info' });
        }
    }
};
