// ——— UTILITIES & SYSTEMS ———

function unlockAchievement(id, name) {
    if (unlockedAchievements.has(id)) return;
    unlockedAchievements.add(id);
    const pop = $('achievement-popup');
    if (pop) {
        pop.querySelector('.ach-name').textContent = name;
        pop.classList.add('active');
        if (input.isMobile) input.vibrate([20, 50, 100]);
        setTimeout(() => pop.classList.remove('active'), 4000);
    }
}

function updateWeather(dt) {
    if (state !== 'GAME' || !player) return;
    const theme = window.currentTheme || 'town';
    if (theme === 'snow') fx.emitBlizzard(renderer.width, renderer.height);
    else if (theme === 'desert') fx.emitSand(renderer.width, renderer.height);
    else if (theme === 'hell') fx.emitEmbers(renderer.width, renderer.height);
    else if (theme === 'jungle' || theme === 'temple' || theme === 'grass') fx.emitRain(renderer.width, renderer.height);
}

async function fadeTransition(action) {
    const fade = $('fade-overlay');
    if (fade) fade.classList.add('active');
    await new Promise(r => setTimeout(r, 500));
    await action();
    if (fade) fade.classList.remove('active');
}

function checkSecretAchievement(enemy) {
    if (enemy.isBoss && bossDamageTaken === 0) {
        unlockAchievement('secret_immortal', 'The Untouchable (Defeat boss without taking damage)');
    }
}

bus.on('player:damaged', (amt) => {
    if (bossFightActive) bossDamageTaken += amt;
});

let lastSentX = 0, lastSentY = 0;
let bossFightActive = false;
let bossDamageTaken = 0;

