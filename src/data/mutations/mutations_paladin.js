export const PALADIN_MUTATIONS = {
    // --- AURAS TREE ---
    might_aura: [
        {
            id: 'mi_bravery', name: 'Unstoppable Might', max: 5, reqBaseLevel: 1,
            desc: '+10% Damage bonus and +5% Attack Speed.',
            masteryPerk: 'Might also increases your critical strike chance by 10%.',
            mod: { pctDmg: 10, pctIAS: 5 },
            icon: 'ra-muscle-fat'
        },
        {
            id: 'mi_fortitude', name: 'Commander Fortitude', max: 5, reqBaseLevel: 5,
            desc: '+10% Armor and +5% All Resistance while active.',
            masteryPerk: 'Allies within your Might aura gain 15% physical damage reflection.',
            mod: { pctArmor: 10, allRes: 5 },
            icon: 'ra-shield'
        }
    ],
    prayer_aura: [
        {
            id: 'pr_restoration', name: 'Divine Restoration', max: 5, reqBaseLevel: 1,
            desc: '+15% Healing pulse and +5% Mana regen.',
            masteryPerk: 'Prayer also removes 1 random debuff every 5 seconds.',
            mod: { pctHeal: 15 },
            icon: 'ra-heartburn'
        },
        {
            id: 'pr_serenity', name: 'Aura of Serenity', max: 5, reqBaseLevel: 5,
            desc: '+10% Mana regeneration and +5% Cooldown Reduction.',
            masteryPerk: 'If an ally falls below 30% HP, Prayer instantly heals them for 20% max HP (30s CD).',
            mod: { manaRegenPct: 10, cdrPct: 5 },
            icon: 'ra-sun-glow'
        }
    ],
    aura_mastery: [
        {
            id: 'am_radiance', name: 'Celestial Reach', max: 5, reqBaseLevel: 5,
            desc: '+10% Aura radius and +5% Aura effect.',
            masteryPerk: 'Aura Mastery doubles the radius of your active aura for 10s after casting a holy spell.',
            mod: { radiusPct: 10, auraEffectPct: 5 },
            icon: 'ra-sun-glow'
        },
        {
            id: 'am_resonance', name: 'Holy Resonance', max: 5, reqBaseLevel: 10,
            desc: '+8% Aura effect per nearby ally (max 40%).',
            masteryPerk: 'Activating Aura Mastery triggers a Holy Nova that knocks back all nearby enemies.',
            mod: { auraEffectPct: 8 },
            icon: 'ra-waves-pulse'
        }
    ],
    holy_fire_aura: [
        {
            id: 'hf_blaze', name: 'Immolating Radiance', max: 5, reqBaseLevel: 5,
            desc: '+20% Fire Damage pulse.',
            masteryPerk: 'Holy Fire pulse has a 20% chance to ignite enemies for 3s.',
            mod: { auraDmgPct: 20 },
            icon: 'ra-flame-symbol'
        },
        {
            id: 'hf_explosion', name: 'Supernova Pulse', max: 5, reqBaseLevel: 10,
            desc: '+10% pulse frequency and +5% fire penetration.',
            masteryPerk: 'Every 3rd pulse of Holy Fire triggers a mini-meteor on a random nearby enemy.',
            mod: { pulseSpeedPct: 10, firePen: 5 },
            icon: 'ra-meteor'
        }
    ],
    holy_freeze_aura: [
        {
            id: 'hfa_permafrost', name: 'Glacial Aura', max: 5, reqBaseLevel: 10,
            desc: '+10% Slow effect and +15% Cold Damage.',
            masteryPerk: 'Enemies staying in the aura for 5s are frozen solid for 2s.',
            mod: { slowPct: 10, auraDmgPct: 15 },
            icon: 'ra-snowflake'
        },
        {
            id: 'hfa_shatter', name: 'Biting Cold', max: 5, reqBaseLevel: 15,
            desc: '+10% Cold Damage vs slowed enemies.',
            masteryPerk: 'Killing a frozen enemy within your aura causes them to explode into 5 ice shards.',
            mod: { auraDmgPct: 10 },
            icon: 'ra-crystal-cluster'
        }
    ],
    fanaticism: [
        {
            id: 'fa_zealotry', name: 'Crusader Fervor', max: 5, reqBaseLevel: 15,
            desc: '+8% Attack Speed and +10% Damage.',
            masteryPerk: 'Fanaticism also grants +15% Movement Speed to all allies.',
            mod: { pctIAS: 8, pctDmg: 10 },
            icon: 'ra-burning-embers'
        },
        {
            id: 'fa_bloodlust', name: 'Frenzied Zeal', max: 5, reqBaseLevel: 20,
            desc: '+3% Life Steal and +5% Crit Multiplier.',
            masteryPerk: 'On kill, gain a stacking 2% Attack Speed buff for 5s (max 10 stacks).',
            mod: { lifeSteal: 3, critMulti: 5 },
            icon: 'ra-droplet'
        }
    ],
    vigor: [
        {
            id: 'vi_haste', name: 'Relentless Vigor', max: 5, reqBaseLevel: 10,
            desc: '+10% Move Speed and +20% Stamina recovery.',
            masteryPerk: 'While Vigor is active, you are immune to slow and snare effects.',
            mod: { moveSpeedPct: 10 },
            icon: 'ra-fast-forward'
        },
        {
            id: 'vi_swiftness', name: 'Lightfoot Sentinel', max: 5, reqBaseLevel: 15,
            desc: '+5% Dodge chance and +10% Movement Speed.',
            masteryPerk: 'Sprinting while Vigor is active leaves a trail of holy sparks that damages enemies.',
            mod: { dodgeChance: 5, moveSpeedPct: 10 },
            icon: 'ra-lightning-trio'
        }
    ],
    sanctuary: [
        {
            id: 'sa_ward', name: 'Holy Sanctuary', max: 5, reqBaseLevel: 15,
            desc: '+20% Damage vs Undead and +15% knockback force.',
            masteryPerk: 'Sanctuary deals 100% magic damage to demons as well.',
            mod: { undeadDmgPct: 20 },
            icon: 'ra-church'
        },
        {
            id: 'sa_purification', name: 'Purging Radiance', max: 5, reqBaseLevel: 20,
            desc: '+15% Damage vs Demons and Undead.',
            masteryPerk: 'Sanctuary periodically strikes a random enemy in radius with holy lightning.',
            mod: { monsterDmgPct: 15 },
            icon: 'ra-lightning-bolt'
        }
    ],
    conviction: [
        {
            id: 'cv_doom', name: 'Inevitable Doom', max: 5, reqBaseLevel: 20,
            desc: 'Reduces enemy resistances by an additional 5%.',
            masteryPerk: 'Conviction also reduces enemy movement speed by 25%.',
            mod: { resRedPct: 5 },
            icon: 'ra-broken-heart'
        },
        {
            id: 'cv_vulnerability', name: 'Fatal Exposure', max: 5, reqBaseLevel: 25,
            desc: 'Increases Critical Strike Damage vs affected enemies by 15%.',
            masteryPerk: 'Enemies under Conviction have a 10% chance to be stunned when hit by Holy damage.',
            mod: { critDmgPct: 15 },
            icon: 'ra-target-shot'
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
        },
        {
            id: 'ch_holy_trail', name: 'Blessed Momentum', max: 5, reqBaseLevel: 5,
            desc: '+15% Charge speed and +10% holy damage on impact.',
            masteryPerk: 'Charge can be used a second time within 2 seconds for 50% Mana cost.',
            mod: { moveSpeed: 15, holyDmg: 10 },
            icon: 'ra-fast-forward'
        }
    ],
    seal_of_righteousness: [
        {
            id: 'sor_glow', name: 'Radiant Seal', max: 5, reqBaseLevel: 1,
            desc: '+15% Holy Damage on hit.',
            masteryPerk: 'Seal of Righteousness hits have a 10% chance to blind the target.',
            mod: { holyDmg: 15 },
            icon: 'ra-sword-clash'
        },
        {
            id: 'sor_vengeance', name: 'Seal of Retribution', max: 5, reqBaseLevel: 5,
            desc: '+10% Damage to the next hit after blocking or dodging.',
            masteryPerk: 'Seal hits trigger a Holy Bolt toward the most injured nearby ally.',
            mod: { counterDmgPct: 10 },
            icon: 'ra-health'
        }
    ],
    crusader_mastery: [
        {
            id: 'cm_might', name: 'Divine Might', max: 5, reqBaseLevel: 1,
            desc: '+5% Holy Damage and +2% Strength per level.',
            masteryPerk: 'Crusader Mastery also increases your Block Chance by 5%.',
            mod: { pctHolyDmg: 5, pctStr: 2 },
            icon: 'ra-muscle-fat'
        },
        {
            id: 'cm_justice', name: 'Hand of Justice', max: 5, reqBaseLevel: 5,
            desc: '+10% Retribution skill damage and +5% Critical Chance.',
            masteryPerk: 'Every 10th holy spell cast is free and deals 50% bonus damage.',
            mod: { tree2DmgPct: 10, critChance: 5 },
            icon: 'ra-scales'
        }
    ],
    crusader_strike: [
        {
            id: 'cs_mana', name: 'Soul Feast', max: 5, reqBaseLevel: 5,
            desc: '+15% Damage and restores +2 Mana per hit.',
            masteryPerk: 'Crusader Strike has a 30% chance to reset the cooldown of Judgement.',
            mod: { pctDmg: 15 },
            icon: 'ra-lightning-bolt'
        },
        {
            id: 'cs_wrath', name: 'Righteous Cleave', max: 5, reqBaseLevel: 10,
            desc: '+10% Critical Strike chance and +5% splash radius.',
            masteryPerk: 'Crusader Strike now hits all enemies in a small frontal cone.',
            mod: { critChance: 10, radiusPct: 5 },
            icon: 'ra-sword-clash'
        }
    ],
    vengeance: [
        {
            id: 've_elemental', name: 'Elemental Harmony', max: 5, reqBaseLevel: 5,
            desc: '+10% Fire, Cold, and Lightning damage.',
            masteryPerk: 'Vengeance deals 50% splash damage to all nearby enemies.',
            mod: { pctFireDmg: 10, pctColdDmg: 10, pctLightDmg: 10 },
            icon: 'ra-crystals'
        },
        {
            id: 've_conviction', name: 'Elemental Breach', max: 5, reqBaseLevel: 10,
            desc: 'Reduces enemy Elemental Resistances by 4% on hit (stacks 3x).',
            masteryPerk: 'Vengeance hits trigger a random elemental explosion (Fire, Cold, or Lightning).',
            mod: { eleRedPct: 4 },
            icon: 'ra-explosion'
        }
    ],
    judgement: [
        {
            id: 'ju_wrath', name: 'Final Sentence', max: 5, reqBaseLevel: 10,
            desc: '+20% Holy Damage and +5% heal amount.',
            masteryPerk: 'Judgement deals 100% more damage to enemies below 50% HP.',
            mod: { pctDmg: 20, pctHeal: 5 },
            icon: 'ra-broken-heart'
        },
        {
            id: 'ju_condemnation', name: 'Divine Condemnation', max: 5, reqBaseLevel: 15,
            desc: 'Judgement damage increased by 15% for each active aura.',
            masteryPerk: 'Judgement now chains to 2 additional nearby enemies.',
            mod: { auraSynergyDmg: 15 },
            icon: 'ra-lightning-trio'
        }
    ],
    hammer_of_wrath: [
        {
            id: 'how_executor', name: 'Hammer of Fate', max: 5, reqBaseLevel: 15,
            desc: '+25% finisher damage.',
            masteryPerk: 'Hammer of Wrath resets its cooldown if used on a target below 20% HP.',
            mod: { pctDmg: 25 },
            icon: 'ra-hammer-drop'
        },
        {
            id: 'how_divine', name: 'Celestial Hammer', max: 5, reqBaseLevel: 20,
            desc: '+20% Hammer speed and +15% critical damage.',
            masteryPerk: 'Hammer of Wrath explodes into 4 Holy Bolts on impact, seeking nearby foes.',
            mod: { projSpeed: 20, critDmgPct: 15 },
            icon: 'ra-lightning-bolt'
        }
    ],
    divine_storm: [
        {
            id: 'ds_whirlwind', name: 'Holy Cyclone', max: 5, reqBaseLevel: 15,
            desc: '+15% Damage and +10% AoE radius.',
            masteryPerk: 'Divine Storm heals all nearby allies for 10% of your maximum health.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-cyclone'
        },
        {
            id: 'ds_radiant', name: 'Vortex of Light', max: 5, reqBaseLevel: 20,
            desc: '+1s duration and +10% damage pulse.',
            masteryPerk: 'Divine Storm pulls all nearby enemies toward the center of the storm.',
            mod: { duration: 1, pctDmg: 10 },
            icon: 'ra-magnet'
        }
    ],
    exorcism: [
        {
            id: 'ex_banish', name: 'Banishment', max: 5, reqBaseLevel: 20,
            desc: '+20% Damage and +10% Crit Chance.',
            masteryPerk: 'Exorcism instantly kills non-boss Undead below 30% HP.',
            mod: { pctDmg: 20, critChance: 10 },
            icon: 'ra-sun-glow'
        },
        {
            id: 'ex_holy_fire', name: 'Purging Flames', max: 5, reqBaseLevel: 25,
            desc: 'Exorcism leaves a patch of Consecrated ground for 3s.',
            masteryPerk: 'Exorcism deals 50% splash damage to all enemies within 3m of the target.',
            mod: { groundDmg: 20 },
            icon: 'ra-small-fire'
        }
    ],
    avenging_wrath: [
        {
            id: 'aw_titan', name: 'Seraphim Form', max: 5, reqBaseLevel: 20,
            desc: '+2s duration and +10% Crit Multi bonus.',
            masteryPerk: 'While in Avenging Wrath, you are immune to all crowd control.',
            mod: { duration: 2 },
            icon: 'ra-angel-wings'
        },
        {
            id: 'aw_crusader', name: 'Zealous Wings', max: 5, reqBaseLevel: 25,
            desc: '+15% Damage and +10% Movement Speed.',
            masteryPerk: 'Your wings periodically fire Holy Bolts at nearby enemies during the duration.',
            mod: { pctDmg: 15, moveSpeedPct: 10 },
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
        },
        {
            id: 'hs_static', name: 'Static Radiance', max: 5, reqBaseLevel: 30,
            desc: '+10% Crit chance and +20% shock duration.',
            masteryPerk: 'Holy Shock leaves a Static Charge on the target, dealing AoE damage for 3s.',
            mod: { critChance: 10, shockDur: 20 },
            icon: 'ra-lightning-bolt'
        }
    ],
    zeal: [
        {
            id: 'ze_frenzy', name: 'Holy Fervor', max: 5, reqBaseLevel: 25,
            desc: '+5% Attack Speed per level.',
            masteryPerk: 'Every 5th hit of Zeal triggers a free Holy Nova.',
            mod: { pctIAS: 5 },
            icon: 'ra-lightning-trio'
        },
        {
            id: 'ze_justice', name: 'Verdict of Zeal', max: 5, reqBaseLevel: 30,
            desc: 'Zeal hits build stacks of Justice. +2% Damage per stack.',
            masteryPerk: 'At 10 stacks of Justice, your next Zeal is guaranteed critical and deals 300% damage.',
            mod: { stackDmg: 2 },
            icon: 'ra-scales'
        }
    ],
    lay_on_hands: [
        {
            id: 'loh_blessing', name: 'Divine Breath', max: 5, reqBaseLevel: 30,
            desc: 'Reduces cooldown by 30s.',
            masteryPerk: 'Lay on Hands also grants 50% Damage Reduction for 5s.',
            mod: { cdRed: 30 },
            icon: 'ra-heartburn'
        },
        {
            id: 'loh_salvation', name: 'Miraculous Recovery', max: 5, reqBaseLevel: 40,
            desc: 'Also restores 50% of maximum Mana.',
            masteryPerk: 'If used on yourself, Lay on Hands resets the cooldown of all other Paladin skills.',
            mod: { manaRestorePct: 50 },
            icon: 'ra-health'
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
        },
        {
            id: 'sm_righteous', name: 'Righteous Shielding', max: 5, reqBaseLevel: 5,
            desc: 'Smite deals bonus damage equal to 20% of your shield\'s block value.',
            masteryPerk: 'Smite hits have a 10% chance to reset the cooldown of Avenger\'s Shield.',
            mod: { blockScaling: 20 },
            icon: 'ra-shield'
        }
    ],
    avengers_shield: [
        {
            id: 'as_bounce', name: 'Ricochet', max: 5, reqBaseLevel: 1,
            desc: '+1 additional bounce per level.',
            masteryPerk: 'Avenger\'s Shield reduces enemy damage by 20% for 5s.',
            mod: { extraBounces: 1 },
            icon: 'ra-shield'
        },
        {
            id: 'as_bulwark', name: 'Shield Sentinel', max: 5, reqBaseLevel: 5,
            desc: '+10% Armor for 5s after the shield returns.',
            masteryPerk: 'The shield now orbits you for 5 seconds after returning, blocking incoming projectiles.',
            mod: { returnArmorPct: 10 },
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
        },
        {
            id: 'hs_consecrated', name: 'Hallowed Bulwark', max: 5, reqBaseLevel: 10,
            desc: '+15% Consecration damage while Holy Shield is active.',
            masteryPerk: 'Blocking an attack has a 20% chance to trigger a free Consecration at your feet.',
            mod: { consecrationSynergy: 15 },
            icon: 'ra-sun-glow'
        }
    ],
    prot_mastery: [
        {
            id: 'pm_stalwart', name: 'Sentinel', max: 5, reqBaseLevel: 1,
            desc: '+5% Armor and +3% Vitality per level.',
            masteryPerk: 'Protection Mastery grants +10% Physical Damage Reduction.',
            mod: { pctArmor: 5, pctVit: 3 },
            icon: 'ra-shield'
        },
        {
            id: 'pm_indomitable', name: 'Unbreakable Will', max: 5, reqBaseLevel: 5,
            desc: '+5% Maximum Health and +4% Block chance.',
            masteryPerk: 'Gain 1% Damage Reduction for every 10% of health you are missing.',
            mod: { pctHp: 5, blockChance: 4 },
            icon: 'ra-muscle-fat'
        }
    ],
    consecration: [
        {
            id: 'co_sacred', name: 'Hallowed Ground', max: 5, reqBaseLevel: 10,
            desc: '+15% Damage and +10% AoE radius.',
            masteryPerk: 'Consecration heals allies standing in it for 2% max HP per second.',
            mod: { pctDmg: 15, radiusPct: 10 },
            icon: 'ra-sun-glow'
        },
        {
            id: 'co_wrath', name: 'Judgement Ground', max: 5, reqBaseLevel: 15,
            desc: 'Damage increases by 5% every second you stay within the area.',
            masteryPerk: 'Consecration ground becomes sticky, reducing enemy movement speed by 40%.',
            mod: { buildUpDmg: 5 },
            icon: 'ra-heavy-fall'
        }
    ],
    blessing_of_kings: [
        {
            id: 'bok_lord', name: 'High King\'s Favor', max: 5, reqBaseLevel: 10,
            desc: '+2% to all attributes bonus.',
            masteryPerk: 'Blessing of Kings also grants 5% All Resistance.',
            mod: { allStats: 2 },
            icon: 'ra-crown'
        },
        {
            id: 'bok_majesty', name: 'Regal Presence', max: 5, reqBaseLevel: 15,
            desc: '+5% Damage and +5% Healing power bonus.',
            masteryPerk: 'Blessing of Kings also grants 10% increased Experience gain for all affected.',
            mod: { pctDmg: 5, pctHeal: 5 },
            icon: 'ra-gem-pendant'
        }
    ],
    hammer_righteous: [
        {
            id: 'hr_light', name: 'Glinting Hammer', max: 5, reqBaseLevel: 15,
            desc: '+15% Damage and +1 target hit by waves.',
            masteryPerk: 'Hammer of Righteous has a 20% chance to cast Holy Bolt.',
            mod: { pctDmg: 15 },
            icon: 'ra-hammer-drop'
        },
        {
            id: 'hr_judgement', name: 'Hammer of Justice', max: 5, reqBaseLevel: 20,
            desc: '+20% Damage to targets already affected by Judgement.',
            masteryPerk: 'Hammers now spiral outward much further, hitting more enemies.',
            mod: { synergyDmg: 20 },
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
        },
        {
            id: 'sor_defender', name: 'Shield of Light', max: 5, reqBaseLevel: 20,
            desc: '+5% Block chance for 3s after use.',
            masteryPerk: 'Hits create a Shield of Light buff that absorbs damage equal to 10% of Max HP.',
            mod: { postBlockChance: 5 },
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
        },
        {
            id: 'hw_judgment', name: 'Divine Sentence', max: 5, reqBaseLevel: 25,
            desc: 'Damage increased by 20% if an active Seal is present.',
            masteryPerk: 'Holy Wrath also silences all non-boss enemies hit for 2 seconds.',
            mod: { sealSynergyDmg: 20 },
            icon: 'ra-broken-heart'
        }
    ],
    guardian_of_ancient_kings: [
        {
            id: 'goak_eternal', name: 'Eternal Guardian', max: 5, reqBaseLevel: 25,
            desc: '+2s duration and +10% absorption.',
            masteryPerk: 'While the Guardian is active, you are immune to death.',
            mod: { duration: 2 },
            icon: 'ra-angel-wings'
        },
        {
            id: 'goak_vengeance', name: 'Guardian Avenger', max: 5, reqBaseLevel: 30,
            desc: 'The Guardian now attacks nearby enemies for 50% of your damage.',
            masteryPerk: 'When the Guardian expires, it deals 500% Holy damage to all nearby enemies.',
            mod: { petDmg: 50 },
            icon: 'ra-angel-wings'
        }
    ]
};
