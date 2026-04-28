export const SHAMAN_MUTATIONS = {
    lightning_bolt: [
        {
            id: 'lb_fork', name: 'Forked Lightning', max: 5,
            desc: 'Lightning Bolt splits into 1 additional target.',
            masteryPerk: 'Targets hit by forks are Shocked, taking 15% increased lightning damage.',
            mod: { extraTargets: 1 },
            icon: 'ra-lightning-storm'
        },
        {
            id: 'lb_overload', name: 'Static Overload', max: 5,
            desc: '+10% chance to cast a second bolt for free.',
            masteryPerk: 'Triple Cast: The free bolt can trigger a third bolt (5% chance).',
            mod: { multiCastChance: 10 },
            icon: 'ra-lightning-trio'
        }
    ],
    searing_totem: [
        {
            id: 'st_multi', name: 'Echoing Spirits', max: 1,
            desc: 'Place 2 Searing Totems at once.',
            masteryPerk: 'Totems now share 20% of your current fire resistance as bonus damage.',
            mod: { extraTotems: 1 },
            icon: 'ra-totem'
        },
        {
            id: 'st_mobile', name: 'Ancestral Bond', max: 5,
            desc: 'Totems have +20% HP and Duration.',
            masteryPerk: 'Mobile Totems: Totems now hover and follow you slowly.',
            mod: { minionHp: 20, minionDur: 20 },
            icon: 'ra-incense'
        }
    ],
    earthquake: [
        {
            id: 'eq_tectonic', name: 'Tectonic Shift', max: 5,
            desc: '+15% Area of Effect per level.',
            masteryPerk: 'Creates a fissure that pulls nearby enemies into the center.',
            mod: { aoeRadiusPct: 15 },
            icon: 'ra-mountains'
        },
        {
            id: 'eq_stone', name: 'Stone Skin', max: 5,
            desc: '+10% Armor while standing in the earthquake.',
            masteryPerk: 'You are Unstoppable while standing within the Earthquake radius.',
            mod: { armorPct: 10 },
            icon: 'ra-stone-tower'
        }
    ]
};
