/**
 * PALADIN — Expanded endgame trees
 * Builds: 1. "Hammerdin" — Holy/Combat Blessed Hammer spam  2. "Zealot" — Fanaticism+Zeal melee  3. "Aura Support" — Full aura party buffer
 */
export const PALADIN_CLASS = {
    id: 'paladin', name: 'Paladin', icon: '✨',
    desc: 'Sacred warrior wielding divine power. Auras empower allies, holy magic smites the unholy, and zealous strikes cut through armor like paper.',
    stats: { str: 7, dex: 3, vit: 6, int: 4 },
    statBars: { str: 75, dex: 30, vit: 70, int: 45 },
    allowedWeapons: ['sword', 'mace', 'axe'],
    allowedOffhand: ['shield'],
    trees: [
        {
            id: 'holy', name: 'Holy', icon: '✝️', nodes: [
                {
                    id: 'holy_light', row: 0, col: 1, type: 'active', icon: '💛', name: 'Holy Light',
                    desc: 'Heal self or ally: (25+slvl×12) HP. Damages undead for same amount.',
                    endgame: 'slvl 20: 265 heal/dmg. Low cost, no CD. Unlimited sustain.',
                    maxPts: 20, mana: 10, cd: 0, group: 'holy', dmgBase: 25, dmgPerLvl: 12
                },
                {
                    id: 'holy_shock', row: 1, col: 0, type: 'active', icon: '⚡', name: 'Holy Shock',
                    desc: 'Passive aura + active: adds (8+slvl×5) holy damage to attacks. Active burst: (12+slvl×7) AoE holy.',
                    endgame: 'slvl 20: +108 holy/hit passive + 152 AoE active. Dual-use skill.',
                    maxPts: 20, mana: 8, cd: 0, group: 'holy', dmgBase: 12, dmgPerLvl: 7
                },
                {
                    id: 'consecration', row: 1, col: 2, type: 'active', icon: '🌟', name: 'Consecration',
                    desc: 'Bless ground: (6+slvl×4) holy/s to enemies standing on it. Lasts 8+slvl×0.5s.',
                    endgame: 'slvl 20: 86/s for 18s = 1548 total AoE. Zone denial for undead.',
                    maxPts: 20, mana: 14, cd: 0, group: 'holy', dmgBase: 6, dmgPerLvl: 4
                },
                {
                    id: 'holy_mastery', row: 2, col: 0, type: 'passive', icon: '📈', name: 'Holy Mastery',
                    desc: '+6% holy damage and healing per point. At 10pts: holy spells pierce undead immunity.',
                    endgame: 'slvl 20: +120% holy + heal. Undead immunity pierced.',
                    maxPts: 20
                },
                {
                    id: 'cleansing', row: 2, col: 1, type: 'active', icon: '💧', name: 'Cleansing',
                    desc: 'Remove all debuffs from self/ally. Passive: reduces curse duration by (10+slvl×2)%.',
                    endgame: 'slvl 20: instant debuff purge + 50% curse reduction. Anti-Necromancer.',
                    maxPts: 20, mana: 6, cd: 0
                },
                {
                    id: 'divine_shield', row: 3, col: 0, type: 'active', icon: '🛡️', name: 'Divine Shield',
                    desc: 'Immune to ALL damage for (2+slvl×0.15)s. Cannot attack during immunity.',
                    endgame: 'slvl 20: 5s total immunity. Emergency button. Incredibly powerful correctly timed.',
                    maxPts: 20, mana: 12, cd: 60, req: 'holy_light:10'
                },
                {
                    id: 'holy_smite', row: 3, col: 2, type: 'active', icon: '☀️', name: 'Holy Smite',
                    desc: 'Column of light: (35+slvl×16) holy AoE + blinds enemies 2s reducing hit chance by 50%.',
                    endgame: 'slvl 20: 355 AoE + blind. Combine with Consecration for devastating holy zones.',
                    maxPts: 20, mana: 18, cd: 8, group: 'holy', dmgBase: 35, dmgPerLvl: 16, req: 'consecration:5',
                    synergies: [{ from: 'consecration', pctPerPt: 5 }]
                },
                {
                    id: 'judgment', row: 4, col: 1, type: 'active', icon: '⚖️', name: 'Judgment',
                    desc: 'Ultimate: call divine judgment on all enemies in large radius: (50+slvl×22) holy. Undead take ×3.',
                    endgame: 'slvl 20: 490 holy AoE (1470 vs undead). Decimates undead zones. Top-tier holy nuke.',
                    maxPts: 20, mana: 30, cd: 45, group: 'holy', dmgBase: 50, dmgPerLvl: 22, req: 'holy_smite:10',
                    synergies: [{ from: 'holy_mastery', pctPerPt: 4 }]
                },
            ]
        },
        {
            id: 'auras', name: 'Auras', icon: '🌐', nodes: [
                {
                    id: 'might_aura', row: 0, col: 1, type: 'active', icon: '💪', name: 'Might',
                    desc: 'Aura: party gains +(20+slvl×2)% physical damage. Only 1 aura active at a time.',
                    endgame: 'slvl 20: +60% phys dmg for entire party. Default offensive aura.',
                    maxPts: 20, mana: 0, cd: 0
                },
                {
                    id: 'prayer_aura', row: 1, col: 0, type: 'active', icon: '🙏', name: 'Prayer',
                    desc: 'Aura: party regenerates (2+slvl×1) HP/s.',
                    endgame: 'slvl 20: 22 HP/s passive regen for party. Consistent sustain.',
                    maxPts: 20, mana: 0, cd: 0
                },
                {
                    id: 'holy_fire_aura', row: 1, col: 2, type: 'active', icon: '🔥', name: 'Holy Fire',
                    desc: 'Aura: adds (3+slvl×2) fire damage to all party melee hits. Pulses fire AoE every 2s.',
                    endgame: 'slvl 20: +43 fire/hit + periodic AoE. Turns melee party into fire machines.',
                    maxPts: 20, mana: 0, cd: 0, group: 'fire', dmgBase: 3, dmgPerLvl: 2
                },
                {
                    id: 'resist_all', row: 2, col: 0, type: 'active', icon: '🛡️', name: 'Resist All',
                    desc: 'Aura: party gains +(5+slvl×1.5)% all resistances.',
                    endgame: 'slvl 20: +35% all res for party. Party-wide survivability.',
                    maxPts: 20, mana: 0, cd: 0
                },
                {
                    id: 'vigor', row: 2, col: 1, type: 'active', icon: '🏃', name: 'Vigor',
                    desc: 'Aura: party gains +(20+slvl×1.5)% run speed and +(10+slvl×1)% stamina regen.',
                    endgame: 'slvl 20: +50% run speed. Travel aura, invaluable for farming efficiency.',
                    maxPts: 20, mana: 0, cd: 0
                },
                {
                    id: 'fanaticism', row: 3, col: 0, type: 'active', icon: '⚡', name: 'Fanaticism',
                    desc: 'Aura: +(30+slvl×1.5)% attack speed and +(30+slvl×2)% damage for party. THE endgame aura.',
                    endgame: 'slvl 20: +60% IAS + +70% dmg for entire party. Best offensive aura in the game.',
                    maxPts: 20, mana: 0, cd: 0, req: 'might_aura:10'
                },
                {
                    id: 'conviction', row: 3, col: 2, type: 'active', icon: '💥', name: 'Conviction',
                    desc: 'Aura: nearby enemies lose -(30+slvl×2)% defense and -(30+slvl×2)% all resistances.',
                    endgame: 'slvl 20: -70% def and -70% res on all nearby enemies. Breaks immunities with Lower Resist.',
                    maxPts: 20, mana: 0, cd: 0, req: 'resist_all:10'
                },
                {
                    id: 'aura_mastery', row: 4, col: 1, type: 'passive', icon: '📈', name: 'Aura Mastery',
                    desc: 'Passive. +5% aura effectiveness per point. At 20pts: run 2 auras simultaneously.',
                    endgame: 'slvl 20: +100% aura power + dual auras. Fanaticism + Conviction = game-breaking.',
                    maxPts: 20
                },
            ]
        },
        {
            id: 'combat', name: 'Combat', icon: '⚔️', nodes: [
                {
                    id: 'zeal', row: 0, col: 1, type: 'active', icon: '⚔️', name: 'Zeal',
                    desc: 'Strike with (2+slvl/5) rapid attacks at 75% weapon damage each.',
                    endgame: 'slvl 20: 6 attacks per Zeal. With Fanaticism = machine-gun melee.',
                    maxPts: 20, mana: 3, cd: 0, group: 'melee'
                },
                {
                    id: 'charge', row: 1, col: 0, type: 'active', icon: '🐎', name: 'Charge',
                    desc: 'Rush to target: (30+slvl×12) physical on impact + knockback.',
                    endgame: 'slvl 20: 270 charge hit. Gap closer that hits like a truck.',
                    maxPts: 20, mana: 8, cd: 6, group: 'melee', dmgBase: 30, dmgPerLvl: 12
                },
                {
                    id: 'vengeance', row: 1, col: 2, type: 'active', icon: '⚡', name: 'Vengeance',
                    desc: 'Each hit adds (8+slvl×4) fire/cold/lightning damage (all 3 simultaneously).',
                    endgame: 'slvl 20: +88 of each element per hit = +264 total elemental. Multi-element bypasses res.',
                    maxPts: 20, mana: 10, cd: 0, group: 'melee', dmgBase: 8, dmgPerLvl: 4, req: 'zeal:5'
                },
                {
                    id: 'combat_mastery', row: 2, col: 0, type: 'passive', icon: '📈', name: 'Combat Mastery',
                    desc: '+4% melee damage and +3% attack speed per point.',
                    endgame: 'slvl 20: +80% melee + 60% IAS. Core passive for all combat builds.',
                    maxPts: 20
                },
                {
                    id: 'smite', row: 2, col: 1, type: 'active', icon: '🔨', name: 'Smite',
                    desc: 'Shield bash: (15+slvl×8) + always hits + stuns 1s. Uses shield damage.',
                    endgame: 'slvl 20: 175 guaranteed-hit stun. Cannot miss = best single-target CC.',
                    maxPts: 20, mana: 4, cd: 2, group: 'melee', dmgBase: 15, dmgPerLvl: 8
                },
                {
                    id: 'blessed_hammer', row: 3, col: 0, type: 'active', icon: '🔨', name: 'Blessed Hammer',
                    desc: 'Spiral hammer: (25+slvl×14) holy damage. Spins outward hitting multiple times. Ignores defense.',
                    endgame: 'slvl 20: 305 per hammer, can multi-hit. The ICONIC Hammerdin skill. Ignores def = always full dmg.',
                    maxPts: 20, mana: 14, cd: 0, group: 'holy', dmgBase: 25, dmgPerLvl: 14, req: 'zeal:10',
                    synergies: [{ from: 'zeal', pctPerPt: 3 }, { from: 'smite', pctPerPt: 4 }]
                },
                {
                    id: 'foh', row: 3, col: 2, type: 'active', icon: '🌟', name: 'Fist of the Heavens',
                    desc: 'Lightning bolt from sky: (40+slvl×18) holy damage + shower of holy bolts in radius.',
                    endgame: 'slvl 20: 400 + holy bolt shower. Combines ranged + AoE. Alternative to Hammer builds.',
                    maxPts: 20, mana: 16, cd: 0, group: 'holy', dmgBase: 40, dmgPerLvl: 18, req: 'vengeance:5'
                },
                {
                    id: 'divine_storm', row: 4, col: 1, type: 'active', icon: '⛈️', name: 'Divine Storm',
                    desc: 'Ultimate: 10s of spinning holy hammers + holy lightning simultaneously. (20+slvl×10) of each per tick.',
                    endgame: 'slvl 20: 220/tick dual-element for 10s. The endgame Paladin super.',
                    maxPts: 20, mana: 30, cd: 60, group: 'holy', dmgBase: 20, dmgPerLvl: 10, req: 'blessed_hammer:10',
                    synergies: [{ from: 'blessed_hammer', pctPerPt: 5 }]
                },
            ]
        },
    ]
};
