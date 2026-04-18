/**
 * Player Entity — stats, movement, leveling, item bonuses, skill use
 */
import { bus } from '../engine/EventBus.js';
import { Pathfinder } from '../world/pathfinding.js';
import { TalentTree } from '../systems/talentTree.js';
import { getClass, getSkillMap } from '../data/classes.js';
import { calcDamage, applyDamage, applyDot, skillDamage, skillType, DMG_TYPE } from '../systems/combat.js';
import { SETS } from '../systems/lootSystem.js';
import { RARITY } from '../data/items.js';
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
        
        // Paragon System (Phase 23)
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
        this.totalGoldCollected = 0;
        this.charName = cls.name; // Character name (user can customize)
        this.baseStr = cls.stats.str;
        this.baseDex = cls.stats.dex;
        this.baseVit = cls.stats.vit;
        this.baseInt = cls.stats.int;

        this.fleeTimer = 0;
        this.hitFlashTimer = 0;
        this.lastAttacker = null;

        // Talent tree
        this.talents = new TalentTree(classId);

        // Equipment & Inventory
        this.equipment = {}; // slot → item
        this.secondaryEquipment = { mainhand: null, offhand: null };
        this.activeWeaponSet = 1;
        this.inventory = Array(40).fill(null); // 10×4 grid
        this.belt = Array(4).fill(null); // 4 potion slots

        // Hotbar: skillId assignments
        this.hotbar = [null, null, null, null, null];
        this.cooldowns = [0, 0, 0, 0, 0];
        this.minions = []; // Active summons
        this.maxMinions = 5;
        this.comboPoints = 0; // Phase 31: Rogue Combo System
        this.maxComboPoints = 5;

        // Movement
        this.path = [];
        this.pathfinder = new Pathfinder();
        this.moveSpeed = MOVE_SPEED_BASE;
        this.attackTarget = null;
        this.attackCd = 0;
        this.pushX = 0; this.pushY = 0;

        // Active effects
        this._dots = [];
        this._buffs = [];
        this.hpBuffer = 0;
        this.mpBuffer = 0;

        // Aura (paladin)
        this.activeAura = null;

        // Permanent Rewards (Quests)
        this.permanentResists = 0;
        this.hasLarzukReward = false;
        this.hasAnyaReward = false;

        // Skill map ref
        this.skillMap = getSkillMap(classId);

        // Listen
        bus.on('input:click', d => this._onClick(d));
        bus.on('player:applyAuraSlow', d => {
            if (this.hp <= 0) return;
            this._auraSlow = d.factor; // e.g. 0.5 for 50% slow
            this._auraSlowTimer = d.duration; // e.g. 0.2s
        });
        for (let i = 0; i < 5; i++) {
            bus.on(`skill:use:${i}`, d => this._useSkill(i, d));
        }

        // Finalize stats last
        this._recalcStats();
        this.hp = this.maxHp;
        this.mp = this.maxMp;

        bus.on('player:gainXp', d => this.gainXp(d.amount));
    }

    // ─── Stats ───
    _recalcStats() {
        const s = this._gearStats();
        const ts = this._talentStats();
        for (const k in ts) s[k] = (s[k] || 0) + ts[k];

        for (const b of this._buffs) {
            if (b.id === 'battle_orders') { s.flatHP = (s.flatHP||0) + b.base*5; s.flatMP = (s.flatMP||0) + b.base*2; }
            if (b.id === 'shout') s.pctArmor = (s.pctArmor||0) + b.base;
            if (b.id === 'fortify') s.flatArmor = (s.flatArmor||0) + b.base * 15;
            if (b.id === 'burst_of_speed') { s.pctMoveSpeed = (s.pctMoveSpeed||0) + b.base; s.pctIAS = (s.pctIAS||0) + b.base*2; }
            if (b.id === 'holy_shield' || b.id === 'divine_shield') { s.blockChance = (s.blockChance||0) + b.base/2; s.pctArmor = (s.pctArmor||0) + b.base; }
            
            // Shrine Buffs
            if (b.id === 'shrine_armor') s.pctArmor = (s.pctArmor||0) + b.value;
            if (b.id === 'shrine_damage') s.pctDmg = (s.pctDmg||0) + b.value;
            if (b.id === 'shrine_mana') s.manaRegenPerSec = (s.manaRegenPerSec||0) + (this.maxMp * (b.value / 100));
            if (b.id === 'shrine_resist') s.allRes = (s.allRes||0) + b.value;
            if (b.id === 'shrine_speed') s.pctMoveSpeed = (s.pctMoveSpeed||0) + b.value;
            // shrine_exp is handled locally in the kill loop where XP is awarded
        }

        // --- Charms Logic (Wave 6) ---
        // Scan inventory for items that provide stats while carried.
        // Requires identification to work.
        const activeUniques = new Set();
        if (this.inventory && Array.isArray(this.inventory)) {
            for (const item of this.inventory) {
                if (item && item.type === 'charm' && item.identified !== false) {
                    // Unique check: Only one of each unique charm ID counts
                    if (item.rarity === 'unique') {
                        if (activeUniques.has(item.id)) continue;
                        activeUniques.add(item.id);
                    }
                    this._addItemStats(item, s);
                }
            }
        }

        // --- Phase 23: Paragon Stats ---
        const ps = this._paragonStats();
        
        // Consolidate core attributes (Handle both 'str' and 'flatSTR' naming)
        this.str = this.baseStr + (s.str || 0) + (s.flatSTR || 0) + (ps.flatSTR || 0);
        this.dex = this.baseDex + (s.dex || 0) + (s.flatDEX || 0) + (ps.flatDEX || 0);
        this.vit = this.baseVit + (s.vit || 0) + (s.flatVIT || 0) + (ps.flatVIT || 0);
        this.int = this.baseInt + (s.int || 0) + (s.flatINT || 0) + (ps.flatINT || 0);

        // Multipliers and Modifiers integration (IAS, Crit, etc)
        for (const k in ps) { 
            if (!k.startsWith('flat')) s[k] = (s[k] || 0) + ps[k]; 
        }

        this.maxHp = Math.round((50 + this.vit * 8 + this.level * 5 + (s.flatHP || 0)) * (1 + (s.pctHP || 0) / 100));
        this.maxMp = Math.round((30 + this.int * 5 + this.level * 3 + (s.flatMP || 0)) * (1 + (s.pctMP || 0) / 100));
        this.armor = (s.flatArmor || 0) * (1 + (s.pctArmor || 0) / 100);

        this.critChance = 5 + (s.critChance || 0);
        this.critMulti = 150 + (s.critMulti || 0);
        this.lifeStealPct = s.lifeStealPct || 0;
        this.manaStealPct = s.manaStealPct || 0;
        this.moveSpeed = MOVE_SPEED_BASE * (1 + (s.pctMoveSpeed || 0) / 100);

        // --- Phase 23: Aura Slow Logic ---
        this._auraSlowFactor = 1.0;
        if (this._auraSlowTimer > 0) {
            this._auraSlowFactor = (1 - (this._auraSlow || 0));
            this.moveSpeed *= this._auraSlowFactor;
        }

        // Damage reduction (from uniques like Shaft of Anguish, Doombringer, set bonuses)
        this.pctDmgReduce = s.pctDmgReduce || 0;
        this.flatDmgReduce = s.flatDmgReduce || 0;
        this.magicDmgReduce = s.magicDmgReduce || 0;

        // Thorns (reflect damage back to melee attackers)
        this.thorns = s.thorns || 0;

        // Regeneration
        this.lifeRegenPerSec = s.lifeRegenPerSec || 0;
        this.manaRegenPerSec = s.manaRegenPerSec || 0;

        // --- Active Aura Stat Bonuses ---
        if (this.activeAura) {
            const slvl = this._auraSlvl || 1;
            switch(this.activeAura) {
                case 'might_aura':
                    this.pctDmg = (this.pctDmg || 0) + (20 + slvl * 2);
                    break;
                case 'resist_all':
                    const resBonus = (5 + slvl * 1.5);
                    s.allRes = (s.allRes || 0) + resBonus;
                    break;
                case 'vigor':
                    this.moveSpeed *= (1 + (20 + slvl * 1.5) / 100);
                    break;
                case 'fanaticism':
                    this.pctIAS = (this.pctIAS || 0) + (30 + slvl * 1.5);
                    this.pctDmg = (this.pctDmg || 0) + (30 + slvl * 2);
                    break;
            }
        }

        // Resistances
        const diff = typeof window !== 'undefined' && window._difficulty ? window._difficulty : 0;
        const resPenalty = diff === 2 ? 100 : (diff === 1 ? 40 : 0);
        const permRes = this.permanentResists || 0;
        for (const r of ['fireRes', 'coldRes', 'lightRes', 'poisRes', 'shadowRes']) {
            this[r] = Math.max(-100, Math.min(75, (s[r] || 0) + (s.allRes || 0) + permRes - resPenalty));
        }

        // Damage bonuses
        this.pctDmg = s.pctDmg || 0;
        for (const t of ['Fire', 'Cold', 'Light', 'Poison', 'Shadow', 'Holy']) {
            this[`pct${t}Dmg`] = s[`pct${t}Dmg`] || 0;
        }
        this.flatMinDmg = s.flatMinDmg || 0;
        this.pctIAS = s.pctIAS || 0;

        // Magic Find & Gold Find (Difficulty Bonuses)
        let diffMF = 0;
        if (diff === 1) diffMF = 30;
        else if (diff === 2) diffMF = 100;

        this.magicFind = (s.magicFind || 0) + diffMF;
        this.goldFind = (s.goldFind || 0) + diffMF;

        // Poison damage (from affixes like Pestilent weapons)
        this.poisonDmgPerSec = s.poisonDmgPerSec || 0;

        // Weapon damage
        const wep = (this.equipment && this.equipment.mainhand);
        this.wepMin = wep ? (wep.minDmg || 1) + (s.flatMinDmg || 0) : 1 + (s.flatMinDmg || 0);
        this.wepMax = wep ? (wep.maxDmg || 3) + (s.flatMaxDmg || 0) : 3 + (s.flatMaxDmg || 0);
        
        let baseAtkSpd = (wep?.atkSpd || 1.0) * (1 + (this.pctIAS || 0) / 100);
        // Correctly apply aura slow to attack speed here so it isn't overwritten
        this.atkSpd = baseAtkSpd * (this._auraSlowFactor < 1 ? (1 - (1 - this._auraSlowFactor) * 0.5) : 1);
        
        // Attack Range
        this.attackRange = wep && wep.range ? Math.max(30, wep.range) : 30;

        // Light Radius
        // Base is now 0, added to 240 in main.js. Let's make it more substantial.
        const radianceLvl = this.effectiveSkillLevel('radiance');
        this.lightRadius = (s.lightRadius || 0) + (radianceLvl * 15);

        // Special flags
        this.cannotBeFrozen = !!s.cannotBeFrozen;

        // Life/Mana after kill
        this.manaAfterKill = s.manaAfterKill || 0;
        this.lifeAfterKill = s.lifeAfterKill || 0;
    }
    _gearStats() {
        const s = {};
        const equip = this.equipment || {};
        const setCounts = {};

        // 1. Equipped Items
        for (const item of Object.values(equip)) {
            if (!item || item.identified === false) continue;
            
            // Broken items provide NO stats
            if (item.maxDurability > 0 && item.durability === 0) continue;

            this._addItemStats(item, s);

            if (item.rarity === RARITY.SET && item.setId) {
                setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
            }
        }

        // Apply Tiered Set Bonuses
        for (const [setId, count] of Object.entries(setCounts)) {
            const def = SETS[setId];
            if (def && def.bonuses && count >= 2) {
                for (let tier = 2; tier <= count; tier++) {
                    const mods = def.bonuses[tier];
                    if (mods) {
                        for (const mod of mods) {
                            if (mod.stat.startsWith('+') && !['+allSkills', '+classSkills', '+skill', '+skillGroup'].some(p => mod.stat.startsWith(p))) {
                                // Allow '+' stats like '+10 Strength' if they aren't skills
                                s[mod.stat] = (s[mod.stat] || 0) + mod.value;
                            } else if (!mod.stat.startsWith('+')) {
                                s[mod.stat] = (s[mod.stat] || 0) + mod.value;
                            }
                        }
                    }
                }
            }
        }

        // 2. Charms in Inventory (Phase 30 Finalization)
        const activeUniques = new Set();
        if (this.inventory && Array.isArray(this.inventory)) {
            for (const item of this.inventory) {
                if (item && item.type === 'charm' && item.identified !== false) {
                    // Unique check: Only one of each unique charm ID counts
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
            // Use raw points for passives base length to avoid recursive stat scaling loops
            const slvl = pts; 
            
            // Hardcoded mapping for passive skill nodes across all classes
            if (skillId.includes('_mastery') || skillId === 'venom') {
                if (skillId === 'combat_mastery' || skillId === 'feral_mastery') { ts.pctDmg = (ts.pctDmg||0) + 5*slvl; ts.critChance = (ts.critChance||0) + 2*slvl; }
                if (skillId === 'iron_skin') { ts.pctArmor = (ts.pctArmor||0) + 10*slvl; }
                if (skillId === 'block_mastery') { ts.blockChance = (ts.blockChance||0) + 1*slvl; ts.pctArmor = (ts.pctArmor||0) + 3*slvl; }
                if (skillId === 'fire_mastery') ts.pctFireDmg = (ts.pctFireDmg||0) + 5*slvl;
                if (skillId === 'cold_mastery') ts.pctColdDmg = (ts.pctColdDmg||0) + 5*slvl;
                if (skillId === 'light_mastery') ts.pctLightDmg = (ts.pctLightDmg||0) + 5*slvl;
                if (skillId === 'shadow_mastery' || skillId === 'aff_mastery' || skillId === 'bone_mastery') ts.pctShadowDmg = (ts.pctShadowDmg||0) + 5*slvl;
                if (skillId === 'pois_mastery' || skillId === 'venom') ts.pctPoisonDmg = (ts.pctPoisonDmg||0) + 5*slvl;
                if (skillId === 'holy_mastery' || skillId === 'aura_mastery') ts.pctHolyDmg = (ts.pctHolyDmg||0) + 5*slvl;
                if (skillId === 'elem_mastery' || skillId === 'nature_mastery') { ts.pctFireDmg=(ts.pctFireDmg||0)+3*slvl; ts.pctColdDmg=(ts.pctColdDmg||0)+3*slvl; ts.pctLightDmg=(ts.pctLightDmg||0)+3*slvl; }
                if (skillId === 'bow_mastery' || skillId === 'trap_mastery' || skillId === 'trap_mastery_r') ts.pctDmg = (ts.pctDmg||0) + 5*slvl;
            }
            if (skillId === 'life_tap' || skillId === 'soul_link') ts.lifeStealPct = (ts.lifeStealPct||0) + 2*slvl;
            if (skillId === 'demon_armor') { ts.flatArmor = (ts.flatArmor||0) + 20*slvl; ts.allRes = (ts.allRes||0) + 2*slvl; }
            if (skillId === 'lethality') ts.critMulti = (ts.critMulti||0) + 10*slvl;
            if (skillId === 'chain_reaction') ts.critChance = (ts.critChance||0) + 1*slvl;
            
            // Phase 20: Radiance (Light Radius & Resists)
            if (skillId === 'radiance') {
                ts.allRes = (ts.allRes || 0) + 2 * slvl;
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
                    if (mod.stat.startsWith('+') && !['+allSkills', '+classSkills', '+skill', '+skillGroup'].some(p => mod.stat.startsWith(p))) {
                        // Allow '+' stats like '+10 Strength' if they aren't skills
                        s[mod.stat] = (s[mod.stat] || 0) + mod.value;
                    } else if (!mod.stat.startsWith('+')) {
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
                    s[eff.stat] = (s[eff.stat] || 0) + eff.value;
                }
            }
        }
    }

    /** Get total +skill bonus for a specific skillId from gear */
    getSkillBonus(skillId) {
        let bonus = 0;
        const setCounts = {};

        for (const item of Object.values(this.equipment)) {
            if (!item || item.identified === false) continue;
            
            // Item inherent mods
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

        // Charms in inventory also grant skill bonuses
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

        // Apply Tiered Set Bonuses for Skills
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
        const gearBonus = this.allSkillBonus || 0;
        return base > 0 ? (base + gearBonus) : 0; // Only bonus if skill is unlocked
    }

    // ─── Movement ───
    _onClick(data) {
        if (!this._dungeon) return;
        const world = this._camera.toWorld(data.screenX, data.screenY);

        // Check if clicked on enemy
        const enemy = this._findEnemyAt(world.x, world.y);
        if (enemy) { this.attackTarget = enemy; return; }

        this.attackTarget = null;
        this.path = this.pathfinder.find(
            this._dungeon.grid, this.x, this.y, world.x, world.y, this._dungeon.tileSize
        );
    }

    _findEnemyAt(wx, wy) {
        if (!this._enemies) return null;
        for (const e of this._enemies) {
            if (e.hp <= 0) continue;
            const dx = e.x - wx, dy = e.y - wy;
            if (dx * dx + dy * dy < 144) return e; // 12px radius
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

        // Apply push momentum (knockback from enemy hits)
        if (Math.abs(this.pushX) > 0.5 || Math.abs(this.pushY) > 0.5) {
            const nextX = this.x + this.pushX * dt;
            const nextY = this.y + this.pushY * dt;
            if (dungeon && dungeon.isWalkable(nextX, nextY)) {
                this.x = nextX;
                this.y = nextY;
            }
            this.pushX *= 0.85; // Stronger friction for faster decay
            this.pushY *= 0.85;
            // Hard zero to prevent infinite drift
            if (Math.abs(this.pushX) < 0.5) this.pushX = 0;
            if (Math.abs(this.pushY) < 0.5) this.pushY = 0;
        } else {
            this.pushX = 0;
            this.pushY = 0;
        }

        if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
        
        // --- Phase 23: Aura Slow Logic ---
        if (this._auraSlowTimer > 0) {
            this._auraSlowTimer -= dt;
            if (this._auraSlowTimer <= 0) {
                this._auraSlow = 0;
                this._recalcStats();
            }
        }

        // Recovery Logic: Regen and Potions
        this.hp = Math.min(this.maxHp, this.hp + (this.lifeRegenPerSec || 0) * dt);
        this.mp = Math.min(this.maxMp, this.mp + ((2 + this.int * 0.05) + (this.manaRegenPerSec || 0)) * dt);

        // --- Potion HoT Logic ---
        if (this.hpBuffer > 0 && this.hp < this.maxHp) {
            const healSpeed = this.maxHp * 0.1 * dt; // heal 10% max hp per second
            const heal = Math.min(this.hpBuffer, healSpeed);
            this.hp = Math.min(this.maxHp, this.hp + heal);
            this.hpBuffer -= heal;
            if (fx && Math.random() < 0.1) fx.emitHeal(this.x, this.y);
        }
        if (this.mpBuffer > 0 && this.mp < this.maxMp) {
            const restoreSpeed = this.maxMp * 0.1 * dt;
            const restore = Math.min(this.mpBuffer, restoreSpeed);
            this.mp = Math.min(this.maxMp, this.mp + restore);
            this.mpBuffer -= restore;
        }

        // --- Periodic Aura Effects ---
        if (this.activeAura) {
            this._auraTimer = (this._auraTimer || 0) + dt;
            const slvl = this._auraSlvl || 1;

            if (this._auraTimer >= 1.0) { // Pulse every 1s
                this._auraTimer = 0;
                
                if (this.activeAura === 'prayer_aura') {
                    const heal = 2 + slvl * 1;
                    this.hp = Math.min(this.maxHp, this.hp + heal);
                    if (fx && fx.emitHeal) fx.emitHeal(this.x, this.y);
                }
                
                if (this.activeAura === 'holy_fire_aura') {
                    const dmg = 3 + slvl * 2;
                    if (enemies) {
                        enemies.forEach(e => {
                            if (e.hp <= 0) return; // FIX: Don't hit dead enemies
                            const dx = e.x - this.x, dy = e.y - this.y;
                            if (dx*dx+dy*dy < 150*150) { // 150px range
                                applyDamage(this, e, { dealt: dmg, isCrit: false, type: 'fire' }, 'holy_fire_aura');
                                if (fx) fx.emitBurst(e.x, e.y, '#ff4000', 5);
                            }
                        });
                    }
                }

                if (this.activeAura === 'conviction') {
                    const debuff = 30 + slvl * 2;
                    if (enemies) {
                        enemies.forEach(e => {
                            if (e.hp <= 0) {
                                e.armorDebuff = 0;
                                e.resDebuff = 0;
                                return;
                            }
                            const dx = e.x - this.x, dy = e.y - this.y;
                            if (dx*dx+dy*dy < 180*180) { // 180px range
                                e.armorDebuff = debuff;
                                e.resDebuff = debuff;
                                if (Math.random() < 0.3) fx.emitBurst(e.x, e.y, '#a040ff', 3);
                            } else {
                                e.armorDebuff = 0;
                                e.resDebuff = 0;
                            }
                        });
                    }
                }
            }
        } else {
            if (enemies) {
                enemies.forEach(e => { e.armorDebuff = 0; e.resDebuff = 0; });
            }
        }

        // Cooldowns
        for (let i = 0; i < 5; i++) {
            if (this.cooldowns[i] > 0) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - dt);
        }
        this.attackCd = Math.max(0, this.attackCd - dt);

        this.stateTimer += dt;

        let buffsChanged = false;
        for (let i = this._buffs.length - 1; i >= 0; i--) {
            this._buffs[i].duration -= dt;
            if (this._buffs[i].duration <= 0) {
                this._buffs.splice(i, 1);
                buffsChanged = true;
            }
        }
        if (buffsChanged) this._recalcStats();

        let movedThisFrame = false;
        let moveDx = 0, moveDy = 0;

        // --- Terrain-based Movement Penalty ---
        let finalMoveSpeed = this.moveSpeed;
        if (dungeon) {
            const gx = Math.floor(this.x / dungeon.tileSize);
            const gy = Math.floor(this.y / dungeon.tileSize);
            if (gx >= 0 && gx < dungeon.width && gy >= 0 && gy < dungeon.height) {
                const tile = dungeon.grid[gy][gx];
                if (tile === 8) { // TILE.WATER
                    finalMoveSpeed *= 0.5; // 50% slow in water
                } else if (tile === 13) { // TILE.LAVA
                    finalMoveSpeed *= 0.7; // 30% slow in lava
                }
            }
        }

        // Helper for sliding collision with radius-based checks
        const PLAYER_RADIUS = 5; // collision radius in pixels
        const tryMove = (dx, dy) => {
            moveDx = dx; moveDy = dy;
            movedThisFrame = true;
            if (!dungeon) {
                this.x += dx; this.y += dy; return;
            }
            // Waller check (elite affix)
            const walls = (window.aoeZones || []).filter(z => z.active && z.isWall);
            const isBlockedByWall = (tx, ty) => {
                return walls.some(w => Math.hypot(tx - w.x, ty - w.y) < w.radius);
            };

            // Check all 4 corners of the player's hitbox
            const canMove = (tx, ty) => {
                return dungeon.isWalkable(tx - PLAYER_RADIUS, ty - PLAYER_RADIUS)
                    && dungeon.isWalkable(tx + PLAYER_RADIUS, ty - PLAYER_RADIUS)
                    && dungeon.isWalkable(tx - PLAYER_RADIUS, ty + PLAYER_RADIUS)
                    && dungeon.isWalkable(tx + PLAYER_RADIUS, ty + PLAYER_RADIUS)
                    && !isBlockedByWall(tx, ty);
            };

            const nx = this.x + dx, ny = this.y + dy;
            if (canMove(nx, ny)) {
                this.x = nx; this.y = ny;
            } else if (dx !== 0 && canMove(this.x + dx, this.y)) {
                this.x += dx; // slide along Y wall
            } else if (dy !== 0 && canMove(this.x, this.y + dy)) {
                this.y += dy; // slide along X wall
            }
        };

        // --- WASD & Gamepad Movement ---
        if (input && this.attackCd <= 0) {
            let kx = 0, ky = 0;
            if (input.isDown('KeyW') || input.isDown('ArrowUp')) ky -= 1;
            if (input.isDown('KeyS') || input.isDown('ArrowDown')) ky += 1;
            if (input.isDown('KeyA') || input.isDown('ArrowLeft')) kx -= 1;
            if (input.isDown('KeyD') || input.isDown('ArrowRight')) kx += 1;

            if (input.gamepadState && input.gamepadState.connected) {
                kx += input.gamepadState.axes[0];
                ky += input.gamepadState.axes[1];
            }

            if (kx !== 0 || ky !== 0) {
                const len = Math.sqrt(kx*kx + ky*ky);
                const spd = finalMoveSpeed * dt;
                tryMove((kx / len) * spd, (ky / len) * spd);

                this.path = [];
                this.attackTarget = null;
            }

            // Aiming direction
            if (input.gamepadState && input.gamepadState.connected) {
                const rsX = input.gamepadState.axes[2];
                const rsY = input.gamepadState.axes[3];
                if (Math.abs(rsX) > 0.1 || Math.abs(rsY) > 0.1) {
                    this.moveDir = { x: rsX, y: rsY };
                } else if (kx !== 0 || ky !== 0) {
                    this.moveDir = { x: kx, y: ky };
                }
            } else if (kx !== 0 || ky !== 0) {
                this.moveDir = { x: kx, y: ky };
            }
        }

        // Attack target
        if (!movedThisFrame && this.attackTarget) {
            if (this.attackTarget.hp <= 0) { this.attackTarget = null; return; }
            const dx = this.attackTarget.x - this.x, dy = this.attackTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const range = this.attackRange || 30;
            if (dist > range) {
                const spd = finalMoveSpeed * dt;
                tryMove((dx / dist) * Math.min(spd, dist), (dy / dist) * Math.min(spd, dist));
            } else if (this.attackCd <= 0) {
                this._autoAttack(this.attackTarget);
            }
            return;
        }

        // Path following
        if (!movedThisFrame && this.path.length) {
            const target = this.path[0];
            const dx = target.x - this.x, dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const spd = finalMoveSpeed * dt;
            if (dist < spd) {
                this.x = target.x;
                this.y = target.y;
                this.path.shift();
            } else {
                tryMove((dx / dist) * spd, (dy / dist) * spd);
            }
        }

        // Update direction and animation state
        if (movedThisFrame) {
            if (Math.abs(moveDx) > Math.abs(moveDy)) {
                this.facingDir = moveDx > 0 ? 'right' : 'left';
            } else {
                this.facingDir = moveDy > 0 ? 'down' : 'up';
            }
        }

        if (this.attackCd <= 0) {
            if (movedThisFrame) {
                this._setAnimState('walk');
            } else {
                this._setAnimState('idle');
            }
        }

        // --- Lava Damage Logic ---
        if (dungeon) {
            const gx = Math.floor(this.x / dungeon.tileSize);
            const gy = Math.floor(this.y / dungeon.tileSize);
            if (gx >= 0 && gx < dungeon.width && gy >= 0 && gy < dungeon.height) {
                if (dungeon.grid[gy][gx] === 13) { // TILE.LAVA
                    this._lavaTimer = (this._lavaTimer || 0) + dt;
                    if (this._lavaTimer >= 0.5) { // Damage every 0.5s
                        this._lavaTimer = 0;
                        applyDamage(null, this, { dealt: 5, isCrit: false, type: 'fire' }, 'lava');
                        if (fx) fx.emitBurst(this.x, this.y, '#ff4500', 8);
                    }
                }
            }
        }
    }

    _setAnimState(state) {
        if (this.animState !== state) {
            this.animState = state;
            this.stateTimer = 0;
        }
    }

    _autoAttack(target) {
        const baseDmg = this.wepMin + Math.random() * (this.wepMax - this.wepMin);
        const result = calcDamage(this, baseDmg, DMG_TYPE.PHYSICAL, target);
        applyDamage(this, target, result, 'autoAttack');
        this.attackCd = 1 / this.atkSpd;
        this._setAnimState('attack');

        // Apply poison DoT from weapon affix
        if (this.poisonDmgPerSec && target.hp > 0) {
            applyDot(target, this.poisonDmgPerSec, 'poison', 3, 'player_poison');
        }

        // Face target
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            this.facingDir = dx > 0 ? 'right' : 'left';
        } else {
            this.facingDir = dy > 0 ? 'down' : 'up';
        }
    }

    _useSkill(slotIdx, data) {
        const skillId = this.hotbar[slotIdx];
        if (!skillId) return;
        if (this.cooldowns[slotIdx] > 0) return;
        const skill = this.skillMap[skillId];
        if (!skill || skill.type !== 'active') return;

        const manaCost = skill.mana || 0;
        if (this.mp < manaCost) return;

        const slvl = this.effectiveSkillLevel(skillId);
        if (slvl <= 0) return;

        this.mp -= manaCost;
        this.cooldowns[slotIdx] = skill.cd || 0;

        // Check if this is a summon skill
        const isSummon = skill.group === 'summon' || skillId.startsWith('summon_') || skillId.startsWith('imp') ||
            skillId.startsWith('infernal') || skillId.startsWith('companion_') ||
            skillId.startsWith('raven') || skillId.startsWith('grizzly') ||
            skillId.startsWith('oak_sage') || skillId.startsWith('golem') ||
            skillId.startsWith('skeleton_mage') || skillId.startsWith('revive') ||
            skillId.startsWith('spirit_wolf') || skillId.startsWith('vine') ||
            skillId.startsWith('voidwalker') || skillId.startsWith('succubus') ||
            skillId.startsWith('ancestral_');

        // Determine target coordinates early for teleport/skills
        const target = this.attackTarget || this._nearestEnemy();
        let targetX = target ? target.x : this.x;
        let targetY = target ? target.y : this.y + 10;
        if (!target && this.moveDir) {
            targetX = this.x + this.moveDir.x * 100;
            targetY = this.y + this.moveDir.y * 100;
        }

        if (isSummon) {
            this._spawnMinion(skillId, slvl, skill);
            bus.emit('skill:used', { skillId, slotIdx });
            this._setAnimState('cast');
            this.attackCd = 0.5; // lock anim
            return;
        }

        const synBonus = this.talents.synergyBonus(skillId);
        const base = (skill.dmgBase || 10) + (skill.dmgPerLvl || 5) * slvl;
        const totalBase = base * (1 + synBonus);
        const type = skillType(skill);

        const isAoE = ['blizzard', 'nova', 'wall', 'storm', 'meteor', 'armageddon', 'hurricane', 'volcano', 'fissure', 'earthquake', 'rain_of', 'consecration', 'trap', 'static'].some(kw => skillId.includes(kw));
        const isNova = ['nova', 'storm', 'hurricane', 'armageddon', 'warcry', 'static', 'totemic_wrath'].some(kw => skillId.includes(kw));
        const isMeteor = ['meteor', 'volcano', 'fissure', 'hammer'].includes(skillId);
        const isMelee = skill.group === 'melee';
        const isBuff = skill.group === 'warcry' || skill.group === 'buff';
        const isAura = skill.group === 'aura';
        const isTeleport = skill.group === 'teleport';

        // Import particle system for VFX
        // fx imported at top of file

        if (isAura) {
            // Toggle aura — only 1 active at a time
            if (this.activeAura === skillId) {
                this.activeAura = null;
                bus.emit('combat:log', { text: `Deactivated ${skill.name}`, cls: 'log-info' });
            } else {
                this.activeAura = skillId;
                this._auraSlvl = slvl;
                bus.emit('combat:log', { text: `Activated ${skill.name}`, cls: 'log-level' });
                if (fx) fx.emitHolyBurst(this.x, this.y);
            }
            this._setAnimState('cast');
            this.attackCd = 0.3;
            bus.emit('skill:used', { skillId, slotIdx });
            return;
        } else if (isTeleport) {
            // Teleport — move player to target position
            const maxDist = 200 + slvl * 10;
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > maxDist) {
                // Clamp to max distance
                const ratio = maxDist / dist;
                targetX = this.x + dx * ratio;
                targetY = this.y + dy * ratio;
            }
            // VFX at departure
            if (fx) fx.emitBurst(this.x, this.y, '#8080ff', 12, 2);
            this.x = targetX;
            this.y = targetY;
            this.path = [];
            // VFX at arrival
            if (fx) fx.emitBurst(this.x, this.y, '#b0b0ff', 12, 2);
            this._setAnimState('cast');
            this.attackCd = 0.3;
            bus.emit('skill:used', { skillId, slotIdx });
            return;
        } else if (isBuff) {
            this._buffs.push({ id: skillId, duration: 15, base: totalBase });
            this._recalcStats();
            bus.emit('combat:log', { text: `${skill.name} activated!`, cls: 'log-level' });
            // VFX based on buff archetype
            if (fx) {
                if (skillId.includes('holy') || skillId.includes('divine')) {
                    fx.emitHolyBurst(this.x, this.y);
                } else if (skillId.includes('bone') || skillId.includes('frozen') || skillId.includes('energy') || skillId.includes('cyclone')) {
                    fx.emitBurst(this.x, this.y, '#80d0ff', 12, 2);
                } else if (skillId.includes('berserk') || skillId.includes('enchant') || skillId.includes('fire')) {
                    fx.emitBurst(this.x, this.y, '#ff6000', 15, 2);
                } else if (skillId.includes('bear') || skillId.includes('wolf') || skillId.includes('primal')) {
                    fx.emitBurst(this.x, this.y, '#40c040', 12, 2);
                    fx.emitShockwave(this.x, this.y, 30, '#408040');
                } else if (skillId.includes('vanish') || skillId.includes('shadow') || skillId.includes('dark')) {
                    fx.emitShadow(this.x, this.y);
                } else if (skillId.includes('poison') || skillId.includes('venom') || skillId.includes('virulence')) {
                    fx.emitPoisonCloud(this.x, this.y, 20);
                } else {
                    fx.emitBurst(this.x, this.y, '#ffe880', 10, 1.5);
                }
            }
            this._setAnimState('cast');
            this.attackCd = 0.5;
            bus.emit('skill:used', { skillId, slotIdx });
            return;
        } else if (isMelee) {
            // Melee range check — 50px for normal, 60px for Whirlwind/Cleave
            const meleeRange = (skillId === 'whirlwind' || skillId === 'cleave' || skillId === 'slam') ? 60 : 50;

            if (skillId === 'whirlwind' || skillId === 'cleave') {
                const aoe = new AoEZone(this.x, this.y, 50, 0.3, totalBase, 'physical', this, 0.8, skillId);
                bus.emit('combat:spawnAoE', { aoe });
                // Whirlwind VFX: circular slash + dust
                if (fx) {
                    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                        fx.emitSlash(this.x, this.y, a, '#cccccc', 30);
                    }
                    fx.emitShockwave(this.x, this.y, 40, '#aaa');
                }
            } else if (skillId === 'slam' || skillId === 'leap_attack' || skillId === 'earthquake') {
                // Ground slam: shockwave at target position
                const slamX = target ? target.x : this.x;
                const slamY = target ? target.y : this.y;
                const radius = skillId === 'earthquake' ? 100 : 60;
                const aoe = new AoEZone(slamX, slamY, radius, 0.4, totalBase, 'physical', this, 0.5, skillId);
                bus.emit('combat:spawnAoE', { aoe });
                if (fx) {
                    fx.emitShockwave(slamX, slamY, radius, '#b0a080');
                    fx.shake(300, 5);
                }
            } else {
                // Standard melee strike (Bash, Rend, Execute, etc.)
                if (target) {
                    const dist = Math.sqrt((target.x - this.x)**2 + (target.y - this.y)**2);
                    if (dist < meleeRange) {
                        const result = calcDamage(this, totalBase, type, target);
                        applyDamage(this, target, result, skillId);
                        // Apply skill effects
                        SkillLogic.onHit(this, target, skillId, slvl, totalBase);

                        // Melee VFX based on skill
                        if (fx) {
                            const angle = Math.atan2(target.y - this.y, target.x - this.x);
                            if (skillId === 'rend' || skillId === 'eviscerate' || skillId === 'backstab') {
                                // Bleed slash — red arc
                                fx.emitSlash(target.x, target.y, angle, '#cc2020', 18);
                                fx.emitBlood(target.x, target.y, angle);
                            } else if (skillId === 'execute') {
                                // Execute — heavy red impact
                                fx.emitSlash(target.x, target.y, angle, '#ff0000', 25);
                                fx.emitBlood(target.x, target.y, angle);
                                fx.shake(200, 4);
                            } else if (skillId === 'shield_bash' || skillId === 'smite') {
                                // Shield bash — bright metallic impact
                                fx.emitHitImpact(target.x, target.y, 'physical');
                                fx.shake(120, 2);
                            } else if (skillId === 'holy_smite' || skillId === 'zeal') {
                                // Holy melee — golden slash
                                fx.emitSlash(target.x, target.y, angle, '#ffd040', 20);
                                fx.emitHolyBurst(target.x, target.y);
                            } else {
                                // Default melee — white slash arc
                                fx.emitSlash(target.x, target.y, angle, '#cccccc', 20);
                                fx.emitBlood(target.x, target.y, angle);
                            }
                        }
                    }
                }
            }
        } else if (isAoE) {
            const radius = isNova ? 100 : 70;
            const aoeTargetX = isNova ? this.x : targetX;
            const aoeTargetY = isNova ? this.y : targetY;
            const duration = (skillId === 'blizzard' || skillId === 'fire_wall' || skillId === 'fire_storm') ? 6 : 0.6;

            if (isMeteor) {
                // Meteor: delayed big impact with shake
                setTimeout(() => {
                    const aoe = new AoEZone(targetX, targetY, 60, 0.5, totalBase, type, this, 0.5, skillId);
                    bus.emit('combat:spawnAoE', { aoe });
                    if (fx) {
                        fx.emitShockwave(targetX, targetY, 60, type === 'fire' ? '#ff6000' : '#8a7a60');
                        fx.shake(400, 6);
                    }
                }, 1500);
                // VFX: fire trail falling from sky
                if (fx) {
                    for (let i = 0; i < 15; i++) {
                        setTimeout(() => fx.emitFireTrail(targetX + (Math.random()-0.5)*20, targetY - 30 + i * 3), i * 100);
                    }
                }
            } else {
                const aoe = new AoEZone(aoeTargetX, aoeTargetY, radius, duration, totalBase * (duration > 1 ? 0.3 : 0.8), type, this, 0.5, skillId);
                bus.emit('combat:spawnAoE', { aoe });
                // Nova burst VFX
                if (fx && isNova) {
                    fx.emitBurst(this.x, this.y, type === 'cold' ? '#80d0ff' : type === 'fire' ? '#ff6000' : '#ffff00', 20, 3);
                }
            }
        } else {
            // Ranged Projectile — speed varies by element
            const speedMap = {
                fire: 200, cold: 160, lightning: 280, poison: 140,
                shadow: 180, holy: 200, earth: 150, physical: 220, magic: 190
            };
            const speed = speedMap[type] || 180;
            const spriteColor = type === 'fire' ? '#ff4000' : type === 'cold' ? '#4080ff' : type === 'poison' ? '#00ff00' : type === 'lightning' ? '#ffff00' : '#cccccc';
            const piercing = skillId === 'bone_spear' || skillId === 'lightning' || skillId === 'frozen_orb';
            const aoeRadius = skillId === 'fireball' ? 40 : skillId === 'chaos_bolt' ? 35 : 0;
            const bounces = skillId === 'chain_lightning' ? 3 + Math.floor(slvl/4) : 0;

            // Projectile size varies by skill
            const projRadius = (skillId === 'fireball' || skillId === 'frozen_orb' || skillId === 'chaos_bolt') ? 10 :
                               (skillId === 'bone_spear') ? 6 : 8;

            const proj = new Projectile(this.x, this.y, targetX, targetY, speed, spriteColor, totalBase, type, this, piercing, projRadius, aoeRadius, bounces, skillId);
            bus.emit('combat:spawnProjectile', { proj });

        }

        this._setAnimState('cast');
        // --- Wave 3 Mastery: Faster Cast Rate (FCR) ---
        const fcr = this.pctFCR || 0;
        const castLock = 0.5 * (1 - Math.min(0.75, fcr / 100)); // Cap at 75% FCR reduction
        this.attackCd = castLock;

        // Face target
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            this.facingDir = dx > 0 ? 'right' : 'left';
        } else {
            this.facingDir = dy > 0 ? 'down' : 'up';
        }

        bus.emit('skill:used', { skillId, slotIdx, target, type });
        SkillLogic.onCast(this, skillId, slvl, targetX, targetY, this._enemies);
    }

    _spawnMinion(skillId, slvl, skill) {
        // Remove oldest if at max
        if (this.minions.length >= this.maxMinions) {
            this.minions.shift();
        }

        const dmg = (skill.dmgBase || 8) + (skill.dmgPerLvl || 4) * slvl;
        const hp = 30 + slvl * 15;
        const duration = 20 + slvl * 2;
        const name = skill.name || skillId.replace(/_/g, ' ');

        // Check if stationary (Totems, Vines, Traps, or Sentries)
        const isStationary = skill.group === 'totem' || 
                             ['vine', 'trap', 'sentry', 'mine', 'turret'].some(k => skillId.includes(k));

        const minion = {
            id: `minion_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name,
            skillId,
            x: this.x + (Math.random() - 0.5) * 30,
            y: this.y + (Math.random() - 0.5) * 30,
            hp, maxHp: hp,
            damage: dmg,
            moveSpeed: isStationary ? 0 : 80,
            isStationary,
            attackRange: (skill.group === 'totem' || skillId.includes('mage') || skillId.includes('imp')) ? 200 : 25,
            attackCd: 0,
            attackSpeed: 1.2,
            age: 0,
            duration,
            icon: `skill_${skillId}`,
            // Random offset for formation
            formationOffset: { 
                x: (Math.random() - 0.5) * 80, 
                y: (Math.random() - 0.5) * 80 
            }
        };
        this.minions.push(minion);
        bus.emit('minion:spawned', { minion });
    }

    updateMinions(dt, enemies, dungeon) {
        this.minions = this.minions.filter(m => {
            m.age += dt;
            if (m.age >= m.duration || m.hp <= 0) return false;

            m.attackCd = Math.max(0, m.attackCd - dt);

            // Stationary logic
            if (m.isStationary) {
                // Just scan and attack, no movement
                let nearest = null, nearDist = m.attackRange || 200;
                for (const e of enemies) {
                    if (e.hp <= 0 || e.state === 'dead') continue;
                    const d = Math.sqrt((e.x - m.x) ** 2 + (e.y - m.y) ** 2);
                    if (d < nearDist) { nearest = e; nearDist = d; }
                }
                if (nearest && m.attackCd <= 0) {
                    const result = calcDamage(this, m.damage, 'physical', nearest);
                    applyDamage(this, nearest, result, m.skillId);
                    m.attackCd = m.attackSpeed;
                    if (fx) fx.emitBurst(nearest.x, nearest.y, '#ffff00', 5);
                }
                return true;
            }

            // Mobile Minion Logic: Leashing
            const dx = (this.x + m.formationOffset.x) - m.x;
            const dy = (this.y + m.formationOffset.y) - m.y;
            const distToPlayer = Math.sqrt(dx * dx + dy * dy);

            // Hard Leash: Teleport
            if (distToPlayer > 800) {
                m.x = this.x + m.formationOffset.x;
                m.y = this.y + m.formationOffset.y;
                if (fx) fx.emitBurst(m.x, m.y, '#a0ffa0', 10, 1.5);
                return true;
            }

            // Soft Leash: Forced follow if too far
            const isForcedFollow = distToPlayer > 250;

            if (!isForcedFollow) {
                // Look for enemies
                let nearest = null, nearDist = 300; // Aggro range
                for (const e of enemies) {
                    if (e.hp <= 0 || e.state === 'dead') continue;
                    const d = Math.sqrt((e.x - m.x) ** 2 + (e.y - m.y) ** 2);
                    if (d < nearDist) { nearest = e; nearDist = d; }
                }

                if (nearest) {
                    if (nearDist > m.attackRange) {
                        const angle = Math.atan2(nearest.y - m.y, nearest.x - m.x);
                        const nx = m.x + Math.cos(angle) * m.moveSpeed * dt;
                        const ny = m.y + Math.sin(angle) * m.moveSpeed * dt;
                        if (!dungeon || dungeon.isWalkable(nx, ny)) {
                            m.x = nx; m.y = ny;
                        }
                    } else if (m.attackCd <= 0) {
                        const result = calcDamage(this, m.damage, 'physical', nearest);
                        applyDamage(this, nearest, result, m.skillId);
                        m.attackCd = m.attackSpeed;
                    }
                    return true;
                }
            }

            // Default: Follow Player (Formation)
            if (distToPlayer > 40) {
                const speed = isForcedFollow ? m.moveSpeed * 1.5 : m.moveSpeed;
                const nx = m.x + (dx / distToPlayer) * speed * dt;
                const ny = m.y + (dy / distToPlayer) * speed * dt;
                if (!dungeon || dungeon.isWalkable(nx, ny)) {
                    m.x = nx; m.y = ny;
                }
            }
            
            return true;
        });
    }

    renderMinions(renderer, time) {
        for (const m of this.minions) {
            // Shadow
            renderer.ctx.fillStyle = 'rgba(0,200,0,0.25)';
            renderer.ctx.beginPath();
            renderer.ctx.ellipse(m.x, m.y + 5, 6, 2.5, 0, 0, Math.PI * 2);
            renderer.ctx.fill();
            // Sprite
            renderer.drawSprite(m.icon, m.x, m.y - 3, 14, true, time);
            // HP bar
            const barW = 14, barH = 2;
            renderer.ctx.fillStyle = '#222';
            renderer.ctx.fillRect(m.x - barW / 2, m.y - 10, barW, barH);
            renderer.ctx.fillStyle = '#4c4';
            renderer.ctx.fillRect(m.x - barW / 2, m.y - 10, barW * (m.hp / m.maxHp), barH);
            // Name
            renderer.ctx.font = '4px Cinzel, serif';
            renderer.ctx.textAlign = 'center';
            renderer.ctx.fillStyle = '#8f8';
            renderer.ctx.fillText(m.name, m.x, m.y - 12);
        }
    }

    _nearestEnemy() {
        if (!this._enemies) return null;
        let best = null, bestD = Infinity;
        for (const e of this._enemies) {
            if (e.hp <= 0) continue;
            const d = (e.x - this.x) ** 2 + (e.y - this.y) ** 2;
            if (d < bestD) { bestD = d; best = e; }
        }
        return bestD < 300 * 300 ? best : null;
    }

    // ─── XP & Leveling ───
    addXp(amount) {
        if (this.hp <= 0) return;
        
        // Apply XP buffs
        let mult = 1.0;
        if (this._buffs) {
            const expBuff = this._buffs.find(b => b.id === 'shrine_exp');
            if (expBuff) mult += expBuff.value / 100;
        }
        this.xp += Math.round(amount * mult);
        
        // --- Standard Leveling (1-99) ---
        if (this.level < 99) {
            let leveled = false;
            while (this.xp >= this.xpToNext) {
                this.xp -= this.xpToNext;
                this.level++;
                this.statPoints += 5;
                this.talents.unspent++;
                leveled = true;
                bus.emit('player:levelup', { level: this.level });
                bus.emit('combat:log', { text: `LEVEL UP! REACHED LEVEL ${this.level}`, cls: 'log-heal' });
                if (fx && fx.emitLevelUp) fx.emitLevelUp(this.x, this.y);
            }
            if (leveled) {
                this._recalcStats();
                this.hp = this.maxHp;
                this.mp = this.maxMp;
            }
        } 
        // --- Paragon Leveling (99+) ---
        else {
            const paragonXpNeeded = 100000 + (this.paragonLevel * 50000);
            while (this.xp >= paragonXpNeeded) {
                this.xp -= paragonXpNeeded;
                this.paragonLevel++;
                this.paragonPoints++;
                bus.emit('player:paragonup', { level: this.paragonLevel });
                bus.emit('combat:log', { text: `Paragon Level UP! (${this.paragonLevel})`, cls: 'log-crit' });
            }
        }
        bus.emit('player:xp_change');
    }

    get xpToNext() { return XP_TABLE[Math.min(this.level - 1, XP_TABLE.length - 1)]; }

    // ─── Stat Allocation (D2-style) ───
    allocateStat(stat) {
        if (this.statPoints <= 0) return false;
        switch (stat) {
            case 'str': this.baseStr++; break;
            case 'dex': this.baseDex++; break;
            case 'vit': this.baseVit++; break;
            case 'int': this.baseInt++; break;
            default: return false;
        }
        this.statPoints--;
        this._recalcStats();
        return true;
    }

    // ─── Phase 23: Paragon Support ───
    _paragonStats() {
        if (!this.paragonStats) return {};
        const s = {};
        const p = this.paragonStats;

        if (p.core.str) s.flatSTR = p.core.str * 5;
        if (p.core.dex) s.flatDEX = p.core.dex * 5;
        if (p.core.int) s.flatINT = p.core.int * 5;
        if (p.core.vit) s.flatVIT = p.core.vit * 5;
        if (p.offense.ias) s.pctIAS = p.offense.ias * 0.5;
        if (p.offense.crit) s.critChance = p.offense.crit * 0.2;
        if (p.defense.armor) s.flatArmor = p.defense.armor * 100;
        if (p.defense.res) s.allRes = p.defense.res * 1.5;
        if (p.utility.mf) s.magicFind = p.utility.mf * 2;
        if (p.utility.gf) s.goldFind = p.utility.gf * 2;

        return s;
    }

    allocateParagonPoint(category, stat) {
        if (this.paragonPoints <= 0) return false;
        if (!this.paragonStats[category]) return false;
        
        this.paragonStats[category][stat]++;
        this.paragonPoints--;
        this._recalcStats();
        return true;
    }

    // ─── Equipment Requirement Check ───
    canEquip(item) {
        if (!item) return { ok: false, reason: 'No item' };
        
        // --- Equippability Validation ---
        const nonEquippableTypes = ['charm', 'gem', 'rune', 'potion', 'scroll', 'material', 'tome'];
        if (nonEquippableTypes.includes(item.type)) {
            return { ok: false, reason: `Cannot equip ${item.type}s` };
        }
        if (!item.slot || item.slot === 'none') {
            return { ok: false, reason: 'Item cannot be equipped' };
        }

        const req = item.req || {};
        if (req.str && this.str < req.str) return { ok: false, reason: `Requires ${req.str} Strength (you have ${this.str})` };
        if (req.dex && this.dex < req.dex) return { ok: false, reason: `Requires ${req.dex} Dexterity (you have ${this.dex})` };
        if (req.int && this.int < req.int) return { ok: false, reason: `Requires ${req.int} Intellect (you have ${this.int})` };
        if (req.vit && this.vit < req.vit) return { ok: false, reason: `Requires ${req.vit} Vitality (you have ${this.vit})` };
        if (item.reqLvl && this.level < item.reqLvl) return { ok: false, reason: `Requires Level ${item.reqLvl} (you are ${this.level})` };
        return { ok: true };
    }

    // ─── Equip ───
    equip(item, targetSlot = null) {
        const check = this.canEquip(item);
        if (!check.ok) return { error: check.reason };

        let slot = targetSlot || item.slot;

        // Smart Jewelry Slotting (D2 style) - Only if targetSlot not specified
        if (!targetSlot && slot === 'ring1') {
            if (!this.equipment.ring1) slot = 'ring1';
            else if (!this.equipment.ring2) slot = 'ring2';
            else slot = 'ring1'; 
        }

        // Validate if item can go into this slot (e.g. helm in belt slot)
        // If targetSlot was passed, we should check if it's compatible
        if (targetSlot && item.slot.startsWith('ring') && !targetSlot.startsWith('ring')) return { error: 'Incompatible slot' };
        if (targetSlot && !item.slot.startsWith('ring') && item.slot !== targetSlot) {
             // Basic check: Allow mainhand/offhand crossing? handled by canEquip? 
             // Normally slot 'head' only goes in 'head'.
        }

        // Two-Handed Logic
        if (item.twoHanded && slot === 'mainhand') {
            const off = this.equipment.offhand;
            if (off) {
                if (this.inventory.indexOf(null) === -1) return { error: 'Inventory full (cannot unequip offhand)' };
                this.addToInventory(this.unequip('offhand'));
                bus.emit('log:add', { text: `Unequipped ${off.name} to hold 2H weapon`, cls: 'log-info' });
            }
        }

        if (slot === 'offhand' && this.equipment.mainhand?.twoHanded) {
            if (this.inventory.indexOf(null) === -1) return { error: 'Inventory full (cannot unequip 2H weapon)' };
            this.addToInventory(this.unequip('mainhand'));
        }

        const old = this.equipment[slot] || null;
        this.equipment[slot] = item;
        this._recalcStats();
        return { success: true, swapped: old };
    }

    unequip(slot) {
        const item = this.equipment[slot];
        if (!item) return null;
        delete this.equipment[slot];
        this._recalcStats();
        return item;
    }

    swapWeapons() {
        // Only swap mainhand and offhand
        const oldMain = this.equipment.mainhand;
        const oldOff = this.equipment.offhand;

        this.equipment.mainhand = this.secondaryEquipment.mainhand;
        this.equipment.offhand = this.secondaryEquipment.offhand;

        this.secondaryEquipment.mainhand = oldMain;
        this.secondaryEquipment.offhand = oldOff;

        this.activeWeaponSet = this.activeWeaponSet === 1 ? 2 : 1;
        
        this._recalcStats();
        bus.emit('log:add', { text: `Swapped to Weapon Set ${this.activeWeaponSet}`, cls: 'log-info' });
        if (fx) fx.emitBurst(this.x, this.y, '#aaa', 10, 1.2);
    }

    /**
     * Use an item from inventory (Book of Skill, Tome, etc.)
     */
    useItem(idx, rightClick = false) {
        const item = this.inventory[idx];
        if (!item) return;

        if (item.baseId === 'book_of_skill') {
            this.talents.unspent++;
            this.inventory[idx] = null;
            bus.emit('combat:log', { text: "Knowledge of the ancients fills your mind! (+1 Skill Point)", cls: 'log-level' });
            if (fx) fx.emitLevelUp(this.x, this.y);
            return true;
        }

        // Potential for other use-on-click items (Elixirs, Scrolls)
        if (item.type === 'potion') {
            // Move to belt if slot empty? Or just use directly?
            // Existing main.js logic for potions often uses them from the belt.
            // Let's allow direct use for convenience.
            this.inventory[idx] = null;
            this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.35); // Simple direct use
            bus.emit('combat:log', { text: `Used ${item.name}`, cls: 'log-heal' });
            return true;
        }

        return false;
    }

    // ─── Potions ───
    usePotion(slot) {
        const item = this.belt[slot];
        if (!item) return;

        let restoredHp = 0;
        let restoredMp = 0;
        let instant = false;

        if (item.baseId === 'health_potion') restoredHp = this.maxHp * 0.35;
        if (item.baseId === 'mana_potion') restoredMp = this.maxMp * 0.35;
        if (item.baseId === 'rejuv_potion') {
            restoredHp = this.maxHp * 0.5; // Premium rejuv
            restoredMp = this.maxMp * 0.5;
            instant = true;
        }

        if (instant) {
            this.hp = Math.min(this.maxHp, this.hp + restoredHp);
            this.mp = Math.min(this.maxMp, this.mp + restoredMp);
        } else {
            this.hpBuffer += restoredHp;
            this.mpBuffer += restoredMp;
        }

        bus.emit('log:add', { text: `Used ${item.name}`, cls: instant ? 'log-crit' : 'log-heal' });
        
        // AUTO-REFILL Logic
        const baseId = item.baseId;
        this.belt[slot] = null;
        
        const invIdx = this.inventory.findIndex(it => it && it.baseId === baseId);
        if (invIdx !== -1) {
            this.belt[slot] = this.inventory[invIdx];
            this.inventory[invIdx] = null;
            // No extra log to avoid spam, just seamless refill
        }

        this._recalcStats();
    }
    addToInventory(item) {
        if (!item) return false;

        // Auto-belt potions
        if (item.type === 'potion') {
            const beltIdx = this.belt.indexOf(null);
            if (beltIdx !== -1) {
                this.belt[beltIdx] = item;
                return true;
            }
        }

        // ─── STACKING LOGIC ───
        const stackables = ['gem', 'rune', 'scroll'];
        if (stackables.includes(item.type)) {
            const stackLimit = 20;
            // Find existing stack of same baseId
            const existingIdx = this.inventory.findIndex(it => 
                it && it.baseId === item.baseId && it.type === item.type && (it.quantity || 1) < stackLimit
            );
            
            if (existingIdx !== -1) {
                const existing = this.inventory[existingIdx];
                existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
                // Handle overflow if needed (recursive call with remainder)
                if (existing.quantity > stackLimit) {
                    const remainder = existing.quantity - stackLimit;
                    existing.quantity = stackLimit;
                    const remainderItem = { ...item, quantity: remainder };
                    return this.addToInventory(remainderItem);
                }
                return true;
            }
        }

        const idx = this.inventory.indexOf(null);
        if (idx === -1) return false;
        this.inventory[idx] = item;
        if (!this.inventory[idx].quantity) this.inventory[idx].quantity = 1;
        
        this._recalcStats(); // Recalculate stats for charms
        return true;
    }

    // ─── Inventory Management ───
    sortInventory() {
        const stackables = ['gem', 'rune', 'scroll'];
        const items = this.inventory.filter(it => it !== null);
        
        // 1. Consolidate Stacks
        for (let i = 0; i < items.length; i++) {
            const itm = items[i];
            if (!itm || !stackables.includes(itm.type) || (itm.quantity || 1) >= 20) continue;
            
            for (let j = i + 1; j < items.length; j++) {
                const other = items[j];
                if (other && other.baseId === itm.baseId && other.type === itm.type && (other.quantity || 1) < 20) {
                    const room = 20 - (itm.quantity || 1);
                    const transfer = Math.min(room, (other.quantity || 1));
                    itm.quantity = (itm.quantity || 1) + transfer;
                    other.quantity = (other.quantity || 1) - transfer;
                    if (other.quantity <= 0) items[j] = null;
                    if (itm.quantity >= 20) break;
                }
            }
        }

        // 2. Main Sort
        const sorted = items.filter(it => it !== null);
        const rarityWeights = { unique: 10, set: 9, rare: 8, magic: 7, normal: 6 };
        const typeWeights = { weapon: 10, armor: 9, helm: 8, shield: 7, gloves: 6, boots: 5, belt: 4, amulet: 3, ring: 2, charm: 1, gem: 0, rune: 0, scroll: 0, potion: 0 };

        sorted.sort((a, b) => {
            const ta = typeWeights[a.type] || -1;
            const tb = typeWeights[b.type] || -1;
            if (ta !== tb) return tb - ta;
            const ra = rarityWeights[a.rarity] || 0;
            const rb = rarityWeights[b.rarity] || 0;
            if (ra !== rb) return rb - ra;
            if (a.baseId !== b.baseId) return (a.baseId || "").localeCompare(b.baseId || "");
            return (b.quantity || 1) - (a.quantity || 1) || (b.ilvl || 0) - (a.ilvl || 0);
        });

        this.inventory = [...sorted];
        while (this.inventory.length < 40) this.inventory.push(null);

        this.autoRefillBelt();
    }

    swapWeaponSet() {
        if (!this.secondaryEquipment) {
            this.secondaryEquipment = { mainhand: null, offhand: null };
        }
        
        // Swap mainhand
        const oldMain = this.equipment.mainhand;
        this.equipment.mainhand = this.secondaryEquipment.mainhand;
        this.secondaryEquipment.mainhand = oldMain;
        
        // Swap offhand
        const oldOff = this.equipment.offhand;
        this.equipment.offhand = this.secondaryEquipment.offhand;
        this.secondaryEquipment.offhand = oldOff;
        
        this.activeWeaponSet = (this.activeWeaponSet === 1) ? 2 : 1;
        this._recalcStats();
    }

    autoRefillBelt() {
        if (!this.belt) return;
        let refilled = false;

        for (let i = 0; i < this.belt.length; i++) {
            if (this.belt[i] === null) {
                // Find first potion in inventory
                const potIdx = this.inventory.findIndex(it => it && it.type === 'potion');
                if (potIdx !== -1) {
                    this.belt[i] = this.inventory[potIdx];
                    this.inventory[potIdx] = null;
                    refilled = true;
                }
            }
        }

        if (refilled) {
            // Re-pack inventory since we removed items
            const items = this.inventory.filter(it => it !== null);
            this.inventory = [...items];
            while (this.inventory.length < 40) this.inventory.push(null);
        }
    }

    // ─── Leveling ───
    gainXp(amt) { this.addXp(amt); }

    // ─── Render ───
    render(ctx) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(this.x, this.y + 5, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
        // Body
        ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y - 2);
        // HP bar
        const w = 16, h = 2;
        ctx.fillStyle = '#1a0000'; ctx.fillRect(this.x - w / 2, this.y - 12, w, h);
        ctx.fillStyle = '#e03030'; ctx.fillRect(this.x - w / 2, this.y - 12, w * (this.hp / this.maxHp), h);
    }

    serialize() {
        return {
            classId: this.classId, level: this.level, xp: this.xp,
            charName: this.charName, isHardcore: this.isHardcore, maxDifficulty: this.maxDifficulty,
            x: this.x, y: this.y, hp: this.hp, mp: this.mp,
            baseStr: this.baseStr, baseDex: this.baseDex, baseVit: this.baseVit, baseInt: this.baseInt,
            statPoints: this.statPoints, gold: this.gold,
            totalMonstersSlain: this.totalMonstersSlain,
            totalGoldCollected: this.totalGoldCollected,
            talents: this.talents.serialize(),
            equipment: this.equipment, 
            secondaryEquipment: this.secondaryEquipment,
            activeWeaponSet: this.activeWeaponSet,
            inventory: this.inventory, belt: this.belt,
            hotbar: this.hotbar,
            permanentResists: this.permanentResists,
            hasLarzukReward: this.hasLarzukReward,
            hasAnyaReward: this.hasAnyaReward,
            hasImbue: this.hasImbue,
            magicFind: this.magicFind || 0,
            goldFind: this.goldFind || 0,
            crushingBlow: this.crushingBlow || 0,
            allSkillBonus: this.allSkillBonus || 0
        };
    }

    static deserialize(data) {
        const p = new Player(data.classId);
        p.charName = data.charName || p.className;
        p.isHardcore = !!data.isHardcore;
        p.maxDifficulty = data.maxDifficulty || 0;
        p.level = data.level; p.xp = data.xp;
        p.x = data.x; p.y = data.y;
        p.hp = data.hp; p.mp = data.mp;
        p.baseStr = data.baseStr; p.baseDex = data.baseDex; p.baseVit = data.baseVit; p.baseInt = data.baseInt;
        p.statPoints = data.statPoints; p.gold = data.gold;
        p.totalMonstersSlain = data.totalMonstersSlain || 0;
        p.totalGoldCollected = data.totalGoldCollected || 0;
        p.talents = TalentTree.deserialize(data.talents);
        p.equipment = data.equipment || {};
        p.secondaryEquipment = data.secondaryEquipment || { mainhand: null, offhand: null };
        p.activeWeaponSet = data.activeWeaponSet || 1;
        p.inventory = data.inventory || Array(40).fill(null);
        p.belt = data.belt || [null, null, null, null];
        p.hotbar = data.hotbar || [null, null, null, null, null];
        
        p.permanentResists = data.permanentResists || 0;
        p.hasLarzukReward = !!data.hasLarzukReward;
        p.hasAnyaReward = !!data.hasAnyaReward;
        p.hasImbue = !!data.hasImbue;
        p.magicFind = data.magicFind || 0;
        p.goldFind = data.goldFind || 0;
        p.crushingBlow = data.crushingBlow || 0;
        p.allSkillBonus = data.allSkillBonus || 0;

        p._recalcStats();
        return p;
    }
}
