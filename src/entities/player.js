/**
 * Player Entity — stats, movement, leveling, item bonuses, skill use
 */
import { bus } from '../engine/EventBus.js';
import { Pathfinder } from '../world/pathfinding.js';
import { TalentTree } from '../systems/talentTree.js';
import { getClass, getSkillMap } from '../data/classes.js';
import { calcDamage, applyDamage, applyDot, skillDamage, skillType, DMG_TYPE } from '../systems/combat.js';
import { SETS } from '../systems/lootSystem.js';
import { RARITY, SLOT } from '../data/items.js';
import { Projectile, AoEZone } from './projectile.js';
import { fx } from '../engine/ParticleSystem.js';
import { SkillLogic } from '../systems/skillLogic.js';

const XP_TABLE = Array.from({ length: 100 }, (_, i) => Math.round(80 * Math.pow(1.18, i)));
const MOVE_SPEED_BASE = 100; // px/s in world space

export class Player {
    constructor(classId) {
        this.isPlayer = true;
        const cls = getClass(classId);
        this.classId = classId;
        this.className = cls.name;
        this.icon = cls.icon;
        this.facingDir = 'down';
        this.animState = 'idle';
        this.stateTimer = 0;

        // Position
        this.x = 0; this.y = 0;
        this.radius = 6;

        // Base stats
        this.level = 1;
        this.xp = 0;
        
        // Paragon System
        this.paragonLevel = 0;
        this.paragonXp = 0;
        this.paragonPoints = 0;
        this.paragonStats = {
            core: { str: 0, dex: 0, int: 0, vit: 0 },
            offense: { ias: 0, crit: 0 },
            defense: { armor: 0, res: 0 },
            utility: { mf: 0, gf: 0 }
        };

        this.statPoints = 0;
        this.gold = 0;
        this.totalMonstersSlain = 0;
        this._lastPortalEntry = 0; // Prevent portal loops
        this.totalGoldCollected = 0;
        this.charName = cls.name;
        this.baseStr = cls.stats.str;
        this.baseDex = cls.stats.dex;
        this.baseVit = cls.stats.vit;
        this.baseInt = cls.stats.int;

        this._dots = [];
        this.hitFlashTimer = 0;
        this.lastAttacker = null;

        this._statsDirty = true;
        this.talents = new TalentTree(classId);

        this.equipment = {}; 
        this.secondaryEquipment = { mainhand: null, offhand: null };
        this.activeWeaponSet = 1;
        this.inventory = Array(40).fill(null);
        this.belt = Array(4).fill(null);

        this.hotbar = [null, null, null, null, null];
        this.cooldowns = [0, 0, 0, 0, 0];
        this.minions = [];
        this.maxMinions = 10; // increased for late game summoning builds
        this.comboPoints = 0;
        this.maxComboPoints = 5;

        this.path = [];
        this.pathfinder = new Pathfinder();
        this.moveSpeed = MOVE_SPEED_BASE;
        this.attackTarget = null;
        this.attackCd = 0;
        this.pushX = 0; this.pushY = 0;

        this._dots = [];
        this._buffs = [];
        this.hpBuffer = 0;
        this.mpBuffer = 0;

        this.activeAuras = new Map();

        this.permanentResists = 0;
        this.hasLarzukReward = false;
        this.hasAnyaReward = false;

        this.skillMap = getSkillMap(classId);

        bus.on('input:click', d => this._onClick(d));
        bus.on('player:applyAuraSlow', d => {
            if (this.hp <= 0) return;
            this._auraSlow = d.factor;
            this._auraSlowTimer = d.duration;
        });

        this._recalcStats();
        this.hp = this.maxHp;
        this.mp = this.maxMp;

        bus.on('player:gainXp', d => this.gainXp(d.amount));
    }

    invalidateStats() {
        this._statsDirty = true;
        this._recalcStats();
    }

    get activeStatuses() {
        return new Set((this._statuses || []).map(s => s.type));
    }

