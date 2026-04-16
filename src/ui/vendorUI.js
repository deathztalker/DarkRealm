import { Vendor } from '../vendorSystem.js';

export const VendorUI = {
    currentTab: 'All',
    mobileTab: 'Vendor',
    lastTapTime: 0,
    lastTapIdx: -1,

    init() {
        const vTab = document.getElementById('btn-trade-vendor-tab');
        const iTab = document.getElementById('btn-trade-inventory-tab');
        const closeBtn = document.getElementById('btn-close-mobile-trade');

        if (vTab) vTab.addEventListener('click', (e) => { e.preventDefault(); VendorUI.renderMobile('Vendor'); });
        if (iTab) iTab.addEventListener('click', (e) => { e.preventDefault(); VendorUI.renderMobile('Inventory'); });
        if (closeBtn) closeBtn.addEventListener('click', () => {
            document.getElementById('panel-trade-mobile').classList.add('hidden');
        });
    },

    open() {
        const isMobile = window.innerWidth <= 1024 || document.body.classList.contains('is-mobile');
        if (isMobile) {
            document.getElementById('panel-trade-mobile')?.classList.remove('hidden');
            document.getElementById('panel-shop')?.classList.add('hidden');
            document.getElementById('panel-inventory')?.classList.add('hidden');
            this.renderMobile('Vendor');
        } else {
            document.getElementById('panel-shop')?.classList.remove('hidden');
            document.getElementById('panel-inventory')?.classList.remove('hidden');
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

    drawItemGrid(container, itemsToShow, masterList, refreshCb) {
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid; grid-template-columns: repeat(5, 1fr); gap:10px; padding:10px; background:rgba(0,0,0,0.3); border:1px solid #222;';

        itemsToShow.forEach(item => {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            slot.style.width = '50px';
            slot.style.height = '50px';
            slot.style.position = 'relative';
            slot.style.cursor = 'pointer';
            slot.innerHTML = window.getItemHtml(item);

            const price = item.price || (window.calculateSellPrice(item) * 4);
            const priceTag = document.createElement('div');
            priceTag.style.cssText = 'position:absolute; bottom:-5px; right:-5px; background:rgba(0,0,0,0.8); color:var(--gold); font-size:9px; padding:1px 3px; border:1px solid #444; pointer-events:none;';
            priceTag.textContent = `${price}g`;
            slot.appendChild(priceTag);

            slot.addEventListener('mouseenter', e => window.showTooltip(item, e.clientX, e.clientY));
            slot.addEventListener('mouseleave', () => window.hideTooltip());

            slot.onclick = () => {
                if (window.player.gold >= price) {
                    if (window.player.addToInventory({...item})) {
                        window.player.gold -= price;
                        const masterIdx = masterList.indexOf(item);
                        if (masterIdx > -1) masterList.splice(masterIdx, 1);
                        window.hideTooltip();
                        refreshCb();
                        if(window.updateHud) window.updateHud();
                        if(window.playLoot) window.playLoot();
                    }
                }
            };
            grid.appendChild(slot);
        });
        container.appendChild(grid);
    },

    renderMobile(tab) {
        this.mobileTab = tab;
        const container = document.getElementById('mobile-trade-content');
        if (!container) return;

        container.innerHTML = '';
        
        const vTab = document.getElementById('btn-trade-vendor-tab');
        const iTab = document.getElementById('btn-trade-inventory-tab');
        const goldVal = document.getElementById('mobile-trade-gold-val');
        
        // Visual Feedback for tabs
        if(vTab) {
            vTab.style.background = tab === 'Vendor' ? 'rgba(100,100,100,0.9)' : 'rgba(30,30,30,0.5)';
            vTab.style.color = tab === 'Vendor' ? '#fff' : '#888';
        }
        if(iTab) {
            iTab.style.background = tab === 'Inventory' ? 'rgba(100,100,100,0.9)' : 'rgba(30,30,30,0.5)';
            iTab.style.color = tab === 'Inventory' ? '#fff' : '#888';
        }
        if(goldVal) goldVal.textContent = window.player.gold;

        if (tab === 'Vendor') {
            this.renderMobileVendor(container);
        } else {
            this.renderMobileInventory(container);
        }
    },

    renderMobileVendor(container) {
        // Services
        const services = document.createElement('div');
        services.style.cssText = 'display:flex; flex-direction:column; gap:5px; margin-bottom:15px;';
        
        const repairCost = Object.values(window.player.equipment).reduce((acc, it) => {
            if (it && it.durability < it.maxDurability) return acc + Math.ceil((it.maxDurability - it.durability) * 2);
            return acc;
        }, 0);

        const repBtn = document.createElement('button');
        repBtn.className = 'btn-secondary small';
        repBtn.style.color = repairCost > 0 ? '#4caf50' : '#888';
        repBtn.textContent = `🛠️ REPAIR ALL (${repairCost}g)`;
        repBtn.onclick = () => {
            if (repairCost > 0 && window.player.gold >= repairCost) {
                window.player.gold -= repairCost;
                Object.values(window.player.equipment).forEach(it => { if (it) it.durability = it.maxDurability; });
                VendorUI.renderMobile('Vendor');
            }
        };
        services.appendChild(repBtn);
        container.appendChild(services);

        // Merchant Items
        const vendorData = Vendor.vendorInventories[Vendor.currentVendorId];
        const masterItems = vendorData?.items || [];

        masterItems.forEach(item => {
            const price = item.price || (window.calculateSellPrice(item) * 4);
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px; border:1px solid #333; background:#111; margin-bottom:8px; border-radius:4px; transition: background 0.2s;';
            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; pointer-events:none;">
                    <div style="width:32px; height:32px; border:1px solid #444; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center;">
                        ${window.getItemHtml(item)}
                    </div>
                    <div style="display:flex; flex-direction:column;">
                        <span style="color:#fff; font-size:14px; font-family:Cinzel,serif;">${item.name}</span>
                        <span style="color:var(--gold); font-size:11px;">${price}g</span>
                    </div>
                </div>
                <button class="btn-primary small" style="min-width:65px; position:relative; z-index:2;">BUY</button>
            `;

            // SLIDE TOOLTIP FOR MOBILE
            row.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                window.showTooltip(item, touch.clientX, touch.clientY);
                row.style.background = 'rgba(216, 176, 104, 0.1)';
            });
            row.addEventListener('touchmove', (e) => {
                const touch = e.touches[0];
                window.showTooltip(item, touch.clientX, touch.clientY);
            });
            row.addEventListener('touchend', () => {
                window.hideTooltip();
                row.style.background = '#111';
            });

            row.querySelector('button').onclick = (e) => {
                e.stopPropagation();
                if (window.player.gold >= price) {
                    if (window.player.addToInventory({...item})) {
                        window.player.gold -= price;
                        const idx = masterItems.indexOf(item);
                        if (idx > -1) masterItems.splice(idx, 1);
                        window.playLoot();
                        VendorUI.renderMobile('Vendor');
                    }
                }
            };
            container.appendChild(row);
        });

        if (Vendor.currentVendorId === 'gheed') {
            const gHeader = document.createElement('div');
            gHeader.style.cssText = 'color:#bf642f; font-size:12px; margin:15px 0 8px; border-bottom:1px solid #4a3520; padding-bottom:5px;';
            gHeader.textContent = 'GAMBLE';
            container.appendChild(gHeader);
        }
    },

    renderMobileInventory(container) {
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; padding:10px;';
        
        window.player.inventory.forEach((item, i) => {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            slot.style.width = '100%';
            slot.style.aspectRatio = '1';
            slot.style.display = 'flex';
            slot.style.alignItems = 'center';
            slot.style.justifyContent = 'center';
            
            if (item) {
                slot.innerHTML = window.getItemHtml(item);
                
                // DOUBLE TAP TO SELL
                slot.addEventListener('touchstart', (e) => {
                    const now = Date.now();
                    const delta = now - this.lastTapTime;
                    
                    if (delta < 350 && this.lastTapIdx === i) {
                        // Success Double Tap!
                        const p = window.calculateSellPrice(item);
                        window.player.gold += p;
                        window.player.inventory[i] = null;
                        VendorUI.renderMobile('Inventory');
                        if (window.addCombatLog) window.addCombatLog(`Sold ${item.name} for ${p}g`, 'log-heal');
                        this.lastTapTime = 0;
                    } else {
                        this.lastTapTime = now;
                        this.lastTapIdx = i;
                        // Single tap: Show tooltip or hint
                        const touch = e.touches[0];
                        window.showTooltip(item, touch.clientX, touch.clientY);
                    }
                });
                slot.addEventListener('touchend', () => window.hideTooltip());
            }
            grid.appendChild(slot);
        });
        container.appendChild(grid);
    }
};
