/**
 * WARLOCK — Class Definition
 * Three trees: Affliction (DoT debuffs) · Demonology (demon summon) · Destruction (burst damage)
 */
export const WARLOCK_CLASS = {
    id: 'warlock', name: 'Warlock', icon: '🔮',
    description: 'Wields corrupting shadow magic to drain life, summon demons, and unleash devastating chaos fire. Trades immediate safety for overwhelming power.',
    stats: { str: 10, dex: 15, vit: 15, int: 30 },
    trees: [

        // ═══ AFFLICTION — DoT master ═══
        {
            id: 'affliction', name: 'Affliction', icon: '☠️',
            nodes: [
                {
                    id: 'corruption', row: 0, col: 1, type: 'active', icon: '☠️', name: 'Corruption',
                    desc: 'Active · Instantly apply a powerful curse doing 8 + 4 per point shadow damage per second for 6 seconds.',
                    tip: 'Max lvl (20): 88/s × 6s = 528 DoT.',
                    maxPts: 20, mana: 8, cd: 0, group: 'shadow', dmgBase: 8, dmgPerLvl: 4
                },
                {
                    id: 'shadow_mastery', row: 1, col: 0, type: 'passive', icon: '🟣', name: 'Shadow Mastery',
                    desc: 'Passive · +5% shadow damage per point. At 10 points, your DoT spells can critically strike.',
                    tip: 'Max lvl (20): +100% shadow damage.',
                    maxPts: 20
                },
                {
                    id: 'siphon_life', row: 1, col: 2, type: 'active', icon: '🩸', name: 'Siphon Life',
                    desc: 'Active · Deals 4 + 2 per point shadow damage per second for 10 seconds, healing you for 100% of the damage dealt.',
                    tip: 'Max lvl (20): 44/s DoT and Heal.',
                    maxPts: 20, mana: 12, cd: 0, group: 'shadow', dmgBase: 4, dmgPerLvl: 2, req: 'corruption:1'
                },
                {
                    id: 'haunt', row: 2, col: 1, type: 'active', icon: '👻', name: 'Haunt',
                    desc: 'Active · Send a haunt that deals 10 + 6 per point shadow damage per second for 8 seconds AND increases all shadow damage taken by 20%.',
                    tip: 'Max lvl (20): 1,040 DoT + 20% debuff.',
                    maxPts: 20, mana: 14, cd: 8, group: 'shadow', dmgBase: 10, dmgPerLvl: 6, req: 'corruption:3'
                },
                {
                    id: 'soul_siphon', row: 3, col: 0, type: 'passive', icon: '🌀', name: 'Soul Siphon',
                    desc: 'Passive · Your Drain and Siphon spells heal for an additional +2% per point for each Affliction effect on the target.',
                    tip: 'Massive healing when fully dotted.',
                    maxPts: 20, req: 'shadow_mastery:5'
                },
                {
                    id: 'agony', row: 3, col: 2, type: 'active', icon: '😱', name: 'Agony',
                    desc: 'Active · Apply a ramping DoT starting at 2 + 1 per point shadow damage per second, doubling every 2 seconds up to 6 ticks.',
                    tip: 'Max lvl (20): Tick 6 = 704/s.',
                    maxPts: 20, mana: 12, cd: 0, group: 'shadow', dmgBase: 2, dmgPerLvl: 1, req: 'haunt:3',
                    synergies: [{ from: 'shadow_mastery', pctPerPt: 4 }]
                },
                {
                    id: 'unstable_affliction', row: 4, col: 1, type: 'active', icon: '☣️', name: 'Unstable Affliction',
                    desc: 'Active · Deals 15 + 8 per point shadow damage over 5 seconds. If the target dies, it explodes dealing the remaining damage as AoE.',
                    tip: 'Max lvl (20): 175/s DoT.',
                    maxPts: 20, mana: 16, cd: 0, group: 'shadow', dmgBase: 15, dmgPerLvl: 8, req: 'haunt:5'
                },
                {
                    id: 'soul_fire', row: 5, col: 0, type: 'active', icon: '🔥', name: 'Soul Fire',
                    desc: 'Active · Channel 1s to unleash a bolt of shadow fire dealing 70 + 25 per point damage. Instant if target has 3+ DoTs.',
                    tip: 'Max lvl (20): 570 damage nuke.',
                    maxPts: 20, mana: 25, cd: 0, group: 'shadow', dmgBase: 70, dmgPerLvl: 25, req: 'agony:5'
                },
                {
                    id: 'seed', row: 5, col: 2, type: 'active', icon: '🌑', name: 'Seed of Corruption',
                    desc: 'Active · Plant a ticking bomb. When they take 200 + 50 per point total shadow damage they explode for 60 + 20 per point AoE shadow damage.',
                    tip: 'Max lvl (20): 460 AoE explosion.',
                    maxPts: 20, mana: 20, cd: 3, group: 'shadow', dmgBase: 60, dmgPerLvl: 20, req: 'unstable_affliction:3'
                },
                {
                    id: 'pandemic', row: 6, col: 1, type: 'active', icon: '🦠', name: 'Pandemic',
                    desc: 'Active · Instantly refresh the duration of all DoTs on the target and spread them to 3 nearby enemies.',
                    tip: 'Max lvl (1): Ultimate DoT spread tool.',
                    maxPts: 1, mana: 30, cd: 20, req: 'seed:5'
                }
            ]
        },

        // ═══ DEMONOLOGY — Demon command ═══
        {
            id: 'demonology', name: 'Demonology', icon: '😈',
            nodes: [
                {
                    id: 'summon_imp', row: 0, col: 1, type: 'active', icon: '😈', name: 'Summon Imp',
                    desc: 'Active · Summon a fire imp companion that shoots fire bolts for 10 + 5 per point fire damage.',
                    tip: 'Max lvl (20): Imp deals 110 fire per shot.',
                    maxPts: 20, mana: 20, cd: 5
                },
                {
                    id: 'demon_armor', row: 1, col: 0, type: 'passive', icon: '🛡️', name: 'Demon Armor',
                    desc: 'Passive · +20 flat armor and +2% all resistances per point. At 10 points, +5 HP regen per second.',
                    tip: 'Max lvl (20): +400 flat armor · +40% all res.',
                    maxPts: 20
                },
                {
                    id: 'summon_succubus', row: 1, col: 2, type: 'active', icon: '💃', name: 'Summon Succubus',
                    desc: 'Active · Replace your demon with a Succubus dealing 25 + 10 physical damage that periodically charms enemies.',
                    tip: 'Max lvl (20): High melee DPS and CC.',
                    maxPts: 20, mana: 30, cd: 5, req: 'summon_imp:3'
                },
                {
                    id: 'soul_link', row: 2, col: 0, type: 'passive', icon: '🔗', name: 'Soul Link',
                    desc: 'Passive · +1% life steal per point. A portion of your pet\'s damage heals you.',
                    tip: 'Max lvl (20): +20% life steal.',
                    maxPts: 20, req: 'demon_armor:3'
                },
                {
                    id: 'summon_voidwalker', row: 2, col: 2, type: 'active', icon: '🌑', name: 'Summon Voidwalker',
                    desc: 'Active · Replace your demon with a Voidwalker, a tank with 300 + 80 per point HP that taunts enemies.',
                    tip: 'Max lvl (20): Voidwalker has 1,900 HP.',
                    maxPts: 20, mana: 35, cd: 5, req: 'summon_succubus:3'
                },
                {
                    id: 'demonic_sacrifice', row: 3, col: 1, type: 'active', icon: '💀', name: 'Demonic Sacrifice',
                    desc: 'Active · Sacrifice your current demon to gain a massive buff based on the demon type for 30 minutes.',
                    tip: 'Sacrifice Imp for fire dmg, Voidwalker for HP regen.',
                    maxPts: 1, mana: 0, cd: 0, req: 'summon_voidwalker:1'
                },
                {
                    id: 'master_demonologist', row: 4, col: 1, type: 'passive', icon: '👹', name: 'Master Demonologist',
                    desc: 'Passive · Grants you and your summoned demon +3% damage and +3% damage reduction per point.',
                    tip: 'Max lvl (20): +60% dmg / DR.',
                    maxPts: 20, req: 'demonic_sacrifice:1'
                },
                {
                    id: 'dark_pact', row: 5, col: 0, type: 'active', icon: '💉', name: 'Dark Pact',
                    desc: 'Active · Sacrifice 20% of your current HP to empower your next spell to deal +100 + 5% per point damage.',
                    tip: 'Max lvl (20): +200% next spell damage.',
                    maxPts: 20, mana: 0, cd: 10, req: 'soul_link:5'
                },
                {
                    id: 'metamorphosis', row: 5, col: 2, type: 'active', icon: '👹', name: 'Metamorphosis',
                    desc: 'Active · Transform into a demon lord for 30 + 1 per point seconds: +200% size, spells deal +50% damage.',
                    tip: 'Max lvl (20): 50s demon form.',
                    maxPts: 20, mana: 30, cd: 120, req: 'master_demonologist:5'
                },
            ]
        },

        // ═══ DESTRUCTION — Burst damage ═══
        {
            id: 'destruction', name: 'Destruction', icon: '💥',
            nodes: [
                {
                    id: 'shadow_bolt', row: 0, col: 1, type: 'active', icon: '🌑', name: 'Shadow Bolt',
                    desc: 'Active · Fire a bolt of shadow energy dealing 18 + 10 per point shadow damage.',
                    tip: 'Max lvl (20): 218 shadow damage per cast.',
                    maxPts: 20, mana: 10, cd: 0.5, group: 'shadow', dmgBase: 18, dmgPerLvl: 10
                },
                {
                    id: 'aff_mastery', row: 1, col: 0, type: 'passive', icon: '🔴', name: 'Chaos Mastery',
                    desc: 'Passive · +5% shadow and fire damage per point. At 10 points, critical strike damage increased by 20%.',
                    tip: 'Max lvl (20): +100% damage.',
                    maxPts: 20
                },
                {
                    id: 'immolate_warlock', row: 1, col: 2, type: 'active', icon: '🔥', name: 'Immolate',
                    desc: 'Active · Burns the enemy for 20 + 5 per point fire damage, then 10 + 4 per point per sec for 15s.',
                    tip: 'Max lvl (20): 120 impact + 90/s.',
                    maxPts: 20, mana: 14, cd: 0, group: 'fire', dmgBase: 20, dmgPerLvl: 5, req: 'shadow_bolt:1'
                },
                {
                    id: 'conflagrate', row: 2, col: 1, type: 'active', icon: '💥', name: 'Conflagrate',
                    desc: 'Active · Cause a burning target to explode for 50 + 20 per point fire/shadow damage.',
                    tip: 'Max lvl (20): 450 chaos damage.',
                    maxPts: 20, mana: 16, cd: 6, group: 'fire', dmgBase: 50, dmgPerLvl: 20, req: 'immolate_warlock:3'
                },
                {
                    id: 'incinerate', row: 3, col: 0, type: 'active', icon: '🐍', name: 'Incinerate',
                    desc: 'Active · Sends a wave of fire dealing 30 + 12 per point. Deals +50% damage if target is Immolated.',
                    tip: 'Max lvl (20): 270 base fire damage.',
                    maxPts: 20, mana: 12, cd: 0, group: 'fire', dmgBase: 30, dmgPerLvl: 12, req: 'conflagrate:3'
                },
                {
                    id: 'backdraft', row: 3, col: 2, type: 'passive', icon: '💨', name: 'Backdraft',
                    desc: 'Passive · Casting Conflagrate reduces the cast time and global cooldown of your next 3 destruction spells by 10% per point.',
                    tip: 'Max lvl (3): 30% cast speed burst.',
                    maxPts: 3, req: 'conflagrate:5'
                },
                {
                    id: 'chaos_bolt', row: 4, col: 1, type: 'active', icon: '💥', name: 'Chaos Bolt',
                    desc: 'Active · Hurl a bolt of chaos energy that CANNOT be resisted or blocked, dealing 60 + 25 per point damage.',
                    tip: 'Max lvl (20): 560 damage.',
                    maxPts: 20, mana: 22, cd: 8, group: 'shadow', dmgBase: 60, dmgPerLvl: 25, req: 'conflagrate:5',
                    synergies: [{ from: 'aff_mastery', pctPerPt: 4 }]
                },
                {
                    id: 'rain_of_fire', row: 5, col: 0, type: 'active', icon: '🌋', name: 'Rain of Fire',
                    desc: 'Active · Call a column of fire that scorches the earth dealing 25 + 10 per point fire damage per second.',
                    tip: 'Max lvl (20): 225/s × 5s = 1,125 total.',
                    maxPts: 20, mana: 30, cd: 12, group: 'fire', dmgBase: 25, dmgPerLvl: 10, req: 'chaos_bolt:5',
                    synergies: [{ from: 'aff_mastery', pctPerPt: 3 }]
                },
                {
                    id: 'hellfire', row: 5, col: 2, type: 'active', icon: '🔥', name: 'Hellfire',
                    desc: 'Active · Ignites the area around you, dealing 40 + 15 per point fire damage to enemies and 10% of that to yourself per second.',
                    tip: 'Max lvl (20): 340/s point-blank AoE.',
                    maxPts: 20, mana: 25, cd: 0, group: 'fire', dmgBase: 40, dmgPerLvl: 15, req: 'chaos_bolt:5'
                },
            ]
        },
    ]
};
