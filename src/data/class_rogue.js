/**
 * ROGUE — Expanded endgame trees
 * Builds: 1. "Shadow Assassin" — burst from stealth  2. "Venomancer" — poison DoT stacking  3. "Trapmaster" — sentry turret DPS
 */
export const ROGUE_CLASS = {
    id: 'rogue', name: 'Rogue', icon: '🗡️',
    desc: 'Quick and deadly. Strikes from shadow, poisons blades, plants traps and vanishes before the enemy can react. The ultimate single-target damage dealer.',
    stats: { str: 4, dex: 9, vit: 4, int: 3 },
    statBars: { str: 40, dex: 95, vit: 40, int: 30 },
    allowedWeapons: ['dagger', 'sword', 'bow'],
    allowedOffhand: ['shield', 'dagger'],
    trees: [
        {
            id: 'assassination', name: 'Assassination', icon: '🗡️', nodes: [
                {
                    id: 'shadow_strike', row: 0, col: 1, type: 'active', icon: '🌑', name: 'Shadow Strike',
                    desc: 'Fast ranged shadow projectile: (10+slvl×6) shadow damage. Generates 1 combo point.',
                    endgame: 'slvl 20: 130 shadow. Ranged opener + combo builder. Shadow type bypasses armor.',
                    maxPts: 20, mana: 5, cd: 0, group: 'shadow', dmgBase: 10, dmgPerLvl: 6
                },
                {
                    id: 'backstab', row: 1, col: 0, type: 'active', icon: '🗡️', name: 'Backstab',
                    desc: 'Melee strike: (20+slvl×8). Triple damage from behind. Generates 2 combo points.',
                    endgame: 'slvl 20: 180 base, 540 from behind. Position-dependent high-skill play.',
                    maxPts: 20, mana: 8, cd: 3, group: 'melee', dmgBase: 20, dmgPerLvl: 8
                },
                {
                    id: 'ambush', row: 1, col: 2, type: 'active', icon: '⚡', name: 'Ambush',
                    desc: 'Instant teleport behind target + strike for (15+slvl×7). Always counts as behind. Generates 2 combo points.',
                    endgame: 'slvl 20: 155 + guaranteed backstab position. Eliminates positioning requirement.',
                    maxPts: 20, mana: 12, cd: 6, group: 'shadow', dmgBase: 15, dmgPerLvl: 7, req: 'backstab:3'
                },
                {
                    id: 'eviscerate', row: 2, col: 1, type: 'active', icon: '💉', name: 'Eviscerate',
                    desc: 'Finisher: spend all combo points. (30+slvl×15)×comboPoints damage. Max 5 combo pts.',
                    endgame: 'slvl 20: 330 × 5 = 1650 at full combo. The hardest hitting single-target skill in the game.',
                    maxPts: 20, mana: 10, cd: 0, group: 'melee', dmgBase: 30, dmgPerLvl: 15, req: 'backstab:5'
                },
                {
                    id: 'lethality', row: 2, col: 0, type: 'passive', icon: '📈', name: 'Lethality',
                    desc: '+3% crit chance and +10% crit multiplier per point. At 15pts: crits refund 30% mana.',
                    endgame: 'slvl 20: +60% crit, +200% crit multi. Crits mana-refund enables infinite combos.',
                    maxPts: 20
                },
                {
                    id: 'vanish', row: 3, col: 0, type: 'active', icon: '👁️', name: 'Vanish',
                    desc: 'Go invisible for (5+slvl×0.3)s. Next attack from stealth: guaranteed crit + (50+slvl×3)% bonus damage.',
                    endgame: 'slvl 20: 11s stealth, +110% bonus on opener. Vanish → Ambush → Eviscerate = one-shot combo.',
                    maxPts: 20, mana: 15, cd: 30, req: 'backstab:10'
                },
                {
                    id: 'shadow_dance', row: 3, col: 2, type: 'active', icon: '💃', name: 'Shadow Dance',
                    desc: 'Dash through (3+slvl/5) enemies dealing (15+slvl×8) shadow to each. Each hit generates 1 combo pt.',
                    endgame: 'slvl 20: hit 7 enemies for 175 each + 7 combo pts. AoE combo generator.',
                    maxPts: 20, mana: 14, cd: 12, group: 'shadow', dmgBase: 15, dmgPerLvl: 8, req: 'eviscerate:5'
                },
                {
                    id: 'death_mark', row: 4, col: 1, type: 'active', icon: '💀', name: 'Death Mark',
                    desc: 'Mark target for 10s: all damage dealt to target increased by (40+slvl×3)%. If target dies while marked, cooldowns reset.',
                    endgame: 'slvl 20: +100% damage taken. Kill resets CDs = chain assassination in packs.',
                    maxPts: 20, mana: 8, cd: 15, req: 'vanish:5',
                    synergies: [{ from: 'lethality', pctPerPt: 3 }]
                },
            ]
        },
        {
            id: 'poison', name: 'Poisons', icon: '🐍', nodes: [
                {
                    id: 'poison_blade', row: 0, col: 1, type: 'active', icon: '🐍', name: 'Poison Blade',
                    desc: 'Coat weapon in poison for (30+slvl×3)s: all hits apply (5+slvl×3) poison/s for 3s.',
                    endgame: 'slvl 20: 90s buff, 65/s poison on every hit. Foundation of poison builds.',
                    maxPts: 20, mana: 8, cd: 30, dmgBase: 5, dmgPerLvl: 3
                },
                {
                    id: 'venom', row: 1, col: 0, type: 'passive', icon: '☠️', name: 'Venom Mastery',
                    desc: '+5% poison damage per point. At 10pts: poisons last 1s longer.',
                    endgame: 'slvl 20: +100% poison dmg + 2s extra duration. Makes DoTs lethal.',
                    maxPts: 20
                },
                {
                    id: 'envenom', row: 1, col: 2, type: 'active', icon: '💧', name: 'Envenom',
                    desc: 'Inject concentrated venom: (20+slvl×10) poison burst + (8+slvl×4)/s DoT for 5s. Stacks with Poison Blade.',
                    endgame: 'slvl 20: 220 burst + 88/s × 5s = 660 total. Stack with Poison Blade = 153/s.',
                    maxPts: 20, mana: 10, cd: 0, group: 'poison', dmgBase: 20, dmgPerLvl: 10, req: 'poison_blade:3'
                },
                {
                    id: 'death_blossom', row: 2, col: 1, type: 'active', icon: '🌸', name: 'Death Blossom',
                    desc: 'Mark target: all poison effects deal +(50+slvl×3)% damage. If target dies while marked, poisons spread to 3 nearby enemies.',
                    endgame: 'slvl 20: +110% poison amp. Kill spreads = exponential pack clear.',
                    maxPts: 20, mana: 10, cd: 0, req: 'envenom:5'
                },
                {
                    id: 'plague', row: 2, col: 0, type: 'active', icon: '🦠', name: 'Plague',
                    desc: 'AoE poison cloud: (12+slvl×6)/s poison to all enemies in radius for 5s.',
                    endgame: 'slvl 20: 132/s AoE poison for 5s. Room-clearing DoT combined with Death Blossom.',
                    maxPts: 20, mana: 14, cd: 15, group: 'poison', dmgBase: 12, dmgPerLvl: 6, req: 'envenom:5'
                },
                {
                    id: 'noxious_cloud', row: 3, col: 0, type: 'active', icon: '☁️', name: 'Noxious Cloud',
                    desc: 'Drop a persistent poison zone for (6+slvl×0.3)s: (10+slvl×5)/s to all enemies standing in it.',
                    endgame: 'slvl 20: 12s cloud, 110/s. Zone control — force enemies through poison corridors.',
                    maxPts: 20, mana: 16, cd: 20, group: 'poison', dmgBase: 10, dmgPerLvl: 5, req: 'plague:5'
                },
                {
                    id: 'virulence', row: 3, col: 2, type: 'active', icon: '🧬', name: 'Virulence',
                    desc: 'For 15s: your poisons ignore (50+slvl×2)% of target poison resistance.',
                    endgame: 'slvl 20: ignores 90% poison res. Makes poison immune enemies vulnerable.',
                    maxPts: 20, mana: 12, cd: 30, req: 'venom:10'
                },
                {
                    id: 'pandemic', row: 4, col: 1, type: 'active', icon: '💀', name: 'Pandemic',
                    desc: 'Ultimate: instantly apply ALL active poison effects to ALL visible enemies. Each with full duration.',
                    endgame: 'slvl 20: screen-wide poison application. Combined with stacked DoTs = mass wipe in seconds.',
                    maxPts: 20, mana: 30, cd: 45, req: 'noxious_cloud:10',
                    synergies: [{ from: 'venom', pctPerPt: 5 }]
                },
            ]
        },
        {
            id: 'traps', name: 'Traps', icon: '⚙️', nodes: [
                {
                    id: 'blade_trap', row: 0, col: 1, type: 'active', icon: '⚙️', name: 'Blade Trap',
                    desc: 'Spinning blade trap: (8+slvl×5) physical/s. Lasts 10s. Max (1+slvl/5) active.',
                    endgame: 'slvl 20: 108/s, 5 traps active = 540 DPS passive. Set and forget damage.',
                    maxPts: 20, mana: 9, cd: 2, group: 'melee', dmgBase: 8, dmgPerLvl: 5
                },
                {
                    id: 'shock_trap', row: 1, col: 0, type: 'active', icon: '⚡', name: 'Shock Trap',
                    desc: 'Lightning trap: (10+slvl×6) + stun 0.5s. Lasts 10s. Max (1+slvl/5) active.',
                    endgame: 'slvl 20: 130 + stun, 5 traps = perma-stun zone.',
                    maxPts: 20, mana: 10, cd: 2, group: 'lightning', dmgBase: 10, dmgPerLvl: 6, req: 'blade_trap:3'
                },
                {
                    id: 'trap_mastery', row: 1, col: 2, type: 'passive', icon: '📈', name: 'Trap Mastery',
                    desc: '+8% trap damage and +5% trap duration per point. At 15pts: traps have 25% larger radius.',
                    endgame: 'slvl 20: +160% dmg, +100% duration. Traps last 20s and deal massive damage.',
                    maxPts: 20
                },
                {
                    id: 'fire_trap', row: 2, col: 0, type: 'active', icon: '🔥', name: 'Fire Trap',
                    desc: 'Explodes on trigger: (20+slvl×10) fire AoE, leaves burning ground 3s.',
                    endgame: 'slvl 20: 220 burst + ground fire. Multi-element trap coverage.',
                    maxPts: 20, mana: 12, cd: 3, group: 'fire', dmgBase: 20, dmgPerLvl: 10, req: 'blade_trap:5'
                },
                {
                    id: 'shadow_mine', row: 2, col: 1, type: 'active', icon: '💣', name: 'Shadow Mine',
                    desc: 'Invisible proximity mine: (25+slvl×12) shadow AoE when enemy walks over. Max (2+slvl/5).',
                    endgame: 'slvl 20: 265 shadow AoE per mine, 6 mines active. Invisible = guaranteed trigger.',
                    maxPts: 20, mana: 12, cd: 5, group: 'shadow', dmgBase: 25, dmgPerLvl: 12, req: 'shock_trap:5'
                },
                {
                    id: 'death_sentry', row: 3, col: 0, type: 'active', icon: '💥', name: 'Death Sentry',
                    desc: 'Turret fires lightning: (20+slvl×12) per shot, 2 shots/s. Lasts 15+slvl×1s. Max 3.',
                    endgame: 'slvl 20: 260 × 2/s = 520 DPS per sentry × 3 = 1560 passive DPS. Endgame boss killer.',
                    maxPts: 20, mana: 16, cd: 15, group: 'lightning', dmgBase: 20, dmgPerLvl: 12, req: 'shadow_mine:5',
                    synergies: [{ from: 'shock_trap', pctPerPt: 4 }, { from: 'trap_mastery', pctPerPt: 3 }]
                },
                {
                    id: 'chain_reaction', row: 3, col: 2, type: 'passive', icon: '💥', name: 'Chain Reaction',
                    desc: 'When any trap triggers, 20+slvl% chance to trigger all nearby traps simultaneously.',
                    endgame: 'slvl 20: 40% chance of chain detonation. Carpet-bomb areas with clustered traps.',
                    maxPts: 20, req: 'fire_trap:5'
                },
                {
                    id: 'fortress', row: 4, col: 1, type: 'active', icon: '🏰', name: 'Fortress',
                    desc: 'Ultimate: instantly deploy 3 Death Sentries + 3 Blade Traps + 3 Shadow Mines in a defensive formation.',
                    endgame: 'slvl 20: instant fortress deployment. Combined DPS ~3000+. The ultimate static defense.',
                    maxPts: 20, mana: 40, cd: 120, req: 'death_sentry:10',
                    synergies: [{ from: 'trap_mastery', pctPerPt: 5 }]
                },
            ]
        },
    ]
};
