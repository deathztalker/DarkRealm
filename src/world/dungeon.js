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
            if (theme === 'desert') iterations = 4; // Fewer, larger rooms
            if (theme === 'hell') iterations = 7; // More, smaller fractured rooms

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
                        // Random cacti in rooms
                        if (this.rng() < 0.05) this.grid[r][c] = TILE.CACTUS;
                    }
                }
            }
        } else if (theme === 'tomb') {
            // Tombs stay FLOOR but with different vibe (walls handled by renderer colors)
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

        // Place player start in first room center
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

        // Place exit in last room
        if (placeExit && this.rooms.length > 0) {
            const last = this.rooms[this.rooms.length - 1];
            const ec = last.x + Math.floor(last.w / 2);
            const er = last.y + Math.floor(last.h / 2);
            this.grid[er][ec] = TILE.STAIRS_DOWN;
            this.exitPos = { x: ec * this.tileSize + this.tileSize / 2, y: er * this.tileSize + this.tileSize / 2 };
        } else {
            this.exitPos = { x: -1000, y: -1000 };
        }

        // Spawn enemies in rooms 2+
        for (let i = 1; i < this.rooms.length; i++) {
            const room = this.rooms[i];
            const count = 2 + Math.floor(this.rng() * 4) + Math.floor(zoneLevel / 10);
            for (let n = 0; n < count; n++) {
                const sx = room.x + 1 + Math.floor(this.rng() * (room.w - 2));
                const sy = room.y + 1 + Math.floor(this.rng() * (room.h - 2));
                const isBoss = (i === this.rooms.length - 1 && n === 0);
                const isElite = !isBoss && this.rng() < 0.15;

                const spawn = {
                    x: sx * this.tileSize + this.tileSize / 2,
                    y: sy * this.tileSize + this.tileSize / 2,
                    type: isBoss ? 'boss' : isElite ? 'elite' : 'normal',
                    level: zoneLevel,
                };

                // Inject Unique Mini-Bosses into normal zones
                if (isBoss) {
                    if (zoneLevel === 40) { spawn.name = "Radament"; spawn.icon = "enemy_skeleton"; spawn.isRadament = true; spawn.hpMult = 3.0; }
                    if (zoneLevel === 46) { spawn.name = "Beetleburst"; spawn.icon = "enemy_spider"; spawn.isBeetleburst = true; spawn.hpMult = 2.5; }
                    if (zoneLevel === 48) { spawn.name = "Coldworm the Burrower"; spawn.icon = "enemy_spider"; spawn.isColdworm = true; spawn.hpMult = 3.0; }
                    if (zoneLevel === 59) { spawn.name = "The Summoner"; spawn.icon = "class_sorceress"; spawn.hpMult = 5.0; spawn.dmgMult = 4.0; }
                    if (zoneLevel === 82) { spawn.name = "Battlemaid Sarina"; spawn.icon = "enemy_ghost"; spawn.isSarina = true; spawn.hpMult = 2.5; }
                    if (zoneLevel === 92) { spawn.name = "Toorc Icefist"; spawn.icon = "enemy_skeleton"; spawn.isCouncil = true; spawn.hpMult = 4.0; }
                    if (zoneLevel === 103) { spawn.name = "Shenk the Overseer"; spawn.icon = "enemy_demon"; spawn.isShenk = true; spawn.hpMult = 3.5; }
                    if (zoneLevel === 109) { spawn.name = "Frozenstein"; spawn.icon = "enemy_demon"; spawn.isFrozenstein = true; spawn.hpMult = 3.5; }

                    // Act I Unique: The Butcher in Zone 5 (Second to last room)
                    if (zoneLevel === 37 && i === this.rooms.length - 2 && this.rng() < 0.3) {
                        spawn.name = "The Butcher";
                        spawn.icon = "enemy_demon";
                        spawn.isButcher = true;
                        spawn.hpMult = 5.0;
                    }

                    // Act IV Unique Bosses
                    if (zoneLevel === 98 && i === this.rooms.length - 1) {
                        spawn.name = "Izual"; spawn.icon = "boss_izual"; spawn.isIzual = true; spawn.hpMult = 8.0; spawn.dmgMult = 4.0;
                    }
                    if (zoneLevel === 100 && i === this.rooms.length - 1) {
                        spawn.name = "Hephaisto"; spawn.icon = "boss_hephaisto"; spawn.isHephaisto = true; spawn.hpMult = 8.0; spawn.dmgMult = 5.0;
                        // Inject Hellforge Object nearby
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
            // Maybe place loot chest
            if (this.rng() < 0.3) {
                const cx2 = (room.x + Math.floor(room.w / 2)) * this.tileSize;
                const cy2 = (room.y + Math.floor(room.h / 2)) * this.tileSize;
                this.lootSpawns.push({ x: cx2, y: cy2 });
                this.objectSpawns.push({ type: 'chest', x: cx2, y: cy2, icon: 'obj_chest' });
            }
            // Maybe place shrine (20% per room, not in first or last room)
            if (i > 1 && i < this.rooms.length - 1 && this.rng() < 0.20) {
                const sx2 = (room.x + 1 + Math.floor(this.rng() * (room.w - 2))) * this.tileSize + this.tileSize / 2;
                const sy2 = (room.y + 1) * this.tileSize + this.tileSize / 2;
                const shrineTypes = ['experience', 'armor', 'combat', 'mana', 'resist', 'speed'];
                const sType = shrineTypes[Math.floor(this.rng() * shrineTypes.length)];
                this.objectSpawns.push({ type: 'shrine', x: sx2, y: sy2, icon: 'obj_shrine', shrineType: sType });
            }

            // Place breakables (1-3 per room)
            const numBreakables = 1 + Math.floor(this.rng() * 3);
            for (let b = 0; b < numBreakables; b++) {
                const bx = (room.x + 1 + Math.floor(this.rng() * (room.w - 2))) * this.tileSize;
                const by = (room.y + 1 + Math.floor(this.rng() * (room.h - 2))) * this.tileSize;
                this.objectSpawns.push({ type: 'breakable', x: bx, y: by, icon: (theme === 'desert' || theme === 'tomb') ? 'obj_urn' : 'obj_barrel' });
            }
        }

        return this;
    }

    
    generateTown(theme, zoneLevel = 0) {
        this.rooms = [];
        this.enemySpawns = [];
        this.lootSpawns = [];
        this.npcSpawns = [];
        this.objectSpawns = [];
        const cx = Math.floor(this.width / 2);
        const cy = 20;

        const addNpc = (id, name, type, dx, dy, icon, dialogue) => {
            this.npcSpawns.push({ id, name, type, x: (cx + dx) * this.tileSize, y: (cy + dy) * this.tileSize, icon, dialogue });
        };

        if (zoneLevel === 0) {
            // Act 1: Rogue Encampment
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.GRASS));
            for (let y = 10; y < this.height - 10; y++) {
                for (let x = cx - 2; x <= cx + 2; x++) this.grid[y][x] = TILE.PATH;
            }
            // River
            for (let x = 10; x < this.width - 10; x++) {
                for (let y = this.height / 2 - 2; y <= this.height / 2 + 2; y++) {
                    if (this.grid[y][x] === TILE.PATH) this.grid[y][x] = TILE.BRIDGE;
                    else this.grid[y][x] = TILE.WATER;
                }
            }
            // Tents/Walls
            for (let y = cy - 4; y <= cy + 4; y++) {
                for (let x = cx - 5; x <= cx + 5; x++) this.grid[y][x] = TILE.PATH;
            }
            this.objectSpawns.push({ id: 'tent1', type: 'tent', name: 'Rogue Tent', x: (cx - 4) * this.tileSize, y: (cy - 4) * this.tileSize, icon: 'obj_tent_leather' });
            this.objectSpawns.push({ id: 'tent2', type: 'tent', name: 'Rogue Tent', x: (cx + 4) * this.tileSize, y: (cy - 4) * this.tileSize, icon: 'obj_tent_leather' });
            // Trees
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (x < 3 || x > this.width - 4 || y < 3 || y > this.height - 4) {
                        if (this.rng() < 0.6) this.grid[y][x] = TILE.TREE;
                    } else if (this.grid[y][x] === TILE.GRASS && this.rng() < 0.05) this.grid[y][x] = TILE.TREE;
                }
            }
            addNpc("deckard_cain", "Deckard Cain", "elder", -2, -6, "npc_deckard_cain", "Stay a while and listen!");
            addNpc("gheed", "Gheed", "merchant", 4, -4, "npc_ormus", "Looking for a deal? My prices are mostly fair.");
            addNpc("warriv", "Warriv", "waypoint", 4, 3, "npc_larzuk", "Ready to travel to the East?");
            addNpc("akara", "Akara", "elder", -4, -4, "npc_akara", "Greetings, traveler.");
            addNpc("charsi", "Charsi", "merchant", 5, -3, "npc_akara", "Need a repair?");
            addNpc("kashya", "Kashya", "mercenary_hire", -5, 2, "npc_akara", "My rogues are ready.");
        } else if (zoneLevel === 38) {
            // Act 2: Lut Gholein
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.SAND));
            // Ocean to the east
            for (let y = 0; y < this.height; y++) {
                for (let x = this.width - 15; x < this.width; x++) this.grid[y][x] = TILE.WATER;
                this.grid[y][this.width - 16] = TILE.BRIDGE; // Docks
            }
            // Palace to the north
            for (let y = 0; y < 10; y++) {
                for (let x = cx - 10; x <= cx + 10; x++) this.grid[y][x] = TILE.WALL;
            }
            this.grid[10][cx] = TILE.DOOR;
            this.objectSpawns.push({ id: 'house1', type: 'house', name: 'Sandstone House', x: (cx - 6) * this.tileSize, y: (cy - 2) * this.tileSize, icon: 'obj_house_sandstone' });
            this.objectSpawns.push({ id: 'house2', type: 'house', name: 'Sandstone House', x: (cx + 6) * this.tileSize, y: (cy - 2) * this.tileSize, icon: 'obj_house_sandstone' });
            addNpc("deckard_cain", "Deckard Cain", "elder", -2, -6, "npc_deckard_cain", "Stay a while and listen!");
            addNpc("lysander", "Lysander", "merchant", 5, 2, "npc_akara", "Mind your step, I'm working with volatile potions!");
            addNpc("meshif", "Meshif", "waypoint", 12, 0, "npc_larzuk", "The Kurast docks are waiting.");
            addNpc("fara", "Fara", "elder", -4, -4, "npc_akara", "I can heal and repair.");
            addNpc("greiz", "Greiz", "mercenary_hire", -5, 2, "npc_larzuk", "Desert mercenaries at your service.");
            addNpc("drognan", "Drognan", "merchant", 6, -3, "npc_ormus", "Magic flows through these walls.");
            addNpc("atma", "Atma", "elder", 0, 5, "npc_akara", "They took my husband and son...");
        } else if (zoneLevel === 68) {
            // Act 3: Kurast Docks
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WATER));
            // Wooden Docks structure
            for (let y = 10; y < this.height - 10; y++) {
                for (let x = cx - 15; x <= cx + 10; x++) {
                    if ((x+y)%2===0) this.grid[y][x] = TILE.BRIDGE; // Planks
                    else this.grid[y][x] = TILE.PATH; 
                }
            }
            this.objectSpawns.push({ id: 'hut1', type: 'hut', name: 'Stilt Hut', x: (cx - 6) * this.tileSize, y: (cy - 4) * this.tileSize, icon: 'obj_hut_stilt' });
            this.objectSpawns.push({ id: 'hut2', type: 'hut', name: 'Stilt Hut', x: (cx + 6) * this.tileSize, y: (cy - 4) * this.tileSize, icon: 'obj_hut_stilt' });
            for(let i=0; i<6; i++) { this.objectSpawns.push({ type: 'tree', x: (cx - 10 + Math.random()*20) * this.tileSize, y: (cy + 5 + Math.random()*10) * this.tileSize, icon: 'obj_tree_jungle' }); }
            addNpc("deckard_cain", "Deckard Cain", "elder", -2, -6, "npc_deckard_cain", "Stay a while and listen!");
            addNpc("ormus", "Ormus", "elder", -5, -4, "npc_ormus", "Ormus speaks to you, traveler.");
            addNpc("hratli", "Hratli", "merchant", 6, -2, "npc_larzuk", "The jungle is dangerous, take a good blade.");
            addNpc("asheara", "Asheara", "mercenary_hire", -6, 3, "npc_akara", "My Iron Wolves will aid you.");
            addNpc("meshif", "Meshif", "waypoint", 10, 10, "npc_larzuk", "We must cross the seas.");
        } else if (zoneLevel === 96) {
            // Act 4: Pandemonium Fortress
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
            // Floating fortress over void
            for (let y = cy - 10; y <= cy + 15; y++) {
                for (let x = cx - 15; x <= cx + 15; x++) {
                    if (Math.hypot(x-cx, y-cy) < 14) this.grid[y][x] = TILE.FLOOR; // Stone
                    else if (Math.hypot(x-cx, y-cy) < 16) this.grid[y][x] = TILE.LAVA; // Lava edge
                }
            }
            this.grid[cy+14][cx] = TILE.STAIRS_DOWN; // Exit
            
            // Add Act 4 Props
            this.objectSpawns.push({ id: 'statue1', type: 'statue', name: 'Angel Statue', x: (cx - 10) * this.tileSize, y: (cy - 5) * this.tileSize, icon: 'obj_statue_angel' });
            this.objectSpawns.push({ id: 'statue2', type: 'statue', name: 'Angel Statue', x: (cx + 10) * this.tileSize, y: (cy - 5) * this.tileSize, icon: 'obj_statue_angel' });
            this.objectSpawns.push({ id: 'altar_pf', type: 'altar', name: 'Obsidian Altar', x: cx * this.tileSize, y: (cy - 8) * this.tileSize, icon: 'obj_pandemonium_altar' });
            this.objectSpawns.push({ id: 'pillar1', type: 'pillar', name: 'Holy Pillar', x: (cx - 5) * this.tileSize, y: (cy + 10) * this.tileSize, icon: 'obj_pillar_holy' });
            this.objectSpawns.push({ id: 'pillar2', type: 'pillar', name: 'Holy Pillar', x: (cx + 5) * this.tileSize, y: (cy + 10) * this.tileSize, icon: 'obj_pillar_holy' });

            addNpc("deckard_cain", "Deckard Cain", "elder", -2, -6, "npc_deckard_cain", "Stay a while and listen!");
            addNpc("tyrael", "Tyrael", "elder", 0, -8, "npc_tyrael", "The Light shall guide you against Diablo.");
            addNpc("jamella", "Jamella", "merchant", -5, -3, "npc_akara", "The Light welcomes you.");
            addNpc("halbu", "Halbu", "merchant", 5, 2, "npc_larzuk", "I craft the armor of legends.");
        } else if (zoneLevel === 102) {
            // Act 5: Harrogath
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.SNOW));
            for (let y = cy - 8; y <= cy + 8; y++) {
                for (let x = cx - 10; x <= cx + 10; x++) this.grid[y][x] = TILE.PATH;
            }
            for (let x = cx - 12; x <= cx + 12; x++) {
                this.grid[cy-9][x] = TILE.WALL;
                this.grid[cy+9][x] = TILE.WALL;
            }
            this.grid[cy+9][cx] = TILE.DOOR;
            this.objectSpawns.push({ id: 'longhouse1', type: 'longhouse', name: 'Barbaric Cabin', x: (cx - 6) * this.tileSize, y: (cy - 3) * this.tileSize, icon: 'obj_harrogath_cabin' });
            this.objectSpawns.push({ id: 'longhouse2', type: 'longhouse', name: 'Barbaric Cabin', x: (cx + 6) * this.tileSize, y: (cy - 3) * this.tileSize, icon: 'obj_harrogath_cabin' });
            for(let i=0; i<12; i++) { this.objectSpawns.push({ type: 'tree', x: (cx - 15 + Math.random()*30) * this.tileSize, y: (cy - 10 + Math.random()*20) * this.tileSize, icon: 'obj_tree_snowy_pine' }); }
            addNpc("deckard_cain", "Deckard Cain", "elder", -2, -6, "npc_deckard_cain", "Stay a while and listen!");
            addNpc("malah", "Malah", "elder", -4, -5, "npc_akara", "It is cold, but my heart is warm for you.");
            addNpc("larzuk", "Larzuk", "merchant", 6, -1, "npc_larzuk", "Ready to put holes in your gear?");
            addNpc("qual_kehk", "Qual-Kehk", "mercenary_hire", -7, 4, "npc_larzuk", "The sons of Arreat fight for gold.");
            addNpc("anya", "Anya", "merchant", 5, 3, "npc_akara", "Thank you for rescuing me.");
            addNpc("nihlathak", "Nihlathak", "elder", 8, -4, "npc_ormus", "Do not cross me.");
        }

        this.playerStart = { x: cx * this.tileSize, y: (cy + 2) * this.tileSize };
        this.exitPos = { x: cx * this.tileSize, y: (this.height - 12) * this.tileSize };
        if (this.grid[this.height - 12] && this.grid[this.height - 12][cx] !== undefined) {
            this.grid[this.height - 12][cx] = TILE.STAIRS_DOWN;
        }

        // Waypoint Pad in Town Square
        this.objectSpawns.push({
            type: 'waypoint',
            x: cx * this.tileSize,
            y: cy * this.tileSize,
            icon: 'obj_waypoint',
            zone: zoneLevel
        });

        // Town Objects: Stash & Cube
        this.objectSpawns.push({ id: 'stash', type: 'stash', name: 'Alijo (Stash)', x: (cx - 6) * this.tileSize, y: cy * this.tileSize, icon: 'obj_chest' });
        this.objectSpawns.push({ id: 'cube', type: 'cube', name: 'Horadric Cube', x: (cx - 8) * this.tileSize, y: cy * this.tileSize, icon: 'item_horadric_fragment' });

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
