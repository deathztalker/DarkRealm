/**
 * ITEM BASES - Base templates for all items in the game.
 * Stats here are for the 'Normal' version.
 */

export const RARITY = { NORMAL: 'normal', MAGIC: 'magic', RARE: 'rare', SET: 'set', UNIQUE: 'unique' };

export const SLOT = {
    HEAD: 'head',
    CHEST: 'chest',
    MAINHAND: 'mainhand',
    OFFHAND: 'offhand',
    GLOVES: 'gloves',
    BOOTS: 'boots',
    BELT: 'belt',
    RING: 'ring',
    AMULET: 'amulet'
};

export const ITEM_BASES = {
    // === WEAPONS ===
    axe: { name: 'Axe', slot: SLOT.MAINHAND, type: 'axe', icon: 'item_axe', minDmg: 3, maxDmg: 7, atkSpd: 1.0, req: { str: 10 }, size: [1, 2], price: 50 },
    axe_war: { name: 'War Axe', slot: SLOT.MAINHAND, type: 'axe', icon: 'item_axe_hd', minDmg: 8, maxDmg: 15, atkSpd: 0.9, req: { str: 25 }, size: [1, 3], price: 200 },
    sword_short: { name: 'Short Sword', slot: SLOT.MAINHAND, type: 'sword', icon: 'item_sword', minDmg: 2, maxDmg: 5, atkSpd: 1.2, req: { dex: 10 }, size: [1, 2], price: 30 },
    sword_long: { name: 'Long Sword', slot: SLOT.MAINHAND, type: 'sword', icon: 'item_sword', minDmg: 5, maxDmg: 12, atkSpd: 1.1, req: { str: 15, dex: 15 }, size: [1, 3], price: 100 },
    long_sword: { name: 'Long Sword', slot: SLOT.MAINHAND, type: 'sword', icon: 'item_sword', minDmg: 5, maxDmg: 12, atkSpd: 1.1, req: { str: 15, dex: 15 }, size: [1, 3], price: 100 },
    bow_short: { name: 'Short Bow', slot: SLOT.MAINHAND, type: 'bow', icon: 'item_bow', minDmg: 1, maxDmg: 6, atkSpd: 1.3, req: { dex: 20 }, size: [1, 3], price: 40 },
    long_bow: { name: 'Long Bow', slot: SLOT.MAINHAND, type: 'bow', icon: 'item_bow_long', minDmg: 4, maxDmg: 14, atkSpd: 1.1, req: { dex: 35 }, size: [2, 4], price: 120 },
    staff: { name: 'Short Staff', slot: SLOT.MAINHAND, type: 'staff', icon: 'item_staff', minDmg: 2, maxDmg: 4, atkSpd: 1.0, size: [1, 3], price: 20 },
    dagger: { name: 'Dagger', slot: SLOT.MAINHAND, type: 'dagger', icon: 'item_dagger', minDmg: 1, maxDmg: 4, atkSpd: 1.5, size: [1, 2], price: 15 },
    wand: { name: 'Wand', slot: SLOT.MAINHAND, type: 'wand', icon: 'item_wand', minDmg: 2, maxDmg: 4, atkSpd: 1.1, size: [1, 2], price: 25 },
    mace: { name: 'Mace', slot: SLOT.MAINHAND, type: 'mace', icon: 'item_mace', minDmg: 3, maxDmg: 6, atkSpd: 1.1, req: { str: 12 }, size: [1, 2], price: 35 },
    rune_blade: { name: 'Rune Blade', slot: SLOT.MAINHAND, type: 'sword', icon: 'item_rune_blade', minDmg: 12, maxDmg: 25, atkSpd: 1.4, req: { dex: 40, str: 20 }, size: [1, 3], price: 400 },
    zweihander: { name: 'Zweihander', slot: SLOT.MAINHAND, type: 'sword', icon: 'item_sword_hd', minDmg: 15, maxDmg: 35, atkSpd: 0.8, req: { str: 50, dex: 20 }, size: [2, 4], price: 500 },
    war_bow: { name: 'War Bow', slot: SLOT.MAINHAND, type: 'bow', icon: 'item_bow_hd', minDmg: 10, maxDmg: 28, atkSpd: 1.2, req: { dex: 60 }, size: [2, 4], price: 450 },
    war_hammer: { name: 'War Hammer', slot: SLOT.MAINHAND, type: 'mace', icon: 'item_war_hammer_hd', minDmg: 12, maxDmg: 22, atkSpd: 0.8, req: { str: 45 }, size: [2, 3], price: 350 },
    war_axe: { name: 'War Axe', slot: SLOT.MAINHAND, type: 'axe', icon: 'item_axe_hd', minDmg: 14, maxDmg: 26, atkSpd: 0.9, req: { str: 50 }, size: [2, 3], price: 380 },
    war_staff: { name: 'War Staff', slot: SLOT.MAINHAND, type: 'staff', icon: 'item_war_staff', minDmg: 15, maxDmg: 30, atkSpd: 0.7, req: { str: 30, int: 30 }, size: [2, 4], price: 420 },
    javelin: { name: 'Javelin', slot: SLOT.MAINHAND, type: 'javelin', icon: 'item_javelin', minDmg: 6, maxDmg: 14, atkSpd: 1.3, req: { dex: 30 }, size: [1, 3], price: 80 },

    // === ARMOR ===
    armor_leather: { name: 'Leather Armor', slot: SLOT.CHEST, type: 'armor', icon: 'item_armor_leather', armor: 10, req: { str: 5 }, size: [2, 3], price: 60 },
    armor_plate: { name: 'Plate Mail', slot: SLOT.CHEST, type: 'armor', icon: 'item_armor_plate', armor: 45, req: { str: 40 }, size: [2, 3], price: 300 },
    plate_mail: { name: 'Heavy Plate', slot: SLOT.CHEST, type: 'armor', icon: 'item_plate_mail_hd', armor: 60, req: { str: 60 }, size: [2, 3], price: 500 },
    chain_mail: { name: 'Chain Mail', slot: SLOT.CHEST, type: 'armor', icon: 'item_chain_mail', armor: 25, req: { str: 25 }, size: [2, 3], price: 150 },
    chest: { name: 'Breastplate', slot: SLOT.CHEST, type: 'armor', icon: 'item_chest_hd', armor: 18, size: [2, 2], price: 100 },
    robe: { name: 'Robe', slot: SLOT.CHEST, type: 'armor', icon: 'item_armor_robe', armor: 5, size: [2, 3], price: 40 },

    helm_cap: { name: 'Cap', slot: SLOT.HEAD, type: 'helm', icon: 'item_helm', armor: 3, size: [2, 2], price: 20 },
    helm_great: { name: 'Great Helm', slot: SLOT.HEAD, type: 'helm', icon: 'item_great_helm_hd', armor: 15, req: { str: 25 }, size: [2, 2], price: 120 },
    great_helm: { name: 'Great Helm', slot: SLOT.HEAD, type: 'helm', icon: 'item_great_helm_hd', armor: 15, req: { str: 25 }, size: [2, 2], price: 120 },
    circlet: { name: 'Circlet', slot: SLOT.HEAD, type: 'helm', icon: 'item_circlet', armor: 5, size: [2, 1], price: 150 },
    crown: { name: 'Crown', slot: SLOT.HEAD, type: 'helm', icon: 'item_crown', armor: 12, size: [2, 2], price: 200 },

    shield_buckler: { name: 'Buckler', slot: SLOT.OFFHAND, type: 'shield', icon: 'item_shield', armor: 5, block: 15, size: [2, 2], price: 25 },
    buckler: { name: 'Buckler', slot: SLOT.OFFHAND, type: 'shield', icon: 'item_shield', armor: 5, block: 15, size: [2, 2], price: 25 },
    shield_kite: { name: 'Kite Shield', slot: SLOT.OFFHAND, type: 'shield', icon: 'item_shield_kite', armor: 20, block: 25, req: { str: 30 }, size: [2, 2], price: 150 },
    shield_royal: { name: 'Royal Shield', slot: SLOT.OFFHAND, type: 'shield', icon: 'item_shield_hd', armor: 40, block: 40, req: { str: 60 }, size: [2, 3], price: 500 },
    tower_shield: { name: 'Tower Shield', slot: SLOT.OFFHAND, type: 'shield', icon: 'item_shield_hd', armor: 35, block: 35, req: { str: 55 }, size: [2, 3], price: 400 },
    shield: { name: 'Shield', slot: SLOT.OFFHAND, type: 'shield', icon: 'item_shield', armor: 10, block: 20, size: [2, 2], price: 80 },
    off_hand: { name: 'Off-hand', slot: SLOT.OFFHAND, type: 'off_hand', icon: 'item_orb', armor: 2, size: [1, 1], price: 100 },

    boots_leather: { name: 'Leather Boots', slot: SLOT.BOOTS, type: 'boots', icon: 'item_boots', armor: 2, size: [2, 2], price: 15 },
    war_boots: { name: 'War Boots', slot: SLOT.BOOTS, type: 'boots', icon: 'item_boots_war', armor: 8, req: { str: 20 }, size: [2, 2], price: 120 },
    boots: { name: 'Boots', slot: SLOT.BOOTS, type: 'boots', icon: 'item_boots', armor: 4, size: [2, 2], price: 50 },

    gauntlets: { name: 'Gauntlets', slot: SLOT.GLOVES, type: 'gloves', icon: 'item_gauntlets', armor: 10, req: { str: 30 }, size: [2, 2], price: 150 },
    gloves_leather: { name: 'Leather Gloves', slot: SLOT.GLOVES, type: 'gloves', icon: 'item_gloves', armor: 2, size: [2, 2], price: 15 },
    leather_gloves: { name: 'Leather Gloves', slot: SLOT.GLOVES, type: 'gloves', icon: 'item_gloves', armor: 2, size: [2, 2], price: 15 },
    belt_leather: { name: 'Leather Belt', slot: SLOT.BELT, type: 'belt', icon: 'item_belt', armor: 2, size: [2, 1], price: 15 },
    leather_belt: { name: 'Leather Belt', slot: SLOT.BELT, type: 'belt', icon: 'item_belt', armor: 2, size: [2, 1], price: 15 },
    grand_totem: { name: 'Grand Totem', slot: SLOT.OFFHAND, type: 'staff', icon: 'item_grand_totem', minDmg: 5, maxDmg: 10, size: [2, 3], price: 300 },

    // === ACCESSORIES ===
    ring: { name: 'Ring', slot: SLOT.RING, type: 'ring', icon: 'item_ring', size: [1, 1], price: 100 },
    amulet: { name: 'Amulet', slot: SLOT.AMULET, type: 'amulet', icon: 'item_amulet', size: [1, 1], price: 150 },

    // === CONSUMABLES ===
    potion_hp_minor: { name: 'Minor Healing Potion', slot: 'none', type: 'potion', icon: 'item_potion_hp', size: [1, 1], price: 10 },
    potion_mp_minor: { name: 'Minor Mana Potion', slot: 'none', type: 'potion', icon: 'item_potion_mp', size: [1, 1], price: 10 },
    potion_rejuv: { name: 'Rejuvenation Potion', slot: 'none', type: 'potion', icon: 'item_potion_rejuv', size: [1, 1], price: 50 },

    // === SCROLLS ===
    scroll_identify: { name: 'Scroll of Identification', slot: 'none', type: 'scroll', icon: 'item_scroll', size: [1, 1], price: 100 },
    scroll_town_portal: { name: 'Scroll of Town Portal', slot: 'none', type: 'scroll', icon: 'item_scroll_tp', size: [1, 1], price: 10 },

    // === TOMES ===
    tome_tp: { name: 'Tome of Town Portal', slot: 'none', type: 'tome', icon: 'item_tome_tp', size: [1, 2], price: 150, maxCharges: 20 },
    tome_identify: { name: 'Tome of Identification', slot: 'none', type: 'tome', icon: 'item_tome_id', size: [1, 2], price: 150, maxCharges: 20 },

    // === GEMS ===
    chipped_ruby: { name: 'Chipped Ruby', slot: 'none', type: 'gem', icon: 'item_ruby', size: [1, 1], price: 25, socketEffect: { weapon: { stat: 'flatFireDmg', value: 4 }, armor: { stat: 'flatHP', value: 10 }, shield: { stat: 'fireRes', value: 10 } } },
    chipped_sapphire: { name: 'Chipped Sapphire', slot: 'none', type: 'gem', icon: 'item_sapphire', size: [1, 1], price: 25, socketEffect: { weapon: { stat: 'flatColdDmg', value: 4 }, armor: { stat: 'flatMP', value: 10 }, shield: { stat: 'coldRes', value: 10 } } },
    chipped_topaz: { name: 'Chipped Topaz', slot: 'none', type: 'gem', icon: 'item_topaz', size: [1, 1], price: 25, socketEffect: { weapon: { stat: 'flatLightDmg', value: 12 }, armor: { stat: 'magicFind', value: 10 }, shield: { stat: 'lightRes', value: 10 } } },
    chipped_emerald: { name: 'Chipped Emerald', slot: 'none', type: 'gem', icon: 'item_emerald', size: [1, 1], price: 25, socketEffect: { weapon: { stat: 'poisDmgSec', value: 10 }, armor: { stat: 'flatDEX', value: 3 }, shield: { stat: 'poisRes', value: 10 } } },
    chipped_diamond: { name: 'Chipped Diamond', slot: 'none', type: 'gem', icon: 'item_diamond', size: [1, 1], price: 25, socketEffect: { weapon: { stat: 'pctDmgUndead', value: 25 }, armor: { stat: 'flatSTR', value: 3 }, shield: { stat: 'allRes', value: 6 } } },
    chipped_amethyst: { name: 'Chipped Amethyst', slot: 'none', type: 'gem', icon: 'item_amethyst', size: [1, 1], price: 25, socketEffect: { weapon: { stat: 'flatSTR', value: 3 }, armor: { stat: 'flatArmor', value: 8 }, shield: { stat: 'flatArmor', value: 8 } } },
    chipped_skull: { name: 'Chipped Skull', slot: 'none', type: 'gem', icon: 'item_skull', size: [1, 1], price: 25, socketEffect: { weapon: { stat: 'lifeStealPct', value: 2 }, armor: { stat: 'lifeRegenPerSec', value: 2 }, shield: { stat: 'thorns', value: 4 } } },

    // High Tier Gems
    perfect_ruby: { name: 'Perfect Ruby', slot: 'none', type: 'gem', icon: 'item_ruby_perfect', size: [1, 1], price: 200, socketEffect: { weapon: { stat: 'flatFireDmg', value: 20 }, armor: { stat: 'flatHP', value: 60 }, shield: { stat: 'fireRes', value: 40 } } },
    perfect_topaz: { name: 'Perfect Topaz', slot: 'none', type: 'gem', icon: 'item_topaz_perfect', size: [1, 1], price: 200, socketEffect: { weapon: { stat: 'flatLightDmg', value: 50 }, armor: { stat: 'magicFind', value: 25 }, shield: { stat: 'lightRes', value: 40 } } },
    perfect_emerald: { name: 'Perfect Emerald', slot: 'none', type: 'gem', icon: 'item_emerald_perfect', size: [1, 1], price: 200, socketEffect: { weapon: { stat: 'poisDmgSec', value: 100 }, armor: { stat: 'flatDEX', value: 10 }, shield: { stat: 'poisRes', value: 40 } } },

    // Runes
    rune_el: { name: 'El Rune', slot: 'none', type: 'gem', icon: 'item_rune_el', size: [1, 1], price: 50, socketEffect: { weapon: { stat: 'flatMinDmg', value: 1, flatMaxDmg: 3 }, armor: { stat: 'flatHP', value: 15 }, shield: { stat: 'allRes', value: 5 } } },
    rune_tir: { name: 'Tir Rune', slot: 'none', type: 'gem', icon: 'item_rune_tir', size: [1, 1], price: 100, socketEffect: { weapon: { stat: 'manaOnKill', value: 2 }, armor: { stat: 'manaOnKill', value: 2 }, shield: { stat: 'manaOnKill', value: 2 } } },
    rune_ral: { name: 'Ral Rune', slot: 'none', type: 'gem', icon: 'item_rune_ral', size: [1, 1], price: 150, socketEffect: { weapon: { stat: 'flatFireDmg', value: 15 }, armor: { stat: 'fireRes', value: 30 }, shield: { stat: 'fireRes', value: 35 } } },
    rune_ort: { name: 'Ort Rune', slot: 'none', type: 'gem', icon: 'item_rune_ort', size: [1, 1], price: 200, socketEffect: { weapon: { stat: 'flatLightDmg', value: 40 }, armor: { stat: 'lightRes', value: 30 }, shield: { stat: 'lightRes', value: 35 } } },
    rune_thul: { name: 'Thul Rune', slot: 'none', type: 'gem', icon: 'item_rune_thul', size: [1, 1], price: 250, socketEffect: { weapon: { stat: 'flatColdDmg', value: 10 }, armor: { stat: 'coldRes', value: 30 }, shield: { stat: 'coldRes', value: 35 } } },
    rune_amn: { name: 'Amn Rune', slot: 'none', type: 'gem', icon: 'item_rune_amn', size: [1, 1], price: 300, socketEffect: { weapon: { stat: 'lifeStealPct', value: 7 }, armor: { stat: 'thorns', value: 14 }, shield: { stat: 'thorns', value: 14 } } },
    rune_sol: { name: 'Sol Rune', slot: 'none', type: 'gem', icon: 'item_rune_sol', size: [1, 1], price: 350, socketEffect: { weapon: { stat: 'flatMinDmg', value: 9, flatMaxDmg: 9 }, armor: { stat: 'flatHP', value: 60 }, shield: { stat: 'flatHP', value: 50 } } },
    rune_shael: { name: 'Shael Rune', slot: 'none', type: 'gem', icon: 'item_rune_shael', size: [1, 1], price: 400, socketEffect: { weapon: { stat: 'pctIAS', value: 20 }, armor: { stat: 'pctMoveSpeed', value: 10 }, shield: { stat: 'pctMoveSpeed', value: 10 } } },
    rune_dol: { name: 'Dol Rune', slot: 'none', type: 'gem', icon: 'item_rune_dol', size: [1, 1], price: 450, socketEffect: { weapon: { stat: 'fearOnHit', value: 25 }, armor: { stat: 'lifeRegenPerSec', value: 7 }, shield: { stat: 'lifeRegenPerSec', value: 7 } } },
    rune_io: { name: 'Io Rune', slot: 'none', type: 'gem', icon: 'item_rune_io', size: [1, 1], price: 500, socketEffect: { weapon: { stat: 'flatVIT', value: 10 }, armor: { stat: 'flatVIT', value: 10 }, shield: { stat: 'flatVIT', value: 10 } } },
    rune_lum: { name: 'Lum Rune', slot: 'none', type: 'gem', icon: 'item_rune_lum', size: [1, 1], price: 550, socketEffect: { weapon: { stat: 'flatMP', value: 40 }, armor: { stat: 'flatMP', value: 60 }, shield: { stat: 'flatMP', value: 50 } } },
    rune_lo: { name: 'Lo Rune', slot: 'none', type: 'gem', icon: 'item_rune_lo', size: [1, 1], price: 600, socketEffect: { weapon: { stat: 'critChance', value: 20 }, armor: { stat: 'maxLightRes', value: 5 }, shield: { stat: 'maxLightRes', value: 5 } } },
    rune_sur: { name: 'Sur Rune', slot: 'none', type: 'gem', icon: 'item_rune_sur', size: [1, 1], price: 700, socketEffect: { weapon: { stat: 'monsterBlind', value: 20 }, armor: { stat: 'pctMP', value: 5 }, shield: { stat: 'flatMP', value: 50 } } },
    rune_ber: { name: 'Ber Rune', slot: 'none', type: 'gem', icon: 'item_rune_ber', size: [1, 1], price: 800, socketEffect: { weapon: { stat: 'crushingBlow', value: 20 }, armor: { stat: 'pctDmgReduce', value: 8 }, shield: { stat: 'pctDmgReduce', value: 8 } } },
    rune_jah: { name: 'Jah Rune', slot: 'none', type: 'gem', icon: 'item_rune_zod', size: [1, 1], price: 900, socketEffect: { weapon: { stat: 'ignoreDefense', value: 1 }, armor: { stat: 'pctHP', value: 5 }, shield: { stat: 'flatHP', value: 50 } } },
    rune_cham: { name: 'Cham Rune', slot: 'none', type: 'gem', icon: 'item_rune_zod', size: [1, 1], price: 1000, socketEffect: { weapon: { stat: 'monsterFreeze', value: 3 }, armor: { stat: 'cannotBeFrozen', value: 1 }, shield: { stat: 'cannotBeFrozen', value: 1 } } },
    rune_zod: { name: 'Zod Rune', slot: 'none', type: 'gem', icon: 'item_rune_zod', size: [1, 1], price: 1000, socketEffect: { weapon: { stat: 'indestructible', value: 1 }, armor: { stat: 'indestructible', value: 1 }, shield: { stat: 'indestructible', value: 1 } } },

    // === QUEST ITEMS ===
    wirts_leg: { name: "Niruko's Leg", slot: 'weapon', type: 'club', icon: 'item_mace_hd', size: [1, 3], price: 1, minDmg: 1, maxDmg: 8, atkSpd: 1.2, flavor: '"Cain says there was something about a portal..."', unidentified: false },
    cow_portal: { name: 'Cow Portal Key', slot: 'none', type: 'material', icon: 'item_scroll_tp', size: [1, 1], price: 0, flavor: '"The seal of the Cow King."', identified: true },

    // === MATERIALS ===
    horadric_fragment: { name: "Horadric Fragment", slot: 'none', type: 'material', icon: 'item_ruby', size: [1, 1], price: 200, flavor: '"A shard of a lost artifact, hums with ancient power."' },
    mephisto_soulstone: { name: "Mephisto's Soulstone", slot: 'none', type: 'material', icon: 'item_mephisto_soulstone', size: [1, 1], price: 0, flavor: '"The essence of the Lord of Hatred, waiting to be shattered."', identified: true },
    book_of_skill: { name: "Book of Skill", slot: 'none', type: 'potion', icon: 'item_book_skill_hd', size: [1, 1], price: 0, flavor: '"Read this to gain a permanent skill point."', identified: true },
    staff_of_kings: { name: "Staff of Kings", slot: 'none', type: 'material', icon: 'item_staff_kings_hd', size: [1, 3], price: 0, flavor: '"An ancient mahogany staff, part of the Horadric legend."', identified: true },
    viper_amulet: { name: "Viper Amulet", slot: 'none', type: 'material', icon: 'item_amulet_viper_hd', size: [1, 1], price: 0, flavor: '"The Amulet of the Viper, glowing with forbidden magic."', identified: true },
    horadric_staff: { name: "Horadric Staff", slot: SLOT.MAINHAND, type: 'staff', icon: 'item_staff_kings_hd', minDmg: 12, maxDmg: 30, atkSpd: 0.7, req: { str: 25 }, size: [1, 4], mods: [{ stat: 'allRes', value: 10 }, { stat: 'flatMP', value: 50 }], flavor: '"The powerful Horadric Staff, restored at last."', identified: true },
    hellforge_hammer: { name: "Hellforge Hammer", slot: SLOT.MAINHAND, type: 'mace', icon: 'item_war_hammer_hd', minDmg: 8, maxDmg: 20, atkSpd: 0.8, req: { str: 20 }, size: [1, 3], flavor: '"Only this hammer can shatter a Prime Evil\'s soulstone."', identified: true },
    hellfire_torch: { name: "Hellfire Torch", slot: 'charm', type: 'charm', icon: 'item_charm_grand', size: [1, 3], rarity: 'unique', identified: true, flavor: '"The ultimate prize for those who conquered Hell\'s fury."' },

    // === CHARMS ===
    charm: { name: 'Charm', slot: 'none', type: 'charm', icon: 'item_charm_small', size: [1, 1], price: 50 },
    small_charm: { name: 'Small Charm', slot: 'none', type: 'charm', icon: 'item_charm_small', size: [1, 1], price: 100 },
    large_charm: { name: 'Large Charm', slot: 'none', type: 'charm', icon: 'item_charm_large', size: [1, 2], price: 200 },
    grand_charm: { name: 'Grand Charm', slot: 'none', type: 'charm', icon: 'item_charm_grand', size: [1, 3], price: 300 },
};

export const SOCKET_MAX = {
    axe: 4,
    sword: 4,
    mace: 4,
    staff: 4,
    wand: 2,
    bow: 4,
    dagger: 2,
    club: 3,
    armor: 4,
    helm: 3,
    shield: 3
};

export const items = ITEM_BASES;
