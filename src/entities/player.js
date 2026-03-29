/**
 * Player Entity — stats, movement, leveling, item bonuses, skill use
 */
import { bus } from '../engine/EventBus.js';
import { Pathfinder } from '../world/pathfinding.js';
import { TalentTree } from '../systems/talentTree.js';
import { getClass, getSkillMap } from '../data/classes.js';
import { calcDamage, applyDamage, skillDamage, skillType, DMG_TYPE } from '../systems/combat.js';
import { RARITY } from '../systems/lootSystem.js';
import { Projectile, AoEZone } from './projectile.js';
import { fx } from '../engine/ParticleSystem.js';

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
        this.statPoints = 0;
        this.gold = 0;
        this.charName = cls.name; // Character name (user can customize)
        this.baseStr = cls.stats.str;
        this.baseDex = cls.stats.dex;
        this.baseVit = cls.stats.vit;
        this.baseInt = cls.stats.int;


        // Talent tree
        this.talents = new TalentTree(classId);

        // Equipment & Inventory
        this.equipment = {}; // slot → item
        this.inventory = Array(40).fill(null); // 10×4 grid
        this.belt = Array(4).fill(null); // 4 potion slots

        // Hotbar: skillId assignments
        this.hotbar = [null, null, null, null, null];
        this.cooldowns = [0, 0, 0, 0, 0];
        this.minions = []; // Active summons
        this.maxMinions = 5;

        // Movement
        this.path = [];
        this.pathfinder = new Pathfinder();
        this.moveSpeed = MOVE_SPEED_BASE;
        this.attackTarget = null;
        this.attackCd = 0;

        // Active effects
        this._dots = [];
        this._buffs = [];

        // Aura (paladin)
        this.activeAura = null;

        // Skill map ref
        this.skillMap = getSkillMap(classId);

        // Listen
        bus.on('input:click', d => this._onClick(d));
        for (let i = 0; i < 5; i++) {
            bus.on(`skill:use:${i}`, d => this._useSkill(i, d));
        }

        // Finalize stats last
        this._recalcStats();
        this.hp = this.maxHp;
        this.mp = this.maxMp;
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
        }

        this.str = this.baseStr + (s.flatSTR || 0);
        this.dex = this.baseDex + (s.flatDEX || 0);
        this.vit = this.baseVit + (s.flatVIT || 0);
        this.int = this.baseInt + (s.flatINT || 0);

        this.maxHp = 50 + this.vit * 8 + this.level * 5 + (s.flatHP || 0);
        this.maxMp = 30 + this.int * 5 + this.level * 3 + (s.flatMP || 0);
        this.armor = (s.flatArmor || 0) * (1 + (s.pctArmor || 0) / 100);

        this.critChance = 5 + (s.critChance || 0);
        this.critMulti = 150 + (s.critMulti || 0);
        this.lifeStealPct = s.lifeStealPct || 0;
        this.moveSpeed = MOVE_SPEED_BASE * (1 + (s.pctMoveSpeed || 0) / 100);

        // Resistances
        for (const r of ['fireRes', 'coldRes', 'lightRes', 'poisRes', 'shadowRes']) {
            this[r] = Math.min(75, (s[r] || 0) + (s.allRes || 0));
        }

        // Damage bonuses
        this.pctDmg = s.pctDmg || 0;
        for (const t of ['Fire', 'Cold', 'Light', 'Poison', 'Shadow', 'Holy']) {
            this[`pct${t}Dmg`] = s[`pct${t}Dmg`] || 0;
        }
        this.flatMinDmg = s.flatMinDmg || 0;
        this.pctIAS = s.pctIAS || 0;

        // Magic Find & Gold Find
        this.magicFind = s.magicFind || 0;
        this.goldFind = s.goldFind || 0;

        // Weapon damage
        const wep = (this.equipment && this.equipment.mainhand);
        this.wepMin = wep ? (wep.minDmg || 1) + (s.flatMinDmg || 0) : 1 + (s.flatMinDmg || 0);
        this.wepMax = wep ? (wep.maxDmg || 3) + (s.flatMaxDmg || 0) : 3 + (s.flatMaxDmg || 0);
        this.atkSpd = (wep?.atkSpd || 1.0) * (1 + (this.pctIAS || 0) / 100);
    }
    _gearStats() {
        const s = {};
        const equip = this.equipment || {};
        // 1. Equipped Items
        for (const item of Object.values(equip)) {
            if (!item) continue;
            this._addItemStats(item, s);
        }
        // 2. Charms in Inventory
        for (const item of this.inventory) {
            if (item && item.type === 'charm') {
                this._addItemStats(item, s);
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
        }
        return ts;
    }

    _addItemStats(item, s) {
        if (item.armor) s.flatArmor = (s.flatArmor || 0) + item.armor;
        if (item.block) s.blockChance = (s.blockChance || 0) + item.block;
        if (item.mods) {
            for (const mod of item.mods) {
                if (mod && mod.stat) {
                    if (mod.stat.startsWith('+')) continue;
                    s[mod.stat] = (s[mod.stat] || 0) + (mod.value || 0);
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
        for (const item of Object.values(this.equipment)) {
            if (!item) continue;
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
        return bonus;
    }

    effectiveSkillLevel(skillId) {
        return this.talents.effectiveLevel(skillId, this.getSkillBonus(skillId));
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

    update(dt, input) {
        // Mana regen
        this.mp = Math.min(this.maxMp, this.mp + (2 + this.int * 0.05) * dt);

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

        // Helper for sliding collision
        const tryMove = (dx, dy) => {
            moveDx = dx; moveDy = dy;
            movedThisFrame = true;
            if (!this._dungeon) {
                this.x += dx; this.y += dy; return;
            }
            if (this._dungeon.isWalkable(this.x + dx, this.y + dy)) {
                this.x += dx; this.y += dy;
            } else if (dx !== 0 && this._dungeon.isWalkable(this.x + dx, this.y)) {
                this.x += dx;
            } else if (dy !== 0 && this._dungeon.isWalkable(this.x, this.y + dy)) {
                this.y += dy;
            }
        };

        // --- WASD Movement ---
        if (input && this.attackCd <= 0) {
            let kx = 0, ky = 0;
            if (input.isDown('KeyW') || input.isDown('ArrowUp')) ky -= 1;
            if (input.isDown('KeyS') || input.isDown('ArrowDown')) ky += 1;
            if (input.isDown('KeyA') || input.isDown('ArrowLeft')) kx -= 1;
            if (input.isDown('KeyD') || input.isDown('ArrowRight')) kx += 1;

            if (kx !== 0 || ky !== 0) {
                const len = Math.sqrt(kx*kx + ky*ky);
                const spd = this.moveSpeed * dt;
                tryMove((kx / len) * spd, (ky / len) * spd);

                this.path = [];
                this.attackTarget = null;
            }
        }

        // Attack target
        if (!movedThisFrame && this.attackTarget) {
            if (this.attackTarget.hp <= 0) { this.attackTarget = null; return; }
            const dx = this.attackTarget.x - this.x, dy = this.attackTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const range = 30;
            if (dist > range) {
                const spd = this.moveSpeed * dt;
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
            const spd = this.moveSpeed * dt;
            if (dist < spd) {
                this.x = target.x; this.y = target.y;
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
        const isSummon = skillId.startsWith('summon_') || skillId.startsWith('imp') ||
            skillId.startsWith('infernal') || skillId.startsWith('companion_') ||
            skillId.startsWith('raven') || skillId.startsWith('grizzly') ||
            skillId.startsWith('oak_sage') || skillId.startsWith('golem') ||
            skillId.startsWith('skeleton_mage') || skillId.startsWith('revive') ||
            skillId.startsWith('spirit_wolf') || skillId.startsWith('vine') ||
            skillId.startsWith('voidwalker') || skillId.startsWith('succubus');

        if (isSummon) {
            this._spawnMinion(skillId, slvl, skill);
            bus.emit('skill:used', { skillId, slotIdx });
            this._setAnimState('cast');
            this.attackCd = 0.5; // lock anim
            return;
        }

        // Normal skill: spawn Projectile or AoEZone
        const target = this.attackTarget || this._nearestEnemy();
        // Fallback target if no enemy found (shoot forward)
        let targetX = target ? target.x : this.x;
        let targetY = target ? target.y : this.y + 10;

        // Ensure we aim somewhere if there's no target
        if (!target && this.moveDir) {
            targetX = this.x + this.moveDir.x * 50;
            targetY = this.y + this.moveDir.y * 50;
        }

        const synBonus = this.talents.synergyBonus(skillId);
        const base = (skill.dmgBase || 10) + (skill.dmgPerLvl || 5) * slvl;
        const totalBase = base * (1 + synBonus);
        const type = skillType(skill);

        const isAoE = ['blizzard', 'nova', 'wall', 'storm', 'meteor', 'armageddon', 'hurricane', 'volcano', 'fissure', 'earthquake', 'rain_of', 'consecration', 'trap'].some(kw => skillId.includes(kw));
        const isNova = ['nova', 'storm', 'hurricane', 'armageddon', 'warcry'].some(kw => skillId.includes(kw));
        const isMeteor = ['meteor', 'volcano', 'fissure'].includes(skillId);
        const isMelee = skill.group === 'melee';
        const isBuff = skill.group === 'warcry' || skill.group === 'aura' || skill.group === 'buff';

        // Import particle system for VFX
        // fx imported at top of file

        if (isBuff) {
            this._buffs.push({ id: skillId, duration: 15, base: totalBase });
            const aoe = new AoEZone(this.x, this.y, 80, 0.5, 0, 'magic', this, 0.2, skillId);
            bus.emit('combat:spawnAoE', { aoe });
            if (fx) fx.emitHolyBurst(this.x, this.y);
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

            // Lightning gets special bolt VFX to the target
            if (fx && type === 'lightning' && target) {
                fx.emitLightning(this.x, this.y, targetX, targetY);
            }
        }

        this._setAnimState('cast');
        this.attackCd = 0.5; // lock anim

        // Face target
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            this.facingDir = dx > 0 ? 'right' : 'left';
        } else {
            this.facingDir = dy > 0 ? 'down' : 'up';
        }

        bus.emit('skill:used', { skillId, slotIdx, target, type });
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

        const minion = {
            id: `minion_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name,
            skillId,
            x: this.x + (Math.random() - 0.5) * 30,
            y: this.y + (Math.random() - 0.5) * 30,
            hp, maxHp: hp,
            damage: dmg,
            moveSpeed: 80,
            attackRange: 25,
            attackCd: 0,
            attackSpeed: 1.2,
            age: 0,
            duration,
            icon: `skill_${skillId}`,
        };
        this.minions.push(minion);
        bus.emit('minion:spawned', { minion });
    }

    updateMinions(dt, enemies, dungeon) {
        this.minions = this.minions.filter(m => {
            m.age += dt;
            if (m.age >= m.duration || m.hp <= 0) return false;

            m.attackCd = Math.max(0, m.attackCd - dt);

            // Find nearest enemy
            let nearest = null, nearDist = Infinity;
            for (const e of enemies) {
                if (e.hp <= 0 || e.state === 'dead') continue;
                const d = Math.sqrt((e.x - m.x) ** 2 + (e.y - m.y) ** 2);
                if (d < nearDist) { nearest = e; nearDist = d; }
            }

            if (nearest) {
                if (nearDist > m.attackRange) {
                    // Move toward enemy
                    const angle = Math.atan2(nearest.y - m.y, nearest.x - m.x);
                    const nx = m.x + Math.cos(angle) * m.moveSpeed * dt;
                    const ny = m.y + Math.sin(angle) * m.moveSpeed * dt;
                    if (!dungeon || dungeon.isWalkable(nx, ny)) {
                        m.x = nx; m.y = ny;
                    }
                } else if (m.attackCd <= 0) {
                    // Attack
                    const result = calcDamage(this, m.damage, 'physical', nearest);
                    applyDamage(this, nearest, result, m.skillId);
                    
                    m.attackCd = m.attackSpeed;
                }
            } else {
                // Follow player
                const dx = this.x - m.x, dy = this.y - m.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 40) {
                    const nx = m.x + (dx / dist) * m.moveSpeed * dt;
                    const ny = m.y + (dy / dist) * m.moveSpeed * dt;
                    if (!dungeon || dungeon.isWalkable(nx, ny)) {
                        m.x = nx; m.y = ny;
                    }
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
        this.xp += amount;
        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            this.statPoints += 5;
            this.talents.unspent++;
            this._recalcStats();
            this.hp = this.maxHp;
            this.mp = this.maxMp;
            bus.emit('player:levelup', { level: this.level });
        }
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

    // ─── Equipment Requirement Check ───
    canEquip(item) {
        if (!item) return { ok: false, reason: 'No item' };
        const req = item.req || {};
        if (req.str && this.str < req.str) return { ok: false, reason: `Requires ${req.str} Strength (you have ${this.str})` };
        if (req.dex && this.dex < req.dex) return { ok: false, reason: `Requires ${req.dex} Dexterity (you have ${this.dex})` };
        if (req.int && this.int < req.int) return { ok: false, reason: `Requires ${req.int} Intellect (you have ${this.int})` };
        if (req.vit && this.vit < req.vit) return { ok: false, reason: `Requires ${req.vit} Vitality (you have ${this.vit})` };
        if (item.reqLvl && this.level < item.reqLvl) return { ok: false, reason: `Requires Level ${item.reqLvl} (you are ${this.level})` };
        return { ok: true };
    }

    // ─── Equip ───
    equip(item) {
        const check = this.canEquip(item);
        if (!check.ok) return { error: check.reason };

        let slot = item.slot;

        // Smart Jewelry Slotting (D2 style)
        if (slot === 'ring1') {
            if (!this.equipment.ring1) slot = 'ring1';
            else if (!this.equipment.ring2) slot = 'ring2';
            else slot = 'ring1'; // Swap first ring by default if both full
        }

        // Two-Handed Logic
        if (item.twoHanded && slot === 'mainhand') {
            // If we have something in offhand, we must unequip it
            const off = this.equipment.offhand;
            if (off) {
                if (this.inventory.indexOf(null) === -1) return { error: 'Inventory full (cannot unequip offhand)' };
                this.addToInventory(this.unequip('offhand'));
                bus.emit('log:add', { text: `Unequipped ${off.name} to hold 2H weapon`, cls: 'log-info' });
            }
        }

        // If equipping offhand but have 2H weapon
        if (slot === 'offhand' && this.equipment.mainhand?.twoHanded) {
            if (this.inventory.indexOf(null) === -1) return { error: 'Inventory full (cannot unequip 2H weapon)' };
            this.addToInventory(this.unequip('mainhand'));
        }

        const old = this.equipment[slot] || null;
        this.equipment[slot] = item;
        this._recalcStats();
        return old;
    }

    unequip(slot) {
        const item = this.equipment[slot];
        if (!item) return null;
        delete this.equipment[slot];
        this._recalcStats();
        return item;
    }

    // ─── Potions ───
    usePotion(slot) {
        const item = this.belt[slot];
        if (!item) return;

        let restoredHp = 0;
        let restoredMp = 0;

        if (item.id === 'health_potion') restoredHp = this.maxHp * 0.35;
        if (item.id === 'mana_potion') restoredMp = this.maxMp * 0.35;
        if (item.id === 'rejuv_potion') {
            restoredHp = this.maxHp * 0.35;
            restoredMp = this.maxMp * 0.35;
        }

        this.hp = Math.min(this.maxHp, this.hp + restoredHp);
        this.mp = Math.min(this.maxMp, this.mp + restoredMp);

        bus.emit('log:add', { text: `Used ${item.name}`, cls: 'log-heal' });
        this.belt[slot] = null;
        this._recalcStats();
    }
    addToInventory(item) {
        const idx = this.inventory.indexOf(null);
        if (idx === -1) return false;
        this.inventory[idx] = item;
        return true;
    }

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
            charName: this.charName,
            x: this.x, y: this.y, hp: this.hp, mp: this.mp,
            baseStr: this.baseStr, baseDex: this.baseDex, baseVit: this.baseVit, baseInt: this.baseInt,
            statPoints: this.statPoints, gold: this.gold,
            talents: this.talents.serialize(),
            equipment: this.equipment, inventory: this.inventory, belt: this.belt,
            hotbar: this.hotbar,
        };
    }

    static deserialize(data) {
        const p = new Player(data.classId);
        p.charName = data.charName || p.className;
        p.level = data.level; p.xp = data.xp;
        p.x = data.x; p.y = data.y;
        p.hp = data.hp; p.mp = data.mp;
        p.baseStr = data.baseStr; p.baseDex = data.baseDex; p.baseVit = data.baseVit; p.baseInt = data.baseInt;
        p.statPoints = data.statPoints; p.gold = data.gold;
        p.talents = TalentTree.deserialize(data.talents);
        p.equipment = data.equipment || {};
        p.inventory = data.inventory || Array(40).fill(null);
        p.belt = data.belt || [null, null, null, null];
        p.hotbar = data.hotbar || [null, null, null, null, null];
        p._recalcStats();
        return p;
    }
}
