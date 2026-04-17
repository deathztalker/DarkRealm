/**
 * GameObject Class — Interactive world objects like chests, shrines, portals
 */
import { fx } from '../engine/ParticleSystem.js';
export class GameObject {
    constructor(type, x, y, icon, id = null) {
        this.type = type; // chest, door, portal, shrine, hellforge, ancients_altar
        this.x = x;
        this.y = y;
        this.icon = icon;
        this.isOpen = false;
        this.id = id || Math.random().toString(36).substr(2, 9);
        this.shrineType = null; // For shrine objects
    }

    interact(player) {
        if (this.type === 'chest' && !this.isOpen) {
            this.isOpen = true;
            this.icon = 'obj_chest_open';
            return { type: 'LOOT', count: 2 + Math.floor(Math.random() * 3) };
        } else if (this.type === 'breakable' && !this.isOpen) {
            this.isOpen = true;
            this.icon = 'obj_chest_open'; // New transparent or debris icon
            if (window.fx) {
                window.fx.emitDebris(this.x, this.y, '#8a7a60', 12);
                window.fx.shake(200, 2);
            }
            return { type: 'BREAKABLE' };
        } else if (this.type === 'portal') {
            return { type: 'PORTAL', targetZone: this.targetZone };
        } else if (this.type === 'waypoint') {
            return { type: 'WAYPOINT', zone: this.zone };
        } else if (this.type === 'shrine' && !this.isOpen) {
            this.isOpen = true;
            this.icon = 'obj_shrine_used';
            return { type: 'SHRINE', shrineType: this.shrineType };
        } else if (this.type === 'hellforge' && !this.isOpen) {
            return { type: 'HELLFORGE' };
        } else if (this.type === 'ancients_altar' && !this.isOpen) {
            return { type: 'ALTIAR_OF_HEAVENS' };
        }
        return null;
    }

    render(renderer) {
        const time = Date.now();
        const ctx = renderer.ctx;
        
        let drawSize = 24; // Base size incremented for Pro art
        let bobY = 0;
        let scale = 1;
        let glowColor = null;
        let glowBlur = 0;

        // Custom properties per object type
        if (this.icon === 'obj_portal') {
            drawSize = 32;
            scale = 1 + Math.sin(time * 0.003) * 0.05; // Gentle breathing scale
            glowColor = '#00aaff';
            glowBlur = 20 + Math.sin(time * 0.005) * 5;
        } else if (this.icon === 'obj_waypoint') {
            drawSize = 32;
            glowColor = '#4080ff';
            glowBlur = 15 + Math.sin(time * 0.002) * 10; // Slow pulse
        } else if (this.icon === 'obj_shrine' && !this.isOpen) {
            bobY = Math.sin(time * 0.004) * 3; // Float up and down
            
            // Dynamic color based on shrine type
            const shrineColors = {
                armor: '#ffd700',      // Gold
                combat: '#ff2020',     // Red
                mana: '#4080ff',       // Blue
                resist: '#a040ff',     // Purple
                speed: '#ffffff',      // White
                experience: '#ffe880'  // Yellow/Bright
            };
            glowColor = shrineColors[this.shrineType] || '#ff2020';
            glowBlur = 15 + Math.sin(time * 0.003) * 5;
        } else if (this.icon === 'obj_torch' || this.icon === 'obj_brazier') {
            // Flickering fire effect
            const flicker = Math.random() * 0.4 + 0.6;
            glowColor = this.icon === 'obj_torch' ? `rgba(0, 150, 255, ${flicker})` : `rgba(255, 60, 0, ${flicker})`;
            glowBlur = 25 * flicker;
        }

        // Draw shadow first
        renderer.drawShadow(this.x, this.y + 12, 14, 0.4);

        ctx.save();
        
        // Apply dynamic glowing effects
        if (glowColor) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = glowBlur;
        }

        // Apply scale (e.g. for portal breathing)
        if (scale !== 1) {
            ctx.translate(this.x, this.y);
            ctx.scale(scale, scale);
            ctx.translate(-this.x, -this.y);
        }

        // Draw the main sprite with possible vertical bobbing
        renderer.drawSprite(this.icon, this.x, this.y + bobY, drawSize);
        
        ctx.restore();
    }
}
