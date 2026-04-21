/**
 * RUNES — Individual rune properties and the enhanced Runeword System.
 */

export const RUNES = {
    // Tier 1 — Low (drop lvl 1+)
    el: { name: 'El', icon: 'item_ring', tier: 1, dropLvl: 1, bonuses: { weapon: { flatMinDmg: 1, flatMaxDmg: 3 }, armor: { flatHP: 15 } } },
    eld: { name: 'Eld', icon: 'item_ring', tier: 1, dropLvl: 3, bonuses: { weapon: { pctDmgUndead: 75 }, armor: { flatArmor: 8 } } },
    tir: { name: 'Tir', icon: 'item_amulet', tier: 1, dropLvl: 5, bonuses: { weapon: { manaOnKill: 2 }, armor: { manaRegenPerSec: 2 } } },
    nef: { name: 'Nef', icon: 'item_amulet', tier: 1, dropLvl: 7, bonuses: { weapon: { knockback: true }, armor: { pctMoveSpeed: 5 } } },

    // Tier 2 — Mid
    eth: { name: 'Eth', icon: 'item_ring', tier: 2, dropLvl: 12, bonuses: { weapon: { pctManaSteal: 3 }, armor: { manaRegenPerSec: 5 } } },
    ith: { name: 'Ith', icon: 'item_ring', tier: 2, dropLvl: 15, bonuses: { weapon: { flatMaxDmg: 8 }, armor: { spellDmgPct: 5 } } },
    tal: { name: 'Tal', icon: 'item_amulet', tier: 2, dropLvl: 17, bonuses: { weapon: { poisonDmgPerSec: 35 }, armor: { poisRes: 15 } } },
    ral: { name: 'Ral', icon: 'item_amulet', tier: 2, dropLvl: 19, bonuses: { weapon: { flatFireDmg: 5 }, armor: { fireRes: 15 } } },
    ort: { name: 'Ort', icon: 'item_ring', tier: 2, dropLvl: 21, bonuses: { weapon: { flatLightDmg: 8 }, armor: { lightRes: 15 } } },
    thul: { name: 'Thul', icon: 'item_ring', tier: 2, dropLvl: 23, bonuses: { weapon: { flatColdDmg: 4 }, armor: { coldRes: 15 } } },

    // Tier 3 — High (rare)
    amn: { name: 'Amn', icon: 'item_amulet', tier: 3, dropLvl: 30, bonuses: { weapon: { lifeStealPct: 7 }, armor: { thorns: 10 } } },
    sol: { name: 'Sol', icon: 'item_amulet', tier: 3, dropLvl: 33, bonuses: { weapon: { flatMinDmg: 9, flatMaxDmg: 9 }, armor: { flatHP: 60 } } },
    shael: { name: 'Shael', icon: 'item_ring', tier: 3, dropLvl: 36, bonuses: { weapon: { pctIAS: 20 }, armor: { pctMoveSpeed: 10 } } },
    dol: { name: 'Dol', icon: 'item_ring', tier: 3, dropLvl: 39, bonuses: { weapon: { fearOnHit: true }, armor: { lifeRegenPerSec: 7 } } },
    io: { name: 'Io', icon: 'item_amulet', tier: 3, dropLvl: 42, bonuses: { weapon: { flatVIT: 10 }, armor: { flatVIT: 10 } } },

    // Tier 4 — Elder (very rare)
    lum: { name: 'Lum', icon: 'item_amulet', tier: 4, dropLvl: 45, bonuses: { weapon: { flatMP: 40 }, armor: { flatMP: 60 } } },
    ko: { name: 'Ko', icon: 'item_amulet', tier: 4, dropLvl: 48, bonuses: { weapon: { flatDEX: 10 }, armor: { flatDEX: 10 } } },
    fal: { name: 'Fal', icon: 'item_ring', tier: 4, dropLvl: 51, bonuses: { weapon: { flatSTR: 10 }, armor: { flatSTR: 10 } } },
    lem: { name: 'Lem', icon: 'item_ring', tier: 4, dropLvl: 54, bonuses: { weapon: { goldFind: 75 }, armor: { goldFind: 50 } } },
    pul: { name: 'Pul', icon: 'item_amulet', tier: 4, dropLvl: 57, bonuses: { weapon: { pctDmg: 75 }, armor: { allRes: 10 } } },
    um: { name: 'Um', icon: 'item_amulet', tier: 4, dropLvl: 60, bonuses: { weapon: { allRes: 15 }, armor: { allRes: 22 } } },
    mal: { name: 'Mal', icon: 'item_ring', tier: 4, dropLvl: 63, bonuses: { weapon: { preventHealing: true }, armor: { flatHP: 80 } } },
    ist: { name: 'Ist', icon: 'item_amulet', tier: 4, dropLvl: 66, bonuses: { weapon: { magicFind: 30 }, armor: { magicFind: 25 } } },

    // Tier 5 — Ancient (+skill bonuses, top tier)
    gul: { name: 'Gul', icon: 'item_amulet', tier: 5, dropLvl: 70, bonuses: { weapon: { flatMaxDmg: 20, pctDmg: 20 }, armor: { allSkillBonus: 1 } } },
    vex: { name: 'Vex', icon: 'item_ring', tier: 5, dropLvl: 73, bonuses: { weapon: { manaStealPct: 7 }, armor: { allSkillBonus: 1 } } },
    ohm: { name: 'Ohm', icon: 'item_ring', tier: 5, dropLvl: 76, bonuses: { weapon: { pctDmg: 50 }, armor: { pctMaxColdRes: 5 } } },
    lo: { name: 'Lo', icon: 'item_ring', tier: 5, dropLvl: 79, bonuses: { weapon: { critChance: 20 }, armor: { pctMaxLightRes: 5 } } },
    sur: { name: 'Sur', icon: 'item_ring', tier: 5, dropLvl: 82, bonuses: { weapon: { blindOnHit: true }, armor: { pctMaxMP: 5 } } },
    ber: { name: 'Ber', icon: 'item_amulet', tier: 5, dropLvl: 85, bonuses: { weapon: { crushingBlow: 20 }, armor: { pctDmgRed: 8 } } },
    jah: { name: 'Jah', icon: 'item_amulet', tier: 5, dropLvl: 88, bonuses: { weapon: { ignoreTargetDefense: true }, armor: { pctMaxHP: 5 } } },
    cham: { name: 'Cham', icon: 'item_ring', tier: 5, dropLvl: 91, bonuses: { weapon: { freezeOnHit: true }, armor: { cannotBeFrozen: true } } },
    zod: { name: 'Zod', icon: 'item_ring', tier: 5, dropLvl: 95, bonuses: { weapon: { indestructible: true }, armor: { allSkillBonus: 2 } } },
};