    _recalcStats() {
        if (!this._statsDirty) return;
        this._statsDirty = false;

        const s = this._gearStats();
        const ts = this._talentStats();
        for (const k in ts) s[k] = (s[k] || 0) + ts[k];

        // Ensure pctDmg is initialized
        this.pctDmg = s.pctDmg || 0;

        // Reset On-Hit imbuements
        this.poisonDmgPerSec = s.poisonDmgPerSec || 0;
        this.holyDmgOnHit = 0;
        this.fireDmgOnHit = 0;

        for (const b of this._buffs) {
            if (b.id === 'battle_orders') { s.flatHP = (s.flatHP||0) + b.base*5; s.flatMP = (s.flatMP||0) + b.base*2; }
            if (b.id === 'shout') s.pctArmor = (s.pctArmor||0) + b.base;
            if (b.id === 'fortify') s.flatArmor = (s.flatArmor||0) + b.base * 15;
            if (b.id === 'burst_of_speed') { s.pctMoveSpeed = (s.pctMoveSpeed||0) + b.base; s.pctIAS = (s.pctIAS||0) + b.base*2; }
            if (b.id === 'holy_shield' || b.id === 'divine_shield') { s.blockChance = (s.blockChance||0) + b.base/2; s.pctArmor = (s.pctArmor||0) + b.base; }
            
            if (b.id === 'avenging_wrath' || b.id === 'king_of_the_jungle' || b.id === 'death_commander') {
                s.pctDmg = (s.pctDmg || 0) + 50;
                s.pctIAS = (s.pctIAS || 0) + 30;
            }
            if (b.id === 'bloodlust') {
                s.pctIAS = (s.pctIAS || 0) + 70;
            }
            if (b.id === 'arcane_power') {
                s.pctDmg = (s.pctDmg || 0) + 50;
            }
            if (b.id === 'blood_rage') {
                s.pctDmg = (s.pctDmg || 0) + 40;
            }
            if (b.id === 'titanic_might') {
                s.pctStr = (s.pctStr || 0) + 20;
                s.pctArmor = (s.pctArmor || 0) + 10;
            }
            if (b.id === 'berserk') {
                s.pctIAS = (s.pctIAS || 0) + 40;
                s.pctDmg = (s.pctDmg || 0) + 80;
                s.pctArmor = (s.pctArmor || 0) - 25;
            }
            
            // Imbuement checks
            if (b.id === 'seal_of_command' || b.id === 'seal_of_righteousness') {
                s.pctHolyDmg = (s.pctHolyDmg || 0) + 20;
                this.holyDmgOnHit = (this.holyDmgOnHit || 0) + b.base;
            }
            if (b.id === 'poison_blade') {
                s.pctPoisonDmg = (s.pctPoisonDmg || 0) + 20;
                this.poisonDmgPerSec = (this.poisonDmgPerSec || 0) + b.base;
            }
            if (b.id === 'enchant') {
                s.pctFireDmg = (s.pctFireDmg || 0) + 20;
                this.fireDmgOnHit = (this.fireDmgOnHit || 0) + b.base;
            }
            
            if (b.id === 'shrine_armor') s.pctArmor = (s.pctArmor||0) + b.value;
            if (b.id === 'shrine_damage') s.pctDmg = (s.pctDmg||0) + b.value;
            if (b.id === 'shrine_mana') s.manaRegenPerSec = (s.manaRegenPerSec||0) + (this.maxMp * (b.value / 100));
            if (b.id === 'shrine_resist') s.allRes = (s.allRes||0) + b.value;
            if (b.id === 'shrine_speed') s.pctMoveSpeed = (s.pctMoveSpeed||0) + b.value;
        }

        const ps = this._paragonStats();
        
        this.str = Math.round((this.baseStr + (s.str || 0) + (s.flatSTR || 0) + (ps.flatSTR || 0)) * (1 + (s.pctStr || 0) / 100));
        this.dex = Math.round((this.baseDex + (s.dex || 0) + (s.flatDEX || 0) + (ps.flatDEX || 0)) * (1 + (s.pctDex || 0) / 100));
        this.vit = Math.round((this.baseVit + (s.vit || 0) + (s.flatVIT || 0) + (ps.flatVIT || 0)) * (1 + (s.pctVit || 0) / 100));
        this.int = Math.round((this.baseInt + (s.int || 0) + (s.flatINT || 0) + (ps.flatINT || 0)) * (1 + (s.pctInt || 0) / 100));

        for (const k in ps) { if (!k.startsWith('flat')) s[k] = (s[k] || 0) + ps[k]; }

        this.maxHp = Math.round((50 + this.vit * 8 + this.level * 5 + (s.flatHP || 0)) * (1 + (s.pctHP || 0) / 100));
        this.maxMp = Math.round((30 + this.int * 5 + this.level * 3 + (s.flatMP || 0)) * (1 + (s.pctMP || 0) / 100));
        this.armor = (s.flatArmor || 0) * (1 + (s.pctArmor || 0) / 100);

        this.critChance = 5 + (s.critChance || 0);
        this.critMulti = 150 + (s.critMulti || 0);
        this.lifeStealPct = s.lifeStealPct || 0;
        this.manaStealPct = s.manaStealPct || 0;
        this.moveSpeed = MOVE_SPEED_BASE * (1 + (s.pctMoveSpeed || 0) / 100);

        this._auraSlowFactor = 1.0;
        if (this._auraSlowTimer > 0) {
            this._auraSlowFactor = (1 - (this._auraSlow || 0));
            this.moveSpeed *= this._auraSlowFactor;
        }

        this.pctDmgReduce = s.pctDmgReduce || 0;
        this.flatDmgReduce = s.flatDmgReduce || 0;
        this.magicDmgReduce = s.magicDmgReduce || 0;
        this.thorns = s.thorns || 0;
        this.lifeRegenPerSec = s.lifeRegenPerSec || 0;
        this.manaRegenPerSec = s.manaRegenPerSec || 0;

        // --- Aura Stacking & Item Aura Scanning ---
        this.itemAuras = new Map();
        for (const item of Object.values(this.equipment)) {
            if (!item) continue;
            
            const lowName = (item.name || "").toLowerCase();
            if (item.id === 'ashbringer' || lowName.includes('ashbringer')) this.itemAuras.set('ashbringer', 10);
            if (item.id === 'frostmourne' || lowName.includes('frostmourne')) this.itemAuras.set('frostmourne', 10);
            if (item.id === 'shadowmourne' || lowName.includes('shadowmourne')) this.itemAuras.set('shadowmourne', 10);

            if (item.mods) {
                for (const mod of item.mods) {
                    if (mod.stat.endsWith('Aura')) {
                        const auraId = mod.stat.replace('Aura', '').toLowerCase();
                        this.itemAuras.set(auraId, (this.itemAuras.get(auraId) || 0) + mod.value);
                    }
                }
            }
        }

        // --- Resonance Check (Trinity of Blades) ---
        this._lichKingResonance = this.itemAuras.has('frostmourne') && this.itemAuras.has('shadowmourne');
        this._twilightResonance = this.itemAuras.has('ashbringer') && this.itemAuras.has('shadowmourne');

        // Apply Passive Synergies to Auras
        const auraMastery = this.effectiveSkillLevel('aura_mastery') || 0;
        const auraScale = 1 + (auraMastery * 0.05); // 5% more effective per level

        if (this.activeAura || this.itemAuras.size > 0) {
            // Combine all auras
            const allAuras = new Map(this.itemAuras);
            if (this.activeAura) {
                const slvl = this._auraSlvl || 1;
                allAuras.set(this.activeAura, (allAuras.get(this.activeAura) || 0) + slvl);
            }

            // --- MMO Party Auras ---
            this.partyAuras = [];
            if (typeof window !== 'undefined' && window.network && window.network.isConnected) {
                const AURA_RANGE_SQ = 600 * 600; // Increased range for party auras (600px radius)
                window.network.otherPlayers.forEach(op => {
                    if (op.activeAura && op.hp > 0 && op.state !== 'dead') {
                        const dSq = (op.x - this.x) ** 2 + (op.y - this.y) ** 2;
                        if (dSq < AURA_RANGE_SQ) {
                            const partySlvl = Math.max(1, Math.floor((op.level || 1) / 4));
                            allAuras.set(op.activeAura, Math.max((allAuras.get(op.activeAura) || 0), partySlvl));
                            this.partyAuras.push({ id: op.activeAura, level: partySlvl, source: op.charName || 'Party' });
                        }
                    }
                });
            }

            for (const [auraId, level] of allAuras) {
                const scaledLvl = level * auraScale;
                switch(auraId) {
                    case 'might': case 'might_aura': 
                        s.pctDmg = (s.pctDmg || 0) + (20 + scaledLvl * 2.5);
                        s.crushingBlow = (s.crushingBlow || 0) + (Math.floor(scaledLvl / 3));
                        break;
                    case 'fanaticism':
                        s.pctIAS = (s.pctIAS || 0) + (30 + scaledLvl * 2);
                        s.pctDmg = (s.pctDmg || 0) + (30 + scaledLvl * 2.5);
                        s.deadlyStrike = (s.deadlyStrike || 0) + (Math.floor(scaledLvl / 2.5));
                        break;
                    case 'conviction':
                        this._hasConviction = true;
                        this._convictionLvl = scaledLvl;
                        break;
                    case 'meditation':
                        s.manaRegenPerSec = (s.manaRegenPerSec || 0) + (this.maxMp * (0.05 + scaledLvl * 0.02));
                        break;
                    case 'holy_fire':
                        s.pctFireDmg = (s.pctFireDmg || 0) + (scaledLvl * 3);
                        this._holyFireLvl = scaledLvl;
                        break;
                    case 'ashbringer':
                        s.pctHolyDmg = (s.pctHolyDmg || 0) + 100;
                        s.allSkills = (s.allSkills || 0) + 2;
                        break;
                    case 'frostmourne':
                        this._hasDrainAura = true;
                        this._drainType = 'cold';
                        this._drainLvl = scaledLvl;
                        s.lifeStealPct = (s.lifeStealPct || 0) + 10;
                        break;
                    case 'shadowmourne':
                        this._hasDrainAura = true;
                        this._drainType = 'shadow';
                        this._drainLvl = scaledLvl;
                        s.lifeStealPct = (s.lifeStealPct || 0) + 10;
                        s.pctDmg = (s.pctDmg || 0) + 50;
                        break;
                }
            }
        }

        // --- Synergy Scaling for Special Auras ---
        if (this._hasDrainAura) {
            const mastery = (this._drainType === 'shadow') ? (this.effectiveSkillLevel('shadow_mastery') || 0) : (this.effectiveSkillLevel('cold_mastery') || 0);
            this._drainMult = 1 + (mastery * 0.10) + (this.int / 200);
        }

        const diff = typeof window !== 'undefined' && window._difficulty ? window._difficulty : 0;
        const resPenalty = diff === 2 ? 100 : (diff === 1 ? 40 : 0);
        const permRes = this.permanentResists || 0;
        for (const r of ['fireRes', 'coldRes', 'lightRes', 'poisRes', 'shadowRes']) {
            this[r] = Math.max(-100, Math.min(75, (s[r] || 0) + (s.allRes || 0) + permRes - resPenalty));
        }

        this.pctDmg = s.pctDmg || 0;
        for (const t of ['Fire', 'Cold', 'Light', 'Poison', 'Shadow', 'Holy']) {
            this[`pct${t}Dmg`] = s[`pct${t}Dmg`] || 0;
        }
        this.flatMinDmg = s.flatMinDmg || 0;
        this.pctIAS = s.pctIAS || 0;

        // Minion Stat storage for _spawnMinion
        this.minionDmgPct = s.minionDmgPct || 0;
        this.minionHpPct = s.minionHpPct || 0;
        this.minionRegenPct = s.minionRegenPct || 0;
        this.minionResistPct = s.minionResistPct || 0;

        let diffMF = 0;
        if (diff === 1) diffMF = 30;
        else if (diff === 2) diffMF = 100;
        this.magicFind = (s.magicFind || 0) + diffMF;
        this.goldFind = (s.goldFind || 0) + diffMF;

        const wep = (this.equipment && this.equipment.mainhand);
        
        // 1. Calculate Base Weapon Damage (Local ED applied here)
        let weaponMin = wep ? (wep.minDmg || 1) : 1;
        let weaponMax = wep ? (wep.maxDmg || 3) : 3;

        // Apply Local Weapon ED (pctDmg on the weapon itself)
        if (wep && wep.mods) {
            const localED = wep.mods.reduce((acc, mod) => mod.stat === 'pctDmg' ? acc + mod.value : acc, 0);
            if (localED > 0) {
                weaponMin = Math.floor(weaponMin * (1 + localED / 100));
                weaponMax = Math.floor(weaponMax * (1 + localED / 100));
            }
        }

        // 2. Base Damage = Modified Weapon Damage + Flat Damage from gear/charms
        const baseMin = weaponMin + (s.flatMinDmg || 0);
        const baseMax = weaponMax + (s.flatMaxDmg || 0);
        
        // 3. Stat Bonus (1% per point): Str for most, Dex for Bows/Javelins
        const statBonusPct = (wep?.type === 'bow' || wep?.type === 'javelin') ? this.dex : this.str;
        
        // 4. Global ED (Skills, Auras, Off-weapon gear like Fortitude/Jewels in armor)
        // Note: s.pctDmg now contains ONLY non-weapon ED because we'll handle weapon ED locally
        const globalED = (s.pctDmg || 0);
        
        const totalMultiplier = 1 + (statBonusPct + globalED) / 100;
        
        let finalMin = Math.round(baseMin * totalMultiplier);
        let finalMax = Math.round(baseMax * totalMultiplier);

        // --- Trinity Resonance Final Multipliers ---
        if (this._lichKingResonance) {
            finalMin = Math.round(finalMin * 2.5);
            finalMax = Math.round(finalMax * 2.5);
            this.lifeStealPct = (this.lifeStealPct || 0) + 20;
        }
        if (this._twilightResonance) {
            finalMin = Math.round(finalMin * 2.0);
            finalMax = Math.round(finalMax * 2.0);
            this.allRes = (this.allRes || 0) + 50;
            this.pctFireDmg = (this.pctFireDmg || 0) + 100;
            this.pctColdDmg = (this.pctColdDmg || 0) + 100;
            this.pctLightningDmg = (this.pctLightningDmg || 0) + 100;
        }

        this.wepMin = finalMin;
        this.wepMax = finalMax;
        
        let baseAtkSpd = (wep?.atkSpd || 1.0) * (1 + (this.pctIAS || 0) / 100);
        this.atkSpd = baseAtkSpd * (this._auraSlowFactor < 1 ? (1 - (1 - this._auraSlowFactor) * 0.5) : 1);
        this.attackRange = wep && wep.range ? Math.max(30, wep.range) : 30;
        this.attackRange += (s.attackRangeBonus || 0);

        const radianceLvl = this.effectiveSkillLevel('radiance');
        this.lightRadius = (s.lightRadius || 0) + (radianceLvl * 15);
        this.cannotBeFrozen = !!s.cannotBeFrozen;
        this.manaAfterKill = s.manaAfterKill || 0;
        this.lifeAfterKill = s.lifeAfterKill || 0;
        this.crushingBlow = s.crushingBlow || 0;
        this.deadlyStrike = s.deadlyStrike || 0;
        this.openWounds = s.openWounds || 0;

        // Custom passives flags
        this.canDualWield2H = !!ts.canDualWield2H;
        this.dotCritChance = !!ts.dotCritChance;
        this.critBleed = !!ts.critBleed;
        this.cheatDeath = !!ts.cheatDeath;
        this.maxCurses = ts.maxCurses || 1;
    }

    _riftStats() {
        const rl = window.riftLevel || 1;
        if (rl <= 1) return {};
        // Infinite Perk Scaling: +3% Dmg, +2% Armor, +1.5% HP, +10% MF per Rift level beyond 1
        return {
            pctDmg: (rl - 1) * 3,
            pctArmor: (rl - 1) * 2,
            pctHP: (rl - 1) * 1.5,
            magicFind: (rl - 1) * 10
        };
    }

    _gearStats() {
        const s = {};
        const equip = this.equipment || {};
        const setCounts = {};
        for (const item of Object.values(equip)) {
            if (!item || item.identified === false) continue;
            if (item.maxDurability > 0 && item.durability === 0) continue;
            this._addItemStats(item, s);
            if (item.rarity === RARITY.SET && item.setId) {
                setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
            }
        }
        for (const [setId, count] of Object.entries(setCounts)) {
            const def = SETS[setId];
            if (def && def.bonuses && count >= 2) {
                for (let tier = 2; tier <= count; tier++) {
                    const mods = def.bonuses[tier];
                    if (mods) {
                        for (const mod of mods) {
                            if (mod.stat.startsWith('+') && !['+allSkills', '+classSkills', '+skill', '+skillGroup'].some(p => mod.stat.startsWith(p))) {
                                s[mod.stat] = (s[mod.stat] || 0) + mod.value;
                            } else if (!mod.stat.startsWith('+')) {
                                s[mod.stat] = (s[mod.stat] || 0) + mod.value;
                            }
                        }
                    }
                }
            }
        }
        if (this.inventory && Array.isArray(this.inventory)) {
            const activeUniques = new Set();
            for (const item of this.inventory) {
                if (item && item.type === 'charm' && item.identified !== false) {
                    if (item.rarity === RARITY.UNIQUE || item.rarity === 'unique') {
                        if (activeUniques.has(item.id)) continue;
                        activeUniques.add(item.id);
                    }
                    this._addItemStats(item, s);
                }
            }
        }
        return s;
    }

