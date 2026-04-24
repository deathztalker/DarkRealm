/**
 * Renderer — Canvas 2D layer manager & Asset Loader
 */

export const Assets = {
    images: {},
    _loadPromises: [],
    
    load: function (name, path) {
        if (this.images[name]) return Promise.resolve(this.images[name]);
        
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.src = path;
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn(`Failed to load asset: ${name} from ${path}`);
                resolve(null);
            };
            this.images[name] = img;
        });
        
        this._loadPromises.push(promise);
        return promise;
    },

    ready: function() {
        return Promise.all(this._loadPromises);
    },

    get: function (name) {
        return this.images[name];
    }
};

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.camX = 0;
        this.camY = 0;
        this.zoom = 1;
        
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;

        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    setCamera(x, y, zoom = 1) {
        this.camX = x;
        this.camY = y;
        this.zoom = zoom;
    }

    updateShake(dt) {
        if (this.shakeIntensity > 0) {
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= Math.pow(0.01, dt);
            if (this.shakeIntensity < 0.1) {
                this.shakeIntensity = 0;
                this.shakeX = 0;
                this.shakeY = 0;
            }
        }
    }

    shake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    isVisible(x, y, radius = 50) {
        const left = this.camX - this.width / 2 - radius;
        const right = this.camX + this.width / 2 + radius;
        const top = this.camY - this.height / 2 - radius;
        const bottom = this.camY + this.height / 2 + radius;
        return x >= left && x <= right && y >= top && y <= bottom;
    }

    _resize() {
        const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        if (isMobile) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
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
        
        const lx = (sx - this.camX) + this.width / 2;
        const ly = (sy - this.camY) + this.height / 2;
        
        const grad = ctx.createRadialGradient(lx, ly, radius * 0.1, lx, ly, radius);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.5, 'rgba(0,0,0,0.2)');
        grad.addColorStop(1, ambientColor);
        
        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = 'source-over'; 
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }

    fillRect(x, y, w, h, color) {
        if (!this.isVisible(x, y, Math.max(w, h))) return;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + this.shakeX, y + this.shakeY, w, h);
    }

    fillCircle(x, y, r, color, alpha = 1) {
        if (!this.isVisible(x, y, r)) return;
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x + this.shakeX, y + this.shakeY, r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    strokeCircle(x, y, r, color, lineWidth = 1) {
        if (!this.isVisible(x, y, r)) return;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.arc(x + this.shakeX, y + this.shakeY, r, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    text(str, x, y, opts = {}) {
        const { size = 14, color = '#fff', font = 'Cinzel', align = 'left', shadow = true } = opts;
        this.ctx.font = `${size}px ${font}, serif`;
        this.ctx.textAlign = align;
        const tx = x + this.shakeX;
        const ty = y + this.shakeY;
        if (shadow) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillText(str, tx + 1, ty + 1);
        }
        this.ctx.fillStyle = color;
        this.ctx.fillText(str, tx, ty);
    }

    drawBar(x, y, w, h, ratio, fgColor, bgColor = '#1a1a1a') {
        const tx = x + this.shakeX;
        const ty = y + this.shakeY;
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(tx, ty, w, h);
        this.ctx.fillStyle = fgColor;
        this.ctx.fillRect(tx, ty, w * Math.max(0, Math.min(1, ratio)), h);
    }

    drawShadow(x, y, radius, alpha = 0.5) {
        if (!this.isVisible(x, y, radius)) return;
        const ctx = this.ctx;
        ctx.save();
        const tx = x + this.shakeX;
        const ty = y + this.shakeY;
        const grad = ctx.createRadialGradient(tx, ty, 0, tx, ty, radius);
        grad.addColorStop(0, `rgba(0,0,0,${alpha})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(tx, ty, radius, radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawSprite(spriteName, x, y, size, animate = false, time = 0, filter = null) {
        if (!this.isVisible(x, y, size)) return;
        const img = Assets.get(spriteName);
        let drawY = y;
        this.drawShadow(x, y + size * 0.4, size * 0.6);
        if (animate) drawY += Math.sin(time * 0.005) * 2;
        
        const tx = x + this.shakeX;
        const ty = drawY + this.shakeY;

        if (img && (img.complete || img.naturalWidth > 0)) {
            if (filter) this.ctx.filter = filter;
            const aspect = img.naturalWidth / img.naturalHeight;
            const drawSize = size * 2;
            let dw = drawSize, dh = drawSize;
            if (aspect > 1) dh = drawSize / aspect; else dw = drawSize * aspect;
            this.ctx.save();
            this.ctx.imageSmoothingEnabled = !(img.naturalWidth <= 64);
            this.ctx.drawImage(img, tx - dw / 2, (ty - 4) - dh / 2, dw, dh);
            this.ctx.restore();
            if (filter) this.ctx.filter = 'none';
        } else {
            this.ctx.fillStyle = '#f0f';
            this.ctx.fillRect(tx - size / 2, ty - size / 2, size, size);
        }
    }

    drawTile(name, x, y, size) {
        if (!this.isVisible(x, y, size)) return;
        const img = Assets.get(name);
        if (!img || (img.naturalWidth === 0 && !img.complete)) return;
        
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = !(img.naturalWidth <= 64);
        this.ctx.drawImage(img, x + this.shakeX - size / 2, y + this.shakeY - size / 2, size, size);
        this.ctx.restore();
    }

    drawAnim(spriteName, x, y, size, state, dir, time, filter = null, equipment = null, hitFlash = 0) {
        if (!this.isVisible(x, y, size * 2)) return;
        const img = Assets.get(spriteName);
        if (!img || (img.naturalWidth === 0 && !img.complete)) return;

        const tx = x + this.shakeX;
        const ty = y + this.shakeY;

        if (img.width === img.height || img.width <= 64) {
            this.drawSprite(spriteName, x, y, size, state === 'idle', time, filter);
            return;
        }

        const sw = img.width / 7, sh = img.height / 16;
        const dirMap = { 'up': 0, 'left': 1, 'down': 2, 'right': 3 };
        const dIdx = dirMap[dir] !== undefined ? dirMap[dir] : 2;

        let row = dIdx;
        if (state === 'walk') row = 8 + dIdx;
        if (state === 'attack') row = 12 + dIdx;

        const col = Math.floor(time * (state === 'attack' ? 0.015 : 0.008)) % 6;
        const sx = col * sw, sy = row * sh;
        const scale = size / 22, drawW = sw * scale, drawH = sh * scale;

        this.ctx.save();
        this.ctx.imageSmoothingEnabled = !(sw <= 64);
        if (filter) this.ctx.filter = filter;
        if (hitFlash > 0) this.ctx.filter = (filter || '') + ' brightness(5)';
        this.drawShadow(x, y + drawH * 0.3, drawW * 0.35);
        this.ctx.drawImage(img, sx, sy, sw, sh, tx - drawW / 2, ty - drawH * 0.6, drawW, drawH);
        this.ctx.restore();
    }
}
