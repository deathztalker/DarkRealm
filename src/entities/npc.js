/**
 * NPC Class — Town inhabitants and quest givers
 */
export class NPC {
    constructor(id, name, type, x, y, icon, dialogue, dungeon) {
        this.id = id;
        this.name = name;
        this.type = type; // merchant, elder, villager
        this.x = x;
        this.y = y;
        this.icon = icon;
        this.dialogue = dialogue;
        this.dungeon = dungeon;

        this.moveTimer = 0;
        this.moveDir = { x: 0, y: 0 };
    }

    update(dt) {
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            if (Math.random() < 0.3) {
                const angle = Math.random() * Math.PI * 2;
                this.moveDir = { x: Math.cos(angle), y: Math.sin(angle) };
            } else {
                this.moveDir = { x: 0, y: 0 };
            }
            this.moveTimer = 2 + Math.random() * 3;
        }

        const speed = 0.5;
        const nx = this.x + this.moveDir.x * speed;
        const ny = this.y + this.moveDir.y * speed;

        // Only move if the target position is walkable
        if (!this.dungeon || this.dungeon.isWalkable(nx, ny)) {
            this.x = nx;
            this.y = ny;
        } else {
            // Reverse direction on collision
            this.moveDir = { x: -this.moveDir.x, y: -this.moveDir.y };
        }
    }

    interact(player) {
        // Face the player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.moveDir = { x: 0, y: 0 };
        this.moveTimer = 5; // Stop moving for a bit
        
        // Return dialogue logic (handled by state in main.js)
        return this.dialogue;
    }

    render(renderer, time) {
        // Sprite with LPC animation - always idle or default walk
        renderer.drawAnim(this.icon, this.x, this.y - 4, 26, 'idle', 'south', time);

        // Name tag
        const ctx = renderer.ctx;
        ctx.font = '6px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700'; // Gold names for NPCs
        ctx.fillText(this.name, this.x, this.y - 12);
    }
}
