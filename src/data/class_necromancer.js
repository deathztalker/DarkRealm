/**
 * NECROMANCER — Class Definition
 * Three trees: Summoning (army of undead) · Bone (direct damage) · Curses (debuffs)
 */
export const NECROMANCER_CLASS = {
    id: 'necromancer', name: 'Necromancer', icon: '💀',
    description: 'Commands an army of undead minions and curses enemies into helplessness. Powerful indirect damage and unparalleled summon control.',
    stats: { str: 15, dex: 15, vit: 15, int: 25 },
    trees: [

        // ═══ SUMMONING — Army of Darkness build ═══
        {
            id: 'summoning', name: 'Summoning', icon: '💀',
            nodes: [
                {
                    id: 'raise_skeleton', row: 0, col: 1, type: 'active', icon: '🦴', name: 'Raise Skeleton',
                    desc: 'Active · Raise a skeleton warrior from a nearby corpse. Skeleton deals 8 + 4 per point damage. You can have 1 skeleton per 2 points invested (max 10). Each skeleton persists until killed.',
                    tip: 'Max lvl (20): 10 skeletons each dealing 88 damage. Scales with Skeleton Mastery.',
                    maxPts: 20, mana: 12, cd: 0
                },
                {
                    id: 'skeleton_mastery', row: 1, col: 0, type: 'passive', icon: '💪', name: 'Skeleton Mastery',
                    desc: 'Passive · Each point gives all your minions +15% damage and +10% max HP. The single most important necromancer passive — invest heavily.',
                    tip: 'Max lvl (20): +300% minion damage · +200% minion HP.',
                    maxPts: 20
                },
                {
                    id: 'golem', row: 1, col: 2, type: 'active', icon: '🗿', name: 'Clay Golem',
                    desc: 'Active · Animate a hulking clay golem with 200 + 50 per point HP that slows every enemy it hits by 25%. Only one golem at a time. Tough frontline tank.',
                    tip: 'Max lvl (20): 1,200 HP golem · 25% slow on all hits.',
                    maxPts: 20, mana: 35, cd: 5
                },
                {
                    id: 'golem_mastery', row: 2, col: 0, type: 'passive', icon: '🏔️', name: 'Golem Mastery',
                    desc: 'Passive · Increases all your golems\' HP by +20% per point and their damage by +5% per point. At 10 points, golems gain life regeneration. Pairs with any golem type.',
                    tip: 'Max lvl (20): +400% golem HP · +100% golem damage · regen at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'revive', row: 2, col: 2, type: 'active', icon: '✨', name: 'Revive',
                    desc: 'Active · Revive a monster corpse as a servant that retains ALL of its original abilities and attacks. Lasts 3 + 0.5 per point minutes. Can revive bosses.',
                    tip: 'Max lvl (20): 13 minute duration. Reviving elites creates powerful temporary allies.',
                    maxPts: 20, mana: 45, cd: 2, req: 'raise_skeleton:5'
                },
                {
                    id: 'summon_resist', row: 3, col: 0, type: 'passive', icon: '🛡️', name: 'Summon Resistance',
                    desc: 'Passive · All your minions gain +5% elemental resistance per point. You personally also gain +2% all resistances per point. Makes your army durable in endgame content.',
                    tip: 'Max lvl (20): Minions +100% res · you +40% all res.',
                    maxPts: 20
                },
                {
                    id: 'army_of_dead', row: 3, col: 2, type: 'active', icon: '⚔️', name: 'Army of the Dead',
                    desc: 'Active · Instantly summon 5 skeleton warriors at your feet, bypassing the need for corpses. They last for 15 + 1 per point seconds. Perfect for boss fights with no corpses.',
                    tip: 'Max lvl (20): 5 skeletons that last 35s. Emergency summon button.',
                    maxPts: 20, mana: 60, cd: 45, req: 'raise_skeleton:10'
                },
                {
                    id: 'iron_golem', row: 4, col: 1, type: 'active', icon: '⚙️', name: 'Iron Golem',
                    desc: 'Active · Sacrifice a metal item from your inventory to create a golem that KEEPS all the item\'s stats. Higher quality items create stronger golems. Unique items create devastating golems.',
                    tip: 'Sacrifice a legendary item to create a godlike golem that inherits its procs.',
                    maxPts: 20, mana: 65, cd: 10, req: 'golem_mastery:10',
                    synergies: [{ from: 'golem_mastery', pctPerPt: 5 }]
                },
            ]
        },

        // ═══ BONE — Direct damage spells ═══
        {
            id: 'bone', name: 'Bone', icon: '🦴',
            nodes: [
                {
                    id: 'bone_spear', row: 0, col: 1, type: 'active', icon: '🔱', name: 'Bone Spear',
                    desc: 'Active · Launch a bone spear that pierces through all enemies in a line dealing 20 + 10 per point shadow damage. Reliable single-target DPS at range.',
                    tip: 'Max lvl (20): 220 shadow damage, hits every enemy in the line.',
                    maxPts: 20, mana: 11, cd: 0, group: 'shadow', dmgBase: 20, dmgPerLvl: 10
                },
                {
                    id: 'bone_armor', row: 1, col: 0, type: 'active', icon: '🦴', name: 'Bone Armor',
                    desc: 'Active · Surround yourself with revolving bone shards, absorbing 20 + 15 per point damage before any reaches your HP. Instantly breaks when absorption is consumed — recast to refresh.',
                    tip: 'Max lvl (20): 320 damage absorbed. Recast frequently.',
                    maxPts: 20, mana: 12, cd: 0
                },
                {
                    id: 'bone_mastery', row: 1, col: 2, type: 'passive', icon: '🟣', name: 'Bone Mastery',
                    desc: 'Passive · +5% shadow and bone spell damage per point. Each point also reduces bone spell cooldowns by 0.3 seconds. The core bone-build passive.',
                    tip: 'Max lvl (20): +100% bone damage · -6s total cooldown.',
                    maxPts: 20
                },
                {
                    id: 'bone_wall', row: 2, col: 0, type: 'active', icon: '🏯', name: 'Bone Wall',
                    desc: 'Active · Erect a wall of bones at target location, blocking movement for 3 + 0.2 per point seconds. Enemies that attempt to pass take 15 + 6 per point damage.',
                    tip: 'Max lvl (20): 7s wall + 135 damage on contact. Use to split enemy groups.',
                    maxPts: 20, mana: 15, cd: 8, dmgBase: 15, dmgPerLvl: 6, req: 'bone_armor:3'
                },
                {
                    id: 'bone_spirit', row: 3, col: 1, type: 'active', icon: '👻', name: 'Bone Spirit',
                    desc: 'Active · Release a homing spirit that tracks the nearest enemy dealing 50 + 15 per point shadow damage. Always hits — no skill shot required. ★ Synergy: +4% per Bone Spear point.',
                    tip: 'Max lvl (20): 350 damage · guaranteed hit. Boss assassin.',
                    maxPts: 20, mana: 18, cd: 0, group: 'shadow', dmgBase: 50, dmgPerLvl: 15, req: 'bone_spear:5',
                    synergies: [{ from: 'bone_spear', pctPerPt: 4 }]
                },
                {
                    id: 'bone_nova', row: 4, col: 1, type: 'active', icon: '💥', name: 'Bone Nova',
                    desc: 'Active · Fire a ring of 10 bone spirits simultaneously in all directions, each dealing 30 + 12 per point shadow damage. Devastating at close range against grouped enemies.',
                    tip: 'Max lvl (20): 10 × 270 = 2,700 total potential. Melee-range nuke.',
                    maxPts: 20, mana: 30, cd: 8, group: 'shadow', dmgBase: 30, dmgPerLvl: 12, req: 'bone_spirit:10',
                    synergies: [{ from: 'bone_mastery', pctPerPt: 5 }]
                },
            ]
        },

        // ═══ CURSES — Debuf war machine ═══
        {
            id: 'curses', name: 'Curses', icon: '🔴',
            nodes: [
                {
                    id: 'weaken', row: 0, col: 1, type: 'active', icon: '⬇️', name: 'Weaken',
                    desc: 'Active · Curse a target reducing their damage output by 33% for 4 + 0.5 per point seconds. A cheap, effective debuff for tough enemies.',
                    tip: 'Max lvl (20): -33% damage, lasts 14s.',
                    maxPts: 20, mana: 4, cd: 0
                },
                {
                    id: 'amplify_damage', row: 1, col: 0, type: 'active', icon: '🔺', name: 'Amplify Damage',
                    desc: 'Active · Remove any curse and instead cause the target to take +100% physical damage from all sources for 4 + 0.5 per point seconds. Pairs devastatingly with melee allies.',
                    tip: 'Max lvl (20): +100% physical damage taken for 14s. Best party debuff vs physical targets.',
                    maxPts: 20, mana: 6, cd: 0
                },
                {
                    id: 'mass_curse', row: 1, col: 2, type: 'active', icon: '📢', name: 'Mass Curse',
                    desc: 'Active · Apply your currently active curse to ALL visible enemies simultaneously. Requires another curse to be active. Use Weaken or Amplify Damage first, then cast this.',
                    tip: 'Instant AoE debuff — one of the most powerful utility skills in the game.',
                    maxPts: 20, mana: 25, cd: 5, req: 'weaken:3'
                },
                {
                    id: 'iron_maiden', row: 2, col: 0, type: 'active', icon: '⚔️', name: 'Iron Maiden',
                    desc: 'Active · Curse a target: all physical damage they deal is reflected back for 100% of the original damage. Devastating vs melee bosses and large groups.',
                    tip: 'A boss that deals 500 physical damage will take 500 reflected per hit. Melts physical attackers.',
                    maxPts: 20, mana: 8, cd: 0, req: 'weaken:5'
                },
                {
                    id: 'decrepify', row: 2, col: 2, type: 'active', icon: '🐢', name: 'Decrepify',
                    desc: 'Active · Curse a target: slows movement and attack speed by 50%, reduces physical resistance by 50%, and halves their life regeneration. The ultimate all-in-one debuff.',
                    tip: 'Combined with Bone Spear, Decrepify enemies take 50% more damage AND are slowed to a crawl.',
                    maxPts: 20, mana: 12, cd: 0, req: 'amplify_damage:5'
                },
                {
                    id: 'plague', row: 3, col: 1, type: 'active', icon: '☠️', name: 'Plague',
                    desc: 'Active · Inflict a virulent plague on a target dealing 10 + 5 per point shadow damage per second. The plague SPREADS to nearby enemies on death, infecting up to 3 others.',
                    tip: 'Max lvl (20): 110/s shadow DoT that spreads on kill. Excellent for clearing packs.',
                    maxPts: 20, mana: 14, cd: 2, req: 'decrepify:5',
                    synergies: [{ from: 'bone_mastery', pctPerPt: 3 }]
                },
            ]
        },
    ]
};
