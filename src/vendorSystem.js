// src/vendorSystem.js

export const Vendor = {
    loot: null,
    player: null,
    vendorInventories: {},
    currentVendorId: null,
    currentShopTab: 'All',
    refreshInterval: 5 * 60 * 1000, // 5 minutes

    profiles: {
        'akara': { numItems: 12, itemTypes: ['wand', 'staff', 'scepter', 'potion_hp', 'potion_mp', 'scroll_tp', 'scroll_id', 'tome_tp', 'tome_id'], rarities: ['normal', 'magic'] },
        'charsi': { numItems: 15, itemTypes: ['weapon', 'armor'], rarities: ['normal', 'magic', 'rare'] },
        'gheed': { numItems: 20, itemTypes: ['amulet', 'ring', 'charm'], rarities: ['magic', 'rare'] },
        'default': { numItems: 10, itemTypes: ['weapon', 'armor', 'potion_hp'], rarities: ['normal', 'magic'] }
    },

    init(lootSystem, playerRef) {
        this.loot = lootSystem;
        this.player = playerRef;
    },

    generateVendorStock(vendorId) {
        if (!this.loot && window.loot) this.loot = window.loot;
        if (!this.loot) return;

        const profile = this.profiles[vendorId] || this.profiles['default'];
        const newItems = [];
        const lvl = (window.player && window.player.level) ? window.player.level : 5;

        for (let i = 0; i < profile.numItems; i++) {
            const rarity = profile.rarities[Math.floor(Math.random() * profile.rarities.length)];
            
            // Pick a type from the profile
            let type = profile.itemTypes[Math.floor(Math.random() * profile.itemTypes.length)];
            
            // Map common profile shorthand to actual system types
            let forceType = null;
            if (['potion_hp', 'potion_mp', 'potion'].includes(type)) forceType = 'potion';
            else if (['scroll_tp', 'scroll_id', 'scroll'].includes(type)) forceType = 'scroll';
            else if (['weapon', 'armor', 'ring', 'amulet', 'charm'].includes(type)) forceType = type;

            const item = this.loot.generate(lvl, rarity, forceType);
            if (item) {
                item.identified = true; 
                newItems.push(item);
            }
        }

        this.vendorInventories[vendorId] = {
            items: newItems,
            lastStocked: Date.now()
        };
    },

    openShopForNpc(npc) {
        this.currentVendorId = npc.id;
        const vendorData = this.vendorInventories[this.currentVendorId];

        if (!vendorData || (Date.now() - vendorData.lastStocked > this.refreshInterval)) {
            this.generateVendorStock(this.currentVendorId);
        }
        
        if(window.VendorUI) window.VendorUI.open();
    }
};
