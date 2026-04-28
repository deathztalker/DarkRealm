export const NECROMANCER_MUTATIONS = {
    raise_skeleton: [
        {
            id: 'skel_warrior', name: 'Legionnaire', max: 5,
            desc: '+15% Skeleton HP and +10% Armor.',
            masteryPerk: 'Phalanx: Skeletons take 50% less damage if they are near 3+ other minions.',
            mod: { minionHp: 15, minionArmor: 10 },
            icon: 'ra-skeleton'
        },
        {
            id: 'skel_grave', name: 'Grave Lord', max: 5,
            desc: '+20% Skeleton Damage per level.',
            masteryPerk: 'Corpse Bloom: Skeletons explode for 200% weapon damage on death.',
            mod: { minionDmg: 20 },
            icon: 'ra-skull'
        }
    ],
    bone_spear: [
        {
            id: 'bs_splinter', name: 'Splintering', max: 5,
            desc: 'Spears split into 3 shards on impact.',
            masteryPerk: 'Each splinter applies a 20% Slow for 2s.',
            mod: { splinterCount: 3 },
            icon: 'ra-spear-head'
        },
        {
            id: 'bs_ossified', name: 'Ossified', max: 5,
            desc: '+15% Pierce Damage per level.',
            masteryPerk: 'Boomerang: Spears return to you, hitting enemies again for 50% damage.',
            mod: { pierceDmgPct: 15 },
            icon: 'ra-bone-knife'
        }
    ],
    corpse_explosion: [
        {
            id: 'ce_vile', name: 'Vile Vapors', max: 5,
            desc: 'Explosion leaves a poison cloud for 3s.',
            masteryPerk: 'Poisoned enemies have a 20% chance to explode again on death.',
            mod: { poisonCloudDmg: 50 },
            icon: 'ra-poison-cloud'
        },
        {
            id: 'ce_blood', name: 'Blood Burst', max: 5,
            desc: '+20% Radius but -10% Damage.',
            masteryPerk: 'Heals you for 2% of your Maximum HP for every corpse consumed.',
            mod: { aoeRadiusPct: 20, pctDmg: -10 },
            icon: 'ra-blood'
        }
    ]
};
