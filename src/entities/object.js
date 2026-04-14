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
            this.icon = 'obj_chest_open';
            return { type: 'SHRINE', shrineType: this.shrineType };
        } else if (this.type === 'hellforge' && !this.isOpen) {
            return { type: 'HELLFORGE' };
        } else if (this.type === 'ancients_altar' && !this.isOpen) {
            return { type: 'ALTIAR_OF_HEAVENS' };
        }
        return null;
    }

    render(renderer) {
        // Waypoints/Shrines glow when active/unused
        if ((this.type === 'shrine' && !this.isOpen) || (this.type === 'waypoint')) {
            renderer.ctx.save();
            const pulse = 0.3 + Math.sin(Date.now() / 400) * 0.15;
            renderer.ctx.globalAlpha = pulse;
            renderer.ctx.shadowColor = this.type === 'shrine' ? '#4080ff' : '#ffd700';
            renderer.ctx.shadowBlur = 12;
            renderer.drawSprite(this.icon, this.x, this.y, 16);
            renderer.ctx.restore();
        }
        renderer.drawSprite(this.icon, this.x, this.y, 16);
    }
}
