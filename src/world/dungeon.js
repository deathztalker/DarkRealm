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
        this.zoneLevel = zoneLevel;
        this.theme = theme;
        
        // Map themes to PixelLab tilesets
        const tilesetMap = {
            'cathedral': 'tileset_act1_wilderness',
            'desert': 'tileset_act2_desert',
            'jungle': 'tileset_act3_jungle',
            'hell': 'tileset_act4_hell',
            'snow': 'tileset_act5_snow',
            'town': 'tileset_act1_town'
        };
        this.themeTileset = tilesetMap[theme] || null;

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
            icon: 'obj_waypoint', 
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
        this.npcSpawns = [];
        this.objectSpawns = [];

        // 1. Create a "Cross" of main roads
        const cx = Math.floor(this.width / 2);
        const cy = Math.floor(this.height / 2);

        // Vertical Road
        for (let y = 5; y < this.height - 5; y++) {
            for (let x = cx - 2; x <= cx + 2; x++) this.grid[y][x] = TILE.PATH;
        }
        // Horizontal Road
        for (let x = 5; x < this.width - 5; x++) {
            for (let y = cy - 1; y <= cy + 1; y++) this.grid[y][x] = TILE.PATH;
        }

        // 2. Town Square in the middle
        for (let y = cy - 5; y <= cy + 5; y++) {
            for (let x = cx - 6; x <= cx + 6; x++) this.grid[y][x] = TILE.PATH;
        }

        // 3. Helper to place buildings near roads
        const placeBuilding = (bx, by, icon, type = 'decoration') => {
            this.objectSpawns.push({ type, x: bx * this.tileSize, y: by * this.tileSize, icon });
            // Add a small path clearing in front
            for(let dy=1; dy<=2; dy++) {
                if (this.grid[by+dy]) this.grid[by+dy][bx] = TILE.PATH;
            }
        };

        // 4. Act-Specific Customization
        if (theme === 'town') { // Act 1
            placeBuilding(cx, cy, 'obj_bonfire'); // Center
            placeBuilding(cx - 10, cy - 8, 'obj_tent_leather');
            placeBuilding(cx + 10, cy - 6, 'obj_tent_leather');
            placeBuilding(cx - 12, cy + 8, 'obj_wagon_merchant');
            placeBuilding(cx + 12, cy + 6, 'obj_wagon_merchant');
        } else if (theme === 'desert') { // Act 2
            placeBuilding(cx, cy, 'obj_fountain');
            placeBuilding(cx - 12, cy - 10, 'obj_house_sandstone');
            placeBuilding(cx + 14, cy - 8, 'obj_house_sandstone');
            placeBuilding(cx - 15, cy + 4, 'obj_stall_bazaar');
            placeBuilding(cx + 10, cy + 10, 'obj_stall_bazaar');
            for(let i=0; i<12; i++) {
                const rx = 5 + Math.floor(Math.random()*(this.width-10));
                const ry = 5 + Math.floor(Math.random()*(this.height-10));
                if (this.grid[ry][rx] === TILE.SAND) this.objectSpawns.push({ type: 'decoration', x: rx*this.tileSize, y: ry*this.tileSize, icon: 'obj_tree_palm' });
            }
        } else if (theme === 'jungle') { // Act 3
            placeBuilding(cx - 8, cy - 8, 'obj_hut_stilt');
            placeBuilding(cx + 10, cy - 10, 'obj_hut_stilt');
            placeBuilding(cx - 12, cy + 12, 'obj_hut_stilt');
            // River/Bridge logic
            for (let x = 0; x < this.width; x++) {
                for (let y = cy + 12; y <= cy + 16; y++) {
                    if (this.grid[y][x] === TILE.PATH) this.grid[y][x] = TILE.BRIDGE;
                    else this.grid[y][x] = TILE.WATER;
                }
            }
            this.objectSpawns.push({ type: 'decoration', x: cx * this.tileSize, y: (cy + 14) * this.tileSize, icon: 'obj_bridge_rope' });
            for(let i=0; i<15; i++) {
                const rx = 2 + Math.floor(Math.random()*(this.width-4));
                const ry = 2 + Math.floor(Math.random()*(this.height-4));
                if (this.grid[ry][rx] === TILE.GRASS) this.objectSpawns.push({ type: 'decoration', x: rx*this.tileSize, y: ry*this.tileSize, icon: 'obj_tree_jungle' });
            }
        } else if (theme === 'hell') { // Act 4
            placeBuilding(cx - 6, cy - 6, 'obj_statue_angel');
            placeBuilding(cx + 6, cy - 6, 'obj_statue_angel');
            placeBuilding(cx - 10, cy + 4, 'obj_pillar_holy');
            placeBuilding(cx + 10, cy + 4, 'obj_pillar_holy');
            // Add some lava cracks
            for(let i=0; i<20; i++) {
                const rx = Math.floor(Math.random()*this.width);
                const ry = Math.floor(Math.random()*this.height);
                if (this.grid[ry][rx] === bgTile) this.grid[ry][rx] = TILE.LAVA;
            }
        } else if (theme === 'snow') { // Act 5
            placeBuilding(cx - 15, cy - 5, 'obj_longhouse_stone');
            placeBuilding(cx + 15, cy - 5, 'obj_longhouse_stone');
            placeBuilding(cx + 8, cy + 8, 'obj_anvil_hot');
            for(let i=0; i<15; i++) {
                const rx = Math.floor(Math.random()*this.width);
                const ry = Math.floor(Math.random()*this.height);
                if (this.grid[ry][rx] === TILE.SNOW) this.objectSpawns.push({ type: 'decoration', x: rx*this.tileSize, y: ry*this.tileSize, icon: 'obj_tree_snowy_pine' });
            }
        }

        // 5. Spawn NPCs
        const spawnNPC = (id, name, type, relX, relY, icon, dialogue) => {
            this.npcSpawns.push({ id, name, type, x: (cx + relX) * this.tileSize, y: (cy + relY) * this.tileSize, icon, dialogue });
        };

        spawnNPC("deckard_cain", "Deckard Cain", "elder", 3, -2, "npc_deckard_cain", "Stay awhile and listen!");

        if (zoneLevel === 0) {
            spawnNPC("akara", "Akara", "elder", -4, -4, "npc_akara", "I am Akara, High Priestess of the Sightless Eye.");
            spawnNPC("kashya", "Kashya", "mercenary_hire", -6, 2, "npc_female", "My rogues are at your service.");
            spawnNPC("charsi", "Charsi", "merchant", 6, -3, "npc_female", "Need a new blade?");
        } else if (zoneLevel === 6) {
            spawnNPC("drognan", "Drognan", "merchant", -5, -5, "npc_drognan", "Ancient texts speak of a great evil.");
            spawnNPC("jerhyn", "Jerhyn", "elder", 0, -7, "npc_elder", "Welcome to Lut Gholein.");
            spawnNPC("meshif", "Meshif", "waypoint", 8, 4, "npc_merchant", "I can take you across the sea.");
        } else if (zoneLevel === 11) {
            spawnNPC("ormus", "Ormus", "merchant", 5, -4, "npc_ormus", "Ormus speaks in riddles, but his magic is real.");
            spawnNPC("asheara", "Asheara", "mercenary_hire", -6, 2, "npc_female", "The Iron Wolves are ready.");
        } else if (zoneLevel === 16) {
            spawnNPC("jamella", "Jamella", "merchant", 5, -4, "npc_jamella", "I can heal your wounds.");
            spawnNPC("tyrael", "Tyrael", "elder", -4, -2, "npc_tyrael", "The gates of Hell await.");
        } else if (zoneLevel === 21) {
            spawnNPC("malah", "Malah", "merchant", 5, -4, "npc_malah", "Harrogath endures.");
            spawnNPC("larzuk", "Larzuk", "blacksmith", -8, 2, "npc_larzuk", "Need a socket in that?");
            spawnNPC("nihlathak", "Nihlathak", "elder", -6, 5, "npc_nihlathak", "Leave me be.");
        }

        this.playerStart = { x: cx * this.tileSize, y: (cy + 2) * this.tileSize };
        this.exitPos = { x: cx * this.tileSize, y: (this.height - 8) * this.tileSize };
        this.grid[this.height - 8][cx] = TILE.STAIRS_DOWN;

        this.objectSpawns.push({ id: 'waypoint', type: 'waypoint', x: cx * this.tileSize, y: cy * this.tileSize, icon: 'obj_waypoint', zone: 0 });
        this.objectSpawns.push({ id: 'stash', type: 'stash', name: 'Alijo (Stash)', x: (cx - 4) * this.tileSize, y: cy * this.tileSize, icon: 'obj_chest' });

        this._populate(zoneLevel, theme);
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
            [TILE.FLOOR]: 'env_floor', [TILE.WALL]: 'env_wall', [TILE.DOOR]: 'env_door',
            [TILE.STAIRS_DOWN]: 'env_stairs_down', [TILE.STAIRS_UP]: 'env_stairs_up',
            [TILE.GRASS]: 'env_grass', [TILE.PATH]: 'env_path', [TILE.WATER]: 'env_water',
            [TILE.TREE]: 'env_tree', [TILE.BRIDGE]: 'env_bridge',
            [TILE.SAND]: 'env_sand', [TILE.CACTUS]: 'env_cactus',
            [TILE.SNOW]: 'env_floor', [TILE.ICE]: 'env_floor',
            [TILE.LAVA]: 'env_floor'
        };

        // Act-specific town tileset overrides
        if (this.townTileset) {
            TILE_SPRITES[TILE.GRASS] = this.townTileset;
            TILE_SPRITES[TILE.SAND] = this.townTileset;
            TILE_SPRITES[TILE.SNOW] = this.townTileset;
            TILE_SPRITES[TILE.PATH] = this.townTileset;
            TILE_SPRITES[TILE.FLOOR] = this.townTileset;
        }

        for (let r = camTop; r < camBottom; r++) {
            for (let c = camLeft; c < camRight; c++) {
                const tile = this.grid[r][c];
                let spriteName = TILE_SPRITES[tile];

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
                    } else if (this.themeTileset && (tile === TILE.GRASS || tile === TILE.SAND || tile === TILE.SNOW || tile === TILE.PATH || tile === TILE.FLOOR)) {
                        // Variety: Pick one of the 16 tiles in the 4x4 tileset grid based on world coordinates (for stability)
                        const variantX = (c % 4) * 16;
                        const variantY = (r % 4) * 16;
                        const img = Assets.get(this.themeTileset);
                        if (img && img.complete) {
                            ctx.drawImage(img, variantX, variantY, 16, 16, c * ts, r * ts, ts, ts);
                        } else {
                            renderer.drawTile(spriteName, c * ts + ts / 2, r * ts + ts / 2, ts);
                        }
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
        // Non-walkable: WALL, WATER, TREE, CACTUS. LAVA is now walkable but dangerous.
        return tile !== TILE.WALL && tile !== TILE.WATER && tile !== TILE.TREE
            && tile !== TILE.CACTUS;
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
            jungle: 'obj_barrel',
            temple: 'obj_barrel',
            snow: 'obj_barrel',
            hell: 'obj_urn'
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


