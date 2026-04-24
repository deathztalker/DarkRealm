/**
 * ROGUE — Class Definition
 * Three trees: Assassination (burst + stealth) · Poison (DoT) · Traps (area denial)
 */
export const ROGUE_CLASS = {
    id: 'rogue', name: 'Rogue', icon: '🗡️',
    description: 'A deadly assassin who bursts down targets from stealth, spreads lethal poisons, and deploys traps that turn the battlefield into a killing field.',
    stats: { str: 15, dex: 30, vit: 15, int: 10 },
    trees: [

        // ═══ ASSASSINATION — Combo burst build ═══
        {
            id: 'assassination', name: 'Assassination', icon: '🗡️',
            nodes: [
                {
                    id: 'claw_strike', row: 0, col: 1, type: 'active', icon: '🗡️', name: 'Claw Strike',
                    desc: 'Active · Fast strike for base + 100% weapon damage. Generates 1 Combo Point.',
                    tip: 'Max lvl (20): Quick CP builder with scaling.',
                    maxPts: 20, mana: 2, cd: 0, group: 'melee', dmgBase: 12, dmgPerLvl: 5, wepPct: 100
                },
                {
                    id: 'shadow_step', row: 1, col: 0, type: 'active', icon: '👣', name: 'Shadow Step',
                    desc: 'Active · Step through the shadows to appear behind your target, increasing the damage of your next ability by 50%. 10s cooldown.',
                    tip: 'Max lvl (20): Instant gap closer. Buffs your next Ambush or Eviscerate.',
                    maxPts: 20, mana: 5, cd: 10, group: 'teleport', req: 'claw_strike:3'
                },
                {
                    id: 'ambush', row: 1, col: 2, type: 'active', icon: '🌑', name: 'Ambush',
                    desc: 'Active · Strike for base + 200% weapon damage (guaranteed crit). Generates 3 Combo Points.',
                    tip: 'Max lvl (20): Massive opener with weapon scaling.',
                    maxPts: 20, mana: 10, cd: 0, group: 'melee', dmgBase: 30, dmgPerLvl: 15, wepPct: 200, req: 'claw_strike:5',
                    synergies: [{ from: 'claw_strike', pctPerPt: 5 }]
                },
                {
                    id: 'assassin_mastery', row: 2, col: 0, type: 'passive', icon: '🎯', name: 'Assassin Mastery',
                    desc: 'Passive · Increases your Agility by 2% per point and your Critical Strike Multiplier by 10% per point.',
                    tip: 'Max lvl (20): +40% Agility · +200% Crit Multiplier.',
                    maxPts: 20
                },
                {
                    id: 'eviscerate', row: 2, col: 1, type: 'active', icon: '💢', name: 'Eviscerate',
                    desc: 'Active · Finisher for base + 150% weapon damage. Bonus +50% per Combo Point.',
                    tip: 'Max lvl (20): High burst finisher with scaling.',
                    maxPts: 20, mana: 8, cd: 0, group: 'melee', dmgBase: 40, dmgPerLvl: 15, wepPct: 150, req: 'ambush:1',
                    synergies: [{ from: 'ambush', pctPerPt: 5 }, { from: 'assassin_mastery', pctPerPt: 2 }]
                },
                {
                    id: 'vanish', row: 2, col: 2, type: 'active', icon: '💨', name: 'Vanish',
                    desc: 'Active · Instantly disappear into stealth for up to 15 seconds. Cancels all DoTs on you and drops enemy aggro.',
                    tip: 'Vanish → Ambush → Eviscerate is the core assassination rotation.',
                    maxPts: 20, mana: 10, cd: 60, req: 'ambush:3'
                },
                {
                    id: 'fan_of_knives', row: 3, col: 1, type: 'active', icon: '🔪', name: 'Fan of Knives',
                    desc: 'Active · Throw knives for base + 80% weapon damage in an AoE. Applies poisons.',
                    tip: 'Max lvl (20): AoE poison spreader with scaling.',
                    maxPts: 20, mana: 15, cd: 2, group: 'melee', dmgBase: 20, dmgPerLvl: 10, wepPct: 80, req: 'eviscerate:5'
                },
                {
                    id: 'death_mark', row: 4, col: 0, type: 'active', icon: '💀', name: 'Death Mark',
                    desc: 'Active · Brand a target with a mark that causes them to take +40 + 3% per point increased damage from ALL sources for 10 seconds.',
                    tip: 'Max lvl (20): Target takes +100% more damage for 10s.',
                    maxPts: 20, mana: 8, cd: 0, req: 'fan_of_knives:5'
                },
                {
                    id: 'smoke_bomb', row: 4, col: 2, type: 'active', icon: '🌫️', name: 'Smoke Bomb',
                    desc: 'Active · Create a thick cloud of smoke for 5 seconds. While inside, you are stealthed and enemies have a 50% chance to miss their attacks. 45s cooldown.',
                    tip: 'Max lvl (20): Area-of-effect stealth and defensive utility.',
                    maxPts: 20, mana: 20, cd: 45, req: 'vanish:5'
                },
                {
                    id: 'blade_dance', row: 5, col: 1, type: 'active', icon: '🌀', name: 'Blade Dance',
                    desc: 'Active · Frenzied cuts for base + 90% weapon damage 6 times over 2s.',
                    tip: 'Max lvl (20): High scaling multi-hit AoE.',
                    maxPts: 20, mana: 15, cd: 12, group: 'melee', dmgBase: 20, dmgPerLvl: 8, wepPct: 90, req: 'death_mark:5',
                    synergies: [{ from: 'fan_of_knives', pctPerPt: 5 }, { from: 'assassin_mastery', pctPerPt: 3 }]
                },
                {
                    id: 'cloak_of_shadows', row: 6, col: 0, type: 'active', icon: '🦇', name: 'Cloak of Shadows',
                    desc: 'Active · Instantly remove all magical debuffs and become immune to magic damage and effects for 3 + 0.1 per point seconds.',
                    tip: 'Max lvl (20): 5s magic immunity. The ultimate anti-caster tool.',
                    maxPts: 20, mana: 15, cd: 45, group: 'buff', req: 'blade_dance:5'
                },
                {
                    id: 'shadow_clone', row: 6, col: 2, type: 'active', icon: '👥', name: 'Shadow Clone',
                    desc: 'Active · Create a shadowy duplicate of yourself that mimics your attacks and abilities at 50% effectiveness for 10s. Also copies weapon procs.',
                    tip: 'Max lvl (20): Duplicate your burst window.',
                    maxPts: 20, mana: 25, cd: 120, group: 'buff', req: 'blade_dance:5'
                },
                {
                    id: 'assassinate', row: 6, col: 1, type: 'passive', icon: '🎯', name: 'Assassinate',
                    desc: 'Passive · You have a 1% + 0.5% per point chance to instantly kill non-boss enemies below 20% health. Against bosses, deals 500% damage instead.',
                    tip: 'Max lvl (20): 11% execute chance. The ultimate finisher.',
                    maxPts: 20, req: 'shadow_clone:1'
                }
            ]
        },

        // ═══ POISON — DoT kill machine ═══
        {
            id: 'poison', name: 'Poison', icon: '☣️',
            nodes: [
                {
                    id: 'poison_blade', row: 0, col: 1, type: 'active', icon: '☣️', name: 'Poison Blade',
                    desc: 'Active · Coat weapon in venom: base + 25% weapon damage per second as poison.',
                    tip: 'Max lvl (20): Weapon-based poison application.',
                    maxPts: 20, mana: 5, cd: 0, dmgBase: 5, dmgPerLvl: 3, wepPct: 25, group: 'buff'
                },
                {
                    id: 'master_poisoner', row: 1, col: 0, type: 'passive', icon: '🧪', name: 'Master Poisoner',
                    desc: 'Passive · Increases the damage of your poisons by 5% per point and reduces the poison resistance of all enemies by 2% per point.',
                    tip: 'Max lvl (20): +100% poison damage · -40% enemy poison res.',
                    maxPts: 20
                },
                {
                    id: 'shiv', row: 1, col: 2, type: 'active', icon: '🔪', name: 'Shiv',
                    desc: 'Active · Jab for base + 60% weapon damage and trigger all poisons instantly.',
                    tip: 'Max lvl (20): Scaling jab + poison trigger.',
                    maxPts: 20, mana: 4, cd: 3, group: 'melee', dmgBase: 10, dmgPerLvl: 5, wepPct: 60, req: 'poison_blade:3',
                    synergies: [{ from: 'poison_blade', pctPerPt: 5 }]
                },
                {
                    id: 'venom', row: 2, col: 0, type: 'passive', icon: '🟢', name: 'Venom',
                    desc: 'Passive · +5% poison damage per point and +0.2 seconds poison duration per point.',
                    tip: 'Max lvl (20): +100% poison damage · +4s duration.',
                    maxPts: 20, req: 'master_poisoner:5'
                },
                {
                    id: 'envenom', row: 2, col: 1, type: 'active', icon: '💧', name: 'Envenom',
                    desc: 'Active · Inject venom for base + 45% weapon damage per second for 6s.',
                    tip: 'Max lvl (20): High scaling lethal toxin.',
                    maxPts: 20, mana: 12, cd: 3, group: 'melee', dmgBase: 25, dmgPerLvl: 10, wepPct: 45, req: 'shiv:3',
                    synergies: [{ from: 'master_poisoner', pctPerPt: 5 }, { from: 'poison_blade', pctPerPt: 5 }]
                },
                {
                    id: 'lethal_toxins', row: 3, col: 1, type: 'passive', icon: '☠️', name: 'Lethal Toxins',
                    desc: 'Passive · Your poisons now also reduce the target\'s attack speed and movement speed by 1% per point.',
                    tip: 'Max lvl (20): Poisons slow and weaken enemies by 20%.',
                    maxPts: 20, req: 'envenom:5'
                },
                {
                    id: 'plague', row: 4, col: 1, type: 'active', icon: '☠️', name: 'Plague',
                    desc: 'Active · Toxic cloud dealing base + 40% weapon damage per second in AoE.',
                    tip: 'Max lvl (20): Scaling area poison cloud.',
                    maxPts: 20, mana: 18, cd: 8, group: 'poison', dmgBase: 15, dmgPerLvl: 8, wepPct: 40, req: 'lethal_toxins:5',
                    synergies: [{ from: 'envenom', pctPerPt: 10 }]
                },
                {
                    id: 'poison_sentry', row: 5, col: 0, type: 'active', icon: '☣️', name: 'Poison Sentry',
                    desc: 'Active · Sentry dealing base + 35% weapon damage per second as poison.',
                    tip: 'Max lvl (20): Scaling poison turret.',
                    maxPts: 20, mana: 25, cd: 5, dmgBase: 10, dmgPerLvl: 6, wepPct: 35, req: 'plague:3'
                },
                {
                    id: 'rupture', row: 5, col: 2, type: 'active', icon: '🩸', name: 'Rupture',
                    desc: 'Active · Bleed for base + 50% weapon damage per second per Combo Point.',
                    tip: 'Max lvl (20): Scaling DoT finisher.',
                    maxPts: 20, mana: 10, cd: 0, group: 'melee', dmgBase: 20, dmgPerLvl: 10, wepPct: 50, req: 'plague:5'
                }
            ]
        },

        // ═══ TRAPS — Area denial build ═══
        {
            id: 'traps', name: 'Traps', icon: '⚙️',
            nodes: [
                {
                    id: 'shock_trap', row: 0, col: 1, type: 'active', icon: '⚡', name: 'Shock Trap',
                    desc: 'Active · Deploy trap dealing base + 80% weapon damage as lightning and stunning.',
                    tip: 'Max lvl (20): Scaling lightning CC trap.',
                    maxPts: 20, mana: 8, cd: 1, dmgBase: 20, dmgPerLvl: 8, wepPct: 80
                },
                {
                    id: 'trap_mastery', row: 1, col: 0, type: 'passive', icon: '🔧', name: 'Trap Mastery',
                    desc: 'Passive · +5% trap damage per point and trap explosion radius grows +4% per point.',
                    tip: 'Max lvl (20): +100% trap damage · much larger explosion areas.',
                    maxPts: 20
                },
                {
                    id: 'chain_reaction', row: 1, col: 2, type: 'passive', icon: '💥', name: 'Chain Reaction',
                    desc: 'Passive · +1% critical strike chance per point. Each point also grows trap explosion radius by +5%.',
                    tip: 'Max lvl (20): +20% crit · traps have 100px larger blast radius.',
                    maxPts: 20, req: 'trap_mastery:3'
                },
                {
                    id: 'fire_sentry', row: 2, col: 0, type: 'active', icon: '🔥', name: 'Fire Sentry',
                    desc: 'Active · Fire turret shooting for base + 110% weapon damage as fire.',
                    tip: 'Max lvl (20): Scaling fire turret.',
                    maxPts: 20, mana: 20, cd: 2, dmgBase: 40, dmgPerLvl: 12, wepPct: 110, req: 'trap_mastery:5',
                    synergies: [{ from: 'trap_mastery', pctPerPt: 5 }]
                },
                {
                    id: 'death_sentry', row: 2, col: 2, type: 'active', icon: '💀', name: 'Death Sentry',
                    desc: 'Active · Lightning sentry dealing base + 100% weapon damage. Explodes corpses.',
                    tip: 'Max lvl (20): Scaling lightning + explosion utility.',
                    maxPts: 20, mana: 20, cd: 2, dmgBase: 30, dmgPerLvl: 12, wepPct: 100, req: 'chain_reaction:5',
                    synergies: [{ from: 'trap_mastery', pctPerPt: 5 }]
                },
                {
                    id: 'ice_trap', row: 3, col: 1, type: 'active', icon: '🧊', name: 'Ice Trap',
                    desc: 'Active · Frost trap dealing base + 120% weapon damage and freezing AoE.',
                    tip: 'Max lvl (20): Scaling cold CC trap.',
                    maxPts: 20, mana: 15, cd: 1.5, dmgBase: 35, dmgPerLvl: 15, wepPct: 120, req: 'fire_sentry:3',
                    synergies: [{ from: 'trap_mastery', pctPerPt: 5 }]
                },
                {
                    id: 'unfair_advantage', row: 4, col: 1, type: 'passive', icon: '🎭', name: 'Unfair Advantage',
                    desc: 'Passive · You deal 2% more damage per point to enemies that are Stunned, Frozen, Blinded, or Rooted.',
                    tip: 'Max lvl (20): +40% damage against controlled enemies. Perfect for trap/poison builds.',
                    maxPts: 20, req: 'ice_trap:5'
                },
                {
                    id: 'evasion', row: 5, col: 0, type: 'passive', icon: '💨', name: 'Evasion',
                    desc: 'Passive · Increases your chance to dodge all attacks by 1% + 0.5% per point.',
                    tip: 'Max lvl (20): 11% flat dodge chance.',
                    maxPts: 20, req: 'unfair_advantage:5'
                },
                {
                    id: 'preparation', row: 6, col: 1, type: 'active', icon: '⏳', name: 'Preparation',
                    desc: 'Active · Instantly reset the cooldown of all your Rogue abilities (Vanish, Cloak of Shadows, Shadow Clone, Traps).',
                    tip: 'Max lvl (1): Double Vanish, double traps, double burst.',
                    maxPts: 1, mana: 0, cd: 300, req: 'evasion:5'
                }
            ]
        },
    ]
};
