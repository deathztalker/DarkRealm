/**
 * ASTRAL CONSTELLATION — Global passive tree for all classes.
 * Includes "Celestial Procs" and "Elder Keynodes" (Game Changers).
 */
export const ASTRAL_CONSTELLATION = {
    nodes: [
        // --- TIER 1: The Crossroads ---
        { id: 0, name: 'Star of Might', pos: { x: 0, y: 0 }, max: 1, stats: { flatSTR: 10 } },
        { id: 1, name: 'Star of Wisdom', pos: { x: 20, y: 20 }, max: 1, stats: { flatINT: 10 } },
        { id: 2, name: 'Star of Swiftness', pos: { x: -20, y: 20 }, max: 1, stats: { flatDEX: 10 } },

        // --- TIER 2: Constellations ---
        // THE BULL (Melee/Tank)
        { id: 10, name: 'Bulls Horn', pos: { x: -40, y: -40 }, req: [0], max: 3, stats: { pctPhysDmg: 5, pctArmor: 5 } },
        { id: 11, name: 'Bulls Heart', pos: { x: -60, y: -60 }, req: [10], max: 3, stats: { pctHP: 5, lifeRegenPerSec: 2 } },
        { id: 12, name: 'Trample (Celestial Proc)', pos: { x: -80, y: -80 }, req: [11], max: 1, 
            proc: { id: 'proc_trample', trigger: 'onHit', chance: 15, cd: 2.0, effect: 'aoe_physical_stun' } 
        },

        // THE RAVEN (Caster/Elemental)
        { id: 20, name: 'Ravens Wing', pos: { x: 40, y: -40 }, req: [1], max: 3, stats: { pctElemDmg: 5, pctFCR: 5 } },
        { id: 21, name: 'Ravens Eye', pos: { x: 60, y: -60 }, req: [20], max: 3, stats: { critChance: 2, manaRegenPerSec: 1 } },
        { id: 22, name: 'Skyfire (Celestial Proc)', pos: { x: 80, y: -80 }, req: [21], max: 1,
            proc: { id: 'proc_skyfire', trigger: 'onHit', chance: 10, cd: 1.5, effect: 'lightning_strike' }
        },

        // THE SNAKE (Poison/Shadow)
        { id: 30, name: 'Snakes Fangs', pos: { x: 0, y: 50 }, req: [2], max: 3, stats: { pctPoisonDmg: 8, pctShadowDmg: 8 } },
        { id: 31, name: 'Acid Spittle (Celestial Proc)', pos: { x: 0, y: 80 }, req: [30], max: 1,
            proc: { id: 'proc_acid', trigger: 'onAttack', chance: 20, cd: 1.0, effect: 'poison_bolt' }
        },

        // THE PHOENIX (Fire/Recovery)
        { id: 40, name: 'Phoenix Wing', pos: { x: -40, y: 40 }, req: [2], max: 3, stats: { pctFireDmg: 8, flatHP: 25 } },
        { id: 41, name: 'Phoenix Heart', pos: { x: -60, y: 60 }, req: [40], max: 3, stats: { lifeRegenPerSec: 5, pctFireRes: 10 } },
        { id: 42, name: 'Rebirth (Celestial Proc)', pos: { x: -80, y: 80 }, req: [41], max: 1,
            proc: { id: 'proc_rebirth', trigger: 'onLowHP', healthThreshold: 20, cd: 180.0, effect: 'heal_and_burst' }
        },

        // --- TIER 3: ELDER KEYNODES (Game Changers) ---
        { 
            id: 100, name: 'ELDER: Blood Magic', pos: { x: -120, y: 0 }, req: [11], max: 1,
            special: 'Your skills cost Life instead of Mana. Mana pool is added to your Max Life.',
            stats: { lifeCostEnabled: 1, manaToLifeConv: 1.0 }
        },
        {
            id: 101, name: 'ELDER: Glass Cannon', pos: { x: 120, y: 0 }, req: [21], max: 1,
            special: '-50% Total Health, but +50% Total Damage dealt.',
            stats: { totalHpMult: -0.5, totalDmgMult: 0.5 }
        },
        {
            id: 102, name: 'ELDER: Astral Barrier', pos: { x: 0, y: -120 }, req: [21], max: 1,
            special: 'Armor is reduced to 0. You gain Energy Shield equal to 200% of your Armor.',
            stats: { armorToEsConv: 2.0, armorMult: -1.0 }
        },
        {
            id: 103, name: 'ELDER: The Alchemist', pos: { x: 0, y: 120 }, req: [30, 40], max: 1,
            special: 'Potions also apply to your minions at 100% effectiveness.',
            stats: { potionMinionShare: 1.0 }
        }
    ]
};

/**
 * Utility to calculate total stats from the Astral Tree.
 */
export function getAstralStats(player) {
    const s = {};
    if (!player.astralTree) return s;

    ASTRAL_CONSTELLATION.nodes.forEach(node => {
        const pts = player.astralTree[node.id] || 0;
        if (pts > 0 && node.stats) {
            for (const [stat, val] of Object.entries(node.stats)) {
                if (stat === 'pctElemDmg') {
                    ['pctFireDmg', 'pctColdDmg', 'pctLightDmg'].forEach(k => s[k] = (s[k] || 0) + (val * pts));
                } else {
                    s[stat] = (s[stat] || 0) + (val * pts);
                }
            }
        }
    });

    return s;
}

/**
 * Get active Procs and Specials from the Astral Tree.
 */
export function getAstralProcs(player) {
    const procs = [];
    if (!player.astralTree) return procs;

    ASTRAL_CONSTELLATION.nodes.forEach(node => {
        const pts = player.astralTree[node.id] || 0;
        if (pts > 0) {
            if (node.proc) procs.push(node.proc);
            if (node.special) procs.push({ id: `special_${node.id}`, text: node.special });
        }
    });

    return procs;
}