    _talentStats() {
        const ts = {};
        if (!this.talents || !this.talents.points) return ts;
        for (const [skillId, pts] of Object.entries(this.talents.points)) {
            if (pts <= 0) continue;
            const slvl = pts;

            // WARRIOR
            if (skillId === 'combat_mastery') {
                ts.pctDmg = (ts.pctDmg||0) + 5*slvl;
                ts.critChance = (ts.critChance||0) + 2*slvl;
                if (slvl >= 10) ts.critMulti = (ts.critMulti||0) + 15;
            }
            if (skillId === 'iron_skin') {
                ts.pctArmor = (ts.pctArmor||0) + 8*slvl;
                if (slvl >= 10) ts.pctDmgReduce = (ts.pctDmgReduce||0) + 5;
            }
            if (skillId === 'block_mastery') ts.blockChance = (ts.blockChance||0) + 3*slvl;
            if (skillId === 'life_tap') {
                ts.lifeStealPct = (ts.lifeStealPct||0) + 0.5*slvl;
                if (slvl >= 15) ts.lifeRegenPerSec = (ts.lifeRegenPerSec||0) + 5;
            }
            if (skillId === 'vanguard') {
                ts.pctDmgReduce = (ts.pctDmgReduce || 0) + 2 * slvl;
                ts.pctDmg = (ts.pctDmg || 0) + 1 * slvl;
            }
            if (skillId === 'titanic_might') {
                ts.pctStr = (ts.pctStr || 0) + 5 * slvl;
                ts.pctArmor = (ts.pctArmor || 0) + 2 * slvl;
                ts.canDualWield2H = true;
            }
            if (skillId === 'second_wind') {
                ts.secondWindRegen = (ts.secondWindRegen || 0) + 2 + (0.2 * slvl);
            }

            // SORCERESS
            if (skillId === 'warmth') {
                ts.manaRegenPerSec = (ts.manaRegenPerSec || 0) + (this.maxMp * 0.10 * slvl);
            }
            if (skillId === 'fire_mastery') {
                ts.pctFireDmg = (ts.pctFireDmg||0) + 5*slvl;
                if (slvl >= 10) ts.firePiercing = (ts.firePiercing||0) + 10;
            }
            if (skillId === 'cold_mastery') {
                ts.pctColdDmg = (ts.pctColdDmg||0) + 5*slvl;
                if (slvl >= 10) ts.freezeDurationBonus = (ts.freezeDurationBonus||0) + 0.25;
            }
            if (skillId === 'shatter') {
                ts.pctDmgVsFrozen = (ts.pctDmgVsFrozen || 0) + 3 * slvl;
            }
            if (skillId === 'light_mastery' || skillId === 'lightning_mastery') {
                ts.pctLightDmg = (ts.pctLightDmg||0) + 5*slvl;
                if (slvl >= 10) ts.chainBounses = (ts.chainBounses||0) + 1;
            }
            if (skillId === 'arcane_shield') {
                ts.arcaneShieldAbsorb = (ts.arcaneShieldAbsorb || 0) + 5 + (3 * slvl);
            }
            if (skillId === 'chain_lightning_mastery') {
                ts.chainLightningBounces = (ts.chainLightningBounces || 0) + 1 + Math.floor(slvl / 10);
                ts.novaDmgBonus = (ts.novaDmgBonus || 0) + 5 * slvl;
            }

            // SHAMAN
            if (skillId === 'elem_mastery') {
                ts.pctFireDmg = (ts.pctFireDmg || 0) + 3 * slvl;
                ts.pctColdDmg = (ts.pctColdDmg || 0) + 3 * slvl;
                ts.pctLightDmg = (ts.pctLightDmg || 0) + 3 * slvl;
            }
            if (skillId === 'totem_mastery') {
                ts.totemDurationPct = (ts.totemDurationPct || 0) + 20 * slvl;
                ts.totemRadiusPct = (ts.totemRadiusPct || 0) + 8 * slvl;
                if (slvl >= 5) ts.maxTotems = (ts.maxTotems || 1) + 1;
            }
            if (skillId === 'resto_mastery') {
                ts.healingBonusPct = (ts.healingBonusPct || 0) + 8 * slvl;
                ts.lifeRegenPerSec = (ts.lifeRegenPerSec || 0) + 2 * slvl;
            }

            // WARLOCK
            if (skillId === 'shadow_mastery') {
                ts.pctShadowDmg = (ts.pctShadowDmg || 0) + 5 * slvl;
                if (slvl >= 10) ts.dotCritChance = true;
            }
            if (skillId === 'demon_armor') {
                ts.flatArmor = (ts.flatArmor || 0) + 20 * slvl;
                ts.allRes = (ts.allRes || 0) + 2 * slvl;
                if (slvl >= 10) ts.lifeRegenPerSec = (ts.lifeRegenPerSec || 0) + 5;
            }
            if (skillId === 'soul_link') {
                ts.lifeStealPct = (ts.lifeStealPct || 0) + 1 * slvl;
            }
            if (skillId === 'master_demonologist') {
                ts.pctDmg = (ts.pctDmg || 0) + 3 * slvl;
                ts.pctDmgReduce = (ts.pctDmgReduce || 0) + 3 * slvl;
            }
            if (skillId === 'aff_mastery' || skillId === 'chaos_mastery') {
                ts.pctShadowDmg = (ts.pctShadowDmg || 0) + 5 * slvl;
                ts.pctFireDmg = (ts.pctFireDmg || 0) + 5 * slvl;
                if (slvl >= 10) ts.critMulti = (ts.critMulti || 0) + 20;
            }

            // RANGER
            if (skillId === 'bow_mastery') {
                ts.pctDmg = (ts.pctDmg || 0) + 5 * slvl;
                ts.attackRangeBonus = (ts.attackRangeBonus || 0) + 5 * slvl;
            }
            if (skillId === 'trap_mastery_r') {
                ts.trapDmgPct = (ts.trapDmgPct || 0) + 5 * slvl;
                ts.trapRadiusPct = (ts.trapRadiusPct || 0) + 4 * slvl;
                if (slvl >= 5) ts.maxTraps = (ts.maxTraps || 1) + 1;
            }
            if (skillId === 'tracking') {
                ts.pctMoveSpeed = (ts.pctMoveSpeed || 0) + 3 * slvl;
                ts.critVsDebuffed = (ts.critVsDebuffed || 0) + 2 * slvl;
            }
            if (skillId === 'nature_affinity') {
                ts.pctPoisonDmg = (ts.pctPoisonDmg || 0) + 4 * slvl;
                ts.pctLightDmg = (ts.pctLightDmg || 0) + 2 * slvl;
            }

            // NECROMANCER
            if (skillId === 'skeleton_mastery') {
                ts.minionDmgPct = (ts.minionDmgPct||0) + 15*slvl;
                ts.minionHpPct  = (ts.minionHpPct||0)  + 10*slvl;
            }
            if (skillId === 'golem_mastery') {
                ts.minionDmgPct = (ts.minionDmgPct||0) + 5*slvl;
                ts.minionHpPct  = (ts.minionHpPct||0)  + 20*slvl;
                if (slvl >= 10) ts.minionRegenPct = (ts.minionRegenPct||0) + 10;
            }
            if (skillId === 'minion_instability') ts.minionExplodeDmg = (ts.minionExplodeDmg || 0) + 10 * slvl;
            if (skillId === 'toxic_spores') ts.healReductionPct = (ts.healReductionPct || 0) + 5 * slvl;
            if (skillId === 'blood_mastery') {
                ts.pctHP = (ts.pctHP || 0) + 2 * slvl;
                ts.lifeStealPct = (ts.lifeStealPct || 0) + 0.5 * slvl;
            }
            if (skillId === 'summon_resist') {
                ts.allRes = (ts.allRes||0) + 2*slvl;
                ts.minionResistPct = (ts.minionResistPct||0) + 5*slvl;
            }
            if (skillId === 'bone_mastery') {
                ts.pctShadowDmg = (ts.pctShadowDmg||0) + 5*slvl;
                ts.boneCdReduce = (ts.boneCdReduce||0) + 0.3*slvl;
            }
            if (skillId === 'curse_mastery') {
                ts.maxCurses = 2;
                ts.curseDurationPct = (ts.curseDurationPct || 0) + 50;
            }

            // ROGUE
            if (skillId === 'assassin_mastery') {
                ts.pctDex = (ts.pctDex || 0) + 2 * slvl;
                ts.critMulti = (ts.critMulti || 0) + 10 * slvl;
            }
            if (skillId === 'assassinate') {
                ts.executeThreshold = (ts.executeThreshold || 0) + 20; 
                ts.bossExecuteDmg = 5.0;
            }
            if (skillId === 'master_poisoner') {
                ts.pctPoisonDmg = (ts.pctPoisonDmg || 0) + 5 * slvl;
                ts.enemyPoisonResReduce = (ts.enemyPoisonResReduce || 0) + 2 * slvl;
            }
            if (skillId === 'lethal_toxins') ts.poisonSlowPct = (ts.poisonSlowPct || 0) + 1 * slvl;
            if (skillId === 'unfair_advantage') ts.pctDmgVsCC = (ts.pctDmgVsCC || 0) + 2 * slvl;
            if (skillId === 'evasion') ts.dodgeChance = (ts.dodgeChance || 0) + 1 + (0.5 * slvl);
            if (skillId === 'venom') {
                ts.pctPoisonDmg = (ts.pctPoisonDmg||0) + 5*slvl;
                ts.poisonDurationBonus = (ts.poisonDurationBonus||0) + 0.2*slvl;
            }
            if (skillId === 'lethality') {
                ts.critMulti = (ts.critMulti||0) + 10*slvl;
                if (slvl >= 10) ts.critBleed = true;
            }
            if (skillId === 'chain_reaction') {
                ts.critChance = (ts.critChance||0) + 1*slvl;
                ts.trapRadiusBonus = (ts.trapRadiusBonus||0) + 5*slvl;
            }
            if (skillId === 'virulence') {
                ts.pctPoisonDmg = (ts.pctPoisonDmg||0) + 4*slvl;
                ts.pctIAS = (ts.pctIAS||0) + 2*slvl;
            }

            // PALADIN
            if (skillId === 'aura_mastery') {
                ts.pctHolyDmg      = (ts.pctHolyDmg||0)      + 5*slvl;
                ts.auraRadiusBonus = (ts.auraRadiusBonus||0)  + 4*slvl;
            }
            if (skillId === 'crusader_mastery') {
                ts.pctHolyDmg = (ts.pctHolyDmg || 0) + 5 * slvl;
                ts.pctStr = (ts.pctStr || 0) + 2 * slvl;
            }
            if (skillId === 'ret_mastery') {
                ts.pctHolyDmg     = (ts.pctHolyDmg||0)     + 2*slvl;
                ts.retDoTDmgPerPt = (ts.retDoTDmgPerPt||0) + 2*slvl;
            }
            if (skillId === 'art_of_war') ts.artOfWarCdReduce = (ts.artOfWarCdReduce||0) + 0.5*slvl;
            if (skillId === 'sacred_duty') {
                ts.divineCdReduce = (ts.divineCdReduce||0) + 1.5*slvl;
                ts.critChance     = (ts.critChance||0)     + 1*slvl;
            }
            if (skillId === 'prot_mastery' || skillId === 'protection_mastery') {
                ts.pctVit    = (ts.pctVit||0)    + 3*slvl;
                ts.pctArmor = (ts.pctArmor || 0) + 5 * slvl;
            }
            if (skillId === 'ardent_defender') {
                ts.ardentDrPct = (ts.ardentDrPct||0) + 1*slvl;
                if (slvl >= 10) ts.cheatDeath = true;
            }

            // DRUID
            if (skillId === 'nature_mastery') {
                ts.pctFireDmg  = (ts.pctFireDmg||0)  + 3*slvl;
                ts.pctColdDmg  = (ts.pctColdDmg||0)  + 3*slvl;
                ts.pctLightDmg = (ts.pctLightDmg||0) + 3*slvl;
                if (slvl >= 10) ts.natureRootChance = (ts.natureRootChance||0) + 0.10;
            }
            if (skillId === 'feral_mastery') {
                ts.pctDmg = (ts.pctDmg||0) + 5*slvl;
                ts.critChance = (ts.critChance||0) + 2*slvl;
                if (slvl >= 10) ts.pctHP = (ts.pctHP||0) + 15;
            }
            if (skillId === 'natural_armor') {
                ts.pctArmor = (ts.pctArmor||0) + 6*slvl;
                ts.lifeRegenPerSec = (ts.lifeRegenPerSec||0) + 1*slvl;
            }

            // UNIVERSAL
            if (skillId === 'radiance') ts.allRes = (ts.allRes||0) + 2*slvl;
            if (skillId === 'blade_efficiency' || skillId === 'swift_assault') ts.pctIAS = (ts.pctIAS||0) + 3*slvl;
            if (skillId === 'arcane_reservoir' || skillId === 'mana_tap') {
                ts.flatMP = (ts.flatMP||0) + 20*slvl;
                ts.manaRegenPerSec = (ts.manaRegenPerSec||0) + slvl;
            }
            if (skillId === 'vitality_mastery' || skillId === 'endurance') {
                ts.flatHP = (ts.flatHP||0) + 15*slvl;
                ts.lifeRegenPerSec = (ts.lifeRegenPerSec||0) + slvl * 0.5;
            }
        }
        return ts;
    }

