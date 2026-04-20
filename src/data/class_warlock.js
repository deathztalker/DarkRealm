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
                    desc: 'Active · Instantly apply a powerful curse doing 8 + 4 per point shadow damage per second for 6 seconds. Zero cast time — apply instantly and move on.',
                    tip: 'Max lvl (20): 88/s × 6s = 528 DoT. Stack on multiple enemies for massive passive DPS.',
                    maxPts: 20, mana: 8, cd: 0, group: 'shadow', dmgBase: 8, dmgPerLvl: 4
                },
                {
                    id: 'shadow_mastery', row: 1, col: 0, type: 'passive', icon: '🟣', name: 'Shadow Mastery',
                    desc: 'Passive · +5% shadow damage per point. At 10 points, your DoT spells can critically strike (including ticks). The cornerstone passive for Affliction builds.',
                    tip: 'Max lvl (20): +100% shadow damage · DoT crits active at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'haunt', row: 1, col: 2, type: 'active', icon: '👻', name: 'Haunt',
                    desc: 'Active · Send a haunt that deals 10 + 6 per point shadow damage per second for 8 seconds AND increases all shadow damage taken by the target by 20%. Doubles value of all other DoTs.',
                    tip: 'Max lvl (20): 130/s × 8s = 1,040 DoT + 20% debuff. Apply before all other DoTs.',
                    maxPts: 20, mana: 14, cd: 8, group: 'shadow', dmgBase: 10, dmgPerLvl: 6, req: 'corruption:3'
                },
                {
                    id: 'agony', row: 2, col: 1, type: 'active', icon: '😱', name: 'Agony',
                    desc: 'Active · Apply a ramping DoT starting at 2 + 1 per point shadow damage per second, doubling every 2 seconds up to 6 ticks (max 12×). Slow startup but enormous long-term damage.',
                    tip: 'Max lvl (20): Tick 1 = 22/s → tick 6 = 704/s. Best single-target DoT vs tanky bosses.',
                    maxPts: 20, mana: 12, cd: 0, group: 'shadow', dmgBase: 2, dmgPerLvl: 1, req: 'haunt:3',
                    synergies: [{ from: 'shadow_mastery', pctPerPt: 4 }]
                },
                {
                    id: 'soul_fire', row: 3, col: 0, type: 'active', icon: '🔥', name: 'Soul Fire',
                    desc: 'Active · Channel 1 second to unleash a concentrated bolt of shadow fire dealing 70 + 25 per point shadow damage. Against targets with 3+ active DoTs: no cast time required.',
                    tip: 'Max lvl (20): 570 shadow damage · instant cast vs DoT targets. DoT enabler.',
                    maxPts: 20, mana: 25, cd: 0, group: 'shadow', dmgBase: 70, dmgPerLvl: 25, req: 'agony:5'
                },
                {
                    id: 'seed', row: 3, col: 2, type: 'active', icon: '🌑', name: 'Seed of Corruption',
                    desc: 'Active · Plant a ticking bomb of corruption on a target. When they take 200 + 50 per point total shadow damage they explode, dealing 60 + 20 per point AoE shadow damage to all nearby enemies.',
                    tip: 'Max lvl (20): 1,200 damage trigger threshold · 460 AoE explosion. Chain on packs for massive AoE.',
                    maxPts: 20, mana: 20, cd: 3, group: 'shadow', dmgBase: 60, dmgPerLvl: 20, req: 'soul_fire:3'
                },
            ]
        },

        // ═══ DEMONOLOGY — Demon command ═══
        {
            id: 'demonology', name: 'Demonology', icon: '😈',
            nodes: [
                {
                    id: 'summon_imp', row: 0, col: 1, type: 'active', icon: '😈', name: 'Summon Imp',
                    desc: 'Active · Summon a fire imp companion that automatically shoots fire bolts at nearby enemies for 10 + 5 per point fire damage. Persistent pet — one at a time.',
                    tip: 'Max lvl (20): Imp deals 110 fire per shot automatically.',
                    maxPts: 20, mana: 20, cd: 5
                },
                {
                    id: 'demon_armor', row: 1, col: 0, type: 'passive', icon: '🛡️', name: 'Demon Armor',
                    desc: 'Passive · +20 flat armor per point AND +2% all resistances per point. At 10 points, also grants +5 HP regen per second. Keeps the fragile Warlock alive.',
                    tip: 'Max lvl (20): +400 flat armor · +40% all res · +5 regen at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'soul_link', row: 1, col: 2, type: 'passive', icon: '🔗', name: 'Soul Link',
                    desc: 'Passive · +1% life steal on every attack per point. A portion of your demon pet\'s health damage is also redirected to you as healing. Sustain through offense.',
                    tip: 'Max lvl (20): +20% life steal on attacks.',
                    maxPts: 20
                },
                {
                    id: 'summon_voidwalker', row: 2, col: 1, type: 'active', icon: '🌑', name: 'Summon Voidwalker',
                    desc: 'Active · Replace your current demon with a Voidwalker, a tanky void creature with 300 + 80 per point HP that taunts enemies and absorbs hits. Sacrifices DPS for a living shield.',
                    tip: 'Max lvl (20): Voidwalker has 1,900 HP. Forces boss to hit it instead of you.',
                    maxPts: 20, mana: 35, cd: 5, req: 'summon_imp:3'
                },
                {
                    id: 'dark_pact', row: 3, col: 0, type: 'active', icon: '💉', name: 'Dark Pact',
                    desc: 'Active · Sacrifice 20% of your current HP to empower your next spell to deal +100 + 5% per point damage. High risk, high reward — don\'t use when low on health.',
                    tip: 'Max lvl (20): +200% next spell damage at the cost of 20% HP.',
                    maxPts: 20, mana: 0, cd: 10, req: 'demon_armor:5'
                },
                {
                    id: 'metamorphosis', row: 3, col: 2, type: 'active', icon: '👹', name: 'Metamorphosis',
                    desc: 'Active · Transform into a demon lord for 30 + 1 per point seconds: +200% size, all spells deal +50% damage, you gain a new melee attack dealing 100 shadow damage, and you cannot be crowd controlled. 120s cooldown.',
                    tip: 'Max lvl (20): 50s demon form · unstoppable rampage mode.',
                    maxPts: 20, mana: 30, cd: 120, req: 'dark_pact:5'
                },
            ]
        },

        // ═══ DESTRUCTION — Burst damage ═══
        {
            id: 'destruction', name: 'Destruction', icon: '💥',
            nodes: [
                {
                    id: 'shadow_bolt', row: 0, col: 1, type: 'active', icon: '🌑', name: 'Shadow Bolt',
                    desc: 'Active · Fire a bolt of shadow energy dealing 18 + 10 per point shadow damage. Short cooldown, moderate mana. Your bread-and-butter direct damage spell.',
                    tip: 'Max lvl (20): 218 shadow damage per cast.',
                    maxPts: 20, mana: 10, cd: 0.5, group: 'shadow', dmgBase: 18, dmgPerLvl: 10
                },
                {
                    id: 'aff_mastery', row: 1, col: 0, type: 'passive', icon: '🔴', name: 'Chaos Mastery',
                    desc: 'Passive · +5% shadow damage per point. At 10 points, your DoTs also critically strike when you crit. Destruction builds use this for both direct and DoT synergy.',
                    tip: 'Max lvl (20): +100% shadow damage · DoT crit at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'conflagrate', row: 1, col: 2, type: 'active', icon: '🔥', name: 'Conflagrate',
                    desc: 'Active · Cause a target that is burning or on fire to instantly burst into flame, dealing 50 + 20 per point fire/shadow damage and spreading fire to 2 nearby enemies.',
                    tip: 'Max lvl (20): 450 chaos damage + 2 targets spread. Apply Immolate first then detonate.',
                    maxPts: 20, mana: 16, cd: 6, group: 'fire', dmgBase: 50, dmgPerLvl: 20, req: 'shadow_bolt:3'
                },
                {
                    id: 'chaos_bolt', row: 2, col: 1, type: 'active', icon: '💥', name: 'Chaos Bolt',
                    desc: 'Active · Hurl a bolt of crackling chaos energy that CANNOT be resisted or blocked, dealing 60 + 25 per point shadow/fire combined damage. Pierces immunity. 8s cooldown.',
                    tip: 'Max lvl (20): 560 damage · bypasses all resistances. Against highly resistant bosses.',
                    maxPts: 20, mana: 22, cd: 8, group: 'shadow', dmgBase: 60, dmgPerLvl: 25, req: 'conflagrate:5',
                    synergies: [{ from: 'aff_mastery', pctPerPt: 4 }]
                },
                {
                    id: 'rain_of_fire', row: 3, col: 1, type: 'active', icon: '🌋', name: 'Rain of Fire',
                    desc: 'Active · Call a column of fire that scorches the earth for 5 seconds dealing 25 + 10 per point fire/shadow damage per second in the area. Great for denying enemy movement.',
                    tip: 'Max lvl (20): 225/s × 5s = 1,125 total. Apply Conflagrate inside for massive burst.',
                    maxPts: 20, mana: 30, cd: 12, group: 'fire', dmgBase: 25, dmgPerLvl: 10, req: 'chaos_bolt:5',
                    synergies: [{ from: 'shadow_mastery', pctPerPt: 3 }]
                },
            ]
        },
    ]
};
