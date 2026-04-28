export const DRUID_MUTATIONS = {
    dire_wolf: [
        {
            id: 'dw_speed', name: 'Wolf Speed', max: 5,
            desc: '+10% Movement speed while in wolf form.',
            masteryPerk: 'In wolf form, you have a 20% chance to dodge all attacks.',
            mod: { moveSpeedPct: 10 },
            icon: 'ra-fast-forward'
        }
    ],
    bear_form: [
        {
            id: 'bf_armor', name: 'Bear Armor', max: 5,
            desc: '+20% Armor bonus while in bear form.',
            masteryPerk: 'In bear form, you are immune to all knockback and stun effects.',
            mod: { armorPct: 20 },
            icon: 'ra-heavy-shield'
        }
    ],
    maul: [
        {
            id: 'maul_ravage', name: 'Ravage', max: 5,
            desc: '+15% Bleed damage per level.',
            masteryPerk: 'Shred: Bleeding targets have their Armor reduced by 20%.',
            mod: { bleedDmgPct: 15 },
            icon: 'ra-bear-claw'
        },
        {
            id: 'maul_shaker', name: 'Earthshaker', max: 5,
            desc: 'Adds 20% Earth damage per level.',
            masteryPerk: 'Seismic Wave: Maul creates a shockwave that travels behind the target.',
            mod: { earthDmgPct: 20 },
            icon: 'ra-earth-crack'
        }
    ],
    shred: [
        {
            id: 'shr_frenzy', name: 'Wolf Frenzy', max: 5,
            desc: '+10% Attack Speed for 3s on hit.',
            masteryPerk: 'Shred has a 20% chance to strike the target a second time.',
            mod: { speedPct: 10 },
            icon: 'ra-lightning-trio'
        }
    ],
    bear_slam: [
        {
            id: 'bs_shock', name: 'Thunder Slam', max: 5,
            desc: '+15% Damage and +0.5s stun.',
            masteryPerk: 'Bear Slam creates a secondary shockwave after 1s.',
            mod: { pctDmg: 15, stunDur: 0.5 },
            icon: 'ra-heavy-fall'
        }
    ],
    lacerate: [
        {
            id: 'lac_bleed', name: 'Deep Laceration', max: 5,
            desc: '+20% Bleed damage and +2s duration.',
            masteryPerk: 'Lacerate reduces enemy health regeneration by 100%.',
            mod: { bleedPct: 20, duration: 2 },
            icon: 'ra-bleeding-hearts'
        }
    ],
    rabies: [
        {
            id: 'rab_contagion', name: 'Viral Rabies', max: 5,
            desc: '+15% Poison damage and +10% spread radius.',
            masteryPerk: 'Enemies infected by Rabies deal 20% less damage.',
            mod: { poisonPct: 15, radiusPct: 10 },
            icon: 'ra-poison-cloud'
        }
    ],
    feral_charge: [
        {
            id: 'fc_impact', name: 'Feral Impact', max: 5,
            desc: '+20% Damage and +1s immobilization.',
            masteryPerk: 'Feral Charge cooldown is reset if it kills the target.',
            mod: { pctDmg: 20, immobDur: 1 },
            icon: 'ra-boots'
        }
    ],
    fire_claws: [
        {
            id: 'fcl_blaze', name: 'Inferno Claws', max: 5,
            desc: '+15% Fire damage and +5% Crit chance.',
            masteryPerk: 'Fire Claws attacks release a small fire nova.',
            mod: { fireDmgPct: 15, critChance: 5 },
            icon: 'ra-large-fire'
        }
    ],
    king_of_the_jungle: [
        {
            id: 'koj_fury', name: 'Primal Fury', max: 5,
            desc: '+10% Damage bonus and +2s duration.',
            masteryPerk: 'While King of the Jungle is active, all skills cost 0 mana.',
            mod: { dmgBonus: 10, duration: 2 },
            icon: 'ra-wolf-howl'
        }
    ],
    twister: [
        {
            id: 'tw_lightning', name: 'Charged Twister', max: 5,
            desc: '+15% Lightning damage and +5% stun chance.',
            masteryPerk: 'Twister now fires 2 tornadoes in a V-shape.',
            mod: { lightDmgPct: 15, stunChance: 5 },
            icon: 'ra-lightning-bolt'
        }
    ],
    cyclone_armor: [
        {
            id: 'ca_barrier', name: 'Wind Barrier', max: 5,
            desc: '+50 Absorption and +10s duration.',
            masteryPerk: 'Cyclone Armor reflects 50% of elemental damage taken.',
            mod: { absorbPct: 50, duration: 10 },
            icon: 'ra-bolt-shield'
        }
    ],
    fissure: [
        {
            id: 'fis_magma', name: 'Magma Fissure', max: 5,
            desc: '+15% Fire damage and +1s duration.',
            masteryPerk: 'Fissure leaves burning ground that lasts 5s.',
            mod: { fireDmgPct: 15, duration: 1 },
            icon: 'ra-volcano'
        }
    ],
    hurricane: [
        {
            id: 'hur_storm', name: 'Eye of the Storm', max: 5,
            desc: '+10% Damage and +10% Radius.',
            masteryPerk: 'Hurricane now follows you as you move.',
            mod: { dmgPct: 10, radiusPct: 10 },
            icon: 'ra-cyclone'
        }
    ],
    volcano: [
        {
            id: 'vol_eruption', name: 'Mega Volcano', max: 5,
            desc: '+15% Fire damage and +10% AoE.',
            masteryPerk: 'Volcano erupts twice as often.',
            mod: { fireDmgPct: 15, aoePct: 10 },
            icon: 'ra-volcano'
        }
    ],
    solar_beam: [
        {
            id: 'sb_purity', name: 'Divine Beam', max: 5,
            desc: '+20% Damage and +1s Silence.',
            masteryPerk: 'Solar Beam heals allies caught in its light.',
            mod: { pctDmg: 20, silenceDur: 1 },
            icon: 'ra-sun'
        }
    ],
    armageddon: [
        {
            id: 'arm_apocalypse', name: 'Starfall', max: 5,
            desc: '+20% Fire damage and +1s duration.',
            masteryPerk: 'Armageddon meteors are 50% larger.',
            mod: { fireDmgPct: 20, duration: 1 },
            icon: 'ra-meteor'
        }
    ],
    boulder_toss: [
        {
            id: 'bt_mass', name: 'Massive Boulder', max: 5,
            desc: '+20% Damage and +10% Knockback.',
            masteryPerk: 'Boulder Toss leaves a trail of debris that slows enemies.',
            mod: { pctDmg: 20, knockbackPct: 10 },
            icon: 'ra-mountains'
        }
    ],
    force_of_nature: [
        {
            id: 'fon_ancient', name: 'Ancient Treants', max: 5,
            desc: '+20% Treant HP and Damage.',
            masteryPerk: 'You can now summon 5 Treants instead of 3.',
            mod: { treantHp: 20, treantDmg: 20 },
            icon: 'ra-pine-tree'
        }
    ],
    starfall: [
        {
            id: 'sf_arcane', name: 'Arcane Rain', max: 5,
            desc: '+20% Damage and +2s duration.',
            masteryPerk: 'Starfall now hits the same enemy multiple times.',
            mod: { pctDmg: 20, duration: 2 },
            icon: 'ra-ghost'
        }
    ],
    entangling_roots: [
        {
            id: 'er_nature', name: 'Deep Roots', max: 5,
            desc: '+1s root duration and +15% Damage.',
            masteryPerk: 'Entangling Roots spreads to a nearby enemy on impact.',
            mod: { rootDur: 1, pctDmg: 15 },
            icon: 'ra-pine-tree'
        }
    ],
    healing_touch: [
        {
            id: 'ht_grace', name: 'Nature Grace', max: 5,
            desc: '+15% Healing and -10% Mana cost.',
            masteryPerk: 'Healing Touch cleanses all poisons from the target.',
            mod: { healPct: 15, manaRed: 10 },
            icon: 'ra-health'
        }
    ],
    rejuvenation: [
        {
            id: 'rej_spirit', name: 'Spiritual Growth', max: 5,
            desc: '+15% HoT healing and +2s duration.',
            masteryPerk: 'Rejuvenation restores 1% Mana per second while active.',
            mod: { healPct: 15, duration: 2 },
            icon: 'ra-water-drop'
        }
    ],
    oak_sage: [
        {
            id: 'os_vitality', name: 'Eternal Oak', max: 5,
            desc: '+5% HP bonus and +10% Radius.',
            masteryPerk: 'Oak Sage also grants +10% Damage Reduction.',
            mod: { hpBonus: 5, radiusPct: 10 },
            icon: 'ra-pine-tree'
        }
    ],
    innervate: [
        {
            id: 'inn_fountain', name: 'Mana Well', max: 5,
            desc: '+10 Mana/s and +2s duration.',
            masteryPerk: 'Innervate also increases Cast Speed by 20%.',
            mod: { manaBonus: 10, duration: 2 },
            icon: 'ra-water-drop'
        }
    ],
    regrowth: [
        {
            id: 'reg_bloom', name: 'Nature Bloom', max: 5,
            desc: '+15% Healing and +2s duration.',
            masteryPerk: 'Regrowth has a 20% chance to trigger Rejuvenation.',
            mod: { healPct: 15, duration: 2 },
            icon: 'ra-pine-tree'
        }
    ],
    heart_of_wolverine: [
        {
            id: 'how_fury', name: 'Spirit Fury', max: 5,
            desc: '+5% Damage bonus and +10% Radius.',
            masteryPerk: 'Heart of Wolverine also grants +10% Critical Strike chance.',
            mod: { dmgBonus: 5, radiusPct: 10 },
            icon: 'ra-wolf-howl'
        }
    ],
    tranquility: [
        {
            id: 'tra_serene', name: 'Deep Serenity', max: 5,
            desc: '+20% Healing and +1s duration.',
            masteryPerk: 'Tranquility also reduces all incoming damage by 30% for allies.',
            mod: { healPct: 20, duration: 1 },
            icon: 'ra-water-drop'
        }
    ],
    wild_growth: [
        {
            id: 'wg_expansion', name: 'Expanding Wilds', max: 5,
            desc: '+1 target hit and +15% Healing.',
            masteryPerk: 'Wild Growth now targets all allies within 100px.',
            mod: { extraTargets: 1, healPct: 15 },
            icon: 'ra-pine-tree'
        }
    ],
    tree_of_life: [
        {
            id: 'tol_ancient', name: 'Ancient Form', max: 5,
            desc: '+20% Healing and +10% Armor.',
            masteryPerk: 'In tree form, you cast Rejuvenation on yourself every 5s.',
            mod: { healBonus: 20, armorPct: 10 },
            icon: 'ra-pine-tree'
        }
    ]
};
