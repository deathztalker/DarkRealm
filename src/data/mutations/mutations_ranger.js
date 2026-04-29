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
            id: 'ma_arcane_surge', name: 'Arcane Surge', max: 5, reqBaseLevel: 5,
            desc: 'Magic Arrow deals +1% bonus damage for every 2% of current Mana you have.',
            masteryPerk: 'Every 3rd Magic Arrow triggers a mini-Arcane Nova on impact, hitting nearby foes.',
            mod: { manaSynergy: 1 },
            icon: 'ra-lightning-bolt'
        }
    ],
    immolation_arrow: [
        {
            id: 'ima_napalm', name: 'White Phosphorus', max: 5, reqBaseLevel: 1,
            desc: '+15% Burning damage and +1s ground fire duration.',
            masteryPerk: 'Enemies standing in the fire have their fire resistance reduced by 15%.',
            mod: { burnDmg: 15, duration: 1 },
            icon: 'ra-small-fire'
        },
        {
            id: 'ima_magma', name: 'Magma Breach', max: 5, reqBaseLevel: 5,
            desc: '+20% ground fire radius and +10% fire damage.',
            masteryPerk: 'Immolation Arrow creates 3 mini-volcanoes that fire small embers at nearby enemies.',
            mod: { radiusPct: 20, pctDmg: 10 },
            icon: 'ra-volcano'
        }
    ],
    bow_mastery: [
        {
            id: 'bm_precision', name: 'Hawkeye', max: 5, reqBaseLevel: 1,
            desc: '+5% Bow damage and +10% Attack Rating bonus.',
            masteryPerk: 'Bow Mastery increases your attack range by 15%.',
            mod: { bowDmg: 5, arBonus: 10 },
            icon: 'ra-bullseye'
        },
        {
            id: 'bm_velocity', name: 'Sonic Velocity', max: 5, reqBaseLevel: 5,
            desc: '+15% Projectile speed and +5% Pierce chance.',
            masteryPerk: 'Your arrows have a 10% chance to Ricochet to a second nearby target.',
            mod: { projSpeedPct: 15, pierceChance: 5 },
            icon: 'ra-fast-forward'
        }
    ],
    piercing_arrow: [
        {
            id: 'pa_shred', name: 'Jagged Tip', max: 5, reqBaseLevel: 5,
            desc: 'Adds 10% bleed damage per level to all targets hit.',
            masteryPerk: 'Piercing Arrow damage no longer reduces per target hit.',
            mod: { bleedDmg: 10 },
            icon: 'ra-broadhead'
        },
        {
            id: 'pa_shatter', name: 'Shatterpoint', max: 5, reqBaseLevel: 10,
            desc: 'Piercing Arrow deals 20% bonus damage to targets at full Health.',
            masteryPerk: 'Every enemy pierced increases the damage of the arrow by 10% for subsequent targets.',
            mod: { openerDmgPct: 20 },
            icon: 'ra-shattered-glass'
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
        },
        {
            id: 'hm_stalker', name: 'Stalker Instinct', max: 5, reqBaseLevel: 10,
            desc: '+10% Movement Speed while moving toward a Marked target.',
            masteryPerk: 'Marked targets take 10% increased damage from all sources (including other players).',
            mod: { moveTowardSpeed: 10 },
            icon: 'ra-fast-forward'
        }
    ],
    explosive_arrow: [
        {
            id: 'ea_cluster', name: 'Cluster Bomb', max: 5, reqBaseLevel: 10,
            desc: '+15% Explosion radius and +10% Fire Damage.',
            masteryPerk: 'Drops 3 mini-bombs upon explosion that detonate for 30% damage.',
            mod: { radiusPct: 15, pctDmg: 10 },
            icon: 'ra-bomb-explosion'
        },
        {
            id: 'ea_napalm', name: 'Incendiary Tip', max: 5, reqBaseLevel: 15,
            desc: 'Explosive Arrow leaves a burning field for 3s dealing 15% weapon damage.',
            masteryPerk: 'The explosion now pulls nearby enemies toward the center of the blast.',
            mod: { groundDmg: 15 },
            icon: 'ra-large-fire'
        }
    ],
    rapid_fire: [
        {
            id: 'rf_haste', name: 'Frenzied Volley', max: 5, reqBaseLevel: 10,
            desc: '+10% Attack Speed bonus and +1s duration.',
            masteryPerk: 'During Rapid Fire, your arrows have a 15% chance to double-fire.',
            mod: { iasPct: 10 },
            icon: 'ra-lightning-trio'
        },
        {
            id: 'rf_barrage', name: 'Sequential Barrage', max: 5, reqBaseLevel: 15,
            desc: 'Each subsequent arrow in a Rapid Fire sequence deals 5% more damage.',
            masteryPerk: 'Rapid Fire arrows now explode for 20% splash damage on impact.',
            mod: { rampDmg: 5 },
            icon: 'ra-explosion'
        }
    ],
    guided_arrow: [
        {
            id: 'ga_precision', name: 'Hunter\'s Precision', max: 5, reqBaseLevel: 15,
            desc: '+10% Crit Chance and +15% Crit Multi.',
            masteryPerk: 'Guided Arrow always hits the target\'s weakest point, ignoring 30% armor.',
            mod: { critChance: 10, critMulti: 15 },
            icon: 'ra-bullseye'
        },
        {
            id: 'ga_seeker', name: 'Relentless Seeker', max: 5, reqBaseLevel: 20,
            desc: 'Guided Arrow can hit up to 2 additional targets if they are close together.',
            masteryPerk: 'Guided Arrow splits into 2 separate arrows if the initial hit is a Critical Strike.',
            mod: { extraHits: 2 },
            icon: 'ra-lightning-bolt'
        }
    ],
    volley: [
        {
            id: 'vo_heavy', name: 'Iron Rain', max: 5, reqBaseLevel: 15,
            desc: '+10% Damage and +1s duration.',
            masteryPerk: 'Volley has a 20% chance to stun enemies for 0.5s on every tick.',
            mod: { pctDmg: 10 },
            icon: 'ra-arrow-cluster'
        },
        {
            id: 'vo_arrows', name: 'Infinite Quiver', max: 5, reqBaseLevel: 20,
            desc: '+2 arrows per volley wave and +10% damage.',
            masteryPerk: 'Volley now applies the effects of your currently active poison or magic arrow.',
            mod: { extraProj: 2, pctDmg: 10 },
            icon: 'ra-arrow-flights'
        }
    ],
    strafe: [
        {
            id: 'st_relentless', name: 'Relentless Assault', max: 5, reqBaseLevel: 20,
            desc: '+1 additional target per level and +5% Attack Speed.',
            masteryPerk: 'Strafe applies Hunter\'s Mark to all enemies hit.',
            mod: { extraTargets: 1, pctIAS: 5 },
            icon: 'ra-blaster'
        },
        {
            id: 'st_speed', name: 'Acrobatic Strafe', max: 5, reqBaseLevel: 25,
            desc: '+20% Strafe duration and +10% Movement Speed during use.',
            masteryPerk: 'While Strafing, you gain a 100% increased Dodge chance against all incoming projectiles.',
            mod: { durationPct: 20, moveSpeedPct: 10 },
            icon: 'ra-fast-forward'
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
        },
        {
            id: 'ft_shiver', name: 'Shivering Frost', max: 5, reqBaseLevel: 5,
            desc: '+15% Chill slow intensity.',
            masteryPerk: 'Frost Trap leaves a frozen surface that causes non-boss enemies to trip and stun for 1s.',
            mod: { slowPct: 15 },
            icon: 'ra-snowflake'
        }
    ],
    trap_mastery_r: [
        {
            id: 'tmr_expert', name: 'Trap Specialist', max: 5, reqBaseLevel: 1,
            desc: '+10% Trap damage and +5% Trap trigger radius.',
            masteryPerk: 'Trap Mastery reduces the cooldown of all traps by 20%.',
            mod: { trapDmg: 10, radiusPct: 5 },
            icon: 'ra-wrench'
        },
        {
            id: 'tmr_cunning', name: 'Cunning Engineer', max: 5, reqBaseLevel: 5,
            desc: 'Trap Damage increases by 5% of your total Agility.',
            masteryPerk: 'You can now have up to 2 additional traps active at the same time.',
            mod: { agiToDmg: 5 },
            icon: 'ra-gear-hammer'
        }
    ],
    ensnare: [
        {
            id: 'en_barb', name: 'Barbed Nets', max: 5, reqBaseLevel: 5,
            desc: 'Ensnared targets take 20% weapon damage per second.',
            masteryPerk: 'Movement through the net causes a 10% chance to stun for 1s.',
            mod: { bleedDmg: 20 },
            icon: 'ra-hand'
        },
        {
            id: 'en_poison', name: 'Venomous Net', max: 5, reqBaseLevel: 10,
            desc: 'Ensnared targets are also poisoned for 20% damage per second.',
            masteryPerk: 'Ensnared targets take 50% more damage from your other active traps.',
            mod: { poisonDmg: 20 },
            icon: 'ra-cobra'
        }
    ],
    immolation_trap: [
        {
            id: 'it_napalm', name: 'Inferno Oil', max: 5, reqBaseLevel: 5,
            desc: '+15% Fire Damage and +1s duration per level.',
            masteryPerk: 'Fire pool damage stacks up to 3 times on enemies that stay within it.',
            mod: { pctDmg: 15, duration: 1 },
            icon: 'ra-large-fire'
        },
        {
            id: 'it_fire', name: 'Blazing Detonation', max: 5, reqBaseLevel: 10,
            desc: '+20% initial explosion damage.',
            masteryPerk: 'Immolation Trap explosion has a 20% chance to reset the cooldown of Explosive Trap.',
            mod: { blastDmgPct: 20 },
            icon: 'ra-explosion'
        }
    ],
    viper_arrow: [
        {
            id: 'va_toxin', name: 'Deadly Injection', max: 5, reqBaseLevel: 5,
            desc: '+15% Poison damage and +2s duration.',
            masteryPerk: 'Viper Arrow explosion radius increased by 100%.',
            mod: { poisDmgPct: 15 },
            icon: 'ra-cobra'
        },
        {
            id: 'va_venom', name: 'Venomous Mist', max: 5, reqBaseLevel: 10,
            desc: '+20% Poison tick speed.',
            masteryPerk: 'Viper Arrow creates a persistent poison cloud that lasts for 5 seconds at the impact site.',
            mod: { tickRatePct: 20 },
            icon: 'ra-bubbles'
        }
    ],
    lightning_sentry: [
        {
            id: 'ls_overcharge', name: 'Overcharge', max: 5, reqBaseLevel: 10,
            desc: '+10% Lightning Damage and +1 shot before expiring.',
            masteryPerk: 'Lightning bolts chain to 2 additional targets for 50% damage.',
            mod: { pctDmg: 10, extraShots: 1 },
            icon: 'ra-lightning-trio'
        },
        {
            id: 'ls_shock', name: 'Static Shock', max: 5, reqBaseLevel: 15,
            desc: '+10% chance to stun the target for 0.2s.',
            masteryPerk: 'Lightning Sentry bolts trigger a mini-Nova on every 4th consecutive hit.',
            mod: { stunChance: 10 },
            icon: 'ra-lightning-bolt'
        }
    ],
    death_sentry: [
        {
            id: 'ds_macabre', name: 'Macabre Radius', max: 5, reqBaseLevel: 15,
            desc: '+15% Corpse Explosion radius per level.',
            masteryPerk: 'Explosions heal you for 5% of your maximum health.',
            mod: { radiusPct: 15 },
            icon: 'ra-skull'
        },
        {
            id: 'ds_ghost', name: 'Phantom Sentry', max: 5, reqBaseLevel: 20,
            desc: 'The Sentry periodically fires a Shadow Bolt (20% damage) at nearby enemies.',
            masteryPerk: 'Death Sentry no longer requires a corpse to fire its first 3 explosive shots.',
            mod: { shadowDmgPct: 20 },
            icon: 'ra-ghost'
        }
    ],
    snake_trap: [
        {
            id: 'sn_venom', name: 'Deadly Venom', max: 5, reqBaseLevel: 10,
            desc: '+20% Poison damage for the summoned snakes.',
            masteryPerk: 'Snake bites reduce the target\'s attack speed by 20% for 3s.',
            mod: { petDmgPct: 20 },
            icon: 'ra-cobra'
        },
        {
            id: 'sn_constrict', name: 'Constricting Coil', max: 5, reqBaseLevel: 15,
            desc: 'Summoned snakes have a 10% chance to root targets for 1.5s on hit.',
            masteryPerk: 'Summoned snakes explode into small poison clouds when they are killed or expire.',
            mod: { rootChance: 10 },
            icon: 'ra-biohazard'
        }
    ],
    explosive_trap: [
        {
            id: 'et_shrapnel', name: 'Shrapnel Landmine', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage per level.',
            masteryPerk: 'Enemies hit bleed for 50% of the trap\'s damage over 5 seconds.',
            mod: { pctDmg: 20 },
            icon: 'ra-dynamite'
        },
        {
            id: 'et_bomb', name: 'Demolition Charge', max: 5, reqBaseLevel: 20,
            desc: 'Explosive Trap gains +1 additional charge.',
            masteryPerk: 'Explosive Trap triggers a mini-Meteor from the sky on every 3rd enemy it hits.',
            mod: { extraCharges: 1 },
            icon: 'ra-meteor'
        }
    ],
    ice_trap: [
        {
            id: 'it_shiver', name: 'Glacial Burst', max: 5, reqBaseLevel: 15,
            desc: '+15% Cold Damage and +1s freeze.',
            masteryPerk: 'Ice Trap leaves a frozen path that slows enemies by 50%.',
            mod: { pctDmg: 15 },
            icon: 'ra-snowflake'
        },
        {
            id: 'it_frost', name: 'Permafrost Burst', max: 5, reqBaseLevel: 20,
            desc: '+20% freeze radius and +1s duration.',
            masteryPerk: 'Ice Trap shatters for 200% weapon damage when the freeze duration expires.',
            mod: { radiusPct: 20, duration: 1 },
            icon: 'ra-crystal-cluster'
        }
    ],
    trap_launcher: [
        {
            id: 'tl_range', name: 'Long Toss', max: 5, reqBaseLevel: 25,
            desc: '+2m throw range per level.',
            masteryPerk: 'Traps now trigger 50% faster after landing.',
            mod: { throwRange: 2 },
            icon: 'ra-fast-forward'
        },
        {
            id: 'tl_speed', name: 'Rapid Deployment', max: 5, reqBaseLevel: 30,
            desc: '+20% projectile speed for thrown traps.',
            masteryPerk: 'Thrown traps deal 100% weapon damage as impact damage to the target they land on.',
            mod: { projSpeedPct: 20 },
            icon: 'ra-lightning-bolt'
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
        },
        {
            id: 'ch_eagle', name: 'Eagle Eye Mark', max: 5, reqBaseLevel: 5,
            desc: 'The hawk marks targets on hit, increasing your damage to them by 5%.',
            masteryPerk: 'Your hawk can now be manually ordered to dive a specific area, dealing massive damage.',
            mod: { hawkMarkDmg: 5 },
            icon: 'ra-target-shot'
        }
    ],
    tracking: [
        {
            id: 'tr_scout', name: 'Pathfinder', max: 5, reqBaseLevel: 1,
            desc: '+3% Move Speed and +5% Damage vs Marked.',
            masteryPerk: 'Tracking also grants you 20% increased vision radius.',
            mod: { moveSpeed: 3, dmgBonusPct: 5 },
            icon: 'ra-eye-shield'
        },
        {
            id: 'tr_hunter', name: 'Master Hunter', max: 5, reqBaseLevel: 5,
            desc: '+4% Critical Strike chance against the last enemy you hit.',
            masteryPerk: 'Tracking now reveals invisible or stealthed enemies in a 10m radius.',
            mod: { critChance: 4 },
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
        },
        {
            id: 'nm_wild', name: 'Feral Resonance', max: 5, reqBaseLevel: 5,
            desc: '+5% Physical damage for you and your pets.',
            masteryPerk: 'Your pets gain a "Vampiric Aura" that provides 5% life steal to all nearby allies.',
            mod: { pctPhysDmg: 5 },
            icon: 'ra-muscle-fat'
        }
    ],
    aspect_hawk: [
        {
            id: 'ah_focus', name: 'Eagle Eye', max: 5, reqBaseLevel: 5,
            desc: '+10% Ranged Damage and +2% Crit Chance.',
            masteryPerk: 'During Aspect of the Hawk, your attacks have +50% Pierce chance.',
            mod: { rangedDmg: 10, critChance: 2 },
            icon: 'ra-eagle-emblem'
        },
        {
            id: 'ah_vision', name: 'Hawk Vision', max: 5, reqBaseLevel: 10,
            desc: '+20% Critical Strike Multiplier and +10% vision range.',
            masteryPerk: 'While active, every 5th arrow you fire is a guaranteed Critical Strike.',
            mod: { critMulti: 20, visionRangePct: 10 },
            icon: 'ra-bullseye'
        }
    ],
    mark_death: [
        {
            id: 'md_fatal', name: 'Marked for Doom', max: 5, reqBaseLevel: 5,
            desc: '+10% damage bonus from pets.',
            masteryPerk: 'Killing a Marked target restores 10% of your maximum health.',
            mod: { petDmgAmp: 10 },
            icon: 'ra-skull'
        },
        {
            id: 'md_reaper', name: 'Death\'s Door', max: 5, reqBaseLevel: 10,
            desc: '+15% damage bonus to the target from your own attacks.',
            masteryPerk: 'Killing a target affected by Mark for Death instantly resets the cooldown of Strafe.',
            mod: { dmgAmpPct: 15 },
            icon: 'ra-reaper-scythe'
        }
    ],
    bear_companion: [
        {
            id: 'bc_iron_hide', name: 'Iron Hide', max: 5, reqBaseLevel: 10,
            desc: '+15% Bear HP and +10% Bear Armor per level.',
            masteryPerk: 'The Bear periodically casts a taunt, forcing nearby enemies to attack it.',
            mod: { petHpPct: 15, petArmorPct: 15 },
            icon: 'ra-bear-head'
        },
        {
            id: 'bc_maul', name: 'Feral Maul', max: 5, reqBaseLevel: 15,
            desc: 'The Bear deals 25% bonus damage to bleeding targets.',
            masteryPerk: 'The Bear gains a "Roar" ability that reduces the armor of all nearby enemies by 50%.',
            mod: { bleedSynergyDmg: 25 },
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
        },
        {
            id: 'ac_haste', name: 'Windrunner', max: 5, reqBaseLevel: 15,
            desc: '+10% Attack Speed and +5% Movement Speed.',
            masteryPerk: 'While active, you leave a trail of dust that reduces enemy vision radius by 50% for 3s.',
            mod: { iasPct: 10, moveSpeed: 5 },
            icon: 'ra-lightning-bolt'
        }
    ],
    wolf_companion: [
        {
            id: 'wc_bloodthirst', name: 'Alpha Ferocity', max: 5, reqBaseLevel: 15,
            desc: '+10% Wolf Attack Speed and Damage per level.',
            masteryPerk: 'Wolves heal for 20% of the damage they deal.',
            mod: { petDmgPct: 10, petIasPct: 10 },
            icon: 'ra-wolf-howl'
        },
        {
            id: 'wc_pack', name: 'Pack Mentality', max: 5, reqBaseLevel: 20,
            desc: 'Summons 1 additional wolf and increases wolf crit chance by 5%.',
            masteryPerk: 'Wolves have a 10% chance to trigger a deep "Bleed" effect on every hit.',
            mod: { extraSummons: 1, petCritChance: 5 },
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
        },
        {
            id: 'bw_fury', name: 'Bestial Fury', max: 5, reqBaseLevel: 25,
            desc: '+20% Pet Attack Speed and +10% Pet Movement Speed.',
            masteryPerk: 'During Bestial Wrath, your pets grow 50% larger and their attacks deal splash damage.',
            mod: { petIasPct: 20, petSpeedPct: 10 },
            icon: 'ra-muscle-fat'
        }
    ],
    spirit_bond: [
        {
            id: 'sb_unity', name: 'Wild Unity', max: 5, reqBaseLevel: 25,
            desc: '+2% redirection and +1% life steal share.',
            masteryPerk: 'Spirit Bond increases all pet attributes by 10%.',
            mod: { redirectPct: 2 },
            icon: 'ra-heartburn'
        },
        {
            id: 'sb_life', name: 'Essence Connection', max: 5, reqBaseLevel: 30,
            desc: '+3% Life Steal for both you and your pets.',
            masteryPerk: 'Spirit Bond grants you and your pets 10% increased Movement Speed.',
            mod: { lifeSteal: 3 },
            icon: 'ra-heart-pumping'
        }
    ]
};
