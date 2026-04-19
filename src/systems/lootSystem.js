/**
 * Loot System — D2-style item generation with affixes, skill bonuses, sockets
 */
import { ITEM_BASES, SOCKET_MAX, SLOT, RARITY } from '../data/items.js';
import { RUNES } from '../data/runes.js';
import { AFFIXES, getAffixPool, rollAffix } from '../data/affixes.js';
import { bus } from '../engine/EventBus.js';

export const SETS = {
    sigon: {
        name: "Sigon's Complete Steel",
        bonuses: {
            2: [{ stat: 'lifeStealPct', value: 10 }],
            3: [{ stat: 'flatArmor', value: 100 }],
            4: [{ stat: 'flatHP', value: 100 }],
            5: [{ stat: 'flatMP', value: 100 }],
            6: [{ stat: 'pctDmgReduce', value: 20 }, { stat: 'allRes', value: 24 }]
        }
    },
    deaths: {
        name: "Death's Disguise",
        bonuses: {
            2: [{ stat: 'lifeStealPct', value: 8 }],
            3: [{ stat: 'allRes', value: 15 }, { stat: 'flatSTR', value: 10 }]
        }
    },
    milabregas: {
        name: "Milabrega's Regalia",
        bonuses: {
            2: [{ stat: 'pctAtkRating', value: 50 }, { stat: 'pctArmor', value: 50 }],
            3: [{ stat: 'allRes', value: 15 }, { stat: 'manaRegenPerSec', value: 20 }],
            4: [{ stat: '+allSkills', value: 2 }]
        }
    }
};

export const SET_ITEMS = [
    // Sigon's
    { id: 'sigon_visor', name: "Sigon's Visor", base: 'great_helm', rarity: RARITY.SET, icon: 'item_great_helm_hd', dropLvl: 12, setId: 'sigon', setName: "Sigon's Complete Steel", mods: [{ stat: 'flatMP', value: 30 }, { stat: 'flatArmor', value: 25 }] },
    { id: 'sigon_shelter', name: "Sigon's Shelter", base: 'plate_mail', rarity: RARITY.SET, icon: 'item_plate_mail_hd', dropLvl: 12, setId: 'sigon', setName: "Sigon's Complete Steel", mods: [{ stat: 'lightRes', value: 30 }, { stat: 'flatArmor', value: 50 }] },
    { id: 'sigon_gage', name: "Sigon's Gage", base: 'gauntlets', rarity: RARITY.SET, icon: 'item_gauntlets', dropLvl: 12, setId: 'sigon', setName: "Sigon's Complete Steel", mods: [{ stat: 'flatSTR', value: 10 }, { stat: 'pctIAS', value: 30 }] },
    { id: 'sigon_sabot', name: "Sigon's Sabot", base: 'war_boots', rarity: RARITY.SET, icon: 'item_war_boots', dropLvl: 12, setId: 'sigon', setName: "Sigon's Complete Steel", mods: [{ stat: 'pctMoveSpeed', value: 20 }, { stat: 'coldRes', value: 40 }] },
    { id: 'sigon_wrap', name: "Sigon's Wrap", base: 'leather_belt', rarity: RARITY.SET, icon: 'item_belt', dropLvl: 12, setId: 'sigon', setName: "Sigon's Complete Steel", mods: [{ stat: 'flatHP', value: 20 }, { stat: 'fireRes', value: 20 }] },
    { id: 'sigon_guard', name: "Sigon's Guard", base: 'tower_shield', rarity: RARITY.SET, icon: 'item_shield_hd', dropLvl: 12, setId: 'sigon', setName: "Sigon's Complete Steel", mods: [{ stat: '+allSkills', value: 1 }, { stat: 'blockChance', value: 20 }] },
    // Death's
    { id: 'deaths_touch', name: "Death's Touch", base: 'long_sword', rarity: RARITY.SET, icon: 'item_sword_hd', dropLvl: 6, setId: 'deaths', setName: "Death's Disguise", mods: [{ stat: 'lifeStealPct', value: 4 }, { stat: 'flatMaxDmg', value: 25 }] },
    // ... rest of Death's
    { id: 'deaths_hand', name: "Death's Hand", base: 'leather_gloves', rarity: RARITY.SET, icon: 'item_gloves', dropLvl: 6, setId: 'deaths', setName: "Death's Disguise", mods: [{ stat: 'poisRes', value: 50 }] },
    { id: 'deaths_guard', name: "Death's Guard", base: 'leather_belt', rarity: RARITY.SET, icon: 'item_belt', dropLvl: 6, setId: 'deaths', setName: "Death's Disguise", mods: [{ stat: 'magicDmgReduce', value: 3 }] },
    // Milabrega's
    { id: 'milabrega_orb', name: "Milabrega's Orb", base: 'buckler', rarity: RARITY.SET, icon: 'item_shield_hd', dropLvl: 17, setId: 'milabregas', setName: "Milabrega's Regalia", mods: [{ stat: 'magicFind', value: 20 }] },
    { id: 'milabrega_diadem', name: "Milabrega's Diadem", base: 'crown', rarity: RARITY.SET, icon: 'item_crown', dropLvl: 17, setId: 'milabregas', setName: "Milabrega's Regalia", mods: [{ stat: 'flatMP', value: 15 }, { stat: 'flatHP', value: 15 }] },
    { id: 'milabrega_robe', name: "Milabrega's Robe", base: 'chain_mail', rarity: RARITY.SET, icon: 'item_chain_mail', dropLvl: 17, setId: 'milabregas', setName: "Milabrega's Regalia", mods: [{ stat: 'flatDmgReduce', value: 2 }] },
    { id: 'milabrega_rod', name: "Milabrega's Rod", base: 'war_hammer', rarity: RARITY.SET, icon: 'item_war_hammer_hd', dropLvl: 17, setId: 'milabregas', setName: "Milabrega's Regalia", mods: [{ stat: 'pctDmg', value: 50 }] }
];

