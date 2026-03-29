/**
 * Renderer — Canvas 2D layer manager & Asset Loader
 */

export const Assets = {
    images: {},
    load: function (name, path) {
        if (this.images[name]) return;
        const img = new Image();
        img.src = path;
        this.images[name] = img;
    },
    get: function (name) {
        return this.images[name];
    }
};

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    get width() { return this.canvas.width; }
    get height() { return this.canvas.height; }

    clear() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    // Draw a filled rectangle in world space (camera must be applied already)
    fillRect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
    }

    // Draw a circle
    fillCircle(x, y, r, color, alpha = 1) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    // Stroke circle
    strokeCircle(x, y, r, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    // Text (screen space, camera reset outside)
    text(str, x, y, opts = {}) {
        const { size = 14, color = '#fff', font = 'Cinzel', align = 'left', shadow = true } = opts;
        this.ctx.font = `${size}px ${font}, serif`;
        this.ctx.textAlign = align;
        if (shadow) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillText(str, x + 1, y + 1);
        }
        this.ctx.fillStyle = color;
        this.ctx.fillText(str, x, y);
    }

    // Draw health/resource bar above entity
    drawBar(x, y, w, h, ratio, fgColor, bgColor = '#1a1a1a') {
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(x, y, w, h);
        this.ctx.fillStyle = fgColor;
        this.ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), h);
    }

    // Draw Image Sprite
    drawSprite(spriteName, x, y, size, animate = false, time = 0, filter = null) {
        const img = Assets.get(spriteName);
        let drawY = y;

        if (animate) {
            drawY += Math.sin(time * 0.005) * 2;
        }

        if (img && img.complete) {
            if (filter) this.ctx.filter = filter;
            const drawSize = size * 2;
            this.ctx.drawImage(img, x - drawSize / 2, (drawY - 4) - drawSize / 2, drawSize, drawSize);
            if (filter) this.ctx.filter = 'none';
        } else {
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.fillRect(x - size / 2, drawY - size / 2, size, size);
        }
    }

    /** Draw a tile (exactly at tile size, for backgrounds) */
    drawTile(spriteName, x, y, size) {
        const img = Assets.get(spriteName);
        if (img && img.complete) {
            this.ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
        }
    }

    // Draw frame from Spritesheet
    drawAnim(spriteName, x, y, size, state, dir, time, filter = null, equipment = null) {
        const img = Assets.get(spriteName);
        if (!img || !img.complete || img.width <= 64 || img.width === img.height) {
            this.drawSprite(spriteName, x, y, size, state === 'walk', time, filter);
            
            // Dynamic Equipment Layering (Paperdoll System)
            if (equipment) {
                // Bobbing handled natively by drawSprite, so we just layer passing the animate flags
                const anim = state === 'walk';
                if (equipment.chest) this.drawSprite(equipment.chest.icon, x, y, size, anim, time);
                if (equipment.head) this.drawSprite(equipment.head.icon, x, y - 6, size * 0.9, anim, time);
                
                // Weapon offsets simulation
                if (equipment.mainhand) {
                    this.drawSprite(equipment.mainhand.icon, x + 8, y + 2, size * 0.8, anim, time);
                }
                if (equipment.offhand) {
                    this.drawSprite(equipment.offhand.icon, x - 8, y + 2, size * 0.8, anim, time);
                }
            }
            return;
        }

        let rowBase = 8; // walk
        let maxFrames = 9;

        if (state === 'attack') {
            rowBase = 12;
            maxFrames = 6;
        } else if (state === 'cast') {
            rowBase = 0;
            maxFrames = 7;
        } else if (state === 'idle') {
            rowBase = 8;
            maxFrames = 1;
        }

        const dirOffset = dir === 'up' ? 0 : dir === 'left' ? 1 : dir === 'down' ? 2 : 3;
        const row = rowBase + dirOffset;
        const frameSpeed = state === 'walk' ? 100 : 60;
        const frame = state === 'idle' ? 0 : Math.floor(time / frameSpeed) % maxFrames;

        const sw = 64, sh = 64; 
        const sx = frame * sw;
        const sy = row * sh;

        if (filter) this.ctx.filter = filter;
        this.ctx.drawImage(img, sx, sy, sw, sh, x - size, y - size * 1.5, size * 2, size * 2);
        if (filter) this.ctx.filter = 'none';
    }
}
