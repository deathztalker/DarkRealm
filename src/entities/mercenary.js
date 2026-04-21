import { bus } from '../engine/EventBus.js';
import { calcDamage, applyDamage, DMG_TYPE, applyStatus } from '../systems/combat.js';
import { Projectile } from './projectile.js';
import { fx } from '../engine/ParticleSystem.js';
import { Pathfinder } from '../world/pathfinding.js';
import { MERC_TREES } from '../data/mercenary_talents.js';

const pathfinder = new Pathfinder();

export class Mercenary {
    constructor(data) {
        this.name = data.name || 'Mercenary';
        this.className = data.className || 'Rogue';
        this.level = data.level || 1;
        
        const iconMap = {
            'Rogue': 'class_ranger',
            'Desert Warrior': 'class_paladin',
            'Iron Wolf': 'class_sorceress',
            'Barbarian': 'class_warrior'
        };
        this.icon = iconMap[this.className] || 'class_rogue';
        
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.xp = data.xp || 0;
        this.xpToNextLevel = this._calcXpReq(this.level);
        
        this.maxHp = 100;
        this.hp = data.hp || 100;
        this.baseDmg = 10;
        
        this.animState = 'idle';
        this.facingDir = 'south';
        this.path = [];
        this.target = null;
        this.isMercenary = true;
        this.isPlayer = true;
        
        this.equipment = data.equipment || { 
            head: null, chest: null, mainhand: null, offhand: null,
            amulet: null, ring1: null, ring2: null, belt: null, gloves: null, boots: null
        };
        this.points = data.points || {};
        this.unspentPoints = data.unspentPoints || 0;
        
        this._atkCd = 0;
        this._buffCd = 0;
        this._auraTimer = 0;
        this.atkSpeed = 1.2;
        this.resists = { fire: 0, cold: 0, light: 0, pois: 0 };
        this._buffs = [];
        this._recalcStats();
    }

