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
        }
    ],
    siphon_life: [
        {
            id: 'sl_leech', name: 'Vampiric Leech', max: 5, reqBaseLevel: 5,
            desc: '+10% Healing amount and +10% Damage per level.',
            masteryPerk: 'Excess healing from Siphon Life is converted into a Shadow Shield.',
            mod: { healPct: 10, pctDmg: 10 },
            icon: 'ra-droplet'
        }
    ],
    malefic_grasp: [
        {
            id: 'mg_focus', name: 'Aetheric Grasp', max: 5, reqBaseLevel: 5,
            desc: 'DoTs tick 10% faster per level.',
            masteryPerk: 'Malefic Grasp has a 20% chance to refresh the duration of Haunt.',
            mod: { tickRatePct: 10 },
            icon: 'ra-hand'
        }
    ],
    haunt: [
        {
            id: 'ha_terror', name: 'Terrifying Vision', max: 5, reqBaseLevel: 5,
            desc: '+20% Haunt damage and 10% chance to Fear the target.',
            masteryPerk: 'Haunt now heals you for 50% of the damage dealt when it returns.',
            mod: { pctDmg: 20 },
            icon: 'ra-ghost'
        }
    ],
    soul_siphon: [
        {
            id: 'ss_reap', name: 'Soul Reaper', max: 5, reqBaseLevel: 10,
            desc: '+20% Mana restored on kill.',
            masteryPerk: 'Soul Siphon has a 10% chance to grant 2 Soul Shards on kill.',
            mod: { manaPct: 20 },
            icon: 'ra-reaper-scythe'
        }
    ],
    agony: [
        {
            id: 'ag_malice', name: 'Malicious Growth', max: 5, reqBaseLevel: 5,
            desc: 'Agony reaches its maximum damage 20% faster per level.',
            masteryPerk: 'Agony ticks have a 5% chance to stun the target for 0.5s.',
            mod: { rampSpeed: 20 },
            icon: 'ra-internal-organ'
        }
    ],
    unstable_affliction: [
        {
            id: 'ua_volatile', name: 'Volatile Magic', max: 5, reqBaseLevel: 10,
            desc: '+20% Dispel Burst Damage per level.',
            masteryPerk: 'If the target dies with Unstable Affliction active, it explodes dealing AoE Shadow damage.',
            mod: { burstDmgPct: 20 },
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
        }
    ],
    seed: [
        {
            id: 'soc_growth', name: 'Blooming Decay', max: 5, reqBaseLevel: 15,
            desc: '+15% Seed radius and +10% Damage.',
            masteryPerk: 'Seed of Corruption explosion applies Corruption to all targets hit.',
            mod: { radiusPct: 15 },
            icon: 'ra-bubbles'
        }
    ],
    pandemic: [
        {
            id: 'pa_contagion', name: 'Endless Plague', max: 5, reqBaseLevel: 20,
            desc: '+2m spread radius and +1s duration.',
            masteryPerk: 'Pandemic spread DoTs deal 100% damage (no penalty).',
            mod: { radiusBonus: 2 },
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
        }
    ],
    summon_imp: [
        {
            id: 'si_firebolt', name: 'Empowered Firebolt', max: 5, reqBaseLevel: 1,
            desc: '+15% Imp Fire Damage per level.',
            masteryPerk: 'The Imp now fires 3 Firebolts in a cone.',
            mod: { petDmgPct: 15 },
            icon: 'ra-fire-tail'
        }
    ],
    demon_armor: [
        {
            id: 'da_hardened', name: 'Infernal Hide', max: 5, reqBaseLevel: 1,
            desc: '+10% Armor and +5% All Resistance per level.',
            masteryPerk: 'Demon Armor grants +10% Physical Damage Reduction while a demon is active.',
            mod: { pctArmor: 10, allRes: 5 },
            icon: 'ra-shield'
        }
    ],
    demonic_empowerment: [
        {
            id: 'de_overload', name: 'Demon Rush', max: 5, reqBaseLevel: 5,
            desc: '+15% Demon Speed and +10% Demon Damage.',
            masteryPerk: 'Demonic Empowerment also restores 10% of your demon\'s health.',
            mod: { petSpeedPct: 15, petDmgPct: 10 },
            icon: 'ra-burning-embers'
        }
    ],
    summon_succubus: [
        {
            id: 'su_allure', name: 'Seductive Lash', max: 5, reqBaseLevel: 5,
            desc: '+20% Succubus Shadow damage and +10% Seduce duration.',
            masteryPerk: 'Seducing an enemy also reduces their Shadow Resistance by 30%.',
            mod: { petDmgPct: 20 },
            icon: 'ra-heartburn'
        }
    ],
    soul_link: [
        {
            id: 'sl_bond', name: 'Vitality Link', max: 5, reqBaseLevel: 10,
            desc: '+5% shared damage and +10% demon health.',
            masteryPerk: 'Your demon heals for 20% of the damage you deal.',
            mod: { redirectPct: 5 },
            icon: 'ra-heartburn'
        }
    ],
    summon_voidwalker: [
        {
            id: 'sv_void_shield', name: 'Void Bulwark', max: 5, reqBaseLevel: 10,
            desc: '+15% Voidwalker HP and Armor per level.',
            masteryPerk: 'The Voidwalker emits a constant aura that slows enemies by 30%.',
            mod: { petHpPct: 15, petArmorPct: 15 },
            icon: 'ra-shield'
        }
    ],
    demonic_sacrifice: [
        {
            id: 'ds_blood', name: 'Dark Pact', max: 5, reqBaseLevel: 15,
            desc: '+20% HP/MP bonus from sacrifice.',
            masteryPerk: 'Sacrificing a demon grants you their primary ability for 30s.',
            mod: { buffPct: 20 },
            icon: 'ra-skull'
        }
    ],
    master_demonologist: [
        {
            id: 'md_expert', name: 'Demonic Overlord', max: 5, reqBaseLevel: 20,
            desc: '+10% Demon Damage and +5% your damage per level.',
            masteryPerk: 'While you have a demon active, your cooldowns are reduced by 15%.',
            mod: { petDmgPct: 10 },
            icon: 'ra-dragon-head'
        }
    ],
    dark_pact: [
        {
            id: 'dp_vamp', name: 'Sanguine Ritual', max: 5, reqBaseLevel: 25,
            desc: '+10% Mana restored and -5% demon HP cost.',
            masteryPerk: 'Dark Pact also grants you 2 Soul Shards.',
            mod: { manaPct: 10 },
            icon: 'ra-droplet'
        }
    ],
    metamorphosis: [
        {
            id: 'me_demon_king', name: 'Demon King', max: 5, reqBaseLevel: 25,
            desc: '+10% Damage and +5% Armor while transformed.',
            masteryPerk: 'During Metamorphosis, you emit a persistent Immolation Aura.',
            mod: { pctDmg: 10, pctArmor: 5 },
            icon: 'ra-demon-shield'
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
        }
    ],
    shadowburn: [
        {
            id: 'sb_finisher', name: 'Soul Burn', max: 5, reqBaseLevel: 1,
            desc: '+20% Damage and +5% crit chance.',
            masteryPerk: 'Shadowburn resets its cooldown if used on a target below 25% HP.',
            mod: { pctDmg: 20 },
            icon: 'ra-fire-tail'
        }
    ],
    aff_mastery: [
        {
            id: 'am_chaos', name: 'Chaos Lord', max: 5, reqBaseLevel: 5,
            desc: '+5% Chaos Damage and +2% All Resistance pierce per level.',
            masteryPerk: 'Your chaos spells have a 10% chance to trigger an explosion.',
            mod: { pctChaosDmg: 5 },
            icon: 'ra-sun-glow'
        }
    ],
    ember_storm: [
        {
            id: 'es_blaze', name: 'Ash Storm', max: 5, reqBaseLevel: 5,
            desc: 'Fire spells cast 10% faster and cost 10% less mana.',
            masteryPerk: 'Ember Storm grants a 10% chance to double-cast Fire spells.',
            mod: { iasPct: 10 },
            icon: 'ra-small-fire'
        }
    ],
    immolate_warlock: [
        {
            id: 'im_blaze', name: 'Stoking the Flames', max: 5, reqBaseLevel: 5,
            desc: '+15% Immolate Burning damage.',
            masteryPerk: 'Immolate now has a 20% chance to explode on every tick.',
            mod: { burnDmgPct: 15 },
            icon: 'ra-small-fire'
        }
    ],
    conflagrate: [
        {
            id: 'cf_flare', name: 'Solar Flare', max: 5, reqBaseLevel: 10,
            desc: '+20% Conflagrate damage and +10% AoE radius.',
            masteryPerk: 'If Conflagrate kills an enemy, it resets the cooldown of Immolate.',
            mod: { pctDmg: 20, radiusPct: 10 },
            icon: 'ra-sun-glow'
        }
    ],
    incinerate: [
        {
            id: 'in_beam', name: 'Hellfire Beam', max: 5, reqBaseLevel: 15,
            desc: '+15% Damage and +10% range.',
            masteryPerk: 'Incinerate damage increases by 20% every second you channel it.',
            mod: { pctDmg: 15 },
            icon: 'ra-dragon-breath'
        }
    ],
    backdraft: [
        {
            id: 'bd_haste', name: 'Thermal Flow', max: 5, reqBaseLevel: 15,
            desc: '+10% haste and +10% damage for 5s after Conflagrate.',
            masteryPerk: 'Backdraft stacks up to 3 times.',
            mod: { iasPct: 10 },
            icon: 'ra-fast-forward'
        }
    ],
    chaos_bolt: [
        {
            id: 'cb_annihilation', name: 'Annihilation', max: 5, reqBaseLevel: 20,
            desc: '+20% Damage per level.',
            masteryPerk: 'Chaos Bolt fractures on impact, sending 3 smaller bolts to nearby enemies.',
            mod: { pctDmg: 20 },
            icon: 'ra-shattered-glass'
        }
    ],
    rain_of_fire: [
        {
            id: 'rof_hellfire', name: 'Hellfire Rain', max: 5, reqBaseLevel: 20,
            desc: '+15% Radius and +15% Damage per level.',
            masteryPerk: 'Rain of Fire leaves burning patches on the ground that deal damage over time.',
            mod: { radiusPct: 15, pctDmg: 15 },
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
        }
    ]
};
