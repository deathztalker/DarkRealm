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
        },
        {
            id: 'ma_resonance', name: 'Resonant Bolt', max: 5, reqBaseLevel: 5,
            desc: 'Hits cause the target to pulse for 20% magic damage after 1s.',
            masteryPerk: 'Resonance pulses now chain to one additional nearby enemy.',
            mod: { echoDmg: 20 },
            icon: 'ra-implosion'
        }
    ],
    immolation_arrow: [
        {
            id: 'im_napalm', name: 'White Phosphorus', max: 5, reqBaseLevel: 1,
            desc: '+15% Burning damage and +1s ground fire duration.',
            masteryPerk: 'Enemies standing in the fire have their fire resistance reduced by 15%.',
            mod: { burnDmg: 15, duration: 1 },
            icon: 'ra-small-fire'
        }
    ],
    piercing_arrow: [
        {
            id: 'pa_shred', name: 'Jagged Tip', max: 5, reqBaseLevel: 1,
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
    explosive_arrow: [
        {
            id: 'ea_cluster', name: 'Cluster Bomb', max: 5, reqBaseLevel: 5,
            desc: '+15% Explosion radius and +10% Fire Damage.',
            masteryPerk: 'Drops 3 mini-bombs upon explosion that detonate for 30% damage.',
            mod: { radiusPct: 15, pctDmg: 10 },
            icon: 'ra-bomb-explosion'
        }
    ],
    guided_arrow: [
        {
            id: 'ga_precision', name: 'Hunter\'s Precision', max: 5, reqBaseLevel: 10,
            desc: '+10% Crit Chance and +15% Crit Multi.',
            masteryPerk: 'Guided Arrow always hits the target\'s weakest point, ignoring 30% armor.',
            mod: { critChance: 10, critMulti: 15 },
            icon: 'ra-bullseye'
        }
    ],
    strafe: [
        {
            id: 'st_relentless', name: 'Relentless Assault', max: 5, reqBaseLevel: 10,
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
    ensnare: [
        {
            id: 'en_barb', name: 'Barbed Nets', max: 5, reqBaseLevel: 1,
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
    lightning_sentry: [
        {
            id: 'ls_overcharge', name: 'Overcharge', max: 5, reqBaseLevel: 5,
            desc: '+10% Lightning Damage and +1 shot before expiring.',
            masteryPerk: 'Lightning bolts chain to 2 additional targets for 50% damage.',
            mod: { pctDmg: 10, extraShots: 1 },
            icon: 'ra-lightning-trio'
        }
    ],
    death_sentry: [
        {
            id: 'ds_macabre', name: 'Macabre Radius', max: 5, reqBaseLevel: 10,
            desc: '+15% Corpse Explosion radius per level.',
            masteryPerk: 'Explosions heal you for 5% of your maximum health.',
            mod: { radiusPct: 15 },
            icon: 'ra-skull'
        }
    ],
    snake_trap: [
        {
            id: 'sn_venom', name: 'Deadly Venom', max: 5, reqBaseLevel: 5,
            desc: '+20% Poison damage for the summoned snakes.',
            masteryPerk: 'Snake bites reduce the target\'s attack speed by 20% for 3s.',
            mod: { petDmgPct: 20 },
            icon: 'ra-cobra'
        }
    ],
    explosive_trap: [
        {
            id: 'et_shrapnel', name: 'Shrapnel landmine', max: 5, reqBaseLevel: 10,
            desc: '+20% Damage per level.',
            masteryPerk: 'Enemies hit bleed for 50% of the trap\'s damage over 5 seconds.',
            mod: { pctDmg: 20 },
            icon: 'ra-dynamite'
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
    bear_companion: [
        {
            id: 'bc_iron_hide', name: 'Iron Hide', max: 5, reqBaseLevel: 5,
            desc: '+15% Bear HP and +10% Bear Armor per level.',
            masteryPerk: 'The Bear periodically casts a taunt, forcing nearby enemies to attack it.',
            mod: { petHpPct: 15, petArmorPct: 15 },
            icon: 'ra-bear-head'
        }
    ],
    wolf_companion: [
        {
            id: 'wc_bloodthirst', name: 'Alpha Ferocity', max: 5, reqBaseLevel: 10,
            desc: '+10% Wolf Attack Speed and Damage per level.',
            masteryPerk: 'Wolves heal for 20% of the damage they deal.',
            mod: { petDmgPct: 10, petIasPct: 10 },
            icon: 'ra-wolf-howl'
        }
    ],
    bestial_wrath: [
        {
            id: 'bw_primal', name: 'Primal Rage', max: 5, reqBaseLevel: 10,
            desc: '+2s duration and +10% damage bonus.',
            masteryPerk: 'During Bestial Wrath, your pets regenerate 5% HP per second.',
            mod: { duration: 2, pctDmg: 10 },
            icon: 'ra-burning-embers'
        }
    ]
};
