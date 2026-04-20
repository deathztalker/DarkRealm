/**
 * RANGER — Class Definition
 * Three trees: Archery (ranged DPS) · Traps (area control) · Nature (wilderness utility)
 */
export const RANGER_CLASS = {
    id: 'ranger', name: 'Ranger', icon: '🏹',
    description: 'A master archer and wilderness expert who picks targets from extreme range, controls terrain with traps, and communes with animal companions.',
    stats: { str: 15, dex: 30, vit: 15, int: 10 },
    trees: [

        // ═══ ARCHERY — High single-target ranged DPS ═══
        {
            id: 'archery', name: 'Archery', icon: '🏹',
            nodes: [
                {
                    id: 'magic_arrow', row: 0, col: 1, type: 'active', icon: '🏹', name: 'Magic Arrow',
                    desc: 'Active · Imbue your arrow with arcane energy for 10 + 5 per point magic damage. No cooldown. Generates 1 mana on hit (free after 10 casts).',
                    tip: 'Max lvl (20): 110 magic damage per arrow. Main filler attack.',
                    maxPts: 20, mana: 3, cd: 0, group: 'arrow', dmgBase: 10, dmgPerLvl: 5
                },
                {
                    id: 'bow_mastery', row: 1, col: 0, type: 'passive', icon: '🎯', name: 'Bow Mastery',
                    desc: 'Passive · +5% projectile damage per point and +5 attack range per point. You can literally shoot from further away as you invest here.',
                    tip: 'Max lvl (20): +100% damage · +100 attack range. Stack with sniper builds.',
                    maxPts: 20
                },
                {
                    id: 'multi_shot', row: 1, col: 2, type: 'active', icon: '🏹', name: 'Multi-Shot',
                    desc: 'Active · Fire 3 + 0.2 per point arrows simultanously in a spread dealing 15 + 7 per point damage each. More arrows appear at higher levels. Great for grouped enemies.',
                    tip: 'Max lvl (20): 7 arrows × 155 damage each. Effective vs packs.',
                    maxPts: 20, mana: 12, cd: 1.5, group: 'arrow', dmgBase: 15, dmgPerLvl: 7, req: 'magic_arrow:3'
                },
                {
                    id: 'hunters_mark', row: 2, col: 1, type: 'active', icon: '🎯', name: 'Hunter\'s Mark',
                    desc: 'Active · Brand a target with a hunting mark for 10 + 1 per point seconds. All your attacks against the marked target deal +30% damage, and the target cannot stealth or hide.',
                    tip: 'Max lvl (20): +30% damage multiplier for 30s. Open every boss fight.',
                    maxPts: 20, mana: 5, cd: 0
                },
                {
                    id: 'rapid_fire', row: 3, col: 0, type: 'active', icon: '⚡', name: 'Rapid Fire',
                    desc: 'Active · Channel a rapid salvo of 10 + 0.5 per point arrows in 2 seconds dealing 10 + 6 per point physical damage each. No cooldown. The ultimate sustained ranged DPS channel.',
                    tip: 'Max lvl (20): 20 arrows × 130 each = 2,600 in 2s.',
                    maxPts: 20, mana: 18, cd: 0, group: 'arrow', dmgBase: 10, dmgPerLvl: 6, req: 'multi_shot:5'
                },
                {
                    id: 'guided_arrow', row: 3, col: 2, type: 'active', icon: '✨', name: 'Guided Arrow',
                    desc: 'Active · Fire a magical arrow that homes in on the nearest enemy dealing 35 + 15 per point magic damage. Always hits its target — no skill shot required.',
                    tip: 'Max lvl (20): 335 magic damage · guaranteed hit. Boss-killing reliable damage.',
                    maxPts: 20, mana: 14, cd: 2, group: 'arrow', dmgBase: 35, dmgPerLvl: 15, req: 'hunters_mark:5'
                },
                {
                    id: 'strafe', row: 4, col: 1, type: 'active', icon: '🌀', name: 'Strafe',
                    desc: 'Active · Lock in an automatic firing stance for 5 seconds, automatically firing at the nearest enemy every 0.5s for 20 + 8 per point physical damage. You can still move while strafing.',
                    tip: 'Max lvl (20): 180 per shot every 0.5s for 5s = 1,800 total hands-free DPS.',
                    maxPts: 20, mana: 20, cd: 8, group: 'arrow', dmgBase: 20, dmgPerLvl: 8, req: 'rapid_fire:5',
                    synergies: [{ from: 'bow_mastery', pctPerPt: 4 }]
                },
            ]
        },

        // ═══ TRAPS — Terrain control ═══
        {
            id: 'traps', name: 'Traps', icon: '⚙️',
            nodes: [
                {
                    id: 'frost_trap', row: 0, col: 1, type: 'active', icon: '🧊', name: 'Frost Trap',
                    desc: 'Active · Plant a trap that freezes the first enemy to trigger it solid for 2 + 0.1 per point seconds and deals 15 + 6 per point cold damage in an AoE.',
                    tip: 'Max lvl (20): 4s freeze + 135 cold AoE. Perfect chokepoint controller.',
                    maxPts: 20, mana: 10, cd: 1.5
                },
                {
                    id: 'trap_mastery_r', row: 1, col: 0, type: 'passive', icon: '🔧', name: 'Trap Mastery',
                    desc: 'Passive · +5% trap damage per point and trap blast radius grows +4% per point. At 5 points, you can have 2 traps active simultaneously.',
                    tip: 'Max lvl (20): +100% trap damage · much larger explosion areas · 2 traps at 5pts.',
                    maxPts: 20
                },
                {
                    id: 'ensnare', row: 1, col: 2, type: 'active', icon: '🕸️', name: 'Ensnare',
                    desc: 'Active · Fire a net that roots a target for 2 + 0.1 per point seconds preventing movement. Also slows nearby enemies by 30% for the duration.',
                    tip: 'Max lvl (20): 4s root + 30% AoE slow. Standard opener for a trapped target.',
                    maxPts: 20, mana: 8, cd: 6
                },
                {
                    id: 'viper_arrow', row: 2, col: 1, type: 'active', icon: '🐍', name: 'Viper Arrow',
                    desc: 'Active · Shoot a arrow coated in deadly venom dealing 5 + 3 per point poison damage per second for 5 seconds. Combines with Hunter\'s Mark for amplified DoT.',
                    tip: 'Max lvl (20): 65/s × 5s = 325 total poison per hit.',
                    maxPts: 20, mana: 6, cd: 0, group: 'poison', dmgBase: 5, dmgPerLvl: 3, req: 'frost_trap:3'
                },
                {
                    id: 'ice_trap', row: 3, col: 1, type: 'active', icon: '❄️', name: 'Ice Trap',
                    desc: 'Active · A powerful freeze trap dealing 35 + 15 per point cold damage that freezes all enemies in range for 1.5 seconds. ★ Synergy: +4% damage per Trap Mastery point.',
                    tip: 'Max lvl (20): 335 cold AoE + 1.5s freeze.',
                    maxPts: 20, mana: 15, cd: 1.5, group: 'cold', dmgBase: 35, dmgPerLvl: 15, req: 'ensnare:3',
                    synergies: [{ from: 'trap_mastery_r', pctPerPt: 4 }]
                },
            ]
        },

        // ═══ NATURE — Companions and wilderness ═══
        {
            id: 'nature', name: 'Nature', icon: '🌿',
            nodes: [
                {
                    id: 'companion_hawk', row: 0, col: 1, type: 'active', icon: '🦅', name: 'Hawk Companion',
                    desc: 'Active · Summon a combat hawk that attacks alongside you dealing 8 + 4 per point physical damage per hit with a 10% chance to blind for 2s. Persistent companion until killed.',
                    tip: 'Max lvl (20): Hawk deals 88 per hit with free blinds on 10% of hits.',
                    maxPts: 20, mana: 20, cd: 5
                },
                {
                    id: 'tracking', row: 1, col: 0, type: 'passive', icon: '👁️', name: 'Tracking',
                    desc: 'Passive · +3% movement speed per point and +2% critical chance per point against debuffed enemies. The wilderness survival passive — faster and deadlier.',
                    tip: 'Max lvl (20): +60% move speed · +40% crit vs debuffed targets.',
                    maxPts: 20
                },
                {
                    id: 'nature_mastery', row: 1, col: 2, type: 'passive', icon: '🌿', name: 'Nature Affinity',
                    desc: 'Passive · +4% poison damage per point and +2% lightning damage per point. The nature-element passive for rangers who blend magic with arrows.',
                    tip: 'Max lvl (20): +80% poison damage · +40% lightning damage.',
                    maxPts: 20
                },
                {
                    id: 'mark_death', row: 2, col: 1, type: 'active', icon: '💀', name: 'Mark of Death',
                    desc: 'Active · Curse a target with the Mark of Death for 10 seconds, causing them to take +50 + 3% per point more damage from all sources. Best single-target damage amplifier.',
                    tip: 'Max lvl (20): Target takes +110% more damage for 10s. Always open with this on bosses.',
                    maxPts: 20, mana: 8, cd: 0
                },
                {
                    id: 'wolf_companion', row: 3, col: 1, type: 'active', icon: '🐺', name: 'Wolf Pack',
                    desc: 'Active · Summon 2 dire wolves that charge and maul enemies for 15 + 6 per point physical damage. Wolves last 30 + 1 per point seconds and fight independently.',
                    tip: 'Max lvl (20): 2 wolves each hitting for 135 damage, lasting 50s.',
                    maxPts: 20, mana: 25, cd: 5, req: 'companion_hawk:3',
                    synergies: [{ from: 'tracking', pctPerPt: 3 }]
                },
            ]
        },
    ]
};
