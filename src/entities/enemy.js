/**
 * Enemy Entity — Types, AI states, loot drop on death
 */
import { bus } from '../engine/EventBus.js';
import { calcDamage, applyDamage, DMG_TYPE, isCCd, getSlowFactor } from '../systems/combat.js';
import { fx } from '../engine/ParticleSystem.js';

const ENEMY_TYPES = {
    skeleton: { icon: 'enemy_skeleton', name: 'Skeleton', hp: 40, dmg: 5, spd: 50, xp: 15, armor: 2, group: 'undead' },
    goblin: { icon: 'enemy_goblin', name: 'Goblin', hp: 35, dmg: 6, spd: 65, xp: 12, armor: 1, group: 'humanoid' },
    zombie: { icon: 'enemy_zombie', name: 'Zombie', hp: 65, dmg: 7, spd: 30, xp: 20, armor: 5, group: 'undead' },
    ghost: { icon: 'enemy_ghost', name: 'Specter', hp: 30, dmg: 12, spd: 45, xp: 25, armor: 0, group: 'undead', shadowRes: 50 },
    demon: { icon: 'enemy_demon', name: 'Demon', hp: 80, dmg: 15, spd: 55, xp: 35, armor: 10, group: 'demon', fireRes: 30 },
    spider: { icon: 'enemy_spider', name: 'Spider', hp: 35, dmg: 6, spd: 70, xp: 18, armor: 2, group: 'beast', poisonDmg: 4 },
    golem: { icon: 'enemy_golem', name: 'Stone Golem', hp: 120, dmg: 18, spd: 25, xp: 40, armor: 30, group: 'construct' },
    cultist: { icon: 'enemy_cultist', name: 'Cultist', hp: 45, dmg: 14, spd: 40, xp: 28, armor: 4, group: 'human', lightRes: 20 },
    bat: { icon: 'enemy_bat', name: 'Void Bat', hp: 20, dmg: 4, spd: 80, xp: 10, armor: 0, group: 'beast' },
};

const BOSS_POOL = [
    { icon: 'enemy_demon', name: 'Diremaw the Fleshweaver', hpMult: 10, dmgMult: 3, xpMult: 15 },
    { icon: 'enemy_spider', name: 'Kha\'thul the Unseen', hpMult: 8, dmgMult: 4, xpMult: 12 },
    { icon: 'enemy_skeleton', name: 'Bone Lord Varkath', hpMult: 12, dmgMult: 2.5, xpMult: 18 },
    { icon: 'enemy_golem', name: 'Infernal Sentinel', hpMult: 9, dmgMult: 3.5, xpMult: 14 },
];

const ELITE_AFFIXES = [
    { name: 'Champion', mod: e => { e.maxHp *= 1.8; e.hp = e.maxHp; } },
    { name: 'Berserker', mod: e => { e.dmg *= 1.5; e.moveSpeed *= 1.3; } },
    { name: 'Spectral', mod: e => { e.shadowRes = 60; e.icon = 'enemy_ghost'; } },
    { name: 'Frozen', mod: e => { e.coldRes = 50; e.extraDmgType = 'cold'; } },
    { name: 'Electrified', mod: e => { e.lightRes = 40; e.extraDmgType = 'lightning'; } },
    { name: 'Vampiric', mod: e => { e.lifeStealPct = 25; } },
    { name: 'Teleporter', mod: e => { e.canTeleport = true; } },
    { name: 'Extra Fast', mod: e => { e.moveSpeed *= 1.6; e.atkSpeed *= 1.4; } }
];

const RARE_PREFIX = ['Gore', 'Blight', 'Bone', 'Blood', 'Onyx', 'Storm', 'Shadow', 'Plague', 'Dread', 'Night', 'Doom', 'Foul', 'Rot'];
const RARE_SUFFIX = ['Fiend', 'Drinker', 'Crawler', 'Weaver', 'Skull', 'Bite', 'Claw', 'Thorn', 'Touch', 'Song', 'Howl', 'Web'];

const UNIQUE_ENEMIES = [
    { id: 'corpsefire', name: 'Corpsefire', base: 'zombie', mods: ['Spectral', 'Extra Fast'] },
    { id: 'bloodraven', name: 'Blood Raven', base: 'cultist', mods: ['Extra Fast', 'Champion'] },
    { id: 'rakanishu', name: 'Rakanishu', base: 'bat', mods: ['Electrified', 'Extra Fast'] },
    { id: 'treehead', name: 'Treehead Woodfist', base: 'golem', mods: ['Extra Fast', 'Berserker'] },
    { id: 'griswold', name: 'Griswold', base: 'zombie', mods: ['Vampiric', 'Champion'] }
];

