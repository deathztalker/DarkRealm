export const SHAMAN_MUTATIONS = {
    lightning_bolt: [
        {
            id: 'lb_fork', name: 'Forked Lightning', max: 5,
            desc: 'Lightning Bolt splits into 1 additional target.',
            masteryPerk: 'Targets hit by forks are Shocked, taking 15% increased lightning damage.',
            mod: { extraTargets: 1 },
            icon: 'ra-lightning-storm'
        },
        {
            id: 'lb_overload', name: 'Static Overload', max: 5,
            desc: '+10% chance to cast a second bolt for free.',
            masteryPerk: 'Triple Cast: The free bolt can trigger a third bolt (5% chance).',
            mod: { multiCastChance: 10 },
            icon: 'ra-lightning-trio'
        }
    ],
    flame_shock: [
        {
            id: 'fs_blaze', name: 'Blaze', max: 5,
            desc: '+15% Damage and +2s DoT duration.',
            masteryPerk: 'Flame Shock critical hits refresh the DoT duration.',
            mod: { pctDmg: 15, duration: 2 },
            icon: 'ra-large-fire'
        }
    ],
    frost_shock: [
        {
            id: 'fs_chill', name: 'Deep Chill', max: 5,
            desc: '+15% Damage and +10% Slow.',
            masteryPerk: 'Frost Shock now freezes the target for 1.5s.',
            mod: { pctDmg: 15, slowPct: 10 },
            icon: 'ra-ice-cube'
        }
    ],
    chain_lightning: [
        {
            id: 'cl_surge', name: 'Voltage Surge', max: 5,
            desc: '+1 Bounce and +10% Damage.',
            masteryPerk: 'Chain Lightning deals 20% more damage for every bounce.',
            mod: { maxBounces: 1, pctDmg: 10 },
            icon: 'ra-lightning-bolt'
        }
    ],
    thunder_strike: [
        {
            id: 'ts_storm', name: 'Stormcloud', max: 5,
            desc: '+15% Damage and +10% Radius.',
            masteryPerk: 'Thunder Strike creates a small thunderstorm that follows you.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-lightning-storm'
        }
    ],
    lava_burst: [
        {
            id: 'lb_eruption', name: 'Magma Eruption', max: 5,
            desc: '+20% Damage and +10% Splash radius.',
            masteryPerk: 'Lava Burst has 10% chance to trigger Earthquake on hit.',
            mod: { pctDmg: 20, splashRadius: 10 },
            icon: 'ra-volcano'
        }
    ],
    earthquake: [
        {
            id: 'eq_tectonic', name: 'Tectonic Shift', max: 5,
            desc: '+15% Area of Effect per level.',
            masteryPerk: 'Creates a fissure that pulls nearby enemies into the center.',
            mod: { aoeRadiusPct: 15 },
            icon: 'ra-mountains'
        },
        {
            id: 'eq_stone', name: 'Stone Skin', max: 5,
            desc: '+10% Armor while standing in the earthquake.',
            masteryPerk: 'You are Unstoppable while standing within the Earthquake radius.',
            mod: { armorPct: 10 },
            icon: 'ra-stone-tower'
        }
    ],
    bloodlust: [
        {
            id: 'bl_ferocity', name: 'Ancestral Ferocity', max: 5,
            desc: '+5% Attack Speed bonus and +2s duration.',
            masteryPerk: 'Bloodlust now also grants +20% Life Steal.',
            mod: { speedBonus: 5, duration: 2 },
            icon: 'ra-wolf-howl'
        }
    ],
    searing_totem: [
        {
            id: 'st_multi', name: 'Echoing Spirits', max: 1,
            desc: 'Place 2 Searing Totems at once.',
            masteryPerk: 'Totems now share 20% of your current fire resistance as bonus damage.',
            mod: { extraTotems: 1 },
            icon: 'ra-totem'
        },
        {
            id: 'st_mobile', name: 'Ancestral Bond', max: 5,
            desc: 'Totems have +20% HP and Duration.',
            masteryPerk: 'Mobile Totems: Totems now hover and follow you slowly.',
            mod: { minionHp: 20, minionDur: 20 },
            icon: 'ra-incense'
        }
    ],
    stoneskin_totem: [
        {
            id: 'sst_fortress', name: 'Iron Fortress', max: 5,
            desc: '+10% DR bonus and +10% Radius.',
            masteryPerk: 'Stoneskin Totem also grants immunity to Knockback.',
            mod: { drBonus: 10, radiusPct: 10 },
            icon: 'ra-heavy-shield'
        }
    ],
    tremor_totem: [
        {
            id: 'tt_pulse', name: 'Rapid Pulse', max: 5,
            desc: '-0.2s Pulse interval and +20% Radius.',
            masteryPerk: 'Tremor Totem also pulses a heal for 5% max HP.',
            mod: { intervalRed: 0.2, radiusPct: 20 },
            icon: 'ra-wave'
        }
    ],
    magma_totem: [
        {
            id: 'mt_inferno', name: 'Infernal Pulse', max: 5,
            desc: '+15% Damage and +10% Radius.',
            masteryPerk: 'Magma Totem has 10% chance to cast Fireball every pulse.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-large-fire'
        }
    ],
    windfury_totem: [
        {
            id: 'wt_gale', name: 'Gale Force', max: 5,
            desc: '+5% extra attack chance and +10% Damage.',
            masteryPerk: 'Windfury procs also grant +10% Movement Speed.',
            mod: { procChance: 5, dmgPct: 10 },
            icon: 'ra-whirlwind'
        }
    ],
    earthbind_totem: [
        {
            id: 'et_quicksand', name: 'Quicksand', max: 5,
            desc: '+10% Slow and +20% Radius.',
            masteryPerk: 'Enemies rooted by the totem take 20% more damage.',
            mod: { slowPct: 10, radiusPct: 20 },
            icon: 'ra-mountains'
        }
    ],
    healing_spring: [
        {
            id: 'hs_tide', name: 'High Tide', max: 5,
            desc: '+15% Healing and +10% Radius.',
            masteryPerk: 'Healing Spring also restores 2% Mana per second.',
            mod: { healPct: 15, radiusPct: 10 },
            icon: 'ra-water-drop'
        }
    ],
    totemic_recall: [
        {
            id: 'tr_spirit', name: 'Spirit Return', max: 5,
            desc: '+5% Mana restore and -2s Cooldown.',
            masteryPerk: 'Recalling totems reduces all other skill CDs by 1s.',
            mod: { manaPct: 5, cdRed: 2 },
            icon: 'ra-cycle'
        }
    ],
    healing_wave: [
        {
            id: 'hw_surge', name: 'Healing Surge', max: 5,
            desc: '+15% Healing and -10% Mana cost.',
            masteryPerk: 'Healing Wave critical heals shield the target for 5s.',
            mod: { healPct: 15, manaRed: 10 },
            icon: 'ra-health'
        }
    ],
    water_shield: [
        {
            id: 'ws_orb', name: 'Oceanic Orb', max: 5,
            desc: '+1 Globe and +10 Mana per globe.',
            masteryPerk: 'While Water Shield is active, gain 10% damage reduction.',
            mod: { extraGlobes: 1, manaBonus: 10 },
            icon: 'ra-water-drop'
        }
    ],
    earth_shield: [
        {
            id: 'es_protection', name: 'Stone Aegis', max: 5,
            desc: '+10% Healing per charge and +2 charges.',
            masteryPerk: 'Earth Shield grants 5% Damage Reduction per active charge.',
            mod: { healPct: 10, extraCharges: 2 },
            icon: 'ra-stone-tower'
        }
    ],
    healing_stream_totem: [
        {
            id: 'hst_mist', name: 'Soothing Mist', max: 5,
            desc: '+15% Healing and +10% Radius.',
            masteryPerk: 'Healing Stream now heals 2 allies at once.',
            mod: { healPct: 15, radiusPct: 10 },
            icon: 'ra-water-drop'
        }
    ],
    chain_heal: [
        {
            id: 'ch_spirit', name: 'Spiritual Chain', max: 5,
            desc: '+1 Bounce and +10% Healing.',
            masteryPerk: 'Chain Heal bounces no longer lose effectiveness.',
            mod: { maxBounces: 1, healPct: 10 },
            icon: 'ra-chain'
        }
    ],
    mana_tide: [
        {
            id: 'mt_fountain', name: 'Mana Fountain', max: 5,
            desc: '+15% Mana regen and +10% Radius.',
            masteryPerk: 'Mana Tide also reduces active skill mana costs by 10%.',
            mod: { manaRegenPct: 15, radiusPct: 10 },
            icon: 'ra-water-drop'
        }
    ],
    ancestral_spirit: [
        {
            id: 'as_guide', name: 'Guardian Guide', max: 5,
            desc: '+10% HP restore and -5s Cooldown.',
            masteryPerk: 'Resurrected allies are invulnerable for 2s.',
            mod: { hpRestorePct: 10, cdRed: 5 },
            icon: 'ra-angel-wings'
        }
    ]
};
