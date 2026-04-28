export const ROGUE_MUTATIONS = {
    dagger_strike: [
        {
            id: 'ds_kidney', name: 'Kidney Shot', max: 5,
            desc: '+10% Critical Chance per level.',
            masteryPerk: 'Assassinate: 100% Critical Hit chance when attacking from behind.',
            mod: { critChance: 10 },
            icon: 'ra-daggers'
        },
        {
            id: 'ds_poison', name: 'Poisoned Tip', max: 5,
            desc: 'Adds 20% Poison damage over 5s.',
            masteryPerk: 'Contagion: Killing a poisoned enemy spreads the poison to all nearby foes.',
            mod: { poisonDmgPct: 20 },
            icon: 'ra-dripping-blade'
        }
    ],
    smoke_bomb: [
        {
            id: 'sb_blindside', name: 'Blindside', max: 5,
            desc: 'Enemies inside take +20% damage.',
            masteryPerk: 'Evasion: You gain 100% Dodge chance while standing inside the smoke.',
            mod: { enemyTakenDmgPct: 20 },
            icon: 'ra-cloudy-smoke'
        },
        {
            id: 'sb_lingering', name: 'Lingering Fog', max: 5,
            desc: '+1s Smoke Bomb duration per level.',
            masteryPerk: 'Stalker: The smoke bomb now follows you as you move.',
            mod: { duration: 1 },
            icon: 'ra-fizzing-flask'
        }
    ]
};
