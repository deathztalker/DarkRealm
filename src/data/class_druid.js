/**
 * DRUID — Class Definition
 * Three trees: Shapeshifting (melee forms) · Nature (elemental spells) · Healing (restoration)
 */
export const DRUID_CLASS = {
    id: 'druid', name: 'Druid', icon: '🌿',
    description: 'A shapeshifter who fights as a bear, wolf, or human. Commands nature\'s elements and heals wounds with ancient magic.',
    stats: { str: 20, dex: 20, vit: 20, int: 10 },
    trees: [

        // ═══ SHAPESHIFTING — Melee form builds ═══
        {
            id: 'shapeshifting', name: 'Shapeshifting', icon: '🐻',
            nodes: [
                {
                    id: 'dire_wolf', row: 0, col: 1, type: 'active', icon: '🐺', name: 'Dire Wolf Form',
                    desc: 'Active (Toggle) · Transform into a Dire Wolf: +50% movement speed, +30% attack speed.',
                    tip: 'Max lvl (20): Fast mobile melee form.',
                    maxPts: 20, mana: 10, cd: 0, group: 'melee',
                    synergies: [{ from: 'bear_form', pctPerPt: 5 }]
                },
                {
                    id: 'bear_form', row: 1, col: 0, type: 'active', icon: '🐻', name: 'Bear Form',
                    desc: 'Active (Toggle) · Transform into a massive bear: +200% armor, +40% max HP.',
                    tip: 'Max lvl (20): Heavily defensive tank form.',
                    maxPts: 20, mana: 10, cd: 0, group: 'melee',
                    synergies: [{ from: 'dire_wolf', pctPerPt: 5 }]
                },
                {
                    id: 'feral_mastery', row: 1, col: 2, type: 'passive', icon: '🦁', name: 'Feral Mastery',
                    desc: 'Passive · +5% damage and +2% critical chance per point while shapeshifted.',
                    tip: 'Max lvl (20): +100% damage · +40% crit.',
                    maxPts: 20
                },
                {
                    id: 'maul', row: 2, col: 0, type: 'active', icon: '🐻', name: 'Maul',
                    desc: 'Active · A bear swipe dealing base + 150% weapon damage and stunning for 1s.',
                    tip: 'Max lvl (20): Heavy melee scaling + stun.',
                    maxPts: 20, mana: 8, cd: 3, group: 'melee', dmgBase: 35, dmgPerLvl: 15, wepPct: 150, req: 'bear_form:1',
                    synergies: [{ from: 'bear_slam', pctPerPt: 4 }]
                },
                {
                    id: 'shred', row: 2, col: 2, type: 'active', icon: '🐾', name: 'Shred',
                    desc: 'Active · Shred for base + 120% weapon damage. Deals 30% more if target is bleeding.',
                    tip: 'Max lvl (20): Fast wolf DPS scaling.',
                    maxPts: 20, mana: 6, cd: 0, group: 'melee', dmgBase: 30, dmgPerLvl: 12, wepPct: 120, req: 'dire_wolf:1',
                    synergies: [{ from: 'lacerate', pctPerPt: 4 }]
                },
                {
                    id: 'bear_slam', row: 3, col: 0, type: 'active', icon: '💥', name: 'Bear Slam',
                    desc: 'Active · Shockwave dealing base + 100% weapon damage and stunning for 1.5s.',
                    tip: 'Max lvl (20): Area stun with weapon scaling.',
                    maxPts: 20, mana: 12, cd: 8, group: 'melee', dmgBase: 25, dmgPerLvl: 10, wepPct: 100, req: 'maul:5',
                    synergies: [{ from: 'maul', pctPerPt: 10 }]
                },
                {
                    id: 'lacerate', row: 3, col: 2, type: 'active', icon: '🩸', name: 'Lacerate',
                    desc: 'Active · Lacerate for base + 80% weapon damage and causing heavy bleeding.',
                    tip: 'Max lvl (20): High bleed utility scaling.',
                    maxPts: 20, mana: 8, cd: 3, group: 'melee', dmgBase: 10, dmgPerLvl: 5, wepPct: 80, req: 'shred:5',
                    synergies: [{ from: 'shred', pctPerPt: 10 }]
                },
                {
                    id: 'feral_charge', row: 4, col: 1, type: 'active', icon: '🏃', name: 'Feral Charge',
                    desc: 'Active · Charge for base + 110% weapon damage and immobilize for 2s.',
                    tip: 'Max lvl (20): Gap closer with solid scaling.',
                    maxPts: 20, mana: 10, cd: 12, group: 'melee', dmgBase: 20, dmgPerLvl: 10, wepPct: 110, req: 'feral_mastery:5'
                },
                {
                    id: 'king_of_the_jungle', row: 5, col: 1, type: 'active', icon: '👑', name: 'King of Jungle',
                    desc: 'Active · Enter a state of primal fury: +50% damage and haste for 15 seconds. 120s cooldown.',
                    tip: 'Max lvl (20): Primal power burst.',
                    maxPts: 20, mana: 20, cd: 120, group: 'buff', req: 'feral_charge:5'
                }
            ]
        },

        // ═══ NATURE — Elemental build ═══
        {
            id: 'nature', name: 'Nature', icon: '🌿',
            nodes: [
                {
                    id: 'twister', row: 0, col: 1, type: 'active', icon: '🌪️', name: 'Twister',
                    desc: 'Active · Launch a tornado dealing base + 60% weapon damage as lightning.',
                    tip: 'Max lvl (20): Spammable elemental scaling.',
                    maxPts: 20, mana: 10, cd: 1, group: 'lightning', dmgBase: 15, dmgPerLvl: 8, wepPct: 60,
                    synergies: [{ from: 'hurricane', pctPerPt: 5 }]
                },
                {
                    id: 'nature_mastery', row: 1, col: 0, type: 'passive', icon: '🌿', name: 'Nature Mastery',
                    desc: 'Passive · +3% fire, cold, and lightning damage per point.',
                    tip: 'Max lvl (20): +60% elemental damage.',
                    maxPts: 20
                },
                {
                    id: 'cyclone_armor', row: 1, col: 2, type: 'active', icon: '🌬️', name: 'Cyclone Armor',
                    desc: 'Active · A shield of wind that absorbs 20 + 15 per point elemental damage.',
                    tip: 'Max lvl (20): 320 elemental absorption.',
                    maxPts: 20, mana: 12, cd: 0, group: 'buff', req: 'twister:3'
                },
                {
                    id: 'hurricane', row: 2, col: 1, type: 'active', icon: '🌀', name: 'Hurricane',
                    desc: 'Active · Deals base + 40% weapon damage per second as cold.',
                    tip: 'Max lvl (20): Persistent cold AoE scaling.',
                    maxPts: 20, mana: 20, cd: 12, group: 'cold', dmgBase: 12, dmgPerLvl: 6, wepPct: 40, req: 'nature_mastery:5',
                    synergies: [{ from: 'twister', pctPerPt: 10 }]
                },
                {
                    id: 'solar_beam', row: 3, col: 0, type: 'active', icon: '☀️', name: 'Solar Beam',
                    desc: 'Active · A beam dealing base + 180% weapon damage as fire and silencing.',
                    tip: 'Max lvl (20): High burst fire scaling.',
                    maxPts: 20, mana: 15, cd: 15, group: 'fire', dmgBase: 40, dmgPerLvl: 15, wepPct: 180, req: 'hurricane:5',
                    synergies: [{ from: 'nature_mastery', pctPerPt: 5 }]
                },
                {
                    id: 'armageddon', row: 3, col: 2, type: 'active', icon: '☄️', name: 'Armageddon',
                    desc: 'Active · Rain meteors dealing base + 130% weapon damage as fire.',
                    tip: 'Max lvl (20): Ultimate fire storm scaling.',
                    maxPts: 20, mana: 40, cd: 60, group: 'fire', dmgBase: 30, dmgPerLvl: 12, wepPct: 130, req: 'hurricane:5',
                    synergies: [{ from: 'nature_mastery', pctPerPt: 5 }]
                },
                {
                    id: 'force_of_nature', row: 4, col: 1, type: 'active', icon: '🌳', name: 'Force of Nature',
                    desc: 'Active · Summon 3 Treants dealing base + 35% weapon damage.',
                    tip: 'Max lvl (20): Scaling nature army.',
                    maxPts: 20, mana: 25, cd: 45, dmgBase: 12, dmgPerLvl: 6, wepPct: 35, req: 'armageddon:5',
                    synergies: [
                        { from: 'nature_mastery', pctPerPt: 10 },
                        { from: 'dire_wolf', pctPerPt: 5 }
                    ]
                },
                {
                    id: 'starfall', row: 5, col: 1, type: 'active', icon: '🌠', name: 'Starfall',
                    desc: 'Active · Shower area with stars dealing base + 200% weapon damage as arcane.',
                    tip: 'Max lvl (20): Screen-wide arcane scaling.',
                    maxPts: 20, mana: 40, cd: 60, group: 'magic', dmgBase: 50, dmgPerLvl: 20, wepPct: 200, req: 'force_of_nature:5',
                    synergies: [{ from: 'nature_mastery', pctPerPt: 5 }]
                },
                {
                    id: 'entangling_roots', row: 5, col: 0, type: 'active', icon: '🌿', name: 'Entangling Roots',
                    desc: 'Active · Root target and deal base + 50% weapon damage per second.',
                    tip: 'Max lvl (20): Scaling DoT + crowd control.',
                    maxPts: 20, mana: 15, cd: 5, group: 'earth', dmgBase: 15, dmgPerLvl: 5, wepPct: 50, req: 'force_of_nature:1'
                }
            ]
        },

        // ═══ HEALING — Restoration build ═══
        {
            id: 'healing', name: 'Healing', icon: '💚',
            nodes: [
                {
                    id: 'healing_touch', row: 0, col: 1, type: 'active', icon: '💚', name: 'Healing Touch',
                    desc: 'Active · Heals for 35 + 15 per point HP instantly.',
                    tip: 'Max lvl (20): 335 HP heal.',
                    maxPts: 20, mana: 15, cd: 0
                },
                {
                    id: 'rejuvenation', row: 1, col: 0, type: 'active', icon: '🌱', name: 'Rejuvenation',
                    desc: 'Active · Heals for 10 + 4 per point HP per second for 8 seconds.',
                    tip: 'Max lvl (20): 90/s HoT.',
                    maxPts: 20, mana: 12, cd: 0
                },
                {
                    id: 'innervate', row: 1, col: 2, type: 'active', icon: '💎', name: 'Innervate',
                    desc: 'Active · Restores 20 + 5 per point mana per second for 10 seconds.',
                    tip: 'Max lvl (20): 120/s mana regen.',
                    maxPts: 20, mana: 0, cd: 60, req: 'healing_touch:3'
                },
                {
                    id: 'regrowth', row: 2, col: 1, type: 'active', icon: '🌿', name: 'Regrowth',
                    desc: 'Active · Heals for 50 + 20 HP instantly + 8 + 4 HP/s for 15s.',
                    tip: 'Max lvl (20): Strong hybrid heal.',
                    maxPts: 20, mana: 20, cd: 2, req: 'rejuvenation:3'
                },
                {
                    id: 'tranquility', row: 3, col: 0, type: 'active', icon: '☮️', name: 'Tranquility',
                    desc: 'Active · Channel healing ALL allies for 20 + 8 per point HP per second.',
                    tip: 'Max lvl (20): Massive party heal.',
                    maxPts: 20, mana: 30, cd: 45, req: 'regrowth:5'
                },
                {
                    id: 'wild_growth', row: 3, col: 2, type: 'active', icon: '🌻', name: 'Wild Growth',
                    desc: 'Active · Heals up to 5 allies for 15 + 6 HP/s for 7 seconds.',
                    tip: 'Max lvl (20): Smart group HoT.',
                    maxPts: 20, mana: 35, cd: 30, req: 'regrowth:5'
                },
                {
                    id: 'tree_of_life', row: 4, col: 1, type: 'active', icon: '🌳', name: 'Tree of Life',
                    desc: 'Active (Toggle) · Transform into a Tree: +100% healing and +50% armor.',
                    tip: 'Max lvl (20): Ultimate healing form.',
                    maxPts: 20, mana: 25, cd: 0, group: 'buff', req: 'tranquility:5'
                }
            ]
        },
    ]
};
