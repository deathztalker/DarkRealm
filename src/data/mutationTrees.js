/**
 * MUTATION TREES — Deep mastery trees for each skill.
 * Nodes now include 'masteryPerk' for level 5/max unlocks.
 */
export const MUTATION_TREES = {
    // --- WARRIOR ---
    bash: [
        {
            id: 'bash_heavy', name: 'Heavy Impact', max: 5,
            desc: '+10% Damage and +5% Stun duration.',
            masteryPerk: 'Impact waves deal 30% damage to enemies behind the target.',
            mod: { pctDmg: 10, stunDuration: 0.1 }
        },
        {
            id: 'bash_bleed', name: 'Internal Bleeding', max: 5,
            desc: 'Causes target to bleed for 50% damage over 3s.',
            masteryPerk: 'Bleeding enemies take 20% more damage from your other skills.',
            mod: { bleedDmg: 50, bleedDur: 3 }
        }
    ],
    whirlwind: [
        {
            id: 'ww_radius', name: 'Expanding Reach', max: 5,
            desc: '+15% Whirlwind radius per level.',
            masteryPerk: 'Whirlwind projectiles: Every 1s, fire 2 wind blades at nearby enemies.',
            mod: { aoeRadiusPct: 15 }
        },
        {
            id: 'ww_vortex', name: 'Vacuum Pull', max: 5,
            desc: 'Slowly pulls nearby enemies toward you.',
            masteryPerk: 'Enemies pulled are stunned for 0.5s when the spin ends.',
            mod: { pullStrength: 10 }
        },
        {
            id: 'ww_fortress', name: 'Iron Spinner', max: 5,
            desc: '+5% Damage Reduction while spinning.',
            masteryPerk: 'You are immune to projectiles while Whirlwind is active.',
            mod: { spinDR: 5 }
        }
    ],

    // --- SHAMAN ---
    lightning_bolt: [
        {
            id: 'lb_fork', name: 'Forked Lightning', max: 5,
            desc: 'Lightning Bolt splits into 1 additional target.',
            masteryPerk: 'Targets hit by forks are Shocked, taking 15% increased lightning damage.',
            mod: { extraTargets: 1 }
        },
        {
            id: 'lb_overload', name: 'Static Overload', max: 5,
            desc: '+10% chance to cast a second bolt for free.',
            masteryPerk: 'Triple Cast: The free bolt can trigger a third bolt (5% chance).',
            mod: { multiCastChance: 10 }
        }
    ],
    searing_totem: [
        {
            id: 'st_multi', name: 'Echoing Spirits', max: 1,
            desc: 'Place 2 Searing Totems at once.',
            masteryPerk: 'Totems now share 20% of your current fire resistance as bonus damage.',
            mod: { extraTotems: 1 }
        },
        {
            id: 'st_mobile', name: 'Ancestral Bond', max: 5,
            desc: 'Totems have +20% HP and Duration.',
            masteryPerk: 'Mobile Totems: Totems now hover and follow you slowly.',
            mod: { minionHp: 20, minionDur: 20 }
        }
    ],

    // --- SORCERESS ---
    fireball: [
        {
            id: 'fb_radius', name: 'Greater Explosion', max: 5,
            desc: '+20% Explosion radius.',
            masteryPerk: 'Impact leaves a patch of burning ground for 2s.',
            mod: { aoeRadiusPct: 20 }
        },
        {
            id: 'fb_plasma', name: 'Plasma Core', max: 5,
            desc: 'Fireball moves 10% faster and pierces 1 enemy.',
            masteryPerk: 'Fireball now explodes on every enemy it pierces.',
            mod: { projectileSpeed: 10, pierceCount: 1 }
        }
    ],
    frozen_orb: [
        {
            id: 'orb_nova', name: 'Frost Shatter', max: 5,
            desc: 'Final explosion deals +20% damage.',
            masteryPerk: 'Final explosion releases 8 additional Ice Bolts in a nova.',
            mod: { finalExplosionDmg: 20 }
        }
    ],

    // --- NECROMANCER ---
    raise_skeleton: [
        {
            id: 'skel_warrior', name: 'Legionnaire', max: 5,
            desc: '+15% Skeleton HP and +10% Armor.',
            masteryPerk: 'Phalanx: Skeletons take 50% less damage if they are near 3+ other minions.',
            mod: { minionHp: 15, minionArmor: 10 }
        },
        {
            id: 'skel_elite', name: 'Sole Survivor', max: 5,
            desc: 'If you have only 1 Skeleton, it deals +40% damage.',
            masteryPerk: 'Mega-Minion: The single skeleton becomes a Giant Skeleton with AoE attacks.',
            mod: { loneWolfDmg: 40 }
        }
    ]
};

export function getMutationMods(player, skillId) {
    const mods = {};
    const tree = MUTATION_TREES[skillId];
    if (!tree || !player.mutationTrees[skillId]) return mods;

    const spent = player.mutationTrees[skillId].pointsSpent || {};
    
    tree.forEach(node => {
        const pts = spent[node.id] || 0;
        if (pts > 0) {
            for (const [stat, val] of Object.entries(node.mod)) {
                mods[stat] = (mods[stat] || 0) + (val * pts);
            }
            // Add mastery perk flag if at max points
            if (pts >= node.max) {
                mods[`perk_${node.id}`] = true;
            }
        }
    });

    return mods;
}
