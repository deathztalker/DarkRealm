/**
 * RANGER — Expanded endgame trees
 * Builds: 1. "Strafe Sniper" — Marksmanship multishot/strafe  2. "Beastmaster" — Nature companions  3. "Trapmaster" — Explosive+Ice traps
 */
export const RANGER_CLASS = {
    id: 'ranger', name: 'Ranger', icon: '🏹',
    desc: 'Deadly at range with devastating arrow volleys, loyal beast companions, and cunning traps. Kites circles around melee enemies while the arrows pile up.',
    stats: { str: 4, dex: 9, vit: 4, int: 3 },
    statBars: { str: 40, dex: 95, vit: 45, int: 30 },
    allowedWeapons: ['bow'],
    allowedOffhand: [],
    trees: [
        {
            id: 'marksmanship', name: 'Marksmanship', icon: '🎯', nodes: [
                {
                    id: 'power_shot', row: 0, col: 1, type: 'active', icon: '🏹', name: 'Power Shot',
                    desc: 'Heavy arrow: (15+slvl×8) physical at 140% weapon damage. Pierces 1 enemy.',
                    endgame: 'slvl 20: 175 piercing. Bread-and-butter ranged attack.',
                    maxPts: 20, mana: 5, cd: 0, group: 'melee', dmgBase: 15, dmgPerLvl: 8
                },
                {
                    id: 'multi_shot', row: 1, col: 0, type: 'active', icon: '🏹', name: 'Multi-Shot',
                    desc: 'Spray (3+slvl/5) arrows in a fan: (8+slvl×4) each.',
                    endgame: 'slvl 20: 7 arrows × 88 = 616 potential AoE. Screen-wide clear.',
                    maxPts: 20, mana: 8, cd: 0, group: 'melee', dmgBase: 8, dmgPerLvl: 4, req: 'power_shot:3',
                    synergies: [{ from: 'power_shot', pctPerPt: 3 }]
                },
                {
                    id: 'guided_arrow', row: 1, col: 2, type: 'active', icon: '🎯', name: 'Guided Arrow',
                    desc: 'Homing arrow: (12+slvl×7) physical. Always hits. Pierces (1+slvl/10) targets.',
                    endgame: 'slvl 20: 152 guaranteed-hit, pierces 3. Never misses even invisible enemies.',
                    maxPts: 20, mana: 8, cd: 0, group: 'melee', dmgBase: 12, dmgPerLvl: 7, req: 'power_shot:5'
                },
                {
                    id: 'bow_mastery', row: 2, col: 0, type: 'passive', icon: '📈', name: 'Bow Mastery',
                    desc: '+6% bow damage and +2% crit per point.',
                    endgame: 'slvl 20: +120% bow dmg, +40% crit. Every arrow becomes lethal.',
                    maxPts: 20
                },
                {
                    id: 'immolation_arrow', row: 2, col: 1, type: 'active', icon: '🔥', name: 'Immolation Arrow',
                    desc: 'Fire arrow: (20+slvl×10) fire on impact + burning ground 3s.',
                    endgame: 'slvl 20: 220 fire + ground burn. Element diversity for physical-immune enemies.',
                    maxPts: 20, mana: 12, cd: 4, group: 'fire', dmgBase: 20, dmgPerLvl: 10, req: 'power_shot:5'
                },
                {
                    id: 'strafe', row: 3, col: 0, type: 'active', icon: '🌀', name: 'Strafe',
                    desc: 'Rapid-fire all visible enemies for 3s: (6+slvl×4) per arrow, 4 arrows/s.',
                    endgame: 'slvl 20: 86/arrow × 4/s × 3s = 1032 total spread across all enemies.',
                    maxPts: 20, mana: 14, cd: 8, group: 'melee', dmgBase: 6, dmgPerLvl: 4, req: 'multi_shot:10',
                    synergies: [{ from: 'multi_shot', pctPerPt: 4 }]
                },
                {
                    id: 'mark_death', row: 3, col: 2, type: 'active', icon: '💀', name: 'Mark for Death',
                    desc: 'Mark target: takes +(50+slvl×3)% damage from all sources for 10s.',
                    endgame: 'slvl 20: +110% damage taken. Combined with Strafe = evaporate bosses.',
                    maxPts: 20, mana: 6, cd: 15, req: 'guided_arrow:5'
                },
                {
                    id: 'rain_of_arrows', row: 4, col: 1, type: 'active', icon: '🌧️', name: 'Rain of Arrows',
                    desc: 'Ultimate: arrow rain on target area for 5s: (12+slvl×7) per hit, 5 hits/s.',
                    endgame: 'slvl 20: 152/hit × 5/s × 5s = 3800 total AoE. Endgame room-clear.',
                    maxPts: 20, mana: 25, cd: 30, group: 'melee', dmgBase: 12, dmgPerLvl: 7, req: 'strafe:10',
                    synergies: [{ from: 'bow_mastery', pctPerPt: 5 }]
                },
            ]
        },
        {
            id: 'nature_ranger', name: 'Nature', icon: '🌿', nodes: [
                {
                    id: 'companion_hawk', row: 0, col: 1, type: 'active', icon: '🦅', name: 'Summon Hawk',
                    desc: 'Call a hawk companion: (8+slvl×4) physical with blinding attack every 5s.',
                    endgame: 'slvl 20: 88 dmg hawk + periodic blind. Ranged pet with utility.',
                    maxPts: 20, mana: 20, cd: 60
                },
                {
                    id: 'ensnare', row: 1, col: 0, type: 'active', icon: '🕸️', name: 'Ensnare',
                    desc: 'Net arrow: roots target for (2+slvl×0.1)s. Cannot move, can still attack.',
                    endgame: 'slvl 20: 4s root at range. Kiting essential.',
                    maxPts: 20, mana: 7, cd: 3
                },
                {
                    id: 'viper_arrow', row: 1, col: 2, type: 'active', icon: '🐍', name: 'Viper Arrow',
                    desc: 'Poison arrow: (5+slvl×3) poison/s for 5s. Stacks up to 4 times.',
                    endgame: 'slvl 20: 65/s × 4 stacks = 260 poison/s sustained. Excellent DoT.',
                    maxPts: 20, mana: 9, cd: 0, group: 'poison', dmgBase: 5, dmgPerLvl: 3
                },
                {
                    id: 'comp_mastery', row: 2, col: 0, type: 'passive', icon: '📈', name: 'Companion Mastery',
                    desc: '+10% pet damage and +8% pet HP per point.',
                    endgame: 'slvl 20: +200% pet dmg, +160% HP. Transforms pets into real threats.',
                    maxPts: 20
                },
                {
                    id: 'spirit_guide', row: 2, col: 1, type: 'active', icon: '👻', name: 'Spirit Guide',
                    desc: 'Nature spirit: grants party +(15+slvl×1.5)% move speed and (3+slvl×1) HP regen/s.',
                    endgame: 'slvl 20: +45% speed + 23 HP regen for party. Travel and sustain combo.',
                    maxPts: 20, mana: 14, cd: 60, req: 'companion_hawk:5'
                },
                {
                    id: 'wolf_pack', row: 3, col: 0, type: 'active', icon: '🐾', name: 'Call Wolf Pack',
                    desc: 'Summon (2+slvl/5) wolves for (20+slvl×2)s. Wolves: (8+slvl×4) dmg with pack bonus (+10%/wolf).',
                    endgame: 'slvl 20: 6 wolves for 60s, 88 dmg each + 60% pack bonus = 141 each. 846 DPS total.',
                    maxPts: 20, mana: 22, cd: 45, req: 'ensnare:10'
                },
                {
                    id: 'harmony', row: 3, col: 2, type: 'active', icon: '🌈', name: 'Nature\'s Harmony',
                    desc: 'Heal all allies and companions for (30+slvl×12) HP. Removes 1 debuff from each.',
                    endgame: 'slvl 20: 270 AoE heal + cleanse. Group sustain.',
                    maxPts: 20, mana: 16, cd: 15, req: 'spirit_guide:5'
                },
                {
                    id: 'stampede_ranger', row: 4, col: 1, type: 'active', icon: '🦬', name: 'Stampede',
                    desc: 'Ultimate: all companions and wolves charge together: each dealing +(100+slvl×10)% damage burst.',
                    endgame: 'slvl 20: +300% damage charge from all pets. 6 wolves + hawk = devastating coordinated strike.',
                    maxPts: 20, mana: 30, cd: 60, req: 'wolf_pack:10',
                    synergies: [{ from: 'comp_mastery', pctPerPt: 5 }]
                },
            ]
        },
        {
            id: 'traps_ranger', name: 'Traps', icon: '⚙️', nodes: [
                {
                    id: 'spike_trap', row: 0, col: 1, type: 'active', icon: '⚙️', name: 'Spike Trap',
                    desc: 'Ground spikes: (10+slvl×5) physical when triggered. Max 3 active.',
                    endgame: 'slvl 20: 110 physical per trap × 3 = area denial.',
                    maxPts: 20, mana: 8, cd: 3, group: 'melee', dmgBase: 10, dmgPerLvl: 5
                },
                {
                    id: 'ice_trap', row: 1, col: 0, type: 'active', icon: '❄️', name: 'Ice Trap',
                    desc: 'Triggered: (12+slvl×6) cold AoE + freeze 1.5s. Max 3 active.',
                    endgame: 'slvl 20: 132 cold + 1.5s freeze per trap. Freeze-lock corridors.',
                    maxPts: 20, mana: 10, cd: 3, group: 'cold', dmgBase: 12, dmgPerLvl: 6, req: 'spike_trap:3'
                },
                {
                    id: 'trap_mastery_r', row: 1, col: 2, type: 'passive', icon: '📈', name: 'Trap Mastery',
                    desc: '+8% trap damage and +5% trap area per point.',
                    endgame: 'slvl 20: +160% trap dmg, +100% area. Traps cover entire rooms.',
                    maxPts: 20
                },
                {
                    id: 'scatter_shot', row: 2, col: 1, type: 'active', icon: '💥', name: 'Scatter Shot',
                    desc: 'Shrapnel arrow: (15+slvl×8) physical AoE + knockback all enemies.',
                    endgame: 'slvl 20: 175 AoE + knockback. Emergency crowd control.',
                    maxPts: 20, mana: 12, cd: 6, group: 'melee', dmgBase: 15, dmgPerLvl: 8
                },
                {
                    id: 'fire_trap_r', row: 2, col: 0, type: 'active', icon: '🔥', name: 'Fire Trap',
                    desc: 'Triggered: (18+slvl×9) fire explosion + 3s burning ground. Max 3 active.',
                    endgame: 'slvl 20: 198 fire + ground burn. Multi-element trap coverage.',
                    maxPts: 20, mana: 12, cd: 3, group: 'fire', dmgBase: 18, dmgPerLvl: 9, req: 'spike_trap:5'
                },
                {
                    id: 'explosive_trap', row: 3, col: 0, type: 'active', icon: '💣', name: 'Explosive Trap',
                    desc: 'Huge explosion: (30+slvl×15) fire in massive radius. Max 2.',
                    endgame: 'slvl 20: 330 fire AoE × 2. Room-clearing explosions.',
                    maxPts: 20, mana: 16, cd: 8, group: 'fire', dmgBase: 30, dmgPerLvl: 15, req: 'fire_trap_r:5',
                    synergies: [{ from: 'ice_trap', pctPerPt: 4 }, { from: 'fire_trap_r', pctPerPt: 3 }]
                },
                {
                    id: 'black_arrow', row: 3, col: 2, type: 'active', icon: '🏴', name: 'Black Arrow',
                    desc: 'Shadow-infused arrow: (20+slvl×10) shadow + places invisible trap at impact dealing same on trigger.',
                    endgame: 'slvl 20: 220 shadow hit + 220 trap = 440 total. Two hits, one arrow.',
                    maxPts: 20, mana: 14, cd: 4, group: 'shadow', dmgBase: 20, dmgPerLvl: 10, req: 'scatter_shot:5'
                },
                {
                    id: 'minefield', row: 4, col: 1, type: 'active', icon: '🏰', name: 'Minefield',
                    desc: 'Ultimate: instantly deploy 5 random traps (fire/ice/spike/explosive) in target area.',
                    endgame: 'slvl 20: instant 5-trap deployment. Combined damage = room wipe. Combines with Trap Mastery bonuses.',
                    maxPts: 20, mana: 35, cd: 45, req: 'explosive_trap:10',
                    synergies: [{ from: 'trap_mastery_r', pctPerPt: 5 }]
                },
            ]
        },
    ]
};
