export const NECROMANCER_MUTATIONS = {
    raise_skeleton: [
        {
            id: 'skel_warrior', name: 'Legionnaire', max: 5,
            desc: '+15% Skeleton HP and +10% Armor.',
            masteryPerk: 'Phalanx: Skeletons take 50% less damage if they are near 3+ other minions.',
            mod: { minionHp: 15, minionArmor: 10 },
            icon: 'ra-skeleton'
        },
        {
            id: 'skel_grave', name: 'Grave Lord', max: 5,
            desc: '+20% Skeleton Damage per level.',
            masteryPerk: 'Corpse Bloom: Skeletons explode for 200% weapon damage on death.',
            mod: { minionDmg: 20 },
            icon: 'ra-skull'
        }
    ],
    skeletal_mage: [
        {
            id: 'sm_focus', name: 'Elemental Focus', max: 5,
            desc: '+15% Mage damage and +5% resistance.',
            masteryPerk: 'Skeletal Mages now fire 2 bolts instead of 1.',
            mod: { minionDmg: 15, minionRes: 5 },
            icon: 'ra-magic-portal'
        }
    ],
    clay_golem: [
        {
            id: 'cg_weight', name: 'Heavy Clay', max: 5,
            desc: '+20% HP and +10% Slow effect.',
            masteryPerk: 'Clay Golem reflects 20% of physical damage taken.',
            mod: { minionHp: 20, slowPct: 10 },
            icon: 'ra-stone-tower'
        }
    ],
    blood_golem: [
        {
            id: 'bg_bond', name: 'Sanguine Bond', max: 5,
            desc: '+15% Healing and +10% HP.',
            masteryPerk: 'While Blood Golem is active, your Life Steal is doubled.',
            mod: { healPct: 15, minionHp: 10 },
            icon: 'ra-blood'
        }
    ],
    iron_golem: [
        {
            id: 'ig_plating', name: 'Reinforced Plating', max: 5,
            desc: '+10% Armor and +20% Thorns damage.',
            masteryPerk: 'Iron Golem releases a metal shrapnel nova when hit.',
            mod: { minionArmor: 10, thornsPct: 20 },
            icon: 'ra-heavy-shield'
        }
    ],
    death_commander: [
        {
            id: 'dc_inspiring', name: 'Inspiring Death', max: 5,
            desc: '+10% Damage bonus and +2s duration.',
            masteryPerk: 'While active, minions are immune to all damage.',
            mod: { dmgBonus: 10, duration: 2 },
            icon: 'ra-crown'
        }
    ],
    fire_golem: [
        {
            id: 'fg_blaze', name: 'Inferno Golem', max: 5,
            desc: '+15% Fire damage and +10% Radius.',
            masteryPerk: 'Fire Golem explodes into a Fire Storm on death.',
            mod: { minionDmg: 15, radiusPct: 10 },
            icon: 'ra-large-fire'
        }
    ],
    army_of_dead: [
        {
            id: 'aod_horde', name: 'Eternal Horde', max: 5,
            desc: '+1 skeleton and +10s duration.',
            masteryPerk: 'Army of the Dead summons Elite variants of minions.',
            mod: { extraSkel: 1, duration: 10 },
            icon: 'ra-ghost'
        }
    ],
    teeth: [
        {
            id: 'tt_razor', name: 'Razor Teeth', max: 5,
            desc: '+20% Damage and +1 projectile.',
            masteryPerk: 'Teeth now pierce all targets.',
            mod: { pctDmg: 20, extraProj: 1 },
            icon: 'ra-bone-knife'
        }
    ],
    bone_spear: [
        {
            id: 'bs_splinter', name: 'Splintering', max: 5,
            desc: 'Spears split into 3 shards on impact.',
            masteryPerk: 'Each splinter applies a 20% Slow for 2s.',
            mod: { splinterCount: 3 },
            icon: 'ra-spear-head'
        },
        {
            id: 'bs_ossified', name: 'Ossified', max: 5,
            desc: '+15% Pierce Damage per level.',
            masteryPerk: 'Boomerang: Spears return to you, hitting enemies again for 50% damage.',
            mod: { pierceDmgPct: 15 },
            icon: 'ra-bone-knife'
        }
    ],
    poison_nova: [
        {
            id: 'pn_miasma', name: 'Toxic Miasma', max: 5,
            desc: '+15% Poison damage and +10% Radius.',
            masteryPerk: 'Poison Nova leaves a persistent cloud for 3s.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-poison-cloud'
        }
    ],
    bone_wall: [
        {
            id: 'bw_reinforce', name: 'Steel Bone', max: 5,
            desc: '+20% Wall HP and +1s duration.',
            masteryPerk: 'Bone Wall now deals damage to enemies touching it.',
            mod: { wallHpPct: 20, duration: 1 },
            icon: 'ra-stone-tower'
        }
    ],
    bone_armor: [
        {
            id: 'ba_calcified', name: 'Calcified Shield', max: 5,
            desc: '+50 Absorption per level.',
            masteryPerk: 'When Bone Armor breaks, it explodes into Teeth.',
            mod: { absorbPct: 50 },
            icon: 'ra-bone-knife'
        }
    ],
    poison_dagger: [
        {
            id: 'pd_infect', name: 'Deep Infection', max: 5,
            desc: '+20% Poison damage and +5% Crit chance.',
            masteryPerk: 'Poison Dagger strikes hit all enemies in a small cone.',
            mod: { pctDmg: 20, critChance: 5 },
            icon: 'ra-dripping-blade'
        }
    ],
    corpse_explosion: [
        {
            id: 'ce_vile', name: 'Vile Vapors', max: 5,
            desc: 'Explosion leaves a poison cloud for 3s.',
            masteryPerk: 'Poisoned enemies have a 20% chance to explode again on death.',
            mod: { poisonCloudDmg: 50 },
            icon: 'ra-poison-cloud'
        },
        {
            id: 'ce_blood', name: 'Blood Burst', max: 5,
            desc: '+20% Radius but -10% Damage.',
            masteryPerk: 'Heals you for 2% of your Maximum HP for every corpse consumed.',
            mod: { aoeRadiusPct: 20, pctDmg: -10 },
            icon: 'ra-blood'
        }
    ],
    bone_spirit: [
        {
            id: 'bs_vortex', name: 'Spirit Vortex', max: 5,
            desc: '+20% Damage and +10% Movement speed.',
            masteryPerk: 'Bone Spirit pulls nearby enemies toward it as it travels.',
            mod: { pctDmg: 20, speedPct: 10 },
            icon: 'ra-ghost'
        }
    ],
    weaken: [
        {
            id: 'wk_feeble', name: 'Total Feeble', max: 5,
            desc: '+5% damage reduction and +2s duration.',
            masteryPerk: 'Weakened enemies take 10% more damage from all sources.',
            mod: { dmgRedPct: 5, duration: 2 },
            icon: 'ra-health-decrease'
        }
    ],
    amplify_damage: [
        {
            id: 'ad_shatter', name: 'Brittle Bones', max: 5,
            desc: '+10% Damage bonus and +2s duration.',
            masteryPerk: 'Amplify Damage also reduces enemy armor by 50%.',
            mod: { dmgBonusPct: 10, duration: 2 },
            icon: 'ra-broken-shield'
        }
    ],
    decrepify: [
        {
            id: 'dec_slow', name: 'Eternal Decay', max: 5,
            desc: '+5% Slow and +2s duration.',
            masteryPerk: 'Decrepified enemies deal 20% less elemental damage.',
            mod: { slowPct: 5, duration: 2 },
            icon: 'ra-snail'
        }
    ],
    terror: [
        {
            id: 'tr_panic', name: 'Mass Panic', max: 5,
            desc: '+1s duration and +20% Radius.',
            masteryPerk: 'Enemies in Terror take shadow damage over time.',
            mod: { duration: 1, radiusPct: 20 },
            icon: 'ra-screaming'
        }
    ],
    iron_maiden: [
        {
            id: 'im_spikes', name: 'Razor Spikes', max: 5,
            desc: '+20% Reflect damage and +2s duration.',
            masteryPerk: 'Iron Maiden also reflects 20% of elemental damage.',
            mod: { reflectPct: 20, duration: 2 },
            icon: 'ra-crown-of-thorns'
        }
    ],
    confuse: [
        {
            id: 'con_dazed', name: 'Dazed and Confused', max: 5,
            desc: '+1s duration and +20% Radius.',
            masteryPerk: 'Confused enemies have 20% increased attack speed.',
            mod: { duration: 1, radiusPct: 20 },
            icon: 'ra-cycle'
        }
    ],
    life_tap_curse: [
        {
            id: 'lt_drain', name: 'Drain Essence', max: 5,
            desc: '+10% Healing and +2s duration.',
            masteryPerk: 'Life Tap also restores 5% Mana on hit.',
            mod: { healPct: 10, duration: 2 },
            icon: 'ra-heart-bottled'
        }
    ],
    revive_elite: [
        {
            id: 'rev_master', name: 'Necro Lord', max: 5,
            desc: '+20% servant damage and HP.',
            masteryPerk: 'You can now revive 2 monsters at once.',
            mod: { servantDmg: 20, servantHp: 20 },
            icon: 'ra-magic-portal'
        }
    ],
    lower_resist: [
        {
            id: 'lr_exposure', name: 'Total Exposure', max: 5,
            desc: '+2% resistance reduction and +2s duration.',
            masteryPerk: 'Lower Resist also increases critical strike chance against the target by 10%.',
            mod: { resRedPct: 2, duration: 2 },
            icon: 'ra-lightning-storm'
        }
    ],
    bone_prison: [
        {
            id: 'bp_fortress', name: 'Bone Fortress', max: 5,
            desc: '+20% Prison HP and +1s duration.',
            masteryPerk: 'Enemies trapped in Bone Prison take 10% max HP damage every 2s.',
            mod: { prisonHpPct: 20, duration: 1 },
            icon: 'ra-stone-tower'
        }
    ]
};
