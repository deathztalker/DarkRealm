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
                    id: 'fire_bolt', row: 0, col: 0, type: 'active', icon: '🔥', name: 'Fire Bolt',
                    desc: 'Active · Hurl a rapid fire bolt dealing 5 + 4 per point fire damage. No cooldown — spam freely. Also boosts Fireball and Meteor via synergy (+3% each per point here).',
                    tip: 'Max lvl (20): 85 damage each · primarily used as a synergy booster.',
                    maxPts: 20, mana: 3, cd: 0, group: 'fire', dmgBase: 5, dmgPerLvl: 4
                },
                {
                    id: 'fireball', row: 0, col: 2, type: 'active', icon: '💥', name: 'Fireball',
                    desc: 'Active · Launch an explosive fireball dealing 12 + 9 per point fire damage with a small AoE splash on impact. ★ Synergy: +3% per point in Fire Bolt · +4% per point in Immolate.',
                    tip: 'Max lvl (20): 192 fire damage + AoE splash. Your primary spam skill.',
                    maxPts: 20, mana: 9, cd: 0, group: 'fire', dmgBase: 12, dmgPerLvl: 9,
                    synergies: [{ from: 'fire_bolt', pctPerPt: 3 }, { from: 'immolate', pctPerPt: 4 }]
                },
                {
                    id: 'immolate', row: 1, col: 1, type: 'active', icon: '🌡️', name: 'Immolate',
                    desc: 'Active · Ignite a target, dealing 6 + 4 per point fire damage every second for 3 + 0.1 per point seconds. Stacks with any direct-damage fire spell.',
                    tip: 'Max lvl (20): 86 per second for 5s = 430 total DoT.',
                    maxPts: 20, mana: 11, cd: 0, group: 'fire', dmgBase: 6, dmgPerLvl: 4, req: 'fireball:3'
                },
                {
                    id: 'fire_mastery', row: 2, col: 0, type: 'passive', icon: '🔴', name: 'Fire Mastery',
                    desc: 'Passive · +5% fire damage per point. At 10 points, your fire spells pierce 10% of enemy fire resistance (can reduce it below zero). The mandatory passive for all fire builds.',
                    tip: 'Max lvl (20): +100% fire damage · fire piercing active at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'enchant', row: 2, col: 2, type: 'active', icon: '✨', name: 'Enchant',
                    desc: 'Active · Touch a weapon (yours or an ally\'s) to add 15 + 8 per point fire damage to every hit for 60 + 5 per point seconds. Transforms melee allies into fire damage dealers.',
                    tip: 'Max lvl (20): +175 fire damage on every hit for 160s.',
                    maxPts: 20, mana: 20, cd: 0, group: 'buff', dmgBase: 15, dmgPerLvl: 8, req: 'fire_mastery:1'
                },
                {
                    id: 'meteor', row: 3, col: 0, type: 'active', icon: '☄️', name: 'Meteor',
                    desc: 'Active · Call a meteor after a 1.5s delay. On impact: 60 + 22 per point fire AoE damage and leaves burning ground that deals 40% of impact damage per second for 3s. ★ Synergy: +5% per Fireball · +3% per Fire Bolt.',
                    tip: 'Max lvl (20): 500 impact + 200/s burning ground. Best single fire nuke.',
                    maxPts: 20, mana: 20, cd: 12, group: 'fire', dmgBase: 60, dmgPerLvl: 22, req: 'fireball:10',
                    synergies: [{ from: 'fireball', pctPerPt: 5 }, { from: 'fire_bolt', pctPerPt: 3 }]
                },
                {
                    id: 'inferno', row: 3, col: 2, type: 'active', icon: '🌋', name: 'Inferno',
                    desc: 'Active · Channel a sustained stream of fire in a line dealing 8 + 5 per point damage every 0.3s while channeling. Effective sustained fire DPS vs stationary targets.',
                    tip: 'Max lvl (20): 108 per tick = ~360 damage per second sustained.',
                    maxPts: 20, mana: 6, cd: 0, group: 'fire', dmgBase: 8, dmgPerLvl: 5, req: 'immolate:5'
                },
                {
                    id: 'fire_storm', row: 4, col: 1, type: 'active', icon: '🌠', name: 'Fire Storm',
                    desc: 'Active · Rain dozens of fireballs across the entire screen for 6 seconds. Each fireball deals 20 + 10 per point damage, hitting 3 times per second on random enemies. ★ Synergy: +4% per Fire Mastery point.',
                    tip: 'Max lvl (20): 220 per hit × 3/s × 6s = up to 3,960 total damage. Ultimate room-clear.',
                    maxPts: 20, mana: 35, cd: 45, group: 'fire', dmgBase: 20, dmgPerLvl: 10, req: 'meteor:10',
                    synergies: [{ from: 'fire_mastery', pctPerPt: 4 }]
                },
            ]
        },

        // ═══ COLD — Blizzard Queen build ═══
        {
            id: 'cold', name: 'Cold', icon: '❄️',
            nodes: [
                {
                    id: 'ice_bolt', row: 0, col: 1, type: 'active', icon: '🧊', name: 'Ice Bolt',
                    desc: 'Active · Shoot a cold shard for 8 + 6 per point cold damage that slows the target by 40% for 2 seconds. Your main cold kiting tool and synergy booster.',
                    tip: 'Max lvl (20): 128 cold damage + slow.',
                    maxPts: 20, mana: 6, cd: 0, group: 'cold', dmgBase: 8, dmgPerLvl: 6
                },
                {
                    id: 'frost_nova', row: 1, col: 0, type: 'active', icon: '💫', name: 'Frost Nova',
                    desc: 'Active · Release a 360° burst of cold dealing 15 + 8 per point cold damage to all nearby enemies and slowing them 60% for 3 seconds. Emergency escape skill.',
                    tip: 'Max lvl (20): 175 AoE cold + crowd control.',
                    maxPts: 20, mana: 14, cd: 8, group: 'cold', dmgBase: 15, dmgPerLvl: 8
                },
                {
                    id: 'frozen_armor', row: 1, col: 2, type: 'active', icon: '🧊', name: 'Frozen Armor',
                    desc: 'Active · Encase yourself in ice armor, gaining +10 + 3% per point defense. Enemies who hit you in melee are automatically chilled for 2 seconds. Lasts 120 + 10 per point seconds.',
                    tip: 'Max lvl (20): +70% defense · melee auto-chill. Essential survivability.',
                    maxPts: 20, mana: 12, cd: 0, group: 'buff', req: 'ice_bolt:1'
                },
                {
                    id: 'cold_mastery', row: 2, col: 0, type: 'passive', icon: '🔵', name: 'Cold Mastery',
                    desc: 'Passive · +5% cold damage per point. At 10 points, chill and freeze durations are extended by +25%. The cornerstone of every cold build.',
                    tip: 'Max lvl (20): +100% cold damage · freeze duration bonus at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'blizzard', row: 2, col: 1, type: 'active', icon: '🌨️', name: 'Blizzard',
                    desc: 'Active · Summon a blizzard at target location, dealing 10 + 7 per point cold AoE damage per second for 4 seconds. Everything caught inside is permanently slowed. ★ Synergy: +5% per Ice Bolt · +4% per Ice Blast.',
                    tip: 'Max lvl (20): 150/s × 4s = 600 AoE cold. Max coverage build.',
                    maxPts: 20, mana: 18, cd: 12, group: 'cold', dmgBase: 10, dmgPerLvl: 7, req: 'ice_bolt:5',
                    synergies: [{ from: 'ice_bolt', pctPerPt: 5 }, { from: 'ice_blast', pctPerPt: 4 }]
                },
                {
                    id: 'ice_blast', row: 3, col: 2, type: 'active', icon: '💨', name: 'Ice Blast',
                    desc: 'Active · Fire a powerful ice blast dealing 25 + 12 per point cold damage with a 30% chance to freeze the target solid for 3 seconds.',
                    tip: 'Max lvl (20): 265 cold + 30% freeze chance.',
                    maxPts: 20, mana: 13, cd: 2, group: 'cold', dmgBase: 25, dmgPerLvl: 12, req: 'frost_nova:5'
                },
                {
                    id: 'frozen_orb', row: 3, col: 0, type: 'active', icon: '🔵', name: 'Frozen Orb',
                    desc: 'Active · Launch an orb that slowly drifts forward, firing ice bolts in all directions. Total damage: 40 + 15 per point spread over 2 seconds. Covers a huge area.',
                    tip: 'Max lvl (20): 340 total cold damage spread across a wide area.',
                    maxPts: 20, mana: 25, cd: 10, group: 'cold', dmgBase: 40, dmgPerLvl: 15, req: 'blizzard:5'
                },
                {
                    id: 'absolute_zero', row: 4, col: 1, type: 'active', icon: '☃️', name: 'Absolute Zero',
                    desc: 'Active · Unleash a catastrophic wave of cold freezing ALL enemies in view for 4 seconds and dealing 80 + 30 per point cold damage. When the freeze expires enemies shatter for bonus AoE damage. 60s cooldown.',
                    tip: 'Max lvl (20): 680 damage · then AoE shatter. The cold ultimate.',
                    maxPts: 20, mana: 40, cd: 60, group: 'cold', dmgBase: 80, dmgPerLvl: 30, req: 'frozen_orb:10',
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
                    desc: 'Active · Release 3 + 0.15 per point erratic bolts in a spread dealing 5 + 3 per point lightning damage each. More bolts appear at higher levels, covering a wide cone.',
                    tip: 'Max lvl (20): 6 bolts × 65 damage = 390 total (all hit same target).',
                    maxPts: 20, mana: 5, cd: 0, group: 'lightning', dmgBase: 5, dmgPerLvl: 3
                },
                {
                    id: 'static_field', row: 1, col: 0, type: 'active', icon: '🌩️', name: 'Static Field',
                    desc: 'Active · Discharge electricity that instantly removes 25 + 1% per point of the CURRENT HP from every enemy in range. Cannot kill, but invaluable against high-HP bosses.',
                    tip: 'Max lvl (20): 45% max-HP reduction in one cast. Boss shredder.',
                    maxPts: 20, mana: 8, cd: 4, group: 'lightning'
                },
                {
                    id: 'nova', row: 1, col: 2, type: 'active', icon: '💫', name: 'Nova',
                    desc: 'Active · Release a ring of lightning in all directions dealing 12 + 8 per point lightning damage. Hits ALL enemies around you. Zero cooldown.',
                    tip: 'Max lvl (20): 172 damage to every enemy in 360°. AoE clear spam.',
                    maxPts: 20, mana: 11, cd: 0, group: 'lightning', dmgBase: 12, dmgPerLvl: 8
                },
                {
                    id: 'lightning_mastery', row: 2, col: 0, type: 'passive', icon: '🟡', name: 'Lightning Mastery',
                    desc: 'Passive · +5% lightning damage per point. At 10 points, chain lightning and Nova hit +1 additional target per bounce. The essential lightning passive.',
                    tip: 'Max lvl (20): +100% lightning damage · extra chain bounce at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'chain_lightning', row: 2, col: 2, type: 'active', icon: '⚡', name: 'Chain Lightning',
                    desc: 'Active · Strike a target for 30 + 15 per point lightning damage, then chain to 3 nearby enemies for 70% damage each. ★ Synergy: +5% per Charged Bolt point.',
                    tip: 'Max lvl (20): 330 primary + 231 per chain × 3. Screen coverage.',
                    maxPts: 20, mana: 15, cd: 1.5, group: 'lightning', dmgBase: 30, dmgPerLvl: 15, req: 'nova:5',
                    synergies: [{ from: 'charged_bolt', pctPerPt: 5 }]
                },
                {
                    id: 'energy_shield', row: 3, col: 0, type: 'active', icon: '🔵', name: 'Energy Shield',
                    desc: 'Active (Toggle) · Convert 60% of all incoming damage to drain mana instead of HP. While active, protects you from dying as long as you have mana. Lasts until toggled off.',
                    tip: 'Invest in mana/regen to sustain this. At high levels = near immortality.',
                    maxPts: 20, mana: 5, cd: 0, group: 'buff'
                },
                {
                    id: 'teleport', row: 3, col: 2, type: 'active', icon: '🌀', name: 'Teleport',
                    desc: 'Active · Instantly blink to any visible location. No damage, no animation — pure mobility. Lower mana cost per point. The most powerful escape / positioning tool in the game.',
                    tip: 'Max lvl (20): 5 mana cost. Use constantly for repositioning.',
                    maxPts: 20, mana: 24, cd: 0, group: 'movement', req: 'energy_shield:1'
                },
                {
                    id: 'thunder_storm', row: 4, col: 1, type: 'active', icon: '🌩️', name: 'Thunder Storm',
                    desc: 'Active (Toggle) · Summon a storm that strikes a random nearby enemy with 50 + 20 per point lightning damage every 2 seconds. Passive damage while active. No attention needed.',
                    tip: 'Max lvl (20): 450 lightning every 2s = 225 DPS background damage.',
                    maxPts: 20, mana: 15, cd: 0, group: 'lightning', dmgBase: 50, dmgPerLvl: 20, req: 'chain_lightning:10',
                    synergies: [{ from: 'lightning_mastery', pctPerPt: 4 }]
                },
            ]
        },
    ]
};
