export const ROGUE_MUTATIONS = {
    claw_strike: [
        {
            id: 'cs_quick', name: 'Quick Strikes', max: 5,
            desc: '+10% Attack Speed for 2s on hit.',
            masteryPerk: 'Claw Strike has a 20% chance to generate 2 Combo Points instead of 1.',
            mod: { speedPct: 10 },
            icon: 'ra-fast-forward'
        }
    ],
    shadow_step: [
        {
            id: 'ss_lethal', name: 'Lethal Intent', max: 5,
            desc: '+10% damage bonus to the next skill.',
            masteryPerk: 'Shadow Step resets the cooldown of Vanish on kill.',
            mod: { dmgBonus: 10 },
            icon: 'ra-hood'
        }
    ],
    ambush: [
        {
            id: 'am_deadly', name: 'Deadly Ambush', max: 5,
            desc: '+15% Damage and +10% Crit Damage.',
            masteryPerk: 'Ambush now stuns the target for 2s.',
            mod: { pctDmg: 15, critDmg: 10 },
            icon: 'ra-hood'
        }
    ],
    eviscerate: [
        {
            id: 'ev_gut', name: 'Gut Ripper', max: 5,
            desc: '+10% Damage and +5% Crit chance.',
            masteryPerk: 'Eviscerate deals 50% more damage if used with 5 Combo Points.',
            mod: { pctDmg: 10, critChance: 5 },
            icon: 'ra-dripping-blade'
        }
    ],
    vanish: [
        {
            id: 'vn_mist', name: 'Shrouded Mist', max: 5,
            desc: '+2s duration and -5s cooldown.',
            masteryPerk: 'Vanish now heals you for 5% max HP every second while active.',
            mod: { duration: 2, cdRed: 5 },
            icon: 'ra-cloudy-smoke'
        }
    ],
    fan_of_knives: [
        {
            id: 'fok_blades', name: 'Razor Blades', max: 5,
            desc: '+15% Damage and +10% Radius.',
            masteryPerk: 'Fan of Knives now hits 2 additional times over 1s.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-split-body'
        }
    ],
    death_mark: [
        {
            id: 'dm_reaper', name: 'Reaper Mark', max: 5,
            desc: '+5% damage taken by enemy and +2s duration.',
            masteryPerk: 'If the marked enemy dies, Death Mark is cast on a nearby enemy.',
            mod: { dmgIncPct: 5, duration: 2 },
            icon: 'ra-skull'
        }
    ],
    smoke_bomb: [
        {
            id: 'sb_blindside', name: 'Blindside', max: 5,
            desc: 'Enemies inside take +20% damage.',
            masteryPerk: 'Evasion: You gain 100% Dodge chance while standing inside the smoke.',
            mod: { enemyTakenDmgPct: 20 },
            icon: 'ra-cloudy-smoke'
        },
        {
            id: 'sb_lingering', name: 'Lingering Fog', max: 5,
            desc: '+1s Smoke Bomb duration per level.',
            masteryPerk: 'Stalker: The smoke bomb now follows you as you move.',
            mod: { duration: 1 },
            icon: 'ra-fizzing-flask'
        }
    ],
    blade_dance: [
        {
            id: 'bd_whirl', name: 'Whirling Death', max: 5,
            desc: '+10% Damage and +1 hit.',
            masteryPerk: 'Blade Dance creates small wind blades that deal 20% damage.',
            mod: { pctDmg: 10, extraHits: 1 },
            icon: 'ra-whirlwind'
        }
    ],
    cloak_of_shadows: [
        {
            id: 'cos_night', name: 'Night Cloak', max: 5,
            desc: '+0.5s duration and -5s cooldown.',
            masteryPerk: 'While active, Cloak of Shadows also grants 50% movement speed.',
            mod: { duration: 0.5, cdRed: 5 },
            icon: 'ra-hood'
        }
    ],
    shadow_clone: [
        {
            id: 'sc_echo', name: 'Shadow Echo', max: 5,
            desc: '+5% clone effectiveness and +2s duration.',
            masteryPerk: 'You can now have 2 Shadow Clones at once.',
            mod: { effectPct: 5, duration: 2 },
            icon: 'ra-ghost'
        }
    ],
    poison_blade: [
        {
            id: 'pb_toxic', name: 'Lethal Venom', max: 5,
            desc: '+15% Poison damage and +1s duration.',
            masteryPerk: 'Poison Blade attacks also reduce enemy attack speed by 10%.',
            mod: { poisonDmgPct: 15, duration: 1 },
            icon: 'ra-dripping-blade'
        }
    ],
    shiv: [
        {
            id: 'sh_jab', name: 'Quick Jab', max: 5,
            desc: '+15% Damage and -0.5s cooldown.',
            masteryPerk: 'Shiv now generates 2 Combo Points.',
            mod: { pctDmg: 15, cdRed: 0.5 },
            icon: 'ra-daggers'
        }
    ],
    envenom: [
        {
            id: 'env_lethal', name: 'Deadly Injection', max: 5,
            desc: '+15% Damage and +1s duration.',
            masteryPerk: 'Envenom deals 100% more damage if the target is already poisoned.',
            mod: { pctDmg: 15, duration: 1 },
            icon: 'ra-dripping-blade'
        }
    ],
    plague: [
        {
            id: 'pl_outbreak', name: 'Outbreak', max: 5,
            desc: '+15% Damage and +10% Radius.',
            masteryPerk: 'Plague now spreads to all enemies hit by your melee attacks.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-poison-cloud'
        }
    ],
    poison_sentry: [
        {
            id: 'ps_toxic', name: 'Toxic Spray', max: 5,
            desc: '+15% Damage and +10% cone angle.',
            masteryPerk: 'Poison Sentry shoots 2 additional projectiles.',
            mod: { pctDmg: 15, anglePct: 10 },
            icon: 'ra-poison-cloud'
        }
    ],
    rupture: [
        {
            id: 'rp_bleed', name: 'Deep Rupture', max: 5,
            desc: '+15% Bleed damage and +2s duration.',
            masteryPerk: 'Rupture deals triple damage to targets below 30% HP.',
            mod: { bleedDmgPct: 15, duration: 2 },
            icon: 'ra-bleeding-hearts'
        }
    ],
    shock_trap: [
        {
            id: 'st_surge', name: 'Voltage Trap', max: 5,
            desc: '+15% Damage and +0.2s stun.',
            masteryPerk: 'Shock Trap now shocks up to 3 nearby enemies.',
            mod: { pctDmg: 15, stunDur: 0.2 },
            icon: 'ra-lightning-bolt'
        }
    ],
    fire_sentry: [
        {
            id: 'fs_blaze', name: 'Inferno Sentry', max: 5,
            desc: '+15% Damage and -0.1s fire rate.',
            masteryPerk: 'Fire Sentry now shoots 3 firebolts in a spread.',
            mod: { pctDmg: 15, fireRateRed: 0.1 },
            icon: 'ra-fireball'
        }
    ],
    death_sentry: [
        {
            id: 'ds_lightning', name: 'Storm Sentry', max: 5,
            desc: '+15% Damage and +10% explosion radius.',
            masteryPerk: 'Death Sentry now fires 2 lightning bolts at once.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-lightning-storm'
        }
    ],
    ice_trap: [
        {
            id: 'it_frost', name: 'Arctic Trap', max: 5,
            desc: '+15% Damage and +0.5s freeze.',
            masteryPerk: 'Ice Trap leaves a trail of frozen ground for 5s.',
            mod: { pctDmg: 15, freezeDur: 0.5 },
            icon: 'ra-ice-cube'
        }
    ],
    preparation: [
        {
            id: 'pr_ready', name: 'Ever Ready', max: 5,
            desc: '-30s Cooldown per level.',
            masteryPerk: 'Using Preparation also restores 50% of your max Energy.',
            mod: { cdRed: 30 },
            icon: 'ra-cycle'
        }
    ]
};
