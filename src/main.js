/**
 * MAIN.JS — Dark Realm entry point
 * Wires all systems together: menu → game loop → rendering → UI
 */
import { bus } from './engine/EventBus.js';
import { Renderer, Assets } from './engine/renderer.js';
import { Camera } from './engine/Camera.js';
import { Input } from './engine/Input.js';
import { Dungeon } from './world/dungeon.js';
import { Player } from './entities/player.js';
import { Enemy } from './entities/enemy.js';
import { getAllClasses, getClass } from './data/classes.js';
import { loot, SETS } from './systems/lootSystem.js';
import { updateStatuses } from './systems/combat.js';
import { SaveSystem } from './systems/saveSystem.js';
import { DB } from './systems/db.js';
import { NPC } from './entities/npc.js';
import { Mercenary } from './entities/mercenary.js';
import { Pet } from './entities/pet.js';
import { GameObject } from './entities/object.js';
import { ASSET_NAMES } from './data/assets_list.js';
import { initAudio, playLoot, playCastFire, playCastCold, playCastLightning, playCastPoison, playCastShadow, playDeathSfx, playZoneTransition, startAmbientDungeon, startAmbientBoss, stopAmbient } from './engine/audio.js';
import { ITEM_BASES, items } from './data/items.js';
import { fx } from './engine/ParticleSystem.js';
import { RUNEWORDS } from './data/runes.js';

// ─── GLOBALS ───
let renderer, camera, input, dungeon, player;
let enemies = [], npcs = [], gameObjects = [];
let projectiles = [], aoeZones = [];
let droppedItems = [], droppedGold = [];
let floatingTexts = []; // Phase 15: Damage Numbers
let state = 'MENU', selectedClass = null;
let lastTime = 0, lastSaveTime = 0;
let worldTime = 8 * 60; // Start at 08:00 AM
let isNightManual = false; // Internal flag for state checks
let portalReturnZone = 0;
let zoneLevel = 0;
window.currentTheme = 'town';
let isBossZone = false;
let isZoneLocked = false;
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
let activeBounties = []; // Phase 28: { id, desc, target, progress, targetCount, reward }
let completedQuests = new Set();
let killCount = 0;
let totalMonstersSlain = 0;
let totalGoldCollected = 0;
let sessionGold = 0;
let mercenary = null; // { name, hp, maxHp, dmg, icon, x, y }
let lootFilter = 0; // 0=show all, 1=hide normal, 2=hide normal+magic
let showFullMap = false;
let unlockedAchievements = new Set();
let isIdentifying = false; // Global identification state
let isLarzukSocketing = false; // Global socketing service state
let isImbuing = false; // Phase 21: Charsi Imbue state
let activePet = null; // Phase 30: Persistent companion
let isReforging = false; // Phase 22: Charsi Reforge state
let isParagonOpen = false; // Phase 23: Paragon UI state
let activeDialogueNpc = null; // Track NPC with open dialogue bubble
let activeWaypointObj = null; // Track Waypoint object for travel menu

// --- Phase 30: Drag & Drop Global State ---
let dragGhost = null;
let draggedItem = null;
let dragSource = null;
let dragSourceIdx = null;
let minimapZoom = 1.0; // 1.0, 1.5, 2.0
window._corpses = []; // For skills like Corpse Explosion

function syncInteractionStates() {
    document.body.classList.toggle('identifying-mode', !!window.isIdentifying);
    document.body.classList.toggle('socketing-mode', socketingGemIndex !== -1 || isLarzukSocketing);
}

// ─── Phase 12 GLOBALS ───
let timeScale = 1.0;
let uiActiveBoss = null;
let lastBossWarnTime = 0;

// ─── RIFT GLOBALS ───
window.riftProgress = 0; // 0-100
window.riftLevel = 1; // Phase 22: Infinite Rift Depth
window.riftGuardianSpawned = false;
window.activeRiftMods = []; // { id, name, effect }

const RIFT_MODS = [
    { id: 'vampiric', name: 'Vampiric', hp: 1.2, dmg: 1.0, desc: 'Monsters heal on hit' },
    { id: 'glass', name: 'Glass Cannon', hp: 0.6, dmg: 1.8, desc: 'Fragile but Deadly' },
    { id: 'toxic', name: 'Toxic Clout', hp: 1.0, dmg: 1.2, desc: 'Monsters deal poison' },
    { id: 'fortified', name: 'Fortified', hp: 2.0, dmg: 0.9, desc: 'Extreme Health' },
    { id: 'frenzied', name: 'Frenzied', hp: 0.9, dmg: 1.1, speed: 1.4, desc: 'Increased Speed' },
    { id: 'cursed', name: 'Cursed', hp: 1.0, dmg: 1.1, res: -20, desc: 'Player Armor Reduced' }
];

function generateRiftMods() {
    window.activeRiftMods = [];
    const count = 1 + Math.floor((zoneLevel - 7) / 5); // 1 mod at lvl 8, 2 at 13, etc
    const pool = [...RIFT_MODS];
    for (let i = 0; i < Math.min(count, 3); i++) {
        if (pool.length === 0) break;
        const idx = Math.floor(Math.random() * pool.length);
        window.activeRiftMods.push(pool.splice(idx, 1)[0]);
    }
}

function updateRiftHud() {
    const hud = $('rift-hud');
    if (zoneLevel < 7) {
        hud.classList.add('hidden');
        return;
    }
    hud.classList.remove('hidden');
    $('rift-depth-label').textContent = `INFERNAL RIFT LEVEL ${window.riftLevel}`;
    $('rift-gauge-fill').style.width = `${window.riftProgress}%`;

    const modList = $('rift-mods-list');
    modList.innerHTML = '';
    window.activeRiftMods.forEach(mod => {
        const badge = document.createElement('div');
        badge.className = 'chaos-mod-badge';
        badge.textContent = mod.name;
        badge.title = mod.desc;
        modList.appendChild(badge);
    });
}

function spawnRiftGuardian() {
    window.riftGuardianSpawned = true;

    // Choose a random location near player (ensure walkable)
    const angle = Math.random() * Math.PI * 2;
    const dist = 120;
    const tx = player.x + Math.cos(angle) * dist;
    const ty = player.y + Math.sin(angle) * dist;

    // In actual game, we'd check dungeon.isWalkable here

    const bossData = {
        id: 'rift_guardian',
        name: `Guardian of Depth ${zoneLevel - 6}`,
        type: 'boss',
        maxHp: 5000 * Math.pow(1.2, zoneLevel - 6),
        dmg: 60 * Math.pow(1.1, zoneLevel - 6),
        moveSpeed: 100,
        attackSpeed: 1.5,
        attackRange: 40,
        xpReward: 1000 * (zoneLevel - 6),
        color: '#ff00ff',
        size: 35,
        x: tx, y: ty
    };

    const boss = new Enemy(bossData);
    enemies.push(boss);

    bus.on('combat:damage', (data) => {
        const { worldX, worldY, dealt, isCrit, type } = data;
        if (typeof dealt === 'number' || dealt === 'Blocked!') {
            spawnFloatingText(worldX, worldY, dealt, type, isCrit);
        }
    });

    playZoneTransition(); // reuse for sound/flash
    fx.emitHolyBurst(tx, ty);
    fx.emitBurst(tx, ty, '#f0f', 50, 4);
    fx.shake(1000, 15);

    addCombatLog('THE RIFT GUARDIAN HAS ARRIVED!', 'log-crit');
    startAmbientBoss();

    const bossBar = $('boss-hp-bar');
    if (bossBar) {
        bossBar.classList.remove('hidden');
        $('boss-name').textContent = boss.name;
    }
}

