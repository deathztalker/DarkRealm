/**
 * RUNES — Socket-insertable gems that grant skill/stat bonuses
 * D2/PoE hybrid: insert into sockets on items, remove only with runeword recipe
 *
 * Runewords: specific rune combinations in specific item types grant a 
 * set of extra bonuses (like D2 runewords). E.g. EL+ELD in a sword = "Edge"
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

    // Tier 4 — Elder (very rare, skill bonuses)
    lum: { name: 'Lum', icon: 'item_amulet', tier: 4, dropLvl: 45, bonuses: { weapon: { flatMP: 40 }, armor: { flatMP: 60 } } },
    ko: { name: 'Ko', icon: 'item_amulet', tier: 4, dropLvl: 48, bonuses: { weapon: { flatDEX: 10 }, armor: { flatDEX: 10 } } },
    fal: { name: 'Fal', icon: 'item_ring', tier: 4, dropLvl: 51, bonuses: { weapon: { flatSTR: 10 }, armor: { flatSTR: 10 } } },
    lem: { name: 'Lem', icon: 'item_ring', tier: 4, dropLvl: 54, bonuses: { weapon: { goldFind: 75 }, armor: { goldFind: 50 } } },
    pul: { name: 'Pul', icon: 'item_amulet', tier: 4, dropLvl: 57, bonuses: { weapon: { pctDmg: 75 }, armor: { allRes: 10 } } },
    um: { name: 'Um', icon: 'item_amulet', tier: 4, dropLvl: 60, bonuses: { weapon: { allRes: 15 }, armor: { allRes: 22 } } },
    mal: { name: 'Mal', icon: 'item_ring', tier: 4, dropLvl: 63, bonuses: { weapon: { preventHealing: true }, armor: { flatHP: 80 } } },

    // Tier 5 — Ancient (+skill bonuses, top tier)
    ist: { name: 'Ist', icon: 'item_amulet', tier: 5, dropLvl: 70, bonuses: { weapon: { magicFind: 30 }, armor: { magicFind: 25 } } },
    gul: { name: 'Gul', icon: 'item_amulet', tier: 5, dropLvl: 73, bonuses: { weapon: { flatMaxDmg: 20, pctDmg: 20 }, armor: { allSkillBonus: 1 } } },
    vex: { name: 'Vex', icon: 'item_ring', tier: 5, dropLvl: 76, bonuses: { weapon: { manaStealPct: 7 }, armor: { allSkillBonus: 1 } } },
    zod: { name: 'Zod', icon: 'item_ring', tier: 5, dropLvl: 80, bonuses: { weapon: { allSkillBonus: 1 }, armor: { allSkillBonus: 2 } } },
};

/**
 * RUNEWORDS — Insert runes in exact order into item of correct type
 * Format: { name, runes:[], allowedTypes:[], bonuses:{} }
 */
export const RUNEWORDS = [
    {
        id: 'ancients_pledge', name: "Ancient's Pledge", runes: ['ral', 'ort', 'tal'],
        allowedTypes: ['shield'],
        bonuses: { coldRes: 43, fireRes: 48, lightRes: 48, poisRes: 48, pctArmor: 10 },
        flavor: 'The warriors of old bound three elements into one shield.'
    },
    {
        id: 'stealth', name: 'Stealth', runes: ['tal', 'eth'],
        allowedTypes: ['armor'],
        bonuses: { pctMoveSpeed: 25, manaRegenPerSec: 6, pctDex: 10, critChance: 5 },
        flavor: 'Move unseen, strike without mercy.'
    },
    {
        id: 'edge', name: 'Edge', runes: ['tir', 'tal', 'amn'],
        allowedTypes: ['bow'],
        bonuses: { fireRes: 35, lifeStealPct: 7, pctDmg: 35, manaOnKill: 2 },
        flavor: 'Cut through the dark with a song of fire.'
    },
    {
        id: 'spirit', name: 'Spirit', runes: ['tal', 'thul', 'ort', 'amn'],
        allowedTypes: ['shield', 'source'],
        bonuses: { allSkillBonus: 2, flatMP: 89, flatHP: 25, critChance: 3, allRes: 5 },
        flavor: 'Four runes bound with ancient will. Prized by all spellcasters.'
    },
    {
        id: 'oath', name: 'Oath', runes: ['shael', 'pul', 'mal', 'lum'],
        allowedTypes: ['sword', 'axe', 'mace'],
        bonuses: { pctIAS: 50, pctDmg: 210, allRes: 10, preventHealing: true, flatMP: 10 },
        flavor: 'Swear upon steel. Break it and face ruin.'
    },
    {
        id: 'infinity', name: 'Infinity', runes: ['ber', 'mal', 'ber', 'ist'],
        allowedTypes: ['weapon'],
        bonuses: { pctDmg: 255, critChance: 8, allRes: 55, pctArmor: 35, magicFind: 15 },
        flavor: 'A weapon of legend — coveted by those who command lightning.'
    },
    {
        id: 'enigma', name: 'Enigma', runes: ['jah', 'ith', 'ber'],
        allowedTypes: ['armor'],
        bonuses: { allSkillBonus: 2, flatSTR: 45, flatHP: 750, pctMoveSpeed: 45, magicFind: 8 },
        flavor: 'The riddle of all power, woven into a cloak of darkness.'
    },
    {
        id: 'wisdom', name: 'Wisdom', runes: ['pul', 'ith', 'eld'],
        allowedTypes: ['helm'],
        bonuses: { allSkillBonus: 1, lifeStealPct: 5, pctManaSteal: 5, pctDmg: 15 },
        flavor: 'Clarity of mind purchased with rivers of blood.'
    },
    {
        id: 'tempest', name: 'Tempest', runes: ['ort', 'shael', 'ko', 'vex'],
        allowedTypes: ['totem', 'staff'],
        bonuses: { allSkillBonus: 2, pctLightDmg: 40, pctIAS: 20, critChance: 5, flatMP: 50 },
        flavor: "Channel the storm through the shaman's conduit."
    },
    {
        id: 'bone', name: 'Bone', runes: ['sol', 'um', 'um'],
        allowedTypes: ['armor'],
        bonuses: { allSkillBonus: 1, flatHP: 100, allRes: 25, flatArmor: 50 },
        flavor: 'Armor of the dead, comfort to the necromancer.'
    },
];

export function getRune(id) { return RUNES[id]; }

export function findRuneword(insertedRunes, itemType) {
    return RUNEWORDS.find(rw => {
        if (!rw.allowedTypes.some(t => itemType.includes(t))) return false;
        if (rw.runes.length !== insertedRunes.length) return false;
        return rw.runes.every((r, i) => r === insertedRunes[i]);
    }) || null;
}
