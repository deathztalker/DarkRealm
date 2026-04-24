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
                    desc: 'Active · Imbue your arrow with arcane energy for 10 + 5 per point magic damage. No cooldown. Generates 1 mana on hit.',
                    tip: 'Max lvl (20): 110 magic damage per arrow. Main filler attack.',
                    maxPts: 20, mana: 3, cd: 0, group: 'arrow', dmgBase: 10, dmgPerLvl: 5, wepPct: 100
                },
                {
                    id: 'bow_mastery', row: 1, col: 0, type: 'passive', icon: '🎯', name: 'Bow Mastery',
                    desc: 'Passive · +5% projectile damage per point and +5 attack range per point.',
                    tip: 'Max lvl (20): +100% damage · +100 attack range.',
                    maxPts: 20
                },
                {
                    id: 'piercing_arrow', row: 1, col: 2, type: 'active', icon: '💨', name: 'Piercing Arrow',
                    desc: 'Active · Fire an arrow that pierces through all enemies in a line, dealing 15 + 8 per point damage.',
                    tip: 'Max lvl (20): 175 piercing damage.',
                    maxPts: 20, mana: 8, cd: 0, group: 'arrow', dmgBase: 15, dmgPerLvl: 8, wepPct: 120, req: 'magic_arrow:3'
                },
                {
                    id: 'multi_shot', row: 2, col: 1, type: 'active', icon: '🏹', name: 'Multi-Shot',
                    desc: 'Active · Fire 3 + 0.2 per point arrows simultanously in a spread dealing 15 + 7 per point damage each.',
                    tip: 'Max lvl (20): 7 arrows × 155 damage each.',
                    maxPts: 20, mana: 12, cd: 1.5, group: 'arrow', dmgBase: 15, dmgPerLvl: 7, wepPct: 75, req: 'magic_arrow:3'
                },
                {
                    id: 'hunters_mark', row: 3, col: 0, type: 'active', icon: '🎯', name: 'Hunter\'s Mark',
                    desc: 'Active · Brand a target for 10 + 1 per point seconds. All your attacks deal +30% damage to it.',
                    tip: 'Max lvl (20): +30% damage multiplier for 30s.',
                    maxPts: 20, mana: 5, cd: 0
                },
                {
                    id: 'explosive_arrow', row: 3, col: 2, type: 'active', icon: '💥', name: 'Explosive Arrow',
                    desc: 'Active · Fire a blazing arrow that explodes on impact dealing 25 + 12 per point fire damage in an AoE.',
                    tip: 'Max lvl (20): 265 fire AoE damage.',
                    maxPts: 20, mana: 15, cd: 0, group: 'arrow', dmgBase: 25, dmgPerLvl: 12, wepPct: 110, req: 'piercing_arrow:5'
                },
                {
                    id: 'rapid_fire', row: 4, col: 1, type: 'active', icon: '⚡', name: 'Rapid Fire',
                    desc: 'Active · Channel a rapid salvo of 10 + 0.5 per point arrows in 2 seconds dealing 10 + 6 per point physical damage each.',
                    tip: 'Max lvl (20): 20 arrows × 130 each = 2,600 in 2s.',
                    maxPts: 20, mana: 18, cd: 0, group: 'arrow', dmgBase: 10, dmgPerLvl: 6, wepPct: 60, req: 'multi_shot:5'
                },
                {
                    id: 'guided_arrow', row: 5, col: 0, type: 'active', icon: '✨', name: 'Guided Arrow',
                    desc: 'Active · Fire a magical arrow that homes in on the nearest enemy dealing 35 + 15 per point magic damage.',
                    tip: 'Max lvl (20): 335 magic damage · guaranteed hit.',
                    maxPts: 20, mana: 14, cd: 2, group: 'arrow', dmgBase: 35, dmgPerLvl: 15, wepPct: 140, req: 'hunters_mark:5'
                },
                {
                    id: 'volley', row: 5, col: 2, type: 'active', icon: '🌧️', name: 'Volley',
                    desc: 'Active · Rain arrows for base + 60% weapon damage per second.',
                    tip: 'Max lvl (20): Scaling area denial.',
                    maxPts: 20, mana: 25, cd: 10, group: 'arrow', dmgBase: 20, dmgPerLvl: 10, wepPct: 60, req: 'explosive_arrow:5'
                },
                {
                    id: 'strafe', row: 6, col: 1, type: 'active', icon: '🌀', name: 'Strafe',
                    desc: 'Active · Lock in an automatic firing stance for 5 seconds, firing at the nearest enemy every 0.5s for 20 + 8 per point damage. You can move while strafing.',
                    tip: 'Max lvl (20): 180 per shot every 0.5s for 5s.',
                    maxPts: 20, mana: 20, cd: 8, group: 'arrow', dmgBase: 20, dmgPerLvl: 8, wepPct: 90, req: 'rapid_fire:5',
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
                    desc: 'Active · Plant trap dealing base + 45% weapon damage as cold in an AoE and freezing.',
                    tip: 'Max lvl (20): 4s freeze + scaling cold blast.',
                    maxPts: 20, mana: 10, cd: 1.5, dmgBase: 15, dmgPerLvl: 6, wepPct: 45,
                },
                {
                    id: 'trap_mastery_r', row: 1, col: 0, type: 'passive', icon: '🔧', name: 'Trap Mastery',
                    desc: 'Passive · +5% trap damage per point and trap blast radius grows +4% per point. At 5 points, you can have 2 traps active.',
                    tip: 'Max lvl (20): +100% trap damage · much larger explosion areas.',
                    maxPts: 20
                },
                {
                    id: 'ensnare', row: 1, col: 2, type: 'active', icon: '🕸️', name: 'Ensnare',
                    desc: 'Active · Fire a net that roots a target for 2 + 0.1 per point seconds preventing movement. Slows nearby enemies by 30%.',
                    tip: 'Max lvl (20): 4s root + 30% AoE slow.',
                    maxPts: 20, mana: 8, cd: 6
                },
                {
                    id: 'immolation_trap', row: 2, col: 0, type: 'active', icon: '🔥', name: 'Immolation Trap',
                    desc: 'Active · Plant trap dealing base + 35% weapon damage per second as fire.',
                    tip: 'Max lvl (20): Scaling fire DoT area.',
                    maxPts: 20, mana: 12, cd: 1.5, dmgBase: 10, dmgPerLvl: 5, wepPct: 35, req: 'trap_mastery_r:3'
                },
                {
                    id: 'viper_arrow', row: 2, col: 1, type: 'active', icon: '🐍', name: 'Viper Arrow',
                    desc: 'Active · Shoot arrow dealing base + 50% weapon damage per second as poison.',
                    tip: 'Max lvl (20): Scaling poison DoT.',
                    maxPts: 20, mana: 6, cd: 0, group: 'poison', dmgBase: 5, dmgPerLvl: 3, wepPct: 50, req: 'frost_trap:3'
                },
                {
                    id: 'snake_trap', row: 3, col: 2, type: 'active', icon: '🐍', name: 'Snake Trap',
                    desc: 'Active · Plant trap releasing 5 snakes dealing base + 15% weapon damage each.',
                    tip: 'Max lvl (20): Scaling poison minion army.',
                    maxPts: 20, mana: 15, cd: 10, dmgBase: 6, dmgPerLvl: 3, wepPct: 15, req: 'ensnare:3'
                },
                {
                    id: 'explosive_trap', row: 4, col: 0, type: 'active', icon: '💣', name: 'Explosive Trap',
                    desc: 'Active · Plant trap detonating for base + 150% weapon damage in a large area.',
                    tip: 'Max lvl (20): High explosive scaling.',
                    maxPts: 20, mana: 20, cd: 5, dmgBase: 50, dmgPerLvl: 20, wepPct: 150, req: 'immolation_trap:5'
                },
                {
                    id: 'ice_trap', row: 4, col: 1, type: 'active', icon: '❄️', name: 'Ice Trap',
                    desc: 'Active · Freeze trap dealing base + 100% weapon damage and freezing AoE.',
                    tip: 'Max lvl (20): Scaling cold CC.',
                    maxPts: 20, mana: 15, cd: 1.5, group: 'cold', dmgBase: 35, dmgPerLvl: 15, wepPct: 100, req: 'viper_arrow:5',
                    synergies: [{ from: 'trap_mastery_r', pctPerPt: 4 }]
                },
                {
                    id: 'trap_launcher', row: 5, col: 1, type: 'passive', icon: '🏹', name: 'Trap Launcher',
                    desc: 'Passive · Your traps can now be launched to the target location instead of being placed at your feet. Reduces trap cooldowns by 20%.',
                    tip: 'Max lvl (1): Ranged trap deployment.',
                    maxPts: 1, req: 'ice_trap:5'
                },
            ]
        },

        // ═══ NATURE — Companions and wilderness ═══
        {
            id: 'nature', name: 'Nature', icon: '🌿',
            nodes: [
                {
                    id: 'companion_hawk', row: 0, col: 1, type: 'active', icon: '🦅', name: 'Hawk Companion',
                    desc: 'Active · Summon hawk dealing base + 30% weapon damage per hit.',
                    tip: 'Max lvl (20): Scaling bird of prey.',
                    maxPts: 20, mana: 20, cd: 5, dmgBase: 8, dmgPerLvl: 4, wepPct: 30,
                },
                {
                    id: 'tracking', row: 1, col: 0, type: 'passive', icon: '👁️', name: 'Tracking',
                    desc: 'Passive · +3% movement speed per point and +2% critical chance per point against debuffed enemies.',
                    tip: 'Max lvl (20): +60% move speed · +40% crit vs debuffed targets.',
                    maxPts: 20
                },
                {
                    id: 'nature_mastery', row: 1, col: 2, type: 'passive', icon: '🌿', name: 'Nature Affinity',
                    desc: 'Passive · +4% poison damage per point and +2% lightning damage per point.',
                    tip: 'Max lvl (20): +80% poison damage · +40% lightning damage.',
                    maxPts: 20
                },
                {
                    id: 'aspect_hawk', row: 2, col: 0, type: 'active', icon: '🦅', name: 'Aspect of the Hawk',
                    desc: 'Active (Toggle) · Increase your attack power by 10% + 1% per point.',
                    tip: 'Max lvl (20): +30% attack power.',
                    maxPts: 20, mana: 10, cd: 0, group: 'buff', req: 'tracking:3'
                },
                {
                    id: 'mark_death', row: 2, col: 1, type: 'active', icon: '💀', name: 'Mark of Death',
                    desc: 'Active · Curse a target with the Mark of Death for 10 seconds, causing them to take +50 + 3% per point more damage from all sources.',
                    tip: 'Max lvl (20): Target takes +110% more damage for 10s.',
                    maxPts: 20, mana: 8, cd: 0
                },
                {
                    id: 'bear_companion', row: 2, col: 2, type: 'active', icon: '🐻', name: 'Bear Companion',
                    desc: 'Active · Summon bear dealing base + 50% weapon damage with high HP and taunt.',
                    tip: 'Max lvl (20): Scaling tank companion.',
                    maxPts: 20, mana: 30, cd: 10, dmgBase: 15, dmgPerLvl: 8, wepPct: 50, req: 'nature_mastery:3'
                },
                {
                    id: 'aspect_cheetah', row: 3, col: 0, type: 'active', icon: '🐆', name: 'Aspect of the Cheetah',
                    desc: 'Active (Toggle) · Increase movement speed by 20% + 1.5% per point. If hit, you are dazed for 2 seconds.',
                    tip: 'Max lvl (20): +50% movement speed.',
                    maxPts: 20, mana: 10, cd: 0, group: 'buff', req: 'aspect_hawk:3'
                },
                {
                    id: 'wolf_companion', row: 3, col: 1, type: 'active', icon: '🐺', name: 'Wolf Pack',
                    desc: 'Active · Summon 2 wolves dealing base + 40% weapon damage each.',
                    tip: 'Max lvl (20): Scaling wolf pack DPS.',
                    maxPts: 20, mana: 25, cd: 5, dmgBase: 15, dmgPerLvl: 6, wepPct: 40, req: 'companion_hawk:3',
                    synergies: [{ from: 'tracking', pctPerPt: 3 }]
                },
                {
                    id: 'bestial_wrath', row: 4, col: 1, type: 'active', icon: '🔥', name: 'Bestial Wrath',
                    desc: 'Active · Enrage your active companions, increasing their damage by 100% and making them immune to crowd control for 10 seconds. 60s cooldown.',
                    tip: 'Max lvl (20): Ultimate companion burst.',
                    maxPts: 20, mana: 20, cd: 60, group: 'buff', req: 'wolf_companion:5'
                },
            ]
        },
    ]
};
