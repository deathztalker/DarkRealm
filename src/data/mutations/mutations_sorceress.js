export const SORCERESS_MUTATIONS = {
    fireball: [
        {
            id: 'fb_radius', name: 'Greater Explosion', max: 5,
            desc: '+20% Explosion radius per level.',
            masteryPerk: 'Impact leaves a patch of burning ground for 3s.',
            mod: { aoeRadiusPct: 20 },
            icon: 'ra-fireball'
        },
        {
            id: 'fb_plasma', name: 'Plasma Core', max: 5,
            desc: 'Fireball moves 10% faster and pierces 1 enemy.',
            masteryPerk: 'Fireball now explodes on every enemy it pierces.',
            mod: { projectileSpeed: 10, pierceCount: 1 },
            icon: 'ra-burning-embers'
        }
    ],
    frozen_orb: [
        {
            id: 'orb_nova', name: 'Frost Shatter', max: 5,
            desc: 'Final explosion deals +20% damage.',
            masteryPerk: 'Final explosion releases 8 additional Ice Bolts in a nova.',
            mod: { finalExplosionDmg: 20 },
            icon: 'ra-ice-cube'
        },
        {
            id: 'orb_zero', name: 'Absolute Zero', max: 5,
            desc: '+10% Freeze chance per level.',
            masteryPerk: 'Enemies frozen by Orb explode for cold damage on death.',
            mod: { freezeChance: 10 },
            icon: 'ra-snowflake'
        }
    ],
    chain_lightning: [
        {
            id: 'cl_conductivity', name: 'Conductivity', max: 5,
            desc: '+1 Bounce per level.',
            masteryPerk: 'Chain Lightning can now bounce back to the original target.',
            mod: { maxBounces: 1 },
            icon: 'ra-lightning-bolt'
        },
        {
            id: 'cl_static', name: 'Static Field', max: 5,
            desc: '+15% Critical Damage per level.',
            masteryPerk: 'Leaves a static field that shocks enemies for 2s.',
            mod: { critDmgPct: 15 },
            icon: 'ra-electric'
        }
    ]
};
