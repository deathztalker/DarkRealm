export const DRUID_MUTATIONS = {
    // --- SHAPESHIFTING TREE ---
    dire_wolf: [
        {
            id: 'dw_ferocity', name: 'Alpha Ferocity', max: 5, reqBaseLevel: 1,
            desc: '+10% Attack Speed and +5% Crit Chance while transformed.',
            masteryPerk: 'Wolf Form attacks have a 20% chance to cause target to flee for 2s.',
            mod: { pctIAS: 10, critChance: 5 },
            icon: 'ra-wolf-howl'
        }
    ],
    bear_form: [
        {
            id: 'bf_iron_hide', name: 'Grizzly Skin', max: 5, reqBaseLevel: 1,
            desc: '+20% Armor and +15% Health while transformed.',
            masteryPerk: 'Bear Form attacks have high knockback and stun for 0.5s.',
            mod: { pctArmor: 20, pctHP: 15 },
            icon: 'ra-bear-head'
        }
    ],
    feral_mastery: [
        {
            id: 'fm_primal', name: 'Primal Instinct', max: 5, reqBaseLevel: 1,
            desc: '+5% Damage and +2% Crit Chance while shapeshifted.',
            masteryPerk: 'Shapeshifting has a 10% chance to reset the cooldown of Maul or Shred.',
            mod: { pctDmg: 5, critChance: 2 },
            icon: 'ra-lion'
        }
    ],
    maul: [
        {
            id: 'ma_heavy', name: 'Heavy Swipe', max: 5, reqBaseLevel: 5,
            desc: '+15% Damage and +0.2s stun duration.',
            masteryPerk: 'Maul generates 1 stack of Feral Rage on hit.',
            mod: { pctDmg: 15, stunDur: 0.2 },
            icon: 'ra-bear-head'
        }
    ],
    shred: [
        {
            id: 'sh_tear', name: 'Rip and Tear', max: 5, reqBaseLevel: 5,
            desc: '+15% Damage and applies a bleed for 3s.',
            masteryPerk: 'Shred deals 50% more damage to bleeding enemies.',
            mod: { pctDmg: 15, bleedDmg: 20 },
            icon: 'ra-dripping-blade'
        }
    ],
    bear_slam: [
        {
            id: 'bs_shockwave', name: 'Seismic Shock', max: 5, reqBaseLevel: 10,
            desc: '+15% Damage and +10% AoE radius.',
            masteryPerk: 'Bear Slam leaves the ground trembling, slowing enemies for 3s.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-waves-pulse'
        }
    ],
    lacerate: [
        {
            id: 'la_open_wound', name: 'Deep Laceration', max: 5, reqBaseLevel: 10,
            desc: '+20% Bleed damage per level.',
            masteryPerk: 'Lacerate reduces target healing received by 50% for 5s.',
            mod: { bleedDmgPct: 20 },
            icon: 'ra-dripping-blade'
        }
    ],
    rabies: [
        {
            id: 'rb_contagion', name: 'Toxic Contagion', max: 5, reqBaseLevel: 10,
            desc: 'Poison spreads 20% faster and lasts 1s longer.',
            masteryPerk: 'Rabies reduces enemy poison resistance by 20% for 5s.',
            mod: { spreadSpeed: 20 },
            icon: 'ra-biohazard'
        }
    ],
    feral_charge: [
        {
            id: 'fc_impact', name: 'Savage Charge', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage and +1s immobilization.',
            masteryPerk: 'Feral Charge stuns the target for 1s if they are bleeding.',
            mod: { pctDmg: 20 },
            icon: 'ra-fast-forward'
        }
    ],
    fire_claws: [
        {
            id: 'fc_inferno', name: 'Inferno Claws', max: 5, reqBaseLevel: 15,
            desc: '+15% Fire Damage and +10% splash radius.',
            masteryPerk: 'Fire Claws ignore 30% of the target\'s fire resistance.',
            mod: { pctFireDmg: 15 },
            icon: 'ra-flame-symbol'
        }
    ],
    king_of_the_jungle: [
        {
            id: 'kotj_apex', name: 'Apex Predator', max: 5, reqBaseLevel: 20,
            desc: '+2s duration and +10% damage bonus.',
            masteryPerk: 'While in King of the Jungle, you are immune to all CC.',
            mod: { duration: 2, pctDmg: 10 },
            icon: 'ra-burning-embers'
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
        }
    ],
    nature_mastery: [
        {
            id: 'nm_elemental', name: 'Primal attunement', max: 5, reqBaseLevel: 1,
            desc: '+5% Elemental Damage per level.',
            masteryPerk: 'Your nature spells have a 10% chance to root the target.',
            mod: { pctElemDmg: 5 },
            icon: 'ra-crystals'
        }
    ],
    cyclone_armor: [
        {
            id: 'ca_tempest', name: 'Eye of the Storm', max: 5, reqBaseLevel: 5,
            desc: '+150 Magic absorption per level.',
            masteryPerk: 'Cyclone Armor periodically releases a mini-tornado at enemies.',
            mod: { absorbCap: 150 },
            icon: 'ra-cyclone'
        }
    ],
    fissure: [
        {
            id: 'fi_magma', name: 'Magma Vents', max: 5, reqBaseLevel: 5,
            desc: '+2 magma vents and +10% radius.',
            masteryPerk: 'Fissure leaves burning patches on the ground for 5s.',
            mod: { extraVents: 2 },
            icon: 'ra-volcano'
        }
    ],
    hurricane: [
        {
            id: 'hu_tempest', name: 'Great Storm', max: 5, reqBaseLevel: 10,
            desc: '+15% Hurricane radius and +15% Cold Damage.',
            masteryPerk: 'Hurricane damage ticks 20% more often.',
            mod: { radiusPct: 15, pctColdDmg: 15 },
            icon: 'ra-cyclone'
        }
    ],
    volcano: [
        {
            id: 'vo_eruption', name: 'Magma Fountain', max: 5, reqBaseLevel: 10,
            desc: '+15% Fire Damage and +10% radius.',
            masteryPerk: 'Volcano fires 1 extra projectile every second.',
            mod: { pctDmg: 15 },
            icon: 'ra-volcano'
        }
    ],
    solar_beam: [
        {
            id: 'sb_radiance', name: 'Blinding Light', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage and +1s silence.',
            masteryPerk: 'Solar Beam always critical strikes blinded enemies.',
            mod: { pctDmg: 20 },
            icon: 'ra-sun-glow'
        }
    ],
    armageddon: [
        {
            id: 'ar_cataclysm', name: 'Rain of Chaos', max: 5, reqBaseLevel: 15,
            desc: '+20% Meteor damage and +1 meteor per wave.',
            masteryPerk: 'Armageddon Meteors create a Fissure upon impact.',
            mod: { pctFireDmg: 20 },
            icon: 'ra-meteor'
        }
    ],
    boulder_toss: [
        {
            id: 'bt_heavy', name: 'Avalanche', max: 5, reqBaseLevel: 10,
            desc: '+15% Damage and +10% knockback.',
            masteryPerk: 'Boulder Toss leaves a trail of debris that slows enemies.',
            mod: { pctDmg: 15 },
            icon: 'ra-mountain-cave'
        }
    ],
    force_of_nature: [
        {
            id: 'fon_treant', name: 'Ironwood Grove', max: 5, reqBaseLevel: 20,
            desc: '+1 Treant summoned and +15% Treant HP.',
            masteryPerk: 'Treants now emit a Thorns aura (100 physical reflect).',
            mod: { extraSummons: 1 },
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
        }
    ],
    entangling_roots: [
        {
            id: 'er_thorny', name: 'Barbed Vines', max: 5, reqBaseLevel: 25,
            desc: '+15% Damage and +1s root duration.',
            masteryPerk: 'Entangling Roots reduces target armor by 30%.',
            mod: { pctDmg: 15 },
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
        }
    ],
    rejuvenation: [
        {
            id: 're_bloom', name: 'Spring Growth', max: 5, reqBaseLevel: 1,
            desc: '+10% Healing per tick and +1s duration.',
            masteryPerk: 'Rejuvenation has a 20% chance to jump to a nearby ally.',
            mod: { pctHeal: 10 },
            icon: 'ra-oak-leaf'
        }
    ],
    oak_sage: [
        {
            id: 'os_life', name: 'Essence of Life', max: 5, reqBaseLevel: 5,
            desc: '+10% Life bonus and +15% Spirit HP.',
            masteryPerk: 'Oak Sage also increases Life Regeneration by 20 per second.',
            mod: { lifeBonusPct: 10 },
            icon: 'ra-heartburn'
        }
    ],
    innervate: [
        {
            id: 'in_surge', name: 'Mana Flow', max: 5, reqBaseLevel: 5,
            desc: '+20% Mana restored and +2s duration.',
            masteryPerk: 'Innervate also increases Cast Speed by 20%.',
            mod: { manaPct: 20 },
            icon: 'ra-sun-glow'
        }
    ],
    regrowth: [
        {
            id: 'rg_wild', name: 'Wild Growth', max: 5, reqBaseLevel: 10,
            desc: '+15% Instant healing and +10% HoT healing.',
            masteryPerk: 'Regrowth duration is doubled if the target is below 50% HP.',
            mod: { pctHeal: 15 },
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
        }
    ],
    tranquility: [
        {
            id: 'tr_serenity', name: 'Deep Peace', max: 5, reqBaseLevel: 15,
            desc: '+15% Healing pulse and +2s duration.',
            masteryPerk: 'Tranquility reduces all damage taken by allies by 20%.',
            mod: { pctHeal: 15 },
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
        }
    ],
    tree_of_life: [
        {
            id: 'tol_ancient', name: 'Ancient Form', max: 5, reqBaseLevel: 25,
            desc: '+20% Healing bonus and +10% Armor bonus.',
            masteryPerk: 'While in Tree Form, you are immune to silence and mana burn.',
            mod: { pctHeal: 20 },
            icon: 'ra-oak-leaf'
        }
    ]
};
