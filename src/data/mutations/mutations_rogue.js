export const ROGUE_MUTATIONS = {
    // --- ASSASSINATION TREE ---
    claw_strike: [
        {
            id: 'cs_bleed', name: 'Jagged Claws', max: 5, reqBaseLevel: 1,
            desc: '+10% Damage and applies a bleed for 3s.',
            masteryPerk: 'Claw Strike has a 20% chance to generate 2 Combo Points.',
            mod: { pctDmg: 10, bleedDmg: 20 },
            icon: 'ra-dripping-blade'
        }
    ],
    shadow_step: [
        {
            id: 'ss_phantom', name: 'Phantom Strike', max: 5, reqBaseLevel: 5,
            desc: '+20% range and +10% damage to the next attack.',
            masteryPerk: 'Shadow Step leaves a decoy that distracts enemies for 2s.',
            mod: { rangeBonus: 20 },
            icon: 'ra-fast-forward'
        }
    ],
    ambush: [
        {
            id: 'am_cold', name: 'Cold Blooded', max: 5, reqBaseLevel: 5,
            desc: '+20% Crit Multi and +10% Damage.',
            masteryPerk: 'Ambush resets its cooldown if used from a Smoke Bomb.',
            mod: { critMulti: 20, pctDmg: 10 },
            icon: 'ra-snowflake'
        }
    ],
    assassin_mastery: [
        {
            id: 'am_lethality', name: 'Lethality', max: 5, reqBaseLevel: 10,
            desc: '+5% Agility and +10% Crit Multi per level.',
            masteryPerk: 'Your critical strikes reduce enemy armor by 5% for 3s.',
            mod: { pctDex: 5, critMulti: 10 },
            icon: 'ra-bullseye'
        }
    ],
    eviscerate: [
        {
            id: 'ev_bleed', name: 'Rupture', max: 5, reqBaseLevel: 1,
            desc: '+15% Damage and applies a bleed for 5s.',
            masteryPerk: 'Eviscerate deals 50% more damage if the target is already bleeding.',
            mod: { pctDmg: 15, bleedDmg: 20 },
            icon: 'ra-dripping-blade'
        }
    ],
    vanish: [
        {
            id: 'va_haste', name: 'Shadow Runner', max: 5, reqBaseLevel: 5,
            desc: '+10% Movement Speed and +5% Dodge while stealthed.',
            masteryPerk: 'Vanish grants a 100% chance to dodge the next 2 attacks.',
            mod: { moveSpeed: 10 },
            icon: 'ra-fast-forward'
        }
    ],
    fan_of_knives: [
        {
            id: 'fok_shred', name: 'Knife Storm', max: 5, reqBaseLevel: 10,
            desc: '+15% Damage and +10% radius.',
            masteryPerk: 'Fan of Knives has a 30% chance to reset the cooldown of Shadow Step.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-split-arrows'
        }
    ],
    death_mark: [
        {
            id: 'dm_fatal', name: 'Fatal Flaw', max: 5, reqBaseLevel: 15,
            desc: 'Marked targets take +10% more damage.',
            masteryPerk: 'If a Marked target dies, all nearby enemies are also marked.',
            mod: { dmgAmp: 10 },
            icon: 'ra-skull'
        }
    ],
    smoke_bomb: [
        {
            id: 'sb_miasma', name: 'Toxic Cloud', max: 5, reqBaseLevel: 15,
            desc: 'Smoke Bomb deals 20% poison damage per second.',
            masteryPerk: 'Enemies in the smoke are also Blinded for 2s.',
            mod: { poisDmg: 20 },
            icon: 'ra-biohazard'
        }
    ],
    blade_dance: [
        {
            id: 'bd_cyclone', name: 'Steel Cyclone', max: 5, reqBaseLevel: 10,
            desc: '+15% Blade Dance radius and +5% Move Speed.',
            masteryPerk: 'While Dancing, you deflect 30% of incoming projectiles.',
            mod: { radiusPct: 15, moveSpeedPct: 5 },
            icon: 'ra-cyclone'
        }
    ],
    cloak_of_shadows: [
        {
            id: 'cos_void', name: 'Void Mantle', max: 5, reqBaseLevel: 20,
            desc: '+1s duration and +20% magic resistance.',
            masteryPerk: 'While Cloaked, you regenerate 5% of your maximum health per second.',
            mod: { duration: 1 },
            icon: 'ra-shield'
        }
    ],
    shadow_clone: [
        {
            id: 'sc_echo', name: 'Perfect Copy', max: 5, reqBaseLevel: 20,
            desc: 'Shadow Clone deals +10% of your damage.',
            masteryPerk: 'Shadow Clone now lasts 5s longer and can use your finishers.',
            mod: { cloneDmg: 10 },
            icon: 'ra-shadow-follower'
        }
    ],
    assassinate: [
        {
            id: 'as_lethality', name: 'Cold Blooded', max: 5, reqBaseLevel: 15,
            desc: '+25% Damage and +10% Crit Chance.',
            masteryPerk: 'Assassinate resets its cooldown if it kills the target.',
            mod: { pctDmg: 25, critChance: 10 },
            icon: 'ra-skull'
        }
    ],

    // --- POISON TREE ---
    poison_blade: [
        {
            id: 'pb_toxin', name: 'Vile Coating', max: 5, reqBaseLevel: 1,
            desc: '+15% Poison Damage per level.',
            masteryPerk: 'Poison Blade attacks also reduce enemy healing by 30%.',
            mod: { poisDmgPct: 15 },
            icon: 'ra-biohazard'
        }
    ],
    master_poisoner: [
        {
            id: 'mp_alchemy', name: 'Alchemy Master', max: 5, reqBaseLevel: 1,
            desc: '+5% Poison Damage and +2% Poison Pierce.',
            masteryPerk: 'Your poisons deal double damage to enemies with full health.',
            mod: { pctPoisonDmg: 5, poisPierce: 2 },
            icon: 'ra-bubbles'
        }
    ],
    shiv: [
        {
            id: 'sh_jab', name: 'Quick Toxin', max: 5, reqBaseLevel: 5,
            desc: '+15% Shiv damage and +10% attack speed.',
            masteryPerk: 'Shiv has a 50% chance to apply another stack of poison.',
            mod: { pctDmg: 15 },
            icon: 'ra-dripping-blade'
        }
    ],
    venom: [
        {
            id: 've_toxic', name: 'Deadly Toxins', max: 5, reqBaseLevel: 5,
            desc: '+15% Poison damage and +2s duration.',
            masteryPerk: 'Venom attacks reduce target armor by 10% per hit (stacks to 5).',
            mod: { poisDmgPct: 15 },
            icon: 'ra-biohazard'
        }
    ],
    envenom: [
        {
            id: 'ev_fatal', name: 'Lethal Injection', max: 5, reqBaseLevel: 5,
            desc: '+20% Damage and +1s duration.',
            masteryPerk: 'Envenom reduces the target\'s movement speed by 50%.',
            mod: { pctDmg: 20 },
            icon: 'ra-droplet'
        }
    ],
    lethal_toxins: [
        {
            id: 'lt_weakness', name: 'System Shock', max: 5, reqBaseLevel: 10,
            desc: '+2% slow and +2% attack speed reduction per level.',
            masteryPerk: 'Lethal Toxins also reduces enemy resistance by 10%.',
            mod: { slowPct: 2 },
            icon: 'ra-broken-heart'
        }
    ],
    plague: [
        {
            id: 'pl_spread', name: 'Contagion', max: 5, reqBaseLevel: 15,
            desc: '+15% Cloud radius and +1s duration.',
            masteryPerk: 'Plague cloud explosions deal 100% magic damage.',
            mod: { radiusPct: 15, duration: 1 },
            icon: 'ra-biohazard'
        }
    ],
    poison_sentry: [
        {
            id: 'ps_sprayer', name: 'Noxious Sprayer', max: 5, reqBaseLevel: 15,
            desc: 'Sentry fires 20% faster and has +10% radius.',
            masteryPerk: 'Poison Sentry deals triple damage to slowed enemies.',
            mod: { fireRate: 20 },
            icon: 'ra-waves-pulse'
        }
    ],
    rupture: [
        {
            id: 'ru_haemorrhage', name: 'Exsanguinate', max: 5, reqBaseLevel: 20,
            desc: '+20% Bleed damage per level.',
            masteryPerk: 'Rupture heals you for 10% of the damage dealt.',
            mod: { bleedDmgPct: 20 },
            icon: 'ra-dripping-blade'
        }
    ],

    // --- TRAPS TREE ---
    shock_trap: [
        {
            id: 'st_stunning', name: 'Lightning Cage', max: 5, reqBaseLevel: 1,
            desc: '+10% Lightning Damage and +0.2s stun.',
            masteryPerk: 'Shock Trap hits 2 additional nearby targets.',
            mod: { pctDmg: 10, stunDur: 0.2 },
            icon: 'ra-lightning-trio'
        }
    ],
    trap_mastery: [
        {
            id: 'tm_engineering', name: 'Master Engineer', max: 5, reqBaseLevel: 1,
            desc: '+10% Trap damage and +5% Trap radius.',
            masteryPerk: 'Trap Mastery reduces the setup time of all traps by 50%.',
            mod: { trapDmg: 10, trapRadius: 5 },
            icon: 'ra-wrench'
        }
    ],
    chain_reaction: [
        {
            id: 'cr_ignition', name: 'Fuel the Fire', max: 5, reqBaseLevel: 5,
            desc: '+5% Crit chance and +10% Trap radius.',
            masteryPerk: 'Trap explosions trigger a second smaller explosion for 50% damage.',
            mod: { critChance: 5, radiusPct: 10 },
            icon: 'ra-bomb-explosion'
        }
    ],
    fire_sentry: [
        {
            id: 'fs_inferno', name: 'Inferno Turret', max: 5, reqBaseLevel: 10,
            desc: '+15% Fire Damage and +10% fire rate.',
            masteryPerk: 'Fire Sentry now fires 3 bolts in a cone.',
            mod: { pctDmg: 15 },
            icon: 'ra-fire-tail'
        }
    ],
    death_sentry: [
        {
            id: 'ds_corpse', name: 'Vile Explosion', max: 5, reqBaseLevel: 10,
            desc: '+20% Corpse Explosion damage.',
            masteryPerk: 'Death Sentry explosions release a Poison Nova.',
            mod: { pctDmg: 20 },
            icon: 'ra-skull'
        }
    ],
    ice_trap: [
        {
            id: 'it_shiver', name: 'Frost Field', max: 5, reqBaseLevel: 15,
            desc: '+15% Cold Damage and +1s freeze.',
            masteryPerk: 'Ice Trap shatters on impact, dealing physical damage.',
            mod: { pctDmg: 15 },
            icon: 'ra-snowflake'
        }
    ],
    unfair_advantage: [
        {
            id: 'ua_merciless', name: 'No Mercy', max: 5, reqBaseLevel: 15,
            desc: '+5% Damage vs CC enemies.',
            masteryPerk: 'Unfair Advantage grants 20% Life Steal vs Stunned targets.',
            mod: { pctDmgVsCC: 5 },
            icon: 'ra-broken-heart'
        }
    ],
    evasion: [
        {
            id: 'ev_reflexes', name: 'Lightning Reflexes', max: 5, reqBaseLevel: 15,
            desc: '+2% Dodge chance and +5% Move Speed.',
            masteryPerk: 'Successfully dodging grants +20% damage for 2s.',
            mod: { dodgeChance: 2 },
            icon: 'ra-fast-forward'
        }
    ],
    preparation: [
        {
            id: 'pr_tactical', name: 'Tactical Genius', max: 5, reqBaseLevel: 25,
            desc: 'Reduces Preparation cooldown by 30s.',
            masteryPerk: 'Preparation also restores 20% of your maximum health.',
            mod: { cdRed: 30 },
            icon: 'ra-clockwork'
        }
    ]
};
