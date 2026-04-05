/**
 * MAIN.JS — Dark Realm entry point
 * Wires all systems together: menu → game loop → rendering → UI
 */
import { bus } from './engine/EventBus.js';
import { Renderer, Assets } from './engine/Renderer.js';
import { Camera } from './engine/camera.js';
import { Input } from './engine/Input.js';
import { Dungeon } from './world/dungeon.js';
import { Player } from './entities/player.js';
import { Enemy } from './entities/enemy.js';
import { getAllClasses, getClass } from './data/classes.js';
import { loot, SETS } from './systems/lootSystem.js';
import { updateStatuses } from './systems/combat.js';
import { SaveSystem } from './systems/saveSystem.js';
import { NPC } from './entities/npc.js';
import { GameObject } from './entities/object.js';
import { ASSET_NAMES } from './data/assets_list.js';
import { initAudio, playLoot, playCastFire, playCastCold, playCastLightning, playCastPoison, playCastShadow, playDeathSfx, playZoneTransition, startAmbientDungeon, startAmbientBoss, stopAmbient } from './engine/audio.js';
import { ITEM_BASES as items } from './data/items.js';
import { fx } from './engine/ParticleSystem.js';

// ─── GLOBALS ───
let renderer, camera, input, dungeon, player;
let enemies = [], npcs = [], gameObjects = [];
let projectiles = [], aoeZones = [];
let droppedItems = [], droppedGold = [];
let state = 'MENU', selectedClass = null;
let lastTime = 0, lastSaveTime = 0;
let portalReturnZone = 0;
let zoneLevel = 0;
let isTransitioning = false;
let dialogue = null;
let activeSlotId = null;
let lastHitTime = 0;
let explored = null; // for minimap fog
let difficulty = 0; // 0=Normal, 1=Nightmare, 2=Hell
let discoveredWaypoints = new Set([0]); // Always have Town
let stash = Array(20).fill(null); // Personal stash
let cube = Array(9).fill(null); // Horadric Cube
let activeQuests = []; // { id, desc, target, progress, reward }
let completedQuests = new Set();
let killCount = 0;
let sessionGold = 0;
let mercenary = null; // { name, hp, maxHp, dmg, icon, x, y }
let lootFilter = 0; // 0=show all, 1=hide normal, 2=hide normal+magic
let showFullMap = false;
let unlockedAchievements = new Set();
let isIdentifying = false; // Global identification state
let activeDialogueNpc = null; // Track NPC with open dialogue bubble

// ─── RUNEWORDS ───
const RUNEWORDS = [
    {
        name: 'Stealth',
        types: ['armor'],
        sockets: 2,
        gems: ['rune_tal', 'rune_eth'],
        mods: [{stat: 'pctFHR', value: 25}, {stat: 'manaRegenPerSec', value: 15}, {stat: 'flatDEX', value: 6}]
    },
    {
        name: 'Lore',
        types: ['helm'],
        sockets: 2,
        gems: ['rune_ort', 'rune_sol'],
        mods: [{stat: 'lightRes', value: 30}, {stat: 'flatMP', value: 20}, {stat: 'flatDmgReduce', value: 7}]
    },
    {
        name: 'Leaf',
        types: ['weapon'],
        sockets: 2,
        gems: ['rune_tir', 'rune_ral'],
        mods: [{stat: 'flatFireDmg', value: 45}, {stat: 'manaAfterKill', value: 2}, {stat: 'coldRes', value: 33}]
    },
    {
        name: 'Zephyr',
        types: ['weapon'],
        sockets: 2,
        gems: ['rune_ort', 'rune_eth'],
        mods: [{stat: 'pctIAS', value: 25}, {stat: 'flatLightDmg', value: 35}, {stat: 'targetDefenseReduce', value: 25}]
    },
    {
        name: 'Spirit',
        types: ['weapon', 'shield'],
        sockets: 4,
        gems: ['rune_tal', 'rune_thul', 'rune_ort', 'rune_amn'],
        mods: [{stat: 'pctFHR', value: 55}, {stat: 'flatMP', value: 90}, {stat: 'flatVIT', value: 22}]
    },
    {
        name: 'Insight',
        types: ['weapon'],
        sockets: 4,
        gems: ['rune_ral', 'rune_tir', 'rune_tal', 'rune_sol'],
        mods: [{stat: 'manaRegenPerSec', value: 40}, {stat: 'pctDmg', value: 200}, {stat: 'magicFind', value: 23}]
    }
];

function checkRuneword(item) {
    if (!item.socketed || item.socketed.length === 0) return;
    if (item.socketed.length !== item.sockets) return;
    
    // Group weapon types so recipes that say 'weapon' work across all weapons
    const weaponTypes = ['sword', 'axe', 'mace', 'staff', 'orb', 'bow', 'dagger', 'totem', 'wand'];
    const isWeapon = weaponTypes.includes(item.type);

    for (const rw of RUNEWORDS) {
        // Valid if exact type matches OR it's a weapon recipe applied to a weapon base
        const validMatch = rw.types.includes(item.type) || (rw.types.includes('weapon') && isWeapon);
        if (!validMatch) continue;
        
        if (rw.sockets !== item.sockets) continue;
        
        let match = true;
        for (let i = 0; i < rw.gems.length; i++) {
            if (item.socketed[i].baseId !== rw.gems[i]) {
                match = false;
                break;
            }
        }
        
        if (match) {
            item.name = `${rw.name} (${item.name})`;
            item.rarity = 'unique'; 
            if(!item.mods) item.mods = [];
            item.mods.push(...rw.mods.map(m => ({ stat: m.stat, value: m.value })));
            addCombatLog(`Runeword Created: ${rw.name}!`, 'log-crit');
            break;
        }
    }
}

const ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Blood', desc: 'Slay your first monster', check: () => killCount >= 1, reward: 50 },
    { id: 'slayer_10', name: 'Slayer', desc: 'Slay 10 monsters', check: () => killCount >= 10, reward: 100 },
    { id: 'slayer_50', name: 'Veteran Slayer', desc: 'Slay 50 monsters', check: () => killCount >= 50, reward: 300 },
    { id: 'slayer_100', name: 'Legendary Slayer', desc: 'Slay 100 monsters', check: () => killCount >= 100, reward: 500 },
    { id: 'reach_5', name: 'Hero of Act I', desc: 'Reach Zone 5', check: () => discoveredWaypoints.has(5), reward: 200 },
    { id: 'nightmare', name: 'Nightmare Begins', desc: 'Enter Nightmare difficulty', check: () => difficulty >= 1, reward: 500 },
    { id: 'hell', name: 'Into the Fire', desc: 'Enter Hell difficulty', check: () => difficulty >= 2, reward: 1000 },
    { id: 'quest_1', name: 'Quest Seeker', desc: 'Complete your first quest', check: () => completedQuests.size >= 1, reward: 100 },
    { id: 'quest_all', name: 'Champion of Light', desc: 'Complete all quests', check: () => completedQuests.size >= 4, reward: 1000 },
    { id: 'rich', name: 'Golden Hoard', desc: 'Accumulate 1000 gold', check: () => player && player.gold >= 1000, reward: 0 },
    { id: 'merc', name: 'Companionship', desc: 'Hire a mercenary', check: () => mercenary !== null, reward: 0 },
    { id: 'lvl_10', name: 'Rising Power', desc: 'Reach level 10', check: () => player && player.level >= 10, reward: 200 },
];

const ZONE_NAMES = {
    0: 'Rogue Encampment',
    1: 'Blood Moor',
    2: 'Cold Plains',
    3: 'Dark Wood',
    4: 'Catacombs',
    5: 'The Cauterized Arena',
    6: 'Burning Hells',
    7: 'Pandemonium',
};

const DIFFICULTY_NAMES = ['Normal', 'Nightmare', 'Hell'];
const DIFFICULTY_MULT = [1.0, 2.5, 5.0]; // enemy stat multiplier

// ─── DOM REFS ───
const $ = id => document.getElementById(id);

// ─── MENU PARTICLES ───
function initParticles() {
    const el = $('particles');
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = 4 + Math.random() * 12;
        p.style.width = p.style.height = size + 'px';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (6 + Math.random() * 10) + 's';
        p.style.animationDelay = (-Math.random() * 15) + 's';
        p.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
        el.appendChild(p);
    }
}

// ─── CLASS SELECTION GRID ───
function initClassGrid() {
    const grid = $('class-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const cls of getAllClasses()) {
        const card = document.createElement('div');
        card.className = 'class-card';
        card.dataset.classId = cls.id;
        card.innerHTML = `<span class="class-icon"><i class="ra ${getIconForClass(cls.id)}" style="font-size:24px;color:var(--gold);"></i></span><span class="class-card-name">${cls.name}</span>`;
        card.addEventListener('click', () => selectClass(cls.id));
        card.addEventListener('mouseenter', () => showClassInfo(cls.id));
        grid.appendChild(card);
    }
}

function selectClass(classId) {
    selectedClass = classId;
    document.querySelectorAll('.class-card').forEach(c => c.classList.toggle('selected', c.dataset.classId === classId));
    $('btn-new-game').disabled = false;
    showClassInfo(classId);
}

function showClassInfo(classId) {
    const cls = getClass(classId);
    $('class-name').innerHTML = `<i class="ra ${getIconForClass(cls.id)}" style="font-size:24px;vertical-align:middle;color:var(--gold);"></i> ${cls.name}`;
    $('class-desc').textContent = cls.desc;
    const statsHtml = ['str', 'dex', 'vit', 'int'].map(s =>
        `<div class="class-stat-bar"><span>${s.toUpperCase()}</span><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${cls.statBars[s]}%"></div></div></div>`
    ).join('');
    $('class-stats').innerHTML = statsHtml;
}

