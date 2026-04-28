export const RANGER_MUTATIONS = {
    // --- ARCHERY TREE ---
    ice_arrow: [
        {
            id: 'ia_frostbite', name: 'Frostbite', max: 5, reqBaseLevel: 1,
            desc: '+10% Cold Damage and +0.5s slow duration.',
            masteryPerk: 'Ice Arrow shatters on impact, slowing enemies within a 3m radius.',
            mod: { pctDmg: 10, slowDur: 0.5 },
            icon: 'ra-frostfire'
        },
        {
            id: 'ia_deep_freeze', name: 'Deep Freeze', max: 5, reqBaseLevel: 5,
            desc: '5% chance per level to freeze the target solid for 2s.',
            masteryPerk: 'Frozen targets take 20% increased physical damage from your attacks.',
            mod: { freezeChance: 5 },
            icon: 'ra-ice-cube'
        }
    ],
    magic_arrow: [
        {
            id: 'ma_pierce', name: 'Ethereal Pierce', max: 5, reqBaseLevel: 1,
            desc: '+10% Magic Damage and 10% chance to pierce per level.',
            masteryPerk: 'Magic Arrow refunds its mana cost on a critical strike.',
            mod: { pctDmg: 10, pierceChance: 10 },
            icon: 'ra-arrow-flights'
        }
    ],
    immolation_arrow: [
        {
            id: 'ima_napalm', name: 'White Phosphorus', max: 5, reqBaseLevel: 1,
            desc: '+15% Burning damage and +1s ground fire duration.',
            masteryPerk: 'Enemies standing in the fire have their fire resistance reduced by 15%.',
            mod: { burnDmg: 15, duration: 1 },
            icon: 'ra-small-fire'
        }
    ],
    bow_mastery: [
        {
            id: 'bm_precision', name: 'Hawkeye', max: 5, reqBaseLevel: 1,
            desc: '+5% Bow damage and +10% Attack Rating bonus.',
            masteryPerk: 'Bow Mastery increases your attack range by 15%.',
            mod: { bowDmg: 5, arBonus: 10 },
            icon: 'ra-bullseye'
        }
    ],
    piercing_arrow: [
        {
            id: 'pa_shred', name: 'Jagged Tip', max: 5, reqBaseLevel: 5,
            desc: 'Adds 10% bleed damage per level to all targets hit.',
            masteryPerk: 'Piercing Arrow damage no longer reduces per target hit.',
            mod: { bleedDmg: 10 },
            icon: 'ra-broadhead'
        }
    ],
    multi_shot: [
        {
            id: 'ms_rain', name: 'Arrow Rain', max: 5, reqBaseLevel: 5,
            desc: '+1 extra arrow per level.',
            masteryPerk: 'Arrows now rain from the sky onto the target area, ignoring line of sight.',
            mod: { extraArrows: 1 },
            icon: 'ra-arrow-cluster'
        },
        {
            id: 'ms_broadhead', name: 'Broadhead', max: 5, reqBaseLevel: 10,
            desc: '+10% Knockback per level and +5% Physical Damage.',
            masteryPerk: 'Cripple: Hits reduce enemy movement speed by 30% for 3s.',
            mod: { knockbackPct: 10, pctDmg: 5 },
            icon: 'ra-broadhead'
        }
    ],
    hunters_mark: [
        {
            id: 'hm_exposed', name: 'Exposed Weakness', max: 5, reqBaseLevel: 5,
            desc: '+5% Damage vulnerability bonus.',
            masteryPerk: 'Attacking a Marked target restores 2% of your maximum mana.',
            mod: { dmgAmpPct: 5 },
            icon: 'ra-broken-heart'
        }
    ],
    explosive_arrow: [
        {
            id: 'ea_cluster', name: 'Cluster Bomb', max: 5, reqBaseLevel: 10,
            desc: '+15% Explosion radius and +10% Fire Damage.',
            masteryPerk: 'Drops 3 mini-bombs upon explosion that detonate for 30% damage.',
            mod: { radiusPct: 15, pctDmg: 10 },
            icon: 'ra-bomb-explosion'
        }
    ],
    rapid_fire: [
        {
            id: 'rf_haste', name: 'Frenzied Volley', max: 5, reqBaseLevel: 10,
            desc: '+10% Attack Speed bonus and +1s duration.',
            masteryPerk: 'During Rapid Fire, your arrows have a 15% chance to double-fire.',
            mod: { iasPct: 10 },
            icon: 'ra-lightning-trio'
        }
    ],
    guided_arrow: [
        {
            id: 'ga_precision', name: 'Hunter\'s Precision', max: 5, reqBaseLevel: 15,
            desc: '+10% Crit Chance and +15% Crit Multi.',
            masteryPerk: 'Guided Arrow always hits the target\'s weakest point, ignoring 30% armor.',
            mod: { critChance: 10, critMulti: 15 },
            icon: 'ra-bullseye'
        }
    ],
    volley: [
        {
            id: 'vo_heavy', name: 'Iron Rain', max: 5, reqBaseLevel: 15,
            desc: '+10% Damage and +1s duration.',
            masteryPerk: 'Volley has a 20% chance to stun enemies for 0.5s on every tick.',
            mod: { pctDmg: 10 },
            icon: 'ra-arrow-cluster'
        }
    ],
    strafe: [
        {
            id: 'st_relentless', name: 'Relentless Assault', max: 5, reqBaseLevel: 20,
            desc: '+1 additional target per level and +5% Attack Speed.',
            masteryPerk: 'Strafe applies Hunter\'s Mark to all enemies hit.',
            mod: { extraTargets: 1, pctIAS: 5 },
            icon: 'ra-blaster'
        }
    ],

    // --- TRAPS TREE ---
    frost_trap: [
        {
            id: 'ft_snap_freeze', name: 'Snap Freeze', max: 5, reqBaseLevel: 1,
            desc: '+1s Freeze duration per level.',
            masteryPerk: 'Enemies near the trap are chilled (50% slow) for 4s when it triggers.',
            mod: { freezeDur: 1 },
            icon: 'ra-crystals'
        }
    ],
    trap_mastery_r: [
        {
            id: 'tmr_expert', name: 'Trap Specialist', max: 5, reqBaseLevel: 1,
            desc: '+10% Trap damage and +5% Trap trigger radius.',
            masteryPerk: 'Trap Mastery reduces the cooldown of all traps by 20%.',
            mod: { trapDmg: 10, radiusPct: 5 },
            icon: 'ra-wrench'
        }
    ],
    ensnare: [
        {
            id: 'en_barb', name: 'Barbed Nets', max: 5, reqBaseLevel: 5,
            desc: 'Ensnared targets take 20% weapon damage per second.',
            masteryPerk: 'Movement through the net causes a 10% chance to stun for 1s.',
            mod: { bleedDmg: 20 },
            icon: 'ra-tangled-typy'
        }
    ],
    immolation_trap: [
        {
            id: 'it_napalm', name: 'Inferno Oil', max: 5, reqBaseLevel: 5,
            desc: '+15% Fire Damage and +1s duration per level.',
            masteryPerk: 'Fire pool damage stacks up to 3 times on enemies that stay within it.',
            mod: { pctDmg: 15, duration: 1 },
            icon: 'ra-large-fire'
        }
    ],
    viper_arrow: [
        {
            id: 'va_toxin', name: 'Deadly Injection', max: 5, reqBaseLevel: 5,
            desc: '+15% Poison damage and +2s duration.',
            masteryPerk: 'Viper Arrow explosion radius increased by 100%.',
            mod: { poisDmgPct: 15 },
            icon: 'ra-cobra'
        }
    ],
    lightning_sentry: [
        {
            id: 'ls_overcharge', name: 'Overcharge', max: 5, reqBaseLevel: 10,
            desc: '+10% Lightning Damage and +1 shot before expiring.',
            masteryPerk: 'Lightning bolts chain to 2 additional targets for 50% damage.',
            mod: { pctDmg: 10, extraShots: 1 },
            icon: 'ra-lightning-trio'
        }
    ],
    death_sentry: [
        {
            id: 'ds_macabre', name: 'Macabre Radius', max: 5, reqBaseLevel: 15,
            desc: '+15% Corpse Explosion radius per level.',
            masteryPerk: 'Explosions heal you for 5% of your maximum health.',
            mod: { radiusPct: 15 },
            icon: 'ra-skull'
        }
    ],
    snake_trap: [
        {
            id: 'sn_venom', name: 'Deadly Venom', max: 5, reqBaseLevel: 10,
            desc: '+20% Poison damage for the summoned snakes.',
            masteryPerk: 'Snake bites reduce the target\'s attack speed by 20% for 3s.',
            mod: { petDmgPct: 20 },
            icon: 'ra-cobra'
        }
    ],
    explosive_trap: [
        {
            id: 'et_shrapnel', name: 'Shrapnel Landmine', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage per level.',
            masteryPerk: 'Enemies hit bleed for 50% of the trap\'s damage over 5 seconds.',
            mod: { pctDmg: 20 },
            icon: 'ra-dynamite'
        }
    ],
    ice_trap: [
        {
            id: 'it_shiver', name: 'Glacial Burst', max: 5, reqBaseLevel: 15,
            desc: '+15% Cold Damage and +1s freeze.',
            masteryPerk: 'Ice Trap leaves a frozen path that slows enemies by 50%.',
            mod: { pctDmg: 15 },
            icon: 'ra-snowflake'
        }
    ],
    trap_launcher: [
        {
            id: 'tl_range', name: 'Long Toss', max: 5, reqBaseLevel: 25,
            desc: '+2m throw range per level.',
            masteryPerk: 'Traps now trigger 50% faster after landing.',
            mod: { throwRange: 2 },
            icon: 'ra-fast-forward'
        }
    ],

    // --- NATURE TREE ---
    companion_hawk: [
        {
            id: 'ch_razor_beak', name: 'Razor Beak', max: 5, reqBaseLevel: 1,
            desc: '+15% Hawk Damage and +5% chance to blind per level.',
            masteryPerk: 'The hawk now dives every 5 seconds, dealing AoE damage.',
            mod: { petDmgPct: 15, blindChance: 5 },
            icon: 'ra-eagle-emblem'
        }
    ],
    tracking: [
        {
            id: 'tr_scout', name: 'Pathfinder', max: 5, reqBaseLevel: 1,
            desc: '+3% Move Speed and +5% Damage vs Marked.',
            masteryPerk: 'Tracking also grants you 20% increased vision radius.',
            mod: { moveSpeed: 3, dmgBonusPct: 5 },
            icon: 'ra-eye-shield'
        }
    ],
    nature_mastery: [
        {
            id: 'nm_affinity', name: 'Wild Resonance', max: 5, reqBaseLevel: 1,
            desc: '+5% Poison and Lightning damage.',
            masteryPerk: 'Your pets inherit 20% of your critical strike chance.',
            mod: { pctPoisonDmg: 5, pctLightDmg: 5 },
            icon: 'ra-oak-leaf'
        }
    ],
    aspect_hawk: [
        {
            id: 'ah_focus', name: 'Eagle Eye', max: 5, reqBaseLevel: 5,
            desc: '+10% Ranged Damage and +2% Crit Chance.',
            masteryPerk: 'During Aspect of the Hawk, your attacks have +50% Pierce chance.',
            mod: { rangedDmg: 10, critChance: 2 },
            icon: 'ra-eagle-emblem'
        }
    ],
    mark_death: [
        {
            id: 'md_fatal', name: 'Marked for Doom', max: 5, reqBaseLevel: 5,
            desc: '+10% damage bonus from pets.',
            masteryPerk: 'Killing a Marked target restores 10% of your maximum health.',
            mod: { petDmgAmp: 10 },
            icon: 'ra-skull'
        }
    ],
    bear_companion: [
        {
            id: 'bc_iron_hide', name: 'Iron Hide', max: 5, reqBaseLevel: 10,
            desc: '+15% Bear HP and +10% Bear Armor per level.',
            masteryPerk: 'The Bear periodically casts a taunt, forcing nearby enemies to attack it.',
            mod: { petHpPct: 15, petArmorPct: 15 },
            icon: 'ra-bear-head'
        }
    ],
    aspect_cheetah: [
        {
            id: 'ac_pounce', name: 'Cheetah\'s Pounce', max: 5, reqBaseLevel: 10,
            desc: '+5% Movement Speed bonus.',
            masteryPerk: 'While in Aspect of the Cheetah, you have 20% increased Dodge chance.',
            mod: { moveSpeed: 5 },
            icon: 'ra-fast-forward'
        }
    ],
    wolf_companion: [
        {
            id: 'wc_bloodthirst', name: 'Alpha Ferocity', max: 5, reqBaseLevel: 15,
            desc: '+10% Wolf Attack Speed and Damage per level.',
            masteryPerk: 'Wolves heal for 20% of the damage they deal.',
            mod: { petDmgPct: 10, petIasPct: 10 },
            icon: 'ra-wolf-howl'
        }
    ],
    bestial_wrath: [
        {
            id: 'bw_primal', name: 'Primal Rage', max: 5, reqBaseLevel: 20,
            desc: '+2s duration and +10% damage bonus.',
            masteryPerk: 'During Bestial Wrath, your pets regenerate 5% HP per second.',
            mod: { duration: 2, pctDmg: 10 },
            icon: 'ra-burning-embers'
        }
    ],
    spirit_bond: [
        {
            id: 'sb_unity', name: 'Wild Unity', max: 5, reqBaseLevel: 25,
            desc: '+2% redirection and +1% life steal share.',
            masteryPerk: 'Spirit Bond increases all pet attributes by 10%.',
            mod: { redirectPct: 2 },
            icon: 'ra-heartburn'
        }
    ]
};
