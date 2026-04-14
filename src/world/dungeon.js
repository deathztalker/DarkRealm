/**
 * Dungeon Generator — BSP room-corridor procedural generation
 */

export const TILE = { FLOOR: 0, WALL: 1, DOOR: 2, STAIRS_DOWN: 3, STAIRS_UP: 4, SPAWN: 5, GRASS: 6, PATH: 7, WATER: 8, TREE: 9, BRIDGE: 10, SAND: 11, CACTUS: 12, LAVA: 13, SNOW: 14, ICE: 15 };
const TILE_ICONS = { 0: '·', 1: '█', 2: '+', 3: '▼', 4: '▲' };

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
    constructor(width = 80, height = 60, tileSize = 16) {
        this.width = width; this.height = height; this.tileSize = tileSize;
        this.grid = [];
        this.rooms = [];
        this.enemySpawns = [];
        this.lootSpawns = [];
        this.npcSpawns = [];
        this.objectSpawns = [];
        this.debris = []; // Decorative non-interactive objects
        this.playerStart = { x: 0, y: 0 };
        this.exitPos = { x: 0, y: 0 };
    }

    generate(zoneLevel = 1, theme = 'cathedral') {
        if (zoneLevel === 0 || zoneLevel === 6 || zoneLevel === 11 || zoneLevel === 16 || zoneLevel === 21) {
            return this.generateTown(theme, zoneLevel);
        }
        if (zoneLevel === 5 || (zoneLevel > 7 && zoneLevel % 5 === 0)) return this.generateBossRoom(theme, zoneLevel);

        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
        this.rooms = [];
        this.enemySpawns = [];
        this.lootSpawns = [];

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
                        if (Math.random() < 0.05) this.grid[r][c] = TILE.CACTUS;
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
                        if (Math.random() < 0.1) this.grid[r][c] = TILE.TREE;
                    }
                }
            }
        } else if (theme === 'temple') {
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    if (this.grid[r][c] === TILE.FLOOR && Math.random() < 0.1) {
                        this.grid[r][c] = TILE.WATER;
                    }
                }
            }
        } else if (theme === 'hell') {
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    if (this.grid[r][c] === TILE.FLOOR && Math.random() < 0.08) {
                        this.grid[r][c] = TILE.LAVA;
                    }
                }
            }
        } else if (theme === 'snow') {
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    if (this.grid[r][c] === TILE.FLOOR) {
                        this.grid[r][c] = TILE.SNOW;
                        if (Math.random() < 0.05) this.grid[r][c] = TILE.ICE;
                    }
                }
            }
        }

        // Place player start in first room center
        const first = this.rooms[0];
        this.playerStart = {
            x: (first.x + Math.floor(first.w / 2)) * this.tileSize + this.tileSize / 2,
            y: (first.y + Math.floor(first.h / 2)) * this.tileSize + this.tileSize / 2,
        };

        // Place Waypoint in first room
        this.objectSpawns.push({ 
            type: 'waypoint', 
            x: this.playerStart.x + 32, 
            y: this.playerStart.y, 
            icon: 'env_stairs_up', 
            zone: zoneLevel 
        });

        // Place exit in last room
        const last = this.rooms[this.rooms.length - 1];
        const ec = last.x + Math.floor(last.w / 2);
        const er = last.y + Math.floor(last.h / 2);
        this.grid[er][ec] = TILE.STAIRS_DOWN;
        this.exitPos = { x: ec * this.tileSize + this.tileSize / 2, y: er * this.tileSize + this.tileSize / 2 };

        // Spawn enemies in rooms 2+
        for (let i = 1; i < this.rooms.length; i++) {
            const room = this.rooms[i];
            const count = 2 + Math.floor(Math.random() * 4) + Math.floor(zoneLevel / 3);
            for (let n = 0; n < count; n++) {
                const sx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
                const sy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
                const isBoss = (i === this.rooms.length - 1 && n === 0);
                const isElite = !isBoss && Math.random() < 0.15;
                
                const spawn = {
                    x: sx * this.tileSize + this.tileSize / 2,
                    y: sy * this.tileSize + this.tileSize / 2,
                    type: isBoss ? 'boss' : isElite ? 'elite' : 'normal',
                    level: zoneLevel,
                };

                // Inject Unique Mini-Bosses into normal zones
                if (isBoss) {
                    if (zoneLevel === 7) { spawn.name = "Radament"; spawn.icon = "enemy_skeleton"; spawn.isRadament = true; spawn.hpMult = 3.0; }
                    if (zoneLevel === 8) { spawn.name = "Beetleburst"; spawn.icon = "enemy_spider"; spawn.isBeetleburst = true; spawn.hpMult = 2.5; }
                    if (zoneLevel === 9) { spawn.name = "Coldworm the Burrower"; spawn.icon = "enemy_spider"; spawn.isColdworm = true; spawn.hpMult = 3.0; }
                    if (zoneLevel === 13) { spawn.name = "Battlemaid Sarina"; spawn.icon = "enemy_ghost"; spawn.isSarina = true; spawn.hpMult = 2.5; }
                    if (zoneLevel === 14) { spawn.name = "Toorc Icefist"; spawn.icon = "enemy_skeleton"; spawn.isCouncil = true; spawn.hpMult = 4.0; }
                    if (zoneLevel === 22) { spawn.name = "Shenk the Overseer"; spawn.icon = "enemy_demon"; spawn.isShenk = true; spawn.hpMult = 3.5; }
                    if (zoneLevel === 23) { spawn.name = "Frozenstein"; spawn.icon = "enemy_demon"; spawn.isFrozenstein = true; spawn.hpMult = 3.5; }
                    
                    // Act I Unique: The Butcher in Zone 5 (Second to last room)
                    if (zoneLevel === 5 && i === this.rooms.length - 2 && Math.random() < 0.3) {
                        spawn.name = "The Butcher";
                        spawn.icon = "enemy_demon";
                        spawn.isButcher = true;
                        spawn.hpMult = 5.0;
                    }

                    // Act IV Unique Bosses
                    if (zoneLevel === 18 && i === this.rooms.length - 1) {
                        spawn.name = "Izual"; spawn.icon = "enemy_ghost"; spawn.isIzual = true; spawn.hpMult = 6.0;
                    }
                    if (zoneLevel === 19 && i === this.rooms.length - 1) {
                        spawn.name = "Hephaisto"; spawn.icon = "enemy_demon"; spawn.isHephaisto = true; spawn.hpMult = 6.0;
                        // Inject Hellforge Object nearby
                        this.objectSpawns.push({ id: 'hellforge', type: 'hellforge', name: 'The Hellforge', x: spawn.x + 60, y: spawn.y, icon: 'obj_altar' });
                    }

                    // Act V: The Ancients (Trio)
                    if (zoneLevel === 24 && i === this.rooms.length - 1) {
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
            if (Math.random() < 0.3) {
                const cx2 = (room.x + Math.floor(room.w / 2)) * this.tileSize;
                const cy2 = (room.y + Math.floor(room.h / 2)) * this.tileSize;
                this.lootSpawns.push({ x: cx2, y: cy2 });
                this.objectSpawns.push({ type: 'chest', x: cx2, y: cy2, icon: 'obj_chest' });
            }
            // Maybe place shrine (20% per room, not in first or last room)
            if (i > 1 && i < this.rooms.length - 1 && Math.random() < 0.20) {
                const sx2 = (room.x + 1 + Math.floor(Math.random() * (room.w - 2))) * this.tileSize + this.tileSize / 2;
                const sy2 = (room.y + 1) * this.tileSize + this.tileSize / 2;
                const shrineTypes = ['experience', 'armor', 'combat', 'mana', 'resist', 'speed'];
                const sType = shrineTypes[Math.floor(Math.random() * shrineTypes.length)];
                this.objectSpawns.push({ type: 'shrine', x: sx2, y: sy2, icon: 'obj_shrine', shrineType: sType });
            }

            // Place breakables (1-3 per room)
            const numBreakables = 1 + Math.floor(Math.random() * 3);
            for (let b = 0; b < numBreakables; b++) {
                const bx = (room.x + 1 + Math.floor(Math.random() * (room.w - 2))) * this.tileSize;
                const by = (room.y + 1 + Math.floor(Math.random() * (room.h - 2))) * this.tileSize;
                this.objectSpawns.push({ type: 'breakable', x: bx, y: by, icon: 'obj_chest' });
            }
        }

        this._populate(zoneLevel, theme);
        this._scatterDebris(theme);

        return this;
    }

    generateTown(theme, zoneLevel = 0) {
        const bgTile = theme === 'desert' ? TILE.SAND : theme === 'snow' ? TILE.SNOW : TILE.GRASS;
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(bgTile));
        this.rooms = [];
        this.enemySpawns = [];
        this.lootSpawns = [];

        // Central Path
        for (let y = 10; y < this.height - 10; y++) {
            for (let x = this.width / 2 - 2; x <= this.width / 2 + 2; x++) {
                this.grid[y][x] = TILE.PATH;
            }
        }

        // River crossing
        for (let x = 10; x < this.width - 10; x++) {
            for (let y = this.height / 2 - 2; y <= this.height / 2 + 2; y++) {
                if (this.grid[y][x] === TILE.PATH) this.grid[y][x] = TILE.BRIDGE;
                else this.grid[y][x] = TILE.WATER;
            }
        }

        // Town Square & buildings
        const cx = Math.floor(this.width / 2);
        const cy = 20;

        // Square
        for (let y = cy - 4; y <= cy + 4; y++) {
            for (let x = cx - 5; x <= cx + 5; x++) {
                this.grid[y][x] = TILE.PATH;
            }
        }

        // Buildings (Walls blocking movement but hollow inside)
        const carveBuilding = (bx, by, bw, bh) => {
            for (let y = by; y < by + bh; y++) {
                for (let x = bx; x < bx + bw; x++) {
                    if (y === by || y === by + bh - 1 || x === bx || x === bx + bw - 1) {
                        this.grid[y][x] = TILE.WALL;
                    } else {
                        this.grid[y][x] = TILE.FLOOR; // Walkable interior
                    }
                }
            }
            this.grid[by + bh - 1][bx + Math.floor(bw / 2)] = TILE.PATH; // Door
        };

        carveBuilding(cx - 12, cy - 3, 6, 5); // Blacksmith
        carveBuilding(cx + 6, cy - 3, 7, 6);  // Tavern

        // Act-Specific Town Customization
        if (theme === 'desert') {
            // Act 2: Lut Gholein — Add water wells and palm-like trees
            for(let i=0; i<10; i++) {
                const rx = 5 + Math.floor(Math.random() * (this.width-10));
                const ry = 5 + Math.floor(Math.random() * (this.height-10));
                if (this.grid[ry][rx] === TILE.SAND) this.grid[ry][rx] = TILE.WATER;
            }
        } else if (theme === 'snow') {
            // Act 5: Harrogath — Add "Ice" patches
            for(let i=0; i<30; i++) {
                const rx = 5 + Math.floor(Math.random() * (this.width-10));
                const ry = 5 + Math.floor(Math.random() * (this.height-10));
                if (this.grid[ry][rx] === TILE.SNOW) this.grid[ry][rx] = TILE.ICE;
            }
        } else if (theme === 'hell') {
            // Act 4: Pandemonium Fortress — Add Lava
            for(let i=0; i<15; i++) {
                const rx = 5 + Math.floor(Math.random() * (this.width-10));
                const ry = 5 + Math.floor(Math.random() * (this.height-10));
                if (this.grid[ry][rx] === TILE.PATH) continue;
                this.grid[ry][rx] = TILE.LAVA;
            }
        }

        // Trees border
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (x < 3 || x > this.width - 4 || y < 3 || y > this.height - 4) {
                    if (Math.random() < 0.6) {
                        this.grid[y][x] = (theme === 'desert') ? TILE.CACTUS : TILE.TREE;
                    }
                }
                else if ((this.grid[y][x] === TILE.GRASS || this.grid[y][x] === TILE.SAND || this.grid[y][x] === TILE.SNOW) && Math.random() < 0.05) {
                    this.grid[y][x] = (theme === 'desert') ? TILE.CACTUS : TILE.TREE;
                }
            }
        }

        this.playerStart = { x: cx * this.tileSize, y: (cy + 2) * this.tileSize };
        this.exitPos = { x: cx * this.tileSize, y: (this.height - 12) * this.tileSize };
        this.grid[this.height - 12][cx] = TILE.STAIRS_DOWN;

        // Waypoint Pad in Town Square
        this.objectSpawns.push({
            type: 'waypoint',
            x: cx * this.tileSize,
            y: cy * this.tileSize,
            icon: 'env_stairs_up',
            zone: 0
        });

        // Spawn NPCs based on Act
        // Global NPCs (Cain follows the party)
        this.npcSpawns.push({
            id: "deckard_cain",
            name: "Deckard Cain",
            type: "elder",
            x: (cx + 2) * this.tileSize,
            y: (cy - 3) * this.tileSize,
            icon: "npc_elder",
            dialogue: "Stay awhile and listen!"
        });

        if (zoneLevel === 0) {
            // Act I: Rogue Encampment
            this.npcSpawns.push({
                id: "akara",
                name: "Akara the Elder",
                type: "elder",
                x: (cx - 3) * this.tileSize,
                y: (cy - 4) * this.tileSize,
                icon: "npc_elder",
                dialogue: "Greetings, traveler. I sense a great darkness rising."
            });

            this.npcSpawns.push({
                id: "gheed",
                name: "Gheed the Merchant",
                type: "merchant",
                x: (cx + 3) * this.tileSize,
                y: (cy - 4) * this.tileSize,
                icon: "npc_merchant",
                dialogue: "Looking for a deal? My prices are mostly fair."
            });

            this.npcSpawns.push({
                id: "kashya",
                name: "Kashya",
                type: "mercenary_hire",
                x: (cx - 4) * this.tileSize,
                y: (cy + 2) * this.tileSize,
                icon: "npc_elder",
                dialogue: "Need a fighter? I can send one of my rogues to aid you... for a price."
            });

            this.npcSpawns.push({
                id: "warriv",
                name: "Warriv",
                type: "waypoint",
                x: (cx + 4) * this.tileSize,
                y: (cy + 2) * this.tileSize,
                icon: "npc_merchant",
                dialogue: "You are the one who will lead us to the East. But first, the pass must be cleared."
            });

            this.npcSpawns.push({
                id: "charsi",
                name: "Charsi",
                type: "merchant",
                x: (cx + 5) * this.tileSize,
                y: (cy - 3) * this.tileSize,
                icon: "npc_merchant",
                dialogue: "Need a new blade? I can keep your gear in fighting shape."
            });
        }

        if (zoneLevel === 6) {
            // Act II: Lut Gholein
            this.npcSpawns.push({
                id: "drognan",
                name: "Drognan",
                type: "merchant",
                x: (cx - 5) * this.tileSize,
                y: (cy - 5) * this.tileSize,
                icon: "npc_elder",
                dialogue: "Greetings. I have been studying the ancient texts. The desert hides many secrets."
            });

            this.npcSpawns.push({
                id: "greiz",
                name: "Greiz",
                type: "mercenary_hire",
                x: (cx + 5) * this.tileSize,
                y: (cy + 2) * this.tileSize,
                icon: "npc_villager",
                dialogue: "My mercenaries are the finest in the desert. They will serve you well."
            });

            this.npcSpawns.push({
                id: "lysander",
                name: "Lysander",
                type: "merchant",
                x: (cx + 6) * this.tileSize,
                y: (cy - 3) * this.tileSize,
                icon: "npc_merchant",
                dialogue: "Careful with the potions! They have a bit of a kick."
            });

            this.npcSpawns.push({
                id: "atma",
                name: "Atma",
                type: "elder",
                x: (cx - 4) * this.tileSize,
                y: (cy + 4) * this.tileSize,
                icon: "npc_villager",
                dialogue: "Lut Gholein was a paradise once. Now, shadows crawl in the sewers."
            });

            this.npcSpawns.push({
                id: "fara",
                name: "Fara",
                type: "merchant",
                x: (cx - 7) * this.tileSize,
                y: (cy - 3) * this.tileSize,
                icon: "npc_villager",
                dialogue: "Peace be with you. I can repair your equipment and heal your spirit."
            });

            this.npcSpawns.push({
                id: "jerhyn",
                name: "Jerhyn",
                type: "elder",
                x: cx * this.tileSize,
                y: (cy - 6) * this.tileSize,
                icon: "npc_elder",
                dialogue: "I am Jerhyn, Lord of Lut Gholein. My palace is sealed for your own protection."
            });

            this.npcSpawns.push({
                id: "meshif",
                name: "Meshif",
                type: "waypoint",
                x: (cx + 8) * this.tileSize,
                y: (cy + 4) * this.tileSize,
                icon: "npc_villager",
                dialogue: "The sea is rough, but I can take you to the East when you are ready."
            });
        }

        if (zoneLevel === 11) {
            // Act III: Kurast Docks
            this.npcSpawns.push({
                id: "ormus",
                name: "Ormus",
                type: "merchant",
                x: (cx + 5) * this.tileSize,
                y: (cy - 4) * this.tileSize,
                icon: "npc_elder",
                dialogue: "Ormus speaks to you, though you may not understand. The jungle is a living thing."
            });

            this.npcSpawns.push({
                id: "asheara",
                name: "Asheara",
                type: "mercenary_hire",
                x: (cx - 5) * this.tileSize,
                y: (cy + 2) * this.tileSize,
                icon: "npc_villager",
                dialogue: "The Iron Wolves are ready for any battle. They fear no jungle beast."
            });

            this.npcSpawns.push({
                id: "hratli",
                name: "Hratli",
                type: "merchant",
                x: (cx - 6) * this.tileSize,
                y: (cy - 2) * this.tileSize,
                icon: "npc_villager",
                dialogue: "Kurast is falling, but my anvil stays hot. Bring me your broken steel."
            });

            this.npcSpawns.push({
                id: "alkor",
                name: "Alkor",
                type: "merchant",
                x: (cx - 8) * this.tileSize,
                y: (cy - 5) * this.tileSize,
                icon: "npc_elder",
                dialogue: "You want a potion? Just don't ask what's in it."
            });
        }

        if (zoneLevel === 16) {
            // Act IV: Pandemonium Fortress
            this.npcSpawns.push({
                id: "jamella",
                name: "Jamella",
                type: "merchant",
                x: (cx + 5) * this.tileSize,
                y: (cy - 4) * this.tileSize,
                icon: "npc_elder",
                dialogue: "I can heal your wounds and trade for your discoveries."
            });

            this.npcSpawns.push({
                id: "halbu",
                name: "Halbu",
                type: "merchant",
                x: (cx - 5) * this.tileSize,
                y: (cy - 4) * this.tileSize,
                icon: "npc_villager",
                dialogue: "Need your armor patched? Hellfire is hard on steel."
            });
        }

        if (zoneLevel === 21) {
            // Act V: Harrogath
            this.npcSpawns.push({
                id: "malah",
                name: "Malah",
                type: "merchant",
                x: (cx + 5) * this.tileSize,
                y: (cy - 4) * this.tileSize,
                icon: "npc_elder",
                dialogue: "Harrogath endures. Let me ease your spirit."
            });

            this.npcSpawns.push({
                id: "nihlathak",
                name: "Nihlathak",
                type: "elder",
                x: (cx - 6) * this.tileSize,
                y: (cy + 2) * this.tileSize,
                icon: "npc_elder",
                dialogue: "The elders are gone, but I remain. Do not expect much from me."
            });
        }
        
        if (zoneLevel === 23) {
            // Act V: Prison of Ice (Quest Room)
            this.npcSpawns.push({
                id: "anya",
                name: "Anya",
                type: "quest_target",
                x: cx * this.tileSize,
                y: cy * this.tileSize - 40,
                icon: "npc_villager",
                dialogue: "Oh, thank you for finding me! Malah must have sent you. Please, take this scroll to her—I must regain my strength before returning to Harrogath."
            });
        }

        if (zoneLevel === 16 || zoneLevel === 21) {
            // Act IV & V: Tyrael appears
            this.npcSpawns.push({
                id: "tyrael",
                name: "Tyrael",
                type: "elder",
                x: (cx - 4) * this.tileSize,
                y: (cy - 2) * this.tileSize,
                icon: "npc_elder",
                dialogue: "I am the Archangel Tyrael. Your journey leads to the gates of Hell itself."
            });
        }

        // Add Larzuk only in Act V
        if (zoneLevel === 21) {
            this.npcSpawns.push({
                id: "larzuk",
                name: "Larzuk the Blacksmith",
                type: "blacksmith",
                x: (cx - 9) * this.tileSize,
                y: (cy - 1) * this.tileSize,
                icon: "npc_villager",
                dialogue: "I can punch a hole in that for you... for the right price."
            });
        }

        // Town Objects: Stash & Cube
        this.objectSpawns.push({ 
            id: 'stash',
            type: 'stash', 
            name: 'Alijo (Stash)',
            x: (cx - 6) * this.tileSize, 
            y: cy * this.tileSize, 
            icon: 'obj_chest' 
        });

        // Cube (Only in Act II Hall of the Dead / Oasis area - represented here by specific level)
        if (zoneLevel === 8) {
            this.objectSpawns.push({ 
                id: 'cube',
                type: 'cube', 
                name: 'Horadric Cube',
                x: (cx - 8) * this.tileSize, 
                y: (cy + 2) * this.tileSize, 
                icon: 'obj_chest' 
            });
        }

        this._populate(zoneLevel, theme);
        this._scatterDebris(theme);

        return this;
    }

    _scatterDebris(theme) {
        this.debris = [];
        const debrisCount = (this.width * this.height) / 25;
        // Map debris to existing item placeholders for maximum stability
        const types = ['item_skull', 'item_rune_el', 'item_scroll', 'item_wand_bone'];
        if (theme === 'desert') types.push('item_cactus', 'item_wand_bone');
        else if (theme === 'hell') types.push('item_skull', 'item_rune_ral');
        else if (theme === 'snow') types.push('item_sapphire', 'item_potion_rejuv');

        for (let i = 0; i < debrisCount; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            if (this.grid[y][x] === TILE.FLOOR || this.grid[y][x] === TILE.PATH || this.grid[y][x] === TILE.GRASS || this.grid[y][x] === TILE.SAND || this.grid[y][x] === TILE.SNOW) {
                this.debris.push({
                    x: x * this.tileSize + (Math.random() - 0.5) * 8,
                    y: y * this.tileSize + (Math.random() - 0.5) * 8,
                    icon: types[Math.floor(Math.random() * types.length)],
                    rot: Math.random() * Math.PI * 2,
                    scale: 0.4 + Math.random() * 0.4
                });
            }
        }
    }

        generateBossRoom(theme, zoneLevel = 5) {
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
            this.rooms = [];
            this.enemySpawns = [];
            this.lootSpawns = [];
            this.npcSpawns = [];
            this.objectSpawns = [];
            this.debris = [];

            const cx = Math.floor(this.width / 2);
            const cy = Math.floor(this.height / 2);
            const radius = 15;

            // Circular-ish Arena
            for (let y = cy - radius; y <= cy + radius; y++) {
                for (let x = cx - radius; x <= cx + radius; x++) {
                    if ((x - cx)**2 + (y - cy)**2 <= radius**2) {
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

            // --- Premium Redesign: Pillars & Hazards ---
            if (theme === 'catacombs' || theme === 'cathedral') {
                // Add concentric stone pillars for cover
                for (let i = 0; i < 4; i++) {
                    const ang = (i / 4) * Math.PI * 2;
                    const px = Math.round(cx + Math.cos(ang) * 8);
                    const py = Math.round(cy + Math.sin(ang) * 8);
                    this.grid[py][px] = TILE.WALL;
                    this.grid[py+1][px] = TILE.WALL;
                }
            } else if (theme === 'hell') {
                // Add LAVA pools and obsidian pillars
                for (let i = 0; i < 6; i++) {
                    const ang = (i / 6) * Math.PI * 2;
                    const px = Math.round(cx + Math.cos(ang) * 10);
                    const py = Math.round(cy + Math.sin(ang) * 10);
                    this.grid[py][px] = TILE.LAVA;
                    // Periodic obsidian spikes (WALL)
                    if (i % 2 === 0) this.grid[py-1][px-1] = TILE.WALL;
                }
            } else if (theme === 'jungle' || theme === 'temple') {
                // Water pools and ancient trees
                for (let i = 0; i < 4; i++) {
                    const ang = (i / 4) * Math.PI * 2 + 0.5;
                    const px = Math.round(cx + Math.cos(ang) * 7);
                    const py = Math.round(cy + Math.sin(ang) * 7);
                    this.grid[py][px] = TILE.WATER;
                    this.grid[py][px+1] = TILE.WATER;
                    if (Math.random() < 0.5) this.grid[py-2][px] = TILE.TREE;
                }
            } else if (theme === 'desert') {
                // Sand dunes and bone pillars
                for (let i = 0; i < 5; i++) {
                    const ang = (i / 5) * Math.PI * 2;
                    const px = Math.round(cx + Math.cos(ang) * 9);
                    const py = Math.round(cy + Math.sin(ang) * 9);
                    this.grid[py][px] = TILE.CACTUS;
                    if (i % 2 === 1) this.grid[py][px-1] = TILE.WALL;
                }
            }

            // Boss Selection based on level
            let bossName = "Blood Raven";
            let bossIcon = "enemy_ghost";
            let hpMult = 2.0;
            let isAndariel = false;
            let isDuriel = false;
            let isMephisto = false;
            let isDiablo = false;
            let isBaal = false;
            let isUber = false;

            if (zoneLevel === 5) { bossName = "Andariel"; bossIcon = "enemy_demon"; hpMult = 4.0; isAndariel = true; }
            else if (zoneLevel === 10) { bossName = "Duriel"; bossIcon = "enemy_demon"; hpMult = 6.0; isDuriel = true; }
            else if (zoneLevel === 15) { bossName = "Mephisto"; bossIcon = "enemy_skeleton"; hpMult = 8.0; isMephisto = true; }
            else if (zoneLevel === 20) { bossName = "Diablo"; bossIcon = "enemy_demon"; hpMult = 12.0; isDiablo = true; }
            else if (zoneLevel === 25) { bossName = "Baal"; bossIcon = "enemy_demon"; hpMult = 15.0; isBaal = true; }
            else if (zoneLevel === 100) { bossName = "Uber Diablo"; bossIcon = "enemy_demon"; hpMult = 50.0; isUber = true; }

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
                isAndariel, isDuriel, isMephisto, isDiablo, isBaal, isUber,
                isShenk: zoneLevel === 22,
                isFrozenstein: zoneLevel === 23
            });

            // The exit is unreachable until the boss dies (handled in main.js)
            this.exitPos = { x: -1000, y: -1000 };
            
            this._scatterDebris(theme);

            return this;
        }
    _bsp(node, depth, maxDepth) {
        if (depth >= maxDepth || node.w < 12 || node.h < 12) return [node];
        const horizontal = node.h > node.w ? true : node.w > node.h ? false : Math.random() < 0.5;
        const min = 5;
        let left, right;
        if (horizontal) {
            const split = min + Math.floor(Math.random() * (node.h - min * 2));
            left = { x: node.x, y: node.y, w: node.w, h: split };
            right = { x: node.x, y: node.y + split, w: node.w, h: node.h - split };
        } else {
            const split = min + Math.floor(Math.random() * (node.w - min * 2));
            left = { x: node.x, y: node.y, w: split, h: node.h };
            right = { x: node.x + split, y: node.y, w: node.w - split, h: node.h };
        }
        return [...this._bsp(left, depth + 1, maxDepth), ...this._bsp(right, depth + 1, maxDepth)];
    }

    _carveRoom(leaf) {
        const margin = 2;
        const maxW = leaf.w - margin * 2;
        const maxH = leaf.h - margin * 2;
        if (maxW < 4 || maxH < 4) return null;
        const rw = 4 + Math.floor(Math.random() * (maxW - 3));
        const rh = 4 + Math.floor(Math.random() * (maxH - 3));
        const rx = leaf.x + margin + Math.floor(Math.random() * (maxW - rw + 1));
        const ry = leaf.y + margin + Math.floor(Math.random() * (maxH - rh + 1));
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
        // L-shaped corridor
        let cx = ax, cy = ay;
        while (cx !== bx) { this.grid[cy][cx] = TILE.FLOOR; cx += cx < bx ? 1 : -1; }
        while (cy !== by) { this.grid[cy][cx] = TILE.FLOOR; cy += cy < by ? 1 : -1; }
    }


    render(renderer, camera) {
        const ctx = renderer.ctx;
        camera.apply(ctx);
        const ts = this.tileSize;
        const viewW = camera.w / camera.zoom;
        const viewH = camera.h / camera.zoom;
        const camLeft = Math.max(0, Math.floor(camera.x / ts));
        const camTop = Math.max(0, Math.floor(camera.y / ts));
        const camRight = Math.min(this.width, Math.ceil((camera.x + viewW) / ts) + 1);
        const camBottom = Math.min(this.height, Math.ceil((camera.y + viewH) / ts) + 1);

        // Name to sprite mapping
        const TILE_SPRITES = {
            [TILE.FLOOR]: 'env_stone_hd', [TILE.WALL]: 'env_wall', [TILE.DOOR]: 'env_door',
            [TILE.STAIRS_DOWN]: 'env_stairs_down', [TILE.STAIRS_UP]: 'env_stairs_up',
            [TILE.GRASS]: 'env_grass_hd', [TILE.PATH]: 'env_path', [TILE.WATER]: 'env_water',
            [TILE.TREE]: 'env_tree', [TILE.BRIDGE]: 'env_bridge',
            [TILE.SAND]: 'env_sand_hd', [TILE.CACTUS]: 'env_cactus',
            [TILE.SNOW]: 'env_snow_hd', [TILE.ICE]: 'env_floor',
            [TILE.LAVA]: 'env_floor'
        };

        for (let r = camTop; r < camBottom; r++) {
            for (let c = camLeft; c < camRight; c++) {
                const tile = this.grid[r][c];
                const spriteName = TILE_SPRITES[tile];

                // Draw base rect as fallback/background with better colors
                const baseColors = {
                    [TILE.FLOOR]: '#1a1820', [TILE.WALL]: '#0a080c', [TILE.DOOR]: '#3a2a1a',
                    [TILE.STAIRS_DOWN]: '#151525', [TILE.STAIRS_UP]: '#151525',
                    [TILE.GRASS]: '#1a2e1a', [TILE.PATH]: '#2a201a', [TILE.WATER]: '#0a1a2e',
                    [TILE.TREE]: '#0a1d0a', [TILE.BRIDGE]: '#2a1a10',
                    [TILE.SAND]: '#3d2e14', [TILE.CACTUS]: '#1e2b12'
                };
                ctx.fillStyle = baseColors[tile] || '#000';
                ctx.fillRect(c * ts, r * ts, ts, ts);

                // Draw tile sprite
                if (spriteName) {
                    if (tile === TILE.TREE || tile === TILE.CACTUS) {
                        renderer.drawSprite(spriteName, c * ts + ts / 2, r * ts + ts / 2, ts);
                    } else {
                        renderer.drawTile(spriteName, c * ts + ts / 2, r * ts + ts / 2, ts);
                    }
                }

                // Premium Detail: Wall depth
                if (tile === TILE.WALL) {
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.fillRect(c * ts, (r + 1) * ts - 2, ts, 2); // bottom shadow
                    ctx.fillStyle = 'rgba(255,255,255,0.05)';
                    ctx.fillRect(c * ts, r * ts, ts, 1); // top highlight
                }
            }
        }

        // Premium Ambient Lighting Overlay
        const cx = camera.x + camera.w / 2;
        const cy = camera.y + camera.h / 2;

        camera.reset(ctx);
    }

    isWalkable(wx, wy) {
        const c = Math.floor(wx / this.tileSize);
        const r = Math.floor(wy / this.tileSize);
        if (r < 0 || r >= this.height || c < 0 || c >= this.width) return false;
        const tile = this.grid[r][c];
        // Non-walkable: WALL, WATER, TREE, CACTUS, LAVA
        return tile !== TILE.WALL && tile !== TILE.WATER && tile !== TILE.TREE 
            && tile !== TILE.CACTUS && tile !== TILE.LAVA;
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
            // Check current tile validity
            if (y < 0 || y >= this.height || x < 0 || x >= this.width) return false;
            const tile = this.grid[y][x];
            // If it's a solid wall or tree, vision is blocked. Water/Pits don't block vision.
            if (tile === TILE.WALL || tile === TILE.TREE) return false;

            if (error > 0) {
                x += x_inc;
                error -= dy;
            } else if (error < 0) {
                y += y_inc;
                error += dx;
            } else { // error == 0 (diagonals)
                x += x_inc;
                error -= dy;
                y += y_inc;
                error += dx;
                n--; 
            }
        }
        return true;
    }

    _generateAutomata() {
        // Initialize random noise
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                this.grid[r][c] = Math.random() < 0.45 ? TILE.WALL : TILE.FLOOR;
            }
        }

        // Cellular Automata smooth passes
        for (let pass = 0; pass < 5; pass++) {
            const next = this.grid.map(arr => [...arr]);
            for (let r = 1; r < this.height - 1; r++) {
                for (let c = 1; c < this.width - 1; c++) {
                    let walls = 0;
                    for (let yy = -1; yy <= 1; yy++) {
                        for (let xx = -1; xx <= 1; xx++) {
                            if (this.grid[r + yy][c + xx] === TILE.WALL) walls++;
                        }
                    }
                    next[r][c] = walls >= 5 ? TILE.WALL : TILE.FLOOR;
                }
            }
            this.grid = next;
        }

        // Ensure borders
        for (let r = 0; r < this.height; r++) { this.grid[r][0] = TILE.WALL; this.grid[r][this.width - 1] = TILE.WALL; }
        for (let c = 0; c < this.width; c++) { this.grid[0][c] = TILE.WALL; this.grid[this.height - 1][c] = TILE.WALL; }

        // Find regions via flood-fill
        const visited = Array.from({ length: this.height }, () => Array(this.width).fill(false));
        const regions = [];

        for (let r = 1; r < this.height - 1; r++) {
            for (let c = 1; c < this.width - 1; c++) {
                if (this.grid[r][c] === TILE.FLOOR && !visited[r][c]) {
                    const region = [];
                    const queue = [{x: c, y: r}];
                    visited[r][c] = true;
                    let head = 0;
                    while (head < queue.length) {
                        const pt = queue[head++];
                        region.push(pt);
                        const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
                        for (const dir of dirs) {
                            const nx = pt.x + dir[0], ny = pt.y + dir[1];
                            if (this.grid[ny][nx] === TILE.FLOOR && !visited[ny][nx]) {
                                visited[ny][nx] = true;
                                queue.push({x: nx, y: ny});
                            }
                        }
                    }
                    regions.push(region);
                }
            }
        }

        // Keep largest region, wall off the rest
        if (regions.length > 0) {
            regions.sort((a, b) => b.length - a.length);
            const mainRegion = regions[0];
            
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
            for (const pt of mainRegion) {
                this.grid[pt.y][pt.x] = TILE.FLOOR;
            }

            this.rooms = [];
            const roomCount = Math.max(4, Math.floor(mainRegion.length / 150));
            for (let i = 0; i < roomCount; i++) {
                const pt = mainRegion[Math.floor(Math.random() * mainRegion.length)];
                for(let yy=-1; yy<=1; yy++) {
                   for(let xx=-1; xx<=1; xx++) {
                       if (pt.y+yy > 0 && pt.y+yy < this.height-1 && pt.x+xx > 0 && pt.x+xx < this.width-1) {
                           this.grid[pt.y+yy][pt.x+xx] = TILE.FLOOR;
                       }
                   }
                }
                this.rooms.push({ x: pt.x - 1, y: pt.y - 1, w: 3, h: 3 });
            }
        } else {
            this.rooms = [{ x: 4, y: 4, w: 2, h: 2 }];
            this.grid[4][4] = TILE.FLOOR;
        }
    }

    /** Scatter interactive clutter (barrels, crates, etc.) */
    _populate(zoneLevel, theme) {
        // Populate rooms with randomized breakables
        if (!this.rooms || this.rooms.length === 0) return;

        const breakableTypes = {
            cathedral: 'obj_barrel',
            catacombs: 'obj_barrel',
            desert: 'obj_urn',
            tomb: 'obj_urn',
            jungle: 'obj_basket',
            temple: 'obj_basket',
            snow: 'obj_crate',
            hell: 'obj_shard'
        };

        const icon = breakableTypes[theme] || 'obj_barrel';

        for (const room of this.rooms) {
            const count = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                const bx = (room.x + Math.floor(Math.random() * room.w)) * this.tileSize;
                const by = (room.y + Math.floor(Math.random() * room.h)) * this.tileSize;
                
                // Only place if on floor and no object already there
                const gridX = Math.floor(bx / this.tileSize);
                const gridY = Math.floor(by / this.tileSize);
                
                if (gridX >= 0 && gridX < this.width && gridY >=0 && gridY < this.height) {
                    const tile = this.grid[gridY][gridX];
                    if (tile === TILE.FLOOR || tile === TILE.GRASS || tile === TILE.SAND || tile === TILE.SNOW) {
                        this.objectSpawns.push({
                            type: 'breakable',
                            x: bx + this.tileSize/2,
                            y: by + this.tileSize/2,
                            icon: icon
                        });
                    }
                }
            }
        }
    }
}


