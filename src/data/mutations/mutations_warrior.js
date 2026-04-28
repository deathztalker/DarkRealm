export const WARRIOR_MUTATIONS = {
    bash: [
        {
            id: 'bash_heavy', name: 'Heavy Impact', max: 5,
            desc: '+10% Damage and +5% Stun duration per level.',
            masteryPerk: 'Impact waves deal 30% damage to enemies behind the target.',
            mod: { pctDmg: 10, stunDuration: 0.1 },
            icon: 'ra-hammer-drop'
        },
        {
            id: 'bash_bleed', name: 'Internal Bleeding', max: 5,
            desc: 'Causes target to bleed for 50% damage over 3s.',
            masteryPerk: 'Bleeding enemies take 20% more damage from your other skills.',
            mod: { bleedDmg: 50, bleedDur: 3 },
            icon: 'ra-bleeding-hearts'
        }
    ],
    whirlwind: [
        {
            id: 'ww_radius', name: 'Expanding Reach', max: 5,
            desc: '+15% Whirlwind radius per level.',
            masteryPerk: 'Whirlwind projectiles: Every 1s, fire 2 wind blades at nearby enemies.',
            mod: { aoeRadiusPct: 15 },
            icon: 'ra-whirlwind'
        },
        {
            id: 'ww_fortress', name: 'Iron Spinner', max: 5,
            desc: '+5% Damage Reduction while spinning.',
            masteryPerk: 'You are immune to projectiles while Whirlwind is active.',
            mod: { spinDR: 5 },
            icon: 'ra-heavy-shield'
        }
    ],
    cleave: [
        {
            id: 'cleave_arc', name: 'Wide Arc', max: 5,
            desc: '+20% Arc angle per level.',
            masteryPerk: 'Cleave becomes a 360-degree circle attack.',
            mod: { arcAnglePct: 20 },
            icon: 'ra-split-body'
        },
        {
            id: 'cleave_momentum', name: 'Momentum', max: 5,
            desc: '+5% Attack Speed for 3s on hit.',
            masteryPerk: 'At 5 stacks, your next Cleave is an automatic critical hit.',
            mod: { attackSpeedPct: 5 },
            icon: 'ra-fast-forward'
        }
    ]
};
