/**
 * AFFIXES — The full modifier pool for item generation
 *
 * D2-style features implemented:
 * - +N to [specific_skill]   (e.g. "+2 to Fireball")
 * - +N to [skill_group]      (e.g. "+1 to Fire Skills")
 * - +N to All Skills (class) (e.g. "+2 to Sorceress Skills")
 * - +N to All Skills         (global, very rare)
 * - standard stat mods, resistance, damage, etc.
 *
 * Affix structure: { id, name, type:'prefix'|'suffix',
 *   tiers:[ {ilvl, roll:[min,max], stat, value?} ],
 *   allowedSlots, excludes }
 *
 * stat can be a string key in player.stats or one of the special keys:
 *   '+skill:[skillId]'     → +N to that specific skill
 *   '+skillGroup:[group]'  → +N to all skills in group
 *   '+classSkills:[class]' → +N to all skills of that class
 *   '+allSkills'           → +N to every skill
 *   '+socket'              → adds a socket
 */

const ANY = ['helm', 'armor', 'gloves', 'boots', 'shield', 'source', 'mainhand', 'ring', 'amulet', 'belt'];
const ARMOR_SLOTS = ['helm', 'armor', 'gloves', 'boots', 'shield', 'belt'];
const WEAPON_SLOTS = ['mainhand', 'weapon', 'wand', 'staff', 'orb', 'totem', 'sword', 'axe', 'mace', 'dagger', 'bow'];
const JEWELRY = ['ring', 'amulet'];

