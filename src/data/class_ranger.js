/**
 * RANGER — Class Definition
 * Three trees: Archery (bow skills) · Traps (utility items) · Nature (companions)
 */
export const RANGER_CLASS = {
    id: 'ranger', name: 'Ranger', icon: '🏹',
    description: 'A master of ranged combat and tactical traps. Bonds with nature\'s creatures to overwhelm enemies from afar.',
    stats: { str: 15, dex: 25, vit: 20, int: 15 },
    trees: [

        // ═══ ARCHERY — Ranged builds ═══
        {
            id: 'archery', name: 'Archery', icon: '🏹',
            nodes: [
                {
                    id: 'ice_arrow', row: 0, col: 0, type: 'active', icon: '❄️', name: 'Ice Arrow',
                    desc: 'Active · Fire an arrow that deals 15 + 8 cold damage and slows the target.',
                    tip: 'Max lvl (20): 175 cold damage.',
                    maxPts: 20, mana: 8, cd: 0, group: 'cold',
                    synergies: [{ from: 'frozen_trap', pctPerPt: 5 }]
                },
                {
                    id: 'magic_arrow', row: 0, col: 1, type: 'active', icon: '🏹', name: 'Magic Arrow',
                    desc: 'Active · Fire an arrow of pure energy dealing 12 + 6 per point magic damage. Does not consume ammo.',
                    tip: 'Max lvl (20): 132 magic damage.',
                    maxPts: 20, mana: 5, cd: 0, group: 'magic'
                },
                {
                    id: 'immolation_arrow', row: 0, col: 2, type: 'active', icon: '🔥', name: 'Immolation Arrow',
                    desc: 'Active · An arrow that explodes on impact, dealing 20 + 10 fire damage and burning the area.',
                    tip: 'Max lvl (20): 220 fire splash.',
                    maxPts: 20, mana: 12, cd: 1, group: 'fire',
                    synergies: [{ from: 'immolation_trap', pctPerPt: 5 }]
                },
                {
                    id: 'bow_mastery', row: 1, col: 0, type: 'passive', icon: '🎯', name: 'Bow Mastery',
                    desc: 'Passive · Increases Bow damage by 5% and Attack Rating by 10% per point.',
                    tip: 'Max lvl (20): +100% damage · +200% AR.',
                    maxPts: 20
                },
                {
                    id: 'piercing_arrow', row: 1, col: 2, type: 'active', icon: '💨', name: 'Piercing Arrow',
                    desc: 'Active · An arrow that travels through enemies, dealing 15 + 8 damage to all in its path.',
                    tip: 'Max lvl (20): Unlimited piercing.',
                    maxPts: 20, mana: 10, cd: 2, group: 'arrow', dmgBase: 15, dmgPerLvl: 8, req: 'magic_arrow:3'
                },
                {
                    id: 'multi_shot', row: 2, col: 1, type: 'active', icon: '🏹', name: 'Multi-Shot',
                    desc: 'Active · Fire 3 + 1 per 2 levels arrows in a cone, dealing 75% weapon damage.',
                    tip: 'Max lvl (20): 13 arrow spray.',
                    maxPts: 20, mana: 15, cd: 3, group: 'arrow', req: 'piercing_arrow:1'
                },
                {
                    id: 'hunters_mark', row: 3, col: 0, type: 'active', icon: '🎯', name: 'Hunter\'s Mark',
                    desc: 'Active · Mark a target: they take 20% + 2% per point more damage from all sources for 10s.',
                    tip: 'Max lvl (20): 60% damage vulnerability.',
                    maxPts: 20, mana: 8, cd: 5, group: 'buff'
                },
                {
                    id: 'explosive_arrow', row: 3, col: 2, type: 'active', icon: '💥', name: 'Explosive Arrow',
                    desc: 'Active · Fire an arrow that explodes for 30 + 15 per point fire damage in a 3m radius.',
                    tip: 'Max lvl (20): 330 AoE fire damage.',
                    maxPts: 20, mana: 18, cd: 4, group: 'fire', dmgBase: 30, dmgPerLvl: 15, req: 'multi_shot:5'
                },
                {
                    id: 'rapid_fire', row: 4, col: 1, type: 'active', icon: '⚡', name: 'Rapid Fire',
                    desc: 'Active · Increase attack speed by 50% + 5% per point for 10 seconds. 60s cooldown.',
                    tip: 'Max lvl (20): +150% speed burst.',
                    maxPts: 20, mana: 25, cd: 60, group: 'buff', req: 'explosive_arrow:1'
                },
                {
                    id: 'guided_arrow', row: 5, col: 0, type: 'active', icon: '✨', name: 'Guided Arrow',
                    desc: 'Active · An arrow that tracks the target and deals 40 + 20 per point physical damage.',
                    tip: 'Max lvl (20): Guaranteed homing hit.',
                    maxPts: 20, mana: 12, cd: 2, group: 'arrow', dmgBase: 40, dmgPerLvl: 20, req: 'rapid_fire:5'
                },
                {
                    id: 'volley', row: 5, col: 2, type: 'active', icon: '🌧️', name: 'Volley',
                    desc: 'Active · Rain arrows down on an area for 5s, dealing 15 + 8 damage per second.',
                    tip: 'Max lvl (20): 175/s area denial.',
                    maxPts: 20, mana: 30, cd: 15, group: 'arrow', dmgBase: 15, dmgPerLvl: 8, req: 'rapid_fire:5'
                },
                {
                    id: 'strafe', row: 6, col: 1, type: 'active', icon: '🌀', name: 'Strafe',
                    desc: 'Active · Fire at all nearby enemies simultaneously, dealing 100% weapon damage to each.',
                    tip: 'Max lvl (20): Clear the screen.',
                    maxPts: 20, mana: 40, cd: 10, group: 'arrow', req: 'volley:1'
                }
            ]
        },

        // ═══ TRAPS — Utility items ═══
        {
            id: 'traps', name: 'Traps', icon: '⚙️',
            nodes: [
                {
                    id: 'frost_trap', row: 0, col: 1, type: 'active', icon: '🧊', name: 'Frost Trap',
                    desc: 'Active · Place a trap that freezes the first enemy to trigger it for 2s.',
                    tip: 'Max lvl (20): Reliable crowd control.',
                    maxPts: 20, mana: 12, cd: 5, group: 'traps'
                },
                {
                    id: 'trap_mastery_r', row: 1, col: 0, type: 'passive', icon: '🔧', name: 'Trap Mastery',
                    desc: 'Passive · +5% trap damage and +10% trap trigger radius per point.',
                    tip: 'Max lvl (20): +100% trap damage.',
                    maxPts: 20
                },
                {
                    id: 'ensnare', row: 1, col: 2, type: 'active', icon: '🕸️', name: 'Ensnare',
                    desc: 'Active · Slows all enemies in a target area by 50% for 6 seconds.',
                    tip: 'Max lvl (20): Wide-area slow.',
                    maxPts: 20, mana: 10, cd: 8, group: 'traps', req: 'frost_trap:3'
                },
                {
                    id: 'immolation_trap', row: 2, col: 0, type: 'active', icon: '🔥', name: 'Immolation Trap',
                    desc: 'Active · A trap that explodes into a pool of fire dealing 20 + 10 fire damage per second.',
                    tip: 'Max lvl (20): Fire area denial.',
                    maxPts: 20, mana: 15, cd: 10, group: 'fire', dmgBase: 20, dmgPerLvl: 10, req: 'trap_mastery_r:5'
                },
                {
                    id: 'viper_arrow', row: 2, col: 1, type: 'active', icon: '🐍', name: 'Viper Arrow',
                    desc: 'Active · Fire an arrow that poisons the target for 15 + 8 damage per second for 10s.',
                    tip: 'Max lvl (20): High duration poison.',
                    maxPts: 20, mana: 12, cd: 0, group: 'poison', dmgBase: 15, dmgPerLvl: 8, req: 'ensnare:1'
                },
                {
                    id: 'lightning_sentry', row: 3, col: 0, type: 'active', icon: '⚡', name: 'Lightning Sentry',
                    desc: 'Active · Place a turret that fires lightning bolts at nearby enemies.',
                    tip: 'Max lvl (20): High DPS static turret.',
                    maxPts: 20, mana: 20, cd: 15, group: 'lightning', req: 'immolation_trap:3'
                },
                {
                    id: 'death_sentry', row: 3, col: 1, type: 'active', icon: '💀', name: 'Death Sentry',
                    desc: 'Active · Turret that fires at enemies and explodes nearby corpses like Corpse Explosion.',
                    tip: 'Max lvl (20): Clear rooms with chain explosions.',
                    maxPts: 20, mana: 25, cd: 20, group: 'traps', req: 'lightning_sentry:3'
                },
                {
                    id: 'snake_trap', row: 3, col: 2, type: 'active', icon: '🐍', name: 'Snake Trap',
                    desc: 'Active · Release a trap that spawns 3 venomous snakes to attack enemies.',
                    tip: 'Max lvl (20): Poison minion trap.',
                    maxPts: 20, mana: 20, cd: 15, group: 'traps', req: 'viper_arrow:5'
                },
                {
                    id: 'explosive_trap', row: 4, col: 0, type: 'active', icon: '💣', name: 'Explosive Trap',
                    desc: 'Active · A powerful landmine dealing 50 + 25 fire/physical damage in a large area.',
                    tip: 'Max lvl (20): 550 burst damage.',
                    maxPts: 20, mana: 25, cd: 12, group: 'fire', dmgBase: 50, dmgPerLvl: 25, req: 'snake_trap:1'
                },
                {
                    id: 'ice_trap', row: 4, col: 1, type: 'active', icon: '❄️', name: 'Ice Trap',
                    desc: 'Active · A trap that creates a blast of ice, freezing all enemies in a 5m radius.',
                    tip: 'Max lvl (20): Massive AoE freeze.',
                    maxPts: 20, mana: 25, cd: 15, group: 'cold', dmgBase: 20, dmgPerLvl: 10, req: 'snake_trap:1'
                },
                {
                    id: 'trap_launcher', row: 5, col: 1, type: 'passive', icon: '🏹', name: 'Trap Launcher',
                    desc: 'Passive · You can now throw your traps up to 10m away instead of placing them at your feet.',
                    tip: 'Max lvl (1): Greatly improves trap versatility.',
                    maxPts: 1, req: 'ice_trap:5'
                }
            ]
        },

        // ═══ NATURE — Companions builds ═══
        {
            id: 'nature', name: 'Nature', icon: '🌿',
            nodes: [
                {
                    id: 'companion_hawk', row: 0, col: 1, type: 'active', icon: '🦅', name: 'Hawk Companion',
                    desc: 'Summon · A hawk that strikes enemies from above dealing 10 + 5 damage.',
                    tip: 'Max lvl (20): Fast flying harasser.',
                    maxPts: 20, mana: 15, cd: 10, group: 'summon'
                },
                {
                    id: 'tracking', row: 1, col: 0, type: 'passive', icon: '👁️', name: 'Tracking',
                    desc: 'Passive · +3% move speed and +2% critical chance per point against marked targets.',
                    tip: 'Max lvl (20): +60% speed · +40% crit.',
                    maxPts: 20
                },
                {
                    id: 'nature_mastery', row: 1, col: 2, type: 'passive', icon: '🌿', name: 'Nature Affinity',
                    desc: 'Passive · +4% poison damage and +2% lightning damage per point.',
                    tip: 'Max lvl (20): +80% poison · +40% lightning.',
                    maxPts: 20
                },
                {
                    id: 'aspect_hawk', row: 2, col: 0, type: 'active', icon: '🦅', name: 'Aspect of the Hawk',
                    desc: 'Active · Enter a state of focus: +30% ranged damage and +20% haste for 15s.',
                    tip: 'Max lvl (20): Ranged power surge.',
                    maxPts: 20, mana: 20, cd: 45, group: 'buff', req: 'tracking:3'
                },
                {
                    id: 'mark_death', row: 2, col: 1, type: 'active', icon: '💀', name: 'Mark of Death',
                    desc: 'Active · Curse a target to take 50% more damage from your companions for 10s.',
                    tip: 'Max lvl (20): Ultimate focus target.',
                    maxPts: 20, mana: 12, cd: 10, group: 'buff', req: 'companion_hawk:5'
                },
                {
                    id: 'bear_companion', row: 2, col: 2, type: 'active', icon: '🐻', name: 'Bear Companion',
                    desc: 'Summon · A sturdy bear to tank enemies, dealing 15 + 8 damage.',
                    tip: 'Max lvl (20): 1,500 HP guardian.',
                    maxPts: 20, mana: 30, cd: 30, group: 'summon', req: 'nature_mastery:3'
                },
                {
                    id: 'aspect_cheetah', row: 3, col: 0, type: 'active', icon: '🐆', name: 'Aspect of the Cheetah',
                    desc: 'Active · +40% movement speed for 20s. Attacking cancels this effect.',
                    tip: 'Max lvl (20): Unmatched traversal speed.',
                    maxPts: 20, mana: 10, cd: 30, group: 'buff', req: 'aspect_hawk:1'
                },
                {
                    id: 'wolf_companion', row: 3, col: 1, type: 'active', icon: '🐺', name: 'Wolf Pack',
                    desc: 'Summon · Call a pack of 3 wolves to fight by your side for 20 seconds.',
                    tip: 'Max lvl (20): High damage melee pack.',
                    maxPts: 20, mana: 25, cd: 40, group: 'summon', req: 'mark_death:1'
                },
                {
                    id: 'bestial_wrath', row: 4, col: 1, type: 'active', icon: '🔥', name: 'Bestial Wrath',
                    desc: 'Active · Your companions deal 100% more damage and are immune to CC for 15s.',
                    tip: 'Max lvl (20): The ultimate pet burst.',
                    maxPts: 20, mana: 30, cd: 90, group: 'buff', req: 'wolf_companion:5'
                },
                {
                    id: 'spirit_bond', row: 5, col: 1, type: 'passive', icon: '🔗', name: 'Spirit Bond',
                    desc: 'Passive · 10% of damage taken is redirected to your companions. 5% of their damage heals you.',
                    tip: 'Max lvl (20): Mutual survival link.',
                    maxPts: 20, req: 'bestial_wrath:1'
                }
            ]
        },
    ]
};
