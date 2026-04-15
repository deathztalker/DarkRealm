import { Vendor } from '../vendorSystem.js';

export const VendorUI = {
    currentTab: 'All',
    mobileTab: 'Vendor',

    init() {
        document.getElementById('btn-trade-vendor-tab')?.addEventListener('click', () => this.renderMobile('Vendor'));
        document.getElementById('btn-trade-inventory-tab')?.addEventListener('click', () => renderMobileTrade('Inventory'));
        document.getElementById('btn-close-mobile-trade')?.addEventListener('click', () => {
            document.getElementById('panel-trade-mobile').classList.add('hidden');
        });
    },

    open() {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            document.getElementById('panel-trade-mobile').classList.remove('hidden');
            document.getElementById('panel-shop').classList.add('hidden');
            document.getElementById('panel-inventory').classList.add('hidden');
            this.renderMobile('Vendor');
        } else {
            document.getElementById('panel-shop').classList.remove('hidden');
            document.getElementById('panel-inventory').classList.remove('hidden');
            this.renderDesktop();
        }
    },

    renderDesktop() {
        const container = document.getElementById('shop-items');
        if (!container) return;

        const vendorData = Vendor.vendorInventories[Vendor.currentVendorId];
        const masterItems = vendorData?.items || [];
        
        container.innerHTML = '';
        
        const goldEl = document.getElementById('shop-gold');
        if (goldEl) goldEl.innerHTML = `Your Gold: <span style="color:var(--gold)">${window.player.gold}</span>`;

        const nav = document.createElement('div');
        nav.style.cssText = 'display:flex; gap:5px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:5px; flex-wrap:wrap;';
        
        const types = ['All', ...new Set(masterItems.map(i => i.type))];
        types.forEach(t => {
            const btn = document.createElement('button');
            btn.className = 'btn-secondary small';
            btn.textContent = t.toUpperCase();
            if (this.currentTab === t) {
                btn.style.borderColor = 'var(--gold)';
                btn.style.color = 'var(--gold)';
            }
            btn.onclick = () => { this.currentTab = t; this.renderDesktop(); };
            nav.appendChild(btn);
        });

        const restock = document.createElement('button');
        restock.className = 'btn-secondary small';
        restock.style.marginLeft = 'auto';
        restock.textContent = 'RESTOCK (50g)';
        restock.onclick = () => {
            if (window.player.gold >= 50) {
                window.player.gold -= 50;
                Vendor.generateVendorStock(Vendor.currentVendorId);
                this.renderDesktop();
                if(window.updateHud) window.updateHud();
            }
        };
        nav.appendChild(restock);
        container.appendChild(nav);

        const filtered = this.currentTab === 'All' ? masterItems : masterItems.filter(i => i.type === this.currentTab);
        this.drawItemGrid(container, filtered, masterItems, () => this.renderDesktop());
    },

    // D2 Style Grid Rendering
    drawItemGrid(container, itemsToShow, masterList, refreshCb) {
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid; grid-template-columns: repeat(5, 1fr); gap:10px; padding:10px; background:rgba(0,0,0,0.3); border:1px solid #222;';

        itemsToShow.forEach(item => {
            const slot = document.createElement('div');
            slot.className = 'inv-slot'; // Reusing existing slot styles
            slot.style.width = '50px';
            slot.style.height = '50px';
            slot.style.position = 'relative';
            slot.style.cursor = 'pointer';
            
            // Item Icon
            slot.innerHTML = window.getItemHtml(item);

            // Price Badge (Small)
            const price = item.price || (window.calculateSellPrice(item) * 4);
            const priceTag = document.createElement('div');
            priceTag.style.cssText = 'position:absolute; bottom:-5px; right:-5px; background:rgba(0,0,0,0.8); color:var(--gold); font-size:9px; padding:1px 3px; border:1px solid #444; pointer-events:none;';
            priceTag.textContent = `${price}g`;
            slot.appendChild(priceTag);

            // Tooltip Events
            slot.addEventListener('mouseenter', e => window.showTooltip(item, e.clientX, e.clientY));
            slot.addEventListener('mouseleave', () => window.hideTooltip());

            // Buy Logic (Right click or Click)
            slot.onclick = () => {
                if (window.player.gold >= price) {
                    if (window.player.addToInventory({...item})) {
                        window.player.gold -= price;
                        // REMOVE from master list so it disappears permanently
                        const masterIdx = masterList.indexOf(item);
                        if (masterIdx > -1) masterList.splice(masterIdx, 1);
                        
                        window.hideTooltip();
                        refreshCb();
                        if(window.renderInventory) window.renderInventory();
                        if(window.updateHud) window.updateHud();
                        if(window.playLoot) window.playLoot();
                    } else {
                        if(window.addCombatLog) window.addCombatLog("Inventory Full!", "log-dmg");
                    }
                } else {
                    if(window.addCombatLog) window.addCombatLog("Not enough gold!", "log-dmg");
                }
            };

            grid.appendChild(slot);
        });

        if (itemsToShow.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'grid-column: span 5; text-align:center; color:#555; padding:20px; font-style:italic;';
            empty.textContent = 'No items in this category.';
            grid.appendChild(empty);
        }

        container.appendChild(grid);
    },

    renderMobile(tab) {
        this.mobileTab = tab;
        const container = document.getElementById('mobile-trade-content');
        if (!container) return;

        container.innerHTML = '';
        
        const vTab = document.getElementById('btn-trade-vendor-tab');
        const iTab = document.getElementById('btn-trade-inventory-tab');
        if(vTab) vTab.style.background = tab === 'Vendor' ? '#333' : 'transparent';
        if(iTab) iTab.style.background = tab === 'Inventory' ? '#333' : 'transparent';

        if (tab === 'Vendor') {
            const vendorData = Vendor.vendorInventories[Vendor.currentVendorId];
            const masterItems = vendorData?.items || [];
            this.drawItemGrid(container, masterItems, masterItems, () => this.renderMobile('Vendor'));
        } else {
            this.drawInventory(container);
        }
    },

    drawInventory(container) {
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fill, minmax(55px, 1fr)); gap:8px; padding:15px;';
        
        window.player.inventory.forEach((item, i) => {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            slot.style.width = '50px';
            slot.style.height = '50px';
            
            if (item) {
                slot.innerHTML = window.getItemHtml(item);
                slot.addEventListener('mouseenter', e => window.showTooltip(item, e.clientX, e.clientY));
                slot.addEventListener('mouseleave', () => window.hideTooltip());
                
                slot.onclick = () => {
                    const p = window.calculateSellPrice(item);
                    if (confirm(`Sell ${item.name} for ${p}g?`)) {
                        window.player.gold += p;
                        window.player.inventory[i] = null;
                        window.hideTooltip();
                        this.renderMobile('Inventory');
                        if(window.updateHud) window.updateHud();
                    }
                };
            }
            grid.appendChild(slot);
        });
        container.appendChild(grid);
    }
};
