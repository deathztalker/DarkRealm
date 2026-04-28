export const PALADIN_MUTATIONS = {
    might_aura: [
        {
            id: 'ma_force', name: 'Divine Force', max: 5,
            desc: '+10% Damage bonus and +10% Radius.',
            masteryPerk: 'Might Aura also grants +5% chance to Deal Double Damage.',
            mod: { dmgBonus: 10, radiusPct: 10 },
            icon: 'ra-muscle-fat'
        }
    ],
    prayer_aura: [
        {
            id: 'pa_purity', name: 'Purity', max: 5,
            desc: '+2 HP regen and +10% Radius.',
            masteryPerk: 'Prayer Aura also regenerates 1% Mana per second.',
            mod: { regenBonus: 2, radiusPct: 10 },
            icon: 'ra-health'
        }
    ],
    holy_fire_aura: [
        {
            id: 'hfa_blaze', name: 'Holy Blaze', max: 5,
            desc: '+15% Fire damage and +10% Radius.',
            masteryPerk: 'Holy Fire pulses twice as fast.',
            mod: { fireDmg: 15, radiusPct: 10 },
            icon: 'ra-large-fire'
        }
    ],
    holy_freeze_aura: [
        {
            id: 'hfa_arctic', name: 'Arctic Aura', max: 5,
            desc: '+10% Slow and +10% Radius.',
            masteryPerk: 'Enemies in Holy Freeze have 10% chance to be Frozen for 1s every pulse.',
            mod: { slowPct: 10, radiusPct: 10 },
            icon: 'ra-ice-cube'
        }
    ],
    fanaticism: [
        {
            id: 'fn_frenzy', name: 'Holy Frenzy', max: 5,
            desc: '+5% Attack Speed and +5% Damage.',
            masteryPerk: 'Fanaticism also grants +20% Accuracy.',
            mod: { speedPct: 5, dmgPct: 5 },
            icon: 'ra-lightning-trio'
        }
    ],
    vigor: [
        {
            id: 'vg_haste', name: 'Divine Haste', max: 5,
            desc: '+5% Move Speed and +10% Radius.',
            masteryPerk: 'Vigor grants immunity to Slow effects.',
            mod: { moveSpeedPct: 5, radiusPct: 10 },
            icon: 'ra-fast-forward'
        }
    ],
    sanctuary: [
        {
            id: 'sn_hallowed', name: 'Hallowed Ground', max: 5,
            desc: '+20% Undead damage and +10% Radius.',
            masteryPerk: 'Sanctuary deals holy damage to all enemy types, not just undead.',
            mod: { undeadDmgPct: 20, radiusPct: 10 },
            icon: 'ra-sun'
        }
    ],
    conviction: [
        {
            id: 'cv_shatter', name: 'Total Conviction', max: 5,
            desc: '+5% resistance reduction and +10% Radius.',
            masteryPerk: 'Conviction also reduces enemy chance to dodge by 20%.',
            mod: { resRedPct: 5, radiusPct: 10 },
            icon: 'ra-broken-shield'
        }
    ],
    charge: [
        {
            id: 'ch_impact', name: 'Brutal Charge', max: 5,
            desc: '+20% Damage and +10% Knockback.',
            masteryPerk: 'Charge creates a shockwave on impact that stuns nearby enemies.',
            mod: { pctDmg: 20, knockbackPct: 10 },
            icon: 'ra-boots'
        }
    ],
    seal_of_righteousness: [
        {
            id: 'sor_light', name: 'Holy Light', max: 5,
            desc: '+15% Holy damage and +2s duration.',
            masteryPerk: 'Attacks with this seal have 10% chance to cast Smite.',
            mod: { holyDmg: 15, duration: 2 },
            icon: 'ra-sun'
        }
    ],
    crusader_strike: [
        {
            id: 'cs_zeal', name: 'Righteous Zeal', max: 5,
            desc: '+15% Damage and +2 Mana restore.',
            masteryPerk: 'Crusader Strike has 20% chance to reset the CD of Judgement.',
            mod: { pctDmg: 15, manaRestore: 2 },
            icon: 'ra-lightning-sword'
        }
    ],
    vengeance: [
        {
            id: 'vn_elements', name: 'Elemental Vengeance', max: 5,
            desc: '+10% Elemental damage per level.',
            masteryPerk: 'Vengeance deals 50% more damage against cursed enemies.',
            mod: { elemDmgPct: 10 },
            icon: 'ra-rainbow'
        }
    ],
    judgement: [
        {
            id: 'jd_decree', name: 'Divine Decree', max: 5,
            desc: '+20% Damage and +2% Healing.',
            masteryPerk: 'Judgement now hits 2 additional nearby targets.',
            mod: { pctDmg: 20, healPct: 2 },
            icon: 'ra-gavel'
        }
    ],
    hammer_of_wrath: [
        {
            id: 'how_cull', name: 'Executioner', max: 5,
            desc: '+20% Damage and +2% threshold.',
            masteryPerk: 'If Hammer of Wrath kills, you gain Avenging Wrath for 5s.',
            mod: { pctDmg: 20, thresholdPct: 2 },
            icon: 'ra-hammer-drop'
        }
    ],
    divine_storm: [
        {
            id: 'ds_tempest', name: 'Holy Tempest', max: 5,
            desc: '+15% Damage and +10% Healing.',
            masteryPerk: 'Divine Storm pulls enemies toward you.',
            mod: { pctDmg: 15, healPct: 10 },
            icon: 'ra-whirlwind'
        }
    ],
    exorcism: [
        {
            id: 'ex_purge', name: 'Purging Flames', max: 5,
            desc: '+20% Damage and +10% Crit chance.',
            masteryPerk: 'Exorcism now affects all enemy types as if they were undead.',
            mod: { pctDmg: 20, critChance: 10 },
            icon: 'ra-large-fire'
        }
    ],
    avenging_wrath: [
        {
            id: 'aw_seraph', name: 'Seraphim', max: 5,
            desc: '+10% Damage bonus and +2s duration.',
            masteryPerk: 'While active, you grow wings and gain 50% Move Speed.',
            mod: { dmgBonus: 10, duration: 2 },
            icon: 'ra-angel-wings'
        }
    ],
    holy_shock: [
        {
            id: 'hs_surge', name: 'Divine Surge', max: 5,
            desc: '+20% Damage/Healing per level.',
            masteryPerk: 'Holy Shock arcs to 2 nearby allies or enemies.',
            mod: { pctPower: 20 },
            icon: 'ra-lightning-bolt'
        }
    ],
    zeal: [
        {
            id: 'zl_frenzy', name: 'Holy Frenzy', max: 5,
            desc: '+1 hit and +5% Damage per hit.',
            masteryPerk: 'Zeal strikes have 10% chance to trigger Holy Shock.',
            mod: { extraHits: 1, pctDmg: 5 },
            icon: 'ra-split-body'
        }
    ],
    lay_on_hands: [
        {
            id: 'loh_grace', name: 'Divine Grace', max: 5,
            desc: '-30s Cooldown per level.',
            masteryPerk: 'Lay on Hands also restores 100% of your Mana.',
            mod: { cdRed: 30 },
            icon: 'ra-health'
        }
    ],
    smite: [
        {
            id: 'smite_holy', name: 'Holy Shock', max: 5,
            desc: 'Adds 15% Lightning damage per level.',
            masteryPerk: 'Divine Nova: Releases a Holy Nova on impact, damaging all nearby enemies.',
            mod: { lightningDmgPct: 15 },
            icon: 'ra-heavy-fall'
        },
        {
            id: 'smite_stun', name: 'Stun Lock', max: 5,
            desc: '+10% Stun Chance per level.',
            masteryPerk: 'Judgement: Stunned enemies are also Silenced for 2s.',
            mod: { stunChance: 10 },
            icon: 'ra-broken-shield'
        }
    ],
    avengers_shield: [
        {
            id: 'as_bounce', name: 'Ricochet', max: 5,
            desc: '+1 bounce and +15% Damage.',
            masteryPerk: 'Avenger\'s Shield now Silences all enemies it hits.',
            mod: { extraBounces: 1, pctDmg: 15 },
            icon: 'ra-heavy-shield'
        }
    ],
    holy_shield: [
        {
            id: 'hs_fortress', name: 'Divine Fortress', max: 5,
            desc: '+10% Armor and +5% Block.',
            masteryPerk: 'While Holy Shield is active, reflected damage is doubled.',
            mod: { armorPct: 10, blockPct: 5 },
            icon: 'ra-bolt-shield'
        }
    ],
    consecration: [
        {
            id: 'con_hallowed', name: 'Hallowed Ground', max: 5,
            desc: '+20% Damage and +10% Radius.',
            masteryPerk: 'Consecration now heals allies standing within it.',
            mod: { pctDmg: 20, radiusPct: 10 },
            icon: 'ra-sun'
        }
    ],
    blessing_of_kings: [
        {
            id: 'bok_majesty', name: 'Majesty', max: 5,
            desc: '+2% stat bonus and +10% Radius.',
            masteryPerk: 'Blessing of Kings also grants +10% Experience gain.',
            mod: { statBonus: 2, radiusPct: 10 },
            icon: 'ra-crown'
        }
    ],
    hammer_righteous: [
        {
            id: 'hor_waves', name: 'Light Waves', max: 5,
            desc: '+1 target hit and +15% Damage.',
            masteryPerk: 'Hammer of the Righteous hits have 20% chance to cast Consecration.',
            mod: { extraTargets: 1, pctDmg: 15 },
            icon: 'ra-hammer-drop'
        }
    ],
    shield_of_righteousness: [
        {
            id: 'sor_impact', name: 'Armor Slam', max: 5,
            desc: '+10% Armor scaling and +10% Damage.',
            masteryPerk: 'Shield of Righteousness grants 20% Armor for 5s on hit.',
            mod: { armorScale: 10, pctDmg: 10 },
            icon: 'ra-heavy-shield'
        }
    ],
    holy_wrath: [
        {
            id: 'hw_purge', name: 'Mass Purge', max: 5,
            desc: '+20% Damage and +1s Stun.',
            masteryPerk: 'Holy Wrath cooldown is reset if it kills a Demon or Undead.',
            mod: { pctDmg: 20, stunDur: 1 },
            icon: 'ra-sun'
        }
    ],
    guardian_of_ancient_kings: [
        {
            id: 'goak_defender', name: 'Eternal Defender', max: 5,
            desc: '+5% DR and +2s duration.',
            masteryPerk: 'Guardian also reflects 100% of damage absorbed.',
            mod: { drPct: 5, duration: 2 },
            icon: 'ra-angel-wings'
        }
    ]
};