function gameLoop(timestamp) {
    if (state !== 'GAME' || !player) return;
    const rawDt = Math.min(0.1, (timestamp - lastTime) / 1000);
    const dt = rawDt * timeScale;
    lastTime = timestamp;

    updateWeather(dt);

    if (timeScale < 1.0) timeScale = Math.min(1.0, timeScale + rawDt * 0.8);

    // --- Systems Update ---
    if (input) input.update();
    if (network) network.update(dt);
    if (window.mobileControls) window.mobileControls.update(player);

    if (camera) {
        camera.w = renderer.width; camera.h = renderer.height;
        camera.update(dt);
        renderer.setCamera(camera.x, camera.y);
        renderer.updateShake(dt);
    }

    // Player & Network Sync
    player.update(dt, input, enemies, dungeon, (aoe) => aoeZones.push(aoe));

    if (network && network.isConnected) {
        const distMoved = Math.sqrt(Math.pow(player.x - lastSentX, 2) + Math.pow(player.y - lastSentY, 2));
        if (distMoved > 2 || player.animState !== player._lastSentAnim) {
            network.sendMovement(player.x, player.y, player.animState, player.facingDir);
            lastSentX = player.x; lastSentY = player.y; player._lastSentAnim = player.animState;
        }
        if (network.isHost) {
            if (enemies.length > 0) network.sendEnemySync(enemies.map(e => ({ id: e.syncId, x: e.x, y: e.y, hp: e.hp, anim: e.animState, dir: e.facingDir })));
            if (npcs.length > 0) network.socket.emit('npc_sync', npcs.map(n => ({ id: n.id, x: n.x, y: n.y })));
        }
        if (player.minions.length > 0) network.socket.emit('minion_sync', player.minions.map(m => ({ x: m.x, y: m.y, icon: m.icon, hp: m.hp, maxHp: m.maxHp })));
        if (mercenary && mercenary.hp > 0) network.socket.emit('merc_sync', { x: mercenary.x, y: mercenary.y, icon: mercenary.icon, hp: mercenary.hp, maxHp: mercenary.maxHp });
    }

    // Regen & Aura Pulsar
    if (player.hp > 0 && player.hp < player.maxHp) {
        let hpReg = (player.lifeRegenPerSec || 0) * dt;
        if (performance.now() - lastHitTime > 5000) hpReg += player.maxHp * 0.005 * dt;
        player.hp = Math.min(player.maxHp, player.hp + hpReg);
    }
    if (player.mp < player.maxMp && player.hp > 0) player.mp = Math.min(player.maxMp, player.mp + (player.maxMp * 0.003 + (player.manaRegenPerSec || 0)) * dt);

    if (fx) {
        fx.update(dt * 1000);
        processAuraPulsar(player, enemies, dt);
        if (player.itemAuras?.has('shadowmourne') && Math.random() < 0.15) fx.emitBurst(player.x, player.y - 15, '#a040ff', 1, 2.5);
        if (player.itemAuras?.has('frostmourne') && Math.random() < 0.15) fx.emitBurst(player.x, player.y + 5, '#6af', 2, 1.2);
        if (player.itemAuras?.has('ashbringer') && Math.random() < 0.15) fx.emitHolyBurst(player.x, player.y, 1);
    }

    // AI & Entities
    for (const e of (enemies || [])) e.update(dt, player, dungeon, enemies);
    for (const n of npcs) n.update(dt);
    if (activePet) activePet.update(dt, player, droppedGold, droppedItems);
    player.updateMinions(dt, enemies, dungeon);
    
    if (mercenary && mercenary.hp > 0) {
        mercenary.update(dt, player, enemies, dungeon);
    }

    checkDeaths();
    updateRespawns();
    checkAchievements();

    // Projectiles & AoE
    projectiles.forEach(p => { if (p && p.update) p.update(dt, enemies, player, dungeon, (aoe) => aoeZones.push(aoe)); });
    projectiles = projectiles.filter(p => p && p.active);
    aoeZones.forEach(a => { if (a && a.update) a.update(dt, enemies, player); });
    aoeZones = aoeZones.filter(a => a && a.active);
    updateStatuses([player, ...enemies, ...npcs, ...(mercenary ? [mercenary] : [])], dt);

    // Interaction & Pickups
    if (input.click) { checkInteractions(input.click); input.click = null; }
    for (let i = droppedGold.length - 1; i >= 0; i--) {
        const dg = droppedGold[i];
        if (Math.hypot(player.x - dg.x, player.y - dg.y) < 45 || dg._pickedByPet) {
            player.gold += dg.amount;
            addCombatLog(`Picked ${dg.amount} Gold`, 'log-heal');
            bus.emit('gold:pickup', { amount: dg.amount });
            droppedGold.splice(i, 1);
            updateHud();
        }
    }

    // Dialogue Pos
    const currentMenuFocus = activeDialogueNpc || activeWaypointObj;
    if (currentMenuFocus) {
        const picker = $('dialogue-picker');
        if (picker) {
            const screen = camera.toScreen(currentMenuFocus.x, currentMenuFocus.y);
            picker.style.left = `${screen.x - 110}px`; picker.style.top = `${screen.y - 180}px`;
            if (Math.hypot(player.x - currentMenuFocus.x, player.y - currentMenuFocus.y) > 120) {
                picker.remove(); activeDialogueNpc = null; activeWaypointObj = null;
            }
        } else { activeDialogueNpc = null; activeWaypointObj = null; }
    }

    if (player.hp <= 0) { checkDeaths(); return; }

    // --- Render Start ---
    renderer.clear();
    dungeon.render(renderer, camera);
    camera.apply(renderer.ctx);

    // Path trail
    if (player.path?.length > 0) {
        renderer.ctx.save(); renderer.ctx.globalAlpha = 0.4; renderer.ctx.fillStyle = '#ff0';
        for (let i = 0; i < player.path.length; i++) {
            const p = player.path[i];
            renderer.ctx.beginPath(); renderer.ctx.arc(p.x, p.y, Math.max(0.5, 2 - i/player.path.length), 0, Math.PI*2); renderer.ctx.fill();
        }
        renderer.ctx.restore();
    }

    // Dropped Items
    for (const di of droppedItems) {
        if (lootFilter >= 1 && (!di.rarity || di.rarity === 'normal')) continue;
        if (lootFilter >= 2 && di.rarity === 'magic') continue;
        if (['unique', 'set', 'rare'].includes(di.rarity) && fx && Math.random() < 0.1) fx.emitLootBeam(di.x, di.y, di.rarity === 'unique' ? '#bf642f' : (di.rarity === 'set' ? '#0f0' : '#f0d030'));
        renderer.drawSprite(di.icon, di.x, di.y, 14);
        renderer.ctx.font = '4px Cinzel'; renderer.ctx.textAlign = 'center';
        renderer.ctx.fillStyle = di.rarity === 'unique' ? '#e8a020' : (di.rarity === 'set' ? '#0f0' : '#aaa');
        renderer.ctx.fillText(di.name, di.x, di.y + 10);
    }

    // Boss Phase HUD
    const boss = enemies.find(e => e.type === 'boss');
    const hpBar = $('boss-hp-bar');
    if (boss && boss.hp > 0) {
        hpBar.classList.remove('hidden');
        const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
        $('boss-hp-fill').style.width = `${pct}%`;
        $('boss-hp-text').textContent = `${Math.ceil(pct)}%`;
        $('boss-name').textContent = boss.name || 'Act Boss';
        if (pct < 50 && !boss._phase2Triggered) {
            boss._phase2Triggered = true;
            boss.moveSpeed *= 1.4; boss.atkSpeed *= 1.3;
            renderer.shake(15);
            if (fx) fx.emitBurst(boss.x, boss.y, '#ff0000', 40, 4);
            addCombatLog(`${boss.name} enters a FURY!`, 'log-crit');
            boss.isEnraged = true;
        }
    } else if (hpBar) hpBar.classList.add('hidden');

    // Sorting Entities
    const drawEntities = [...(enemies || []), player, ...(mercenary && mercenary.hp > 0 ? [mercenary] : [])].filter(e => e).sort((a,b) => a.y - b.y);
    const auraColors = { might_aura: '#ffd700', prayer_aura: '#40c040', holy_fire_aura: '#ff4000', resist_all: '#4080ff', vigor: '#ffffff', fanaticism: '#ffa000', conviction: '#a040ff' };
    
    // Unified Aura & Character Render
    for (const e of drawEntities) {
        if (e.isPlayer) {
            let displayColor = '#ffe880';
            if (e === player && allActiveAuraColors.length > 0) displayColor = allActiveAuraColors[Math.floor(lastTime / 1500) % allActiveAuraColors.length];
            else if (e.activeAura) displayColor = auraColors[e.activeAura] || '#ffe880';

            if ((e === player && allActiveAuraColors.length > 0) || (e !== player && e.activeAura)) {
                const pulse = 0.3 + Math.sin(lastTime * 0.004) * 0.15;
                const auraRadius = 25 + Math.sin(lastTime * 0.003) * 3;
                renderer.ctx.save(); renderer.ctx.globalAlpha = pulse; renderer.ctx.strokeStyle = displayColor; renderer.ctx.lineWidth = 1.5;
                renderer.ctx.beginPath(); renderer.ctx.ellipse(e.x, e.y + 2, auraRadius, auraRadius * 0.4, 0, 0, Math.PI * 2); renderer.ctx.stroke();
                renderer.ctx.restore();
            }
            renderer.drawAnim(`class_${e.classId}`, e.x, e.y - 4, 18, e.animState, e.facingDir, lastTime, null, e.equipment, e.hitFlashTimer);
            e.renderMinions(renderer, lastTime);
        } else e.render(renderer, lastTime);
    }

    // Other Players & MMO UI
    if (network?.otherPlayers) {
        network.otherPlayers.forEach(op => {
            renderer.drawAnim(`class_${op.classId || 'warrior'}`, op.x, op.y-4, 18, op.animState || 'idle', op.facingDir || 'south', lastTime);
            renderer.ctx.font = 'bold 7px Cinzel'; renderer.ctx.textAlign = 'center'; renderer.ctx.fillStyle = '#8af';
            renderer.ctx.fillText(op.name || 'Player', op.x, op.y - 20);
            
            // Speech Bubble
            const bubble = speechBubbles.get(op.charName || op.name);
            if (bubble && Date.now() < bubble.expires) {
                renderer.ctx.save(); renderer.ctx.font = 'bold 10px Arial';
                const metrics = renderer.ctx.measureText(bubble.text);
                const bw = metrics.width + 12; const bh = 16;
                renderer.ctx.fillStyle = 'white'; renderer.ctx.strokeStyle = '#000'; renderer.ctx.lineWidth = 1;
                renderer.ctx.beginPath(); renderer.ctx.roundRect(op.x - bw / 2, op.y - 45, bw, bh, 4); renderer.ctx.fill(); renderer.ctx.stroke();
                renderer.ctx.fillStyle = '#000'; renderer.ctx.textAlign = 'center'; renderer.ctx.fillText(bubble.text, op.x, op.y - 40);
                renderer.ctx.restore();
            }
        });
    }

    npcs.forEach(n => n.render(renderer, lastTime));
    gameObjects.forEach(obj => {
        if (obj.isRiftPortal || obj.id === 'rift_portal') {
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2; const dist = 30 + Math.random() * 20;
                fx.getParticle().reset(obj.x + Math.cos(angle) * dist, obj.y + Math.sin(angle) * dist, (obj.x - (obj.x + Math.cos(angle) * dist)) * 0.08, (obj.y - (obj.y + Math.sin(angle) * dist)) * 0.08, 400, '#0ff', 1);
            }
        }
        obj.render(renderer, lastTime);
    });

    projectiles.forEach(p => p.render(renderer, lastTime));
    aoeZones.forEach(a => a.render(renderer, lastTime));

    renderer.ctx.restore(); // Exit camera space

    // VFX Pass
    if (fx) fx.renderScreen(renderer.ctx, camera);

    // Narrative Vision lighting
    if (player && renderer && camera) {
        const screen = camera.toScreen(player.x, player.y - 15);
        const baseRadius = (160 + (player.lightRadius || 0));
        let flicker = Math.sin(Date.now() / 150) * 8;
        let ambient = 'rgba(0, 0, 0, 0.88)';
        if (zoneLevel === 0 || [38, 68, 96, 102].includes(zoneLevel)) ambient = 'rgba(0, 0, 10, 0.15)'; 
        else if (zoneLevel <= 37) ambient = 'rgba(5, 5, 20, 0.75)';
        else if (zoneLevel <= 67) ambient = 'rgba(25, 15, 0, 0.70)';
        else if (zoneLevel <= 95) ambient = 'rgba(10, 25, 10, 0.80)';
        else if (zoneLevel <= 101) ambient = 'rgba(35, 5, 0, 0.85)';
        else if (zoneLevel <= 125) ambient = 'rgba(15, 20, 35, 0.75)';
        else if (zoneLevel >= 128 || window.riftLevel > 0) ambient = 'rgba(20, 0, 30, 0.90)';
        renderer.applyLighting(screen.x, screen.y, (baseRadius + flicker) * camera.zoom, ambient);
    }

    camera.reset(renderer.ctx);
    updateHud();
    if (timestamp - lastSaveTime > 30000 && activeSlotId) { lastSaveTime = timestamp; saveGame(); addCombatLog('Progress Saved.', 'log-info'); }
    
    renderMinimap();
    if (showFullMap) renderFullMap();

    requestAnimationFrame(gameLoop);
}
