/**
 * PALADIN — Class Definition
 * Three trees: Auras (passive buffs) · Retribution (melee DPS) · Protection (tanking)
 */
export const PALADIN_CLASS = {
    id: 'paladin', name: 'Paladin', icon: '⚜️',
    description: 'A holy warrior protected by auras and divine faith. Excels at group support and high durability.',
    stats: { str: 25, dex: 15, vit: 25, int: 10 },
    trees: [

        // ═══ AURAS — Group Support ═══
        {
            id: 'auras', name: 'Auras', icon: '🌟',
            nodes: [
                {
                    id: 'might_aura', row: 0, col: 1, type: 'toggle', icon: '💪', name: 'Aura: Might',
                    desc: 'Aura · Increases the physical damage of yourself and all nearby allies by 40% + 15% per level.',
                    tip: 'Max lvl (20): +340% physical damage aura.',
                    maxPts: 20, mana: 10, cd: 0, group: 'aura'
                },
                {
                    id: 'prayer_aura', row: 1, col: 0, type: 'toggle', icon: '🙏', name: 'Aura: Prayer',
                    desc: 'Aura · Heals yourself and all nearby allies for 2 + 1 per point HP per second.',
                    tip: 'Max lvl (20): 22/s group health regeneration.',
                    maxPts: 20, mana: 15, cd: 0, group: 'aura'
                },
                {
                    id: 'aura_mastery', row: 1, col: 2, type: 'passive', icon: '⭐', name: 'Aura Mastery',
                    desc: 'Passive · Increases the radius of all your auras by 4% per point and their effect by 5% per point.',
                    tip: 'Max lvl (20): +80% radius · +100% aura power.',
                    maxPts: 20
                },
                {
                    id: 'holy_fire_aura', row: 2, col: 0, type: 'toggle', icon: '🔥', name: 'Aura: Holy Fire',
                    desc: 'Aura · Pulsates with holy fire, dealing 3 + 2 per point fire damage to all nearby enemies every second.',
                    tip: 'Max lvl (20): 43/s fire pulse aura.',
                    maxPts: 20, mana: 20, cd: 0, group: 'aura'
                },
                {
                    id: 'holy_freeze_aura', row: 2, col: 2, type: 'toggle', icon: '❄️', name: 'Aura: Holy Freeze',
                    desc: 'Aura · Periodically chills all nearby enemies, slowing them by 30% and dealing cold damage.',
                    tip: 'Max lvl (20): Ultimate crowd control aura.',
                    maxPts: 20, mana: 25, cd: 0, group: 'aura', req: 'aura_mastery:1'
                },
                {
                    id: 'fanaticism', row: 3, col: 1, type: 'toggle', icon: '⚡', name: 'Aura: Fanaticism',
                    desc: 'Aura · Increases attack speed by 30% + 2% per point and damage by 30% + 2.5% per point for the group.',
                    tip: 'Max lvl (20): +70% speed · +80% damage.',
                    maxPts: 20, mana: 30, cd: 0, group: 'aura', req: 'might_aura:5'
                },
                {
                    id: 'vigor', row: 3, col: 2, type: 'toggle', icon: '🏃', name: 'Aura: Vigor',
                    desc: 'Aura · Increases movement speed and stamina recovery for yourself and all nearby allies.',
                    tip: 'Max lvl (20): +50% group movement speed.',
                    maxPts: 20, mana: 15, cd: 0, group: 'aura', req: 'aura_mastery:5'
                },
                {
                    id: 'sanctuary', row: 4, col: 0, type: 'toggle', icon: '⛪', name: 'Aura: Sanctuary',
                    desc: 'Aura · Damages undead and knocks them back. Your attacks ignore the physical resistance of undead.',
                    tip: 'Max lvl (20): Bane of the living dead.',
                    maxPts: 20, mana: 40, cd: 0, group: 'aura', req: 'holy_fire_aura:5'
                },
                {
                    id: 'conviction', row: 4, col: 1, type: 'toggle', icon: '🔴', name: 'Aura: Conviction',
                    desc: 'Aura · Reduces the armor and elemental resistances of all nearby enemies by 30% + 2% per level.',
                    tip: 'Max lvl (20): -70% enemy resists and defense.',
                    maxPts: 20, mana: 50, cd: 0, group: 'aura', req: 'fanaticism:5'
                }
            ]
        },

        // ═══ RETRIBUTION — Melee DPS ═══
        {
            id: 'retribution', name: 'Retribution', icon: '⚔️',
            nodes: [
                {
                    id: 'charge', row: 0, col: 2, type: 'active', icon: '🏃', name: 'Charge',
                    desc: 'Active · Rush toward an enemy and strike them for massive physical damage and knockback.',
                    tip: 'Max lvl (20): High-speed gap closer.',
                    maxPts: 20, mana: 15, cd: 8, group: 'melee'
                },
                {
                    id: 'seal_of_righteousness', row: 0, col: 1, type: 'toggle', icon: '⚔️', name: 'Seal of Righteousness',
                    desc: 'Toggle · Each melee strike deals 10 + 5 per point additional holy damage.',
                    tip: 'Max lvl (20): +110 holy damage on hit.',
                    maxPts: 20, mana: 15, cd: 0, group: 'buff'
                },
                {
                    id: 'crusader_mastery', row: 1, col: 0, type: 'passive', icon: '📖', name: 'Crusader Mastery',
                    desc: 'Passive · +5% holy damage and +2% strength per point.',
                    tip: 'Max lvl (20): +100% holy damage · +40% Str.',
                    maxPts: 20
                },
                {
                    id: 'crusader_strike', row: 1, col: 2, type: 'active', icon: '⚡', name: 'Crusader Strike',
                    desc: 'Active · An instant holy strike dealing 25 + 15 per point physical damage. Generates 10 mana.',
                    tip: 'Max lvl (20): 325 damage. Primary mana generator.',
                    maxPts: 20, mana: 0, cd: 4, group: 'melee', dmgBase: 25, dmgPerLvl: 15, req: 'seal_of_righteousness:1'
                },
                {
                    id: 'vengeance', row: 2, col: 0, type: 'active', icon: '🌈', name: 'Vengeance',
                    desc: 'Active · A strike that adds 20% fire, cold, and lightning damage per level to your physical attack.',
                    tip: 'Max lvl (20): Massive elemental melee burst.',
                    maxPts: 20, mana: 20, cd: 0, group: 'melee', req: 'crusader_mastery:1'
                },
                {
                    id: 'judgement', row: 2, col: 1, type: 'active', icon: '⚖️', name: 'Judgement',
                    desc: 'Active · Unleash your active Seal on an enemy, dealing 40 + 20 holy damage and restoring 5% HP.',
                    tip: 'Max lvl (20): 440 holy damage burst + heal.',
                    maxPts: 20, mana: 10, cd: 8, group: 'holy', dmgBase: 40, dmgPerLvl: 20, req: 'crusader_strike:3'
                },
                {
                    id: 'hammer_of_wrath', row: 3, col: 0, type: 'active', icon: '🔨', name: 'Hammer of Wrath',
                    desc: 'Active · Throw a holy hammer that deals 60 + 30 holy damage. Only usable on targets below 30% HP.',
                    tip: 'Max lvl (20): 660 damage finisher.',
                    maxPts: 20, mana: 15, cd: 6, group: 'holy', dmgBase: 60, dmgPerLvl: 30, req: 'judgement:5'
                },
                {
                    id: 'divine_storm', row: 3, col: 2, type: 'active', icon: '🌩️', name: 'Divine Storm',
                    desc: 'Active · A holy whirlwind dealing 30 + 12 holy damage to all nearby enemies and healing allies for 20% of damage dealt.',
                    tip: 'Max lvl (20): 270 AoE holy damage.',
                    maxPts: 20, mana: 25, cd: 12, group: 'holy', dmgBase: 30, dmgPerLvl: 12, req: 'judgement:5'
                },
                {
                    id: 'exorcism', row: 4, col: 1, type: 'active', icon: '🔥', name: 'Exorcism',
                    desc: 'Active · Blast an enemy for 50 + 25 holy damage. Always crits against Undead or Demons.',
                    tip: 'Max lvl (20): 550 holy damage.',
                    maxPts: 20, mana: 20, cd: 15, group: 'holy', dmgBase: 50, dmgPerLvl: 25, req: 'divine_storm:5'
                },
                {
                    id: 'avenging_wrath', row: 5, col: 1, type: 'active', icon: '👼', name: 'Avenging Wrath',
                    desc: 'Active · For 20 seconds, your damage and critical strike chance are increased by 50%. 180s cooldown.',
                    tip: 'Max lvl (20): The ultimate holy burst.',
                    maxPts: 20, mana: 40, cd: 180, group: 'buff', req: 'exorcism:5'
                },
                {
                    id: 'holy_shock', row: 6, col: 0, type: 'active', icon: '🌩️', name: 'Holy Shock',
                    desc: 'Active · Blast an enemy with holy lightning for 80 + 40 damage, or heal an ally for 100 + 60 HP.',
                    tip: 'Max lvl (20): 880 damage or 1,300 heal.',
                    maxPts: 20, mana: 35, cd: 10, group: 'holy', dmgBase: 80, dmgPerLvl: 40, req: 'avenging_wrath:1'
                },
                {
                    id: 'zeal', row: 6, col: 2, type: 'active', icon: '⚔️', name: 'Zeal',
                    desc: 'Active · Rapidly strike nearby enemies 3 to 7 times with increased physical damage.',
                    tip: 'Max lvl (20): Multi-target melee blender.',
                    maxPts: 20, mana: 12, cd: 2, group: 'melee', dmgBase: 10, dmgPerLvl: 4, req: 'avenging_wrath:1'
                },
                {
                    id: 'lay_on_hands', row: 7, col: 1, type: 'active', icon: '🤲', name: 'Lay on Hands',
                    desc: 'Active · Instantly restore 100% of your maximum life. 300s cooldown.',
                    tip: 'Max lvl (1): Divine life preservation.',
                    maxPts: 1, mana: 0, cd: 300, req: 'zeal:5'
                }
            ]
        },

        // ═══ PROTECTION — Tank build ═══
        {
            id: 'protection', name: 'Protection', icon: '🛡️',
            nodes: [
                {
                    id: 'smite', row: 0, col: 0, type: 'active', icon: '🛡️', name: 'Smite',
                    desc: 'Active · Shield bash that always hits, dealing 20 + 10 physical damage and stunning for 0.5s.',
                    tip: 'Max lvl (20): Guaranteed hit + stun.',
                    maxPts: 20, mana: 5, cd: 0, group: 'melee'
                },
                {
                    id: 'avengers_shield', row: 0, col: 1, type: 'active', icon: '🛡️', name: 'Avenger\'s Shield',
                    desc: 'Active · Hurl your shield dealing 40 + 20 holy damage, bouncing to 2 additional targets.',
                    tip: 'Max lvl (20): 440 holy damage bouncing shield.',
                    maxPts: 20, mana: 22, cd: 10, group: 'holy', dmgBase: 40, dmgPerLvl: 20
                },
                {
                    id: 'holy_shield', row: 1, col: 0, type: 'active', icon: '✨', name: 'Holy Shield',
                    desc: 'Active · Buff yourself for 60s: +50% armor and +25% chance to block.',
                    tip: 'Max lvl (20): Massive tank buff.',
                    maxPts: 20, mana: 35, cd: 0, group: 'buff', req: 'avengers_shield:1'
                },
                {
                    id: 'prot_mastery', row: 1, col: 2, type: 'passive', icon: '🧱', name: 'Protection Mastery',
                    desc: 'Passive · +3% vitality and +5% total armor per point.',
                    tip: 'Max lvl (20): +60% Vit · +100% Armor.',
                    maxPts: 20
                },
                {
                    id: 'consecration', row: 2, col: 1, type: 'active', icon: '☀️', name: 'Consecration',
                    desc: 'Active · Consecrate the ground, dealing 10 + 5 holy damage per second to enemies within.',
                    tip: 'Max lvl (20): 110/s holy AoE.',
                    maxPts: 20, mana: 25, cd: 8, group: 'holy', dmgBase: 10, dmgPerLvl: 5, req: 'prot_mastery:5'
                },
                {
                    id: 'blessing_of_kings', row: 2, col: 0, type: 'toggle', icon: '👑', name: 'Blessing of Kings',
                    desc: 'Aura · Increases all attributes (Str, Dex, Vit, Int) by 10% for the group.',
                    tip: 'Max lvl (20): +10% group stats.',
                    maxPts: 20, mana: 40, cd: 0, group: 'aura', req: 'holy_shield:3'
                },
                {
                    id: 'hammer_righteous', row: 3, col: 0, type: 'active', icon: '🔨', name: 'Hammer of Righteous',
                    desc: 'Active · Strike the target for 15 + 8 damage, causing waves of light to hit 3 nearby enemies.',
                    tip: 'Max lvl (20): Cleave holy damage.',
                    maxPts: 20, mana: 12, cd: 4, group: 'melee', dmgBase: 15, dmgPerLvl: 8, req: 'consecration:3'
                },
                {
                    id: 'shield_of_righteousness', row: 3, col: 2, type: 'active', icon: '💥', name: 'Shield of Righteousness',
                    desc: 'Active · Slam the target with your shield, dealing damage based on your total Armor.',
                    tip: 'Max lvl (20): Armor-scaling damage burst.',
                    maxPts: 20, mana: 15, cd: 6, group: 'melee', req: 'consecration:3'
                },
                {
                    id: 'holy_wrath', row: 4, col: 0, type: 'active', icon: '☀️', name: 'Holy Wrath',
                    desc: 'Active · Unleash holy energy stunning all nearby Undead/Demons for 3s and dealing 40 + 20 damage.',
                    tip: 'Max lvl (20): 440 damage AoE stun vs demons.',
                    maxPts: 20, mana: 30, cd: 20, group: 'holy', dmgBase: 40, dmgPerLvl: 20, req: 'hammer_righteous:5'
                },
                {
                    id: 'guardian_of_ancient_kings', row: 5, col: 1, type: 'active', icon: '👑', name: 'Guardian of Kings',
                    desc: 'Active · Summon a holy guardian that absorbs 50% of all incoming damage for 15 seconds. 180s cooldown.',
                    tip: 'Max lvl (20): Ultimate damage mitigation.',
                    maxPts: 20, mana: 50, cd: 180, group: 'buff', req: 'holy_wrath:5'
                }
            ]
        },
    ]
};
