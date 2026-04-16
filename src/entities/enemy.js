/**
 * Enemy Entity — Types, AI states, loot drop on death
 */
import { bus } from '../engine/EventBus.js';
import { calcDamage, applyDamage, DMG_TYPE, isCCd, getSlowFactor, isFeared, isRooted } from '../systems/combat.js';
import { fx } from '../engine/ParticleSystem.js';
import { Projectile } from './projectile.js';

const ENEMY_TYPES = {
    skeleton: { icon: 'enemy_skeleton', name: 'Skeleton', hp: 40, dmg: 5, spd: 50, xp: 15, armor: 2, group: 'undead', attackType: 'melee' },
    skeleton_archer: { icon: 'enemy_skeleton', name: 'Skeleton Archer', hp: 35, dmg: 5, spd: 45, xp: 16, armor: 1, group: 'undead', attackType: 'ranged', element: 'physical', projColor: '#cccccc', projRadius: 6 },
    goblin: { icon: 'enemy_goblin', name: 'Goblin', hp: 35, dmg: 6, spd: 65, xp: 12, armor: 1, group: 'humanoid', attackType: 'melee' },
    zombie: { icon: 'enemy_zombie', name: 'Zombie', hp: 65, dmg: 7, spd: 30, xp: 20, armor: 5, group: 'undead', attackType: 'melee' },
    ghost: { icon: 'enemy_ghost', name: 'Specter', hp: 30, dmg: 12, spd: 45, xp: 25, armor: 0, group: 'undead', shadowRes: 50, attackType: 'caster', element: 'shadow', projColor: '#a040ff', projRadius: 12 },
    demon: { icon: 'enemy_demon', name: 'Demon', hp: 80, dmg: 15, spd: 55, xp: 35, armor: 10, group: 'demon', fireRes: 30, attackType: 'melee' },
    spider: { icon: 'enemy_spider', name: 'Spider', hp: 35, dmg: 6, spd: 70, xp: 18, armor: 2, group: 'beast', poisonDmg: 4, attackType: 'ranged', element: 'poison', projColor: '#00ff00', projRadius: 8 },
    golem: { icon: 'enemy_golem', name: 'Stone Golem', hp: 120, dmg: 18, spd: 25, xp: 40, armor: 30, group: 'construct', attackType: 'melee' },
    cultist: { icon: 'enemy_cultist', name: 'Cultist', hp: 45, dmg: 14, spd: 40, xp: 28, armor: 4, group: 'human', lightRes: 20, attackType: 'caster', element: 'fire', projColor: '#ff6000', projRadius: 10 },
    bat: { icon: 'enemy_bat', name: 'Void Bat', hp: 20, dmg: 4, spd: 80, xp: 10, armor: 0, group: 'beast', attackType: 'melee' },
    wraith: { icon: 'enemy_ghost', name: 'Wraith', hp: 45, dmg: 10, spd: 55, xp: 30, armor: 0, group: 'undead', lightRes: 50, attackType: 'melee', element: 'lightning' },
    fetish: { icon: 'enemy_goblin', name: 'Fetish', hp: 25, dmg: 8, spd: 90, xp: 15, armor: 0, group: 'humanoid', attackType: 'melee' },
    vampire: { icon: 'enemy_cultist', name: 'Vampire', hp: 90, dmg: 22, spd: 45, xp: 60, armor: 12, group: 'undead', fireRes: 40, attackType: 'caster', element: 'fire', projColor: '#ff0000', projRadius: 14 },
    scarab: { icon: 'enemy_demon', name: 'Death Beetle', hp: 70, dmg: 12, spd: 40, xp: 40, armor: 25, group: 'beast', lightRes: 75, attackType: 'melee', isLightningEnchanted: true },
    sand_leaper: { icon: 'enemy_bat', name: 'Sand Leaper', hp: 45, dmg: 9, spd: 85, xp: 22, armor: 2, group: 'beast', attackType: 'melee' },
    mummy: { icon: 'enemy_zombie', name: 'Dried Corpse', hp: 120, dmg: 18, spd: 25, xp: 50, armor: 15, group: 'undead', poisonRes: 60, attackType: 'melee', leavesPoisonCloud: true },
    thorn_hulk: { icon: 'enemy_golem', name: 'Thorn Hulk', hp: 160, dmg: 25, spd: 35, xp: 75, armor: 40, group: 'beast', attackType: 'melee' },
    zakarum_priest: { icon: 'enemy_cultist', name: 'High Priest', hp: 55, dmg: 18, spd: 45, xp: 45, armor: 5, group: 'human', lightRes: 50, attackType: 'caster', element: 'lightning', projColor: '#ffff80', projRadius: 10 },
    venom_lord: { icon: 'enemy_demon', name: 'Venom Lord', hp: 180, dmg: 32, spd: 65, xp: 90, armor: 20, group: 'demon', fireRes: 75, attackType: 'melee' },
    doom_knight: { icon: 'enemy_skeleton', name: 'Doom Knight', hp: 150, dmg: 28, spd: 40, xp: 80, armor: 60, group: 'undead', attackType: 'melee' },
    oblivion_knight: { icon: 'enemy_ghost', name: 'Oblivion Knight', hp: 80, dmg: 22, spd: 50, xp: 100, armor: 10, group: 'undead', shadowRes: 75, attackType: 'caster', element: 'shadow', projColor: '#ff00ff', projRadius: 12 },
    death_maul: { icon: 'enemy_golem', name: 'Death Maul', hp: 220, dmg: 40, spd: 30, xp: 120, armor: 50, group: 'beast', attackType: 'melee' },
    hell_lord: { icon: 'enemy_demon', name: 'Hell Lord', hp: 140, dmg: 35, spd: 75, xp: 110, armor: 15, group: 'demon', attackType: 'melee', extraDmgType: 'fire' },
    overseer: { icon: 'enemy_cultist', name: 'Overseer', hp: 100, dmg: 25, spd: 45, xp: 130, armor: 20, group: 'demon', attackType: 'ranged', element: 'physical', projColor: '#884400', projRadius: 10 },
    cow: { icon: 'enemy_zombie', name: 'Hell Bovine', hp: 140, dmg: 30, spd: 45, xp: 80, armor: 40, group: 'beast', attackType: 'melee', flavor: '"Moo. Moo moo moo."' },
};

