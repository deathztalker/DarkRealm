export const SORCERESS_MUTATIONS = {
    // --- FIRE TREE ---
    fire_bolt: [
        {
            id: 'fb_pierce', name: 'Searing Bolt', max: 5, reqBaseLevel: 1,
            desc: '+10% Damage and 10% chance to pierce.',
            masteryPerk: 'Fire Bolt now leaves a small flame on the ground dealing 30% damage.',
            mod: { pctDmg: 10, pierceChance: 10 },
            icon: 'ra-fire-bolt'
        }
    ],
    warmth: [
        {
            id: 'wa_overflow', name: 'Inner Heat', max: 5, reqBaseLevel: 1,
            desc: '+5% Mana Regen and +2% total Mana per level.',
            masteryPerk: 'While above 90% Mana, your fire spells deal 20% more damage.',
            mod: { manaRegenPct: 5, pctMP: 2 },
            icon: 'ra-sun-glow'
        }
    ],
    fireball: [
        {
            id: 'fb_radius', name: 'Greater Explosion', max: 5, reqBaseLevel: 5,
            desc: '+20% Explosion radius per level.',
            masteryPerk: 'Impact leaves a patch of burning ground for 3s.',
            mod: { aoeRadiusPct: 20 },
            icon: 'ra-fireball'
        },
        {
            id: 'fb_plasma', name: 'Plasma Core', max: 5, reqBaseLevel: 10,
            desc: 'Fireball moves 10% faster and pierces 1 enemy.',
            masteryPerk: 'Fireball now explodes on every enemy it pierces.',
            mod: { projectileSpeed: 10, pierceCount: 1 },
            icon: 'ra-burning-embers'
        }
    ],
    fire_mastery: [
        {
            id: 'fm_blaze', name: 'Consuming Flames', max: 5, reqBaseLevel: 10,
            desc: '+5% Fire Damage and +2% Fire Pierce per level.',
            masteryPerk: 'Your fire spells have a 10% chance to reset the cooldown of Meteor.',
            mod: { pctFireDmg: 5, firePiercing: 2 },
            icon: 'ra-large-fire'
        }
    ],
    immolate: [
        {
            id: 'im_intense', name: 'Intense Heat', max: 5, reqBaseLevel: 5,
            desc: '+15% Burn damage per level.',
            masteryPerk: 'Immolate now spreads to a nearby enemy every 1s.',
            mod: { burnDmgPct: 15 },
            icon: 'ra-large-fire'
        }
    ],
    fire_wall: [
        {
            id: 'fw_length', name: 'Expanding Flames', max: 5, reqBaseLevel: 10,
            desc: '+15% Wall length and +1s duration.',
            masteryPerk: 'Fire Wall now curves slightly to trap enemies.',
            mod: { wallLengthPct: 15, duration: 1 },
            icon: 'ra-fire-wall'
        }
    ],
    enchant: [
        {
            id: 'en_blaze', name: 'Blazing Blade', max: 5, reqBaseLevel: 10,
            desc: '+10% Fire damage and +10s duration.',
            masteryPerk: 'Enchanted attacks have 10% chance to cast Fire Bolt.',
            mod: { fireDmg: 10, duration: 10 },
            icon: 'ra-burning-book'
        }
    ],
    meteor: [
        {
            id: 'mt_impact', name: 'Cataclysm', max: 5, reqBaseLevel: 15,
            desc: '+20% Meteor impact damage.',
            masteryPerk: 'Meteor creates 3 smaller fragments upon impact.',
            mod: { pctDmg: 20 },
            icon: 'ra-meteor'
        }
    ],
    hydra: [
        {
            id: 'hy_heads', name: 'Lernean Hydra', max: 5, reqBaseLevel: 15,
            desc: '+1 Hydra head per level.',
            masteryPerk: 'Hydra shots explode on impact for 30% area damage.',
            mod: { extraHeads: 1 },
            icon: 'ra-dragon-head'
        }
    ],
    fire_storm: [
        {
            id: 'fs_apocalypse', name: 'Hellstorm', max: 5, reqBaseLevel: 20,
            desc: '+15% Damage and +1s duration.',
            masteryPerk: 'Fire Storm projectiles track and follow nearby enemies.',
            mod: { pctDmg: 15, duration: 1 },
            icon: 'ra-meteor'
        }
    ],
    combustion: [
        {
            id: 'co_eruption', name: 'Volcanic Blast', max: 5, reqBaseLevel: 20,
            desc: '+10% Crit DoT damage per level.',
            masteryPerk: 'Combustion DoT has a 10% chance to trigger an explosion.',
            mod: { dotDmgPct: 10 },
            icon: 'ra-volcano'
        }
    ],

    // --- COLD TREE ---
    ice_bolt: [
        {
            id: 'ib_shatter', name: 'Shatter Bolt', max: 5, reqBaseLevel: 1,
            desc: '+10% Cold Damage and +10% Freeze chance.',
            masteryPerk: 'Ice Bolt shatters on impact, dealing AoE cold damage.',
            mod: { pctDmg: 10, freezeChance: 10 },
            icon: 'ra-frostfire'
        }
    ],
    frost_nova: [
        {
            id: 'fn_radius', name: 'Arctic Blast', max: 5, reqBaseLevel: 5,
            desc: '+15% Nova radius and +0.5s freeze.',
            masteryPerk: 'Frost Nova leaves a frozen field that slows enemies for 5s.',
            mod: { radiusPct: 15, freezeDur: 0.5 },
            icon: 'ra-snowflake'
        }
    ],
    frozen_armor: [
        {
            id: 'fa_shield', name: 'Glacial Aegis', max: 5, reqBaseLevel: 1,
            desc: '+10% Armor and +5% Block chance.',
            masteryPerk: 'Frozen Armor grants 10% chance to cast Frost Nova when hit.',
            mod: { pctArmor: 10, blockChance: 5 },
            icon: 'ra-shield'
        }
    ],
    cold_mastery: [
        {
            id: 'cm_absolute', name: 'Absolute Zero', max: 5, reqBaseLevel: 10,
            desc: '+5% Cold Damage and +5% CC duration.',
            masteryPerk: 'Your cold spells ignore 20% of enemy cold resistance.',
            mod: { pctColdDmg: 5, ccDurPct: 5 },
            icon: 'ra-ice-cube'
        }
    ],
    ice_blast: [
        {
            id: 'ib_freeze', name: 'Permafrost', max: 5, reqBaseLevel: 5,
            desc: '+10% Freeze chance and +10% Damage.',
            masteryPerk: 'Ice Blast pierces frozen enemies.',
            mod: { freezeChance: 10, pctDmg: 10 },
            icon: 'ra-ice-cube'
        }
    ],
    shatter: [
        {
            id: 'sh_explosive', name: 'Shatter Burst', max: 5, reqBaseLevel: 10,
            desc: '+5% Damage vs CC enemies.',
            masteryPerk: 'Enemies killed while frozen explode for 10% max HP.',
            mod: { pctDmgVsCC: 5 },
            icon: 'ra-shattered-glass'
        }
    ],
    blizzard: [
        {
            id: 'bl_storm', name: 'Eternal Winter', max: 5, reqBaseLevel: 10,
            desc: '+15% Blizzard radius and +2s duration.',
            masteryPerk: 'Blizzard has a 5% chance per tick to freeze enemies for 1s.',
            mod: { radiusPct: 15, duration: 2 },
            icon: 'ra-snowflake'
        }
    ],
    glacial_spike: [
        {
            id: 'gs_heavy', name: 'Ice Column', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage and +10% splash radius.',
            masteryPerk: 'Glacial Spike stuns non-freezable targets for 1s.',
            mod: { pctDmg: 20 },
            icon: 'ra-mountain-cave'
        }
    ],
    frozen_orb: [
        {
            id: 'fo_shards', name: 'Glacial Splinters', max: 5, reqBaseLevel: 15,
            desc: '+2 splinter projectiles per level.',
            masteryPerk: 'The orb final explosion deals 100% increased damage.',
            mod: { extraProjectiles: 2 },
            icon: 'ra-ice-cube'
        }
    ],
    absolute_zero: [
        {
            id: 'az_void', name: 'Aetheric Chill', max: 5, reqBaseLevel: 20,
            desc: '+25% Damage and +1s freeze.',
            masteryPerk: 'Absolute Zero removes all fire-based buffs from enemies.',
            mod: { pctDmg: 25 },
            icon: 'ra-snowflake'
        }
    ],

    // --- LIGHTNING TREE ---
    charged_bolt: [
        {
            id: 'cb_count', name: 'High Voltage', max: 5, reqBaseLevel: 1,
            desc: '+2 extra bolts per level.',
            masteryPerk: 'Charged Bolts seek nearby enemies automatically.',
            mod: { extraProjectiles: 2 },
            icon: 'ra-lightning-trio'
        }
    ],
    static_field: [
        {
            id: 'sf_range', name: 'Conductive Field', max: 5, reqBaseLevel: 5,
            desc: '+15% Static Field radius.',
            masteryPerk: 'Static Field now reduces current HP by up to 50%.',
            mod: { radiusPct: 15 },
            icon: 'ra-lightning-bolt'
        }
    ],
    nova: [
        {
            id: 'no_overload', name: 'Plasma Ring', max: 5, reqBaseLevel: 5,
            desc: '+15% Nova radius and +10% Damage.',
            masteryPerk: 'Nova knocks back all enemies hit.',
            mod: { radiusPct: 15, pctDmg: 10 },
            icon: 'ra-waves-pulse'
        }
    ],
    lightning_mastery: [
        {
            id: 'lm_storm', name: 'Storm Caller', max: 5, reqBaseLevel: 10,
            desc: '+5% Lightning Damage and +2% Crit Chance.',
            masteryPerk: 'Lightning critical strikes chain to an extra target.',
            mod: { pctLightDmg: 5, critChance: 2 },
            icon: 'ra-lightning-bolt'
        }
    ],
    lightning_surge: [
        {
            id: 'ls_pierce', name: 'Aether Beam', max: 5, reqBaseLevel: 5,
            desc: '+15% Damage and +10% width.',
            masteryPerk: 'Lightning Surge has a 30% chance to stun for 0.5s.',
            mod: { pctDmg: 15 },
            icon: 'ra-lightning-bolt'
        }
    ],
    energy_shield: [
        {
            id: 'es_hardened', name: 'Prismatic Barrier', max: 5, reqBaseLevel: 10,
            desc: '+5% damage absorption and +10% all res while active.',
            masteryPerk: 'Energy Shield reduces mana drain rate by 20%.',
            mod: { absorbPct: 5, allRes: 10 },
            icon: 'ra-shield'
        }
    ],
    teleport: [
        {
            id: 'tp_blink', name: 'Aether Blink', max: 5, reqBaseLevel: 10,
            desc: '-10% Mana cost and +5m range.',
            masteryPerk: 'Teleporting leaves a Nova at the destination.',
            mod: { manaCostRed: 10, rangeBonus: 5 },
            icon: 'ra-fast-forward'
        }
    ],
    chain_lightning: [
        {
            id: 'cl_jumps', name: 'Superconductor', max: 5, reqBaseLevel: 10,
            desc: '+1 jump per level.',
            masteryPerk: 'Each jump increases the damage of the next jump by 10%.',
            mod: { extraJumps: 1 },
            icon: 'ra-lightning-fury'
        }
    ],
    static_charge: [
        {
            id: 'sc_discharge', name: 'Tesla Coil', max: 5, reqBaseLevel: 15,
            desc: '+15% reactive damage.',
            masteryPerk: 'Static Charge stun duration increased to 1.5s.',
            mod: { pctDmg: 15 },
            icon: 'ra-lightning-trio'
        }
    ],
    thunder_storm: [
        {
            id: 'ts_frequency', name: 'High Frequency', max: 5, reqBaseLevel: 15,
            desc: 'Lightning strikes 20% more often.',
            masteryPerk: 'Thunder Storm strikes 2 enemies at once.',
            mod: { rateBonus: 20 },
            icon: 'ra-lightning-trio'
        }
    ],
    arcane_shield: [
        {
            id: 'as_resonance', name: 'Mana Shielding', max: 5, reqBaseLevel: 15,
            desc: '+10% Shield value and +2s duration.',
            masteryPerk: 'Arcane Shield also restores 1% Mana when consumed.',
            mod: { shieldPct: 10 },
            icon: 'ra-shield'
        }
    ],
    chain_lightning_mastery: [
        {
            id: 'clm_overload', name: 'Storm Overload', max: 5, reqBaseLevel: 20,
            desc: '+1 bounce and +10% Nova damage.',
            masteryPerk: 'Chain Lightning has a 20% chance to not consume a bounce.',
            mod: { extraBounces: 1 },
            icon: 'ra-lightning-fury'
        }
  ],
    slow_time: [
        {
            id: 'st_stasis', name: 'Temporal Stasis', max: 5, reqBaseLevel: 25,
            desc: '+1s duration and +5% slow effect.',
            masteryPerk: 'Enemies in Slow Time take 20% more damage from all sources.',
            mod: { duration: 1, slowPct: 5 },
            icon: 'ra-hourglass'
        }
    ]
};