    _addItemStats(item, s) {
        if (!item || item.identified === false) return;
        if (item.armor) s.flatArmor = (s.flatArmor || 0) + item.armor;
        if (item.block) s.blockChance = (s.blockChance || 0) + item.block;
        if (item.mods) {
            for (const mod of item.mods) {
                if (mod && mod.stat) {
                    // DIABLO 2 Logic: pctDmg on a Weapon is LOCAL (applies to weapon base).
                    // pctDmg on anything else (Armor, Jewels in Armor, Charms) is GLOBAL.
                    if (mod.stat === 'pctDmg' && (item.slot === SLOT.MAINHAND || item.slot === SLOT.OFFHAND || item.type === 'weapon')) {
                        item._localED = (item._localED || 0) + mod.value;
                    } else if (mod.stat.startsWith('+') && !['+allSkills', '+classSkills', '+skill', '+skillGroup'].some(p => mod.stat.startsWith(p))) {
                        s[mod.stat] = (s[mod.stat] || 0) + mod.value;
                    } else {
                        s[mod.stat] = (s[mod.stat] || 0) + (mod.value || 0);
                    }
                }
            }
        }
        if (item.socketed) {
            const itemClass = (item.type === 'shield' || item.type === 'source') ? 'shield' 
                : (item.type === 'helm' || item.type === 'armor' || item.type === 'gloves' || item.type === 'boots' || item.type === 'belt') ? 'armor' 
                : 'weapon';
            for (const gem of item.socketed) {
                if (gem && gem.socketEffect && gem.socketEffect[itemClass]) {
                    const eff = gem.socketEffect[itemClass];
                    // Jewels or Runes with pctDmg inside a weapon also count as LOCAL ED in D2
                    if (eff.stat === 'pctDmg' && itemClass === 'weapon') {
                        item._localED = (item._localED || 0) + eff.value;
                    } else {
                        s[eff.stat] = (s[eff.stat] || 0) + eff.value;
                    }
                }
            }
        }
    }

    getSkillBonus(skillId) {
        let bonus = 0;
        const setCounts = {};
        for (const item of Object.values(this.equipment)) {
            if (!item || item.identified === false) continue;
            for (const mod of (item.mods || [])) {
                if (mod.stat === '+allSkills') bonus += mod.value;
                else if (mod.stat === `+classSkills:${this.classId}`) bonus += mod.value;
                else if (mod.stat === `+skill:${skillId}`) bonus += mod.value;
                else if (mod.stat.startsWith('+skillGroup:')) {
                    const group = mod.stat.split(':')[1];
                    const skill = this.skillMap[skillId];
                    if (skill?.group === group) bonus += mod.value;
                }
            }
            if (item.rarity === RARITY.SET && item.setId) {
                setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
            }
        }
        for (const item of this.inventory) {
            if (!item || item.type !== 'charm' || item.identified === false) continue;
            for (const mod of (item.mods || [])) {
                if (mod.stat === '+allSkills') bonus += mod.value;
                else if (mod.stat === `+classSkills:${this.classId}`) bonus += mod.value;
                else if (mod.stat === `+skill:${skillId}`) bonus += mod.value;
                else if (mod.stat.startsWith('+skillGroup:')) {
                    const group = mod.stat.split(':')[1];
                    const skill = this.skillMap[skillId];
                    if (skill?.group === group) bonus += mod.value;
                }
            }
        }
        for (const [setId, count] of Object.entries(setCounts)) {
            const def = SETS[setId];
            if (def && def.bonuses && count >= 2) {
                for (let tier = 2; tier <= count; tier++) {
                    const mods = def.bonuses[tier];
                    if (mods) {
                        for (const mod of mods) {
                            if (mod.stat === '+allSkills') bonus += mod.value;
                            else if (mod.stat === `+classSkills:${this.classId}`) bonus += mod.value;
                            else if (mod.stat === `+skill:${skillId}`) bonus += mod.value;
                            else if (mod.stat.startsWith('+skillGroup:')) {
                                const group = mod.stat.split(':')[1];
                                const skill = this.skillMap[skillId];
                                if (skill?.group === group) bonus += mod.value;
                            }
                        }
                    }
                }
            }
        }
        return bonus;
    }

    effectiveSkillLevel(skillId) {
        const base = this.talents.baseLevel(skillId) || 0;
        if (base <= 0) return 0;
        return base + this.getSkillBonus(skillId);
    }

    _onClick(data) {
        if (!this._dungeon) return;
        const world = this._camera.toWorld(data.screenX, data.screenY);
        const enemy = this._findEnemyAt(world.x, world.y);
        if (enemy) { this.attackTarget = enemy; return; }
        this.attackTarget = null;
        this.path = this.pathfinder.find(this._dungeon.grid, this.x, this.y, world.x, world.y, this._dungeon.tileSize);
    }

    _findEnemyAt(wx, wy) {
        if (!this._enemies) return null;
        for (const e of this._enemies) {
            if (e.hp <= 0) continue;
            const dx = e.x - wx, dy = e.y - wy;
            if (dx * dx + dy * dy < 144) return e;
        }
        return null;
    }

    setRefs(dungeon, camera, enemies) {
        this._dungeon = dungeon;
        this._camera = camera;
        this._enemies = enemies;
    }

    update(dt, input, enemies, dungeon, addAoE) {
        if (this.hp <= 0) return;
        if (Math.abs(this.pushX) > 0.5 || Math.abs(this.pushY) > 0.5) {
            const nextX = this.x + this.pushX * dt;
            const nextY = this.y + this.pushY * dt;
            if (dungeon && dungeon.isWalkable(nextX, nextY)) { this.x = nextX; this.y = nextY; }
            this.pushX *= 0.85; this.pushY *= 0.85;
            if (Math.abs(this.pushX) < 0.5) this.pushX = 0;
            if (Math.abs(this.pushY) < 0.5) this.pushY = 0;
        } else { this.pushX = 0; this.pushY = 0; }

        if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
        if (this._auraSlowTimer > 0) {
            this._auraSlowTimer -= dt;
            if (this._auraSlowTimer <= 0) { this._auraSlow = 0; this._recalcStats(); }
        }

        this.hp = Math.min(this.maxHp, this.hp + (this.lifeRegenPerSec || 0) * dt);
        this.mp = Math.min(this.maxMp, this.mp + ((2 + this.int * 0.05) + (this.manaRegenPerSec || 0)) * dt);

        if (this.hpBuffer > 0 && this.hp < this.maxHp) {
            const heal = Math.min(this.hpBuffer, this.maxHp * 0.1 * dt);
            this.hp = Math.min(this.maxHp, this.hp + heal);
            this.hpBuffer -= heal;
            if (fx && Math.random() < 0.1) fx.emitHeal(this.x, this.y);
        }
        if (this.mpBuffer > 0 && this.mp < this.maxMp) {
            const restore = Math.min(this.mpBuffer, this.maxMp * 0.1 * dt);
            this.mp = Math.min(this.maxMp, this.mp + restore);
            this.mpBuffer -= restore;
        }

        if (this.activeAura) {
            this._auraTimer = (this._auraTimer || 0) + dt;
            const slvl = this._auraSlvl || 1;
            if (this._auraTimer >= 1.0) {
                this._auraTimer = 0;
                if (this.activeAura === 'prayer_aura') {
                    this.hp = Math.min(this.maxHp, this.hp + 2 + slvl);
                    if (fx) fx.emitHeal(this.x, this.y);
                }
                if (this.activeAura === 'holy_fire_aura') {
                    if (enemies) enemies.forEach(e => {
                        if (e.hp <= 0) return;
                        if ((e.x - this.x)**2 + (e.y - this.y)**2 < 150*150) {
                            applyDamage(this, e, { dealt: 3 + slvl*2, isCrit: false, type: 'fire' }, 'holy_fire_aura');
                            if (fx) fx.emitBurst(e.x, e.y, '#ff4000', 5);
                        }
                    });
                }
                if (this.activeAura === 'conviction') {
                    if (enemies) enemies.forEach(e => {
                        if (e.hp <= 0) { e.armorDebuff = 0; e.resDebuff = 0; return; }
                        if ((e.x - this.x)**2 + (e.y - this.y)**2 < 180*180) {
                            e.armorDebuff = 30 + slvl*2; e.resDebuff = 30 + slvl*2;
                            if (Math.random() < 0.3) fx.emitBurst(e.x, e.y, '#a040ff', 3);
                        } else { e.armorDebuff = 0; e.resDebuff = 0; }
                    });
                }
            }
        } else if (enemies) { enemies.forEach(e => { e.armorDebuff = 0; e.resDebuff = 0; }); }

        for (let i = 0; i < 5; i++) { if (this.cooldowns[i] > 0) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - dt); }
        this.attackCd = Math.max(0, this.attackCd - dt);
        this.stateTimer += dt;

        let buffsChanged = false;
        for (let i = this._buffs.length - 1; i >= 0; i--) {
            this._buffs[i].duration -= dt;
            if (this._buffs[i].duration <= 0) { this._buffs.splice(i, 1); buffsChanged = true; }
        }
        if (buffsChanged) this._recalcStats();

