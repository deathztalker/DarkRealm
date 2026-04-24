/**
 * WARRIOR — Class Definition
 * Three trees: Combat (berserker DPS) · Defense (tank) · Battle (support shouts)
 */
export const WARRIOR_CLASS = {
    id: 'warrior', name: 'Warrior', icon: '⚔️',
    description: 'A master of melee combat who overwhelms enemies with brute force or anchors the party with impenetrable defenses.',
    stats: { str: 30, dex: 20, vit: 25, int: 5 },
    hitDie: 12,
    primaryStat: 'str',
    trees: [

        // ═══ COMBAT — Berserker DPS build ═══
        {
            id: 'combat', name: 'Combat', icon: '🗡️',
            nodes: [
                {
                    id: 'bash', row: 0, col: 1, type: 'active', icon: '🪓', name: 'Bash',
                    desc: 'Active · Strike for 15 + 8 per point physical damage. Each hit has a 20% chance to stun for 0.8s. A reliable bread-and-butter attack.',
                    tip: 'Max lvl (20): 175 damage · stun chance 20% always.',
                    maxPts: 20, mana: 3, cd: 1.5, group: 'melee', dmgBase: 15, dmgPerLvl: 8
                },
                {
                    id: 'combat_mastery', row: 1, col: 0, type: 'passive', icon: '💪', name: 'Combat Mastery',
                    desc: 'Passive · +5% weapon damage and +2% critical chance per point. At 10 points, critical hits also deal +15% bonus multiplier.',
                    tip: 'Max lvl (20): +100% dmg · +40% crit chance · +15% crit multiplier at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'bloodthirst', row: 1, col: 2, type: 'active', icon: '🩸', name: 'Bloodthirst',
                    desc: 'Active · Instantly strike the enemy for 25 + 12 per point damage and heal for 4% of your maximum health. 4s cooldown.',
                    tip: 'Max lvl (20): 265 damage · 4% max HP heal per hit. Essential sustain.',
                    maxPts: 20, mana: 5, cd: 4, group: 'melee', dmgBase: 25, dmgPerLvl: 12, req: 'bash:3',
                    synergies: [{ from: 'combat_mastery', pctPerPt: 2 }]
                },
                {
                    id: 'double_swing', row: 2, col: 0, type: 'active', icon: '⚔️', name: 'Double Swing',
                    desc: 'Active · Swing twice in quick succession dealing 20 + 7 per point each hit. If both hit the same target, the second hit is always a critical strike.',
                    tip: 'Max lvl (20): 2× 160 damage · 2nd hit guaranteed crit.',
                    maxPts: 20, mana: 5, cd: 2, group: 'melee', dmgBase: 20, dmgPerLvl: 7, req: 'bash:5',
                    synergies: [{ from: 'bash', pctPerPt: 5 }]
                },
                {
                    id: 'whirlwind', row: 2, col: 1, type: 'active', icon: '🌀', name: 'Whirlwind',
                    desc: 'Active · Spin and hit ALL nearby enemies for 30 + 10 per point physical damage. 2.5s channel, zero mana cost. Your best AoE clear tool.',
                    tip: 'Max lvl (20): 230 damage to every enemy in melee range · 0 mana.',
                    maxPts: 20, mana: 0, cd: 5, group: 'melee', dmgBase: 30, dmgPerLvl: 10, req: 'double_swing:3',
                    synergies: [{ from: 'double_swing', pctPerPt: 5 }, { from: 'bash', pctPerPt: 5 }]
                },
                {
                    id: 'colossus_strike', row: 3, col: 0, type: 'active', icon: '🔨', name: 'Colossus Strike',
                    desc: 'Active · A heavy smash that deals 60 + 25 per point damage and reduces the target\'s armor by 50% for 8 seconds. 20s cooldown.',
                    tip: 'Max lvl (20): 560 damage · -50% enemy armor. Huge damage multiplier.',
                    maxPts: 20, mana: 15, cd: 20, group: 'melee', dmgBase: 60, dmgPerLvl: 25, req: 'whirlwind:5',
                    synergies: [{ from: 'execute', pctPerPt: 5 }]
                },
                {
                    id: 'berserk', row: 3, col: 2, type: 'active', icon: '😤', name: 'Berserk',
                    desc: 'Active · Enter a rage for 8 + 0.5 per point seconds: +40% attack speed, +80% damage, -25% defense.',
                    tip: 'Max lvl (20): 18s duration · massive damage window.',
                    maxPts: 20, mana: 10, cd: 30, req: 'whirlwind:5'
                },
                {
                    id: 'execute', row: 4, col: 1, type: 'active', icon: '💀', name: 'Execute',
                    desc: 'Active · A powerful finisher dealing 50 + 20 per point damage. Against enemies below 30% HP it deals TRIPLE damage.',
                    tip: 'Max lvl (20): 450 base · 1,350 vs low-HP targets.',
                    maxPts: 20, mana: 15, cd: 6, group: 'melee', dmgBase: 50, dmgPerLvl: 20, req: 'berserk:10',
                    synergies: [{ from: 'combat_mastery', pctPerPt: 5 }]
                },
                {
                    id: 'bladestorm', row: 5, col: 1, type: 'active', icon: '🌪️', name: 'Bladestorm',
                    desc: 'Active · Become an unstoppable whirlwind of steel for 6 seconds, hitting all nearby enemies twice per second for 40 + 15 per point damage. You are immune to all CC while active. 90s cooldown.',
                    tip: 'Max lvl (20): 120 hits × 340 damage = 4,080 total AoE. The ultimate combat capstone.',
                    maxPts: 20, mana: 25, cd: 90, group: 'melee', dmgBase: 40, dmgPerLvl: 15, req: 'execute:5',
                    synergies: [{ from: 'whirlwind', pctPerPt: 10 }]
                },
                {
                    id: 'mortal_strike', row: 5, col: 0, type: 'active', icon: '🩸', name: 'Mortal Strike',
                    desc: 'Active · A vicious strike dealing 40 + 15 per point damage and reducing the target\'s healing received by 50% for 10s.',
                    tip: 'Max lvl (20): 340 damage + 50% anti-heal. Counters vampiric enemies.',
                    maxPts: 20, mana: 12, cd: 6, group: 'melee', dmgBase: 40, dmgPerLvl: 15, req: 'colossus_strike:5',
                    synergies: [{ from: 'bash', pctPerPt: 10 }]
                },
                {
                    id: 'overpower', row: 5, col: 2, type: 'active', icon: '⚡', name: 'Overpower',
                    desc: 'Active · Instantly strike for 30 + 10 per point damage. This attack CANNOT be dodged or blocked, and has a +50% chance to crit.',
                    tip: 'Max lvl (20): 230 unblockable damage. Perfect against evasive targets.',
                    maxPts: 20, mana: 5, cd: 4, group: 'melee', dmgBase: 30, dmgPerLvl: 10, req: 'berserk:5'
                }
            ]
        },

        // ═══ DEFENSE — Immortal Wall tank build ═══
        {
            id: 'defense', name: 'Defense', icon: '🛡️',
            nodes: [
                {
                    id: 'shield_bash', row: 0, col: 1, type: 'active', icon: '🛡️', name: 'Shield Bash',
                    desc: 'Active · Slam your shield for 18 + 6 per point damage and stun the target for 1.5 + 0.05 per point seconds. Requires a shield equipped.',
                    tip: 'Max lvl (20): 138 damage · 2.5s stun. Primary crowd control.',
                    maxPts: 20, mana: 6, cd: 6, group: 'melee', dmgBase: 18, dmgPerLvl: 6,
                    synergies: [{ from: 'iron_skin', pctPerPt: 5 }]
                },
                {
                    id: 'iron_skin', row: 1, col: 0, type: 'passive', icon: '🧱', name: 'Iron Skin',
                    desc: 'Passive · +8% armor from all sources per point. At 10 points, also reduces all incoming physical damage by 5%.',
                    tip: 'Max lvl (20): +160% armor · 5% physical DR at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'spell_reflection', row: 1, col: 2, type: 'active', icon: '✨', name: 'Spell Reflection',
                    desc: 'Active · Raise your shield to reflect the next 1 + 0.1 per point hostile spells back at the caster. Lasts 5 seconds. 15s cooldown.',
                    tip: 'Max lvl (20): Reflect up to 3 spells. Hard counter to casters.',
                    maxPts: 20, mana: 8, cd: 15, req: 'shield_bash:3'
                },
                {
                    id: 'block_mastery', row: 2, col: 0, type: 'passive', icon: '🛡️', name: 'Block Mastery',
                    desc: 'Passive · +3% block chance per point. At 15 points, blocked attacks deal only 50% damage instead of being fully blocked.',
                    tip: 'Max lvl (20): +60% block chance (hard cap 75%).',
                    maxPts: 20
                },
                {
                    id: 'revenge', row: 2, col: 1, type: 'active', icon: '⚡', name: 'Revenge',
                    desc: 'Active · After blocking an attack, your NEXT hit deals 25 + 10 per point damage and heals you for 20% of damage dealt. No mana cost.',
                    tip: 'Max lvl (20): 225 damage · heals you for up to 45 HP per proc.',
                    maxPts: 20, mana: 0, cd: 2, group: 'melee', dmgBase: 25, dmgPerLvl: 10, req: 'block_mastery:5',
                    synergies: [{ from: 'block_mastery', pctPerPt: 10 }]
                },
                {
                    id: 'taunt', row: 3, col: 0, type: 'active', icon: '📢', name: 'Taunt',
                    desc: 'Active · Force ALL nearby enemies to attack only you for 4 + 0.2 per point seconds. You also gain +20 + 2% armor per point while it is active.',
                    tip: 'Max lvl (20): 8s forced aggro · +60% bonus armor. Core tank tool.',
                    maxPts: 20, mana: 5, cd: 12, req: 'iron_skin:3'
                },
                {
                    id: 'fortify', row: 3, col: 2, type: 'active', icon: '🏰', name: 'Fortify',
                    desc: 'Active · Harden your body for 6 seconds, reducing ALL damage taken by 40 + 2% per point. Blocked damage during Fortify is reflected back to the attacker.',
                    tip: 'Max lvl (20): 80% damage reduction for 6s — near invulnerability window.',
                    maxPts: 20, mana: 10, cd: 30, req: 'iron_skin:10'
                },
                {
                    id: 'vanguard', row: 4, col: 1, type: 'passive', icon: '🛡️', name: 'Vanguard',
                    desc: 'Passive · You and all nearby allies gain +2% damage reduction per point. Additionally, your Presence increases the damage of nearby allies by 1% per point.',
                    tip: 'Max lvl (20): +40% party DR · +20% party damage. The ultimate tank aura.',
                    maxPts: 20, req: 'fortify:5'
                },
                {
                    id: 'last_stand', row: 5, col: 1, type: 'active', icon: '💎', name: 'Last Stand',
                    desc: 'Active · Triggers automatically when your HP drops below 20%. Instantly grants a shield equal to 30 + 5% of your max HP per point and boosts your damage by +100% for 8 seconds.',
                    tip: 'Max lvl (20): Shield = 130% max HP · +100% damage.',
                    maxPts: 20, mana: 0, cd: 120, req: 'vanguard:5'
                },
                {
                    id: 'second_wind', row: 5, col: 0, type: 'passive', icon: '🌬️', name: 'Second Wind',
                    desc: 'Passive · Whenever you are below 35% health, you regenerate 2% + 0.2% per point of your maximum health per second.',
                    tip: 'Max lvl (20): 6% max HP regen per second when low.',
                    maxPts: 20, req: 'vanguard:5'
                },
                {
                    id: 'ignore_pain', row: 6, col: 1, type: 'active', icon: '💢', name: 'Ignore Pain',
                    desc: 'Active · Fight through the pain, absorbing 50% of all incoming damage up to a cap of 100 + 40 per point total damage absorbed. Lasts 10s.',
                    tip: 'Max lvl (20): Absorbs up to 900 damage.',
                    maxPts: 20, mana: 15, cd: 15, group: 'buff', req: 'last_stand:5'
                }
            ]
        },

        // ═══ BATTLE — Warlord support/nuke build ═══
        {
            id: 'battle', name: 'Battle', icon: '📯',
            nodes: [
                {
                    id: 'warcry', row: 0, col: 1, type: 'active', icon: '📯', name: 'Warcry',
                    desc: 'Active · Shout to boost your entire party\'s attack speed by 20 + 2% per point for 30 + 2 per point seconds.',
                    tip: 'Max lvl (20): +60% attack speed for 70s. Huge party DPS buff.',
                    maxPts: 20, mana: 8, cd: 60
                },
                {
                    id: 'shout', row: 1, col: 0, type: 'active', icon: '🔊', name: 'Shout',
                    desc: 'Active · Increase your entire party\'s armor by 50 + 3% per point for 30 + 2 per point seconds.',
                    tip: 'Max lvl (20): +110% party armor for 70s.',
                    maxPts: 20, mana: 8, cd: 60
                },
                {
                    id: 'leap_attack', row: 1, col: 2, type: 'active', icon: '🦘', name: 'Leap Attack',
                    desc: 'Active · Leap to a target location, dealing 25 + 12 per point physical AoE damage on landing and stunning enemies for 0.5s.',
                    tip: 'Max lvl (20): 265 AoE damage on landing.',
                    maxPts: 20, mana: 9, cd: 8, group: 'melee', dmgBase: 25, dmgPerLvl: 12,
                    synergies: [{ from: 'slam', pctPerPt: 5 }]
                },
                {
                    id: 'battle_orders', row: 2, col: 1, type: 'active', icon: '📋', name: 'Battle Orders',
                    desc: 'Active · Boost your entire party\'s maximum HP and Mana by 5 + 1.5% per point for 60 + 3 per point seconds.',
                    tip: 'Max lvl (20): +35% HP and Mana for 120s.',
                    maxPts: 20, mana: 14, cd: 60, req: 'warcry:5',
                    synergies: [{ from: 'shout', pctPerPt: 4 }]
                },
                {
                    id: 'shockwave', row: 3, col: 0, type: 'active', icon: '🌊', name: 'Shockwave',
                    desc: 'Active · Bellow a mighty shout that sends a wave of force forward, dealing 40 + 15 per point damage and stunning all enemies hit for 2 seconds. 12s cooldown.',
                    tip: 'Max lvl (20): 340 damage · 2s AoE stun. Massive control.',
                    maxPts: 20, mana: 12, cd: 12, group: 'melee', dmgBase: 40, dmgPerLvl: 15, req: 'shout:5',
                    synergies: [{ from: 'warcry', pctPerPt: 5 }]
                },
                {
                    id: 'slam', row: 3, col: 2, type: 'active', icon: '💥', name: 'Ground Slam',
                    desc: 'Active · Smash the ground to send a shockwave in a line, dealing 40 + 18 per point physical AoE damage.',
                    tip: 'Max lvl (20): 400 AoE shockwave damage.',
                    maxPts: 20, mana: 14, cd: 10, group: 'melee', dmgBase: 40, dmgPerLvl: 18, req: 'leap_attack:5',
                    synergies: [{ from: 'leap_attack', pctPerPt: 10 }]
                },
                {
                    id: 'shattering_throw', row: 4, col: 1, type: 'active', icon: '🎯', name: 'Shattering Throw',
                    desc: 'Active · Throw your weapon at a target, dealing 80 + 30 per point damage and shattering all magical shields/absorbs. Deals double damage to invulnerable targets. 30s cooldown.',
                    tip: 'Max lvl (20): 680 damage · breaks Divine Shield / Bone Armor. The ultimate utility nuke.',
                    maxPts: 20, mana: 20, cd: 30, dmgBase: 80, dmgPerLvl: 30, req: 'battle_orders:5',
                    synergies: [{ from: 'combat_mastery', pctPerPt: 5 }]
                },
                {
                    id: 'blood_rage', row: 4, col: 0, type: 'active', icon: '🩸', name: 'Blood Rage',
                    desc: 'Active · Sacrifice 20% of your current HP to enter a blood frenzy, increasing all physical damage dealt by 20% + 2% per point for 10s.',
                    tip: 'Max lvl (20): +60% damage multiplier at a cost of blood.',
                    maxPts: 20, mana: 0, cd: 30, group: 'buff', req: 'battle_orders:3'
                },
                {
                    id: 'piercing_howl', row: 4, col: 2, type: 'active', icon: '🐺', name: 'Piercing Howl',
                    desc: 'Active · Let out a piercing howl, slowing all nearby enemies by 50% and reducing their armor by 10 + 2% per point for 8s.',
                    tip: 'Max lvl (20): 50% slow and -50% armor AoE.',
                    maxPts: 20, mana: 10, cd: 15, group: 'melee', dmgBase: 0, dmgPerLvl: 0, req: 'battle_orders:3'
                },
                {
                    id: 'avatar_of_war', row: 5, col: 1, type: 'active', icon: '⚡', name: 'Avatar of War',
                    desc: 'Active · Transform into a towering war titan for 15s: grow to double size, gain 50 + 5% per point bonus damage, and ALL shouts are automatically refreshed.',
                    tip: 'Max lvl (20): +150% damage · refreshes Warcry, Shout, and Battle Orders.',
                    maxPts: 20, mana: 20, cd: 180, req: 'shattering_throw:5'
                },
                {
                    id: 'heroic_leap', row: 5, col: 2, type: 'active', icon: '☄️', name: 'Heroic Leap',
                    desc: 'Active · Leap through the air to a target location, dealing 30 + 15 per point physical damage to all enemies within 50px upon landing.',
                    tip: 'Max lvl (20): 330 AoE damage + extreme mobility.',
                    maxPts: 20, mana: 15, cd: 12, group: 'teleport', dmgBase: 30, dmgPerLvl: 15, req: 'slam:5',
                    synergies: [{ from: 'leap_attack', pctPerPt: 10 }]
                },
                {
                    id: 'titanic_might', row: 6, col: 1, type: 'passive', icon: '👑', name: 'Titanic Might',
                    desc: 'Passive · You can now dual-wield two-handed weapons. Additionally, each point in this skill increases your Strength by 5% and your total Armor by 2%.',
                    tip: 'Max lvl (1): Dual-wield 2H weapons! The ultimate warrior fantasy.',
                    maxPts: 1, req: 'avatar_of_war:1'
                }
            ]
        },
    ]
};
