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
            if (Math.random() < 0.1) applyStatus(target, 'stun', 0.5);
        }
        if (skillId === 'shield_bash') {
            applyStatus(target, 'stun', 1.5 + slvl * 0.05);
        }
        if (skillId === 'rend') {
            applyDot(target, 4 + slvl * 3, 'physical', 5, 'warrior_bleed');
        }
        if (skillId === 'execute') {
            if (target.hp / target.maxHp < 0.3) {
                // Triple damage logic is handled in the skill's damage calculation usually, 
                // but we can apply it here as an extra burst if needed.
                // For now, visual feedback:
                if (fx) {
                    fx.emitBurst(target.x, target.y, '#ff0000', 20);
                    fx.shake(300, 6);
                }
            }
        }
        if (skillId === 'leap_attack' || skillId === 'slam') {
            applyStatus(target, 'stun', 0.5);
        }

        // ══════════════ SORCERESS ══════════════
        if (['fire_bolt', 'fireball', 'meteor', 'immolate', 'fire_storm'].includes(skillId)) {
            applyDot(target, baseDmg * 0.2, 'fire', 4, 'sorc_burn');
        }
        if (['ice_bolt', 'blizzard', 'frozen_orb', 'frost_nova', 'absolute_zero'].includes(skillId)) {
            applyStatus(target, 'chill', 2.5 + slvl * 0.1, 40);
            if (skillId === 'ice_blast') applyStatus(target, 'frozen', 1.0 + slvl * 0.05);
            if (skillId === 'absolute_zero') applyStatus(target, 'frozen', 2.0 + slvl * 0.1);
        }
        if (['charged_bolt', 'chain_lightning', 'nova', 'thunder_storm'].includes(skillId)) {
            if (Math.random() < 0.1) applyStatus(target, 'stun', 0.3);
        }

        // ══════════════ NECROMANCER ══════════════
        if (skillId === 'amplify_damage') {
            target.dmgTakenMult = Math.max(target.dmgTakenMult || 1, 2.0 + slvl * 0.05);
            applyStatus(target, 'curse', 10 + slvl);
        }
        if (skillId === 'weaken') {
            target.damageDebuff = Math.max(target.damageDebuff || 0, 30 + slvl);
            applyStatus(target, 'curse', 10 + slvl);
        }
        if (skillId === 'decrepify') {
            applyStatus(target, 'chill', 10, 50); // Massive slow
            target.damageDebuff = Math.max(target.damageDebuff || 0, 30);
            target.resDebuff = Math.max(target.resDebuff || 0, 25);
            applyStatus(target, 'curse', 10 + slvl * 0.5);
        }
        if (skillId === 'lower_resist') {
            target.resDebuff = Math.max(target.resDebuff || 0, 35 + slvl * 2);
            applyStatus(target, 'curse', 15);
        }
        if (skillId === 'poison_nova') {
            applyDot(target, 5 + slvl * 3, 'poison', 4, 'necro_pois');
        }
        if (skillId === 'bone_prison') {
            applyStatus(target, 'root', 3 + slvl * 0.2);
        }

        // ══════════════ ROGUE ══════════════
        if (skillId === 'shadow_strike') {
            applyDot(target, baseDmg * 0.3, 'shadow', 3, 'rogue_shadow');
        }
        if (skillId === 'backstab') {
            if (Math.random() < 0.3) applyStatus(target, 'stun', 1.0);
        }
        if (skillId === 'death_mark') {
            target.dmgTakenMult = Math.max(target.dmgTakenMult || 1, 1.4 + slvl * 0.03);
            applyStatus(target, 'death_mark', 10);
        }
        if (skillId === 'poison_blade' || skillId === 'envenom' || skillId === 'plague' || skillId === 'noxious_cloud') {
            applyDot(target, 5 + slvl * 3, 'poison', 4, 'rogue_pois');
        }
        if (skillId === 'shock_trap') {
            applyStatus(target, 'stun', 0.5);
        }

        // ══════════════ PALADIN ══════════════
        if (skillId === 'smite') {
            applyStatus(target, 'stun', 1.0);
        }
        if (skillId === 'holy_smite') {
            applyStatus(target, 'blind', 2.0);
        }
        if (skillId === 'judgment') {
            if (target.group === 'undead') {
                // Triple damage vs undead is handled in combat.js if we pass a mult, 
                // but for now we apply an extra burst.
                const extra = baseDmg * 2;
                target.hp = Math.max(0, target.hp - extra);
            }
        }

        // ══════════════ SHAMAN ══════════════
        if (skillId === 'thunder_strike' || skillId === 'earthquake') {
            applyStatus(target, 'stun', skillId === 'earthquake' ? 1.2 : 0.6);
        }

        // ══════════════ DRUID ══════════════
        if (skillId === 'maul' || skillId === 'bear_slam' || skillId === 'twister') {
            applyStatus(target, 'stun', skillId === 'bear_slam' ? 1.5 : (skillId === 'maul' ? 1.0 : 0.5));
        }
        if (skillId === 'rabies') {
            applyDot(target, 6 + slvl * 4, 'poison', 5, 'druid_rabies');
            // Rabies infection spread logic is handle in enemy.js or a separate pulse
        }
        if (skillId === 'hurricane') {
            applyStatus(target, 'chill', 1.0, 35);
        }
        if (skillId === 'raven') {
            if (Math.random() < 0.1) applyStatus(target, 'blind', 2.0);
        }
        if (skillId === 'vine') {
            applyStatus(target, 'root', 3.0);
        }

        // ══════════════ WARLOCK ══════════════
        if (skillId === 'corruption' || skillId === 'seed') {
            applyDot(target, 8 + slvl * 4, 'shadow', 6, 'warlock_dot');
        }
        if (skillId === 'haunt') {
            applyDot(target, 10 + slvl * 6, 'shadow', 8, 'warlock_haunt');
        }
        if (skillId === 'agony') {
            applyDot(target, 2 + slvl * 1, 'shadow', 12, 'warlock_agony');
        }

        // ══════════════ RANGER ══════════════
        if (skillId === 'ensnare') {
            applyStatus(target, 'root', 2 + slvl * 0.1);
        }
        if (skillId === 'viper_arrow') {
            applyDot(target, 5 + slvl * 3, 'poison', 5, 'ranger_poison');
        }
        if (skillId === 'mark_death') {
            target.dmgTakenMult = Math.max(target.dmgTakenMult || 1, 1.5 + slvl * 0.03);
            applyStatus(target, 'curse', 10);
        }
        if (skillId === 'companion_hawk') {
            if (Math.random() < 0.2) applyStatus(target, 'blind', 3.0);
        }
        if (skillId === 'ice_trap') {
            applyStatus(target, 'frozen', 1.5);
            applyStatus(target, 'chill', 4.0, 50);
        }
    },

    /**
     * Triggered on skill cast (cooldown start).
     */
    onCast(attacker, skillId, slvl, targetX, targetY, allEnemies) {
        // ══════════════ SHAMAN STATIC FIELD ══════════════
        if (skillId === 'static_field') {
            const range = 250 + slvl * 10;
            const reduction = 0.25 + slvl * 0.01;
            allEnemies.forEach(e => {
                const d = Math.hypot(e.x - attacker.x, e.y - attacker.y);
                if (d < range && e.hp > 1) {
                    const dmg = Math.floor(e.hp * reduction);
                    e.hp = Math.max(1, e.hp - dmg);
                    bus.emit('combat:damage', { attacker, target: e, dealt: dmg, isCrit: false, type: 'lightning', worldX: e.x, worldY: e.y });
                    if (fx) fx.emitLightning(attacker.x, attacker.y, e.x, e.y);
                }
            });
            bus.emit('combat:log', { text: "Static Field!", cls: 'log-info' });
        }

        // ══════════════ SORCERESS ══════════════
        if (skillId === 'teleport') {
            if (fx) fx.emitBurst(attacker.x, attacker.y, '#8080ff', 15);
            attacker.x = targetX;
            attacker.y = targetY;
            if (fx) fx.emitBurst(attacker.x, attacker.y, '#b0b0ff', 15);
        }
        if (skillId === 'energy_shield') {
            const pct = 60 + slvl * 2;
            applyStatus(attacker, 'energy_shield', 3600, pct); // Long duration buff
            bus.emit('combat:log', { text: `Energy Shield Active (${pct}%)!`, cls: 'log-info' });
        }
        if (skillId === 'enchant') {
            applyStatus(attacker, 'enchant', 144, slvl);
            bus.emit('combat:log', { text: "Weapons Enchanted!", cls: 'log-info' });
        }

        // ══════════════ NECROMANCER ══════════════
        if (skillId === 'bone_armor') {
            attacker.boneArmor = (attacker.boneArmor || 0) + (20 + slvl * 15);
            applyStatus(attacker, 'bone_armor', 3600);
            bus.emit('combat:log', { text: `Bone Armor (${attacker.boneArmor})`, cls: 'log-info' });
        }

        // ══════════════ WARLOCK ══════════════
        if (skillId === 'dark_pact') {
            const cost = attacker.hp * 0.2;
            attacker.hp = Math.max(1, attacker.hp - cost);
            attacker.nextSpellMult = 2.0 + slvl * 0.05;
            if (fx) fx.emitBurst(attacker.x, attacker.y, '#ff00ff', 10);
            bus.emit('combat:log', { text: "Dark Pact!", cls: 'log-dmg' });
        }
        if (skillId === 'metamorphosis') {
            applyStatus(attacker, 'metamorphosis', 30 + slvl, slvl);
            bus.emit('combat:log', { text: "METAMORPHOSIS!", cls: 'log-crit' });
        }
    }
};
