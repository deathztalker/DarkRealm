/**
 * WARRIOR CLASS — Expanded endgame talent trees
 * 3 viable endgame builds:
 *   1. "Whirlwind Berserker" — Arms tree, Whirlwind + Berserk for massive melee AoE
 *   2. "Immortal Wall" — Defense tree, near-unkillable tank with life tap + fortify
 *   3. "Warlord" — Battle tree, BO/Shout support + Ground Slam/Leap nuke
 */
export const WARRIOR_CLASS = {
    id: 'warrior', name: 'Warrior', icon: '⚔️',
    desc: 'Master of steel and rage. Charges into the fray with devastating slams, shields allies with war cries, and becomes an unstoppable whirlwind of death.',
    stats: { str: 8, dex: 3, vit: 7, int: 2 },
    statBars: { str: 90, dex: 35, vit: 80, int: 20 },
    allowedWeapons: ['sword', 'axe', 'mace'],
    allowedOffhand: ['shield'],

    trees: [
        // ══════ ARMS — Whirlwind Berserker build ══════
        {
            id: 'arms', name: 'Arms', icon: '🗡️',
            nodes: [
                {
                    id: 'bash', row: 0, col: 1, type: 'active', icon: '💥', name: 'Bash',
                    desc: 'Powerful overhead strike dealing (15+slvl×8) physical damage. 10% chance to stun 0.5s.',
                    endgame: 'slvl 20: 175 dmg, reliable stun proc. Core combo point builder.',
                    maxPts: 20, mana: 4, cd: 0, group: 'melee', dmgBase: 15, dmgPerLvl: 8
                },

                {
                    id: 'double_swing', row: 1, col: 0, type: 'active', icon: '⚔️', name: 'Double Swing',
                    desc: 'Two rapid strikes at (12+slvl×6) each. Second hit has +15% crit chance.',
                    endgame: 'slvl 20: 132×2 = 264 total with bonus crit. Best single-target DPS filler.',
                    maxPts: 20, mana: 5, cd: 0, group: 'melee', dmgBase: 12, dmgPerLvl: 6, req: 'bash:1'
                },

                {
                    id: 'rend', row: 1, col: 2, type: 'active', icon: '🩸', name: 'Rend',
                    desc: 'Slash that applies bleed: (4+slvl×3) physical dmg/s for 5s. Stacks up to 3 times.',
                    endgame: 'slvl 20: 64/s ×3 stacks = 192 phys/s sustained DoT. Synergy with Whirlwind application.',
                    maxPts: 20, mana: 6, cd: 0, group: 'melee', dmgBase: 4, dmgPerLvl: 3, req: 'bash:3'
                },

                {
                    id: 'whirlwind', row: 2, col: 1, type: 'active', icon: '🌪️', name: 'Whirlwind',
                    desc: 'Spin dealing (10+slvl×7) physical damage per tick (6 ticks over 2s). Hits all enemies in radius. Applies Rend if learned.',
                    endgame: 'slvl 20: 150×6 = 900 total AoE. With Rend synergy, adds bleed to all targets hit.',
                    maxPts: 20, mana: 12, cd: 8, group: 'melee', dmgBase: 10, dmgPerLvl: 7, req: 'bash:5',
                    synergies: [{ from: 'bash', pctPerPt: 3 }, { from: 'rend', pctPerPt: 4 }]
                },

                {
                    id: 'combat_mastery', row: 2, col: 0, type: 'passive', icon: '📈', name: 'Combat Mastery',
                    desc: 'Passive. +5% physical damage and +2% critical strike chance per point.',
                    endgame: 'slvl 20: +100% phys dmg, +40% crit. Essential for all Arms builds.',
                    maxPts: 20
                },

                {
                    id: 'berserk', row: 3, col: 0, type: 'active', icon: '🔥', name: 'Berserk',
                    desc: 'Enter berserker rage for (8+slvl×0.5)s: +(80+slvl×4)% damage, -30% defense. Immune to fear/slow.',
                    endgame: 'slvl 20: 18s duration, +160% damage. Combine with Whirlwind for the ultimate AoE burst window.',
                    maxPts: 20, mana: 8, cd: 20, group: 'buff', dmgBase: 0, dmgPerLvl: 4, req: 'double_swing:5'
                },

                {
                    id: 'cleave', row: 3, col: 2, type: 'active', icon: '🪓', name: 'Cleave',
                    desc: 'Wide cone attack dealing (20+slvl×10) physical damage. Knocks back small enemies.',
                    endgame: 'slvl 20: 220 cone dmg with knockback. Excellent room clear for narrow corridors.',
                    maxPts: 20, mana: 7, cd: 4, group: 'melee', dmgBase: 20, dmgPerLvl: 10, req: 'whirlwind:5'
                },

                {
                    id: 'execute', row: 4, col: 1, type: 'active', icon: '💀', name: 'Execute',
                    desc: 'Massive finisher: (50+slvl×20) damage. Deals triple damage to enemies below 30% HP.',
                    endgame: 'slvl 20: 450 base, 1350 vs low HP targets. The endgame boss-killer finisher.',
                    maxPts: 20, mana: 15, cd: 6, group: 'melee', dmgBase: 50, dmgPerLvl: 20, req: 'berserk:10',
                    synergies: [{ from: 'combat_mastery', pctPerPt: 3 }]
                },
            ]
        },

        // ══════ DEFENSE — Immortal Wall build ══════
        {
            id: 'defense', name: 'Defense', icon: '🛡️',
            nodes: [
                {
                    id: 'shield_bash', row: 0, col: 1, type: 'active', icon: '🔰', name: 'Shield Bash',
                    desc: 'Slam with shield: (18+slvl×6) damage and stun for (1.5+slvl×0.05)s.',
                    endgame: 'slvl 20: 138 dmg + 2.5s stun. Primary crowd control tool.',
                    maxPts: 20, mana: 6, cd: 6, dmgBase: 18, dmgPerLvl: 6
                },

                {
                    id: 'iron_skin', row: 1, col: 0, type: 'passive', icon: '🪨', name: 'Iron Skin',
                    desc: 'Passive. +8% armor from all sources per point. At 10pts: +5% physical damage reduction.',
                    endgame: 'slvl 20: +160% armor, 10% phys DR. Makes plate wearers nearly immune to physical.',
                    maxPts: 20
                },

                {
                    id: 'block_mastery', row: 1, col: 2, type: 'passive', icon: '🔰', name: 'Block Mastery',
                    desc: 'Passive. +3% block chance per point. Blocked attacks deal -50% damage instead of full block at 15+ pts.',
                    endgame: 'slvl 20: +60% block chance (capped at 75%). Essential shield passive.',
                    maxPts: 20
                },

                {
                    id: 'revenge', row: 2, col: 0, type: 'active', icon: '💢', name: 'Revenge',
                    desc: 'Counter-attack: after blocking, next hit deals (25+slvl×10) and heals for 20% of damage dealt.',
                    endgame: 'slvl 20: 225 counter + 45 HP heal. Creates a sustain loop with high block chance.',
                    maxPts: 20, mana: 0, cd: 2, group: 'melee', dmgBase: 25, dmgPerLvl: 10, req: 'block_mastery:5'
                },

                {
                    id: 'taunt', row: 2, col: 1, type: 'active', icon: '😤', name: 'Taunt',
                    desc: 'Force all enemies in range to attack you for (4+slvl×0.2)s. Gain +(20+slvl×2)% armor while active.',
                    endgame: 'slvl 20: 8s forced aggro, +60% armor. Core tanking tool for party play.',
                    maxPts: 20, mana: 5, cd: 12, req: 'iron_skin:3'
                },

                {
                    id: 'fortify', row: 3, col: 0, type: 'active', icon: '🏰', name: 'Fortify',
                    desc: 'Harden defenses for 6s: (40+slvl×2)% damage reduction. Reflects 15% of blocked damage.',
                    endgame: 'slvl 20: 80% DR for 6s = near invulnerability window. Combine with block for reflect damage.',
                    maxPts: 20, mana: 10, cd: 30, req: 'iron_skin:10'
                },

                {
                    id: 'life_tap', row: 3, col: 2, type: 'passive', icon: '❤️', name: 'Life Tap',
                    desc: 'Passive. (1+slvl×0.5)% life steal on all physical attacks. At 15pts: blocked attacks also heal.',
                    endgame: 'slvl 20: 10.5% life steal. Combined with block heal = unkillable tank sustain.',
                    maxPts: 20, req: 'block_mastery:5'
                },

                {
                    id: 'last_stand', row: 4, col: 1, type: 'active', icon: '🔥', name: 'Last Stand',
                    desc: 'When HP drops below 20%: instantly gain (30+slvl×5)% max HP as shield. +100% damage for 8s. Once per 120s.',
                    endgame: 'slvl 20: 130% max HP shield on death trigger + damage boost. The ultimate "I refuse to die" skill.',
                    maxPts: 20, mana: 0, cd: 120, req: 'fortify:10',
                    synergies: [{ from: 'iron_skin', pctPerPt: 3 }]
                },
            ]
        },

        // ══════ BATTLE — Warlord support/nuke build ══════
        {
            id: 'battle', name: 'Battle', icon: '📯',
            nodes: [
                {
                    id: 'warcry', row: 0, col: 1, type: 'active', icon: '📣', name: 'Warcry',
                    desc: 'Party buff: +(20+slvl×2)% attack speed for 30+slvl×2s.',
                    endgame: 'slvl 20: +60% IAS for 70s. Massive party DPS boost.',
                    maxPts: 20, mana: 8, cd: 60
                },

                {
                    id: 'shout', row: 1, col: 0, type: 'active', icon: '🔊', name: 'Shout',
                    desc: 'Party buff: +(50+slvl×3)% armor for 30+slvl×2s.',
                    endgame: 'slvl 20: +110% armor for 70s. Core defensive party buff.',
                    maxPts: 20, mana: 8, cd: 60
                },

                {
                    id: 'leap_attack', row: 1, col: 2, type: 'active', icon: '🦘', name: 'Leap Attack',
                    desc: 'Leap to target location, deal (25+slvl×12) physical AoE on landing. Stuns 0.5s.',
                    endgame: 'slvl 20: 265 AoE + stun. Gap closer and AoE nuke. Synergizes with Ground Slam.',
                    maxPts: 20, mana: 9, cd: 8, group: 'melee', dmgBase: 25, dmgPerLvl: 12
                },

                {
                    id: 'battle_orders', row: 2, col: 1, type: 'active', icon: '⚔️', name: 'Battle Orders',
                    desc: 'Party buff: +(5+slvl×1.5)% max HP and MP for 60+slvl×3s.',
                    endgame: 'slvl 20: +35% max HP/MP for 120s. The single most important party buff in the game.',
                    maxPts: 20, mana: 14, cd: 60, req: 'warcry:5'
                },

                {
                    id: 'commanding_shout', row: 2, col: 0, type: 'active', icon: '🗣️', name: 'Commanding Shout',
                    desc: 'AoE war cry that fears all enemies in radius for (1+slvl×0.1)s and reduces their damage by 20%.',
                    endgame: 'slvl 20: 3s fear + 20% dmg reduction. Emergency crowd control.',
                    maxPts: 20, mana: 12, cd: 20, req: 'shout:5'
                },

                {
                    id: 'slam', row: 3, col: 0, type: 'active', icon: '💢', name: 'Ground Slam',
                    desc: 'Smash the ground sending a shockwave: (40+slvl×18) physical AoE damage in a line.',
                    endgame: 'slvl 20: 400 AoE in a line. Primary damage dealer for Battle builds.',
                    maxPts: 20, mana: 14, cd: 10, group: 'melee', dmgBase: 40, dmgPerLvl: 18, req: 'leap_attack:5',
                    synergies: [{ from: 'leap_attack', pctPerPt: 4 }]
                },

                {
                    id: 'avatar_of_war', row: 3, col: 2, type: 'active', icon: '👹', name: 'Avatar of War',
                    desc: 'Transform for 15s: +200% size, +(50+slvl×5)% damage, all shouts refresh. 180s CD.',
                    endgame: 'slvl 20: +150% dmg, refreshes all shouts. The ultimate warrior transformation.',
                    maxPts: 20, mana: 20, cd: 180, req: 'battle_orders:10'
                },

                {
                    id: 'war_syn', row: 4, col: 1, type: 'synergy', icon: '🔗', name: 'Warlord Synergy',
                    desc: '+4% Battle Orders effect per Shout point. +3% Ground Slam dmg per Leap Attack point.',
                    maxPts: 1, targetSkill: 'battle_orders', bonusPerPoint: '4%'
                },
            ]
        },
    ]
};
