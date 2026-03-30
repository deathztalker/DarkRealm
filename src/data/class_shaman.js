/**
 * SHAMAN CLASS — Full endgame talent trees
 * 3 viable endgame builds:
 *   1. "Chain Caller" — Elemental tree, Chain Lightning + Storm Caller spam
 *   2. "Totem Master" — Totems tree, stacking up to 4 totems for massive sustained DPS
 *   3. "Spiritkeeper" — Restoration tree, hybrid heal + Ancestral Spirit tanking
 *
 * Skill formula key:
 *   dmgBase + dmgPerLvl * slvl = base damage before synergies/item bonuses
 *   synergy: +X% per point of referenced skill (stacks additively)
 */

export const SHAMAN_CLASS = {
    id: 'shaman', name: 'Shaman', icon: '⚡',
    desc: 'Voice of the storm and the earth. Channels lightning through sacred totems, calls ancestral warriors from beyond death, and binds living wounds with primal water. Every build demands mastery of the elements.',
    stats: { str: 4, dex: 4, vit: 5, int: 8 },
    statBars: { str: 45, dex: 45, vit: 55, int: 85 },
    allowedWeapons: ['totem', 'mace', 'staff'],
    allowedOffhand: ['shield', 'source'],

    trees: [

        // ══════════════════════════════════════════
        //  TREE 1 — ELEMENTAL
        //  Endgame build: Chain Lightning + Storm Caller
        //  Synergy chain: Lightning Bolt → Chain Lightning → Storm Caller
        //  Goal: massive AoE lightning clear at maps 20+
        // ══════════════════════════════════════════
        {
            id: 'elemental', name: 'Elemental', icon: '🌩️',
            nodes: [

                // Row 0
                {
                    id: 'lightning_bolt', row: 0, col: 1, type: 'active', icon: '⚡',
                    name: 'Lightning Bolt',
                    desc: 'Hurl a javelin of lightning. Dmg: (12 + slvl×8) to (20 + slvl×12). Arcs to 1 extra target per 8 points.',
                    endgame: 'At slvl 20: 172–260 lightning dmg, arcs to 3 targets. Core source of the synergy chain.',
                    maxPts: 20, mana: 8, cd: 0, group: 'lightning',
                    dmgBase: 12, dmgMax: 20, dmgPerLvl: 8, dmgMaxPerLvl: 12,
                },

                // Row 1
                {
                    id: 'static_field', row: 1, col: 0, type: 'active', icon: '💢',
                    name: 'Static Field',
                    desc: 'Reduce all visible enemies current HP by (25 + slvl×1)% instantly. Range scales with level.',
                    endgame: 'At slvl 20: strips 45% HP from all enemies on screen. Essential boss opener. HP floor: 1.',
                    maxPts: 20, mana: 22, cd: 12, group: 'lightning',
                    dmgBase: 25, dmgPerLvl: 1,
                },
                {
                    id: 'chain_lightning', row: 1, col: 2, type: 'active', icon: '🌩️',
                    name: 'Chain Lightning',
                    desc: 'Bolt jumps between (2 + slvl/4) enemies, each hit dealing (18 + slvl×10)–(28 + slvl×15) dmg. Bounces do not lose power.',
                    endgame: 'At slvl 20: jumps 7 enemies for 218–328 each. With synergies can exceed 800 dmg/bounce.',
                    maxPts: 20, mana: 14, cd: 0, group: 'lightning',
                    dmgBase: 18, dmgMax: 28, dmgPerLvl: 10, dmgMaxPerLvl: 15,
                    req: 'lightning_bolt:3',
                    synergies: [ // receives synergy from:
                        { from: 'lightning_bolt', pctPerPt: 5 },
                        { from: 'thunder_strike', pctPerPt: 4 },
                    ],
                },
                {
                    id: 'thunder_strike', row: 1, col: 1, type: 'active', icon: '💥',
                    name: 'Thunder Strike',
                    desc: 'Slam ground releasing a shockwave: (30 + slvl×14) AoE lightning dmg, knocks back, stuns 0.6s. Hits all in radius.',
                    endgame: 'At slvl 20: 310 dmg AoE + stun. Primary crowd control skill. Also synergizes Chain Lightning +4%/pt.',
                    maxPts: 20, mana: 16, cd: 8, group: 'lightning',
                    dmgBase: 30, dmgPerLvl: 14, req: 'lightning_bolt:5',
                },

                // Row 2 — Mastery (passive)
                {
                    id: 'elem_mastery', row: 2, col: 1, type: 'passive', icon: '📈',
                    name: 'Elemental Mastery',
                    desc: 'Passive. +5% to all elemental damage (fire, cold, lightning, earth) per point. Also +2% elemental pierce per 5 pts.',
                    endgame: 'At slvl 20: +100% elemental dmg, 8% pierce — transforms every elemental skill to endgame viability.',
                    maxPts: 20,
                },

                // Row 3
                {
                    id: 'storm_caller', row: 3, col: 0, type: 'active', icon: '🌪️',
                    name: 'Storm Caller',
                    desc: 'Conjure a living storm. For 8+slvl×0.5s, random lightning bolts hit random enemies every 0.3s for (40+slvl×18) dmg each.',
                    endgame: 'At slvl 20: 18s storm, ~400 dmg bolts every 0.3s = devastating sustained AoE. Best boss DPS for Elemental build.',
                    maxPts: 20, mana: 28, cd: 30, group: 'lightning',
                    dmgBase: 40, dmgPerLvl: 18, req: 'chain_lightning:10',
                    synergies: [{ from: 'chain_lightning', pctPerPt: 6 }],
                },
                {
                    id: 'earthquake', row: 3, col: 2, type: 'active', icon: '🌍',
                    name: 'Earthquake',
                    desc: 'Seismic fissure travels 600px in chosen direction: (50+slvl×20) earth dmg + stuns 1.2s. Width grows with level.',
                    endgame: 'At slvl 20: 450 dmg line, 1.2s stun. Viable off-spec for ground-clear. Synergizes with Elem Mastery.',
                    maxPts: 20, mana: 20, cd: 12, group: 'earth',
                    dmgBase: 50, dmgPerLvl: 20, req: 'thunder_strike:5',
                },

                // Row 4 — Synergy node
                {
                    id: 'cl_syn', row: 4, col: 1, type: 'synergy', icon: '🔗',
                    name: 'Storm Mastery Synergy',
                    desc: 'Each point of Thunder Strike adds +4% Chain Lightning damage. Each point of Lightning Bolt adds +5% Chain Lightning damage.',
                    maxPts: 1, targetSkill: 'chain_lightning', bonusPerPoint: 'see desc',
                    req: 'thunder_strike:1',
                },
            ]
        },

        // ══════════════════════════════════════════
        //  TREE 2 — TOTEMS
        //  Endgame build: Stack 4 totems, use Totemic Wrath for burst
        //  Key mechanic: Multiple totems active simultaneously
        //  Goal: highest sustained DPS from 3 damage totems + 1 utility
        // ══════════════════════════════════════════
        {
            id: 'totems', name: 'Totems', icon: '🗿',
            nodes: [

                // Row 0
                {
                    id: 'searing_totem', row: 0, col: 1, type: 'active', icon: '🔥',
                    name: 'Searing Totem',
                    desc: 'Place a fire-spitting totem. Attacks nearest enemy every 1.5s for (8+slvl×6) fire dmg. Lasts 30+slvl×2s. Max totems: 1+slvl/8.',
                    endgame: 'slvl 20: 128 dmg/shot, fires every 1.5s, lasts 70s. Max 3 Searing Totems active = 256 DPS each.',
                    maxPts: 20, mana: 10, cd: 3, group: 'totem',
                    dmgBase: 8, dmgPerLvl: 6,
                },

                // Row 1
                {
                    id: 'healing_stream', row: 1, col: 0, type: 'active', icon: '💧',
                    name: 'Healing Stream Totem',
                    desc: 'Totem pulses every 2s restoring (8+slvl×5) HP to lowest HP ally in 300px. Lasts 30+slvl×2s.',
                    endgame: 'slvl 20: 108 HP every 2s = 54 HP/s without any healing power. Non-trivial sustain.',
                    maxPts: 20, mana: 12, cd: 4, group: 'totem',
                    dmgBase: 8, dmgPerLvl: 5,
                },
                {
                    id: 'stoneskin_totem', row: 1, col: 2, type: 'active', icon: '🪨',
                    name: 'Stoneskin Totem',
                    desc: 'Totem grants all allies within 350px +(10+slvl×2)% armor. Stacks with other buffs. Lasts 30+slvl×2s.',
                    endgame: 'slvl 20: +50% armor buff. Massive survivability supplement for melee classes.',
                    maxPts: 20, mana: 12, cd: 4, group: 'totem', req: 'searing_totem:3',
                },

                // Row 2 — Mastery
                {
                    id: 'totem_mastery', row: 2, col: 1, type: 'passive', icon: '📈',
                    name: 'Totem Mastery',
                    desc: 'Passive. Each point: +6% totem damage, +5% totem duration, +0.1 max concurrent totems (caps at +2 at lvl 20).',
                    endgame: 'At slvl 20: +120% totem dmg, +100% duration, +2 max totems. Enables running 4+ totems simultaneously.',
                    maxPts: 20,
                },

                // Row 3
                {
                    id: 'windfury_totem', row: 3, col: 0, type: 'active', icon: '💨',
                    name: 'Windfury Totem',
                    desc: 'Totem grants all allies +(20+slvl×2)% attack speed and +(10+slvl×1.5)% movement speed. Lasts 30+slvl×3s.',
                    endgame: 'slvl 20: +60% attack speed, +40% move speed. Essential for melee-heavy parties. Very strong support build.',
                    maxPts: 20, mana: 16, cd: 25, group: 'totem', req: 'searing_totem:10',
                },
                {
                    id: 'totemic_wrath', row: 3, col: 2, type: 'active', icon: '⚡',
                    name: 'Totemic Wrath',
                    desc: 'For 10+slvl×0.5s: all active totems attack (3+slvl/5) times per second and deal +(100+slvl×15)% damage.',
                    endgame: 'slvl 20: 15s burst, 7 attacks/sec, +400% dmg on all totems. Deadly burst with 4 Searing Totems active.',
                    maxPts: 20, mana: 22, cd: 40, group: 'buff', req: 'totem_mastery:10',
                },

                // Row 4 — Synergy
                {
                    id: 'totem_syn', row: 4, col: 1, type: 'synergy', icon: '🔗',
                    name: 'Wrath Amplification',
                    desc: 'Each point of Totem Mastery adds +3% Totemic Wrath bonus. Each point of Searing Totem adds +4% to all fire totems.',
                    maxPts: 1, targetSkill: 'totemic_wrath', bonusPerPoint: 'see desc', req: 'totemic_wrath:1',
                },
            ]
        },

        // ══════════════════════════════════════════
        //  TREE 3 — RESTORATION
        //  Endgame build: Ancestral healer / hybrid sustain
        //  Key mechanic: Healing Wave chain + Nature's Swiftness instant cast
        //  Goal: unlimited sustain, permanent Ancestral Spirit uptime
        // ══════════════════════════════════════════
        {
            id: 'restoration', name: 'Restoration', icon: '💚',
            nodes: [

                // Row 0
                {
                    id: 'healing_wave', row: 0, col: 1, type: 'active', icon: '💚',
                    name: 'Healing Wave',
                    desc: 'Heal target for (30+slvl×12) HP, then chains to (1+slvl/4) additional nearby allies for 60% of previous heal.',
                    endgame: 'slvl 20: 270 HP base heal, chains to 6 targets (each 60% of previous). ~780 total HP across party per cast.',
                    maxPts: 20, mana: 12, cd: 0, group: 'holy',
                    dmgBase: 30, dmgPerLvl: 12,
                    synergies: [{ from: 'ancestral_spirit', pctPerPt: 4 }],
                },

                // Row 1
                {
                    id: 'earth_shield', row: 1, col: 0, type: 'active', icon: '🛡️',
                    name: 'Earth Shield',
                    desc: 'Wrap target in earth shell absorbing (40+slvl×16) dmg. While active, heals for 4% of damage absorbed. Lasts 15s.',
                    endgame: 'slvl 20: absorbs 360 dmg + passive heal. Combine with Totem Mastery support for unkillable tanking.',
                    maxPts: 20, mana: 14, cd: 15, group: 'earth',
                    dmgBase: 40, dmgPerLvl: 16,
                },
                {
                    id: 'ancestral_spirit', row: 1, col: 2, type: 'active', icon: '👻',
                    name: 'Ancestral Spirit',
                    desc: 'Summon an ancestor warrior for 20+slvl×2s. It attacks (dmg: 20+slvl×10), casts mini-heals every 3s for 15+slvl×6 HP.',
                    endgame: 'slvl 20: 60s duration spirit, 220 attack dmg, 135 HP heal every 3s. Permanent up-time with CDR gear.',
                    maxPts: 20, mana: 20, cd: 45, group: 'summon', req: 'healing_wave:5',
                    dmgBase: 20, dmgPerLvl: 10,
                },

                // Row 2 — Mastery
                {
                    id: 'resto_mastery', row: 2, col: 1, type: 'passive', icon: '📈',
                    name: 'Restoration Mastery',
                    desc: 'Passive. +6% healing effectiveness and +4% earth spell damage per point. At 10pts: Healing Wave jumps to 1 extra target for free.',
                    endgame: 'At slvl 20: +120% healing. Chain heal heals twice as many targets. Earth Shield absorbs triple base.',
                    maxPts: 20,
                },

                // Row 3
                {
                    id: 'nature_swiftness', row: 3, col: 0, type: 'active', icon: '⚡',
                    name: 'Nature\'s Swiftness',
                    desc: 'Next healing or earth spell is instant cast and has +(50+slvl×5)% effectiveness. 20s cooldown, resets on kill.',
                    endgame: 'slvl 20: +150% on instant Healing Wave = ~675 HP base heal chained to 6 targets. Cooldown resets on kill.',
                    maxPts: 20, mana: 6, cd: 20, group: 'buff', req: 'healing_wave:10',
                },
                {
                    id: 'mana_tide', row: 3, col: 2, type: 'active', icon: '🌊',
                    name: 'Mana Tide Totem',
                    desc: 'Place a totem that restores (2+slvl×0.5)% of max mana per second to all allies for 12+slvl×1s.',
                    endgame: 'slvl 20: 12% max mana/sec for 32s = full mana bar in ~8s. Indispensible for mana-hungry parties.',
                    maxPts: 20, mana: 18, cd: 60, group: 'totem', req: 'ancestral_spirit:5',
                },

                // Row 4 — Synergy
                {
                    id: 'hw_syn', row: 4, col: 1, type: 'synergy', icon: '🔗',
                    name: 'Ancestral Resonance',
                    desc: 'Each point of Ancestral Spirit adds +4% Healing Wave effectiveness. Each point of Earth Shield adds +5% chain heal range.',
                    maxPts: 1, targetSkill: 'healing_wave', bonusPerPoint: 'see desc', req: 'ancestral_spirit:1',
                },
            ]
        }
    ]
};
