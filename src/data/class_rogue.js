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
                    desc: 'Active · A lightning-fast melee strike dealing 12 + 5 per point physical damage that generates 1 Combo Point. Combo Points power your finishers.',
                    tip: 'Max lvl (20): 112 damage. Spam to build 5 Combo Points quickly.',
                    maxPts: 20, mana: 2, cd: 0, group: 'melee', dmgBase: 12, dmgPerLvl: 5
                },
                {
                    id: 'ambush', row: 1, col: 0, type: 'active', icon: '🌑', name: 'Ambush',
                    desc: 'Active · Strike from stealth for 30 + 15 per point physical damage that is ALWAYS a critical hit. Generates 3 Combo Points on hit. Requires Vanish or stealth entry.',
                    tip: 'Max lvl (20): 330 damage + guaranteed crit. Top opener from stealth.',
                    maxPts: 20, mana: 10, cd: 0, group: 'melee', dmgBase: 30, dmgPerLvl: 15
                },
                {
                    id: 'eviscerate', row: 1, col: 2, type: 'active', icon: '💢', name: 'Eviscerate',
                    desc: 'Active · Spend ALL current Combo Points in a devastating strike. Deals 40 + 15 per point damage plus +50% per Combo Point spent. 5 CPs = +250% total damage.',
                    tip: 'Max lvl (20): 340 base × 3.5 at 5 CPs = 1,190 damage. The signature finisher.',
                    maxPts: 20, mana: 8, cd: 0, group: 'melee', dmgBase: 40, dmgPerLvl: 15
                },
                {
                    id: 'vanish', row: 2, col: 1, type: 'active', icon: '💨', name: 'Vanish',
                    desc: 'Active · Instantly disappear into stealth for up to 15 seconds. Cancels all DoTs on you and drops enemy aggro. Re-enables Ambush for a guaranteed critical opener. 60s cooldown.',
                    tip: 'Vanish → Ambush → Eviscerate is the core assassination rotation.',
                    maxPts: 20, mana: 10, cd: 60
                },
                {
                    id: 'lethality', row: 2, col: 2, type: 'passive', icon: '💀', name: 'Lethality',
                    desc: 'Passive · +10% critical strike multiplier per point. At 10 points, all critical strikes also apply a 2-second bleed that deals 25% of the crit damage as a DoT.',
                    tip: 'Max lvl (20): +200% crit multiplier · bleed on crit at 10pts. Essential for burst builds.',
                    maxPts: 20
                },
                {
                    id: 'death_mark', row: 3, col: 0, type: 'active', icon: '💀', name: 'Death Mark',
                    desc: 'Active · Brand a target with a mark that causes them to take +40 + 3% per point increased damage from ALL sources for 10 seconds. Stack with Eviscerate for devastating burst.',
                    tip: 'Max lvl (20): Target takes +100% more damage for 10s. Open every boss fight with this.',
                    maxPts: 20, mana: 8, cd: 0, req: 'eviscerate:5'
                },
                {
                    id: 'shadow_dance', row: 3, col: 2, type: 'passive', icon: '🌑', name: 'Shadow Dance',
                    desc: 'Passive · When you kill an enemy that is Stunned, Poisoned, Blinded, or Marked, your Vanish cooldown is immediately reset. Keep Vanish available by targeting debuffed enemies first.',
                    tip: 'With good target selection, you can chain stealth openers indefinitely.',
                    maxPts: 1
                },
                {
                    id: 'blade_flurry', row: 4, col: 1, type: 'active', icon: '🌀', name: 'Blade Flurry',
                    desc: 'Active · Channel a frenzied series of cuts hitting all enemies around you 6 times over 2 seconds, each hit dealing 20 + 8 per point damage. Spending 5 Combo Points adds +50% damage to all 6 hits.',
                    tip: 'Max lvl (20): 6 × 180 = 1,080 AoE damage. Best surrounded-by-enemies skill.',
                    maxPts: 20, mana: 15, cd: 12, group: 'melee', dmgBase: 20, dmgPerLvl: 8, req: 'death_mark:5'
                },
            ]
        },

        // ═══ POISON — DoT kill machine ═══
        {
            id: 'poison', name: 'Poison', icon: '☣️',
            nodes: [
                {
                    id: 'poison_blade', row: 0, col: 1, type: 'active', icon: '☣️', name: 'Poison Blade',
                    desc: 'Active · Coat your weapon in venom for 30 seconds. Every attack applies 5 + 3% per point poison damage per second for 4 seconds. Stacks with multiple hits.',
                    tip: 'Max lvl (20): 65/s poison per stack × 4s per hit. Becomes massive DPS with fast attacks.',
                    maxPts: 20, mana: 5, cd: 0
                },
                {
                    id: 'venom', row: 1, col: 0, type: 'passive', icon: '🟢', name: 'Venom',
                    desc: 'Passive · +5% poison damage per point and +0.2 seconds poison duration per point. At max level, poisons last 4 seconds longer and deal 100% more damage.',
                    tip: 'Max lvl (20): +100% poison damage · +4s duration. The essential poison passive.',
                    maxPts: 20
                },
                {
                    id: 'virulence', row: 1, col: 2, type: 'passive', icon: '⚡', name: 'Virulence',
                    desc: 'Passive · +4% poison damage per point AND +2% attack speed per point. Faster attacks = more poison stacks = more total damage.',
                    tip: 'Max lvl (20): +80% poison damage · +40% attack speed.',
                    maxPts: 20
                },
                {
                    id: 'envenom', row: 2, col: 1, type: 'active', icon: '💧', name: 'Envenom',
                    desc: 'Active · Instantly inject lethal venom into a target dealing 25 + 10 per point poison damage per second for 6 + 0.2 per point seconds. High single-target DoT burst.',
                    tip: 'Max lvl (20): 225/s × 10s = 2,250 total poison DoT.',
                    maxPts: 20, mana: 12, cd: 3, group: 'poison', dmgBase: 25, dmgPerLvl: 10, req: 'venom:3',
                    synergies: [{ from: 'venom', pctPerPt: 3 }]
                },
                {
                    id: 'plague', row: 3, col: 1, type: 'active', icon: '☠️', name: 'Plague',
                    desc: 'Active · Throw a flask of plague that creates a toxic cloud for 5 seconds dealing 15 + 8 per point poison damage per second in the area. Enemies who leave still carry the poison.',
                    tip: 'Max lvl (20): 175/s poison cloud AoE for 5s. Force enemies to take damage or flee.',
                    maxPts: 20, mana: 18, cd: 8, group: 'poison', dmgBase: 15, dmgPerLvl: 8, req: 'envenom:5',
                    synergies: [{ from: 'virulence', pctPerPt: 3 }]
                },
            ]
        },

        // ═══ TRAPS — Area denial build ═══
        {
            id: 'traps', name: 'Traps', icon: '⚙️',
            nodes: [
                {
                    id: 'shock_trap', row: 0, col: 1, type: 'active', icon: '⚡', name: 'Shock Trap',
                    desc: 'Active · Deploy a trap that stuns the first enemy to step on it for 0.5 + 0.05 per point seconds and deals 20 + 8 per point lightning damage. Stays active for 60 seconds.',
                    tip: 'Max lvl (20): 0.5 + 1.0s stun + 180 damage. Great for corridors.',
                    maxPts: 20, mana: 8, cd: 1
                },
                {
                    id: 'trap_mastery', row: 1, col: 0, type: 'passive', icon: '🔧', name: 'Trap Mastery',
                    desc: 'Passive · +5% trap damage per point and trap explosion radius grows +4% per point. Essential for dealing damage from traps at range.',
                    tip: 'Max lvl (20): +100% trap damage · much larger explosion areas.',
                    maxPts: 20
                },
                {
                    id: 'chain_reaction', row: 1, col: 2, type: 'passive', icon: '💥', name: 'Chain Reaction',
                    desc: 'Passive · +1% critical strike chance per point. Each point also grows trap explosion radius by +5%. At high levels, traps can chain-trigger nearby traps.',
                    tip: 'Max lvl (20): +20% crit · traps have 100px larger blast radius.',
                    maxPts: 20
                },
                {
                    id: 'fire_sentry', row: 2, col: 0, type: 'active', icon: '🔥', name: 'Fire Sentry',
                    desc: 'Active · Plant a fire turret that automatically shoots fire bolts at nearby enemies for 40 + 12 per point fire damage. Lasts 60 seconds, attacks once per second.',
                    tip: 'Max lvl (20): 280 fire damage per shot. Two sentries = 560 DPS.',
                    maxPts: 20, mana: 20, cd: 2, req: 'shock_trap:3'
                },
                {
                    id: 'death_sentry', row: 2, col: 2, type: 'active', icon: '💀', name: 'Death Sentry',
                    desc: 'Active · Deploy a sentry that fires lightning bolts dealing 30 + 12 per point damage. When an enemy dies within range, it creates a corpse explosion dealing 50% of the enemy\'s max HP as AoE damage.',
                    tip: 'Max lvl (20): 270 lightning + corpse explosions that scale with enemy HP.',
                    maxPts: 20, mana: 20, cd: 2, req: 'trap_mastery:5'
                },
                {
                    id: 'ice_trap', row: 3, col: 1, type: 'active', icon: '🧊', name: 'Ice Trap',
                    desc: 'Active · Plant a trap that explodes in frost on trigger, dealing 35 + 15 per point cold damage and freezing all enemies in range for 1.5 seconds. ★ Synergy: +4% per Trap Mastery point.',
                    tip: 'Max lvl (20): 335 cold AoE + 1.5s freeze. Best control trap.',
                    maxPts: 20, mana: 15, cd: 1.5, req: 'fire_sentry:3',
                    synergies: [{ from: 'trap_mastery', pctPerPt: 4 }]
                },
            ]
        },
    ]
};
