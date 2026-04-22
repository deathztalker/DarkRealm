/**
 * AFFIXES — Complete modifier pool for item generation
 *
 * D2-inspired features:
 *  - Prefixes / Suffixes with ilvl-gated tiers
 *  - Per-affix weight (default 100) for biased random selection
 *  - Mutual exclusion via `excludes` (e.g. can't have two resist affixes)
 *  - Special stat keys:
 *      '+skill:<skillId>'       → +N to that specific skill
 *      '+skillGroup:<group>'    → +N to all skills in a group
 *      '+classSkills:<class>'   → +N to all skills of a class
 *      '+allSkills'             → +N to every skill (ultra-rare)
 *  - Conditional affixes (only roll if player meets requirement)
 *  - Corrupted affix pool (negative mods, for cursed items)
 *  - getAffixPool()  — returns weighted candidate array
 *  - rollAffix()     — picks highest eligible tier, returns rolled mod
 *  - rollAffixes()   — builds a full prefix+suffix set for an item
 *  - validateItem()  — checks for slot/exclusion conflicts
 */

// ─────────────────────────────────────────────────────────────
//  SLOT GROUPS  (defined once, reused everywhere)
// ─────────────────────────────────────────────────────────────

export const SLOTS = {
    ANY: ['helm', 'armor', 'gloves', 'boots', 'shield', 'source', 'mainhand',
        'ring', 'amulet', 'belt', 'wand', 'staff', 'orb', 'totem',
        'sword', 'axe', 'mace', 'dagger', 'bow'],
    ARMOR: ['helm', 'armor', 'gloves', 'boots', 'shield', 'belt'],
    WEAPON: ['mainhand', 'weapon', 'wand', 'staff', 'orb', 'totem',
        'sword', 'axe', 'mace', 'dagger', 'bow'],
    MELEE: ['sword', 'axe', 'mace', 'dagger', 'mainhand'],
    RANGED: ['bow'],
    CASTER: ['wand', 'staff', 'orb'],
    JEWELRY: ['ring', 'amulet'],
    UTILITY: ['belt', 'boots', 'gloves'],
    CHARM: ['charm'],
};

// Shorthand for repeated combos
const AW = [...SLOTS.ARMOR, ...SLOTS.WEAPON];
const AJ = [...SLOTS.ARMOR, ...SLOTS.JEWELRY];
const WJ = [...SLOTS.WEAPON, ...SLOTS.JEWELRY];
const AWJ = [...SLOTS.ARMOR, ...SLOTS.WEAPON, ...SLOTS.JEWELRY];
const AJC = [...SLOTS.ARMOR, ...SLOTS.JEWELRY, 'charm'];
const AWJC = [...AWJ, 'charm'];

// ─────────────────────────────────────────────────────────────
//  AFFIX SCHEMA
//
//  {
//    id:           string          unique key
//    name:         string          display name (prefix/suffix word)
//    type:         'prefix'|'suffix'
//    tiers:        Tier[]          ascending ilvl order
//    stat:         string          player stat key or special '+skill:...' etc.
//    stat2?:       string          optional second stat (dual-stat affixes)
//    allowedSlots: string[]
//    excludes?:    string[]        affix ids that cannot coexist on same item
//    group?:       string          mutual-exclusion group (max 1 per group)
//    weight?:      number          selection weight (default 100)
//    isCorrupted?: boolean         only appears on corrupted items
//    isCursed?:    boolean         negative modifier
//    tags?:        string[]        searchable tags ('attack','defense','elemental'…)
//  }
//
//  Tier: { ilvl, roll:[min,max], roll2?:[min,max] }
// ─────────────────────────────────────────────────────────────

