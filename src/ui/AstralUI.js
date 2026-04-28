import { bus } from '../engine/EventBus.js';
import { MUTATION_TREES, getMutationMods } from '../data/mutationTrees.js';
import { ASTRAL_CONSTELLATION, getAstralStats, getAstralProcs } from '../data/astralConstellation.js';
import { getClass } from '../data/classes.js';

export const AstralUI = {
    init() {
        const style = document.createElement('style');
        style.textContent = `
            .astral-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85); z-index: 1000;
                display: none; flex-direction: column; align-items: center; justify-content: center;
                font-family: 'Cinzel', serif; color: #fff;
            }
            .astral-window {
                width: 90%; height: 85%; background: #0a0805; border: 2px solid #bf642f;
                box-shadow: 0 0 30px rgba(0,0,0,1); display: flex; flex-direction: column;
                position: relative; overflow: hidden;
            }
            .astral-header {
                padding: 15px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;
                background: linear-gradient(to bottom, #1a1510, #0a0805);
            }
            .astral-tabs { display: flex; gap: 10px; }
            .astral-tab {
                padding: 8px 20px; cursor: pointer; border: 1px solid #444; background: #15100a;
                transition: all 0.2s; font-size: 14px;
            }
            .astral-tab.active { background: #bf642f; border-color: #ffd700; color: #fff; }
            .astral-content { flex: 1; position: relative; overflow: auto; padding: 20px; }

            /* Mutation Styles */
            .mutation-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
            .mutation-card {
                background: #1a1510; border: 1px solid #333; padding: 15px; border-radius: 4px;
                display: flex; flex-direction: column; gap: 10px;
            }
            .mutation-card-header { display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #444; padding-bottom: 8px; }
            .mutation-node {
                background: #111; border: 1px solid #444; padding: 10px; margin-top: 5px; cursor: pointer;
                transition: all 0.2s; position: relative;
            }
            .mutation-node:hover { border-color: var(--gold); background: #1a1a1a; }
            .mutation-node.unlocked { border-color: #4caf50; }
            .mutation-node.maxed { border-color: var(--gold); box-shadow: inset 0 0 10px rgba(191, 100, 47, 0.5); }
            .mutation-node.locked { opacity: 0.5; cursor: not-allowed; }

            .perk-box {
                font-size: 10px; margin-top: 8px; padding: 6px; background: rgba(0,0,0,0.3);
                border-left: 2px solid #444; color: #888; transition: all 0.3s;
            }
            .mutation-node.maxed .perk-box {
                border-color: var(--gold); color: var(--gold); background: rgba(191, 100, 47, 0.1);
                text-shadow: 0 0 5px rgba(191, 100, 47, 0.5);
            }

            /* Astral Tree Canvas Style */
            #astral-canvas-container { width: 100%; height: 100%; position: relative; background: #000; overflow: hidden; cursor: grab; }
            #astral-canvas-container:active { cursor: grabbing; }

            .astral-info-panel {
                position: absolute; bottom: 20px; left: 20px; width: 300px;
                background: rgba(10, 8, 5, 0.9); border: 1px solid #bf642f; padding: 15px;
                pointer-events: none; opacity: 0; transition: opacity 0.2s;
            }

            .close-astral { cursor: pointer; font-size: 24px; color: #888; }
            .close-astral:hover { color: #fff; }

            .astral-point-display { color: #00ffff; font-weight: bold; text-shadow: 0 0 5px #00ffff; }
        `;
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.id = 'astral-overlay';
        overlay.className = 'astral-overlay';
        overlay.innerHTML = `
            <div class="astral-window">
                <div class="astral-header">
                    <div style="display:flex; align-items:center; gap:20px;">
                        <h2 style="margin:0; color:var(--gold);">ASTRAL RUNE CORE</h2>
                        <div class="astral-point-display">Astral Points: <span id="astral-points-val">0</span></div>
                    </div>
                    <div class="astral-tabs">
                        <div class="astral-tab active" data-tab="mutations">Skill Mutations</div>
                        <div class="astral-tab" data-tab="runes">Rune Core</div>
                        <div class="astral-tab" data-tab="fusion">Rune Fusion</div>
                        <div class="astral-tab" data-tab="constellation">Astral Constellation</div>
                    </div>
                    <div class="close-astral">&times;</div>
                </div>
                <div id="astral-content" class="astral-content">
                    <!-- Dynamic Content -->
                </div>
                <div id="astral-info-panel" class="astral-info-panel"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('.close-astral').onclick = () => this.hide();
        overlay.querySelectorAll('.astral-tab').forEach(tab => {
            tab.onclick = () => {
                overlay.querySelectorAll('.astral-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderTab(tab.dataset.tab);
            };
        });

        this.overlay = overlay;
        this.currentTab = 'mutations';
    },

    show() {
        this.overlay.style.display = 'flex';
        this.renderTab(this.currentTab);
        window.isAstralOpen = true;
    },

    hide() {
        this.overlay.style.display = 'none';
        window.isAstralOpen = false;
    },

    formatStats(stats) {
        if (!stats) return '';
        const labels = {
            flatSTR: 'Strength', flatINT: 'Intelligence', flatDEX: 'Dexterity',
            pctPhysDmg: 'Physical Damage', pctArmor: 'Total Armor',
            pctHP: 'Maximum Health', lifeRegenPerSec: 'Life Regen/s',
            pctElemDmg: 'Elemental Damage', pctFCR: 'Faster Cast Rate',
            critChance: 'Critical Strike Chance', manaRegenPerSec: 'Mana Regen/s',
            allRes: 'All Resistances', pctPoisonDmg: 'Poison Damage',
            pctShadowDmg: 'Shadow Damage', pctDmgVsCC: 'Damage vs Crowd Control',
            pctMoveSpeed: 'Movement Speed', pctFireDmg: 'Fire Damage',
            flatHP: 'Health', pctFireRes: 'Fire Resistance',
            lifeCostEnabled: 'Skills Cost Life', manaToLifeConv: 'Mana to Life Conversion',
            totalHpMult: 'Total Health', totalDmgMult: 'Total Damage',
            armorToEsConv: 'Armor to Energy Shield', armorMult: 'Total Armor',
            maxMinions: 'Max Minions', minionResistInherit: 'Minion Resistance Share',
            dmgPerAura: 'Damage per Active Aura', attackRangeBonus: 'Attack Range',
            deadlyStrike: 'Deadly Strike Chance', pctIAS: 'Attack Speed',
            minionDmgPct: 'Minion Damage', minionIasPct: 'Minion Attack Speed',
            minionHpPct: 'Minion Health', minionArmorPct: 'Minion Armor',
            minionLifestealShare: 'Minion Life Leech Share'
        };

        return Object.entries(stats).map(([key, val]) => {
            const label = labels[key] || key;
            const sign = val >= 0 ? '+' : '';
            const unit = key.startsWith('pct') || key.toLowerCase().includes('mult') || key.toLowerCase().includes('share') || key.toLowerCase().includes('inherit') ? '%' : '';
            const color = val >= 0 ? '#4caf50' : '#ff4444';
            return `<div style="display:flex; justify-content:space-between; gap:20px;">
                        <span style="color:#bbb;">${label}</span>
                        <span style="color:${color}; font-weight:bold;">${sign}${val}${unit}</span>
                    </div>`;
        }).join('');
    },

    renderTab(tab) {
        this.currentTab = tab;
        const container = document.getElementById('astral-content');
        const pointsVal = document.getElementById('astral-points-val');
        pointsVal.textContent = window.player.astralPoints;

        document.getElementById('astral-info-panel').style.opacity = '0';

        if (tab === 'mutations') this.renderMutations(container);
        else if (tab === 'runes') this.renderRuneCore(container);
        else if (tab === 'fusion') this.renderFusion(container);
        else if (tab === 'constellation') this.renderConstellation(container);
    },

    renderFusion(container) {
        import('../data/runes.js').then(({ SUPPORT_RUNES }) => {
            const player = window.player;
            container.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; gap:30px; padding:20px;">
                    <h3 style="color:var(--gold); margin:0;">LEGENDARY RUNE FUSION</h3>
                    <p style="font-size:12px; color:#888; max-width:600px; text-align:center;">
                        Combine standard support runes to forge legendary variants with immense power.
                    </p>
                    <div class="fusion-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px; width:100%;"></div>
                </div>
            `;

            const grid = container.querySelector('.fusion-grid');

            Object.entries(SUPPORT_RUNES).forEach(([id, rune]) => {
                if (!rune.fusion) return;

                const card = document.createElement('div');
                card.style.cssText = 'background:#1a1510; border:1px solid #bf642f; padding:15px; border-radius:4px; display:flex; flex-direction:column; gap:10px;';
                
                const hasIngredients = rune.fusion.every(ingId => 
                    player.inventory.some(item => item && item.type === 'support_rune' && item.baseId === ingId)
                );

                card.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="assets/${rune.icon}.png" style="width:32px; height:32px; image-rendering:pixelated;" onerror="this.src='assets/item_rune_el.png'">
                        <div style="color:var(--gold); font-weight:bold;">${rune.name}</div>
                    </div>
                    <div style="font-size:11px; color:#ccc;">${JSON.stringify(rune.mod)}</div>
                    <div style="font-size:10px; color:#888; margin-top:5px;">Required Runes:</div>
                    <div style="display:flex; gap:5px;">
                        ${rune.fusion.map(ingId => {
                            const ing = SUPPORT_RUNES[ingId];
                            const playerHas = player.inventory.some(item => item && item.type === 'support_rune' && item.baseId === ingId);
                            return `<div title="${ing.name}" style="width:24px; height:24px; background:rgba(0,0,0,0.5); border:1px solid ${playerHas ? '#4caf50' : '#ff4444'}; display:flex; align-items:center; justify-content:center;"><i class="ra ${ing.icon}" style="font-size:14px; color:${playerHas ? '#fff' : '#666'}"></i></div>`;
                        }).join('')}
                    </div>
                    <button class="btn-fusion" style="margin-top:10px; padding:8px; background:${hasIngredients ? '#bf642f' : '#333'}; border:none; color:#fff; cursor:${hasIngredients ? 'pointer' : 'not-allowed'}; font-family:inherit;" ${hasIngredients ? '' : 'disabled'}>
                        FUSE RUNE
                    </button>
                `;

                card.querySelector('.btn-fusion').onclick = () => {
                    if (hasIngredients) {
                        // Consume ingredients
                        rune.fusion.forEach(ingId => {
                            const idx = player.inventory.findIndex(item => item && item.type === 'support_rune' && item.baseId === ingId);
                            if (idx !== -1) player.inventory[idx] = null;
                        });
                        // Add fused rune
                        player.addToInventory({
                            id: `rune_${Date.now()}`,
                            baseId: id,
                            name: rune.name,
                            type: 'support_rune',
                            icon: rune.icon,
                            mod: rune.mod,
                            rarity: 'unique'
                        });
                        bus.emit('combat:log', { text: `Forged Legendary Rune: ${rune.name}!`, cls: 'log-info' });
                        this.renderFusion(container);
                    }
                };

                grid.appendChild(card);
            });
        });
    },

    renderMutations(container) {
        const player = window.player;
        container.innerHTML = '<div class="mutation-grid"></div>';
        const grid = container.querySelector('.mutation-grid');

        const learnedSkills = Object.keys(player.skillMap).filter(id => player.effectiveSkillLevel(id) > 0);

        if (learnedSkills.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:100px; color:#666;">Learn skills in your Talent Tree to unlock mutations.</div>';
            return;
        }

        learnedSkills.forEach(skillId => {
            const skill = player.skillMap[skillId];
            const mastery = player.skillMastery[skillId] || { lvl: 1, xp: 0, points: 0 };
            const tree = MUTATION_TREES[skillId] || [];

            const card = document.createElement('div');
            card.className = 'mutation-card';
            card.innerHTML = `
                <div class="mutation-card-header">
                    <div style="font-size:24px;">${skill.icon || '⚔️'}</div>
                    <div>
                        <div style="color:var(--gold); font-weight:bold;">${skill.name}</div>
                        <div style="font-size:10px; color:#888;">Mastery Lv ${mastery.lvl} | Points: <span style="color:#4caf50;">${mastery.points}</span></div>
                    </div>
                </div>
                <div class="mutation-nodes"></div>
            `;

            const nodesContainer = card.querySelector('.mutation-nodes');

            tree.forEach((node, idx) => {
                const spent = (player.mutationTrees[skillId]?.pointsSpent || {})[node.id] || 0;
                const nodeEl = document.createElement('div');
                nodeEl.className = 'mutation-node';
                if (spent > 0) nodeEl.classList.add(spent >= node.max ? 'maxed' : 'unlocked');

                // Symbiosis: Check Talent Tree base level
                const baseLvl = player.talents.baseLevel(skillId);
                const reqBaseLvl = node.reqBaseLevel || (idx === 0 ? 1 : 5); // Default: 1st node req lv1, others lv5
                const talentMet = baseLvl >= reqBaseLvl;

                let locked = !talentMet;
                if (!locked && node.req) {
                    const [reqId, reqLvl] = node.req.split(':');
                    const reqSpent = (player.mutationTrees[skillId]?.pointsSpent || {})[reqId] || 0;
                    if (reqSpent < parseInt(reqLvl)) locked = true;
                }
                if (locked) nodeEl.classList.add('locked');

                nodeEl.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span style="font-weight:bold; font-size:12px;">${node.name}</span>
                        <span style="color:var(--gold); font-size:10px;">${spent}/${node.max}</span>
                    </div>
                    <div style="font-size:10px; color:#ccc;">${node.desc}</div>
                    ${!talentMet ? `<div style="color:#ff4444; font-size:9px; margin-top:4px;">Requires Base Skill Lv ${reqBaseLvl}</div>` : ''}
                    ${node.masteryPerk ? `<div class="perk-box"><strong>MASTERY PERK:</strong> ${node.masteryPerk}</div>` : ''}
                `;

                nodeEl.onclick = () => {
                    if (locked) {
                        const msg = !talentMet ? `Requires Base Skill Lv ${reqBaseLvl}` : `Pre-requisite mutation not met`;
                        bus.emit('combat:log', { text: msg, cls: 'log-dmg' });
                        return;
                    }
                    if (mastery.points > 0 && spent < node.max) {
                        mastery.points--;
                        if (!player.mutationTrees[skillId]) player.mutationTrees[skillId] = { pointsSpent: {} };
                        player.mutationTrees[skillId].pointsSpent[node.id] = (player.mutationTrees[skillId].pointsSpent[node.id] || 0) + 1;
                        player.invalidateStats();
                        this.renderTab('mutations');
                    }
                };

                nodesContainer.appendChild(nodeEl);
            });

            grid.appendChild(card);
        });
    },

    renderRuneCore(container) {
        container.innerHTML =
            '<div style="display:flex; flex-direction:column; align-items:center; gap:30px; padding:20px;">' +
            '<h3 style="color:var(--gold); margin:0;">SOCKET SUPPORT RUNES</h3>' +
            '<div id="rune-skill-list" style="display:flex; flex-wrap:wrap; gap:15px; justify-content:center;"></div>' +
            '<div style="background:#15100a; border:1px solid #444; padding:20px; width:80%; max-width:600px;">' +
            '<h4 style="margin-top:0; border-bottom:1px solid #333; padding-bottom:10px;">Support Runes in Inventory</h4>' +
            '<div id="astral-rune-inv" style="display:grid; grid-template-columns: repeat(auto-fill, 40px); gap:10px;"></div>' +
            '</div>' +
            '</div>';

        const player = window.player;
        const skillList = container.querySelector('#rune-skill-list');
        const learnedSkills = Object.keys(player.skillMap).filter(
            id => player.effectiveSkillLevel(id) > 0 && player.skillMap[id].type === 'active'
        );

        learnedSkills.forEach(skillId => {
            const skill = player.skillMap[skillId];
            const slots = player.runeSlots[skillId] || [null, null, null];
            if (!player.runeSlots[skillId]) player.runeSlots[skillId] = slots;

            const div = document.createElement('div');
            div.style.cssText = 'background:#1a1510; border:1px solid #bf642f; padding:10px; display:flex; flex-direction:column; align-items:center; gap:10px;';

            const label = document.createElement('div');
            label.style.cssText = 'font-weight:bold; font-size:12px; color:var(--gold);';
            label.textContent = skill.name;
            div.appendChild(label);

            const socketsRow = document.createElement('div');
            socketsRow.style.cssText = 'display:flex; gap:8px;';

            slots.forEach((rune, i) => {
                const socket = document.createElement('div');
                socket.className = 'rune-socket';
                socket.dataset.skill = skillId;
                socket.dataset.idx = i;
                socket.style.cssText = 'width:32px; height:32px; background:rgba(0,0,0,0.5); border:1px dashed #666; display:flex; align-items:center; justify-content:center; cursor:pointer;';

                if (rune) {
                    const icon = document.createElement('i');
                    icon.className = 'ra ' + rune.icon;
                    icon.style.cssText = 'font-size:20px; color:#00ffff;';
                    socket.appendChild(icon);
                }

                socket.onclick = () => {
                    const idx = parseInt(socket.dataset.idx);
                    if (player.runeSlots[skillId][idx]) {
                        player.addToInventory(player.runeSlots[skillId][idx]);
                        player.runeSlots[skillId][idx] = null;
                        player.invalidateStats();
                        this.renderRuneCore(container);
                    }
                };

                socket.ondragover = (e) => e.preventDefault();

                socket.ondrop = (e) => {
                    const invIdx = parseInt(e.dataTransfer.getData('invIdx'));
                    const item = player.inventory[invIdx];
                    if (item && item.type === 'support_rune') {
                        const old = player.runeSlots[skillId][socket.dataset.idx];
                        player.runeSlots[skillId][socket.dataset.idx] = item;
                        player.inventory[invIdx] = old;
                        player.invalidateStats();
                        this.renderRuneCore(container);
                    }
                };

                socketsRow.appendChild(socket);
            });

            div.appendChild(socketsRow);
            skillList.appendChild(div);
        });

        const invDiv = container.querySelector('#astral-rune-inv');
        player.inventory.forEach((item, i) => {
            if (item && item.type === 'support_rune') {
                const el = document.createElement('div');
                el.style.cssText = 'width:40px; height:40px; background:#222; border:1px solid #444; display:flex; align-items:center; justify-content:center; cursor:grab;';

                const icon = document.createElement('i');
                icon.className = 'ra ' + item.icon;
                icon.style.cssText = 'font-size:24px; color:#00ffff;';
                el.appendChild(icon);

                el.draggable = true;
                el.ondragstart = (e) => e.dataTransfer.setData('invIdx', i);
                invDiv.appendChild(el);
            }
        });
    },

    renderConstellation(container) {
        container.style.padding = '0';
        container.innerHTML = '<div id="astral-canvas-container"><canvas id="astral-canvas"></canvas></div>';

        const canvas = document.getElementById('astral-canvas');
        const ctx = canvas.getContext('2d');
        const parent = document.getElementById('astral-canvas-container');
        const infoPanel = document.getElementById('astral-info-panel');

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        let zoom = 1.0;
        let offsetX = canvas.width / 2;
        let offsetY = canvas.height / 2;

        const stars = Array.from({ length: 100 }, () => ({
            x: Math.random() * 2000 - 1000,
            y: Math.random() * 2000 - 1000,
            size: Math.random() * 2,
            opacity: Math.random()
        }));

        const draw = () => {
            ctx.fillStyle = '#0a0805';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(zoom, zoom);

            // Draw Stars
            stars.forEach(s => {
                ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw connections
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)';
            ctx.lineWidth = 1;
            ASTRAL_CONSTELLATION.nodes.forEach(node => {
                if (node.req) {
                    node.req.forEach(reqId => {
                        const parentNode = ASTRAL_CONSTELLATION.nodes.find(n => n.id === reqId);
                        if (parentNode) {
                            ctx.beginPath();
                            ctx.moveTo(parentNode.pos.x * 5, parentNode.pos.y * 5);
                            ctx.lineTo(node.pos.x * 5, node.pos.y * 5);
                            ctx.stroke();
                        }
                    });
                }
            });

            // Draw nodes
            ASTRAL_CONSTELLATION.nodes.forEach(node => {
                const pts = window.player.astralTree[node.id] || 0;
                const active = pts > 0;
                const isElder = node.id >= 100;

                ctx.beginPath();
                if (isElder) {
                    // Draw diamond for elder keynodes
                    const x = node.pos.x * 5, y = node.pos.y * 5;
                    ctx.moveTo(x, y - 12);
                    ctx.lineTo(x + 12, y);
                    ctx.lineTo(x, y + 12);
                    ctx.lineTo(x - 12, y);
                    ctx.closePath();
                } else {
                    ctx.arc(node.pos.x * 5, node.pos.y * 5, 8, 0, Math.PI * 2);
                }

                ctx.fillStyle = active ? (isElder ? '#ffd700' : '#00ffff') : '#222';
                ctx.fill();
                ctx.strokeStyle = active ? '#fff' : (isElder ? '#bf642f' : '#444');
                ctx.lineWidth = active ? 2 : 1;
                ctx.stroke();

                if (active) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = isElder ? '#ffd700' : '#00ffff';
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }

                ctx.fillStyle = isElder ? '#bf642f' : '#888';
                ctx.font = `${isElder ? 'bold ' : ''}10px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(node.name, node.pos.x * 5, node.pos.y * 5 + (isElder ? 25 : 18));
            });

            ctx.restore();
        };

        draw();

        // Pan / Zoom & Hover Tooltips
        let isDragging = false;
        let lastX, lastY;

        parent.onmousedown = (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; };
        
        window.onmousemove = (e) => {
            if (isDragging) {
                offsetX += e.clientX - lastX;
                offsetY += e.clientY - lastY;
                lastX = e.clientX;
                lastY = e.clientY;
                draw();
                return;
            }

            // Hover tooltip logic
            if (this.currentTab === 'constellation' && !isDragging) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left - offsetX) / zoom;
                const mouseY = (e.clientY - rect.top - offsetY) / zoom;

                let hoveredNode = null;
                ASTRAL_CONSTELLATION.nodes.forEach(node => {
                    const dx = mouseX - (node.pos.x * 5);
                    const dy = mouseY - (node.pos.y * 5);
                    if (dx * dx + dy * dy < 150) {
                        hoveredNode = node;
                    }
                });

                if (hoveredNode) {
                    canvas.style.cursor = 'pointer';
                    infoPanel.style.opacity = '1';
                    infoPanel.innerHTML = `
                        <h3 style="margin:0; color:var(--gold); text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);">${hoveredNode.name}</h3>
                        <div style="font-size:12px; color:#ddd; margin-top:8px;">
                            ${hoveredNode.special ? `<p style="color:#ffd700; border-left: 2px solid #ffd700; padding-left: 6px;"><strong>ELDER POWER:</strong> ${hoveredNode.special}</p>` : ''}
                            ${hoveredNode.proc ? `<p style="color:#00ffff; border-left: 2px solid #00ffff; padding-left: 6px;"><strong>CELESTIAL PROC:</strong> ${hoveredNode.proc.effect.replace(/_/g, ' ')}</p>` : ''}
                            ${hoveredNode.stats ? `<p>Grants: <span style="color:#4caf50;">${JSON.stringify(hoveredNode.stats).replace(/[{}"']/g, '').replace(/:/g, ': +')}</span></p>` : ''}
                            <div style="margin-top: 10px; font-size:10px; background: rgba(0,0,0,0.5); padding: 4px; text-align: center; border: 1px solid #444;">
                                Level: <span style="color:#00ffff;">${window.player.astralTree[hoveredNode.id] || 0}/${hoveredNode.max}</span>
                            </div>
                        </div>
                    `;
                } else {
                    canvas.style.cursor = 'grab';
                    infoPanel.style.opacity = '0';
                }
            }
        };

        window.onmouseup = () => { isDragging = false; };
        
        parent.onwheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            zoom = Math.min(2.5, Math.max(0.3, zoom * delta));
            draw();
        };

        parent.onclick = (e) => {
            if (isDragging) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left - offsetX) / zoom;
            const mouseY = (e.clientY - rect.top - offsetY) / zoom;

            let clickedNode = null;
            ASTRAL_CONSTELLATION.nodes.forEach(node => {
                const dx = mouseX - (node.pos.x * 5);
                const dy = mouseY - (node.pos.y * 5);
                if (dx * dx + dy * dy < 200) {
                    clickedNode = node;
                }
            });

            if (clickedNode) {
                this.tryUnlockAstral(clickedNode);
                draw(); // Redraw to update active states
            }
        };
    },

    tryUnlockAstral(node) {
        const player = window.player;
        const pts = player.astralTree[node.id] || 0;

        if (pts >= node.max) return;

        if (node.req) {
            const met = node.req.every(reqId => (player.astralTree[reqId] || 0) > 0);
            if (!met) {
                bus.emit('combat:log', { text: 'Requirements not met for this star!', cls: 'log-dmg' });
                return;
            }
        }

        if (player.astralPoints > 0) {
            player.astralPoints--;
            player.astralTree[node.id] = (player.astralTree[node.id] || 0) + 1;
            player.invalidateStats();
            bus.emit('combat:log', { text: `Activated ${node.name}!`, cls: 'log-info' });
            
            // Sparkle effect
            const pointsVal = document.getElementById('astral-points-val');
            pointsVal.textContent = player.astralPoints;
            pointsVal.style.transition = 'none';
            pointsVal.style.textShadow = '0 0 20px #fff, 0 0 40px #00ffff';
            pointsVal.style.color = '#fff';
            setTimeout(() => {
                pointsVal.style.transition = 'all 1s';
                pointsVal.style.textShadow = '0 0 5px #00ffff';
                pointsVal.style.color = '#00ffff';
            }, 50);

        } else {
            bus.emit('combat:log', { text: 'No Astral Points!', cls: 'log-dmg' });
        }
    }
};