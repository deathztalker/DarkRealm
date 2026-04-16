/**
 * Loot System — D2-style item generation with affixes, skill bonuses, sockets
 */
import { ITEM_BASES, SOCKET_MAX } from '../data/items.js';
import { AFFIXES, getAffixPool, rollAffix } from '../data/affixes.js';
import { bus } from '../engine/EventBus.js';

export const RARITY = { NORMAL: 'normal', MAGIC: 'magic', RARE: 'rare', SET: 'set', UNIQUE: 'unique' };

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
    }
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
