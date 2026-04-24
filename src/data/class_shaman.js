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
                    desc: 'Active · Hurl bolt for base + 120% weapon damage as lightning.',
                    tip: 'Max lvl (20): Spammable lightning scaling.',
                    maxPts: 20, mana: 8, cd: 0.5, group: 'lightning', dmgBase: 12, dmgPerLvl: 8, wepPct: 120
                },
                {
                    id: 'flame_shock', row: 1, col: 0, type: 'active', icon: '🔥', name: 'Flame Shock',
                    desc: 'Active · Scorch for base + 80% weapon damage and DoT.',
                    tip: 'Max lvl (20): Scaling fire impact + DoT.',
                    maxPts: 20, mana: 10, cd: 4, group: 'fire', dmgBase: 10, dmgPerLvl: 5, wepPct: 80
                },
                {
                    id: 'elem_mastery', row: 1, col: 1, type: 'passive', icon: '🔮', name: 'Elemental Mastery',
                    desc: 'Passive · +3% fire, cold, AND lightning damage per point. At 10 points, elemental spell mana costs are reduced by 10%.',
                    tip: 'Max lvl (20): +60% to all three elements.',
                    maxPts: 20, req: 'lightning_bolt:3'
                },
                {
                    id: 'frost_shock', row: 1, col: 2, type: 'active', icon: '❄️', name: 'Frost Shock',
                    desc: 'Active · Blast for base + 90% weapon damage as cold and slow.',
                    tip: 'Max lvl (20): Scaling cold impact + CC.',
                    maxPts: 20, mana: 10, cd: 4, group: 'cold', dmgBase: 15, dmgPerLvl: 8, wepPct: 90
                },
                {
                    id: 'chain_lightning', row: 2, col: 1, type: 'active', icon: '⛈️', name: 'Chain Lightning',
                    desc: 'Active · Strike for base + 150% weapon damage and chain to 3 targets.',
                    tip: 'Max lvl (20): High scaling multi-hit lightning.',
                    maxPts: 20, mana: 15, cd: 2, group: 'lightning', dmgBase: 30, dmgPerLvl: 14, wepPct: 150, req: 'elem_mastery:3',
                    synergies: [{ from: 'lightning_bolt', pctPerPt: 5 }]
                },
                {
                    id: 'thunder_strike', row: 3, col: 0, type: 'active', icon: '💥', name: 'Thunder Strike',
                    desc: 'Active · Thunderclap AoE for base + 130% weapon damage and stun.',
                    tip: 'Max lvl (20): Scaling lightning AoE nuke.',
                    maxPts: 20, mana: 18, cd: 6, group: 'lightning', dmgBase: 50, dmgPerLvl: 20, wepPct: 130, req: 'chain_lightning:5'
                },
                {
                    id: 'elemental_focus', row: 3, col: 2, type: 'passive', icon: '🎯', name: 'Elemental Focus',
                    desc: 'Passive · Critical strikes with elemental spells reduce the mana cost of your next spell by 5% per point.',
                    tip: 'Max lvl (20): Next spell is 100% free after a crit.',
                    maxPts: 20, req: 'chain_lightning:5'
                },
                {
                    id: 'lava_burst', row: 4, col: 1, type: 'active', icon: '🌋', name: 'Lava Burst',
                    desc: 'Active · Erupt for base + 180% weapon damage as fire. (Crits vs burn).',
                    tip: 'Max lvl (20): Massive scaling fire burst.',
                    maxPts: 20, mana: 20, cd: 8, group: 'fire', dmgBase: 60, dmgPerLvl: 20, wepPct: 180, req: 'thunder_strike:5',
                    synergies: [{ from: 'flame_shock', pctPerPt: 5 }]
                },
                {
                    id: 'earthquake', row: 5, col: 1, type: 'active', icon: '🌋', name: 'Earthquake',
                    desc: 'Active · Shake earth for base + 60% weapon damage per second AoE.',
                    tip: 'Max lvl (20): High scaling area denial.',
                    maxPts: 20, mana: 35, cd: 30, group: 'earth', dmgBase: 30, dmgPerLvl: 10, wepPct: 60, req: 'lava_burst:5',
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
                    desc: 'Active · Fire totem shooting for base + 40% weapon damage per second.',
                    tip: 'Max lvl (20): Scaling fire turret.',
                    maxPts: 20, mana: 10, cd: 0, dmgBase: 15, dmgPerLvl: 8, wepPct: 40
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
                    desc: 'Active · Fire totem pulsing base + 50% weapon damage in AoE every 2s.',
                    tip: 'Max lvl (20): Scaling area fire damage.',
                    maxPts: 20, mana: 15, cd: 0, dmgBase: 20, dmgPerLvl: 10, wepPct: 50, req: 'stoneskin_totem:3',
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
