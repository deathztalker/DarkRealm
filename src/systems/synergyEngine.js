/**
 * ★ SYNERGY ENGINE ★
 * Evaluates how much a legendary item's proc is boosted by:
 *   1. Equipped Charm items (legendaryCharms)
 *   2. Invested Talent Tree points (class-specific nodes)
 *
 * Usage:
 *   import { evaluateSynergies } from './synergyEngine.js';
 *   const { mult, bonusEffects, label } = evaluateSynergies(player, weapon.onHit, weapon.id);
 *
 * Returns:
 *   mult         - damage & chance multiplier  (1.0 = no bonus)
 *   chanceBonus  - flat % added to proc chance (0.0 = no bonus)
 *   bonusEffects - array of extra VFX/logic flags activated by synergies
 *   label        - human-readable description for tooltip
 */

// ═══════════════════════════════════════════════════════════════
// SYNERGY TABLE
// Each legendary item has a list of synergy rules.
// Rules fire when the player meets ANY of the conditions listed.
// ═══════════════════════════════════════════════════════════════
export const LEGENDARY_SYNERGIES = {

    // ── THUNDERFURY ──────────────────────────────────────────────
    thunderfury: [
        {
            label: '⚡ Storm Caller (Shaman)',
            condition: (p) => p.classId === 'shaman' && _hasTalent(p, 'storm_caller', 1),
            mult: 1.40, chanceBonus: 0.10,
            bonusEffects: ['extra_bounce'],   // chain hits 2 extra targets
            desc: 'Chain Lightning bounces +2 times and slows 40% longer'
        },
        {
            label: '⚡ Chain Lightning (Shaman)',
            condition: (p) => p.classId === 'shaman' && _hasTalent(p, 'chain_lightning', 1),
            mult: 1.25, chanceBonus: 0.05,
            bonusEffects: [],
            desc: '+25% chain lightning damage, +5% proc chance'
        },
        {
            label: '⚡ Lightning Mastery (Sorceress)',
            condition: (p) => p.classId === 'sorceress' && _hasTalent(p, 'lightning_mastery', 3),
            mult: 1.50, chanceBonus: 0.08,
            bonusEffects: ['paralysis'],   // enemies are stunned briefly
            desc: 'Enemies hit by Chain Lightning are stunned for 1s'
        },
        {
            label: '⚡ Storm Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_storm_heart'),
            mult: 1.30, chanceBonus: 0.05,
            bonusEffects: [],
            desc: '+30% chain lightning damage from Storm Heart Charm'
        },
    ],

    // ── SHADOWMOURNE ─────────────────────────────────────────────
    shadowmourne: [
        {
            label: '💀 Death Commander (Necromancer)',
            condition: (p) => p.classId === 'necromancer' && _hasTalent(p, 'death_commander', 1),
            mult: 1.50,
            chanceBonus: 0,
            bonusEffects: ['spawn_revenant'],  // each soul also spawns a skeleton
            desc: 'Each soul stack spawns a Bone Revenant at 10 stacks'
        },
        {
            label: '💀 Skeleton Mastery (Necromancer)',
            condition: (p) => p.classId === 'necromancer' && _hasTalent(p, 'skeleton_mastery', 3),
            mult: 1.30,
            chanceBonus: 0,
            bonusEffects: [],
            desc: '+30% to Shadow Explosion damage at 10 stacks'
        },
        {
            label: '💀 Shadow Mastery (Warlock)',
            condition: (p) => p.classId === 'warlock' && _hasTalent(p, 'shadow_mastery', 2),
            mult: 1.35, chanceBonus: 0.05,
            bonusEffects: ['soul_drain_aoe'],  // explosion also heals player
            desc: 'Soul explosion heals you for 20% of damage dealt'
        },
        {
            label: '💀 Soul Shard Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_soul_shard'),
            mult: 1.0,
            chanceBonus: 0,
            bonusEffects: ['faster_stacks'],   // max stacks reduced from 10 to 7
            desc: 'Soul Shard: reduces stacks needed to explode from 10 → 7'
        },
    ],

    // ── SULFURAS ──────────────────────────────────────────────────
    sulfuras: [
        {
            label: '🔥 Fire Mastery (Sorceress)',
            condition: (p) => p.classId === 'sorceress' && _hasTalent(p, 'fire_mastery', 3),
            mult: 1.60, chanceBonus: 0.05,
            bonusEffects: ['burn_dot'],  // meteor leaves lingering fire DoT
            desc: 'Meteor leaves burning ground (150 dmg/s for 5s)'
        },
        {
            label: '🔥 Meteor Skill (Sorceress)',
            condition: (p) => p.classId === 'sorceress' && _hasTalent(p, 'meteor', 1),
            mult: 1.40, chanceBonus: 0.08,
            bonusEffects: [],
            desc: 'Meteor proc radius +40% and +8% chance'
        },
        {
            label: '🔥 Inferno (Sorceress)',
            condition: (p) => p.classId === 'sorceress' && _hasTalent(p, 'inferno', 1),
            mult: 1.30, chanceBonus: 0,
            bonusEffects: [],
            desc: '+30% Meteor damage, synergy with Inferno'
        },
        {
            label: '🔥 Ember Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_cinders_heart'),
            mult: 1.35, chanceBonus: 0.10,
            bonusEffects: ['split_meteor'],  // splits into 2 smaller meteors
            desc: 'Cinders Heart: Meteor splits into 2 smaller impacts'
        },
    ],

    // ── VAL'ANYR ──────────────────────────────────────────────────
    valanyr: [
        {
            label: '💛 Divine Protection (Paladin)',
            condition: (p) => p.classId === 'paladin' && _hasTalent(p, 'divine_protection', 1),
            mult: 1.0, chanceBonus: 0.15,
            bonusEffects: ['reflect_dmg'],  // shield reflects 30% of absorbed damage
            desc: '+15% proc chance; shield reflects 30% absorbed damage to attackers'
        },
        {
            label: '💛 Protection Mastery (Paladin)',
            condition: (p) => p.classId === 'paladin' && _hasTalent(p, 'prot_mastery', 3),
            mult: 1.50, chanceBonus: 0.10,
            bonusEffects: [],
            desc: '+50% Divine Shield capacity, +10% proc chance'
        },
        {
            label: '💛 Consecration (Paladin)',
            condition: (p) => p.classId === 'paladin' && _hasTalent(p, 'consecration', 1),
            mult: 1.0, chanceBonus: 0,
            bonusEffects: ['heal_party'],  // shield proc also heals nearby allies
            desc: 'Divine Shield also heals nearby party members for 200 HP'
        },
        {
            label: '💛 Amber Seal Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_amber_seal'),
            mult: 1.25, chanceBonus: 0.05,
            bonusEffects: [],
            desc: 'Amber Seal: +25% shield capacity and +5% proc chance'
        },
    ],

    // ── ATIESH ────────────────────────────────────────────────────
    atiesh: [
        {
            label: '✨ Arcane Surge (Sorceress — Lightning tree)',
            condition: (p) => p.classId === 'sorceress' && _hasTalent(p, 'lightning_mastery', 2),
            mult: 1.45, chanceBonus: 0.08,
            bonusEffects: ['mana_storm'],  // arcane burst also restores 15% mana
            desc: 'Arcane Burst restores 15% of max mana on proc'
        },
        {
            label: '✨ Fire Storm (Sorceress)',
            condition: (p) => p.classId === 'sorceress' && _hasTalent(p, 'fire_storm', 1),
            mult: 1.35, chanceBonus: 0,
            bonusEffects: [],
            desc: '+35% Arcane Burst damage and radius'
        },
        {
            label: '✨ Arcane Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_arcane_focus'),
            mult: 1.40, chanceBonus: 0.12,
            bonusEffects: ['double_burst'],  // triggers a second smaller burst
            desc: 'Arcane Focus: Arcane Burst fires a second smaller explosion'
        },
        {
            label: '✨ Warlock Chaos (Warlock)',
            condition: (p) => p.classId === 'warlock' && _hasTalent(p, 'shadow_mastery', 1),
            mult: 1.20, chanceBonus: 0.05,
            bonusEffects: [],
            desc: '+20% arcane burst damage as shadow damage'
        },
    ],

    // ── FROSTMOURNE ───────────────────────────────────────────────
    frostmourne: [
        {
            label: '❄️ Cold Mastery (Sorceress)',
            condition: (p) => p.classId === 'sorceress' && _hasTalent(p, 'cold_mastery', 3),
            mult: 1.55, chanceBonus: 0.10,
            bonusEffects: ['shatter'],  // frozen enemies shatter for bonus damage on kill
            desc: 'Frozen enemies shatter on kill for 200% damage as AoE'
        },
        {
            label: '❄️ Frozen Orb (Sorceress)',
            condition: (p) => p.classId === 'sorceress' && _hasTalent(p, 'frozen_orb', 1),
            mult: 1.40, chanceBonus: 0.05,
            bonusEffects: [],
            desc: '+40% Soul Rip damage, freeze lasts 1s longer'
        },
        {
            label: '❄️ Frost Rune Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_frost_rune'),
            mult: 1.30, chanceBonus: 0.08,
            bonusEffects: ['mana_drain'],  // also drains mana from frozen targets
            desc: 'Frost Rune: Soul Rip drains 150 mana from target'
        },
    ],

    // ── WARGLAIVE OF AZZINOTH ─────────────────────────────────────
    warglaive_azzinoth: [
        {
            label: '🌀 Death Mark (Rogue)',
            condition: (p) => p.classId === 'rogue' && _hasTalent(p, 'death_mark', 1),
            mult: 1.50, chanceBonus: 0.10,
            bonusEffects: ['mark_amplify'],  // each blade dance hit benefits from death mark
            desc: 'Blade Dance hits apply Death Mark stacks, each +15% damage'
        },
        {
            label: '🌀 Lethality (Rogue)',
            condition: (p) => p.classId === 'rogue' && _hasTalent(p, 'lethality', 2),
            mult: 1.35, chanceBonus: 0.08,
            bonusEffects: [],
            desc: '+35% Blade Dance damage, +1 hit from Lethality synergy'
        },
        {
            label: '🌀 Shadow Dance (Rogue)',
            condition: (p) => p.classId === 'rogue' && _hasTalent(p, 'shadow_dance', 1),
            mult: 1.25, chanceBonus: 0.10,
            bonusEffects: ['stealth_reset'],  // Blade Dance resets vanish CD if kills
            desc: 'Blade Dance: kills reset Vanish cooldown (Shadow Dance)'
        },
        {
            label: '🌀 Shadows Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_shadow_wisp'),
            mult: 1.20, chanceBonus: 0.10,
            bonusEffects: ['extra_hit'],   // +1 blade hit
            desc: 'Shadow Wisp: Blade Dance gains +1 additional strike'
        },
    ],

    // ── THORI'DAL ─────────────────────────────────────────────────
    thoridal: [
        {
            label: '⭐ Ranger — Bow Mastery',
            condition: (p) => p.classId === 'ranger' && _hasTalent(p, 'bow_mastery', 2),
            mult: 1.50, chanceBonus: 0.10,
            bonusEffects: ['crit_arrow'],  // stellar arrow always crits
            desc: "Stellar Arrow always critically strikes (Bow Mastery)"
        },
        {
            label: '⭐ Ranger — Multi-Shot',
            condition: (p) => p.classId === 'ranger' && _hasTalent(p, 'multi_shot', 1),
            mult: 1.30, chanceBonus: 0.05,
            bonusEffects: ['triple_arrow'],  // fires 3 together
            desc: 'Stellar Arrow splits into 3 parallel arrows'
        },
        {
            label: '⭐ Quiver Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_sunfire_quiver'),
            mult: 1.25, chanceBonus: 0.15,
            bonusEffects: [],
            desc: 'Sunfire Quiver: +25% damage and +15% proc chance'
        },
    ],

    // ── CORRUPTED ASHBRINGER ──────────────────────────────────────
    ashbringer: [
        {
            label: '✝️ Consecration (Paladin)',
            condition: (p) => p.classId === 'paladin' && _hasTalent(p, 'consecration', 1),
            mult: 1.50, chanceBonus: 0.12,
            bonusEffects: ['holy_fire'],  // consecration ground deals fire+holy
            desc: 'Consecration also deals Fire damage and lasts 2s longer'
        },
        {
            label: '✝️ Fanaticism (Paladin Auras)',
            condition: (p) => p.classId === 'paladin' && _hasTalent(p, 'fanaticism', 1),
            mult: 1.35, chanceBonus: 0.08,
            bonusEffects: [],
            desc: '+35% Consecration damage from Fanaticism aura synergy'
        },
        {
            label: '✝️ Judgment (Paladin)',
            condition: (p) => p.classId === 'paladin' && _hasTalent(p, 'judgment', 1),
            mult: 1.20, chanceBonus: 0.10,
            bonusEffects: ['judgment_mark'],  // consecration applies judgment debuff
            desc: 'Consecration applies Judgment, boosting all holy damage by 25%'
        },
        {
            label: '✝️ Holy Relic Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_holy_relic'),
            mult: 1.30, chanceBonus: 0.05,
            bonusEffects: ['aoe_expand'],  // radius +50%
            desc: 'Holy Relic: Consecration radius +50%'
        },
    ],

    // ── GLAIVE OF THE FALLEN PRINCE ───────────────────────────────
    glaive_fallen_prince: [
        {
            label: '💀 Necromancer Summoning',
            condition: (p) => p.classId === 'necromancer' && _hasTalent(p, 'army_of_dead', 1),
            mult: 1.60, chanceBonus: 0.05,
            bonusEffects: ['stronger_undead'],  // spawned undead have 2x HP
            desc: 'Summoned shadow warriors have double HP and last 20s'
        },
        {
            label: '💀 Golem Mastery (Necromancer)',
            condition: (p) => p.classId === 'necromancer' && _hasTalent(p, 'golem_mastery', 2),
            mult: 1.30, chanceBonus: 0,
            bonusEffects: [],
            desc: '+30% to summoned warrior damage'
        },
        {
            label: '💀 Death Mark Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_bone_marrow'),
            mult: 1.25, chanceBonus: 0.08,
            bonusEffects: ['lich_form'],  // proc also gives player temp undead form
            desc: 'Bone Marrow: Proc temporarily grants Undead resilience (+50 armor)'
        },
    ],

};

