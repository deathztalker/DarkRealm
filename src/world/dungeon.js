/**
 * Dungeon Generator — BSP room-corridor procedural generation
 */

export const TILE = { FLOOR: 0, WALL: 1, DOOR: 2, STAIRS_DOWN: 3, STAIRS_UP: 4, SPAWN: 5, GRASS: 6, PATH: 7, WATER: 8, TREE: 9, BRIDGE: 10 };
const TILE_ICONS = { 0: '·', 1: '█', 2: '+', 3: '▼', 4: '▲' };

export const TILE_COLORS = {
    [TILE.FLOOR]: '#2c2838', [TILE.WALL]: '#161320', [TILE.DOOR]: '#5a3a20',
    [TILE.STAIRS_DOWN]: '#3a2a4a', [TILE.STAIRS_UP]: '#2a1a3a',
    [TILE.GRASS]: '#2d5a27', [TILE.PATH]: '#5c4a3d', [TILE.WATER]: '#1e4b85',
    [TILE.TREE]: '#1b4018', [TILE.BRIDGE]: '#503525'
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
        this.playerStart = { x: 0, y: 0 };
        this.exitPos = { x: 0, y: 0 };
    }

    generate(zoneLevel = 1, theme = 'cathedral') {
        if (zoneLevel === 0) return this.generateTown();
        if (zoneLevel === 5 || (zoneLevel > 7 && zoneLevel % 5 === 0)) return this.generateBossRoom(theme, zoneLevel);

        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
        this.rooms = [];
        this.enemySpawns = [];
        this.lootSpawns = [];

        // BSP split
        const root = { x: 1, y: 1, w: this.width - 2, h: this.height - 2 };
        const leaves = this._bsp(root, 0, 6);

        // Carve rooms in leaves
        for (const leaf of leaves) {
            const room = this._carveRoom(leaf);
            if (room) this.rooms.push(room);
        }

        // Connect rooms with corridors
        for (let i = 1; i < this.rooms.length; i++) {
            this._corridor(this.rooms[i - 1], this.rooms[i]);
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
                this.enemySpawns.push({
                    x: sx * this.tileSize + this.tileSize / 2,
                    y: sy * this.tileSize + this.tileSize / 2,
                    type: isBoss ? 'boss' : isElite ? 'elite' : 'normal',
                    level: zoneLevel,
                });
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
        }

        return this;
    }

    generateTown() {
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.GRASS));
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

        // Trees border
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (x < 3 || x > this.width - 4 || y < 3 || y > this.height - 4) {
                    if (Math.random() < 0.6) this.grid[y][x] = TILE.TREE;
                }
                else if (this.grid[y][x] === TILE.GRASS && Math.random() < 0.05) {
                    this.grid[y][x] = TILE.TREE;
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

        // Spawn NPCs
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
            dialogue: "I know the roads well. Tell me where you wish to go."
        });

        this.npcSpawns.push({
            id: "larzuk",
            name: "Larzuk the Blacksmith",
            type: "blacksmith",
            x: (cx - 9) * this.tileSize,
            y: (cy - 1) * this.tileSize,
            icon: "npc_villager",
            dialogue: "I can punch a hole in that for you... for the right price."
        });

        // Town Objects: Stash & Cube
        this.objectSpawns.push({ 
            id: 'stash',
            type: 'stash', 
            name: 'Alijo (Stash)',
            x: (cx - 6) * this.tileSize, 
            y: cy * this.tileSize, 
            icon: 'obj_chest' 
        });

        this.objectSpawns.push({ 
            id: 'cube',
            type: 'cube', 
            name: 'Cubo Horádrico',
            x: (cx - 6) * this.tileSize, 
            y: (cy + 2) * this.tileSize, 
            icon: 'obj_chest' 
        });

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

        // Boss Spawn in center
        this.enemySpawns.push({
            x: cx * this.tileSize,
            y: cy * this.tileSize,
            type: 'boss',
            level: zoneLevel,
        });

        // The exit is unreachable until the boss dies (handled in main.js)
        this.exitPos = { x: -1000, y: -1000 };

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

    isWalkable(wx, wy) {
        const col = Math.floor(wx / this.tileSize);
        const row = Math.floor(wy / this.tileSize);
        if (row < 0 || row >= this.height || col < 0 || col >= this.width) return false;
        const t = this.grid[row][col];
        return t !== TILE.WALL && t !== TILE.WATER && t !== TILE.TREE;
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
            [TILE.TREE]: 'env_tree', [TILE.BRIDGE]: 'env_bridge'
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
                    [TILE.TREE]: '#0a1d0a', [TILE.BRIDGE]: '#2a1a10'
                };
                ctx.fillStyle = baseColors[tile] || '#000';
                ctx.fillRect(c * ts, r * ts, ts, ts);

                // Draw tile sprite
                if (spriteName) {
                    if (tile === TILE.TREE) {
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

    /** Check if a world-space position is on a walkable tile */
    isWalkable(wx, wy) {
        const c = Math.floor(wx / this.tileSize);
        const r = Math.floor(wy / this.tileSize);
        if (r < 0 || r >= this.height || c < 0 || c >= this.width) return false;
        const tile = this.grid[r][c];
        // Walkable tiles: floor, door, stairs, spawn, grass, path, bridge
        return tile !== TILE.WALL && tile !== TILE.WATER && tile !== TILE.TREE;
    }
}


