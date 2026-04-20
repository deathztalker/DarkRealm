/**
 * PALADIN — Class Definition (WoW: Wrath of the Lich King inspired)
 *
 * Three trees:
 *   • Auras        — Passive toggled auras that boost the entire party (UNCHANGED)
 *   • Retribution  — Two-handed melee DPS: Judgements, seals, Divine Storm
 *   • Protection   — Shield tank: block, Consecration, Holy Shield, Avenger's Shield
 */
export const PALADIN_CLASS = {
    id: 'paladin', name: 'Paladin', icon: '⚜️',
    description: 'A righteous crusader empowered by divine light. Fill any role: overwhelm enemies as a Retribution warrior, shield allies as Protection, or command the battlefield with ancient Auras.',
    stats: { str: 25, dex: 12, vit: 22, int: 11 },
    primaryStat: 'str',
    hitDie: 10,
    trees: [

        // ════════════════════════════════════════════════════
        // ★ AURAS — Passive auras that buff the entire party
        //   (Kept intact as requested)
        // ════════════════════════════════════════════════════
        {
            id: 'auras', name: 'Auras', icon: '🌟',
            nodes: [
                {
                    id: 'might_aura', row: 0, col: 1, type: 'toggle', icon: '💪', name: 'Aura: Might',
                    desc: 'Toggle Aura · Emit an aura of divine might that increases all nearby allies\' weapon damage by 20 + 2% per point. Passive — always on once activated.',
                    tip: 'Max lvl (20): +60% weapon damage to entire party. The best aura for melee groups.',
                    maxPts: 20, mana: 0, cd: 0
                },
                {
                    id: 'prayer_aura', row: 1, col: 0, type: 'toggle', icon: '🙏', name: 'Aura: Prayer',
                    desc: 'Toggle Aura · Emit a healing aura that restores 2 + 1 per point HP per second to you and all nearby allies. Scales well with Aura Mastery.',
                    tip: 'Max lvl (20): +22 HP/s for entire party. Incredible sustained healing.',
                    maxPts: 20, mana: 0, cd: 0
                },
                {
                    id: 'aura_mastery', row: 1, col: 2, type: 'passive', icon: '⭐', name: 'Aura Mastery',
                    desc: 'Passive · +5% holy damage per point and aura radius increases by +4% per point. Larger auras cover more party members. Core passive for dedicated aura builds.',
                    tip: 'Max lvl (20): +100% holy damage · aura covers a huge area.',
                    maxPts: 20
                },
                {
                    id: 'resist_all', row: 2, col: 1, type: 'toggle', icon: '🛡️', name: 'Aura: Resist All',
                    desc: 'Toggle Aura · Boost all resistances of you and nearby allies by 5 + 1.5% per point. Essential in high-difficulty content where elemental damage is dangerous.',
                    tip: 'Max lvl (20): +35% all resistances to party. Hard counters elemental bosses.',
                    maxPts: 20, mana: 0, cd: 0, req: 'prayer_aura:3'
                },
                {
                    id: 'holy_fire_aura', row: 2, col: 0, type: 'toggle', icon: '🔥', name: 'Aura: Holy Fire',
                    desc: 'Toggle Aura · Emit a fiery holy aura that passively damages all nearby enemies for 3 + 2 per point fire/holy damage every second. Pure passive AoE without casting.',
                    tip: 'Max lvl (20): 43 damage/s to all enemies in range. Free passive DPS.',
                    maxPts: 20, mana: 0, cd: 0, req: 'might_aura:3'
                },
                {
                    id: 'vigor', row: 3, col: 0, type: 'toggle', icon: '💨', name: 'Aura: Vigor',
                    desc: 'Toggle Aura · Emit an aura of divine speed, increasing movement speed of you and nearby allies by 20 + 1.5% per point.',
                    tip: 'Max lvl (20): +50% movement speed party-wide.',
                    maxPts: 20, mana: 0, cd: 0, req: 'resist_all:3'
                },
                {
                    id: 'fanaticism', row: 3, col: 2, type: 'toggle', icon: '⚡', name: 'Aura: Fanaticism',
                    desc: 'Toggle Aura · The most powerful offensive aura. Grants all nearby allies +30 + 1.5% per point attack speed AND +30 + 2% per point damage. Cannot be combined with other damage auras.',
                    tip: 'Max lvl (20): +60% IAS · +70% damage. Best DPS aura in the game.',
                    maxPts: 20, mana: 0, cd: 0, req: 'holy_fire_aura:5'
                },
                {
                    id: 'conviction', row: 4, col: 1, type: 'toggle', icon: '🔴', name: 'Aura: Conviction',
                    desc: 'Toggle Aura · Drastically reduce the armor and all resistances of all nearby enemies by 30 + 2% per point. The most powerful offensive support aura — enemies become drastically more vulnerable to all damage.',
                    tip: 'Max lvl (20): -70% enemy armor and -70% all enemy resistances. Enables entire team.',
                    maxPts: 20, mana: 0, cd: 0, req: 'fanaticism:10'
                },
            ]
        },

        // ════════════════════════════════════════════════════
        // ★ RETRIBUTION — WoW LK melee DPS
        //   Seals + Judgement burst · Divine Storm · windfury
        // ════════════════════════════════════════════════════
        {
            id: 'retribution', name: 'Retribution', icon: '⚔️',
            nodes: [
                {
                    id: 'seal_of_command', row: 0, col: 1, type: 'toggle', icon: '⚔️', name: 'Seal of Command',
                    desc: 'Toggle Seal · While active, every melee swing has a 30% chance to deal +40 + 8 per point bonus holy damage (beyond your normal hit). Keep a Seal active at ALL times — Judgement consumes it for a massive burst.',
                    tip: 'Max lvl (20): +200 holy damage on proc. Seal + Judge = burst cycle.',
                    maxPts: 20, mana: 2, cd: 0
                },
                {
                    id: 'crusader_strike', row: 1, col: 0, type: 'active', icon: '⚡', name: 'Crusader Strike',
                    desc: 'Active · An instant melee strike that deals 120% weapon damage as holy damage and refreshes your active Seal (it will not be consumed). 6s cooldown. Your primary damage-per-cooldown button.',
                    tip: 'Max lvl (20): 120% weapon as holy · Seal always active between Judgements.',
                    maxPts: 20, mana: 5, cd: 6, group: 'holy', dmgBase: 0, dmgPerLvl: 0
                },
                {
                    id: 'judgement', row: 1, col: 2, type: 'active', icon: '⚖️', name: 'Judgement',
                    desc: 'Active · Judge your current Seal against the target, releasing its stored power as a burst of 50 + 20 per point holy damage AND applying a 10-second debuff that increases holy damage taken by 15%. Consumes the Seal.',
                    tip: 'Max lvl (20): 450 holy + 15% holy vuln. Always re-apply your Seal after Judging.',
                    maxPts: 20, mana: 8, cd: 8, group: 'holy', dmgBase: 50, dmgPerLvl: 20, req: 'seal_of_command:1'
                },
                {
                    id: 'ret_mastery', row: 2, col: 0, type: 'passive', icon: '🔴', name: 'Righteous Vengeance',
                    desc: 'Passive · Your Judgement and Divine Storm critical strikes apply a 4-second DoT on the target for 5 + 2 per point holy damage per second. More crits = more DoTs stacking simultaneously.',
                    tip: 'Max lvl (20): Each crit leaves a 45/s DoT. Stack DoTs on bosses.',
                    maxPts: 20
                },
                {
                    id: 'art_of_war', row: 2, col: 2, type: 'passive', icon: '💡', name: 'Art of War',
                    desc: 'Passive · Whenever you score a critical melee strike, your next spell (any Judgement, Exorcism, or Holy Light) costs NO mana and has no cast time. 10-second internal cooldown.',
                    tip: 'Max lvl (20): Crit → instant free spell with no CD. Creates explosive burst windows.',
                    maxPts: 20
                },
                {
                    id: 'divine_storm', row: 3, col: 1, type: 'active', icon: '🌩️', name: 'Divine Storm',
                    desc: 'Active · Unleash a devastating spin attack that hits ALL enemies near you for 110% weapon damage as holy damage. Heals you and up to 3 party members for 25% of all damage dealt. 10s cooldown.',
                    tip: 'Max lvl (20): 110% weapon AoE holy · free party heal. Combines with Conviction Aura for massive numbers.',
                    maxPts: 20, mana: 8, cd: 10, group: 'holy', dmgBase: 0, dmgPerLvl: 0, req: 'judgement:5',
                    synergies: [{ from: 'ret_mastery', pctPerPt: 3 }]
                },
                {
                    id: 'repentance', row: 3, col: 0, type: 'active', icon: '😇', name: 'Repentance',
                    desc: 'Active · Lock a humanoid or demon target in a state of meditation for 6 + 0.3 per point seconds — they are completely incapacitated and cannot act. Cancelled by any damage.',
                    tip: 'Max lvl (20): 12s CC on humanoids and demons. Essential crowd control for tough encounters.',
                    maxPts: 20, mana: 9, cd: 60, req: 'crusader_strike:5'
                },
                {
                    id: 'exorcism', row: 4, col: 1, type: 'active', icon: '🔥', name: 'Exorcism',
                    desc: 'Active · Hurl holy fire at the target for 80 + 30 per point holy damage. ALWAYS critically strikes undead and demons. Against normal enemies Art of War makes it instant and free. 15s cooldown.',
                    tip: 'Max lvl (20): 680 holy · guaranteed crit vs undead/demons. Best boss nuke in the tree.',
                    maxPts: 20, mana: 14, cd: 15, group: 'holy', dmgBase: 80, dmgPerLvl: 30, req: 'divine_storm:5',
                    synergies: [{ from: 'art_of_war', pctPerPt: 4 }, { from: 'judgement', pctPerPt: 3 }]
                },
            ]
        },

        // ════════════════════════════════════════════════════
        // ★ PROTECTION — WoW LK shield tank
        //   Avenger's Shield / Holy Shield / Hammer of Righteous
        // ════════════════════════════════════════════════════
        {
            id: 'protection', name: 'Protection', icon: '🛡️',
            nodes: [
                {
                    id: 'avengers_shield', row: 0, col: 1, type: 'active', icon: '🛡️', name: 'Avenger\'s Shield',
                    desc: 'Active · Hurl your shield at a target for 30 + 12 per point holy damage. The shield BOUNCES to 2 additional nearby enemies, dealing 85% of the original damage each. All targets are silenced for 3 seconds. Requires a shield equipped.',
                    tip: 'Max lvl (20): 270 damage · two 229 bounces · 3s silence. Best opening skill for Protection.',
                    maxPts: 20, mana: 10, cd: 15, group: 'holy', dmgBase: 30, dmgPerLvl: 12
                },
                {
                    id: 'holy_shield', row: 1, col: 0, type: 'active', icon: '✨', name: 'Holy Shield',
                    desc: 'Active (Buff) · Infuse your shield with divine power for 8 + 0.4 per point seconds. During this time, every block also damages the attacker for 80 + 15 per point holy damage and increases your block chance by +30%. Requires shield.',
                    tip: 'Max lvl (20): 16s buff · +30% block · 380 holy damage reflected on each block.',
                    maxPts: 20, mana: 10, cd: 8, group: 'holy', dmgBase: 80, dmgPerLvl: 15, req: 'avengers_shield:1'
                },
                {
                    id: 'prot_mastery', row: 1, col: 2, type: 'passive', icon: '🧱', name: 'Touched by the Light',
                    desc: 'Passive · +3% stamina per point, and 15% of your bonus stamina is converted into spell power (holy damage). Also grants +5 armor per point. Makes tanking and DPS scale together.',
                    tip: 'Max lvl (20): +60% stamina · 15% stamina → spell power · +100 bonus armor. Tank and deal damage simultaneously.',
                    maxPts: 20
                },
                {
                    id: 'hammer_righteous', row: 2, col: 1, type: 'active', icon: '🔨', name: 'Hammer of the Righteous',
                    desc: 'Active · Strike the current target for 40% weapon damage as holy damage AND simultaneously hit all enemies near the target for 40% weapon damage as holy damage. 3 charges (recharge every 8s). Great threat generation.',
                    tip: 'Max lvl (20): 40% weapon AoE holy · 3 charges. Excellent threat on multiple enemies.',
                    maxPts: 20, mana: 5, cd: 8, group: 'holy', dmgBase: 0, dmgPerLvl: 0, req: 'holy_shield:3'
                },
                {
                    id: 'ardent_defender', row: 2, col: 0, type: 'passive', icon: '💎', name: 'Ardent Defender',
                    desc: 'Passive · When you are below 35% HP, all damage you take is reduced by 20 + 1% per point. At 10 points, the first time you would die while at high talent investment, you instead survive at 1 HP (once per 120s).',
                    tip: 'Max lvl (20): 40% damage reduction below 35% HP · "cheat death" at 10pts.',
                    maxPts: 20
                },
                {
                    id: 'sacred_duty', row: 3, col: 2, type: 'passive', icon: '⏱️', name: 'Sacred Duty',
                    desc: 'Passive · Reduces the cooldown of Divine Shield / Divine Protection by 30 + 1.5% per point. Also increases your critical strike chance by +1% per point.',
                    tip: 'Max lvl (20): -60% Divine Shield CD (from 270s → 108s) · +20% crit.',
                    maxPts: 20
                },
                {
                    id: 'shield_of_righteousness', row: 3, col: 0, type: 'active', icon: '💥', name: 'Shield of Righteousness',
                    desc: 'Active · Slam a target with your shield, dealing 300% of your shield\'s block value as holy damage AND adding 30 + 10 per point bonus holy damage. Scales with every improvement to your block value.',
                    tip: 'Max lvl (20): 300% shield block value + 530 bonus holy. Gets stronger as you upgrade your shield.',
                    maxPts: 20, mana: 6, cd: 6, group: 'holy', dmgBase: 30, dmgPerLvl: 10, req: 'hammer_righteous:5',
                    synergies: [{ from: 'prot_mastery', pctPerPt: 5 }]
                },
                {
                    id: 'divine_protection', row: 4, col: 1, type: 'active', icon: '🛡️', name: 'Divine Protection',
                    desc: 'Active · Surround yourself with divine energy, reducing ALL damage taken by 50% for 10 + 0.5 per point seconds. Unlike Divine Shield, you can still attack during this effect. 60s cooldown.',
                    tip: 'Max lvl (20): 50% damage reduction for 20s while still fully fighting. The ultimate tank cooldown.',
                    maxPts: 20, mana: 0, cd: 60, req: 'shield_of_righteousness:5',
                    synergies: [{ from: 'ardent_defender', pctPerPt: 2 }]
                },
            ]
        },
    ]
};
