/**
 * SAVE SYSTEM — Multi-character slot saves (D2-style)
 * Each character has an independent save slot identified by a unique ID.
 */
import { Player } from '../entities/player.js';

const SLOTS_KEY = 'darkRealm_slots';
const SHARED_STASH_KEY = 'DARK_REALM_SHARED_STASH';

export const SaveSystem = {
    /** Get all saved character slots (summary info for menu) */
    listSlots() {
        try {
            const raw = localStorage.getItem(SLOTS_KEY);
            if (!raw) return [];
            const slots = JSON.parse(raw);
            return Array.isArray(slots) ? slots : [];
        } catch { return []; }
    },

    /** Save a character to a specific slot */
    saveSlot(slotId, player, zoneLevel, stash, extras) {
        if (!player || !slotId) return false;
        try {
            const slots = this.listSlots();
            const entry = {
                id: slotId,
                name: player.charName || player.className,
                classId: player.classId,
                className: player.className,
                level: player.level,
                zoneLevel,
                stash: stash || [],
                mercenary: extras?.mercenary || null,
                timestamp: Date.now(),
                player: player.serialize(),
                difficulty: extras?.difficulty || 0,
                waypoints: extras?.waypoints || [0],
            };
            const idx = slots.findIndex(s => s.id === slotId);
            if (idx >= 0) slots[idx] = entry;
            else slots.push(entry);
            localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
            return true;
        } catch (e) {
            console.error('Failed to save slot:', e);
            return false;
        }
    },

    /** Load a character from a slot */
    loadSlot(slotId) {
        try {
            const slots = this.listSlots();
            const slot = slots.find(s => s.id === slotId);
            if (!slot) return null;
            return {
                player: slot.player,
                zoneLevel: slot.zoneLevel || 0,
                stash: slot.stash || [],
                mercenary: slot.mercenary || null,
                slotId: slot.id,
                difficulty: slot.difficulty || 0,
                waypoints: slot.waypoints || [0],
            };
        } catch (e) {
            console.error('Failed to load slot:', e);
            return null;
        }
    },

    /** Delete a character slot */
    deleteSlot(slotId) {
        try {
            let slots = this.listSlots();
            slots = slots.filter(s => s.id !== slotId);
            localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
            return true;
        } catch { return false; }
    },

    /** Generate a unique slot ID */
    newSlotId() {
        return 'char_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    },

    /** Check if any saves exist */
    hasSave() {
        return this.listSlots().length > 0;
    },

    // Legacy compatibility — deprecated
    saveGame(player, zoneLevel) {
        // Auto-save uses activeSlotId from main.js (passed via global)
        if (window._activeSlotId) {
            return this.saveSlot(window._activeSlotId, player, zoneLevel);
        }
        return false;
    },
    loadGame() { return null; },
    getSharedStash() {
        try {
            const data = localStorage.getItem(SHARED_STASH_KEY);
            return data ? JSON.parse(data) : { items: Array(20).fill(null), gold: 0 };
        } catch { return { items: Array(20).fill(null), gold: 0 }; }
    },

    saveSharedStash(items, gold) {
        try {
            localStorage.setItem(SHARED_STASH_KEY, JSON.stringify({ items, gold }));
            return true;
        } catch { return false; }
    },

    clearSave() { }
};
