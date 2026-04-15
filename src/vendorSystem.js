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
        if (!this.loot) return;
        const profile = this.profiles[vendorId] || this.profiles['default'];
        const newItems = [];
        const lvl = window.player ? window.player.level : 1;

        for (let i = 0; i < profile.numItems; i++) {
            const rarity = profile.rarities[Math.floor(Math.random() * profile.rarities.length)];
            const item = this.loot.generate(lvl, rarity);
            if (item) newItems.push(item);
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
