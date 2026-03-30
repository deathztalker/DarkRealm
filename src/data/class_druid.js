/**
 * DRUID — Expanded endgame trees
 * Builds: 1. "Werebear Tank" — Shapeshifting bear tank  2. "Wind Druid" — Tornado+Hurricane AoE  3. "Beastmaster" — Summon army+Oak Sage
 */
export const DRUID_CLASS = {
    id: 'druid', name: 'Druid', icon: '🐺',
    desc: 'Guardian of the wild. Transforms into bear or wolf, commands the fury of wind and earth, and summons spirit companions. The most versatile class.',
    stats: { str: 6, dex: 4, vit: 7, int: 3 },
    statBars: { str: 65, dex: 45, vit: 75, int: 30 },
    allowedWeapons: ['mace', 'staff', 'axe'],
    allowedOffhand: ['shield'],
    trees: [
        {
            id: 'shapeshifting', name: 'Shapeshifting', icon: '🐻', nodes: [
                {
                    id: 'bear_form', row: 0, col: 1, type: 'active', icon: '🐻', name: 'Werebear Form',
                    desc: 'Transform: +(100+slvl×5)% HP, +(50+slvl×3)% armor. Unlocks Maul/Slam. Lasts 30+slvl×3s.',
                    endgame: 'slvl 20: +200% HP, +110% armor for 90s. The tankiest form in the game.',
                    maxPts: 20, mana: 15, cd: 30, group: 'buff'
                },
                {
                    id: 'wolf_form', row: 0, col: 0, type: 'active', icon: '🐺', name: 'Werewolf Form',
                    desc: 'Transform: +(50+slvl×2)% move speed, +(30+slvl×2)% IAS. Unlocks Fury/Rabies. Lasts 30+slvl×3s.',
                    endgame: 'slvl 20: +90% IAS, +90% move speed for 90s. Fastest melee class.',
                    maxPts: 20, mana: 10, cd: 20, group: 'buff'
                },
                {
                    id: 'maul', row: 1, col: 1, type: 'active', icon: '🐾', name: 'Maul',
                    desc: 'Bear: massive swipe (25+slvl×12) + stun 1s. Each consecutive hit adds +15% damage.',
                    endgame: 'slvl 20: 265 base, stacking to 380+ after 3 hits. Bear DPS machine.',
                    maxPts: 20, mana: 8, cd: 0, group: 'melee', dmgBase: 25, dmgPerLvl: 12, req: 'bear_form:3'
                },
                {
                    id: 'fury', row: 1, col: 0, type: 'active', icon: '😤', name: 'Fury',
                    desc: 'Wolf: rapid 3-hit combo at (12+slvl×6) each. Each hit has 20% lifesteal.',
                    endgame: 'slvl 20: 132 ×3 = 396 total + 79 HP healed. Sustain + DPS.',
                    maxPts: 20, mana: 12, cd: 0, group: 'melee', dmgBase: 12, dmgPerLvl: 6, req: 'wolf_form:3'
                },
                {
                    id: 'feral_mastery', row: 2, col: 1, type: 'passive', icon: '📈', name: 'Feral Mastery',
                    desc: '+5% shapeshift damage and +3% attack speed per point.',
                    endgame: 'slvl 20: +100% dmg, +60% IAS in animal forms. Essential for both builds.',
                    maxPts: 20
                },
                {
                    id: 'rabies', row: 3, col: 0, type: 'active', icon: '🦴', name: 'Rabies',
                    desc: 'Wolf bite: applies spreading poison (6+slvl×4)/s for 5s. Spreads to nearby enemies from infected.',
                    endgame: 'slvl 20: 86/s spreading DoT. Infect one → watch it chain through entire pack.',
                    maxPts: 20, mana: 10, cd: 0, group: 'poison', dmgBase: 6, dmgPerLvl: 4, req: 'fury:5'
                },
                {
                    id: 'bear_slam', row: 3, col: 2, type: 'active', icon: '💥', name: 'Earth Slam',
                    desc: 'Bear: slam ground (40+slvl×16) earth AoE. Stuns all 1.5s. Large radius.',
                    endgame: 'slvl 20: 360 earth AoE + 1.5s mass stun. Bear crowd control ultimate.',
                    maxPts: 20, mana: 14, cd: 10, group: 'earth', dmgBase: 40, dmgPerLvl: 16, req: 'maul:10',
                    synergies: [{ from: 'maul', pctPerPt: 4 }]
                },
                {
                    id: 'primal_rage', row: 4, col: 1, type: 'active', icon: '🔥', name: 'Primal Rage',
                    desc: 'Ultimate: both forms active simultaneously for 15s. Bear HP + Wolf speed. All shapeshifting skills usable.',
                    endgame: 'slvl 20: 15s of being a fast bear-wolf hybrid with access to all abilities. True endgame form.',
                    maxPts: 20, mana: 25, cd: 120, group: 'buff', req: 'feral_mastery:15'
                },
            ]
        },
        {
            id: 'elemental_druid', name: 'Elemental', icon: '🌩️', nodes: [
                {
                    id: 'tornado', row: 0, col: 1, type: 'active', icon: '🌪️', name: 'Tornado',
                    desc: 'Spinning vortex: (12+slvl×8) physical, bounces randomly hitting multiple enemies.',
                    endgame: 'slvl 20: 172 per bounce, 5-8 bounces. Randomized but high total damage.',
                    maxPts: 20, mana: 10, cd: 0, group: 'nature', dmgBase: 12, dmgPerLvl: 8
                },
                {
                    id: 'fissure', row: 0, col: 0, type: 'active', icon: '🌍', name: 'Fissure',
                    desc: 'Open earth crack: (20+slvl×10) fire+earth line damage + 3s burning ground.',
                    endgame: 'slvl 20: 220 line + ground fire. Zone control for corridors.',
                    maxPts: 20, mana: 12, cd: 4, group: 'earth', dmgBase: 20, dmgPerLvl: 10
                },
                {
                    id: 'cyclone_armor', row: 1, col: 2, type: 'active', icon: '🛡️', name: 'Cyclone Armor',
                    desc: 'Wind shield absorbs (30+slvl×12) elemental damage. Lasts until depleted.',
                    endgame: 'slvl 20: absorbs 270 elemental dmg. Refreshable. Key survivability buff.',
                    maxPts: 20, mana: 8, cd: 0, group: 'buff', dmgBase: 30, dmgPerLvl: 12
                },
                {
                    id: 'hurricane', row: 2, col: 1, type: 'active', icon: '🌀', name: 'Hurricane',
                    desc: 'AoE wind around you for (10+slvl×1)s: (8+slvl×5) cold/s to all nearby + slows by 35%.',
                    endgame: 'slvl 20: 108/s for 30s = 3240 AoE total with 35% slow. Walk through packs.',
                    maxPts: 20, mana: 18, cd: 30, group: 'cold', dmgBase: 8, dmgPerLvl: 5, req: 'tornado:10',
                    synergies: [{ from: 'tornado', pctPerPt: 4 }]
                },
                {
                    id: 'nature_mastery', row: 2, col: 0, type: 'passive', icon: '📈', name: 'Nature Mastery',
                    desc: '+6% elemental damage per point. At 10pts: Tornado gains 2 extra bounces.',
                    endgame: 'slvl 20: +120% elem dmg. Tornado hits 10+ times per cast.',
                    maxPts: 20
                },
                {
                    id: 'volcano', row: 3, col: 0, type: 'active', icon: '🌋', name: 'Volcano',
                    desc: 'Eruption: (40+slvl×18) fire+earth at impact point + periodic eruptions for 10s.',
                    endgame: 'slvl 20: 400 impact + periodic bursts. Zone lockdown skill.',
                    maxPts: 20, mana: 20, cd: 15, group: 'fire', dmgBase: 40, dmgPerLvl: 18, req: 'fissure:10'
                },
                {
                    id: 'twister', row: 3, col: 2, type: 'active', icon: '🌪️', name: 'Twister',
                    desc: 'Mini tornadoes stun enemies for 0.5s and deal (5+slvl×3). Fires constantly during Hurricane.',
                    endgame: 'slvl 20: 65 dmg twisters with 0.5s stun. Auto-cast during Hurricane = perma-stun.',
                    maxPts: 20, mana: 4, cd: 0, group: 'nature', dmgBase: 5, dmgPerLvl: 3, req: 'hurricane:5'
                },
                {
                    id: 'armageddon', row: 4, col: 1, type: 'active', icon: '☄️', name: 'Armageddon',
                    desc: 'Ultimate: combined fire rain + hurricane for 20s. (15+slvl×8) mixed AoE per hit, random targets, 3 hits/s.',
                    endgame: 'slvl 20: 175/hit × 3/s × 20s = 10500 total. Walk-through-everything endgame spell.',
                    maxPts: 20, mana: 28, cd: 60, group: 'fire', dmgBase: 15, dmgPerLvl: 8, req: 'hurricane:10',
                    synergies: [{ from: 'nature_mastery', pctPerPt: 5 }]
                },
            ]
        },
        {
            id: 'summoning_druid', name: 'Summoning', icon: '🌿', nodes: [
                {
                    id: 'summon_wolf', row: 0, col: 1, type: 'active', icon: '🐺', name: 'Summon Dire Wolf',
                    desc: 'Call a dire wolf. Max (1+slvl/5). Wolves: (10+slvl×5) dmg, (30+slvl×10) HP.',
                    endgame: 'slvl 20: 5 wolves, each 110 dmg, 230 HP. Pack of 5 = 550 DPS.',
                    maxPts: 20, mana: 16, cd: 5
                },
                {
                    id: 'spirit_wolf', row: 1, col: 0, type: 'passive', icon: '👻', name: 'Spirit Wolf',
                    desc: '+15% wolf HP and damage per point. At 10pts: wolves gain shadow dodge (20% evade).',
                    endgame: 'slvl 20: +300% wolf stats + evasion. Wolves become truly dangerous.',
                    maxPts: 20
                },
                {
                    id: 'raven', row: 1, col: 2, type: 'active', icon: '🐦‍⬛', name: 'Summon Raven',
                    desc: 'Call (1+slvl/4) ravens. Each attacks for (5+slvl×3) and blinds targets (10% hit reduction).',
                    endgame: 'slvl 20: 6 ravens, 65 dmg each with blind. Utility + supplemental damage.',
                    maxPts: 20, mana: 8, cd: 3, req: 'summon_wolf:1'
                },
                {
                    id: 'oak_sage', row: 2, col: 1, type: 'active', icon: '🌲', name: 'Oak Sage',
                    desc: 'Spirit: all party members gain +(20+slvl×2)% max HP. Only 1 spirit active.',
                    endgame: 'slvl 20: +60% max HP for entire party. The best HP buff in the game.',
                    maxPts: 20, mana: 14, cd: 60, req: 'summon_wolf:5'
                },
                {
                    id: 'heart_of_wolverine', row: 2, col: 0, type: 'active', icon: '🐾', name: 'Heart of Wolverine',
                    desc: 'Spirit: party gains +(20+slvl×2)% damage and +10% IAS. Replaces Oak Sage.',
                    endgame: 'slvl 20: +60% dmg + IAS for party. Offensive spirit alternative.',
                    maxPts: 20, mana: 14, cd: 60, req: 'oak_sage:3'
                },
                {
                    id: 'vine', row: 3, col: 0, type: 'active', icon: '🌿', name: 'Spirit Vine',
                    desc: 'Vine roots target 3s, drains (4+slvl×2) HP/s healing the vine. Max 2 vines.',
                    endgame: 'slvl 20: 3s root + 44/s drain. Crowd control + sustained damage.',
                    maxPts: 20, mana: 8, cd: 6
                },
                {
                    id: 'grizzly', row: 3, col: 2, type: 'active', icon: '🐻', name: 'Summon Grizzly',
                    desc: 'Massive grizzly bear: (150+slvl×30) HP, (15+slvl×8) damage, taunts enemies.',
                    endgame: 'slvl 20: 750 HP tank, 175 dmg with taunt. Your personal tank companion.',
                    maxPts: 20, mana: 28, cd: 60, req: 'summon_wolf:10',
                    synergies: [{ from: 'spirit_wolf', pctPerPt: 5 }]
                },
                {
                    id: 'stampede', row: 4, col: 1, type: 'active', icon: '🦬', name: 'Stampede',
                    desc: 'Ultimate: ALL summoned creatures charge a target simultaneously, each dealing +(100+slvl×10)% damage.',
                    endgame: 'slvl 20: all pets charge with +300% dmg. 5 wolves + grizzly + ravens = one-shot burst.',
                    maxPts: 20, mana: 30, cd: 60, req: 'grizzly:10',
                    synergies: [{ from: 'spirit_wolf', pctPerPt: 4 }]
                },
            ]
        },
    ]
};