// ═══════════════════════════════════════════════════════════════
// NEW LEGENDARY ITEM SYNERGIES (for new items added below)
// ═══════════════════════════════════════════════════════════════

Object.assign(LEGENDARY_SYNERGIES, {

    // ── DOOMHAMMER ───────────────────────────────────────────────
    doomhammer: [
        {
            label: '⚡ Windfury Totem (Shaman)',
            condition: (p) => p.classId === 'shaman' && _hasTalent(p, 'windfury_totem', 1),
            mult: 1.55, chanceBonus: 0.15,
            bonusEffects: ['windfury_strike'],  // proc triggers a windfury attack burst
            desc: 'Proc triggers Windfury: +2 immediate extra attacks'
        },
        {
            label: '⚡ Totem Mastery (Shaman)',
            condition: (p) => p.classId === 'shaman' && _hasTalent(p, 'totem_mastery', 2),
            mult: 1.35, chanceBonus: 0.10,
            bonusEffects: [],
            desc: '+35% elemental damage, totems enhance Doomhammer strikes'
        },
        {
            label: '⚡ Thunder Talisman Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_thunder_talisman'),
            mult: 1.30, chanceBonus: 0.10,
            bonusEffects: ['chain_overload'],  // lightning proc stuns
            desc: 'Thunder Talisman: Lightning overload stuns for 0.5s'
        },
    ],

    // ── RHOK'DELAR ───────────────────────────────────────────────
    rhokdelar: [
        {
            label: '🏹 Ranger — Hunter\'s Mark',
            condition: (p) => p.classId === 'ranger' && _hasTalent(p, 'hunters_mark', 1),
            mult: 1.50, chanceBonus: 0.12,
            bonusEffects: ['mark_target'],  // proc marks target taking 30% more damage
            desc: "Hunter's Mark: Target takes 30% more damage for 10s"
        },
        {
            label: '🏹 Ranger — Rapid Fire',
            condition: (p) => p.classId === 'ranger' && _hasTalent(p, 'rapid_fire', 1),
            mult: 1.30, chanceBonus: 0.10,
            bonusEffects: [],
            desc: '+30% Nature Arrow damage and +10% proc chance'
        },
        {
            label: '🏹 Druid — Nature Bond',
            condition: (p) => p.classId === 'druid' && _hasTalent(p, 'nature_growth', 1),
            mult: 1.25, chanceBonus: 0.05,
            bonusEffects: ['entangle'],  // nature arrow roots enemy
            desc: 'Nature Arrow roots enemy for 2s (Druid Nature Bond)'
        },
        {
            label: '🏹 Nature Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_ancients_call'),
            mult: 1.40, chanceBonus: 0.08,
            bonusEffects: ['summon_spirit'],  // summons a wolf spirit on proc
            desc: "Ancient's Call: Nature Arrow summons Spirit Wolf for 8s"
        },
    ],

    // ── DRACONIC EDGE ─────────────────────────────────────────────
    draconic_edge: [
        {
            label: '🐉 Warrior — Berserk',
            condition: (p) => p.classId === 'warrior' && _hasTalent(p, 'berserk', 1),
            mult: 1.60, chanceBonus: 0.15,
            bonusEffects: ['berserk_amp'],  // proc doubles when berserk is active
            desc: 'Dragon Breath doubles in damage while Berserk is active'
        },
        {
            label: '🐉 Warrior — Combat Mastery',
            condition: (p) => p.classId === 'warrior' && _hasTalent(p, 'combat_mastery', 3),
            mult: 1.35, chanceBonus: 0.08,
            bonusEffects: [],
            desc: '+35% Dragon Breath damage from Combat Mastery'
        },
        {
            label: '🐉 Dragon Scale Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_dragon_scale'),
            mult: 1.30, chanceBonus: 0.10,
            bonusEffects: ['fire_shield'],  // also grants brief fire immunity
            desc: 'Dragon Scale: Fire immunity for 3s after proc'
        },
    ],

    // ── STAFF OF ETERNAL WINTER ───────────────────────────────────
    staff_eternal_winter: [
        {
            label: '❄️ Absolute Zero (Sorceress)',
            condition: (p) => p.classId === 'sorceress' && _hasTalent(p, 'absolute_zero', 1),
            mult: 1.70, chanceBonus: 0.12,
            bonusEffects: ['deep_freeze'],  // freeze duration 2x
            desc: 'Blizzard Veil freezes for 6s and deals AoE on break'
        },
        {
            label: '❄️ Blizzard (Sorceress)',
            condition: (p) => p.classId === 'sorceress' && _hasTalent(p, 'blizzard', 1),
            mult: 1.45, chanceBonus: 0.08,
            bonusEffects: [],
            desc: '+45% Blizzard Veil damage, Blizzard cast boosts next proc'
        },
        {
            label: '❄️ Glacial Shard Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_glacial_shard'),
            mult: 1.35, chanceBonus: 0.10,
            bonusEffects: ['ice_storm'],  // leaves icy ground after veil
            desc: 'Glacial Shard: Blizzard Veil leaves icy ground that slows 70%'
        },
    ],

    // ── VOIDREAPER ────────────────────────────────────────────────
    voidreaper: [
        {
            label: '🌑 Warlock — Soul Fire',
            condition: (p) => p.classId === 'warlock' && _hasTalent(p, 'soul_fire', 1),
            mult: 1.55, chanceBonus: 0.10,
            bonusEffects: ['soul_ignite'],  // void wounds also apply burning
            desc: 'Void Wound also ignites target for 100 fire DPS (3s)'
        },
        {
            label: '🌑 Warlock — Shadow Mastery',
            condition: (p) => p.classId === 'warlock' && _hasTalent(p, 'shadow_mastery', 3),
            mult: 1.45, chanceBonus: 0.08,
            bonusEffects: [],
            desc: '+45% Void Wound damage from Shadow Mastery'
        },
        {
            label: '🌑 Void Fragment Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_void_fragment'),
            mult: 1.35, chanceBonus: 0.12,
            bonusEffects: ['void_echo'],  // proc repeats once 3s later
            desc: 'Void Fragment: Void Wound echoes again 3 seconds later'
        },
    ],

    // ── BONEREAVER'S EDGE ─────────────────────────────────────────
    bonereaver_edge: [
        {
            label: '💀 Necromancer — Amplify Damage',
            condition: (p) => p.classId === 'necromancer' && _hasTalent(p, 'amplify_damage', 1),
            mult: 1.60, chanceBonus: 0.12,
            bonusEffects: ['armor_shred_stack'],  // stacks unlimited armor shreds
            desc: 'Armor shred stacks infinitely when Amplify Damage is active'
        },
        {
            label: '💀 Necromancer — Iron Maiden',
            condition: (p) => p.classId === 'necromancer' && _hasTalent(p, 'iron_maiden', 1),
            mult: 1.30, chanceBonus: 0.08,
            bonusEffects: ['reflect_amplify'],
            desc: 'Armor shred boosts Iron Maiden reflect damage by 50%'
        },
        {
            label: '💀 Bone Dust Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_bone_dust'),
            mult: 1.25, chanceBonus: 0.10,
            bonusEffects: ['dust_cloud'],
            desc: 'Bone Dust: Armor Shatter releases blinding dust cloud (3s blind)'
        },
    ],

    // ══════════════════════════════════════════════════════════════
    // ★★★ WAVE 3 SYNERGIES ★★★
    // ══════════════════════════════════════════════════════════════

    // ── STORMRAGE VESTMENTS ───────────────────────────────────────
    stormrage_vestments: [
        {
            label: '🌪️ Druid — Hurricane',
            condition: (p) => p.classId === 'druid' && _hasTalent(p, 'hurricane', 1),
            mult: 1.65, chanceBonus: 0.15,
            bonusEffects: ['nature_cyclone', 'aoe_expand'],
            desc: 'Nature Burst spawns a cyclone that pulls enemies inward (+50% AoE)'
        },
        {
            label: '🌪️ Druid — Shapeshifting',
            condition: (p) => p.classId === 'druid' && _hasTalent(p, 'dire_wolf', 1),
            mult: 1.40, chanceBonus: 0.08,
            bonusEffects: ['heal_on_proc'],
            desc: 'Nature Burst also heals you for 80 HP while shapeshifted'
        },
        {
            label: '🌱 Druid — Nature Mastery (10pts)',
            condition: (p) => p.classId === 'druid' && _hasTalent(p, 'nature_mastery', 10),
            mult: 1.30, chanceBonus: 0.05,
            bonusEffects: ['entangle'],
            desc: 'Nature Mastery: proc has 25% chance to root enemy for 2s'
        },
        {
            label: '🌱 Nature Seed Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_nature_seed'),
            mult: 1.35, chanceBonus: 0.10,
            bonusEffects: ['rejuvenate'],
            desc: 'Nature Seed: Also regenerates 25 HP/s for 5s after proc'
        },
    ],

    // ── WRATH OF THE LICH KING ────────────────────────────────────
    wrath_lich_king: [
        {
            label: '🦴 Necromancer — Plague',
            condition: (p) => p.classId === 'necromancer' && _hasTalent(p, 'plague', 1),
            mult: 1.70, chanceBonus: 0.10,
            bonusEffects: ['plague_nova', 'spawn_revenant'],
            desc: 'Each explosion spreads plague nova to all nearby enemies and spawns a skeleton'
        },
        {
            label: '🦴 Necromancer — Mass Curse',
            condition: (p) => p.classId === 'necromancer' && _hasTalent(p, 'mass_curse', 1),
            mult: 1.50, chanceBonus: 0.08,
            bonusEffects: ['curse_on_explode'],
            desc: 'Soul explosion curses all hit enemies, reducing their damage by 30%'
        },
        {
            label: '🦴 Plague Dust Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_plague_dust_2'),
            mult: 1.40, chanceBonus: 0.12,
            bonusEffects: ['faster_stacks', 'soul_drain_aoe'],
            desc: 'Plague Dust: Reduces stacks needed by 2, explosion heals 20% damage dealt'
        },
    ],

    // ── CENARION CUDGEL ───────────────────────────────────────────
    cenarion_cudgel: [
        {
            label: '💚 Druid — Healing Touch',
            condition: (p) => p.classId === 'druid' && _hasTalent(p, 'healing_touch', 1),
            mult: 1.50, chanceBonus: 0.15,
            bonusEffects: ['heal_party', 'aoe_expand'],
            desc: 'Consecration heals nearby allies for 150 HP and radius +50%'
        },
        {
            label: '💚 Druid — Rejuvenation',
            condition: (p) => p.classId === 'druid' && _hasTalent(p, 'rejuvenation', 1),
            mult: 1.30, chanceBonus: 0.10,
            bonusEffects: ['rejuvenate'],
            desc: 'Each proc applies 10 HP/s regeneration for 8s'
        },
        {
            label: '💚 Paladin — Holy Light',
            condition: (p) => p.classId === 'paladin' && _hasTalent(p, 'holy_light', 1),
            mult: 1.45, chanceBonus: 0.10,
            bonusEffects: ['holy_fire'],
            desc: 'Consecration gains Holy Fire bonus (+40% fire DoT on hits)'
        },
        {
            label: '🌱 Nature Seed Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_nature_seed'),
            mult: 1.35, chanceBonus: 0.08,
            bonusEffects: ['liferegen_burst'],
            desc: 'Nature Seed: Proc also grants +50 HP/s regeneration for 5s'
        },
    ],

    // ── STAFF OF JORDAN ───────────────────────────────────────────
    staff_of_jordan: [
        {
            label: '🔵 Sorceress — Energy Shield',
            condition: (p) => p.classId === 'sorceress' && _hasTalent(p, 'energy_shield', 1),
            mult: 1.60, chanceBonus: 0.12,
            bonusEffects: ['mana_storm', 'double_burst'],
            desc: 'Mana Flood also fires a second burst and restores 15% max mana'
        },
        {
            label: '🔵 Sorceress — Mana Shield',
            condition: (p) => p.classId === 'sorceress' && _hasTalent(p, 'mana_shield', 1),
            mult: 1.40, chanceBonus: 0.08,
            bonusEffects: ['mana_storm'],
            desc: 'Mana Burn AoE restores 20% of burned mana back to you'
        },
        {
            label: '🔵 Arcane Crystal Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_arcane_crystal'),
            mult: 1.45, chanceBonus: 0.15,
            bonusEffects: ['double_burst', 'aoe_expand'],
            desc: 'Arcane Crystal: Mana Flood radius +50% and fires a second wave'
        },
    ],

    // ── THE UNSTOPPABLE FORCE ─────────────────────────────────────
    unstoppable_force: [
        {
            label: '⚔️ Warrior — Berserk',
            condition: (p) => p.classId === 'warrior' && _hasTalent(p, 'berserk', 1),
            mult: 1.75, chanceBonus: 0.12,
            bonusEffects: ['berserk_amp', 'aoe_expand'],
            desc: 'Ground Pound radius doubles and damage +75% while Berserk active'
        },
        {
            label: '⚔️ Warrior — Leap Attack',
            condition: (p) => p.classId === 'warrior' && _hasTalent(p, 'leap_attack', 1),
            mult: 1.45, chanceBonus: 0.10,
            bonusEffects: ['knockback'],
            desc: 'Ground Pound launches all hit enemies into the air (2s knockup)'
        },
        {
            label: '⚔️ Warrior — Whirlwind',
            condition: (p) => p.classId === 'warrior' && _hasTalent(p, 'whirlwind', 1),
            mult: 1.30, chanceBonus: 0.08,
            bonusEffects: [],
            desc: '+30% crushing damage; Whirlwind procs extend Ground Pound stun'
        },
        {
            label: '🛡️ Iron Will Token Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_iron_will'),
            mult: 1.35, chanceBonus: 0.08,
            bonusEffects: ['reflect_dmg'],
            desc: 'Iron Will: Ground Pound also reflects 30% of damage taken during cast'
        },
    ],

    // ── CRYPTFIEND'S BITE ─────────────────────────────────────────
    cryptfiends_bite: [
        {
            label: '🕷️ Rogue — Death Sentry',
            condition: (p) => p.classId === 'rogue' && _hasTalent(p, 'death_sentry', 1),
            mult: 1.65, chanceBonus: 0.12,
            bonusEffects: ['web_ensnare', 'chain_reaction'],
            desc: 'Web trap also triggers a Death Sentry explosion on rooted enemies'
        },
        {
            label: '🕷️ Rogue — Venom',
            condition: (p) => p.classId === 'rogue' && _hasTalent(p, 'venom', 3),
            mult: 1.45, chanceBonus: 0.10,
            bonusEffects: ['soul_chain'],
            desc: 'Venom: web-trapped enemies take +50% poison damage'
        },
        {
            label: '🕷️ Rogue — Shadow Dance',
            condition: (p) => p.classId === 'rogue' && _hasTalent(p, 'shadow_dance', 1),
            mult: 1.30, chanceBonus: 0.08,
            bonusEffects: ['stealth_reset'],
            desc: 'Shadow Dance: killing a Webbed enemy resets Vanish cooldown'
        },
        {
            label: '🕸️ Spider Silk Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_spider_silk'),
            mult: 1.40, chanceBonus: 0.12,
            bonusEffects: ['extra_hit', 'web_ensnare'],
            desc: 'Spider Silk: +1 Blade Dance hit, all hits have 30% chance to Web'
        },
    ],

    // ── JIN'DO'S HEXXER ───────────────────────────────────────────
    jindos_hexxer: [
        {
            label: '🥁 Shaman — Totemic Wrath',
            condition: (p) => p.classId === 'shaman' && _hasTalent(p, 'totemic_wrath', 1),
            mult: 1.60, chanceBonus: 0.12,
            bonusEffects: ['extra_bounce', 'chain_overload'],
            desc: 'Totemic Wrath: Hex spreads via Chain Lightning (+2 targets, stuns)'
        },
        {
            label: '🥁 Shaman — Earthbind Totem',
            condition: (p) => p.classId === 'shaman' && _hasTalent(p, 'earthbind_totem', 1),
            mult: 1.40, chanceBonus: 0.10,
            bonusEffects: ['paralysis'],
            desc: 'Hexed enemies are also rooted for 2s by Earthbind synergy'
        },
        {
            label: '🥁 Shaman — Totem Mastery (5pts)',
            condition: (p) => p.classId === 'shaman' && _hasTalent(p, 'totem_mastery', 5),
            mult: 1.35, chanceBonus: 0.08,
            bonusEffects: [],
            desc: '+35% Hex/Chain Lightning damage from Totem Mastery'
        },
        {
            label: '🥁 Thunder Drum Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_thunder_drum'),
            mult: 1.45, chanceBonus: 0.10,
            bonusEffects: ['chain_overload', 'extra_bounce'],
            desc: 'Thunder Drum: Chain Lightning stuns all targets and bounces +2 times'
        },
    ],

    // ── AZURESONG MAGEBLADE ───────────────────────────────────────
    azuresong_mageblade: [
        {
            label: '💎 Sorceress — Arcane Torrent',
            condition: (p) => p.classId === 'sorceress' && _hasTalent(p, 'arcane_torrent', 1),
            mult: 1.65, chanceBonus: 0.12,
            bonusEffects: ['mana_storm', 'double_burst', 'aoe_expand'],
            desc: 'Mana Surge fires twice and restores 15% mana; AoE radius +50%'
        },
        {
            label: '💎 Sorceress — Mana Shield',
            condition: (p) => p.classId === 'sorceress' && _hasTalent(p, 'mana_shield', 1),
            mult: 1.45, chanceBonus: 0.08,
            bonusEffects: ['mana_storm'],
            desc: 'Each proc restores 60 mana and boosts next spell damage +20%'
        },
        {
            label: '💎 Warlock — Mana Feed',
            condition: (p) => p.classId === 'warlock' && _hasTalent(p, 'mana_feed', 1),
            mult: 1.35, chanceBonus: 0.10,
            bonusEffects: ['void_echo'],
            desc: 'Mana Surge echoes 3s later as a shadow burst'
        },
        {
            label: '💠 Arcane Crystal Charm equipped',
            condition: (p) => _hasCharm(p, 'charm_arcane_crystal'),
            mult: 1.50, chanceBonus: 0.15,
            bonusEffects: ['double_burst', 'mana_storm'],
            desc: 'Arcane Crystal: Double burst + mana restore combo on every proc'
        },
    ],

});


// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT: evaluateSynergies
// ═══════════════════════════════════════════════════════════════

/**
 * Evaluates all active synergies for a legendary item.
 * @param {object} player     - player entity (has classId, talentTree, inventory)
 * @param {object} onHit      - the item's onHit definition
 * @param {string} itemId     - the legendary item ID (e.g. 'thunderfury')
 * @returns {{ mult, chanceBonus, bonusEffects, labels }}
 */
export function evaluateSynergies(player, onHit, itemId) {
    if (!player || !onHit || !itemId) {
        return { mult: 1.0, chanceBonus: 0, bonusEffects: [], labels: [] };
    }

    const rules = LEGENDARY_SYNERGIES[itemId] || [];
    let mult = 1.0;
    let chanceBonus = 0;
    const bonusEffects = [];
    const labels = [];

    for (const rule of rules) {
        try {
            if (rule.condition(player)) {
                mult *= rule.mult;
                chanceBonus += (rule.chanceBonus || 0);
                if (rule.bonusEffects) bonusEffects.push(...rule.bonusEffects);
                labels.push({ label: rule.label, desc: rule.desc });
            }
        } catch (_) { /* condition may reference missing props */ }
    }

    // Cap multiplier at 3.5× and chance bonus at +50%
    mult = Math.min(3.5, mult);
    chanceBonus = Math.min(0.50, chanceBonus);

    return { mult, chanceBonus, bonusEffects, labels };
}

