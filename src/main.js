/**
 * MAIN.JS â€” Dark Realm entry point
 * Wires all systems together: menu â†’ game loop â†’ rendering â†’ UI
 */
import { bus } from './engine/EventBus.js';
import { Renderer, Assets } from './engine/renderer.js';
import { Camera } from './engine/Camera.js';
import { Input } from './engine/Input.js';
import { MobileControls } from './ui/MobileControls.js';
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
import { Vendor } from './vendorSystem.js';
import { VendorUI } from './ui/vendorUI.js';
import { campaign } from './systems/campaignSystem.js';

// Expose globals for external modules
window.loot = loot;
window.Vendor = Vendor;
window.VendorUI = VendorUI;
window.calculateSellPrice = calculateSellPrice;
window.getItemHtml = getItemHtml;
window.showTooltip = showTooltip;
window.hideTooltip = hideTooltip;
window.renderInventory = renderInventory;
window.updateHud = updateHud;
window.addCombatLog = addCombatLog;

import { RUNEWORDS } from './data/runes.js';

// â”€â”€â”€ GLOBALS â”€â”€â”€
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

// â”€â”€â”€ Phase 12 GLOBALS â”€â”€â”€
let timeScale = 1.0;
let uiActiveBoss = null;
let lastBossWarnTime = 0;

// â”€â”€â”€ RIFT GLOBALS â”€â”€â”€
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
    
    // Guardian Pool
    const guardians = [
        { name: 'Andariel', icon: 'boss_andariel', hpMult: 1.5, dmgMult: 1.2 },
        { name: 'Duriel', icon: 'boss_duriel', hpMult: 1.8, dmgMult: 1.3 },
        { name: 'Mephisto', icon: 'boss_mephisto', hpMult: 1.6, dmgMult: 1.4 },
        { name: 'Diablo', icon: 'boss_diablo', hpMult: 2.0, dmgMult: 1.5 },
        { name: 'The Cow King', icon: 'boss_cow_king', hpMult: 2.2, dmgMult: 1.6 },
        { name: 'The Butcher', icon: 'boss_the_butcher', hpMult: 1.8, dmgMult: 1.8 }
    ];
    
    const base = guardians[Math.floor(Math.random() * guardians.length)];
    const depth = zoneLevel - 6;

    // Choose location near player
    const angle = Math.random() * Math.PI * 2;
    const tx = player.x + Math.cos(angle) * 150;
    const ty = player.y + Math.sin(angle) * 150;

    const bossData = {
        x: tx, y: ty,
        type: 'boss',
        level: zoneLevel,
        name: `${base.name}, Guardian of Depth ${depth}`,
        icon: base.icon,
        hpMult: (15 + depth * 2) * base.hpMult,
        dmgMult: (3 + depth * 0.2) * base.dmgMult,
        isRiftGuardian: true
    };

    const boss = new Enemy(bossData, zoneLevel);
    enemies.push(boss);

    bus.emit('log:add', { text: `THE RIFT GUARDIAN HAS ARRIVED: ${boss.name}!`, cls: 'log-crit' });
    if (typeof startAmbientBoss === 'function') startAmbientBoss();
}
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

// â”€â”€â”€ DOM REFS â”€â”€â”€
const $ = id => document.getElementById(id);

// â”€â”€â”€ MENU PARTICLES â”€â”€â”€
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

// â”€â”€â”€ CLASS SELECTION GRID â”€â”€â”€
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

