export const WARLOCK_MUTATIONS = {
    // --- AFFLICTION TREE ---
    curse_of_exhaustion: [
        {
            id: 'cow_enfeeble', name: 'Enfeeble', max: 5, reqBaseLevel: 1,
            desc: '-5% Enemy Damage per level.',
            masteryPerk: 'Confusion: Cursed enemies have a 10% chance to attack their allies.',
            mod: { enemyDmgReduction: 5 },
            icon: 'ra-broken-heart'
        },
        {
            id: 'coe_lethargy', name: 'Lethargic Fog', max: 5, reqBaseLevel: 5,
            desc: '+10% Slow and -5% Enemy Attack Speed per level.',
            masteryPerk: 'Exhaustion now spreads to one nearby enemy every 2 seconds.',
            mod: { slowPct: 10 },
            icon: 'ra-pawn'
        }
    ],
    corruption: [
        {
            id: 'co_agony', name: 'Endless Agony', max: 5, reqBaseLevel: 1,
            desc: '+15% DoT Damage and +1s Duration per level.',
            masteryPerk: 'Corruption ticks have a 10% chance to generate a Soul Shard.',
            mod: { dotDmgPct: 15, duration: 1 },
            icon: 'ra-bleeding-eye'
        },
        {
            id: 'co_virulence', name: 'Virulent Shadow', max: 5, reqBaseLevel: 5,
            desc: 'Corruption damage increases by 10% for every other DoT on the target.',
            masteryPerk: 'If the target dies, Corruption jumps to all enemies within 5m.',
            mod: { synergyDmg: 10 },
            icon: 'ra-biohazard'
        }
    ],
    shadow_mastery: [
        {
            id: 'sm_darkness', name: 'Shadow Lord', max: 5, reqBaseLevel: 1,
            desc: '+5% Shadow Damage and +2% Shadow Pierce per level.',
            masteryPerk: 'Your shadow spells have a 10% chance to cast Shadow Bolt for free.',
            mod: { pctShadowDmg: 5, shadowPierce: 2 },
            icon: 'ra-shadow-follower'
        },
        {
            id: 'sm_soul_weaver', name: 'Soul Weaver', max: 5, reqBaseLevel: 5,
            desc: 'Shadow Damage increases by 4% for each of your active DoTs on the battlefield.',
            masteryPerk: 'Shadow spells have a 15% chance to apply a secondary, mini-Corruption to the target.',
            mod: { shadowSynergy: 4 },
            icon: 'ra-soul-vessel'
        }
    ],
    siphon_life: [
        {
            id: 'sl_leech', name: 'Vampiric Leech', max: 5, reqBaseLevel: 5,
            desc: '+10% Healing amount and +10% Damage per level.',
            masteryPerk: 'Excess healing from Siphon Life is converted into a Shadow Shield.',
            mod: { healPct: 10, pctDmg: 10 },
            icon: 'ra-droplet'
        },
        {
            id: 'sl_soul_drain', name: 'Multi-Siphon', max: 5, reqBaseLevel: 10,
            desc: '+15% Mana restored from the siphon effect.',
            masteryPerk: 'Siphon Life now chains to up to 2 additional nearby targets.',
            mod: { manaRestorePct: 15 },
            icon: 'ra-lightning-trio'
        }
    ],
    malefic_grasp: [
        {
            id: 'mg_focus', name: 'Aetheric Grasp', max: 5, reqBaseLevel: 5,
            desc: 'DoTs tick 10% faster per level.',
            masteryPerk: 'Malefic Grasp has a 20% chance to refresh the duration of Haunt.',
            mod: { tickRatePct: 10 },
            icon: 'ra-hand'
        },
        {
            id: 'mg_agony', name: 'Grasp of Torment', max: 5, reqBaseLevel: 10,
            desc: '+20% Damage and +10% slow to channeled targets.',
            masteryPerk: 'Malefic Grasp slowly pulls the target toward you while channeling.',
            mod: { pctDmg: 20, slowPct: 10 },
            icon: 'ra-magnet'
        }
    ],
    haunt: [
        {
            id: 'ha_terror', name: 'Terrifying Vision', max: 5, reqBaseLevel: 5,
            desc: '+20% Haunt damage and 10% chance to Fear the target.',
            masteryPerk: 'Haunt now heals you for 50% of the damage dealt when it returns.',
            mod: { pctDmg: 20 },
            icon: 'ra-ghost'
        },
        {
            id: 'ha_vengeance', name: 'Spiteful Haunt', max: 5, reqBaseLevel: 10,
            desc: '+15% Shadow Damage bonus to the target while Haunted.',
            masteryPerk: 'Haunt now explodes for massive AoE shadow damage if the target dies while affected.',
            mod: { shadowAmpPct: 15 },
            icon: 'ra-explosion'
        }
    ],
    soul_siphon: [
        {
            id: 'ss_reap', name: 'Soul Reaper', max: 5, reqBaseLevel: 10,
            desc: '+20% Mana restored on kill.',
            masteryPerk: 'Soul Siphon has a 10% chance to grant 2 Soul Shards on kill.',
            mod: { manaPct: 20 },
            icon: 'ra-reaper-scythe'
        },
        {
            id: 'ss_essence', name: 'Essence Harvest', max: 5, reqBaseLevel: 15,
            desc: '+10% Health restored on kill and +5% demon damage bonus.',
            masteryPerk: 'Soul Siphon also restores 5% of your demon\'s maximum health upon killing an enemy.',
            mod: { hpRestorePct: 10, petDmgPct: 5 },
            icon: 'ra-health'
        }
    ],
    agony: [
        {
            id: 'ag_malice', name: 'Malicious Growth', max: 5, reqBaseLevel: 5,
            desc: 'Agony reaches its maximum damage 20% faster per level.',
            masteryPerk: 'Agony ticks have a 5% chance to stun the target for 0.5s.',
            mod: { rampSpeed: 20 },
            icon: 'ra-internal-organ'
        },
        {
            id: 'ag_torment', name: 'Lingering Torment', max: 5, reqBaseLevel: 10,
            desc: '+10% Critical Strike chance for Agony ticks.',
            masteryPerk: 'Agony ticks reduce the target\'s attack speed by 5% per stack (max 25%).',
            mod: { critChance: 10 },
            icon: 'ra-broken-heart'
        }
    ],
    unstable_affliction: [
        {
            id: 'ua_volatile', name: 'Volatile Magic', max: 5, reqBaseLevel: 10,
            desc: '+20% Dispel Burst Damage per level.',
            masteryPerk: 'If the target dies with Unstable Affliction active, it explodes dealing AoE Shadow damage.',
            mod: { burstDmgPct: 20 },
            icon: 'ra-biohazard'
        },
        {
            id: 'ua_contagion', name: 'Creeping Doom', max: 5, reqBaseLevel: 15,
            desc: 'Reduces mana cost by 10% and increases duration by 1s.',
            masteryPerk: 'Unstable Affliction has a 20% chance to spread to a nearby enemy every 3 seconds.',
            mod: { manaCostRedPct: 10, duration: 1 },
            icon: 'ra-biohazard'
        }
    ],
    soul_fire: [
        {
            id: 'sf_blaze', name: 'Shadow Inferno', max: 5, reqBaseLevel: 15,
            desc: '+25% Damage and +10% splash radius.',
            masteryPerk: 'Soul Fire always critical strikes targets below 50% health.',
            mod: { pctDmg: 25 },
            icon: 'ra-fire-tail'
        },
        {
            id: 'sf_ember', name: 'Scorched Earth', max: 5, reqBaseLevel: 20,
            desc: 'Soul Fire leaves a burning trail that deals 20% weapon damage per second.',
            masteryPerk: 'Soul Fire deals 10% bonus damage for every Soul Shard you currently possess.',
            mod: { groundDmg: 20 },
            icon: 'ra-flame-symbol'
        }
    ],
    seed: [
        {
            id: 'soc_growth', name: 'Blooming Decay', max: 5, reqBaseLevel: 15,
            desc: '+15% Seed radius and +10% Damage.',
            masteryPerk: 'Seed of Corruption explosion applies Corruption to all targets hit.',
            mod: { radiusPct: 15 },
            icon: 'ra-bubbles'
        },
        {
            id: 'soc_shadow', name: 'Nightmare Seed', max: 5, reqBaseLevel: 20,
            desc: '+20% Shadow Damage to the explosion.',
            masteryPerk: 'Seed of Corruption explosion has a 50% chance to Fear all hit targets for 1 second.',
            mod: { shadowDmgPct: 20 },
            icon: 'ra-ghost'
        }
    ],
    pandemic: [
        {
            id: 'pa_contagion', name: 'Endless Plague', max: 5, reqBaseLevel: 20,
            desc: '+2m spread radius and +1s duration.',
            masteryPerk: 'Pandemic spread DoTs deal 100% damage (no penalty).',
            mod: { radiusBonus: 2 },
            icon: 'ra-biohazard'
        },
        {
            id: 'pa_fever', name: 'Vile Fever', max: 5, reqBaseLevel: 25,
            desc: 'Pandemic DoTs tick 15% faster.',
            masteryPerk: 'DoTs spread by Pandemic can no longer be dispelled by magic.',
            mod: { tickRatePct: 15 },
            icon: 'ra-biohazard'
        }
    ],

    // --- DEMONOLOGY TREE ---
    summon_felguard: [
        {
            id: 'sf_cleave', name: 'Demonic Cleave', max: 5, reqBaseLevel: 1,
            desc: '+10% Felguard Attack Speed and +15% Damage per level.',
            masteryPerk: 'The Felguard\'s attacks ignore 50% of the target\'s armor.',
            mod: { petIasPct: 10, petDmgPct: 15 },
            icon: 'ra-sword-clash'
        },
        {
            id: 'sf_legion', name: 'Legion Bulwark', max: 5, reqBaseLevel: 5,
            desc: '+20% Felguard HP and +15% Armor bonus.',
            masteryPerk: 'The Felguard periodically taunts all nearby enemies, forcing them to attack it.',
            mod: { petHpPct: 20, petArmorPct: 15 },
            icon: 'ra-shield'
        }
    ],
    summon_imp: [
        {
            id: 'si_firebolt', name: 'Empowered Firebolt', max: 5, reqBaseLevel: 1,
            desc: '+15% Imp Fire Damage per level.',
            masteryPerk: 'The Imp now fires 3 Firebolts in a cone.',
            mod: { petDmgPct: 15 },
            icon: 'ra-fire-tail'
        },
        {
            id: 'si_cauterize', name: 'Firebrand Healer', max: 5, reqBaseLevel: 5,
            desc: 'The Imp heals you for 10% of the fire damage it deals.',
            masteryPerk: 'Imp Firebolts explode on impact, dealing 30% splash damage to nearby foes.',
            mod: { petLeechPct: 10 },
            icon: 'ra-health'
        }
    ],
    demon_armor: [
        {
            id: 'da_hardened', name: 'Infernal Hide', max: 5, reqBaseLevel: 1,
            desc: '+10% Armor and +5% All Resistance per level.',
            masteryPerk: 'Demon Armor grants +10% Physical Damage Reduction while a demon is active.',
            mod: { pctArmor: 10, allRes: 5 },
            icon: 'ra-shield'
        },
        {
            id: 'da_spikes', name: 'Shadow Thorns', max: 5, reqBaseLevel: 5,
            desc: 'Reflects 15% of shadow damage taken back at the attacker.',
            masteryPerk: 'While active, your demon also gains 50% of your total Armor value.',
            mod: { reflectShadowPct: 15 },
            icon: 'ra-broken-heart'
        }
    ],
    demonic_empowerment: [
        {
            id: 'de_overload', name: 'Demon Rush', max: 5, reqBaseLevel: 5,
            desc: '+15% Demon Speed and +10% Demon Damage.',
            masteryPerk: 'Demonic Empowerment also restores 10% of your demon\'s health.',
            mod: { petSpeedPct: 15, petDmgPct: 10 },
            icon: 'ra-burning-embers'
        },
        {
            id: 'de_frenzy', name: 'Abyssal Frenzy', max: 5, reqBaseLevel: 10,
            desc: '+20% Demon Attack Speed and +10% Crit Chance.',
            masteryPerk: 'Demonic Empowerment also grants your pet 20% increased critical strike damage.',
            mod: { petIasPct: 20, petCritChance: 10 },
            icon: 'ra-muscle-fat'
        }
    ],
    summon_succubus: [
        {
            id: 'su_allure', name: 'Seductive Lash', max: 5, reqBaseLevel: 5,
            desc: '+20% Succubus Shadow damage and +10% Seduce duration.',
            masteryPerk: 'Seducing an enemy also reduces their Shadow Resistance by 30%.',
            mod: { petDmgPct: 20 },
            icon: 'ra-heartburn'
        },
        {
            id: 'su_pain', name: 'Dominatrix', max: 5, reqBaseLevel: 10,
            desc: 'Succubus deals 25% more damage to crowd-controlled enemies.',
            masteryPerk: 'Seduce now lasts 2 seconds longer and temporarily turns the enemy into an ally.',
            mod: { ccSynergyDmg: 25 },
            icon: 'ra-hand'
        }
    ],
    soul_link: [
        {
            id: 'sl_bond', name: 'Vitality Link', max: 5, reqBaseLevel: 10,
            desc: '+5% shared damage and +10% demon health.',
            masteryPerk: 'Your demon heals for 20% of the damage you deal.',
            mod: { redirectPct: 5 },
            icon: 'ra-heartburn'
        },
        {
            id: 'sl_protection', name: 'Sacrificial Bond', max: 5, reqBaseLevel: 15,
            desc: 'Demon takes an additional 5% of your incoming damage.',
            masteryPerk: 'When you take fatal damage, your demon is sacrificed instead, healing you for 30% (60s CD).',
            mod: { redirectPct: 5 },
            icon: 'ra-shield'
        }
    ],
    summon_voidwalker: [
        {
            id: 'sv_void_shield', name: 'Void Bulwark', max: 5, reqBaseLevel: 10,
            desc: '+15% Voidwalker HP and Armor per level.',
            masteryPerk: 'The Voidwalker emits a constant aura that slows enemies by 30%.',
            mod: { petHpPct: 15, petArmorPct: 15 },
            icon: 'ra-shield'
        },
        {
            id: 'sv_abyss', name: 'Singularity', max: 5, reqBaseLevel: 15,
            desc: 'Voidwalker deals pulsing Shadow damage (15% weapon damage) to nearby enemies.',
            masteryPerk: 'The Voidwalker periodically pulses, pulling all nearby enemies toward itself.',
            mod: { pulseDmgPct: 15 },
            icon: 'ra-magnet'
        }
    ],
    demonic_sacrifice: [
        {
            id: 'ds_blood', name: 'Dark Pact', max: 5, reqBaseLevel: 15,
            desc: '+20% HP/MP bonus from sacrifice.',
            masteryPerk: 'Sacrificing a demon grants you their primary ability for 30s.',
            mod: { buffPct: 20 },
            icon: 'ra-skull'
        },
        {
            id: 'ds_shadow', name: 'Abyssal Offering', max: 5, reqBaseLevel: 20,
            desc: '+15% Shadow Damage and +10% Shadow Pierce after sacrifice.',
            masteryPerk: 'Sacrificing a demon also grants a permanent (until death) minor attribute buff.',
            mod: { shadowDmgPct: 15, shadowPierce: 10 },
            icon: 'ra-soul-vessel'
        }
    ],
    master_demonologist: [
        {
            id: 'md_expert', name: 'Demonic Overlord', max: 5, reqBaseLevel: 20,
            desc: '+10% Demon Damage and +5% your damage per level.',
            masteryPerk: 'While you have a demon active, your cooldowns are reduced by 15%.',
            mod: { petDmgPct: 10 },
            icon: 'ra-dragon-head'
        },
        {
            id: 'md_bond', name: 'Twin Sovereigns', max: 5, reqBaseLevel: 25,
            desc: 'Demon damage increased by 15% of your maximum health.',
            masteryPerk: 'You can now have 2 demons active at once, though each deals 40% less damage.',
            mod: { hpToPetDmg: 15 },
            icon: 'ra-double-team'
        }
    ],
    dark_pact: [
        {
            id: 'dp_vamp', name: 'Sanguine Ritual', max: 5, reqBaseLevel: 25,
            desc: '+10% Mana restored and -5% demon HP cost.',
            masteryPerk: 'Dark Pact also grants you 2 Soul Shards.',
            mod: { manaPct: 10 },
            icon: 'ra-droplet'
        },
        {
            id: 'dp_shadow', name: 'Ethereal Shield', max: 5, reqBaseLevel: 30,
            desc: 'Grants a Shadow Shield that absorbs 15% of maximum HP in damage.',
            masteryPerk: 'Dark Pact no longer has a cooldown.',
            mod: { shieldPct: 15 },
            icon: 'ra-shield'
        }
    ],
    metamorphosis: [
        {
            id: 'me_demon_king', name: 'Demon King', max: 5, reqBaseLevel: 25,
            desc: '+10% Damage and +5% Armor while transformed.',
            masteryPerk: 'During Metamorphosis, you emit a persistent Immolation Aura.',
            mod: { pctDmg: 10, pctArmor: 5 },
            icon: 'ra-demon-shield'
        },
        {
            id: 'me_terror', name: 'Lord of Dread', max: 5, reqBaseLevel: 30,
            desc: 'Enemies near you are periodically Feared for 1s every 5s.',
            masteryPerk: 'While transformed, you can cast all Warlock spells while moving at full speed.',
            mod: { fearRate: 5 },
            icon: 'ra-ghost'
        }
    ],

    // --- DESTRUCTION TREE ---
    shadow_bolt: [
        {
            id: 'sb_siphon', name: 'Soul Siphon', max: 5, reqBaseLevel: 1,
            desc: '+10% Shadow Damage and heals 2% of Max HP on hit per level.',
            masteryPerk: 'Soul Harvest: Gains +5% Shadow damage for every Soul harvested (stacks to 10).',
            mod: { pctDmg: 10, healOnHitPct: 2 },
            icon: 'ra-shadow-follower'
        },
        {
            id: 'sb_chaos', name: 'Chaotic Surge', max: 5, reqBaseLevel: 5,
            desc: 'Shadow Bolt has a 20% chance to be converted into a Chaos Bolt.',
            masteryPerk: 'Shadow Bolt now pierces all enemies in its path.',
            mod: { chaosChance: 20 },
            icon: 'ra-lightning-bolt'
        }
    ],
    shadowburn: [
        {
            id: 'sb_finisher', name: 'Soul Burn', max: 5, reqBaseLevel: 1,
            desc: '+20% Damage and +5% crit chance.',
            masteryPerk: 'Shadowburn resets its cooldown if used on a target below 25% HP.',
            mod: { pctDmg: 20 },
            icon: 'ra-fire-tail'
        },
        {
            id: 'sb_reap', name: 'Shard Reaper', max: 5, reqBaseLevel: 5,
            desc: 'Restores a Soul Shard on hit (10s CD).',
            masteryPerk: 'Shadowburn deals 200% more damage if the target is below 20% health.',
            mod: { shardChance: 100 },
            icon: 'ra-soul-vessel'
        }
    ],
    aff_mastery: [
        {
            id: 'am_chaos', name: 'Chaos Lord', max: 5, reqBaseLevel: 5,
            desc: '+5% Chaos Damage and +2% All Resistance pierce per level.',
            masteryPerk: 'Your chaos spells have a 10% chance to trigger an explosion.',
            mod: { pctChaosDmg: 5 },
            icon: 'ra-sun-glow'
        },
        {
            id: 'am_shadow', name: 'Affliction Master', max: 5, reqBaseLevel: 10,
            desc: '+10% Affliction tree damage and +5% DoT duration.',
            masteryPerk: 'Every shadow spell cast has a 10% chance to automatically apply Curse of Exhaustion.',
            mod: { tree1DmgPct: 10, duration: 5 },
            icon: 'ra-broken-heart'
        }
    ],
    ember_storm: [
        {
            id: 'es_blaze', name: 'Ash Storm', max: 5, reqBaseLevel: 5,
            desc: 'Fire spells cast 10% faster and cost 10% less mana.',
            masteryPerk: 'Ember Storm grants a 10% chance to double-cast Fire spells.',
            mod: { iasPct: 10 },
            icon: 'ra-small-fire'
        },
        {
            id: 'es_chaos', name: 'Chaotic Ember', max: 5, reqBaseLevel: 10,
            desc: 'Chaos spells deal 10% increased damage per level.',
            masteryPerk: 'Every 10 seconds, your next Fire spell becomes instant-cast.',
            mod: { chaosDmgPct: 10 },
            icon: 'ra-lightning-trio'
        }
    ],
    immolate_warlock: [
        {
            id: 'im_blaze', name: 'Stoking the Flames', max: 5, reqBaseLevel: 5,
            desc: '+15% Immolate Burning damage.',
            masteryPerk: 'Immolate now has a 20% chance to explode on every tick.',
            mod: { burnDmgPct: 15 },
            icon: 'ra-small-fire'
        },
        {
            id: 'im_fire', name: 'Searing Heat', max: 5, reqBaseLevel: 10,
            desc: '+20% Initial hit damage and +10% Crit Multi.',
            masteryPerk: 'Immolate\'s burning damage now heals you for 1% of the damage dealt.',
            mod: { initialDmgPct: 20, critMulti: 10 },
            icon: 'ra-health'
        }
    ],
    conflagrate: [
        {
            id: 'cf_flare', name: 'Solar Flare', max: 5, reqBaseLevel: 10,
            desc: '+20% Conflagrate damage and +10% AoE radius.',
            masteryPerk: 'If Conflagrate kills an enemy, it resets the cooldown of Immolate.',
            mod: { pctDmg: 20, radiusPct: 10 },
            icon: 'ra-sun-glow'
        },
        {
            id: 'cf_burn', name: 'Incinerating Blast', max: 5, reqBaseLevel: 15,
            desc: 'Increases next Fire spell damage by 20% after use.',
            masteryPerk: 'Conflagrate now consumes the active Immolate DoT to deal its remaining damage instantly.',
            mod: { nextFireDmg: 20 },
            icon: 'ra-explosion'
        }
    ],
    incinerate: [
        {
            id: 'in_beam', name: 'Hellfire Beam', max: 5, reqBaseLevel: 15,
            desc: '+15% Damage and +10% range.',
            masteryPerk: 'Incinerate damage increases by 20% every second you channel it.',
            mod: { pctDmg: 15 },
            icon: 'ra-dragon-breath'
        },
        {
            id: 'in_fire', name: 'Width of Flame', max: 5, reqBaseLevel: 20,
            desc: '+20% AoE width and +10% burning damage.',
            masteryPerk: 'Incinerate can be channeled indefinitely after the first 5 seconds (zero mana cost).',
            mod: { widthPct: 20, burnDmgPct: 10 },
            icon: 'ra-large-fire'
        }
    ],
    backdraft: [
        {
            id: 'bd_haste', name: 'Thermal Flow', max: 5, reqBaseLevel: 15,
            desc: '+10% haste and +10% damage for 5s after Conflagrate.',
            masteryPerk: 'Backdraft stacks up to 3 times.',
            mod: { iasPct: 10 },
            icon: 'ra-fast-forward'
        },
        {
            id: 'bd_burn', name: 'Burning Haste', max: 5, reqBaseLevel: 20,
            desc: '+15% Fire Damage bonus while Backdraft is active.',
            masteryPerk: 'Backdraft also reduces the mana cost of Chaos Bolt by 50%.',
            mod: { fireDmgPct: 15 },
            icon: 'ra-lightning-bolt'
        }
    ],
    chaos_bolt: [
        {
            id: 'cb_annihilation', name: 'Annihilation', max: 5, reqBaseLevel: 20,
            desc: '+20% Damage per level.',
            masteryPerk: 'Chaos Bolt fractures on impact, sending 3 smaller bolts to nearby enemies.',
            mod: { pctDmg: 20 },
            icon: 'ra-shattered-glass'
        },
        {
            id: 'cb_destruction', name: 'Destructive Power', max: 5, reqBaseLevel: 25,
            desc: '+15% Destruction tree damage for 10s after use.',
            masteryPerk: 'Chaos Bolt is now guaranteed to result in a Critical Strike.',
            mod: { tree3DmgPct: 15 },
            icon: 'ra-bullseye'
        }
    ],
    rain_of_fire: [
        {
            id: 'rof_hellfire', name: 'Hellfire Rain', max: 5, reqBaseLevel: 20,
            desc: '+15% Radius and +15% Damage per level.',
            masteryPerk: 'Rain of Fire leaves burning patches on the ground that deal damage over time.',
            mod: { radiusPct: 15, pctDmg: 15 },
            icon: 'ra-meteor'
        },
        {
            id: 'rof_meteor', name: 'Meteor Shower', max: 5, reqBaseLevel: 25,
            desc: 'Every 3 seconds, a larger meteor falls dealing 200% damage.',
            masteryPerk: 'Rain of Fire also stuns all enemies hit for 0.1s on every damage tick.',
            mod: { meteorRate: 3 },
            icon: 'ra-meteor'
        }
    ],
    hellfire: [
        {
            id: 'hf_core', name: 'Infernal Core', max: 5, reqBaseLevel: 25,
            desc: '+20% Damage and -10% self-damage.',
            masteryPerk: 'Hellfire creates a 5s persistent field of fire around you.',
            mod: { pctDmg: 20 },
            icon: 'ra-large-fire'
        },
        {
            id: 'hf_immolation', name: 'Master of Flames', max: 5, reqBaseLevel: 30,
            desc: '+20% Radius and +10% fire damage bonus.',
            masteryPerk: 'Hellfire no longer deals any damage to the caster.',
            mod: { radiusPct: 20, fireDmgPct: 10 },
            icon: 'ra-sun-glow'
        }
    ]
};
