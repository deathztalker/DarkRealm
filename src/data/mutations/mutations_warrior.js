export const WARRIOR_MUTATIONS = {
    bash: [
        {
            id: 'bash_heavy', name: 'Heavy Impact', max: 5,
            desc: '+10% Damage and +5% Stun duration per level.',
            masteryPerk: 'Impact waves deal 30% damage to enemies behind the target.',
            mod: { pctDmg: 10, stunDuration: 0.1 },
            icon: 'ra-hammer-drop'
        },
        {
            id: 'bash_bleed', name: 'Internal Bleeding', max: 5,
            desc: 'Causes target to bleed for 50% damage over 3s.',
            masteryPerk: 'Bleeding enemies take 20% more damage from your other skills.',
            mod: { bleedDmg: 50, bleedDur: 3 },
            icon: 'ra-bleeding-hearts'
        }
    ],
    bloodthirst: [
        {
            id: 'bt_vamp', name: 'Vampiric Thirst', max: 5,
            desc: '+2% Healing from Bloodthirst per level.',
            masteryPerk: 'If Bloodthirst kills an enemy, its cooldown is reset.',
            mod: { healPct: 2 },
            icon: 'ra-dripping-blade'
        },
        {
            id: 'bt_frenzy', name: 'Frenzied Strike', max: 5,
            desc: '+10% Attack Speed for 3s after using Bloodthirst.',
            masteryPerk: 'Bloodthirst now hits 2 additional nearby targets.',
            mod: { attackSpeedPct: 10 },
            icon: 'ra-fast-forward'
        }
    ],
    double_swing: [
        {
            id: 'ds_impact', name: 'Concussive Swings', max: 5,
            desc: '+5% chance to stun on each hit.',
            masteryPerk: 'If both hits stun, the target is stunned for double duration.',
            mod: { stunChance: 5 },
            icon: 'ra-double-team'
        },
        {
            id: 'ds_wind', name: 'Wind Shear', max: 5,
            desc: '+10% Damage to the second hit.',
            masteryPerk: 'Each hit releases a small wind blade toward a random enemy.',
            mod: { secondHitDmg: 10 },
            icon: 'ra-air-tight'
        }
    ],
    whirlwind: [
        {
            id: 'ww_radius', name: 'Expanding Reach', max: 5,
            desc: '+15% Whirlwind radius per level.',
            masteryPerk: 'Whirlwind projectiles: Every 1s, fire 2 wind blades at nearby enemies.',
            mod: { aoeRadiusPct: 15 },
            icon: 'ra-whirlwind'
        },
        {
            id: 'ww_fortress', name: 'Iron Spinner', max: 5,
            desc: '+5% Damage Reduction while spinning.',
            masteryPerk: 'You are immune to projectiles while Whirlwind is active.',
            mod: { spinDR: 5 },
            icon: 'ra-heavy-shield'
        }
    ],
    colossus_strike: [
        {
            id: 'cs_shatter', name: 'Armor Shatter', max: 5,
            desc: 'Reduces target armor by an additional 5% per level.',
            masteryPerk: 'Colossus Strike now hits all enemies in a small line.',
            mod: { armorShredPct: 5 },
            icon: 'ra-broken-shield'
        },
        {
            id: 'cs_weight', name: 'Titan Weight', max: 5,
            desc: '+20% Damage per level.',
            masteryPerk: 'Knocks back all enemies hit and stuns them for 2s.',
            mod: { pctDmg: 20 },
            icon: 'ra-heavy-fall'
        }
    ],
    berserk: [
        {
            id: 'bz_unending', name: 'Unending Rage', max: 5,
            desc: '+1s Berserk duration per level.',
            masteryPerk: 'Kills while Berserk is active extend the duration by 1s.',
            mod: { duration: 1 },
            icon: 'ra-burning-embers'
        },
        {
            id: 'bz_fury', name: 'Furious Haste', max: 5,
            desc: '+5% Attack Speed while Berserk.',
            masteryPerk: 'During Berserk, your melee attacks have 20% chance to splash.',
            mod: { attackSpeedPct: 5 },
            icon: 'ra-lightning-trio'
        }
    ],
    execute: [
        {
            id: 'ex_cull', name: 'Cull the Weak', max: 5,
            desc: 'Execution threshold increased by 2% per level (up to 40% HP).',
            masteryPerk: 'Enemies killed by Execute explode for 10% of their max HP.',
            mod: { thresholdPct: 2 },
            icon: 'ra-skull'
        },
        {
            id: 'ex_momentum', name: 'Killing Spree', max: 5,
            desc: 'If Execute kills, gain +10% Damage for 5s.',
            masteryPerk: 'If Execute kills, the cooldown is reduced by 50%.',
            mod: { buffDmgPct: 10 },
            icon: 'ra-bloody-stash'
        }
    ],
    bladestorm: [
        {
            id: 'bs_hurricane', name: 'Hurricane', max: 5,
            desc: '+10% Bladestorm damage per level.',
            masteryPerk: 'Bladestorm pulls all nearby enemies toward you.',
            mod: { pctDmg: 10 },
            icon: 'ra-cyclone'
        },
        {
            id: 'bs_blades', name: 'Dancing Blades', max: 5,
            desc: '+1 hit per second during Bladestorm.',
            masteryPerk: 'Each hit has a 10% chance to cast a free Whirlwind.',
            mod: { hitsPerSec: 1 },
            icon: 'ra-split-body'
        }
    ],
    mortal_strike: [
        {
            id: 'ms_wound', name: 'Deep Wounds', max: 5,
            desc: '+10% Damage and +1s anti-heal duration.',
            masteryPerk: 'Mortal Strike reduces target damage dealt by 20%.',
            mod: { pctDmg: 10, duration: 1 },
            icon: 'ra-bleeding-hearts'
        }
    ],
    overpower: [
        {
            id: 'op_relentless', name: 'Relentless', max: 5,
            desc: '+10% Overpower damage per level.',
            masteryPerk: 'Overpower now grants 100% chance to crit for 2s.',
            mod: { pctDmg: 10 },
            icon: 'ra-muscle-fat'
        }
    ],
    shield_bash: [
        {
            id: 'sb_impact', name: 'Wallop', max: 5,
            desc: '+10% Damage and +0.2s stun duration.',
            masteryPerk: 'Shield Bash hits all enemies in a cone.',
            mod: { pctDmg: 10, stunDuration: 0.2 },
            icon: 'ra-heavy-shield'
        }
    ],
    spell_reflection: [
        {
            id: 'sr_mirror', name: 'Mirror Shield', max: 5,
            desc: '+1 reflected spell per level.',
            masteryPerk: 'Reflected spells deal 100% increased damage to the caster.',
            mod: { maxReflects: 1 },
            icon: 'ra-bolt-shield'
        }
    ],
    revenge: [
        {
            id: 'rv_retribution', name: 'Retribution', max: 5,
            desc: '+15% Revenge damage per level.',
            masteryPerk: 'Revenge can now trigger without a block (10% chance on hit taken).',
            mod: { pctDmg: 15 },
            icon: 'ra-heavy-fall'
        }
    ],
    taunt: [
        {
            id: 'tt_bellow', name: 'Mighty Bellow', max: 5,
            desc: '+1s duration and +10% armor bonus.',
            masteryPerk: 'Enemies taunted also deal 20% less damage to everyone.',
            mod: { duration: 1, armorPct: 10 },
            icon: 'ra-megaphone'
        }
    ],
    fortify: [
        {
            id: 'ft_bulwark', name: 'Living Bulwark', max: 5,
            desc: '+5% Damage Reduction per level.',
            masteryPerk: 'While Fortify is active, you are immune to all debuffs.',
            mod: { drPct: 5 },
            icon: 'ra-castle-flag'
        }
    ],
    last_stand: [
        {
            id: 'ls_resilience', name: 'Resilience', max: 5,
            desc: '+10% Shield value and +2s duration.',
            masteryPerk: 'Last Stand cooldown is reduced by 30s.',
            mod: { shieldPct: 10, duration: 2 },
            icon: 'ra-angel-wings'
        }
    ],
    ignore_pain: [
        {
            id: 'ip_toughness', name: 'Tough It Out', max: 5,
            desc: '+100 Absorption cap per level.',
            masteryPerk: '50% of damage absorbed by Ignore Pain is converted to healing.',
            mod: { absorbCap: 100 },
            icon: 'ra-shield'
        }
    ],
    warcry: [
        {
            id: 'wc_inspiration', name: 'Inspiration', max: 5,
            desc: '+5% Attack Speed bonus and +5s duration.',
            masteryPerk: 'Warcry also grants +10% Movement Speed.',
            mod: { attackSpeedPct: 5, duration: 5 },
            icon: 'ra-trumpet'
        }
    ],
    shout: [
        {
            id: 'sh_echo', name: 'Echoing Shout', max: 5,
            desc: '+10% Armor bonus and +5s duration.',
            masteryPerk: 'Shout also grants +10% Health and Mana.',
            mod: { armorPct: 10, duration: 5 },
            icon: 'ra-loudly'
        }
    ],
    leap_attack: [
        {
            id: 'la_crush', name: 'Crushing Landing', max: 5,
            desc: '+15% Damage and +5% Stun chance.',
            masteryPerk: 'Leap Attack creates a shockwave that deals 50% damage.',
            mod: { pctDmg: 15, stunChance: 5 },
            icon: 'ra-boots'
        }
    ],
    battle_orders: [
        {
            id: 'bo_vitality', name: 'Vitality', max: 5,
            desc: '+2% HP/MP bonus and +10s duration.',
            masteryPerk: 'Battle Orders also grants +10% All Resistances.',
            mod: { hpmpPct: 2, duration: 10 },
            icon: 'ra-health'
        }
    ],
    shockwave: [
        {
            id: 'sw_impact', name: 'Sonic Boom', max: 5,
            desc: '+15% Damage and +0.5s stun.',
            masteryPerk: 'Shockwave deals triple damage to shields and barriers.',
            mod: { pctDmg: 15, stunDuration: 0.5 },
            icon: 'ra-wave'
        }
    ],
    slam: [
        {
            id: 'sl_quakes', name: 'Earthquakes', max: 5,
            desc: '+15% Damage and +10% AoE size.',
            masteryPerk: 'Ground Slam leaves the ground trembling, slowing enemies.',
            mod: { pctDmg: 15, sizePct: 10 },
            icon: 'ra-mountains'
        }
    ],
    shattering_throw: [
        {
            id: 'st_pierce', name: 'Armor Piercer', max: 5,
            desc: '+20% Damage and reduces armor by 10%.',
            masteryPerk: 'Shattering Throw pierces all enemies in its path.',
            mod: { pctDmg: 20, armorShred: 10 },
            icon: 'ra-spear-head'
        }
    ],
    blood_rage: [
        {
            id: 'br_frenzy', name: 'Blood Frenzy', max: 5,
            desc: '+5% Damage and -1% HP cost.',
            masteryPerk: 'While in Blood Rage, you gain 5% Life Steal.',
            mod: { dmgPct: 5, hpCostRed: 1 },
            icon: 'ra-drop'
        }
    ],
    piercing_howl: [
        {
            id: 'ph_terror', name: 'Terror', max: 5,
            desc: '+10% Slow and -5% Enemy Armor.',
            masteryPerk: 'Enemies howled at have 10% chance to Flee.',
            mod: { slowPct: 10, armorShred: 5 },
            icon: 'ra-wolf-howl'
        }
    ],
    avatar_of_war: [
        {
            id: 'aw_titan', name: 'Titan', max: 5,
            desc: '+10% Damage and +2s duration.',
            masteryPerk: 'While in Avatar form, you are immune to all CC.',
            mod: { dmgPct: 10, duration: 2 },
            icon: 'ra-large-hammer'
        }
    ],
    heroic_leap: [
        {
            id: 'hl_comet', name: 'Comet', max: 5,
            desc: '+15% Damage and +10% Radius.',
            masteryPerk: 'Heroic Leap leaves a crater that traps enemies.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-falling-hazard'
        }
    ]
};
