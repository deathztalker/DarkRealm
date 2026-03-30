/**
 * WARLOCK — Expanded endgame trees
 * Builds: 1. "Chaos Lord" — Destruction burst  2. "Plague Bearer" — Affliction DoT stacking  3. "Demon Master" — Demonology pets+Meta
 */
export const WARLOCK_CLASS = {
    id: 'warlock', name: 'Warlock', icon: '🌑',
    desc: 'Draws power from darkness and demonic pacts. Curses enemies with afflictions, channels chaotic shadow energy, and summons demons from the void.',
    stats: { str: 3, dex: 4, vit: 4, int: 9 },
    statBars: { str: 30, dex: 40, vit: 40, int: 90 },
    allowedWeapons: ['wand', 'staff', 'dagger'],
    allowedOffhand: ['source'],
    trees: [
        {
            id: 'destruction', name: 'Destruction', icon: '💥', nodes: [
                {
                    id: 'shadow_bolt', row: 0, col: 1, type: 'active', icon: '🌑', name: 'Shadow Bolt',
                    desc: 'Dark bolt: (12+slvl×8) shadow damage. Fast cast, no cooldown.',
                    endgame: 'slvl 20: 172 shadow per cast. Core filler for Destruction builds.',
                    maxPts: 20, mana: 9, cd: 0, group: 'shadow', dmgBase: 12, dmgPerLvl: 8
                },
                {
                    id: 'drain_life', row: 1, col: 0, type: 'active', icon: '🩸', name: 'Drain Life',
                    desc: 'Channel: steal (5+slvl×3) HP/s from target. You heal for 100% of damage dealt.',
                    endgame: 'slvl 20: 65 HP/s steal. Unlimited sustain channel.',
                    maxPts: 20, mana: 4, cd: 0, group: 'shadow', dmgBase: 5, dmgPerLvl: 3
                },
                {
                    id: 'soul_fire', row: 1, col: 2, type: 'active', icon: '🔥', name: 'Soul Fire',
                    desc: 'Chaos fire: (20+slvl×12) shadow+fire damage + burn DoT (5+slvl×3)/s for 4s.',
                    endgame: 'slvl 20: 260 hit + 65/s DoT. Dual-element bypasses single-res stacking.',
                    maxPts: 20, mana: 14, cd: 4, group: 'shadow', dmgBase: 20, dmgPerLvl: 12, req: 'shadow_bolt:5'
                },
                {
                    id: 'shadow_mastery', row: 2, col: 0, type: 'passive', icon: '📈', name: 'Shadow Mastery',
                    desc: '+6% shadow damage per point. At 10pts: shadow spells leech 3% damage as HP.',
                    endgame: 'slvl 20: +120% shadow dmg + 6% spell leech. Built-in sustain for Destruction.',
                    maxPts: 20
                },
                {
                    id: 'chaos_bolt', row: 2, col: 1, type: 'active', icon: '🌀', name: 'Chaos Bolt',
                    desc: 'Bolt that ALWAYS critically strikes: (30+slvl×16) shadow damage.',
                    endgame: 'slvl 20: 350 × guaranteed crit (with 250% multi) = 875. Predictable burst.',
                    maxPts: 20, mana: 16, cd: 8, group: 'shadow', dmgBase: 30, dmgPerLvl: 16, req: 'soul_fire:5'
                },
                {
                    id: 'seed', row: 3, col: 0, type: 'active', icon: '🌱', name: 'Seed of Corruption',
                    desc: 'Plant in target: explodes after 2s dealing (40+slvl×20) shadow AoE to all nearby.',
                    endgame: 'slvl 20: 440 shadow AoE. Plant on frontliner → detonates when surrounded.',
                    maxPts: 20, mana: 20, cd: 10, group: 'shadow', dmgBase: 40, dmgPerLvl: 20, req: 'shadow_bolt:10',
                    synergies: [{ from: 'shadow_bolt', pctPerPt: 4 }]
                },
                {
                    id: 'dark_pact', row: 3, col: 2, type: 'active', icon: '🩸', name: 'Dark Pact',
                    desc: 'Sacrifice 20% current HP: next shadow spell deals +(100+slvl×5)% damage.',
                    endgame: 'slvl 20: +200% next spell. HP cost is offset by Drain Life / Shadow Mastery leech.',
                    maxPts: 20, mana: 0, cd: 12, group: 'buff', req: 'shadow_mastery:10'
                },
                {
                    id: 'rain_of_chaos', row: 4, col: 1, type: 'active', icon: '🌧️', name: 'Rain of Chaos',
                    desc: 'Ultimate: shadow meteors rain for 8s: (25+slvl×14) shadow AoE per hit, 2 hits/s.',
                    endgame: 'slvl 20: 305/hit × 2/s × 8s = 4880 total AoE. Endgame room annihilation.',
                    maxPts: 20, mana: 35, cd: 45, group: 'shadow', dmgBase: 25, dmgPerLvl: 14, req: 'seed:10',
                    synergies: [{ from: 'shadow_mastery', pctPerPt: 5 }]
                },
            ]
        },
        {
            id: 'affliction', name: 'Affliction', icon: '🌿', nodes: [
                {
                    id: 'corruption', row: 0, col: 1, type: 'active', icon: '🌿', name: 'Corruption',
                    desc: 'Instant-cast DoT: (8+slvl×4) shadow/s for (6+slvl×0.2)s.',
                    endgame: 'slvl 20: 88/s for 10s = 880. Zero cooldown, instant cast, stackable.',
                    maxPts: 20, mana: 8, cd: 0, group: 'shadow', dmgBase: 8, dmgPerLvl: 4
                },
                {
                    id: 'agony', row: 1, col: 0, type: 'active', icon: '😣', name: 'Agony',
                    desc: 'Slow-building DoT: starts at (2+slvl×1)/s, doubles every 3s. Lasts 12s.',
                    endgame: 'slvl 20: starts 22/s → 44 → 88 → 176 by end. 1980 total. Incredible on bosses.',
                    maxPts: 20, mana: 6, cd: 0, group: 'shadow', dmgBase: 2, dmgPerLvl: 1, req: 'corruption:3'
                },
                {
                    id: 'haunt', row: 1, col: 2, type: 'active', icon: '👻', name: 'Haunt',
                    desc: 'Spectral haunt: (10+slvl×6) shadow/s for 8s. When target dies, jumps to next enemy with full duration.',
                    endgame: 'slvl 20: 130/s × 8s. Jumps on kill = infinite pack clear with one cast.',
                    maxPts: 20, mana: 12, cd: 8, group: 'shadow', dmgBase: 10, dmgPerLvl: 6, req: 'corruption:5'
                },
                {
                    id: 'aff_mastery', row: 2, col: 0, type: 'passive', icon: '📈', name: 'Affliction Mastery',
                    desc: '+8% DoT damage per point. At 10pts: DoTs cannot be dispelled.',
                    endgame: 'slvl 20: +160% DoT dmg. Undispellable DoTs = guaranteed death.',
                    maxPts: 20
                },
                {
                    id: 'siphon_life', row: 2, col: 1, type: 'active', icon: '💧', name: 'Siphon Life',
                    desc: 'Channel: drain (6+slvl×3)/s from target, healing you for 150% of damage.',
                    endgame: 'slvl 20: 66/s damage, 99/s self-heal. Infinite sustain while DoTting.',
                    maxPts: 20, mana: 4, cd: 0, group: 'shadow', dmgBase: 6, dmgPerLvl: 3, req: 'agony:5'
                },
                {
                    id: 'unstable', row: 3, col: 0, type: 'active', icon: '💣', name: 'Unstable Affliction',
                    desc: 'DoT: (10+slvl×5)/s for 8s. If dispelled/target heals: instant (40+slvl×15) shadow burst.',
                    endgame: 'slvl 20: 110/s DoT or 340 burst if countered. Anti-heal mechanic.',
                    maxPts: 20, mana: 15, cd: 0, group: 'shadow', dmgBase: 10, dmgPerLvl: 5, req: 'haunt:5'
                },
                {
                    id: 'dark_soul', row: 3, col: 2, type: 'active', icon: '👁️', name: 'Dark Soul',
                    desc: 'Buff: for 20s, all DoTs tick (20+slvl×2)% faster.',
                    endgame: 'slvl 20: DoTs tick 60% faster = 1.6× DPS on everything. Huge burst window.',
                    maxPts: 20, mana: 15, cd: 60, group: 'buff', req: 'aff_mastery:10'
                },
                {
                    id: 'doom', row: 4, col: 1, type: 'active', icon: '💀', name: 'Curse of Doom',
                    desc: 'Ultimate: target takes (100+slvl×30) shadow after 15s. If it kills: summons a Doomguard demon for 30s.',
                    endgame: 'slvl 20: 700 delayed nuke. Guarantees value — either kills or you have a powerful 30s pet.',
                    maxPts: 20, mana: 18, cd: 60, req: 'unstable:10',
                    synergies: [{ from: 'aff_mastery', pctPerPt: 4 }]
                },
            ]
        },
        {
            id: 'demonology', name: 'Demonology', icon: '😈', nodes: [
                {
                    id: 'imp', row: 0, col: 1, type: 'active', icon: '😈', name: 'Summon Imp',
                    desc: 'Small fire demon: fires (6+slvl×4) fire bolts every 1.5s. Permanent until killed.',
                    endgame: 'slvl 20: Imp fires 86 fire/1.5s = 57 DPS. Weak alone but feeds Soul Link.',
                    maxPts: 20, mana: 20, cd: 60, group: 'fire', dmgBase: 6, dmgPerLvl: 4
                },
                {
                    id: 'voidwalker', row: 1, col: 0, type: 'active', icon: '🌑', name: 'Voidwalker',
                    desc: 'Void tank demon: (80+slvl×25) HP, taunts enemies, absorbs damage. Replaces Imp.',
                    endgame: 'slvl 20: 580 HP tank with auto-taunt. Your personal meat shield.',
                    maxPts: 20, mana: 25, cd: 60, req: 'imp:5'
                },
                {
                    id: 'demon_armor', row: 1, col: 2, type: 'passive', icon: '🛡️', name: 'Demon Armor',
                    desc: '+5% armor and +3 HP regen/s per point. At 10pts: immune to fear.',
                    endgame: 'slvl 20: +100% armor, +60 HP regen/s. Makes Warlock surprisingly tanky.',
                    maxPts: 20
                },
                {
                    id: 'soul_link', row: 2, col: 1, type: 'passive', icon: '🔗', name: 'Soul Link',
                    desc: 'Active demon absorbs (10+slvl×1.5)% of damage you take. You heal for (2+slvl×0.5)% when demon attacks.',
                    endgame: 'slvl 20: Demon absorbs 40% of your damage + 12% lifesteal from demon attacks.',
                    maxPts: 20, req: 'imp:5'
                },
                {
                    id: 'succubus', row: 2, col: 0, type: 'active', icon: '💜', name: 'Succubus',
                    desc: 'Charming demon: (12+slvl×6) shadow damage + seduces (stuns) target for 2s every 10s. Replaces previous demon.',
                    endgame: 'slvl 20: 132 shadow DPS + periodic 2s CC. Control-oriented demon choice.',
                    maxPts: 20, mana: 25, cd: 60, group: 'shadow', dmgBase: 12, dmgPerLvl: 6, req: 'voidwalker:5'
                },
                {
                    id: 'infernal', row: 3, col: 0, type: 'active', icon: '🔥', name: 'Summon Infernal',
                    desc: 'Fall from sky: (50+slvl×20) fire AoE on impact + stays as pet for 30s with (100+slvl×30) HP.',
                    endgame: 'slvl 20: 450 AoE + 700 HP bruiser for 30s. Both nuke AND pet in one skill.',
                    maxPts: 20, mana: 30, cd: 120, group: 'fire', dmgBase: 50, dmgPerLvl: 20, req: 'succubus:5'
                },
                {
                    id: 'demonfire_passive', row: 3, col: 2, type: 'passive', icon: '🔥', name: 'Demonfire',
                    desc: '+8% all demon pet damage per point. At 10pts: demons gain 20% lifesteal.',
                    endgame: 'slvl 20: +160% demon dmg + lifesteal = self-sustaining powerful demons.',
                    maxPts: 20, req: 'soul_link:5'
                },
                {
                    id: 'metamorphosis', row: 4, col: 1, type: 'active', icon: '👹', name: 'Metamorphosis',
                    desc: 'Ultimate: become a demon for 20s. +100% HP, +50% damage, melee cleave (30+slvl×14) shadow per swing. Immune to CC.',
                    endgame: 'slvl 20: demon form, 310/swing melee cleave, double HP, CC immune. The ultimate transformation.',
                    maxPts: 20, mana: 20, cd: 120, group: 'buff', dmgBase: 30, dmgPerLvl: 14, req: 'infernal:5',
                    synergies: [{ from: 'demonfire_passive', pctPerPt: 4 }]
                },
            ]
        },
    ]
};
