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
        // Auto-init fallback if needed
        if (!this.loot && window.loot) {
            this.loot = window.loot;
        }

        if (!this.loot) {
            console.error("Vendor system not initialized with loot system!");
            return;
        }
        const profile = this.profiles[vendorId] || this.profiles['default'];
        const newItems = [];
        const lvl = (window.player && window.player.level) ? window.player.level : 5;

        console.log(`Generating stock for ${vendorId} (Lvl ${lvl})...`);

        for (let i = 0; i < profile.numItems; i++) {
            const rarity = profile.rarities[Math.floor(Math.random() * profile.rarities.length)];
            // Pass null as the third param if your loot.generate expects (lvl, rarity, type)
            const item = this.loot.generate(lvl, rarity);
            if (item) {
                item.identified = true; // Vendor items are always identified
                newItems.push(item);
            }
        }

        // Emergency fallback: if no items generated, generate at least some basic potions
        if (newItems.length === 0) {
            for(let i=0; i<3; i++) {
                const potion = this.loot.generate(lvl, 'normal');
                if(potion) newItems.push(potion);
            }
        }

        this.vendorInventories[vendorId] = {
            items: newItems,
            lastStocked: Date.now()
        };
        console.log(`Generated ${newItems.length} items for ${vendorId}`);
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
