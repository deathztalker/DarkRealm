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
        if (skillId === 'shockwave') {
            applyStatus(target, 'stun', 2.0);
        }
        if (skillId === 'rend' || skillId === 'lacerate') {
            applyDot(target, 4 + slvl * 3, 'physical', 5, 'warrior_bleed');
        }
        if (skillId === 'execute') {
            if (target.hp / target.maxHp < 0.3) {
                if (fx) { fx.emitBurst(target.x, target.y, '#ff0000', 20); fx.shake(300, 6); }
            }
        }
        if (skillId === 'leap_attack' || skillId === 'slam' || skillId === 'heroic_leap') {
            applyStatus(target, 'stun', 0.5);
        }

        // ══════════════ SORCERESS ══════════════
        if (['fire_bolt', 'fireball', 'meteor', 'immolate', 'fire_storm'].includes(skillId)) {
            applyDot(target, baseDmg * 0.2, 'fire', 4, 'sorc_burn');
            if (['meteor', 'immolate'].includes(skillId)) {
                fx.emitBurst(target.x, target.y, '#ff4000', 15, 3);
                fx.shake(200, 4);
            }
        }
        if (['ice_bolt', 'blizzard', 'frozen_orb', 'frost_nova', 'absolute_zero'].includes(skillId)) {
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
        if (skillId === 'poison_nova') {
            applyDot(target, 5 + slvl * 3, 'poison', 5, 'necro_pois');
        }

        // ══════════════ ROGUE ══════════════
        if (skillId === 'claw_strike' || skillId === 'shiv') {
            attacker.comboPoints = Math.min(attacker.maxComboPoints || 5, (attacker.comboPoints || 0) + 1);
            bus.emit('combat:log', { text: `Combo Points: ${attacker.comboPoints}`, cls: 'log-info' });
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

        // ══════════════ DRUID ══════════════
        if (skillId === 'maul' || skillId === 'bear_slam') {
            applyStatus(target, 'stun', skillId === 'bear_slam' ? 1.5 : 1.0);
        }
        if (skillId === 'shred') {
            // Shred deals 30% more damage if the target is bleeding
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
    },

    /**
     * Triggered on skill cast (cooldown start).
     */
    onCast(attacker, skillId, slvl, targetX, targetY, allEnemies) {
        if (skillId === 'bone_armor' || skillId === 'cyclone_armor' || skillId === 'ignore_pain') {
            const absorb = skillId === 'ignore_pain' ? 100 + slvl * 40 : 20 + slvl * 15;
            attacker.boneArmor = (attacker.boneArmor || 0) + absorb;
            applyStatus(attacker, 'shielded', 3600);
            bus.emit('combat:log', { text: `Absorb Shield (${absorb})`, cls: 'log-info' });
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

        if (skillId === 'mirror_image') {
            // Usually spawns minions, we can just emit log
            bus.emit('combat:log', { text: "Mirror Images!", cls: 'log-info' });
        }

        if (skillId === 'bloodlust') {
            applyStatus(attacker, 'bloodlust', 15);
            bus.emit('combat:log', { text: "BLOODLUST!", cls: 'log-crit' });
        }

        if (skillId === 'lay_on_hands') {
            const healAmount = attacker.maxHp;
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
    }
};