const BOSS_POOL = [
    { icon: 'enemy_demon', name: 'Diremaw the Fleshweaver', hpMult: 10, dmgMult: 3, xpMult: 15 },
    { icon: 'enemy_spider', name: 'Kha\'thul the Unseen', hpMult: 8, dmgMult: 4, xpMult: 12 },
    { icon: 'enemy_skeleton', name: 'Bone Lord Varkath', hpMult: 12, dmgMult: 2.5, xpMult: 18 },
    { icon: 'enemy_golem', name: 'Infernal Sentinel', hpMult: 9, dmgMult: 3.5, xpMult: 14 },
    { icon: 'enemy_demon', name: 'Azmodan, Lord of Sin', hpMult: 18, dmgMult: 4.5, xpMult: 25, riftOnly: true, element: 'fire' },
    { icon: 'enemy_cultist', name: 'Baal, Lord of Destruction', hpMult: 22, dmgMult: 3.5, xpMult: 35, riftOnly: true, element: 'cold' },
    { icon: 'enemy_ghost', name: 'Mephisto, Lord of Hatred', hpMult: 18, dmgMult: 4.8, xpMult: 40 },
    // --- Phase 27: Uber Bosses ---
    { id: 'uber_mephisto', name: 'Uber Mephisto', hpMult: 60, dmgMult: 12, xpMult: 100, isUber: true },
    { id: 'uber_diablo', name: 'Uber Diablo', hpMult: 80, dmgMult: 15, xpMult: 150, isUber: true },
    { id: 'uber_baal', name: 'Uber Baal', hpMult: 100, dmgMult: 14, xpMult: 200, isUber: true },
    { id: 'cow_king', name: 'The Cow King', hpMult: 25, dmgMult: 6, xpMult: 50, special: 'lightning_enchanted', icon: 'enemy_zombie' },
    { id: 'angry_jano', name: 'Angry Jano', hpMult: 35, dmgMult: 8, xpMult: 100, icon: 'enemy_demon', special: 'berserker', deathSound: 'assets/death_jano.mp3' },
];