        let movedThisFrame = false, moveDx = 0, moveDy = 0;
        let finalMoveSpeed = this.moveSpeed;
        if (dungeon) {
            const gx = Math.floor(this.x / dungeon.tileSize), gy = Math.floor(this.y / dungeon.tileSize);
            if (gx >= 0 && gx < dungeon.width && gy >= 0 && gy < dungeon.height && dungeon.grid[gy]) {
                const tile = dungeon.grid[gy][gx];
                if (tile === 8) finalMoveSpeed *= 0.5; else if (tile === 13) finalMoveSpeed *= 0.7;
            }
        }

        const PLAYER_RADIUS = 5;
        const tryMove = (dx, dy) => {
            moveDx = dx; moveDy = dy; movedThisFrame = true;
            if (!dungeon) { this.x += dx; this.y += dy; return; }
            const walls = (window.aoeZones || []).filter(z => z.active && z.isWall);
            const isBlockedByWall = (tx, ty) => walls.some(w => Math.hypot(tx - w.x, ty - w.y) < w.radius);
            const canMove = (tx, ty) => dungeon.isWalkable(tx - PLAYER_RADIUS, ty - PLAYER_RADIUS)
                    && dungeon.isWalkable(tx + PLAYER_RADIUS, ty - PLAYER_RADIUS)
                    && dungeon.isWalkable(tx - PLAYER_RADIUS, ty + PLAYER_RADIUS)
                    && dungeon.isWalkable(tx + PLAYER_RADIUS, ty + PLAYER_RADIUS)
                    && !isBlockedByWall(tx, ty);
            const nx = this.x + dx, ny = this.y + dy;
            if (canMove(nx, ny)) {
                this.x = nx; this.y = ny;
            } else if (dx !== 0 && canMove(this.x + dx, this.y)) {
                this.x += dx;
            } else if (dy !== 0 && canMove(this.x, this.y + dy)) {
                this.y += dy;
            }
        };

        if (input && this.attackCd <= 0) {
            let kx = 0, ky = 0;
            if (input.isDown('KeyW') || input.isDown('ArrowUp')) ky -= 1;
            if (input.isDown('KeyS') || input.isDown('ArrowDown')) ky += 1;
            if (input.isDown('KeyA') || input.isDown('ArrowLeft')) kx -= 1;
            if (input.isDown('KeyD') || input.isDown('ArrowRight')) kx += 1;
            if (kx !== 0 || ky !== 0) {
                const len = Math.sqrt(kx*kx + ky*ky);
                const spd = finalMoveSpeed * dt;
                tryMove((kx / len) * spd, (ky / len) * spd);
                this.path = []; this.attackTarget = null;
            }
            if (kx !== 0 || ky !== 0) this.moveDir = { x: kx, y: ky };
        }

