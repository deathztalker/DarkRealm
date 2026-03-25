/**
 * Camera — Smooth follow, world↔screen transforms
 */
export class Camera {
    constructor(canvasW, canvasH) {
        this.x = 0; this.y = 0;       // world position of camera center
        this.w = canvasW; this.h = canvasH;
        this.zoom = 2;                 // pixel scale (tile size on screen)
        this.lerpSpeed = 8;
        this._target = null;
    }

    follow(entity) { this._target = entity; }

    update(dt) {
        if (!this._target) return;
        const tx = this._target.x - this.w / (2 * this.zoom);
        const ty = this._target.y - this.h / (2 * this.zoom);
        this.x += (tx - this.x) * Math.min(1, this.lerpSpeed * dt);
        this.y += (ty - this.y) * Math.min(1, this.lerpSpeed * dt);
    }

    // World coord → Canvas pixel
    toScreen(wx, wy) {
        return {
            x: (wx - this.x) * this.zoom,
            y: (wy - this.y) * this.zoom,
        };
    }

    // Canvas pixel → World coord
    toWorld(sx, sy) {
        return {
            x: sx / this.zoom + this.x,
            y: sy / this.zoom + this.y,
        };
    }

    apply(ctx) {
        ctx.setTransform(this.zoom, 0, 0, this.zoom, -this.x * this.zoom, -this.y * this.zoom);
    }

    reset(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); }
}
