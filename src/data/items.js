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
    short_sword: { name: 'Short Sword', slot: SLOT.MAINHAND, type: 'sword', icon: 'item_sword', minDmg: 3, maxDmg: 9, atkSpd: 1.0, req: { str: 5 }, size: [1, 3] },
    long_sword: { name: 'Long Sword', slot: SLOT.MAINHAND, type: 'sword', icon: 'item_sword', minDmg: 6, maxDmg: 16, atkSpd: 0.9, req: { str: 18 }, size: [1, 3] },
    zweihander: { name: 'Zweihänder', slot: SLOT.MAINHAND, type: 'sword', icon: 'item_sword', minDmg: 14, maxDmg: 32, atkSpd: 0.7, req: { str: 45 }, size: [1, 3], twoHanded: true },
    // Axes
    hand_axe: { name: 'Hand Axe', slot: SLOT.MAINHAND, type: 'axe', icon: 'item_axe', minDmg: 4, maxDmg: 11, atkSpd: 1.0, req: { str: 5 }, size: [1, 2] },
    war_axe: { name: 'War Axe', slot: SLOT.MAINHAND, type: 'axe', icon: 'item_axe', minDmg: 10, maxDmg: 22, atkSpd: 0.85, req: { str: 32 }, size: [1, 3] },
    // Maces
    mace: { name: 'Mace', slot: SLOT.MAINHAND, type: 'mace', icon: 'item_mace', minDmg: 5, maxDmg: 13, atkSpd: 0.95, req: { str: 8 }, size: [1, 2] },
    war_hammer: { name: 'War Hammer', slot: SLOT.MAINHAND, type: 'mace', icon: 'item_mace', minDmg: 12, maxDmg: 28, atkSpd: 0.75, req: { str: 50 }, size: [1, 3], twoHanded: true },
    // Staves
    short_staff: { name: 'Short Staff', slot: SLOT.MAINHAND, type: 'staff', icon: 'item_mace', minDmg: 2, maxDmg: 8, atkSpd: 1.1, req: { int: 5 }, size: [1, 3], twoHanded: true, manaBonus: 20 },
    war_staff: { name: 'War Staff', slot: SLOT.MAINHAND, type: 'staff', icon: 'item_mace', minDmg: 5, maxDmg: 14, atkSpd: 0.95, req: { int: 25 }, size: [1, 3], twoHanded: true, manaBonus: 40 },
    orb: { name: 'Arcane Orb', slot: SLOT.MAINHAND, type: 'orb', icon: 'item_amulet', minDmg: 3, maxDmg: 10, atkSpd: 1.2, req: { int: 10 }, size: [1, 1] },
    // Bows
    short_bow: { name: 'Short Bow', slot: SLOT.MAINHAND, type: 'bow', icon: 'item_bow', minDmg: 4, maxDmg: 12, atkSpd: 1.15, req: { dex: 10 }, size: [2, 3], twoHanded: true, range: 350 },
    long_bow: { name: 'Long Bow', slot: SLOT.MAINHAND, type: 'bow', icon: 'item_bow', minDmg: 8, maxDmg: 20, atkSpd: 0.95, req: { dex: 30 }, size: [2, 3], twoHanded: true, range: 400 },
    // Daggers
    dagger: { name: 'Dagger', slot: SLOT.MAINHAND, type: 'dagger', icon: 'item_sword', minDmg: 2, maxDmg: 7, atkSpd: 1.4, req: { dex: 5 }, size: [1, 2] },
    rune_blade: { name: 'Rune Blade', slot: SLOT.MAINHAND, type: 'dagger', icon: 'item_sword', minDmg: 6, maxDmg: 14, atkSpd: 1.3, req: { dex: 22, int: 10 }, size: [1, 2] },
    // Totems (Shaman)
    totem: { name: 'Totem', slot: SLOT.MAINHAND, type: 'totem', icon: 'item_mace', minDmg: 3, maxDmg: 9, atkSpd: 1.0, req: { int: 10 }, size: [1, 2] },
    grand_totem: { name: 'Grand Totem', slot: SLOT.MAINHAND, type: 'totem', icon: 'item_mace', minDmg: 6, maxDmg: 15, atkSpd: 0.9, req: { int: 25 }, size: [1, 3] },
    // Wands (Necro)
    wand: { name: 'Wand', slot: SLOT.MAINHAND, type: 'wand', icon: 'item_sword', minDmg: 2, maxDmg: 6, atkSpd: 1.3, req: { int: 10 }, size: [1, 2], manaBonus: 15 },
    bone_wand: { name: 'Bone Wand', slot: SLOT.MAINHAND, type: 'wand', icon: 'item_sword', minDmg: 4, maxDmg: 10, atkSpd: 1.2, req: { int: 22 }, size: [1, 2], manaBonus: 30 },

    // === ARMOR ===
    // Helmets
    leather_cap: { name: 'Leather Cap', slot: SLOT.HEAD, type: 'helm', icon: 'item_helm', armor: 4, req: {}, size: [2, 2], sockets: 0 },
    great_helm: { name: 'Great Helm', slot: SLOT.HEAD, type: 'helm', icon: 'item_helm', armor: 18, req: { str: 35 }, size: [2, 2], sockets: 2 },
    circlet: { name: 'Circlet', slot: SLOT.HEAD, type: 'helm', icon: 'item_helm', armor: 8, req: { int: 15 }, size: [2, 2], sockets: 1, manaBonus: 15 },
    // Chestpieces
    leather_armor: { name: 'Leather Armor', slot: SLOT.CHEST, type: 'armor', icon: 'item_chest', armor: 12, req: { str: 5 }, size: [2, 3], sockets: 1 },
    chain_mail: { name: 'Chain Mail', slot: SLOT.CHEST, type: 'armor', icon: 'item_chest', armor: 28, req: { str: 30 }, size: [2, 3], sockets: 2 },
    plate_mail: { name: 'Plate Mail', slot: SLOT.CHEST, type: 'armor', icon: 'item_chest', armor: 52, req: { str: 55 }, size: [2, 3], sockets: 3 },
    robe: { name: 'Robe', slot: SLOT.CHEST, type: 'armor', icon: 'item_chest', armor: 6, req: { int: 5 }, size: [2, 3], sockets: 2, manaBonus: 25 },
    // Gloves
    leather_gloves: { name: 'Leather Gloves', slot: SLOT.GLOVES, type: 'gloves', icon: 'item_gloves', armor: 3, req: {}, size: [2, 2] },
    gauntlets: { name: 'Gauntlets', slot: SLOT.GLOVES, type: 'gloves', icon: 'item_gloves', armor: 12, req: { str: 25 }, size: [2, 2] },
    // Boots
    leather_boots: { name: 'Leather Boots', slot: SLOT.BOOTS, type: 'boots', icon: 'item_boots', armor: 5, req: {}, size: [2, 2] },
    war_boots: { name: 'War Boots', slot: SLOT.BOOTS, type: 'boots', icon: 'item_boots', armor: 16, req: { str: 35 }, size: [2, 2] },
    // Belt
    leather_belt: { name: 'Leather Belt', slot: SLOT.BELT, type: 'belt', icon: 'item_belt', armor: 2, req: {}, size: [2, 1] },
    // Shields / Offhand
    buckler: { name: 'Buckler', slot: SLOT.OFFHAND, type: 'shield', icon: 'item_shield', block: 12, armor: 8, req: { str: 5 }, size: [2, 2] },
    tower_shield: { name: 'Tower Shield', slot: SLOT.OFFHAND, type: 'shield', icon: 'item_shield', block: 28, armor: 22, req: { str: 45 }, size: [2, 3] },
    source: { name: 'Tome', slot: SLOT.OFFHAND, type: 'source', icon: 'item_shield', armor: 2, req: { int: 15 }, size: [1, 2], manaBonus: 40 },
    // Jewelry
    ring: { name: 'Ring', slot: SLOT.RING1, type: 'ring', icon: 'item_ring', size: [1, 1] },
    amulet: { name: 'Amulet', slot: SLOT.AMULET, type: 'amulet', icon: 'item_amulet', size: [1, 1] },

    // === CHARMS ===
    small_charm: { name: 'Small Charm', slot: 'none', type: 'charm', icon: 'item_ring', size: [1, 1] },
    large_charm: { name: 'Large Charm', slot: 'none', type: 'charm', icon: 'item_amulet', size: [1, 2] },
    grand_charm: { name: 'Grand Charm', slot: 'none', type: 'charm', icon: 'item_shield', size: [1, 3] },

    // === CONSUMABLES ===
    health_potion: { name: 'Health Potion', slot: 'none', type: 'potion', icon: 'item_potion_hp', size: [1, 1] },
    mana_potion: { name: 'Mana Potion', slot: 'none', type: 'potion', icon: 'item_potion_mp', size: [1, 1] },
    rejuv_potion: { name: 'Rejuv Potion', slot: 'none', type: 'potion', icon: 'item_potion_mp', size: [1, 1] },
    // === GEMS ===
    chipped_ruby: { name: 'Chipped Ruby', slot: 'none', type: 'gem', icon: 'item_amulet', size: [1, 1], socketEffect: { weapon: { stat: 'flatFireDmg', value: 4 }, armor: { stat: 'flatHP', value: 10 }, shield: { stat: 'fireRes', value: 10 } } },
    chipped_sapphire: { name: 'Chipped Sapphire', slot: 'none', type: 'gem', icon: 'item_amulet', size: [1, 1], socketEffect: { weapon: { stat: 'flatColdDmg', value: 4 }, armor: { stat: 'flatMP', value: 10 }, shield: { stat: 'coldRes', value: 10 } } },
    chipped_topaz: { name: 'Chipped Topaz', slot: 'none', type: 'gem', icon: 'item_amulet', size: [1, 1], socketEffect: { weapon: { stat: 'flatLightDmg', value: 4 }, armor: { stat: 'magicFind', value: 5 }, shield: { stat: 'lightRes', value: 10 } } },
    chipped_emerald: { name: 'Chipped Emerald', slot: 'none', type: 'gem', icon: 'item_amulet', size: [1, 1], socketEffect: { weapon: { stat: 'flatPoisonDmg', value: 6 }, armor: { stat: 'flatDEX', value: 3 }, shield: { stat: 'poisonRes', value: 10 } } },
    chipped_skull: { name: 'Chipped Skull', slot: 'none', type: 'gem', icon: 'item_amulet', size: [1, 1], socketEffect: { weapon: { stat: 'lifeStealPct', value: 2 }, armor: { stat: 'hpRegenPerSec', value: 2 }, shield: { stat: 'manaRegenPerSec', value: 2 } } },
};


// Sockets per item type max
export const SOCKET_MAX = {
    weapon: 3, helm: 2, armor: 4, gloves: 1, boots: 1, shield: 3, source: 2, wand: 2, staff: 3,
};

export function getBase(id) { return ITEM_BASES[id]; }
export const items = ITEM_BASES;
