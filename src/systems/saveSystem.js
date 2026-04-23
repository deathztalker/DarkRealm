/**
 * SAVE SYSTEM — Multi-character slot saves (D2-style)
 * Each character has an independent save slot identified by a unique ID.
 */
import { Player } from '../entities/player.js';
import { DB } from './db.js';

const SLOTS_KEY = 'darkRealm_slots';
const SHARED_STASH_KEY = 'DARK_REALM_SHARED_STASH';
const PANTHEON_KEY = 'DARK_REALM_PANTHEON';

export const SaveSystem = {
    /** Pantheon: Monuments of Valor (Persistence for dead HC heroes) */
    getPantheon() {
        try {
            const data = localStorage.getItem(PANTHEON_KEY);
            return data ? JSON.parse(data) : [];
        } catch { return []; }
    },

    saveToPantheon(char) {
        try {
            const pan = this.getPantheon();
            pan.push({
                name: char.name || char.charName,
                className: char.className,
                level: char.level,
                gold: char.totalGoldCollected || char.gold || 0,
                killer: char.lastAttacker || 'The Shadows',
                date: Date.now(),
                isHardcore: true
            });
            // Keep only latest 50 for storage sanity
            localStorage.setItem(PANTHEON_KEY, JSON.stringify(pan.slice(-50)));
            return true;
        } catch { return false; }
    },

    /** Get all saved character slots (summary info for menu) */
    listSlots() {
        try {
            const raw = localStorage.getItem(SLOTS_KEY);
            if (!raw) return [];
            const slots = JSON.parse(raw);
            return Array.isArray(slots) ? slots : [];
        } catch { return []; }
    },

    saveSlot(slotId, player, zoneLevel, stash, extras) {
        if (!player || !slotId) return false;
        try {
            const slots = this.listSlots();
            
            // Ensure waypoints is an array for JSON serialization
            let waypointsArray = extras?.waypoints;
            if (waypointsArray instanceof Set) {
                waypointsArray = Array.from(waypointsArray);
            } else if (!Array.isArray(waypointsArray)) {
                waypointsArray = [0];
            }

            const entry = {
                id: slotId,
                name: player.charName || player.className,
                classId: player.classId,
                className: player.className,
                level: player.level,
                zoneLevel,
                stash: stash || [],
                cube: extras?.cube || [],
                mercenary: extras?.mercenary || null,
                timestamp: Date.now(),
                player: player.serialize(),
                difficulty: extras?.difficulty || 0,
                waypoints: waypointsArray,
                campaign: (extras?.campaign && typeof extras.campaign.serialize === 'function') ? extras.campaign.serialize() : (extras?.campaign || null),
                extra_data: { 
                    riftLevel: window.riftLevel || 0,
                    highestZone: extras?.highestZone || player.highestZone || 0
                },
            };
            const idx = slots.findIndex(s => s.id === slotId);
            if (idx >= 0) slots[idx] = entry;
            else slots.push(entry);
            localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));

            // [Supabase] Background Cloud Sync
            if (DB.isLoggedIn()) {
                DB.upsertSave(slotId, entry).catch(e => console.error('Cloud save failed:', e));
            }

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
                cube: slot.cube || [],
                mercenary: slot.mercenary || null,
                slotId: slot.id,
                difficulty: slot.difficulty || 0,
                waypoints: slot.waypoints || [0],
                campaign: slot.campaign || null,
                highestZone: slot.extra_data?.highestZone || 0,
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

            // [Supabase] Background Cloud Sync
            if (DB.isLoggedIn()) {
                DB.deleteSave(slotId).catch(e => console.error('Cloud delete failed:', e));
            }

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
            // Priority list of keys used in different versions
            const keys = [
                'DARK_REALM_SHARED_STASH',
                'darkRealm_sharedStash',
                'shared_stash',
                'stash',
                'darkrealm_shared_stash'
            ];

            let mergedTabs = null;
            let totalGold = 0;

            for (const key of keys) {
                const found = localStorage.getItem(key);
                if (found) {
                    try {
                        const parsed = JSON.parse(found);
                        let extractedTabs = null;

                        // Case 1: Full format
                        if (parsed && parsed.tabs && Array.isArray(parsed.tabs)) {
                            extractedTabs = parsed.tabs;
                            totalGold = Math.max(totalGold, parsed.gold || 0);
                        }
                        // Case 2: Just tabs array
                        else if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].items || parsed[0].name)) {
                            extractedTabs = parsed;
                        }
                        // Case 3: Old items format
                        else if (parsed && Array.isArray(parsed.items)) {
                            extractedTabs = [{ name: 'Shared 1', items: parsed.items }];
                            totalGold = Math.max(totalGold, parsed.gold || 0);
                        }
                        // Case 4: Raw items array
                        else if (Array.isArray(parsed)) {
                            extractedTabs = [{ name: 'Shared 1', items: parsed }];
                        }

                        if (extractedTabs) {
                            if (!mergedTabs) {
                                mergedTabs = [
                                    { name: 'Shared 1', items: Array(100).fill(null) },
                                    { name: 'Shared 2', items: Array(100).fill(null) },
                                    { name: 'Shared 3', items: Array(100).fill(null) },
                                    { name: 'Private', items: Array(100).fill(null) }
                                ];
                            }

                            // Merge items into tabs
                            extractedTabs.forEach((tab, tIdx) => {
                                if (tIdx < mergedTabs.length && tab.items) {
                                    tab.items.forEach((item, iIdx) => {
                                        if (item && iIdx < mergedTabs[tIdx].items.length) {
                                            // Only place if slot is empty to avoid overwriting newer data
                                            if (!mergedTabs[tIdx].items[iIdx]) {
                                                mergedTabs[tIdx].items[iIdx] = item;
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    } catch (e) { console.error(`Error parsing key ${key}:`, e); }
                }
            }

            if (mergedTabs) {
                return { tabs: mergedTabs, gold: totalGold };
            }

            // Default empty stash
            return {
                tabs: [
                    { name: 'Shared 1', items: Array(100).fill(null) },
                    { name: 'Shared 2', items: Array(100).fill(null) },
                    { name: 'Shared 3', items: Array(100).fill(null) },
                    { name: 'Private', items: Array(100).fill(null) }
                ],
                gold: 0
            };
        } catch (e) { 
            console.error('Final Rescue Error:', e);
            return {
                tabs: [ { name: 'Shared 1', items: Array(100).fill(null) }, { name: 'Shared 2', items: Array(100).fill(null) }, { name: 'Shared 3', items: Array(100).fill(null) }, { name: 'Private', items: Array(100).fill(null) } ],
                gold: 0
            };
        }
    },

    saveSharedStash(stashData) {
        try {
            localStorage.setItem(SHARED_STASH_KEY, JSON.stringify(stashData));

            // [Supabase] Background Cloud Sync
            if (DB.isLoggedIn()) {
                DB.upsertSharedStash(stashData.tabs, stashData.gold).catch(e => console.error('Cloud stash save failed:', e));
            }
            return true;
        } catch (e) {
            console.error('Failed to save shared stash:', e);
            return false;
        }
    },
    exportData() {
        try {
            const slots = localStorage.getItem(SLOTS_KEY);
            const stash = localStorage.getItem(SHARED_STASH_KEY);
            const data = {
                slots: slots ? JSON.parse(slots) : [],
                sharedStash: stash ? JSON.parse(stash) : { items: Array(20).fill(null), gold: 0 }
            };
            return JSON.stringify(data);
        } catch (e) {
            console.error('Failed to export data:', e);
            return null;
        }
    },

    /** Import save data from a JSON string */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data && Array.isArray(data.slots)) {
                localStorage.setItem(SLOTS_KEY, JSON.stringify(data.slots));
                if (data.sharedStash) {
                    localStorage.setItem(SHARED_STASH_KEY, JSON.stringify(data.sharedStash));
                }
                return true;
            }
            return false;
        } catch (e) {
            console.error('Failed to import data:', e);
            return false;
        }
    },

    clearSave() { }
};
