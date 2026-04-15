
import { Vendor } from '../vendorSystem.js';

export const VendorUI = {
    currentTab: 'All',
    mobileTab: 'Vendor',

    // Inicializa la UI exponiendo funciones necesarias si es necesario
    init() {
        // Escuchar clics en los botones de la pestaña móvil que están en el HTML
        document.getElementById('btn-trade-vendor-tab')?.addEventListener('click', () => this.renderMobile('Vendor'));
        document.getElementById('btn-trade-inventory-tab')?.addEventListener('click', () => this.renderMobile('Inventory'));
        document.getElementById('btn-close-mobile-trade')?.addEventListener('click', () => {
            document.getElementById('panel-trade-mobile').classList.add('hidden');
        });
    },

    // Esta función decide qué panel abrir según el tamaño de pantalla
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
        const items = vendorData?.items || [];
        
        container.innerHTML = '';
        
        // --- Header con Oro ---
        const goldEl = document.getElementById('shop-gold');
        if (goldEl) goldEl.innerHTML = `Gold: <span style="color:var(--gold)">${window.player.gold}</span>`;

        // --- Tabs & Restock ---
        const nav = document.createElement('div');
        nav.style.cssText = 'display:flex; gap:5px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:5px; flex-wrap:wrap;';
        
        const types = ['All', ...new Set(items.map(i => i.type))];
        types.forEach(t => {
            const btn = document.createElement('button');
            btn.className = 'btn-secondary small';
            btn.textContent = t.toUpperCase();
            if (this.currentTab === t) btn.style.borderColor = 'var(--gold)';
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

        // --- Lista de Items ---
        const filtered = this.currentTab === 'All' ? items : items.filter(i => i.type === this.currentTab);
        this.drawItemList(container, filtered, () => this.renderDesktop());
    },

    renderMobile(tab) {
        this.mobileTab = tab;
        const container = document.getElementById('mobile-trade-content');
        if (!container) return;

        container.innerHTML = '';
        
        // Estilos de pestañas
        const vTab = document.getElementById('btn-trade-vendor-tab');
        const iTab = document.getElementById('btn-trade-inventory-tab');
        if(vTab) vTab.style.background = tab === 'Vendor' ? '#333' : 'transparent';
        if(iTab) iTab.style.background = tab === 'Inventory' ? '#333' : 'transparent';

        if (tab === 'Vendor') {
            const items = Vendor.vendorInventories[Vendor.currentVendorId]?.items || [];
            this.drawItemList(container, items, () => this.renderMobile('Vendor'), true);
        } else {
            this.drawInventory(container);
        }
    },

    drawItemList(container, items, refreshCb, isMobile = false) {
        items.forEach(item => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid #222; background:#111; margin-bottom:2px;';
            const price = item.price || (window.calculateSellPrice(item) * 4);
            
            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:32px; height:32px; border:1px solid #444; background:#000;">${window.getItemHtml(item)}</div>
                    <span style="font-size:13px;">${item.name}</span>
                </div>
                <button class="btn-secondary small" style="font-size:10px;">BUY ${price}g</button>
            `;

            row.querySelector('button').onclick = () => {
                if (window.player.gold >= price) {
                    if (window.player.addToInventory({...item})) {
                        window.player.gold -= price;
                        const idx = items.indexOf(item);
                        items.splice(idx, 1);
                        refreshCb();
                        if(window.renderInventory) window.renderInventory();
                    }
                }
            };
            container.appendChild(row);
        });
    },

    drawInventory(container) {
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)); gap:5px; padding:10px;';
        
        window.player.inventory.forEach((item, i) => {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            if (item) {
                slot.innerHTML = window.getItemHtml(item);
                slot.onclick = () => {
                    const p = window.calculateSellPrice(item);
                    if (confirm(`Sell ${item.name} for ${p}g?`)) {
                        window.player.gold += p;
                        window.player.inventory[i] = null;
                        this.renderMobile('Inventory');
                    }
                };
            }
            grid.appendChild(slot);
        });
        container.appendChild(grid);
    }
};