// â”€â”€â”€ START GAME â”€â”€â”€
function startGame(slotId = null, loadPlayerData = null, charName = null) {
    if (!selectedClass && !loadPlayerData) return;

    if (loadPlayerData) {
        // Loading existing character
        selectedClass = loadPlayerData.classId;
        zoneLevel = loadPlayerData.zoneLevel || 0;
        activeSlotId = loadPlayerData.slotId;
        campaign.deserialize(loadPlayerData.campaign);
    } else {
        // New character
        zoneLevel = 0; // Start in Town
        activeSlotId = slotId || SaveSystem.newSlotId();
        campaign.reset();

        // Starting Gear for new characters
        if (!loadPlayerData) {
            player = new Player(selectedClass);
            window.player = player;
            Vendor.init(loot, player);
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

    // Determine zoom level based on screen width
    const adjustZoom = () => {
        if (!camera) return;
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (width >= 1024) {
            camera.zoom = 2.0; // Desktop
        } else if (width > height) {
            camera.zoom = 1.3; // Mobile Landscape (Cinema / Wide view)
        } else {
            camera.zoom = 1.1; // Mobile Portrait (Panoramic view)
        }
    };

    renderer = new Renderer(canvas);
    camera = new Camera(renderer.width, renderer.height, 2.0); // Default to 2.0 initially
    adjustZoom(); // Apply correct zoom immediately

    window.addEventListener('resize', adjustZoom);

    input = new Input(canvas);
    window.mobileControls = new MobileControls(input);

    // Create Act Cleared Splash Container if missing
    if (!$('act-splash-container')) {
        const splash = document.createElement('div');
        splash.id = 'act-splash-container';
        splash.className = 'act-cleared-splash';
        document.body.appendChild(splash);
    }

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
    for (const e of enemies) { activeRiftMods.forEach(mod => { if (mod.hp) e.maxHp = Math.round(e.maxHp * mod.hp); if (mod.dmg) e.dmg = Math.round(e.dmg * mod.dmg); if (mod.speed) e.moveSpeed *= mod.speed; }); e.hp = e.maxHp; }

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
        campaign: campaign.serialize(),
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

// â”€â”€â”€ GAME LOOP â”€â”€â”€
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
    if (window.mobileControls) window.mobileControls.update(player);

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

    // Update entities â€” pass dungeon for collision checks
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

    // Dropped items (with loot filter and non-overlapping labels)
    const labelRects = [];
    for (const di of droppedItems) {
        if (lootFilter >= 1 && (!di.rarity || di.rarity === 'normal')) continue;
        if (lootFilter >= 2 && di.rarity === 'magic') continue;

        const ctx = renderer.ctx;

        // 1. Rarity Glow (Pulse)
        if (di.rarity !== 'normal') {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            let color = di.rarity === 'unique' ? 'rgba(232, 160, 32, 0.3)' : di.rarity === 'set' ? 'rgba(0, 255, 0, 0.25)' : di.rarity === 'rare' ? 'rgba(240, 208, 48, 0.2)' : 'rgba(64, 128, 255, 0.15)';
            if (di.isQuestItem) color = 'rgba(76, 201, 240, 0.4)';
            
            const pulse = 0.8 + Math.sin(lastTime * 0.005) * 0.2;
            const radial = ctx.createRadialGradient(di.x, di.y, 2, di.x, di.y, 14 * pulse);
            radial.addColorStop(0, color);
            radial.addColorStop(1, 'transparent');
            ctx.fillStyle = radial;
            ctx.beginPath(); ctx.arc(di.x, di.y, 14 * pulse, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // 2. Pro Ground Sprite (2.5D tilt & Shadow)
        ctx.save();
        // Drop Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(di.x + 2, di.y + 2, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
        
        // Tilt icon to look like it's on the floor
        ctx.translate(di.x, di.y);
        ctx.rotate(0.2); // 10-ish degree tilt
        renderer.drawSprite(di.icon, 0, 0, 20); // Larger 20px icon
        ctx.restore();

        // 3. Smart Non-Overlapping Labels (Diablo II Style)
        renderer.ctx.font = 'bold 10px "Exocet", "Cinzel", serif';
        const labelText = di.name;
        const textWidth = renderer.ctx.measureText(labelText).width;
        const padding = 5;
        const lw = textWidth + padding * 2;
        const lh = 15;

        let lx = di.x - lw / 2;
        let ly = di.y + 14;

        // Label Stacking Logic
        let attempts = 0;
        let overlapping = true;
        while (overlapping && attempts < 15) {
            overlapping = false;
            for (const r of labelRects) {
                if (!(lx + lw < r.x || lx > r.x + r.w || ly + lh < r.y || ly > r.y + r.h)) {
                    ly += lh + 1; 
                    overlapping = true;
                    break;
                }
            }
            attempts++;
        }
        
        const finalRect = { x: lx, y: ly, w: lw, h: lh };
        labelRects.push(finalRect);
        di.labelRect = finalRect; 

        // Draw Label Box
        renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        const rCol = di.rarity === 'unique' ? '#e8a020' : di.rarity === 'set' ? '#00ff00' : di.rarity === 'rare' ? '#f0d030' : di.rarity === 'magic' ? '#4080ff' : '#aaa';
        renderer.ctx.strokeStyle = rCol;
        renderer.ctx.lineWidth = 1.5;
        renderer.ctx.fillRect(lx, ly, lw, lh);
        renderer.ctx.strokeRect(lx, ly, lw, lh);

        // Draw Name
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillStyle = rCol;
        renderer.ctx.fillText(labelText, di.x, ly + 11.5);
    }

    // --- Phase 29: World Time Overlay (Post-Objects) ---
    renderWorldOverlay(renderer.ctx, renderer.width, renderer.height);

    for (const g of droppedGold) {
        renderer.fillCircle(g.x, g.y, 4, '#ffd700');
        renderer.strokeCircle(g.x, g.y, 4, '#c8972a', 1);
        renderer.ctx.font = 'bold 9px "Cinzel", serif';
        renderer.ctx.textAlign = 'center';

        // Gold label box
        const goldText = `${g.amount}`;
        const tw = renderer.ctx.measureText(goldText).width;
        renderer.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        renderer.ctx.fillRect(g.x - tw / 2 - 2, g.y + 6, tw + 4, 10);

        renderer.ctx.fillStyle = '#ffd700';
        renderer.ctx.fillText(goldText, g.x, g.y + 14);
    }

    const entities = [...(enemies || []), player].filter(e => e).sort((a, b) => a.y - b.y);
    for (const e of entities) {
        if (e.isPlayer) {
            // Draw high-quality dynamic shadow
            renderer.drawShadow(e.x, e.y + 6, 8, 0.4);

            // === DYNAMIC CLASS VFX ===
            if (e.classId === 'shaman' || e.hitFlashTimer > 0) {
                renderer.drawVFX('lightning', e.x, e.y, 18, lastTime);
            }
            if (e.classId === 'warlock' || e.classId === 'necromancer') {
                renderer.drawVFX('aura_shadow', e.x, e.y, 18, lastTime);
            }
            if (e.classId === 'sorceress') {
                renderer.ctx.save();
                renderer.ctx.shadowBlur = 15;
                renderer.ctx.shadowColor = '#4080ff';
                renderer.ctx.restore();
            }
            if (e.classId === 'paladin') {
                renderer.ctx.save();
                renderer.ctx.shadowBlur = 10;
                renderer.ctx.shadowColor = '#ffd700';
                renderer.ctx.restore();
            }

            // Draw aura ring if active
            if (e.activeAura) {
                const auraColors = {
                    might_aura: '#ffd700', prayer_aura: '#40c040', holy_fire_aura: '#ff4000',
                    resist_all: '#4080ff', vigor: '#ffffff', fanaticism: '#ffa000', conviction: '#a040ff'
                };
                const auraColor = auraColors[e.activeAura] || '#ffe880';
                const pulse = 0.4 + Math.sin(lastTime * 0.006) * 0.2;
                const auraRadius = 28 + Math.sin(lastTime * 0.004) * 4;

                renderer.ctx.save();
                renderer.ctx.globalAlpha = pulse;
                renderer.ctx.strokeStyle = auraColor;
                renderer.ctx.lineWidth = 2;
                renderer.ctx.shadowColor = auraColor;
                renderer.ctx.shadowBlur = 12;
                renderer.ctx.beginPath();
                renderer.ctx.ellipse(e.x, e.y + 2, auraRadius, auraRadius * 0.4, 0, 0, Math.PI * 2);
                renderer.ctx.stroke();
                renderer.ctx.restore();
            }

            renderer.drawAnim(`class_${e.classId}`, e.x, e.y - 4, 18, e.animState, e.facingDir, lastTime, null, e.equipment, e.hitFlashTimer);
            e.renderMinions(renderer, lastTime);
        } else {
            // Mercenary specific icon handling
            if (e.isMercenary) {
                const mercIcons = {
                    'Rogue': 'class_rogue',
                    'Desert Warrior': 'class_warrior',
                    'Iron Wolf': 'class_shaman',
                    'Mercenary Warrior': 'mercenary_warrior',
                    'Mercenary Archer': 'mercenary_archer'
                };
                e.icon = mercIcons[e.className] || e.icon;
            }
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

    renderer.ctx.restore(); // END CAMERA TRANSLATION (Switching to Screen Space for UI)

    // Phase 15 & 16: Unified FX & Combat Text Layer
    // We use fx.renderScreen to handle all particles and floating text in a single pass
    // that correctly accounts for camera coordinates and mobile scaling.
    renderer.ctx.save();
    renderer.ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (fx && fx.renderScreen) {
        fx.renderScreen(renderer.ctx, camera);
    }

    renderer.ctx.restore();

    bus.emit('render:effects', { renderer, lastTime });

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
            campaign: campaign.serialize(),
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

    // â”€â”€â”€ MINIMAP â”€â”€â”€
    // Render minimap (top right)
    renderMinimap();

    // Render Full Map (TAB)
    if (showFullMap && explored) {
        const mw = renderer.width, mh = renderer.height;
                bus.emit('audio:play', { url: 'assets/audio/gold.mp3', volume: 0.3 });
        const ts = dungeon.tileSize;
        const mw = renderer.width, mh = renderer.height;
    if (showFullMap && explored) {
    // Render Full Map (TAB)

    renderMinimap();
    // Render minimap (top right)
    // â”€â”€â”€ MINIMAP â”€â”€â”€

    renderer.ctx.fillRect(0, 0, renderer.width, renderer.height);
    renderer.ctx.fillStyle = grd;

    grd.addColorStop(1, `rgba(0, 0, 0, ${minAlpha})`);   // Outer darkness
    grd.addColorStop(0.7, `rgba(0, 0, 0, ${minAlpha * 0.5})`);  // Atmospheric penumbra
    grd.addColorStop(0.3, 'rgba(0, 0, 0, 0)');    // Wider clear area
    grd.addColorStop(0, 'rgba(0, 0, 0, 0)');      // Full visibility at center

    const minAlpha = (zoneLevel === 0) ? 0.6 : (isBossZone ? 0.8 : 0.95);
    // In town or boss room, make it slightly brighter overall

    const grd = renderer.ctx.createRadialGradient(cx, cy, 50, cx, cy, radius);

    const radius = Math.max(100, baseRadius + pulse);
    const pulse = Math.sin(lastTime * 0.002) * 15;
    const baseRadius = 450 + (player.lightRadius || 0) * 50;
    // Dynamic pulsing and gear-based light radius

    const cy = renderer.height / 2;
    const cx = renderer.width / 2;
    // Premium Ambient Lighting Mask (affecting everything)

    renderer.text(`FPS: ${Math.round(1000 / dt)}`, renderer.width - 20, renderer.height - 20, { size: 10, align: 'right', color: '#555' });

    }
        addCombatLog('Progress Saved.', 'log-info');
        });
            achievements: Array.from(unlockedAchievements)
            campaign: campaign.serialize(),
            cube,
            mercenary: mercenary ? mercenary.serialize() : null,
            waypoints: [...discoveredWaypoints],
            difficulty: window._difficulty,
        SaveSystem.saveSlot(activeSlotId, player, zoneLevel, stash, {
        lastSaveTime = timestamp;
    if (timestamp - lastSaveTime > 30000 && activeSlotId) {
    // Auto-save every 30 seconds

    updateHud();

    }
        renderer.text(dialogue.text, renderer.width / 2, renderer.height - 120, { size: 16, align: 'center', color: '#ffd700' });
    if (dialogue) {

    camera.reset(renderer.ctx);

    }
        renderer.applyLighting(sx, sy, (baseRadius + flicker) * camera.zoom, ambient);

        }
            ambient = 'rgba(60, 0, 0, 0.95)'; // Uber
        } else if (zoneLevel === 100) {
            ambient = 'rgba(20, 4, 4, 0.90)'; // Hell
        } else if (zoneLevel >= 5 && zoneLevel <= 25) {
            ambient = 'rgba(10, 20, 10, 0.85)'; // Catacombs
        } else if (zoneLevel === 4) {
            ambient = 'rgba(8, 12, 18, 0.70)'; // Blood Moor
        } else if (zoneLevel <= 3) {
            ambient = 'rgba(0, 0, 4, 0.15)';
            // Very subtle ambient in town to let the "player light" still show a bit
        if (zoneLevel === 0) {

        let ambient = 'rgba(0, 0, 0, 0.85)'; // Default

        const flicker = Math.sin(Date.now() / 150) * 8;
        const baseRadius = (150 + (player.lightRadius || 0));
        // Base radius and flicker (Tightened for a distinct circle effect)

        const sy = screen.y;
        const sx = screen.x;
        const screen = camera.toScreen(player.x, player.y - 15);
        // Use the camera's source of truth for screen positioning
    if (player && renderer && camera) {
    // --- Phase 20: Narrative Vision: Atmospheric Lighting Pass ---

    bus.emit('render:effects', { renderer, lastTime });

    renderer.ctx.restore();

    }
        fx.renderScreen(renderer.ctx, camera);
    if (fx && fx.renderScreen) {

    renderer.ctx.setTransform(1, 0, 0, 1, 0, 0);
    renderer.ctx.save();
    // that correctly accounts for camera coordinates and mobile scaling.
    // We use fx.renderScreen to handle all particles and floating text in a single pass
    // Phase 15 & 16: Unified FX & Combat Text Layer

    renderer.ctx.restore(); // END CAMERA TRANSLATION (Switching to Screen Space for UI)

    aoeZones.forEach(a => a.render(renderer, lastTime));
    projectiles.forEach(p => p.render(renderer, lastTime));

    for (const obj of gameObjects) obj.render(renderer, lastTime);
    }
        }
            renderer.ctx.restore();
            renderer.ctx.fill();
            renderer.ctx.arc(obj.x, obj.y, 25, 0, Math.PI * 2);
            renderer.ctx.beginPath();
            renderer.ctx.fillStyle = radial;
            radial.addColorStop(1, 'transparent');
            radial.addColorStop(0, `${color} ${pulse})`);
            const radial = renderer.ctx.createRadialGradient(obj.x, obj.y, 4, obj.x, obj.y, 25);
            renderer.ctx.globalCompositeOperation = 'screen';
            renderer.ctx.save();
            const color = obj.type === 'shrine' ? 'rgba(0, 255, 255,' : 'rgba(255, 215, 0,';
            const pulse = 0.4 + Math.sin(lastTime * 0.004) * 0.2;
        if (obj.type === 'shrine' || obj.type === 'waypoint' || obj.type === 'altar') {
    for (const obj of gameObjects) {
    // --- Phase 3.1: Pulsing Interactive Objects ---

    }
        n.render(renderer, lastTime);
        }
            renderer.ctx.fill();
            renderer.ctx.ellipse(n.x, n.y + 4, 12, 5, 0, 0, Math.PI * 2);
            renderer.ctx.beginPath();
            renderer.ctx.fillStyle = `rgba(216, 176, 104, ${pulse * 0.2})`;
            const pulse = 0.5 + Math.sin(lastTime * 0.005) * 0.3;
        if (zoneLevel === 0) {
        // Subtle glow for town NPCs
    for (const n of npcs) {

    }
        renderer.ctx.fillText(mercenary.name, mercenary.x, mercenary.y - 18);
        renderer.ctx.fillStyle = '#4caf50';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.font = '5px Cinzel, serif';
        renderer.ctx.fillRect(mercenary.x - bw / 2, mercenary.y - 14, bw * (mercenary.hp / mercenary.maxHp), 2);
        renderer.ctx.fillStyle = '#4caf50';
        renderer.ctx.fillRect(mercenary.x - bw / 2, mercenary.y - 14, bw, 2);
        renderer.ctx.fillStyle = '#333';
        const bw = 18;
        // HP bar above head
        renderer.drawSprite('class_rogue', mercenary.x, mercenary.y - 4, 16);
        renderer.ctx.fill();
        renderer.ctx.ellipse(mercenary.x, mercenary.y + 6, 6, 3, 0, 0, Math.PI * 2);
        renderer.ctx.beginPath();
        renderer.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    if (mercenary && mercenary.hp > 0) {
    // Render mercenary

    }
        }
            e.render(renderer, lastTime);
            }
                e.icon = mercIcons[e.className] || e.icon;
                };
                    'Mercenary Archer': 'mercenary_archer'
                    'Mercenary Warrior': 'mercenary_warrior',
                    'Iron Wolf': 'class_shaman',
                    'Desert Warrior': 'class_warrior',
                    'Rogue': 'class_rogue',
                const mercIcons = {
            if (e.isMercenary) {
            // Mercenary specific icon handling
        } else {
            e.renderMinions(renderer, lastTime);
            renderer.drawAnim(`class_${e.classId}`, e.x, e.y - 4, 18, e.animState, e.facingDir, lastTime, null, e.equipment, e.hitFlashTimer);

            }
                renderer.ctx.restore();
                renderer.ctx.stroke();
                renderer.ctx.ellipse(e.x, e.y + 2, auraRadius, auraRadius * 0.4, 0, 0, Math.PI * 2);
                renderer.ctx.beginPath();
                renderer.ctx.shadowBlur = 12;
                renderer.ctx.shadowColor = auraColor;
                renderer.ctx.lineWidth = 2;
                renderer.ctx.strokeStyle = auraColor;
                renderer.ctx.globalAlpha = pulse;
                renderer.ctx.save();

                const auraRadius = 28 + Math.sin(lastTime * 0.004) * 4;
                const pulse = 0.4 + Math.sin(lastTime * 0.006) * 0.2;
                const auraColor = auraColors[e.activeAura] || '#ffe880';
                };
                    resist_all: '#4080ff', vigor: '#ffffff', fanaticism: '#ffa000', conviction: '#a040ff'
                    might_aura: '#ffd700', prayer_aura: '#40c040', holy_fire_aura: '#ff4000',
                const auraColors = {
            if (e.activeAura) {
            // Draw aura ring if active

            }
                renderer.ctx.restore();
                renderer.ctx.shadowColor = '#ffd700';
                renderer.ctx.shadowBlur = 10;
                renderer.ctx.save();
            if (e.classId === 'paladin') {
            }
                renderer.ctx.restore();
                renderer.ctx.shadowColor = '#4080ff';
                renderer.ctx.shadowBlur = 15;
                renderer.ctx.save();
            if (e.classId === 'sorceress') {
            }
                renderer.drawVFX('aura_shadow', e.x, e.y, 18, lastTime);
            if (e.classId === 'warlock' || e.classId === 'necromancer') {
            }
                renderer.drawVFX('lightning', e.x, e.y, 18, lastTime);
            if (e.classId === 'shaman' || e.hitFlashTimer > 0) {
            // === DYNAMIC CLASS VFX ===

            renderer.drawShadow(e.x, e.y + 6, 8, 0.4);
            // Draw high-quality dynamic shadow
        if (e.isPlayer) {
    for (const e of entities) {
    const entities = [...(enemies || []), player].filter(e => e).sort((a, b) => a.y - b.y);

    }
        renderer.ctx.fillText(goldText, g.x, g.y + 14);
        renderer.ctx.fillStyle = '#ffd700';

        renderer.ctx.fillRect(g.x - tw / 2 - 2, g.y + 6, tw + 4, 10);
        renderer.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        const tw = renderer.ctx.measureText(goldText).width;
        const goldText = `${g.amount}`;
        // Gold label box

        renderer.ctx.textAlign = 'center';
        renderer.ctx.font = 'bold 9px "Cinzel", serif';
        renderer.strokeCircle(g.x, g.y, 4, '#c8972a', 1);
        renderer.fillCircle(g.x, g.y, 4, '#ffd700');
    for (const g of droppedGold) {

    renderWorldOverlay(renderer.ctx, renderer.width, renderer.height);
    // --- Phase 29: World Time Overlay (Post-Objects) ---

    }
        renderer.ctx.fillText(labelText, di.x, ly + 11.5);
        renderer.ctx.fillStyle = rCol;
        renderer.ctx.textAlign = 'center';
        // Draw Name

        renderer.ctx.strokeRect(lx, ly, lw, lh);
        renderer.ctx.fillRect(lx, ly, lw, lh);
        renderer.ctx.lineWidth = 1.5;
        renderer.ctx.strokeStyle = rCol;
        const rCol = di.rarity === 'unique' ? '#e8a020' : di.rarity === 'set' ? '#00ff00' : di.rarity === 'rare' ? '#f0d030' : di.rarity === 'magic' ? '#4080ff' : '#aaa';
        renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        // Draw Label Box

        di.labelRect = finalRect; 
        labelRects.push(finalRect);
        const finalRect = { x: lx, y: ly, w: lw, h: lh };
        
        }
            attempts++;
            }
                }
                    break;
                    overlapping = true;
                    ly += lh + 1; 
                if (!(lx + lw < r.x || lx > r.x + r.w || ly + lh < r.y || ly > r.y + r.h)) {
            for (const r of labelRects) {
            overlapping = false;
        while (overlapping && attempts < 15) {
        let overlapping = true;
        let attempts = 0;
        // Label Stacking Logic

        let ly = di.y + 14;
        let lx = di.x - lw / 2;

        const lh = 15;
        const lw = textWidth + padding * 2;
        const padding = 5;
        const textWidth = renderer.ctx.measureText(labelText).width;
        const labelText = di.name;
        renderer.ctx.font = 'bold 10px "Exocet", "Cinzel", serif';
        // 3. Smart Non-Overlapping Labels (Diablo II Style)

        ctx.restore();
        renderer.drawSprite(di.icon, 0, 0, 20); // Larger 20px icon
        ctx.rotate(0.2); // 10-ish degree tilt
        ctx.translate(di.x, di.y);
        // Tilt icon to look like it's on the floor
        
        ctx.beginPath(); ctx.ellipse(di.x + 2, di.y + 2, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        // Drop Shadow
        ctx.save();
        // 2. Pro Ground Sprite (2.5D tilt & Shadow)

        }
            ctx.restore();
            ctx.beginPath(); ctx.arc(di.x, di.y, 14 * pulse, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = radial;
            radial.addColorStop(1, 'transparent');
            radial.addColorStop(0, color);
            const radial = ctx.createRadialGradient(di.x, di.y, 2, di.x, di.y, 14 * pulse);
            const pulse = 0.8 + Math.sin(lastTime * 0.005) * 0.2;
            
            if (di.isQuestItem) color = 'rgba(76, 201, 240, 0.4)';
            let color = di.rarity === 'unique' ? 'rgba(232, 160, 32, 0.3)' : di.rarity === 'set' ? 'rgba(0, 255, 0, 0.25)' : di.rarity === 'rare' ? 'rgba(240, 208, 48, 0.2)' : 'rgba(64, 128, 255, 0.15)';
            ctx.globalCompositeOperation = 'screen';
            ctx.save();
        if (di.rarity !== 'normal') {
        // 1. Rarity Glow (Pulse)

        const ctx = renderer.ctx;

        if (lootFilter >= 2 && di.rarity === 'magic') continue;
        if (lootFilter >= 1 && (!di.rarity || di.rarity === 'normal')) continue;
    for (const di of droppedItems) {
    const labelRects = [];
    // Dropped items (with loot filter and non-overlapping labels)

    }
        renderer.ctx.restore();
        }
            renderer.ctx.fill();
            renderer.ctx.arc(p.x, p.y, Math.max(0.5, size), 0, Math.PI * 2);
            renderer.ctx.beginPath();
            const size = 2 - (i / player.path.length); // Tapering trail
            const p = player.path[i];
        for (let i = 0; i < player.path.length; i++) {
        renderer.ctx.fillStyle = '#ffff00';
        renderer.ctx.globalAlpha = 0.4;
        renderer.ctx.save();
    if (player.path && player.path.length > 0) {
    // Path Breadcrumbs (Phase 31 Mastery)

    camera.apply(renderer.ctx);

    dungeon.render(renderer, camera);
    renderer.clear();
    // Render

    }
        }
            nextZone();
        } else {
            bus.emit('combat:log', { text: "The ancient evil blocks your path forward!", type: 'log-dmg' });
            player.y -= (dungeon.exitPos.y - player.y) * 0.1;
            player.x -= (dungeon.exitPos.x - player.x) * 0.1;
            // Move player back slightly to prevent spam
            if (player.path) player.path = []; // stop moving
        if (isZoneLocked) {
    if (distToExit < 20) {
    const distToExit = Math.sqrt((player.x - dungeon.exitPos.x) ** 2 + (player.y - dungeon.exitPos.y) ** 2);

    }
        return;
        checkDeaths(); // Triggers final sequence
    if (player.hp <= 0 && state === 'GAME') {

    }
        }
            updateHud();
            droppedGold.splice(i, 1);
        if (droppedGold[i]._pickedByPet) {
    for (let i = droppedGold.length - 1; i >= 0; i--) {
    // Secondary cleanup for items picked by pet
    }
        activePet.update(dt, player, droppedGold, droppedItems);
    if (activePet) {
    // Update Pets
    }
        }
            }
                }
                    break;
                    nextZone(o.targetZone);
                    addCombatLog('Entering Portal...', 'log-level');
                    // Direct targetZone objects
                } else {
                    }
                        break;
                        nextZone(res.targetZone);
                        addCombatLog('Entering Portal...', 'log-level');
                    if (res && res.type === 'PORTAL') {
                    const res = o.interact(player);
                if (o.type === 'portal') {
            if (dist < 20) {
            const dist = Math.sqrt((player.x - o.x) ** 2 + (player.y - o.y) ** 2);
        if (o.type === 'portal' || o.type === 'uber_portal' || o.type === 'rift_exit') {
    for (const o of gameObjects) {
    // Check portal walk-over collisions

    checkAchievements();
    // Achievement checker (every frame is fine, checks are cheap)

    checkDeaths();

    }
        }
            updateHud();
            mercenary._deadNotified = true;
            playDeathSfx();
            addCombatLog(`Your companion ${mercenary.name} has fallen!`, 'log-dmg');
        } else if (!mercenary._deadNotified) {
            mercenary._deadNotified = false;
            mercenary.update(dt, player, enemies, dungeon);
        if (mercenary.hp > 0) {
    if (mercenary) {
    // Mercenary follow & attack AI

    }
        if (hpBar) hpBar.classList.add('hidden');
    } else {
        }
            boss.isEnraged = true;
            // Subtle visual change (flag for renderer)
            addCombatLog(`${boss.name} enters a FURY!`, 'log-crit');
            fx.emitBurst(boss.x, boss.y, '#ff0000', 40, 4);
            fx.shake(1000, 10);
            boss.atkSpeed *= 1.3;
            boss.moveSpeed *= 1.4;
            boss._phase2Triggered = true;
        if (pct < 50 && !boss._phase2Triggered) {
        // --- Phase 3.1: Boss Phase Triggers ---

        $('boss-name').textContent = boss.name || 'Act Boss';
        $('boss-hp-text').textContent = `${Math.ceil(pct)}%`;
        $('boss-hp-fill').style.width = `${pct}%`;
        const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
        hpBar.classList.remove('hidden');
    if (boss && boss.hp > 0 && state === 'GAME') {
    const hpBar = $('boss-hp-bar');
    const boss = enemies.find(e => e.type === 'boss');
    // Boss check
    // Boss check

    }
        }
            activeWaypointObj = null;
            activeDialogueNpc = null;
        } else {
            }
                activeWaypointObj = null;
                activeDialogueNpc = null;
                picker.remove();
            if (d > 120) {
            const d = Math.sqrt((player.x - currentMenuFocus.x) ** 2 + (player.y - currentMenuFocus.y) ** 2);
            // Auto-close if too far

            picker.style.top = `${screen.y - 180}px`;
            picker.style.left = `${screen.x - 110}px`;
            const screen = camera.toScreen(currentMenuFocus.x, currentMenuFocus.y);
        if (picker) {
        const picker = document.getElementById('dialogue-picker');
    if (currentMenuFocus) {
    const currentMenuFocus = activeDialogueNpc || activeWaypointObj;
    // Update Floating Dialogue Position

    }
        }
            }
                renderInventory();
                updateHud();
                droppedGold.splice(i, 1);
                bus.emit('gold:pickup', { amount: dg.amount });
                addCombatLog(`Auto-picked ${dg.amount} Gold`, 'log-heal');
                player.gold += dg.amount;
            if (dist < 45) {
            const dist = Math.sqrt((player.x - dg.x) ** 2 + (player.y - dg.y) ** 2);
            const dg = droppedGold[i];
        for (let i = droppedGold.length - 1; i >= 0; i--) {
    if (player && droppedGold.length > 0) {
    // Gold Auto-Pickup (radius 45px)

    }
        input.click = null;
        checkInteractions(input.click);
    if (input.click) {

    }
        if (dialogue.timer <= 0) dialogue = null;
        dialogue.timer -= dt;
    if (dialogue) {

    }
        }
            floatingTexts.splice(i, 1);
        if (ft.life <= 0) {
        ft.life -= dt;
        ft.y -= 30 * dt; // Float up
        const ft = floatingTexts[i];
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
    // Phase 15: Update Floating Text

    }
        }
            if (fx && Math.random() < 0.1) fx.emitLootBeam(drop.x, drop.y, color);
            const color = drop.rarity === 'unique' ? '#bf642f' : '#00ff00';
        if (drop.rarity === 'unique' || drop.rarity === 'set') {
    for (const drop of droppedItems) {
    // Update Loot Beams (Tick the particle system for persistence)

    updateStatuses(statusTargets, dt);
    if (mercenary) statusTargets.push(mercenary);
    const statusTargets = [player, ...enemies, ...npcs];
    // Update Statuses, DoTs, and physics (knockback)

    aoeZones = aoeZones.filter(a => a && a.active);
    });
        if (a && a.update) a.update(dt, enemies, player);
    aoeZones.forEach(a => {

    projectiles = projectiles.filter(p => p && p.active);
    });
        if (p && p.update) p.update(dt, enemies, player, dungeon, (aoe) => { if (aoe) aoeZones.push(aoe); });
    projectiles.forEach(p => {
    // Update Projectiles & AoEs

    if (player) player.updateMinions(dt, enemies, dungeon);
    if (activePet) activePet.update(dt, player, droppedGold);
    for (const n of npcs) n.update(dt);
    for (const e of (enemies || [])) e.update(dt, player, dungeon, enemies);
    // Update entities â€” pass dungeon for collision checks

    }
        camera.update(dt);
        camera.h = renderer.height;
        camera.w = renderer.width;
    if (camera) {
    }
        // Moved to centralized Atmospheric Weather System block above

        }
            player.mp = Math.min(player.maxMp, player.mp + mpRegen);
            const mpRegen = player.maxMp * 0.003 * dt + (player.manaRegenPerSec || 0) * dt;
        if (player.mp < player.maxMp && player.hp > 0) {
        // MP Regen (always, slower) + gear-based regen
        }
            if (hpRegen > 0) player.hp = Math.min(player.maxHp, player.hp + hpRegen);
            }
                hpRegen += player.maxHp * 0.005 * dt; // Passive OOC regen
            if (performance.now() - lastHitTime > 5000) {

            }
                // Apply invisible debuff or handle in calcDamage
            if (cursedMod) {
            const cursedMod = activeRiftMods.find(m => m.id === 'cursed');
            // Rift Mod: Cursed (Armor/Res reduction)

            let hpRegen = (player.lifeRegenPerSec || 0) * dt;
        if (player.hp > 0 && player.hp < player.maxHp) {
        // HP Regen out of combat (passive) + gear-based regen (always active)

        fx.update(dt * 1000); // Particle update expects ms
        player.update(dt, input, enemies, dungeon, (aoe) => aoeZones.push(aoe));
    if (player) {

    }
        }
            window.fx.emitMist(renderer.width, renderer.height);
        } else if (theme === 'wilderness') {
            window.fx.emitRain(renderer.width, renderer.height);
        } else if (theme === 'jungle' || theme === 'temple') {
            window.fx.emitEmbers(renderer.width, renderer.height);
        } else if (theme === 'hell') {
            window.fx.emitSand(renderer.width, renderer.height);
        } else if (theme === 'desert') {
            window.fx.emitBlizzard(renderer.width, renderer.height);
        if (theme === 'snow') {
        const theme = window.currentTheme;
    if (window.fx && player) {
    // --- Phase 3.1: Atmospheric Weather System ---

    if (window.mobileControls) window.mobileControls.update(player);
    if (input) input.update();

    window.isNight = (hour >= 20 || hour < 6);
    const hour = worldTime / 60;
    worldTime = (worldTime + dt * 10) % 1440;
    // --- Phase 29: World Time Tick (1 sec real = 10 game mins) ---
    // Update

    uiActiveBoss = closestBoss;
    }
        }
            fx.emitBossAura(e.x, e.y, e.color || '#f0f');
            // Emit aura
            }
                closestBoss = e;
                minDist = d;
            if (d < minDist) {
            const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (e.type === 'boss' && e.hp > 0) {
    for (const e of enemies) {
    let minDist = 400; // Activation range
    let closestBoss = null;
    // Boss Proximity Logic

    }
        timeScale = Math.min(1.0, timeScale + rawDt * 0.8);
    if (timeScale < 1.0) {
    // TimeScale Recovery (Lerp back to 1.0)

    lastTime = timestamp;
    const dt = rawDt * timeScale;
    const rawDt = Math.min(0.1, (timestamp - lastTime) / 1000);
    if (state !== 'GAME') return;
function gameLoop(timestamp) {
// â”€â”€â”€ GAME LOOP â”€â”€â”€

}
    requestAnimationFrame(gameLoop);
    lastTime = performance.now();

    explored = Array.from({ length: dungeon.height }, () => Array(dungeon.width).fill(false));
    // Init explored for minimap

    }
        stopAmbient(); // Town is quiet for now
    } else {
        startAmbientDungeon();
    } else if (zoneLevel > 0) {
        startAmbientBoss();
    if (isBossZone) {
    // Initial ambient audio

    });
        achievements: Array.from(unlockedAchievements)
        campaign: campaign.serialize(),
        cube,
        mercenary: mercenary ? mercenary.serialize() : null,
        waypoints: [...discoveredWaypoints],
        difficulty: window._difficulty,
    SaveSystem.saveSlot(activeSlotId, player, zoneLevel, stash, {
    // Initial save

    if (bossBar && !isBossZone) bossBar.classList.add('hidden');
    const bossBar = $('boss-hp-bar');
    const isBossZone = zoneLevel === 5 || zoneLevel === 10 || zoneLevel === 15 || zoneLevel === 20 || (zoneLevel > 21 && zoneLevel % 5 === 0);
    // Ensure boss bar hidden unless zone 5 or rift boss

    updateRiftHud();
    updateHud();

    dialogue = null;
    droppedGold = [];
    droppedItems = [];

    for (const e of enemies) { activeRiftMods.forEach(mod => { if (mod.hp) e.maxHp = Math.round(e.maxHp * mod.hp); if (mod.dmg) e.dmg = Math.round(e.dmg * mod.dmg); if (mod.speed) e.moveSpeed *= mod.speed; }); e.hp = e.maxHp; }
    // Apply difficulty & Rift scaling to enemies

    enemies = dungeon.enemySpawns.map(s => new Enemy(s));
    gameObjects = dungeon.objectSpawns.map(s => new GameObject(s.type, s.x, s.y, s.icon));
    npcs = dungeon.npcSpawns.map(s => new NPC(s.id, s.name, s.type, s.x, s.y, s.icon, s.dialogue, dungeon));
    window._difficulty = window._difficulty || 0; // Ensure it exists
    window.aoeZones = aoeZones;
    window.player = player;
    camera.follow(player);

    }
        }
            slotEl.title = '';
            slotEl.style.backgroundImage = 'none';
        } else {
            slotEl.title = potion.name;
            slotEl.style.backgroundImage = `url('assets/${potion.icon}.png')`;
        if (potion) {
        const potion = player.belt[i];
        const slotEl = $(`pi-${i}`);
    for (let i = 0; i < 4; i++) {
    // Potion Belt

    window._difficulty = difficulty;

    }
        }
            player.talents.unspent = 0;
            player.talents.points[firstSkill] = 1;
            player.hotbar[0] = firstSkill;
            const firstSkill = cls.trees[0].nodes[0].id;
        if (cls?.trees[0]?.nodes[0]) {
        const cls = getClass(selectedClass);

        player.y = dungeon.playerStart.y;
        player.x = dungeon.playerStart.x;
        }
            player.isHardcore = true;
        if ($('hardcore-mode') && $('hardcore-mode').checked) {
        if (charName) player.charName = charName;
        player = new Player(selectedClass);
    } else {
        }
            mercenary = Mercenary.deserialize(loadPlayerData.mercenary);
        if (loadPlayerData.mercenary) {
        // Restore mercenary
        }
            discoveredWaypoints.add(0); // Always have town
            discoveredWaypoints = new Set(loadPlayerData.waypoints);
        if (Array.isArray(loadPlayerData.waypoints)) {
        }
            difficulty = loadPlayerData.difficulty;
        if (typeof loadPlayerData.difficulty === 'number') {
        // Restore difficulty and waypoints
        }
            while (stash.length < 20) stash.push(null);
            stash = loadPlayerData.stash;
        if (loadPlayerData.stash && Array.isArray(loadPlayerData.stash)) {
        // Restore stash
        player.highestZone = loadPlayerData.highestZone || 0;
        player.y = dungeon.playerStart.y;
        player.x = dungeon.playerStart.x;
        player = Player.deserialize(loadPlayerData.player);
    if (loadPlayerData && loadPlayerData.player) {
    // Create player

    dungeon.generate(zoneLevel, window.currentTheme);
    dungeon = new Dungeon(80, 60, 16);
    // Generate dungeon

    window.currentTheme = getTheme(zoneLevel, curHighestZone);
    }
        }
            return 'cathedral';
            if (z >= 6) return 'desert';
            if (z >= 11) return 'jungle';
            if (z >= 16) return 'hell';
            if (z >= 21) return 'snow';
        } else {
            return 'town';
            if (hz >= 6) return 'desert';
            if (hz >= 11) return 'jungle';
            if (hz >= 16) return 'hell';
            if (hz >= 21) return 'snow';
        if (z === 0) {
    function getTheme(z, hz) {
    // Set initial theme

    }
        curHighestZone = loadPlayerData.highestZone;
    if (loadPlayerData && loadPlayerData.highestZone) {
    let curHighestZone = 0;
    // Extract early fields for generation theming

    }
        document.body.appendChild(splash);
        splash.className = 'act-cleared-splash';
        splash.id = 'act-splash-container';
        const splash = document.createElement('div');
    if (!$('act-splash-container')) {
    // Create Act Cleared Splash Container if missing

    window.mobileControls = new MobileControls(input);
    input = new Input(canvas);

    window.addEventListener('resize', adjustZoom);

    adjustZoom(); // Apply correct zoom immediately
    camera = new Camera(renderer.width, renderer.height, 2.0); // Default to 2.0 initially
    renderer = new Renderer(canvas);

    };
        }
            camera.zoom = 1.1; // Mobile Portrait (Panoramic view)
        } else {
            camera.zoom = 1.3; // Mobile Landscape (Cinema / Wide view)
        } else if (width > height) {
            camera.zoom = 2.0; // Desktop
        if (width >= 1024) {

        const height = window.innerHeight;
        const width = window.innerWidth;
        if (!camera) return;
    const adjustZoom = () => {
    // Determine zoom level based on screen width

    const canvas = $('game-canvas');
    // Init canvas

        let options = npc.getDialogueOptions ? npc.getDialogueOptions() : [{ label: 'Goodbye', action: () => box.classList.add('hidden') }]; if (window.mercenary && window.mercenary.hp <= 0) { const healers = ['akara', 'ormus', 'malah', 'jamella', 'kashya']; if (healers.includes(npc.id)) { const cost = window.mercenary.level * 100; options.unshift({ label: 'Revive ' + window.mercenary.name + ' (' + cost + ' Gold)', action: () => { if (player.gold >= cost) { player.gold -= cost; window.mercenary.hp = window.mercenary.maxHp; window.mercenary.state = 'idle'; bus.emit('audio:play', { url: 'assets/audio/holy.mp3' }); addCombatLog(window.mercenary.name + ' has been returned to life!', 'log-heal'); } else { addCombatLog('Not enough gold to revive mercenary!', 'log-dmg'); } } }); } }
    $('game-screen').classList.add('active');
    $('main-menu').classList.remove('active');
    // Switch screens

    window._activeSlotId = activeSlotId;
    }
        }
            }
                player.isHardcore = true;
            if ($('hardcore-mode') && $('hardcore-mode').checked) {

            player.addToInventory(tpTome);
            player.addToInventory(idTome);
            const tpTome = { ...items.tome_tp, charges: 20, identified: true };
            const idTome = { ...items.tome_identify, charges: 20, identified: true };

            if (charName) player.charName = charName;
            Vendor.init(loot, player);
            window.player = player;
            player = new Player(selectedClass);
        if (!loadPlayerData) {
        // Starting Gear for new characters

        campaign.reset();
        activeSlotId = slotId || SaveSystem.newSlotId();
        zoneLevel = 0; // Start in Town
        // New character
    } else {
        campaign.deserialize(loadPlayerData.campaign);
        activeSlotId = loadPlayerData.slotId;
        zoneLevel = loadPlayerData.zoneLevel || 0;
        selectedClass = loadPlayerData.classId;
        // Loading existing character
    if (loadPlayerData) {

    if (!selectedClass && !loadPlayerData) return;
function startGame(slotId = null, loadPlayerData = null, charName = null) {
// â”€â”€â”€ START GAME â”€â”€â”€

}
    $('class-stats').innerHTML = statsHtml;
    ).join('');
        `<div class="class-stat-bar"><span>${s.toUpperCase()}</span><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${cls.statBars[s]}%"></div></div></div>`
    const statsHtml = ['str', 'dex', 'vit', 'int'].map(s =>
    $('class-desc').textContent = cls.desc;
    $('class-name').innerHTML = `<i class="ra ${getIconForClass(cls.id)}" style="font-size:24px;vertical-align:middle;color:var(--gold);"></i> ${cls.name}`;
    const cls = getClass(classId);
function showClassInfo(classId) {
    const statBtn = document.getElementById('btn-open-stats'); const skillBtn = document.getElementById('btn-open-skills'); if (statBtn) { if (player.statPoints > 0) statBtn.classList.add('points-pending'); else statBtn.classList.remove('points-pending'); } if (skillBtn) { if (player.talents.unspent > 0) skillBtn.classList.add('points-pending'); else skillBtn.classList.remove('points-pending'); }

function showClassInfo(classId) {
    const cls = getClass(classId);
    $('class-name').innerHTML = `<i class="ra ${getIconForClass(cls.id)}" style="font-size:24px;vertical-align:middle;color:var(--gold);"></i> ${cls.name}`;
    $('class-desc').textContent = cls.desc;
    const statsHtml = ['str', 'dex', 'vit', 'int'].map(s =>
        `<div class="class-stat-bar"><span>${s.toUpperCase()}</span><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${cls.statBars[s]}%"></div></div></div>`
    ).join('');
    $('class-stats').innerHTML = statsHtml;
}

// â”€â”€â”€ START GAME â”€â”€â”€
function startGame(slotId = null, loadPlayerData = null, charName = null) {
    if (!selectedClass && !loadPlayerData) return;

    if (loadPlayerData) {
        // Loading existing character
        selectedClass = loadPlayerData.classId;
        zoneLevel = loadPlayerData.zoneLevel || 0;
        activeSlotId = loadPlayerData.slotId;
        campaign.deserialize(loadPlayerData.campaign);
    } else {
        // New character
        zoneLevel = 0; // Start in Town
        activeSlotId = slotId || SaveSystem.newSlotId();
        campaign.reset();

        // Starting Gear for new characters
        if (!loadPlayerData) {
            player = new Player(selectedClass);
            window.player = player;
            Vendor.init(loot, player);
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
        let options = npc.getDialogueOptions ? npc.getDialogueOptions() : [{ label: 'Goodbye', action: () => box.classList.add('hidden') }]; if (window.mercenary && window.mercenary.hp <= 0) { const healers = ['akara', 'ormus', 'malah', 'jamella', 'kashya']; if (healers.includes(npc.id)) { const cost = window.mercenary.level * 100; options.unshift({ label: 'Revive ' + window.mercenary.name + ' (' + cost + ' Gold)', action: () => { if (player.gold >= cost) { player.gold -= cost; window.mercenary.hp = window.mercenary.maxHp; window.mercenary.state = 'idle'; bus.emit('audio:play', { url: 'assets/audio/holy.mp3' }); addCombatLog(window.mercenary.name + ' has been returned to life!', 'log-heal'); } else { addCombatLog('Not enough gold to revive mercenary!', 'log-dmg'); } } }); } }

    // Init canvas
    const canvas = $('game-canvas');

    // Determine zoom level based on screen width
    const adjustZoom = () => {
        if (!camera) return;
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (width >= 1024) {
            camera.zoom = 2.0; // Desktop
        } else if (width > height) {
            camera.zoom = 1.3; // Mobile Landscape (Cinema / Wide view)
        } else {
            camera.zoom = 1.1; // Mobile Portrait (Panoramic view)
        }
    };

    renderer = new Renderer(canvas);
    camera = new Camera(renderer.width, renderer.height, 2.0); // Default to 2.0 initially
    adjustZoom(); // Apply correct zoom immediately

    window.addEventListener('resize', adjustZoom);

    input = new Input(canvas);
    window.mobileControls = new MobileControls(input);

    // Create Act Cleared Splash Container if missing
    if (!$('act-splash-container')) {
        const splash = document.createElement('div');
        splash.id = 'act-splash-container';
        splash.className = 'act-cleared-splash';
        document.body.appendChild(splash);
    }

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
    for (const e of enemies) { activeRiftMods.forEach(mod => { if (mod.hp) e.maxHp = Math.round(e.maxHp * mod.hp); if (mod.dmg) e.dmg = Math.round(e.dmg * mod.dmg); if (mod.speed) e.moveSpeed *= mod.speed; }); e.hp = e.maxHp; }

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
        campaign: campaign.serialize(),
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

// â”€â”€â”€ GAME LOOP â”€â”€â”€
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
    if (window.mobileControls) window.mobileControls.update(player);

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

    // Update entities â€” pass dungeon for collision checks
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

    // Dropped items (with loot filter and non-overlapping labels)
    const labelRects = [];
    for (const di of droppedItems) {
        if (lootFilter >= 1 && (!di.rarity || di.rarity === 'normal')) continue;
        if (lootFilter >= 2 && di.rarity === 'magic') continue;

        const ctx = renderer.ctx;

        // 1. Rarity Glow (Pulse)
        if (di.rarity !== 'normal') {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            let color = di.rarity === 'unique' ? 'rgba(232, 160, 32, 0.3)' : di.rarity === 'set' ? 'rgba(0, 255, 0, 0.25)' : di.rarity === 'rare' ? 'rgba(240, 208, 48, 0.2)' : 'rgba(64, 128, 255, 0.15)';
            if (di.isQuestItem) color = 'rgba(76, 201, 240, 0.4)';
            
            const pulse = 0.8 + Math.sin(lastTime * 0.005) * 0.2;
            const radial = ctx.createRadialGradient(di.x, di.y, 2, di.x, di.y, 14 * pulse);
            radial.addColorStop(0, color);
            radial.addColorStop(1, 'transparent');
            ctx.fillStyle = radial;
            ctx.beginPath(); ctx.arc(di.x, di.y, 14 * pulse, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // 2. Pro Ground Sprite (2.5D tilt & Shadow)
        ctx.save();
        // Drop Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(di.x + 2, di.y + 2, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
        
        // Tilt icon to look like it's on the floor
        ctx.translate(di.x, di.y);
        ctx.rotate(0.2); // 10-ish degree tilt
        renderer.drawSprite(di.icon, 0, 0, 20); // Larger 20px icon
        ctx.restore();

        // 3. Smart Non-Overlapping Labels (Diablo II Style)
        renderer.ctx.font = 'bold 10px "Exocet", "Cinzel", serif';
        const labelText = di.name;
        const textWidth = renderer.ctx.measureText(labelText).width;
        const padding = 5;
        const lw = textWidth + padding * 2;
        const lh = 15;

        let lx = di.x - lw / 2;
        let ly = di.y + 14;

        // Label Stacking Logic
        let attempts = 0;
        let overlapping = true;
        while (overlapping && attempts < 15) {
            overlapping = false;
            for (const r of labelRects) {
                if (!(lx + lw < r.x || lx > r.x + r.w || ly + lh < r.y || ly > r.y + r.h)) {
                    ly += lh + 1; 
                    overlapping = true;
                    break;
                }
            }
            attempts++;
        }
        
        const finalRect = { x: lx, y: ly, w: lw, h: lh };
        labelRects.push(finalRect);
        di.labelRect = finalRect; 

        // Draw Label Box
        renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        const rCol = di.rarity === 'unique' ? '#e8a020' : di.rarity === 'set' ? '#00ff00' : di.rarity === 'rare' ? '#f0d030' : di.rarity === 'magic' ? '#4080ff' : '#aaa';
        renderer.ctx.strokeStyle = rCol;
        renderer.ctx.lineWidth = 1.5;
        renderer.ctx.fillRect(lx, ly, lw, lh);
        renderer.ctx.strokeRect(lx, ly, lw, lh);

        // Draw Name
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillStyle = rCol;
        renderer.ctx.fillText(labelText, di.x, ly + 11.5);
    }

    // --- Phase 29: World Time Overlay (Post-Objects) ---
    renderWorldOverlay(renderer.ctx, renderer.width, renderer.height);

    for (const g of droppedGold) {
        renderer.fillCircle(g.x, g.y, 4, '#ffd700');
        renderer.strokeCircle(g.x, g.y, 4, '#c8972a', 1);
        renderer.ctx.font = 'bold 9px "Cinzel", serif';
        renderer.ctx.textAlign = 'center';

        // Gold label box
        const goldText = `${g.amount}`;
        const tw = renderer.ctx.measureText(goldText).width;
        renderer.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        renderer.ctx.fillRect(g.x - tw / 2 - 2, g.y + 6, tw + 4, 10);

        renderer.ctx.fillStyle = '#ffd700';
        renderer.ctx.fillText(goldText, g.x, g.y + 14);
    }

    const entities = [...(enemies || []), player].filter(e => e).sort((a, b) => a.y - b.y);
    for (const e of entities) {
        if (e.isPlayer) {
            // Draw high-quality dynamic shadow
            renderer.drawShadow(e.x, e.y + 6, 8, 0.4);

            // === DYNAMIC CLASS VFX ===
            if (e.classId === 'shaman' || e.hitFlashTimer > 0) {
                renderer.drawVFX('lightning', e.x, e.y, 18, lastTime);
            }
            if (e.classId === 'warlock' || e.classId === 'necromancer') {
                renderer.drawVFX('aura_shadow', e.x, e.y, 18, lastTime);
            }
            if (e.classId === 'sorceress') {
                renderer.ctx.save();
                renderer.ctx.shadowBlur = 15;
                renderer.ctx.shadowColor = '#4080ff';
                renderer.ctx.restore();
            }
            if (e.classId === 'paladin') {
                renderer.ctx.save();
                renderer.ctx.shadowBlur = 10;
                renderer.ctx.shadowColor = '#ffd700';
                renderer.ctx.restore();
            }

            // Draw aura ring if active
            if (e.activeAura) {
                const auraColors = {
                    might_aura: '#ffd700', prayer_aura: '#40c040', holy_fire_aura: '#ff4000',
                    resist_all: '#4080ff', vigor: '#ffffff', fanaticism: '#ffa000', conviction: '#a040ff'
                };
                const auraColor = auraColors[e.activeAura] || '#ffe880';
                const pulse = 0.4 + Math.sin(lastTime * 0.006) * 0.2;
                const auraRadius = 28 + Math.sin(lastTime * 0.004) * 4;

                renderer.ctx.save();
                renderer.ctx.globalAlpha = pulse;
                renderer.ctx.strokeStyle = auraColor;
                renderer.ctx.lineWidth = 2;
                renderer.ctx.shadowColor = auraColor;
                renderer.ctx.shadowBlur = 12;
                renderer.ctx.beginPath();
                renderer.ctx.ellipse(e.x, e.y + 2, auraRadius, auraRadius * 0.4, 0, 0, Math.PI * 2);
                renderer.ctx.stroke();
                renderer.ctx.restore();
            }

            renderer.drawAnim(`class_${e.classId}`, e.x, e.y - 4, 18, e.animState, e.facingDir, lastTime, null, e.equipment, e.hitFlashTimer);
            e.renderMinions(renderer, lastTime);
        } else {
            // Mercenary specific icon handling
            if (e.isMercenary) {
                const mercIcons = {
                    'Rogue': 'class_rogue',
                    'Desert Warrior': 'class_warrior',
                    'Iron Wolf': 'class_shaman',
                    'Mercenary Warrior': 'mercenary_warrior',
                    'Mercenary Archer': 'mercenary_archer'
                };
                e.icon = mercIcons[e.className] || e.icon;
            }
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

    renderer.ctx.restore(); // END CAMERA TRANSLATION (Switching to Screen Space for UI)

    // Phase 15 & 16: Unified FX & Combat Text Layer
    // We use fx.renderScreen to handle all particles and floating text in a single pass
    // that correctly accounts for camera coordinates and mobile scaling.
    renderer.ctx.save();
    renderer.ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (fx && fx.renderScreen) {
        fx.renderScreen(renderer.ctx, camera);
    }

    renderer.ctx.restore();

    bus.emit('render:effects', { renderer, lastTime });

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
            campaign: campaign.serialize(),
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

    // â”€â”€â”€ MINIMAP â”€â”€â”€
    // Render minimap (top right)
    renderMinimap();

    // Render Full Map (TAB)
    if (showFullMap && explored) {
        const mw = renderer.width, mh = renderer.height;
        const ts = dungeon.tileSize;
                bus.emit('audio:play', { url: 'assets/audio/gold.mp3', volume: 0.3 });
        const mw = renderer.width, mh = renderer.height;
    if (showFullMap && explored) {
    // Render Full Map (TAB)

    renderMinimap();
    // Render minimap (top right)
    // â”€â”€â”€ MINIMAP â”€â”€â”€

    renderer.ctx.fillRect(0, 0, renderer.width, renderer.height);
    renderer.ctx.fillStyle = grd;

    grd.addColorStop(1, `rgba(0, 0, 0, ${minAlpha})`);   // Outer darkness
    grd.addColorStop(0.7, `rgba(0, 0, 0, ${minAlpha * 0.5})`);  // Atmospheric penumbra
    grd.addColorStop(0.3, 'rgba(0, 0, 0, 0)');    // Wider clear area
    grd.addColorStop(0, 'rgba(0, 0, 0, 0)');      // Full visibility at center

    const minAlpha = (zoneLevel === 0) ? 0.6 : (isBossZone ? 0.8 : 0.95);
    // In town or boss room, make it slightly brighter overall

    const grd = renderer.ctx.createRadialGradient(cx, cy, 50, cx, cy, radius);

    const radius = Math.max(100, baseRadius + pulse);
    const pulse = Math.sin(lastTime * 0.002) * 15;
    const baseRadius = 450 + (player.lightRadius || 0) * 50;
    // Dynamic pulsing and gear-based light radius

    const cy = renderer.height / 2;
    const cx = renderer.width / 2;
    // Premium Ambient Lighting Mask (affecting everything)

    renderer.text(`FPS: ${Math.round(1000 / dt)}`, renderer.width - 20, renderer.height - 20, { size: 10, align: 'right', color: '#555' });

    }
        addCombatLog('Progress Saved.', 'log-info');
        });
            achievements: Array.from(unlockedAchievements)
            campaign: campaign.serialize(),
            cube,
            mercenary: mercenary ? mercenary.serialize() : null,
            waypoints: [...discoveredWaypoints],
            difficulty: window._difficulty,
        SaveSystem.saveSlot(activeSlotId, player, zoneLevel, stash, {
        lastSaveTime = timestamp;
    if (timestamp - lastSaveTime > 30000 && activeSlotId) {
    // Auto-save every 30 seconds

    updateHud();

    }
        renderer.text(dialogue.text, renderer.width / 2, renderer.height - 120, { size: 16, align: 'center', color: '#ffd700' });
    if (dialogue) {

    camera.reset(renderer.ctx);

    }
        renderer.applyLighting(sx, sy, (baseRadius + flicker) * camera.zoom, ambient);

        }
            ambient = 'rgba(60, 0, 0, 0.95)'; // Uber
        } else if (zoneLevel === 100) {
            ambient = 'rgba(20, 4, 4, 0.90)'; // Hell
        } else if (zoneLevel >= 5 && zoneLevel <= 25) {
            ambient = 'rgba(10, 20, 10, 0.85)'; // Catacombs
        } else if (zoneLevel === 4) {
            ambient = 'rgba(8, 12, 18, 0.70)'; // Blood Moor
        } else if (zoneLevel <= 3) {
            ambient = 'rgba(0, 0, 4, 0.15)';
            // Very subtle ambient in town to let the "player light" still show a bit
        if (zoneLevel === 0) {

        let ambient = 'rgba(0, 0, 0, 0.85)'; // Default

        const flicker = Math.sin(Date.now() / 150) * 8;
        const baseRadius = (150 + (player.lightRadius || 0));
        // Base radius and flicker (Tightened for a distinct circle effect)

        const sy = screen.y;
        const sx = screen.x;
        const screen = camera.toScreen(player.x, player.y - 15);
        // Use the camera's source of truth for screen positioning
    if (player && renderer && camera) {
    // --- Phase 20: Narrative Vision: Atmospheric Lighting Pass ---

    bus.emit('render:effects', { renderer, lastTime });

    renderer.ctx.restore();

    }
        fx.renderScreen(renderer.ctx, camera);
    if (fx && fx.renderScreen) {

    renderer.ctx.setTransform(1, 0, 0, 1, 0, 0);
    renderer.ctx.save();
    // that correctly accounts for camera coordinates and mobile scaling.
    // We use fx.renderScreen to handle all particles and floating text in a single pass
    // Phase 15 & 16: Unified FX & Combat Text Layer

    renderer.ctx.restore(); // END CAMERA TRANSLATION (Switching to Screen Space for UI)

    aoeZones.forEach(a => a.render(renderer, lastTime));
    projectiles.forEach(p => p.render(renderer, lastTime));

    for (const obj of gameObjects) obj.render(renderer, lastTime);
    }
        }
            renderer.ctx.restore();
            renderer.ctx.fill();
            renderer.ctx.arc(obj.x, obj.y, 25, 0, Math.PI * 2);
            renderer.ctx.beginPath();
            renderer.ctx.fillStyle = radial;
            radial.addColorStop(1, 'transparent');
            radial.addColorStop(0, `${color} ${pulse})`);
            const radial = renderer.ctx.createRadialGradient(obj.x, obj.y, 4, obj.x, obj.y, 25);
            renderer.ctx.globalCompositeOperation = 'screen';
            renderer.ctx.save();
            const color = obj.type === 'shrine' ? 'rgba(0, 255, 255,' : 'rgba(255, 215, 0,';
            const pulse = 0.4 + Math.sin(lastTime * 0.004) * 0.2;
        if (obj.type === 'shrine' || obj.type === 'waypoint' || obj.type === 'altar') {
    for (const obj of gameObjects) {
    // --- Phase 3.1: Pulsing Interactive Objects ---

    }
        n.render(renderer, lastTime);
        }
            renderer.ctx.fill();
            renderer.ctx.ellipse(n.x, n.y + 4, 12, 5, 0, 0, Math.PI * 2);
            renderer.ctx.beginPath();
            renderer.ctx.fillStyle = `rgba(216, 176, 104, ${pulse * 0.2})`;
            const pulse = 0.5 + Math.sin(lastTime * 0.005) * 0.3;
        if (zoneLevel === 0) {
        // Subtle glow for town NPCs
    for (const n of npcs) {

    }
        renderer.ctx.fillText(mercenary.name, mercenary.x, mercenary.y - 18);
        renderer.ctx.fillStyle = '#4caf50';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.font = '5px Cinzel, serif';
        renderer.ctx.fillRect(mercenary.x - bw / 2, mercenary.y - 14, bw * (mercenary.hp / mercenary.maxHp), 2);
        renderer.ctx.fillStyle = '#4caf50';
        renderer.ctx.fillRect(mercenary.x - bw / 2, mercenary.y - 14, bw, 2);
        renderer.ctx.fillStyle = '#333';
        const bw = 18;
        // HP bar above head
        renderer.drawSprite('class_rogue', mercenary.x, mercenary.y - 4, 16);
        renderer.ctx.fill();
        renderer.ctx.ellipse(mercenary.x, mercenary.y + 6, 6, 3, 0, 0, Math.PI * 2);
        renderer.ctx.beginPath();
        renderer.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    if (mercenary && mercenary.hp > 0) {
    // Render mercenary

    }
        }
            e.render(renderer, lastTime);
            }
                e.icon = mercIcons[e.className] || e.icon;
                };
                    'Mercenary Archer': 'mercenary_archer'
                    'Mercenary Warrior': 'mercenary_warrior',
                    'Iron Wolf': 'class_shaman',
                    'Desert Warrior': 'class_warrior',
                    'Rogue': 'class_rogue',
                const mercIcons = {
            if (e.isMercenary) {
            // Mercenary specific icon handling
        } else {
            e.renderMinions(renderer, lastTime);
            renderer.drawAnim(`class_${e.classId}`, e.x, e.y - 4, 18, e.animState, e.facingDir, lastTime, null, e.equipment, e.hitFlashTimer);

            }
                renderer.ctx.restore();
                renderer.ctx.stroke();
                renderer.ctx.ellipse(e.x, e.y + 2, auraRadius, auraRadius * 0.4, 0, 0, Math.PI * 2);
                renderer.ctx.beginPath();
                renderer.ctx.shadowBlur = 12;
                renderer.ctx.shadowColor = auraColor;
                renderer.ctx.lineWidth = 2;
                renderer.ctx.strokeStyle = auraColor;
                renderer.ctx.globalAlpha = pulse;
                renderer.ctx.save();

                const auraRadius = 28 + Math.sin(lastTime * 0.004) * 4;
                const pulse = 0.4 + Math.sin(lastTime * 0.006) * 0.2;
                const auraColor = auraColors[e.activeAura] || '#ffe880';
                };
                    resist_all: '#4080ff', vigor: '#ffffff', fanaticism: '#ffa000', conviction: '#a040ff'
                    might_aura: '#ffd700', prayer_aura: '#40c040', holy_fire_aura: '#ff4000',
                const auraColors = {
            if (e.activeAura) {
            // Draw aura ring if active

            }
                renderer.ctx.restore();
                renderer.ctx.shadowColor = '#ffd700';
                renderer.ctx.shadowBlur = 10;
                renderer.ctx.save();
            if (e.classId === 'paladin') {
            }
                renderer.ctx.restore();
                renderer.ctx.shadowColor = '#4080ff';
                renderer.ctx.shadowBlur = 15;
                renderer.ctx.save();
            if (e.classId === 'sorceress') {
            }
                renderer.drawVFX('aura_shadow', e.x, e.y, 18, lastTime);
            if (e.classId === 'warlock' || e.classId === 'necromancer') {
            }
                renderer.drawVFX('lightning', e.x, e.y, 18, lastTime);
            if (e.classId === 'shaman' || e.hitFlashTimer > 0) {
            // === DYNAMIC CLASS VFX ===

            renderer.drawShadow(e.x, e.y + 6, 8, 0.4);
            // Draw high-quality dynamic shadow
        if (e.isPlayer) {
    for (const e of entities) {
    const entities = [...(enemies || []), player].filter(e => e).sort((a, b) => a.y - b.y);

    }
        renderer.ctx.fillText(goldText, g.x, g.y + 14);
        renderer.ctx.fillStyle = '#ffd700';

        renderer.ctx.fillRect(g.x - tw / 2 - 2, g.y + 6, tw + 4, 10);
        renderer.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        const tw = renderer.ctx.measureText(goldText).width;
        const goldText = `${g.amount}`;
        // Gold label box

        renderer.ctx.textAlign = 'center';
        renderer.ctx.font = 'bold 9px "Cinzel", serif';
        renderer.strokeCircle(g.x, g.y, 4, '#c8972a', 1);
        renderer.fillCircle(g.x, g.y, 4, '#ffd700');
    for (const g of droppedGold) {

    renderWorldOverlay(renderer.ctx, renderer.width, renderer.height);
    // --- Phase 29: World Time Overlay (Post-Objects) ---

    }
        renderer.ctx.fillText(labelText, di.x, ly + 11.5);
        renderer.ctx.fillStyle = rCol;
        renderer.ctx.textAlign = 'center';
        // Draw Name

        renderer.ctx.strokeRect(lx, ly, lw, lh);
        renderer.ctx.fillRect(lx, ly, lw, lh);
        renderer.ctx.lineWidth = 1.5;
        renderer.ctx.strokeStyle = rCol;
        const rCol = di.rarity === 'unique' ? '#e8a020' : di.rarity === 'set' ? '#00ff00' : di.rarity === 'rare' ? '#f0d030' : di.rarity === 'magic' ? '#4080ff' : '#aaa';
        renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        // Draw Label Box

        di.labelRect = finalRect; 
        labelRects.push(finalRect);
        const finalRect = { x: lx, y: ly, w: lw, h: lh };
        
        }
            attempts++;
            }
                }
                    break;
                    overlapping = true;
                    ly += lh + 1; 
                if (!(lx + lw < r.x || lx > r.x + r.w || ly + lh < r.y || ly > r.y + r.h)) {
            for (const r of labelRects) {
            overlapping = false;
        while (overlapping && attempts < 15) {
        let overlapping = true;
        let attempts = 0;
        // Label Stacking Logic

        let ly = di.y + 14;
        let lx = di.x - lw / 2;

        const lh = 15;
        const lw = textWidth + padding * 2;
        const padding = 5;
        const textWidth = renderer.ctx.measureText(labelText).width;
        const labelText = di.name;
        renderer.ctx.font = 'bold 10px "Exocet", "Cinzel", serif';
        // 3. Smart Non-Overlapping Labels (Diablo II Style)

        ctx.restore();
        renderer.drawSprite(di.icon, 0, 0, 20); // Larger 20px icon
        ctx.rotate(0.2); // 10-ish degree tilt
        ctx.translate(di.x, di.y);
        // Tilt icon to look like it's on the floor
        
        ctx.beginPath(); ctx.ellipse(di.x + 2, di.y + 2, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        // Drop Shadow
        ctx.save();
        // 2. Pro Ground Sprite (2.5D tilt & Shadow)

        }
            ctx.restore();
            ctx.beginPath(); ctx.arc(di.x, di.y, 14 * pulse, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = radial;
            radial.addColorStop(1, 'transparent');
            radial.addColorStop(0, color);
            const radial = ctx.createRadialGradient(di.x, di.y, 2, di.x, di.y, 14 * pulse);
            const pulse = 0.8 + Math.sin(lastTime * 0.005) * 0.2;
            
            if (di.isQuestItem) color = 'rgba(76, 201, 240, 0.4)';
            let color = di.rarity === 'unique' ? 'rgba(232, 160, 32, 0.3)' : di.rarity === 'set' ? 'rgba(0, 255, 0, 0.25)' : di.rarity === 'rare' ? 'rgba(240, 208, 48, 0.2)' : 'rgba(64, 128, 255, 0.15)';
            ctx.globalCompositeOperation = 'screen';
            ctx.save();
        if (di.rarity !== 'normal') {
        // 1. Rarity Glow (Pulse)

        const ctx = renderer.ctx;

        if (lootFilter >= 2 && di.rarity === 'magic') continue;
        if (lootFilter >= 1 && (!di.rarity || di.rarity === 'normal')) continue;
    for (const di of droppedItems) {
    const labelRects = [];
    // Dropped items (with loot filter and non-overlapping labels)

    }
        renderer.ctx.restore();
        }
            renderer.ctx.fill();
            renderer.ctx.arc(p.x, p.y, Math.max(0.5, size), 0, Math.PI * 2);
            renderer.ctx.beginPath();
            const size = 2 - (i / player.path.length); // Tapering trail
            const p = player.path[i];
        for (let i = 0; i < player.path.length; i++) {
        renderer.ctx.fillStyle = '#ffff00';
        renderer.ctx.globalAlpha = 0.4;
        renderer.ctx.save();
    if (player.path && player.path.length > 0) {
    // Path Breadcrumbs (Phase 31 Mastery)

    camera.apply(renderer.ctx);

    dungeon.render(renderer, camera);
    renderer.clear();
    // Render

    }
        }
            nextZone();
        } else {
            bus.emit('combat:log', { text: "The ancient evil blocks your path forward!", type: 'log-dmg' });
            player.y -= (dungeon.exitPos.y - player.y) * 0.1;
            player.x -= (dungeon.exitPos.x - player.x) * 0.1;
            // Move player back slightly to prevent spam
            if (player.path) player.path = []; // stop moving
        if (isZoneLocked) {
    if (distToExit < 20) {
    const distToExit = Math.sqrt((player.x - dungeon.exitPos.x) ** 2 + (player.y - dungeon.exitPos.y) ** 2);

    }
        return;
        checkDeaths(); // Triggers final sequence
    if (player.hp <= 0 && state === 'GAME') {

    }
        }
            updateHud();
            droppedGold.splice(i, 1);
        if (droppedGold[i]._pickedByPet) {
    for (let i = droppedGold.length - 1; i >= 0; i--) {
    // Secondary cleanup for items picked by pet
    }
        activePet.update(dt, player, droppedGold, droppedItems);
    if (activePet) {
    // Update Pets
    }
        }
            }
                }
                    break;
                    nextZone(o.targetZone);
                    addCombatLog('Entering Portal...', 'log-level');
                    // Direct targetZone objects
                } else {
                    }
                        break;
                        nextZone(res.targetZone);
                        addCombatLog('Entering Portal...', 'log-level');
                    if (res && res.type === 'PORTAL') {
                    const res = o.interact(player);
                if (o.type === 'portal') {
            if (dist < 20) {
            const dist = Math.sqrt((player.x - o.x) ** 2 + (player.y - o.y) ** 2);
        if (o.type === 'portal' || o.type === 'uber_portal' || o.type === 'rift_exit') {
    for (const o of gameObjects) {
    // Check portal walk-over collisions

    checkAchievements();
    // Achievement checker (every frame is fine, checks are cheap)

    checkDeaths();

    }
        }
            updateHud();
            mercenary._deadNotified = true;
            playDeathSfx();
            addCombatLog(`Your companion ${mercenary.name} has fallen!`, 'log-dmg');
        } else if (!mercenary._deadNotified) {
            mercenary._deadNotified = false;
            mercenary.update(dt, player, enemies, dungeon);
        if (mercenary.hp > 0) {
    if (mercenary) {
    // Mercenary follow & attack AI

    }
        if (hpBar) hpBar.classList.add('hidden');
    } else {
        }
            boss.isEnraged = true;
            // Subtle visual change (flag for renderer)
            addCombatLog(`${boss.name} enters a FURY!`, 'log-crit');
            fx.emitBurst(boss.x, boss.y, '#ff0000', 40, 4);
            fx.shake(1000, 10);
            boss.atkSpeed *= 1.3;
            boss.moveSpeed *= 1.4;
            boss._phase2Triggered = true;
        if (pct < 50 && !boss._phase2Triggered) {
        // --- Phase 3.1: Boss Phase Triggers ---

        $('boss-name').textContent = boss.name || 'Act Boss';
        $('boss-hp-text').textContent = `${Math.ceil(pct)}%`;
        $('boss-hp-fill').style.width = `${pct}%`;
        const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
        hpBar.classList.remove('hidden');
    if (boss && boss.hp > 0 && state === 'GAME') {
    const hpBar = $('boss-hp-bar');
    const boss = enemies.find(e => e.type === 'boss');
    // Boss check
    // Boss check

    }
        }
            activeWaypointObj = null;
            activeDialogueNpc = null;
        } else {
            }
                activeWaypointObj = null;
                activeDialogueNpc = null;
                picker.remove();
            if (d > 120) {
            const d = Math.sqrt((player.x - currentMenuFocus.x) ** 2 + (player.y - currentMenuFocus.y) ** 2);
            // Auto-close if too far

            picker.style.top = `${screen.y - 180}px`;
            picker.style.left = `${screen.x - 110}px`;
            const screen = camera.toScreen(currentMenuFocus.x, currentMenuFocus.y);
        if (picker) {
        const picker = document.getElementById('dialogue-picker');
    if (currentMenuFocus) {
    const currentMenuFocus = activeDialogueNpc || activeWaypointObj;
    // Update Floating Dialogue Position

    }
        }
            }
                renderInventory();
                updateHud();
                droppedGold.splice(i, 1);
                bus.emit('gold:pickup', { amount: dg.amount });
                addCombatLog(`Auto-picked ${dg.amount} Gold`, 'log-heal');
                player.gold += dg.amount;
            if (dist < 45) {
            const dist = Math.sqrt((player.x - dg.x) ** 2 + (player.y - dg.y) ** 2);
            const dg = droppedGold[i];
        for (let i = droppedGold.length - 1; i >= 0; i--) {
    if (player && droppedGold.length > 0) {
    // Gold Auto-Pickup (radius 45px)

    }
        input.click = null;
        checkInteractions(input.click);
    if (input.click) {

    }
        if (dialogue.timer <= 0) dialogue = null;
        dialogue.timer -= dt;
    if (dialogue) {

    }
        }
            floatingTexts.splice(i, 1);
        if (ft.life <= 0) {
        ft.life -= dt;
        ft.y -= 30 * dt; // Float up
        const ft = floatingTexts[i];
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
    // Phase 15: Update Floating Text

    }
        }
            if (fx && Math.random() < 0.1) fx.emitLootBeam(drop.x, drop.y, color);
            const color = drop.rarity === 'unique' ? '#bf642f' : '#00ff00';
        if (drop.rarity === 'unique' || drop.rarity === 'set') {
    for (const drop of droppedItems) {
    // Update Loot Beams (Tick the particle system for persistence)

    updateStatuses(statusTargets, dt);
    if (mercenary) statusTargets.push(mercenary);
    const statusTargets = [player, ...enemies, ...npcs];
    // Update Statuses, DoTs, and physics (knockback)

    aoeZones = aoeZones.filter(a => a && a.active);
    });
        if (a && a.update) a.update(dt, enemies, player);
    aoeZones.forEach(a => {

    projectiles = projectiles.filter(p => p && p.active);
    });
        if (p && p.update) p.update(dt, enemies, player, dungeon, (aoe) => { if (aoe) aoeZones.push(aoe); });
    projectiles.forEach(p => {
    // Update Projectiles & AoEs

    if (player) player.updateMinions(dt, enemies, dungeon);
    if (activePet) activePet.update(dt, player, droppedGold);
    for (const n of npcs) n.update(dt);
    for (const e of (enemies || [])) e.update(dt, player, dungeon, enemies);
    // Update entities â€” pass dungeon for collision checks

    }
        camera.update(dt);
        camera.h = renderer.height;
        camera.w = renderer.width;
    if (camera) {
    }
        // Moved to centralized Atmospheric Weather System block above

        }
            player.mp = Math.min(player.maxMp, player.mp + mpRegen);
            const mpRegen = player.maxMp * 0.003 * dt + (player.manaRegenPerSec || 0) * dt;
        if (player.mp < player.maxMp && player.hp > 0) {
        // MP Regen (always, slower) + gear-based regen
        }
            if (hpRegen > 0) player.hp = Math.min(player.maxHp, player.hp + hpRegen);
            }
                hpRegen += player.maxHp * 0.005 * dt; // Passive OOC regen
            if (performance.now() - lastHitTime > 5000) {

            }
                // Apply invisible debuff or handle in calcDamage
            if (cursedMod) {
            const cursedMod = activeRiftMods.find(m => m.id === 'cursed');
            // Rift Mod: Cursed (Armor/Res reduction)

            let hpRegen = (player.lifeRegenPerSec || 0) * dt;
        if (player.hp > 0 && player.hp < player.maxHp) {
        // HP Regen out of combat (passive) + gear-based regen (always active)

        fx.update(dt * 1000); // Particle update expects ms
        player.update(dt, input, enemies, dungeon, (aoe) => aoeZones.push(aoe));
    if (player) {

    }
        }
            window.fx.emitMist(renderer.width, renderer.height);
        } else if (theme === 'wilderness') {
            window.fx.emitRain(renderer.width, renderer.height);
        } else if (theme === 'jungle' || theme === 'temple') {
            window.fx.emitEmbers(renderer.width, renderer.height);
        } else if (theme === 'hell') {
            window.fx.emitSand(renderer.width, renderer.height);
        } else if (theme === 'desert') {
            window.fx.emitBlizzard(renderer.width, renderer.height);
        if (theme === 'snow') {
        const theme = window.currentTheme;
    if (window.fx && player) {
    // --- Phase 3.1: Atmospheric Weather System ---

    if (window.mobileControls) window.mobileControls.update(player);
    if (input) input.update();

    window.isNight = (hour >= 20 || hour < 6);
    const hour = worldTime / 60;
    worldTime = (worldTime + dt * 10) % 1440;
    // --- Phase 29: World Time Tick (1 sec real = 10 game mins) ---
    // Update

    uiActiveBoss = closestBoss;
    }
        }
            fx.emitBossAura(e.x, e.y, e.color || '#f0f');
            // Emit aura
            }
                closestBoss = e;
                minDist = d;
            if (d < minDist) {
            const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (e.type === 'boss' && e.hp > 0) {
    for (const e of enemies) {
    let minDist = 400; // Activation range
    let closestBoss = null;
    // Boss Proximity Logic

    }
        timeScale = Math.min(1.0, timeScale + rawDt * 0.8);
    if (timeScale < 1.0) {
    // TimeScale Recovery (Lerp back to 1.0)

    lastTime = timestamp;
    const dt = rawDt * timeScale;
    const rawDt = Math.min(0.1, (timestamp - lastTime) / 1000);
    if (state !== 'GAME') return;
function gameLoop(timestamp) {
// â”€â”€â”€ GAME LOOP â”€â”€â”€

}
    requestAnimationFrame(gameLoop);
    lastTime = performance.now();

    explored = Array.from({ length: dungeon.height }, () => Array(dungeon.width).fill(false));
    // Init explored for minimap

    }
        stopAmbient(); // Town is quiet for now
    } else {
        startAmbientDungeon();
    } else if (zoneLevel > 0) {
        startAmbientBoss();
    if (isBossZone) {
    // Initial ambient audio

    });
        achievements: Array.from(unlockedAchievements)
        campaign: campaign.serialize(),
        cube,
        mercenary: mercenary ? mercenary.serialize() : null,
        waypoints: [...discoveredWaypoints],
        difficulty: window._difficulty,
    SaveSystem.saveSlot(activeSlotId, player, zoneLevel, stash, {
    // Initial save

    if (bossBar && !isBossZone) bossBar.classList.add('hidden');
    const bossBar = $('boss-hp-bar');
    const isBossZone = zoneLevel === 5 || zoneLevel === 10 || zoneLevel === 15 || zoneLevel === 20 || (zoneLevel > 21 && zoneLevel % 5 === 0);
    // Ensure boss bar hidden unless zone 5 or rift boss

    updateRiftHud();
    updateHud();

    dialogue = null;
    droppedGold = [];
    droppedItems = [];

    for (const e of enemies) { activeRiftMods.forEach(mod => { if (mod.hp) e.maxHp = Math.round(e.maxHp * mod.hp); if (mod.dmg) e.dmg = Math.round(e.dmg * mod.dmg); if (mod.speed) e.moveSpeed *= mod.speed; }); e.hp = e.maxHp; }
    // Apply difficulty & Rift scaling to enemies

    enemies = dungeon.enemySpawns.map(s => new Enemy(s));
    gameObjects = dungeon.objectSpawns.map(s => new GameObject(s.type, s.x, s.y, s.icon));
    npcs = dungeon.npcSpawns.map(s => new NPC(s.id, s.name, s.type, s.x, s.y, s.icon, s.dialogue, dungeon));
    window._difficulty = window._difficulty || 0; // Ensure it exists
    window.aoeZones = aoeZones;
    window.player = player;
    camera.follow(player);

    }
        }
            slotEl.title = '';
            slotEl.style.backgroundImage = 'none';
        } else {
            slotEl.title = potion.name;
            slotEl.style.backgroundImage = `url('assets/${potion.icon}.png')`;
        if (potion) {
        const potion = player.belt[i];
        const slotEl = $(`pi-${i}`);
    for (let i = 0; i < 4; i++) {
    // Potion Belt

    window._difficulty = difficulty;

    }
        }
            player.talents.unspent = 0;
            player.talents.points[firstSkill] = 1;
            player.hotbar[0] = firstSkill;
            const firstSkill = cls.trees[0].nodes[0].id;
        if (cls?.trees[0]?.nodes[0]) {
        const cls = getClass(selectedClass);

        player.y = dungeon.playerStart.y;
        player.x = dungeon.playerStart.x;
        }
            player.isHardcore = true;
        if ($('hardcore-mode') && $('hardcore-mode').checked) {
        if (charName) player.charName = charName;
        player = new Player(selectedClass);
    } else {
        }
            mercenary = Mercenary.deserialize(loadPlayerData.mercenary);
        if (loadPlayerData.mercenary) {
        // Restore mercenary
        }
            discoveredWaypoints.add(0); // Always have town
            discoveredWaypoints = new Set(loadPlayerData.waypoints);
        if (Array.isArray(loadPlayerData.waypoints)) {
        }
            difficulty = loadPlayerData.difficulty;
        if (typeof loadPlayerData.difficulty === 'number') {
        // Restore difficulty and waypoints
        }
            while (stash.length < 20) stash.push(null);
            stash = loadPlayerData.stash;
        if (loadPlayerData.stash && Array.isArray(loadPlayerData.stash)) {
        // Restore stash
        player.highestZone = loadPlayerData.highestZone || 0;
        player.y = dungeon.playerStart.y;
        player.x = dungeon.playerStart.x;
        player = Player.deserialize(loadPlayerData.player);
    if (loadPlayerData && loadPlayerData.player) {
    // Create player

    dungeon.generate(zoneLevel, window.currentTheme);
    dungeon = new Dungeon(80, 60, 16);
    // Generate dungeon

    window.currentTheme = getTheme(zoneLevel, curHighestZone);
    }
        }
            return 'cathedral';
            if (z >= 6) return 'desert';
            if (z >= 11) return 'jungle';
            if (z >= 16) return 'hell';
            if (z >= 21) return 'snow';
        } else {
            return 'town';
            if (hz >= 6) return 'desert';
            if (hz >= 11) return 'jungle';
            if (hz >= 16) return 'hell';
            if (hz >= 21) return 'snow';
        if (z === 0) {
    function getTheme(z, hz) {
    // Set initial theme

    }
        curHighestZone = loadPlayerData.highestZone;
    if (loadPlayerData && loadPlayerData.highestZone) {
    let curHighestZone = 0;
    // Extract early fields for generation theming

    }
        document.body.appendChild(splash);
        splash.className = 'act-cleared-splash';
        splash.id = 'act-splash-container';
        const splash = document.createElement('div');
    if (!$('act-splash-container')) {
    // Create Act Cleared Splash Container if missing

    window.mobileControls = new MobileControls(input);
    input = new Input(canvas);

    window.addEventListener('resize', adjustZoom);

    adjustZoom(); // Apply correct zoom immediately
    camera = new Camera(renderer.width, renderer.height, 2.0); // Default to 2.0 initially
    renderer = new Renderer(canvas);

    };
        }
            camera.zoom = 1.1; // Mobile Portrait (Panoramic view)
        } else {
            camera.zoom = 1.3; // Mobile Landscape (Cinema / Wide view)
        } else if (width > height) {
            camera.zoom = 2.0; // Desktop
        if (width >= 1024) {

        const height = window.innerHeight;
        const width = window.innerWidth;
        if (!camera) return;
    const adjustZoom = () => {
    // Determine zoom level based on screen width

    const canvas = $('game-canvas');
    // Init canvas

    state = 'GAME';
    $('game-screen').classList.add('active');
    $('main-menu').classList.remove('active');
    // Switch screens

    window._activeSlotId = activeSlotId;
    }
        }
            }
                player.isHardcore = true;
            if ($('hardcore-mode') && $('hardcore-mode').checked) {

            player.addToInventory(tpTome);
            player.addToInventory(idTome);
            const tpTome = { ...items.tome_tp, charges: 20, identified: true };
            const idTome = { ...items.tome_identify, charges: 20, identified: true };

            if (charName) player.charName = charName;
            Vendor.init(loot, player);
            window.player = player;
            player = new Player(selectedClass);
        if (!loadPlayerData) {
        // Starting Gear for new characters

        campaign.reset();
        activeSlotId = slotId || SaveSystem.newSlotId();
        zoneLevel = 0; // Start in Town
        // New character
    } else {
        campaign.deserialize(loadPlayerData.campaign);
        activeSlotId = loadPlayerData.slotId;
        zoneLevel = loadPlayerData.zoneLevel || 0;
        selectedClass = loadPlayerData.classId;
        // Loading existing character
    if (loadPlayerData) {

    if (!selectedClass && !loadPlayerData) return;
function startGame(slotId = null, loadPlayerData = null, charName = null) {
// â”€â”€â”€ START GAME â”€â”€â”€

}
    $('class-stats').innerHTML = statsHtml;
    ).join('');
        `<div class="class-stat-bar"><span>${s.toUpperCase()}</span><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${cls.statBars[s]}%"></div></div></div>`
    const statsHtml = ['str', 'dex', 'vit', 'int'].map(s =>
    $('class-desc').textContent = cls.desc;
    $('class-name').innerHTML = `<i class="ra ${getIconForClass(cls.id)}" style="font-size:24px;vertical-align:middle;color:var(--gold);"></i> ${cls.name}`;
    const cls = getClass(classId);
function showClassInfo(classId) {

}
    showClassInfo(classId);
    $('btn-new-game').disabled = false;
    document.querySelectorAll('.class-card').forEach(c => c.classList.toggle('selected', c.dataset.classId === classId));
    selectedClass = classId;
function selectClass(classId) {

}
    });
        }
            showClassInfo(selectedClass);
        if (selectedClass) {
    grid.addEventListener('mouseleave', () => {
    // When mouse leaves the entire grid, reset description to selected class

    }
        grid.appendChild(card);

        });
            showClassInfo(cls.id);
        card.addEventListener('mouseenter', () => {

        });
            selectClass(cls.id);
            e.stopPropagation();
        card.addEventListener('click', (e) => {

        card.innerHTML = `<span class="class-icon"><i class="ra ${getIconForClass(cls.id)}" style="font-size:24px;color:var(--gold);"></i></span><span class="class-card-name">${cls.name}</span>`;
        card.dataset.classId = cls.id;
        card.className = 'class-card';
        const card = document.createElement('div');
    for (const cls of getAllClasses()) {

    }
        showClassInfo(selectedClass);
    if (selectedClass) {
    // Default info to current selected class

    grid.innerHTML = '';
    if (!grid) return;
    const grid = $('class-grid');
function initClassGrid() {
// â”€â”€â”€ CLASS SELECTION GRID â”€â”€â”€

}
    }
        el.appendChild(p);
        p.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
        p.style.animationDelay = (-Math.random() * 15) + 's';
        p.style.animationDuration = (6 + Math.random() * 10) + 's';
        p.style.left = Math.random() * 100 + '%';
        p.style.width = p.style.height = size + 'px';
        const size = 4 + Math.random() * 12;
        p.className = 'particle';
        const p = document.createElement('div');
    for (let i = 0; i < 30; i++) {
    const el = $('particles');
function initParticles() {
// â”€â”€â”€ MENU PARTICLES â”€â”€â”€

const $ = id => document.getElementById(id);
// â”€â”€â”€ DOM REFS â”€â”€â”€

window.DIFFICULTY_MULT = [1.0, 2.5, 5.0, 5.0]; // Rift mode uses Hell base stats
window.DIFFICULTY_NAMES = ['Normal', 'Nightmare', 'Hell', 'Rift Mode'];

};
    99: 'Moo Moo Farm',
    26: 'Infinite Rift',
    25: 'Worldstone Chamber',
    24: 'Worldstone Keep',
    23: 'Arreat Summit',
    22: 'Bloody Foothills',
    21: 'Harrogath',
    20: 'Chaos Sanctuary',
    19: 'River of Flame',
    18: 'Plains of Despair',
    17: 'Outer Steppes',
    16: 'Pandemonium Fortress',
    15: 'Durance of Hate',
    14: 'Travincal',
    13: 'Flayer Jungle',
    12: 'Spider Forest',
    11: 'Kurast Docks',
    10: 'Tal Rasha\'s Chamber',
    9: 'Far Oasis',
    8: 'Dry Hills',
    7: 'Rocky Waste',
    6: 'Lut Gholein',
    5: 'The Cauterized Arena',
    4: 'Catacombs',
    3: 'Dark Wood',
    2: 'Cold Plains',
    1: 'Blood Moor',
    0: 'Rogue Encampment',
const ZONE_NAMES = {

];
    { id: 'lvl_10', name: 'Rising Power', desc: 'Reach level 10', check: () => player && player.level >= 10, reward: 200 },
    { id: 'merc', name: 'Companionship', desc: 'Hire a mercenary', check: () => mercenary !== null, reward: 0 },
    { id: 'rich', name: 'Golden Hoard', desc: 'Accumulate 1000 gold', check: () => player && player.gold >= 1000, reward: 0 },
    { id: 'quest_all', name: 'Champion of Light', desc: 'Complete all quests', check: () => completedQuests.size >= 4, reward: 1000 },
    { id: 'quest_1', name: 'Quest Seeker', desc: 'Complete your first quest', check: () => completedQuests.size >= 1, reward: 100 },
    { id: 'hell', name: 'Into the Fire', desc: 'Enter Hell difficulty', check: () => difficulty >= 2, reward: 1000 },
    { id: 'nightmare', name: 'Nightmare Begins', desc: 'Enter Nightmare difficulty', check: () => difficulty >= 1, reward: 500 },
    { id: 'reach_5', name: 'Hero of Act I', desc: 'Reach Zone 5', check: () => discoveredWaypoints.has(5), reward: 200 },
    { id: 'slayer_100', name: 'Legendary Slayer', desc: 'Slay 100 monsters', check: () => killCount >= 100, reward: 500 },
    { id: 'slayer_50', name: 'Veteran Slayer', desc: 'Slay 50 monsters', check: () => killCount >= 50, reward: 300 },
    { id: 'slayer_10', name: 'Slayer', desc: 'Slay 10 monsters', check: () => killCount >= 10, reward: 100 },
    { id: 'first_blood', name: 'First Blood', desc: 'Slay your first monster', check: () => killCount >= 1, reward: 50 },
const ACHIEVEMENTS = [

}
    }
        }
            break;
            addCombatLog(`Runeword Manifested: ${rw.name}!`, 'log-crit');

            }
                item.mods.push({ stat, value });
            for (const [stat, value] of Object.entries(rw.bonuses)) {
            // Map bonuses to mods

            if (!item.mods) item.mods = [];
            item.rarity = 'runeword';
            item.name = `${rw.name} (${item.name})`; // Classic parenthesis
        if (match) {

        }
            }
                break;
                match = false;
            if (item.socketed[i].baseId !== `rune_${rw.runes[i]}`) {
        for (let i = 0; i < rw.runes.length; i++) {
        let match = true;

        if (rw.runes.length !== item.sockets) continue;
        if (!validMatch) continue;
        const validMatch = rw.allowedTypes.includes(item.type) || (rw.allowedTypes.includes('weapon') && isWeapon);
        // Match structure: rw.runes (Array of ids), rw.allowedTypes (Array of string)
    for (const rw of RUNEWORDS) {

    const isWeapon = weaponTypes.includes(item.type);
    const weaponTypes = ['sword', 'axe', 'mace', 'staff', 'orb', 'bow', 'dagger', 'totem', 'wand'];

    if (item.rarity !== 'normal') return; // Must be white/grey base
    if (item.socketed.length !== item.sockets) return;
    if (!item.socketed || item.socketed.length === 0) return;
function checkRuneword(item) {

}
    }
        $('boss-name').textContent = boss.name;
        bossBar.classList.remove('hidden');
    if (bossBar) {
    const bossBar = $('boss-hp-bar');

    startAmbientBoss();
    addCombatLog('THE RIFT GUARDIAN HAS ARRIVED!', 'log-crit');

    fx.shake(1000, 15);
    fx.emitBurst(tx, ty, '#f0f', 50, 4);
    fx.emitHolyBurst(tx, ty);
    playZoneTransition(); // reuse for sound/flash

    });
        }
            spawnFloatingText(worldX, worldY, dealt, type, isCrit);
        if (typeof dealt === 'number' || dealt === 'Blocked!') {
}
    if (typeof startAmbientBoss === 'function') startAmbientBoss();
    bus.emit('log:add', { text: `THE RIFT GUARDIAN HAS ARRIVED: ${boss.name}!`, cls: 'log-crit' });

    enemies.push(boss);
    const boss = new Enemy(bossData, zoneLevel);

    };
        isRiftGuardian: true
        dmgMult: (3 + depth * 0.2) * base.dmgMult,
        hpMult: (15 + depth * 2) * base.hpMult,
        icon: base.icon,
        name: `${base.name}, Guardian of Depth ${depth}`,
        level: zoneLevel,
        type: 'boss',
        x: tx, y: ty,
    const bossData = {

    const ty = player.y + Math.sin(angle) * 150;
    const tx = player.x + Math.cos(angle) * 150;
    const angle = Math.random() * Math.PI * 2;
    // Choose location near player

    const depth = zoneLevel - 6;
    const base = guardians[Math.floor(Math.random() * guardians.length)];
    
    ];
        { name: 'The Butcher', icon: 'boss_the_butcher', hpMult: 1.8, dmgMult: 1.8 }
        { name: 'The Cow King', icon: 'boss_cow_king', hpMult: 2.2, dmgMult: 1.6 },
        { name: 'Diablo', icon: 'boss_diablo', hpMult: 2.0, dmgMult: 1.5 },
        { name: 'Mephisto', icon: 'boss_mephisto', hpMult: 1.6, dmgMult: 1.4 },
        { name: 'Duriel', icon: 'boss_duriel', hpMult: 1.8, dmgMult: 1.3 },
        { name: 'Andariel', icon: 'boss_andariel', hpMult: 1.5, dmgMult: 1.2 },
    const guardians = [
    // Guardian Pool
    
    window.riftGuardianSpawned = true;
function spawnRiftGuardian() {

}
    });
        modList.appendChild(badge);
        badge.title = mod.desc;
        badge.textContent = mod.name;
        badge.className = 'chaos-mod-badge';
        const badge = document.createElement('div');
    window.activeRiftMods.forEach(mod => {
    modList.innerHTML = '';
    const modList = $('rift-mods-list');

    $('rift-gauge-fill').style.width = `${window.riftProgress}%`;
    $('rift-depth-label').textContent = `INFERNAL RIFT LEVEL ${window.riftLevel}`;
    hud.classList.remove('hidden');
    }
        return;
        hud.classList.add('hidden');
    if (zoneLevel < 7) {
    const hud = $('rift-hud');
function updateRiftHud() {

}
    }
        window.activeRiftMods.push(pool.splice(idx, 1)[0]);
        const idx = Math.floor(Math.random() * pool.length);
        if (pool.length === 0) break;
    for (let i = 0; i < Math.min(count, 3); i++) {
    const pool = [...RIFT_MODS];
    const count = 1 + Math.floor((zoneLevel - 7) / 5); // 1 mod at lvl 8, 2 at 13, etc
    window.activeRiftMods = [];
function generateRiftMods() {

];
    { id: 'cursed', name: 'Cursed', hp: 1.0, dmg: 1.1, res: -20, desc: 'Player Armor Reduced' }
    { id: 'frenzied', name: 'Frenzied', hp: 0.9, dmg: 1.1, speed: 1.4, desc: 'Increased Speed' },
    { id: 'fortified', name: 'Fortified', hp: 2.0, dmg: 0.9, desc: 'Extreme Health' },
    { id: 'toxic', name: 'Toxic Clout', hp: 1.0, dmg: 1.2, desc: 'Monsters deal poison' },
    { id: 'glass', name: 'Glass Cannon', hp: 0.6, dmg: 1.8, desc: 'Fragile but Deadly' },
    { id: 'vampiric', name: 'Vampiric', hp: 1.2, dmg: 1.0, desc: 'Monsters heal on hit' },
const RIFT_MODS = [

window.activeRiftMods = []; // { id, name, effect }
window.riftGuardianSpawned = false;
window.riftLevel = 1; // Phase 22: Infinite Rift Depth
window.riftProgress = 0; // 0-100
// â”€â”€â”€ RIFT GLOBALS â”€â”€â”€

let lastBossWarnTime = 0;
let uiActiveBoss = null;
let timeScale = 1.0;
// â”€â”€â”€ Phase 12 GLOBALS â”€â”€â”€

}
    document.body.classList.toggle('socketing-mode', socketingGemIndex !== -1 || isLarzukSocketing);
    document.body.classList.toggle('identifying-mode', !!window.isIdentifying);
function syncInteractionStates() {

window._corpses = []; // For skills like Corpse Explosion
let minimapZoom = 1.0; // 1.0, 1.5, 2.0
let dragSourceIdx = null;
let dragSource = null;
let draggedItem = null;
let dragGhost = null;
// --- Phase 30: Drag & Drop Global State ---

let activeWaypointObj = null; // Track Waypoint object for travel menu
let activeDialogueNpc = null; // Track NPC with open dialogue bubble
let isParagonOpen = false; // Phase 23: Paragon UI state
let isReforging = false; // Phase 22: Charsi Reforge state
let activePet = null; // Phase 30: Persistent companion
let isImbuing = false; // Phase 21: Charsi Imbue state
let isLarzukSocketing = false; // Global socketing service state
let isIdentifying = false; // Global identification state
let unlockedAchievements = new Set();
let showFullMap = false;
let lootFilter = 0; // 0=show all, 1=hide normal, 2=hide normal+magic
let mercenary = null; // { name, hp, maxHp, dmg, icon, x, y }
let sessionGold = 0;
let totalGoldCollected = 0;
let totalMonstersSlain = 0;
let killCount = 0;
let completedQuests = new Set();
let activeBounties = []; // Phase 28: { id, desc, target, progress, targetCount, reward }
let activeQuests = []; // { id, desc, target, progress, reward }
let cube = Array(9).fill(null); // Horadric Cube
let stash = Array(20).fill(null); // Personal stash
let discoveredWaypoints = new Set([0]); // Always have Town
let difficulty = 0; // 0=Normal, 1=Nightmare, 2=Hell
let explored = null; // for minimap fog
let lastHitTime = 0;
let activeSlotId = null;
let dialogue = null;
let isTransitioning = false;
let isZoneLocked = false;
let isBossZone = false;
window.currentTheme = 'town';
let zoneLevel = 0;
let portalReturnZone = 0;
let isNightManual = false; // Internal flag for state checks
let worldTime = 8 * 60; // Start at 08:00 AM
let lastTime = 0, lastSaveTime = 0;
let state = 'MENU', selectedClass = null;
let floatingTexts = []; // Phase 15: Damage Numbers
let droppedItems = [], droppedGold = [];
let projectiles = [], aoeZones = [];
let enemies = [], npcs = [], gameObjects = [];
let renderer, camera, input, dungeon, player;
// â”€â”€â”€ GLOBALS â”€â”€â”€

import { RUNEWORDS } from './data/runes.js';

window.addCombatLog = addCombatLog;
window.updateHud = updateHud;
window.renderInventory = renderInventory;
window.hideTooltip = hideTooltip;
window.showTooltip = showTooltip;
window.getItemHtml = getItemHtml;
window.calculateSellPrice = calculateSellPrice;
window.VendorUI = VendorUI;
window.Vendor = Vendor;
window.loot = loot;
// Expose globals for external modules

import { campaign } from './systems/campaignSystem.js';
import { VendorUI } from './ui/vendorUI.js';
import { Vendor } from './vendorSystem.js';
import { fx } from './engine/ParticleSystem.js';
import { ITEM_BASES, items } from './data/items.js';
import { initAudio, playLoot, playCastFire, playCastCold, playCastLightning, playCastPoison, playCastShadow, playDeathSfx, playZoneTransition, startAmbientDungeon, startAmbientBoss, stopAmbient } from './engine/audio.js';
import { ASSET_NAMES } from './data/assets_list.js';
import { GameObject } from './entities/object.js';
import { Pet } from './entities/pet.js';
import { Mercenary } from './entities/mercenary.js';
import { NPC } from './entities/npc.js';
import { DB } from './systems/db.js';
import { SaveSystem } from './systems/saveSystem.js';
import { updateStatuses } from './systems/combat.js';
import { loot, SETS } from './systems/lootSystem.js';
import { getAllClasses, getClass } from './data/classes.js';
import { Enemy } from './entities/enemy.js';
import { Player } from './entities/player.js';
import { Dungeon } from './world/dungeon.js';
import { MobileControls } from './ui/MobileControls.js';
import { Input } from './engine/Input.js';
import { Camera } from './engine/Camera.js';
import { Renderer, Assets } from './engine/renderer.js';
import { bus } from './engine/EventBus.js';
 */
 * Wires all systems together: menu â†’ game loop â†’ rendering â†’ UI
 * MAIN.JS â€” Dark Realm entry point
/**
}
