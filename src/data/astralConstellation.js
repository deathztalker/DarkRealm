/**
 * ASTRAL CONSTELLATION — Global passive tree for all classes.
 * Includes "Celestial Procs" that can be linked to skills.
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
 * Get active Procs from the Astral Tree.
 */
export function getAstralProcs(player) {
    const procs = [];
    if (!player.astralTree) return procs;

    ASTRAL_CONSTELLATION.nodes.forEach(node => {
        const pts = player.astralTree[node.id] || 0;
        if (pts > 0 && node.proc) {
            procs.push(node.proc);
        }
    });

    return procs;
}