/** @type {AffixDef[]} */
export const AFFIXES = [

    // ══════════════════════════════════════════════════════════
    //  PREFIXES
    // ══════════════════════════════════════════════════════════

    // ── Physical Damage ───────────────────────────────────────
    {
        id: 'damage_min', name: 'Cruel', type: 'prefix',
        tiers: [{ ilvl: 1, roll: [2, 5] }, { ilvl: 12, roll: [6, 12] }, { ilvl: 25, roll: [12, 22] }, { ilvl: 45, roll: [22, 35] }],
        stat: 'flatMinDmg', allowedSlots: SLOTS.WEAPON, group: 'weapon_flat_dmg', tags: ['attack', 'damage'],
    },
    {
        id: 'damage_max', name: 'Massive', type: 'prefix',
        tiers: [{ ilvl: 1, roll: [3, 8] }, { ilvl: 12, roll: [9, 18] }, { ilvl: 25, roll: [18, 32] }, { ilvl: 45, roll: [32, 50] }],
        stat: 'flatMaxDmg', allowedSlots: SLOTS.WEAPON, group: 'weapon_flat_dmg', tags: ['attack', 'damage'],
    },
    {
        id: 'damage_pct', name: 'Ferocious', type: 'prefix',
        tiers: [{ ilvl: 5, roll: [10, 20] }, { ilvl: 18, roll: [21, 40] }, { ilvl: 35, roll: [41, 70] }, { ilvl: 55, roll: [71, 100] }],
        stat: 'pctDmg', allowedSlots: SLOTS.WEAPON, tags: ['attack', 'damage'],
    },
    {
        id: 'deadly_strike', name: 'Lethal', type: 'prefix',
        tiers: [{ ilvl: 30, roll: [5, 15] }, { ilvl: 50, roll: [16, 30] }, { ilvl: 75, roll: [31, 50] }],
        stat: 'deadlyStrike', allowedSlots: [...SLOTS.WEAPON, 'helm'], weight: 60, tags: ['attack', 'special'],
    },
    {
        id: 'crushing_blow', name: 'Shattering', type: 'prefix',
        tiers: [{ ilvl: 25, roll: [5, 10] }, { ilvl: 45, roll: [11, 20] }, { ilvl: 70, roll: [21, 35] }],
        stat: 'crushingBlow', allowedSlots: [...SLOTS.WEAPON, 'gloves'], weight: 60, tags: ['attack', 'special'],
    },
    {
        id: 'open_wounds', name: 'Serrated', type: 'prefix',
        tiers: [{ ilvl: 20, roll: [10, 20] }, { ilvl: 40, roll: [21, 40] }, { ilvl: 65, roll: [41, 60] }],
        stat: 'openWounds', allowedSlots: [...SLOTS.WEAPON, 'belt'], weight: 70, tags: ['attack', 'dot'],
    },
    {
        id: 'knockback', name: 'Forceful', type: 'prefix',
        tiers: [{ ilvl: 10, roll: [1, 1] }, { ilvl: 30, roll: [1, 1] }],
        stat: 'knockback', allowedSlots: SLOTS.WEAPON, weight: 50, tags: ['attack', 'utility'],
    },

    // ── Elemental Damage ──────────────────────────────────────
    {
        id: 'fire_dmg_pct', name: 'Flaming', type: 'prefix',
        tiers: [{ ilvl: 4, roll: [10, 20] }, { ilvl: 16, roll: [21, 40] }, { ilvl: 30, roll: [41, 65] }, { ilvl: 50, roll: [66, 90] }],
        stat: 'pctFireDmg', allowedSlots: [...SLOTS.WEAPON, ...SLOTS.JEWELRY], group: 'elem_dmg', tags: ['elemental', 'fire'],
    },
    {
        id: 'cold_dmg_pct', name: 'Glacial', type: 'prefix',
        tiers: [{ ilvl: 4, roll: [10, 20] }, { ilvl: 16, roll: [21, 40] }, { ilvl: 30, roll: [41, 65] }, { ilvl: 50, roll: [66, 90] }],
        stat: 'pctColdDmg', allowedSlots: [...SLOTS.WEAPON, ...SLOTS.JEWELRY], group: 'elem_dmg', tags: ['elemental', 'cold'],
    },
    {
        id: 'light_dmg_pct', name: 'Shocking', type: 'prefix',
        tiers: [{ ilvl: 4, roll: [10, 20] }, { ilvl: 16, roll: [21, 40] }, { ilvl: 30, roll: [41, 65] }, { ilvl: 50, roll: [66, 90] }],
        stat: 'pctLightDmg', allowedSlots: [...SLOTS.WEAPON, ...SLOTS.JEWELRY], group: 'elem_dmg', tags: ['elemental', 'lightning'],
    },
    {
        id: 'poison_dmg', name: 'Pestilent', type: 'prefix',
        tiers: [{ ilvl: 5, roll: [20, 40] }, { ilvl: 15, roll: [40, 80] }, { ilvl: 28, roll: [80, 150] }, { ilvl: 50, roll: [150, 250] }],
        stat: 'poisonDmgPerSec', allowedSlots: SLOTS.WEAPON, tags: ['elemental', 'poison', 'dot'],
    },
    {
        id: 'shadow_dmg_pct', name: 'Voidtouched', type: 'prefix',
        tiers: [{ ilvl: 20, roll: [10, 25] }, { ilvl: 35, roll: [26, 50] }, { ilvl: 55, roll: [51, 80] }],
        stat: 'pctShadowDmg', allowedSlots: [...SLOTS.WEAPON, ...SLOTS.JEWELRY], group: 'elem_dmg', weight: 70, tags: ['elemental', 'shadow'],
    },
    {
        id: 'holy_dmg_pct', name: 'Sacred', type: 'prefix',
        tiers: [{ ilvl: 20, roll: [10, 25] }, { ilvl: 35, roll: [26, 50] }, { ilvl: 55, roll: [51, 80] }],
        stat: 'pctHolyDmg', allowedSlots: [...SLOTS.WEAPON, ...SLOTS.JEWELRY], group: 'elem_dmg', weight: 70, tags: ['elemental', 'holy'],
    },
    {
        id: 'earth_dmg_pct', name: 'Tectonic', type: 'prefix',
        tiers: [{ ilvl: 15, roll: [10, 22] }, { ilvl: 30, roll: [23, 45] }, { ilvl: 50, roll: [46, 70] }],
        stat: 'pctEarthDmg', allowedSlots: [...SLOTS.WEAPON, ...SLOTS.JEWELRY], group: 'elem_dmg', weight: 70, tags: ['elemental', 'earth'],
    },

    // ── On-Hit DoT Additions ──────────────────────────────────
    {
        id: 'adds_fire_dot', name: 'Burning', type: 'prefix',
        tiers: [{ ilvl: 8, roll: [15, 30] }, { ilvl: 22, roll: [31, 65] }, { ilvl: 40, roll: [66, 120] }],
        stat: 'addFireDotDps', allowedSlots: SLOTS.WEAPON, tags: ['elemental', 'fire', 'dot'],
    },
    {
        id: 'adds_cold_dot', name: 'Chilling', type: 'prefix',
        tiers: [{ ilvl: 8, roll: [10, 20] }, { ilvl: 22, roll: [21, 45] }, { ilvl: 40, roll: [46, 90] }],
        stat: 'addColdDotDps', allowedSlots: SLOTS.WEAPON, tags: ['elemental', 'cold', 'dot'],
    },

    // ── Attack Speed ──────────────────────────────────────────
    {
        id: 'ias', name: 'Swift', type: 'prefix',
        tiers: [{ ilvl: 8, roll: [10, 15] }, { ilvl: 20, roll: [16, 25] }, { ilvl: 35, roll: [26, 40] }, { ilvl: 55, roll: [41, 60] }],
        stat: 'pctIAS', allowedSlots: SLOTS.WEAPON, tags: ['attack', 'speed'],
    },
    {
        id: 'cast_speed', name: 'Nimble', type: 'prefix',
        tiers: [{ ilvl: 8, roll: [5, 10] }, { ilvl: 20, roll: [11, 20] }, { ilvl: 35, roll: [21, 35] }],
        stat: 'pctFCR', allowedSlots: [...SLOTS.CASTER, 'ring', 'amulet', 'gloves'], tags: ['cast', 'speed'],
    },
    {
        id: 'move_speed', name: 'Blurring', type: 'prefix',
        tiers: [{ ilvl: 5, roll: [10, 15] }, { ilvl: 20, roll: [15, 25] }, { ilvl: 35, roll: [25, 40] }],
        stat: 'pctMoveSpeed', allowedSlots: ['boots', 'charm'], tags: ['speed', 'utility'],
    },
    {
        id: 'faster_hit_recovery', name: 'Responsive', type: 'prefix',
        tiers: [{ ilvl: 10, roll: [10, 20] }, { ilvl: 25, roll: [21, 40] }, { ilvl: 45, roll: [41, 60] }],
        stat: 'pctFHR', allowedSlots: [...SLOTS.ARMOR, ...SLOTS.JEWELRY], tags: ['defense', 'speed'],
    },

    // ── Life & Mana ───────────────────────────────────────────
    {
        id: 'life', name: 'Sturdy', type: 'prefix',
        tiers: [{ ilvl: 1, roll: [10, 25] }, { ilvl: 12, roll: [26, 50] }, { ilvl: 24, roll: [51, 100] }, { ilvl: 40, roll: [101, 175] }, { ilvl: 60, roll: [176, 250] }],
        stat: 'flatHP', allowedSlots: AJC, tags: ['defense', 'life'],
    },
    {
        id: 'mana', name: 'Azure', type: 'prefix',
        tiers: [{ ilvl: 1, roll: [8, 20] }, { ilvl: 12, roll: [21, 45] }, { ilvl: 24, roll: [46, 90] }, { ilvl: 40, roll: [91, 150] }, { ilvl: 60, roll: [151, 220] }],
        stat: 'flatMP', allowedSlots: [...SLOTS.ARMOR, ...SLOTS.JEWELRY, 'staff', 'orb', 'source', 'wand', 'charm'], tags: ['defense', 'mana'],
    },
    {
        id: 'life_pct', name: 'Vital', type: 'prefix',
        tiers: [{ ilvl: 20, roll: [5, 10] }, { ilvl: 40, roll: [11, 20] }, { ilvl: 60, roll: [21, 30] }],
        stat: 'pctMaxHP', allowedSlots: AJ, weight: 60, tags: ['defense', 'life'],
    },
    {
        id: 'mana_pct', name: 'Arcane', type: 'prefix',
        tiers: [{ ilvl: 20, roll: [5, 10] }, { ilvl: 40, roll: [11, 20] }, { ilvl: 60, roll: [21, 30] }],
        stat: 'pctMaxMP', allowedSlots: AJ, weight: 60, tags: ['defense', 'mana'],
    },

    // ── Regeneration ──────────────────────────────────────────
    {
        id: 'life_regen', name: 'Vampiric', type: 'prefix',
        tiers: [{ ilvl: 6, roll: [2, 4] }, { ilvl: 18, roll: [5, 8] }, { ilvl: 30, roll: [9, 14] }, { ilvl: 50, roll: [15, 22] }],
        stat: 'lifeRegenPerSec', allowedSlots: AJ, tags: ['defense', 'life', 'regen'],
    },
    {
        id: 'mana_regen', name: 'Mystic', type: 'prefix',
        tiers: [{ ilvl: 6, roll: [3, 6] }, { ilvl: 18, roll: [7, 12] }, { ilvl: 30, roll: [13, 20] }, { ilvl: 50, roll: [21, 30] }],
        stat: 'manaRegenPerSec', allowedSlots: [...SLOTS.ARMOR, ...SLOTS.JEWELRY, 'staff', 'source'], tags: ['defense', 'mana', 'regen'],
    },
    {
        id: 'life_on_kill', name: 'Devouring', type: 'prefix',
        tiers: [{ ilvl: 8, roll: [5, 12] }, { ilvl: 22, roll: [13, 25] }, { ilvl: 40, roll: [26, 45] }],
        stat: 'lifeOnKill', allowedSlots: AW, tags: ['life', 'offense'],
    },
    {
        id: 'mana_on_kill', name: 'Absorbing', type: 'prefix',
        tiers: [{ ilvl: 8, roll: [3, 8] }, { ilvl: 22, roll: [9, 18] }, { ilvl: 40, roll: [19, 30] }],
        stat: 'manaOnKill', allowedSlots: AW, tags: ['mana', 'offense'],
    },

    // ── Armor / Defense ───────────────────────────────────────
    {
        id: 'defense', name: 'Stalwart', type: 'prefix',
        tiers: [{ ilvl: 1, roll: [5, 15] }, { ilvl: 12, roll: [15, 35] }, { ilvl: 25, roll: [35, 70] }, { ilvl: 45, roll: [70, 120] }],
        stat: 'flatArmor', allowedSlots: SLOTS.ARMOR, tags: ['defense', 'armor'],
    },
    {
        id: 'defense_pct', name: 'Fortified', type: 'prefix',
        tiers: [{ ilvl: 8, roll: [10, 20] }, { ilvl: 20, roll: [21, 40] }, { ilvl: 35, roll: [41, 65] }, { ilvl: 55, roll: [66, 90] }],
        stat: 'pctArmor', allowedSlots: SLOTS.ARMOR, tags: ['defense', 'armor'],
    },
    {
        id: 'thorns', name: 'Spiked', type: 'prefix',
        tiers: [{ ilvl: 10, roll: [5, 15] }, { ilvl: 25, roll: [16, 35] }, { ilvl: 45, roll: [36, 70] }],
        stat: 'thorns', allowedSlots: ['armor', 'shield', 'gloves', 'belt'], weight: 60, tags: ['defense', 'retaliation'],
    },
    {
        id: 'damage_reduction', name: 'Stout', type: 'prefix',
        tiers: [{ ilvl: 15, roll: [1, 3] }, { ilvl: 30, roll: [3, 6] }, { ilvl: 50, roll: [6, 10] }],
        stat: 'flatDmgReduce', allowedSlots: ['armor', 'shield', 'belt'], weight: 50, tags: ['defense'],
    },
    {
        id: 'pct_dmg_reduce', name: 'Impervious', type: 'prefix',
        tiers: [{ ilvl: 35, roll: [3, 7] }, { ilvl: 55, roll: [7, 12] }, { ilvl: 75, roll: [12, 18] }],
        stat: 'pctDmgReduce', allowedSlots: ['armor', 'shield'], weight: 40, tags: ['defense'],
    },

    // ── Auras ─────────────────────────────────────────────────
    {
        id: 'aura_might', name: 'Triumphant', type: 'prefix',
        tiers: [{ ilvl: 45, roll: [1, 3] }, { ilvl: 65, roll: [4, 7] }],
        stat: 'auraMightLevel', allowedSlots: SLOTS.WEAPON, weight: 25, tags: ['aura', 'attack'],
    },
    {
        id: 'aura_holy_fire', name: 'Consecrated', type: 'prefix',
        tiers: [{ ilvl: 45, roll: [1, 3] }, { ilvl: 65, roll: [4, 7] }],
        stat: 'auraHolyFireLevel', allowedSlots: SLOTS.ARMOR, weight: 25, tags: ['aura', 'elemental', 'fire'],
    },
    {
        id: 'aura_chill', name: 'Permafrost', type: 'prefix',
        tiers: [{ ilvl: 45, roll: [1, 3] }, { ilvl: 65, roll: [4, 7] }],
        stat: 'auraChillLevel', allowedSlots: SLOTS.ARMOR, weight: 25, tags: ['aura', 'elemental', 'cold'],
    },
    {
        id: 'aura_thorns_aura', name: 'Retributive', type: 'prefix',
        tiers: [{ ilvl: 50, roll: [1, 3] }, { ilvl: 70, roll: [4, 6] }],
        stat: 'auraThornsLevel', allowedSlots: ['armor', 'shield'], weight: 20, tags: ['aura', 'defense', 'retaliation'],
    },

    // ── Fortify (new mechanic) ────────────────────────────────
    {
        id: 'fortify_pool', name: 'Resilient', type: 'prefix',
        tiers: [{ ilvl: 20, roll: [50, 100] }, { ilvl: 40, roll: [100, 200] }, { ilvl: 60, roll: [200, 350] }],
        stat: 'fortify', allowedSlots: ['armor', 'shield', 'helm'], weight: 55, tags: ['defense'],
    },

    // ── Parry ─────────────────────────────────────────────────
    {
        id: 'parry', name: 'Adroit', type: 'prefix',
        tiers: [{ ilvl: 18, roll: [3, 8] }, { ilvl: 35, roll: [9, 18] }, { ilvl: 55, roll: [18, 30] }],
        stat: 'parryChance', allowedSlots: ['shield', 'gloves', 'boots'], weight: 55, tags: ['defense'],
    },

    // ── Crit Avoidance ────────────────────────────────────────
    {
        id: 'crit_avoid', name: 'Hardened', type: 'prefix',
        tiers: [{ ilvl: 15, roll: [5, 12] }, { ilvl: 30, roll: [13, 25] }, { ilvl: 50, roll: [26, 40] }],
        stat: 'critAvoid', allowedSlots: SLOTS.ARMOR, weight: 70, tags: ['defense'],
    },

    // ── Summon Bonuses ────────────────────────────────────────
    {
        id: 'summon_life_pct', name: 'Commanding', type: 'prefix',
        tiers: [{ ilvl: 15, roll: [10, 20] }, { ilvl: 30, roll: [21, 40] }, { ilvl: 50, roll: [41, 70] }],
        stat: 'summonLifePct', allowedSlots: [...SLOTS.ARMOR, ...SLOTS.JEWELRY], weight: 65, tags: ['summon'],
    },
    {
        id: 'summon_dmg_pct', name: 'Warlord', type: 'prefix',
        tiers: [{ ilvl: 15, roll: [10, 20] }, { ilvl: 30, roll: [21, 40] }, { ilvl: 50, roll: [41, 65] }],
        stat: 'summonDmgPct', allowedSlots: [...SLOTS.ARMOR, ...SLOTS.JEWELRY], weight: 65, tags: ['summon'],
    },
    {
        id: 'summon_count', name: 'Legion', type: 'prefix',
        tiers: [{ ilvl: 25, roll: [1, 1] }, { ilvl: 50, roll: [1, 2] }],
        stat: 'summonCountBonus', allowedSlots: ['helm', 'amulet', 'armor'], weight: 35, tags: ['summon'],
    },

    // ══════════════════════════════════════════════════════════
    //  SKILL BONUSES  (D2-style)
    // ══════════════════════════════════════════════════════════

    // +N to specific skill
    {
        id: 'sk_fireball', name: 'of the Mage', type: 'suffix',
        tiers: [{ ilvl: 10, roll: [1, 1] }, { ilvl: 20, roll: [1, 2] }, { ilvl: 35, roll: [2, 3] }],
        stat: '+skill:fireball', allowedSlots: [...SLOTS.ARMOR, ...SLOTS.JEWELRY, 'staff', 'orb', 'wand'], tags: ['skill', 'fire'],
    },
    {
        id: 'sk_blizzard', name: 'of the Glacier', type: 'suffix',
        tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 28, roll: [1, 2] }, { ilvl: 45, roll: [2, 3] }],
        stat: '+skill:blizzard', allowedSlots: [...SLOTS.ARMOR, ...SLOTS.JEWELRY], tags: ['skill', 'cold'],
    },
    {
        id: 'sk_thunder_strike', name: 'of the Storm', type: 'suffix',
        tiers: [{ ilvl: 10, roll: [1, 1] }, { ilvl: 22, roll: [1, 2] }, { ilvl: 38, roll: [2, 3] }],
        stat: '+skill:thunder_strike', allowedSlots: [...SLOTS.ARMOR, ...SLOTS.JEWELRY, 'totem'], tags: ['skill', 'lightning'],
    },
    {
        id: 'sk_chain_lightning', name: 'of Thunder', type: 'suffix',
        tiers: [{ ilvl: 12, roll: [1, 1] }, { ilvl: 25, roll: [1, 2] }, { ilvl: 40, roll: [2, 3] }],
        stat: '+skill:chain_lightning', allowedSlots: [...SLOTS.ARMOR, ...SLOTS.JEWELRY, 'totem'], tags: ['skill', 'lightning'],
    },
    {
        id: 'sk_whirlwind', name: 'of the Berserker', type: 'suffix',
        tiers: [{ ilvl: 18, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }, { ilvl: 45, roll: [2, 3] }],
        stat: '+skill:whirlwind', allowedSlots: SLOTS.ARMOR, tags: ['skill', 'melee'],
    },
    {
        id: 'sk_summon_skeleton', name: 'of the Necromancer', type: 'suffix',
        tiers: [{ ilvl: 10, roll: [1, 1] }, { ilvl: 22, roll: [1, 2] }, { ilvl: 40, roll: [2, 3] }],
        stat: '+skill:summon_skeleton', allowedSlots: [...SLOTS.ARMOR, 'wand'], tags: ['skill', 'summon'],
    },
    {
        id: 'sk_bone_spear', name: 'of the Crypt', type: 'suffix',
        tiers: [{ ilvl: 12, roll: [1, 1] }, { ilvl: 25, roll: [1, 2] }, { ilvl: 42, roll: [2, 3] }],
        stat: '+skill:bone_spear', allowedSlots: [...SLOTS.ARMOR, 'wand', 'amulet'], tags: ['skill', 'bone'],
    },
    {
        id: 'sk_shadow_bolt', name: 'of Shadows', type: 'suffix',
        tiers: [{ ilvl: 8, roll: [1, 1] }, { ilvl: 20, roll: [1, 2] }, { ilvl: 35, roll: [2, 3] }],
        stat: '+skill:shadow_bolt', allowedSlots: [...SLOTS.ARMOR, ...SLOTS.JEWELRY], tags: ['skill', 'shadow'],
    },
    {
        id: 'sk_death_coil', name: 'of the Reaper', type: 'suffix',
        tiers: [{ ilvl: 14, roll: [1, 1] }, { ilvl: 28, roll: [1, 2] }, { ilvl: 45, roll: [2, 3] }],
        stat: '+skill:death_coil', allowedSlots: [...SLOTS.ARMOR, ...SLOTS.JEWELRY, 'wand'], tags: ['skill', 'shadow'],
    },
    {
        id: 'sk_holy_smite', name: 'of the Divine', type: 'suffix',
        tiers: [{ ilvl: 10, roll: [1, 1] }, { ilvl: 22, roll: [1, 2] }, { ilvl: 40, roll: [2, 3] }],
        stat: '+skill:holy_smite', allowedSlots: SLOTS.ARMOR, tags: ['skill', 'holy'],
    },
    {
        id: 'sk_consecration', name: 'of Purity', type: 'suffix',
        tiers: [{ ilvl: 12, roll: [1, 1] }, { ilvl: 26, roll: [1, 2] }, { ilvl: 44, roll: [2, 3] }],
        stat: '+skill:consecration', allowedSlots: SLOTS.ARMOR, tags: ['skill', 'holy'],
    },
    {
        id: 'sk_healing_wave', name: 'of Restoration', type: 'suffix',
        tiers: [{ ilvl: 10, roll: [1, 1] }, { ilvl: 20, roll: [1, 2] }, { ilvl: 35, roll: [2, 3] }],
        stat: '+skill:healing_wave', allowedSlots: [...SLOTS.ARMOR, ...SLOTS.JEWELRY, 'totem'], tags: ['skill', 'nature'],
    },
    {
        id: 'sk_entangle', name: 'of the Vine', type: 'suffix',
        tiers: [{ ilvl: 8, roll: [1, 1] }, { ilvl: 20, roll: [1, 2] }, { ilvl: 36, roll: [2, 3] }],
        stat: '+skill:entangle', allowedSlots: [...SLOTS.ARMOR, ...SLOTS.JEWELRY], tags: ['skill', 'nature', 'cc'],
    },
    {
        id: 'sk_tornado', name: 'of the Gale', type: 'suffix',
        tiers: [{ ilvl: 16, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }, { ilvl: 48, roll: [2, 3] }],
        stat: '+skill:tornado', allowedSlots: [...SLOTS.ARMOR, ...SLOTS.JEWELRY], tags: ['skill', 'earth'],
    },
    {
        id: 'sk_blade_dance', name: 'of the Blade', type: 'suffix',
        tiers: [{ ilvl: 14, roll: [1, 1] }, { ilvl: 28, roll: [1, 2] }, { ilvl: 46, roll: [2, 3] }],
        stat: '+skill:blade_dance', allowedSlots: [...SLOTS.ARMOR, 'ring', 'amulet'], tags: ['skill', 'melee'],
    },
    {
        id: 'sk_stellar_arrow', name: 'of the Archer', type: 'suffix',
        tiers: [{ ilvl: 12, roll: [1, 1] }, { ilvl: 26, roll: [1, 2] }, { ilvl: 44, roll: [2, 3] }],
        stat: '+skill:stellar_arrow', allowedSlots: [...SLOTS.ARMOR, 'ring', 'amulet', 'bow'], tags: ['skill', 'ranged'],
    },

    // +N to Skill Group
    {
        id: 'sk_fire_skills', name: 'of Fire Mastery', type: 'suffix',
        tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }, { ilvl: 50, roll: [2, 2] }],
        stat: '+skillGroup:fire', allowedSlots: ['helm', 'armor', 'amulet', 'ring'], weight: 70, tags: ['skill', 'fire'],
    },
    {
        id: 'sk_cold_skills', name: 'of the North', type: 'suffix',
        tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }, { ilvl: 50, roll: [2, 2] }],
        stat: '+skillGroup:cold', allowedSlots: ['helm', 'armor', 'amulet', 'ring'], weight: 70, tags: ['skill', 'cold'],
    },
    {
        id: 'sk_lightning_skills', name: 'of the Tempest', type: 'suffix',
        tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }, { ilvl: 50, roll: [2, 2] }],
        stat: '+skillGroup:lightning', allowedSlots: ['helm', 'armor', 'amulet', 'ring'], weight: 70, tags: ['skill', 'lightning'],
    },
    {
        id: 'sk_shadow_skills', name: 'of the Void', type: 'suffix',
        tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:shadow', allowedSlots: ['helm', 'armor', 'amulet'], weight: 65, tags: ['skill', 'shadow'],
    },
    {
        id: 'sk_nature_skills', name: 'of the Grove', type: 'suffix',
        tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:nature', allowedSlots: ['helm', 'armor', 'amulet'], weight: 65, tags: ['skill', 'nature'],
    },
    {
        id: 'sk_totem_skills', name: 'of the Ancestors', type: 'suffix',
        tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:totem', allowedSlots: ['helm', 'armor', 'amulet', 'totem'], weight: 65, tags: ['skill', 'totem'],
    },
    {
        id: 'sk_holy_skills', name: 'of the Light', type: 'suffix',
        tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:holy', allowedSlots: ['helm', 'armor', 'amulet'], weight: 65, tags: ['skill', 'holy'],
    },
    {
        id: 'sk_bone_skills', name: 'of the Ossuary', type: 'suffix',
        tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:bone', allowedSlots: ['helm', 'armor', 'amulet', 'wand'], weight: 65, tags: ['skill', 'bone'],
    },
    {
        id: 'sk_earth_skills', name: 'of the Mountain', type: 'suffix',
        tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:earth', allowedSlots: ['helm', 'armor', 'amulet'], weight: 65, tags: ['skill', 'earth'],
    },
    {
        id: 'sk_melee_skills', name: 'of Combat', type: 'suffix',
        tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:melee', allowedSlots: ['helm', 'armor', 'gloves', 'amulet'], weight: 65, tags: ['skill', 'melee'],
    },
    {
        id: 'sk_summon_skills', name: 'of Command', type: 'suffix',
        tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:summon', allowedSlots: ['helm', 'armor', 'amulet', 'wand'], weight: 65, tags: ['skill', 'summon'],
    },

    // +N to All [Class] Skills
    {
        id: 'sk_all_sorceress', name: 'of Sorcery', type: 'suffix',
        tiers: [{ ilvl: 25, roll: [1, 1] }, { ilvl: 45, roll: [1, 2] }],
        stat: '+classSkills:sorceress', allowedSlots: ['helm', 'armor', 'amulet', 'staff', 'orb'], weight: 45,
    },
    {
        id: 'sk_all_warrior', name: 'of Might', type: 'suffix',
        tiers: [{ ilvl: 25, roll: [1, 1] }, { ilvl: 45, roll: [1, 2] }],
        stat: '+classSkills:warrior', allowedSlots: ['helm', 'armor', 'amulet'], weight: 45,
    },
    {
        id: 'sk_all_necro', name: 'of Mortality', type: 'suffix',
        tiers: [{ ilvl: 25, roll: [1, 1] }, { ilvl: 45, roll: [1, 2] }],
        stat: '+classSkills:necromancer', allowedSlots: ['helm', 'armor', 'amulet', 'wand'], weight: 45,
    },
    {
        id: 'sk_all_shaman', name: 'of the Spirits', type: 'suffix',
        tiers: [{ ilvl: 25, roll: [1, 1] }, { ilvl: 45, roll: [1, 2] }],
        stat: '+classSkills:shaman', allowedSlots: ['helm', 'armor', 'amulet', 'totem'], weight: 45,
    },
    {
        id: 'sk_all_paladin', name: 'of Righteousness', type: 'suffix',
        tiers: [{ ilvl: 25, roll: [1, 1] }, { ilvl: 45, roll: [1, 2] }],
        stat: '+classSkills:paladin', allowedSlots: ['helm', 'armor', 'amulet'], weight: 45,
    },
    {
        id: 'sk_all_druid', name: 'of the Wild', type: 'suffix',
        tiers: [{ ilvl: 25, roll: [1, 1] }, { ilvl: 45, roll: [1, 2] }],
        stat: '+classSkills:druid', allowedSlots: ['helm', 'armor', 'amulet'], weight: 45,
    },
    {
        id: 'sk_all_rogue', name: 'of Subtlety', type: 'suffix',
        tiers: [{ ilvl: 25, roll: [1, 1] }, { ilvl: 45, roll: [1, 2] }],
        stat: '+classSkills:rogue', allowedSlots: ['helm', 'armor', 'amulet'], weight: 45,
    },

    // +N to ALL Skills (ultra-rare)
    {
        id: 'sk_all', name: 'of the Archmage', type: 'suffix',
        tiers: [{ ilvl: 40, roll: [1, 1] }, { ilvl: 60, roll: [1, 2] }],
        stat: '+allSkills', allowedSlots: ['helm', 'amulet'], weight: 5, tags: ['skill'],
    },

    // ══════════════════════════════════════════════════════════
    //  SUFFIXES
    // ══════════════════════════════════════════════════════════

    // ── Attributes ────────────────────────────────────────────
    {
        id: 'str', name: 'of Strength', type: 'suffix',
        tiers: [{ ilvl: 1, roll: [3, 8] }, { ilvl: 15, roll: [9, 20] }, { ilvl: 30, roll: [21, 35] }, { ilvl: 50, roll: [36, 50] }],
        stat: 'flatSTR', allowedSlots: AJC, tags: ['attribute'],
    },
    {
        id: 'dex', name: 'of Dexterity', type: 'suffix',
        tiers: [{ ilvl: 1, roll: [3, 8] }, { ilvl: 15, roll: [9, 20] }, { ilvl: 30, roll: [21, 35] }, { ilvl: 50, roll: [36, 50] }],
        stat: 'flatDEX', allowedSlots: AJC, tags: ['attribute'],
    },
    {
        id: 'int', name: 'of Wisdom', type: 'suffix',
        tiers: [{ ilvl: 1, roll: [3, 8] }, { ilvl: 15, roll: [9, 20] }, { ilvl: 30, roll: [21, 35] }, { ilvl: 50, roll: [36, 50] }],
        stat: 'flatINT', allowedSlots: AJC, tags: ['attribute'],
    },
    {
        id: 'vit', name: 'of the Bear', type: 'suffix',
        tiers: [{ ilvl: 1, roll: [3, 8] }, { ilvl: 15, roll: [9, 20] }, { ilvl: 30, roll: [21, 35] }, { ilvl: 50, roll: [36, 50] }],
        stat: 'flatVIT', allowedSlots: AJC, tags: ['attribute'],
    },
    {
        id: 'all_attrs', name: 'of the Titan', type: 'suffix',
        tiers: [{ ilvl: 25, roll: [3, 6] }, { ilvl: 45, roll: [7, 12] }, { ilvl: 65, roll: [13, 18] }],
        stat: 'allStats', allowedSlots: [...SLOTS.JEWELRY, 'charm'], weight: 40, tags: ['attribute'],
    },

    // ── Resistances ───────────────────────────────────────────
    {
        id: 'fire_res', name: 'of Flame Warding', type: 'suffix',
        tiers: [{ ilvl: 3, roll: [5, 15] }, { ilvl: 12, roll: [16, 30] }, { ilvl: 28, roll: [31, 45] }, { ilvl: 50, roll: [46, 60] }],
        stat: 'fireRes', allowedSlots: AJC, group: 'elem_res', tags: ['resistance', 'fire'],
    },
    {
        id: 'cold_res', name: 'of Frost Warding', type: 'suffix',
        tiers: [{ ilvl: 3, roll: [5, 15] }, { ilvl: 12, roll: [16, 30] }, { ilvl: 28, roll: [31, 45] }, { ilvl: 50, roll: [46, 60] }],
        stat: 'coldRes', allowedSlots: AJC, group: 'elem_res', tags: ['resistance', 'cold'],
    },
    {
        id: 'light_res', name: 'of Storm Warding', type: 'suffix',
        tiers: [{ ilvl: 3, roll: [5, 15] }, { ilvl: 12, roll: [16, 30] }, { ilvl: 28, roll: [31, 45] }, { ilvl: 50, roll: [46, 60] }],
        stat: 'lightRes', allowedSlots: AJC, group: 'elem_res', tags: ['resistance', 'lightning'],
    },
    {
        id: 'pois_res', name: 'of the Viper', type: 'suffix',
        tiers: [{ ilvl: 3, roll: [5, 15] }, { ilvl: 12, roll: [16, 30] }, { ilvl: 28, roll: [31, 45] }, { ilvl: 50, roll: [46, 60] }],
        stat: 'poisRes', allowedSlots: AJC, group: 'elem_res', tags: ['resistance', 'poison'],
    },
    {
        id: 'shadow_res', name: 'of the Shadow Veil', type: 'suffix',
        tiers: [{ ilvl: 10, roll: [5, 15] }, { ilvl: 25, roll: [16, 30] }, { ilvl: 45, roll: [31, 50] }],
        stat: 'shadowRes', allowedSlots: AJC, group: 'elem_res', weight: 70, tags: ['resistance', 'shadow'],
    },
    {
        id: 'holy_res', name: 'of the Sacristy', type: 'suffix',
        tiers: [{ ilvl: 10, roll: [5, 15] }, { ilvl: 25, roll: [16, 30] }, { ilvl: 45, roll: [31, 50] }],
        stat: 'holyRes', allowedSlots: AJC, group: 'elem_res', weight: 70, tags: ['resistance', 'holy'],
    },
    {
        id: 'all_res', name: 'of Warding', type: 'suffix',
        tiers: [{ ilvl: 15, roll: [5, 10] }, { ilvl: 35, roll: [11, 20] }, { ilvl: 50, roll: [21, 30] }],
        stat: 'allRes', allowedSlots: AJC, weight: 25, tags: ['resistance'],
    },
    {
        id: 'max_res', name: 'of the Bastion', type: 'suffix',
        tiers: [{ ilvl: 50, roll: [1, 3] }, { ilvl: 70, roll: [3, 5] }],
        stat: 'maxResBonus', allowedSlots: ['shield', 'amulet'], weight: 15, tags: ['resistance'],
    },

    // ── Crit & Life Steal ─────────────────────────────────────
    {
        id: 'crit_chance', name: 'of Precision', type: 'suffix',
        tiers: [{ ilvl: 8, roll: [2, 5] }, { ilvl: 20, roll: [5, 10] }, { ilvl: 35, roll: [10, 18] }, { ilvl: 55, roll: [18, 25] }],
        stat: 'critChance', allowedSlots: WJ, tags: ['attack', 'crit'],
    },
    {
        id: 'crit_multi', name: 'of Slaughter', type: 'suffix',
        tiers: [{ ilvl: 12, roll: [20, 40] }, { ilvl: 28, roll: [40, 70] }, { ilvl: 45, roll: [70, 120] }, { ilvl: 65, roll: [120, 180] }],
        stat: 'critMulti', allowedSlots: SLOTS.WEAPON, excludes: ['crit_chance'], tags: ['attack', 'crit'],
    },
    {
        id: 'life_steal', name: 'of the Vampire', type: 'suffix',
        tiers: [{ ilvl: 10, roll: [3, 5] }, { ilvl: 22, roll: [5, 8] }, { ilvl: 38, roll: [8, 12] }],
        stat: 'lifeStealPct', allowedSlots: SLOTS.WEAPON, tags: ['attack', 'life'],
    },
    {
        id: 'mana_steal', name: 'of the Leech', type: 'suffix',
        tiers: [{ ilvl: 10, roll: [2, 4] }, { ilvl: 22, roll: [4, 7] }, { ilvl: 38, roll: [7, 11] }],
        stat: 'manaStealPct', allowedSlots: SLOTS.WEAPON, tags: ['attack', 'mana'],
    },

    // ── Utility ───────────────────────────────────────────────
    {
        id: 'magic_find', name: 'of Fortune', type: 'suffix',
        tiers: [{ ilvl: 4, roll: [5, 15] }, { ilvl: 20, roll: [16, 25] }, { ilvl: 40, roll: [26, 40] }, { ilvl: 60, roll: [41, 60] }],
        stat: 'magicFind', allowedSlots: ['boots', 'gloves', 'ring', 'amulet', 'helm', 'charm'], tags: ['utility', 'find'],
    },
    {
        id: 'gold_find', name: 'of Greed', type: 'suffix',
        tiers: [{ ilvl: 4, roll: [20, 40] }, { ilvl: 20, roll: [41, 75] }, { ilvl: 40, roll: [76, 150] }, { ilvl: 60, roll: [151, 250] }],
        stat: 'goldFind', allowedSlots: ['boots', 'gloves', 'ring', 'amulet', 'belt', 'charm'], tags: ['utility', 'find'],
    },
    {
        id: 'block', name: 'of the Bulwark', type: 'suffix',
        tiers: [{ ilvl: 3, roll: [5, 10] }, { ilvl: 15, roll: [10, 20] }, { ilvl: 30, roll: [20, 35] }, { ilvl: 50, roll: [35, 50] }],
        stat: 'blockChance', allowedSlots: ['shield'], tags: ['defense', 'block'],
    },
    {
        id: 'socket_1', name: 'of the Socket', type: 'suffix',
        tiers: [{ ilvl: 10, roll: [1, 1] }],
        stat: 'sockets', allowedSlots: AW, weight: 30, tags: ['utility'],
    },
    {
        id: 'reduced_req', name: 'of Ease', type: 'suffix',
        tiers: [{ ilvl: 5, roll: [20, 30] }, { ilvl: 20, roll: [30, 50] }],
        stat: 'pctReqReduce', allowedSlots: AWJ, weight: 50, tags: ['utility'],
    },
    {
        id: 'light_radius', name: 'of Luminance', type: 'suffix',
        tiers: [{ ilvl: 1, roll: [1, 2] }, { ilvl: 20, roll: [2, 4] }],
        stat: 'lightRadius', allowedSlots: AJ, weight: 80, tags: ['utility'],
    },
    {
        id: 'experience_gain', name: 'of Mastery', type: 'suffix',
        tiers: [{ ilvl: 20, roll: [5, 10] }, { ilvl: 40, roll: [10, 18] }],
        stat: 'pctExpGain', allowedSlots: [...SLOTS.JEWELRY, 'charm'], weight: 45, tags: ['utility'],
    },
    {
        id: 'cooldown_reduce', name: 'of Readiness', type: 'suffix',
        tiers: [{ ilvl: 25, roll: [5, 10] }, { ilvl: 45, roll: [10, 18] }, { ilvl: 65, roll: [18, 28] }],
        stat: 'pctCDR', allowedSlots: [...SLOTS.JEWELRY, 'helm', 'gloves'], weight: 55, tags: ['utility', 'cast'],
    },
    {
        id: 'skill_charges', name: 'of Charges', type: 'suffix',
        tiers: [{ ilvl: 20, roll: [1, 3] }, { ilvl: 40, roll: [3, 6] }],
        stat: 'skillChargesBonus', allowedSlots: [...SLOTS.JEWELRY, 'helm'], weight: 50, tags: ['utility', 'skill'],
    },

    // ── CC & Crowd Control ────────────────────────────────────
    {
        id: 'chill_on_hit', name: 'of Frost', type: 'suffix',
        tiers: [{ ilvl: 10, roll: [15, 30] }, { ilvl: 25, roll: [30, 50] }],
        stat: 'chillOnHitChance', allowedSlots: SLOTS.WEAPON, weight: 65, tags: ['cc', 'cold'],
    },
    {
        id: 'slow_on_hit', name: 'of Slowing', type: 'suffix',
        tiers: [{ ilvl: 8, roll: [10, 20] }, { ilvl: 22, roll: [20, 35] }],
        stat: 'slowOnHitPct', allowedSlots: [...SLOTS.WEAPON, 'boots'], weight: 70, tags: ['cc'],
    },
    {
        id: 'stun_on_hit', name: 'of Stunning', type: 'suffix',
        tiers: [{ ilvl: 20, roll: [5, 12] }, { ilvl: 40, roll: [12, 22] }],
        stat: 'stunOnHitChance', allowedSlots: SLOTS.MELEE, weight: 50, tags: ['cc'],
    },
    {
        id: 'fear_on_hit', name: 'of Dread', type: 'suffix',
        tiers: [{ ilvl: 25, roll: [8, 15] }, { ilvl: 45, roll: [15, 28] }],
        stat: 'fearOnHitChance', allowedSlots: SLOTS.WEAPON, weight: 40, tags: ['cc'],
    },
    {
        id: 'blind_on_hit', name: 'of Blindness', type: 'suffix',
        tiers: [{ ilvl: 15, roll: [10, 20] }, { ilvl: 35, roll: [20, 35] }],
        stat: 'blindOnHitChance', allowedSlots: SLOTS.WEAPON, weight: 55, tags: ['cc'],
    },

    // ── Overcharge (new) ──────────────────────────────────────
    {
        id: 'overcharge', name: 'of Overcharge', type: 'suffix',
        tiers: [{ ilvl: 30, roll: [10, 20] }, { ilvl: 50, roll: [20, 35] }],
        stat: 'overchargePct', allowedSlots: [...SLOTS.CASTER, 'amulet'], weight: 45, tags: ['mana', 'cast'],
    },

    // ══════════════════════════════════════════════════════════
    //  CORRUPTED AFFIXES  (only appear on corrupted items)
    //  Mix of powerful bonuses with built-in downsides
    // ══════════════════════════════════════════════════════════
    {
        id: 'cor_skill_chaos', name: 'Chaotic', type: 'prefix', isCorrupted: true,
        tiers: [{ ilvl: 30, roll: [1, 3] }],
        stat: '+allSkills', allowedSlots: SLOTS.ANY, weight: 40, tags: ['skill', 'corrupted'],
    },
    {
        id: 'cor_dmg_curse', name: 'Accursed', type: 'prefix', isCorrupted: true, isCursed: true,
        tiers: [{ ilvl: 1, roll: [10, 30] }],
        stat: 'dmgTakenMult', allowedSlots: SLOTS.ANY, weight: 60, tags: ['corrupted', 'curse'],
    },
    {
        id: 'cor_giant_power', name: 'Giant', type: 'prefix', isCorrupted: true,
        tiers: [{ ilvl: 40, roll: [50, 100] }],
        stat: 'pctDmg', allowedSlots: SLOTS.WEAPON, weight: 30, tags: ['damage', 'corrupted'],
    },
    {
        id: 'cor_soulbound', name: 'Soulbound', type: 'suffix', isCorrupted: true,
        tiers: [{ ilvl: 50, roll: [1, 2] }],
        stat: '+allSkills', allowedSlots: ['helm', 'amulet'], weight: 15, tags: ['skill', 'corrupted'],
    },
    {
        id: 'cor_fragile', name: 'of Fragility', type: 'suffix', isCorrupted: true, isCursed: true,
        tiers: [{ ilvl: 1, roll: [50, 80] }],
        stat: 'pctDurabilityLoss', allowedSlots: SLOTS.ANY, weight: 80, tags: ['corrupted', 'curse'],
    },
    {
        id: 'cor_bleed_mastery', name: 'Hemorrhaging', type: 'prefix', isCorrupted: true,
        tiers: [{ ilvl: 35, roll: [30, 60] }],
        stat: 'openWounds', allowedSlots: SLOTS.WEAPON, weight: 35, tags: ['corrupted', 'dot'],
    },
    {
        id: 'cor_undying', name: 'Undying', type: 'suffix', isCorrupted: true,
        tiers: [{ ilvl: 60, roll: [1, 1] }],
        stat: 'cannotDie', allowedSlots: ['amulet', 'ring'], weight: 5, tags: ['corrupted'],
    },

];