// ─── START GAME ───
function startGame(slotId = null, loadPlayerData = null) {
    if (!selectedClass && !loadPlayerData) return;

    if (loadPlayerData) {
        // Loading existing character
        selectedClass = loadPlayerData.classId;
        zoneLevel = loadPlayerData.zoneLevel || 0;
        activeSlotId = loadPlayerData.slotId;
    } else {
        // New character
        zoneLevel = 0; // Start in Town
        activeSlotId = slotId || SaveSystem.newSlotId();
    }
    window._activeSlotId = activeSlotId;

    // Switch screens
    $('main-menu').classList.remove('active');
    $('game-screen').classList.add('active');
    state = 'GAME';

    // Init canvas
    const canvas = $('game-canvas');
    renderer = new Renderer(canvas);
    camera = new Camera(renderer.width, renderer.height);
    input = new Input(canvas);

    // Generate dungeon
    dungeon = new Dungeon(80, 60, 16);
    dungeon.generate(zoneLevel, 'cathedral');

    // Create player
    if (loadPlayerData && loadPlayerData.player) {
        player = Player.deserialize(loadPlayerData.player);
        player.x = dungeon.playerStart.x;
        player.y = dungeon.playerStart.y;
        // Restore stash
        if (loadPlayerData.stash && Array.isArray(loadPlayerData.stash)) {
            stash = loadPlayerData.stash;
            while (stash.length < 20) stash.push(null);
        }
        // Restore difficulty and waypoints
        if (typeof loadPlayerData.difficulty === 'number') {
            difficulty = loadPlayerData.difficulty;
        }
        if (Array.isArray(loadPlayerData.waypoints)) {
            discoveredWaypoints = new Set(loadPlayerData.waypoints);
            discoveredWaypoints.add(0); // Always have town
        }
    } else {
        player = new Player(selectedClass);
        player.x = dungeon.playerStart.x;
        player.y = dungeon.playerStart.y;

        const cls = getClass(selectedClass);
        if (cls?.trees[0]?.nodes[0]) {
            const firstSkill = cls.trees[0].nodes[0].id;
            player.hotbar[0] = firstSkill;
            player.talents.points[firstSkill] = 1;
            player.talents.unspent = 0;
        }
    }

    // Potion Belt
    for (let i = 0; i < 4; i++) {
        const slotEl = $(`pi-${i}`);
        const potion = player.belt[i];
        if (potion) {
            slotEl.style.backgroundImage = `url('assets/${potion.icon}.png')`;
            slotEl.title = potion.name;
        } else {
            slotEl.style.backgroundImage = 'none';
            slotEl.title = '';
        }
    }

    camera.follow(player);
    npcs = dungeon.npcSpawns.map(s => new NPC(s.id, s.name, s.type, s.x, s.y, s.icon, s.dialogue, dungeon));
    gameObjects = dungeon.objectSpawns.map(s => new GameObject(s.type, s.x, s.y, s.icon));
    enemies = dungeon.enemySpawns.map(s => new Enemy(s));

    // Apply difficulty scaling to enemies
    if (difficulty > 0) {
        const mult = DIFFICULTY_MULT[difficulty];
        for (const e of enemies) {
            e.maxHp = Math.round(e.maxHp * mult);
            e.hp = e.maxHp;
            e.dmg = Math.round(e.dmg * mult);
            e.xpReward = Math.round(e.xpReward * mult);
        }
    }

    player.setRefs(dungeon, camera, enemies);
    updateSkillBar();

    droppedItems = [];
    droppedGold = [];
    dialogue = null;

    updateHud();

    // Ensure boss bar hidden unless zone 5
    const bossBar = $('boss-hp-bar');
    if (bossBar && zoneLevel !== 5) bossBar.classList.add('hidden');

    // Initial save
    SaveSystem.saveSlot(activeSlotId, player, zoneLevel, stash, { difficulty, waypoints: [...discoveredWaypoints] });

    // Initial ambient audio
    if (zoneLevel === 5) {
        startAmbientBoss();
    } else if (zoneLevel > 0) {
        startAmbientDungeon();
    } else {
        stopAmbient(); // Town is quiet for now
    }

    // Init explored for minimap
    explored = Array.from({ length: dungeon.height }, () => Array(dungeon.width).fill(false));

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// ─── GAME LOOP ───
function gameLoop(timestamp) {
    if (state !== 'GAME') return;
    const dt = Math.min(0.1, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    // Update
    if (player) {
        player.update(dt, input);
        fx.update(dt * 1000); // Particle update expects ms

        // HP Regen out of combat
        if (performance.now() - lastHitTime > 5000 && player.hp < player.maxHp && player.hp > 0) {
            player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.005 * dt);
        }
        // MP Regen (always, slower)
        if (player.mp < player.maxMp && player.hp > 0) {
            player.mp = Math.min(player.maxMp, player.mp + player.maxMp * 0.003 * dt);
        }
    }
    if (camera) {
        camera.w = renderer.width;
        camera.h = renderer.height;
        camera.update(dt);
    }

    // Update entities — pass dungeon for collision checks
    for (const e of (enemies || [])) e.update(dt, player, dungeon);
    for (const n of npcs) n.update(dt);
    if (player) player.updateMinions(dt, enemies, dungeon);

    // Update Projectiles & AoEs
    projectiles.forEach(p => p.update(dt, enemies, player, dungeon, (aoe) => aoeZones.push(aoe)));
    projectiles = projectiles.filter(p => p.active);

    aoeZones.forEach(a => a.update(dt, enemies, player));
    aoeZones = aoeZones.filter(a => a.active);

    // Update Statuses, DoTs, and physics (knockback)
    updateStatuses([player, ...enemies, ...npcs], dt);

    if (dialogue) {
        dialogue.timer -= dt;
        if (dialogue.timer <= 0) dialogue = null;
    }

    if (input.click) {
        checkInteractions(input.click);
        input.click = null;
    }

    // Update Floating Dialogue Position
    if (activeDialogueNpc) {
        const picker = document.getElementById('dialogue-picker');
        if (picker) {
            const screen = camera.toScreen(activeDialogueNpc.x, activeDialogueNpc.y);
            picker.style.left = `${screen.x - 110}px`;
            picker.style.top = `${screen.y - 180}px`;

            // Auto-close if too far
            const d = Math.sqrt((player.x - activeDialogueNpc.x) ** 2 + (player.y - activeDialogueNpc.y) ** 2);
            if (d > 120) {
                picker.remove();
                activeDialogueNpc = null;
            }
        } else {
            activeDialogueNpc = null;
        }
    }

    // Boss check
    if (zoneLevel === 5) {
        const boss = enemies.find(e => e.type === 'boss');
        const hpBar = $('boss-hp-bar');
        if (boss && boss.hp > 0 && state === 'GAME') {
            hpBar.classList.remove('hidden');
            $('boss-hp-fill').style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
            $('boss-name').textContent = boss.name || 'Act Boss';
        } else {
            if (hpBar) hpBar.classList.add('hidden');
        }
    } else {
        const hpBar = $('boss-hp-bar');
        if (hpBar) hpBar.classList.add('hidden');
    }

    // Mercenary follow & attack AI
    if (mercenary && mercenary.hp > 0) {
        const mx = player.x - mercenary.x, my = player.y - mercenary.y;
        const md = Math.sqrt(mx * mx + my * my);
        if (md > 60) {
            mercenary.x += (mx / md) * 85 * dt;
            mercenary.y += (my / md) * 85 * dt;
        }
        // Find closest enemy within archer range
        let closestEnemy = null, closestDist = 250;
        for (const e of enemies) {
            if (e.hp <= 0) continue;
            const ed = Math.sqrt((e.x - mercenary.x) ** 2 + (e.y - mercenary.y) ** 2);
            if (ed < closestDist) { closestDist = ed; closestEnemy = e; }
        }
        if (closestEnemy) {
            mercenary._atkCd = (mercenary._atkCd || 0) - dt;
            if (mercenary._atkCd <= 0) {
                const dmg = mercenary.dmg + Math.floor(Math.random() * 5);
                
                // 15% chance to shoot Fire Arrow, 15% chance for Frost Arrow
                let pType = 'physical', sprite = 'ra-arrow', pDmg = dmg;
                const roll = Math.random();
                if (roll < 0.15) { pType = 'fire'; pDmg *= 1.3; }
                else if (roll < 0.30) { pType = 'cold'; pDmg *= 1.2; }

                projectiles.push(new Projectile(
                    mercenary.x, mercenary.y,
                    closestEnemy.x, closestEnemy.y,
                    300, sprite, pDmg, pType, mercenary, false, 8, 0, 0, 'arrow'
                ));
                
                mercenary._atkCd = 1.2; // Attack speed
                if (player.hp < player.maxHp) player.hp = Math.min(player.maxHp, player.hp + dmg * 0.05); // Minor supportive heal
            }
        }
        // Passive regen
        mercenary.hp = Math.min(mercenary.maxHp, mercenary.hp + mercenary.maxHp * 0.005 * dt);
    }

    checkDeaths();

    // Achievement checker (every frame is fine, checks are cheap)
    checkAchievements();

    // Check portal walk-over collisions
    for (const o of gameObjects) {
        if (o.type === 'portal') {
            const dist = Math.sqrt((player.x - o.x) ** 2 + (player.y - o.y) ** 2);
            if (dist < 20) {
                const res = o.interact(player);
                if (res && res.type === 'PORTAL') {
                    addCombatLog('Entering Portal...', 'log-level');
                    nextZone(res.targetZone);
                    break;
                }
            }
        }
    }

    if (player.hp <= 0 && state === 'GAME') {
        state = 'DEAD';
        $('death-screen').classList.remove('hidden');
        $('death-stats').textContent = `Level ${player.level} ${player.className} — Zone ${zoneLevel}`;
        return;
    }

    const distToExit = Math.sqrt((player.x - dungeon.exitPos.x) ** 2 + (player.y - dungeon.exitPos.y) ** 2);
    if (distToExit < 20) nextZone();

    // Render
    renderer.clear();
    dungeon.render(renderer, camera);

    camera.apply(renderer.ctx);

    // Dropped items (with loot filter)
    for (const di of droppedItems) {
        if (lootFilter >= 1 && (!di.rarity || di.rarity === 'normal')) continue;
        if (lootFilter >= 2 && di.rarity === 'magic') continue;

        // Loot Beam
        if (di.rarity === 'unique' || di.rarity === 'rare' || di.rarity === 'set') {
            const ctx = renderer.ctx;
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const color = di.rarity === 'unique' ? 'rgba(232, 160, 32, 0.6)' : di.rarity === 'set' ? 'rgba(0, 255, 0, 0.5)' : 'rgba(240, 208, 48, 0.5)';
            const g = ctx.createLinearGradient(0, di.y, 0, di.y - 120);
            g.addColorStop(0, color);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(di.x - 4, di.y + 4);
            ctx.lineTo(di.x + 4, di.y + 4);
            ctx.lineTo(di.x + 1, di.y - 120);
            ctx.lineTo(di.x - 1, di.y - 120);
            ctx.closePath();
            ctx.fill();
            
            // Core beam
            const g2 = ctx.createLinearGradient(0, di.y, 0, di.y - 100);
            g2.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            g2.addColorStop(1, 'transparent');
            ctx.fillStyle = g2;
            ctx.fillRect(di.x - 0.5, di.y - 100, 1, 100);
            ctx.restore();
        }

        renderer.drawSprite(di.icon, di.x, di.y, 14);
        renderer.ctx.font = '4px Cinzel, serif';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillStyle = di.rarity === 'unique' ? '#e8a020' : di.rarity === 'set' ? '#00ff00' : di.rarity === 'rare' ? '#f0d030' : di.rarity === 'magic' ? '#4080ff' : '#aaa';
        renderer.ctx.fillText(di.name, di.x, di.y + 10);
    }

    for (const g of droppedGold) {
        renderer.fillCircle(g.x, g.y, 4, '#ffd700');
        renderer.strokeCircle(g.x, g.y, 4, '#c8972a', 1);
        renderer.ctx.font = '4px Cinzel, serif';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillStyle = '#fff';
        renderer.ctx.fillText(g.amount, g.x, g.y + 7);
    }

    const entities = [...(enemies || []), player].filter(e => e).sort((a, b) => a.y - b.y);
    for (const e of entities) {
        if (e.isPlayer) {
            renderer.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            renderer.ctx.beginPath(); renderer.ctx.ellipse(e.x, e.y + 6, 8, 3, 0, 0, Math.PI * 2); renderer.ctx.fill();

            // Draw aura ring if active
            if (e.activeAura) {
                const auraColors = {
                    might_aura: '#ffd700', prayer_aura: '#40c040', holy_fire_aura: '#ff4000',
                    resist_all: '#4080ff', vigor: '#ffffff', fanaticism: '#ffa000', conviction: '#a040ff'
                };
                const auraColor = auraColors[e.activeAura] || '#ffe880';
                const pulse = 0.3 + Math.sin(lastTime * 0.004) * 0.15;
                const auraRadius = 25 + Math.sin(lastTime * 0.003) * 3;
                renderer.ctx.save();
                renderer.ctx.globalAlpha = pulse;
                renderer.ctx.strokeStyle = auraColor;
                renderer.ctx.lineWidth = 1.5;
                renderer.ctx.shadowColor = auraColor;
                renderer.ctx.shadowBlur = 8;
                renderer.ctx.beginPath();
                renderer.ctx.ellipse(e.x, e.y + 2, auraRadius, auraRadius * 0.4, 0, 0, Math.PI * 2);
                renderer.ctx.stroke();
                renderer.ctx.restore();
            }

            renderer.drawAnim(`class_${e.classId}`, e.x, e.y - 4, 18, e.animState, e.facingDir, lastTime, null, e.equipment);
            e.renderMinions(renderer, lastTime);
        } else {
            e.render(renderer, lastTime);
        }
    }

    // Render mercenary
    if (mercenary && mercenary.hp > 0) {
        renderer.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        renderer.ctx.beginPath();
        renderer.ctx.ellipse(mercenary.x, mercenary.y + 6, 6, 3, 0, 0, Math.PI * 2);
        renderer.ctx.fill();
        renderer.drawSprite('class_rogue', mercenary.x, mercenary.y - 4, 16);
        // HP bar above head
        const bw = 18;
        renderer.ctx.fillStyle = '#333';
        renderer.ctx.fillRect(mercenary.x - bw / 2, mercenary.y - 14, bw, 2);
        renderer.ctx.fillStyle = '#4caf50';
        renderer.ctx.fillRect(mercenary.x - bw / 2, mercenary.y - 14, bw * (mercenary.hp / mercenary.maxHp), 2);
        renderer.ctx.font = '5px Cinzel, serif';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillStyle = '#4caf50';
        renderer.ctx.fillText(mercenary.name, mercenary.x, mercenary.y - 18);
    }

    for (const n of npcs) {
        // Subtle glow for town NPCs
        if (zoneLevel === 0) {
            const pulse = 0.5 + Math.sin(lastTime * 0.005) * 0.3;
            renderer.ctx.fillStyle = `rgba(216, 176, 104, ${pulse * 0.2})`;
            renderer.ctx.beginPath();
            renderer.ctx.ellipse(n.x, n.y + 4, 12, 5, 0, 0, Math.PI * 2);
            renderer.ctx.fill();
        }
        n.render(renderer, lastTime);
    }
    for (const obj of gameObjects) obj.render(renderer, lastTime);

    projectiles.forEach(p => p.render(renderer, lastTime));
    aoeZones.forEach(a => a.render(renderer, lastTime));

    bus.emit('render:effects', { renderer, lastTime });

    fx.render(renderer.ctx);

    camera.reset(renderer.ctx);

    if (dialogue) {
        renderer.text(dialogue.text, renderer.width / 2, renderer.height - 120, { size: 16, align: 'center', color: '#ffd700' });
    }

    updateHud();

    // Auto-save every 30 seconds
    if (timestamp - lastSaveTime > 30000 && activeSlotId) {
        lastSaveTime = timestamp;
        SaveSystem.saveSlot(activeSlotId, player, zoneLevel, stash, { difficulty, waypoints: [...discoveredWaypoints] });
        addCombatLog('Auto-saved', 'log-heal');
    }

    renderer.text(`FPS: ${Math.round(1000 / dt)}`, renderer.width - 20, renderer.height - 20, { size: 10, align: 'right', color: '#555' });

    // Premium Ambient Lighting Mask (affecting everything)
    const cx = renderer.width / 2;
    const cy = renderer.height / 2;
    const radius = 450; // Larger vision radius
    const grd = renderer.ctx.createRadialGradient(cx, cy, 100, cx, cy, radius);
    grd.addColorStop(0, 'rgba(0, 0, 0, 0)');      // Full visibility at center
    grd.addColorStop(0.3, 'rgba(0, 0, 0, 0)');    // Wider clear area
    grd.addColorStop(0.7, 'rgba(0, 0, 0, 0.4)');  // Atmospheric penumbra
    grd.addColorStop(1, 'rgba(0, 0, 0, 0.95)');   // Outer darkness

    renderer.ctx.fillStyle = grd;
    renderer.ctx.fillRect(0, 0, renderer.width, renderer.height);

    // ─── MINIMAP ───
    // Render minimap (top right)
    renderMinimap();

    // Render Full Map (TAB)
    if (showFullMap && explored) {
        const mw = renderer.width, mh = renderer.height;
        const ts = dungeon.tileSize;
        const cw = dungeon.width * ts;
        const ch = dungeon.height * ts;
        const scale = Math.min(mw / cw, mh / ch) * 0.8;
        const ox = (mw - cw * scale) / 2;
        const oy = (mh - ch * scale) / 2;

        renderer.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        renderer.ctx.fillRect(0, 0, mw, mh);

        for (let r = 0; r < dungeon.height; r++) {
            for (let c = 0; c < dungeon.width; c++) {
                if (!explored[r][c]) continue;
                const t = dungeon.grid[r][c];
                if (t === 1) continue;
                renderer.ctx.fillStyle = t === 0 ? '#444' : t === 3 ? '#ffd700' : t === 6 ? '#2d5a27' : t === 8 ? '#1e4b85' : '#555';
                renderer.ctx.fillRect(ox + c * ts * scale, oy + r * ts * scale, ts * scale + 1, ts * scale + 1);
            }
        }
        renderer.ctx.fillStyle = '#0f0'; // Player
        renderer.ctx.fillRect(ox + player.x * scale - 2, oy + player.y * scale - 2, 4, 4);
    }



    requestAnimationFrame(gameLoop);
}

function checkInteractions(pos) {
    const worldPos = camera.toWorld(pos.x, pos.y);

    // Check NPCs
    for (const n of npcs) {
        const d = Math.sqrt((n.x - worldPos.x) ** 2 + (n.y - worldPos.y) ** 2);
        if (d < 50) {
            renderDialoguePicker(n);
            return;
        }
    }

    // Check Objects
    for (const o of gameObjects) {
        const d = Math.sqrt((o.x - worldPos.x) ** 2 + (o.y - worldPos.y) ** 2);
        if (d < 20) {
            const res = o.interact(player);
            if (res && res.type === 'LOOT') {
                for (let i = 0; i < res.count; i++) {
                    const itm = loot.generate(zoneLevel);
                    droppedItems.push({ ...itm, x: o.x + (Math.random() - 0.5) * 20, y: o.y + (Math.random() - 0.5) * 20 });
                }
                addCombatLog(`You opened a chest!`, 'log-info');
            } else if (res && res.type === 'PORTAL') {
                addCombatLog('Entering Portal...', 'log-level');
                nextZone(res.targetZone);
            } else if (res && res.type === 'SHRINE') {
                const sType = res.shrineType;
                let buffName = '';
                let duration = 60; // default 60s
                
                if (sType === 'experience') {
                    buffName = 'Experience Shrine (+50% XP)';
                    player._buffs.push({ type: 'exp', id: 'shrine_exp', value: 50, duration: 120 });
                } else if (sType === 'armor') {
                    buffName = 'Armor Shrine (+100% Defense)';
                    player._buffs.push({ type: 'armor', id: 'shrine_armor', value: 100, duration: 60 });
                } else if (sType === 'combat') {
                    buffName = 'Combat Shrine (+50% Damage)';
                    player._buffs.push({ type: 'damage', id: 'shrine_damage', value: 50, duration: 60 });
                } else if (sType === 'mana') {
                    buffName = 'Mana Shrine (+500% Mana Regen)';
                    player._buffs.push({ type: 'mana', id: 'shrine_mana', value: 500, duration: 60 });
                    player.mp = player.maxMp;
                } else if (sType === 'resist') {
                    buffName = 'Resist Shrine (+75 All Resists)';
                    player._buffs.push({ type: 'resist', id: 'shrine_resist', value: 75, duration: 60 });
                } else if (sType === 'speed') {
                    buffName = 'Stamina Shrine (+30% Move Speed)';
                    player._buffs.push({ type: 'speed', id: 'shrine_speed', value: 30, duration: 60 });
                }
                
                player._recalcStats();

                addCombatLog(`Touched ${buffName}`, 'log-heal');
                fx.emitBurst(o.x, o.y, '#4080ff', 30, 2);
            }
            return;
        }
    }

    // Manual Pickup: Items
    for (let i = droppedItems.length - 1; i >= 0; i--) {
        const di = droppedItems[i];
        const dist = Math.sqrt((di.x - worldPos.x) ** 2 + (di.y - worldPos.y) ** 2);
        if (dist < 22) { // Increased pickup radius for comfort
            const distToPlayer = Math.sqrt((di.x - player.x) ** 2 + (di.y - player.y) ** 2);
            if (distToPlayer < 45) {
                if (player.addToInventory(di)) {
                    addCombatLog(`Picked up ${di.name}`, 'log-item');
                    bus.emit('item:pickup', { item: di });
                    droppedItems.splice(i, 1);
                    renderInventory();
                } else {
                    addCombatLog('Inventory full!', 'log-dmg');
                }
            } else {
                addCombatLog('Too far to pick up', 'log-dmg');
            }
            return;
        }
    }

    // Manual Pickup: Gold
    for (let i = droppedGold.length - 1; i >= 0; i--) {
        const dg = droppedGold[i];
        const dist = Math.sqrt((dg.x - worldPos.x) ** 2 + (dg.y - worldPos.y) ** 2);
        if (dist < 22) { // Increased pickup radius for comfort
            const distToPlayer = Math.sqrt((dg.x - player.x) ** 2 + (dg.y - player.y) ** 2);
            if (distToPlayer < 45) {
                player.gold += dg.amount;
                addCombatLog(`Picked up ${dg.amount} Gold`, 'log-heal');
                bus.emit('gold:pickup', { amount: dg.amount });
                droppedGold.splice(i, 1);
                updateHud();
                renderInventory();
            } else {
                addCombatLog('Too far to pick up gold', 'log-dmg');
            }
            return;
        }
    }
}

function checkDeaths() {
    for (const e of enemies) {
        if (e.hp <= 0 && e.state !== 'dead') {
            e.state = 'dead';

            // Death VFX — blood burst
            fx.emitBurst(e.x, e.y, '#a01010', e.type === 'boss' ? 40 : 15, 3);
            if (e.type === 'boss') fx.shake(500, 8);

            player.addXp(e.xpReward);
            // Loot with MF/GF
            const item = loot.roll(e, { magicFind: player.magicFind || 0 });
            if (item) {
                item.x = e.x + (Math.random() - 0.5) * 20;
                item.y = e.y + (Math.random() - 0.5) * 20;
                droppedItems.push(item);
                // Loot beam for rare+ items
                const beamColors = { rare: '#ffff00', unique: '#ff8000', set: '#00ff00', magic: '#6060ff' };
                const beamC = beamColors[item.rarity];
                if (beamC) fx.emitBurst(item.x, item.y - 20, beamC, 12, 1);
            }
            const goldAmt = loot.rollGold(e, player.goldFind || 0);
            addCombatLog(`${e.name} slain! +${e.xpReward} XP`, item ? 'log-item' : 'log-level');

            // Kill counter
            killCount++;

            // Quest tracking
            for (const q of activeQuests) {
                if (q.progress < q.target) {
                    if ((q.bossOnly && e.type === 'boss') || !q.bossOnly) {
                        q.progress++;
                        if (q.progress === q.target) {
                            addCombatLog(`Quest Objective Complete! Return to Akara.`, 'log-crit');
                            updateHud();
                        }
                    }
                }
            }

            if (e.type === 'boss' && zoneLevel === 5) {
                setTimeout(() => {
                    $('victory-screen').classList.remove('hidden');
                    $('victory-stats').textContent = `Level ${player.level} ${player.className} — The butcher is no more.`;
                }, 1500);
                const tp = new GameObject('portal', e.x, e.y - 40, 'env_water');
                tp.targetZone = 6;
                gameObjects.push(tp);
                addCombatLog(`The Ancient Evil has been defeated! The path forward opens...`, 'log-crit');
            }
        }
    }

    // Auto-pickup items and gold within radius
    droppedItems = droppedItems.filter(i => {
        const dx = i.x - player.x, dy = i.y - player.y;
        if (dx * dx + dy * dy < 400) {
            if (player.addToInventory(i)) {
                const colorClass = i.rarity === 'unique' ? 'log-crit' : i.rarity === 'rare' ? 'log-item' : '';
                addCombatLog(`Picked up: ${i.name}`, colorClass || 'log-item');
                return false;
            }
        }
        return true;
    });
    droppedGold = droppedGold.filter(g => {
        const dx = g.x - player.x, dy = g.y - player.y;
        if (dx * dx + dy * dy < 600) {
            player.gold += g.amount;
            return false;
        }
        return true;
    });

    // Player Death
    if (player && player.hp <= 0 && state === 'GAME') {
        state = 'DEAD';
        playDeathSfx();
        $('death-screen').classList.remove('hidden');
        const zName = ZONE_NAMES[zoneLevel] || `Rift Level ${zoneLevel - 7}`;
        $('death-stats').textContent = `You fell in ${zName} at Level ${player.level}.`;
    }
}

function nextZone(targetZone = null) {
    if (isTransitioning) return;
    isTransitioning = true;

    const overlay = document.getElementById('transition-overlay');
    if (overlay) {
        overlay.style.opacity = '1';
        playZoneTransition();
    }

    setTimeout(() => {
        if (targetZone !== null) {
            zoneLevel = targetZone;
        } else {
            zoneLevel++;
        }
        dungeon = new Dungeon(80, 60, 16);
        dungeon.generate(zoneLevel, zoneLevel > 5 ? 'catacombs' : 'cathedral');

        finishZoneLoad();
        isTransitioning = false;

        if (overlay) {
            setTimeout(() => overlay.style.opacity = '0', 200);
        }
    }, 500);
}

function finishZoneLoad() {

    // If we're entering Town from a portal, we should spawn a return portal
    player.x = dungeon.playerStart.x;
    player.y = dungeon.playerStart.y;
    player.path = [];
    player.attackTarget = null;

    // Spawn appropriate entities
    if (zoneLevel === 0) {
        npcs = dungeon.npcSpawns.map(s => new NPC(s.id, s.name, s.type, s.x, s.y, s.icon, s.dialogue, dungeon));
        gameObjects = dungeon.objectSpawns.map(s => new GameObject(s.type, s.x, s.y, s.icon));
        enemies = [];
        
        // If we came from a dungeon, spawn a portal back
        if (portalReturnZone > 0) {
            const portal = new GameObject('portal', player.x + 40, player.y, 'env_water');
            portal.targetZone = portalReturnZone;
            gameObjects.push(portal);
        }
    } else {
        npcs = [];
        gameObjects = dungeon.objectSpawns ? dungeon.objectSpawns.map(s => {
            const obj = new GameObject(s.type, s.x, s.y, s.icon);
            if (s.type === 'shrine') obj.shrineType = s.shrineType;
            return obj;
        }) : [];
        enemies = dungeon.enemySpawns.map(s => new Enemy(s));
        // Apply difficulty scaling
        if (difficulty > 0) {
            const mult = DIFFICULTY_MULT[difficulty];
            const immunityTypes = ['physical', 'fire', 'cold', 'lightning', 'poison'];
            for (const e of enemies) {
                e.maxHp = Math.round(e.maxHp * mult);
                e.hp = e.maxHp;
                e.dmg = Math.round(e.dmg * mult);
                e.xpReward = Math.round(e.xpReward * mult);
                
                // Immunities in Nightmare (10%) and Hell (35%)
                const immChance = difficulty === 1 ? 0.10 : 0.35;
                if (Math.random() < immChance) {
                    const imm = immunityTypes[Math.floor(Math.random() * immunityTypes.length)];
                    e[`${imm}Immune`] = true;
                    e.immunityName = imm;
                    e.name += ` [${imm.charAt(0).toUpperCase() + imm.slice(1)} Immune]`;
                }
            }
        }
    }

    player.setRefs(dungeon, camera, enemies);
    droppedItems = [];
    droppedGold = [];
    dialogue = null;

    const zoneName = ZONE_NAMES[zoneLevel] || `Rift Level ${zoneLevel - 7}`;
    const diffLabel = difficulty > 0 ? ` (${DIFFICULTY_NAMES[difficulty]})` : '';
    // Endgame: zones beyond 7 scale infinitely
    const endgameMult = zoneLevel > 7 ? 1 + (zoneLevel - 7) * 0.3 : 1;
    $('zone-name').textContent = zoneName + diffLabel;
    addCombatLog(`Entered ${zoneName}${diffLabel}!`, 'log-level');
    if (activeSlotId) SaveSystem.saveSlot(activeSlotId, player, zoneLevel, stash, { difficulty, waypoints: [...discoveredWaypoints] });

    // Apply endgame scaling
    if (endgameMult > 1 && enemies.length > 0) {
        for (const e of enemies) {
            e.maxHp = Math.round(e.maxHp * endgameMult);
            e.hp = e.maxHp;
            e.dmg = Math.round(e.dmg * endgameMult);
            e.xpReward = Math.round(e.xpReward * endgameMult);
        }
    }

    // Discover waypoint
    discoveredWaypoints.add(zoneLevel);

    // Difficulty advancement: clearing Zone 5 advances difficulty
    if (zoneLevel > 5 && difficulty < 2) {
        difficulty++;
        addCombatLog(`Difficulty increased to ${DIFFICULTY_NAMES[difficulty]}!`, 'log-crit');
    }

    // Ambient Audio Update
    if (zoneLevel === 5) {
        startAmbientBoss();
    } else if (zoneLevel > 0) {
        startAmbientDungeon();
    } else {
        stopAmbient();
    }

    // Reset explored for minimap
    explored = Array.from({ length: dungeon.height }, () => Array(dungeon.width).fill(false));
}

// ─── HUD ───
function updateHud() {
    if (!player) return;
    
    // Orbs
    const hpFill = $('hp-fill');
    if (hpFill) hpFill.style.height = (player.hp / player.maxHp * 100) + '%';
    const hpText = $('hp-text');
    if (hpText) hpText.textContent = `${Math.ceil(player.hp)}`;

    const mpFill = $('mp-fill');
    if (mpFill) mpFill.style.height = (player.mp / player.maxMp * 100) + '%';
    const mpText = $('mp-text');
    if (mpText) mpText.textContent = `${Math.ceil(player.mp)}`;

    // XP Bar
    const xpPct = player.xpToNext ? (player.xp / player.xpToNext * 100) : 100;
    const xpBar = $('xp-bar');
    if (xpBar) {
        xpBar.style.width = xpPct + '%';
        $('xp-bar-container').title = `Level ${player.level} — ${Math.floor(xpPct)}%`;
    }

    const zoneName = $('zone-name');
    if (zoneName) zoneName.textContent = ZONE_NAMES[zoneLevel] || `Level ${zoneLevel}`;

    // Cooldowns
    for (let i = 0; i < 5; i++) {
        const cd = $(`cd-${i}`);
        if (cd && player.cooldowns[i] > 0) {
            cd.classList.add('active');
            cd.textContent = Math.ceil(player.cooldowns[i]);
        } else if (cd) {
            cd.classList.remove('active');
            cd.textContent = '';
        }
    }

    // Active buffs bar
    const bb = $('buff-bar');
    if (bb) {
        bb.innerHTML = '';
        for (const b of (player._buffs || [])) {
            const el = document.createElement('div');
            el.style.cssText = 'width:24px;height:24px;border:1px solid #aa0;background:#330;border-radius:4px;display:flex;justify-content:center;align-items:center;font-size:12px;color:#ff0;position:relative;cursor:help;pointer-events:auto;';
            el.textContent = '⚡';
            el.title = `${b.type.toUpperCase()}: ${(b.duration || 0).toFixed(1)}s left`;
            bb.appendChild(el);
        }
    }

    // Minion UI
    const mui = $('minions-ui');
    if (mui) {
        if (player.minions && player.minions.length > 0) {
            mui.innerHTML = player.minions.map(m => {
                const pct = Math.max(0, m.hp / m.maxHp * 100);
                return `<div class="minion-portrait" title="${m.name} (${Math.round(m.hp)}/${m.maxHp})">
                  <img src="assets/${m.icon}.png" onerror="this.src='assets/item_orb.png'">
                  <div class="minion-hp-bg"><div class="minion-hp-fill" style="width:${pct}%"></div></div>
                </div>`;
            }).join('');
        } else {
            mui.innerHTML = '';
        }
    }

    // Mercenary HUD
    const mh = $('mercenary-hud');
    if (mh) {
        if (typeof mercenary !== 'undefined' && mercenary && mercenary.hp > 0) {
            mh.classList.remove('hidden');
            $('merc-name').textContent = mercenary.name;
            const mPct = Math.max(0, Math.min(100, (mercenary.hp / mercenary.maxHp) * 100));
            $('merc-hp-fill').style.width = mPct + '%';
        } else {
            mh.classList.add('hidden');
        }
    }

    // Quest HUD
    const qh = $('quest-hud');
    if (qh) {
        if (typeof activeQuests !== 'undefined' && activeQuests.length > 0) {
            qh.classList.remove('hidden');
            $('quest-desc').textContent = activeQuests[0].desc;
            if (activeQuests[0].progress >= activeQuests[0].target) {
                $('quest-progress').textContent = 'Return to Akara';
                $('quest-progress').style.color = '#4caf50';
            } else {
                $('quest-progress').textContent = `${activeQuests[0].progress} / ${activeQuests[0].target}`;
                $('quest-progress').style.color = '#ffd700';
            }
        } else {
            qh.classList.add('hidden');
        }
    }
}

// ─── ICON HELPERS (RPG-AWESOME) ───
function getIconForSkill(id) {
    const iconMap = {
        // ══════════ WARRIOR ══════════
        'warrior':            'ra-crossed-swords',
        'arms':               'ra-sword',
        'bash':               'ra-muscle-up',
        'double_swing':       'ra-dervish-swords',
        'rend':               'ra-dripping-sword',
        'whirlwind':          'ra-spinning-sword',
        'combat_mastery':     'ra-crossed-axes',
        'berserk':            'ra-player-pyromaniac',
        'cleave':             'ra-axe-swing',
        'execute':            'ra-decapitation',
        'defense':            'ra-heavy-shield',
        'shield_bash':        'ra-bolt-shield',
        'iron_skin':          'ra-knight-helmet',
        'block_mastery':      'ra-round-shield',
        'revenge':            'ra-player-dodge',
        'taunt':              'ra-horn-call',
        'fortify':            'ra-guarded-tower',
        'life_tap':           'ra-crowned-heart',
        'last_stand':         'ra-blast',
        'battle':             'ra-castle-flag',
        'warcry':             'ra-horn-call',
        'shout':              'ra-speech-bubble',
        'leap_attack':        'ra-boot-stomp',
        'battle_orders':      'ra-hand-emblem',
        'commanding_shout':   'ra-speech-bubbles',
        'slam':               'ra-groundbreaker',
        'avatar_of_war':      'ra-heavy-fall',
        'war_syn':            'ra-all-for-one',

        // ══════════ SORCERESS ══════════
        'sorceress':          'ra-crystal-wand',
        'fire':               'ra-fire-symbol',
        'fire_bolt':          'ra-small-fire',
        'fireball':           'ra-fire-bomb',
        'fire_mastery':       'ra-burning-embers',
        'meteor':             'ra-burning-meteor',
        'fire_storm':         'ra-arson',
        'immolate':           'ra-campfire',
        'enchant':            'ra-fireball-sword',
        'inferno':            'ra-fire-breath',
        'cold':               'ra-snowflake',
        'ice_bolt':           'ra-frost-emblem',
        'frost_nova':         'ra-frostfire',
        'ice_blast':          'ra-cold-heart',
        'frozen_armor':       'ra-crystal-cluster',
        'blizzard':           'ra-ice-cube',
        'cold_mastery':       'ra-frozen-arrow',
        'frozen_orb':         'ra-crystal-ball',
        'absolute_zero':      'ra-brain-freeze',
        'lightning':          'ra-lightning-bolt',
        'charged_bolt':       'ra-focused-lightning',
        'lightning_bolt':     'ra-lightning',
        'chain_lightning':    'ra-lightning-trio',
        'static_field':       'ra-energise',
        'teleport':           'ra-player-teleport',
        'light_mastery':      'ra-lightning-sword',
        'nova':               'ra-explosion',
        'energy_shield':      'ra-bolt-shield',
        'thunder_storm':      'ra-lightning-storm',

        // ══════════ NECROMANCER ══════════
        'necromancer':        'ra-skull',
        'summoning':          'ra-tombstone',
        'summon_skeleton':    'ra-broken-bone',
        'skeleton_mastery':   'ra-broken-skull',
        'skeleton_mage':      'ra-death-skull',
        'golem':              'ra-monster-skull',
        'golem_mastery':      'ra-gear-hammer',
        'summon_resist':      'ra-circular-shield',
        'revive':             'ra-regeneration',
        'army_of_dead':       'ra-dead-tree',
        'curses':             'ra-eye-monster',
        'amplify_damage':     'ra-broken-shield',
        'weaken':             'ra-health-decrease',
        'iron_maiden':        'ra-crown-of-thorns',
        'life_tap_curse':     'ra-heart-bottle',
        'decrepify':          'ra-noose',
        'lower_resist':       'ra-acid',
        'mass_curse':         'ra-overmind',
        'bone':               'ra-bone-bite',
        'teeth':              'ra-tooth',
        'bone_spear':         'ra-spear-head',
        'bone_armor':         'ra-bone-knife',
        'bone_wall':          'ra-metal-gate',
        'bone_spirit':        'ra-desert-skull',
        'bone_mastery':       'ra-crossed-bones',
        'bone_prison':        'ra-locked-fortress',
        'bone_storm':         'ra-skull-trophy',
        'poison_nova':        'ra-poison-cloud',

        // ══════════ PALADIN ══════════
        'paladin':            'ra-ankh',
        'holy':               'ra-angel-wings',
        'holy_light':         'ra-sunbeams',
        'holy_smite':         'ra-sun-symbol',
        'blessed_hammer':     'ra-hammer-drop',
        'holy_shock':         'ra-player-thunder-struck',
        'consecration':       'ra-aura',
        'holy_mastery':       'ra-sun',
        'divine_shield':      'ra-heavy-shield',
        'divine_storm':       'ra-lightning-storm',
        'foh':                'ra-shot-through-the-heart',
        'auras':              'ra-radial-balance',
        'might_aura':         'ra-muscle-up',
        'prayer_aura':        'ra-health-increase',
        'holy_fire_aura':     'ra-fire-ring',
        'resist_all':         'ra-fire-shield',
        'vigor':              'ra-forward',
        'fanaticism':         'ra-flaming-claw',
        'conviction':         'ra-gavel',
        'aura_mastery':       'ra-triforce',
        'combat':             'ra-crossed-swords',
        'charge':             'ra-boot-stomp',
        'smite':              'ra-flat-hammer',
        'zeal':               'ra-dervish-swords',
        'vengeance':          'ra-flaming-trident',
        'cleansing':          'ra-hospital-cross',
        'judgment':           'ra-crown',

        // ══════════ SHAMAN ══════════
        'shaman':             'ra-lightning',
        'elemental':          'ra-lightning-bolt',
        'lightning_bolt':     'ra-focused-lightning',
        'chain_lightning':    'ra-lightning-trio',
        'thunder_strike':     'ra-player-thunder-struck',
        'elem_mastery':       'ra-energise',
        'storm_caller':       'ra-lightning-storm',
        'earthquake':         'ra-groundbreaker',
        'cl_syn':             'ra-tesla',
        'totems':             'ra-torch',
        'searing_totem':      'ra-campfire',
        'stoneskin_totem':    'ra-guarded-tower',
        'windfury_totem':     'ra-feathered-wing',
        'totem_mastery':      'ra-lit-candelabra',
        'totemic_wrath':      'ra-bomb-explosion',
        'totem_syn':          'ra-candle-fire',
        'restoration':        'ra-heart-bottle',
        'healing_wave':       'ra-health-increase',
        'healing_stream':     'ra-water-drop',
        'earth_shield':       'ra-circular-shield',
        'mana_tide':          'ra-ocean-emblem',
        'nature_swiftness':   'ra-feather-wing',
        'resto_mastery':      'ra-crowned-heart',
        'ancestral_spirit':   'ra-angel-wings',
        'hw_syn':             'ra-droplets',

        // ══════════ ROGUE ══════════
        'rogue':              'ra-hood',
        'assassination':      'ra-daggers',
        'backstab':           'ra-diving-dagger',
        'ambush':             'ra-cloak-and-dagger',
        'eviscerate':         'ra-dripping-knife',
        'lethality':          'ra-bowie-knife',
        'vanish':             'ra-hood',
        'death_blossom':      'ra-shuriken',
        'death_mark':         'ra-on-target',
        'poison':             'ra-poison-cloud',
        'poison_blade':       'ra-dripping-blade',
        'envenom':            'ra-venomous-snake',
        'noxious_cloud':      'ra-gloop',
        'plague':             'ra-biohazard',
        'virulence':          'ra-bottle-vapors',
        'pandemic':           'ra-skull',
        'traps':              'ra-bear-trap',
        'fire_trap':          'ra-fire-bomb',
        'shock_trap':         'ra-focused-lightning',
        'blade_trap':         'ra-circular-saw',
        'trap_mastery':       'ra-bear-trap',
        'shadow_mine':        'ra-bombs',
        'spike_trap':         'ra-spikeball',
        'shadow_strike':      'ra-plain-dagger',
        'death_sentry':       'ra-barbed-arrow',
        'shadow_dance':       'ra-player-dodge',

        // ══════════ WARLOCK ══════════
        'warlock':            'ra-burning-eye',
        'destruction':        'ra-fire-symbol',
        'shadow_bolt':        'ra-bottled-bolt',
        'drain_life':         'ra-bleeding-hearts',
        'soul_fire':          'ra-alien-fire',
        'shadow_mastery':     'ra-arcane-mask',
        'chaos_bolt':         'ra-beam-wake',
        'seed':               'ra-sprout',
        'dark_pact':          'ra-cut-palm',
        'rain_of_chaos':      'ra-burning-meteor',
        'affliction':         'ra-eye-monster',
        'corruption':         'ra-gloop',
        'agony':              'ra-broken-heart',
        'haunt':              'ra-batwings',
        'aff_mastery':        'ra-bleeding-eye',
        'siphon_life':        'ra-glass-heart',
        'unstable':           'ra-radioactive',
        'dark_soul':          'ra-crescent-moon',
        'doom':               'ra-death-skull',
        'demonology':         'ra-dragon',
        'imp':                'ra-small-fire',
        'voidwalker':         'ra-tentacle',
        'demon_armor':        'ra-vest',
        'soul_link':          'ra-two-hearts',
        'demonfire_passive':  'ra-hot-surface',
        'succubus':           'ra-love-howl',
        'infernal':           'ra-lava',
        'metamorphosis':      'ra-hydra',

        // ══════════ DRUID ══════════
        'druid':              'ra-leaf',
        'shapeshifting':      'ra-wolf-head',
        'wolf_form':          'ra-wolf-howl',
        'maul':               'ra-bear-trap',
        'fury':               'ra-flaming-claw',
        'feral_mastery':      'ra-pawprint',
        'bear_form':          'ra-muscle-fat',
        'bear_slam':          'ra-groundbreaker',
        'primal_rage':        'ra-insect-jaws',
        'rabies':             'ra-biohazard',
        'elemental_druid':    'ra-mountains',
        'fissure':            'ra-lava',
        'cyclone_armor':      'ra-fluffy-swirl',
        'tornado':            'ra-fluffy-swirl',
        'twister':            'ra-cycle',
        'hurricane':          'ra-heat-haze',
        'volcano':            'ra-fire-ring',
        'nature_mastery':     'ra-trefoil-lily',
        'armageddon':         'ra-burning-meteor',
        'summoning_druid':    'ra-sprout-emblem',
        'raven':              'ra-raven',
        'spirit_wolf':        'ra-wolf-head',
        'summon_wolf':        'ra-wolf-howl',
        'vine':               'ra-vine-whip',
        'oak_sage':           'ra-acorn',
        'heart_of_wolverine': 'ra-hearts',
        'grizzly':            'ra-crab-claw',
        'stampede':           'ra-lion',
        'companion_hawk':     'ra-bird-claw',

        // ══════════ RANGER ══════════
        'ranger':             'ra-archer',
        'marksmanship':       'ra-archery-target',
        'power_shot':         'ra-supersonic-arrow',
        'multi_shot':         'ra-arrow-cluster',
        'guided_arrow':       'ra-broadhead-arrow',
        'bow_mastery':        'ra-crossbow',
        'immolation_arrow':   'ra-flaming-arrow',
        'strafe':             'ra-arrow-flights',
        'rain_of_arrows':     'ra-target-arrows',
        'nature_ranger':      'ra-pine-tree',
        'companion_hawk':     'ra-bird-claw',
        'viper_arrow':        'ra-chemical-arrow',
        'comp_mastery':       'ra-thorn-arrow',
        'wolf_pack':          'ra-wolf-howl',
        'spirit_guide':       'ra-feather-wing',
        'harmony':            'ra-trefoil-lily',
        'stampede_ranger':    'ra-lion',
        'traps_ranger':       'ra-bear-trap',
        'ice_trap':           'ra-frost-emblem',
        'fire_trap_r':        'ra-fire-bomb',
        'explosive_trap':     'ra-cluster-bomb',
        'trap_mastery_r':     'ra-grenade',
        'scatter_shot':       'ra-cannon-shot',
        'black_arrow':        'ra-barbed-arrow',
        'minefield':          'ra-bombs',
        'mark_death':         'ra-targeted',

        // ══════════ MISC / SYNERGIES ══════════
        'chain_reaction':     'ra-chain',
        'fortress':           'ra-locked-fortress',
    };
    return iconMap[id] || 'ra-cog';
}

function getItemHtml(item, cantEquip = false) {
    if (!item) return '';
    const rarityClass = `rarity-${item.rarity || 'normal'}`;
    const unidentifiedClass = (item.identified === false) ? ' unidentified' : '';
    const equipClass = cantEquip ? ' cant-equip' : '';
    
    // Check if we have an HD version or use the base icon
    let iconName = item.icon || 'item_amulet';
    
    // Support for tinted gems if we are missing specific HD icons (Diamond/Skull)
    let filterStyle = '';
    if (iconName === 'item_diamond') { iconName = 'item_emerald'; filterStyle = 'filter: brightness(2) saturate(0) contrast(1.2);'; }
    if (iconName === 'item_skull') { iconName = 'item_topaz'; filterStyle = 'filter: grayscale(1) brightness(0.8) contrast(1.5);'; }
    
    return `<div class="inv-item ${rarityClass}${unidentifiedClass}${equipClass}">
        <img src="assets/${iconName}.png" style="width:100%; height:100%; object-fit:contain; ${filterStyle}">
    </div>`;
}

function getIconForItem(iconStr) {
    if (!iconStr) return 'ra-circle';
    const s = iconStr.toLowerCase();
    
    // Weapons
    if (s.includes('sword') || s.includes('blade')) return 'ra-broadsword';
    if (s.includes('axe')) return 'ra-battered-axe';
    if (s.includes('mace') || s.includes('hammer') || s.includes('club')) return 'ra-hammer';
    if (s.includes('staff')) return 'ra-wooden-staff';
    if (s.includes('bow')) return 'ra-bow';
    if (s.includes('dagger')) return 'ra-daggers';
    if (s.includes('totem') || s.includes('idol')) return 'ra-totem';
    if (s.includes('wand')) return 'ra-crystal-wand';
    if (s.includes('orb') || s.includes('source')) return 'ra-gem-pendant';
    
    // Armor
    if (s.includes('cap') || s.includes('helm') || s.includes('circlet')) return 'ra-helmet';
    if (s.includes('armor') || s.includes('mail') || s.includes('robe')) return 'ra-chain-mail'; // or ra-vest
    if (s.includes('glove') || s.includes('gauntlet')) return 'ra-glove';
    if (s.includes('boot')) return 'ra-boot-stomp'; // boot
    if (s.includes('shield') || s.includes('buckler')) return 'ra-shield';
    if (s.includes('belt') || s.includes('sash')) return 'ra-belt-buckle';
    
    // Accessories & Consumables
    if (s.includes('ring')) return 'ra-diamond-ring';
    if (s.includes('amulet')) return 'ra-necklace';
    if (s.includes('hp') || s.includes('health') || (s.includes('potion') && s.includes('red'))) return 'ra-health-potion';
    if (s.includes('mp') || s.includes('mana') || (s.includes('potion') && s.includes('blue'))) return 'ra-ammo-bag'; // using ammo for mana temp or standard flask
    if (s.includes('potion')) return 'ra-potion';
    if (s.includes('rune_')) return 'ra-rune-stone';
    if (s.includes('gem_')) return 'ra-gem';
    if (s.includes('charm')) return 'ra-scroll-unfurled';
    if (s.includes('chest_open')) return 'ra-chest';
    
    // Gems specifics
    if (s.includes('ruby')) return 'ra-drop'; // red
    if (s.includes('sapphire')) return 'ra-crystal-cluster'; // blue
    if (s.includes('topaz')) return 'ra-sun'; // yellow
    if (s.includes('emerald')) return 'ra-leaf'; // green
    if (s.includes('diamond')) return 'ra-diamond'; // white
    if (s.includes('amethyst')) return 'ra-eye-shield'; // purple
    if (s.includes('skull')) return 'ra-skull';
    
    return 'ra-help';
}

function getIconForClass(id) {
    if (!id) return 'ra-player';
    const cid = id.toLowerCase();
    if (cid.includes('warrior')) return 'ra-sword';
    if (cid.includes('sorceress')) return 'ra-crystal-wand';
    if (cid.includes('rogue') || cid.includes('assassin')) return 'ra-kunai';
    if (cid.includes('paladin')) return 'ra-shield';
    if (cid.includes('necromancer')) return 'ra-skull';
    if (cid.includes('druid')) return 'ra-pine-tree';
    if (cid.includes('shaman')) return 'ra-lightning-sword';
    if (cid.includes('ranger')) return 'ra-crossbow';
    if (cid.includes('warlock')) return 'ra-bleeding-eye';
    return 'ra-player';
}

function updateSkillBar() {
    if (!player) return;
    for (let i = 0; i < 5; i++) {
        const si = $(`si-${i}`);
        const skillId = player.hotbar[i];
        if (skillId && player.skillMap[skillId]) {
            si.innerHTML = `<i class="ra ${getIconForSkill(skillId)}" style="font-size: 28px; line-height: 48px; text-align: center; color: var(--gold); text-shadow: 0 0 5px #000; width: 100%; height: 100%; display: block; border-radius: 4px; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);"></i>`;
        } else {
            si.innerHTML = '';
        }
    }
}

function addCombatLog(text, cls = '') {
    const log = $('combat-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${cls}`;
    entry.textContent = text;
    log.prepend(entry);
    while (log.children.length > 15) log.removeChild(log.lastChild);
}

// ─── MINIMAP ───
function renderMinimap() {
    if (!dungeon || !player) return;
    const mc = $('minimap');
    if (!mc) return;
    const ctx = mc.getContext('2d');
    const mw = mc.width, mh = mc.height;
    const sx = mw / dungeon.width, sy = mh / dungeon.height;

    // Update explored tiles based on camera view
    if (explored && camera) {
        const camL = Math.max(0, Math.floor((camera.x - camera.w / 2) / dungeon.tileSize));
        const camR = Math.min(dungeon.width - 1, Math.ceil((camera.x + camera.w / 2) / dungeon.tileSize));
        const camT = Math.max(0, Math.floor((camera.y - camera.h / 2) / dungeon.tileSize));
        const camB = Math.min(dungeon.height - 1, Math.ceil((camera.y + camera.h / 2) / dungeon.tileSize));
        for (let r = camT; r <= camB; r++)
            for (let c = camL; c <= camR; c++)
                explored[r][c] = true;
    }

    ctx.clearRect(0, 0, mw, mh);

    // Draw tiles
    for (let r = 0; r < dungeon.height; r++) {
        for (let c = 0; c < dungeon.width; c++) {
            if (explored && !explored[r][c]) continue;
            const t = dungeon.grid[r][c];
            if (t === 1) continue; // WALL = skip (black bg)
            ctx.fillStyle = t === 0 ? '#3a3640' : t === 3 ? '#ffd700' : t === 6 ? '#2d5a27' : t === 7 ? '#5c4a3d' : t === 8 ? '#1e4b85' : '#4a4050';
            ctx.fillRect(c * sx, r * sy, Math.ceil(sx), Math.ceil(sy));
        }
    }

    // Enemy dots
    for (const e of enemies) {
        if (e.hp <= 0) continue;
        const ex = (e.x / dungeon.tileSize) * sx;
        const ey = (e.y / dungeon.tileSize) * sy;
        if (e.type === 'boss') {
            ctx.fillStyle = '#ff0000';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('💀', ex, ey + 3);
        } else {
            ctx.fillStyle = '#e04040';
            ctx.fillRect(ex - 1, ey - 1, 2, 2);
        }
    }

    // NPC dots
    for (const n of npcs) {
        const nx = (n.x / dungeon.tileSize) * sx;
        const ny = (n.y / dungeon.tileSize) * sy;
        ctx.fillStyle = '#40a0ff';
        ctx.beginPath();
        ctx.arc(nx, ny, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    // Player dot
    ctx.fillStyle = '#00ff40';
    const px = (player.x / dungeon.tileSize) * sx;
    const py = (player.y / dungeon.tileSize) * sy;
    ctx.fillRect(px - 2, py - 2, 4, 4);
}
// ─── POTION EVENTS ───
for (let i = 0; i < 4; i++) {
    bus.on(`potion:use:${i}`, () => {
        player.usePotion(i);
        autoBeltRefill();
        updateHud();
    });
}

// ─── INPUT EVENTS ───
bus.on('input:click', p => { input.click = { x: p.screenX, y: p.screenY }; });
bus.on('input:rightclick', p => { 
    // Handle right-click for quick actions if needed
});

// ─── TOGGLES ───
bus.on('ui:toggle:fullmap', () => { showFullMap = !showFullMap; });
bus.on('ui:toggle:lootfilter', () => {
    lootFilter = (lootFilter + 1) % 3;
    const msg = lootFilter === 0 ? 'Loot Filter: Show All' : lootFilter === 1 ? 'Loot Filter: Hide Normal' : 'Loot Filter: Hide Normal & Magic';
    addCombatLog(msg, 'log-info');
});

// ─── COMBAT EVENTS ───
bus.on('combat:damage', d => {
    if (d.target?.isPlayer) {
        lastHitTime = performance.now();
    }
    if (!d.target?.isPlayer) {
        const cls = d.isCrit ? 'log-crit' : 'log-dmg';
        addCombatLog(`${d.dealt} ${d.type} damage${d.isCrit ? ' CRIT!' : ''}`, cls);
    }
    // Floating number
    if (camera && renderer) {
        const screen = camera.toScreen(d.worldX || d.target?.x || 0, d.worldY || d.target?.y || 0);
        const el = document.createElement('div');
        el.className = 'dmg-number';
        el.textContent = d.dealt;
        el.style.left = screen.x + 'px';
        el.style.top = (screen.y - 20) + 'px';
        const dmgColors = { fire: '#ff6030', cold: '#30ccff', lightning: '#ffff40', poison: '#50ff50', shadow: '#cc60ff', physical: '#ffffff' };
        const baseColor = d.target?.isPlayer ? '#e05050' : (dmgColors[d.type] || '#fff');
        el.style.color = d.isCrit ? '#ffa040' : baseColor;
        el.style.fontSize = d.isCrit ? '18px' : '14px';
        el.style.textShadow = d.isCrit ? '0 0 8px #ff6000' : '1px 1px 2px #000';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1200);

        // Audio Triggers
        if (d.target?.isPlayer) {
            // Player hit is already handled in audio.js bus listener, 
            // but we can add more feedback here if needed.
        } else {
            const spellAudio = { fire: playCastFire, cold: playCastCold, lightning: playCastLightning, poison: playCastPoison, shadow: playCastShadow };
            if (spellAudio[d.type]) spellAudio[d.type]();
        }

        // Particle Burst
        const burstColor = d.target?.isPlayer ? '#f00' : (d.type === 'fire' ? '#f60' : d.type === 'cold' ? '#0cf' : '#ff0');
        fx.emitBurst(d.worldX || d.target?.x, d.worldY || d.target?.y, burstColor, d.isCrit ? 20 : 8);
        if (d.isCrit) fx.shake(200, 4);
    }
});

bus.on('combat:spawnProjectile', d => projectiles.push(d.proj));
bus.on('combat:spawnAoE', d => aoeZones.push(d.aoe));

bus.on('combat:spawnMinions', d => {
    for (let i = 0; i < d.count; i++) {
        const angle = (Math.PI * 2 / d.count) * i;
        const tx = d.x + Math.cos(angle) * 70;
        const ty = d.y + Math.sin(angle) * 70;
        if (dungeon && dungeon.isWalkable(tx, ty)) {
            const minionSpawn = {
                type: 'skeleton',
                maxHp: 200 * (difficulty > 0 ? DIFFICULTY_MULT[difficulty] : 1),
                dmg: 25 * (difficulty > 0 ? DIFFICULTY_MULT[difficulty] : 1),
                moveSpeed: 70,
                attackSpeed: 1.2,
                attackRange: 25,
                xpReward: 0,
                color: '#aaa',
                size: 22,
                x: tx, y: ty
            };
            const minion = new Enemy(minionSpawn);
            minion.type = 'champion';
            minion.name = 'Servant of the Butcher';
            enemies.push(minion);
            fx.emitBurst(tx, ty, '#8000ff', 20);
        }
    }
});

bus.on('player:levelup', d => {
    addCombatLog(`LEVEL UP! Now level ${d.level}`, 'log-level');
    updateSkillBar();
});

bus.on('skill:used', d => {
    if (camera && renderer && player) {
        // Spellcast animation
        const screen = camera.toScreen(player.x, player.y - 10);
        const el = document.createElement('div');
        el.className = 'dmg-number';
        el.textContent = '✨';
        el.style.left = screen.x + 'px';
        el.style.top = screen.y + 'px';
        el.style.color = '#80ffff';
        el.style.fontSize = '24px';
        el.style.textShadow = '0 0 10px #4080ff';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 800);
    }
});

// ─── PANEL TOGGLES ───
function togglePanel(name) {
    const panel = $(`panel-${name}`);
    panel.classList.toggle('hidden');
    if (name === 'talents' && !panel.classList.contains('hidden')) renderTalentTree();
    if (name === 'character' && !panel.classList.contains('hidden')) renderCharacterPanel();
    if (name === 'inventory' && !panel.classList.contains('hidden')) renderInventory();
}

bus.on('ui:toggle:inventory', () => togglePanel('inventory'));
bus.on('ui:toggle:talents', () => togglePanel('talents'));
bus.on('ui:toggle:character', () => togglePanel('character'));
bus.on('ui:closeAll', () => {
    ['inventory', 'talents', 'character', 'shop', 'stash', 'cube', 'quests'].forEach(p => {
        const el = $(`panel-${p}`);
        if (el) el.classList.add('hidden');
    });
});

// Town Portal
bus.on('action:town_portal', () => {
    if (state !== 'GAME' || player.hp <= 0) return;
    if (zoneLevel > 0) {
        portalReturnZone = zoneLevel;
        addCombatLog('Town Portal Opened!', 'log-level');
        const tp = new GameObject('portal', player.x, player.y, 'env_water');
        tp.targetZone = 0; // Go to town
        gameObjects.push(tp);
    } else {
        addCombatLog('You are already in town.', 'log-dmg');
    }
});

$('btn-inventory').addEventListener('click', () => togglePanel('inventory'));
$('btn-talents').addEventListener('click', () => togglePanel('talents'));
$('btn-character').addEventListener('click', () => togglePanel('character'));
$('btn-stash')?.addEventListener('click', toggleTownPanels);
$('btn-cube')?.addEventListener('click', toggleTownPanels);

function toggleTownPanels() {
    if (zoneLevel !== 0) {
        addCombatLog('Stash and Cube are only available in town!', 'log-dmg');
        return;
    }
    togglePanel('stash');
    if (!$('panel-stash').classList.contains('hidden')) {
        $('panel-inventory').classList.remove('hidden');
        $('panel-cube').classList.remove('hidden');
        renderStash();
        renderCube();
        renderInventory();
    } else {
        $('panel-cube').classList.add('hidden');
    }
}

$('btn-quests')?.addEventListener('click', () => {
    togglePanel('quests');
    if (!$('panel-quests').classList.contains('hidden')) renderQuestLog();
});

// ─── QUEST LOG ───
function renderQuestLog() {
    const list = $('quest-list');
    const stats = $('quest-stats');
    if (!list || !stats) return;
    list.innerHTML = '';
    
    if (activeQuests.length === 0 && completedQuests.size === 0) {
        list.innerHTML = '<div style="color:#666;text-align:center;padding:20px;">No quests yet.<br>Visit Akara the Elder in town.</div>';
    }

    // Active quests
    for (const q of activeQuests) {
        const div = document.createElement('div');
        const pct = Math.min(100, (q.progress / q.target) * 100);
        const done = q.progress >= q.target;
        div.style.cssText = 'padding:8px;margin-bottom:6px;border:1px solid #333;border-radius:4px;background:#1a1a2a;';
        div.innerHTML = `
            <div style="color:${done ? '#4caf50' : '#ffd700'};font-size:13px;font-family:Cinzel,serif;">${done ? '✅' : '⚔️'} ${q.desc}</div>
            <div style="margin-top:4px;height:6px;background:#222;border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:${done ? '#4caf50' : '#bf642f'};transition:width 0.3s;"></div>
            </div>
            <div style="color:#888;font-size:11px;margin-top:2px;">${q.progress}/${q.target} — Reward: ${q.goldReward}g + ${q.xpReward} XP${done ? ' — Return to Akara!' : ''}</div>
        `;
        list.appendChild(div);
    }

    // Completed quests
    if (completedQuests.size > 0) {
        const header = document.createElement('div');
        header.style.cssText = 'color:#4caf50;font-family:Cinzel,serif;font-size:12px;padding:8px 0 4px;border-bottom:1px solid #333;margin-top:8px;';
        header.textContent = `— Completed (${completedQuests.size}) —`;
        list.appendChild(header);
        for (const qId of completedQuests) {
            const qd = QUEST_POOL.find(q => q.id === qId);
            if (!qd) continue;
            const div = document.createElement('div');
            div.style.cssText = 'color:#666;padding:4px;font-size:11px;';
            div.textContent = `✅ ${qd.desc}`;
            list.appendChild(div);
        }
    }

    // Session stats
    stats.innerHTML = `
        <div>⚔️ Monsters slain: <span style="color:#fff;">${killCount}</span></div>
        <div>🎖️ Quests completed: <span style="color:#fff;">${completedQuests.size}</span></div>
        <div>💀 Difficulty: <span style="color:#bf642f;">${DIFFICULTY_NAMES[difficulty]}</span></div>
        <div>📍 Zones discovered: <span style="color:#fff;">${discoveredWaypoints.size}</span></div>
    `;
}

// ─── AUTO-BELT REFILL ───
function autoBeltRefill() {
    if (!player) return;
    for (let i = 0; i < 4; i++) {
        if (!player.belt[i]) {
            // Find a potion in inventory
            const potIdx = player.inventory.findIndex(it => it && it.type === 'potion');
            if (potIdx !== -1) {
                player.belt[i] = player.inventory[potIdx];
                player.inventory[potIdx] = null;
                addCombatLog(`Auto-refilled belt slot ${i + 1}`, 'log-info');
            }
        }
    }
}


document.querySelectorAll('.panel-close').forEach(btn => {
    btn.addEventListener('click', () => togglePanel(btn.dataset.panel));
});

// ─── TALENT TREE RENDER ───
function renderTalentTree() {
    if (!player) return;
    const cls = getClass(player.classId);
    const container = $('talent-trees');
    container.innerHTML = '';
    $('tp-value').textContent = player.talents.unspent;
    $('talent-tree-title').textContent = `${cls.name} Talents`;

    for (const tree of cls.trees) {
        const col = document.createElement('div');
        col.className = 'tree-column';
        col.innerHTML = `<div class="tree-column-header"><i class="ra ${getIconForSkill(tree.id)}" style="font-size:16px;vertical-align:middle;margin-right:4px;color:var(--gold);"></i> ${tree.name}</div>`;

        // Group by row
        const rows = {};
        for (const node of tree.nodes) { (rows[node.row] = rows[node.row] || []).push(node); }

        for (const rowIdx of Object.keys(rows).sort((a, b) => a - b)) {
            // Connector
            if (+rowIdx > 0) {
                const conn = document.createElement('div');
                conn.className = 'talent-connector' + (rows[rowIdx].some(n => player.talents.baseLevel(n.id) > 0) ? ' active' : '');
                col.appendChild(conn);
            }

            const rowDiv = document.createElement('div');
            rowDiv.className = 'talent-row';

            for (const node of rows[rowIdx]) {
                const pts = player.talents.baseLevel(node.id);
                const eff = player.effectiveSkillLevel(node.id);
                const canSpend = player.talents.canSpend(node.id);
                const isMaxed = pts >= node.maxPts;
                const reqMet = player.talents.reqMet(node.id);

                const el = document.createElement('div');
                el.className = `talent-node ${node.type === 'active' ? 'active-skill' : ''} ${pts > 0 ? (isMaxed ? 'maxed' : 'unlocked') : ''} ${!reqMet ? 'locked' : ''}`;
                el.innerHTML = `<span style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;"><i class="ra ${getIconForSkill(node.id)}" style="font-size:32px; color: ${pts > 0 ? 'var(--gold)' : '#aaa'}; text-shadow:0 0 4px #000;"></i></span><span class="talent-node-pts">${pts}/${node.maxPts}</span>`;
                el.title = `${node.name}\n${node.desc}\n\nBase: ${pts} / ${node.maxPts}${eff > pts ? ` (+${eff - pts} from items)` : ''}${node.mana ? `\nMana: ${node.mana}` : ''}${node.cd ? `\nCD: ${node.cd}s` : ''}${node.req ? `\nRequires: ${node.req}` : ''}${node.endgame ? `\n\n[Endgame] ${node.endgame}` : ''}`;

                if (canSpend) {
                    el.addEventListener('click', () => {
                        player.talents.spend(node.id);
                        renderTalentTree();
                        // Auto-assign to hotbar if active
                        if (node.type === 'active' && !player.hotbar.includes(node.id)) {
                            const empty = player.hotbar.indexOf(null);
                            if (empty !== -1) { player.hotbar[empty] = node.id; updateSkillBar(); }
                        }
                    });
                }

                // Right-click to remove
                el.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if (pts > 0) { player.talents.refund(node.id); renderTalentTree(); }
                });

                rowDiv.appendChild(el);
            }
            col.appendChild(rowDiv);
        }
        container.appendChild(col);
    }
}

