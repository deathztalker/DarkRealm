export const DRUID_MUTATIONS = {
    maul: [
        {
            id: 'maul_ravage', name: 'Ravage', max: 5,
            desc: '+15% Bleed damage per level.',
            masteryPerk: 'Shred: Bleeding targets have their Armor reduced by 20%.',
            mod: { bleedDmgPct: 15 },
            icon: 'ra-bear-claw'
        },
        {
            id: 'maul_shaker', name: 'Earthshaker', max: 5,
            desc: 'Adds 20% Earth damage per level.',
            masteryPerk: 'Seismic Wave: Maul creates a shockwave that travels behind the target.',
            mod: { earthDmgPct: 20 },
            icon: 'ra-earth-crack'
        }
    ],
    tornado: [
        {
            id: 'torn_eye', name: 'Eye of the Storm', max: 5,
            desc: '+10% Tornado size per level.',
            masteryPerk: 'Gravity Well: Tornado pulls nearby enemies into its center.',
            mod: { sizePct: 10 },
            icon: 'ra-cyclone'
        },
        {
            id: 'torn_arctic', name: 'Arctic Blast', max: 5,
            desc: 'Adds 20% Cold damage per level.',
            masteryPerk: 'Frozen Trail: Tornado leaves a trail of frozen ground that slows enemies.',
            mod: { coldDmgPct: 20 },
            icon: 'ra-ice-shards'
        }
    ]
};
