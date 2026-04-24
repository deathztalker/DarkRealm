/**
 * SORCERESS — Class Definition
 * Three trees: Fire (nuke) · Cold (control) · Lightning (clear)
 */
export const SORCERESS_CLASS = {
    id: 'sorceress', name: 'Sorceress', icon: '🔮',
    description: 'Master of the three elements. A glass cannon who trades survivability for devastating elemental power. Teleport keeps her mobile and alive.',
    stats: { str: 2, dex: 4, vit: 3, int: 9 },
    statBars: { str: 20, dex: 40, vit: 30, int: 95 },
    allowedWeapons: ['staff', 'orb', 'wand'],
    allowedOffhand: ['source', 'shield'],
    trees: [

        // ═══ FIRE — Meteor Mage build ═══
        {
            id: 'fire', name: 'Fire', icon: '🔥',
            nodes: [
                {
                    id: 'fire_bolt', row: 0, col: 1, type: 'active', icon: '🔥', name: 'Fire Bolt',
                    desc: 'Active · Fire bolt dealing base + 110% weapon damage as fire.',
                    tip: 'Max lvl (20): Fast scaling synergy builder.',
                    maxPts: 20, mana: 3, cd: 0, group: 'fire', dmgBase: 5, dmgPerLvl: 4, wepPct: 110
                },
                {
                    id: 'warmth', row: 1, col: 0, type: 'passive', icon: '♨️', name: 'Warmth',
                    desc: 'Passive · Increases your mana regeneration rate by 10% per point.',
                    tip: 'Max lvl (20): +200% mana regen. Essential for mana-hungry casters.',
                    maxPts: 20
                },
                {
                    id: 'fireball', row: 1, col: 2, type: 'active', icon: '💥', name: 'Fireball',
                    desc: 'Active · Fireball dealing base + 140% weapon damage in an AoE splash.',
                    tip: 'Max lvl (20): Primary scaling spam skill.',
                    maxPts: 20, mana: 9, cd: 0, group: 'fire', dmgBase: 12, dmgPerLvl: 9, wepPct: 140, req: 'fire_bolt:3',
                    synergies: [{ from: 'fire_bolt', pctPerPt: 3 }, { from: 'meteor', pctPerPt: 4 }]
                },
                {
                    id: 'fire_mastery', row: 2, col: 0, type: 'passive', icon: '🔴', name: 'Fire Mastery',
                    desc: 'Passive · +5% fire damage per point. At 10 points, your fire spells pierce 10% of enemy fire resistance.',
                    tip: 'Max lvl (20): +100% fire damage.',
                    maxPts: 20
                },
                {
                    id: 'immolate', row: 2, col: 1, type: 'active', icon: '🌡️', name: 'Immolate',
                    desc: 'Active · Ignite target: base + 60% weapon damage per second as fire.',
                    tip: 'Max lvl (20): Scaling fire DoT.',
                    maxPts: 20, mana: 11, cd: 0, group: 'fire', dmgBase: 6, dmgPerLvl: 4, wepPct: 60, req: 'fireball:3'
                },
                {
                    id: 'fire_wall', row: 3, col: 0, type: 'active', icon: '🧱', name: 'Fire Wall',
                    desc: 'Active · Fire wall dealing base + 100% weapon damage per second.',
                    tip: 'Max lvl (20): High scaling area denial.',
                    maxPts: 20, mana: 15, cd: 4, group: 'fire', dmgBase: 25, dmgPerLvl: 15, wepPct: 100, req: 'fire_mastery:5',
                    synergies: [{ from: 'warmth', pctPerPt: 2 }]
                },
                {
                    id: 'enchant', row: 3, col: 2, type: 'active', icon: '✨', name: 'Enchant',
                    desc: 'Active · Add base + 50% weapon damage as fire to every hit.',
                    tip: 'Max lvl (20): Gear-based melee/summon buff.',
                    maxPts: 20, mana: 20, cd: 0, group: 'buff', dmgBase: 15, dmgPerLvl: 8, wepPct: 50, req: 'fireball:5'
                },
                {
                    id: 'meteor', row: 4, col: 1, type: 'active', icon: '☄️', name: 'Meteor',
                    desc: 'Active · Impact for base + 300% weapon damage and leaves burning ground.',
                    tip: 'Max lvl (20): Massive scaling impact nuke.',
                    maxPts: 20, mana: 20, cd: 12, group: 'fire', dmgBase: 60, dmgPerLvl: 22, wepPct: 300, req: 'immolate:5',
                    synergies: [{ from: 'fireball', pctPerPt: 5 }, { from: 'fire_mastery', pctPerPt: 3 }]
                },
                {
                    id: 'hydra', row: 5, col: 0, type: 'active', icon: '🐉', name: 'Hydra',
                    desc: 'Active · Summon hydra shooting bolts for base + 60% weapon damage each.',
                    tip: 'Max lvl (20): Scaling multi-head turret.',
                    maxPts: 20, mana: 25, cd: 2, group: 'fire', dmgBase: 10, dmgPerLvl: 6, wepPct: 60, req: 'fire_wall:5',
                    synergies: [{ from: 'fire_bolt', pctPerPt: 3 }]
                },
                {
                    id: 'fire_storm', row: 5, col: 2, type: 'active', icon: '🌠', name: 'Fire Storm',
                    desc: 'Active · Rain fireballs dealing base + 120% weapon damage each in AoE.',
                    tip: 'Max lvl (20): High scaling room clear.',
                    maxPts: 20, mana: 35, cd: 45, group: 'fire', dmgBase: 20, dmgPerLvl: 10, wepPct: 120, req: 'meteor:5',
                    synergies: [{ from: 'fire_mastery', pctPerPt: 4 }]
                },
                {
                    id: 'combustion', row: 6, col: 1, type: 'passive', icon: '💥', name: 'Combustion',
                    desc: 'Passive · Your critical strikes with fire spells apply a DoT dealing 50% of the damage over 4 seconds.',
                    tip: 'Max lvl (1): Massive sustained damage on crits.',
                    maxPts: 1, req: 'meteor:10'
                }
            ]
        },

        // ═══ COLD — Blizzard Queen build ═══
        {
            id: 'cold', name: 'Cold', icon: '❄️',
            nodes: [
                {
                    id: 'ice_bolt', row: 0, col: 1, type: 'active', icon: '🧊', name: 'Ice Bolt',
                    desc: 'Active · Cold shard dealing base + 100% weapon damage and slowing.',
                    tip: 'Max lvl (20): Scaling cold utility.',
                    maxPts: 20, mana: 6, cd: 0, group: 'cold', dmgBase: 8, dmgPerLvl: 6, wepPct: 100
                },
                {
                    id: 'frost_nova', row: 1, col: 0, type: 'active', icon: '💫', name: 'Frost Nova',
                    desc: 'Active · Nova dealing base + 110% weapon damage as cold in 360° AoE.',
                    tip: 'Max lvl (20): Scaling AoE CC.',
                    maxPts: 20, mana: 14, cd: 8, group: 'cold', dmgBase: 15, dmgPerLvl: 8, wepPct: 110, req: 'ice_bolt:1'
                },
                {
                    id: 'frozen_armor', row: 1, col: 2, type: 'active', icon: '🧊', name: 'Frozen Armor',
                    desc: 'Active · Encase yourself in ice armor, gaining +10 + 3% per point defense. Melee attackers are chilled.',
                    tip: 'Max lvl (20): +70% defense · melee auto-chill.',
                    maxPts: 20, mana: 12, cd: 0, group: 'buff', req: 'ice_bolt:1'
                },
                {
                    id: 'cold_mastery', row: 2, col: 0, type: 'passive', icon: '🔵', name: 'Cold Mastery',
                    desc: 'Passive · +5% cold damage per point. At 10 points, chill and freeze durations are extended by +25%.',
                    tip: 'Max lvl (20): +100% cold damage.',
                    maxPts: 20
                },
                {
                    id: 'ice_blast', row: 2, col: 1, type: 'active', icon: '💨', name: 'Ice Blast',
                    desc: 'Active · Blast dealing base + 130% weapon damage as cold and freeze.',
                    tip: 'Max lvl (20): High scaling cold burst.',
                    maxPts: 20, mana: 13, cd: 2, group: 'cold', dmgBase: 25, dmgPerLvl: 12, wepPct: 130, req: 'frost_nova:3',
                    synergies: [{ from: 'ice_bolt', pctPerPt: 4 }]
                },
                {
                    id: 'shatter', row: 3, col: 0, type: 'passive', icon: '💥', name: 'Shatter',
                    desc: 'Passive · Your cold spells deal +3% damage per point to enemies that are Frozen or Chilled.',
                    tip: 'Max lvl (20): +60% damage to CC\'d targets.',
                    maxPts: 20, req: 'cold_mastery:5'
                },
                {
                    id: 'blizzard', row: 3, col: 2, type: 'active', icon: '🌨️', name: 'Blizzard',
                    desc: 'Active · Blizzard dealing base + 80% weapon damage per second AoE.',
                    tip: 'Max lvl (20): High scaling area CC.',
                    maxPts: 20, mana: 18, cd: 12, group: 'cold', dmgBase: 10, dmgPerLvl: 7, wepPct: 80, req: 'frozen_armor:3',
                    synergies: [{ from: 'ice_bolt', pctPerPt: 5 }, { from: 'ice_blast', pctPerPt: 4 }]
                },
                {
                    id: 'glacial_spike', row: 4, col: 1, type: 'active', icon: '🏔️', name: 'Glacial Spike',
                    desc: 'Active · Impact for base + 240% weapon damage and freeze target.',
                    tip: 'Max lvl (20): Massive scaling single-target CC.',
                    maxPts: 20, mana: 18, cd: 6, group: 'cold', dmgBase: 50, dmgPerLvl: 20, wepPct: 240, req: 'ice_blast:5',
                    synergies: [{ from: 'ice_blast', pctPerPt: 5 }]
                },
                {
                    id: 'frozen_orb', row: 5, col: 0, type: 'active', icon: '🔵', name: 'Frozen Orb',
                    desc: 'Active · Launch orb firing bolts for base + 50% weapon damage each.',
                    tip: 'Max lvl (20): High scaling room-clear cold.',
                    maxPts: 20, mana: 25, cd: 10, group: 'cold', dmgBase: 40, dmgPerLvl: 15, wepPct: 50, req: 'shatter:5',
                    synergies: [{ from: 'ice_bolt', pctPerPt: 2 }]
                },
                {
                    id: 'absolute_zero', row: 5, col: 2, type: 'active', icon: '☃️', name: 'Absolute Zero',
                    desc: 'Active · Impact for base + 350% weapon damage as cold and freeze all.',
                    tip: 'Max lvl (20): Ultimate scaling cold nuke.',
                    maxPts: 20, mana: 40, cd: 60, group: 'cold', dmgBase: 80, dmgPerLvl: 30, wepPct: 350, req: 'blizzard:10',
                    synergies: [{ from: 'cold_mastery', pctPerPt: 5 }]
                },
            ]
        },

        // ═══ LIGHTNING — Nova clear build ═══
        {
            id: 'lightning', name: 'Lightning', icon: '⚡',
            nodes: [
                {
                    id: 'charged_bolt', row: 0, col: 1, type: 'active', icon: '⚡', name: 'Charged Bolt',
                    desc: 'Active · Bolts dealing base + 70% weapon damage as lightning each.',
                    tip: 'Max lvl (20): Scaling erratic lightning bolts.',
                    maxPts: 20, mana: 5, cd: 0, group: 'lightning', dmgBase: 5, dmgPerLvl: 3, wepPct: 70
                },
                {
                    id: 'static_field', row: 1, col: 0, type: 'active', icon: '🌩️', name: 'Static Field',
                    desc: 'Active · Discharge electricity removing 25 + 1% per point of the CURRENT HP from every enemy in range. Cannot kill.',
                    tip: 'Max lvl (20): 45% max-HP reduction. Boss shredder.',
                    maxPts: 20, mana: 8, cd: 4, group: 'lightning', req: 'charged_bolt:1'
                },
                {
                    id: 'nova', row: 1, col: 2, type: 'active', icon: '💫', name: 'Nova',
                    desc: 'Active · Lightning ring dealing base + 120% weapon damage in 360° AoE.',
                    tip: 'Max lvl (20): Scaling area clear.',
                    maxPts: 20, mana: 11, cd: 0, group: 'lightning', dmgBase: 12, dmgPerLvl: 8, wepPct: 120, req: 'charged_bolt:3'
                },
                {
                    id: 'lightning_mastery', row: 2, col: 0, type: 'passive', icon: '🟡', name: 'Lightning Mastery',
                    desc: 'Passive · +5% lightning damage per point. Chain lightning and Nova hit +1 additional target at 10pts.',
                    tip: 'Max lvl (20): +100% lightning damage.',
                    maxPts: 20
                },
                {
                    id: 'lightning_surge', row: 2, col: 1, type: 'active', icon: '⚡', name: 'Lightning Surge',
                    desc: 'Active · Piercing beam dealing base + 160% weapon damage as lightning.',
                    tip: 'Max lvl (20): High scaling line nuke.',
                    maxPts: 20, mana: 12, cd: 0, group: 'lightning', dmgBase: 20, dmgPerLvl: 12, wepPct: 160, req: 'charged_bolt:5',
                    synergies: [{ from: 'charged_bolt', pctPerPt: 4 }]
                },
                {
                    id: 'energy_shield', row: 3, col: 0, type: 'active', icon: '🔵', name: 'Energy Shield',
                    desc: 'Active (Toggle) · Convert 60% of all incoming damage to drain mana instead of HP.',
                    tip: 'Near immortality with high mana regen.',
                    maxPts: 20, mana: 5, cd: 0, group: 'buff', req: 'static_field:3'
                },
                {
                    id: 'teleport', row: 3, col: 2, type: 'active', icon: '🌀', name: 'Teleport',
                    desc: 'Active · Instantly blink to any visible location. Lower mana cost per point.',
                    tip: 'Max lvl (20): 5 mana cost.',
                    maxPts: 20, mana: 24, cd: 0, group: 'movement', req: 'nova:3'
                },
                {
                    id: 'chain_lightning', row: 4, col: 1, type: 'active', icon: '⚡', name: 'Chain Lightning',
                    desc: 'Active · Strike for base + 150% weapon damage and chain to 3 targets.',
                    tip: 'Max lvl (20): High scaling multi-hit lightning.',
                    maxPts: 20, mana: 15, cd: 1.5, group: 'lightning', dmgBase: 30, dmgPerLvl: 15, wepPct: 150, req: 'lightning_surge:5',
                    synergies: [{ from: 'lightning_surge', pctPerPt: 5 }]
                },
                {
                    id: 'static_charge', row: 5, col: 0, type: 'passive', icon: '⚡', name: 'Static Charge',
                    desc: 'Passive · Enemies that hit you in melee take 5 + 3 per point lightning damage and are briefly stunned.',
                    tip: 'Max lvl (20): 65 reactive damage.',
                    maxPts: 20, req: 'energy_shield:5'
                },
                {
                    id: 'thunder_storm', row: 5, col: 2, type: 'active', icon: '🌩️', name: 'Thunder Storm',
                    desc: 'Active (Toggle) · Lightning strikes for base + 140% weapon damage every 2s.',
                    tip: 'Max lvl (20): Scaling passive lightning dps.',
                    maxPts: 20, mana: 15, cd: 0, group: 'lightning', dmgBase: 50, dmgPerLvl: 20, wepPct: 140, req: 'chain_lightning:5',
                    synergies: [{ from: 'lightning_mastery', pctPerPt: 4 }]
                },
                {
                    id: 'arcane_shield', row: 6, col: 0, type: 'passive', icon: '🛡️', name: 'Arcane Shield',
                    desc: 'Passive · Every time you cast a spell, you gain a shield that absorbs 5 + 3 per point damage for 10s. Stacks up to 5 times.',
                    tip: 'Max lvl (20): Shield of 65 per cast, up to 325 total. Core survival.',
                    maxPts: 20, req: 'energy_shield:5'
                },
                {
                    id: 'chain_lightning_mastery', row: 6, col: 2, type: 'passive', icon: '🌩️', name: 'Storm Mastery',
                    desc: 'Passive · Chain Lightning bounces 1 + 0.1 per point more times and Nova deals +5% damage per point.',
                    tip: 'Max lvl (20): +3 bounces, +100% Nova damage.',
                    maxPts: 20, req: 'thunder_storm:5'
                },
                {
                    id: 'slow_time', row: 7, col: 1, type: 'active', icon: '⏳', name: 'Slow Time',
                    desc: 'Active · Create a bubble that slows enemy movement and attack speed by 50% for 10s.',
                    tip: 'Max lvl (20): Absolute control over a large area.',
                    maxPts: 20, mana: 30, cd: 30, group: 'buff', req: 'chain_lightning_mastery:1'
                }
            ]
        },
    ]
};