// ─── CHARACTER PANEL ───
function renderCharacterPanel() {
    if (!player) return;
    const panel = $('character-stats-panel');
    const sp = player.statPoints;
    const btn = (stat) => sp > 0 ? `<button class="stat-alloc-btn" data-stat="${stat}">+</button>` : '';
    const stats = [
        ['Class', `<i class="ra ${getIconForClass(player.classId)}" style="font-size:16px;vertical-align:middle;color:var(--gold);"></i> ${player.className}`],
        ['Level', player.level],
        ['Gold', player.gold],
        ['Stat Points', `<span style="color:${sp > 0 ? '#ffd700' : '#888'}">${sp}</span>`],
        ['─ ATTRIBUTES ─', ''],
        ['Strength', `${player.str} ${btn('str')}`],
        ['Dexterity', `${player.dex} ${btn('dex')}`],
        ['Vitality', `${player.vit} ${btn('vit')}`],
        ['Intellect', `${player.int} ${btn('int')}`],
        ['─ OFFENSE ─', ''],
        ['Weapon Dmg', `${player.wepMin}–${player.wepMax}`],
        ['Attack Speed', player.atkSpd.toFixed(2)],
        ['Crit Chance', player.critChance + '%'],
        ['Crit Multi', player.critMulti + '%'],
        ['─ DEFENSE ─', ''],
        ['HP', `${Math.round(player.hp)} / ${player.maxHp}`],
        ['MP', `${Math.round(player.mp)} / ${player.maxMp}`],
        ['Armor', Math.round(player.armor)],
        ['Fire Res', player.fireRes + '%'],
        ['Cold Res', player.coldRes + '%'],
        ['Lightning Res', player.lightRes + '%'],
        ['Poison Res', player.poisRes + '%'],
        ['Life Steal', (player.lifeStealPct || 0) + '%'],
        ['Move Speed', Math.round(player.moveSpeed)],
        ['─ FIND ─', ''],
        ['Magic Find', (player.magicFind || 0) + '%'],
        ['Gold Find', (player.goldFind || 0) + '%'],
    ];
    panel.innerHTML = stats.map(([n, v, tooltip]) =>
        n.startsWith('─') ? `<div class="stat-row" style="border-bottom:none;"><span class="stat-name" style="color:var(--gold);font-size:0.75rem;">${n}</span><span></span></div>`
            : `<div class="stat-row"><span class="stat-name" ${tooltip ? `data-tooltip="${tooltip}"` : ''}>${n}</span><span class="stat-val">${v}</span></div>`
    ).join('');

    // Wire stat allocation buttons
    panel.querySelectorAll('.stat-alloc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const stat = btn.dataset.stat;
            if (player.allocateStat(stat)) {
                renderCharacterPanel();
                updateHud();
                addCombatLog(`+1 ${stat.toUpperCase()}`, 'log-level');
            }
        });
    });

    // Wire tooltips for stats
    panel.querySelectorAll('[data-tooltip]').forEach(el => {
        el.addEventListener('mouseenter', (e) => showTooltip({ name: el.dataset.tooltip, rarity: 'normal' }, e.clientX, e.clientY));
        el.addEventListener('mousemove', (e) => moveTooltip(e.clientX, e.clientY));
        el.addEventListener('mouseleave', hideTooltip);
    });
}

