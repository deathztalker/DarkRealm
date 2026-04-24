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
                    desc: 'Active · Curse dealing base + 55% weapon damage per second for 6s.',
                    tip: 'Max lvl (20): Scaling shadow DoT.',
                    maxPts: 20, mana: 8, cd: 0, group: 'shadow', dmgBase: 8, dmgPerLvl: 4, wepPct: 55
                },
                {
                    id: 'shadow_mastery', row: 1, col: 0, type: 'passive', icon: '🟣', name: 'Shadow Mastery',
                    desc: 'Passive · +5% shadow damage per point. At 10 points, your DoT spells can critically strike.',
                    tip: 'Max lvl (20): +100% shadow damage.',
                    maxPts: 20
                },
                {
                    id: 'siphon_life', row: 1, col: 2, type: 'active', icon: '🩸', name: 'Siphon Life',
                    desc: 'Active · Drain dealing base + 35% weapon damage per second as healing.',
                    tip: 'Max lvl (20): Scaling life drain.',
                    maxPts: 20, mana: 12, cd: 0, group: 'shadow', dmgBase: 4, dmgPerLvl: 2, wepPct: 35, req: 'corruption:1'
                },
                {
                    id: 'haunt', row: 2, col: 1, type: 'active', icon: '👻', name: 'Haunt',
                    desc: 'Active · Haunt dealing base + 75% weapon damage per second + debuff.',
                    tip: 'Max lvl (20): High scaling shadow nuke + DoT.',
                    maxPts: 20, mana: 14, cd: 8, group: 'shadow', dmgBase: 10, dmgPerLvl: 6, wepPct: 75, req: 'corruption:3'
                },
                {
                    id: 'soul_siphon', row: 3, col: 0, type: 'passive', icon: '🌀', name: 'Soul Siphon',
                    desc: 'Passive · Your Drain and Siphon spells heal for an additional +2% per point for each Affliction effect on the target.',
                    tip: 'Massive healing when fully dotted.',
                    maxPts: 20, req: 'shadow_mastery:5'
                },
                {
                    id: 'agony', row: 3, col: 2, type: 'active', icon: '😱', name: 'Agony',
                    desc: 'Active · Ramping DoT starting at base + 20% weapon damage per second.',
                    tip: 'Max lvl (20): Massive scaling late-tick damage.',
                    maxPts: 20, mana: 12, cd: 0, group: 'shadow', dmgBase: 2, dmgPerLvl: 1, wepPct: 20, req: 'haunt:3',
                    synergies: [{ from: 'shadow_mastery', pctPerPt: 4 }]
                },
                {
                    id: 'unstable_affliction', row: 4, col: 1, type: 'active', icon: '☣️', name: 'Unstable Affliction',
                    desc: 'Active · Shadow nuke dealing base + 110% weapon damage over 5s.',
                    tip: 'Max lvl (20): Scaling shadow explosion potential.',
                    maxPts: 20, mana: 16, cd: 0, group: 'shadow', dmgBase: 15, dmgPerLvl: 8, wepPct: 110, req: 'haunt:5'
                },
                {
                    id: 'soul_fire', row: 5, col: 0, type: 'active', icon: '🔥', name: 'Soul Fire',
                    desc: 'Active · Destructive bolt dealing base + 350% weapon damage.',
                    tip: 'Max lvl (20): Ultimate scaling warlock nuke.',
                    maxPts: 20, mana: 25, cd: 0, group: 'shadow', dmgBase: 70, dmgPerLvl: 25, wepPct: 350, req: 'agony:5'
                },
                {
                    id: 'seed', row: 5, col: 2, type: 'active', icon: '🌑', name: 'Seed of Corruption',
                    desc: 'Active · Explodes for base + 180% weapon damage as shadow AoE.',
                    tip: 'Max lvl (20): High scaling area shadow damage.',
                    maxPts: 20, mana: 20, cd: 3, group: 'shadow', dmgBase: 60, dmgPerLvl: 20, wepPct: 180, req: 'unstable_affliction:3'
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
                    desc: 'Active · Summon Imp shooting for base + 60% weapon damage as fire.',
                    tip: 'Max lvl (20): Scaling demon companion.',
                    maxPts: 20, mana: 20, cd: 5, dmgBase: 10, dmgPerLvl: 5, wepPct: 60
                },
                {
                    id: 'demon_armor', row: 1, col: 0, type: 'passive', icon: '🛡️', name: 'Demon Armor',
                    desc: 'Passive · +20 flat armor and +2% all resistances per point. At 10 points, +5 HP regen per second.',
                    tip: 'Max lvl (20): +400 flat armor · +40% all res.',
                    maxPts: 20
                },
                {
                    id: 'summon_succubus', row: 1, col: 2, type: 'active', icon: '💃', name: 'Summon Succubus',
                    desc: 'Active · Summon Succubus dealing base + 110% weapon damage in melee.',
                    tip: 'Max lvl (20): High scaling physical demon.',
                    maxPts: 20, mana: 30, cd: 5, dmgBase: 25, dmgPerLvl: 10, wepPct: 110, req: 'summon_imp:3'
                },
                {
                    id: 'soul_link', row: 2, col: 0, type: 'passive', icon: '🔗', name: 'Soul Link',
                    desc: 'Passive · +1% life steal per point. A portion of your pet\'s damage heals you.',
                    tip: 'Max lvl (20): +20% life steal.',
                    maxPts: 20, req: 'demon_armor:3'
                },
                {
                    id: 'summon_voidwalker', row: 2, col: 2, type: 'active', icon: '🌑', name: 'Summon Voidwalker',
                    desc: 'Active · Summon Voidwalker tank with base + 100% weapon damage as aggro.',
                    tip: 'Max lvl (20): Scaling demon tank.',
                    maxPts: 20, mana: 35, cd: 5, dmgBase: 30, dmgPerLvl: 12, wepPct: 100, req: 'summon_succubus:3'
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
                    desc: 'Active · Shadow bolt dealing base + 130% weapon damage.',
                    tip: 'Max lvl (20): Primary scaling shadow spam.',
                    maxPts: 20, mana: 10, cd: 0.5, group: 'shadow', dmgBase: 18, dmgPerLvl: 10, wepPct: 130
                },
                {
                    id: 'aff_mastery', row: 1, col: 0, type: 'passive', icon: '🔴', name: 'Chaos Mastery',
                    desc: 'Passive · +5% shadow and fire damage per point. At 10 points, critical strike damage increased by 20%.',
                    tip: 'Max lvl (20): +100% damage.',
                    maxPts: 20
                },
                {
                    id: 'immolate_warlock', row: 1, col: 2, type: 'active', icon: '🔥', name: 'Immolate',
                    desc: 'Active · Burn dealing base + 100% weapon damage + DoT.',
                    tip: 'Max lvl (20): Scaling fire impact + DoT.',
                    maxPts: 20, mana: 14, cd: 0, group: 'fire', dmgBase: 20, dmgPerLvl: 5, wepPct: 100, req: 'shadow_bolt:1'
                },
                {
                    id: 'conflagrate', row: 2, col: 1, type: 'active', icon: '💥', name: 'Conflagrate',
                    desc: 'Active · Explode for base + 210% weapon damage as chaos fire.',
                    tip: 'Max lvl (20): High scaling destruction nuke.',
                    maxPts: 20, mana: 16, cd: 6, group: 'fire', dmgBase: 50, dmgPerLvl: 20, wepPct: 210, req: 'immolate_warlock:3'
                },
                {
                    id: 'incinerate', row: 3, col: 0, type: 'active', icon: '🐍', name: 'Incinerate',
                    desc: 'Active · Wave of fire dealing base + 150% weapon damage.',
                    tip: 'Max lvl (20): Scaling fire destruction.',
                    maxPts: 20, mana: 12, cd: 0, group: 'fire', dmgBase: 30, dmgPerLvl: 12, wepPct: 150, req: 'conflagrate:3'
                },
                {
                    id: 'backdraft', row: 3, col: 2, type: 'passive', icon: '💨', name: 'Backdraft',
                    desc: 'Passive · Casting Conflagrate reduces the cast time and global cooldown of your next 3 destruction spells by 10% per point.',
                    tip: 'Max lvl (3): 30% cast speed burst.',
                    maxPts: 3, req: 'conflagrate:5'
                },
                {
                    id: 'chaos_bolt', row: 4, col: 1, type: 'active', icon: '💥', name: 'Chaos Bolt',
                    desc: 'Active · Unstoppable bolt dealing base + 320% weapon damage.',
                    tip: 'Max lvl (20): Massive scaling chaos impact.',
                    maxPts: 20, mana: 22, cd: 8, group: 'shadow', dmgBase: 60, dmgPerLvl: 25, wepPct: 320, req: 'conflagrate:5',
                    synergies: [{ from: 'aff_mastery', pctPerPt: 4 }]
                },
                {
                    id: 'rain_of_fire', row: 5, col: 0, type: 'active', icon: '🌋', name: 'Rain of Fire',
                    desc: 'Active · Column of fire dealing base + 90% weapon damage per second.',
                    tip: 'Max lvl (20): High scaling area destruction.',
                    maxPts: 20, mana: 30, cd: 12, group: 'fire', dmgBase: 25, dmgPerLvl: 10, wepPct: 90, req: 'chaos_bolt:5',
                    synergies: [{ from: 'aff_mastery', pctPerPt: 3 }]
                },
                {
                    id: 'hellfire', row: 5, col: 2, type: 'active', icon: '🔥', name: 'Hellfire',
                    desc: 'Active · Pulse fire for base + 110% weapon damage around you.',
                    tip: 'Max lvl (20): Scaling point-blank AoE.',
                    maxPts: 20, mana: 25, cd: 0, group: 'fire', dmgBase: 40, dmgPerLvl: 15, wepPct: 110, req: 'chaos_bolt:5'
                },
            ]
        },
    ]
};
