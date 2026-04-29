export const WARRIOR_MUTATIONS = {
    // --- COMBAT TREE ---
    bash: [
        {
            id: 'bash_heavy', name: 'Heavy Impact', max: 5, reqBaseLevel: 1,
            desc: '+10% Damage and +5% Stun duration per level.',
            masteryPerk: 'Impact waves deal 30% damage to enemies behind the target.',
            mod: { pctDmg: 10, stunDuration: 0.1 },
            icon: 'ra-hammer-drop'
        },
        {
            id: 'bash_bleed', name: 'Internal Bleeding', max: 5, reqBaseLevel: 5,
            desc: 'Causes target to bleed for 50% damage over 3s.',
            masteryPerk: 'Bleeding enemies take 20% more damage from your other skills.',
            mod: { bleedDmg: 50, bleedDur: 3 },
            icon: 'ra-bleeding-hearts'
        }
    ],
    combat_mastery: [
        {
            id: 'cm_deadly', name: 'Deadly Precision', max: 5, reqBaseLevel: 1,
            desc: '+5% Critical Chance and +10% Crit Multi per level.',
            masteryPerk: 'Critical hits have a 10% chance to reset the cooldown of Execute.',
            mod: { critChance: 5, critMulti: 10 },
            icon: 'ra-deadly-strike'
        },
        {
            id: 'cm_tactician', name: 'Tactician', max: 5, reqBaseLevel: 5,
            desc: '+10% Block Chance and +5% Damage Reduction per level.',
            masteryPerk: 'Blocking an attack grants a 20% chance to counter-attack instantly.',
            mod: { blockChance: 10, drPct: 5 },
            icon: 'ra-shield'
        }
    ],
    bloodthirst: [
        {
            id: 'bt_vamp', name: 'Vampiric Thirst', max: 5, reqBaseLevel: 1,
            desc: '+2% Healing from Bloodthirst per level.',
            masteryPerk: 'If Bloodthirst kills an enemy, its cooldown is reset.',
            mod: { healPct: 2 },
            icon: 'ra-dripping-blade'
        },
        {
            id: 'bt_frenzy', name: 'Frenzied Strike', max: 5, reqBaseLevel: 5,
            desc: '+10% Attack Speed for 3s after using Bloodthirst.',
            masteryPerk: 'Bloodthirst now hits 2 additional nearby targets.',
            mod: { attackSpeedPct: 10 },
            icon: 'ra-fast-forward'
        }
    ],
    double_swing: [
        {
            id: 'ds_impact', name: 'Concussive Swings', max: 5, reqBaseLevel: 5,
            desc: '+5% chance to stun on each hit.',
            masteryPerk: 'If both hits stun, the target is stunned for double duration.',
            mod: { stunChance: 5 },
            icon: 'ra-double-team'
        },
        {
            id: 'ds_wind', name: 'Wind Shear', max: 5, reqBaseLevel: 10,
            desc: '+10% Damage to the second hit.',
            masteryPerk: 'Each hit releases a small wind blade toward a random enemy.',
            mod: { secondHitDmg: 10 },
            icon: 'ra-air-tight'
        }
    ],
    whirlwind: [
        {
            id: 'ww_radius', name: 'Expanding Reach', max: 5, reqBaseLevel: 5,
            desc: '+15% Whirlwind radius per level.',
            masteryPerk: 'Whirlwind projectiles: Every 1s, fire 2 wind blades at nearby enemies.',
            mod: { aoeRadiusPct: 15 },
            icon: 'ra-whirlwind'
        },
        {
            id: 'ww_fortress', name: 'Iron Spinner', max: 5, reqBaseLevel: 10,
            desc: '+5% Damage Reduction while spinning.',
            masteryPerk: 'You are immune to projectiles while Whirlwind is active.',
            mod: { spinDR: 5 },
            icon: 'ra-heavy-shield'
        }
    ],
    colossus_strike: [
        {
            id: 'cs_shatter', name: 'Armor Shatter', max: 5, reqBaseLevel: 10,
            desc: 'Reduces target armor by an additional 5% per level.',
            masteryPerk: 'Colossus Strike now hits all enemies in a small line.',
            mod: { armorShredPct: 5 },
            icon: 'ra-broken-shield'
        },
        {
            id: 'cs_weight', name: 'Titan Weight', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage per level.',
            masteryPerk: 'Knocks back all enemies hit and stuns them for 2s.',
            mod: { pctDmg: 20 },
            icon: 'ra-heavy-fall'
        }
    ],
    berserk: [
        {
            id: 'bz_unending', name: 'Unending Rage', max: 5, reqBaseLevel: 10,
            desc: '+1s Berserk duration per level.',
            masteryPerk: 'Kills while Berserk is active extend the duration by 1s.',
            mod: { duration: 1 },
            icon: 'ra-burning-embers'
        },
        {
            id: 'bz_fury', name: 'Furious Haste', max: 5, reqBaseLevel: 15,
            desc: '+5% Attack Speed while Berserk.',
            masteryPerk: 'During Berserk, your melee attacks have 20% chance to splash.',
            mod: { attackSpeedPct: 5 },
            icon: 'ra-lightning-trio'
        }
    ],
    execute: [
        {
            id: 'ex_cull', name: 'Cull the Weak', max: 5, reqBaseLevel: 15,
            desc: 'Execution threshold increased by 2% per level (up to 40% HP).',
            masteryPerk: 'Enemies killed by Execute explode for 10% of their max HP.',
            mod: { thresholdPct: 2 },
            icon: 'ra-skull'
        },
        {
            id: 'ex_momentum', name: 'Killing Spree', max: 5, reqBaseLevel: 20,
            desc: 'If Execute kills, gain +10% Damage for 5s.',
            masteryPerk: 'If Execute kills, the cooldown is reduced by 50%.',
            mod: { buffDmgPct: 10 },
            icon: 'ra-bloody-stash'
        }
    ],
    bladestorm: [
        {
            id: 'bs_hurricane', name: 'Hurricane', max: 5, reqBaseLevel: 20,
            desc: '+10% Bladestorm damage per level.',
            masteryPerk: 'Bladestorm pulls all nearby enemies toward you.',
            mod: { pctDmg: 10 },
            icon: 'ra-cyclone'
        },
        {
            id: 'bs_blades', name: 'Dancing Blades', max: 5, reqBaseLevel: 25,
            desc: '+1 hit per second during Bladestorm.',
            masteryPerk: 'Each hit has a 10% chance to cast a free Whirlwind.',
            mod: { hitsPerSec: 1 },
            icon: 'ra-split-body'
        }
    ],
    mortal_strike: [
        {
            id: 'ms_wound', name: 'Deep Wounds', max: 5, reqBaseLevel: 15,
            desc: '+10% Damage and +1s anti-heal duration.',
            masteryPerk: 'Mortal Strike reduces target damage dealt by 20%.',
            mod: { pctDmg: 10, duration: 1 },
            icon: 'ra-bleeding-hearts'
        },
        {
            id: 'ms_execute', name: 'Fatal Blow', max: 5, reqBaseLevel: 20,
            desc: '+15% Damage and +5% Crit Chance for Mortal Strike.',
            masteryPerk: 'Mortal Strike deals double damage to targets below 30% Health.',
            mod: { pctDmg: 15, critChance: 5 },
            icon: 'ra-deadly-strike'
        }
    ],
    overpower: [
        {
            id: 'op_relentless', name: 'Relentless', max: 5, reqBaseLevel: 15,
            desc: '+10% Overpower damage per level.',
            masteryPerk: 'Overpower now grants 100% chance to crit for 2s.',
            mod: { pctDmg: 10 },
            icon: 'ra-muscle-fat'
        },
        {
            id: 'op_crushing', name: 'Crushing Might', max: 5, reqBaseLevel: 20,
            desc: '+20% Damage and +10% Stun Chance per level.',
            masteryPerk: 'Overpower now ignores 50% of the target\'s armor.',
            mod: { pctDmg: 20, stunChance: 10 },
            icon: 'ra-heavy-fall'
        }
    ],

    // --- DEFENSE TREE ---
    shield_bash: [
        {
            id: 'sb_impact', name: 'Wallop', max: 5, reqBaseLevel: 1,
            desc: '+10% Damage and +0.2s stun duration.',
            masteryPerk: 'Shield Bash hits all enemies in a cone.',
            mod: { pctDmg: 10, stunDuration: 0.2 },
            icon: 'ra-heavy-shield'
        },
        {
            id: 'sb_vanguard', name: 'Shield Charge', max: 5, reqBaseLevel: 5,
            desc: '+15% Damage and +10% Knockback distance.',
            masteryPerk: 'Shield Bash now rushes you forward to the target.',
            mod: { pctDmg: 15, knockbackPct: 10 },
            icon: 'ra-forward-field'
        }
    ],
    iron_skin: [
        {
            id: 'is_plate', name: 'Layered Plate', max: 5, reqBaseLevel: 1,
            desc: '+5% Armor and +2% All Resistance per level.',
            masteryPerk: 'Iron Skin grants immunity to bleed effects.',
            mod: { pctArmor: 5, allRes: 2 },
            icon: 'ra-shield'
        },
        {
            id: 'is_reflection', name: 'Spiked Armor', max: 5, reqBaseLevel: 5,
            desc: '+10% Damage Reflected and +5% Armor per level.',
            masteryPerk: 'Attacking enemies have a 15% chance to be inflicted with Bleed.',
            mod: { reflectPct: 10, pctArmor: 5 },
            icon: 'ra-dripping-blade'
        }
    ],
    spell_reflection: [
        {
            id: 'sr_mirror', name: 'Mirror Shield', max: 5, reqBaseLevel: 5,
            desc: '+1 reflected spell per level.',
            masteryPerk: 'Reflected spells deal 100% increased damage to the caster.',
            mod: { maxReflects: 1 },
            icon: 'ra-bolt-shield'
        },
        {
            id: 'sr_nullify', name: 'Arcane Void', max: 5, reqBaseLevel: 10,
            desc: '+10% Magic Resistance and -5% Magic Damage taken.',
            masteryPerk: 'Reflecting a spell restores 5% of your maximum Mana.',
            mod: { magicRes: 10, magicDrPct: 5 },
            icon: 'ra-void'
        }
    ],
    block_mastery: [
        {
            id: 'bm_shield', name: 'Unyielding Wall', max: 5, reqBaseLevel: 5,
            desc: '+3% Block chance per level.',
            masteryPerk: 'Blocked attacks restore 1% of your maximum health.',
            mod: { blockChance: 3 },
            icon: 'ra-shield'
        },
        {
            id: 'bm_retaliation', name: 'Perfect Parry', max: 5, reqBaseLevel: 10,
            desc: '+5% Parry Chance and +10% Counter-Attack damage.',
            masteryPerk: 'Parrying an attack makes your next skill cast free.',
            mod: { parryChance: 5, counterDmgPct: 10 },
            icon: 'ra-duel'
        }
    ],
    revenge: [
        {
            id: 'rv_retribution', name: 'Retribution', max: 5, reqBaseLevel: 10,
            desc: '+15% Revenge damage per level.',
            masteryPerk: 'Revenge can now trigger without a block (10% chance on hit taken).',
            mod: { pctDmg: 15 },
            icon: 'ra-heavy-fall'
        },
        {
            id: 'rv_bloodshed', name: 'Bloody Retribution', max: 5, reqBaseLevel: 15,
            desc: '+10% Life Steal on Revenge hits and +5% Damage.',
            masteryPerk: 'Revenge now causes all enemies hit to explode on death for 5s.',
            mod: { lifeSteal: 10, pctDmg: 5 },
            icon: 'ra-bomb-explosion'
        }
    ],
    taunt: [
        {
            id: 'tt_bellow', name: 'Mighty Bellow', max: 5, reqBaseLevel: 5,
            desc: '+1s duration and +10% armor bonus.',
            masteryPerk: 'Enemies taunted also deal 20% less damage to everyone.',
            mod: { duration: 1, armorPct: 10 },
            icon: 'ra-megaphone'
        },
        {
            id: 'tt_dominance', name: 'Challenger\'s Aura', max: 5, reqBaseLevel: 10,
            desc: '+15% Radius and +10% Armor while Taunt is active.',
            masteryPerk: 'Taunted enemies take 20% increased damage from all sources.',
            mod: { radiusPct: 15, armorPct: 10 },
            icon: 'ra-aura'
        }
    ],
    fortify: [
        {
            id: 'ft_bulwark', name: 'Living Bulwark', max: 5, reqBaseLevel: 10,
            desc: '+5% Damage Reduction per level.',
            masteryPerk: 'While Fortify is active, you are immune to all debuffs.',
            mod: { drPct: 5 },
            icon: 'ra-castle-flag'
        },
        {
            id: 'ft_endurance', name: 'Unstoppable Will', max: 5, reqBaseLevel: 15,
            desc: '+10% Tenacity and +5% Health per level.',
            masteryPerk: 'While Fortified, you regenerate 2% of your Max HP every second.',
            mod: { tenacityPct: 10, pctHp: 5 },
            icon: 'ra-heart-towers'
        }
    ],
    vanguard: [
        {
            id: 'va_aura', name: 'Guardian Presence', max: 5, reqBaseLevel: 10,
            desc: '+2% party DR and +5% party Damage per level.',
            masteryPerk: 'Vanguard also grants +10% All Resistance to nearby allies.',
            mod: { partyDr: 2, partyDmg: 5 },
            icon: 'ra-angel-wings'
        },
        {
            id: 'va_bastion', name: 'Iron Bastion', max: 5, reqBaseLevel: 15,
            desc: '+5% Block Chance for the party and +10% Armor.',
            masteryPerk: 'Vanguard now creates a zone that reduces projectile damage by 50%.',
            mod: { partyBlock: 5, partyArmor: 10 },
            icon: 'ra-tower'
        }
    ],
    last_stand: [
        {
            id: 'ls_resilience', name: 'Resilience', max: 5, reqBaseLevel: 15,
            desc: '+10% Shield value and +2s duration.',
            masteryPerk: 'Last Stand cooldown is reduced by 30s.',
            mod: { shieldPct: 10, duration: 2 },
            icon: 'ra-angel-wings'
        },
        {
            id: 'ls_undying', name: 'Eternal Warrior', max: 5, reqBaseLevel: 20,
            desc: '+15% Healing received and +5s duration.',
            masteryPerk: 'If you would die during Last Stand, you are healed for 30% Max HP instead (once per cast).',
            mod: { healReceivedPct: 15, duration: 5 },
            icon: 'ra-angel-wings'
        }
    ],
    second_wind: [
        {
            id: 'sw_breath', name: 'Deep Breath', max: 5, reqBaseLevel: 15,
            desc: '+1% HP regen per second while low health.',
            masteryPerk: 'Second Wind also grants +20% Movement Speed.',
            mod: { regenPct: 1 },
            icon: 'ra-sun-glow'
        },
        {
            id: 'sw_recovery', name: 'Adrenaline Rush', max: 5, reqBaseLevel: 20,
            desc: '+10% Attack Speed and +5% Damage while active.',
            masteryPerk: 'Second Wind instantly removes all crowd control effects on activation.',
            mod: { attackSpeedPct: 10, dmgPct: 5 },
            icon: 'ra-lightning-trio'
        }
    ],
    ignore_pain: [
        {
            id: 'ip_toughness', name: 'Tough It Out', max: 5, reqBaseLevel: 20,
            desc: '+100 Absorption cap per level.',
            masteryPerk: '50% of damage absorbed by Ignore Pain is converted to healing.',
            mod: { absorbCap: 100 },
            icon: 'ra-shield'
        },
        {
            id: 'ip_defiance', name: 'Numbed Senses', max: 5, reqBaseLevel: 25,
            desc: '-10% Damage taken from Elites and +5% Armor.',
            masteryPerk: 'Ignore Pain now reflects 30% of all absorbed damage back to the attacker.',
            mod: { eliteDrPct: 10, pctArmor: 5 },
            icon: 'ra-broken-shield'
        }
    ],

    // --- BATTLE TREE ---
    warcry: [
        {
            id: 'wc_inspiration', name: 'Inspiration', max: 5, reqBaseLevel: 1,
            desc: '+5% Attack Speed bonus and +5s duration.',
            masteryPerk: 'Warcry also grants +10% Movement Speed.',
            mod: { attackSpeedPct: 5, duration: 5 },
            icon: 'ra-trumpet'
        },
        {
            id: 'wc_terror', name: 'Terrifying Shout', max: 5, reqBaseLevel: 5,
            desc: 'Enemies take +10% Damage and are slowed by 15%.',
            masteryPerk: 'Warcry now has a 25% chance to Fear nearby enemies for 2s.',
            mod: { enemyDmgTakenPct: 10, slowPct: 15 },
            icon: 'ra-ghost'
        }
    ],
    shout: [
        {
            id: 'sh_echo', name: 'Echoing Shout', max: 5, reqBaseLevel: 1,
            desc: '+10% Armor bonus and +5s duration.',
            masteryPerk: 'Shout also grants +10% Health and Mana.',
            mod: { armorPct: 10, duration: 5 },
            icon: 'ra-loudly'
        },
        {
            id: 'sh_fortitude', name: 'Unwavering Shout', max: 5, reqBaseLevel: 5,
            desc: '+10% Resistance to all elements and +5s duration.',
            masteryPerk: 'Shout now grants a shield equal to 15% of your Max HP to all allies.',
            mod: { allRes: 10, duration: 5 },
            icon: 'ra-shield'
        }
    ],
    leap_attack: [
        {
            id: 'la_crush', name: 'Crushing Landing', max: 5, reqBaseLevel: 5,
            desc: '+15% Damage and +5% Stun chance.',
            masteryPerk: 'Leap Attack creates a shockwave that deals 50% damage.',
            mod: { pctDmg: 15, stunChance: 5 },
            icon: 'ra-boots'
        },
        {
            id: 'la_impact', name: 'Meteor Jump', max: 5, reqBaseLevel: 10,
            desc: '+20% Damage and +15% AoE Radius.',
            masteryPerk: 'Leap Attack now leaves a trail of fire that deals 20% damage per second.',
            mod: { pctDmg: 20, aoeRadiusPct: 15 },
            icon: 'ra-burning-meteor'
        }
    ],
    battle_orders: [
        {
            id: 'bo_vitality', name: 'Vitality', max: 5, reqBaseLevel: 10,
            desc: '+2% HP/MP bonus and +10s duration.',
            masteryPerk: 'Battle Orders also grants +10% All Resistances.',
            mod: { hpmpPct: 2, duration: 10 },
            icon: 'ra-health'
        },
        {
            id: 'bo_command', name: 'General\'s Command', max: 5, reqBaseLevel: 15,
            desc: '+5% Damage and +5% Critical Chance for the party.',
            masteryPerk: 'Battle Orders now grants 10% Cooldown Reduction to all party members.',
            mod: { partyDmg: 5, partyCrit: 5 },
            icon: 'ra-queen-crown'
        }
    ],
    shockwave: [
        {
            id: 'sw_impact', name: 'Sonic Boom', max: 5, reqBaseLevel: 10,
            desc: '+15% Damage and +0.5s stun.',
            masteryPerk: 'Shockwave deals triple damage to shields and barriers.',
            mod: { pctDmg: 15, stunDuration: 0.5 },
            icon: 'ra-wave'
        },
        {
            id: 'sw_resonance', name: 'Tectonic Shift', max: 5, reqBaseLevel: 15,
            desc: '+10% Radius and +10% Slow duration.',
            masteryPerk: 'Shockwave now triggers a second, smaller pulse after 1s.',
            mod: { radiusPct: 10, slowDuration: 10 },
            icon: 'ra-split-body'
        }
    ],
    slam: [
        {
            id: 'sl_quakes', name: 'Earthquakes', max: 5, reqBaseLevel: 15,
            desc: '+15% Damage and +10% AoE size.',
            masteryPerk: 'Ground Slam leaves the ground trembling, slowing enemies.',
            mod: { pctDmg: 15, sizePct: 10 },
            icon: 'ra-mountains'
        },
        {
            id: 'sl_impact', name: 'Heavyweight Slam', max: 5, reqBaseLevel: 20,
            desc: '+20% Damage and +10% Knockback.',
            masteryPerk: 'Slam now creates 3 smaller quakes that move outward.',
            mod: { pctDmg: 20, knockbackPct: 10 },
            icon: 'ra-cracks'
        }
    ],
    shattering_throw: [
        {
            id: 'st_pierce', name: 'Armor Piercer', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage and reduces armor by 10%.',
            masteryPerk: 'Shattering Throw pierces all enemies in its path.',
            mod: { pctDmg: 20, armorShred: 10 },
            icon: 'ra-spear-head'
        },
        {
            id: 'st_rend', name: 'Lacerating Spear', max: 5, reqBaseLevel: 20,
            desc: 'Causes targets to bleed for 40% damage over 4s.',
            masteryPerk: 'Enemies hit by Shattering Throw have their healing reduced by 80% for 5s.',
            mod: { bleedDmg: 40, bleedDur: 4 },
            icon: 'ra-dripping-blade'
        }
    ],
    blood_rage: [
        {
            id: 'br_frenzy', name: 'Blood Frenzy', max: 5, reqBaseLevel: 15,
            desc: '+5% Damage and -1% HP cost.',
            masteryPerk: 'While in Blood Rage, you gain 5% Life Steal.',
            mod: { dmgPct: 5, hpCostRed: 1 },
            icon: 'ra-drop'
        },
        {
            id: 'br_overflow', name: 'Sanguine Overflow', max: 5, reqBaseLevel: 20,
            desc: '+10% Damage and +5% Crit Multi.',
            masteryPerk: 'While in Blood Rage, you release a nova of blood every 3s dealing 50% damage.',
            mod: { dmgPct: 10, critMulti: 5 },
            icon: 'ra-bubbles'
        }
    ],
    piercing_howl: [
        {
            id: 'ph_terror', name: 'Terror', max: 5, reqBaseLevel: 15,
            desc: '+10% Slow and -5% Enemy Armor.',
            masteryPerk: 'Enemies howled at have 10% chance to Flee.',
            mod: { slowPct: 10, armorShred: 5 },
            icon: 'ra-wolf-howl'
        },
        {
            id: 'ph_weakness', name: 'Crippling Howl', max: 5, reqBaseLevel: 20,
            desc: 'Enemies deal 10% less damage and are slowed by 10%.',
            masteryPerk: 'Piercing Howl now roots all enemies in place for 1.5s.',
            mod: { enemyDmgRed: 10, slowPct: 10 },
            icon: 'ra-hand'
        }
    ],
    avatar_of_war: [
        {
            id: 'aw_titan', name: 'Titan', max: 5, reqBaseLevel: 20,
            desc: '+10% Damage and +2s duration.',
            masteryPerk: 'While in Avatar form, you are immune to all CC.',
            mod: { dmgPct: 10, duration: 2 },
            icon: 'ra-large-hammer'
        },
        {
            id: 'aw_fury', name: 'Avatar of Fury', max: 5, reqBaseLevel: 25,
            desc: '+15% Attack Speed and +10% Fire Damage.',
            masteryPerk: 'During Avatar form, every attack releases a Fire Nova.',
            mod: { attackSpeedPct: 15, fireDmgPct: 10 },
            icon: 'ra-burning-embers'
        }
    ],
    heroic_leap: [
        {
            id: 'hl_comet', name: 'Comet', max: 5, reqBaseLevel: 20,
            desc: '+15% Damage and +10% Radius.',
            masteryPerk: 'Heroic Leap leaves a crater that traps enemies.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-falling-hazard'
        },
        {
            id: 'hl_thunder', name: 'Thunderous Leap', max: 5, reqBaseLevel: 25,
            desc: '+15% Damage and 20% Lightning Damage.',
            masteryPerk: 'Heroic Leap now calls down lightning bolts on up to 5 nearby enemies.',
            mod: { pctDmg: 15, lightningDmgPct: 20 },
            icon: 'ra-lightning-storm'
        }
    ],
    titanic_might: [
        {
            id: 'tm_godly', name: 'Godly Strength', max: 5, reqBaseLevel: 30,
            desc: '+5% Strength and +2% total Armor per level.',
            masteryPerk: 'Titanic Might reduces weapon attack speed penalty by 20%.',
            mod: { pctStr: 5, pctArmor: 2 },
            icon: 'ra-muscle-fat'
        },
        {
            id: 'tm_colossal', name: 'Colossal Force', max: 5, reqBaseLevel: 35,
            desc: '+10% Physical Damage and +5% Stun Chance.',
            masteryPerk: 'Titanic Might now increases your melee range by 50%.',
            mod: { physDmgPct: 10, stunChance: 5 },
            icon: 'ra-expand'
        }
    ]
};
