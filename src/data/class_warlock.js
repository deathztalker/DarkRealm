/**
 * WARLOCK — Class Definition
 * Three trees: Affliction (curses & DoTs) · Demonology (summons) · Destruction (burst fire)
 */
export const WARLOCK_CLASS = {
    id: 'warlock', name: 'Warlock', icon: '🔥',
    description: 'A dark mage who deals in souls and demons. Masters of periodic damage and powerful demonic allies.',
    stats: { str: 10, dex: 15, vit: 20, int: 25 },
    trees: [

        // ═══ AFFLICTION — Damage Over Time ═══
        {
            id: 'affliction', name: 'Affliction', icon: '🟣',
            nodes: [
                {
                    id: 'curse_of_exhaustion', row: 0, col: 0, type: 'active', icon: '🐢', name: 'Curse of Exhaustion',
                    desc: 'Active · Reduces target movement speed by 30% + 2% per point for 12 seconds.',
                    tip: 'Max lvl (20): 70% slow.',
                    maxPts: 20, mana: 8, cd: 0, group: 'shadow'
                },
                {
                    id: 'corruption', row: 0, col: 1, type: 'active', icon: '☠️', name: 'Corruption',
                    desc: 'Active · Corrupts the target, dealing 10 + 5 per point shadow damage per second for 15s.',
                    tip: 'Max lvl (20): 110/s shadow DoT.',
                    maxPts: 20, mana: 12, cd: 0, group: 'shadow'
                },
                {
                    id: 'shadow_mastery', row: 1, col: 0, type: 'passive', icon: '🟣', name: 'Shadow Mastery',
                    desc: 'Passive · Increases all shadow damage dealt by 5% per point.',
                    tip: 'Max lvl (20): +100% shadow damage.',
                    maxPts: 20
                },
                {
                    id: 'siphon_life', row: 1, col: 2, type: 'active', icon: '🩸', name: 'Siphon Life',
                    desc: 'Active · Deals 8 + 4 per point shadow damage per second and heals you for 100% of the damage.',
                    tip: 'Max lvl (20): Powerful self-healing DoT.',
                    maxPts: 20, mana: 15, cd: 0, group: 'shadow', req: 'corruption:3'
                },
                {
                    id: 'malefic_grasp', row: 2, col: 0, type: 'active', icon: '🖐️', name: 'Malefic Grasp',
                    desc: 'Active · Channels shadow energy into the target, dealing damage and causing your other DoTs to tick 50% faster.',
                    tip: 'Max lvl (20): Massive DoT acceleration.',
                    maxPts: 20, mana: 20, cd: 0, group: 'shadow', req: 'shadow_mastery:1'
                },
                {
                    id: 'haunt', row: 2, col: 1, type: 'active', icon: '👻', name: 'Haunt',
                    desc: 'Active · A ghostly soul that deals 30 + 15 damage and increases all your DoT damage by 20% on the target.',
                    tip: 'Max lvl (20): 330 damage + DoT boost.',
                    maxPts: 20, mana: 18, cd: 8, group: 'shadow', dmgBase: 30, dmgPerLvl: 15, req: 'siphon_life:3'
                },
                {
                    id: 'soul_siphon', row: 3, col: 0, type: 'passive', icon: '🌀', name: 'Soul Siphon',
                    desc: 'Passive · Killing a target with your shadow spells restores 2 + 1 per point mana.',
                    tip: 'Max lvl (20): 22 mana on kill.',
                    maxPts: 20, req: 'haunt:1'
                },
                {
                    id: 'agony', row: 3, col: 2, type: 'active', icon: '😱', name: 'Agony',
                    desc: 'Active · A curse that deals increasing shadow damage over 20s, starting at 5 and ending at 50 + 20/lvl.',
                    tip: 'Max lvl (20): Extreme long-term damage.',
                    maxPts: 20, mana: 10, cd: 0, group: 'shadow', req: 'haunt:1'
                },
                {
                    id: 'unstable_affliction', row: 4, col: 1, type: 'active', icon: '☣️', name: 'Unstable Affliction',
                    desc: 'Active · High damage shadow DoT. If dispelled, it deals massive burst damage and silences.',
                    tip: 'Max lvl (20): 250/s shadow DoT.',
                    maxPts: 20, mana: 25, cd: 0, group: 'shadow', req: 'agony:5'
                },
                {
                    id: 'soul_fire', row: 5, col: 0, type: 'active', icon: '🔥', name: 'Soul Fire',
                    desc: 'Active · Consumes a Soul Shard to deal 100 + 50 shadow-fire damage instantly.',
                    tip: 'Max lvl (20): 1,100 burst damage.',
                    maxPts: 20, mana: 30, cd: 15, group: 'fire', req: 'unstable_affliction:1'
                },
                {
                    id: 'seed', row: 5, col: 2, type: 'active', icon: '🌑', name: 'Seed of Corruption',
                    desc: 'Active · Embeds a seed that explodes after taking enough damage, dealing shadow damage to all nearby.',
                    tip: 'Max lvl (20): Powerful shadow AoE.',
                    maxPts: 20, mana: 35, cd: 0, group: 'shadow', req: 'unstable_affliction:1'
                },
                {
                    id: 'pandemic', row: 6, col: 1, type: 'active', icon: '🦠', name: 'Pandemic',
                    desc: 'Active · Spreads all your active DoTs from the target to all nearby enemies. 60s cooldown.',
                    tip: 'Max lvl (20): Instant multi-target infection.',
                    maxPts: 20, mana: 50, cd: 60, group: 'shadow', req: 'soul_fire:1'
                }
            ]
        },

        // ═══ DEMONOLOGY — Summons ═══
        {
            id: 'demonology', name: 'Demonology', icon: '👹',
            nodes: [
                {
                    id: 'summon_felguard', row: 0, col: 0, type: 'active', icon: '⚔️', name: 'Summon Felguard',
                    desc: 'Summon · A powerful demonic warrior that cleaves enemies and has high HP.',
                    tip: 'Max lvl (20): Ultimate melee demon minion.',
                    maxPts: 20, mana: 40, cd: 30, group: 'summon'
                },
                {
                    id: 'summon_imp', row: 0, col: 1, type: 'active', icon: '😈', name: 'Summon Imp',
                    desc: 'Summon · A small demon that fires firebolts and grants the master Fire Resistance.',
                    tip: 'Max lvl (20): Ranged fire support.',
                    maxPts: 20, mana: 15, cd: 10, group: 'summon'
                },
                {
                    id: 'demon_armor', row: 1, col: 0, type: 'passive', icon: '🛡️', name: 'Demon Armor',
                    desc: 'Passive · +20 armor and +2% all resistances per point.',
                    tip: 'Max lvl (20): +400 armor · +40% Resists.',
                    maxPts: 20
                },
                {
                    id: 'demonic_empowerment', row: 1, col: 2, type: 'passive', icon: '⚡', name: 'Demonic Empowerment',
                    desc: 'Passive · Your demons deal 10% more damage and attack 5% faster per point.',
                    tip: 'Max lvl (20): +200% demon damage.',
                    maxPts: 20, req: 'summon_imp:1'
                },
                {
                    id: 'summon_succubus', row: 2, col: 1, type: 'active', icon: '💃', name: 'Summon Succubus',
                    desc: 'Summon · A demoness who seduces enemies, reducing their defense and dealing shadow damage.',
                    tip: 'Max lvl (20): Utility and single-target DPS.',
                    maxPts: 20, mana: 25, cd: 15, group: 'summon', req: 'demon_armor:3'
                },
                {
                    id: 'soul_link', row: 3, col: 0, type: 'passive', icon: '🔗', name: 'Soul Link',
                    desc: 'Passive · 10% + 1% per point of damage you take is shared with your active demon.',
                    tip: 'Max lvl (20): 30% damage redirection.',
                    maxPts: 20, req: 'summon_succubus:1'
                },
                {
                    id: 'summon_voidwalker', row: 3, col: 2, type: 'active', icon: '🌑', name: 'Summon Voidwalker',
                    desc: 'Summon · A shadow demon that tanks enemies and can consume its own life to shield the master.',
                    tip: 'Max lvl (20): High HP shadow tank.',
                    maxPts: 20, mana: 30, cd: 20, group: 'summon', req: 'soul_link:1'
                },
                {
                    id: 'demonic_sacrifice', row: 4, col: 1, type: 'active', icon: '💀', name: 'Demonic Sacrifice',
                    desc: 'Active · Sacrifice your demon to gain a massive buff to HP, Mana, or Damage for 30s.',
                    tip: 'Max lvl (20): Ultimate master boost.',
                    maxPts: 20, mana: 10, cd: 60, group: 'buff', req: 'summon_voidwalker:3'
                },
                {
                    id: 'master_demonologist', row: 5, col: 1, type: 'passive', icon: '👹', name: 'Master Demonologist',
                    desc: 'Passive · While a demon is active, you deal 3% more damage and take 3% less damage per point.',
                    tip: 'Max lvl (20): +60% damage/reduction.',
                    maxPts: 20, req: 'demonic_sacrifice:1'
                },
                {
                    id: 'dark_pact', row: 6, col: 0, type: 'active', icon: '💉', name: 'Dark Pact',
                    desc: 'Active · Drains 10% of your demon\'s HP to restore 20% of your mana.',
                    tip: 'Max lvl (20): Infinite mana sustain.',
                    maxPts: 20, mana: 0, cd: 5, group: 'buff', req: 'master_demonologist:1'
                },
                {
                    id: 'metamorphosis', row: 6, col: 2, type: 'active', icon: '👹', name: 'Metamorphosis',
                    desc: 'Active · Transform into a demon for 20s: +100% damage and +50% armor. 120s cooldown.',
                    tip: 'Max lvl (20): Become the demon.',
                    maxPts: 20, mana: 50, cd: 120, group: 'buff', req: 'master_demonologist:5'
                }
            ]
        },

        // ═══ DESTRUCTION — Burst Fire ═══
        {
            id: 'destruction', name: 'Destruction', icon: '💥',
            nodes: [
                {
                    id: 'shadow_bolt', row: 0, col: 1, type: 'active', icon: '🌑', name: 'Shadow Bolt',
                    desc: 'Active · Fires a bolt of shadow energy dealing 20 + 10 shadow damage.',
                    tip: 'Max lvl (20): 220 shadow damage.',
                    maxPts: 20, mana: 10, cd: 0, group: 'shadow'
                },
                {
                    id: 'shadowburn', row: 0, col: 2, type: 'active', icon: '🔥', name: 'Shadowburn',
                    desc: 'Active · Instantly blasts the target for 40 + 20 shadow damage. If the target dies, restores the mana cost.',
                    tip: 'Max lvl (20): 440 damage finisher.',
                    maxPts: 20, mana: 15, cd: 15, group: 'shadow'
                },
                {
                    id: 'aff_mastery', row: 1, col: 0, type: 'passive', icon: '🔴', name: 'Chaos Mastery',
                    desc: 'Passive · Increases fire and shadow damage by 5% per point.',
                    tip: 'Max lvl (20): +100% Chaos damage.',
                    maxPts: 20
                },
                {
                    id: 'ember_storm', row: 1, col: 1, type: 'passive', icon: '🌪️', name: 'Ember Storm',
                    desc: 'Passive · Reduces the cast time and mana cost of fire spells by 5% per point.',
                    tip: 'Max lvl (20): +100% fire efficiency.',
                    maxPts: 20, req: 'shadow_bolt:1'
                },
                {
                    id: 'immolate_warlock', row: 1, col: 2, type: 'active', icon: '🔥', name: 'Immolate',
                    desc: 'Active · Burns the target for 15 + 8 damage and an additional 10 + 4 damage over 15s.',
                    tip: 'Max lvl (20): Fire DoT and burst.',
                    maxPts: 20, mana: 15, cd: 0, group: 'fire', req: 'shadow_bolt:3'
                },
                {
                    id: 'conflagrate', row: 2, col: 1, type: 'active', icon: '💥', name: 'Conflagrate',
                    desc: 'Active · Consumes an Immolate effect to deal massive instant fire damage and stun for 1s.',
                    tip: 'Max lvl (20): Destruction combo piece.',
                    maxPts: 20, mana: 12, cd: 6, group: 'fire', req: 'immolate_warlock:5'
                },
                {
                    id: 'incinerate', row: 3, col: 0, type: 'active', icon: '🐍', name: 'Incinerate',
                    desc: 'Active · Channels a beam of fire dealing 25 + 12 fire damage per second.',
                    tip: 'Max lvl (20): 265/s fire beam.',
                    maxPts: 20, mana: 15, cd: 0, group: 'fire', req: 'conflagrate:1'
                },
                {
                    id: 'backdraft', row: 3, col: 2, type: 'passive', icon: '💨', name: 'Backdraft',
                    desc: 'Passive · After casting Conflagrate, your next 3 fire spells have +30% haste.',
                    tip: 'Max lvl (20): +30% haste buff.',
                    maxPts: 20, req: 'conflagrate:3'
                },
                {
                    id: 'chaos_bolt', row: 4, col: 1, type: 'active', icon: '💥', name: 'Chaos Bolt',
                    desc: 'Active · Unleashes a bolt of chaos dealing 80 + 40 damage. This damage cannot be resisted.',
                    tip: 'Max lvl (20): 880 unresistable damage.',
                    maxPts: 20, mana: 30, cd: 12, group: 'fire', req: 'backdraft:1'
                },
                {
                    id: 'rain_of_fire', row: 5, col: 0, type: 'active', icon: '🌋', name: 'Rain of Fire',
                    desc: 'Active · Call down fire from the sky, dealing 20 + 10 fire damage per second in an area.',
                    tip: 'Max lvl (20): Classic fire AoE.',
                    maxPts: 20, mana: 25, cd: 5, group: 'fire', req: 'chaos_bolt:1'
                },
                {
                    id: 'hellfire', row: 5, col: 2, type: 'active', icon: '🔥', name: 'Hellfire',
                    desc: 'Active · Ignites the ground around you, dealing massive fire damage to you and all nearby enemies.',
                    tip: 'Max lvl (20): Dangerous close-range burst.',
                    maxPts: 20, mana: 35, cd: 10, group: 'fire', req: 'chaos_bolt:1'
                }
            ]
        },
    ]
};
