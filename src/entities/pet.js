/**
 * Pet Entity — Non-combat companions that provide utility.
 * Features: Auto-gold pickup (Vacuum) and minor buffs.
 */
import { fx } from '../engine/ParticleSystem.js';

export class Pet {
    constructor(data) {
        this.name = data.name || 'Wolf Cub';
        this.type = data.type || 'wolf';
        this.icon = data.icon || 'ra-paw';
        this.color = data.color || '#884400';
        
        this.x = data.x || 0;
        this.y = data.y || 0;
        
        this._leashDist = 60;
        this._vacuumRange = 180;
        this._isLeashed = true;
    }

    update(dt, player, droppedGold, droppedItems) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // --- HARD LEASH ---
        if (dist > 800) {
            this.x = player.x; this.y = player.y;
            fx.emitBurst(this.x, this.y, this.color, 12, 1);
            return;
        }

        // --- VACUUM LOGIC (Gold & Potion Fetching) ---
        let target = null, targetD = this._vacuumRange;

        // Priority 1: Potion Fetching (If belt has room)
        const hasBeltRoom = player.belt && player.belt.includes(null);
        if (hasBeltRoom && droppedItems) {
            for (const itm of droppedItems) {
                if (itm.type === 'potion' && !itm._pickedByPet && !itm.active) { // !active usually means it's on ground
                    const idist = Math.sqrt((itm.x - this.x)**2 + (itm.y - this.y)**2);
                    if (idist < targetD) { targetD = idist; target = itm; }
                }
            }
        }

        // Priority 2: Gold
        if (!target && droppedGold && droppedGold.length > 0) {
            for (const g of droppedGold) {
                if (g._pickedByPet) continue;
                const gd = Math.sqrt((g.x - this.x)**2 + (g.y - this.y)**2);
                if (gd < targetD) { targetD = gd; target = g; }
            }
        }

        if (target) {
            const tx = target.x - this.x, ty = target.y - this.y;
            const distT = Math.sqrt(tx*tx + ty*ty);
            const speed = 250;
            this.x += (tx/distT) * speed * dt;
            this.y += (ty/distT) * speed * dt;
            
            if (distT < 15) {
                if (target.amount) { // Gold
                    player.gold += target.amount;
                    player.totalGoldCollected += target.amount;
                    fx.emitBurst(target.x, target.y, '#ffd700', 8, 1);
                } else { // Potion
                    const added = player.addToInventory(target);
                    if (added) {
                        import('../engine/EventBus.js').then(eb => eb.bus.emit('log:add', { text: `${this.name} fetched ${target.name}!`, cls: 'log-info' }));
                        fx.emitHeal(target.x, target.y);
                    }
                }
                target._pickedByPet = true; 
            }
            return; 
        }

        // --- FOLLOW LOGIC ---
        if (dist > this._leashDist) {
            const speed = dist > 250 ? 200 : 100;
            this.x += (dx / dist) * speed * dt;
            this.y += (dy / dist) * speed * dt;
        }
    }
}
