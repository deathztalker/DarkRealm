/**
 * Dungeon Generator — BSP room-corridor procedural generation
 */
import { Assets } from '../engine/renderer.js';

export const TILE = { FLOOR: 0, WALL: 1, DOOR: 2, STAIRS_DOWN: 3, STAIRS_UP: 4, SPAWN: 5, GRASS: 6, PATH: 7, WATER: 8, TREE: 9, BRIDGE: 10, SAND: 11, CACTUS: 12, LAVA: 13, SNOW: 14, ICE: 15 };

export class Dungeon {
    constructor(width = 80, height = 60, tileSize = 16) {
        this.width = width; this.height = height; this.tileSize = tileSize;
        this.grid = [];
        this.rooms = [];
        this.enemySpawns = [];
        this.lootSpawns = [];
        this.npcSpawns = [];
        this.objectSpawns = [];
        this.debris = [];
        this.playerStart = { x: 0, y: 0 };
        this.exitPos = { x: 0, y: 0 };
        this.themeTileset = null;
        this.masterLayouts = [];
    }

    generate(zoneLevel = 1, theme = 'cathedral') {
        this.zoneLevel = zoneLevel;
        this.theme = theme;
        const isTown = (zoneLevel === 0 || zoneLevel === 6 || zoneLevel === 11 || zoneLevel === 16 || zoneLevel === 21);
        
        const tilesetMap = {
            'cathedral': 'tileset_act1_wilderness',
            'desert': isTown ? 'tileset_act2_town' : 'tileset_act2_desert',
            'jungle': isTown ? 'tileset_act3_town' : 'tileset_act3_jungle',
            'hell': isTown ? 'tileset_act4_town' : 'tileset_act4_hell',
            'snow': isTown ? 'tileset_act5_town' : 'tileset_act5_snow',
            'town': 'tileset_act1_town'
        };
        this.themeTileset = tilesetMap[theme] || 'tileset_act1_wilderness';

        if (isTown) return this.generateTown(theme, zoneLevel);
        if (zoneLevel === 5 || (zoneLevel > 7 && zoneLevel % 5 === 0)) return this.generateBossRoom(theme, zoneLevel);

        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
        
        if (!['jungle', 'desert', 'snow', 'hell'].includes(theme)) {
            const root = { x: 1, y: 1, w: this.width - 2, h: this.height - 2 };
            const leaves = this._bsp(root, 0, 6);
            for (const leaf of leaves) {
                const room = this._carveRoom(leaf);
                if (room) this.rooms.push(room);
            }
            for (let i = 1; i < this.rooms.length; i++) this._corridor(this.rooms[i - 1], this.rooms[i]);
        } else {
            this._generateAutomata();
        }

        this._applyThemeTiles(theme);
        this._setupSpawns(zoneLevel, theme);
        this._scatterDebris(theme);

        return this;
    }

    generateTown(theme, zoneLevel = 0) {
        const bgTile = theme === 'desert' ? TILE.SAND : theme === 'snow' ? TILE.SNOW : TILE.GRASS;
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(bgTile));
        this.npcSpawns = [];
        this.objectSpawns = [];

        const layoutMap = {
            'town': [
                { icon: 'map_act1_layout', dx: -200, dy: -200 },
                { icon: 'map_act1_layout_north', dx: -200, dy: -600 }
            ],
            'desert': [
                { icon: 'map_act2_layout', dx: -200, dy: -200 },
                { icon: 'map_act2_layout_harbor', dx: 200, dy: -200 }
            ],
            'jungle': [
                { icon: 'map_act3_layout', dx: -200, dy: -200 },
                { icon: 'map_act3_layout_temple', dx: -200, dy: -600 }
            ],
            'hell': [
                { icon: 'map_act4_layout', dx: -200, dy: -200 },
                { icon: 'map_act4_layout_overlook', dx: -200, dy: 200 }
            ],
            'snow': [
                { icon: 'map_act5_layout', dx: -200, dy: -200 },
                { icon: 'map_act5_layout_gate', dx: -200, dy: -600 }
            ]
        };
        this.masterLayouts = layoutMap[theme] || [];

        const cx = Math.floor(this.width / 2);
        const cy = Math.floor(this.height / 2);

        this.masterLayouts.forEach(layout => {
            const gx = cx + Math.floor(layout.dx / 16);
            const gy = cy + Math.floor(layout.dy / 16);
            for(let y = gy; y < gy + 25; y++) {
                for(let x = gx; x < gx + 25; x++) {
                    if (this.grid[y] && this.grid[y][x] !== undefined) this.grid[y][x] = TILE.PATH;
                }
            }
        });

        const addColl = (gx, gy, gw, gh) => {
            for(let y = gy; y < gy + gh; y++) {
                for(let x = gx; x < gx + gw; x++) {
                    if (this.grid[y]) this.grid[y][x] = TILE.WALL;
                }
            }
        };