// ─── INVENTORY ───
// ─── INVENTORY ───
let socketingGemIndex = -1;

function renderInventory() {
    if (!player) return;

    // 1. Equip Slots (Paper Doll)
    const equipSlots = ['head', 'amulet', 'chest', 'mainhand', 'offhand', 'gloves', 'belt', 'boots', 'ring1', 'ring2'];
    equipSlots.forEach(s => {
        const el = document.querySelector(`.equip-slot[data-slot="${s}"]`);
        if (!el) return;
        const item = player.equipment[s];
        el.innerHTML = item ? getItemHtml(item) : '';
        if (item) {
            const itemEl = el.querySelector('.inv-item');
            setupTooltip(itemEl, item);
            
            // Left-click to socket / identify / unequip
            itemEl.addEventListener('click', (e) => {
                if (window.isIdentifying && item.identified === false) {
                    item.identified = true;
                    window.isIdentifying = false;
                    document.body.style.cursor = 'default';
                    addCombatLog(`Identified: ${item.name}!`, 'log-level');
                    playLoot();
                    renderInventory();
                    renderCharacterPanel();
                    return;
                }
                if (socketingGemIndex !== -1) {
                    const gem = player.inventory[socketingGemIndex];
                    if (item.sockets && item.socketed && item.socketed.length < item.sockets) {
                        item.socketed.push(gem);
                        player.inventory[socketingGemIndex] = null;
                        socketingGemIndex = -1;
                        document.body.style.cursor = 'default';
                        addCombatLog(`Socketed ${gem.name} into ${item.name}!`, 'log-level');
                        checkRuneword(item);
                        renderInventory();
                        renderCharacterPanel();
                        updateHud();
                        return;
                    } else {
                        addCombatLog('Cannot socket that item!', 'log-dmg');
                        socketingGemIndex = -1;
                        document.body.style.cursor = 'default';
                        renderInventory();
                        return;
                    }
                }
            });

            // Right-click to unequip
            itemEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (socketingGemIndex !== -1) return; // Block unequip if socketing
                // Check if inventory full
                if (player.inventory.indexOf(null) === -1) {
                    addCombatLog('Inventory full!', 'log-dmg');
                    return;
                }
                const old = player.unequip(s);
                if (old) {
                    player.addToInventory(old);
                    addCombatLog(`Unequipped ${old.name}`, 'log-level');
                }
                hideTooltip();
                renderInventory();
                renderCharacterPanel();
            });
        }
    });

    // 2. Inventory Grid (10x4 = 40 slots)
    let ig = $('inventory-grid');
    if (!ig) {
        // If the grid doesn't exist yet, we might be in an initialization state or the HTML structure changed.
        // But based on common patterns, we expect it to exist. 
        // Let's add the button to the parent of the grid.
        const container = $('panel-inventory');
        const header = document.createElement('div');
        header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding: 4px 8px; border-bottom:1px solid #333; margin-bottom:4px;';
        header.innerHTML = `
            <span style="font-family:Cinzel,serif; color:var(--gold); font-size:12px;">INVENTORY</span>
            <button id="btn-sort-inv" class="btn-secondary small" style="padding: 2px 8px; font-size:10px;">SORT</button>
        `;
        container.insertBefore(header, container.firstChild);
        header.querySelector('#btn-sort-inv').onclick = () => {
            player.sortInventory();
            renderInventory();
        };
        ig = $('inventory-grid');
    } else {
        // Just ensure the button is there if we are re-rendering
        if (!$('btn-sort-inv')) {
            const container = ig.parentElement;
            const header = document.createElement('div');
            header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding: 4px 8px; border-bottom:1px solid #333; margin-bottom:4px;';
            header.innerHTML = `
                <span style="font-family:Cinzel,serif; color:var(--gold); font-size:12px;">INVENTORY</span>
                <button id="btn-sort-inv" class="btn-secondary small" style="padding: 2px 8px; font-size:10px;">SORT</button>
            `;
            container.insertBefore(header, ig);
            header.querySelector('#btn-sort-inv').onclick = () => {
                player.sortInventory();
                renderInventory();
            };
        }
    }
    ig.innerHTML = '';
    const MAX_INV_SLOTS = 40;

    for (let i = 0; i < MAX_INV_SLOTS; i++) {
        const cell = document.createElement('div');
        cell.className = 'inv-slot';
        const item = player.inventory[i];
        
        // Highlight cell if socketing mode & item is selected
        if (socketingGemIndex === i) cell.style.border = '2px solid #0f0';

        if (item) {
            const div = document.createElement('div');
            const check = player.canEquip(item);
            div.innerHTML = getItemHtml(item, !check.ok);
            const innerDiv = div.firstChild; // The .inv-item div
            setupTooltip(innerDiv, item);

            // Left click to equip / socket / sell
            div.addEventListener('click', () => {
                if (!$('panel-shop').classList.contains('hidden')) {
                    // Sell Logic
                    const price = Math.max(1, typeof calculateSellPrice === 'function' ? calculateSellPrice(item) : 5);
                    player.gold += price;
                    player.inventory[i] = null;
                    addCombatLog(`Sold ${item.name} for ${price} gold.`, 'log-info');
                    hideTooltip();
                    renderInventory();
                    renderCharacterPanel();
                    if (typeof renderShop === 'function') renderShop();
                    playLoot();
                    return;
                }
                
                if (socketingGemIndex !== -1) {
                    if (socketingGemIndex === i) {
                        // Cancel socketing
                        socketingGemIndex = -1;
                        document.body.style.cursor = 'default';
                        renderInventory();
                        return;
                    }
                    const gem = player.inventory[socketingGemIndex];
                    if (item.sockets && item.socketed && item.socketed.length < item.sockets && item.type !== 'gem' && item.type !== 'ring' && item.type !== 'amulet' && item.type !== 'charm') {
                        item.socketed.push(gem);
                        player.inventory[socketingGemIndex] = null;
                        socketingGemIndex = -1;
                        document.body.style.cursor = 'default';
                        addCombatLog(`Socketed ${gem.name} into ${item.name}!`, 'log-level');
                        checkRuneword(item);
                    } else {
                        addCombatLog('Cannot socket that item!', 'log-dmg');
                        socketingGemIndex = -1;
                        document.body.style.cursor = 'default';
                    }
                    renderInventory();
                    return;
                }
                if (window.isIdentifying && item.identified === false) {
                    item.identified = true;
                    window.isIdentifying = false;
                    document.body.style.cursor = 'default';
                    addCombatLog(`Identified: ${item.name}!`, 'log-level');
                    playLoot();
                    renderInventory();
                    renderCharacterPanel();
                    return;
                }

                const result = player.equip(item);
                if (result && result.error) {
                    addCombatLog(result.error, 'log-dmg');
                    return;
                }
                player.inventory[i] = result; // could be null or old item
                renderInventory();
                renderCharacterPanel();
                updateHud();
            });

            // Right-click to Drop/Sell/Belt/Socket
            div.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (socketingGemIndex !== -1) return; // block
                
                // Merchant sell (via dialogue OR open shop panel)
                const shopOpen = !$('panel-shop').classList.contains('hidden');
                const merchantDialogue = dialogue && dialogue.timer > 0 && dialogue.npc && dialogue.npc.type === 'merchant';
                if (shopOpen || merchantDialogue) {
                    const price = item.rarity === 'unique' ? 250 : item.rarity === 'rare' ? 50 : item.rarity === 'magic' ? 10 : 2;
                    player.gold += price;
                    addCombatLog(`Sold ${item.name} for ${price}g`, 'log-heal');
                    bus.emit('gold:pickup', { amount: price });
                    player.inventory[i] = null;
                    if (shopOpen) renderShop();
                }
                // Move to belt if potion
                else if (item.type === 'potion') {
                    const beltIdx = player.belt.indexOf(null);
                    if (beltIdx !== -1) {
                        player.belt[beltIdx] = item;
                        player.inventory[i] = null;
                        addCombatLog(`Added ${item.name} to belt`, 'log-info');
                    } else {
                        addCombatLog('Belt full!', 'log-dmg');
                    }
                }
                // Move to stash if stash panel is open
                else if (!$('panel-stash').classList.contains('hidden')) {
                    const stashIdx = stash.indexOf(null);
                    if (stashIdx !== -1) {
                        stash[stashIdx] = item;
                        player.inventory[i] = null;
                        addCombatLog(`Stored ${item.name} in stash`, 'log-info');
                        renderStash();
                    } else {
                        addCombatLog('Stash full!', 'log-dmg');
                    }
                }
                else if (!$('panel-cube').classList.contains('hidden')) {
                    const cubeIdx = cube.indexOf(null);
                    if (cubeIdx !== -1) {
                        cube[cubeIdx] = item;
                        player.inventory[i] = null;
                        addCombatLog(`Moved ${item.name} to cube`, 'log-info');
                        renderCube();
                    } else {
                        addCombatLog('Cube full!', 'log-dmg');
                    }
                }
                // Enter identify mode if it's a scroll or gem
                else if (item.type === 'scroll' && item.baseId === 'scroll_identify') {
                    window.isIdentifying = true;
                    document.body.style.cursor = `crosshair`;
                    addCombatLog('Select an item to identify', 'log-info');
                    player.inventory[i] = null; // Consume scroll
                    renderInventory();
                }
                else if (item.type === 'gem') {
                    socketingGemIndex = i;
                    document.body.style.cursor = `url('assets/item_amulet.png'), crosshair`;
                    addCombatLog(`Select an item to socket ${item.name} into`, 'log-info');
                    renderInventory();
                    return;
                }
                
                else {
                    const drop = { ...item };
                    drop.x = player.x + (Math.random() - 0.5) * 32;
                    drop.y = player.y + (Math.random() - 0.5) * 32;
                    droppedItems.push(drop);
                    addCombatLog(`Dropped ${item.name}`);
                    player.inventory[i] = null;
                }
                hideTooltip();
                renderInventory();
                renderCharacterPanel();
                updateHud();
            });

            cell.appendChild(div);
        } else {
            // Empty cell can cancel socketing
            cell.addEventListener('click', () => {
                if (socketingGemIndex !== -1) {
                    socketingGemIndex = -1;
                    document.body.style.cursor = 'default';
                    renderInventory();
                }
            });
        }
        ig.appendChild(cell);
    }

    // Gold Display
    const goldRow = document.createElement('div');
    goldRow.className = 'inventory-gold';
    goldRow.innerHTML = `<span style="color:#ffd700;">GOLD:</span> <span style="color:#fff;">${player.gold}</span>`;
    ig.appendChild(goldRow);
}

