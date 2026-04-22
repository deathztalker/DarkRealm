/**
 * Dungeon Generator — BSP room-corridor procedural generation
 */

export const TILE = { FLOOR: 0, WALL: 1, DOOR: 2, STAIRS_DOWN: 3, STAIRS_UP: 4, SPAWN: 5, GRASS: 6, PATH: 7, WATER: 8, TREE: 9, BRIDGE: 10, SAND: 11, CACTUS: 12, LAVA: 13, SNOW: 14, ICE: 15 };

export const TILE_COLORS = {
    [TILE.FLOOR]: '#2c2838', [TILE.WALL]: '#161320', [TILE.DOOR]: '#5a3a20',
    [TILE.STAIRS_DOWN]: '#3a2a4a', [TILE.STAIRS_UP]: '#2a1a3a',
    [TILE.GRASS]: '#2d5a27', [TILE.PATH]: '#5c4a3d', [TILE.WATER]: '#1e4b85',
    [TILE.TREE]: '#1b4018', [TILE.BRIDGE]: '#503525',
    [TILE.SAND]: '#d4a017', [TILE.CACTUS]: '#4a6b2c',
    [TILE.LAVA]: '#ff4500', // Molten orange
    [TILE.SNOW]: '#ffffff', // Pure white
    [TILE.ICE]: '#a0e0ff'   // Light cyan
};

export class Dungeon {
    constructor(width = 150, height = 120, tileSize = 16) {
        this.width = width; this.height = height; this.tileSize = tileSize;
        this.grid = [];
        this.rooms = [];
        this.enemySpawns = [];
        this.lootSpawns = [];
        this.npcSpawns = [];
        this.objectSpawns = [];
        this.playerStart = { x: 0, y: 0 };
        this.exitPos = { x: 0, y: 0 };
        this._seed = 12345;
    }

    /** Simple LCG Random for Deterministic Generation */
    rng() {
        this._seed = (this._seed * 1664525 + 1013904223) % 4294967296;
        return this._seed / 4294967296;
    }

    generate(zoneLevel = 1, theme = 'cathedral', seed = null) {
        if (seed !== null) this._seed = seed;
        else this._seed = Math.floor(Math.random() * 1000000);

        if (zoneLevel >= 128) return this.generateRift(zoneLevel);

        if ([0, 38, 68, 96, 102].includes(zoneLevel)) {
            return this.generateTown(theme, zoneLevel);
        }
        if ([37, 67, 95, 101, 125, 127].includes(zoneLevel) || (zoneLevel >= 128 && zoneLevel % 5 === 0)) return this.generateBossRoom(theme, zoneLevel);

        return this._generateProcedural(zoneLevel, theme, true);
    }

    generateRift(zoneLevel) {
        const themes = ['cathedral', 'desert', 'tomb', 'jungle', 'temple', 'hell', 'snow'];
        const theme = themes[Math.floor(this.rng() * themes.length)];
        return this._generateProcedural(zoneLevel, theme, false);
    }

