export const RANGER_MUTATIONS = {
    multishot: [
        {
            id: 'ms_rain', name: 'Arrow Rain', max: 5,
            desc: '+2 Arrows per level.',
            masteryPerk: 'Skyfall: Arrows now rain from the sky onto the target area on impact.',
            mod: { extraArrows: 2 },
            icon: 'ra-arrow-cluster'
        },
        {
            id: 'ms_broadhead', name: 'Broadhead', max: 5,
            desc: '+10% Knockback per level.',
            masteryPerk: 'Cripple: Hits reduce enemy movement speed by 30% for 3s.',
            mod: { knockbackPct: 10 },
            icon: 'ra-broadhead'
        }
    ],
    explosive_trap: [
        {
            id: 'et_cluster', name: 'Cluster Bomb', max: 5,
            desc: 'Drops 2 additional mini-bombs upon explosion.',
            masteryPerk: 'Seeker: Mini-bombs now track and roll toward nearby enemies.',
            mod: { miniBombCount: 2 },
            icon: 'ra-bomb-explosion'
        },
        {
            id: 'et_napalm', name: 'Napalm', max: 5,
            desc: 'Leaves a fire trail that lasts 5s.',
            masteryPerk: 'Inferno: Fire trail duration is doubled and damage stacks up to 3 times.',
            mod: { trailDuration: 5 },
            icon: 'ra-large-fire'
        }
    ]
};