export class Enemy {
    constructor(spawn) {
        const types = Object.keys(ENEMY_TYPES);
        const typeKey = types[Math.floor(Math.random() * types.length)];
        const base = ENEMY_TYPES[typeKey];

        this.x = spawn.x;
        this.y = spawn.y;
        this.homeX = spawn.x;
        this.homeY = spawn.y;
        this.radius = 6;
        this.level = spawn.level || 1;
        this.type = spawn.type; // 'normal' | 'elite' | 'boss'

        this.patrolTimer = 0;
        this.fleeing = false;
        this.state = 'idle'; // idle, chase, attack, flee

        const scale = 1 + (this.level - 1) * 0.12;
        if (this.type === 'boss') {
            const boss = BOSS_POOL[Math.floor(Math.random() * BOSS_POOL.length)];
            this.icon = boss.icon || base.icon;
            this.name = boss.name;
            this.maxHp = Math.round(base.hp * scale * boss.hpMult);
            this.dmg = Math.round(base.dmg * scale * boss.dmgMult);
            this.xpReward = Math.round(base.xp * scale * boss.xpMult);
            
            this.isButcher = boss.name.includes('Butcher') || Math.random() < 0.25;
            if (this.isButcher) {
                this.name = "The Butcher";
                this.icon = 'enemy_demon';
                this.maxHp = Math.round(this.maxHp * 1.5);
                this.dmg = Math.round(this.dmg * 1.2);
                this.chargeCd = 5;
            }
        } else {
            this.icon = base.icon;
            this.name = base.name;
            if (this.type === 'elite') {
                const r = Math.random();
                if (r < 0.1) this.type = 'unique';
                else if (r < 0.4) this.type = 'rare';
                else this.type = 'champion';
            }

            if (this.type === 'unique') {
                const uq = UNIQUE_ENEMIES[Math.floor(Math.random() * UNIQUE_ENEMIES.length)];
                this.name = uq.name;
                this.srcIcon = ENEMY_TYPES[uq.base].icon;
                this.icon = this.srcIcon;
                this._uniqueMods = uq.mods;
                this.maxHp = Math.round(base.hp * scale * 4);
                this.dmg = Math.round(base.dmg * scale * 2);
                this.xpReward = Math.round(base.xp * scale * 5);
            } else {
                this.maxHp = Math.round(base.hp * scale * (this.type === 'rare' ? 3.5 : this.type === 'champion' ? 2 : 1));
                this.dmg = Math.round(base.dmg * scale * (this.type === 'rare' ? 1.8 : this.type === 'champion' ? 1.4 : 1));
                this.xpReward = Math.round(base.xp * scale * (this.type === 'rare' ? 4 : this.type === 'champion' ? 2.5 : 1));
            }
        }

        this.hp = this.maxHp;
        this.armor = Math.round((base.armor || 0) * scale);
        this.moveSpeed = base.spd * (this.type === 'boss' ? 0.8 : 1);
        this.fireRes = base.fireRes || 0;
        this.coldRes = base.coldRes || 0;
        this.lightRes = base.lightRes || 0;
        this.poisRes = base.poisRes || 0;
        this.shadowRes = base.shadowRes || 0;

        // AI State
        this.state = 'idle'; // idle | patrol | chase | attack | dead
        this.aggroRange = this.type === 'boss' ? 250 : 150;
        this.attackRange = 25;
        this.attackCd = 0;
        this.atkSpeed = 1.0;
        this._patrolTarget = null;
        this._homeX = this.x;
        this._homeY = this.y;

        // Champion / Rare / Unique affixes
        if (this.type === 'champion' || this.type === 'rare' || this.type === 'unique') {
            let chosen = [];

            if (this.type === 'unique') {
                for (const modName of this._uniqueMods) {
                    const affix = ELITE_AFFIXES.find(a => a.name === modName);
                    if (affix) { chosen.push(affix); affix.mod(this); }
                }
            } else {
                const numAffixes = this.type === 'rare' ? 2 + Math.floor(Math.random() * 2) : 1;
                let available = [...ELITE_AFFIXES];

                for (let i = 0; i < numAffixes; i++) {
                    if (available.length === 0) break;
                    const idx = Math.floor(Math.random() * available.length);
                    const affix = available.splice(idx, 1)[0];
                    chosen.push(affix);
                    affix.mod(this);
                }
            }

            this.affixDesc = chosen.map(a => a.name).join(', ');

            if (this.type === 'rare') {
                const pref = RARE_PREFIX[Math.floor(Math.random() * RARE_PREFIX.length)];
                const suff = RARE_SUFFIX[Math.floor(Math.random() * RARE_SUFFIX.length)];
                this.name = `${pref} ${suff}`;
            } else if (this.type === 'champion') {
                this.name = `Champion ${this.name}`;
            }
        }

        this.facingDir = 'down';
        this.animState = 'idle';
        this.stateTimer = 0;

        this._dots = [];
    }

