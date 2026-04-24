/**
 * PALADIN — Class Definition (WoW: Wrath of the Lich King inspired)
 *
 * Three trees:
 *   • Auras        — Passive toggled auras that boost the entire party
 *   • Retribution  — Two-handed melee DPS: Judgements, seals, Divine Storm
 *   • Protection   — Shield tank: block, Consecration, Holy Shield, Avenger's Shield
 */
export const PALADIN_CLASS = {
    id: 'paladin', name: 'Paladin', icon: '⚜️',
    description: 'A righteous crusader empowered by divine light. Fill any role: overwhelm enemies as a Retribution warrior, shield allies as Protection, or command the battlefield with ancient Auras.',
    stats: { str: 25, dex: 10, vit: 25, int: 10 },
    primaryStat: 'str',
    hitDie: 10,
    trees: [

        // ═══ AURAS — Passive party buffs ═══
        {
            id: 'auras', name: 'Auras', icon: '🌟',
            nodes: [
                {
                    id: 'might_aura', row: 0, col: 1, type: 'toggle', icon: '💪', name: 'Aura: Might',
                    desc: 'Toggle Aura · Increases Physical/Earth Dmg by <span style="color:#fff;">(40 + Slvl*15)%</span>. <br><br>★ Synergies: <span style="color:#0cf;">+2% Dmg per point in Fanaticism.</span>',
                    tip: 'Max lvl (20): +340% Physical/Earth Dmg.',
                    maxPts: 20, mana: 5, cd: 0, group: 'aura', scaleStat: 'str', synergies: [{ from: 'fanaticism', pctPerPt: 2 }]
                },
                {
                    id: 'prayer_aura', row: 1, col: 0, type: 'toggle', icon: '🙏', name: 'Aura: Prayer',
                    desc: 'Toggle Aura · Restores <span style="color:#fff;">(2 + Slvl*3) HP/sec</span>. <br><br>★ Synergies: <span style="color:#0cf;">+5% Heal per point in Conviction.</span>',
                    tip: 'Max lvl (20): +62 HP/s.',
                    maxPts: 20, mana: 5, cd: 0, group: 'aura', scaleStat: 'int', synergies: [{ from: 'conviction', pctPerPt: 5 }]
                },
                {
                    id: 'aura_mastery', row: 1, col: 2, type: 'passive', icon: '⭐', name: 'Aura Mastery',
                    desc: 'Passive · +5% holy damage per point and aura radius increases by +4% per point. Enhances all aura effectiveness.',
                    tip: 'Max lvl (20): +100% holy damage · huge area.',
                    maxPts: 20
                },
                {
                    id: 'holy_fire_aura', row: 2, col: 0, type: 'toggle', icon: '🔥', name: 'Aura: Holy Fire',
                    desc: 'Toggle Aura · Deals <span style="color:#fff;">(3 + Slvl*5) Fire Dmg/sec</span>. <br><br>★ Synergies: <span style="color:#0cf;">+5% Dmg per point in Conviction.</span>',
                    tip: 'Max lvl (20): 103 Fire Dmg/sec.',
                    maxPts: 20, mana: 10, cd: 0, group: 'aura', req: 'might_aura:3', scaleStat: 'int', synergies: [{ from: 'conviction', pctPerPt: 5 }]
                },
                {
                    id: 'fanaticism', row: 3, col: 1, type: 'toggle', icon: '⚡', name: 'Aura: Fanaticism',
                    desc: 'Toggle Aura · Increases Atk Speed/Dmg by <span style="color:#fff;">(20 + Slvl*5)%</span>. <br><br>★ Synergies: <span style="color:#0cf;">+3% IAS per point in Might.</span>',
                    tip: 'Max lvl (20): +120% IAS & Dmg.',
                    maxPts: 20, mana: 15, cd: 0, group: 'aura', req: 'holy_fire_aura:5', scaleStat: 'dex', synergies: [{ from: 'might_aura', pctPerPt: 3 }]
                },
                {
                    id: 'conviction', row: 4, col: 1, type: 'toggle', icon: '🔴', name: 'Aura: Conviction',
                    desc: 'Toggle Aura · Drastically reduce the armor and all resistances of all nearby enemies by 30 + 2% per point.',
                    tip: 'Max lvl (20): -70% enemy armor and resists.',
                    maxPts: 20, mana: 0, cd: 0, group: 'aura', req: 'fanaticism:10'
                }
            ]
        },

        // ═══ RETRIBUTION — Melee DPS build ═══
        {
            id: 'retribution', name: 'Retribution', icon: '⚔️',
            nodes: [
                {
                    id: 'seal_of_righteousness', row: 0, col: 1, type: 'toggle', icon: '⚔️', name: 'Seal of Righteousness',
                    desc: 'Toggle Seal · Every melee swing deals +5 + 3 per point bonus holy damage.',
                    tip: 'Max lvl (20): +65 holy damage per hit.',
                    maxPts: 20, mana: 2, cd: 0, group: 'buff'
                },
                {
                    id: 'crusader_mastery', row: 1, col: 0, type: 'passive', icon: '📖', name: 'Crusader Mastery',
                    desc: 'Passive · Increases your Holy Damage by 5% per point and your Strength by 2% per point.',
                    tip: 'Max lvl (20): +100% Holy Damage · +40% Strength.',
                    maxPts: 20
                },
                {
                    id: 'crusader_strike', row: 1, col: 2, type: 'active', icon: '⚡', name: 'Crusader Strike',
                    desc: 'Active · An instant melee strike that deals 120% weapon damage as holy damage.',
                    tip: 'Max lvl (20): 120% weapon as holy. 6s cooldown.',
                    maxPts: 20, mana: 5, cd: 6, group: 'melee', dmgBase: 20, dmgPerLvl: 10, wepPct: 120, req: 'seal_of_righteousness:3',
                    synergies: [{ from: 'seal_of_righteousness', pctPerPt: 5 }]
                },
                {
                    id: 'judgement', row: 2, col: 1, type: 'active', icon: '⚖️', name: 'Judgement',
                    desc: 'Active · Judge current Seal for base + 140% weapon damage as holy.',
                    tip: 'Max lvl (20): Scaling holy judgement.',
                    maxPts: 20, mana: 8, cd: 8, group: 'holy', dmgBase: 50, dmgPerLvl: 20, wepPct: 140, req: 'crusader_strike:3',
                    synergies: [{ from: 'crusader_strike', pctPerPt: 5 }]
                },
                {
                    id: 'hammer_of_wrath', row: 3, col: 0, type: 'active', icon: '🔨', name: 'Hammer of Wrath',
                    desc: 'Active · Hurl hammer for base + 220% weapon damage. Finisher (below 20% HP).',
                    tip: 'Max lvl (20): Massive holy finisher scaling.',
                    maxPts: 20, mana: 10, cd: 6, group: 'holy', dmgBase: 80, dmgPerLvl: 35, wepPct: 220, req: 'judgement:5',
                    synergies: [{ from: 'judgement', pctPerPt: 5 }]
                },
                {
                    id: 'divine_storm', row: 3, col: 2, type: 'active', icon: '🌩️', name: 'Divine Storm',
                    desc: 'Active · Unleash a spin attack hitting ALL enemies for 110% weapon damage as holy and healing allies.',
                    tip: 'Max lvl (20): 110% AoE holy + party heal.',
                    maxPts: 20, mana: 8, cd: 10, group: 'melee', dmgBase: 30, dmgPerLvl: 15, wepPct: 110, req: 'judgement:5',
                    synergies: [{ from: 'crusader_strike', pctPerPt: 5 }, { from: 'crusader_mastery', pctPerPt: 2 }]
                },
                {
                    id: 'exorcism', row: 4, col: 1, type: 'active', icon: '🔥', name: 'Exorcism',
                    desc: 'Active · Holy fire dealing base + 180% weapon damage as holy.',
                    tip: 'Max lvl (20): High holy scaling nuke.',
                    maxPts: 20, mana: 14, cd: 15, group: 'holy', dmgBase: 80, dmgPerLvl: 30, wepPct: 180, req: 'divine_storm:5',
                    synergies: [{ from: 'judgement', pctPerPt: 5 }]
                },
                {
                    id: 'avenging_wrath', row: 5, col: 1, type: 'active', icon: '👼', name: 'Avenging Wrath',
                    desc: 'Active · Grow wings of light: +20 + 2% per point damage and healing for 20 seconds. 120s cooldown.',
                    tip: 'Max lvl (20): +60% damage/healing burst.',
                    maxPts: 20, mana: 15, cd: 120, group: 'buff', req: 'exorcism:5'
                },
                {
                    id: 'holy_shock', row: 6, col: 0, type: 'active', icon: '🌩️', name: 'Holy Shock',
                    desc: 'Active · Blast for base + 120% weapon damage as holy, or heal ally.',
                    tip: 'Max lvl (20): Versatile burst scaling.',
                    maxPts: 20, mana: 12, cd: 6, group: 'holy', dmgBase: 40, dmgPerLvl: 20, wepPct: 120, req: 'avenging_wrath:1'
                },
                {
                    id: 'zeal', row: 6, col: 2, type: 'active', icon: '⚔️', name: 'Zeal',
                    desc: 'Active · An rapid attack that strikes 3 + 0.2 per point times in quick succession. Each hit deals 100% weapon damage.',
                    tip: 'Max lvl (20): 7 hits in a single attack. Procs weapon effects 7 times!',
                    maxPts: 20, mana: 8, cd: 4, group: 'melee', wepPct: 100, req: 'avenging_wrath:1'
                },
                {
                    id: 'lay_on_hands', row: 7, col: 1, type: 'active', icon: '🤲', name: 'Lay on Hands',
                    desc: 'Active · Instantly restore 100% of the target\'s maximum health and 25% mana. 300s cooldown.',
                    tip: 'Max lvl (1): The ultimate emergency save.',
                    maxPts: 1, mana: 0, cd: 300, req: 'holy_shock:5'
                }
            ]
        },

        // ═══ PROTECTION — Shield tank build ═══
        {
            id: 'protection', name: 'Protection', icon: '🛡️',
            nodes: [
                {
                    id: 'avengers_shield', row: 0, col: 1, type: 'active', icon: '🛡️', name: 'Avenger\'s Shield',
                    desc: 'Active · Hurl shield for base + 100% weapon damage. Bounces to 2 targets.',
                    tip: 'Max lvl (20): Scaling holy shield bounce.',
                    maxPts: 20, mana: 10, cd: 15, group: 'holy', dmgBase: 30, dmgPerLvl: 12, wepPct: 100
                },
                {
                    id: 'holy_shield', row: 1, col: 0, type: 'active', icon: '✨', name: 'Holy Shield',
                    desc: 'Active · +30% block chance and reflect holy damage on block for 10 seconds.',
                    tip: 'Max lvl (20): Massive defense + reflection.',
                    maxPts: 20, mana: 10, cd: 8, group: 'buff', req: 'avengers_shield:3'
                },
                {
                    id: 'prot_mastery', row: 1, col: 2, type: 'passive', icon: '🧱', name: 'Protection Mastery',
                    desc: 'Passive · +3% stamina and +5% armor per point.',
                    tip: 'Max lvl (20): +60% stamina · +100% armor.',
                    maxPts: 20
                },
                {
                    id: 'consecration', row: 2, col: 1, type: 'active', icon: '☀️', name: 'Consecration',
                    desc: 'Active · Holy ground dealing base + 30% weapon damage per second.',
                    tip: 'Max lvl (20): Scaling holy AoE area.',
                    maxPts: 20, mana: 15, cd: 8, group: 'holy', dmgBase: 10, dmgPerLvl: 5, wepPct: 30, req: 'holy_shield:3',
                    synergies: [{ from: 'holy_shield', pctPerPt: 5 }]
                },
                {
                    id: 'blessing_of_kings', row: 2, col: 0, type: 'toggle', icon: '👑', name: 'Blessing of Kings',
                    desc: 'Toggle Aura · Grants the entire party +5 + 0.5% per point bonus to all core attributes (Str, Dex, Vit, Int).',
                    tip: 'Max lvl (20): +15% total stats to everyone.',
                    maxPts: 20, mana: 0, cd: 0, group: 'aura', req: 'prot_mastery:3'
                },
                {
                    id: 'hammer_righteous', row: 3, col: 0, type: 'active', icon: '🔨', name: 'Hammer of Righteous',
                    desc: 'Active · Strike for 40% weapon damage as holy and hitting nearby targets.',
                    tip: 'Max lvl (20): Holy cleave generator.',
                    maxPts: 20, mana: 5, cd: 8, group: 'melee', dmgBase: 15, dmgPerLvl: 8, wepPct: 40, req: 'consecration:3',
                    synergies: [{ from: 'consecration', pctPerPt: 10 }]
                },
                {
                    id: 'shield_of_righteousness', row: 3, col: 2, type: 'active', icon: '💥', name: 'Shield of Righteousness',
                    desc: 'Active · Slam with your shield dealing damage based on block value.',
                    tip: 'Max lvl (20): Heavy holy shield slam.',
                    maxPts: 20, mana: 6, cd: 6, group: 'melee', dmgBase: 30, dmgPerLvl: 10, wepPct: 80, req: 'consecration:3',
                    synergies: [{ from: 'consecration', pctPerPt: 5 }, { from: 'prot_mastery', pctPerPt: 5 }]
                },
                {
                    id: 'holy_wrath', row: 4, col: 0, type: 'active', icon: '☀️', name: 'Holy Wrath',
                    desc: 'Active · Blast nearby for base + 150% weapon damage. Stuns Undead/Demons.',
                    tip: 'Max lvl (20): High holy scaling AoE.',
                    maxPts: 20, mana: 15, cd: 12, group: 'holy', dmgBase: 30, dmgPerLvl: 15, wepPct: 150, req: 'hammer_righteous:5'
                },
                {
                    id: 'guardian_of_ancient_kings', row: 5, col: 1, type: 'active', icon: '👑', name: 'Guardian of Kings',
                    desc: 'Active · Summon a guardian that reduces all damage you take by 50% for 12 seconds. 180s cooldown.',
                    tip: 'Max lvl (20): The ultimate defensive cooldown.',
                    maxPts: 20, mana: 20, cd: 180, group: 'buff', req: 'shield_of_righteousness:5'
                }
            ]
        },
    ]
};