        if (theme === 'town') {
            addColl(cx - 10, cy - 10, 4, 4); addColl(cx + 6, cy - 10, 4, 4); addColl(cx - 12, cy - 35, 24, 3);
        } else if (theme === 'desert') {
            addColl(cx - 2, cy - 2, 4, 4); addColl(cx - 10, cy - 12, 20, 6);
        } else if (theme === 'jungle') {
            addColl(cx - 8, cy + 12, 16, 5);
        } else if (theme === 'hell') {
            addColl(cx - 2, cy - 12, 4, 8);
        } else if (theme === 'snow') {
            addColl(cx - 12, cy - 12, 24, 5);
        }

        const spawnNPC = (id, name, type, rx, ry, icon, diag) => {
            this.npcSpawns.push({ id, name, type, x: (cx + rx) * 16, y: (cy + ry) * 16, icon, dialogue: diag });
        };

        spawnNPC("deckard_cain", "Deckard Cain", "elder", 6, -4, "npc_deckard_cain", "Stay awhile and listen!");
        
        if (zoneLevel === 0) {
            spawnNPC("akara", "Akara", "elder", -8, -6, "npc_akara", "I am Akara.");
            spawnNPC("kashya", "Kashya", "mercenary_hire", -10, 4, "npc_female", "My rogues await.");
            spawnNPC("charsi", "Charsi", "merchant", 10, -3, "npc_female", "Need a fix?");
            spawnNPC("warriv", "Warriv", "waypoint", 2, 8, "npc_merchant", "The East awaits.");
        } else if (zoneLevel === 6) {
            spawnNPC("drognan", "Drognan", "merchant", -8, -8, "npc_drognan", "The desert is vast.");
            spawnNPC("jerhyn", "Jerhyn", "elder", 0, -10, "npc_elder", "Welcome to Lut Gholein.");
            spawnNPC("meshif", "Meshif", "waypoint", 20, 4, "npc_merchant", "Ready to sail?");
        } else if (zoneLevel === 11) {
            spawnNPC("ormus", "Ormus", "merchant", 8, -6, "npc_ormus", "Ormus speaks, you listen.");
        } else if (zoneLevel === 16) {
            spawnNPC("tyrael", "Tyrael", "elder", -6, -4, "npc_tyrael", "The end is near.");
        } else if (zoneLevel === 21) {
            spawnNPC("larzuk", "Larzuk", "blacksmith", -12, 4, "npc_larzuk", "Hammer time.");
        }

        this.playerStart = { x: cx * 16, y: (cy + 6) * 16 };
        this.exitPos = { x: cx * 16, y: (cy - 35) * 16 };
        this.grid[cy - 35][cx] = TILE.STAIRS_DOWN;

        this.objectSpawns.push({ id: 'waypoint', type: 'waypoint', x: cx * 16, y: cy * 16, icon: 'obj_waypoint', zone: zoneLevel });
        this.objectSpawns.push({ id: 'stash', type: 'stash', name: 'Stash', x: (cx - 7) * 16, y: (cy + 2) * 16, icon: 'obj_chest' });