export const AFFIXES = [
    // ==================== PREFIXES ====================

    // --- Damage ---
    {
        id: 'damage_min', name: 'Cruel', type: 'prefix', tiers: [{ ilvl: 1, roll: [2, 5] }, { ilvl: 12, roll: [6, 12] }, { ilvl: 25, roll: [12, 22] }],
        stat: 'flatMinDmg', allowedSlots: WEAPON_SLOTS
    },
    {
        id: 'damage_pct', name: 'Ferocious', type: 'prefix', tiers: [{ ilvl: 5, roll: [10, 20] }, { ilvl: 18, roll: [21, 40] }, { ilvl: 35, roll: [41, 70] }],
        stat: 'pctDmg', allowedSlots: WEAPON_SLOTS
    },
    {
        id: 'fire_dmg_pct', name: 'Flaming', type: 'prefix', tiers: [{ ilvl: 4, roll: [10, 20] }, { ilvl: 16, roll: [21, 40] }, { ilvl: 30, roll: [41, 65] }],
        stat: 'pctFireDmg', allowedSlots: [...WEAPON_SLOTS, 'ring', 'amulet']
    },
    {
        id: 'cold_dmg_pct', name: 'Freezing', type: 'prefix', tiers: [{ ilvl: 4, roll: [10, 20] }, { ilvl: 16, roll: [21, 40] }, { ilvl: 30, roll: [41, 65] }],
        stat: 'pctColdDmg', allowedSlots: [...WEAPON_SLOTS, 'ring', 'amulet']
    },
    {
        id: 'light_dmg_pct', name: 'Sparking', type: 'prefix', tiers: [{ ilvl: 4, roll: [10, 20] }, { ilvl: 16, roll: [21, 40] }, { ilvl: 30, roll: [41, 65] }],
        stat: 'pctLightDmg', allowedSlots: [...WEAPON_SLOTS, 'ring', 'amulet']
    },
    {
        id: 'poison_dmg', name: 'Pestilent', type: 'prefix', tiers: [{ ilvl: 5, roll: [20, 40] }, { ilvl: 15, roll: [40, 80] }, { ilvl: 28, roll: [80, 150] }],
        stat: 'poisonDmgPerSec', allowedSlots: [...WEAPON_SLOTS]
    },

    // --- Attack Speed ---
    {
        id: 'ias', name: 'Swift', type: 'prefix', tiers: [{ ilvl: 8, roll: [10, 15] }, { ilvl: 20, roll: [16, 25] }, { ilvl: 35, roll: [26, 40] }],
        stat: 'pctIAS', allowedSlots: WEAPON_SLOTS
    },

    // --- Life & Mana ---
    {
        id: 'life', name: 'Sturdy', type: 'prefix', tiers: [{ ilvl: 1, roll: [10, 25] }, { ilvl: 12, roll: [26, 50] }, { ilvl: 24, roll: [51, 100] }, { ilvl: 40, roll: [101, 175] }],
        stat: 'flatHP', allowedSlots: [...ARMOR_SLOTS, 'ring', 'amulet', 'charm']
    },
    {
        id: 'mana', name: 'Azure', type: 'prefix', tiers: [{ ilvl: 1, roll: [8, 20] }, { ilvl: 12, roll: [21, 45] }, { ilvl: 24, roll: [46, 90] }, { ilvl: 40, roll: [91, 150] }],
        stat: 'flatMP', allowedSlots: [...ARMOR_SLOTS, 'ring', 'amulet', 'staff', 'orb', 'source', 'wand', 'charm']
    },

    // --- Armor ---
    {
        id: 'defense', name: 'Stalwart', type: 'prefix', tiers: [{ ilvl: 1, roll: [5, 15] }, { ilvl: 12, roll: [15, 30] }, { ilvl: 25, roll: [30, 60] }, { ilvl: 40, roll: [60, 100] }],
        stat: 'flatArmor', allowedSlots: ARMOR_SLOTS
    },
    {
        id: 'defense_pct', name: 'Fortified', type: 'prefix', tiers: [{ ilvl: 8, roll: [10, 20] }, { ilvl: 20, roll: [21, 40] }, { ilvl: 35, roll: [41, 65] }],
        stat: 'pctArmor', allowedSlots: ARMOR_SLOTS
    },

    // --- Regeneration ---
    {
        id: 'life_regen', name: 'Vampiric', type: 'prefix', tiers: [{ ilvl: 6, roll: [2, 4] }, { ilvl: 18, roll: [5, 8] }, { ilvl: 30, roll: [9, 12] }],
        stat: 'lifeRegenPerSec', allowedSlots: [...ARMOR_SLOTS, 'ring', 'amulet']
    },
    {
        id: 'mana_regen', name: 'Mystic', type: 'prefix', tiers: [{ ilvl: 6, roll: [3, 6] }, { ilvl: 18, roll: [7, 12] }, { ilvl: 30, roll: [12, 20] }],
        stat: 'manaRegenPerSec', allowedSlots: [...ARMOR_SLOTS, 'ring', 'amulet', 'staff', 'source']
    },

    // ==================== SKILL BONUSES (D2-style) ====================
    // +N to specific skill
    {
        id: 'sk_fireball', name: 'of the Mage', type: 'suffix', tiers: [{ ilvl: 10, roll: [1, 1] }, { ilvl: 20, roll: [1, 2] }, { ilvl: 35, roll: [2, 3] }],
        stat: '+skill:fireball', allowedSlots: [...ARMOR_SLOTS, 'ring', 'amulet', 'staff', 'orb', 'wand']
    },
    {
        id: 'sk_blizzard', name: 'of the Glacier', type: 'suffix', tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 28, roll: [1, 2] }, { ilvl: 45, roll: [2, 3] }],
        stat: '+skill:blizzard', allowedSlots: [...ARMOR_SLOTS, 'ring', 'amulet']
    },
    {
        id: 'sk_thunder_strike', name: 'of the Storm', type: 'suffix', tiers: [{ ilvl: 10, roll: [1, 1] }, { ilvl: 22, roll: [1, 2] }, { ilvl: 38, roll: [2, 3] }],
        stat: '+skill:thunder_strike', allowedSlots: [...ARMOR_SLOTS, 'ring', 'amulet', 'totem']
    },
    {
        id: 'sk_chain_lightning', name: 'of Thunder', type: 'suffix', tiers: [{ ilvl: 12, roll: [1, 1] }, { ilvl: 25, roll: [1, 2] }, { ilvl: 40, roll: [2, 3] }],
        stat: '+skill:chain_lightning', allowedSlots: [...ARMOR_SLOTS, 'ring', 'amulet', 'totem']
    },
    {
        id: 'sk_whirlwind', name: 'of the Berserker', type: 'suffix', tiers: [{ ilvl: 18, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }, { ilvl: 45, roll: [2, 3] }],
        stat: '+skill:whirlwind', allowedSlots: ARMOR_SLOTS
    },
    {
        id: 'sk_summon_skeleton', name: 'of the Necromancer', type: 'suffix', tiers: [{ ilvl: 10, roll: [1, 1] }, { ilvl: 22, roll: [1, 2] }, { ilvl: 40, roll: [2, 3] }],
        stat: '+skill:summon_skeleton', allowedSlots: [...ARMOR_SLOTS, 'wand']
    },
    {
        id: 'sk_shadow_bolt', name: 'of Shadows', type: 'suffix', tiers: [{ ilvl: 8, roll: [1, 1] }, { ilvl: 20, roll: [1, 2] }, { ilvl: 35, roll: [2, 3] }],
        stat: '+skill:shadow_bolt', allowedSlots: [...ARMOR_SLOTS, 'ring', 'amulet']
    },
    {
        id: 'sk_holy_smite', name: 'of the Divine', type: 'suffix', tiers: [{ ilvl: 10, roll: [1, 1] }, { ilvl: 22, roll: [1, 2] }, { ilvl: 40, roll: [2, 3] }],
        stat: '+skill:holy_smite', allowedSlots: ARMOR_SLOTS
    },
    {
        id: 'sk_healing_wave', name: 'of Restoration', type: 'suffix', tiers: [{ ilvl: 10, roll: [1, 1] }, { ilvl: 20, roll: [1, 2] }, { ilvl: 35, roll: [2, 3] }],
        stat: '+skill:healing_wave', allowedSlots: [...ARMOR_SLOTS, 'ring', 'amulet', 'totem']
    },

    // +N to Skill Group
    {
        id: 'sk_fire_skills', name: 'of Fire Mastery', type: 'suffix', tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:fire', allowedSlots: ['helm', 'chest', 'amulet', 'ring']
    },
    {
        id: 'sk_cold_skills', name: 'of the North', type: 'suffix', tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:cold', allowedSlots: ['helm', 'chest', 'amulet', 'ring']
    },
    {
        id: 'sk_lightning_skills', name: 'of the Tempest', type: 'suffix', tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:lightning', allowedSlots: ['helm', 'chest', 'amulet', 'ring']
    },
    {
        id: 'sk_shadow_skills', name: 'of the Void', type: 'suffix', tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:shadow', allowedSlots: ['helm', 'chest', 'amulet']
    },
    {
        id: 'sk_nature_skills', name: 'of the Grove', type: 'suffix', tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:nature', allowedSlots: ['helm', 'chest', 'amulet']
    },
    {
        id: 'sk_totem_skills', name: 'of the Ancestors', type: 'suffix', tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:totem', allowedSlots: ['helm', 'chest', 'amulet', 'totem']
    },
    {
        id: 'sk_holy_skills', name: 'of the Light', type: 'suffix', tiers: [{ ilvl: 15, roll: [1, 1] }, { ilvl: 30, roll: [1, 2] }],
        stat: '+skillGroup:holy', allowedSlots: ['helm', 'chest', 'amulet']
    },

    // +N to All [Class] Skills
    {
        id: 'sk_all_sorceress', name: 'of Sorcery', type: 'suffix', tiers: [{ ilvl: 25, roll: [1, 1] }, { ilvl: 45, roll: [1, 2] }],
        stat: '+classSkills:sorceress', allowedSlots: ['helm', 'chest', 'amulet', 'staff', 'orb']
    },
    {
        id: 'sk_all_warrior', name: 'of Might', type: 'suffix', tiers: [{ ilvl: 25, roll: [1, 1] }, { ilvl: 45, roll: [1, 2] }],
        stat: '+classSkills:warrior', allowedSlots: ['helm', 'chest', 'amulet']
    },
    {
        id: 'sk_all_necro', name: 'of Mortality', type: 'suffix', tiers: [{ ilvl: 25, roll: [1, 1] }, { ilvl: 45, roll: [1, 2] }],
        stat: '+classSkills:necromancer', allowedSlots: ['helm', 'chest', 'amulet', 'wand']
    },
    {
        id: 'sk_all_shaman', name: 'of the Spirits', type: 'suffix', tiers: [{ ilvl: 25, roll: [1, 1] }, { ilvl: 45, roll: [1, 2] }],
        stat: '+classSkills:shaman', allowedSlots: ['helm', 'chest', 'amulet', 'totem']
    },
    {
        id: 'sk_all_paladin', name: 'of Righteousness', type: 'suffix', tiers: [{ ilvl: 25, roll: [1, 1] }, { ilvl: 45, roll: [1, 2] }],
        stat: '+classSkills:paladin', allowedSlots: ['helm', 'chest', 'amulet']
    },
    {
        id: 'sk_all_druid', name: 'of the Wild', type: 'suffix', tiers: [{ ilvl: 25, roll: [1, 1] }, { ilvl: 45, roll: [1, 2] }],
        stat: '+classSkills:druid', allowedSlots: ['helm', 'chest', 'amulet']
    },

    // +N to ALL Skills (ultra rare)
    {
        id: 'sk_all', name: 'of the Archmage', type: 'suffix', tiers: [{ ilvl: 40, roll: [1, 1] }, { ilvl: 60, roll: [1, 2] }],
        stat: '+allSkills', allowedSlots: ['helm', 'amulet'], weight: 5
    },

    // ==================== SUFFIXES ====================

    // --- Attributes ---
    {
        id: 'str', name: 'of Strength', type: 'suffix', tiers: [{ ilvl: 1, roll: [3, 8] }, { ilvl: 15, roll: [9, 20] }, { ilvl: 30, roll: [21, 35] }],
        stat: 'flatSTR', allowedSlots: [...ARMOR_SLOTS, ...JEWELRY, 'charm']
    },
    {
        id: 'dex', name: 'of Dexterity', type: 'suffix', tiers: [{ ilvl: 1, roll: [3, 8] }, { ilvl: 15, roll: [9, 20] }, { ilvl: 30, roll: [21, 35] }],
        stat: 'flatDEX', allowedSlots: [...ARMOR_SLOTS, ...JEWELRY, 'charm']
    },
    {
        id: 'int', name: 'of Wisdom', type: 'suffix', tiers: [{ ilvl: 1, roll: [3, 8] }, { ilvl: 15, roll: [9, 20] }, { ilvl: 30, roll: [21, 35] }],
        stat: 'flatINT', allowedSlots: [...ARMOR_SLOTS, ...JEWELRY, 'charm']
    },
    {
        id: 'vit', name: 'of the Bear', type: 'suffix', tiers: [{ ilvl: 1, roll: [3, 8] }, { ilvl: 15, roll: [9, 20] }, { ilvl: 30, roll: [21, 35] }],
        stat: 'flatVIT', allowedSlots: [...ARMOR_SLOTS, ...JEWELRY, 'charm']
    },

    // --- Resistances ---
    {
        id: 'fire_res', name: 'of Flame Warding', type: 'suffix', tiers: [{ ilvl: 3, roll: [5, 15] }, { ilvl: 12, roll: [16, 30] }, { ilvl: 28, roll: [31, 45] }],
        stat: 'fireRes', allowedSlots: [...ARMOR_SLOTS, ...JEWELRY, 'charm']
    },
    {
        id: 'cold_res', name: 'of the Glacier', type: 'suffix', tiers: [{ ilvl: 3, roll: [5, 15] }, { ilvl: 12, roll: [16, 30] }, { ilvl: 28, roll: [31, 45] }],
        stat: 'coldRes', allowedSlots: [...ARMOR_SLOTS, ...JEWELRY, 'charm']
    },
    {
        id: 'light_res', name: 'of the Storm Ward', type: 'suffix', tiers: [{ ilvl: 3, roll: [5, 15] }, { ilvl: 12, roll: [16, 30] }, { ilvl: 28, roll: [31, 45] }],
        stat: 'lightRes', allowedSlots: [...ARMOR_SLOTS, ...JEWELRY, 'charm']
    },
    {
        id: 'pois_res', name: 'of the Viper', type: 'suffix', tiers: [{ ilvl: 3, roll: [5, 15] }, { ilvl: 12, roll: [16, 30] }, { ilvl: 28, roll: [31, 45] }],
        stat: 'poisRes', allowedSlots: [...ARMOR_SLOTS, ...JEWELRY, 'charm']
    },
    {
        id: 'all_res', name: 'of Warding', type: 'suffix', tiers: [{ ilvl: 15, roll: [5, 10] }, { ilvl: 35, roll: [11, 20] }, { ilvl: 50, roll: [21, 30] }],
        stat: 'allRes', allowedSlots: [...ARMOR_SLOTS, ...JEWELRY, 'charm'], weight: 25
    },

    // --- Crit & Life Steal ---
    {
        id: 'crit_chance', name: 'of Precision', type: 'suffix', tiers: [{ ilvl: 8, roll: [2, 5] }, { ilvl: 20, roll: [5, 10] }, { ilvl: 35, roll: [10, 18] }],
        stat: 'critChance', allowedSlots: [...WEAPON_SLOTS, ...JEWELRY]
    },
    {
        id: 'crit_multi', name: 'of Slaughter', type: 'suffix', tiers: [{ ilvl: 12, roll: [20, 40] }, { ilvl: 28, roll: [40, 70] }, { ilvl: 45, roll: [70, 120] }],
        stat: 'critMulti', allowedSlots: WEAPON_SLOTS
    },
    {
        id: 'life_steal', name: 'of the Vampire', type: 'suffix', tiers: [{ ilvl: 10, roll: [3, 5] }, { ilvl: 22, roll: [5, 8] }, { ilvl: 38, roll: [8, 12] }],
        stat: 'lifeStealPct', allowedSlots: WEAPON_SLOTS
    },
    {
        id: 'mana_steal', name: 'of the Leech', type: 'suffix', tiers: [{ ilvl: 10, roll: [2, 4] }, { ilvl: 22, roll: [4, 7] }, { ilvl: 38, roll: [7, 11] }],
        stat: 'manaStealPct', allowedSlots: WEAPON_SLOTS
    },

    // --- Special D2 Combat Suffixes ---
    {
        id: 'crushing_blow', name: 'of Crushing', type: 'suffix', tiers: [{ ilvl: 25, roll: [5, 10] }, { ilvl: 45, roll: [11, 20] }, { ilvl: 70, roll: [21, 35] }],
        stat: 'crushingBlow', allowedSlots: [...WEAPON_SLOTS, 'gloves']
    },
    {
        id: 'deadly_strike', name: 'of Lethality', type: 'suffix', tiers: [{ ilvl: 30, roll: [5, 15] }, { ilvl: 50, roll: [16, 30] }, { ilvl: 75, roll: [31, 50] }],
        stat: 'deadlyStrike', allowedSlots: [...WEAPON_SLOTS, 'head']
    },
    {
        id: 'open_wounds', name: 'of Laceration', type: 'suffix', tiers: [{ ilvl: 20, roll: [10, 20] }, { ilvl: 40, roll: [21, 40] }, { ilvl: 65, roll: [41, 60] }],
        stat: 'openWounds', allowedSlots: [...WEAPON_SLOTS, 'belt']
    },

    // --- Move speed ---
    {
        id: 'move_speed', name: 'of Haste', type: 'suffix', tiers: [{ ilvl: 5, roll: [10, 15] }, { ilvl: 20, roll: [15, 25] }, { ilvl: 35, roll: [25, 40] }],
        stat: 'pctMoveSpeed', allowedSlots: ['boots', 'charm']
    },

    // --- Utility ---
    {
        id: 'magic_find', name: 'of Fortune', type: 'suffix', tiers: [{ ilvl: 4, roll: [5, 15] }, { ilvl: 20, roll: [16, 25] }, { ilvl: 40, roll: [26, 40] }],
        stat: 'magicFind', allowedSlots: ['boots', 'gloves', 'ring', 'amulet', 'helm', 'charm']
    },
    {
        id: 'gold_find', name: 'of Greed', type: 'suffix', tiers: [{ ilvl: 4, roll: [20, 40] }, { ilvl: 20, roll: [41, 75] }, { ilvl: 40, roll: [76, 150] }],
        stat: 'goldFind', allowedSlots: ['boots', 'gloves', 'ring', 'amulet', 'belt', 'charm']
    },

    // --- Block rate ---
    {
        id: 'block', name: 'of Warding', type: 'suffix', tiers: [{ ilvl: 3, roll: [5, 10] }, { ilvl: 15, roll: [10, 20] }, { ilvl: 30, roll: [20, 35] }],
        stat: 'blockChance', allowedSlots: ['shield']
    },

    // --- Socket affix (magic items) ---
    {
        id: 'socket_1', name: 'of the Socket', type: 'suffix', tiers: [{ ilvl: 10, roll: [1, 1] }],
        stat: 'sockets', allowedSlots: [...ARMOR_SLOTS, ...WEAPON_SLOTS], weight: 30
    },
];

// Weight for random selection (default 100 unless overridden)
export function getAffixPool(slot, ilvl, type) {
    return AFFIXES.filter(a => {
        if (a.type !== type) return false;
        const tierOk = a.tiers.some(t => t.ilvl <= ilvl);
        const slotOk = a.allowedSlots.includes(slot);
        return tierOk && slotOk;
    });
}

export function rollAffix(affix, ilvl) {
    // Pick highest eligible tier
    const eligible = affix.tiers.filter(t => t.ilvl <= ilvl);
    const tier = eligible[eligible.length - 1];
    const value = Math.floor(Math.random() * (tier.roll[1] - tier.roll[0] + 1)) + tier.roll[0];
    return { id: affix.id, name: affix.name, stat: affix.stat, value, type: affix.type };
}
