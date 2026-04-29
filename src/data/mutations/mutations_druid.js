export const DRUID_MUTATIONS = {
    // --- SHAPESHIFTING TREE ---
    dire_wolf: [
        {
            id: 'dw_ferocity', name: 'Alpha Ferocity', max: 5, reqBaseLevel: 1,
            desc: '+10% Attack Speed and +5% Crit Chance while transformed.',
            masteryPerk: 'Wolf Form attacks have a 20% chance to cause target to flee for 2s.',
            mod: { pctIAS: 10, critChance: 5 },
            icon: 'ra-wolf-howl'
        },
        {
            id: 'dw_bloodthirst', name: 'Vampiric Instinct', max: 5, reqBaseLevel: 5,
            desc: '+4% Life Steal and +10% Movement Speed in Wolf Form.',
            masteryPerk: 'Every 4th attack in Wolf Form triggers a free, mini-Shred on the target.',
            mod: { lifeSteal: 4, moveSpeedPct: 10 },
            icon: 'ra-droplet'
        }
    ],
    bear_form: [
        {
            id: 'bf_iron_hide', name: 'Grizzly Skin', max: 5, reqBaseLevel: 1,
            desc: '+20% Armor and +15% Health while transformed.',
            masteryPerk: 'Bear Form attacks have high knockback and stun for 0.5s.',
            mod: { pctArmor: 20, pctHP: 15 },
            icon: 'ra-bear-head'
        },
        {
            id: 'bf_unstoppable', name: 'Mountain Bulwark', max: 5, reqBaseLevel: 5,
            desc: 'Reduces duration of crowd control effects by 10% per level.',
            masteryPerk: 'While in Bear Form, you are completely immune to knockback and displacement.',
            mod: { ccRedPct: 10 },
            icon: 'ra-shield'
        }
    ],
    feral_mastery: [
        {
            id: 'fm_primal', name: 'Primal Instinct', max: 5, reqBaseLevel: 1,
            desc: '+5% Damage and +2% Crit Chance while shapeshifted.',
            masteryPerk: 'Shapeshifting has a 10% chance to reset the cooldown of Maul or Shred.',
            mod: { pctDmg: 5, critChance: 2 },
            icon: 'ra-lion'
        },
        {
            id: 'fm_wildheart', name: 'Wildheart Sprinter', max: 5, reqBaseLevel: 5,
            desc: '+5% Movement Speed and +10% Stamina recovery while shapeshifted.',
            masteryPerk: 'Exiting a shapeshifted form grants a 20% Attack Speed bonus for 3 seconds.',
            mod: { moveSpeedPct: 5, staminaRegen: 10 },
            icon: 'ra-fast-forward'
        }
    ],
    maul: [
        {
            id: 'ma_heavy', name: 'Heavy Swipe', max: 5, reqBaseLevel: 5,
            desc: '+15% Damage and +0.2s stun duration.',
            masteryPerk: 'Maul generates 1 stack of Feral Rage on hit.',
            mod: { pctDmg: 15, stunDur: 0.2 },
            icon: 'ra-bear-head'
        },
        {
            id: 'ma_brutal', name: 'Brutal Force', max: 5, reqBaseLevel: 10,
            desc: 'Maul deals 20% bonus damage to stunned enemies.',
            masteryPerk: 'Maul hits have a 20% chance to refresh the duration of Bear Form.',
            mod: { stunSynergyDmg: 20 },
            icon: 'ra-hammer-drop'
        }
    ],
    shred: [
        {
            id: 'sh_tear', name: 'Rip and Tear', max: 5, reqBaseLevel: 5,
            desc: '+15% Damage and applies a bleed for 3s.',
            masteryPerk: 'Shred deals 50% more damage to bleeding enemies.',
            mod: { pctDmg: 15, bleedDmg: 20 },
            icon: 'ra-dripping-blade'
        },
        {
            id: 'sh_frenzy', name: 'Shredding Frenzy', max: 5, reqBaseLevel: 10,
            desc: 'Each Shred hit builds a stack of Frenzy, granting +5% Attack Speed (max 5 stacks).',
            masteryPerk: 'Shred has no cooldown if used on a target with less than 20% Health.',
            mod: { stackIas: 5 },
            icon: 'ra-lightning-trio'
        }
    ],
    bear_slam: [
        {
            id: 'bs_shockwave', name: 'Seismic Shock', max: 5, reqBaseLevel: 10,
            desc: '+15% Damage and +10% AoE radius.',
            masteryPerk: 'Bear Slam leaves the ground trembling, slowing enemies for 3s.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-waves-pulse'
        },
        {
            id: 'bs_earthquake', name: 'Crust Breaker', max: 5, reqBaseLevel: 15,
            desc: 'Bear Slam triggers a second, smaller shockwave for 50% damage.',
            masteryPerk: 'Bear Slam also stuns all non-boss enemies hit for 1 second.',
            mod: { echoDmg: 50 },
            icon: 'ra-volcano'
        }
    ],
    lacerate: [
        {
            id: 'la_open_wound', name: 'Deep Laceration', max: 5, reqBaseLevel: 10,
            desc: '+20% Bleed damage per level.',
            masteryPerk: 'Lacerate reduces target healing received by 50% for 5s.',
            mod: { bleedDmgPct: 20 },
            icon: 'ra-dripping-blade'
        },
        {
            id: 'la_bloodfest', name: 'Sanguine Feast', max: 5, reqBaseLevel: 15,
            desc: 'Heal for 10% of all bleed damage dealt by Lacerate.',
            masteryPerk: 'Lacerate spreads to 1 nearby enemy if the primary target is already bleeding.',
            mod: { bleedLeech: 10 },
            icon: 'ra-droplet'
        }
    ],
    rabies: [
        {
            id: 'rb_contagion', name: 'Toxic Contagion', max: 5, reqBaseLevel: 10,
            desc: 'Poison spreads 20% faster and lasts 1s longer.',
            masteryPerk: 'Rabies reduces enemy poison resistance by 20% for 5s.',
            mod: { spreadSpeed: 20 },
            icon: 'ra-biohazard'
        },
        {
            id: 'rb_lethality', name: 'Neurotoxin', max: 5, reqBaseLevel: 15,
            desc: 'Poison damage increases by 15% per level.',
            masteryPerk: 'Enemies infected with Rabies deal 30% reduced damage.',
            mod: { poisonDmgPct: 15 },
            icon: 'ra-broken-heart'
        }
    ],
    feral_charge: [
        {
            id: 'fc_impact', name: 'Savage Charge', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage and +1s immobilization.',
            masteryPerk: 'Feral Charge stuns the target for 1s if they are bleeding.',
            mod: { pctDmg: 20 },
            icon: 'ra-fast-forward'
        },
        {
            id: 'fc_trample', name: 'Wild Trample', max: 5, reqBaseLevel: 20,
            desc: 'Feral Charge now hits all enemies in your path.',
            masteryPerk: 'Feral Charge instantly resets its cooldown if it kills an enemy.',
            mod: { multiHit: 1 },
            icon: 'ra-heavy-fall'
        }
    ],
    fire_claws: [
        {
            id: 'fc_inferno', name: 'Inferno Claws', max: 5, reqBaseLevel: 15,
            desc: '+15% Fire Damage and +10% splash radius.',
            masteryPerk: 'Fire Claws ignore 30% of the target\'s fire resistance.',
            mod: { pctFireDmg: 15 },
            icon: 'ra-flame-symbol'
        },
        {
            id: 'fc_immolation', name: 'Magma Scars', max: 5, reqBaseLevel: 20,
            desc: '+20% Burn damage over 3 seconds on hit.',
            masteryPerk: 'Fire Claws trigger a small explosion on every hit, dealing 30% splash damage.',
            mod: { burnDmgPct: 20 },
            icon: 'ra-explosion'
        }
    ],
    king_of_the_jungle: [
        {
            id: 'kotj_apex', name: 'Apex Predator', max: 5, reqBaseLevel: 20,
            desc: '+2s duration and +10% damage bonus.',
            masteryPerk: 'While in King of the Jungle, you are immune to all CC.',
            mod: { duration: 2, pctDmg: 10 },
            icon: 'ra-burning-embers'
        },
        {
            id: 'kotj_fury', name: 'Jungle Fury', max: 5, reqBaseLevel: 25,
            desc: '+10% Critical Strike chance while active.',
            masteryPerk: 'Every critical hit during King of the Jungle reduces the cooldown of all Shapeshifting skills by 1s.',
            mod: { critChance: 10 },
            icon: 'ra-muscle-fat'
        }
    ],

    // --- NATURE TREE ---
    twister: [
        {
            id: 'tw_shred', name: 'Razor Winds', max: 5, reqBaseLevel: 1,
            desc: '+10% Physical Damage and +0.5s stun duration.',
            masteryPerk: 'Twisters pull nearby enemies into their path.',
            mod: { pctDmg: 10 },
            icon: 'ra-cyclone'
        },
        {
            id: 'tw_gale', name: 'Gale Force', max: 5, reqBaseLevel: 5,
            desc: '+15% Twister travel speed and +20% distance.',
            masteryPerk: 'Every Twister has a 10% chance to evolve into a full Hurricane upon contact.',
            mod: { projSpeedPct: 15, projRangePct: 20 },
            icon: 'ra-windy'
        }
    ],
    nature_mastery: [
        {
            id: 'nm_elemental', name: 'Primal attunement', max: 5, reqBaseLevel: 1,
            desc: '+5% Elemental Damage per level.',
            masteryPerk: 'Your nature spells have a 10% chance to root the target.',
            mod: { pctElemDmg: 5 },
            icon: 'ra-crystals'
        },
        {
            id: 'nm_harmony', name: 'Natural Harmony', max: 5, reqBaseLevel: 5,
            desc: '+10% Mana regeneration rate.',
            masteryPerk: 'Every nature spell cast has a 10% chance to reset the cooldown of Cyclone Armor.',
            mod: { manaRegenPct: 10 },
            icon: 'ra-sun-glow'
        }
    ],
    cyclone_armor: [
        {
            id: 'ca_tempest', name: 'Eye of the Storm', max: 5, reqBaseLevel: 5,
            desc: '+150 Magic absorption per level.',
            masteryPerk: 'Cyclone Armor periodically releases a mini-tornado at enemies.',
            mod: { absorbCap: 150 },
            icon: 'ra-cyclone'
        },
        {
            id: 'ca_deflection', name: 'Storm Shield', max: 5, reqBaseLevel: 10,
            desc: '10% chance to reflect spells back at the caster.',
            masteryPerk: 'While Cyclone Armor is active, you take 50% less damage from all projectiles.',
            mod: { reflectChance: 10 },
            icon: 'ra-shield'
        }
    ],
    fissure: [
        {
            id: 'fi_magma', name: 'Magma Vents', max: 5, reqBaseLevel: 5,
            desc: '+2 magma vents and +10% radius.',
            masteryPerk: 'Fissure leaves burning patches on the ground for 5s.',
            mod: { extraVents: 2 },
            icon: 'ra-volcano'
        },
        {
            id: 'fi_tremor', name: 'Tectonic Shift', max: 5, reqBaseLevel: 10,
            desc: 'Enemies standing in the Fissure are slowed by 30%.',
            masteryPerk: 'Fissure now pulls enemies toward the center of the cracks every second.',
            mod: { slowPct: 30 },
            icon: 'ra-magnet'
        }
    ],
    hurricane: [
        {
            id: 'hu_tempest', name: 'Great Storm', max: 5, reqBaseLevel: 10,
            desc: '+15% Hurricane radius and +15% Cold Damage.',
            masteryPerk: 'Hurricane damage ticks 20% more often.',
            mod: { radiusPct: 15, pctColdDmg: 15 },
            icon: 'ra-cyclone'
        },
        {
            id: 'hu_blizzard', name: 'Glacial Vortex', max: 5, reqBaseLevel: 15,
            desc: 'Enemies staying in the Hurricane for 3s are frozen for 1s.',
            masteryPerk: 'Hurricane duration is extended by 1s for every enemy it hits.',
            mod: { freezeThreshold: 3 },
            icon: 'ra-snowflake'
        }
    ],
    volcano: [
        {
            id: 'vo_eruption', name: 'Magma Fountain', max: 5, reqBaseLevel: 10,
            desc: '+15% Fire Damage and +10% radius.',
            masteryPerk: 'Volcano fires 1 extra projectile every second.',
            mod: { pctDmg: 15 },
            icon: 'ra-volcano'
        },
        {
            id: 'vo_lava_flow', name: 'Rivers of Fire', max: 5, reqBaseLevel: 15,
            desc: 'Lava projectiles deal fire damage over 3 seconds.',
            masteryPerk: 'Volcano projectiles create small, persistent fire pools that last 3s on impact.',
            mod: { dotDmgPct: 20 },
            icon: 'ra-flame-symbol'
        }
    ],
    solar_beam: [
        {
            id: 'sb_radiance', name: 'Blinding Light', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage and +1s silence.',
            masteryPerk: 'Solar Beam always critical strikes blinded enemies.',
            mod: { pctDmg: 20 },
            icon: 'ra-sun-glow'
        },
        {
            id: 'sb_blinding', name: 'Guiding Light', max: 5, reqBaseLevel: 20,
            desc: '+2s duration for the blind effect.',
            masteryPerk: 'Solar Beam now tracks and follows its target as they move.',
            mod: { blindDuration: 2 },
            icon: 'ra-eye-shield'
        }
    ],
    armageddon: [
        {
            id: 'ar_cataclysm', name: 'Rain of Chaos', max: 5, reqBaseLevel: 15,
            desc: '+20% Meteor damage and +1 meteor per wave.',
            masteryPerk: 'Armageddon Meteors create a Fissure upon impact.',
            mod: { pctFireDmg: 20 },
            icon: 'ra-meteor'
        },
        {
            id: 'ar_extinction', name: 'Impact Theory', max: 5, reqBaseLevel: 20,
            desc: 'Meteors have a 10% chance to be twice as large and deal double damage.',
            masteryPerk: 'Every meteor that hits increases the damage of the next meteor by 10% (max 100%).',
            mod: { doubleChance: 10 },
            icon: 'ra-explosion'
        }
    ],
    boulder_toss: [
        {
            id: 'bt_heavy', name: 'Avalanche', max: 5, reqBaseLevel: 10,
            desc: '+15% Damage and +10% knockback.',
            masteryPerk: 'Boulder Toss leaves a trail of debris that slows enemies.',
            mod: { pctDmg: 15 },
            icon: 'ra-mountain-cave'
        },
        {
            id: 'bt_shatter', name: 'Granite Fragment', max: 5, reqBaseLevel: 15,
            desc: 'Boulder shatters into 4 shards upon impact, each dealing 25% damage.',
            masteryPerk: 'Boulder Toss can now be cast while moving without slowing down.',
            mod: { shardDmg: 25 },
            icon: 'ra-crystal-cluster'
        }
    ],
    force_of_nature: [
        {
            id: 'fon_treant', name: 'Ironwood Grove', max: 5, reqBaseLevel: 20,
            desc: '+1 Treant summoned and +15% Treant HP.',
            masteryPerk: 'Treants now emit a Thorns aura (100 physical reflect).',
            mod: { extraSummons: 1 },
            icon: 'ra-oak-leaf'
        },
        {
            id: 'fon_overgrowth', name: 'Verdant Guard', max: 5, reqBaseLevel: 25,
            desc: 'Treants are 20% larger and have +10% attack range.',
            masteryPerk: 'Treants have a 20% chance to root enemies for 1.5s on each attack.',
            mod: { sizePct: 20, rangePct: 10 },
            icon: 'ra-oak-leaf'
        }
    ],
    starfall: [
        {
            id: 'st_celestial', name: 'Aether Rain', max: 5, reqBaseLevel: 25,
            desc: '+20% Arcane damage and +10% radius.',
            masteryPerk: 'Starfall restores 1% Mana for every enemy it kills.',
            mod: { pctDmg: 20 },
            icon: 'ra-meteor'
        },
        {
            id: 'st_comet', name: 'Astral Impact', max: 5, reqBaseLevel: 30,
            desc: 'Stars are 15% larger and have a higher impact velocity.',
            masteryPerk: 'Every star hit reduces the target\'s magic resistance by 5% (stacks to 50%).',
            mod: { sizePct: 15 },
            icon: 'ra-sun-glow'
        }
    ],
    entangling_roots: [
        {
            id: 'er_thorny', name: 'Barbed Vines', max: 5, reqBaseLevel: 25,
            desc: '+15% Damage and +1s root duration.',
            masteryPerk: 'Entangling Roots reduces target armor by 30%.',
            mod: { pctDmg: 15 },
            icon: 'ra-biohazard'
        },
        {
            id: 'er_suffocation', name: 'Strangling Thorns', max: 5, reqBaseLevel: 30,
            desc: 'Roots deal 20% nature damage every second while active.',
            masteryPerk: 'If a rooted target dies, the roots spread to all enemies within 4m.',
            mod: { dotDmg: 20 },
            icon: 'ra-biohazard'
        }
    ],

    // --- HEALING TREE ---
    healing_touch: [
        {
            id: 'ht_grace', name: 'Divine Touch', max: 5, reqBaseLevel: 1,
            desc: '+15% Healing and +10% range.',
            masteryPerk: 'Healing Touch also grants 10% physical damage reduction for 5s.',
            mod: { pctHeal: 15 },
            icon: 'ra-heartburn'
        },
        {
            id: 'ht_renewal', name: 'Essence Renewal', max: 5, reqBaseLevel: 5,
            desc: 'Grants a small heal-over-time for 3s after the initial heal.',
            masteryPerk: 'Healing Touch also restores 10% of the target\'s maximum stamina.',
            mod: { hotPct: 10 },
            icon: 'ra-health'
        }
    ],
    rejuvenation: [
        {
            id: 're_bloom', name: 'Spring Growth', max: 5, reqBaseLevel: 1,
            desc: '+10% Healing per tick and +1s duration.',
            masteryPerk: 'Rejuvenation has a 20% chance to jump to a nearby ally.',
            mod: { pctHeal: 10 },
            icon: 'ra-oak-leaf'
        },
        {
            id: 're_life_bloom', name: 'Radiant Bloom', max: 5, reqBaseLevel: 5,
            desc: 'Increases target\'s maximum health by 5% for the duration.',
            masteryPerk: 'Rejuvenation pulses have a 10% chance to restore 2% of the target\'s mana.',
            mod: { maxHpPct: 5 },
            icon: 'ra-heart-pumping'
        }
    ],
    oak_sage: [
        {
            id: 'os_life', name: 'Essence of Life', max: 5, reqBaseLevel: 5,
            desc: '+10% Life bonus and +15% Spirit HP.',
            masteryPerk: 'Oak Sage also increases Life Regeneration by 20 per second.',
            mod: { lifeBonusPct: 10 },
            icon: 'ra-heartburn'
        },
        {
            id: 'os_protection', name: 'Barkskin Spirit', max: 5, reqBaseLevel: 10,
            desc: 'Oak Sage grants +10% Armor to all nearby allies.',
            masteryPerk: 'When the Oak Sage dies, it instantly heals all allies for 50% of its max health.',
            mod: { armorPct: 10 },
            icon: 'ra-shield'
        }
    ],
    innervate: [
        {
            id: 'in_surge', name: 'Mana Flow', max: 5, reqBaseLevel: 5,
            desc: '+20% Mana restored and +2s duration.',
            masteryPerk: 'Innervate also increases Cast Speed by 20%.',
            mod: { manaPct: 20 },
            icon: 'ra-sun-glow'
        },
        {
            id: 'in_clarity', name: 'Natural Clarity', max: 5, reqBaseLevel: 10,
            desc: '20% chance for nature spells to cost no mana while Innervate is active.',
            masteryPerk: 'Innervate increases total casting speed by 30% and reduces silence duration by 50%.',
            mod: { freeCastChance: 20 },
            icon: 'ra-lightning-bolt'
        }
    ],
    regrowth: [
        {
            id: 'rg_wild', name: 'Wild Growth', max: 5, reqBaseLevel: 10,
            desc: '+15% Instant healing and +10% HoT healing.',
            masteryPerk: 'Regrowth duration is doubled if the target is below 50% HP.',
            mod: { pctHeal: 15 },
            icon: 'ra-oak-leaf'
        },
        {
            id: 'rg_blessing', name: 'Gaea\'s Blessing', max: 5, reqBaseLevel: 15,
            desc: 'Increases all incoming healing on the target by 10%.',
            masteryPerk: 'Regrowth becomes un-dispellable and grants immunity to poison.',
            mod: { healingAmpPct: 10 },
            icon: 'ra-oak-leaf'
        }
    ],
    heart_of_wolverine: [
        {
            id: 'hw_war', name: 'Primal Fury', max: 5, reqBaseLevel: 10,
            desc: '+10% Damage and +5% Attack Rating bonus.',
            masteryPerk: 'Heart of Wolverine also grants 10% Deadly Strike chance.',
            mod: { dmgBonusPct: 10 },
            icon: 'ra-muscle-fat'
        },
        {
            id: 'hw_bravery', name: 'Pack Leader', max: 5, reqBaseLevel: 15,
            desc: '+5% Movement Speed and +10% attack range for pets.',
            masteryPerk: 'Heart of Wolverine also grants 15% physical damage resistance to all allies.',
            mod: { moveSpeedPct: 5, petRangePct: 10 },
            icon: 'ra-wolf-howl'
        }
    ],
    tranquility: [
        {
            id: 'tr_serenity', name: 'Deep Peace', max: 5, reqBaseLevel: 15,
            desc: '+15% Healing pulse and +2s duration.',
            masteryPerk: 'Tranquility reduces all damage taken by allies by 20%.',
            mod: { pctHeal: 15 },
            icon: 'ra-sun-glow'
        },
        {
            id: 'tr_bliss', name: 'Nirvana', max: 5, reqBaseLevel: 20,
            desc: 'Tranquility removes 1 negative status effect every second.',
            masteryPerk: 'All non-boss enemies inside the Tranquility radius are pacified and cannot attack.',
            mod: { cleanseRate: 1 },
            icon: 'ra-sun-glow'
        }
    ],
    wild_growth: [
        {
            id: 'wg_forest', name: 'Living Forest', max: 5, reqBaseLevel: 15,
            desc: '+15% Healing and affects 1 extra target.',
            masteryPerk: 'Wild Growth pulses have a 10% chance to purge debuffs.',
            mod: { pctHeal: 15 },
            icon: 'ra-oak-leaf'
        },
        {
            id: 'wg_vitality', name: 'Verdant Life', max: 5, reqBaseLevel: 20,
            desc: '+20% Health regeneration for all affected targets.',
            masteryPerk: 'Wild Growth now stacks up to 2 times on a single target.',
            mod: { regenPct: 20 },
            icon: 'ra-heartburn'
        }
    ],
    tree_of_life: [
        {
            id: 'tol_ancient', name: 'Ancient Form', max: 5, reqBaseLevel: 25,
            desc: '+20% Healing bonus and +10% Armor bonus.',
            masteryPerk: 'While in Tree Form, you are immune to silence and mana burn.',
            mod: { pctHeal: 20 },
            icon: 'ra-oak-leaf'
        },
        {
            id: 'tol_sentinel', name: 'Guardian of the Grove', max: 5, reqBaseLevel: 30,
            desc: '+15% damage reflection while in Tree Form.',
            masteryPerk: 'While in Tree Form, you emit a powerful Healing Wave every 3 seconds.',
            mod: { reflectPct: 15 },
            icon: 'ra-oak-leaf'
        }
    ]
};