/**
 * Returns tooltip HTML lines for synergies (for itemTooltipText).
 */
export function getSynergyTooltipHtml(player, itemId, legendaryColor) {
    if (!player || !itemId) return '';
    const rules = LEGENDARY_SYNERGIES[itemId] || [];
    if (!rules.length) return '';

    const color = legendaryColor || '#ffd700';
    let html = `<div style="border-top:1px solid ${color}33; margin-top:8px; padding-top:6px;">`;
    html += `<div style="color:${color}; font-size:10px; font-weight:bold; margin-bottom:4px;">★ SYNERGIES</div>`;

    for (const rule of rules) {
        let active = false;
        try { active = rule.condition(player); } catch(_) {}
        const ruleColor = active ? color : '#555';
        const activeLabel = active ? '✔' : '○';
        html += `<div style="color:${ruleColor}; font-size:9px; margin:1px 0;">${activeLabel} ${rule.label}</div>`;
        if (active) {
            html += `<div style="color:#aaa; font-size:9px; padding-left:12px; font-style:italic;">${rule.desc}</div>`;
        }
    }
    html += '</div>';
    return html;
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════

/** Returns true if player has invested ≥ minPoints in the given talent */
function _hasTalent(player, talentId, minPoints = 1) {
    if (!player) return false;
    // talentTree may be a TalentTree instance with .points, or a plain object
    const pts = player.talentTree?.points || player.talents || {};
    return (pts[talentId] || 0) >= minPoints;
}

/** Returns true if player has a specific charm in their inventory or charm slots */
function _hasCharm(player, charmId) {
    if (!player) return false;
    // Check charm slots first (dedicated charm bag)
    if (player.charmSlots && player.charmSlots.some(c => c && c.id === charmId)) return true;
    // Fall back to full inventory scan
    if (player.inventory && player.inventory.some(i => i && i.id === charmId)) return true;
    return false;
}
