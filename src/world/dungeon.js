/**
 * Dungeon Generator — Procedural ARPG World Engine
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
    }

    generate(zoneLevel = 1, theme = 'cathedral') {
        this.zoneLevel = zoneLevel;
        this.theme = theme;
        const isTown = (zoneLevel === 0 || zoneLevel === 6 || zoneLevel === 11 || zoneLevel === 16 || zoneLevel === 21);
        
        // Map themes to PixelLab tilesets (Wang Variety)
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

        // --- Standard Procedural Generation ---
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
        this.rooms = []; this.enemySpawns = []; this.lootSpawns = []; this.npcSpawns = []; this.objectSpawns = [];

        if (!['jungle', 'desert', 'snow', 'hell'].includes(theme)) {
            this._generateBSP();
        } else {
            this._generateAutomata();
        }

        this._applyThemeTiles(theme);
        this._finalizeSpawns(zoneLevel, theme);
        this._scatterDebris(theme);

        return this;
    }

    generateTown(theme, zoneLevel = 0) {
        const bgTile = theme === 'desert' ? TILE.SAND : theme === 'snow' ? TILE.SNOW : TILE.GRASS;
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(bgTile));
        this.npcSpawns = []; this.objectSpawns = []; this.enemySpawns = [];

        const cx = Math.floor(this.width / 2), cy = Math.floor(this.height / 2);

        // 1. Procedural Roads
        for (let y = 0; y < this.height; y++) for (let x = cx - 2; x <= cx + 2; x++) this.grid[y][x] = TILE.PATH;
        for (let x = 0; x < this.width; x++) for (let y = cy - 2; y <= cy + 2; y++) this.grid[y][x] = TILE.PATH;

        // 2. Helper for placement
        const place = (icon, rx, ry, type = 'decoration') => {
            this.objectSpawns.push({ type, x: (cx + rx) * 16, y: (cy + ry) * 16, icon });
        };

        // 3. Act-Specific Decoration using PixelLab Map Objects
        if (theme === 'town') { // Act 1
            place('obj_bonfire', 0, 0);
            place('obj_tent_leather', -10, -8); place('obj_tent_leather', 10, -8);
            place('obj_wagon_merchant', -12, 6);
        } else if (theme === 'desert') { // Act 2
            place('obj_fountain', 0, 0);
            place('obj_house_sandstone', -12, -10); place('obj_house_sandstone', 12, -10);
            place('obj_stall_bazaar', -8, 6); place('obj_stall_bazaar', 8, 6);
            for(let i=0; i<10; i++) place('obj_tree_palm', (Math.random()-0.5)*40, (Math.random()-0.5)*30);
        } else if (theme === 'jungle') { // Act 3
            place('obj_hut_stilt', -8, -8); place('obj_hut_stilt', 8, -8);
            for(let i=0; i<15; i++) place('obj_tree_jungle', (Math.random()-0.5)*50, (Math.random()-0.5)*40);
        } else if (theme === 'hell') { // Act 4
            place('obj_statue_angel', -6, -6); place('obj_statue_angel', 6, -6);
            place('obj_pillar_holy', -10, 4); place('obj_pillar_holy', 10, 4);
        } else if (theme === 'snow') { // Act 5
            place('obj_longhouse_stone', -15, -6);
            place('obj_anvil_hot', 8, 6);
            for(let i=0; i<12; i++) place('obj_tree_snowy_pine', (Math.random()-0.5)*60, (Math.random()-0.5)*40);
        }

        // 4. Spawn NPCs
        const spawn = (id, name, rx, ry, icon, diag) => {
            this.npcSpawns.push({ id, name, type: 'elder', x: (cx + rx) * 16, y: (cy + ry) * 16, icon, dialogue: diag });
        };
        spawn("deckard_cain", "Deckard Cain", 4, -4, "npc_deckard_cain", "Stay awhile and listen!");
        if (zoneLevel === 0) spawn("akara", "Akara", -6, -6, "npc_akara", "Greetings.");
        else if (zoneLevel === 6) spawn("drognan", "Drognan", -6, -6, "npc_drognan", "The desert hides secrets.");

        this.playerStart = { x: cx * 16, y: (cy + 4) * 16 };
        this.exitPos = { x: cx * 16, y: (this.height - 5) * 16 };
        this.grid[this.height - 5][cx] = TILE.STAIRS_DOWN;

        this.objectSpawns.push({ id: 'stash', type: 'stash', x: (cx - 5) * 16, y: cy * 16, icon: 'obj_chest' });
        this.objectSpawns.push({ id: 'waypoint', type: 'waypoint', x: cx * 16, y: cy * 16, icon: 'obj_waypoint', zone: zoneLevel });

        return this;
    }

    generateBossRoom(theme, zoneLevel = 5) {
        this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(TILE.WALL));
        const cx = Math.floor(this.width / 2), cy = Math.floor(this.height / 2), radius = 15;
        for (let y = cy - radius; y <= cy + radius; y++) {
            if (!this.grid[y]) continue;
            for (let x = cx - radius; x <= cx + radius; x++) {
                if ((x - cx)**2 + (y - cy)**2 <= radius**2) this.grid[y][x] = TILE.FLOOR;
            }
        }
        this.playerStart = { x: cx * 16, y: (cy + radius - 2) * 16 };
        let name = "Andariel", icon = "boss_andariel";
        if (zoneLevel === 10) { name = "Duriel"; icon = "boss_duriel"; }
        else if (zoneLevel === 15) { name = "Mephisto"; icon = "boss_mephisto"; }
        else if (zoneLevel === 20) { name = "Diablo"; icon = "boss_diablo"; }
        else if (zoneLevel === 25) { name = "Baal"; icon = "boss_baal"; }
        this.enemySpawns.push({ x: cx * 16, y: cy * 16, type: 'boss', level: zoneLevel, name, icon, hpMult: 10 });
        return this;
    }

    render(renderer, camera) {
        const ctx = renderer.ctx; camera.apply(ctx);
        const ts = 16;
        const camLeft = Math.max(0, Math.floor(camera.x / ts)), camTop = Math.max(0, Math.floor(camera.y / ts));
        const camRight = Math.min(this.width, Math.ceil((camera.x + camera.w/camera.zoom) / ts) + 1);
        const camBottom = Math.min(this.height, Math.ceil((camera.y + camera.h/camera.zoom) / ts) + 1);

        for (let r = camTop; r < camBottom; r++) {
            for (let c = camLeft; c < camRight; c++) {
                const tile = this.grid[r][c];
                
                // 1. Base Logic Color
                const colors = { [TILE.WALL]: '#0a0a0a', [TILE.WATER]: '#0a1a2e', [TILE.LAVA]: '#300a0a' };
                ctx.fillStyle = colors[tile] || '#1a1820';
                ctx.fillRect(c * ts, r * ts, ts, ts);

                // 2. High Quality Wang Tileset Variety
                if (this.themeTileset && tile !== TILE.WALL) {
                    const img = Assets.images[this.themeTileset];
                    if (img && img.complete) {
                        // Use a stable 4x4 coordinate-based variant selection
                        const vx = (c % 2), vy = (r % 2);
                        let sx = vx * 16, sy = vy * 16;
                        if (tile === TILE.PATH || tile === TILE.FLOOR) { sx += 32; sy += 32; }
                        ctx.drawImage(img, sx, sy, 16, 16, c * ts, r * ts, ts, ts);
                    }
                }
            }
        }
        camera.reset(ctx);
    }

    // --- Core Procedural Logic ---
    _generateBSP() {
        const root = { x: 1, y: 1, w: this.width - 2, h: this.height - 2 };
        const leaves = this._bsp(root, 0, 6);
        for (const leaf of leaves) {
            const room = this._carveRoom(leaf);
            if (room) this.rooms.push(room);
        }
        for (let i = 1; i < this.rooms.length; i++) this._corridor(this.rooms[i - 1], this.rooms[i]);
    }
    _bsp(n, d, m) {
        if (d >= m || n.w < 12 || n.h < 12) return [n];
        const h = n.h > n.w, split = 5 + Math.floor(Math.random() * ((h ? n.h : n.w) - 10));
        const l = h ? {x:n.x, y:n.y, w:n.w, h:split} : {x:n.x, y:n.y, w:split, h:n.h};
        const r = h ? {x:n.x, y:n.y+split, w:n.w, h:n.h-split} : {x:n.x+split, y:n.y, w:n.w-split, h:n.h};
        return [...this._bsp(l, d+1, m), ...this._bsp(r, d+1, m)];
    }
    _carveRoom(leaf) {
        const rw = 4+Math.floor(Math.random()*(leaf.w-5)), rh = 4+Math.floor(Math.random()*(leaf.h-5));
        const rx = leaf.x+1+Math.floor(Math.random()*(leaf.w-rw-1)), ry = leaf.y+1+Math.floor(Math.random()*(leaf.h-rh-1));
        for(let y=ry; y<ry+rh; y++) if(this.grid[y]) for(let x=rx; x<rx+rw; x++) this.grid[y][x] = TILE.FLOOR;
        return {x:rx, y:ry, w:rw, h:rh};
    }
    _corridor(a, b) {
        let cx = a.x + Math.floor(a.w/2), cy = a.y + Math.floor(a.h/2);
        const bx = b.x + Math.floor(b.w/2), by = b.y + Math.floor(b.h/2);
        while (cx !== bx) { if(this.grid[cy]) this.grid[cy][cx] = TILE.FLOOR; cx += cx < bx ? 1 : -1; }
        while (cy !== by) { if(this.grid[cy]) this.grid[cy][cx] = TILE.FLOOR; cy += cy < by ? 1 : -1; }
    }
    _generateAutomata() {
        for(let r=0; r<this.height; r++) for(let c=0; c<this.width; c++) this.grid[r][c]=Math.random()<0.45?TILE.WALL:TILE.FLOOR;
        for(let p=0; p<5; p++) {
            const n = this.grid.map(a=>[...a]);
            for(let r=1; r<this.height-1; r++) for(let c=1; c<this.width-1; c++) {
                let w=0; for(let yy=-1; yy<=1; yy++) for(let xx=-1; xx<=1; xx++) if(this.grid[r+yy][c+xx]===TILE.WALL) w++;
                n[r][c] = w>=5?TILE.WALL:TILE.FLOOR;
            }
            this.grid=n;
        }
        this.rooms=[{x:5,y:5,w:5,h:5},{x:this.width-10,y:this.height-10,w:5,h:5}];
    }
    _applyThemeTiles(theme) {
        for(let r=0; r<this.height; r++) for(let c=0; c<this.width; c++) if(this.grid[r][c]===TILE.FLOOR) {
            if(theme==='desert') this.grid[r][c]=TILE.SAND; else if(theme==='jungle') this.grid[r][c]=TILE.GRASS;
            else if(theme==='snow') this.grid[r][c]=TILE.SNOW; else if(theme==='hell') this.grid[r][c]=Math.random()<0.1?TILE.LAVA:TILE.FLOOR;
        }
    }
    _finalizeSpawns(zl, theme) {
        if (!this.rooms || this.rooms.length === 0) return;
        const first = this.rooms[0], last = this.rooms[this.rooms.length-1];
        this.playerStart = { x: (first.x + Math.floor(first.w/2)) * 16, y: (first.y + Math.floor(first.h/2)) * 16 };
        this.exitPos = { x: (last.x + Math.floor(last.w/2)) * 16, y: (last.y + Math.floor(last.h/2)) * 16 };
        if (this.grid[Math.floor(this.exitPos.y/16)]) this.grid[Math.floor(this.exitPos.y/16)][Math.floor(this.exitPos.x/16)] = TILE.STAIRS_DOWN;
        
        this.rooms.forEach((r, i) => {
            if (i === 0) return;
            const isLast = i === this.rooms.length - 1;
            this.enemySpawns.push({
                x: (r.x + Math.floor(r.w/2)) * 16, y: (r.y + Math.floor(r.h/2)) * 16,
                type: isLast ? 'boss' : 'normal', level: zl,
                name: isLast ? (zl === 7 ? "Radament" : zl === 22 ? "Shenk" : "Champion") : "Minion",
                icon: isLast ? (zl === 7 ? "boss_radament" : zl === 22 ? "boss_shenk" : "enemy_skeleton") : "enemy_skeleton"
            });
        });
    }
    _scatterDebris(t) {
        for(let i=0; i<50; i++) {
            const x=Math.floor(Math.random()*this.width), y=Math.floor(Math.random()*this.height);
            if(this.grid[y] && (this.grid[y][x]===TILE.FLOOR||this.grid[y][x]===TILE.PATH)) this.debris.push({x:x*16,y:y*16,icon:'item_skull',rot:Math.random()*6});
        }
    }
    isWalkable(x, y) {
        const c=Math.floor(x/16), r=Math.floor(y/16);
        return this.grid[r] && this.grid[r][c]!==TILE.WALL && this.grid[r][c]!==TILE.WATER;
    }
}