// ─────────────────────────────────────────────────────────────
//  BUILD LOOKUP MAPS  (computed once at module load)
// ─────────────────────────────────────────────────────────────

/** Map<id, AffixDef> */
export const AFFIX_MAP = new Map(AFFIXES.map(a => [a.id, a]));

/** Deduplicated tag list for UI filtering */
export const ALL_TAGS = [...new Set(AFFIXES.flatMap(a => a.tags ?? []))].sort();

// ─────────────────────────────────────────────────────────────
//  PUBLIC API
// ─────────────────────────────────────────────────────────────

/**
 * Return a weighted candidate array of affixes valid for `slot` at `ilvl`.
 *
 * @param {string}  slot        - item slot ('helm', 'sword', etc.)
 * @param {number}  ilvl        - item level
 * @param {'prefix'|'suffix'} type
 * @param {object}  [opts]
 * @param {boolean} [opts.corrupted=false]  - include corrupted affixes
 * @param {string[]}[opts.tags]             - filter to these tags only
 * @param {string[]}[opts.exclude]          - affix ids to exclude
 * @returns {AffixDef[]}  expanded by weight (for weighted random)
 */
export function getAffixPool(slot, ilvl, type, opts = {}) {
    const { corrupted = false, tags = null, exclude = [] } = opts;

    const candidates = AFFIXES.filter(a => {
        if (a.type !== type) return false;
        if (a.isCorrupted && !corrupted) return false;
        if (!a.isCorrupted && corrupted) return false;
        if (!a.tiers.some(t => t.ilvl <= ilvl)) return false;
        if (!a.allowedSlots.includes(slot)) return false;
        if (exclude.includes(a.id)) return false;
        if (tags && !tags.some(t => a.tags?.includes(t))) return false;
        return true;
    });

    // Expand by weight so weighted random is a simple array pick
    const pool = [];
    for (const a of candidates) {
        const w = a.weight ?? 100;
        for (let i = 0; i < w; i++) pool.push(a);
    }
    return pool;
}

