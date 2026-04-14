/**
 * ITEMS — Base item types, slot definitions, all weapon/armor bases
 */

export const SLOT = {
    HEAD: 'head',
    CHEST: 'chest',
    GLOVES: 'gloves',
    BOOTS: 'boots',
    MAINHAND: 'mainhand',
    OFFHAND: 'offhand',
    RING1: 'ring1',
    RING2: 'ring2',
    BELT: 'belt',
    AMULET: 'amulet',
};

export const SLOT_DISPLAY = {
    head: { label: 'Head', icon: 'item_helm', gridPos: [0, 2] },
    chest: { label: 'Chest', icon: 'item_chest', gridPos: [1, 2] },
    gloves: { label: 'Gloves', icon: 'item_gloves', gridPos: [2, 0] },
    boots: { label: 'Boots', icon: 'item_boots', gridPos: [3, 4] },
    mainhand: { label: 'Weapon', icon: 'item_sword', gridPos: [1, 0] },
    offhand: { label: 'Offhand', icon: 'item_shield', gridPos: [1, 4] },
    ring1: { label: 'Ring', icon: 'item_ring', gridPos: [3, 0] },
    ring2: { label: 'Ring', icon: 'item_ring', gridPos: [3, 4] },
    belt: { label: 'Belt', icon: 'item_belt', gridPos: [3, 2] },
    amulet: { label: 'Amulet', icon: 'item_amulet', gridPos: [0, 3] },
};

