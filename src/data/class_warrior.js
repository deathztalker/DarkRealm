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
                    desc: 'Passive · +5% weapon damage and +2% critical chance per point. At 10 points, critical hits also deal +15% bonus multiplier. Your core damage passive — invest early.',
                    tip: 'Max lvl (20): +100% dmg · +40% crit chance · +15% crit multiplier at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'double_swing', row: 1, col: 2, type: 'active', icon: '⚔️', name: 'Double Swing',
                    desc: 'Active · Swing twice in quick succession dealing 20 + 7 per point each hit. If both hit the same target, the second hit is always a critical strike.',
                    tip: 'Max lvl (20): 2× 160 damage · 2nd hit guaranteed crit.',
                    maxPts: 20, mana: 5, cd: 2, group: 'melee', dmgBase: 20, dmgPerLvl: 7,
                    req: 'bash:3'
                },
                {
                    id: 'whirlwind', row: 2, col: 1, type: 'active', icon: '🌀', name: 'Whirlwind',
                    desc: 'Active · Spin and hit ALL nearby enemies for 30 + 10 per point physical damage. 2.5s channel, zero mana cost. Your best AoE clear tool.',
                    tip: 'Max lvl (20): 230 damage to every enemy in melee range · 0 mana.',
                    maxPts: 20, mana: 0, cd: 5, group: 'melee', dmgBase: 30, dmgPerLvl: 10,
                    req: 'bash:5'
                },
                {
                    id: 'berserk', row: 3, col: 0, type: 'active', icon: '😤', name: 'Berserk',
                    desc: 'Active · Enter a rage for 8 + 0.5 per point seconds: +40% attack speed, +80% damage, -25% defense. Combines with Whirlwind for devastating AoE.',
                    tip: 'Max lvl (20): 18s duration · massive damage window.',
                    maxPts: 20, mana: 10, cd: 30, req: 'whirlwind:5'
                },
                {
                    id: 'cleave', row: 3, col: 2, type: 'active', icon: '🪓', name: 'Cleave',
                    desc: 'Active · A wide arc swing that hits up to 3 enemies for 20 + 12 per point. Each target beyond the first takes -20% reduced damage. Great for grouped enemies.',
                    tip: 'Max lvl (20): 260 base · 208 / 208 on 2nd and 3rd targets.',
                    maxPts: 20, mana: 7, cd: 4, group: 'melee', dmgBase: 20, dmgPerLvl: 12,
                    req: 'whirlwind:5'
                },
                {
                    id: 'execute', row: 4, col: 1, type: 'active', icon: '💀', name: 'Execute',
                    desc: 'Active · A powerful finisher dealing 50 + 20 per point damage. Against enemies below 30% HP it deals TRIPLE damage. The ultimate boss-killer.',
                    tip: 'Max lvl (20): 450 base · 1,350 vs low-HP targets.',
                    maxPts: 20, mana: 15, cd: 6, group: 'melee', dmgBase: 50, dmgPerLvl: 20,
                    req: 'berserk:10',
                    synergies: [{ from: 'combat_mastery', pctPerPt: 3 }]
                },
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
                    maxPts: 20, mana: 6, cd: 6, dmgBase: 18, dmgPerLvl: 6
                },
                {
                    id: 'iron_skin', row: 1, col: 0, type: 'passive', icon: '🧱', name: 'Iron Skin',
                    desc: 'Passive · +8% armor from all sources per point. At 10 points, also reduces all incoming physical damage by 5%. Stack with heavy plate for massive mitigation.',
                    tip: 'Max lvl (20): +160% armor · 5% physical DR at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'block_mastery', row: 1, col: 2, type: 'passive', icon: '🛡️', name: 'Block Mastery',
                    desc: 'Passive · +3% block chance per point. At 15 points, blocked attacks deal only 50% damage instead of being fully blocked PLUS you gain life on block.',
                    tip: 'Max lvl (20): +60% block chance (hard cap 75%).',
                    maxPts: 20
                },
                {
                    id: 'revenge', row: 2, col: 0, type: 'active', icon: '⚡', name: 'Revenge',
                    desc: 'Active · After blocking an attack, your NEXT hit deals 25 + 10 per point damage and heals you for 20% of damage dealt. No mana cost.',
                    tip: 'Max lvl (20): 225 damage · heals you for up to 45 HP per proc.',
                    maxPts: 20, mana: 0, cd: 2, group: 'melee', dmgBase: 25, dmgPerLvl: 10,
                    req: 'block_mastery:5'
                },
                {
                    id: 'taunt', row: 2, col: 1, type: 'active', icon: '📢', name: 'Taunt',
                    desc: 'Active · Force ALL nearby enemies to attack only you for 4 + 0.2 per point seconds. You also gain +20 + 2% armor per point while it is active.',
                    tip: 'Max lvl (20): 8s forced aggro · +60% bonus armor. Core tank tool.',
                    maxPts: 20, mana: 5, cd: 12, req: 'iron_skin:3'
                },
                {
                    id: 'fortify', row: 3, col: 0, type: 'active', icon: '🏰', name: 'Fortify',
                    desc: 'Active · Harden your body for 6 seconds, reducing ALL damage taken by 40 + 2% per point. Blocked damage during Fortify is reflected back to the attacker.',
                    tip: 'Max lvl (20): 80% damage reduction for 6s — near invulnerability window.',
                    maxPts: 20, mana: 10, cd: 30, req: 'iron_skin:10'
                },
                {
                    id: 'life_tap', row: 3, col: 2, type: 'passive', icon: '❤️', name: 'Life Tap',
                    desc: 'Passive · +0.5% life steal on every physical attack per point. At 15 points, blocking an attack also heals you for 30 HP. Stack with high block for infinite sustain.',
                    tip: 'Max lvl (20): 10.5% life steal · +block heal at 15pts.',
                    maxPts: 20, req: 'block_mastery:5'
                },
                {
                    id: 'last_stand', row: 4, col: 1, type: 'active', icon: '💎', name: 'Last Stand',
                    desc: 'Active · Triggers automatically when your HP drops below 20%. Instantly grants a shield equal to 30 + 5% of your max HP per point and boosts your damage by +100% for 8 seconds. Cooldown: 120s.',
                    tip: 'Max lvl (20): Shield = 130% max HP · +100% damage. The "I refuse to die" cooldown.',
                    maxPts: 20, mana: 0, cd: 120, req: 'fortify:10',
                    synergies: [{ from: 'iron_skin', pctPerPt: 3 }]
                },
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
                    desc: 'Active · Increase your entire party\'s armor by 50 + 3% per point for 30 + 2 per point seconds. Your core defensive party buff.',
                    tip: 'Max lvl (20): +110% party armor for 70s.',
                    maxPts: 20, mana: 8, cd: 60
                },
                {
                    id: 'leap_attack', row: 1, col: 2, type: 'active', icon: '🦘', name: 'Leap Attack',
                    desc: 'Active · Leap to a target location, dealing 25 + 12 per point physical AoE damage on landing and stunning enemies for 0.5s. Gap closer + AoE opener.',
                    tip: 'Max lvl (20): 265 AoE damage on landing.',
                    maxPts: 20, mana: 9, cd: 8, group: 'melee', dmgBase: 25, dmgPerLvl: 12
                },
                {
                    id: 'battle_orders', row: 2, col: 1, type: 'active', icon: '📋', name: 'Battle Orders',
                    desc: 'Active · Boost your entire party\'s maximum HP and Mana by 5 + 1.5% per point for 60 + 3 per point seconds. The most important party buff in the game.',
                    tip: 'Max lvl (20): +35% HP and Mana for 120s.',
                    maxPts: 20, mana: 14, cd: 60, req: 'warcry:5'
                },
                {
                    id: 'commanding_shout', row: 2, col: 0, type: 'active', icon: '😤', name: 'Commanding Shout',
                    desc: 'Active · Bellow a terrifying war cry, causing all nearby enemies to flee in fear for 1 + 0.1 per point seconds and reducing their damage output by 20%.',
                    tip: 'Max lvl (20): 3s fear + 20% enemy damage penalty. Excellent emergency CD.',
                    maxPts: 20, mana: 12, cd: 20, req: 'shout:5'
                },
                {
                    id: 'slam', row: 3, col: 0, type: 'active', icon: '💥', name: 'Ground Slam',
                    desc: 'Active · Smash the ground to send a shockwave in a line, dealing 40 + 18 per point physical AoE damage. ★ Synergy: +4% damage per point in Leap Attack.',
                    tip: 'Max lvl (20): 400 AoE shockwave damage. Max synergy adds +80% more.',
                    maxPts: 20, mana: 14, cd: 10, group: 'melee', dmgBase: 40, dmgPerLvl: 18,
                    req: 'leap_attack:5',
                    synergies: [{ from: 'leap_attack', pctPerPt: 4 }]
                },
                {
                    id: 'avatar_of_war', row: 3, col: 2, type: 'active', icon: '⚡', name: 'Avatar of War',
                    desc: 'Active · Transform into a towering war titan for 15s: grow to double size, gain 50 + 5% per point bonus damage, and ALL shouts are automatically refreshed. 180s cooldown.',
                    tip: 'Max lvl (20): +150% damage · refreshes Warcry, Shout, and Battle Orders.',
                    maxPts: 20, mana: 20, cd: 180, req: 'battle_orders:10'
                },
                {
                    id: 'war_syn', row: 4, col: 1, type: 'synergy', icon: '🔗', name: 'Warlord Synergy',
                    desc: 'Passive · Each point in Shout adds +4% to Battle Orders effect. Each point in Leap Attack adds +3% to Ground Slam damage. Rewards deep investment in this tree.',
                    maxPts: 1, targetSkill: 'battle_orders', bonusPerPoint: '4%'
                },
            ]
        },
    ]
};