/**
 * Roll a single affix at the highest tier available for `ilvl`.
 *
 * @param {AffixDef} affix
 * @param {number}   ilvl
 * @returns {RolledMod}
 */
export function rollAffix(affix, ilvl) {
    const eligible = affix.tiers.filter(t => t.ilvl <= ilvl);
    if (!eligible.length) throw new Error(`[Affixes] No eligible tier for ${affix.id} at ilvl ${ilvl}`);
    const tier = eligible[eligible.length - 1];

    const value = _randRange(tier.roll[0], tier.roll[1]);
    const value2 = tier.roll2 ? _randRange(tier.roll2[0], tier.roll2[1]) : undefined;

    return {
        id: affix.id,
        name: affix.name,
        stat: affix.stat,
        stat2: affix.stat2,
        value,
        value2,
        type: affix.type,
        isCorrupted: affix.isCorrupted ?? false,
        isCursed: affix.isCursed ?? false,
        tags: affix.tags ?? [],
    };
}

/**
 * Roll a complete set of affixes for an item.
 *
 * @param {string} slot
 * @param {number} ilvl
 * @param {object} [opts]
 * @param {number} [opts.maxPrefixes=1]
 * @param {number} [opts.maxSuffixes=1]
 * @param {boolean}[opts.corrupted=false]
 * @param {string[]}[opts.forcedAffixIds]  - always include these (by id)
 * @returns {RolledMod[]}
 */