function setupTooltip(el, item) {
    el.addEventListener('mouseenter', (e) => showTooltip(item, e.clientX, e.clientY));
    el.addEventListener('mousemove', (e) => moveTooltip(e.clientX, e.clientY));
    el.addEventListener('mouseleave', hideTooltip);
}

function showTooltip(item, x, y) {
    const tt = $('custom-tooltip');
    tt.innerHTML = itemTooltipText(item);
    tt.style.display = 'block';
    moveTooltip(x, y);
}

function moveTooltip(x, y) {
    const tt = $('custom-tooltip');
    const offset = 15;
    let tx = x + offset;
    let ty = y + offset;

    // Bounds check
    if (tx + tt.offsetWidth > window.innerWidth) tx = x - tt.offsetWidth - offset;
    if (ty + tt.offsetHeight > window.innerHeight) ty = y - tt.offsetHeight - offset;

    tt.style.left = `${tx}px`;
    tt.style.top = `${ty}px`;
}

function hideTooltip() {
    $('custom-tooltip').style.display = 'none';
}

function itemTooltipText(item) {
    const colors = {
        normal: '#fff',
        magic: '#4850b8',
        rare: '#ffff00',
        set: '#00ff00',
        unique: '#bf642f'
    };
    const c = (item.identified === false) ? '#888' : (colors[item.rarity] || '#fff');

    let t = `<div class="tooltip-inner" style="color:${c};">`;
    t += `<div class="tooltip-name">${item.identified === false ? 'Unidentified ' + (items[item.baseId]?.name || 'Item') : (item.name || items[item.baseId]?.name || 'Unknown Item')}</div>`;

    // Force gems/runes to be identified in tooltip always
    const skipID = (item.type === 'gem' || item.type === 'rune' || item.type === 'charm' || item.type === 'potion');

    if (item.identified === false && !skipID) {
        t += `<div class="tooltip-rarity" style="color:#666;">— Unknown Potential —</div>`;
        t += `<div class="tooltip-stats" style="color:#666; font-style:italic;">Use a Scroll of Identification to reveal this item's powers.</div>`;
        t += `<div class="tooltip-footer">[Left-Click to Equip] | [Right-Click to Deposit]</div>`;
        t += `</div>`;
        return t;
    }

    if (item.rarity && item.rarity !== 'normal' && typeof item.rarity === 'string') {
        const rarityLabel = item.rarity === 'set' ? (item.setName || "SET ITEM") : item.rarity.toUpperCase();
        t += `<div class="tooltip-rarity">— ${rarityLabel} —</div>`;
    }

    const friendlyNames = {
        flatSTR: 'Strength', flatDEX: 'Dexterity', flatVIT: 'Vitality', flatINT: 'Intellect',
        flatHP: 'Life', flatMP: 'Mana', flatArmor: 'Defense', pctArmor: 'Enhanced Defense',
        pctDmg: 'Enhanced Damage', flatMinDmg: 'Minimum Damage', flatMaxDmg: 'Maximum Damage',
        fireRes: 'Fire Resist', coldRes: 'Cold Resist', lightRes: 'Lightning Resist', poisRes: 'Poison Resist',
        allRes: 'All Resistances', critChance: 'Critical Strike Chance', critMulti: 'Critical Damage',
        lifeStealPct: 'Life Stolen per Hit', manaStealPct: 'Mana Stolen per Hit', pctMoveSpeed: 'Faster Run/Walk',
        lifeRegenPerSec: 'Life Replenish', manaRegenPerSec: 'Mana Regen', magicFind: 'Magic Find', goldFind: 'Gold Find',
        pctFireDmg: 'Fire Skill Damage', pctColdDmg: 'Cold Skill Damage', pctLightDmg: 'Lightning Skill Damage',
        pctPoisonDmg: 'Poison Skill Damage', pctShadowDmg: 'Shadow Skill Damage', pctHolyDmg: 'Holy Skill Damage',
        blockChance: 'Chance to Block'
    };

    t += `<div class="tooltip-stats" style="color:#fff;">`;
    if (item.minDmg) t += `<div>Damage: ${item.minDmg}–${item.maxDmg}</div>`;
    if (item.armor) t += `<div>Armor: ${item.armor}</div>`;
    if (item.block) t += `<div>Block: ${item.block}%</div>`;
    if (item.atkSpd && item.atkSpd !== 1) t += `<div>Attack Speed: ${item.atkSpd.toFixed(2)}</div>`;
    
    // Support for Gem/Rune Socket Effects (Compact & Categorized)
    if (item.type === 'gem' && item.socketEffect) {
        t += `<div style="background:rgba(191,100,47,0.1); border:1px solid rgba(191,100,47,0.3); padding:8px; margin-top:10px; border-radius:4px;">`;
        t += `<div style="color:#bf642f; margin-bottom:6px; font-weight:bold; font-size:12px; border-bottom:1px solid #332a1e; padding-bottom:3px;">— SOCKETABLE DATA —</div>`;
        for (const [loc, effect] of Object.entries(item.socketEffect)) {
            const locName = loc.charAt(0).toUpperCase() + loc.slice(1);
            let statLabel = friendlyNames[effect.stat] || effect.stat.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
            const val = effect.value > 0 ? `+${effect.value}` : `${effect.value}`;
            t += `<div style="font-size:11px; margin:2px 0;"><span style="color:#aaa; width:60px; display:inline-block;">${locName}:</span> <span style="color:#4850b8;">${val}${effect.stat.includes('pct') ? '%' : ''} ${statLabel}</span></div>`;
        }
        t += `</div>`;
    }
    if (item.sockets) {
        t += `<div>Sockets: ${item.socketed ? item.socketed.length : 0} / ${item.sockets}</div>`;
        if (item.socketed && item.socketed.length > 0) {
            t += `<div style="color:#bf642f; font-size:12px; margin-top:4px;">`;
            for (const gem of item.socketed) {
                t += `  [ ${gem.name} ]<br>`;
            }
            t += `</div>`;
        }
    }
    t += `</div>`;

    if (item.mods && item.mods.length > 0) {
        t += `<div class="tooltip-mods" style="color:#4850b8;">`;
        for (const mod of item.mods) {
            const val = mod.value > 0 ? `+${mod.value}` : `${mod.value}`;
            let statName = mod.stat;
            // Human readable skill bonuses
            // Mapping for human readable stat names
            const fLabels = friendlyNames; 
            if (statName.startsWith('+skill:')) {
                const skId = statName.split(':')[1];
                statName = `to ${skId.replace(/_/g, ' ').toUpperCase()}`;
            } else if (statName.startsWith('+classSkills:')) {
                statName = `to ${statName.split(':')[1].toUpperCase()} Skills`;
            } else if (statName.startsWith('+skillGroup:')) {
                statName = `to ${statName.split(':')[1].toUpperCase()} Spells`;
            } else if (statName === '+allSkills') {
                statName = "to All Skills";
            } else {
                statName = fLabels[statName] || statName.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
            }
            t += `<div>${val}${mod.stat.includes('pct') || mod.stat.includes('Chance') || mod.stat.includes('Res') ? '%' : ''} ${statName}</div>`;
        }
        t += `</div>`;
    }

    // Requirements
    const req = item.req || {};
    const reqs = [];
    if (req.str) reqs.push(`Str: ${req.str}`);
    if (req.dex) reqs.push(`Dex: ${req.dex}`);
    if (req.int) reqs.push(`Int: ${req.int}`);
    if (item.reqLvl) reqs.push(`Level: ${item.reqLvl}`);
if (reqs.length) {
        t += `<div class="tooltip-requirements">Requires: ${reqs.join(', ')}</div>`;
    }

    let flavorText = item.flavor;
    if (!flavorText) {
        if (item.type === 'gem') {
            if (item.name.includes('Rune')) flavorText = 'An ancient stone etched with a syllable of creation.';
            else flavorText = 'A rare, precious jewel humming with magical potential.';
        } else if (item.type === 'charm') {
            flavorText = 'A minor trinket that carries a lingering aura.';
        } else if (item.type === 'potion') {
            flavorText = 'A mystical elixir sealed in thick glass.';
        } else if (item.type === 'scroll') {
            flavorText = 'A fragile parchment covered in glowing arcane ink.';
        }
    }

    if (flavorText) {
        t += `<div class="tooltip-flavor" style="color:#bf642f; font-style:italic; margin-top:8px;">"${flavorText}"</div>`;
    }

    // Set Item Completion Tracker
    if (item.rarity === 'set' && item.setId) {
        const def = SETS[item.setId];
        if (def) {
            // Count equipped set pieces
            let equipped = 0;
            if (player && player.equipment) {
                for (const eq of Object.values(player.equipment)) {
                    if (eq && eq.setId === item.setId) equipped++;
                }
            }
            const maxTier = Object.keys(def.bonuses).length > 0 ? Math.max(...Object.keys(def.bonuses).map(Number)) : '?';
            t += `<div style="border-top:1px solid #1a3a1a; margin-top:8px; padding-top:6px;">`;
            t += `<div style="color:#00ff00; font-weight:bold; margin-bottom:4px;">${def.name} (${equipped}/${maxTier})</div>`;
            for (const [tier, mods] of Object.entries(def.bonuses)) {
                const active = equipped >= Number(tier);
                const color = active ? '#00ff00' : '#555';
                const modText = mods.map(m => {
                    const fn = friendlyNames[m.stat] || m.stat;
                    return `+${m.value} ${fn}`;
                }).join(', ');
                t += `<div style="color:${color}; font-size:11px;">(${tier}) ${modText}</div>`;
            }
            t += `</div>`;
        }
    }

    t += `<div class="tooltip-footer">[Left-Click to Equip] | [Right-Click to Drop/Sell]</div>`;
    t += `</div>`;
    return t;
}