    update(dt, player, dungeon) {
        if (this.hp <= 0) return;
        this.hp = Math.min(this.maxHp, this.hp + (this.hpRegen || 0) * dt);

        // Check for CC (Stun/Frozen)
        if (isCCd(this)) return;

        let currentMoveSpeed = this.moveSpeed;
        const slow = getSlowFactor(this);
        if (slow > 0) currentMoveSpeed *= (1 - slow / 100);

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;
        const aggroRange = this.aggroRange;

        // Helper: try to move, allow sliding along walls if diagonal is blocked
        let movedThisFrame = false;
        let moveDx = 0, moveDy = 0;
        const tryMove = (mx, my) => {
            moveDx = mx; moveDy = my;
            movedThisFrame = true;
            if (!dungeon) {
                this.x += mx; this.y += my; return;
            }
            if (dungeon.isWalkable(this.x + mx, this.y + my)) {
                this.x += mx; this.y += my;
            } else if (mx !== 0 && dungeon.isWalkable(this.x + mx, this.y)) {
                this.x += mx;
            } else if (my !== 0 && dungeon.isWalkable(this.x, this.y + my)) {
                this.y += my;
            }
        };

        // Flee logic
        if (this.hp < this.maxHp * 0.2 && this.type === 'normal' && !this.fleeing && Math.random() < 0.01) {
            this.fleeing = true;
            this.state = 'flee';
        }

        if (this.fleeing) {
            const angle = Math.atan2(-dy, -dx);
            tryMove(Math.cos(angle) * this.moveSpeed * 1.2 * dt, Math.sin(angle) * this.moveSpeed * 1.2 * dt);
            if (distSq > aggroRange * aggroRange * 2) this.fleeing = false;
        }
        else if (distSq < aggroRange * aggroRange) {
            this.state = 'chase';
            const angle = Math.atan2(dy, dx);
            
            // Special Boss skill: Charge
            if (this.isButcher && distSq < 150*150 && distSq > 60*60) {
                this.chargeCd = (this.chargeCd || 0) - dt;
                if (this.chargeCd <= 0 && !this.isCharging) {
                    this.isCharging = true;
                    this.chargeTimer = 0.8;
                    this.chargeAngle = angle;
                    bus.emit('combat:log', { text: "FRESH MEAT!", type: 'log-crit' });
                }
            }

            // Special Boss skill: Summon Minions at 50% HP
            if (this.isButcher && this.hp < this.maxHp * 0.5 && !this.hasSummoned) {
                this.hasSummoned = true;
                bus.emit('combat:log', { text: "RISE, MY SERVANTS!", type: 'log-crit' });
                bus.emit('combat:spawnMinions', { x: this.x, y: this.y, count: 4 });
            }

            if (this.isCharging) {
                this.chargeTimer -= dt;
                tryMove(Math.cos(this.chargeAngle) * this.moveSpeed * 4 * dt, Math.sin(this.chargeAngle) * this.moveSpeed * 4 * dt);
                if (distSq < 15*15) {
                    // Hit player during charge
                    player.hp -= this.dmg * 1.5;
                    this.isCharging = false;
                    this.chargeCd = 6;
                }
                if (this.chargeTimer <= 0) {
                    this.isCharging = false;
                    this.chargeCd = 6;
                }
            } else if (distSq > this.attackRange * this.attackRange) {
                tryMove(Math.cos(angle) * this.moveSpeed * dt, Math.sin(angle) * this.moveSpeed * dt);
            } else {
                this.state = 'attack';
                this.attack(player, dt);
            }
        }
        else {
            this.state = 'patrol';
            this.patrolTimer -= dt;
            if (this.patrolTimer <= 0) {
                if (Math.random() < 0.3) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = 30 + Math.random() * 50;
                    const tx = this.homeX + Math.cos(angle) * r;
                    const ty = this.homeY + Math.sin(angle) * r;
                    // Only set patrol target if walkable
                    if (!dungeon || dungeon.isWalkable(tx, ty)) {
                        this.targetX = tx;
                        this.targetY = ty;
                    }
                    this.patrolTimer = 2 + Math.random() * 4;
                } else {
                    this.targetX = this.x;
                    this.targetY = this.y;
                    this.patrolTimer = 1 + Math.random() * 2;
                }
            }

            if (this.targetX !== this.x || this.targetY !== this.y) {
                const pdx = this.targetX - this.x;
                const pdy = this.targetY - this.y;
                const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
                if (pdist > 5) {
                    tryMove((pdx / pdist) * (currentMoveSpeed * 0.5) * dt, (pdy / pdist) * (currentMoveSpeed * 0.5) * dt);
                }
            }
        }

