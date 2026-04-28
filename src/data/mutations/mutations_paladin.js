export const PALADIN_MUTATIONS = {
    smite: [
        {
            id: 'smite_holy', name: 'Holy Shock', max: 5,
            desc: 'Adds 15% Lightning damage per level.',
            masteryPerk: 'Divine Nova: Releases a Holy Nova on impact, damaging all nearby enemies.',
            mod: { lightningDmgPct: 15 },
            icon: 'ra-heavy-fall'
        },
        {
            id: 'smite_stun', name: 'Stun Lock', max: 5,
            desc: '+10% Stun Chance per level.',
            masteryPerk: 'Judgement: Stunned enemies are also Silenced for 2s.',
            mod: { stunChance: 10 },
            icon: 'ra-broken-shield'
        }
    ],
    holy_aura: [
        {
            id: 'ha_retribution', name: 'Retribution', max: 5,
            desc: 'Reflects 10% of melee damage taken.',
            masteryPerk: 'Holy Reflection: Reflects projectiles 50% of the time while active.',
            mod: { reflectDmgPct: 10 },
            icon: 'ra-sun'
        },
        {
            id: 'ha_divinity', name: 'Divinity', max: 5,
            desc: '+5% All Resistances per level.',
            masteryPerk: 'Divine Shield: Grants 1s of Invulnerability when hit (10s cooldown).',
            mod: { allRes: 5 },
            icon: 'ra-angel-wings'
        }
    ]
};