        if (!movedThisFrame && this.attackTarget) {
            if (this.attackTarget.hp <= 0) { this.attackTarget = null; return; }
            const dx = this.attackTarget.x - this.x, dy = this.attackTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > (this.attackRange || 30)) tryMove((dx / dist) * Math.min(finalMoveSpeed * dt, dist), (dy / dist) * Math.min(finalMoveSpeed * dt, dist));
            else if (this.attackCd <= 0) this._autoAttack(this.attackTarget);
            return;
        }

        if (!movedThisFrame && this.path.length) {
            const target = this.path[0];
            const dx = target.x - this.x, dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy), spd = finalMoveSpeed * dt;
            if (dist < spd) { this.x = target.x; this.y = target.y; this.path.shift(); }
            else tryMove((dx / dist) * spd, (dy / dist) * spd);
        }

        if (movedThisFrame) {
            if (Math.abs(moveDx) > Math.abs(moveDy)) this.facingDir = moveDx > 0 ? 'right' : 'left';
            else this.facingDir = moveDy > 0 ? 'down' : 'up';
        }
        if (this.attackCd <= 0) this._setAnimState(movedThisFrame ? 'walk' : 'idle');

        if (dungeon) {
            const gx = Math.floor(this.x / dungeon.tileSize), gy = Math.floor(this.y / dungeon.tileSize);
            if (gx >= 0 && gx < dungeon.width && gy >= 0 && gy < dungeon.height && dungeon.grid[gy] && dungeon.grid[gy][gx] === 13) {
                this._lavaTimer = (this._lavaTimer || 0) + dt;
                if (this._lavaTimer >= 0.5) {
                    this._lavaTimer = 0; applyDamage(null, this, { dealt: 5, isCrit: false, type: 'fire' }, 'lava');
                    if (fx) fx.emitBurst(this.x, this.y, '#ff4500', 8);
                }
            }
        }
    }

    _setAnimState(state) { if (this.animState !== state) { this.animState = state; this.stateTimer = 0; } }

    _autoAttack(target) {
        const baseDmg = this.wepMin + Math.random() * (this.wepMax - this.wepMin);
        applyDamage(this, target, calcDamage(this, baseDmg, DMG_TYPE.PHYSICAL, target), 'autoAttack');
        
        // --- Imbuement / On-Hit Effects ---
        if (this.poisonDmgPerSec > 0) applyDot(target, this.poisonDmgPerSec, 'poison', 3, 'player_imbuement_poison');
        if (this.holyDmgOnHit > 0) applyDamage(this, target, { dealt: this.holyDmgOnHit, isCrit: false, type: 'holy' }, 'player_imbuement_holy');
        if (this.fireDmgOnHit > 0) applyDamage(this, target, { dealt: this.fireDmgOnHit, isCrit: false, type: 'fire' }, 'player_imbuement_fire');

        this.attackCd = 1 / this.atkSpd; 
        this._setAnimState('attack');
        
        const dx = target.x - this.x, dy = target.y - this.y;
        if (Math.abs(dx) > Math.abs(dy)) this.facingDir = dx > 0 ? 'right' : 'left';
        else this.facingDir = dy > 0 ? 'down' : 'up';
    }

    _useSkill(slotIdx, data) {
        const skillId = this.hotbar[slotIdx];
        if (!skillId) return;
        
        const skill = this.skillMap[skillId];
        if (!skill) return;

        if (this.cooldowns[slotIdx] > 0) {
            bus.emit('combat:log', { text: `${skill.name} is on cooldown!`, cls: 'log-dmg' });
            return;
        }
        
        if (skill.type !== 'active' && skill.type !== 'toggle') {
            bus.emit('combat:log', { text: `Cannot use passive skill: ${skill.name}`, cls: 'log-dmg' });
            return;
        }
        
        if (this.mp < (skill.mana || 0)) {
            bus.emit('combat:log', { text: `Not enough mana for ${skill.name}`, cls: 'log-mp' });
            return;
        }
        
        const slvl = this.effectiveSkillLevel(skillId);
        if (slvl <= 0) {
            bus.emit('combat:log', { text: `You haven't learned ${skill.name} yet! (Lv ${slvl})`, cls: 'log-dmg' });
            return;
        }
        
        this.mp -= (skill.mana || 0); 
        this.cooldowns[slotIdx] = skill.cd || 0;

        const isSummon = skill.group === 'summon' || ['summon_', 'imp', 'infernal', 'companion_', 'raven', 'grizzly', 'oak_sage', 'golem', 'skeleton_mage', 'revive', 'spirit_wolf', 'vine', 'voidwalker', 'succubus', 'ancestral_'].some(k => skillId.startsWith(k));
        const target = this.attackTarget || this._nearestEnemy();
        let targetX = target ? target.x : (this.moveDir ? this.x + this.moveDir.x * 100 : this.x);
        let targetY = target ? target.y : (this.moveDir ? this.y + this.moveDir.y * 100 : this.y + 10);

        if (isSummon) { this._spawnMinion(skillId, slvl, skill); bus.emit('skill:used', { skillId, slotIdx }); this._setAnimState('cast'); this.attackCd = 0.5; return; }

        const synBonus = this.talents.synergyBonus(skillId);
        let baseDmg = (skill.dmgBase || 10) + (skill.dmgPerLvl || 5) * slvl;
        
        // --- Stat-based Scaling ---
        let scaleStat = skill.scaleStat;
        if (!scaleStat) {
            const group = skill.group || 'physical';
            if (['melee', 'physical', 'earth'].includes(group)) scaleStat = 'str';
            else if (['poison', 'traps', 'arrow', 'assassination'].includes(group)) scaleStat = 'dex';
            else if (['fire', 'cold', 'lightning', 'shadow', 'holy', 'magic', 'arcane'].includes(group)) scaleStat = 'int';
            else scaleStat = 'str';
        }
        const statValue = this[scaleStat] || 10;
        const statMult = 1 + (statValue / 100);
        
        const totalBase = baseDmg * (1 + synBonus) * statMult;
        const type = skillType(skill);
        const isAoE = ['blizzard', 'nova', 'wall', 'storm', 'meteor', 'armageddon', 'hurricane', 'volcano', 'fissure', 'earthquake', 'rain_of', 'consecration', 'trap', 'static'].some(kw => skillId.includes(kw));
        const isNova = ['nova', 'storm', 'hurricane', 'armageddon', 'warcry', 'static', 'totemic_wrath'].some(kw => skillId.includes(kw));
        const isMelee = skill.group === 'melee';
        const isBuff = skill.group === 'warcry' || skill.group === 'buff';
        const isAura = skill.group === 'aura';
        const isTeleport = skill.group === 'teleport';

        if (isAura) {
            if (this.activeAura === skillId) {
                this.activeAura = null;
                bus.emit('combat:log', { text: `${skill.name} Deactivated`, cls: 'log-info' });
            } else {
                this.activeAura = skillId;
                this._auraSlvl = slvl;
                if (fx) fx.emitHolyBurst(this.x, this.y);
                bus.emit('combat:log', { text: `${skill.name} Activated`, cls: 'log-info' });
            }
            this._statsDirty = true;
            this._recalcStats();
            this._setAnimState('cast'); this.attackCd = 0.3; bus.emit('skill:used', { skillId, slotIdx }); return;
        } else if (skillId === 'holy_shock') {
            const hRange = 250;
            const dist = Math.hypot(targetX - this.x, targetY - this.y);
            if (dist < hRange) {
                if (target) {
                    applyDamage(this, target, calcDamage(this, totalBase, type, target), skillId);
                    if (fx) fx.emitHolyBurst(target.x, target.y);
                } else {
                    this.hp = Math.min(this.maxHp, this.hp + 60 + slvl * 30);
                    if (fx) fx.emitHeal(this.x, this.y);
                }
            }
            this._setAnimState('cast'); this.attackCd = 0.4; bus.emit('skill:used', { skillId, slotIdx }); return;
        } else if (isTeleport) {
            const dist = Math.hypot(targetX - this.x, targetY - this.y), maxD = 200 + slvl * 10;
            if (dist > maxD) { const r = maxD / dist; targetX = this.x + (targetX - this.x) * r; targetY = this.y + (targetY - this.y) * r; }
            if (fx) fx.emitBurst(this.x, this.y, '#8080ff', 12, 2);
            this.x = targetX; this.y = targetY; this.path = [];
            if (fx) fx.emitBurst(this.x, this.y, '#b0b0ff', 12, 2);
            this._setAnimState('cast'); this.attackCd = 0.3; bus.emit('skill:used', { skillId, slotIdx }); return;
        } else if (isBuff) {
            // --- NEW: Toggle Logic ---
            if (skill.type === 'toggle') {
                const existingIdx = this._buffs.findIndex(b => b.id === skillId);
                if (existingIdx !== -1) {
                    this._buffs.splice(existingIdx, 1);
                    bus.emit('combat:log', { text: `${skill.name} Deactivated`, cls: 'log-info' });
                } else {
                    this._buffs.push({ id: skillId, duration: 999999, base: totalBase }); // Indefinite
                    bus.emit('combat:log', { text: `${skill.name} Activated`, cls: 'log-info' });
                }
            } else {
                this._buffs.push({ id: skillId, duration: 15 + slvl, base: totalBase });
            }
            
            this._recalcStats();
            if (fx) {
                if (skillId.includes('holy') || skillId.includes('divine')) fx.emitHolyBurst(this.x, this.y);
                else if (['bone', 'frozen', 'energy', 'cyclone'].some(k => skillId.includes(k))) fx.emitBurst(this.x, this.y, '#80d0ff', 12, 2);
                else if (['berserk', 'enchant', 'fire', 'wrath', 'blood_rage'].some(k => skillId.includes(k))) fx.emitBurst(this.x, this.y, '#ff6000', 15, 2);
                else if (['bear', 'wolf', 'primal', 'jungle'].some(k => skillId.includes(k))) { fx.emitBurst(this.x, this.y, '#40c040', 12, 2); fx.emitShockwave(this.x, this.y, 30, '#408040'); }
                else if (['vanish', 'shadow', 'dark'].some(k => skillId.includes(k))) fx.emitShadow(this.x, this.y);
                else if (['poison', 'venom', 'virulence'].some(k => skillId.includes(k))) fx.emitPoisonCloud(this.x, this.y, 20);
                else fx.emitBurst(this.x, this.y, '#ffe880', 10, 1.5);
            }
            if (skillId === 'blood_rage') {
                this.hp = Math.max(1, this.hp - (this.maxHp * 0.2)); 
            }
            this._setAnimState('cast'); this.attackCd = 0.5; bus.emit('skill:used', { skillId, slotIdx }); return;
        } else if (isMelee) {
            const mRange = (['whirlwind', 'cleave', 'slam', 'storm', 'dance', 'zeal'].some(k => skillId.includes(k))) ? 60 : 50;
            if (['whirlwind', 'cleave', 'blade_dance', 'divine_storm'].some(k => skillId === k)) {
                bus.emit('combat:spawnAoE', { aoe: new AoEZone(this.x, this.y, 50, 0.3, totalBase, type, this, 0.8, skillId) });
                if (fx) { for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) fx.emitSlash(this.x, this.y, a, (type === 'holy' ? '#ffd040' : '#cccccc'), 30); fx.emitShockwave(this.x, this.y, 40, '#aaa'); }
            } else if (['slam', 'leap_attack', 'bear_slam', 'shockwave', 'heroic_leap'].some(k => skillId === k)) {
                const sX = target ? target.x : this.x, sY = target ? target.y : this.y;
                bus.emit('combat:spawnAoE', { aoe: new AoEZone(sX, sY, 60, 0.4, totalBase, type, this, 0.5, skillId) });
                if (fx) { fx.emitShockwave(sX, sY, 60, '#b0a080'); fx.shake(300, 5); }
            } else if (target && Math.hypot(target.x - this.x, target.y - this.y) < mRange) {
                let finalDmg = totalBase;
                if (skillId === 'shattering_throw' && (target.boneArmor > 0 || target.energyShield > 0)) {
                    finalDmg *= 2;
                    target.boneArmor = 0;
                    bus.emit('combat:log', { text: "SHIELD SHATTERED!", cls: 'log-dmg' });
                }
                
                const hitCount = (skillId === 'zeal') ? Math.floor(3 + 0.2 * slvl) : 1;
                for (let i = 0; i < hitCount; i++) {
                    setTimeout(() => {
                        if (target && target.hp > 0) {
                            applyDamage(this, target, calcDamage(this, finalDmg, type, target), skillId);
                            if (this.poisonDmgPerSec > 0) applyDot(target, this.poisonDmgPerSec, 'poison', 3, 'player_imbuement_poison');
                            if (this.holyDmgOnHit > 0) applyDamage(this, target, { dealt: this.holyDmgOnHit, isCrit: false, type: 'holy' }, 'player_imbuement_holy');
                            if (this.fireDmgOnHit > 0) applyDamage(this, target, { dealt: this.fireDmgOnHit, isCrit: false, type: 'fire' }, 'player_imbuement_fire');
                            if (fx) fx.emitSlash(target.x, target.y, Math.random() * Math.PI * 2, '#fff', 15);
                        }
                    }, i * 150);
                }

                SkillLogic.onHit(this, target, skillId, slvl, totalBase);
                if (fx && skillId !== 'zeal') {
                    const ang = Math.atan2(target.y - this.y, target.x - this.x);
                    if (['rend', 'eviscerate', 'backstab', 'lacerate', 'shred'].some(k => skillId.includes(k))) { fx.emitSlash(target.x, target.y, ang, '#cc2020', 18); fx.emitBlood(target.x, target.y, ang); }
                    else if (skillId === 'execute' || skillId === 'bloodthirst') { fx.emitSlash(target.x, target.y, ang, '#ff0000', 25); fx.emitBlood(target.x, target.y, ang); fx.shake(200, 4); }
                    else if (['bash', 'smite', 'shiv'].some(k => skillId.includes(k))) { fx.emitHitImpact(target.x, target.y, 'physical'); fx.shake(120, 2); }
                    else if (['holy', 'crusader', 'righteous'].some(k => skillId.includes(k))) { fx.emitSlash(target.x, target.y, ang, '#ffd040', 20); fx.emitHolyBurst(target.x, target.y); }
                    else { fx.emitSlash(target.x, target.y, ang, '#cccccc', 20); fx.emitBlood(target.x, target.y, ang); }
                }
            }
        } else if (isAoE) {
            const rad = isNova ? 100 : 70, aX = isNova ? this.x : targetX, aY = isNova ? this.y : targetY;
            const dur = ['blizzard', 'fire_wall', 'consecration'].some(k => skillId.includes(k)) ? 6 : 0.6;
            if (['meteor', 'volcano', 'fissure'].some(k => skillId === k)) {
                setTimeout(() => { bus.emit('combat:spawnAoE', { aoe: new AoEZone(targetX, targetY, 60, 0.5, totalBase, type, this, 0.5, skillId) }); if (fx) { fx.emitShockwave(targetX, targetY, 60, '#ff6000'); fx.shake(400, 6); } }, 1500);
                if (fx) for (let i = 0; i < 15; i++) setTimeout(() => fx.emitFireTrail(targetX + (Math.random()-0.5)*20, targetY - 30 + i * 3), i * 100);
            } else {
                bus.emit('combat:spawnAoE', { aoe: new AoEZone(aX, aY, rad, dur, totalBase * (dur > 1 ? 0.3 : 0.8), type, this, 0.5, skillId) });
                if (fx && isNova) fx.emitBurst(this.x, this.y, type === 'cold' ? '#80d0ff' : type === 'fire' ? '#ff6000' : '#ffff00', 20, 3);
            }
        } else {
            const speeds = { fire: 200, cold: 160, lightning: 280, poison: 140, shadow: 180, holy: 200, earth: 150, physical: 220, magic: 190 };
            const colors = { fire: '#ff4000', cold: '#4080ff', poison: '#00ff00', lightning: '#ffff00' };
            const piercing = ['bone_spear', 'lightning', 'frozen_orb'].includes(skillId);
            const aoeR = (skillId === 'fireball' || skillId === 'chaos_bolt') ? 40 : 0;
            const bnc = skillId === 'chain_lightning' ? 3 + Math.floor(slvl/4) : 0;
            const pR = (['fireball', 'frozen_orb', 'chaos_bolt'].includes(skillId)) ? 10 : (skillId === 'bone_spear' ? 6 : 8);
            bus.emit('combat:spawnProjectile', { proj: Projectile.create(this.x, this.y, targetX, targetY, speeds[type]||180, colors[type]||'#cccccc', totalBase, type, this, piercing, pR, aoeR, bnc, skillId) });
        }
        this._setAnimState('cast');
        this.attackCd = 0.5 * (1 - Math.min(0.75, (this.pctFCR || 0) / 100));
        const dx = targetX - this.x, dy = targetY - this.y;
        if (Math.abs(dx) > Math.abs(dy)) this.facingDir = dx > 0 ? 'right' : 'left'; else this.facingDir = dy > 0 ? 'down' : 'up';
        bus.emit('skill:used', { skillId, slotIdx, target, type });
        SkillLogic.onCast(this, skillId, slvl, targetX, targetY, this._enemies);
    }

    _spawnMinion(skillId, slvl, skill) {
        if (this.minions.length >= this.maxMinions) this.minions.shift();
        const synBonus = this.talents.synergyBonus(skillId);
        const statScaling = 1 + (this.int / 100); 
        const hp = Math.round((30 + slvl * 15) * (1 + (this.minionHpPct || 0) / 100) * (1 + synBonus));
        const dmg = Math.round(((skill.dmgBase || 8) + (skill.dmgPerLvl || 4) * slvl) * (1 + (this.minionDmgPct || 0) / 100) * (1 + synBonus) * statScaling);

        let sprite = 'summon_skeleton'; // fallback
        if (skillId.includes('golem')) sprite = 'summon_clay_golem';
        if (skillId === 'blood_golem') sprite = 'summon_blood_golem';
        if (skillId === 'iron_golem') sprite = 'summon_iron_golem';
        if (skillId === 'skeleton_mage') sprite = 'summon_skeleton_mage';
        if (skillId === 'raise_skeleton') sprite = 'summon_skeleton';
        if (skillId.includes('wolf')) sprite = 'summon_dire_wolf';
        if (skillId.includes('grizzly') || skillId.includes('bear')) sprite = 'summon_grizzly';
        if (skillId.includes('valkyrie')) sprite = 'summon_valkyrie';
        if (skillId.includes('voidwalker') || skillId.includes('succubus') || skillId.includes('imp')) sprite = 'summon_voidwalker';

        const minion = {
            id: `minion_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: skill.name || skillId.replace(/_/g, ' '), skillId,
            x: this.x + (Math.random()-0.5)*30, y: this.y + (Math.random()-0.5)*30,
            hp, maxHp: hp, damage: dmg,
            moveSpeed: (skill.group === 'totem' || ['trap', 'sentry'].some(k => skillId.includes(k))) ? 0 : 80,
            isStationary: (skill.group === 'totem' || ['trap', 'sentry'].some(k => skillId.includes(k))),
            attackRange: (skill.group === 'totem' || skillId.includes('mage') || skillId.includes('imp')) ? 200 : 25,
            attackCd: 0, attackSpeed: 1.2, age: 0, duration: 20 + slvl * 2, icon: `skill_${skillId}`, sprite,
            animState: 'idle', facingDir: 'south',
            size: (skillId.includes('golem') || skillId.includes('grizzly') || skillId.includes('valkyrie')) ? 24 : 16,
            formationOffset: { x: (Math.random()-0.5)*80, y: (Math.random()-0.5)*80 }
        };
        this.minions.push(minion); bus.emit('minion:spawned', { minion });
    }

    updateMinions(dt, enemies, dungeon) {
        this.minions = this.minions.filter(m => {
            m.age += dt; if (m.age >= m.duration || m.hp <= 0) return false;
            m.attackCd = Math.max(0, m.attackCd - dt);
            let moved = false;
            
            if (m.isStationary) {
                let near = null, nD = m.attackRange || 200;
                for (const e of enemies) { if (e.hp > 0 && e.state !== 'dead') { const d = Math.hypot(e.x-m.x, e.y-m.y); if (d < nD) { near = e; nD = d; } } }
                if (near && m.attackCd <= 0) { applyDamage(this, near, calcDamage(this, m.damage, 'physical', near), m.skillId); m.attackCd = m.attackSpeed; if (fx) fx.emitBurst(near.x, near.y, '#ffff00', 5); }
                return true;
            }
            const dx = (this.x + m.formationOffset.x) - m.x, dy = (this.y + m.formationOffset.y) - m.y, dist = Math.hypot(dx, dy);
            if (dist > 800) { m.x = this.x + m.formationOffset.x; m.y = this.y + m.formationOffset.y; if (fx) fx.emitBurst(m.x, m.y, '#a0ffa0', 10, 1.5); return true; }
            if (dist < 250) {
                let near = null, nD = 300;
                for (const e of enemies) { if (e.hp > 0 && e.state !== 'dead') { const d = Math.hypot(e.x-m.x, e.y-m.y); if (d < nD) { near = e; nD = d; } } }
                if (near) {
                    const ang = Math.atan2(near.y-m.y, near.x-m.x);
                    if (nD > m.attackRange) { 
                        const nx = m.x + Math.cos(ang)*m.moveSpeed*dt, ny = m.y + Math.sin(ang)*m.moveSpeed*dt; 
                        if (!dungeon || dungeon.isWalkable(nx, ny)) { m.x = nx; m.y = ny; moved = true; } 
                        m.facingDir = Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang)) ? (Math.cos(ang) > 0 ? 'right' : 'left') : (Math.sin(ang) > 0 ? 'down' : 'up');
                        m.animState = 'walk';
                    }
                    else if (m.attackCd <= 0) { 
                        applyDamage(this, near, calcDamage(this, m.damage, 'physical', near), m.skillId); 
                        m.attackCd = m.attackSpeed; 
                        m.animState = 'attack'; 
                        m.facingDir = Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang)) ? (Math.cos(ang) > 0 ? 'right' : 'left') : (Math.sin(ang) > 0 ? 'down' : 'up'); 
                    } else if (m.attackCd < m.attackSpeed * 0.7) {
                        m.animState = 'idle';
                    }
                    return true;
                }
            }
            if (dist > 40) { 
                const s = (dist > 250 ? m.moveSpeed * 1.5 : m.moveSpeed), nx = m.x + (dx/dist)*s*dt, ny = m.y + (dy/dist)*s*dt; 
                if (!dungeon || dungeon.isWalkable(nx, ny)) { m.x = nx; m.y = ny; moved = true; } 
                m.facingDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
            }
            m.animState = moved ? 'walk' : 'idle';
            return true;
        });
    }

    renderMinions(renderer, time) {
        for (const m of this.minions) {
            renderer.ctx.fillStyle = 'rgba(0,200,0,0.25)'; renderer.ctx.beginPath(); renderer.ctx.ellipse(m.x, m.y + 5, 6, 2.5, 0, 0, Math.PI * 2); renderer.ctx.fill();
            renderer.drawAnim(m.sprite, m.x, m.y - 4, m.size || 16, m.animState || 'idle', m.facingDir || 'south', time);
            const bW = 14, bH = 2; renderer.ctx.fillStyle = '#222'; renderer.ctx.fillRect(m.x - bW / 2, m.y - 12 - (m.size||16)/2, bW, bH);
            renderer.ctx.fillStyle = '#4c4'; renderer.ctx.fillRect(m.x - bW / 2, m.y - 12 - (m.size||16)/2, bW * (m.hp / m.maxHp), bH);
            renderer.ctx.font = '4px Cinzel, serif'; renderer.ctx.textAlign = 'center'; renderer.ctx.fillStyle = '#8f8'; renderer.ctx.fillText(m.name, m.x, m.y - 14 - (m.size||16)/2);
        }
    }

    _nearestEnemy() {
        if (!this._enemies) return null;
        let best = null, bD = Infinity;
        for (const e of this._enemies) { if (e.hp > 0) { const d = (e.x-this.x)**2 + (e.y-this.y)**2; if (d < bD) { bD = d; best = e; } } }
        return bD < 300 * 300 ? best : null;
    }

    addXp(amount) {
        if (this.hp <= 0) return;
        let mult = 1.0; if (this._buffs) { const b = this._buffs.find(x => x.id === 'shrine_exp'); if (b) mult += b.value / 100; }
        this.xp += Math.round(amount * mult);
        if (this.level < 99) {
            let lv = false;
            while (this.xp >= this.xpToNext) { this.xp -= this.xpToNext; this.level++; this.statPoints += 5; this.talents.unspent++; lv = true; bus.emit('player:levelup', { level: this.level }); if (fx) fx.emitLevelUp(this.x, this.y); }
            if (lv) { this._recalcStats(); this.hp = this.maxHp; this.mp = this.maxMp; }
        } else {
            const pXp = 100000 + (this.paragonLevel * 50000);
            while (this.xp >= pXp) { this.xp -= pXp; this.paragonLevel++; this.paragonPoints++; bus.emit('player:paragonup', { level: this.paragonLevel }); }
        }
        bus.emit('player:xp_change');
    }

    get xpToNext() { return XP_TABLE[Math.min(this.level - 1, XP_TABLE.length - 1)]; }

    allocateStat(stat) {
        if (this.statPoints <= 0) return false;
        switch (stat) { case 'str': this.baseStr++; break; case 'dex': this.baseDex++; break; case 'vit': this.baseVit++; break; case 'int': this.baseInt++; break; default: return false; }
        this.statPoints--; this._statsDirty = true; this._recalcStats(); return true;
    }

    _paragonStats() {
        if (!this.paragonStats) return {};
        const s = {}, p = this.paragonStats;
        if (p.core.str) s.flatSTR = p.core.str * 5; if (p.core.dex) s.flatDEX = p.core.dex * 5; if (p.core.int) s.flatINT = p.core.int * 5; if (p.core.vit) s.flatVIT = p.core.vit * 5;
        if (p.offense.ias) s.pctIAS = p.offense.ias * 0.5; if (p.offense.crit) s.critChance = p.offense.crit * 0.2;
        if (p.defense.armor) s.flatArmor = p.defense.armor * 100; if (p.defense.res) s.allRes = p.defense.res * 1.5;
        if (p.utility.mf) s.magicFind = p.utility.mf * 2; if (p.utility.gf) s.goldFind = p.utility.gf * 2;
        return s;
    }

    allocateParagonPoint(category, stat) {
        if (this.paragonPoints <= 0 || !this.paragonStats[category]) return false;
        this.paragonStats[category][stat]++; this.paragonPoints--; this._statsDirty = true; this._recalcStats(); return true;
    }

    canEquip(item) {
        if (!item) return { ok: false, reason: 'No item' };
        if (['charm', 'gem', 'rune', 'potion', 'scroll', 'material', 'tome'].includes(item.type)) return { ok: false, reason: `Cannot equip ${item.type}s` };
        if (!item.slot || item.slot === 'none') return { ok: false, reason: 'Item cannot be equipped' };
        const req = item.req || {};
        if (req.str && this.str < req.str) return { ok: false, reason: `Requires ${req.str} Strength` };
        if (req.dex && this.dex < req.dex) return { ok: false, reason: `Requires ${req.dex} Dexterity` };
        if (req.int && this.int < req.int) return { ok: false, reason: `Requires ${req.int} Intellect` };
        if (req.vit && this.vit < req.vit) return { ok: false, reason: `Requires ${req.vit} Vitality` };
        if (item.reqLvl && this.level < item.reqLvl) return { ok: false, reason: `Requires Level ${item.reqLvl}` };
        return { ok: true };
    }

    equip(item, targetSlot = null) {
        const check = this.canEquip(item); if (!check.ok) return { error: check.reason };
        let slot = targetSlot || item.slot;
        if (!targetSlot && slot === 'ring1') slot = this.equipment.ring1 ? (this.equipment.ring2 ? 'ring1' : 'ring2') : 'ring1';
        if (item.twoHanded && slot === 'mainhand' && this.equipment.offhand) this.addToInventory(this.unequip('offhand'));
        if (slot === 'offhand' && this.equipment.mainhand?.twoHanded) this.addToInventory(this.unequip('mainhand'));
        const old = this.equipment[slot] || null; this.equipment[slot] = item; this._statsDirty = true; this._recalcStats(); return { success: true, swapped: old };
    }

    unequip(slot) {
        const item = this.equipment[slot]; if (!item) return null;
        delete this.equipment[slot]; this._statsDirty = true; this._recalcStats(); return item;
    }

    swapWeapons() {
        const m = this.equipment.mainhand, o = this.equipment.offhand;
        this.equipment.mainhand = this.secondaryEquipment.mainhand; this.equipment.offhand = this.secondaryEquipment.offhand;
        this.secondaryEquipment.mainhand = m; this.secondaryEquipment.offhand = o;
        this.activeWeaponSet = this.activeWeaponSet === 1 ? 2 : 1;
        this._statsDirty = true; this._recalcStats();
    }

    useItem(idx) {
        const item = this.inventory[idx]; if (!item) return;
        if (item.baseId === 'book_of_skill') { this.talents.unspent++; this.inventory[idx] = null; if (fx) fx.emitLevelUp(this.x, this.y); return true; }
        if (item.type === 'potion') { this.inventory[idx] = null; this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.35); return true; }
        return false;
    }

    usePotion(slot) {
        const item = this.belt[slot]; if (!item) return;
        let rHp = 0, rMp = 0, inst = false;
        if (item.baseId === 'health_potion') rHp = this.maxHp * 0.35;
        if (item.baseId === 'mana_potion') rMp = this.maxMp * 0.35;
        if (item.baseId === 'rejuv_potion') { rHp = this.maxHp * 0.5; rMp = this.maxMp * 0.5; inst = true; }
        if (inst) { this.hp = Math.min(this.maxHp, this.hp + rHp); this.mp = Math.min(this.maxMp, this.mp + rMp); }
        else { this.hpBuffer += rHp; this.mpBuffer += rMp; }
        const bId = item.baseId; this.belt[slot] = null;
        const iIdx = this.inventory.findIndex(x => x && x.baseId === bId);
        if (iIdx !== -1) { this.belt[slot] = this.inventory[iIdx]; this.inventory[iIdx] = null; }
        this._statsDirty = true; this._recalcStats();
    }

    addToInventory(item) {
        if (!item) return false;
        if (item.type === 'potion') { const bIdx = this.belt.indexOf(null); if (bIdx !== -1) { this.belt[bIdx] = item; return true; } }
        if (['gem', 'rune', 'scroll'].includes(item.type)) {
            const eIdx = this.inventory.findIndex(x => x && x.baseId === item.baseId && x.type === item.type && (x.quantity || 1) < 20);
            if (eIdx !== -1) {
                this.inventory[eIdx].quantity = (this.inventory[eIdx].quantity || 1) + (item.quantity || 1);
                if (this.inventory[eIdx].quantity > 20) { const rem = this.inventory[eIdx].quantity - 20; this.inventory[eIdx].quantity = 20; return this.addToInventory({ ...item, quantity: rem }); }
                return true;
            }
        }
        const idx = this.inventory.indexOf(null); if (idx === -1) return false;
        this.inventory[idx] = item; if (!this.inventory[idx].quantity) this.inventory[idx].quantity = 1;
        this._statsDirty = true; this._recalcStats(); return true;
    }

    sortInventory() {
        const items = this.inventory.filter(x => x !== null), types = ['gem', 'rune', 'scroll'];
        for (let i = 0; i < items.length; i++) {
            if (!items[i] || !types.includes(items[i].type) || items[i].quantity >= 20) continue;
            for (let j = i+1; j < items.length; j++) {
                if (items[j] && items[j].baseId === items[i].baseId && items[j].type === items[i].type && items[j].quantity < 20) {
                    const r = 20 - items[i].quantity, t = Math.min(r, items[j].quantity);
                    items[i].quantity += t; items[j].quantity -= t; if (items[j].quantity <= 0) items[j] = null;
                    if (items[i].quantity >= 20) break;
                }
            }
        }
        const srt = items.filter(x => x !== null), rW = { unique: 10, set: 9, rare: 8, magic: 7, normal: 6 }, tW = { weapon: 10, armor: 9, helm: 8, shield: 7, gloves: 6, boots: 5, belt: 4, amulet: 3, ring: 2, charm: 1, gem: 0, rune: 0, scroll: 0, potion: 0 };
        srt.sort((a, b) => (tW[b.type]||-1) - (tW[a.type]||-1) || (rW[b.rarity]||0) - (rW[a.rarity]||0) || (a.baseId||"").localeCompare(b.baseId||""));
        this.inventory = [...srt]; while (this.inventory.length < 40) this.inventory.push(null);
        this.autoRefillBelt();
    }

    autoRefillBelt() {
        if (!this.belt) return; let ref = false;
        for (let i = 0; i < this.belt.length; i++) { if (this.belt[i] === null) { const pIdx = this.inventory.findIndex(x => x && x.type === 'potion'); if (pIdx !== -1) { this.belt[i] = this.inventory[pIdx]; this.inventory[pIdx] = null; ref = true; } } }
        if (ref) { const itms = this.inventory.filter(x => x !== null); this.inventory = [...itms]; while (this.inventory.length < 40) this.inventory.push(null); }
    }

    gainXp(amt) { this.addXp(amt); }

    render(ctx, renderer, time) {
        // --- Champion Radiance (#1 Rank Visual) ---
        if (this._isTopRanker) {
            const glowPulse = Math.sin(time * 3) * 0.5 + 0.5;
            ctx.save();
            ctx.shadowBlur = 15 + glowPulse * 10;
            ctx.shadowColor = '#ffd700';
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + glowPulse * 0.2})`;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(this.x, this.y, 20, 0, Math.PI * 2); ctx.stroke();
            
            // --- ARCHANGEL WINGS ---
            const flap = Math.sin(time * 6) * 5;
            ctx.fillStyle = `rgba(255, 255, 200, ${0.4 + glowPulse * 0.2})`;
            ctx.beginPath();
            ctx.moveTo(this.x - 2, this.y - 10);
            ctx.quadraticCurveTo(this.x - 20, this.y - 30 + flap, this.x - 25, this.y - 5 + flap);
            ctx.lineTo(this.x - 5, this.y - 5);
            ctx.moveTo(this.x + 2, this.y - 10);
            ctx.quadraticCurveTo(this.x + 20, this.y - 30 + flap, this.x + 25, this.y - 5 + flap);
            ctx.lineTo(this.x + 5, this.y - 5);
            ctx.fill();
            
            if (Math.random() < 0.15) {
                this._auraParticles = this._auraParticles || [];
                this._auraParticles.push({
                    x: this.x + (Math.random() - 0.5) * 40,
                    y: this.y - 15,
                    vy: -0.8 - Math.random() * 1.2,
                    life: 1.2, color: '#ffd700', type: 'glory'
                });
            }
            ctx.restore();
        }

        // --- Hardcore Champion Radiance (#1 HC Visual) ---
        if (this._isTopHardcore) {
            ctx.save();
            const darkPulse = Math.sin(time * 2) * 0.5 + 0.5;
            ctx.shadowBlur = 10 + darkPulse * 5;
            ctx.shadowColor = '#a040ff';
            ctx.strokeStyle = `rgba(160, 64, 255, ${0.2 + darkPulse * 0.3})`;
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(this.x, this.y, 25, 0, Math.PI * 2); ctx.stroke();

            // Rising Shadow Souls
            if (Math.random() < 0.1) {
                this._auraParticles = this._auraParticles || [];
                this._auraParticles.push({
                    x: this.x + (Math.random() - 0.5) * 30,
                    y: this.y + 5,
                    vy: -0.4 - Math.random() * 0.6,
                    life: 1.5, color: '#a040ff', type: 'shadow_soul'
                });
            }
            ctx.restore();
        }

        // --- Legendary Aura Stacking Visuals & Particles ---
        if (this.itemAuras) {
            let radiusOffset = 0;
            this._auraParticles = this._auraParticles || [];
            
            const drawAuraRing = (color, type) => {
                const radius = 22 + radiusOffset;
                const pulse = Math.sin(time * 5) * 2;
                ctx.save();
                ctx.globalAlpha = 0.25;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, radius + pulse, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                // Spawn Particles periodically
                if (Math.random() < 0.1) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * radius;
                    this._auraParticles.push({
                        x: this.x + Math.cos(angle) * dist,
                        y: this.y + Math.sin(angle) * dist,
                        vy: -0.5 - Math.random() * 1.0,
                        life: 1.0,
                        color: color,
                        type: type
                    });
                }
                radiusOffset += 5;
            };

            if (this.itemAuras.has('shadowmourne')) drawAuraRing('#a040ff', 'skull');
            if (this.itemAuras.has('frostmourne')) drawAuraRing('#00ffff', 'ice');
            if (this.itemAuras.has('ashbringer')) drawAuraRing('#ffd700', 'holy');

            // Render rising particles
            this._auraParticles.forEach((p, i) => {
                p.y += p.vy;
                p.life -= 0.02;
                ctx.save();
                ctx.globalAlpha = p.life * 0.6;
                ctx.fillStyle = p.color;
                if (p.type === 'skull') {
                    ctx.font = '8px Arial';
                    ctx.fillText('💀', p.x - 4, p.y);
                } else if (p.type === 'ice') {
                    ctx.fillRect(p.x, p.y, 2, 2);
                } else if (p.type === 'glory') {
                    ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
                } else if (p.type === 'shadow_soul') {
                    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
                    ctx.shadowBlur = 5; ctx.shadowColor = '#fff';
                } else {
                    ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI*2); ctx.fill();
                }
                ctx.restore();
                if (p.life <= 0) this._auraParticles.splice(i, 1);
            });
        }

        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(this.x, this.y + 5, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.icon, this.x, this.y - 2);
        const w = 16, h = 2; ctx.fillStyle = '#1a0000'; ctx.fillRect(this.x - w / 2, this.y - 12, w, h);
        ctx.fillStyle = '#e03030'; ctx.fillRect(this.x - w / 2, this.y - 12, w * (this.hp / this.maxHp), h);
    }

    serialize() {
        return {
            classId: this.classId, level: this.level, xp: this.xp, charName: this.charName, isHardcore: this.isHardcore, 
            maxDifficulty: this.maxDifficulty || 0,
            x: this.x, y: this.y, hp: this.hp, mp: this.mp, baseStr: this.baseStr, baseDex: this.baseDex, baseVit: this.baseVit, baseInt: this.baseInt,
            statPoints: this.statPoints, gold: this.gold, totalMonstersSlain: this.totalMonstersSlain, totalGoldCollected: this.totalGoldCollected,
            talents: this.talents.serialize(), equipment: this.equipment, secondaryEquipment: this.secondaryEquipment, activeWeaponSet: this.activeWeaponSet,
            inventory: this.inventory, belt: this.belt, hotbar: this.hotbar, permanentResists: this.permanentResists, hasLarzukReward: this.hasLarzukReward,
            hasAnyaReward: this.hasAnyaReward, hasImbue: this.hasImbue, magicFind: this.magicFind || 0, goldFind: this.goldFind || 0,
            crushingBlow: this.crushingBlow || 0, allSkillBonus: this.allSkillBonus || 0, activeAura: this.activeAura, _auraSlvl: this._auraSlvl,
            mercenary: window.mercenary ? window.mercenary.serialize() : null
        };
    }

    static deserialize(data) {
        const p = new Player(data.classId); p.charName = data.charName || p.className; p.isHardcore = !!data.isHardcore; p.maxDifficulty = data.maxDifficulty || 0;
        p.level = data.level; p.xp = data.xp; p.x = data.x; p.y = data.y; p.hp = data.hp; p.mp = data.mp;
        p.baseStr = data.baseStr; p.baseDex = data.baseDex; p.baseVit = data.baseVit; p.baseInt = data.baseInt;
        p.statPoints = data.statPoints; p.gold = data.gold; p.totalMonstersSlain = data.totalMonstersSlain || 0; p.totalGoldCollected = data.totalGoldCollected || 0;
        p.talents = TalentTree.deserialize(data.talents); p.equipment = data.equipment || {}; p.secondaryEquipment = data.secondaryEquipment || { mainhand: null, offhand: null };
        p.activeWeaponSet = data.activeWeaponSet || 1; p.inventory = data.inventory || Array(40).fill(null); p.belt = data.belt || [null, null, null, null];
        p.hotbar = data.hotbar || [null, null, null, null, null]; p.permanentResists = data.permanentResists || 0; p.hasLarzukReward = !!data.hasLarzukReward;
        p.hasAnyaReward = !!data.hasAnyaReward; p.hasImbue = !!data.hasImbue; p.magicFind = data.magicFind || 0; p.goldFind = data.goldFind || 0;
        p.crushingBlow = data.crushingBlow || 0; p.allSkillBonus = data.allSkillBonus || 0; p.activeAura = data.activeAura || null; p._auraSlvl = data._auraSlvl || 0;
        
        if (data.mercenary) {
            import('./mercenary.js').then(({ Mercenary }) => {
                window.mercenary = Mercenary.deserialize(data.mercenary);
            });
        }

        p._recalcStats(); return p;
    }
}