        // Animation logic
        this.stateTimer += dt;
        if (movedThisFrame) {
            if (Math.abs(moveDx) > Math.abs(moveDy)) {
                this.facingDir = moveDx > 0 ? 'right' : 'left';
            } else {
                this.facingDir = moveDy > 0 ? 'down' : 'up';
            }
        }

        if (this.state === 'attack') {
            this._setAnimState('attack');
        } else if (movedThisFrame) {
            this._setAnimState('walk');
        } else {
            this._setAnimState('idle');
        }
    }

    _setAnimState(state) {
        if (this.animState !== state) {
            this.animState = state;
            this.stateTimer = 0;
        }
    }

    attack(target, dt) {
        this.attackCd = Math.max(0, this.attackCd - dt);
        if (this.attackCd <= 0) {
            const result = calcDamage(this, this.dmg, DMG_TYPE.PHYSICAL, target);
            applyDamage(this, target, result);
            this.attackCd = 1 / this.atkSpeed;
            this._setAnimState('attack');

            // Face target
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                this.facingDir = dx > 0 ? 'right' : 'left';
            } else {
                this.facingDir = dy > 0 ? 'down' : 'up';
            }

            // Enemy attack VFX on the target (player)
            const angle = Math.atan2(dy, dx);
            fx.emitSlash(target.x, target.y, angle, '#ff6666', 16);
            fx.emitHitImpact(target.x, target.y, 'physical');
            if (this.type === 'boss' || this.isButcher) {
                fx.shake(200, 3);
            }
        }
    }

    render(renderer, time) {
        if (this.hp <= 0) return;

        // Shadow
        renderer.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        renderer.ctx.beginPath();
        renderer.ctx.ellipse(this.x, this.y + 6, this.type === 'normal' ? 6 : 10, 3, 0, 0, Math.PI * 2);
        renderer.ctx.fill();


        // Sprite animation with Aggro Tint
        const baseSize = this.isButcher ? 42 : (this.type === 'normal' ? 16 : (this.type === 'boss' ? 32 : 24));
        const isAggro = this.state === 'chase' || this.state === 'attack';
        const aggroFilter = isAggro ? 'drop-shadow(0 0 4px #f00) sepia(1) saturate(3) hue-rotate(-50deg)' : null;
        renderer.drawAnim(this.icon, this.x, this.y - 4, baseSize, this.animState, this.facingDir, time, aggroFilter);

        // HP Bar
        const barW = 20;
        const barH = 2;
        renderer.ctx.fillStyle = '#333';
        renderer.ctx.fillRect(this.x - barW / 2, this.y - 15, barW, barH);
        renderer.ctx.fillStyle = this.type === 'elite' ? '#f0d030' : (this.type === 'boss' ? '#eeca2c' : '#c0392b');
        renderer.ctx.fillRect(this.x - barW / 2, this.y - 15, barW * (this.hp / this.maxHp), barH);

        // Name
        if (this.type !== 'normal') {
            renderer.ctx.font = '7px Cinzel, serif';
            renderer.ctx.textAlign = 'center';
            renderer.ctx.fillStyle = this.type === 'boss' ? '#eeca2c' : '#f0d030';
            renderer.ctx.fillText(this.name, this.x, this.y - 20);
            if (this.affixDesc) {
                renderer.ctx.font = '5px Cinzel, serif';
                renderer.ctx.fillStyle = '#aaa';
                renderer.ctx.fillText(this.affixDesc, this.x, this.y - 14);
            }
        }
    }
}
