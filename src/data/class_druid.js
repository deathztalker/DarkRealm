/**
 * DRUID — Class Definition
 * Three trees: Shapeshifting (melee forms) · Nature (elemental spells) · Healing (restoration)
 */
export const DRUID_CLASS = {
    id: 'druid', name: 'Druid', icon: '🌿',
    description: 'A shapeshifter who fights as a bear, wolf, or human. Commands nature\'s elements and heals wounds with ancient magic.',
    stats: { str: 20, dex: 20, vit: 20, int: 10 },
    trees: [

        // ═══ SHAPESHIFTING — Melee form builds ═══
        {
            id: 'shapeshifting', name: 'Shapeshifting', icon: '🐻',
            nodes: [
                {
                    id: 'dire_wolf', row: 0, col: 1, type: 'active', icon: '🐺', name: 'Dire Wolf Form',
                    desc: 'Active (Toggle) · Transform into a Dire Wolf: +50% movement speed, +30% attack speed, and your melee attacks deal 10 + 5 per point bonus physical damage. Cannot cast spells while shifted.',
                    tip: 'Max lvl (20): +130 attack damage · fast mobile melee form for agile DPS.',
                    maxPts: 20, mana: 10, cd: 0
                },
                {
                    id: 'feral_mastery', row: 1, col: 0, type: 'passive', icon: '🦁', name: 'Feral Mastery',
                    desc: 'Passive · +5% damage per point and +2% critical chance per point (applies in all shapeshifted forms). At 10 points, also grants +15% max HP while shapeshifted.',
                    tip: 'Max lvl (20): +100% form damage · +40% crit · +15% HP at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'bear_form', row: 1, col: 2, type: 'active', icon: '🐻', name: 'Bear Form',
                    desc: 'Active (Toggle) · Transform into a massive bear: +200% armor, +40% max HP, and your melee attacks deal 15 + 8 per point physical damage. Heavily defensive — tank form.',
                    tip: 'Max lvl (20): +215 attack damage in an armored form. The tanking shapeshifted option.',
                    maxPts: 20, mana: 10, cd: 0
                },
                {
                    id: 'maul', row: 2, col: 0, type: 'active', icon: '🐻', name: 'Maul',
                    desc: 'Active · A devastating bear swipe dealing 35 + 15 per point physical damage and stunning the target for 1 second. Can only be used in Bear Form.',
                    tip: 'Max lvl (20): 335 physical + 1s stun. Primary bear form attack.',
                    maxPts: 20, mana: 8, cd: 3, group: 'melee', dmgBase: 35, dmgPerLvl: 15, req: 'bear_form:1'
                },
                {
                    id: 'bear_slam', row: 2, col: 2, type: 'active', icon: '💥', name: 'Bear Slam',
                    desc: 'Active · Rear up and crash down in a massive shockwave AoE dealing 25 + 10 per point physical damage to all enemies in range and stunning them for 1.5s. Bear Form only.',
                    tip: 'Max lvl (20): 225 AoE + 1.5s stun. Best bear AoE crowd control.',
                    maxPts: 20, mana: 12, cd: 8, group: 'melee', dmgBase: 25, dmgPerLvl: 10, req: 'maul:5'
                },
                {
                    id: 'rabies', row: 3, col: 0, type: 'active', icon: '☣️', name: 'Rabies',
                    desc: 'Active · Bite a target injecting rabies that deals 6 + 4 per point poison damage per second for 5 seconds AND spreads to nearby enemies on death. Wolf Form only.',
                    tip: 'Max lvl (20): 86/s × 5s = 430 poison that chains on kills. Great for swarms.',
                    maxPts: 20, mana: 8, cd: 2, req: 'dire_wolf:5',
                    synergies: [{ from: 'feral_mastery', pctPerPt: 3 }]
                },
                {
                    id: 'natural_armor', row: 3, col: 2, type: 'passive', icon: '🌿', name: 'Natural Armor',
                    desc: 'Passive · +6% armor per point from your natural body (stacks with worn armor). Also grants +1 HP regeneration per second per point. Active in both shifted and human form.',
                    tip: 'Max lvl (20): +120% bonus armor · +20 HP/s regeneration.',
                    maxPts: 20
                },
            ]
        },

        // ═══ NATURE — Elemental caster form ═══
        {
            id: 'nature', name: 'Nature', icon: '🌿',
            nodes: [
                {
                    id: 'twister', row: 0, col: 1, type: 'active', icon: '🌪️', name: 'Twister',
                    desc: 'Active · Launch a spinning tornado in a direction dealing 15 + 8 per point lightning damage to everything in its path and briefly stunning for 0.5s.',
                    tip: 'Max lvl (20): 175 lightning + stun. Good for hitting enemies in a line.',
                    maxPts: 20, mana: 10, cd: 1, group: 'lightning', dmgBase: 15, dmgPerLvl: 8
                },
                {
                    id: 'nature_mastery', row: 1, col: 0, type: 'passive', icon: '🌿', name: 'Nature Mastery',
                    desc: 'Passive · +3% fire, cold, AND lightning damage per point. At 10 points, nature damage spells have a 10% chance to root the target for 2 seconds automatically.',
                    tip: 'Max lvl (20): +60% elemental damage · chance to root at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'vine', row: 1, col: 2, type: 'active', icon: '🌱', name: 'Vine',
                    desc: 'Active · Summon magical vines from the earth that root a target for 3 seconds, preventing movement and making them take +15% damage from all sources.',
                    tip: 'A 3s root + damage amp. Excellent opener or escape from dangerous enemies.',
                    maxPts: 20, mana: 8, cd: 6
                },
                {
                    id: 'hurricane', row: 2, col: 1, type: 'active', icon: '🌀', name: 'Hurricane',
                    desc: 'Active · Summon a hurricane at target location lasting 6 seconds. Deals 12 + 6 per point cold/wind damage per second and slows all caught enemies by 35%. Great zone denial.',
                    tip: 'Max lvl (20): 132/s × 6s = 792 cold + perma-slow. Combine with Vine for locked-down enemies.',
                    maxPts: 20, mana: 20, cd: 12, group: 'cold', dmgBase: 12, dmgPerLvl: 6,
                    synergies: [{ from: 'nature_mastery', pctPerPt: 4 }]
                },
                {
                    id: 'raven', row: 3, col: 0, type: 'active', icon: '🐦', name: 'Raven',
                    desc: 'Active · Summon a raven companion that attacks enemies for 10 + 4 per point physical damage per hit and has a 10% chance to blind targets for 2 seconds. Persistent companion.',
                    tip: 'Max lvl (20): Raven deals 90 per hit with free blinds.',
                    maxPts: 20, mana: 15, cd: 5, req: 'twister:3'
                },
                {
                    id: 'armageddon', row: 3, col: 2, type: 'active', icon: '☄️', name: 'Armageddon',
                    desc: 'Active · Rain flaming meteors across the entire screen for 10 seconds dealing 30 + 12 per point fire damage per impact. Dozens of impacts per second on random targets.',
                    tip: 'Max lvl (20): 270/impact in a 10s storm. The ultimate nature devastation spell.',
                    maxPts: 20, mana: 40, cd: 60, group: 'fire', dmgBase: 30, dmgPerLvl: 12, req: 'hurricane:10',
                    synergies: [{ from: 'nature_mastery', pctPerPt: 5 }]
                },
            ]
        },

        // ═══ HEALING — Restoration caster ═══
        {
            id: 'healing', name: 'Healing', icon: '💚',
            nodes: [
                {
                    id: 'healing_touch', row: 0, col: 1, type: 'active', icon: '💚', name: 'Healing Touch',
                    desc: 'Active · Touch an ally to heal them for 35 + 15 per point HP instantly. The most healing per mana of any skill. Core emergency heal.',
                    tip: 'Max lvl (20): Heals 335 HP. Best raw healing in the game.',
                    maxPts: 20, mana: 15, cd: 0
                },
                {
                    id: 'rejuvenation', row: 1, col: 0, type: 'active', icon: '🌱', name: 'Rejuvenation',
                    desc: 'Active · Apply a healing-over-time effect that restores 10 + 4 per point HP per second to an ally for 8 seconds. Stacks with Healing Touch for combined burst+sustain.',
                    tip: 'Max lvl (20): 90 HP/s × 8s = 720 total healing. Great for ongoing sustain.',
                    maxPts: 20, mana: 12, cd: 0
                },
                {
                    id: 'regrowth', row: 1, col: 2, type: 'active', icon: '🌿', name: 'Regrowth',
                    desc: 'Active · Apply a combination heal: instant 50 + 20 per point HP followed by 8 + 4 per point HP per second for 15 seconds. Two heals in one. Great for longer fights.',
                    tip: 'Max lvl (20): 450 instant + 108/s × 15s = 2,070 total. Best value heal.',
                    maxPts: 20, mana: 20, cd: 2, req: 'healing_touch:3'
                },
                {
                    id: 'tranquility', row: 2, col: 1, type: 'active', icon: '☮️', name: 'Tranquility',
                    desc: 'Active · Channel for 8 seconds healing ALL nearby allies for 20 + 8 per point HP per second. You cannot move or attack while channeling. Powerful mass-heal in emergencies.',
                    tip: 'Max lvl (20): 180 HP/s to ALL allies for 8s. Use when the whole group is dying.',
                    maxPts: 20, mana: 30, cd: 45, req: 'rejuvenation:5'
                },
                {
                    id: 'wild_growth', row: 3, col: 1, type: 'active', icon: '🌻', name: 'Wild Growth',
                    desc: 'Active · Instantly grant rapid regeneration to up to 5 nearby allies, healing each for 15 + 6 per point HP per second for 7 seconds. No target selection needed — auto-hits lowest-HP allies.',
                    tip: 'Max lvl (20): 135 HP/s × 7s × 5 targets. The ultimate mass triage skill.',
                    maxPts: 20, mana: 35, cd: 30, req: 'tranquility:3',
                    synergies: [{ from: 'rejuvenation', pctPerPt: 3 }]
                },
            ]
        },
    ]
};
