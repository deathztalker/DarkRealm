export const WARLOCK_MUTATIONS = {
    shadow_bolt: [
        {
            id: 'sb_siphon', name: 'Soul Siphon', max: 5,
            desc: 'Heals 2% of Max HP on hit.',
            masteryPerk: 'Soul Harvest: Gains +5% Shadow damage for every Soul harvested (stacks to 10).',
            mod: { healOnHitPct: 2 },
            icon: 'ra-shadow-follower'
        },
        {
            id: 'sb_chain', name: 'Nether Chain', max: 5,
            desc: 'Chains to 1 additional target per level.',
            masteryPerk: 'Void Beam: The chain creates a persistent beam that ticks damage every 0.5s.',
            mod: { extraTargets: 1 },
            icon: 'ra-chain'
        }
    ],
    curse_of_weakness: [
        {
            id: 'cow_enfeeble', name: 'Enfeeble', max: 5,
            desc: '-10% Enemy Damage per level.',
            masteryPerk: 'Confusion: Cursed enemies have a 10% chance to attack their allies.',
            mod: { enemyDmgReduction: 10 },
            icon: 'ra-broken-heart'
        },
        {
            id: 'cow_rot', name: 'Soul Rot', max: 5,
            desc: 'Adds 30% Shadow damage over 5s.',
            masteryPerk: 'Reaper: Cursed enemies generate a Soul for you when they die.',
            mod: { dotDmgPct: 30 },
            icon: 'ra-internal-organ'
        }
    ]
};