export function rollAffixes(slot, ilvl, opts = {}) {
    const { maxPrefixes = 1, maxSuffixes = 1, corrupted = false, forcedAffixIds = [] } = opts;

    const result = [];
    const usedIds = new Set();
    const usedGroups = new Set();

    // 1. Forced affixes (e.g. crafted bases)
    for (const fid of forcedAffixIds) {
        const def = AFFIX_MAP.get(fid);
        if (def) {
            result.push(rollAffix(def, ilvl));
            usedIds.add(fid);
            if (def.group) usedGroups.add(def.group);
        }
    }

    // 2. Random prefixes
    _fillSlots(result, usedIds, usedGroups, slot, ilvl, 'prefix', maxPrefixes, corrupted);

    // 3. Random suffixes
    _fillSlots(result, usedIds, usedGroups, slot, ilvl, 'suffix', maxSuffixes, corrupted);

    return result;
}

/**
 * Validate an item's affix list for slot/exclusion conflicts.
 * Returns an array of error strings (empty = valid).
 *
 * @param {string}     slot
 * @param {RolledMod[]} mods
 * @returns {string[]}
 */
export function validateItem(slot, mods) {
    const errors = [];
    const seenIds = new Set();
    const seenGroups = new Map(); // group → first affixId

    for (const mod of mods) {
        const def = AFFIX_MAP.get(mod.id);
        if (!def) { errors.push(`Unknown affix id: ${mod.id}`); continue; }

        if (!def.allowedSlots.includes(slot))
            errors.push(`Affix '${mod.id}' is not allowed on slot '${slot}'`);

        if (seenIds.has(mod.id))
            errors.push(`Duplicate affix: ${mod.id}`);
        seenIds.add(mod.id);

        if (def.group) {
            if (seenGroups.has(def.group))
                errors.push(`Affix group conflict: '${mod.id}' and '${seenGroups.get(def.group)}' share group '${def.group}'`);
            else
                seenGroups.set(def.group, mod.id);
        }

        for (const excl of (def.excludes ?? [])) {
            if (seenIds.has(excl))
                errors.push(`Exclusion conflict: '${mod.id}' excludes '${excl}'`);
        }
    }

    const prefixes = mods.filter(m => AFFIX_MAP.get(m.id)?.type === 'prefix').length;
    const suffixes = mods.filter(m => AFFIX_MAP.get(m.id)?.type === 'suffix').length;
    if (prefixes > 3) errors.push(`Too many prefixes: ${prefixes} (max 3)`);
    if (suffixes > 3) errors.push(`Too many suffixes: ${suffixes} (max 3)`);

    return errors;
}