        return this;
    }

    render(renderer, camera) {
        const ctx = renderer.ctx;
        camera.apply(ctx);
        const ts = 16;
        const camLeft = Math.max(0, Math.floor(camera.x / ts));
        const camTop = Math.max(0, Math.floor(camera.y / ts));
        const camRight = Math.min(this.width, Math.ceil((camera.x + camera.w/camera.zoom) / ts) + 1);
        const camBottom = Math.min(this.height, Math.ceil((camera.y + camera.h/camera.zoom) / ts) + 1);

        for (let r = camTop; r < camBottom; r++) {
            for (let c = camLeft; c < camRight; c++) {
                const tile = this.grid[r][c];
                
                // Draw Base Terrain via Wang Tileset
                if (this.themeTileset) {
                    const img = Assets.images[this.themeTileset];
                    if (img && img.complete) {
                        let sx = (c % 2) * 16, sy = (r % 2) * 16;
                        if (tile === TILE.PATH || tile === TILE.FLOOR) { sx += 32; sy += 32; }
                        ctx.drawImage(img, sx, sy, 16, 16, c * ts, r * ts, ts, ts);
                    }
                }
                
                if (tile === TILE.WALL) {
                    ctx.fillStyle = '#0a0a0a';
                    ctx.fillRect(c * ts, r * ts, ts, ts);
                }
            }
        }

        // Render Multi-Chunk Master Layouts
        if (this.masterLayouts.length > 0) {
            const wcx = (this.width / 2) * ts, wcy = (this.height / 2) * ts;
            this.masterLayouts.forEach(l => {
                const img = Assets.images[l.icon];
                if (img && img.complete) ctx.drawImage(img, wcx + l.dx, wcy + l.dy);
            });
        }
        camera.reset(ctx);
    }

    generateBossRoom(theme, zoneLevel = 5) {
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
        this.npcSpawns = []; this.objectSpawns = []; this.enemySpawns = [];
        
        const cx = Math.floor(this.width / 2), cy = Math.floor(this.height / 2), radius = 15;
        for (let y = cy - radius; y <= cy + radius; y++) {
            for (let x = cx - radius; x <= cx + radius; x++) {
                if ((x - cx)**2 + (y - cy)**2 <= radius**2) this.grid[y][x] = TILE.FLOOR;
            }
        }
        
        this.playerStart = { x: cx * 16, y: (cy + radius - 2) * 16 };
        let bossName = "Andariel", bossIcon = "boss_andariel";
        if (zoneLevel === 10) { bossName = "Duriel"; bossIcon = "boss_duriel"; }
        else if (zoneLevel === 15) { bossName = "Mephisto"; bossIcon = "boss_mephisto"; }
        else if (zoneLevel === 20) { bossName = "Diablo"; bossIcon = "boss_diablo"; }
        else if (zoneLevel === 25) { bossName = "Baal"; bossIcon = "boss_baal"; }

        this.enemySpawns.push({ x: cx * 16, y: cy * 16, type: 'boss', level: zoneLevel, name: bossName, icon: bossIcon, hpMult: 5 + (zoneLevel/5) });
        return this;
    }

    _bsp(n, d, m) {
        if (d >= m || n.w < 12 || n.h < 12) return [n];
        const h = n.h > n.w;
        const split = 5 + Math.floor(Math.random() * ((h ? n.h : n.w) - 10));
        const l = h ? {x:n.x, y:n.y, w:n.w, h:split} : {x:n.x, y:n.y, w:split, h:n.h};
        const r = h ? {x:n.x, y:n.y+split, w:n.w, h:n.h-split} : {x:n.x+split, y:n.y, w:n.w-split, h:n.h};
        return [...this._bsp(l, d+1, m), ...this._bsp(r, d+1, m)];
    }

    _carveRoom(leaf) {
        const rw = 4 + Math.floor(Math.random() * (leaf.w - 5)), rh = 4 + Math.floor(Math.random() * (leaf.h - 5));
        const rx = leaf.x + 1 + Math.floor(Math.random() * (leaf.w - rw - 1)), ry = leaf.y + 1 + Math.floor(Math.random() * (leaf.h - rh - 1));
        for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) this.grid[y][x] = TILE.FLOOR;
        return { x: rx, y: ry, w: rw, h: rh };
    }

    _corridor(a, b) {
        let cx = a.x + Math.floor(a.w/2), cy = a.y + Math.floor(a.h/2);
        const bx = b.x + Math.floor(b.w/2), by = b.y + Math.floor(b.h/2);
        while (cx !== bx) { this.grid[cy][cx] = TILE.FLOOR; cx += cx < bx ? 1 : -1; }
        while (cy !== by) { this.grid[cy][cx] = TILE.FLOOR; cy += cy < by ? 1 : -1; }
    }

    _applyThemeTiles(theme) {
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                if (this.grid[r][c] === TILE.FLOOR) {
                    if (theme === 'desert') this.grid[r][c] = TILE.SAND;
                    else if (theme === 'jungle') this.grid[r][c] = TILE.GRASS;
                    else if (theme === 'snow') this.grid[r][c] = TILE.SNOW;
                    else if (theme === 'hell') this.grid[r][c] = Math.random() < 0.1 ? TILE.LAVA : TILE.FLOOR;
                }
            }
        }
    }

    _setupSpawns(zl, theme) {
        const last = this.rooms[this.rooms.length-1];
        this.playerStart = { x: (this.rooms[0].x+2)*16, y: (this.rooms[0].y+2)*16 };
        this.exitPos = { x: (last.x+2)*16, y: (last.y+2)*16 };
        this.grid[last.y+2][last.x+2] = TILE.STAIRS_DOWN;

        for (let i = 1; i < this.rooms.length; i++) {
            const r = this.rooms[i];
            const isLast = i === this.rooms.length - 1;
            this.enemySpawns.push({
                x: (r.x + Math.floor(r.w/2)) * 16,
                y: (r.y + Math.floor(r.h/2)) * 16,
                type: isLast ? 'boss' : 'normal',
                level: zl,
                name: isLast ? "Unique Boss" : "Minion"
            });
        }
    }

    _scatterDebris(theme) {
        for (let i = 0; i < 50; i++) {
            const x = Math.floor(Math.random() * this.width), y = Math.floor(Math.random() * this.height);
            if (this.grid[y][x] === TILE.FLOOR || this.grid[y][x] === TILE.PATH) {
                this.debris.push({ x: x*16, y: y*16, icon: 'item_skull', rot: Math.random()*6 });
            }
        }
    }

    isWalkable(x, y) {
        const c = Math.floor(x / 16), r = Math.floor(y / 16);
        return this.grid[r] && this.grid[r][c] !== TILE.WALL && this.grid[r][c] !== TILE.WATER;
    }
}