const ELITE_AFFIXES = [
    { name: 'Champion', mod: e => { e.maxHp *= 1.8; e.hp = e.maxHp; } },
    { name: 'Berserker', mod: e => { e.dmg *= 1.5; e.moveSpeed *= 1.3; } },
    { name: 'Spectral', mod: e => { e.shadowRes = 60; e.icon = 'enemy_ghost'; } },
    { name: 'Frozen', mod: e => { e.coldRes = 50; e.extraDmgType = 'cold'; } },
    { name: 'Electrified', mod: e => { e.lightRes = 40; e.isLightningEnchanted = true; } },
    { name: 'Vampiric', mod: e => { e.lifeStealPct = 25; } },
    { name: 'Teleporter', mod: e => { e.canTeleport = true; e._teleportCd = 0; } },
    { name: 'Extra Fast', mod: e => { e.moveSpeed *= 1.6; e.atkSpeed *= 1.4; } },
    { name: 'Multi Shot', mod: e => { e.isMultiShot = true; } },
    { name: 'Fire Enchanted', mod: e => { e.fireRes = 50; e.isFireEnchanted = true; } },
    { name: 'Cold Enchanted', mod: e => { e.coldRes = 50; e.isColdEnchanted = true; } },
    { name: 'Aura Enchanted', mod: e => { e.hasAura = true; e.auraType = ['might', 'holy_fire', 'conviction'][Math.floor(Math.random() * 3)]; } }
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
        let types = Object.keys(ENEMY_TYPES);
        const zone = spawn.level || 1;

        const act3Enemies = ['fetish', 'wraith', 'spider', 'bat', 'zombie', 'ghost'];
        const act4Enemies = ['venom_lord', 'doom_knight', 'oblivion_knight', 'hell_lord', 'wraith', 'demon'];

        // --- Act II Spawning Logic ---
        if (zone >= 6 && zone <= 9) {
            // Favor desert enemies
            const desertEnemies = ['scarab', 'sand_leaper', 'mummy', 'wraith', 'bat', 'spider'];
            types = types.filter(t => desertEnemies.includes(t));
            if (types.length === 0) types = Object.keys(ENEMY_TYPES); // Fallback
        } else if (zone < 6) {
            // Favor Act I enemies
            const act1Enemies = ['skeleton', 'skeleton_archer', 'goblin', 'zombie', 'ghost', 'fetish'];
            types = types.filter(t => act1Enemies.includes(t));
            if (types.length === 0) types = Object.keys(ENEMY_TYPES);
        } else if (zone >= 11 && zone <= 14) {
            // Favor Act III enemies
            types = types.filter(t => act3Enemies.includes(t));
            if (types.length === 0) types = Object.keys(ENEMY_TYPES);
        } else if (zone >= 16 && zone <= 19) {
            // Favor Act IV enemies
            types = types.filter(t => act4Enemies.includes(t));
            if (types.length === 0) types = Object.keys(ENEMY_TYPES);
        } else if (zone >= 21 && zone <= 24) {
            // Favor Act V enemies
            const act5Enemies = ['death_maul', 'hell_lord', 'overseer', 'venom_lord', 'doom_knight', 'wraith'];
            types = types.filter(t => act5Enemies.includes(t));
            if (types.length === 0) types = Object.keys(ENEMY_TYPES);
        } else if (zone === 99) {
            // Secret Cow Level: Only cows
            types = ['cow'];
        }

        const typeKey = types[Math.floor(Math.random() * types.length)];
        const base = ENEMY_TYPES[typeKey];

        this.x = spawn.x;
        this.y = spawn.y;
        this.homeX = spawn.x;
        this.homeY = spawn.y;
        this.radius = 6;
        this.level = spawn.level || 1;
        this.type = spawn.type || 'normal'; // 'normal' | 'elite' | 'boss'

        this.patrolTimer = 0;
        this.fleeing = false;
        this.state = 'idle'; // idle, chase, attack, flee
        this.hitFlashTimer = 0;
        this.lostTargetTimer = 0; // Timer for losing LOS

        const scale = 1 + (this.level - 1) * 0.12;
        const riftScale = (this.level >= 7 && window.riftLevel > 1) ? Math.pow(1.18, window.riftLevel - 1) : 1.0;
        const diffMult = (window._difficulty !== undefined ? window.DIFFICULTY_MULT[window._difficulty] : 1.0) * riftScale;

        const eliteScale = this.type === 'boss' ? 2.2 : (this.type === 'elite' ? 1.4 : 1.0);
        this.renderScale = eliteScale;
        this.radius = 6 * eliteScale;

        if (this.type === 'boss') {
            let bossSource;
            if (spawn.name) {
                // Pre-defined Campaign Boss
                bossSource = spawn;
            } else {
                // Random Rift Boss
                let availableBosses = BOSS_POOL;
                if (this.level > 7) {
                    availableBosses = BOSS_POOL.filter(b => b.riftOnly);
                    if (availableBosses.length === 0) availableBosses = BOSS_POOL;
                } else {
                    availableBosses = BOSS_POOL.filter(b => !b.riftOnly);
                }
                bossSource = availableBosses[Math.floor(Math.random() * availableBosses.length)];
            }

            this.icon = spawn.icon || bossSource.icon || base.icon;
            this.name = spawn.name || bossSource.name;
            this.id = bossSource.id || this.id;
            this.deathSound = bossSource.deathSound || null;
            const hpm = spawn.hpMult || bossSource.hpMult || 10;
            const dmgm = spawn.dmgMult || bossSource.dmgMult || 3;
            const xpm = spawn.xpMult || bossSource.xpMult || 20;

            this.maxHp = Math.round(base.hp * scale * hpm * diffMult);
            this.dmg = Math.round(base.dmg * scale * dmgm * diffMult);
            this.xpReward = Math.round(base.xp * scale * xpm * (1 + (window._difficulty || 0) * 0.5));

            // Set specific boss flags for special AI behaviors
            this.isAndariel = spawn.isAndariel || bossSource.id === 'andariel';
            this.isDuriel = spawn.isDuriel || bossSource.id === 'duriel';
            this.isMephisto = spawn.isMephisto || bossSource.id === 'mephisto';
            this.isDiablo = spawn.isDiablo || bossSource.id === 'diablo';
            this.isBaal = spawn.isBaal || bossSource.id === 'baal';
            this.isUber = spawn.isUber || bossSource.isUber;
            this.isButcher = spawn.isButcher || bossSource.id === 'butcher';
            this.isRadament = spawn.isRadament || bossSource.id === 'radament';
            this.isBeetleburst = spawn.isBeetleburst || bossSource.id === 'beetleburst';
            this.isColdworm = spawn.isColdworm || bossSource.id === 'coldworm';
            this.isSarina = spawn.isSarina || bossSource.id === 'sarina';
            this.isCouncil = spawn.isCouncil || bossSource.id === 'council';
            this.isIzual = spawn.isIzual || spawn.name === 'Izual';
            this.isHephaisto = spawn.isHephaisto || spawn.name === 'Hephaisto';
            this.isAncient = spawn.isAncient || spawn.name?.includes('Ancient');
            this.isShenk = spawn.isShenk || bossSource.id === 'shenk';
            this.isFrozenstein = spawn.isFrozenstein || bossSource.id === 'frozenstein';

            if (this.isAndariel) this.poisonRadius = 120;
            if (this.isDuriel) { this.holyFreezeRadius = 100; this.holyFreezeSlow = 0.4; }

            // --- Phase 29: Night Fury Bonus ---
            if (window.isNight) {
                this.maxHp = Math.round(this.maxHp * 1.15);
                this.dmg = Math.round(this.dmg * 1.15);
                this.xpReward = Math.round(this.xpReward * 1.25);
                this.isNightFury = true; // Visual indicator flag
            }



            this.isAndariel = spawn.isAndariel || spawn.id === 'andariel';
            if (this.isAndariel) {
                this.name = "Andariel";
                this.icon = 'enemy_demon';
                this.maxHp = Math.round(this.maxHp * 2.5);
                this.dmg = Math.round(this.dmg * 1.5);
                this.poisonRadius = 70;
            }

            this.isDuriel = this.isDuriel || spawn.isDuriel || spawn.id === 'duriel';
            this.isMephisto = this.isMephisto || spawn.isMephisto || spawn.id === 'mephisto' || spawn.id === 'uber_mephisto';
            this.isDiablo = this.isDiablo || spawn.isDiablo || spawn.id === 'diablo' || spawn.id === 'uber_diablo';
            this.isBaal = this.isBaal || spawn.isBaal || spawn.id === 'baal' || spawn.id === 'uber_baal';
            this.isUber = bossSource.isUber || false;
            if (this.isUber) {
                this.name = bossSource.name;
                this.renderScale *= 1.5;
                this.radius *= 1.5;
                this.allRes = 50;
                this.fireRes = 75;
                this.coldRes = 75;
                this.lightRes = 75;
            }

            if (bossSource.riftOnly) {
                this.isRiftBoss = true;
                this.element = bossSource.element || 'shadow';
            }
        }

        // --- Phase 23: Duriel Specialized States ---
        this.isDuriel = this.isDuriel || (spawn.level === 10) || false;
        if (this.isDuriel) {
            this.name = "Duriel, Lord of Pain";
            this.icon = 'enemy_demon';
            this.maxHp = Math.round(this.maxHp * 3.5);
            this.dmg = Math.round(this.dmg * 2.0);
            this.hp = this.maxHp;
            this.holyFreezeRadius = 250;
            this.holyFreezeSlow = 0.5;
        }

        // --- Phase 24: Mephisto Specialized States ---
        this.isMephisto = this.isMephisto || (spawn.level === 15) || (this.name === 'Mephisto, Lord of Hatred');
        if (this.isMephisto) {
            this.name = "Mephisto, Lord of Hatred";
            this.icon = 'enemy_ghost';
            this.maxHp = Math.round(this.maxHp * 2.5); // On top of boss pool base
            this.hp = this.maxHp;
            this.element = 'lightning';
        }

        // --- Phase 25: Diablo Specialized States ---
        this.isDiablo = this.isDiablo || (spawn.level === 20);
        if (this.isDiablo) {
            this.name = "Diablo, Lord of Terror";
            this.icon = 'enemy_demon';
            this.maxHp = Math.round(base.hp * scale * 5.5 * diffMult); // Increased from 3.5
            this.dmg = Math.round(base.dmg * scale * 3.0 * diffMult); // Increased from 2.5
            this.hp = this.maxHp;
            this.element = 'fire';
        }

        // --- Phase 26: Baal Specialized States ---
        this.isBaal = this.isBaal || (spawn.level === 25);
        if (this.isBaal) {
            this.name = "Baal, Lord of Destruction";
            this.icon = 'enemy_cultist';
            this.maxHp = Math.round(base.hp * scale * 7.5 * diffMult); // Increased from 4.0
            this.dmg = Math.round(base.dmg * scale * 4.2 * diffMult); // Increased from 3.2
            this.hp = this.maxHp;
            this.element = 'cold';
        }

        if (this.type !== 'boss') {
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

        // Combat attributes
        this.attackType = base.attackType || 'melee';
        this.element = base.element || 'physical';
        this.projColor = base.projColor || '#cccccc';
        this.projRadius = base.projRadius || 8;

        // AI State
        this.state = 'idle'; // idle | patrol | chase | attack | dead
        this.aggroRange = this.type === 'boss' ? 250 : (this.attackType === 'caster' || this.attackType === 'ranged' ? 280 : 150);
        this.attackRange = this.attackType === 'melee' ? 25 : (this.attackType === 'caster' ? 200 : 250);
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

            // Affix Initialization
            this.abilityCd = 4 + Math.random() * 4;
            this.isMultiShot = base.isMultiShot || false;
            this.isLightningEnchanted = base.isLightningEnchanted || false;

            if (this.type === 'elite') {
                const affix = ELITE_AFFIXES[Math.floor(Math.random() * ELITE_AFFIXES.length)];
                this.name = `${RARE_PREFIX[Math.floor(Math.random() * RARE_PREFIX.length)]} ${RARE_SUFFIX[Math.floor(Math.random() * RARE_SUFFIX.length)]} (${affix.name})`;
                affix.mod(this);
                this.affix = affix;
                this.xpReward *= 3;
            }

            this.hp = this.maxHp;

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
        this.hitFlashTimer = 0;
    }

    update(dt, player, dungeon, allEnemies) {
        if (this.hp <= 0) {
            if (this.state !== 'dead') {
                this.state = 'dead';
                this._onDeath(player);
            }
            return;
        }
        this.hp = Math.min(this.maxHp, this.hp + (this.hpRegen || 0) * dt);

        // Aura Enchanted logic: buff nearby allies
        if (this.hasAura && allEnemies) {
            this._auraPulse = (this._auraPulse || 0) - dt;
            if (this._auraPulse <= 0) {
                this._auraPulse = 1.0;
                fx.emitBurst(this.x, this.y, this.auraType === 'might' ? '#ffd700' : '#4080ff', 12, 1.5);
                for (const other of allEnemies) {
                    if (other === this || other.hp <= 0) continue;
                    const d = Math.sqrt((other.x - this.x) ** 2 + (other.y - this.y) ** 2);
                    if (d < 200) {
                        if (this.auraType === 'might') {
                            other._auraBuff = { dmg: 1.5, timer: 1.5 };
                        } else if (this.auraType === 'holy_fire') {
                            // Holy fire aura logic
                        }
                    }
                }
            }
        }

        // Lightning Enchanted reaction & Hit Flash
        if (this.hp < this._prevHp) {
            this.hitFlashTimer = 0.1; // Flash for 100ms
            if (this.isLightningEnchanted && Math.random() < 0.25) {
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI / 2) * i + Math.random();
                    const tx = this.x + Math.cos(angle) * 100;
                    const ty = this.y + Math.sin(angle) * 100;
                    const proj = new Projectile(this.x, this.y, tx, ty, 300, '#ffff40', this.dmg * 0.4, 'lightning', this, false, 6, 0, 0, 'spark');
                    bus.emit('combat:spawnProjectile', { proj });
                }
                fx.emitBurst(this.x, this.y, '#ffff40', 8);
            }
        }
        this._prevHp = this.hp;
        this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);

        // Teleporter AI
        if (this.canTeleport && player && this.state !== 'idle') {
            this._teleportCd = (this._teleportCd || 0) - dt;
            if (this._teleportCd <= 0) {
                const dist = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
                if (dist < 80 || (this.attackType !== 'melee' && dist > 250)) {
                    const angle = Math.random() * Math.PI * 2;
                    const tx = player.x + Math.cos(angle) * 120;
                    const ty = player.y + Math.sin(angle) * 120;
                    if (dungeon && dungeon.isWalkable(tx, ty)) {
                        fx.emitBurst(this.x, this.y, '#8080ff', 15);
                        this.x = tx; this.y = ty;
                        fx.emitBurst(this.x, this.y, '#b0b0ff', 15);
                        this._teleportCd = 5 + Math.random() * 5;
                    }
                }
            }
        }

        // Rift Boss Nova mechanics
        if (this.isRiftBoss && this.state !== 'dead') {
            const hpPct = this.hp / this.maxHp;
            if (!this._novaThresholds) this._novaThresholds = [0.75, 0.50, 0.25];

            if (this._novaThresholds.length > 0 && hpPct <= this._novaThresholds[0]) {
                this._novaThresholds.shift();
                this._castRiftNova(this.element || 'shadow');
            }
        }

        // Standard AI
        this._updateStatus(dt);
        if (isCCd(this)) return;

        // Fear Logic
        if (isFeared(this)) {
            const angle = Math.atan2(this.y - player.y, this.x - player.x) + (Math.random() - 0.5) * 0.5;
            tryMove(Math.cos(angle) * this.moveSpeed * dt, Math.sin(angle) * this.moveSpeed * dt);
            this._setAnimState('chase');
            return; // Skip normal AI while feared
        }

        // Affix Abilities
        if (this.type !== 'normal') this._tickEliteAbilities(dt);

        let currentMoveSpeed = this.moveSpeed;
        const slow = getSlowFactor(this);
        if (slow > 0) currentMoveSpeed *= (1 - slow / 100);

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;

        // --- Phase 23: Duriel Holy Freeze Aura ---
        if (this.isDuriel && !this.fleeing) {
            if (distSq < this.holyFreezeRadius * this.holyFreezeRadius) {
                // Pulse 10 times a second for status, 1 time for damage
                bus.emit('player:applyAuraSlow', { factor: this.holyFreezeSlow, duration: 0.2 });
                if (Math.random() < 0.05) bus.emit('combat:applyDoT', { target: player, dmg: 2, duration: 1.0, type: 'cold' });
            }
        }

        const aggroRange = this.aggroRange;

        // Helper: try to move, allow sliding along walls if diagonal is blocked
        let movedThisFrame = false;
        let moveDx = 0, moveDy = 0;
        const tryMove = (mx, my) => {
            if (isRooted(this)) return; // Rooted enemies cannot move
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

        let effectiveDistSq = distSq;
        if (effectiveDistSq < aggroRange * aggroRange) {
            if ((this.state === 'patrol' || this.state === 'idle') && dungeon) {
                if (!dungeon.hasLineOfSight(this.x, this.y, player.x, player.y)) {
                    effectiveDistSq = Infinity;
                }
            }
        }

        if (this.fleeing) {
            const angle = Math.atan2(-dy, -dx);
            tryMove(Math.cos(angle) * this.moveSpeed * 1.2 * dt, Math.sin(angle) * this.moveSpeed * 1.2 * dt);
            if (effectiveDistSq > aggroRange * aggroRange * 2) this.fleeing = false;
        }
        else if (effectiveDistSq < aggroRange * aggroRange) {
            this.state = 'chase';
            const angle = Math.atan2(dy, dx);

            // Harden LOS: If target obstructed, increment timer. If >4s, drop aggro.
            const hasLOS = dungeon ? dungeon.hasLineOfSight(this.x, this.y, player.x, player.y) : true;
            if (!hasLOS) {
                this.lostTargetTimer += dt;
                if (this.lostTargetTimer > 4.0) {
                    this.state = 'patrol';
                    this.targetX = this.homeX;
                    this.targetY = this.homeY;
                    this.lostTargetTimer = 0;
                    return;
                }
            } else {
                this.lostTargetTimer = 0;
            }

            // Special Boss skill: Charge
            if (this.isButcher && distSq < 150 * 150 && distSq > 60 * 60) {
                this.chargeCd = (this.chargeCd || 0) - dt;
                if (this.chargeCd <= 0 && !this.isCharging) {
                    this.isCharging = true;
                    this.chargeTimer = 0.8;
                    this.chargeAngle = angle;
                    if (this.leavesPoisonCloud && fx && fx.emitPoisonCloud) {
                        fx.emitPoisonCloud(this.x, this.y, 40);
                        // Also apply a small burst of dmg to nearby players
                        const d = Math.hypot(this.x - player.x, this.y - player.y);
                        if (d < 40) bus.emit('combat:applyDoT', { target: player, dmg: this.dmg * 0.5, duration: 4, type: 'poison' });
                    }

                    bus.emit('combat:log', { text: `${this.name} falls!`, type: 'log-info' });
                }
            }

            // Special Boss skill: Summon Minions at 50% HP
            if (this.isButcher && this.hp < this.maxHp * 0.5 && !this.hasSummoned) {
                this.hasSummoned = true;
                bus.emit('combat:log', { text: "RISE, MY SERVANTS!", type: 'log-crit' });
                bus.emit('combat:spawnMinions', { x: this.x, y: this.y, count: 4 });
            }

            // Special Boss skill: Poison Nova (Andariel)
            if (this.isAndariel && Math.random() < 0.04) {
                if (fx && fx.emitPoisonCloud) {
                    fx.emitPoisonCloud(this.x, this.y, this.poisonRadius);
                    // Check if player in poison area
                    const d = Math.hypot(player.x - this.x, player.y - this.y);
                    if (d < this.poisonRadius) {
                        bus.emit('combat:log', { text: " Maiden of Anguish poisons you!", type: 'log-dmg' });
                        bus.emit('combat:applyDoT', { target: player, dmg: this.dmg * 0.25, duration: 6, type: 'poison' });
                    }
                }
            }

            // --- Phase 30 Mastery: Endgame Boss Skills ---
            if (this.isDiablo && Math.random() < 0.03) {
                bus.emit('combat:log', { text: "Diablo unleashes Fire Nova!", type: 'log-crit' });
                if (fx) fx.emitShockwave(this.x, this.y, 150, '#ff4000');
                const dist = Math.hypot(player.x - this.x, player.y - this.y);
                if (dist < 150) {
                    bus.emit('combat:applyDamage', { attacker: this, target: player, dealt: this.dmg * 1.5, type: 'fire' });
                }
            }

            if (this.isBaal && Math.random() < 0.02) {
                bus.emit('combat:log', { text: "Baal casts Hoarfrost!", type: 'log-crit' });
                if (fx) fx.emitShockwave(this.x, this.y, 120, '#4080ff');
                const dist = Math.hypot(player.x - this.x, player.y - this.y);
                if (dist < 120) {
                    bus.emit('combat:applyDamage', { attacker: this, target: player, dealt: this.dmg, type: 'cold' });
                    player.pushX = (player.x - this.x) * 5;
                    player.pushY = (player.y - this.y) * 5;
                }
            }

            if (this.isShenk && Math.random() < 0.05) {
                // Shenk leaves fire trails
                if (fx) fx.emitFireTrail(this.x, this.y);
            }

            if (this.isFrozenstein && Math.random() < 0.03) {
                // Frozenstein emits cold novas
                bus.emit('combat:log', { text: "Frozenstein emits Cold Nova!", type: 'log-info' });
                if (fx) fx.emitShockwave(this.x, this.y, 80, '#00ccff');
                const dist = Math.hypot(player.x - this.x, player.y - this.y);
                if (dist < 80) {
                    bus.emit('combat:applyDamage', { attacker: this, target: player, dealt: this.dmg * 0.8, type: 'cold' });
                }
            }

            if (this.isMephisto && Math.random() < 0.03) {
                bus.emit('combat:log', { text: "Mephisto summons Lightning Storm!", type: 'log-crit' });
                if (fx) fx.emitBurst(player.x, player.y, '#ffff40', 30, 2);
                bus.emit('combat:applyDamage', { attacker: this, target: player, dealt: this.dmg * 1.2, type: 'lightning' });
            }

            if (this.isCharging) {
                this.chargeTimer -= dt;
                tryMove(Math.cos(this.chargeAngle) * this.moveSpeed * 4 * dt, Math.sin(this.chargeAngle) * this.moveSpeed * 4 * dt);
                if (distSq < 15 * 15) {
                    // Hit player during charge
                    player.hp -= this.dmg * 1.5;
                    this.isCharging = false;
                    this.chargeCd = 6;
                }
                if (this.chargeTimer <= 0) {
                    this.isCharging = false;
                    this.chargeCd = 6;
                }
            } else if (distSq > this.attackRange * this.attackRange || (dungeon && !dungeon.hasLineOfSight(this.x, this.y, player.x, player.y))) {
                // Not in range OR obstructed by wall -> Move closer
                tryMove(Math.cos(angle) * this.moveSpeed * dt, Math.sin(angle) * this.moveSpeed * dt);
            } else if (this.attackType !== 'melee' && distSq < (this.attackRange * 0.4) ** 2) {
                // Kiting: Ranged/Caster enemies back away if player gets too close
                tryMove(-Math.cos(angle) * this.moveSpeed * 0.6 * dt, -Math.sin(angle) * this.moveSpeed * 0.6 * dt);
                this.state = 'chase';
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

    _updateStatus(dt) {
        if (!this._statuses) return;
        for (let i = this._statuses.length - 1; i >= 0; i--) {
            const s = this._statuses[i];
            s.timer -= dt;
            if (s.timer <= 0) this._statuses.splice(i, 1);
        }
    }

    _tickEliteAbilities(dt) {
        if (this.abilityCd > 0) {
            this.abilityCd -= dt;
            return;
        }

        const player = window.player;
        if (!player) return;

        const distSq = (player.x - this.x) ** 2 + (player.y - this.y) ** 2;
        if (distSq > 350 * 350) return; // Only if somewhat near player

        const affixName = this.affix?.name || (this.type === 'boss' ? 'Boss' : '');
        let used = false;

        if (affixName === 'Frozen' || (this.type === 'boss' && Math.random() < 0.2)) {
            // Spawn an Ice Orb AoE
            const ox = player.x + (Math.random() - 0.5) * 40;
            const oy = player.y + (Math.random() - 0.5) * 40;
            bus.emit('combat:spawnAoE', {
                aoe: {
                    x: ox, y: oy, radius: 60, duration: 2.5, dmg: this.dmg * 1.5, type: 'cold', source: this, active: true,
                    isOrb: true, timer: 2.0,
                    update: function (dt, enemies, p) {
                        this.timer -= dt;
                        if (this.timer <= 0 && this.active) {
                            this.active = false;
                            fx.emitBurst(this.x, this.y, '#80d0ff', 20, 2);
                            fx.emitShockwave(this.x, this.y, this.radius, '#ffffff');
                            const d = Math.hypot(p.x - this.x, p.y - this.y);
                            if (d < this.radius) {
                                import('../systems/combat.js').then(c => {
                                    c.applyDamage(this.source, p, { dealt: this.dmg, isCrit: false, type: 'cold' });
                                    c.applyStatus(p, 'frozen', 1.5);
                                });
                            }
                            this.duration = 0.1; // Kill AoE
                        }
                    },
                    render: function (renderer) {
                        const ctx = renderer.ctx || renderer;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius * (1 - this.timer / 2), 0, Math.PI * 2);
                        ctx.strokeStyle = '#80d0ff';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        // Pulse core
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, 10 + Math.sin(Date.now() / 100) * 5, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(128, 208, 255, 0.4)';
                        ctx.fill();
                    }
                }
            });
            used = true;
        } else if (affixName === 'Teleporter' || (this.type === 'boss' && Math.random() < 0.1)) {
            fx.emitShadow(this.x, this.y);
            this.x = player.x + (Math.random() - 0.5) * 200;
            this.y = player.y + (Math.random() - 0.5) * 200;
            fx.emitShadow(this.x, this.y);
            used = true;
        } else if (this.isMephisto && Math.random() < 0.3) {
            // Mephisto Skill: Skull Missile (Cold/Magic)
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            const tx = this.x + Math.cos(angle) * 100;
            const ty = this.y + Math.sin(angle) * 100;
            const proj = new Projectile(
                this.x, this.y, tx, ty, 180, '#fff', this.dmg * 2.0, 'cold', this, false, 15, 0, 0, 'mephisto_skull'
            );
            bus.emit('combat:spawnProjectile', { proj });
            used = true;
        } else if (this.isMephisto && Math.random() < 0.2) {
            // Mephisto Skill: Lightning Storm
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const tx = this.x + Math.cos(angle) * 100;
                const ty = this.y + Math.sin(angle) * 100;
                const proj = new Projectile(
                    this.x, this.y, tx, ty, 220, '#ffff80', this.dmg * 1.5, 'lightning', this, false, 8, 0, 0, 'mephisto_lightning'
                );
                bus.emit('combat:spawnProjectile', { proj });
            }
            used = true;
        } else if (this.isBaal && Math.random() < 0.4) {
            // Baal Skill: Hoarfrost
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            const tx = this.x + Math.cos(angle) * 100;
            const ty = this.y + Math.sin(angle) * 100;
            const proj = new Projectile(
                this.x, this.y, tx, ty, 180, '#fff', this.dmg * 2.0, 'cold', this, false, 25, 0, 0, 'baal_hoarfrost'
            );
            bus.emit('combat:spawnProjectile', { proj });
            used = true;
        } else if (this.isBaal && Math.random() < 0.3) {
            // Baal Skill: Festering Appendages
            for (let i = 0; i < 3; i++) {
                const tx = player.x + (Math.random() - 0.5) * 100;
                const ty = player.y + (Math.random() - 0.5) * 100;
                bus.emit('combat:spawnAoE', {
                    aoe: {
                        x: tx, y: ty, radius: 30, duration: 6.0, dmg: this.dmg * 0.5, tickRate: 0.5, type: 'physical', source: this, active: true,
                        update: function (dt, enemies, player) {
                            this.duration -= dt;
                            if (this.duration <= 0) { this.active = false; return; }
                            this.nextTick = (this.nextTick || 0) - dt;
                            if (this.nextTick <= 0) {
                                this.nextTick = this.tickRate;
                                const d = Math.hypot(player.x - this.x, player.y - this.y);
                                if (d < this.radius) {
                                    import('../systems/combat.js').then(c => {
                                        c.applyDamage(this.source, player, { dealt: this.dmg, isCrit: false, type: 'physical' });
                                    });
                                }
                            }
                        },
                        render: function (renderer, time) {
                            const ctx = renderer.ctx || renderer;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius * (0.8 + Math.sin(time / 200) * 0.2), 0, Math.PI * 2);
                            ctx.fillStyle = 'rgba(100, 30, 20, 0.6)';
                            ctx.fill();
                            ctx.strokeStyle = '#600000';
                            ctx.stroke();
                            // Tentacle spike
                            ctx.fillStyle = '#400000';
                            ctx.fillRect(this.x - 4, this.y - 20, 8, 40);
                        }
                    }
                });
            }
            used = true;
        } else if (this.isBaal && Math.random() < 0.15) {
            // Baal Skill: Duplicate (Visual/Simplified)
            bus.emit('combat:log', { text: "Baal: 'My brothers will not have died in vain!'", type: 'log-info' });
            fx.emitBurst(this.x, this.y, '#8040ff', 40, 3);
            // We don't have a clean mid-combat enemy injector here without more logic, 
            // so we'll just buff his attack speed and damage briefly to simulate the dual-threat
            this.dmg *= 1.2;
            this.atkSpeed *= 1.5;
            setTimeout(() => { if (this.hp > 0) { this.dmg /= 1.2; this.atkSpeed /= 1.5; } }, 5000);
            used = true;
        } else if (this.isDiablo && Math.random() < 0.4) {
            // Diablo Skill: Fire Nova
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const tx = this.x + Math.cos(angle) * 100;
                const ty = this.y + Math.sin(angle) * 100;
                const proj = new Projectile(
                    this.x, this.y, tx, ty, 150, '#ff4000', this.dmg * 1.2, 'fire', this, false, 10, 0, 0, 'diablo_fire_nova'
                );
                bus.emit('combat:spawnProjectile', { proj });
            }
            used = true;
        } else if (this.isDiablo && Math.random() < 0.3) {
            // Diablo Skill: Red Lightning Hose
            const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    if (this.hp <= 0) return;
                    const angle = baseAngle + (Math.random() - 0.5) * 0.2;
                    const tx = this.x + Math.cos(angle) * 100;
                    const ty = this.y + Math.sin(angle) * 100;
                    const proj = new Projectile(
                        this.x, this.y, tx, ty, 300, '#ff2020', this.dmg * 0.8, 'lightning', this, false, 12, 0, 0, 'diablo_lightning_hose'
                    );
                    bus.emit('combat:spawnProjectile', { proj });
                }, i * 100);
            }
            used = true;
        } else if ((this.isDiablo && Math.random() < 0.2) || affixName === 'Waller' || (this.type === 'boss' && Math.random() < 0.15)) {
            // Diablo Skill: Bone Prison (or standard Waller)
            const count = this.isDiablo ? 8 : 4;
            const radius = this.isDiablo ? 60 : 100;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + (this.isDiablo ? 0 : Math.random());
                const wx = player.x + Math.cos(angle) * radius;
                const wy = player.y + Math.sin(angle) * radius;
                bus.emit('combat:spawnAoE', {
                    aoe: {
                        x: wx, y: wy, radius: 25, duration: 4.0, dmg: 0, type: 'wall', source: this, active: true,
                        isWall: true,
                        update: function (dt) {
                            this.duration -= dt;
                            if (this.duration <= 0) this.active = false;
                        },
                        render: function (renderer) {
                            const ctx = renderer.ctx || renderer;
                            ctx.beginPath();
                            ctx.rect(this.x - 12, this.y - 12, 24, 24);
                            ctx.fillStyle = this.source.isDiablo ? 'rgba(200, 50, 50, 0.8)' : 'rgba(100, 100, 100, 0.8)';
                            ctx.fill();
                            ctx.strokeStyle = '#fff';
                            ctx.lineWidth = 1;
                            ctx.stroke();
                            // Inner glow
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                            ctx.fillRect(this.x - 8, this.y - 8, 16, 16);
                        }
                    }
                });
            }
            used = true;
        }

        if (used) this.abilityCd = 6 + Math.random() * 4;
    }

    _onDeath(player) {
        if (this.isFireEnchanted) {
            fx.emitBurst(this.x, this.y, '#ff4000', 40, 3);
            fx.emitShockwave(this.x, this.y, 100, '#ff6000');
            const d = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
            if (d < 100) {
                import('../systems/combat.js').then(c => c.applyDamage(this, player, { dealt: this.dmg * 2.5, isCrit: false, type: 'fire' }));
                bus.emit('combat:log', { text: "Fire Enchanted explosion hit you!", type: 'log-dmg' });
            }
        }
        if (this.isColdEnchanted) {
            fx.emitBurst(this.x, this.y, '#4080ff', 35, 2.5);
            fx.emitShockwave(this.x, this.y, 120, '#80d0ff');
            const d = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
            if (d < 120) {
                import('../systems/combat.js').then(c => {
                    c.applyDamage(this, player, { dealt: this.dmg * 1.5, isCrit: false, type: 'cold' });
                    c.applyStatus(player, 'chill', 5, 0.5);
                });
                bus.emit('combat:log', { text: "Cold Enchanted nova froze you!", type: 'log-dmg' });
            }
        }

        // --- Phase 27: Hellfire Key Drops ---
        const bossKeys = ['andariel', 'duriel', 'mephisto', 'diablo', 'baal'];
        if (bossKeys.includes(this.id) && Math.random() < 0.1) {
            import('../systems/lootSystem.js').then(l => {
                const keyItem = { id: 'hellfire_key', name: "Hellfire Key", rarity: 'normal', icon: 'item_key', type: 'key' };
                // We'll trust the caller (main.js) already has a droppedItems array or similar. 
                // Actually, bosses already drop items in the main game loop via loot.roll.
                // I'll signal main.js instead.
                bus.emit('loot:special', { item: keyItem, x: this.x, y: this.y });
            });
        }

        // --- Custom Boss Death Logic ---
        if (this.isRadament) {
            bus.emit('loot:special', { itemId: 'book_of_skill', x: this.x, y: this.y });
            bus.emit('campaign:flag', { flag: 'radament_slain' });
        }
        if (this.isBeetleburst) {
            bus.emit('loot:special', { itemId: 'staff_of_kings', x: this.x, y: this.y });
        }
        if (this.isColdworm) {
            bus.emit('loot:special', { itemId: 'viper_amulet', x: this.x, y: this.y });
        }
        if (this.isHephaisto) {
            bus.emit('loot:special', { itemId: 'hellforge_hammer', x: this.x, y: this.y });
            bus.emit('campaign:flag', { flag: 'hephaisto_slain' });
        }
        if (this.isIzual) {
            bus.emit('campaign:flag', { flag: 'izual_freed' });
            bus.emit('log:add', { text: "Izual's soul is freed! Return to Tyrael for your reward.", cls: 'log-level' });
        }
        if (this.isDenBoss) {
            bus.emit('campaign:flag', { flag: 'den_cleared' });
        }
        if (this.id === 'boss_mephisto') {
            bus.emit('loot:special', { itemId: 'mephisto_soulstone', x: this.x, y: this.y });
        }

        bus.emit('boss:death', { name: this.name, id: this.id, deathSound: this.deathSound });
    }

    _castRiftNova(element) {
        bus.emit('combat:log', { text: `${this.name} unleashes a devastating ${element} nova!`, type: 'log-crit' });
        const colors = { fire: '#ff4000', cold: '#4080ff', lightning: '#ffff40', shadow: '#cc60ff', physical: '#aaaaaa' };
        bus.emit('combat:spawnAoE', {
            aoe: {
                x: this.x, y: this.y, radius: 150, duration: 1.0, dmg: this.dmg * 2, type: element, source: this, active: true, hasHit: false,
                update: function (dt, enemies, player) {
                    this.duration -= dt;
                    if (this.duration <= 0) { this.active = false; return; }
                    if (!this.hasHit) {
                        const d = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
                        if (d < this.radius) {
                            import('../systems/combat.js').then(c => c.applyDamage(this.source, player, { dealt: this.dmg, isCrit: false, type: this.type }));
                        }
                        this.hasHit = true;
                    }
                },
                render: (r) => {
                    fx.emitBurst(this.x, this.y, colors[element] || '#ff0000', 40, 3);
                    fx.emitShockwave(this.x, this.y, 150, colors[element] || '#ff0000');
                }
            }
        });
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
            // Face target
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                this.facingDir = dx > 0 ? 'right' : 'left';
            } else {
                this.facingDir = dy > 0 ? 'down' : 'up';
            }

            this.attackCd = 1 / this.atkSpeed;
            this._setAnimState('attack');

            if (this.attackType === 'melee') {
                const finalDmg = this.dmg * (1 - (this.damageDebuff || 0) / 100);
                const result = calcDamage(this, finalDmg, DMG_TYPE.PHYSICAL, target);
                applyDamage(this, target, result);

                // Enemy attack VFX on the target (player)
                const angle = Math.atan2(dy, dx);
                fx.emitSlash(target.x, target.y, angle, '#ff6666', 16);
                fx.emitHitImpact(target.x, target.y, 'physical');
                if (this.type === 'boss' || this.isButcher) {
                    fx.shake(200, 3);
                }
            } else {
                // Ranged or Caster attack spawns a projectile
                const speed = this.attackType === 'ranged' ? 220 : 160;
                // Add slight inaccuracy so you can dodge
                const targetX = target.x + (Math.random() - 0.5) * 20;
                const targetY = target.y + (Math.random() - 0.5) * 20;

                const finalDmg = this.dmg * (1 - (this.damageDebuff || 0) / 100);
                const proj = new Projectile(
                    this.x, this.y, targetX, targetY, speed, this.projColor,
                    finalDmg, this.element, this, false, this.projRadius, 0, 0, 'enemy_attack'
                );
                bus.emit('combat:spawnProjectile', { proj });

                // Caster VFX
                if (this.attackType === 'caster') {
                    if (this.element === 'fire') fx.emitBurst(this.x, this.y, '#ff4000', 10, 2);
                    else if (this.element === 'shadow') fx.emitShadow(this.x, this.y);
                }
            }
        }
    }

    render(renderer, time) {
        if (this.hp <= 0) return;

        // Ground Aura for Elites/Bosses
        const isElite = this.type === 'champion' || this.type === 'rare' || this.type === 'unique';
        if (isElite || this.type === 'boss') {
            renderer.ctx.save();
            const pulse = 0.4 + Math.sin(time * 0.005) * 0.2;
            const auraColor = this.type === 'unique' ? 'rgba(191,100,47,' : (this.type === 'rare' ? 'rgba(255,255,0,' : (this.type === 'champion' ? 'rgba(72,80,184,' : 'rgba(238,202,44,'));
            const grd = renderer.ctx.createRadialGradient(this.x, this.y + 2, 5, this.x, this.y + 2, this.type === 'boss' ? 25 : 15);
            grd.addColorStop(0, auraColor + pulse + ')');
            grd.addColorStop(1, 'transparent');
            renderer.ctx.fillStyle = grd;
            renderer.ctx.fillRect(this.x - 30, this.y - 30, 60, 60);
            renderer.ctx.restore();
        }

        // Shadow
        // Shadow
        renderer.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        renderer.ctx.beginPath();
        renderer.ctx.ellipse(this.x, this.y + 6, this.type === 'normal' ? 6 : 10, 3, 0, 0, Math.PI * 2);
        renderer.ctx.fill();

        // Aura
        if (this.type !== 'normal') {
            const auraColor = this.type === 'boss' ? 'rgba(200, 0, 255, 0.4)' : 'rgba(212, 175, 55, 0.4)';
            renderer.ctx.save();
            renderer.ctx.beginPath();
            const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;
            renderer.ctx.arc(this.x, this.y, (this.radius || 10) * 1.3 * pulse, 0, Math.PI * 2);
            renderer.ctx.strokeStyle = auraColor;
            renderer.ctx.lineWidth = 3;
            renderer.ctx.setLineDash([5, 5]); // Dashed aura ring
            renderer.ctx.lineDashOffset = Date.now() / 50;
            renderer.ctx.stroke();
            renderer.ctx.restore();
        }

        // Sprite animation with Aggro Tint & Status Tints
        const baseSize = this.isButcher ? 42 : (this.type === 'normal' ? 16 : (this.type === 'boss' ? 32 : 24));
        const isAggro = this.state === 'chase' || this.state === 'attack';

        let aggroFilter = '';
        if (isElite) aggroFilter += 'drop-shadow(0 0 6px #f0d030) ';
        if (this.type === 'boss') aggroFilter += 'drop-shadow(0 0 8px #ff0000) ';
        if (isAggro) aggroFilter += 'sepia(0.5) saturate(2) hue-rotate(-50deg) ';

        // Status Tints
        if (this._statuses) {
            for (const s of this._statuses) {
                if (s.type === 'chill' || s.type === 'frozen') {
                    aggroFilter += ' hue-rotate(160deg) saturate(1.5) brightness(1.2) ';
                } else if (s.type === 'burn') {
                    aggroFilter += ' hue-rotate(-30deg) saturate(2) brightness(1.1) ';
                } else if (s.type === 'stun') {
                    aggroFilter += ' brightness(1.5) saturate(1.5) sepia(0.3) ';
                } else if (s.type === 'blind') {
                    aggroFilter += ' grayscale(0.8) brightness(0.7) ';
                }
            }
        }

        renderer.drawAnim(this.icon, this.x, this.y - 4, baseSize, this.animState, this.facingDir, time, aggroFilter || null, null, this.hitFlashTimer);

        // HP Bar
        const barW = 20;
        const barH = 2;
        renderer.ctx.fillStyle = '#333';
        renderer.ctx.fillRect(this.x - barW / 2, this.y - 15, barW, barH);

        let hpColor = '#c0392b'; // Default red
        if (this.type === 'unique') hpColor = '#bf642f'; // Unique Gold
        else if (this.type === 'rare') hpColor = '#ffff00'; // Rare Yellow
        else if (this.type === 'champion') hpColor = '#4850b8'; // Champion Blue
        else if (this.type === 'boss') hpColor = '#eeca2c'; // Boss Bright Gold

        renderer.ctx.fillStyle = hpColor;
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