/**
 * Get all affixes that match given tags for use in tooltips / filter UI.
 * @param {string[]} tags
 * @returns {AffixDef[]}
 */
export function getAffixesByTag(...tags) {
    return AFFIXES.filter(a => tags.every(t => a.tags?.includes(t)));
}

// ─────────────────────────────────────────────────────────────
//  PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────

function _randRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function _pickRandom(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
}

function _fillSlots(result, usedIds, usedGroups, slot, ilvl, type, max, corrupted) {
    const countKey = type === 'prefix' ? 'prefix' : 'suffix';
    const current = result.filter(m => AFFIX_MAP.get(m.id)?.type === type).length;
    const needed = max - current;

    for (let i = 0; i < needed; i++) {
        const exclude = [...usedIds];
        // Also exclude by group
        const pool = getAffixPool(slot, ilvl, type, { corrupted, exclude })
            .filter(a => {
                if (a.group && usedGroups.has(a.group)) return false;
                for (const excl of (a.excludes ?? [])) {
                    if (usedIds.has(excl)) return false;
                }
                return true;
            });

        if (!pool.length) break;

        const chosen = _pickRandom(pool);
        result.push(rollAffix(chosen, ilvl));
        usedIds.add(chosen.id);
        if (chosen.group) usedGroups.add(chosen.group);
    }
}

/**
 * @typedef {object} AffixDef
 * @typedef {object} RolledMod
 */