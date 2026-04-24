/**
 * SHAMAN — Class Definition
 * Three trees: Elements (elemental DPS) · Totems (placed buffs/debuffs) · Restoration (healing)
 */
export const SHAMAN_CLASS = {
    id: 'shaman', name: 'Shaman', icon: '🌩️',
    description: 'Calls upon ancestral spirits and the raw elements to enhance allies with totems, shatter enemies with lightning, and restore the fallen.',
    stats: { str: 18, dex: 15, vit: 18, int: 19 },
    trees: [

        // ═══ ELEMENTS — Elemental burst DPS ═══
        {
            id: 'elements', name: 'Elements', icon: '⚡',
            nodes: [
                {
                    id: 'lightning_bolt', row: 0, col: 1, type: 'active', icon: '⚡', name: 'Lightning Bolt',
                    desc: 'Active · Hurl a lightning bolt dealing 12 + 8 per point lightning damage.',
                    tip: 'Max lvl (20): 172 lightning damage with no downtime.',
                    maxPts: 20, mana: 8, cd: 0.5, group: 'lightning', dmgBase: 12, dmgPerLvl: 8
                },
                {
                    id: 'flame_shock', row: 1, col: 0, type: 'active', icon: '🔥', name: 'Flame Shock',
                    desc: 'Active · Instantly scorch a target for 10 + 5 per point fire damage, and 5 + 3 damage per second for 10s.',
                    tip: 'Max lvl (20): 110 impact + 65/s DoT.',
                    maxPts: 20, mana: 10, cd: 4, group: 'fire', dmgBase: 10, dmgPerLvl: 5
                },
                {
                    id: 'elem_mastery', row: 1, col: 1, type: 'passive', icon: '🔮', name: 'Elemental Mastery',
                    desc: 'Passive · +3% fire, cold, AND lightning damage per point. At 10 points, elemental spell mana costs are reduced by 10%.',
                    tip: 'Max lvl (20): +60% to all three elements.',
                    maxPts: 20, req: 'lightning_bolt:3'
                },
                {
                    id: 'frost_shock', row: 1, col: 2, type: 'active', icon: '❄️', name: 'Frost Shock',
                    desc: 'Active · Instantly hit a target for 15 + 8 per point cold damage, slowing movement by 50% for 6s.',
                    tip: 'Max lvl (20): 175 cold damage + 50% slow.',
                    maxPts: 20, mana: 10, cd: 4, group: 'cold', dmgBase: 15, dmgPerLvl: 8
                },
                {
                    id: 'chain_lightning', row: 2, col: 1, type: 'active', icon: '⛈️', name: 'Chain Lightning',
                    desc: 'Active · Strike a target for 30 + 14 per point lightning damage that chains to 3 nearby enemies.',
                    tip: 'Max lvl (20): 310 primary + chains.',
                    maxPts: 20, mana: 15, cd: 2, group: 'lightning', dmgBase: 30, dmgPerLvl: 14, req: 'elem_mastery:3',
                    synergies: [{ from: 'lightning_bolt', pctPerPt: 5 }]
                },
                {
                    id: 'thunder_strike', row: 3, col: 0, type: 'active', icon: '💥', name: 'Thunder Strike',
                    desc: 'Active · Release a massive thunderclap AoE dealing 50 + 20 per point lightning damage and stunning for 0.6s.',
                    tip: 'Max lvl (20): 450 lightning AoE + stun.',
                    maxPts: 20, mana: 18, cd: 6, group: 'lightning', dmgBase: 50, dmgPerLvl: 20, req: 'chain_lightning:5'
                },
                {
                    id: 'elemental_focus', row: 3, col: 2, type: 'passive', icon: '🎯', name: 'Elemental Focus',
                    desc: 'Passive · Critical strikes with elemental spells reduce the mana cost of your next spell by 5% per point.',
                    tip: 'Max lvl (20): Next spell is 100% free after a crit.',
                    maxPts: 20, req: 'chain_lightning:5'
                },
                {
                    id: 'lava_burst', row: 4, col: 1, type: 'active', icon: '🌋', name: 'Lava Burst',
                    desc: 'Active · Lava erupts from the ground dealing 60 + 20 per point fire damage. Guaranteed to crit if target is burning.',
                    tip: 'Max lvl (20): 460 fire damage. Use after Flame Shock.',
                    maxPts: 20, mana: 20, cd: 8, group: 'fire', dmgBase: 60, dmgPerLvl: 20, req: 'thunder_strike:5',
                    synergies: [{ from: 'flame_shock', pctPerPt: 5 }]
                },
                {
                    id: 'earthquake', row: 5, col: 1, type: 'active', icon: '🌋', name: 'Earthquake',
                    desc: 'Active · Shake the earth for 8 seconds, dealing 30 + 10 per point physical AoE damage per second and stunning.',
                    tip: 'Max lvl (20): 230/s × 8s = 1,840 total.',
                    maxPts: 20, mana: 35, cd: 30, group: 'earth', dmgBase: 30, dmgPerLvl: 10, req: 'lava_burst:5',
                    synergies: [{ from: 'elem_mastery', pctPerPt: 4 }]
                },
                {
                    id: 'storm_caller', row: 6, col: 1, type: 'passive', icon: '🌪️', name: 'Storm Caller',
                    desc: 'Passive · Lightning spell casts have a 15% chance to reset Chain Lightning cooldown. Adds +2 chain targets permanently.',
                    tip: 'Legendary synergy for clearing.',
                    maxPts: 20, req: 'earthquake:5'
                },
                {
                    id: 'bloodlust', row: 6, col: 0, type: 'active', icon: '🔥', name: 'Bloodlust',
                    desc: 'Active · Fill yourself and allies with bloodlust, increasing Attack Speed and Cast Speed by 30% + 2% per point for 15s. 120s cooldown.',
                    tip: 'Max lvl (20): +70% Speed. The ultimate group burst buff.',
                    maxPts: 20, mana: 50, cd: 120, group: 'buff', req: 'earthquake:5'
                }
            ]
        },

        // ═══ TOTEMS — Placed utility/DPS ═══
        {
            id: 'totems', name: 'Totems', icon: '🪵',
            nodes: [
                {
                    id: 'searing_totem', row: 0, col: 1, type: 'active', icon: '🔥', name: 'Searing Totem',
                    desc: 'Active · Place a fire totem that shoots a fire bolt every second for 15 + 8 per point fire damage.',
                    tip: 'Max lvl (20): 175 fire/s.',
                    maxPts: 20, mana: 10, cd: 0
                },
                {
                    id: 'stoneskin_totem', row: 1, col: 0, type: 'active', icon: '🪨', name: 'Stoneskin Totem',
                    desc: 'Active · Place a totem that grants nearby allies +10 + 3% per point physical damage reduction.',
                    tip: 'Max lvl (20): +70% physical DR to party.',
                    maxPts: 20, mana: 12, cd: 0
                },
                {
                    id: 'totem_mastery', row: 1, col: 1, type: 'passive', icon: '🪵', name: 'Totem Mastery',
                    desc: 'Passive · Each point extends all totem durations by +20% and enlarges effect radius by +8%. Extra totem at 5pts.',
                    tip: 'Max lvl (20): 4x duration, huge radius.',
                    maxPts: 20, req: 'searing_totem:3'
                },
                {
                    id: 'tremor_totem', row: 1, col: 2, type: 'active', icon: '🌀', name: 'Tremor Totem',
                    desc: 'Active · Place a totem that pulses every 3s, removing Fear, Charm, and Sleep from nearby allies.',
                    tip: 'Max lvl (20): Vital CC counter.',
                    maxPts: 20, mana: 15, cd: 0
                },
                {
                    id: 'magma_totem', row: 2, col: 0, type: 'active', icon: '🌋', name: 'Magma Totem',
                    desc: 'Active · Place a totem that pulses 20 + 10 per point fire damage to all nearby enemies every 2s.',
                    tip: 'Max lvl (20): 220 fire AoE every 2s.',
                    maxPts: 20, mana: 15, cd: 0, req: 'stoneskin_totem:3',
                    synergies: [{ from: 'searing_totem', pctPerPt: 5 }]
                },
                {
                    id: 'windfury_totem', row: 2, col: 2, type: 'active', icon: '💨', name: 'Windfury Totem',
                    desc: 'Active · Place a totem granting nearby allies a 20% chance on melee hit to trigger two extra attacks.',
                    tip: 'Massive DPS increase for melee.',
                    maxPts: 20, mana: 15, cd: 0, req: 'totem_mastery:5'
                },
                {
                    id: 'earthbind_totem', row: 3, col: 1, type: 'active', icon: '⛰️', name: 'Earthbind Totem',
                    desc: 'Active · Place a totem that continuously roots ALL nearby enemies.',
                    tip: 'Invaluable for kiting.',
                    maxPts: 20, mana: 10, cd: 5, req: 'totem_mastery:5'
                },
                {
                    id: 'healing_spring', row: 4, col: 0, type: 'active', icon: '💧', name: 'Healing Spring',
                    desc: 'Active · Place a healing totem restoring 10 + 4 per point HP per second to all nearby allies.',
                    tip: 'Max lvl (20): 90 HP/s.',
                    maxPts: 20, mana: 18, cd: 0, req: 'magma_totem:3'
                },
                {
                    id: 'totemic_recall', row: 4, col: 2, type: 'active', icon: '🔄', name: 'Totemic Recall',
                    desc: 'Active · Destroy your active totems, restoring 10 + 2% per point of your maximum mana.',
                    tip: 'Max lvl (20): 50% mana restore.',
                    maxPts: 20, mana: 0, cd: 30, req: 'windfury_totem:5'
                },
                {
                    id: 'totemic_wrath', row: 5, col: 1, type: 'passive', icon: '🌩️', name: 'Totemic Wrath',
                    desc: 'Passive · Active totems increase the fire and lightning damage of nearby allies by 5 + 1% per point per totem.',
                    tip: 'Max lvl (20): +25% per totem.',
                    maxPts: 20, req: 'earthbind_totem:5'
                },
            ]
        },

        // ═══ RESTORATION — Support healer ═══
        {
            id: 'restoration', name: 'Restoration', icon: '💚',
            nodes: [
                {
                    id: 'healing_wave', row: 0, col: 1, type: 'active', icon: '💚', name: 'Healing Wave',
                    desc: 'Active · Heal a target for 40 + 18 per point HP instantly.',
                    tip: 'Max lvl (20): Heals for 400 HP.',
                    maxPts: 20, mana: 18, cd: 0
                },
                {
                    id: 'water_shield', row: 1, col: 0, type: 'active', icon: '🛡️', name: 'Water Shield',
                    desc: 'Active · Surround yourself with 3 water globes. Being hit restores 15 + 5 per point mana and consumes a globe.',
                    tip: 'Max lvl (20): 115 mana per hit.',
                    maxPts: 20, mana: 0, cd: 0
                },
                {
                    id: 'resto_mastery', row: 1, col: 1, type: 'passive', icon: '💚', name: 'Restoration Mastery',
                    desc: 'Passive · +8% healing effectiveness per point AND +2 HP regen per second per point.',
                    tip: 'Max lvl (20): +160% healing power.',
                    maxPts: 20, req: 'healing_wave:3'
                },
                {
                    id: 'earth_shield', row: 1, col: 2, type: 'active', icon: '🌍', name: 'Earth Shield',
                    desc: 'Active · Protect a target with 9 earth charges. When they take damage, it heals them for 20 + 8 per point HP.',
                    tip: 'Max lvl (20): 180 HP heal on being hit.',
                    maxPts: 20, mana: 25, cd: 0
                },
                {
                    id: 'healing_stream_totem', row: 2, col: 0, type: 'active', icon: '♒', name: 'Healing Stream',
                    desc: 'Active · Place a totem that automatically heals the most injured ally for 15 + 6 per point HP every second.',
                    tip: 'Max lvl (20): 135 HP/s triage.',
                    maxPts: 20, mana: 14, cd: 0, req: 'resto_mastery:5'
                },
                {
                    id: 'chain_heal', row: 2, col: 2, type: 'active', icon: '🔗', name: 'Chain Heal',
                    desc: 'Active · Heal a target for 50 + 20 per point HP, chaining to 3 nearby injured allies for 70% effectiveness.',
                    tip: 'Max lvl (20): 450 primary heal + chains.',
                    maxPts: 20, mana: 22, cd: 0, req: 'resto_mastery:5',
                    synergies: [{ from: 'healing_wave', pctPerPt: 5 }]
                },
                {
                    id: 'mana_tide', row: 3, col: 1, type: 'active', icon: '🔵', name: 'Mana Tide Totem',
                    desc: 'Active · Place a totem that restores 5 + 2 per point mana per second to all nearby allies.',
                    tip: 'Max lvl (20): +45 mana/s.',
                    maxPts: 20, mana: 12, cd: 0, req: 'resto_mastery:10'
                },
                {
                    id: 'nature_swiftness', row: 4, col: 0, type: 'active', icon: '💨', name: 'Nature\'s Swiftness',
                    desc: 'Active · Your next Nature spell with a cast time becomes instant cast. 60s cooldown.',
                    tip: 'Instant emergency heal.',
                    maxPts: 1, mana: 0, cd: 60, req: 'healing_stream_totem:5'
                },
                {
                    id: 'ancestral_spirit', row: 4, col: 2, type: 'active', icon: '👻', name: 'Ancestral Spirit',
                    desc: 'Active · Resurrect a fallen ally with 50 + 3% per point of their maximum HP restored.',
                    tip: 'Max lvl (20): 110% HP resurrect.',
                    maxPts: 20, mana: 50, cd: 90, req: 'chain_heal:5'
                },
            ]
        },
    ]
};
