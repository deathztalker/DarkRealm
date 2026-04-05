/**
 * Loot System — D2-style item generation with affixes, skill bonuses, sockets
 */
import { ITEM_BASES, SOCKET_MAX } from '../data/items.js';
import { AFFIXES, getAffixPool, rollAffix } from '../data/affixes.js';
import { bus } from '../engine/EventBus.js';

export const RARITY = { NORMAL: 'normal', MAGIC: 'magic', RARE: 'rare', SET: 'set', UNIQUE: 'unique' };

const SETS = {
    sigon: {
        name: "Sigon's Complete Steel",
        bonuses: {
            2: [{ stat: 'lifeStealPct', value: 10 }],
            3: [{ stat: 'magicFind', value: 50 }, { stat: 'flatArmor', value: 100 }]
        }
    }
};

const SET_ITEMS = [
    {
        id: 'sigon_visor', name: "Sigon's Visor", base: 'great_helm', rarity: RARITY.SET,
        icon: 'item_great_helm', dropLvl: 12, setId: 'sigon', setName: "Sigon's Complete Steel",
        mods: [{ stat: 'flatMP', value: 30 }, { stat: 'flatArmor', value: 25 }]
    },
    {
        id: 'sigon_shelter', name: "Sigon's Shelter", base: 'plate_mail', rarity: RARITY.SET,
        icon: 'item_plate_mail', dropLvl: 12, setId: 'sigon', setName: "Sigon's Complete Steel",
        mods: [{ stat: 'lightRes', value: 30 }, { stat: 'flatArmor', value: 50 }]
    },
    {
        id: 'sigon_gage', name: "Sigon's Gage", base: 'gauntlets', rarity: RARITY.SET,
        icon: 'item_gauntlets', dropLvl: 12, setId: 'sigon', setName: "Sigon's Complete Steel",
        mods: [{ stat: 'flatSTR', value: 10 }, { stat: 'pctIAS', value: 30 }]
    }
];

// Unique item definitions (hand-crafted, fixed mods)
const UNIQUES = [
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
        id: 'enigma_robe', name: 'Enigma Robe', base: 'robe', rarity: RARITY.UNIQUE,
        icon: 'item_robe', dropLvl: 65,
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
        flavor: '"Pain is a teacher. This is its lesson."'
    },
    {
        id: 'doombringer', name: 'Doombringer', base: 'long_sword', rarity: RARITY.UNIQUE,
        icon: 'item_long_sword', dropLvl: 50,
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
            return b.type !== 'gem' && b.type !== 'potion' && b.type !== 'scroll';
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
        if (r < 0.005 + boost * 0.6 + mfBoost * 0.003) targetRarity = RARITY.UNIQUE;
        else if (r < 0.015 + boost * 0.5 + mfBoost * 0.008) targetRarity = RARITY.SET;
        else if (r < 0.10 + boost + mfBoost * 0.05) targetRarity = RARITY.RARE;
        else if (r < 0.45 + boost + mfBoost * 0.1) targetRarity = RARITY.MAGIC;

        return targetRarity;
    }

    _buildItem(baseId, base, rarity, ilvl) {
        // Jewelry and Charms should always be at least Magic
        if ((base.type === 'ring' || base.type === 'amulet' || base.type === 'charm') && rarity === RARITY.NORMAL) {
            rarity = RARITY.MAGIC;
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

        return item;
    }

    _buildUnique(template) {
        const base = ITEM_BASES[template.base];
        return {
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
            mods: template.mods.map(m => ({ ...m, name: m.stat })),
            sockets: 0, socketed: [], insertedRunes: [],
            identified: false,
            flavor: template.flavor,
        };
    }

    _buildSetItem(template) {
        const base = ITEM_BASES[template.base];
        return {
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
            mods: template.mods.map(m => ({ ...m, name: m.stat })),
            sockets: 0, socketed: [], insertedRunes: [],
            identified: false
        };
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
        const prefix = item.mods.find(m => m.type === 'prefix');
        const suffix = item.mods.find(m => m.type === 'suffix');
        const base = ITEM_BASES[item.baseId]?.name || item.name;
        if (isRare) {
            const rarePrefixes = ['Shadow', 'Cruel', 'Bitter', 'Dark', 'Grim', 'Foul', 'Dire', 'Blood', 'Bone', 'Viper', 'Doom'];
            const rareSuffixes = ['Bane', 'Grip', 'Ruin', 'Dread', 'Wrath', 'Scourge', 'Malice', 'Fang', 'Heart', 'Song', 'Wedge'];
            return `${rarePrefixes[Math.floor(Math.random() * rarePrefixes.length)]} ${rareSuffixes[Math.floor(Math.random() * rareSuffixes.length)]}`;
        }
        let name = base;
        if (prefix) name = `${prefix.name} ${name}`;
        if (suffix) name = `${name} ${suffix.name}`;
        return name;
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
}

// Singleton
export const loot = new LootSystem();
