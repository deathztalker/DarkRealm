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
            mod: { slowPct: 10, enemyIasRed: 5 },
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
    siphon_life: [
        {
            id: 'sl_leech', name: 'Vampiric Leech', max: 5, reqBaseLevel: 5,
            desc: '+10% Healing amount and +10% Damage per level.',
            masteryPerk: 'Excess healing from Siphon Life is converted into a Shadow Shield.',
            mod: { healPct: 10, pctDmg: 10 },
            icon: 'ra-droplet'
        }
    ],
    haunt: [
        {
            id: 'ha_terror', name: 'Terrifying Vision', max: 5, reqBaseLevel: 5,
            desc: '+20% Haunt damage and 10% chance to Fear the target.',
            masteryPerk: 'Haunt now heals you for 50% of the damage dealt when it returns.',
            mod: { pctDmg: 20, fearChance: 10 },
            icon: 'ra-ghost'
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

    // --- DEMONOLOGY TREE ---
    summon_imp: [
        {
            id: 'si_firebolt', name: 'Empowered Firebolt', max: 5, reqBaseLevel: 1,
            desc: '+15% Imp Fire Damage per level.',
            masteryPerk: 'The Imp now fires 3 Firebolts in a cone.',
            mod: { petDmgPct: 15 },
            icon: 'ra-fire-tail'
        }
    ],
    summon_voidwalker: [
        {
            id: 'sv_void_shield', name: 'Void Bulwark', max: 5, reqBaseLevel: 5,
            desc: '+15% Voidwalker HP and Armor per level.',
            masteryPerk: 'The Voidwalker emits a constant aura that slows enemies by 30%.',
            mod: { petHpPct: 15, petArmorPct: 15 },
            icon: 'ra-shield'
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
    summon_felguard: [
        {
            id: 'sf_cleave', name: 'Demonic Cleave', max: 5, reqBaseLevel: 10,
            desc: '+10% Felguard Attack Speed and +15% Damage per level.',
            masteryPerk: 'The Felguard\'s attacks ignore 50% of the target\'s armor.',
            mod: { petIasPct: 10, petDmgPct: 15 },
            icon: 'ra-sword-clash'
        }
    ],
    metamorphosis: [
        {
            id: 'me_demon_king', name: 'Demon King', max: 5, reqBaseLevel: 10,
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
        },
        {
            id: 'sb_chain', name: 'Nether Chain', max: 5, reqBaseLevel: 5,
            desc: 'Chains to 1 additional target per level.',
            masteryPerk: 'Void Beam: The chain creates a persistent beam that ticks damage every 0.5s.',
            mod: { extraTargets: 1 },
            icon: 'ra-chain'
        }
    ],
    immolate_warlock: [
        {
            id: 'im_blaze', name: 'Stoking the Flames', max: 5, reqBaseLevel: 1,
            desc: '+15% Immolate Burning damage.',
            masteryPerk: 'Immolate now has a 20% chance to explode on every tick.',
            mod: { burnDmgPct: 15 },
            icon: 'ra-small-fire'
        }
    ],
    conflagrate: [
        {
            id: 'cf_flare', name: 'Solar Flare', max: 5, reqBaseLevel: 5,
            desc: '+20% Conflagrate damage and +10% AoE radius.',
            masteryPerk: 'If Conflagrate kills an enemy, it resets the cooldown of Immolate.',
            mod: { pctDmg: 20, radiusPct: 10 },
            icon: 'ra-sun-glow'
        }
    ],
    chaos_bolt: [
        {
            id: 'cb_annihilation', name: 'Annihilation', max: 5, reqBaseLevel: 10,
            desc: '+20% Damage per level.',
            masteryPerk: 'Chaos Bolt fractures on impact, sending 3 smaller bolts to nearby enemies.',
            mod: { pctDmg: 20 },
            icon: 'ra-shattered-glass'
        }
    ],
    rain_of_fire: [
        {
            id: 'rof_hellfire', name: 'Hellfire Rain', max: 5, reqBaseLevel: 10,
            desc: '+15% Radius and +15% Damage per level.',
            masteryPerk: 'Rain of Fire leaves burning patches on the ground that deal damage over time.',
            mod: { radiusPct: 15, pctDmg: 15 },
            icon: 'ra-meteor'
        }
    ]
};