// ─── DEATH SCREEN ───
$('btn-respawn').addEventListener('click', () => {
    $('death-screen').classList.add('hidden');
    // Death penalty: lose 10% gold
    const goldLost = Math.floor(player.gold * 0.1);
    player.gold -= goldLost;
    if (goldLost > 0) addCombatLog(`Lost ${goldLost} gold on death!`, 'log-dmg');
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.x = dungeon.playerStart.x;
    player.y = dungeon.playerStart.y;
    player.path = [];
    player.attackTarget = null;
    state = 'GAME';
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
});

$('btn-main-menu-death').addEventListener('click', () => {
    $('death-screen').classList.add('hidden');
    $('game-screen').classList.remove('active');
    $('main-menu').classList.add('active');
    state = 'MENU';
});

$('btn-reset-talents')?.addEventListener('click', () => {
    if (!player) return;
    if (player.gold < 500) { addCombatLog('Not enough gold (500 needed)', 'log-dmg'); return; }
    player.gold -= 500;
    player.talents.reset();
    player.hotbar = [null, null, null, null, null];
    updateSkillBar();
    renderTalentTree();
    addCombatLog('Talents reset!', 'log-level');
});

// ─── SHOP UI ───
function calculateSellPrice(item) {
    if (!item) return 0;
    let base = item.price || 10;
    if (item.rarity === 'magic') base *= 3;
    if (item.rarity === 'rare') base *= 10;
    if (item.rarity === 'unique') base *= 25;
    if (item.ilvl) base += (item.ilvl * 5);
    return Math.floor(base * 0.25); // Sell for 25% of absolute value
}