export const RUNEWORDS = [
    {
        id: 'stealth', name: 'Stealth', runes: ['tal', 'eth'], allowedTypes: ['armor', 'chest'],
        bonuses: { pctMoveSpeed: 25, pctIAS: 25, manaRegenPerSec: { min: 10, max: 15 }, poisonRes: 30 },
        desc: "The definitive early-game speed armor."
    },
    {
        id: 'spirit', name: 'Spirit', runes: ['tal', 'thul', 'ort', 'amn'], allowedTypes: ['sword', 'shield'],
        bonuses: { allSkills: 2, pctIAS: { min: 25, max: 35 }, flatMP: { min: 80, max: 120 }, allRes: 35, magicFind: 25 },
        desc: "Unmatched power for casters and defenders alike."
    },
    {
        id: 'enigma', name: 'Enigma', runes: ['jah', 'ith', 'ber'], allowedTypes: ['armor', 'chest'],
        bonuses: { allSkills: 2, pctMoveSpeed: 45, flatSTR: { min: 40, max: 60 }, pctDmgReduce: 8, magicFind: { min: 50, max: 99 }, teleport: 1 },
        desc: "Grants the forbidden art of Teleportation to any hero."
    },
    {
        id: 'infinity', name: 'Infinity', runes: ['ber', 'mal', 'ber', 'ist'], allowedTypes: ['weapon', 'polearm'],
        bonuses: { convictionAura: { min: 10, max: 15 }, pctDmg: { min: 250, max: 325 }, crushingBlow: 40, magicFind: 30 },
        desc: "Breaks the elemental resistances of the strongest foes."
    },
    {
        id: 'grief', name: 'Grief', runes: ['eth', 'tir', 'lo', 'mal', 'ral'], allowedTypes: ['sword', 'axe'],
        bonuses: { flatMaxDmg: { min: 340, max: 400 }, pctIAS: { min: 30, max: 40 }, deadlyStrike: 20, ignoreDefense: 1 },
        desc: "The most powerful physical weapon in existence."
    },
    {
        id: 'insight', name: 'Insight', runes: ['ral', 'tir', 'tal', 'sol'], allowedTypes: ['polearm', 'staff'],
        bonuses: { meditationAura: { min: 12, max: 17 }, pctDmg: { min: 200, max: 260 }, critChance: 20, flatINT: 20 },
        desc: "Standard Mercenary gear for infinite mana sustain."
    },
    {
        id: 'botd', name: 'Breath of the Dying', runes: ['vex', 'hel', 'el', 'eld', 'zod', 'eth'], allowedTypes: ['weapon'],
        bonuses: { pctDmg: { min: 350, max: 400 }, pctIAS: 60, lifeStealPct: { min: 12, max: 15 }, allStats: 30, indestructible: 1 },
        desc: "A massive weapon that makes death itself your ally."
    },
    {
        id: 'cta', name: 'Call to Arms', runes: ['amn', 'ral', 'mal', 'ist', 'ohm'], allowedTypes: ['weapon'],
        bonuses: { allSkills: 1, pctIAS: 40, pctDmg: { min: 250, max: 290 }, battleOrders: { min: 3, max: 6 }, lifeStealPct: 7 },
        desc: "Command your destiny with the shouts of war."
    },
    {
        id: 'hoto', name: 'Heart of the Oak', runes: ['ko', 'vex', 'pul', 'thul'], allowedTypes: ['staff', 'mace', 'wand'],
        bonuses: { allSkills: 3, pctIAS: 40, allRes: { min: 30, max: 40 }, pctMP: 15, flatDEX: 10 },
        desc: "Ancient wisdom flows through this druidic relic."
    },
    {
        id: 'fortitude', name: 'Fortitude', runes: ['el', 'sol', 'dol', 'lo'], allowedTypes: ['armor', 'weapon'],
        bonuses: { pctDmg: 300, allRes: { min: 25, max: 30 }, pctArmor: 200, flatHP: 150, chillingArmor: 15 },
        desc: "Turn your resolve into an impenetrable wall of force."
    },
    {
        id: 'lore', name: 'Lore', runes: ['ort', 'sol'], allowedTypes: ['helm', 'head'],
        bonuses: { allSkills: 1, lightRes: 30, flatDmgReduce: 7, lightRadius: 10 },
        desc: "An early spark of intelligence for any explorer."
    },
    {
        id: 'rhyme', name: 'Rhyme', runes: ['shael', 'eth'], allowedTypes: ['shield'],
        bonuses: { blockChance: 20, allRes: 25, magicFind: 25, goldFind: 50, cannotBeFrozen: 1 },
        desc: "Perfectly balanced defense for the treasure hunter."
    },
    {
        id: 'smoke', name: 'Smoke', runes: ['nef', 'lum'], allowedTypes: ['armor', 'chest'],
        bonuses: { allRes: 50, pctArmor: 75, flatDmgReduce: 5, lightRadius: -1 },
        desc: "Vanishing into the mists of protection."
    },
    {
        id: 'white', name: 'White', runes: ['dol', 'io'], allowedTypes: ['wand'],
        bonuses: { '+skillGroup:poison_bone': 3, pctIAS: 20, flatVIT: 10, manaAfterKill: 4 },
        desc: "The ultimate catalyst for necromantic energy."
    },

    // --- CLASS SPECIFIC & CUSTOM RUNEWORDS (Expansion) ---
    {
        id: 'ancestral_call', name: 'Ancestral Call', runes: ['ral', 'ort', 'tal'], allowedTypes: ['staff', 'totem'],
        bonuses: { '+skillGroup:restoration': 3, totemLifePct: 50, flatINT: { min: 15, max: 25 }, allRes: 20 },
        desc: "Shaman Exclusive: Your totems pulse with the strength of ancestors."
    },
    {
        id: 'shadow_covenant', name: 'Shadow Covenant', runes: ['nef', 'tir', 'vex'], allowedTypes: ['armor', 'chest'],
        bonuses: { shadowNovaOnHit: 15, '+skillGroup:affliction': 2, flatVIT: { min: 20, max: 40 }, shadowRes: 50 },
        desc: "Warlock Exclusive: A dark pact that erupts in shadows when struck."
    },
    {
        id: 'natures_harmony', name: "Nature's Harmony", runes: ['tal', 'thul', 'ko'], allowedTypes: ['bow', 'staff'],
        bonuses: { cooldownReduct: 25, pctMoveSpeed: 20, '+skillGroup:nature': 2, flatDEX: { min: 20, max: 35 } },
        desc: "Ranger/Druid Exclusive: Sync with the wilds to strike faster."
    },
    {
        id: 'oblivion', name: 'Oblivion', runes: ['ohm', 'um', 'zod'], allowedTypes: ['weapon', 'sword', 'axe'],
        bonuses: { shadowAura: 1, openWounds: 50, pctDmg: { min: 300, max: 400 }, lifeStealPct: 15, indestructible: 1 },
        desc: "Legendary: An eternal blade that drains the very soul of the realm."
    },
    {
        id: 'spirit_wild', name: 'Spirit of the Wild', runes: ['amn', 'el', 'ith'], allowedTypes: ['helm', 'head'],
        bonuses: { vigorAura: 1, minionDmgPct: 40, flatHP: { min: 50, max: 100 }, pctStr: 10 },
        desc: "Druid/Warrior: Lead your pack with tireless ferocity."
    },
    {
        id: 'stormbreaker', name: 'Stormbreaker', runes: ['ohm', 'ort', 'shael'], allowedTypes: ['axe', 'mace', 'weapon'],
        bonuses: { flatLightDmg: { min: 100, max: 300 }, pctIAS: 30, chainLightningOnHit: 20, pctDmg: 200 },
        desc: "Warrior/Shaman: Channel the thunder into every blow."
    },
    {
        id: 'avatar_elements', name: 'Avatar of Elements', runes: ['shael', 'thul', 'amn', 'sol'], allowedTypes: ['staff', 'orb'],
        bonuses: { pctFireDmg: 40, pctColdDmg: 40, pctLightDmg: 40, allSkills: 2, flatINT: 30 },
        desc: "Caster Hybrid: Control the primal forces of nature."
    },
    {
        id: 'bulwark_justice', name: 'Bulwark of Justice', runes: ['el', 'eld', 'tir', 'ith'], allowedTypes: ['shield'],
        bonuses: { pctArmor: 150, flatArmor: { min: 100, max: 200 }, thorns: 50, allRes: 25 },
        desc: "Paladin: A shield for those who stand against the tide of darkness."
    },
    {
        id: 'whisper_death', name: 'Whisper of Death', runes: ['dol', 'ort', 'eld'], allowedTypes: ['dagger', 'sword'],
        bonuses: { deadlyStrike: 35, pctDmg: 200, '+skillGroup:shadow': 2, flatDEX: 20 },
        desc: "Rogue/Warlock: A silent blade that speaks only of the end."
    },
    {
        id: 'eternal_slumber', name: 'Eternal Slumber', runes: ['amn', 'ral', 'tal', 'thul'], allowedTypes: ['staff', 'wand', 'bow'],
        bonuses: { monsterFreeze: 5, monsterBlind: 25, shadowRes: 40, manaStealPct: 10 },
        desc: "Warlock/Ranger: Force your enemies into a nightmare they won't wake from."
    },
    {
        id: 'beast_master', name: 'Beast Master', runes: ['ber', 'tir', 'um', 'mal'], allowedTypes: ['axe', 'mace', 'weapon'],
        bonuses: { fanaticismAura: 9, crushingBlow: 20, pctDmg: 250, '+skill:summon_grizzly': 3, openWounds: 25 },
        desc: "Druid/Warrior: Master the savage power of the wild beasts."
    },
    {
        id: 'chaos_bolt', name: 'Chaos Bolt', runes: ['fal', 'ohm', 'um'], allowedTypes: ['weapon', 'sword'],
        bonuses: { whirlWind: 1, pctDmg: 300, flatMagicDmg: { min: 150, max: 250 }, openWounds: 25, pctIAS: 35 },
        desc: "Legendary: Embrace the unpredictable nature of pure chaos."
    }
];

export function findRuneword(insertedRunes, itemType) {
    return RUNEWORDS.find(rw => {
        const itemTypeLower = itemType.toLowerCase();
        if (!rw.allowedTypes.some(t => itemTypeLower.includes(t))) return false;
        if (rw.runes.length !== insertedRunes.length) return false;
        return rw.runes.every((r, i) => r === insertedRunes[i]);
    }) || null;
}