// ---- Item bases ----
export const ITEM_BASES = {
    // === WEAPONS ===
    // Swords
    short_sword: { name: 'Short Sword', slot: SLOT.MAINHAND, type: 'sword', icon: 'item_sword_hd', minDmg: 3, maxDmg: 9, atkSpd: 1.0, req: { str: 5 }, size: [1, 3] },
    long_sword: { name: 'Long Sword', slot: SLOT.MAINHAND, type: 'sword', icon: 'item_sword_hd', minDmg: 6, maxDmg: 16, atkSpd: 0.9, req: { str: 18 }, size: [1, 3] },
    zweihander: { name: 'Zweihänder', slot: SLOT.MAINHAND, type: 'sword', icon: 'item_sword_hd', minDmg: 14, maxDmg: 32, atkSpd: 0.7, req: { str: 45 }, size: [1, 3], twoHanded: true },
    // Axes
    hand_axe: { name: 'Hand Axe', slot: SLOT.MAINHAND, type: 'axe', icon: 'item_axe_hd', minDmg: 4, maxDmg: 11, atkSpd: 1.0, req: { str: 5 }, size: [1, 2] },
    war_axe: { name: 'War Axe', slot: SLOT.MAINHAND, type: 'axe', icon: 'item_axe_hd', minDmg: 10, maxDmg: 22, atkSpd: 0.85, req: { str: 32 }, size: [1, 3] },
    // Maces
    mace: { name: 'Mace', slot: SLOT.MAINHAND, type: 'mace', icon: 'item_mace_hd', minDmg: 5, maxDmg: 13, atkSpd: 0.95, req: { str: 8 }, size: [1, 2] },
    war_hammer: { name: 'War Hammer', slot: SLOT.MAINHAND, type: 'mace', icon: 'item_war_hammer_hd', minDmg: 12, maxDmg: 28, atkSpd: 0.75, req: { str: 50 }, size: [1, 3], twoHanded: true },
    // Staves
    short_staff: { name: 'Short Staff', slot: SLOT.MAINHAND, type: 'staff', icon: 'item_short_staff', minDmg: 2, maxDmg: 8, atkSpd: 1.1, req: { int: 5 }, size: [1, 3], twoHanded: true, manaBonus: 20 },
    war_staff: { name: 'War Staff', slot: SLOT.MAINHAND, type: 'staff', icon: 'item_war_staff', minDmg: 5, maxDmg: 14, atkSpd: 0.95, req: { int: 25 }, size: [1, 3], twoHanded: true, manaBonus: 40 },
    orb: { name: 'Arcane Orb', slot: SLOT.MAINHAND, type: 'orb', icon: 'item_orb', minDmg: 3, maxDmg: 10, atkSpd: 1.2, req: { int: 10 }, size: [1, 1] },
    // Bows
    short_bow: { name: 'Short Bow', slot: SLOT.MAINHAND, type: 'bow', icon: 'item_short_bow', minDmg: 4, maxDmg: 12, atkSpd: 1.15, req: { dex: 10 }, size: [2, 3], twoHanded: true, range: 350 },
    long_bow: { name: 'Long Bow', slot: SLOT.MAINHAND, type: 'bow', icon: 'item_long_bow', minDmg: 8, maxDmg: 20, atkSpd: 0.95, req: { dex: 30 }, size: [2, 3], twoHanded: true, range: 400 },
    // Daggers
    dagger: { name: 'Dagger', slot: SLOT.MAINHAND, type: 'dagger', icon: 'item_dagger', minDmg: 2, maxDmg: 7, atkSpd: 1.4, req: { dex: 5 }, size: [1, 2] },
    rune_blade: { name: 'Rune Blade', slot: SLOT.MAINHAND, type: 'dagger', icon: 'item_rune_blade', minDmg: 6, maxDmg: 14, atkSpd: 1.3, req: { dex: 22, int: 10 }, size: [1, 2] },
    // Totems (Shaman)
    totem: { name: 'Totem', slot: SLOT.MAINHAND, type: 'totem', icon: 'item_totem', minDmg: 3, maxDmg: 9, atkSpd: 1.0, req: { int: 10 }, size: [1, 2] },
    grand_totem: { name: 'Grand Totem', slot: SLOT.MAINHAND, type: 'totem', icon: 'item_grand_totem', minDmg: 6, maxDmg: 15, atkSpd: 0.9, req: { int: 25 }, size: [1, 3] },
    // Wands (Necro)
    wand: { name: 'Wand', slot: SLOT.MAINHAND, type: 'wand', icon: 'item_wand', minDmg: 2, maxDmg: 6, atkSpd: 1.3, req: { int: 10 }, size: [1, 2], manaBonus: 15 },
    bone_wand: { name: 'Bone Wand', slot: SLOT.MAINHAND, type: 'wand', icon: 'item_bone_wand', minDmg: 4, maxDmg: 10, atkSpd: 1.2, req: { int: 22 }, size: [1, 2], manaBonus: 30 },
    // Quest Items
    wirts_leg: { name: "Niruko's Leg", slot: SLOT.MAINHAND, type: 'mace', icon: 'item_mace', minDmg: 2, maxDmg: 8, atkSpd: 0.9, req: {}, size: [1, 3], flavor: '"A wooden prosthetic with a tragic history."' },

    // === ARMOR ===
    // Helmets
    leather_cap: { name: 'Leather Cap', slot: SLOT.HEAD, type: 'helm', icon: 'item_leather_cap', armor: 4, req: {}, size: [2, 2], sockets: 0 },
    great_helm: { name: 'Great Helm', slot: SLOT.HEAD, type: 'helm', icon: 'item_great_helm_hd', armor: 18, req: { str: 35 }, size: [2, 2], sockets: 2 },
    circlet: { name: 'Circlet', slot: SLOT.HEAD, type: 'helm', icon: 'item_circlet', armor: 8, req: { int: 15 }, size: [2, 2], sockets: 1, manaBonus: 15 },
    // Chestpieces
    leather_armor: { name: 'Leather Armor', slot: SLOT.CHEST, type: 'armor', icon: 'item_leather_armor', armor: 12, req: { str: 5 }, size: [2, 3], sockets: 1 },
    chain_mail: { name: 'Chain Mail', slot: SLOT.CHEST, type: 'armor', icon: 'item_chain_mail', armor: 28, req: { str: 30 }, size: [2, 3], sockets: 2 },
    plate_mail: { name: 'Plate Mail', slot: SLOT.CHEST, type: 'armor', icon: 'item_plate_mail_hd', armor: 52, req: { str: 55 }, size: [2, 3], sockets: 3 },
    robe: { name: 'Robe', slot: SLOT.CHEST, type: 'armor', icon: 'item_robe', armor: 6, req: { int: 5 }, size: [2, 3], sockets: 2, manaBonus: 25 },
    // Gloves
    leather_gloves: { name: 'Leather Gloves', slot: SLOT.GLOVES, type: 'gloves', icon: 'item_leather_gloves', armor: 3, req: {}, size: [2, 2] },
    gauntlets: { name: 'Gauntlets', slot: SLOT.GLOVES, type: 'gloves', icon: 'item_gauntlets', armor: 12, req: { str: 25 }, size: [2, 2] },
    // Boots
    leather_boots: { name: 'Leather Boots', slot: SLOT.BOOTS, type: 'boots', icon: 'item_leather_boots', armor: 5, req: {}, size: [2, 2] },
    war_boots: { name: 'War Boots', slot: SLOT.BOOTS, type: 'boots', icon: 'item_war_boots', armor: 16, req: { str: 35 }, size: [2, 2] },
    // Belt
    leather_belt: { name: 'Leather Belt', slot: SLOT.BELT, type: 'belt', icon: 'item_belt', armor: 2, req: {}, size: [2, 1] },
    // Shields / Offhand
    buckler: { name: 'Buckler', slot: SLOT.OFFHAND, type: 'shield', icon: 'item_shield_hd', block: 12, armor: 8, req: { str: 5 }, size: [2, 2] },
    bone_shield: { name: 'Bone Shield', slot: SLOT.OFFHAND, type: 'shield', icon: 'item_shield_hd', block: 20, armor: 14, req: { str: 25 }, size: [2, 2] },
    tower_shield: { name: 'Tower Shield', slot: SLOT.OFFHAND, type: 'shield', icon: 'item_shield_hd', block: 28, armor: 22, req: { str: 45 }, size: [2, 3] },
    source: { name: 'Tome', slot: SLOT.OFFHAND, type: 'source', icon: 'item_source', armor: 2, req: { int: 15 }, size: [1, 2], manaBonus: 40 },
    // Jewelry
    ring: { name: 'Ring', slot: SLOT.RING1, type: 'ring', icon: 'item_ring', size: [1, 1] },
    amulet: { name: 'Amulet', slot: SLOT.AMULET, type: 'amulet', icon: 'item_amulet', size: [1, 1] },

    // === CHARMS ===
    small_charm: { name: 'Small Charm', slot: 'none', type: 'charm', icon: 'item_charm_small', size: [1, 1], price: 50 },
    large_charm: { name: 'Large Charm', slot: 'none', type: 'charm', icon: 'item_charm_large', size: [1, 2], price: 100 },
    grand_charm: { name: 'Grand Charm', slot: 'none', type: 'charm', icon: 'item_charm_grand', size: [1, 3], price: 200 },

    // === CONSUMABLES ===
    health_potion: { name: 'Health Potion', slot: 'none', type: 'potion', icon: 'item_potion_hp', size: [1, 1] },
    mana_potion: { name: 'Mana Potion', slot: 'none', type: 'potion', icon: 'item_potion_mp', size: [1, 1] },
    rejuv_potion: { name: 'Rejuv Potion', slot: 'none', type: 'potion', icon: 'item_potion_rejuv', size: [1, 1], price: 75 },

    // === SCROLLS ===
    scroll_identify: { name: 'Scroll of Identification', slot: 'none', type: 'scroll', icon: 'item_scroll', size: [1, 1], price: 100 },
    scroll_town_portal: { name: 'Scroll of Town Portal', slot: 'none', type: 'scroll', icon: 'item_scroll_tp', size: [1, 1], price: 10 },

    // === TOMES ===
    tome_tp: { name: 'Tome of Town Portal', slot: 'none', type: 'tome', icon: 'item_tome_tp', size: [1, 2], price: 150, maxCharges: 20 },
    tome_identify: { name: 'Tome of Identification', slot: 'none', type: 'tome', icon: 'item_tome_id', size: [1, 2], price: 150, maxCharges: 20 },

    // === GEMS ===
    chipped_ruby: { name: 'Chipped Ruby', slot: 'none', type: 'gem', icon: 'item_ruby', size: [1, 1], price: 25, socketEffect: { weapon: { stat: 'flatFireDmg', value: 4 }, armor: { stat: 'flatHP', value: 10 }, shield: { stat: 'fireRes', value: 10 } } },
    chipped_sapphire: { name: 'Chipped Sapphire', slot: 'none', type: 'gem', icon: 'item_sapphire', size: [1, 1], price: 25, socketEffect: { weapon: { stat: 'flatColdDmg', value: 4 }, armor: { stat: 'flatMP', value: 10 }, shield: { stat: 'coldRes', value: 10 } } },
    chipped_topaz: { name: 'Chipped Topaz', slot: 'none', type: 'gem', icon: 'item_topaz', size: [1, 1], price: 25, socketEffect: { weapon: { stat: 'flatLightDmg', value: 4 }, armor: { stat: 'magicFind', value: 5 }, shield: { stat: 'lightRes', value: 10 } } },
    chipped_emerald: { name: 'Chipped Emerald', slot: 'none', type: 'gem', icon: 'item_emerald', size: [1, 1], price: 25, socketEffect: { weapon: { stat: 'flatPoisonDmg', value: 6 }, armor: { stat: 'flatDEX', value: 3 }, shield: { stat: 'poisonRes', value: 10 } } },
    chipped_skull: { name: 'Chipped Skull', slot: 'none', type: 'gem', icon: 'item_skull', size: [1, 1], price: 25, socketEffect: { weapon: { stat: 'lifeStealPct', value: 2 }, armor: { stat: 'hpRegenPerSec', value: 2 }, shield: { stat: 'manaRegenPerSec', value: 2 } } },
    perfect_ruby: { name: 'Perfect Ruby', slot: 'none', type: 'gem', icon: 'item_ruby_perfect', size: [1, 1], price: 500, socketEffect: { weapon: { stat: 'flatFireDmg', value: 20 }, armor: { stat: 'flatHP', value: 38 }, shield: { stat: 'fireRes', value: 40 } } },
    perfect_sapphire: { name: 'Perfect Sapphire', slot: 'none', type: 'gem', icon: 'item_sapphire_perfect', size: [1, 1], price: 500, socketEffect: { weapon: { stat: 'flatColdDmg', value: 20 }, armor: { stat: 'flatMP', value: 38 }, shield: { stat: 'coldRes', value: 40 } } },
    perfect_topaz: { name: 'Perfect Topaz', slot: 'none', type: 'gem', icon: 'item_topaz_perfect', size: [1, 1], price: 500, socketEffect: { weapon: { stat: 'flatLightDmg', value: 20 }, armor: { stat: 'magicFind', value: 24 }, shield: { stat: 'lightRes', value: 40 } } },
    perfect_emerald: { name: 'Perfect Emerald', slot: 'none', type: 'gem', icon: 'item_emerald_perfect', size: [1, 1], price: 500, socketEffect: { weapon: { stat: 'flatPoisonDmg', value: 100 }, armor: { stat: 'flatDEX', value: 10 }, shield: { stat: 'poisonRes', value: 40 } } },
    perfect_skull: { name: 'Perfect Skull', slot: 'none', type: 'gem', icon: 'item_skull_perfect', size: [1, 1], price: 500, socketEffect: { weapon: { stat: 'lifeStealPct', value: 4 }, armor: { stat: 'hpRegenPerSec', value: 5 }, shield: { stat: 'manaRegenPerSec', value: 5 } } },

    // === RUNES ===
    rune_el: { name: 'El Rune', slot: 'none', type: 'gem', icon: 'item_rune_el', size: [1, 1], price: 50, socketEffect: { weapon: { stat: 'flatMinDmg', value: 15 }, armor: { stat: 'flatArmor', value: 15 }, shield: { stat: 'flatArmor', value: 15 } } },
    rune_eld: { name: 'Eld Rune', slot: 'none', type: 'gem', icon: 'item_rune_eld', size: [1, 1], price: 50, socketEffect: { weapon: { stat: 'pctDmg', value: 10 }, armor: { stat: 'pctArmor', value: 10 }, shield: { stat: 'blockChance', value: 5 } } },
    rune_tir: { name: 'Tir Rune', slot: 'none', type: 'gem', icon: 'item_rune_tir', size: [1, 1], price: 50, socketEffect: { weapon: { stat: 'manaAfterKill', value: 2 }, armor: { stat: 'manaAfterKill', value: 2 }, shield: { stat: 'manaAfterKill', value: 2 } } },
    rune_nef: { name: 'Nef Rune', slot: 'none', type: 'gem', icon: 'item_rune_nef', size: [1, 1], price: 50, socketEffect: { weapon: { stat: 'knockback', value: 1 }, armor: { stat: 'flatArmor', value: 30 }, shield: { stat: 'flatArmor', value: 30 } } },
    rune_eth: { name: 'Eth Rune', slot: 'none', type: 'gem', icon: 'item_rune_eth', size: [1, 1], price: 50, socketEffect: { weapon: { stat: 'targetDefenseReduce', value: 25 }, armor: { stat: 'manaRegenPerSec', value: 3 }, shield: { stat: 'manaRegenPerSec', value: 3 } } },
    rune_ith: { name: 'Ith Rune', slot: 'none', type: 'gem', icon: 'item_rune_ith', size: [1, 1], price: 50, socketEffect: { weapon: { stat: 'flatMaxDmg', value: 9 }, armor: { stat: 'dmgTakenToMana', value: 15 }, shield: { stat: 'dmgTakenToMana', value: 15 } } },
    rune_tal: { name: 'Tal Rune', slot: 'none', type: 'gem', icon: 'item_rune_tal', size: [1, 1], price: 50, socketEffect: { weapon: { stat: 'flatPoisonDmg', value: 75 }, armor: { stat: 'poisRes', value: 30 }, shield: { stat: 'poisRes', value: 30 } } },
    rune_ral: { name: 'Ral Rune', slot: 'none', type: 'gem', icon: 'item_rune_ral', size: [1, 1], price: 50, socketEffect: { weapon: { stat: 'flatFireDmg', value: 30 }, armor: { stat: 'fireRes', value: 30 }, shield: { stat: 'fireRes', value: 30 } } },
    rune_ort: { name: 'Ort Rune', slot: 'none', type: 'gem', icon: 'item_rune_ort', size: [1, 1], price: 50, socketEffect: { weapon: { stat: 'flatLightDmg', value: 50 }, armor: { stat: 'lightRes', value: 30 }, shield: { stat: 'lightRes', value: 30 } } },
    rune_thul: { name: 'Thul Rune', slot: 'none', type: 'gem', icon: 'item_rune_thul', size: [1, 1], price: 50, socketEffect: { weapon: { stat: 'flatColdDmg', value: 20 }, armor: { stat: 'coldRes', value: 30 }, shield: { stat: 'coldRes', value: 30 } } },
    rune_amn: { name: 'Amn Rune', slot: 'none', type: 'gem', icon: 'item_rune_amn', size: [1, 1], price: 75, socketEffect: { weapon: { stat: 'lifeStealPct', value: 7 }, armor: { stat: 'thorns', value: 14 }, shield: { stat: 'thorns', value: 14 } } },
    rune_sol: { name: 'Sol Rune', slot: 'none', type: 'gem', icon: 'item_rune_sol', size: [1, 1], price: 75, socketEffect: { weapon: { stat: 'flatMinDmg', value: 9 }, armor: { stat: 'flatDmgReduce', value: 7 }, shield: { stat: 'flatDmgReduce', value: 7 } } },
    rune_shael: { name: 'Shael Rune', slot: 'none', type: 'gem', icon: 'item_rune_shael', size: [1, 1], price: 75, socketEffect: { weapon: { stat: 'pctIAS', value: 20 }, armor: { stat: 'pctFHR', value: 20 }, shield: { stat: 'pctFBR', value: 20 } } },
    rune_dol: { name: 'Dol Rune', slot: 'none', type: 'gem', icon: 'item_rune_dol', size: [1, 1], price: 75, socketEffect: { weapon: { stat: 'monsterFear', value: 25 }, armor: { stat: 'lifeRegenPerSec', value: 7 }, shield: { stat: 'lifeRegenPerSec', value: 7 } } },
    rune_hel: { name: 'Hel Rune', slot: 'none', type: 'gem', icon: 'item_rune_hel', size: [1, 1], price: 100, socketEffect: { weapon: { stat: 'reqReduce', value: 20 }, armor: { stat: 'reqReduce', value: 15 }, shield: { stat: 'reqReduce', value: 15 } } },
    rune_io: { name: 'Io Rune', slot: 'none', type: 'gem', icon: 'item_rune_io', size: [1, 1], price: 100, socketEffect: { weapon: { stat: 'flatVIT', value: 10 }, armor: { stat: 'flatVIT', value: 10 }, shield: { stat: 'flatVIT', value: 10 } } },
    rune_lum: { name: 'Lum Rune', slot: 'none', type: 'gem', icon: 'item_rune_lum', size: [1, 1], price: 100, socketEffect: { weapon: { stat: 'flatMP', value: 10 }, armor: { stat: 'flatMP', value: 10 }, shield: { stat: 'flatMP', value: 10 } } },
    rune_ko: { name: 'Ko Rune', slot: 'none', type: 'gem', icon: 'item_rune_ko', size: [1, 1], price: 100, socketEffect: { weapon: { stat: 'flatDEX', value: 10 }, armor: { stat: 'flatDEX', value: 10 }, shield: { stat: 'flatDEX', value: 10 } } },
    rune_fal: { name: 'Fal Rune', slot: 'none', type: 'gem', icon: 'item_rune_fal', size: [1, 1], price: 100, socketEffect: { weapon: { stat: 'flatSTR', value: 10 }, armor: { stat: 'flatSTR', value: 10 }, shield: { stat: 'flatSTR', value: 10 } } },
    rune_lem: { name: 'Lem Rune', slot: 'none', type: 'gem', icon: 'item_rune_lem', size: [1, 1], price: 150, socketEffect: { weapon: { stat: 'goldFind', value: 75 }, armor: { stat: 'goldFind', value: 50 }, shield: { stat: 'goldFind', value: 50 } } },
    rune_pul: { name: 'Pul Rune', slot: 'none', type: 'gem', icon: 'item_rune_pul', size: [1, 1], price: 150, socketEffect: { weapon: { stat: 'pctDmgUndead', value: 75 }, armor: { stat: 'pctArmor', value: 30 }, shield: { stat: 'pctArmor', value: 30 } } },
    rune_um: { name: 'Um Rune', slot: 'none', type: 'gem', icon: 'item_rune_um', size: [1, 1], price: 200, socketEffect: { weapon: { stat: 'openWounds', value: 25 }, armor: { stat: 'allRes', value: 15 }, shield: { stat: 'allRes', value: 22 } } },
    rune_mal: { name: 'Mal Rune', slot: 'none', type: 'gem', icon: 'item_rune_mal', size: [1, 1], price: 200, socketEffect: { weapon: { stat: 'preventMonsterHeal', value: 1 }, armor: { stat: 'magicDmgReduce', value: 7 }, shield: { stat: 'magicDmgReduce', value: 7 } } },
    rune_ist: { name: 'Ist Rune', slot: 'none', type: 'gem', icon: 'item_rune_ist', size: [1, 1], price: 250, socketEffect: { weapon: { stat: 'magicFind', value: 30 }, armor: { stat: 'magicFind', value: 25 }, shield: { stat: 'magicFind', value: 25 } } },
    rune_gul: { name: 'Gul Rune', slot: 'none', type: 'gem', icon: 'item_rune_el', size: [1, 1], price: 300, socketEffect: { weapon: { stat: 'pctHitRating', value: 20 }, armor: { stat: 'maxPoisRes', value: 5 }, shield: { stat: 'maxPoisRes', value: 5 } } },
    rune_vex: { name: 'Vex Rune', slot: 'none', type: 'gem', icon: 'item_rune_vex', size: [1, 1], price: 400, socketEffect: { weapon: { stat: 'manaStealPct', value: 7 }, armor: { stat: 'maxFireRes', value: 5 }, shield: { stat: 'maxFireRes', value: 5 } } },
    rune_ohm: { name: 'Ohm Rune', slot: 'none', type: 'gem', icon: 'item_rune_ohm', size: [1, 1], price: 500, socketEffect: { weapon: { stat: 'pctDmg', value: 50 }, armor: { stat: 'maxColdRes', value: 5 }, shield: { stat: 'maxColdRes', value: 5 } } },
    rune_lo: { name: 'Lo Rune', slot: 'none', type: 'gem', icon: 'item_rune_lo', size: [1, 1], price: 600, socketEffect: { weapon: { stat: 'critChance', value: 20 }, armor: { stat: 'maxLightRes', value: 5 }, shield: { stat: 'maxLightRes', value: 5 } } },
    rune_sur: { name: 'Sur Rune', slot: 'none', type: 'gem', icon: 'item_rune_sur', size: [1, 1], price: 700, socketEffect: { weapon: { stat: 'monsterBlind', value: 20 }, armor: { stat: 'pctMP', value: 5 }, shield: { stat: 'flatMP', value: 50 } } },
    rune_ber: { name: 'Ber Rune', slot: 'none', type: 'gem', icon: 'item_rune_ber', size: [1, 1], price: 800, socketEffect: { weapon: { stat: 'crushingBlow', value: 20 }, armor: { stat: 'pctDmgReduce', value: 8 }, shield: { stat: 'pctDmgReduce', value: 8 } } },
    rune_jah: { name: 'Jah Rune', slot: 'none', type: 'gem', icon: 'item_rune_zod', size: [1, 1], price: 900, socketEffect: { weapon: { stat: 'ignoreDefense', value: 1 }, armor: { stat: 'pctHP', value: 5 }, shield: { stat: 'flatHP', value: 50 } } },
    rune_cham: { name: 'Cham Rune', slot: 'none', type: 'gem', icon: 'item_rune_zod', size: [1, 1], price: 1000, socketEffect: { weapon: { stat: 'monsterFreeze', value: 3 }, armor: { stat: 'cannotBeFrozen', value: 1 }, shield: { stat: 'cannotBeFrozen', value: 1 } } },
    rune_zod: { name: 'Zod Rune', slot: 'none', type: 'gem', icon: 'item_rune_zod', size: [1, 1], price: 1000, socketEffect: { weapon: { stat: 'indestructible', value: 1 }, armor: { stat: 'indestructible', value: 1 }, shield: { stat: 'indestructible', value: 1 } } },

    // === QUEST ITEMS ===
    wirts_leg: { name: "Niruko's Leg", slot: 'weapon', type: 'club', icon: 'item_mace', size: [1, 3], price: 1, minDmg: 1, maxDmg: 8, atkSpd: 1.2, flavor: '"Cain says there was something about a portal..."', unidentified: false },
    // tome_tp: { name: 'Tome of Town Portal', slot: 'none', type: 'book', icon: 'item_scroll_tp', size: [2, 2], price: 500, flavor: '"Blue magic that whisks you home."', identified: true }, // Redundant with line 105 but fixing icon anyway
    cow_portal: { name: 'Cow Portal Key', slot: 'none', type: 'material', icon: 'item_scroll_tp', size: [1, 1], price: 0, flavor: '"The seal of the Cow King."', identified: true },

    // === MATERIALS ===
    horadric_fragment: { name: "Horadric Fragment", slot: 'none', type: 'material', icon: 'item_horadric_fragment', size: [1, 1], price: 200, flavor: '"A shard of a lost artifact, hums with ancient power."' },
    mephisto_soulstone: { name: "Mephisto's Soulstone", slot: 'none', type: 'material', icon: 'item_mephisto_soulstone', size: [1, 1], price: 0, flavor: '"The essence of the Lord of Hatred, waiting to be shattered."', identified: true },
    book_of_skill: { name: "Book of Skill", slot: 'none', type: 'potion', icon: 'item_book_skill_hd', size: [1, 1], price: 0, flavor: '"Read this to gain a permanent skill point."', identified: true },
    staff_of_kings: { name: "Staff of Kings", slot: 'none', type: 'material', icon: 'item_staff_kings_hd', size: [1, 3], price: 0, flavor: '"An ancient mahogany staff, part of the Horadric legend."', identified: true },
    viper_amulet: { name: "Viper Amulet", slot: 'none', type: 'material', icon: 'item_amulet_viper_hd', size: [1, 1], price: 0, flavor: '"The Amulet of the Viper, glowing with forbidden magic."', identified: true },
    horadric_staff: { name: "Horadric Staff", slot: SLOT.MAINHAND, type: 'staff', icon: 'item_staff_kings_hd', minDmg: 12, maxDmg: 30, atkSpd: 0.7, req: { str: 25 }, size: [1, 4], mods: [{ stat: 'allRes', value: 10 }, { stat: 'flatMP', value: 50 }], flavor: '"The powerful Horadric Staff, restored at last."', identified: true },
    hellforge_hammer: { name: "Hellforge Hammer", slot: SLOT.MAINHAND, type: 'mace', icon: 'item_war_hammer_hd', minDmg: 8, maxDmg: 20, atkSpd: 0.8, req: { str: 20 }, size: [1, 3], flavor: '"Only this hammer can shatter a Prime Evil\'s soulstone."', identified: true },
};


export const SOCKET_MAX = {
    weapon: 3, helm: 2, armor: 4, gloves: 1, boots: 1, shield: 3, source: 2, wand: 2, staff: 3,
};

export function getBase(id) { return ITEM_BASES[id]; }
export const items = ITEM_BASES;
