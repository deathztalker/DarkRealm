/**
 * Pathfinding — A* grid-based, smooth path output
 */
export class Pathfinder {
    find(grid, startX, startY, endX, endY, tileSize) {
        const cols = grid[0].length, rows = grid.length;
        const sc = Math.floor(startX / tileSize), sr = Math.floor(startY / tileSize);
        const ec = Math.floor(endX / tileSize), er = Math.floor(endY / tileSize);

        if (!this._walkable(grid, ec, er, cols, rows)) return [];

        const open = new MinHeap();
        const closed = new Set();
        const node = (c, r, g, h, parent) => ({ c, r, g, h, f: g + h, parent });
        const h = (c, r) => Math.abs(c - ec) + Math.abs(r - er);
        const key = (c, r) => `${c},${r}`;

        open.push(node(sc, sr, 0, h(sc, sr), null));
        const best = {};
        best[key(sc, sr)] = 0;

        while (open.size) {
            const curr = open.pop();
            const k = key(curr.c, curr.r);
            if (closed.has(k)) continue;
            closed.add(k);

            if (curr.c === ec && curr.r === er) {
                return this._reconstruct(curr, tileSize);
            }

            for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
                const nc = curr.c + dc, nr = curr.r + dr;
                if (!this._walkable(grid, nc, nr, cols, rows)) continue;
                const diag = dc !== 0 && dr !== 0;
                const ng = curr.g + (diag ? 1.4 : 1);
                const nk = key(nc, nr);
                if (ng >= (best[nk] ?? Infinity)) continue;
                best[nk] = ng;
                open.push(node(nc, nr, ng, h(nc, nr), curr));
            }
        }
        return [];
    }

    _walkable(grid, c, r, cols, rows) {
        if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
        return grid[r][c] !== 1; // 1 = wall
    }

    _reconstruct(node, ts) {
        const path = [];
        let n = node;
        while (n) {
            path.unshift({ x: n.c * ts + ts / 2, y: n.r * ts + ts / 2 });
            n = n.parent;
        }
        // Smooth: remove collinear points
        return this._smooth(path);
    }

    _smooth(path) {
        if (path.length < 3) return path;
        const out = [path[0]];
        for (let i = 1; i < path.length - 1; i++) {
            const prev = out[out.length - 1], curr = path[i], next = path[i + 1];
            const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
            const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
            if (Math.abs(dx1 * dy2 - dy1 * dx2) > 0.01) out.push(curr);
        }
        out.push(path[path.length - 1]);
        return out;
    }
}

class MinHeap {
    constructor() { this.data = []; }
    get size() { return this.data.length; }
    push(n) {
        this.data.push(n);
        this._up(this.data.length - 1);
    }
    pop() {
        const top = this.data[0];
        const last = this.data.pop();
        if (this.data.length) { this.data[0] = last; this._down(0); }
        return top;
    }
    _up(i) {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (this.data[p].f <= this.data[i].f) break;
            [this.data[p], this.data[i]] = [this.data[i], this.data[p]];
            i = p;
        }
    }
    _down(i) {
        const n = this.data.length;
        while (true) {
            let m = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && this.data[l].f < this.data[m].f) m = l;
            if (r < n && this.data[r].f < this.data[m].f) m = r;
            if (m === i) break;
            [this.data[m], this.data[i]] = [this.data[i], this.data[m]];
            i = m;
        }
    }
}
