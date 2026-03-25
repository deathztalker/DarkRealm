/**
 * GameObject Class — Interactive world objects like chests
 */
export class GameObject {
    constructor(type, x, y, icon) {
        this.type = type; // chest, door
        this.x = x;
        this.y = y;
        this.icon = icon;
        this.isOpen = false;
        this.id = Math.random().toString(36).substr(2, 9);
    }

    interact(player) {
        if (this.type === 'chest' && !this.isOpen) {
            this.isOpen = true;
            this.icon = 'obj_chest_open';
            return { type: 'LOOT', count: 2 + Math.floor(Math.random() * 3) };
        } else if (this.type === 'portal') {
            return { type: 'PORTAL', targetZone: this.targetZone };
        }
        return null;
    }

    render(renderer) {
        renderer.drawSprite(this.icon, this.x, this.y, 16);
    }
}
