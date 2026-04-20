/**
 * NECROMANCER — Class Definition
 * Three trees: Summoning (army of undead) · Bone (direct damage) · Curses (debuffs)
 */
export const NECROMANCER_CLASS = {
    id: 'necromancer', name: 'Necromancer', icon: '💀',
    description: 'Commands an army of undead minions and curses enemies into helplessness. Powerful indirect damage and unparalleled summon control.',
    stats: { str: 15, dex: 15, vit: 15, int: 25 },
    trees: [

        // ═══ SUMMONING — Army build ═══
        {
            id: 'summoning', name: 'Summoning', icon: '💀',
            nodes: [
                {
                    id: 'raise_skeleton', row: 0, col: 1, type: 'active', icon: '🦴', name: 'Raise Skeleton',
                    desc: 'Active · Raise a skeleton warrior dealing 8 + 4 per point damage.',
                    tip: 'Max lvl (20): 10 skeletons each dealing 88 damage.',
                    maxPts: 20, mana: 12, cd: 0,
                    synergies: [
                        { from: 'skeletal_mage', pctPerPt: 5 },
                        { from: 'clay_golem', pctPerPt: 5 }
                    ]
                },
                {
                    id: 'skeletal_mage', row: 1, col: 0, type: 'active', icon: '🧙', name: 'Skeletal Mage',
                    desc: 'Active · Raise a skeleton mage that deals elemental damage.',
                    tip: 'Max lvl (20): Ranged elemental support army.',
                    maxPts: 20, mana: 15, cd: 0, req: 'raise_skeleton:3',
                    synergies: [
                        { from: 'raise_skeleton', pctPerPt: 5 }
                    ]
                },
                {
                    id: 'skeleton_mastery', row: 1, col: 2, type: 'passive', icon: '💪', name: 'Skeleton Mastery',
                    desc: 'Passive · Each point gives all minions +15% damage and +10% max HP.',
                    tip: 'Max lvl (20): +300% minion damage · +200% HP.',
                    maxPts: 20
                },
                {
                    id: 'clay_golem', row: 2, col: 1, type: 'active', icon: '🗿', name: 'Clay Golem',
                    desc: 'Active · Summon a golem with 200 + 50 per point HP that slows enemies.',
                    tip: 'Max lvl (20): 1,200 HP tank.',
                    maxPts: 20, mana: 35, cd: 5, req: 'skeleton_mastery:5',
                    synergies: [
                        { from: 'blood_golem', pctPerPt: 10 }
                    ]
                },
                {
                    id: 'blood_golem', row: 3, col: 0, type: 'active', icon: '🩸', name: 'Blood Golem',
                    desc: 'Active · Summon a golem that shares life with you. When it deals damage, you heal.',
                    tip: 'Max lvl (20): Life-stealing tank golem.',
                    maxPts: 40, mana: 40, cd: 10, req: 'clay_golem:3',
                    synergies: [
                        { from: 'clay_golem', pctPerPt: 10 }
                    ]
                },
                {
                    id: 'minion_instability', row: 3, col: 2, type: 'passive', icon: '💥', name: 'Minion Instability',
                    desc: 'Passive · When your minions die, they explode for 10% of their max HP as shadow damage.',
                    tip: 'Max lvl (20): 10% HP explosion per point.',
                    maxPts: 20, req: 'skeleton_mastery:10'
                },
                {
                    id: 'death_commander', row: 4, col: 1, type: 'active', icon: '👑', name: 'Death Commander',
                    desc: 'Active · For 15 seconds, your minions deal 100% more damage and attack 50% faster. 120s cooldown.',
                    tip: 'Max lvl (20): Ultimate army burst.',
                    maxPts: 20, mana: 50, cd: 120, group: 'buff', req: 'minion_instability:5'
                }
            ]
        },

        // ═══ BONE & POISON — Direct damage ═══
        {
            id: 'bone', name: 'Bone/Poison', icon: '🦴',
            nodes: [
                {
                    id: 'bone_spear', row: 0, col: 1, type: 'active', icon: '🔱', name: 'Bone Spear',
                    desc: 'Active · Launch a spear dealing 20 + 10 per point shadow damage.',
                    tip: 'Max lvl (20): 220 shadow damage piercing.',
                    maxPts: 20, mana: 11, cd: 0, group: 'shadow', dmgBase: 20, dmgPerLvl: 10,
                    synergies: [{ from: 'bone_mastery', pctPerPt: 5 }]
                },
                {
                    id: 'poison_nova', row: 1, col: 0, type: 'active', icon: '🤢', name: 'Poison Nova',
                    desc: 'Active · Emit a ring of poison dealing 15 + 8 per point damage per second for 5s.',
                    tip: 'Max lvl (20): 175/s poison AoE.',
                    maxPts: 20, mana: 20, cd: 3, group: 'poison', dmgBase: 15, dmgPerLvl: 8, req: 'bone_spear:3',
                    synergies: [{ from: 'poison_blade', pctPerPt: 4 }]
                },
                {
                    id: 'bone_armor', row: 1, col: 2, type: 'active', icon: '🦴', name: 'Bone Armor',
                    desc: 'Active · Surround yourself with bone shards, absorbing 20 + 15 per point damage.',
                    tip: 'Max lvl (20): 320 damage absorbed.',
                    maxPts: 20, mana: 12, cd: 0, group: 'buff'
                },
                {
                    id: 'toxic_spores', row: 2, col: 1, type: 'passive', icon: '🍄', name: 'Toxic Spores',
                    desc: 'Passive · Your poison spells now also reduce enemy healing by 5% per point.',
                    tip: 'Max lvl (20): 100% healing reduction.',
                    maxPts: 20, req: 'poison_nova:5'
                },
                {
                    id: 'corpse_explosion', row: 3, col: 1, type: 'active', icon: '💥', name: 'Corpse Explosion',
                    desc: 'Active · Explode a nearby corpse dealing 10% to 20% of the target\'s max HP as shadow/physical damage.',
                    tip: 'Max lvl (20): The ultimate clearing skill.',
                    maxPts: 20, mana: 25, cd: 1, group: 'shadow', req: 'toxic_spores:3',
                    synergies: [{ from: 'bone_mastery', pctPerPt: 3 }]
                },
                {
                    id: 'blood_mastery', row: 4, col: 1, type: 'passive', icon: '💉', name: 'Blood Mastery',
                    desc: 'Passive · Increases your maximum HP by 2% per point and your Life Steal by 0.5% per point.',
                    tip: 'Max lvl (20): +40% HP · +10% Life Steal.',
                    maxPts: 20, req: 'corpse_explosion:5'
                },
                {
                    id: 'bone_spirit', row: 5, col: 1, type: 'active', icon: '👻', name: 'Bone Spirit',
                    desc: 'Active · Release a homing spirit that seeks a target dealing 80 + 35 per point shadow damage. Costs 10% of your current HP instead of mana.',
                    tip: 'Max lvl (20): 780 homing shadow damage.',
                    maxPts: 20, mana: 0, cd: 2, group: 'shadow', dmgBase: 80, dmgPerLvl: 35, req: 'blood_mastery:5',
                    synergies: [{ from: 'bone_spear', pctPerPt: 8 }]
                }
            ]
        },

        // ═══ CURSES — Debuffs ═══
        {
            id: 'curses', name: 'Curses', icon: '🔴',
            nodes: [
                {
                    id: 'weaken', row: 0, col: 1, type: 'active', icon: '⬇️', name: 'Weaken',
                    desc: 'Active · Curse a target reducing their damage output by 33%.',
                    tip: 'Max lvl (20): -33% damage debuff.',
                    maxPts: 20, mana: 4, cd: 0
                },
                {
                    id: 'amplify_damage', row: 1, col: 0, type: 'active', icon: '🔺', name: 'Amplify Damage',
                    desc: 'Active · Target takes +100% physical damage from all sources.',
                    tip: 'Max lvl (20): +100% physical vuln.',
                    maxPts: 20, mana: 6, cd: 0, req: 'weaken:3'
                },
                {
                    id: 'decrepify', row: 1, col: 2, type: 'active', icon: '🐢', name: 'Decrepify',
                    desc: 'Active · Slows movement/attack speed by 50% and reduces physical res by 50%.',
                    tip: 'Max lvl (20): The ultimate debuff.',
                    maxPts: 20, mana: 12, cd: 0, req: 'weaken:3'
                },
                {
                    id: 'iron_maiden', row: 2, col: 1, type: 'active', icon: '⚔️', name: 'Iron Maiden',
                    desc: 'Active · Curse a target: all physical damage they deal is reflected back.',
                    tip: 'Max lvl (20): Reflect 100% damage.',
                    maxPts: 20, mana: 8, cd: 0, req: 'amplify_damage:3'
                },
                {
                    id: 'revive_elite', row: 3, col: 1, type: 'active', icon: '✨', name: 'Revive',
                    desc: 'Active · Revive a monster corpse as a servant that retains all abilities.',
                    tip: 'Max lvl (20): 13 minute duration.',
                    maxPts: 20, mana: 45, cd: 2, req: 'decrepify:5'
                }
            ]
        },
    ]
};
