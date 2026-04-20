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
                    desc: 'Active · Hurl a lightning bolt dealing 12 + 8 per point lightning damage. Low cooldown — your main spam damage filler.',
                    tip: 'Max lvl (20): 172 lightning damage with no downtime.',
                    maxPts: 20, mana: 8, cd: 0.5, group: 'lightning', dmgBase: 12, dmgPerLvl: 8
                },
                {
                    id: 'elem_mastery', row: 1, col: 0, type: 'passive', icon: '🔮', name: 'Elemental Mastery',
                    desc: 'Passive · +3% fire, cold, AND lightning damage per point. At 10 points, all elemental spell mana costs are reduced by 10%. The broad elemental damage passive.',
                    tip: 'Max lvl (20): +60% to all three elements · mana discount at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'chain_lightning', row: 1, col: 2, type: 'active', icon: '⛈️', name: 'Chain Lightning',
                    desc: 'Active · Strike a target for 30 + 14 per point lightning damage that chains to 3 nearby enemies for 70% reduced damage each. More targets nearby = more total damage.',
                    tip: 'Max lvl (20): 310 primary + 217 × 3 chains. Excellent clearing.',
                    maxPts: 20, mana: 15, cd: 2, group: 'lightning', dmgBase: 30, dmgPerLvl: 14, req: 'lightning_bolt:3'
                },
                {
                    id: 'thunder_strike', row: 2, col: 1, type: 'active', icon: '💥', name: 'Thunder Strike',
                    desc: 'Active · Channel 1 second then release a massive thunderclap AoE dealing 50 + 20 per point lightning damage to all nearby enemies and stunning them for 0.6s.',
                    tip: 'Max lvl (20): 450 lightning AoE + 0.6s stun. Powerful but slow casting.',
                    maxPts: 20, mana: 18, cd: 6, group: 'lightning', dmgBase: 50, dmgPerLvl: 20, req: 'chain_lightning:5'
                },
                {
                    id: 'lava_burst', row: 3, col: 0, type: 'active', icon: '🌋', name: 'Lava Burst',
                    desc: 'Active · Cause lava to erupt from the ground dealing 60 + 20 per point fire damage. If the target is already on fire (Flame Shock), this spell is GUARANTEED to critically strike.',
                    tip: 'Max lvl (20): 460 fire damage · always crits vs burning targets.',
                    maxPts: 20, mana: 20, cd: 8, group: 'fire', dmgBase: 60, dmgPerLvl: 20, req: 'thunder_strike:5'
                },
                {
                    id: 'earthquake', row: 3, col: 2, type: 'active', icon: '🌋', name: 'Earthquake',
                    desc: 'Active · Shake the earth violently for 8 seconds, dealing 30 + 10 per point physical AoE damage per second and stunning enemies for 1.2s. Area slows movement by 50% while active.',
                    tip: 'Max lvl (20): 230/s × 8s = 1,840 total. Ultimate AoE devastation.',
                    maxPts: 20, mana: 35, cd: 30, group: 'earth', dmgBase: 30, dmgPerLvl: 10, req: 'lava_burst:5',
                    synergies: [{ from: 'elem_mastery', pctPerPt: 4 }]
                },
                {
                    id: 'storm_caller', row: 4, col: 1, type: 'passive', icon: '🌪️', name: 'Storm Caller',
                    desc: 'Passive · When you cast any lightning spell, 15% chance to instantly reset Chain Lightning\'s cooldown. Also adds +2 chain targets to Chain Lightning permanently.',
                    tip: 'Chain Lightning procs can cascade with this talent at high luck. Legendary for clearing.',
                    maxPts: 20
                },
            ]
        },

        // ═══ TOTEMS — Placed utility/DPS ═══
        {
            id: 'totems', name: 'Totems', icon: '🪵',
            nodes: [
                {
                    id: 'searing_totem', row: 0, col: 1, type: 'active', icon: '🔥', name: 'Searing Totem',
                    desc: 'Active · Place a fire totem that shoots a fire bolt every second at the nearest enemy for 15 + 8 per point fire damage. Lasts 45 seconds. Stack multiple for sustained DPS.',
                    tip: 'Max lvl (20): 175 fire/s. Place before combat for immediate DPS.',
                    maxPts: 20, mana: 10, cd: 0
                },
                {
                    id: 'totem_mastery', row: 1, col: 0, type: 'passive', icon: '🪵', name: 'Totem Mastery',
                    desc: 'Passive · Each point extends all totem durations by +20% and enlarges their effect radius by +8%. At 5 points you can place one extra totem simultaneously.',
                    tip: 'Max lvl (20): Totems last 4× longer · much larger radius · extra totem slot at 5pts.',
                    maxPts: 20
                },
                {
                    id: 'windfury_totem', row: 1, col: 2, type: 'active', icon: '💨', name: 'Windfury Totem',
                    desc: 'Active · Place a totem that grants all nearby allies a 20% chance on each melee swing to trigger two additional instant attacks dealing full weapon damage. Lasts 45 seconds.',
                    tip: 'The most powerful melee buff totem. Massive DPS increase for entire melee group.',
                    maxPts: 20, mana: 15, cd: 0
                },
                {
                    id: 'earthbind_totem', row: 2, col: 0, type: 'active', icon: '⛰️', name: 'Earthbind Totem',
                    desc: 'Active · Place a totem that continuously roots ALL nearby enemies in place, preventing movement for as long as they stay in range. Lasts 30 seconds. Enemies still attack.',
                    tip: 'Invaluable for kiting strategies. Roots enemies so you can bomb them freely.',
                    maxPts: 20, mana: 10, cd: 5, req: 'searing_totem:3'
                },
                {
                    id: 'healing_spring', row: 2, col: 2, type: 'active', icon: '💧', name: 'Healing Spring',
                    desc: 'Active · Place a healing totem that restores 10 + 4 per point HP per second to all nearby allies. Lasts 45 seconds. The best sustained group healing in a stationary fight.',
                    tip: 'Max lvl (20): 90 HP/s to all allies in range.',
                    maxPts: 20, mana: 18, cd: 0, req: 'windfury_totem:3'
                },
                {
                    id: 'totemic_wrath', row: 3, col: 1, type: 'passive', icon: '🌩️', name: 'Totemic Wrath',
                    desc: 'Passive · All your active totems passively increase the fire and lightning damage of all nearby allies by 5 + 1% per point per totem. Place more totems = bigger bonus.',
                    tip: 'Max lvl (20): +25% per totem. With 4 active = +100% fire/lightning for party.',
                    maxPts: 20, req: 'totem_mastery:5'
                },
            ]
        },

        // ═══ RESTORATION — Support healer ═══
        {
            id: 'restoration', name: 'Restoration', icon: '💚',
            nodes: [
                {
                    id: 'healing_wave', row: 0, col: 1, type: 'active', icon: '💚', name: 'Healing Wave',
                    desc: 'Active · Heal a target for 40 + 18 per point HP instantly. Quick cast, moderate mana cost. Your primary emergency heal.',
                    tip: 'Max lvl (20): Heals for 400 HP in one cast.',
                    maxPts: 20, mana: 18, cd: 0
                },
                {
                    id: 'resto_mastery', row: 1, col: 0, type: 'passive', icon: '💚', name: 'Restoration Mastery',
                    desc: 'Passive · +8% healing effectiveness per point AND +2 HP regen per second per point (for you and allies in range). The core restoration passive.',
                    tip: 'Max lvl (20): +160% healing power · +40 HP/s regen aura.',
                    maxPts: 20
                },
                {
                    id: 'healing_stream_totem', row: 1, col: 2, type: 'active', icon: '♒', name: 'Healing Stream',
                    desc: 'Active · Place a totem that automatically heals the most injured ally within range for 15 + 6 per point HP every second. Lasts 60 seconds. Fully automatic.',
                    tip: 'Max lvl (20): 135 HP/s automatic triage. Set it and forget it.',
                    maxPts: 20, mana: 14, cd: 0
                },
                {
                    id: 'mana_tide', row: 2, col: 1, type: 'active', icon: '🔵', name: 'Mana Tide Totem',
                    desc: 'Active · Place a totem that restores 5 + 2 per point mana per second to all nearby allies. Lasts 30 seconds. Invaluable for mana-hungry spellcaster groups.',
                    tip: 'Max lvl (20): +45 mana/s for all allies. Keeps the whole group casting.',
                    maxPts: 20, mana: 12, cd: 0, req: 'healing_stream_totem:3'
                },
                {
                    id: 'ancestral_spirit', row: 3, col: 1, type: 'active', icon: '👻', name: 'Ancestral Spirit',
                    desc: 'Active · Call upon an ancestor spirit to resurrect a fallen ally with 50 + 3% per point of their maximum HP restored. 90-second cooldown. The only resurrection in the game.',
                    tip: 'Max lvl (20): Resurrects ally with 110% HP (brief overheal).',
                    maxPts: 20, mana: 50, cd: 90, req: 'healing_wave:5'
                },
            ]
        },
    ]
};
