
// This is a new file to contain the mobile-specific trading UI logic,
// to avoid further corrupting main.js.

export function renderMobileTrade(activeTab = 'Vendor') {
    const container = document.getElementById('mobile-trade-content');
    if (!container) return;

    // These need to be globally available or passed in.
    // For now, we assume they are on the window object for simplicity.
    const player = window.player;
    const vendorInventories = window.vendorInventories;
    const currentVendorId = window.currentVendorId;
    let currentShopTab = window.currentShopTab || 'All';

    if (!player || !vendorInventories || !currentVendorId) {
        console.error("Required objects (player, vendorInventories, currentVendorId) not found on window.");
        return;
    }

    const vendorTabBtn = document.getElementById('btn-trade-vendor-tab');
    const invTabBtn = document.getElementById('btn-trade-inventory-tab');

    if(vendorTabBtn) {
        vendorTabBtn.style.background = activeTab === 'Vendor' ? '#333' : 'transparent';
        vendorTabBtn.style.color = activeTab === 'Vendor' ? '#fff' : '#888';
    }
    if(invTabBtn){
        invTabBtn.style.background = activeTab === 'Inventory' ? '#333' : 'transparent';
        invTabBtn.style.color = activeTab === 'Inventory' ? '#fff' : '#888';
    }


    container.innerHTML = '';
    const goldDisplay = document.createElement('div');
    goldDisplay.innerHTML = `<div style="padding:10px; text-align:right; color:var(--gold); border-bottom:1px solid #333;">Your Gold: ${player.gold}</div>`;
    container.appendChild(goldDisplay);

    if (activeTab === 'Vendor') {
        const vendorData = vendorInventories[currentVendorId];
        const vendorItems = vendorData?.items || [];
        
        const tabsContainer = document.createElement('div');
        tabsContainer.style.cssText = 'display:flex; gap: 4px; margin: 8px 0; border-bottom: 1px solid #333; padding-bottom: 6px; flex-wrap: wrap;';
        
        const itemTypesInStock = new Set(vendorItems.map(it => it.type).filter(Boolean));
        const tabLabels = ['All', ...itemTypesInStock];

        tabLabels.forEach(label => {
            const tab = document.createElement('button');
            tab.textContent = label.charAt(0).toUpperCase() + label.slice(1);
            tab.className = 'btn-secondary small';
            if (label === currentShopTab) {
                tab.classList.add('active');
                tab.style.borderColor = 'var(--gold)';
                tab.style.color = 'var(--gold)';
            }
            tab.onclick = () => { window.currentShopTab = label; renderMobileTrade('Vendor'); };
            tabsContainer.appendChild(tab);
        });

        const restockButton = document.createElement('button');
        restockButton.textContent = 'Restock (50g)';
        restockButton.className = 'btn-secondary small';
        restockButton.style.marginLeft = 'auto';
        restockButton.onclick = () => {
            if (player.gold >= 50) {
                player.gold -= 50;
                // Assumes this function is globally available
                window.generateVendorStock(currentVendorId);
                window.currentShopTab = 'All';
                renderMobileTrade('Vendor');
            } else {
                window.addCombatLog('Not enough gold to restock!', 'log-dmg');
            }
        };
        tabsContainer.appendChild(restockButton);
        container.appendChild(tabsContainer);

        const itemsToDisplay = currentShopTab === 'All' ? vendorItems : vendorItems.filter(it => it.type === currentShopTab);
        itemsToDisplay.forEach(item => {
             const row = document.createElement('div');
            row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:6px; border-bottom:1px solid #222;';
            const price = item.price || window.calculateSellPrice(item) * 4;
            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:32px; height:32px; border:1px solid #444; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center;">
                        ${window.getItemHtml(item)}
                    </div>
                    <span class="tooltip-trigger">${item.name}</span>
                </div>
                <button class="btn-secondary small">Buy (${price}g)</button>
            `;
            // Assumes showTooltip and hideTooltip are global
            row.querySelector('.tooltip-trigger').addEventListener('mouseenter', e => window.showTooltip(item, e.clientX, e.clientY));
            row.querySelector('.tooltip-trigger').addEventListener('mouseleave', window.hideTooltip);
            row.querySelector('button').addEventListener('click', () => {
                if (player.gold >= price) {
                    if (player.addToInventory({ ...item })) {
                        player.gold -= price;
                        const itemIndex = vendorItems.findIndex(vi => vi === item);
                        if (itemIndex > -1) vendorItems.splice(itemIndex, 1);
                        renderMobileTrade('Vendor');
                    } else window.addCombatLog('Inventory full!', 'log-dmg');
                } else window.addCombatLog('Not enough gold!', 'log-dmg');
            });
            container.appendChild(row);
        });

    } else if (activeTab === 'Inventory') {
        const invGrid = document.createElement('div');
        invGrid.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fill, minmax(48px, 1fr)); gap: 5px; padding: 5px;';
        player.inventory.forEach((item, i) => {
            const cell = document.createElement('div');
            cell.className = 'inv-slot';
            if (item) {
                cell.innerHTML = window.getItemHtml(item);
                cell.addEventListener('click', () => {
                    const price = window.calculateSellPrice(item);
                    if (confirm(`Sell \${item.name} for \${price} gold?`)) {
                        player.gold += price;
                        player.inventory[i] = null;
                        renderMobileTrade('Inventory');
                    }
                });
            }
            invGrid.appendChild(cell);
        });
        container.appendChild(invGrid);
    }
}
