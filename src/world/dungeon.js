/**
 * Dungeon Generator — BSP room-corridor procedural generation
 * IMPROVED: Greatly enhanced town generation with larger, more detailed cities
 */

export const TILE = {
    FLOOR: 0, WALL: 1, DOOR: 2, STAIRS_DOWN: 3, STAIRS_UP: 4, SPAWN: 5,
    GRASS: 6, PATH: 7, WATER: 8, TREE: 9, BRIDGE: 10, SAND: 11,
    CACTUS: 12, LAVA: 13, SNOW: 14, ICE: 15,
    // New tiles for richer city building
    COBBLE: 16,      // Cobblestone streets
    FENCE: 17,       // Wooden/stone fences
    RUINS: 18,       // Crumbled wall sections
    DIRT: 19,        // Dirt path variant
    MARBLE: 20,      // Fancy floor for Act 4 fortress
    WOOD_FLOOR: 21,  // Interior floor for buildings
    SHALLOW_WATER: 22, // Shallows / docks
};

export const TILE_COLORS = {
    [TILE.FLOOR]: '#2c2838', [TILE.WALL]: '#161320', [TILE.DOOR]: '#5a3a20',
    [TILE.STAIRS_DOWN]: '#3a2a4a', [TILE.STAIRS_UP]: '#2a1a3a',
    [TILE.GRASS]: '#2d5a27', [TILE.PATH]: '#5c4a3d', [TILE.WATER]: '#1e4b85',
    [TILE.TREE]: '#1b4018', [TILE.BRIDGE]: '#503525',
    [TILE.SAND]: '#d4a017', [TILE.CACTUS]: '#4a6b2c',
    [TILE.LAVA]: '#ff4500', [TILE.SNOW]: '#ffffff', [TILE.ICE]: '#a0e0ff',
    [TILE.COBBLE]: '#4a4040', [TILE.FENCE]: '#6b4a25', [TILE.RUINS]: '#2a1e1e',
    [TILE.DIRT]: '#4a3520', [TILE.MARBLE]: '#c8c0b0', [TILE.WOOD_FLOOR]: '#6b4a2a',
    [TILE.SHALLOW_WATER]: '#2a6aaa',
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
        this.theme = theme;

        if (zoneLevel >= 128) return this.generateRift(zoneLevel);
        if ([0, 38, 68, 96, 102].includes(zoneLevel)) return this.generateTown(theme, zoneLevel);
        if ([37, 67, 95, 101, 125, 127].includes(zoneLevel) || (zoneLevel >= 128 && zoneLevel % 5 === 0))
            return this.generateBossRoom(theme, zoneLevel);

        return this._generateProcedural(zoneLevel, theme, true);
    }

    generateRift(zoneLevel) {
        const themes = ['cathedral', 'desert', 'tomb', 'jungle', 'temple', 'hell', 'snow'];
        const theme = themes[Math.floor(this.rng() * themes.length)];
        return this._generateProcedural(zoneLevel, theme, false);
    }

    // ─────────────────────────────────────────────────────────────
    //  TOWN GENERATION — completely rewritten
    // ─────────────────────────────────────────────────────────────
    generateTown(theme, zoneLevel = 0) {
        this.rooms = [];
        this.enemySpawns = [];
        this.lootSpawns = [];
        this.npcSpawns = [];
        this.objectSpawns = [];

        const cx = Math.floor(this.width / 2);
        const cy = Math.floor(this.height / 2);

        const addNpc = (id, name, type, dx, dy, icon, dialogue) => {
            this.npcSpawns.push({
                id, name, type,
                x: (cx + dx) * this.tileSize,
                y: (cy + dy) * this.tileSize,
                icon, dialogue
            });
        };

        const addObj = (id, type, name, dx, dy, icon, extra = {}) => {
            this.objectSpawns.push({
                id, type, name,
                x: (cx + dx) * this.tileSize,
                y: (cy + dy) * this.tileSize,
                icon, ...extra
            });
        };

        // Helper: fill a rect with a tile
        const fill = (y0, x0, y1, x1, tile) => {
            for (let y = y0; y <= y1; y++)
                for (let x = x0; x <= x1; x++)
                    if (y >= 0 && y < this.height && x >= 0 && x < this.width)
                        this.grid[y][x] = tile;
        };

        // Helper: draw a hollow rect (walls only)
        const border = (x0, y0, x1, y1, tile) => {
            for (let x = x0; x <= x1; x++) { this._setTile(y0, x, tile); this._setTile(y1, x, tile); }
            for (let y = y0; y <= y1; y++) { this._setTile(y, x0, tile); this._setTile(y, x1, tile); }
        };

        // Helper: draw a simple building (walls + wood floor interior)
        const building = (x0, y0, x1, y1, doorSide = 'bottom') => {
            fill(y0, x0, y1, x1, TILE.WALL);
            fill(y0 + 1, x0 + 1, y1 - 1, x1 - 1, TILE.WOOD_FLOOR);
            const mx = Math.floor((x0 + x1) / 2);
            const my = Math.floor((y0 + y1) / 2);
            if (doorSide === 'bottom') this._setTile(y1, mx, TILE.DOOR);
            else if (doorSide === 'top') this._setTile(y0, mx, TILE.DOOR);
            else if (doorSide === 'left') this._setTile(my, x0, TILE.DOOR);
            else if (doorSide === 'right') this._setTile(my, x1, TILE.DOOR);
        };

        // Helper: scatter trees in a region
        const scatterTrees = (x0, y0, x1, y1, density = 0.12) => {
            for (let y = y0; y <= y1; y++)
                for (let x = x0; x <= x1; x++)
                    if (this.rng() < density && this.grid[y]?.[x] === TILE.GRASS)
                        this._setTile(y, x, TILE.TREE);
        };

        // Helper: horizontal road
        const hRoad = (y, x0, x1, tile = TILE.PATH) => {
            for (let x = x0; x <= x1; x++) this._setTile(y, x, tile);
        };
        // Helper: vertical road
        const vRoad = (x, y0, y1, tile = TILE.PATH) => {
            for (let y = y0; y <= y1; y++) this._setTile(y, x, tile);
        };

        // ── ACT 1 : ROGUE ENCAMPMENT ─────────────────────────────
        if (zoneLevel === 0) {
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.GRASS));

            // === Outer forest ring ===
            scatterTrees(0, 0, this.width - 1, this.height - 1, 0.18);

            // === Palisade perimeter wall (large) ===
            const px0 = cx - 28, px1 = cx + 28, py0 = cy - 22, py1 = cy + 18;
            border(px0, py0, px1, py1, TILE.FENCE);
            // Gate at bottom
            this._setTile(py1, cx - 1, TILE.DOOR);
            this._setTile(py1, cx, TILE.DOOR);
            this._setTile(py1, cx + 1, TILE.DOOR);
            // Clear fence interior so trees don't bleed in
            fill(py0 + 1, px0 + 1, py1 - 1, px1 - 1, TILE.GRASS);

            // === Main dirt square in center ===
            fill(cy - 10, cx - 14, cy + 10, cx + 14, TILE.PATH);

            // === Central cobblestone plaza ===
            fill(cy - 5, cx - 6, cy + 5, cx + 6, TILE.COBBLE);

            // === Camp roads (cross-shaped) ===
            hRoad(cy, px0 + 1, px1 - 1);
            vRoad(cx, py0 + 1, py1 - 1);

            // === River at the south (wide) ===
            fill(py1 + 2, 0, py1 + 12, this.width - 1, TILE.WATER);
            // Shallow bank
            fill(py1 + 1, 0, py1 + 2, this.width - 1, TILE.SHALLOW_WATER);

            // === Northern tents row (west side) ===
            building(cx - 26, cy - 20, cx - 18, cy - 14, 'bottom');
            addObj('tent_w1', 'decoration', 'Rogue Tent', -22, -17, 'obj_tent_leather', { spriteSize: 64 });
            building(cx - 26, cy - 12, cx - 18, cy - 6, 'bottom');
            addObj('tent_w2', 'decoration', 'Rogue Tent', -22, -9, 'obj_tent_leather', { spriteSize: 64 });
            building(cx - 26, cy - 4, cx - 18, cy + 2, 'bottom');
            addObj('tent_w3', 'decoration', 'Rogue Tent', -22, -1, 'obj_tent_leather', { spriteSize: 64 });

            // === Northern tents row (east side) ===
            building(cx + 18, cy - 20, cx + 26, cy - 14, 'bottom');
            addObj('tent_e1', 'decoration', 'Rogue Tent', 22, -17, 'obj_tent_leather', { spriteSize: 64 });
            building(cx + 18, cy - 12, cx + 26, cy - 6, 'bottom');
            addObj('tent_e2', 'decoration', 'Rogue Tent', 22, -9, 'obj_tent_leather', { spriteSize: 64 });

            // === Charsi's forge (east, large) ===
            building(cx + 14, cy - 2, cx + 26, cy + 8, 'left');
            addObj('forge_roof', 'decoration', 'Blacksmith', 20, 3, 'obj_tent_rogue', { spriteSize: 80 });
            addObj('forge_anvil', 'decoration', 'Anvil', 20, 5, 'obj_anvil_hot', { spriteSize: 32 });

            // === Watchtowers at corners ===
            fill(py0, px0, py0 + 3, px0 + 3, TILE.WALL);
            fill(py0, px1 - 3, py0 + 3, px1, TILE.WALL);
            fill(py1 - 3, px0, py1, px0 + 3, TILE.WALL);
            fill(py1 - 3, px1 - 3, py1, px1, TILE.WALL);

            // === Bonfire + waypoint in plaza center ===
            addObj('bonfire', 'decoration', 'Campfire', 0, 1, 'obj_bonfire');
            addObj('fountain_main', 'decoration', 'Plaza Fountain', -2, -3, 'obj_fountain_ornate');
            addObj('waypoint', 'waypoint', 'Waypoint', 3, 1, 'obj_waypoint', { zone: zoneLevel });
            addObj('stash', 'stash', 'Stash', -4, 2, 'obj_chest');
            addObj('cube', 'cube', 'Horadric Cube', -6, 2, 'item_horadric_fragment');

            // === Market stalls near Gheed ===
            addObj('stall_1', 'decoration', 'Market Stall', 8, -10, 'obj_stall_market');
            addObj('stall_2', 'decoration', 'Market Stall', 12, -10, 'obj_stall_market');

            // === Shrines along west wall ===
            addObj('shrine_e', 'shrine', 'Experience Shrine', -24, -8, 'obj_shrine', { shrineType: 'experience' });
            addObj('shrine_m', 'shrine', 'Mana Shrine', -24, 2, 'obj_shrine', { shrineType: 'mana' });

            // === Fence decorations ===
            for (let i = 0; i < 10; i++)
                addObj(`torch_${i}`, 'decoration', 'Torch', -14 + i * 3, -21, 'obj_torch');

            // === Well in NE courtyard ===
            addObj('well', 'decoration', 'Well', 20, -10, 'obj_well');

            // === Supplies / barrels ===
            for (let i = 0; i < 6; i++)
                addObj(`barrel_${i}`, 'breakable', 'Barrel', 15 + i, 6, 'obj_barrel');

            // === NPCs ===
            addNpc('akara', 'Akara', 'elder', -20, -17, 'npc_akara', 'I am Akara, High Priestess of the Sightless Eye.');
            addNpc('charsi', 'Charsi', 'merchant', 20, 2, 'npc_akara', "Hi there! I'm Charsi, the Encampment's blacksmith.");
            addNpc('kashya', 'Kashya', 'mercenary_hire', -8, 8, 'npc_akara', 'I am Kashya. My Rogues are the best scouts in Sanctuary.');
            addNpc('gheed', 'Gheed', 'merchant', 10, -8, 'npc_ormus', "A Deal? I've got plenty of those!");
            addNpc('warriv', 'Warriv', 'waypoint', 6, 14, 'npc_larzuk', 'I can take you to the East when you are ready.');
            addNpc('deckard_cain', 'Deckard Cain', 'elder', -2, -4, 'npc_deckard_cain', 'Stay a while and listen!');
            addNpc('rogue_scout1', 'Rogue Scout', 'guard', -26, -16, 'npc_akara', 'Be on your guard, stranger.');
            addNpc('rogue_scout2', 'Rogue Scout', 'guard', 26, -16, 'npc_akara', 'The darkness grows.');

            // === Dungeon Entrance ===
            addObj('blood_moor_entrance', 'portal', 'To Blood Moor', 0, 16, 'obj_dungeon_entrance', { targetZone: 1 });

            this.playerStart = { x: cx * this.tileSize, y: (cy + 12) * this.tileSize };
            this.exitPos = { x: cx * this.tileSize, y: (py1 + 1) * this.tileSize };

            // ── ACT 2 : LUT GHOLEIN ──────────────────────────────────
        } else if (zoneLevel === 38) {
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.SAND));

            // === Desert outside ===
            // Scattered cacti in the wilds
            for (let y = 0; y < this.height; y++)
                for (let x = 0; x < this.width; x++)
                    if (this.rng() < 0.04) this._setTile(y, x, TILE.CACTUS);

            // === City boundary wall ===
            const wx0 = cx - 32, wx1 = cx + 24, wy0 = cy - 24, wy1 = cy + 20;
            border(wx0, wy0, wx1, wy1, TILE.WALL);
            // Gates
            this._setTile(wy0, cx, TILE.DOOR); // north gate
            this._setTile(wy1, cx, TILE.DOOR); // south gate
            // Interior clear
            fill(wy0 + 1, wx0 + 1, wy1 - 1, wx1 - 1, TILE.SAND);

            // === Stone paved city core ===
            fill(cy - 14, cx - 22, cy + 14, cx + 18, TILE.FLOOR);

            // === Market square (cobbled) ===
            fill(cy - 6, cx - 8, cy + 6, cx + 6, TILE.COBBLE);

            // === Main avenues ===
            hRoad(cy, wx0 + 1, wx1 - 1, TILE.PATH);
            vRoad(cx, wy0 + 1, wy1 - 1, TILE.PATH);
            hRoad(cy - 10, wx0 + 1, wx1 - 1, TILE.PATH);

            // === Sea / harbour (right side) ===
            fill(0, cx + 26, this.height - 1, this.width - 1, TILE.WATER);
            fill(0, cx + 24, this.height - 1, cx + 26, TILE.SHALLOW_WATER);
            // Docks
            for (let dockY = cy - 8; dockY <= cy + 8; dockY += 4) {
                fill(dockY, cx + 24, dockY + 2, cx + 32, TILE.BRIDGE);
            }

            // === Sandstone buildings ===
            // West district
            building(cx - 30, cy - 22, cx - 20, cy - 14, 'right');
            addObj('h_w1', 'decoration', 'House', -25, -18, 'obj_house_sandstone', { spriteSize: 80 });
            building(cx - 30, cy - 10, cx - 20, cy - 2, 'right');
            addObj('h_w2', 'decoration', 'House', -25, -6, 'obj_house_sandstone', { spriteSize: 80 });
            building(cx - 30, cy + 2, cx - 20, cy + 10, 'right');
            addObj('h_w3', 'decoration', 'House', -25, 6, 'obj_house_sandstone', { spriteSize: 80 });
            building(cx - 18, cy - 22, cx - 10, cy - 14, 'bottom');
            addObj('h_w4', 'decoration', 'House', -14, -18, 'obj_house_sandstone', { spriteSize: 64 });
            building(cx - 18, cy + 8, cx - 10, cy + 18, 'top');
            addObj('h_w5', 'decoration', 'House', -14, 13, 'obj_house_sandstone', { spriteSize: 80 });
            // East district
            building(cx + 10, cy - 22, cx + 22, cy - 14, 'bottom');
            addObj('h_e1', 'decoration', 'House', 16, -18, 'obj_house_sandstone', { spriteSize: 80 });
            building(cx + 10, cy - 10, cx + 22, cy - 2, 'bottom');
            addObj('h_e2', 'decoration', 'House', 16, -6, 'obj_house_sandstone', { spriteSize: 80 });
            // Palace / Inn (large, center-north)
            building(cx - 8, cy - 22, cx + 8, cy - 12, 'bottom');
            addObj('palace', 'decoration', 'Palace', 0, -17, 'obj_house_sandstone', { spriteSize: 120 });
            // Guard post
            building(cx - 4, wy0, cx + 4, wy0 + 4, 'bottom');
            addObj('guard_post', 'decoration', 'Guard Post', 0, wy0 - cy + 2, 'obj_house_sandstone', { spriteSize: 64 });

            // Scattered Palm Trees
            for (let i = 0; i < 6; i++) {
                addObj(`palm_${i}`, 'decoration', 'Palm Tree', -20 + i * 8, -25, 'obj_tree_palm', { spriteSize: 48 });
            }

            // === Palace courtyard pillars ===
            for (let i = -3; i <= 3; i += 3)
                addObj(`pillar_${i}`, 'decoration', 'Pillar', i, -15, 'obj_pillar_holy');

            // === Fountain in market square ===
            addObj('fountain', 'decoration', 'Plaza Fountain', 0, -2, 'obj_fountain_ornate');

            // === Waypoint & services ===
            addObj('waypoint', 'waypoint', 'Waypoint', 8, 2, 'obj_waypoint', { zone: zoneLevel });
            addObj('stash', 'stash', 'Stash', -10, 2, 'obj_chest');
            addObj('cube', 'cube', 'Horadric Cube', -12, 2, 'item_horadric_fragment');

            // === Barrels & market stalls ===
            for (let i = 0; i < 8; i++)
                addObj(`barrel_${i}`, 'breakable', 'Urn', -5 + i, 5, 'obj_urn');

            addObj('stall_1', 'decoration', 'Market Stall', -8, -10, 'obj_stall_market');
            addObj('stall_2', 'decoration', 'Market Stall', 12, -10, 'obj_stall_market');

            // === Shrines ===
            addObj('shrine_a', 'shrine', 'Armor Shrine', -28, -6, 'obj_shrine', { shrineType: 'armor' });
            addObj('shrine_r', 'shrine', 'Resist Shrine', -28, 6, 'obj_shrine', { shrineType: 'resist' });

            // === NPCs ===
            addNpc('fara', 'Fara', 'elder', -24, -8, 'npc_akara', 'I am Fara. I can heal your wounds.');
            addNpc('lysander', 'Lysander', 'merchant', -24, 0, 'npc_akara', "Be careful! I'm brewing something sensitive.");
            addNpc('drognan', 'Drognan', 'merchant', 16, -18, 'npc_ormus', 'The Vizjerei have many secrets.');
            addNpc('greiz', 'Greiz', 'mercenary_hire', 20, 6, 'npc_larzuk', 'My desert mercenaries are for hire.');
            addNpc('atma', 'Atma', 'elder', 0, 12, 'npc_akara', 'Radament... he killed my family.');
            addNpc('meshif', 'Meshif', 'waypoint', 22, 0, 'npc_larzuk', 'I am the captain of this ship.');
            addNpc('jerhyn', 'Jerhyn', 'elder', -2, -18, 'npc_tyrael', 'Welcome to Lut Gholein. I am its Sultan.');
            addNpc('elzix', 'Elzix', 'merchant', 14, -10, 'npc_ormus', 'Stay at my inn for a rest.');
            addNpc('deckard_cain', 'Deckard Cain', 'elder', -2, -4, 'npc_deckard_cain', 'Stay a while and listen!');
            addNpc('guard1', 'City Guard', 'guard', -4, -25, 'npc_larzuk', 'None shall pass without Sultan\'s leave.');
            addNpc('guard2', 'City Guard', 'guard', 4, -25, 'npc_larzuk', 'Move along, traveler.');

            this.playerStart = { x: cx * this.tileSize, y: (cy + 8) * this.tileSize };
            this.exitPos = { x: cx * this.tileSize, y: (wy1 + 1) * this.tileSize };

            // === Dungeon Entrance ===
            addObj('sewers_entrance', 'portal', 'To Rocky Waste', 0, 21, 'obj_dungeon_entrance', { targetZone: 39 });

            // ── ACT 3 : KURAST DOCKS ─────────────────────────────────
        } else if (zoneLevel === 68) {
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WATER));

            // === Jungle shore at back (north) ===
            fill(0, 0, cy - 18, this.width - 1, TILE.GRASS);
            scatterTrees(0, 0, this.width - 1, cy - 14, 0.25);

            // === Wide main dock platform ===
            fill(cy - 16, cx - 30, cy + 16, cx + 20, TILE.BRIDGE);

            // === Central raised district (solid land section) ===
            fill(cy - 10, cx - 20, cy + 10, cx + 10, TILE.PATH);
            fill(cy - 6, cx - 12, cy + 6, cx + 6, TILE.COBBLE);

            // === Pier arms extending into the water ===
            // East piers
            for (let py = cy - 12; py <= cy + 12; py += 6)
                fill(py, cx + 20, py + 3, cx + 38, TILE.BRIDGE);
            // South piers
            for (let px = cx - 24; px <= cx + 12; px += 12)
                fill(cy + 16, px, cy + 28, px + 3, TILE.BRIDGE);

            // === Shallow water near shore ===
            fill(cy + 14, 0, cy + 18, this.width - 1, TILE.SHALLOW_WATER);

            // === Stilt huts across the docks ===
            building(cx - 28, cy - 14, cx - 16, cy - 6, 'right');
            addObj('hut_1', 'decoration', 'Stilt Hut', -22, -10, 'obj_hut_stilt', { spriteSize: 80 });
            building(cx - 28, cy - 2, cx - 16, cy + 6, 'right');
            addObj('hut_2', 'decoration', 'Stilt Hut', -22, 2, 'obj_hut_stilt', { spriteSize: 80 });
            building(cx - 28, cy + 8, cx - 16, cy + 14, 'right');
            addObj('hut_3', 'decoration', 'Stilt Hut', -22, 11, 'obj_hut_stilt', { spriteSize: 80 });
            building(cx - 12, cy - 14, cx - 2, cy - 6, 'bottom');
            addObj('hut_4', 'decoration', 'Stilt Hut', -7, -10, 'obj_hut_stilt', { spriteSize: 80 });
            building(cx - 12, cy + 8, cx - 2, cy + 14, 'top');
            addObj('hut_5', 'decoration', 'Stilt Hut', -7, 11, 'obj_hut_stilt', { spriteSize: 80 });
            building(cx + 12, cy - 14, cx + 20, cy - 6, 'bottom');
            addObj('hut_6', 'decoration', 'Stilt Hut', 16, -10, 'obj_hut_stilt', { spriteSize: 80 });
            building(cx + 12, cy + 4, cx + 20, cy + 12, 'top');
            addObj('hut_7', 'decoration', 'Stilt Hut', 16, 8, 'obj_hut_stilt', { spriteSize: 80 });
            // Central hall (Ormus's) — large
            building(cx - 4, cy - 14, cx + 10, cy - 4, 'bottom');
            addObj('hut_ormus', 'decoration', 'Great Hut', 3, -9, 'obj_hut_stilt', { spriteSize: 100 });

            // === Temple ruin outline (north east corner) ===
            border(cx + 16, cy - 22, cx + 28, cy - 10, TILE.RUINS);
            fill(cy - 20, cx + 18, cy - 12, cx + 26, TILE.FLOOR);

            // === Jungle tree clusters on dock edges ===
            for (let i = 0; i < 12; i++) {
                const tx = cx - 30 + Math.floor(this.rng() * 10);
                const ty = cy - 20 + Math.floor(this.rng() * 6);
                this._setTile(ty, tx, TILE.TREE);
            }

            // === Services ===
            addObj('waypoint', 'waypoint', 'Waypoint', 6, 2, 'obj_waypoint', { zone: zoneLevel });
            addObj('stash', 'stash', 'Stash', -8, 2, 'obj_chest');
            addObj('cube', 'cube', 'Horadric Cube', -10, 2, 'item_horadric_fragment');

            // === Market crates ===
            for (let i = 0; i < 10; i++)
                addObj(`crate_${i}`, 'breakable', 'Crate', -18 + i * 2, 10, 'obj_barrel');

            addObj('stall_1', 'decoration', 'Market Stall', -6, 12, 'obj_stall_market');
            addObj('stall_2', 'decoration', 'Market Stall', 12, 12, 'obj_stall_market');

            // Shrines
            addObj('shrine_s', 'shrine', 'Speed Shrine', -26, 2, 'obj_shrine', { shrineType: 'speed' });
            addObj('shrine_c', 'shrine', 'Combat Shrine', -26, -8, 'obj_shrine', { shrineType: 'combat' });

            // Temple altar up north
            addObj('altar', 'decoration', 'Ancient Altar', 22, -16, 'obj_altar');

            // NPCs
            addNpc('ormus', 'Ormus', 'elder', -2, -9, 'npc_ormus', 'Ormus has been waiting for you.');
            addNpc('hratli', 'Hratli', 'merchant', 16, -9, 'npc_larzuk', 'Good luck in the jungle, traveler.');
            addNpc('asheara', 'Asheara', 'mercenary_hire', -22, 10, 'npc_akara', 'The Iron Wolves are ready.');
            addNpc('alkor', 'Alkor', 'merchant', -22, -10, 'npc_akara', 'I am Alkor. I deal in alchemy.');
            addNpc('cain_kurast', 'Deckard Cain', 'elder', -2, -4, 'npc_deckard_cain', 'Stay a while and listen!');
            addNpc('meshif_k', 'Meshif', 'waypoint', 18, 12, 'npc_larzuk', 'I can take you to Lut Gholein.');
            addNpc('natalya', 'Natalya', 'elder', 12, 4, 'npc_akara', 'I hunt evil in these jungles.');
            addNpc('dock_worker1', 'Dock Worker', 'guard', -26, 12, 'npc_larzuk', 'Watch your step on these planks!');
            addNpc('dock_worker2', 'Dock Worker', 'guard', 20, 14, 'npc_larzuk', 'Strange tides lately...');

            this.playerStart = { x: cx * this.tileSize, y: (cy + 8) * this.tileSize };
            this.exitPos = { x: (cx - 28) * this.tileSize, y: cy * this.tileSize };

            // === Dungeon Entrance ===
            addObj('jungle_entrance', 'portal', 'To Spider Cavern', -29, 0, 'obj_dungeon_entrance', { targetZone: 69 });

            // ── ACT 4 : PANDEMONIUM FORTRESS ─────────────────────────
        } else if (zoneLevel === 96) {
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));

            // === Outer void with lava rivers ===
            // Lava streams in the background
            for (let lx = 0; lx < this.width; lx++)
                for (let ly = 0; ly < this.height; ly++)
                    if (Math.abs(Math.sin(lx * 0.15) * 3 - (ly - cy + 30)) < 2) this._setTile(ly, lx, TILE.LAVA);

            // === Grand fortress walls (octagonal feel) ===
            const fw = 30, fh = 26;
            const fx0 = cx - fw, fx1 = cx + fw, fy0 = cy - fh, fy1 = cy + fh;
            border(fx0, fy0, fx1, fy1, TILE.WALL);
            fill(fy0 + 1, fx0 + 1, fy1 - 1, fx1 - 1, TILE.MARBLE);

            // Diagonal cuts at corners (for octagon)
            for (let d = 0; d < 5; d++) {
                fill(fy0 + d, fx0, fy0 + d, fx0 + (4 - d), TILE.WALL);
                fill(fy0 + d, fx1 - (4 - d), fy0 + d, fx1, TILE.WALL);
                fill(fy1 - d, fx0, fy1 - d, fx0 + (4 - d), TILE.WALL);
                fill(fy1 - d, fx1 - (4 - d), fy1 - d, fx1, TILE.WALL);
            }

            // === Inner sanctum (darker floor) ===
            fill(cy - 10, cx - 12, cy + 10, cx + 12, TILE.FLOOR);
            border(cy - 10, cx - 12, cy + 10, cx + 12, TILE.WALL);

            // === Sanctuary gates ===
            this._setTile(cy + 10, cx - 1, TILE.DOOR);
            this._setTile(cy + 10, cx, TILE.DOOR);
            this._setTile(cy + 10, cx + 1, TILE.DOOR);

            // === Entrance bridge from south ===
            fill(fy1, cx - 3, fy1 + 10, cx + 3, TILE.PATH);

            // === Colonnaded avenues ===
            for (let px = fx0 + 4; px <= fx1 - 4; px += 6) {
                this._setTile(cy - 12, px, TILE.WALL); // pillar row
                this._setTile(cy + 12, px, TILE.WALL);
            }

            // === Lava pools inside fortress ===
            fill(cy - 24, cx - 26, cy - 18, cx - 20, TILE.LAVA);
            fill(cy - 24, cx + 20, cy - 18, cx + 26, TILE.LAVA);
            fill(cy + 18, cx - 26, cy + 24, cx - 20, TILE.LAVA);
            fill(cy + 18, cx + 20, cy + 24, cx + 26, TILE.LAVA);

            // === Pandemonium altar in throne room ===
            addObj('altar', 'altar', 'Pandemonium Altar', 0, -6, 'obj_pandemonium_altar');
            addObj('waypoint', 'waypoint', 'Waypoint', 6, 4, 'obj_waypoint', { zone: zoneLevel });
            addObj('stash', 'stash', 'Stash', -8, 4, 'obj_chest');
            addObj('cube', 'cube', 'Horadric Cube', -10, 4, 'item_horadric_fragment');

            // Decorative soulstones and statues
            for (let i = -2; i <= 2; i += 2) {
                addObj(`soul_${i}`, 'decoration', 'Soulstone', i, -14, 'obj_cluster_soulstone', { spriteSize: 48 });
            }
            addObj(`statue_w`, 'decoration', 'Angel Statue', -10, -6, 'obj_statue_angel', { spriteSize: 48 });
            addObj(`statue_e`, 'decoration', 'Angel Statue', 10, -6, 'obj_statue_angel', { spriteSize: 48 });

            // Hell torches
            for (let i = -26; i <= 26; i += 6) {
                addObj(`htorch_n${i}`, 'decoration', 'Hell Torch', i, -25, 'obj_torch_hell');
                addObj(`htorch_s${i}`, 'decoration', 'Hell Torch', i, 25, 'obj_torch_hell');
            }

            // NPCs
            addNpc('tyrael', 'Tyrael', 'elder', 0, -9, 'npc_tyrael', 'The Light welcomes you to the last bastion against Hell.');
            addNpc('jamella', 'Jamella', 'merchant', -16, 0, 'npc_akara', 'I can heal your soul.');
            addNpc('halbu', 'Halbu', 'merchant', 16, 0, 'npc_larzuk', 'Armor... weapons... I have it all.');
            addNpc('deckard_cain', 'Deckard Cain', 'elder', -2, 3, 'npc_deckard_cain', 'Stay a while and listen!');
            addNpc('angel_guard1', 'Angelic Guard', 'guard', -28, 0, 'npc_tyrael', 'None shall defile this sanctuary.');
            addNpc('angel_guard2', 'Angelic Guard', 'guard', 28, 0, 'npc_tyrael', 'Be vigilant. Diablo is near.');

            this.playerStart = { x: cx * this.tileSize, y: (fy1 + 5) * this.tileSize };
            this.exitPos = { x: cx * this.tileSize, y: (fy1 + 1) * this.tileSize };

            // === Dungeon Entrance ===
            addObj('hell_entrance', 'portal', 'To Outer Steppes', 0, fy1 + 1, 'obj_dungeon_entrance', { targetZone: 97 });

            // ── ACT 5 : HARROGATH ────────────────────────────────────
        } else if (zoneLevel === 102) {
            this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.SNOW));

            // === Mountain backdrop (north) ===
            for (let y = 0; y < cy - 22; y++)
                for (let x = 0; x < this.width; x++)
                    this._setTile(y, x, TILE.WALL);

            // === Snow fields with ice patches ===
            for (let y = cy - 22; y < this.height; y++)
                for (let x = 0; x < this.width; x++)
                    if (this.rng() < 0.06) this._setTile(y, x, TILE.ICE);

            // === Outer palisade ===
            const hx0 = cx - 30, hx1 = cx + 30, hy0 = cy - 20, hy1 = cy + 20;
            border(hx0, hy0, hx1, hy1, TILE.WALL);
            // Main gate (south)
            this._setTile(hy1, cx - 2, TILE.DOOR);
            this._setTile(hy1, cx - 1, TILE.DOOR);
            this._setTile(hy1, cx, TILE.DOOR);
            this._setTile(hy1, cx + 1, TILE.DOOR);
            this._setTile(hy1, cx + 2, TILE.DOOR);
            // Postern gate (north)
            this._setTile(hy0, cx, TILE.DOOR);

            // === Interior roads & paths ===
            fill(hy0 + 1, hx0 + 1, hy1 - 1, hx1 - 1, TILE.SNOW);
            hRoad(cy, hx0 + 1, hx1 - 1, TILE.PATH);
            vRoad(cx, hy0 + 1, hy1 - 1, TILE.PATH);
            hRoad(cy - 8, hx0 + 1, hx1 - 1, TILE.COBBLE);

            // === Main square (cobbled) ===
            fill(cy - 5, cx - 10, cy + 5, cx + 10, TILE.COBBLE);

            // === Watchtowers at corners ===
            fill(hy0, hx0, hy0 + 4, hx0 + 4, TILE.WALL);
            fill(hy0, hx1 - 4, hy0 + 4, hx1, TILE.WALL);
            fill(hy1 - 4, hx0, hy1, hx0 + 4, TILE.WALL);
            fill(hy1 - 4, hx1 - 4, hy1, hx1, TILE.WALL);

            // === Cabins & longhouses ===
            // West district
            building(cx - 28, cy - 18, cx - 16, cy - 10, 'right');
            addObj('lh_w1', 'decoration', 'Longhouse', -22, -14, 'obj_longhouse_stone', { spriteSize: 96 });
            building(cx - 28, cy - 6, cx - 16, cy + 2, 'right');
            addObj('lh_w2', 'decoration', 'Longhouse', -22, -2, 'obj_longhouse_stone', { spriteSize: 96 });
            building(cx - 28, cy + 6, cx - 16, cy + 14, 'right');
            addObj('lh_w3', 'decoration', 'Longhouse', -22, 10, 'obj_longhouse_stone', { spriteSize: 96 });
            // East district
            building(cx + 16, cy - 18, cx + 28, cy - 10, 'left');
            addObj('lh_e1', 'decoration', 'Longhouse', 22, -14, 'obj_harrogath_cabin', { spriteSize: 96 });
            building(cx + 16, cy + 2, cx + 28, cy + 10, 'left');
            addObj('lh_e2', 'decoration', 'Longhouse', 22, 6, 'obj_harrogath_cabin', { spriteSize: 96 });
            // Larzuk's smithy (south east, large)
            building(cx + 16, cy + 10, cx + 28, cy + 18, 'left');
            addObj('lh_larzuk', 'decoration', 'Smithy', 22, 14, 'obj_harrogath_cabin', { spriteSize: 96 });
            // Malah's house (north, prominent)
            building(cx - 8, cy - 18, cx + 8, cy - 10, 'bottom');
            addObj('lh_malah', 'decoration', 'Malahs Healing', 0, -14, 'obj_longhouse_stone', { spriteSize: 128 });

            // === Arreat Summit path (north, narrowing) ===
            for (let y = hy0 - 1; y >= 2; y--) {
                const narrowing = Math.max(1, Math.floor((hy0 - y) / 3));
                for (let x = cx - narrowing; x <= cx + narrowing; x++)
                    this._setTile(y, x, TILE.PATH);
            }

            // === Decorative ice formations ===
            for (let i = 0; i < 8; i++) {
                const ix = cx - 26 + Math.floor(this.rng() * 52);
                const iy = cy - 18 + Math.floor(this.rng() * 36);
                if (this.grid[iy]?.[ix] === TILE.SNOW)
                    this._setTile(iy, ix, TILE.ICE);
            }

            // === Services ===
            addObj('waypoint', 'waypoint', 'Waypoint', 4, 2, 'obj_waypoint', { zone: zoneLevel });
            addObj('stash', 'stash', 'Stash', -8, 2, 'obj_chest');
            addObj('cube', 'cube', 'Horadric Cube', -10, 2, 'item_horadric_fragment');

            // Shrines
            addObj('shrine_h', 'shrine', 'Health Shrine', -26, 6, 'obj_shrine', { shrineType: 'health' });
            addObj('shrine_e', 'shrine', 'Experience Shrine', 26, 6, 'obj_shrine', { shrineType: 'experience' });

            // Forge / anvil for Larzuk
            addObj('forge', 'decoration', "Larzuk's Forge", 22, 14, 'obj_altar');

            // NPCs
            addNpc('malah', 'Malah', 'elder', -2, -14, 'npc_akara', 'Welcome to Harrogath, child.');
            addNpc('larzuk', 'Larzuk', 'merchant', 22, 14, 'npc_larzuk', 'I am the best smith on Arreat.');
            addNpc('qual_kehk', 'Qual-Kehk', 'mercenary_hire', -22, 12, 'npc_larzuk', 'My Barbarian warriors will fight for you.');
            addNpc('anya', 'Anya', 'merchant', 22, 6, 'npc_akara', 'I owe you my life, traveler.');
            addNpc('nihlathak', 'Nihlathak', 'elder', 0, -10, 'npc_ormus', 'I am busy. Begone.');
            addNpc('cain_harr', 'Deckard Cain', 'elder', -2, -4, 'npc_deckard_cain', 'Stay a while and listen!');
            addNpc('barb_guard1', 'Barbarian Guard', 'guard', -32, cy - hy0, 'npc_larzuk', 'The mountain will not fall while we stand.');
            addNpc('barb_guard2', 'Barbarian Guard', 'guard', 32, cy - hy0, 'npc_larzuk', 'Baal shall not pass!');

            this.playerStart = { x: cx * this.tileSize, y: (cy + 12) * this.tileSize };
            this.exitPos = { x: cx * this.tileSize, y: (hy1 + 1) * this.tileSize };

            // === Dungeon Entrance ===
            addObj('harrogath_entrance', 'portal', 'To Bloody Foothills', 0, 21, 'obj_dungeon_entrance', { targetZone: 103 });
        }

        return this;
    }

    // Safe tile setter with bounds check
    _setTile(r, c, tile) {
        if (r >= 0 && r < this.height && c >= 0 && c < this.width)
            this.grid[r][c] = tile;
    }

    // ─────────────────────────────────────────────────────────────
    //  PROCEDURAL DUNGEON — unchanged logic, small tile additions
    // ─────────────────────────────────────────────────────────────
    _generateProcedural(zoneLevel, theme, placeExit = true) {
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
        this.rooms = [];
        this.enemySpawns = [];
        this.lootSpawns = [];
        this.npcSpawns = [];
        this.objectSpawns = [];

        // Organic vs Structural Biomes
        const isOrganicTheme = ['jungle', 'desert', 'snow', 'hell', 'cave'].includes(theme);

        if (!isOrganicTheme) {
            const root = { x: 1, y: 1, w: this.width - 2, h: this.height - 2 };
            let iterations = 6;
            if (theme === 'catacombs' || theme === 'tomb') iterations = 7;
            if (theme === 'temple' || theme === 'fortress') iterations = 5;

            const leaves = this._bsp(root, 0, iterations);
            for (const leaf of leaves) {
                const room = this._carveRoom(leaf);
                if (room) this.rooms.push(room);
            }
            for (let i = 1; i < this.rooms.length; i++)
                this._corridor(this.rooms[i - 1], this.rooms[i]);
        } else {
            this._generateAutomata();
        }

        // --- Theme Post-Processing (Biomes) ---
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                if (this.grid[r][c] === TILE.FLOOR) {
                    if (theme === 'desert') {
                        this.grid[r][c] = TILE.SAND;
                        if (this.rng() < 0.03) this.grid[r][c] = TILE.CACTUS;
                    } else if (theme === 'jungle') {
                        this.grid[r][c] = TILE.GRASS;
                        if (this.rng() < 0.1) this.grid[r][c] = TILE.TREE;
                    } else if (theme === 'cave') {
                        this.grid[r][c] = TILE.DIRT;
                    } else if (theme === 'snow') {
                        this.grid[r][c] = TILE.SNOW;
                        if (this.rng() < 0.05) this.grid[r][c] = TILE.ICE;
                    } else if (theme === 'arcane') {
                        this.grid[r][c] = TILE.ICE; // Glowing blue path
                    } else if (theme === 'hell') {
                        if (this.rng() < 0.08) this.grid[r][c] = TILE.LAVA;
                    } else if (theme === 'sewer') {
                        if (this.rng() < 0.05) this.grid[r][c] = TILE.SHALLOW_WATER;
                    } else if (theme === 'fortress') {
                        this.grid[r][c] = TILE.MARBLE;
                    } else if (theme === 'jail') {
                        this.grid[r][c] = TILE.RUINS;
                    } else if (theme === 'tomb') {
                        this.grid[r][c] = TILE.COBBLE;
                    }
                }
            }
        }

        const first = this.rooms[0] || { x: 5, y: 5, w: 5, h: 5 };
        this.playerStart = {
            x: (first.x + Math.floor(first.w / 2)) * this.tileSize + this.tileSize / 2,
            y: (first.y + Math.floor(first.h / 2)) * this.tileSize + this.tileSize / 2,
        };

        // Entrance Portal (from town/previous zone)
        if (placeExit) {
            const townZones = [0, 38, 68, 96, 102];
            const myAct = Math.floor(zoneLevel / 40);
            const targetTown = townZones[myAct] !== undefined ? townZones[myAct] : 0;

            this.objectSpawns.push({
                type: 'portal', x: this.playerStart.x, y: this.playerStart.y,
                icon: 'obj_dungeon_entrance', name: 'A la Ciudad',
                targetZone: targetTown
            });
        }

        this.objectSpawns.push({
            type: 'waypoint', x: this.playerStart.x + 48, y: this.playerStart.y,
            icon: 'obj_waypoint', zone: zoneLevel
        });

        if (placeExit && this.rooms.length > 0) {
            const last = this.rooms[this.rooms.length - 1];
            const ec = last.x + Math.floor(last.w / 2);
            const er = last.y + Math.floor(last.h / 2);
            this.grid[er][ec] = TILE.STAIRS_DOWN;
            this.exitPos = { x: ec * this.tileSize + this.tileSize / 2, y: er * this.tileSize + this.tileSize / 2 };
        } else {
            this.exitPos = { x: -1000, y: -1000 };
        }

        this._populate(zoneLevel, theme);
        return this;
    }

    _populate(zl, theme) {
        if (!this.rooms || this.rooms.length === 0) return;

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

                if (isBoss) {
                    const uniqueMapping = {
                        40: { name: 'Radament', icon: 'enemy_skeleton', isRadament: true, hpMult: 3.5 },
                        46: { name: 'Beetleburst', icon: 'enemy_spider', isBeetleburst: true, hpMult: 3.0 },
                        48: { name: 'Coldworm the Burrower', icon: 'enemy_spider', isColdworm: true, hpMult: 3.5 },
                        59: { name: 'The Summoner', icon: 'class_sorceress', hpMult: 6.0, dmgMult: 4.5 },
                        82: { name: 'Battlemaid Sarina', icon: 'enemy_ghost', isSarina: true, hpMult: 3.0 },
                        92: { name: 'Toorc Icefist', icon: 'enemy_skeleton', isCouncil: true, hpMult: 4.5 },
                        103: { name: 'Shenk the Overseer', icon: 'enemy_demon', isShenk: true, hpMult: 4.0 },
                        109: { name: 'Frozenstein', icon: 'enemy_demon', isFrozenstein: true, hpMult: 4.0 },
                    };
                    if (uniqueMapping[zl]) Object.assign(spawn, uniqueMapping[zl]);
                    if (zl === 98) { spawn.name = 'Izual'; spawn.icon = 'boss_izual'; spawn.isIzual = true; spawn.hpMult = 8.0; }
                    if (zl === 100) {
                        spawn.name = 'Hephaisto'; spawn.icon = 'boss_hephaisto'; spawn.isHephaisto = true; spawn.hpMult = 8.0;
                        this.objectSpawns.push({ id: 'hellforge', type: 'hellforge', name: 'The Hellforge', x: spawn.x + 60, y: spawn.y, icon: 'obj_altar' });
                    }
                    if (zl === 116 && i === this.rooms.length - 1) {
                        spawn.name = 'Talic the Defender'; spawn.icon = 'enemy_demon'; spawn.isAncient = true; spawn.hpMult = 5.0;
                        this.enemySpawns.push({ ...spawn, name: 'Madawc the Guardian', x: spawn.x + 40, isAncient: true });
                        this.enemySpawns.push({ ...spawn, name: 'Korlic the Protector', x: spawn.x - 40, isAncient: true });
                        this.objectSpawns.push({ id: 'ancients_altar', type: 'ancients_altar', name: 'Altar of the Heavens', x: spawn.x, y: spawn.y - 60, icon: 'obj_altar' });
                    }
                }
                this.enemySpawns.push(spawn);
            }

            // 2. Loot / Chests
            if (this.rng() < 0.25) {
                const cx = (room.x + Math.floor(room.w / 2)) * this.tileSize;
                const cy = (room.y + Math.floor(room.h / 2)) * this.tileSize;
                this.objectSpawns.push({ type: 'chest', x: cx, y: cy, icon: 'obj_chest' });
            }

            // 3. Shrines
            if (i > 1 && i < this.rooms.length - 1 && this.rng() < 0.15) {
                const types = ['experience', 'armor', 'combat', 'mana', 'resist', 'speed'];
                this.objectSpawns.push({
                    type: 'shrine',
                    x: (room.x + 1) * this.tileSize, y: (room.y + 1) * this.tileSize,
                    icon: 'obj_shrine', shrineType: types[Math.floor(this.rng() * types.length)]
                });
            }

            // 4. Breakables
            const bCount = 1 + Math.floor(this.rng() * 4);
            for (let b = 0; b < bCount; b++) {
                this.objectSpawns.push({
                    type: 'breakable',
                    x: (room.x + 1 + Math.floor(this.rng() * (room.w - 2))) * this.tileSize,
                    y: (room.y + 1 + Math.floor(this.rng() * (room.h - 2))) * this.tileSize,
                    icon: breakableIcon
                });
            }

            // 5. Decorative props
            if (zl <= 37 && theme === 'catacombs') {
                if (this.rng() < 0.2) this.objectSpawns.push({ type: 'decoration', x: (room.x + 2) * this.tileSize, y: (room.y + 2) * this.tileSize, icon: 'obj_sarcophagus' });
                if (this.rng() < 0.1) this.objectSpawns.push({ type: 'decoration', x: (room.x + room.w - 2) * this.tileSize, y: (room.y + 2) * this.tileSize, icon: 'obj_gargoyle' });
                // Add corner pillars for atmosphere
                if (room.w > 6 && room.h > 6) {
                    const px = (room.x + 1) * this.tileSize; const py = (room.y + 1) * this.tileSize;
                    this.objectSpawns.push({ type: 'decoration', x: px, y: py, icon: 'obj_pillar_holy' });
                }
            } else if (zl <= 67 && this.rng() < 0.15) {
                this.objectSpawns.push({ type: 'decoration', x: (room.x + Math.floor(room.w / 2)) * this.tileSize, y: (room.y + 2) * this.tileSize, icon: 'obj_pillar_holy' });
            } else if (zl <= 101 && this.rng() < 0.2) {
                this.objectSpawns.push({ type: 'decoration', x: (room.x + Math.floor(this.rng() * room.w)) * this.tileSize, y: (room.y + Math.floor(this.rng() * room.h)) * this.tileSize, icon: 'obj_cluster_soulstone' });
            }

            // General environmental clutter
            if (this.rng() < 0.3) {
                const dx = (room.x + 1 + Math.floor(this.rng() * (room.w - 2))) * this.tileSize;
                const dy = (room.y + 1 + Math.floor(this.rng() * (room.h - 2))) * this.tileSize;
                const icon = this.rng() < 0.5 ? 'obj_debris' : 'obj_barrel';
                this.objectSpawns.push({ type: 'decoration', x: dx, y: dy, icon });
            }

            if (theme === 'hell' && this.rng() < 0.2) {
                const hellProps = ['obj_cluster_soulstone', 'obj_altar_pentagram', 'obj_torch_hell'];
                this.objectSpawns.push({ type: 'decoration', x: (room.x + Math.floor(this.rng() * room.w)) * this.tileSize, y: (room.y + Math.floor(this.rng() * room.h)) * this.tileSize, icon: hellProps[Math.floor(this.rng() * hellProps.length)] });
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

        const cx = Math.floor(this.width / 2);
        const cy = Math.floor(this.height / 2);
        const radius = 15;

        for (let y = cy - radius; y <= cy + radius; y++)
            for (let x = cx - radius; x <= cx + radius; x++)
                if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2)
                    this.grid[y][x] = theme === 'catacombs' ? TILE.PATH : TILE.FLOOR;

        for (let y = cy + radius; y <= cy + radius + 10; y++)
            for (let x = cx - 2; x <= cx + 2; x++)
                this.grid[y][x] = TILE.PATH;

        this.playerStart = { x: cx * this.tileSize, y: (cy + radius + 8) * this.tileSize };

        let bossName = 'Blood Raven', bossIcon = 'enemy_ghost', hpMult = 2.0;
        let isAndariel = false, isDuriel = false, isMephisto = false, isDiablo = false, isBaal = false, isUber = false;
        if (zoneLevel === 37) { bossName = 'Andariel'; bossIcon = 'boss_andariel'; hpMult = 4.0; isAndariel = true; }
        else if (zoneLevel === 67) { bossName = 'Duriel'; bossIcon = 'boss_duriel'; hpMult = 6.0; isDuriel = true; }
        else if (zoneLevel === 95) { bossName = 'Mephisto'; bossIcon = 'boss_mephisto'; hpMult = 8.0; isMephisto = true; }
        else if (zoneLevel === 101) { bossName = 'Diablo'; bossIcon = 'boss_diablo'; hpMult = 12.0; isDiablo = true; }
        else if (zoneLevel === 125) { bossName = 'Baal'; bossIcon = 'boss_baal'; hpMult = 15.0; isBaal = true; }
        else if (zoneLevel === 127) { bossName = 'Uber Diablo'; bossIcon = 'boss_diablo'; hpMult = 30.0; isUber = true; }

        this.enemySpawns.push({
            x: cx * this.tileSize, y: cy * this.tileSize,
            type: 'boss', level: zoneLevel, name: bossName, icon: bossIcon,
            hpMult, dmgMult: 2.0 + (zoneLevel / 20),
            isAndariel, isDuriel, isMephisto, isDiablo, isBaal, isUber
        });

        this.exitPos = { x: -1000, y: -1000 };
        return this;
    }

    // ─────────────────────────────────────────────────────────────
    //  BSP / CA / CORRIDOR — unchanged
    // ─────────────────────────────────────────────────────────────
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
        let grid = Array.from({ length: this.height }, () =>
            Array.from({ length: this.width }, () => this.rng() < 0.45 ? TILE.WALL : TILE.FLOOR)
        );
        for (let i = 0; i < 5; i++) {
            let next = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    let walls = 0;
                    for (let dr = -1; dr <= 1; dr++)
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = r + dr, nc = c + dc;
                            if (nr < 0 || nr >= this.height || nc < 0 || nc >= this.width) walls++;
                            else if (grid[nr][nc] === TILE.WALL) walls++;
                        }
                    next[r][c] = walls > 4 ? TILE.WALL : TILE.FLOOR;
                }
            }
            grid = next;
        }
        for (let r = 0; r < this.height; r++) { grid[r][0] = TILE.WALL; grid[r][this.width - 1] = TILE.WALL; }
        for (let c = 0; c < this.width; c++) { grid[0][c] = TILE.WALL; grid[this.height - 1][c] = TILE.WALL; }
        this.grid = grid;
        this.rooms = [];
        const cs = 15;
        for (let r = 2; r < this.height - cs; r += cs)
            for (let c = 2; c < this.width - cs; c += cs) {
                const t = this.grid[r + 5]?.[c + 5];
                if (t === TILE.FLOOR || t === TILE.SAND || t === TILE.SNOW || t === TILE.GRASS)
                    this.rooms.push({ x: c, y: r, w: cs - 2, h: cs - 2 });
            }
        if (this.rooms.length === 0)
            this.rooms.push({ x: 5, y: 5, w: this.width - 10, h: this.height - 10 });
    }

    _carveRoom(leaf) {
        const margin = 2, maxW = leaf.w - margin * 2, maxH = leaf.h - margin * 2;
        if (maxW < 4 || maxH < 4) return null;
        const rw = 4 + Math.floor(this.rng() * (maxW - 3));
        const rh = 4 + Math.floor(this.rng() * (maxH - 3));
        const rx = leaf.x + margin + Math.floor(this.rng() * (maxW - rw + 1));
        const ry = leaf.y + margin + Math.floor(this.rng() * (maxH - rh + 1));
        for (let y = ry; y < ry + rh; y++)
            for (let x = rx; x < rx + rw; x++)
                if (y > 0 && y < this.height - 1 && x > 0 && x < this.width - 1)
                    this.grid[y][x] = TILE.FLOOR;
        return { x: rx, y: ry, w: rw, h: rh };
    }

    _corridor(roomA, roomB) {
        let cx = roomA.x + Math.floor(roomA.w / 2);
        let cy = roomA.y + Math.floor(roomA.h / 2);
        const bx = roomB.x + Math.floor(roomB.w / 2);
        const by = roomB.y + Math.floor(roomB.h / 2);
        while (cx !== bx) { this.grid[cy][cx] = TILE.FLOOR; cx += cx < bx ? 1 : -1; }
        while (cy !== by) { this.grid[cy][cx] = TILE.FLOOR; cy += cy < by ? 1 : -1; }
    }

    // ─────────────────────────────────────────────────────────────
    //  COLLISION & LOS
    // ─────────────────────────────────────────────────────────────
    isWalkable(wx, wy) {
        const c = Math.floor(wx / this.tileSize), r = Math.floor(wy / this.tileSize);
        if (r < 0 || r >= this.height || c < 0 || c >= this.width) return false;
        if (!this.grid || !this.grid[r]) return false;
        const tile = this.grid[r][c];
        return tile !== TILE.WALL && tile !== TILE.TREE && tile !== TILE.FENCE;
    }

    hasLineOfSight(x0, y0, x1, y1) {
        const c0 = Math.floor(x0 / this.tileSize), r0 = Math.floor(y0 / this.tileSize);
        const c1 = Math.floor(x1 / this.tileSize), r1 = Math.floor(y1 / this.tileSize);
        let dx = Math.abs(c1 - c0), dy = Math.abs(r1 - r0);
        let x = c0, y = r0, n = 1 + dx + dy;
        const xi = (c1 > c0) ? 1 : -1, yi = (r1 > r0) ? 1 : -1;
        let err = dx - dy; dx *= 2; dy *= 2;
        for (; n > 0; --n) {
            if (y < 0 || y >= this.height || x < 0 || x >= this.width) return false;
            const t = this.grid[y][x];
            if (t === TILE.WALL || t === TILE.TREE || t === TILE.FENCE) return false;
            if (err > 0) { x += xi; err -= dy; }
            else if (err < 0) { y += yi; err += dx; }
            else { x += xi; err -= dy; y += yi; err += dx; n--; }
        }
        return true;
    }

    // ─────────────────────────────────────────────────────────────
    //  RENDER
    // ─────────────────────────────────────────────────────────────
    render(renderer, camera) {
        const ctx = renderer.ctx; camera.apply(ctx);
        const ts = this.tileSize;
        const camLeft = Math.max(0, Math.floor(camera.x / ts));
        const camTop = Math.max(0, Math.floor(camera.y / ts));
        const camRight = Math.min(this.width, Math.ceil((camera.x + camera.w / camera.zoom) / ts) + 1);
        const camBottom = Math.min(this.height, Math.ceil((camera.y + camera.h / camera.zoom) / ts) + 1);

        const TILE_SPRITES = {
            [TILE.FLOOR]: 'env_floor', [TILE.WALL]: 'env_wall', [TILE.DOOR]: 'env_door',
            [TILE.STAIRS_DOWN]: 'obj_dungeon_entrance', [TILE.STAIRS_UP]: 'obj_dungeon_entrance',
            [TILE.GRASS]: 'env_grass', [TILE.PATH]: 'env_path', [TILE.WATER]: 'env_water',
            [TILE.TREE]: 'env_tree', [TILE.BRIDGE]: 'env_bridge', [TILE.SAND]: 'env_sand',
            [TILE.CACTUS]: 'env_cactus', [TILE.SNOW]: 'env_snow', [TILE.ICE]: 'env_ice',
            [TILE.LAVA]: 'env_lava', [TILE.COBBLE]: 'env_cobble', [TILE.FENCE]: 'env_fence',
            [TILE.RUINS]: 'env_ruins', [TILE.DIRT]: 'env_dirt', [TILE.MARBLE]: 'env_marble',
            [TILE.WOOD_FLOOR]: 'env_wood_floor', [TILE.SHALLOW_WATER]: 'env_shallow_water',
        };

        const baseColors = {
            [TILE.FLOOR]: '#1a1820', [TILE.WALL]: '#0a080c', [TILE.DOOR]: '#3a2a1a',
            [TILE.STAIRS_DOWN]: '#151525', [TILE.STAIRS_UP]: '#151525',
            [TILE.GRASS]: '#1a2e1a', [TILE.PATH]: '#2a201a', [TILE.WATER]: '#0a1a2e',
            [TILE.TREE]: '#0a1d0a', [TILE.BRIDGE]: '#2a1a10', [TILE.SAND]: '#3d2e14',
            [TILE.CACTUS]: '#1e2b12', [TILE.SNOW]: '#d0d8e8', [TILE.ICE]: '#6088aa',
            [TILE.LAVA]: '#331000', [TILE.COBBLE]: '#2a2222', [TILE.FENCE]: '#3a2810',
            [TILE.RUINS]: '#1a1212', [TILE.DIRT]: '#2a1a0a', [TILE.MARBLE]: '#8a8070',
            [TILE.WOOD_FLOOR]: '#3a2518', [TILE.SHALLOW_WATER]: '#0e2a4a',
        };

        for (let r = camTop; r < camBottom; r++) {
            for (let c = camLeft; c < camRight; c++) {
                const tile = this.grid[r][c];
                ctx.fillStyle = baseColors[tile] || '#000';
                ctx.fillRect(c * ts, r * ts, ts, ts);
                let spriteName = TILE_SPRITES[tile];

                // Dynamic biome trees
                if (tile === TILE.TREE) {
                    spriteName = 'obj_tree_oak'; // default wilderness
                    if (this.theme === 'desert') spriteName = 'obj_tree_dead';
                    else if (this.theme === 'jungle') spriteName = 'obj_tree_banyan';
                    else if (this.theme === 'snow') spriteName = 'obj_tree_snowpine';
                }

                if (spriteName) {
                    if (tile === TILE.TREE || tile === TILE.CACTUS || tile === TILE.STAIRS_DOWN)
                        renderer.drawSprite(spriteName, c * ts + ts / 2, r * ts + ts / 2, ts);
                    else
                        renderer.drawTile(spriteName, c * ts + ts / 2, r * ts + ts / 2, ts);
                }
            }
        }
        camera.reset(ctx);
    }
}
