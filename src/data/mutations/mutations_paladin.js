export const PALADIN_MUTATIONS = {
    // --- AURAS TREE ---
    might_aura: [
        {
            id: 'mi_bravery', name: 'Unstoppable Might', max: 5, reqBaseLevel: 1,
            desc: '+10% Damage bonus and +5% Attack Speed.',
            masteryPerk: 'Might also increases your critical strike chance by 10%.',
            mod: { pctDmg: 10, pctIAS: 5 },
            icon: 'ra-muscle-fat'
        }
    ],
    prayer_aura: [
        {
            id: 'pr_restoration', name: 'Divine Restoration', max: 5, reqBaseLevel: 1,
            desc: '+15% Healing pulse and +5% Mana regen.',
            masteryPerk: 'Prayer also removes 1 random debuff every 5 seconds.',
            mod: { pctHeal: 15 },
            icon: 'ra-heartburn'
        }
    ],
    aura_mastery: [
        {
            id: 'am_radiance', name: 'Celestial Reach', max: 5, reqBaseLevel: 5,
            desc: '+10% Aura radius and +5% Aura effect.',
            masteryPerk: 'Aura Mastery doubles the radius of your active aura for 10s after casting a holy spell.',
            mod: { radiusPct: 10, auraEffectPct: 5 },
            icon: 'ra-sun-glow'
        }
    ],
    holy_fire_aura: [
        {
            id: 'hf_blaze', name: 'Immolating Radiance', max: 5, reqBaseLevel: 5,
            desc: '+20% Fire Damage pulse.',
            masteryPerk: 'Holy Fire pulse has a 20% chance to ignite enemies for 3s.',
            mod: { auraDmgPct: 20 },
            icon: 'ra-flame-symbol'
        }
    ],
    holy_freeze_aura: [
        {
            id: 'hfa_permafrost', name: 'Glacial Aura', max: 5, reqBaseLevel: 10,
            desc: '+10% Slow effect and +15% Cold Damage.',
            masteryPerk: 'Enemies staying in the aura for 5s are frozen solid for 2s.',
            mod: { slowPct: 10, auraDmgPct: 15 },
            icon: 'ra-snowflake'
        }
    ],
    fanaticism: [
        {
            id: 'fa_zealotry', name: 'Crusader Fervor', max: 5, reqBaseLevel: 15,
            desc: '+8% Attack Speed and +10% Damage.',
            masteryPerk: 'Fanaticism also grants +15% Movement Speed to all allies.',
            mod: { pctIAS: 8, pctDmg: 10 },
            icon: 'ra-burning-embers'
        }
    ],
    vigor: [
        {
            id: 'vi_haste', name: 'Relentless Vigor', max: 5, reqBaseLevel: 10,
            desc: '+10% Move Speed and +20% Stamina recovery.',
            masteryPerk: 'While Vigor is active, you are immune to slow and snare effects.',
            mod: { moveSpeedPct: 10 },
            icon: 'ra-fast-forward'
        }
    ],
    sanctuary: [
        {
            id: 'sa_ward', name: 'Holy Sanctuary', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage vs Undead and +15% knockback force.',
            masteryPerk: 'Sanctuary deals 100% magic damage to demons as well.',
            mod: { undeadDmgPct: 20 },
            icon: 'ra-church'
        }
    ],
    conviction: [
        {
            id: 'cv_doom', name: 'Inevitable Doom', max: 5, reqBaseLevel: 20,
            desc: 'Reduces enemy resistances by an additional 5%.',
            masteryPerk: 'Conviction also reduces enemy movement speed by 25%.',
            mod: { resRedPct: 5 },
            icon: 'ra-broken-heart'
        }
    ],

    // --- RETRIBUTION TREE ---
    charge: [
        {
            id: 'ch_impact', name: 'Vanguard Charge', max: 5, reqBaseLevel: 1,
            desc: '+20% Damage and +10% knockback force.',
            masteryPerk: 'Charge creates a trail of holy ground that slows enemies.',
            mod: { pctDmg: 20 },
            icon: 'ra-shield'
        }
    ],
    seal_of_righteousness: [
        {
            id: 'sor_glow', name: 'Radiant Seal', max: 5, reqBaseLevel: 1,
            desc: '+15% Holy Damage on hit.',
            masteryPerk: 'Seal of Righteousness hits have a 10% chance to blind the target.',
            mod: { holyDmg: 15 },
            icon: 'ra-sword-clash'
        }
    ],
    crusader_mastery: [
        {
            id: 'cm_might', name: 'Divine Might', max: 5, reqBaseLevel: 1,
            desc: '+5% Holy Damage and +2% Strength per level.',
            masteryPerk: 'Crusader Mastery also increases your Block Chance by 5%.',
            mod: { pctHolyDmg: 5, pctStr: 2 },
            icon: 'ra-muscle-fat'
        }
    ],
    crusader_strike: [
        {
            id: 'cs_mana', name: 'Soul Feast', max: 5, reqBaseLevel: 5,
            desc: '+15% Damage and restores +2 Mana per hit.',
            masteryPerk: 'Crusader Strike has a 30% chance to reset the cooldown of Judgement.',
            mod: { pctDmg: 15 },
            icon: 'ra-lightning-bolt'
        }
    ],
    vengeance: [
        {
            id: 've_elemental', name: 'Elemental Harmony', max: 5, reqBaseLevel: 5,
            desc: '+10% Fire, Cold, and Lightning damage.',
            masteryPerk: 'Vengeance deals 50% splash damage to all nearby enemies.',
            mod: { pctFireDmg: 10, pctColdDmg: 10, pctLightDmg: 10 },
            icon: 'ra-crystals'
        }
    ],
    judgement: [
        {
            id: 'ju_wrath', name: 'Final Sentence', max: 5, reqBaseLevel: 10,
            desc: '+20% Holy Damage and +5% heal amount.',
            masteryPerk: 'Judgement deals 100% more damage to enemies below 50% HP.',
            mod: { pctDmg: 20, pctHeal: 5 },
            icon: 'ra-broken-heart'
        }
    ],
    hammer_of_wrath: [
        {
            id: 'how_executor', name: 'Hammer of Fate', max: 5, reqBaseLevel: 15,
            desc: '+25% finisher damage.',
            masteryPerk: 'Hammer of Wrath resets its cooldown if used on a target below 20% HP.',
            mod: { pctDmg: 25 },
            icon: 'ra-hammer-drop'
        }
    ],
    divine_storm: [
        {
            id: 'ds_whirlwind', name: 'Holy Cyclone', max: 5, reqBaseLevel: 15,
            desc: '+15% Damage and +10% AoE radius.',
            masteryPerk: 'Divine Storm heals all nearby allies for 10% of your maximum health.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-cyclone'
        }
    ],
    exorcism: [
        {
            id: 'ex_banish', name: 'Banishment', max: 5, reqBaseLevel: 20,
            desc: '+20% Damage and +10% Crit Chance.',
            masteryPerk: 'Exorcism instantly kills non-boss Undead below 30% HP.',
            mod: { pctDmg: 20, critChance: 10 },
            icon: 'ra-sun-glow'
        }
    ],
    avenging_wrath: [
        {
            id: 'aw_titan', name: 'Seraphim Form', max: 5, reqBaseLevel: 20,
            desc: '+2s duration and +10% Crit Multi bonus.',
            masteryPerk: 'While in Avenging Wrath, you are immune to all crowd control.',
            mod: { duration: 2 },
            icon: 'ra-angel-wings'
        }
    ],
    holy_shock: [
        {
            id: 'hs_surge', name: 'Overcharged Light', max: 5, reqBaseLevel: 25,
            desc: '+20% Shock damage and +15% Heal power.',
            masteryPerk: 'Holy Shock now chains to 3 additional targets.',
            mod: { pctDmg: 20, pctHeal: 15 },
            icon: 'ra-lightning-trio'
        }
    ],
    zeal: [
        {
            id: 'ze_frenzy', name: 'Holy Fervor', max: 5, reqBaseLevel: 25,
            desc: '+5% Attack Speed per level.',
            masteryPerk: 'Every 5th hit of Zeal triggers a free Holy Nova.',
            mod: { pctIAS: 5 },
            icon: 'ra-lightning-trio'
        }
    ],
    lay_on_hands: [
        {
            id: 'loh_blessing', name: 'Divine Breath', max: 5, reqBaseLevel: 30,
            desc: 'Reduces cooldown by 30s.',
            masteryPerk: 'Lay on Hands also grants 50% Damage Reduction for 5s.',
            mod: { cdRed: 30 },
            icon: 'ra-heartburn'
        }
    ],

    // --- PROTECTION TREE ---
    smite: [
        {
            id: 'sm_heavy', name: 'Heavy Impact', max: 5, reqBaseLevel: 1,
            desc: '+15% Damage and +0.2s stun duration.',
            masteryPerk: 'Smite now creates a small shockwave that knocks back nearby enemies.',
            mod: { pctDmg: 15, stunDur: 0.2 },
            icon: 'ra-hammer-drop'
        }
    ],
    avengers_shield: [
        {
            id: 'as_bounce', name: 'Ricochet', max: 5, reqBaseLevel: 1,
            desc: '+1 additional bounce per level.',
            masteryPerk: 'Avenger\'s Shield reduces enemy damage by 20% for 5s.',
            mod: { extraBounces: 1 },
            icon: 'ra-shield'
        }
    ],
    holy_shield: [
        {
            id: 'hs_fortress', name: 'Iron Bastion', max: 5, reqBaseLevel: 5,
            desc: '+5% Block chance and +20% Armor bonus.',
            masteryPerk: 'Holy Shield reflects 100% of physical damage blocked.',
            mod: { blockChance: 5, pctArmor: 20 },
            icon: 'ra-shield'
        }
    ],
    prot_mastery: [
        {
            id: 'pm_stalwart', name: 'Sentinel', max: 5, reqBaseLevel: 1,
            desc: '+5% Armor and +3% Vitality per level.',
            masteryPerk: 'Protection Mastery grants +10% Physical Damage Reduction.',
            mod: { pctArmor: 5, pctVit: 3 },
            icon: 'ra-shield'
        }
    ],
    consecration: [
        {
            id: 'co_sacred', name: 'Hallowed Ground', max: 5, reqBaseLevel: 10,
            desc: '+15% Damage and +10% AoE radius.',
            masteryPerk: 'Consecration heals allies standing in it for 2% max HP per second.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-sun-glow'
        }
    ],
    blessing_of_kings: [
        {
            id: 'bok_lord', name: 'High King\'s Favor', max: 5, reqBaseLevel: 10,
            desc: '+2% to all attributes bonus.',
            masteryPerk: 'Blessing of Kings also grants 5% All Resistance.',
            mod: { allStats: 2 },
            icon: 'ra-crown'
        }
    ],
    hammer_righteous: [
        {
            id: 'hr_light', name: 'Glinting Hammer', max: 5, reqBaseLevel: 15,
            desc: '+15% Damage and +1 target hit by waves.',
            masteryPerk: 'Hammer of Righteous has a 20% chance to cast Holy Bolt.',
            mod: { pctDmg: 15 },
            icon: 'ra-hammer-drop'
        }
    ],
    shield_of_righteousness: [
        {
            id: 'sor_armor', name: 'Bulwark Smash', max: 5, reqBaseLevel: 15,
            desc: 'Damage increases by +10% of total Armor.',
            masteryPerk: 'Shield of Righteousness stuns the target for 1.5s.',
            mod: { armorScaling: 10 },
            icon: 'ra-shield'
        }
    ],
    holy_wrath: [
        {
            id: 'hw_sanctify', name: 'Holy Purge', max: 5, reqBaseLevel: 20,
            desc: '+20% Damage and +1s stun.',
            masteryPerk: 'Holy Wrath also affects Beast and Insect type enemies.',
            mod: { pctDmg: 20 },
            icon: 'ra-waves-pulse'
        }
    ],
    guardian_of_ancient_kings: [
        {
            id: 'goak_eternal', name: 'Eternal Guardian', max: 5, reqBaseLevel: 25,
            desc: '+2s duration and +10% absorption.',
            masteryPerk: 'While the Guardian is active, you are immune to death.',
            mod: { duration: 2 },
            icon: 'ra-angel-wings'
        }
    ]
};
