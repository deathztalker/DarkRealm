/**
 * SORCERESS CLASS — Expanded endgame talent trees
 * 3 viable endgame builds:
 *   1. "Meteor Mage" — Fire tree, Meteor+Fireball spam with Fire Mastery scaling
 *   2. "Blizzard Queen" — Cold tree, Blizzard+Frozen Orb perma-freeze kiting
 *   3. "Lightning Nova" — Lightning tree, Nova+Chain Lightning screen-clear
 */
export const SORCERESS_CLASS = {
    id: 'sorceress', name: 'Sorceress', icon: '🔥',
    desc: 'She bends the raw forces of fire, ice, and lightning to her will. Frail in body but devastating in power — the ultimate glass cannon.',
    stats: { str: 2, dex: 4, vit: 3, int: 9 },
    statBars: { str: 20, dex: 40, vit: 30, int: 95 },
    allowedWeapons: ['staff', 'orb', 'wand'],
    allowedOffhand: ['source', 'shield'],

    trees: [
        // ══════ FIRE — Meteor Mage build ══════
        {
            id: 'fire', name: 'Fire', icon: '🔥',
            nodes: [
                {
                    id: 'fire_bolt', row: 0, col: 0, type: 'active', icon: '🌋', name: 'Fire Bolt',
                    desc: 'Rapid fire projectile: (5+slvl×4) fire damage. No cooldown, very fast cast.',
                    endgame: 'slvl 20: 85 dmg rapid fire. Synergy fuel for Fireball and Meteor (+3%/pt each).',
                    maxPts: 20, mana: 3, cd: 0, group: 'fire', dmgBase: 5, dmgPerLvl: 4
                },

                {
                    id: 'fireball', row: 0, col: 2, type: 'active', icon: '🔥', name: 'Fireball',
                    desc: 'Launch a fireball: (12+slvl×9) fire damage with small AoE splash on impact.',
                    endgame: 'slvl 20: 192 fire + splash. Primary spam skill with Fire Bolt synergy.',
                    maxPts: 20, mana: 9, cd: 0, group: 'fire', dmgBase: 12, dmgPerLvl: 9,
                    synergies: [{ from: 'fire_bolt', pctPerPt: 3 }, { from: 'immolate', pctPerPt: 4 }]
                },

                {
                    id: 'immolate', row: 1, col: 1, type: 'active', icon: '🌞', name: 'Immolate',
                    desc: 'Set target ablaze: (6+slvl×4) fire damage per second for (3+slvl×0.1)s.',
                    endgame: 'slvl 20: 86/s for 5s = 430 DoT total. Stacks with Fireball direct hit.',
                    maxPts: 20, mana: 11, cd: 0, group: 'fire', dmgBase: 6, dmgPerLvl: 4, req: 'fireball:3'
                },

                {
                    id: 'fire_mastery', row: 2, col: 0, type: 'passive', icon: '📈', name: 'Fire Mastery',
                    desc: 'Passive. +6% fire damage per point. At 10pts: fire spells pierce 5% fire resistance.',
                    endgame: 'slvl 20: +120% fire dmg + 10% resist pierce. Mandatory for all fire builds.',
                    maxPts: 20
                },

                {
                    id: 'enchant', row: 2, col: 2, type: 'active', icon: '✨', name: 'Enchant',
                    desc: 'Buff self or ally: weapon gains +(15+slvl×8) fire damage on hit for 60+slvl×5s.',
                    endgame: 'slvl 20: +175 fire damage on every melee/ranged hit for 160s. Amazing support for melee classes.',
                    maxPts: 20, mana: 20, cd: 0, group: 'buff', dmgBase: 15, dmgPerLvl: 8, req: 'fire_mastery:1'
                },

                {
                    id: 'meteor', row: 3, col: 0, type: 'active', icon: '☄️', name: 'Meteor',
                    desc: 'Call a meteor after 1.5s delay: (60+slvl×22) fire AoE + leaves burning ground for 3s dealing 40% of impact/s.',
                    endgame: 'slvl 20: 500 impact + 200/s ground fire. With synergies can exceed 1200 total. Best fire nuke.',
                    maxPts: 20, mana: 20, cd: 12, group: 'fire', dmgBase: 60, dmgPerLvl: 22, req: 'fireball:10',
                    synergies: [{ from: 'fireball', pctPerPt: 5 }, { from: 'fire_bolt', pctPerPt: 3 }]
                },

                {
                    id: 'inferno', row: 3, col: 2, type: 'active', icon: '🔥', name: 'Inferno',
                    desc: 'Channel continuous fire stream: (8+slvl×5) fire damage per 0.3s in a line. Duration: while channeling.',
                    endgame: 'slvl 20: 108 per tick = 360/s sustained. Anti-boss channel spell.',
                    maxPts: 20, mana: 6, cd: 0, group: 'fire', dmgBase: 8, dmgPerLvl: 5, req: 'immolate:5'
                },

                {
                    id: 'fire_storm', row: 4, col: 1, type: 'active', icon: '🌋', name: 'Fire Storm',
                    desc: 'Ultimate: rain fire on entire screen for 6s. (20+slvl×10) per hit, 3 hits/s, random targets.',
                    endgame: 'slvl 20: 220/hit × 3/s × 6s = 3960 total potential. Endgame room-clear ultimate.',
                    maxPts: 20, mana: 35, cd: 45, group: 'fire', dmgBase: 20, dmgPerLvl: 10, req: 'meteor:10',
                    synergies: [{ from: 'fire_mastery', pctPerPt: 4 }]
                },
            ]
        },

        // ══════ COLD — Blizzard Queen build ══════
        {
            id: 'cold', name: 'Cold', icon: '🧊',
            nodes: [
                {
                    id: 'ice_bolt', row: 0, col: 1, type: 'active', icon: '❄️', name: 'Ice Bolt',
                    desc: 'Ice shard dealing (8+slvl×6) cold damage. Slows target by 40% for 2s.',
                    endgame: 'slvl 20: 128 cold + 40% slow. Kiting staple and synergy fuel.',
                    maxPts: 20, mana: 6, cd: 0, group: 'cold', dmgBase: 8, dmgPerLvl: 6
                },

                {
                    id: 'frost_nova', row: 1, col: 0, type: 'active', icon: '🌀', name: 'Frost Nova',
                    desc: 'Burst of cold in 360° AoE: (15+slvl×8) cold damage. Slows all enemies by 60% for 3s.',
                    endgame: 'slvl 20: 175 AoE + 60% slow. Emergency "get off me" skill.',
                    maxPts: 20, mana: 14, cd: 8, group: 'cold', dmgBase: 15, dmgPerLvl: 8
                },

                {
                    id: 'frozen_armor', row: 1, col: 2, type: 'active', icon: '🛡️', name: 'Frozen Armor',
                    desc: 'Self-buff: +(10+slvl×3)% defense. Melee attackers are chilled for 2s. Lasts 120+slvl×10s.',
                    endgame: 'slvl 20: +70% defense, auto-chill attackers. Essential survivability for a squishy class.',
                    maxPts: 20, mana: 12, cd: 0, group: 'buff', req: 'ice_bolt:1'
                },

                {
                    id: 'blizzard', row: 2, col: 1, type: 'active', icon: '🌨️', name: 'Blizzard',
                    desc: 'Rain ice shards on an area for 4s: (10+slvl×7) cold AoE damage per second.',
                    endgame: 'slvl 20: 150/s × 4s = 600 AoE. Perma-slow on everything in the zone.',
                    maxPts: 20, mana: 18, cd: 12, group: 'cold', dmgBase: 10, dmgPerLvl: 7, req: 'ice_bolt:5',
                    synergies: [{ from: 'ice_bolt', pctPerPt: 5 }, { from: 'ice_blast', pctPerPt: 4 }]
                },

                {
                    id: 'cold_mastery', row: 2, col: 0, type: 'passive', icon: '📈', name: 'Cold Mastery',
                    desc: 'Passive. +6% cold damage per point. Enemy cold resistance reduced by -3% per point (can go negative).',
                    endgame: 'slvl 20: +120% cold dmg, -60% enemy cold res. Makes cold viable even vs cold-immune with enough points.',
                    maxPts: 20
                },

                {
                    id: 'ice_blast', row: 3, col: 0, type: 'active', icon: '💠', name: 'Ice Blast',
                    desc: 'Concentrated cold: (30+slvl×14) cold damage + freeze target solid for (1+slvl×0.05)s.',
                    endgame: 'slvl 20: 310 dmg + 2s hard freeze. Boss lockdown skill.',
                    maxPts: 20, mana: 15, cd: 6, group: 'cold', dmgBase: 30, dmgPerLvl: 14, req: 'ice_bolt:10'
                },

                {
                    id: 'frozen_orb', row: 3, col: 2, type: 'active', icon: '🔮', name: 'Frozen Orb',
                    desc: 'Launch a slow-moving orb that emits (2+slvl/5) ice bolts per second in all directions. Orb lasts 3s, each bolt deals (8+slvl×4).',
                    endgame: 'slvl 20: 6 bolts/s × 88 dmg × 3s = massive area coverage. The iconic cold spell.',
                    maxPts: 20, mana: 22, cd: 1, group: 'cold', dmgBase: 8, dmgPerLvl: 4, req: 'blizzard:5'
                },

                {
                    id: 'absolute_zero', row: 4, col: 1, type: 'active', icon: '🥶', name: 'Absolute Zero',
                    desc: 'Ultimate: freeze ALL enemies on screen for (2+slvl×0.1)s and deal (40+slvl×18) cold damage. Shattered frozen enemies take triple.',
                    endgame: 'slvl 20: 400 dmg + 4s screen freeze. Frozen targets shattered by any hit take ×3 dmg.',
                    maxPts: 20, mana: 40, cd: 60, group: 'cold', dmgBase: 40, dmgPerLvl: 18, req: 'ice_blast:10',
                    synergies: [{ from: 'cold_mastery', pctPerPt: 5 }]
                },
            ]
        },

        // ══════ LIGHTNING — Lightning Nova build ══════
        {
            id: 'lightning', name: 'Lightning', icon: '⚡',
            nodes: [
                {
                    id: 'charged_bolt', row: 0, col: 1, type: 'active', icon: '🌩️', name: 'Charged Bolt',
                    desc: 'Scatter (3+slvl/3) electric bolts in a spread: (6+slvl×5) lightning each.',
                    endgame: 'slvl 20: 9 bolts × 106 = 954 potential if all hit. Excellent vs large targets.',
                    maxPts: 20, mana: 7, cd: 0, group: 'lightning', dmgBase: 6, dmgPerLvl: 5
                },

                {
                    id: 'static_field', row: 1, col: 0, type: 'active', icon: '💢', name: 'Static Field',
                    desc: 'Reduce all visible enemies current HP by (25+slvl×1)% instantly. Cannot kill (HP floor: 1).',
                    endgame: 'slvl 20: strips 45% current HP. Best boss opener in the game. Scales infinitely.',
                    maxPts: 20, mana: 18, cd: 12, dmgBase: 25, dmgPerLvl: 1
                },

                {
                    id: 'teleport', row: 1, col: 2, type: 'active', icon: '🌀', name: 'Teleport',
                    desc: 'Blink to target location instantly. Distance: (200+slvl×10) pixels.',
                    endgame: 'slvl 20: 400px blink range. The signature Sorceress mobility skill. No damage but invaluable.',
                    maxPts: 20, mana: 15, cd: 1, group: 'teleport', req: 'charged_bolt:1'
                },

                {
                    id: 'chain_lightning', row: 2, col: 1, type: 'active', icon: '⚡', name: 'Chain Lightning',
                    desc: 'Lightning bolt jumps between (2+slvl/4) enemies: (15+slvl×10) lightning each. No damage loss per bounce.',
                    endgame: 'slvl 20: 7 bounces × 215 = 1505 total potential. Screen-clearing efficiency.',
                    maxPts: 20, mana: 14, cd: 0, group: 'lightning', dmgBase: 15, dmgPerLvl: 10, req: 'charged_bolt:5',
                    synergies: [{ from: 'charged_bolt', pctPerPt: 5 }]
                },

                {
                    id: 'light_mastery', row: 2, col: 0, type: 'passive', icon: '📈', name: 'Lightning Mastery',
                    desc: 'Passive. +6% lightning damage per point. At 15pts: lightning spells have 10% chance to stun for 0.3s.',
                    endgame: 'slvl 20: +120% light dmg + stun procs. Defines the lightning playstyle.',
                    maxPts: 20
                },

                {
                    id: 'nova', row: 3, col: 0, type: 'active', icon: '💥', name: 'Lightning Nova',
                    desc: '360° lightning burst: (25+slvl×14) to all enemies in large radius.',
                    endgame: 'slvl 20: 305 AoE instant. Zero travel time = guaranteed hit. Core Nova build spell.',
                    maxPts: 20, mana: 16, cd: 6, group: 'lightning', dmgBase: 25, dmgPerLvl: 14, req: 'chain_lightning:5',
                    synergies: [{ from: 'chain_lightning', pctPerPt: 4 }]
                },

                {
                    id: 'energy_shield', row: 3, col: 2, type: 'active', icon: '🛡️', name: 'Energy Shield',
                    desc: 'Absorbs (60+slvl×2)% of incoming damage, draining mana instead of HP. Lasts until mana depleted.',
                    endgame: 'slvl 20: absorbs 100% damage into mana. With high mana pool = pseudo-invulnerability.',
                    maxPts: 20, mana: 20, cd: 0, group: 'buff', req: 'teleport:5'
                },

                {
                    id: 'thunder_storm', row: 4, col: 1, type: 'active', icon: '⛈️', name: 'Thunder Storm',
                    desc: 'Ultimate: for (20+slvl×1)s, lightning automatically strikes a random enemy every 0.5s for (30+slvl×15).',
                    endgame: 'slvl 20: 40s duration, 330 dmg every 0.5s = passive 660 DPS. Cast and forget while using other spells.',
                    maxPts: 20, mana: 30, cd: 60, group: 'lightning', dmgBase: 30, dmgPerLvl: 15, req: 'nova:10',
                    synergies: [{ from: 'light_mastery', pctPerPt: 5 }]
                },
            ]
        },
    ]
};