// Unique item definitions (hand-crafted, fixed mods)
const UNIQUES = [
    {
        id: 'joacos_valanyr',
        name: "Joaco's Val'anyr",
        base: 'mace',
        rarity: RARITY.UNIQUE,
        icon: 'item_mace_hd',
        dropLvl: 30,
        mods: [
            { stat: '+allSkills', value: 1 },
            { stat: 'allRes', value: 20 },
            { stat: 'lifeStealPct', value: 10 },
            { stat: 'flatVIT', value: 15 },
            { stat: 'magicFind', value: 25 },
        ],
        flavor: '"Hecha para fidelizar guildies."'
    },
    {
        id: 'shako', name: "Harlequin Crest", base: 'circlet', rarity: RARITY.UNIQUE,
        icon: 'item_circlet', dropLvl: 45,
        mods: [
            { stat: '+allSkills', value: 2 },
            { stat: 'flatHP', value: 98 },
            { stat: 'flatMP', value: 98 },
            { stat: 'pctDmg', value: 10 },
            { stat: 'magicFind', value: 50 },
        ],
        flavor: '"Cap adorned with the fool\'s motley — yet no fool would discard it."'
    },
    {
        id: 'soj', name: 'The Stone of Jordan', base: 'ring', rarity: RARITY.UNIQUE,
        icon: 'item_ring', dropLvl: 29,
        mods: [
            { stat: '+allSkills', value: 1 },
            { stat: 'flatMP', value: 20 },
            { stat: 'pctMP', value: 25 },
        ],
        flavor: '"One ring to rule the market... oh, wait, wrong universe."'
    },
    {
        id: 'maras', name: "Mara's Kaleidoscope", base: 'amulet', rarity: RARITY.UNIQUE,
        icon: 'item_amulet', dropLvl: 67,
        mods: [
            { stat: '+allSkills', value: 2 },
            { stat: 'allRes', value: 25 },
            { stat: 'flatVIT', value: 5 },
        ],
        flavor: '"Beauty that wards away the biting cold of the abyss."'
    },
    {
        id: 'nagelring', name: 'Nagelring', base: 'ring', rarity: RARITY.UNIQUE,
        icon: 'item_ring', dropLvl: 7,
        mods: [
            { stat: 'magicFind', value: 30 },
            { stat: 'flatHP', value: 20 },
            { stat: 'thorns', value: 3 },
        ],
        flavor: '"May your pockets always overflow with gold and trinkets."'
    },
    {
        id: 'enigma_robe', name: 'Enigma Robe', base: 'plate_mail', rarity: RARITY.UNIQUE,
        icon: 'item_plate_mail_hd', dropLvl: 65,
        mods: [
            { stat: '+allSkills', value: 2 },
            { stat: 'flatSTR', value: 45 },
            { stat: 'flatHP', value: 750 },
            { stat: 'pctMoveSpeed', value: 45 },
            { stat: 'magicFind', value: 8 },
        ],
        flavor: '"The abyss stares back — and what it sees, it fears."'
    },
    {
        id: 'shaftstop', name: 'Shaft of Anguish', base: 'chain_mail', rarity: RARITY.UNIQUE,
        icon: 'item_chain_mail', dropLvl: 38,
        mods: [
            { stat: 'pctDmgReduce', value: 30 },
            { stat: 'flatHP', value: 300 },
            { stat: 'flatVIT', value: 20 },
            { stat: 'allRes', value: 10 },
        ],
        flavor: '"Rapid as the gale, sharp as the winter frost."'
    },
    {
        id: 'doombringer', name: 'Doombringer', base: 'long_sword', rarity: RARITY.UNIQUE,
        icon: 'item_sword_hd', dropLvl: 50,
        mods: [
            { stat: 'pctDmg', value: 180 },
            { stat: 'lifeStealPct', value: 8 },
            { stat: 'flatSTR', value: 30 },
            { stat: 'allRes', value: 15 },
            { stat: 'pctDmgReduce', value: 10 },
        ],
        flavor: '"It does not merely kill — it unmakes."'
    },
    {
        id: 'spirit_of_barbs', name: 'Spirit of the Ancestors', base: 'grand_totem', rarity: RARITY.UNIQUE,
        icon: 'item_grand_totem', dropLvl: 40,
        mods: [
            { stat: '+classSkills:shaman', value: 3 },
            { stat: '+skillGroup:totem', value: 2 },
            { stat: 'flatMP', value: 120 },
            { stat: 'manaRegenPerSec', value: 8 },
            { stat: 'pctColdDmg', value: 30 },
        ],
        flavor: '"Three ancestors speak through this totem. None of them are silent."'
    },
    // --- Unique Charms ---
    {
        id: 'gheeds_fortune', name: "Gheed's Fortune", base: 'grand_charm', rarity: RARITY.UNIQUE,
        icon: 'item_charm_grand', dropLvl: 62,
        mods: [
            { stat: 'magicFind', value: 40 },
            { stat: 'goldFind', value: 120 },
            { stat: 'flatHP', value: 50 },
        ],
        flavor: '"Greed is... good? No, greed is GREAT."'
    },
    {
        id: 'annihilus', name: 'Annihilus', base: 'small_charm', rarity: RARITY.UNIQUE,
        icon: 'item_charm_small', dropLvl: 80,
        mods: [
            { stat: '+allSkills', value: 1 },
            { stat: 'allRes', value: 15 },
            { stat: 'flatHP', value: 20 },
            { stat: 'flatMP', value: 20 },
        ],
        flavor: '"A shard of the Dark Lord himself, pulsating with infernal power."'
    },
    {
        id: 'hellfire_torch', name: "Hellfire Torch", base: 'grand_charm', rarity: RARITY.UNIQUE,
        icon: 'item_charm_grand', dropLvl: 90,
        mods: [
            { stat: '+allSkills', value: 3 },
            { stat: 'allRes', value: 20 },
            { stat: 'flatSTR', value: 20 },
            { stat: 'flatVIT', value: 20 },
            { stat: 'pctDmg', value: 15 }
        ],
        flavor: '"A flickering flame that holds the essence of three Great Evils."'
    },
    // --- Unique Weapons ---
    {
        id: 'windforce', name: 'Windforce', base: 'war_bow', rarity: RARITY.UNIQUE,
        icon: 'item_bow', dropLvl: 73,
        mods: [
            { stat: 'pctDmg', value: 250 },
            { stat: 'flatMaxDmg', value: 20 },
            { stat: 'pctIAS', value: 20 },
            { stat: 'manaStealPct', value: 6 },
            { stat: 'flatDEX', value: 15 },
        ],
        flavor: '"It does not bend to the wind — the wind bends to it."'
    },
    // --- Unique Shields ---
    {
        id: 'herald_of_zakarum', name: 'Herald of Zakarum', base: 'tower_shield', rarity: RARITY.UNIQUE,
        icon: 'item_shield_hd', dropLvl: 42,
        mods: [
            { stat: '+classSkills:paladin', value: 2 },
            { stat: 'blockChance', value: 30 },
            { stat: 'flatArmor', value: 180 },
            { stat: 'allRes', value: 35 },
            { stat: 'flatSTR', value: 20 },
        ],
        flavor: '"The golden shield of the Order, passed from one champion to the next."'
    },
    {
        id: 'stormshield', name: 'Stormshield', base: 'tower_shield', rarity: RARITY.UNIQUE,
        icon: 'item_shield_hd', dropLvl: 73,
        mods: [
            { stat: 'pctDmgReduce', value: 35 },
            { stat: 'blockChance', value: 35 },
            { stat: 'flatArmor', value: 140 },
            { stat: 'coldRes', value: 30 },
            { stat: 'lightRes', value: 25 },
            { stat: 'flatSTR', value: 30 },
        ],
        flavor: '"Where thunder and lightning break upon an immovable wall."'
    },
    {
        id: 'butchers_cleaver', name: 'Butcher\'s Cleaver', base: 'war_axe', rarity: RARITY.UNIQUE,
        icon: 'item_axe_hd', dropLvl: 10,
        mods: [
            { stat: 'pctDmg', value: 80 },
            { stat: 'lifeStealPct', value: 10 },
            { stat: 'flatSTR', value: 15 },
            { stat: 'thorns', value: 15 },
        ],
        flavor: '"FRESH MEAT!"'
    },
    {
        id: 'vampire_gaze', name: 'Vampire Gaze', base: 'great_helm', rarity: RARITY.UNIQUE,
        icon: 'item_great_helm_hd', dropLvl: 41,
        mods: [
            { stat: 'lifeStealPct', value: 8 },
            { stat: 'manaStealPct', value: 8 },
            { stat: 'pctDmgReduce', value: 20 },
            { stat: 'coldRes', value: 15 },
        ],
        flavor: '"The gaze that drains the soul before the body."'
    },
    {
        id: 'gore_rider', name: 'Gore Rider', base: 'war_boots', rarity: RARITY.UNIQUE,
        icon: 'item_war_boots', dropLvl: 47,
        mods: [
            { stat: 'pctMoveSpeed', value: 30 },
            { stat: 'critChance', value: 15 },
            { stat: 'flatDEX', value: 10 },
            { stat: 'pctIAS', value: 10 },
        ],
        flavor: '"Walk through the blood of your enemies without losing your footing."'
    },
    {
        id: 'wirts_leg', name: "Niruko's Leg", base: 'wirts_leg', rarity: RARITY.UNIQUE,
        icon: 'item_wirts_leg', dropLvl: 1,
        mods: [{ stat: 'flatLightDmg', value: 50 }, { stat: 'pctIAS', value: 20 }, { stat: 'flatINT', value: 10 }],
        flavor: '"There was something about a portal in the Dark Wood..."',
        identified: true
    },
    {
        id: 'arreats_face', name: "Arreat's Face", base: 'great_helm', rarity: RARITY.UNIQUE,
        icon: 'item_great_helm_hd', dropLvl: 42,
        mods: [
            { stat: '+classSkills:warrior', value: 2 },
            { stat: 'pctIAS', value: 30 },
        { stat: 'lifeStealPct', value: 6 },
            { stat: 'allRes', value: 30 },
            { stat: 'flatSTR', value: 20 },
            { stat: 'flatVIT', value: 20 },
        ],
        flavor: '"The peak of Mount Arreat watches over its sons."'
    },
    {
        id: 'titans_revenge', name: "Titan's Revenge", base: 'javelin', rarity: RARITY.UNIQUE,
        icon: 'item_javelin', dropLvl: 42,
        mods: [
            { stat: '+classSkills:amazon', value: 2 },
            { stat: 'pctIAS', value: 30 },
            { stat: 'pctDmg', value: 150 },
            { stat: 'flatSTR', value: 20 },
            { stat: 'flatDEX', value: 20 },
            { stat: 'pctMoveSpeed', value: 30 },
        ],
        flavor: '"The titans fell, but their fury remained."'
    },

    // ═══════════════════════════════════════════════════════
    // ★★★ WoW LEGENDARY TIER — Proc-based Weapons & Armor ★★★
    // Each has an onHit: { chance, effect } that combat.js reads.
    // ═══════════════════════════════════════════════════════
    {
        id: 'thunderfury', name: 'Thunderfury, Blessed Blade of the Windseeker',
        base: 'long_sword', rarity: RARITY.UNIQUE, icon: 'item_sword_hd', dropLvl: 60,
        mods: [
            { stat: 'pctDmg', value: 160 },
            { stat: 'pctIAS', value: 25 },
            { stat: 'flatLightDmg', value: 45 },
            { stat: 'allRes', value: 30 },
        ],
        onHit: { chance: 0.20, effect: 'chain_lightning', damage: 80, targets: 3, type: 'lightning' },
        flavor: '"Corrupted no more, the blade sings with the fury of storms."',
        isLegendary: true, legendaryColor: '#00ccff'
    },
    {
        id: 'shadowmourne', name: 'Shadowmourne',
        base: 'zweihander', rarity: RARITY.UNIQUE, icon: 'item_sword_hd', dropLvl: 80,
        mods: [
            { stat: 'pctDmg', value: 240 },
            { stat: 'lifeStealPct', value: 12 },
            { stat: 'flatSTR', value: 50 },
            { stat: 'flatHP', value: 400 },
        ],
        onHit: { chance: 1.0, effect: 'soul_stack', maxStacks: 10, explodeDmg: 500, type: 'shadow' },
        flavor: '"The whispers of a thousand consumed souls guide each strike."',
        isLegendary: true, legendaryColor: '#8800cc'
    },
    {
        id: 'sulfuras', name: "Sulfuras, Hand of Ragnaros",
        base: 'war_hammer', rarity: RARITY.UNIQUE, icon: 'item_war_hammer_hd', dropLvl: 70,
        mods: [
            { stat: 'pctDmg', value: 200 },
            { stat: 'flatFireDmg', value: 100 },
            { stat: 'flatSTR', value: 40 },
            { stat: 'fireRes', value: 75 },
        ],
        onHit: { chance: 0.15, effect: 'meteor_drop', damage: 350, radius: 120, type: 'fire' },
        flavor: '"I AM SULFURAS!"',
        isLegendary: true, legendaryColor: '#ff4400'
    },
    {
        id: 'valanyr', name: "Val'anyr, Hammer of Ancient Kings",
        base: 'war_hammer', rarity: RARITY.UNIQUE, icon: 'item_war_hammer_hd', dropLvl: 75,
        mods: [
            { stat: '+allSkills', value: 2 },
            { stat: 'flatHP', value: 600 },
            { stat: 'lifeRegenPerSec', value: 30 },
            { stat: 'allRes', value: 25 },
        ],
        onHit: { chance: 0.10, effect: 'divine_shield', shieldHp: 800, duration: 8 },
        flavor: '"Blessed by Yogg-Saron himself. Each blow mends the worthy."',
        isLegendary: true, legendaryColor: '#ffdd44'
    },
    {
        id: 'atiesh', name: "Atiesh, Greatstaff of the Guardian",
        base: 'war_staff', rarity: RARITY.UNIQUE, icon: 'item_war_staff', dropLvl: 65,
        mods: [
            { stat: '+allSkills', value: 3 },
            { stat: 'flatMP', value: 500 },
            { stat: 'manaRegenPerSec', value: 25 },
            { stat: 'pctDmg', value: 80 },
            { stat: 'critChance', value: 10 },
        ],
        onHit: { chance: 0.12, effect: 'arcane_burst', damage: 200, radius: 80, type: 'magic' },
        passive: { effect: 'mana_aura', manaRegen: 5 },
        flavor: '"The staff of Medivh, the last guardian. Arcane power radiates from it."',
        isLegendary: true, legendaryColor: '#aa44ff'
    },
    {
        id: 'frostmourne', name: "Frostmourne",
        base: 'zweihander', rarity: RARITY.UNIQUE, icon: 'item_sword_hd', dropLvl: 85,
        mods: [
            { stat: 'pctDmg', value: 300 },
            { stat: 'manaStealPct', value: 15 },
            { stat: 'flatColdDmg', value: 80 },
            { stat: 'lifeStealPct', value: 15 },
            { stat: 'flatSTR', value: 60 },
        ],
        onHit: { chance: 0.25, effect: 'soul_rip', damage: 150, freeze: true, freezeDuration: 3, type: 'cold' },
        flavor: '"Whoever wields this cursed blade shall forever hunger."',
        isLegendary: true, legendaryColor: '#44eeff', cursed: true
    },
    {
        id: 'warglaive_azzinoth', name: "Warglaive of Azzinoth",
        base: 'rune_blade', rarity: RARITY.UNIQUE, icon: 'item_rune_blade', dropLvl: 70,
        mods: [
            { stat: 'pctDmg', value: 180 },
            { stat: 'pctIAS', value: 35 },
            { stat: 'flatDEX', value: 30 },
            { stat: 'critChance', value: 20 },
            { stat: 'critMulti', value: 50 },
        ],
        onHit: { chance: 0.20, effect: 'blade_dance', hits: 3, damage: 60, type: 'physical' },
        flavor: '"Torn from the hands of Illidan Stormrage after his defeat in the Black Temple."',
        isLegendary: true, legendaryColor: '#00ff88'
    },
    {
        id: 'thoridal', name: "Thori'dal, the Stars' Fury",
        base: 'long_bow', rarity: RARITY.UNIQUE, icon: 'item_long_bow', dropLvl: 72,
        mods: [
            { stat: 'pctDmg', value: 200 },
            { stat: 'pctIAS', value: 40 },
            { stat: 'flatDEX', value: 35 },
            { stat: 'critChance', value: 15 },
            { stat: 'flatLightDmg', value: 60 },
        ],
        onHit: { chance: 0.30, effect: 'stellar_arrow', damage: 120, piercing: true, type: 'lightning' },
        flavor: '"From the sunwell itself. It never runs out of arrows."',
        isLegendary: true, legendaryColor: '#ffffaa'
    },
    {
        id: 'ashbringer', name: "Corrupted Ashbringer",
        base: 'long_sword', rarity: RARITY.UNIQUE, icon: 'item_sword_hd', dropLvl: 65,
        mods: [
            { stat: 'pctDmg', value: 150 },
            { stat: 'flatHP', value: 200 },
            { stat: '+allSkills', value: 1 },
            { stat: 'allRes', value: 20 },
            { stat: 'lifeStealPct', value: 8 },
        ],
        onHit: { chance: 0.18, effect: 'consecration', damage: 100, radius: 90, type: 'holy', healPlayer: 50 },
        flavor: '"Even corrupted, the blade still yearns to cleanse the darkness."',
        isLegendary: true, legendaryColor: '#ffffff'
    },
    {
        id: 'glaive_fallen_prince', name: "Glaive of the Fallen Prince",
        base: 'rune_blade', rarity: RARITY.UNIQUE, icon: 'item_rune_blade', dropLvl: 78,
        mods: [
            { stat: 'pctDmg', value: 210 },
            { stat: 'lifeStealPct', value: 10 },
            { stat: 'flatColdDmg', value: 50 },
            { stat: 'flatHP', value: 300 },
            { stat: 'pctIAS', value: 20 },
        ],
        onHit: { chance: 0.08, effect: 'army_of_the_dead', count: 3, duration: 12, type: 'shadow' },
        flavor: '"The Lich King\'s will made blade. Three souls are bound to serve it."',
        isLegendary: true, legendaryColor: '#88aaff'
    },

    // ═══════════════════════════════════════════════════════
    // ★★★ NUEVOS LEGENDARIOS CON SINERGIAS ★★★
    // synergies: ver synergyEngine.js – LEGENDARY_SYNERGIES[id]
    // ═══════════════════════════════════════════════════════

    {   // ── DOOMHAMMER — Shaman legendary (melee lightning, Windfury synergy)
        id: 'doomhammer', name: "Doomhammer",
        base: 'war_hammer', rarity: RARITY.UNIQUE, icon: 'item_war_hammer_hd', dropLvl: 68,
        mods: [
            { stat: 'pctDmg', value: 175 },
            { stat: 'flatLightDmg', value: 70 },
            { stat: 'flatSTR', value: 30 },
            { stat: 'pctIAS', value: 20 },
            { stat: 'allRes', value: 20 },
        ],
        onHit: { chance: 0.18, effect: 'chain_lightning', damage: 120, targets: 4, type: 'lightning',
                 extraEffect: 'lightning_overload' },
        flavor: '"Forged by Grim Batol dwarves, consecrated by a dying shaman. Earth and storm obey it."',
        isLegendary: true, legendaryColor: '#33aaff'
    },
    {   // ── RHOK'DELAR — Ranger/Druid (nature arrow, hunter's mark synergy)
        id: 'rhokdelar', name: "Rhok'delar, Longbow of the Ancient Keepers",
        base: 'long_bow', rarity: RARITY.UNIQUE, icon: 'item_long_bow', dropLvl: 60,
        mods: [
            { stat: 'pctDmg', value: 190 },
            { stat: 'pctIAS', value: 35 },
            { stat: 'flatDEX', value: 40 },
            { stat: 'critChance', value: 18 },
            { stat: 'critMulti', value: 40 },
        ],
        onHit: { chance: 0.22, effect: 'stellar_arrow', damage: 140, natureExplosion: true, type: 'magic',
                 extraEffect: 'nature_burst' },
        passive: { effect: 'mana_aura', manaRegen: 4 },
        flavor: '"The Ancients of Kalimdor still whisper through its wood."',
        isLegendary: true, legendaryColor: '#44ff88'
    },
    {   // ── DRACONIC EDGE — Warrior (dragon breath, berserk synergy)
        id: 'draconic_edge', name: "Draconic Edge",
        base: 'long_sword', rarity: RARITY.UNIQUE, icon: 'item_sword_hd', dropLvl: 65,
        mods: [
            { stat: 'pctDmg', value: 185 },
            { stat: 'flatFireDmg', value: 55 },
            { stat: 'flatSTR', value: 35 },
            { stat: 'critChance', value: 12 },
            { stat: 'fireRes', value: 50 },
        ],
        onHit: { chance: 0.16, effect: 'meteor_drop', damage: 220, radius: 90, type: 'fire',
                 extraEffect: 'dragon_breath' },
        flavor: '"Carved from the spine-ridge of Onyxia herself. It still breathes."',
        isLegendary: true, legendaryColor: '#ff6600'
    },
    {   // ── STAFF OF ETERNAL WINTER — Sorceress (blizzard veil, cold synergy)
        id: 'staff_eternal_winter', name: "Staff of Eternal Winter",
        base: 'war_staff', rarity: RARITY.UNIQUE, icon: 'item_war_staff', dropLvl: 70,
        mods: [
            { stat: '+allSkills', value: 3 },
            { stat: 'flatColdDmg', value: 80 },
            { stat: 'flatMP', value: 400 },
            { stat: 'manaRegenPerSec', value: 20 },
            { stat: 'critChance', value: 8 },
            { stat: 'coldRes', value: 60 },
        ],
        onHit: { chance: 0.20, effect: 'soul_rip', damage: 180, freeze: true, freezeDuration: 4,
                 aoe: true, aoeRadius: 100, type: 'cold', extraEffect: 'blizzard_veil' },
        passive: { effect: 'cold_aura', coldResBoost: 25 },
        flavor: '"From the Icecrown Citadel\'s deepest vault. Time itself freezes at its touch."',
        isLegendary: true, legendaryColor: '#aaeeff'
    },
    {   // ── VOIDREAPER — Warlock (void wound, soul fire synergy)
        id: 'voidreaper', name: "Voidreaper",
        base: 'zweihander', rarity: RARITY.UNIQUE, icon: 'item_sword_hd', dropLvl: 75,
        mods: [
            { stat: 'pctDmg', value: 220 },
            { stat: 'flatHP', value: 250 },
            { stat: 'lifeStealPct', value: 8 },
            { stat: 'manaStealPct', value: 10 },
            { stat: '+allSkills', value: 1 },
        ],
        onHit: { chance: 0.18, effect: 'arcane_burst', damage: 250, radius: 85, type: 'shadow',
                 manaShred: true, manaShredAmt: 120, extraEffect: 'void_wound' },
        flavor: '"It doesn\'t cut through flesh. It cuts through existence."',
        isLegendary: true, legendaryColor: '#7711cc'
    },
    {   // ── BONEREAVER'S EDGE — Necromancer (armor shatter, amplify damage synergy)
        id: 'bonereaver_edge', name: "Bonereaver's Edge",
        base: 'zweihander', rarity: RARITY.UNIQUE, icon: 'item_sword_hd', dropLvl: 72,
        mods: [
            { stat: 'pctDmg', value: 200 },
            { stat: 'flatSTR', value: 45 },
            { stat: 'flatHP', value: 300 },
            { stat: 'pctIAS', value: 15 },
        ],
        onHit: { chance: 1.0, effect: 'soul_stack', maxStacks: 6, explodeDmg: 380, type: 'physical',
                 armorShred: true, armorShredAmt: -120, extraEffect: 'bone_shatter' },
        flavor: '"Each strike strips away another layer of defense. And dignity."',
        isLegendary: true, legendaryColor: '#ccaa55'
    },
    {   // ── DIRGE — Rogue (shadow poison, pandemic synergy)
        id: 'dirge', name: "Dirge",
        base: 'rune_blade', rarity: RARITY.UNIQUE, icon: 'item_rune_blade', dropLvl: 66,
        mods: [
            { stat: 'pctDmg', value: 160 },
            { stat: 'flatDEX', value: 35 },
            { stat: 'critChance', value: 22 },
            { stat: 'critMulti', value: 60 },
            { stat: 'pctIAS', value: 30 },
        ],
        onHit: { chance: 0.25, effect: 'blade_dance', hits: 4, damage: 80, type: 'shadow',
                 poisonOnHit: true, poisonDps: 50, poisonDuration: 6, extraEffect: 'dirge_echo' },
        flavor: '"A song played only for the dying. Each note is a cut."',
        isLegendary: true, legendaryColor: '#88ff44'
    },
    {   // ── HAMMER OF THE NAARU — Paladin (holy storm, consecration synergy)
        id: 'hammer_naaru', name: "Hammer of the Naaru",
        base: 'war_hammer', rarity: RARITY.UNIQUE, icon: 'item_war_hammer_hd', dropLvl: 70,
        mods: [
            { stat: '+allSkills', value: 2 },
            { stat: 'flatHP', value: 450 },
            { stat: 'lifeRegenPerSec', value: 20 },
            { stat: 'allRes', value: 30 },
            { stat: 'pctDmg', value: 120 },
        ],
        onHit: { chance: 0.14, effect: 'consecration', damage: 200, radius: 110, type: 'holy',
                 healPlayer: 100, extraEffect: 'naaru_blessing' },
        passive: { effect: 'holy_aura', holyResist: 30 },
        flavor: '"A gift from the Naaru. It hums with a thousand prayers."',
        isLegendary: true, legendaryColor: '#ffeeaa'
    },
    {   // ── QUEL'SERRAR — Warrior/Paladin (precision strike, shield synergy)
        id: 'quelserrar', name: "Quel'Serrar",
        base: 'long_sword', rarity: RARITY.UNIQUE, icon: 'item_sword_hd', dropLvl: 58,
        mods: [
            { stat: 'pctDmg', value: 140 },
            { stat: 'flatArmor', value: 200 },
            { stat: 'blockChance', value: 15 },
            { stat: 'flatSTR', value: 25 },
            { stat: 'allRes', value: 15 },
        ],
        onHit: { chance: 0.20, effect: 'divine_shield', shieldHp: 600, duration: 6,
                 swordAuraActive: true, extraEffect: 'quel_cleave' },
        flavor: '"Tempered in the Sunken Temple\'s fires. Ancient elven rune-work sings in battle."',
        isLegendary: true, legendaryColor: '#ddcc33'
    },
    {   // ── DRAGONBREATH HAND CANNON — Ranger/Warrior (fire cone, dragon synergy)
        id: 'dragonbreath_cannon', name: "Dragonbreath Hand Cannon",
        base: 'rune_blade', rarity: RARITY.UNIQUE, icon: 'item_rune_blade', dropLvl: 74,
        mods: [
            { stat: 'pctDmg', value: 195 },
            { stat: 'flatFireDmg', value: 65 },
            { stat: 'critChance', value: 16 },
            { stat: 'critMulti', value: 45 },
            { stat: 'pctIAS', value: 25 },
        ],
        onHit: { chance: 0.15, effect: 'meteor_drop', damage: 280, radius: 80, type: 'fire',
                 coneFire: true, coneAngle: 60, extraEffect: 'fire_cone' },
        flavor: '"The gnomes built it. A dragon tested it. Both regretted it."',
        isLegendary: true, legendaryColor: '#ff8800'
    },

    // ═══════════════════════════════════════════════════════
    // ★★★ LEGENDARY SYNERGY CHARMS ★★★
    // Estos charms no son ítems normales — son pequeñas piedras
    // que se equipan en el "charm bag" y mejoran procs de legendarios.
    // ═══════════════════════════════════════════════════════

    {
        id: 'charm_storm_heart', name: "Storm Heart",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 55,
        mods: [{ stat: 'flatLightDmg', value: 15 }, { stat: 'allRes', value: 10 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['thunderfury'],
        flavor: '"A spark of the windseeker\'s soul, crystallized in amber."',
        isLegendary: true, legendaryColor: '#00ccff'
    },
    {
        id: 'charm_soul_shard', name: "Soul Shard",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 65,
        mods: [{ stat: 'lifeStealPct', value: 4 }, { stat: 'flatHP', value: 80 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['shadowmourne'],
        flavor: '"A fragment of one of the thousand souls consumed. It hungers."',
        isLegendary: true, legendaryColor: '#8800cc'
    },
    {
        id: 'charm_cinders_heart', name: "Cinder's Heart",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 58,
        mods: [{ stat: 'fireRes', value: 20 }, { stat: 'flatFireDmg', value: 20 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['sulfuras', 'draconic_edge', 'dragonbreath_cannon'],
        flavor: '"Never fully extinguished. Even in water it smolders."',
        isLegendary: true, legendaryColor: '#ff4400'
    },
    {
        id: 'charm_amber_seal', name: "Amber Seal of Kings",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 62,
        mods: [{ stat: 'flatHP', value: 120 }, { stat: 'allRes', value: 12 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['valanyr', 'quelserrar', 'hammer_naaru'],
        flavor: '"Blessed by seven paladins during the Second War. Their faith endures."',
        isLegendary: true, legendaryColor: '#ffdd44'
    },
    {
        id: 'charm_arcane_focus', name: "Arcane Focus Crystal",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 60,
        mods: [{ stat: 'flatMP', value: 100 }, { stat: 'manaRegenPerSec', value: 8 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['atiesh', 'voidreaper'],
        flavor: '"Used by Medivh to focus the energies of a dying star."',
        isLegendary: true, legendaryColor: '#aa44ff'
    },
    {
        id: 'charm_frost_rune', name: "Frost Rune Fragment",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 70,
        mods: [{ stat: 'coldRes', value: 25 }, { stat: 'flatColdDmg', value: 18 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['frostmourne', 'staff_eternal_winter'],
        flavor: '"A chip of Icecrown itself. Still cold after ten thousand years."',
        isLegendary: true, legendaryColor: '#44eeff'
    },
    {
        id: 'charm_shadow_wisp', name: "Shadow Wisp",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 56,
        mods: [{ stat: 'critChance', value: 6 }, { stat: 'pctIAS', value: 10 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['warglaive_azzinoth', 'dirge'],
        flavor: '"The last echo of a night elf hunter, bound to serve forever."',
        isLegendary: true, legendaryColor: '#00ff88'
    },
    {
        id: 'charm_sunfire_quiver', name: "Sunfire Quiver",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 60,
        mods: [{ stat: 'pctDmg', value: 20 }, { stat: 'critChance', value: 5 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['thoridal', 'rhokdelar'],
        flavor: '"Arrows that never run dry. Each one burns with sunwell light."',
        isLegendary: true, legendaryColor: '#ffffaa'
    },
    {
        id: 'charm_holy_relic', name: "Holy Relic of the Silver Hand",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 60,
        mods: [{ stat: 'lifeRegenPerSec', value: 10 }, { stat: 'allRes', value: 10 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['ashbringer', 'hammer_naaru'],
        flavor: '"A symbol of the Silver Hand order. It protects those who protect others."',
        isLegendary: true, legendaryColor: '#ffffff'
    },
    {
        id: 'charm_bone_marrow', name: "Bone Marrow Talisman",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 65,
        mods: [{ stat: 'flatHP', value: 100 }, { stat: 'pctArmor', value: 15 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['glaive_fallen_prince', 'bonereaver_edge'],
        flavor: '"Made from the marrow of a Lich. It radiates cold malevolence."',
        isLegendary: true, legendaryColor: '#88aaff'
    },
    {
        id: 'charm_thunder_talisman', name: "Thunder Talisman",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 55,
        mods: [{ stat: 'flatLightDmg', value: 22 }, { stat: 'pctIAS', value: 8 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['doomhammer', 'thunderfury'],
        flavor: '"Carved by the first Farseer from a lightning-struck sapphire."',
        isLegendary: true, legendaryColor: '#33aaff'
    },
    {
        id: 'charm_void_fragment', name: "Void Fragment",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 68,
        mods: [{ stat: 'manaStealPct', value: 5 }, { stat: 'lifeStealPct', value: 3 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['voidreaper', 'frostmourne'],
        flavor: '"A crack in reality, held within glass. It hums with nothing."',
        isLegendary: true, legendaryColor: '#7711cc'
    },
    {
        id: 'charm_glacial_shard', name: "Glacial Shard",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 65,
        mods: [{ stat: 'coldRes', value: 30 }, { stat: 'flatColdDmg', value: 25 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['staff_eternal_winter'],
        flavor: '"A needle of pure Northrend ice that never melts."',
        isLegendary: true, legendaryColor: '#aaeeff'
    },
    {
        id: 'charm_bone_dust', name: "Bone Dust",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 62,
        mods: [{ stat: 'pctDmg', value: 12 }, { stat: 'critMulti', value: 25 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['bonereaver_edge'],
        flavor: '"Ground from the bones of a titan. Breathe it in and see the void."',
        isLegendary: true, legendaryColor: '#ccaa55'
    },
    {
        id: 'charm_ancients_call', name: "Call of the Ancients",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 58,
        mods: [{ stat: '+allSkills', value: 1 }, { stat: 'flatDEX', value: 15 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['rhokdelar', 'thoridal'],
        flavor: '"Three ancient keepers answer its call. Their names are lost to time."',
        isLegendary: true, legendaryColor: '#44ff88'
    },
    {
        id: 'charm_dragon_scale', name: "Dragon Scale Fragment",
        base: 'charm', rarity: RARITY.UNIQUE, icon: 'item_ring', dropLvl: 60,
        mods: [{ stat: 'fireRes', value: 30 }, { stat: 'flatArmor', value: 80 }],
        isLegendaryCharm: true,
        legendaryBoosts: ['draconic_edge', 'dragonbreath_cannon', 'sulfuras'],
        flavor: '"A single scale from Deathwing himself. Still warm."',
        isLegendary: true, legendaryColor: '#ff6600'
    },
];



export class LootSystem {
    /**
     * Roll a loot drop from a dead enemy.
     * @param {object} enemy - { level, type:'normal'|'elite'|'boss', classId? }
     * @returns {object|null} item or null (no drop)
     */
    roll(enemy, playerStats = {}) {
        const dropChance = this._dropChance(enemy);
        if (Math.random() > dropChance) return null;

        // 10% chance to drop a gem instead of regular equipment
        if (Math.random() < 0.1) {
            const gemBases = Object.keys(ITEM_BASES).filter(id => ITEM_BASES[id].type === 'gem');
            const gemId = gemBases[Math.floor(Math.random() * gemBases.length)];
            return this._buildItem(gemId, ITEM_BASES[gemId], RARITY.NORMAL, 1);
        }

        const rarity = this._rollRarity(enemy, playerStats.magicFind || 0);
        const ilvl = Math.max(1, enemy.level + (rarity === RARITY.RARE ? 3 : 0));

        // Unique roll
        if (rarity === RARITY.UNIQUE) {
            const eligible = UNIQUES.filter(u => u.dropLvl <= ilvl);
            if (eligible.length) {
                const u = eligible[Math.floor(Math.random() * eligible.length)];
                return this._buildUnique(u);
            }
        }

        // Set roll
        if (rarity === RARITY.SET) {
            const eligible = SET_ITEMS.filter(s => s.dropLvl <= ilvl);
            if (eligible.length) {
                const s = eligible[Math.floor(Math.random() * eligible.length)];
                return this._buildSetItem(s);
            }
        }

        return this.generate(ilvl, rarity);
    }

    /**
     * Generate a specific item by level and rarity (used for shops/gambling)
     */
    generate(ilvl = 1, rarity = RARITY.NORMAL) {
        const baseIds = Object.keys(ITEM_BASES).filter(id => {
            const b = ITEM_BASES[id];
            return b.type !== 'gem' && b.type !== 'potion' && b.type !== 'scroll' && b.type !== 'material';
        });
        const baseId = baseIds[Math.floor(Math.random() * baseIds.length)];
        const base = ITEM_BASES[baseId];
        return this._buildItem(baseId, base, rarity, ilvl);
    }

    _dropChance(enemy) {
        return enemy.type === 'boss' ? 1.0
            : enemy.type === 'elite' ? 0.55
                : 0.20;
    }

    _rollRarity(enemy, magicFind = 0) {
        const isJewelry = Math.random() < 0.15; // Placeholder check if we were rolling for type before rarity
        const r = Math.random();
        const boost = enemy.type === 'boss' ? 0.35 : (enemy.type === 'unique' ? 0.2 : (enemy.type === 'rare' ? 0.1 : (enemy.type === 'champion' ? 0.05 : 0)));
        const effectiveMF = magicFind * 250 / (magicFind + 250);
        const mfBoost = effectiveMF / 100;

        let targetRarity = RARITY.NORMAL;
        // MF Impact: D2-style diminishing returns but more pronounced for this game's pace
        const uniqueChance = 0.005 + boost * 0.4 + mfBoost * 0.025;
        const setChance = 0.015 + boost * 0.3 + mfBoost * 0.045;
        const rareChance = 0.10 + boost * 0.2 + mfBoost * 0.15;
        const magicChance = 0.45 + boost * 0.1 + mfBoost * 0.25;

        if (r < uniqueChance) targetRarity = RARITY.UNIQUE;
        else if (r < uniqueChance + setChance) targetRarity = RARITY.SET;
        else if (r < uniqueChance + setChance + rareChance) targetRarity = RARITY.RARE;
        else if (r < uniqueChance + setChance + rareChance + magicChance) targetRarity = RARITY.MAGIC;

        return targetRarity;
    }

    _pickUnique(baseId, ilvl) {
        const matches = UNIQUES.filter(u => u.base === baseId && u.dropLvl <= ilvl);
        return matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)] : null;
    }

    _pickSetItem(baseId, ilvl) {
        const matches = SET_ITEMS.filter(s => s.base === baseId && s.dropLvl <= ilvl);
        return matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)] : null;
    }

    _buildItem(baseId, base, rarity, ilvl) {
        // Jewelry and Charms should always be at least Magic
        if ((base.type === 'ring' || base.type === 'amulet' || base.type === 'charm') && rarity === RARITY.NORMAL) {
            rarity = RARITY.MAGIC;
        }

        if (rarity === RARITY.UNIQUE) {
            const template = this._pickUnique(baseId, ilvl);
            if (template) return this._buildUnique(template, ilvl, base);
            rarity = RARITY.RARE; // fallback if no unique template
        }
        if (rarity === RARITY.SET) {
            const template = this._pickSetItem(baseId, ilvl);
            if (template) return this._buildSetItem(template, ilvl, base);
            rarity = RARITY.RARE; // fallback if no set template
        }

        const item = {
            id: `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            baseId, rarity, ilvl,
            name: base.name, icon: base.icon,
            slot: base.slot, type: base.type,
            minDmg: base.minDmg || 0, maxDmg: base.maxDmg || 0,
            atkSpd: base.atkSpd || 1,
            armor: base.armor || 0, block: base.block || 0,
            req: { ...(base.req || {}) },
            size: base.size || [1, 1],
            twoHanded: !!base.twoHanded,
            mods: [],
            sockets: 0, socketed: [], insertedRunes: [],
            identified: (base.type === 'gem' || base.type === 'potion' || base.type === 'scroll' || base.type === 'ring' || base.type === 'amulet' || base.type === 'charm' || rarity === RARITY.NORMAL),
        };

        // --- Quality Tiering (Exceptional/Elite) ---
        if (base.type !== 'gem' && base.type !== 'potion' && base.type !== 'scroll' && base.type !== 'material') {
            if (ilvl >= 65) {
                item.name = "Elite " + item.name;
                item.minDmg = Math.round(item.minDmg * 2.2);
                item.maxDmg = Math.round(item.maxDmg * 2.2);
                item.armor = Math.round(item.armor * 2.2);
                item.req.str = Math.round((item.req.str || 0) * 1.8);
                item.req.dex = Math.round((item.req.dex || 0) * 1.8);
                item.isElite = true;
            } else if (ilvl >= 35) {
                item.name = "Exceptional " + item.name;
                item.minDmg = Math.round(item.minDmg * 1.5);
                item.maxDmg = Math.round(item.maxDmg * 1.5);
                item.armor = Math.round(item.armor * 1.5);
                item.req.str = Math.round((item.req.str || 0) * 1.4);
                item.req.dex = Math.round((item.req.dex || 0) * 1.4);
                item.isExceptional = true;
            }
        }

        // Enforce normal rarity for gems, potions, and scrolls (Charms should roll affixes)
        if (base.type === 'gem' || base.type === 'potion' || base.type === 'scroll') {
            item.rarity = RARITY.NORMAL;
            rarity = RARITY.NORMAL;
            item.identified = true;
        }

        if (rarity === RARITY.UNIQUE || rarity === RARITY.SET) {
            item.identified = true;
        }

        if (rarity === RARITY.MAGIC && base.type !== 'gem' && base.type !== 'potion') {
            this._addAffixes(item, ilvl, 1, 1);
            item.name = this._buildName(item);
        } else if (rarity === RARITY.RARE && base.type !== 'gem' && base.type !== 'potion') {
            this._addAffixes(item, ilvl, 2, 3);
            item.name = this._buildName(item, true);
        }

        // Generate sockets (40% chance to have sockets if eligible type)
        if (base.type !== 'gem' && base.type !== 'potion' && base.type !== 'ring' && base.type !== 'amulet' && base.type !== 'charm' && base.type !== 'scroll') {
            if (Math.random() < 0.40) {
                const maxSock = SOCKET_MAX[base.type] || 0;
                if (maxSock > 0) item.sockets = Math.min(maxSock, 1 + Math.floor(Math.random() * maxSock));
            }
        }

        this._applyDurability(item, base, ilvl);

        return item;
    }

    _buildUnique(template) {
        const base = ITEM_BASES[template.base];
        if (!base) {
            console.warn(`[LootSystem] Unknown base '${template.base}' for unique '${template.name}'`);
            return null;
        }
        const item = {
            id: `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            baseId: template.base, rarity: RARITY.UNIQUE, ilvl: template.dropLvl,
            name: template.name, icon: template.icon,
            slot: base.slot, type: base.type,
            minDmg: base.minDmg || 0, maxDmg: base.maxDmg || 0,
            atkSpd: base.atkSpd || 1,
            armor: base.armor || 0, block: base.block || 0,
            req: { ...(base.req || {}) },
            size: base.size || [1, 1],
            twoHanded: !!base.twoHanded,
            mods: template.mods.map(m => ({ ...m, stat: m.stat })),
            sockets: 0, socketed: [], insertedRunes: [],
            identified: false,
            flavor: template.flavor,
            // ★ WoW Legendary fields
            onHit: template.onHit || null,
            passive: template.passive || null,
            isLegendary: template.isLegendary || false,
            legendaryColor: template.legendaryColor || null,
            cursed: template.cursed || false,
        };
        this._applyDurability(item, base, template.dropLvl);
        return item;
    }


    _buildSetItem(template) {
        const base = ITEM_BASES[template.base];
        const item = {
            id: `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            baseId: template.base, rarity: RARITY.SET, ilvl: template.dropLvl,
            name: template.name, icon: template.icon, setId: template.setId, setName: SETS[template.setId].name,
            slot: base.slot, type: base.type,
            minDmg: base.minDmg || 0, maxDmg: base.maxDmg || 0,
            atkSpd: base.atkSpd || 1,
            armor: base.armor || 0, block: base.block || 0,
            req: { ...(base.req || {}) },
            size: base.size || [1, 1],
            twoHanded: !!base.twoHanded,
            mods: template.mods.map(m => ({ ...m, stat: m.stat })),
            sockets: 0, socketed: [], insertedRunes: [],
            identified: false
        };
        this._applyDurability(item, base, template.dropLvl);
        return item;
    }

    _applyDurability(item, base, ilvl) {
        const noDurTypes = ['ring', 'amulet', 'charm', 'potion', 'scroll', 'gem'];
        if (noDurTypes.includes(base.type)) return;

        const baseDur = base.durability || (base.type === 'shield' ? 40 : base.type === 'armor' || base.slot === 'chest' ? 50 : 30);
        item.maxDurability = Math.floor(baseDur * (1 + (ilvl / 25)));
        item.durability = item.maxDurability;
    }

    _addAffixes(item, ilvl, maxPre, maxSuf) {
        const numPre = 1 + Math.floor(Math.random() * maxPre);
        const numSuf = Math.floor(Math.random() * (maxSuf + 1));
        const usedIds = new Set();
        const slotType = item.type;

        const pick = (type) => {
            const pool = getAffixPool(slotType, ilvl, type).filter(a => !usedIds.has(a.id));
            if (!pool.length) return;
            const total = pool.reduce((s, a) => s + (a.weight || 100), 0);
            let rnd = Math.random() * total;
            for (const a of pool) {
                rnd -= (a.weight || 100);
                if (rnd <= 0) {
                    usedIds.add(a.id);
                    item.mods.push(rollAffix(a, ilvl));
                    return;
                }
            }
        };

        for (let i = 0; i < numPre; i++) pick('prefix');
        for (let i = 0; i < numSuf; i++) pick('suffix');
    }

    _buildName(item, isRare = false) {
        if (!isRare) {
            const prefix = item.mods.find(m => m.type === 'prefix')?.name || '';
            const suffix = item.mods.find(m => m.type === 'suffix')?.name || '';
            const pStr = prefix ? `${prefix} ` : '';
            const sStr = suffix ? ` of ${suffix}` : '';
            return `${pStr}${item.name}${sStr}`.trim();
        } else {
            const rarePool = ['Grim', 'Doom', 'Shadow', 'Blood', 'Bone', 'Viper', 'Rune', 'Storm', 'Wraith', 'Ghoul', 'Skull', 'Demon'];
            const sufPool = ['Grasp', 'Track', 'Song', 'Cry', 'Mark', 'Bite', 'Weave', 'Grip', 'Flight', 'Wand', 'Spade'];
            const r1 = rarePool[Math.floor(Math.random() * rarePool.length)];
            const r2 = sufPool[Math.floor(Math.random() * sufPool.length)];
            return `${r1} ${r2}`;
        }
    }

    /**
     * Horadric Cube Transmutation Logic
     * @param {Array} cubeArray - The 9-slot array representing the cube contents
     * @returns {Object|null} - The newly created item, or null if no recipe matched
     */
    transmuteCube(cubeArray) {
        const items = cubeArray.filter(i => i !== null);
        if (items.length === 0) return null;

        // Recipe: 3 Hellfire Keys -> Key Set (Phase 27/30)
        if (items.length === 3 && items.every(it => it.id === 'hellfire_key')) {
            return { id: 'hellfire_key_set', name: "Hellfire Key Set", rarity: RARITY.UNIQUE, icon: 'item_key_hellfire', type: 'key', flavor: '"The portal to the Abyss awaits."' };
        }

        // Recipe: Staff of Kings + Viper Amulet -> Horadric Staff
        if (items.length === 2 && items.some(it => it.id === 'staff_of_kings') && items.some(it => it.id === 'viper_amulet')) {
            return { ...ITEM_BASES.horadric_staff, id: 'horadric_staff', rarity: RARITY.UNIQUE };
        }

        // Recipe: Wirt's Leg + Tome of Town Portal -> Secret Cow Level
        if (items.length === 2) {
            const hasLeg = items.some(i => i.baseId === 'wirts_leg');
            const hasTome = items.some(i => i.baseId === 'tome_tp');
            if (hasLeg && hasTome) {
                return { id: 'item_cow_portal', name: "Portal to the Moo Moo Farm", rarity: RARITY.UNIQUE, icon: 'item_scroll_tp', type: 'portal', baseId: 'cow_portal', flavor: '"There is no cow level."' };
            }
        }

        // Recipe: Hel Rune + Town Portal Scroll + Socketed Item = Unsocket Item
        if (items.length === 3) {
            const helIdx = items.findIndex(i => i.baseId === 'rune_hel');
            const tpIdx = items.findIndex(i => i.baseId === 'scroll_town_portal');
            const socketedIdx = items.findIndex(i => i.socketed && i.socketed.length > 0);

            if (helIdx !== -1 && tpIdx !== -1 && socketedIdx !== -1) {
                const clearedItem = JSON.parse(JSON.stringify(items[socketedIdx]));
                clearedItem.socketed = [];
                // Remove runeword unique status if it was a runeword
                if (clearedItem.name.includes('(')) {
                    clearedItem.name = clearedItem.name.substring(clearedItem.name.indexOf('(') + 1, clearedItem.name.lastIndexOf(')'));
                    clearedItem.rarity = RARITY.NORMAL;
                    clearedItem.mods = [];
                }
                return clearedItem;
            }
        }

        // Recipe: 3 Same Gems -> Next Tier
        if (items.length === 3 && items.every(i => i.type === 'gem')) {
            const baseIds = items.map(i => i.baseId);
            if (baseIds[0] === baseIds[1] && baseIds[1] === baseIds[2]) {
                const runeOrder = ['rune_el', 'rune_eld', 'rune_tir', 'rune_nef', 'rune_eth', 'rune_ith', 'rune_tal', 'rune_ral', 'rune_ort', 'rune_thul', 'rune_amn', 'rune_sol', 'rune_shael', 'rune_dol', 'rune_hel', 'rune_io', 'rune_lum', 'rune_ko', 'rune_fal', 'rune_lem', 'rune_pul', 'rune_um', 'rune_mal', 'rune_ist', 'rune_gul', 'rune_vex', 'rune_zod'];
                const idx = runeOrder.indexOf(baseIds[0]);
                if (idx !== -1 && idx < runeOrder.length - 1) {
                    const upgradeBaseId = runeOrder[idx + 1];
                    const base = ITEM_BASES[upgradeBaseId];
                    return this._buildItem(upgradeBaseId, base, RARITY.NORMAL, 1);
                }

                // Gem Upgrade
                if (baseIds[0].includes('chipped_')) {
                    const upgradeBaseId = baseIds[0].replace('chipped_', 'perfect_');
                    if (ITEM_BASES[upgradeBaseId]) {
                        return this._buildItem(upgradeBaseId, ITEM_BASES[upgradeBaseId], RARITY.NORMAL, 1);
                    }
                }
            }
        }

        // Recipe: 3 Magic Rings -> 1 Random Amulet
        if (items.length === 3 && items.every(i => i.type === 'ring' && i.rarity === RARITY.MAGIC)) {
            return this.generate(Math.floor(items.reduce((s, i) => s + i.ilvl, 0) / 3), RARITY.MAGIC);
        }

        // --- Phase 30: Socketing Recipe (Rare Item + 3 Perfect Gems = Add 1 Socket) ---
        const rareItem = items.find(i => i.rarity === RARITY.RARE && i.sockets < (SOCKET_MAX[i.type] || 0));
        const pGems = items.filter(i => i.type === 'gem' && i.baseId.startsWith('perfect_'));
        if (rareItem && pGems.length === 3 && items.length === 4) {
            const newItem = JSON.parse(JSON.stringify(rareItem));
            newItem.sockets++;
            return newItem;
        }

        // Recipe: 3 Same Items -> Next Tier (Runes or Gems)
        if (items.length === 3) {
            const it1 = items[0];
            const allSame = items.every(it => it.baseId === it1.baseId);
            
            if (allSame) {
                if (it1.type === 'rune') {
                    const runeKeys = ['el', 'eld', 'tir', 'nef', 'eth', 'ith', 'tal', 'ral', 'ort', 'thul', 'amn', 'sol', 'shael', 'dol', 'hel', 'io', 'lum', 'ko', 'fal', 'lem', 'pul', 'um', 'mal', 'ist', 'gul', 'vex', 'ohm', 'lo', 'sur', 'ber', 'jah', 'cham', 'zod'];
                    const current = it1.baseId.replace('rune_', '');
                    const idx = runeKeys.indexOf(current);
                    if (idx !== -1 && idx < runeKeys.length - 1) {
                        const nextId = 'rune_' + runeKeys[idx + 1];
                        return { ...RUNES[runeKeys[idx+1]], id: nextId, baseId: nextId, type: 'rune', rarity: RARITY.UNIQUE };
                    }
                }
                
                if (it1.type === 'gem') {
                    const gemTypes = ['ruby', 'sapphire', 'topaz', 'emerald', 'diamond', 'skull', 'amethyst'];
                    const tiers = ['chipped', 'flawed', 'normal', 'flawless', 'perfect'];
                    const currentBase = it1.baseId; 
                    const gemType = gemTypes.find(t => currentBase.includes(t));
                    const tier = tiers.find(t => currentBase.includes(t));
                    
                    if (gemType && tier) {
                        const tierIdx = tiers.indexOf(tier);
                        if (tierIdx < tiers.length - 1) {
                            const nextBase = `${gemType}_${tiers[tierIdx + 1]}`;
                            return this._buildItem(nextBase, ITEM_BASES[nextBase], RARITY.NORMAL, it1.level || 1);
                        }
                    }
                }
            }
        }

        return null; // Invalid recipe
    }

    /** Drop gold on the ground */
    rollGold(enemy, goldFind = 0) {
        const base = enemy.level * 3;
        const mult = enemy.type === 'boss' ? 8 : enemy.type === 'elite' ? 3 : 1;
        const gfMult = 1 + (goldFind / 100);
        return Math.round(base * mult * gfMult * (0.7 + Math.random() * 0.6));
    }

    /**
     * Gheed's Gambling Roll
     * Odds: 1/2000 Unique, 1/1000 Set, 10% Rare, remainder Magic
     */
    generateGamble(baseId, playerLevel = 1) {
        const roll = Math.random();
        let rarity = RARITY.MAGIC;

        if (roll < 0.0005) rarity = RARITY.UNIQUE;       // 1/2000
        else if (roll < 0.001) rarity = RARITY.SET;    // 1/1000
        else if (roll < 0.1) rarity = RARITY.RARE;      // 10%

        let itm;
        if (rarity === RARITY.UNIQUE) {
            const matches = UNIQUES.filter(u => u.base === baseId);
            if (matches.length > 0) {
                itm = this.generateFixedUnique(matches[Math.floor(Math.random() * matches.length)].id);
                itm.identified = false;
                return itm;
            }
            rarity = RARITY.RARE;
        }

        if (rarity === RARITY.SET) {
            const matches = SET_ITEMS.filter(s => s.base === baseId);
            if (matches.length > 0) {
                itm = this.generateFixedSetItem(matches[Math.floor(Math.random() * matches.length)].id);
                itm.identified = false;
                return itm;
            }
            rarity = RARITY.RARE;
        }

        itm = this._buildItem(baseId, rarity, playerLevel);
        itm.identified = true; // Force identified for gamble results
        return itm;
    }

    generateFixedUnique(uniqueId) {
        const template = UNIQUES.find(u => u.id === uniqueId);
        if (!template) return this.generate(1);
        const item = this._buildUnique(template);
        item.identified = (template.base === 'ring' || template.base === 'amulet' || template.base === 'charm') ? true : false;
        return item;
    }

    generateFixedSetItem(setId) {
        const template = SET_ITEMS.find(s => s.id === setId);
        if (!template) return this.generate(1);
        const item = this._buildSetItem(template);
        item.identified = (template.base === 'ring' || template.base === 'amulet') ? true : false;
        return item;
    }

    generateQuestItem(itemId) {
        // Quest items are normal rarity with special baseIds
        return this._buildItem(itemId, RARITY.NORMAL, 1);
    }

    /**
     * Charsi's Imbue Reward
     * Transforms a Normal item into a Rare item.
     */
    imbueItem(item, playerLevel) {
        if (!item || item.rarity !== RARITY.NORMAL) return null;

        // Upgrade to Rare
        const ilvl = Math.max(1, playerLevel + 4);
        item.rarity = RARITY.RARE;
        item.ilvl = ilvl;

        // Add 3-5 affixes
        this._addAffixes(item, ilvl, 2, 3);
        item.name = this._buildName(item, true);
        item.identified = true;

        return item;
    }

    /**
     * Reforge a Rare Item
     * Rerolls all affixes.
     */
    reforgeItem(item, playerLevel) {
        if (!item || item.rarity !== RARITY.RARE) return null;

        item.mods = []; // Clear old affixes
        const ilvl = Math.max(item.ilvl, playerLevel);

        // Reroll 3-6 affixes
        this._addAffixes(item, ilvl, 3, 3);
        item.name = this._buildName(item, true);

        return item;
    }

    /** Phase 29: Crafting Engine */
    rollCraftedItem(baseId, playerLevel) {
        if (!ITEM_BASES[baseId]) return null;
        const base = ITEM_BASES[baseId];
        const ilvl = Math.max(1, playerLevel + 5);

        // Guarantee Rare with 4-6 high tier affixes
        const itm = this._buildItem(baseId, base, RARITY.RARE, ilvl);
        itm.name = "Crafted " + itm.name;
        itm.identified = true;

        // Clear and reroll high quality
        itm.mods = [];
        this._addAffixes(itm, ilvl, 4, 3);

        return itm;
    }
}

// Singleton
export const loot = new LootSystem();
