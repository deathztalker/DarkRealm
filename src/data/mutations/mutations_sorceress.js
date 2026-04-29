export const SORCERESS_MUTATIONS = {
    // --- FIRE TREE ---
    fire_bolt: [
        {
            id: 'fb_pierce', name: 'Searing Bolt', max: 5, reqBaseLevel: 1,
            desc: '+10% Damage and 10% chance to pierce.',
            masteryPerk: 'Fire Bolt now leaves a small flame on the ground dealing 30% damage.',
            mod: { pctDmg: 10, pierceChance: 10 },
            icon: 'ra-fire-bolt'
        },
        {
            id: 'fb_fireball', name: 'Volatile Bolt', max: 5, reqBaseLevel: 1,
            desc: '+15% Damage and +10% Explosion Chance on impact.',
            masteryPerk: 'Fire Bolt now explodes on impact, dealing 50% area damage.',
            mod: { pctDmg: 15, explosionChance: 10 },
            icon: 'ra-fireball'
        }
    ],
    warmth: [
        {
            id: 'wa_overflow', name: 'Inner Heat', max: 5, reqBaseLevel: 1,
            desc: '+5% Mana Regen and +2% total Mana per level.',
            masteryPerk: 'While above 90% Mana, your fire spells deal 20% more damage.',
            mod: { manaRegenPct: 5, pctMP: 2 },
            icon: 'ra-sun-glow'
        },
        {
            id: 'wa_soul', name: 'Soul Fire', max: 5, reqBaseLevel: 5,
            desc: '+10% Mana stolen on kill and +5% Mana per level.',
            masteryPerk: 'Warmth now also regenerates 1% Health per second.',
            mod: { manaOnKill: 10, pctMP: 5 },
            icon: 'ra-heart-burn'
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
        },
        {
            id: 'fm_eternal', name: 'Eternal Flame', max: 5, reqBaseLevel: 15,
            desc: '+10% Burn Duration and +5% Burn Damage per level.',
            masteryPerk: 'Burn effects from your spells can now stack up to 3 times.',
            mod: { burnDurationPct: 10, burnDmgPct: 5 },
            icon: 'ra-burning-embers'
        }
    ],
    immolate: [
        {
            id: 'im_intense', name: 'Intense Heat', max: 5, reqBaseLevel: 5,
            desc: '+15% Burn damage per level.',
            masteryPerk: 'Immolate now spreads to a nearby enemy every 1s.',
            mod: { burnDmgPct: 15 },
            icon: 'ra-large-fire'
        },
        {
            id: 'im_nova', name: 'Immolation Nova', max: 5, reqBaseLevel: 10,
            desc: '+20% Damage and +10% Radius per level.',
            masteryPerk: 'Immolate now releases a fire nova upon expiration.',
            mod: { pctDmg: 20, radiusPct: 10 },
            icon: 'ra-waves-pulse'
        }
    ],
    fire_wall: [
        {
            id: 'fw_length', name: 'Expanding Flames', max: 5, reqBaseLevel: 10,
            desc: '+15% Wall length and +1s duration.',
            masteryPerk: 'Fire Wall now curves slightly to trap enemies.',
            mod: { wallLengthPct: 15, duration: 1 },
            icon: 'ra-fire-wall'
        },
        {
            id: 'fw_inferno', name: 'Inferno Wall', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage per second and +10% width.',
            masteryPerk: 'Fire Wall now spawns small fire elementals that attack nearby enemies.',
            mod: { dpsPct: 20, widthPct: 10 },
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
        },
        {
            id: 'en_armor', name: 'Blazing Aura', max: 5, reqBaseLevel: 15,
            desc: '+10% Fire Resistance and +5% Armor to enchanted targets.',
            masteryPerk: 'Enchant now grants a permanent fire aura that deals 20% damage per second.',
            mod: { fireRes: 10, pctArmor: 5 },
            icon: 'ra-aura'
        }
    ],
    meteor: [
        {
            id: 'mt_impact', name: 'Cataclysm', max: 5, reqBaseLevel: 15,
            desc: '+20% Meteor impact damage.',
            masteryPerk: 'Meteor creates 3 smaller fragments upon impact.',
            mod: { pctDmg: 20 },
            icon: 'ra-meteor'
        },
        {
            id: 'mt_star', name: 'Falling Star', max: 5, reqBaseLevel: 20,
            desc: '+15% Damage and -10% Mana cost.',
            masteryPerk: 'Meteor now calls down a second, smaller meteor 1s after the first.',
            mod: { pctDmg: 15, manaCostRed: 10 },
            icon: 'ra-burning-meteor'
        }
    ],
    hydra: [
        {
            id: 'hy_heads', name: 'Lernean Hydra', max: 5, reqBaseLevel: 15,
            desc: '+1 Hydra head per level.',
            masteryPerk: 'Hydra shots explode on impact for 30% area damage.',
            mod: { extraHeads: 1 },
            icon: 'ra-dragon-head'
        },
        {
            id: 'hy_frost', name: 'Frost Hydra', max: 5, reqBaseLevel: 20,
            desc: 'Converts Hydra damage to Cold and adds +10% Freeze Chance.',
            masteryPerk: 'Hydra now breathes a cone of frost instead of firing bolts.',
            mod: { coldDmgPct: 10, freezeChance: 10 },
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
        },
        {
            id: 'fs_rage', name: 'Storm of Rage', max: 5, reqBaseLevel: 25,
            desc: '+20% Damage and +15% AoE Radius.',
            masteryPerk: 'Fire Storm now creates a massive fire tornado at its center.',
            mod: { pctDmg: 20, radiusPct: 15 },
            icon: 'ra-cyclone'
        }
    ],
    combustion: [
        {
            id: 'co_eruption', name: 'Volcanic Blast', max: 5, reqBaseLevel: 20,
            desc: '+10% Crit DoT damage per level.',
            masteryPerk: 'Combustion DoT has a 10% chance to trigger an explosion.',
            mod: { dotDmgPct: 10 },
            icon: 'ra-volcano'
        },
        {
            id: 'co_chain', name: 'Chain Combustion', max: 5, reqBaseLevel: 25,
            desc: '+15% Damage and +10% Explosion Radius.',
            masteryPerk: 'Combustion explosions have a 50% chance to trigger another combustion.',
            mod: { pctDmg: 15, explosionRadiusPct: 10 },
            icon: 'ra-bomb-explosion'
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
        },
        {
            id: 'ib_lance', name: 'Ice Lance', max: 5, reqBaseLevel: 1,
            desc: '+15% Projectile Speed and +10% Damage.',
            masteryPerk: 'Ice Bolt now pierces all enemies in a line.',
            mod: { projectileSpeed: 15, pctDmg: 10 },
            icon: 'ra-ice-spear'
        }
    ],
    frost_nova: [
        {
            id: 'fn_radius', name: 'Arctic Blast', max: 5, reqBaseLevel: 5,
            desc: '+15% Nova radius and +0.5s freeze.',
            masteryPerk: 'Frost Nova leaves a frozen field that slows enemies for 5s.',
            mod: { radiusPct: 15, freezeDur: 0.5 },
            icon: 'ra-snowflake'
        },
        {
            id: 'fn_shiver', name: 'Shivering Nova', max: 5, reqBaseLevel: 10,
            desc: '+10% Damage and -10% Enemy Attack Speed.',
            masteryPerk: 'Frost Nova now pulls enemies toward the center.',
            mod: { pctDmg: 10, enemyAttackSpeedRed: 10 },
            icon: 'ra-implosion'
        }
    ],
    frozen_armor: [
        {
            id: 'fa_shield', name: 'Glacial Aegis', max: 5, reqBaseLevel: 1,
            desc: '+10% Armor and +5% Block chance.',
            masteryPerk: 'Frozen Armor grants 10% chance to cast Frost Nova when hit.',
            mod: { pctArmor: 10, blockChance: 5 },
            icon: 'ra-shield'
        },
        {
            id: 'fa_spike', name: 'Ice Spikes', max: 5, reqBaseLevel: 5,
            desc: '+10% Cold Damage Reflected and +5% Freeze duration.',
            masteryPerk: 'Frozen Armor now releases 3 ice spikes toward attackers when hit.',
            mod: { reflectColdDmg: 10, freezeDurationPct: 5 },
            icon: 'ra-ice-cube'
        }
    ],
    cold_mastery: [
        {
            id: 'cm_absolute', name: 'Absolute Zero', max: 5, reqBaseLevel: 10,
            desc: '+5% Cold Damage and +5% CC duration.',
            masteryPerk: 'Your cold spells ignore 20% of enemy cold resistance.',
            mod: { pctColdDmg: 5, ccDurPct: 5 },
            icon: 'ra-ice-cube'
        },
        {
            id: 'cm_frostbite', name: 'Frostbite', max: 5, reqBaseLevel: 15,
            desc: '+10% Damage vs Frozen targets and +5% Cold Damage.',
            masteryPerk: 'Frozen enemies take 20% increased damage from all sources.',
            mod: { dmgVsFrozenPct: 10, pctColdDmg: 5 },
            icon: 'ra-frostfire'
        }
    ],
    ice_blast: [
        {
            id: 'ib_freeze', name: 'Permafrost', max: 5, reqBaseLevel: 5,
            desc: '+10% Freeze chance and +10% Damage.',
            masteryPerk: 'Ice Blast pierces frozen enemies.',
            mod: { freezeChance: 10, pctDmg: 10 },
            icon: 'ra-ice-cube'
        },
        {
            id: 'ib_shatter', name: 'Shattering Blast', max: 5, reqBaseLevel: 10,
            desc: '+20% Splash Damage and +10% Radius.',
            masteryPerk: 'Ice Blast now deals double damage to already frozen targets.',
            mod: { splashDmgPct: 20, radiusPct: 10 },
            icon: 'ra-shattered-glass'
        }
    ],
    shatter: [
        {
            id: 'sh_explosive', name: 'Shatter Burst', max: 5, reqBaseLevel: 10,
            desc: '+5% Damage vs CC enemies.',
            masteryPerk: 'Enemies killed while frozen explode for 10% max HP.',
            mod: { pctDmgVsCC: 5 },
            icon: 'ra-shattered-glass'
        },
        {
            id: 'sh_resonance', name: 'Crystal Resonance', max: 5, reqBaseLevel: 15,
            desc: '+10% Cold Damage and +5% Crit Chance per level.',
            masteryPerk: 'Shattering an enemy has a 20% chance to freeze all nearby enemies.',
            mod: { pctColdDmg: 10, critChance: 5 },
            icon: 'ra-crystals'
        }
    ],
    blizzard: [
        {
            id: 'bl_storm', name: 'Eternal Winter', max: 5, reqBaseLevel: 10,
            desc: '+15% Blizzard radius and +2s duration.',
            masteryPerk: 'Blizzard has a 5% chance per tick to freeze enemies for 1s.',
            mod: { radiusPct: 15, duration: 2 },
            icon: 'ra-snowflake'
        },
        {
            id: 'bl_hail', name: 'Hailstorm', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage and +10% Stun Chance per level.',
            masteryPerk: 'Blizzard now drops giant ice boulders that deal 200% damage.',
            mod: { pctDmg: 20, stunChance: 10 },
            icon: 'ra-mountains'
        }
    ],
    glacial_spike: [
        {
            id: 'gs_heavy', name: 'Ice Column', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage and +10% splash radius.',
            masteryPerk: 'Glacial Spike stuns non-freezable targets for 1s.',
            mod: { pctDmg: 20 },
            icon: 'ra-mountain-cave'
        },
        {
            id: 'gs_freeze', name: 'Deep Freeze', max: 5, reqBaseLevel: 20,
            desc: '+1s Freeze duration and +10% Damage.',
            masteryPerk: 'Glacial Spike now creates an ice wall on impact for 3s.',
            mod: { freezeDuration: 1, pctDmg: 10 },
            icon: 'ra-ice-cube'
        }
    ],
    frozen_orb: [
        {
            id: 'fo_shards', name: 'Glacial Splinters', max: 5, reqBaseLevel: 15,
            desc: '+2 splinter projectiles per level.',
            masteryPerk: 'The orb final explosion deals 100% increased damage.',
            mod: { extraProjectiles: 2 },
            icon: 'ra-ice-cube'
        },
        {
            id: 'fo_comet', name: 'Orbiting Comet', max: 5, reqBaseLevel: 20,
            desc: '+15% Damage and +10% Orbit Radius.',
            masteryPerk: 'Frozen Orb now spirals outward, hitting a much larger area.',
            mod: { pctDmg: 15, orbitRadiusPct: 10 },
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
        },
        {
            id: 'az_stasis', name: 'Temporal Frost', max: 5, reqBaseLevel: 25,
            desc: '+20% Slow effect and +1s Freeze duration.',
            masteryPerk: 'Absolute Zero now stops time for all frozen enemies for 2s.',
            mod: { slowPct: 20, freezeDuration: 1 },
            icon: 'ra-hourglass'
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
        },
        {
            id: 'cb_storm', name: 'Bolt Storm', max: 5, reqBaseLevel: 1,
            desc: '+15% Damage and +10% Projectile Speed.',
            masteryPerk: 'Charged Bolt now has a 20% chance to cast a free Nova on impact.',
            mod: { pctDmg: 15, projectileSpeed: 10 },
            icon: 'ra-lightning-storm'
        }
    ],
    static_field: [
        {
            id: 'sf_range', name: 'Conductive Field', max: 5, reqBaseLevel: 5,
            desc: '+15% Static Field radius.',
            masteryPerk: 'Static Field now reduces current HP by up to 50%.',
            mod: { radiusPct: 15 },
            icon: 'ra-lightning-bolt'
        },
        {
            id: 'sf_surge', name: 'Static Surge', max: 5, reqBaseLevel: 10,
            desc: '+10% Damage and +5% Stun Chance per level.',
            masteryPerk: 'Static Field now chains between up to 5 enemies.',
            mod: { pctDmg: 10, stunChance: 5 },
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
        },
        {
            id: 'no_shock', name: 'Shocking Nova', max: 5, reqBaseLevel: 10,
            desc: '+20% Damage and +10% Stun Duration.',
            masteryPerk: 'Nova now leaves a static field that deals 20% damage per second for 3s.',
            mod: { pctDmg: 20, stunDurationPct: 10 },
            icon: 'ra-lightning-storm'
        }
    ],
    lightning_mastery: [
        {
            id: 'lm_storm', name: 'Storm Caller', max: 5, reqBaseLevel: 10,
            desc: '+5% Lightning Damage and +2% Crit Chance.',
            masteryPerk: 'Lightning critical strikes chain to an extra target.',
            mod: { pctLightDmg: 5, critChance: 2 },
            icon: 'ra-lightning-bolt'
        },
        {
            id: 'lm_voltage', name: 'High Voltage', max: 5, reqBaseLevel: 15,
            desc: '+10% Lightning Pierce and +5% Lightning Damage.',
            masteryPerk: 'Your lightning spells have a 10% chance to strike twice.',
            mod: { lightPiercing: 10, pctLightDmg: 5 },
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
        },
        {
            id: 'ls_focus', name: 'Focused Surge', max: 5, reqBaseLevel: 10,
            desc: '+20% Damage and -10% Width.',
            masteryPerk: 'Lightning Surge now deals 100% increased damage to the first target hit.',
            mod: { pctDmg: 20, widthPct: -10 },
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
        },
        {
            id: 'es_recovery', name: 'Mana Siphon', max: 5, reqBaseLevel: 15,
            desc: '+5% Mana Regen and +5% Damage absorption.',
            masteryPerk: 'Energy Shield now restores 2% of your Mana for every 10% of HP lost.',
            mod: { manaRegenPct: 5, absorbPct: 5 },
            icon: 'ra-mana'
        }
    ],
    teleport: [
        {
            id: 'tp_blink', name: 'Aether Blink', max: 5, reqBaseLevel: 10,
            desc: '-10% Mana cost and +5m range.',
            masteryPerk: 'Teleporting leaves a Nova at the destination.',
            mod: { manaCostRed: 10, rangeBonus: 5 },
            icon: 'ra-fast-forward'
        },
        {
            id: 'tp_safe', name: 'Safe Passage', max: 5, reqBaseLevel: 15,
            desc: '+10% Damage Reduction and +10% All Res for 3s after teleport.',
            masteryPerk: 'Teleporting now creates a mirror image of yourself for 3s.',
            mod: { drPct: 10, allRes: 10 },
            icon: 'ra-double-team'
        }
    ],
    chain_lightning: [
        {
            id: 'cl_jumps', name: 'Superconductor', max: 5, reqBaseLevel: 10,
            desc: '+1 jump per level.',
            masteryPerk: 'Each jump increases the damage of the next jump by 10%.',
            mod: { extraJumps: 1 },
            icon: 'ra-lightning-fury'
        },
        {
            id: 'cl_surge', name: 'Lightning Surge', max: 5, reqBaseLevel: 15,
            desc: '+15% Damage and +10% Projectile Speed.',
            masteryPerk: 'Chain Lightning no longer loses damage per jump.',
            mod: { pctDmg: 15, projectileSpeed: 10 },
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
        },
        {
            id: 'sc_overload', name: 'Overload', max: 5, reqBaseLevel: 20,
            desc: '+20% Damage and +10% Radius.',
            masteryPerk: 'Static Charge now hits all enemies in a massive area when it triggers.',
            mod: { pctDmg: 20, radiusPct: 10 },
            icon: 'ra-lightning-bolt'
        }
    ],
    thunder_storm: [
        {
            id: 'ts_frequency', name: 'High Frequency', max: 5, reqBaseLevel: 15,
            desc: 'Lightning strikes 20% more often.',
            masteryPerk: 'Thunder Storm strikes 2 enemies at once.',
            mod: { rateBonus: 20 },
            icon: 'ra-lightning-trio'
        },
        {
            id: 'ts_impact', name: 'Thunderous Strike', max: 5, reqBaseLevel: 20,
            desc: '+25% Damage and +10% Stun Chance.',
            masteryPerk: 'Thunder Storm strikes now cause a small explosion on impact.',
            mod: { pctDmg: 25, stunChance: 10 },
            icon: 'ra-lightning-storm'
        }
    ],
    arcane_shield: [
        {
            id: 'as_resonance', name: 'Mana Shielding', max: 5, reqBaseLevel: 15,
            desc: '+10% Shield value and +2s duration.',
            masteryPerk: 'Arcane Shield also restores 1% Mana when consumed.',
            mod: { shieldPct: 10 },
            icon: 'ra-shield'
        },
        {
            id: 'as_ward', name: 'Arcane Ward', max: 5, reqBaseLevel: 20,
            desc: '+15% Magic Resistance and +10% All Res while active.',
            masteryPerk: 'Arcane Shield now grants immunity to all silence effects.',
            mod: { magicRes: 15, allRes: 10 },
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
        },
        {
            id: 'clm_storm', name: 'Master of Storms', max: 5, reqBaseLevel: 25,
            desc: '+10% Lightning Damage and +5% Crit Chance.',
            masteryPerk: 'Chain Lightning jumps can now hit the same target multiple times.',
            mod: { pctLightDmg: 10, critChance: 5 },
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
        },
        {
            id: 'st_warp', name: 'Time Warp', max: 5, reqBaseLevel: 30,
            desc: '+20% Movement Speed for allies and +10% Attack Speed.',
            masteryPerk: 'Slow Time now completely freezes projectiles in mid-air.',
            mod: { moveSpeedPct: 20, attackSpeedPct: 10 },
            icon: 'ra-hourglass'
        }
    ]
};
