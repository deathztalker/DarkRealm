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
        // Safe get with fallback to avoid 404/Null breaks
        if (this.images[name]) return this.images[name];
        
        // Portrait fallbacks
        if (name && name.startsWith('npc_portrait_')) {
            return this.images['npc_female'] || this.images['npc_merchant'];
        }
        
        // Default generic fallbacks
        return this.images['class_warrior'] || this.images['npc_female'];
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
        const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        if (isMobile) {
            const isLandscape = window.innerWidth > window.innerHeight;
            const scale = 1.0;
            this.canvas.width = Math.floor(window.innerWidth / scale);
            this.canvas.height = Math.floor(window.innerHeight / scale);
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    get width() { return this.canvas.width; }
    get height() { return this.canvas.height; }

    clear() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    applyLighting(sx, sy, radius, ambientColor = 'rgba(0,0,0,0.85)') {
        const ctx = this.ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const grad = ctx.createRadialGradient(sx, sy, radius * 0.2, sx, sy, radius);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, ambientColor);
        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }

    fillRect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
    }

    fillCircle(x, y, r, color, alpha = 1) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    strokeCircle(x, y, r, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.stroke();
    }

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

    drawBar(x, y, w, h, ratio, fgColor, bgColor = '#1a1a1a') {
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(x, y, w, h);
        this.ctx.fillStyle = fgColor;
        this.ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), h);
    }

    drawShadow(x, y, radius, alpha = 0.5) {
        const ctx = this.ctx;
        ctx.save();
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, `rgba(0,0,0,${alpha})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x, y, radius, radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawSprite(spriteName, x, y, size, animate = false, time = 0, filter = null) {
        const img = Assets.get(spriteName);
        let drawY = y;
        this.drawShadow(x, y + size * 0.4, size * 0.6);
        if (animate) drawY += Math.sin(time * 0.005) * 2;
        if (img && img.complete && img.naturalWidth > 0) {
            if (filter) this.ctx.filter = filter;
            const drawSize = size * 2;
            
            this.ctx.save();
            // Critical for items and objects to remain crisp pixel art
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.drawImage(img, x - drawSize / 2, (drawY - 4) - drawSize / 2, drawSize, drawSize);
            this.ctx.restore();
            
            if (filter) this.ctx.filter = 'none';
        } else {
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.fillRect(x - size / 2, drawY - size / 2, size, size);
        }
    }

    drawVFX(type, x, y, size, time) {
        const ctx = this.ctx;
        ctx.save();
        if (type === 'lightning') {
            ctx.strokeStyle = '#80d0ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#0080ff';
            ctx.shadowBlur = 10;
            ctx.globalCompositeOperation = 'screen';
            ctx.beginPath();
            let curX = x;
            let curY = y - size * 2;
            ctx.moveTo(curX, curY);
            for (let i = 0; i < 5; i++) {
                curX += (Math.random() - 0.5) * 20;
                curY += size * 0.4;
                ctx.lineTo(curX, curY);
            }
            ctx.stroke();
        } else if (type === 'aura_shadow') {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5);
            grad.addColorStop(0, 'rgba(40, 0, 80, 0.4)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.globalCompositeOperation = 'multiply';
            ctx.beginPath();
            ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawTile(name, x, y, size) {
        const img = Assets.get(name);
        if (!img || !img.complete || img.naturalWidth === 0) return;
        const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const jitterX = (seed % 1) * 1.0;
        const jitterY = ((seed * 10) % 1) * 1.0;
        this.ctx.drawImage(img, x + jitterX - size / 2, y + jitterY - size / 2, size, size);
    }

    drawAnim(spriteName, x, y, size, state, dir, time, filter = null, equipment = null, hitFlash = 0) {
        const img = Assets.get(spriteName);
        if (!img || !img.complete || img.naturalWidth === 0) return;

        if (img.width === img.height || img.width <= 64) {
            this.drawSprite(spriteName, x, y, size, state === 'idle', time, filter);
            return;
        }

        const sw = img.width / 7;
        const sh = img.height / 16;
        const dirMap = { 'up': 0, 'left': 1, 'down': 2, 'right': 3 };
        const dIdx = dirMap[dir] !== undefined ? dirMap[dir] : 2;

        let row = dIdx;
        if (state === 'walk') row = 8 + dIdx;
        if (state === 'attack') row = 12 + dIdx;

        const frameCount = 6;
        const animSpeed = state === 'attack' ? 0.015 : 0.008;
        const col = Math.floor(time * animSpeed) % frameCount;

        const sx = col * sw;
        const sy = row * sh;

        // Dynamic scaling: preserves aspect ratio perfectly
        // "size" represents the game logic radius (e.g. 26 for heroes, 36 for bosses)
        // We use it as a multiplier so bosses look massive and heroes look normal.
        const scale = size / 22; 
        const drawW = sw * scale;
        const drawH = sh * scale;

        this.ctx.save();
        
        // Critical for crisp pixel art
        this.ctx.imageSmoothingEnabled = false;

        if (filter) this.ctx.filter = filter;
        if (hitFlash > 0) this.ctx.filter = (filter || '') + ' brightness(5)';
        
        // Shadow sized based on drawing width
        this.drawShadow(x, y + drawH * 0.3, drawW * 0.35);
        
        // Draw perfectly scaled native resolution frame
        this.ctx.drawImage(img, sx, sy, sw, sh, x - drawW / 2, y - drawH * 0.6, drawW, drawH);
        this.ctx.restore();
    }
}