    _calcXpReq(lvl) { return Math.floor(100 * Math.pow(lvl, 1.8)); }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNextLevel) {
            this.level++;
            this.xp -= this.xpToNextLevel;
            this.xpToNextLevel = this._calcXpReq(this.level);
            if (this.level % 2 === 0) this.unspentPoints++;
            this._recalcStats();
            this.hp = this.maxHp;
            fx.emitBurst(this.x, this.y, '#ffd700', 30, 3);
            bus.emit('combat:log', { text: `${this.name} reached level ${this.level}!`, type: 'log-level' });
        }
    }

    _recalcStats() {
        const hpG = (this.className === 'Barbarian') ? 35 : (this.className === 'Desert Warrior' ? 25 : 20);
        this.maxHp = 150 + this.level * hpG;
        this.baseDmg = 15 + this.level * (this.className === 'Barbarian' ? 6 : 4);
        this.armor = this.level * 8;
        
        const s = {
            allRes: this.level * 2.0,
            pctDmg: 0, pctIAS: 0, flatHP: 0, flatArmor: 0, pctArmor: 0, allSkills: 0,
            dodge: 0, deadlyStrike: 0, crushingBlow: 0
        };

        let hasSecondWeapon = (this.className === 'Barbarian' && this.equipment.offhand?.type === 'weapon');

        for (const [slot, item] of Object.entries(this.equipment)) {
            if (!item) continue;
            if (item.armor) s.flatArmor += item.armor;
            if (item.minDmg) {
                let d = (item.minDmg + item.maxDmg) / 2;
                if (hasSecondWeapon) d *= 0.85; 
                this.baseDmg += d;
            }
            if (item.mods) {
                for (const mod of item.mods) {
                    if (mod.stat === 'allSkills' || mod.stat === '+allSkills') s.allSkills += mod.value;
                    else if (s[mod.stat] !== undefined) s[mod.stat] += mod.value;
                    else if (mod.stat === 'allRes') s.allRes += mod.value;
                }
            }
        }

        this.allSkillBonus = s.allSkills;
        this.effectiveSkillLevel = Math.floor(this.level / 2) + this.allSkillBonus;

        // --- Talent Passive Validation ---
        const slvl = (id) => (this.points[id] || 0) + this.allSkillBonus;

        if (this.className === 'Barbarian') {
            s.flatArmor += slvl('iron_skin') * 40;
            s.allRes += slvl('natural_resistance') * 5;
            this.moveSpeedBonus = slvl('increased_speed') * 0.05;
        } else if (this.className === 'Rogue') {
            s.dodge += slvl('dodge') * 1.5;
            s.deadlyStrike += slvl('critical_strike') * 3;
        }

        this.maxHp = Math.round((this.maxHp + s.flatHP) * (1 + (s.pctHP || 0) / 100));
        this.armor = Math.round((this.armor + s.flatArmor) * (1 + (s.pctArmor || 0) / 100));
        this.totalDmg = Math.round(this.baseDmg * (1 + s.pctDmg / 100));
        this.atkSpeed = 1.2 * (1 + s.pctIAS / 100);
        this.dodgeChance = s.dodge;
        this.deadlyStrike = s.deadlyStrike;
        
        this.resists = {
            fire: Math.min(85, s.allRes), cold: Math.min(85, s.allRes),
            light: Math.min(85, s.allRes), pois: Math.min(85, s.allRes)
        };
        
        this.hp = Math.min(this.hp, this.maxHp);
    }

    update(dt, player, enemies, dungeon) {
        if (this.hp <= 0) { this.animState = 'dead'; return; }

        this._auraTimer -= dt;
        if (this._auraTimer <= 0) {
            this._auraTimer = 1.5;
            this._applyAutonomousSkills(player, enemies);
        }

        const dToP = Math.hypot(player.x - this.x, player.y - this.y);
        if (dToP > 800) { this.x = player.x; this.y = player.y; this.path = []; return; }

        let closest = null, cDist = 450;
        for (const e of enemies) {
            if (e.hp > 0 && dungeon.hasLineOfSight(this.x, this.y, e.x, e.y)) {
                const d = Math.hypot(e.x - this.x, e.y - this.y);
                if (d < cDist) { cDist = d; closest = e; }
            }
        }
        this.target = closest;

        let moved = false;
        const goal = this.target || player;
        const goalDist = Math.hypot(goal.x - this.x, goal.y - this.y);
        const stopDist = this.target ? (['Barbarian', 'Desert Warrior'].includes(this.className) ? 35 : 300) : 65;

        // Kiting logic for ranged
        const isRanged = ['Rogue', 'Iron Wolf'].includes(this.className);
        if (this.target && isRanged && goalDist < 150) {
            const rx = this.x - (this.target.x - this.x);
            const ry = this.y - (this.target.y - this.y);
            this.x += (rx - this.x) * 0.05; this.y += (ry - this.y) * 0.05; // Retreat slightly
            this.animState = 'walk'; moved = true;
        } else if (goalDist > stopDist) {
            if (this.path.length === 0 || Math.random() < 0.04) {
                this.path = pathfinder.find(dungeon.grid, this.x, this.y, goal.x, goal.y, dungeon.tileSize);
            }
            if (this.path.length > 0) {
                const next = this.path[0];
                const dx = next.x - this.x, dy = next.y - this.y;
                const d = Math.hypot(dx, dy);
                if (d < 5) { this.path.shift(); }
                else {
                    const speed = dToP > 250 ? 170 : 110;
                    this.x += (dx / d) * speed * dt;
                    this.y += (dy / d) * speed * dt;
                    this.facingDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
                    this.animState = 'walk'; moved = true;
                }
            }
        } else {
            this.path = [];
            this.animState = 'idle';
            if (this.target) {
                const dx = this.target.x - this.x, dy = this.target.y - this.y;
                this.facingDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
            }
        }

        if (this.target && goalDist <= stopDist + 50) {
            this._atkCd -= dt;
            if (this._atkCd <= 0) {
                this.attack(this.target);
                this._atkCd = 1 / this.atkSpeed;
                this.animState = 'attack';
            }
        }
        this.hp = Math.min(this.maxHp, this.hp + (this.maxHp * 0.015 * dt * (this._divineResto ? 3 : 1)));
    }

    _applyAutonomousSkills(player, enemies) {
        const slvl = (id) => {
            const base = (this.points[id] || 0);
            const oskill = (this.oskills && this.oskills[id]) ? this.oskills[id] : 0;
            if (base === 0 && oskill === 0) return 0;
            return base + oskill + (this.allSkillBonus || 0);
        };
        const allies = [player, this, ...(player.minions || [])];
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

        // Scan for Oskills (e.g. Teleport)
        this.oskills = {};
        for (const item of Object.values(this.equipment)) {
            if (!item?.bonuses) continue;
            for (const [stat, val] of Object.entries(item.bonuses)) {
                if (['teleport', 'battleOrders', 'battleCommand'].includes(stat)) {
                    this.oskills[stat] = (this.oskills[stat] || 0) + (typeof val === 'object' ? val.max : val);
                }
            }
        }

        if (this.oskills.teleport && (distToPlayer > 500 || (this.hp < this.maxHp * 0.2 && Math.random() < 0.1))) {
            fx.emitBurst(this.x, this.y, '#8080ff', 15, 2);
            this.x = player.x + (Math.random() - 0.5) * 50;
            this.y = player.y + (Math.random() - 0.5) * 50;
            this.path = [];
            fx.emitBurst(this.x, this.y, '#b0b0ff', 15, 2);
        }

        // --- Aura Resonance Logic ---
        this._divineResto = false;
        const hasMeditation = player.activeStatuses?.has('meditation');
        const hasConviction = player.activeStatuses?.has('conviction');
        const hasFanaticism = player.activeStatuses?.has('fanaticism');

        // Master Synergies Detection
        const pointsIn = (treeId) => {
            const tree = (MERC_TREES[this.className] || []).find(t => t.id === treeId);
            if (!tree) return 0;
            return tree.nodes.reduce((acc, n) => acc + (this.points[n.id] || 0), 0);
        };

        if (this.className === 'Rogue') {
            const activeBranches = [pointsIn('rogue_fire'), pointsIn('rogue_cold'), pointsIn('rogue_lightning')].filter(p => p > 0).length;
            if (activeBranches >= 2) applyStatus(player, 'phantom_barrage', 2.0, 1, 'Phantom Barrage: 30% chance for extra elemental arrows.');
        } else if (this.className === 'Desert Warrior') {
            const activeBranches = [pointsIn('desert_offense'), pointsIn('desert_defense'), pointsIn('desert_tactical')].filter(p => p > 0).length;
            if (activeBranches >= 2) {
                allies.forEach(a => applyStatus(a, 'champions_phalanx', 2.0, 15, 'Champion\'s Phalanx: 15% Damage Reduction & Holy Thorns.'));
            }
        } else if (this.className === 'Barbarian') {
            const activeBranches = [pointsIn('barb_combat'), pointsIn('barb_warcries')].filter(p => p > 0).length;
            if (activeBranches >= 2) this._avatarOfWarReady = true;
        }

        for (const ally of allies) {
            if (!ally || ally.hp <= 0) continue;
            if (Math.hypot(ally.x - this.x, ally.y - this.y) > 400) continue;

            if (slvl('might_aura')) applyStatus(ally, 'might', 2.0, 1 + slvl('might_aura') * 0.08);
            if (slvl('defiance_aura')) applyStatus(ally, 'defiance', 2.0, 1 + slvl('defiance_aura') * 0.15);
            if (slvl('concentration_aura')) applyStatus(ally, 'concentration', 2.0, 1 + slvl('concentration_aura') * 0.12);
            if (slvl('fanaticism_aura')) applyStatus(ally, 'fanaticism', 2.0, 1 + slvl('fanaticism_aura') * 0.10);
            
            // Divine Restoration Synergy
            if (slvl('prayer_aura') && hasMeditation) {
                this._divineResto = true;
                applyStatus(ally, 'divine_restoration', 2.0, 1, 'Divine Restoration: Triple healing & +15% Life.');
            }
            // Commanding Presence Synergy
            if (slvl('might_aura') && hasFanaticism) {
                applyStatus(ally, 'commanding_presence', 2.0, 1, 'Commanding Presence: +20% Crushing Blow & +15% Life Steal.');
            }
        }

        if (slvl('holy_freeze')) {
            for (const e of enemies) {
                if (e.hp > 0 && Math.hypot(e.x - this.x, e.y - this.y) < 300) {
                    applyStatus(e, 'chill', 2.0, 40 + slvl('holy_freeze') * 2);
                    if (hasConviction) applyStatus(e, 'abyssal_chill', 2.0, 1, 'Abyssal Chill: -25% Physical Resistance.');
                }
            }
        }

        this._buffCd -= 1.5;
        if (this._buffCd <= 0 && distToPlayer < 350) {
            const bc = slvl('battle_command');
            const bo = slvl('battle_orders');
            if (bc > 0) {
                applyStatus(player, 'battle_command', 20, 1);
                fx.emitShockwave(this.x, this.y, 130, 'rgba(0,150,255,0.4)');
                this._buffCd = 25;
            }
            if (bo > 0 && player.hp < player.maxHp * 0.9) {
                allies.forEach(a => applyStatus(a, 'hp_boost', 20, 25 + bo * 6));
                fx.emitShockwave(this.x, this.y, 160, 'rgba(255,50,50,0.4)');
                this._buffCd = 35;
            }
        }
    }

    attack(target) {
        const slvl = (id) => (this.points[id] || 0) + (this.oskills?.[id] || 0) + this.allSkillBonus;
        const dmg = this.totalDmg;

        if (this.className === 'Barbarian') {
            const ww = slvl('whirlwind');
            if (ww > 0 && Math.random() < 0.3) {
                fx.emitShockwave(this.x, this.y, 110, 'rgba(255,255,255,0.3)');
                window.enemies?.forEach(e => {
                    if (e.hp > 0 && Math.hypot(e.x-this.x, e.y-this.y) < 120) applyDamage(this, e, { dealt: dmg * (1.6 + ww * 0.25), type: 'physical' });
                });
            } else if (slvl('bash') > 0 && Math.random() < 0.45) {
                applyDamage(this, target, { dealt: dmg * (2.0 + slvl('bash') * 0.2), isCrit: true, type: 'physical' });
                const dx = target.x - this.x, dy = target.y - this.y, d = Math.hypot(dx, dy) || 1;
                target.vx = (dx/d)*22; target.vy = (dy/d)*22;
                fx.emitBurst(target.x, target.y, '#fff', 30, 2);
            } else {
                applyDamage(this, target, { dealt: dmg, isCrit: Math.random() < 0.1, type: 'physical' });
            }
        } else if (this.className === 'Desert Warrior') {
            const jL = slvl('jab') || 1;
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (target && target.hp > 0) {
                        applyDamage(this, target, { dealt: dmg * (0.9 + jL * 0.1), type: 'physical' });
                        fx.emitSlash(this.x, this.y, Math.atan2(target.y-this.y, target.x-this.x), '#ccc', 35);
                    }
                }, i * 90);
            }
        } else if (this.className === 'Iron Wolf') {
            const fL = slvl('meteor') || slvl('fire_ball') || slvl('fire_bolt');
            const cL = slvl('blizzard') || slvl('glacial_spike');
            const lL = slvl('chain_lightning') || slvl('charged_bolt');
            const type = (fL >= cL && fL >= lL) ? 'fire' : (cL >= lL ? 'cold' : 'lightning');
            const sL = Math.max(fL, cL, lL, 1);
            let dM = 1.0; if (player.activeStatuses?.has('conviction')) dM = 1.6;
            if (type === 'fire') {
                if (slvl('meteor') > 0 && Math.random() < 0.25) {
                    fx.emitBurst(target.x, target.y, '#f60', 90, 7);
                    window.enemies?.forEach(e => { if (Math.hypot(e.x-target.x, e.y-target.y) < 150) applyDamage(this, e, { dealt: dmg * (5 + slvl('meteor') * 0.8) * dM, type: 'fire' }); });
                } else {
                    const proj = new Projectile(this.x, this.y, target.x, target.y, 360, 'ra-circle', dmg * (1.5 + sL * 0.5) * dM, 'fire', this);
                    bus.emit('combat:spawnProjectile', { proj });
                }
            } else if (type === 'cold') {
                if (slvl('blizzard') > 0 && Math.random() < 0.25) {
                    fx.emitBurst(target.x, target.y, '#0cf', 85, 6);
                    window.enemies?.forEach(e => { if (Math.hypot(e.x-target.x, e.y-target.y) < 160) applyDamage(this, e, { dealt: dmg * (4 + slvl('blizzard') * 0.6) * dM, type: 'cold' }); });
                } else {
                    const proj = new Projectile(this.x, this.y, target.x, target.y, 320, 'ra-circle', dmg * (1.4 + sL * 0.4) * dM, 'cold', this);
                    bus.emit('combat:spawnProjectile', { proj });
                }
            } else {
                if (slvl('chain_lightning') > 0 && Math.random() < 0.3) {
                    if (fx.emitLightning) fx.emitLightning(this.x, this.y, target.x, target.y, 6);
                    applyDamage(this, target, { dealt: dmg * (4 + slvl('chain_lightning') * 0.7) * dM, type: 'lightning' });
                } else {
                    const proj = new Projectile(this.x, this.y, target.x, target.y, 520, 'ra-circle', dmg * (1.6 + sL * 0.6) * dM, 'lightning', this);
                    bus.emit('combat:spawnProjectile', { proj });
                }
            }
        } else { // Rogue
            const fA = slvl('exploding_arrow') || slvl('fire_arrow');
            const cA = slvl('freezing_arrow') || slvl('cold_arrow');
            const lA = slvl('lightning_arrow');
            const type = (fA >= cA && fA >= lA) ? 'fire' : (cA >= lA ? 'cold' : (lA > 0 ? 'lightning' : 'physical'));
            const sL = Math.max(fA, cA, lA);
            const proj = new Projectile(this.x, this.y, target.x, target.y, 550, 'ra-arrow', dmg * (1.5 + sL * 0.4), type, this);
            if (type === 'lightning') proj.bounces = 4;
            else if (type === 'fire' && slvl('exploding_arrow')) proj.aoe = 70 + slvl('exploding_arrow') * 4;
            else if (type === 'cold' && slvl('freezing_arrow')) proj.aoe = 80 + slvl('freezing_arrow') * 4;
            bus.emit('combat:spawnProjectile', { proj });
            if (slvl('inner_sight') > 0 && Math.random() < 0.4) applyStatus(target, 'inner_sight', 15, slvl('inner_sight') * 30);
        }
    }

    render(renderer, time) {
        if (this.hp <= 0) return;
        renderer.drawShadow(this.x, this.y + 4, 8, 0.3);
        renderer.drawAnim(this.icon, this.x, this.y - 4, 18, this.animState || 'idle', this.facingDir || 'south', time, null, this.equipment);
        const bw = 18;
        renderer.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        renderer.ctx.fillRect(this.x - bw/2, this.y - 20, bw, 2);
        renderer.ctx.fillStyle = '#4caf50';
        renderer.ctx.fillRect(this.x - bw/2, this.y - 20, bw * (this.hp / this.maxHp), 2);
        renderer.ctx.font = '5px Cinzel, serif'; renderer.ctx.textAlign = 'center'; renderer.ctx.fillStyle = '#4caf50';
        renderer.ctx.fillText(this.name, this.x, this.y - 23);
    }

    serialize() {
        return {
            name: this.name, className: this.className, level: this.level, xp: this.xp,
            hp: this.hp, icon: this.icon, equipment: this.equipment,
            points: this.points, unspentPoints: this.unspentPoints
        };
    }

    static deserialize(data) {
        if (!data) return null;
        const m = new Mercenary(data);
        m.points = data.points || {};
        let spent = 0; for (const p of Object.values(m.points)) spent += p;
        const total = Math.floor(m.level / 2);
        m.unspentPoints = (data.unspentPoints !== undefined) ? Math.max(data.unspentPoints, total - spent) : Math.max(0, total - spent);
        m._recalcStats();
        return m;
    }
}
