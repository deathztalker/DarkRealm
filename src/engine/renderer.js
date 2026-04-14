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

    /**
     * Post-process Lighting Pass
     * Creates a radial light mask centered on the player.
     * @param {number} sx - Player screen X
     * @param {number} sy - Player screen Y
     * @param {number} radius - Light radius
     * @param {string} ambientColor - The color of the darkness (e.g. 'rgba(0,0,0,0.9)')
     */
    applyLighting(sx, sy, radius, ambientColor = 'rgba(0,0,0,0.85)') {
        const ctx = this.ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to screen space
        
        // Use a separate canvas or a multiply operation to darken the screen
        // But for 2D canvas, the easiest/fastest high-quality way is to draw the darkness
        // with a hole carved out.
        
        const grad = ctx.createRadialGradient(sx, sy, radius * 0.2, sx, sy, radius);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, ambientColor);

        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = 'source-over'; // Standard overlay
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Optional: darken borders even more
        ctx.fillStyle = ambientColor;
        // Optimization: instead of a full rect, just the areas outside the grad are already filled by the grad's last stop if we use a different technique.
        // Actually, simple fillRect with the grad is effective if the grad covers the screen.
        
        ctx.restore();
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

        if (img && img.complete && img.naturalWidth > 0) {
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
    drawTile(name, x, y, size) {
        const img = Assets.get(name);
        if (!img || !img.complete || img.naturalWidth === 0) return;
        
        // --- Phase 3.1: Grid Breakup (Subtle Jitter) ---
        // Reduced to 1px for subtle organic feel
        const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const jitterX = (seed % 1) * 1.0;
        const jitterY = ((seed * 10) % 1) * 1.0;
        
        this.ctx.drawImage(img, x + jitterX - size / 2, y + jitterY - size / 2, size, size);
    }

    // Draw frame from Spritesheet
    drawAnim(spriteName, x, y, size, state, dir, time, filter = null, equipment = null, hitFlash = 0) {
        const img = Assets.get(spriteName);
        if (!img || !img.complete || img.naturalWidth === 0 || img.width <= 64 || img.width === img.height) {
            this.drawSprite(spriteName, x, y, size, state === 'idle', time, filter);
            
            // Dynamic Equipment Layering — Canvas-drawn overlays
            if (equipment) {
                const ctx = this.ctx;
                ctx.save();
                
                // Multi-layered filters
                let combinedFilter = filter || '';
                if (hitFlash > 0) {
                    combinedFilter += ' brightness(5)';
                }
                if (combinedFilter) ctx.filter = combinedFilter.trim();
                
                const anim = state === 'walk';
                const bob = anim ? Math.sin(time * 0.005) * 2 : 0;
                const drawY = y + bob;

                // Helper: get color from armor type
                const armorColor = (item) => {
                    if (!item) return null;
                    const t = item.type || item.icon || '';
                    if (t.includes('plate') || t.includes('chain') || t.includes('gauntlet') || t.includes('war_boot')) return '#a0a0a8';
                    if (t.includes('robe') || t.includes('circlet')) return '#6040a0';
                    return '#8B6540'; // leather default
                };

                // Rarity glow
                const rarityGlow = (item) => {
                    if (!item) return null;
                    if (item.rarity === 'unique') return '#bf642f';
                    if (item.rarity === 'rare') return '#ffff00';
                    if (item.rarity === 'magic') return '#4850b8';
                    return null;
                };

                const drawGlow = (px, py, w, h, item) => {
                    const glow = rarityGlow(item);
                    if (glow) {
                        ctx.save();
                        ctx.shadowColor = glow;
                        ctx.shadowBlur = 6;
                        ctx.strokeStyle = glow;
                        ctx.lineWidth = 1;
                        ctx.strokeRect(px, py, w, h);
                        ctx.restore();
                    }
                };

                // Chest armor — colored torso area
                if (equipment.chest) {
                    const color = armorColor(equipment.chest);
                    ctx.save();
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = color;
                    ctx.fillRect(x - 5, drawY - 6, 10, 8);
                    drawGlow(x - 5, drawY - 6, 10, 8, equipment.chest);
                    ctx.restore();
                }

                // Helm — band on head with visor detail
                if (equipment.head) {
                    const color = armorColor(equipment.head);
                    ctx.save();
                    ctx.globalAlpha = 0.8;
                    ctx.fillStyle = color;
                    // Main helm
                    ctx.fillRect(x - 4, drawY - 14, 8, 4);
                    // Visor or crown peak
                    ctx.fillStyle = '#eee';
                    ctx.fillRect(x - 3, drawY - 14, 6, 1);
                    drawGlow(x - 4, drawY - 14, 8, 4, equipment.head);
                    ctx.restore();
                }

                // Weapon — line extending from hand with point/hilt
                if (equipment.mainhand) {
                    const wt = (equipment.mainhand.type || '').toLowerCase();
                    const wColor = wt.includes('staff') ? '#8B6540' : wt.includes('bow') ? '#A0784B' : wt.includes('wand') ? '#6060c0' : '#c0c0d0';
                    const dirOff = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
                    const dirOffy = dir === 'down' ? 1 : dir === 'up' ? -1 : 0;
                    ctx.save();
                    ctx.strokeStyle = wColor;
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.shadowColor = rarityGlow(equipment.mainhand) || wColor;
                    ctx.shadowBlur = rarityGlow(equipment.mainhand) ? 8 : 2;
                    
                    const startX = x + dirOff * 4;
                    const startY = drawY - 2 + dirOffy * 2;
                    const wLen = wt.includes('staff') || wt.includes('bow') ? 14 : 10;
                    const endX = x + dirOff * (4 + wLen);
                    const endY = drawY - 2 + dirOffy * (2 + wLen * 0.5);

                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();

                    // Hilt / Crossguard if melee/staff
                    if (!wt.includes('bow')) {
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = '#666';
                        ctx.beginPath();
                        ctx.moveTo(startX - 2, startY - 2);
                        ctx.lineTo(startX + 2, startY + 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                }

                // Shield / Offhand — shield shape
                if (equipment.offhand) {
                    const dirOff = dir === 'right' ? -1 : dir === 'left' ? 1 : 0;
                    ctx.save();
                    ctx.globalAlpha = 0.8;
                    const sx = x + dirOff * 7 - 3;
                    const sy = drawY - 5;
                    ctx.fillStyle = '#606068'; // Shield base
                    ctx.fillRect(sx, sy, 6, 8);
                    ctx.fillStyle = '#909098'; // Shield border/detail
                    ctx.strokeRect(sx, sy, 6, 8);
                    drawGlow(sx, sy, 6, 8, equipment.offhand);
                    ctx.restore();
                }

                // Boots — colored feet
                if (equipment.boots) {
                    const color = armorColor(equipment.boots);
                    ctx.save();
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = color;
                    ctx.fillRect(x - 4, drawY + 3, 3, 2);
                    ctx.fillRect(x + 1, drawY + 3, 3, 2);
                    ctx.restore();
                }

                // Gloves — colored hand dots
                if (equipment.gloves) {
                    const color = armorColor(equipment.gloves);
                    ctx.save();
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(x - 6, drawY - 1, 1.5, 0, Math.PI * 2);
                    ctx.arc(x + 6, drawY - 1, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
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
        if (img && img.complete && img.naturalWidth > 0) {
            this.ctx.drawImage(img, sx, sy, sw, sh, x - size, y - size * 1.5, size * 2, size * 2);
        }
        if (filter) this.ctx.filter = 'none';
    }
}