    _generateProcedural(zoneLevel, theme, placeExit = true) {
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
        this.rooms = [];
        this.enemySpawns = [];
        this.lootSpawns = [];
        this.npcSpawns = [];
        this.objectSpawns = [];

        // Organic vs Structural Generation
        const isOrganicTheme = ['jungle', 'desert', 'snow', 'hell'].includes(theme);

        if (!isOrganicTheme) {
            // BSP split
            const root = { x: 1, y: 1, w: this.width - 2, h: this.height - 2 };
            let iterations = 6;
            if (theme === 'catacombs') iterations = 7;
            if (theme === 'temple') iterations = 5;

            const leaves = this._bsp(root, 0, iterations);

            // Carve rooms in leaves
            for (const leaf of leaves) {
                const room = this._carveRoom(leaf);
                if (room) this.rooms.push(room);
            }

            // Connect rooms with corridors
            for (let i = 1; i < this.rooms.length; i++) {
                this._corridor(this.rooms[i - 1], this.rooms[i]);
            }
        } else {
            // Cellular Automata
            this._generateAutomata();
        }

        // --- Theme Post-Processing ---
        if (theme === 'desert') {
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    if (this.grid[r][c] === TILE.FLOOR) {
                        this.grid[r][c] = TILE.SAND;
                        if (this.rng() < 0.03) this.grid[r][c] = TILE.CACTUS;
                    }
                }
            }
        } else if (theme === 'jungle') {
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    if (this.grid[r][c] === TILE.FLOOR) {
                        this.grid[r][c] = TILE.GRASS;
                        if (this.rng() < 0.1) this.grid[r][c] = TILE.TREE;
                    }
                }
            }
        } else if (theme === 'temple') {
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    if (this.grid[r][c] === TILE.FLOOR && this.rng() < 0.1) {
                        this.grid[r][c] = TILE.WATER;
                    }
                }
            }
        } else if (theme === 'hell') {
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    if (this.grid[r][c] === TILE.FLOOR && this.rng() < 0.08) {
                        this.grid[r][c] = TILE.LAVA;
                    }
                }
            }
        } else if (theme === 'snow') {
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    if (this.grid[r][c] === TILE.FLOOR) {
                        this.grid[r][c] = TILE.SNOW;
                        if (this.rng() < 0.05) this.grid[r][c] = TILE.ICE;
                    }
                }
            }
        } else if (theme === 'arcane') {
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    if (this.grid[r][c] === TILE.FLOOR) {
                        this.grid[r][c] = TILE.ICE; // Arcane path style
                    }
                }
            }
        }

        // Place player start
        const first = this.rooms[0] || { x: 5, y: 5, w: 5, h: 5 };
        this.playerStart = {
            x: (first.x + Math.floor(first.w / 2)) * this.tileSize + this.tileSize / 2,
            y: (first.y + Math.floor(first.h / 2)) * this.tileSize + this.tileSize / 2,
        };

        // Place Waypoint in first room
        this.objectSpawns.push({
            type: 'waypoint',
            x: this.playerStart.x + 32,
            y: this.playerStart.y,
            icon: 'obj_waypoint',
            zone: zoneLevel
        });

        // Place exit
        if (placeExit && this.rooms.length > 0) {
            const last = this.rooms[this.rooms.length - 1];
            const ec = last.x + Math.floor(last.w / 2);
            const er = last.y + Math.floor(last.h / 2);
            this.grid[er][ec] = TILE.STAIRS_DOWN;
            this.exitPos = { x: ec * this.tileSize + this.tileSize / 2, y: er * this.tileSize + this.tileSize / 2 };
        } else {
            this.exitPos = { x: -1000, y: -1000 };
        }

        // Populate with objects and enemies
        this._populate(zoneLevel, theme);

        return this;
    }

    _populate(zl, theme) {
        let breakableIcon = 'obj_barrel';
        if (theme === 'desert' || theme === 'tomb') breakableIcon = 'obj_urn';
        else if (theme === 'hell') breakableIcon = 'obj_urn_hell';

        for (let i = 1; i < this.rooms.length; i++) {
            const room = this.rooms[i];
            
            // 1. Enemies
            const count = 2 + Math.floor(this.rng() * 4) + Math.floor(zl / 10);
            for (let n = 0; n < count; n++) {
                const sx = room.x + 1 + Math.floor(this.rng() * (room.w - 2));
                const sy = room.y + 1 + Math.floor(this.rng() * (room.h - 2));
                const isBoss = (i === this.rooms.length - 1 && n === 0);
                const isElite = !isBoss && this.rng() < 0.15;

                const spawn = {
                    x: sx * this.tileSize + this.tileSize / 2,
                    y: sy * this.tileSize + this.tileSize / 2,
                    type: isBoss ? 'boss' : isElite ? 'elite' : 'normal',
                    level: zl,
                };

                // Inject Unique Mini-Bosses
                if (isBoss) {
                    if (zoneLevel === 37 && i === this.rooms.length - 2 && this.rng() < 0.3) {
                        spawn.name = "The Butcher";
                        spawn.icon = "enemy_demon";
                        spawn.isButcher = true;
                        spawn.hpMult = 5.0;
                    }
                    const uniqueMapping = {
                        40: { name: "Radament", icon: "enemy_skeleton", isRadament: true, hpMult: 3.5 },
                        46: { name: "Beetleburst", icon: "enemy_spider", isBeetleburst: true, hpMult: 3.0 },
                        48: { name: "Coldworm the Burrower", icon: "enemy_spider", isColdworm: true, hpMult: 3.5 },
                        59: { name: "The Summoner", icon: "class_sorceress", hpMult: 6.0, dmgMult: 4.5 },
                        82: { name: "Battlemaid Sarina", icon: "enemy_ghost", isSarina: true, hpMult: 3.0 },
                        92: { name: "Toorc Icefist", icon: "enemy_skeleton", isCouncil: true, hpMult: 4.5 },
                        103: { name: "Shenk the Overseer", icon: "enemy_demon", isShenk: true, hpMult: 4.0 },
                        109: { name: "Frozenstein", icon: "enemy_demon", isFrozenstein: true, hpMult: 4.0 }
                    };
                    if (uniqueMapping[zl]) Object.assign(spawn, uniqueMapping[zl]);

                    if (zl === 98) { spawn.name = "Izual"; spawn.icon = "boss_izual"; spawn.isIzual = true; spawn.hpMult = 8.0; }
                    if (zl === 100) { 
                        spawn.name = "Hephaisto"; spawn.icon = "boss_hephaisto"; spawn.isHephaisto = true; spawn.hpMult = 8.0;
                        this.objectSpawns.push({ id: 'hellforge', type: 'hellforge', name: 'The Hellforge', x: spawn.x + 60, y: spawn.y, icon: 'obj_altar' });
                    }

                    // Act V: The Ancients (Trio)
                    if (zoneLevel === 116 && i === this.rooms.length - 1) {
                        // We replace the last room spawn with 3 Ancients
                        spawn.name = "Talic the Defender"; spawn.icon = "enemy_demon"; spawn.isAncient = true; spawn.hpMult = 5.0;
                        const s2 = { ...spawn, name: "Madawc the Guardian", x: spawn.x + 40, isAncient: true };
                        const s3 = { ...spawn, name: "Korlic the Protector", x: spawn.x - 40, isAncient: true };
                        this.enemySpawns.push(s2, s3);
                        // Inject Altar nearby
                        this.objectSpawns.push({ id: 'ancients_altar', type: 'ancients_altar', name: 'Altar of the Heavens', x: spawn.x, y: spawn.y - 60, icon: 'obj_altar' });
                    }
                }
                this.enemySpawns.push(spawn);
            }

            // 2. Loot / Chests
            if (this.rng() < 0.25) {
                const cx = (room.x + Math.floor(room.w/2)) * this.tileSize;
                const cy = (room.y + Math.floor(room.h/2)) * this.tileSize;
                this.objectSpawns.push({ type: 'chest', x: cx, y: cy, icon: 'obj_chest' });
            }

            // 3. Shrines
            if (i > 1 && i < this.rooms.length - 1 && this.rng() < 0.15) {
                const sx = (room.x + 1) * this.tileSize;
                const sy = (room.y + 1) * this.tileSize;
                const types = ['experience', 'armor', 'combat', 'mana', 'resist', 'speed'];
                this.objectSpawns.push({ type: 'shrine', x: sx, y: sy, icon: 'obj_shrine', shrineType: types[Math.floor(this.rng()*types.length)] });
            }

            // 4. Breakables
            const bCount = 1 + Math.floor(this.rng() * 4);
            for(let b=0; b<bCount; b++) {
                const bx = (room.x + 1 + Math.floor(this.rng() * (room.w-2))) * this.tileSize;
                const by = (room.y + 1 + Math.floor(this.rng() * (room.h-2))) * this.tileSize;
                this.objectSpawns.push({ type: 'breakable', x: bx, y: by, icon: breakableIcon });
            }

            // 5. Decorative Act-Specific Props
            if (zl <= 37) { // Act 1
                if (theme === 'catacombs' && this.rng() < 0.2) {
                    const px = (room.x + 2) * this.tileSize; const py = (room.y + 2) * this.tileSize;
                    this.objectSpawns.push({ type: 'decoration', x: px, y: py, icon: 'obj_sarcophagus' });
                }
                if (theme === 'catacombs' && this.rng() < 0.1) {
                    const px = (room.x + room.w - 2) * this.tileSize; const py = (room.y + 2) * this.tileSize;
                    this.objectSpawns.push({ type: 'decoration', x: px, y: py, icon: 'obj_gargoyle' });
                }
            } else if (zl <= 67) { // Act 2
                if (this.rng() < 0.15) {
                    const px = (room.x + Math.floor(room.w/2)) * this.tileSize;
                    const py = (room.y + 2) * this.tileSize;
                    this.objectSpawns.push({ type: 'decoration', x: px, y: py, icon: 'obj_pillar_holy' });
                }
            } else if (zl <= 101) { // Act 4
                if (this.rng() < 0.2) {
                    const px = (room.x + Math.floor(this.rng()*room.w)) * this.tileSize;
                    const py = (room.y + Math.floor(this.rng()*room.h)) * this.tileSize;
                    this.objectSpawns.push({ type: 'decoration', x: px, y: py, icon: 'obj_cluster_soulstone' });
                }
            }
        }
    }

    generateTown(theme, zoneLevel = 0) {
        this.rooms = [];
        this.enemySpawns = [];
        this.lootSpawns = [];
        this.npcSpawns = [];
        this.objectSpawns = [];
        const cx = Math.floor(this.width / 2);
        const cy = Math.floor(this.height / 2);

        const addNpc = (id, name, type, dx, dy, icon, dialogue) => {
            this.npcSpawns.push({ id, name, type, x: (cx + dx) * this.tileSize, y: (cy + dy) * this.tileSize, icon, dialogue });
        };

        if (zoneLevel === 0) {
            // Act 1: Rogue Encampment (D2-accurate)
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.GRASS));
            // Path and Encampment Square
            for (let y = cy - 10; y <= cy + 10; y++) {
                for (let x = cx - 12; x <= cx + 12; x++) {
                    if (Math.hypot(x-cx, y-cy) < 10) this.grid[y][x] = TILE.PATH;
                }
            }
            // River to the south
            for (let x = 0; x < this.width; x++) {
                for (let y = cy + 15; y < cy + 25; y++) this.grid[y][x] = TILE.WATER;
            }
            // Fences and Tents
            this.objectSpawns.push({ id: 'tent_akara', type: 'tent', name: "Akara's Tent", x: (cx - 8) * this.tileSize, y: (cy - 6) * this.tileSize, icon: 'obj_tent_rogue' });
            this.objectSpawns.push({ id: 'tent_charsi', type: 'tent', name: "Charsi's Forge", x: (cx + 10) * this.tileSize, y: (cy - 2) * this.tileSize, icon: 'obj_tent_leather' });
            this.objectSpawns.push({ id: 'bonfire', type: 'decoration', name: "Campfire", x: cx * this.tileSize, y: cy * this.tileSize, icon: 'obj_bonfire' });
            for(let i=0; i<8; i++) {
                this.objectSpawns.push({ type: 'decoration', x: (cx - 15 + i*4) * this.tileSize, y: (cy - 12) * this.tileSize, icon: 'obj_fence_wood' });
            }

            addNpc("akara", "Akara", "elder", -8, -4, "npc_akara", "I am Akara, High Priestess of the Sightless Eye.");
            addNpc("charsi", "Charsi", "merchant", 10, 0, "npc_akara", "Hi there! I'm Charsi, the Encampment's blacksmith.");
            addNpc("kashya", "Kashya", "mercenary_hire", -6, 6, "npc_akara", "I am Kashya. My Rogues are the best scouts in Sanctuary.");
            addNpc("gheed", "Gheed", "merchant", 8, -6, "npc_ormus", "A Deal? I've got plenty of those!");
            addNpc("warriv", "Warriv", "waypoint", 6, 8, "npc_larzuk", "Greetings. I can take you to the East when you are ready.");
            addNpc("deckard_cain", "Deckard Cain", "elder", -2, -2, "npc_deckard_cain", "Stay a while and listen!");

        } else if (zoneLevel === 38) {
            // Act 2: Lut Gholein (City of the Desert)
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.SAND));
            // City Walls and Paving
            for (let y = cy - 15; y <= cy + 15; y++) {
                for (let x = cx - 20; x <= cx + 20; x++) {
                    if (Math.abs(x-cx) < 18 && Math.abs(y-cy) < 13) this.grid[y][x] = TILE.FLOOR; // Stone paved
                }
            }
            // Sea to the right
            for (let y = 0; y < this.height; y++) {
                for (let x = cx + 25; x < this.width; x++) this.grid[y][x] = TILE.WATER;
            }
            // Sandstone Buildings
            this.objectSpawns.push({ type: 'house', x: (cx - 14) * this.tileSize, y: (cy - 8) * this.tileSize, icon: 'obj_house_sandstone' });
            this.objectSpawns.push({ type: 'house', x: (cx - 14) * this.tileSize, y: (cy + 6) * this.tileSize, icon: 'obj_house_sandstone' });
            this.objectSpawns.push({ type: 'house', x: (cx + 10) * this.tileSize, y: (cy - 10) * this.tileSize, icon: 'obj_house_sandstone' });
            
            addNpc("fara", "Fara", "elder", -6, -8, "npc_akara", "I am Fara. I can heal your wounds and repair your gear.");
            addNpc("lysander", "Lysander", "merchant", -12, 0, "npc_akara", "Be careful! I'm brewing something sensitive.");
            addNpc("drognan", "Drognan", "merchant", 10, -6, "npc_ormus", "The Vizjerei have many secrets.");
            addNpc("greiz", "Greiz", "mercenary_hire", 12, 6, "npc_larzuk", "My desert mercenaries are for hire.");
            addNpc("atma", "Atma", "elder", 0, 10, "npc_akara", "Radament... he killed my family.");
            addNpc("meshif", "Meshif", "waypoint", 18, 0, "npc_larzuk", "I am the captain of this ship.");
            addNpc("deckard_cain", "Deckard Cain", "elder", -2, -2, "npc_deckard_cain", "Stay a while and listen!");

        } else if (zoneLevel === 68) {
            // Act 3: Kurast Docks (Jungle Outpost)
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WATER));
            // Massive wood docks
            for (let y = cy - 12; y <= cy + 12; y++) {
                for (let x = cx - 25; x <= cx + 15; x++) {
                    if (Math.abs(y-cy) < 5 || Math.abs(x-cx) < 5) this.grid[y][x] = TILE.BRIDGE;
                }
            }
            // Stilt Huts
            this.objectSpawns.push({ type: 'hut', x: (cx - 18) * this.tileSize, y: (cy - 8) * this.tileSize, icon: 'obj_hut_stilt' });
            this.objectSpawns.push({ type: 'hut', x: (cx - 18) * this.tileSize, y: (cy + 8) * this.tileSize, icon: 'obj_hut_stilt' });
            this.objectSpawns.push({ type: 'hut', x: (cx + 10) * this.tileSize, y: (cy - 10) * this.tileSize, icon: 'obj_hut_stilt' });
            
            addNpc("ormus", "Ormus", "elder", -4, -4, "npc_ormus", "Ormus has been waiting for you.");
            addNpc("hratli", "Hratli", "merchant", 8, -6, "npc_larzuk", "Good luck in the jungle, traveler.");
            addNpc("asheara", "Asheara", "mercenary_hire", -10, 8, "npc_akara", "The Iron Wolves are ready.");
            addNpc("alkor", "Alkor", "merchant", -15, -10, "npc_akara", "I am Alkor. I deal in alchemy.");
            addNpc("deckard_cain", "Deckard Cain", "elder", -2, -2, "npc_deckard_cain", "Stay a while and listen!");

        } else if (zoneLevel === 96) {
            // Act 4: Pandemonium Fortress
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
            for (let y = cy - 12; y <= cy + 12; y++) {
                for (let x = cx - 12; x <= cx + 12; x++) {
                    if (Math.hypot(x-cx, y-cy) < 11) this.grid[y][x] = TILE.FLOOR;
                }
            }
            this.objectSpawns.push({ type: 'altar', x: cx * this.tileSize, y: (cy - 4) * this.tileSize, icon: 'obj_pandemonium_altar' });
            
            addNpc("tyrael", "Tyrael", "elder", 0, -8, "npc_tyrael", "The Light welcomes you to the last bastion.");
            addNpc("jamella", "Jamella", "merchant", -6, -4, "npc_akara", "I can heal your soul.");
            addNpc("halbu", "Halbu", "merchant", 6, -4, "npc_larzuk", "Armor... weapons... I have it all.");
            addNpc("deckard_cain", "Deckard Cain", "elder", -2, -2, "npc_deckard_cain", "Stay a while and listen!");

        } else if (zoneLevel === 102) {
            // Act 5: Harrogath (Snowy Stronghold)
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.SNOW));
            for (let y = cy - 12; y <= cy + 12; y++) {
                for (let x = cx - 15; x <= cx + 15; x++) {
                    if (Math.abs(x-cx) < 13 && Math.abs(y-cy) < 10) this.grid[y][x] = TILE.PATH;
                }
            }
            // Cabins
            this.objectSpawns.push({ type: 'house', x: (cx - 10) * this.tileSize, y: (cy - 6) * this.tileSize, icon: 'obj_harrogath_cabin' });
            this.objectSpawns.push({ type: 'house', x: (cx + 10) * this.tileSize, y: (cy - 6) * this.tileSize, icon: 'obj_harrogath_cabin' });
            
            addNpc("malah", "Malah", "elder", -6, -8, "npc_akara", "Welcome to Harrogath, child.");
            addNpc("larzuk", "Larzuk", "merchant", 10, -2, "npc_larzuk", "I am the best smith on Arreat.");
            addNpc("qual_kehk", "Qual-Kehk", "mercenary_hire", -10, 6, "npc_larzuk", "My warriors will fight for you.");
            addNpc("anya", "Anya", "merchant", 10, 6, "npc_akara", "I owe you my life.");
            addNpc("nihlathak", "Nihlathak", "elder", 0, -10, "npc_ormus", "I am busy. Begone.");
            addNpc("deckard_cain", "Deckard Cain", "elder", -2, -2, "npc_deckard_cain", "Stay a while and listen!");
        }

        this.playerStart = { x: cx * this.tileSize, y: (cy + 4) * this.tileSize };
        this.exitPos = { x: cx * this.tileSize, y: (cy + 15) * this.tileSize };
        
        // Waypoint in the center
        this.objectSpawns.push({ type: 'waypoint', x: cx * this.tileSize, y: (cy + 2) * this.tileSize, icon: 'obj_waypoint', zone: zoneLevel });
        this.objectSpawns.push({ id: 'stash', type: 'stash', name: 'Stash', x: (cx - 4) * this.tileSize, y: (cy + 2) * this.tileSize, icon: 'obj_chest' });
        this.objectSpawns.push({ id: 'cube', type: 'cube', name: 'Horadric Cube', x: (cx - 6) * this.tileSize, y: (cy + 2) * this.tileSize, icon: 'item_horadric_fragment' });

        return this;
    }


    generateBossRoom(theme, zoneLevel = 5) {
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
        this.rooms = [];
        this.enemySpawns = [];
        this.lootSpawns = [];
        this.npcSpawns = [];
        this.objectSpawns = [];

        const cx = Math.floor(this.width / 2);
        const cy = Math.floor(this.height / 2);
        const radius = 15;

        // Circular-ish Arena
        for (let y = cy - radius; y <= cy + radius; y++) {
            for (let x = cx - radius; x <= cx + radius; x++) {
                if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) {
                    this.grid[y][x] = theme === 'catacombs' ? TILE.PATH : TILE.FLOOR;
                }
            }
        }

        // Entrance hallway
        for (let y = cy + radius; y <= cy + radius + 10; y++) {
            for (let x = cx - 2; x <= cx + 2; x++) {
                this.grid[y][x] = TILE.PATH;
            }
        }

        this.playerStart = { x: cx * this.tileSize, y: (cy + radius + 8) * this.tileSize };

        
        // Boss Selection based on level
        let bossName = "Blood Raven"; let bossIcon = "enemy_ghost"; let hpMult = 2.0;
        let isAndariel = false, isDuriel = false, isMephisto = false, isDiablo = false, isBaal = false, isUber = false;

        if (zoneLevel === 37) { bossName = "Andariel"; bossIcon = "boss_andariel"; hpMult = 4.0; isAndariel = true; }
        else if (zoneLevel === 67) { bossName = "Duriel"; bossIcon = "boss_duriel"; hpMult = 6.0; isDuriel = true; }
        else if (zoneLevel === 95) { bossName = "Mephisto"; bossIcon = "boss_mephisto"; hpMult = 8.0; isMephisto = true; }
        else if (zoneLevel === 101) { bossName = "Diablo"; bossIcon = "boss_diablo"; hpMult = 12.0; isDiablo = true; }
        else if (zoneLevel === 125) { bossName = "Baal"; bossIcon = "boss_baal"; hpMult = 15.0; isBaal = true; }
        else if (zoneLevel === 127) { bossName = "Uber Diablo"; bossIcon = "boss_diablo"; hpMult = 30.0; isUber = true; }

        // Boss Spawn in center
        this.enemySpawns.push({
            x: cx * this.tileSize,
            y: cy * this.tileSize,
            type: 'boss',
            level: zoneLevel,
            name: bossName,
            icon: bossIcon,
            hpMult: hpMult,
            dmgMult: 2.0 + (zoneLevel / 20),
            isAndariel, isDuriel, isMephisto, isDiablo, isBaal, isUber
        });

        this.exitPos = { x: -1000, y: -1000 };
        return this;
    }

    _bsp(node, depth, maxDepth) {
        if (depth >= maxDepth || node.w < 12 || node.h < 12) return [node];
        const horizontal = node.h > node.w ? true : node.w > node.h ? false : this.rng() < 0.5;
        const min = 5;
        let left, right;
        if (horizontal) {
            const split = min + Math.floor(this.rng() * (node.h - min * 2));
            left = { x: node.x, y: node.y, w: node.w, h: split };
            right = { x: node.x, y: node.y + split, w: node.w, h: node.h - split };
        } else {
            const split = min + Math.floor(this.rng() * (node.w - min * 2));
            left = { x: node.x, y: node.y, w: split, h: node.h };
            right = { x: node.x + split, y: node.y, w: node.w - split, h: node.h };
        }
        return [...this._bsp(left, depth + 1, maxDepth), ...this._bsp(right, depth + 1, maxDepth)];
    }

    _generateAutomata() {
        // Initial random fill
        let grid = Array.from({ length: this.height }, () =>
            Array.from({ length: this.width }, () => this.rng() < 0.45 ? TILE.WALL : TILE.FLOOR)
        );

        // Run iterations
        for (let i = 0; i < 5; i++) {
            let nextGrid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    let walls = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = r + dr, nc = c + dc;
                            if (nr < 0 || nr >= this.height || nc < 0 || nc >= this.width) walls++;
                            else if (grid[nr][nc] === TILE.WALL) walls++;
                        }
                    }
                    if (walls > 4) nextGrid[r][c] = TILE.WALL;
                    else nextGrid[r][c] = TILE.FLOOR;
                }
            }
            grid = nextGrid;
        }

        // Ensure boundaries are walls
        for (let r = 0; r < this.height; r++) {
            grid[r][0] = TILE.WALL;
            grid[r][this.width - 1] = TILE.WALL;
        }
        for (let c = 0; c < this.width; c++) {
            grid[0][c] = TILE.WALL;
            grid[this.height - 1][c] = TILE.WALL;
        }

        this.grid = grid;

        // --- Critical: Populate virtual rooms for enemy spawning ---
        // CA maps are mostly open, so we create virtual room chunks to trigger the spawn loop
        this.rooms = [];
        const chunkSize = 15;
        for (let r = 2; r < this.height - chunkSize; r += chunkSize) {
            for (let c = 2; c < this.width - chunkSize; c += chunkSize) {
                if (this.grid[r + 5][c + 5] === TILE.FLOOR || this.grid[r + 5][c + 5] === TILE.SAND || this.grid[r + 5][c + 5] === TILE.SNOW || this.grid[r + 5][c + 5] === TILE.GRASS) {
                    this.rooms.push({ x: c, y: r, w: chunkSize - 2, h: chunkSize - 2 });
                }
            }
        }

        if (this.rooms.length === 0) {
            this.rooms.push({ x: 5, y: 5, w: this.width - 10, h: this.height - 10 });
        }
    }

    _carveRoom(leaf) {
        const margin = 2;
        const maxW = leaf.w - margin * 2;
        const maxH = leaf.h - margin * 2;
        if (maxW < 4 || maxH < 4) return null;
        const rw = 4 + Math.floor(this.rng() * (maxW - 3));
        const rh = 4 + Math.floor(this.rng() * (maxH - 3));
        const rx = leaf.x + margin + Math.floor(this.rng() * (maxW - rw + 1));
        const ry = leaf.y + margin + Math.floor(this.rng() * (maxH - rh + 1));
        for (let y = ry; y < ry + rh; y++) {
            for (let x = rx; x < rx + rw; x++) {
                if (y > 0 && y < this.height - 1 && x > 0 && x < this.width - 1)
                    this.grid[y][x] = TILE.FLOOR;
            }
        }
        return { x: rx, y: ry, w: rw, h: rh };
    }

    _corridor(roomA, roomB) {
        const ax = roomA.x + Math.floor(roomA.w / 2);
        const ay = roomA.y + Math.floor(roomA.h / 2);
        const bx = roomB.x + Math.floor(roomB.w / 2);
        const by = roomB.y + Math.floor(roomB.h / 2);
        let cx = ax, cy = ay;
        while (cx !== bx) { this.grid[cy][cx] = TILE.FLOOR; cx += cx < bx ? 1 : -1; }
        while (cy !== by) { this.grid[cy][cx] = TILE.FLOOR; cy += cy < by ? 1 : -1; }
    }

    isWalkable(wx, wy) {
        const c = Math.floor(wx / this.tileSize), r = Math.floor(wy / this.tileSize);
        if (r < 0 || r >= this.height || c < 0 || c >= this.width) return false;
        if (!this.grid || !this.grid[r]) return false;
        const tile = this.grid[r][c];
        // Allow walking on Water and Lava but movement logic will apply a penalty
        return tile !== TILE.WALL && tile !== TILE.TREE;
    }

    /** Raycast using Digital Differential Analyzer (DDA) to check Line of Sight */
    hasLineOfSight(x0, y0, x1, y1) {
        const c0 = Math.floor(x0 / this.tileSize);
        const r0 = Math.floor(y0 / this.tileSize);
        const c1 = Math.floor(x1 / this.tileSize);
        const r1 = Math.floor(y1 / this.tileSize);

        let dx = Math.abs(c1 - c0);
        let dy = Math.abs(r1 - r0);
        let x = c0;
        let y = r0;
        let n = 1 + dx + dy;
        const x_inc = (c1 > c0) ? 1 : -1;
        const y_inc = (r1 > r0) ? 1 : -1;
        let error = dx - dy;
        dx *= 2;
        dy *= 2;

        for (; n > 0; --n) {
            if (y < 0 || y >= this.height || x < 0 || x >= this.width) return false;
            const tile = this.grid[y][x];
            if (tile === TILE.WALL || tile === TILE.TREE) return false;

            if (error > 0) {
                x += x_inc;
                error -= dy;
            } else if (error < 0) {
                y += y_inc;
                error += dx;
            } else {
                x += x_inc;
                error -= dy;
                y += y_inc;
                error += dx;
                n--;
            }
        }
        return true;
    }

    render(renderer, camera) {
        const ctx = renderer.ctx; camera.apply(ctx);
        const ts = this.tileSize;
        const camLeft = Math.max(0, Math.floor(camera.x / ts));
        const camTop = Math.max(0, Math.floor(camera.y / ts));
        const camRight = Math.min(this.width, Math.ceil((camera.x + camera.w / camera.zoom) / ts) + 1);
        const camBottom = Math.min(this.height, Math.ceil((camera.y + camera.h / camera.zoom) / ts) + 1);

        const TILE_SPRITES = {
            [TILE.FLOOR]: 'env_floor', [TILE.WALL]: 'env_wall', [TILE.DOOR]: 'env_door',
            [TILE.STAIRS_DOWN]: 'env_stairs_down', [TILE.STAIRS_UP]: 'env_stairs_up',
            [TILE.GRASS]: 'env_grass', [TILE.PATH]: 'env_path', [TILE.WATER]: 'env_water',
            [TILE.TREE]: 'env_tree', [TILE.BRIDGE]: 'env_bridge',
            [TILE.SAND]: 'env_sand', [TILE.CACTUS]: 'env_cactus',
            [TILE.SNOW]: 'env_snow', [TILE.ICE]: 'env_ice', [TILE.LAVA]: 'env_lava'
        };

        for (let r = camTop; r < camBottom; r++) {
            for (let c = camLeft; c < camRight; c++) {
                const tile = this.grid[r][c];
                const spriteName = TILE_SPRITES[tile];
                const baseColors = {
                    [TILE.FLOOR]: '#1a1820', [TILE.WALL]: '#0a080c', [TILE.DOOR]: '#3a2a1a',
                    [TILE.STAIRS_DOWN]: '#151525', [TILE.STAIRS_UP]: '#151525',
                    [TILE.GRASS]: '#1a2e1a', [TILE.PATH]: '#2a201a', [TILE.WATER]: '#0a1a2e',
                    [TILE.TREE]: '#0a1d0a', [TILE.BRIDGE]: '#2a1a10',
                    [TILE.SAND]: '#3d2e14', [TILE.CACTUS]: '#1e2b12'
                };
                ctx.fillStyle = baseColors[tile] || '#000';
                ctx.fillRect(c * ts, r * ts, ts, ts);
                if (spriteName) {
                    if (tile === TILE.TREE || tile === TILE.CACTUS) {
                        renderer.drawSprite(spriteName, c * ts + ts / 2, r * ts + ts / 2, ts);
                    } else {
                        renderer.drawTile(spriteName, c * ts + ts / 2, r * ts + ts / 2, ts);
                    }
                }
            }
        }
        camera.reset(ctx);
    }

    _populate(zl, theme) {
        if (!this.rooms || this.rooms.length === 0) return;
        
        let breakableIcon = 'obj_barrel';
        if (theme === 'desert' || theme === 'tomb') breakableIcon = 'obj_urn';
        else if (theme === 'hell') breakableIcon = 'obj_urn_hell';

        for (const room of this.rooms) {
            // Place breakables
            const count = 1 + Math.floor(this.rng() * 3);
            for (let i = 0; i < count; i++) {
                const bx = (room.x + Math.floor(this.rng() * room.w)) * this.tileSize;
                const by = (room.y + Math.floor(this.rng() * room.h)) * this.tileSize;
                this.objectSpawns.push({ type: 'breakable', x: bx, y: by, icon: breakableIcon });
            }

            // Place thematic decorative props
            if (theme === 'hell') {
                if (this.rng() < 0.2) {
                    const dx = (room.x + Math.floor(this.rng() * room.w)) * this.tileSize;
                    const dy = (room.y + Math.floor(this.rng() * room.h)) * this.tileSize;
                    const hellProps = ['obj_cluster_soulstone', 'obj_altar_pentagram', 'obj_torch_hell'];
                    const icon = hellProps[Math.floor(this.rng() * hellProps.length)];
                    this.objectSpawns.push({ type: 'decoration', x: dx, y: dy, icon });
                }
            }
        }
    }
}