function checkRuneword(item) {
    if (!item.socketed || item.socketed.length === 0) return;
    if (item.socketed.length !== item.sockets) return;
    if (item.rarity !== 'normal') return; // Must be white/grey base

    const weaponTypes = ['sword', 'axe', 'mace', 'staff', 'orb', 'bow', 'dagger', 'totem', 'wand'];
    const isWeapon = weaponTypes.includes(item.type);

    for (const rw of RUNEWORDS) {
        // Match structure: rw.runes (Array of ids), rw.allowedTypes (Array of string)
        const validMatch = rw.allowedTypes.includes(item.type) || (rw.allowedTypes.includes('weapon') && isWeapon);
        if (!validMatch) continue;
        if (rw.runes.length !== item.sockets) continue;

        let match = true;
        for (let i = 0; i < rw.runes.length; i++) {
            if (item.socketed[i].baseId !== `rune_${rw.runes[i]}`) {
                match = false;
                break;
            }
        }

        if (match) {
            item.name = `${rw.name} (${item.name})`; // Classic parenthesis
            item.rarity = 'runeword'; 
            if (!item.mods) item.mods = [];
            
            // Map bonuses to mods
            for (const [stat, value] of Object.entries(rw.bonuses)) {
                item.mods.push({ stat, value });
            }
            
            addCombatLog(`Runeword Manifested: ${rw.name}!`, 'log-crit');
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
    6: 'Lut Gholein',
    7: 'Rocky Waste',
    8: 'Dry Hills',
    9: 'Far Oasis',
    10: 'Tal Rasha\'s Chamber',
    11: 'Kurast Docks',
    12: 'Spider Forest',
    13: 'Flayer Jungle',
    14: 'Travincal',
    15: 'Durance of Hate',
    16: 'Pandemonium Fortress',
    17: 'Outer Steppes',
    18: 'Plains of Despair',
    19: 'River of Flame',
    20: 'Chaos Sanctuary',
    21: 'Harrogath',
    22: 'Bloody Foothills',
    23: 'Arreat Summit',
    24: 'Worldstone Keep',
    25: 'Worldstone Chamber',
    26: 'Infinite Rift',
    99: 'Moo Moo Farm',
};

window.DIFFICULTY_NAMES = ['Normal', 'Nightmare', 'Hell', 'Rift Mode'];
window.DIFFICULTY_MULT = [1.0, 2.5, 5.0, 5.0]; // Rift mode uses Hell base stats

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
    
    // Default info to current selected class
    if (selectedClass) {
        showClassInfo(selectedClass);
    }

    for (const cls of getAllClasses()) {
        const card = document.createElement('div');
        card.className = 'class-card';
        card.dataset.classId = cls.id;
        card.innerHTML = `<span class="class-icon"><i class="ra ${getIconForClass(cls.id)}" style="font-size:24px;color:var(--gold);"></i></span><span class="class-card-name">${cls.name}</span>`;
        
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            selectClass(cls.id);
        });
        
        card.addEventListener('mouseenter', () => {
            showClassInfo(cls.id);
        });
        
        grid.appendChild(card);
    }

    // When mouse leaves the entire grid, reset description to selected class
    grid.addEventListener('mouseleave', () => {
        if (selectedClass) {
            showClassInfo(selectedClass);
        }
    });
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
function startGame(slotId = null, loadPlayerData = null, charName = null) {
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

        // Starting Gear for new characters
        if (!loadPlayerData) {
            player = new Player(selectedClass);
            if (charName) player.charName = charName;

            const idTome = { ...items.tome_identify, charges: 20, identified: true };
            const tpTome = { ...items.tome_tp, charges: 20, identified: true };
            player.addToInventory(idTome);
            player.addToInventory(tpTome);

            if ($('hardcore-mode') && $('hardcore-mode').checked) {
                player.isHardcore = true;
            }
        }
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

    // Extract early fields for generation theming
    let curHighestZone = 0;
    if (loadPlayerData && loadPlayerData.highestZone) {
        curHighestZone = loadPlayerData.highestZone;
    }

    // Set initial theme
    function getTheme(z, hz) {
        if (z === 0) {
            if (hz >= 21) return 'snow';
            if (hz >= 16) return 'hell';
            if (hz >= 11) return 'jungle';
            if (hz >= 6) return 'desert';
            return 'town';
        } else {
            if (z >= 21) return 'snow';
            if (z >= 16) return 'hell';
            if (z >= 11) return 'jungle';
            if (z >= 6) return 'desert';
            return 'cathedral';
        }
    }
    window.currentTheme = getTheme(zoneLevel, curHighestZone);

    // Generate dungeon
    dungeon = new Dungeon(80, 60, 16);
    dungeon.generate(zoneLevel, window.currentTheme);

    // Create player
    if (loadPlayerData && loadPlayerData.player) {
        player = Player.deserialize(loadPlayerData.player);
        player.x = dungeon.playerStart.x;
        player.y = dungeon.playerStart.y;
        player.highestZone = loadPlayerData.highestZone || 0;
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
        // Restore mercenary
        if (loadPlayerData.mercenary) {
            mercenary = Mercenary.deserialize(loadPlayerData.mercenary);
        }
    } else {
        player = new Player(selectedClass);
        if (charName) player.charName = charName;
        if ($('hardcore-mode') && $('hardcore-mode').checked) {
            player.isHardcore = true;
        }
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

    window._difficulty = difficulty;

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
    window.player = player;
    window.aoeZones = aoeZones;
    window._difficulty = window._difficulty || 0; // Ensure it exists
    npcs = dungeon.npcSpawns.map(s => new NPC(s.id, s.name, s.type, s.x, s.y, s.icon, s.dialogue, dungeon));
    gameObjects = dungeon.objectSpawns.map(s => new GameObject(s.type, s.x, s.y, s.icon));
    enemies = dungeon.enemySpawns.map(s => new Enemy(s));

    // Apply difficulty & Rift scaling to enemies
    const diffMult = window.DIFFICULTY_MULT[window._difficulty] || 1;
    let riftMult = 1.0;
    if (zoneLevel >= 7) {
        riftMult = Math.pow(1.15, zoneLevel - 6); // 15% more power per depth
    }

    for (const e of enemies) {
        let hpM = diffMult * riftMult;
        let dmgM = diffMult * riftMult;

        // Modifiers
        activeRiftMods.forEach(mod => {
            if (mod.hp) hpM *= mod.hp;
            if (mod.dmg) dmgM *= mod.dmg;
            if (mod.speed) e.moveSpeed *= mod.speed;
        });

        e.maxHp = Math.round(e.maxHp * hpM);
        e.hp = e.maxHp;
        e.dmg = Math.round(e.dmg * dmgM);
        e.xpReward = Math.round(e.xpReward * hpM);
    }

    player.setRefs(dungeon, camera, enemies);
    updateSkillBar();

    droppedItems = [];
    droppedGold = [];
    dialogue = null;

    updateHud();
    updateRiftHud();

    // Ensure boss bar hidden unless zone 5 or rift boss
    const isBossZone = zoneLevel === 5 || zoneLevel === 10 || zoneLevel === 15 || zoneLevel === 20 || (zoneLevel > 21 && zoneLevel % 5 === 0);
    const bossBar = $('boss-hp-bar');
    if (bossBar && !isBossZone) bossBar.classList.add('hidden');

    // Initial save
    SaveSystem.saveSlot(activeSlotId, player, zoneLevel, stash, {
        difficulty: window._difficulty,
        waypoints: [...discoveredWaypoints],
        mercenary: mercenary ? mercenary.serialize() : null,
        cube,
        achievements: Array.from(unlockedAchievements)
    });

    // Initial ambient audio
    if (isBossZone) {
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
    const rawDt = Math.min(0.1, (timestamp - lastTime) / 1000);
    const dt = rawDt * timeScale;
    lastTime = timestamp;

    // TimeScale Recovery (Lerp back to 1.0)
    if (timeScale < 1.0) {
        timeScale = Math.min(1.0, timeScale + rawDt * 0.8);
    }

    // Boss Proximity Logic
    let closestBoss = null;
    let minDist = 400; // Activation range
    for (const e of enemies) {
        if (e.type === 'boss' && e.hp > 0) {
            const d = Math.hypot(e.x - player.x, e.y - player.y);
            if (d < minDist) {
                minDist = d;
                closestBoss = e;
            }
            // Emit aura
            fx.emitBossAura(e.x, e.y, e.color || '#f0f');
        }
    }
    uiActiveBoss = closestBoss;

    // Update
    // --- Phase 29: World Time Tick (1 sec real = 10 game mins) ---
    worldTime = (worldTime + dt * 10) % 1440;
    const hour = worldTime / 60;
    window.isNight = (hour >= 20 || hour < 6);

    if (input) input.update();

    // --- Phase 3.1: Atmospheric Weather System ---
    if (window.fx && player) {
        const theme = window.currentTheme;
        if (theme === 'snow') {
            window.fx.emitBlizzard(renderer.width, renderer.height);
        } else if (theme === 'desert') {
            window.fx.emitSand(renderer.width, renderer.height);
        } else if (theme === 'hell') {
            window.fx.emitEmbers(renderer.width, renderer.height);
        } else if (theme === 'jungle' || theme === 'temple') {
            window.fx.emitRain(renderer.width, renderer.height);
        } else if (theme === 'wilderness') {
            window.fx.emitMist(renderer.width, renderer.height);
        }
    }

    if (player) {
        player.update(dt, input, enemies, dungeon, (aoe) => aoeZones.push(aoe));
        fx.update(dt * 1000); // Particle update expects ms

        // HP Regen out of combat (passive) + gear-based regen (always active)
        if (player.hp > 0 && player.hp < player.maxHp) {
            let hpRegen = (player.lifeRegenPerSec || 0) * dt;

            // Rift Mod: Cursed (Armor/Res reduction)
            const cursedMod = activeRiftMods.find(m => m.id === 'cursed');
            if (cursedMod) {
                // Apply invisible debuff or handle in calcDamage
            }

            if (performance.now() - lastHitTime > 5000) {
                hpRegen += player.maxHp * 0.005 * dt; // Passive OOC regen
            }
            if (hpRegen > 0) player.hp = Math.min(player.maxHp, player.hp + hpRegen);
        }
        // MP Regen (always, slower) + gear-based regen
        if (player.mp < player.maxMp && player.hp > 0) {
            const mpRegen = player.maxMp * 0.003 * dt + (player.manaRegenPerSec || 0) * dt;
            player.mp = Math.min(player.maxMp, player.mp + mpRegen);
        }

        // Moved to centralized Atmospheric Weather System block above
    }
    if (camera) {
        camera.w = renderer.width;
        camera.h = renderer.height;
        camera.update(dt);
    }

    // Update entities — pass dungeon for collision checks
    for (const e of (enemies || [])) e.update(dt, player, dungeon, enemies);
    for (const n of npcs) n.update(dt);
    if (activePet) activePet.update(dt, player, droppedGold);
    if (player) player.updateMinions(dt, enemies, dungeon);

    // Update Projectiles & AoEs
    projectiles.forEach(p => {
        if (p && p.update) p.update(dt, enemies, player, dungeon, (aoe) => { if (aoe) aoeZones.push(aoe); });
    });
    projectiles = projectiles.filter(p => p && p.active);

    aoeZones.forEach(a => {
        if (a && a.update) a.update(dt, enemies, player);
    });
    aoeZones = aoeZones.filter(a => a && a.active);

    // Update Statuses, DoTs, and physics (knockback)
    const statusTargets = [player, ...enemies, ...npcs];
    if (mercenary) statusTargets.push(mercenary);
    updateStatuses(statusTargets, dt);

    // Update Loot Beams (Tick the particle system for persistence)
    for (const drop of droppedItems) {
        if (drop.rarity === 'unique' || drop.rarity === 'set') {
            const color = drop.rarity === 'unique' ? '#bf642f' : '#00ff00';
            if (fx && Math.random() < 0.1) fx.emitLootBeam(drop.x, drop.y, color);
        }
    }

    // Phase 15: Update Floating Text
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y -= 30 * dt; // Float up
        ft.life -= dt;
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }

    if (dialogue) {
        dialogue.timer -= dt;
        if (dialogue.timer <= 0) dialogue = null;
    }

    if (input.click) {
        checkInteractions(input.click);
        input.click = null;
    }

    // Gold Auto-Pickup (radius 45px)
    if (player && droppedGold.length > 0) {
        for (let i = droppedGold.length - 1; i >= 0; i--) {
            const dg = droppedGold[i];
            const dist = Math.sqrt((player.x - dg.x) ** 2 + (player.y - dg.y) ** 2);
            if (dist < 45) {
                player.gold += dg.amount;
                addCombatLog(`Auto-picked ${dg.amount} Gold`, 'log-heal');
                bus.emit('gold:pickup', { amount: dg.amount });
                droppedGold.splice(i, 1);
                updateHud();
                renderInventory();
            }
        }
    }

    // Update Floating Dialogue Position
    const currentMenuFocus = activeDialogueNpc || activeWaypointObj;
    if (currentMenuFocus) {
        const picker = document.getElementById('dialogue-picker');
        if (picker) {
            const screen = camera.toScreen(currentMenuFocus.x, currentMenuFocus.y);
            picker.style.left = `${screen.x - 110}px`;
            picker.style.top = `${screen.y - 180}px`;

            // Auto-close if too far
            const d = Math.sqrt((player.x - currentMenuFocus.x) ** 2 + (player.y - currentMenuFocus.y) ** 2);
            if (d > 120) {
                picker.remove();
                activeDialogueNpc = null;
                activeWaypointObj = null;
            }
        } else {
            activeDialogueNpc = null;
            activeWaypointObj = null;
        }
    }

    // Boss check
    // Boss check
    const boss = enemies.find(e => e.type === 'boss');
    const hpBar = $('boss-hp-bar');
    if (boss && boss.hp > 0 && state === 'GAME') {
        hpBar.classList.remove('hidden');
        const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
        $('boss-hp-fill').style.width = `${pct}%`;
        $('boss-hp-text').textContent = `${Math.ceil(pct)}%`;
        $('boss-name').textContent = boss.name || 'Act Boss';

        // --- Phase 3.1: Boss Phase Triggers ---
        if (pct < 50 && !boss._phase2Triggered) {
            boss._phase2Triggered = true;
            boss.moveSpeed *= 1.4;
            boss.atkSpeed *= 1.3;
            fx.shake(1000, 10);
            fx.emitBurst(boss.x, boss.y, '#ff0000', 40, 4);
            addCombatLog(`${boss.name} enters a FURY!`, 'log-crit');
            // Subtle visual change (flag for renderer)
            boss.isEnraged = true;
        }
    } else {
        if (hpBar) hpBar.classList.add('hidden');
    }

    // Mercenary follow & attack AI
    if (mercenary) {
        if (mercenary.hp > 0) {
            mercenary.update(dt, player, enemies, dungeon);
            mercenary._deadNotified = false;
        } else if (!mercenary._deadNotified) {
            addCombatLog(`Your companion ${mercenary.name} has fallen!`, 'log-dmg');
            playDeathSfx();
            mercenary._deadNotified = true;
            updateHud();
        }
    }

    checkDeaths();

    // Achievement checker (every frame is fine, checks are cheap)
    checkAchievements();

    // Check portal walk-over collisions
    for (const o of gameObjects) {
        if (o.type === 'portal' || o.type === 'uber_portal' || o.type === 'rift_exit') {
            const dist = Math.sqrt((player.x - o.x) ** 2 + (player.y - o.y) ** 2);
            if (dist < 20) {
                if (o.type === 'portal') {
                    const res = o.interact(player);
                    if (res && res.type === 'PORTAL') {
                        addCombatLog('Entering Portal...', 'log-level');
                        nextZone(res.targetZone);
                        break;
                    }
                } else {
                    // Direct targetZone objects
                    addCombatLog('Entering Portal...', 'log-level');
                    nextZone(o.targetZone);
                    break;
                }
            }
        }
    }
    // Update Pets
    if (activePet) {
        activePet.update(dt, player, droppedGold, droppedItems);
    }
    // Secondary cleanup for items picked by pet
    for (let i = droppedGold.length - 1; i >= 0; i--) {
        if (droppedGold[i]._pickedByPet) {
            droppedGold.splice(i, 1);
            updateHud();
        }
    }

    if (player.hp <= 0 && state === 'GAME') {
        checkDeaths(); // Triggers final sequence
        return;
    }

    const distToExit = Math.sqrt((player.x - dungeon.exitPos.x) ** 2 + (player.y - dungeon.exitPos.y) ** 2);
    if (distToExit < 20) {
        if (isZoneLocked) {
            if (player.path) player.path = []; // stop moving
            // Move player back slightly to prevent spam
            player.x -= (dungeon.exitPos.x - player.x) * 0.1;
            player.y -= (dungeon.exitPos.y - player.y) * 0.1;
            bus.emit('combat:log', { text: "The ancient evil blocks your path forward!", type: 'log-dmg' });
        } else {
            nextZone();
        }
    }

    // Render
    renderer.clear();
    dungeon.render(renderer, camera);

    camera.apply(renderer.ctx);

    // Path Breadcrumbs (Phase 31 Mastery)
    if (player.path && player.path.length > 0) {
        renderer.ctx.save();
        renderer.ctx.globalAlpha = 0.4;
        renderer.ctx.fillStyle = '#ffff00';
        for (let i = 0; i < player.path.length; i++) {
            const p = player.path[i];
            const size = 2 - (i / player.path.length); // Tapering trail
            renderer.ctx.beginPath();
            renderer.ctx.arc(p.x, p.y, Math.max(0.5, size), 0, Math.PI * 2);
            renderer.ctx.fill();
        }
        renderer.ctx.restore();
    }

    // Dropped items (with loot filter)
    for (const di of droppedItems) {
        if (lootFilter >= 1 && (!di.rarity || di.rarity === 'normal')) continue;
        if (lootFilter >= 2 && di.rarity === 'magic') continue;

        // Loot Beam & Ground Glow
        if (di.rarity === 'unique' || di.rarity === 'rare' || di.rarity === 'set') {
            const ctx = renderer.ctx;
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const color = di.rarity === 'unique' ? 'rgba(232, 160, 32, 0.6)' : di.rarity === 'set' ? 'rgba(0, 255, 0, 0.5)' : 'rgba(240, 208, 48, 0.5)';

            // Ground Glow
            const radial = ctx.createRadialGradient(di.x, di.y, 2, di.x, di.y, 12);
            radial.addColorStop(0, color);
            radial.addColorStop(1, 'transparent');
            ctx.fillStyle = radial;
            ctx.beginPath(); ctx.arc(di.x, di.y, 12, 0, Math.PI * 2); ctx.fill();

            // Rhythmic Shimmer
            const shimmer = 0.6 + Math.sin(lastTime * 0.005) * 0.3;
            ctx.globalAlpha = shimmer;

            const g = ctx.createLinearGradient(0, di.y, 0, di.y - 120);
            g.addColorStop(0, color);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(di.x - 4, di.y);
            ctx.lineTo(di.x + 4, di.y);
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

    // --- Phase 29: World Time Overlay (Post-Objects) ---
    renderWorldOverlay(renderer.ctx, renderer.width, renderer.height);

    // Old vignette system (Removed to prevent over-darkening in favor of primary Narrative Vision pass)

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

            renderer.drawAnim(`class_${e.classId}`, e.x, e.y - 4, 18, e.animState, e.facingDir, lastTime, null, e.equipment, e.hitFlashTimer);
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

    // --- Phase 3.1: Pulsing Interactive Objects ---
    for (const obj of gameObjects) {
        if (obj.type === 'shrine' || obj.type === 'waypoint' || obj.type === 'altar') {
            const pulse = 0.4 + Math.sin(lastTime * 0.004) * 0.2;
            const color = obj.type === 'shrine' ? 'rgba(0, 255, 255,' : 'rgba(255, 215, 0,';
            renderer.ctx.save();
            renderer.ctx.globalCompositeOperation = 'screen';
            const radial = renderer.ctx.createRadialGradient(obj.x, obj.y, 4, obj.x, obj.y, 25);
            radial.addColorStop(0, `${color} ${pulse})`);
            radial.addColorStop(1, 'transparent');
            renderer.ctx.fillStyle = radial;
            renderer.ctx.beginPath();
            renderer.ctx.arc(obj.x, obj.y, 25, 0, Math.PI * 2);
            renderer.ctx.fill();
            renderer.ctx.restore();
        }
    }
    for (const obj of gameObjects) obj.render(renderer, lastTime);

    projectiles.forEach(p => p.render(renderer, lastTime));
    aoeZones.forEach(a => a.render(renderer, lastTime));

    // Phase 15: Render Floating Combat Text (in World Space)
    for (const ft of floatingTexts) {
        const alpha = Math.min(1.0, ft.life * 2.5);
        const size = ft.isCrit ? 16 : 10;
        const colorWithAlpha = ft.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');

        renderer.ctx.save();
        renderer.ctx.font = `${ft.isCrit ? 'bold ' : ''}${size}px Cinzel, serif`;
        renderer.ctx.fillStyle = `rgba(0,0,0,${alpha * 0.8})`; // Shadow
        renderer.ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
        renderer.ctx.fillStyle = ft.color;
        renderer.ctx.globalAlpha = alpha;
        renderer.ctx.fillText(ft.text, ft.x, ft.y);
        renderer.ctx.restore();
    }

    bus.emit('render:effects', { renderer, lastTime });

    fx.render(renderer.ctx);

    // --- Phase 20: Narrative Vision: Atmospheric Lighting Pass ---
    if (player && renderer && camera) {
        // Use the camera's source of truth for screen positioning
        const screen = camera.toScreen(player.x, player.y - 15);
        const sx = screen.x;
        const sy = screen.y;
        
        // Base radius and flicker (Tightened for a distinct circle effect)
        const baseRadius = (150 + (player.lightRadius || 0));
        const flicker = Math.sin(Date.now() / 150) * 8; 

        let ambient = 'rgba(0, 0, 0, 0.85)'; // Default
        
        if (zoneLevel === 0) {
            // Very subtle ambient in town to let the "player light" still show a bit
            ambient = 'rgba(0, 0, 4, 0.15)'; 
        } else if (zoneLevel <= 3) {
            ambient = 'rgba(8, 12, 18, 0.70)'; // Blood Moor
        } else if (zoneLevel === 4) {
            ambient = 'rgba(10, 20, 10, 0.85)'; // Catacombs
        } else if (zoneLevel >= 5 && zoneLevel <= 25) {
            ambient = 'rgba(20, 4, 4, 0.90)'; // Hell
        } else if (zoneLevel === 100) {
            ambient = 'rgba(60, 0, 0, 0.95)'; // Uber
        }

        renderer.applyLighting(sx, sy, (baseRadius + flicker) * camera.zoom, ambient);
    }

    camera.reset(renderer.ctx);

    if (dialogue) {
        renderer.text(dialogue.text, renderer.width / 2, renderer.height - 120, { size: 16, align: 'center', color: '#ffd700' });
    }

    updateHud();

    // Auto-save every 30 seconds
    if (timestamp - lastSaveTime > 30000 && activeSlotId) {
        lastSaveTime = timestamp;
        SaveSystem.saveSlot(activeSlotId, player, zoneLevel, stash, {
            difficulty: window._difficulty,
            waypoints: [...discoveredWaypoints],
            mercenary: mercenary ? mercenary.serialize() : null,
            cube,
            achievements: Array.from(unlockedAchievements)
        });
        addCombatLog('Progress Saved.', 'log-info');
    }

    renderer.text(`FPS: ${Math.round(1000 / dt)}`, renderer.width - 20, renderer.height - 20, { size: 10, align: 'right', color: '#555' });

    // Premium Ambient Lighting Mask (affecting everything)
    const cx = renderer.width / 2;
    const cy = renderer.height / 2;

    // Dynamic pulsing and gear-based light radius
    const baseRadius = 450 + (player.lightRadius || 0) * 50;
    const pulse = Math.sin(lastTime * 0.002) * 15;
    const radius = Math.max(100, baseRadius + pulse);

    const grd = renderer.ctx.createRadialGradient(cx, cy, 50, cx, cy, radius);

    // In town or boss room, make it slightly brighter overall
    const minAlpha = (zoneLevel === 0) ? 0.6 : (isBossZone ? 0.8 : 0.95);

    grd.addColorStop(0, 'rgba(0, 0, 0, 0)');      // Full visibility at center
    grd.addColorStop(0.3, 'rgba(0, 0, 0, 0)');    // Wider clear area
    grd.addColorStop(0.7, `rgba(0, 0, 0, ${minAlpha * 0.5})`);  // Atmospheric penumbra
    grd.addColorStop(1, `rgba(0, 0, 0, ${minAlpha})`);   // Outer darkness

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

        // Objects (Shrines, Chests, Portals)
        for (const obj of gameObjects) {
            const or = Math.floor(obj.y / ts);
            const oc = Math.floor(obj.x / ts);
            if (explored[or] && explored[or][oc]) {
                renderer.ctx.fillStyle = obj.type === 'portal' ? '#30ccff' : (obj.type === 'shrine' ? '#ffd700' : '#8b4513');
                renderer.ctx.fillRect(ox + obj.x * scale - 1.5, oy + obj.y * scale - 1.5, 3, 3);
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
            if (o.type === 'pantheon_monument') {
                renderDialoguePicker({ id: 'pantheon_monument', name: o.name, x: o.x, y: o.y });
                return;
            }
            const res = o.interact(player);
            if (res && res.type === 'LOOT') {
                // Persist the state in the dungeon spawn data so it doesn't reset
                if (o.id && dungeon.objectSpawns) {
                    const spawn = dungeon.objectSpawns.find(s => s.id === o.id);
                    if (spawn) {
                        spawn.isOpen = true;
                        spawn.icon = 'obj_chest_open';
                    }
                }
                for (let i = 0; i < res.count; i++) {
                    const itm = loot.generate(zoneLevel);
                    droppedItems.push({ ...itm, x: o.x + (Math.random() - 0.5) * 20, y: o.y + (Math.random() - 0.5) * 20 });
                }
                addCombatLog(`You opened a chest!`, 'log-info');
            } else if (res && res.type === 'BREAKABLE') {
                // Drop gold or trash
                const goldAmt = 5 + Math.floor(Math.random() * 15) * (1 + difficulty * 0.5);
                droppedGold.push({ x: o.x, y: o.y, amount: Math.round(goldAmt) });
                if (Math.random() < 0.15) {
                    const itm = loot.generate(zoneLevel, 'normal');
                    droppedItems.push({ ...itm, x: o.x, y: o.y });
                }
                addCombatLog(`You smashed a barrel!`, 'log-info');
                fx.emitBurst(o.x, o.y, '#8b4513', 10, 1.5);
            } else if (res && res.type === 'PORTAL') {
                addCombatLog('Entering Portal...', 'log-level');
                nextZone(res.targetZone);
            } else if (res && res.type === 'WAYPOINT') {
                if (!discoveredWaypoints.has(res.zone)) {
                    discoveredWaypoints.add(res.zone);
                    addCombatLog(`Waypoint Discovered: ${ZONE_NAMES[res.zone] || 'Area'}`, 'log-crit');
                    SaveSystem.saveSlot(activeSlotId, player, zoneLevel, stash, { difficulty, waypoints: Array.from(discoveredWaypoints) });
                    if (fx) fx.emitBurst(o.x, o.y, '#ffd700', 30, 2.5);
                } else {
                    renderWaypointMenu(o);
                }
            } else if (res && res.type === 'SHRINE') {
                const sType = res.shrineType;
                let buffName = '';
                const buffData = { type: '', id: '', value: 0, duration: 60 };

                if (sType === 'experience') {
                    buffName = 'Experience Shrine (+50% XP)';
                    buffData.type = 'exp'; buffData.id = 'shrine_exp'; buffData.value = 50; buffData.duration = 120;
                } else if (sType === 'armor') {
                    buffName = 'Armor Shrine (+100% Defense)';
                    buffData.type = 'armor'; buffData.id = 'shrine_armor'; buffData.value = 100;
                } else if (sType === 'combat') {
                    buffName = 'Combat Shrine (+50% Damage)';
                    buffData.type = 'damage'; buffData.id = 'shrine_damage'; buffData.value = 50;
                } else if (sType === 'mana') {
                    buffName = 'Mana Shrine (+500% Mana Regen)';
                    buffData.type = 'mana'; buffData.id = 'shrine_mana'; buffData.value = 500;
                    player.mp = player.maxMp;
                    if (mercenary) mercenary.mp = mercenary.maxMp;
                } else if (sType === 'resist') {
                    buffName = 'Resist Shrine (+75 All Resists)';
                    buffData.type = 'resist'; buffData.id = 'shrine_resist'; buffData.value = 75;
                } else if (sType === 'speed') {
                    buffName = 'Stamina Shrine (+30% Move Speed)';
                    buffData.type = 'speed'; buffData.id = 'shrine_speed'; buffData.value = 30;
                }

                player._buffs.push({ ...buffData });
                player._recalcStats();
                if (mercenary && mercenary.hp > 0) {
                    mercenary._buffs.push({ ...buffData });
                    mercenary._recalcStats();
                }

                addCombatLog(`Touched ${buffName}`, 'log-heal');
                fx.emitBurst(o.x, o.y, '#4080ff', 30, 2);
            } else if (res && res.type === 'HELLFORGE') {
                const hasStone = player.inventory.some(it => it && it.baseId === 'mephisto_soulstone');
                const hasHammer = player.inventory.some(it => it && it.baseId === 'hellforge_hammer');

                if (hasStone && hasHammer) {
                    o.isOpen = true;
                    o.icon = 'obj_altar_on';
                    const idx1 = player.inventory.findIndex(it => it && it.baseId === 'mephisto_soulstone');
                    player.inventory[idx1] = null;
                    const idx2 = player.inventory.findIndex(it => it && it.baseId === 'hellforge_hammer');
                    player.inventory[idx2] = null;

                    const count = 1 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < count; i++) {
                        const shard = loot.generate(zoneLevel, 'rare');
                        shard.name = "Horadric Shard";
                        shard.icon = 'item_shard';
                        shard.isShard = true;
                        droppedItems.push({ ...shard, x: o.x + (Math.random()-0.5)*20, y: o.y + (Math.random()-0.5)*20 });
                    }
                    addCombatLog("The Soulstone is destroyed! The Forge erupts with power!", 'log-unique');
                    updateHud();
                } else {
                    addCombatLog("The Hellforge requires Mephisto's Soulstone and the Hellforge Hammer.", 'log-info');
                }
            } else if (res && res.type === 'ALTIAR_OF_HEAVENS') {
                if (window._ancientsKilled >= 3) {
                    o.isOpen = true;
                    o.icon = 'obj_altar_on';
                    player.grantExp(player.xpToNext - player.xp); // Instant level up
                    player.statPoints += 5;
                    addCombatLog("You have passed the Rite of Passage! (+1 Level, +5 Stats)", 'log-unique');
                    updateHud();
                } else {
                    addCombatLog("The Ancients must be defeated first.", 'log-info');
                }
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
                // Quest Item logic
                if (di.isQuestItem) {
                    const qId = di.qId;
                    const quest = activeQuests.find(q => q.id === qId);
                    if (quest) {
                        quest.progress = Math.min(quest.target, quest.progress + 1);
                        addCombatLog(`Recovered ${di.name}!`, 'log-crit');
                        if (quest.progress === quest.target) {
                            addCombatLog(`Quest Objective Complete: ${quest.name}`, 'log-unique');
                        }
                        updateHud();
                        // Proceed to inventory check (don't return yet)
                    }
                }

                if (player.addToInventory(di)) {
                    addCombatLog(`Picked up ${di.name}`, 'log-item');
                    bus.emit('item:pickup', { item: di });
                    droppedItems.splice(i, 1);
                    playLoot();
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
                totalGoldCollected += dg.amount;
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

            // Bosses guarantee a loot explosion (Multi-drop)
            if (e.type === 'boss') {
                const dropCount = 4 + Math.floor(Math.random() * 3); // 4-6 items
                for (let i = 0; i < dropCount; i++) {
                    const r = Math.random();
                    const rarity = r < 0.05 ? 'unique' : (r < 0.15 ? 'set' : (r < 0.4 ? 'rare' : 'magic'));
                    const bossItem = loot.generate(zoneLevel, rarity);
                    bossItem.x = e.x + (Math.random() - 0.5) * 40;
                    bossItem.y = e.y + (Math.random() - 0.5) * 40;
                    droppedItems.push(bossItem);

                    const beamColors = { rare: '#ffff00', unique: '#ff8000', set: '#00ff00', magic: '#8080ff' };
                    if (beamColors[bossItem.rarity]) fx.emitBurst(bossItem.x, bossItem.y - 10, beamColors[bossItem.rarity], 8, 1);
                }

                // CEREMONIAL VICTORY
                const banner = $('boss-victory-announcement');
                if (banner) {
                    $('vic-boss-name').textContent = e.name || 'Act Boss';
                    banner.classList.remove('hidden');
                    setTimeout(() => banner.classList.add('hidden'), 4000);
                }
                fx.shake(2000, 15); // Powerful shake
                timeScale = 0.05; // Dramatic Slow-Mo Finish
                addCombatLog('DEATH BLOW!', 'log-crit');
            }

            // Mana/Life after kill
            if (player.manaAfterKill) {
                player.mp = Math.min(player.maxMp, player.mp + player.manaAfterKill);
                if (fx) fx.emitManaSteal(player.x, player.y);
            }
            if (player.lifeAfterKill) {
                player.hp = Math.min(player.maxHp, player.hp + player.lifeAfterKill);
                if (fx) fx.emitHeal(player.x, player.y);
            }

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

            // --- Phase 29: Quest Item Drops ---
            if (e.isRadament) {
                droppedItems.push({ ...ITEM_BASES.book_of_skill, id: 'book_of_skill', rarity: 'unique', x: e.x, y: e.y, isQuestItem: true, qId: 'radament' });
            } else if (e.isBeetleburst) {
                droppedItems.push({ ...ITEM_BASES.staff_of_kings, id: 'staff_of_kings', rarity: 'unique', x: e.x, y: e.y, isQuestItem: true, qId: 'horadric_staff' });
            } else if (e.isColdworm) {
                droppedItems.push({ ...ITEM_BASES.viper_amulet, id: 'viper_amulet', rarity: 'unique', x: e.x, y: e.y, isQuestItem: true, qId: 'horadric_staff' });
            } else if (e.isSarina) {
                droppedItems.push({ id: 'khalim_heart', name: "Khalim's Heart", rarity: 'unique', icon: 'item_charm_small', x: e.x, y: e.y, isQuestItem: true, qId: 'khalims_will' });
            } else if (e.isCouncil) {
                droppedItems.push({ id: 'khalim_brain', name: "Khalim's Brain", rarity: 'unique', icon: 'item_charm_large', x: e.x, y: e.y, isQuestItem: true, qId: 'khalims_will' });
            } else if (e.isShenk) {
                addCombatLog("Shenk the Overseer: 'BAAL SHALL... REWARD... ME...'", 'log-dmg');
            } else if (e.isHephaisto) {
                // Drop Hellforge Hammer
                const hammer = loot.generate(zoneLevel, 'unique');
                hammer.baseId = 'hellforge_hammer';
                hammer.name = "Hellforge Hammer";
                hammer.icon = 'item_war_hammer_hd';
                hammer.identified = true;
                hammer.x = e.x; hammer.y = e.y;
                droppedItems.push(hammer);
                addCombatLog("Hephaisto slayed! The Hellforge Hammer is ours.", 'log-crit');
            } else if (e.name === 'Mephisto' || e.isMephisto) {
                // Drop Mephisto's Soulstone
                const stone = loot.generate(zoneLevel, 'unique');
                stone.baseId = 'mephisto_soulstone';
                stone.name = "Mephisto's Soulstone";
                stone.icon = 'item_mephisto_soulstone';
                stone.identified = true;
                stone.x = e.x + 10; stone.y = e.y + 10;
                droppedItems.push(stone);
                addCombatLog("Mephisto's Soulstone has been recovered!", 'log-crit');
            }

            // --- Phase 29: Horadric Fragment Drops ---
            const fragChance = 0.10 + (player.magicFind || 0) / 1000;
            const fragRoll = Math.random();
            if (fragRoll < fragChance) {
                const fragment = {
                    id: 'horadric_fragment',
                    name: 'Horadric Fragment',
                    rarity: 'magic',
                    icon: 'item_horadric_fragment',
                    x: e.x + (Math.random() - 0.5) * 30,
                    y: e.y + (Math.random() - 0.5) * 30
                };
                droppedItems.push(fragment);
                if (fx) fx.emitBurst(fragment.x, fragment.y, '#00ffff', 10, 1);
            }

            const goldAmt = loot.rollGold(e, player.goldFind || 0);
            addCombatLog(`${e.name} slain! +${e.xpReward} XP`, (item || fragRoll < fragChance) ? 'log-item' : 'log-level');

            // Kill counter
            killCount++;
            if (player) player.totalMonstersSlain++;

            // Phase 28: Bounty Progress
            checkBountyProgress(e);

            // Rift Progress
            if (zoneLevel >= 7 && riftProgress < 100) {
                const inc = e.type === 'boss' ? 15 : (e.type === 'elite' ? 6 : 2);
                riftProgress = Math.min(100, riftProgress + inc);
                updateRiftHud();

                if (riftProgress >= 100 && !riftGuardianSpawned) {
                    spawnRiftGuardian();
                }
            }

            // Ancients Tracking
            if (e.isAncient) {
                window._ancientsKilled = (window._ancientsKilled || 0) + 1;
                addCombatLog(`${e.name} has been defeated! (${window._ancientsKilled}/3)`, 'log-info');
                if (window._ancientsKilled >= 3) {
                    const q = activeQuests.find(aq => aq.id === 'rite_of_passage');
                    if (q) {
                        q.progress = q.target;
                        addCombatLog("The Ancients have acknowledged your strength!", 'log-unique');
                        updateHud();
                    }
                }
            }

            // Quest tracking
            for (const q of activeQuests) {
                if (q.progress < q.target) {
                    if ((q.bossOnly && e.type === 'boss') || !q.bossOnly) {
                        q.progress++;
                        if (q.progress === q.target) {
                            const giverName = q.giver ? q.giver.charAt(0).toUpperCase() + q.giver.slice(1).replace('_', ' ') : 'the town';
                            addCombatLog(`Quest Objective Complete! Return to ${giverName}.`, 'log-crit');
                            updateHud();
                        }
                    }
                }
            }

            // Soul Liberation & Iconic Death Quotes
            if (e.type === 'boss') {
                if (e.name === 'Izual') {
                    addCombatLog("Izual: 'Thank you... the light... it's so bright at last.'", 'log-level');
                    dialogue = { text: "Izual's tormented soul is finally released from the shadows. Return to Tyrael.", timer: 5, npc: { name: 'Soul' } };
                } else if (e.name === 'Diablo') {
                    addCombatLog("Diablo: 'NOT... POSSIBLE...'", 'log-dmg');
                } else if (e.name === 'Baal') {
                    addCombatLog("Baal: 'MY BROTHERS... SHALL... AVENGE... ME...'", 'log-dmg');
                } else if (e.name === 'Frozenstein') {
                    addCombatLog("Frozenstein shattered! The way to Anya is clear.", 'log-level');
                }
            }

            if (e.type === 'boss' && isBossZone) {
                // Progression Unlock!
                isZoneLocked = false;
                fx.shake(800, 15);
                player.highestZone = Math.max(player.highestZone || 0, zoneLevel);
                if (!player.maxDifficulty) player.maxDifficulty = 0;
                
                let unlockedDiff = false;
                // Transition difficulty after Baal (Zone 25)
                if (difficulty === player.maxDifficulty && player.maxDifficulty < 3 && zoneLevel === 25) {
                    player.maxDifficulty++;
                    unlockedDiff = true;
                }

                // Dynamic Boss Victory Messaging
                const bossMessages = {
                    5: 'Andariel, the Maiden of Anguish, has been defeated.',
                    10: 'Duriel, the Lord of Pain, is no more.',
                    15: 'Mephisto, the Lord of Hatred, has been banished.',
                    20: 'Diablo, the Lord of Terror, has fallen!',
                    25: 'Baal, the Lord of Destruction, is slain! The Worldstone is safe.'
                };
                const bossMsg = bossMessages[zoneLevel] || (zoneLevel > 25 ? `Rift Guardian defeated at Depth ${zoneLevel - 7}.` : 'The Guardian has been slain.');

                setTimeout(() => {
                    $('victory-screen').classList.remove('hidden');
                    $('victory-stats').innerHTML = `Level ${player.level} ${player.className} — ${bossMsg}<br>` +
                        `<div style="font-size:12px;color:#888;margin-top:10px;">Total Slain: ${totalMonstersSlain} | Gold Collected: ${totalGoldCollected}</div>`;
                }, 1500);

                const tp = new GameObject('portal', e.x, e.y - 40, 'env_water');
                // Act Transitions: 5->6 (Act 2 Town), 10->11 (Act 3), 15->16 (Act 4), 20->21 (Act 5), 25->0 (Back to Town)
                const actTransitions = { 5: 6, 10: 11, 15: 16, 20: 21, 25: 0 };
                tp.targetZone = actTransitions[zoneLevel] || zoneLevel + 1;
                gameObjects.push(tp);

                if (actTransitions[zoneLevel] !== undefined) {
                    discoveredWaypoints.add(actTransitions[zoneLevel]);
                    addCombatLog(`Victory! The path to the next Act is open.`, 'log-crit');
                } else {
                    addCombatLog(`The Realm Portal has opened!`, 'log-crit');
                }

                if (unlockedDiff) {
                    let diffName = '';
                    if (player.maxDifficulty === 1) diffName = 'Nightmare';
                    else if (player.maxDifficulty === 2) diffName = 'Hell';
                    else if (player.maxDifficulty === 3) diffName = 'Rift Mode';
                    
                    if (diffName) {
                        addCombatLog(`⭐ ${diffName} Unlocked! ⭐`, 'log-crit');
                    }
                }
                
                // Phase 33: Always save after boss kill
                SaveSystem.saveSlot(activeSlotId, player, zoneLevel, stash, { 
                    difficulty, 
                    waypoints: Array.from(discoveredWaypoints), 
                    mercenary: mercenary ? mercenary.serialize() : null 
                });
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
        if (g._pickedByPet) return false; // Pet already handled it
        const dx = g.x - player.x, dy = g.y - player.y;
        if (dx * dx + dy * dy < 600) {
            player.gold += g.amount;
            player.totalGoldCollected += g.amount;
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

        let deathMsg = `You fell in ${zName} at Level ${player.level}.<br>`;
        deathMsg += `<div style="font-size:12px;color:#888;margin-top:10px;">Total Slain: ${player.totalMonstersSlain} | Gold Collected: ${player.totalGoldCollected}</div>`;

        if (player.isHardcore) {
            $('death-stats').innerHTML = `Your Hardcore hero fell in ${zName} at Level ${player.level}. Your deeds of valor will be remembered.<br>` +
                `<div style="font-size:12px;color:#888;margin-top:10px;">Total Slain: ${player.totalMonstersSlain} | Gold Collected: ${player.totalGoldCollected}</div>`;
            $('btn-respawn').style.display = 'none'; // No respawn for hardcore

            SaveSystem.saveToPantheon(player);

            if (activeSlotId) SaveSystem.deleteSlot(activeSlotId);
            addCombatLog('HARDCORE DEATH. Save file deleted.', 'log-dmg');
        } else {
            $('death-stats').innerHTML = deathMsg;
            $('btn-respawn').style.display = 'inline-block';
        }
    }
}

function spawnFloatingText(x, y, text, type = 'physical', isCrit = false) {
    const colors = {
        physical: '#ffffff',
        fire: '#ff9000',
        cold: '#00ccff',
        lightning: '#ffff00',
        poison: '#00ff00',
        magic: '#ff00ff',
        shadow: '#a040ff',
        holy: '#ffd700',
        blocked: '#888888'
    };

    floatingTexts.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y - 20,
        text,
        color: type === 'Blocked!' ? colors.blocked : (colors[type] || '#ffffff'),
        isCrit,
        life: isCrit ? 1.6 : 1.2
    });
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
            if (zoneLevel > 7 && riftGuardianSpawned) {
                // We defeated the guardian and took the portal forward
                riftLevel++;
            }
        }

        // Setup Rift state
        if (zoneLevel >= 26) {
            riftProgress = 0;
            riftGuardianSpawned = false;
            generateRiftMods();
        }

        window.currentTheme = 'cathedral';
        if (zoneLevel === 0) window.currentTheme = 'town';
        else if (zoneLevel <= 2) window.currentTheme = 'wilderness';
        else if (zoneLevel <= 10) window.currentTheme = (zoneLevel >= 6) ? 'desert' : 'cathedral';
        else if (zoneLevel <= 13) window.currentTheme = 'jungle';
        else if (zoneLevel <= 15) window.currentTheme = 'temple';
        else if (zoneLevel <= 20) window.currentTheme = 'hell';
        else if (zoneLevel <= 25) window.currentTheme = 'snow';
        else if (zoneLevel === 100) window.currentTheme = 'hell'; // Uber Tristram
        else {
            // Infinite Rifts: Random theme
            const themes = ['cathedral', 'desert', 'tomb', 'jungle', 'temple', 'hell', 'snow'];
            window.currentTheme = themes[Math.floor(Math.random() * themes.length)];
        }

        dungeon = new Dungeon(80, 60, 16);
        dungeon.generate(zoneLevel, window.currentTheme);

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

        // --- Phase 3 Wave 6: Wirt's Leg Drop (Zone 3 - Dark Wood) ---
        if (zoneLevel === 3) {
            const corpse = new GameObject('wirts_corpse', player.x - 100, player.y + 100, 'env_grave');
            corpse.interactable = true;
            corpse.onInteract = () => {
                if (!player.inventory.some(it => it && it.baseId === 'wirts_leg')) {
                    const leg = loot.generateFixedUnique('wirts_leg'); // Assuming fixed unique logic or similar
                    if (loot.addItemToInventory(player, leg)) {
                        addCombatLog("You found Wirt's Leg!", 'log-unique');
                        corpse.interactable = false;
                        corpse.icon = 'env_grave_open'; // Visual change
                    }
                } else {
                    addCombatLog("You already have Wirt's Leg.", 'log-info');
                }
            };
            gameObjects.push(corpse);
        }

        // --- Phase 30: Pantheon Monument ---
        const monument = new GameObject('pantheon_monument', 550, 350, 'ra-pillar');
        monument.name = "Monument of Valor";
        monument.description = "A monolith inscribed with the names of fallen legends.";
        gameObjects.push(monument);

        // --- Phase 30: Pet Initialization ---
        if (!activePet) {
            activePet = new Pet({ name: "Wolf Cub", type: "wolf", x: player.x, y: player.y });
        }
    } else {
        npcs = [];
        gameObjects = dungeon.objectSpawns ? dungeon.objectSpawns.map(s => {
            const obj = new GameObject(s.type, s.x, s.y, s.icon, s.id);
            obj.isOpen = s.isOpen || false;
            if (s.type === 'shrine') obj.shrineType = s.shrineType;
            if (s.type === 'waypoint') obj.zone = s.zone;
            return obj;
        }) : [];
        enemies = dungeon.enemySpawns.map(s => new Enemy(s));
        // Apply difficulty scaling
        if (difficulty > 0) {
            const mult = window.DIFFICULTY_MULT[window._difficulty];
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
    aoeZones = []; // Clear old AoEs
    dialogue = null;

    const zoneName = ZONE_NAMES[zoneLevel] || `Rift Level ${zoneLevel - 7}`;
    const diffLabel = (difficulty > 0 && difficulty < 3) ? ` (${DIFFICULTY_NAMES[difficulty]})` : (difficulty === 3 ? ' (Rift Mode)' : '');

    // Check if boss zone
    isBossZone = (zoneLevel === 5 || zoneLevel === 10 || zoneLevel === 15 || zoneLevel === 20 || zoneLevel === 25 || (zoneLevel > 26 && zoneLevel % 5 === 0));
    isZoneLocked = isBossZone;

    // Endgame: zones beyond 7 scale infinitely
    const endgameMult = zoneLevel > 7 ? 1 + (zoneLevel - 7) * 0.3 : 1;
    $('zone-name').textContent = zoneName + diffLabel;
    addCombatLog(`Entered ${zoneName}${diffLabel}!`, 'log-level');
    if (activeSlotId) SaveSystem.saveSlot(activeSlotId, player, zoneLevel, stash, {
        difficulty: window._difficulty,
        waypoints: [...discoveredWaypoints],
        mercenary: mercenary ? mercenary.serialize() : null,
        cube,
        achievements: Array.from(unlockedAchievements),
        highestZone: player.highestZone || 0
    });

    // Apply thematic changes
    function getTheme(z) {
        let referenceZone = z;
        if (z === 0 && player && player.highestZone) {
            referenceZone = player.highestZone;
        }

        if (referenceZone >= 21) return 'snow';
        if (referenceZone >= 16) return 'hell';
        if (referenceZone >= 11) return 'jungle';
        if (referenceZone >= 6) return 'desert';
        return 'cathedral';
    }
    window.currentTheme = getTheme(zoneLevel);

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
    // Town zones automatically discover their waypoint if it exists
    if ([0, 6, 11, 16, 21].includes(zoneLevel)) {
        discoveredWaypoints.add(zoneLevel);
    }

    // Difficulty advancement: clearing Zone 5 advances difficulty (Legacy logic, handled by Baal now)
    // if (zoneLevel > 5 && difficulty < 2) { ... }

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
function updateQuestHud() {
    const qhud = $('quest-hud');
    if (!qhud) return;

    if (!player) {
        qhud.classList.add('hidden');
        return;
    }

    qhud.classList.remove('hidden');
    const qdesc = $('quest-desc');
    const qprog = $('quest-progress');

    let questName = "";
    let questTarget = "";
    let color = '#ffd700';

    const hz = player.highestZone || 0;
    if (hz < 5) {
        questName = "Act I: Blood and Ash";
        questTarget = "Defeat Andariel (Zone 5)";
    } else if (hz < 10) {
        questName = "Act II: The Desert Wastes";
        questTarget = "Defeat Duriel (Zone 10)";
    } else if (hz < 15) {
        questName = "Act III: The Corrupted Jungle";
        questTarget = "Defeat Mephisto (Zone 15)";
    } else if (hz < 20) {
        questName = "Act IV: The Gates of Hell";
        questTarget = "Defeat Diablo (Zone 20)";
    } else if (hz < 25) {
        questName = "Act V: The Frozen Peak";
        questTarget = "Defeat Baal (Zone 25)";
    } else {
        questName = "Epilogue: Infinite Rifts";
        questTarget = `Delve deeper... (Max: ${hz})`;
        color = '#00ff00';
    }

    if (qdesc) qdesc.textContent = questName;
    if (qprog) {
        qprog.textContent = questTarget;
        qprog.style.color = color;
    }
}

function showDialogue(npc) {
    const box = $('dialog-box');
    if (!box) return;

    const nameEl = $('npc-active-name');
    const textEl = $('dialog-text');
    const optsEl = $('dialog-options');

    if (nameEl) nameEl.textContent = npc.name;
    if (textEl) textEl.textContent = npc.greeting || "Greetings, traveler.";

    if (optsEl) {
        optsEl.innerHTML = '';
        const options = npc.getDialogueOptions ? npc.getDialogueOptions() : [{ label: 'Goodbye', action: () => box.classList.add('hidden') }];

        options.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = 'dialog-opt';
            btn.textContent = opt.label;
            btn.addEventListener('click', () => {
                opt.action();
                if (opt.closesDialogue !== false) box.classList.add('hidden');
            });
            optsEl.appendChild(btn);
        });
    }

    box.classList.remove('hidden');
}

function updateHud() {
    if (!player) return;
    updateWorldClockUI();

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

    // --- Phase 3 Wave 6: Mercenary HUD Update ---
    const mercHud = $('mercenary-hud');
    if (mercHud) {
        if (mercenary) {
            mercHud.classList.remove('hidden');
            const hpFill = $('merc-hud-hp-fill');
            const hpPct = (mercenary.hp / mercenary.maxHp) * 100;
            if (hpFill) hpFill.style.width = Math.max(0, hpPct) + '%';
            
            const lvlText = $('merc-hud-lvl');
            if (lvlText) lvlText.textContent = `Level ${mercenary.level}`;
            
            const portrait = $('merc-hud-portrait');
            if (portrait) {
                if (mercenary.hp <= 0) portrait.classList.add('merc-dead-portrait');
                else portrait.classList.remove('merc-dead-portrait');
            }
        } else {
            mercHud.classList.add('hidden');
        }
    }

    // PROXIMITY BOSS HUD
    const bossBar = $('boss-hp-bar');
    if (bossBar) {
        if (uiActiveBoss && uiActiveBoss.hp > 0) {
            const dist = Math.hypot(uiActiveBoss.x - player.x, uiActiveBoss.y - player.y);
            if (dist < 500) {
                bossBar.classList.remove('hidden');
                $('boss-name').textContent = uiActiveBoss.name;
                const bPct = (uiActiveBoss.hp / uiActiveBoss.maxHp) * 100;
                $('boss-hp-fill').style.width = bPct + '%';

                if (performance.now() - lastBossWarnTime > 60000) {
                    fx.shake(500, 5);
                    addCombatLog(`⚠ TARGET DETECTED: ${uiActiveBoss.name}`, 'log-warn');
                    lastBossWarnTime = performance.now();
                }
            } else {
                bossBar.classList.add('hidden');
            }
        } else {
            bossBar.classList.add('hidden');
        }
    }

    // Atmospheric Filter
    const canvas = $('game-canvas');
    if (canvas) {
        let filter = 'none';
        if (zoneLevel === 0) filter = 'sepia(0.2) saturate(1.2)';
        else if (zoneLevel === 5 || (zoneLevel > 7 && zoneLevel % 5 === 0)) filter = 'saturate(1.5) contrast(1.1) hue-rotate(-10deg)';
        else if (typeof theme !== 'undefined' && theme === 'catacombs') filter = 'brightness(0.8) saturate(0.8) hue-rotate(20deg)';
        else if (typeof theme !== 'undefined' && theme === 'wilderness') filter = 'saturate(1.1) contrast(1.05)';
        canvas.style.filter = filter;
    }
    // Zone Label
    const zoneNameDisplay = $('zone-name');
    if (zoneNameDisplay) zoneNameDisplay.textContent = ZONE_NAMES[zoneLevel] || `Level ${zoneLevel}`;

    // Loot Filter HUD
    const lfh = $('hud-loot-filter');
    if (lfh) {
        const labels = ['FILTER: ALL', 'FILTER: HIDE NORMAL', 'FILTER: HIDE MAGIC'];
        lfh.textContent = labels[lootFilter || 0];
        lfh.style.color = (lootFilter === 0) ? '#aaa' : (lootFilter === 1) ? '#fff' : '#0cf';
    }

    // Potion Belt
    for (let i = 0; i < 4; i++) {
        const slotEl = $(`pi-${i}`);
        if (!slotEl) continue;
        const potion = player.belt[i];
        if (potion) {
            slotEl.style.backgroundImage = `url('assets/${potion.icon}.png')`;
            slotEl.title = potion.name;
        } else {
            slotEl.style.backgroundImage = 'none';
            slotEl.title = '';
        }
    }

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

    // Phase 31: Advanced Status UI
    const bb = $('buff-bar');
    if (bb) {
        bb.innerHTML = '';

        const createStatusIcon = (id, iconChar, color, titleText) => {
            const el = document.createElement('div');
            el.className = 'status-icon';
            el.style.cssText = `width:28px;height:28px;border:1px solid ${color};background:rgba(0,0,0,0.6);border-radius:4px;display:flex;justify-content:center;align-items:center;font-size:14px;color:${color};position:relative;cursor:help;pointer-events:auto;box-shadow:inset 0 0 5px ${color};`;
            el.textContent = iconChar;
            el.title = titleText;
            bb.appendChild(el);
        };

        // Active Aura
        if (player.activeAura) {
            createStatusIcon(player.activeAura, '🔆', '#ffd700', `Aura: ${player.activeAura.replace('_', ' ').toUpperCase()}`);
        }

        // Shrine / Skill Buffs
        for (const b of (player._buffs || [])) {
            let icon = '🛡️'; let color = '#00ff00';
            const bid = b.id || b.type || '';
            if (bid.includes('speed')) { icon = '💨'; color = '#00ccff'; }
            else if (bid.includes('damage') || bid.includes('berserk')) { icon = '⚔️'; color = '#ff3300'; }
            else if (bid.includes('mana')) { icon = '💧'; color = '#3366ff'; }
            else if (bid.includes('resist')) { icon = '🔮'; color = '#ff00ff'; }
            else if (bid.includes('exp')) { icon = '✨'; color = '#ffffcc'; }

            createStatusIcon(bid, icon, color, `${bid.replace('shrine_', '').toUpperCase()}: ${Math.ceil(b.duration || 0)}s`);
        }

        // Debuffs (Slows, DoTs, Curses)
        if (player._auraSlowTimer > 0) {
            createStatusIcon('slow', '❄️', '#88ccff', `SLOWED: ${Math.ceil(player._auraSlowTimer)}s`);
        }

        for (const d of (player._dots || [])) {
            let icon = '🔥'; let color = '#ff0000';
            if (d.type === 'poison') { icon = '☠️'; color = '#00ff00'; }
            createStatusIcon(d.type, icon, color, `${d.type.toUpperCase()} DoT: ${Math.ceil(d.duration)}s`);
        }
    }

    // Check for broken gear
    let hasBroken = false;
    if (player.equipment) {
        for (const item of Object.values(player.equipment)) {
            if (item && item.maxDurability > 0 && item.durability === 0) {
                hasBroken = true;
                break;
            }
        }
    }
    const brokenWarn = $('broken-gear-warning');
    if (brokenWarn) brokenWarn.classList.toggle('hidden', !hasBroken);

    // Level Up Awareness
    const charBtn = $('btn-character');
    if (charBtn) charBtn.classList.toggle('has-points', player.statPoints > 0);

    // Quest Tracker
    updateQuestHud();

    // Loot Filter awareness
    const filterBtn = $('btn-lootfilter');
    if (filterBtn) {
        const filterNames = ['ALL', 'HIDE_NORMAL', 'HIDE_MAGIC'];
        filterBtn.title = `Loot Filter: ${filterNames[lootFilter || 0]} (F)`;
        filterBtn.style.color = (lootFilter > 0) ? '#00ccff' : '#aaa';
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
        if (typeof mercenary !== 'undefined' && mercenary) {
            mh.classList.remove('hidden');
            $('merc-hud-name').textContent = mercenary.name;
            const mPct = Math.max(0, Math.min(100, (mercenary.hp / mercenary.maxHp) * 100));
            $('merc-hud-hp-fill').style.width = mPct + '%';

            if (mercenary.hp <= 0) {
                mh.classList.add('merc-dead-portrait');
                $('merc-hud-hp-fill').style.backgroundColor = '#600';
                $('merc-hud-name').style.color = '#f00';
                $('merc-hud-name').textContent = `${mercenary.name} (DEAD)`;

                if (!$('btn-revive-merc')) {
                    const btn = document.createElement('button');
                    btn.id = 'btn-revive-merc';
                    btn.className = 'merc-dead-btn';
                    btn.textContent = 'REVIVE (200g)';
                    btn.onclick = () => { hireMercenary(); updateHud(); };
                    mh.appendChild(btn);
                }
            } else {
                mh.classList.remove('merc-dead-portrait');
                $('merc-hud-hp-fill').style.backgroundColor = '#4caf50';
                $('merc-hud-name').style.color = '#fff';
                const existingBtn = $('btn-revive-merc');
                if (existingBtn) existingBtn.remove();
            }
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
                const giverName = activeQuests[0].giver.charAt(0).toUpperCase() + activeQuests[0].giver.slice(1).replace('_', ' ');
                $('quest-progress').textContent = `Return to ${giverName}`;
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
        'warrior': 'ra-crossed-swords',
        'arms': 'ra-sword',
        'bash': 'ra-muscle-up',
        'double_swing': 'ra-dervish-swords',
        'rend': 'ra-dripping-sword',
        'whirlwind': 'ra-spinning-sword',
        'combat_mastery': 'ra-crossed-axes',
        'berserk': 'ra-player-pyromaniac',
        'cleave': 'ra-axe-swing',
        'execute': 'ra-decapitation',
        'defense': 'ra-heavy-shield',
        'shield_bash': 'ra-bolt-shield',
        'iron_skin': 'ra-knight-helmet',
        'block_mastery': 'ra-round-shield',
        'revenge': 'ra-player-dodge',
        'taunt': 'ra-horn-call',
        'fortify': 'ra-guarded-tower',
        'life_tap': 'ra-crowned-heart',
        'last_stand': 'ra-blast',
        'battle': 'ra-castle-flag',
        'warcry': 'ra-horn-call',
        'shout': 'ra-speech-bubble',
        'leap_attack': 'ra-boot-stomp',
        'battle_orders': 'ra-hand-emblem',
        'commanding_shout': 'ra-speech-bubbles',
        'slam': 'ra-groundbreaker',
        'avatar_of_war': 'ra-heavy-fall',
        'war_syn': 'ra-all-for-one',

        // ══════════ SORCERESS ══════════
        'sorceress': 'ra-crystal-wand',
        'fire': 'ra-fire-symbol',
        'fire_bolt': 'ra-small-fire',
        'fireball': 'ra-fire-bomb',
        'fire_mastery': 'ra-burning-embers',
        'meteor': 'ra-burning-meteor',
        'fire_storm': 'ra-arson',
        'immolate': 'ra-campfire',
        'enchant': 'ra-fireball-sword',
        'inferno': 'ra-fire-breath',
        'cold': 'ra-snowflake',
        'ice_bolt': 'ra-frost-emblem',
        'frost_nova': 'ra-frostfire',
        'ice_blast': 'ra-cold-heart',
        'frozen_armor': 'ra-crystal-cluster',
        'blizzard': 'ra-ice-cube',
        'cold_mastery': 'ra-frozen-arrow',
        'frozen_orb': 'ra-crystal-ball',
        'absolute_zero': 'ra-brain-freeze',
        'lightning': 'ra-lightning-bolt',
        'charged_bolt': 'ra-focused-lightning',
        'lightning_bolt': 'ra-lightning',
        'chain_lightning': 'ra-lightning-trio',
        'static_field': 'ra-energise',
        'teleport': 'ra-player-teleport',
        'light_mastery': 'ra-lightning-sword',
        'nova': 'ra-explosion',
        'energy_shield': 'ra-bolt-shield',
        'thunder_storm': 'ra-lightning-storm',

        // ══════════ NECROMANCER ══════════
        'necromancer': 'ra-skull',
        'summoning': 'ra-tombstone',
        'summon_skeleton': 'ra-broken-bone',
        'skeleton_mastery': 'ra-broken-skull',
        'skeleton_mage': 'ra-death-skull',
        'golem': 'ra-monster-skull',
        'golem_mastery': 'ra-gear-hammer',
        'summon_resist': 'ra-circular-shield',
        'revive': 'ra-regeneration',
        'army_of_dead': 'ra-dead-tree',
        'curses': 'ra-eye-monster',
        'amplify_damage': 'ra-broken-shield',
        'weaken': 'ra-health-decrease',
        'iron_maiden': 'ra-crown-of-thorns',
        'life_tap_curse': 'ra-heart-bottle',
        'decrepify': 'ra-noose',
        'lower_resist': 'ra-acid',
        'mass_curse': 'ra-overmind',
        'bone': 'ra-bone-bite',
        'teeth': 'ra-tooth',
        'bone_spear': 'ra-spear-head',
        'bone_armor': 'ra-bone-knife',
        'bone_wall': 'ra-metal-gate',
        'bone_spirit': 'ra-desert-skull',
        'bone_mastery': 'ra-crossed-bones',
        'bone_prison': 'ra-locked-fortress',
        'bone_storm': 'ra-skull-trophy',
        'poison_nova': 'ra-poison-cloud',

        // ══════════ PALADIN ══════════
        'paladin': 'ra-ankh',
        'holy': 'ra-angel-wings',
        'holy_light': 'ra-sunbeams',
        'holy_smite': 'ra-sun-symbol',
        'blessed_hammer': 'ra-hammer-drop',
        'holy_shock': 'ra-player-thunder-struck',
        'consecration': 'ra-aura',
        'holy_mastery': 'ra-sun',
        'divine_shield': 'ra-heavy-shield',
        'divine_storm': 'ra-lightning-storm',
        'foh': 'ra-shot-through-the-heart',
        'auras': 'ra-radial-balance',
        'might_aura': 'ra-muscle-up',
        'prayer_aura': 'ra-health-increase',
        'holy_fire_aura': 'ra-fire-ring',
        'resist_all': 'ra-fire-shield',
        'vigor': 'ra-forward',
        'fanaticism': 'ra-flaming-claw',
        'conviction': 'ra-gavel',
        'aura_mastery': 'ra-triforce',
        'combat': 'ra-crossed-swords',
        'charge': 'ra-boot-stomp',
        'smite': 'ra-flat-hammer',
        'zeal': 'ra-dervish-swords',
        'vengeance': 'ra-flaming-trident',
        'cleansing': 'ra-hospital-cross',
        'judgment': 'ra-crown',

        // ══════════ SHAMAN ══════════
        'shaman': 'ra-lightning',
        'elemental': 'ra-lightning-bolt',
        'lightning_bolt': 'ra-focused-lightning',
        'chain_lightning': 'ra-lightning-trio',
        'thunder_strike': 'ra-player-thunder-struck',
        'elem_mastery': 'ra-energise',
        'storm_caller': 'ra-lightning-storm',
        'earthquake': 'ra-groundbreaker',
        'cl_syn': 'ra-tesla',
        'totems': 'ra-torch',
        'searing_totem': 'ra-campfire',
        'stoneskin_totem': 'ra-guarded-tower',
        'windfury_totem': 'ra-feathered-wing',
        'totem_mastery': 'ra-lit-candelabra',
        'totemic_wrath': 'ra-bomb-explosion',
        'totem_syn': 'ra-candle-fire',
        'restoration': 'ra-heart-bottle',
        'healing_wave': 'ra-health-increase',
        'healing_stream': 'ra-water-drop',
        'earth_shield': 'ra-circular-shield',
        'mana_tide': 'ra-ocean-emblem',
        'nature_swiftness': 'ra-feather-wing',
        'resto_mastery': 'ra-crowned-heart',
        'ancestral_spirit': 'ra-angel-wings',
        'hw_syn': 'ra-droplets',

        // ══════════ ROGUE ══════════
        'rogue': 'ra-hood',
        'assassination': 'ra-daggers',
        'backstab': 'ra-diving-dagger',
        'ambush': 'ra-cloak-and-dagger',
        'eviscerate': 'ra-dripping-knife',
        'lethality': 'ra-bowie-knife',
        'vanish': 'ra-hood',
        'death_blossom': 'ra-shuriken',
        'death_mark': 'ra-on-target',
        'poison': 'ra-poison-cloud',
        'poison_blade': 'ra-dripping-blade',
        'envenom': 'ra-venomous-snake',
        'noxious_cloud': 'ra-gloop',
        'plague': 'ra-biohazard',
        'virulence': 'ra-bottle-vapors',
        'pandemic': 'ra-skull',
        'traps': 'ra-bear-trap',
        'fire_trap': 'ra-fire-bomb',
        'shock_trap': 'ra-focused-lightning',
        'blade_trap': 'ra-circular-saw',
        'trap_mastery': 'ra-bear-trap',
        'shadow_mine': 'ra-bombs',
        'spike_trap': 'ra-spikeball',
        'shadow_strike': 'ra-plain-dagger',
        'death_sentry': 'ra-barbed-arrow',
        'shadow_dance': 'ra-player-dodge',

        // ══════════ WARLOCK ══════════
        'warlock': 'ra-burning-eye',
        'destruction': 'ra-fire-symbol',
        'shadow_bolt': 'ra-bottled-bolt',
        'drain_life': 'ra-bleeding-hearts',
        'soul_fire': 'ra-alien-fire',
        'shadow_mastery': 'ra-arcane-mask',
        'chaos_bolt': 'ra-beam-wake',
        'seed': 'ra-sprout',
        'dark_pact': 'ra-cut-palm',
        'rain_of_chaos': 'ra-burning-meteor',
        'affliction': 'ra-eye-monster',
        'corruption': 'ra-gloop',
        'agony': 'ra-broken-heart',
        'haunt': 'ra-batwings',
        'aff_mastery': 'ra-bleeding-eye',
        'siphon_life': 'ra-glass-heart',
        'unstable': 'ra-radioactive',
        'dark_soul': 'ra-crescent-moon',
        'doom': 'ra-death-skull',
        'demonology': 'ra-dragon',
        'imp': 'ra-small-fire',
        'voidwalker': 'ra-tentacle',
        'demon_armor': 'ra-vest',
        'soul_link': 'ra-two-hearts',
        'demonfire_passive': 'ra-hot-surface',
        'succubus': 'ra-love-howl',
        'infernal': 'ra-lava',
        'metamorphosis': 'ra-hydra',

        // ══════════ DRUID ══════════
        'druid': 'ra-leaf',
        'shapeshifting': 'ra-wolf-head',
        'wolf_form': 'ra-wolf-howl',
        'maul': 'ra-bear-trap',
        'fury': 'ra-flaming-claw',
        'feral_mastery': 'ra-pawprint',
        'bear_form': 'ra-muscle-fat',
        'bear_slam': 'ra-groundbreaker',
        'primal_rage': 'ra-insect-jaws',
        'rabies': 'ra-biohazard',
        'elemental_druid': 'ra-mountains',
        'fissure': 'ra-lava',
        'cyclone_armor': 'ra-fluffy-swirl',
        'tornado': 'ra-fluffy-swirl',
        'twister': 'ra-cycle',
        'hurricane': 'ra-heat-haze',
        'volcano': 'ra-fire-ring',
        'nature_mastery': 'ra-trefoil-lily',
        'armageddon': 'ra-burning-meteor',
        'summoning_druid': 'ra-sprout-emblem',
        'raven': 'ra-raven',
        'spirit_wolf': 'ra-wolf-head',
        'summon_wolf': 'ra-wolf-howl',
        'vine': 'ra-vine-whip',
        'oak_sage': 'ra-acorn',
        'heart_of_wolverine': 'ra-hearts',
        'grizzly': 'ra-crab-claw',
        'stampede': 'ra-lion',
        'companion_hawk': 'ra-bird-claw',

        // ══════════ RANGER ══════════
        'ranger': 'ra-archer',
        'marksmanship': 'ra-archery-target',
        'power_shot': 'ra-supersonic-arrow',
        'multi_shot': 'ra-arrow-cluster',
        'guided_arrow': 'ra-broadhead-arrow',
        'bow_mastery': 'ra-crossbow',
        'immolation_arrow': 'ra-flaming-arrow',
        'strafe': 'ra-arrow-flights',
        'rain_of_arrows': 'ra-target-arrows',
        'nature_ranger': 'ra-pine-tree',
        'companion_hawk': 'ra-bird-claw',
        'viper_arrow': 'ra-chemical-arrow',
        'comp_mastery': 'ra-thorn-arrow',
        'wolf_pack': 'ra-wolf-howl',
        'spirit_guide': 'ra-feather-wing',
        'harmony': 'ra-trefoil-lily',
        'stampede_ranger': 'ra-lion',
        'traps_ranger': 'ra-bear-trap',
        'ice_trap': 'ra-frost-emblem',
        'fire_trap_r': 'ra-cannon-shot',
        'black_arrow': 'ra-barbed-arrow',
        'minefield': 'ra-bombs',
        'mark_death': 'ra-targeted',

        // ══════════ MISC / SYNERGIES ══════════
        'chain_reaction': 'ra-chain',
        'fortress': 'ra-locked-fortress',
    };
    return iconMap[id] || 'ra-cog';
}

function getItemHtml(item, cantEquip = false, isGamble = false) {
    if (!item) return '';
    const rarityClass = isGamble ? 'rarity-normal' : `rarity-${item.rarity || 'normal'}`;
    let iconName = isGamble ? 'item_orb' : item.icon;

    // Icon Aliasing System to prevent 404s and handle legacy names
    const iconAliases = {
        'item_gem_perfect': 'item_ruby',    // Legacy item name fallback
        'item_mace_club': 'item_mace',      // Fixed in data-bases but kept here for safety
        'item_potion_rejuv': 'item_potion_hp',
        'item_potion_purple': 'item_potion_hp',
        'item_sword_short': 'item_short_sword',
        'item_sword_long': 'item_long_sword',
        'item_sword_zweihander': 'item_zweihander',
        'item_axe_hand': 'item_hand_axe',
        'item_axe_war': 'item_war_axe',
        'item_hammer_war': 'item_war_hammer',
        'item_staff_short': 'item_short_staff',
        'item_staff_war': 'item_war_staff',
        'item_bow_short': 'item_short_bow',
        'item_bow_long': 'item_long_bow',
        'item_helm_leather': 'item_leather_cap',
        'item_helm_great': 'item_great_helm',
        'item_helm_circlet': 'item_circlet',
        'item_armor_leather': 'item_leather_armor',
        'item_armor_chain': 'item_chain_mail',
        'item_armor_plate': 'item_plate_mail',
        'item_armor_robe': 'item_robe',
        'item_gloves_leather': 'item_leather_gloves',
        'item_gloves_gauntlets': 'item_gauntlets',
        'item_boots_leather': 'item_leather_boots',
        'item_boots_war': 'item_war_boots',
        'item_shield_buckler': 'item_buckler',
        'item_shield_tower': 'item_tower_shield',
        'item_shield_source': 'item_source',
        'item_key': 'item_ring'
    };
    if (iconAliases[iconName]) iconName = iconAliases[iconName];

    const ceClass = cantEquip ? 'cant-equip' : '';
    const quantityBadge = (!isGamble && item.quantity > 1) ? `<div class="item-quantity-badge">${item.quantity}</div>` : '';

    // Phase 30: Visual Sockets
    let socketsHtml = '';
    if (!isGamble && item.sockets > 0) {
        socketsHtml = '<div class="sockets-container">';
        for (let i = 0; i < item.sockets; i++) {
            const gem = item.socketed && item.socketed[i];
            const gemClass = gem ? 'filled' : 'empty';
            const gemColor = gem ? (gem.color || '#fff') : 'transparent';
            socketsHtml += `<div class="socket-hole ${gemClass}" style="background-color: ${gemColor}"></div>`;
        }
        socketsHtml += '</div>';
    }

    return `<div class="inv-item ${rarityClass} ${ceClass} ${isGamble ? 'mystery-item' : ''}">
        ${quantityBadge}
        ${socketsHtml}
        <img src="assets/${iconName}.png" onerror="this.src='assets/item_orb.png'">
        <div class="rarity-glow"></div>
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
        const slotEl = $(`skill-${i + 1}`);
        const si = $(`si-${i}`);
        const skillId = player.hotbar[i];

        // Ensure slot handles drops
        slotEl.onmouseup = () => handleDrop('hotbar', i);

        // Remove old listeners by cloning the icon container
        const newSi = si.cloneNode(true);
        si.parentNode.replaceChild(newSi, si);

        if (skillId && player.skillMap[skillId]) {
            newSi.innerHTML = `<i class="ra ${getIconForSkill(skillId)}" style="font-size: 28px; line-height: 48px; text-align: center; color: var(--gold); text-shadow: 0 0 5px #000; width: 100%; height: 100%; display: block; border-radius: 4px; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);"></i>`;

            newSi.addEventListener('mouseenter', (e) => showSkillTooltip(skillId, e.clientX, e.clientY));
            newSi.addEventListener('mousemove', (e) => moveTooltip(e.clientX, e.clientY));
            newSi.addEventListener('mouseleave', hideTooltip);

            // Drag support for skills
            newSi.onmousedown = (e) => {
                if (e.button !== 0) return;
                const sx = e.clientX, sy = e.clientY;
                let d = false;
                const mv = (m) => {
                    if (!d && Math.hypot(m.clientX - sx, m.clientY - sy) > 5) {
                        d = true;
                        startSkillDrag(m, skillId, i);
                        window.removeEventListener('mousemove', mv);
                    }
                };
                const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
                window.addEventListener('mousemove', mv);
                window.addEventListener('mouseup', up);
            };
        } else {
            newSi.innerHTML = '';
        }

        // Open Picker on Click
        newSi.addEventListener('click', (e) => {
            if (draggedSkill) return;
            e.stopPropagation();
            openSkillPicker(i, e.clientX, e.clientY);
        });

        // Right-click to clear
        newSi.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            player.hotbar[i] = null;
            updateSkillBar();
            addCombatLog(`Cleared slot ${i + 1}`, 'log-info');
        });
    }
}

function showSkillTooltip(skillId, x, y) {
    const tt = $('custom-tooltip');
    tt.innerHTML = skillTooltipText(skillId);
    tt.style.display = 'block';
    moveTooltip(x, y);
}

function skillTooltipText(skillId) {
    const skill = player.skillMap[skillId];
    if (!skill) return '';

    const effLvl = player.effectiveSkillLevel(skillId);
    const synBonus = player.talents.synergyBonus ? player.talents.synergyBonus(skillId) : 0;

    let t = `<div class="tooltip-inner" style="color:#fff; min-width: 220px;">`;
    t += `<div class="tooltip-name" style="color:var(--gold);">${skill.name} <span style="color:#aaa; font-size:12px;">(Lv ${effLvl})</span></div>`;
    t += `<div class="tooltip-rarity" style="color:#666; margin-bottom: 8px;">— Active Skill —</div>`;
    t += `<div class="tooltip-stats" style="color:#ccc; font-size:12px;">${skill.desc}</div>`;

    t += `<div style="margin-top:10px; padding-top:6px; border-top:1px solid #333;">`;
    if (skill.mana) t += `<div style="color:#4850b8;">Mana Cost: ${skill.mana}</div>`;
    if (skill.cd) t += `<div style="color:#aaa;">Cooldown: ${skill.cd}s</div>`;

    if (skill.dmgBase) {
        const baseDmg = skill.dmgBase + (skill.dmgPerLvl || 0) * (effLvl - 1);
        const wepDmg = (player.wepMin + player.wepMax) / 2;
        let totalBase = baseDmg + (skill.wepDmgPct ? wepDmg * (skill.wepDmgPct / 100) : 0);

        let typeMultiplier = 0;
        const dmgType = skill.group === 'fire' || skill.group === 'cold' || skill.group === 'lightning' || skill.group === 'poison' || skill.group === 'shadow' || skill.group === 'holy' ? skill.group : 'physical';

        if (dmgType === 'fire') typeMultiplier = player.pctFireDmg || 0;
        if (dmgType === 'cold') typeMultiplier = player.pctColdDmg || 0;
        if (dmgType === 'lightning') typeMultiplier = player.pctLightDmg || 0;
        if (dmgType === 'poison') typeMultiplier = player.pctPoisonDmg || 0;
        if (dmgType === 'shadow') typeMultiplier = player.pctShadowDmg || 0;
        if (dmgType === 'holy') typeMultiplier = player.pctHolyDmg || 0;

        const finalMultiplier = 1 + (player.pctDmg || 0) / 100 + synBonus + typeMultiplier / 100;
        const finalDmg = Math.round(totalBase * finalMultiplier);

        const dmgColors = { fire: '#ff6030', cold: '#30ccff', lightning: '#ffff40', poison: '#50ff50', shadow: '#cc60ff', physical: '#ffffff', holy: '#ffd700' };
        t += `<div style="color:${dmgColors[dmgType] || '#fff'}; font-weight:bold; margin-top:4px;">Damage: ${finalDmg} ${dmgType}</div>`;

        if (synBonus > 0) {
            t += `<div style="color:#00ff00; font-size:11px;">+${Math.round(synBonus * 100)}% from Synergies</div>`;
        }
    }

    t += `</div></div>`;
    return t;
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

    // Zoom Logic
    const zoom = minimapZoom || 1.0;
    const sx = (mw / dungeon.width) * zoom;
    const sy = (mh / dungeon.height) * zoom;

    // Offset to center on player
    const px_tile = player.x / dungeon.tileSize;
    const py_tile = player.y / dungeon.tileSize;

    const ox = (mw / 2) - px_tile * sx;
    const oy = (mh / 2) - py_tile * sy;

    // Draw tiles
    for (let r = 0; r < dungeon.height; r++) {
        for (let c = 0; c < dungeon.width; c++) {
            if (explored && !explored[r][c]) continue;
            const t = dungeon.grid[r][c];
            if (t === 1) continue; // WALL

            const dx = ox + c * sx;
            const dy = oy + r * sy;

            // Bounds check for performance/clipping
            if (dx + sx < 0 || dx > mw || dy + sy < 0 || dy > mh) continue;

            ctx.fillStyle = t === 0 ? '#3a3640' : t === 3 ? '#ffd700' : t === 6 ? '#2d5a27' : t === 7 ? '#5c4a3d' : t === 8 ? '#1e4b85' : '#4a4050';
            ctx.fillRect(dx, dy, Math.ceil(sx), Math.ceil(sy));
        }
    }

    // World Objects
    for (const obj of gameObjects) {
        const or = Math.floor(obj.y / dungeon.tileSize);
        const oc = Math.floor(obj.x / dungeon.tileSize);
        if (explored[or] && explored[or][oc]) {
            const obx = ox + (obj.x / dungeon.tileSize) * sx;
            const oby = oy + (obj.y / dungeon.tileSize) * sy;
            if (obx < 0 || obx > mw || oby < 0 || oby > mh) continue;

            if (obj.type === 'waypoint') {
                ctx.fillStyle = '#ffd700';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⭐', obx, oby + 4);
            } else if (obj.type === 'portal' || obj.type === 'uber_portal' || obj.type === 'rift_exit') {
                ctx.fillStyle = '#30ccff';
                ctx.beginPath(); ctx.arc(obx, oby, 3, 0, Math.PI * 2); ctx.fill();
            } else if (obj.type === 'stairs_down') {
                ctx.fillStyle = '#ffd700'; // Gold for exit
                ctx.beginPath();
                ctx.moveTo(obx, oby - 4); ctx.lineTo(obx + 4, oby + 2); ctx.lineTo(obx - 4, oby + 2);
                ctx.fill();
            } else {
                ctx.fillStyle = obj.type === 'shrine' ? '#ffd700' : '#8b4513';
                ctx.fillRect(obx - 1, oby - 1, 2, 2);
            }
        }
    }

    // Enemy dots
    for (const e of enemies) {
        if (e.hp <= 0) continue;
        const ex = ox + (e.x / dungeon.tileSize) * sx;
        const ey = oy + (e.y / dungeon.tileSize) * sy;
        if (ex < 0 || ex > mw || ey < 0 || ey > mh) continue;

        if (e.type === 'boss') {
            ctx.fillStyle = '#ff0000';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('💀', ex, ey + 3);
        } else {
            ctx.fillStyle = e.type === 'unique' ? '#bf642f' : (e.type === 'rare' ? '#ffff00' : '#e04040');
            ctx.fillRect(ex - 1, ey - 1, 2, 2);
        }
    }

    // NPC dots
    for (const n of npcs) {
        const nx = ox + (n.x / dungeon.tileSize) * sx;
        const ny = oy + (n.y / dungeon.tileSize) * sy;
        if (nx < 0 || nx > mw || ny < 0 || ny > mh) continue;

        ctx.fillStyle = '#40a0ff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        // Distinct icons for key NPCs
        const nIcon = n.id === 'akara' ? '☥' : (n.id === 'gheed' ? '💰' : '👤');
        ctx.fillText(nIcon, nx, ny + 4);
    }

    // Player dot (always center)
    ctx.fillStyle = '#00ff40';
    const pSize = showFullMap ? 6 : 4;
    ctx.fillRect(mw / 2 - pSize / 2, mh / 2 - pSize / 2, pSize, pSize);

    // Path destination marker
    if (player.path && player.path.length > 0) {
        const dest = player.path[player.path.length - 1];
        const destX = ox + (dest.x / dungeon.tileSize) * sx;
        const destY = oy + (dest.y / dungeon.tileSize) * sy;
        if (destX >= 0 && destX <= mw && destY >= 0 && destY <= mh) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(destX - 4, destY - 4); ctx.lineTo(destX + 4, destY + 4);
            ctx.moveTo(destX + 4, destY - 4); ctx.lineTo(destX - 4, destY + 4);
            ctx.stroke();
        }
    }

    if (showFullMap) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, mw - 4, mh - 4);

        // Area Label
        const zoneName = ZONE_NAMES[zoneLevel] || `Rift Level ${zoneLevel - 7}`;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(mw / 2 - 100, 10, 200, 30);
        ctx.strokeStyle = '#bf642f';
        ctx.lineWidth = 1;
        ctx.strokeRect(mw / 2 - 100, 10, 200, 30);

        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText(zoneName.toUpperCase(), mw / 2, 32);
    }
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

// Weapon Swap
bus.on('action:weapon_swap', () => {
    if (player && (state === 'GAME' || state === 'INVENTORY')) {
        player.swapWeapons();
        renderInventory();
        renderCharacterPanel();
        if (fx) fx.emitBurst(player.x, player.y, '#ffd700', 15, 1.5);
        bus.emit('item:move');
    }
});

// ─── TOGGLES ───
bus.on('ui:toggle:fullmap', () => {
    showFullMap = !showFullMap;
    bus.emit('ui:click');
});
bus.on('ui:toggle:journal', () => {
    const panel = $('panel-quests');
    if (!panel) return;
    if (panel.classList.contains('hidden')) {
        document.querySelectorAll('.panel, .ui-panel, .window, .side-panel').forEach(p => p.classList.add('hidden'));
        panel.classList.remove('hidden');
        renderQuestJournal();
    } else {
        panel.classList.add('hidden');
    }
    bus.emit('ui:click');
});

bus.on('ui:toggle:achievements', () => {
    const panel = $('panel-achievements');
    if (!panel) return;
    if (panel.classList.contains('hidden')) {
        document.querySelectorAll('.panel, .ui-panel, .window, .side-panel').forEach(p => p.classList.add('hidden'));
        panel.classList.remove('hidden');
        renderAchievementsList();
    } else {
        panel.classList.add('hidden');
    }
    bus.emit('ui:click');
});

// Consolidated Loot Filter
bus.on('ui:toggle:lootfilter', () => {
    lootFilter = (lootFilter + 1) % 3;
    const labels = ['SHOW ALL', 'HIDE NORMAL', 'HIDE MAGIC'];
    const msg = `Loot Filter: ${labels[lootFilter]}`;
    addCombatLog(msg, 'log-info');
    updateHud(); // Refresh HUD text immediately
});

// Minimap Zoom
bus.on('ui:toggle:map', () => {
    const zooms = [1.0, 1.5, 2.0];
    let idx = zooms.indexOf(minimapZoom);
    minimapZoom = zooms[(idx + 1) % zooms.length];
    addCombatLog(`Minimap Zoom: ${minimapZoom}x`, 'log-info');
});

// Interactive Minimap Navigation
$('minimap')?.addEventListener('click', (e) => {
    if (!dungeon || !player || state !== 'GAME') return;
    const mc = $('minimap');
    const rect = mc.getBoundingClientRect();
    // Use scaling in case CSS width/height differs from canvas attributes
    const scaleX = mc.width / rect.width;
    const scaleY = mc.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    const mw = mc.width, mh = mc.height;
    const zoom = minimapZoom || 1.0;
    const sx = (mw / dungeon.width) * zoom;
    const sy = (mh / dungeon.height) * zoom;

    const px_tile = player.x / dungeon.tileSize;
    const py_tile = player.y / dungeon.tileSize;

    const ox = (mw / 2) - px_tile * sx;
    const oy = (mh / 2) - py_tile * sy;

    const targetX = ((cx - ox) / sx) * dungeon.tileSize;
    const targetY = ((cy - oy) / sy) * dungeon.tileSize;

    if (targetX < 0 || targetX >= dungeon.width * dungeon.tileSize || targetY < 0 || targetY >= dungeon.height * dungeon.tileSize) return;

    player.attackTarget = null;
    player.path = player.pathfinder.find(dungeon.grid, player.x, player.y, targetX, targetY, dungeon.tileSize);
    if (player.path.length > 0) {
        addCombatLog('Auto-navigating to map location...', 'log-info');
        bus.emit('ui:click'); // Auditory feedback
    }
});

// ─── COMBAT EVENTS ───
bus.on('combat:damage', d => {
    if (d.worldX && d.worldY) {
        const colors = {
            physical: '#ffffff',
            fire: '#ff6600',
            cold: '#00ccff',
            lightning: '#ffff00',
            poison: '#00ff00',
            magic: '#ff00ff',
            shadow: '#a040ff',
            holy: '#ffd700'
        };
        const color = d.isCrit ? '#ffcc00' : (colors[d.type] || '#ffffff');
        const text = d.dealt === 'Blocked!' ? 'BLOCKED' : d.dealt;
        fx.emitText(d.worldX, d.worldY, text, color, d.isCrit);

        // Impact FX
        if (d.dealt !== 'Blocked!') {
            fx.emitBurst(d.worldX, d.worldY, color, d.isCrit ? 12 : 5, 1.5);
            if (d.isCrit) fx.shake(200, 4);
        }
    }

    const cls = d.isCrit ? 'log-crit' : 'log-dmg';
    if (d.dealt === 'Blocked!') {
        addCombatLog(`Blocked attack!`, 'log-info');
    } else if (d.target?.isPlayer) {
        lastHitTime = performance.now();
    }
    if (!d.target?.isPlayer) {
        const cls = d.isCrit ? 'log-crit' : 'log-dmg';
        if (d.dealt === 0 && d.type !== 'physical') {
            addCombatLog(`Target is IMMUNE to ${d.type}!`, 'log-dmg');
        } else {
            addCombatLog(`${d.dealt} ${d.type} damage${d.isCrit ? ' CRIT!' : ''}`, cls);
        }
    }
    // Floating number
    if (camera && renderer) {
        const screen = camera.toScreen(d.worldX || d.target?.x || 0, d.worldY || d.target?.y || 0);
        const el = document.createElement('div');
        el.className = 'dmg-number';

        let isSpecial = false;
        if (d.dealt === 'Blocked!') {
            el.textContent = 'BLOCKED!';
            el.style.color = '#aaa';
            isSpecial = true;
            playLoot(); // Use loot sound as a 'clink' for now
        } else if (d.dealt === 0 && d.type !== 'physical' && !d.target?.isPlayer) {
            el.textContent = 'IMMUNE!';
            el.style.color = '#fff';
            el.style.fontWeight = 'bold';
            isSpecial = true;
            playLoot();
        } else {
            el.textContent = d.dealt;
        }

        el.style.left = screen.x + 'px';
        el.style.top = (screen.y - 20) + 'px';
        const dmgColors = { fire: '#ff6030', cold: '#30ccff', lightning: '#ffff40', poison: '#50ff50', shadow: '#cc60ff', physical: '#ffffff' };
        const baseColor = d.target?.isPlayer ? '#e05050' : (dmgColors[d.type] || '#fff');
        el.style.color = d.isCrit ? '#ffa040' : (el.textContent === 'IMMUNE!' ? '#fff' : baseColor);
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

        // Steal Visuals
        if (d.attacker?.isPlayer && !d.target?.isPlayer) {
            if (d.attacker.lifeStealPct && Math.random() < 0.3) {
                fx.emitHeal(d.attacker.x, d.attacker.y);
                const stolen = Math.round(d.dealt * d.attacker.lifeStealPct / 100);
                if (stolen > 0) bus.emit('combat:text', { x: d.attacker.x, y: d.attacker.y - 15, text: `+${stolen}`, color: '#40ff40' });
            }
            if (d.attacker.manaStealPct && Math.random() < 0.3) {
                fx.emitManaSteal(d.attacker.x, d.attacker.y);
                const stolen = Math.round(d.dealt * d.attacker.manaStealPct / 100);
                if (stolen > 0) bus.emit('combat:text', { x: d.attacker.x, y: d.attacker.y - 5, text: `+${stolen}`, color: '#4080ff' });
            }
        }
    }
});

bus.on('combat:text', d => {
    if (camera && renderer) {
        const screen = camera.toScreen(d.x, d.y);
        const el = document.createElement('div');
        el.className = 'dmg-number';
        el.textContent = d.text;
        el.style.left = screen.x + 'px';
        el.style.top = screen.y + 'px';
        el.style.color = d.color || '#fff';
        el.style.fontSize = '12px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
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
                maxHp: 200 * (window._difficulty > 0 ? window.DIFFICULTY_MULT[window._difficulty] : 1),
                dmg: 25 * (window._difficulty > 0 ? window.DIFFICULTY_MULT[window._difficulty] : 1),
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
    if (player && fx) {
        fx.emitLevelUp(player.x, player.y);
        spawnFloatingText(player.x, player.y, 'LEVEL UP!', 'holy', true);
    }
    playZoneTransition(); // Level up sound
    updateSkillBar();
});

bus.on('log:add', d => {
    addCombatLog(d.text, d.cls || '');
});

// --- Phase 27: Special Loot Handling ---
bus.on('loot:special', d => {
    const { item, itemId, x, y } = d;
    let dropped = item;
    if (itemId === 'hellfire_torch') {
        const torch = loot.generateFixedUnique('hellfire_torch');
        torch.x = x; torch.y = y;
        droppedItems.push(torch);
        fx.emitLootBeam(x, y, '#ff8000');
        return;
    }
    if (dropped) {
        dropped.x = x; dropped.y = y;
        droppedItems.push(dropped);
        fx.emitLootBeam(x, y, '#ffd700');
    }
});

bus.on('item:broken', d => {
    addCombatLog(`⚠ ALERT: Your ${d.item.name} is BROKEN!`, 'log-dmg');
    if (player) player._recalcStats();
    renderInventory();
    renderCharacterPanel();
});

bus.on('skill:used', d => {
    // Player Skill VFX
    if (d.playerX && d.playerY) {
        if (d.skillId?.includes('slash') || d.skillId?.includes('swing')) {
            const angle = Math.atan2(input.mouseY - d.playerY, input.mouseX - d.playerX);
            fx.emitSlash(d.playerX, d.playerY, angle, '#ffffff', 30);
        } else if (d.skillId?.includes('fire')) {
            fx.emitFireTrail(d.playerX, d.playerY);
        } else if (d.skillId?.includes('holy') || d.skillId?.includes('heal') || d.skillId?.includes('smite')) {
            fx.emitHolyBurst(d.playerX, d.playerY);
        } else if (d.skillId?.includes('shock') || d.skillId?.includes('slam')) {
            fx.emitShockwave(d.playerX, d.playerY, 50);
        } else {
            // Default burst
            fx.emitBurst(d.playerX, d.playerY, '#ffffff', 5, 1);
        }
    }

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
    if (name === 'mercenary' && !panel.classList.contains('hidden')) renderMercenaryPanel();
    if (name === 'bounties' && !panel.classList.contains('hidden')) renderBountyBoard();
}

$('btn-sort-inv')?.addEventListener('click', () => {
    if (!player) return;
    player.sortInventory();
    renderInventory();
    updateHud(); // update belt display
    addCombatLog('Inventory & Belt Organized.', 'log-info');
});

$('btn-sort-stash')?.addEventListener('click', () => {
    if (!player) return;
    sortStash();
    renderStash();
    addCombatLog('Stash Organized.', 'log-info');
});

$('btn-sell-junk')?.addEventListener('click', () => {
    if (!player) return;
    sellAllJunk();
    renderInventory();
    renderCharacterPanel();
});

bus.on('ui:toggle:inventory', () => togglePanel('inventory'));
bus.on('ui:toggle:talents', () => togglePanel('talents'));
bus.on('ui:toggle:character', () => togglePanel('character'));
bus.on('ui:toggle:mercenary', () => togglePanel('mercenary'));

// renderInventory was merged down to line 3147

function renderMercenaryPanel() {
    if (!mercenary) {
        $('merc-paperdoll').style.opacity = '0.3';
        $('merc-stats-display').innerHTML = '<div style="text-align:center;padding:20px;">No active companion.<br>Hire a Rogue in town.</div>';
        return;
    }
    $('merc-paperdoll').style.opacity = '1';

    const slots = ['head', 'chest', 'mainhand', 'offhand'];
    slots.forEach(s => {
        const el = document.querySelector(`.merc-slot[data-slot="${s}"]`);
        if (!el) return;
        const item = mercenary.equipment[s];
        el.innerHTML = item ? getItemHtml(item) : '';

        // Drag & Drop for Mercenary Slots (Threshold-based)
        el.onmousedown = (e) => {
            if (e.button !== 0) return;
            const sx = e.clientX, sy = e.clientY;
            let d = false;
            const mv = (m) => {
                if (!d && Math.hypot(m.clientX - sx, m.clientY - sy) > 5) {
                    d = true;
                    startDrag(m, item, 'merc', s);
                    window.removeEventListener('mousemove', mv);
                }
            };
            const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
            window.addEventListener('mousemove', mv);
            window.addEventListener('mouseup', up);
        };
        el.onmouseup = (e) => {
            e.stopPropagation();
            handleDrop('merc', s);
        };

        if (item) {
            const itemEl = el.querySelector('.inv-item');
            setupTooltip(itemEl, item);

            // Right-click to unequip
            itemEl.oncontextmenu = (e) => {
                e.preventDefault();
                const empty = player.inventory.indexOf(null);
                if (empty !== -1) {
                    player.inventory[empty] = item;
                    mercenary.equipment[s] = null;
                    mercenary._recalcStats();
                    renderMercenaryPanel();
                    renderInventory();
                    addCombatLog(`Took ${item.name} from ${mercenary.name}`, 'log-info');
                } else {
                    addCombatLog('Inventory full!', 'log-dmg');
                }
            };
        }
    });

    // Display buffs
    let buffHtml = '';
    if (mercenary._buffs && mercenary._buffs.length > 0) {
        buffHtml = '<div style="display:flex; gap:4px; margin-top:8px; padding-top:5px; border-top:1px solid #444;">';
        for (const b of mercenary._buffs) {
            buffHtml += `<div style="width:16px; height:16px; background:#330; border:1px solid #aa0; color:#ff0; font-size:9px; display:flex; justify-content:center; align-items:center; border-radius:2px;" title="${b.type.toUpperCase()}: ${b.duration.toFixed(1)}s">⚡</div>`;
        }
        buffHtml += '</div>';
    }

    $('merc-stats-display').innerHTML = `
        <div style="color:var(--gold); font-family:Cinzel,serif; margin-bottom:5px; border-bottom:1px solid #444;">${mercenary.name} (Lvl ${mercenary.level} ${mercenary.className})</div>
        <div>HP: <span style="color:#fff;">${Math.round(mercenary.hp)} / ${mercenary.maxHp}</span></div>
        <div>Damage: <span style="color:#fff;">${Math.round(mercenary.baseDmg)}</span></div>
        <div style="margin-top:5px; font-size:9px; color:#888;">Resists: 
            <span style="color:#f66;">F:${mercenary.resists.fire}%</span> 
            <span style="color:#6af;">C:${mercenary.resists.cold}%</span> 
            <span style="color:#ff4;">L:${mercenary.resists.light}%</span> 
            <span style="color:#6f6;">P:${mercenary.resists.pois}%</span>
        </div>
        <div class="merc-xp-bar"><div class="merc-xp-fill" style="width:${(mercenary.xp / mercenary.xpToNextLevel * 100).toFixed(1)}%"></div></div>
        <div style="font-size:8px; text-align:right; color:#66a; margin-top:1px;">XP: ${Math.floor(mercenary.xp)} / ${mercenary.xpToNextLevel}</div>
        ${buffHtml}
    `;
}

function renderBountyBoard() {
    const list = $('bounty-list');
    if (!list) return;
    if (activeBounties.length === 0) generateDailyBounties();

    list.innerHTML = '';
    activeBounties.forEach(b => {
        const isDone = b.progress >= b.targetCount;
        const card = document.createElement('div');
        card.className = `bounty-card ${isDone ? 'bounty-complete' : ''}`;
        card.innerHTML = `
            <div class="bounty-title">${b.title} ${isDone ? '✅' : ''}</div>
            <div style="font-size:11px; font-style:italic;">${b.desc}</div>
            <div class="bounty-progress">Progress: ${b.progress} / ${b.targetCount}</div>
            <div class="bounty-reward">Reward: ${b.reward.gold} Gold, ${b.reward.xp} XP</div>
        `;
        list.appendChild(card);
    });
}
bus.on('ui:closeAll', () => {
    ['inventory', 'talents', 'character', 'shop', 'stash', 'cube', 'quests', 'mercenary'].forEach(p => {
        const el = $(`panel-${p}`);
        if (el) el.classList.add('hidden');
    });
    // Reset global interaction states
    isIdentifying = false;
    isLarzukSocketing = false;
    socketingGemIndex = -1;
    activeDialogueNpc = null;
    activeWaypointObj = null;
    const existing = document.getElementById('dialogue-picker');
    if (existing) existing.remove();
    document.body.style.cursor = 'default';
    syncInteractionStates();
});

// Town Portal
bus.on('action:town_portal', () => {
    if (state !== 'GAME' && state !== 'INVENTORY') return;
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

// Interaction
bus.on('action:interact', () => {
    if (state !== 'GAME' || (player && player.hp <= 0)) return;
    
    // Interaction range
    const range = 53;
    
    // 1. Closest NPC / Object
    const interactables = [...npcs, ...gameObjects];
    let closest = null;
    let minDist = range;
    for (const t of interactables) {
        const d = Math.sqrt((t.x - player.x)**2 + (t.y - player.y)**2);
        if (d < minDist) { minDist = d; closest = t; }
    }
    
    if (closest) {
        if (closest instanceof NPC) renderDialoguePicker(closest);
        else if (closest.interact) closest.interact(player);
        return;
    }
    
    // 2. Closest Item
    let closestItem = null;
    let minItemDist = 45;
    for (const di of droppedItems) {
        const d = Math.sqrt((di.x - player.x)**2 + (di.y - player.y)**2);
        if (d < minItemDist) { minItemDist = d; closestItem = di; }
    }
    if (closestItem) {
        if (player.addToInventory(closestItem)) {
            addCombatLog(`Picked up ${closestItem.name}`, 'log-item');
            droppedItems.splice(droppedItems.indexOf(closestItem), 1);
            playLoot();
            renderInventory();
        } else {
            addCombatLog('Inventory full!', 'log-dmg');
        }
        return;
    }

    // 3. Closest Gold
    let closestGold = null;
    let minGoldDist = 45;
    for (const dg of droppedGold) {
        const d = Math.sqrt((dg.x - player.x)**2 + (dg.y - player.y)**2);
        if (d < minGoldDist) { minGoldDist = d; closestGold = dg; }
    }
    if (closestGold) {
        player.gold += closestGold.amount;
        totalGoldCollected += closestGold.amount;
        addCombatLog(`Picked up ${closestGold.amount} Gold`, 'log-heal');
        droppedGold.splice(droppedGold.indexOf(closestGold), 1);
        updateHud();
        renderInventory();
    }
});

// Loot Filter Cycle
bus.on('ui:toggle:lootfilter', () => {
    lootFilter = (lootFilter + 1) % 3;
    const labels = ['ALL', 'MAGIC+', 'RARE+'];
    const label = document.getElementById('hud-loot-filter');
    if (label) label.textContent = `FILTER: ${labels[lootFilter]}`;
    addCombatLog(`Loot Filter: ${labels[lootFilter]}`, 'log-info');
});

// Weapon Swapping
bus.on('action:weapon_swap', () => {
    if (player && state === 'GAME') {
        player.swapWeaponSet();
        addCombatLog(`Swapped to Weapon Set ${player.activeWeaponSet}`, 'log-info');
        renderInventory();
        renderCharacterPanel();
        updateHud();
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
    if (!$('panel-quests').classList.contains('hidden')) renderQuestJournal();
});

// ─── QUEST LOG ───
function renderQuestJournal() {
    const list = $('quest-list');
    const stats = $('quest-stats');
    if (!list || !stats) return;
    list.innerHTML = '';

    if (activeQuests.length === 0 && completedQuests.size === 0) {
        list.innerHTML = '<div style="color:#666;text-align:center;padding:20px;">No quests yet.<br>Visit the town elders to begin your journey.</div>';
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

let lastAchievementRenderTime = 0;
function renderAchievementsList() {
    const list = $('achievements-list');
    if (!list) return;

    // Throttle rendering to once every 500ms if actually needed
    const now = performance.now();
    if (now - lastAchievementRenderTime < 500) return;
    lastAchievementRenderTime = now;

    list.innerHTML = '';
    const frag = document.createDocumentFragment();

    ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = unlockedAchievements.has(ach.id);
        const card = document.createElement('div');
        card.style.cssText = `
            padding: 10px; margin-bottom: 8px; border: 1px solid ${isUnlocked ? '#bf642f' : '#333'};
            background: ${isUnlocked ? 'rgba(191,100,47,0.1)' : 'rgba(0,0,0,0.4)'};
            border-radius: 4px; display: flex; align-items: center; gap: 12px;
            opacity: ${isUnlocked ? '1' : '0.5'}; transition: 0.3s;
        `;

        card.innerHTML = `
            <div style="font-size: 24px;">${isUnlocked ? '🏆' : '🔒'}</div>
            <div style="flex: 1;">
                <div style="color: ${isUnlocked ? '#ffd700' : '#888'}; font-weight: bold; font-family: Cinzel, serif;">${ach.name}</div>
                <div style="font-size: 11px; color: #aaa;">${ach.desc}</div>
                ${ach.reward ? `<div style="font-size: 10px; color: #4caf50; margin-top: 2px;">Reward: ${ach.reward} Gold</div>` : ''}
            </div>
            ${isUnlocked ? '<div style="color: #4caf50; font-size: 10px; font-weight: bold;">UNLOCKED</div>' : ''}
        `;
        frag.appendChild(card);
    });
    list.appendChild(frag);
}

// ─── AUTO-BELT REFILL ───
function autoBeltRefill() {
    if (!player) return;
    for (let i = 0; i < 4; i++) {
        if (!player.belt[i]) {
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
        ['Level', player.level + (player.paragonLevel > 0 ? ` (+${player.paragonLevel} Paragon)` : '')],
        ['Gold', player.gold],
        ['Stat Points', `<span style="color:${sp > 0 ? '#ffd700' : '#888'}">${sp}</span>`],
        ['Paragon Pts', `<span style="color:${player.paragonPoints > 0 ? 'var(--cyan)' : '#888'}">${player.paragonPoints}</span> ${player.level >= 99 ? `<button id="btn-open-paragon" style="padding:0 4px;font-size:10px;">VIEW</button>` : ''}`],
        ['─ ATTRIBUTES ─', ''],
        ['Strength', `${player.str} ${btn('str')}`, `Strength: ${player.str} [Base: ${player.baseStr}, Gear: +${player.str - player.baseStr}]`],
        ['Dexterity', `${player.dex} ${btn('dex')}`, `Dexterity: ${player.dex} [Base: ${player.baseDex}, Gear: +${player.dex - player.baseDex}]`],
        ['Vitality', `${player.vit} ${btn('vit')}`, `Vitality: ${player.vit} [Base: ${player.baseVit}, Gear: +${player.vit - player.baseVit}]`],
        ['Intellect', `${player.int} ${btn('int')}`, `Intellect: ${player.int} [Base: ${player.baseInt}, Gear: +${player.int - player.baseInt}]`],
        ['─ OFFENSE ─', ''],
        ['Weapon Dmg', `${player.wepMin}–${player.wepMax}`, `Physical Base: ${player.wepMin} to ${player.wepMax}`],
        ['Attack Speed', player.atkSpd.toFixed(2), `Swings per second. Modified by Weapon Base and IAS.`],
        ['Crit Chance', player.critChance + '%', `Chance to deal ${player.critMulti}% damage.`],
        ['Crit Multi', player.critMulti + '%', `Damage multiplier on critical strikes.`],
        ['─ DEFENSE ─', ''],
        ['HP', `${Math.round(player.hp)} / ${player.maxHp}`, `Life: Keep this above zero!`],
        ['MP', `${Math.round(player.mp)} / ${player.maxMp}`, `Mana: Used to cast powerful spells.`],
        ['Armor', Math.round(player.armor), `Reduces physical damage taken by approximately ${Math.round(100 * player.armor / (player.armor + 400))}%`],
        ['Fire Res', `${player.fireRes}%`, `Reduces Fire damage taken. Max 75%.`],
        ['Cold Res', `${player.coldRes}%`, `Reduces Cold damage taken. Max 75%.`],
        ['Lightning Res', `${player.lightRes}%`, `Reduces Lightning damage taken. Max 75%.`],
        ['Poison Res', `${player.poisRes}%`, `Reduces Poison damage taken. Max 75%.`],
        ['Permanent Res', `+${player.permanentResists || 0}%`, `Permanent resistance bonuses from quests.`],
        ['Life Steal', (player.lifeStealPct || 0) + '%', `Percentage of physical damage returned as life.`],
        ['Mana Steal', (player.manaStealPct || 0) + '%', `Percentage of physical damage returned as mana.`],
        ['Move Speed', Math.round(player.moveSpeed), `Current movement velocity.`],
        ['─ REGEN ─', ''],
        ['Life Regen', (player.lifeRegenPerSec || 0).toFixed(1) + '/s', `Passive life recovery per second.`],
        ['Mana Regen', (player.manaRegenPerSec || 0).toFixed(1) + '/s', `Passive mana recovery per second.`],
        ['─ ADVANCED ─', ''],
        ['Dmg Reduction', (player.pctDmgReduce || 0) + '%', `Percentage reduction to all incoming damage.`],
        ['Flat Dmg Red', (player.flatDmgReduce || 0), `Integer reduction to incoming physical damage.`],
        ['Magic Dmg Red', (player.magicDmgReduce || 0), `Integer reduction to incoming non-physical damage.`],
        ['Thorns', (player.thorns || 0), `Reflects integer damage back to melee attackers.`],
        ['─ FIND ─', ''],
        ['Magic Find', (player.magicFind || 0) + '%', `Chance to find better loot.`],
        ['Gold Find', (player.goldFind || 0) + '%', `Increases gold dropped by enemies.`],
        ['Light Radius', '+' + (player.lightRadius || 0), `Increases your vision range in dark areas.`],
        ['─ DIFFICULTY ─', ''],
        ['Current', DIFFICULTY_NAMES[difficulty], `Current game difficulty level.`],
        ['Resist Penalty', (difficulty === 2 ? '-100%' : (difficulty === 1 ? '-40%' : '0%')), `Resistance reduction from higher difficulty.`],
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

    const openParagon = $('btn-open-paragon');
    if (openParagon) {
        openParagon.addEventListener('click', () => {
            isParagonOpen = true;
            renderParagonPanel();
        });
    }
}

function renderParagonPanel() {
    if (!player) return;
    let modal = $('paragon-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'paragon-modal';
        modal.className = 'premium-modal';
        document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    modal.innerHTML = `
        <div class="modal-content" style="width:400px;background:rgba(15,10,20,0.95);border:2px solid var(--cyan);box-shadow:0 0 20px var(--cyan-dark);">
            <div class="modal-header" style="border-bottom:1px solid var(--cyan-dark);">
                <span style="color:var(--cyan);font-family:Cinzel,serif;letter-spacing:2px;">PARAGON POINTS: ${player.paragonPoints}</span>
                <button class="modal-close" onclick="document.getElementById('paragon-modal').classList.add('hidden'); isParagonOpen=false;">&times;</button>
            </div>
            <div class="modal-body stats-grid" style="padding:15px;max-height:400px;overflow-y:auto;">
                ${['core', 'offense', 'defense', 'utility'].map(cat => `
                    <div class="paragon-category" style="margin-bottom:15px; border:1px solid #333; padding:8px; background:rgba(0,0,0,0.3);">
                        <div style="color:var(--gold);font-size:12px;margin-bottom:5px;border-bottom:1px solid #444;text-transform:uppercase;">${cat}</div>
                        ${Object.keys(player.paragonStats[cat]).map(stat => `
                            <div class="stat-row" style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
                                <span style="font-size:11px;color:#aaa;">${stat.toUpperCase()} (+${player.paragonStats[cat][stat]})</span>
                                <button class="paragon-add-btn" data-cat="${cat}" data-stat="${stat}" ${player.paragonPoints <= 0 ? 'disabled' : ''}>+</button>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
            <div style="padding:10px;text-align:center;font-size:10px;color:#666;font-style:italic;">Gain 1 Paragon Point per Paragon Level (unlimited)</div>
        </div>
    `;

    modal.querySelectorAll('.paragon-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (player.allocateParagonPoint(btn.dataset.cat, btn.dataset.stat)) {
                renderParagonPanel();
                renderCharacterPanel();
            }
        });
    });
}

// ─── INVENTORY ───
// ─── INVENTORY ───
let socketingGemIndex = -1;

function renderInventory() {
    if (!player) return;
    syncInteractionStates();

    // 0. Belt (Phase 30 Finalization)
    const beltGrid = $('belt-grid');
    if (beltGrid) {
        beltGrid.innerHTML = '';
        player.belt.forEach((item, i) => {
            const slot = document.createElement('div');
            slot.className = 'belt-slot';
            slot.innerHTML = item ? getItemHtml(item) : '';
            if (item) {
                const itemEl = slot.querySelector('.inv-item');
                setupTooltip(itemEl, item);
                itemEl.onmousedown = (e) => {
                    if (e.button !== 0) return;
                    const sx = e.clientX, sy = e.clientY;
                    let d = false;
                    const mv = (m) => {
                        if (!d && Math.hypot(m.clientX - sx, m.clientY - sy) > 5) {
                            d = true;
                            startDrag(m, item, 'belt', i);
                            window.removeEventListener('mousemove', mv);
                        }
                    };
                    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
                    window.addEventListener('mousemove', mv);
                    window.addEventListener('mouseup', up);
                };
                itemEl.oncontextmenu = (e) => {
                    e.preventDefault();
                    player.useItem(i, true);
                    renderInventory();
                    updateHud();
                };
            }
            slot.onmouseup = () => handleDrop('belt', i);
            beltGrid.appendChild(slot);
        });
    }

    // 1. Equip Slots (Paper Doll)
    const equipSlots = ['head', 'amulet', 'chest', 'mainhand', 'offhand', 'gloves', 'belt', 'boots', 'ring1', 'ring2'];

    // Update Weapon Set Indicators
    if (player) {
        const w1 = player.activeWeaponSet === 1;
        const main1 = $('wset-main-1'), main2 = $('wset-main-2');
        const off1 = $('wset-off-1'), off2 = $('wset-off-2');
        if (main1) main1.classList.toggle('active', w1);
        if (main2) main2.classList.toggle('active', !w1);
        if (off1) off1.classList.toggle('active', w1);
        if (off2) off2.classList.toggle('active', !w1);
    }

    equipSlots.forEach(s => {
        const el = document.querySelector(`.equip-slot[data-slot="${s}"]`);
        if (!el) return;
        const item = player.equipment[s];
        el.innerHTML = item ? getItemHtml(item) : '';
        el.onmouseup = () => handleDrop('equip', s);

        if (item) {
            const itemEl = el.querySelector('.inv-item');
            setupTooltip(itemEl, item);

            // Left-click to socket / identify / start drag (Threshold-based)
            itemEl.onmousedown = (e) => {
                if (e.button !== 0) return;
                const sx = e.clientX, sy = e.clientY;
                let d = false;
                const mv = (m) => {
                    if (!d && Math.hypot(m.clientX - sx, m.clientY - sy) > 5) {
                        d = true;
                        startDrag(m, item, 'equip', s);
                        window.removeEventListener('mousemove', mv);
                    }
                };
                const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
                window.addEventListener('mousemove', mv);
                window.addEventListener('mouseup', up);
            };

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

                if (isLarzukSocketing) {
                    const maxSockets = {
                        'head': 2, 'chest': 4, 'mainhand': 4, 'offhand': 4
                    };
                    const itemTypeMax = maxSockets[s] || 0;
                    if (itemTypeMax > 0 && (!item.sockets || item.sockets < itemTypeMax)) {
                        player.gold -= 2000;
                        item.sockets = (item.sockets || 0) + 1;
                        if (!item.socketed) item.socketed = [];
                        addCombatLog(`Larzuk punched a socket into ${item.name}!`, 'log-crit');
                    } else {
                        addCombatLog(`${item.name} cannot have any more sockets.`, 'log-dmg');
                    }
                    isLarzukSocketing = false;
                    document.body.style.cursor = 'default';
                    renderInventory();
                    updateHud();
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
    const ig = $('inventory-grid');
    if (!ig) return;

    ig.innerHTML = '';
    const MAX_INV_SLOTS = 40;

    for (let i = 0; i < MAX_INV_SLOTS; i++) {
        const cell = document.createElement('div');
        cell.className = 'inv-slot';
        const item = player.inventory[i];

        // Highlight cell if socketing mode & item is selected
        if (socketingGemIndex === i) {
            cell.style.border = '1px solid var(--gold)';
            cell.style.background = 'rgba(216, 176, 104, 0.2)';
        }

        if (item) {
            const div = document.createElement('div');
            const check = player.canEquip(item);
            div.innerHTML = getItemHtml(item, !check.ok);
            const innerDiv = div.firstChild; // The .inv-item div
            setupTooltip(innerDiv, item);

            // Drag vs Click support (Threshold-based)
            innerDiv.onmousedown = (e) => {
                if (e.button !== 0) return;
                const startX = e.clientX;
                const startY = e.clientY;
                let draggingStarted = false;

                const onMove = (mv) => {
                    if (draggingStarted) return;
                    const dist = Math.hypot(mv.clientX - startX, mv.clientY - startY);
                    if (dist > 5) {
                        draggingStarted = true;
                        startDrag(mv, item, 'inventory', i);
                        // Clean up listeners once drag starts
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                    }
                };

                const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                };

                window.addEventListener('mousemove', onMove, { passive: true });
                window.addEventListener('mouseup', onUp);
            };

            // Handle Item Clicks (Left-click)
            div.addEventListener('click', (e) => {
                // 1. Move to Stash (if open)
                if (!$('panel-stash').classList.contains('hidden')) {
                    const targetStash = currentStashTab === 'personal' ? stash : sharedStash;
                    const emptySlot = targetStash.indexOf(null);
                    if (emptySlot !== -1) {
                        targetStash[emptySlot] = item;
                        player.inventory[i] = null;
                        if (currentStashTab === 'shared') SaveSystem.saveSharedStash(sharedStash, sharedGold);
                        addCombatLog(`Moved ${item.name} to Stash.`, 'log-info');
                        hideTooltip();
                        renderInventory();
                        renderStash();
                        return;
                    } else {
                        addCombatLog('Stash is full!', 'log-dmg');
                        return;
                    }
                }

                // 2. Move to Cube (if open)
                if (!$('panel-cube').classList.contains('hidden')) {
                    const emptySlot = cube.indexOf(null);
                    if (emptySlot !== -1) {
                        cube[emptySlot] = item;
                        player.inventory[i] = null;
                        addCombatLog(`Moved ${item.name} to Cube.`, 'log-info');
                        hideTooltip();
                        renderInventory();
                        renderCube();
                        return;
                    } else {
                        addCombatLog('Cube is full!', 'log-dmg');
                        return;
                    }
                }

                // 3. Special Action Modes
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

                if (isImbuing) {
                    if (item.rarity !== 'normal' || item.type === 'potion' || item.type === 'gem' || item.type === 'scroll') {
                        addCombatLog('Charsi: "I can only imbue normal equipment!"', 'log-dmg');
                        return;
                    }
                    loot.imbueItem(item, player.level);
                    player.hasImbue = false;
                    isImbuing = false;
                    document.body.style.cursor = 'default';
                    addCombatLog(`Charsi: "There! A weapon fit for a hero!"`, 'log-level');
                    playLoot();
                    hideTooltip();
                    renderInventory();
                    return;
                }

                if (isReforging) {
                    if (item.rarity !== 'rare') {
                        addCombatLog('Charsi: "I can only reforge Rare equipment!"', 'log-dmg');
                        return;
                    }
                    player.gold -= 5000;
                    loot.reforgeItem(item, player.level);
                    isReforging = false;
                    document.body.style.cursor = 'default';
                    addCombatLog(`Charsi: "The spirits have blessed your ${item.baseId} with new power!"`, 'log-level');
                    playLoot();
                    hideTooltip();
                    renderInventory();
                    renderCharacterPanel();
                    return;
                }

                if (isLarzukSocketing) {
                    const maxSockets = { 'head': 2, 'chest': 4, 'mainhand': 4, 'offhand': 4, 'shield': 4, 'weapon': 4 };
                    const itemTypeMax = maxSockets[item.slot] || maxSockets[item.type] || 0;
                    if (itemTypeMax > 0 && (!item.sockets || item.sockets < itemTypeMax)) {
                        player.gold -= 2000;
                        item.sockets = (item.sockets || 0) + 1;
                        if (!item.socketed) item.socketed = [];
                        addCombatLog(`Larzuk punched a socket into ${item.name}!`, 'log-crit');
                    } else {
                        addCombatLog(`${item.name} cannot have any more sockets.`, 'log-dmg');
                    }
                    isLarzukSocketing = false;
                    document.body.style.cursor = 'default';
                    renderInventory();
                    updateHud();
                    return;
                }

                if (socketingGemIndex !== -1) {
                    if (socketingGemIndex === i) {
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

                // 4. Default: Equip to Player or Mercenary (Contextual)
                if (!$('panel-mercenary').classList.contains('hidden') && mercenary) {
                    const validSlots = ['head', 'chest', 'mainhand', 'offhand'];
                    if (validSlots.includes(item.slot)) {
                        const old = mercenary.equipment[item.slot];
                        mercenary.equipment[item.slot] = item;
                        player.inventory[i] = old;
                        checkRuneword(item);
                        mercenary._recalcStats();
                        addCombatLog(`Equipped ${item.name} to ${mercenary.name}`, 'log-info');
                        renderInventory();
                        renderMercenaryPanel();
                        return;
                    }
                }

                const res = player.equip(item);
                if (res.success) {
                    player.inventory[i] = res.swapped;
                    addCombatLog(`Equipped ${item.name}.`, 'log-level');
                    bus.emit('item:move');
                    hideTooltip();
                    renderInventory();
                    renderCharacterPanel();
                    updateHud();
                } else if (res.error) {
                    addCombatLog(res.error, 'log-dmg');
                    bus.emit('ui:error');
                }
            });

            // Handle Right-click Actions (contextmenu)
            div.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (socketingGemIndex !== -1) return;

                const shopOpen = !$('panel-shop').classList.contains('hidden');
                const merchantDialogue = dialogue && dialogue.timer > 0 && dialogue.npc && dialogue.npc.type === 'merchant';
                
                // 1. Sell if matching shop or merchant dialog
                if (shopOpen || merchantDialogue) {
                    const price = Math.max(1, typeof calculateSellPrice === 'function' ? calculateSellPrice(item) : 5);
                    player.gold += price;
                    player.inventory[i] = null;
                    addCombatLog(`Sold ${item.name} for ${price} gold.`, 'log-info');
                    hideTooltip();
                    renderInventory();
                    renderCharacterPanel();
                    if (shopOpen && typeof renderShop === 'function') renderShop();
                    playLoot();
                    return;
                }

                // 2. Use Consumables
                if (item.type === 'potion') {
                    const beltIdx = player.belt.indexOf(null);
                    if (beltIdx !== -1) {
                        player.belt[beltIdx] = item;
                        player.inventory[i] = null;
                        addCombatLog(`Added ${item.name} to belt`, 'log-info');
                    } else {
                        addCombatLog('Belt full!', 'log-dmg');
                    }
                    renderInventory();
                    return;
                }

                if (item.type === 'scroll' && item.baseId === 'scroll_identify') {
                    window.isIdentifying = true;
                    syncInteractionStates();
                    document.body.style.cursor = `crosshair`;
                    addCombatLog('Select an item to identify', 'log-info');
                    player.inventory[i] = null;
                    renderInventory();
                    return;
                }

                if (item.type === 'scroll' && item.baseId === 'scroll_town_portal') {
                    if (zoneLevel === 0) {
                        addCombatLog('Cannot cast Town Portal in Town!', 'log-dmg');
                        return;
                    }
                    const tp = new GameObject('portal', player.x, player.y - 40, 'env_water');
                    tp.targetZone = 0;
                    portalReturnZone = zoneLevel;
                    gameObjects.push(tp);
                    if (window.fx) window.fx.emitBurst(tp.x, tp.y, '#30ccff', 50, 4);
                    addCombatLog('A Town Portal has opened.', 'log-level');
                    player.inventory[i] = null;
                    renderInventory();
                    return;
                }

                if (item.type === 'tome') {
                    const scrollType = item.baseId === 'tome_tp' ? 'scroll_town_portal' : 'scroll_identify';
                    const scrollIdx = player.inventory.findIndex(it => it && it.baseId === scrollType);
                    if (scrollIdx !== -1) {
                        item.charges = Math.min(item.maxCharges || 20, (item.charges || 0) + 1);
                        player.inventory[scrollIdx] = null;
                        addCombatLog(`Added scroll to ${item.name}.`, 'log-info');
                        playLoot();
                    } else if ((item.charges || 0) > 0) {
                        if (item.baseId === 'tome_tp') {
                            if (zoneLevel === 0) { addCombatLog('Cannot cast in Town!', 'log-dmg'); return; }
                            const tp = new GameObject('portal', player.x, player.y - 40, 'env_water');
                            tp.targetZone = 0; portalReturnZone = zoneLevel;
                            gameObjects.push(tp);
                            if (window.fx) window.fx.emitBurst(tp.x, tp.y, '#30ccff', 50, 4);
                            addCombatLog('Town Portal Opened!', 'log-level');
                        } else {
                            window.isIdentifying = true;
                            document.body.style.cursor = 'crosshair';
                            addCombatLog('Select an item to identify', 'log-info');
                        }
                        item.charges--;
                    } else {
                        addCombatLog(`${item.name} is empty!`, 'log-dmg');
                    }
                    renderInventory();
                    return;
                }

                if (item.id === 'book_of_skill') {
                    player.talents.unspent++;
                    player.inventory[i] = null;
                    addCombatLog('Used Book of Skill: +1 Skill Point gained!', 'log-level');
                    if (window.fx) window.fx.emitLevelUp(player.x, player.y);
                    renderInventory();
                    updateHud();
                    return;
                }

                if (item.type === 'gem') {
                    socketingGemIndex = i;
                    syncInteractionStates();
                    document.body.style.cursor = `url('assets/item_amulet.png'), crosshair`;
                    addCombatLog(`Select an item to socket ${item.name} into`, 'log-info');
                    renderInventory();
                    return;
                }

                // 3. Default: Drop
                const drop = { ...item };
                drop.x = player.x + (Math.random() - 0.5) * 32;
                drop.y = player.y + (Math.random() - 0.5) * 32;
                droppedItems.push(drop);
                addCombatLog(`Dropped ${item.name}`);
                player.inventory[i] = null;
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
        cell.onmouseup = () => handleDrop('inventory', i);
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
    let html = itemTooltipText(item);

    // Item comparison logic
    if (player && item.slot && item.slot !== 'none' && item.identified !== false) {
        const mercPanelOpen = !$('panel-mercenary').classList.contains('hidden');
        const targetEntity = (mercPanelOpen && mercenary) ? mercenary : player;

        // Find if we have an item equipped in this slot
        let equippedItem = null;
        if (item.slot === 'ring') {
            equippedItem = targetEntity.equipment['ring1'] || targetEntity.equipment['ring2'];
        } else {
            equippedItem = targetEntity.equipment[item.slot];
        }

        // Make sure we aren't hovering the equipped item itself
        if (equippedItem && equippedItem !== item) {
            const equippedHtml = itemTooltipText(equippedItem, true);
            html = `<div class="tooltip-compare-container">${html}${equippedHtml}</div>`;
        }
    }

    tt.innerHTML = html;
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

function itemTooltipText(item, isComparison = false) {
    const colors = {
        normal: '#fff',
        magic: '#4850b8',
        rare: '#ffff00',
        set: '#00ff00',
        unique: '#bf642f'
    };
    const c = (item.identified === false) ? '#888' :
        ((item.rarity === 'normal' && item.sockets > 0) ? '#999' : (colors[item.rarity] || '#fff'));

    let t = `<div class="tooltip-inner" style="color:${c}; ${isComparison ? 'border-color: #444; opacity: 0.9;' : ''}">`;
    if (isComparison) t += `<div style="font-size:10px; color:#aaa; text-align:center; margin-bottom:4px;">— EQUIPPED —</div>`;

    t += `<div class="tooltip-name">${item.identified === false ? 'Unidentified ' + (items[item.baseId]?.name || 'Item') : (item.name || items[item.baseId]?.name || 'Unknown Item')}</div>`;

    // Force gems/runes to be identified in tooltip always
    const skipID = (item.type === 'gem' || item.type === 'rune' || item.type === 'charm' || item.type === 'potion');

    if (item.identified === false && !skipID) {
        t += `<div class="tooltip-rarity" style="color:#666;">— Unknown Potential —</div>`;
        t += `<div class="tooltip-stats" style="color:#666; font-style:italic;">Use a Scroll of Identification to reveal this item's powers.</div>`;
        t += `<div class="tooltip-footer">[Left-Click: Equip / Move to Stash] | [Right-Click: Drop / Sell]</div>`;
        t += `</div>`;
        return t;
    }

    if (item.rarity && item.rarity !== 'normal' && typeof item.rarity === 'string') {
        const rarityLabel = item.rarity === 'set' ? (item.setName || "SET ITEM") : item.rarity.toUpperCase();
        t += `<div class="tooltip-rarity">— ${rarityLabel} —</div>`;
    }

    // Item Tier
    const tier = item.ilvl >= 50 ? 'Elite' : (item.ilvl >= 25 ? 'Exceptional' : 'Normal');
    t += `<div style="font-size:10px; color:#888; text-align:center; margin-bottom:4px;">${tier} Tier</div>`;

    const friendlyNames = {
        flatSTR: 'Strength', flatDEX: 'Dexterity', flatVIT: 'Vitality', flatINT: 'Intellect',
        flatHP: 'Life', flatMP: 'Mana', pctHP: 'Enhanced Life', pctMP: 'Enhanced Mana',
        flatArmor: 'Defense', pctArmor: 'Enhanced Defense',
        pctDmg: 'Enhanced Damage', flatMinDmg: 'Minimum Damage', flatMaxDmg: 'Maximum Damage',
        fireRes: 'Fire Resist', coldRes: 'Cold Resist', lightRes: 'Lightning Resist', poisRes: 'Poison Resist',
        allRes: 'All Resistances', critChance: 'Critical Strike Chance', critMulti: 'Critical Damage',
        lifeStealPct: 'Life Stolen per Hit', manaStealPct: 'Mana Stolen per Hit', pctMoveSpeed: 'Faster Run/Walk',
        lifeRegenPerSec: 'Life Replenish', manaRegenPerSec: 'Mana Regen', magicFind: 'Magic Find', goldFind: 'Gold Find',
        pctFireDmg: 'Fire Skill Damage', pctColdDmg: 'Cold Skill Damage', pctLightDmg: 'Lightning Skill Damage',
        pctPoisonDmg: 'Poison Skill Damage', pctShadowDmg: 'Shadow Skill Damage', pctHolyDmg: 'Holy Skill Damage',
        blockChance: 'Chance to Block', pctIAS: 'Increased Attack Speed',
        pctDmgReduce: 'Damage Reduced', flatDmgReduce: 'Damage Reduced',
        magicDmgReduce: 'Magic Damage Reduced', thorns: 'Attacker Takes Damage',
        poisonDmgPerSec: 'Poison Damage Over 3 Seconds', pctAtkRating: 'Attack Rating',
        sockets: 'Sockets',
    };

    // Comparison Helper
    let compareItem = null;
    if (!isComparison) {
        const mercPanelOpen = !$('panel-mercenary').classList.contains('hidden');
        const targetEntity = (mercPanelOpen && mercenary) ? mercenary : player;
        if (item.slot === 'ring') compareItem = targetEntity.equipment['ring1'] || targetEntity.equipment['ring2'];
        else compareItem = targetEntity.equipment[item.slot];
        if (compareItem === item) compareItem = null;
    }

    const getCompareColor = (val, equippedVal, inverse = false) => {
        if (isComparison || !compareItem || equippedVal === undefined) return '#fff';
        if (val === equippedVal) return '#fff';
        const isBetter = inverse ? (val < equippedVal) : (val > equippedVal);
        return isBetter ? '#4caf50' : '#f44336';
    };

    const getDiffText = (val, equippedVal, inverse = false) => {
        if (isComparison || !compareItem || equippedVal === undefined) return '';
        const diff = val - equippedVal;
        if (diff === 0) return '';
        const color = (inverse ? diff < 0 : diff > 0) ? '#4caf50' : '#f44336';
        return ` <span style="color:${color}; font-size:9px;">(${diff > 0 ? '+' : ''}${diff})</span>`;
    };

    t += `<div class="tooltip-stats" style="color:#fff;">`;
    if (item.minDmg) {
        const avg = (item.minDmg + item.maxDmg) / 2;
        const compAvg = compareItem ? (compareItem.minDmg + compareItem.maxDmg) / 2 : avg;
        t += `<div style="color:${getCompareColor(avg, compAvg)}">Damage: ${item.minDmg}–${item.maxDmg}${getDiffText(avg, compAvg)}</div>`;
    }
    if (item.armor) t += `<div style="color:${getCompareColor(item.armor, compareItem?.armor)}">Armor: ${item.armor}${getDiffText(item.armor, compareItem?.armor)}</div>`;
    if (item.block) t += `<div style="color:${getCompareColor(item.block, compareItem?.block)}">Block: ${item.block}%${getDiffText(item.block, compareItem?.block)}</div>`;
    if (item.atkSpd && item.atkSpd !== 1) t += `<div>Attack Speed: ${item.atkSpd.toFixed(2)}</div>`;

    if (item.type === 'tome') {
        t += `<div style="color:var(--gold);">Charges: ${item.charges || 0} / ${item.maxCharges || 20}</div>`;
    }

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
            let val = mod.value > 0 ? `+${mod.value}` : `${mod.value}`;
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
            } else if (statName.startsWith('+')) {
                // For cases like "+10 Strength" where stat is "+flatSTR"
                statName = statName.substring(1);
                statName = fLabels[statName] || statName.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
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

    // Comparison logic
    if (!isComparison && (state === 'INVENTORY' || state === 'STASH' || state === 'VENDOR')) {
        const slot = item.slot;
        const equippedItem = player.equipment[slot] || (slot === 'ring1' ? player.equipment.ring2 : null);

        if (equippedItem && equippedItem !== item) {
            const getDiff = (stat) => {
                const cur = (item.mods?.find(m => m.stat === stat)?.value || 0) + (item[stat] || 0);
                const old = (equippedItem.mods?.find(m => m.stat === stat)?.value || 0) + (equippedItem[stat] || 0);
                const diff = cur - old;
                if (diff === 0) return '';
                const color = diff > 0 ? '#4caf50' : '#f44336';
                return `<span style="color:${color}; font-size:10px; margin-left:5px;">(${diff > 0 ? '+' : ''}${diff})</span>`;
            };

            const dmgDiff = (item.maxDmg || 0) - (equippedItem.maxDmg || 0);
            const armDiff = (item.armor || 0) - (equippedItem.armor || 0);

            if (dmgDiff !== 0) t = t.replace(`${item.maxDmg} Damage`, `${item.maxDmg} Damage <span style="color:${dmgDiff > 0 ? '#4caf50' : '#f44336'}">(${dmgDiff > 0 ? '+' : ''}${dmgDiff})</span>`);
            if (armDiff !== 0) t = t.replace(`${item.armor} Defense`, `${item.armor} Defense <span style="color:${armDiff > 0 ? '#4caf50' : '#f44336'}">(${armDiff > 0 ? '+' : ''}${armDiff})</span>`);
        }
    }

    t += `<div class="tooltip-footer">[Left-Click: Equip / Move to open panel] | [Right-Click: Sell / Drop / Use]</div>`;
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

    // --- Phase 3.1: NPC Portrait Support ---
    const portrait = document.createElement('div');
    portrait.style.cssText = `
        width: 100%; height: 120px; margin-bottom: 15px; 
        background: url('assets/npc_portrait_${npc.id}.png'), url('assets/npc_portrait_generic.png');
        background-size: cover; background-position: center;
        border: 1px solid #4a3520; box-shadow: inset 0 0 10px #000;
        mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
    `;
    menu.appendChild(portrait);

    const options = [
        { label: 'Trade', action: () => { openShop(); menu.remove(); activeDialogueNpc = null; } },
        {
            label: 'Talk', action: () => {
                const questOffered = offerQuest(npc.id);
                if (!questOffered) {
                    dialogue = { text: `${npc.name}: "${npc.dialogue}"`, timer: 6, npc: npc };
                    addCombatLog(dialogue.text, 'log-info');
                }
                menu.remove();
                activeDialogueNpc = null;
            }
        }
    ];

    // Priority: If quest is available or ready to turn in, add the 'Quest' button
    const hasQuestAction = QUEST_POOL.some(q => q.giver === npc.id && !completedQuests.has(q.id));
    if (hasQuestAction) {
        options.unshift({
            label: 'Quest', action: () => {
                offerQuest(npc.id);
                menu.remove();
                activeDialogueNpc = null;
            }
        });
    }

    // Special: Gamble (Gheed)
    if (npc.id === 'gheed') {
        options.push({ label: 'Gamble', action: () => { openGambleShop(); menu.remove(); activeDialogueNpc = null; } });
    }

    // Special: Imbue (Charsi)
    if (npc.id === 'charsi' && player.hasImbue) {
        options.push({
            label: 'Imbue Item', action: () => {
                addCombatLog('Select an item in your inventory to Imbue (Transform to Rare).', 'log-info');
                isImbuing = true; // Need to handle click in renderInventory
                menu.remove();
                activeDialogueNpc = null;
            }
        });
    }

    // Special: Reforge (Phase 22: Charsi)
    if (npc.id === 'charsi') {
        options.push({
            label: 'Forge Equipment (5 Fragments)', action: () => {
                renderCraftingMenu();
                if (menu) menu.remove();
                activeDialogueNpc = null;
            }
        });
        options.push({
            label: 'Reforge Rare (5000g)', action: () => {
                if (player.gold < 5000) { addCombatLog('Not enough gold!', 'log-dmg'); return; }
                addCombatLog('Select a Rare item in your inventory to Reforge (Reroll Affixes).', 'log-info');
                isReforging = true;
                menu.remove();
                activeDialogueNpc = null;
            }
        });
    }

    // Special: Hire / Revive (Kashya, Greiz, Asheara, Tyrael)
    const mercCaptains = { 'kashya': 'Rogue', 'greiz': 'Desert Warrior', 'asheara': 'Iron Wolf', 'tyrael': 'Desert Warrior' };
    if (mercCaptains[npc.id]) {
        const type = mercCaptains[npc.id];
        const isDead = mercenary && mercenary.hp <= 0;
        const mercName = mercenary ? mercenary.name : 'Mercenary';
        options.push({
            label: isDead ? `Revive ${mercName} (200g)` : `Hire ${type} (500g)`, action: () => {
                hireMercenary(type);
                menu.remove();
                activeDialogueNpc = null;
            }
        });
    }

    // Special: Anya Quest
    if (npc.id === 'anya') {
        const q = activeQuests.find(aq => aq.id === 'prison_of_ice');
        if (q && !player.hasAnyaReward) {
            options.push({
                label: 'Rescue Anya', action: () => {
                    q.progress = q.target;
                    player.hasAnyaReward = true;
                    player.permanentResists = (player.permanentResists || 0) + 10;
                    player._recalcStats();
                    addCombatLog('You have rescued Anya! Permanent +10 Resistances gained.', 'log-unique');
                    menu.remove();
                    activeDialogueNpc = null;
                    updateHud();
                }
            });
        }
    }

    // Special: Socket (Larzuk)
    if (npc.id === 'larzuk') {
        // Remove Trade for Larzuk
        const tradeIdx = options.findIndex(o => o.label === 'Trade');
        if (tradeIdx >= 0) options.splice(tradeIdx, 1);

        options.push({
            label: 'Add Socket (2000g)', action: () => {
                if (player.gold >= 2000) {
                    isLarzukSocketing = true;
                    togglePanel('inventory');
                    document.body.style.cursor = 'crosshair';
                    addCombatLog('Select an item to add a socket to.', 'log-info');
                } else {
                    addCombatLog('Not enough gold! (2000g needed)', 'log-dmg');
                }
                menu.remove();
                activeDialogueNpc = null;
            }
        });
    }

    // Special: Healer Services (Akara, Jamella, Malah, Fara)
    if (['akara', 'jamella', 'malah', 'fara'].includes(npc.id)) {
        options.push({
            label: 'Heal & Refill', action: () => {
                player.hp = player.maxHp;
                player.mp = player.maxMp;
                if (mercenary) mercenary.hp = mercenary.maxHp;
                addCombatLog(`${npc.name} has restored your health and mana.`, 'log-heal');
                fx.emitBurst(player.x, player.y, '#4caf50', 20, 2);
                updateHud();
                menu.remove();
                activeDialogueNpc = null;
            }
        });
    }

    // Akara Reset (Stay as Akara only)
    if (npc.id === 'akara') {
        options.push({
            label: 'Reset Stats/Skills (500g)', action: () => {
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
            }
        });
    }

    // Special: Identify All (Deckard Cain Speciality)
    if (npc.id === 'deckard_cain') {
        options.push({
            label: 'Identify All (100g)', action: () => {
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
        }
    });
}

    // --- Phase 30: Pantheon Monument ---
    if (npc.id === 'pantheon_monument') {
        // Clear default options for the monument
        options.length = 0;
        options.push({
            label: 'View Legacies',
            action: () => {
                renderPantheonList();
                if (menu) menu.remove();
                activeDialogueNpc = null;
            }
        });
        options.push({
            label: 'Touch the Stone', action: () => {
                fx.emitHeal(player.x, player.y);
                addCombatLog('A cold chill runs down your spine as you touch the ancient stone.', 'log-info');
                if (menu) menu.remove();
                activeDialogueNpc = null;
            }
        });
        options.push({ label: 'Leave', action: () => { if (menu) menu.remove(); activeDialogueNpc = null; } });
    }

    // Special: Warriv Waypoint Travel
    if (npc.id === 'warriv') {
        const wpZones = [...discoveredWaypoints].sort((a, b) => a - b);
        wpZones.forEach(wz => {
            if (wz === zoneLevel) return;
            options.push({
                label: `Travel: ${ZONE_NAMES[wz] || 'Unknown Area'}`,
                action: () => {
                    nextZone(wz);
                    menu.remove();
                    activeDialogueNpc = null;
                }
            });
        });
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

function renderWaypointMenu(obj) {
    activeWaypointObj = obj;
    const existing = document.getElementById('dialogue-picker');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'dialogue-picker';
    menu.className = 'dialogue-picker-menu';

    // Position near waypoint
    const screen = camera.toScreen(obj.x, obj.y);
    menu.style.cssText = `
        position: absolute; left: ${screen.x - 110}px; top: ${screen.y - 180}px; width: 220px;
        background: rgba(10, 8, 5, 0.95); border: 1px solid #bf642f;
        padding: 15px; z-index: 1000; font-family: 'Cinzel', serif;
        box-shadow: 0 10px 40px rgba(0,0,0,0.9), inset 0 0 15px rgba(186, 145, 88, 0.1);
        pointer-events: all; border-radius: 8px;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'color: #ffd700; font-size: 16px; margin-bottom: 12px; border-bottom: 1px solid #4a3520; padding-bottom: 6px; text-align: center;';
    title.textContent = 'WAYPOINT TRAVEL';
    menu.appendChild(title);

    const scrollArea = document.createElement('div');
    scrollArea.style.cssText = 'max-height: 250px; overflow-y: auto; padding-right: 5px;';

    const acts = [
        { name: 'ACT I', range: [0, 5] },
        { name: 'ACT II', range: [6, 10] },
        { name: 'ACT III', range: [11, 15] },
        { name: 'ACT IV', range: [16, 20] },
        { name: 'ACT V', range: [21, 25] },
        { name: 'RIFT', range: [26, 1000] }
    ];

    const wpZones = [...discoveredWaypoints].sort((a, b) => a - b);

    acts.forEach(act => {
        const discoveredInAct = wpZones.filter(wz => wz >= act.range[0] && wz <= act.range[1]);
        if (discoveredInAct.length === 0) return;

        const header = document.createElement('div');
        header.style.cssText = 'color: #888; font-size: 10px; margin: 8px 0 4px; border-bottom: 1px solid #333;';
        header.textContent = act.name;
        scrollArea.appendChild(header);

        discoveredInAct.forEach(wz => {
            if (wz === zoneLevel) return;
            const btn = document.createElement('div');
            btn.className = 'dialogue-option';
            btn.style.cssText = 'color: #d8b068; cursor: pointer; padding: 8px; margin: 2px 0; text-align: left; transition: all 0.2s; font-size: 12px; background: rgba(191,100,47,0.05); border: 1px solid transparent;';
            btn.onmouseover = () => { btn.style.color = '#fff'; btn.style.background = 'rgba(191,100,47,0.2)'; btn.style.borderColor = '#bf642f'; };
            btn.onmouseout = () => { btn.style.color = '#d8b068'; btn.style.background = 'rgba(191,100,47,0.05)'; btn.style.borderColor = 'transparent'; };
            btn.textContent = `⚡ ${ZONE_NAMES[wz] || 'Area ' + wz}`;
            btn.onclick = () => {
                addCombatLog(`Teleporting to ${ZONE_NAMES[wz] || 'Area ' + wz}...`, 'log-level');
                nextZone(wz);
                menu.remove();
                activeWaypointObj = null;
            };
            scrollArea.appendChild(btn);
        });
    });

    menu.appendChild(scrollArea);

    const cancelBtn = document.createElement('div');
    cancelBtn.className = 'dialogue-option';
    cancelBtn.style.cssText = 'color: #888; cursor: pointer; padding: 10px; margin: 4px 0; text-align: center; font-size: 12px;';
    cancelBtn.textContent = 'CLOSE';
    cancelBtn.onclick = () => { menu.remove(); activeWaypointObj = null; };
    menu.appendChild(cancelBtn);

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

let currentStashTab = 'personal';
let sharedStashData = SaveSystem.getSharedStash();
let sharedStash = sharedStashData.items;
let sharedGold = sharedStashData.gold;

function renderShop() {
    const container = $('shop-items');
    container.innerHTML = '';
    $('shop-gold').innerHTML = `Your Gold: <span style="color:var(--gold)">${player.gold}</span><div style="font-size:11px;color:#888;margin-top:4px;">(Click items in your Inventory to Sell them!)</div>`;

    // Repair All Service
    const repairCost = Object.values(player.equipment).reduce((acc, it) => {
        if (it && it.durability < it.maxDurability) {
            return acc + Math.ceil((it.maxDurability - it.durability) * 2);
        }
        return acc;
    }, 0);

    const repairRow = document.createElement('div');
    repairRow.style.cssText = `padding:8px; margin: 4px 0; border:1px solid ${repairCost > 0 ? '#4caf50' : '#333'}; background:${repairCost > 0 ? '#1a2a1a' : '#111'}; border-radius:4px; text-align:center; cursor:${repairCost > 0 ? 'pointer' : 'default'}; font-family:Cinzel,serif; color:${repairCost > 0 ? '#4caf50' : '#666'};`;
    repairRow.innerHTML = `🛠️ Repair All Gear (${repairCost}g)`;
    if (repairCost > 0) {
        repairRow.onclick = () => {
            if (player.gold >= repairCost) {
                player.gold -= repairCost;
                Object.values(player.equipment).forEach(it => { if (it) it.durability = it.maxDurability; });
                addCombatLog(`Gear repaired for ${repairCost} gold.`, 'log-heal');
                renderShop();
                renderCharacterPanel();
            } else {
                addCombatLog('Not enough gold to repair!', 'log-dmg');
            }
        };
    }
    container.appendChild(repairRow);

    // Refill Tomes Service
    let totalRefillCost = 0;
    player.inventory.forEach(it => {
        if (it && it.type === 'tome') {
            totalRefillCost += ((it.maxCharges || 20) - (it.charges || 0)) * 5; // 5g per charge
        }
    });

    const refillRow = document.createElement('div');
    refillRow.style.cssText = `padding:8px; margin: 4px 0; border:1px solid ${totalRefillCost > 0 ? '#30ccff' : '#333'}; background:${totalRefillCost > 0 ? '#0a1a2a' : '#111'}; border-radius:4px; text-align:center; cursor:${totalRefillCost > 0 ? 'pointer' : 'default'}; font-family:Cinzel,serif; color:${totalRefillCost > 0 ? '#30ccff' : '#666'};`;
    refillRow.innerHTML = `📖 Refill All Tomes (${totalRefillCost}g)`;
    if (totalRefillCost > 0) {
        refillRow.onclick = () => {
            if (player.gold >= totalRefillCost) {
                player.gold -= totalRefillCost;
                player.inventory.forEach(it => { if (it && it.type === 'tome') it.charges = it.maxCharges || 20; });
                addCombatLog(`Tomes refilled for ${totalRefillCost} gold.`, 'log-info');
                renderShop();
                renderInventory();
            } else {
                addCombatLog('Not enough gold!', 'log-dmg');
            }
        };
    }
    container.appendChild(refillRow);

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

    const shopInventory = [
        { ...items.health_potion, price: 25 },
        { ...items.mana_potion, price: 25 },
        { ...items.rejuv_potion, price: 75 },
        { ...items.scroll_identify, price: 100 },
        { ...items.scroll_town_portal, price: 100 },
        { ...items.tome_tp, price: 500 },
        { ...items.tome_identify, price: 500 },
    ];

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

        row.querySelector('.tooltip-trigger').addEventListener('mouseenter', e => showTooltip(item, e.clientX, e.clientY));
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

    const items = currentStashTab === 'personal' ? stash : sharedStash;

    for (let i = 0; i < items.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'inv-slot';
        const item = items[i];

        if (item) {
            const div = document.createElement('div');
            div.innerHTML = getItemHtml(item);
            const innerDiv = div.firstChild;
            setupTooltip(innerDiv, item);

            // Drag support (Threshold-based)
            innerDiv.onmousedown = (e) => {
                if (e.button !== 0) return;
                const sx = e.clientX, sy = e.clientY;
                let d = false;
                const mv = (m) => {
                    if (!d && Math.hypot(m.clientX - sx, m.clientY - sy) > 5) {
                        d = true;
                        startDrag(m, item, 'stash', i);
                        window.removeEventListener('mousemove', mv);
                    }
                };
                const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
                window.addEventListener('mousemove', mv);
                window.addEventListener('mouseup', up);
            };

            const moveToInv = (e) => {
                e.preventDefault();
                const empty = player.inventory.indexOf(null);
                if (empty !== -1) {
                    player.inventory[empty] = item;
                    const itemsArr = currentStashTab === 'personal' ? stash : sharedStash;
                    itemsArr[i] = null;
                    if (currentStashTab === 'shared') SaveSystem.saveSharedStash(sharedStash, sharedGold);
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
        }
        cell.onmouseup = () => handleDrop('stash', i);
        grid.appendChild(cell);
    }

    // Update Gold
    $('stash-gold-val').textContent = sharedGold;
}

// Wire Stash Tabs
$('btn-stash-personal')?.addEventListener('click', () => {
    bus.emit('ui:click');
    currentStashTab = 'personal';
    $('btn-stash-personal').classList.add('active');
    $('btn-stash-shared').classList.remove('active');
    renderStash();
});
$('btn-stash-shared')?.addEventListener('click', () => {
    bus.emit('ui:click');
    currentStashTab = 'shared';
    $('btn-stash-shared').classList.add('active');
    $('btn-stash-personal').classList.remove('active');
    renderStash();
});

// Wire Gold Buttons
$('btn-stash-deposit')?.addEventListener('click', () => {
    const amt = player.gold;
    if (amt > 0) {
        bus.emit('ui:click');
        sharedGold += amt;
        player.gold = 0;
        SaveSystem.saveSharedStash(sharedStash, sharedGold);
        renderStash();
        updateHud();
        addCombatLog(`Deposited ${amt} gold into global bank.`, 'log-heal');
    }
});

$('btn-stash-withdraw')?.addEventListener('click', () => {
    if (sharedGold > 0) {
        bus.emit('ui:click');
        bus.emit('gold:pickup');
        const toTake = sharedGold;
        player.gold += toTake;
        sharedGold = 0;
        SaveSystem.saveSharedStash(sharedStash, sharedGold);
        renderStash();
        updateHud();
        addCombatLog(`Withdrew ${toTake} gold from global bank.`, 'log-info');
    }
});

function sortStash() {
    const items = currentStashTab === 'personal' ? stash : sharedStash;
    const itemsRef = items.filter(it => it !== null);

    const rarityWeights = { unique: 10, set: 9, rare: 8, magic: 7, normal: 6 };
    const typeWeights = { weapon: 10, armor: 9, helm: 8, shield: 7, gloves: 6, boots: 5, belt: 4, amulet: 3, ring: 2, charm: 1, gem: 0, rune: 0, scroll: 0, potion: 0 };

    itemsRef.sort((a, b) => {
        const ta = typeWeights[a.type] || -1;
        const tb = typeWeights[b.type] || -1;
        if (ta !== tb) return tb - ta;

        const ra = rarityWeights[a.rarity] || 0;
        const rb = rarityWeights[b.rarity] || 0;
        if (ra !== rb) return rb - ra;

        if (a.baseId !== b.baseId) return (a.baseId || "").localeCompare(b.baseId || "");
        return (b.quantity || 1) - (a.quantity || 1) || (b.ilvl || 0) - (a.ilvl || 0);
    });

    // Replace contents of original array
    items.fill(null);
    itemsRef.forEach((it, i) => items[i] = it);

    if (currentStashTab === 'shared') SaveSystem.saveSharedStash(sharedStash, sharedGold);
}

function sellAllJunk() {
    if (!player) return;
    bus.emit('ui:click');
    let totalSold = 0;
    let goldEarned = 0;

    for (let i = 0; i < player.inventory.length; i++) {
        const item = player.inventory[i];
        // Junk: normal rarity equipment (not runes/gems/potions)
        if (item && item.rarity === 'normal' && !['potion', 'scroll', 'gem', 'rune'].includes(item.type)) {
            const price = Math.max(1, Math.floor(item.ilvl * 0.5));
            player.gold += price;
            player.totalGoldCollected += price;
            goldEarned += price;
            player.inventory[i] = null;
            totalSold++;
        }
    }

    if (totalSold > 0) {
        bus.emit('gold:pickup');
        addCombatLog(`Sold ${totalSold} items for ${goldEarned} gold.`, 'log-info');
        renderInventory();
        updateHud();
    } else {
        addCombatLog("No junk items found to sell.", "log-dmg");
    }
}

$('btn-sort-stash')?.addEventListener('click', () => {
    const target = (currentStashTab === 'personal') ? stash : sharedStash;
    sortArray(target);
    renderStash();
    addCombatLog('Stash Sorted', 'log-info');
});

function sortArray(arr) {
    const items = arr.filter(i => i !== null);
    const typeWeights = { weapon: 10, armor: 9, helm: 8, shield: 7, gloves: 6, boots: 5, belt: 4, amulet: 3, ring: 2, charm: 1, gem: 0, rune: 0, scroll: 0, potion: 0 };
    const rarityWeights = { unique: 4, set: 3, rare: 2, magic: 1, common: 0 };

    items.sort((a, b) => {
        if (typeWeights[a.type] !== typeWeights[b.type]) return typeWeights[b.type] - typeWeights[a.type];
        const ra = rarityWeights[a.rarity] || 0;
        const rb = rarityWeights[b.rarity] || 0;
        if (ra !== rb) return rb - ra;
        return a.baseId.localeCompare(b.baseId);
    });

    for (let i = 0; i < arr.length; i++) {
        arr[i] = items[i] || null;
    }
}



function renderCube() {
    const grid = $('cube-grid');
    if (!grid) return;
    grid.innerHTML = '';

    let itemsInCube = [];
    for (let i = 0; i < cube.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'inv-slot';
        const item = cube[i];

        if (item) {
            itemsInCube.push(item);
            const div = document.createElement('div');
            div.innerHTML = getItemHtml(item);
            const innerDiv = div.firstChild;
            setupTooltip(innerDiv, item);

            // Drag support (Threshold-based)
            innerDiv.onmousedown = (e) => {
                if (e.button !== 0) return;
                const sx = e.clientX, sy = e.clientY;
                let d = false;
                const mv = (m) => {
                    if (!d && Math.hypot(m.clientX - sx, m.clientY - sy) > 5) {
                        d = true;
                        startDrag(m, item, 'cube', i);
                        window.removeEventListener('mousemove', mv);
                    }
                };
                const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
                window.addEventListener('mousemove', mv);
                window.addEventListener('mouseup', up);
            };

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
        cell.onmouseup = () => handleDrop('cube', i);
        grid.appendChild(cell);
    }

    // Auto-detect recipes
    checkCubeRecipe(itemsInCube);
}

function checkCubeRecipe(items) {
    const btn = $('btn-transmute');
    if (!btn) return;

    btn.classList.remove('btn-ready');
    btn.textContent = 'Transmute';

    if (items.length === 3) {
        const id1 = items[0].baseId;
        const allSame = items.every(it => it.baseId === id1 && (it.type === 'gem' || it.type === 'rune'));

        if (allSame) {
            btn.classList.add('btn-ready');
            btn.textContent = 'UPGRADE ARTIFACTS';
        }
    } else if (items.length === 1 && items[0].id === 'hellfire_key_set') {
        btn.classList.add('btn-ready');
        btn.textContent = 'OPEN PANDEMONIUM PORTAL';
    } else if (items.length === 1 && items[0].id === 'item_cow_portal') {
        btn.classList.add('btn-ready');
        btn.textContent = 'OPEN SECRET COW LEVEL';
    }
}

$('btn-transmute')?.addEventListener('click', () => {
    const resultItem = loot.transmuteCube(cube);

    if (resultItem) {
        bus.emit('cube:transmute');
        // Phase 27: Uber Portal Logic
        if (resultItem.id === 'hellfire_key_set') {
            addCombatLog('The sky darkens... A portal to Uber Tristram has opened!', 'log-crit');
            const portal = new GameObject('uber_portal', player.x, player.y - 40, 'env_water');
            portal.targetZone = 100; // Uber Tristram
            gameObjects.push(portal);

            // Clear keys
            cube.forEach((it, idx) => { if (it && it.id === 'hellfire_key') cube[idx] = null; });
            renderCube();
            return;
        }

        if (resultItem.id === 'item_cow_portal') {
            if (zoneLevel > 0) {
                addCombatLog("Moo Moo Moo... A portal to the Secret Cow Level has opened!", 'log-unique');
                const portal = new GameObject('cow_portal', player.x, player.y - 40, 'env_water');
                portal.targetZone = 99; // Moo Moo Farm
                gameObjects.push(portal);
                
                // Consume specific ingredients
                cube.forEach((it, idx) => {
                    if (it && (it.baseId === 'wirts_leg' || it.baseId === 'tome_tp')) {
                        cube[idx] = null;
                    }
                });
                renderCube();
            } else {
                addCombatLog("Cannot open the portal in town!", 'log-dmg');
            }
            return;
        }

        addCombatLog(`Transmutation Successful! Crafted: ${resultItem.name}`, 'log-crit');
        // Clear all non-null items that were used in the recipe
        cube.forEach((item, index) => {
            if (item) cube[index] = null;
        });
        cube[0] = resultItem;
        renderCube();
    } else {
        addCombatLog('Transmutation Failed. Invalid Horadric Recipe.', 'log-dmg');
    }
});

// ─── QUEST SYSTEM ───
const ACT_1_QUESTS = {
    'den_of_evil': {
        id: 'den_of_evil',
        name: 'Den of Evil',
        desc: 'Clear the Den of Evil (Blood Moor). Slay 20 enemies.',
        target: 20,
        giver: 'akara',
        goldReward: 500,
        xpReward: 500,
        skillReward: 1,
        intro: "Akara: 'There is a place of great evil in the Blood Moor. My scouts tell me it is filled with foul creatures. Purge the coven, and I shall grant you a boon of power.'"
    },
    'blood_raven': {
        id: 'blood_raven',
        name: 'Sisters\' Burial Grounds',
        desc: 'Defeat Blood Raven in the Burial Grounds (Zone 3).',
        target: 1,
        giver: 'kashya',
        goldReward: 1000,
        xpReward: 1500,
        mercenaryReward: true,
        bossOnly: true,
        intro: "Kashya: 'My best scout, Blood Raven, has fallen to the shadow. She now desecrates our sacred burial grounds. Put her soul to rest, and my sisters shall follow you into battle.'"
    },
    'forgotten_tower': {
        id: 'forgotten_tower',
        name: 'The Forgotten Tower',
        desc: 'Find the countess and her hoard in the Tower (Zone 4).',
        target: 1,
        giver: 'deckard_cain',
        goldReward: 5000,
        xpReward: 3000,
        bossOnly: true,
        intro: "Deckard Cain: 'Ancient legends speak of a Countess who was buried alive. Her castle has fallen into ruin, but her treasures... they remain. Find her, and the riches of the old world are yours.'"
    },
    'tools_of_the_trade': {
        id: 'tools_of_the_trade',
        name: 'Tools of the Trade',
        desc: 'Retrieve the Horadric Malus from the Smith in the Monastery (Zone 5).',
        target: 1,
        giver: 'charsi',
        goldReward: 2000,
        xpReward: 5000,
        imbueReward: true,
        intro: "Charsi: 'When I fled the Monastery, I left my enchanted hammer, the Horadric Malus, behind. The Smith now guards it. Bring it back to me, and I can empower your gear like never before!'"
    },
    'andariel': {
        id: 'andariel',
        name: 'Sisters to the Slaughter',
        desc: 'Defeat Andariel, the Maiden of Anguish, in the Depths (Zone 5 Boss).',
        target: 1,
        giver: 'akara',
        goldReward: 10000,
        xpReward: 10000,
        skillReward: 1,
        statReward: 5,
    }
};

const ACT_2_QUESTS = {
    'radament': {
        id: 'radament',
        name: 'Radament\'s Lair',
        desc: 'Slay Radament in the Sewers (Zone 7).',
        target: 1,
        giver: 'atma',
        goldReward: 5000,
        xpReward: 8000,
        skillReward: 1,
        bossOnly: true,
        intro: "Drognan: 'A creature of the ancient sands has awakened in the sewers beneath our feet. Radament, they call him. He steals the bodies of the dead to nourish his own. Destroy him, and I will grant you ancient knowledge.'"
    },
    'horadric_staff': {
        id: 'horadric_staff',
        name: 'The Horadric Staff',
        desc: 'Retrieve the Horadric Staff components (Zone 8/9).',
        target: 2,
        giver: 'deckard_cain',
        goldReward: 8000,
        xpReward: 12000,
        bossOnly: true,
        intro: "Deckard Cain: 'The Horadric Staff is the only key to Tal Rasha's Tomb. It was divided into two pieces: the shaft and the headpiece. Find the guardians in the desert to recover them.'"
    },
    'duriel': {
        id: 'duriel',
        name: 'The Seven Tombs',
        desc: 'Defeat Duriel, the Lord of Pain, in Tal Rasha\'s Chamber (Zone 10).',
        target: 1,
        giver: 'deckard_cain',
        goldReward: 15000,
        xpReward: 20000,
        statReward: 5,
        isActBoss: true,
        intro: "Deckard Cain: 'The true tomb of Tal Rasha has been found. But be warned, Duriel, the Lord of Pain, guards the entrance. You must defeat him to continue your pursuit of the Dark Wanderer!'"
    }
};

const ACT_3_QUESTS = {
    'khalims_will': {
        id: 'khalims_will',
        name: 'Khalim\'s Will',
        desc: 'Recover the relics of Khalim from the Jungle (Zone 12/13).',
        target: 2,
        giver: 'ormus',
        goldReward: 10000,
        xpReward: 25000,
        bossOnly: true,
        intro: "Ormus: 'Khalim was the only one who could resist the corruption of Mephisto. To break the Orb in Travincal, you must gather his relics: his heart, his brain, and his eye. Go into the jungle, mortal.'"
    },
    'travincal': {
        id: 'travincal',
        name: 'The Blackened Temple',
        desc: 'Defeat the High Council in Travincal (Zone 14).',
        target: 1,
        giver: 'deckard_cain',
        goldReward: 12000,
        xpReward: 30000,
        skillReward: 1,
        bossOnly: true,
        intro: "Deckard Cain: 'The Council of Zakarum has fallen under the sway of Mephisto. They reside in the ancient temple of Travincal. You must purge them before you can enter the Durance of Hate.'"
    },
    'mephisto': {
        id: 'mephisto',
        name: 'The Guardian',
        desc: 'Defeat Mephisto, the Lord of Hatred, in the Durance of Hate (Zone 15 Boss).',
        target: 1,
        giver: 'deckard_cain',
        goldReward: 25000,
        xpReward: 50000,
        statReward: 5,
        isActBoss: true,
        intro: "Deckard Cain: 'Mephisto, the oldest of the Prime Evils, is near. He guards the gate to Hell itself. Defeat him, and take his Soulstone!'"
    }
};

const ACT_4_QUESTS = {
    'hellgate': {
        id: 'hellgate',
        name: 'The Fallen Angel',
        desc: 'Find and defeat Izual in the Plains of Despair (Zone 18).',
        target: 1,
        giver: 'tyrael',
        goldReward: 20000,
        xpReward: 40000,
        skillReward: 2,
        bossOnly: true,
        intro: "Tyrael: 'Izual was once my most trusted lieutenant. Now he is a tortured soul guarding the plains of Hell. Release him from his agony.'"
    },
    'hellforge': {
        id: 'hellforge',
        name: 'The Hellforge',
        desc: 'Slay Hephaisto the Armorer (Zone 19) and use the Hellforge to destroy Mephisto\'s Soulstone.',
        target: 1,
        giver: 'tyrael',
        goldReward: 25000,
        xpReward: 60000,
        runeReward: true, // Special logic in checkDeaths/interact
        bossOnly: true,
        intro: "Tyrael: 'The Soulstone of Mephisto must be destroyed at the Hellforge. Hephaisto guards the hammer. Defeat him and fulfill your destiny!'"
    },
    'terrors_end': {
        id: 'terrors_end',
        name: 'Terror\'s End',
        desc: 'Reach the Chaos Sanctuary (Zone 20) and defeat Diablo, the Lord of Terror.',
        target: 1,
        giver: 'tyrael',
        goldReward: 50000,
        xpReward: 100000,
        skillReward: 2,
        statReward: 10,
        isActBoss: true,
        intro: "Tyrael: 'The time has come to end this darkness. Diablo has retreated to his Chaos Sanctuary. You must follow him and strike him down!'"
    }
};

const ACT_5_QUESTS = {
    'siege_on_harrogath': {
        id: 'siege_on_harrogath',
        name: 'Siege on Harrogath',
        desc: 'Slay Shenk the Overseer at the Bloody Foothills (Zone 22).',
        target: 1,
        giver: 'larzuk',
        goldReward: 20000,
        xpReward: 60000,
        imbueReward: true,
        bossOnly: true,
        intro: "Larzuk: 'Shenk the Overseer is driving the demon hordes into our walls. Stop him, and I will socket your equipment!'"
    },
    'prison_of_ice': {
        id: 'prison_of_ice',
        name: 'Prison of Ice',
        desc: 'Rescue Anya by defeating Frozenstein in the Ice Caves (Zone 23/24 subarea).',
        target: 1,
        giver: 'malah',
        goldReward: 30000,
        xpReward: 80000,
        resReward: 10,
        bossOnly: true,
        intro: "Malah: 'Anya, the daughter of our elder, is missing in the ice caves. Find her and bring her back safely!'"
    },
    'rite_of_passage': {
        id: 'rite_of_passage',
        name: 'Rite of Passage',
        desc: 'Defeat the three Ancients upon Arreat Summit (Zone 23) without leaving the area.',
        target: 3, // Must kill all 3
        giver: 'nihlathak',
        goldReward: 40000,
        xpReward: 150000,
        statReward: 5,
        skillReward: 1,
        intro: "Nihlathak: 'You seek the Worldstone? Only those who pass the test of the Ancients may enter. Be warned: they do not hold back!'"
    },
    'lod_finale': {
        id: 'lod_finale',
        name: 'The Lord of Destruction',
        desc: 'Reach the Worldstone Chamber (Zone 25) and defeat Baal, the Lord of Destruction.',
        target: 1,
        giver: 'tyrael',
        goldReward: 100000,
        xpReward: 250000,
        skillReward: 5,
        statReward: 20,
        isActBoss: true,
        intro: "Tyrael: 'Baal has reached the Heart of the Worldstone. If he corrupts it, Sanctuary will be lost forever. Hurry!'"
    }
};

const QUEST_POOL = [...Object.values(ACT_1_QUESTS), ...Object.values(ACT_2_QUESTS), ...Object.values(ACT_3_QUESTS), ...Object.values(ACT_4_QUESTS), ...Object.values(ACT_5_QUESTS)];

function offerQuest(giverId = null) {
    if (!player) return;

    // Check for completions first
    for (let i = activeQuests.length - 1; i >= 0; i--) {
        const q = activeQuests[i];
        if (q.progress >= q.target) {
            // Must talk to the giver to turn in? 
            // For now, let's allow auto-turn-in if giverId matches OR if no giverId provided (kill loop)
            if (giverId === q.giver || !giverId) {
                player.gold += q.goldReward;
                player.addXp(q.xpReward);
                if (q.skillReward) player.talents.unspent += q.skillReward;
                if (q.statReward) player.statPoints += q.statReward;
                if (q.mercenaryReward) addCombatLog('You can now hire mercenaries from Kashya!', 'log-level');
                if (q.imbueReward) {
                    player.hasImbue = true;
                    addCombatLog('Larzuk/Charsi can now Imbue/Socket one item! (Interaction Menu)', 'log-level');
                }
                if (q.resReward) {
                    player.permanentResists = (player.permanentResists || 0) + q.resReward;
                    player.recalcStats();
                    addCombatLog(`Malah grants you permanent +${q.resReward} to All Resistances!`, 'log-level');
                }
                if (q.isActBoss) {
                    if (q.id === 'lod_finale') {
                        addCombatLog('THE LORD OF DESTRUCTION IS DEFEATED! SANCTUARY IS SAVED!', 'log-crit');
                        bus.emit('ui:showScreen', { screen: 'victory' });
                    } else if (q.id === 'terrors_end') {
                        addCombatLog('THE LORD OF TERROR IS DEFEATED! SANCTUARY IS SAVED!', 'log-crit');
                        bus.emit('ui:showScreen', { screen: 'victory' });
                    } else {
                        addCombatLog('ACT BOSS DEFEATED! You have proven your strength.', 'log-crit');
                    }
                    if (fx) fx.emitLevelUp(player.x, player.y);
                }

                addCombatLog(`Quest Complete: "${q.name}" — Reward received!`, 'log-level');
                completedQuests.add(q.id);
                activeQuests.splice(i, 1);
                if (fx) fx.emitBurst(player.x, player.y, '#4caf50', 50, 2.5);
                updateHud();
                return true;
            }
        }
    }

    // Give a new quest if the giver matches and we don't have it
    if (giverId) {
        const quest = QUEST_POOL.find(q => q.giver === giverId && !completedQuests.has(q.id) && !activeQuests.some(aq => aq.id === q.id));
        if (quest) {
            activeQuests.push({ ...quest, progress: 0 });
            addCombatLog(`New Quest: "${quest.name}"`, 'log-level');
            dialogue = { text: quest.intro, timer: 8, npc: { name: giverId } };
            updateHud();
            return true;
        }
    }
    return false;
}


// ─── MERCENARY HIRE ───
function hireMercenary(type = 'Rogue') {
    if (!player) return;
    if (player.gold < 500) {
        addCombatLog('You do not have enough gold to hire a companion.', 'log-dmg');
        return;
    }

    if (mercenary && mercenary.hp > 0) {
        addCombatLog('You already have an active companion.', 'log-info');
        return;
    }

    if (mercenary && mercenary.hp <= 0) {
        if (player.gold < 200) { addCombatLog('Not enough gold to revive.', 'log-dmg'); return; }
        player.gold -= 200;
        mercenary.hp = mercenary.maxHp;
        addCombatLog(`${mercenary.name} has been revived!`, 'log-level');
        updateHud();
        return;
    }
    const hireCost = 500;
    if (player.gold < hireCost) { addCombatLog(`Not enough gold! (${hireCost}g to hire)`, 'log-dmg'); return; }
    player.gold -= hireCost;
    const names = {
        'Rogue': ['Aliza', 'Kyra', 'Paige', 'Blaise'],
        'Desert Warrior': ['Heseir', 'Raheer', 'EMez', 'Fazel'],
        'Iron Wolf': ['Jarulf', 'Isenhart', 'Telash', 'Flux']
    };
    const icons = { 'Rogue': 'class_rogue', 'Desert Warrior': 'class_warrior', 'Iron Wolf': 'class_shaman' };

    const nameList = names[type] || names['Rogue'];
    mercenary = new Mercenary({
        name: nameList[Math.floor(Math.random() * nameList.length)],
        className: type,
        level: player.level || 1,
        icon: icons[type] || 'class_rogue',
        x: player.x + 20, y: player.y
    });

    addCombatLog(`Hired ${type} ${mercenary.name}! They will fight by your side.`, 'log-level');
    updateHud();
    renderMercenaryPanel();
}

// --- Phase 28: Bounty Board System ---
function generateDailyBounties() {
    activeBounties = [];
    const themes = ['Skeletons', 'Zombies', 'Spiders', 'Demons', 'Wraiths'];
    for (let i = 0; i < 3; i++) {
        const theme = themes[Math.floor(Math.random() * themes.length)];
        const count = 20 + Math.floor(Math.random() * 30);
        activeBounties.push({
            id: `bounty_${Date.now()}_${i}`,
            title: `Bounty: ${theme} Purge`,
            desc: `Exterminate ${count} ${theme} across the realm.`,
            target: theme.toLowerCase(),
            progress: 0,
            targetCount: count,
            reward: { gold: count * 10, xp: count * 100 }
        });
    }
}

function checkBountyProgress(enemy) {
    if (!activeBounties.length) return;
    for (const b of activeBounties) {
        if (b.progress >= b.targetCount) continue;
        if (enemy.name.toLowerCase().includes(b.target) || (enemy.group && enemy.group.toLowerCase().includes(b.target))) {
            b.progress++;
            if (b.progress === b.targetCount) {
                addCombatLog(`Bounty Complete: ${b.title}! +${b.reward.gold}g`, 'log-crit');
                player.gold += b.reward.gold;
                player.gainXp(b.reward.xp);
                fx.emitBurst(player.x, player.y, '#ffd700', 30, 4);
                updateHud();
            }
        }
    }
}

// ─── ACHIEVEMENTS ───
function checkAchievements() {
    for (const ach of ACHIEVEMENTS) {
        if (!unlockedAchievements.has(ach.id) && ach.check()) {
            unlockedAchievements.add(ach.id);
            addCombatLog(`🏆 Achievement Unlocked: ${ach.name}!`, 'log-crit');

            // CELEBRATORY BANNER
            const banner = $('achievement-announcement');
            if (banner) {
                $('ach-name').textContent = ach.name;
                banner.classList.remove('hidden');
                setTimeout(() => banner.classList.add('hidden'), 4000);
            }
            fx.emitBurst(renderer.width / 2, 100, '#00ccff', 20, 3);

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
    // Phase 31: Init Supabase
    DB.init();

    // Setup Auth UI Hooks
    $('btn-open-auth').addEventListener('click', () => {
        $('auth-modal').classList.remove('hidden');
    });

    $('btn-auth-login').addEventListener('click', async () => {
        const e = $('auth-email').value, p = $('auth-password').value;
        if (!e || !p) { $('auth-error').textContent = 'Enter email and password'; return; }
        $('auth-error').textContent = 'Logging in...';
        const res = await DB.signIn(e, p);
        if (res.success) {
            $('auth-modal').classList.add('hidden');
            renderSaveSlots(); // Reload saves
        } else {
            $('auth-error').textContent = res.error;
        }
    });

    $('btn-auth-register').addEventListener('click', async () => {
        const e = $('auth-email').value, p = $('auth-password').value;
        if (!e || !p) { $('auth-error').textContent = 'Enter email and password'; return; }
        $('auth-error').textContent = 'Registering...';
        const res = await DB.signUp(e, p);
        if (res.success) {
            $('auth-modal').classList.add('hidden');
            renderSaveSlots();
        } else {
            $('auth-error').textContent = res.error;
        }
    });

    $('btn-logout').addEventListener('click', async () => {
        await DB.signOut();
        renderSaveSlots();
    });

    bus.on('auth:stateChanged', (session) => {
        const text = $('auth-status-text');
        const btnLogin = $('btn-open-auth');
        const btnLogout = $('btn-logout');
        if (session) {
            text.textContent = `Cloud Connected: ${session.user.email}`;
            text.style.color = 'var(--cyan)';
            btnLogin.classList.add('hidden');
            btnLogout.classList.remove('hidden');
        } else {
            text.textContent = `Playing as Guest (Local Saves)`;
            text.style.color = '#aaa';
            btnLogin.classList.remove('hidden');
            btnLogout.classList.add('hidden');
        }
    });

    initParticles();
    initClassGrid();

    // Preload all pixel art assets
    for (const name of ASSET_NAMES) {
        Assets.load(name, `assets/${name}.png`);
    }

    renderSaveSlots();

    $('btn-new-game').addEventListener('click', () => {
        if (!selectedClass) return;
        const nameInput = $('character-name');
        const charName = nameInput ? nameInput.value.trim() : null;
        initAudio();
        // Set difficulty before starting
        const activeDiffBtn = document.querySelector('.diff-btn.active');
        window._difficulty = activeDiffBtn ? parseInt(activeDiffBtn.dataset.diff) : 0;
        startGame(null, null, charName);
    });

    // Difficulty selection wiring
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
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

    // Export / Import
    $('btn-export-save').addEventListener('click', () => {
        const data = SaveSystem.exportData();
        if (!data) return;
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dark_realm_save_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    $('btn-import-save').addEventListener('click', () => {
        $('import-file').click();
    });

    $('import-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (SaveSystem.importData(ev.target.result)) {
                alert('Save data imported successfully!');
                // Reload shared stash and slots
                sharedStashData = SaveSystem.getSharedStash();
                sharedStash = sharedStashData.items;
                sharedGold = sharedStashData.gold;
                renderSaveSlots();
            } else {
                alert('Failed to import save data. Invalid file format.');
            }
        };
        reader.readAsText(file);
    });
});

// ─── SAVE SLOT UI ───
async function renderSaveSlots() {
    const container = $('save-slots');
    let slots = [];
    if (DB.isLoggedIn()) {
        slots = await DB.getSaves();
    } else {
        slots = SaveSystem.listSlots();
    }
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
        card.addEventListener('click', async (e) => {
            if (e.target.classList.contains('slot-delete')) return;

            let saveData = null;
            if (DB.isLoggedIn()) {
                const cloudSaves = await DB.getSaves();
                const cloudMatch = cloudSaves.find(s => s.id === slot.id);
                if (cloudMatch) {
                    saveData = {
                        player: cloudMatch.player,
                        zoneLevel: cloudMatch.zoneLevel || 0,
                        stash: cloudMatch.stash || [],
                        cube: cloudMatch.cube || [],
                        mercenary: cloudMatch.mercenary || null,
                        slotId: cloudMatch.id,
                        difficulty: cloudMatch.difficulty || 0,
                        waypoints: cloudMatch.waypoints || [0],
                    };
                }
            }
            if (!saveData) saveData = SaveSystem.loadSlot(slot.id);

            if (saveData) {
                let pData = null;
                try { pData = typeof saveData.player === 'string' ? JSON.parse(saveData.player) : saveData.player; } catch (err) { }
                const maxDiff = (pData && pData.maxDifficulty) ? pData.maxDifficulty : 0;

                // Show Difficulty Selection if unlocked
                const picker = document.createElement('div');
                picker.className = 'dialogue-picker-menu';
                picker.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(10,8,5,0.95); border:1px solid #bf642f; padding:20px; z-index:2000; text-align:center; box-shadow:0 0 20px #000; min-width:250px; border-radius:10px;';
                picker.innerHTML = `<h3 style="color:var(--gold); margin-bottom:15px; font-family:'Cinzel',serif; font-size:18px;">Select Difficulty</h3>`;

                // Show all difficulties up to maxDifficulty
                for (let d = 0; d <= maxDiff; d++) {
                    const btn = document.createElement('button');
                    btn.className = 'btn-secondary';
                    btn.style.cssText = 'display:block; width:100%; margin-bottom:10px; padding:12px; font-weight:bold; font-size:14px;';
                    
                    if (d === 3) {
                        btn.textContent = '⚡ Rift Mode ⚡';
                        btn.style.color = '#bf642f'; // Unique orange
                        btn.style.border = '1px solid #ff9000';
                    } else {
                        btn.textContent = DIFFICULTY_NAMES[d];
                        if (d === 1) btn.style.color = '#ffcc00'; // Nightmare
                        if (d === 2) btn.style.color = '#ff4400'; // Hell
                    }

                    btn.onclick = (ev) => {
                        ev.stopPropagation();
                        saveData.difficulty = d;
                        
                        // If Rift Mode, override starting zone
                        if (d === 3) {
                            saveData.zoneLevel = 26; 
                        } else if (saveData.zoneLevel >= 26) {
                            // If coming back to normal game, return to Town
                            saveData.zoneLevel = 0;
                        }

                        picker.remove();
                        initAudio();
                        startGame(slot.id, saveData);
                    };
                    picker.appendChild(btn);
                }

                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'btn-secondary small';
                cancelBtn.style.marginTop = '10px';
                cancelBtn.textContent = 'Cancel';
                cancelBtn.onclick = (ev) => { ev.stopPropagation(); picker.remove(); };
                picker.appendChild(cancelBtn);

                document.body.appendChild(picker);
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

// --- Phase 29: World Overlay & Time Logic ---
function renderWorldOverlay(ctx, w, h) {
    const hour = worldTime / 60;
    let alpha = 0;
    let color = '0, 0, 0';

    if (hour >= 20 || hour < 4) { // Night
        alpha = 0.45;
        color = '20, 10, 60';
    } else if (hour >= 18 && hour < 20) { // Dusk
        alpha = (hour - 18) / 2 * 0.45;
        color = '80, 20, 40';
    } else if (hour >= 4 && hour < 6) { // Dawn
        alpha = (1 - (hour - 4) / 2) * 0.45;
        color = '80, 50, 20';
    }

    // --- Phase 3.1: Act-Based Tinting ---
    ctx.save();
    const theme = window.currentTheme;
    if (theme === 'desert') {
        ctx.fillStyle = 'rgba(180, 120, 40, 0.08)'; // Sepia heat
        ctx.fillRect(0, 0, w, h);
    } else if (theme === 'hell') {
        ctx.fillStyle = 'rgba(255, 40, 0, 0.05)'; // Hellfire glow
        ctx.fillRect(0, 0, w, h);
    } else if (theme === 'snow') {
        ctx.fillStyle = 'rgba(100, 200, 255, 0.06)'; // Frozen chill
        ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();

    if (alpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }
}

function updateWorldClockUI() {
    const clock = $('world-clock');
    if (!clock) return;
    const hour = Math.floor(worldTime / 60);
    const min = Math.floor(worldTime % 60);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    clock.textContent = `${h12}:${min < 10 ? '0' : ''}${min} ${ampm} ${window.isNight ? '🌙' : '☀️'}`;
}

// --- Phase 29: Blacksmith Crafting UI ---
function renderCraftingMenu() {
    const existing = document.getElementById('crafting-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'crafting-panel';
    panel.className = 'dialogue-panel'; // Use existing panel styles
    panel.style.width = '300px';
    panel.innerHTML = `
        <h3 style="color:var(--gold); border-bottom:1px solid #444; margin-bottom:10px;">Charsi's Forge</h3>
        <div style="font-size:11px; margin-bottom:10px;">Spend 5 Horadric Fragments for a high-tier Rare.</div>
        <div id="craft-options" style="display:flex; flex-direction:column; gap:5px;"></div>
        <button class="btn-close" style="width:100%; margin-top:10px;">Close</button>
    `;

    const bases = ['long_sword', 'war_hammer', 'plate_mail', 'bone_shield', 'great_helm'];
    const fragments = player.inventory.filter(it => it && it.baseId === 'horadric_fragment').length;

    bases.forEach(baseId => {
        const itemBase = items[baseId];
        if (!itemBase) return; // Skip if ID is missing from data

        const btn = document.createElement('button');
        btn.className = 'btn-menu';
        btn.textContent = `Craft ${itemBase.name}`;
        btn.disabled = fragments < 5;
        btn.onclick = () => {
            const empty = player.inventory.indexOf(null);
            if (empty === -1) { addCombatLog('Inventory Full!', 'log-dmg'); return; }

            // Consume 5 fragments
            let removed = 0;
            for (let i = 0; i < player.inventory.length; i++) {
                if (player.inventory[i] && player.inventory[i].baseId === 'horadric_fragment') {
                    player.inventory[i] = null;
                    removed++;
                    if (removed === 5) break;
                }
            }

            const crafted = loot.rollCraftedItem(baseId, player.level);
            player.inventory[empty] = crafted;
            addCombatLog(`Crafted ${crafted.name}!`, 'log-crit');
            renderInventory();
            renderCraftingMenu();
        };
        panel.querySelector('#craft-options').appendChild(btn);
    });

    panel.querySelector('.btn-close').onclick = () => panel.remove();
    document.body.appendChild(panel);

    // Position near Charsi
    const pos = camera.toScreen(activeDialogueNpc.x, activeDialogueNpc.y);
    panel.style.left = `${pos.x - 150}px`;
    panel.style.top = `${pos.y - 250}px`;
}

// --- Phase 30: Drag & Drop Implementation ---
function startDrag(e, item, source, idx) {
    if (!item) return;
    draggedItem = item;
    dragSource = source;
    dragSourceIdx = idx;

    dragGhost = document.createElement('div');
    dragGhost.id = 'drag-ghost';
    dragGhost.innerHTML = getItemHtml(item);
    dragGhost.style.position = 'fixed';
    dragGhost.style.pointerEvents = 'none';
    dragGhost.style.zIndex = '10000';
    dragGhost.style.opacity = '0.8';
    document.body.appendChild(dragGhost);

    e.target.closest('.inv-item')?.classList.add('dragging');
}

function handleDrop(target, idx) {
    if (!draggedItem) return;
    bus.emit('ui:click');
    let success = false;

    // Helper to get array reference by name
    const getContainer = (name) => {
        if (name === 'inventory') return player.inventory;
        if (name === 'belt') return player.belt;
        if (name === 'stash') return (currentStashTab === 'personal') ? stash : sharedStash;
        if (name === 'cube') return cube;
        return null;
    };

    const srcArr = getContainer(dragSource);
    const tarArr = getContainer(target);

    // 1. Array to Array (Inventory, Stash, Cube, Belt)
    if (target === 'hotbar' && draggedSkill) {
        const skillAtSource = player.hotbar[dragSourceIdx];
        const skillAtTarget = player.hotbar[idx];
        
        player.hotbar[idx] = skillAtSource;
        player.hotbar[dragSourceIdx] = skillAtTarget;
        success = true;
    } else if (srcArr && tarArr) {
        const itemAtSource = srcArr[dragSourceIdx];
        const itemAtTarget = tarArr[idx];

        // Swap
        tarArr[idx] = itemAtSource;
        srcArr[dragSourceIdx] = itemAtTarget;
        success = true;
    }
    // 2. Dragging FROM Equip TO Array (Inventory, Stash, Cube, Belt)
    else if (dragSource === 'equip' && tarArr) {
        const itemAtTarget = tarArr[idx];
        const unequipped = player.unequip(dragSourceIdx);

        tarArr[idx] = unequipped;
        if (itemAtTarget) {
            // Attempt to equip the item that was in the target slot
            const res = player.equip(itemAtTarget, dragSourceIdx);
            if (!res.success) {
                // If it can't be equipped (reqs), try to put it back in source (unlikely to fail if it was there)
                // or just put it in first empty inv slot
                const empty = player.inventory.indexOf(null);
                if (empty !== -1) player.inventory[empty] = itemAtTarget;
                else droppedItems.push({ ...itemAtTarget, x: player.x, y: player.y, active: true });
            }
        }
        success = true;
    }
    // 3. Dragging FROM Array TO Equip
    else if (srcArr && target === 'equip') {
        const itm = srcArr[dragSourceIdx];
        const res = player.equip(itm, idx);
        if (res.success) {
            srcArr[dragSourceIdx] = res.swapped;
            success = true;
            bus.emit('item:move');
        } else {
            addCombatLog(res.error, 'log-dmg');
            bus.emit('ui:error');
        }
    }
    // 4. Dragging TO Mercenary
    else if (target === 'merc' && mercenary) {
        const validSlots = ['head', 'chest', 'mainhand', 'offhand'];
        if (validSlots.includes(draggedItem.slot) && (draggedItem.slot === idx || (draggedItem.slot.startsWith('ring') && idx.startsWith('ring')))) {
            const itm = draggedItem;
            const old = mercenary.equipment[idx];

            if (srcArr) srcArr[dragSourceIdx] = old;
            else if (dragSource === 'equip') {
                player.equipment[dragSourceIdx] = old;
                player._recalcStats();
            }
            else if (dragSource === 'merc') mercenary.equipment[dragSourceIdx] = old;

            mercenary.equipment[idx] = itm;
            mercenary._recalcStats();
            success = true;
            addCombatLog(`Equipped ${itm.name} to ${mercenary.name}`, 'log-info');
            renderMercenaryPanel();
        } else {
            addCombatLog(`${mercenary.name} cannot equip this!`, 'log-dmg');
            bus.emit('ui:error');
        }
    }
    // 5. Dragging FROM Mercenary
    else if (dragSource === 'merc' && mercenary) {
        const itm = draggedItem;
        if (tarArr) {
            const old = tarArr[idx];
            tarArr[idx] = itm;
            
            // Check if old can be equipped by merc in this slot
            const validSlots = ['head', 'chest', 'mainhand', 'offhand'];
            if (old && validSlots.includes(old.slot) && (old.slot === dragSourceIdx || (old.slot.startsWith('ring') && dragSourceIdx.startsWith('ring')))) {
                mercenary.equipment[dragSourceIdx] = old;
            } else {
                mercenary.equipment[dragSourceIdx] = null;
                if (old) {
                    const empty = player.inventory.indexOf(null);
                    if (empty !== -1) player.inventory[empty] = old;
                    else droppedItems.push({ ...old, x: player.x, y: player.y, active: true });
                }
            }
            mercenary._recalcStats();
            success = true;
            renderMercenaryPanel();
        } else if (target === 'equip') {
            const res = player.equip(itm, idx);
            if (res.success) {
                mercenary.equipment[dragSourceIdx] = res.swapped;
                mercenary._recalcStats();
                success = true;
                renderMercenaryPanel();
            } else {
                addCombatLog(res.error, 'log-dmg');
                bus.emit('ui:error');
            }
        }
    }

    if (success) {
        // Persistence for shared stash
        if (dragSource === 'stash' && currentStashTab === 'shared') SaveSystem.saveSharedStash(sharedStash, sharedGold);
        if (target === 'stash' && currentStashTab === 'shared') SaveSystem.saveSharedStash(sharedStash, sharedGold);

        player._recalcStats();
        addCombatLog(`Moved ${draggedItem.name}`, 'log-info');
    }

    clearDrag();
    renderInventory();
    renderCharacterPanel();
    renderStash();
    renderCube();
    updateHud();
}

function clearDrag() {
    draggedItem = null;
    dragSource = null;
    dragSourceIdx = null;
    if (dragGhost) { dragGhost.remove(); dragGhost = null; }
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
}

window.addEventListener('mousemove', (e) => {
    if (dragGhost) {
        dragGhost.style.left = `${e.clientX - 16}px`;
        dragGhost.style.top = `${e.clientY - 16}px`;
    }
});

window.addEventListener('mouseup', (e) => {
    if (draggedSkill) {
        // Drop skill outside to clear it
        const barRect = $('skill-bar').getBoundingClientRect();
        const overBar = (e.clientX >= barRect.left && e.clientX <= barRect.right && e.clientY >= barRect.top && e.clientY <= barRect.bottom);
        
        if (!overBar) {
            player.hotbar[dragSourceIdx] = null;
            addCombatLog("Skill unassigned.", "log-info");
            updateSkillBar();
        }
        clearSkillDrag();
    }

    if (draggedItem) {
        // If we are here, no slot handled the mouseup (slots stopPropagation or are handled first)
        // Check if we are over a UI panel
        const panels = ['panel-inventory', 'panel-character', 'panel-stash', 'panel-cube', 'panel-mercenary', 'panel-shop'];
        const overPanel = panels.some(id => {
            const el = document.getElementById(id);
            if (!el || el.classList.contains('hidden')) return false;
            const rect = el.getBoundingClientRect();
            return (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom);
        });

        if (!overPanel) {
            // Drop on ground
            const item = { ...draggedItem };
            item.x = player.x + (Math.random() - 0.5) * 32;
            item.y = player.y + (Math.random() - 0.5) * 32;
            item.active = true;
            droppedItems.push(item);
            addCombatLog(`Dropped ${item.name} for real.`);

            // Remove from source
            const getContainer = (name) => {
                if (name === 'inventory') return player.inventory;
                if (name === 'belt') return player.belt;
                if (name === 'stash') return (currentStashTab === 'personal') ? stash : sharedStash;
                if (name === 'cube') return cube;
                return null;
            };

            const srcArr = getContainer(dragSource);
            if (srcArr) srcArr[dragSourceIdx] = null;
            else if (dragSource === 'equip') player.unequip(dragSourceIdx);

            clearDrag();
            renderInventory();
            renderCharacterPanel();
            renderStash();
            renderCube();
            updateHud();
        }
    }
    setTimeout(() => { if (draggedItem) clearDrag(); }, 20);
});

// --- Phase 30: Pantheon UI ---
function renderPantheonList() {
    const legacies = SaveSystem.getPantheon();

    const overlay = document.createElement('div');
    overlay.id = 'pantheon-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center;
        z-index: 2000; font-family: 'Cinzel', serif; backdrop-filter: blur(5px);
    `;

    const container = document.createElement('div');
    container.style.cssText = `
        width: 600px; max-height: 80%; background: #0a0805; border: 2px solid #bf642f;
        padding: 30px; box-shadow: 0 0 50px rgba(191, 100, 47, 0.3); border-radius: 8px;
        display: flex; flex-direction: column; color: #ba9158; overflow: hidden;
    `;

    const title = document.createElement('h2');
    title.textContent = "THE PANTHEON OF HEROES";
    title.style.cssText = "text-align: center; color: #ffd700; margin-bottom: 20px; text-shadow: 0 0 10px rgba(255,215,0,0.5);";
    container.appendChild(title);

    const list = document.createElement('div');
    list.style.cssText = "flex: 1; overflow-y: auto; padding-right: 10px;";

    if (legacies.length === 0) {
        list.innerHTML = "<div style='text-align:center; padding: 40px; color: #666;'>No heroes have fallen... yet.</div>";
    } else {
        legacies.sort((a, b) => b.level - a.level).forEach(hero => {
            const entry = document.createElement('div');
            entry.style.cssText = `
                display: flex; justify-content: space-between; align-items: center;
                padding: 12px; margin-bottom: 8px; background: rgba(186, 145, 88, 0.05);
                border: 1px solid #333; border-radius: 4px; transition: background 0.2s;
            `;
            entry.onmouseover = () => entry.style.background = "rgba(186, 145, 88, 0.1)";
            entry.onmouseout = () => entry.style.background = "rgba(186, 145, 88, 0.05)";

            entry.innerHTML = `
                <div>
                    <span style="color: #ffd700; font-weight: bold;">[${hero.level}] ${hero.name}</span>
                    <div style="font-size: 12px; color: #888;">${hero.className} | Slayed by ${hero.killer || 'the shadows'}</div>
                </div>
                <div style="text-align: right; font-size: 12px;">
                    <div style="color: #bf642f;">${hero.gold} Gold</div>
                    <div style="color: #666;">${new Date(hero.date).toLocaleDateString()}</div>
                </div>
            `;
            list.appendChild(entry);
        });
    }
    container.appendChild(list);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = "CLOSE";
    closeBtn.className = "inventory-btn";
    closeBtn.style.marginTop = "20px";
    closeBtn.onclick = () => overlay.remove();
    container.appendChild(closeBtn);

    overlay.appendChild(container);
    document.body.appendChild(overlay);
}

function returnToMainMenu() {
    // Save current character before leaving
    if (player && window._activeSlotId) {
        SaveSystem.saveSlot(window._activeSlotId, player, zoneLevel, stash, {
            difficulty: window._difficulty,
            waypoints: Array.from(discoveredWaypoints)
        });
    }
    
    // Switch to menu state
    state = 'MENU';
    $('game-screen').classList.remove('active');
    $('main-menu').classList.add('active');
    
    // Refresh the character slots in the menu
    renderSaveSlots();
}

// --- Phase 31: Skill Reordering & Picker Logic ---
let draggedSkill = null;
let dragSkillGhost = null;

function startSkillDrag(e, skillId, idx) {
    draggedSkill = skillId;
    dragSourceIdx = idx;
    dragSource = 'hotbar';

    dragSkillGhost = document.createElement('div');
    dragSkillGhost.id = 'drag-ghost-skill';
    dragSkillGhost.innerHTML = `<i class="ra ${getIconForSkill(skillId)}" style="font-size: 28px; color: var(--gold);"></i>`;
    document.body.appendChild(dragSkillGhost);

    $(`skill-${idx + 1}`).classList.add('dragging');
}

function openSkillPicker(slotIdx, x, y) {
    const existing = document.getElementById('skill-picker');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'skill-picker';
    menu.className = 'skill-picker-modal';
    
    // Position the menu above the hotbar
    menu.style.left = `${Math.min(window.innerWidth - 300, Math.max(20, x - 140))}px`;
    menu.style.top = `${y - 320}px`;

    const header = document.createElement('div');
    header.className = 'skill-picker-header';
    header.textContent = `ASSIGN SKILL TO SLOT ${slotIdx + 1}`;
    menu.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'skill-picker-grid';

    // Get all learned active skills
    const skills = Object.values(player.skillMap).filter(s => s.type === 'active' && player.talents.baseLevel(s.id) > 0);

    if (skills.length === 0) {
        grid.innerHTML = `<div style="grid-column: span 4; text-align: center; color: #666; font-size: 11px; padding: 20px;">No active skills learned yet.<br>Spend Talent Points first!</div>`;
    }

    skills.forEach(skill => {
        const node = document.createElement('div');
        node.className = 'skill-picker-node';
        if (player.hotbar.includes(skill.id)) node.classList.add('active-on-bar');
        
        node.innerHTML = `<i class="ra ${getIconForSkill(skill.id)}" style="font-size: 24px; color: var(--gold);"></i>`;
        
        node.addEventListener('mouseenter', (e) => showSkillTooltip(skill.id, e.clientX, e.clientY));
        node.addEventListener('mousemove', (e) => moveTooltip(e.clientX, e.clientY));
        node.addEventListener('mouseleave', hideTooltip);

        node.onclick = () => {
            // Remove from other slot if already assigned? (Diablo 2 style: allow multiples or swap)
            // Let's allow unique assignments for simplicity
            const oldIdx = player.hotbar.indexOf(skill.id);
            if (oldIdx !== -1) player.hotbar[oldIdx] = null;

            player.hotbar[slotIdx] = skill.id;
            updateSkillBar();
            menu.remove();
            hideTooltip();
            addCombatLog(`Assigned ${skill.name} to hotbar.`, 'log-info');
        };

        grid.appendChild(node);
    });

    menu.appendChild(grid);

    const footer = document.createElement('div');
    footer.className = 'skill-picker-footer';
    footer.textContent = "Right-click slot to clear";
    menu.appendChild(footer);

    // Close when clicking outside
    const closeHandler = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            window.removeEventListener('mousedown', closeHandler);
        }
    };
    setTimeout(() => window.addEventListener('mousedown', closeHandler), 10);

    document.body.appendChild(menu);
}

window.addEventListener('mousemove', (e) => {
    if (dragGhost) {
        dragGhost.style.left = `${e.clientX - 16}px`;
        dragGhost.style.top = `${e.clientY - 16}px`;
    }
    if (dragSkillGhost) {
        dragSkillGhost.style.left = `${e.clientX - 24}px`;
        dragSkillGhost.style.top = `${e.clientY - 24}px`;
    }
});

function clearSkillDrag() {
    draggedSkill = null;
    if (dragSkillGhost) { dragSkillGhost.remove(); dragSkillGhost = null; }
    document.querySelectorAll('.skill-slot').forEach(el => el.classList.remove('dragging'));
}

// Add Right-click to clear hotbar slot in updateSkillBar
// I'll add this inside updateSkillBar in the next turn if I missed it.
// Actually I'll update the loop now.
