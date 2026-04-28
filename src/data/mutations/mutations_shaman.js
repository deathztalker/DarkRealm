export const SHAMAN_MUTATIONS = {
    // --- ELEMENTS TREE ---
    lightning_bolt: [
        {
            id: 'lb_static', name: 'Static Discharge', max: 5, reqBaseLevel: 1,
            desc: '+10% Lightning Damage and +10% chance to shock.',
            masteryPerk: 'Lightning Bolt now leaves a static field that shocks nearby enemies.',
            mod: { pctDmg: 10, shockChance: 10 },
            icon: 'ra-lightning-bolt'
        }
    ],
    flame_shock: [
        {
            id: 'fs_blaze', name: 'Searing Flame', max: 5, reqBaseLevel: 1,
            desc: '+15% Burn damage per level.',
            masteryPerk: 'Flame Shock critical strikes restore 2% Mana.',
            mod: { burnDmgPct: 15 },
            icon: 'ra-small-fire'
        }
    ],
    elem_mastery: [
        {
            id: 'em_convergence', name: 'Primal Convergence', max: 5, reqBaseLevel: 5,
            desc: '+5% to all elements damage per level.',
            masteryPerk: 'Elemental spells have a 10% chance to trigger an Elemental Overload (free cast).',
            mod: { pctElemDmg: 5 },
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
        }
    ],
    chain_lightning: [
        {
            id: 'cl_overload', name: 'Overload', max: 5, reqBaseLevel: 10,
            desc: '+1 extra jump per level.',
            masteryPerk: 'Chain Lightning has a 10% chance to strike the target twice.',
            mod: { extraJumps: 1 },
            icon: 'ra-lightning-fury'
        }
    ],
    thunder_strike: [
        {
            id: 'ts_crash', name: 'Rolling Thunder', max: 5, reqBaseLevel: 10,
            desc: '+20% Damage and +10% stun chance.',
            masteryPerk: 'Thunder Strike resets the cooldown of Lightning Bolt.',
            mod: { pctDmg: 20 },
            icon: 'ra-lightning-trio'
        }
    ],
    elemental_focus: [
        {
            id: 'ef_clarity', name: 'Primal Clarity', max: 5, reqBaseLevel: 15,
            desc: 'Increases crit chance with elemental spells by 2% per level.',
            masteryPerk: 'Elemental Focus also increases your Critical Strike Multiplier by 25%.',
            mod: { critChance: 2 },
            icon: 'ra-eye-shield'
        }
    ],
    lava_burst: [
        {
            id: 'lb_molten', name: 'Molten Core', max: 5, reqBaseLevel: 15,
            desc: '+15% Fire Damage and +10% splash radius.',
            masteryPerk: 'Lava Burst leaves a pool of lava for 3s.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-flame-symbol'
        }
    ],
    earthquake: [
        {
            id: 'eq_tectonic', name: 'Tectonic Shift', max: 5, reqBaseLevel: 20,
            desc: '+15% Earthquake radius and +1s duration.',
            masteryPerk: 'Earthquake has a 10% chance per tick to stun enemies for 1s.',
            mod: { radiusPct: 15, duration: 1 },
            icon: 'ra-mountains'
        }
    ],
    storm_caller: [
        {
            id: 'sc_thunder', name: 'Great Storm', max: 5, reqBaseLevel: 25,
            desc: '+10% Lightning Damage and +1 target hit by Nova.',
            masteryPerk: 'Storm Caller increases your movement speed by 20% during storms.',
            mod: { pctLightDmg: 10 },
            icon: 'ra-lightning-fury'
        }
    ],
    bloodlust: [
        {
            id: 'bl_fervor', name: 'Primal Haste', max: 5, reqBaseLevel: 30,
            desc: '+5% haste bonus and +2s duration.',
            masteryPerk: 'During Bloodlust, all party members are immune to fear.',
            mod: { iasPct: 5 },
            icon: 'ra-burning-embers'
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
        }
    ],
    stoneskin_totem: [
        {
            id: 'st_hardened', name: 'Obsidian Skin', max: 5, reqBaseLevel: 1,
            desc: '+10% physical damage reduction bonus.',
            masteryPerk: 'Stoneskin Totem also increases Armor by 30%.',
            mod: { drPct: 10 },
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
        }
    ],
    tremor_totem: [
        {
            id: 'tt_shiver', name: 'Seismic Wave', max: 5, reqBaseLevel: 5,
            desc: 'Totem pulses 1s faster.',
            masteryPerk: 'Tremor Totem also has a 20% chance to stun nearby enemies.',
            mod: { ratePct: 10 },
            icon: 'ra-waves-pulse'
        }
    ],
    magma_totem: [
        {
            id: 'mt_eruption', name: 'Magma Fountain', max: 5, reqBaseLevel: 10,
            desc: '+20% Pulse damage.',
            masteryPerk: 'Magma Totem has a 30% chance to cast Lava Burst on hit.',
            mod: { pctDmg: 20 },
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
        }
    ],
    earthbind_totem: [
        {
            id: 'et_root', name: 'Deep Roots', max: 5, reqBaseLevel: 15,
            desc: '+1s root duration.',
            masteryPerk: 'Earthbind Totem also reduces target armor by 20%.',
            mod: { rootDur: 1 },
            icon: 'ra-oak-leaf'
        }
    ],
    healing_spring: [
        {
            id: 'hs_restorative', name: 'Fresh Spring', max: 5, reqBaseLevel: 20,
            desc: '+15% Healing per tick.',
            masteryPerk: 'Healing Spring also restores 1% Mana per second.',
            mod: { pctHeal: 15 },
            icon: 'ra-heartburn'
        }
    ],
    totemic_recall: [
        {
            id: 'tr_spirit', name: 'Ancestral Gift', max: 5, reqBaseLevel: 25,
            desc: '+10% Mana restored on recall.',
            masteryPerk: 'Totemic Recall has a 50% chance to not trigger its cooldown.',
            mod: { manaPct: 10 },
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
        }
    ],
    water_shield: [
        {
            id: 'ws_clarity', name: 'Pure Water', max: 5, reqBaseLevel: 1,
            desc: '+1 globe and +10% mana restoration.',
            masteryPerk: 'While Water Shield is active, you are immune to mana burn.',
            mod: { extraGlobes: 1 },
            icon: 'ra-shield'
        }
    ],
    resto_mastery: [
        {
            id: 'rm_ascension', name: 'Master Healer', max: 5, reqBaseLevel: 5,
            desc: '+5% Healing power and +2 HP regen.',
            masteryPerk: 'Your healing spells have a 10% chance to restore 10% Mana.',
            mod: { pctHeal: 5, hpRegen: 2 },
            icon: 'ra-heartburn'
        }
    ],
    earth_shield: [
        {
            id: 'es_hardened', name: 'Granite Barrier', max: 5, reqBaseLevel: 5,
            desc: '+2 charges and +10% heal per charge.',
            masteryPerk: 'Earth Shield also grants +20% Armor to the target.',
            mod: { extraCharges: 2 },
            icon: 'ra-shield'
        }
    ],
    healing_stream_totem: [
        {
            id: 'hst_triage', name: 'Life Stream', max: 5, reqBaseLevel: 10,
            desc: '+15% Healing speed.',
            masteryPerk: 'Healing Stream now heals 2 targets at once.',
            mod: { ratePct: 15 },
            icon: 'ra-heartburn'
        }
    ],
    chain_heal: [
        {
            id: 'ch_spirit_link', name: 'Spirit Link', max: 5, reqBaseLevel: 15,
            desc: '+1 extra jump per level.',
            masteryPerk: 'Chain Heal reduces damage taken by 10% for 3s.',
            mod: { extraJumps: 1 },
            icon: 'ra-chain'
        }
    ],
    mana_tide: [
        {
            id: 'mt_surge', name: 'Aether Tide', max: 5, reqBaseLevel: 20,
            desc: '+15% Mana restored per second.',
            masteryPerk: 'Mana Tide Totem also increases Cast Speed by 20%.',
            mod: { manaPct: 15 },
            icon: 'ra-sun-glow'
        }
    ],
    nature_swiftness: [
        {
            id: 'ns_quickness', name: 'Ancestral Swiftness', max: 5, reqBaseLevel: 25,
            desc: 'Reduces cooldown by 10s.',
            masteryPerk: 'After using Nature\'s Swiftness, your next spell deals 50% more damage.',
            mod: { cdRed: 10 },
            icon: 'ra-fast-forward'
        }
    ],
    ancestral_spirit: [
        {
            id: 'as_resilience', name: 'Spirit Resilience', max: 5, reqBaseLevel: 30,
            desc: 'Resurrected allies have +10% HP and Armor.',
            masteryPerk: 'Ancestral Spirit cooldown is reduced by 20%.',
            mod: { pctHP: 10, pctArmor: 10 },
            icon: 'ra-angel-wings'
        }
    ]
};
