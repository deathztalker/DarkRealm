/**
 * NECROMANCER — Expanded endgame trees
 * Builds: 1. "Skeleton Lord" — Summoning army  2. "Poison Nova Curser" — Curses+AoE  3. "Bone Sniper" — Bone Spear/Spirit
 */
export const NECROMANCER_CLASS = {
    id: 'necromancer', name: 'Necromancer', icon: '💀',
    desc: 'Master of death, bone, and decay. Raises skeletal armies, curses foes into oblivion, and weaponizes bone itself as piercing magic.',
    stats: { str: 3, dex: 4, vit: 4, int: 9 },
    statBars: { str: 30, dex: 40, vit: 40, int: 90 },
    allowedWeapons: ['wand', 'staff'],
    allowedOffhand: ['source', 'shield'],
    trees: [
        {
            id: 'summoning', name: 'Summoning', icon: '☠️', nodes: [
                {
                    id: 'summon_skeleton', row: 0, col: 1, type: 'active', icon: '💀', name: 'Raise Skeleton',
                    desc: 'Raise a warrior skeleton. Max (1+slvl/4). Each: (8+slvl×5) dmg, (40+slvl×15) HP.',
                    endgame: 'slvl 20: 6 skeletons, 108 dmg, 340 HP each. Army of 6 = 648 DPS combined with mastery.',
                    maxPts: 20, mana: 12, cd: 2, dmgBase: 8, dmgPerLvl: 5
                },
                {
                    id: 'skeleton_mastery', row: 1, col: 0, type: 'passive', icon: '📈', name: 'Skeleton Mastery',
                    desc: '+15% skeleton HP and +12% damage per point. At 10pts: skeletons gain thorns aura.',
                    endgame: 'slvl 20: +300% HP, +240% dmg on all skeletons. Non-negotiable for summon builds.',
                    maxPts: 20
                },
                {
                    id: 'skeleton_mage', row: 1, col: 2, type: 'active', icon: '🧙', name: 'Skeleton Mage',
                    desc: 'Raise a caster skeleton: fires (10+slvl×6) elemental bolts. Random element type. Max (1+slvl/5).',
                    endgame: 'slvl 20: 5 mages, 130 elemental dmg each. Mixed damage types bypass single-element immunity.',
                    maxPts: 20, mana: 14, cd: 3, group: 'magic', dmgBase: 10, dmgPerLvl: 6, req: 'summon_skeleton:3'
                },
                {
                    id: 'golem', row: 2, col: 1, type: 'active', icon: '🗿', name: 'Clay Golem',
                    desc: 'Summon tank golem: (50+slvl×20) HP, slows nearby enemies by 30%. Only 1 golem active.',
                    endgame: 'slvl 20: 450 HP golem with AoE slow. Ideal tank for your skeleton army.',
                    maxPts: 20, mana: 22, cd: 60, req: 'summon_skeleton:5'
                },
                {
                    id: 'revive', row: 2, col: 0, type: 'active', icon: '🧟', name: 'Revive',
                    desc: 'Revive a slain monster as your servant for (20+slvl×2)s. Retains original abilities. Max (1+slvl/6).',
                    endgame: 'slvl 20: 60s duration, 4 revived monsters. Revive elite/rare mobs for their affixes!',
                    maxPts: 20, mana: 28, cd: 5, req: 'summon_skeleton:10'
                },
                {
                    id: 'golem_mastery', row: 3, col: 0, type: 'passive', icon: '📈', name: 'Golem Mastery',
                    desc: '+20% golem HP and +15% golem damage per point. At 15pts: golem explodes on death dealing AoE.',
                    endgame: 'slvl 20: +400% golem HP, +300% dmg. Death explosion adds burst damage.',
                    maxPts: 20, req: 'golem:3'
                },
                {
                    id: 'summon_resist', row: 3, col: 2, type: 'passive', icon: '🛡️', name: 'Summon Resist',
                    desc: '+10% all elemental resistance for all summoned creatures per point.',
                    endgame: 'slvl 20: all minions get +200% (capped 75%) all res. They never die to AoE spells.',
                    maxPts: 20, req: 'revive:5'
                },
                {
                    id: 'army_of_dead', row: 4, col: 1, type: 'active', icon: '⚰️', name: 'Army of the Dead',
                    desc: 'Ultimate: instantly summon 10 skeleton warriors for 20s that deal (20+slvl×10) each, regardless of max.',
                    endgame: 'slvl 20: 10 extra skeletons × 220 dmg for 20s. Combined with existing army = overwhelming.',
                    maxPts: 20, mana: 40, cd: 120, req: 'skeleton_mastery:15',
                    synergies: [{ from: 'skeleton_mastery', pctPerPt: 5 }]
                },
            ]
        },
        {
            id: 'curses', name: 'Curses', icon: '🌑', nodes: [
                {
                    id: 'amplify_damage', row: 0, col: 1, type: 'active', icon: '💢', name: 'Amplify Damage',
                    desc: 'Curse: target takes +(100+slvl×5)% physical damage for 10+slvl×1s.',
                    endgame: 'slvl 20: +200% physical dmg taken for 30s. Doubles+ all physical DPS in party.',
                    maxPts: 20, mana: 7, cd: 0
                },
                {
                    id: 'weaken', row: 1, col: 0, type: 'active', icon: '💔', name: 'Weaken',
                    desc: 'Curse: target deals -(30+slvl×1)% damage for 10+slvl×1s.',
                    endgame: 'slvl 20: -50% enemy damage for 30s. Key survivability curse.',
                    maxPts: 20, mana: 5, cd: 0
                },
                {
                    id: 'iron_maiden', row: 1, col: 2, type: 'active', icon: '🩸', name: 'Iron Maiden',
                    desc: 'Curse: returns (200+slvl×10)% of melee damage dealt back to attacker.',
                    endgame: 'slvl 20: 400% damage reflect. Bosses literally kill themselves hitting you.',
                    maxPts: 20, mana: 9, cd: 0
                },
                {
                    id: 'decrepify', row: 2, col: 1, type: 'active', icon: '🦴', name: 'Decrepify',
                    desc: 'Curse: slows by 50%, weakens by 30%, reduces phys resist by 25%. Duration: 10+slvl×0.5s.',
                    endgame: 'slvl 20: 20s of total debilitation. The ultimate control curse.',
                    maxPts: 20, mana: 10, cd: 0, req: 'weaken:5'
                },
                {
                    id: 'life_tap_curse', row: 2, col: 0, type: 'active', icon: '❤️', name: 'Life Tap',
                    desc: 'Curse: all hits vs target steal (30+slvl×2)% as life for 10+slvl×1s.',
                    endgame: 'slvl 20: 70% life steal for whole party. Turns any fight into a heal-fest.',
                    maxPts: 20, mana: 8, cd: 0, req: 'decrepify:5'
                },
                {
                    id: 'lower_resist', row: 3, col: 0, type: 'active', icon: '⬇️', name: 'Lower Resist',
                    desc: 'Curse: reduces all elemental resistances by -(35+slvl×2)% for 15s.',
                    endgame: 'slvl 20: -75% all res. Combined with Sorceress mastery = negative resistances.',
                    maxPts: 20, mana: 9, cd: 0, req: 'decrepify:5'
                },
                {
                    id: 'poison_nova', row: 3, col: 2, type: 'active', icon: '☠️', name: 'Poison Nova',
                    desc: 'Release a nova of poison: (20+slvl×12) poison damage to all enemies in range. DoT (5+slvl×3)/s for 4s.',
                    endgame: 'slvl 20: 260 burst + 65/s DoT = 520 total per target AoE. Hybrid curse+damage build enabler.',
                    maxPts: 20, mana: 18, cd: 8, group: 'poison', dmgBase: 20, dmgPerLvl: 12, req: 'lower_resist:3'
                },
                {
                    id: 'mass_curse', row: 4, col: 1, type: 'active', icon: '🌑', name: 'Mass Curse',
                    desc: 'Ultimate: apply ALL active curses to all enemies on screen simultaneously for 10s.',
                    endgame: 'slvl 20: every curse you know hits every enemy at once. Total battlefield control.',
                    maxPts: 20, mana: 30, cd: 60, req: 'lower_resist:10',
                    synergies: [{ from: 'decrepify', pctPerPt: 4 }]
                },
            ]
        },
        {
            id: 'bone', name: 'Bone & Poison', icon: '🦴', nodes: [
                {
                    id: 'teeth', row: 0, col: 0, type: 'active', icon: '🦷', name: 'Teeth',
                    desc: 'Spray (3+slvl/3) bone shards in a fan: (8+slvl×4) magic damage each.',
                    endgame: 'slvl 20: 9 shards × 88 = 792 potential. Good spread damage and synergy fuel.',
                    maxPts: 20, mana: 9, cd: 0, group: 'bone', dmgBase: 8, dmgPerLvl: 4
                },
                {
                    id: 'bone_spear', row: 0, col: 2, type: 'active', icon: '🦴', name: 'Bone Spear',
                    desc: 'Piercing bone shard: (15+slvl×10) magic damage. Pierces all enemies in a line.',
                    endgame: 'slvl 20: 215 magic piercing. Magic type bypasses all resistances. Top single-skill DPS.',
                    maxPts: 20, mana: 11, cd: 0, group: 'bone', dmgBase: 15, dmgPerLvl: 10
                },
                {
                    id: 'bone_armor', row: 1, col: 1, type: 'active', icon: '🛡️', name: 'Bone Armor',
                    desc: 'Generate a bone shell absorbing (15+slvl×12) damage. Refreshable, no cooldown.',
                    endgame: 'slvl 20: 255 damage absorb. Always keep up. Necromancer survivability backbone.',
                    maxPts: 20, mana: 8, cd: 0, dmgBase: 15, dmgPerLvl: 12
                },
                {
                    id: 'bone_wall', row: 1, col: 0, type: 'active', icon: '🧱', name: 'Bone Wall',
                    desc: 'Raise a wall of bones that blocks pathing for (5+slvl×0.5)s. Wall has (50+slvl×20) HP.',
                    endgame: 'slvl 20: 15s wall with 450 HP. Blocks corridors, forces enemies to path around.',
                    maxPts: 20, mana: 10, cd: 3, req: 'bone_armor:3'
                },
                {
                    id: 'bone_spirit', row: 2, col: 1, type: 'active', icon: '👻', name: 'Bone Spirit',
                    desc: 'Homing bone spirit: (25+slvl×14) magic damage. Always hits. Cannot be evaded.',
                    endgame: 'slvl 20: 305 guaranteed magic damage. Snipes runners and invisible enemies.',
                    maxPts: 20, mana: 18, cd: 0, group: 'bone', dmgBase: 25, dmgPerLvl: 14, req: 'bone_spear:5',
                    synergies: [{ from: 'bone_spear', pctPerPt: 5 }, { from: 'teeth', pctPerPt: 3 }]
                },
                {
                    id: 'bone_mastery', row: 2, col: 0, type: 'passive', icon: '📈', name: 'Bone Mastery',
                    desc: 'Passive. +7% bone spell damage per point. At 10pts: bone spells have 5% chance to stun.',
                    endgame: 'slvl 20: +140% bone dmg. Magic damage with stun = premium endgame.',
                    maxPts: 20
                },
                {
                    id: 'bone_prison', row: 3, col: 2, type: 'active', icon: '⛓️', name: 'Bone Prison',
                    desc: 'Trap target in a bone cage for (3+slvl×0.2)s. Cannot move or be reached by melee.',
                    endgame: 'slvl 20: 7s prison. Lock down dangerous rare/unique enemies completely.',
                    maxPts: 20, mana: 14, cd: 8, req: 'bone_wall:5'
                },
                {
                    id: 'bone_storm', row: 4, col: 1, type: 'active', icon: '🌀', name: 'Bone Storm',
                    desc: 'Ultimate: orbiting bone shards deal (15+slvl×8) magic/s to all nearby for 15s. You are immune to projectiles during.',
                    endgame: 'slvl 20: 175/s AoE for 15s + projectile immunity. Melee-range devastation.',
                    maxPts: 20, mana: 30, cd: 45, group: 'bone', dmgBase: 15, dmgPerLvl: 8, req: 'bone_spirit:10',
                    synergies: [{ from: 'bone_mastery', pctPerPt: 4 }]
                },
            ]
        },
    ]
};
