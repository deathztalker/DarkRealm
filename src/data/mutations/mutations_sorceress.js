export const SORCERESS_MUTATIONS = {
    fire_bolt: [
        {
            id: 'fb_pierce', name: 'Searing Bolt', max: 5,
            desc: '+10% Damage and 10% chance to pierce.',
            masteryPerk: 'Fire Bolt now leaves a small flame on the ground.',
            mod: { pctDmg: 10, pierceChance: 10 },
            icon: 'ra-fire-bolt'
        }
    ],
    fireball: [
        {
            id: 'fb_radius', name: 'Greater Explosion', max: 5,
            desc: '+20% Explosion radius per level.',
            masteryPerk: 'Impact leaves a patch of burning ground for 3s.',
            mod: { aoeRadiusPct: 20 },
            icon: 'ra-fireball'
        },
        {
            id: 'fb_plasma', name: 'Plasma Core', max: 5,
            desc: 'Fireball moves 10% faster and pierces 1 enemy.',
            masteryPerk: 'Fireball now explodes on every enemy it pierces.',
            mod: { projectileSpeed: 10, pierceCount: 1 },
            icon: 'ra-burning-embers'
        }
    ],
    immolate: [
        {
            id: 'im_intense', name: 'Intense Heat', max: 5,
            desc: '+15% Burn damage per level.',
            masteryPerk: 'Immolate now spreads to a nearby enemy every 1s.',
            mod: { burnDmgPct: 15 },
            icon: 'ra-large-fire'
        }
    ],
    fire_wall: [
        {
            id: 'fw_length', name: 'Expanding Flames', max: 5,
            desc: '+15% Wall length and +1s duration.',
            masteryPerk: 'Fire Wall now curves slightly to trap enemies.',
            mod: { wallLengthPct: 15, duration: 1 },
            icon: 'ra-fire-wall'
        }
    ],
    enchant: [
        {
            id: 'en_blaze', name: 'Blazing Blade', max: 5,
            desc: '+10% Fire damage and +10s duration.',
            masteryPerk: 'Enchanted attacks have 10% chance to cast Fire Bolt.',
            mod: { fireDmg: 10, duration: 10 },
            icon: 'ra-burning-book'
        }
    ],
    meteor: [
        {
            id: 'mt_impact', name: 'Starfall', max: 5,
            desc: '+20% Impact damage and -0.1s delay.',
            masteryPerk: 'Meteor impact releases 3 smaller mini-meteors.',
            mod: { pctDmg: 20, delayRed: 0.1 },
            icon: 'ra-meteor'
        }
    ],
    hydra: [
        {
            id: 'hy_heads', name: 'Multi-Headed', max: 5,
            desc: '+10% Hydra damage and +1s duration.',
            masteryPerk: 'Hydra now has 4 heads instead of 3.',
            mod: { pctDmg: 10, duration: 1 },
            icon: 'ra-hydra'
        }
    ],
    fire_storm: [
        {
            id: 'fs_apocalypse', name: 'Apocalypse', max: 5,
            desc: '+15% Fire Storm damage and +1s duration.',
            masteryPerk: 'Every fireball in the storm is 20% larger.',
            mod: { pctDmg: 15, duration: 1 },
            icon: 'ra-fire-breath'
        }
    ],
    ice_bolt: [
        {
            id: 'ib_shard', name: 'Ice Shard', max: 5,
            desc: '+10% Damage and +5% Slow.',
            masteryPerk: 'Ice Bolt has 20% chance to freeze for 1s.',
            mod: { pctDmg: 10, slowPct: 5 },
            icon: 'ra-ice-cube'
        }
    ],
    frost_nova: [
        {
            id: 'fn_shatter', name: 'Shatter Nova', max: 5,
            desc: '+15% Damage and +10% Radius.',
            masteryPerk: 'Frost Nova now pushes enemies back significantly.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-snowflake'
        }
    ],
    frozen_armor: [
        {
            id: 'fa_glacier', name: 'Glacial Shield', max: 5,
            desc: '+10% Defense and +10s duration.',
            masteryPerk: 'While active, you have 5% chance to freeze melee attackers.',
            mod: { defPct: 10, duration: 10 },
            icon: 'ra-ice-shield'
        }
    ],
    ice_blast: [
        {
            id: 'ib_freeze', name: 'Deep Freeze', max: 5,
            desc: '+15% Damage and +5% Freeze chance.',
            masteryPerk: 'Ice Blast pierces frozen enemies.',
            mod: { pctDmg: 15, freezeChance: 5 },
            icon: 'ra-frost-bite'
        }
    ],
    blizzard: [
        {
            id: 'bz_storm', name: 'Heavy Snow', max: 5,
            desc: '+15% Damage and +1s duration.',
            masteryPerk: 'Enemies in Blizzard are slowed by an additional 20%.',
            mod: { pctDmg: 15, duration: 1 },
            icon: 'ra-snow-storm'
        }
    ],
    glacial_spike: [
        {
            id: 'gs_pierce', name: 'Piercing Spike', max: 5,
            desc: '+20% Damage and +10% Pierce chance.',
            masteryPerk: 'Glacial Spike leaves a patch of ice that freezes for 1s.',
            mod: { pctDmg: 20, pierceChance: 10 },
            icon: 'ra-ice-shards'
        }
    ],
    frozen_orb: [
        {
            id: 'orb_nova', name: 'Frost Shatter', max: 5,
            desc: 'Final explosion deals +20% damage.',
            masteryPerk: 'Final explosion releases 8 additional Ice Bolts in a nova.',
            mod: { finalExplosionDmg: 20 },
            icon: 'ra-ice-cube'
        },
        {
            id: 'orb_zero', name: 'Absolute Zero', max: 5,
            desc: '+10% Freeze chance per level.',
            masteryPerk: 'Enemies frozen by Orb explode for cold damage on death.',
            mod: { freezeChance: 10 },
            icon: 'ra-snowflake'
        }
    ],
    absolute_zero: [
        {
            id: 'az_winter', name: 'Eternal Winter', max: 5,
            desc: '+20% Damage and +1s Freeze duration.',
            masteryPerk: 'Shatter damage from Absolute Zero is doubled.',
            mod: { pctDmg: 20, freezeDur: 1 },
            icon: 'ra-snowflake'
        }
    ],
    charged_bolt: [
        {
            id: 'cb_surge', name: 'Surge', max: 5,
            desc: '+1 bolt and +10% Damage.',
            masteryPerk: 'Charged Bolts now home in slightly on enemies.',
            mod: { extraBolts: 1, pctDmg: 10 },
            icon: 'ra-lightning-bolt'
        }
    ],
    static_field: [
        {
            id: 'sf_conduction', name: 'Conduction', max: 5,
            desc: '+2% HP reduction and +10% Radius.',
            masteryPerk: 'Static Field now has 5% chance to stun enemies.',
            mod: { hpRedPct: 2, radiusPct: 10 },
            icon: 'ra-electric'
        }
    ],
    nova: [
        {
            id: 'nv_discharge', name: 'High Voltage', max: 5,
            desc: '+15% Damage and +10% Radius.',
            masteryPerk: 'Nova leaves a static field that shocks enemies for 2s.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-lightning-storm'
        }
    ],
    lightning_surge: [
        {
            id: 'ls_beam', name: 'Arcane Beam', max: 5,
            desc: '+20% Damage and +10% Beam width.',
            masteryPerk: 'Lightning Surge has 20% chance to reset teleport CD on kill.',
            mod: { pctDmg: 20, widthPct: 10 },
            icon: 'ra-lightning-trio'
        }
    ],
    energy_shield: [
        {
            id: 'es_efficiency', name: 'Efficiency', max: 5,
            desc: 'Reduces mana drain by 5% per level.',
            masteryPerk: 'Energy Shield now absorbs 80% of damage instead of 60%.',
            mod: { drainRedPct: 5 },
            icon: 'ra-bolt-shield'
        }
    ],
    teleport: [
        {
            id: 'tp_blink', name: 'Rapid Blink', max: 5,
            desc: '-2 Mana cost per level.',
            masteryPerk: 'Teleport releases a small Nova at the destination.',
            mod: { manaCostRed: 2 },
            icon: 'ra-teleport'
        }
    ],
    chain_lightning: [
        {
            id: 'cl_conductivity', name: 'Conductivity', max: 5,
            desc: '+1 Bounce per level.',
            masteryPerk: 'Chain Lightning can now bounce back to the original target.',
            mod: { maxBounces: 1 },
            icon: 'ra-lightning-bolt'
        },
        {
            id: 'cl_static', name: 'Static Field', max: 5,
            desc: '+15% Critical Damage per level.',
            masteryPerk: 'Leaves a static field that shocks enemies for 2s.',
            mod: { critDmgPct: 15 },
            icon: 'ra-electric'
        }
    ],
    thunder_storm: [
        {
            id: 'ts_frequency', name: 'Rapid Strikes', max: 5,
            desc: '+15% Damage and -0.2s strike interval.',
            masteryPerk: 'Thunder Storm strikes 2 enemies at once.',
            mod: { pctDmg: 15, intervalRed: 0.2 },
            icon: 'ra-cloudy-smoke'
        }
    ],
    slow_time: [
        {
            id: 'st_stasis', name: 'Chronos Stasis', max: 5,
            desc: '+10% Slow and +1s duration.',
            masteryPerk: 'Enemies in Slow Time take 20% increased damage.',
            mod: { slowPct: 10, duration: 1 },
            icon: 'ra-hourglass'
        }
    ]
};
