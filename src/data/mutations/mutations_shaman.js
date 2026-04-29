export const SHAMAN_MUTATIONS = {
    // --- ELEMENTS TREE ---
    lightning_bolt: [
        {
            id: 'lb_static', name: 'Static Discharge', max: 5, reqBaseLevel: 1,
            desc: '+10% Lightning Damage and +10% chance to shock.',
            masteryPerk: 'Lightning Bolt now leaves a static field that shocks nearby enemies.',
            mod: { pctDmg: 10, shockChance: 10 },
            icon: 'ra-lightning-bolt'
        },
        {
            id: 'lb_thunder_call', name: 'Thunder Call', max: 5, reqBaseLevel: 1,
            desc: '+15% Mana efficiency and +5% Stun chance per level.',
            masteryPerk: 'Lightning Bolt now strikes 2 additional nearby targets for 50% damage.',
            mod: { manaEfficiency: 15, stunChance: 5 },
            icon: 'ra-lightning-storm'
        }
    ],
    flame_shock: [
        {
            id: 'fs_blaze', name: 'Searing Flame', max: 5, reqBaseLevel: 1,
            desc: '+15% Burn damage per level.',
            masteryPerk: 'Flame Shock critical strikes restore 2% Mana.',
            mod: { burnDmgPct: 15 },
            icon: 'ra-small-fire'
        },
        {
            id: 'fs_inferno', name: 'Inferno Shock', max: 5, reqBaseLevel: 5,
            desc: '+10% Initial damage and +5% Crit chance for Flame Shock.',
            masteryPerk: 'Flame Shock now explodes upon expiration, dealing 100% damage.',
            mod: { pctDmg: 10, critChance: 5 },
            icon: 'ra-fire-nova'
        }
    ],
    elem_mastery: [
        {
            id: 'em_convergence', name: 'Primal Convergence', max: 5, reqBaseLevel: 5,
            desc: '+5% to all elements damage per level.',
            masteryPerk: 'Elemental spells have a 10% chance to trigger an Elemental Overload (free cast).',
            mod: { pctElemDmg: 5 },
            icon: 'ra-crystals'
        },
        {
            id: 'em_harmony', name: 'Elemental Harmony', max: 5, reqBaseLevel: 10,
            desc: '+10% Resistance to all elements and +5% Elemental damage.',
            masteryPerk: 'Each elemental spell cast increases the damage of the next different element by 20%.',
            mod: { allRes: 10, pctElemDmg: 5 },
            icon: 'ra-crystals'
        }
    ],
    frost_shock: [
        {
            id: 'fs_permafrost', name: 'Icy Chill', max: 5, reqBaseLevel: 1,
            desc: '+10% Slow effect and +1s duration.',
            masteryPerk: 'Frost Shock freezes the target for 1.5s if they are already slowed.',
            mod: { slowPct: 10 },
            icon: 'ra-ice-cube'
        },
        {
            id: 'fs_freeze', name: 'Glacial Shock', max: 5, reqBaseLevel: 5,
            desc: '+20% Damage and +10% Freeze chance.',
            masteryPerk: 'Frost Shock now creates a patch of ice that slows all enemies in it.',
            mod: { pctDmg: 20, freezeChance: 10 },
            icon: 'ra-snowflake'
        }
    ],
    chain_lightning: [
        {
            id: 'cl_overload', name: 'Overload', max: 5, reqBaseLevel: 10,
            desc: '+1 extra jump per level.',
            masteryPerk: 'Chain Lightning has a 10% chance to strike the target twice.',
            mod: { extraJumps: 1 },
            icon: 'ra-lightning-fury'
        },
        {
            id: 'cl_surge', name: 'Lightning Surge', max: 5, reqBaseLevel: 15,
            desc: '+15% Damage and +10% Projectile speed.',
            masteryPerk: 'Chain Lightning now has a 20% chance to cast a free Lightning Bolt on each target hit.',
            mod: { pctDmg: 15, projectileSpeed: 10 },
            icon: 'ra-lightning-storm'
        }
    ],
    thunder_strike: [
        {
            id: 'ts_crash', name: 'Rolling Thunder', max: 5, reqBaseLevel: 10,
            desc: '+20% Damage and +10% stun chance.',
            masteryPerk: 'Thunder Strike resets the cooldown of Lightning Bolt.',
            mod: { pctDmg: 20 },
            icon: 'ra-lightning-trio'
        },
        {
            id: 'ts_impact', name: 'Heavenly Strike', max: 5, reqBaseLevel: 15,
            desc: '+25% Damage and +15% AoE Radius.',
            masteryPerk: 'Thunder Strike now calls down a secondary bolt 1s later.',
            mod: { pctDmg: 25, radiusPct: 15 },
            icon: 'ra-lightning-bolt'
        }
    ],
    elemental_focus: [
        {
            id: 'ef_clarity', name: 'Primal Clarity', max: 5, reqBaseLevel: 15,
            desc: 'Increases crit chance with elemental spells by 2% per level.',
            masteryPerk: 'Elemental Focus also increases your Critical Strike Multiplier by 25%.',
            mod: { critChance: 2 },
            icon: 'ra-eye-shield'
        },
        {
            id: 'ef_fury', name: 'Elemental Fury', max: 5, reqBaseLevel: 20,
            desc: '+15% Elemental Damage and +5% Cast Speed.',
            masteryPerk: 'While Elemental Focus is active, all your elemental spells ignore 20% resistance.',
            mod: { pctElemDmg: 15, castSpeedPct: 5 },
            icon: 'ra-burning-embers'
        }
    ],
    lava_burst: [
        {
            id: 'lb_molten', name: 'Molten Core', max: 5, reqBaseLevel: 15,
            desc: '+15% Fire Damage and +10% splash radius.',
            masteryPerk: 'Lava Burst leaves a pool of lava for 3s.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-flame-symbol'
        },
        {
            id: 'lb_eruption', name: 'Volcanic Eruption', max: 5, reqBaseLevel: 20,
            desc: '+20% Damage and +10% Burn damage.',
            masteryPerk: 'Lava Burst now launches 3 smaller lava globs at nearby enemies.',
            mod: { pctDmg: 20, burnDmgPct: 10 },
            icon: 'ra-volcano'
        }
    ],
    earthquake: [
        {
            id: 'eq_tectonic', name: 'Tectonic Shift', max: 5, reqBaseLevel: 20,
            desc: '+15% Earthquake radius and +1s duration.',
            masteryPerk: 'Earthquake has a 10% chance per tick to stun enemies for 1s.',
            mod: { radiusPct: 15, duration: 1 },
            icon: 'ra-mountains'
        },
        {
            id: 'eq_tremor', name: 'Seismic Tremor', max: 5, reqBaseLevel: 25,
            desc: '+20% Slow effect and +10% Damage per level.',
            masteryPerk: 'Earthquake now has a 50% chance to knock down enemies every 2s.',
            mod: { slowPct: 20, pctDmg: 10 },
            icon: 'ra-cracks'
        }
    ],
    storm_caller: [
        {
            id: 'sc_thunder', name: 'Great Storm', max: 5, reqBaseLevel: 25,
            desc: '+10% Lightning Damage and +1 target hit by Nova.',
            masteryPerk: 'Storm Caller increases your movement speed by 20% during storms.',
            mod: { pctLightDmg: 10 },
            icon: 'ra-lightning-fury'
        },
        {
            id: 'sc_tempest', name: 'Eye of the Storm', max: 5, reqBaseLevel: 30,
            desc: '+20% Damage and +15% Duration for all storms.',
            masteryPerk: 'Storm Caller now automatically casts a free Nova every 5s.',
            mod: { pctDmg: 20, durationPct: 15 },
            icon: 'ra-cyclone'
        }
    ],
    bloodlust: [
        {
            id: 'bl_fervor', name: 'Primal Haste', max: 5, reqBaseLevel: 30,
            desc: '+5% haste bonus and +2s duration.',
            masteryPerk: 'During Bloodlust, all party members are immune to fear.',
            mod: { iasPct: 5 },
            icon: 'ra-burning-embers'
        },
        {
            id: 'bl_frenzy', name: 'Primal Frenzy', max: 5, reqBaseLevel: 35,
            desc: '+10% Damage and +5% Life Steal during Bloodlust.',
            masteryPerk: 'During Bloodlust, your attacks have a 20% chance to trigger a free Chain Lightning.',
            mod: { dmgPct: 10, lifeSteal: 5 },
            icon: 'ra-lightning-fury'
        }
    ],

    // --- TOTEMS TREE ---
    searing_totem: [
        {
            id: 'st_rapid_fire', name: 'Rapid Fire', max: 5, reqBaseLevel: 1,
            desc: 'Totem fires 15% faster per level.',
            masteryPerk: 'Searing Totem now fires 2 bolts at once.',
            mod: { totemIas: 15 },
            icon: 'ra-fire-tail'
        },
        {
            id: 'st_focused', name: 'Focused Beam', max: 5, reqBaseLevel: 5,
            desc: '+20% Damage and +10% Range for the totem.',
            masteryPerk: 'Searing Totem now fires a continuous beam of fire at a single target.',
            mod: { pctDmg: 20, rangePct: 10 },
            icon: 'ra-flaming-claw'
        }
    ],
    stoneskin_totem: [
        {
            id: 'st_hardened', name: 'Obsidian Skin', max: 5, reqBaseLevel: 1,
            desc: '+10% physical damage reduction bonus.',
            masteryPerk: 'Stoneskin Totem also increases Armor by 30%.',
            mod: { drPct: 10 },
            icon: 'ra-shield'
        },
        {
            id: 'st_barrier', name: 'Earth Barrier', max: 5, reqBaseLevel: 5,
            desc: '+15% Armor and grants a shield equal to 5% Max HP every 5s.',
            masteryPerk: 'Stoneskin Totem now reflects 20% of all physical damage taken.',
            mod: { pctArmor: 15 },
            icon: 'ra-shield'
        }
    ],
    totem_mastery: [
        {
            id: 'tm_ancient', name: 'Spirit Totem', max: 5, reqBaseLevel: 5,
            desc: '+20% Totem radius and +10% duration.',
            masteryPerk: 'Totem Mastery increases your maximum number of active totems by 1.',
            mod: { radiusPct: 20 },
            icon: 'ra-oak-leaf'
        },
        {
            id: 'tm_ancient_power', name: 'Ancient Power', max: 5, reqBaseLevel: 10,
            desc: '+15% Totem effect strength and +5% Mana regen.',
            masteryPerk: 'Your totems now pulse with elemental energy, dealing 10% damage to nearby enemies.',
            mod: { totemPowerPct: 15, manaRegenPct: 5 },
            icon: 'ra-burning-embers'
        }
    ],
    tremor_totem: [
        {
            id: 'tt_shiver', name: 'Seismic Wave', max: 5, reqBaseLevel: 5,
            desc: 'Totem pulses 1s faster.',
            masteryPerk: 'Tremor Totem also has a 20% chance to stun nearby enemies.',
            mod: { ratePct: 10 },
            icon: 'ra-waves-pulse'
        },
        {
            id: 'tt_resonance', name: 'Resonating Earth', max: 5, reqBaseLevel: 10,
            desc: '+20% Radius and +10% Slow effect.',
            masteryPerk: 'Tremor Totem now releases a shockwave that deals 50% damage every 4s.',
            mod: { radiusPct: 20, slowPct: 10 },
            icon: 'ra-wave'
        }
    ],
    magma_totem: [
        {
            id: 'mt_eruption', name: 'Magma Fountain', max: 5, reqBaseLevel: 10,
            desc: '+20% Pulse damage.',
            masteryPerk: 'Magma Totem has a 30% chance to cast Lava Burst on hit.',
            mod: { pctDmg: 20 },
            icon: 'ra-volcano'
        },
        {
            id: 'mt_lava', name: 'Lava Flow', max: 5, reqBaseLevel: 15,
            desc: '+15% Damage and leaves burning ground for 2s.',
            masteryPerk: 'Magma Totem now creates 3 mini-volcanoes that fire lava bolts.',
            mod: { pctDmg: 15 },
            icon: 'ra-volcano'
        }
    ],
    windfury_totem: [
        {
            id: 'wt_tempest', name: 'Great Winds', max: 5, reqBaseLevel: 15,
            desc: '+5% extra attack chance.',
            masteryPerk: 'Windfury also grants +20% Movement Speed.',
            mod: { extraAttackChance: 5 },
            icon: 'ra-fast-forward'
        },
        {
            id: 'wt_surge', name: 'Wind Surge', max: 5, reqBaseLevel: 20,
            desc: '+10% Attack Speed and +5% Crit chance.',
            masteryPerk: 'Windfury attacks now release a small tornado that damages nearby enemies.',
            mod: { attackSpeedPct: 10, critChance: 5 },
            icon: 'ra-cyclone'
        }
    ],
    earthbind_totem: [
        {
            id: 'et_root', name: 'Deep Roots', max: 5, reqBaseLevel: 15,
            desc: '+1s root duration.',
            masteryPerk: 'Earthbind Totem also reduces target armor by 20%.',
            mod: { rootDur: 1 },
            icon: 'ra-oak-leaf'
        },
        {
            id: 'et_stone', name: 'Petrify', max: 5, reqBaseLevel: 20,
            desc: '+20% Slow effect and +10% Armor.',
            masteryPerk: 'Earthbind Totem now has a 10% chance to turn enemies to stone for 2s.',
            mod: { slowPct: 20, pctArmor: 10 },
            icon: 'ra-mountains'
        }
    ],
    healing_spring: [
        {
            id: 'hs_restorative', name: 'Fresh Spring', max: 5, reqBaseLevel: 20,
            desc: '+15% Healing per tick.',
            masteryPerk: 'Healing Spring also restores 1% Mana per second.',
            mod: { pctHeal: 15 },
            icon: 'ra-heart-burn'
        },
        {
            id: 'hs_pure', name: 'Pure Water', max: 5, reqBaseLevel: 25,
            desc: '+10% All Res and +5% Damage Reduction for healed targets.',
            masteryPerk: 'Healing Spring now removes 1 debuff from all allies every 3s.',
            mod: { allRes: 10, drPct: 5 },
            icon: 'ra-water-drop'
        }
    ],
    totemic_recall: [
        {
            id: 'tr_spirit', name: 'Ancestral Gift', max: 5, reqBaseLevel: 25,
            desc: '+10% Mana restored on recall.',
            masteryPerk: 'Totemic Recall has a 50% chance to not trigger its cooldown.',
            mod: { manaPct: 10 },
            icon: 'ra-sun-glow'
        },
        {
            id: 'tr_rebirth', name: 'Spirit Rebirth', max: 5, reqBaseLevel: 30,
            desc: 'Instantly heals you for 10% Max HP and restores 5% Mana.',
            masteryPerk: 'Totemic Recall now resets the cooldown of your shortest-CD elemental spell.',
            mod: { healPct: 10, manaPct: 5 },
            icon: 'ra-sun-glow'
        }
    ],
    totemic_wrath: [
        {
            id: 'tw_fury', name: 'Primal Wrath', max: 5, reqBaseLevel: 30,
            desc: '+10% elemental damage bonus.',
            masteryPerk: 'Totemic Wrath also grants 10% Critical Strike Chance.',
            mod: { dmgBonusPct: 10 },
            icon: 'ra-burning-embers'
        },
        {
            id: 'tw_spirit', name: 'Spirit Wrath', max: 5, reqBaseLevel: 35,
            desc: '+15% Damage and +10% Attack Speed for allies.',
            masteryPerk: 'Totemic Wrath now calls down a spirit beast to aid you for 10s.',
            mod: { dmgPct: 15, attackSpeedPct: 10 },
            icon: 'ra-wolf-head'
        }
    ],

    // --- RESTORATION TREE ---
    healing_wave: [
        {
            id: 'hw_overflow', name: 'Overflow', max: 5, reqBaseLevel: 1,
            desc: '+10% Healing and +10% range.',
            masteryPerk: 'Healing Wave also restores 5% of the target\'s maximum mana.',
            mod: { pctHeal: 10 },
            icon: 'ra-droplet'
        },
        {
            id: 'hw_surge', name: 'Tidal Surge', max: 5, reqBaseLevel: 5,
            desc: '+20% Healing and +10% Crit heal chance.',
            masteryPerk: 'Healing Wave now bounces to 1 additional target for 50% healing.',
            mod: { pctHeal: 20, critHealChance: 10 },
            icon: 'ra-water-drop'
        }
    ],
    water_shield: [
        {
            id: 'ws_clarity', name: 'Pure Water', max: 5, reqBaseLevel: 1,
            desc: '+1 globe and +10% mana restoration.',
            masteryPerk: 'While Water Shield is active, you are immune to mana burn.',
            mod: { extraGlobes: 1 },
            icon: 'ra-shield'
        },
        {
            id: 'ws_overflow', name: 'Overflowing Shield', max: 5, reqBaseLevel: 5,
            desc: '+5% Mana regen and +5% Healing received.',
            masteryPerk: 'Water Shield now releases a water nova when a globe is consumed.',
            mod: { manaRegenPct: 5, healReceivedPct: 5 },
            icon: 'ra-waves-pulse'
        }
    ],
    resto_mastery: [
        {
            id: 'rm_ascension', name: 'Master Healer', max: 5, reqBaseLevel: 5,
            desc: '+5% Healing power and +2 HP regen.',
            masteryPerk: 'Your healing spells have a 10% chance to restore 10% Mana.',
            mod: { pctHeal: 5, hpRegen: 2 },
            icon: 'ra-heartburn'
        },
        {
            id: 'rm_tide', name: 'Tidal Mastery', max: 5, reqBaseLevel: 10,
            desc: '+10% Mana regen and +5% Healing power.',
            masteryPerk: 'Your healing spells now grant 10% increased movement speed to the target.',
            mod: { manaRegenPct: 10, pctHeal: 5 },
            icon: 'ra-water-drop'
        }
    ],
    earth_shield: [
        {
            id: 'es_hardened', name: 'Granite Barrier', max: 5, reqBaseLevel: 5,
            desc: '+2 charges and +10% heal per charge.',
            masteryPerk: 'Earth Shield also grants +20% Armor to the target.',
            mod: { extraCharges: 2 },
            icon: 'ra-shield'
        },
        {
            id: 'es_fortress', name: 'Earth Fortress', max: 5, reqBaseLevel: 10,
            desc: '+15% Armor and +5% Damage Reduction while active.',
            masteryPerk: 'Earth Shield now grants immunity to knockback effects.',
            mod: { pctArmor: 15, drPct: 5 },
            icon: 'ra-castle-flag'
        }
    ],
    healing_stream_totem: [
        {
            id: 'hst_triage', name: 'Life Stream', max: 5, reqBaseLevel: 10,
            desc: '+15% Healing speed.',
            masteryPerk: 'Healing Stream now heals 2 targets at once.',
            mod: { ratePct: 15 },
            icon: 'ra-heartburn'
        },
        {
            id: 'hst_pure', name: 'Purifying Stream', max: 5, reqBaseLevel: 15,
            desc: '+10% Healing and +10% All Res for targets.',
            masteryPerk: 'Healing Stream now also restores 1% Mana to targets.',
            mod: { pctHeal: 10, allRes: 10 },
            icon: 'ra-water-drop'
        }
    ],
    chain_heal: [
        {
            id: 'ch_spirit_link', name: 'Spirit Link', max: 5, reqBaseLevel: 15,
            desc: '+1 extra jump per level.',
            masteryPerk: 'Chain Heal reduces damage taken by 10% for 3s.',
            mod: { extraJumps: 1 },
            icon: 'ra-chain'
        },
        {
            id: 'ch_tide', name: 'Tidal Chain', max: 5, reqBaseLevel: 20,
            desc: '+15% Healing and +10% Range.',
            masteryPerk: 'Chain Heal now also applies a small HoT to each target hit.',
            mod: { pctHeal: 15, rangePct: 10 },
            icon: 'ra-water-drop'
        }
    ],
    mana_tide: [
        {
            id: 'mt_surge', name: 'Aether Tide', max: 5, reqBaseLevel: 20,
            desc: '+15% Mana restored per second.',
            masteryPerk: 'Mana Tide Totem also increases Cast Speed by 20%.',
            mod: { manaPct: 15 },
            icon: 'ra-sun-glow'
        },
        {
            id: 'mt_ocean', name: 'Ocean Tide', max: 5, reqBaseLevel: 25,
            desc: '+20% Mana restoration and +10% Radius.',
            masteryPerk: 'Mana Tide Totem now increases the damage of all nearby allies by 15%.',
            mod: { manaPct: 20, radiusPct: 10 },
            icon: 'ra-water-drop'
        }
    ],
    nature_swiftness: [
        {
            id: 'ns_quickness', name: 'Ancestral Swiftness', max: 5, reqBaseLevel: 25,
            desc: 'Reduces cooldown by 10s.',
            masteryPerk: 'After using Nature\'s Swiftness, your next spell deals 50% more damage.',
            mod: { cdRed: 10 },
            icon: 'ra-fast-forward'
        },
        {
            id: 'ns_harmony', name: 'Natural Harmony', max: 5, reqBaseLevel: 30,
            desc: '+10% All Res and +10% Cast Speed for 5s.',
            masteryPerk: 'Nature\'s Swiftness now makes your next 3 spells cast instantly.',
            mod: { allRes: 10, castSpeedPct: 10 },
            icon: 'ra-oak-leaf'
        }
    ],
    ancestral_spirit: [
        {
            id: 'as_resilience', name: 'Spirit Resilience', max: 5, reqBaseLevel: 30,
            desc: 'Resurrected allies have +10% HP and Armor.',
            masteryPerk: 'Ancestral Spirit cooldown is reduced by 20%.',
            mod: { pctHP: 10, pctArmor: 10 },
            icon: 'ra-angel-wings'
        },
        {
            id: 'as_echo', name: 'Ancestral Echo', max: 5, reqBaseLevel: 35,
            desc: '+20% HP and Mana on resurrection.',
            masteryPerk: 'Ancestral Spirit now has a 20% chance to cast itself automatically when an ally dies.',
            mod: { pctHP: 20, pctMP: 20 },
            icon: 'ra-ghost'
        }
    ]
};
