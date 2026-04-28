/**
 * ASTRAL CONSTELLATION — Global passive tree for all classes.
 * Includes "Celestial Procs" and "Elder Keynodes" (Game Changers).
 */
export const ASTRAL_CONSTELLATION = {
    nodes: [
        // --- TIER 1: The Crossroads ---
        { id: 0, name: 'Star of Might', pos: { x: 0, y: 0 }, max: 1, stats: { flatSTR: 15 } },
        { id: 1, name: 'Star of Wisdom', pos: { x: 30, y: 30 }, max: 1, stats: { flatINT: 15 } },
        { id: 2, name: 'Star of Swiftness', pos: { x: -30, y: 30 }, max: 1, stats: { flatDEX: 15 } },

        // --- TIER 2: Constellations ---
        // THE BULL (Melee/Tank)
        { id: 10, name: 'Bulls Horn', pos: { x: -60, y: -60 }, req: [0], max: 5, stats: { pctPhysDmg: 5, pctArmor: 5 } },
        { id: 11, name: 'Bulls Heart', pos: { x: -90, y: -90 }, req: [10], max: 5, stats: { pctHP: 5, lifeRegenPerSec: 3 } },
        { id: 12, name: 'Trample (Celestial Proc)', pos: { x: -120, y: -120 }, req: [11], max: 1, 
            proc: { id: 'proc_trample', trigger: 'onHit', chance: 15, cd: 2.0, effect: 'aoe_physical_stun' } 
        },

        // THE RAVEN (Caster/Elemental)
        { id: 20, name: 'Ravens Wing', pos: { x: 60, y: -60 }, req: [1], max: 5, stats: { pctElemDmg: 5, pctFCR: 5 } },
        { id: 21, name: 'Ravens Eye', pos: { x: 90, y: -90 }, req: [20], max: 5, stats: { critChance: 2, manaRegenPerSec: 2 } },
        { id: 22, name: 'Skyfire (Celestial Proc)', pos: { x: 120, y: -120 }, req: [21], max: 1,
            proc: { id: 'proc_skyfire', trigger: 'onHit', chance: 12, cd: 1.2, effect: 'lightning_strike' }
        },

        // THE SNAKE (Poison/Shadow)
        { id: 30, name: 'Snakes Fangs', pos: { x: 0, y: 70 }, req: [2], max: 5, stats: { pctPoisonDmg: 8, pctShadowDmg: 8 } },
        { id: 31, name: 'Acid Spittle (Celestial Proc)', pos: { x: 0, y: 110 }, req: [30], max: 1,
            proc: { id: 'proc_acid', trigger: 'onAttack', chance: 20, cd: 1.0, effect: 'poison_bolt' }
        },
        { id: 32, name: 'Viper\'s Coil', pos: { x: 40, y: 140 }, req: [31], max: 3, stats: { pctDmgVsCC: 15, pctMoveSpeed: 5 } },

        // THE PHOENIX (Fire/Recovery)
        { id: 40, name: 'Phoenix Wing', pos: { x: -60, y: 60 }, req: [2], max: 5, stats: { pctFireDmg: 8, flatHP: 40 } },
        { id: 41, name: 'Phoenix Heart', pos: { x: -90, y: 90 }, req: [40], max: 5, stats: { lifeRegenPerSec: 8, pctFireRes: 15 } },
        { id: 42, name: 'Rebirth (Celestial Proc)', pos: { x: -120, y: 120 }, req: [41], max: 1,
            proc: { id: 'proc_rebirth', trigger: 'onLowHP', healthThreshold: 25, cd: 120.0, effect: 'heal_and_burst' }
        },

        // --- TIER 2: Constellations ---
        // THE CHIMERA (Minions & Summons)
        { id: 50, name: 'Chimera\'s Fang', pos: { x: 120, y: 60 }, req: [1], max: 5, stats: { minionDmgPct: 10, minionIasPct: 5 } },
        { id: 51, name: 'Chimera\'s Hide', pos: { x: 150, y: 90 }, req: [50], max: 5, stats: { minionHpPct: 15, minionArmorPct: 10 } },
        { id: 52, name: 'Chimera\'s Roar (Celestial Proc)', pos: { x: 180, y: 120 }, req: [51], max: 1,
            proc: { id: 'proc_minion_enrage', trigger: 'onMinionHit', chance: 10, cd: 10.0, effect: 'minion_lust' }
        },
        { id: 53, name: 'Chimera\'s Bond', pos: { x: 210, y: 90 }, req: [51], max: 3, stats: { minionLifestealShare: 10, pctHP: 5 } },

        // --- TIER 3: ELDER KEYNODES (Game Changers) ---
        { 
            id: 100, name: 'ELDER: Blood Magic', pos: { x: -150, y: 0 }, req: [11], max: 1,
            special: 'Your skills cost Life instead of Mana. Mana pool is added to your Max Life. Gain 5% Life Steal.',
            stats: { lifeCostEnabled: 1, manaToLifeConv: 1.0, lifeStealPct: 5 }
        },
        {
            id: 101, name: 'ELDER: Glass Cannon', pos: { x: 150, y: 0 }, req: [21], max: 1,
            special: '-50% Total Health, but +60% Total Damage dealt.',
            stats: { totalHpMult: -0.5, totalDmgMult: 0.6 }
        },
        {
            id: 102, name: 'ELDER: Astral Barrier', pos: { x: 0, y: -150 }, req: [21], max: 1,
            special: 'Armor is reduced to 0. You gain Energy Shield equal to 300% of your Armor.',
            stats: { armorToEsConv: 3.0, armorMult: -1.0 }
        },
        {
            id: 103, name: 'ELDER: The Overlord', pos: { x: 0, y: 150 }, req: [30, 40], max: 1,
            special: 'You can have +5 Max Minions. Minions inherit 50% of your Resistances.',
            stats: { maxMinions: 5, minionResistInherit: 50 }
        },
        {
            id: 104, name: 'ELDER: Celestial Harmony', pos: { x: 120, y: 120 }, req: [41], max: 1,
            special: 'Each unique active aura increases your total damage by 10%.',
            stats: { dmgPerAura: 10 }
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

        // --- NEW: Talent Tree Symbiosis ---
        if (pts > 0 && node.talentSynergy) {
            const treePts = player.talents.pointsInTree(node.talentSynergy.treeId);
            if (treePts >= (node.talentSynergy.threshold || 10)) {
                for (const [stat, val] of Object.entries(node.talentSynergy.bonus)) {
                    s[stat] = (s[stat] || 0) + val;
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