function openShop() {
    $('panel-shop').classList.remove('hidden');
    $('panel-inventory').classList.remove('hidden');
    renderShop();
}

function renderDialoguePicker(npc) {
    activeDialogueNpc = npc;
    const existing = document.getElementById('dialogue-picker');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'dialogue-picker';
    menu.className = 'dialogue-picker-menu';
    
    // Initial position above head
    const screen = camera.toScreen(npc.x, npc.y);
    menu.style.cssText = `
        position: absolute; left: ${screen.x - 110}px; top: ${screen.y - 180}px; width: 220px;
        background: rgba(10, 8, 5, 0.95); border: 1px solid #bf642f;
        padding: 15px; z-index: 1000; font-family: 'Cinzel', serif;
        box-shadow: 0 10px 40px rgba(0,0,0,0.9), inset 0 0 15px rgba(186, 145, 88, 0.1);
        pointer-events: all; border-radius: 8px;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'color: #ffd700; font-size: 16px; margin-bottom: 12px; border-bottom: 1px solid #4a3520; padding-bottom: 6px; text-align: center;';
    title.textContent = npc.name.toUpperCase();
    menu.appendChild(title);

    const options = [
        { label: 'Trade', action: () => { openShop(); menu.remove(); activeDialogueNpc = null; } },
        { label: 'Talk', action: () => { 
            dialogue = { text: `${npc.name}: "${npc.dialogue}"`, timer: 6, npc: npc };
            addCombatLog(dialogue.text, 'log-info');
            menu.remove();
            activeDialogueNpc = null;
        } }
    ];

    // Special: Gamble (Gheed)
    if (npc.id === 'gheed') {
        options.push({ label: 'Gamble', action: () => { openGambleShop(); menu.remove(); activeDialogueNpc = null; } });
    }

    // Special: Akara Services
    if (npc.id === 'akara') {
        options.push({ label: 'Heal & Refill', action: () => {
            player.hp = player.maxHp;
            player.mp = player.maxMp;
            addCombatLog('Akara has restored your health and mana.', 'log-heal');
            fx.emitBurst(player.x, player.y, '#4caf50', 20, 2);
            updateHud();
            menu.remove();
            activeDialogueNpc = null;
        }});
        options.push({ label: 'Reset (500g)', action: () => {
             if (player.gold >= 500) {
                 player.gold -= 500;
                 player.talents.reset();
                 player.hotbar = [null, null, null, null, null];
                 updateSkillBar();
                 renderTalentTree();
                 addCombatLog('Talents reset!', 'log-level');
             } else {
                 addCombatLog('Not enough gold!', 'log-dmg');
             }
             menu.remove();
             activeDialogueNpc = null;
        }});
    }

    // Special: Identify All
    options.push({ label: 'Identify All (100g)', action: () => {
        const cost = 100;
        if (player.gold >= cost) {
            let count = 0;
            player.inventory.forEach(it => { if (it && it.identified === false) { it.identified = true; count++; } });
            if (count > 0) {
                player.gold -= cost;
                addCombatLog(`Identified ${count} items.`, 'log-info');
                playLoot();
                renderInventory();
            } else {
                addCombatLog("No unidentified items found.", "log-info");
            }
        } else {
            addCombatLog("Not enough gold!", "log-dmg");
        }
        menu.remove();
        activeDialogueNpc = null;
    }});

    // Special: Warriv Waypoint Travel
    if (npc.id === 'warriv') {
        // Remove Trade for Warriv — he's a travel NPC, not a merchant
        const tradeIdx = options.findIndex(o => o.label === 'Trade');
        if (tradeIdx >= 0) options.splice(tradeIdx, 1);

        const wpZones = [...discoveredWaypoints].sort((a, b) => a - b);
        for (const wz of wpZones) {
            if (wz === zoneLevel) continue; // Don't show current zone
            const wzName = ZONE_NAMES[wz] || `Rift Level ${wz - 7}`;
            const diffLabel = difficulty > 0 ? ` (${DIFFICULTY_NAMES[difficulty]})` : '';
            options.push({
                label: `⚡ ${wzName}${diffLabel}`,
                action: () => {
                    menu.remove();
                    activeDialogueNpc = null;
                    addCombatLog(`Warriv transports you to ${wzName}...`, 'log-level');
                    nextZone(wz);
                }
            });
        }
    }

    options.push({ label: 'Cancel', action: () => { menu.remove(); activeDialogueNpc = null; } });

    options.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'dialogue-option';
        btn.style.cssText = 'color: #d8b068; cursor: pointer; padding: 10px; margin: 4px 0; text-align: left; transition: all 0.2s; font-size: 13px; background: rgba(191,100,47,0.05); border: 1px solid transparent;';
        btn.onmouseover = () => { btn.style.color = '#fff'; btn.style.background = 'rgba(191,100,47,0.2)'; btn.style.borderColor = '#bf642f'; };
        btn.onmouseout = () => { btn.style.color = '#d8b068'; btn.style.background = 'rgba(191,100,47,0.05)'; btn.style.borderColor = 'transparent'; };
        btn.textContent = `• ${opt.label}`;
        btn.onclick = opt.action;
        menu.appendChild(btn);
    });

    $('game-screen').appendChild(menu);
}


function openGambleShop() {
    $('panel-shop').classList.remove('hidden');
    $('panel-inventory').classList.remove('hidden');
    renderGambleShop();
}

function renderGambleShop() {
    const container = $('shop-items');
    container.innerHTML = '';
    const goldText = $('shop-gold');
    goldText.innerHTML = `Your Gold: <span style="color:var(--gold)">${player.gold}</span><div style="font-size:11px;color:#bf642f;margin-top:4px;">(Gheed's Gambling Service)</div>`;

    const bases = ['ring', 'amulet', 'leather_armor', 'short_sword', 'great_helm', 'circlet', 'gauntlets', 'leather_boots', 'buckler'];
    
    // Gamble prices scale with level
    const cost = Math.max(100, player.level * 50);

    for (const baseId of bases) {
        const base = items[baseId];
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px; border:1px solid #333; background:#111; border-radius:4px; transition:0.2s;';
        
        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:32px; height:32px; border:1px solid #444; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                    ${getItemHtml({ ...base, identified: false, rarity: 'normal' })}
                </div>
                <div style="display:flex; flex-direction:column;">
                    <span style="color:#fff; font-size:13px;">${base.name}</span>
                    <span style="color:#888; font-size:10px;">Unidentified</span>
                </div>
            </div>
            <button class="btn-secondary small">Gamble (${cost}g)</button>
        `;

        row.querySelector('button').onclick = () => {
            if (player.gold >= cost) {
                player.gold -= cost;
                const itm = loot.generateGamble(baseId, player.level);
                if (player.addToInventory(itm)) {
                    playLoot();
                    renderGambleShop();
                    renderInventory();
                } else {
                    player.gold += cost;
                    addCombatLog('Inventory full!', 'log-dmg');
                }
            } else {
                addCombatLog('Not enough gold!', 'log-dmg');
            }
        };

        container.appendChild(row);
    }
}

function renderShop() {
    const container = $('shop-items');
    container.innerHTML = '';
    $('shop-gold').innerHTML = `Your Gold: <span style="color:var(--gold)">${player.gold}</span><div style="font-size:11px;color:#888;margin-top:4px;">(Click items in your Inventory to Sell them!)</div>`;

    const shopInventory = [
        { ...items.health_potion, price: 25 },
        { ...items.mana_potion, price: 25 },
        { ...items.rejuv_potion, price: 75 },
        { ...items.scroll_identify, price: 100 },
        { ...items.scroll_town_portal, price: 100 },
    ];

    // Identify All Service
    const idAllRow = document.createElement('div');
    idAllRow.style.cssText = 'padding:6px; margin: 4px 0; border:1px solid #bf642f; background:#302010; border-radius:4px; text-align:center; cursor:pointer; font-family:Cinzel,serif; color:#ffd700;';
    idAllRow.innerHTML = `📜 Identify All Inventory (300g)`;
    idAllRow.onclick = () => {
        if (player.gold >= 300) {
            let count = 0;
            player.inventory.forEach(it => { if (it && it.identified === false) { it.identified = true; count++; } });
            if (count > 0) {
                player.gold -= 300;
                addCombatLog(`Identified ${count} items.`, 'log-info');
                playLoot();
                renderShop();
                renderInventory();
            } else {
                addCombatLog('No unidentified items found.', 'log-info');
            }
        } else {
            addCombatLog('Not enough gold!', 'log-dmg');
        }
    };
    container.appendChild(idAllRow);

    // Section Header: Buy
    const buyHeader = document.createElement('div');
    buyHeader.style.cssText = 'color:var(--gold);font-family:Cinzel,serif;font-size:14px;padding:4px 0;border-bottom:1px solid #333;';
    buyHeader.textContent = '— Buy Items —';
    container.appendChild(buyHeader);

    for (const item of shopInventory) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '6px';
        row.style.border = '1px solid #333';
        row.style.background = '#1a1a1a';
        row.style.borderRadius = '4px';
        
        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:32px; height:32px; border:1px solid #444; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                    ${getItemHtml(item)}
                </div>
                <span class="tooltip-trigger">${item.name}</span>
            </div>
            <button class="btn-secondary small">Buy (${item.price}g)</button>
        `;
        
        row.querySelector('.tooltip-trigger').addEventListener('mouseenter', e => showTooltip(e, itemTooltipText(item)));
        row.querySelector('.tooltip-trigger').addEventListener('mouseleave', hideTooltip);

        const btn = row.querySelector('button');
        btn.addEventListener('click', () => {
            if (player.gold >= item.price) {
                const purchased = { ...item };
                delete purchased.price;
                if (player.addToInventory(purchased)) {
                    player.gold -= item.price;
                    playLoot();
                    renderShop();
                    renderInventory();
                } else {
                    addCombatLog('Inventory full!', 'log-dmg');
                }
            } else {
                addCombatLog('Not enough gold!', 'log-dmg');
            }
        });
        
        container.appendChild(row);
    }

    // Section: Gambling
    const gambleHeader = document.createElement('div');
    gambleHeader.style.cssText = 'color:#bf642f;font-family:Cinzel,serif;font-size:14px;padding:8px 0 4px;border-bottom:1px solid #333;margin-top:8px;';
    gambleHeader.textContent = '— Gamble —';
    container.appendChild(gambleHeader);

    const gambleCosts = [
        { label: 'Mystery Weapon', cost: 100, type: 'weapon' },
        { label: 'Mystery Armor', cost: 80, type: 'armor' },
        { label: 'Mystery Jewelry', cost: 150, type: 'jewelry' },
    ];

    for (const g of gambleCosts) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px;border:1px solid #4a3520;background:#1a1208;border-radius:4px;';
        row.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="color:#bf642f; font-size:20px;">🎲</span>
                <span style="color:#bf642f;">${g.label}</span>
            </div>
            <button class="btn-secondary small" style="border-color:#bf642f;">Gamble (${g.cost}g)</button>
        `;
        row.querySelector('button').addEventListener('click', () => {
            if (player.gold < g.cost) { addCombatLog('Not enough gold!', 'log-dmg'); return; }
            player.gold -= g.cost;
            const item = loot.generate(player.level, g.type === 'jewelry' ? 'ring' : null);
            if (item && player.addToInventory(item)) {
                const rarityColor = item.rarity === 'unique' ? '#bf642f' : item.rarity === 'rare' ? '#ffff00' : item.rarity === 'magic' ? '#4850b8' : '#fff';
                addCombatLog(`Gambled: ${item.name}!`, item.rarity === 'rare' || item.rarity === 'unique' ? 'log-crit' : 'log-item');
                playLoot();
            } else {
                addCombatLog('Inventory full! Gold lost.', 'log-dmg');
            }
            renderShop();
            renderInventory();
        });
        container.appendChild(row);
    }
}

// ─── STASH & CUBE ───
function renderStash() {
    const grid = $('stash-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    for (let i = 0; i < stash.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'inv-slot';
        const item = stash[i];
        
        if (item) {
            const div = document.createElement('div');
            div.innerHTML = getItemHtml(item);
            const innerDiv = div.firstChild;
            setupTooltip(innerDiv, item);
            
            const moveToInv = (e) => {
                e.preventDefault();
                const empty = player.inventory.indexOf(null);
                if (empty !== -1) {
                    player.inventory[empty] = item;
                    stash[i] = null;
                    addCombatLog(`Took ${item.name} from Stash`, 'log-info');
                    hideTooltip();
                    renderStash();
                    renderInventory();
                } else {
                    addCombatLog('Inventory full!', 'log-dmg');
                }
            };
            div.addEventListener('click', moveToInv);
            div.addEventListener('contextmenu', moveToInv);
            cell.appendChild(div);
        } else {
            // Empy stash cell -> moving cursor to drop into stash? We handled that in inventory right click!
        }
        grid.appendChild(cell);
    }
}

function renderCube() {
    const grid = $('cube-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    for (let i = 0; i < cube.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'inv-slot';
        const item = cube[i];
        
        if (item) {
            const div = document.createElement('div');
            div.innerHTML = getItemHtml(item);
            const innerDiv = div.firstChild;
            setupTooltip(innerDiv, item);
            
            const moveToInv = (e) => {
                e.preventDefault();
                const empty = player.inventory.indexOf(null);
                if (empty !== -1) {
                    player.inventory[empty] = item;
                    cube[i] = null;
                    addCombatLog(`Took ${item.name} from Cube`, 'log-info');
                    hideTooltip();
                    renderCube();
                    renderInventory();
                } else {
                    addCombatLog('Inventory full!', 'log-dmg');
                }
            };
            div.addEventListener('click', moveToInv);
            div.addEventListener('contextmenu', moveToInv);
            cell.appendChild(div);
        }
        grid.appendChild(cell);
    }
}

$('btn-transmute')?.addEventListener('click', () => {
    const resultItem = loot.transmuteCube(cube);
    
    if (resultItem) {
        addCombatLog(`Transmutation Successful! Crafted: ${resultItem.name}`, 'log-crit');
        // Clear all non-null items that were used in the recipe
        cube.forEach((item, index) => {
            if (item) cube[index] = null;
        });
        cube[0] = resultItem; // Place the new item in the top-left slot of the cube
        renderCube();
    } else {
        addCombatLog('Transmutation Failed. Invalid Horadric Recipe.', 'log-dmg');
    }
});

// ─── QUEST SYSTEM ───
const QUEST_POOL = [
    { id: 'slay_5', desc: 'Slay 5 monsters in the Blood Moor', target: 5, goldReward: 150, xpReward: 100 },
    { id: 'slay_10', desc: 'Slay 10 monsters in the wilderness', target: 10, goldReward: 350, xpReward: 250 },
    { id: 'slay_20', desc: 'Defeat 20 creatures of darkness', target: 20, goldReward: 800, xpReward: 500 },
    { id: 'slay_boss', desc: 'Defeat the Act Boss', target: 1, goldReward: 1500, xpReward: 1000, bossOnly: true },
];

function offerQuest() {
    if (!player) return;
    // Check if any quest is completed
    for (let i = activeQuests.length - 1; i >= 0; i--) {
        const q = activeQuests[i];
        if (q.progress >= q.target) {
            player.gold += q.goldReward;
            player.addXp(q.xpReward);
            addCombatLog(`Quest Complete: "${q.desc}" — +${q.goldReward}g, +${q.xpReward} XP!`, 'log-level');
            completedQuests.add(q.id);
            activeQuests.splice(i, 1);
            updateHud();
            return;
        }
    }
    // Offer a new quest if none active
    if (activeQuests.length === 0) {
        const available = QUEST_POOL.filter(q => !completedQuests.has(q.id));
        if (available.length === 0) {
            addCombatLog('Akara: "You have completed all my tasks. You are truly a hero."', 'log-info');
            return;
        }
        const quest = { ...available[0], progress: 0 };
        activeQuests.push(quest);
        addCombatLog(`New Quest: "${quest.desc}"`, 'log-level');
    } else {
        const q = activeQuests[0];
        addCombatLog(`Quest Progress: "${q.desc}" — ${q.progress}/${q.target}`, 'log-info');
    }
}


// ─── MERCENARY HIRE ───
function hireMercenary() {
    if (!player) return;
    if (mercenary && mercenary.hp > 0) {
        addCombatLog('Kashya: "Your rogue still fights! Return when she falls."', 'log-info');
        return;
    }
    if (mercenary && mercenary.hp <= 0) {
        const cost = 200;
        if (player.gold < cost) { addCombatLog(`Not enough gold! (${cost}g to resurrect)`, 'log-dmg'); return; }
        player.gold -= cost;
        mercenary.hp = mercenary.maxHp;
        addCombatLog(`Kashya: "${mercenary.name} has been revived!"`, 'log-level');
        updateHud();
        return;
    }
    const cost = 500;
    if (player.gold < cost) { addCombatLog(`Not enough gold! (${cost}g to hire)`, 'log-dmg'); return; }
    player.gold -= cost;
    const names = ['Aliza', 'Blaise', 'Paige', 'Kyra', 'Ryann'];
    const lvl = player.level || 1;
    mercenary = {
        name: names[Math.floor(Math.random() * names.length)],
        hp: 60 + lvl * 15, maxHp: 60 + lvl * 15,
        dmg: 5 + lvl * 2,
        x: player.x + 20, y: player.y,
        _atkCd: 0,
        isMercenary: true,
        isPlayer: true, // Inherits player faction so projectiles target enemies
        icon: 'class_rogue'
    };
    addCombatLog(`Hired Mercenary ${mercenary.name}! She will fight by your side.`, 'log-level');
    updateHud();
}

// ─── ACHIEVEMENTS ───
function checkAchievements() {
    for (const ach of ACHIEVEMENTS) {
        if (!unlockedAchievements.has(ach.id) && ach.check()) {
            unlockedAchievements.add(ach.id);
            addCombatLog(`🏆 Achievement Unlocked: ${ach.name}!`, 'log-crit');
            addCombatLog(`    ${ach.desc}`, 'log-info');
            if (ach.reward > 0 && player) {
                player.gold += ach.reward;
                addCombatLog(`    Reward: ${ach.reward} gold`, 'log-item');
                updateHud();
            }
        }
    }
}

// ─── INIT ───
window.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initClassGrid();

    // Preload all pixel art assets
    for (const name of ASSET_NAMES) {
        Assets.load(name, `assets/${name}.png`);
    }

    renderSaveSlots();

    $('btn-new-game').addEventListener('click', () => {
        if (!selectedClass) return;
        initAudio();
        startGame();
    });

    // Death Screen
    $('btn-respawn').addEventListener('click', () => {
        $('death-screen').classList.add('hidden');
        if (player) {
            player.hp = player.maxHp;
            player.mp = player.maxMp;
            player.gold = Math.floor(player.gold * 0.9); // 10% gold penalty
        }
        state = 'GAME';
        nextZone(0); // Respawn in town
    });

    $('btn-main-menu-death').addEventListener('click', () => {
        $('death-screen').classList.add('hidden');
        returnToMainMenu();
    });

    // Victory Screen
    $('btn-continue-rift').addEventListener('click', () => {
        $('victory-screen').classList.add('hidden');
        nextZone(6);
    });

    $('btn-victory-menu').addEventListener('click', () => {
        $('victory-screen').classList.add('hidden');
        returnToMainMenu();
    });
});

// ─── SAVE SLOT UI ───
function renderSaveSlots() {
    const container = $('save-slots');
    const slots = SaveSystem.listSlots();
    const btnContinue = $('btn-continue');

    if (slots.length === 0) {
        container.style.display = 'none';
        btnContinue.disabled = true;
        btnContinue.style.opacity = '0.5';
        return;
    }

    container.style.display = 'block';
    btnContinue.style.display = 'none'; // Replace old continue button with slot cards

    container.innerHTML = `<h3 style="color:var(--gold);font-family:'Cinzel',serif;margin-bottom:8px;">Saved Characters</h3>`;
    for (const slot of slots) {
        const card = document.createElement('div');
        card.className = 'save-slot-card';
        const date = new Date(slot.timestamp).toLocaleDateString();
        card.innerHTML = `
            <i class="ra ${getIconForClass(slot.classId)} slot-icon" style="font-size:32px; color:var(--gold); text-shadow: 0 0 8px rgba(255,215,0,0.5);"></i>
            <div class="slot-info">
                <div class="slot-name" style="text-shadow: 0 0 4px rgba(255,255,255,0.3);">${slot.name || slot.className}</div>
                <div class="slot-detail" style="color:#aaa;">Level ${slot.level} ${slot.className} — ${date}</div>
            </div>
            <button class="slot-delete" title="Delete character">✕</button>
        `;

        // Click to load
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('slot-delete')) return;
            const saveData = SaveSystem.loadSlot(slot.id);
            if (saveData) {
                initAudio();
                startGame(slot.id, saveData);
            }
        });

        // Delete button
        card.querySelector('.slot-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete ${slot.name || slot.className} (Level ${slot.level})?`)) {
                SaveSystem.deleteSlot(slot.id);
                renderSaveSlots();
            }
        });

        container.appendChild(card);
    }
}
