/**
 * MUTATION TREES — Mini-trees for each skill mastery.
 * Each node alters the base skill behavior.
 */
export const MUTATION_TREES = {
    // --- WARRIOR ---
    bash: [
        {
            id: 'bash_heavy', name: 'Heavy Impact', max: 5,
            desc: '+10% Damage and +5% Stun duration per level.',
            mod: { pctDmg: 10, stunDuration: 0.1 }
        },
        {
            id: 'bash_aoe', name: 'Shattering Strike', max: 5, req: 'bash_heavy:3',
            desc: 'Bash now deals 20% area damage to nearby enemies per level.',
            mod: { aoeRadius: 40, aoeDmgPct: 20 }
        },
        {
            id: 'bash_bleed', name: 'Internal Bleeding', max: 5,
            desc: 'Causes target to bleed for 50% of damage over 3s per level.',
            mod: { bleedDmg: 50, bleedDur: 3 }
        }
    ],

    // --- NECROMANCER ---
    raise_skeleton: [
        {
            id: 'skel_warrior', name: 'Legionnaire', max: 5,
            desc: '+15% Skeleton HP and +10% Armor per level.',
            mod: { minionHp: 15, minionArmor: 10 }
        },
        {
            id: 'skel_archer', name: 'Skeletal Archers', max: 1, req: 'skel_warrior:3',
            desc: 'Converts 50% of your skeletons into Archers.',
            mod: { archerConversion: 0.5 }
        },
        {
            id: 'skel_explosive', name: 'Unstable Remains', max: 5,
            desc: 'Skeletons explode on death for 100% weapon damage as fire per level.',
            mod: { explodeDmg: 100 }
        }
    ],

    // --- SORCERESS ---
    fireball: [
        {
            id: 'fb_radius', name: 'Greater Explosion', max: 5,
            desc: '+20% Explosion radius per level.',
            mod: { aoeRadiusPct: 20 }
        },
        {
            id: 'fb_fork', name: 'Split Flame', max: 1, req: 'fb_radius:3',
            desc: 'Fireball splits into 2 smaller fireballs on impact.',
            mod: { splitCount: 2 }
        },
        {
            id: 'fb_burn', name: 'Intense Heat', max: 5,
            desc: '+10% Burning damage and duration per level.',
            mod: { burnDmg: 10, burnDur: 10 }
        }
    ]
};

/**
 * Utility to calculate total modifiers for a skill based on spent mutation points.
 */
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
        }
    });

    return mods;
}
